import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { chooseBestModelForPrompt } from "../utils/chooseBestModelForPrompt";
import { callLLM, ChatMessage } from "../utils/providerCalls";
import { ModelInfo } from "../utils/modelRegistry";

type HistoryItem = {
    sender: "user" | "assistant";
    text: string;
    model?: string;
    steps?: string;
    estimated_tokens?: number;
    query_cost_usd?: number;
};

const SEED: HistoryItem[] = [
    {
        sender: "assistant",
        text:
            "How can I help you today?"
    }
];

export default function DemoChat() {
    const [msgs, setMsgs] = useState<HistoryItem[]>(() => {
        try {
            const stored = JSON.parse(
                localStorage.getItem("demoChatMessages") || "[]"
            ) as HistoryItem[];
            return stored.length ? stored : SEED;
        } catch {
            return SEED;
        }
    });
    const [prompt, setPrompt] = useState("");
    const [busy, setBusy] = useState(false);
    const [needKeys, setNeedKeys] = useState(false);
    const endRef = useRef<HTMLDivElement | null>(null);
    const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({});

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [msgs]);

    useEffect(() => {
        localStorage.setItem("demoChatMessages", JSON.stringify(msgs));
    }, [msgs]);

    const apiKeys: Record<string, string> = JSON.parse(
        localStorage.getItem("apiKeys") || "{}"
    );

    const send = async () => {
        if (!prompt.trim()) return;

        const userMsg: HistoryItem = { sender: "user", text: prompt };
        const history = [...msgs, userMsg];
        setMsgs(history);
        setPrompt("");
        setBusy(true);

        try {
            const conv: ChatMessage[] = history.map((m) => ({
                role: m.sender,
                content: m.text
            }));

            const [modelInfo, steps] = (await chooseBestModelForPrompt(
                prompt,
                apiKeys
            )) as [ModelInfo, string[]];

            const reply = await callLLM(
                modelInfo.provider,
                modelInfo.name,
                conv,
                apiKeys
            );

            const tok = Math.floor((prompt.length + reply.length) / 4);
            const cost =
                (tok *
                    (modelInfo.inputPricePerMillion +
                        modelInfo.outputPricePerMillion)) /
                (2 * 1_000_000);

            setMsgs((prev) => [
                ...prev,
                {
                    sender: "assistant",
                    text: reply,
                    model: modelInfo.name,
                    steps: steps.join(" → "),
                    estimated_tokens: tok,
                    query_cost_usd: cost
                }
            ]);
        } catch (e: any) {
            setMsgs((prev) => [
                ...prev,
                { sender: "assistant", text: `Error: ${e.message}` }
            ]);
            if (e.message.includes("key")) setNeedKeys(true);
        } finally {
            setBusy(false);
        }
    };

    const saveKeys = () => {
        const fields = ["openai", "google", "mistral"] as const;
        const obj: Record<string, string> = {};
        fields.forEach((f) => {
            const el = document.getElementById(`k-${f}`) as HTMLInputElement | null;
            obj[f] = el?.value.trim() || "";
        });
        localStorage.setItem("apiKeys", JSON.stringify(obj));
        setNeedKeys(false);
    };

    const onEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Router Chat</div>
            <div style={{ height: 400, overflowY: "auto", marginBottom: 8 }}>
                {msgs.map((m, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                        <div
                            style={{
                                textAlign: m.sender === "user" ? "right" : "left"
                            }}
                        >
                            <ReactMarkdown>{m.text}</ReactMarkdown>
                            {m.model && (
                                <div
                                    style={{ fontSize: 12, color: "#007aff", cursor: "pointer" }}
                                    onClick={() =>
                                        setOpenSteps((o) => ({ ...o, [i]: !o[i] }))
                                    }
                                >
                                    ({m.model})
                                </div>
                            )}
                        </div>
                        {openSteps[i] && m.steps && (
                            <pre
                                style={{
                                    background: "#f6f6f6",
                                    padding: 6,
                                    borderRadius: 4,
                                    fontSize: 11,
                                    whiteSpace: "pre-wrap"
                                }}
                            >
                                {m.steps}
                            </pre>
                        )}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <textarea
                style={{ width: "100%", height: 60, marginBottom: 8 }}
                value={prompt}
                placeholder="Ask me anything…"
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={onEnter}
            />
            <button onClick={send} disabled={busy}>
                {busy ? "Sending…" : "Send"}
            </button>

            {needKeys && (
                <div style={{ marginTop: 16, border: "1px solid #ccc", padding: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>API Keys</div>
                    {(["openai", "google", "mistral"] as const).map((id) => (
                        <input
                            key={id}
                            id={`k-${id}`}
                            placeholder={`${id} key`}
                            defaultValue={apiKeys[id] || ""}
                            style={{ marginBottom: 6, width: "100%" }}
                        />
                    ))}
                    <button onClick={saveKeys} style={{ marginTop: 8 }}>
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}
