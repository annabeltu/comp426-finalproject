# Oriole (COMP 426 – A05)

A social media app built with [Next.js](https://nextjs.org) (App Router), [Supabase](https://supabase.com), [Drizzle ORM](https://orm.drizzle.team), [tRPC](https://trpc.io), and [shadcn/ui](https://ui.shadcn.com).

## Getting Started

```bash
npm install
npx drizzle-kit push   # create the tables in your Supabase database
npm run dev            # http://localhost:3000
```

Copy `.env.example` to `.env` and fill in the values from your Supabase project first.

## Project Structure

| Path | What it is |
| --- | --- |
| `app/layout.tsx` | Root layout (theme, tRPC provider, header) |
| `app/page.tsx` → `app/home-page.tsx` | Home feed (`/`) |
| `app/login/page.tsx`, `app/signup/page.tsx` | Authentication pages |
| `app/profile/[id]/` | Profile page (`/profile/:id`) |
| `app/post/[id]/` | Single post page (`/post/:id`) |
| `app/testing/page.tsx` | Scratch page for testing API calls |
| `app/api/trpc/[trpc]/route.ts` | tRPC API endpoint |
| `server/api/routers/` | tRPC procedures (`posts.ts`, `profiles.ts`) |
| `server/db/schema.ts` | Drizzle table definitions |
| `server/db/relations.ts` | Drizzle relations (`defineRelations`) |
| `server/models/` | Zod input/output models (do not modify) |
| `proxy.ts` | Refreshes the Supabase session on each request |

Each protected route has a small **Server Component** (`page.tsx`) that checks that the user is logged in and then renders an interactive **Client Component** (marked `"use client"`) that uses React hooks and tRPC.

## Learn More

- [Next.js App Router documentation](https://nextjs.org/docs/app)
- [Drizzle relational queries](https://orm.drizzle.team/docs/rqb-v2)
- [tRPC React Query integration](https://trpc.io/docs/client/react)
