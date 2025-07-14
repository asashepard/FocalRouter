import { ModelInfo, blendedPrice } from "./modelRegistry";

/* ───── Monte-Carlo Thompson-sampling bandit ───── */
export const banditRank = (
  cands: ModelInfo[],
  seedKey: string
): ModelInfo[] => {
  const storeKey = `bandit-stats-${seedKey}`;
  const stats: Record<string, { s: number; f: number }> = JSON.parse(
    localStorage.getItem(storeKey) || "{}"
  );
  const draws = cands
    .map((m) => {
      const d = stats[m.name] || { s: 1, f: 1 };
      /* Beta(s,f) draw */
      const beta = Math.random() ** (1 / (d.s + d.f));
      return { m, score: beta };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
  /*  keep only first 5 for exploration cost */
  return draws.slice(0, 5);
};

export const banditUpdate = (
  model: string,
  ok: boolean,
  seedKey: string
): void => {
  const key = `bandit-stats-${seedKey}`;
  const stats: Record<string, { s: number; f: number }> = JSON.parse(
    localStorage.getItem(key) || "{}"
  );
  stats[model] = stats[model] || { s: 1, f: 1 };
  ok ? stats[model].s++ : stats[model].f++;
  localStorage.setItem(key, JSON.stringify(stats));
};

/* ───── Pareto knee-point selector ───── */
export const paretoSelect = (cands: ModelInfo[]): ModelInfo => {
  /* scale price & score to [0,1] */
  const pMin = Math.min(...cands.map(blendedPrice));
  const pMax = Math.max(...cands.map(blendedPrice));
  const iMin = Math.min(...cands.map((m) => m.intelligenceScore));
  const iMax = Math.max(...cands.map((m) => m.intelligenceScore));

  const norm = (x: number, a: number, b: number) =>
    b === a ? 0.5 : (x - a) / (b - a);

  return cands
    .map((m) => {
      const p = 1 - norm(blendedPrice(m), pMin, pMax);
      const q = norm(m.intelligenceScore, iMin, iMax);
      /* scalarization with λ = 0.6 */
      return { m, score: 0.6 * q + 0.4 * p };
    })
    .sort((a, b) => b.score - a.score)[0].m;
};

/* ───── quality-price ratio rank ───── */
export const scoreRank = (cands: ModelInfo[]): ModelInfo[] =>
  [...cands]
    .map((m) => ({
      m,
      val: m.intelligenceScore / (blendedPrice(m) + 0.001)
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, Math.max(3, Math.ceil(cands.length / 2))) // keep top half (min 3)
    .map((x) => x.m);