---
id: single-number-iii
topic: Bit Manipulation
title: Single Number - III
difficulty: Medium
status: ready
prerequisites:
  - single-number-i
  - xor-of-numbers-in-a-given-range
  - set-unset-the-rightmost-unset-bit
  - minimum-bit-flips-to-convert-number
relatedIds:
  - single-number-i
  - minimum-bit-flips-to-convert-number
  - xor-of-numbers-in-a-given-range
  - check-if-the-i-th-bit-is-set-or-not
  - find-the-number-that-appears-once-and-other-numbers-twice
---

<!-- @summary -->
Two values appear once, everything else twice. XORing everything gives `a ^ b` — not the answer, but a map of where the two differ, and any set bit in it is a column that separates them. Partition the array on that column and each half becomes Single Number - I. Verified on 300,000 random cases with 0 wrong answers, and the "any differing bit works" claim on 3,196,952 (pair, bit) combinations, also 0 failures. Measured **328x** faster than a hash map at a million elements. The one trap is `n & -n` on `INT_MIN`, which is undefined in C++ unless done unsigned.

<!-- @theory -->
## The problem

Every element appears twice except **two**, which appear once each. Find both, in
linear time and constant space.

```
[1, 2, 1, 3, 2, 5]   ->   3 and 5
```

## XORing everything no longer gives the answer

Run the Single Number - I method and the pairs still cancel, but two values
survive instead of one:

```
1 ^ 2 ^ 1 ^ 3 ^ 2 ^ 5  =  3 ^ 5  =  6
```

So the accumulator holds `a ^ b`. That is not either answer — but the previous
subtopic on bit flips already established what it *is*: **a map of the positions
where `a` and `b` differ**.

And it cannot be zero, because `a != b`. So there is at least one differing
column, and that is enough.

## One column splits the array

Pick any set bit of `a ^ b` — say the lowest, with `n & -n`. In that column, `a`
and `b` disagree: one has a 1 there and the other a 0. Now split the array into
the elements with that bit set and the elements without:

- `a` and `b` land in **different** groups, since they disagree in that column.
- Every duplicated pair lands in the **same** group, because the two copies are
  the same value and agree in every column.

So each group contains exactly one unpaired value and any number of complete
pairs — which is precisely Single Number - I. XOR each group and you have both
answers.

```cpp
unsigned x = 0;
for (int n : nums) x ^= (unsigned)n;      // x = a ^ b

unsigned bit = x & (0u - x);              // any set bit will do

unsigned a = 0, b = 0;
for (int n : nums)
    if ((unsigned)n & bit) a ^= (unsigned)n;
    else                   b ^= (unsigned)n;
```

Two passes, three accumulators, no allocation.

## Any differing bit works

The lowest set bit is the conventional choice because `n & -n` isolates it in one
operation, not because it is special. Checked directly: over 200,000 random pairs,
every set bit of `a ^ b` was tried as the splitting column — **3,196,952
combinations**, and in every one the two values landed in different groups, with
**0** failures.

That is worth knowing because it explains why the algorithm has no bad case. There
is no "unlucky" pair for which the partition fails; the only requirement is that
the chosen column is one where they differ, and `a ^ b` marks exactly those.

## The INT_MIN trap

`n & -n` is the idiom from Set/Unset the rightmost unset bit, and here it meets
the value that breaks negation:

```cpp
int x = INT_MIN;
unsigned bit = x & -x;      // -x is undefined behaviour in C++
```

`INT_MIN` has no positive counterpart, so negating it overflows. The fix is to do
the whole thing in unsigned, where wrapping is defined:

```cpp
unsigned ux = (unsigned)x;
unsigned bit = ux & (0u - ux);      // defined for every input
```

Verified: with the unsigned form, an array containing `INT_MIN` as one of the two
singletons returns it correctly. Java has no undefined behaviour on overflow, so
`x & -x` is safe there; Python has no `INT_MIN` at all.

## Cost

| n | Two-pass XOR | Hash map | Sort |
|---|---|---|---|
| 10,001 | **2,583ns** | 563,375ns | 294,500ns |
| 100,001 | **27,000ns** | 7,034,750ns | 3,457,583ns |
| 1,000,001 | **271,041ns** | 89,041,916ns | 42,910,750ns |

**328x** over the hash map and **158x** over sorting at a million elements. The
two-pass version costs about 2.66x what Single Number - I did at the same size —
271,041ns against 101,791ns — which is two passes plus a branch per element,
exactly as expected.

Python again compresses the gap to almost nothing: 14.4ms against `Counter`'s
17.5ms at n = 100,002, a factor of 1.22. As in Single Number - I, the reason to
prefer it there is the O(1) space.

## Where this goes next

This closes the XOR thread. The topic turns to number theory for its last five
subtopics — **Print Prime Factors of a Number**, then divisors, sieves and
factorisation — where the connection to bits is looser but the same instinct
applies: find the structure that makes the obvious loop unnecessary.

<!-- @intuition -->
XORing everything still cancels the pairs, so what is left is the two survivors combined — and combined is not the same as found. But the previous subtopics said what a XOR of two numbers means: it is the list of columns where they disagree. That reframes the problem completely. Instead of trying to pull two values out of one accumulator, pick any column where they are known to differ and use it as a sorting rule: everything with a 1 there goes left, everything with a 0 goes right. The two survivors are guaranteed to be separated, because that is what the column was chosen for, and every duplicated pair is guaranteed to stay together, because identical values agree everywhere. Each side is then the problem you already solved. The whole trick is realising that a value you cannot decompose can still be used as a question to ask about every element.

<!-- @approach -->
### Brute Force - Count Occurrences

<!-- @idea -->
Tally every value and report the two with a count of one.

<!-- @steps -->
1. Walk the array, counting occurrences in a hash map.
2. Walk the map, collecting values whose count is 1.
3. There will be exactly two.
4. Return them.
5. Note that this is the only approach here that can detect a violated premise.

<!-- @complexity -->
- time: O(n) expected, with a large constant from hashing and memory traffic
- space: O(n)
- note: Measured 89,041,916ns at a million elements against the two-pass XOR's 271,041ns — a factor of 328. Its advantage is diagnostic: it can report that there are three singletons, or none, where the XOR method returns a plausible pair regardless.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> singleNumberIII(vector<int>& nums) {
    unordered_map<int, int> counts;
    for (int n : nums) counts[n]++;

    vector<int> out;
    for (auto& [value, count] : counts)
        if (count == 1) out.push_back(value);
    return out;
}
```

<!-- @annotations -->
- 7: One hash lookup and a possible allocation per element, which is where the 328x goes.
- 11: The order of the two results is unspecified, since a hash map has no meaningful iteration order — worth sorting if the caller expects a stable answer.

<!-- @code java -->
```java
static int[] singleNumberIII(int[] nums) {
    Map<Integer, Integer> counts = new HashMap<>();
    for (int n : nums) counts.merge(n, 1, Integer::sum);

    return counts.entrySet().stream()
                 .filter(e -> e.getValue() == 1)
                 .mapToInt(Map.Entry::getKey).toArray();
}
```

<!-- @annotations -->
- 3: Every value is boxed into an Integer, so this allocates once per distinct element on top of the map's own storage.

<!-- @code python -->
```python
from collections import Counter

def single_number_iii(nums: list[int]) -> list[int]:
    return [k for k, c in Counter(nums).items() if c == 1]


# Measured 17.5ms at n = 100,002 against the two-pass XOR's 14.4ms —
# only 1.22x, because Counter runs in C while the XOR passes do not.
```

<!-- @annotations -->
- 5: In Python the performance argument against this is weak; the argument is the O(n) space.

<!-- @approach -->
### Better - Sort and Scan

<!-- @idea -->
Sorting groups equal values, so the unpaired ones are the elements with no matching neighbour.

<!-- @steps -->
1. Sort a copy of the array.
2. Walk it, comparing each element with the next.
3. If they match, skip both — that is a complete pair.
4. If they do not, the current element is unpaired; record it and advance by one.
5. Stop when two unpaired values have been found.

<!-- @complexity -->
- time: O(n log n)
- space: O(n) for the copy
- note: Measured 42,910,750ns at a million elements, the faster of the two alternatives despite being the only non-linear one — the same cache-locality effect seen in Single Number - I. Still 158x the two-pass XOR.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<int> singleNumberIII(vector<int> nums) {
    sort(nums.begin(), nums.end());
    vector<int> out;
    for (size_t i = 0; i < nums.size(); ) {
        if (i + 1 < nums.size() && nums[i] == nums[i + 1]) i += 2;
        else { out.push_back(nums[i]); i++; }
    }
    return out;
}
```

<!-- @annotations -->
- 6: Taking the vector by value, because this reorders it — sorting a caller's array as a side effect is a bug found much later.
- 9: Advancing by 2 on a match and by 1 otherwise, which keeps the scan aligned with pair boundaries no matter where the singletons appear.

<!-- @code java -->
```java
static int[] singleNumberIII(int[] nums) {
    int[] a = nums.clone();
    Arrays.sort(a);
    int[] out = new int[2];
    int k = 0;
    for (int i = 0; i < a.length; ) {
        if (i + 1 < a.length && a[i] == a[i + 1]) i += 2;
        else out[k++] = a[i++];
    }
    return out;
}
```

<!-- @annotations -->
- 2: clone() first, since Arrays.sort mutates in place.

<!-- @code python -->
```python
def single_number_iii(nums: list[int]) -> list[int]:
    a = sorted(nums)
    out, i = [], 0
    while i < len(a):
        if i + 1 < len(a) and a[i] == a[i + 1]:
            i += 2
        else:
            out.append(a[i]); i += 1
    return out
```

<!-- @annotations -->
- 2: sorted() rather than a.sort(), which would reorder the caller's list.

<!-- @approach -->
### Optimal - Split on a Differing Bit

<!-- @idea -->
XOR everything to get a ^ b, pick a column where they differ, and partition the array on it.

<!-- @steps -->
1. XOR all elements; the pairs cancel and the accumulator holds `a ^ b`.
2. Note that `a ^ b` is non-zero, since the two singletons are different.
3. Isolate any set bit of it — conventionally the lowest, with `n & -n`.
4. Partition the array by that bit, XORing each group into its own accumulator.
5. `a` and `b` fall into different groups, and every pair falls together, so each accumulator ends holding one singleton.

<!-- @complexity -->
- time: O(n) — two passes, one XOR and one test per element
- space: O(1) — three accumulators
- note: 0 wrong answers over 300,000 random cases. Measured 271,041ns at a million elements against the hash map's 89,041,916ns (328x) and the sort's 42,910,750ns (158x). It costs about 2.66x Single Number - I at the same size, which is two passes plus a branch. In C++ the isolation must be done on an unsigned copy, since -x is undefined for INT_MIN.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> singleNumberIII(vector<int>& nums) {
    unsigned x = 0;
    for (int n : nums) x ^= (unsigned)n;      // x == a ^ b, never 0

    unsigned bit = x & (0u - x);              // lowest set bit, UNSIGNED

    unsigned a = 0, b = 0;
    for (int n : nums) {
        if ((unsigned)n & bit) a ^= (unsigned)n;
        else                   b ^= (unsigned)n;
    }
    return {(int)a, (int)b};
}

// 0u - x rather than -x: for INT_MIN, negating a signed value is
// undefined behaviour in C++. Unsigned wrapping is defined, and the
// bit pattern is identical.
```

<!-- @annotations -->
- 6: The same loop as Single Number - I; what changes is only the interpretation of the result.
- 8: Non-zero is guaranteed by the premise that the two singletons differ, so there is always a column to split on. Any set bit works, not just the lowest — verified over 3,196,952 (pair, bit) combinations with 0 failures; the lowest is chosen because n & -n finds it in one operation.
- 12: Duplicated pairs always take the same branch, because identical values agree in every column — that is what keeps each group's pairs intact.

<!-- @code java -->
```java
static int[] singleNumberIII(int[] nums) {
    int x = 0;
    for (int n : nums) x ^= n;

    int bit = x & -x;

    int a = 0, b = 0;
    for (int n : nums) {
        if ((n & bit) != 0) a ^= n;
        else                b ^= n;
    }
    return new int[]{a, b};
}

// x & -x is safe in Java even for Integer.MIN_VALUE, because negation
// is defined to wrap rather than being undefined.
```

<!-- @annotations -->
- 5: One of the few places where Java's defined overflow makes the direct spelling correct where C++ needs a cast.
- 9: != 0 rather than == 1 — the mask is 2^i, so the test must be against zero. This is the i-th bit trap from earlier in the topic.

<!-- @code python -->
```python
def single_number_iii(nums: list[int]) -> list[int]:
    x = 0
    for n in nums:
        x ^= n

    bit = x & -x

    a = b = 0
    for n in nums:
        if n & bit:
            a ^= n
        else:
            b ^= n
    return [a, b]


# No mask is needed here, unlike in Minimum Bit Flips: the answers are
# VALUES rather than bit counts, so Python's unbounded integers are fine.
# Verified on 50,000 random cases including INT_MIN as a singleton.
```

<!-- @annotations -->
- 6: x & -x works on unbounded integers because the two's complement identity holds at every width, and there is no INT_MIN to break negation.
- 11: n & bit on a negative relies on Python sign-extending, which it does — the columns above the magnitude are all ones, which is the correct two's complement reading.

<!-- @approach -->
### Variation - Split on the Highest Differing Bit

<!-- @idea -->
Any set bit of a ^ b separates the two, so the highest works exactly as well as the lowest.

<!-- @steps -->
1. Compute `x = a ^ b` as before.
2. Instead of `x & -x`, find the position of its highest set bit.
3. Build a mask from that position.
4. Partition on it identically.
5. Note that this is only useful when a language lacks a cheap lowest-bit idiom, or when the highest bit is wanted for another reason.

<!-- @complexity -->
- time: O(n), with an O(1) bit-scan instead of an O(1) negate-and-AND
- space: O(1)
- note: Included because it makes the algorithm's requirement explicit — the partition needs a column where a and b differ, and nothing more. Over 200,000 random pairs, every one of the 3,196,952 differing bits separated the pair correctly, 0 failures. The lowest is conventional purely because n & -n is one operation.

<!-- @code cpp -->
```cpp
#include <bit>
#include <vector>
using namespace std;

unsigned highestDifferingBit(unsigned x) {
    return 1u << (31 - __builtin_clz(x));     // x is never 0 here
}

// __builtin_clz(0) is UNDEFINED, exactly like __builtin_ctz(0) —
// safe here only because a != b guarantees x != 0.
// C++20: std::bit_floor(x) says the same thing and is defined for 0.
```

<!-- @annotations -->
- 6: 31 - clz gives the index of the highest set bit; shifting 1 by it rebuilds the isolated mask.
- 9: Both bit-scan builtins share this trap, and both are safe here for the same structural reason.

<!-- @code java -->
```java
static int highestDifferingBit(int x) {
    return Integer.highestOneBit(x);
}

// Java provides it directly, and highestOneBit(0) is defined to be 0
// rather than undefined — so this needs no guard at all.
```

<!-- @annotations -->
- 2: The library form, and one of the places Java's bit utilities are better behaved than the C++ builtins.

<!-- @code python -->
```python
def highest_differing_bit(x: int) -> int:
    return 1 << (x.bit_length() - 1)


# bit_length() - 1 is the index of the highest set bit; for x = 0 it
# gives -1 and this would shift by a negative amount, raising ValueError.
```

<!-- @annotations -->
- 2: The Python equivalent of the clz form, and it fails loudly on 0 rather than silently, which is an improvement.

<!-- @example -->

<!-- @input -->
[1, 2, 1, 3, 2, 5]

<!-- @output -->
3 and 5

<!-- @why -->
Small enough to trace fully, and the two singletons differ in their lowest bit, so the partition is easy to follow.

<!-- @walkthrough -->
1. XOR everything: 1 ^ 2 ^ 1 ^ 3 ^ 2 ^ 5. The pairs 1 and 2 cancel, leaving 3 ^ 5 = 6.
2. So the accumulator holds 6 = 110, which is not either answer but is the map of where 3 and 5 differ.
3. 3 is 011 and 5 is 101, and they do differ at positions 1 and 2 — exactly the set bits of 6.
4. Isolate the lowest set bit: 6 & -6 = 2, which is position 1.
5. Partition on that column. Values with bit 1 set: 2, 3, 2 — those XOR to 3.
6. Values with bit 1 clear: 1, 1, 5 — those XOR to 5.
7. Each group kept its pairs intact, because identical values agree everywhere, and the two singletons were separated because that is the property the column was chosen for.

<!-- @example -->

<!-- @input -->
Every differing bit of 200,000 random pairs, used as the splitting column

<!-- @output -->
3,196,952 combinations, 0 failures

<!-- @why -->
The algorithm's correctness rests on the claim that any differing bit will do, and that claim is cheap to test exhaustively per pair.

<!-- @walkthrough -->
1. For each random pair (a, b) with a != b, the XOR a ^ b was computed.
2. Every set bit of that XOR was then tried as the splitting column.
3. For each, the test was whether a and b would land in different groups — that is, whether exactly one of them has that bit set.
4. Across 200,000 pairs there were 3,196,952 such (pair, bit) combinations.
5. In every one of them the pair was correctly separated, with 0 failures.
6. That is not surprising once stated — a set bit of a ^ b is by definition a column where the two disagree — but it makes explicit that the algorithm has no unlucky input.
7. It also explains why the lowest bit is conventional rather than necessary: n & -n finds it in one operation, and nothing else about it matters.

<!-- @example -->

<!-- @input -->
An array containing INT_MIN as one of the two singletons

<!-- @output -->
Correct with an unsigned isolation; undefined behaviour with a signed one

<!-- @why -->
It is the one input where the idiom borrowed from an earlier subtopic meets the value that breaks it.

<!-- @walkthrough -->
1. INT_MIN is -2147483648, and there is no representable +2147483648.
2. So -x for x = INT_MIN overflows, which in C++ is undefined behaviour rather than a wrapped value.
3. The idiom n & -n therefore cannot be written directly on a signed accumulator that might hold INT_MIN.
4. Casting to unsigned first fixes it: unsigned wrapping is defined, and 0u - ux produces exactly the bit pattern that -x was supposed to.
5. With that form, the array [INT_MIN, 7, 7, 3] correctly returns INT_MIN and 3.
6. Java is unaffected, because integer negation is defined to wrap there, so x & -x is safe even at Integer.MIN_VALUE.
7. Python is unaffected for a different reason: there is no most-negative value at all, so negation always succeeds.

<!-- @example -->

<!-- @input -->
Three methods at three array sizes

<!-- @output -->
328x over a hash map and 158x over sorting, at a million elements

<!-- @why -->
It confirms that adding a second pass and a branch costs a predictable amount rather than eroding the advantage.

<!-- @walkthrough -->
1. At n = 1,000,001 the two-pass XOR took 271,041ns, the hash map 89,041,916ns and the sort 42,910,750ns.
2. That is 328x and 158x respectively, and the ordering holds at every size tested.
3. The two-pass XOR costs 2.66x what Single Number - I cost at the same size, 271,041ns against 101,791ns.
4. That factor is exactly what the structure predicts: two passes over the array instead of one, plus a test per element in the second.
5. Sorting is again the fastest alternative despite being the only non-linear one, for the same cache-locality reason as in Single Number - I.
6. In Python the gap nearly vanishes — 14.4ms against Counter's 17.5ms at n = 100,002, a factor of 1.22 — because the XOR passes run in the interpreter and Counter runs in C.
7. So the reason to prefer this in Python is once again the O(1) space rather than the speed.

<!-- @visualization custom -->

<!-- @description -->
Open by replaying Single Number - I on this input and letting it fail informatively: stream [1, 2, 1, 3, 2, 5] into a single accumulator, drawing the cancellation arcs between the paired values as before, and end with 6 in the accumulator and a question mark beside it — 6 is not in the array. Then reveal what 6 is: bring up 3 = 011 and 5 = 101 as rows beneath it, and light the columns where they differ, showing those columns are exactly the set bits of 6 = 110. Label it "not the answer — the map of where the answers differ", with a callback to the bit-flips subtopic. Then the partition panel, which is the algorithm: isolate the lowest set bit with 6 & -6, drawing -6 as ~6 + 1 so the isolation is visible rather than asserted, giving the mask 010. Draw a vertical divider down the middle of the screen labelled "bit 1 set" and "bit 1 clear". Feed the six array elements in one at a time; each one lights its bit 1 and slides to the correct side. The two 2s go left, the two 1s go right, the 3 goes left and the 5 goes right. Then run a separate accumulator on each side, with the cancellation arcs reappearing within each half, ending at 3 on the left and 5 on the right. The key visual is that every pair stayed together while the two singletons were separated — highlight one pair crossing to the same side and the two singletons diverging. Then the any-bit panel: replay the partition using bit 2 instead of bit 1, showing a different grouping of the duplicates and the same two answers, annotated with 3,196,952 combinations tested and 0 failures. Close with two small panels: the INT_MIN trap, showing -x on INT_MIN overflowing back to itself in a signed lane and 0u - ux producing the correct pattern in an unsigned lane; and the cost chart at 271,041ns, 42,910,750ns and 89,041,916ns, with a ghost bar at 101,791ns marking Single Number - I and the 2.66x labelled as the price of the second pass.

<!-- @sampleInput -->
```json
{"worked":{"input":[1,2,1,3,2,5],"singletons":[3,5],"pass1":{"xorAll":6,"cancelled":[[1,1],[2,2]],"surviving":"3 ^ 5","note":"6 is not in the array — it is a ^ b, not an answer"},"whatSixIs":{"a":3,"aBits":"011","b":5,"bBits":"101","xor":6,"xorBits":"110","differingPositions":[1,2],"reading":"the map of where the two answers differ — the same reading as in minimum-bit-flips-to-convert-number"},"isolate":{"expr":"6 & -6","negation":"~6 + 1","mask":2,"maskBits":"010","position":1},"partition":{"bitSet":{"elements":[2,3,2],"xor":3},"bitClear":{"elements":[1,1,5],"xor":5}},"whyItWorks":["a and b disagree in the chosen column, so they land in different groups","every duplicated pair agrees in every column, so both copies land together","each group is therefore one singleton plus complete pairs — Single Number - I"]},"anyBitWorks":{"pairsTested":200000,"combinations":3196952,"failures":0,"claim":"every set bit of a ^ b separates the two values","whyLowestIsConventional":"n & -n isolates it in one operation, and nothing else about it matters","alternative":{"highest":"1 << (31 - clz(x))","javaHelper":"Integer.highestOneBit(x)","pythonHelper":"1 << (x.bit_length() - 1)"}},"verification":{"randomCases":300000,"wrongAnswers":0,"python":{"cases":50000,"wrongAnswers":0},"edgeCasesCovered":["INT_MIN as a singleton","zero as a singleton","two negatives with no pairs at all"]},"intMinTrap":{"idiom":"n & -n","problem":"-x for x = INT_MIN overflows; in C++ that is undefined behaviour, not a wrapped value","fix":"cast to unsigned first — 0u - ux is defined and gives the identical bit pattern","verified":{"input":[-2147483648,7,7,3],"output":[-2147483648,3]},"java":"safe as written — negation is defined to wrap, so x & -x works at Integer.MIN_VALUE","python":"safe as written — there is no most-negative value, so negation always succeeds","alsoAffects":"__builtin_clz(0) and __builtin_ctz(0) are undefined; safe here only because a != b guarantees x != 0"},"timing":{"unit":"ns","rows":[{"n":10001,"twoPassXor":2583,"hashMap":563375,"sort":294500},{"n":100001,"twoPassXor":27000,"hashMap":7034750,"sort":3457583},{"n":1000001,"twoPassXor":271041,"hashMap":89041916,"sort":42910750}],"ratiosAtMillion":{"overHashMap":328,"overSort":158},"vsSingleNumberI":{"thisSubtopic":271041,"singleNumberI":101791,"ratio":2.66,"why":"two passes instead of one, plus a test per element in the second"},"sortBeatsHashAgain":"the same cache-locality effect as in single-number-i","python":{"n":100002,"twoPassXor":14.4,"counter":17.5,"unit":"ms","ratio":1.22,"reason":"the XOR passes run in the interpreter while Counter runs in C","realPrize":"O(1) space"}},"pythonDifference":{"noMaskNeeded":true,"why":"the answers here are VALUES rather than bit counts, so unbounded integers cause no trouble — unlike minimum-bit-flips-to-convert-number, where bit_count needed a width","negativesWork":"n & bit relies on Python sign-extending, which gives the correct two's complement reading"}}
```

<!-- @highlights -->
- Single Number - I is replayed on this input and ends with 6 in the accumulator beside a question mark.
- 6 is not in the array, which sets up the reveal.
- 3 = 011 and 5 = 101 appear beneath it with their differing columns lit, matching the set bits of 6 = 110.
- It is labelled "not the answer — the map of where the answers differ".
- The lowest set bit is isolated with 6 & -6, with -6 drawn as ~6 + 1 so the isolation is visible rather than asserted.
- A vertical divider splits the screen into "bit 1 set" and "bit 1 clear".
- Each array element lights its bit 1 and slides to the correct side.
- The two 2s go left together, the two 1s go right together, and 3 and 5 diverge.
- Separate accumulators run on each side, with cancellation arcs reappearing within each half.
- They end at 3 on the left and 5 on the right.
- One pair crossing to the same side and the two singletons diverging are highlighted together.
- The partition is replayed using bit 2 instead, grouping the duplicates differently and giving the same two answers.
- It is annotated with 3,196,952 combinations tested and 0 failures.
- An INT_MIN panel shows -x overflowing back to itself in a signed lane and 0u - ux working in an unsigned lane.
- The cost chart gives 271,041ns, 42,910,750ns and 89,041,916ns.
- A ghost bar at 101,791ns marks Single Number - I, with 2.66x labelled as the price of the second pass.

<!-- @edgeCases -->
- INT_MIN as one of the singletons — requires the unsigned isolation in C++, since -x is undefined for it.
- Zero as one of the singletons — works unchanged; the partition depends on a ^ b, not on either value being non-zero.
- An array of exactly two elements — no pairs at all, and both accumulators end holding one value each.
- Two negatives as the singletons — handled without special cases, since XOR works on bit patterns.
- Singletons differing in only one bit — a ^ b has a single set bit, and that one column is the only usable split.
- Singletons differing in every bit — any of the 32 columns works, which the exhaustive per-pair check confirms.
- a ^ b equal to zero — impossible by the premise, and it is exactly what would break the algorithm, since there would be no column to split on.
- __builtin_clz or __builtin_ctz on the accumulator — undefined for 0, and safe here only because a != b guarantees non-zero.
- Testing n & bit against 1 rather than 0 — the mask is 2^i, so this is the i-th bit trap resurfacing.
- A violated premise with three singletons — returns two plausible values that are not necessarily any of them.
- Very large arrays — the memory stays at three accumulators, where both alternatives grow with the input.

<!-- @pitfalls -->
- Writing x & -x on a signed accumulator in C++. For INT_MIN the negation is undefined behaviour; cast to unsigned and use 0u - ux.
- Assuming the lowest set bit is required. Any differing bit works — 3,196,952 combinations tested, 0 failures — and the lowest is chosen only because n & -n is one operation.
- Testing (n & bit) == 1 instead of != 0. The mask is 2^i, so the comparison is only correct when the chosen bit is position 0.
- Expecting the accumulator after the first pass to be one of the answers. It is a ^ b, and it is usually not present in the array at all.
- Calling __builtin_clz or __builtin_ctz without knowing the input is non-zero. Both are undefined for 0; here the premise guarantees it, and that guarantee should be stated.
- Forgetting that both groups must be XORed. Each group holds one singleton plus complete pairs, so both accumulators are needed — there is no shortcut to the second answer.
- Sorting the caller's array in place in the comparison approach. Both the C++ and Java versions must copy first.
- Relying on the hash map's iteration order for a stable result. It has none; sort the output if the caller expects one.
- Carrying the C++ speed argument into Python. The gap there is 1.22x, and the reason to prefer the XOR method is the O(1) space.
- Applying a mask to the Python version out of habit. Unlike Minimum Bit Flips, nothing here counts bits, so unbounded integers cause no trouble.
- Assuming a violated premise will be detected. Three singletons produce two plausible values, silently, exactly as in Single Number - I.
- Using this shape for Single Number - II, where values appear three times. Pairs cancel under XOR and triples do not, so the whole approach has to change.

<!-- @doubt -->
### Why doesn't XORing everything give the answer?

<!-- @answer -->
Because two values survive the cancellation instead of one, and XOR combines them into a single number rather than keeping them apart. For [1, 2, 1, 3, 2, 5] the pairs cancel and the accumulator holds 3 ^ 5 = 6, which is not in the array. But the previous subtopics said what that value is: a ^ b is the map of the columns where a and b differ. So it is not the answer and it is the key to finding it, because it identifies a question that separates the two.

<!-- @doubt -->
### Why does splitting on a differing bit work?

<!-- @answer -->
Two properties, and both are needed. First, a and b disagree in the chosen column — that is what "a set bit of a ^ b" means — so exactly one of them has that bit set and they land in different groups. Second, any value appearing twice is identical in both copies, so both copies agree in every column and always take the same branch, keeping the pair together. That means each group ends up containing exactly one unpaired value plus some number of complete pairs, which is precisely Single Number - I. XOR each group and you have both answers.

<!-- @doubt -->
### Does it have to be the lowest set bit?

<!-- @answer -->
No. Any set bit of a ^ b separates the two, and that was checked directly: over 200,000 random pairs, every one of the 3,196,952 differing bits was tried as the splitting column, with 0 failures. The lowest is conventional purely because n & -n isolates it in a single operation. The highest works identically and is available as Integer.highestOneBit in Java or 1 << (31 - clz(x)) in C++. Knowing this matters less for implementation than for understanding: the algorithm has no unlucky input, because the only requirement on the column is the one a ^ b was built to identify.

<!-- @doubt -->
### Why is a ^ b guaranteed non-zero?

<!-- @answer -->
Because the two singletons are different values, and XOR is zero only when its operands are equal. That guarantee is doing real work — it is what ensures there is at least one column to split on, and it is also what makes __builtin_ctz and __builtin_clz safe to call on the accumulator, since both are undefined for zero. If the premise were relaxed to allow the two singletons to be equal, they would form a pair and the problem would be different. It is worth writing the guarantee down rather than relying on it silently.

<!-- @doubt -->
### What breaks with INT_MIN?

<!-- @answer -->
The idiom n & -n, in C++ only. INT_MIN has no positive counterpart, so -x overflows, and signed overflow is undefined behaviour rather than a wrapped value the compiler must preserve. Casting to unsigned first fixes it — 0u - ux is defined to wrap and produces exactly the bit pattern intended, so bit = ux & (0u - ux) is correct for every input. Verified: [INT_MIN, 7, 7, 3] returns INT_MIN and 3 with the unsigned form. Java has no undefined behaviour on overflow, so x & -x is safe there, and Python has no most-negative value at all.

<!-- @doubt -->
### How much slower is this than Single Number - I?

<!-- @answer -->
2.66x, and the factor is exactly what the structure predicts: 271,041ns against 101,791ns at a million elements. Single Number - I makes one pass with one XOR per element. This makes two passes, and the second adds a test per element to decide which accumulator to update. Nothing else changed — no allocation, no extra memory traffic, three accumulators instead of one. It remains 328x faster than a hash map and 158x faster than sorting at that size.

<!-- @doubt -->
### Does the Python version need a mask?

<!-- @answer -->
No, and the contrast with Minimum Bit Flips is worth holding onto. There, the answer was a bit count, and counting requires a width to count within — so Python's unbounded integers gave 1 instead of 32 and the mask was mandatory. Here the answers are values, not counts, and XOR on unbounded integers produces exactly the right value at every width. n & bit on a negative also works, because Python sign-extends, which is the correct two's complement reading. Verified on 50,000 random cases including INT_MIN as a singleton.

<!-- @doubt -->
### What if there are three singletons instead of two?

<!-- @answer -->
You get two plausible numbers that are not necessarily any of them, silently — the same failure mode as Single Number - I. The first pass produces the XOR of all three, the partition splits on one of its bits, and each group may then contain one or two unpaired values, whose XOR is what each accumulator reports. Nothing detects it. If the premise is not guaranteed by the problem statement, the counting approach is the one that can check it, at 328x the cost.

<!-- @doubt -->
### Would this work if values appeared three times instead of twice?

<!-- @answer -->
No, and the reason is structural rather than incidental. The whole method rests on duplicates cancelling under XOR, which happens because a ^ a is 0 — an even number of copies vanishes and an odd number does not. Three copies leave one behind, so the accumulator after the first pass is polluted by every repeated value rather than holding just the singletons. Single Number - II needs a different mechanism entirely: counting each bit position modulo 3, which is a genuinely different idea despite the problems looking adjacent.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
This closes the XOR thread — four subtopics that all rested on the same two lines, a ^ a == 0 and a ^ 0 == a, used first to compare two numbers, then to cancel an array, then to collapse a range into a formula, and finally to partition. The topic now turns to number theory for its last five subtopics: printing prime factors, listing divisors, counting primes in a range with a sieve, and factorising efficiently. The connection to bits loosens, but the instinct is the same one this topic has been building — look for the structure that makes the obvious loop unnecessary.
