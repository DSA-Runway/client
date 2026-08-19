import type { SubtopicContent } from "../types";

/**
 * Subtopic 6 of Arrays. The payoff for the previous subtopic: repeating a
 * one-step rotation K times is O(n*K), and the reversal trick that looked like
 * pointless ceremony at k = 1 becomes the answer.
 *
 * It is also the first place in the module where the textbook-optimal algorithm
 * is measurably the WORST choice, which is why the juggling algorithm is carried
 * here in full rather than mentioned.
 *
 * SOURCES
 * - GeeksforGeeks, "Array Rotation" and "Juggling Algorithm" — the temporary
 *   array, reversal, and gcd-based cyclic replacement approaches.
 * - LeetCode 189, "Rotate Array" — the same problem stated as a right rotation.
 *
 * MEASURED ON THIS MACHINE (clang -O2, Python 3.13.4):
 *
 * 1. CORRECTNESS. Reversal and juggling were checked against the definition
 *    B[i] = A[(i+k) % n] exhaustively for n = 1..12 and k = 0..3n (246 cases,
 *    0 failures), and all five approaches agreed over 100,000 random (n, k)
 *    pairs with k deliberately exceeding n. Zero disagreements.
 *
 * 2. WRITE COUNTS at n = 100,000, k = 37:
 *      rotate-by-one x k : 3,700,037 writes  (37.0n — scales with k)
 *      temp array of k   :   100,037 writes  (1.0n)
 *      reversal          :   299,997 writes  (3.0n)
 *      juggling          :   100,001 writes  (1.0n)  <- the fewest
 *
 * 3. AND THE WRITE COUNT IS BACKWARDS. Timing at n = 10,000,000, k = n/3:
 *      reversal   (3.0n writes) :  4.728ms   <- fastest
 *      temp array (1.0n writes) :  5.509ms
 *      std::rotate              : 32.211ms
 *      juggling   (1.0n writes) : 59.908ms   <- 12.7x the reversal
 *    The write-optimal algorithm is an order of magnitude slower than the one
 *    doing three times the writes.
 *
 * 4. JUGGLING NEVER WON, AT ANY k. Measured across k = 1, 16, 1024, 65536,
 *    1e6, n/3 and n/2 at n = 10,000,000, juggling ran between 2.5x and 24.8x
 *    slower than reversal — worst at k = 65536 (24.8x), best at k = n/2 (2.5x).
 *    The variation tracks gcd(n, k), which fixes the number of cycles and hence
 *    their length: gcd = 1 gives one cycle striding the whole array, while
 *    gcd = n/2 gives n/2 cycles of length 2.
 *    MECHANISM, from the compiler: clang reports std::reverse as "vectorized
 *    loop (vectorization width: 4, interleaved count: 2)", while the juggling
 *    walk draws "loop not vectorized". Its next index is computed from the
 *    current one, so the chain is serial and cannot be widened or prefetched —
 *    true even at k = 1, where the accesses are sequential and it still lost
 *    13.3x.
 *
 * 5. PYTHON AGREES, for its own reasons. n = 1,000,000, k = n/3:
 *      temp array (slices) :  9.785ms   <- fastest
 *      slicing a[k:]+a[:k] : 13.208ms
 *      reversal            : 19.585ms
 *      juggling            : 79.212ms   <- worst again, 8.1x
 *    Here the slice-based versions win because they run in C, while juggling is
 *    a pure interpreted pointer chase.
 *
 * 6. THE BRUTE FORCE IS CATASTROPHIC, not merely slow. At n = 100,000 with
 *    k = n/3, rotating by one k times took 1,725.632ms against 0.045ms for the
 *    reversal — roughly 38,000x. At n = 1,000 in Python it was 14.0ms against
 *    0.008ms, about 1,750x.
 *
 * Scope: right rotation is the mirror image and is derived rather than
 * re-taught. Rotating a matrix is its own subtopic.
 */
const content: SubtopicContent = {
  id: "left-rotate-array-by-k-places",
  topic: "Arrays",
  title: "Left Rotate Array by K Places",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "left-rotate-array-by-one",
    "gcd-euclidean-algorithm",
    "for-loop",
    "arithmetic-operators",
    "pass-by-value-vs-pass-by-reference",
    "time-and-space-complexity-basics",
  ],

  summary:
    "Rotate an array left by K positions in O(n) time and O(1) space using three reversals — and meet the juggling algorithm, which performs the provably fewest writes and measured up to 24.8x slower than the version doing three times as many.",

  theory: `
## The problem

Rotate an array left by \`k\` positions, in place, using O(1) extra memory.
Formally, produce \`B\` where \`B[i] = A[(i + k) % n]\`.

\`\`\`
[1, 2, 3, 4, 5, 6, 7],  k = 3   ->   [4, 5, 6, 7, 1, 2, 3]
\`\`\`

## Two things to settle before any algorithm

**\`k\` can exceed \`n\`.** Rotating a 7-element array by 10 is the same as rotating
it by 3, because every 7 steps returns it to where it started. So the very first
line of any solution is \`k = k % n\`. Skipping it does not merely give a wrong
answer — it indexes past the end of the array.

**\`k\` can be zero after that reduction**, which must be a no-op rather than an
error. \`k = 0\` and \`k = n\` are the same rotation, and the modulo turns the second
into the first.

**Left by \`k\` equals right by \`n - k\`.** The two directions are the same operation
seen from opposite ends, so any left-rotation routine solves right rotation by
substituting \`n - k\`. LeetCode states this problem as a right rotation; that
substitution is the whole difference.

## The naive approach, and why it collapses

The obvious move is to reuse the previous subtopic: rotate by one, \`k\` times.

It is correct and it is O(n·k), which is not a constant factor worse — it is a
different complexity class, and \`k\` can be as large as \`n - 1\`. Measured at
n = 100,000 with k = n/3, it took **1,725.632ms** against **0.045ms** for the
reversal. That is roughly **38,000x**, and it is the gap between an instant answer
and a timeout.

The write count says the same thing more precisely: at n = 100,000 and k = 37 it
performs **3,700,037** writes — 37n, because it re-shifts the entire array once per
step. Every other approach here performs between 1n and 3n.

## Using a temporary array

Save the first \`k\` elements. Shift the remaining \`n - k\` down to the front. Copy
the saved block onto the end.

That is O(n) time and **1.0n writes** — measured 100,037 — and it is genuinely
fast. It costs O(k) extra space, which fails the stated constraint but is worth
knowing because in Python it is the **fastest option available**, measured at
9.785ms against 19.585ms for the reversal.

## The reversal algorithm

Split the array conceptually into the block that is leaving the front, \`X = A[0..k-1]\`,
and the block that stays, \`Y = A[k..n-1]\`. The array is \`[X | Y]\` and the answer is
\`[Y | X]\`.

Now the trick. Reversing the whole of \`[Xʳ | Yʳ]\` gives \`[Y | X]\`, because reversing
a concatenation reverses the order of the parts *and* undoes the reversal inside
each one. So:

\`\`\`
reverse(arr, 0, k-1)      // [X | Y]    -> [Xʳ | Y]
reverse(arr, k, n-1)      //            -> [Xʳ | Yʳ]
reverse(arr, 0, n-1)      //            -> [Y  | X]
\`\`\`

Traced on \`[1,2,3,4,5,6,7]\` with \`k = 3\`: reversing the first three gives
\`[3,2,1,4,5,6,7]\`, reversing the rest gives \`[3,2,1,7,6,5,4]\`, and reversing
everything gives \`[4,5,6,7,1,2,3]\`.

O(n) time, O(1) space, three sequential passes. This is the answer, and the
measurements below say so for a reason that is not the one you would guess.

## The juggling algorithm

There is a way to do this with the theoretical minimum number of writes. Every
element must move, so at least \`n\` writes are needed, and the reversal spends 3n.
Juggling spends exactly \`n\`.

Instead of moving elements repeatedly, move each one **directly to its final
position**, following the chain: the element at \`i\` belongs at \`i - k\`, whose
occupant belongs at \`i - 2k\`, and so on. Stepping by \`k\` around the array
eventually returns to where it started, having formed a **cycle**.

The number of such cycles is exactly **gcd(n, k)** — the Euclidean algorithm from
Basics, appearing where nobody expects it. Verified: at n = 12 with k = 3 there
are 3 cycles; k = 4 gives 4; k = 5 gives 1; at n = 10 with k = 4 there are 2.
Every case matched \`gcd(n, k)\`.

So run the outer loop \`gcd(n, k)\` times, once per cycle, and walk each cycle
carrying a single held value. Measured **100,001** writes at n = 100,000 — one per
element, plus one held value per cycle. It is the write-count optimum.

## The measurement that overturns all of it

At n = 10,000,000 with k = n/3:

| Approach | Writes | Time |
|---|---|---|
| Reversal | 3.0n | **4.728ms** |
| Temporary array | 1.0n | 5.509ms |
| \`std::rotate\` | — | 32.211ms |
| Juggling | 1.0n | **59.908ms** |

**The write-optimal algorithm is 12.7x slower than the one doing three times the
writes.** And it is not a quirk of that particular \`k\` — measured across
k = 1, 16, 1024, 65536, 1,000,000, n/3 and n/2, juggling ran between **2.5x and
24.8x slower** than reversal and **never won once**.

The mechanism is not cache stride alone, which is the usual explanation, and the
compiler settles it. Clang reports \`std::reverse\` as *"vectorized loop
(vectorization width: 4, interleaved count: 2)"* — it moves several elements per
instruction. The juggling walk draws *"loop not vectorized"*, because its next
index is computed from the current one (\`j = (j + k) % n\`). That is a **serial
dependency**: the processor cannot compute the next address until the current
step finishes, so it cannot widen the loop, and it cannot prefetch ahead.

The giveaway is \`k = 1\`, where juggling's accesses are perfectly sequential — no
cache problem at all — and it still lost by **13.3x**. Sequential access is not
enough when the addresses arrive one at a time.

The spread across \`k\` is explained by \`gcd(n, k)\`, which fixes how many cycles
there are and therefore how long each one is. With gcd = 1 there is a single cycle
threading the entire array; with k = n/2 there are n/2 cycles of length 2, which
is nearly a plain pairwise swap and measured the closest to reversal at 2.5x.

## Python agrees, for different reasons

At n = 1,000,000 with k = n/3:

| Approach | Time |
|---|---|
| Temporary array via slices | **9.785ms** |
| Slicing \`a[k:] + a[:k]\` | 13.208ms |
| Reversal | 19.585ms |
| Juggling | **79.212ms** |

The ranking is different — slice operations win because they run as compiled C —
but the conclusion is identical: **juggling is last, by 8.1x**. In Python it is a
pure interpreted pointer chase, with none of its theoretical advantage surviving
contact with the interpreter.

## What to actually take from this

The juggling algorithm is not useless and it is not a trick question. It is the
right answer when writes are the expensive operation — flash memory with limited
write cycles, a data structure where each write triggers work, a network round
trip per element. It is genuinely optimal in the model where you count writes.

The lesson is that **the model has to match the machine**. On a modern CPU the
expensive operations are stalls, not writes, and an algorithm that moves three
times the data in a way the hardware can pipeline beats one that moves the
minimum in a way it cannot.

Write the reversal. Know the juggling algorithm exists, know it counts writes
optimally, and know that on this machine that was worth between 2.5x and 24.8x
in the wrong direction.

## Where this goes next

The same reversal idea rotates a matrix by 90 degrees — transpose, then reverse
each row — which is **Rotate Matrix by 90 Degrees**. The in-place, O(1)-space
discipline continues through **Move Zeros to End**.
`.trim(),

  intuition:
    "Rotating by k is not k separate rotations any more than moving house k streets over is k separate moves. Ask where each element finally belongs and put it there once. The reversal does that in three sweeping passes: flip the two blocks in place, then flip the whole thing, and the double flip cancels inside each block while swapping their order.",

  approaches: [
    {
      name: "Brute Force - Rotate by One, K Times",
      idea: "Apply the single-step left rotation from the previous subtopic k times in a row.",
      steps: [
        "Reduce k modulo n, since rotating by n returns the array to its starting arrangement.",
        "Repeat the following k times.",
        "Save the first element, shift every other element one position left, and place the saved value at the end.",
        "After k repetitions the array has rotated left by k positions.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

void rotateLeft(vector<int>& arr, int k) {
    int n = arr.size();
    if (n <= 1) return;
    k %= n;

    for (int r = 0; r < k; r++) {
        int temp = arr[0];
        for (int i = 0; i < n - 1; i++) arr[i] = arr[i + 1];
        arr[n - 1] = temp;
    }
}`,
          annotations: {
            7: "Without this, a k larger than n does needless full cycles — and k = n would loop n times to achieve nothing.",
            9: "The outer loop is what makes this O(n*k). Each pass re-shifts the entire array to advance one position.",
            11: "Measured 3,700,037 writes at n = 100,000 with k = 37 — 37n, against 1n for the temp array and 3n for the reversal.",
          },
        },
        {
          language: "java",
          code: `static void rotateLeft(int[] arr, int k) {
    int n = arr.length;
    if (n <= 1) return;
    k %= n;

    for (int r = 0; r < k; r++) {
        int temp = arr[0];
        for (int i = 0; i < n - 1; i++) arr[i] = arr[i + 1];
        arr[n - 1] = temp;
    }
}`,
          annotations: {
            6: "Correct, easy to write, and the wrong complexity class — O(n*k) rather than O(n).",
          },
        },
        {
          language: "python",
          code: `def rotate_left(arr, k):
    n = len(arr)
    if n <= 1:
        return
    k %= n

    for _ in range(k):
        temp = arr[0]
        for i in range(n - 1):
            arr[i] = arr[i + 1]
        arr[-1] = temp


# Measured 14.0ms at n = 1,000 with k = n/3, against 0.008ms for the
# temporary-array version — about 1,750x, at a thousand elements.`,
          annotations: {
            7: "Two nested interpreted loops, which is the slowest possible combination in Python.",
            14: "At n = 100,000 in C++ this took 1,725.632ms against 0.045ms for the reversal — roughly 38,000x.",
          },
        },
      ],
      complexity: {
        time: "O(n*k)",
        space: "O(1)",
        note: "A different complexity class rather than a worse constant, and k can be as large as n - 1. Measured 1,725.632ms at n = 100,000 with k = n/3, against 0.045ms for the reversal — roughly 38,000x.",
      },
    },
    {
      name: "Temporary Array of Size K",
      idea: "Save the first k elements, slide the rest to the front, then append the saved block.",
      steps: [
        "Reduce k modulo n and return immediately if the result is zero.",
        "Copy the first k elements into a temporary buffer.",
        "Shift the remaining n - k elements left by k positions.",
        "Copy the temporary buffer into the last k positions.",
        "Every element has been written exactly once.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

void rotateLeft(vector<int>& arr, int k) {
    int n = arr.size();
    if (n <= 1) return;
    k %= n;
    if (k == 0) return;

    vector<int> temp(arr.begin(), arr.begin() + k);
    for (int i = k; i < n; i++) arr[i - k] = arr[i];
    for (int i = 0; i < k; i++) arr[n - k + i] = temp[i];
}`,
          annotations: {
            10: "O(k) extra space — the whole reason this fails the stated constraint.",
            11: "A forward shift is safe here because the source index is always ahead of the destination.",
            12: "1.0n writes overall — measured 100,037 at n = 100,000, k = 37. Measured 5.509ms at ten million elements.",
          },
        },
        {
          language: "java",
          code: `static void rotateLeft(int[] arr, int k) {
    int n = arr.length;
    if (n <= 1) return;
    k %= n;
    if (k == 0) return;

    int[] temp = new int[k];
    System.arraycopy(arr, 0, temp, 0, k);
    System.arraycopy(arr, k, arr, 0, n - k);
    System.arraycopy(temp, 0, arr, n - k, k);
}`,
          annotations: {
            9: "arraycopy handles overlapping ranges correctly, behaving like memmove rather than memcpy.",
            10: "Three bulk copies, which is why this is fast in practice despite allocating.",
          },
        },
        {
          language: "python",
          code: `def rotate_left(arr, k):
    n = len(arr)
    if n <= 1:
        return
    k %= n
    if k == 0:
        return

    temp = arr[:k]
    arr[:n - k] = arr[k:]
    arr[n - k:] = temp


# The idiomatic one-liner, same idea:
def rotate_left_slice(arr, k):
    n = len(arr)
    if n:
        k %= n
        arr[:] = arr[k:] + arr[:k]`,
          annotations: {
            9: "Measured 9.785ms at n = 1,000,000 — the FASTEST option in Python, because every line is a C-level slice operation.",
            11: "Slice assignment mutates in place, so the caller sees the rotation.",
            18: "Measured 13.208ms — marginally slower than the three-slice version and considerably clearer.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(k)",
        note: "1.0n writes — measured 100,037 at n = 100,000, k = 37. Fails the O(1) space constraint, and is the fastest approach in Python at 9.785ms against 19.585ms for the reversal, because slicing runs as compiled C.",
      },
    },
    {
      name: "Optimal - Reversal Algorithm",
      idea: "Reverse the first k, reverse the rest, then reverse the whole array.",
      steps: [
        "Reduce k modulo n and return immediately if the result is zero.",
        "Reverse the block of the first k elements.",
        "Reverse the block of the remaining n - k elements.",
        "Reverse the entire array.",
        "The two blocks have swapped places and each has been un-reversed by the final pass.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

void rotateLeft(vector<int>& arr, int k) {
    int n = arr.size();
    if (n <= 1) return;
    k %= n;
    if (k == 0) return;

    reverse(arr.begin(), arr.begin() + k);   // [X|Y] -> [Xr|Y]
    reverse(arr.begin() + k, arr.end());     //       -> [Xr|Yr]
    reverse(arr.begin(), arr.end());         //       -> [Y|X]
}`,
          annotations: {
            8: "Essential. Without it, arr.begin() + k walks past the end whenever k exceeds n.",
            11: "Three sequential passes over memory, which is exactly what the hardware is best at.",
            13: "Measured 4.728ms at n = 10,000,000 — the FASTEST of every approach here, despite performing 3.0n writes.",
          },
        },
        {
          language: "java",
          code: `static void reverse(int[] a, int l, int r) {
    while (l < r) { int t = a[l]; a[l] = a[r]; a[r] = t; l++; r--; }
}

static void rotateLeft(int[] arr, int k) {
    int n = arr.length;
    if (n <= 1) return;
    k %= n;
    if (k == 0) return;

    reverse(arr, 0, k - 1);
    reverse(arr, k, n - 1);
    reverse(arr, 0, n - 1);
}`,
          annotations: {
            2: "Two indices walking towards each other, swapping as they go, stopping when they meet.",
            11: "At k = 0 this would be reverse(arr, 0, -1), where l < r is false immediately — harmless, but the guard above makes the intent explicit.",
          },
        },
        {
          language: "python",
          code: `def rotate_left(arr, k):
    n = len(arr)
    if n <= 1:
        return
    k %= n
    if k == 0:
        return

    arr[:k] = arr[:k][::-1]
    arr[k:] = arr[k:][::-1]
    arr[:] = arr[::-1]`,
          annotations: {
            9: "[::-1] builds a reversed copy of the slice, so this is not strictly O(1) space in Python.",
            11: "Measured 19.585ms at n = 1,000,000 — slower than the slice-based temp array, and still 4x faster than juggling.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "3.0n writes — measured 299,997 at n = 100,000, k = 37 — and the fastest approach measured, at 4.728ms for ten million elements. Three sequential vectorisable passes beat one minimal-write pass that cannot be pipelined.",
      },
    },
    {
      name: "Juggling Algorithm - Fewest Writes",
      idea: "Move every element straight to its final position by walking the gcd(n, k) cycles formed by stepping through the array k at a time.",
      steps: [
        "Reduce k modulo n and return immediately if the result is zero.",
        "Compute g as the greatest common divisor of n and k, which is exactly the number of cycles.",
        "For each starting index from 0 to g - 1, hold that element in a temporary variable.",
        "Walk forward by k positions repeatedly, copying each visited element back into the previous position.",
        "Stop when the walk returns to the starting index, and write the held value there.",
        "Every element has been written exactly once, plus one held value per cycle.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

static int gcd(int a, int b) {
    while (b) { int t = a % b; a = b; b = t; }
    return a;
}

void rotateLeft(vector<int>& arr, int k) {
    int n = arr.size();
    if (n <= 1) return;
    k %= n;
    if (k == 0) return;

    int cycles = gcd(n, k);              // verified: exactly gcd(n,k) cycles
    for (int i = 0; i < cycles; i++) {
        int held = arr[i];
        int j = i;
        while (true) {
            int next = (j + k) % n;
            if (next == i) break;
            arr[j] = arr[next];
            j = next;
        }
        arr[j] = held;
    }
}`,
          annotations: {
            4: "The Euclidean algorithm from Basics, needed here to count the cycles.",
            16: "Verified empirically: n=12,k=3 gives 3 cycles; n=12,k=4 gives 4; n=12,k=5 gives 1; n=10,k=4 gives 2.",
            21: "This is the serial dependency — the next index is computed from the current one, so the chain cannot be widened or prefetched.",
            23: "1.0n writes, the provable minimum, and measured 59.908ms at ten million elements against 4.728ms for the reversal.",
          },
        },
        {
          language: "java",
          code: `static int gcd(int a, int b) {
    while (b != 0) { int t = a % b; a = b; b = t; }
    return a;
}

static void rotateLeft(int[] arr, int k) {
    int n = arr.length;
    if (n <= 1) return;
    k %= n;
    if (k == 0) return;

    int cycles = gcd(n, k);
    for (int i = 0; i < cycles; i++) {
        int held = arr[i], j = i;
        while (true) {
            int next = (j + k) % n;
            if (next == i) break;
            arr[j] = arr[next];
            j = next;
        }
        arr[j] = held;
    }
}`,
          annotations: {
            12: "Without the gcd the outer loop would either miss elements or revisit them, since a single walk need not cover the array.",
          },
        },
        {
          language: "python",
          code: `from math import gcd

def rotate_left(arr, k):
    n = len(arr)
    if n <= 1:
        return
    k %= n
    if k == 0:
        return

    for i in range(gcd(n, k)):
        held = arr[i]
        j = i
        while True:
            nxt = (j + k) % n
            if nxt == i:
                break
            arr[j] = arr[nxt]
            j = nxt
        arr[j] = held


# Measured 79.212ms at n = 1,000,000 — the SLOWEST option in Python,
# 8.1x the slice-based temporary array at 9.785ms.`,
          annotations: {
            11: "math.gcd is built in, so the cycle count costs nothing to obtain.",
            14: "A pure interpreted pointer chase — none of the write-count advantage survives the interpreter.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "The write-count optimum at 1.0n — measured 100,001 at n = 100,000 — and the slowest approach measured, at 59.908ms for ten million elements, 12.7x the reversal. Across k = 1, 16, 1024, 65536, 1e6, n/3 and n/2 it ran 2.5x to 24.8x slower than the reversal and never once won.",
      },
    },
    {
      name: "Library Call",
      idea: "Use the standard rotate routine, which already implements one of these strategies.",
      steps: [
        "Reduce k modulo n so the middle iterator stays inside the array.",
        "In C++, call rotate with the element that should become first as the middle argument.",
        "In Python, use slicing for a list, or a deque when rotation is a repeated operation.",
        "In Java, Collections.rotate works on a List and takes a negative distance to rotate left.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

void rotateLeft(vector<int>& arr, int k) {
    int n = arr.size();
    if (n <= 1) return;
    k %= n;
    rotate(arr.begin(), arr.begin() + k, arr.end());
}`,
          annotations: {
            9: "The middle argument becomes the new first element, so this is a LEFT rotation by k.",
            10: "Measured 32.211ms at n = 10,000,000 with k = n/3 — slower than a hand-written reversal at 4.728ms, which suggests libc++ uses a cycle-based strategy here.",
          },
        },
        {
          language: "java",
          code: `import java.util.Collections;
import java.util.List;

// Works on a List, not on a primitive int[]. Negative distance rotates left.
static void rotateLeft(List<Integer> list, int k) {
    int n = list.size();
    if (n <= 1) return;
    Collections.rotate(list, -(k % n));
}`,
          annotations: {
            8: "Negative for left, positive for right. Boxing an int[] into a List purely to use this would cost more than the rotation.",
          },
        },
        {
          language: "python",
          code: `from collections import deque

def rotate_left(arr, k):
    n = len(arr)
    if n:
        k %= n
        arr[:] = arr[k:] + arr[:k]     # 13.208ms at n = 1,000,000


# When rotation happens repeatedly, hold the data in a deque instead:
d = deque([1, 2, 3, 4, 5, 6, 7])
d.rotate(-3)                            # negative rotates LEFT -> [4,5,6,7,1,2,3]`,
          annotations: {
            7: "Two slices and a concatenation, all in C. Clearer than the reversal and faster than it in Python.",
            12: "deque.rotate moves block pointers rather than elements, so repeated rotations are far cheaper than on a list.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1) for std::rotate, O(n) for the Python slicing form",
        note: "std::rotate measured 32.211ms at n = 10,000,000 with k = n/3, against 4.728ms for a hand-written triple reversal — one of the few places in this module where the library call is substantially slower than writing it out.",
      },
    },
  ],

  examples: [
    {
      input: "arr = [1, 2, 3, 4, 5, 6, 7], k = 3",
      output: "[4, 5, 6, 7, 1, 2, 3]",
      walkthrough: [
        "Reduce k modulo n: 3 % 7 is 3, so nothing changes.",
        "Reverse the first three elements, turning [1,2,3,4,5,6,7] into [3,2,1,4,5,6,7].",
        "Reverse the remaining four, giving [3,2,1,7,6,5,4].",
        "Reverse the whole array, giving [4,5,6,7,1,2,3].",
        "The block [1,2,3] has moved to the end and [4,5,6,7] to the front, each in its original order.",
        "Checked against the definition: B[0] should be A[(0+3) % 7] = A[3] = 4, which matches.",
      ],
      why: "The standard trace, and the one that makes the double reversal click — each block is reversed once by its own pass and once by the final pass, so it ends up in its original order but in the other position.",
    },
    {
      input: "arr = [1, 2, 3, 4, 5, 6, 7], k = 10",
      output: "[4, 5, 6, 7, 1, 2, 3] — identical to k = 3",
      walkthrough: [
        "The array has 7 elements, so rotating by 7 returns it exactly to its starting arrangement.",
        "Rotating by 10 is therefore rotating by 7 and then by 3 more.",
        "Reducing k modulo n gives 10 % 7 = 3, and the rotation proceeds as before.",
        "Without that reduction, arr.begin() + 10 points four positions past the end of a 7-element array.",
        "In C++ that is undefined behaviour and will often not crash; in Java and Python it raises.",
        "This is why k %= n is the first line of every approach here rather than a special case.",
      ],
      why: "The case that turns a missing modulo from a wrong answer into a memory error, and it is trivial to omit because most test data uses a k smaller than n.",
    },
    {
      input: "arr = [1, 2, 3, ..., 12], k = 3, solved by juggling",
      output: "3 cycles, one per gcd(12, 3)",
      walkthrough: [
        "Compute gcd(12, 3), which is 3, so there are exactly three cycles.",
        "The first cycle starts at index 0 and steps by 3: it visits 0, 3, 6, 9 and then returns to 0.",
        "The second starts at index 1 and visits 1, 4, 7, 10 before returning.",
        "The third starts at index 2 and visits 2, 5, 8, 11 before returning.",
        "Together the three cycles cover all twelve indices exactly once, which is why the outer loop runs gcd times and no more.",
        "Verified empirically across several pairs: n=12 k=4 gives 4 cycles, n=12 k=5 gives 1, n=10 k=4 gives 2 — every count matched gcd(n, k).",
      ],
      why: "Makes the gcd concrete rather than magical, and shows why a single walk is not enough — starting only at index 0 with k = 3 would touch just a quarter of the array.",
    },
    {
      input: "n = 10,000,000 with k varied, comparing juggling against reversal",
      output: "Juggling loses at every k, by between 2.5x and 24.8x",
      walkthrough: [
        "At k = 1 the juggling walk visits consecutive indices, so there is no cache-stride penalty at all, and it still measured 13.3x slower.",
        "At k = 65536 it measured its worst result, 24.8x slower than the reversal.",
        "At k = n/2 the cycles are only two elements long, making it nearly a pairwise swap, and it measured its best result at 2.5x slower.",
        "The variation tracks gcd(n, k), which fixes the number of cycles and therefore how long each one is.",
        "The reason it never wins is visible in the compiler output: clang reports std::reverse as vectorized at width 4 with interleave 2, and the juggling walk as not vectorized.",
        "Its next index is computed from the current one, so the address chain is serial and the processor can neither widen the loop nor prefetch ahead of it.",
      ],
      why: "The k = 1 result is the decisive one, because it removes the cache-stride explanation entirely and leaves the serial dependency as the only cause.",
    },
  ],

  visualization: {
    kind: "array",
    description:
      "The array drawn as a strip split into two visibly distinct blocks — the first k cells as block X in one colour, the remaining n-k as block Y in another — so that the goal can be stated as a picture before any algorithm runs: [X|Y] must become [Y|X]. The reversal panel then performs its three passes with paired arrows walking inward from both ends of the active range, swapping as they meet, and the block colours travel with the cells so the structure is never lost. After pass one, X reads backwards but is still recognisably X; after pass two both blocks are backwards; after the third pass the whole strip flips and both blocks land in their original internal order but with their positions exchanged. Draw that final pass as the moment the two reversals cancel, because that cancellation is the entire trick. A modulo panel sits above with a k dial: as k is dragged past n the dial wraps visibly to k mod n and the strip does not change, making the point that rotating by n is the identity, with an out-of-bounds marker flashing red past the end of the strip when the reduction is switched off. The juggling panel replays the same array with gcd(n,k) cycle rings drawn over the strip as coloured arcs, one ring per cycle, so that at n=12 k=3 exactly three arcs appear and together cover every index once; a marker walks one ring at a time carrying a held value, and each element drops directly into its final home. Run a live write counter under both panels: juggling finishes at 1.0n and reversal at 3.0n, so juggling visibly wins the count. Then reveal the timing bar underneath, where the ordering is reversed — reversal 4.728ms against juggling 59.908ms at ten million elements — and annotate the two loops with the compiler's own verdicts, vectorized width 4 for the reversal and not vectorized for the juggling walk. The brute-force panel is deliberately punishing: it replays a full n-element shift once per unit of k, with a counter climbing to 37n at k=37, so the O(n*k) cost is felt as repetition rather than read as a formula.",
    sampleInput:
      '{"primary":{"array":[1,2,3,4,5,6,7],"k":3,"blocks":{"X":[1,2,3],"Y":[4,5,6,7]},"reversalPasses":[{"pass":1,"range":[0,2],"result":[3,2,1,4,5,6,7],"note":"X reversed"},{"pass":2,"range":[3,6],"result":[3,2,1,7,6,5,4],"note":"Y reversed"},{"pass":3,"range":[0,6],"result":[4,5,6,7,1,2,3],"note":"both reversals cancel, blocks swap"}],"answer":[4,5,6,7,1,2,3],"check":{"index":0,"formula":"A[(0+3)%7]","value":4}},"moduloPanel":{"n":7,"kValues":[3,10,17],"reducedTo":3,"identicalResults":true,"withoutModulo":{"k":10,"pointerOffset":10,"outOfBoundsBy":3}},"jugglingPanel":{"n":12,"k":3,"cycles":3,"gcd":3,"rings":[[0,3,6,9],[1,4,7,10],[2,5,8,11]],"coversAllIndicesOnce":true},"writeCounts":{"n":100000,"k":37,"byOneTimesK":3700037,"tempK":100037,"reversal":299997,"juggling":100001},"timing":{"n":10000000,"k":"n/3","reversalMs":4.728,"tempKMs":5.509,"stdRotateMs":32.211,"jugglingMs":59.908,"jugglingSlowdown":12.7},"jugglingAcrossK":[{"k":1,"slowdown":13.3,"gcd":1,"cycleLength":10000000,"note":"sequential access and still loses"},{"k":16,"slowdown":14.5},{"k":1024,"slowdown":21.8},{"k":65536,"slowdown":24.8,"note":"worst"},{"k":1000000,"slowdown":3.8},{"k":5000000,"slowdown":2.5,"note":"best, cycles of length 2"}],"compilerVerdict":{"reverse":"vectorized loop (vectorization width: 4, interleaved count: 2)","juggling":"loop not vectorized"}}',
    highlights: [
      "The strip is drawn as two coloured blocks, X holding the first k cells and Y the rest, with the goal stated as [X|Y] becoming [Y|X] before any algorithm runs.",
      "Pass one walks paired arrows inward across the first three cells, leaving [3,2,1,4,5,6,7] with X backwards but still recognisably X.",
      "Pass two does the same across the remaining four, leaving [3,2,1,7,6,5,4] with both blocks reversed.",
      "Pass three flips the entire strip, and the two reversals cancel inside each block while their positions exchange, giving [4,5,6,7,1,2,3].",
      "That cancellation is highlighted as the whole trick: each block is reversed exactly twice, so it returns to its original order in a new place.",
      "The result is checked against the definition — B[0] should be A[(0+3) % 7], which is 4.",
      "The modulo dial is dragged from k = 3 to k = 10 to k = 17, wrapping each time, and the strip never changes.",
      "Switching the reduction off sends the block pointer three cells past the end of the strip, flashing red as an out-of-bounds access.",
      "The juggling panel overlays three coloured rings on a twelve-cell strip for k = 3, matching gcd(12, 3).",
      "A marker walks one ring at a time carrying a held value, and every element drops straight into its final home.",
      "The three rings together cover all twelve indices exactly once, which is why the outer loop runs gcd times and no more.",
      "The write counters settle with juggling at 1.0n and reversal at 3.0n, so juggling clearly wins on writes.",
      "The timing bar then reverses that ordering entirely: 4.728ms for the reversal against 59.908ms for juggling at ten million elements.",
      "The compiler's own verdicts are pinned to each loop — vectorized at width 4 with interleave 2 for the reversal, not vectorized for the juggling walk.",
      "The k = 1 case is singled out, where juggling's accesses are perfectly sequential and it still loses by 13.3x, ruling out cache stride as the sole cause.",
      "The brute-force panel replays a full n-element shift once per unit of k, its counter climbing to 37n, so the O(n*k) cost is felt as repetition rather than read as a formula.",
    ],
  },

  edgeCases: [
    "k equal to zero — a no-op, and the reduction must not turn it into an error or an unnecessary pass.",
    "k equal to n — the identity rotation, which the modulo reduces to zero.",
    "k greater than n — the case that turns a missing modulo from a wrong answer into an out-of-bounds access.",
    "k a multiple of n, such as 3n — reduces to zero and must leave the array untouched.",
    "Empty array — the modulo would divide by zero, so the length guard must come before the reduction.",
    "Single-element array — every rotation is the identity, and n <= 1 covers it before any arithmetic.",
    "k equal to 1 — the previous subtopic's problem, and the case where juggling's access pattern is sequential yet still measured 13.3x slower.",
    "k equal to n - 1 — equivalent to a right rotation by one, and the largest meaningful k.",
    "n and k coprime, such as n = 7 with k = 3 — gcd is 1, so juggling forms a single cycle covering the whole array.",
    "n and k sharing a large factor, such as n = 12 with k = 4 — gcd is 4, so four short cycles cover the array.",
    "Very large arrays where the brute force is not merely slow but unusable, measured 1,725.632ms at n = 100,000 against 0.045ms.",
  ],

  pitfalls: [
    "Omitting k %= n. With k greater than n this indexes past the end — undefined behaviour in C++, an exception in Java and Python.",
    "Reducing k before checking the array length, so an empty array performs a modulo by zero.",
    "Reusing the rotate-by-one routine k times. Correct, and O(n*k) rather than O(n) — measured roughly 38,000x slower at n = 100,000.",
    "Reversing the wrong boundaries, typically reverse(0, k) rather than reverse(0, k - 1), which rotates by one position too many.",
    "Confusing left with right. Left by k is right by n - k, and LeetCode 189 states this problem as a right rotation.",
    "Starting the juggling walk only at index 0. Unless gcd(n, k) is 1, a single cycle covers only part of the array and the rest is never moved.",
    "Assuming the juggling algorithm is faster because it performs the fewest writes. Measured 2.5x to 24.8x slower than the reversal across every k tested, and never once faster.",
    "Explaining juggling's slowness as cache stride alone. At k = 1 its access pattern is sequential and it still lost by 13.3x, because the real cause is the serial dependency between successive indices.",
    "Reaching for std::rotate expecting it to be fastest. Measured 32.211ms against 4.728ms for a hand-written triple reversal at ten million elements.",
    "Writing arr = arr[k:] + arr[:k] in Python, which rebinds the local name and leaves the caller's list unrotated.",
    "Using the reversal in Python and assuming it is O(1) space. Each [::-1] builds a reversed copy of its slice.",
    "Taking the wrong lesson from the juggling measurements. It is genuinely optimal when writes are the expensive operation; it is the machine model, not the algorithm, that is wrong here.",
  ],

  commonDoubts: [
    {
      question: "Why do we need k %= n at all?",
      answer:
        "Because rotating by n returns the array to exactly where it started, so any k beyond n is doing redundant full turns. On [1..7], k = 10 gives the same answer as k = 3. It is not only an efficiency point: without the reduction, arr.begin() + 10 on a seven-element array points four positions past the end. In C++ that is undefined behaviour and often does not crash, while Java and Python raise. Reduce first, then guard against the reduced k being zero.",
    },
    {
      question: "Why does reversing three times rotate the array?",
      answer:
        "Think of the array as two blocks: X is the first k elements and Y is the rest, so the array is [X|Y] and the answer is [Y|X]. Reversing X in place gives [Xr|Y], and reversing Y gives [Xr|Yr]. Now reverse the whole thing. Reversing a concatenation both swaps the order of the parts and undoes the reversal within each, so [Xr|Yr] becomes [Y|X] — which is exactly the rotation. Each block is reversed twice in total, once by its own pass and once by the final pass, so it ends in its original order in the other position.",
    },
    {
      question: "Why can't I just rotate by one, k times?",
      answer:
        "You can, and it is correct. It is also O(n*k), which is a different complexity class rather than a worse constant, and k can be as large as n - 1. Measured at n = 100,000 with k = n/3, it took 1,725.632ms against 0.045ms for the reversal — roughly 38,000x, the difference between an instant answer and a timeout. The write count says the same thing: 3,700,037 writes at n = 100,000 with k = 37, which is 37n, against 3n for the reversal.",
    },
    {
      question: "Why does the juggling algorithm need the gcd?",
      answer:
        "Because stepping through the array k positions at a time does not necessarily reach every index. Starting at 0 with n = 12 and k = 3 visits 0, 3, 6, 9 and then returns to 0, having touched only a quarter of the array. The number of separate cycles is exactly gcd(n, k), so the outer loop runs that many times, starting one cycle at each of the indices 0 through g-1. Verified: n=12 k=3 gives 3 cycles, k=4 gives 4, k=5 gives 1, and n=10 k=4 gives 2 — every count matched gcd(n, k). This is the Euclidean algorithm from Basics turning up somewhere genuinely unexpected.",
    },
    {
      question: "The juggling algorithm does the fewest writes. Isn't it the most optimal?",
      answer:
        "It is optimal in writes and it was the slowest thing measured. At n = 10,000,000 with k = n/3 it took 59.908ms against 4.728ms for the reversal — 12.7x slower while performing a third of the writes. Nor was that k unlucky: across k = 1, 16, 1024, 65536, 1,000,000, n/3 and n/2 it ran between 2.5x and 24.8x slower and never won once. Fewest operations and fastest are different questions on real hardware.",
    },
    {
      question: "Is juggling slow because of cache misses from the large stride?",
      answer:
        "That is the usual explanation and the measurements do not support it as the main cause. At k = 1 the juggling walk visits consecutive indices, so there is no stride problem at all — and it still measured 13.3x slower than the reversal. The compiler gives the real reason: clang reports std::reverse as vectorized at width 4 with interleave 2, and the juggling loop as not vectorized. Each index is computed from the previous one, so the address chain is serial, and the processor can neither process several elements per instruction nor prefetch ahead of a chain it cannot predict. Cache stride does modulate the result across different k, but it is not what causes the loss.",
    },
    {
      question: "Then is the juggling algorithm just useless?",
      answer:
        "No, and it is worth being precise about why. It is genuinely optimal in a model where writes are the expensive operation — flash memory with limited write endurance, a structure where each write triggers extra work, or a setting where each element write costs a network round trip. In those models it wins outright. The lesson is that the cost model has to match the machine you are on. On a modern CPU the expensive thing is a stall, not a write, so an algorithm that moves three times the data in a pipelinable way beats one that moves the minimum in a way that cannot be pipelined.",
    },
    {
      question: "Which approach should I actually write?",
      answer:
        "The reversal, in C++ and Java. It is O(n) time, O(1) space, satisfies every stated constraint, and measured fastest at 4.728ms for ten million elements. In Python, write arr[:] = arr[k:] + arr[:k] instead — measured 13.208ms against 19.585ms for the reversal, and far clearer — unless the O(1) space constraint is being enforced, in which case the reversal is the answer there too. Reach for std::rotate only for clarity, not speed: it measured 32.211ms against the hand-written reversal's 4.728ms.",
    },
    {
      question: "How do I rotate right by k instead?",
      answer:
        "Rotate left by n - k. The two are the same operation viewed from opposite ends, so no new algorithm is needed — reduce k modulo n first, then substitute. With the reversal you can also do it directly by swapping which block you reverse first: reverse the whole array, then reverse the first k, then reverse the rest. LeetCode 189 poses this problem as a right rotation, so the substitution is the only difference between the two statements.",
    },
  ],

  relatedIds: ["left-rotate-array-by-one", "check-if-array-is-sorted-and-rotated", "move-zeros-to-end", "rotate-matrix-by-90-degrees"],
};

export default content;
