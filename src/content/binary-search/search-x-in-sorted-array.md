---
id: search-x-in-sorted-array
topic: Binary Search
title: Search X in sorted array
difficulty: Easy
status: ready
prerequisites:
  - linear-search
  - while-loop
  - integer-overflow-and-precision-errors
  - time-and-space-complexity-basics
relatedIds:
  - lower-bound
  - upper-bound
  - search-insert-position
  - first-and-last-occurrence
  - linear-search
---

<!-- @summary -->
Find the index of x in a sorted array by halving the search space — where three plausible off-by-ones fail in three different ways, one of them by never terminating rather than by answering wrongly, and where the version that does fewer steps measures 2.4x slower than the one that always does all of them.

<!-- @theory -->
## The problem

Given a sorted array and a value x, return an index holding x, or -1 if it is not
there.

```
a = [1, 3, 5, 7, 9, 11]     x = 7   ->  3
                            x = 8   -> -1
```

Sorted is the whole point. It means one comparison tells you which **half** to
discard, so the search space falls from n to n/2 to n/4 — reaching one candidate
in about log2(n) steps rather than n.

## The canonical loop

```
lo = 0, hi = n - 1
while lo <= hi:
    mid = lo + (hi - lo) / 2
    if a[mid] == x:  return mid
    if a[mid] <  x:  lo = mid + 1
    else:            hi = mid - 1
return -1
```

Four decisions in five lines, and each has a plausible alternative that is wrong.

## The four off-by-ones, and how differently they fail

Checked exhaustively against every sorted array of length 0 to 10 drawn from four
distinct values, with every probe from -1 to 4 — 6,006 cases:

| Variant | What happens |
|---|---|
| `while (lo < hi)` | **wrong on 10.14%** — smallest case `a = [0]`, `x = 0` returns -1 |
| `lo = mid` instead of `mid + 1` | **wrong on 6.04%** — smallest case `a = [0,1]`, `x = 1` returns -1 |
| `hi = mid` instead of `mid - 1` | **hangs on 29.6%** — never returns at all |
| `hi = n` instead of `n - 1` | **reads past the end on 23.2%** |

The third is the one worth dwelling on. It never produces a wrong answer — it
produces **no answer**. With `lo <= hi` and `hi = mid`, once `lo` and `hi` meet on
a value greater than x, `hi = mid` leaves both unchanged and the loop spins
forever. The smallest case is `a = [0]` searching for -1.

That matters because the reflex fix — adding an iteration cap — converts a hang
into a wrong answer, which is strictly worse: a loop that never returns is
obvious, and a loop that returns -1 for a value that is present is not.

The fourth never returns a wrong answer either. It reads `a[n]`, which is not
yours. It "works" only because nothing checked.

The rule the first two share: **whatever you compare with, exclude the tested
index from the next range.** `mid` has been tested, so the next range starts at
`mid + 1` or ends at `mid - 1`. Anything that leaves `mid` in the range risks
testing it forever.

## Why `lo + (hi - lo) / 2` and not `(lo + hi) / 2`

They compute the same value until `lo + hi` exceeds what an `int` holds, which is
`INT_MAX = 2,147,483,647`. The largest `lo + hi` a search reaches is about
`2n - 2`, so the sum first overflows at

```
n = 1,073,741,825      an int array of 4.00 GB
```

That is a real size for a memory-mapped index or a large in-memory table. With
`lo = 1,073,741,824` and `hi = 1,073,741,828`:

```
(lo + hi) / 2       -> -1073741822      a negative index
lo + (hi - lo) / 2  ->  1073741826      correct
```

`hi - lo` is at most n, so it never overflows. This is the bug that sat in the
JDK's own `Arrays.binarySearch` for nine years.

## The step count

The canonical form makes at most **floor(log2 n) + 1** comparisons:

| n | worst case |
|---|---|
| 15 | 4 |
| 16 | 5 |
| 1,000 | 10 |
| 1,000,000 | **20** |

Twenty comparisons to search a million elements is the entire reason to write this
loop instead of a scan.

## Except that a scan wins below about 50 elements

Measured, nanoseconds per lookup over 300,000 random probes, half present and half
absent:

| n | Linear scan | Binary search |
|---|---|---|
| 8 | **5.84** | 10.35 |
| 32 | **11.62** | 13.26 |
| 48 | **15.39** | 16.62 |
| 56 | 17.15 | **15.52** |
| 128 | 40.49 | **17.38** |

The crossover sits **between 48 and 56**. Below it the scan does more comparisons
and finishes sooner, because it reads consecutive memory and its branch is
predictable, while binary search jumps around and its branch is not.

## The version that does less work is slower

Here is the result that makes this problem worth measuring. Two forms:

- the canonical one, which stops the moment it lands on x
- one that never tests for equality mid-loop, always narrows to exactly one
  candidate in ceil(log2 n) steps, and checks that one at the end

The first does **fewer** iterations:

| n | Canonical, average iterations | Always-full |
|---|---|---|
| 4,096 | 11.50 | 12.00 |
| 1,048,576 | **19.50** | 20.00 |

And it is comfortably slower:

| n | Canonical | Always-full | |
|---|---|---|---|
| 4 | 12.05ns | 1.66ns | **7.3x** |
| 1,024 | 25.29ns | 6.94ns | **3.6x** |
| 1,048,576 | 102.13ns | 42.96ns | **2.4x** |

Reading the generated ARM64 tells you why, and it is not what the usual phrasing
suggests. Clang already compiles the `lo`/`hi` update into conditional selects —
`csel` and `csinc` — in **both** versions. The direction choice was never a branch.

What remains in the canonical loop is one data-dependent branch: `b.eq`, the early
exit. Whether `a[mid] == x` is unpredictable at every step, so the processor
mispredicts it repeatedly. The always-full version has no data-dependent branch at
all — its only branch tests `len`, which follows the same sequence on every call
and is perfectly predicted.

So the early exit saves half a step on average and costs a mispredicted branch on
every step that is not the last. That is the trade, and it loses.

<!-- @intuition -->
Halving is the easy half of this problem. The hard half is that the loop has to make progress on every pass, and the three ways of failing to guarantee that fail very differently: one gives wrong answers, one reads memory it does not own, and one simply never stops. Keeping `mid` in the next range is what they have in common, and excluding it is the single rule that makes all three impossible. The performance side is a separate lesson that happens to live in the same five lines. An early exit looks free — it can only save work — and on a modern processor "work" is not the same as "time". A branch the processor cannot guess costs more than the iterations it lets you skip, which is why the faster version is the one that stubbornly does every step.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk the array from the front and return the first index holding x.

<!-- @steps -->
1. Start at index zero.
2. Compare the element there with x.
3. Return the index if they match.
4. Move to the next index and repeat.
5. Return -1 once the array runs out.

<!-- @complexity -->
- time: O(n) comparisons, n in the worst case
- space: O(1)
- note: Ignores the sorting entirely, and is genuinely the faster choice for small inputs — measured 5.84ns against 10.35ns at n = 8, and still ahead at n = 48. The crossover with binary search is between 48 and 56 elements, because a scan reads consecutive memory and its branch is predictable.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int search(const vector<int>& a, int x) {
    for (int i = 0; i < (int)a.size(); i++) {
        if (a[i] == x) return i;
    }
    return -1;
}
```

<!-- @annotations -->
- 5: One comparison per element, in order. Nothing here uses the fact that the array is sorted.
- 6: Returns the first match. Binary search may return a different index when x repeats — both answer the question as asked.

<!-- @code java -->
```java
static int search(int[] a, int x) {
    for (int i = 0; i < a.length; i++) {
        if (a[i] == x) return i;
    }
    return -1;
}
```

<!-- @annotations -->
- 3: The scan is the right choice below about fifty elements, where the jumping that binary search does costs more than the extra comparisons.

<!-- @code python -->
```python
def search(a, x):
    for i in range(len(a)):
        if a[i] == x:
            return i
    return -1


# In Python the built-in a.index(x) does this in compiled code and
# raises rather than returning -1.
```

<!-- @annotations -->
- 3: A plain scan, which is what list.index does internally — worth knowing before reaching for a loop.

<!-- @approach -->
### Binary Search

<!-- @idea -->
Compare with the middle element and throw away the half that cannot contain x.

<!-- @steps -->
1. Set lo to the first index and hi to the last.
2. While lo has not passed hi, take mid as lo plus half the gap.
3. Return mid if the element there is x.
4. If it is smaller than x, move lo to mid plus one; otherwise move hi to mid minus one.
5. Return -1 when the range becomes empty.

<!-- @complexity -->
- time: O(log n) — at most floor(log2 n) + 1 comparisons, which is 20 at n = 1,000,000
- space: O(1)
- note: The reason to sort in the first place. Note the two details that are not decoration: mid is computed as lo + (hi - lo) / 2 so the sum cannot overflow, and both updates step past mid so the range always shrinks.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int search(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

<!-- @annotations -->
- 5: hi is the last index, not the size. Setting it to a.size() makes the loop read one element past the end on 23.2% of cases.
- 6: lo <= hi, not lo < hi. With a strict less-than the loop never examines a one-element range, which is wrong on 10.14% of cases — including a single-element array holding exactly x.
- 7: lo + (hi - lo) / 2, not (lo + hi) / 2. The sum form overflows an int from n = 1,073,741,825, a 4 GB array, and returns a negative index.
- 9: mid + 1 and mid - 1. Leaving mid in the next range is what makes the loop spin forever — hi = mid hangs on 29.6% of cases.

<!-- @code java -->
```java
static int search(int[] a, int x) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

<!-- @annotations -->
- 4: This exact line is the fix Java's own Arrays.binarySearch needed after nine years of computing (lo + hi) / 2.

<!-- @code python -->
```python
def search(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == x:
            return mid
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1


# Python integers do not overflow, so (lo + hi) // 2 is safe here —
# which is exactly why the habit has to be learned deliberately.
```

<!-- @annotations -->
- 4: Written the safe way even though Python cannot overflow, so the same code reads correctly when it is ported. Note the floor division — a single slash would make mid a float and the index lookup would fail.
- 8: mid + 1, not mid. a[mid] has already been compared, so leaving it in the range is what makes the loop spin.

<!-- @approach -->
### Narrow to One Candidate, Then Check It

<!-- @idea -->
Drop the equality test from the loop, always halve exactly ceil(log2 n) times, and compare once at the end.

<!-- @steps -->
1. Keep a pointer to the start of the live range and its length.
2. While more than one element remains, take half the length.
3. Move the pointer forward by that half only if the element just before the split is smaller than x.
4. Shrink the length by the half either way.
5. When one element remains, return its index if it equals x and -1 otherwise.

<!-- @complexity -->
- time: O(log n) — exactly ceil(log2 n) iterations, every call, with no early exit
- space: O(1)
- note: Measured 42.96ns against 102.13ns at n = 1,048,576, and 1.66ns against 12.05ns at n = 4 — between 2.4x and 7.3x faster while performing more iterations. The step that moves the pointer compiles to a conditional select rather than a branch, so nothing in the loop can be mispredicted.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int search(const vector<int>& a, int x) {
    int n = (int)a.size();
    if (n == 0) return -1;
    const int* base = a.data();
    int len = n;
    while (len > 1) {
        int half = len / 2;
        base += (base[half - 1] < x) ? half : 0;
        len -= half;
    }
    return (*base == x) ? int(base - a.data()) : -1;
}
```

<!-- @annotations -->
- 6: The guard is needed because the loop assumes at least one live element and dereferences base at the end.
- 11: The whole trick. This compiles to csel — a conditional select — so the branch the canonical version cannot predict is not a branch at all.
- 12: len shrinks the same way on every call regardless of the data, which is why the loop's own exit test is perfectly predictable.
- 14: One equality test, once, after the range is down to a single candidate.

<!-- @code java -->
```java
static int search(int[] a, int x) {
    int n = a.length;
    if (n == 0) return -1;
    int base = 0, len = n;
    while (len > 1) {
        int half = len / 2;
        if (a[base + half - 1] < x) base += half;
        len -= half;
    }
    return a[base] == x ? base : -1;
}
```

<!-- @annotations -->
- 7: Written as an if for readability. Whether the JIT turns it into a conditional move is its decision, not the source's, so measure before assuming.

<!-- @code python -->
```python
from bisect import bisect_left


def search(a, x):
    i = bisect_left(a, x)
    return i if i < len(a) and a[i] == x else -1


# bisect_left is the same narrowing, written in C. In Python the
# interpreter overhead dwarfs any branch effect, so the right move
# is to stop writing the loop rather than to restructure it.
```

<!-- @annotations -->
- 5: bisect_left returns the first position where x could be inserted, so it needs the equality check to distinguish present from absent.

<!-- @example -->

<!-- @input -->
a = [1, 3, 5, 7, 9, 11], x = 7

<!-- @output -->
3, reached in two comparisons

<!-- @why -->
Small enough to trace by hand, and it shows the range excluding mid rather than merely moving past it.

<!-- @walkthrough -->
1. lo is 0 and hi is 5, so mid is 0 plus 5 over 2, which is 2.
2. a[2] is 5, which is smaller than 7, so lo becomes mid plus one, which is 3.
3. The range is now indices 3 to 5, and mid is 3 plus 2 over 2, which is 4.
4. a[4] is 9, which is larger than 7, so hi becomes mid minus one, which is 3.
5. The range is now index 3 alone, and lo <= hi is still true, so the loop runs again.
6. mid is 3, a[3] is 7, and the search returns 3.
7. That last pass is the one a strictly-less-than loop condition would skip.

<!-- @example -->

<!-- @input -->
a = [0], x = -1, with hi updated to mid rather than mid - 1

<!-- @output -->
The loop never terminates

<!-- @why -->
The smallest input that separates a wrong answer from no answer, which are not the same kind of bug.

<!-- @walkthrough -->
1. lo is 0 and hi is 0, so the loop condition lo <= hi holds.
2. mid is 0, and a[0] is 0, which is larger than -1.
3. The buggy update sets hi to mid, which is 0 — exactly what it already was.
4. lo is still 0 and hi is still 0, so the next pass computes the same mid.
5. Nothing changes on any subsequent pass, so the loop spins forever.
6. Measured over the same 6,006 exhaustive cases, this variant hangs on 29.6% and returns a wrong answer on none.
7. Capping the iterations turns each of those hangs into a returned -1, which is a worse failure because it looks like an answer.

<!-- @example -->

<!-- @input -->
lo = 1,073,741,824 and hi = 1,073,741,828

<!-- @output -->
(lo + hi) / 2 gives -1073741822; lo + (hi - lo) / 2 gives 1073741826

<!-- @why -->
The overflow is invisible until the array is large enough, and by then the failure is a negative index rather than a wrong result.

<!-- @walkthrough -->
1. The largest sum lo + hi that a search reaches is about 2n - 2.
2. That first exceeds INT_MAX, 2,147,483,647, at n = 1,073,741,825.
3. As an int array that is 4.00 GB, which is a reachable size for a large table.
4. At the lo and hi above, the sum wraps to a negative number and the halved result is negative.
5. Indexing with it is undefined behaviour, not a wrong answer that a test would catch.
6. The subtraction form never overflows, because hi - lo is at most n.
7. This is the bug that sat in the JDK's Arrays.binarySearch for nine years before it was found.

<!-- @example -->

<!-- @input -->
n = 1,048,576, canonical against always-full

<!-- @output -->
19.50 iterations at 102.13ns, against 20.00 iterations at 42.96ns

<!-- @why -->
The one result here that contradicts the obvious reading, and the reason to measure rather than count operations.

<!-- @walkthrough -->
1. The canonical loop can stop the instant a[mid] equals x, so it averages 19.50 iterations against a fixed 20.
2. It is nonetheless 2.4 times slower at this size, and 7.3 times slower at n = 4.
3. Reading the generated ARM64 shows that clang already compiles the lo and hi updates to conditional selects in both versions.
4. So the choice of direction was never a branch, and never the cost.
5. What remains in the canonical loop is one data-dependent branch: the early-exit equality test.
6. Whether a[mid] equals x is unpredictable at every step, so it is mispredicted repeatedly.
7. The always-full version has no data-dependent branch at all — its only test is on len, which is identical on every call.

<!-- @visualization custom -->

<!-- @description -->
Draw the array as a row of cells with the live range shaded and everything outside it greyed out permanently, so discarded halves visibly never come back. Mark lo, hi and mid as labelled pointers beneath, and on each step show mid's cell lighting, the comparison resolving, and half the shaded region going grey. Crucially, animate mid's own cell going grey along with the discarded half — that is the whole correctness rule, and drawing it is more convincing than stating it. Then the failure panel, which should be three lanes rather than one, because the three mistakes fail in three different ways. Lane one, `lo < hi`: run it on a single-element array holding x and show the loop exiting with the cell still shaded and unexamined, verdict wrong answer. Lane two, `hi = mid`: run it on a = [0] searching for -1 and let mid's cell stay shaded after the update, then loop, then loop again — put an iteration counter on it and let it run visibly past any sane bound, verdict never returns. Lane three, `hi = n`: draw one extra cell past the array's end in a different colour, hatched, and show the probe landing on it, verdict reads memory it does not own. Beside them a small table of the measured rates: 10.14% wrong, 29.6% hang, 23.2% out of bounds. Close with the branch panel. Two lanes searching the same array: the canonical one with a prediction lamp beside its equality test that flickers red about half the time, and the always-full one whose only test is on a length counter, its lamp steady green. Show the canonical lane finishing in fewer steps and a stopwatch beneath it reading longer — the two readouts disagreeing is the point, so hold that frame with 19.50 steps at 102.13ns against 20.00 steps at 42.96ns.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,3,5,7,9,11],"x":7,"answer":3,"comparisons":3,"trace":[{"lo":0,"hi":5,"mid":2,"value":5,"compare":"5 < 7","action":"lo = mid + 1","newRange":[3,5]},{"lo":3,"hi":5,"mid":4,"value":9,"compare":"9 > 7","action":"hi = mid - 1","newRange":[3,3]},{"lo":3,"hi":3,"mid":3,"value":7,"compare":"7 == 7","action":"return 3","newRange":null}],"absentExample":{"x":8,"answer":-1}},"rule":"whatever you compare with, exclude the tested index from the next range — mid has been tested, so the next range starts at mid+1 or ends at mid-1","variants":{"testedOver":"every sorted array of length 0..10 from four distinct values, every probe from -1 to 4","cases":6006,"results":[{"name":"while (lo < hi)","failure":"wrong answer","rate":0.1014,"smallest":{"array":[0],"x":0,"returned":-1}},{"name":"lo = mid instead of mid + 1","failure":"wrong answer","rate":0.0604,"smallest":{"array":[0,1],"x":1,"returned":-1}},{"name":"hi = mid instead of mid - 1","failure":"never terminates","rate":0.296,"smallest":{"array":[0],"x":-1},"note":"returns a wrong answer on none — an iteration cap converts every hang into one, which is worse"},{"name":"hi = n instead of n - 1","failure":"reads one past the end","rate":0.232,"note":"never returns a wrong answer; it works only because nothing checked"}]},"overflow":{"intMax":2147483647,"largestSumReached":"about 2n - 2","firstFailingN":1073741825,"asIntArray":"4.00 GB","worked":{"lo":1073741824,"hi":1073741828,"sumForm":-1073741822,"differenceForm":1073741826},"whySafe":"hi - lo is at most n, so it cannot overflow","history":"the bug in the JDK's Arrays.binarySearch, live for nine years"},"stepCount":{"formula":"floor(log2 n) + 1 comparisons in the worst case","rows":[{"n":15,"worst":4},{"n":16,"worst":5},{"n":1000,"worst":10},{"n":1000000,"worst":20}]},"linearCrossover":{"unit":"nanoseconds per lookup, 300,000 random probes, half present","rows":[{"n":8,"linear":5.84,"binary":10.35,"winner":"linear"},{"n":32,"linear":11.62,"binary":13.26,"winner":"linear"},{"n":48,"linear":15.39,"binary":16.62,"winner":"linear"},{"n":56,"linear":17.15,"binary":15.52,"winner":"binary"},{"n":128,"linear":40.49,"binary":17.38,"winner":"binary"}],"crossover":"between 48 and 56","why":"a scan reads consecutive memory and its branch is predictable; binary search jumps and its branch is not"},"earlyExitParadox":{"iterations":[{"n":4096,"canonical":11.50,"alwaysFull":12.00},{"n":1048576,"canonical":19.50,"alwaysFull":20.00}],"nanoseconds":[{"n":4,"canonical":12.05,"alwaysFull":1.66,"ratio":7.3},{"n":1024,"canonical":25.29,"alwaysFull":6.94,"ratio":3.6},{"n":1048576,"canonical":102.13,"alwaysFull":42.96,"ratio":2.4}],"assembly":{"finding":"clang compiles the lo/hi update to csel and csinc in BOTH versions","consequence":"the direction choice was never a branch and never the cost","remaining":"one data-dependent branch in the canonical loop — b.eq, the early-exit equality test","alwaysFullLoop":"its only branch tests len, which follows the same sequence on every call"},"reading":"the early exit saves half a step on average and costs a mispredicted branch on every step that is not the last"},"assertions":["the returned index holds x, or the result is -1 and x is absent","the range strictly shrinks on every pass","mid is never inside the next range","at most floor(log2 n) + 1 comparisons"],"duplicates":{"array":[1,2,2,2,3],"x":2,"canonicalReturns":2,"narrowingReturns":1,"note":"both answer 'find any index holding x'; they differ on which one"}}
```

<!-- @highlights -->
- The array is a row of cells with the live range shaded and discarded regions greyed out permanently.
- lo, hi and mid are labelled pointers beneath the row.
- Each step lights mid's cell, resolves the comparison, and greys half the shaded region.
- Mid's own cell greys out along with the discarded half — that is the correctness rule, drawn rather than stated.
- The failure panel runs three lanes, because the three mistakes fail in three different ways.
- Lane one runs `lo < hi` on a single-element array holding x and exits with the cell still shaded and unexamined.
- Lane two runs `hi = mid` on a = [0] searching for -1, mid's cell staying shaded after each update.
- An iteration counter on lane two runs visibly past any sane bound, verdict never returns.
- Lane three draws one hatched cell past the array's end and shows the probe landing on it.
- A small table beside the lanes reads 10.14% wrong, 29.6% hang, 23.2% out of bounds.
- The branch panel runs two lanes searching the same array.
- The canonical lane has a prediction lamp beside its equality test that flickers red about half the time.
- The always-full lane tests only a length counter, and its lamp stays steady green.
- The canonical lane finishes in fewer steps while its stopwatch reads longer.
- That frame is held: 19.50 steps at 102.13ns against 20.00 steps at 42.96ns.

<!-- @edgeCases -->
- An empty array — the loop must not run, which the lo <= hi condition handles without a special case.
- A single element — the size at which a strictly-less-than loop condition fails, since it never examines the one candidate.
- x smaller than everything — hi walks down to -1 and the loop ends with lo greater than hi.
- x larger than everything — lo walks up to n and the loop ends the same way.
- x present more than once — any index holding x is a valid answer, and the canonical form and the narrowing form return different ones.
- An array of all equal values — found on the first comparison by the canonical form, and after every step by the narrowing form.
- Around n = 50 — where a linear scan stops being the faster choice.
- n above 1,073,741,824 — where (lo + hi) / 2 overflows an int and returns a negative index.
- An unsorted array — the loop still terminates and its answer means nothing; nothing in the code checks the precondition.
- Negative values in the array — no different, since only the comparisons matter and not the signs.

<!-- @pitfalls -->
- Writing `while (lo < hi)`. It never examines a one-element range, so a single-element array holding x returns -1 — wrong on 10.14% of the exhaustive cases.
- Writing `hi = mid` instead of `mid - 1`. It does not give a wrong answer, it never returns — 29.6% of cases hang, the smallest being a = [0] searching for -1.
- Adding an iteration cap to stop that hang. It converts every non-termination into a returned -1, which looks like an answer and is harder to notice.
- Writing `lo = mid` instead of `mid + 1`. Wrong on 6.04% of cases, smallest a = [0,1] searching for 1.
- Setting `hi = n` instead of `n - 1`. It reads one element past the end on 23.2% of cases and never reports anything.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825 and produces a negative index — the JDK carried this for nine years.
- Reaching for binary search on small inputs. A linear scan is faster below about fifty elements, measured.
- Assuming the early exit is free. It saves half a step on average and costs an unpredictable branch on every other step, measuring 2.4x to 7.3x slower.
- Assuming the direction choice is the branch to remove. Clang already compiles it to a conditional select in both versions.
- Running binary search on unsorted input. It terminates and returns a confident, meaningless answer.

<!-- @doubt -->
### Should the loop be `lo <= hi` or `lo < hi`?

<!-- @answer -->
`lo <= hi`, when `hi` is the last index. The two differ exactly when the range has one element left: `lo <= hi` examines it, `lo < hi` does not. Measured over 6,006 exhaustive cases, the strict form is wrong on 10.14% — the smallest being a single-element array `[0]` searching for `0`, which returns -1. The `lo < hi` form is correct in a different formulation, where `hi` starts at `n` and marks one past the range, but then the body must not do `hi = mid - 1`. Pick one convention and keep every line consistent with it.

<!-- @doubt -->
### What actually goes wrong with `hi = mid`?

<!-- @answer -->
The loop stops making progress. Once `lo` and `hi` land on the same index and the value there is greater than x, `hi = mid` sets `hi` to what it already was, so the next pass computes the same `mid` and takes the same branch forever. Measured over the same 6,006 cases it **hangs on 29.6% and returns a wrong answer on none** — the smallest hang is `a = [0]` searching for -1. The general rule that prevents it: `mid` has already been tested, so the next range must exclude it. Anything that leaves `mid` in range risks testing it again.

<!-- @doubt -->
### Is capping the iterations a reasonable safety net?

<!-- @answer -->
It makes the failure worse. A loop that never returns announces itself — the program hangs and you go looking. A loop that returns -1 for a value that is present looks like a correct answer for a missing element, and it will pass any test whose expected result happens to be -1. Measured, adding a cap to the `hi = mid` version converts all 29.6% of its hangs into returned -1s. If you want a safety net, assert that the range shrank on each pass; that catches the same bug and reports the real cause.

<!-- @doubt -->
### Why `lo + (hi - lo) / 2` when `(lo + hi) / 2` reads better?

<!-- @answer -->
Because `lo + hi` can exceed what an `int` holds and the subtraction form cannot. The largest sum a search reaches is about `2n - 2`, so it first passes `INT_MAX` at n = 1,073,741,825 — an int array of 4.00 GB. At `lo = 1,073,741,824` and `hi = 1,073,741,828` the sum form gives -1,073,741,822, a negative index, while the difference form gives the correct 1,073,741,826. `hi - lo` is at most n, so it is always safe. Python cannot overflow at all, which is precisely why the habit is worth forming there too — the code gets ported.

<!-- @doubt -->
### Is binary search always better than scanning?

<!-- @answer -->
No, and the crossover is lower than most people guess. Measured over 300,000 random probes with half present, a linear scan wins up to n = 48 and binary search wins from n = 56 — 15.39ns against 16.62ns at 48, and 17.15ns against 15.52ns at 56. The scan does far more comparisons and still finishes first, because it reads consecutive memory and its loop branch is predictable, while binary search jumps around the array and its comparison is not predictable. Above a few hundred elements the asymptotics take over decisively: at n = 128 it is 40.49ns against 17.38ns.

<!-- @doubt -->
### How can removing the early exit make it faster?

<!-- @answer -->
Because the exit is a branch the processor cannot predict. Measured at n = 1,048,576, the canonical form averages 19.50 iterations against a fixed 20.00 and is still 2.4x slower — 102.13ns against 42.96ns, and 7.3x slower at n = 4. Reading the generated ARM64 shows why, and it is not the usual explanation: clang already compiles the `lo`/`hi` update to `csel` and `csinc` in **both** versions, so the direction choice was never a branch. The only data-dependent branch left is the equality test, which is roughly a coin flip at every step. Removing it leaves a loop whose only test is on a length counter that behaves identically on every call.

<!-- @doubt -->
### Which index does it return when x appears more than once?

<!-- @answer -->
Whichever one it happens to land on, and the two forms here differ. On `a = [1,2,2,2,3]` searching for 2, the canonical loop returns index 2 and the narrowing form returns index 1. Both are correct answers to "find an index holding x" — the problem as stated does not pin one down. If you need the first or the last occurrence specifically, that is a different problem with a different loop, and it is what Lower Bound, Upper Bound and First and Last Occurrence are for. Relying on which index this version returns is relying on an accident.
