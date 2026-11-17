export const MAX_RESUME_TEXT_CHARS = 30_000;
export const MAX_RESUME_CHUNKS = 48;
export const MAX_RESUME_CHUNK_CHARS = 1_800;
export const MAX_RESUME_CHUNK_TOTAL_CHARS = 40_000;

const CHUNK_TARGET_CHARS = 1_500;
const OVERLAP_WORDS = 25;

const STOP_WORDS = new Set([
  "about", "after", "again", "also", "and", "are", "been", "before",
  "being", "but", "can", "could", "did", "does", "for", "from", "had",
  "has", "have", "her", "him", "his", "how", "into", "its", "more",
  "not", "our", "out", "she", "that", "the", "their", "them", "there",
  "these", "they", "this", "those", "through", "was", "were", "what",
  "when", "where", "which", "who", "will", "with", "would", "you", "your",
]);

export function normalizeResumeText(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkResumeText(text: string): string[] {
  const words = normalizeResumeText(text).split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let currentWords: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    const nextLength = currentLength + (currentWords.length > 0 ? 1 : 0) + word.length;
    if (currentWords.length > 0 && nextLength > CHUNK_TARGET_CHARS) {
      chunks.push(currentWords.join(" "));
      const overlapWords = currentWords.slice(-OVERLAP_WORDS);
      const overlapLength = overlapWords.join(" ").length;
      const canKeepOverlap =
        overlapWords.length === 0 ||
        overlapLength + 1 + word.length <= MAX_RESUME_CHUNK_CHARS;
      currentWords = canKeepOverlap ? overlapWords : [];
      currentLength = currentWords.join(" ").length;
    }

    if (word.length > MAX_RESUME_CHUNK_CHARS) continue;
    currentLength += (currentWords.length > 0 ? 1 : 0) + word.length;
    currentWords.push(word);
  }

  if (currentWords.length > 0) {
    chunks.push(currentWords.join(" "));
  }

  return chunks.slice(0, MAX_RESUME_CHUNKS);
}

export function isValidResumeChunks(value: unknown): value is string[] {
  if (!Array.isArray(value) || value.length > MAX_RESUME_CHUNKS) return false;

  let totalLength = 0;
  for (const chunk of value) {
    if (
      typeof chunk !== "string" ||
      chunk.trim().length === 0 ||
      chunk.length > MAX_RESUME_CHUNK_CHARS
    ) {
      return false;
    }

    totalLength += chunk.length;
    if (totalLength > MAX_RESUME_CHUNK_TOTAL_CHARS) return false;
  }

  return true;
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? []).filter(
    (term) => !STOP_WORDS.has(term) && !/^\d+$/.test(term)
  );
}

export function retrieveResumeChunks(
  chunks: string[],
  query: string,
  limit = 3
): string[] {
  if (chunks.length === 0) return [];

  const queryTerms = [...new Set(tokenize(query))].slice(0, 80);
  if (queryTerms.length === 0) return chunks.slice(0, limit);

  const ranked = chunks
    .map((chunk, index) => {
      const termCounts = new Map<string, number>();
      for (const term of tokenize(chunk)) {
        termCounts.set(term, (termCounts.get(term) ?? 0) + 1);
      }

      const score = queryTerms.reduce((total, term) => {
        const count = termCounts.get(term) ?? 0;
        return total + (count > 0 ? 1 + Math.log1p(Math.min(count, 3)) : 0);
      }, 0);

      return { chunk, index, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .sort((left, right) => left.index - right.index);

  return ranked.length > 0
    ? ranked.map((item) => item.chunk)
    : chunks.slice(0, limit);
}
