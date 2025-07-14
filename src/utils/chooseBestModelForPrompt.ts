import {
  blendedPrice,
  filterByContext,
  MODEL_REGISTRY,
  ModelInfo
} from "./modelRegistry";
import { classifyTask } from "./classifyTask";
import { queryRouterLLM } from "./routerLLM";

export const chooseBestModelForPrompt = async (
  prompt: string,
  apiKeys: Record<string, string>,
  cap: number | null = null
): Promise<[ModelInfo, string[]]> => {
  const steps: string[] = [];
  const toks = Math.floor(prompt.length / 4);
  steps.push(`Estimated tokens: ${toks}`);

  let cands = filterByContext(toks);
  steps.push(`After context filter: ${cands.length} candidates`);

  if (cap !== null) {
    const before = cands.length;
    cands = cands.filter((m) => blendedPrice(m) <= cap);
    steps.push(`Price ≤ ${cap}: ${before} → ${cands.length}`);
  }

  if (!cands.length) {
    const fb = MODEL_REGISTRY.find(
      (m) => m.name === "gemini-1.5-pro"
    ) as ModelInfo;
    steps.push("Fallback → gemini-1.5-pro");
    return [fb, steps];
  }

  const [task, conf] = classifyTask(prompt);
  steps.push(`Task '${task}' (${conf})`);

  if (cands.length === 1) return [cands[0], steps];

  if (apiKeys?.mistral) {
    try {
      steps.push("Querying router LLM");
      const pick = await queryRouterLLM(
        cands.map((c) => c.name),
        prompt,
        apiKeys.mistral
      );
      const sel = cands.find((c) => c.name === pick);
      if (sel) return [sel, [...steps, `Router chose: ${pick}`]];
    } catch (e: any) {
      steps.push(`Router failed: ${e.message}`);
    }
  }

  cands.sort((a, b) => blendedPrice(a) - blendedPrice(b));
  steps.push("Fallback → cheapest");
  return [cands[0], steps];
};
