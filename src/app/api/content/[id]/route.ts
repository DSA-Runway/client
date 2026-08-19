import { NextResponse } from "next/server";
import { getSubtopicContent } from "@/content/registry";
import { buildTutorSystemPrompt } from "@/content/grounding";
import { LANGUAGES, type CodeLanguage } from "@/content/types";

/**
 * Serves one subtopic's authored container.
 *
 * This is the seam for the backend integration. Today the content comes from
 * files in src/content; when the backend lands, only this handler changes —
 * it fetches from the API instead of the registry, and every caller keeps
 * working because the response shape stays the same.
 *
 * GET /api/content/largest-element             -> the container as JSON
 * GET /api/content/largest-element?format=prompt -> the grounded system prompt
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const content = await getSubtopicContent(id);

  if (!content) {
    return NextResponse.json(
      { error: "No content authored for this subtopic yet.", id },
      { status: 404 },
    );
  }

  const search = new URL(request.url).searchParams;
  const format = search.get("format");

  // No lang param means "show every language" — the Basics module, before the
  // student has committed to one.
  const requested = search.get("lang");
  const language = LANGUAGES.includes(requested as CodeLanguage)
    ? (requested as CodeLanguage)
    : undefined;

  if (format === "prompt") {
    return NextResponse.json({
      id: content.id,
      status: content.status,
      language: language ?? "all",
      systemPrompt: buildTutorSystemPrompt(content, language),
    });
  }

  return NextResponse.json(content);
}
