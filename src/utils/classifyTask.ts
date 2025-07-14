export type TaskLabel = "coding" | "creative" | "summarize" | "math" | "fast" | "general" | "unclear";
export type Confidence = "low" | "medium" | "high";

export const classifyTask = (p: string): [TaskLabel, Confidence] => {
  const map = {
    coding: /\b(code|debug|python|function|algorithm)\b/gi,
    creative: /\b(story|poem|novel|essay|creative)\b/gi,
    summarize: /\b(summarize|digest|report|summary)\b/gi,
    math: /\b(math|prove|equation|solve|theorem|integral|derivative)\b/gi,
    fast: /\b(quick|fast|asap|immediately|low latency)\b/gi,
    general: /\b(who|what|when|where|why|how|\?)\b/gi
  };
  let best: TaskLabel = "unclear",
    max = 0;
  Object.entries(map).forEach(([k, r]) => {
    const c = (p.match(r) || []).length;
    if (c > max) {
      best = k as TaskLabel;
      max = c;
    }
  });
  const conf = max >= 2 ? "high" : max === 1 ? "medium" : "low";
  if (conf === "low") best = "unclear";
  return [best, conf];
};
