export interface CsvQ {
  prompt: string;
  A: string;
  B: string;
  C: string;
  D: string;
  answer: string; // single letter A-D
}

/*  ▸ reliably parses RFC-4180 CSV
    ▸ discards rows that don’t have 6 cells or bad answer            */
export const loadCsv = async (csvName: string): Promise<CsvQ[]> => {
  const res = await fetch(`${process.env.PUBLIC_URL}/testdata/${csvName}.csv`);
  if (!res.ok) throw new Error(`HTTP ${res.status} loading ${csvName}.csv`);
  const text = await res.text();

  const out: CsvQ[] = [];
  let row: string[] = [];
  let cur = "";
  let inQuote = false;

  const pushCell = () => {
    row.push(cur);
    cur = "";
  };
  const pushRow = () => {
    if (row.length >= 6) {
      const [prompt, A, B, C, D, ans] = row;
      const letter = ans.trim().toUpperCase()[0];
      if ("ABCD".includes(letter)) {
        out.push({ prompt, A, B, C, D, answer: letter });
      }
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && text[i + 1] === '"') {
      cur += '"';
      i++;
    } else if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      pushCell();
    } else if ((ch === "\n" || ch === "\r") && !inQuote) {
      // finish cell, maybe push row
      pushCell();
      if (ch === "\r" && text[i + 1] === "\n") i++; // swallow CRLF
      pushRow();
    } else {
      cur += ch;
    }
  }
  // last row
  pushCell();
  pushRow();

  if (out.length === 0) throw new Error("CSV contained no valid rows");
  return out;
};
