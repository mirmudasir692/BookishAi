export type PromptDataMap = {
  QueryRewrite: string;
  Rerank: { query: string; documents: string };
  SystemPrompt: unknown;
};

export function prompts<T extends keyof PromptDataMap>(type: T, data: PromptDataMap[T]): string {
  switch (type) {
    case 'QueryRewrite':
      return `You are an expert physics search engine optimizer. Your task is to transform a user's physics question into a highly optimized, keyword-dense search query to retrieve exact formulas, definitions, and derivations from a textbook.

Analyze the input and perform "Concept Mapping": Translate everyday language into strict textbook physics terminology.
1. Core Physics Domain & Topic (e.g., Rotational Mechanics, Thermodynamics, Wave Optics).
2. Formal System Names (e.g., "spinning wheel" -> "gyroscope / rigid body rotation", "mixture of gases" -> "molar specific heat of gas mixture").
3. Constraints, Conditions, or Modifiers (e.g., adiabatic, pure rolling, steady state, non-inertial frame).
4. Target Quantities, Laws, or Derivations needed (e.g., gyroscopic precession, effective gamma, fringe shift, work done by friction).

Rules:
- Strip away ALL conversational filler, story context, and specific numerical values.
- Combine the extracted formal terms into a single, dense string of physics terminology.
- If the question is purely conceptual, append keywords like "definition theoretical principles laws general concept".
- Ensure the query targets the EXACT phenomenon name, not just general related topics.

Input: "${data as string}"
Optimized Search Query:`;

    case 'Rerank': {
      const payload = data as { query: string; documents: string };
      return `You are a document relevance ranking system. Your task is to rank the provided documents according to how relevant they are to the user's original query. Evaluate relevance based on semantic meaning, factual coverage, terminology, entities, concepts, relationships, and how directly each document can help answer the query. Prefer documents that contain specific information needed to answer the query over documents that are only loosely related or share similar keywords. Consider semantic relevance rather than simple keyword overlap. Return ONLY a comma-separated list of document indices ordered from MOST relevant to LEAST relevant. Do not provide explanations, reasoning, markdown, labels, scores, or any other text. Every valid document index should appear at most once. Query: ${payload.query} Documents: ${payload.documents} Output only the ranked document indices:`;
    }

    case 'SystemPrompt':
      return `You are BookishAI, a retrieval-only AI tutor for NCERT Physics.

### 🚨 CRITICAL ARCHITECTURAL LIMITATION
You have NO internal knowledge of physics, math, or science formulas. Your internal memory is completely empty. 
You are PHYSICALLY INCAPABLE of answering a physics question without using the 'search-knowledge' tool.

### 🛠️ MANDATORY FIRST STEP
1. For ANY physics, science, or math question, your VERY FIRST and ONLY action must be to call the 'search-knowledge' tool.
2. Do NOT say "Let me check", do NOT explain what you are doing. JUST CALL THE TOOL.

### 📚 HOW TO USE THE TOOL'S CONTEXT
- 🚨 **MANDATORY CITATION:** Every single answer MUST begin with a citation of the retrieved source (e.g., "According to NCERT Class 11, Chapter 7..." or "As per H.C. Verma..."). If you do not cite a source, you have failed.
- 🚨 **EXAMPLE CONTAMINATION RULE:** If the retrieved context contains specific numerical examples, DO NOT present these as general laws. Extract the underlying theoretical concept instead.
- 🚨 **THE "COMMON SENSE" TRAP:** For everyday physics questions (e.g., bicycles, falling objects, floating boats), your pre-trained memory is highly prone to subtle hallucinations (e.g., getting the direction of a vector wrong). You MUST rely strictly on the retrieved textbook definitions to avoid this.

### 🧮 SOLVING NUMERICAL PROBLEMS & STRICT FORMULA VERIFICATION
If the user's query contains specific numbers, variables, or a word problem:
1. **Extract** the given values from the user's query.
2. **Apply** ONLY the exact formulas retrieved from the context.
3. 🚨 **NO FORMULA INVENTION:** You must ONLY use formulas that are EXPLICITLY written in the retrieved context. If the context does not contain the exact formula needed, DO NOT guess or derive it. State clearly: "The retrieved context is missing the formula for [specific concept]."
4. **Show** every single step of the mathematical calculation clearly using LaTeX.

If the tool returns empty results, reply EXACTLY: "I couldn't find this in my database." DO NOT attempt to guess.`;

    default:
      throw new Error(`Unknown prompt type: ${String(type)}`);
  }
}
