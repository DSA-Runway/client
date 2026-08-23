---
id: minimum-days-to-make-m-bouquets
topic: Binary Search
title: Minimum days to make M bouquets
difficulty: Medium
status: ready
prerequisites:
  - koko-eating-bananas
  - find-square-root-of-a-number
  - integer-overflow-and-precision-errors
relatedIds:
  - koko-eating-bananas
  - find-the-smallest-divisor
  - capacity-to-ship-packages-within-d-days
  - aggressive-cows
  - lower-bound
---

<!-- @summary -->
The predicate stops being a sum over independent elements and becomes a scan for consecutive runs, so order suddenly matters. The measured curiosity is the feasibility guard: `m * k > n` overflows a 32-bit int on 99.97% of legal inputs and never changes an answer — a genuine piece of undefined behaviour kept invisible by the correctness of the code beneath it, and costing a factor of a million on impossible inputs.

<!-- @theory -->
## The problem

Each flower blooms on its own day. A bouquet needs **k adjacent** flowers, all
bloomed. Find the earliest day on which m bouquets can be made, or -1 if it can
never happen.

```
bloomDay = [1, 10, 3, 10, 2], m = 3, k = 1   ->  3
bloomDay = [1, 10, 3, 10, 2], m = 3, k = 2   ->  -1     needs 6 flowers, only 5 exist
bloomDay = [7, 7, 7, 7, 12, 7, 7], m = 2, k = 3  ->  12
```

Waiting longer never hurts — a flower that has bloomed stays bloomed — so "can I
make m bouquets by day d" is monotone in d, and the answer is a lower bound over
it.

## Adjacency changes the predicate's shape

Koko's predicate summed an independent contribution per pile, so the array's order
was irrelevant. Here the flowers must be **adjacent**, so the predicate has to
walk the array in order, tracking the current run of bloomed flowers and closing
off a bouquet every k in a row:

```
run = 0, made = 0
for each flower:
    if bloomed by day d:  run += 1; if run == k: made += 1; run = 0
    else:                 run = 0
return made >= m
```

The `run = 0` after completing a bouquet is what stops one long run of 2k flowers
being counted as one bouquet — and the `run = 0` on an unbloomed flower is what
enforces adjacency at all. Removing either produces a predicate that is still
monotone and still wrong.

## The feasibility guard overflows, and it does not matter

Before searching at all, there is an obvious impossibility check: m bouquets of k
flowers need m·k flowers, so if that exceeds n the answer is -1. Written the
natural way, `if (m * k > n) return -1;`, it overflows immediately at the
problem's limits — m up to 10⁶, k up to n up to 10⁵:

| m | k | m·k exact | as a 32-bit int |
|---|---|---|---|
| 50,000 | 50,000 | 2,500,000,000 | **−1,794,967,296** |
| 100,000 | 100,000 | 10,000,000,000 | 1,410,065,408 |
| 1,000,000 | 100,000 | 100,000,000,000 | 1,215,752,192 |

UndefinedBehaviorSanitizer reports it directly:

```
runtime error: signed integer overflow: 50000 * 50000
cannot be represented in type 'int'
```

Over 200,000 random (m, k) pairs drawn across the full legal ranges, the product
wrapped on **199,941 of them — 99.97%** — and the answer differed on **zero**.

The reason is structural rather than lucky. A genuine m·k that is *within* n is at
most 10⁵, far too small to overflow, so the wrap can only ever turn an
**impossible** case into one that passes the guard. The search then runs, finds no
day on which m bouquets can be made, and leaves `ans` at -1 — which is the right
answer. The broken guard is masked by the correctness of the code beneath it.

That makes it a bug worth fixing anyway, for two reasons. It is undefined
behaviour, so its harmlessness is a property of this compiler rather than of the
language. And it is not free:

| n | 32-bit guard: wraps, then searches | 64-bit guard: returns at once |
|---|---|---|
| 1,000 | 77,217ns | **1.3ns** |
| 20,000 | 1,619,398ns | **1.6ns** |

A factor of roughly a **million** on impossible inputs, for a cast.

## Where the bounds help, precisely

`lo = min(bloomDay)` and `hi = max(bloomDay)` is the obvious range, and whether it
beats a fixed `1 … 10⁹` depends entirely on how the bloom days are spread.
Measured probe counts at n = 5,000:

| bloom days drawn from | min…max | 1…10⁹ | saved |
|---|---|---|---|
| 1 … 1,000,000,000 | 29.8 | 29.9 | **0.1** |
| 1 … 1,000,000 | 19.9 | 29.9 | 10.0 |
| 1 … 1,000 | 10.0 | 29.9 | 19.9 |
| 500,000,000 … 500,001,000 | **9.9** | 29.9 | 19.9 |
| all equal | **1.0** | 30.0 | 29.0 |

When the values fill the legal range the tight bound saves nothing at all. When
they are clustered — even clustered *high*, as in the fourth row — it saves two
thirds of the probes. The cost is one pass, which you may already be making.

## The answer is always one of the bloom days

A day only matters if some flower blooms on it: between two consecutive bloom days
nothing changes, so the predicate's value is constant there. That means the search
can run over the **sorted distinct bloom days** rather than over the numeric range,
which replaces log(10⁹) ≈ 30 probes with log(n).

Verified against the value-range search over 20,000 random cases — **0
disagreements**. Measured:

| n | distinct days | probes over values | probes over candidates | ns over values | ns over candidates |
|---|---|---|---|---|---|
| 1,000 | 1,000 | 29.9 | **10.0** | 68,382 | **50,754** |
| 20,000 | 19,999 | 30.0 | **14.4** | 1,340,778 | 1,305,940 |

It cuts probes by two to three times and wins 1.35x at n = 1,000 — then only 1.03x
at n = 20,000, because the sort it needs costs O(n log n) and the probes it saves
each cost only O(n). It is a real improvement that mostly pays for itself.

## The predicate's early exit, again

Koko's container measured that stopping the count once the budget was blown saved
1–2% of the work and cost time at scale. The mirror idea here is to stop as soon as
m bouquets exist:

| n | plain | with the early exit |
|---|---|---|
| 1,000 | 75,107 | **64,169** |
| 20,000 | **1,510,495** | 2,182,466 |

Faster at n = 1,000 and **1.44x slower** at n = 20,000. The same shape as Koko, and
the same conclusion: the exit is worth having only when the predicate usually
succeeds early, and binary search deliberately spends most of its probes where it
does not.

<!-- @intuition -->
Two problems in a row have used the same skeleton — search a range of answers, decide each candidate with a loop — and the interesting differences are all in the loop. Koko's loop was a reduction: each pile contributed independently, so the array could have been a multiset. This one is a scan with state, because a bouquet needs neighbours, and that single word changes what the predicate can be. The habit worth forming is to look at a candidate-search problem and ask what the predicate actually needs from the input: if it needs only a total, the order is free and the accumulator is the thing to watch; if it needs adjacency, the order is load-bearing and the state carried between elements is the thing to get right. Everything else — the bounds, the guard, the early exit — is the same problem wearing different numbers.

<!-- @approach -->
### Try Every Day

<!-- @idea -->
Walk the days upward and return the first on which m bouquets can be made.

<!-- @steps -->
1. If m bouquets need more flowers than exist, no day works.
2. Start at the earliest bloom day.
3. For each day, scan the array counting runs of bloomed flowers.
4. Return the first day whose count reaches m.
5. Passing the last bloom day without success means the answer is -1.

<!-- @complexity -->
- time: O(maxDay · n)
- space: O(1)
- note: Correct and unusable at the real scale, where bloom days go to 10⁹. It is worth writing once because the scan it performs is exactly the predicate the binary search reuses — the only difference is how many days get tested.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

static bool canMake(const vector<int>& bloom, int day, int m, int k) {
    long long made = 0;
    int run = 0;
    for (int b : bloom) {
        if (b <= day) { if (++run == k) { made++; run = 0; } }
        else            run = 0;
    }
    return made >= m;
}

int minDays(const vector<int>& bloom, int m, int k) {
    if ((long long)m * k > (long long)bloom.size()) return -1;
    int hi = *max_element(bloom.begin(), bloom.end());
    for (int d = *min_element(bloom.begin(), bloom.end()); d <= hi; d++)
        if (canMake(bloom, d, m, k)) return d;
    return -1;
}
```

<!-- @annotations -->
- 9: `run = 0` after completing a bouquet, so 2k adjacent flowers make two bouquets rather than one. Leaving it out counts a long run as a single bouquet.
- 10: `run = 0` on an unbloomed flower is what enforces adjacency at all. Without it the predicate counts total bloomed flowers and ignores position entirely.
- 17: The cast is what stops m * k overflowing. At the problem's limits the product reaches 10^11.
- 19: Starting at the smallest bloom day rather than 1, since no bouquet can exist before the first flower opens.

<!-- @code java -->
```java
static boolean canMake(int[] bloom, int day, int m, int k) {
    long made = 0;
    int run = 0;
    for (int b : bloom) {
        if (b <= day) { if (++run == k) { made++; run = 0; } }
        else            run = 0;
    }
    return made >= m;
}

static int minDays(int[] bloom, int m, int k) {
    if ((long) m * k > bloom.length) return -1;
    int lo = Integer.MAX_VALUE, hi = 0;
    for (int b : bloom) { lo = Math.min(lo, b); hi = Math.max(hi, b); }
    for (int d = lo; d <= hi; d++) if (canMake(bloom, d, m, k)) return d;
    return -1;
}
```

<!-- @annotations -->
- 13: `(long) m * k` casts the first operand, so the multiplication happens in 64 bits. `(long)(m * k)` overflows first and widens the wrong value.

<!-- @code python -->
```python
def can_make(bloom, day, m, k):
    made = run = 0
    for b in bloom:
        if b <= day:
            run += 1
            if run == k:
                made += 1
                run = 0
        else:
            run = 0
    return made >= m


def min_days(bloom, m, k):
    if m * k > len(bloom):
        return -1
    for d in range(min(bloom), max(bloom) + 1):
        if can_make(bloom, d, m, k):
            return d
    return -1
```

<!-- @annotations -->
- 15: No cast needed. Python integers grow as required, so the guard that overflows in C++ and Java is exact here.

<!-- @approach -->
### Binary Search the Distinct Bloom Days

<!-- @idea -->
Only days on which some flower blooms can change the answer, so search the sorted distinct bloom days instead of the numeric range.

<!-- @steps -->
1. Rule out the impossible case first.
2. Sort the bloom days and remove duplicates — these are the only candidates.
3. Binary search that list by index.
4. Test each candidate day with the run-counting scan.
5. Return the smallest candidate that works.

<!-- @complexity -->
- time: O(n log n) to sort, then O(n log n) to search — log n probes instead of log(maxDay)
- space: O(n) for the candidate list
- note: Correct on all 20,000 randomised comparisons, and it cuts probes from 29.9 to **10.0** at n = 1,000. The sort limits the payoff: 1.35x faster at n = 1,000 and only 1.03x at n = 20,000, because the probes it saves cost O(n) each while the sort costs O(n log n) once.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

static bool canMake(const vector<int>& bloom, int day, int m, int k) {
    long long made = 0;
    int run = 0;
    for (int b : bloom) {
        if (b <= day) { if (++run == k) { made++; run = 0; } }
        else            run = 0;
    }
    return made >= m;
}

int minDays(const vector<int>& bloom, int m, int k) {
    if ((long long)m * k > (long long)bloom.size()) return -1;
    vector<int> days(bloom);
    sort(days.begin(), days.end());
    days.erase(unique(days.begin(), days.end()), days.end());

    int lo = 0, hi = (int)days.size() - 1, ans = -1;
    while (lo <= hi) {
        int i = lo + (hi - lo) / 2;
        if (canMake(bloom, days[i], m, k)) { ans = days[i]; hi = i - 1; }
        else                                 lo = i + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 19: Removing duplicates is not required for correctness, only for the probe count — repeated days would just be tested twice.
- 23: The search runs over *indices* into the candidate list, and records the *value* at that index. Mixing the two is the easy mistake here.
- 24: The scan still runs over the original array, not the sorted copy. Sorting destroys adjacency, which is the one thing this predicate depends on.

<!-- @code java -->
```java
static int minDays(int[] bloom, int m, int k) {
    if ((long) m * k > bloom.length) return -1;
    int[] days = bloom.clone();
    Arrays.sort(days);
    int u = 0;
    for (int i = 0; i < days.length; i++)
        if (i == 0 || days[i] != days[i - 1]) days[u++] = days[i];

    int lo = 0, hi = u - 1, ans = -1;
    while (lo <= hi) {
        int i = lo + (hi - lo) / 2;
        if (canMake(bloom, days[i], m, k)) { ans = days[i]; hi = i - 1; }
        else                                 lo = i + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 3: `clone()`, because sorting the caller's array in place would destroy the adjacency the predicate reads.

<!-- @code python -->
```python
def min_days(bloom, m, k):
    if m * k > len(bloom):
        return -1
    days = sorted(set(bloom))
    lo, hi, ans = 0, len(days) - 1, -1
    while lo <= hi:
        i = (lo + hi) // 2
        if can_make(bloom, days[i], m, k):
            ans = days[i]
            hi = i - 1
        else:
            lo = i + 1
    return ans
```

<!-- @annotations -->
- 4: `sorted(set(...))` builds the candidate list in one step, and leaves `bloom` untouched for the scan.

<!-- @approach -->
### Binary Search the Day Range

<!-- @idea -->
Halve the range of days directly, deciding each candidate with the run-counting scan.

<!-- @steps -->
1. Return -1 immediately if m bouquets need more flowers than exist, computing that product in 64 bits.
2. Set the range to the smallest and largest bloom days.
3. Take the midpoint day and count how many bouquets it allows.
4. If it reaches m, record it and search earlier; otherwise search later.
5. The last recorded day is the answer, and -1 means none worked.

<!-- @complexity -->
- time: O(n log(maxDay − minDay)) — about 30 probes at the problem's limits
- space: O(1)
- note: The default. It needs no sort, no extra memory, and lands within 3% of the candidate search at n = 20,000 — 1,340,778ns against 1,305,940. Its bounds are worth setting from the data: with clustered bloom days that costs one pass and saves two thirds of the probes.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

static bool canMake(const vector<int>& bloom, int day, int m, int k) {
    long long made = 0;
    int run = 0;
    for (int b : bloom) {
        if (b <= day) { if (++run == k) { made++; run = 0; } }
        else            run = 0;
    }
    return made >= m;
}

int minDays(const vector<int>& bloom, int m, int k) {
    if ((long long)m * k > (long long)bloom.size()) return -1;
    int lo = *min_element(bloom.begin(), bloom.end());
    int hi = *max_element(bloom.begin(), bloom.end());
    int ans = -1;
    while (lo <= hi) {
        int day = lo + (hi - lo) / 2;
        if (canMake(bloom, day, m, k)) { ans = day; hi = day - 1; }
        else                             lo = day + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 9: The two `run = 0` assignments carry the whole meaning of "adjacent". One closes a completed bouquet so 2k in a row make two; the other breaks the run at an unbloomed flower.
- 16: `(long long)m * k`, casting the operand rather than the result. Without it the product wraps on 99.97% of legal inputs — harmlessly, as it turns out, but it is still undefined behaviour and it costs a factor of a million on impossible inputs.
- 17: Bounds from the data. With bloom days spread across the full range this saves 0.1 probes; with them clustered it saves 20 of 30.
- 21: Record and search earlier, because the answer is the *earliest* day that works.
- 25: `ans`, not `lo`. This form runs until the pointers cross, so both move past the answer, and `-1` survives when nothing ever worked.

<!-- @code java -->
```java
static int minDays(int[] bloom, int m, int k) {
    if ((long) m * k > bloom.length) return -1;
    int lo = Integer.MAX_VALUE, hi = 0;
    for (int b : bloom) { lo = Math.min(lo, b); hi = Math.max(hi, b); }
    int ans = -1;
    while (lo <= hi) {
        int day = lo + (hi - lo) / 2;
        if (canMake(bloom, day, m, k)) { ans = day; hi = day - 1; }
        else                             lo = day + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 7: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int for bloom days near 10^9.

<!-- @code python -->
```python
def min_days(bloom, m, k):
    if m * k > len(bloom):
        return -1
    lo, hi, ans = min(bloom), max(bloom), -1
    while lo <= hi:
        day = (lo + hi) // 2
        if can_make(bloom, day, m, k):
            ans = day
            hi = day - 1
        else:
            lo = day + 1
    return ans
```

<!-- @annotations -->
- 2: Exact in Python for any m and k, which is the one language where this guard cannot be written wrongly.

<!-- @example -->

<!-- @input -->
```
bloomDay = [1, 10, 3, 10, 2], m = 3, k = 1
```

<!-- @output -->
```
3
```

<!-- @why -->
With k = 1 adjacency is free, so the answer is simply the third-smallest bloom day. It is the case that makes the run-counting logic look unnecessary — and it is the only case where that is true.

<!-- @walkthrough -->
```
day 3 : bloomed = [1, _, 3, _, 2]  ->  runs of length 1 at 0, 2, 4
                                       3 bouquets   fits
day 2 : bloomed = [1, _, _, _, 2]  ->  2 bouquets   not enough

lo=1 hi=10  day=5   3 bouquets  ans=5, hi=4
lo=1 hi=4   day=2   2 bouquets  lo=3
lo=3 hi=4   day=3   3 bouquets  ans=3, hi=2
lo=3 > hi=2 -> 3
```

<!-- @example -->

<!-- @input -->
```
bloomDay = [1, 10, 3, 10, 2], m = 3, k = 2
```

<!-- @output -->
```
-1
```

<!-- @why -->
Three bouquets of two adjacent flowers need six flowers and only five exist. This is the guard's whole job — and the case where writing it in 32-bit arithmetic costs a million times the runtime.

<!-- @walkthrough -->
```
m * k = 3 * 2 = 6 > 5 = n   ->  -1, immediately

Scale it up: m = 50,000 and k = 50,000 with n = 100,000.
  exact  : 2,500,000,000  >  100,000   ->  -1 at once
  as int : -1,794,967,296 <= 100,000   ->  guard passes

The search then runs all 30 probes, finds no workable day,
and returns -1 anyway — the right answer by accident.
Measured at n = 20,000: 1,619,398ns against 1.6ns.
```

<!-- @example -->

<!-- @input -->
```
bloomDay = [7, 7, 7, 7, 12, 7, 7], m = 2, k = 3
```

<!-- @output -->
```
12
```

<!-- @why -->
On day 7 there are six bloomed flowers — more than the six needed — but they are split by the unbloomed one at index 4, so only one bouquet can be formed. This is the case that separates "enough flowers" from "enough adjacent flowers".

<!-- @walkthrough -->
```
day 7  : bloomed [7 7 7 7 _ 7 7]
         run 0..3 -> length 4 -> 1 bouquet, run resets
         run 5..6 -> length 2 -> not enough for k = 3
         made = 1  <  2        not enough

day 12 : bloomed [7 7 7 7 12 7 7]  -> one run of length 7
         7 / 3 = 2 bouquets
         made = 2  >=  2       fits

Six bloomed flowers on day 7 and six needed, yet the answer
is no. A predicate that summed bloomed flowers instead of
scanning runs would return 7 here.
```

<!-- @example -->

<!-- @input -->
```
bloomDay = [1000, 1000, 1000, 1000], m = 2, k = 2
```

<!-- @output -->
```
1000
```

<!-- @why -->
Every flower blooms on the same day, so the search range collapses to a single value. It is the extreme of the bounds measurement — one probe instead of thirty.

<!-- @walkthrough -->
```
lo = min = 1000, hi = max = 1000
lo <= hi, day = 1000, one run of 4 -> 4/2 = 2 bouquets -> ans = 1000, hi = 999
lo > hi -> 1000

One probe. Searching 1 .. 1,000,000,000 instead would take
30 probes to reach the same answer — which is the whole of
the "all equal" row in the bounds table.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the run-counting predicate that adjacency forces, the feasibility guard that overflows harmlessly but expensively, and the measured conditions under which the tighter bounds and the candidate search actually pay.

<!-- @sampleInput -->
```json
{"primary":{"bloomDay":[7,7,7,7,12,7,7],"m":2,"k":3,"answer":12,"day7":{"bloomed":[true,true,true,true,false,true,true],"runs":[{"span":"0..3","length":4,"bouquets":1},{"span":"5..6","length":2,"bouquets":0}],"made":1,"enough":false,"note":"six bloomed flowers and six needed, but split by the gap at index 4"},"day12":{"bloomed":[true,true,true,true,true,true,true],"runs":[{"span":"0..6","length":7,"bouquets":2}],"made":2,"enough":true}},"predicateShape":{"contrastWithKoko":"Koko summed an independent contribution per pile, so order was irrelevant; here the flowers must be adjacent, so the scan carries state","pseudocode":"run = 0; made = 0; for each flower: if bloomed: run += 1; if run == k: made += 1; run = 0  else: run = 0","twoResets":[{"where":"after completing a bouquet","why":"so 2k adjacent flowers make two bouquets, not one"},{"where":"at an unbloomed flower","why":"this is what enforces adjacency at all"}],"warning":"removing either leaves the predicate monotone and wrong"},"guardOverflow":{"check":"m * k > n","limits":"m <= 10^6, k <= n <= 10^5","rows":[{"m":50000,"k":50000,"exact":2500000000,"asInt32":-1794967296},{"m":100000,"k":100000,"exact":10000000000,"asInt32":1410065408},{"m":1000000,"k":100000,"exact":100000000000,"asInt32":1215752192}],"ubsan":"runtime error: signed integer overflow: 50000 * 50000 cannot be represented in type 'int'","measured":{"pairs":200000,"wrapped":199941,"wrappedPct":99.97,"answersDiffered":0},"whyHarmless":"a genuine m*k within n is at most 10^5 and cannot overflow, so the wrap can only turn an IMPOSSIBLE case into a search — and searching an impossible case leaves ans at -1, which is correct","whyFixItAnyway":["it is undefined behaviour, so the harmlessness belongs to this compiler rather than to the language","it is masked by the code beneath it, so it stays broken until that code changes"],"cost":[{"n":1000,"int32Guard":77217,"int64Guard":1.3},{"n":20000,"int32Guard":1619398,"int64Guard":1.6}],"costReading":"about a factor of a million on impossible inputs, for a cast"},"boundsDependOnSpread":{"n":5000,"rows":[{"drawnFrom":"1 .. 1,000,000,000","tight":29.8,"wide":29.9,"saved":0.1},{"drawnFrom":"1 .. 1,000,000","tight":19.9,"wide":29.9,"saved":10.0},{"drawnFrom":"1 .. 1,000","tight":10.0,"wide":29.9,"saved":19.9},{"drawnFrom":"500,000,000 .. 500,001,000","tight":9.9,"wide":29.9,"saved":19.9},{"drawnFrom":"all equal","tight":1.0,"wide":30.0,"saved":29.0}],"reading":"when the values fill the legal range the tight bound saves nothing; when they are clustered — even clustered high — it saves two thirds of the probes"},"candidateSearch":{"idea":"only days on which some flower blooms can change the predicate, so search the sorted distinct bloom days","verified":{"cases":20000,"disagreements":0},"rows":[{"n":1000,"distinctDays":1000,"probesOverValues":29.9,"probesOverCandidates":10.0,"nsOverValues":68382,"nsOverCandidates":50754},{"n":20000,"distinctDays":19999,"probesOverValues":30.0,"probesOverCandidates":14.4,"nsOverValues":1340778,"nsOverCandidates":1305940}],"reading":"cuts probes two to three times and wins 1.35x at n = 1,000, then only 1.03x at n = 20,000 — the sort costs O(n log n) once and each saved probe costs only O(n)","trap":"the scan must still run over the ORIGINAL array; sorting destroys the adjacency the predicate depends on"},"earlyExitAgain":{"idea":"stop the scan as soon as m bouquets exist","rows":[{"n":1000,"plain":75107,"withEarlyExit":64169},{"n":20000,"plain":1510495,"withEarlyExit":2182466}],"reading":"faster at n = 1,000 and 1.44x slower at n = 20,000 — the same shape Koko measured, because binary search deliberately spends most of its probes where the predicate does not succeed early"},"assertions":["waiting longer never removes a bloomed flower, so the predicate is monotone in the day","m*k > n means no day can ever work","the answer is always one of the bloom days","sorting the array destroys the adjacency the predicate reads","-1 survives when no candidate day works"]}
```

<!-- @highlights -->
- Adjacency turns the predicate from a sum into a scan with state — two `run = 0` assignments carry the whole meaning.
- The feasibility guard `m * k > n` overflows on **99.97%** of legal inputs and changes **no** answers.
- It is masked because a true `m·k ≤ n` cannot overflow, so the wrap only sends impossible cases into a search that correctly returns −1.
- It still costs about a **million times** on impossible inputs: 1,619,398ns against 1.6ns.
- Bounds from the data save 0.1 probes when bloom days fill the range and 20 of 30 when they are clustered.
- Searching the distinct bloom days cuts probes from 29.9 to 10.0, and the sort eats most of the gain by n = 20,000.

<!-- @edgeCases -->
- `m · k > n` — impossible, and the only case the guard exists for.
- `m · k` overflowing a 32-bit int — happens on 99.97% of legal (m, k) pairs and is silently harmless.
- k = 1 — adjacency becomes free and the answer is the m-th smallest bloom day.
- k = n — one bouquet needs every flower, so the answer is the maximum bloom day.
- All flowers blooming on the same day — the search range collapses to one value and one probe.
- Enough bloomed flowers but split by a gap — `[7,7,7,7,12,7,7]` with m=2, k=3 answers 12, not 7.
- A run of exactly 2k flowers — must yield two bouquets, which is what resetting `run` after each one guarantees.
- m = 0 — zero bouquets are trivially available on the first day, if the problem permits it.
- Sorting the input array in place — destroys the adjacency the predicate reads, and the answer becomes meaningless.
- Bloom days near 10⁹ — `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.

<!-- @pitfalls -->
- Writing `m * k > n` in 32-bit arithmetic. It is undefined behaviour on 99.97% of legal inputs, and costs a factor of a million on impossible ones.
- Concluding the guard is fine because the answers match. It is masked by the code beneath it, not correct.
- Forgetting to reset `run` after completing a bouquet. A run of 2k flowers then makes one bouquet instead of two.
- Forgetting to reset `run` at an unbloomed flower. The predicate then counts total bloomed flowers and ignores adjacency entirely.
- Counting bloomed flowers rather than runs. `[7,7,7,7,12,7,7]` with m=2, k=3 has six bloomed flowers on day 7 and still cannot make two bouquets.
- Sorting the array before scanning. Sorting is fine for building the candidate list and fatal for the predicate.
- Searching `1 … 10⁹` when the bloom days are clustered. That costs 30 probes where 10 would do.
- Expecting the tight bounds to always help. With values spread across the legal range they save 0.1 probes.
- Adding the predicate's early exit for speed. It is 1.44x slower at n = 20,000, the same result Koko measured.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int for bloom days near 10⁹.

<!-- @doubt -->
### How is the predicate different from Koko's?

<!-- @answer -->
Koko's summed an independent contribution per pile — `ceil(pile / k)` depends on nothing but that pile — so the array could have been an unordered multiset and the answer would not change. Here a bouquet needs **k adjacent** flowers, so the scan has to carry state across elements: a running count of consecutive bloomed flowers, reset both when a bouquet completes and when an unbloomed flower breaks the run. That makes order load-bearing, which has a practical consequence worth noticing — the candidate-search approach sorts a *copy* of the bloom days, because sorting the array itself would destroy the very thing the predicate reads.

<!-- @doubt -->
### If the overflowing guard never changes an answer, why fix it?

<!-- @answer -->
Three reasons, in increasing order of importance. First, it costs: on an impossible input the wrapped guard lets the search run all thirty probes, measured at **1,619,398ns against 1.6ns** at n = 20,000 — roughly a factor of a million, for the sake of a cast. Second, it is undefined behaviour, confirmed by UndefinedBehaviorSanitizer, so its harmlessness is a property of this compiler at this optimisation level rather than a guarantee the language gives you. Third and most importantly, it is only harmless *because of the code beneath it*: the wrap turns an impossible case into a search, and the search happens to return -1 for impossible cases. Change how the search initialises `ans`, or add an early return, and the latent bug becomes a live one with nothing in the guard itself having changed.

<!-- @doubt -->
### Why does the wrap only ever fail in the safe direction?

<!-- @answer -->
Because of an asymmetry in the arithmetic. The guard asks whether `m · k` exceeds n, and n is at most 10⁵. So any product that is genuinely *within* n is at most 10⁵ — nowhere near overflowing. The only products that can overflow are the ones that were already far larger than n, which means the true answer was -1 anyway. When such a product wraps, it may become small or negative and slip past the guard; the search then runs over an impossible configuration, finds no day on which m bouquets exist, and returns the -1 it was initialised with. There is no arrangement of inputs that makes a *feasible* case look infeasible, which is why 200,000 random trials produced 199,941 wraps and zero differing answers.

<!-- @doubt -->
### Should I set the bounds from the data or just use 1 to 10⁹?

<!-- @answer -->
From the data, but knowing that the payoff varies enormously. Measured at n = 5,000, with bloom days drawn from the full legal range the tight bound saves **0.1 probes of 30** — nothing. Draw them from 1 … 1,000 instead and it saves **19.9**. The most instructive row is the clustered-high one: bloom days between 500,000,000 and 500,001,000 need only **9.9** probes with tight bounds and 29.9 with the fixed range, even though the values themselves are large. What matters is the *width* of the range, not where it sits. Since computing the minimum and maximum is one pass — often one you are making anyway — it is worth doing, but it is not the lever the root subtopics made bounds out to be.

<!-- @doubt -->
### Is searching the distinct bloom days worth the sort?

<!-- @answer -->
At moderate n, yes; at large n it mostly pays for itself and no more. The insight is sound — between two consecutive bloom days nothing changes, so only the bloom days themselves can be the answer — and it is verified correct across 20,000 randomised comparisons with **0 disagreements**. It replaces about 30 probes with log n: measured **29.9 down to 10.0** at n = 1,000 and 30.0 down to 14.4 at n = 20,000. But each saved probe costs O(n) and the sort costs O(n log n) once, so the net is **1.35x at n = 1,000 and 1.03x at n = 20,000**. If you already have the days sorted for another reason it is free and clearly better; if not, the plain range search is simpler and within a few percent.

<!-- @doubt -->
### Why does the early exit hurt here too?

<!-- @answer -->
For exactly the reason Koko's did. Stopping the scan once m bouquets exist sounds like it should halve the work, and measured it does not: **64,169ns against 75,107 at n = 1,000, but 2,182,466 against 1,510,495 at n = 20,000** — 1.44x slower. Binary search converges on the boundary, so most of its probes land on days where the predicate is *marginal*: either just short of m bouquets, in which case the exit never fires and its test is pure overhead, or just barely reaching m, in which case it fires near the end of the array. The exit pays only when the predicate usually succeeds early, and a binary search is specifically designed to spend its time where that is not true.
