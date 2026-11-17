import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import {
  chunkResumeText,
  MAX_RESUME_TEXT_CHARS,
  normalizeResumeText,
} from "@/lib/resume-rag";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_FILE_BYTES + 64 * 1024
  ) {
    return errorResponse("Resume file is too large (5 MB maximum).", 413);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse("Could not read the uploaded file.", 400);
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return errorResponse("Choose a resume file to upload.", 400);
  }
  if (file.size === 0) {
    return errorResponse("The selected file is empty.", 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return errorResponse("Resume file is too large (5 MB maximum).", 413);
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["pdf", "docx", "txt", "md"].includes(extension)) {
    return errorResponse("Use a PDF, DOCX, TXT, or Markdown file.", 415);
  }

  let text: string;
  try {
    if (extension === "pdf") {
      const parser = new PDFParse({ data: Buffer.from(await file.arrayBuffer()) });
      try {
        text = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else if (extension === "docx") {
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(await file.arrayBuffer()),
      });
      text = result.value;
    } else {
      text = await file.text();
    }
  } catch {
    return errorResponse(
      "Could not extract text. Check that the document is valid and try again.",
      422
    );
  }

  const normalizedText = normalizeResumeText(text);
  if (normalizedText.length < 40) {
    return errorResponse(
      "No readable text found. Scanned image-only PDFs are not supported yet.",
      422
    );
  }
  if (normalizedText.length > MAX_RESUME_TEXT_CHARS) {
    return errorResponse(
      "Resume text is too long. Keep it under 30,000 characters and try again.",
      413
    );
  }

  return Response.json({ chunks: chunkResumeText(normalizedText) });
}
