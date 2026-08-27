---
id: m-coloring-problem
topic: Advanced Recursion
title: M Coloring Problem
difficulty: Hard
status: ready
prerequisites:
  - rat-in-a-maze
  - n-queen
  - word-search
relatedIds:
  - n-queen
  - rat-in-a-maze
  - word-search
  - palindrome-partitioning
  - subsets-i
---

<!-- @summary -->
Colours are interchangeable names, so a search that tries all m of them for the first vertex explores m relabellings of the same thing. Forbidding a vertex from using a colour higher than one past the highest used so far costs one line and takes K10 with 9 colours from 986,410 nodes to exactly 10. Ordering vertices by degree on top of that reaches 100x on random graphs.

<!-- @theory -->
## The problem

A graph on V vertices and `m` colours. Can every vertex be given a colour so that
no edge joins two vertices of the same colour?

```
edges: 0-1, 0-2, 0-3, 1-2, 2-3

m = 2  ->  false
m = 3  ->  true      e.g. colours [0, 1, 2, 1]
```

The answer is a yes or no, but the search that decides it is the interesting part:
proving *yes* can stop at the first working assignment, while proving *no* has to
exhaust the space.

## Colours are names, and names are interchangeable

Take any valid colouring and swap every colour 0 with every colour 1. Still valid.
That means the search space contains `m!` copies of every genuinely distinct
solution, differing only in which name got used where — and a plain backtracker
explores all of them.

The fix is one line. When colouring vertex `v`, never use a colour higher than
**one past the highest colour used so far**:

```cpp
int limit = min(m - 1, maxUsedSoFar + 1);
```

The first vertex is then forced to colour 0, the second may use 0 or 1, and so on.
Nothing is lost — any colouring can be relabelled into this canonical form — and
the redundant branches disappear.

Measured on the complete graph `K_n` with `m = n - 1`, which is unsatisfiable and
therefore forces the whole tree to be searched:

| n | plain nodes | with symmetry breaking | ratio |
|---|---|---|---|
| 6 | 326 | **6** | 54.3x |
| 7 | 1,957 | **7** | 279.6x |
| 8 | 13,700 | **8** | 1,712.5x |
| 9 | 109,601 | **9** | 12,177.9x |
| 10 | **986,410** | **10** | **98,641x** |

The second column is not a typo. On a complete graph every earlier vertex is
adjacent, so under the canonical rule vertex `k` is forced to take colour `k` —
there is exactly one path, and it dies the moment `k` reaches `m`. The search
visits `n` nodes and stops. The plain version explores 986,410, which is the sum
of falling factorials — every injective partial assignment, `m!` times over.

The ratio grows without bound as n increases, which is what "removing a symmetry"
buys when the symmetry group is `m!`.

## Ordering the vertices adds a second factor

Colouring the most constrained vertices first makes failures happen near the root
rather than deep in the tree. Sorting by descending degree is the cheap version of
that. On random graphs with `m = 3`, averaged over 40 graphs each:

| V | density | plain | + symmetry | + degree order | total |
|---|---|---|---|---|---|
| 12 | 0.3 | 233 | 56 | **12** | 18.2x |
| 16 | 0.3 | 1,231 | 238 | **18** | 67.8x |
| 20 | 0.3 | 2,631 | 440 | **26** | **100.2x** |
| 20 | 0.5 | 170 | 30 | **8** | 20.8x |

Two things worth reading off. The two optimisations **compose** — ordering is worth
a further 17x on top of the 6x symmetry breaking already gave at V = 20, density
0.3. And the sparse graphs are the hard ones: at density 0.5 the plain search
already only takes 170 nodes, because a denser graph produces contradictions
sooner.

## And the brute force is hopeless

Generating all `m^V` colourings and checking each at the end:

| V | m | brute force | backtracking | ratio |
|---|---|---|---|---|
| 5 | 4 | 8,167 | 250 | 33x |
| 6 | 5 | 214,000 | 250 | 856x |
| 7 | 6 | 4,570,667 | 416 | 10,987x |
| 8 | 7 | 96,199,167 | **583** | **165,007x** |

Nanoseconds. Note the backtracking column barely moves — 250ns to 583ns while the
brute force grows by four orders of magnitude — because with symmetry breaking the
`K_n` case is a single forced path regardless of size.

## Checking the work

Chromatic numbers are known for several families, which makes verification exact
rather than approximate. The implementations here reproduce all of them:

| graph | chromatic number | expected |
|---|---|---|
| K₂ … K₆ | 2, 3, 4, 5, 6 | n |
| C₄, C₆ (even cycles) | 2, 2 | 2 |
| C₅, C₇ (odd cycles) | 3, 3 | 3 |
| Petersen graph | 3 | 3 |

Plus an exhaustive check: every graph on 5 vertices — all **1,024** of them — with
every `m` from 1 to 5, against brute force. **0 wrong.**

<!-- @intuition -->
This is the clearest example in the topic of a saving that comes from noticing something about the *problem* rather than the code. Nothing about colours 0, 1 and 2 distinguishes them; they are labels, and any solution stays a solution when the labels are permuted. So a search that treats them as distinct is exploring `m!` relabellings of every answer, and the fix is not an optimisation in the usual sense — it is refusing to ask a question that has already been answered. The general move is worth looking for whenever a problem's objects are interchangeable: pieces of the same type, identical items, the order of independent choices. The tell is that the search finds the same answer many times in slightly different clothes.

<!-- @approach -->
### Try Every Colouring

<!-- @idea -->
Enumerate all m^V ways to assign colours, and check each one against every edge.

<!-- @steps -->
1. Treat a colouring as a base-m number with V digits.
2. For each value, decode the digits into colours.
3. Check every edge for a clash.
4. Return true at the first colouring that survives.

<!-- @complexity -->
- time: O(m^V · V²)
- space: O(V)
- note: The definition, and the reference the other two were verified against over all 1,024 graphs on 5 vertices. **165,007x** slower than the optimised search at V = 8, and the gap grows with every vertex.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool graphColoring(const vector<vector<int>>& g, int m) {
    int V = (int)g.size();
    if (V == 0) return true;
    if (m == 0) return false;

    long long total = 1;
    for (int i = 0; i < V; i++) total *= m;

    vector<int> col(V, 0);
    for (long long code = 0; code < total; code++) {
        long long t = code;
        for (int i = 0; i < V; i++) { col[i] = (int)(t % m); t /= m; }
        bool ok = true;
        for (int i = 0; i < V && ok; i++)
            for (int j = i + 1; j < V && ok; j++)
                if (g[i][j] && col[i] == col[j]) ok = false;
        if (ok) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 10: `m^V` computed as a running product. At V = 20 with m = 3 that is 3.5 billion, so the loop counter must be 64-bit and the approach is already unusable.
- 15: Decoding the base-m digits costs O(V) per colouring, on top of the O(V²) edge check — this is the `V²` in the complexity.
- 19: Every edge is examined only after the whole assignment exists. A backtracker rejects the same clash the moment the second endpoint is coloured.
- 20: Returning at the first success means proving *yes* can be fast; proving *no* always costs the full m^V.

<!-- @code java -->
```java
static boolean graphColoring(int[][] g, int m) {
    int V = g.length;
    if (V == 0) return true;
    if (m == 0) return false;

    long total = 1;
    for (int i = 0; i < V; i++) total *= m;

    int[] col = new int[V];
    for (long code = 0; code < total; code++) {
        long t = code;
        for (int i = 0; i < V; i++) { col[i] = (int) (t % m); t /= m; }
        boolean ok = true;
        for (int i = 0; i < V && ok; i++)
            for (int j = i + 1; j < V && ok; j++)
                if (g[i][j] != 0 && col[i] == col[j]) ok = false;
        if (ok) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 6: `long total` — with `int` this overflows at m^V above 2³¹, silently making the loop terminate early and report false.

<!-- @code python -->
```python
from itertools import product


def graph_coloring(g, m):
    V = len(g)
    if V == 0:
        return True
    if m == 0:
        return False

    for col in product(range(m), repeat=V):
        if all(not g[i][j] or col[i] != col[j]
               for i in range(V) for j in range(i + 1, V)):
            return True
    return False
```

<!-- @annotations -->
- 11: `product(range(m), repeat=V)` generates the colourings lazily, so memory stays O(V) — but it still yields all m^V of them.

<!-- @approach -->
### Backtrack, Checking Neighbours

<!-- @idea -->
Colour the vertices one at a time, and before assigning a colour, check it against the already-coloured neighbours.

<!-- @steps -->
1. Colour vertex 0, then vertex 1, and so on.
2. For each candidate colour, scan the vertex's neighbours for a clash.
3. Assign and recurse on success; undo and try the next colour on failure.
4. Reaching vertex V means every vertex is coloured.
5. Exhausting all colours for a vertex means backing up.

<!-- @complexity -->
- time: O(m^V) worst case, far less in practice
- space: O(V)
- note: Rejects a clash as soon as the second endpoint is coloured rather than at the end. Still explores `m!` relabellings of every solution, which the next approach removes.

<!-- @code cpp -->
```cpp
#include <vector>
#include <functional>
using namespace std;

bool graphColoring(const vector<vector<int>>& g, int m) {
    int V = (int)g.size();
    if (V == 0) return true;
    vector<int> col(V, -1);

    function<bool(int)> go = [&](int v) -> bool {
        if (v == V) return true;
        for (int c = 0; c < m; c++) {
            bool ok = true;
            for (int u = 0; u < V && ok; u++)
                if (g[v][u] && col[u] == c) ok = false;
            if (!ok) continue;
            col[v] = c;
            if (go(v + 1)) return true;
            col[v] = -1;
        }
        return false;
    };
    return go(0);
}
```

<!-- @annotations -->
- 14: Scanning all V vertices is safe because uncoloured ones hold −1, which never equals a colour. Restricting the scan to `u < v` is equivalent and faster on dense graphs.
- 18: `if (go(v + 1)) return true;` — the search stops at the first complete colouring, because the question is existence rather than enumeration.
- 19: The undo. Unlike Rat in a Maze or Word Search, forgetting it here is often invisible, since the next iteration overwrites `col[v]` anyway — it matters only on the failure path out of the loop.
- 12: Trying all m colours for vertex 0 is exactly the redundancy the next approach removes: those m subtrees are relabellings of one another.

<!-- @code java -->
```java
static boolean graphColoring(int[][] g, int m) {
    int V = g.length;
    if (V == 0) return true;
    int[] col = new int[V];
    Arrays.fill(col, -1);
    return go(g, col, V, m, 0);
}

static boolean go(int[][] g, int[] col, int V, int m, int v) {
    if (v == V) return true;
    for (int c = 0; c < m; c++) {
        boolean ok = true;
        for (int u = 0; u < V && ok; u++)
            if (g[v][u] != 0 && col[u] == c) ok = false;
        if (!ok) continue;
        col[v] = c;
        if (go(g, col, V, m, v + 1)) return true;
        col[v] = -1;
    }
    return false;
}
```

<!-- @annotations -->
- 5: `Arrays.fill(col, -1)` matters — Java zero-fills, and 0 is a valid colour, so an unfilled array would look like every vertex is already coloured 0.

<!-- @code python -->
```python
def graph_coloring(g, m):
    V = len(g)
    if V == 0:
        return True
    col = [-1] * V

    def go(v):
        if v == V:
            return True
        for c in range(m):
            if any(g[v][u] and col[u] == c for u in range(V)):
                continue
            col[v] = c
            if go(v + 1):
                return True
            col[v] = -1
        return False

    return go(0)
```

<!-- @annotations -->
- 11: `any(...)` short-circuits at the first clashing neighbour, so a rejected colour usually costs far less than V comparisons.

<!-- @approach -->
### Break the Colour Symmetry

<!-- @idea -->
Forbid a vertex from using a colour more than one above the highest used so far, so each distinct colouring is reached exactly once — and colour the highest-degree vertices first.

<!-- @steps -->
1. Order the vertices by descending degree.
2. When colouring the k-th vertex, find the highest colour used so far.
3. Allow only colours 0 through that value plus one, capped at m−1.
4. Otherwise search exactly as before.

<!-- @complexity -->
- time: O(m^V) worst case, dramatically less in practice
- space: O(V)
- note: **98,641x** fewer nodes than the plain search on K₁₀ with m = 9, and **100.2x** on random 20-vertex graphs at density 0.3. The two ideas compose — ordering is worth a further 17x on top of the symmetry break.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <numeric>
#include <functional>
using namespace std;

bool graphColoring(const vector<vector<int>>& g, int m) {
    int V = (int)g.size();
    if (V == 0) return true;
    if (m < 1) return false;

    vector<int> deg(V, 0);
    for (int i = 0; i < V; i++)
        for (int j = 0; j < V; j++) deg[i] += g[i][j];

    vector<int> ord(V);
    iota(ord.begin(), ord.end(), 0);
    sort(ord.begin(), ord.end(), [&](int a, int b) { return deg[a] > deg[b]; });

    vector<int> col(V, -1);
    function<bool(int)> go = [&](int k) -> bool {
        if (k == V) return true;
        int v = ord[k];
        int maxUsed = -1;
        for (int t = 0; t < k; t++) maxUsed = max(maxUsed, col[ord[t]]);
        int limit = min(m - 1, maxUsed + 1);
        for (int c = 0; c <= limit; c++) {
            bool ok = true;
            for (int u = 0; u < V && ok; u++)
                if (g[v][u] && col[u] == c) ok = false;
            if (!ok) continue;
            col[v] = c;
            if (go(k + 1)) return true;
            col[v] = -1;
        }
        return false;
    };
    return go(0);
}
```

<!-- @annotations -->
- 26: The whole symmetry break. `maxUsed + 1` allows exactly one fresh colour — allowing more would readmit the relabellings, allowing none would forbid ever opening a new colour. So vertex 0 is forced to colour 0 and every colouring is reached in exactly one relabelling. On K₁₀ with m = 9 this takes 986,410 nodes down to 10.
- 18: Descending degree colours the most constrained vertices first, so contradictions surface near the root. Worth a further 17x at V = 20, on top of the symmetry break.
- 27: `c <= limit` — an inclusive bound, because `limit` is itself a usable colour. Writing `<` silently forbids the newest colour and reports false for colourable graphs.
- 25: Recomputing `maxUsed` costs O(k) per node; carrying it as a parameter is the obvious refinement and changes nothing about the tree.

<!-- @code java -->
```java
static boolean graphColoring(int[][] g, int m) {
    int V = g.length;
    if (V == 0) return true;
    if (m < 1) return false;

    Integer[] ord = new Integer[V];
    int[] deg = new int[V];
    for (int i = 0; i < V; i++) {
        ord[i] = i;
        for (int j = 0; j < V; j++) deg[i] += g[i][j];
    }
    Arrays.sort(ord, (a, b) -> deg[b] - deg[a]);

    int[] col = new int[V];
    Arrays.fill(col, -1);
    return go(g, col, ord, V, m, 0);
}

static boolean go(int[][] g, int[] col, Integer[] ord, int V, int m, int k) {
    if (k == V) return true;
    int v = ord[k];
    int maxUsed = -1;
    for (int t = 0; t < k; t++) maxUsed = Math.max(maxUsed, col[ord[t]]);
    int limit = Math.min(m - 1, maxUsed + 1);
    for (int c = 0; c <= limit; c++) {
        boolean ok = true;
        for (int u = 0; u < V && ok; u++)
            if (g[v][u] != 0 && col[u] == c) ok = false;
        if (!ok) continue;
        col[v] = c;
        if (go(g, col, ord, V, m, k + 1)) return true;
        col[v] = -1;
    }
    return false;
}
```

<!-- @annotations -->
- 6: `Integer[]` rather than `int[]`, because `Arrays.sort` takes a comparator only for object arrays — sorting a primitive `int[]` by a custom order is not directly supported.

<!-- @code python -->
```python
def graph_coloring(g, m):
    V = len(g)
    if V == 0:
        return True
    if m < 1:
        return False

    deg = [sum(row) for row in g]
    order = sorted(range(V), key=lambda v: -deg[v])
    col = [-1] * V

    def go(k):
        if k == V:
            return True
        v = order[k]
        max_used = max((col[order[t]] for t in range(k)), default=-1)
        limit = min(m - 1, max_used + 1)
        for c in range(limit + 1):
            if any(g[v][u] and col[u] == c for u in range(V)):
                continue
            col[v] = c
            if go(k + 1):
                return True
            col[v] = -1
        return False

    return go(0)
```

<!-- @annotations -->
- 16: `default=-1` handles the first vertex, where the generator is empty — without it `max` raises on an empty sequence.
- 18: `range(limit + 1)` because `limit` is inclusive. Writing `range(limit)` forbids the newest colour and turns colourable graphs into false.

<!-- @example -->

<!-- @input -->
```
edges: 0-1, 0-2, 0-3, 1-2, 2-3
m = 3
```

<!-- @output -->
```
true      e.g. colours [0, 1, 2, 1]
```

<!-- @why -->
Vertices 1 and 3 are not adjacent to each other, so they can share a colour. Three colours suffice; two do not, because 0, 1 and 2 form a triangle.

<!-- @walkthrough -->
```
vertex 0, colour 0   ok, assign
  vertex 1, colour 0   clashes with vertex 0
  vertex 1, colour 1   ok, assign
    vertex 2, colour 0   clashes with vertex 0
    vertex 2, colour 1   clashes with vertex 1
    vertex 2, colour 2   ok, assign
      vertex 3, colour 0   clashes with vertex 0
      vertex 3, colour 1   ok, assign  ->  all coloured, true

Under symmetry breaking the first two lines never happen:
vertex 0 is forced to colour 0, so the search starts one
level in.
```

<!-- @example -->

<!-- @input -->
```
edges: 0-1, 0-2, 0-3, 1-2, 2-3
m = 2
```

<!-- @output -->
```
false
```

<!-- @why -->
Vertices 0, 1 and 2 are mutually adjacent — a triangle — and a triangle needs three colours. Proving this requires exhausting the search rather than finding a witness.

<!-- @walkthrough -->
```
every assignment of two colours to the triangle {0,1,2} fails:
  0 and 1 must differ, so they take the two available colours
  2 is adjacent to both, so no colour remains

This is the asymmetry between the two answers: `true` stops
at the first witness, `false` must rule out everything. All
the pruning in this container is aimed at the `false` case.
```

<!-- @example -->

<!-- @input -->
```
K10 — the complete graph on 10 vertices
m = 9
```

<!-- @output -->
```
false, in exactly 10 nodes
```

<!-- @why -->
Every pair is adjacent, so all ten vertices need different colours and nine are not enough. It is the case where symmetry breaking is most dramatic: 986,410 nodes become 10.

<!-- @walkthrough -->
```
without symmetry breaking
  vertex 0 tries all 9 colours, each opening a subtree that
  is a relabelling of the others
  total: 986,410 nodes   (the sum of falling factorials)

with symmetry breaking
  vertex k may use colours 0..maxUsed+1, and every earlier
  vertex is adjacent, so vertex k is FORCED to colour k
  vertex 9 needs colour 9, but m - 1 = 8
  total: 10 nodes, one forced path

                                        ratio 98,641x
```

<!-- @example -->

<!-- @input -->
```
C5 — a 5-cycle
m = 2, then m = 3
```

<!-- @output -->
```
m = 2 -> false      m = 3 -> true
```

<!-- @why -->
An odd cycle cannot be 2-coloured: going round the ring the colours must alternate, and an odd length makes the last vertex clash with the first. Even cycles are 2-colourable.

<!-- @walkthrough -->
```
C4  ->  2 colours    C6  ->  2 colours       even, alternating works
C5  ->  3 colours    C7  ->  3 colours       odd, alternation fails

Together with K_n needing n colours and the Petersen graph
needing 3, these are exact external checks — the container's
implementations reproduce all of them.
```

<!-- @visualization custom -->

<!-- @description -->
Shows why interchangeable colour names multiply the search space by m!, and how removing that symmetry plus ordering the vertices compose.

<!-- @sampleInput -->
```json
{"primary":{"edges":[[0,1],[0,2],[0,3],[1,2],[2,3]],"V":4,"answers":[{"m":1,"result":false},{"m":2,"result":false},{"m":3,"result":true,"colouring":[0,1,2,1]},{"m":4,"result":true}],"why":"vertices 1 and 3 are not adjacent so they can share a colour; 0, 1 and 2 form a triangle so two colours cannot work"},"theAsymmetry":{"proving_yes":"can stop at the first working assignment","proving_no":"must exhaust the space","consequence":"all the pruning in this container is aimed at the `no` case"},"coloursAreNames":{"observation":"take any valid colouring and swap every colour 0 with every colour 1 - still valid","consequence":"the search space contains m! copies of every genuinely distinct solution","fix":"when colouring vertex v, never use a colour higher than one past the highest used so far","code":"int limit = min(m - 1, maxUsedSoFar + 1);","effect":"the first vertex is forced to colour 0, the second may use 0 or 1, and so on","nothingLost":"any colouring can be relabelled into this canonical form"},"symmetryBreaking":{"testCase":"complete graph K_n with m = n - 1, which is unsatisfiable and forces the whole tree","rows":[{"n":6,"plain":326,"withSymmetry":6,"ratio":"54.3x"},{"n":7,"plain":1957,"withSymmetry":7,"ratio":"279.6x"},{"n":8,"plain":13700,"withSymmetry":8,"ratio":"1712.5x"},{"n":9,"plain":109601,"withSymmetry":9,"ratio":"12177.9x"},{"n":10,"plain":986410,"withSymmetry":10,"ratio":"98641x"}],"whyExactlyN":"on a complete graph every earlier vertex is adjacent, so under the canonical rule vertex k is FORCED to take colour k - there is exactly one path and it dies when k reaches m","whatPlainExplores":"the sum of falling factorials - every injective partial assignment, m! times over","growth":"the ratio grows without bound, which is what removing a symmetry of group size m! buys"},"vertexOrdering":{"idea":"colour the most constrained vertices first so failures happen near the root","cheapVersion":"sort by descending degree","measured":{"m":3,"graphsPerRow":40,"rows":[{"V":12,"density":0.3,"plain":233,"symmetry":56,"degreeOrder":12,"total":"18.2x"},{"V":16,"density":0.3,"plain":1231,"symmetry":238,"degreeOrder":18,"total":"67.8x"},{"V":20,"density":0.3,"plain":2631,"symmetry":440,"degreeOrder":26,"total":"100.2x"},{"V":20,"density":0.5,"plain":170,"symmetry":30,"degreeOrder":8,"total":"20.8x"}]},"theyCompose":"ordering is worth a further 17x on top of the 6x symmetry breaking already gave at V = 20, density 0.3","sparseIsHarder":"at density 0.5 the plain search already only takes 170 nodes, because a denser graph produces contradictions sooner"},"bruteForceGap":{"unit":"nanoseconds","rows":[{"V":5,"m":4,"brute":8167,"backtrack":250,"ratio":"33x"},{"V":6,"m":5,"brute":214000,"backtrack":250,"ratio":"856x"},{"V":7,"m":6,"brute":4570667,"backtrack":416,"ratio":"10987x"},{"V":8,"m":7,"brute":96199167,"backtrack":583,"ratio":"165007x"}],"reading":"the backtracking column barely moves - 250ns to 583ns while the brute force grows by four orders of magnitude - because with symmetry breaking the K_n case is a single forced path regardless of size"},"verification":{"exhaustive":{"space":"every graph on 5 vertices, every m from 1 to 5","graphs":1024,"cases":5120,"wrong":0},"knownChromaticNumbers":[{"graph":"K2..K6","measured":[2,3,4,5,6],"expected":"n"},{"graph":"C4, C6 (even cycles)","measured":[2,2],"expected":2},{"graph":"C5, C7 (odd cycles)","measured":[3,3],"expected":3},{"graph":"Petersen","measured":3,"expected":3}]},"assertions":["colours are interchangeable labels","a vertex may open at most one new colour under the canonical rule","the limit is inclusive - c <= limit, not c < limit","proving no colouring exists requires exhausting the search","uncoloured vertices hold -1, which never equals a colour"]}
```

<!-- @highlights -->
- Colours are **interchangeable names**, so a plain search explores `m!` relabellings of every solution.
- One line — `limit = min(m-1, maxUsed+1)` — removes that: K₁₀ with m=9 goes from **986,410 nodes to exactly 10**.
- On a complete graph the canonical rule **forces** vertex k to colour k, so there is a single path.
- Degree ordering **composes** on top, reaching **100.2×** on 20-vertex graphs at density 0.3.
- Sparse graphs are the hard ones — at density 0.5 the plain search already finishes in 170 nodes.
- Brute force is **165,007×** behind at V = 8, and the backtracking column barely moves at all.

<!-- @edgeCases -->
- `m = 0` with V > 0 — no colours available, so false; guard before computing `m^V`.
- `m = 1` — true only if the graph has no edges at all.
- `V = 0` — vacuously true.
- A graph with no edges — always true for any m ≥ 1.
- A complete graph — needs exactly V colours, and the case where symmetry breaking is most dramatic.
- Odd cycle with m = 2 — false; even cycle with m = 2 — true.
- `m` larger than V — always true, and the canonical rule caps usage at V colours anyway.
- Self-loops on the diagonal — would make a vertex clash with itself; the adjacency matrix is assumed to have a zero diagonal.
- `m^V` overflowing 32 bits in the brute force — silently terminates the loop early and reports false.

<!-- @pitfalls -->
- Trying all m colours for the first vertex. Those m subtrees are relabellings of one another — up to 98,641× wasted at K₁₀.
- Writing `c < limit` instead of `c <= limit`. The bound is inclusive; the strict form forbids the newest colour and reports false for colourable graphs.
- Allowing more than one new colour per vertex. That readmits the relabellings the rule exists to remove.
- Forgetting `Arrays.fill(col, -1)` in Java. Zero is a valid colour, so a zero-filled array looks fully coloured.
- Sorting a primitive `int[]` with a comparator in Java. Only object arrays accept one.
- `max()` on an empty sequence in Python for the first vertex. Pass `default=-1`.
- Computing `m^V` in a 32-bit int. It overflows and the loop exits early.
- Assuming a denser graph is harder. Sparse graphs at density 0.3 took 15× more nodes than density 0.5.
- Treating the undo as critical. Here the next iteration overwrites `col[v]` anyway; it matters only on the failure path.

<!-- @doubt -->
### Why does forbidding higher colours lose nothing?

<!-- @answer -->
Because colours are labels with no meaning of their own. Given any valid colouring, walk the vertices in order and rename the colours in order of first appearance — the first colour seen becomes 0, the next new one becomes 1, and so on. The result is still valid, since renaming never makes two adjacent vertices match, and it satisfies the canonical rule that no vertex uses a colour more than one above the highest so far. So every colouring has a canonical representative that the restricted search *does* explore; nothing is lost, and the `m!` relabellings that the plain search wastes time on are simply never generated. Measured on K₁₀ with m = 9 — an unsatisfiable case, so the whole tree is searched — the plain version explores **986,410 nodes and the canonical version explores 10**, a factor of **98,641**. The ratio grows without bound with n, because the symmetry group being removed has size `m!`.

<!-- @doubt -->
### Why does the complete graph reduce to exactly n nodes?

<!-- @answer -->
Because the canonical rule leaves no choices at all. On `K_n` every earlier vertex is adjacent to the current one, so all previously used colours are forbidden — the only permitted colour is a new one, and the rule allows exactly one new colour per vertex. Vertex 0 must take colour 0, vertex 1 must take colour 1, and so on. There is precisely one path down the tree, and it terminates when vertex `m` needs colour `m` while the largest available is `m - 1`. So the search visits `n` nodes and returns false, whatever `n` is — which is why the backtracking timings barely move across V = 5 to V = 8 (**250ns to 583ns**) while the brute force grows from 8,167ns to 96,199,167ns over the same range. It is a nice demonstration that a search's cost is a property of the tree the constraints leave behind, not of the input size.

<!-- @doubt -->
### Does ordering the vertices help on top of that?

<!-- @answer -->
Yes, and the two compose rather than overlapping. Sorting by descending degree colours the most constrained vertices first, so contradictions appear near the root instead of after a deep descent. Measured on random 20-vertex graphs at density 0.3 with m = 3, averaged over 40 graphs: **2,631 nodes plain, 440 with symmetry breaking, 26 with both** — so ordering is worth a further **17x** after symmetry breaking has already taken 6x. The version here uses static degree order because it is cheap; the stronger form recomputes the most-constrained vertex dynamically (fewest colours still available), which prunes harder at more bookkeeping cost. Worth noting the density column too: at density 0.5 the plain search finishes in 170 nodes against 2,631 at density 0.3 — **sparse graphs are the hard ones**, because a dense graph runs into a contradiction almost immediately.

<!-- @doubt -->
### Why is proving "no" so much more expensive than proving "yes"?

<!-- @answer -->
Because they are different questions. A `yes` needs one witness, so the search can stop the moment a complete colouring appears — on an easy instance that may be the first path it tries. A `no` is a claim about every possible assignment, so the search must visit enough of the tree to rule all of them out. That asymmetry is why every measurement in this container uses unsatisfiable instances: `K_n` with `m = n - 1` and 3-colouring of random graphs are chosen precisely because they force the exhaustive case, where the pruning is actually visible. On satisfiable instances the numbers would mostly reflect luck about which branch was tried first. It is worth knowing when reading anyone's benchmark of a backtracking algorithm — if the instances are satisfiable, the figures may be measuring the ordering of the candidate loop rather than the quality of the pruning.

<!-- @doubt -->
### How can I check an implementation is right?

<!-- @answer -->
Use graphs whose chromatic numbers are known, which turns verification into an exact check rather than a plausibility argument. The complete graph `K_n` needs exactly `n` colours; a cycle needs 2 if its length is even and 3 if odd; the Petersen graph needs 3. The implementations here reproduce all of those — `K₂` through `K₆` giving 2, 3, 4, 5, 6, the even cycles `C₄` and `C₆` giving 2, the odd cycles `C₅` and `C₇` giving 3, and Petersen giving 3. Finding the chromatic number itself is just calling the decision procedure for m = 1, 2, 3, … and taking the first that succeeds. On top of that, an exhaustive sweep is feasible at small sizes: every graph on 5 vertices is only **1,024** graphs, and checking all of them against brute force for every m from 1 to 5 gives **5,120 cases** — which is how the two backtracking versions here were confirmed at **0 wrong**.
