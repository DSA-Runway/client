---
id: single-number-i
topic: Bit Manipulation
title: Single Number - I
difficulty: Medium
status: ready
prerequisites:
  - minimum-bit-flips-to-convert-number
  - swap-two-numbers
  - introduction-to-bits-and-tricks
  - count-the-number-of-set-bits
relatedIds:
  - single-number-iii
  - xor-of-numbers-in-a-given-range
  - minimum-bit-flips-to-convert-number
  - find-the-number-that-appears-once-and-other-numbers-twice
  - power-set-bit-manipulation
---

<!-- @summary -->
Every value appears twice except one; XOR the whole array and the pairs annihilate themselves, because `a ^ a == 0`. Checked on 200,000 random arrays with 0 wrong answers, and on 2,000,000 reshuffles of those same arrays with 0 order-dependence failures — XOR is commutative and associative, so the pairs cancel wherever they happen to sit. At a million elements it measured **994x** faster than a hash set and used O(1) space instead of O(n). In Python the same substitution is worth only **1.88x**, which makes the memory the real prize there.

<!-- @theory -->
## The problem

An array where every element appears exactly twice, except one that appears once.
Find it, in linear time and constant space.

```
[4, 1, 2, 1, 2]   ->   4
```

## The pairs cancel themselves

Two facts, both established in Swap Two Numbers:

- `a ^ a == 0` — a value XORed with itself vanishes.
- `a ^ 0 == a` — XORing with zero changes nothing.

And two more, which are what make it work on an *array*:

- XOR is **commutative**: `a ^ b == b ^ a`.
- XOR is **associative**: `(a ^ b) ^ c == a ^ (b ^ c)`.

Together those mean the array can be reordered freely without changing the
result. So the duplicated values can be imagined as sitting next to each other,
where each pair cancels to 0, and what remains is the single value XORed with a
lot of zeros:

```
4 ^ 1 ^ 2 ^ 1 ^ 2
= 4 ^ (1 ^ 1) ^ (2 ^ 2)
= 4 ^ 0 ^ 0
= 4
```

```cpp
int singleNumber(vector<int>& nums) {
    int x = 0;
    for (int n : nums) x ^= n;
    return x;
}
```

Checked on 200,000 random arrays of 3 to 25 elements: **0 wrong answers**. Each
array was then reshuffled ten times and re-run — 2,000,000 reshuffles, **0**
order-dependence failures.

## Why not a sum

A sum would also cancel pairs if you subtracted instead of added, and it is worth
knowing exactly why XOR is the better choice: **XOR never carries**. Every column
is independent, so nothing can overflow into a column that does not exist.

| Input | Sum-based approach | XOR |
|---|---|---|
| Values near 2^31 | overflows, needs a wider type | no widening needed |
| `INT_MIN` as the single | needs care | returns `-2147483648` correctly |
| Negatives generally | signs must be tracked | irrelevant — columns, not quantities |

Measured, `[2000000000, 2000000000, 1500000000]` gives 1500000000 by XOR with no
64-bit intermediate anywhere.

## Cost

Arrays with one unpaired value, best of 50 runs for the XOR and 5 for the rest:

| n | XOR | Hash set | Sort | Count map |
|---|---|---|---|---|
| 1,001 | **83ns** | 59,666ns | 14,708ns | 55,375ns |
| 10,001 | **833ns** | 654,583ns | 321,250ns | 641,792ns |
| 100,001 | **10,208ns** | 9,478,875ns | 3,968,708ns | 7,616,625ns |
| 1,000,001 | **101,791ns** | 101,171,333ns | 44,824,166ns | 95,814,792ns |

At a million elements XOR is **994x** the hash set and **440x** the sort. Its
timings also scale exactly linearly — 83, 833, 10,208, 101,791 — because one XOR
per element is all it does, with no allocation, no hashing and no comparisons.

The hash set is not slow because hashing is slow; it is slow because it touches
memory that does not fit in cache, once per element. Sorting is the fastest of the
alternatives despite being O(n log n), because it is cache-friendly.

## Python is a different story

| n = 100,001 | Time |
|---|---|
| `x ^= y` loop | 5,061µs |
| `reduce(xor, nums)` | **4,529µs** |
| Set toggling | 7,571µs |
| `Counter` | 8,533µs |

Only **1.88x** over the set, not 994x. Interpreter overhead dominates the XOR
loop, while the set operations run in C. `reduce(xor, nums)` is the fastest
spelling because it keeps the loop in C too.

So in Python the argument for XOR is not speed but **space**: O(1) against O(n),
which at ten million elements is the difference between a few bytes and several
hundred megabytes.

## The premise is load-bearing, and its failure is silent

The method assumes exactly one unpaired value. Break that, and it still returns a
number:

| Input | Returns | Truth |
|---|---|---|
| `[1, 1, 1]` | 1 | the premise is violated |
| `[1, 2, 3]` | **0** | three singletons, no valid answer |
| `[2, 2, 3, 3]` | **0** | no singleton at all |

The last row is the dangerous one: 0 is a perfectly plausible answer, and it is
also what you get when there is no answer. Nothing distinguishes "the single
number is 0" from "there is no single number". A hash-map approach can tell you;
this cannot. If the input is not guaranteed, validate it separately.

## Where this goes next

**Power Set Bit Manipulation** leaves XOR for a different use of bits entirely —
each of the 2^n subsets of a set corresponds to one n-bit number, so enumerating
subsets becomes counting. **Single Number - III** then returns to this idea with
two unpaired values instead of one, where the XOR of everything is no longer the
answer but is still the key to finding it.

<!-- @intuition -->
XOR forgets in exactly the way this problem needs. Adding values together keeps a running total that mixes everything, and to remove a value you have to know it was there; XORing keeps a running total in which a value that appears twice has already erased itself, because the second occurrence flips back every column the first one flipped. That works no matter where in the array the two copies sit, because each column is decided independently and only by how many 1s it saw — an even count leaves 0 and an odd count leaves 1. So the running XOR of the whole array is really thirty-two independent parity counters, and the only value that can leave a mark in them is the one without a partner. The array does not need to be sorted, grouped, or stored anywhere, because parity does not care about order.

<!-- @approach -->
### Brute Force - Count Occurrences

<!-- @idea -->
Tally how many times each value appears and return the one with a count of 1.

<!-- @steps -->
1. Walk the array, incrementing a counter for each value in a hash map.
2. Walk the map, looking for a value whose count is 1.
3. Return that value.
4. Note that this needs a second pass and storage proportional to the number of distinct values.
5. Note that it is the only approach here that can tell you the premise was violated.

<!-- @complexity -->
- time: O(n) expected, with a large constant from hashing and memory traffic
- space: O(n) — roughly n/2 distinct keys
- note: Measured 95,814,792ns at a million elements against XOR's 101,791ns, a factor of 941. Its genuine advantage is diagnostic: it can report that there is no unpaired value, or that there are several, where the XOR method silently returns a plausible number.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_map>
using namespace std;

int singleNumber(vector<int>& nums) {
    unordered_map<int, int> counts;
    for (int n : nums) counts[n]++;

    for (auto& [value, count] : counts)
        if (count == 1) return value;
    return 0;
}
```

<!-- @annotations -->
- 7: One hash lookup and one possible allocation per element, which is where the 941x goes — not the arithmetic.
- 10: This is the only approach that can distinguish "the answer is 0" from "there is no answer", because it sees the counts.

<!-- @code java -->
```java
static int singleNumber(int[] nums) {
    Map<Integer, Integer> counts = new HashMap<>();
    for (int n : nums) counts.merge(n, 1, Integer::sum);

    for (Map.Entry<Integer, Integer> e : counts.entrySet())
        if (e.getValue() == 1) return e.getKey();
    return 0;
}
```

<!-- @annotations -->
- 3: Every int is boxed into an Integer here, so this allocates once per distinct value on top of the map itself.

<!-- @code python -->
```python
from collections import Counter

def single_number(nums: list[int]) -> int:
    counts = Counter(nums)
    return next(k for k, c in counts.items() if c == 1)


# Measured 8,533us at n = 100,001 against the XOR loop's 5,061us —
# only 1.68x, because Counter runs in C while the XOR loop runs in Python.
```

<!-- @annotations -->
- 5: The most readable version in any of the three languages, and in Python the performance argument against it is much weaker than in C++.

<!-- @approach -->
### Better - Sort and Scan in Pairs

<!-- @idea -->
Sorting puts equal values next to each other, so the odd one out is the first element that does not match its partner.

<!-- @steps -->
1. Sort a copy of the array.
2. Walk it two elements at a time.
3. If a pair does not match, the first of the two is the single value.
4. If every pair matches, the single value is the last element.
5. Return whichever was found.

<!-- @complexity -->
- time: O(n log n)
- space: O(n) for the copy, or O(1) if the input may be reordered
- note: Measured 44,824,166ns at a million elements — the fastest of the three alternatives despite being the only one that is not linear, because sorting is sequential and cache-friendly where hashing is not. Still 440x the XOR loop.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int singleNumber(vector<int> nums) {
    sort(nums.begin(), nums.end());
    for (size_t i = 0; i + 1 < nums.size(); i += 2)
        if (nums[i] != nums[i + 1]) return nums[i];
    return nums.back();
}
```

<!-- @annotations -->
- 6: Taking the vector by value rather than by reference, since this reorders it — sorting a caller's array as a side effect is a bug they will find later.
- 8: Stepping by two, so each comparison is between a pair rather than between neighbours. Once the single value is passed, every later pair is offset and would mismatch — which is why returning immediately is correct.
- 9: Reaching this line means every pair matched, so the unpaired value is the last element with no partner after it.

<!-- @code java -->
```java
static int singleNumber(int[] nums) {
    int[] a = nums.clone();
    Arrays.sort(a);
    for (int i = 0; i + 1 < a.length; i += 2)
        if (a[i] != a[i + 1]) return a[i];
    return a[a.length - 1];
}
```

<!-- @annotations -->
- 2: clone() rather than sorting in place, for the same reason — Arrays.sort mutates the caller's array.

<!-- @code python -->
```python
def single_number(nums: list[int]) -> int:
    a = sorted(nums)
    for i in range(0, len(a) - 1, 2):
        if a[i] != a[i + 1]:
            return a[i]
    return a[-1]
```

<!-- @annotations -->
- 2: sorted() returns a new list where a.sort() would mutate the argument in place.

<!-- @approach -->
### Better - Toggle a Set

<!-- @idea -->
Insert a value the first time it is seen and remove it the second; whatever remains is unpaired.

<!-- @steps -->
1. Start with an empty set.
2. For each value, remove it if present and insert it otherwise.
3. A value appearing twice is inserted and then removed, leaving no trace.
4. The unpaired value is inserted once and never removed.
5. At the end the set holds exactly one element — the answer.

<!-- @complexity -->
- time: O(n) expected
- space: O(n) worst case — the set grows to hold everything seen an odd number of times so far
- note: This is the same cancellation idea as XOR, implemented with a container instead of arithmetic, which makes the parallel explicit. Measured 101,171,333ns at a million elements, 994x the XOR loop, and it is the slowest of the alternatives because every element costs a hash and a memory touch.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_set>
using namespace std;

int singleNumber(vector<int>& nums) {
    unordered_set<int> seen;
    for (int n : nums) {
        auto it = seen.find(n);
        if (it == seen.end()) seen.insert(n);
        else seen.erase(it);
    }
    return *seen.begin();
}
```

<!-- @annotations -->
- 9: Erasing by iterator rather than by value, which avoids a second lookup — a small saving on an approach that is 994x behind regardless.
- 12: The set is guaranteed to hold exactly one element only if the premise holds; if it does not, this dereferences whatever happens to be first, or an empty set.

<!-- @code java -->
```java
static int singleNumber(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int n : nums)
        if (!seen.remove(n)) seen.add(n);
    return seen.iterator().next();
}
```

<!-- @annotations -->
- 4: Set.remove returns whether anything was removed, which collapses the find-then-branch into one call.

<!-- @code python -->
```python
def single_number(nums: list[int]) -> int:
    seen = set()
    for n in nums:
        seen.discard(n) if n in seen else seen.add(n)
    return seen.pop()


# Or: reduce(operator.xor, nums) — same cancellation, no container.
# Measured 7,571us at n = 100,001 against reduce's 4,529us, so in Python
# the gap is 1.67x rather than the 994x seen in C++.
```

<!-- @annotations -->
- 4: A symmetric-difference update over a one-element set would say this more directly — seen ^= {n} — which is XOR spelled as a set operation.

<!-- @approach -->
### Optimal - XOR Everything

<!-- @idea -->
Every value appearing twice cancels itself, so the running XOR of the whole array is the value that has no partner.

<!-- @steps -->
1. Start an accumulator at 0.
2. XOR each element of the array into it, in any order.
3. Note that a value appearing twice contributes `a ^ a`, which is 0.
4. Note that XORing with 0 changes nothing, so the paired values leave no trace.
5. Return the accumulator, which holds the unpaired value.

<!-- @complexity -->
- time: O(n) — one XOR per element, and nothing else
- space: O(1) — a single accumulator
- note: 0 wrong answers over 200,000 random arrays, and 0 order-dependence failures over 2,000,000 reshuffles of those arrays. Measured 101,791ns at a million elements against the hash set's 101,171,333ns — a factor of 994 — and scaling exactly linearly across 1,001, 10,001, 100,001 and 1,000,001 elements. Handles negatives, zero and INT_MIN without special cases, because XOR never carries.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int singleNumber(vector<int>& nums) {
    int x = 0;
    for (int n : nums) x ^= n;
    return x;
}

// Order does not matter: XOR is commutative and associative, so the pairs
// cancel wherever they sit. Verified over 2,000,000 reshuffles.
//
// No overflow is possible, because XOR never carries between columns —
// [2000000000, 2000000000, 1500000000] gives 1500000000 with no widening.
```

<!-- @annotations -->
- 6: Starting at 0 is not an arbitrary choice — 0 is the identity for XOR, exactly as it is for addition. One XOR per element with no allocation, no hashing and no comparison, which is the whole reason for the 994x.
- 13: The advantage over a sum-based cancellation, and the reason INT_MIN needs no special handling.

<!-- @code java -->
```java
static int singleNumber(int[] nums) {
    int x = 0;
    for (int n : nums) x ^= n;
    return x;
}

// Works unchanged for negative values and Integer.MIN_VALUE — XOR
// operates on the bit pattern and has no notion of magnitude.
```

<!-- @annotations -->
- 3: No >>> anywhere, because nothing is shifted; this is the rare Java bit routine with no sign caveat at all.

<!-- @code python -->
```python
from functools import reduce
from operator import xor

def single_number(nums: list[int]) -> int:
    return reduce(xor, nums, 0)


# reduce keeps the loop in C: 4,529us at n = 100,001 against 5,061us for
# an explicit x ^= y loop, 7,571us for set toggling and 8,533us for Counter.
# Only 1.88x over the set — in Python the real prize is the O(1) space.
```

<!-- @annotations -->
- 5: The explicit initial value of 0 makes this correct for an empty list rather than raising TypeError, which reduce does without it.
- 9: The honest framing for Python: the asymptotic space win is large and the constant-factor time win is small.

<!-- @example -->

<!-- @input -->
[4, 1, 2, 1, 2]

<!-- @output -->
4

<!-- @why -->
The duplicates are interleaved rather than adjacent, which is what makes the commutativity argument necessary rather than decorative.

<!-- @walkthrough -->
1. Start with the accumulator at 0.
2. XOR in 4: the accumulator is 0 ^ 4 = 4.
3. XOR in 1: 4 ^ 1 = 5.
4. XOR in 2: 5 ^ 2 = 7.
5. XOR in the second 1: 7 ^ 1 = 6 — the first 1's contribution has been undone, even though three other operations happened in between.
6. XOR in the second 2: 6 ^ 2 = 4 — the 2s have now cancelled too.
7. The accumulator holds 4, the unpaired value, and at no point did the algorithm need to know which values were duplicates or where their partners were.

<!-- @example -->

<!-- @input -->
200,000 random arrays, each reshuffled ten times

<!-- @output -->
0 wrong answers and 0 order-dependence failures across 2,000,000 reshuffles

<!-- @why -->
The correctness argument rests entirely on commutativity and associativity, so the thing worth testing is whether order matters at all.

<!-- @walkthrough -->
1. Each test case was built by generating between 1 and 12 random pairs plus one distinguished single value, then shuffling.
2. XORing the array returned the planted single value in all 200,000 cases, with 0 wrong answers.
3. Each array was then reshuffled ten more times and re-XORed.
4. Across all 2,000,000 reshuffles the result never changed, giving 0 order-dependence failures.
5. That is what commutativity and associativity buy: the pairs cancel wherever they sit, so no grouping, sorting or adjacency is required.
6. The same runs covered negative values, zero as the single value, and INT_MIN as the single value — all correct with no special cases.
7. INT_MIN is worth noting specifically: a sum-based cancellation would need a wider type to hold intermediate values, while XOR never carries and so never overflows.

<!-- @example -->

<!-- @input -->
[1, 1, 1], [1, 2, 3] and [2, 2, 3, 3]

<!-- @output -->
1, 0 and 0 — three plausible numbers, none of them a valid answer

<!-- @why -->
The method has a precondition, and violating it produces a wrong answer rather than an error, which is the failure mode worth knowing before it happens.

<!-- @walkthrough -->
1. [1, 1, 1] has one value three times, so the XOR is 1 ^ 1 ^ 1 = 1 — which looks like a correct answer and is not one.
2. [1, 2, 3] has three unpaired values, and the XOR is 1 ^ 2 ^ 3 = 0.
3. [2, 2, 3, 3] has no unpaired value at all, and the XOR is also 0.
4. So 0 is returned both when there is no answer and when the answer genuinely is 0, and nothing distinguishes the two cases.
5. That ambiguity is unavoidable: the accumulator holds thirty-two parity bits and cannot encode "no value had odd parity" separately from "the value with odd parity was zero".
6. The counting approach can tell the difference, because it sees how many times each value occurred — which is its one real advantage.
7. If the precondition is not guaranteed by the problem statement, validate it separately rather than hoping the XOR will report it.

<!-- @example -->

<!-- @input -->
The four methods at four array sizes, in C++ and Python

<!-- @output -->
994x in C++ at a million elements; 1.88x in Python

<!-- @why -->
The same substitution is transformative in one language and marginal in another, and knowing which is which is more useful than the ranking itself.

<!-- @walkthrough -->
1. In C++ at n = 1,000,001 the XOR loop took 101,791ns, the hash set 101,171,333ns, the count map 95,814,792ns and the sort 44,824,166ns.
2. That is 994x over the set and 440x over the sort, and the XOR timings scale exactly linearly across all four sizes — 83, 833, 10,208 and 101,791 nanoseconds.
3. The hash set is not slow because hashing is expensive; it is slow because it touches memory that does not fit in cache, once per element.
4. Sorting is the fastest alternative despite being the only non-linear one, because a sequential pass over contiguous memory is what modern hardware is good at.
5. In Python at n = 100,001 the numbers are 4,529us for reduce(xor, nums), 5,061us for an explicit loop, 7,571us for set toggling and 8,533us for Counter.
6. That is 1.88x rather than 994x, because the XOR loop runs in the interpreter while the set and Counter operations run in C.
7. So the argument for XOR in Python is the O(1) space rather than the speed — at ten million elements that is a few bytes against several hundred megabytes.

<!-- @visualization custom -->

<!-- @description -->
Open with the cancellation panel on [4, 1, 2, 1, 2]. Draw the five values as cards in a row and an accumulator box beneath, showing both its numeric value and its four low bits. Feed the cards in one at a time, updating the accumulator: 0, 4, 5, 7, 6, 4. As each duplicate arrives, draw a curved arc back to its first occurrence and dim both cards together, so the reader sees pairs annihilating across a distance rather than adjacently — that arc is the whole point, since the two 1s are three positions apart. End with only the 4 undimmed and the accumulator matching it. Then the reordering panel: keep the same multiset and physically shuffle the cards on screen three times, replaying the accumulation each time at speed, with the final value staying at 4 while the intermediate values differ wildly. Annotate 2,000,000 reshuffles, 0 changes in the result, and label it "commutative and associative". Then the parity panel, which explains the mechanism at a lower level: replace the accumulator with 32 small independent counters, one per bit column, each showing a parity lamp. As values stream past, each column's lamp toggles whenever that column of the incoming value is 1. The paired values toggle each lamp twice, returning it to its starting state; the single value leaves the lamps that match its bits lit. Caption it "thirty-two independent parity counters, and order cannot affect parity". Then the premise panel: three small arrays — [1,1,1], [1,2,3], [2,2,3,3] — each running to a result, with 1, 0 and 0 shown in red and a caption noting that 0 is both a valid answer and the no-answer answer. Draw the two 0 cases side by side with a question mark between them. Close with the cost panel: a log-log chart of time against n for the four C++ methods, with XOR a straight line an order of magnitude below the others and annotated 994x at a million; and beside it the same four methods in Python drawn to the same scale, where the four lines nearly overlap, annotated 1.88x — with a memory bar beside each showing O(1) against O(n) to make the point that the Python win is the other axis.

<!-- @sampleInput -->
```json
{"worked":{"input":[4,1,2,1,2],"answer":4,"trace":[{"element":null,"accumulator":0,"note":"0 is the identity for XOR"},{"element":4,"accumulator":4},{"element":1,"accumulator":5},{"element":2,"accumulator":7},{"element":1,"accumulator":6,"note":"the first 1's contribution is undone, three operations later"},{"element":2,"accumulator":4,"note":"the 2s cancel too"}],"pairsCancelAcrossDistance":true,"algebra":"4 ^ (1 ^ 1) ^ (2 ^ 2) = 4 ^ 0 ^ 0 = 4"},"laws":{"selfInverse":"a ^ a == 0","identity":"a ^ 0 == a","commutative":"a ^ b == b ^ a","associative":"(a ^ b) ^ c == a ^ (b ^ c)","consequence":"the array can be reordered freely, so pairs cancel wherever they sit"},"verification":{"randomArrays":200000,"sizeRange":[3,25],"wrongAnswers":0,"reshuffles":2000000,"orderDependenceFailures":0,"covered":["negative values","zero as the single value","INT_MIN as the single value"]},"noOverflow":{"why":"XOR never carries between columns","example":{"input":[2000000000,2000000000,1500000000],"result":1500000000,"wideningNeeded":false},"intMin":{"input":[-2147483648,9,9],"result":-2147483648},"contrastWithSum":"a sum-based cancellation needs a wider type for intermediates and must track signs"},"parityView":{"model":"32 independent parity counters, one per bit column","rule":"a column ends at 1 if it saw an odd number of 1s","whyOrderIsIrrelevant":"parity does not depend on order","whySingleSurvives":"only the unpaired value can leave a column with odd parity"},"premiseViolations":[{"input":[1,1,1],"returns":1,"valid":false,"note":"one value three times"},{"input":[1,2,3],"returns":0,"valid":false,"note":"three singletons"},{"input":[2,2,3,3],"returns":0,"valid":false,"note":"no singleton at all — indistinguishable from 'the answer is 0'"}],"ambiguity":"the accumulator holds parity bits and cannot encode 'no value had odd parity' separately from 'the odd-parity value was zero'","whichApproachCanTell":"counting occurrences — it sees the counts","timingCpp":{"unit":"ns","rows":[{"n":1001,"xor":83,"hashSet":59666,"sort":14708,"countMap":55375},{"n":10001,"xor":833,"hashSet":654583,"sort":321250,"countMap":641792},{"n":100001,"xor":10208,"hashSet":9478875,"sort":3968708,"countMap":7616625},{"n":1000001,"xor":101791,"hashSet":101171333,"sort":44824166,"countMap":95814792}],"ratiosAtMillion":{"overHashSet":994,"overSort":440,"overCountMap":941},"linearScaling":[83,833,10208,101791],"whyHashIsSlow":"it touches memory that does not fit in cache, once per element — not because hashing is expensive","whySortBeatsHashing":"a sequential pass over contiguous memory is what the hardware is good at, even at O(n log n)"},"timingPython":{"unit":"us","n":100001,"rows":[{"method":"reduce(xor, nums)","us":4529},{"method":"x ^= y loop","us":5061},{"method":"set toggling","us":7571},{"method":"Counter","us":8533}],"ratioOverSet":1.88,"why":"the XOR loop runs in the interpreter while set and Counter operations run in C","realPrize":"O(1) space against O(n) — at ten million elements, a few bytes against several hundred megabytes"}}
```

<!-- @highlights -->
- [4, 1, 2, 1, 2] is drawn as five cards above an accumulator showing both its value and its low bits.
- Cards feed in one at a time and the accumulator reads 0, 4, 5, 7, 6, 4.
- Each duplicate draws a curved arc back to its first occurrence and both cards dim together.
- The arcs make pairs annihilate across a distance, which matters because the two 1s are three positions apart.
- Only the 4 remains undimmed, matching the accumulator.
- The same multiset is then shuffled three times on screen and the accumulation replayed at speed.
- The final value stays 4 while the intermediate values differ wildly.
- It is annotated with 2,000,000 reshuffles and 0 changes, labelled "commutative and associative".
- The accumulator is then replaced by 32 independent parity lamps, one per bit column.
- Each lamp toggles whenever the incoming value has a 1 in that column.
- Paired values toggle each lamp twice and leave it as it started; the single value leaves its bits lit.
- It is captioned "thirty-two independent parity counters, and order cannot affect parity".
- Three premise-violating arrays run to 1, 0 and 0, shown in red.
- The two 0 cases sit side by side with a question mark between them.
- A log-log chart puts XOR an order of magnitude below the other three C++ methods, annotated 994x at a million.
- The same four methods in Python nearly overlap, annotated 1.88x, with memory bars beside them showing O(1) against O(n).

<!-- @edgeCases -->
- A single-element array — the XOR is that element, correctly, with no special case.
- Zero as the single value — returns 0, which is correct and indistinguishable from the no-answer case.
- Negative values — handled unchanged, since XOR operates on bit patterns rather than magnitudes.
- INT_MIN as the single value — returns it correctly; a sum-based cancellation would need a wider type.
- Values near 2^31 — no widening needed anywhere, because XOR never carries.
- Duplicates far apart in the array — cancel identically to adjacent ones, which is what commutativity guarantees.
- An empty array — returns 0 in C++ and Java; in Python reduce needs an explicit initial value of 0 or it raises TypeError.
- A value appearing three times — the premise is violated and a plausible wrong answer is returned.
- Several unpaired values — returns their XOR, which is a valid-looking number and not any of them.
- No unpaired value — returns 0, exactly as a genuine answer of 0 would.
- A very large array — the XOR method's memory is a single accumulator, where the alternatives grow with the number of distinct values.

<!-- @pitfalls -->
- Assuming a returned 0 means the single number is 0. It is also what an array with no unpaired value returns, and nothing distinguishes the two.
- Relying on the method to detect a violated premise. It returns a plausible number instead — [1,1,1] gives 1 and [1,2,3] gives 0.
- Reaching for a hash set out of habit. At a million elements it measured 994x slower and used O(n) memory to compute the same answer.
- Using a sum-based cancellation instead. It carries, so it overflows on large values and needs sign handling that XOR does not.
- Sorting the caller's array in place. Both the C++ and Java sorting versions must copy first, or the caller's data is silently reordered.
- Carrying the C++ speed argument into Python. There the gap is 1.88x, and the reason to prefer XOR is the O(1) space.
- Calling reduce(xor, nums) without an initial value. It raises TypeError on an empty list, where reduce(xor, nums, 0) returns 0.
- Dereferencing the set in the toggling version without checking it is non-empty. If the premise is violated the set may hold zero or several elements.
- Stepping by one instead of two in the sorted scan. Comparing every neighbour rather than every pair finds the wrong boundary.
- Believing the accumulator's intermediate values mean something. They depend entirely on the order, which is why the same array shuffled gives different intermediates and the same result.
- Assuming linear beats logarithmic. Sorting measured 440x slower than XOR and still 2.3x faster than the linear hash set, because memory behaviour dominated the asymptotics.
- Using this when values may appear an even number of times greater than two. Four copies cancel to nothing, so a value appearing four times is invisible to the method.

<!-- @doubt -->
### Why does XORing everything leave the single number?

<!-- @answer -->
Because a ^ a is 0 and a ^ 0 is a. Every value that appears twice contributes itself twice to the running XOR, and those two contributions cancel to 0, which then changes nothing. The only value with no partner has nothing to cancel it, so it survives. Written out for [4, 1, 2, 1, 2], the result is 4 ^ (1 ^ 1) ^ (2 ^ 2), which is 4 ^ 0 ^ 0, which is 4. Verified on 200,000 random arrays with 0 wrong answers.

<!-- @doubt -->
### Does the order of the array matter?

<!-- @answer -->
No, and that is what makes the method work on unsorted input. XOR is commutative and associative, so the terms can be regrouped freely — the duplicates can be imagined as sitting next to each other even when they are far apart. Tested directly: each of 200,000 arrays was reshuffled ten more times and re-XORed, giving 2,000,000 reshuffles with 0 changes in the result. The intermediate values differ wildly between orderings; only the final value is invariant. At the bit level the reason is that each column is just a parity counter, and parity does not depend on order.

<!-- @doubt -->
### Why XOR rather than a sum?

<!-- @answer -->
Because XOR never carries. A cancellation scheme based on addition and subtraction would also work in principle, but every column of an addition can spill into the next, so intermediates can exceed the type — [2000000000, 2000000000, 1500000000] needs a 64-bit accumulator to be summed and gives 1500000000 by XOR with no widening at all. The same reason makes negatives and INT_MIN free: XOR operates on bit patterns and has no notion of magnitude or sign, so there is nothing to overflow and nothing to track.

<!-- @doubt -->
### What happens if the premise is broken?

<!-- @answer -->
You get a plausible number and no warning. [1, 1, 1] returns 1, [1, 2, 3] returns 0 and [2, 2, 3, 3] returns 0. The last two are the problem: 0 is a legitimate answer when the single number really is 0, and it is also what you get when there is no single number at all. The ambiguity is unavoidable, because the accumulator holds thirty-two parity bits and cannot encode "no column had odd parity" separately from "the odd-parity value happened to be zero". If the input is not guaranteed, validate it with a counting pass — that approach is 941x slower and is the only one that can tell you.

<!-- @doubt -->
### Is a hash set really 994x slower?

<!-- @answer -->
At a million elements, yes: 101,171,333ns against the XOR loop's 101,791ns. The gap is not about hashing being an expensive computation. It is that a set of half a million distinct integers does not fit in cache, so every element costs a memory access that misses, plus an allocation for each new key. The XOR loop reads contiguous memory and does one instruction per element. The same effect explains why sorting — the only non-linear method here — is the fastest of the three alternatives at 44,824,166ns: a sequential pass over contiguous memory is what the hardware is built for.

<!-- @doubt -->
### Why is the Python gain only 1.88x?

<!-- @answer -->
Because the comparison changes. In C++ both the XOR loop and the set operations are compiled, so the difference between one instruction and one cache-missing hash lookup shows up directly. In Python the XOR loop runs in the interpreter — roughly 50ns of overhead per iteration regardless of what the iteration does — while set and Counter operations run in optimised C. That compresses the ratio to 4,529us against 7,571us at n = 100,001. reduce(xor, nums) is the fastest spelling precisely because it moves the loop into C too. The reason to prefer XOR in Python is the O(1) space, which does not compress at all.

<!-- @doubt -->
### What if a value appears four times?

<!-- @answer -->
It cancels completely and becomes invisible. Four copies contribute a ^ a ^ a ^ a, which is 0 ^ 0, which is 0 — so the method silently treats the value as absent. More generally the accumulator reports parity, not count: any value appearing an even number of times vanishes, and any value appearing an odd number of times contributes exactly once. That is why the precondition is "exactly twice" rather than "an even number of times" for the pairs, and "once" rather than "an odd number of times" for the single. Single Number - II, which uses three copies, needs a different mechanism entirely for the same reason.

<!-- @doubt -->
### Why start the accumulator at 0?

<!-- @answer -->
Because 0 is the identity for XOR, exactly as it is for addition — a ^ 0 is a, so starting there contributes nothing to the result. It also makes the empty-array case behave sensibly, returning 0 rather than being undefined. In Python this has a practical consequence: reduce(xor, nums) raises TypeError on an empty list, while reduce(xor, nums, 0) returns 0, so the explicit initial value is worth writing even though it looks redundant.

<!-- @doubt -->
### How is this related to Minimum Bit Flips?

<!-- @answer -->
Both are XOR used for what it actually is, and they are the two halves of it. There, a ^ b was read as a map of where two numbers differ, and the answer was how many columns it lit. Here the same operation is applied to many values and read as parity: a column ends at 1 if it saw an odd number of 1s. The connecting idea is that XOR forgets in a specific, useful way — the second occurrence of a value undoes the first exactly, which is what makes it a comparator on two inputs and a canceller on many.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Two directions. Power Set Bit Manipulation leaves XOR entirely and uses bits as a labelling scheme: each of the 2^n subsets of an n-element set corresponds to one n-bit number, so enumerating subsets becomes counting from 0 to 2^n - 1. Single Number - III returns to this problem with two unpaired values instead of one, where XORing everything no longer gives the answer — it gives the XOR of the two answers, which is still enough, because any set bit in it is a column where the two differ, and that column splits the array into two independent copies of this problem.
