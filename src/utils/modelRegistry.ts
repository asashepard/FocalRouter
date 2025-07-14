export interface ModelInfo {
    name: string;
    provider: "openai" | "google" | "mistral";
    contextSize: number;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
    intelligenceScore: number;
}

export const MODEL_REGISTRY: ModelInfo[] = [
    {
        name: "gpt-4o",                  // unchanged
        provider: "openai",
        contextSize: 128_000,
        inputPricePerMillion: 2.5,       // $0.0025 / 1K  →  $2.5 / 1M :contentReference[oaicite:0]{index=0}
        outputPricePerMillion: 10,
        intelligenceScore: 0.50
    },
    {
        name: "gpt-4.1",
        provider: "openai",
        contextSize: 128_000,
        inputPricePerMillion: 2.0,       // :contentReference[oaicite:1]{index=1}
        outputPricePerMillion: 8.0,
        intelligenceScore: 0.55
    },
    {
        name: "gpt-4.1-mini",
        provider: "openai",
        contextSize: 128_000,
        inputPricePerMillion: 0.40,      // :contentReference[oaicite:2]{index=2}
        outputPricePerMillion: 1.6,
        intelligenceScore: 0.47
    },
    {
        name: "gpt-4.1-nano",
        provider: "openai",
        contextSize: 128_000,
        inputPricePerMillion: 0.10,      // :contentReference[oaicite:3]{index=3}
        outputPricePerMillion: 0.4,
        intelligenceScore: 0.40
    },

    /* ────────── Google Gemini (v1 endpoints) ────────── */
    {
        name: "gemini-2.5-pro",
        provider: "google",
        contextSize: 2_000_000,          // breakthrough 2 M-token window :contentReference[oaicite:4]{index=4}
        inputPricePerMillion: 1.25,
        outputPricePerMillion: 5.0,
        intelligenceScore: 0.52
    },
    {
        name: "gemini-2.5-flash",
        provider: "google",
        contextSize: 1_000_000,          // 1 M window :contentReference[oaicite:5]{index=5}
        inputPricePerMillion: 0.30,
        outputPricePerMillion: 2.5,
        intelligenceScore: 0.43
    },
    /* keep the 1.5-series for compatibility / longer context             */
    {
        name: "gemini-1.5-pro",
        provider: "google",
        contextSize: 2_000_000,
        inputPricePerMillion: 1.25,      // same price tier as 2.5 Pro :contentReference[oaicite:6]{index=6}
        outputPricePerMillion: 5.0,
        intelligenceScore: 0.45
    },
    {
        name: "gemini-1.5-flash",
        provider: "google",
        contextSize: 1_000_000,
        inputPricePerMillion: 0.375,     // 0.0375 ¢ / 1000 tokens rounded ↑ to / M :contentReference[oaicite:7]{index=7}
        outputPricePerMillion: 1.5,
        intelligenceScore: 0.39
    },

    /* ────────── Mistral ────────── */
    {
        name: "mistral-tiny",
        provider: "mistral",
        contextSize: 16_000,
        inputPricePerMillion: 0,
        outputPricePerMillion: 0,
        intelligenceScore: 0.28
    }
];

export const blendedPrice = (m: ModelInfo) =>
    (3 * m.inputPricePerMillion + m.outputPricePerMillion) / 4;

export const filterByContext = (min: number) =>
    MODEL_REGISTRY.filter((m) => m.contextSize >= min);
