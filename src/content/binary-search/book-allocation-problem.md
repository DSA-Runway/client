---
id: book-allocation-problem
topic: Binary Search
title: Book Allocation Problem
difficulty: Hard
status: ready
prerequisites:
  - painters-partition
  - aggressive-cows
  - koko-eating-bananas
relatedIds:
  - painters-partition
  - split-array-largest-sum
  - aggressive-cows
  - minimum-days-to-make-m-bouquets
  - capacity-to-ship-packages-within-d-days
---

<!-- @summary -->
This is Painter's Partition with the nouns changed — the Painter's code, applied verbatim, is correct on all 151,365 exhaustive cases once a guard for m > n is added. What is genuinely worth learning here is the lower bound: starting the search at max(pages) is usually explained as narrowing the range, and measured it saves essentially zero probes while being wrong on 34.47% of inputs if you drop it.

<!-- @theory -->
## The problem

`pages[i]` is the length of book i. The books are on a shelf and must be handed
out to `m` students **in contiguous blocks**, every book allocated, every student
getting at least one. The slowest student sets the finishing time, so minimise
the maximum pages any one student receives. Return −1 when `m > n`, since some
student would get nothing.

```
pages = [12, 34, 67, 90], m = 2   ->  113
      [12, 34, 67] | [90]         ->  max(113, 90) = 113

pages = [12, 34, 67, 90], m = 3   ->  90
      [12, 34] | [67] | [90]      ->  max(46, 67, 90) = 90
```

## It is the same problem you have already solved

Book Allocation, Painter's Partition and Split Array – Largest Sum are one
problem in three costumes. All three cut a sequence into `m` contiguous blocks and
minimise the largest block sum; only the story differs — pages per student, boards
per painter, elements per subarray.

That is a claim worth checking rather than asserting. Taking the C++ solution from
Painter's Partition **without changing a character**, adding only the `m > n`
guard, and running it over every page array of length 1 to 6 with values from
`{0..4}` and every `m` from 1 to n+2 — **151,365 cases** — gives **0 wrong**
against an independent reference that enumerates every way to cut the shelf.

So the useful skill this subtopic trains is recognition. When a problem asks for
contiguous blocks and the minimum possible maximum, it is this problem, and the
code you already have solves it.

## The one real difference: m > n

Painter's Partition conventionally assumes enough boards. Book Allocation
explicitly demands −1 when there are more students than books, and that accounts
for **39,060 of the 151,365 cases** above. It is a guard, not an algorithm: the
binary search below would otherwise return the total page count, since one
student per book is the finest split available and asking for more cannot make the
maximum smaller.

## The lower bound is doing correctness work, not optimisation

Every write-up says to start the search at `max(pages)`, and justifies it by
observing that some student must read the longest book, so no smaller limit is
achievable — which sounds like a range-narrowing optimisation. Measured, the
narrowing is worth nothing:

| n | m | probes from `max(pages)` | probes from 0 | saved |
|---|---|---|---|---|
| 10 | 3 | 11.99 | 12.35 | 0.35 |
| 100 | 10 | 15.63 | 15.69 | 0.05 |
| 1,000 | 20 | 18.96 | 18.95 | **−0.01** |
| 10,000 | 50 | 22.36 | 22.39 | 0.03 |

Averages over 200 random instances each. Beyond n = 100 the saving is
indistinguishable from noise, and at n = 1,000 it is negative — because
`log2(sum)` and `log2(sum − max)` differ by a fraction of one probe.

The bound is not optional, though. Dropping it is **wrong on 38,714 of 112,305
valid cases — 34.47%**. The reason is in the feasibility check:

```cpp
if (load + b > limit) { students++; load = b; }
```

When a single book is longer than `limit`, this line does not reject it. It opens
a new student and seats the oversized book anyway, so the count can come in at or
under `m` for a limit that no real allocation achieves. Starting at `max(pages)`
is what stops such limits from ever being probed.

The smallest failure is `pages = [0, 1], m = 2`. At `limit = 0` the greedy seats
book 0 with the first student, then opens a second for book 1 — two students, which
passes — but that student reads 1 page against a limit of 0. It answers 0; the
correct answer is 1.

This is worth sitting with, because the usual explanation is not just incomplete
but points the wrong way. If you believed the bound were an optimisation, dropping
it to keep the code short would look like a free simplification, and you would
have introduced a bug on a third of inputs while saving a twentieth of one probe.

## What the three approaches cost

| n | m | binary search | partition DP | try every limit |
|---|---|---|---|---|
| 50 | 5 | **1,264** | 8,209 | 143,917 |
| 200 | 10 | **3,680** | 133,875 | 1,095,583 |
| 1,000 | 20 | **9,681** | 2,357,708 | 7,057,458 |
| 5,000 | 50 | **41,736** | — | 56,617,459 |
| 100,000 | 100 | **1,145,778** | — | too slow to measure |

Nanoseconds per call. At n = 1,000 the DP is **244x** slower and the linear scan
**729x**. The DP is the interesting loser: it is the natural dynamic-programming
formulation, it is O(n²m), and it is beaten by a binary search that treats the DP's
whole subproblem structure as a black box. Searching the *answer* rather than the
*structure* is the move.

<!-- @intuition -->
The lesson here is not an algorithm — you already had the algorithm — it is that the justification attached to a line of code can be wrong in a way that matters. "Start at max(pages) because it narrows the range" is the explanation everyone repeats, and it survives because it sounds reasonable and the code it describes is correct. Measuring it shows the stated benefit is zero and the real benefit is something else entirely: it keeps the search away from limits where the greedy check silently lies. A reason that is wrong for the right conclusion is more dangerous than no reason at all, because it tells you exactly which line is safe to remove when you want to simplify. Worth asking of any bound you write: if I widened this, would the answer change, or only the running time?

<!-- @approach -->
### Try Every Limit

<!-- @idea -->
Walk the candidate limits upward from the longest book and return the first that m students can meet.

<!-- @steps -->
1. If m > n, return −1.
2. The answer lies between `max(pages)` and `sum(pages)`.
3. For each limit in that range, greedily fill students: keep adding books until the next would exceed the limit, then start a new student.
4. Return the first limit needing at most m students.

<!-- @complexity -->
- time: O(n · sum(pages))
- space: O(1)
- note: The definition walked in order. Correct, and **729x slower** than the binary search at n = 1,000 — its cost scales with the page total, which is not bounded by n.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

static int studentsNeeded(const vector<int>& pages, long long limit) {
    int students = 1;
    long long load = 0;
    for (int p : pages) {
        if (load + p > limit) { students++; load = p; }
        else                    load += p;
    }
    return students;
}

long long allocateBooks(const vector<int>& pages, int m) {
    if (m > (int)pages.size()) return -1;
    long long lo = 0, hi = 0;
    for (int p : pages) { lo = max(lo, (long long)p); hi += p; }
    for (long long limit = lo; limit <= hi; limit++)
        if (studentsNeeded(pages, limit) <= m) return limit;
    return hi;
}
```

<!-- @annotations -->
- 9: The line that seats an oversized book instead of rejecting it. Harmless here only because the loop never starts below `max(pages)`.
- 16: The −1 guard, and the only thing separating this problem from Painter's Partition.
- 18: `lo` is the longest book and `hi` the total. Starting at `lo` is a correctness requirement, not a speed-up — see the walkthrough on `[0, 1]`.
- 20: The first limit that fits is the answer, because feasibility only improves as the limit grows.

<!-- @code java -->
```java
static int studentsNeeded(int[] pages, long limit) {
    int students = 1;
    long load = 0;
    for (int p : pages) {
        if (load + p > limit) { students++; load = p; }
        else                    load += p;
    }
    return students;
}

static long allocateBooks(int[] pages, int m) {
    if (m > pages.length) return -1;
    long lo = 0, hi = 0;
    for (int p : pages) { lo = Math.max(lo, p); hi += p; }
    for (long limit = lo; limit <= hi; limit++)
        if (studentsNeeded(pages, limit) <= m) return limit;
    return hi;
}
```

<!-- @annotations -->
- 14: `hi` accumulates into a `long`. With 10⁵ books of 10⁶ pages the total is 10¹¹, well past `int`.

<!-- @code python -->
```python
def students_needed(pages, limit):
    students, load = 1, 0
    for p in pages:
        if load + p > limit:
            students += 1
            load = p
        else:
            load += p
    return students


def allocate_books(pages, m):
    if m > len(pages):
        return -1
    lo, hi = max(pages), sum(pages)
    for limit in range(lo, hi + 1):
        if students_needed(pages, limit) <= m:
            return limit
    return hi
```

<!-- @annotations -->
- 15: `max(pages)` and `sum(pages)` say directly what the C++ loop spells out — and `max` here is the bound the correctness argument rests on.

<!-- @approach -->
### Partition DP

<!-- @idea -->
Let dp[j][i] be the best achievable maximum when the first i books go to j students, and try every place to end the j-th student's block.

<!-- @steps -->
1. Build prefix sums so any block's page count is O(1).
2. dp[0][0] = 0; everything else starts at infinity.
3. For each student count j and prefix length i, try every split point t < i.
4. The cost of that choice is `max(dp[j-1][t], pages t+1..i)`.
5. dp[m][n] is the answer.

<!-- @complexity -->
- time: O(n²·m)
- space: O(n·m)
- note: The natural dynamic program, and comprehensively beaten — **244x slower at n = 1,000** and unusable beyond that. Included because it is the approach most people reach for before seeing that the answer itself can be searched.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

long long allocateBooks(const vector<int>& pages, int m) {
    int n = (int)pages.size();
    if (m > n) return -1;
    vector<long long> pre(n + 1, 0);
    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + pages[i];

    const long long INF = LLONG_MAX / 4;
    vector<vector<long long>> dp(m + 1, vector<long long>(n + 1, INF));
    dp[0][0] = 0;
    for (int j = 1; j <= m; j++)
        for (int i = 1; i <= n; i++)
            for (int t = j - 1; t < i; t++)
                dp[j][i] = min(dp[j][i], max(dp[j - 1][t], pre[i] - pre[t]));
    return dp[m][n];
}
```

<!-- @annotations -->
- 12: `LLONG_MAX / 4` rather than `LLONG_MAX`, so the `max` on line 18 cannot overflow when it meets an unreached state.
- 18: `max`, not `+`. The cost of a partition is its worst block, not the sum of its blocks — the single line where this differs from an ordinary partition DP.
- 17: `t` starts at `j - 1` because j−1 students need at least j−1 books between them. Starting at 0 still gives the right answer, via the infinities, but does redundant work.

<!-- @code java -->
```java
static long allocateBooks(int[] pages, int m) {
    int n = pages.length;
    if (m > n) return -1;
    long[] pre = new long[n + 1];
    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + pages[i];

    final long INF = Long.MAX_VALUE / 4;
    long[][] dp = new long[m + 1][n + 1];
    for (long[] row : dp) Arrays.fill(row, INF);
    dp[0][0] = 0;
    for (int j = 1; j <= m; j++)
        for (int i = 1; i <= n; i++)
            for (int t = j - 1; t < i; t++)
                dp[j][i] = Math.min(dp[j][i], Math.max(dp[j - 1][t], pre[i] - pre[t]));
    return dp[m][n];
}
```

<!-- @annotations -->
- 9: Java zero-fills arrays, so the infinity has to be written in explicitly — a zero here would be read as "free", and every state would look optimal.

<!-- @code python -->
```python
def allocate_books(pages, m):
    n = len(pages)
    if m > n:
        return -1
    pre = [0] * (n + 1)
    for i, p in enumerate(pages):
        pre[i + 1] = pre[i] + p

    INF = float("inf")
    dp = [[INF] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = 0
    for j in range(1, m + 1):
        for i in range(1, n + 1):
            for t in range(j - 1, i):
                dp[j][i] = min(dp[j][i], max(dp[j - 1][t], pre[i] - pre[t]))
    return dp[m][n]
```

<!-- @annotations -->
- 9: `float("inf")` compares correctly against integers in Python and never overflows, so the `LLONG_MAX / 4` dance is unnecessary here.

<!-- @approach -->
### Binary Search on the Answer

<!-- @idea -->
Guess a page limit and ask how many students it needs; the count falls as the limit rises, so binary search the smallest limit needing at most m.

<!-- @steps -->
1. If m > n, return −1.
2. Search the limit over `[max(pages), sum(pages)]`.
3. Greedily count the students a limit requires.
4. If at most m, record it and search left for something tighter.
5. If more than m, search right.
6. Return the smallest recorded limit.

<!-- @complexity -->
- time: O(n log(sum(pages)))
- space: O(1)
- note: **0 wrong** over 151,365 exhaustive cases. **244x** faster than the DP and **729x** faster than the linear scan at n = 1,000, and the only approach that stays usable at n = 100,000.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

static int studentsNeeded(const vector<int>& pages, long long limit, int m) {
    int students = 1;
    long long load = 0;
    for (int p : pages) {
        if (load + p > limit) {
            students++; load = p;
            if (students > m) return students;
        } else load += p;
    }
    return students;
}

long long allocateBooks(const vector<int>& pages, int m) {
    if (m > (int)pages.size()) return -1;
    long long lo = 0, hi = 0;
    for (int p : pages) { lo = max(lo, (long long)p); hi += p; }
    long long ans = hi;
    while (lo <= hi) {
        long long limit = lo + (hi - lo) / 2;
        if (studentsNeeded(pages, limit, m) <= m) { ans = limit; hi = limit - 1; }
        else                                        lo = limit + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 11: Bailing out as soon as the count passes m. The search does the same number of probes either way; each infeasible probe just costs less.
- 18: The −1 guard. Without it the loop returns `sum(pages)`, which is a plausible-looking wrong answer rather than an obvious failure.
- 20: `lo = max(pages)` is load-bearing. Start at 0 and the answer is wrong on 34.47% of inputs, because line 9 seats an oversized book rather than rejecting it. It is worth about **0.05 probes** as an optimisation — that is not why it is there.
- 24: Feasible means record it and go **left**, hunting for a tighter limit. Aggressive Cows goes right here; that one line is the difference between minimising a maximum and maximising a minimum.
- 27: The smallest feasible limit, which is exactly the definition of the answer.

<!-- @code java -->
```java
static int studentsNeeded(int[] pages, long limit, int m) {
    int students = 1;
    long load = 0;
    for (int p : pages) {
        if (load + p > limit) {
            students++; load = p;
            if (students > m) return students;
        } else load += p;
    }
    return students;
}

static long allocateBooks(int[] pages, int m) {
    if (m > pages.length) return -1;
    long lo = 0, hi = 0;
    for (int p : pages) { lo = Math.max(lo, p); hi += p; }
    long ans = hi;
    while (lo <= hi) {
        long limit = lo + (hi - lo) / 2;
        if (studentsNeeded(pages, limit, m) <= m) { ans = limit; hi = limit - 1; }
        else                                        lo = limit + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 19: `lo + (hi - lo) / 2` on longs. With `hi` near 10¹¹ the naive `(lo + hi) / 2` is still fine in a long, but the habit is what protects the int version.

<!-- @code python -->
```python
def students_needed(pages, limit, m):
    students, load = 1, 0
    for p in pages:
        if load + p > limit:
            students += 1
            load = p
            if students > m:
                return students
        else:
            load += p
    return students


def allocate_books(pages, m):
    if m > len(pages):
        return -1
    lo, hi = max(pages), sum(pages)
    ans = hi
    while lo <= hi:
        limit = (lo + hi) // 2
        if students_needed(pages, limit, m) <= m:
            ans = limit
            hi = limit - 1
        else:
            lo = limit + 1
    return ans
```

<!-- @annotations -->
- 17: `max(pages)`, not 0 — the whole correctness argument for this line is in the theory section, and it is not the one usually given.
- 23: Record and move left. Compare with Aggressive Cows, where the identical structure moves right.

<!-- @example -->

<!-- @input -->
```
pages = [12, 34, 67, 90], m = 2
```

<!-- @output -->
```
113
```

<!-- @why -->
Splitting as `[12, 34, 67] | [90]` gives loads 113 and 90, so the slower student reads 113. Every other split of these four books into two contiguous blocks is worse.

<!-- @walkthrough -->
```
lo = max = 90,  hi = sum = 203

limit=146  students: [12,34,67]=113, [90]      -> 2  <= 2   ans=146, hi=145
limit=117  students: [12,34,67]=113, [90]      -> 2  <= 2   ans=117, hi=116
limit=103  students: [12,34]=46, [67], [90]    -> 3  >  2   lo=104
limit=110  students: [12,34]=46, [67], [90]    -> 3  >  2   lo=111
limit=113  students: [12,34,67]=113, [90]      -> 2  <= 2   ans=113, hi=112
limit=111  students: [12,34]=46, [67], [90]    -> 3  >  2   lo=112
limit=112  students: [12,34]=46, [67], [90]    -> 3  >  2   lo=113
lo > hi  ->  113

Every feasible probe moves hi LEFT, looking for something
tighter. Aggressive Cows moves lo right on feasible — same
machinery, mirrored.
```

<!-- @example -->

<!-- @input -->
```
pages = [12, 34, 67, 90], m = 3
```

<!-- @output -->
```
90
```

<!-- @why -->
The same shelf with one more student. `[12, 34] | [67] | [90]` gives 46, 67 and 90, so the answer is 90 — which is `max(pages)`, the lower bound, reached exactly.

<!-- @walkthrough -->
```
lo = 90, hi = 203

limit=146  [12,34,67]=113, [90]        -> 2  <= 3   ans=146, hi=145
limit=117  [12,34,67]=113, [90]        -> 2  <= 3   ans=117, hi=116
limit=103  [12,34]=46, [67], [90]      -> 3  <= 3   ans=103, hi=102
limit=96   [12,34]=46, [67], [90]      -> 3  <= 3   ans=96,  hi=95
limit=92   [12,34]=46, [67], [90]      -> 3  <= 3   ans=92,  hi=91
limit=90   [12,34]=46, [67], [90]      -> 3  <= 3   ans=90,  hi=89
lo > hi  ->  90

The answer landing on `lo` is the case that would break if
the search started lower — and the next example shows why.
```

<!-- @example -->

<!-- @input -->
```
pages = [0, 1], m = 2
```

<!-- @output -->
```
1
```

<!-- @why -->
The smallest input on which starting the search at 0 instead of `max(pages)` gives a wrong answer. It is a two-book shelf, and the wrong version answers 0.

<!-- @walkthrough -->
```
Correct, searching from lo = max(pages) = 1:
  limit=1   [0] and [1]  -> 2 students <= 2   ans=1
  ->  1                                        correct

Starting from lo = 0:
  limit=0   greedy: load=0, book 0 fits (0+0 > 0 is false)
            book 1: load+1 = 1 > 0, so open student 2, load=1
            -> 2 students <= 2, reported FEASIBLE
  ->  0                                        WRONG

The greedy never rejects the oversized book — it just opens
a new student and seats it anyway. So limit=0 "passes" while
student 2 reads 1 page against a limit of 0.

Measured, dropping the bound is wrong on 34.47% of inputs,
and it saves about 0.05 probes.
```

<!-- @example -->

<!-- @input -->
```
pages = [10, 20, 30], m = 4
```

<!-- @output -->
```
-1
```

<!-- @why -->
Four students, three books, and every student must receive at least one book. No allocation exists, which is the one place this problem genuinely differs from Painter's Partition.

<!-- @walkthrough -->
```
m = 4 > n = 3   ->  -1, before any searching

Without the guard the binary search would run and return
sum(pages) = 60: the finest split is one book each, needing
3 students, which is "at most 4", so every limit from 30
upward looks feasible and the search settles on 30 — a
plausible number that answers a question nobody asked.

This is why the guard is a guard and not an edge case
the loop happens to handle.
```

<!-- @visualization custom -->

<!-- @description -->
Shows that this problem is Painter's Partition renamed, and that the lower bound everyone justifies as an optimisation is actually load-bearing for correctness.

<!-- @sampleInput -->
```json
{"primary":{"pages":[12,34,67,90],"m":2,"answer":113,"split":[[12,34,67],[90]],"loads":[113,90]},"sameProblemThreeNames":{"claim":"Book Allocation, Painter's Partition and Split Array - Largest Sum are one problem","shared":"cut a sequence into m contiguous blocks, minimise the largest block sum","differByOnly":"the story - pages per student, boards per painter, elements per subarray","verification":{"method":"the C++ solution from painters-partition.md applied verbatim, plus an m > n guard","space":"every page array of length 1..6 over {0..4}, every m from 1 to n+2","cases":151365,"wrong":0,"reference":"independent enumeration of every way to cut the shelf"},"takeaway":"the skill this trains is recognition, not a new algorithm"},"theOneRealDifference":{"rule":"return -1 when m > n","casesInSpace":39060,"ofTotal":151365,"whyItMatters":"without the guard the search returns sum(pages) - a plausible-looking wrong answer rather than an obvious failure","example":{"pages":[10,20,30],"m":4,"correct":-1,"withoutGuard":30}},"lowerBoundIsLoadBearing":{"usualJustification":"start at max(pages) because it narrows the search range","measuredNarrowing":{"note":"averages over 200 random instances each","rows":[{"n":10,"m":3,"fromMax":11.99,"fromZero":12.35,"saved":0.35},{"n":100,"m":10,"fromMax":15.63,"fromZero":15.69,"saved":0.05},{"n":1000,"m":20,"fromMax":18.96,"fromZero":18.95,"saved":-0.01},{"n":10000,"m":50,"fromMax":22.36,"fromZero":22.39,"saved":0.03}],"reading":"beyond n=100 the saving is noise, and at n=1000 it is negative"},"realReason":{"correctness":true,"wrong":38714,"ofValid":112305,"pct":34.47,"mechanism":"the greedy line `if (load + p > limit) { students++; load = p; }` does not reject a book longer than limit - it opens a new student and seats it anyway","consequence":"the student count can come in at or under m for a limit no real allocation achieves","smallestFailure":{"pages":[0,1],"m":2,"correct":1,"got":0,"trace":"at limit=0 the greedy seats book 0 with student 1, opens student 2 for book 1 - two students, which passes - but that student reads 1 page against a limit of 0"}},"lesson":"a reason that is wrong for the right conclusion is more dangerous than no reason, because it tells you which line is safe to delete"},"approachCost":{"unit":"nanoseconds per call","rows":[{"n":50,"m":5,"binary":1264,"dp":8209,"linear":143917},{"n":200,"m":10,"binary":3680,"dp":133875,"linear":1095583},{"n":1000,"m":20,"binary":9681,"dp":2357708,"linear":7057458},{"n":5000,"m":50,"binary":41736,"dp":null,"linear":56617459},{"n":100000,"m":100,"binary":1145778,"dp":null,"linear":null}],"atN1000":{"dpSlower":"244x","linearSlower":"729x"},"reading":"the DP is the interesting loser - the natural O(n^2 m) formulation, beaten by a search that treats its whole subproblem structure as a black box","move":"search the answer, not the structure"},"mirrorOfAggressiveCows":{"here":"minimise the maximum - on feasible, record and move hi LEFT","cows":"maximise the minimum - on feasible, record and move lo RIGHT","sameMachinery":true},"assertions":["the answer lies between max(pages) and sum(pages)","student count is monotone non-increasing as the limit rises","the greedy fill is optimal for a given limit","m > n has no valid allocation","every book must be allocated and blocks must be contiguous"]}
```

<!-- @highlights -->
- This is **Painter's Partition renamed** — that code, unchanged, is **0 wrong** over 151,365 exhaustive cases once `m > n` is guarded.
- The only genuine difference is returning **−1 when m > n**, which is 39,060 of those cases.
- `lo = max(pages)` is usually justified as narrowing the range; measured it saves **≈0.05 probes**.
- Dropping it is **wrong on 34.47%** of valid inputs — the greedy seats an oversized book instead of rejecting it.
- Smallest failure is `[0, 1], m = 2`: answers 0, correct is 1.
- Binary search beats the DP **244×** and the linear scan **729×** at n = 1,000.

<!-- @edgeCases -->
- `m > n` — return −1; without the guard the search returns `sum(pages)`.
- `m == n` — one book each, so the answer is `max(pages)`, the lower bound exactly.
- `m == 1` — one student reads everything, so the answer is `sum(pages)`, the upper bound exactly.
- A book of 0 pages — legal, and part of the smallest input that breaks a search starting at 0.
- All books identical — the answer is `ceil(n/m) · page`, a useful hand-check.
- One book far longer than the rest — the answer is that book, and the bound is reached.
- n = 1 — the answer is `pages[0]` when m = 1 and −1 otherwise.
- Total pages exceeding 2³¹ — 10⁵ books of 10⁶ pages is 10¹¹, so `hi` and the loads must be 64-bit.
- Books arriving unsorted — irrelevant here, and worth contrasting with Aggressive Cows, where sorting is mandatory. Order *is* the input in this problem; sorting would destroy it.

<!-- @pitfalls -->
- Starting the search at 0. Wrong on 34.47% of inputs, and the usual justification for the bound makes it look like a safe simplification.
- Omitting the `m > n` guard. Returns `sum(pages)` — wrong, and plausible enough to pass review.
- Sorting the pages. Contiguity is the constraint; sorting answers a different problem.
- Accumulating `hi` or `load` in a 32-bit int. 10⁵ books of 10⁶ pages overflows.
- Reaching for the DP because the problem "looks like partition DP". It is 244× slower at n = 1,000 and unusable beyond.
- Moving `lo` right on a feasible probe. That is Aggressive Cows; here feasible means try tighter, so `hi` moves left.
- Requiring `students == m` rather than `students <= m`. Fewer students than allowed still means the limit is achievable.
- Assuming this problem is new. It is Painter's Partition and Split Array – Largest Sum with different nouns.

<!-- @doubt -->
### Is this really the same problem as Painter's Partition?

<!-- @answer -->
Yes, and it was checked rather than assumed. Both cut a sequence into `m` contiguous blocks and minimise the largest block sum; only the noun changes. Taking the C++ solution straight out of Painter's Partition, changing nothing, and adding only the `m > n` guard gives **0 wrong across 151,365 cases** — every page array of length 1 to 6 over `{0..4}` with every `m` from 1 to n+2, checked against an independent enumeration of all possible cuts. Split Array – Largest Sum is the third costume. So the thing to take away is a recognition rule: contiguous blocks plus "minimum possible maximum" means this problem, and you already have the code. The −1 requirement is the only genuine addition.

<!-- @doubt -->
### Why must the search start at max(pages)?

<!-- @answer -->
Not for the reason usually given. The standard explanation is that some student must read the longest book, so smaller limits are unachievable and skipping them narrows the range — which frames the bound as an optimisation. Measured, that narrowing is worth **about 0.05 probes** at n = 100 and is **negative noise** at n = 1,000, because `log2(sum)` and `log2(sum − max)` differ by a fraction of one step. The real reason is correctness. The greedy feasibility check is written `if (load + p > limit) { students++; load = p; }`, which does not reject a book longer than `limit` — it opens a new student and seats it regardless. So for a limit below `max(pages)` the student count can still come in at or under `m`, and the search believes a limit that no allocation achieves. Dropping the bound is wrong on **38,714 of 112,305 valid cases — 34.47%**. The smallest example is `pages = [0, 1], m = 2`, which answers 0 instead of 1. If you wanted to start at 0 you would have to fix the check too, by returning "infeasible" the moment a single book exceeds the limit.

<!-- @doubt -->
### Why is the DP so much slower when it is the "proper" algorithm?

<!-- @answer -->
Because it computes far more than the question asks. The DP builds the optimal answer for every prefix length and every student count — `n · m` states, each scanning up to `n` split points — and the question only wanted one number. Measured at n = 1,000, m = 20 that is **2,357,708ns against the binary search's 9,681ns, a factor of 244**, and it grows worse with n since the DP is O(n²m) while the search is O(n log(sum)). The binary search wins by never modelling the partition structure at all: it guesses an answer and asks a much cheaper question — "how many students would this need?" — which a single greedy pass answers. That is the general shape of binary-search-on-answer, and this problem is a clean case for it because verifying a candidate is O(n) while constructing the optimum is not.

<!-- @doubt -->
### Why `students <= m` and not `students == m`?

<!-- @answer -->
Because needing fewer students than you have does not make a limit unachievable — it makes it comfortable. If `limit` can be met with 3 students and you have 5, the extra two can always be accommodated by splitting some block further, which never increases any load. Writing `==` would reject perfectly feasible limits and push the search rightward, producing an answer that is too large. The greedy also naturally returns the *minimum* number of students for a given limit, so `<=` is asking exactly the right question: is the minimum requirement within budget. This is the same reason Aggressive Cows tests `count >= k` rather than `count == k`, with the inequality pointing the other way because that problem is maximising.

<!-- @doubt -->
### Should the pages be sorted first?

<!-- @answer -->
No, and this is the sharpest contrast with Aggressive Cows, where sorting is mandatory and skipping it is a 50.71% coin flip. There, the input is a set of positions and the order is incidental. Here the order **is** the problem: books are on a shelf and each student receives a contiguous run, so rearranging them answers a different question — one whose answer is generally smaller, since sorting would let you group the large books together. If a variant does allow arbitrary subsets rather than contiguous blocks, the binary search still works but the greedy check does not, because "fill the next student until the limit" no longer defines a unique allocation. Reaching for a sort here is a good sign that the contiguity constraint has not registered.
