// deterministic PRNG (LCG, 32-bit)
export const makeRng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
};

export const sampleWithSeed = <T,>(
  arr: T[],
  k: number,
  seed: number
): T[] => {
  const rng = makeRng(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, k);
};
