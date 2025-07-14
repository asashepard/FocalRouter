export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export const callLLM = (
    prov: "openai" | "google" | "mistral",
    model: string,
    msgs: ChatMessage[],
    keys: Record<string, string>
): Promise<string> => {
    switch (prov) {
        case "openai":
            return openai(model, msgs, keys.openai);
        case "google":
            return google(model, msgs, keys.google);
        case "mistral":
            return mistral(model, msgs, keys.mistral);
        default:
            return Promise.reject(new Error("Unsupported provider"));
    }
};

const openai = async (
    model: string,
    msgs: ChatMessage[],
    key?: string
): Promise<string> => {
    if (!key) throw new Error("OpenAI key missing");
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ model, messages: msgs })
    });
    if (!r.ok) throw new Error(`OpenAI HTTP ${r.status}`);
    const j = await r.json();
    return j.choices[0].message.content as string;
};

const google = async (
    m: string,
    msgs: ChatMessage[],
    key?: string
): Promise<string> => {
    if (!key?.trim()) throw new Error("Google key missing");

    // Convert to Gemini's "contents" schema
    const contents = msgs.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
    }));

    const url =
        `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(
            m
        )}:generateContent?key=${encodeURIComponent(key)}`;

    const body = JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 1024 }
    });

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google HTTP ${res.status}: ${errText.slice(0, 120)}`);
    }

    const j = await res.json();

    /* ────── robust text extractor ────── */
    const getText = (obj: any): string | null => {
        if (!obj) return null;
        if (typeof obj === "string") return obj;
        if (Array.isArray(obj)) {
            for (const x of obj) {
                const t = getText(x);
                if (t) return t;
            }
        } else if (typeof obj === "object") {
            if (typeof obj.text === "string") return obj.text;
            for (const k of Object.keys(obj)) {
                const t = getText(obj[k]);
                if (t) return t;
            }
        }
        return null;
    };

    const text = getText(j.candidates?.[0]);

    if (text) return text;
    throw new Error("Google API did not return a valid response");
};

const mistral = async (
    model: string,
    msgs: ChatMessage[],
    key?: string
): Promise<string> => {
    if (!key) throw new Error("Mistral key missing");
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ model, messages: msgs })
    });
    if (!r.ok) throw new Error(`Mistral HTTP ${r.status}`);
    const j = await r.json();
    return j.choices[0].message.content as string;
};
