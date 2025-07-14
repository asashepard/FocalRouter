import React, { useState } from "react";

interface Entry {
  ts: number;          // epoch ms
  percent: number;     // 0–100
  correct: number;
  total: number;
  seed: number;
  n: number;
}

const KEY = "mmluLeaderboard";

export const pushEntry = (e: Entry) => {
  const arr: Entry[] = JSON.parse(localStorage.getItem(KEY) || "[]");
  arr.push(e);
  arr.sort((a, b) => b.percent - a.percent);
  localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 3)));
};

export default function Leaderboard() {
  const [open, setOpen] = useState(false);
  const list: Entry[] = JSON.parse(localStorage.getItem(KEY) || "[]");

  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ marginBottom: 6 }}
      >
        {open ? "Hide" : "Show"} Leaderboard
      </button>
      {open && (
        <table style={{ width: "100%", fontSize: 13 }}>
          <thead>
            <tr>
              <th>Score</th>
              <th>Seed</th>
              <th>N</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e, i) => (
              <tr key={i}>
                <td>{e.percent}%</td>
                <td>{e.seed}</td>
                <td>{e.n}</td>
                <td>
                  {new Date(e.ts).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric"
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
