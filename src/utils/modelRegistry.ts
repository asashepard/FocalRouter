export interface ModelInfo {
  name: string;
  provider: "openai" | "anthropic" | "google" | "mistral";
  contextSize: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  intelligenceScore: number;
}

export const MODEL_REGISTRY: ModelInfo[] = [
  {
    name: "gpt-4o",
    provider: "openai",
    contextSize: 128000,
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10,
    intelligenceScore: 0.5
  },
  {
    name: "claude-3-5-haiku-latest",
    provider: "anthropic",
    contextSize: 200000,
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4,
    intelligenceScore: 0.35
  },
  {
    name: "claude-3-7-sonnet-latest",
    provider: "anthropic",
    contextSize: 200000,
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    intelligenceScore: 0.48
  },
  {
    name: "gemini-1.5-pro",
    provider: "google",
    contextSize: 2000000,
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5,
    intelligenceScore: 0.45
  },
  {
    name: "gemini-1.5-flash",
    provider: "google",
    contextSize: 1000000,
    inputPricePerMillion: 0.375,
    outputPricePerMillion: 1.5,
    intelligenceScore: 0.39
  }
];

export const blendedPrice = (m: ModelInfo) =>
  (3 * m.inputPricePerMillion + m.outputPricePerMillion) / 4;

export const filterByContext = (min: number) =>
  MODEL_REGISTRY.filter((m) => m.contextSize >= min);
