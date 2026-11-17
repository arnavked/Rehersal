"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import { MAX_MESSAGE_LENGTH } from "@/lib/chat-limits";
import { PERSONAS, type Persona } from "@/lib/personas";

const FEEDBACK_REQUEST =
  "[The rehearsal has ended. Please drop character and give me feedback on how I handled this conversation.]";

export default function Home() {
  const [selected, setSelected] = useState<Persona | null>(null);

  return (
    <main className="min-h-screen bg-stage-bg text-stage-paper font-ui">
      <Header />
      {selected ? (
        <RehearsalRoom
          key={selected.id}
          persona={selected}
          onExit={() => setSelected(null)}
        />
      ) : (
        <CastingGrid onSelect={setSelected} />
      )}
    </main>
  );
}

function Header() {
  return (
    <header className="relative overflow-hidden border-b border-stage-border">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 600px 300px at 20% -10%, rgba(201,162,39,0.18), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6 py-10">
        <p className="font-script text-xs tracking-wide text-stage-paperMuted">
          before you&apos;re on stage for real
        </p>
        <h1 className="mt-2 font-display text-4xl italic text-stage-paper">
          Rehearsal
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-stage-paperMuted">
          Run the difficult conversation once in here first — the interview,
          the angry customer, the negotiation — before you run it for real.
        </p>
      </div>
    </header>
  );
}

function CastingGrid({ onSelect }: { onSelect: (p: Persona) => void }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="font-display text-lg text-stage-paper">
        Choose who you&apos;re rehearsing against
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="group text-left rounded-sm border border-stage-border bg-stage-surface p-5 transition-colors hover:border-stage-brass focus-visible:border-stage-brass"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-lg text-stage-paper">
                  {p.name}
                </div>
                <div className="text-xs text-stage-paperMuted">{p.role}</div>
              </div>
              <span
                className="shrink-0 rounded-sm border px-2 py-0.5 text-[11px]"
                style={{
                  borderColor: p.tension === "high" ? "#B4533C" : "#6B7A70",
                  color: p.tension === "high" ? "#D98B77" : "#9FB0A5",
                }}
              >
                {p.tag}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stage-paperMuted">
              {p.cardLine}
            </p>
            <p className="mt-4 font-script text-xs text-stage-brass opacity-0 transition-opacity group-hover:opacity-100">
              start rehearsal →
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function RehearsalRoom({
  persona,
  onExit,
}: {
  persona: Persona;
  onExit: () => void;
}) {
  const [ended, setEnded] = useState(false);
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    reload,
    error,
    isLoading,
  } = useChat({
      api: "/api/chat",
      initialMessages: [
        { id: "opening", role: "assistant", content: persona.opening },
      ],
      body: { personaId: persona.id, mode: "roleplay" },
    });

  function requestFeedback() {
    setEnded(true);
    append(
      {
        role: "user",
        content: FEEDBACK_REQUEST,
      },
      { body: { personaId: persona.id, mode: "feedback" } }
    );
  }

  const visibleMessages = messages.filter(
    (message) => message.content !== FEEDBACK_REQUEST
  );
  const feedbackRequestIndex = messages.findIndex(
    (message) => message.content === FEEDBACK_REQUEST
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-6 py-8">
      <div className="flex items-center justify-between border-b border-stage-border pb-4">
        <div>
          <button
            onClick={onExit}
            className="font-script text-xs text-stage-paperMuted hover:text-stage-brass"
          >
            ← choose someone else
          </button>
          <div className="mt-2 font-display text-xl text-stage-paper">
            {persona.name}
            <span className="ml-2 text-sm font-normal not-italic text-stage-paperMuted">
              — {persona.role}
            </span>
          </div>
        </div>
        {!ended && (
          <button
            onClick={requestFeedback}
            disabled={isLoading || messages.length < 3}
            className="rounded-sm border border-stage-brass px-3 py-1.5 text-xs text-stage-brass transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            End rehearsal — get feedback
          </button>
        )}
      </div>

      <div
        className="script-scroll mt-6 flex-1 space-y-5 overflow-y-auto pr-1"
        role="region"
        aria-label="Rehearsal conversation"
        aria-busy={isLoading}
      >
        {visibleMessages.map((m) => {
          const isCoachMessage =
            ended &&
            feedbackRequestIndex >= 0 &&
            m.role === "assistant" &&
            messages.indexOf(m) > feedbackRequestIndex;

          return (
            <div key={m.id} className="font-script text-[15px] leading-relaxed">
              <span
                className={
                  m.role === "user"
                    ? "text-stage-sage"
                    : isCoachMessage
                    ? "text-stage-brass"
                    : "text-stage-paper"
                }
              >
                {m.role === "user"
                  ? "YOU"
                  : isCoachMessage
                  ? "COACH"
                  : persona.name.split(" ")[0].toUpperCase()}
              </span>
              <span className="text-stage-paperMuted">: </span>
              <span className="text-stage-paper">{m.content}</span>
            </div>
          );
        })}
        {isLoading && (
          <p
            className="font-script text-xs text-stage-paperMuted"
            role="status"
            aria-live="polite"
          >
            {ended
              ? "Your coach is reviewing the conversation…"
              : `${persona.name.split(" ")[0]} is responding…`}
          </p>
        )}
      </div>

      {error && (
        <div
          className="mt-4 flex items-center justify-between gap-4 border border-stage-clay p-3 text-sm text-stage-paperMuted"
          role="alert"
        >
          <span>
            {ended
              ? "Feedback failed to load. Your transcript is still here."
              : "That reply failed to send."}
          </span>
          <button
            type="button"
            onClick={() =>
              reload({
                body: {
                  personaId: persona.id,
                  mode: ended ? "feedback" : "roleplay",
                },
              })
            }
            className="shrink-0 text-stage-brass underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {!ended && (
        <form
          onSubmit={(e) =>
            handleSubmit(e, { body: { personaId: persona.id, mode: "roleplay" } })
          }
          className="mt-6 flex gap-2 border-t border-stage-border pt-4"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Deliver your line..."
            aria-label="Your reply"
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={isLoading}
            className="flex-1 bg-transparent font-script text-sm text-stage-paper placeholder:text-stage-paperMuted focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-sm bg-stage-brass px-4 py-1.5 text-xs font-medium text-stage-bg disabled:opacity-30"
          >
            Send
          </button>
        </form>
      )}

      {ended && (
        <div className="mt-6 border-t border-stage-border pt-4">
          <button
            onClick={onExit}
            className="rounded-sm border border-stage-border px-4 py-1.5 text-xs text-stage-paperMuted hover:border-stage-brass hover:text-stage-brass"
          >
            Start a new rehearsal
          </button>
        </div>
      )}
    </div>
  );
}
