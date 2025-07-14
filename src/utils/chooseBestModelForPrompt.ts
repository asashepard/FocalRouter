import {
  blendedPrice,
  filterByContext,
  MODEL_REGISTRY,
  ModelInfo
} from "./modelRegistry";
import { classifyTask } from "./classifyTask";
import { queryRouterLLM } from "./routerLLM";

type StepId = "classifier" | "llm" | "cheapest";

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

  const order: StepId[] =
    JSON.parse(localStorage.getItem("routingOrder") || "[]") || [
      "classifier",
      "llm",
      "cheapest"
    ];

  for (const step of order) {
    if (cands.length === 1) break;

    if (step === "classifier") {
      const [task, conf] = classifyTask(prompt);
      steps.push(`Classifier → '${task}' (${conf})`);
      // (classification result currently advisory only)
    }

    if (step === "llm" && apiKeys.mistral && cands.length > 1) {
      try {
        steps.push("Router LLM step");
        const pick = await queryRouterLLM(
          cands.map((c) => c.name),
          prompt,
          apiKeys.mistral
        );
        const sel = cands.find((c) => c.name === pick);
        if (sel) return [sel, [...steps, `Router chose: ${pick}`]];
      } catch (e: any) {
        steps.push(`Router LLM failed: ${e.message}`);
      }
    }

    if (step === "cheapest" && cands.length > 1) {
      cands.sort((a, b) => blendedPrice(a) - blendedPrice(b));
      steps.push("Cheapest step");
      return [cands[0], steps];
    }
  }

  // fallback
  steps.push("Fallback first candidate");
  return [cands[0], steps];
};
