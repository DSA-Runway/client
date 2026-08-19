import type { SubtopicContent } from "../types";

/**
 * Subtopic 9 of Basics. Picks up exactly where if-else-statements stopped: that
 * lesson handled one condition and its opposite, this one handles three or more
 * outcomes.
 *
 * The lesson that earns its place is CONDITION ORDER. GFG's coverage presents the
 * grading example in correct descending order without ever saying why the order
 * is load-bearing — so a student who writes it ascending gets a ladder where
 * every input lands in the first bucket, with no error to point at. That failure
 * is taught here as a worked example, not a footnote.
 */
const content: SubtopicContent = {
  id: "else-if-ladder",
  topic: "Basics",
  title: "Else-If Ladder",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "introduction-to-programming",
    "variables-and-constants",
    "relational-and-logical-operators",
    "if-else-statements",
  ],

  summary:
    "Choosing one outcome from three or more by testing conditions in sequence — and why the order you write them in decides whether the code is correct.",

  theory: `
## When two branches aren't enough

An \`if-else\` handles a question and its opposite. Plenty of problems have more
outcomes than that: a grade band, a menu choice, a range of sizes, a category.

The instinct is to write several independent \`if\` statements:

\`\`\`
if (score >= 90) grade = 'A';
if (score >= 80) grade = 'B';
if (score >= 70) grade = 'C';
\`\`\`

That is broken, and it fails quietly. A score of 95 satisfies **all three**
conditions. Each \`if\` is tested independently, so all three run in turn and \`grade\`
ends up as \`'C'\` — the last one to overwrite it. No error, no warning, just the
wrong answer.

## The ladder

Chaining with \`else if\` fixes it:

\`\`\`
if (score >= 90)       grade = 'A';
else if (score >= 80)  grade = 'B';
else if (score >= 70)  grade = 'C';
else                   grade = 'F';
\`\`\`

The evaluation rule is short and worth memorising:

**Conditions are tested top to bottom. The first one that is true runs its block,
and every remaining condition is skipped entirely — not evaluated, not considered.**

That gives you two guarantees the separate-\`if\` version never had:

1. **At most one block runs.** They are alternatives by construction.
2. **Later conditions only see values the earlier ones rejected.** Reaching the
   second line already tells you \`score < 90\`.

The final \`else\` is optional and acts as the catch-all — it runs when nothing above
it matched.

## Order is a correctness concern

This is the part that actually catches people.

When the conditions **overlap**, the order decides which one wins. Reverse the grade
ladder and it still compiles, still runs, and is completely wrong:

\`\`\`
if (score >= 70)       grade = 'C';     // 95 matches HERE and stops
else if (score >= 80)  grade = 'B';     // unreachable
else if (score >= 90)  grade = 'A';     // unreachable
\`\`\`

A score of 95 satisfies \`score >= 70\`, so it takes the first branch and gets a \`'C'\`.
The \`'B'\` and \`'A'\` branches can never run for *any* input, because any score that
would reach them was already caught above.

The rule: **with overlapping conditions, order from most specific to least
specific** — the highest threshold first when using \`>=\`, the lowest first when
using \`<=\`.

## You don't need both bounds

Because a later branch only runs when every earlier condition failed, its lower
bound is already implied:

\`\`\`
else if (score >= 80 && score < 90)   // the && is redundant
else if (score >= 80)                 // reaching here already means score < 90
\`\`\`

Both work. The second states the intent more clearly and has one less place to make a
mistake. Writing the redundant bound isn't wrong — it's a sign the ladder's
guarantee hasn't fully clicked yet.

## Watch for gaps

The ladder only covers what you tell it to. With no final \`else\`, an input matching
nothing simply falls through and **nothing happens** — which is legitimate when
that's intended, and a silent bug when it isn't.

If every case should produce a result, end with \`else\`. If the ladder is assigning a
value, a missing \`else\` can also leave that variable holding whatever it had before.

## Why Python spells it elif

\`else if\` isn't really new syntax in C++ and Java — it's an \`if\` sitting inside an
\`else\`. The braces are usually omitted because the \`else\` controls a single
statement, so the chain reads flat:

\`\`\`
else { if (...) { ... } }      is the same as      else if (...) { ... }
\`\`\`

Python can't do that. Blocks are defined by indentation, so a nested \`if\` inside an
\`else\` would indent one level deeper at every rung — a six-branch ladder would march
right off the screen. \`elif\` exists to keep the chain flat, which is why Python has a
dedicated keyword where the others reuse two existing ones.

Writing \`else if\` in Python is a syntax error. It's \`elif\`.

## When to reach for switch instead

A ladder testing **the same variable against a list of exact values** is doing a job
\`switch\` expresses more directly. A ladder testing **ranges, or several different
variables**, is the right tool and \`switch\` cannot replace it. That comparison is the
next subtopic.
`.trim(),

  intuition:
    "A ladder is a sieve, not a set of independent tests. Each rung catches what it can and passes the rest down, so every condition is implicitly 'and nothing above me matched'. Once you see it that way, both the order rule and the redundant-bounds question answer themselves.",

  approaches: [
    {
      name: "Building an else-if Ladder",
      idea: "Chain conditions so exactly one branch runs, with an optional catch-all at the end.",
      steps: [
        "Write the first condition and the block that should run when it holds.",
        "Attach each further condition with else if, so it is only tested when all previous ones failed.",
        "Order the conditions so the most specific is tested first.",
        "Add a final else for the case where nothing matched, if every input should produce a result.",
        "At runtime, evaluation stops at the first true condition and skips every remaining test.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

int main() {
    int score = 85;
    char grade;

    if (score >= 90) {
        grade = 'A';
    } else if (score >= 80) {
        grade = 'B';          // this runs
    } else if (score >= 70) {
        grade = 'C';
    } else if (score >= 60) {
        grade = 'D';
    } else {
        grade = 'F';          // catch-all
    }

    cout << grade << endl;    // B
    return 0;
}`,
          annotations: {
            8: "Tested first. 85 is not >= 90, so evaluation moves to the next rung.",
            10: "85 >= 80 is true, so this block runs and the remaining conditions are never evaluated.",
            16: "Runs only when every condition above it failed.",
          },
        },
        {
          language: "java",
          code: `public class Grade {
    public static void main(String[] args) {
        int score = 85;
        char grade;

        if (score >= 90) {
            grade = 'A';
        } else if (score >= 80) {
            grade = 'B';          // this runs
        } else if (score >= 70) {
            grade = 'C';
        } else if (score >= 60) {
            grade = 'D';
        } else {
            grade = 'F';
        }

        System.out.println(grade);   // B
    }
}`,
          annotations: {
            14: "Java requires grade to be definitely assigned before use, so omitting this else would not compile here.",
          },
        },
        {
          language: "python",
          code: `score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"          # this runs
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(grade)   # B`,
          annotations: {
            5: "elif, not 'else if' — that is a syntax error here. Every rung stays at the same indentation, which is exactly why the keyword exists.",
          },
        },
      ],
    },
    {
      name: "Ordering Overlapping Conditions",
      idea: "When conditions overlap, put the most specific first — otherwise the broad one swallows everything.",
      steps: [
        "Identify whether the conditions overlap, meaning one input could satisfy more than one of them.",
        "If they do, determine which condition is the most restrictive.",
        "Place that condition first, and order the rest from most to least specific.",
        "With >= thresholds this means descending order; with <= it means ascending.",
        "Verify by tracing an input that should hit the last rung and confirming no earlier condition catches it.",
      ],
      code: [
        {
          language: "cpp",
          code: `int score = 95;
char grade;

// WRONG — ascending order with >= thresholds
if (score >= 70) {
    grade = 'C';          // 95 matches here and stops
} else if (score >= 80) {
    grade = 'B';          // unreachable for every input
} else if (score >= 90) {
    grade = 'A';          // unreachable for every input
}
cout << grade << endl;    // C  — wrong, and no error was reported

// CORRECT — descending order
if (score >= 90) {
    grade = 'A';          // 95 caught here
} else if (score >= 80) {
    grade = 'B';
} else if (score >= 70) {
    grade = 'C';
}
cout << grade << endl;    // A`,
          annotations: {
            7: "Any score reaching this line already failed score >= 70, so it can never be >= 80.",
            13: "The program compiles and runs. Only the answer is wrong.",
          },
        },
        {
          language: "java",
          code: `int score = 95;
char grade = '?';

// WRONG — ascending order
if (score >= 70) {
    grade = 'C';          // 95 matches here and stops
} else if (score >= 80) {
    grade = 'B';          // unreachable
} else if (score >= 90) {
    grade = 'A';          // unreachable
}
System.out.println(grade);   // C

// CORRECT — descending order
if (score >= 90) {
    grade = 'A';
} else if (score >= 80) {
    grade = 'B';
} else if (score >= 70) {
    grade = 'C';
}
System.out.println(grade);   // A`,
          annotations: {
            9: "Java will not warn about this. Unreachable-branch detection does not extend to overlapping value ranges.",
          },
        },
        {
          language: "python",
          code: `score = 95

# WRONG — ascending order
if score >= 70:
    grade = "C"          # 95 matches here and stops
elif score >= 80:
    grade = "B"          # unreachable
elif score >= 90:
    grade = "A"          # unreachable
print(grade)   # C

# CORRECT — descending order
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
print(grade)   # A

# The redundant-bounds version — correct, but the && is unnecessary
if score >= 90:
    grade = "A"
elif score >= 80 and score < 90:   # reaching here already means score < 90
    grade = "B"`,
          annotations: {
            23: "Harmless but noisy. The ladder already guarantees the upper bound.",
          },
        },
      ],
    },
    {
      name: "The Default Branch and Uncovered Gaps",
      idea: "Decide explicitly what happens when nothing matches, instead of letting it fall through silently.",
      steps: [
        "List every input the ladder is expected to handle.",
        "Check whether the conditions together cover all of them.",
        "If every input should produce a result, add a final else as the catch-all.",
        "If falling through is genuinely correct, leave the else off deliberately rather than by omission.",
        "When the ladder assigns a variable, confirm that variable holds something sensible on the fall-through path.",
      ],
      code: [
        {
          language: "cpp",
          code: `int score = 45;
char grade = '?';       // sensible starting value

// No final else — 45 matches nothing and falls through
if (score >= 90)      grade = 'A';
else if (score >= 80) grade = 'B';
else if (score >= 70) grade = 'C';
cout << grade << endl;   // ?  — grade was never assigned by the ladder

// With a catch-all, every input produces a result
if (score >= 90)      grade = 'A';
else if (score >= 80) grade = 'B';
else if (score >= 70) grade = 'C';
else                  grade = 'F';
cout << grade << endl;   // F

// Invalid input deserves its own branch, not the catch-all
if (score < 0 || score > 100) cout << "invalid score" << endl;
else if (score >= 90)         cout << "A" << endl;
else                          cout << "below A" << endl;`,
          annotations: {
            8: "Had grade been left uninitialised, this would print leftover memory instead.",
            18: "Checking validity first keeps bad input out of the grading logic entirely.",
          },
        },
        {
          language: "java",
          code: `int score = 45;
char grade = '?';

// No final else — nothing matches, grade keeps its previous value
if (score >= 90)      grade = 'A';
else if (score >= 80) grade = 'B';
else if (score >= 70) grade = 'C';
System.out.println(grade);   // ?

// With a catch-all
if (score >= 90)      grade = 'A';
else if (score >= 80) grade = 'B';
else if (score >= 70) grade = 'C';
else                  grade = 'F';
System.out.println(grade);   // F`,
          annotations: {
            2: "Without this initial value, Java would reject the first ladder — it cannot prove grade is assigned on every path.",
          },
        },
        {
          language: "python",
          code: `score = 45
grade = "?"

# No final else — nothing matches, grade keeps its previous value
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
print(grade)   # ?

# With a catch-all
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(grade)   # F`,
          annotations: {
            2: "Without this line, the fall-through path would raise NameError rather than printing a stale value.",
          },
        },
      ],
    },
  ],

  examples: [
    {
      input: "score = 85 in a descending grade ladder: >=90 A, >=80 B, >=70 C, else F",
      output: "B",
      walkthrough: [
        "The first condition score >= 90 is evaluated: 85 is not at least 90, so it is false.",
        "Evaluation moves to the second rung and tests score >= 80.",
        "85 is at least 80, so this condition is true and its block runs, assigning B.",
        "The remaining conditions are skipped entirely — score >= 70 is never evaluated at all.",
        "The final else is also skipped, and execution continues after the whole ladder.",
        "Exactly two comparisons were performed to reach the answer.",
      ],
      why: "Shows first-match-wins concretely: the third condition would also have been true, and was never even tested.",
    },
    {
      input: "score = 95 in an ascending ladder: >=70 C, >=80 B, >=90 A",
      output: "C — and the A and B branches are unreachable for every input",
      walkthrough: [
        "The first condition score >= 70 is evaluated: 95 is at least 70, so it is true.",
        "Grade is assigned C, and the ladder stops — no further condition is tested.",
        "The intended answer was A, but the branch that would have produced it was never reached.",
        "The problem is not this one input. Any score of 80 or more satisfies score >= 70 first.",
        "So the B branch runs only for scores that failed score >= 70 yet pass score >= 80, which is impossible.",
        "Both later branches are dead code, and the compiler reports nothing because each condition is individually valid.",
      ],
      why: "The order bug in full: it is not an edge case that fails, it is every case, and there is no error message pointing at it.",
    },
    {
      input: "score = 45 in a ladder with no final else",
      output: "grade keeps whatever value it already held",
      walkthrough: [
        "The condition score >= 90 is false for 45.",
        "The condition score >= 80 is false.",
        "The condition score >= 70 is false.",
        "There is no else, so the ladder ends without running any block.",
        "Grade is never assigned by the ladder and still holds its previous value.",
        "In C++ an uninitialised grade would show leftover memory, and in Python an unassigned name would raise NameError instead.",
      ],
      why: "Falling through is silent by design. Making it visible is the point of writing the final else deliberately.",
    },
  ],

  visualization: {
    kind: "code-flow",
    description:
      "Two linked panels sharing one input value. The LADDER panel draws the rungs as a vertical stack of diamonds, each with a block on its true edge and a downward false edge feeding the next diamond, ending in an else block on the last false edge. An execution token descends: each diamond it reaches lights up as it is evaluated, a failing diamond dims and passes the token down, and the first passing diamond turns green, routes the token into its block, and then jumps it straight past every remaining rung — with all skipped diamonds drawn greyed and explicitly never lit, so untested is visually distinct from tested-and-false. The RANGE panel is the one that teaches the order rule: draw a number line from 0 to 100 and shade each rung's condition as a band, stacked in evaluation order with the first rung on top. In the correct descending ladder the bands tile the line cleanly, each visible strip belonging to exactly one rung. Switching to the ascending order redraws the same bands in the new order, and the topmost band now visibly covers every value above 70 — the bands beneath it are completely hidden, showing at a glance that they can never be reached. Animate the input marker on the number line dropping down through the stack until it hits the first band that covers it, which is the same first-match rule the other panel shows structurally.",
    sampleInput:
      '{"score":95,"ladders":[{"name":"descending","rungs":[{"cond":"score >= 90","value":"A","min":90},{"cond":"score >= 80","value":"B","min":80},{"cond":"score >= 70","value":"C","min":70}],"else":"F","result":"A"},{"name":"ascending","rungs":[{"cond":"score >= 70","value":"C","min":70},{"cond":"score >= 80","value":"B","min":80},{"cond":"score >= 90","value":"A","min":90}],"else":"F","result":"C","unreachable":["B","A"]}],"traceScore":85}',
    highlights: [
      "The token enters the top diamond, which lights as score >= 90 is evaluated against 85.",
      "The condition fails, the diamond dims, and the token drops to the next rung.",
      "The second diamond lights, score >= 80 passes, and it turns green.",
      "The token enters the B block, then jumps past the remaining rungs entirely.",
      "The skipped diamonds stay grey and are never lit — untested, not merely false.",
      "The range panel shades each condition as a band on a 0-to-100 number line, stacked in evaluation order.",
      "In descending order the bands tile cleanly: 90-100, then 80-90, then 70-80, each strip owned by one rung.",
      "Switching to ascending order redraws the stack, and the 70-and-above band now sits on top.",
      "That single band covers everything above 70, completely hiding the two bands beneath it.",
      "The hidden bands are the unreachable branches — visible as a coverage problem rather than a logic puzzle.",
      "The input marker drops through the stack and stops at the first band covering it, matching the first-match rule structurally.",
    ],
  },

  edgeCases: [
    "An input matching no condition in a ladder without a final else, where no block runs at all.",
    "An input sitting exactly on a threshold, where >= includes it and > excludes it.",
    "Overlapping conditions in the wrong order, which makes later branches unreachable for every possible input.",
    "A ladder assigning a variable that was never initialised, where the fall-through path leaves it undefined.",
    "Conditions that leave a gap in the middle of the range rather than at the end, which is easy to miss without tracing.",
    "A first rung that is always true, which turns the entire rest of the ladder into dead code.",
    "Invalid input reaching the final else and being silently treated as the default case rather than rejected.",
    "Writing else if in Python, which is a syntax error rather than a working alternative to elif.",
  ],

  pitfalls: [
    "Ordering >= thresholds ascending, so the broadest condition catches every input and the rest never run.",
    "Using separate if statements instead of else if, so several blocks run and the last one overwrites the rest.",
    "Omitting the final else when every input needs a result, leaving a variable holding a stale or undefined value.",
    "Writing both bounds on every rung when the ladder already guarantees the upper one.",
    "Assuming the compiler will warn about an unreachable branch — overlapping ranges are not detected.",
    "Putting the most common case last, so most inputs pay for every comparison above it.",
    "Letting invalid input fall into the catch-all else instead of rejecting it in its own branch first.",
    "Writing else if in Python instead of elif.",
    "Building a long ladder of equality tests against one variable, where switch expresses the intent better.",
  ],

  commonDoubts: [
    {
      question: "My grade ladder gives everyone the same grade. What is wrong?",
      answer:
        "Your conditions are almost certainly ordered from lowest threshold to highest. With >= comparisons the conditions overlap, so a score of 95 satisfies score >= 70 on the very first rung and the ladder stops there. Every input above the lowest threshold lands in that first branch, and the branches below it can never run for any value. Reorder from the highest threshold down and each score reaches the right rung.",
    },
    {
      question: "Do I need to write both bounds, like score >= 80 && score < 90?",
      answer:
        "No. A rung is only reached when every condition above it failed, so if the previous rung tested score >= 90 and failed, you already know the score is below 90. The upper bound is guaranteed by position. Writing it is not wrong, just redundant — and it adds a second place to get a number wrong. The exception is a standalone if that is not part of a ladder, where nothing has been ruled out for you.",
    },
    {
      question: "What is the difference between else-if and several separate ifs?",
      answer:
        "Separate ifs are independent: every condition is tested, and if two of them are true, both blocks run. A ladder is a single decision: testing stops at the first true condition, so at most one block ever runs. When the conditions are mutually exclusive by nature the two behave the same, which is exactly why the bug hides. When they overlap — as ranges almost always do — separate ifs let several run and the last assignment wins.",
    },
    {
      question: "What happens if no condition matches and there is no else?",
      answer:
        "Nothing runs, and execution continues after the ladder. That is legitimate when doing nothing is the right response, but it is a silent failure when it is not. If the ladder assigns a variable, that variable keeps whatever it held before — leftover memory in C++, its previous value in Java or Python, or a NameError in Python if it was never assigned at all. When every input should produce a result, write the final else.",
    },
    {
      question: "Why does Python use elif instead of else if?",
      answer:
        "Because of indentation. In C++ and Java, else if is really an if nested inside an else, and the nesting is invisible because braces are omitted for a single statement. Python has no braces — a nested if inside an else must be indented one level deeper, so a six-branch ladder would step six levels to the right. elif exists to keep every rung at the same indentation. Writing else if in Python is a syntax error.",
    },
    {
      question: "How many branches before I should switch to a switch statement?",
      answer:
        "The count matters less than the shape. If every rung compares the same variable against an exact value, switch expresses that directly and reads better from about three branches upward. If the rungs test ranges, use different variables, or involve compound conditions, a ladder is the right tool and switch cannot express it at all. Ranges are the common case in DSA, so the ladder is what you will reach for most.",
    },
    {
      question: "Does the order of conditions affect performance?",
      answer:
        "Slightly, and it is rarely the reason to care. Since testing stops at the first match, a rung near the bottom pays for every comparison above it. Putting the most common case first saves those comparisons. But the effect is tiny next to the correctness issue — with overlapping conditions the order determines the answer, not just the speed, so get it right for that reason first.",
    },
    {
      question: "Can I have an else without any else-if in between?",
      answer:
        "Yes — that is just a plain if-else, which is the two-branch case from the previous subtopic. The ladder is what you get by inserting one or more else if rungs between them. There is no separate construct being introduced here; else if is the same if and else you already know, chained.",
    },
  ],

  relatedIds: ["if-else-statements", "switch-case", "relational-and-logical-operators"],
};

export default content;
