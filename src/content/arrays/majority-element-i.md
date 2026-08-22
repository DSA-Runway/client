---
id: majority-element-i
topic: Arrays
title: Majority Element-I
difficulty: Easy
status: ready
prerequisites:
  - two-sum
  - maximum-consecutive-ones
  - largest-element
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - majority-element-ii
  - two-sum
  - maximum-consecutive-ones
  - largest-element
---

<!-- @summary -->
Find the element appearing more than n/2 times in one pass and constant space — where the voting algorithm's correctness rests entirely on a promise it cannot check, and where the verification pass that makes it safe costs 5.5%.

<!-- @theory -->
## The problem

Given an array of size `n`, return the **majority element** — the value that
appears **more than** `⌊n/2⌋` times. The problem guarantees one exists.

```
[3, 2, 3]              ->  3   (2 of 3)
[2, 2, 1, 1, 1, 2, 2]  ->  2   (4 of 7)
```

"More than half" is a strong condition and it is doing all the work. It means the
majority element outnumbers **everything else combined**, which is what every
approach below exploits.

## Why sorting works

Sort the array and return the element at index `n/2`.

That looks like it needs justification, and the justification is short: if a value
occupies more than half the positions, then after sorting it forms a contiguous
block longer than half the array. A block that long **must** cover the middle
index, no matter where it starts. So whatever sits at `n/2` is the majority.

```
[2,2,1,1,1,2,2]  ->  sorted [1,1,1,2,2,2,2]  ->  index 3 holds 2
```

O(n log n), and it computes a complete ordering to read one position.

## Boyer-Moore voting, and why it is not a trick

Keep a **candidate** and a **counter**. For each element:

- If the counter is zero, adopt the current element as the candidate and set the
  counter to one.
- Otherwise, increment the counter if the element matches the candidate, and
  decrement it if it does not.

At the end, the candidate is the majority element.

### The cancellation argument

Think of each element as a vote, and each disagreement as a **mutual
annihilation**: one vote for the candidate cancels one vote against it. Every
decrement destroys exactly one majority vote and one non-majority vote together.

Now count. The majority element has more than `n/2` votes; everything else
combined has fewer than `n/2`. Even if *every* non-majority vote is spent
cancelling a majority vote, the non-majority side runs out first — there are
simply not enough of them. Some majority votes survive, so the counter cannot
reach zero on the last majority element, and the candidate that ends up standing
must be it.

That is why it needs no memory of what it has seen. It is not counting
occurrences; it is running a war of attrition that the majority is arithmetically
guaranteed to win.

Verified over every array of length 1 to 12 drawn from three symbols that has a
majority — **196,230 arrays, zero failures**.

## The precondition it cannot check

Here is the part that matters more than the algorithm.

**Boyer-Moore assumes a majority exists. If none does, it returns a wrong answer
with no error, no exception, and no signal of any kind.**

```
[1, 2, 3]     -> returns 3   (appears once of three)
[1, 1, 2, 2]  -> returns 1   (appears twice of four — not a majority)
[1, 2, 3, 4]  -> returns 3   (appears once of four)
```

Across the 600,930 arrays in that same space with no majority, it returned an
element every single time. That the element is not a majority is definitional —
the point is that **there is no failure mode to observe**. The output is an
ordinary-looking value from the array, and nothing distinguishes it from a
correct answer.

The fix is one extra pass: count how many times the candidate actually occurs and
confirm it exceeds `n/2`.

Measured at n = 10,000,000, that verification costs **17.04ms against 16.15ms —
5.5%**. There is no performance argument for leaving it out. LeetCode 169
guarantees a majority so you may skip it there; in any code where the guarantee
is not written down, verify.

## What it costs

At n = 10,000,000:

| Approach | Time | Space |
|---|---|---|
| Sort | 96.11ms | O(1) |
| Hash map count | 61.88ms | O(n) |
| Bit counting, 32 passes | 31.50ms | O(1) |
| **Boyer-Moore** | **16.15ms** | **O(1)** |
| Boyer-Moore + verify | 17.04ms | O(1) |

Boyer-Moore is **3.8x faster than the hash map** and **6.0x faster than sorting**,
while using constant space. Unlike Two Sum — where the O(n) hash map lost to an
O(n log n) sort — here the asymptotically best approach is also the practically
best one, because it is a single sequential scan with two integer variables and no
allocation at all.

Note the bit-counting variant, which makes **32 separate full passes** over the
array and still beats the hash map by 2x. That is the Two Sum lesson restated:
sequential scans over contiguous memory are extremely cheap, and hashing is not.

## The brute force is not really quadratic

Counting occurrences of each candidate in turn is O(n²) on paper, and it measured
**0.01ms at n = 100,000** — far too fast for a quadratic algorithm.

The reason is specific to this problem. Brute force tests `a[0]` first, and the
majority occupies **more than half** the array, so on a shuffled input each
candidate is the answer with probability `p > 1/2`. The number of candidates
tried before hitting one is geometric, with expected value `1/p < 2`.

Simulated over 20,000 trials:

| n | p | theory 1/p | measured mean | worst seen |
|---|---|---|---|---|
| 1,001 | 0.50050 | 1.998 | 1.998 | 14 |
| 1,000,001 | 0.50000 | 2.000 | 2.009 | 17 |

So the expected work is about **2n** — linear. The worst case is genuinely O(n²),
but it requires an adversarial arrangement with every non-majority element placed
before the first majority one, which random data essentially never produces.

This is worth knowing for two reasons. It explains a measurement that otherwise
looks impossible. And it is a warning: an algorithm can be quadratic in the worst
case and linear in practice, which means benchmarking on random data will not
find the problem.

## Python behaves differently

At n = 1,000,000:

| Approach | Time |
|---|---|
| `Counter(a).most_common(1)` | **60.8ms** |
| Boyer-Moore | 66.3ms |
| Boyer-Moore + verify | 82.0ms |
| `sorted(a)[n//2]` | 124.4ms |
| Hand-written dict count | 137.3ms |

`Counter` edges out the voting loop, because its counting runs in C while the
loop runs in the interpreter — the pattern from most of this module. But note the
hand-written dict count at 137.3ms: the same algorithm as `Counter`, written by
hand, is more than **twice as slow**. When you reach for a counting dictionary in
Python, use `Counter`.

The verification pass stays cheap here too, because `a.count(c)` is also C.

## Where this goes next

**Majority Element II** asks for every element appearing more than `n/3` times,
of which there can be at most two. The same voting idea extends by carrying two
candidates and two counters — and there the verification pass stops being optional
insurance and becomes **mandatory**, because with an `n/3` threshold the
candidates genuinely may not qualify.

<!-- @intuition -->
Picture the array as a room where every element is holding up a sign with its own value. Repeatedly send any two people with different signs out of the room together. Each removal costs the majority at most one supporter and always costs the others exactly one — and since the majority started with more supporters than everyone else combined, the room can never empty of them. Whoever is left standing is the majority.

<!-- @approach -->
### Brute Force - Count Each Candidate

<!-- @idea -->
For each element, count how many times it occurs, and return the first one exceeding half the length.

<!-- @steps -->
1. Take each element in turn as a candidate.
2. Scan the whole array counting how many times that candidate appears.
3. If the count exceeds half the array length, return the candidate.
4. Otherwise move to the next candidate.
5. Because the majority occupies over half the array, a shuffled input usually finds it within the first two candidates.

<!-- @complexity -->
- time: O(n^2) worst case, expected O(n) on shuffled input
- space: O(1)
- note: The expected cost is about 2n, because the majority occupies over half the array so each candidate is the answer with probability above one half — measured mean 2.009 candidates at n = 1,000,001 against a theoretical 2.000. The quadratic worst case requires every non-majority element to be placed first.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int majorityElement(const vector<int>& nums) {
    int n = nums.size();
    for (int i = 0; i < n; i++) {
        int count = 0;
        for (int j = 0; j < n; j++) if (nums[j] == nums[i]) count++;
        if (count > n / 2) return nums[i];
    }
    return -1;
}
```

<!-- @annotations -->
- 8: Strictly greater than n/2, not at least — an element appearing exactly half the time is not a majority.
- 9: Measured 0.01ms at n = 100,000, because it almost always finds the answer within two candidates.

<!-- @code java -->
```java
static int majorityElement(int[] nums) {
    int n = nums.length;
    for (int i = 0; i < n; i++) {
        int count = 0;
        for (int x : nums) if (x == nums[i]) count++;
        if (count > n / 2) return nums[i];
    }
    return -1;
}
```

<!-- @annotations -->
- 6: Integer division means n/2 rounds down, which is exactly the floor the definition asks for.

<!-- @code python -->
```python
def majority_element(nums):
    n = len(nums)
    for x in nums:
        if nums.count(x) > n // 2:      # count() runs in C
            return x
    return None


# Expected candidates tried: 1/p where p is the majority's share, so under 2.
# Simulated over 20,000 trials at n = 1,000,001: mean 2.009, worst seen 17.
```

<!-- @annotations -->
- 4: nums.count(x) is a full C-level scan, so each candidate costs one fast pass rather than an interpreted loop.

<!-- @approach -->
### Sorting

<!-- @idea -->
Sort the array; the element at the middle index must be the majority.

<!-- @steps -->
1. Sort the array in ascending order.
2. Observe that the majority now forms one contiguous block longer than half the array.
3. A block that long must cover the middle index regardless of where it begins.
4. Return the element at index n/2.

<!-- @complexity -->
- time: O(n log n)
- space: O(1) sorting in place, O(n) for a defensive copy
- note: Measured 96.11ms at n = 10,000,000 — 6.0x the Boyer-Moore scan. It derives a full ordering in order to read a single position, which is the same overshoot seen in Largest Element.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int majorityElement(vector<int> nums) {     // by value: caller's data survives
    sort(nums.begin(), nums.end());
    return nums[nums.size() / 2];
}
```

<!-- @annotations -->
- 5: By value costs an O(n) copy; taking a reference would leave the caller's array reordered.
- 7: No search is needed — the middle index is provably inside the majority's block.

<!-- @code java -->
```java
import java.util.Arrays;

static int majorityElement(int[] nums) {
    int[] a = Arrays.copyOf(nums, nums.length);
    Arrays.sort(a);
    return a[a.length / 2];
}
```

<!-- @annotations -->
- 4: Copying first, because Arrays.sort would otherwise reorder the caller's array as a side effect.

<!-- @code python -->
```python
def majority_element(nums):
    return sorted(nums)[len(nums) // 2]


# Verified: [2,2,1,1,1,2,2] sorts to [1,1,1,2,2,2,2]; index 3 holds 2.
# Measured 124.4ms at n = 1,000,000 — the second slowest option in Python.
```

<!-- @annotations -->
- 2: sorted() copies, so the caller's list is untouched; nums.sort() would mutate it.

<!-- @approach -->
### Hash Map Counting

<!-- @idea -->
Tally occurrences in a map and return the first key whose count exceeds half the length.

<!-- @steps -->
1. Create an empty map from value to running count.
2. Walk the array, incrementing the count for each element.
3. After each increment, check whether that count now exceeds half the array length.
4. Return that element as soon as it does, without finishing the scan.

<!-- @complexity -->
- time: O(n)
- space: O(n)
- note: Measured 61.88ms at n = 10,000,000 in C++, against 16.15ms for Boyer-Moore, because every element costs a hash, a probe and possibly an allocation. In Python, Counter is the fastest option at 60.8ms — and a hand-written dict version of the same algorithm is 137.3ms.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_map>
using namespace std;

int majorityElement(const vector<int>& nums) {
    unordered_map<int,int> freq;
    freq.reserve(nums.size() * 2);

    for (int x : nums) {
        if (++freq[x] > (int)nums.size() / 2) return x;
    }
    return -1;
}
```

<!-- @annotations -->
- 7: Reserving up front avoids rehashing as the map grows, which is a real cost on a large input.
- 10: Checking inside the loop lets it exit early rather than tallying the whole array first.
- 12: Measured 61.88ms at n = 10,000,000 — 3.8x slower than Boyer-Moore, and it allocates O(n).

<!-- @code java -->
```java
import java.util.HashMap;
import java.util.Map;

static int majorityElement(int[] nums) {
    Map<Integer,Integer> freq = new HashMap<>();

    for (int x : nums) {
        int c = freq.merge(x, 1, Integer::sum);
        if (c > nums.length / 2) return x;
    }
    return -1;
}
```

<!-- @annotations -->
- 8: merge increments in one lookup rather than a get followed by a put.

<!-- @code python -->
```python
from collections import Counter

def majority_element(nums):
    return Counter(nums).most_common(1)[0][0]


# Measured 60.8ms at n = 1,000,000 — the FASTEST Python option, because
# Counter's tallying loop runs in C.
#
# The same algorithm written by hand measured 137.3ms, more than twice as
# slow, which is the argument for using Counter rather than a bare dict:
#   freq = {}
#   for x in nums:
#       freq[x] = freq.get(x, 0) + 1
#       if freq[x] > len(nums) // 2: return x
```

<!-- @annotations -->
- 4: most_common(1) returns a list of one (value, count) pair, so two subscripts reach the value.
- 7: The only place in this subtopic where the library route wins outright in Python.

<!-- @approach -->
### Bit Counting

<!-- @idea -->
Decide each bit of the answer independently by counting how many elements have it set.

<!-- @steps -->
1. Consider each of the 32 bit positions in turn.
2. Count how many elements have that bit set.
3. If more than half of them do, the majority element must have that bit set, since it alone accounts for over half the array.
4. Set that bit in the result.
5. After all 32 positions the result is the majority element.

<!-- @complexity -->
- time: O(32n), which is O(n) with a large constant
- space: O(1)
- note: Measured 31.50ms at n = 10,000,000 — thirty-two complete passes over the array, and still twice as fast as the hash map's single pass. It is the clearest demonstration in this subtopic that sequential scans are extremely cheap relative to hashing.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int majorityElement(const vector<int>& nums) {
    int n = nums.size(), result = 0;

    for (int bit = 0; bit < 32; bit++) {
        int ones = 0;
        for (int x : nums) if ((x >> bit) & 1) ones++;
        if (ones > n / 2) result |= (1 << bit);
    }
    return result;
}
```

<!-- @annotations -->
- 7: Each bit is decided independently, because the majority alone contributes more than half the array's votes for it.
- 9: Measured 31.50ms at n = 10,000,000 — 32 full passes, and still 2x faster than the single hashing pass.

<!-- @code java -->
```java
static int majorityElement(int[] nums) {
    int n = nums.length, result = 0;

    for (int bit = 0; bit < 32; bit++) {
        int ones = 0;
        for (int x : nums) if (((x >> bit) & 1) == 1) ones++;
        if (ones > n / 2) result |= (1 << bit);
    }
    return result;
}
```

<!-- @annotations -->
- 6: Java's >> is arithmetic shift; for bit 31 on negative numbers use >>> or mask explicitly.

<!-- @code python -->
```python
def majority_element(nums):
    n = len(nums)
    result = 0
    for bit in range(32):
        ones = sum((x >> bit) & 1 for x in nums)
        if ones > n // 2:
            result |= 1 << bit
    return result


# Correct for non-negative values. Python ints are arbitrary precision and
# negative numbers are not two's-complement-bounded, so negatives need an
# explicit width and sign handling that the C++ and Java versions get free.
```

<!-- @annotations -->
- 5: Thirty-two interpreted passes over the whole array, which makes this the wrong choice in Python specifically.
- 11: A genuine language difference: the fixed 32-bit assumption simply does not hold for a Python int.

<!-- @approach -->
### Optimal - Boyer-Moore Voting

<!-- @idea -->
Carry one candidate and one counter, letting disagreements cancel out, and confirm the survivor.

<!-- @steps -->
1. Set the counter to zero and leave the candidate undefined.
2. Visit each element once.
3. If the counter is zero, adopt this element as the candidate and set the counter to one.
4. Otherwise increase the counter if the element equals the candidate, and decrease it if it does not.
5. After the scan, the candidate is the majority if one exists.
6. Make a second pass counting the candidate to confirm it, unless a majority is guaranteed by the problem.

<!-- @complexity -->
- time: O(n), or O(2n) with verification
- space: O(1)
- note: Verified over 196,230 arrays that have a majority with zero failures. Measured 16.15ms at n = 10,000,000 — the fastest approach, 3.8x the hash map and 6.0x the sort — with verification adding only 5.5%.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int majorityElement(const vector<int>& nums) {
    int candidate = 0, count = 0;

    for (int x : nums) {
        if (count == 0) { candidate = x; count = 1; }
        else if (x == candidate) count++;
        else count--;
    }
    return candidate;
}

// Use this whenever a majority is not guaranteed. Measured 17.04ms against
// 16.15ms at n = 10,000,000 — the safety costs 5.5%.
int majorityElementVerified(const vector<int>& nums) {
    int candidate = majorityElement(nums), count = 0;
    for (int x : nums) if (x == candidate) count++;
    return count > (int)nums.size() / 2 ? candidate : -1;
}
```

<!-- @annotations -->
- 8: A zero counter means every earlier vote has cancelled out, so the past can be discarded entirely.
- 10: Each decrement destroys one majority vote and one non-majority vote together — the cancellation that makes this work.
- 12: Measured 16.15ms at n = 10,000,000: 3.8x faster than the hash map and 6.0x faster than sorting, in O(1) space.
- 19: Without this pass, [1,2,3] returns 3 and [1,1,2,2] returns 1, both with no error of any kind.

<!-- @code java -->
```java
static int majorityElement(int[] nums) {
    int candidate = 0, count = 0;

    for (int x : nums) {
        if (count == 0) { candidate = x; count = 1; }
        else if (x == candidate) count++;
        else count--;
    }
    return candidate;
}

static int majorityElementVerified(int[] nums) {
    int candidate = majorityElement(nums), count = 0;
    for (int x : nums) if (x == candidate) count++;
    return count > nums.length / 2 ? candidate : -1;
}
```

<!-- @annotations -->
- 5: Two integers of state regardless of input size, which is what O(1) space means here.
- 14: Returning a sentinel is one option; throwing or returning an Optional are better when -1 is a possible value.

<!-- @code python -->
```python
def majority_element(nums):
    candidate = None
    count = 0

    for x in nums:
        if count == 0:
            candidate, count = x, 1
        elif x == candidate:
            count += 1
        else:
            count -= 1

    return candidate


def majority_element_verified(nums):
    c = majority_element(nums)
    return c if nums.count(c) > len(nums) // 2 else None


# Measured 66.3ms at n = 1,000,000, just behind Counter at 60.8ms.
# Verification adds 15.7ms, and nums.count() runs in C so it stays cheap.
```

<!-- @annotations -->
- 6: count == 0 means everything so far has cancelled, so the candidate can be replaced with no loss.
- 18: nums.count(c) is a single C-level pass, which is why verifying is affordable even in Python.

<!-- @example -->

<!-- @input -->
nums = [2, 2, 1, 1, 1, 2, 2]

<!-- @output -->
2

<!-- @why -->
The candidate changes twice during this scan, which is the behaviour that makes the algorithm look unreliable until the cancellation argument explains why the final survivor is still guaranteed correct.

<!-- @walkthrough -->
1. Start with the counter at zero, so the first 2 becomes the candidate with count 1.
2. The second 2 matches, taking the count to 2.
3. A 1 disagrees, dropping the count to 1 — one vote for 2 and one for 1 have cancelled.
4. Another 1 disagrees, dropping the count to 0, so all votes so far have annihilated each other.
5. The next 1 arrives with the count at zero, so 1 becomes the new candidate with count 1.
6. A 2 disagrees, cancelling back to 0, and the final 2 arrives at zero to become the candidate again with count 1.
7. The scan ends with 2 as the candidate, and counting confirms it appears 4 times in 7 — a genuine majority.

<!-- @example -->

<!-- @input -->
nums = [1, 2, 3] and nums = [1, 1, 2, 2], with no verification

<!-- @output -->
Returns 3 and 1 — neither is a majority, and nothing signals it

<!-- @why -->
The reason the verification pass exists. The algorithm's contract is conditional, and when the condition is broken it does not fail loudly — it produces a plausible wrong answer.

<!-- @walkthrough -->
1. On [1, 2, 3] every element disagrees with the one before, so the count returns to zero at each step.
2. The last element seen becomes the final candidate, so the algorithm returns 3.
3. 3 appears once in an array of three, where a majority needs more than one occurrence.
4. On [1, 1, 2, 2] the two 1s build a count of 2 and the two 2s cancel it back to 0, leaving 1 as the candidate.
5. 1 appears twice in an array of four, and a majority needs more than two.
6. In both cases an ordinary-looking element of the array is returned with no exception and no sentinel — there is no failure mode to detect.

<!-- @example -->

<!-- @input -->
The same 10,000,000-element array through every approach

<!-- @output -->
Boyer-Moore 16.15ms, bit counting 31.50ms, hash 61.88ms, sort 96.11ms

<!-- @why -->
Unlike Two Sum, where the O(n) hash map lost to an O(n log n) sort, here the asymptotically best approach is also the fastest — and the bit-counting result shows why: sequential scanning is close to free.

<!-- @walkthrough -->
1. Boyer-Moore performs one sequential pass holding two integers, and finishes in 16.15ms.
2. The bit-counting variant performs thirty-two complete passes over the same array and finishes in 31.50ms.
3. That means thirty-two sequential scans cost only twice what one hashing pass costs.
4. The hash map needs 61.88ms for its single pass, because each element is hashed, probed and possibly allocated for.
5. Sorting takes 96.11ms to derive a complete ordering from which only one position is read.
6. Adding the verification pass to Boyer-Moore brings it to 17.04ms, an increase of 5.5%.

<!-- @example -->

<!-- @input -->
Brute force at n = 100,000 on shuffled input

<!-- @output -->
0.01ms — linear in practice, not quadratic

<!-- @why -->
Explains a measurement that otherwise looks impossible, and warns that an algorithm can be quadratic in the worst case while looking linear on every random benchmark you run.

<!-- @walkthrough -->
1. Brute force tests the element at index 0 first and counts its occurrences.
2. The majority occupies more than half the array, so a shuffled a[0] is the majority with probability above one half.
3. The number of candidates tried before finding it is therefore geometric with expected value 1/p, which is under 2.
4. Simulated over 20,000 trials at n = 1,000,001: a mean of 2.009 candidates against the theoretical 2.000, with a worst case of 17.
5. The expected total work is about 2n, which is linear, and explains the measured 0.01ms.
6. The O(n^2) worst case is real but requires every non-majority element to be placed before the first majority one, which shuffled data essentially never produces.

<!-- @visualization array -->

<!-- @description -->
The array as a strip of cells, each tinted by its value so runs and repetitions are visible as colour before any counting starts. Above it sit two readouts drawn as physical objects rather than numbers: a CANDIDATE badge holding a coloured token, and a COUNTER shown as a stack of chips. A marker advances left to right. When the element matches the candidate, drop a chip onto the stack and pulse the matching cell. When it disagrees, animate the decisive beat — take one chip off the stack and send it off screen together with the disagreeing cell's token, physically paired, so the cancellation is seen as two votes destroying each other rather than as a number going down. When the stack empties, grey the badge, then have the very next element drop its token into it and start a fresh stack. Run a persistent tally at the bottom showing true counts per value, greyed out and clearly labelled as not something the algorithm knows, so the reader can see the majority quietly staying ahead while the algorithm tracks none of it. On [2,2,1,1,1,2,2] the candidate visibly changes twice, which is the moment the algorithm looks broken — hold that frame, then run the cancellation ledger beside it: majority votes spent versus non-majority votes available, showing the non-majority side exhausting first. The verification panel replays the finish with a second marker sweeping the strip and tallying the surviving candidate, ending on 4 of 7 against the threshold of 3. Beneath, a failure panel runs [1,2,3] and [1,1,2,2] with the same machinery: every vote cancels, the last element to arrive at an empty counter wins by default, and the answer is printed with an ordinary-looking badge and no error marker at all — annotated with the count it actually achieved against the threshold it needed. Close with a cost bar at n = 10,000,000: Boyer-Moore 16.15ms, plus verification 17.04ms, bit counting 31.50ms across thirty-two passes, hash 61.88ms, sort 96.11ms.

<!-- @sampleInput -->
```json
{"primary":{"array":[2,2,1,1,1,2,2],"trace":[{"i":0,"x":2,"action":"adopt","candidate":2,"count":1},{"i":1,"x":2,"action":"agree","candidate":2,"count":2},{"i":2,"x":1,"action":"cancel","candidate":2,"count":1},{"i":3,"x":1,"action":"cancel","candidate":2,"count":0},{"i":4,"x":1,"action":"adopt","candidate":1,"count":1},{"i":5,"x":2,"action":"cancel","candidate":1,"count":0},{"i":6,"x":2,"action":"adopt","candidate":2,"count":1}],"candidateChanges":2,"finalCandidate":2,"trueCounts":{"2":4,"1":3},"n":7,"threshold":3},"verification":{"candidate":2,"actualCount":4,"threshold":3,"passes":true},"cancellationLedger":{"majorityVotes":4,"nonMajorityVotes":3,"maxPossibleCancellations":3,"majorityVotesSurviving":1},"failurePanel":[{"array":[1,2,3],"returns":3,"actualCount":1,"needed":2,"errorRaised":false},{"array":[1,1,2,2],"returns":1,"actualCount":2,"needed":3,"errorRaised":false},{"array":[1,2,3,4],"returns":3,"actualCount":1,"needed":3,"errorRaised":false}],"exhaustive":{"withMajority":196230,"failures":0,"withoutMajority":600930,"errorsRaised":0},"costPanel":{"n":10000000,"boyerMs":16.15,"boyerVerifiedMs":17.04,"verifyOverheadPct":5.5,"bitsMs":31.50,"bitPasses":32,"hashMs":61.88,"sortMs":96.11},"bruteExpected":{"n":1000001,"p":0.5,"theoryCandidates":2.0,"measuredCandidates":2.009,"worstSeen":17}}
```

<!-- @highlights -->
- Each cell is tinted by its value, so the repetitions are visible as colour before any counting begins.
- The counter is drawn as a stack of chips and the candidate as a badge holding a coloured token, not as bare numbers.
- The first 2 arrives at an empty stack, takes the badge, and drops one chip.
- The second 2 agrees, and a second chip lands on the stack.
- A 1 disagrees, and one chip leaves the stack paired with that cell's token — two votes destroying each other, not a number decrementing.
- Another 1 cancels the last chip, emptying the stack and greying the badge.
- The next 1 arrives at an empty counter and takes the badge for itself, so the candidate has now changed.
- A 2 cancels it straight back to empty, and the final 2 claims the badge again.
- The candidate changed twice during this scan, which is the frame where the algorithm looks unreliable.
- The cancellation ledger opens beside it: 4 majority votes against 3 non-majority ones, so at most 3 cancellations are possible.
- One majority vote therefore survives no matter how the cancellations are arranged, which is why the final badge must be correct.
- The greyed tally at the bottom shows the true counts throughout, labelled as information the algorithm never has.
- The verification pass sends a second marker across the strip and tallies the candidate at 4 of 7, clearing the threshold of 3.
- The failure panel runs [1,2,3], where every vote cancels and the last arrival wins the badge by default, returning 3.
- 3 appears once against a threshold of 2, and the badge is drawn exactly as it was on the successful run — no error marker anywhere.
- The cost bar closes it: Boyer-Moore 16.15ms, with verification 17.04ms, bit counting 31.50ms over thirty-two passes, hash 61.88ms, sort 96.11ms.

<!-- @edgeCases -->
- Single-element array — that element is trivially the majority, and the counter adopts it on the first step.
- Two identical elements — the count reaches 2 and never cancels.
- Two different elements — they cancel to zero and neither is a majority, which only verification detects.
- All elements identical — the counter climbs to n and the candidate never changes.
- The majority appearing exactly n/2 times — NOT a majority, since the definition requires strictly more than half.
- The majority split across the array with non-majority elements interleaved, which makes the candidate change mid-scan while the answer stays correct.
- All majority elements at the end of the array — the candidate is replaced repeatedly before settling.
- An array with no majority at all — the algorithm returns an arbitrary element with no error, which is the case verification exists for.
- An even-length array where two values tie at exactly half each, such as [1,1,2,2] — no majority exists and the algorithm still returns one.
- Negative values — nothing in the voting depends on sign, though the bit-counting variant needs care with the sign bit.
- Very large arrays where the hash map's allocation dominates, measured 61.88ms against Boyer-Moore's 16.15ms at n = 10,000,000.

<!-- @pitfalls -->
- Using Boyer-Moore without verification when a majority is not guaranteed. Verified on [1,2,3] it returns 3 and on [1,1,2,2] it returns 1, both with no error of any kind.
- Assuming the verification pass is expensive. Measured 17.04ms against 16.15ms at n = 10,000,000 — 5.5%, which is never worth the risk it removes.
- Testing count >= n/2 rather than > n/2. An element appearing exactly half the time is not a majority, and the difference only shows on even-length inputs.
- Resetting the candidate when the count merely drops rather than when it reaches exactly zero, which discards a still-leading candidate.
- Believing the candidate changing mid-scan means the algorithm is wrong. It changes twice on [2,2,1,1,1,2,2] and still returns the correct answer.
- Trying to track counts of multiple values in the voting loop. It works precisely because it does not count occurrences — it runs a cancellation.
- Sorting the caller's array in place to read the middle element, leaving their data permanently reordered by a read-only-looking query.
- Writing a counting dictionary by hand in Python. Measured 137.3ms against Counter's 60.8ms for exactly the same algorithm.
- Assuming the brute force is safely quadratic and therefore unusable. It measured 0.01ms at n = 100,000 because it usually succeeds within two candidates.
- Concluding from that measurement that the brute force is fine. Its worst case is genuinely O(n^2) and random benchmarking will never reveal it.
- Applying the bit-counting variant to Python integers without bounding the width, since Python ints are arbitrary precision and not two's-complement.
- Extending this directly to Majority Element II. The n/3 version needs two candidates and two counters, and its verification pass is mandatory rather than optional.

<!-- @doubt -->
### Why does Boyer-Moore work? It looks like it just guesses.

<!-- @answer -->
Think of each element as a vote and each disagreement as a mutual annihilation: one vote for the candidate and one against it destroy each other. The majority element has more than n/2 votes, and everything else combined has fewer than n/2. So even if every single non-majority vote is spent cancelling a majority vote, the non-majority side runs out first — there are not enough of them to wipe the majority out. Some majority votes must survive, so the last candidate standing is the majority. It is not counting occurrences at all; it is running a war of attrition that the majority is arithmetically guaranteed to win. Verified over 196,230 arrays that have a majority, with zero failures.

<!-- @doubt -->
### The candidate changes partway through my trace. Is that a bug?

<!-- @answer -->
No, it is normal and it happens on the problem's own example. On [2,2,1,1,1,2,2] the candidate is 2, then becomes 1 after the votes cancel to zero, then becomes 2 again — two changes in a seven-element array, and the final answer is still correct. The candidate is not a running best guess in the way that best is in Largest Element; it is whoever happens to be holding the floor after all cancellations so far. What the cancellation argument guarantees is only the state at the very end, not any intermediate step.

<!-- @doubt -->
### What happens if there is no majority element?

<!-- @answer -->
It returns a wrong answer and gives you no indication. On [1,2,3] it returns 3, which appears once in three elements; on [1,1,2,2] it returns 1, which appears twice in four. There is no exception, no sentinel, and no failure mode to detect — the output is an ordinary element of the array. Across the 600,930 no-majority arrays tested it returned a value every single time. That is why the second pass exists: count the candidate and confirm it exceeds n/2. LeetCode 169 guarantees a majority so you may skip it there, but in code where the guarantee is not written down, verify.

<!-- @doubt -->
### Isn't the verification pass expensive?

<!-- @answer -->
It is almost free. Measured at n = 10,000,000: 16.15ms without it and 17.04ms with it, an increase of 5.5%. It is a single sequential scan comparing integers, which is the cheapest thing a processor does, and it still leaves Boyer-Moore roughly 3.6x faster than the hash map. In Python it stays cheap too, because nums.count() runs in C. There is no performance argument for omitting it — only the argument that the problem statement already promises a majority.

<!-- @doubt -->
### Why does sorting and taking the middle element work?

<!-- @answer -->
Because a value occupying more than half the positions forms, after sorting, one contiguous block longer than half the array. A block that long cannot avoid the middle index no matter where it starts — if it began after the middle it would run off the end, and if it ended before the middle it would be too short. So index n/2 is always inside it. Verified: [2,2,1,1,1,2,2] sorts to [1,1,1,2,2,2,2] and index 3 holds 2. It is correct and it costs O(n log n) to read a single position.

<!-- @doubt -->
### Should I use the hash map instead? It's also O(n).

<!-- @answer -->
Not if you can use Boyer-Moore. Measured at n = 10,000,000: the hash map took 61.88ms and Boyer-Moore 16.15ms — 3.8x — and the hash map also allocates O(n) memory where Boyer-Moore uses two integers. This is the opposite of the Two Sum result, where the O(n) hash map lost to an O(n log n) sort. Here the asymptotically best approach is also the practically best one, because it is a single sequential scan with no allocation. The one exception is Python, where Counter measured 60.8ms against the interpreted voting loop's 66.3ms.

<!-- @doubt -->
### Why did my brute force run so fast? It's supposed to be O(n^2).

<!-- @answer -->
Because on this problem it usually is not. Brute force tests a[0] first, and the majority occupies more than half the array, so on shuffled input each candidate is the answer with probability above one half. The number of candidates tried before hitting one is geometric with expected value 1/p, which is under 2 — simulated over 20,000 trials at n = 1,000,001, the mean was 2.009 against a theoretical 2.000, with a worst case of 17. Expected work is about 2n, which is why it measured 0.01ms at n = 100,000. The quadratic worst case is real and requires an adversarial arrangement, which is precisely why random benchmarking will never find it.

<!-- @doubt -->
### How does the bit-counting approach work, and is it worth using?

<!-- @answer -->
Each bit of the answer is decided independently: count how many elements have bit k set, and if more than half do, the majority element must have that bit set, because it alone accounts for over half the array. Repeat for all 32 bits. It is O(1) space and measured 31.50ms at n = 10,000,000 — which is remarkable, because that is thirty-two complete passes over the array coming in twice as fast as the hash map's single pass. As a practical choice Boyer-Moore is simpler and twice as fast again, but the measurement is worth carrying: sequential scanning is close to free compared with hashing.

<!-- @doubt -->
### How does this extend to elements appearing more than n/3 times?

<!-- @answer -->
There can be at most two such elements, so the voting idea extends by carrying two candidates and two counters, cancelling only when an element matches neither. The important difference is the verification: here it is optional insurance because the problem promises a majority, but with an n/3 threshold no such promise exists and the two surviving candidates genuinely may not qualify. That pass becomes mandatory rather than defensive, which is the main thing to carry forward from this subtopic into Majority Element II.
