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

## Research Pipeline
defines the company's research process:
details include:
does not treat unavailable pages as successful research, respects robots.txt, follows relevant links, ranks links for useful info, cleans content before passing to generation pipeline, records used pages, treats external content as untrusted data.

defaults are set for handling inaccessible pages and skipping them instead of treating as success.
'the process starts from a supplied URL.'
the retrieved content is cleaned before use. 
the system records which pages are used in generating the kit. 
the process skips unavailable pages rather than marking them as successful research. 
the external website content is considered untrusted data and not used as application instructions.
'the pipeline begins with a URL, retrieves accessible pages respecting robots.txt where applicable, follows relevant same-domain links, ranks links to prioritize useful info like company/about/careers, cleans retrieved content before passing it along.'
the system records all pages used during kit creation. 
unavailable pages are skipped rather than marked successful. 
the external website content remains untrusted data—used only for information gathering but not as instructions.
based on this description, I will now generate the Markdown.