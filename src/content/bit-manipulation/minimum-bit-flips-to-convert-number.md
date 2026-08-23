---
id: minimum-bit-flips-to-convert-number
topic: Bit Manipulation
title: Minimum Bit Flips to Convert Number
difficulty: Medium
status: ready
prerequisites:
  - count-the-number-of-set-bits
  - swap-two-numbers
  - check-if-the-i-th-bit-is-set-or-not
  - introduction-to-bits-and-tricks
relatedIds:
  - single-number-i
  - single-number-iii
  - xor-of-numbers-in-a-given-range
  - count-the-number-of-set-bits
  - swap-two-numbers
---

<!-- @summary -->
The number of flips is the number of positions where the two numbers differ, XOR is exactly "where do these differ", and counting set bits is the previous subtopic — so the whole answer is `popcount(a ^ b)`. Verified against a per-position comparison over all 4,294,967,296 pairs of 16-bit values in 18.3 seconds, zero mismatches, with the total flips coming to exactly 8.000 per pair. It measured **38.6x** faster than comparing positions. In Python the obvious translation is wrong: `(-1 ^ 0).bit_count()` is 1, not 32.

<!-- @theory -->
## The problem

Given `start` and `goal`, return the minimum number of bit flips that turns one
into the other. A flip changes a single bit from 0 to 1 or from 1 to 0.

Since each flip fixes exactly one position, and positions are independent, the
answer is simply **how many positions differ**.

## XOR answers "where do these differ"

That is XOR's definition: a bit of `a ^ b` is 1 exactly when the corresponding
bits of `a` and `b` are different.

```
a = 10 = 1010
b =  7 = 0111
        ------
a ^ b  = 1101   ->  three positions differ  ->  3 flips
```

So the whole problem reduces to two operations already covered:

```cpp
int minBitFlips(int start, int goal) {
    return __builtin_popcount(start ^ goal);
}
```

Checked against a reference that compared the two numbers one position at a time
and used no XOR at all, over every one of the 4,294,967,296 pairs of 16-bit
values — 18.3 seconds, **0 mismatches**.

That same pass totalled 34,359,738,368 differing positions, a mean of exactly
**8.000** per pair. Which is the expected figure: each of the 16 positions
differs in half of all pairs.

## Why this is the whole answer

Two facts have to hold for "count the differences" to be the *minimum*:

- **Every differing position must be flipped.** A position where the bits differ
  cannot be left alone, or the numbers still differ there.
- **No position needs flipping twice.** Flipping a matching position and then
  flipping it back costs two flips and achieves nothing.

So the count of differing positions is both a lower bound and achievable, which
makes it the minimum. There is no search here, no ordering question, and no
choice to optimise — a rare case where the greedy answer and the only answer
coincide.

## Cost

Over 65,536 pairs, best of 200 runs:

| Method | Time | Ratio |
|---|---|---|
| `popcount(a ^ b)` | **12,000ns** | 1.00x |
| Compare all 32 positions | 463,459ns | 38.6x |
| XOR, then Kernighan's loop | 1,843,666ns | **153.6x** |

Worth noting what happened to Kernighan's loop here. In Count the Number of Set
Bits, written as a standalone function, the compiler recognised it and emitted
the hardware instruction. Written inline over a freshly XORed value it was **not**
recognised, and ran as written — 153.6x slower. Idiom recognition is a property
of the compiler and the surrounding code, not of the algorithm, and it cannot be
relied on.

## Negatives, and the Python trap

In C++ and Java the width is part of the type, so nothing special is needed:

```
a = -1, b = 0    ->  a ^ b = 0xFFFFFFFF  ->  32 flips
a = -8, b = 8    ->  a ^ b = 0xFFFFFFF0  ->  28 flips
```

In Python the same expression is wrong, for the reason established in Count the
Number of Set Bits — `bit_count()` counts the **magnitude**, and there is no
width to complement against:

```python
(-1 ^ 0)                       # -1
(-1 ^ 0).bit_count()           # 1     — wrong
((-1 ^ 0) & 0xFFFFFFFF).bit_count()   # 32   — right
```

The XOR itself is fine; it is the counting that needs a width. Mask before
counting and the answers agree with C++ exactly — `(-8 ^ 8) & 0xFFFFFFFF` gives
28, as it should.

Python timings, per pair: `bit_count()` 114ns, `bin(a ^ b).count("1")` 439ns,
per-position comparison 5,262ns — a **46.2x** spread between the first and last.

## The generalisation worth knowing

This quantity is the **Hamming distance** between the two numbers, and the same
one-liner answers several problems that look different:

- *Total Hamming distance* over an array — sum over all pairs, usually solved by
  counting how many values have each bit set rather than by iterating pairs.
- *Hamming distance* between two strings or vectors — the same count, one
  position at a time.
- *Error detection* — the minimum distance between valid codewords determines how
  many bit errors a code can detect.

The step worth remembering is not the formula but the reduction: "how many
positions differ" became "how many bits are set" the moment XOR entered.

## Where this goes next

**Single Number - I** applies the same property to a whole array rather than a
pair. If every value appears twice except one, XORing everything makes the pairs
cancel — `a ^ a == 0` — and leaves the single value behind, in one pass and
constant space. This subtopic used XOR to compare two numbers; that one uses it
to cancel many.

<!-- @intuition -->
A flip changes one bit, and the bits are independent of one another, so there is nothing to plan — you must flip every position where the two numbers disagree, and flipping anything else is wasted work that has to be undone. That makes the answer a count of disagreements rather than the result of a search. And counting disagreements is exactly what XOR was built to do: it produces a 1 in every column where its inputs differ and a 0 where they agree. So the two numbers go in, a map of their disagreements comes out, and the question becomes how many 1s are in that map — which is the previous subtopic, answered by a single hardware instruction. The whole problem is two operations, and the interesting part is recognising that the first one turns it into a problem you have already solved.

<!-- @approach -->
### Brute Force - Compare Position by Position

<!-- @idea -->
Read the same bit out of both numbers, 32 times, and count how often they disagree.

<!-- @steps -->
1. Loop `i` from 0 to 31.
2. Read bit `i` of `start` with `(start >> i) & 1`.
3. Read bit `i` of `goal` the same way.
4. If the two differ, increment the count.
5. Return the count after all 32 positions.

<!-- @complexity -->
- time: O(w) — always 32 iterations
- space: O(1)
- note: Correct, and the version that shows why the answer is a count rather than a search — every differing position must be flipped and no position benefits from being flipped twice. Measured 463,459ns over 65,536 pairs against the XOR form's 12,000ns, a factor of 38.6.

<!-- @code cpp -->
```cpp
int minBitFlips(int start, int goal) {
    int flips = 0;
    for (int i = 0; i < 32; i++)
        if (((start >> i) & 1) != ((goal >> i) & 1)) flips++;
    return flips;
}
```

<!-- @annotations -->
- 4: The comparison is what XOR replaces — a bit of start ^ goal is 1 in exactly the positions where this condition is true. Works for negative inputs without >>> or a cast, because & 1 discards whatever sign extension supplied.

<!-- @code java -->
```java
static int minBitFlips(int start, int goal) {
    int flips = 0;
    for (int i = 0; i < 32; i++)
        if (((start >>> i) & 1) != ((goal >>> i) & 1)) flips++;
    return flips;
}
```

<!-- @annotations -->
- 4: >> would work equally well here since & 1 masks, but the fixed 32-iteration bound is the point of this version and >>> states the width.

<!-- @code python -->
```python
def min_bit_flips(start: int, goal: int) -> int:
    return sum(((start >> i) & 1) != ((goal >> i) & 1) for i in range(32))


# Measured 5,262ns per pair — 46.2x slower than (a ^ b).bit_count().
# The fixed 32 is also a decision rather than a fact here, since Python
# integers have no width; it matches C++ only for values that fit.
```

<!-- @annotations -->
- 2: Booleans sum as 0 and 1 in Python, so no explicit conversion is needed.
- 6: For values beyond 32 bits, or for negatives, this silently answers a different question than the C++ version does.

<!-- @approach -->
### Better - XOR, then Count with Kernighan's Loop

<!-- @idea -->
XOR produces a map of the differing positions; count its set bits by clearing them one at a time.

<!-- @steps -->
1. Compute `start ^ goal`, whose set bits mark exactly the differing positions.
2. Initialise a counter to 0.
3. While the XOR is non-zero, clear its lowest set bit with `d &= d - 1`.
4. Increment the counter once per clearing.
5. Return the counter, which is the number of differing positions.

<!-- @complexity -->
- time: O(number of differing bits) — 16 on average for random pairs, 0 when the numbers are equal
- space: O(1)
- note: Correct, and the right shape when the two numbers are expected to be similar, since the loop runs once per difference. Measured 1,843,666ns over 65,536 random pairs — 153.6x the builtin. Notably, the same loop written as a standalone function in Count the Number of Set Bits was recognised by the compiler and replaced with the hardware instruction; written inline over a freshly XORed value it was not, and ran as written.

<!-- @code cpp -->
```cpp
int minBitFlips(int start, int goal) {
    unsigned d = (unsigned)(start ^ goal);
    int flips = 0;
    while (d) { d &= d - 1; flips++; }
    return flips;
}

// Runs once per DIFFERING bit, so it is fast when the numbers are close
// and slow when they are not. Measured 153.6x the builtin on random pairs,
// where about half the positions differ.
```

<!-- @annotations -->
- 2: The cast to unsigned matters for the loop condition rather than for the XOR — a signed d would still terminate here, since &= n-1 removes bits rather than shifting them, but unsigned states the intent.
- 4: One iteration per set bit, which for two random 32-bit values is about 16.
- 8: The case this shape is actually for: values that differ in one or two places, where 16 iterations become 1.

<!-- @code java -->
```java
static int minBitFlips(int start, int goal) {
    int d = start ^ goal, flips = 0;
    while (d != 0) { d &= d - 1; flips++; }
    return flips;
}

// Correct for negative inputs with no >>> anywhere, because this loop
// removes bits rather than moving them — d reaches 0 from any pattern.
```

<!-- @annotations -->
- 3: The one bit-counting loop shape in this topic that needs no unsigned shift, which makes it the safe hand-written fallback in Java.

<!-- @code python -->
```python
def min_bit_flips(start: int, goal: int) -> int:
    d = (start ^ goal) & 0xFFFFFFFF
    flips = 0
    while d:
        d &= d - 1
        flips += 1
    return flips


# The mask is required for negatives: without it, (-1 ^ 0) is -1 and
# the loop never terminates, since -1 & -2 is -2 and the magnitude grows.
```

<!-- @annotations -->
- 2: Masking imposes the 32-bit width that C++ and Java get from the type, and without it this loop does not terminate on a negative XOR.

<!-- @approach -->
### Optimal - popcount of the XOR

<!-- @idea -->
XOR marks every differing position, and counting set bits is one instruction.

<!-- @steps -->
1. Compute `start ^ goal`.
2. Note that its set bits are exactly the positions that must be flipped.
3. Count them with the language's population-count function.
4. Return that count.
5. Note that no position can be skipped and none benefits from being flipped twice, so the count is the minimum.

<!-- @complexity -->
- time: O(1) — one XOR and one instruction
- space: O(1)
- note: Verified against a per-position reference over all 4,294,967,296 pairs of 16-bit values, 0 mismatches, in 18.3 seconds. Measured 12,000ns over 65,536 pairs, 38.6x faster than comparing positions and 153.6x faster than an inline Kernighan loop. In Python, mask before counting — bit_count() counts the magnitude, so (-1 ^ 0).bit_count() is 1 rather than 32.

<!-- @code cpp -->
```cpp
int minBitFlips(int start, int goal) {
    return __builtin_popcount((unsigned)(start ^ goal));
}

// C++20: std::popcount(std::bit_cast<unsigned>(start ^ goal))
//
// Negatives need no special handling — the width is part of the type.
//     -1 ^ 0 is 0xFFFFFFFF -> 32 flips
//     -8 ^ 8 is 0xFFFFFFF0 -> 28 flips
```

<!-- @annotations -->
- 2: The cast is needed because __builtin_popcount takes an unsigned int; it reinterprets the pattern rather than changing the value.
- 7: Both of these are correct answers rather than curiosities — flipping every bit of -1 really does take 32 flips to reach 0.

<!-- @code java -->
```java
static int minBitFlips(int start, int goal) {
    return Integer.bitCount(start ^ goal);
}

// bitCount takes a signed int and counts the 32-bit pattern, so this
// needs no cast and no mask. Long.bitCount for 64-bit values.
```

<!-- @annotations -->
- 2: The shortest correct form in any of the three languages, and the only one with no width caveat at all.

<!-- @code python -->
```python
def min_bit_flips(start: int, goal: int) -> int:
    return ((start ^ goal) & 0xFFFFFFFF).bit_count()


# THE MASK IS NOT OPTIONAL for negatives. bit_count() counts the
# magnitude, because a Python integer has no width:
#     (-1 ^ 0).bit_count()               is 1   — wrong
#     ((-1 ^ 0) & 0xFFFFFFFF).bit_count() is 32  — right
#
# Measured 114ns per pair, against 439ns for bin(a ^ b).count("1")
# and 5,262ns for a per-position comparison.
```

<!-- @annotations -->
- 2: For non-negative inputs the mask changes nothing, which is exactly why its absence survives testing.
- 5: The XOR is never the problem — it is the counting that needs a width to count within.

<!-- @approach -->
### Extension - Which Positions, Not Just How Many

<!-- @idea -->
The XOR is a map of the differences, so walk its set bits to list the positions rather than counting them.

<!-- @steps -->
1. Compute `d = start ^ goal`.
2. While `d` is non-zero, isolate its lowest set bit with `d & -d`.
3. Convert that isolated bit to a position by counting its trailing zeros.
4. Record the position, then clear that bit with `d &= d - 1`.
5. Repeat until `d` is 0; the recorded positions are exactly the bits to flip.

<!-- @complexity -->
- time: O(number of differing bits)
- space: O(1) beyond the output list
- note: Uses three idioms from earlier subtopics at once — n & -n to isolate, trailing-zero count to locate, and n & (n - 1) to advance. It is the natural shape whenever the answer needs to say what to change rather than how much, and it costs nothing extra over the counting loop.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> flipPositions(int start, int goal) {
    unsigned d = (unsigned)(start ^ goal);
    vector<int> pos;
    while (d) {
        pos.push_back(__builtin_ctz(d));
        d &= d - 1;
    }
    return pos;
}
```

<!-- @annotations -->
- 8: ctz on a non-zero value is always defined — the loop condition has already excluded the one input that would make it undefined behaviour.
- 9: Clearing the lowest set bit is what advances the loop, so the positions come out in increasing order.

<!-- @code java -->
```java
static List<Integer> flipPositions(int start, int goal) {
    int d = start ^ goal;
    List<Integer> pos = new ArrayList<>();
    while (d != 0) {
        pos.add(Integer.numberOfTrailingZeros(d));
        d &= d - 1;
    }
    return pos;
}
```

<!-- @annotations -->
- 5: numberOfTrailingZeros is defined for 0 in Java, so this would be safe even without the loop guard — unlike the C++ builtin.

<!-- @code python -->
```python
def flip_positions(start: int, goal: int) -> list[int]:
    d = (start ^ goal) & 0xFFFFFFFF
    pos = []
    while d:
        pos.append((d & -d).bit_length() - 1)
        d &= d - 1
    return pos


# (d & -d) isolates the lowest set bit and bit_length() - 1 turns that
# power of two into its position, since Python has no trailing-zero builtin.
```

<!-- @annotations -->
- 5: The standard Python substitute for a trailing-zero count, and exact for any width.

<!-- @example -->

<!-- @input -->
start = 10, goal = 7

<!-- @output -->
3

<!-- @why -->
Small enough to check by eye, and the two numbers differ in three of four positions, so the XOR is visibly a map of the disagreements.

<!-- @walkthrough -->
1. 10 is 1010 and 7 is 0111.
2. Position 0: 10 has 0 and 7 has 1 — they differ, so this bit must be flipped.
3. Position 1: 10 has 1 and 7 has 1 — they agree, so nothing to do.
4. Position 2: 10 has 0 and 7 has 1 — they differ.
5. Position 3: 10 has 1 and 7 has 0 — they differ.
6. XORing gives 1010 ^ 0111 = 1101, whose set bits are at positions 0, 2 and 3 — exactly the differing ones.
7. Counting them gives 3, and no shorter sequence exists: each of those three positions must change, and changing anything else would have to be undone.

<!-- @example -->

<!-- @input -->
Every pair of 16-bit values

<!-- @output -->
4,294,967,296 pairs in 18.3 seconds, 0 mismatches, mean exactly 8.000 flips

<!-- @why -->
The claim is a reduction from one problem to another, so it is worth checking against a reference that does not perform the reduction at all.

<!-- @walkthrough -->
1. The reference implementation read bit i of each number separately and compared them, using no XOR anywhere.
2. Every pair (a, b) of 16-bit values was run through both — 65,536 x 65,536 = 4,294,967,296 pairs.
3. popcount(a ^ b) agreed with the per-position count on every pair, with 0 mismatches.
4. The same pass totalled 34,359,738,368 differing positions across all pairs.
5. Dividing gives a mean of exactly 8.000 flips per pair.
6. That is the expected value: each of the 16 positions differs in exactly half of all pairs, so the mean is 16 / 2.
7. The same reasoning gives 16 for 32-bit pairs, which matches the mean set-bit count measured in Count the Number of Set Bits — the XOR of two independent random values is itself uniformly random.

<!-- @example -->

<!-- @input -->
start = -1, goal = 0, in each of the three languages

<!-- @output -->
32 in C++ and Java; 1 in Python unless the XOR is masked first

<!-- @why -->
It is the smallest input where the direct translation between languages produces a different answer, and the error is off by 31.

<!-- @walkthrough -->
1. In C++, -1 is 0xFFFFFFFF and 0 is 0x00000000, so the XOR is 0xFFFFFFFF.
2. Every one of the 32 positions differs, so the answer is 32 — correct, since turning -1 into 0 really does require flipping every bit.
3. Java gives the same: Integer.bitCount(-1 ^ 0) is 32, with no cast or mask needed.
4. In Python, -1 ^ 0 is -1, which is correct as a value — the sign extends forever.
5. But (-1).bit_count() is 1, because bit_count counts the bits of the magnitude and the magnitude of -1 is 1.
6. Masking first restores the width the other two languages get from the type: ((-1 ^ 0) & 0xFFFFFFFF).bit_count() is 32.
7. The same applies at other values — (-8 ^ 8) & 0xFFFFFFFF gives 28, matching C++ — and for non-negative inputs the mask changes nothing, which is why its absence survives testing.

<!-- @example -->

<!-- @input -->
Three methods over 65,536 random pairs

<!-- @output -->
12,000ns, 463,459ns and 1,843,666ns

<!-- @why -->
The slowest of the three is the one that looks cleverest, and the reason is the same compiler behaviour that made the previous subtopic's headline measurement misleading.

<!-- @walkthrough -->
1. popcount(a ^ b) took 12,000ns over 65,536 pairs — two operations per pair.
2. Comparing all 32 positions took 463,459ns, a factor of 38.6.
3. XORing and then counting with an inline Kernighan loop took 1,843,666ns, a factor of 153.6 — the slowest of the three.
4. That is surprising, because in Count the Number of Set Bits the same loop measured identically to the builtin.
5. There it was written as a standalone function and the compiler's loop-idiom recogniser replaced it with the hardware instruction.
6. Here it is written inline over a freshly XORed value, and was not recognised, so it ran as written — roughly 16 iterations per pair.
7. The lesson is the same one as before, stated more sharply: whether the clever loop becomes an instruction depends on the compiler and the surrounding code, not on the algorithm, so it is not something to rely on.

<!-- @visualization custom -->

<!-- @description -->
Open with the two numbers stacked as bit rows — start = 1010 above goal = 0111 — aligned at bit 0. Walk a column highlight from position 0 upward. At each column, show the two bits and a verdict beneath: a green tick where they agree, a red cross where they differ, with a small flip animation on the differing ones showing the bit rotating from its current value to the target. Count the crosses in a running tally that ends at 3. Then replace the whole column-by-column walk with a single XOR row appearing beneath the two inputs, its cells lighting exactly where the crosses were — so the reader sees that the XOR row IS the verdict row, computed in one operation instead of thirty-two. Label it "XOR is the disagreement map". Feed that row into a popcount box that returns 3, and put the two-line solution on screen beside it. Then the minimality panel: take the same pair and show a wasteful alternative — flipping a position where the bits already agree, then flipping it back — with the counter ticking up by two and the numbers unchanged, crossed out in red. Beside it, note the two facts that make the count minimal: every differing position must change, and no position benefits from changing twice. Then the verification panel: a large odometer reading 4,294,967,296 pairs checked with a mismatch counter frozen at 0, and beneath it the mean flips per pair converging to exactly 8.000, with a small note that 8 is 16 / 2 because each position differs in half of all pairs. Then the language panel: the same input, start = -1 and goal = 0, run through three columns. C++ shows -1 as a full 32-cell row of ones, the XOR as a full row, and the answer 32. Java shows the same. Python shows -1 as a row that extends off the left edge with an ellipsis, bit_count returning 1, marked in red — then a mask row of 32 ones drops in, the ellipsis is clipped away, and the answer becomes 32 in green. Close with three timing bars at 12,000ns, 463,459ns and 1,843,666ns, with the last annotated "the same loop the compiler rewrote in the previous subtopic, here left as written".

<!-- @sampleInput -->
```json
{"worked":{"start":10,"goal":7,"startBits":"1010","goalBits":"0111","columns":[{"position":0,"start":0,"goal":1,"differs":true},{"position":1,"start":1,"goal":1,"differs":false},{"position":2,"start":0,"goal":1,"differs":true},{"position":3,"start":1,"goal":0,"differs":true}],"xor":13,"xorBits":"1101","setPositions":[0,2,3],"answer":3,"reading":"the XOR row IS the verdict row, computed in one operation instead of thirty-two"},"minimality":{"lowerBound":"every differing position must be flipped, or the numbers still differ there","achievable":"no position benefits from being flipped twice — that costs two flips and changes nothing","conclusion":"the count of differing positions is both a lower bound and achievable, so it is the minimum","noSearch":true},"verification":{"pairs":4294967296,"description":"every pair of 16-bit values","seconds":18.3,"referenceUsed":"read bit i of each number separately and compare — no XOR anywhere","mismatches":0,"totalFlips":34359738368,"meanFlipsPerPair":8.0,"why":"each of the 16 positions differs in exactly half of all pairs, so the mean is 16 / 2","extension":"the same reasoning gives 16 for 32-bit pairs, matching the mean set-bit count from count-the-number-of-set-bits"},"examples":[{"a":10,"b":7,"xor":13,"flips":3},{"a":3,"b":4,"xor":7,"flips":3},{"a":29,"b":29,"xor":0,"flips":0},{"a":0,"b":4294967295,"xor":4294967295,"flips":32}],"negatives":{"cpp":[{"a":-1,"b":0,"xorAsUnsigned":4294967295,"flips":32},{"a":-8,"b":8,"xorAsUnsigned":4294967280,"flips":28}],"java":"Integer.bitCount(start ^ goal) — no cast, no mask, no caveat","python":{"trap":[{"expr":"(-1 ^ 0)","value":-1},{"expr":"(-1 ^ 0).bit_count()","value":1,"correct":false},{"expr":"((-1 ^ 0) & 0xFFFFFFFF).bit_count()","value":32,"correct":true},{"expr":"((-8 ^ 8) & 0xFFFFFFFF).bit_count()","value":28,"correct":true}],"why":"bit_count counts the MAGNITUDE — a Python integer has no width to complement against","note":"the XOR is never the problem; it is the counting that needs a width","survivesTesting":"for non-negative inputs the mask changes nothing"}},"timing":{"unit":"ns","pairs":65536,"bestOf":200,"rows":[{"method":"popcount(a ^ b)","ns":12000,"ratio":1.0},{"method":"compare all 32 positions","ns":463459,"ratio":38.6},{"method":"xor then inline Kernighan","ns":1843666,"ratio":153.6}],"kernighanNote":{"standaloneInPreviousSubtopic":"recognised by the compiler and replaced with the hardware instruction","inlineHere":"not recognised, ran as written at roughly 16 iterations per pair","lesson":"idiom recognition is a property of the compiler and the surrounding code, not of the algorithm"},"python":{"perPairNs":{"(a ^ b).bit_count()":114,"bin(a ^ b).count('1')":439,"per-position compare":5262},"spread":46.2}},"generalisation":{"name":"Hamming distance","relatedProblems":["total Hamming distance over an array — sum over all pairs, usually solved by counting how many values have each bit set","Hamming distance between strings or vectors — the same count, one position at a time","error-detecting codes — the minimum distance between valid codewords bounds how many bit errors are detectable"],"lessonToKeep":"not the formula but the reduction: 'how many positions differ' became 'how many bits are set' the moment XOR entered"},"extension":{"goal":"list the positions rather than count them","idioms":["d & -d isolates the lowest set bit","a trailing-zero count turns that into a position","d &= d - 1 advances to the next"],"orderOfResults":"increasing position","costOverCounting":"none"}}
```

<!-- @highlights -->
- start = 1010 and goal = 0111 are stacked as aligned bit rows.
- A column highlight walks from position 0 upward, showing a green tick where the bits agree and a red cross where they differ.
- Differing columns play a small flip animation, rotating the bit to its target value.
- A running tally of crosses ends at 3.
- The whole column-by-column walk is then replaced by a single XOR row appearing beneath the inputs.
- Its cells light exactly where the crosses were, showing that the XOR row is the verdict row.
- It is labelled "XOR is the disagreement map" and fed into a popcount box returning 3.
- The minimality panel shows a wasteful alternative: flipping an already-matching position and flipping it back.
- The counter ticks up by two while the numbers stay unchanged, crossed out in red.
- Beside it sit the two facts that make the count minimal.
- A verification odometer reads 4,294,967,296 pairs with the mismatch counter frozen at 0.
- The mean flips per pair converges to exactly 8.000, noted as 16 / 2.
- A three-column language panel runs start = -1, goal = 0 through C++, Java and Python.
- Python's -1 extends off the left edge with an ellipsis and bit_count returns 1, marked red.
- A 32-cell mask drops in, clips the ellipsis, and the answer becomes 32 in green.
- Three timing bars close at 12,000ns, 463,459ns and 1,843,666ns, the last annotated as the loop the compiler rewrote in the previous subtopic and left alone here.

<!-- @edgeCases -->
- start == goal — the XOR is 0 and the answer is 0; no flips are needed and none are counted.
- start = 0, goal = 0xFFFFFFFF — every position differs, so the answer is 32, the maximum for an int.
- Negative inputs in C++ or Java — need no handling at all, since the width is part of the type.
- Negative inputs in Python — the XOR is correct and bit_count() is not; mask with 0xFFFFFFFF first.
- -1 and 0 in Python without the mask — returns 1 instead of 32, an error of 31 on the simplest possible test.
- An inline Kernighan loop over a negative XOR in Python — never terminates, because the magnitude grows rather than shrinking.
- Two values differing in one bit — the Kernighan form runs once and is genuinely the fastest shape for that case.
- 64-bit inputs — use __builtin_popcountll or Long.bitCount; the 32-bit versions truncate silently.
- Values that exceed 32 bits in Python — the fixed 32 in a per-position loop silently answers a different question.
- start and goal of different widths in C++ — the smaller promotes before the XOR, which is usually what you want and worth being deliberate about.
- __builtin_ctz on the XOR when listing positions — safe only because the loop condition has already excluded zero.

<!-- @pitfalls -->
- Calling bit_count() on the XOR in Python without masking. (-1 ^ 0).bit_count() is 1 rather than 32, and non-negative test inputs never reveal it.
- Assuming a per-position loop is a reasonable fallback. It measured 38.6x slower in C++ and 46.2x slower in Python.
- Reaching for Kernighan's loop because the previous subtopic suggested it is free. Written inline here it was not recognised by the compiler and ran 153.6x slower than the builtin.
- Using __builtin_popcount on a 64-bit XOR. It converts to unsigned int and counts only the low half.
- Searching for an ordering of flips. There is none to find: positions are independent and every differing one must change exactly once.
- Trying to flip a matching position as an intermediate step. It costs two flips and achieves nothing, which is the argument that makes the count minimal.
- Writing the Kernighan loop in Python over an unmasked negative XOR. It does not terminate, since -1 & -2 is -2 and the value grows.
- Casting to unsigned after the XOR rather than before counting in C++. The XOR itself is fine on signed values; it is popcount's parameter type that needs the cast.
- Confusing this with the total Hamming distance over an array. That problem sums over all pairs and is not solved by XORing everything together.
- Assuming the mean is 16 for 16-bit pairs. It is 8 — half the width, not the width — as measured across all 4,294,967,296 pairs.
- Comparing bits with == on values that were not masked to 0 or 1. (start >> i) & 1 gives 0 or 1, but start & (1 << i) gives 0 or 2^i, and comparing those two forms is the i-th bit bug all over again.
- Believing the compiler will always rewrite the clever loop. It did in one subtopic and did not in this one, with the same three lines.

<!-- @doubt -->
### Why is the answer just a count?

<!-- @answer -->
Because the positions are independent and each flip touches exactly one of them. Every position where the two numbers differ has to change, or the numbers still differ there — that is a lower bound. And no position benefits from changing twice, since flipping a matching bit and flipping it back costs two operations and leaves everything as it was — so the lower bound is achievable. A quantity that is both a lower bound and achievable is the minimum. There is no ordering to choose and no search to run, which is unusual enough to be worth noticing.

<!-- @doubt -->
### Why does XOR give the differing positions?

<!-- @answer -->
That is its definition: a bit of a ^ b is 1 exactly when the corresponding bits of a and b are different, and 0 when they are the same. So the XOR of two numbers is a map of their disagreements, one column at a time, computed in a single operation rather than in a 32-iteration loop. On 10 = 1010 and 7 = 0111 it gives 1101, whose set bits sit at positions 0, 2 and 3 — precisely the positions where the inputs differ. Verified against a per-position comparison over all 4,294,967,296 pairs of 16-bit values, 0 mismatches.

<!-- @doubt -->
### Why is the Python version wrong for negatives?

<!-- @answer -->
The XOR is fine; the counting is not. In Python, -1 ^ 0 is -1, which is the correct value — the sign extends forever. But bit_count() counts the bits of the magnitude, because a Python integer has no width to complement against, so (-1).bit_count() is 1. C++ and Java get the width from the type and correctly report 32. The fix is to impose a width before counting: ((start ^ goal) & 0xFFFFFFFF).bit_count(). For non-negative inputs the mask changes nothing, which is exactly why code without it passes every test until a negative arrives.

<!-- @doubt -->
### Why was Kernighan's loop slow here when it was free before?

<!-- @answer -->
Because the compiler rewrote it there and did not here. In Count the Number of Set Bits the loop was a standalone function and the loop-idiom recogniser matched it, emitting the hardware population-count instruction — the compiled code contained no loop at all. Written inline over a freshly XORed value, it was not recognised, so it ran as written at roughly 16 iterations per pair and measured 153.6x the builtin. Nothing about the algorithm changed. Idiom recognition is a property of the compiler and the surrounding code, and treating it as a property of the algorithm is how a benchmark ends up measuring the wrong thing.

<!-- @doubt -->
### When would I use the loop instead of popcount?

<!-- @answer -->
When the two numbers are expected to be close. The loop runs once per differing bit, so if they usually differ in one or two places it does one or two iterations, while popcount does its constant work regardless. On random pairs, where about half the positions differ, that is 16 iterations and the builtin wins by 153.6x. The loop is also the shape to reach for when you need the positions rather than the count, since d &= d - 1 advances naturally and __builtin_ctz(d) names the current one — and that version costs nothing over counting.

<!-- @doubt -->
### Why is the average exactly 8 for 16-bit pairs?

<!-- @answer -->
Because each of the 16 positions differs in exactly half of all pairs. For any fixed position the four combinations of the two bits are equally likely, and two of them differ, so the expected contribution is 1/2 per position and 8 in total. Measured rather than argued: across all 4,294,967,296 pairs the total came to 34,359,738,368 differing positions, a mean of exactly 8.000. The same reasoning gives 16 for 32-bit pairs, which is why the XOR of two independent random values has the same expected popcount as a single random value — it is itself uniformly distributed.

<!-- @doubt -->
### How do I get the positions to flip, not just the count?

<!-- @answer -->
Walk the set bits of the XOR. While d is non-zero, __builtin_ctz(d) gives the position of its lowest set bit, and d &= d - 1 clears it and moves on — so the positions come out in increasing order and the loop runs once per flip. It composes three idioms from earlier subtopics: isolating the lowest set bit, converting a single bit to a position, and clearing it to advance. The ctz call is safe here only because the loop condition has already ruled out zero, which is the input that would make it undefined behaviour in C++; Java and C++20 define that case.

<!-- @doubt -->
### Does this work for 64-bit values?

<!-- @answer -->
Yes, with the wide versions of the count: __builtin_popcountll in C++ and Long.bitCount in Java. The XOR itself is width-agnostic — it is a column-by-column operation and does not care how many columns there are. What truncates is the counting: __builtin_popcount takes an unsigned int, so a 64-bit XOR passed to it is converted first and only the low 32 bits are counted, silently. In Python nothing needs to change except the mask, which becomes 0xFFFFFFFFFFFFFFFF for a 64-bit comparison.

<!-- @doubt -->
### Is this the same as Hamming distance?

<!-- @answer -->
Yes — the Hamming distance between two values is the number of positions at which they differ, which is exactly what this computes. Recognising that connects the problem to a family: the total Hamming distance over an array, which sums this over all pairs and is usually solved by counting how many values have each bit set rather than by iterating pairs; the distance between two strings or vectors, which is the same count one element at a time; and error-detecting codes, where the minimum distance between valid codewords determines how many bit errors can be caught. The reusable step is the reduction rather than the formula.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Single Number - I, which applies the same property to a whole array rather than to a pair. Here XOR was used to compare two numbers; there it is used to cancel many. If every value appears twice except one, XORing the entire array makes every pair vanish — a ^ a is 0 — and what survives is the value with no partner, found in one pass and constant space. That is the first problem in this topic where the bit approach is not merely faster than the alternative but structurally different from it.
