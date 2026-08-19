import type { CodeLanguage, SubtopicContent } from "./types";
import { LANGUAGE_LABELS, codeFor } from "./types";

/**
 * Turns a content container into the grounding block the tutor LLM receives.
 *
 * This is the whole point of the container: the model teaches from authored
 * material instead of from whatever it happens to recall, so two students asking
 * the same question get the same algorithm, the same complexity, and the same
 * variable names as the lesson they are reading.
 */

/**
 * The guardrail. Prepended to the grounding block so the model knows the
 * material is authoritative and that inventing beyond it is a failure, not a
 * helpful extra.
 */
export const GROUNDING_RULES = `
You are a DSA tutor. The LESSON CONTENT below is the authored source of truth for
this subtopic. Follow these rules without exception:

1. Teach only what the LESSON CONTENT states. Do not introduce algorithms,
   complexities, or code that do not appear in it.
2. Reuse its exact variable names, step order, and complexity figures. A student
   reading the lesson must recognise your explanation as the same material.
3. When a student's question matches a COMMON DOUBT, base your answer on the
   authored answer. Rephrase for their wording; do not contradict it.
4. When the question is genuinely outside the LESSON CONTENT, say so plainly and
   offer what the content does cover. Never fill the gap by guessing.
5. When asked to visualise, follow the VISUALIZATION spec — its kind, its sample
   input, and its highlight sequence. Do not invent different data.
6. Explain step by step, one idea at a time. Assume the PREREQUISITES are known
   and nothing beyond them.
`.trim();

/**
 * Serialise a container into the prompt block. Deterministic — same input, same string.
 *
 * Pass the student's chosen language to scope the code to it. Omit it (the
 * Basics module) to include every authored language side by side, which is what
 * lets a student compare before committing.
 */
export function buildGroundingContext(
  content: SubtopicContent,
  language?: CodeLanguage,
): string {
  const parts: string[] = [];

  if (language) {
    parts.push(
      `# STUDENT LANGUAGE: ${LANGUAGE_LABELS[language]}\nWrite every code example in ${LANGUAGE_LABELS[language]}. Do not offer other languages unless the student asks.`,
    );
  }

  parts.push(`# LESSON CONTENT`);
  parts.push(`Topic: ${content.topic}
Subtopic: ${content.title}
Difficulty: ${content.difficulty}
Summary: ${content.summary}`);

  if (content.prerequisites?.length) {
    parts.push(`## PREREQUISITES (assume known)\n${content.prerequisites.join(", ")}`);
  }

  parts.push(`## THEORY\n${content.theory}`);

  if (content.intuition) {
    parts.push(`## INTUITION\n${content.intuition}`);
  }

  parts.push(
    `## APPROACHES\n` +
      content.approaches
        .map((a, i) => {
          const steps = a.steps.map((s, si) => `  ${si + 1}. ${s}`).join("\n");
          // Scoped to the student's language when they have one; all languages
          // during Basics so they can compare the same algorithm side by side.
          const samples = language ? [codeFor(a, language)].filter(c => c !== null) : a.code;
          const code = samples
            .map(c => `\`\`\`${c.language}\n${c.code}\n\`\`\``)
            .join("\n\n");
          const complexity = a.complexity
            ? `\n\nComplexity:\nTime: ${a.complexity.time} | Space: ${a.complexity.space}${
                a.complexity.note ? `\nWhy: ${a.complexity.note}` : ""
              }`
            : "";
          return `### Approach ${i + 1}: ${a.name}\nIdea: ${a.idea}\n\nSteps:\n${steps}${complexity}\n\nCode:\n${code}`;
        })
        .join("\n\n"),
  );

  parts.push(
    `## WORKED EXAMPLES\n` +
      content.examples
        .map(
          (e, i) =>
            `### Example ${i + 1}\nInput: ${e.input}\nOutput: ${e.output}${
              e.why ? `\nChosen because: ${e.why}` : ""
            }\nTrace:\n${e.walkthrough.map((w, wi) => `  ${wi + 1}. ${w}`).join("\n")}`,
        )
        .join("\n\n"),
  );

  parts.push(
    `## VISUALIZATION\nKind: ${content.visualization.kind}\nSample input: ${content.visualization.sampleInput}\nHow to render: ${content.visualization.description}` +
      (content.visualization.highlights?.length
        ? `\nFrame sequence:\n${content.visualization.highlights.map((h, i) => `  ${i + 1}. ${h}`).join("\n")}`
        : ""),
  );

  if (content.edgeCases?.length) {
    parts.push(`## EDGE CASES\n${content.edgeCases.map(e => `- ${e}`).join("\n")}`);
  }

  if (content.pitfalls?.length) {
    parts.push(`## PITFALLS\n${content.pitfalls.map(p => `- ${p}`).join("\n")}`);
  }

  if (content.commonDoubts?.length) {
    parts.push(
      `## COMMON DOUBTS (authored answers — prefer these)\n` +
        content.commonDoubts.map(d => `Q: ${d.question}\nA: ${d.answer}`).join("\n\n"),
    );
  }

  return parts.join("\n\n");
}

/** The full system prompt: guardrail plus grounding block. */
export function buildTutorSystemPrompt(
  content: SubtopicContent,
  language?: CodeLanguage,
): string {
  return `${GROUNDING_RULES}\n\n${buildGroundingContext(content, language)}`;
}
