import type { SubtopicContent } from "../types";

/**
 * Subtopic 7 of Basics. Closes the loop opened in data-types and
 * arithmetic-operators: now that the student knows integer division truncates,
 * this is where they learn to fix it — and, more importantly, that the fix only
 * works if the cast happens BEFORE the operation rather than after it.
 *
 * Cast placement is the whole lesson. (double)(sum / count) is the single most
 * common "I already fixed that" bug in beginner DSA code.
 */
const content: SubtopicContent = {
  id: "type-conversion-and-casting",
  topic: "Basics",
  title: "Type Conversion and Casting",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "introduction-to-programming",
    "data-types",
    "variables-and-constants",
    "arithmetic-operators",
  ],

  summary:
    "Turning a value of one type into another — what the language does for you automatically, what you must ask for explicitly, and why where you put the cast changes the answer.",

  theory: `
## Why conversion happens at all

Values have types, but expressions mix them constantly. You divide an integer by a
decimal, add a \`char\` to an \`int\`, or read text from input and need a number out of
it. Something has to reconcile the types before the operation can proceed.

That reconciliation happens two ways:

- **Implicit conversion** — the language does it silently, without being asked.
- **Explicit conversion (casting)** — you demand it in the code.

The rule separating them is about **safety**.

## Widening is automatic, narrowing is not

Arrange the numeric types by how much they can hold:

\`\`\`
byte -> short -> int -> long -> float -> double
\`\`\`

Moving **right** is **widening**. The destination is at least as large as the source,
so nothing is lost, and the language performs it automatically. Assigning an \`int\` to
a \`double\` needs no cast — a \`double\` can hold every \`int\` value.

Moving **left** is **narrowing**. The destination is smaller and the value might not
fit, so the language refuses to do it silently. You must write a cast, which is your
signature saying *I know this may lose data and I accept that*.

In a mixed expression, both operands are promoted to the wider type before the
operation runs. \`int + double\` becomes \`double + double\`, producing a \`double\`.

## What "loss" actually means

Three different things go wrong, and they're worth separating.

**Truncation.** Converting a decimal to an integer does **not round** — it discards
the fractional part. \`(int) 5.9\` is \`5\`, and \`(int) 5.99999\` is also \`5\`. If you want
rounding, ask for it: \`round()\`.

Note the direction on negatives: casting truncates *toward zero*, so \`(int) -5.9\` is
\`-5\`. That is different from floor division, which goes toward negative infinity and
would give \`-6\`. Python's \`int()\` truncates and \`//\` floors, and they disagree on
exactly these cases.

**Overflow.** Narrowing a value that doesn't fit doesn't clamp — it wraps. Casting
\`300\` to a \`byte\` gives \`44\`, because only the low 8 bits survive and the rest are
discarded. No error is reported.

**Precision loss.** This one surprises people because it happens while *widening*.
\`long\` to \`float\` is a widening conversion and needs no cast, yet a \`float\` only
carries about 7 significant digits. A large \`long\` converted to \`float\` comes back
changed. Widening protects the *range*, not the *precision*.

## Where you put the cast decides the answer

This is the most important paragraph in the subtopic.

You know from arithmetic that \`7 / 2\` with two integers gives \`3\`. The instinct is to
cast the result:

\`\`\`
double avg = (double)(sum / count);     // WRONG
\`\`\`

That does not work. The parentheses mean \`sum / count\` runs **first**, as integer
division, producing \`3\`. The cast then faithfully converts \`3\` to \`3.0\`. The half was
destroyed before the cast ever ran, and converting afterwards cannot bring it back.

The cast must happen **before** the division, so the division itself is a
floating-point operation:

\`\`\`
double avg = (double) sum / count;      // CORRECT -> 3.5
\`\`\`

Casting \`sum\` promotes it to \`double\`; \`count\` is then promoted to match; the
division is floating point and the fraction survives.

The identical mistake appears with overflow. From the data-types lesson,
\`(long)(a * b)\` overflows the \`int\` multiplication first and then widens the already
wrong value. \`(long) a * b\` promotes first, so the multiplication happens in 64 bits.

**Cast the operands, not the result.**

## Text and numbers

Input arrives as text and answers leave as text, so this conversion is unavoidable.

| | Text to number | Number to text |
|---|---|---|
| C++ | \`stoi(s)\`, \`stod(s)\` | \`to_string(n)\` |
| Java | \`Integer.parseInt(s)\` | \`String.valueOf(n)\` |
| Python | \`int(s)\`, \`float(s)\` | \`str(n)\` |

None of these are casts in the numeric sense — they parse the characters and build a
new value. If the text isn't a valid number they fail loudly, which is the correct
behaviour: C++ throws \`invalid_argument\`, Java throws \`NumberFormatException\`, Python
raises \`ValueError\`.

One trap: \`int("3.5")\` fails in every language. The text describes a decimal, and the
integer parser doesn't accept a decimal point. Convert through float first —
\`int(float("3.5"))\` — which gives \`3\`.

## Python still needs this

Python has no declared types, but conversion is just as real. It **promotes
automatically** in mixed arithmetic — \`3 + 2.5\` gives \`5.5\` — and it **refuses**
to convert between text and numbers on its own:

\`\`\`
"5" + 5     # TypeError, not "55" and not 10
\`\`\`

That refusal is deliberate. A language that guessed here would silently pick
concatenation or addition, and either choice would be wrong half the time. Python
makes you say which you meant.

## C++ has more than one cast

C++ inherited \`(type) value\` from C and added \`static_cast<type>(value)\`. They do the
same thing for numbers, but \`static_cast\` is checked more carefully by the compiler
and is impossible to miss when reading code. Prefer it. The C-style cast is shorter,
which is exactly why it hides.

Java and Python each have one form, so there is nothing to choose.
`.trim(),

  intuition:
    "Widening is a promise the language can keep, so it happens for free. Narrowing is a promise it cannot keep, so it makes you sign for it. And because conversion happens at a point in time, a cast written after the damage arrives too late to help.",

  approaches: [
    {
      name: "Implicit Conversion in Mixed Expressions",
      idea: "Let the language promote operands automatically when the conversion cannot lose anything.",
      steps: [
        "Write an expression whose operands have different types.",
        "The language finds the wider of the two types.",
        "The narrower operand is promoted to that wider type.",
        "The operation runs with both operands now at the same type.",
        "The result carries the wider type, which may need a wider variable to hold it.",
      ],
      code: [
        {
          language: "cpp",
          code: `int    count = 3;
double price = 2.5;

double total = count * price;   // int promoted to double -> 7.5
cout << total << endl;

int    small = 42;
double wide  = small;    // widening: automatic, no cast needed
cout << wide << endl;    // 42

char c = 'A';
int  code = c;           // char promoted to its numeric value
cout << code << endl;    // 65

// Widening still loses precision here:
long long big = 123456789012345LL;
float  lossy  = big;     // no cast required, yet the value changes
cout << (long long)lossy << endl;   // 123456790519808`,
          annotations: {
            4: "count is promoted to double before the multiplication, so the fraction survives.",
            17: "float carries about 7 significant digits. Widening protects range, not precision.",
          },
        },
        {
          language: "java",
          code: `int    count = 3;
double price = 2.5;

double total = count * price;   // int promoted to double -> 7.5
System.out.println(total);

int    small = 42;
double wide  = small;    // widening: automatic
System.out.println(wide);   // 42.0

char c = 'A';
int  code = c;           // char widens to int
System.out.println(code);   // 65

// Widening that still loses precision
long  big   = 123456789012345L;
float lossy = big;       // legal without a cast, but the value changes
System.out.println((long) lossy);   // 123456788103168`,
          annotations: {
            8: "Java's widening order is byte, short, int, long, float, double — and char widens to int.",
            17: "long to float is widening by Java's rules, yet float cannot represent this many digits.",
          },
        },
        {
          language: "python",
          code: `count = 3
price = 2.5

total = count * price   # int promoted to float -> 7.5
print(total)

print(3 + 2.5)      # 5.5   mixed arithmetic promotes to float
print(10 / 2)       # 5.0   true division always produces a float
print(True + True)  # 2     bool is a subclass of int

# Python will NOT convert between text and numbers on its own
# print("5" + 5)    ->  TypeError: can only concatenate str to str`,
          annotations: {
            9: "Python promotes int to float automatically, the same way C++ and Java do.",
            13: "Deliberate refusal. Guessing between \"55\" and 10 would be wrong half the time.",
          },
        },
      ],
    },
    {
      name: "Explicit Casting and Where to Put It",
      idea: "Force a conversion the language will not do for you — and place it before the operation, not after.",
      steps: [
        "Identify the operation that is running at the wrong type.",
        "Determine which operand needs converting so the operation itself changes behaviour.",
        "Apply the cast to that operand, not to the finished result.",
        "The other operand is promoted automatically to match.",
        "Confirm the operation now runs at the intended type by checking a case where the two would differ.",
      ],
      code: [
        {
          language: "cpp",
          code: `int sum = 7, count = 2;

double wrong = (double)(sum / count);   // 3.0  — division happened first
double right = (double) sum / count;    // 3.5  — cast happened first
cout << wrong << " " << right << endl;

// static_cast is the preferred C++ form
double best = static_cast<double>(sum) / count;   // 3.5

// The same ordering rule for overflow
int a = 100000, b = 100000;
long long bad  = (long long)(a * b);    // -1794967296  overflowed first
long long good = (long long) a * b;     // 10000000000  promoted first

// Narrowing truncates, it does not round
cout << (int) 5.9  << endl;   //  5
cout << (int) -5.9 << endl;   // -5   toward zero, not floor
cout << (int) round(5.9) << endl;   // 6`,
          annotations: {
            3: "The parentheses force integer division to complete before the cast is applied.",
            13: "a * b overflows as int, and widening the wrong value afterwards cannot recover it.",
            18: "Casting truncates toward zero. Use round() when you actually want rounding.",
          },
        },
        {
          language: "java",
          code: `int sum = 7, count = 2;

double wrong = (double)(sum / count);   // 3.0
double right = (double) sum / count;    // 3.5
System.out.println(wrong + " " + right);

// Same ordering rule for overflow
int a = 100000, b = 100000;
long bad  = (long)(a * b);    // -1794967296
long good = (long) a * b;     // 10000000000

// Narrowing truncates toward zero
System.out.println((int) 5.9);    //  5
System.out.println((int) -5.9);   // -5
System.out.println(Math.round(5.9));   // 6

// Narrowing that overflows wraps silently
System.out.println((byte) 300);   // 44`,
          annotations: {
            18: "300 needs more than 8 bits. Only the low 8 survive, and the rest are discarded with no warning.",
          },
        },
        {
          language: "python",
          code: `total, count = 7, 2

print(total / count)         # 3.5   / is already true division
print(total // count)        # 3     floor division when you want a whole number
print(int(total / count))    # 3     explicit truncation

# int() truncates toward zero; // floors toward negative infinity
print(int(5.9))     #  5
print(int(-5.9))    # -5    toward zero
print(-5.9 // 1)    # -6.0  toward negative infinity
print(round(5.9))   #  6

# Python integers never overflow, so there is no widening cast to remember
a = b = 100000
print(a * b)   # 10000000000`,
          annotations: {
            3: "Python's / avoids the whole trap — it never truncates, so no cast is needed to get 3.5.",
            9: "int() and // disagree on negatives. This catches people translating C++ code into Python.",
          },
        },
      ],
    },
    {
      name: "Converting Between Text and Numbers",
      idea: "Parse text into a number, or render a number as text — the conversion every program doing input and output needs.",
      steps: [
        "Confirm the direction: text into a number, or a number into text.",
        "Call the parsing function for the target numeric type.",
        "Handle the failure case, since text that is not a valid number cannot be parsed.",
        "For the reverse direction, call the language's string conversion on the number.",
        "To parse a decimal string into an integer, convert to a floating-point value first, then narrow.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <string>
using namespace std;

string s = "42";
int    n = stoi(s);        // 42
double d = stod("3.14");   // 3.14

string back = to_string(n);   // "42"

// Invalid text throws
try {
    int bad = stoi("abc");
} catch (const invalid_argument& e) {
    cout << "not a number" << endl;
}

// "3.5" cannot go straight to int
int viaFloat = (int) stod("3.5");   // 3`,
          annotations: {
            13: "stoi throws invalid_argument rather than returning a silent zero.",
            18: "stoi(\"3.5\") stops at the decimal point. Parse as double first, then narrow.",
          },
        },
        {
          language: "java",
          code: `String s = "42";
int    n = Integer.parseInt(s);        // 42
double d = Double.parseDouble("3.14"); // 3.14

String back = String.valueOf(n);   // "42"
String also = "" + n;              // "42" — works, but less clear

// Invalid text throws
try {
    int bad = Integer.parseInt("abc");
} catch (NumberFormatException e) {
    System.out.println("not a number");
}

// "3.5" cannot go straight to int
int viaDouble = (int) Double.parseDouble("3.5");   // 3`,
          annotations: {
            11: "NumberFormatException is a runtime exception, so it will crash the program if unhandled.",
          },
        },
        {
          language: "python",
          code: `s = "42"
n = int(s)          # 42
d = float("3.14")   # 3.14

back = str(n)       # "42"

# Invalid text raises
try:
    bad = int("abc")
except ValueError:
    print("not a number")

# "3.5" cannot go straight to int
via_float = int(float("3.5"))   # 3

# The input() case from the previous lesson
# n = int(input())   <- this is exactly this conversion`,
          annotations: {
            9: "ValueError, not a silent zero — which is the behaviour you want.",
            17: "Every int(input()) you write is a text-to-number conversion.",
          },
        },
      ],
    },
  ],

  examples: [
    {
      input: "sum = 7, count = 2; compute (double)(sum / count) and (double) sum / count",
      output: "3.0 and 3.5",
      walkthrough: [
        "In the first form, the parentheses force sum / count to be evaluated first.",
        "Both are integers, so integer division runs and produces 3, discarding the half.",
        "The cast then converts the integer 3 into the double 3.0 — faithfully, but too late.",
        "In the second form, the cast applies to sum alone, making it 7.0 before any division happens.",
        "count is promoted to 2.0 to match, the division runs in floating point, and 3.5 survives.",
        "The same characters in a different order produce different answers, because conversion happens at a point in time.",
      ],
      why: "The single most common 'but I already cast it' bug. Seeing both forms side by side is what makes the ordering rule stick.",
    },
    {
      input: "Cast 5.9 and -5.9 to int, and compare against floor division",
      output: "5 and -5, where floor division would give 5 and -6",
      walkthrough: [
        "Casting 5.9 to an integer discards the fractional part, leaving 5.",
        "Casting -5.9 discards the fraction too, leaving -5 — moving the value toward zero.",
        "Floor division instead rounds down the number line, so -5.9 becomes -6.",
        "For positive values both approaches agree, which is why the difference goes unnoticed.",
        "For negative values they differ by one, and that is enough to break an index calculation.",
      ],
      why: "Truncation and flooring are routinely confused, and they only disagree on negatives — exactly where such bugs are hardest to notice.",
    },
    {
      input: "Cast the int 300 to a byte in Java",
      output: "44",
      walkthrough: [
        "300 in binary is 100101100, which needs nine bits.",
        "A byte holds only eight bits, so the value does not fit.",
        "The narrowing cast keeps the low eight bits and discards everything above them.",
        "The remaining bits, 00101100, are read as the value 44.",
        "No error or warning is produced — the cast was your explicit instruction that this was acceptable.",
      ],
      why: "Shows that narrowing wraps rather than clamping, and that writing the cast means you took responsibility for the range check.",
    },
  ],

  visualization: {
    kind: "custom",
    description:
      "Two linked panels. The LADDER panel draws the numeric types as rungs from byte at the bottom to double at the top, with each rung's width proportional to its size. Moving up the ladder animates smoothly in green with an 'automatic' tag, since nothing is lost. Moving down turns red, requires a visible cast token to be placed before the step will run, and animates the overflowing high bits being sheared off the value and falling away — with the surviving low bits reassembling into the new, smaller number so the wrap is derived rather than asserted. Add one special case: the long-to-float rung is drawn upward and green, yet the digits beyond the seventh visibly blur, showing that widening protects range but not precision. The PLACEMENT panel is the important one: draw the same expression as two side-by-side trees. In the first, the division node sits below the cast node — the division evaluates as integers, the half is animated dropping out of the tree and vanishing, and the cast node then converts a bare 3 into 3.0. In the second, the cast node sits on the sum leaf instead — it converts first, the other leaf is auto-promoted with a green tag, and the division node runs in floating point with the half surviving to the root. Run both trees simultaneously so the moment of divergence is visible.",
    sampleInput:
      '{"ladder":["byte","short","int","long","float","double"],"narrowDemo":{"from":"int","to":"byte","value":300,"bits":"100101100","kept":"00101100","result":44},"precisionDemo":{"from":"long","to":"float","value":123456789012345,"result":123456790519808},"placement":{"sum":7,"count":2,"trees":[{"form":"(double)(sum / count)","order":["divide","cast"],"result":3.0},{"form":"(double) sum / count","order":["cast","promote","divide"],"result":3.5}]}}',
    highlights: [
      "The ladder shows six rungs, each drawn wider than the one below it.",
      "An int stepping up to double glides in green — no cast token is needed and the value is unchanged.",
      "An int stepping down to byte is blocked until a cast token is placed on the step.",
      "With the cast in place, the value 300 is shown in binary and its high bit is sheared off and falls away.",
      "The surviving eight bits reassemble as 44, with no error raised anywhere.",
      "The long-to-float rung glows green as a widening step, yet the trailing digits blur — range is protected, precision is not.",
      "In the first expression tree, the division node runs below the cast: the half detaches and vanishes before the cast node is ever reached.",
      "The cast node receives a bare 3 and dutifully produces 3.0, unable to recover what was already gone.",
      "In the second tree, the cast sits on the sum leaf and fires first, turning 7 into 7.0.",
      "The count leaf is auto-promoted with a green tag, the division runs in floating point, and 3.5 arrives intact at the root.",
    ],
  },

  edgeCases: [
    "Casting a floating-point value whose fractional part is exactly .5, where truncation still discards it rather than rounding up.",
    "Narrowing a negative value into a smaller type, where the wrapped result may flip sign.",
    "Converting a long to a float, which is widening yet still loses precision beyond about seven digits.",
    "Parsing text with surrounding whitespace, which most parsers tolerate, versus text with a trailing letter, which they do not.",
    "Parsing an empty string, which raises rather than producing zero.",
    "Parsing a number larger than the target type can hold, which throws in Java and C++ but succeeds in Python.",
    "Casting a char to an int, which yields its character code rather than the digit it appears to show.",
    "Converting the string \"3.5\" directly to an integer, which fails in all three languages.",
  ],

  pitfalls: [
    "Writing (double)(sum / count). The integer division already happened, and the cast converts an answer that is already wrong.",
    "Writing (long)(a * b) for an overflowing product, which widens a value that has already wrapped.",
    "Expecting a cast to round. It truncates — (int) 5.9 is 5, and round() is what you want instead.",
    "Assuming int() and floor division agree. They differ on negatives: int(-5.9) is -5 while -5.9 // 1 is -6.",
    "Narrowing without checking the range first, which wraps silently rather than raising an error.",
    "Assuming widening is always safe. long to float needs no cast and still changes the value.",
    "Expecting \"5\" + 5 to work in Python. It raises a TypeError, deliberately.",
    "Calling int(\"3.5\") and expecting 3. Parse it as a float first, then narrow.",
    "Reaching for a C-style cast in C++ where static_cast would state the intent clearly and be checked more strictly.",
    "Treating a char as the digit it displays: casting the character '7' to an int gives 55, not 7.",
  ],

  commonDoubts: [
    {
      question: "I cast my division to double and still got a whole number. Why?",
      answer:
        "Because the cast ran after the division. In (double)(sum / count), the parentheses force sum / count to complete first as integer division, producing 3 and throwing away the half. The cast then converts 3 to 3.0 — correctly, but too late to help. Move the cast onto an operand instead: (double) sum / count. That promotes sum before the division, count is promoted to match, and the division itself runs in floating point.",
    },
    {
      question: "Does casting round or truncate?",
      answer:
        "It truncates, always. (int) 5.9 is 5 and (int) 5.999 is also 5 — the fractional part is discarded rather than considered. If you want rounding, call round() explicitly: Math.round in Java, round() from cmath in C++, or the built-in round() in Python. The distinction matters most on values close to the next whole number, where truncation looks like an off-by-one bug.",
    },
    {
      question: "Why does int(-5.9) give -5 when I expected -6?",
      answer:
        "Because truncation moves toward zero, not down the number line. -5.9 truncated toward zero is -5. Floor division goes the other way, toward negative infinity, so -5.9 // 1 gives -6. For positive numbers the two agree, which is exactly why the difference is easy to miss until a negative value appears. Use int() when you mean truncate and // when you mean floor.",
    },
    {
      question: "What is the difference between implicit and explicit conversion?",
      answer:
        "Implicit conversion is done by the language without being asked, and it is only permitted where nothing can be lost — assigning an int to a double, or promoting an int in a mixed expression. Explicit conversion is a cast you write yourself, and it is required precisely where something might be lost. The cast is your signature: it tells the compiler you understand data may be discarded and you want it to proceed anyway.",
    },
    {
      question: "Why do I need a cast to store a double in an int, but not the reverse?",
      answer:
        "Because a double can hold every int value, so int-to-double loses nothing and the language does it for free. Going the other way, a double may carry a fractional part or a magnitude an int cannot hold, so something will be discarded. Rather than doing that silently, the language stops and makes you write the cast, which turns a possible accident into a stated decision.",
    },
    {
      question: "Should I use static_cast or a C-style cast in C++?",
      answer:
        "static_cast. For numeric conversions the two do the same job, but static_cast is checked more strictly by the compiler and is impossible to overlook when reading code. A C-style cast is short and blends into the expression, which is exactly the problem — casts are places where data can be lost and they deserve to be visible. C++ also provides dynamic_cast, const_cast and reinterpret_cast for specialised cases you will not need yet.",
    },
    {
      question: "Python has no declared types. Why does it need conversion?",
      answer:
        "Because values still have types even when names do not. Python promotes automatically in mixed arithmetic, so 3 + 2.5 gives 5.5 just as C++ would. What it refuses to do is convert between text and numbers on its own: \"5\" + 5 raises a TypeError rather than guessing whether you wanted \"55\" or 10. That refusal is why int(input()) is required on every numeric read.",
    },
    {
      question: "My long turned into a wrong number when I stored it in a float. How?",
      answer:
        "Because widening protects range, not precision. A float can represent far larger magnitudes than a long, so the language treats the conversion as safe and requires no cast — but a float only carries about seven significant digits. A long holding fifteen digits gets rounded to the nearest value a float can represent, and the result differs from the original. Use double, which carries about fifteen digits, whenever you convert large integers to floating point.",
    },
  ],

  relatedIds: [
    "data-types",
    "arithmetic-operators",
    "input-and-output",
    "integer-overflow-and-precision-errors",
  ],
};

export default content;
