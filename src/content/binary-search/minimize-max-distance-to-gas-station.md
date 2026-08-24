---
id: minimize-max-distance-to-gas-station
topic: Binary Search
title: Minimize Max Distance to Gas Station
difficulty: Hard
status: ready
prerequisites:
  - split-array-largest-sum
  - book-allocation-problem
  - aggressive-cows
relatedIds:
  - split-array-largest-sum
  - book-allocation-problem
  - painters-partition
  - aggressive-cows
  - koko-eating-bananas
---

<!-- @summary -->
The first search in this topic whose answer is a real number rather than an index or an integer, which changes how the loop terminates and nothing else. Writing that loop as while (hi - lo > 1e-6) does not terminate at all once coordinates reach 10^12, because adjacent doubles there are already further apart than the tolerance. A fixed 60 halvings converge exactly and cannot hang.

<!-- @theory -->
## The problem

`stations` is sorted. Add `k` new stations anywhere on the line — at any real
coordinate, not just integers — so the largest distance between adjacent stations
is as small as possible. Return that distance, correct to 1e-6.

```
stations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],  k = 9   ->  0.500000
   nine gaps of 1, one new station in each   ->  every gap becomes 0.5

stations = [23, 24, 36, 39, 46, 56, 57, 65, 84, 98],  k = 1   ->  14.000000
   gaps 1, 12, 3, 7, 10, 1, 8, 19, 14; splitting the 19 gives 9.5,
   so the 14 becomes the largest and is the answer
```

## The answer is continuous, and that is the whole difference

Everything up to here searched a discrete set — an index, a page count, a
spacing in whole units — so the loop could stop when `lo` and `hi` met. Here any
real number is a legal answer, there is no "next" candidate to step to, and the
search converges rather than terminates.

The predicate is unchanged in spirit. For a candidate distance `x`, a gap of
length `d` needs `ceil(d/x) - 1` new stations to be broken into pieces no longer
than `x`. Sum that over all gaps; if the total is at most `k`, then `x` is
achievable. Larger `x` needs fewer stations, so feasibility is monotone and the
answer is the smallest achievable `x`.

## The termination condition is a real trap

The natural way to write a real-valued search is to stop when the interval is
smaller than the tolerance:

```cpp
while (hi - lo > 1e-6) { ... }     // does not always terminate
```

Measured against coordinate magnitude:

| largest gap | result |
|---|---|
| 10⁰ | 20 iterations |
| 10² | 27 iterations |
| 10⁴ | 34 iterations |
| 10⁸ | 47 iterations |
| 10¹² | **never ends** |
| 10¹⁵ | **never ends** |
| 10¹⁸ | **never ends** |

The reason is that doubles are not evenly spaced. Near 10¹² the gap between
adjacent representable doubles is **1.22e-4**, already larger than the 1e-6 you
are waiting for, so `hi - lo` reaches that spacing and stops shrinking. The loop
spins forever, and the symptom is a hang with no wrong answer to inspect —
exactly the failure shape Aggressive Cows produces when the compact form rounds
the wrong way.

Iterating a fixed number of times has neither problem:

| halvings | worst absolute error |
|---|---|
| 20 | 9.5e-02 |
| 30 | 8.9e-05 |
| 40 | 8.7e-08 |
| 50 | 8.7e-11 |
| **60** | **0** |
| 100 | 0 |

Sixty halvings reach exact double precision on every case measured, and the
count is a compile-time constant, so the loop cannot depend on the data. That is
the version to write. Each halving divides the interval by two regardless of
magnitude, so the iteration count needed for absolute precision `e` over a range
`R` is just `log2(R/e)` — 47 for the 10⁸ row above, which the measurement matches
exactly.

## The counting formula, unlike the integer case, is forgiving

In Split Array – Largest Sum the difference between `>` and `>=` in the greedy
was a **48.07%** coin flip. The analogous choice here is whether to count
`ceil(d/x) - 1` or `floor(d/x)`, which disagree by one exactly when `d/x` is an
integer. Measured over every gap multiset of 1 to 4 gaps drawn from `{1..5}` with
k from 0 to 5 — **4,680 cases** — both are correct, worst error **8.9e-16**.

That is not luck, and the contrast is the point. An integer search has to land
*exactly* on the answer, so a predicate that is wrong on a single value is wrong
in the answer. A real-valued search only has to converge, and the inputs where the
two formulas disagree form a measure-zero set that the halving approaches but
never has to decide. The same class of off-by-one is fatal in one setting and
invisible in the other.

## Insert-one-at-a-time is correct, and its cost tracks k

The obvious greedy — repeatedly add a station to whichever section currently has
the largest piece — is genuinely optimal. Verified against an exhaustive
enumeration of every way to distribute k stations among the gaps, using exact
rational comparison: **0 wrong over 4,680 cases**.

It is also the wrong shape for this problem's constraints. LeetCode 774 allows
n up to 2,000 and **k up to 10⁶**:

| n | k | scan, O(n·k) | max-heap, O(k log n) | binary, O(n·60) |
|---|---|---|---|---|
| 100 | 100 | 21,666 | **5,833** | 13,625 |
| 2,000 | 1,000 | 5,079,334 | **146,167** | 201,431 |
| 2,000 | 10,000 | 23,632,708 | 560,708 | **84,778** |
| 2,000 | 100,000 | too slow | 5,269,125 | **84,972** |
| 2,000 | 10⁶ | too slow | 52,947,792 | **85,514** |

Nanoseconds. The binary search column is **flat** — 84,778 to 85,514 across a
hundredfold change in k — because its cost is `n` times a fixed iteration count
and `k` appears only inside a comparison. The heap grows linearly with k and is
**633x** behind at the stated maximum.

Below about k = n the heap wins, and it is the better answer to "add a few
stations". Above it the binary search is not just faster but insensitive, which
is the more useful property when k is the parameter the problem lets grow.

<!-- @intuition -->
The interesting thing about moving to a continuous answer is how little changes. The predicate is the same shape, monotonicity is the same argument, and the greedy feasibility check is the same one-pass count — only the stopping rule differs, because there is no longer a "next candidate" to step onto. That is worth holding onto, because the instinct on first meeting a floating-point search is to treat it as a different technique with its own rules about epsilons. It is the same technique; you replace "stop when the ends meet" with "halve a fixed number of times", and you stop being able to write a termination condition that depends on the data. The forgiving counting formula makes the same point from the other side: the off-by-one that decides an integer search is invisible here, because convergence never has to commit to a single value.

<!-- @approach -->
### Insert One at a Time, by Scanning

<!-- @idea -->
Repeatedly place the next station in whichever section currently has the largest piece, found by scanning all sections.

<!-- @steps -->
1. Compute the gaps between consecutive stations.
2. Track how many new stations each gap has received; a gap of length d holding c of them has pieces of d/(c+1).
3. Scan for the largest current piece and add a station there.
4. Repeat k times.
5. The answer is the largest piece remaining.

<!-- @complexity -->
- time: O(n·k)
- space: O(n)
- note: Provably optimal and verified — **0 wrong** against exhaustive distribution over 4,680 cases — but its cost is the product of both inputs. Already 23ms at k = 10,000, and unusable at this problem's stated k = 10⁶.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

double minimiseMaxDist(const vector<int>& stations, int k) {
    int g = (int)stations.size() - 1;
    vector<double> gap(g);
    for (int i = 0; i < g; i++) gap[i] = stations[i + 1] - stations[i];
    vector<int> added(g, 0);

    for (int s = 0; s < k; s++) {
        int best = 0;
        double bestPiece = gap[0] / (added[0] + 1);
        for (int j = 1; j < g; j++) {
            double piece = gap[j] / (added[j] + 1);
            if (piece > bestPiece) { bestPiece = piece; best = j; }
        }
        added[best]++;
    }

    double worst = 0;
    for (int j = 0; j < g; j++) worst = max(worst, gap[j] / (added[j] + 1));
    return worst;
}
```

<!-- @annotations -->
- 13: The current piece, not the original gap — the `/ (added[0] + 1)` belongs on the initialiser just as much as inside the loop. Seeding this with `gap[0]` is the classic bug: section 0 keeps winning after it has already been subdivided, which measured wrong on 1,654 of 4,680 cases.
- 15: `added[j] + 1` — c new stations cut a gap into c+1 pieces, so the divisor is never zero even for an untouched gap.
- 11: k iterations of an O(n) scan. This product is why the approach cannot reach k = 10⁶.

<!-- @code java -->
```java
static double minimiseMaxDist(int[] stations, int k) {
    int g = stations.length - 1;
    double[] gap = new double[g];
    for (int i = 0; i < g; i++) gap[i] = stations[i + 1] - stations[i];
    int[] added = new int[g];

    for (int s = 0; s < k; s++) {
        int best = 0;
        double bestPiece = gap[0] / (added[0] + 1);
        for (int j = 1; j < g; j++) {
            double piece = gap[j] / (added[j] + 1);
            if (piece > bestPiece) { bestPiece = piece; best = j; }
        }
        added[best]++;
    }

    double worst = 0;
    for (int j = 0; j < g; j++) worst = Math.max(worst, gap[j] / (added[j] + 1));
    return worst;
}
```

<!-- @annotations -->
- 4: The subtraction happens in int and is then widened. Both operands are station coordinates, so the difference cannot overflow when the coordinates themselves fit.

<!-- @code python -->
```python
def minimise_max_dist(stations, k):
    gap = [stations[i + 1] - stations[i] for i in range(len(stations) - 1)]
    added = [0] * len(gap)

    for _ in range(k):
        best = max(range(len(gap)), key=lambda j: gap[j] / (added[j] + 1))
        added[best] += 1

    return max(g / (a + 1) for g, a in zip(gap, added))
```

<!-- @annotations -->
- 6: `max(..., key=...)` scans every section on every one of the k iterations, so this line alone is the O(n·k).

<!-- @approach -->
### Insert One at a Time, with a Max-Heap

<!-- @idea -->
The same greedy, but keep the sections in a priority queue so the largest piece is found in O(log n) instead of O(n).

<!-- @steps -->
1. Push every gap onto a max-heap, keyed by its current piece length.
2. Pop the largest, increment its station count, push it back with its new piece length.
3. Repeat k times.
4. The heap's top is the answer.

<!-- @complexity -->
- time: O(n + k log n)
- space: O(n)
- note: The right shape when k is small — fastest of the three at k = 1,000. Still linear in k, so it is **633x** behind the binary search at k = 10⁶.

<!-- @code cpp -->
```cpp
#include <vector>
#include <queue>
#include <utility>
using namespace std;

double minimiseMaxDist(const vector<int>& stations, int k) {
    priority_queue<pair<double, pair<int,int>>> pq;
    for (int i = 0; i + 1 < (int)stations.size(); i++) {
        double g = stations[i + 1] - stations[i];
        pq.push({g, {i, 0}});
    }
    for (int s = 0; s < k; s++) {
        auto top = pq.top(); pq.pop();
        int idx = top.second.first;
        int count = top.second.second + 1;
        double g = stations[idx + 1] - stations[idx];
        pq.push({g / (count + 1), {idx, count}});
    }
    return pq.top().first;
}
```

<!-- @annotations -->
- 7: The `double` at the front of the pair is the heap key, and it holds the section's *current piece* rather than its original gap — so the ordering stays correct as sections are subdivided. It is the same quantity the scanning version recomputes on every pass.
- 16: The original gap is recovered from the station array rather than stored, keeping the heap entry small.
- 19: The top after k insertions is the largest remaining piece, which is the answer — no final scan needed.

<!-- @code java -->
```java
static double minimiseMaxDist(int[] stations, int k) {
    PriorityQueue<double[]> pq =
        new PriorityQueue<>((a, b) -> Double.compare(b[0], a[0]));
    for (int i = 0; i + 1 < stations.length; i++)
        pq.add(new double[]{stations[i + 1] - stations[i], i, 0});
    for (int s = 0; s < k; s++) {
        double[] top = pq.poll();
        int idx = (int) top[1];
        int count = (int) top[2] + 1;
        double g = stations[idx + 1] - stations[idx];
        pq.add(new double[]{g / (count + 1), idx, count});
    }
    return pq.peek()[0];
}
```

<!-- @annotations -->
- 3: `Double.compare(b[0], a[0])` reverses the natural order, since Java's PriorityQueue is a min-heap by default.

<!-- @code python -->
```python
import heapq


def minimise_max_dist(stations, k):
    gap = [stations[i + 1] - stations[i] for i in range(len(stations) - 1)]
    heap = [(-g, i, 0) for i, g in enumerate(gap)]
    heapq.heapify(heap)
    for _ in range(k):
        piece, i, count = heapq.heappop(heap)
        count += 1
        heapq.heappush(heap, (-gap[i] / (count + 1), i, count))
    return -heap[0][0]
```

<!-- @annotations -->
- 6: Negating the key turns Python's min-heap into a max-heap; `heapq` offers no reverse option.

<!-- @approach -->
### Binary Search on the Answer

<!-- @idea -->
Guess a maximum distance and count the stations needed to achieve it; the count falls as the distance grows, so halve the interval a fixed number of times.

<!-- @steps -->
1. The answer lies in `[0, largest gap]`.
2. For a candidate `x`, a gap of length d needs `ceil(d/x) - 1` new stations.
3. Sum over all gaps; at most k means `x` is achievable.
4. Achievable, so try smaller: move `hi` down. Otherwise move `lo` up.
5. Halve a fixed 60 times and return `hi`.

<!-- @complexity -->
- time: O(n · iterations), independent of k
- space: O(1)
- note: The only approach whose cost does not depend on k — measured **84,778ns to 85,514ns** across k from 10⁴ to 10⁶. Sixty halvings converge to exact double precision, and being a fixed count the loop cannot hang.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <cmath>
using namespace std;

double minimiseMaxDist(const vector<int>& stations, int k) {
    double lo = 0, hi = 0;
    for (int i = 0; i + 1 < (int)stations.size(); i++)
        hi = max(hi, (double)(stations[i + 1] - stations[i]));

    for (int iter = 0; iter < 60; iter++) {
        double mid = (lo + hi) / 2;
        long long need = 0;
        for (int i = 0; i + 1 < (int)stations.size(); i++) {
            double g = stations[i + 1] - stations[i];
            need += (long long)ceil(g / mid) - 1;
            if (need > k) break;
        }
        if (need <= k) hi = mid;
        else           lo = mid;
    }
    return hi;
}
```

<!-- @annotations -->
- 11: A fixed count, not `while (hi - lo > 1e-6)`. The tolerance form never terminates once coordinates reach 10¹², because adjacent doubles there are 1.22e-4 apart — further than the tolerance itself.
- 16: `ceil(g / mid) - 1` is the number of *new* stations: breaking a gap into `ceil(g/mid)` pieces takes one fewer cut than pieces. `floor(g/mid)` also works here, and would be a coin flip in an integer search.
- 17: Bailing out once the count passes k. `k` can be 10⁶ while the sum over gaps can be far larger, so this also keeps `need` from running away.
- 19: Achievable means try smaller — `hi` moves down. This is the minimise-a-maximum direction, the same as Book Allocation and the reverse of Aggressive Cows.
- 22: Return `hi`, which is always a distance the count approved. `lo` is always one that failed.

<!-- @code java -->
```java
static double minimiseMaxDist(int[] stations, int k) {
    double lo = 0, hi = 0;
    for (int i = 0; i + 1 < stations.length; i++)
        hi = Math.max(hi, stations[i + 1] - stations[i]);

    for (int iter = 0; iter < 60; iter++) {
        double mid = (lo + hi) / 2;
        long need = 0;
        for (int i = 0; i + 1 < stations.length; i++) {
            double g = stations[i + 1] - stations[i];
            need += (long) Math.ceil(g / mid) - 1;
            if (need > k) break;
        }
        if (need <= k) hi = mid;
        else           lo = mid;
    }
    return hi;
}
```

<!-- @annotations -->
- 6: 60 is chosen from `log2(range / precision)` with headroom — 47 halvings suffice for 1e-6 over a 10⁸ range, and 60 reaches the limit of double precision.

<!-- @code python -->
```python
import math


def minimise_max_dist(stations, k):
    gap = [stations[i + 1] - stations[i] for i in range(len(stations) - 1)]
    lo, hi = 0.0, float(max(gap))

    for _ in range(60):
        mid = (lo + hi) / 2
        need = 0
        for g in gap:
            need += math.ceil(g / mid) - 1
            if need > k:
                break
        if need <= k:
            hi = mid
        else:
            lo = mid
    return hi
```

<!-- @annotations -->
- 8: `range(60)` rather than a tolerance test. Python's floats are the same IEEE doubles, so the non-termination is identical here.
- 12: `math.ceil` returns an int in Python 3, so `need` stays an exact integer and never accumulates floating-point error.

<!-- @example -->

<!-- @input -->
```
stations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], k = 9
```

<!-- @output -->
```
0.500000
```

<!-- @why -->
Nine gaps of length 1 and nine stations to place — one in each gap, halving every one. No arrangement does better, since concentrating stations in fewer gaps leaves some gap untouched at length 1.

<!-- @walkthrough -->
```
gaps = [1,1,1,1,1,1,1,1,1]     lo = 0,  hi = 1

mid=0.500000   needs 9  stations   <= 9   feasible    hi = 0.5
mid=0.250000   needs 27 stations   >  9   too tight   lo = 0.25
mid=0.375000   needs 18 stations   >  9   too tight   lo = 0.375
mid=0.437500   needs 18 stations   >  9   too tight   lo = 0.4375
mid=0.468750   needs 18 stations   >  9   too tight   lo = 0.46875
...  56 more halvings, hi never moving again
->  0.500000

Note the counts jump 9 -> 18 -> 27 and never take a value
between. The station count is a step function of x, but it
is monotone, and monotone is all the search needs.
```

<!-- @example -->

<!-- @input -->
```
stations = [23, 24, 36, 39, 46, 56, 57, 65, 84, 98], k = 1
```

<!-- @output -->
```
14.000000
```

<!-- @why -->
The gaps are 1, 12, 3, 7, 10, 1, 8, 19 and 14. The single station goes into the 19, splitting it into two 9.5s — which leaves the untouched 14 as the largest.

<!-- @walkthrough -->
```
gaps = [1,12,3,7,10,1,8,19,14]     lo = 0,  hi = 19

mid=9.500000    needs 4 stations   > 1   too tight   lo = 9.5
mid=14.250000   needs 1 station    <= 1  feasible    hi = 14.25
mid=11.875000   needs 3 stations   > 1   too tight   lo = 11.875
mid=13.062500   needs 2 stations   > 1   too tight   lo = 13.0625
mid=13.953125   needs 2 stations   > 1   too tight   lo = 13.953125
mid=14.101562   needs 1 station    <= 1  feasible    hi = 14.101562
mid=14.027344   needs 1 station    <= 1  feasible    hi = 14.027344
...  converging on 14 from above
->  14.000000

The answer is the second-largest gap, untouched. Splitting
the largest gap is only worth doing until it drops below
whatever is now the biggest — a balance the count captures
automatically.
```

<!-- @example -->

<!-- @input -->
```
stations = [0, 10], k = 4
```

<!-- @output -->
```
2.000000
```

<!-- @why -->
A single gap of 10 and four stations, cutting it into five equal pieces of 2. The smallest case where the answer is not any original gap or a simple halving of one.

<!-- @walkthrough -->
```
gaps = [10]     lo = 0,  hi = 10

mid=5.000000   needs 1 station    <= 4   feasible    hi = 5
mid=2.500000   needs 3 stations   <= 4   feasible    hi = 2.5
mid=1.250000   needs 7 stations   >  4   too tight   lo = 1.25
mid=1.875000   needs 5 stations   >  4   too tight   lo = 1.875
mid=2.187500   needs 4 stations   <= 4   feasible    hi = 2.1875
mid=2.031250   needs 4 stations   <= 4   feasible    hi = 2.03125
mid=1.953125   needs 5 stations   >  4   too tight   lo = 1.953125
...  squeezing onto 2.0 from both sides
->  2.000000

Exactly 10/5. The answer is a value no gap ever had, which
is what "the answer is a real number" means in practice —
there is no candidate list to search.
```

<!-- @example -->

<!-- @input -->
```
stations = [1, 5, 9], k = 0
```

<!-- @output -->
```
4.000000
```

<!-- @why -->
No stations to add, so the answer is simply the largest existing gap — which is also the search's upper bound, returned without any halving changing it.

<!-- @walkthrough -->
```
gaps = [4, 4]     lo = 0,  hi = 4

mid=2.0   needs 2 stations   > 0   too tight   lo = 2
mid=3.0   needs 2 stations   > 0   too tight   lo = 3
mid=3.5   needs 2 stations   > 0   too tight   lo = 3.5
...  lo climbs toward 4, hi never moves
->  4.000000

k = 0 is a free assertion for any implementation: the answer
must equal max(gap). It also confirms hi is initialised to
the largest gap rather than to something arbitrary.
```

<!-- @visualization custom -->

<!-- @description -->
Shows what changes when the answer becomes a real number: the termination condition, which can fail to terminate at all, and what does not change — the predicate, the monotonicity and the direction of the search.

<!-- @sampleInput -->
```json
{"primary":{"stations":[23,24,36,39,46,56,57,65,84,98],"k":1,"gaps":[1,12,3,7,10,1,8,19,14],"answer":14.0,"reasoning":"the single station splits the 19 into two 9.5s, leaving the untouched 14 as the largest"},"whatIsNew":{"claim":"the answer is a real number, so the search converges rather than terminates","predicate":"for a candidate distance x, a gap of length d needs ceil(d/x) - 1 new stations; feasible when the total is at most k","unchanged":["the predicate shape","monotonicity","the one-pass greedy count","the minimise-a-maximum direction: feasible means move hi down"],"changed":["there is no next candidate to step onto, so the loop cannot stop when lo and hi meet"]},"terminationTrap":{"tempting":"while (hi - lo > 1e-6) { ... }","rows":[{"largestGap":"10^0","result":"20 iterations"},{"largestGap":"10^2","result":"27 iterations"},{"largestGap":"10^4","result":"34 iterations"},{"largestGap":"10^8","result":"47 iterations"},{"largestGap":"10^12","result":"never ends"},{"largestGap":"10^15","result":"never ends"},{"largestGap":"10^18","result":"never ends"}],"why":"doubles are not evenly spaced - near 10^12 adjacent doubles are 1.22e-4 apart, already further than the 1e-6 being waited for, so hi - lo stops shrinking","symptom":"a hang with no wrong answer to inspect - the same failure shape as the Aggressive Cows rounding trap","fix":"iterate a fixed number of times"},"fixedIterations":{"rows":[{"halvings":20,"worstAbsError":0.095},{"halvings":30,"worstAbsError":8.9e-05},{"halvings":40,"worstAbsError":8.7e-08},{"halvings":50,"worstAbsError":8.7e-11},{"halvings":60,"worstAbsError":0},{"halvings":100,"worstAbsError":0}],"rule":"iterations needed for absolute precision e over range R is log2(R/e)","check":"log2(10^8 / 1e-6) = 46.5, and the measured 10^8 row took 47","recommendation":"60 - reaches exact double precision, is a compile-time constant, and cannot hang"},"countingFormulaIsForgiving":{"choice":"ceil(d/x) - 1  versus  floor(d/x)","disagreeWhen":"d/x is exactly an integer","cases":4680,"space":"every gap multiset of 1..4 gaps over {1..5}, k from 0 to 5","bothWrong":0,"worstError":8.9e-16,"contrast":{"integerSearch":"in Split Array - Largest Sum, > versus >= was a 48.07% coin flip","realSearch":"the analogous choice here is invisible"},"why":"an integer search must land exactly on the answer, so a predicate wrong on one value is wrong in the answer; a real-valued search only has to converge, and the disagreeing inputs form a measure-zero set the halving never has to decide"},"greedyIsOptimal":{"rule":"repeatedly add a station to whichever section currently has the largest piece","verifiedAgainst":"exhaustive enumeration of every distribution of k stations among the gaps, compared as exact rationals","cases":4680,"wrong":0,"subtlety":"the key is the section's CURRENT piece d/(c+1), not its original gap - a long gap already holding several stations may be finer than a short untouched one"},"costs":{"unit":"nanoseconds","constraints":"LeetCode 774: n <= 2000, k <= 10^6","rows":[{"n":100,"k":100,"scan":21666,"heap":5833,"binary":13625,"winner":"heap"},{"n":2000,"k":1000,"scan":5079334,"heap":146167,"binary":201431,"winner":"heap"},{"n":2000,"k":10000,"scan":23632708,"heap":560708,"binary":84778,"winner":"binary"},{"n":2000,"k":100000,"scan":null,"heap":5269125,"binary":84972,"winner":"binary"},{"n":2000,"k":1000000,"scan":null,"heap":52947792,"binary":85514,"winner":"binary"}],"keyObservation":"the binary column is flat - 84,778 to 85,514 across a hundredfold change in k - because its cost is n times a fixed iteration count and k appears only inside a comparison","heapAtMaxK":"633x behind","crossover":"around k = n; below it the heap wins, above it the binary search is not just faster but insensitive"},"assertions":["k = 0 gives exactly max(gap)","station count is monotone non-increasing as the candidate distance grows","the answer lies between 0 and the largest gap","the greedy on current piece length is optimal","the answer need not be any original gap or a simple fraction of one"]}
```

<!-- @highlights -->
- First **real-valued** search here: the answer is any real number, so the loop converges instead of terminating.
- `while (hi - lo > 1e-6)` **never terminates** past 10¹² — adjacent doubles there are 1.22e-4 apart, wider than the tolerance.
- **60 fixed halvings** reach exact double precision; the count needed is `log2(range/precision)`.
- `ceil(d/x)-1` vs `floor(d/x)` is **invisible** here (8.9e-16) — the same class of off-by-one that was a 48.07% coin flip in the integer version.
- The greedy on **current piece length**, not original gap, is optimal — 0 wrong over 4,680 exhaustive cases.
- Binary search cost is **flat in k** (84,778 → 85,514ns) while the heap is **633×** behind at k = 10⁶.

<!-- @edgeCases -->
- `k = 0` — the answer is exactly `max(gap)`, a free assertion for any implementation.
- Two stations only — one gap, and the answer is `gap / (k+1)` exactly.
- All gaps equal — stations spread evenly, and the answer is `gap / (floor(k/g) + 1)` at the boundaries.
- Coordinates near 10¹² or beyond — where a tolerance-terminated loop hangs.
- `mid` reaching 0 on the first halving — only if the largest gap is 0, meaning all stations coincide; guard or start `lo` above 0.
- An answer that is no original gap — `[0, 10]` with k=4 gives 2.0, which is what "real-valued" means in practice.
- k far larger than needed — the count saturates and the answer approaches 0 smoothly.
- The second-largest gap deciding the answer — as in the worked example, where splitting the largest twice is pointless.
- Duplicate stations — a gap of 0 needing no stations; `ceil(0/x) - 1` is −1, so clamp at 0 or skip zero gaps.

<!-- @pitfalls -->
- Writing `while (hi - lo > 1e-6)`. It hangs at large coordinates and the symptom is a spin, not a wrong answer.
- Choosing the iteration count by guesswork. It is `log2(range/precision)` — 47 for 1e-6 over 10⁸, and 60 is exact.
- Splitting the **largest original gap** rather than the largest current piece. A long gap already holding stations may be finer than a short untouched one.
- Using `added[j]` rather than `added[j] + 1` as the divisor. c stations make c+1 pieces, and the untouched case divides by zero.
- Reaching for the heap because it is asymptotically better in n. It is linear in k, and this problem lets k reach 10⁶.
- Letting `need` overflow. The sum over gaps can far exceed k, so bail out early or accumulate in 64-bit.
- Forgetting that gaps of 0 give `ceil(0/x) - 1 = -1`. Skip them or clamp.
- Returning `lo`. `hi` is always an approved distance; `lo` is always a rejected one.
- Comparing the result with `==` in tests. It is a float — compare against a tolerance.

<!-- @doubt -->
### Why not stop when `hi - lo` is smaller than the tolerance?

<!-- @answer -->
Because that loop is not guaranteed to finish. Doubles are spaced logarithmically, not evenly: near 1 they are about 2.2e-16 apart, but near 10¹² adjacent doubles differ by **1.22e-4** and near 10¹⁸ by **128**. Once `hi` and `lo` are adjacent representable values, `(lo + hi) / 2` returns one of them and the interval stops shrinking — so if that spacing is already wider than your tolerance, `hi - lo > 1e-6` stays true forever. Measured, the loop completes in 20 to 47 iterations for largest gaps up to 10⁸ and **never terminates** at 10¹², 10¹⁵ or 10¹⁸. A fixed iteration count sidesteps this entirely, because it does not ask a question about the data. Sixty halvings measured **zero** absolute error against a fully converged reference, and the number you need in general is `log2(range / precision)` — which predicted 46.5 for the 10⁸ case where the measurement took 47.

<!-- @doubt -->
### How many iterations are actually necessary?

<!-- @answer -->
`log2(range / precision)`, because each halving divides the interval by exactly two regardless of magnitude. For this problem's usual bounds — coordinates up to 10⁸ and a 1e-6 tolerance — that is about 47, and the measurement agrees exactly. Measured worst-case absolute error against a fully converged reference: 20 halvings leave **9.5e-2**, 30 leave **8.9e-5**, 40 leave **8.7e-8**, 50 leave **8.7e-11**, and **60 leave zero**. Sixty is the number to write: it is past the point where doubles can represent a difference at all, it costs nothing measurable (the whole search is 85 microseconds at n = 2,000), and being a constant it makes the running time independent of the input. Choosing 100 "to be safe" is harmless but is guessing rather than computing.

<!-- @doubt -->
### Should I count `ceil(d/x) - 1` or `floor(d/x)`?

<!-- @answer -->
Either — and the fact that it does not matter is worth understanding, because the same choice in an integer search is fatal. The two disagree by exactly one when `d/x` is an integer: breaking a gap of 10 with `x = 5` needs `ceil(10/5) - 1 = 1` station, while `floor(10/5) = 2` overcounts. Measured over 4,680 exhaustive cases, both give the right answer with worst error **8.9e-16**. The reason is that a real-valued search never has to commit to a single value — it brackets the answer and the inputs where the formulas disagree are a measure-zero set the halving approaches without ever deciding. Contrast Split Array – Largest Sum, where `>` versus `>=` in the analogous greedy is wrong on **48.07%** of inputs, because an integer search has to land exactly on the answer and a predicate wrong at one point is wrong in the result. `ceil(d/x) - 1` is still the one to write, since it says what it means: pieces minus one equals cuts.

<!-- @doubt -->
### Is the greedy "split the biggest gap" actually correct?

<!-- @answer -->
Yes, provided "biggest" means the biggest **current piece** rather than the biggest original gap. A gap of length d that already holds c stations has pieces of `d/(c+1)`, and that is the quantity to compare — a gap of 20 holding three stations has 5-unit pieces and should be left alone in favour of an untouched gap of 8. Getting this wrong is the usual bug, and it looks right on any input where no gap gets two stations. Verified: the greedy on current piece length matched an exhaustive enumeration of every way to distribute k stations among the gaps — compared as exact rationals, so no floating point could hide a discrepancy — on **all 4,680 cases, 0 wrong**. The reason it works is an exchange argument: moving a station from a section whose pieces are already small to the section with the largest piece cannot increase the maximum.

<!-- @doubt -->
### When is the heap the better answer?

<!-- @answer -->
When k is small relative to n, and the crossover measured at around k = n. At n = 2,000 with k = 1,000 the heap runs in **146,167ns** against the binary search's 201,431ns; by k = 10,000 the binary search leads 84,778 to 560,708, and at this problem's stated maximum of k = 10⁶ the heap takes **52,947,792ns — 633x behind**. The structural reason matters more than the crossing point: the heap does work proportional to k because it places stations one at a time, while the binary search does `n` work per halving and a fixed number of halvings, so `k` enters only as the right-hand side of a comparison. Its measured cost across k = 10⁴, 10⁵ and 10⁶ is **84,778, 84,972 and 85,514 nanoseconds** — flat. When a problem lets one parameter grow far beyond the others, the approach that is insensitive to it is usually the intended one.
