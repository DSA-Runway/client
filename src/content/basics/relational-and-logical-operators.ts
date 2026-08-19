import type { SubtopicContent } from "../types";

/**
 * Subtopic 6 of Basics. These operators produce the booleans that every if and
 * loop consumes, so this is the last lesson before control flow begins.
 *
 * Three traps get explicit treatment because each is silent rather than loud:
 * = instead of == (compiles in C++), == on Java strings (works often enough to
 * hide the bug), and chained comparisons (correct in Python, always-true in C++).
 * Short-circuit evaluation is taught as a tool, not trivia — it is the standard
 * bounds guard in array code.
 */
const content: SubtopicContent = {
  id: "relational-and-logical-operators",
  topic: "Basics",
  title: "Relational and Logical Operators",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "introduction-to-programming",
    "data-types",
    "variables-and-constants",
    "arithmetic-operators",
  ],

  summary:
    "Asking yes-or-no questions about values and combining the answers — the operators that produce every condition an if statement or loop will ever test.",

  theory: `
## Comparisons produce booleans

Arithmetic operators take numbers and give you a number. **Relational operators take
values and give you a boolean** — true or false. That boolean is what every \`if\`
and every loop condition actually consumes, which makes this the last piece of
groundwork before control flow.

| Operator | Asks | \`a = 7, b = 2\` |
|---|---|---|
| \`==\` | Are they equal? | false |
| \`!=\` | Are they different? | true |
| \`>\` | Is the left larger? | true |
| \`<\` | Is the left smaller? | false |
| \`>=\` | Larger or equal? | true |
| \`<=\` | Smaller or equal? | false |

Java and Python have a genuine \`boolean\`/\`bool\` type and print \`true\`/\`True\`. C++
has \`bool\` too, but prints it as \`1\` and \`0\` unless you ask otherwise — the value is
a real boolean, only the display is numeric.

## The single most expensive typo

\`=\` assigns. \`==\` compares. They look almost identical and mean nothing alike.

**In C++ this compiles**:

\`\`\`
if (x = 5) { ... }
\`\`\`

It assigns 5 to \`x\`, then treats the result as a condition. Since 5 is non-zero, the
condition is **always true**, and \`x\` has been silently overwritten. No error, no
warning by default.

Java rejects it — an \`if\` requires a \`boolean\`, and an int assignment is not one.
Python rejects it too, as a syntax error, because assignment is a statement and
cannot appear inside a condition at all. So this is a C++ hazard specifically, and
the habit that avoids it is to read \`==\` aloud as "is equal to" every time you type it.

## Comparing things that are not numbers

Numbers compare exactly as you'd expect. Two other cases do not.

**Floating point.** Never use \`==\` on decimals. \`0.1 + 0.2 == 0.3\` is **false**,
because neither value is stored exactly. Compare the difference against a small
tolerance instead: \`abs(a - b) < 0.000001\`.

**Java strings.** This one deserves emphasis because it fails *intermittently*, which
is worse than failing always. In Java, \`==\` on objects compares **references** — are
these two names pointing at the same object — not contents. Two strings with
identical text can live at different addresses and compare as unequal. Use
\`.equals()\` for Java strings, always.

What makes it genuinely dangerous: Java reuses identical string *literals* from a
shared pool, so \`"hello" == "hello"\` is usually true. The bug hides during testing
and appears the moment a string arrives from input or is built at runtime.

C++ has no such problem — \`std::string\` compares by content with \`==\`. Python has a
matching distinction: \`==\` compares values, \`is\` compares identity. Use \`==\` unless
you specifically mean "the same object", and reserve \`is\` for \`None\`.

## Combining conditions

Three logical operators let you build compound conditions.

| Meaning | C++ / Java | Python |
|---|---|---|
| AND — both must hold | \`&&\` | \`and\` |
| OR — at least one holds | \`\\|\\|\` | \`or\` |
| NOT — flip it | \`!\` | \`not\` |

**AND** — true only when both sides are true:

| A | B | A AND B |
|---|---|---|
| true | true | **true** |
| true | false | false |
| false | true | false |
| false | false | false |

**OR** — true when at least one side is true:

| A | B | A OR B |
|---|---|---|
| true | true | **true** |
| true | false | **true** |
| false | true | **true** |
| false | false | false |

**NOT** simply inverts: \`!true\` is false, \`!false\` is true.

## Short-circuit evaluation

This is the part worth understanding properly, because it's a tool rather than a
detail.

Logical operators evaluate **left to right and stop as soon as the answer is
certain**.

- With \`&&\`, if the left side is false the whole thing is false no matter what
  follows — so **the right side is never evaluated at all**.
- With \`||\`, if the left side is true the result is already decided, and again the
  right side is skipped.

That behaviour is what makes this idiom safe, and you will write it constantly:

\`\`\`
if (i < n && arr[i] == target)
\`\`\`

When \`i\` equals \`n\`, the left side is false, so \`arr[i]\` is **never touched** and no
out-of-bounds access occurs. Reverse the order and the program crashes:

\`\`\`
if (arr[i] == target && i < n)   // reads out of bounds first
\`\`\`

**Order your conditions so the guard comes first.** This is the single most practical
takeaway of the subtopic.

Note that C++ and Java also have \`&\` and \`|\`, which look similar but always evaluate
both sides. Using \`&\` where you meant \`&&\` removes the protection above.

## Precedence

From tightest to loosest binding:

1. \`!\` / \`not\`
2. Relational operators: \`<\`, \`>\`, \`<=\`, \`>=\`
3. Equality: \`==\`, \`!=\`
4. \`&&\` / \`and\`
5. \`||\` / \`or\`

Because relational binds tighter than logical, \`a < b && c < d\` groups the way you'd
expect without parentheses. And because \`&&\` binds tighter than \`||\`,
\`a || b && c\` means \`a || (b && c)\`. When mixing the two, add parentheses — the
reader should not have to remember this table.

## Chained comparisons: a real divergence

**Python supports mathematical chaining**, and it means what it looks like:

\`\`\`
if 1 <= x <= 10:      # Python: true when x is between 1 and 10
\`\`\`

**C++ does not, and does not warn you.** \`1 <= x <= 10\` evaluates \`1 <= x\` first,
producing \`true\` or \`false\`, which then converts to \`1\` or \`0\`. Comparing that against
\`10\` is **always true**. The code compiles, runs, and is silently wrong.

Java is stricter and rejects it at compile time, because comparing a boolean against
an int is not allowed. So the same line is correct in one language, a compile error
in another, and a silent bug in the third. In C++ and Java, write it out:
\`x >= 1 && x <= 10\`.

## De Morgan's laws

Negating a compound condition flips both the operands and the connector:

\`\`\`
!(A && B)   is the same as   !A || !B
!(A || B)   is the same as   !A && !B
\`\`\`

The connector changes. Getting this wrong — writing \`!A && !B\` for \`!(A && B)\` — is a
common and genuinely hard-to-spot bug, because the two agree in some cases and
differ in others.
`.trim(),

  intuition:
    "A relational operator turns values into a yes-or-no answer, and a logical operator combines those answers. Because the combination stops as soon as it knows the result, the order you write your conditions in is not cosmetic — it decides what gets evaluated at all.",

  approaches: [
    {
      name: "Comparing Two Values",
      idea: "Ask a yes-or-no question about two values and receive a boolean.",
      steps: [
        "Choose the two values to compare.",
        "Pick the operator matching the question you are asking.",
        "The comparison evaluates to true or false.",
        "For decimals, compare the difference against a small tolerance rather than testing exact equality.",
        "For text and objects, use the language's content-comparison method rather than assuming the operator compares contents.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
#include <cmath>
#include <string>
using namespace std;

int main() {
    int a = 7, b = 2;

    cout << (a == b) << endl;   // 0  (false, printed as 0)
    cout << (a != b) << endl;   // 1  (true)
    cout << (a > b)  << endl;   // 1
    cout << (a <= b) << endl;   // 0
    cout << boolalpha << (a > b) << endl;   // true

    // Floating point: never compare with ==
    double x = 0.1 + 0.2;
    cout << (x == 0.3) << endl;              // 0  — surprising but correct
    cout << (fabs(x - 0.3) < 1e-9) << endl;  // 1  — the right way

    // C++ strings compare by content
    string s1 = "hello", s2 = "hello";
    cout << (s1 == s2) << endl;   // 1`,
          annotations: {
            13: "boolalpha switches the stream to printing true/false instead of 1/0.",
            17: "The stored values are very slightly off, so exact equality fails.",
            21: "Unlike Java, C++ std::string compares contents with ==.",
          },
        },
        {
          language: "java",
          code: `public class Compare {
    public static void main(String[] args) {
        int a = 7, b = 2;

        System.out.println(a == b);   // false
        System.out.println(a != b);   // true
        System.out.println(a > b);    // true
        System.out.println(a <= b);   // false

        // Floating point: never compare with ==
        double x = 0.1 + 0.2;
        System.out.println(x == 0.3);                 // false
        System.out.println(Math.abs(x - 0.3) < 1e-9); // true

        // Strings: == compares references, not contents
        String s1 = "hello";
        String s2 = new String("hello");
        System.out.println(s1 == s2);        // false  <- the trap
        System.out.println(s1.equals(s2));   // true   <- always use this

        String s3 = "hello";
        System.out.println(s1 == s3);        // true — literals share a pool
    }
}`,
          annotations: {
            18: "Same text, different objects. == asks whether they are the same object, and they are not.",
            22: "This is why the bug hides: with literals it usually works, so tests pass until a string comes from input.",
          },
        },
        {
          language: "python",
          code: `a, b = 7, 2

print(a == b)   # False
print(a != b)   # True
print(a > b)    # True
print(a <= b)   # False

# Floating point: never compare with ==
x = 0.1 + 0.2
print(x == 0.3)              # False
print(abs(x - 0.3) < 1e-9)   # True

# Strings compare by value
s1, s2 = "hello", "".join(["hel", "lo"])
print(s1 == s2)   # True   <- same contents
print(s1 is s2)   # False  <- different objects

# Chained comparison — valid Python, and it means what it looks like
x = 5
print(1 <= x <= 10)   # True`,
          annotations: {
            15: "== asks about value; is asks whether it is literally the same object in memory.",
            19: "This line is a silent bug in C++ and a compile error in Java. Only Python reads it mathematically.",
          },
        },
      ],
    },
    {
      name: "Combining Conditions with AND, OR, NOT",
      idea: "Build a compound condition from several simple ones.",
      steps: [
        "Write each simple condition separately and confirm it produces a boolean.",
        "Join them with AND when every condition must hold.",
        "Join them with OR when any one of them is enough.",
        "Apply NOT to invert a condition.",
        "Add parentheses whenever AND and OR appear in the same expression.",
      ],
      code: [
        {
          language: "cpp",
          code: `int age = 20;
bool hasID = true;
int score = 85;

cout << (age >= 18 && hasID)        << endl;   // 1  both true
cout << (age < 13 || age > 65)      << endl;   // 0  neither true
cout << (!hasID)                    << endl;   // 0  inverted

// Parenthesise when mixing && and ||
bool eligible = (age >= 18 && hasID) || score > 90;
cout << eligible << endl;   // 1

// De Morgan: these two are equivalent
cout << (!(age >= 18 && hasID))     << endl;   // 0
cout << (age < 18 || !hasID)        << endl;   // 0`,
          annotations: {
            10: "Without parentheses this still means the same thing, because && binds tighter — but writing them saves the reader from having to know that.",
            14: "Negating an AND produces an OR, and each side flips. Writing !a && !b here would be wrong.",
          },
        },
        {
          language: "java",
          code: `int age = 20;
boolean hasID = true;
int score = 85;

System.out.println(age >= 18 && hasID);     // true
System.out.println(age < 13 || age > 65);   // false
System.out.println(!hasID);                 // false

boolean eligible = (age >= 18 && hasID) || score > 90;
System.out.println(eligible);   // true

// De Morgan
System.out.println(!(age >= 18 && hasID));  // false
System.out.println(age < 18 || !hasID);     // false

// & and | exist too, but always evaluate both sides — prefer && and ||
System.out.println(age >= 18 & hasID);      // true, no short-circuit`,
          annotations: {
            17: "Single & gives the same answer here but loses short-circuit protection, which matters when the right side can fail.",
          },
        },
        {
          language: "python",
          code: `age = 20
has_id = True
score = 85

print(age >= 18 and has_id)      # True
print(age < 13 or age > 65)      # False
print(not has_id)                # False

eligible = (age >= 18 and has_id) or score > 90
print(eligible)   # True

# De Morgan
print(not (age >= 18 and has_id))   # False
print(age < 18 or not has_id)       # False

# Python treats empty values as false in a condition
print(bool([]), bool(""), bool(0))       # False False False
print(bool([1]), bool("a"), bool(42))    # True True True`,
          annotations: {
            5: "Python spells the operators as words. Writing && is a syntax error.",
            17: "Empty containers, empty strings and zero are all falsy, which is why 'if my_list:' is idiomatic Python.",
          },
        },
      ],
    },
    {
      name: "Short-Circuit Evaluation as a Guard",
      idea: "Order conditions so a check that could fail is protected by one that runs first.",
      steps: [
        "Identify the condition that could fail or crash — an array access, a division, a call on something possibly absent.",
        "Identify the condition that makes it safe — a bounds check, a non-zero check, a presence check.",
        "Place the safety check on the left of the AND.",
        "Place the risky condition on the right, where it only runs if the guard passed.",
        "For OR, place the cheap or decisive condition on the left so the expensive one is often skipped.",
      ],
      code: [
        {
          language: "cpp",
          code: `vector<int> arr = {3, 7, 1};
int n = arr.size();
int i = 3;              // deliberately out of range
int target = 7;

// SAFE: the bounds check runs first and stops evaluation
if (i < n && arr[i] == target) {
    cout << "found" << endl;
}

// UNSAFE: arr[i] is read before anything checks i
// if (arr[i] == target && i < n) { ... }   // undefined behaviour

// Same idea protecting a division
int count = 0, total = 50;
if (count != 0 && total / count > 10) {
    cout << "high average" << endl;
}`,
          annotations: {
            8: "i < n is false, so the right side is never evaluated and arr[3] is never read.",
            16: "Guarding a division the same way avoids dividing by zero.",
          },
        },
        {
          language: "java",
          code: `int[] arr = {3, 7, 1};
int n = arr.length;
int i = 3;              // out of range
int target = 7;

// SAFE
if (i < n && arr[i] == target) {
    System.out.println("found");
}

// UNSAFE — throws ArrayIndexOutOfBoundsException
// if (arr[i] == target && i < n) { ... }

// The most common Java use: guarding against null
String name = null;
if (name != null && name.length() > 0) {
    System.out.println(name);
}`,
          annotations: {
            16: "Without short-circuit, name.length() would throw a NullPointerException. This idiom is everywhere in Java.",
          },
        },
        {
          language: "python",
          code: `arr = [3, 7, 1]
n = len(arr)
i = 3              # out of range
target = 7

# SAFE
if i < n and arr[i] == target:
    print("found")

# UNSAFE — raises IndexError
# if arr[i] == target and i < n:
#     ...

# Guarding against None
name = None
if name is not None and len(name) > 0:
    print(name)

# Python idiom: 'and' returns the operand, not just a boolean
print(0 or "fallback")     # fallback
print("value" and 42)      # 42`,
          annotations: {
            19: "In Python these operators return one of the operands rather than True/False, which makes 'or' a neat default-value idiom.",
          },
        },
      ],
    },
  ],

  examples: [
    {
      input: "age = 20, hasID = true; evaluate age >= 18 && hasID",
      output: "true",
      walkthrough: [
        "The left condition age >= 18 is evaluated first, comparing 20 against 18.",
        "20 is greater than 18, so the left side produces true.",
        "Because the left side is true, the result is not yet decided and evaluation continues.",
        "The right operand hasID is already a boolean holding true.",
        "AND requires both sides to be true, and both are, so the whole expression is true.",
      ],
      why: "Shows the left-to-right order explicitly, which is the foundation the short-circuit behaviour is built on.",
    },
    {
      input: "arr has 3 elements, i = 3; evaluate i < n && arr[i] == target",
      output: "false, with no crash",
      walkthrough: [
        "The left condition i < n compares 3 against 3.",
        "3 is not less than 3, so the left side produces false.",
        "With AND, a false left operand decides the whole expression regardless of the right side.",
        "Evaluation stops immediately and arr[3] is never read.",
        "Reversing the order would read arr[3] first, which is out of bounds and crashes before any check runs.",
      ],
      why: "The bounds-guard idiom in the exact situation it exists for, and the reason condition order is a correctness concern rather than style.",
    },
    {
      input: "x = 20; evaluate 1 <= x <= 10 in C++, Java, and Python",
      output: "C++: true (wrong). Java: compile error. Python: False (correct).",
      walkthrough: [
        "In C++, 1 <= x is evaluated first and produces true because 20 is greater than 1.",
        "That boolean converts to the integer 1, and the expression becomes 1 <= 10.",
        "That is true, so the condition passes even though 20 is far outside the range — and it would pass for every value of x.",
        "In Java the same first step produces a boolean, and comparing a boolean against an int is illegal, so compilation fails.",
        "In Python the chain is read mathematically as both 1 <= x and x <= 10, and since 20 exceeds 10 it correctly evaluates to False.",
      ],
      why: "One line, three different outcomes. It is the clearest case of a habit from one language producing a silent bug in another.",
    },
  ],

  visualization: {
    kind: "code-flow",
    description:
      "Two linked panels. The TRUTH TABLE panel draws AND, OR and NOT as small grids with every input combination as a row; as the student changes the operand values, the matching row lights up and the others dim, so the table is read as a lookup rather than memorised. The SHORT-CIRCUIT panel is the important one: lay the compound expression out horizontally with each operand in its own box and the connector between them, and send an evaluation token left to right. When the token resolves the left operand of an AND to false, draw the connector severing, dim the right operand box so it is visibly never entered, and jump the token straight to a false result. Underneath the right operand, show the array access it contains with an index pointer aimed past the end of a drawn array — greyed out, to make explicit that the dangerous read did not happen. Then replay with the operands swapped: the token reaches the array access first, the index pointer lands outside the array bounds, and the whole panel flashes an out-of-bounds failure before any check runs. Finish with the OR case, where a true left operand severs the connector in the same way.",
    sampleInput:
      '{"array":[3,7,1],"n":3,"i":3,"target":7,"expressions":[{"form":"guarded","left":"i < n","right":"arr[i] == target","leftResult":false,"rightEvaluated":false,"outcome":"false, safe"},{"form":"unguarded","left":"arr[i] == target","right":"i < n","leftResult":"crash","rightEvaluated":false,"outcome":"out of bounds"}],"tables":["AND","OR","NOT"]}',
    highlights: [
      "The AND grid shows all four input rows, with only the true-true row producing true.",
      "Changing an operand lights the matching row and dims the rest, showing the table being looked up rather than recited.",
      "The guarded expression is laid out as two operand boxes joined by an AND connector, with the token waiting at the left.",
      "The token evaluates i < n with i = 3 and n = 3, and the box resolves to false.",
      "The connector severs — the right operand box dims and the token jumps directly to a false result.",
      "Beneath the dimmed box, the array access arr[3] is shown greyed out with its pointer past the end of the array, never fired.",
      "Replay with the operands swapped: the token now hits arr[3] first, the pointer lands outside the array, and the panel flashes an out-of-bounds failure.",
      "The OR case: a true left operand severs the connector the same way, because the result is already decided.",
    ],
  },

  edgeCases: [
    "Comparing two floating-point values that are mathematically equal but stored slightly differently, where == returns false.",
    "Comparing Java strings built at runtime rather than written as literals, where == fails even though the text matches.",
    "An assignment inside a C++ condition, which compiles and produces a condition that is true whenever the assigned value is non-zero.",
    "Chained comparisons in C++, which compile and evaluate to a constant true rather than the intended range test.",
    "Using & instead of && when the right operand would crash, which removes the protection and evaluates it anyway.",
    "Comparing values of different types, where one may be silently converted before the comparison happens.",
    "Python's and/or returning one of the operands rather than a boolean, which is useful but surprising if you expected True or False.",
    "Comparing a signed and an unsigned integer in C++, where the signed value may convert to a large positive number.",
  ],

  pitfalls: [
    "Writing = where you meant ==. In C++ this compiles, assigns, and makes the condition always true.",
    "Using == on Java strings. It compares references, and works often enough with literals to hide the bug until input is involved.",
    "Testing floating-point equality with ==, instead of checking that the difference is below a small tolerance.",
    "Writing 1 <= x <= 10 in C++, which is always true, or in Java, where it fails to compile.",
    "Putting the risky condition before the guard, so the array access or null dereference happens before the check that would have prevented it.",
    "Using & or | in place of && or ||, which evaluates both sides and loses short-circuit protection.",
    "Negating a compound condition without flipping the connector: !(a && b) is !a || !b, not !a && !b.",
    "Mixing && and || without parentheses and relying on precedence the reader has to look up.",
    "Confusing ! with !=, which are unrelated operators despite both containing an exclamation mark.",
  ],

  commonDoubts: [
    {
      question: "Why does if (x = 5) compile in C++?",
      answer:
        "Because assignment is an expression that produces the assigned value, and C++ accepts any value where a condition is expected — anything non-zero counts as true. So x = 5 stores 5 in x and hands back 5, which is treated as true, and the branch runs every time. Your variable was also silently overwritten. Java and Python both reject this, so it is specifically a C++ hazard. Many compilers will warn about it if you enable warnings.",
    },
    {
      question: "Why doesn't == work for comparing strings in Java?",
      answer:
        "Because in Java, == on objects asks whether two names point at the same object, not whether their contents match. Two strings holding identical text can be separate objects and compare as unequal. Use s1.equals(s2) for content comparison, every time. What makes this especially dangerous is that Java stores identical string literals in a shared pool, so \"hello\" == \"hello\" is usually true — the bug passes your tests and appears the moment a string comes from user input.",
    },
    {
      question: "What is short-circuit evaluation and why should I care?",
      answer:
        "Logical operators evaluate left to right and stop as soon as the answer is certain. If the left side of an AND is false, the result is false regardless, so the right side is never evaluated at all. That is not just an optimisation — it is a safety mechanism. Writing if (i < n && arr[i] == target) means arr[i] is only ever read when i is in range. The same idiom guards against null in Java and against dividing by zero everywhere.",
    },
    {
      question: "Why is 1 <= x <= 10 wrong in C++ when it works in Python?",
      answer:
        "Because C++ has no concept of chained comparison. It evaluates 1 <= x first, producing true or false, which then converts to 1 or 0. Comparing that against 10 is true no matter what, so the condition always passes and the code is silently wrong. Java catches it — comparing a boolean against an int does not compile. Python genuinely supports the chain and reads it as both comparisons joined by and. In C++ and Java, write x >= 1 && x <= 10.",
    },
    {
      question: "What is the difference between == and is in Python?",
      answer:
        "== compares values: do these two things hold the same contents. is compares identity: are these two names pointing at the exact same object in memory. Two lists with identical elements are == but not is, because they are separate objects. Use == for almost everything, and reserve is for checking against None, where identity is precisely what you mean.",
    },
    {
      question: "What is the difference between && and & ?",
      answer:
        "&& is the logical AND and short-circuits, skipping the right side when the left already decides the answer. & is the bitwise AND and always evaluates both sides. For boolean conditions they usually produce the same answer, so the mistake is easy to miss — until the right side is an array access or a method call that would crash. Then & evaluates it anyway and the protection you thought you had is gone. Use && for conditions and reserve & for actual bit manipulation.",
    },
    {
      question: "How do I correctly negate a compound condition?",
      answer:
        "Flip both the operands and the connector. The negation of A && B is !A || !B, and the negation of A || B is !A && !B — the AND becomes an OR and vice versa. The common mistake is flipping only the operands and writing !A && !B for !(A && B), which is a different condition that happens to agree in some cases. When in doubt, wrap the whole thing in a single negation and leave the inside untouched.",
    },
    {
      question: "What does an if condition actually receive?",
      answer:
        "A boolean. Relational operators produce one directly, and logical operators combine them into one. C++ is looser: it accepts any value and treats non-zero as true, which is exactly why the = typo goes unnoticed there. Python is looser in a different way — empty containers, empty strings and zero are all falsy, which is why writing if my_list: to mean 'if the list has anything in it' is idiomatic Python. Java is the strictest and demands an actual boolean.",
    },
  ],

  relatedIds: ["if-else-statements", "else-if-ladder", "while-loop", "data-types"],
};

export default content;
