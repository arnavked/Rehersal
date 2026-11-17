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

The chat route limits transcript size and model output. It does not authenticate
users or enforce a per-user quota, so add hosting-level rate limits before
opening a public deployment to significant traffic.

## Where the actual product content lives

`lib/personas.ts` — this is the whole IP of the product. Each persona is a
name, a one-line "casting card" description, an opening line, and a system
prompt that defines how it behaves and de-escalates/escalates in character.
Adding a new practice scenario is: add one object to the `PERSONAS` array.
No retraining, no redeploying a model — just edit the array and push.

## Resume-based interview

To use it, choose **Dana Whitfield** and upload a resume in the rehearsal room.
The file is optional; the interview works without it. PDF, DOCX, TXT, and
Markdown files are supported up to 5 MB, with extracted text limited to 30,000
characters. Scanned image-only PDFs are not supported.

`app/api/resume/route.ts` extracts the text, and `lib/resume-rag.ts` splits it
into overlapping chunks. During each interview turn, the chat route selects up
to three chunks by keyword overlap and adds them as untrusted reference context
for Claude. This lightweight retrieval needs no vector database or embedding
service. Relevant excerpts are sent to Anthropic; the app keeps the resume text
in page memory and does not save it between visits. Leaving the rehearsal drops
the uploaded resume from the page.

## Extending this

- **More personas**: add entries to `lib/personas.ts`.
- **Persistence** (save past rehearsals, track improvement over time): add a
  database (Vercel Postgres / Supabase), a `sessions` table, and session IDs.
  The chat route is currently stateless: each request includes its transcript,
  persona, and mode, and nothing is saved between visits.
- **Voice mode**: the Vercel AI SDK supports streaming audio providers if you
  want spoken rehearsal instead of typed.
- **Swapping model providers**: change the `anthropic(...)` call in
  `app/api/chat/route.ts` to any other `@ai-sdk/*` provider — the rest of the
  app doesn't need to change.
