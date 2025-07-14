import {
    blendedPrice,
    filterByContext,
    MODEL_REGISTRY,
    ModelInfo
} from "./modelRegistry";
import { classifyTask } from "./classifyTask";
import { queryRouterLLM } from "./routerLLM";
import { DEFAULT_PIPELINE, STEP_CATALOG } from "./stepRegistry";
import { banditRank, paretoSelect, banditUpdate } from "./routeAlgorithms";

type StepId = "classifier" | "llm" | "cheapest";

const metaById = Object.fromEntries(
    STEP_CATALOG.map((m) => [m.id, m] as const)
);

/** returns [chosenModel, stepsTaken[]] */
export const chooseBestModelForPrompt = async (
    prompt: string,
    apiKeys: Record<string, string>,
    cap: number | null = null
): Promise<[ModelInfo, string[]]> => {
    const steps: string[] = [];
    const toks = Math.floor(prompt.length / 4);
    steps.push(`Estimated tokens: ${toks}`);

    /* ------------------ key-based filter ------------------ */
    const activeProviders = Object.entries(apiKeys)
        .filter(([_, key]) => key?.trim())
        .map(([prov]) => prov);

    let cands = filterByContext(toks);

    if (activeProviders.length > 0) {
        const before = cands.length;
        cands = cands.filter((m) => activeProviders.includes(m.provider));
        steps.push(
            `Provider key filter (${activeProviders.join(", ")}) ` +
            `${before} → ${cands.length}`
        );
    } else {
        steps.push("No keys present → provider filter skipped");
    }
    /* ------------------------------------------------------ */

    if (cap !== null) {
        const before = cands.length;
        cands = cands.filter((m) => blendedPrice(m) <= cap);
        steps.push(`Price ≤ ${cap}: ${before} → ${cands.length}`);
    }

    if (cands.length === 0) {
        throw new Error("No eligible models (check keys or constraints)");
    }

    const pipeline: string[] =
        JSON.parse(localStorage.getItem("routingOrder") || "null") ??
        DEFAULT_PIPELINE;

    /* validate pipeline: must be filter* → rank* → decide+ */
    const cats = pipeline.map((id) => metaById[id]?.cat || "decide");
    if (!/^(filter)*(rank)*(decide)+$/.test(cats.join(""))) {
        throw new Error("Invalid routing pipeline: Must be filter* → rank* → decide*");
    }

    for (const id of pipeline) {
        const cat = metaById[id].cat;

        if (cat === "filter") {
            if (id === "complexity") {
                const hard = prompt.length > 240 || /code|proof|integral|derive/i.test(prompt);
                if (hard) {
                    const before = cands.length;
                    cands = cands.filter(
                        (m) => m.intelligenceScore >= 0.40 && m.contextSize >= toks * 2
                    );
                    steps.push(`Complexity filter ${before}→${cands.length}`);
                } else {
                    steps.push("Complexity filter skipped (easy prompt)");
                }
            }
            const [task] = classifyTask(prompt);
            steps.push(`Classifier: ${task}`);
            continue; // only annotates for now
        }

        if (cat === "rank") {
            if (id === "bandit") {
                cands = banditRank(cands, "global");
                steps.push(`Bandit → top ${cands.length}`);
            }
            continue;
        }

        /* decide layer */
        if (id === "pareto") {
            const pick = paretoSelect(cands);
            steps.push("Pareto choose");
            return [pick, steps];
        }
        if (id === "thrift") {
            const bestIQ = Math.max(...cands.map((m) => m.intelligenceScore));
            const minPriceAmongGood = Math.min(
                ...cands
                    .filter((m) => m.intelligenceScore >= 0.95 * bestIQ)
                    .map(blendedPrice)
            );
            const pick = cands.find(
                (m) =>
                    m.intelligenceScore >= 0.95 * bestIQ &&
                    blendedPrice(m) === minPriceAmongGood
            );
            if (pick) return [pick, [...steps, "Thrift choose"]];
        }
        if (id === "llm" && apiKeys.mistral) {
            try {
                const pick = await queryRouterLLM(
                    cands.map((c) => c.name),
                    prompt,
                    apiKeys.mistral
                );
                const sel = cands.find((c) => c.name === pick);
                if (sel) return [sel, [...steps, "LLM choose"]];
            } catch { /* fall through */ }
        }
        if (id === "cheapest") {
            cands.sort((a, b) => blendedPrice(a) - blendedPrice(b));
            return [cands[0], [...steps, "Cheapest"]];
        }
    }
    return [cands[0], steps];
};
