import type { SubtopicContent } from "../types";

/**
 * Subtopic 22 of Basics (Medium #6). Base of a three-part chain:
 * Count Digits -> Reverse a Number -> Palindrome Number.
 *
 * SOURCES
 * - GeeksforGeeks, "Count digits" (dsa/program-count-digits-integer-3-different-
 *   methods): the canonical four approaches — iterative, recursive, log10,
 *   string — with the complexities stated there and adopted here.
 * - OpenJDK, java.lang.Integer / java.lang.Long stringSize (now
 *   DecimalDigits.stringSize): the production implementation compares against a
 *   precomputed table of powers of ten. That is the fifth approach here, and it
 *   is the only one that is both O(1) and exact.
 *
 * MEASURED ON THIS MACHINE (python3 and g++ -O2), not assumed:
 * - (int)log10(n) + 1 overcounts by one for 999999999999999 (15),
 *   9999999999999999 (16) and 999999999999999999 (18). The true logarithm sits
 *   just below the integer, and no double exists in that gap, so it rounds up.
 * - The lookup-table approach agrees with the iterative loop on every value
 *   tested, including 0, 1, exact powers of ten, and LLONG_MAX.
 *
 * The supplied problem statement described removing a digit with "%10". That is
 * the wrong operator — %10 reads the last digit, /10 removes it — so all code
 * here uses integer division.
 */
const content: SubtopicContent = {
  id: "count-digits",
  topic: "Basics",
  title: "Count Digits",
  difficulty: "Medium",
  status: "ready",

  prerequisites: [
    "while-loop",
    "arithmetic-operators",
    "type-conversion-and-casting",
    "functions-declaration-and-calling",
  ],

  summary:
    "Given an integer N, return how many digits it has — five approaches from a simple loop to the constant-time table lookup production libraries actually use.",

  theory: `
## The problem

Given an integer \`N\`, return the number of digits in it.

\`\`\`
N = 12345  ->  5
N = 7789   ->  4
N = 0      ->  1
\`\`\`

## Two operators do all the work

A number does not store its own length — the digit count is a property of how we
*write* it in base 10, not of the value. So we take it apart, using a pair of
operators that you will see together for the rest of this chapter:

- **\`N % 10\`** gives the **last digit**. \`12345 % 10\` is \`5\`.
- **\`N / 10\`** (integer division) **removes** the last digit. \`12345 / 10\` is \`1234\`.

One reads, the other removes. Counting digits only needs the second; the next two
subtopics need both.

Because integer division discards the fraction, repeating \`N / 10\` shrinks the number
by exactly one digit per step until it hits zero:

\`\`\`
12345 -> 1234 -> 123 -> 12 -> 1 -> 0
\`\`\`

Five steps, five digits.

## Five approaches

| # | Approach | Time | Space | Exact? |
|---|---|---|---|---|
| 1 | Iterative loop | O(log₁₀ N) | O(1) | Yes |
| 2 | Recursion | O(log₁₀ N) | **O(log₁₀ N)** — call stack | Yes |
| 3 | Logarithm formula | **O(1)** | O(1) | **No** — see below |
| 4 | String conversion | O(log₁₀ N) | **O(log₁₀ N)** — the string | Yes |
| 5 | Lookup table | **O(1)** | O(1) | **Yes** |

Approach 1 is the one to know cold. Approach 5 is what production libraries actually
ship. Approach 3 is the one everybody reaches for and the one with a real problem.

## Why O(log₁₀ N) is not a performance concern here

The loop runs once per digit. A 32-bit integer has at most 10 digits and a 64-bit
integer at most 19. **The loop cannot run more than 19 times for any input that
exists.**

So the O(log₁₀ N) label is accurate and describes a quantity bounded by 19. Chasing
O(1) to save at most eighteen iterations is not a real optimisation — which matters
when evaluating approach 3.

## The logarithm formula, and why it fails

The closed form:

\`\`\`
digits = floor(log10(N)) + 1
\`\`\`

\`log10(N)\` gives the power 10 must be raised to in order to reach N. For 12345 that
is about 4.09; flooring and adding one gives 5. The \`+ 1\` is what makes exact powers
of ten work — \`log10(1000)\` is 3, and 1000 has 4 digits.

It is genuinely O(1). It is also **wrong for large inputs**, and this was measured
rather than assumed:

| N | digits | formula gives |
|---|---|---|
| 999,999,999,999,999 | 15 | **16** ✗ |
| 9,999,999,999,999,999 | 16 | **17** ✗ |
| 999,999,999,999,999,999 | 18 | **19** ✗ |

The true value of log10(999999999999999) is 14.999999999999999996…, just under 15. At
that magnitude the spacing between representable doubles is wide enough that **no
double exists between that value and 15.0**, so the library returns exactly 15.0.
Flooring gives 15, plus one gives 16, and the answer is wrong.

Reproduced identically in Python 3 and g++, so it is a property of IEEE-754 arithmetic
rather than of one language. Java uses the same doubles. These values fit comfortably
in a 64-bit integer.

## The approach that is both O(1) and correct

If the loop is bounded at 19 iterations, and the number of digits is decided entirely
by which range N falls into, you can just **compare against the boundaries directly**:

\`\`\`
if (n <= 9)     return 1;
if (n <= 99)    return 2;
if (n <= 999)   return 3;
...
\`\`\`

At most 19 integer comparisons, no loop over the digits, and **no floating point
anywhere** — so no rounding to go wrong.

This is not a textbook curiosity. It is what the JDK does: \`Integer.toString\` and
\`Long.toString\` call \`stringSize\`, which compares against a precomputed table of
powers of ten to decide how large a buffer to allocate. If the standard library
avoids \`log10\` for exactly this reason, that is a strong signal.

Verified here against the iterative loop on 0, 1, 9, 10, 99, 100, both worked
examples, all three values where \`log10\` fails, and \`LLONG_MAX\` — identical on every
one.

## Recursion

The same division, expressed as a function calling itself:

\`\`\`
countDigits(n) = 1                          if n < 10
               = 1 + countDigits(n / 10)    otherwise
\`\`\`

Correct and compact. The cost is **space**: each call adds a frame to the call stack,
so this uses O(log₁₀ N) memory where the loop uses O(1). For 19 frames that is
irrelevant, but the principle matters — recursion trades stack space for expressiveness,
and that trade becomes expensive when depth grows with input size.

## String conversion

Convert the number to text and take the length. Shortest to write, correct for every
input, and the only approach besides recursion that allocates — one character per
digit, so O(log₁₀ N) space.

Remember to strip the sign first, or the minus character is counted as a digit.

## Zero and negatives

**Zero has one digit**, and three of the five approaches get it wrong without a guard:

- The loop tests \`N > 0\`, fails immediately, and returns **0**.
- Recursion needs \`n < 10\` as its base case rather than \`n == 0\`, which handles it.
- \`log10(0)\` is undefined — negative infinity in C++ and Java, \`ValueError\` in Python.
- String conversion needs no guard: \`"0"\` is already one character.
- The table needs no guard: \`0 <= 9\` returns 1 correctly.

**Negatives** need the absolute value taken first, or the loop's condition fails
immediately and \`log10\` returns not-a-number. One sharp edge: negating the most
negative value of a signed type overflows, because its positive counterpart does not
fit. \`Math.abs(Long.MIN_VALUE)\` in Java is still negative.

## Which to use

**Learn approach 1.** It is the extraction loop the next two subtopics are built on,
and it is what an interviewer is asking for.

**Use approach 5** when the digit count is on a hot path — it is exact and constant.

**Use approach 4** when you want one readable line and allocation does not matter.

**Avoid approach 3** as a default. Know it, know why it fails, and reach for it only
when an approximation is acceptable.

The lesson worth taking: **a better complexity class is not automatically a better
solution.** Approach 3 has the best complexity on paper and is the only one that is
wrong.
`.trim(),

  intuition:
    "You cannot ask a number how long it is, so you either dismantle it one digit at a time or ask which range it falls into. Everything else is a variation on those two ideas — and the only approach that skips both, the logarithm, is the only one that gets the wrong answer.",

  approaches: [
    {
      name: "Iterative Digit-Removal Loop",
      idea: "Strip the last digit off N with integer division, counting the strips until N reaches zero.",
      steps: [
        "Guard the input: zero has one digit, so return 1 immediately.",
        "Take the absolute value if negatives are possible.",
        "Initialise a counter to zero.",
        "While N is greater than zero, increment the counter.",
        "Remove the last digit by dividing N by 10 with integer division.",
        "When N reaches zero the condition fails, and the counter holds the digit count.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

int countDigits(long long n) {
    if (n == 0) return 1;        // zero is written with one digit
    if (n < 0) n = -n;           // ignore the sign

    int count = 0;
    while (n > 0) {
        count++;
        n /= 10;                 // integer division REMOVES the last digit
    }
    return count;
}

int main() {
    cout << countDigits(12345) << endl;               // 5
    cout << countDigits(7789)  << endl;               // 4
    cout << countDigits(0)     << endl;               // 1
    cout << countDigits(-450)  << endl;               // 3
    cout << countDigits(999999999999999LL) << endl;   // 15
    return 0;
}`,
          annotations: {
            5: "Without this guard the loop runs zero times and reports zero digits for a number that has one.",
            11: "n /= 10 removes the digit. Writing n %= 10 reads it instead and loops forever.",
            16: "One of the values where the logarithm approach is wrong. This loop is correct.",
          },
        },
        {
          language: "java",
          code: `public class CountDigits {

    static int countDigits(long n) {
        if (n == 0) return 1;
        if (n < 0) n = -n;

        int count = 0;
        while (n > 0) {
            count++;
            n /= 10;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(countDigits(12345));              // 5
        System.out.println(countDigits(7789));               // 4
        System.out.println(countDigits(0));                  // 1
        System.out.println(countDigits(-450));               // 3
        System.out.println(countDigits(999999999999999L));   // 15
    }
}`,
          annotations: {
            9: "Java's integer division truncates toward zero exactly as C++ does, so the loop is identical.",
          },
        },
        {
          language: "python",
          code: `def count_digits(n):
    if n == 0:
        return 1
    n = abs(n)

    count = 0
    while n > 0:
        count += 1
        n //= 10                 # FLOOR division removes the last digit
    return count

print(count_digits(12345))              # 5
print(count_digits(7789))               # 4
print(count_digits(0))                  # 1
print(count_digits(-450))               # 3
print(count_digits(999999999999999))    # 15

# Python integers are unbounded, so this scales to any magnitude
print(count_digits(10 ** 100))          # 101`,
          annotations: {
            9: "Use // and not /. True division gives 0.7, then 0.07, approaching zero without reaching it — an infinite loop.",
            18: "The loop handles arbitrarily large integers. The logarithm approach cannot.",
          },
        },
      ],
      complexity: {
        time: "O(log₁₀ N)",
        space: "O(1)",
        note: "One iteration per digit, and the digit count is floor(log10 N) + 1. Bounded at 10 iterations for a 32-bit int and 19 for a 64-bit one, so it is effectively constant in practice. Only the counter is stored.",
      },
    },
    {
      name: "Recursion",
      idea: "Express the same division as a function calling itself, one digit per call.",
      steps: [
        "Define the base case: a number below 10 has exactly one digit.",
        "Otherwise, remove the last digit by dividing by 10.",
        "Return one plus the digit count of that smaller number.",
        "Each call reduces the number by one digit, so the recursion is guaranteed to reach the base case.",
        "Note that every pending call occupies a stack frame until the base case returns.",
      ],
      code: [
        {
          language: "cpp",
          code: `int countDigitsRec(long long n) {
    if (n < 0) n = -n;
    if (n < 10) return 1;                    // base case, also covers 0
    return 1 + countDigitsRec(n / 10);       // one digit removed per call
}

cout << countDigitsRec(12345) << endl;   // 5
cout << countDigitsRec(0)     << endl;   // 1
cout << countDigitsRec(7789)  << endl;   // 4

// The call chain for 12345:
//   countDigitsRec(12345) = 1 + countDigitsRec(1234)
//                         = 1 + 1 + countDigitsRec(123)
//                         = 1 + 1 + 1 + countDigitsRec(12)
//                         = 1 + 1 + 1 + 1 + countDigitsRec(1)
//                         = 1 + 1 + 1 + 1 + 1  =  5
// Five frames existed simultaneously at the deepest point.`,
          annotations: {
            3: "n < 10 rather than n == 0 as the base case, which handles zero without a separate guard.",
            4: "The recursive call must be on a strictly smaller value, or the recursion never terminates.",
          },
        },
        {
          language: "java",
          code: `static int countDigitsRec(long n) {
    if (n < 0) n = -n;
    if (n < 10) return 1;                  // base case, covers 0 too
    return 1 + countDigitsRec(n / 10);
}

System.out.println(countDigitsRec(12345));   // 5
System.out.println(countDigitsRec(0));       // 1
System.out.println(countDigitsRec(7789));    // 4

// Java's default stack handles 19 frames without difficulty.
// Recursion depth only becomes a concern when it grows with input size.`,
          annotations: {
            3: "Handling the sign before recursing avoids negating on every call.",
          },
        },
        {
          language: "python",
          code: `def count_digits_rec(n):
    n = abs(n)
    if n < 10:
        return 1                           # base case, covers 0
    return 1 + count_digits_rec(n // 10)

print(count_digits_rec(12345))   # 5
print(count_digits_rec(0))       # 1
print(count_digits_rec(7789))    # 4

# Python's default recursion limit is 1000 frames, so a 19-deep
# chain is safe. Very large integers would still be fine here,
# since the depth is the digit count, not the value.
import sys
print(sys.getrecursionlimit())   # 1000`,
          annotations: {
            5: "Use // here too. True division would produce a float and never reach the base case cleanly.",
            13: "Worth knowing before writing recursion where depth scales with the input rather than its digit count.",
          },
        },
      ],
      complexity: {
        time: "O(log₁₀ N)",
        space: "O(log₁₀ N)",
        note: "The same number of steps as the loop, but each pending call occupies a stack frame until the base case returns, so memory grows with the digit count instead of staying constant. At most 19 frames for a 64-bit integer — harmless here, and the principle matters whenever recursion depth scales with input size.",
      },
    },
    {
      name: "Logarithm Formula",
      idea: "Compute floor(log10(N)) + 1 directly, with no iteration at all.",
      steps: [
        "Guard zero and negatives, since the logarithm is undefined for both.",
        "Take the base-10 logarithm of N.",
        "Discard the fractional part by casting to an integer.",
        "Add one to account for exact powers of ten.",
        "Confirm N stays below roughly 10^15, above which floating-point rounding makes the result unreliable.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <cmath>

int countDigitsLog(long long n) {
    if (n == 0) return 1;
    if (n < 0) n = -n;
    return (int) log10((double) n) + 1;
}

// Correct for ordinary values
cout << countDigitsLog(12345) << endl;   // 5
cout << countDigitsLog(7789)  << endl;   // 4
cout << countDigitsLog(1000)  << endl;   // 4  — the +1 handles powers of ten

// WRONG above about 10^15 — measured with g++ -O2 on this machine
cout << countDigitsLog(999999999999999LL)    << endl;   // 16, should be 15
cout << countDigitsLog(9999999999999999LL)   << endl;   // 17, should be 16
cout << countDigitsLog(999999999999999999LL) << endl;   // 19, should be 18`,
          annotations: {
            4: "Both guards are mandatory: log10(0) is negative infinity and log10 of a negative is not a number.",
            14: "The true logarithm is 14.999999999999999996..., and the nearest double to it is exactly 15.0.",
          },
        },
        {
          language: "java",
          code: `static int countDigitsLog(long n) {
    if (n == 0) return 1;
    if (n < 0) n = -n;
    return (int) Math.log10(n) + 1;
}

System.out.println(countDigitsLog(12345));   // 5
System.out.println(countDigitsLog(7789));    // 4
System.out.println(countDigitsLog(1000));    // 4

// Java uses the same IEEE-754 doubles, so it shares the limitation:
// countDigitsLog(999999999999999L) returns 16, not 15.

// Notably, the JDK itself does NOT use log10 for this —
// Long.toString calls stringSize, which compares against a table.
System.out.println(String.valueOf(999999999999999L).length());   // 15`,
          annotations: {
            4: "The cast truncates toward zero, which equals floor for the positive value the guards guarantee.",
            13: "If the standard library avoids log10 for exactly this task, that is a strong signal.",
          },
        },
        {
          language: "python",
          code: `import math

def count_digits_log(n):
    if n == 0:
        return 1
    n = abs(n)
    return int(math.log10(n)) + 1

print(count_digits_log(12345))   # 5
print(count_digits_log(7789))    # 4
print(count_digits_log(1000))    # 4

# WRONG above about 10^15 — measured with python3 on this machine
print(count_digits_log(999999999999999))    # 16, should be 15
print(len(str(999999999999999)))            # 15 — the correct value

# math.log10(0) raises ValueError rather than returning -inf like C++.
# math.log10 of a negative raises ValueError as well.`,
          annotations: {
            7: "int() truncates toward zero, matching floor for the positive value guaranteed above.",
            14: "Reproducible: the true logarithm is a hair under 15 and the nearest double is exactly 15.0.",
          },
        },
      ],
      complexity: {
        time: "O(1)",
        space: "O(1)",
        note: "A single library call with no iteration — genuinely constant time. The catch is correctness rather than speed: floating-point rounding makes it overcount by one from roughly 10^15 upward, and those values fit inside a 64-bit integer.",
      },
    },
    {
      name: "String Conversion",
      idea: "Convert the number to text and take its length.",
      steps: [
        "Take the absolute value, so the minus sign is not counted as a digit.",
        "Convert the integer to its string representation.",
        "Return the length of that string.",
        "Note that no zero guard is needed, since converting zero already gives one character.",
      ],
      code: [
        {
          language: "python",
          code: `def count_digits_str(n):
    return len(str(abs(n)))

print(count_digits_str(12345))              # 5
print(count_digits_str(7789))               # 4
print(count_digits_str(0))                  # 1  — str(0) is "0", no guard needed
print(count_digits_str(-450))               # 3
print(count_digits_str(999999999999999))    # 15 — correct

# Correct for arbitrarily large integers too
print(count_digits_str(10 ** 100))          # 101`,
          annotations: {
            2: "abs handles the sign. Without it the minus character would be counted as a digit.",
            6: "The only approach needing no special case for zero.",
          },
        },
        {
          language: "cpp",
          code: `#include <string>
using namespace std;

int countDigitsStr(long long n) {
    if (n < 0) n = -n;
    return to_string(n).size();
}

cout << countDigitsStr(12345) << endl;               // 5
cout << countDigitsStr(0)     << endl;               // 1  — to_string(0) is "0"
cout << countDigitsStr(999999999999999LL) << endl;   // 15 — correct

// Correct everywhere, but it builds a string on every call.
// That is the hidden cost: O(log N) space rather than O(1).`,
          annotations: {
            6: "to_string allocates. For one call that is nothing; inside a loop over millions of values it is not.",
          },
        },
        {
          language: "java",
          code: `static int countDigitsStr(long n) {
    return String.valueOf(Math.abs(n)).length();
}

System.out.println(countDigitsStr(12345));              // 5
System.out.println(countDigitsStr(0));                  // 1
System.out.println(countDigitsStr(999999999999999L));   // 15

// Careful: Math.abs(Long.MIN_VALUE) is still negative, because the
// positive counterpart does not fit in a long. Any approach that
// negates the input needs that case handled separately.`,
          annotations: {
            9: "A genuine trap in all three languages for the most negative representable value.",
          },
        },
      ],
      complexity: {
        time: "O(log₁₀ N)",
        space: "O(log₁₀ N)",
        note: "Building the string visits every digit, so the time matches the loop. Unlike the loop it stores those digits, making it one of only two approaches here with non-constant space.",
      },
    },
    {
      name: "Lookup Table - Constant Time and Exact",
      idea: "Compare N against the precomputed boundaries of each digit range, avoiding both iteration over digits and floating point.",
      steps: [
        "Take the absolute value if negatives are possible.",
        "Compare N against 9, then 99, then 999, and so on.",
        "Return the position of the first boundary that N does not exceed.",
        "Since a 64-bit integer has at most 19 digits, the comparison chain has a fixed maximum length.",
        "No floating-point value is involved at any point, so no rounding can occur.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

int countDigitsTable(long long n) {
    if (n < 0) n = -n;

    static const long long p[] = {
        9LL, 99LL, 999LL, 9999LL, 99999LL, 999999LL, 9999999LL,
        99999999LL, 999999999LL, 9999999999LL, 99999999999LL,
        999999999999LL, 9999999999999LL, 99999999999999LL,
        999999999999999LL, 9999999999999999LL, 99999999999999999LL,
        999999999999999999LL
    };

    for (int i = 0; i < 18; i++) {
        if (n <= p[i]) return i + 1;
    }
    return 19;                    // only LLONG_MAX-sized values reach here
}

int main() {
    cout << countDigitsTable(0)     << endl;   // 1  — 0 <= 9, no guard needed
    cout << countDigitsTable(12345) << endl;   // 5
    cout << countDigitsTable(7789)  << endl;   // 4
    cout << countDigitsTable(999999999999999LL)     << endl;   // 15 — correct
    cout << countDigitsTable(9223372036854775807LL) << endl;   // 19
    return 0;
}`,
          annotations: {
            14: "At most 18 integer comparisons, fixed regardless of input — constant time by any measure.",
            22: "Zero needs no special case: 0 is not greater than 9, so the first comparison returns 1.",
            25: "Exactly the value where log10 fails. This returns the correct answer.",
          },
        },
        {
          language: "java",
          code: `// This is essentially what the JDK does internally.
// Long.toString calls stringSize, which compares against a table
// of powers of ten to decide how large a buffer to allocate.

static final long[] P = {
    9L, 99L, 999L, 9999L, 99999L, 999999L, 9999999L,
    99999999L, 999999999L, 9999999999L, 99999999999L,
    999999999999L, 9999999999999L, 99999999999999L,
    999999999999999L, 9999999999999999L, 99999999999999999L,
    999999999999999999L
};

static int countDigitsTable(long n) {
    if (n < 0) n = -n;
    for (int i = 0; i < P.length; i++) {
        if (n <= P[i]) return i + 1;
    }
    return 19;
}

System.out.println(countDigitsTable(0));                  // 1
System.out.println(countDigitsTable(12345));              // 5
System.out.println(countDigitsTable(999999999999999L));   // 15 — correct
System.out.println(countDigitsTable(Long.MAX_VALUE));     // 19`,
          annotations: {
            1: "The standard library avoiding log10 for this exact task is the strongest argument against it.",
            15: "A bounded loop over a fixed-size table. The iteration count does not depend on the value's magnitude in any meaningful way.",
          },
        },
        {
          language: "python",
          code: `# Python integers are unbounded, so a fixed table only covers a range.
# Within 64-bit values it works exactly as it does in C++ and Java.

P = [10**k - 1 for k in range(1, 19)]      # 9, 99, 999, ...

def count_digits_table(n):
    n = abs(n)
    for i, boundary in enumerate(P):
        if n <= boundary:
            return i + 1
    return 19

print(count_digits_table(0))                  # 1
print(count_digits_table(12345))              # 5
print(count_digits_table(999999999999999))    # 15 — correct

# For arbitrarily large Python integers, len(str(n)) is the practical
# answer — the table cannot be extended indefinitely, and Python's
# own int-to-string conversion is what str() already uses.
print(len(str(10 ** 100)))                    # 101`,
          annotations: {
            4: "Built from a comprehension rather than typed out, which is less error-prone than eighteen literals.",
            17: "An honest limitation: the table approach assumes a bounded integer type, which Python does not have.",
          },
        },
      ],
      complexity: {
        time: "O(1)",
        space: "O(1)",
        note: "At most 18 integer comparisons against a fixed table, with no dependence on the value beyond which range it falls into. Constant time and exact, because no floating-point value is involved. This is the approach the JDK uses in Long.toString via stringSize, and it needs no guard for zero.",
      },
    },
  ],

  examples: [
    {
      input: "N = 12345",
      output: "5",
      walkthrough: [
        "The counter starts at 0 and 12345 is greater than zero.",
        "Increment to 1, and 12345 / 10 gives 1234, discarding the 5.",
        "Increment to 2, and 1234 / 10 gives 123.",
        "Increment to 3, and 123 / 10 gives 12.",
        "Increment to 4, and 12 / 10 gives 1.",
        "Increment to 5, and 1 / 10 gives 0 because integer division discards the fraction.",
        "The condition fails and the counter holds 5, matching the five digits.",
      ],
      why: "The core trace. Every other approach is a different route to this same count, so the mechanism is worth having concrete.",
    },
    {
      input: "N = 7789",
      output: "4",
      walkthrough: [
        "The counter starts at 0 and 7789 is greater than zero.",
        "Increment to 1, and 7789 / 10 gives 778.",
        "Increment to 2, and 778 / 10 gives 77.",
        "Increment to 3, and 77 / 10 gives 7.",
        "Increment to 4, and 7 / 10 gives 0, since 0.7 truncates to 0.",
        "The loop ends with the counter at 4.",
      ],
      why: "Confirms the final single digit still costs one full iteration, which is exactly where an off-by-one would appear.",
    },
    {
      input: "N = 0, run through all five approaches",
      output: "Correct answer is 1. Two approaches fail without a guard.",
      walkthrough: [
        "The iterative loop tests N greater than zero, which fails immediately, so it returns 0 — wrong without a guard.",
        "The recursion uses n < 10 as its base case, which 0 satisfies, so it returns 1 correctly with no extra code.",
        "The logarithm approach is worst: log10 of zero is undefined, giving negative infinity in C++ and Java and raising ValueError in Python.",
        "String conversion returns 1 naturally, since converting zero produces the single character 0.",
        "The lookup table returns 1 naturally, since 0 is not greater than 9 and the first comparison matches.",
        "So the choice of base case or boundary decides whether zero needs handling at all.",
      ],
      why: "The same input distinguishes all five approaches, which makes it the clearest single test of whether an implementation is complete.",
    },
    {
      input: "N = 999999999999999 (fifteen nines)",
      output: "Four approaches return 15. The logarithm formula returns 16.",
      walkthrough: [
        "The true value of log10 for this number is 14.999999999999999996 and a fraction more, just below 15.",
        "At that magnitude the gaps between representable doubles are wide enough that no double exists between the true value and 15.0.",
        "The library therefore returns exactly 15.0 as the nearest representable value.",
        "Casting keeps 15 and adding one produces 16, when the correct answer is 15.",
        "The iterative loop performs fifteen divisions and returns 15, touching no floating-point value.",
        "The lookup table finds that the number is not greater than the fifteenth boundary and returns 15, also with no floating point.",
      ],
      why: "Measured in both python3 and g++ on this machine. The value fits in a 64-bit integer, so this is a reachable input rather than a hypothetical.",
    },
  ],

  visualization: {
    kind: "custom",
    description:
      "Three panels sharing one input. The PEELING panel draws N as a row of digit tiles with a counter chip beside it at zero; each iteration lights the condition check, ticks the counter, and animates the rightmost tile detaching and sliding off the right edge as integer division removes it, with the discarded fraction flashing briefly as a faded remainder before vanishing since that discard is what lets the loop terminate. The row shrinks 12345, 1234, 123, 12, 1, empty, and the counter lands on 5 as the row empties. Beside it draw the RECURSION variant of the same trace as a stack of frames growing downward, one per call, each holding its own value and a pending plus one; when the base case is reached the frames unwind upward and the ones sum back to 5, with the stack's maximum height labelled as the space cost the loop does not pay. The FORMULA panel carries the main lesson: draw a number line marked at the powers of ten with N placed on it, dropping to a logarithm axis below where floor plus one produces the answer for an ordinary value. Then switch to fifteen nines and zoom the logarithm axis hard around 15.0, drawing the representable doubles as discrete ticks with visible spacing; show the true logarithm sitting inside the final gap just below 15.0 where no tick exists, and animate it snapping up to the 15.0 tick as the nearest representable value, so the floor reads 15 instead of 14 and the plus one produces 16. Finally the TABLE panel, which resolves the tension: draw the boundaries 9, 99, 999 and onward as a vertical ladder of ranges, drop N onto it, and animate it falling past each boundary it exceeds until it lands in a range, whose index plus one is the answer — all integer comparisons, with a marker showing the chain is at most eighteen long regardless of input and a label noting no floating-point value appears anywhere in it.",
    sampleInput:
      '{"trace":{"n":12345,"steps":[{"n":12345,"removed":5,"count":1},{"n":1234,"removed":4,"count":2},{"n":123,"removed":3,"count":3},{"n":12,"removed":2,"count":4},{"n":1,"removed":1,"count":5},{"n":0,"terminates":true}],"answer":5},"recursion":{"frames":[12345,1234,123,12,1],"maxDepth":5,"unwindsTo":5},"zeroCase":{"n":0,"correct":1,"loop":0,"recursion":1,"log10":"undefined","string":1,"table":1},"precision":{"n":999999999999999,"digits":15,"trueLog":14.999999999999999996,"nearestDouble":15.0,"formulaGives":16,"othersGive":15,"verifiedIn":["python3","g++ -O2"]},"table":{"boundaries":[9,99,999,9999,99999],"maxComparisons":18,"usesFloatingPoint":false,"matchesLoopOn":[0,1,9,10,99,100,12345,7789,999999999999999,9223372036854775807]}}',
    highlights: [
      "N is drawn as five digit tiles with a counter chip beside it reading zero.",
      "The counter ticks and the rightmost tile detaches and slides off the row, with the discarded fraction flashing before it vanishes.",
      "The row shrinks through 1234, 123, 12 and 1, and the counter lands on five as the row empties.",
      "The recursion panel replays the same trace as frames stacking downward, each holding a pending plus one.",
      "The base case is reached and the frames unwind upward, summing back to five.",
      "The stack's maximum height is labelled as the space cost, which the iterative loop does not pay.",
      "The formula panel places N on a number line of powers of ten and drops to a logarithm axis, landing cleanly on five.",
      "Switching to fifteen nines zooms the logarithm axis around 15.0 and draws the representable doubles as discrete ticks.",
      "The true logarithm sits inside the final gap just below 15.0, where no tick exists.",
      "It snaps up to the 15.0 tick as the nearest representable value, so the floor reads 15 instead of 14 and the answer becomes 16.",
      "The table panel draws the boundaries 9, 99, 999 and onward as a ladder of ranges.",
      "N falls past each boundary it exceeds and lands in a range, whose index plus one is the answer.",
      "A marker notes the chain is at most eighteen comparisons long, with no floating-point value anywhere in it.",
    ],
  },

  edgeCases: [
    "N equal to zero, which has one digit and is handled naturally by recursion, string conversion and the table, but not by the loop or the logarithm.",
    "Negative N, where the loop condition fails immediately and the logarithm returns not-a-number.",
    "The most negative value of a signed type, whose absolute value does not fit and stays negative after negation.",
    "Exact powers of ten such as 1000, which is precisely what the plus one in the logarithm formula exists to handle.",
    "Values of fifteen or more nines, where the logarithm rounds up and overcounts by one.",
    "Single-digit N, where the loop runs once and the recursion hits its base case immediately.",
    "Arbitrarily large Python integers, which the loop and string conversion handle but the logarithm and a fixed table do not.",
    "Using true division rather than integer division, which approaches zero without reaching it and loops forever.",
    "Using modulo where division was meant, which leaves the value unchanged after the first step and also loops forever.",
    "A recursion whose base case tests equality with zero rather than being below ten, which recurses once more than necessary.",
  ],

  pitfalls: [
    "Using n %= 10 instead of n /= 10 to shrink the number. Modulo reads the last digit, division removes it.",
    "Omitting the zero guard in the iterative version, so it reports zero digits for the number 0.",
    "Trusting the logarithm formula on large inputs, where it overcounts by one from about 10^15 upward.",
    "Calling log10 without guarding zero and negatives, which gives negative infinity or raises depending on the language.",
    "Using / instead of // in Python, which produces a float that never reaches exactly zero.",
    "Negating the most negative value of a signed type, which overflows and leaves it negative.",
    "Counting the minus sign as a digit by converting a negative number to a string without taking the absolute value.",
    "Treating O(1) as automatically better, when the only O(1) approach most people know is also the only wrong one.",
    "Choosing recursion where an iterative loop is equally clear, paying stack space for no gain.",
    "Assuming a fixed boundary table works in Python, where integers have no upper bound.",
  ],

  commonDoubts: [
    {
      question: "Why divide by 10 rather than take the modulo?",
      answer:
        "They do different jobs. N % 10 gives the last digit — 12345 % 10 is 5. N / 10 removes the last digit — 12345 / 10 is 1234. Counting digits only needs removal, so it uses division. Writing n %= 10 instead produces an infinite loop, because after the first step n holds a single digit and modulo 10 leaves it unchanged forever.",
    },
    {
      question: "Which approach should I actually use?",
      answer:
        "Learn the iterative loop cold — it is the extraction pattern the next two subtopics are built on, and it is what an interviewer is asking for. Use the lookup table when the digit count sits on a hot path, since it is exact and constant time. Use string conversion when you want one readable line and allocation does not matter. Avoid the logarithm formula as a default; know it and know why it fails.",
    },
    {
      question: "Is the O(1) logarithm formula better than the O(log N) loop?",
      answer:
        "No. The loop runs once per digit, and a 64-bit integer has at most nineteen digits, so it runs at most nineteen times for any input that exists — a bounded constant, not a performance concern. The formula is genuinely constant time and is also wrong above roughly 10^15, where floating-point rounding makes it overcount by one. Trading correctness to save eighteen iterations is a bad trade, and the lookup table gives you constant time without that cost anyway.",
    },
    {
      question: "Why exactly does the logarithm formula fail?",
      answer:
        "The true logarithm of fifteen nines is 14.999999999999999996 and change, just below 15. Doubles cannot represent every real number, and at that magnitude the spacing between representable values is wide enough that none exists between the true value and 15.0. The library returns the nearest one, which is exactly 15.0. Flooring gives 15 instead of 14, and the plus one produces 16 rather than 15. Reproduced here in both Python 3 and g++, so it is a property of the arithmetic rather than of one language.",
    },
    {
      question: "How can an approach be constant time without using a logarithm?",
      answer:
        "By comparing against the boundaries directly. A number has one digit if it is at most 9, two if it is at most 99, and so on. A 64-bit integer has at most 19 digits, so the chain is at most 18 comparisons long regardless of the value — that is a fixed bound, which is what constant time means. No floating-point value is involved, so nothing can round wrongly. This is what the JDK does: Long.toString calls stringSize, which compares against a precomputed table of powers of ten.",
    },
    {
      question: "Why does recursion use more memory than the loop?",
      answer:
        "Because each pending call keeps a stack frame alive until the base case returns. Counting the digits of 12345 has five frames open at the deepest point, each holding its own value and a pending addition. The loop reuses one counter and one variable throughout, so its space is constant. At nineteen frames the difference is irrelevant; the principle matters whenever recursion depth grows with input size rather than with digit count.",
    },
    {
      question: "How do I handle zero and negative numbers?",
      answer:
        "Zero has one digit, and whether you need a guard depends on the approach. The iterative loop and the logarithm both need an explicit one. Recursion handles it free if the base case is n below 10 rather than n equals 0, and string conversion and the table handle it naturally. For negatives, take the absolute value first in every approach. One trap: negating the most negative value of a signed type overflows, since its positive counterpart does not fit — Math.abs(Long.MIN_VALUE) in Java is still negative.",
    },
    {
      question: "Why not just use len(str(n)) and move on?",
      answer:
        "You often can. It is correct for every input including zero, negatives once you take the absolute value, and Python's unbounded integers. The cost is memory: it allocates one character per digit, making it O(log N) space where the loop is O(1). For a single call that is irrelevant; inside a loop over millions of values it is not. Interviewers also generally want the arithmetic version, since it demonstrates the extraction loop that reversing a number and checking a palindrome are both built on.",
    },
  ],

  relatedIds: ["reverse-a-number", "palindrome-number", "while-loop", "arithmetic-operators"],
};

export default content;
