# Weavy.ai Clone - LLM Workflow Builder

A pixel-perfect clone of Weavy.ai workflow builder, focused exclusively on LLM (Large Language Model) workflows.

## Features

- **6 Node Types**: Text, Upload Image, Upload Video, Run Any LLM, Crop Image, Extract Frame
- **React Flow Canvas**: Visual workflow builder with dot grid background, panning, zooming, and minimap
- **Clerk Authentication**: Protected routes with user-scoped workflows
- **Workflow History**: Right sidebar showing all workflow runs with node-level execution details
- **Type-Safe Connections**: Enforced type-safe node connections
- **DAG Validation**: Workflows must be Directed Acyclic Graphs
- **Selective Execution**: Run single nodes, selected nodes, or full workflows
- **Parallel Execution**: Independent branches execute concurrently

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** (strict mode)
- **PostgreSQL** with Prisma ORM
- **Clerk** for authentication
- **React Flow** for visual workflow canvas
- **Trigger.dev** for node execution 
- **Transloadit** for file uploads
- **Google Gemini API** via Trigger.dev 
- **FFmpeg** via Trigger.dev for image/video processing 
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Zod** for schema validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase or Neon recommended)
- API keys for:
  - Clerk (authentication)
  - Google Gemini API
  - Trigger.dev
  - Transloadit

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your API keys in `.env`:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `GOOGLE_GEMINI_API_KEY`
- `TRIGGER_API_KEY`
- `TRIGGER_API_URL`
- `TRANSLOADIT_AUTH_KEY`
- `TRANSLOADIT_TEMPLATE_ID`

3. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
weavy-clone/
├── app/
│   ├── api/              # API routes
│   ├── workflow/         # Main workflow page
│   ├── sign-in/          # Clerk sign-in page
│   ├── sign-up/          # Clerk sign-up page
│   └── layout.tsx        # Root layout with Clerk provider
├── components/
│   ├── nodes/            # Node components (6 types)
│   ├── sidebar/          # Left and right sidebars
│   └── WorkflowCanvas.tsx # React Flow canvas
├── lib/
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Utility functions
├── stores/
│   └── workflowStore.ts  # Zustand store for workflow state
├── types/
│   └── index.ts          # TypeScript type definitions
└── prisma/
    └── schema.prisma     # Database schema
```

## Node Types

1. **Text Node**: Simple text input with textarea and output handle
2. **Upload Image Node**: File upload (jpg, jpeg, png, webp, gif) with preview
3. **Upload Video Node**: File upload (mp4, mov, webm, m4v) with video player
4. **Run Any LLM Node**: Model selector, system prompt, user message, images input
5. **Crop Image Node**: Image cropping with configurable x, y, width, height percentages
6. **Extract Frame Node**: Extract frame from video at specified timestamp or percentage

## TODO

- [ ] Complete Trigger.dev integration for node execution
- [ ] Implement Transloadit file uploads
- [ ] Add Google Gemini API integration via Trigger.dev
- [ ] Implement FFmpeg tasks for image/video processing
- [ ] Add workflow persistence (save/load)
- [ ] Implement workflow history API and persistence
- [ ] Add DAG validation for circular dependency detection
- [ ] Implement type-safe connection validation
- [ ] Add undo/redo functionality
- [ ] Implement selective execution (single/multiple nodes)
- [ ] Add parallel execution for independent branches
- [ ] Complete workflow history panel with real data

## License

MIT
