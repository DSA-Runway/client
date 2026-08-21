---
id: leaders-in-an-array
topic: Arrays
title: Leaders in an Array
difficulty: Medium
status: ready
prerequisites:
  - largest-element
  - next-permutation
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - largest-element
  - next-permutation
  - kadanes-algorithm
  - print-the-matrix-in-spiral-manner
---

<!-- @summary -->
Find every element greater than everything to its right — where the answer is only about log n elements long, the brute force is O(n log n) rather than the quadratic it looks like, and the same harmonic number governs both facts.

<!-- @theory -->
## The problem

An element is a **leader** if it is greater than every element to its right. The
last element is always a leader, since there is nothing to its right.

```
[16, 17, 4, 3, 5, 2]  ->  [17, 5, 2]
```

17 beats 4, 3, 5, 2. 5 beats 2. 2 is last. 16 fails because 17 is to its right.

## Pin the definition down first

"Greater than everything to its right" has two defensible readings when values
repeat, and they are **not** a minor detail:

```
[1, 2, 2]   strictly greater  ->  [2]        the middle 2 is not > the last 2
            greater or equal  ->  [2, 2]
```

Over all 9,840 arrays over the values {0,1,2} with n up to 8, the two
definitions **disagree on 92.23% of them**. Whichever you pick, pick it before
writing code, and put a repeated value in your tests.

This lesson uses the strict reading, which is the standard one.

## The obvious solution, and what it actually costs

For each element, scan everything to its right and check whether anything beats
it:

```
for i in 0..n-1:
    if no j > i has a[j] >= a[i]:
        a[i] is a leader
```

That looks like O(n²), and in the worst case it is. But **the inner loop breaks
at the first element that beats the candidate**, and on random input that
happens quickly. Measured steps per element:

| n | measured | H_n − 1 |
|---|---|---|
| 100 | 4.1454 | 4.1874 |
| 400 | 5.5816 | 5.5699 |
| 1,600 | 6.9858 | 6.9553 |
| 6,400 | 8.3753 | 8.3413 |
| 25,600 | 9.8402 | 9.7276 |

That is the harmonic number again — so the brute force is **O(n log n) expected**
on random input, not quadratic.

It becomes genuinely quadratic when no inner loop ever breaks early, which
happens exactly when the array is **descending**: every element beats everything
to its right, so every scan runs to the end. Measured n/2 steps per element —
4,999.50 at n = 10,000 — and against the optimal scan:

| n | brute force | optimal | ratio |
|---|---|---|---|
| 1,000 | 0.2713ms | 0.0015ms | 181x |
| 4,000 | 4.2949ms | 0.0045ms | 954x |
| 16,000 | 67.5174ms | 0.0181ms | 3,734x |
| 64,000 | 1,096.5395ms | 0.0679ms | **16,146x** |

Roughly 4x per doubling — the quadratic signature.

## The optimal solution

Read the definition backwards. Walking **right to left**, an element is a leader
exactly when it exceeds the largest value seen so far. So carry a running
maximum:

```
max = -infinity
for i from n-1 down to 0:
    if a[i] > max:
        a[i] is a leader
        max = a[i]
```

One pass, one variable. This is the same running-maximum idea as **Largest
Element**, with the scan reversed and every improvement recorded rather than
just the final one.

**The trap:** scanning right to left produces the leaders in right-to-left
order. The expected answer is in the array's original order, so the result has
to be reversed at the end. Forgetting that reversal failed **85.2% of the 5,913
distinct-value arrangements** of n = 1..7 — a loud, obvious bug, which is a
pleasant change from the previous subtopic where the classic mistakes were
invisible on distinct values.

## How big is the answer?

Small. Much smaller than most people expect:

| n | Mean number of leaders | H_n |
|---|---|---|
| 4 | 2.0840 | 2.0833 |
| 16 | 3.3824 | 3.3807 |
| 256 | 6.1246 | 6.1243 |
| 4,096 | 8.8908 | 8.8951 |
| 65,536 | 11.7290 | 11.6676 |

The count is the **harmonic number** H_n = 1 + 1/2 + ... + 1/n ≈ ln n + 0.5772.
An array of 65,536 random values has about **twelve** leaders.

The reason is neat: the element at position i is a leader precisely when it is
the largest of the n − i values from i onward, which has probability 1/(n − i).
Summing those probabilities over every position gives exactly H_n.

So the output is **O(log n) expected** — though still O(n) worst case, on the
same descending input that makes the brute force quadratic. Descending input is
the worst case for both the work and the answer size at once.

## Which one to write

The right-to-left scan. It is one pass, one variable, three lines, and it is
O(n) regardless of input shape. The brute force is not the disaster it looks
like on random data, but it collapses on exactly the input a caller is most
likely to produce accidentally — a sorted-descending array.

<!-- @intuition -->
Stand at the right-hand end of the array and walk left, keeping a note of the tallest thing you have passed. Anything taller than that note can see clear over everything behind it to the edge — that is what being a leader means. Update the note whenever you pass something taller. You never need to look right again, because the note already summarises everything there in a single number.

<!-- @approach -->
### Brute Force - Check Everything to the Right

<!-- @idea -->
For each element, scan the rest of the array and keep it if nothing there is greater or equal.

<!-- @steps -->
1. Take each position in turn, from left to right.
2. Scan every position to its right.
3. Stop that scan as soon as a value greater than or equal to the candidate is found.
4. If the scan finished without finding one, the candidate is a leader.
5. Collect the leaders in the order they were found, which is already the array's order.

<!-- @complexity -->
- time: O(n log n) expected on random input, O(n^2) worst case
- space: O(1) beyond the output
- note: Not as bad as it looks on random data — the early exit brings steps per element down to H_n - 1, measured 4.1454 at n = 100 and 9.8402 at n = 25,600. It becomes truly quadratic on descending input, where it measured 16,146x slower than the optimal scan at n = 64,000.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> leaders(const vector<int>& a) {
    vector<int> out;
    int n = a.size();

    for (int i = 0; i < n; i++) {
        bool isLeader = true;
        for (int j = i + 1; j < n; j++) {
            if (a[j] >= a[i]) { isLeader = false; break; }   // early exit
        }
        if (isLeader) out.push_back(a[i]);
    }
    return out;
}
```

<!-- @annotations -->
- 11: This break is why the brute force is O(n log n) expected rather than quadratic — measured H_n - 1 steps per element.
- 13: Collected left to right, so no reversal is needed here. The optimal version does need one.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.List;

static List<Integer> leaders(int[] a) {
    List<Integer> out = new ArrayList<>();

    for (int i = 0; i < a.length; i++) {
        boolean isLeader = true;
        for (int j = i + 1; j < a.length; j++) {
            if (a[j] >= a[i]) { isLeader = false; break; }
        }
        if (isLeader) out.add(a[i]);
    }
    return out;
}
```

<!-- @annotations -->
- 9: Greater-or-equal, not greater: a later equal value disqualifies the candidate under the strict definition.

<!-- @code python -->
```python
def leaders(a):
    out = []
    n = len(a)

    for i in range(n):
        is_leader = True
        for j in range(i + 1, n):
            if a[j] >= a[i]:
                is_leader = False
                break
        if is_leader:
            out.append(a[i])
    return out


# Measured on descending input: 1,096.5395ms at n = 64,000,
# against 0.0679ms for the right-to-left scan.
```

<!-- @annotations -->
- 7: On descending input this loop never breaks early, which is where the quadratic behaviour actually appears.

<!-- @approach -->
### Suffix Maximum Array

<!-- @idea -->
Precompute the maximum of every suffix, then a single left-to-right pass can test each element in constant time.

<!-- @steps -->
1. Build an array where each entry holds the maximum of everything from that index to the end.
2. Fill it right to left, each entry being the larger of the current value and the entry to its right.
3. Walk the array left to right.
4. An element is a leader when it exceeds the suffix maximum starting just after it.
5. The last element is always a leader, since there is no suffix after it.

<!-- @complexity -->
- time: O(n), two passes
- space: O(n) for the suffix table
- note: Correct and easy to reason about, and it produces the output already in array order. The table is unnecessary though: the only value ever read is the one immediately to the right, so a single variable does the same job. Measured 1.3490ms at n = 1,000,000 against 0.5194ms for the one-variable version.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<int> leaders(const vector<int>& a) {
    int n = a.size();
    if (n == 0) return {};

    vector<int> suffixMax(n);
    suffixMax[n - 1] = a[n - 1];
    for (int i = n - 2; i >= 0; i--)
        suffixMax[i] = max(a[i], suffixMax[i + 1]);

    vector<int> out;
    for (int i = 0; i < n; i++)
        if (i == n - 1 || a[i] > suffixMax[i + 1]) out.push_back(a[i]);
    return out;
}
```

<!-- @annotations -->
- 11: Built right to left, because each entry depends on the one after it.
- 16: Comparing against suffixMax[i+1], not suffixMax[i] — the element must beat what comes AFTER it, not include itself.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.List;

static List<Integer> leaders(int[] a) {
    int n = a.length;
    if (n == 0) return new ArrayList<>();

    int[] suffixMax = new int[n];
    suffixMax[n - 1] = a[n - 1];
    for (int i = n - 2; i >= 0; i--)
        suffixMax[i] = Math.max(a[i], suffixMax[i + 1]);

    List<Integer> out = new ArrayList<>();
    for (int i = 0; i < n; i++)
        if (i == n - 1 || a[i] > suffixMax[i + 1]) out.add(a[i]);
    return out;
}
```

<!-- @annotations -->
- 14: The output comes out in array order directly, so this variant needs no reversal.

<!-- @code python -->
```python
def leaders(a):
    n = len(a)
    if n == 0:
        return []

    suffix_max = [0] * n
    suffix_max[-1] = a[-1]
    for i in range(n - 2, -1, -1):
        suffix_max[i] = max(a[i], suffix_max[i + 1])

    return [a[i] for i in range(n)
            if i == n - 1 or a[i] > suffix_max[i + 1]]


# Measured 1.3490ms at n = 1,000,000, against 0.5194ms for the
# running-maximum scan — same complexity, 2.6x the time, from the extra array.
```

<!-- @annotations -->
- 8: Each entry folds in the one to its right, which is what makes the whole table O(n) rather than O(n^2).

<!-- @approach -->
### Optimal - Right-to-Left Running Maximum

<!-- @idea -->
Walk right to left carrying the largest value seen so far; anything exceeding it is a leader.

<!-- @steps -->
1. Set the running maximum to negative infinity.
2. Walk the array from the last index down to the first.
3. If the current value exceeds the running maximum, it is a leader.
4. Record it and update the running maximum to that value.
5. Reverse the collected leaders at the end, since they were found right to left.

<!-- @complexity -->
- time: O(n), one pass
- space: O(1) beyond the output; the output itself averages O(log n)
- note: The recommended solution. O(n) regardless of input shape, where the brute force degrades to quadratic on descending input. Measured 0.0679ms at n = 64,000 descending against the brute force's 1,096.5395ms.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

vector<int> leaders(const vector<int>& a) {
    vector<int> out;
    int runningMax = INT_MIN;

    for (int i = (int)a.size() - 1; i >= 0; i--) {
        if (a[i] > runningMax) {                 // strictly greater
            out.push_back(a[i]);
            runningMax = a[i];
        }
    }
    reverse(out.begin(), out.end());             // found right to left
    return out;
}
```

<!-- @annotations -->
- 8: INT_MIN rather than 0, so the last element is always recorded even when every value is negative.
- 11: Strictly greater implements the strict definition. Using >= gives the other reading, which differs on 92.23% of arrays with duplicates.
- 16: Omitting this reversal failed 85.2% of the 5,913 distinct-value arrangements tested.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

static List<Integer> leaders(int[] a) {
    List<Integer> out = new ArrayList<>();
    int runningMax = Integer.MIN_VALUE;

    for (int i = a.length - 1; i >= 0; i--) {
        if (a[i] > runningMax) {
            out.add(a[i]);
            runningMax = a[i];
        }
    }
    Collections.reverse(out);
    return out;
}
```

<!-- @annotations -->
- 9: Counting down from the last index is the whole idea — the running maximum then summarises everything to the right.

<!-- @code python -->
```python
def leaders(a):
    out = []
    running_max = float("-inf")

    for i in range(len(a) - 1, -1, -1):
        if a[i] > running_max:
            out.append(a[i])
            running_max = a[i]

    out.reverse()
    return out


# The output averages H_n elements: measured 6.1246 at n = 256 and
# 11.7290 at n = 65,536, against H_n of 6.1243 and 11.6676.
```

<!-- @annotations -->
- 6: One comparison per element and one variable of state — nothing about the right-hand side is stored.
- 10: In place, because the list was built backwards. Inserting at the front instead would be O(n) per leader.

<!-- @approach -->
### The Non-Strict Variant

<!-- @idea -->
Treat an element as a leader when it is greater than or equal to everything on its right, which keeps repeated maxima.

<!-- @steps -->
1. Walk right to left carrying the running maximum, exactly as before.
2. Record the element when it is greater than or equal to the running maximum.
3. Update the running maximum the same way.
4. Reverse at the end, as before.
5. The only change from the strict version is one comparison operator.

<!-- @complexity -->
- time: O(n), one pass
- space: O(1) beyond the output
- note: Identical cost to the strict version. It is listed separately because the choice between them is a specification decision rather than an optimisation: measured over all 9,840 arrays over {0,1,2} with n up to 8, the two produce different answers on 92.23%.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

// [1,2,2] -> [2,2] here, where the strict version gives [2]
vector<int> leadersNonStrict(const vector<int>& a) {
    vector<int> out;
    int runningMax = INT_MIN;

    for (int i = (int)a.size() - 1; i >= 0; i--) {
        if (a[i] >= runningMax) {                // >= keeps repeated maxima
            out.push_back(a[i]);
            runningMax = a[i];
        }
    }
    reverse(out.begin(), out.end());
    return out;
}
```

<!-- @annotations -->
- 12: The single character separating the two definitions, which disagree on 92.23% of arrays containing duplicates.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

static List<Integer> leadersNonStrict(int[] a) {
    List<Integer> out = new ArrayList<>();
    int runningMax = Integer.MIN_VALUE;

    for (int i = a.length - 1; i >= 0; i--) {
        if (a[i] >= runningMax) {
            out.add(a[i]);
            runningMax = a[i];
        }
    }
    Collections.reverse(out);
    return out;
}
```

<!-- @annotations -->
- 10: On input with no duplicates this is identical to the strict version, which is why the choice must be tested with repeats.

<!-- @code python -->
```python
def leaders_non_strict(a):
    out = []
    running_max = float("-inf")

    for i in range(len(a) - 1, -1, -1):
        if a[i] >= running_max:
            out.append(a[i])
            running_max = a[i]

    out.reverse()
    return out


# [1,2,2] -> [2,2]        strict version gives [2]
# [3,3,3] -> [3,3,3]      strict version gives [3]
# The two agree on every array with no repeated values.
```

<!-- @annotations -->
- 6: Only the operator changed. Everything else about the algorithm is identical to the strict version.

<!-- @example -->

<!-- @input -->
a = [16, 17, 4, 3, 5, 2]

<!-- @output -->
[17, 5, 2]

<!-- @why -->
Shows the running maximum standing in for the entire right-hand side, and the reversal that the right-to-left scan makes necessary.

<!-- @walkthrough -->
1. Start at the right end with the running maximum at negative infinity.
2. 2 exceeds it, so 2 is a leader and the running maximum becomes 2.
3. 5 exceeds 2, so 5 is a leader and the running maximum becomes 5.
4. 3 does not exceed 5, so it is skipped, and 4 does not either.
5. 17 exceeds 5, so 17 is a leader and the running maximum becomes 17.
6. 16 does not exceed 17, so it is skipped.
7. The collected order was 2, 5, 17 — reversing gives [17, 5, 2].

<!-- @example -->

<!-- @input -->
a = [1, 2, 2] under each definition

<!-- @output -->
[2] strictly, [2, 2] non-strictly

<!-- @why -->
The fork is a specification decision, not an implementation detail, and it is invisible on exactly the distinct-value inputs people test with.

<!-- @walkthrough -->
1. The last 2 is a leader either way, since nothing follows it.
2. The middle 2 is compared against a running maximum of 2.
3. Strictly greater: 2 > 2 is false, so it is not a leader.
4. Greater or equal: 2 >= 2 is true, so it is a leader.
5. The 1 fails under both, since 1 is below 2.
6. Measured over all 9,840 arrays over {0,1,2} with n up to 8, the two definitions disagree on 92.23%.
7. On arrays with no repeated values they never disagree at all.

<!-- @example -->

<!-- @input -->
A random array of 65,536 values

<!-- @output -->
About 12 leaders — the answer is O(log n), not O(n)

<!-- @why -->
Sets expectations about output size, and it is the same harmonic number that governs the brute force's running time.

<!-- @walkthrough -->
1. The element at position i is a leader exactly when it is the largest of the values from i to the end.
2. There are n − i such values and each is equally likely to be the largest, so the probability is 1/(n − i).
3. Summing that over every position gives 1 + 1/2 + 1/3 + ... + 1/n, the harmonic number.
4. H_n grows like ln n, so the leader count grows logarithmically.
5. Measured 6.1246 at n = 256 against H_n of 6.1243.
6. Measured 11.7290 at n = 65,536 against H_n of 11.6676.
7. So a 65,536-element array yields roughly twelve leaders.

<!-- @example -->

<!-- @input -->
A strictly descending array of 64,000 values

<!-- @output -->
1,096.5395ms brute force against 0.0679ms optimal — 16,146x

<!-- @why -->
The one input shape where the brute force's early exit stops helping, and it is a shape callers produce accidentally by sorting.

<!-- @walkthrough -->
1. Every element beats everything to its right, so every element is a leader.
2. The brute force's inner loop therefore never breaks early and runs to the end each time.
3. Measured n/2 steps per element: 4,999.50 at n = 10,000.
4. The ratio against the optimal scan grows roughly 4x per doubling — 181x, 954x, 3,734x, 16,146x.
5. That 4x-per-doubling growth is the quadratic signature.
6. The optimal scan is unaffected, because it never looks right at all.
7. Descending input is simultaneously the worst case for the work and for the answer size.

<!-- @visualization array -->

<!-- @description -->
The array as a strip, with a scan marker entering from the RIGHT edge — the direction is the lesson, so make the marker's entry from the right unmistakable rather than incidental. Carry a single labelled box above the strip holding the running maximum, and draw a translucent horizontal band across the whole strip at that value's height, so the running maximum reads as a rising water line rather than a number to track mentally. As the marker moves left, cells below the line dim immediately: they are disqualified and will never be reconsidered. When a cell rises above the line, flash it, promote it into a results row below, and step the water line up to its height — the line only ever rises, which is the invariant that makes one variable sufficient. Crucially, show that the marker never looks right: draw the entire right-hand region as already-summarised, collapsed behind the water line, so it is visible that the algorithm has discarded it. When the scan finishes, the results row reads 2, 5, 17 — backwards — and the reversal should animate as a visible flip of that row into [17, 5, 2], captioned with the 85.2% failure rate for omitting it. Beneath, run a definition panel on [1,2,2]: two identical strips side by side, one with a > test and one with >=, diverging at the middle 2 where one cell lights and the other stays dim, ending on [2] against [2,2] with the 92.23% disagreement figure. Then a cost panel with two synchronized runs on the same descending array — the brute force drawing a fan of comparison arcs from every element to every element on its right, filling the screen, while the optimal scan draws a single left-moving marker and nothing else — closing on 1,096.5395ms against 0.0679ms. Finally a small chart of leader count against n on a log x-axis, with the measured points sitting on the H_n curve: 2.08 at n=4 through 11.73 at n=65,536, annotated to show the answer grows logarithmically while the input grows by four orders of magnitude.

<!-- @sampleInput -->
```json
{"primary":{"input":[16,17,4,3,5,2],"scanDirection":"right-to-left","trace":[{"i":5,"value":2,"runningMaxBefore":null,"isLeader":true,"runningMaxAfter":2},{"i":4,"value":5,"runningMaxBefore":2,"isLeader":true,"runningMaxAfter":5},{"i":3,"value":3,"runningMaxBefore":5,"isLeader":false,"runningMaxAfter":5},{"i":2,"value":4,"runningMaxBefore":5,"isLeader":false,"runningMaxAfter":5},{"i":1,"value":17,"runningMaxBefore":5,"isLeader":true,"runningMaxAfter":17},{"i":0,"value":16,"runningMaxBefore":17,"isLeader":false,"runningMaxAfter":17}],"collectedOrder":[2,5,17],"afterReverse":[17,5,2],"noReverseFailureRate":0.852,"arrangementsTested":5913},"definitionPanel":{"input":[1,2,2],"strict":[2],"nonStrict":[2,2],"divergesAt":1,"disagreementRate":0.9223,"arraysTested":9840,"agreeOnDistinct":true},"costPanel":{"shape":"strictly descending","stepsPerElement":[{"n":1000,"steps":499.5},{"n":10000,"steps":4999.5}],"ratios":[{"n":1000,"bruteMs":0.2713,"optimalMs":0.0015,"ratio":181},{"n":4000,"bruteMs":4.2949,"optimalMs":0.0045,"ratio":954},{"n":16000,"bruteMs":67.5174,"optimalMs":0.0181,"ratio":3734},{"n":64000,"bruteMs":1096.5395,"optimalMs":0.0679,"ratio":16146}],"randomStepsPerElement":[{"n":100,"measured":4.1454,"hMinus1":4.1874},{"n":1600,"measured":6.9858,"hMinus1":6.9553},{"n":25600,"measured":9.8402,"hMinus1":9.7276}]},"countPanel":[{"n":4,"measured":2.0840,"H":2.0833},{"n":16,"measured":3.3824,"H":3.3807},{"n":256,"measured":6.1246,"H":6.1243},{"n":4096,"measured":8.8908,"H":8.8951},{"n":65536,"measured":11.7290,"H":11.6676}]}
```

<!-- @highlights -->
- The scan marker enters from the RIGHT edge, and that direction is made unmistakable rather than incidental.
- A single labelled box above the strip holds the running maximum, with a translucent band across the strip at that height.
- The band reads as a rising water line, so the running maximum is seen rather than tracked mentally.
- The 2 at the right end rises above negative infinity, flashes, joins the results row, and lifts the line to 2.
- The 5 rises above the line, flashes, joins the results, and lifts the line to 5.
- The 3 and the 4 sit below the line and dim immediately — disqualified and never reconsidered.
- The 17 rises above the line, flashes, joins the results, and lifts the line to 17.
- The 16 sits below and dims, and the line never falls at any point.
- The entire right-hand region is drawn collapsed behind the water line, showing the algorithm never looks right.
- The results row reads 2, 5, 17 — backwards — and animates as a visible flip into [17, 5, 2].
- That flip is captioned with the 85.2% failure rate measured for omitting it.
- A definition panel runs [1,2,2] on two identical strips, one testing > and one testing >=.
- They diverge at the middle 2, where one cell lights and the other stays dim, ending on [2] against [2,2].
- The panel carries the 92.23% disagreement figure, and notes the two never differ on distinct values.
- A cost panel runs both algorithms on the same descending array simultaneously.
- The brute force draws a fan of comparison arcs from every element rightward until the screen fills.
- The optimal scan draws a single left-moving marker and nothing else, closing on 1,096.5395ms against 0.0679ms.
- A final chart plots leader count against n on a log axis, the measured points sitting on the H_n curve from 2.08 to 11.73.

<!-- @edgeCases -->
- Empty array — no leaders, and the suffix-table version must guard against indexing the last element.
- Single element — it is always a leader, since nothing is to its right.
- Strictly ascending input — only the last element is a leader, the smallest possible answer.
- Strictly descending input — every element is a leader, the largest possible answer and the brute force's quadratic case.
- All elements equal — under the strict definition only the last is a leader; under the non-strict one, all of them are.
- Two equal elements at the end, such as [1,2,2] — the case that separates the two definitions.
- All negative values — a running maximum seeded at 0 would drop every leader, so it must start at negative infinity.
- A single very large value at the front — it is a leader, and the brute force scans the entire array to confirm it.
- The maximum sitting at the last position — then it is the only leader, whatever the rest looks like.
- Arrays with the maximum repeated at both ends — the first copy is not a leader strictly, because the second is to its right.

<!-- @pitfalls -->
- Forgetting to reverse the output after a right-to-left scan. Measured 85.2% wrong across all 5,913 distinct-value arrangements of n = 1..7 — loud and immediate, unlike most bugs in this module.
- Seeding the running maximum at 0 rather than negative infinity. Every leader with a negative value is then dropped, and the bug is invisible on any array containing a positive number.
- Leaving the definition unstated. Strict and non-strict disagree on 92.23% of arrays over {0,1,2}, so the choice has to be made before the code is written.
- Testing only with distinct values. The two definitions agree on every array with no repeats, so such tests cannot tell you which one you implemented.
- Using > where the specification wants >= or the reverse. It is one character and it changes the answer on almost every array containing duplicates.
- Comparing against suffixMax[i] instead of suffixMax[i+1] in the table version. That includes the element itself, so nothing is ever a leader.
- Assuming the brute force is unusable. It measured O(n log n) expected on random input — H_n − 1 steps per element — and only becomes quadratic on descending input.
- Assuming the brute force is fine because it benchmarked well. On descending input at n = 64,000 it measured 16,146x slower, and descending is what sorting produces.
- Building the answer by inserting at the front of a list to avoid the reversal. That is O(n) per insertion, turning an O(n) algorithm into O(n * leaders).
- Expecting a large answer. The leader count is the harmonic number — about twelve for an array of 65,536 random values.
- Keeping the suffix-maximum table. Only the entry immediately to the right is ever read, so one variable replaces the whole array.

<!-- @doubt -->
### Why does the right-to-left scan need only one variable?

<!-- @answer -->
Because the only thing the definition asks about the right-hand side is its maximum. Whether an element is a leader depends on nothing else about what follows it — not the order, not the count, not the individual values. So a single running maximum summarises the entire remaining array. Walking right to left is what makes that summary available before it is needed: by the time you reach position i, you have already seen everything after it. The suffix-maximum table computes the same information and stores n copies of it, which is why one variable replaces the whole array.

<!-- @doubt -->
### Why do I have to reverse the output?

<!-- @answer -->
Because the scan runs right to left, so leaders are discovered in the opposite order to the one the answer needs. On [16,17,4,3,5,2] you collect 2, then 5, then 17, and the expected answer is [17,5,2]. Measured across all 5,913 distinct-value arrangements of n up to 7, omitting the reversal produced the wrong answer 85.2% of the time. Do not avoid it by inserting at the front instead — that is O(n) per insertion and turns a linear algorithm into O(n × leaders).

<!-- @doubt -->
### Should a leader be strictly greater, or greater or equal?

<!-- @answer -->
That is a specification question and you have to answer it before writing code, because it is not a small difference. Over all 9,840 arrays over {0,1,2} with n up to 8, the two readings disagree on 92.23%. On [1,2,2] the strict version gives [2] and the non-strict gives [2,2]. The standard statement means strictly greater, which is what this lesson uses. The trap is that both versions agree on every array with no repeated values, so a distinct-value test suite cannot tell you which one you wrote.

<!-- @doubt -->
### Is the brute force really O(n^2)?

<!-- @answer -->
Only in the worst case, and on random input it is nowhere near. The inner loop breaks at the first element that beats the candidate, and measured steps per element track H_n − 1: 4.1454 at n = 100, 6.9858 at n = 1,600, 9.8402 at n = 25,600. That makes it O(n log n) expected. It becomes genuinely quadratic when no scan ever breaks early, which happens exactly on descending input — measured n/2 steps per element, and 16,146x slower than the optimal scan at n = 64,000.

<!-- @doubt -->
### How many leaders should I expect?

<!-- @answer -->
Far fewer than most people guess: the harmonic number H_n = 1 + 1/2 + ... + 1/n, which is about ln n. A random array of 65,536 values has roughly twelve leaders — measured 11.7290 against H_n of 11.6676. The reason is clean: the element at position i is a leader exactly when it is the largest of the n − i values from i onward, which happens with probability 1/(n − i), and summing over all positions gives H_n. So the output is O(log n) expected, though still O(n) in the worst case on descending input.

<!-- @doubt -->
### Why does the same harmonic number appear twice in this problem?

<!-- @answer -->
Because both quantities count the same kind of event. The number of leaders counts how often a new right-to-left maximum appears. The brute force's inner-loop work is driven by how long each element survives before something beats it, which is governed by the same record-setting structure. Both sums come out as 1 + 1/2 + ... + 1/n. It is a nice reminder that the cost of the naive algorithm and the size of the answer are not independent facts here — they have a common cause.

<!-- @doubt -->
### Why must the running maximum start at negative infinity rather than 0?

<!-- @answer -->
Because a leader can be negative. Seeded at 0, the comparison a[i] > 0 fails for every negative value, so an array like [-5,-2,-9] returns nothing when the correct answer is [-2,-9]. The bug is invisible on any array containing a positive number, which is most test data. Use INT_MIN, Integer.MIN_VALUE or float('-inf'). This is the same seeding mistake as in Kadane's Algorithm, and it fails for the same reason.

<!-- @doubt -->
### How does this relate to Largest Element?

<!-- @answer -->
It is the same running-maximum scan with two changes. Largest Element sweeps in either direction and keeps only the final value; this sweeps strictly right to left and records every point at which the maximum improves. Each improvement is a leader. So the whole problem is Largest Element with the intermediate results kept instead of discarded — which is also why the answer size is the number of times a running maximum improves, and that count is H_n.
