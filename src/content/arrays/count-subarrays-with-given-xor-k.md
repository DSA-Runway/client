---
id: count-subarrays-with-given-xor-k
topic: Arrays
title: Count subarrays with given xor K
difficulty: Hard
status: ready
prerequisites:
  - count-subarrays-with-given-sum
  - find-the-number-that-appears-once-and-other-numbers-twice
  - largest-subarray-with-sum-0
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - count-subarrays-with-given-sum
  - find-the-number-that-appears-once-and-other-numbers-twice
  - largest-subarray-with-sum-0
  - two-sum
---

<!-- @summary -->
Count subarrays whose XOR equals k — the same prefix-map shape as the sum version, except the sliding window that was correct on positive values there is 79.70% wrong here, and prefix XORs are bounded by the value range rather than growing with n, which allows a plain table that measured up to 33.4x faster than a hash map.

<!-- @theory -->
## The problem

Count the contiguous subarrays whose elements XOR together to `k`.

```
a = [4, 2, 2, 6, 4], k = 6   ->  4
```

## The prefix identity, and why XOR makes it easier

Let `P[j]` be the XOR of everything up to index j. Then the XOR of the subarray
from i+1 to j is `P[j] ^ P[i]`.

For the sum version you rearranged `P[j] - P[i] == k` into `P[i] == P[j] - k`.
Here the rearrangement is even simpler, because **XOR is its own inverse**:

```
P[j] ^ P[i] == k     is the same as     P[i] == P[j] ^ k
```

No subtraction, no sign handling, no overflow. At each position you ask how many
earlier prefixes equal `P ^ k`, which is a lookup:

```
count[0] = 1                       the empty prefix
for each value:
    running ^= value
    answer += count[running ^ k]   how MANY earlier prefixes qualify
    count[running] += 1
```

Identical in shape to **Count Subarrays with Given Sum** — the map stores counts,
the seed is one occurrence of zero, and the lookup happens before the insert. Only
the arithmetic changes.

The mistakes carry across too, at higher rates. Measured over all 436,905
(array, k) pairs from the values {0..3} with n up to 8:

| Mistake | Wrong |
|---|---|
| No seed of `count[0] = 1` | **70.99%** |
| Inserting before the lookup | 20.00% |
| Using `running - k` instead of `running ^ k` | **53.48%** |

That last one is the cross-problem confusion made concrete: the sum version's
lookup transplanted unchanged. Smallest failure `a = [1,1], k = 1`, returning 1
where the answer is 2.

## The sliding window is not available at all

This is the sharpest difference from the sum problem, and it is worth being
precise about.

In **Count Subarrays with Given Sum**, a sliding window is correct on **strictly
positive** values — measured 0% wrong there — because the sum grows monotonically
as the window widens, so shrinking from the left is a valid search.

XOR has no such property. Widening a window can raise or lower the value
arbitrarily, so there is nothing to shrink toward. Measured:

| Domain | Sliding window wrong on |
|---|---|
| Strictly positive {1,2,3} | **79.70%** |
| Non-negative {0,1,2} | 74.40% |
| All values {0..3} | 78.67% |

Note that positivity does not help — it is slightly *worse* than allowing zeros.
The escape hatch that exists for sums simply is not there. If you carried the
window across from that problem, it will fail on four inputs in five.

## Prefix XORs are bounded, and that changes everything

Here is the structural difference worth the most.

A prefix **sum** grows without limit: over a million elements it can reach a
million distinct values, and the map grows with n. A prefix **XOR** of values
below 2^b is itself always below 2^b — XOR never produces a bit that was not
already available. So the map can never hold more than **2^b entries, whatever n
is**:

| n | Value bits | Distinct prefix XORs | Distinct prefix sums |
|---|---|---|---|
| 100,000 | 4 | **16** | 93,807 |
| 1,000,000 | 4 | **16** | 937,677 |
| 10,000,000 | 4 | **16** | 9,373,987 |
| 10,000,000 | 10 | **1,024** | 9,990,097 |
| 10,000,000 | 20 | 1,048,496 | 9,999,996 |

Sixteen entries at four bits, at every array length — exactly 2⁴, unchanged
across a hundred-fold increase in n. At ten bits it is exactly 2¹⁰. The sum
column tracks n throughout.

### Which means you can drop the hash map

Because the key space is bounded and small, a plain array indexed by the prefix
XOR works — no hashing, no collisions, no rehashing:

| n | Bits | Hash map | Table | Speedup | Table size |
|---|---|---|---|---|---|
| 10,000,000 | 4 | 87.00ms | **8.46ms** | 10.28x | 64 bytes |
| 10,000,000 | 10 | 87.21ms | **8.11ms** | 10.75x | 4 KB |
| 10,000,000 | 16 | 108.67ms | **12.74ms** | 8.53x | 256 KB |
| 10,000,000 | 20 | 591.99ms | **17.71ms** | **33.43x** | 4 MB |

Between **8.5x and 33.4x**, and the table is tiny until the bit width gets large.
This trick is **not available for the sum version** — there is no bound to size
the table against.

The catch is that you must know the bit width, and 32-bit values would need a
16 GB table. Above roughly 24 bits the hash map is the only option.

## Which to write

- **A table** when the values are known to fit a modest bit width — under about
  20 bits it is both smaller and up to 33x faster than a hash map.
- **A hash map** otherwise. Same algorithm, and it stays correct at any width.
- **Never a sliding window**, whatever the sign of the values.

<!-- @intuition -->
Keep a running XOR as you walk, and note every value it has taken and how often. Standing at position j with running value R, a subarray ending here XORs to k exactly when it started just after some earlier point whose running value was R ^ k — because XORing the two ends cancels everything they share. So the question "how many subarrays end here" is "how many times have I already seen R ^ k", a lookup rather than a search. The empty prefix before the array counts as one of those earlier points, which is why the tally starts with a single zero in it. And unlike a running sum, a running XOR can never wander outside the range its inputs already occupy — it has no bits to escape into — so the set of values it can take is small and known in advance.

<!-- @approach -->
### Brute Force - Every Subarray with a Running XOR

<!-- @idea -->
Fix each start position, extend the end one element at a time carrying a running XOR, and count every time it equals k.

<!-- @steps -->
1. Take each index in turn as the start of a subarray.
2. Reset a running XOR to zero.
3. Extend the end position through the rest of the array, folding each element in.
4. Increment the count whenever the running XOR equals k.
5. Do not stop on a match, since a longer subarray from the same start can match again.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: The running XOR keeps this quadratic rather than cubic, and it is correct on every input, which makes it the reference. Measured 122.23ms at n = 20,000 against the prefix map's 0.164ms — a factor of 747.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long countSubarrays(const vector<int>& a, int k) {
    long long count = 0;
    int n = a.size();

    for (int i = 0; i < n; i++) {
        int running = 0;
        for (int j = i; j < n; j++) {
            running ^= a[j];               // fold in, never re-XOR the range
            if (running == k) count++;      // no break: a longer match can follow
        }
    }
    return count;
}
```

<!-- @annotations -->
- 11: Folding forward rather than recomputing, which is what makes this O(n^2) instead of O(n^3).
- 12: No break. XOR is not monotonic, so the running value can leave k and return to it.

<!-- @code java -->
```java
static long countSubarrays(int[] a, int k) {
    long count = 0;

    for (int i = 0; i < a.length; i++) {
        int running = 0;
        for (int j = i; j < a.length; j++) {
            running ^= a[j];
            if (running == k) count++;
        }
    }
    return count;
}
```

<!-- @annotations -->
- 6: The inner loop extends the subarray one element at a time, so each start costs one pass rather than one pass per end.

<!-- @code python -->
```python
def count_subarrays(a, k):
    count = 0
    n = len(a)

    for i in range(n):
        running = 0
        for j in range(i, n):
            running ^= a[j]
            if running == k:
                count += 1
    return count


# Correct on every input, which is what makes it the reference the fast
# versions were checked against over 436,905 (array, k) pairs.
```

<!-- @annotations -->
- 8: The running XOR, rebuilt once per start rather than once per subarray.

<!-- @approach -->
### Prefix XOR with a Hash Count Map

<!-- @idea -->
Keep a running XOR and a tally of how often each value has occurred; at each position the number of qualifying subarrays is the tally of the running XOR combined with k.

<!-- @steps -->
1. Start a tally with the value zero recorded once, standing for the empty prefix.
2. Walk the array carrying a running XOR.
3. Fold each element into the running XOR.
4. Add to the answer however many times the running XOR combined with k has already been tallied.
5. Then tally the current running XOR.
6. Look up before tallying, so a prefix is never matched against itself.

<!-- @complexity -->
- time: O(n) expected
- space: O(min(n, 2^bits)) for the tally
- note: The general solution, correct at any value width. Its cost depends on how many distinct prefix XORs occur, which is capped by the value range rather than by n — at four bits the map held exactly 16 entries whether the array had a hundred thousand elements or ten million.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_map>
using namespace std;

long long countSubarrays(const vector<int>& a, int k) {
    unordered_map<int,int> seen;
    seen.reserve(a.size() * 2);
    seen[0] = 1;                          // the empty prefix, before index 0

    int running = 0;
    long long count = 0;
    for (int v : a) {
        running ^= v;
        auto it = seen.find(running ^ k);  // XOR, not subtraction
        if (it != seen.end()) count += it->second;
        seen[running]++;
    }
    return count;
}
```

<!-- @annotations -->
- 8: Seeding one occurrence of zero. Omitting it measured 70.99% wrong, the highest rate among these bugs.
- 14: running ^ k, because XOR is its own inverse. Writing running - k measured 53.48% wrong.
- 16: Tallying after the lookup. Doing it first measured 20.00% wrong, since the prefix then matches itself when k is zero.

<!-- @code java -->
```java
import java.util.HashMap;
import java.util.Map;

static long countSubarrays(int[] a, int k) {
    Map<Integer,Integer> seen = new HashMap<>();
    seen.put(0, 1);

    int running = 0;
    long count = 0;
    for (int v : a) {
        running ^= v;
        Integer prior = seen.get(running ^ k);
        if (prior != null) count += prior;
        seen.merge(running, 1, Integer::sum);
    }
    return count;
}
```

<!-- @annotations -->
- 12: The lookup key is running ^ k, which is the whole arithmetic of this problem.
- 14: merge increments an existing tally or inserts one, doing the update in a single call.

<!-- @code python -->
```python
from collections import defaultdict

def count_subarrays(a, k):
    seen = defaultdict(int)
    seen[0] = 1                       # the empty prefix, before index 0

    running = 0
    count = 0
    for v in a:
        running ^= v
        count += seen[running ^ k]    # XOR is its own inverse
        seen[running] += 1
    return count


# Distinct prefix XORs measured at n = 10,000,000:
#   4-bit values  ->        16   (exactly 2^4, whatever n is)
#   20-bit values -> 1,048,496   (capped at 2^20)
```

<!-- @annotations -->
- 5: Without this line every subarray starting at index 0 is missed — measured 70.99% wrong.
- 11: running ^ k rather than running - k. The subtraction is the sum problem's lookup and measured 53.48% wrong here.
- 12: Incrementing after the lookup, so the current prefix cannot match itself.

<!-- @approach -->
### Optimal - Prefix XOR with a Direct Table

<!-- @idea -->
Because a running XOR of b-bit values can never exceed 2^b, index a plain array by it instead of hashing.

<!-- @steps -->
1. Determine the bit width the values occupy, or take it from the problem's constraints.
2. Allocate an integer array of size two to that power, all zero.
3. Record one occurrence of zero, for the empty prefix.
4. Walk the array folding each element into the running XOR.
5. Add the table entry at the running XOR combined with k to the answer.
6. Increment the table entry at the running XOR.

<!-- @complexity -->
- time: O(n + 2^bits)
- space: O(2^bits) — 4 bytes per possible prefix value
- note: The fastest approach when the bit width is known and modest, measured 8.5x to 33.4x faster than the hash map — 17.71ms against 591.99ms at ten million 20-bit values. The table is 64 bytes at four bits and 4 MB at twenty. This is available only because XOR is bounded; the equivalent for prefix sums does not exist.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// Requires every value to fit in `bits` bits.
long long countSubarrays(const vector<int>& a, int k, int bits) {
    vector<int> seen((size_t)1 << bits, 0);   // one slot per possible prefix XOR
    seen[0] = 1;

    int running = 0;
    long long count = 0;
    for (int v : a) {
        running ^= v;
        count += seen[running ^ k];            // array index, no hashing
        seen[running]++;
    }
    return count;
}
```

<!-- @annotations -->
- 6: Sized by the value range, not by n. A running XOR of b-bit values cannot reach 2^b.
- 13: A direct array index where the hash version does a hash, a probe and possibly a rehash.
- 14: The running XOR indexes the table directly too, since it also cannot exceed 2^bits.

<!-- @code java -->
```java
// Requires every value to fit in `bits` bits.
static long countSubarrays(int[] a, int k, int bits) {
    int[] seen = new int[1 << bits];
    seen[0] = 1;

    int running = 0;
    long count = 0;
    for (int v : a) {
        running ^= v;
        count += seen[running ^ k];
        seen[running]++;
    }
    return count;
}
```

<!-- @annotations -->
- 3: A flat int array, which is why this avoids the boxing that a Map<Integer,Integer> pays on every operation.

<!-- @code python -->
```python
def count_subarrays(a, k, bits):
    """Requires every value to fit in `bits` bits."""
    seen = [0] * (1 << bits)
    seen[0] = 1

    running = 0
    count = 0
    for v in a:
        running ^= v
        count += seen[running ^ k]
        seen[running] += 1
    return count


# Measured against the hash map at n = 10,000,000:
#   4 bits   8.46ms vs 87.00ms   (10.28x, table is 64 bytes)
#   20 bits 17.71ms vs 591.99ms  (33.43x, table is 4 MB)
# 32-bit values would need a 16 GB table, so use the hash map there.
```

<!-- @annotations -->
- 3: The table's size is fixed by the bit width, so this is only viable when that width is known and modest.
- 10: A list index rather than a dictionary lookup, which is where the speedup comes from.

<!-- @example -->

<!-- @input -->
a = [4, 2, 2, 6, 4], k = 6

<!-- @output -->
4

<!-- @why -->
The canonical case, containing a repeated prefix XOR so the tally must count multiple earlier matches rather than just detect one.

<!-- @walkthrough -->
1. Start with the tally holding one occurrence of 0, and a running XOR of 0.
2. After 4 the running XOR is 4; the probe looks for 4 ^ 6 = 2, which is absent, and 4 is tallied.
3. After 2 the running XOR is 6; the probe looks for 6 ^ 6 = 0 and finds the seed, so the count becomes 1.
4. After the second 2 the running XOR is 4; the probe looks for 4 ^ 6 = 2, still absent, and 4 is tallied again.
5. After 6 the running XOR is 2; the probe looks for 2 ^ 6 = 4, which has been tallied twice, so the count becomes 3.
6. After the final 4 the running XOR is 6; the probe looks for 0 and finds the seed, so the count becomes 4.
7. One lookup contributed two at step five, which is exactly what storing counts rather than positions buys.

<!-- @example -->

<!-- @input -->
a = [1, 1], k = 1 with the lookup written as running - k

<!-- @output -->
1 — and the correct answer is 2

<!-- @why -->
The smallest case exposing the sum version's lookup transplanted unchanged, and it shows the two arithmetics disagree even on tiny inputs.

<!-- @walkthrough -->
1. The two qualifying subarrays are the first element alone and the second element alone, each XORing to 1.
2. After the first 1 the running XOR is 1, and the correct probe looks for 1 ^ 1 = 0, finding the seed — count 1.
3. The subtraction probe looks for 1 - 1 = 0 as well, which happens to agree here.
4. The tally now holds 0 once and 1 once.
5. After the second 1 the running XOR is back to 0, and the correct probe looks for 0 ^ 1 = 1, which is tallied once — count 2.
6. The subtraction probe looks for 0 - 1 = -1, which was never tallied, so it adds nothing.
7. Measured over 436,905 pairs, using subtraction was wrong on 53.48% of them.

<!-- @example -->

<!-- @input -->
Strictly positive values, solved with a sliding window

<!-- @output -->
Wrong on 79.70% of inputs — where the same window is 0% wrong for the sum version

<!-- @why -->
The escape hatch that exists in the sum problem does not exist here, and positivity does not help at all.

<!-- @walkthrough -->
1. For sums, widening a window of positive values always increases the total, so shrinking from the left is a valid search.
2. That monotonicity is what makes a sliding window correct there — measured 0% wrong on strictly positive input.
3. XOR has no such property: folding in another value can raise or lower the running result arbitrarily.
4. So there is no direction to shrink toward and no ordering to exploit.
5. Measured on strictly positive values from {1,2,3}, a sliding window was wrong on 79.70% of pairs.
6. Allowing zeros made it slightly better at 74.40%, so positivity is not merely useless but marginally worse.
7. The prefix-tally approach is the only linear method available here.

<!-- @example -->

<!-- @input -->
10,000,000 elements of 4-bit values

<!-- @output -->
Exactly 16 distinct prefix XORs — and 8.46ms with a table against 87.00ms with a hash map

<!-- @why -->
Shows the bound that makes the table possible, and that it holds regardless of how long the array is.

<!-- @walkthrough -->
1. A XOR of two 4-bit values is itself a 4-bit value, since XOR never sets a bit neither operand had.
2. So a running XOR of 4-bit values can only ever take one of 16 values.
3. Measured at a hundred thousand, a million and ten million elements, the count of distinct prefix XORs was 16 every time.
4. The equivalent count for prefix sums was 93,807, 937,677 and 9,373,987 — tracking n throughout.
5. Because the key space is 16 slots, a 64-byte array replaces the hash map entirely.
6. That measured 8.46ms against 87.00ms, a factor of 10.28.
7. At twenty bits the table is 4 MB and the advantage rises to 33.43x, since the hash map has by then left cache.

<!-- @visualization array -->

<!-- @description -->
The running XOR drawn as a value that jumps rather than drifts — do not plot it as a smooth path like a running sum, because the whole point is that it moves unpredictably and has no monotonic direction to exploit. Show it instead as a lit bit-pattern above the array strip: a small row of bit cells that flip on and off as each element folds in. To one side, a tally column listing each pattern seen and how many times, seeded with a single zero pattern drawn slightly outside the array at position -1 and labelled the empty prefix. As the marker advances, XOR the element's bits into the running pattern with the flipping bits animated, then form the probe pattern by XORing k in — show that second XOR explicitly as a separate operation on a duplicate of the pattern, because the probe key being running ^ k rather than running - k is the arithmetic people get wrong. Look the probe pattern up in the tally, and if present, spring one arrow per counted occurrence from that tally row to the current position. Run the canonical [4,2,2,6,4] with k=6 so that the fifth step's probe finds a pattern tallied twice and two arrows spring at once, which is the moment that distinguishes counting from finding. Beneath, a subtraction panel on [1,1] with k=1 showing the probe key computed as running - k instead: at the second step it asks for -1, a pattern that cannot exist, and the arrow fails to spring. Then a monotonicity panel, deliberately contrasted: two tracks over identical positive values, the upper one plotting a running SUM as a staircase that only ever climbs, the lower one plotting the running XOR as a scatter that jumps up and down — with a sliding window drawn on each, shrinking correctly on the staircase and visibly having nowhere to shrink toward on the scatter. Close with the bound: three tally columns side by side for arrays of 100,000, 1,000,000 and 10,000,000 four-bit values, each holding exactly 16 rows and visibly the same height, next to three prefix-sum tallies growing off the top of the frame — annotated 16 against 93,807, 937,677 and 9,373,987.

<!-- @sampleInput -->
```json
{"primary":{"input":[4,2,2,6,4],"k":6,"answer":4,"seed":{"pattern":0,"count":1,"position":-1,"label":"empty prefix"},"trace":[{"i":0,"v":4,"running":4,"probe":2,"matches":0,"count":0,"tallyAfter":{"0":1,"4":1}},{"i":1,"v":2,"running":6,"probe":0,"matches":1,"count":1,"tallyAfter":{"0":1,"4":1,"6":1}},{"i":2,"v":2,"running":4,"probe":2,"matches":0,"count":1,"tallyAfter":{"0":1,"4":2,"6":1}},{"i":3,"v":6,"running":2,"probe":4,"matches":2,"count":3,"note":"one lookup, TWO arrows","tallyAfter":{"0":1,"2":1,"4":2,"6":1}},{"i":4,"v":4,"running":6,"probe":0,"matches":1,"count":4,"tallyAfter":{"0":1,"2":1,"4":2,"6":2}}]},"subtractionPanel":{"input":[1,1],"k":1,"correctProbe":"running ^ k","buggyProbe":"running - k","correctAnswer":2,"buggyAnswer":1,"divergesAt":1,"buggyProbeValue":-1,"why":"-1 is not a pattern that can exist","failureRate":0.5348},"bugRates":{"pairsTested":436905,"noSeed":0.7099,"insertBeforeLookup":0.2000,"subtractionLookup":0.5348},"monotonicityPanel":{"values":"strictly positive","runningSum":{"shape":"monotonic staircase","windowValid":true,"sumVersionFailureRate":0.0},"runningXor":{"shape":"jumps up and down","windowValid":false,"failureRate":0.7970},"nonNegativeFailureRate":0.7440,"note":"positivity does not help, and is marginally worse than allowing zeros"},"boundPanel":{"claim":"a running XOR of b-bit values never exceeds 2^b","rows":[{"n":100000,"bits":4,"distinctXor":16,"distinctSum":93807},{"n":1000000,"bits":4,"distinctXor":16,"distinctSum":937677},{"n":10000000,"bits":4,"distinctXor":16,"distinctSum":9373987},{"n":10000000,"bits":10,"distinctXor":1024,"distinctSum":9990097},{"n":10000000,"bits":20,"distinctXor":1048496,"distinctSum":9999996}]},"tablePanel":[{"n":10000000,"bits":4,"hashMs":87.00,"tableMs":8.46,"speedup":10.28,"tableBytes":64},{"n":10000000,"bits":10,"hashMs":87.21,"tableMs":8.11,"speedup":10.75,"tableBytes":4096},{"n":10000000,"bits":16,"hashMs":108.67,"tableMs":12.74,"speedup":8.53,"tableBytes":262144},{"n":10000000,"bits":20,"hashMs":591.99,"tableMs":17.71,"speedup":33.43,"tableBytes":4194304}],"bruteComparison":[{"n":20000,"bits":4,"bruteMs":122.23,"prefixMs":0.164,"ratio":747},{"n":20000,"bits":20,"bruteMs":122.57,"prefixMs":1.243,"ratio":99}]}
```

<!-- @highlights -->
- The running XOR is drawn as a lit bit-pattern above the strip, not as a smooth path, because it jumps rather than drifts.
- Bit cells flip on and off as each element folds in, making the operation visible rather than numeric.
- A tally column lists each pattern seen and how many times, seeded with a zero pattern at position -1 outside the array.
- After each fold, the probe pattern is formed by XORing k in, shown as a separate operation on a duplicate of the pattern.
- That second XOR is animated explicitly, because the probe key being running ^ k rather than running - k is what people get wrong.
- At index 1 the running pattern is 6 and the probe for 0 finds the seed, so one arrow springs.
- At index 3 the running pattern is 2 and the probe for 4 finds a row tallied twice, so TWO arrows spring at once.
- That double arrow is the moment distinguishing counting from finding.
- A subtraction panel runs [1,1] with k=1, computing the probe as running - k instead.
- At the second step it asks for -1, a pattern that cannot exist, and the arrow fails to spring.
- A monotonicity panel puts two tracks over identical positive values, one plotting a running sum and one a running XOR.
- The sum climbs as a staircase and the XOR scatters up and down, with a sliding window drawn on each.
- The window shrinks correctly on the staircase and visibly has nowhere to shrink toward on the scatter.
- Three tally columns close the piece for arrays of 100,000, 1,000,000 and 10,000,000 four-bit values.
- Each holds exactly 16 rows and is visibly the same height, beside prefix-sum tallies growing off the top of the frame.

<!-- @edgeCases -->
- Empty array — no subarrays, so the answer is zero whatever k is.
- Single element equal to k — the answer is one, and this is where the seed earns its place.
- Single element not equal to k — the answer is zero.
- k equal to zero — counts subarrays XORing to zero, which is Largest Subarray with Sum 0's sibling and needs the lookup to be running ^ 0, that is running itself.
- All elements zero with k zero — every subarray qualifies, giving n times n plus one over two.
- All elements zero with k non-zero — none qualifies.
- Two identical elements, such as [1,1] with k=1 — the smallest case separating XOR from subtraction.
- A repeated prefix XOR — the case where one lookup must contribute more than one, which counting handles and position-storing does not.
- Values spanning the full 32-bit range — the table approach becomes impossible and the hash map is required.
- k larger than any achievable prefix XOR — the answer is zero, and the probe key still stays inside the table's range.
- Very long arrays of narrow values — the map stays at 2^bits entries and the cost is flat.
- Negative values, if the language permits them — XOR on a signed representation still works, but the table's index arithmetic does not.

<!-- @pitfalls -->
- Omitting the seed of one occurrence of zero. Every subarray starting at index 0 is then missed — measured 70.99% wrong.
- Writing the lookup as running - k, carried over from Count Subarrays with Given Sum. Measured 53.48% wrong, with [1,1] and k=1 the smallest failing case.
- Tallying the running XOR before doing the lookup. When k is zero the prefix matches itself and every position gains a phantom subarray — measured 20.00% wrong.
- Using a sliding window. Measured 79.70% wrong on strictly positive values, where the same window is 0% wrong for the sum version.
- Assuming positive values make a window safe. They do not, and positivity measured marginally worse than allowing zeros.
- Storing positions instead of counts. A repeated prefix XOR must contribute once per earlier occurrence, which a single stored position cannot express.
- Sizing the table by n rather than by the value range. The table's size is 2^bits and has nothing to do with the array's length.
- Using a table when the values are 32 bits wide. That would need 16 GB, so the hash map is the only option above roughly 24 bits.
- Forgetting that the probe key must also fit the table. It does, since running ^ k stays within the same bit width when k does.
- Accumulating the answer in a 32-bit integer. An array of a million equal values can produce far more than two billion qualifying subarrays.
- Benchmarking only on narrow values. The hash map measured 87.00ms at four bits and 591.99ms at twenty on the same array length.
- Expecting the prefix map to grow with n. It is capped at 2^bits, which is the opposite of the sum version's behaviour.

<!-- @doubt -->
### Why is the lookup running ^ k rather than running - k?

<!-- @answer -->
Because XOR is its own inverse. The subarray from i+1 to j has XOR equal to P[j] ^ P[i], so asking for that to equal k rearranges to P[i] == P[j] ^ k — XORing both sides by k cancels it on the left. For sums the same rearrangement needs subtraction, because addition's inverse is subtraction. Transplanting the subtraction here measured 53.48% wrong, and the smallest failure is tiny: on [1,1] with k=1 the second probe asks for 0 - 1 = -1, a value no prefix XOR can ever take, so the second valid subarray is never counted.

<!-- @doubt -->
### Can I use a sliding window if all the values are positive?

<!-- @answer -->
No, and this is the sharpest difference from the sum problem. There, positivity makes the running sum increase monotonically as the window widens, so shrinking from the left is a valid way to search — measured 0% wrong on strictly positive input. XOR has no monotonicity at all: folding in another value can raise or lower the result arbitrarily, so there is no direction to shrink toward. Measured on strictly positive values from {1,2,3}, a sliding window was wrong on 79.70% of pairs — slightly worse than the 74.40% when zeros were allowed. Positivity is not merely unhelpful here, it buys nothing.

<!-- @doubt -->
### Why does the map stay small when the sum version's map grows?

<!-- @answer -->
Because XOR cannot produce a bit that neither operand had. A running XOR of values below 2^b is itself always below 2^b, so the set of values it can take has at most 2^b members no matter how long the array is. Measured on ten million four-bit values, the map held exactly 16 entries — the same 16 as on a hundred thousand elements. A running sum has no such ceiling: over the same ten million elements it took 9,373,987 distinct values. That difference is why the cost here is set by the value range and the cost there is set by the array's length.

<!-- @doubt -->
### When should I use a table instead of a hash map?

<!-- @answer -->
Whenever the bit width is known and modest. Because the key space is bounded by 2^bits, a plain array indexed by the running XOR replaces the hash map with no collisions and no rehashing — measured 8.5x to 33.4x faster, and the table is only 64 bytes at four bits or 4 MB at twenty. The limit is the width: 32-bit values would need a 16 GB table, so above roughly 24 bits the hash map is the only option. This trick has no counterpart in the sum version, because there is no bound to size a table against.

<!-- @doubt -->
### Why must the lookup come before the tally update?

<!-- @answer -->
Otherwise the current prefix can match itself. If you tally first and then probe for running ^ k, then whenever k is zero the probe key equals the running value you have just inserted, so every position gains a phantom subarray of length zero. Measured 20.00% wrong. Looking up first means the tally contains only genuinely earlier prefixes, which is what the identity assumes. The same ordering rule appears in Count Subarrays with Given Sum and in one-pass Two Sum, and for exactly the same reason.

<!-- @doubt -->
### What does k = 0 count?

<!-- @answer -->
Subarrays whose elements XOR to zero, which happens exactly when a prefix XOR repeats — the probe key running ^ 0 is just running itself. That makes it the XOR sibling of Largest Subarray with Sum 0, with one important difference in what the map holds: that problem wants the longest such subarray so it stores the earliest index, while this one wants how many so it stores counts. Same walk, same repeat-detection, opposite map contents, decided by whether the question is how long or how many.

<!-- @doubt -->
### Can the answer overflow?

<!-- @answer -->
Yes, easily. An array of a million identical values with k = 0 has roughly half a trillion qualifying subarrays, since every subarray of even length XORs to zero. That is far beyond a 32-bit integer, so the accumulator must be 64-bit even though the values and the tally entries can stay 32-bit. This is a different overflow from the one in 4 Sum — there the risk was in the arithmetic on the values, here it is purely in the count.

<!-- @doubt -->
### How does this compare to Count Subarrays with Given Sum?

<!-- @answer -->
Same shape, three differences. The lookup uses XOR rather than subtraction, since XOR is its own inverse. The sliding-window shortcut that works there on positive values does not exist here at all — 0% wrong there against 79.70% here on the same domain. And the map is bounded by the value range rather than growing with n, which both caps the memory and permits the table approach. What carries across unchanged is everything about the map's contents: counts rather than positions, seeded with one occurrence of zero, looked up before inserting.
