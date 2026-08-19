import type { SubtopicContent } from "../types";

/**
 * Subtopic 11 of Arrays. The running-best skeleton from Largest Element,
 * extended to carry TWO values instead of one — and the direct ancestor of
 * Kadane's algorithm, which is the same shape with a different reset rule.
 *
 * It also lands the counterpart to the Move Zeros branch result. There the
 * data-dependent branch survived compilation and cost 5.5x depending on how the
 * input was arranged; here the compiler removes the branch entirely and the
 * arrangement costs nothing. The two subtopics together say what actually
 * decides which case you are in.
 *
 * SOURCES
 * - LeetCode 485, "Max Consecutive Ones" — the statement and its examples.
 * - GeeksforGeeks, "Maximum consecutive ones in a binary array".
 *
 * MEASURED ON THIS MACHINE (Apple M2, arm64, clang -O2, Python 3.13.4):
 *
 * 1. THE CLASSIC BUG FAILS 21.6% AND FAILS THE PROBLEM'S OWN FIRST EXAMPLE.
 *    Updating `best` only inside the else-branch — when a zero resets the run —
 *    never counts a streak that reaches the end of the array. Measured over
 *    200,000 random binary arrays: 43,128 wrong answers, 21.6%. On the
 *    statement's own [1,1,0,1,1,1] it returns 2 instead of 3; on [1,1,1] it
 *    returns 0; on [1] it returns 0.
 *
 * 2. THE ARRANGEMENT DOES NOT MATTER HERE, WHICH IS THE OPPOSITE OF MOVE ZEROS.
 *    n = 20,000,000, all with exactly 50% ones, only the layout differing:
 *      random 50/50        : 17.83ms
 *      blocked (half ones) : 17.69ms
 *      alternating 1,0,1,0 : 17.97ms
 *    A spread of under 2%, against the 5.5x that the same experiment produced
 *    in Move Zeros to End.
 *
 * 3. THE REASON, READ OFF THE COMPILED OUTPUT rather than guessed. The loop
 *    body clang emits for the branchy version contains NO data-dependent
 *    branch at all:
 *        ldr   w11, [x8], #4      ; load the element
 *        cmp   w10, w0            ; cur vs best
 *        csinc w12, w0, w10, lt
 *        cmp   w11, #1            ; is it a one?
 *        csel  w0, w12, w0, eq    ; best  = select, no jump
 *        csinc w10, wzr, w10, ne  ; cur   = (x==1) ? cur+1 : 0, no jump
 *        b.ne  LBB0_2             ; loop counter only
 *    csel and csinc are ARM64 conditional selects — x86 would use cmov. The
 *    only branch left is the loop-back edge, which is perfectly predictable.
 *    (Note it is NOT vectorised: clang reports "loop not vectorized: value that
 *    could not be identified as reduction". It is scalar and branchless.)
 *
 *    THE DISTINGUISHING PROPERTY, and the transferable lesson: a conditional
 *    that only chooses between VALUES can become a conditional move. A
 *    conditional that decides whether a STORE HAPPENS generally cannot, because
 *    the write must not occur on the untaken path. Move Zeros writes inside its
 *    branch; this one only computes. That is the whole difference.
 *
 * 4. HAND-WRITING THE BRANCHLESS FORM IS 34% SLOWER. cur = (cur + x) * x with
 *    an explicit max measured 23.87ms against the branchy 17.83ms, because it
 *    adds a multiply per element to remove a branch the compiler had already
 *    removed. Correct — 0 failures over 200,000 arrays — and pointless.
 *
 * 5. PYTHON BREAKS ITS OWN PATTERN HERE. In every previous subtopic the C-level
 *    builtin beat the interpreted loop. At n = 2,000,000 with 50% ones:
 *      manual loop       :  63.4ms   <- FASTEST
 *      str join + split  : 128.7ms
 *      itertools.groupby : 136.4ms
 *    The manual loop does two integer comparisons per element; groupby must
 *    build a group iterator per run and consume it, and the string route
 *    materialises a two-million-character string. Being "in C" is not enough
 *    when the C is doing more work.
 *
 * Scope: Kadane's algorithm is the same skeleton with a different reset rule and
 * is its own subtopic. The "flip at most k zeros" variants belong to sliding
 * window.
 */
const content: SubtopicContent = {
  id: "maximum-consecutive-ones",
  topic: "Arrays",
  title: "Maximum Consecutive Ones",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "largest-element",
    "move-zeros-to-end",
    "for-loop",
    "if-else-statements",
    "relational-and-logical-operators",
    "time-and-space-complexity-basics",
  ],

  summary:
    "Find the longest unbroken run of 1s by carrying a current streak and a best streak — where updating the best in the wrong place fails 21.6% of inputs including the problem's own example, and where the compiler deletes the branch that cost 5.5x one subtopic ago.",

  theory: `
## The problem

Given a binary array, return the length of the longest unbroken run of \`1\`s.

\`\`\`
[1, 1, 0, 1, 1, 1]  ->  3
[1, 0, 1, 1, 0, 1]  ->  2
[0, 0, 0]           ->  0
\`\`\`

## Two counters, and one rule each

Largest Element carried a single running value. This carries two, and keeping
their jobs separate is the whole algorithm:

- **\`cur\`** — the length of the run you are standing in *right now*.
- **\`best\`** — the longest run seen *anywhere so far*.

Walk the array once. On a \`1\`, the current run grows by one. On a \`0\`, the
current run is over, so \`cur\` resets to zero. And \`best\` takes the larger of
itself and \`cur\`.

That last sentence hides the only real decision in the problem, and it is where
most wrong answers come from.

## Where you update \`best\` decides whether the code is correct

It is tempting to update \`best\` when a run *ends* — that is, inside the branch
that handles a zero. It reads naturally: the run is finished, so record it.

It is wrong, and it is wrong in a specific way: **a run that reaches the end of
the array never ends**, so it is never recorded.

\`\`\`
[1, 1, 1]        -> that version returns 0
[1]              -> returns 0
[1, 1, 0, 1, 1, 1] -> returns 2, not 3
\`\`\`

That third one is the problem statement's own first example. Measured over
200,000 random binary arrays, updating only at the reset produced **43,128 wrong
answers — 21.6%**.

The fix is to update \`best\` **every time \`cur\` grows**, not when it resets. Then
the final run is recorded on the last element like any other, and no
after-the-loop patch-up is needed. (Updating after the loop as well as at each
reset also works — it is just two rules where one will do.)

## The invariant

*After processing element \`i\`, \`cur\` is the length of the run ending exactly at
\`i\`, and \`best\` is the longest run anywhere in \`0..i\`.*

Both halves are re-established on every element, so when the loop ends \`best\`
covers the whole array. Stating it this way makes the bug above obvious: if
\`best\` is only touched on zeros, the second half of the invariant is false
whenever the array ends in a one.

O(n) time, O(1) space, and you cannot do better — every element must be looked at,
since a single unseen element could extend or break the longest run.

## This is Kadane's algorithm in miniature

Carry a running quantity, reset it on a condition, keep the best ever seen.
Kadane's maximum-subarray algorithm is exactly this shape — the only differences
are that it carries a *sum* rather than a *count*, and it resets when the running
sum goes negative rather than when it hits a zero. Learning the skeleton here, on
a problem where you can trace it by hand, is why this subtopic exists.

## The branch that isn't there

Move Zeros to End ended with a striking result: three arrays of identical length,
identical density and identical write counts ran **5.5x apart** purely because of
how the data was arranged, since \`if (nums[i] != 0)\` was a coin flip the
processor could not predict.

The same experiment here gives the opposite answer. At n = 20,000,000, all with
exactly 50% ones:

| Arrangement | Time |
|---|---|
| Random 50/50 | 17.83ms |
| Blocked — half ones then half zeros | 17.69ms |
| Alternating 1, 0, 1, 0 | 17.97ms |

**Under 2% apart.** Arrangement does not matter at all.

The reason is visible in the compiled output. Here is the entire loop body clang
produces on this machine:

\`\`\`
ldr   w11, [x8], #4      ; load the element
cmp   w10, w0            ; cur vs best
csinc w12, w0, w10, lt
cmp   w11, #1            ; is it a one?
csel  w0, w12, w0, eq    ; best = select — no jump
csinc w10, wzr, w10, ne  ; cur  = (x==1) ? cur+1 : 0 — no jump
b.ne  LBB0_2             ; loop counter only
\`\`\`

\`csel\` and \`csinc\` are ARM64 **conditional selects** — they compute both
possibilities and pick one without branching (x86 does the same job with
\`cmov\`). **There is no data-dependent branch left to mispredict.** The only jump
is the loop-back edge, which is perfectly predictable regardless of the data.

### So when does a branch survive, and when does it vanish?

That is the transferable question, and the two subtopics together answer it:

**A conditional that only chooses between values can become a conditional move.**
Both sides are computed into registers, one is selected, nothing else observable
happens. That is this problem.

**A conditional that decides whether a store happens generally cannot.** The
write must not occur on the untaken path, so the processor has to actually know
which way it went. That is Move Zeros, whose branch guards \`nums[j] = nums[i]\`.

If you want to predict whether branch misprediction will hurt you, that is the
question to ask — not how random the data looks.

## Writing it branchless by hand makes it slower

Knowing the arithmetic trick, you might write the reset without a conditional at
all: \`cur = (cur + x) * x\`, which gives \`cur + 1\` when \`x\` is 1 and \`0\` when \`x\`
is 0.

It is correct — zero failures over 200,000 random arrays — and it measured
**23.87ms against the branchy version's 17.83ms, about 34% slower**. You added a
multiply per element to remove a branch the compiler had already removed.

The lesson is not that branchless tricks are bad. It is that they are a response
to a measurement, and this measurement says there is nothing to fix.

## Python breaks its own pattern here

Every previous subtopic in this module found the same thing: the C-level builtin
beats the hand-written loop, sometimes by 4x or 16x. At n = 2,000,000 with 50%
ones:

| Approach | Time |
|---|---|
| Manual loop | **63.4ms** |
| String join and split | 128.7ms |
| \`itertools.groupby\` | 136.4ms |

**The manual loop wins**, by more than 2x.

Being "in C" was never the whole story — the question is how much work the C is
doing. The manual loop performs two integer comparisons per element and nothing
else. \`groupby\` constructs a group iterator for every run and then consumes each
one to measure it. The string route materialises a two-million-character string
before it can split it.

So the heuristic from the earlier subtopics — reach for the builtin — is a good
default and not a law. This is the case where checking it pays.

## Where this goes next

The same two-counter skeleton, with a sum instead of a count, is **Kadane's
Algorithm**. Allowing up to \`k\` zeros inside the run turns this into a **sliding
window** problem, which is where the technique stops being a single scan.
`.trim(),

  intuition:
    "You are walking a fence looking for the longest unbroken stretch of planks. Count as you go; the moment you hit a gap, the count starts again from zero. The only thing you must remember to do is write down your best stretch as you walk it — not when it ends — because the longest stretch might run right to the end of the fence and never end at all.",

  approaches: [
    {
      name: "Brute Force - Check Every Starting Point",
      idea: "From each position, extend as far as the ones continue, and keep the longest extension found.",
      steps: [
        "Consider each index as a possible start of a run.",
        "From that start, walk forward while the elements are ones, counting them.",
        "Stop as soon as a zero is met or the array ends.",
        "Keep the longest count seen across all starting points.",
        "Return that longest count.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int findMaxConsecutiveOnes(const vector<int>& nums) {
    int best = 0;
    for (int i = 0; i < (int)nums.size(); i++) {
        int run = 0;
        for (int j = i; j < (int)nums.size() && nums[j] == 1; j++) run++;
        if (run > best) best = run;
    }
    return best;
}`,
          annotations: {
            7: "The inner walk re-counts ground the outer loop has already covered, which is the whole redundancy.",
            8: "Correct, and O(n^2) — an array of all ones makes the inner loop run its full length every time.",
          },
        },
        {
          language: "java",
          code: `static int findMaxConsecutiveOnes(int[] nums) {
    int best = 0;
    for (int i = 0; i < nums.length; i++) {
        int run = 0;
        for (int j = i; j < nums.length && nums[j] == 1; j++) run++;
        if (run > best) best = run;
    }
    return best;
}`,
          annotations: {
            5: "The && short-circuits on the first zero, so a sparse array is fast and a dense one is not.",
          },
        },
        {
          language: "python",
          code: `def find_max_consecutive_ones(nums):
    best = 0
    for i in range(len(nums)):
        run = 0
        j = i
        while j < len(nums) and nums[j] == 1:
            run += 1
            j += 1
        best = max(best, run)
    return best`,
          annotations: {
            6: "Two nested interpreted loops, which is the slowest possible shape in Python.",
          },
        },
      ],
      complexity: {
        time: "O(n^2)",
        space: "O(1)",
        note: "Worst case is an array of all ones, where every starting point walks to the end. It is worth writing once to see that the inner loop is re-deriving information the outer loop already had — which is exactly what the single pass removes.",
      },
    },
    {
      name: "Two Pass - Collect Run Lengths",
      idea: "Record the length of every run of ones, then take the largest.",
      steps: [
        "Walk the array once, tracking the length of the current run.",
        "Each time a run ends, append its length to a list.",
        "Append the final run after the walk, since it never meets a terminating zero.",
        "Return the maximum entry in the list, or zero if the list is empty.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

int findMaxConsecutiveOnes(const vector<int>& nums) {
    vector<int> runs;
    int cur = 0;

    for (int x : nums) {
        if (x == 1) cur++;
        else { if (cur > 0) runs.push_back(cur); cur = 0; }
    }
    if (cur > 0) runs.push_back(cur);      // the run that reaches the end

    return runs.empty() ? 0 : *max_element(runs.begin(), runs.end());
}`,
          annotations: {
            13: "This line is the two-pass version's answer to the same trap that breaks the buggy single pass.",
            15: "Storing every run only to take one maximum is the waste the optimal version removes.",
          },
        },
        {
          language: "java",
          code: `import java.util.ArrayList;
import java.util.List;
import java.util.Collections;

static int findMaxConsecutiveOnes(int[] nums) {
    List<Integer> runs = new ArrayList<>();
    int cur = 0;

    for (int x : nums) {
        if (x == 1) cur++;
        else { if (cur > 0) runs.add(cur); cur = 0; }
    }
    if (cur > 0) runs.add(cur);

    return runs.isEmpty() ? 0 : Collections.max(runs);
}`,
          annotations: {
            13: "Forgetting this line is the same bug as forgetting to update best on the last element.",
          },
        },
        {
          language: "python",
          code: `def find_max_consecutive_ones(nums):
    runs = []
    cur = 0

    for x in nums:
        if x == 1:
            cur += 1
        else:
            if cur: runs.append(cur)
            cur = 0
    if cur: runs.append(cur)        # the run that reaches the end

    return max(runs, default=0)`,
          annotations: {
            11: "The trailing run again. Every formulation of this problem has to handle it somewhere.",
            13: "default=0 covers an array with no ones at all, where runs is empty.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(k) for k runs, up to O(n/2)",
        note: "Optimal in time and it stores every run when only the largest is ever needed. Useful as a stepping stone, because it makes the trailing-run problem explicit before the single-pass version hides it.",
      },
    },
    {
      name: "Optimal - Single Pass, Two Counters",
      idea: "Carry the current run and the best run together, updating the best every time the current one grows.",
      steps: [
        "Set both the current run and the best run to zero.",
        "Visit each element once.",
        "If it is a one, increase the current run and compare it against the best immediately.",
        "If it is a zero, reset the current run to zero.",
        "Return the best, which has been kept correct after every element including the last.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int findMaxConsecutiveOnes(const vector<int>& nums) {
    int best = 0, cur = 0;

    for (int x : nums) {
        if (x == 1) {
            cur++;
            if (cur > best) best = cur;   // update HERE, not at the reset
        } else {
            cur = 0;
        }
    }
    return best;
}`,
          annotations: {
            5: "Both start at zero, which is also the correct answer for an array containing no ones.",
            10: "The decisive line. Moving it into the else-branch returns 0 for [1,1,1] and 2 for the statement's own [1,1,0,1,1,1].",
            12: "A zero ends the run and nothing else — best is already correct, so there is nothing to record here.",
          },
        },
        {
          language: "java",
          code: `static int findMaxConsecutiveOnes(int[] nums) {
    int best = 0, cur = 0;

    for (int x : nums) {
        if (x == 1) {
            cur++;
            if (cur > best) best = cur;
        } else {
            cur = 0;
        }
    }
    return best;
}`,
          annotations: {
            6: "The invariant: after this element, cur is the run ending here and best is the longest run so far.",
            7: "Because best is refreshed on every one, a run reaching the end of the array is recorded like any other.",
          },
        },
        {
          language: "python",
          code: `def find_max_consecutive_ones(nums):
    best = cur = 0

    for x in nums:
        if x == 1:
            cur += 1
            if cur > best:
                best = cur
        else:
            cur = 0

    return best


# Measured 63.4ms at n = 2,000,000 — FASTER than itertools.groupby at
# 136.4ms and the string-split trick at 128.7ms. The first subtopic in this
# module where the hand-written Python loop beats the library route.`,
          annotations: {
            7: "Written out rather than best = max(best, cur), which is slower in Python because it is a function call per element.",
            15: "The builtin is not automatically faster — it depends on how much work the builtin is doing.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "One pass, two integers, no allocation. Measured 17.83ms at n = 20,000,000 in C++ and 63.4ms at n = 2,000,000 in Python. The compiler emits it without a data-dependent branch, so the runtime does not depend on how the ones and zeros are arranged.",
      },
    },
    {
      name: "Branchless Variant",
      idea: "Replace the conditional reset with arithmetic that yields zero on a zero and one more on a one.",
      steps: [
        "Observe that multiplying by the element gives zero when the element is zero.",
        "Compute the current run as the previous run plus the element, all multiplied by the element.",
        "That yields the run plus one on a one, and zero on a zero, with no conditional.",
        "Select the larger of the current and best runs, which compilers emit as a conditional move.",
        "Measure before adopting it — on this machine the compiler already removed the branch.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int findMaxConsecutiveOnes(const vector<int>& nums) {
    int best = 0, cur = 0;

    for (int x : nums) {
        cur  = (cur + x) * x;            // x=1 -> cur+1 ; x=0 -> 0
        best = cur > best ? cur : best;  // compiles to a conditional select
    }
    return best;
}`,
          annotations: {
            8: "Correct for a strictly binary array — it relies on the values being exactly 0 and 1, unlike the branchy version.",
            9: "Measured 23.87ms against the branchy 17.83ms at n = 20,000,000 — 34% SLOWER.",
            11: "The multiply is real work added to remove a branch that clang had already turned into csel and csinc.",
          },
        },
        {
          language: "java",
          code: `static int findMaxConsecutiveOnes(int[] nums) {
    int best = 0, cur = 0;

    for (int x : nums) {
        cur  = (cur + x) * x;
        best = Math.max(best, cur);
    }
    return best;
}`,
          annotations: {
            5: "Depends on the array being strictly binary; a value of 2 would silently corrupt the running count.",
            6: "Math.max on ints is intrinsified by the JIT and does not branch.",
          },
        },
        {
          language: "python",
          code: `def find_max_consecutive_ones(nums):
    best = cur = 0
    for x in nums:
        cur = (cur + x) * x
        if cur > best:
            best = cur
    return best


# Pointless in Python: there is no branch predictor to please, and the
# multiply is simply extra interpreted work on every element.`,
          annotations: {
            4: "Every arithmetic operation here is a full interpreted step, so removing a branch buys nothing.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "Correct — 0 failures over 200,000 random arrays — and measured 34% slower than the plain conditional version, because clang already compiles that version to branchless csel and csinc instructions. It also quietly assumes the input is strictly 0 and 1, which the branchy version does not.",
      },
    },
    {
      name: "Library and Idiomatic Forms",
      idea: "Group the array into runs with a standard routine and take the longest run of ones.",
      steps: [
        "Group consecutive equal elements together.",
        "Keep only the groups whose value is one.",
        "Measure the length of each such group.",
        "Return the largest length, or zero when there are no groups of ones.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

int findMaxConsecutiveOnes(const vector<int>& nums) {
    int best = 0;
    auto it = nums.begin();

    while (it != nums.end()) {
        auto run = find(it, nums.end(), 0);      // the next zero ends the run
        best = max(best, (int)(run - it));
        it = (run == nums.end()) ? run : run + 1;
    }
    return best;
}`,
          annotations: {
            10: "find locates the next zero, so the distance to it is exactly the length of the current run of ones.",
            12: "Guarding against run == end() is what stops the iterator being advanced past the container.",
          },
        },
        {
          language: "java",
          code: `import java.util.Arrays;

// No grouping primitive for primitive arrays, so the idiomatic route is a
// string split — clear, and it allocates.
static int findMaxConsecutiveOnes(int[] nums) {
    StringBuilder sb = new StringBuilder();
    for (int x : nums) sb.append(x);

    int best = 0;
    for (String run : sb.toString().split("0")) best = Math.max(best, run.length());
    return best;
}`,
          annotations: {
            7: "Building a string of n characters to answer a question about n integers is a real cost, shown for completeness.",
            10: "Splitting on the zero character yields the runs of ones directly, including empty strings for adjacent zeros.",
          },
        },
        {
          language: "python",
          code: `from itertools import groupby

def find_max_consecutive_ones(nums):
    return max((sum(1 for _ in g) for k, g in groupby(nums) if k == 1), default=0)


# Measured 136.4ms at n = 2,000,000, against 63.4ms for the plain loop —
# groupby builds and consumes an iterator per run, which is more work than
# the two integer comparisons the loop performs.
#
# The string variant measured 128.7ms and materialises a 2,000,000-character
# string before it can split it:
#   max(map(len, "".join(map(str, nums)).split("0")), default=0)`,
          annotations: {
            4: "Reads beautifully and is the slowest correct option here — worth knowing before reaching for it by reflex.",
            7: "default=0 handles an array with no ones, where the generator yields nothing.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1) for the C++ form, O(n) for the Java and Python string routes",
        note: "Measured in Python at n = 2,000,000: groupby 136.4ms and the string split 128.7ms, against 63.4ms for the explicit loop. This is the subtopic where the library route loses, because both library forms do substantially more work per element than the loop does.",
      },
    },
  ],

  examples: [
    {
      input: "nums = [1, 1, 0, 1, 1, 1]",
      output: "3",
      walkthrough: [
        "Start with cur = 0 and best = 0.",
        "The first 1 makes cur = 1, and best rises to 1.",
        "The second 1 makes cur = 2, and best rises to 2.",
        "The 0 resets cur to 0, and best stays at 2.",
        "The next three 1s take cur to 1, then 2, then 3, with best rising to 3 on the last of them.",
        "The array ends while cur is 3, and best already holds 3 because it was updated as the run grew.",
        "A version updating best only at a reset would still hold 2 here, since this final run never meets a zero.",
      ],
      why: "The statement's own first example, and it is also the example that exposes the most common bug — the answer lives in a run that reaches the end of the array.",
    },
    {
      input: "nums = [1, 1, 1] and nums = [1]",
      output: "3 and 1",
      walkthrough: [
        "In both arrays there is no zero anywhere, so the reset branch never executes.",
        "cur grows on every element and best is refreshed alongside it.",
        "The correct version returns 3 and 1 respectively.",
        "A version that records the run only when a zero arrives never records anything at all here.",
        "That version returns 0 for both, which is the answer for an array of all zeros.",
        "Measured over 200,000 random binary arrays, that mistake produced 43,128 wrong answers — 21.6%.",
      ],
      why: "The smallest inputs that break the update-at-reset version completely, returning zero for an array that is entirely ones.",
    },
    {
      input: "nums = [0, 0, 0] and nums = []",
      output: "0 and 0",
      walkthrough: [
        "With all zeros, the first branch never runs and cur is reset on every element.",
        "best is never updated and finishes holding its initial value of 0.",
        "That is the correct answer: there is no run of ones to measure.",
        "With an empty array the loop body never executes at all.",
        "best again finishes at its initial 0, which is correct.",
        "Neither case needs a special guard, because initialising both counters to zero already encodes the right answer.",
      ],
      why: "Shows the initialisation is not arbitrary — starting both counters at zero is what makes the no-ones and empty cases fall out without any extra branch.",
    },
    {
      input: "20,000,000 elements at 50% ones, arranged three different ways",
      output: "17.83ms, 17.69ms and 17.97ms — under 2% apart",
      walkthrough: [
        "The three arrays are randomly interleaved, blocked into ones then zeros, and strictly alternating.",
        "All contain exactly ten million ones and ten million zeros.",
        "The same experiment in Move Zeros to End produced a 5.5x spread across these three layouts.",
        "Here the spread is under 2%, so the arrangement is irrelevant.",
        "The compiled loop explains it: clang emits csel and csinc, ARM64 conditional selects, with no data-dependent jump.",
        "The only branch remaining is the loop-back edge, which is perfectly predictable no matter how the data is shaped.",
      ],
      why: "The direct counterpart to the Move Zeros result, and together they identify what actually decides the outcome — whether the branch guards a store or merely selects a value.",
    },
  ],

  visualization: {
    kind: "array",
    description:
      "The array as a strip of cells, ones drawn solid and zeros drawn hollow so the runs are legible as shapes before any counter moves. A single marker advances left to right with two readouts pinned above it: CURRENT and BEST, each a numeric box. On a one, extend a coloured underline beneath the run being built, tick CURRENT up, and — the beat that matters — immediately flash BEST and raise it if CURRENT has overtaken it, so the update visibly happens while the run is still growing rather than after it finishes. On a zero, snap the underline away, drop CURRENT to zero with a distinct collapse, and leave BEST untouched and greyed for that frame to show it is not involved in the reset. Keep every completed run's underline faintly on screen so the reader can compare lengths at a glance, and mark the current champion run with a persistent bracket labelled with its length. The decisive panel runs the buggy variant beside the correct one on [1,1,0,1,1,1]: both tracks behave identically until the final run, where the correct track's BEST climbs to 3 as the run grows while the buggy track's BEST is frozen at 2 waiting for a zero that never comes — hold that frame at the end of the array with the buggy BEST still reading 2, and label it with the measured 21.6% failure rate. A second panel replays the branch question from Move Zeros: three strips of identical length and identical one-density, arranged randomly, blocked and alternating, each with a branch-prediction meter above it. Unlike the Move Zeros panel, all three meters stay green — and instead of a predictor, show the compiled instruction pair csel and csinc beside them, with the measured times 17.83, 17.69 and 17.97 milliseconds underneath, flat. Close with the contrast stated as two miniature code cards side by side: one whose conditional writes into the array, one whose conditional only computes a value, labelled cannot become a conditional move and can.",
    sampleInput:
      '{"primary":{"array":[1,1,0,1,1,1],"trace":[{"i":0,"value":1,"cur":1,"best":1,"bestUpdated":true},{"i":1,"value":1,"cur":2,"best":2,"bestUpdated":true},{"i":2,"value":0,"cur":0,"best":2,"reset":true},{"i":3,"value":1,"cur":1,"best":2,"bestUpdated":false},{"i":4,"value":1,"cur":2,"best":2,"bestUpdated":false},{"i":5,"value":1,"cur":3,"best":3,"bestUpdated":true,"note":"the run reaches the end and is still recorded"}],"answer":3,"runs":[2,3]},"bugPanel":{"array":[1,1,0,1,1,1],"correctBest":3,"buggyBest":2,"reason":"best is only written when a zero arrives, and the final run never meets one","otherFailures":[{"array":[1,1,1],"correct":3,"buggy":0},{"array":[1],"correct":1,"buggy":0}],"failureRate":0.216,"wrongAnswers":43128,"trials":200000},"emptyCases":{"allZeros":{"array":[0,0,0],"answer":0},"empty":{"array":[],"answer":0},"noGuardNeeded":true},"branchPanel":{"n":20000000,"onesPct":50,"variants":[{"arrangement":"random 50/50","ms":17.83},{"arrangement":"blocked","ms":17.69},{"arrangement":"alternating","ms":17.97}],"spreadPct":1.6,"moveZerosSpread":5.5,"instructions":["csel","csinc"],"dataDependentBranches":0,"vectorized":false},"handBranchless":{"ms":23.87,"vsBranchy":1.34,"failures":0,"verdict":"correct and 34% slower"},"python":{"n":2000000,"manualLoopMs":63.4,"strSplitMs":128.7,"groupbyMs":136.4,"winner":"manual loop"}}',
    highlights: [
      "The strip draws ones as solid cells and zeros as hollow ones, so the runs are visible as shapes before any counter moves.",
      "CURRENT and BEST sit above the marker as two separate readouts, making it clear they have different jobs.",
      "The first 1 extends an underline beneath the run, CURRENT ticks to 1, and BEST flashes and follows it up.",
      "The second 1 takes CURRENT to 2 and BEST rises with it, still while the run is growing.",
      "The 0 snaps the underline away and collapses CURRENT to zero, while BEST is greyed for that frame to show it takes no part in the reset.",
      "The next two 1s rebuild CURRENT to 2 without moving BEST, because 2 does not beat 2.",
      "The final 1 takes CURRENT to 3, BEST flashes and rises to 3, and the array ends immediately afterwards.",
      "That final update happened while the run was still growing, which is why a run reaching the end of the array is recorded at all.",
      "The bug panel runs the same input on a version that writes BEST only when a zero arrives.",
      "Both tracks agree until the last run, where the buggy BEST freezes at 2 waiting for a zero that never comes.",
      "The frame is held at the end of the array with the buggy answer still reading 2 against the correct 3.",
      "That panel carries the measured cost: 43,128 wrong answers across 200,000 random arrays, or 21.6%.",
      "The branch panel shows three strips of identical length and one-density, arranged randomly, blocked and alternating.",
      "Unlike the same panel in Move Zeros to End, all three prediction meters stay green throughout.",
      "The compiled instruction pair csel and csinc is shown beside them, with zero data-dependent branches in the loop.",
      "The measured times close it out — 17.83, 17.69 and 17.97 milliseconds — flat, against the 5.5x spread the same experiment produced one subtopic ago.",
    ],
  },

  edgeCases: [
    "Empty array — the loop never runs and both counters keep their initial zero, which is the correct answer.",
    "All zeros — the reset branch fires on every element and best is never written, correctly finishing at zero.",
    "All ones — the reset branch never fires, and the answer is the full length; this is where the update-at-reset bug returns zero.",
    "A single one — the smallest input the update-at-reset bug gets wrong, returning zero instead of one.",
    "A single zero — the answer is zero, reached without ever entering the counting branch.",
    "The longest run at the very end of the array — the case the correct update placement exists to handle.",
    "The longest run at the very start, such as [1,1,1,0,1] — best is set early and never beaten afterwards.",
    "Two runs of equal length — either may be considered the champion, since only the length is returned.",
    "Alternating ones and zeros — the answer is 1, and the current counter resets on every other element.",
    "A very long array where the arrangement of ones and zeros varies, which measured under 2% apart because the compiled loop contains no data-dependent branch.",
    "Non-binary input passed by mistake — the branchy version still counts non-zero values as ones, while the branchless multiply version silently produces nonsense.",
  ],

  pitfalls: [
    "Updating best only inside the else-branch, when a zero resets the run. Measured 43,128 wrong answers over 200,000 random arrays — 21.6% — and it returns 2 on the statement's own [1,1,0,1,1,1].",
    "Forgetting that a run reaching the end of the array never terminates, so any approach recording runs at their end needs an explicit step after the loop.",
    "Resetting best rather than cur when a zero is met, which discards every earlier run.",
    "Initialising best to the first element or to one, which breaks the all-zeros and empty cases that a zero initialisation handles for free.",
    "Writing best = max(best, cur) in Python inside the loop, which is a function call per element and measurably slower than an explicit comparison.",
    "Reaching for itertools.groupby by reflex. Measured 136.4ms against 63.4ms for the plain loop at n = 2,000,000 — the library route loses here.",
    "Adopting the branchless multiply trick without measuring. It measured 34% slower, because clang had already emitted csel and csinc for the conditional version.",
    "Assuming the branchless variant is a drop-in replacement. It requires the array to be strictly 0 and 1, where the branchy version merely requires ones to be recognisable.",
    "Carrying the Move Zeros conclusion here unchanged. Arrangement mattered 5.5x there and under 2% here, because that branch guards a store and this one only selects a value.",
    "Building a string from the array to use split. It allocates a character per element to answer a question two integers can answer.",
    "Using the two-pass run-collection version in production, which stores every run when only the maximum is ever read.",
    "Returning cur instead of best at the end, which reports the length of the final run rather than the longest one.",
  ],

  commonDoubts: [
    {
      question: "Why can't I update best when the run ends?",
      answer:
        "Because a run that reaches the end of the array never ends. If best is only written inside the branch that handles a zero, the final run is never recorded — so [1,1,1] returns 0 and [1] returns 0. It also gets the problem's own first example wrong: [1,1,0,1,1,1] returns 2 rather than 3, because the winning run is the one that runs off the end. Measured over 200,000 random binary arrays, that placement produced 43,128 wrong answers, 21.6%. Updating best every time cur grows fixes it without any after-the-loop patch.",
    },
    {
      question: "Do I need a special case for an empty array or an array of all zeros?",
      answer:
        "No, and that is a consequence of initialising both counters to zero rather than an accident. With an empty array the loop body never executes and best keeps its initial zero, which is the right answer. With all zeros the counting branch never runs, cur is reset repeatedly, and best is never written — again finishing at zero. If you initialise best to the first element or to one instead, both cases start returning wrong answers and you have to add guards to compensate.",
    },
    {
      question: "Why are two counters needed? Can't one do it?",
      answer:
        "They answer different questions. cur is the length of the run you are standing in right now, and it must be destroyed whenever a zero arrives. best is the longest run seen anywhere, and it must survive every reset. Merging them means either losing earlier runs when the current one resets, or never resetting and counting the total number of ones instead of the longest run. The invariant is worth holding onto: after each element, cur is the run ending here and best is the longest run so far.",
    },
    {
      question: "How is this related to Kadane's algorithm?",
      answer:
        "It is the same skeleton. Carry a running quantity, reset it when a condition is met, and keep the best value ever seen. Kadane's maximum-subarray algorithm carries a running sum rather than a running count, and resets when that sum drops below zero rather than when the element is a zero. Everything else — the two variables, the update-as-you-go rule, the single pass — is identical. Getting the update placement right here is what makes Kadane's straightforward later, because it is the same trap in a different costume.",
    },
    {
      question: "In Move Zeros the data arrangement changed the runtime 5.5x. Does that happen here?",
      answer:
        "No — measured, it does not. At n = 20,000,000 with exactly 50% ones in every case: randomly interleaved 17.83ms, blocked 17.69ms, alternating 17.97ms. That is under 2% apart. The reason shows up in the compiled output, which contains no data-dependent branch at all: clang emits csel and csinc, ARM64 conditional selects that compute both possibilities and pick one without jumping. With no branch to predict, there is nothing for the arrangement to affect. The only jump left is the loop-back edge, which is perfectly predictable.",
    },
    {
      question: "Then how do I know in advance whether a branch will hurt?",
      answer:
        "Ask what the branch controls. A conditional that only chooses between values — computing a number one way or another way — can be turned into a conditional move, and then the arrangement of the data stops mattering. A conditional that decides whether a store happens generally cannot, because the write must not occur on the path not taken, so the processor has to genuinely know which way it went. Move Zeros guards nums[j] = nums[i], which is a store, and it paid 5.5x. This one only computes cur and best in registers, and it paid nothing. That question predicts the outcome far better than how random the data looks.",
    },
    {
      question: "Should I write the branchless version with the multiply?",
      answer:
        "Measured, no. cur = (cur + x) * x is correct — zero failures over 200,000 random arrays — and it ran 23.87ms against the branchy version's 17.83ms, about 34% slower. You are adding a multiply per element to remove a branch the compiler had already removed. It also quietly requires the array to be strictly zeros and ones, where the conditional version only needs to recognise a one. Branchless rewriting is a response to a measurement, and here the measurement says there is nothing to fix.",
    },
    {
      question: "Why is itertools.groupby slower than my own loop? Everything else in this module said the opposite.",
      answer:
        "Because being implemented in C is not the same as doing less work. Measured at n = 2,000,000 with 50% ones: the plain loop 63.4ms, the string-split route 128.7ms, groupby 136.4ms. The loop performs two integer comparisons per element and nothing more. groupby constructs a group iterator for each run and then consumes it to measure its length, and the string route materialises a two-million-character string before it can split. In the earlier subtopics the builtin was doing strictly less work than the loop, so it won. Reaching for the builtin is a good default, not a law — this is the case where checking pays.",
    },
    {
      question: "What changes if the array isn't strictly zeros and ones?",
      answer:
        "The branchy version degrades gracefully and the branchless one does not. Written as if (x == 1) it counts only exact ones and treats everything else as a break, which is usually what you want. Written as if (x) it treats any non-zero as a one. The branchless form is the dangerous one: (cur + x) * x with a value of 2 multiplies the running count rather than incrementing it, producing a number that is neither a run length nor obviously wrong. If the input contract is not guaranteed, prefer the conditional version and state which reading of 'one' you chose.",
    },
  ],

  relatedIds: ["largest-element", "move-zeros-to-end", "kadanes-algorithm", "longest-subarray-with-given-sum-kpositives"],
};

export default content;
