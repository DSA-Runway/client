---
id: subsets-ii
topic: Advanced Recursion
title: Subsets II
difficulty: Medium
status: ready
prerequisites:
  - subsets-i
  - combination-sum-ii
  - power-set
  - learn-all-patterns-of-subsequences-theory
  - time-and-space-complexity-basics
relatedIds:
  - subsets-i
  - combination-sum-ii
  - power-set
  - learn-all-patterns-of-subsequences-theory
---

<!-- @summary -->
Subsets I with duplicates in the input, and the fix is Combination Sum II's line moved across unchanged with the target deleted — which is the point, since it shows the duplicate rule belongs to the input rather than the target. The count stops being 2^n and becomes the exact product of (count + 1) over distinct values, and the skip-line tree visits exactly one node per distinct subset. Correcting a claim made in Subsets I: unranking does **not** break here. It survives with subtree sizes read from that product instead of 2^(n-1-i), verified position-for-position against the generator on 400 random multisets, and the counting form survives too as counting in mixed radix.

<!-- @theory -->
## The problem

Every **distinct** subset of a multiset.

```
a = [1, 2, 2]  ->  []  [1]  [1,2]  [1,2,2]  [2]  [2,2]
```

Six, not eight. The two 2s sit at different positions, so `[1,2]` is reachable
two ways and must appear once.

## The line transfers verbatim

Combination Sum II solved exactly this, and the fix moves across with nothing
changed but the deletion of the target:

```
sort(a);
...
for (int i = start; i < n; i++) {
    if (i > start && a[i] == a[i-1]) continue;    // <- identical
    ...
}
```

That transfer is worth pausing on. The rule refuses a value that equals its
neighbour *within the same loop*, and the reason it works has nothing to do with
sums — it is about index paths reaching the same multiset. So it applies
wherever a multiset is being built from positions, whether or not anything is
being summed. Combination Sum II's `i > start` versus `i > 0` analysis carries
over unchanged too, and so does the fact that the sort is a correctness
precondition rather than tuning, since `a[i] == a[i-1]` only sees adjacent
duplicates.

## The count stops being 2^n

With distinct elements there are 2^n subsets. With duplicates the count is the
product over distinct values of one more than each multiplicity:

```
distinct subsets  =  PRODUCT over values v of (count(v) + 1)
```

because a subset is determined by *how many* copies of each value it takes,
from zero up to the multiplicity. Verified exactly:

| a | 2^n | distinct | ∏(c+1) |
|---|---|---|---|
| [1,2,2] | 8 | 6 | 6 |
| [1,1,1,1] | 16 | 5 | 5 |
| [1,2,2,3,3,3] | 64 | 24 | 24 |
| [1,1,2,2,3,3,4,4] | 256 | 81 | 81 |
| ten 2s | 1,024 | 11 | 11 |

That last row is the shape of the whole problem: ten identical elements have
1,024 subsets *by position* and eleven distinct ones.

## The tree is exactly the answer

The skip-line recursion visits **exactly one node per distinct subset** — not
approximately, at every input tested:

| k copies of each of m values | n | distinct | skip-line nodes |
|---|---|---|---|
| 2 × 6 | 12 | 729 | 729 |
| 3 × 6 | 18 | 4,096 | 4,096 |
| 4 × 6 | 24 | 15,625 | 15,625 |
| 8 × 3 | 24 | 729 | 729 |

That is 1.000 nodes per result, the floor, and the same figure Power Set's loop
form and Subsets I both reach. Adding duplicate handling cost nothing in tree
size — the skip line does not prune a subtree that would have produced
something, it refuses one that would have produced a repeat.

## What deduplicating afterwards costs now

Combination Sum II measured the alternative — generate as if positions were
distinct, then filter — and found the gap unbounded. Without a target to prune
against, it is worse, because the generated tree is the full 2^n every time:

| k × m | n | distinct | skip nodes | dedupe nodes | ratio |
|---|---|---|---|---|---|
| 1 × 6 | 6 | 64 | 64 | 64 | **1.0x** |
| 2 × 6 | 12 | 729 | 729 | 4,096 | 5.6x |
| 3 × 6 | 18 | 4,096 | 4,096 | 262,144 | 64.0x |
| 4 × 6 | 24 | 15,625 | 15,625 | 16,777,216 | 1,073.7x |
| 8 × 3 | 24 | 729 | 729 | 16,777,216 | **23,014.0x** |

The dedupe column is exactly 2^n in every row, because that version has no idea
duplicates exist. The skip column is exactly the answer size. At k = 1 they
coincide — the honest control, where the skip line never fires. Measured in
Python at n = 18: 0.81ms against 44.29ms, **54.5x**.

The extreme case makes it plain. Twenty-four identical elements: 16,777,216
subsets by position, **25** distinct, and the skip-line recursion visits 25
nodes.

## What else survives duplicates

Subsets I ended by saying that of its four approaches only the loop form
survives here, and that unranking breaks. **That was wrong**, and worth
correcting rather than quietly dropping. What actually happens:

- **The loop form** carries over with the skip line, as claimed.
- **Counting order** does not survive as *binary* counting — masks over 2^n
  positions produce repeats. But it generalises: count in **mixed radix**, with
  digit j ranging 0 to count(v_j), and every distinct subset appears exactly
  once. Verified on 400 random multisets. It enumerates in a different order
  than the generator, which is the real caveat, not correctness.
- **Unranking** survives. The subtree sizes are no longer 2^(n-1-i), which is
  the part Subsets I got right — but they are ∏(count + 1) over the remaining
  suffix, which is just as computable, in O(n).
- **Gray code** is the one that genuinely needs a different construction, since
  binary reflected Gray code is defined over binary words.

So three of the four carry over, two of them by replacing base 2 with mixed
radix. The correct summary is not that duplicates break everything except the
loop form; it is that duplicates replace powers of two with a product, and every
approach that was really about that product keeps working.

## Unranking, two ways

**Mixed radix** is the direct generalisation of Subsets I's counting-order
unrank. Treat k as a number whose digit j has base count(v_j) + 1; digit j says
how many copies of v_j to take. O(number of distinct values), no table.

**Lexicographic** matches the generator position-for-position, and needs one
suffix table:

```
suffix[j] = number of distinct subsets of a[j:]
          = (r - j + 1) * suffix[r]     where r ends a[j]'s run
```

which is O(n) to build. Then walk exactly as Subsets I did, subtracting
`suffix[i+1]` instead of `2^(n-1-i)`. Verified against the generator on 400
random multisets and 13,137 (input, k) pairs, and the O(n) table checked against
a direct O(n²) recount on 3,000 more.

Measured at n = 30 with 1,048,576 distinct subsets: **66.7ns** per unrank
against 34.88ms to generate the list and index it — about **523,000x**.

## Four shapes measured

C++, 3 copies of each of 1..10 (n = 30), 1,048,576 distinct, min of 7 with each
form measured twice in opposite order:

| form | time | vs skip-line | nodes |
|---|---|---|---|
| skip equal at same level | 34.88ms | 1.00x | 1,048,576 |
| frequency recursion | 34.75ms | 1.00x | 1,398,101 |
| mixed-radix counting | 182.65ms | 5.23x | — |
| unrank one subset | 66.7ns | — | — |

The frequency form's node count is exactly 4/3 of the skip line's here — it
spends a node on every prefix of the (value, count) list including the
take-nothing branches, which is ∑ 4^j against 4^10. The two measure identical
anyway. Mixed-radix counting pays the same ~5x the mask forms paid in Subsets I,
and for the same reason: it rebuilds each subset from its digits instead of
extending a buffer.

Python at n = 24, 65,536 distinct: 13.15ms, 17.96ms (1.37x) and 65.36ms (4.97x).
The frequency form separates there — its extra nodes are call frames, which is
the split this series has measured since Power Set.

## The arc

| recursion | nodes / result | dead ends |
|---|---|---|
| power set, loop form | 1.000 | 0% |
| subsets I | 1.000 | 0% |
| **subsets II** | **1.000** | **0%** |
| no adjacent 1s | 2.618 = phi^2 | 0% |
| parentheses (n = 12) | 4.968 | 0% |
| combination sum | 37.13 | 80.7% |
| combination sum II | 6.91 | 67.6% |

Back to the floor. The two combination-sum entries are the outliers because a
target cannot be checked completely in O(1); a duplicate can.

## Where this goes next

**Combination Sum III** puts the target back and adds a fixed combination size,
which is a second guard — and unlike the target's, it *is* complete and cheap,
since the number of elements chosen so far is exact and monotone. That contrast
is the point of doing it after these two. **Word Break** then leaves the subset
family entirely for a recursion over string splits, where the branching factor
is the number of prefixes matching a dictionary rather than a fixed two.

<!-- @intuition -->
This is Subsets I with a multiset for input, and the repair is Combination Sum II's line moved across with the target deleted — which is the fact worth carrying away, because it shows the duplicate rule was never about sums. It is about index paths reaching the same multiset, so it applies wherever a multiset is being built from positions. What genuinely changes is the arithmetic: the answer size stops being 2^n and becomes the product over distinct values of one more than each multiplicity, since a subset is determined by how many copies of each value it takes. That single substitution is what carries the rest of Subsets I across. Counting order works if you count in mixed radix rather than binary; unranking works if the subtree sizes come from that product rather than from powers of two. Both are verified here, which corrects the claim Subsets I made that only the loop form survives.

<!-- @approach -->
### Skip Equal Values at the Same Level

<!-- @idea -->
Sort, then refuse any value equal to the one immediately before it within the same loop, so each distinct value is chosen once per level.

<!-- @steps -->
1. Sort the input so that equal values sit next to each other.
2. Record the buffer on entry, before any recursion — this is the emit, and it is unconditional.
3. Loop i from the start index to the last element.
4. Skip i when it is past the start of this loop and a[i] equals a[i-1]; the first copy at a level is always taken.
5. Otherwise take a[i], recurse with start = i + 1, and undo.

<!-- @complexity -->
- time: proportional to the answer, which is ∏(count + 1) rather than 2^n
- space: O(n) buffer and stack, plus the output
- note: Visits exactly one node per distinct subset — 729, 4,096 and 15,625 nodes for answers of exactly those sizes — so 1.000 nodes per result, the floor that Power Set's loop form and Subsets I also reach. Measured 34.88ms at n = 30 with 1,048,576 distinct subsets in C++, and 13.15ms at n = 24 in Python. Identical to the deduplicating version when the input has no duplicates, and 23,014x cheaper in nodes at eight copies of each of three values.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void collect(const vector<int>& a, int start, vector<int>& cur,
             vector<vector<int>>& out) {
    out.push_back(cur);
    for (int i = start; i < (int)a.size(); i++) {
        if (i > start && a[i] == a[i - 1]) continue;
        cur.push_back(a[i]);
        collect(a, i + 1, cur, out);
        cur.pop_back();
    }
}

vector<vector<int>> subsetsWithDup(vector<int> a) {
    sort(a.begin(), a.end());
    vector<vector<int>> out;
    vector<int> cur;
    collect(a, 0, cur, out);
    return out;
}
```

<!-- @annotations -->
- 7: Emitted on entry with no condition, exactly as in Subsets I — there is no target here, so every node is an answer and the recursion has no base case beyond the loop running out.
- 9: Combination Sum II's line, character for character. i > start confines the rule to one level: the first copy sits at i == start and must be taken, while taking a value equal to the one taken a level above is not a repeat and stays allowed. Writing i > 0 instead loses [2,2] from [2,2] entirely.
- 17: Taking a by value keeps the sort out of the caller's array. The sort itself is not optional — a[i] == a[i-1] only detects duplicates that are adjacent.

<!-- @code java -->
```java
static List<List<Integer>> subsetsWithDup(int[] a) {
    int[] s = a.clone();
    Arrays.sort(s);
    List<List<Integer>> out = new ArrayList<>();
    collect(s, 0, new ArrayList<>(), out);
    return out;
}

static void collect(int[] a, int start, List<Integer> cur,
                    List<List<Integer>> out) {
    out.add(new ArrayList<>(cur));
    for (int i = start; i < a.length; i++) {
        if (i > start && a[i] == a[i - 1]) continue;
        cur.add(a[i]);
        collect(a, i + 1, cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 2: a.clone() before sorting, since Arrays.sort works in place and would otherwise reorder the caller's array as a side effect.
- 13: The same condition. Note it compares a[i] against a[i-1] rather than against anything in cur, which is why it needs no knowledge of what has been taken.

<!-- @code python -->
```python
def subsets_with_dup(a):
    a = sorted(a)
    out, cur = [], []

    def go(start):
        out.append(cur[:])
        for i in range(start, len(a)):
            if i > start and a[i] == a[i - 1]:
                continue
            cur.append(a[i])
            go(i + 1)
            cur.pop()

    go(0)
    return out


# 13.15ms at n = 24 with 65,536 distinct subsets, against 65.36ms for
# mixed-radix counting. Visits exactly one node per distinct subset.
```

<!-- @annotations -->
- 2: sorted(a) returns a new list rather than reordering the caller's, and the sort is a correctness requirement here, not a tuning choice.
- 8: The transferred line. Everything above and below it is Subsets I unchanged.

<!-- @approach -->
### Generate Everything, Deduplicate

<!-- @idea -->
Treat equal values at different positions as distinct, generate all 2^n subsets, then keep the distinct ones.

<!-- @steps -->
1. Sort the input and run the ordinary Subsets I recursion, which knows nothing about duplicates.
2. Emit on entry at every node, producing 2^n results.
3. Collect them in a hashable form, since the same multiset will appear more than once.
4. Filter to the distinct ones, preserving first-seen order.
5. Return those.

<!-- @complexity -->
- time: Θ(n · 2^n) always, with no relation to the answer size
- space: 2^n results before filtering
- note: Walks exactly 2^n nodes whatever the input, because nothing in it knows duplicates exist. Against the skip line that is 1.0x with no duplicates, 64.0x at three copies of each of six values, and 23,014.0x at eight copies of each of three. Measured in Python at n = 18: 44.29ms against 0.81ms, 54.5x. The worst case is stark — twenty-four identical elements give 16,777,216 nodes here and 25 there.

<!-- @code cpp -->
```cpp
void collect(const vector<int>& a, int start, vector<int>& cur,
             vector<vector<int>>& out) {
    out.push_back(cur);
    for (int i = start; i < (int)a.size(); i++) {
        cur.push_back(a[i]);
        collect(a, i + 1, cur, out);
        cur.pop_back();
    }
}

vector<vector<int>> subsetsWithDup(vector<int> a) {
    sort(a.begin(), a.end());
    vector<vector<int>> raw;
    vector<int> cur;
    collect(a, 0, cur, raw);
    set<vector<int>> unique(raw.begin(), raw.end());
    return vector<vector<int>>(unique.begin(), unique.end());
}
```

<!-- @annotations -->
- 3: No skip line, so this is Subsets I exactly — which is why it produces 2^n results regardless of how many are distinct.
- 16: The sort is still needed, but only so that equal values land adjacent inside each subset and the set comparison sees identical vectors. It is doing a different job than in the skip version.
- 17: Filtering after the whole tree has been walked. Every repeat was built in full before being discarded, which is why the cost tracks 2^n and not the answer.

<!-- @code java -->
```java
static List<List<Integer>> subsetsWithDup(int[] a) {
    int[] s = a.clone();
    Arrays.sort(s);
    List<List<Integer>> raw = new ArrayList<>();
    collect(s, 0, new ArrayList<>(), raw);
    return new ArrayList<>(new LinkedHashSet<>(raw));
}

static void collect(int[] a, int start, List<Integer> cur,
                    List<List<Integer>> out) {
    out.add(new ArrayList<>(cur));
    for (int i = start; i < a.length; i++) {
        cur.add(a[i]);
        collect(a, i + 1, cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 6: LinkedHashSet keeps first-seen order where HashSet would not. List defines equals and hashCode element-wise, which is what makes the deduplication work at all.
- 12: Emitting unconditionally with no skip, so this generates 2^n lists and the set does the rest.

<!-- @code python -->
```python
def subsets_with_dup(a):
    a = sorted(a)
    raw, cur = [], []

    def go(start):
        raw.append(tuple(cur))
        for i in range(start, len(a)):
            cur.append(a[i])
            go(i + 1)
            cur.pop()

    go(0)
    return [list(c) for c in dict.fromkeys(raw)]


# 44.29ms at n = 18 against the skip line's 0.81ms — 54.5x, on 262,144
# nodes against 4,096. At n = 24 all-equal it is 16,777,216 against 25.
```

<!-- @annotations -->
- 6: tuple(cur), since a list is unhashable and the deduplication below needs an immutable key.
- 12: dict.fromkeys preserves first-seen order; a set would return them arbitrarily ordered.

<!-- @approach -->
### Mixed-Radix Counting

<!-- @idea -->
Count from zero to the number of distinct subsets, reading k as a mixed-radix number whose digits say how many copies of each value to take.

<!-- @steps -->
1. Sort and collapse the input into (value, count) pairs.
2. Compute the total as the product of (count + 1) over the pairs.
3. Compute a place value for each digit — the product of the sizes to its right.
4. For each k from 0 to total − 1, divide out each digit in turn.
5. Append that many copies of the corresponding value and emit.

<!-- @complexity -->
- time: Θ(n · ∏(count + 1))
- space: O(distinct values) beyond the output
- note: The direct generalisation of Subsets I's counting order — replace base 2 with a base per distinct value and the same enumeration works. Verified on 400 random multisets to produce exactly the distinct subsets, though in mixed-radix order rather than the generator's lexicographic one. Measured 182.65ms at n = 30 against the skip line's 34.88ms, 5.23x, and 65.36ms against 13.15ms in Python, 4.97x — the same penalty the mask forms paid in Subsets I, from the same cause, rebuilding each subset from its digits instead of extending a buffer.

<!-- @code cpp -->
```cpp
vector<vector<int>> subsetsWithDup(vector<int> a) {
    sort(a.begin(), a.end());
    vector<pair<int,int>> items;
    for (int x : a)
        if (!items.empty() && items.back().first == x) items.back().second++;
        else items.push_back({x, 1});
    int d = items.size();
    vector<long long> place(d);
    long long total = 1;
    for (int j = d - 1; j >= 0; j--) { place[j] = total; total *= items[j].second + 1; }
    vector<vector<int>> out;
    out.reserve(total);
    for (long long k = 0; k < total; k++) {
        vector<int> s;
        long long r = k;
        for (int j = 0; j < d; j++) {
            long long q = r / place[j];
            r -= q * place[j];
            s.insert(s.end(), q, items[j].first);
        }
        out.push_back(move(s));
    }
    return out;
}
```

<!-- @annotations -->
- 10: Place values built right to left, and total accumulated in the same pass — after the loop, total is ∏(count + 1), which is the exact number of distinct subsets.
- 17: q is digit j of k in this mixed radix, and it is literally how many copies of items[j] the subset contains. That is the whole correspondence, and it is Subsets I's mask read in a different base.
- 19: insert with a count appends q copies in one call, which keeps the inner loop over distinct values rather than over positions.

<!-- @code java -->
```java
static List<List<Integer>> subsetsWithDup(int[] a) {
    int[] s = a.clone();
    Arrays.sort(s);
    List<int[]> items = new ArrayList<>();
    for (int x : s)
        if (!items.isEmpty() && items.get(items.size() - 1)[0] == x)
            items.get(items.size() - 1)[1]++;
        else items.add(new int[]{x, 1});
    int d = items.size();
    long[] place = new long[d];
    long total = 1;
    for (int j = d - 1; j >= 0; j--) { place[j] = total; total *= items.get(j)[1] + 1; }
    List<List<Integer>> out = new ArrayList<>();
    for (long k = 0; k < total; k++) {
        List<Integer> cur = new ArrayList<>();
        long r = k;
        for (int j = 0; j < d; j++) {
            long q = r / place[j];
            r -= q * place[j];
            for (int t = 0; t < q; t++) cur.add(items.get(j)[0]);
        }
        out.add(cur);
    }
    return out;
}
```

<!-- @annotations -->
- 11: long rather than int for both the place values and the total, since ∏(count + 1) can exceed an int well before the enumeration becomes infeasible.
- 18: Java has no repeated-append helper for a List, so the copies go on one at a time — which is why this version reads longer than the C++ one for the same work.

<!-- @code python -->
```python
from collections import Counter


def subsets_with_dup(a):
    items = sorted(Counter(a).items())
    place, total = [0] * len(items), 1
    for j in range(len(items) - 1, -1, -1):
        place[j] = total
        total *= items[j][1] + 1
    out = []
    for k in range(total):
        cur, r = [], k
        for j, (v, _) in enumerate(items):
            q, r = divmod(r, place[j])
            cur.extend([v] * q)
        out.append(cur)
    return out


# 65.36ms at n = 24 against the skip line's 13.15ms — 4.97x, the same
# penalty the binary mask form paid in Subsets I.
```

<!-- @annotations -->
- 5: Counter(a).items() sorted gives the (value, count) pairs directly, and the grouping is what removes the duplicate problem — this version has no skip line because equal values are never separate choices.
- 14: divmod does the digit extraction and the remainder in one call, which is the mixed-radix equivalent of testing a bit.

<!-- @approach -->
### Unrank in Lexicographic Order

<!-- @idea -->
Precompute how many distinct subsets each suffix has, then walk straight to the k-th subset in the generator's own order.

<!-- @steps -->
1. Sort the input, then build suffix[j], the number of distinct subsets of a[j:].
2. Compute it right to left: suffix[j] is (r − j + 1) times suffix[r], where r ends the run of values equal to a[j].
3. To find position k, return the buffer when k reaches zero, since the generator emits on entry.
4. Otherwise spend one on the node itself, then walk i forward, skipping duplicates at this level and subtracting suffix[i+1] until k falls inside the subtree at i.
5. Append a[i], set start to i + 1, and repeat.

<!-- @complexity -->
- time: O(n) to build the table, O(n) per query
- space: O(n) for the table
- note: This is Subsets I's unranking with 2^(n-1-i) replaced by suffix[i+1], which is the only change duplicates require — and it is the correction to Subsets I's claim that unranking breaks here. Verified against the generator position-for-position on 400 random multisets and 13,137 (input, k) pairs, with the O(n) table itself checked against a direct O(n²) recount on 3,000 more. Measured 66.7ns per query at n = 30 against 34.88ms to generate the list and index it, about 523,000x.

<!-- @code cpp -->
```cpp
vector<long long> suffix;

void buildSuffix(const vector<int>& a) {
    int n = a.size();
    suffix.assign(n + 1, 1);
    int r = n;
    for (int j = n - 1; j >= 0; j--) {
        if (j + 1 >= n || a[j] != a[j + 1]) r = j + 1;
        suffix[j] = (long long)(r - j + 1) * suffix[r];
    }
}

vector<int> subsetAt(const vector<int>& a, long long k) {
    vector<int> out;
    int s = 0;
    while (k) {
        k--;
        int i = s;
        while (true) {
            if (i > s && a[i] == a[i - 1]) { i++; continue; }
            if (k < suffix[i + 1]) break;
            k -= suffix[i + 1];
            i++;
        }
        out.push_back(a[i]);
        s = i + 1;
    }
    return out;
}
```

<!-- @annotations -->
- 8: r is the index just past the run of values equal to a[j], carried down from the previous iteration when the run continues. That is what makes the table O(n) rather than a recount per position.
- 9: (r − j + 1) is the number of ways to take between zero and all remaining copies of a[j], and suffix[r] counts what follows — the product form, one step at a time.
- 21: suffix[i+1], where Subsets I had 2^(n-1-i). That single substitution is the whole difference, and it is why unranking survives duplicates rather than breaking.

<!-- @code java -->
```java
static long[] suffix;

static void buildSuffix(int[] a) {
    int n = a.length;
    suffix = new long[n + 1];
    suffix[n] = 1;
    int r = n;
    for (int j = n - 1; j >= 0; j--) {
        if (j + 1 >= n || a[j] != a[j + 1]) r = j + 1;
        suffix[j] = (long) (r - j + 1) * suffix[r];
    }
}

static List<Integer> subsetAt(int[] a, long k) {
    List<Integer> out = new ArrayList<>();
    int s = 0;
    while (k != 0) {
        k--;
        int i = s;
        while (true) {
            if (i > s && a[i] == a[i - 1]) { i++; continue; }
            if (k < suffix[i + 1]) break;
            k -= suffix[i + 1];
            i++;
        }
        out.add(a[i]);
        s = i + 1;
    }
    return out;
}
```

<!-- @annotations -->
- 6: new long[] zero-fills, so suffix[n] must be set to 1 explicitly — the empty suffix has exactly one subset, the empty one, and getting this wrong zeroes the entire table.
- 10: The cast to long before multiplying. Without it the product is computed in int and overflows silently for inputs whose distinct count exceeds two billion.

<!-- @code python -->
```python
def build_suffix(a):
    n = len(a)
    suffix = [1] * (n + 1)
    r = n
    for j in range(n - 1, -1, -1):
        if j + 1 >= n or a[j] != a[j + 1]:
            r = j + 1
        suffix[j] = (r - j + 1) * suffix[r]
    return suffix


def subset_at(a, k):
    a = sorted(a)
    suffix = build_suffix(a)
    out, s = [], 0
    while k:
        k -= 1
        i = s
        while True:
            if i > s and a[i] == a[i - 1]:
                i += 1
                continue
            if k < suffix[i + 1]:
                break
            k -= suffix[i + 1]
            i += 1
        out.append(a[i])
        s = i + 1
    return out


# Verified against the generator on 400 random multisets and 13,137
# (input, k) pairs. 66.7ns per query in C++ at n = 30, about 523,000x.
```

<!-- @annotations -->
- 8: The run-length recurrence. Python's arbitrary-precision integers mean the product stays exact however large the multiset, where C++ and Java are bounded by 64 bits.
- 21: The subtraction that replaces Subsets I's power of two, and the only line in the whole walk that had to change.

<!-- @example -->

<!-- @input -->
a = [1, 2, 2]

<!-- @output -->
[[], [1], [1,2], [1,2,2], [2], [2,2]] — six, not eight

<!-- @why -->
The smallest input where a duplicate forces the skip line to fire, and where the count formula can be checked by hand.

<!-- @walkthrough -->
1. Sorted the array is already [1, 2, 2], and 2 has multiplicity two.
2. The count is (1+1) × (2+1) = 6, against 2^3 = 8 by position.
3. At the root the empty subset is emitted, then i = 0 takes the 1.
4. From [1] with start 1, i = 1 takes the first 2 giving [1,2], and from there i = 2 takes the second giving [1,2,2].
5. Back at start 1, i reaches 2 with a[2] == a[1], so the skip line fires and the second 2 is refused — which is what stops [1,2] appearing twice.
6. Back at the root, i = 1 gives [2] and then [2,2]; i = 2 is skipped for the same reason.
7. Six results from six nodes — exactly one node per distinct subset.

<!-- @example -->

<!-- @input -->
a = twenty-four identical elements

<!-- @output -->
25 distinct subsets, from 25 nodes

<!-- @why -->
The extreme case, where the gap between generating by position and generating distinct subsets is at its widest.

<!-- @walkthrough -->
1. All twenty-four elements are equal, so a subset is determined only by how many are taken: zero through twenty-four.
2. That is 24 + 1 = 25 distinct subsets, matching ∏(count + 1) with a single value of multiplicity 24.
3. By position there are 2^24 = 16,777,216 subsets, so all but 25 of them are repeats.
4. The skip line fires at every i greater than start, so each level offers exactly one choice.
5. The recursion therefore walks a single chain of 25 nodes and emits at each.
6. The deduplicating version walks all 16,777,216 nodes to reach the same 25 results.
7. That is a ratio of 671,088, and it grows without bound as the multiplicity rises.

<!-- @example -->

<!-- @input -->
k copies of each of m values, k from 1 to 8

<!-- @output -->
Skip nodes equal the answer size; dedupe nodes equal 2^n

<!-- @why -->
The comparison that separates the two approaches, with an honest control at k = 1 where they coincide.

<!-- @walkthrough -->
1. At one copy each there are no duplicates, the skip line never fires, and both walk 64 nodes for 64 results.
2. At two copies of each of six values the answer is 3^6 = 729 and the skip version walks exactly 729 nodes, against 4,096.
3. At three copies it is 4^6 = 4,096 against 262,144, a factor of 64.
4. At four copies it is 15,625 against 16,777,216, a factor of 1,073.7.
5. At eight copies of each of three values the answer is 9^3 = 729 against the same 16,777,216 — 23,014x.
6. The dedupe column is exactly 2^n in every row, because nothing in that version knows duplicates exist.
7. The skip column is exactly the answer size in every row, which is the floor: one node per distinct subset.

<!-- @example -->

<!-- @input -->
n = 30, three copies of each of 1..10, k arbitrary

<!-- @output -->
The k-th of 1,048,576 subsets in 66.7 nanoseconds

<!-- @why -->
The case that corrects Subsets I — unranking survives duplicates, with the product replacing the power of two.

<!-- @walkthrough -->
1. The distinct count is 4^10 = 1,048,576, since each of the ten values can contribute zero to three copies.
2. The suffix table is built right to left in O(n): suffix[j] is (r − j + 1) times suffix[r], where r ends a[j]'s run.
3. For this input suffix[0] is 1,048,576 and each step of ten positions divides it by four.
4. Unranking then walks exactly as Subsets I did, subtracting suffix[i+1] where that version subtracted 2^(n-1-i).
5. Measured 66.7ns per query against 34.88ms to generate the list and index it, about 523,000x.
6. Verified position-for-position against the generator on 400 random multisets and 13,137 pairs.
7. Subsets I claimed this breaks with duplicates; what breaks is the power of two, and replacing it with the product is the entire repair.

<!-- @visualization custom -->

<!-- @description -->
Open on the transfer, because it is the cheapest thing to show and the most useful to remember. Put Combination Sum II's loop beside this one with the target-carrying parts greyed out, so that what remains — the sort, the loop, and `if (i > start && a[i] == a[i-1]) continue;` — is visibly identical. Caption it the duplicate rule was never about the target, and note that the i > start versus i > 0 analysis carries over with it.

The second panel is the count, and it should replace one formula with another in place. Show 2^n crossed out and ∏(count + 1) written beneath, then the worked case a = [1,2,2]: 2^3 = 8 by position against (1+1)(2+1) = 6 distinct, with the two paths that both reach [1,2] drawn converging and one of them cut by the skip line. Beneath that, the extreme: twenty-four identical elements, 16,777,216 against 25, sized so the second is a single sliver.

The third panel is the two approaches. Plot skip-line nodes and dedupe-after nodes against k for k = 1 to 8 on a log axis. The dedupe curve is flat at 2^n for fixed n and the skip curve tracks the answer; mark k = 1 where they touch, labelled no duplicates, no difference, and annotate the right end 23,014x. Print both node columns as exact numbers rather than a ratio alone, since the point is that one equals 2^n and the other equals the answer size.

Close on what survives, drawn as a four-row table with a verdict per row: loop form carries over unchanged; counting order carries over in mixed radix, in a different order; unranking carries over with suffix[i+1] in place of 2^(n-1-i); Gray code needs a different construction. Mark the middle two as corrections to what Subsets I claimed, and put the substitution 2^(n-1-i) → suffix[i+1] in a box of its own, since it is the single change that makes the whole family transfer.

<!-- @sampleInput -->
```json
{"primary":{"a":[1,2,2],"sorted":[1,2,2],"distinct":6,"byPosition":8,"formula":"prod(count+1) = (1+1)*(2+1) = 6","results":[[],[1],[1,2],[1,2,2],[2],[2,2]],"nodes":6,"nodesPerResult":1.000,"why":"[1,2] is reachable through either 2, so the skip line refuses the second at that level"},"transfer":{"from":"combination-sum-ii","line":"if (i > start && a[i] == a[i-1]) continue;","changed":"nothing but the deletion of the target","reading":"the duplicate rule is about index paths reaching the same multiset, not about sums","sortIsPrecondition":true},"countFormula":{"formula":"prod over values of (count+1)","rows":[{"a":[1,2,2],"twoToN":8,"distinct":6},{"a":[1,1,1,1],"twoToN":16,"distinct":5},{"a":[1,2,2,3,3,3],"twoToN":64,"distinct":24},{"a":[1,1,2,2,3,3,4,4],"twoToN":256,"distinct":81},{"a":"ten 2s","twoToN":1024,"distinct":11}],"exact":true},"skipVsDedupe":{"rows":[{"k":1,"m":6,"n":6,"distinct":64,"skipNodes":64,"dedupeNodes":64,"ratio":1.0},{"k":2,"m":6,"n":12,"distinct":729,"skipNodes":729,"dedupeNodes":4096,"ratio":5.6},{"k":3,"m":6,"n":18,"distinct":4096,"skipNodes":4096,"dedupeNodes":262144,"ratio":64.0},{"k":4,"m":6,"n":24,"distinct":15625,"skipNodes":15625,"dedupeNodes":16777216,"ratio":1073.7},{"k":8,"m":3,"n":24,"distinct":729,"skipNodes":729,"dedupeNodes":16777216,"ratio":23014.0}],"reading":"the dedupe column is exactly 2^n in every row; the skip column is exactly the answer size","extreme":{"n":24,"allEqual":true,"byPosition":16777216,"distinct":25,"skipNodes":25,"ratio":671088},"pythonMeasured":{"n":18,"skipMs":0.81,"dedupeMs":44.29,"factor":54.5}},"whatSurvives":{"correction":"Subsets I claimed only the loop form survives duplicates and that unranking breaks; three of the four carry over","rows":[{"approach":"start-index loop","verdict":"carries over unchanged, with the skip line"},{"approach":"counting order","verdict":"carries over as mixed-radix counting, digit j in 0..count(v_j)","caveat":"enumerates in mixed-radix order, not the generator's lexicographic one","verifiedOn":400},{"approach":"unranking","verdict":"carries over with suffix[i+1] replacing 2^(n-1-i)","verifiedOn":400,"pairs":13137},{"approach":"gray code","verdict":"needs a genuinely different construction, being defined over binary words"}],"theSubstitution":"2^(n-1-i)  ->  suffix[i+1] = prod(count+1) over the remaining suffix"},"timing":{"cpp":{"input":"3 copies of each of 1..10","n":30,"distinct":1048576,"unit":"ms","minOf":7,"eachMeasuredTwice":true,"maxSpread":1.013,"skipLine":34.88,"frequency":34.75,"mixedRadix":182.65,"nodes":{"skipLine":1048576,"frequency":1398101},"ratios":{"frequency":1.00,"mixedRadix":5.23},"frequencyNodeRatio":"exactly 4/3 — sum of 4^j against 4^10","unrankNs":66.7,"unrankFactor":523362},"python":{"input":"3 copies of each of 1..8","n":24,"distinct":65536,"unit":"ms","minOf":9,"maxSpread":1.011,"skipLine":13.15,"frequency":17.96,"mixedRadix":65.36,"ratios":{"frequency":1.37,"mixedRadix":4.97}}},"arc":[{"recursion":"power set, loop form","nodesPerResult":1.000,"deadEndRate":0.0},{"recursion":"subsets I","nodesPerResult":1.000,"deadEndRate":0.0},{"recursion":"subsets II","nodesPerResult":1.000,"deadEndRate":0.0},{"recursion":"no adjacent 1s","nodesPerResult":2.618,"deadEndRate":0.0},{"recursion":"parentheses, n=12","nodesPerResult":4.968,"deadEndRate":0.0},{"recursion":"combination sum","nodesPerResult":37.13,"deadEndRate":80.7},{"recursion":"combination sum II","nodesPerResult":6.91,"deadEndRate":67.6}]}
```

<!-- @highlights -->
- Combination Sum II's loop sits beside this one with the target-carrying parts greyed out.
- What remains is visibly identical: the sort, the loop, and the skip line.
- It is captioned the duplicate rule was never about the target.
- 2^n is crossed out and ∏(count + 1) written beneath it.
- The worked case a = [1,2,2] shows 8 by position against 6 distinct.
- Two paths both reaching [1,2] are drawn converging, with one cut by the skip line.
- The extreme sits beneath: twenty-four identical elements, 16,777,216 against 25.
- Two curves are plotted against k on a log axis, skip-line nodes and dedupe-after nodes.
- The dedupe curve is flat at 2^n while the skip curve tracks the answer size.
- k = 1 is marked where they touch, labelled no duplicates, no difference.
- The right end is annotated 23,014x.
- Both node columns are printed as exact numbers, not only as a ratio.
- A four-row table closes the page with a verdict for each Subsets I approach.
- The middle two rows are marked as corrections to what Subsets I claimed.
- The substitution 2^(n-1-i) to suffix[i+1] is boxed on its own.
- That box is captioned as the single change that makes the whole family transfer.

<!-- @edgeCases -->
- a = [] — one subset, the empty set, so the answer is [[]] and not [].
- a = [x] — two subsets, and the smallest input where no duplicate exists to skip.
- All values equal — the answer is n + 1 subsets and the recursion walks a single chain of n + 1 nodes.
- No duplicates at all — the skip line never fires and this reduces exactly to Subsets I, with both approaches walking the same 2^n nodes.
- Two values with the same count, such as [1,1,2,2] — nine distinct subsets, since 3 × 3.
- Unsorted input — the skip line misses non-adjacent duplicates and emits repeats, which is wrong output rather than slow output.
- A value appearing many times — the answer grows linearly in that multiplicity while 2^n grows exponentially, which is where the two approaches diverge fastest.
- k = 0 for unranking — returns the empty subset before the walk runs once.
- k equal to the distinct count minus one — the last subset in lexicographic order, which is the single largest value alone.
- k outside the valid range — the unranking walk runs i past the end of the array and indexes out of bounds.
- A distinct count exceeding 2^63 — the suffix table overflows in C++ and Java, though Python is unaffected.
- Java's suffix array left zero-filled — suffix[n] must be set to 1 explicitly or the whole table computes as zero.
- The mixed-radix form compared literally against the generator — it produces the same subsets in a different order, so any comparison must sort or use a set.

<!-- @pitfalls -->
- Writing i > 0 instead of i > start. It refuses the first copy at each level too, so [2,2] from [2,2] comes back missing — the same silent failure Combination Sum II documents.
- Skipping the sort. a[i] == a[i-1] only sees adjacent duplicates, so unsorted input emits repeats rather than running slowly.
- Assuming the answer has 2^n entries. It has ∏(count + 1), which for twenty-four identical elements is 25 rather than 16,777,216.
- Generating everything and filtering. The cost is exactly 2^n regardless of the answer size — 23,014x the skip line at eight copies of each of three values, and unbounded as multiplicities rise.
- Believing unranking is impossible with duplicates. Subsets I said so and it is wrong; replacing 2^(n-1-i) with suffix[i+1] is the entire repair.
- Believing counting order is impossible with duplicates. Binary counting is, but counting in mixed radix is not — digit j simply ranges over 0 to count(v_j).
- Expecting the mixed-radix form to match the generator's order. It produces the same subsets in a different sequence, so comparisons need a sort or a set.
- Leaving Java's suffix array zero-filled. suffix[n] is 1, not 0, and forgetting it makes every entry zero and every query return the empty subset.
- Multiplying the suffix product in int. The cast to long must come before the multiply, or the table overflows silently for large multisets.
- Recursing on i instead of i + 1. That allows a position to be used twice, which is a different problem entirely.
- Storing the buffer rather than a copy. As everywhere in this topic, that stores one aliased list that ends up empty.
- Reordering the caller's array. The sort is mandatory here, so the copy matters as much as it did in Combination Sum II.
- Treating the skip line as pruning. It does not remove a subtree that would have produced answers — it removes one that would have produced repeats, which is why the node count equals the answer size exactly.

<!-- @doubt -->
### Why does Combination Sum II's line work here unchanged?

<!-- @answer -->
Because it was never about the target. The rule refuses a value equal to its neighbour within the same loop, and what that prevents is two different index paths building the same multiset — positions holding equal values are interchangeable, so choosing the first copy and choosing the second lead to identical subtrees. Nothing in that argument mentions a sum. Delete the target from Combination Sum II and the line still does exactly what it did. The corollaries transfer too: i > start rather than i > 0, for the same reason, and the sort as a correctness precondition rather than a tuning choice, since a[i] == a[i-1] only detects duplicates that are adjacent.

<!-- @doubt -->
### How many distinct subsets are there?

<!-- @answer -->
The product over distinct values of one more than each multiplicity, because a subset is determined entirely by how many copies of each value it takes — zero up to the multiplicity, independently per value. So [1,2,2] gives (1+1)(2+1) = 6 against 2^3 = 8 by position, and [1,1,2,2,3,3,4,4] gives 3^4 = 81 against 256. The most extreme case is a single repeated value: twenty-four identical elements have 2^24 = 16,777,216 subsets by position and exactly 25 distinct ones. This formula is the substitution that carries the rest of Subsets I across — everywhere that file used 2^n or 2^(n-1-i), this problem uses the corresponding product.

<!-- @doubt -->
### Does the skip line prune the tree?

<!-- @answer -->
Not in the sense the earlier subtopics used the word. A guard in Generate Parentheses or Combination Sum refuses branches that cannot lead to a valid answer, so pruning trades tree size against answers found. This line refuses branches that would produce answers already found. The result is that the tree is exactly the answer — measured, the skip-line recursion visits 729 nodes for 729 subsets, 4,096 for 4,096, and 15,625 for 15,625. That is 1.000 nodes per result, the floor, and the same figure Power Set's loop form and Subsets I reach. Adding duplicate handling cost nothing in tree size; it removed the repeats that would otherwise have inflated it.

<!-- @doubt -->
### Was Subsets I wrong about what survives?

<!-- @answer -->
Yes, and specifically about two of the four. That file said unranking breaks here and that exactly one approach survives duplicates. The reason it gave was correct — the count is no longer 2^n and the subtree sizes are no longer 2^(n-1-i) — but the conclusion does not follow. Unranking survives: the subtree sizes become suffix[i+1], the number of distinct subsets of the remaining suffix, which is computable in O(n) from the run lengths. Verified against the generator position-for-position on 400 random multisets and 13,137 pairs. Counting order survives too, as counting in mixed radix rather than binary, verified on the same 400. Only Gray code genuinely needs a different construction, being defined over binary words. Three of four carry over, two of them by replacing base 2 with a product.

<!-- @doubt -->
### What does mixed-radix counting mean here?

<!-- @answer -->
Subsets I's counting order read k as a binary number where bit i said whether to include element i. With duplicates, read k as a mixed-radix number where digit j says how many copies of the j-th distinct value to include — so digit j ranges from 0 to count(v_j) rather than 0 to 1. The place value for digit j is the product of the sizes to its right, exactly as the place value of a binary digit is a power of two. Counting from 0 to ∏(count + 1) − 1 then hits every distinct subset exactly once, verified on 400 random multisets. The one real caveat is order: it enumerates in mixed-radix order, not the generator's lexicographic order, so the two agree as sets and not as sequences.

<!-- @doubt -->
### Which approach should I write?

<!-- @answer -->
The skip line, and by a wider margin than in Subsets I. It has the smallest tree — exactly one node per distinct subset — it is the fastest measured in both languages, at 34.88ms against mixed-radix counting's 182.65ms at n = 30 and 13.15ms against 65.36ms in Python, and it is three characters different from code you have already written twice. The frequency recursion measures identically in C++ (34.75ms) but 1.37x slower in Python, where its extra nodes are call frames; it is worth knowing because it makes the duplicate handling structural rather than a guard. Mixed-radix counting and unranking are worth knowing for what they show rather than for daily use, which is that this problem is Subsets I with a product in place of a power of two.

<!-- @doubt -->
### Why is the frequency form's node count exactly 4/3 of the skip line's?

<!-- @answer -->
Because it spends a node on every prefix of the (value, count) list, including the branches that take zero copies, while the skip line spends one node per subset and no more. For three copies of each of ten values the skip line visits 4^10 = 1,048,576 nodes and the frequency form visits the sum of 4^j for j from 0 to 10, which is (4^11 − 1)/3 = 1,398,101 — exactly 4/3 of it. In general the ratio is (k+1)/k for k copies each. The two measure identically in C++ anyway, at 34.88ms and 34.75ms, because the extra nodes are shallow and do nothing; Python charges 1.37x for them, which is the call-frame split this series has measured since Power Set.

<!-- @doubt -->
### How bad is deduplicating afterwards?

<!-- @answer -->
Worse than in Combination Sum II, because without a target there is nothing to prune and the generated tree is the full 2^n every time. The dedupe column is exactly 2^n at every input tested and the skip column is exactly the answer size, so the ratio is 2^n divided by ∏(count + 1) — 1.0x with no duplicates, 64.0x at three copies of each of six values, and 23,014.0x at eight copies of each of three. Measured in Python at n = 18 that is 44.29ms against 0.81ms, a factor of 54.5. The worst case is twenty-four identical elements: 16,777,216 nodes to produce 25 results, where the skip line walks 25.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
**Combination Sum III** brings the target back and adds a fixed combination size. That second guard is the interesting part, because unlike the target it *is* complete and cheap — the number of elements chosen so far is exact, monotone and known in O(1), so it refuses exactly the branches that cannot finish. Set against the 80.7% and 67.6% dead-end rates the two Combination Sum problems carry, it shows that incompleteness was a property of that particular guard rather than of guards in general. **Word Break** then leaves this family entirely, for a recursion over string splits where the branching factor is the number of dictionary-matching prefixes rather than a fixed two.
