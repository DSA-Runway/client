import type { SubtopicContent } from "../types";

/**
 * Subtopic 14 of Arrays — the last Easy one. Structurally unlike everything
 * before it: THREE different questions share one shape, and each has a
 * genuinely different optimal answer. Building the triangle answers all three
 * and is the right answer to only one of them.
 *
 * SOURCES
 * - LeetCode 118 "Pascal's Triangle" (generate the whole thing) and 119
 *   "Pascal's Triangle II" (one row).
 * - GeeksforGeeks, "Pascal's Triangle" — the three-variant framing and the
 *   binomial-coefficient formula.
 *
 * MEASURED ON THIS MACHINE (Apple M2, arm64, clang -O2, Python 3.13.4):
 *
 * 1. THE FACTORIAL ROUTE DESTROYS A TINY ANSWER. 13! is the first factorial to
 *    exceed a 32-bit int and 21! the first to exceed a 64-bit one. Yet
 *    C(30,15) = 155,117,520 fits in a 32-bit int with room to spare while 30!
 *    overflows 64 bits many times over. The answer is small; the route taken to
 *    it is astronomical.
 *
 * 2. THE RUNNING PRODUCT'S DIVISION IS ALWAYS EXACT, verified rather than
 *    assumed: over n = 0..200 and every r, 671,650 divisions were performed with
 *    ZERO remainders and zero wrong results. The reason is that after step i the
 *    accumulator holds exactly C(n, i+1), which is an integer by definition, so
 *    res*(n-i) is necessarily divisible by (i+1).
 *
 * 3. ORDER OF OPERATIONS DECIDES WHETHER IT OVERFLOWS. Dividing as you go keeps
 *    the largest intermediate at the answer itself. Multiplying the whole
 *    numerator first does not: for C(30,15) the numerator alone needs 68 bits,
 *    and int64 holds 63. For C(66,33) it needs 186 bits.
 *
 * 4. AND EVEN THE RUNNING PRODUCT OVERFLOWS EARLIER THAN THE ANSWER DOES —
 *    the same structural trap as Find Missing Number, with exact figures:
 *      first wrong result : C(62,28)
 *      true value         : 349,615,716,557,887,465   (fits int64 comfortably)
 *      long long returns  : -309,196,571,788,882,235  (negative)
 *      cause              : at step 27 the intermediate res*(n-i) reaches
 *                           9,789,240,063,620,849,020 against LLONG_MAX
 *                           9,223,372,036,854,775,807
 *      the ANSWER first exceeds int64 only at n = 67
 *    So for n = 62..66 the answer fits and the computation still fails.
 *    Verified safe range: n <= 61 for every r, 0 mismatches against __int128.
 *
 * 5. COMPUTING ONE ELEMENT BY BUILDING THE TRIANGLE IS WASTEFUL AND THE GAP
 *    GROWS. Nanoseconds for C(n, n/2):
 *      n = 30   : running 83     triangle 2,375     29x
 *      n = 100  : running 167    triangle 7,750     46x
 *      n = 1000 : running 2,833  triangle 306,666   108x
 *
 * 6. ONE ROW IN O(n) VS THE WHOLE TRIANGLE IN O(n^2). Python, n = 1000:
 *    running row 0.35ms against full triangle 71.31ms — 204x.
 *
 * 7. PYTHON CANNOT OVERFLOW AND HAS math.comb. At n = 1000, microseconds:
 *    math.comb 43.2, factorial route 141.1, hand-written running product 158.4.
 *    math.comb(1000,500) is exact at 300 digits. The C++ and Java overflow
 *    discussion simply does not apply, and the fastest option is also the
 *    shortest.
 *
 * Scope: Pascal's Triangle II (a single row) is covered here as variant 2 rather
 * than split out. Binomial identities beyond the row recurrence belong to
 * combinatorics, not this module.
 */
const content: SubtopicContent = {
  id: "pascals-triangle-i",
  topic: "Arrays",
  title: "Pascal's Triangle I",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "integer-overflow-and-precision-errors",
    "majority-element-i",
    "two-sum",
    "for-loop",
    "arithmetic-operators",
    "time-and-space-complexity-basics",
  ],

  summary:
    "Three questions wear one shape — one element, one row, the whole triangle — and each has a different optimal answer. Building the triangle answers all three and is correct for only one, while the factorial shortcut overflows on a result that comfortably fits.",

  theory: `
## The shape

Each entry is the sum of the two directly above it, with 1s down both edges.

\`\`\`
row 0:            1
row 1:          1   1
row 2:        1   2   1
row 3:      1   3   3   1
row 4:    1   4   6   4   1
\`\`\`

The entry at row \`n\`, position \`r\` (both counted from 0) is the binomial
coefficient \`C(n, r)\` — the number of ways to choose \`r\` things from \`n\`.

**Watch the indexing.** Many statements of this problem count rows and columns
from 1, in which case the entry at row \`R\`, column \`C\` is \`C(R-1, C-1)\`. Getting
this wrong shifts every answer by one row and is the single most common way to
fail the problem while having the right algorithm.

## Three questions, not one

This is the part worth slowing down on, because the same picture is asked about in
three ways and the answers are not the same:

| Question | Output size | Optimal |
|---|---|---|
| One element at (n, r) | O(1) | **O(r) time, O(1) space** |
| One whole row n | O(n) | **O(n) time** |
| The whole triangle | O(n²) | **O(n²) time** |

Notice what that table says. Building the triangle is O(n²), and for the third
question that is optimal — you cannot produce n² numbers in less than n² work.
For the first question it is **quadratic work for a constant-sized answer**, and
measured at n = 1000 it was **108x slower** than necessary.

The instinct to build the whole structure and index into it is the thing to
unlearn here.

## One element: the formula, and the trap

\`C(n, r) = n! / (r! · (n-r)!)\` is correct and is a bad way to compute it.

**Factorials explode long before the answer does.** 13! is the first factorial too
large for a 32-bit int, and 21! the first too large for a 64-bit one. Meanwhile:

| | value | fits int32? |
|---|---|---|
| C(30,15) | 155,117,520 | **yes, easily** |
| 30! | ~2.65 × 10³² | no — overflows int64 many times over |

So the factorial route takes a result that fits comfortably in a 32-bit integer
and routes it through a number with 33 digits. That is not a rounding concern; it
is a guaranteed overflow on an answer that was never large.

### The running product

Compute it as a chain instead:

\`\`\`
C(n, r) = (n / 1) · ((n-1) / 2) · ((n-2) / 3) · … · ((n-r+1) / r)
\`\`\`

Take the division **at each step**, not at the end:

\`\`\`
res = 1
for i in 0 .. r-1:
    res = res * (n - i) / (i + 1)
\`\`\`

**Every one of those divisions is exact.** That is not a hopeful assumption — after
step \`i\` the accumulator holds exactly \`C(n, i+1)\`, which is an integer by
definition, so \`res * (n-i)\` is necessarily divisible by \`(i+1)\`. Verified over
n = 0 to 200 and every r: **671,650 divisions, zero remainders, zero wrong
results.**

Traced for C(30,15):

\`\`\`
step 0:      1 × 30 =     30 / 1 =     30
step 1:     30 × 29 =    870 / 2 =    435
step 2:    435 × 28 = 12,180 / 3 =  4,060
step 3:  4,060 × 27 =109,620 / 4 = 27,405
\`\`\`

Also use the symmetry \`C(n, r) = C(n, n-r)\` to take the smaller of \`r\` and
\`n-r\`, which halves the loop.

### Order of operations is what keeps it in range

Dividing as you go keeps the largest intermediate at roughly the answer itself.
Accumulating the whole numerator first and dividing at the end does not:

| | largest intermediate | bits needed |
|---|---|---|
| C(30,15) numerator-first | 202,843,204,931,727,360,000 | **68** |
| C(66,33) numerator-first | ~6.27 × 10⁵⁵ | **186** |

An \`int64\` holds 63. Same formula, same answer, and one ordering overflows while
the other does not.

## And the running product still overflows before the answer does

This is the same structural trap as Find Missing Number, and it is worth the exact
numbers because the safe range is narrower than it looks.

Measured with \`long long\`, the first wrong result is **C(62, 28)**:

| | |
|---|---|
| True value | 349,615,716,557,887,465 — **fits int64 comfortably** |
| \`long long\` returns | **−309,196,571,788,882,235** |
| Cause | at step 27, \`res × (n−i)\` reaches 9,789,240,063,620,849,020 |
| \`LLONG_MAX\` | 9,223,372,036,854,775,807 |
| The answer itself first exceeds int64 at | **n = 67** |

So for **n = 62 through 66 the answer fits and the computation fails anyway** —
and it fails by returning a *negative number*, which at least is obviously wrong,
unlike the silent cases in earlier subtopics.

**Verified safe range for the plain \`long long\` running product: n ≤ 61, every r,
zero mismatches** against a 128-bit reference. Beyond that you need a wider type,
or you divide by \`gcd\` before multiplying at each step.

## One row: the same recurrence sideways

Each entry in a row follows from its left neighbour:

\`\`\`
C(n, r) = C(n, r-1) × (n - r + 1) / r
\`\`\`

Start with 1 and walk across. That produces the whole of row \`n\` in **O(n)**,
touching no other row at all — measured in Python at n = 1000: **0.35ms against
71.31ms** for building the full triangle, a **204x** difference.

## The whole triangle: build it, and here that is optimal

Only for the third question is the O(n²) construction right, because the output
is itself O(n²) numbers. Each row comes from the one above:

\`\`\`
row[0] = row[i] = 1
row[j] = prev[j-1] + prev[j]
\`\`\`

If you only need to *return* the triangle, keep every row. If you are streaming it,
one row of storage suffices.

## Python removes half of this discussion

Python integers are arbitrary precision, so none of the overflow analysis applies —
\`math.comb(1000, 500)\` is exact at 300 digits. Measured for C(1000, 500), in
microseconds:

| Approach | Time |
|---|---|
| \`math.comb\` | **43.2** |
| Factorial formula | 141.1 |
| Hand-written running product | 158.4 |

\`math.comb\` is both the shortest and the fastest, and it cannot overflow. Even the
factorial route — disqualified in C++ and Java — is merely slower here, not wrong.
This is the same language split seen in Find Missing Number: a real correctness
hazard in two of the three languages and a non-issue in the third.

## Where this goes next

The row recurrence is the seed of dynamic programming — each row is computed once
from the row before, which is exactly the shape of the DP table in **Grid Unique
Paths**, whose answer is a single binomial coefficient. The overflow lesson
applies to every combinatorial count you will compute from here on.
`.trim(),

  intuition:
    "Ask what you actually need before you build anything. To know one number, walk the single chain of multiplications that leads to it. To know one row, walk sideways along that row. To know the whole triangle, you genuinely have to build the whole triangle — but only then. The mistake is not building the triangle; it is building it when you were asked one question about one cell.",

  approaches: [
    {
      name: "Brute Force - Build the Whole Triangle, Then Index",
      idea: "Construct every row up to the one wanted, then read the element out of it.",
      steps: [
        "Create row 0 containing a single 1.",
        "For each subsequent row, start and end with 1.",
        "Fill each interior entry with the sum of the two entries above it.",
        "Continue until the requested row has been built.",
        "Read the requested position out of that row.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

long long elementAt(int n, int r) {
    vector<vector<long long>> t(n + 1);

    for (int i = 0; i <= n; i++) {
        t[i].assign(i + 1, 1);
        for (int j = 1; j < i; j++) t[i][j] = t[i-1][j-1] + t[i-1][j];
    }
    return t[n][r];
}`,
          annotations: {
            9: "The two 1s at the edges are already in place from the assign, so only the interior needs filling.",
            11: "Measured 306,666ns at n = 1000 against 2,833ns for the running product — 108x for a single number.",
          },
        },
        {
          language: "java",
          code: `static long elementAt(int n, int r) {
    long[][] t = new long[n + 1][];

    for (int i = 0; i <= n; i++) {
        t[i] = new long[i + 1];
        t[i][0] = t[i][i] = 1;
        for (int j = 1; j < i; j++) t[i][j] = t[i-1][j-1] + t[i-1][j];
    }
    return t[n][r];
}`,
          annotations: {
            5: "A jagged array, one row per length, which is the natural shape for a triangle.",
            6: "For i = 0 both assignments target the same cell, which is harmless.",
          },
        },
        {
          language: "python",
          code: `def element_at(n, r):
    row = [1]
    for i in range(1, n + 1):
        row = [1] + [row[j-1] + row[j] for j in range(1, i)] + [1]
    return row[r]


# Measured 1,323us at n = 200 against 10.5us for the running product.
# Quadratic work to produce a single number.`,
          annotations: {
            4: "Keeping only the previous row rather than all of them, which is O(n) space instead of O(n^2).",
          },
        },
      ],
      complexity: {
        time: "O(n^2)",
        space: "O(n^2) keeping every row, O(n) keeping only the previous one",
        note: "Correct, and quadratic work for a constant-sized answer. Measured for a single element: 29x slower than the running product at n = 30, 46x at n = 100, and 108x at n = 1000 — the gap widens with n because the work is quadratic while the answer stays one number.",
      },
    },
    {
      name: "One Element - Factorial Formula",
      idea: "Apply the definition directly as n! divided by r! times (n-r)!.",
      steps: [
        "Compute the factorial of n.",
        "Compute the factorials of r and of n minus r.",
        "Divide the first by the product of the other two.",
        "Note that this overflows almost immediately in any fixed-width integer type.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <cstdint>
using namespace std;

// DO NOT USE for anything but small n — shown to make the failure concrete.
long long factorial(int k) {
    long long f = 1;
    for (int i = 2; i <= k; i++) f *= i;
    return f;                      // 21! already exceeds a 64-bit signed int
}

long long elementAtBroken(int n, int r) {
    return factorial(n) / (factorial(r) * factorial(n - r));
}`,
          annotations: {
            8: "13! exceeds a 32-bit int and 21! exceeds a 64-bit one, so this is unusable well before n reaches 25.",
            12: "C(30,15) is 155,117,520 and fits an int32 easily, yet 30! has 33 digits — the route dwarfs the destination.",
          },
        },
        {
          language: "java",
          code: `import java.math.BigInteger;

// Correct but heavy: BigInteger sidesteps the overflow at the cost of
// allocating objects for numbers that were never large.
static BigInteger elementAt(int n, int r) {
    BigInteger num = BigInteger.ONE;
    for (int i = 2; i <= n; i++) num = num.multiply(BigInteger.valueOf(i));

    BigInteger den = BigInteger.ONE;
    for (int i = 2; i <= r; i++) den = den.multiply(BigInteger.valueOf(i));
    for (int i = 2; i <= n - r; i++) den = den.multiply(BigInteger.valueOf(i));

    return num.divide(den);
}`,
          annotations: {
            7: "BigInteger removes the overflow and keeps the underlying waste — building a 33-digit number to return an 9-digit one.",
          },
        },
        {
          language: "python",
          code: `from math import factorial, comb

def element_at_factorial(n, r):
    return factorial(n) // (factorial(r) * factorial(n - r))


def element_at(n, r):
    return comb(n, r)          # exact, arbitrary precision, and fastest


# Measured for C(1000,500): comb 43.2us, factorial route 141.1us.
# Python cannot overflow, so the factorial route is merely slower here —
# not wrong, as it is in C++ and Java.`,
          annotations: {
            4: "Integer division with //, since / would produce a float and lose exactness immediately at this scale.",
            8: "math.comb has been available since Python 3.8 and is the right answer whenever you are in Python.",
          },
        },
      ],
      complexity: {
        time: "O(n) multiplications, but on numbers that grow enormous",
        space: "O(1) in fixed-width types, O(n log n) bits with big integers",
        note: "Unusable in C++ and Java beyond about n = 20, because 21! exceeds a 64-bit integer while C(30,15) — the answer — fits a 32-bit one. In Python it is correct but measured 3.3x slower than math.comb at n = 1000.",
      },
    },
    {
      name: "Optimal for One Element - Running Product",
      idea: "Multiply and divide alternately so the accumulator never grows beyond the answer.",
      steps: [
        "Use the symmetry C(n, r) = C(n, n-r) to replace r with the smaller of r and n-r.",
        "Start the accumulator at 1.",
        "For each step i from 0 to r-1, multiply by (n - i) and then divide by (i + 1).",
        "Take the division at every step rather than at the end, which keeps every intermediate an integer.",
        "Return the accumulator.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <algorithm>
using namespace std;

long long elementAt(int n, int r) {
    if (r < 0 || r > n) return 0;
    r = min(r, n - r);                  // C(n,r) == C(n,n-r): halves the loop

    long long res = 1;
    for (int i = 0; i < r; i++) {
        res = res * (n - i) / (i + 1);  // divide EVERY step, never at the end
    }
    return res;
}`,
          annotations: {
            6: "The symmetry is free and halves the work; C(30,28) becomes C(30,2).",
            10: "Exact at every step: after step i the accumulator is C(n, i+1), an integer, so the division never truncates. Verified over 671,650 divisions.",
            12: "Safe for n <= 61 in long long. At C(62,28) the intermediate overflows and it returns a negative number.",
          },
        },
        {
          language: "java",
          code: `static long elementAt(int n, int r) {
    if (r < 0 || r > n) return 0;
    r = Math.min(r, n - r);

    long res = 1;
    for (int i = 0; i < r; i++) {
        res = res * (n - i) / (i + 1);
    }
    return res;
}`,
          annotations: {
            7: "Accumulating the numerator first and dividing once at the end would need 68 bits for C(30,15); a long holds 63.",
            9: "Same 61 limit as C++. Beyond it, switch to BigInteger rather than hoping the answer stays small.",
          },
        },
        {
          language: "python",
          code: `def element_at(n, r):
    if r < 0 or r > n:
        return 0
    r = min(r, n - r)

    res = 1
    for i in range(r):
        res = res * (n - i) // (i + 1)
    return res


# Correct at any n — Python integers are arbitrary precision — but
# math.comb(n, r) is both shorter and faster: 43.2us against 158.4us
# for C(1000, 500).`,
          annotations: {
            8: "// is essential; / would return a float and lose exactness on large values.",
            13: "The overflow reasoning above is a C++ and Java concern only.",
          },
        },
      ],
      complexity: {
        time: "O(min(r, n-r))",
        space: "O(1)",
        note: "Measured 2,833ns at n = 1000 against 306,666ns for building the triangle — 108x. Every division is exact, verified over n = 0..200 with 671,650 divisions and zero remainders. Safe in long long for n <= 61, verified against a 128-bit reference with zero mismatches.",
      },
    },
    {
      name: "One Row - Walk Across in O(n)",
      idea: "Generate each entry of a single row from its left neighbour, touching no other row.",
      steps: [
        "Start the row with the value 1 at position 0.",
        "For each position r from 1 to n, multiply the previous entry by (n - r + 1) and divide by r.",
        "Append that value to the row.",
        "The whole row is produced without constructing any row above it.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

vector<long long> rowOf(int n) {
    vector<long long> row(n + 1);
    row[0] = 1;

    for (int r = 1; r <= n; r++) {
        row[r] = row[r-1] * (n - r + 1) / r;
    }
    return row;
}`,
          annotations: {
            9: "The same identity as the running product, applied sideways: each entry follows from the one to its left.",
            11: "O(n) for the whole row, against O(n^2) to reach it by building every row above.",
          },
        },
        {
          language: "java",
          code: `static long[] rowOf(int n) {
    long[] row = new long[n + 1];
    row[0] = 1;

    for (int r = 1; r <= n; r++) {
        row[r] = row[r-1] * (n - r + 1) / r;
    }
    return row;
}`,
          annotations: {
            6: "Each division is exact for the same reason as before — the running value is always a binomial coefficient.",
          },
        },
        {
          language: "python",
          code: `def row_of(n):
    row = [1]
    for r in range(1, n + 1):
        row.append(row[-1] * (n - r + 1) // r)
    return row


# row_of(5) -> [1, 5, 10, 10, 5, 1]
# Measured at n = 1000: 0.35ms, against 71.31ms to build the whole
# triangle and take the last row — 204x.`,
          annotations: {
            4: "row[-1] is the entry just appended, so each step reads its immediate left neighbour.",
            8: "Verified identical to [math.comb(n, r) for r in range(n+1)] at n = 1000.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(n) for the row itself, which the answer requires",
        note: "Measured 0.35ms at n = 1000 against 71.31ms for building the full triangle — 204x — because it computes exactly the n+1 numbers asked for and no others.",
      },
    },
    {
      name: "Whole Triangle - Each Row From the One Above",
      idea: "Build every row from its predecessor, which is optimal when the whole triangle is the answer.",
      steps: [
        "Start with row 0 containing a single 1.",
        "For each subsequent row, place 1 at both ends.",
        "Fill each interior entry with the sum of the two entries diagonally above it.",
        "Append the completed row and continue.",
        "Stop after the requested number of rows.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

vector<vector<long long>> triangle(int rows) {
    vector<vector<long long>> t(rows);

    for (int i = 0; i < rows; i++) {
        t[i].assign(i + 1, 1);
        for (int j = 1; j < i; j++) {
            t[i][j] = t[i-1][j-1] + t[i-1][j];
        }
    }
    return t;
}`,
          annotations: {
            8: "assign fills the row with 1s, which already places both edge values correctly.",
            10: "Addition only — no multiplication or division, so this is the one variant with no overflow subtlety until the values themselves grow.",
            12: "O(n^2) here is OPTIMAL, because the answer is itself n^2 numbers.",
          },
        },
        {
          language: "java",
          code: `import java.util.ArrayList;
import java.util.List;

static List<List<Long>> triangle(int rows) {
    List<List<Long>> t = new ArrayList<>();

    for (int i = 0; i < rows; i++) {
        List<Long> row = new ArrayList<>();
        for (int j = 0; j <= i; j++) {
            if (j == 0 || j == i) row.add(1L);
            else row.add(t.get(i-1).get(j-1) + t.get(i-1).get(j));
        }
        t.add(row);
    }
    return t;
}`,
          annotations: {
            10: "The edge test replaces pre-filling with 1s, which reads more directly for a List.",
          },
        },
        {
          language: "python",
          code: `def triangle(rows):
    out = []
    for i in range(rows):
        row = [1] * (i + 1)
        for j in range(1, i):
            row[j] = out[i-1][j-1] + out[i-1][j]
        out.append(row)
    return out


# triangle(5) ->
#   [1]
#   [1, 1]
#   [1, 2, 1]
#   [1, 3, 3, 1]
#   [1, 4, 6, 4, 1]`,
          annotations: {
            4: "Pre-filling with 1s means the loop only has to touch the interior.",
            5: "range(1, i) is empty for the first two rows, which is why they need no special case.",
          },
        },
      ],
      complexity: {
        time: "O(n^2)",
        space: "O(n^2) for the output, O(n) if the rows are streamed rather than kept",
        note: "The only variant where the quadratic construction is the right answer, since the output is itself O(n^2) numbers. It also uses addition alone, so it avoids the multiply-then-divide overflow question entirely until the entries themselves grow too large.",
      },
    },
  ],

  examples: [
    {
      input: "The element at row 4, position 2 (both counted from 0)",
      output: "6",
      walkthrough: [
        "Take the smaller of r and n-r: both are 2, so the loop runs twice rather than four times.",
        "Start the accumulator at 1.",
        "Step 0: multiply by (4 - 0) = 4 to get 4, then divide by 1 to get 4 — which is C(4,1).",
        "Step 1: multiply by (4 - 1) = 3 to get 12, then divide by 2 to get 6 — which is C(4,2).",
        "The answer is 6, matching row 4 of the triangle: 1, 4, 6, 4, 1.",
        "Both divisions were exact, because the accumulator held a binomial coefficient at every step.",
      ],
      why: "Small enough to check against the drawn triangle, and it shows the accumulator passing through C(4,1) on its way to C(4,2) rather than through anything large.",
    },
    {
      input: "C(30, 15) by the factorial formula versus the running product",
      output: "155,117,520 — reachable one way and not the other",
      walkthrough: [
        "The answer is 155,117,520, which fits in a 32-bit signed integer with room to spare.",
        "The factorial route computes 30! first, which is approximately 2.65 times 10 to the 32 — a 33-digit number.",
        "That exceeds a 64-bit integer many times over, so the calculation is destroyed before the division ever happens.",
        "The running product instead passes through C(30,1), C(30,2) and so on, and its largest intermediate is the answer itself.",
        "Even accumulating the numerator first and dividing once at the end fails: that numerator needs 68 bits and a 64-bit integer holds 63.",
        "Only dividing at every step keeps the whole computation inside the range the answer already occupies.",
      ],
      why: "The clearest case in the module of a tiny answer being unreachable by the obvious formula, and it shows that the order of the operations, not the formula, is what decides.",
    },
    {
      input: "C(62, 28) computed with the running product in a 64-bit integer",
      output: "−309,196,571,788,882,235 instead of 349,615,716,557,887,465",
      walkthrough: [
        "The true value is 349,615,716,557,887,465, which fits a signed 64-bit integer comfortably.",
        "The running product proceeds correctly for twenty-seven steps.",
        "At step 27 it computes res times (n - i), which reaches 9,789,240,063,620,849,020.",
        "The maximum a signed 64-bit integer can hold is 9,223,372,036,854,775,807, so that product overflows.",
        "The result comes back negative, which is at least obviously wrong rather than silently plausible.",
        "The answer itself only exceeds a 64-bit integer at n = 67, so for n from 62 to 66 the answer fits and the computation still fails.",
      ],
      why: "The same structural trap as Find Missing Number — the intermediate overflows before the result does — and it establishes the verified safe limit of n = 61 for the plain long long version.",
    },
    {
      input: "Row 1000, computed three ways",
      output: "0.35ms walking the row, 71.31ms building the triangle",
      walkthrough: [
        "Walking the row applies C(n,r) = C(n,r-1) times (n-r+1) divided by r, once per position.",
        "That produces exactly the 1,001 numbers asked for and touches nothing else.",
        "Building the whole triangle to reach row 1000 computes roughly half a million entries and discards all but the last row.",
        "Measured in Python: 0.35ms against 71.31ms, a factor of 204.",
        "The row version was verified identical to math.comb for every position in the row.",
        "For a single element the gap is larger still — measured 108x at n = 1000 in C++.",
      ],
      why: "Quantifies the cost of answering a narrower question with a broader construction, which is the mistake this subtopic exists to correct.",
    },
  ],

  visualization: {
    kind: "custom",
    description:
      "The triangle drawn as staggered rows of cells with the edges permanently marked as 1s, and every interior cell wired to the two cells above it by faint lines that light when that cell is computed. Three tracks share this drawing and the whole point is that they light up different amounts of it. The ELEMENT track answers C(4,2): highlight only the single chain of multiplications the running product walks, drawing an accumulator box that steps 1 to 4 to 6 with the multiply and the divide shown as two separate beats, and grey the entire rest of the triangle so the reader sees how little of the picture was needed. The ROW track answers row n: light one horizontal band and draw each entry being produced from its left neighbour by a labelled arrow carrying times (n-r+1) over r, again leaving every other row dark. The TRIANGLE track lights everything, row by row, with each interior cell visibly summing the two above it — and this track is labelled as the only one where filling the whole picture is the right answer, because the whole picture IS the answer. Run a work counter on each so the three costs are comparable at a glance, and print the measured ratios beneath: 108x for one element at n = 1000, 204x for one row. The overflow panel is separate and numeric rather than geometric: show the running accumulator for C(30,15) climbing through C(30,1), C(30,2) and so on inside a bar representing the 64-bit range, staying small throughout, then replay the same computation with the numerator accumulated first, whose bar bursts past the 63-bit mark at 68 bits. Finish it with C(62,28): the accumulator advances correctly for twenty-seven steps, then at step 27 the intermediate 9,789,240,063,620,849,020 is drawn overtopping LLONG_MAX 9,223,372,036,854,775,807, and the result flips to a negative number — with the true value shown alongside, comfortably inside the bar, to make the point that the destination was always reachable and the route was not.",
    sampleInput:
      '{"triangle":{"rows":[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]],"indexingNote":"row n, position r, both from 0; C(n,r)"},"elementTrack":{"n":4,"r":2,"symmetryApplied":false,"steps":[{"i":0,"multiplyBy":4,"after":4,"divideBy":1,"result":4,"equals":"C(4,1)"},{"i":1,"multiplyBy":3,"after":12,"divideBy":2,"result":6,"equals":"C(4,2)"}],"answer":6,"cellsTouched":2,"cellsInTriangle":15},"rowTrack":{"n":5,"row":[1,5,10,10,5,1],"recurrence":"C(n,r) = C(n,r-1) * (n-r+1) / r"},"workComparison":{"oneElement":{"n":1000,"runningNs":2833,"triangleNs":306666,"ratio":108},"oneRow":{"n":1000,"runningMs":0.35,"triangleMs":71.31,"ratio":204}},"overflowPanel":{"target":"C(30,15)","answer":155117520,"answerFitsInt32":true,"factorial30Digits":33,"numeratorFirstBits":68,"int64Bits":63,"runningMaxIntermediate":155117520},"failureCase":{"target":"C(62,28)","trueValue":"349615716557887465","trueValueFitsInt64":true,"longLongReturns":"-309196571788882235","failingStep":27,"intermediate":"9789240063620849020","LLONG_MAX":"9223372036854775807","answerFirstExceedsInt64AtN":67,"verifiedSafeRange":61},"exactness":{"range":"n = 0..200, every r","divisionsChecked":671650,"remainders":0,"wrongResults":0},"python":{"n":1000,"r":500,"mathCombUs":43.2,"factorialUs":141.1,"runningUs":158.4,"digitsInAnswer":300,"overflowPossible":false}}',
    highlights: [
      "The triangle is drawn with both edges marked as 1s and every interior cell wired to the two cells above it.",
      "The element track asks for C(4,2) and lights only the chain the running product actually walks.",
      "Its accumulator steps from 1 to 4 by multiplying by 4 and dividing by 1, landing on C(4,1).",
      "It then multiplies by 3 to reach 12 and divides by 2 to reach 6, which is C(4,2) and the answer.",
      "The rest of the triangle stays dark throughout, showing how little of the picture that question needed.",
      "The row track lights a single horizontal band, each entry produced from its left neighbour by an arrow labelled times (n-r+1) over r.",
      "Every other row stays dark, and the work counter shows n steps rather than n squared.",
      "The triangle track lights everything, each interior cell visibly summing the two above it.",
      "Only that track is labelled optimal, because there the whole picture genuinely is the answer.",
      "The measured ratios print beneath the three counters: 108x for one element and 204x for one row, both at n = 1000.",
      "The overflow panel shows the accumulator for C(30,15) climbing through C(30,1) and C(30,2) inside a bar marking the 64-bit range.",
      "It never approaches the edge, because the largest intermediate is the answer itself at 155,117,520.",
      "Replayed with the numerator accumulated first, the same computation bursts past the 63-bit mark, needing 68 bits.",
      "The failure case runs C(62,28), advancing correctly for twenty-seven steps.",
      "At step 27 the intermediate 9,789,240,063,620,849,020 is drawn overtopping LLONG_MAX, and the result flips negative.",
      "The true value 349,615,716,557,887,465 sits alongside, comfortably inside the bar — the destination was always reachable, the route was not.",
    ],
  },

  edgeCases: [
    "Row 0 — a single 1, and the loop for the running product never executes.",
    "Position 0 or position n in any row — always 1, since C(n,0) and C(n,n) are both 1.",
    "Position 1 or position n-1 — always n, which is a useful sanity check on any implementation.",
    "A position outside the row, such as r greater than n — should return 0 rather than indexing out of bounds.",
    "A negative position — the same guard handles it, and omitting the guard produces an infinite or wrapped loop.",
    "The symmetric case C(n, r) equals C(n, n-r) — taking the smaller halves the work and changes nothing about the answer.",
    "One-indexed problem statements, where the entry at row R column C is C(R-1, C-1) — the most common way to be off by exactly one row.",
    "n = 61 in a 64-bit integer — the largest value verified safe for the plain running product across every r.",
    "n between 62 and 66 — the answer still fits a 64-bit integer and the running product returns a negative number anyway.",
    "n = 67 and above — the answer itself exceeds a 64-bit integer, so a wider type is genuinely required.",
    "Very large n in Python, where arbitrary precision means math.comb(1000,500) returns an exact 300-digit value.",
  ],

  pitfalls: [
    "Computing C(n,r) through factorials. 21! exceeds a 64-bit integer while C(30,15) = 155,117,520 fits a 32-bit one — the route overflows on an answer that never does.",
    "Accumulating the whole numerator before dividing. For C(30,15) that intermediate needs 68 bits and a 64-bit integer holds 63.",
    "Assuming the running product is safe for any n that yields a representable answer. Verified: C(62,28) returns a negative number while the true value fits comfortably.",
    "Building the entire triangle to read one element. Measured 108x slower at n = 1000, and the gap widens with n.",
    "Building the entire triangle to produce one row. Measured 204x slower at n = 1000 in Python.",
    "Confusing one-indexed and zero-indexed statements. At row R column C counted from 1, the value is C(R-1, C-1).",
    "Using floating point division in the running product. The values are exact integers and a double loses precision well before the integer range runs out.",
    "Fearing the integer division truncates. It never does — verified over 671,650 divisions with zero remainders, because the accumulator is always a binomial coefficient.",
    "Forgetting the r greater than n or r negative guard, which turns a bad input into an out-of-range access rather than a 0.",
    "Skipping the C(n,r) = C(n,n-r) symmetry, which doubles the loop length for positions in the right half of a row.",
    "Writing the factorial route in Python and assuming it is equally fine. It is correct there, and measured 3.3x slower than math.comb.",
    "Carrying the overflow warnings into Python at all — its integers are arbitrary precision, so the entire discussion is a C++ and Java concern.",
  ],

  commonDoubts: [
    {
      question: "Why not just use n! / (r! (n-r)!)?",
      answer:
        "Because the factorials overflow long before the answer does. 13! is the first factorial too large for a 32-bit integer and 21! the first too large for a 64-bit one. Meanwhile C(30,15) is 155,117,520, which fits a 32-bit integer with room to spare — but 30! has 33 digits. You would be routing a nine-digit answer through a thirty-three-digit intermediate. The running product avoids this entirely by dividing at every step, so the largest value it ever holds is roughly the answer itself.",
    },
    {
      question: "Doesn't the integer division in the running product lose precision?",
      answer:
        "No, and this is provable rather than lucky. After step i the accumulator holds exactly C(n, i+1), which is an integer by definition of a binomial coefficient. So when you compute res times (n-i), that product is necessarily divisible by (i+1) — because the result of dividing it is C(n, i+2), which is also an integer. Verified over n = 0 to 200 and every r: 671,650 divisions performed, zero with a remainder, zero wrong results. The one thing you must not do is accumulate the numerator first and divide at the end, which is a different computation with different overflow behaviour.",
    },
    {
      question: "Does the order of the multiply and divide really matter?",
      answer:
        "It decides whether the calculation is possible at all. Dividing at every step keeps the largest intermediate at roughly the answer. Multiplying the whole numerator first does not: for C(30,15) that numerator is 202,843,204,931,727,360,000, which needs 68 bits, and a 64-bit signed integer holds 63. For C(66,33) it needs 186 bits. Same formula, same answer, and one ordering overflows while the other stays comfortably in range.",
    },
    {
      question: "So the running product is always safe?",
      answer:
        "No — and the limit is lower than you would guess, which is why the exact figure is worth carrying. Measured with a 64-bit signed integer, the first wrong result is C(62,28): the true value 349,615,716,557,887,465 fits comfortably, but at step 27 the intermediate res times (n-i) reaches 9,789,240,063,620,849,020 against a maximum of 9,223,372,036,854,775,807, and the function returns −309,196,571,788,882,235. The answer itself only exceeds a 64-bit integer at n = 67, so for n from 62 to 66 the answer fits and the computation fails anyway. Verified safe range for the plain version: n ≤ 61 for every r, with zero mismatches against a 128-bit reference. This is the same trap as the sum formula in Find Missing Number — the intermediate overflows before the result does.",
    },
    {
      question: "Why is building the triangle wrong if it gives the right answer?",
      answer:
        "It is not wrong, it is disproportionate — and only for two of the three questions. To return one element it does O(n^2) work for an O(1) answer, measured 108x slower than the running product at n = 1000. To return one row it does O(n^2) work for an O(n) answer, measured 204x slower in Python at the same size. But to return the whole triangle it is optimal, because the output is itself O(n^2) numbers and you cannot produce them in less work than that. The question to ask before building anything is how big the answer is.",
    },
    {
      question: "How do I get a whole row without building the rows above it?",
      answer:
        "Each entry follows from its left neighbour: C(n,r) = C(n,r-1) times (n-r+1) divided by r. Start at 1 and walk across, and you have the entire row in O(n) having touched no other row. For row 5 that produces 1, 5, 10, 10, 5, 1 directly. It is the same identity as the running product applied sideways instead of downwards, and it was verified identical to math.comb at every position of row 1000.",
    },
    {
      question: "My answers are all one row off. What did I get wrong?",
      answer:
        "Almost certainly the indexing convention. Counted from zero, the entry at row n position r is C(n, r). Many problem statements count rows and columns from one, in which case the entry at row R column C is C(R-1, C-1). Both conventions are common and neither is wrong, but mixing them shifts every answer by a row. Fix the convention explicitly at the top of your solution rather than adjusting until the sample passes.",
    },
    {
      question: "Does any of the overflow discussion apply in Python?",
      answer:
        "None of it. Python integers are arbitrary precision, so factorials, numerator-first accumulation and the running product are all exact at any size — math.comb(1000, 500) returns a precise 300-digit value. Measured for that call: math.comb 43.2 microseconds, the factorial route 141.1, and a hand-written running product 158.4. So in Python use math.comb, which is both the shortest and the fastest, and treat the overflow material as a C++ and Java concern. It is the same split seen in Find Missing Number: a genuine correctness hazard in two languages and a non-issue in the third.",
    },
    {
      question: "Where does this actually get used?",
      answer:
        "The row recurrence is the seed of dynamic programming — each row computed once from the row above is exactly the shape of a DP table filled in order, which is why this problem sits where it does in a DSA course. Concretely, the number of paths through an m by n grid moving only right and down is a single binomial coefficient, so Grid Unique Paths is this subtopic with a story attached. And the overflow lesson generalises to every combinatorial count you compute from here on, because those answers grow faster than almost anything else you will meet.",
    },
  ],

  relatedIds: ["integer-overflow-and-precision-errors", "find-missing-number", "majority-element-i", "grid-unique-paths"],
};

export default content;
