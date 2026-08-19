import type { SubtopicContent } from "../types";

/**
 * Subtopic 10 of Basics. Closes the control-flow selection group that began with
 * if-else and continued through the ladder.
 *
 * This is the first subtopic where the three languages genuinely do not have the
 * same construct: Python has no switch at all, and match/case (3.10+) is
 * structural pattern matching rather than a switch — no fall-through, different
 * model. Rather than pretending otherwise, the third approach covers Python's
 * three real options honestly.
 *
 * The defining behaviour to teach is fall-through: entry is a jump, exit is a
 * break. Every classic switch bug follows from students knowing the first half.
 */
const content: SubtopicContent = {
  id: "switch-case",
  topic: "Basics",
  title: "Switch Case",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "introduction-to-programming",
    "variables-and-constants",
    "relational-and-logical-operators",
    "if-else-statements",
    "else-if-ladder",
  ],

  summary:
    "Branching on one variable's exact value with a dedicated construct — how entering by a jump and leaving by a break produces both its most useful feature and its most common bug.",

  theory: `
## The shape switch is for

The previous subtopic ended with a distinction worth repeating: a ladder testing
**ranges** or **several different variables** is doing a job only a ladder can do. A
ladder testing **one variable against a list of exact values** is doing something
narrower, and \`switch\` says it more directly.

\`\`\`
if (day == 1)       cout << "Monday";
else if (day == 2)  cout << "Tuesday";
else if (day == 3)  cout << "Wednesday";
\`\`\`

The variable and the operator repeat on every line. All that actually varies is the
value. \`switch\` factors that out:

\`\`\`
switch (day) {
    case 1: cout << "Monday";    break;
    case 2: cout << "Tuesday";   break;
    case 3: cout << "Wednesday"; break;
    default: cout << "Invalid";
}
\`\`\`

## How it actually runs

This is where \`switch\` stops being cosmetic, because its execution model genuinely
differs from a ladder's.

A ladder **tests each condition in sequence** until one passes. A switch
**evaluates the expression once and jumps straight to the matching label**. There is
no walking down the cases comparing as it goes.

That has one consequence that catches everybody:

**A \`case\` label is an entry point, not a container.**

The case marks *where execution begins*. It does not mark where execution ends. Once
the program has jumped in, it keeps running **downward through every following
case** until something stops it. That something is \`break\`.

## Fall-through

Leave out a \`break\` and execution continues into the next case's code:

\`\`\`
switch (day) {
    case 1: cout << "Monday";     // no break
    case 2: cout << "Tuesday";    // runs too
    case 3: cout << "Wednesday";  // and this
}
\`\`\`

With \`day == 1\`, all three print. The program jumped to \`case 1\` and simply never
stopped. This is **fall-through**, and it compiles without complaint because it is
legal, intentional behaviour — just rarely what you meant.

**Forgetting a break is the single most common switch bug**, and it produces extra
output rather than an error, so it is easy to misread as a logic problem elsewhere.

## Fall-through as a tool

Because it is deliberate, you can use it. Stacking case labels with no code between
them groups several values onto one block:

\`\`\`
switch (c) {
    case 'a':
    case 'e':
    case 'i':
    case 'o':
    case 'u':
        cout << "vowel";
        break;
    default:
        cout << "consonant";
}
\`\`\`

Any of the five vowels enters at its own label and falls through to the shared body.
This is the clearest expression of "these values are equivalent", and it is the one
place fall-through is unambiguously good style.

## default

\`default\` runs when no case matches — the same role as the final \`else\` in a ladder.
It is optional, and without it an unmatched value simply does nothing.

It may legally appear anywhere in the switch, but put it last. Placed in the middle
it still only runs when nothing matched, but it can be *fallen into* from the case
above it, which is confusing to read for no benefit.

## What you can switch on

The restrictions are the real reason \`switch\` cannot replace a ladder.

**C++** allows integral types, characters, and enums. Not strings, not floating
point, not ranges.

**Java** allows those plus \`String\` (since Java 7) and enums.

**Case labels must be compile-time constants** in both. You cannot write
\`case x:\` where \`x\` is a variable, and you cannot write \`case > 90:\`. Every label is
one fixed value known before the program runs.

So the moment your branching involves a range, a comparison, or a second variable,
\`switch\` is out and a ladder is the answer.

## Python does not have switch

This is not a syntax difference — the construct is genuinely absent. Python has
three ways to express the same intent:

**1. \`if\`/\`elif\` ladder.** Works on every Python version and handles ranges too. The
default answer.

**2. Dictionary dispatch.** Idiomatic when you are mapping a value to a value, or to
a function:

\`\`\`
days = {1: "Monday", 2: "Tuesday", 3: "Wednesday"}
name = days.get(day, "Invalid")
\`\`\`

The \`.get\` default replaces \`default:\`, and lookup is a single operation regardless
of how many entries exist.

**3. \`match\`/\`case\`, from Python 3.10.** This looks like a switch and is used like
one for simple values, but it is **structural pattern matching** — a more general
tool that can destructure lists, dicts, and objects. Two differences matter here:
there is **no fall-through**, so no \`break\` exists or is needed, and the wildcard is
\`_\` rather than a \`default\` keyword. Multiple values share a branch with \`|\`.

## Java's arrow form

Java 14 added a second syntax that removes fall-through entirely:

\`\`\`
switch (day) {
    case 1 -> System.out.println("Monday");
    case 2, 3 -> System.out.println("Midweek");
    default -> System.out.println("Invalid");
}
\`\`\`

No \`break\`, and multiple values are listed with commas instead of stacked labels.
Prefer it in new Java code. The classic colon form is still what you will encounter
in most existing code and in C++, so both are worth being able to read.
`.trim(),

  intuition:
    "A case label is a door, not a room. Matching decides which door you enter through; break decides where you leave. Every classic switch bug comes from knowing about the door and forgetting about the exit.",

  approaches: [
    {
      name: "Writing a switch Statement",
      idea: "Branch on one variable's exact value, with a break ending each case and a default catching the rest.",
      steps: [
        "Confirm the branching compares a single variable against fixed values, not ranges or compound conditions.",
        "Write the switch with that variable as its expression.",
        "Add one case label per value, each followed by the statements for that value.",
        "End each case with a break so execution leaves the switch instead of continuing downward.",
        "Add a default at the end to handle values no case matched.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

int main() {
    int day = 3;

    switch (day) {
        case 1:
            cout << "Monday" << endl;
            break;
        case 2:
            cout << "Tuesday" << endl;
            break;
        case 3:
            cout << "Wednesday" << endl;   // this runs
            break;
        default:
            cout << "Invalid day" << endl;
    }

    return 0;
}`,
          annotations: {
            7: "The expression is evaluated once, then control jumps directly to the matching label.",
            16: "Without this break, execution would continue into the default block below.",
            17: "The last case needs no break, but adding one protects against cases inserted after it later.",
          },
        },
        {
          language: "java",
          code: `public class Days {
    public static void main(String[] args) {
        int day = 3;

        switch (day) {
            case 1:
                System.out.println("Monday");
                break;
            case 2:
                System.out.println("Tuesday");
                break;
            case 3:
                System.out.println("Wednesday");   // this runs
                break;
            default:
                System.out.println("Invalid day");
        }

        // Java 14+ arrow form — no break, no fall-through
        switch (day) {
            case 1 -> System.out.println("Monday");
            case 2, 3 -> System.out.println("Midweek");
            default -> System.out.println("Invalid day");
        }

        // Java also allows switching on String
        String cmd = "add";
        switch (cmd) {
            case "add": System.out.println("adding"); break;
            case "remove": System.out.println("removing"); break;
            default: System.out.println("unknown");
        }
    }
}`,
          annotations: {
            20: "The arrow form removes fall-through entirely and lists multiple values with commas.",
            28: "Switching on String has been legal since Java 7. C++ still does not allow it.",
          },
        },
        {
          language: "python",
          code: `# Python has no switch statement. From 3.10, match/case is the closest form.
day = 3

match day:
    case 1:
        print("Monday")
    case 2:
        print("Tuesday")
    case 3:
        print("Wednesday")   # this runs
    case _:
        print("Invalid day")

# No break appears anywhere — match/case does not fall through.

# Multiple values share a branch with |
match day:
    case 1 | 2 | 3 | 4 | 5:
        print("Weekday")
    case 6 | 7:
        print("Weekend")
    case _:
        print("Invalid day")`,
          annotations: {
            4: "Available only from Python 3.10 onward. On older versions this is a syntax error.",
            11: "The underscore is the wildcard, filling the role of default.",
            14: "Each branch ends on its own, so there is no break keyword in the construct at all.",
          },
        },
      ],
    },
    {
      name: "Fall-Through: Bug and Tool",
      idea: "Understand that a case is an entry point, so execution continues downward until a break — then use that deliberately.",
      steps: [
        "Recognise that matching a case only decides where execution begins.",
        "Trace what runs after the matched block when no break follows it.",
        "Add a break at the end of every case whose code should not continue into the next.",
        "To group values that share a body, stack their case labels with no statements between them.",
        "Place the shared statements after the last stacked label, ending with a single break.",
      ],
      code: [
        {
          language: "cpp",
          code: `int day = 1;

// THE BUG — no breaks, so everything below the entry point runs
switch (day) {
    case 1: cout << "Monday" << endl;
    case 2: cout << "Tuesday" << endl;
    case 3: cout << "Wednesday" << endl;
}
// prints Monday, Tuesday, AND Wednesday

// THE TOOL — stacked labels share one body
char c = 'e';
switch (c) {
    case 'a':
    case 'e':
    case 'i':
    case 'o':
    case 'u':
        cout << "vowel" << endl;   // 'e' enters here and falls to this
        break;
    default:
        cout << "consonant" << endl;
}

// Declaring a variable inside a case needs its own braces
switch (day) {
    case 1: {
        int count = 5;    // braces make this a proper scope
        cout << count << endl;
        break;
    }
    case 2:
        break;
}`,
          annotations: {
            5: "Control jumps here, then keeps going down. The case labels below are not barriers.",
            14: "Empty labels stack up, each one an entry into the same shared block.",
            26: "Without the braces, the compiler rejects this — a jump to case 2 would skip the initialisation.",
          },
        },
        {
          language: "java",
          code: `int day = 1;

// THE BUG — no breaks
switch (day) {
    case 1: System.out.println("Monday");
    case 2: System.out.println("Tuesday");
    case 3: System.out.println("Wednesday");
}
// prints Monday, Tuesday, AND Wednesday

// THE TOOL — stacked labels
char c = 'e';
switch (c) {
    case 'a':
    case 'e':
    case 'i':
    case 'o':
    case 'u':
        System.out.println("vowel");
        break;
    default:
        System.out.println("consonant");
}

// The arrow form removes the hazard entirely
switch (day) {
    case 1 -> System.out.println("Monday");
    case 2 -> System.out.println("Tuesday");
    case 3 -> System.out.println("Wednesday");
}
// prints Monday only`,
          annotations: {
            25: "Each arrow branch ends by itself, so a forgotten break is not a possible mistake.",
          },
        },
        {
          language: "python",
          code: `# Fall-through does not exist in Python. match/case cannot produce the bug.
day = 1

match day:
    case 1:
        print("Monday")
    case 2:
        print("Tuesday")
    case 3:
        print("Wednesday")
# prints Monday only — the branch ends on its own

# Grouping values uses | rather than stacked labels
c = "e"
match c:
    case "a" | "e" | "i" | "o" | "u":
        print("vowel")
    case _:
        print("consonant")

# The pre-3.10 equivalent, which works on any version
if c in "aeiou":
    print("vowel")
else:
    print("consonant")`,
          annotations: {
            11: "There is no way to write the cascade bug here, because branches do not run into each other.",
            22: "Membership testing expresses the grouped case more directly than any switch form.",
          },
        },
      ],
    },
    {
      name: "Multi-Way Branching in Python",
      idea: "Choose among Python's three real options, since the language has no switch statement.",
      steps: [
        "Determine whether the branching is a value-to-value mapping or genuinely runs different logic.",
        "For a value-to-value mapping, build a dictionary and look the value up.",
        "Supply a default to the lookup so a missing key does not raise an error.",
        "For different logic per branch on Python 3.10 or later, use match/case.",
        "For anything involving ranges, or when the Python version may be older, use an if/elif ladder.",
      ],
      code: [
        {
          language: "python",
          code: `day = 3

# 1. Dictionary dispatch — best for value-to-value mapping
days = {1: "Monday", 2: "Tuesday", 3: "Wednesday"}
print(days.get(day, "Invalid day"))   # Wednesday

# The second argument to .get is the default, replacing a default: branch.
# Lookup is one operation no matter how many entries exist.

# Mapping to functions rather than values
def add(a, b): return a + b
def sub(a, b): return a - b

ops = {"+": add, "-": sub}
op = "+"
print(ops[op](5, 3))   # 8

# 2. match/case — Python 3.10+, when branches run different logic
match day:
    case 1 | 2 | 3 | 4 | 5:
        print("Weekday")
    case 6 | 7:
        print("Weekend")
    case _:
        print("Invalid day")

# 3. if/elif ladder — every version, and the only option for ranges
score = 85
if score >= 90:
    print("A")
elif score >= 80:
    print("B")     # this runs
else:
    print("F")`,
          annotations: {
            5: "A dict lookup does not scan the entries, unlike a ladder testing each condition in turn.",
            15: "Mapping values to functions is how Python expresses a command dispatcher.",
            29: "No switch in any language handles ranges. This is ladder territory in C++ and Java too.",
          },
        },
        {
          language: "cpp",
          code: `// For comparison: the same three intents in C++

// Value-to-value mapping — a map replaces dictionary dispatch
#include <map>
#include <string>
using namespace std;

map<int, string> days = {{1, "Monday"}, {2, "Tuesday"}, {3, "Wednesday"}};
int day = 3;

auto it = days.find(day);
cout << (it != days.end() ? it->second : "Invalid day") << endl;   // Wednesday

// Different logic per branch — this is what switch is for
switch (day) {
    case 1: cout << "start of week" << endl; break;
    case 6:
    case 7: cout << "weekend" << endl; break;
    default: cout << "midweek" << endl;
}

// Ranges — switch cannot express these, so a ladder is required
int score = 85;
if (score >= 90)      cout << "A" << endl;
else if (score >= 80) cout << "B" << endl;
else                  cout << "F" << endl;`,
          annotations: {
            11: "find plus a check is the C++ equivalent of .get with a default.",
            22: "Case labels must be single constants, so no switch can express score >= 80.",
          },
        },
        {
          language: "java",
          code: `// For comparison: the same three intents in Java
import java.util.Map;

int day = 3;

// Value-to-value mapping
Map<Integer, String> days = Map.of(1, "Monday", 2, "Tuesday", 3, "Wednesday");
System.out.println(days.getOrDefault(day, "Invalid day"));   // Wednesday

// Different logic per branch
switch (day) {
    case 1 -> System.out.println("start of week");
    case 6, 7 -> System.out.println("weekend");
    default -> System.out.println("midweek");
}

// Ranges — ladder required
int score = 85;
if (score >= 90)      System.out.println("A");
else if (score >= 80) System.out.println("B");
else                  System.out.println("F");`,
          annotations: {
            8: "getOrDefault is the direct counterpart of Python's dict.get with a fallback.",
          },
        },
      ],
    },
  ],

  examples: [
    {
      input: "day = 3 in a switch with cases 1, 2, 3 and a default, each ending in break",
      output: "Wednesday",
      walkthrough: [
        "The expression day is evaluated once, producing 3.",
        "Control jumps directly to the label case 3 — cases 1 and 2 are not compared or examined at all.",
        "The statements under case 3 run, printing Wednesday.",
        "The break is reached, which exits the switch immediately.",
        "The default block is skipped, and execution continues after the closing brace.",
      ],
      why: "Shows the jump model explicitly: unlike a ladder, the earlier cases were never tested, only bypassed.",
    },
    {
      input: "day = 1 in a switch whose cases have no break statements",
      output: "Monday, then Tuesday, then Wednesday — all three",
      walkthrough: [
        "The expression evaluates to 1 and control jumps to case 1.",
        "Monday is printed.",
        "With no break, execution simply continues to the next line, which happens to be under case 2.",
        "The case 2 label is not a barrier — it is only an entry point, and execution is already inside the switch.",
        "Tuesday is printed, then execution continues into case 3 and prints Wednesday.",
        "The switch ends only because there are no more statements, not because anything stopped it.",
      ],
      why: "The most common switch bug, and it produces extra output rather than an error — so it is often mistaken for a problem elsewhere.",
    },
    {
      input: "c = 'e' in a switch with cases 'a', 'e', 'i', 'o', 'u' stacked above one shared block",
      output: "vowel",
      walkthrough: [
        "The expression evaluates to the character e and control jumps to case 'e'.",
        "There are no statements under that label, so execution falls straight through to the next.",
        "It continues past case 'i', case 'o' and case 'u', all of which are also empty.",
        "It reaches the shared block and prints vowel.",
        "The break exits the switch before the default block can run.",
      ],
      why: "The same fall-through that caused the previous bug, used deliberately — which is why the behaviour exists rather than being a design flaw.",
    },
  ],

  visualization: {
    kind: "code-flow",
    description:
      "Contrast two execution models side by side using the same input. The LADDER side draws stacked diamonds with a token descending and testing each in turn, dimming the failures. The SWITCH side draws the cases as a vertical column of labelled doors down the left edge of a single continuous corridor, with the expression evaluated once into a value chip that flies directly to its matching door — no other door is touched, and the doors above it stay completely unlit to make clear they were bypassed rather than tested. This is the core distinction and should be animated simultaneously on both sides. Then teach the exit: once the token is inside the corridor it moves downward only. Draw each break as a solid wall spanning the corridor, and animate the token stopping at it and exiting sideways out of the switch. Now remove the walls and replay — the token walks down past every subsequent case label, and the labels are drawn as doorframes with no barrier, so it is visually obvious that a label stops nothing. Each block it passes through fires its output, accumulating the cascade. Finally show the grouped-labels case: several doors open into the same stretch of corridor with no walls between them, the token enters at its own door, walks the short empty stretch, and reaches the single shared block before the one wall. Keep a side note panel showing Python, where the corridor is replaced by separate sealed rooms with no downward passage at all.",
    sampleInput:
      '{"expression":"day","value":1,"cases":[{"label":1,"body":"print Monday","break":false},{"label":2,"body":"print Tuesday","break":false},{"label":3,"body":"print Wednesday","break":false}],"variants":[{"name":"with-breaks","breaks":[1,2,3],"output":["Monday"]},{"name":"without-breaks","breaks":[],"output":["Monday","Tuesday","Wednesday"]},{"name":"grouped","expression":"c","value":"e","labels":["a","e","i","o","u"],"sharedBody":"print vowel","output":["vowel"]}],"python":{"construct":"match/case","fallThrough":false}}',
    highlights: [
      "The ladder side tests each diamond in turn, dimming the ones that fail before reaching a match.",
      "The switch side evaluates the expression once into a value chip that flies straight to its matching door.",
      "Doors above the match stay unlit — they were bypassed, never compared.",
      "Inside the corridor the token moves downward only, and a break is drawn as a solid wall across it.",
      "The token meets the wall and exits sideways out of the switch, leaving the blocks below untouched.",
      "With the walls removed, the token walks past the next case label — drawn as a doorframe with no barrier.",
      "It continues through each following block in turn, and the outputs accumulate into the cascade.",
      "The label was never a stopping point; only the wall was, and there is no longer one.",
      "In the grouped variant, five doors open onto the same empty stretch of corridor with no walls between them.",
      "The token enters at its own door, walks the empty stretch, and reaches the single shared block before the one wall.",
      "The Python panel shows sealed rooms instead of a corridor — no downward passage exists, so the cascade cannot occur.",
    ],
  },

  edgeCases: [
    "The final case without a break, which works until someone adds a new case after it.",
    "A default placed in the middle of the switch, which still only runs when nothing matched but can be fallen into from above.",
    "A switch whose expression matches no case and which has no default, where nothing runs at all.",
    "An empty case label immediately followed by another, which is the mechanism behind deliberate grouping.",
    "Declaring a variable directly inside a case without braces in C++, which the compiler rejects because a jump would skip its initialisation.",
    "Duplicate case values, which is a compile error in both C++ and Java.",
    "A switch on a char, where the label must be written in single quotes to be a character rather than a string.",
    "Running match/case on a Python version older than 3.10, where it is a syntax error rather than an unsupported feature.",
    "A match/case with no wildcard branch, where an unmatched value falls through silently just as a missing default does.",
  ],

  pitfalls: [
    "Forgetting a break, so execution falls through into the following cases and produces extra output with no error.",
    "Trying to switch on a range, which no switch in any language supports — the labels must be single fixed values.",
    "Using a variable as a case label, which requires a compile-time constant in both C++ and Java.",
    "Switching on a string in C++, which is not allowed, unlike Java where it has been legal since version 7.",
    "Omitting default and silently doing nothing when an unexpected value arrives.",
    "Placing default in the middle, where it can be fallen into from the case above it.",
    "Declaring a variable inside a case in C++ without wrapping the case body in braces.",
    "Assuming Python has a switch statement, or that match/case behaves like one with fall-through.",
    "Using match/case in code that must run on Python 3.9 or earlier, where it does not parse.",
    "Reaching for switch when the branching involves two different variables, which requires a ladder.",
  ],

  commonDoubts: [
    {
      question: "Why do all my cases run instead of just the matching one?",
      answer:
        "Because you are missing break statements. A case label marks where execution starts, not where it stops — once control has jumped in, it keeps running downward through every following case until it meets a break or the end of the switch. The labels it passes are not barriers. Add a break at the end of each case whose code should not continue into the next one.",
    },
    {
      question: "When should I use switch instead of an else-if ladder?",
      answer:
        "Use switch when every branch compares the same single variable against a fixed value. It removes the repeated variable and operator, and it jumps straight to the match rather than testing each condition in turn. Use a ladder whenever the branching involves a range, a comparison other than equality, or more than one variable — switch cannot express any of those, since each label must be one constant value.",
    },
    {
      question: "Can I use a switch for ranges like score >= 90?",
      answer:
        "No. Every case label must be a single compile-time constant, so there is no way to write case >= 90 or case 80..89. This is the hard boundary between the two constructs, and grade bands are the classic example that must stay a ladder. The nearest workaround — switching on score / 10 to turn each band into a single value — works but obscures the intent, so prefer the ladder.",
    },
    {
      question: "Does Python have a switch statement?",
      answer:
        "No. Python has three alternatives instead. An if/elif ladder works on every version and is the only option for ranges. A dictionary lookup is idiomatic for mapping a value to another value or to a function, and .get supplies the default. From Python 3.10 there is match/case, which looks like a switch and covers the same simple cases, but it is structural pattern matching underneath — there is no fall-through and therefore no break.",
    },
    {
      question: "Is fall-through ever intentional?",
      answer:
        "Yes, in one situation: grouping several values onto one block. Stack the case labels with no statements between them, put the shared code after the last label, and end it with a single break. Any of those values enters at its own label and falls through the empty ones to the common body. That is the clearest way to say these values are equivalent. Fall-through between cases that each have their own code is almost always a mistake.",
    },
    {
      question: "Why can't I declare a variable inside a case in C++?",
      answer:
        "Because a switch jumps directly to a label, and jumping to a later case would skip past the initialisation of a variable that is nonetheless still in scope there. The compiler rejects that rather than allowing an uninitialised variable to be reachable. Wrap the case body in its own braces and the variable gets a scope that ends before the next label, which resolves it.",
    },
    {
      question: "Do I always need a default?",
      answer:
        "Not always, but write one unless you have deliberately decided otherwise. Without it, a value matching no case does nothing at all — which is correct when ignoring unexpected input is intended, and a silent bug when it is not. It is also the natural place to signal that something unexpected arrived, which is more useful than falling out of the switch with no trace.",
    },
    {
      question: "What is Java's arrow syntax, and should I use it?",
      answer:
        "Java 14 added case 1 -> statement; as an alternative to the colon form. Each branch ends by itself, so there is no break and no fall-through, and multiple values are listed with commas rather than stacked labels. Prefer it in new Java code — it removes the most common switch bug at the syntax level. Learn the colon form too, since it is what appears in existing Java code and in all C++.",
    },
  ],

  relatedIds: ["else-if-ladder", "if-else-statements", "break-and-continue"],
};

export default content;
