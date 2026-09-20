# BookishAI

BookishAI is an AI tutor and knowledge base system for NCERT Science and Physics (Classes 6-12). Built on top of the Mastra agent framework, LanceDB vector database, Express server, and a Svelte 5 frontend, BookishAI provides contextual retrieval and hallucination-free answers based on structured NCERT textbook data.

## Features

- Hallucination-Free Retrieval: Leverages vector search over pre-processed NCERT Science and Physics content.
- Automatic Dataset Synchronization: Clones pre-indexed vector data from Hugging Face on application startup if local LanceDB data is missing.
- Multi-Query RAG & Fast In-Memory Reranking: Converts input questions into embedding vectors using local models, queries LanceDB chunks, deduplicates candidate documents, and performs fast in-memory cosine similarity reranking (`rerankBySimilarity`) for optimal performance without external model latency.
- Local AI Stack: Integrates with Ollama for offline/local model execution (chat and embeddings).
- Web & Desktop API Interface: Express REST API coupled with a modern Svelte 5 / Vite web interface supporting KaTeX math rendering and markdown formatting.
- Persistent Agent Memory: Mastra LibSQL storage (`agents.db`) for conversation threads, titles, and agent state tracking.

## Technology Stack

- Agent Framework: Mastra Framework (`@mastra/core`)
- LLM and Embedding Models: Ollama
  - Primary Chat Model: `qwen3:1.7b-8k`
  - Light Chat Model: `qwen2.5:0.5b`
  - Embedding Model: `nomic-embed-text`
- Vector Reranking: Fast In-Memory Cosine Similarity (`src/mastra/utils/reranker.ts`)
- Vector Database: LanceDB (`@lancedb/lancedb`)
- Dataset Hosting: Hugging Face Datasets (`mudasir692/bookishai-data`)
- Backend Runtime: Node.js (>= 22.13.0), Express, TypeScript, Zod, Pino, LibSQL (`agents.db`)
- Frontend UI: Svelte 5, SvelteKit, Vite, TailwindCSS (v4), Bits UI, Lucide Svelte, KaTeX

## Architectural Design & Technical Rationale

BookishAI is engineered with a self-contained, high-performance architecture focused on total isolation, maximum execution speed, and zero external cloud service dependencies:

### 1. Unified In-Process Storage Architecture

- **Embedded LanceDB Vector Database**: LanceDB runs **in-process** directly within the Node.js runtime, storing vector indices and document chunks on local disk (`data/lancedb`). This eliminates external database server daemons, network IPC latency, cloud database fees, and third-party API dependencies.
- **In-Process SQLite/LibSQL Agent Memory**: Mastra conversation history, memory state, and thread metadata are stored in LibSQL (`agents.db`) executing inside the same API process. Sharing process space eliminates inter-process context switching and simplifies single-command deployments.
- **Embedded S3-Compatible Asset & PDF Storage (`s3rver`)**: PDF textbook uploads and media assets are managed via an embedded `s3rver` instance initialized **in-process** alongside the Express server (`src/mastra/modules/storage/`). Assets are stored directly on local disk while using standard `@aws-sdk/client-s3` APIs, ensuring complete offline isolation while providing seamless upgrade compatibility for production cloud S3 storage if required.

### 2. Fast In-Memory Cosine Similarity Reranking

- Rather than invoking external cross-encoder model endpoints or heavy neural networks for document re-scoring, candidate chunks retrieved from LanceDB are deduplicated and reranked using fast in-memory cosine vector math (`rerankBySimilarity` in `src/mastra/utils/reranker.ts`).
- This design choice reduces reranking latency to near zero, saves system memory, and allows the entire RAG pipeline to function 100% offline.

### 3. Production-Grade Svelte 5 & SvelteKit Frontend

- Built with **Svelte 5**, SvelteKit, Vite, and TailwindCSS (v4) for reactive, zero-runtime overhead rendering and minimal bundle size.
- Features real-time **KaTeX** math typesetting for NCERT science/physics formulas, Markdown rendering, Lucide iconography, toast notifications, and dynamic dark-mode layouts—delivering a sleek, production-grade interface designed to impress both end-users and technical evaluators.

## Hugging Face Dataset & LanceDB Setup

The vector search capability relies on LanceDB tables stored in `data/lancedb`.

BookishAI includes automatic dataset synchronization (`src/utils/syncData.ts`):

1. Upon initializing Mastra (`src/mastra/index.ts`), the application checks whether the directory `data/lancedb` exists.
2. If `data/lancedb` is absent, the application automatically runs a shallow git clone of the remote Hugging Face dataset repository (`https://huggingface.co/datasets/mudasir692/bookishai-data`) into a temporary workspace.
3. The dataset files are placed into the local `data/` directory and temporary artifacts are removed.
4. Subsequent server starts detect `data/lancedb` and skip the download.

## Project Architecture

```
bookishai/
├── app/                        # Svelte 5 / Vite Frontend Application
│   ├── src/                    # Components, stores, and page routes
│   ├── static/                 # Static web assets
│   └── vite.config.ts          # Vite configuration
├── config/
│   └── env.config.ts           # Environment variable validation via Zod
├── data/
│   └── lancedb/                # Local LanceDB vector database (synced from HF)
├── src/
│   ├── main.ts                 # Express API server entry point
│   ├── mastra/
│   │   ├── agents/             # Agent definitions (BookishAI Agent)
│   │   ├── config/             # Model and provider configurations
│   │   ├── database/           # LanceDB connection and ChunkRepository
│   │   ├── memory/             # Mastra thread memory setup
│   │   ├── modules/agents/     # Express routes, controllers, and services
│   │   ├── storage/            # LibSQL storage (agents.db)
│   │   ├── tools/              # Search knowledge and RAG tools
│   │   ├── types/              # TypeScript interfaces for chunks and vectors
│   │   └── utils/              # Cosine similarity reranker and helper functions
│   └── utils/
│       ├── logger.ts           # Pino logging utility
│       └── syncData.ts         # Hugging Face dataset clone manager
├── package.json                # Project dependencies and workspace scripts
└── tsconfig.json               # TypeScript configuration
```

## Prerequisites

Before setting up BookishAI, ensure you have installed:

1. Node.js (>= 22.13.0)
2. pnpm package manager (`npm install -g pnpm`)
3. Git (required for Hugging Face dataset cloning)
4. Ollama running locally at `http://localhost:11434` with required models pulled:

```shell
ollama pull qwen3:1.7b-8k
ollama pull nomic-embed-text
```

## Installation & Setup

1. Clone the repository:

```shell
git clone https://github.com/mirmudasir692/BookishAi.git
cd BookishAi
```

2. Run the automated environment setup script:

On Linux / macOS / Git Bash:

```shell
./setup
```

On Windows (PowerShell / CMD):

```cmd
.\setup
```

The setup script automatically checks Node.js, installs `pnpm` if needed, installs dependencies, verifies/installs Ollama, starts the Ollama daemon, and pulls/creates all required LLM & embedding models (`qwen3:1.7b-8k`, `qwen2.5:0.5b`, `nomic-embed-text`).

3. Start the application stack:

To run both the backend Express server and the Svelte frontend concurrently:

```shell
pnpm run project
```

Alternatively, you can run services individually:

- Express API Server: `pnpm run server:dev` (runs at http://localhost:3000)
- Svelte Web UI: `pnpm run app:dev` (runs at http://localhost:5173)
- Mastra Studio: `pnpm run dev` (runs at http://localhost:4111)

## Available Scripts

- `pnpm run project`: Starts Express backend server and Svelte frontend concurrently.
- `pnpm run setup`: Runs automated environment setup (`./setup`).
- `pnpm run server:dev`: Starts Express API server with live reload (`tsx watch src/main.ts`).
- `pnpm run server:start`: Starts Express API server in production mode.
- `pnpm run app:dev`: Starts Svelte UI dev server (`vite dev`).
- `pnpm run app:build`: Builds Svelte UI for production.
- `pnpm run app:check`: Runs Svelte type-checking.
- `pnpm run dev`: Launches Mastra CLI development server / Studio (`mastra dev`).
- `pnpm run check`: Executes TypeScript typecheck, ESLint, and Prettier checks.
- `pnpm run typecheck`: Validates TypeScript compilation (`tsc --noEmit`).
- `pnpm run lint`: Runs ESLint code style verification.
- `pnpm run format`: Formats source files using Prettier.

## Verification & Code Quality

Run the check command to verify formatting, linting, and type definitions:

```shell
pnpm run check
```

## License

Apache-2.0
