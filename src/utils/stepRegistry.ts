export type StepCat = "filter" | "rank" | "decide";

export interface StepMeta {
  id: string;
  label: string;
  cat: StepCat;
}

export const STEP_CATALOG: StepMeta[] = [
  { id: "classifier", label: "Basic Classifier", cat: "filter" },
  { id: "bandit", label: "Monte-Carlo Bandit", cat: "rank" },
  { id: "score", label: "Score Rank", cat: "rank" },
  { id: "llm", label: "LLM Router", cat: "decide" },
  { id: "pareto", label: "Pareto Optimizer", cat: "decide" },
  { id: "cheapest", label: "Cheapest Fallback", cat: "decide" },
  { id: "complexity", label: "Complexity Filter", cat: "filter" },
  { id: "thrift", label: "Thrift Decide", cat: "decide" },
];

export const DEFAULT_PIPELINE = ["classifier", "complexity", "bandit", "pareto"];
