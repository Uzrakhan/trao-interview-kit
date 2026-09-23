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