# Trao Interview Kit

An AI-assisted interview preparation platform that turns a job description and company website into a structured, personalized interview preparation kit.

## Live Application

- Frontend: https://trao-interview-kit-gules.vercel.app
- Backend: https://trao-interview-kit.onrender.com

## What it does

A user can:

- Register and log in
- Create an interview preparation kit from a job description
- Provide a company website for research
- Choose the number of preparation days
- Generate a company brief
- Extract role responsibilities and requirements
- Generate interview questions mapped to requirements
- Generate flashcards
- Generate a preparation schedule
- Edit questions and answers
- Add and delete questions
- Reorder questions
- Practice flashcards and record confidence
- Regenerate questions while preserving edited questions
- View requirement coverage

## Architecture

```text
Next.js + Tailwind
        |
        | REST API
        v
Node.js + Express
        |
        +-------------------+
        |                   |
        v                   v
     MongoDB          Research / LLM
                            |
                            v
                     Company websites
                     + LLM generation
```

# Generation Pipeline

The generation pipeline is intentionally split into deterministic and LLM-assisted stages.


## Job Description
```
Job Description
      |
      v
Requirement Extraction
      |
      v
Company Research
      |
      v
Question Generation
      |
      v
Deterministic Coverage Check
      |
      v
Generate Missing Questions
      |
      v
Coverage Check Again
      |
      v
Deterministic Schedule Allocation
      |
      v
Kit Schema Validation
      |
      v
Persist Kit
```

## Why coverage is deterministic
- The LLM generates questions, but it does not decide whether the preparation kit is complete.
  
- Each extracted requirement receives a stable ID. Questions reference the requirement IDs they cover.
  
- The coverage checker then compares:
  - required requirement IDs,
  - requirement IDs referenced by generated questions.
    
- This allows the system to identify uncovered requirements without relying on an LLM judgment.
  
- If required requirements remain uncovered, a second generation pass is performed and coverage is checked again.

## Scheduling
- Schedule allocation is deterministic rather than LLM-generated.
  
- The scheduler receives:
  - requested number of days,
  - generated questions,
  - requirement priorities,
  - question difficulty.
    
- It produces a schedule with:
  - exactly the requested number of days,
  - question IDs referencing existing questions,
  - integer minute allocations,
  - focus for each day.
    
- This keeps the arithmetic and allocation logic predictable and testable.

## Research Pipeline the company's research pipeline:
- Starts from the supplied company URL.
- Retrieves accessible pages.
- Respects robots.txt where applicable.
- Follows relevant same-domain links.
- Ranks links to prioritize useful company/about/careers information.
- Cleans retrieved content before passing it to the generation pipeline.
- Records the pages used by the generated kit.

Unavailable pages are skipped rather than treated as successful research.

External website content is treated as untrusted data and is not treated as application instructions.

## Editing and Regeneration:

The builder allows users to modify generated questions without losing their edits.

Edited question IDs are tracked separately from the generated kit.

When question regeneration is requested, edited questions are preserved while non-edited questions can be regenerated.

The generated kit is validated before being persisted.

## Authentication and Persistence:

The application uses:

-HTTP-only authentication cookies
- JWT-based authentication
- MongoDB for persistent storage
-user ownership checks for interview kits


Each kit is associated with the authenticated user who created it.

## Evaluator
The repository includes the required batch evaluator.
Run:
```
npm run evaluate -- --input cases.json --output kits.json
```

The evaluator:

- accepts multiple input cases
- processes cases independently
- continues after an individual case failure
- writes a versioned JSON output
- records successful and failed cases
-uses the same generation pipeline as the application

Expected input:
```
[
  {
    "id": "test-1",
    "jd": "Frontend Developer with React and TypeScript experience...",
    "company_url": "https://example.com",
    "days": 3
  }
]
```

Expected output:
```
{
  "version": "1.0",
  "generated_at": "...",
  "kits": [
    {
      "id": "test-1",
      "status": "ok",
      "kit": {}
    }
  ]
}
```

## Testing

Deterministic services have focused test scripts covering:

- requirement coverage
- second-pass coverage
- schedule allocation
- extraction
- research
- question generation
- kit generation

Examples:
```
npx tsx src/services/test-coverage.ts
npx tsx src/services/test-coverage-pass.ts
npx tsx src/services/test-schedule.ts
```

## Local Development
# Backend
```
cd backend
npm install
npm run dev
```

# Frontend
```
cd frontend
npm install
npm run dev
```

## Environment Variables

# Backend:

```
PORT=5000
MONGODB_URI=...
JWT_SECRET=...
LLM_API_KEY=...
LLM_MODEL=...
FRONTEND_URL=...
NODE_ENV=development
```

# Frontend:
```
NEXT_PUBLIC_API_URL=...
```

See .env.example files for the required configuration.

## Failure Handling

The application accounts for failures from external services and websites.

Examples include:

-inaccessible company URLs
-unavailable research pages
- LLM rate limits
- transient LLM errors
- invalid generated structures
- incomplete requirement coverage
- invalid input

Transient LLM failures are retried with backoff. Batch evaluation continues after individual case failures.

## Known Limitations

The application depends on external LLM availability and free-tier rate limits. Generation and regeneration can therefore be affected by temporary provider errors or quota limits.

Company research also depends on publicly accessible website content.

## Tech Stack
# Frontend
Next.js
React
TypeScript
Tailwind CSS

# Backend
Node.js
Express
TypeScript
MongoDB / Mongoose
Zod
JWT
Cheerio

# AI / Research
Google Gemini
robots.txt handling
same-domain crawling and link ranking

## Project Structure

```
trao-interview-kit/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   └── evaluate.ts
│
└── frontend/
    ├── app/
    ├── components/
    └── lib/
```

## Design Decisions
# LLM for generation, deterministic code for guarantees

LLMs are useful for extracting and generating natural-language interview content, but they are not responsible for guarantees such as requirement coverage or schedule arithmetic.

Those parts are handled by deterministic application logic.

# Stable requirement and question IDs

Requirements and questions use stable IDs so that relationships remain intact when questions are edited, reordered, or regenerated.

# Preserve user edits

Generated content is treated as a starting point rather than immutable output. User edits are tracked so regeneration does not blindly overwrite them.

## AI Usage

AI tools were used during development for planning, implementation assistance, debugging, and review. The application itself uses an LLM as one component of the interview-kit generation pipeline; deterministic application logic is used for validation, coverage, and scheduling.


