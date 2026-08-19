import type { SubtopicContent } from "../types";

/**
 * Subtopic 10 of Arrays. The first problem solved by ARITHMETIC rather than by
 * traversal strategy, and the first where two O(n)/O(1) answers are genuinely
 * not equivalent: one silently produces wrong results on large inputs and the
 * other cannot.
 *
 * SOURCES
 * - LeetCode 268, "Missing Number" — the [0, n] statement.
 * - GeeksforGeeks, "Find the missing number" — the sum-formula and XOR
 *   approaches, and the 1..N statement used here.
 *
 * MEASURED ON THIS MACHINE (clang -O2 -fwrapv, Python 3.13.4):
 *
 * 1. THE SUM FORMULA OVERFLOWS EARLIER THAN THE OBVIOUS BOUND, because the
 *    INTERMEDIATE PRODUCT overflows before the result does:
 *      N = 46,340 : N*(N+1) = 2,147,441,940  fits
 *      N = 46,341 : N*(N+1) = 2,147,534,622  OVERFLOWS int
 *      N = 65,536 : N(N+1)/2 = 2,147,516,416 result finally exceeds INT_MAX
 *    So between N = 46,341 and N = 65,535 the formula is wrong even though its
 *    true answer fits in an int comfortably. First measured failure: N = 46,341
 *    — the same 46,341 that breaks i*i in the Prime Check subtopic, because both
 *    are sqrt(INT_MAX) = 46,340.95.
 *
 * 2. AND THE FAILURE IS NOT MONOTONIC, WHICH IS WORSE THAN ALWAYS FAILING.
 *    Both `expected` and `actual` overflow, and their wrap-around errors
 *    sometimes cancel in the subtraction. Measured over N = 46,000..200,000
 *    with the value 7 missing: 88,907 wrong and 65,094 ACCIDENTALLY CORRECT —
 *    42% right by luck. It is correct at N = 46,340 and N = 100,000, and wrong
 *    at N = 46,341 and N = 150,000. A test at 100,000 passes and a test at
 *    150,000 fails, so you cannot test your way to confidence.
 *
 * 3. XOR NEVER FAILS. Verified across N = 46,000..200,000 with 0 failures, and
 *    against every possible missing value for N in {1,2,3,10,100,1000} —
 *    1,116 checks, 0 failures. It is bitwise, so overflow is not a concept that
 *    applies.
 *
 * 4. THE CLOSED FORM MAKES XOR THE FASTEST OPTION TOO. XOR(1..N) equals
 *    [N, 1, N+1, 0][N % 4] — verified for N = 0..20,000 with 0 mismatches —
 *    which collapses the first loop to a constant. Timing at N = 10,000,000:
 *      xor, closed form : 0.62ms   <- fastest, single pass
 *      sum, long long   : 0.93ms
 *      xor, two loops   : 1.40ms
 *      seen array       : 3.33ms   (+9.5 MB)
 *    Verified correct for every (N <= 2000, missing value) pair: 0 failures.
 *    So XOR is not a trade of speed for safety — it wins on both.
 *
 * 5. PYTHON CANNOT HIT THIS BUG AT ALL. Its ints are arbitrary precision, so
 *    the sum approach is correct at N = 46,341, 65,536, 100,000, 150,000 and
 *    1,000,000 — verified — with expected sums up to 500,000,500,000. The same
 *    source line is a latent bug in C++ and Java and simply is not one in
 *    Python, which is the sharpest language divergence in the module so far.
 *
 * NOTE ON -fwrapv: signed overflow is UNDEFINED BEHAVIOUR in C++, not wrapping.
 * The measurements above use -fwrapv so the results are reproducible; without
 * it the compiler is entitled to assume the overflow never happens and optimise
 * on that basis, which makes the real situation worse rather than better.
 *
 * Scope: finding two missing numbers, and the repeating-and-missing pair, are
 * later subtopics that extend the same arithmetic ideas.
 */
const content: SubtopicContent = {
  id: "find-missing-number",
  topic: "Arrays",
  title: "Find Missing Number",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "integer-overflow-and-precision-errors",
    "linear-search",
    "largest-element",
    "for-loop",
    "arithmetic-operators",
    "time-and-space-complexity-basics",
  ],

  summary:
    "One number is missing from 1..N — find it in one pass without extra space, and see why the sum formula and the XOR trick are not interchangeable: the sum silently fails from N = 46,341 and is accidentally right 42% of the time after that, while XOR cannot fail and measured faster.",

  theory: `
## The problem

An array holds \`N - 1\` distinct integers drawn from \`1..N\`. Exactly one value from
that range is absent. Find it.

\`\`\`
N = 5,  arr = [1, 2, 4, 5]   ->  3
N = 3,  arr = [1, 3]         ->  2
\`\`\`

LeetCode states the same problem over \`0..n\` with an array of length \`n\`; every
approach below transfers by changing the range the totals are taken over.

## The idea that makes it O(1) space

You are not searching for a value — you are searching for a **discrepancy**. The
full range \`1..N\` is completely known in advance, so you can compute any summary
of it without ever seeing the array. Compute the same summary of the array, and
whatever the two disagree by is the missing element.

That reframing is what removes the need for a lookup structure, and it is the
transferable idea. Two summaries work: the **sum** and the **XOR**.

## The sum approach

The sum of \`1..N\` is \`N(N+1)/2\`. Subtract the actual sum of the array and the
difference is the missing value, because every present number contributes to both
totals and cancels.

\`\`\`
N = 5:  expected 15,  actual 1+2+4+5 = 12,  missing = 3
\`\`\`

Clean, one pass, O(1) space. And it carries a defect that is worth the rest of
this section.

## Where the sum approach breaks, and why it is earlier than you think

The obvious worry is that \`N(N+1)/2\` grows past the integer limit. With 32-bit
signed ints, \`N(N+1)/2 > 2,147,483,647\` first happens at **N = 65,536**.

But that is not where it breaks. The expression \`N * (N + 1) / 2\` computes the
**product first**, and the product is roughly twice the result:

| N | \`N*(N+1)\` | fits? | \`N(N+1)/2\` | fits? |
|---|---|---|---|---|
| 46,340 | 2,147,441,940 | yes | 1,073,720,970 | yes |
| **46,341** | **2,147,534,622** | **no** | 1,073,767,311 | yes |
| 65,536 | — | no | 2,147,516,416 | no |

So from **N = 46,341** the formula is already wrong, even though its true answer
would fit in an \`int\` with room to spare. The first measured failure is exactly
N = 46,341 — and that number should look familiar: it is the same threshold that
breaks \`i * i <= n\` in the Prime Check subtopic, because both are
\`sqrt(INT_MAX) = 46,340.95\`.

## The part that makes it genuinely dangerous

If the formula simply failed above 46,341 you would find it immediately. It does
not.

Both \`expected\` and \`actual\` overflow, and since the answer is
\`expected - actual\`, their wrap-around errors **sometimes cancel**. Measured over
every N from 46,000 to 200,000 with the value 7 missing:

- **88,907 wrong answers**
- **65,094 accidentally correct** — 42% right purely by luck

It is correct at N = 46,340 and again at N = 100,000. It is wrong at N = 46,341
and at N = 150,000. **A test at N = 100,000 passes and a test at N = 150,000
fails**, and nothing about the code changed in between.

That is the worst possible failure shape: not "wrong", but "wrong unpredictably".
You cannot test your way to confidence in it, because a passing test tells you
nothing about the next input.

The fix in C++ and Java is to compute the totals in a 64-bit type — \`long long\`
or \`long\` — which pushes the limit past any \`N\` that fits in an array. Note that
casting the *result* is too late; the width has to be right before the
multiplication happens.

**And in C++ this is worse than a wrong answer.** Signed overflow is *undefined
behaviour*, not defined wrapping. The measurements here use \`-fwrapv\` to make
them reproducible; without it the compiler is entitled to assume the overflow
never occurs and optimise on that assumption.

## The XOR approach

XOR every value in \`1..N\`, then XOR every element of the array. What remains is
the missing number.

It works because XOR is its own inverse: \`x ^ x = 0\`, and \`x ^ 0 = x\`. Every
present value appears exactly twice across the two passes — once from the range,
once from the array — so every one of them cancels to zero. The missing value
appears only once, in the range, and survives.

\`\`\`
N = 5, arr = [1,2,4,5]
(1^2^3^4^5) ^ (1^2^4^5) = 3   — the 1s, 2s, 4s and 5s pair off and vanish
\`\`\`

**Overflow is not a concept that applies to XOR.** It is a bitwise operation; the
result is always the width of its operands and no accumulation happens. Verified
across N = 46,000 to 200,000 with zero failures, and against every possible
missing value for several N — 1,116 checks, zero failures.

## XOR is also the faster one

The naive XOR version needs two loops — one over \`1..N\` and one over the array —
which is twice the work of the sum's single pass. That is a real cost, and it is
removable.

XOR of \`1..N\` has a **closed form** that depends only on \`N mod 4\`:

| \`N % 4\` | \`XOR(1..N)\` |
|---|---|
| 0 | \`N\` |
| 1 | \`1\` |
| 2 | \`N + 1\` |
| 3 | \`0\` |

Verified for N = 0 to 20,000 with zero mismatches. That collapses the first loop
to a single expression, leaving one pass over the array — exactly the same work
as the sum.

Measured at N = 10,000,000:

| Approach | Time |
|---|---|
| XOR, closed form | **0.62ms** |
| Sum, \`long long\` | 0.93ms |
| XOR, two loops | 1.40ms |
| Seen array | 3.33ms (+9.5 MB) |

So XOR is **not** a trade of speed for safety. With the closed form it is both the
safest and the fastest, and it was verified correct for every \`(N ≤ 2000, missing
value)\` pair.

## Python cannot have this bug

Python's integers are arbitrary precision — they grow to whatever size the value
needs. The sum approach is therefore correct at every N tested, verified at
N = 46,341, 65,536, 100,000, 150,000 and 1,000,000, with expected sums as large as
500,000,500,000.

This is the sharpest language divergence in the module: **the same source line is
a latent, non-deterministic bug in C++ and Java, and simply is not a bug in
Python.** The cost is that Python's arithmetic is slower in general, which is the
trade being made on your behalf.

The practical consequence: advice about "use XOR to avoid overflow" is essential
in C++ and Java and irrelevant in Python, where you should pick between them on
clarity instead.

## Where this goes next

Both summaries extend. Two missing numbers need two equations — a sum and a sum
of squares, or a XOR plus a bit-partition — which is **Find the Repeating and
Missing Number**. The idea of comparing a computed summary against an expected
one reappears throughout, and the overflow lesson applies every time the summary
is arithmetic rather than bitwise.
`.trim(),

  intuition:
    "You know exactly who was invited and you can see exactly who turned up. You do not need to check the guest list name by name — take any total of the invitations, take the same total of the arrivals, and the gap between them names the absentee. Choosing which total to take is the whole subtopic: an arithmetic one can overflow its container, and a bitwise one has no container to overflow.",

  approaches: [
    {
      name: "Brute Force - Search for Each Candidate",
      idea: "For every value in the range, scan the array to see whether it is present.",
      steps: [
        "Consider each candidate value from 1 to N in turn.",
        "Scan the entire array looking for that candidate.",
        "If the scan finds it, move on to the next candidate.",
        "If the scan finishes without finding it, that candidate is the missing value.",
        "Return it immediately.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int findMissing(const vector<int>& arr, int N) {
    for (int candidate = 1; candidate <= N; candidate++) {
        bool found = false;
        for (int x : arr) {
            if (x == candidate) { found = true; break; }
        }
        if (!found) return candidate;
    }
    return -1;
}`,
          annotations: {
            5: "N candidates, each triggering a scan of up to N-1 elements — the definition of O(n^2).",
            7: "This is Linear Search from the previous subtopic, called N times.",
            10: "Correct and unusable at scale: at N = 100,000 this is around five billion comparisons.",
          },
        },
        {
          language: "java",
          code: `static int findMissing(int[] arr, int N) {
    for (int candidate = 1; candidate <= N; candidate++) {
        boolean found = false;
        for (int x : arr) {
            if (x == candidate) { found = true; break; }
        }
        if (!found) return candidate;
    }
    return -1;
}`,
          annotations: {
            2: "The outer loop makes the range the thing being iterated, and the array the thing being searched.",
          },
        },
        {
          language: "python",
          code: `def find_missing(arr, N):
    for candidate in range(1, N + 1):
        if candidate not in arr:      # 'in' is itself an O(n) scan
            return candidate
    return -1`,
          annotations: {
            3: "The in operator hides the inner loop but does not remove it, so this is still O(n^2).",
          },
        },
      ],
      complexity: {
        time: "O(n^2)",
        space: "O(1)",
        note: "Correct and quadratic, because it performs a full linear search for each of the N candidates. It is worth writing once to see that the problem is solvable without cleverness, and then discarding.",
      },
    },
    {
      name: "Better - Seen Array",
      idea: "Mark every value present in a lookup table, then scan the table for the unmarked slot.",
      steps: [
        "Create a boolean table with one slot per value in the range, all initially false.",
        "Walk the array and mark the slot corresponding to each element.",
        "Walk the table from 1 to N.",
        "The first unmarked slot is the missing value.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int findMissing(const vector<int>& arr, int N) {
    vector<char> seen(N + 1, 0);
    for (int x : arr) seen[x] = 1;

    for (int i = 1; i <= N; i++) {
        if (!seen[i]) return i;
    }
    return -1;
}`,
          annotations: {
            5: "vector<char> rather than vector<bool>, whose bit-packed specialisation trades speed for space.",
            6: "Indexing directly by value is what makes this O(1) per element instead of a search.",
            11: "Measured 3.33ms at N = 10,000,000 and 9.5 MB of extra memory — the fastest of the wrong-space-complexity approaches.",
          },
        },
        {
          language: "java",
          code: `static int findMissing(int[] arr, int N) {
    boolean[] seen = new boolean[N + 1];
    for (int x : arr) seen[x] = true;

    for (int i = 1; i <= N; i++) {
        if (!seen[i]) return i;
    }
    return -1;
}`,
          annotations: {
            2: "Java zero-initialises the array, so no explicit clearing pass is needed.",
          },
        },
        {
          language: "python",
          code: `def find_missing(arr, N):
    seen = [False] * (N + 1)
    for x in arr:
        seen[x] = True

    for i in range(1, N + 1):
        if not seen[i]:
            return i
    return -1


# A set works identically and allocates more per element:
#   present = set(arr)
#   return next(i for i in range(1, N + 1) if i not in present)`,
          annotations: {
            2: "One slot per possible value, which is the O(n) space this approach spends to avoid arithmetic.",
            12: "The set version reads better and costs a hash entry per element rather than a byte.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(n)",
        note: "Optimal in time and it allocates a table proportional to the range. Measured 3.33ms at N = 10,000,000 plus 9.5 MB, against 0.62ms and no allocation for the XOR approach.",
      },
    },
    {
      name: "Sorting Then Scan",
      idea: "Sort the array and find the first position whose value does not match its expected index.",
      steps: [
        "Sort the array in ascending order.",
        "Walk it comparing each element against the value it should hold.",
        "The first position where the element exceeds its expected value reveals the gap.",
        "If the walk completes with no mismatch, the missing value is N.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

int findMissing(vector<int> arr, int N) {   // by value: caller's data survives
    sort(arr.begin(), arr.end());

    for (int i = 0; i < (int)arr.size(); i++) {
        if (arr[i] != i + 1) return i + 1;
    }
    return N;                                // nothing missing before the end
}`,
          annotations: {
            5: "By value costs an O(n) copy; taking a reference would leave the caller's array reordered.",
            9: "Position i should hold i+1, so the first place that fails names the gap.",
            11: "Reached when the missing value is N itself, which is the case people forget to handle.",
          },
        },
        {
          language: "java",
          code: `import java.util.Arrays;

static int findMissing(int[] arr, int N) {
    int[] a = Arrays.copyOf(arr, arr.length);
    Arrays.sort(a);

    for (int i = 0; i < a.length; i++) {
        if (a[i] != i + 1) return i + 1;
    }
    return N;
}`,
          annotations: {
            4: "Copying first, because Arrays.sort would otherwise reorder the caller's array as a side effect.",
          },
        },
        {
          language: "python",
          code: `def find_missing(arr, N):
    a = sorted(arr)                 # sorted() copies; arr.sort() would mutate
    for i, value in enumerate(a):
        if value != i + 1:
            return i + 1
    return N`,
          annotations: {
            2: "sorted() leaves the caller's list untouched, which arr.sort() would not.",
            6: "The fallthrough covers the case where every present value is in place and N itself is absent.",
          },
        },
      ],
      complexity: {
        time: "O(n log n)",
        space: "O(1) sorting in place, O(n) for a defensive copy",
        note: "Correct and the slowest of the reasonable approaches, since it derives a full ordering to answer a question that needs only a total. It does generalise to unsorted ranges and non-contiguous sets, which the arithmetic approaches do not.",
      },
    },
    {
      name: "Sum Formula",
      idea: "Subtract the array's total from the known total of the whole range.",
      steps: [
        "Compute the expected total of 1 through N using N(N+1)/2.",
        "Compute the actual total of the array in a single pass.",
        "Subtract the actual from the expected; the difference is the missing value.",
        "Perform both totals in a 64-bit type, because the intermediate product overflows a 32-bit int from N = 46,341.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int findMissing(const vector<int>& arr, int N) {
    // long long BEFORE the multiplication. Casting the result is too late,
    // because N*(N+1) has already overflowed by then.
    long long expected = (long long)N * (N + 1) / 2;

    long long actual = 0;
    for (int x : arr) actual += x;

    return (int)(expected - actual);
}

// The version to avoid — measured WRONG from N = 46,341:
int findMissingBroken(const vector<int>& arr, int N) {
    int expected = N * (N + 1) / 2;      // product overflows before the divide
    int actual = 0;
    for (int x : arr) actual += x;       // this accumulator overflows too
    return expected - actual;
}`,
          annotations: {
            7: "The cast must come before the multiply. (long long)(N * (N + 1) / 2) would be too late to help.",
            17: "First measured failure at N = 46,341 — the same sqrt(INT_MAX) threshold that breaks i*i in Prime Check.",
            19: "Both totals overflow, and their errors sometimes cancel: 42% of N from 46,000 to 200,000 gave the right answer by luck.",
          },
        },
        {
          language: "java",
          code: `static int findMissing(int[] arr, int N) {
    long expected = (long) N * (N + 1) / 2;

    long actual = 0;
    for (int x : arr) actual += x;

    return (int) (expected - actual);
}`,
          annotations: {
            2: "Java's int overflow is defined to wrap, unlike C++ where it is undefined behaviour — the wrong answer is at least predictable here.",
            5: "Accumulating into a long matters as much as the formula: the running total exceeds int well before the loop ends.",
          },
        },
        {
          language: "python",
          code: `def find_missing(arr, N):
    expected = N * (N + 1) // 2
    return expected - sum(arr)


# No overflow is possible here — Python ints are arbitrary precision.
# Verified correct at N = 46,341 / 65,536 / 100,000 / 150,000 / 1,000,000,
# where the expected total reaches 500,000,500,000.
# The identical line in C++ or Java is a latent bug from N = 46,341.`,
          annotations: {
            2: "Integer division with //, since / would produce a float and lose exactness on large values.",
            3: "sum() runs as compiled C, so this is both the shortest and the fastest Python option.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "Measured 0.93ms at N = 10,000,000 with 64-bit totals. In 32-bit arithmetic it first fails at N = 46,341 and is then non-deterministically wrong — 88,907 failures and 65,094 accidental successes across N = 46,000..200,000.",
      },
    },
    {
      name: "Optimal - XOR",
      idea: "XOR the whole range against the whole array; every present value cancels and the missing one survives.",
      steps: [
        "Compute the XOR of every value from 1 to N.",
        "XOR that against every element of the array.",
        "Each present value has now been XORed exactly twice and has cancelled to zero.",
        "The missing value appeared only once and is what remains.",
        "Replace the first loop with the closed form for XOR(1..N), which depends only on N mod 4.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

// XOR of 1..n in constant time. Verified for n = 0..20,000.
static int xorUpto(int n) {
    switch (n & 3) {
        case 0:  return n;
        case 1:  return 1;
        case 2:  return n + 1;
        default: return 0;
    }
}

int findMissing(const vector<int>& arr, int N) {
    int x = xorUpto(N);              // whole range, in O(1)
    for (int v : arr) x ^= v;        // one pass over the array
    return x;
}`,
          annotations: {
            5: "n & 3 is n % 4 for non-negative n, and the pattern repeats with period four.",
            15: "This is what makes XOR a single-pass algorithm rather than a two-pass one.",
            16: "Bitwise throughout, so overflow is not a concept that applies — no accumulation ever happens.",
            17: "Measured 0.62ms at N = 10,000,000, the fastest of every approach here.",
          },
        },
        {
          language: "java",
          code: `static int xorUpto(int n) {
    switch (n & 3) {
        case 0:  return n;
        case 1:  return 1;
        case 2:  return n + 1;
        default: return 0;
    }
}

static int findMissing(int[] arr, int N) {
    int x = xorUpto(N);
    for (int v : arr) x ^= v;
    return x;
}`,
          annotations: {
            11: "No long anywhere, and no overflow risk, because XOR never grows a value beyond its operand width.",
          },
        },
        {
          language: "python",
          code: `def xor_upto(n):
    """XOR of 1..n — verified for n = 0..20,000."""
    return [n, 1, n + 1, 0][n % 4]


def find_missing(arr, N):
    x = xor_upto(N)
    for v in arr:
        x ^= v
    return x


# Concise alternative using functools.reduce over both sequences:
#   from functools import reduce
#   from operator import xor
#   return reduce(xor, arr, xor_upto(N))`,
          annotations: {
            3: "A four-element lookup indexed by n % 4, which is the closed form written directly.",
            9: "In Python this offers no safety benefit over sum, since ints cannot overflow — pick on clarity here.",
            15: "reduce with operator.xor pushes the loop into C, the same trade seen throughout this module.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "Cannot overflow at any N, verified across N = 46,000..200,000 and against every possible missing value for several N — 1,116 checks, zero failures. With the closed form it is also the fastest, measured 0.62ms at N = 10,000,000 against 0.93ms for the sum.",
      },
    },
  ],

  examples: [
    {
      input: "N = 5, arr = [1, 2, 4, 5]",
      output: "3",
      walkthrough: [
        "The expected total of 1 through 5 is 5 times 6 divided by 2, which is 15.",
        "The actual total of the array is 1 + 2 + 4 + 5, which is 12.",
        "The difference 15 minus 12 is 3, so 3 is missing.",
        "By XOR instead: the range gives 1^2^3^4^5, and the array gives 1^2^4^5.",
        "XORing those together pairs off the 1s, 2s, 4s and 5s, each pair cancelling to zero.",
        "Only the 3 appeared an odd number of times, so 3 is what remains.",
        "Both methods agree, which they will for every input small enough that the sum does not overflow.",
      ],
      why: "Runs both summaries side by side on an input where they agree, establishing that the disagreement examined later is about arithmetic limits rather than about the algorithms being different.",
    },
    {
      input: "N = 46,341 with the value 7 missing, using 32-bit int arithmetic",
      output: "-2147483641 instead of 7",
      walkthrough: [
        "The true expected total is 46,341 times 46,342 divided by 2, which is 1,073,767,311 and fits an int comfortably.",
        "But the expression computes the product first: 46,341 times 46,342 is 2,147,534,622.",
        "That exceeds INT_MAX of 2,147,483,647, so the multiplication overflows before the division ever happens.",
        "The running total of the array elements overflows as well, for the same reason.",
        "The subtraction of two corrupted totals yields -2147483641 rather than 7.",
        "N = 46,340 works correctly and N = 46,341 does not, making this the exact first point of failure.",
      ],
      why: "Shows the failure begins at the intermediate product rather than at the result, which is why the intuitive bound of N = 65,536 is wrong by more than nineteen thousand.",
    },
    {
      input: "The same 32-bit sum formula at N = 100,000 and at N = 150,000",
      output: "Correct at 100,000 and wrong at 150,000",
      walkthrough: [
        "At N = 100,000 the expected total is 5,000,050,000, which overflows an int more than twice over.",
        "The array's running total overflows by very nearly the same amount.",
        "Subtracting two similarly corrupted values cancels the error and returns 7, which is correct.",
        "At N = 150,000 the same two overflows do not cancel, and the result is wrong.",
        "Measured across every N from 46,000 to 200,000: 88,907 wrong answers and 65,094 accidentally correct.",
        "That is 42% right by luck, so a test at N = 100,000 passes and gives no information about N = 150,000.",
      ],
      why: "The most important example in the subtopic — it shows the bug is not merely present but non-monotonic, which means testing cannot establish confidence in the broken version.",
    },
    {
      input: "The same sum formula written in Python, at every N above",
      output: "Correct at all of them",
      walkthrough: [
        "Python integers grow to whatever size the value requires, with no fixed width.",
        "At N = 46,341 the expected total of 1,073,767,311 is computed exactly.",
        "At N = 1,000,000 the expected total is 500,000,500,000, which is far beyond a 32-bit range and still exact.",
        "Verified at N = 46,341, 65,536, 100,000, 150,000 and 1,000,000, with the sum and the XOR agreeing at every one.",
        "The identical expression is a latent, input-dependent bug in C++ and Java.",
        "So the standard advice to prefer XOR for overflow safety is essential in two of the three languages and irrelevant in the third.",
      ],
      why: "The sharpest language divergence in the module: one source line that is a non-deterministic bug in two languages and cannot fail in the third.",
    },
  ],

  visualization: {
    kind: "custom",
    description:
      "Two ledgers side by side, one headed EXPECTED and holding the full range 1..N as a row of tiles, the other headed ACTUAL and holding the array. Beneath each runs a running total in a box drawn with a visible capacity bar, so the number and its container are both on screen. Animate both totals accumulating together tile by tile, and let the difference between them be displayed continuously so it is clear the answer is a discrepancy rather than a search result. Then switch the totals to 32-bit mode and replay at N = 46,341: as the accumulation crosses 2,147,483,647 the capacity bar fills completely and the number visibly wraps to a large negative value, with the wrap moment held and labelled. Crucially, show the product N*(N+1) being formed BEFORE the division, and let it be the thing that overflows while a ghost of the true result sits below it well inside the bar — that gap between the overflowing intermediate and the safely-sized result is the whole lesson. Then run the non-monotonic panel: a slider over N from 46,000 to 200,000 with a verdict lamp that flips between correct and wrong as it moves, refusing to settle into a pattern, with a tally underneath reading 88,907 wrong against 65,094 accidentally correct. Beside it, a XOR ledger runs the same input as a stack of bit rows rather than numbers: each value from the range and each value from the array is drawn as its bit pattern, identical pairs visibly annihilate to a row of zeros, and only the missing value's bit pattern is left standing. Give the XOR ledger no capacity bar at all, because there is no accumulation to overflow, and label that absence explicitly. Close with the closed-form panel, cycling N through values whose remainder mod 4 is 0, 1, 2 and 3 and showing XOR(1..N) landing on N, 1, N+1 and 0 respectively, which collapses the entire EXPECTED ledger into a single tile — and with it a timing bar showing 0.62ms for the closed-form XOR against 0.93ms for the sum and 3.33ms for the seen array.",
    sampleInput:
      '{"primary":{"N":5,"array":[1,2,4,5],"expectedSum":15,"actualSum":12,"missing":3,"xorRange":"1^2^3^4^5","xorArray":"1^2^4^5","cancelledPairs":[1,2,4,5],"survivor":3},"overflowPanel":{"N":46341,"trueExpected":1073767311,"intermediateProduct":2147534622,"INT_MAX":2147483647,"productOverflows":true,"resultWouldFit":true,"got":-2147483641,"correct":7,"firstFailingN":46341,"sqrtIntMax":46340.95,"sameConstantAs":"i*i in prime-check"},"nonMonotonic":{"rangeStart":46000,"rangeEnd":200000,"wrong":88907,"accidentallyCorrect":65094,"accidentRate":0.42,"samples":[{"N":46340,"verdict":"correct"},{"N":46341,"verdict":"wrong"},{"N":65535,"verdict":"wrong"},{"N":100000,"verdict":"correct"},{"N":150000,"verdict":"wrong"},{"N":200000,"verdict":"wrong"}]},"xorPanel":{"hasCapacityBar":false,"reason":"bitwise — no accumulation, so no overflow","verifiedRange":[46000,200000],"failures":0,"exhaustiveChecks":1116,"exhaustiveFailures":0},"closedForm":{"table":[{"mod":0,"value":"N"},{"mod":1,"value":"1"},{"mod":2,"value":"N+1"},{"mod":3,"value":"0"}],"verifiedUpTo":20000,"mismatches":0},"timing":{"N":10000000,"xorClosedFormMs":0.62,"sumLongLongMs":0.93,"xorTwoLoopsMs":1.40,"seenArrayMs":3.33,"seenArrayMB":9.5},"python":{"arbitraryPrecision":true,"verifiedAt":[46341,65536,100000,150000,1000000],"largestExpectedSum":500000500000}}',
    highlights: [
      "Two ledgers appear side by side: EXPECTED holding the full range 1..N, and ACTUAL holding the array.",
      "Both running totals accumulate tile by tile, with the difference between them displayed continuously.",
      "At N = 5 the totals settle at 15 and 12, and the difference 3 is the answer — a discrepancy, not a search result.",
      "Switching to 32-bit mode and replaying at N = 46,341 puts a capacity bar under each total.",
      "The product N*(N+1) is formed before the division, and it is that intermediate which fills the bar and wraps negative.",
      "A ghost of the true result 1,073,767,311 sits well inside the bar beneath it, showing the answer would have fitted.",
      "That gap between the overflowing intermediate and the safely-sized result is the reason failure starts at 46,341 rather than 65,536.",
      "The slider panel sweeps N from 46,000 to 200,000 and the verdict lamp flips between correct and wrong without settling.",
      "It reads correct at 46,340, wrong at 46,341, correct again at 100,000, and wrong at 150,000.",
      "The tally underneath reads 88,907 wrong against 65,094 accidentally correct — 42% right by luck.",
      "The XOR ledger draws every value as a bit pattern instead of a number, from both the range and the array.",
      "Identical pairs visibly annihilate to rows of zeros, leaving only the missing value's bits standing.",
      "That ledger has no capacity bar at all, and the absence is labelled — there is no accumulation, so there is nothing to overflow.",
      "The closed-form panel cycles N through the four remainders mod 4, landing on N, 1, N+1 and 0.",
      "The entire EXPECTED ledger collapses into a single tile, turning XOR from a two-pass algorithm into a one-pass one.",
      "The timing bar closes it out: 0.62ms for closed-form XOR, 0.93ms for the sum, 3.33ms and 9.5 MB for the seen array.",
    ],
  },

  edgeCases: [
    "N = 1 with an empty array — the missing value is 1, and both summaries handle it without a special case.",
    "The missing value is 1, the smallest in the range, so the array starts at 2.",
    "The missing value is N, the largest, which is the case the sorting approach must fall through to handle.",
    "N = 2 with a single-element array — the smallest input where the array is non-empty.",
    "An array already in ascending order, where the sorting approach does no useful work.",
    "An array in descending or random order, which changes nothing for the arithmetic approaches.",
    "N = 46,340 in 32-bit arithmetic — the last value where the sum formula is still reliable.",
    "N = 46,341 in 32-bit arithmetic — the first measured failure, caused by the intermediate product rather than the result.",
    "N between 46,341 and 65,535, where the formula is wrong even though its true answer fits in an int.",
    "N = 100,000 in 32-bit arithmetic, where the two overflows cancel and the wrong code returns the right answer.",
    "The LeetCode variant over 0..n, where the expected total becomes n(n+1)/2 over a range that includes zero.",
  ],

  pitfalls: [
    "Writing N * (N + 1) / 2 in int. The product overflows from N = 46,341, which is the same sqrt(INT_MAX) threshold that breaks i*i in Prime Check.",
    "Casting after the multiplication, as in (long long)(N * (N + 1) / 2). The overflow has already happened inside the parentheses.",
    "Widening the formula but leaving the accumulator as an int, so the running total of the array overflows instead.",
    "Testing the sum approach at one large N and concluding it is safe. Measured, 42% of N from 46,000 to 200,000 return the correct answer by accident.",
    "Assuming C++ signed overflow wraps. It is undefined behaviour, so the compiler may optimise on the assumption that it never occurs.",
    "Carrying the overflow warning into Python. Its integers are arbitrary precision, so the sum approach cannot fail there.",
    "Using the two-loop XOR and concluding XOR is slower. With the closed form it measured 0.62ms against the sum's 0.93ms.",
    "Getting the closed form wrong. It is [N, 1, N+1, 0] indexed by N % 4, verified for N = 0..20,000.",
    "Forgetting that the sorting approach must return N when every present element is in position.",
    "Allocating a seen array indexed by value when the range is huge but the array is small, since the memory scales with the range rather than the input.",
    "Applying either summary when more than one value is missing. Both produce a single number that is a combination of the absentees, not either of them.",
    "Assuming the array is exactly 1..N minus one value. If duplicates or out-of-range values are possible, both summaries silently return nonsense.",
  ],

  commonDoubts: [
    {
      question: "Why does the sum formula overflow at N = 46,341 rather than N = 65,536?",
      answer:
        "Because the expression multiplies before it divides. N(N+1)/2 first exceeds INT_MAX at N = 65,536, but N * (N + 1) — the intermediate product, roughly twice the result — exceeds it at N = 46,341. Verified: at N = 46,340 the product is 2,147,441,940 and fits; at N = 46,341 it is 2,147,534,622 and does not. So between 46,341 and 65,535 the formula is wrong even though its true answer would fit in an int with room to spare. That threshold is exactly sqrt(INT_MAX) = 46,340.95, the same constant that breaks i * i <= n in Prime Check.",
    },
    {
      question: "My sum solution gave the right answer on a huge input. Is it actually fine?",
      answer:
        "Almost certainly not — you were lucky, and this is the most dangerous property of the bug. Both the expected total and the actual total overflow, and because the answer is their difference, their wrap-around errors sometimes cancel exactly. Measured across every N from 46,000 to 200,000 with a known missing value: 88,907 wrong answers and 65,094 accidentally correct, so 42% of large inputs return the right result by accident. It is correct at N = 100,000 and wrong at N = 150,000. A passing test tells you nothing about the next input.",
    },
    {
      question: "How do I fix the sum approach properly?",
      answer:
        "Compute both totals in a 64-bit type, and make sure the width is right before the multiplication happens. In C++ that is (long long)N * (N + 1) / 2, not (long long)(N * (N + 1) / 2) — the second casts a value that has already overflowed. In Java it is (long) N * (N + 1) / 2. The accumulator matters just as much: summing into an int overflows well before the loop ends even when the formula is correct. With 64-bit totals the limit moves far beyond any N that could fit in an array.",
    },
    {
      question: "Why can XOR not overflow?",
      answer:
        "Because it does not accumulate. XOR is a bitwise operation that combines two values of the same width into a result of that same width — there is no carrying, no growth, and no magnitude that can exceed the type. The sum approach builds a running total that grows without bound; the XOR approach keeps a fixed-width register that only ever has its bits flipped. Verified across N = 46,000 to 200,000 with zero failures, and against every possible missing value for several N — 1,116 checks, zero failures.",
    },
    {
      question: "Why does XOR find the missing number at all?",
      answer:
        "Because XOR is its own inverse: x ^ x is 0, and x ^ 0 is x. Every value that is present appears exactly twice across the two passes — once when you XOR the range 1..N, and once when you XOR the array — so each of those pairs cancels to zero. The missing value appears only once, in the range, so nothing cancels it and it is what remains. The order does not matter, because XOR is commutative and associative.",
    },
    {
      question: "Isn't XOR slower, since it needs two loops?",
      answer:
        "The naive version does, and the closed form removes that. XOR of 1..N depends only on N mod 4: it is N when the remainder is 0, 1 when it is 1, N+1 when it is 2, and 0 when it is 3 — verified for N = 0 to 20,000 with zero mismatches. That collapses the first loop to a single expression, leaving one pass over the array, exactly like the sum. Measured at N = 10,000,000: closed-form XOR 0.62ms, sum with 64-bit totals 0.93ms, two-loop XOR 1.40ms. So XOR is not a trade of speed for safety — with the closed form it is both the safest and the fastest.",
    },
    {
      question: "Does the overflow problem exist in Python?",
      answer:
        "No, and this is the sharpest language difference in the module. Python integers are arbitrary precision, growing to whatever size the value needs, so the sum approach is correct at every N. Verified at N = 46,341, 65,536, 100,000, 150,000 and 1,000,000, where the expected total reaches 500,000,500,000 — all correct. The identical source line is a latent, input-dependent bug in C++ and Java and simply is not one in Python. So the advice to prefer XOR for overflow safety is essential in two of the three languages and irrelevant in the third, where you should choose on clarity.",
    },
    {
      question: "What if more than one number is missing?",
      answer:
        "Neither summary works unchanged, and both fail quietly. The sum returns the total of all the missing values combined, and the XOR returns their XOR — in each case a single number that is generally not equal to any of the absentees. Two missing values need two independent equations, such as a sum together with a sum of squares, or a XOR together with a bit-partition that separates the two candidates. That is the Find the Repeating and Missing Number subtopic, and it builds directly on this one.",
    },
    {
      question: "Which approach should I actually write?",
      answer:
        "XOR with the closed form, in C++ and Java. It is O(n) time and O(1) space, it cannot overflow at any N, it was the fastest measured at 0.62ms for ten million elements, and it needs no reasoning about integer widths at all. In Python either summary is safe, so prefer sum(arr) subtracted from N * (N + 1) // 2 for readability. Reach for the seen array only when the input may contain duplicates or values outside the range, where the arithmetic approaches stop being valid.",
    },
  ],

  relatedIds: ["integer-overflow-and-precision-errors", "find-the-repeating-and-missing-number", "find-the-number-that-appears-once-and-other-numbers-twice", "linear-search"],
};

export default content;
