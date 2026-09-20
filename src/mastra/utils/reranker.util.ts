export function cosineSimilarity(
  queryEmbedding: number[] | Float32Array,
  documentEmbedding: number[] | Float32Array
): number {
  if (queryEmbedding.length !== documentEmbedding.length) {
    throw new Error(
      `Embedding dimension mismatch: query=${queryEmbedding.length}, document=${documentEmbedding.length}`
    );
  }

  let dotProduct = 0;
  let queryMagnitude = 0;
  let documentMagnitude = 0;

  for (let i = 0; i < queryEmbedding.length; i++) {
    const q = queryEmbedding[i];
    const d = documentEmbedding[i];

    dotProduct += q * d;
    queryMagnitude += q * q;
    documentMagnitude += d * d;
  }

  if (queryMagnitude === 0 || documentMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(documentMagnitude));
}
