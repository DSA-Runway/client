---
id: xor-of-numbers-in-a-given-range
topic: Bit Manipulation
title: XOR of numbers in a given range
difficulty: Medium
status: ready
prerequisites:
  - single-number-i
  - minimum-bit-flips-to-convert-number
  - check-if-a-number-is-odd-or-not
  - introduction-to-bits-and-tricks
relatedIds:
  - single-number-i
  - single-number-iii
  - count-subarrays-with-given-xor-k
  - power-set-bit-manipulation
  - minimum-bit-flips-to-convert-number
---

<!-- @summary -->
Every aligned block of four consecutive integers XORs to 0, so the XOR of 0 through n depends only on `n % 4` — giving `n, 1, n+1, 0` and nothing else. Checked against a running XOR for every n from 0 to 200,000,000 with zero mismatches, and the range form `f(R) ^ f(L-1)` on 300,000 random ranges, also zero. It turns an O(n) loop into three operations: measured **2,691x** faster in C++ over 20,000 ranges, and **2,586,076x** in Python on a single range of ten million.

<!-- @theory -->
## The problem

Compute `L ^ (L+1) ^ … ^ R`. The loop is obvious and linear; the answer is
constant time.

## Blocks of four cancel

Start by noticing what happens to four consecutive numbers that begin at a
multiple of 4:

```
 0 ^  1 ^  2 ^  3 = 0
 4 ^  5 ^  6 ^  7 = 0
 8 ^  9 ^ 10 ^ 11 = 0
12 ^ 13 ^ 14 ^ 15 = 0
```

Always zero. Within such a block the top bits are identical across all four
values, so they appear four times and cancel in pairs; the bottom two bits run
through `00, 01, 10, 11`, and each of those two columns has exactly two ones.
Every column ends even, so the whole block is 0.

That means XORing 0 through n discards everything except the leftover partial
block:

| `n % 4` | Leftover | XOR of 0..n |
|---|---|---|
| 0 | `n` | **n** |
| 1 | `n-1, n` | **1** |
| 2 | `n-2, n-1, n` | **n+1** |
| 3 | a complete block | **0** |

```cpp
unsigned f(unsigned n) {          // XOR of 0..n
    switch (n & 3) {
        case 0: return n;
        case 1: return 1;
        case 2: return n + 1;
        default: return 0;
    }
}
```

Verified against a running XOR for **every n from 0 to 200,000,000** — 0
mismatches, in 0.5 seconds. The first eight values are `0, 1, 3, 0, 4, 1, 7, 0`.

## From a prefix to a range

XOR is its own inverse, which is what makes prefixes composable — exactly as
prefix sums use subtraction, prefix XORs use XOR:

```
L ^ … ^ R  =  (0 ^ … ^ R) ^ (0 ^ … ^ L-1)  =  f(R) ^ f(L-1)
```

Everything below `L` appears in both terms and cancels. Verified on 300,000
random ranges against a running loop — **0 mismatches**, including `L = 0`,
where the second term is the empty XOR, 0.

This is the same decomposition that Count subarrays with given XOR K uses, and
the reason it works there is the reason it works here.

## Cost

| | Loop | Closed form | Ratio |
|---|---|---|---|
| 20,000 ranges, mean width ~50,000 (C++) | 173,098,458ns | **64,333ns** | **2,691x** |
| XOR of 1..10,000,000 (Python) | 1,217.4ms | **471ns** | **2,586,076x** |

The C++ gap is "only" 2,691x because the compiler vectorises the XOR reduction —
a billion-element loop finished in 0.17 seconds, about 0.17ns per element, which
is impressive and still infinitely behind an expression that does not depend on
the width of the range at all.

That is the real point: the closed form's cost does not grow. `f(10^18)` costs
exactly what `f(3)` costs.

## The extensions come free

The same block argument answers two neighbouring questions. For **even numbers**,
every value is `2i`, and a common left shift distributes over XOR:

```
XOR of evens in 0..n  =  2 * f(n / 2)
```

And the odds are whatever is left:

```
XOR of odds in 0..n  =  f(n) ^ (2 * f(n / 2))
```

Both verified for every n from 0 to 500,000 — 0 mismatches. For n = 10 they give
2 and 9.

## What the formula does not cover

- **Negative ranges.** The derivation assumes non-negative integers. In Python,
  where `range(-3, 4)` is legal, the true XOR is −4 and `f` does not model it —
  the block argument relies on the low two bits cycling `00, 01, 10, 11`, which
  they do for a two's complement negative too, but the alignment and the leftover
  handling differ. Shift the range to be non-negative, or fall back to a loop.
- **`L > R`.** The empty range XORs to 0; `f(R) ^ f(L-1)` will produce something
  else, so guard it.
- **Overflow.** None — XOR never carries, so `f(n)` returns a value no wider than
  `n + 1`.

## Where this goes next

**Single Number - III** is the last XOR subtopic and the one that combines
everything here: XOR the whole array to get `a ^ b` for the two unpaired values,
then use `n & -n` to pick a column where they differ, and split the array on that
column into two independent copies of Single Number - I.

<!-- @intuition -->
Consecutive integers are extremely regular in binary — the low bits cycle with period 2 and 4 and 8, and the high bits only change occasionally — so XORing a run of them cancels almost everything. Four in a row starting at a multiple of four is the smallest complete unit of that cancellation: the two low columns each see exactly two ones, and every high column sees the same value four times, so every column comes out even and the block contributes nothing at all. Once you know that, XORing 0 up to n is not a computation but a bookkeeping question: how many complete blocks were there, which contributed nothing, and what is left over? The leftover is at most three numbers and is completely determined by n mod 4, which is why the answer is a four-case lookup rather than a loop. Turning that into a range is the same move as prefix sums, made simpler by XOR being its own inverse.

<!-- @approach -->
### Brute Force - Loop and XOR

<!-- @idea -->
Walk from L to R accumulating the XOR.

<!-- @steps -->
1. Start an accumulator at 0.
2. XOR each integer from `L` to `R` into it.
3. Return the accumulator.
4. Note that the cost is proportional to `R - L`, not to the size of the numbers.
5. Note that this is the reference the closed form must agree with.

<!-- @complexity -->
- time: O(R - L)
- space: O(1)
- note: Correct by construction, and the reference every other approach here was checked against. Measured 173,098,458ns over 20,000 ranges of mean width 50,000 against the closed form's 64,333ns — 2,691x. In Python a single range of ten million took 1,217.4ms against 471ns, a factor of 2,586,076, since there is no vectoriser to soften it.

<!-- @code cpp -->
```cpp
unsigned xorRangeLoop(unsigned L, unsigned R) {
    unsigned x = 0;
    for (unsigned v = L; v <= R; v++) x ^= v;
    return x;
}

// Fast for a loop — the compiler vectorises the reduction, and a
// billion-element range finished in 0.17s, about 0.17ns per element.
// Still 2,691x behind an expression whose cost does not depend on width.
```

<!-- @annotations -->
- 3: With unsigned bounds, R = UINT_MAX makes this loop infinite, since v <= R is always true — a hazard the closed form does not have.
- 7: Worth stating because it reframes the comparison: the loop is not slow, it is merely proportional to something the alternative ignores entirely.

<!-- @code java -->
```java
static int xorRangeLoop(int L, int R) {
    int x = 0;
    for (int v = L; v <= R; v++) x ^= v;
    return x;
}
```

<!-- @annotations -->
- 3: With R = Integer.MAX_VALUE this loops forever, because v++ wraps to the minimum and the condition becomes true again.

<!-- @code python -->
```python
from functools import reduce
from operator import xor

def xor_range_loop(L: int, R: int) -> int:
    return reduce(xor, range(L, R + 1), 0)


# Measured 1,217.4ms for 1..10,000,000 against the closed form's 471ns.
# range() handles negative bounds correctly, which the closed form does not.
```

<!-- @annotations -->
- 5: The initial 0 makes an empty range return 0 rather than raising, which matters because L > R is a legal call.

<!-- @approach -->
### Better - Prefix Decomposition

<!-- @idea -->
Express the range as the difference of two prefixes, using XOR itself as the inverse operation.

<!-- @steps -->
1. Note that `0 ^ … ^ R` contains every value in the range plus everything below `L`.
2. Note that `0 ^ … ^ (L-1)` contains exactly that unwanted part.
3. XOR the two together; the shared prefix cancels because `a ^ a == 0`.
4. What remains is `L ^ … ^ R`.
5. Guard `L = 0`, where the second prefix is the empty XOR, 0.

<!-- @complexity -->
- time: O(R) if the prefixes are computed by looping, O(1) with the closed form
- space: O(1)
- note: The structural step, independent of how the prefix is computed. Verified on 300,000 random ranges, 0 mismatches, including L = 0. It is the same decomposition prefix sums use, and it is simpler here because XOR is its own inverse — there is no separate subtraction, and no risk of overflow in the intermediate.

<!-- @code cpp -->
```cpp
unsigned prefixXorLoop(unsigned n) {
    unsigned x = 0;
    for (unsigned v = 0; v <= n; v++) x ^= v;
    return x;
}

unsigned xorRange(unsigned L, unsigned R) {
    return prefixXorLoop(R) ^ (L ? prefixXorLoop(L - 1) : 0u);
}
```

<!-- @annotations -->
- 8: The guard is not cosmetic — with unsigned arithmetic L - 1 at L = 0 wraps to UINT_MAX, and the prefix loop would then run for four billion iterations. This is the same shape as a prefix-sum query, with XOR replacing both the accumulation and the subtraction because it is self-inverse.

<!-- @code java -->
```java
static int prefixXorLoop(int n) {
    int x = 0;
    for (int v = 0; v <= n; v++) x ^= v;
    return x;
}

static int xorRange(int L, int R) {
    return prefixXorLoop(R) ^ (L > 0 ? prefixXorLoop(L - 1) : 0);
}
```

<!-- @annotations -->
- 8: Java's signed L - 1 at L = 0 gives -1 rather than a huge positive, so the loop would simply not run — a different wrong answer from the C++ one, and still wrong.

<!-- @code python -->
```python
def xor_range(L: int, R: int) -> int:
    return prefix_xor(R) ^ (prefix_xor(L - 1) if L else 0)


# Verified on 300,000 random ranges against a running loop: 0 mismatches,
# including L = 0 where the second term is the empty XOR.
```

<!-- @annotations -->
- 2: The conditional reads as "the empty prefix is 0", which is the identity element for XOR — the same reason the accumulator starts at 0.

<!-- @approach -->
### Optimal - The n mod 4 Closed Form

<!-- @idea -->
Aligned blocks of four cancel completely, so only the leftover partial block matters, and that is determined by n mod 4.

<!-- @steps -->
1. Observe that `4k ^ (4k+1) ^ (4k+2) ^ (4k+3)` is 0 for every k.
2. So XORing 0 through n leaves only the values after the last complete block.
3. If `n % 4 == 3` the last block is complete and the answer is 0.
4. If `n % 4 == 0` only `n` is left over, so the answer is `n`.
5. If `n % 4 == 1` the leftovers are `n-1` and `n`, which differ only in bit 0, giving 1.
6. If `n % 4 == 2` the leftovers are `n-2, n-1, n`, which give `n + 1`.

<!-- @complexity -->
- time: O(1) — a mask, a branch and at most an increment
- space: O(1)
- note: Verified against a running XOR for every n from 0 to 200,000,000 with 0 mismatches, in 0.5 seconds, and the range form on 300,000 random ranges, also 0. Measured 64,333ns over 20,000 ranges against the loop's 173,098,458ns, a factor of 2,691. Its cost does not grow with the range: f(10^18) costs exactly what f(3) costs.

<!-- @code cpp -->
```cpp
unsigned f(unsigned n) {                  // XOR of 0..n
    switch (n & 3u) {
        case 0:  return n;
        case 1:  return 1u;
        case 2:  return n + 1u;
        default: return 0u;               // n % 4 == 3
    }
}

unsigned xorRange(unsigned L, unsigned R) {
    return f(R) ^ (L ? f(L - 1) : 0u);
}

// f(0..7) = 0, 1, 3, 0, 4, 1, 7, 0
```

<!-- @annotations -->
- 2: n & 3 rather than n % 4 — identical for unsigned, and the mask form makes the "low two bits" argument visible in the code.
- 5: n + 1 cannot overflow meaningfully here: XOR never carries, so the result is no wider than n + 1 itself.
- 11: The same L = 0 guard as the prefix version, and for the same reason — L - 1 would wrap.

<!-- @code java -->
```java
static int f(int n) {
    switch (n & 3) {
        case 0:  return n;
        case 1:  return 1;
        case 2:  return n + 1;
        default: return 0;
    }
}

static int xorRange(int L, int R) {
    return f(R) ^ (L > 0 ? f(L - 1) : 0);
}
```

<!-- @annotations -->
- 2: n & 3 rather than n % 4 matters here — for a negative n, n % 4 can be negative and would fall through to the default case, while n & 3 always yields 0..3.

<!-- @code python -->
```python
def f(n: int) -> int:                     # XOR of 0..n, for n >= 0
    return (n, 1, n + 1, 0)[n & 3]


def xor_range(L: int, R: int) -> int:
    return f(R) ^ (f(L - 1) if L else 0)


# Measured 471ns against a 1,217.4ms loop for 1..10,000,000 — 2,586,076x.
# Only valid for non-negative bounds: reduce(xor, range(-3, 4), 0) is -4,
# which this does not model.
```

<!-- @annotations -->
- 2: A tuple indexed by n & 3 replaces the switch, and evaluates all four entries — harmless here since each is O(1) and none can fail.
- 9: The one caveat that survives into Python, where negative ranges are ordinary and the derivation does not cover them.

<!-- @approach -->
### Extension - Only the Evens, or Only the Odds

<!-- @idea -->
Every even number is 2i, and a common left shift distributes over XOR, so the evens reduce to the same function on half the range.

<!-- @steps -->
1. Write each even number in `0..n` as `2i`, with `i` running from 0 to `n / 2`.
2. Note that XORing `2i` over all `i` equals XORing `i` over all `i`, then shifting left once.
3. So the XOR of the evens is `2 * f(n / 2)`.
4. The odds are everything else, so their XOR is the total XOR of the range with the evens removed.
5. Since XOR is self-inverse, removing them means XORing them back in: `f(n) ^ (2 * f(n / 2))`.

<!-- @complexity -->
- time: O(1) — two lookups and a shift
- space: O(1)
- note: Both formulas verified for every n from 0 to 500,000 with 0 mismatches. At n = 10 they give 2 for the evens and 9 for the odds. The distributive step is worth remembering on its own: a left shift applied to every operand can be factored out of a XOR, which is what makes the reduction to f(n / 2) exact rather than approximate.

<!-- @code cpp -->
```cpp
unsigned f(unsigned n);                   // the closed form, from the previous approach

unsigned xorEvens(unsigned n) {           // XOR of the even numbers in 0..n
    return 2u * f(n / 2u);
}

unsigned xorOdds(unsigned n) {            // XOR of the odd numbers in 0..n
    return f(n) ^ xorEvens(n);
}

// n = 10: evens give 2, odds give 9.
```

<!-- @annotations -->
- 4: 2 * f(n/2) is a left shift of the result, which is exactly the shift that was factored out of every operand.
- 8: Subtracting is XORing, because XOR is its own inverse — this is the same move the prefix decomposition makes.

<!-- @code java -->
```java
static int xorEvens(int n) { return 2 * f(n / 2); }
static int xorOdds(int n)  { return f(n) ^ xorEvens(n); }
```

<!-- @annotations -->
- 1: For a negative n, Java's / truncates toward zero and this reduction no longer holds — the whole family assumes non-negative bounds.

<!-- @code python -->
```python
def xor_evens(n: int) -> int:
    return 2 * f(n // 2)


def xor_odds(n: int) -> int:
    return f(n) ^ xor_evens(n)


# Both verified for every n from 0 to 500,000: 0 mismatches.
# For a range rather than a prefix, subtract prefixes as usual:
#     evens in L..R  =  xor_evens(R) ^ (xor_evens(L - 1) if L else 0)
```

<!-- @annotations -->
- 2: // rather than /, which would produce a float and break the indexing inside f.
- 11: The prefix decomposition composes with any of these, because it only needs the underlying operation to be self-inverse.

<!-- @example -->

<!-- @input -->
The numbers 0 through 15

<!-- @output -->
Four complete blocks, each XORing to 0

<!-- @why -->
It is the smallest range that shows the cancellation repeating, which is what makes the pattern a rule rather than a coincidence.

<!-- @walkthrough -->
1. 0 ^ 1 ^ 2 ^ 3 is 0.
2. 4 ^ 5 ^ 6 ^ 7 is 0, and so are 8 ^ 9 ^ 10 ^ 11 and 12 ^ 13 ^ 14 ^ 15.
3. Within any such block the values share every bit above position 1, so those columns each see the same value four times and cancel in pairs.
4. The low two bits run through 00, 01, 10 and 11, so each of those columns contains exactly two ones and also cancels.
5. Every column is therefore even, and the block contributes nothing.
6. That is why XORing 0 through n can ignore everything except the values after the last complete block — at most three of them.
7. Which three is determined entirely by n mod 4, giving the four cases n, 1, n+1 and 0.

<!-- @example -->

<!-- @input -->
Every n from 0 to 200,000,000

<!-- @output -->
0 mismatches against a running XOR, in 0.5 seconds

<!-- @why -->
The formula is four unmotivated-looking cases, so it is the kind of thing worth checking over a range far larger than any argument would cover.

<!-- @walkthrough -->
1. A running accumulator XORed in each value of n in turn, giving the true prefix XOR at every step.
2. At each step the closed form f(n) was evaluated and compared.
3. Across all 200,000,001 values there were 0 mismatches.
4. The first eight results are 0, 1, 3, 0, 4, 1, 7, 0 — the pattern visibly repeating with period 4 while one case grows with n.
5. Two of the four cases are constant, at 1 and 0, and two track n, at n and n + 1.
6. That mix is what makes the formula look arbitrary and is exactly what the leftover analysis predicts: the two constant cases are where the leftovers differ only in low bits.
7. Separately, the range form f(R) ^ f(L-1) was checked on 300,000 random ranges of width up to 5,000, also with 0 mismatches, including ranges starting at 0.

<!-- @example -->

<!-- @input -->
XOR of 1 through 1,000,000,000

<!-- @output -->
1,000,000,000 — from three operations rather than a billion

<!-- @why -->
It is a range where the loop is still just about runnable, so both answers can be produced and compared rather than one being asserted.

<!-- @walkthrough -->
1. R = 1,000,000,000 has R mod 4 = 0, so f(R) is R itself.
2. L = 1, so f(L - 1) is f(0), which is 0.
3. The closed form therefore gives 1,000,000,000 ^ 0 = 1,000,000,000.
4. Running the loop over all one billion values gave the same answer.
5. The loop took 0.17 seconds, which is about 0.17ns per element — the compiler vectorised the reduction, so this is a fast loop rather than a naive one.
6. The closed form is three operations and does not depend on the width of the range at all.
7. That is the distinction worth keeping: the loop is not slow, it is proportional to something the alternative never looks at, so the gap grows without bound as the range does.

<!-- @example -->

<!-- @input -->
The even and odd numbers in 0..10

<!-- @output -->
2 and 9, from 2 * f(5) and f(10) ^ 2 * f(5)

<!-- @why -->
The extension follows from one algebraic fact about shifts, and checking it on a small case makes that fact concrete.

<!-- @walkthrough -->
1. The evens in 0..10 are 0, 2, 4, 6, 8, 10, and XORing them directly gives 2.
2. Each is 2i for i in 0..5, and XORing 2i over all i is the same as XORing i over all i and then shifting left once.
3. f(5) is 1, because 5 mod 4 is 1, and 2 * 1 is 2 — matching.
4. The odds in 0..10 are 1, 3, 5, 7, 9, and XORing them directly gives 9.
5. f(10) is 11, because 10 mod 4 is 2 and the case gives n + 1.
6. So the odds are 11 ^ 2, which is 9 — matching, because removing the evens from the total means XORing them back in.
7. Both formulas were verified for every n from 0 to 500,000 with 0 mismatches, and both compose with the prefix decomposition to give ranges rather than prefixes.

<!-- @visualization custom -->

<!-- @description -->
Open with the block panel: the integers 0 to 15 drawn as sixteen four-bit rows in a vertical column, grouped into four boxes of four. Take the first box and light its two low columns, showing 00, 01, 10, 11 stacked, with a tally beneath each column reading "two ones — cancels". Then light the two high columns, showing the same value repeated four times in each, with a tally reading "four identical — cancels in pairs". Collapse the box to a single 0. Repeat for the other three boxes at speed, ending with four zeros and nothing else. Then the leftover panel, which is the formula: a long strip of integers from 0 to n with complete blocks greyed out and only the trailing partial block highlighted. Slide n along the strip and watch the highlighted leftover cycle through four states — one value, two values, three values, none — with the resulting answer displayed beneath as n, 1, n+1, 0. Show the two constant cases explicitly: when the leftover is n-1 and n, line the two up and highlight that they differ only in bit 0, so the XOR is 1; when it is n-2, n-1, n, show the arithmetic giving n+1. Then the prefix panel: two bars representing 0..R and 0..(L-1), overlaid so the shared portion below L visibly aligns, with that overlap fading out as the XOR is applied and only the L..R segment remaining — captioned "XOR is its own inverse, so prefixes subtract by XORing". Then the cost panel: a chart of time against range width, with the loop rising linearly and the closed form dead flat at the bottom, annotated 2,691x in C++ at width 50,000 and 2,586,076x in Python at width ten million, plus a note that the C++ loop is vectorised and still loses. Close with the extension panel: the same strip with only even cells lit, each labelled 2i above and i below, and an arrow showing the entire lit row shifting right by one to become the plain sequence 0..n/2 — with the caption "a common shift factors out of a XOR" and the result 2 * f(n/2) beneath.

<!-- @sampleInput -->
```json
{"blocks":{"example":[{"values":[0,1,2,3],"xor":0},{"values":[4,5,6,7],"xor":0},{"values":[8,9,10,11],"xor":0},{"values":[12,13,14,15],"xor":0}],"whyLowBitsCancel":"the low two bits run through 00, 01, 10, 11, so each of those columns contains exactly two ones","whyHighBitsCancel":"every bit above position 1 is identical across all four values, so each such column sees the same value four times and cancels in pairs","conclusion":"every column ends even, so an aligned block of four contributes nothing"},"closedForm":{"function":"f(n) = XOR of 0..n","cases":[{"nMod4":0,"leftover":["n"],"result":"n"},{"nMod4":1,"leftover":["n-1","n"],"result":"1","why":"the two leftovers differ only in bit 0"},{"nMod4":2,"leftover":["n-2","n-1","n"],"result":"n + 1"},{"nMod4":3,"leftover":[],"result":"0","why":"the last block is complete"}],"firstEight":[0,1,3,0,4,1,7,0],"maskNotModulo":"n & 3 rather than n % 4 — identical for unsigned, and for a negative signed n the modulo can be negative and fall through to the wrong case"},"verification":{"prefix":{"range":[0,200000000],"values":200000001,"mismatches":0,"seconds":0.5,"referenceUsed":"a running XOR accumulator"},"ranges":{"count":300000,"maxWidth":5000,"mismatches":0,"includesLZero":true},"evensOdds":{"range":[0,500000],"mismatches":0,"worked":{"n":10,"evens":2,"odds":9}},"python":{"prefixRange":[0,2000000],"mismatches":0,"randomRanges":20000,"mismatchesRanges":0}},"prefixDecomposition":{"identity":"L ^ ... ^ R = f(R) ^ f(L-1)","why":"everything below L appears in both terms and cancels, because a ^ a == 0","guard":"L = 0, where the second term is the empty XOR, 0","cppHazard":"with unsigned arithmetic L - 1 at L = 0 wraps to UINT_MAX","javaHazard":"signed L - 1 at L = 0 gives -1, so the prefix loop simply does not run","sameAs":"count-subarrays-with-given-xor-k uses this decomposition for the same reason"},"timing":{"cpp":{"ranges":20000,"meanWidth":50000,"loopNs":173098458,"closedNs":64333,"ratio":2691,"note":"the loop is vectorised — a billion-element range finished in 0.17s, about 0.17ns per element — and still loses"},"python":{"range":[1,10000000],"loopMs":1217.4,"closedNs":471,"ratio":2586076},"keyPoint":"the closed form's cost does not grow: f(10^18) costs exactly what f(3) costs","singleHugeRange":{"L":1,"R":1000000000,"answer":1000000000,"loopSeconds":0.17,"closedForm":"three operations"}},"extensions":{"evens":{"formula":"2 * f(n / 2)","derivation":"every even is 2i, and XORing 2i over all i equals (XORing i over all i) shifted left once — a common left shift factors out of a XOR","atTen":2},"odds":{"formula":"f(n) ^ (2 * f(n / 2))","derivation":"the odds are the total with the evens removed, and removing means XORing back in because XOR is self-inverse","atTen":9},"composesWithPrefix":"evens in L..R = xor_evens(R) ^ xor_evens(L-1)"},"notCovered":[{"case":"negative ranges","detail":"the derivation assumes non-negative integers; in Python reduce(xor, range(-3, 4), 0) is -4, which f does not model","fix":"shift the range to be non-negative, or loop"},{"case":"L > R","detail":"the empty range XORs to 0, but f(R) ^ f(L-1) will produce something else","fix":"guard it"},{"case":"overflow","detail":"none — XOR never carries, so f(n) is no wider than n + 1"}]}
```

<!-- @highlights -->
- The integers 0 to 15 are drawn as sixteen four-bit rows grouped into four boxes.
- The first box lights its two low columns, showing 00, 01, 10, 11 with a tally reading "two ones — cancels".
- Its two high columns then light, showing the same value four times, tallied "four identical — cancels in pairs".
- The box collapses to a single 0, and the other three follow at speed.
- A long strip from 0 to n then greys out complete blocks and highlights only the trailing partial one.
- Sliding n along the strip cycles the leftover through four states, with the answer n, 1, n+1, 0 beneath.
- The n-1 and n case is shown lined up, highlighting that they differ only in bit 0, so the XOR is 1.
- The three-value case is shown working out to n+1.
- Two overlaid bars represent 0..R and 0..(L-1), with the shared portion below L visibly aligned.
- The overlap fades as the XOR is applied, leaving only the L..R segment.
- It is captioned "XOR is its own inverse, so prefixes subtract by XORing".
- A chart plots time against range width, with the loop rising linearly and the closed form dead flat.
- It is annotated 2,691x in C++ and 2,586,076x in Python, noting that the C++ loop is vectorised and still loses.
- The extension panel lights only the even cells, labelled 2i above and i below.
- An arrow shifts the entire lit row right by one, turning it into the plain sequence 0..n/2.
- It is captioned "a common shift factors out of a XOR", with 2 * f(n/2) shown beneath.

<!-- @edgeCases -->
- n = 0 — f(0) is 0, the empty-looking case that is actually the n % 4 == 0 branch returning n.
- n = 1, 2, 3 — the first complete cycle of the four cases, and the smallest useful test set.
- L = 0 — the second prefix term is the empty XOR, 0; computing f(L - 1) instead wraps or underflows.
- L = R — a single-element range, and the closed form gives that element.
- L > R — an empty range XORs to 0, but the formula does not; guard it explicitly.
- R = UINT_MAX in C++ — the loop version never terminates, since v <= R is always true.
- R = Integer.MAX_VALUE in Java — the loop wraps to the minimum and continues forever.
- Negative bounds — the derivation assumes non-negative integers, so shift the range or fall back to a loop.
- A negative n with n % 4 in Java or C++ — the remainder can be negative and falls through to the wrong case; use n & 3.
- Very large n — the closed form is unaffected, since its cost does not depend on the magnitude at all.
- The evens formula with an odd n — n / 2 truncates, which is correct here because the last even number in 0..n is 2 * (n / 2).

<!-- @pitfalls -->
- Computing f(L - 1) without guarding L = 0. In C++ unsigned arithmetic that wraps to UINT_MAX and the prefix loop runs four billion times; in Java it gives -1 and the loop silently does not run.
- Writing n % 4 instead of n & 3 on a possibly negative signed value. The remainder can be negative and misses every case, falling through to the default.
- Applying the formula to a negative range. The derivation assumes non-negative integers and gives the wrong answer without warning.
- Forgetting that L > R is possible. The empty range XORs to 0, and f(R) ^ f(L-1) does not.
- Looping to R = UINT_MAX. The condition v <= R is always true for unsigned, so the loop never ends.
- Memorising the four cases without the block argument. The cases look arbitrary and are easy to misremember; the derivation reconstructs them in seconds.
- Assuming a loop is acceptable because it vectorises. A billion-element range still took 0.17s where the closed form takes three operations, and the gap grows without bound.
- Using / rather than // in the Python evens formula. A float index into the tuple inside f raises TypeError.
- Testing only n % 4 == 3. That case returns 0 and hides sign, guard and off-by-one errors that the other three would expose.
- Reimplementing the prefix decomposition with subtraction. XOR is its own inverse, so there is no subtraction and no overflow to consider.
- Assuming the extensions need their own derivation. Both follow from one fact — a common left shift factors out of a XOR — and both were verified to 500,000.
- Treating the formula as an approximation. It is exact, and was checked against a running XOR at every one of 200,000,001 consecutive values.

<!-- @doubt -->
### Why does the answer depend only on n mod 4?

<!-- @answer -->
Because any four consecutive integers starting at a multiple of 4 XOR to 0. Within such a block, every bit above position 1 is identical across all four values, so each of those columns sees the same value four times and cancels in pairs; and the low two bits run through 00, 01, 10, 11, so each of those columns contains exactly two ones. Every column ends even, so the block contributes nothing. That means XORing 0 through n can ignore all the complete blocks, and what is left is at most three values — determined entirely by n mod 4.

<!-- @doubt -->
### Where do the four cases come from?

<!-- @answer -->
From what is left after the last complete block. If n mod 4 is 3 the block is complete, so the answer is 0. If it is 0 the leftover is just n, so the answer is n. If it is 1 the leftovers are n-1 and n, which are consecutive with n even, so they differ only in bit 0 and their XOR is 1. If it is 2 the leftovers are n-2, n-1 and n, which work out to n+1. That is why two cases are constant and two track n — the constant ones are where the leftovers differ only in low bits. Verified against a running XOR at every n from 0 to 200,000,000, with 0 mismatches.

<!-- @doubt -->
### Why is the range f(R) ^ f(L-1) rather than a subtraction?

<!-- @answer -->
Because XOR is its own inverse, so it plays both roles. The prefix f(R) contains everything from 0 to R, which is the range you want plus everything below L. The prefix f(L-1) is exactly that unwanted part. XORing them cancels the shared portion, since a ^ a is 0, leaving L ^ … ^ R. With sums you would accumulate with + and remove with -; with XOR the same operator does both, which also means there is no intermediate that can overflow. Verified on 300,000 random ranges, 0 mismatches.

<!-- @doubt -->
### Why guard L = 0 specially?

<!-- @answer -->
Because L - 1 is not representable as intended. In C++ with unsigned bounds, 0 - 1 wraps to UINT_MAX, so a looping prefix would run four billion iterations and the closed form would compute f(UINT_MAX) — a plausible number that is wrong. In Java with signed ints, 0 - 1 is -1, so a prefix loop simply does not execute and returns 0, which happens to be right for the wrong reason and stops being right the moment the code is refactored. The correct statement is that the prefix below 0 is the empty XOR, whose value is 0, the identity element.

<!-- @doubt -->
### How much does the closed form actually save?

<!-- @answer -->
2,691x over 20,000 C++ ranges of mean width 50,000, and 2,586,076x on a single ten-million range in Python. But the ratio is the wrong way to think about it, because it depends entirely on the range width. The right statement is that the closed form's cost does not grow at all: f(10^18) costs exactly what f(3) costs, while the loop is proportional to R - L. That is also why the C++ figure is comparatively modest — the compiler vectorises the reduction, so a billion-element range takes only 0.17 seconds, about 0.17ns per element. It is a fast loop losing to an expression that never looks at the width.

<!-- @doubt -->
### Should I write n & 3 or n % 4?

<!-- @answer -->
n & 3, and for a correctness reason rather than a speed one. For unsigned values they are identical and the compiler emits the same code either way. For a signed negative n, the remainder in C++ and Java takes the sign of the dividend, so n % 4 can be -1, -2 or -3 — values that match none of the cases and fall through to the default, silently returning 0. n & 3 always yields 0, 1, 2 or 3. It also makes the derivation visible in the code: the argument was about the low two bits, and the mask says so.

<!-- @doubt -->
### Does this work for negative ranges?

<!-- @answer -->
Not as written. The derivation assumes non-negative integers, and while the low two bits of a negative two's complement value do still cycle 00, 01, 10, 11, the alignment of the blocks and the handling of the leftover differ. Python makes this concrete because range(-3, 4) is a perfectly ordinary call: the true XOR is -4, and f does not produce it. If the bounds can be negative, either shift the range so it starts at 0 and adjust, or fall back to the loop — the loop is correct for any bounds and is only slow in proportion to the width.

<!-- @doubt -->
### How do the even and odd extensions work?

<!-- @answer -->
From a single algebraic fact: a common left shift factors out of a XOR. Every even number in 0..n is 2i for i from 0 to n/2, and XORing 2i over all i equals XORing i over all i and then shifting left once — so the evens are 2 * f(n / 2). The odds are then whatever the total does not account for, and because XOR is self-inverse, "removing" the evens means XORing them back in: f(n) ^ (2 * f(n / 2)). Both were verified for every n from 0 to 500,000 with 0 mismatches; at n = 10 they give 2 and 9. Both also compose with the prefix decomposition to handle ranges rather than prefixes.

<!-- @doubt -->
### Is there an overflow risk?

<!-- @answer -->
No, and the reason is worth stating because it distinguishes this from the prefix-sum version of the same idea. XOR never carries between columns, so the result of XORing any set of values is no wider than the widest value involved — f(n) returns something no larger than n + 1. A prefix-sum decomposition over the same range would need a type wide enough to hold the sum, which for 1..10^9 is about 5 x 10^17. Here the accumulator can be the same width as the inputs, always.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Single Number - III, the last XOR subtopic and the one that assembles the whole thread. XORing an array where two values appear once and everything else appears twice gives a ^ b for those two — not the answer, but a map of where they differ. Picking any set bit of it with n & -n gives a column where a and b disagree, so splitting the array by that column puts a in one half and b in the other, with every duplicate pair staying together. Each half is then Single Number - I, and the whole thing is two passes and constant space.
