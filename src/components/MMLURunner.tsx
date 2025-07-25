import React, { useState } from "react";
import { loadCsv, CsvQ } from "../utils/loadCsv";
import { sampleWithSeed } from "../utils/seedTools";
import { chooseBestModelForPrompt } from "../utils/chooseBestModelForPrompt";
import { callLLM } from "../utils/providerCalls";
import { pushEntry } from "./Leaderboard";
import { MODEL_REGISTRY } from "../utils/modelRegistry";

type State = "idle" | "running" | "done" | "fail";

export default function MMLURunner() {
    const [dataset, setDataset] = useState<CsvQ[] | null>(null);
    const [state, setState] = useState<State>("idle");
    const [log, setLog] = useState<string[]>([]);
    const [idx, setIdx] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [seed, setSeed] = useState<number>(() =>
        Math.floor(Math.random() * 9_999_999)
    );
    const [n, setN] = useState(10);

    const append = (line: string) =>
        setLog((prev) => [...prev.slice(-199), line]); // cap log

    const run = async () => {
        try {
            setState("running");
            setLog([]);
            setIdx(0);
            setCorrect(0);

            append("Loading CSV…");
            const all = dataset ?? (await loadCsv("mmlu"));
            setDataset(all);
            if (n < 1 || n > all.length) throw new Error("Invalid N");

            const sample = sampleWithSeed(all, n, seed);
            const keys = JSON.parse(localStorage.getItem("apiKeys") || "{}");
            const g4o = MODEL_REGISTRY.find((m) => m.name === "gpt-4o")!;

            let correctCnt = 0;
            let costActual = 0;
            let cost4o = 0;

            for (let i = 0; i < sample.length; i++) {
                setIdx(i);
                const q = sample[i];

                const prompt =
                    q.prompt +
                    "\n\n" +
                    ["A", "B", "C", "D"]
                        .map((k) => `${k}. ${q[k as keyof CsvQ]}`)
                        .join("\n") +
                    "\n\nRespond **only** with one of the letters A, B, C, or D. No explanation.";

                const [modelInfo] = await chooseBestModelForPrompt(prompt, keys);
                const resp = await callLLM(
                    modelInfo.provider,
                    modelInfo.name,
                    [{ role: "user", content: prompt }],
                    keys
                );

                const mapResponseToLetter = (resp: string, q: CsvQ): string | null => {
                    const clean = resp.trim().toUpperCase();
                    // 1. first char A-D?
                    if (/^[ABCD]$/.test(clean[0])) return clean[0];

                    // 2. matches “A.”, “B)”, “(C”, etc.
                    const m = clean.match(/\b([ABCD])[\).]/);
                    if (m) return m[1];

                    // 3. contains the full option text
                    for (const letter of ["A", "B", "C", "D"] as const) {
                        const text = q[letter].toUpperCase().replace(/[^A-Z0-9]/g, " ").trim();
                        if (text && clean.includes(text)) return letter;
                    }
                    return null;
                };

                /* --- scoring --- */
                const letter = mapResponseToLetter(resp, q);
                const ok = letter === q.answer;
                if (ok) correctCnt++;

                /* --- cost --- */
                const tok = Math.round((prompt.length + resp.length) / 4);
                const price = (modelInfo.inputPricePerMillion + modelInfo.outputPricePerMillion) / 2;
                const price4o = (g4o.inputPricePerMillion + g4o.outputPricePerMillion) / 2;

                costActual += (tok * price) / 1_000_000;
                cost4o += (tok * price4o) / 1_000_000;

                setCorrect(correctCnt); // live UI

                append(
                    `${i + 1}/${n} ${ok ? "✓" : "✗"} (${letter ?? "?"}) via ${modelInfo.name}`
                );
            }

            /* --- summary --- */
            const pct = Math.round((100 * correctCnt) / n);
            const savings = cost4o - costActual;
            const savePct = cost4o ? Math.round((100 * savings) / cost4o) : 0;

            append(
                `Done – score ${correctCnt}/${n} (${pct}%)\n` +
                `Cost: $${costActual.toFixed(4)} | GPT-4o baseline $${cost4o.toFixed(
                    4
                )} | Savings $${savings.toFixed(4)} (${savePct}%)`
            );

            pushEntry({
                ts: Date.now(),
                percent: pct,
                correct: correctCnt,
                total: n,
                seed,
                n
            });
            setState("done");
        } catch (e: any) {
            append("ERROR " + e.message);
            setState("fail");
        }
    };

    return (
        <section>
            <h3 style={{ marginTop: 0 }}>MMLU CSV</h3>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
                <label>
                    Seed&nbsp;
                    <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(+e.target.value || 0)}
                        style={{ width: 90 }}
                    />
                </label>
                &nbsp;&nbsp;
                <label>
                    N&nbsp;
                    <input
                        type="number"
                        value={n}
                        onChange={(e) => setN(+e.target.value || 1)}
                        style={{ width: 60 }}
                    />
                </label>
            </div>
            {state !== "running" && (
                <>
                    <button onClick={run} style={{ marginBottom: 8 }}>
                        Run&nbsp;({n}Q)
                    </button>
                    <div>
                        Costs will be incurred based on the models used.
                    </div>
                </>
            )}
            {state === "running" && (
                <div style={{ marginBottom: 8 }}>
                    <div>
                        Q {idx + 1}/{n}
                    </div>
                    <progress value={idx + 1} max={n} style={{ width: "100%" }} />
                </div>
            )}
            <pre
                style={{
                    maxHeight: 260,
                    overflowY: "auto",
                    background: "#f6f6f6",
                    padding: 6,
                    borderRadius: 4,
                    fontSize: 12
                }}
            >
                {log.join("\n")}
            </pre>
        </section>
    );
}
