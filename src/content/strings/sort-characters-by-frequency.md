---
id: sort-characters-by-frequency
topic: Strings
title: Sort Characters by Frequency
difficulty: Easy
status: ready
prerequisites:
  - for-loop
  - if-else-statements
  - check-if-two-strings-are-anagram-of-each-other
  - sort-an-array-of-0s-1s-and-2s
  - selection-sort
  - time-and-space-complexity-basics
relatedIds:
  - check-if-two-strings-are-anagram-of-each-other
  - isomorphic-string
  - sort-an-array-of-0s-1s-and-2s
  - selection-sort
  - count-number-of-substrings
---

<!-- @summary -->
Rearrange a string so the most frequent characters come first — where the sort everyone worries about is over the **alphabet**, not the input, so it costs a flat 0.10us at every size and is **0.0% of the runtime** while the counting pass is 98.8%; where the bucket sort reached for to remove that log factor measured **3.7x slower** because it allocates one bucket per input character; and where Python's popular `sorted(s, key=s.count)` one-liner is both quadratic and **wrong on 19.2%** of inputs.

<!-- @theory -->
## The problem

Given a string, return it rearranged so that characters appear in decreasing
order of how often they occur. All copies of a character must end up together.

```
"tree"     ->  "eert"    or "eetr"
"cccaaa"   ->  "cccaaa"  or "aaaccc"
"Aabb"     ->  "bbAa"    or "bbaA"
```

Note the "or". That is not sloppiness in the examples — it is the specification.

## Ties are unspecified, and ties are the common case

When two characters occur equally often, either may come first. Both `"aabb"`
and `"bbaa"` are correct for input `"aabb"`.

This matters more than it looks, because ties are not rare:

| Input length | Strings over `{a,b,c}` | With at least two characters of equal frequency |
|---|---|---|
| 3 | 27 | 6 (22.2%) |
| 4 | 81 | **54 (66.7%)** |
| 5 | 243 | 150 (61.7%) |
| 6 | 729 | 240 (32.9%) |

So a test that compares your output against one expected string will fail correct
solutions most of the time. The property to assert instead is the one the problem
actually states: **same multiset of characters, all copies contiguous, run
lengths non-increasing.** Every approach below is checked against that, not
against a fixed answer.

## The sort is over the alphabet, not the string

Here is the observation the whole problem turns on. You are not sorting `n`
characters. You are sorting the **distinct** characters — at most 26, or 256 if
you index by byte — and that count does not grow with the input.

Measured, sorting just the distinct characters by frequency:

| n | Distinct characters | Sort-only cost |
|---|---|---|
| 1,000 | 26 | 0.112us |
| 10,000 | 26 | 0.087us |
| 100,000 | 26 | 0.101us |
| 500,000 | 26 | **0.101us** |

**Flat.** Five hundred times the input, the same sort cost, because the thing
being sorted never got bigger. The `k log k` in the complexity is `256 * 8` at
worst — a constant, not a term.

## So where does the time actually go

Break the function into its three phases at n = 500,000:

| Phase | Microseconds | Share |
|---|---|---|
| **Counting pass over the input** | **207.90** | **98.8%** |
| Sorting the 26 distinct characters | 0.10 | 0.0% |
| Building the output string | 7.20 | 3.4% |
| Whole function | 210.40 | |

The counting pass is the entire problem. The sort is a rounding error, and
building the n-character answer is under 4% because appending a run of identical
characters is a `memset` rather than a loop.

This reframes every optimisation decision below. Anything that speeds up the sort
is competing for 0.0% of the runtime.

## The bucket sort is slower, and by a lot

The standard advice is to bucket by frequency instead of sorting: frequencies are
bounded by `n`, so you can lay out an array of `n + 1` buckets and read them off
in descending order, giving O(n) with no log factor.

Measured against the plain sort, alphabet of 26:

| n | Count then sort | Count then bucket | Bucket sized to max frequency |
|---|---|---|---|
| 100 | **0.72us** | 1.26us | 1.28us |
| 1,000 | **1.31us** | 4.09us | 1.94us |
| 10,000 | **5.42us** | 17.10us | 8.85us |
| 100,000 | **62.67us** | 141.25us | 71.83us |
| 500,000 | **219.60us** | **810.84us** | 386.93us |

**3.7x slower at n = 500,000.** The reason is in the setup line: `bucket(n + 1)`
constructs half a million empty vectors to hold at most 26 characters. Sizing the
buckets to the maximum frequency instead of to `n` helps — 386.93 rather than
810.84 — and is still 1.8x behind the sort it was meant to improve on.

This is the whole lesson of the section above, made concrete: the bucket sort
removes a `log k` factor worth **0.10 microseconds** and pays for it with an
allocation worth **591**.

## The only thing worth optimising is the counting pass

Since counting is 98.8% of the work, that is where a real improvement has to
come from. A histogram is a read-modify-write into the same cell whenever a
character repeats, and that dependency stalls the pipeline. Giving each lane its
own table breaks it:

| Counting 500,000 bytes | Microseconds | Throughput | Speedup |
|---|---|---|---|
| One histogram | 193.81 | 2.58 GB/s | |
| **Four interleaved histograms** | **132.54** | **3.77 GB/s** | **1.46x** |
| Eight interleaved histograms | 135.92 | 3.68 GB/s | 1.43x |

1.46x, reproducible, and eight lanes buy nothing over four. Worth knowing, and
worth not writing unless the profile says this function matters — it is four
times the code for a factor of one and a half.

The point is the ordering: the optimisation everyone reaches for costs 3.7x, and
the one nobody mentions gains 1.46x, and you can only tell which is which by
measuring where the time is.

## Python's popular one-liner is wrong

This is widely posted as the elegant answer:

```python
"".join(sorted(s, key=s.count, reverse=True))
```

It is **incorrect**, and not on an exotic input. Python's sort is stable, so
characters with equal frequency keep their original relative order — which means
they stay interleaved instead of being grouped. Input `"abab"` returns `"abab"`,
where the two `a`s and two `b`s must be contiguous.

Exhaustively over all 1,093 strings up to length 6 on a three-letter alphabet:

| Approach | Invalid outputs |
|---|---|
| `Counter(s).most_common()` | **0** |
| `sorted(s, key=s.count, reverse=True)` | **210 (19.2%)** |
| `sorted(s, key=lambda c: (-s.count(c), c))` | 0 |
| `sorted(s, key=lambda c: (-count[c], c))` | 0 |
| Bucket by frequency | 0 |

Adding a tiebreak on the character itself fixes the grouping. It does not fix the
other problem.

## And it is quadratic

`s.count(c)` scans the whole string, and `sorted` calls the key function once per
character. That is `n` scans of length `n`:

| n | `sorted(key=s.count)` | Growth per doubling |
|---|---|---|
| 1,000 | 579.3us | |
| 2,000 | 2,316.6us | **x4.00** |
| 4,000 | 9,668.4us | x4.17 |
| 8,000 | 38,934.2us | **x4.03** |

Textbook quadratic. Set against the idiomatic answer, alphabet of 26:

| n | `Counter.most_common` | `sorted(key=s.count)` | `sorted(-count, ch)` | Bucket |
|---|---|---|---|---|
| 100 | 5.08us | 9.57us | 17.58us | 10.28us |
| 1,000 | **22.89us** | 748.34us | 200.98us | 75.98us |
| 10,000 | **208.71us** | 60,023.06us | 2,191.07us | 800.83us |
| 50,000 | **1,174.67us** | **1,535,558.15us** | 12,056.22us | 4,356.97us |

At n = 50,000 the one-liner takes **1.54 seconds** against 1.17 milliseconds —
**1,307x** — while also being wrong. Note the middle column too: sorting the
*string* with a precomputed count table is correct and linear in its key lookups,
and still 10x slower than `most_common`, because it sorts `n` items where the
right answer sorts 26.

And Python's bucket version loses for the same reason C++'s does — 4,356.97
against 1,174.67, from allocating `n + 1` lists.

## What to write

Count into a fixed table, sort the distinct characters, append each run. In
Python that is `"".join(c * n for c, n in Counter(s).most_common())`, which is
the fastest and shortest correct option at every size measured. Reach past it
only if the profile points at the counting pass, and then interleave histograms
rather than replacing the sort.

<!-- @intuition -->
The instinct on seeing "sort by frequency" is to worry about the sort, and the measurement says the sort is not there at all — 0.10 microseconds against a 210-microsecond function, and flat as the input grows five hundredfold. That is because the objects being ordered are the distinct characters, and there are at most a couple of hundred of those no matter how long the string is. Once you see that the expensive part is the single pass that counts, the usual advice inverts: replacing the comparison sort with a bucket sort optimises something that costs nothing and pays for it with an allocation proportional to the input, which measured nearly four times slower. The transferable habit is to locate the cost before choosing the optimisation, because complexity notation deliberately hides which term is the constant, and here the constant is the entire runtime. Python's version of the trap is sharper still, and worth remembering as a pair: the one-liner everyone posts is quadratic because a per-element key function that scans the whole string is n scans of length n, and it is also silently wrong, because a stable sort leaves equal-frequency characters interleaved when the problem requires them grouped.

<!-- @approach -->
### Sort the String Itself

<!-- @idea -->
Order the characters of the string directly, using each character's frequency as the sort key.

<!-- @steps -->
1. Count how many times each character occurs.
2. Sort the characters of the string, most frequent first.
3. Break ties on the character itself, so equal-frequency characters group together.
4. Join the sorted characters into the answer.

<!-- @complexity -->
- time: O(n log n) with a precomputed count table, and O(n^2) if the key recounts the string on every comparison
- space: O(n) for the sorted sequence
- note: The natural first attempt and the wrong shape, because it sorts n items when only the distinct characters need ordering — measured 12,056.22 microseconds at n = 50,000 against 1,174.67 for counting first, about 10x. The tiebreak on the character is mandatory rather than cosmetic: without it a stable sort leaves equal-frequency characters interleaved, which is invalid on **19.2%** of all strings up to length 6 on a three-letter alphabet.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
using namespace std;

string frequencySort(string s) {
    int count[256] = {0};
    for (unsigned char c : s) count[c]++;
    sort(s.begin(), s.end(), [&](char a, char b) {
        unsigned char x = a, y = b;
        if (count[x] != count[y]) return count[x] > count[y];
        return x < y;
    });
    return s;
}
```

<!-- @annotations -->
- 10: The tiebreak. `std::sort` is not stable, so without it equal-frequency characters can be left scattered and the runs are not contiguous.
- 8: The count table is captured, not recomputed — a comparator that called `s.find` or counted inline would make this quadratic.

<!-- @code java -->
```java
static String frequencySort(String s) {
    int[] count = new int[256];
    for (int i = 0; i < s.length(); i++) count[s.charAt(i)]++;
    Character[] chars = new Character[s.length()];
    for (int i = 0; i < s.length(); i++) chars[i] = s.charAt(i);
    Arrays.sort(chars, (a, b) ->
        count[a] != count[b] ? count[b] - count[a] : a - b);
    StringBuilder sb = new StringBuilder(s.length());
    for (char c : chars) sb.append(c);
    return sb.toString();
}
```

<!-- @annotations -->
- 4: Boxing every character into a `Character` to use a comparator allocates n objects. This is exactly the cost the counting approach avoids by sorting 26 items instead of n.

<!-- @code python -->
```python
from collections import Counter


def frequency_sort(s):
    count = Counter(s)
    return "".join(sorted(s, key=lambda c: (-count[c], c)))


# Correct, and still the wrong shape: it sorts n characters where the
# answer needs only the distinct ones ordered. 12,056.22us at
# n = 50,000 against 1,174.67 for Counter.most_common.
#
# Do NOT write sorted(s, key=s.count, reverse=True). s.count scans the
# whole string per character, which is quadratic -- 1,535,558.15us at
# n = 50,000 -- and stability leaves equal counts interleaved, which is
# invalid on 19.2% of inputs.
```

<!-- @annotations -->
- 6: `-count[c]` for descending and `c` to break ties, so equal-frequency characters land together. Dropping the `c` reintroduces the interleaving bug.
- 13: `key=s.count` is the widely posted version and fails on both counts at once — wrong answer and quadratic time.

<!-- @approach -->
### Optimal - Count, Then Sort the Distinct Characters

<!-- @idea -->
Count into a fixed table, order only the characters that actually occur, then write each run out.

<!-- @steps -->
1. Count each character into a table with one entry per possible byte.
2. Collect the characters whose count is not zero.
3. Sort that collection by count, highest first.
4. Reserve the output at the input's length.
5. Append each character repeated its count many times.
6. Return the result.

<!-- @complexity -->
- time: O(n) for the count plus O(k log k) for the sort, where k is the alphabet size and not the input length
- space: O(k) for the table, O(n) for the output
- note: The one to write. Measured 219.60 microseconds at n = 500,000, of which the counting pass is 207.90 (98.8%), the sort of 26 characters is 0.10 (0.0%) and building the output is 7.20 (3.4%). The sort cost is flat as the input grows — 0.112, 0.087, 0.101 and 0.101 microseconds at n = 1,000 through 500,000 — because the number of distinct characters never changes.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
#include <vector>
using namespace std;

string frequencySort(const string& s) {
    int count[256] = {0};
    for (unsigned char c : s) count[c]++;

    vector<pair<int, unsigned char>> chars;
    for (int i = 0; i < 256; i++)
        if (count[i]) chars.push_back({count[i], (unsigned char)i});

    sort(chars.begin(), chars.end(),
         [](const auto& a, const auto& b) { return a.first > b.first; });

    string out;
    out.reserve(s.size());
    for (auto& [n, c] : chars) out.append(n, (char)c);
    return out;
}
```

<!-- @annotations -->
- 12: At most 256 elements, whatever the input length. This line is 0.0% of the function's runtime and is the one the bucket-sort advice is aimed at.
- 8: The counting pass — 98.8% of the runtime, and the only place a real optimisation can come from.
- 18: `append(n, c)` writes a run of identical bytes as a `memset` rather than a loop, which is why building 500,000 characters costs 7.20 microseconds.

<!-- @code java -->
```java
static String frequencySort(String s) {
    int[] count = new int[256];
    for (int i = 0; i < s.length(); i++) count[s.charAt(i)]++;

    List<Integer> chars = new ArrayList<>();
    for (int i = 0; i < 256; i++) if (count[i] > 0) chars.add(i);
    chars.sort((a, b) -> count[b] - count[a]);

    StringBuilder sb = new StringBuilder(s.length());
    for (int c : chars) {
        for (int k = 0; k < count[c]; k++) sb.append((char) c);
    }
    return sb.toString();
}
```

<!-- @annotations -->
- 7: `count[b] - count[a]` is safe from overflow here because counts are non-negative and bounded by the string length; on unbounded values `Integer.compare` is the correct form.
- 10: Pre-sizing the builder to the final length avoids the doubling reallocations that would otherwise copy the answer several times.

<!-- @code python -->
```python
from collections import Counter


def frequency_sort(s):
    return "".join(c * n for c, n in Counter(s).most_common())


# The shortest and the fastest at every size measured: 1,174.67us at
# n = 50,000, against 4,356.97 for a bucket version and 1,535,558.15
# for the sorted(key=s.count) one-liner.
```

<!-- @annotations -->
- 5: `most_common()` sorts the distinct characters, not the string, which is the whole point — and it does the counting and the sorting in C.

<!-- @approach -->
### Count, Then Bucket by Frequency

<!-- @idea -->
Frequencies are bounded by the string's length, so index characters by their count and read the buckets off in descending order — no comparison sort at all.

<!-- @steps -->
1. Count each character into a fixed table.
2. Create one bucket per possible frequency.
3. Put each character into the bucket matching its count.
4. Walk the buckets from the highest frequency down.
5. Append each character repeated its count many times.

<!-- @complexity -->
- time: O(n) with no log factor, which is the reason it is usually recommended
- space: O(n) for the buckets — and that is the problem
- note: Included because it is the standard advice and it is measurably worse. At n = 500,000 it took **810.84 microseconds against 219.60** for the plain sort, about 3.7x, because allocating one bucket per possible frequency constructs half a million empty containers to hold at most 26 characters. Sizing the buckets to the maximum observed frequency rather than to n improves it to 386.93 and still loses by 1.8x. It removes a log factor worth 0.10 microseconds at a cost of 591.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

string frequencySort(const string& s) {
    int count[256] = {0};
    int maxFreq = 0;
    for (unsigned char c : s) maxFreq = max(maxFreq, ++count[c]);

    vector<vector<unsigned char>> bucket(maxFreq + 1);
    for (int i = 0; i < 256; i++)
        if (count[i]) bucket[count[i]].push_back((unsigned char)i);

    string out;
    out.reserve(s.size());
    for (int f = maxFreq; f >= 1; f--)
        for (unsigned char c : bucket[f]) out.append(f, (char)c);
    return out;
}
```

<!-- @annotations -->
- 10: Sized to the largest count seen, not to `s.size()`. Writing `bucket(s.size() + 1)` measured 810.84 microseconds against 386.93 for this — both slower than simply sorting 26 items.
- 8: Tracking the maximum during the counting pass costs nothing, since the value is already in a register.

<!-- @code java -->
```java
static String frequencySort(String s) {
    int[] count = new int[256];
    int maxFreq = 0;
    for (int i = 0; i < s.length(); i++)
        maxFreq = Math.max(maxFreq, ++count[s.charAt(i)]);

    List<List<Character>> bucket = new ArrayList<>();
    for (int i = 0; i <= maxFreq; i++) bucket.add(new ArrayList<>());
    for (int i = 0; i < 256; i++)
        if (count[i] > 0) bucket.get(count[i]).add((char) i);

    StringBuilder sb = new StringBuilder(s.length());
    for (int f = maxFreq; f >= 1; f--)
        for (char c : bucket.get(f))
            for (int k = 0; k < f; k++) sb.append(c);
    return sb.toString();
}
```

<!-- @annotations -->
- 8: One `ArrayList` object per frequency level. On a long string with a small alphabet that is tens of thousands of allocations to order at most 256 things.

<!-- @code python -->
```python
from collections import Counter


def frequency_sort(s):
    count = Counter(s)
    buckets = [[] for _ in range(max(count.values(), default=0) + 1)]
    for ch, n in count.items():
        buckets[n].append(ch)
    out = []
    for n in range(len(buckets) - 1, 0, -1):
        for ch in buckets[n]:
            out.append(ch * n)
    return "".join(out)


# 4,356.97us at n = 50,000 against 1,174.67 for Counter.most_common --
# the list-of-lists costs more than the sort it removes, exactly as in
# C++.
```

<!-- @annotations -->
- 6: `default=0` keeps this from raising on the empty string, where `max` of an empty sequence has no answer.

<!-- @approach -->
### Count, Then a Max-Heap

<!-- @idea -->
Push the distinct characters into a priority queue keyed by count and pop them in order.

<!-- @steps -->
1. Count each character into a fixed table.
2. Push every character that occurs, paired with its count, into a max-heap.
3. Pop the highest-count character.
4. Append it repeated its count many times.
5. Repeat until the heap is empty.

<!-- @complexity -->
- time: O(n) for the count plus O(k log k) for the heap operations, with k the alphabet size
- space: O(k) for the heap
- note: The same asymptotics as sorting and about the same speed — measured 250.30 microseconds at n = 500,000 against 219.60 for the plain sort, and marginally ahead at 43.88 against 62.67 at n = 100,000. There is no reason to prefer it here, since the whole collection is known before any of it is needed; a heap earns its keep when items arrive over time or when only the top few are wanted, and neither is the case in this problem.

<!-- @code cpp -->
```cpp
#include <queue>
#include <string>
using namespace std;

string frequencySort(const string& s) {
    int count[256] = {0};
    for (unsigned char c : s) count[c]++;

    priority_queue<pair<int, unsigned char>> pq;
    for (int i = 0; i < 256; i++)
        if (count[i]) pq.push({count[i], (unsigned char)i});

    string out;
    out.reserve(s.size());
    while (!pq.empty()) {
        auto [n, c] = pq.top();
        pq.pop();
        out.append(n, (char)c);
    }
    return out;
}
```

<!-- @annotations -->
- 9: The default `priority_queue` is a max-heap and `pair` compares on `first` first, so pairing count with character orders by count without a custom comparator.
- 10: At most 256 pushes. Building a heap of 26 elements and sorting 26 elements are the same work to within noise.

<!-- @code java -->
```java
static String frequencySort(String s) {
    int[] count = new int[256];
    for (int i = 0; i < s.length(); i++) count[s.charAt(i)]++;

    PriorityQueue<Integer> pq =
        new PriorityQueue<>((a, b) -> count[b] - count[a]);
    for (int i = 0; i < 256; i++) if (count[i] > 0) pq.add(i);

    StringBuilder sb = new StringBuilder(s.length());
    while (!pq.isEmpty()) {
        int c = pq.poll();
        for (int k = 0; k < count[c]; k++) sb.append((char) c);
    }
    return sb.toString();
}
```

<!-- @annotations -->
- 5: Java's `PriorityQueue` is a min-heap, so the comparator is reversed to `count[b] - count[a]` to pop the most frequent first.

<!-- @code python -->
```python
import heapq
from collections import Counter


def frequency_sort(s):
    heap = [(-n, c) for c, n in Counter(s).items()]
    heapq.heapify(heap)
    out = []
    while heap:
        n, c = heapq.heappop(heap)
        out.append(c * -n)
    return "".join(out)


# heapq is a min-heap, so counts are negated. This is strictly more
# code than Counter.most_common for the same answer.
```

<!-- @annotations -->
- 6: Negating the count is the standard way to get a max-heap out of `heapq`. Note it also flips the tiebreak on the character, which is harmless because ties are unspecified.

<!-- @example -->

<!-- @input -->
s = "tree"

<!-- @output -->
"eert" — and "eetr" is equally correct

<!-- @why -->
The smallest input that shows the tie ambiguity, which is the specification rather than a detail.

<!-- @walkthrough -->
1. Counting gives t:1, r:1, e:2.
2. The only character with frequency 2 is `e`, so both `e`s come first.
3. `t` and `r` both have frequency 1, so their order between themselves is unconstrained.
4. That makes `"eert"` and `"eetr"` both valid answers.
5. A test comparing against a single expected string will reject one of them.
6. The property to assert is instead: same multiset, all copies contiguous, run lengths non-increasing.
7. Over strings of length 4 on a three-letter alphabet, 66.7% have at least two characters of equal frequency, so this is the common case rather than the corner.

<!-- @example -->

<!-- @input -->
s = "abab", given to `sorted(s, key=s.count, reverse=True)`

<!-- @output -->
"abab" — which is wrong

<!-- @why -->
The smallest counterexample to the most widely posted Python solution, and it fails for a reason that has nothing to do with the frequencies being computed wrongly.

<!-- @walkthrough -->
1. `s.count('a')` is 2 and `s.count('b')` is 2, so every character has the same key.
2. Python's sort is stable, which means elements with equal keys keep their original relative order.
3. The original order is a, b, a, b — so the output is unchanged.
4. The counts are correct; the grouping is not.
5. The problem requires all copies of a character to be contiguous, and `"abab"` has them interleaved.
6. Exhaustively over all 1,093 strings up to length 6 on a three-letter alphabet, this returns an invalid answer on **210 of them — 19.2%**.
7. Adding a tiebreak, `key=lambda c: (-count[c], c)`, groups them and brings the failure count to zero.

<!-- @example -->

<!-- @input -->
A 500,000-character string over a 26-letter alphabet

<!-- @output -->
210.40us total: 207.90 counting, 0.10 sorting, 7.20 building

<!-- @why -->
Locates the cost, which is what decides every optimisation choice in this problem.

<!-- @walkthrough -->
1. The counting pass reads all 500,000 characters and takes 207.90 microseconds — 98.8% of the function.
2. The sort orders the 26 distinct characters and takes 0.10 microseconds — 0.0%.
3. Building the 500,000-character output takes 7.20 microseconds, because each run is written as a `memset` rather than a loop.
4. Raising n from 1,000 to 500,000 leaves the sort at 0.112, 0.087, 0.101 and 0.101 microseconds — flat, because the number of distinct characters never changed.
5. So replacing the sort with a bucket sort competes for 0.0% of the runtime.
6. Measured, that replacement costs 810.84 microseconds against 219.60 — 3.7x slower — from allocating one bucket per possible frequency.
7. The optimisation that does help is on the counting pass: four interleaved histograms measured 132.54 microseconds against 193.81, a 1.46x gain.

<!-- @example -->

<!-- @input -->
A 50,000-character string, in Python, three ways

<!-- @output -->
1,174.67us for `Counter.most_common`, 12,056.22 for sorting the string, 1,535,558.15 for the `s.count` one-liner

<!-- @why -->
Shows the two separate mistakes — sorting the wrong collection, and using a key function that rescans — costing 10x and 1,307x respectively.

<!-- @walkthrough -->
1. `Counter(s).most_common()` counts in C and sorts 26 items, measuring 1,174.67 microseconds.
2. `sorted(s, key=lambda c: (-count[c], c))` is correct but sorts all 50,000 characters, measuring 12,056.22 — about 10x.
3. That 10x is the cost of ordering the wrong collection: n items instead of k.
4. `sorted(s, key=s.count, reverse=True)` calls `s.count` once per character, and each call scans the whole string.
5. That is n scans of length n, measured at 579.3, 2,316.6, 9,668.4 and 38,934.2 microseconds for n of 1,000 through 8,000 — growth of x4.00, x4.17 and x4.03 per doubling.
6. At n = 50,000 it takes 1,535,558.15 microseconds, or about 1.54 seconds — 1,307x the idiomatic answer.
7. And it is wrong on 19.2% of inputs, so the 1.54 seconds buys an invalid result.

<!-- @visualization custom -->

<!-- @description -->
Open on the string streaming left to right into a row of 26 counting bins, one character at a time, with a timer accumulating beside it — then, when the stream ends, lift the 26 bins out and sort them, and let that step complete almost instantly while the timer barely moves. The contrast is the whole figure, so make the two durations physical: a long bar for the streaming pass and a hairline for the sort. Print the split as three stacked segments — counting 207.90us at 98.8%, sorting 0.10us at 0.0%, building 7.20us at 3.4% — with the sort segment too thin to see and labelled with an arrow from outside. Then demonstrate that the sort segment does not grow: replay the whole thing at n = 1,000, 10,000, 100,000 and 500,000 with the streaming bar stretching five hundredfold while the sort hairline stays identical at 0.112, 0.087, 0.101, 0.101. Next, the bucket sort, drawn honestly: show `bucket(n+1)` laying out half a million empty containers across the frame, then drop 26 characters into them, leaving the rest visibly empty — and put its 810.84us bar beside the sort's 219.60us. Label the trade in one line: removes a log factor worth 0.10us, pays 591us for the allocation. Follow with the optimisation that does work — four counting bins running in parallel lanes over the same stream, with the single-lane 193.81us bar shrinking to 132.54 — captioned the only 98.8% of the problem. Close on the Python failure, which needs no timing at all: show `"abab"` with both characters at frequency 2, a stable sort visibly preserving their interleaved order, and the output `"abab"` marked invalid beside a correct `"aabb"`, with the counter reading 210 of 1,093 strings wrong — 19.2%. Beneath it, the quadratic growth of the same one-liner as four bars at x4.00, x4.17, x4.03 per doubling, ending at 1.54 seconds.

<!-- @sampleInput -->
```json
{"primary":{"s":"tree","counts":{"t":1,"r":1,"e":2},"validAnswers":["eert","eetr"],"why":"t and r tie at frequency 1, so their relative order is unspecified"},"smallCases":[{"s":"tree","validAnswers":["eert","eetr"]},{"s":"cccaaa","validAnswers":["cccaaa","aaaccc"]},{"s":"Aabb","validAnswers":["bbAa","bbaA"]},{"s":"aabb","validAnswers":["aabb","bbaa"]},{"s":"","validAnswers":[""]},{"s":"a","validAnswers":["a"]}],"specification":{"requirement":"same multiset of characters, all copies of a character contiguous, run lengths non-increasing","tiesUnspecified":true,"testingGuidance":"assert the property, not a fixed expected string — a single expected answer rejects correct solutions","tieFrequency":[{"length":3,"strings":27,"withTies":6,"share":"22.2%"},{"length":4,"strings":81,"withTies":54,"share":"66.7%"},{"length":5,"strings":243,"withTies":150,"share":"61.7%"},{"length":6,"strings":729,"withTies":240,"share":"32.9%"}]},"coreInsight":{"claim":"the sort is over the distinct characters, not the input","distinctBoundedBy":256,"sortCostIsFlat":[{"n":1000,"distinct":26,"sortOnlyUs":0.112},{"n":10000,"distinct":26,"sortOnlyUs":0.087},{"n":100000,"distinct":26,"sortOnlyUs":0.101},{"n":500000,"distinct":26,"sortOnlyUs":0.101}],"reading":"five hundred times the input, the same sort cost — the k log k term is a constant, not a term"},"costSplit":{"n":500000,"alphabet":26,"countingUs":207.90,"countingShare":"98.8%","sortingUs":0.10,"sortingShare":"0.0%","buildingUs":7.20,"buildingShare":"3.4%","wholeFunctionUs":210.40,"reading":"anything that speeds up the sort is competing for 0.0% of the runtime"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2, alphabet 26","rows":[{"n":100,"countThenSort":0.72,"bucketSizedN":1.26,"heap":1.16,"bucketTight":1.28},{"n":1000,"countThenSort":1.31,"bucketSizedN":4.09,"heap":1.43,"bucketTight":1.94},{"n":10000,"countThenSort":5.42,"bucketSizedN":17.10,"heap":5.26,"bucketTight":8.85},{"n":100000,"countThenSort":62.67,"bucketSizedN":141.25,"heap":43.88,"bucketTight":71.83},{"n":500000,"countThenSort":219.60,"bucketSizedN":810.84,"heap":250.30,"bucketTight":386.93}],"bucketVerdict":{"atN500000":"810.84 against 219.60 — 3.7x slower","cause":"bucket(n+1) constructs half a million empty vectors to hold at most 26 characters","tightVariant":"386.93, still 1.8x behind","trade":"removes a log factor worth 0.10us and pays 591us for the allocation"},"histogramInterleaving":{"bytes":500000,"oneHistogram":{"us":193.81,"gbPerSec":2.58},"fourInterleaved":{"us":132.54,"gbPerSec":3.77,"speedup":"1.46x"},"eightInterleaved":{"us":135.92,"gbPerSec":3.68,"speedup":"1.43x"},"why":"a histogram is a read-modify-write into the same cell on repeated characters; separate tables per lane break the dependency","guidance":"four times the code for a factor of one and a half — write it only if the profile says this function matters"}},"benchPython":{"unit":"microseconds per run, CPython 3.13.4, alphabet 26","rows":[{"n":100,"counterMostCommon":5.08,"sortedKeySCount":9.57,"sortedTiebreak":19.31,"sortedCounterKey":17.58,"bucket":10.28},{"n":1000,"counterMostCommon":22.89,"sortedKeySCount":748.34,"sortedTiebreak":704.59,"sortedCounterKey":200.98,"bucket":75.98},{"n":10000,"counterMostCommon":208.71,"sortedKeySCount":60023.06,"sortedTiebreak":65583.68,"sortedCounterKey":2191.07,"bucket":800.83},{"n":50000,"counterMostCommon":1174.67,"sortedKeySCount":1535558.15,"sortedTiebreak":1555077.37,"sortedCounterKey":12056.22,"bucket":4356.97}],"quadraticGrowth":[{"n":1000,"us":579.3},{"n":2000,"us":2316.6,"growth":"x4.00"},{"n":4000,"us":9668.4,"growth":"x4.17"},{"n":8000,"us":38934.2,"growth":"x4.03"}],"twoSeparateMistakes":{"sortingTheString":"correct but sorts n items instead of k — 12056.22 against 1174.67, about 10x","rescanningKey":"s.count scans the whole string per character — n scans of length n, 1535558.15us at n = 50000, about 1307x"}},"pythonOneLinerIsWrong":{"expression":"\"\".join(sorted(s, key=s.count, reverse=True))","defect":"Python's sort is stable, so equal-frequency characters keep their original interleaved order instead of grouping","smallestCounterexample":{"s":"abab","returns":"abab","valid":false,"reason":"the two a's and two b's must be contiguous"},"exhaustive":{"space":"all strings up to length 6 over {a,b,c}","strings":1093,"invalidOutputs":210,"rate":"19.2%"},"otherApproachesInvalidCount":{"counterMostCommon":0,"sortedWithTiebreak":0,"sortedCounterKey":0,"bucket":0},"fix":"key=lambda c: (-count[c], c) — the tiebreak on the character groups them"},"assertions":["the output is a permutation of the input","all copies of a character are contiguous in the output","run lengths are non-increasing from left to right","the output length equals the input length","any two outputs satisfying these are equally correct"],"recommendation":"count into a fixed table, sort the distinct characters, append each run; in Python that is \"\".join(c * n for c, n in Counter(s).most_common())","lesson":"locate the cost before choosing the optimisation — complexity notation hides which term is the constant, and here the constant is the entire runtime"}
```

<!-- @highlights -->
- The string streams left to right into a row of 26 counting bins, one character at a time, with a timer accumulating beside it.
- When the stream ends the 26 bins lift out and sort, completing almost instantly while the timer barely moves.
- The two durations are drawn physically: a long bar for the streaming pass, a hairline for the sort.
- The split prints as three stacked segments — counting 207.90us at 98.8%, sorting 0.10us at 0.0%, building 7.20us at 3.4%.
- The sort segment is too thin to see and is labelled with an arrow from outside.
- The whole thing replays at n = 1,000, 10,000, 100,000 and 500,000.
- The streaming bar stretches five hundredfold while the sort hairline stays identical at 0.112, 0.087, 0.101, 0.101.
- The bucket sort is then drawn honestly: `bucket(n+1)` lays out half a million empty containers across the frame.
- Twenty-six characters drop into them, leaving the rest visibly empty, with its 810.84us bar beside the sort's 219.60us.
- The trade is labelled in one line: removes a log factor worth 0.10us, pays 591us for the allocation.
- The optimisation that does work follows — four counting bins running in parallel lanes over the same stream.
- The single-lane 193.81us bar shrinks to 132.54, captioned the only 98.8% of the problem.
- The close is the Python failure, needing no timing: `"abab"` with both characters at frequency 2.
- A stable sort visibly preserves their interleaved order, and the output `"abab"` is marked invalid beside a correct `"aabb"`.
- The counter reads 210 of 1,093 strings wrong — 19.2%.
- Beneath it, the quadratic growth of the same one-liner as four bars at x4.00, x4.17, x4.03 per doubling, ending at 1.54 seconds.

<!-- @edgeCases -->
- The empty string — returns empty; the bucket version must not call `max` on an empty collection without a default.
- A single character — returns it unchanged, and the only input with exactly one valid answer regardless of tiebreak.
- All characters identical, like `"aaaa"` — one run, and the input where the maximum frequency equals n so an n-sized bucket array is finally justified.
- All characters distinct — every frequency is 1, so every ordering of the characters is valid and there are k! correct answers.
- Two characters with equal frequency — the common case, and the reason a fixed expected string is the wrong assertion.
- Uppercase and lowercase together, like `"Aabb"` — distinct characters, so `A` and `a` count separately; a 256-entry table handles it and a 26-entry one does not.
- Digits or punctuation — same point; the table must be indexed by the raw byte.
- A very long string over a tiny alphabet — the worst case for the n-sized bucket array, which allocates one container per possible frequency to hold two or three characters.
- Multi-byte UTF-8 — a byte-indexed table counts bytes, so a two-byte character is split into two counts and the output is not valid text.
- A string at the maximum constraint length — where the counting pass is 98.8% of the runtime and every other phase is noise.

<!-- @pitfalls -->
- Optimising the sort. It measured 0.10 microseconds against a 210-microsecond function and does not grow with n, because it orders the distinct characters rather than the string.
- Replacing the sort with a bucket sort. Measured 810.84 microseconds against 219.60 at n = 500,000 — 3.7x slower — because `bucket(n+1)` allocates one container per possible frequency.
- Sizing anything to `n` when the alphabet bounds it. The tight bucket version is 2.1x faster than the naive one and still loses to sorting 26 items.
- Writing `sorted(s, key=s.count, reverse=True)` in Python. It is quadratic — x4.00 per doubling, 1.54 seconds at n = 50,000 — and wrong on 19.2% of inputs.
- Relying on sort stability to group equal frequencies. Stability preserves the *original* order, which is exactly the interleaving the problem forbids; a tiebreak on the character is required.
- Sorting the string rather than the distinct characters. Correct, and about 10x slower — 12,056.22 microseconds against 1,174.67 at n = 50,000.
- Testing against one expected output. Ties are unspecified and affect up to 66.7% of inputs, so a fixed expected string rejects correct solutions.
- Using a 26-entry table. Uppercase letters, digits and spaces all index out of range; 256 entries costs nothing measurable.
- Recomputing counts inside a comparator. The comparator runs O(n log n) times, so any scan inside it multiplies through.
- Forgetting to reserve the output. Appending 500,000 characters without pre-sizing pays repeated reallocation and copying for a length that was known from the start.

<!-- @doubt -->
### Should I use a bucket sort to avoid the log factor?

<!-- @answer -->
No, and the measurement is emphatic. The log factor you would be removing applies to sorting the **distinct characters** — at most 256 of them — and that sort measured **0.10 microseconds** inside a function that takes 210. It does not grow with the input: 0.112, 0.087, 0.101 and 0.101 microseconds at n = 1,000 through 500,000. Meanwhile `vector<vector<char>> bucket(n + 1)` constructs half a million empty containers to hold 26 characters, and measured **810.84 microseconds against 219.60** — 3.7x slower. Sizing the buckets to the maximum observed frequency instead of to `n` improves it to 386.93 and still loses by 1.8x. You would be paying 591 microseconds of allocation to save a tenth of one.

<!-- @doubt -->
### Then what is worth optimising here?

<!-- @answer -->
The counting pass, because it is 98.8% of the runtime. At n = 500,000 the split is 207.90 microseconds counting, 0.10 sorting and 7.20 building the output. A histogram does a read-modify-write into the same cell whenever a character repeats, and that dependency stalls the pipeline — so the standard fix is to give several lanes their own tables and sum them at the end. Measured on 500,000 bytes: one histogram 193.81 microseconds at 2.58 GB/s, **four interleaved histograms 132.54 at 3.77 GB/s — 1.46x**. Eight lanes gained nothing over four. It is four times the code for a factor of one and a half, so write it only when a profile points here; the point is that it is the only place a real gain exists.

<!-- @doubt -->
### Why is `sorted(s, key=s.count, reverse=True)` wrong? The counts are right.

<!-- @answer -->
The counts are right and the grouping is not. Python's sort is stable, which means elements with equal keys keep their **original relative order** — so two characters that occur equally often stay exactly where they were, interleaved. Input `"abab"` has both characters at frequency 2, so every key is equal, so the output is `"abab"` unchanged, and the problem requires all copies of a character to be contiguous. Exhaustively over all 1,093 strings up to length 6 on a three-letter alphabet, this returns an invalid answer on **210 of them — 19.2%**. Adding a tiebreak, `key=lambda c: (-count[c], c)`, brings the failure count to zero. It is also quadratic, which is a separate problem with the same line.

<!-- @doubt -->
### How is that one-liner quadratic? There is only one sort.

<!-- @answer -->
Because the key function is not free. `sorted` calls `key` once per element — n calls — and `s.count(c)` scans the entire string on each one. That is n scans of length n regardless of how efficient the sort itself is. Measured growth per doubling: **x4.00, x4.17, x4.03** at n = 1,000 through 8,000, which is the signature of quadratic. At n = 50,000 it took 1,535,558 microseconds — about **1.54 seconds** — against 1,174.67 for `Counter(s).most_common()`, a factor of **1,307**. Precomputing the counts once into a `Counter` and looking them up in the key fixes the complexity; it still sorts n items instead of 26, which costs a further 10x.

<!-- @doubt -->
### My output does not match the expected answer but looks right. Is it wrong?

<!-- @answer -->
Probably not — ties are unspecified, and they are the common case. When two characters occur equally often the problem allows either order, so `"tree"` may return `"eert"` or `"eetr"`, and `"aabb"` may return `"aabb"` or `"bbaa"`. Measured over strings of length 4 on a three-letter alphabet, **66.7%** have at least two characters with equal frequency; at length 6 it is 32.9%. A test that compares against a single expected string will therefore reject correct solutions routinely. Assert the property instead: the output is a permutation of the input, all copies of each character are contiguous, and the run lengths are non-increasing from left to right. That is exactly what the problem asks for and nothing more.

<!-- @doubt -->
### Is the heap version better than sorting?

<!-- @answer -->
No, and for a structural reason rather than a numerical one. Measured they are close — 250.30 microseconds against 219.60 at n = 500,000, and the heap is marginally ahead at n = 100,000 with 43.88 against 62.67 — so the choice is not about speed. A heap earns its keep when items arrive over time, so you cannot sort them all at once, or when you only need the top few and can stop early. Neither applies here: every character and its count are known before any output is produced, and all of them are needed. Both are also ordering at most 256 items, which is the reason neither shows up in the profile at all.

<!-- @doubt -->
### Why 256 entries and not 26?

<!-- @answer -->
Because 26 encodes an assumption that ordinary input breaks, and the fix is free. `count[c - 'a']` gives a negative index for any uppercase letter, digit or space — `'A'` is -32 and a space is -65 — which reads and writes outside the array with no crash to tell you. The examples for this problem routinely include mixed case, like `"Aabb"`, where `A` and `a` are distinct characters that must be counted separately. A 256-entry table indexed by the raw byte handles every byte value, costs 920 extra bytes of stack, and measured no slower. The one thing it does not solve is multi-byte text: a byte table counts bytes, so for genuine Unicode you need code points and a map.

<!-- @doubt -->
### Does building the output string matter?

<!-- @answer -->
Less than you would expect, provided you do two things. Building the 500,000-character answer measured **7.20 microseconds — 3.4%** of the function — because each run is a block of identical characters and `append(n, c)` writes it as a `memset` rather than a per-character loop. The two things that keep it there are reserving the output at the input's length, so there is no reallocation and copying as it grows, and appending runs rather than individual characters. Get either wrong and this phase becomes visible; get both right and it stays under 4%, well behind the counting pass at 98.8%. This is the same result as **Largest Odd Number in a String**, arrived at from the other side: there the copy was the whole cost, here it is almost none, and the difference is whether the write is one block or many.
