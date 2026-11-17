# Rehearsal

Practice a high-stakes conversation — interview, angry customer, negotiation,
asking for a raise — against an in-character AI partner, then get direct
feedback on how you actually handled it.

No GPU, no fine-tuning, no model hosting: personas are system prompts against
a hosted Claude model via the Vercel AI SDK, which is why this deploys as a
plain Next.js app.

## Run locally

```bash
npm install
cp .env.example .env.local   # then paste in a real ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project**, import that repo. Framework preset
   (Next.js) is auto-detected.
3. In the project's **Settings → Environment Variables**, add
   `ANTHROPIC_API_KEY` with your real key.
4. Deploy. That's it — no other infra, no GPU, no separate backend.

## Where the actual product content lives

`lib/personas.ts` — this is the whole IP of the product. Each persona is a
name, a one-line "casting card" description, an opening line, and a system
prompt that defines how it behaves and de-escalates/escalates in character.
Adding a new practice scenario is: add one object to the `PERSONAS` array.
No retraining, no redeploying a model — just edit the array and push.

## Extending this

- **More personas**: add entries to `lib/personas.ts`.
- **Persistence** (save past rehearsals, track improvement over time): add a
  database (Vercel Postgres / Supabase) and a `sessions` table — the chat
  route already isolates each conversation by persona + mode, so this is an
  additive change, not a rewrite.
- **Voice mode**: the Vercel AI SDK supports streaming audio providers if you
  want spoken rehearsal instead of typed.
- **Swapping model providers**: change the `anthropic(...)` call in
  `app/api/chat/route.ts` to any other `@ai-sdk/*` provider — the rest of the
  app doesn't need to change.
