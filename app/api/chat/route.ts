import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";
import { getPersona, feedbackSystemPrompt } from "@/lib/personas";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, personaId, mode } = (await req.json()) as {
    messages: CoreMessage[];
    personaId: string;
    mode: "roleplay" | "feedback";
  };

  const persona = getPersona(personaId);
  if (!persona) {
    return new Response("Unknown persona", { status: 400 });
  }

  const system =
    mode === "feedback" ? feedbackSystemPrompt(persona) : persona.systemPrompt!;

  const result = streamText({
    model: anthropic("claude-sonnet-5"),
    system,
    messages,
    temperature: mode === "feedback" ? 0.4 : 0.8,
  });

  return result.toDataStreamResponse();
}
