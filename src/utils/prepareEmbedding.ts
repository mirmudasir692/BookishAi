const prepareEmbedding = (
  chunks: { text: string }[],
  embeddings: number[][]
): { text: string; embedding: number[] }[] => {
  return chunks.map((chunk, index) => {
    const vec = embeddings[index];
    return {
      text: chunk.text,
      embedding: vec,
    };
  });
};

export { prepareEmbedding };
