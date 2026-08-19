import type { SubtopicContent } from "../types";

/**
 * Subtopic 26 of Basics (Medium #10). Depends directly on GCD.
 *
 * SOURCES
 * - GeeksforGeeks, "Program to find LCM of two numbers" — the formula
 *   lcm(a,b) = a*b/gcd(a,b), and the brute-force multiples approach.
 * - GeeksforGeeks, "GCD & LCM Coding Problems" — the divide-before-multiply
 *   reordering (a / gcd) * b as the overflow mitigation.
 *
 * MEASURED ON THIS MACHINE (g++ -fwrapv), and it sharpened GFG's advice:
 *
 * GFG says divide-first "significantly lowers the risk" of overflow. That is
 * true but imprecise, and the measurement gives the exact rule:
 *
 *   lcm(50000, 60000): a*b = 3,000,000,000 overflows int. Naive gives -129496.
 *   Divide-first gives 300000, which is CORRECT — and note the answer itself
 *   fits in an int comfortably. The reordering genuinely rescued it.
 *
 *   lcm(100000, 99999): gcd is 1, so a/gcd*b IS a*b. Both forms give 1409965408
 *   and both are wrong, because the true LCM (9,999,900,000) does not fit in an
 *   int at all.
 *
 * So the precise statement is: divide-first eliminates overflow EXACTLY WHEN THE
 * ANSWER ITSELF IS REPRESENTABLE. When the LCM overflows the type, no reordering
 * helps and only a wider type does. That distinction is taught here rather than
 * left as "lowers the risk".
 *
 * Also verified: math.lcm(5, 0) is 0, and gcd(0,0) is 0 — so an unguarded
 * a / gcd divides by zero when both inputs are zero.
 */
const content: SubtopicContent = {
  id: "lcm",
  topic: "Basics",
  title: "LCM",
  difficulty: "Medium",
  status: "ready",

  prerequisites: [
    "gcd-euclidean-algorithm",
    "arithmetic-operators",
    "type-conversion-and-casting",
    "while-loop",
  ],

  summary:
    "The smallest number both values divide into — computed from GCD in one line, with an overflow trap that a simple reordering fixes, but only up to a point worth knowing precisely.",

  theory: `
## The problem

The **least common multiple** of two integers is the smallest positive number that
both divide exactly.

\`\`\`
lcm(4, 6)     ->  12     multiples of 4: 4, 8, 12   multiples of 6: 6, 12
lcm(12, 18)   ->  36
lcm(2, 3)     ->  6      coprime, so the answer is the product
lcm(5, 0)     ->  0      by convention
\`\`\`

## Why GCD comes first

There is a direct relationship between the two:

\`\`\`
gcd(a, b) x lcm(a, b) = a x b
\`\`\`

Rearranged, that gives the formula you will actually use:

\`\`\`
lcm(a, b) = (a x b) / gcd(a, b)
\`\`\`

The intuition: \`a x b\` counts every common factor **twice**, once from each number.
The GCD is exactly the product of those shared factors, so dividing by it removes the
duplication and leaves the smallest number containing all factors of both.

\`\`\`
lcm(12, 18) = 12 x 18 / gcd(12, 18) = 216 / 6 = 36
\`\`\`

Since you already have an O(log min(a, b)) GCD, LCM comes almost for free.

## The overflow trap

\`a x b\` is a much bigger number than the answer, and it is computed **first**.

Measured on this machine:

\`\`\`
lcm(50000, 60000)
  gcd  = 10000
  a x b = 3,000,000,000     <- exceeds INT_MAX (2,147,483,647)
  a x b / gcd  ->  -129496  <- wrong, and negative
\`\`\`

The true answer is **300,000** — which fits in an \`int\` with enormous room to spare.
The product overflowed on the way to an answer that was never large.

## The fix: divide before multiplying

\`gcd(a, b)\` divides \`a\` exactly, so you can do that division first:

\`\`\`
lcm = (a / gcd) * b        instead of        (a * b) / gcd
\`\`\`

Mathematically identical — but \`a / gcd\` is smaller than \`a\`, so the multiplication
starts from a smaller value:

\`\`\`
(50000 / 10000) * 60000 = 5 * 60000 = 300000     ✓
\`\`\`

Verified: the naive form returns \`-129496\` and the reordered form returns \`300000\`.

**This works because the division is exact.** \`gcd\` divides \`a\` with no remainder, so
nothing is lost by doing it early. Reordering an inexact integer division would
change the answer — the same cast-placement lesson from Type Conversion, in a new
setting.

## How far the fix actually goes

GFG describes this reordering as lowering the risk of overflow. The measurement gives
a sharper rule, and it is worth knowing exactly:

\`\`\`
lcm(100000, 99999)
  gcd = 1                  <- coprime
  a / gcd = a              <- the reordering changes NOTHING
  both forms give 1409965408
  the true answer is 9,999,900,000
\`\`\`

When the GCD is 1, \`(a / gcd) * b\` **is** \`a * b\`. There is nothing to divide out.
And the true LCM of two coprime numbers is their product — so if the product does not
fit, **the answer does not fit either**, and no reordering can help.

**The precise rule:**

> Divide-before-multiply eliminates overflow **exactly when the answer itself is
> representable**. If the LCM genuinely exceeds the type, only a wider type helps.

So use the reordering always — it costs nothing and rescues every case that can be
rescued. But when inputs may be coprime and large, **compute in a wider type**:
accumulate into \`long long\` in C++ or \`long\` in Java. Python's unbounded integers
sidestep the issue entirely.

## Zero, and a division by zero waiting to happen

**\`lcm(a, 0) = 0\`** by convention — zero is a multiple of every number, and it is the
smallest non-negative one. Verified against Python's \`math.lcm(5, 0)\`, which returns 0.

**\`lcm(0, 0)\` is a trap.** \`gcd(0, 0)\` is 0, so \`a / gcd\` divides by zero — a crash in
C++ and Java, and a \`ZeroDivisionError\` in Python. Guard it:

\`\`\`
if (a == 0 || b == 0) return 0;
\`\`\`

That single line handles every zero case before the formula runs.

**Negatives**: LCM is conventionally defined as positive, so take absolute values
first.

## Brute force, for contrast

Without the GCD relationship you would walk the multiples of the larger number until
one is divisible by the smaller:

\`\`\`
for (int m = max(a, b); ; m += max(a, b))
    if (m % min(a, b) == 0) return m;
\`\`\`

Correct, and its iteration count is \`lcm / max(a, b)\`, which reaches \`min(a, b)\` when
the two are coprime. For \`lcm(100000, 99999)\` that is 99,999 iterations against the
GCD formula's handful.

Worth writing once to see where the formula comes from. Not worth using.

## Approaches

| # | Approach | Time | Space |
|---|---|---|---|
| 1 | Brute force multiples | O(min(a, b)) | O(1) |
| 2 | Formula, naive \`a*b/gcd\` | O(log min(a, b)) | O(1) |
| 3 | **Formula, divide first** | **O(log min(a, b))** | O(1) |
| 4 | Built-in library function | O(log min(a, b)) | O(1) |

All the cost is in the GCD call. **Use approach 3**, and widen the type when the
answer itself may be large.

## Where this goes next

Prime Check is the last of the number-theory trio, and it stands alone — no GCD
involved. Its lesson is the square-root bound, which turns an O(n) scan into O(√n).
`.trim(),

  intuition:
    "Multiplying two numbers counts every shared factor twice, and the GCD is exactly what was double-counted — so dividing it out leaves the smallest number containing both. The trap is that the product is far larger than the answer, so you must divide the duplication away before you create it, not after.",

  approaches: [
    {
      name: "Brute Force - Walk the Multiples",
      idea: "Step through multiples of the larger number until one is divisible by the smaller.",
      steps: [
        "Take absolute values, and return zero immediately if either input is zero.",
        "Identify the larger and smaller of the two numbers.",
        "Start a candidate at the larger number, since no smaller value can be a multiple of it.",
        "Test whether the candidate is divisible by the smaller number.",
        "If it is, it is the least common multiple, since candidates are visited in increasing order.",
        "Otherwise advance the candidate by the larger number and test again.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
#include <algorithm>
using namespace std;

long long lcmBrute(int a, int b) {
    a = abs(a); b = abs(b);
    if (a == 0 || b == 0) return 0;

    int big = max(a, b), small = min(a, b);
    for (long long m = big; ; m += big) {
        if (m % small == 0) return m;    // first multiple of big divisible by small
    }
}

int main() {
    cout << lcmBrute(4, 6)   << endl;   // 12
    cout << lcmBrute(12, 18) << endl;   // 36
    cout << lcmBrute(2, 3)   << endl;   // 6

    // The worst case is coprime inputs, where the answer is the product
    // and the loop must walk all the way there.
    // lcmBrute(100000, 99999) takes 99,999 iterations.
    return 0;
}`,
          annotations: {
            9: "Stepping by the larger number means every candidate is already a multiple of it, halving the work versus counting one at a time.",
            10: "Candidates are visited in increasing order, so the first success is automatically the least.",
          },
        },
        {
          language: "java",
          code: `static long lcmBrute(int a, int b) {
    a = Math.abs(a); b = Math.abs(b);
    if (a == 0 || b == 0) return 0;

    int big = Math.max(a, b), small = Math.min(a, b);
    for (long m = big; ; m += big) {
        if (m % small == 0) return m;
    }
}

System.out.println(lcmBrute(4, 6));     // 12
System.out.println(lcmBrute(12, 18));   // 36

// Iteration count is lcm / max(a, b), which equals min(a, b)
// when the two numbers share no factors.`,
          annotations: {
            6: "Accumulating into long so the candidate can exceed int range before a match is found.",
          },
        },
        {
          language: "python",
          code: `def lcm_brute(a, b):
    a, b = abs(a), abs(b)
    if a == 0 or b == 0:
        return 0

    big, small = max(a, b), min(a, b)
    m = big
    while m % small != 0:
        m += big
    return m

print(lcm_brute(4, 6))     # 12
print(lcm_brute(12, 18))   # 36
print(lcm_brute(2, 3))     # 6

# Do not run this on large coprime inputs — lcm_brute(100000, 99999)
# takes 99,999 iterations to reach an answer the formula finds instantly.`,
          annotations: {
            8: "A while loop rather than a for, since the number of iterations is not known in advance.",
          },
        },
      ],
      complexity: {
        time: "O(min(a, b))",
        space: "O(1)",
        note: "The number of candidates tested is the LCM divided by the larger input, which reaches the smaller input when the two are coprime. Measured shape: lcm(100000, 99999) requires 99,999 iterations, against a handful for the GCD formula. Useful for seeing where the formula comes from, not for using.",
      },
    },
    {
      name: "Formula via GCD - Naive Order",
      idea: "Apply lcm = a * b / gcd directly, which is correct mathematically and overflows in practice.",
      steps: [
        "Take absolute values and return zero if either input is zero.",
        "Compute the greatest common divisor of the two numbers.",
        "Multiply the two inputs together.",
        "Divide that product by the GCD.",
        "Note that the product is far larger than the answer, and is computed before any division reduces it.",
      ],
      code: [
        {
          language: "cpp",
          code: `int gcd(int a, int b) { while (b) { int t = a % b; a = b; b = t; } return a; }

// The formula written literally — and it overflows
int lcmNaive(int a, int b) {
    if (a == 0 || b == 0) return 0;
    return a * b / gcd(a, b);          // a * b happens FIRST
}

cout << lcmNaive(4, 6)   << endl;   // 12   — fine
cout << lcmNaive(12, 18) << endl;   // 36   — fine

// MEASURED FAILURE on this machine:
cout << lcmNaive(50000, 60000) << endl;   // -129496
// gcd is 10000 and the true answer is 300000, which fits an int easily.
// But 50000 * 60000 is 3,000,000,000, which exceeds INT_MAX first.
// The product overflowed on the way to an answer that was never large.`,
          annotations: {
            5: "Operator precedence makes the multiplication happen before the division, which is the entire bug.",
            12: "The answer 300000 needs 19 bits. The intermediate product needs 32. Only the intermediate is the problem.",
          },
        },
        {
          language: "java",
          code: `static int gcd(int a, int b) { while (b != 0) { int t = a % b; a = b; b = t; } return a; }

static int lcmNaive(int a, int b) {
    if (a == 0 || b == 0) return 0;
    return a * b / gcd(a, b);
}

System.out.println(lcmNaive(4, 6));     // 12
System.out.println(lcmNaive(12, 18));   // 36

// Same failure as C++, since Java's int is also 32-bit and wraps silently:
System.out.println(lcmNaive(50000, 60000));   // -129496, should be 300000`,
          annotations: {
            5: "Java wraps on overflow without any error, exactly as C++ does in practice.",
          },
        },
        {
          language: "python",
          code: `import math

def lcm_naive(a, b):
    if a == 0 or b == 0:
        return 0
    return a * b // math.gcd(a, b)

print(lcm_naive(4, 6))            # 12
print(lcm_naive(12, 18))          # 36
print(lcm_naive(50000, 60000))    # 300000 — correct!

# Python integers are unbounded, so the intermediate product is simply
# computed at whatever size it needs. The naive order is safe here.
print(lcm_naive(100000, 99999))   # 9999900000 — also correct

# The reordering is still worth writing out of habit, since the same
# code in C++ or Java would be wrong.`,
          annotations: {
            7: "Note // rather than /, or the result becomes a float and loses precision on large values.",
            11: "The one language of the three where the naive order is genuinely safe.",
          },
        },
      ],
      complexity: {
        time: "O(log min(a, b))",
        space: "O(1)",
        note: "All the cost is the GCD call; the multiplication and division are single operations. Correct in Python, where integers are unbounded. In C++ and Java the intermediate product can exceed the type even when the answer would fit — measured at lcm(50000, 60000), where the true answer 300000 fits easily and the product 3,000,000,000 does not.",
      },
    },
    {
      name: "Formula via GCD - Divide First",
      idea: "Reorder to (a / gcd) * b so the multiplication starts from a smaller value.",
      steps: [
        "Take absolute values and return zero if either input is zero, which also avoids dividing by a zero GCD.",
        "Compute the greatest common divisor.",
        "Divide the first number by the GCD, which is exact and therefore loses nothing.",
        "Multiply that smaller quotient by the second number.",
        "The result is identical to the naive formula but the intermediate value is smaller by a factor of the GCD.",
        "Widen the accumulating type when the answer itself may exceed the input type.",
      ],
      code: [
        {
          language: "cpp",
          code: `int gcd(int a, int b) { while (b) { int t = a % b; a = b; b = t; } return a; }

// Divide before multiplying — the division is exact, so nothing is lost
int lcmSafe(int a, int b) {
    a = abs(a); b = abs(b);
    if (a == 0 || b == 0) return 0;    // also guards gcd(0,0) == 0
    return a / gcd(a, b) * b;
}

cout << lcmSafe(4, 6)   << endl;   // 12
cout << lcmSafe(12, 18) << endl;   // 36

// The case that defeated the naive order:
cout << lcmSafe(50000, 60000) << endl;   // 300000 — correct
// (50000 / 10000) * 60000 = 5 * 60000 = 300000, never exceeding INT_MAX.

// THE LIMIT OF THIS FIX — measured:
// lcmSafe(100000, 99999) still returns 1409965408, not 9999900000.
// gcd is 1, so a / gcd is just a, and the reordering changes nothing.
// The true answer does not fit in an int, so no ordering can help.

// When the ANSWER may be large, widen the type:
long long lcmWide(long long a, long long b) {
    if (a == 0 || b == 0) return 0;
    return a / __gcd(a, b) * b;
}
cout << lcmWide(100000, 99999) << endl;   // 9999900000 — correct`,
          annotations: {
            6: "One guard covers three problems: zero inputs, the zero answer, and division by a zero GCD.",
            7: "The division is exact because gcd divides a with no remainder, so reordering is safe here in a way it would not be for an inexact division.",
            18: "The honest limit. Divide-first rescues every case where the answer fits, and nothing beyond that.",
          },
        },
        {
          language: "java",
          code: `static int gcd(int a, int b) { while (b != 0) { int t = a % b; a = b; b = t; } return a; }

static int lcmSafe(int a, int b) {
    a = Math.abs(a); b = Math.abs(b);
    if (a == 0 || b == 0) return 0;
    return a / gcd(a, b) * b;
}

System.out.println(lcmSafe(4, 6));            // 12
System.out.println(lcmSafe(50000, 60000));    // 300000 — correct

// Widen when the answer itself may be large
static long gcdL(long a, long b) { while (b != 0) { long t = a % b; a = b; b = t; } return a; }

static long lcmWide(long a, long b) {
    if (a == 0 || b == 0) return 0;
    return a / gcdL(a, b) * b;
}

System.out.println(lcmWide(100000, 99999));   // 9999900000

// Java also offers Math.multiplyExact, which throws instead of wrapping:
//   return Math.multiplyExact(a / gcd(a, b), b);`,
          annotations: {
            22: "Converts a silent wrong answer into a thrown exception, which is usually what you want on a judge.",
          },
        },
        {
          language: "python",
          code: `import math

def lcm_safe(a, b):
    a, b = abs(a), abs(b)
    if a == 0 or b == 0:
        return 0
    return a // math.gcd(a, b) * b

print(lcm_safe(4, 6))             # 12
print(lcm_safe(12, 18))           # 36
print(lcm_safe(50000, 60000))     # 300000
print(lcm_safe(100000, 99999))    # 9999900000

# Python needs neither the reordering nor a wider type, since its
# integers grow to fit. Writing it this way anyway is a good habit —
# the identical structure is required the moment you switch languages.

# Note // and not /: true division would produce a float and lose
# precision on values beyond about 2^53.
print(10**20 // 1 * 3)            # exact
print(int(10**20 / 1 * 3))        # 300000000000000000000 — but via a lossy float`,
          annotations: {
            7: "Floor division rather than true division. The gcd divides exactly, so no rounding is involved.",
            20: "A real hazard on large values: floats carry about 15-16 significant digits, integers carry all of them.",
          },
        },
      ],
      complexity: {
        time: "O(log min(a, b))",
        space: "O(1)",
        note: "Identical cost to the naive form — the reordering changes only which intermediate value is produced. It eliminates overflow exactly when the answer itself is representable in the type. When the LCM genuinely exceeds the type, as it does for large coprime inputs, no reordering helps and a wider accumulating type is required.",
      },
    },
    {
      name: "Built-in Library Functions",
      idea: "Use the language's own implementation where one exists.",
      steps: [
        "Check whether the language provides an LCM function for the types involved.",
        "Confirm its handling of zero and negative inputs, since conventions vary.",
        "Call it directly rather than reimplementing the formula.",
        "Fall back to the divide-first formula where no built-in exists, as in Java for primitive types.",
      ],
      code: [
        {
          language: "python",
          code: `import math

print(math.lcm(4, 6))        # 12
print(math.lcm(12, 18))      # 36
print(math.lcm(2, 3))        # 6
print(math.lcm(5, 0))        # 0   — verified: zero convention matches
print(math.lcm(-4, 6))       # 12  — absolute values taken automatically

# Available from Python 3.9. Like math.gcd it accepts any number of arguments:
print(math.lcm(4, 6, 10))    # 60
print(math.lcm())            # 1   — the identity for LCM, as gcd() gives 0

# Unbounded integers mean no overflow concern at any size:
print(math.lcm(100000, 99999))   # 9999900000`,
          annotations: {
            7: "Verified on this machine. LCM with zero is zero, matching the mathematical convention.",
            12: "The empty case returns 1 rather than 0, because 1 is the multiplicative identity.",
          },
        },
        {
          language: "cpp",
          code: `#include <numeric>     // C++17 and later — same header as std::gcd
using namespace std;

cout << lcm(4, 6)   << endl;   // 12
cout << lcm(12, 18) << endl;   // 36
cout << lcm(5, 0)   << endl;   // 0

// std::lcm is subject to the same type limits as your own implementation —
// it does not silently widen. Pass wider types when the answer may be large:
cout << lcm(100000LL, 99999LL) << endl;   // 9999900000

// With plain ints the result must still fit in an int:
// cout << lcm(100000, 99999);   // undefined — the answer exceeds int range

// Pre-C++17 there is no std::lcm. Write the divide-first formula.`,
          annotations: {
            2: "Both gcd and lcm live in numeric, not algorithm — a common source of compile errors.",
            10: "The standard library does not rescue you from a type too small for the answer. That remains your decision.",
          },
        },
        {
          language: "java",
          code: `// Java has NO lcm at all — not for primitives, and not on BigInteger either.
// BigInteger has gcd but no lcm, so the formula must be written by hand.

import java.math.BigInteger;

static BigInteger lcmBig(BigInteger a, BigInteger b) {
    if (a.signum() == 0 || b.signum() == 0) return BigInteger.ZERO;
    return a.divide(a.gcd(b)).multiply(b);      // divide first here too
}

System.out.println(lcmBig(BigInteger.valueOf(4), BigInteger.valueOf(6)));   // 12

// For primitives, the divide-first formula is the answer:
static long gcd(long a, long b) { while (b != 0) { long t = a % b; a = b; b = t; } return a; }
static long lcm(long a, long b) {
    if (a == 0 || b == 0) return 0;
    return a / gcd(a, b) * b;
}

System.out.println(lcm(50000, 60000));     // 300000
System.out.println(lcm(100000, 99999));    // 9999900000`,
          annotations: {
            1: "Java is the only one of the three with no LCM anywhere in its standard library.",
            8: "The reordering matters even with BigInteger, where it reduces the size of the intermediate rather than preventing overflow.",
          },
        },
      ],
      complexity: {
        time: "O(log min(a, b))",
        space: "O(1)",
        note: "Library implementations use the same GCD-based formula. Python's math.lcm benefits from unbounded integers and is safe at any size. C++'s std::lcm respects the argument types and offers no protection when the answer exceeds them. Java provides no LCM at all, for primitives or for BigInteger.",
      },
    },
  ],

  examples: [
    {
      input: "lcm(12, 18)",
      output: "36",
      walkthrough: [
        "First compute the greatest common divisor of 12 and 18, which is 6.",
        "Using the divide-first order, divide 12 by 6 to get 2. This division is exact, so nothing is lost.",
        "Multiply that 2 by the other number, 18, giving 36.",
        "Checking: 36 divided by 12 is 3 and 36 divided by 18 is 2, so both divide it exactly.",
        "No smaller positive number does, since 12 and 18 share the factor 6 which the division removed exactly once.",
        "The naive order would compute 12 times 18 as 216 and then divide by 6, reaching the same 36 through a larger intermediate.",
      ],
      why: "The core trace, showing both orderings reach the same answer so the reordering is about the intermediate value rather than the result.",
    },
    {
      input: "lcm(50000, 60000) with a 32-bit int",
      output: "Naive order: -129496. Divide-first: 300000.",
      walkthrough: [
        "The greatest common divisor of the two is 10000.",
        "The naive order computes 50000 times 60000 first, which is 3,000,000,000.",
        "That exceeds the maximum int value of 2,147,483,647, so the value wraps and the subsequent division works on garbage.",
        "The function returns -129496, which was measured on this machine.",
        "The divide-first order computes 50000 divided by 10000 first, which is 5.",
        "Multiplying 5 by 60000 gives 300000, and at no point did any value approach the int limit.",
        "The correct answer 300000 fits in an int with enormous room — only the intermediate was ever too large.",
      ],
      why: "The clearest possible case for the reordering: the answer was never large, and the naive order destroyed it anyway.",
    },
    {
      input: "lcm(100000, 99999) with a 32-bit int",
      output: "Both orderings return 1409965408. The true answer is 9,999,900,000.",
      walkthrough: [
        "The two numbers are coprime, so their greatest common divisor is 1.",
        "Dividing by 1 changes nothing, so the divide-first expression is literally the same as the naive one.",
        "Both compute 100000 times 99999, which is 9,999,900,000.",
        "That value needs more than 32 bits, so it wraps and both forms return 1409965408.",
        "The true LCM of two coprime numbers is their product, so the answer itself does not fit in an int either.",
        "No reordering can rescue this — the only fix is to compute in a 64-bit type.",
      ],
      why: "The limit of the fix, measured rather than assumed. It turns vague advice about lowering risk into a precise rule about when the reordering helps at all.",
    },
    {
      input: "lcm(0, 0) with an unguarded formula",
      output: "Division by zero — a crash in C++ and Java, ZeroDivisionError in Python",
      walkthrough: [
        "The greatest common divisor of zero and zero is defined as zero, by the convention from the previous subtopic.",
        "The formula then attempts to divide the first input by that zero GCD.",
        "In C++ integer division by zero is undefined behaviour and typically crashes the program.",
        "Java throws an ArithmeticException, and Python raises ZeroDivisionError.",
        "A single guard returning zero when either input is zero prevents the formula from ever running.",
        "That same guard also produces the correct answer, since the LCM of anything with zero is zero by convention.",
      ],
      why: "One line handles the zero convention and the division-by-zero crash together, which is easy to omit because both cases look like edge-case pedantry until the input arrives.",
    },
  ],

  visualization: {
    kind: "custom",
    description:
      "Draw two number lines stacked vertically, one ticking at multiples of a and the other at multiples of b, both starting from zero. The BRUTE FORCE panel advances a marker along the a line one tick at a time, checking at each stop whether the b line also has a tick there, and highlights the first position where the two coincide — that alignment is the LCM, and running it on coprime inputs shows the marker travelling a very long way before the first coincidence. The FACTOR panel makes the formula visible: draw a and b as stacks of prime-factor blocks, overlap them so the shared blocks sit in a common region, and show that stacking both stacks end to end duplicates that shared region — with the GCD drawn as exactly the duplicated part, so dividing it out once leaves the union of both factorisations, which is the LCM. The OVERFLOW panel is the one that carries the lesson. Draw a capacity bar sized to INT_MAX. For lcm(50000, 60000), run the naive order first: the product bar grows past the end of the capacity bar, the excess shears off, and the wrapped remainder is then divided to produce a negative result, marked in red. Replay with the divide-first order: the a value shrinks by the GCD before the multiplication begins, the resulting bar grows to only 300000 and sits far short of the capacity limit, marked green. Then run lcm(100000, 99999) through both orderings and show them producing identical bars, because dividing by a GCD of one removes nothing — with the true answer drawn as a bar extending well past the capacity limit, labelled to make clear that the answer itself does not fit and that reordering was never going to help. Finish by swapping in a wider capacity bar and showing the same computation completing inside it.",
    sampleInput:
      '{"formula":{"a":12,"b":18,"gcd":6,"naive":{"product":216,"result":36},"divideFirst":{"quotient":2,"result":36}},"overflowRescued":{"a":50000,"b":60000,"gcd":10000,"intMax":2147483647,"naiveProduct":3000000000,"naiveResult":-129496,"divideFirstIntermediate":5,"divideFirstResult":300000,"answerFitsInInt":true,"measured":true},"overflowUnrescuable":{"a":100000,"b":99999,"gcd":1,"naiveResult":1409965408,"divideFirstResult":1409965408,"trueAnswer":9999900000,"answerFitsInInt":false,"fix":"widen to 64-bit"},"bruteForce":{"a":100000,"b":99999,"iterations":99999},"zeroCase":{"a":0,"b":0,"gcd":0,"unguarded":"division by zero","guarded":0}}',
    highlights: [
      "Two number lines tick at multiples of a and of b, both starting from zero.",
      "A marker walks the a line and stops at the first position where the b line also has a tick — that alignment is the LCM.",
      "On coprime inputs the marker travels almost to the product before finding any coincidence.",
      "The factor panel draws a and b as stacks of prime-factor blocks with the shared factors in a common region.",
      "Stacking both end to end duplicates that shared region, and the GCD is drawn as exactly the duplicated part.",
      "Dividing it out once leaves the union of both factorisations, which is the LCM.",
      "A capacity bar sized to INT_MAX appears, and the naive product for 50000 and 60000 grows past its end.",
      "The excess shears off and the wrapped remainder divides to a negative result, marked red.",
      "Replayed with divide-first, a shrinks by the GCD before the multiplication and the bar reaches only 300000, far short of the limit.",
      "Running 100000 and 99999 through both orderings produces identical bars, because dividing by a GCD of one removes nothing.",
      "The true answer is drawn extending well past the capacity limit, labelled to show the answer itself does not fit.",
      "Swapping in a wider capacity bar lets the same computation complete inside it, which is the only remaining fix.",
    ],
  },

  edgeCases: [
    "Either input zero, where the LCM is zero by convention and the formula must be guarded before it divides.",
    "Both inputs zero, where the GCD is also zero and an unguarded formula divides by zero.",
    "Coprime inputs, where the LCM equals the product and the divide-first reordering removes nothing.",
    "Inputs whose product overflows but whose LCM fits, which is exactly the case the reordering rescues.",
    "Inputs whose LCM itself overflows, where no reordering helps and only a wider type does.",
    "Negative inputs, where the LCM is conventionally positive so absolute values are taken first.",
    "Two equal inputs, where the LCM is that value and the GCD is also that value.",
    "One input equal to 1, where the LCM is the other input.",
    "One input a multiple of the other, where the LCM is the larger of the two.",
    "Using true division rather than integer division in Python, which produces a float and loses precision beyond about 2^53.",
  ],

  pitfalls: [
    "Writing a * b / gcd, where the multiplication happens first and can overflow before any division reduces it.",
    "Assuming the divide-first reordering always prevents overflow, when it does nothing for coprime inputs.",
    "Failing to widen the type when the answer itself may exceed the input type.",
    "Omitting the zero guard, which divides by a zero GCD when both inputs are zero.",
    "Returning something other than zero for an LCM involving zero, when the convention is zero.",
    "Using / instead of // in Python, which turns an exact integer result into a lossy float.",
    "Reordering an inexact division the same way, which would change the answer — the reordering here is only safe because the GCD divides exactly.",
    "Using brute force on coprime inputs, where the iteration count reaches the smaller of the two numbers.",
    "Looking for std::lcm in the algorithm header, when it lives in numeric.",
    "Expecting Java to provide an LCM function, when it has none for primitives or for BigInteger.",
  ],

  commonDoubts: [
    {
      question: "Why does dividing by the GCD give the LCM?",
      answer:
        "Because multiplying the two numbers counts every shared factor twice, once from each. The GCD is precisely the product of those shared factors, so dividing by it removes the duplication exactly once and leaves the union of both factorisations — which is the smallest number containing all factors of both, and therefore the least common multiple. The identity gcd(a, b) times lcm(a, b) equals a times b is another way of stating the same fact.",
    },
    {
      question: "Why write (a / gcd) * b instead of (a * b) / gcd?",
      answer:
        "Because the product is far larger than the answer and is computed first. Measured on this machine, lcm(50000, 60000) with the naive order returns -129496: the product 3,000,000,000 exceeds the int limit and wraps before the division ever runs. The reordered form computes 50000 divided by 10000 first, giving 5, then multiplies by 60000 to reach 300000 without any intermediate approaching the limit — and the correct answer fits in an int comfortably.",
    },
    {
      question: "Is it safe to divide before multiplying? Doesn't that lose precision?",
      answer:
        "It is safe here specifically because the division is exact. The GCD divides a with no remainder by definition, so a divided by gcd loses nothing. Reordering an inexact integer division would change the answer — the same lesson as cast placement in the Type Conversion subtopic, where dividing before converting destroyed the fraction. The rule is that reordering integer division is safe only when you know the division is exact.",
    },
    {
      question: "Does the reordering always prevent overflow?",
      answer:
        "No, and this is worth knowing precisely. When the two numbers are coprime the GCD is 1, so a divided by gcd is just a and the expression is literally the naive one. Measured: lcm(100000, 99999) returns 1409965408 from both forms, because the true answer 9,999,900,000 does not fit in an int at all. The exact rule is that divide-first eliminates overflow whenever the answer itself is representable. Beyond that only a wider type helps.",
    },
    {
      question: "What is the LCM of a number and zero?",
      answer:
        "Zero, by convention. Zero is a multiple of every number, and it is the smallest non-negative one, so it is the least common multiple. Verified against Python's math.lcm, which returns 0 for lcm(5, 0). The practical importance is that gcd(0, 0) is also 0, so an unguarded formula divides by zero when both inputs are zero — a crash in C++ and Java, and a ZeroDivisionError in Python. A single guard returning 0 when either input is zero handles the convention and the crash together.",
    },
    {
      question: "Which type should I compute LCM in?",
      answer:
        "Wider than the inputs, whenever the inputs might be large or coprime. If both inputs fit in an int, their LCM can be as large as their product, which needs 64 bits. Use long long in C++ and long in Java as the accumulating type. Python needs no such decision, since its integers grow to fit. Note that C++'s std::lcm respects the argument types and will not widen for you, so passing plain ints when the answer needs 64 bits is still your problem.",
    },
    {
      question: "Why is brute force so slow for LCM?",
      answer:
        "Because the number of candidates it tests is the LCM divided by the larger input, and for coprime numbers the LCM is the full product — so the count reaches the smaller input. For lcm(100000, 99999) that is 99,999 iterations against a handful for the formula. The pattern mirrors GCD's brute force, where coprime inputs were also the worst case. Both are worth writing once to understand the problem and not worth using afterwards.",
    },
    {
      question: "Does my language have a built-in?",
      answer:
        "Python has math.lcm from version 3.9, which handles zero and negatives and accepts any number of arguments. C++ has std::lcm from C++17, in the numeric header alongside std::gcd — and it offers no protection when the answer exceeds the argument type. Java has nothing at all: no LCM for primitives, and none on BigInteger either, which only provides gcd. So in Java the divide-first formula is the answer, and it is worth memorising alongside the GCD loop.",
    },
  ],

  relatedIds: [
    "gcd-euclidean-algorithm",
    "prime-check",
    "integer-overflow-and-precision-errors",
    "type-conversion-and-casting",
  ],
};

export default content;
