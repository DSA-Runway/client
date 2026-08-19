import type { SubtopicContent } from "../types";

/**
 * Subtopic 25 of Basics (Medium #9). First of the number-theory trio:
 * GCD -> LCM (derived from GCD) -> Prime Check.
 *
 * SOURCES
 * - GeeksforGeeks, "Euclidean algorithms (Basic and Extended)" — the subtraction
 *   and modulo forms, and the recurrence gcd(a, b) = gcd(b, a % b).
 * - GeeksforGeeks, "Time Complexity of Euclidean Algorithm" — O(log min(a, b)),
 *   with consecutive Fibonacci numbers as the worst case (Lamé's theorem).
 *
 * MEASURED ON THIS MACHINE (g++ -O2), step counts instrumented directly:
 *
 * 1. gcd(1000000000, 2): modulo takes 1 step, subtraction takes 499,999,999.
 *    That single pair is the entire argument for using modulo, and the ratio is
 *    large enough that no hand-waving is needed.
 *
 * 2. Lamé's theorem reproduced: consecutive Fibonacci pairs give step counts
 *    growing LINEARLY with the Fibonacci index — F(10) 9 steps, F(20) 19,
 *    F(30) 29, F(40) 39, F(45) 44. Since Fibonacci grows exponentially, that is
 *    a direct demonstration of the logarithmic bound rather than an assertion.
 *
 * 3. Brute force on two coprime six-digit numbers: 1,000,003 steps against 6 for
 *    Euclid. Coprimes are brute force's worst case because it scans to 1.
 *
 * 4. Edge cases confirmed: gcd(0,5)=5, gcd(5,0)=5, gcd(0,0)=0, and argument
 *    order is irrelevant because the first modulo step swaps them automatically.
 */
const content: SubtopicContent = {
  id: "gcd-euclidean-algorithm",
  topic: "Basics",
  title: "GCD - Euclidean Algorithm",
  difficulty: "Medium",
  status: "ready",

  prerequisites: [
    "while-loop",
    "arithmetic-operators",
    "functions-declaration-and-calling",
    "if-else-statements",
  ],

  summary:
    "The largest number dividing two values — from a loop that checks every candidate to an algorithm from 300 BC that answers gcd(1000000000, 2) in a single step.",

  theory: `
## The problem

The **greatest common divisor** of two integers is the largest number that divides
both exactly.

\`\`\`
gcd(12, 18)  ->  6      12 = 6x2, 18 = 6x3
gcd(17, 5)   ->  1      no common factor beyond 1 — coprime
gcd(0, 5)    ->  5
\`\`\`

Also called HCF, the highest common factor. Same thing.

## The obvious approach, and what it costs

Every divisor of both numbers is at most the smaller of them, so start there and walk
down until you find one that divides both:

\`\`\`
for (int i = min(a, b); i >= 1; i--)
    if (a % i == 0 && b % i == 0) return i;
\`\`\`

Correct, and slow in exactly the case you would not predict. The **worst input is two
numbers sharing no factors**, because the loop then runs all the way down to 1.

Measured: \`gcd(1000003, 1000033)\` — both prime, so the answer is 1 — took
**1,000,003 iterations**. Euclid's algorithm answered the same pair in **6**.

## Euclid's insight

From around 300 BC, and it is one line:

**If a number divides both \`a\` and \`b\`, it also divides their difference.**

So the set of common divisors of \`(a, b)\` is identical to the set for \`(a - b, b)\`.
The largest member of that set — the GCD — is therefore the same for both pairs:

\`\`\`
gcd(a, b) = gcd(a - b, b)      when a > b
\`\`\`

Each subtraction shrinks the numbers without changing the answer. Keep going until
they are equal, and that value is the GCD:

\`\`\`
gcd(18, 12) -> gcd(6, 12) -> gcd(6, 6) -> 6
\`\`\`

## Subtraction is still too slow

The idea is right; the step size is wrong.

\`gcd(1000000000, 2)\` subtracts 2 from a billion, over and over. Measured:
**499,999,999 steps.** The same computation with the modulo version takes **1**.

The problem is that repeated subtraction of the same value **is** division. Doing it
one step at a time throws away the fact that the language has a divide instruction.

## Replace subtraction with modulo

Subtracting \`b\` from \`a\` repeatedly until the result drops below \`b\` leaves exactly
\`a % b\`. So do it in one operation:

\`\`\`
gcd(a, b) = gcd(b, a % b)
\`\`\`

with the base case:

\`\`\`
gcd(a, 0) = a
\`\`\`

That base case is not an arbitrary stopping rule — **every number divides 0**, so the
greatest common divisor of \`a\` and \`0\` is \`a\` itself.

\`\`\`
gcd(1000000000, 2)
  = gcd(2, 1000000000 % 2)
  = gcd(2, 0)
  = 2
\`\`\`

One step. That is the whole algorithm.

## Order does not matter, for free

You might expect to need \`a\` larger than \`b\`. You do not — **the first modulo step
swaps them automatically**:

\`\`\`
gcd(12, 18):  a=12, b=18
  t = 12 % 18 = 12    (a smaller than b, so the remainder is a itself)
  a = 18, b = 12      <- swapped
\`\`\`

Because \`x % y\` is just \`x\` when \`x < y\`. One wasted iteration, no special case
needed. Verified: \`gcd(12, 18)\` and \`gcd(18, 12)\` both give 6.

## Why it is O(log min(a, b))

The step count is logarithmic, and the worst case is a specific and memorable one.

**Lamé's theorem**: the pair requiring the most steps for a given size is
**two consecutive Fibonacci numbers**. Measured here:

| Pair | Steps |
|---|---|
| F(10)=89, F(9)=55 | 9 |
| F(20)=10946, F(19)=6765 | 19 |
| F(30)=1346269, F(29)=832040 | 29 |
| F(40)=165580141, F(39)=102334155 | 39 |
| F(45)=1836311903, F(44)=1134903170 | 44 |

The steps grow **linearly with the Fibonacci index**, while the numbers themselves
grow **exponentially** with that index. Linear in the index, exponential in the value —
that is precisely what logarithmic means.

Put concretely: the hardest pair below two billion takes **44 steps**. Brute force on
the same magnitude could take a billion.

The reason Fibonacci is the worst case is that each modulo step removes as little as
possible — consecutive Fibonacci numbers are the closest two numbers can be to a
ratio that keeps the remainder large.

## Edge cases

**\`gcd(a, 0) = a\`** — the base case, and mathematically correct since every number
divides zero.

**\`gcd(0, 0) = 0\`** by convention. There is no largest common divisor, since every
number divides zero, so 0 is defined as the answer. Verified consistent across the
iterative version and Python's \`math.gcd\`.

**Negatives** — divisibility ignores sign, so \`gcd(-12, 18)\` is \`6\`. Take the absolute
value first. Python's \`math.gcd\` does this for you and returns 6.

## Approaches

| # | Approach | Time | Space |
|---|---|---|---|
| 1 | Brute force | O(min(a, b)) | O(1) |
| 2 | Euclid by subtraction | O(max(a, b)) worst case | O(1) |
| 3 | **Euclid by modulo, iterative** | **O(log min(a, b))** | O(1) |
| 4 | Euclid by modulo, recursive | O(log min(a, b)) | **O(log min(a, b))** — stack |
| 5 | Built-in library function | O(log min(a, b)) | O(1) |

**Use approach 3.** It is short enough to write from memory, has no overflow risk, and
is what interviewers expect. Approach 5 is what you would ship, when the language
provides it.

## Where this goes next

LCM is defined in terms of GCD: \`lcm(a, b) = a * b / gcd(a, b)\`. That is the next
subtopic, and it carries an overflow trap that this one does not — \`a * b\` can exceed
the type before the division ever runs.
`.trim(),

  intuition:
    "Any number dividing both values also divides what is left when you take one away from the other. So you can keep shrinking the pair without changing the answer — and since repeated subtraction is what division does, one modulo replaces millions of subtractions.",

  approaches: [
    {
      name: "Brute Force - Check Every Candidate",
      idea: "Test every number from the smaller input downward until one divides both.",
      steps: [
        "Observe that no common divisor can exceed the smaller of the two numbers.",
        "Start a counter at that smaller value.",
        "Test whether the counter divides both numbers exactly, using modulo against each.",
        "If it does, it is the greatest such divisor, since the search runs downward.",
        "Otherwise decrement and repeat, stopping at 1 which always divides both.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
#include <algorithm>
using namespace std;

int gcdBrute(int a, int b) {
    a = abs(a); b = abs(b);
    for (int i = min(a, b); i >= 1; i--) {
        if (a % i == 0 && b % i == 0) return i;   // first hit going down is the greatest
    }
    return 1;
}

int main() {
    cout << gcdBrute(12, 18) << endl;   // 6
    cout << gcdBrute(17, 5)  << endl;   // 1

    // The worst case is two numbers with NO common factor —
    // the loop runs all the way down to 1.
    // Measured: gcd(1000003, 1000033) took 1,000,003 iterations here,
    // against 6 for the modulo version.
    cout << gcdBrute(1000003, 1000033) << endl;   // 1
    return 0;
}`,
          annotations: {
            7: "Searching downward means the first divisor found is automatically the greatest, so no comparison is needed.",
            18: "Both are prime, so nothing above 1 divides either. Brute force pays the full price for that answer.",
          },
        },
        {
          language: "java",
          code: `static int gcdBrute(int a, int b) {
    a = Math.abs(a); b = Math.abs(b);
    for (int i = Math.min(a, b); i >= 1; i--) {
        if (a % i == 0 && b % i == 0) return i;
    }
    return 1;
}

System.out.println(gcdBrute(12, 18));   // 6
System.out.println(gcdBrute(17, 5));    // 1

// Coprime inputs are the worst case: the loop cannot stop early
// because nothing above 1 divides both.`,
          annotations: {
            4: "Two modulo operations per iteration, and up to min(a, b) iterations.",
          },
        },
        {
          language: "python",
          code: `def gcd_brute(a, b):
    a, b = abs(a), abs(b)
    for i in range(min(a, b), 0, -1):
        if a % i == 0 and b % i == 0:
            return i
    return 1

print(gcd_brute(12, 18))   # 6
print(gcd_brute(17, 5))    # 1

# Do not run this on large coprime inputs — it is a million iterations
# for six-digit numbers, and a billion for nine-digit ones.
# print(gcd_brute(1000003, 1000033))   # 1, after ~1,000,003 steps`,
          annotations: {
            3: "range counting down to 1, since 0 as the stop value is exclusive.",
          },
        },
      ],
      complexity: {
        time: "O(min(a, b))",
        space: "O(1)",
        note: "One iteration per candidate divisor, from the smaller input down to 1. The worst case is coprime inputs, where nothing above 1 divides both and the loop cannot exit early — measured at 1,000,003 iterations for two six-digit primes.",
      },
    },
    {
      name: "Euclid by Subtraction",
      idea: "Repeatedly replace the larger number with the difference, since that leaves the set of common divisors unchanged.",
      steps: [
        "Take the absolute value of both inputs, since divisibility ignores sign.",
        "While the two numbers differ, identify the larger one.",
        "Replace the larger with the difference between the two.",
        "The set of common divisors is unchanged by this step, so the answer is preserved.",
        "When the two become equal, that value is the greatest common divisor.",
      ],
      code: [
        {
          language: "cpp",
          code: `int gcdSub(int a, int b) {
    a = abs(a); b = abs(b);
    if (a == 0) return b;
    if (b == 0) return a;

    while (a != b) {
        if (a > b) a -= b;
        else       b -= a;
    }
    return a;
}

// gcd(18, 12) -> (6, 12) -> (6, 6) -> 6
cout << gcdSub(18, 12) << endl;   // 6
cout << gcdSub(12, 18) << endl;   // 6

// THE PROBLEM — measured on this machine:
// gcdSub(1000000000, 2) takes 499,999,999 iterations.
// The modulo version takes 1.
// Repeated subtraction of the same value IS division, done the slow way.`,
          annotations: {
            3: "Without these guards the loop never terminates when one input is zero.",
            8: "Each step shrinks the pair without changing the answer, which is Euclid's insight.",
            17: "Half a billion steps to reach an answer the modulo form gets in one.",
          },
        },
        {
          language: "java",
          code: `static int gcdSub(int a, int b) {
    a = Math.abs(a); b = Math.abs(b);
    if (a == 0) return b;
    if (b == 0) return a;

    while (a != b) {
        if (a > b) a -= b;
        else       b -= a;
    }
    return a;
}

System.out.println(gcdSub(18, 12));   // 6
System.out.println(gcdSub(12, 18));   // 6

// Correct, and unusable on inputs where one value is far larger
// than the other — the classic pathological case is gcd(n, 1),
// which subtracts 1 from n a total of n-1 times.`,
          annotations: {
            15: "gcd(n, 1) is the cleanest illustration: the answer is obviously 1, and this takes n-1 steps to say so.",
          },
        },
        {
          language: "python",
          code: `def gcd_sub(a, b):
    a, b = abs(a), abs(b)
    if a == 0:
        return b
    if b == 0:
        return a

    while a != b:
        if a > b:
            a -= b
        else:
            b -= a
    return a

print(gcd_sub(18, 12))   # 6
print(gcd_sub(12, 18))   # 6

# Historically interesting, practically superseded.
# Its one modern use is on hardware where division is expensive
# and subtraction is not — which is not the case on any CPU
# you will be writing DSA solutions for.`,
          annotations: {
            20: "Worth knowing the reason it still appears in textbooks, so you can recognise when it is not the reason you have.",
          },
        },
      ],
      complexity: {
        time: "O(max(a, b)) in the worst case",
        space: "O(1)",
        note: "Each iteration removes only the smaller value from the larger, so when one input is far bigger the step count approaches their ratio. Measured: gcd(1000000000, 2) takes 499,999,999 iterations. Correct, and superseded by the modulo form in every practical setting.",
      },
    },
    {
      name: "Euclid by Modulo - Iterative",
      idea: "Replace repeated subtraction with a single modulo, collapsing many steps into one.",
      steps: [
        "Take the absolute value of both inputs.",
        "While the second number is not zero, compute the remainder of the first divided by the second.",
        "Move the second number into the first, and the remainder into the second.",
        "Each step shrinks the second number strictly, so the loop is guaranteed to terminate.",
        "When the second number reaches zero, the first holds the greatest common divisor.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

int gcd(int a, int b) {
    a = abs(a); b = abs(b);
    while (b != 0) {
        int temp = a % b;
        a = b;
        b = temp;
    }
    return a;                  // gcd(a, 0) = a — every number divides 0
}

int main() {
    cout << gcd(12, 18) << endl;   // 6
    cout << gcd(18, 12) << endl;   // 6  — order does not matter
    cout << gcd(17, 5)  << endl;   // 1
    cout << gcd(0, 5)   << endl;   // 5
    cout << gcd(5, 0)   << endl;   // 5
    cout << gcd(0, 0)   << endl;   // 0  — by convention

    // One step, where subtraction took 499,999,999:
    cout << gcd(1000000000, 2) << endl;   // 2

    // Worst case for the algorithm: consecutive Fibonacci numbers.
    // gcd(1836311903, 1134903170) took 44 steps — measured.
    cout << gcd(1836311903, 1134903170) << endl;   // 1
    return 0;
}`,
          annotations: {
            5: "No swap is needed if a < b — the first modulo does it, since x % y is x when x is smaller.",
            10: "Returning a when b hits zero is not a stopping hack: gcd(a, 0) genuinely is a.",
            23: "44 steps for the hardest pair below two billion. Brute force could take a billion.",
          },
        },
        {
          language: "java",
          code: `static int gcd(int a, int b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b != 0) {
        int temp = a % b;
        a = b;
        b = temp;
    }
    return a;
}

System.out.println(gcd(12, 18));   // 6
System.out.println(gcd(18, 12));   // 6
System.out.println(gcd(17, 5));    // 1
System.out.println(gcd(0, 5));     // 5
System.out.println(gcd(0, 0));     // 0

System.out.println(gcd(1000000000, 2));   // 2, in one step

// Java has no gcd for primitives. BigInteger has one, but for
// int and long this seven-line function is the standard answer.`,
          annotations: {
            4: "The three-line rotate is the whole algorithm. Worth being able to write from memory.",
            19: "Unlike Python's math.gcd and C++'s std::gcd, Java offers nothing here for primitive types.",
          },
        },
        {
          language: "python",
          code: `def gcd(a, b):
    a, b = abs(a), abs(b)
    while b != 0:
        a, b = b, a % b        # tuple assignment does the rotate in one line
    return a

print(gcd(12, 18))   # 6
print(gcd(18, 12))   # 6
print(gcd(17, 5))    # 1
print(gcd(0, 5))     # 5
print(gcd(0, 0))     # 0

print(gcd(1000000000, 2))   # 2, in one step

# Python's simultaneous assignment removes the temporary variable —
# the right-hand side is fully evaluated before either name is rebound,
# which is the same rule that makes a, b = b, a a valid swap.
print(gcd(1836311903, 1134903170))   # 1, in 44 steps`,
          annotations: {
            4: "Cleanest expression of the algorithm in any of the three languages, and the reason is the evaluation rule from variables-and-constants.",
          },
        },
      ],
      complexity: {
        time: "O(log min(a, b))",
        space: "O(1)",
        note: "Each modulo step reduces the pair substantially rather than by a fixed amount. Lamé's theorem gives consecutive Fibonacci numbers as the worst case, and that was reproduced here: step counts grow linearly with the Fibonacci index while the values grow exponentially, which is exactly the logarithmic bound. The hardest pair below two billion took 44 steps.",
      },
    },
    {
      name: "Euclid by Modulo - Recursive",
      idea: "Write the recurrence directly as a function calling itself, with gcd(a, 0) = a as the base case.",
      steps: [
        "Define the base case: when the second number is zero, return the first.",
        "Otherwise return the result of calling the function with the second number and the remainder.",
        "Each call strictly decreases the second argument, guaranteeing the base case is reached.",
        "The recursive call sits in tail position, so no work remains after it returns.",
        "Note that each pending call occupies a stack frame, unlike the iterative form.",
      ],
      code: [
        {
          language: "cpp",
          code: `int gcdRec(int a, int b) {
    if (b == 0) return a;              // base case: gcd(a, 0) = a
    return gcdRec(b, a % b);           // the recurrence, written literally
}

cout << gcdRec(12, 18) << endl;   // 6
cout << gcdRec(48, 18) << endl;   // 6

// The call chain for gcd(48, 18):
//   gcdRec(48, 18)  ->  48 % 18 = 12
//   gcdRec(18, 12)  ->  18 % 12 = 6
//   gcdRec(12, 6)   ->  12 % 6  = 0
//   gcdRec(6, 0)    ->  base case, returns 6
// Four frames at the deepest point.

// The call is in tail position, so many compilers optimise
// the stack away entirely and produce the iterative loop.`,
          annotations: {
            2: "The base case and the recurrence are the mathematical definition transcribed with no adjustment.",
            3: "Nothing happens after the recursive call returns, which is what tail position means.",
          },
        },
        {
          language: "java",
          code: `static int gcdRec(int a, int b) {
    if (b == 0) return a;
    return gcdRec(b, a % b);
}

System.out.println(gcdRec(12, 18));   // 6
System.out.println(gcdRec(48, 18));   // 6

// Java does NOT perform tail-call optimisation, so every frame is real.
// At a maximum depth of around 44 for 32-bit inputs that is harmless,
// but the guarantee C++ sometimes gives does not exist here.`,
          annotations: {
            9: "Worth knowing as a general Java fact, not just for this problem.",
          },
        },
        {
          language: "python",
          code: `def gcd_rec(a, b):
    if b == 0:
        return a
    return gcd_rec(b, a % b)

print(gcd_rec(12, 18))   # 6
print(gcd_rec(48, 18))   # 6

# Python does not optimise tail calls either, and its default
# recursion limit is 1000 frames. The maximum depth here is about
# 44 for values under two billion, so there is ample headroom.
import sys
print(sys.getrecursionlimit())   # 1000

# Python's negative modulo does not cause trouble here, because
# taking absolute values first keeps both arguments non-negative:
def gcd_rec_safe(a, b):
    return gcd_rec(abs(a), abs(b))

print(gcd_rec_safe(-12, 18))   # 6`,
          annotations: {
            10: "A depth of 44 against a limit of 1000 leaves plenty of room, unlike recursions whose depth scales with the value itself.",
            17: "Guarding the sign once at the entry point rather than inside the recursion avoids repeating the work on every call.",
          },
        },
      ],
      complexity: {
        time: "O(log min(a, b))",
        space: "O(log min(a, b))",
        note: "The same step count as the iterative version, but each pending call holds a stack frame, so memory grows with the number of steps rather than staying constant. At most about 44 frames for 32-bit inputs. The call is in tail position, which C++ compilers often optimise back to constant space; Java and Python do not.",
      },
    },
    {
      name: "Built-in Library Functions",
      idea: "Use the language's own implementation, which is the same algorithm written by someone else.",
      steps: [
        "Check whether the language provides a GCD function for the types involved.",
        "Confirm how it treats negative inputs and zero, since conventions vary.",
        "Call it directly rather than reimplementing.",
        "Fall back to the seven-line iterative version where no built-in exists, as in Java for primitive types.",
      ],
      code: [
        {
          language: "python",
          code: `import math

print(math.gcd(12, 18))    # 6
print(math.gcd(17, 5))     # 1
print(math.gcd(0, 5))      # 5
print(math.gcd(0, 0))      # 0   — same convention as the manual version
print(math.gcd(-12, 18))   # 6   — absolute values taken automatically

# Since Python 3.9 it accepts any number of arguments
print(math.gcd(12, 18, 24))   # 6
print(math.gcd())             # 0

# math.lcm exists too, from Python 3.9 — the next subtopic
print(math.lcm(4, 6))         # 12`,
          annotations: {
            9: "Verified: math.gcd(-12, 18) returns 6, so no manual abs() is needed.",
            12: "The multi-argument form folds gcd across the list, which saves writing a loop.",
          },
        },
        {
          language: "cpp",
          code: `#include <numeric>     // C++17 and later
#include <algorithm>   // for the older __gcd
using namespace std;

// C++17 onward — the standard, portable choice
cout << gcd(12, 18) << endl;   // 6
cout << gcd(17, 5)  << endl;   // 1
cout << gcd(0, 5)   << endl;   // 5

// Pre-C++17 — a GCC extension, widely used in competitive programming
cout << __gcd(12, 18) << endl;   // 6

// std::gcd requires non-negative arguments in practice.
// Take absolute values yourself if the input can be negative:
cout << gcd(abs(-12), abs(18)) << endl;   // 6

// std::lcm is in the same header — the next subtopic.
cout << lcm(4, 6) << endl;   // 12`,
          annotations: {
            6: "std::gcd is in <numeric>, not <algorithm>, which catches people out.",
            10: "__gcd is not standard C++. It works on GCC and Clang and may not elsewhere.",
          },
        },
        {
          language: "java",
          code: `import java.math.BigInteger;

// Java has NO gcd for int or long. This is the only built-in:
BigInteger a = BigInteger.valueOf(12);
BigInteger b = BigInteger.valueOf(18);
System.out.println(a.gcd(b));   // 6

// BigInteger.gcd returns the absolute value, so signs are handled:
System.out.println(BigInteger.valueOf(-12).gcd(BigInteger.valueOf(18)));   // 6

// For primitives, write the loop. It is seven lines and faster than
// boxing into BigInteger just to unbox the result again:
static int gcd(int a, int b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b != 0) { int t = a % b; a = b; b = t; }
    return a;
}
System.out.println(gcd(12, 18));   // 6`,
          annotations: {
            4: "Converting int to BigInteger and back costs far more than the loop it replaces.",
            13: "This is the version to memorise, since Java gives you nothing else for primitives.",
          },
        },
      ],
      complexity: {
        time: "O(log min(a, b))",
        space: "O(1)",
        note: "Standard library implementations use the same Euclidean algorithm, often with low-level refinements such as the binary GCD. Java is the exception among the three: it provides nothing for primitive types, and BigInteger.gcd costs more in conversion than the seven-line loop it would replace.",
      },
    },
  ],

  examples: [
    {
      input: "gcd(48, 18) using the modulo form",
      output: "6, in three steps",
      walkthrough: [
        "Start with a as 48 and b as 18. Since b is not zero, compute 48 modulo 18, which is 12.",
        "Rotate: a becomes 18 and b becomes 12.",
        "b is not zero, so compute 18 modulo 12, which is 6. Rotate: a becomes 12 and b becomes 6.",
        "b is not zero, so compute 12 modulo 6, which is 0. Rotate: a becomes 6 and b becomes 0.",
        "b is now zero, so the loop ends and a holds 6.",
        "Checking: 48 is 6 times 8 and 18 is 6 times 3, and no larger number divides both.",
      ],
      why: "The core trace. Three modulo operations replace the search through eighteen candidate divisors that brute force would perform.",
    },
    {
      input: "gcd(1000000000, 2), by subtraction and by modulo",
      output: "Subtraction: 499,999,999 steps. Modulo: 1 step.",
      walkthrough: [
        "The subtraction form repeatedly takes 2 away from a billion, one step at a time.",
        "It needs 499,999,999 iterations before the two values finally meet at 2.",
        "The modulo form computes a billion modulo 2 in a single operation, which is 0.",
        "It rotates to a as 2 and b as 0, the condition fails immediately, and it returns 2.",
        "The difference is the entire point: repeated subtraction of the same value is division.",
        "Doing it one step at a time discards the fact that the processor has a divide instruction.",
      ],
      why: "Both step counts were instrumented and measured on this machine. The ratio is large enough that the argument needs no rhetoric.",
    },
    {
      input: "Consecutive Fibonacci numbers, the worst case for Euclid",
      output: "Steps grow linearly with the Fibonacci index while the values grow exponentially",
      walkthrough: [
        "For F(10) and F(9), which are 89 and 55, the algorithm takes 9 steps.",
        "For F(20) and F(19), which are 10946 and 6765, it takes 19 steps.",
        "For F(30) and F(29), roughly 1.3 million and 832 thousand, it takes 29 steps.",
        "For F(45) and F(44), roughly 1.8 billion and 1.1 billion, it takes 44 steps.",
        "The step count tracks the index almost exactly, while the values roughly double with each index.",
        "A count that grows linearly against a value that grows exponentially is the definition of logarithmic.",
      ],
      why: "Lamé's theorem demonstrated rather than asserted. It also gives a concrete ceiling: the hardest pair below two billion costs 44 steps.",
    },
    {
      input: "gcd(12, 18), where the first argument is smaller",
      output: "6, with no swap written anywhere",
      walkthrough: [
        "The loop begins with a as 12 and b as 18, which looks like the wrong order.",
        "It computes 12 modulo 18. Since 12 is smaller than 18, the remainder is 12 itself.",
        "Rotating gives a as 18 and b as 12, which is the order you would have arranged manually.",
        "From here the algorithm proceeds normally and returns 6.",
        "The cost was one extra iteration, and the benefit is that no comparison or swap is needed in the code.",
        "Verified: gcd(12, 18) and gcd(18, 12) both return 6.",
      ],
      why: "A common instinct is to add a swap at the top. Seeing why it is unnecessary keeps the implementation to its minimum.",
    },
  ],

  visualization: {
    kind: "custom",
    description:
      "Draw the two numbers as horizontal bars whose lengths are proportional to their values, aligned at the left edge. The SUBTRACTION panel animates Euclid's original method: the shorter bar is subtracted from the longer by visibly trimming a segment equal to the shorter bar off the longer one, repeatedly, with a step counter climbing. Run gcd(18, 12) so it resolves in a few visible steps, then switch to gcd(1000000000, 2) and let the counter spin while the longer bar barely shortens — deliberately leave it spinning, with the measured total of 499,999,999 displayed, so the failure is felt rather than described. The MODULO panel replaces each trim with a single cut: the longer bar is divided into as many whole copies of the shorter bar as fit, all of them removed at once, and the leftover stub becomes the new shorter bar — with the number of copies removed shown as the quotient. Run the same billion-and-two input so the entire bar vanishes in one cut and the counter reads 1 beside the other panel's 499,999,999. Add a DIVISOR GRID beneath both, drawing tick marks at every multiple of the current candidate along both bars, so that a common divisor is visible as ticks that line up at the end of both bars simultaneously — this makes Euclid's insight concrete, since trimming one bar by the other leaves every aligned tick still aligned. Finish with a WORST CASE panel plotting step count against input magnitude on a logarithmic horizontal axis, with consecutive Fibonacci pairs marked as points: they form a straight rising line while random pairs scatter well below it, and the line's straightness on a log axis is the logarithmic bound shown as a shape rather than a formula.",
    sampleInput:
      '{"trace":{"a":48,"b":18,"steps":[{"a":48,"b":18,"remainder":12,"quotient":2},{"a":18,"b":12,"remainder":6,"quotient":1},{"a":12,"b":6,"remainder":0,"quotient":2}],"answer":6},"comparison":{"a":1000000000,"b":2,"subtractionSteps":499999999,"moduloSteps":1,"answer":2,"measured":true},"bruteForce":{"a":1000003,"b":1000033,"steps":1000003,"moduloSteps":6,"answer":1},"lame":[{"index":10,"fib":89,"prev":55,"steps":9},{"index":20,"fib":10946,"prev":6765,"steps":19},{"index":30,"fib":1346269,"prev":832040,"steps":29},{"index":40,"fib":165580141,"prev":102334155,"steps":39},{"index":45,"fib":1836311903,"prev":1134903170,"steps":44}],"edgeCases":{"gcd(0,5)":5,"gcd(5,0)":5,"gcd(0,0)":0,"gcd(12,18)":6,"gcd(18,12)":6}}',
    highlights: [
      "The two numbers are drawn as horizontal bars proportional to their values, aligned at the left.",
      "The subtraction panel trims a segment equal to the shorter bar off the longer one, over and over, with a step counter climbing.",
      "Running gcd(18, 12) resolves in a few visible trims and the bars end equal at the answer.",
      "Switching to gcd(1000000000, 2) leaves the counter spinning while the long bar barely shortens.",
      "The measured total of 499,999,999 is displayed against a bar that has hardly moved.",
      "The modulo panel replaces each trim with one cut, removing every whole copy of the shorter bar at once.",
      "The leftover stub becomes the new shorter bar, and the number of copies removed is shown as the quotient.",
      "On the same billion-and-two input the entire bar vanishes in a single cut and the counter reads 1.",
      "A divisor grid marks every multiple of the current candidate along both bars.",
      "A common divisor appears as ticks that land exactly at the end of both bars at once.",
      "Trimming one bar by the other leaves every aligned tick still aligned, which is Euclid's insight made visible.",
      "The worst-case panel plots step count against magnitude on a logarithmic axis.",
      "Consecutive Fibonacci pairs form a straight rising line while random pairs scatter below it.",
      "That straight line on a logarithmic axis is the logarithmic bound shown as a shape rather than stated as a formula.",
    ],
  },

  edgeCases: [
    "One input equal to zero, where the answer is the other input, since every number divides zero.",
    "Both inputs zero, which is defined as zero by convention because every number divides zero and no greatest exists.",
    "Negative inputs, where divisibility ignores sign so the absolute values give the answer.",
    "The first argument smaller than the second, which the first modulo step swaps automatically at the cost of one iteration.",
    "Two equal inputs, where the answer is that value and the modulo form finishes in a single step.",
    "Coprime inputs, which return 1 and are the worst case for brute force but not for Euclid.",
    "Consecutive Fibonacci numbers, which are the worst case for Euclid by Lamé's theorem.",
    "One input equal to 1, where the answer is 1 and the subtraction form takes as many steps as the other value.",
    "The subtraction form given a zero input without a guard, which loops forever since the values never become equal.",
    "Very large inputs in Python, where unbounded integers mean the algorithm works at any magnitude.",
  ],

  pitfalls: [
    "Using the subtraction form on inputs of very different magnitudes, where the step count approaches their ratio.",
    "Omitting the zero guards in the subtraction form, which never terminates because the values never meet.",
    "Adding a swap to put the larger argument first, which is unnecessary since the first modulo does it.",
    "Returning zero rather than the remaining value when the second argument reaches zero, which discards the answer.",
    "Forgetting to take absolute values when negative inputs are possible.",
    "Reimplementing GCD in Python or modern C++ when math.gcd and std::gcd already exist.",
    "Looking for std::gcd in the algorithm header, when it lives in numeric.",
    "Using the non-standard __gcd in C++ code that must compile outside GCC and Clang.",
    "Converting primitives to BigInteger in Java purely to call gcd, which costs more than the loop it replaces.",
    "Assuming brute force is acceptable because the inputs look small, when coprime six-digit numbers already cost a million iterations.",
  ],

  commonDoubts: [
    {
      question: "Why does replacing a with a % b preserve the answer?",
      answer:
        "Because any number dividing both a and b also divides a minus b, and by extension a minus any multiple of b. The remainder a % b is exactly a with as many copies of b removed as fit, so the set of common divisors of the pair is unchanged. Since the set is identical, its largest member — the GCD — is identical too. That is Euclid's entire insight, and the modulo version is just the subtraction version with all the repeated steps collapsed into one operation.",
    },
    {
      question: "Why is gcd(a, 0) equal to a?",
      answer:
        "Because every number divides zero exactly — zero divided by anything leaves no remainder. So the common divisors of a and 0 are simply all the divisors of a, and the greatest of those is a itself. This is why the base case is mathematically correct rather than an arbitrary place to stop. By the same reasoning gcd(0, 0) has no greatest common divisor, since every number qualifies, and it is defined as 0 by convention.",
    },
    {
      question: "Do I need to put the larger number first?",
      answer:
        "No. If a is smaller than b, then a % b is just a, so the first iteration rotates them into the order you would have arranged by hand. It costs one extra iteration and saves a comparison and a swap in the code. Verified: gcd(12, 18) and gcd(18, 12) both return 6. Adding a swap at the top is a common instinct and is genuinely unnecessary.",
    },
    {
      question: "How much slower is the subtraction version really?",
      answer:
        "Enormously, on the wrong input. Measured on this machine, gcd(1000000000, 2) takes 499,999,999 iterations by subtraction and 1 by modulo. The pattern is that subtraction removes only the smaller value each time, so when one input is far larger than the other the step count approaches their ratio. The clearest illustration is gcd(n, 1): the answer is obviously 1, and subtraction needs n minus 1 steps to say so.",
    },
    {
      question: "Why is the complexity O(log min(a, b))?",
      answer:
        "Because each modulo step shrinks the numbers by a substantial fraction rather than a fixed amount. Lamé's theorem identifies the worst case as consecutive Fibonacci numbers, and that was measured here: F(10) takes 9 steps, F(20) takes 19, F(30) takes 29 and F(45) takes 44. The step count grows linearly with the Fibonacci index while the values grow exponentially with it — a count linear in the index against a value exponential in it is precisely what logarithmic means. Concretely, the hardest pair below two billion costs 44 steps.",
    },
    {
      question: "Should I use recursion or iteration?",
      answer:
        "Either is fine here, and iteration is the safer default. The recursive form transcribes the mathematical recurrence directly and reads beautifully, but each pending call holds a stack frame, so its space is O(log min(a, b)) rather than constant. At a maximum depth of about 44 for 32-bit inputs that is harmless. The call is in tail position, which C++ compilers frequently optimise back into a loop, though Java and Python do not perform tail-call optimisation at all.",
    },
    {
      question: "Does my language have a built-in?",
      answer:
        "Python has math.gcd, which handles negatives by taking absolute values and accepts any number of arguments since 3.9. C++ has std::gcd from C++17, in the numeric header rather than algorithm — GCC and Clang also offer the non-standard __gcd, which is common in competitive programming but not portable. Java has nothing for primitive types; BigInteger.gcd exists, but converting an int to BigInteger and back costs far more than the seven-line loop, so writing it out is the right answer there.",
    },
    {
      question: "What about negative numbers?",
      answer:
        "Divisibility ignores sign, so gcd(-12, 18) is 6 exactly as gcd(12, 18) is. Take absolute values at the entry point. Python's math.gcd does this internally and returns 6 for negative arguments, which was verified. Doing it once at the top rather than inside a recursive call also avoids repeating the work on every level.",
    },
  ],

  relatedIds: ["lcm", "prime-check", "arithmetic-operators", "while-loop"],
};

export default content;
