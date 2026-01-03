# Year Planner

An MVP web app that digitizes a yearly goal planner. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (Postgres + Auth)**, **Zod**, and shadcn-inspired UI components.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables (see `.env.example`):
   ```bash
   cp .env.example .env.local
   # add your Supabase project values
   ```

3. Apply the database schema to your Supabase project:
   ```bash
   supabase db push
   ```
   (or run `supabase/migrations/0001_year_planner.sql` directly in the Supabase SQL editor).

4. Run the dev server:
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:3000.

## Supabase notes

- RLS is enabled on all tables; policies restrict access to the authenticated user.
- A trigger enforces **max 3 goals per category** at the database layer.
- The migration creates all core tables plus helper indexes.

## Core flows implemented

- Email/password signup & login (Supabase Auth)
- Create a Year Plan (auto-seeds 8 default categories + an Unexpected bucket)
- CRUD for goals, macro tasks, tasks (including unexpected tasks)
- Today view: search/add tasks to focus, quick-add unexpected tasks, Eisenhower flags, outcomes, daily log
- Weekly & monthly reviews with ratings/comments and stats
- Progress tracking across macros, goals, categories, year, and unexpected tasks
