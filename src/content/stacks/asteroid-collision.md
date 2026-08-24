---
id: asteroid-collision
topic: Stacks
title: Asteroid Collision
difficulty: Medium
status: ready
prerequisites:
  - next-greater-element
  - sum-of-subarray-minimums
  - implement-stack-using-arrays
  - balanced-paranthesis
relatedIds:
  - next-greater-element
  - sum-of-subarray-minimums
  - remove-k-digits
  - largest-rectangle-in-a-histogram
  - balanced-paranthesis
---

<!-- @summary -->
The first problem here where an arriving element can be destroyed by the stack rather than only destroying it, so the push becomes conditional and the "pushed exactly once" invariant becomes "at most once" — measured at **0.501 pushes per element** and 1.00 total stack operations, half the cost of the monotonic-stack problems. Verified against an independent simulation over 200,000 random fields with zero mismatches, and the outcome is order-independent: resolving collisions in random order instead of left to right gave identical results in **600,000** trials. The equal-magnitude case is the one people omit, and its visibility depends entirely on the test data — wrong on **38.47%** of small-magnitude inputs and **0.15%** of wide-magnitude ones.

<!-- @theory -->
## The problem

Each asteroid has a size and a direction: positive moves right, negative moves
left. When a right-mover meets a left-mover, the smaller by absolute value
explodes; if they are equal, both explode. Same-direction asteroids never meet,
and a left-mover followed by a right-mover moves apart.

```
[5, 10, -5]  ->  [5, 10]      the -5 loses to the 10
[8, -8]      ->  []           equal, both explode
[10, 2, -5]  ->  [10]         the -5 destroys the 2, then loses to the 10
```

## A collision needs a specific pair

Only one arrangement collides: something moving **right** immediately followed by
something moving **left**. That is `stack.top() > 0 && incoming < 0`. Every other
combination is safe:

| Top | Incoming | Meet? |
|---|---|---|
| `+` | `+` | no — same direction |
| `−` | `−` | no — same direction |
| `−` | `+` | no — moving apart |
| `+` | `−` | **yes** |

So the algorithm is the familiar one — hold the unresolved elements on a stack —
with a new twist.

## The push is now conditional

In Next Greater Element and Sum of Subarray Minimums, every element was pushed
exactly once; the loop only ever decided *when* to pop. Here an arriving asteroid
may be destroyed before it ever reaches the stack, so the invariant weakens to
**at most once**.

Three outcomes per collision, and the code needs all three:

```
top < -incoming     the top explodes; keep checking against the new top
top > -incoming     the incoming explodes; stop, and do not push
top == -incoming    both explode; pop, stop, and do not push
```

Measured over 1,000,000 random asteroids:

| | Count | Per element |
|---|---|---|
| Pushes | 501,336 | **0.501** |
| Pops | 497,846 | 0.498 |
| Total stack operations | 999,182 | **1.00** |

Half the elements never make it onto the stack. That makes this *cheaper* than
the monotonic-stack problems, which run at 2.00 operations per element — an
unusual case where the extra complication buys work rather than costing it.

The breakdown of what each collision destroyed, at n = 100,000:

| Outcome | Count |
|---|---|
| Incoming only | 49,646 |
| Stack element only | 49,579 |
| **Both** | **244** |

## The equal case, and why it survives testing

That last row is the problem. With magnitudes drawn from 1 to 1000, mutual
destruction happens in about 0.25% of collisions — so an implementation that
omits the `==` branch is almost always right.

Omitting it, measured against the reference:

| Magnitudes | Wrong on |
|---|---|
| 1 to 4 | **38.47%** |
| 1 to 1000 | **0.15%** |

The same bug, the same code, a 250-fold difference in how often it shows up. Test
data drawn from a wide range hides it; the problem's own examples usually include
`[8, -8]` precisely because the authors knew that.

## The outcome does not depend on collision order

A reasonable worry: the stack resolves collisions left to right, but physically
they might happen in any order. Does the answer depend on which pair resolves
first?

No. Taking each of 200,000 random fields and repeatedly resolving a **randomly
chosen** collidable pair instead of the leftmost one, three times each —
**600,000 trials, 0 differing results**. The final configuration is well-defined,
which is what licenses the single left-to-right pass.

## Shapes

| Input, n = 100,000 | Pushes | Pops | Survivors | Ops/element |
|---|---|---|---|---|
| All right-moving | 100,000 | 0 | 100,000 | 1.00 |
| All left-moving | 100,000 | 0 | 100,000 | 1.00 |
| Right block then left block | 100,000 | 50,000 | 50,000 | **1.50** |
| Alternating `+1, −1` | 50,000 | 50,000 | **0** | 1.00 |

The worst case is a block of right-movers followed by a block of larger
left-movers — every left-mover walks down the stack destroying as it goes. The
alternating case annihilates completely: equal magnitudes in opposite directions,
so nothing survives.

Against the repeated-scan simulation: **91x** at n = 16,000, and 14x in Python.

## Where this goes next

**Sum of Subarray Ranges** returns to the span machinery, needing the maximum
version and the minimum version of Sum of Subarray Minimums at once — and the
tie asymmetry has to stay consistent between them, which is exactly where
deriving one from the other by flipping comparisons goes wrong.

<!-- @intuition -->
Everything to the left that is still moving right is a threat to anything arriving that moves left, and the most recent right-mover is the one that meets it first — so the unresolved right-movers form a stack in the order they will be encountered. What is new is that the encounter can go three ways rather than one. In the earlier problems an arriving element only ever settled the fate of things already waiting; here it might be the one that dies, and then it never joins the queue at all. That single change ripples: the loop needs a flag saying whether the newcomer is still alive, the push moves inside a condition, and the accounting shifts from "every element is pushed once" to "every element is pushed at most once". It also makes the algorithm cheaper rather than dearer, because an element destroyed on arrival costs nothing to store.

<!-- @approach -->
### Brute Force - Resolve Adjacent Collisions Until Stable

<!-- @idea -->
Scan for an adjacent right-then-left pair, resolve it, and start again until no such pair remains.

<!-- @steps -->
1. Scan the array for the first index where a positive is followed by a negative.
2. Compare magnitudes and delete the loser, or both if they are equal.
3. Restart the scan from the beginning, since the deletion may have created a new adjacency.
4. Stop when a full scan finds no collidable pair.
5. Note that restarting after every deletion is what makes this quadratic.

<!-- @complexity -->
- time: O(n^2) — up to n deletions, each restarting an O(n) scan and shifting the remaining elements
- space: O(n) for the mutable copy
- note: The reference the stack version was checked against, over 200,000 random fields with 0 mismatches. Measured 13,259,333ns at n = 16,000 against the stack's 145,166ns, a factor of 91, and 14x in Python. It is also the version used to test order-independence, by resolving a randomly chosen pair instead of the leftmost.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> asteroidCollision(vector<int> v) {
    bool changed = true;
    while (changed) {
        changed = false;
        for (size_t i = 0; i + 1 < v.size(); i++) {
            if (v[i] > 0 && v[i + 1] < 0) {                 // the only collidable pair
                int a = v[i], b = v[i + 1];
                if (a > -b)       v.erase(v.begin() + i + 1);
                else if (a < -b)  v.erase(v.begin() + i);
                else              v.erase(v.begin() + i, v.begin() + i + 2);
                changed = true;
                break;                                       // restart — this is the O(n^2)
            }
        }
    }
    return v;
}
```

<!-- @annotations -->
- 9: The direction test is the whole of the physics: positive then negative is the only arrangement that meets.
- 13: Both erased when the magnitudes match — the branch that an implementation is most likely to omit.
- 15: Restarting from index 0 after each deletion, because removing an element can create a new adjacency behind the current position.

<!-- @code java -->
```java
static int[] asteroidCollision(int[] input) {
    List<Integer> v = new ArrayList<>();
    for (int x : input) v.add(x);

    boolean changed = true;
    while (changed) {
        changed = false;
        for (int i = 0; i + 1 < v.size(); i++) {
            if (v.get(i) > 0 && v.get(i + 1) < 0) {
                int a = v.get(i), b = v.get(i + 1);
                if (a > -b)      v.remove(i + 1);
                else if (a < -b) v.remove(i);
                else { v.remove(i + 1); v.remove(i); }
                changed = true;
                break;
            }
        }
    }
    return v.stream().mapToInt(Integer::intValue).toArray();
}
```

<!-- @annotations -->
- 13: Removing index i + 1 before index i, or the second removal would target a shifted position — a classic ordering bug in list deletion.

<!-- @code python -->
```python
def asteroid_collision(v: list[int]) -> list[int]:
    v = list(v)
    changed = True
    while changed:
        changed = False
        for i in range(len(v) - 1):
            if v[i] > 0 and v[i + 1] < 0:
                a, b = v[i], v[i + 1]
                if a > -b:   del v[i + 1]
                elif a < -b: del v[i]
                else:        del v[i:i + 2]
                changed = True
                break
    return v


# 6.3ms at n = 2,000 against the stack's 0.45ms.
```

<!-- @annotations -->
- 11: del v[i:i+2] removes both in one slice, which sidesteps the index-shifting hazard the Java version has to work around.

<!-- @approach -->
### Optimal - A Stack With a Conditional Push

<!-- @idea -->
Hold the surviving asteroids on a stack; each arrival fights its way down until it wins, loses or annihilates.

<!-- @steps -->
1. Keep a stack of asteroids that have survived so far, in order.
2. For each arriving asteroid, mark it alive and enter the collision loop.
3. Collide only while the arrival is alive, the stack is non-empty, the top is positive and the arrival is negative.
4. Resolve one collision per iteration according to the three outcomes.
5. Push the arrival only if it is still alive when the loop ends.

<!-- @complexity -->
- time: O(n) — each element is pushed at most once and popped at most once
- space: O(n) for the stack, which is also the output
- note: 0 mismatches against the repeated-scan reference over 200,000 random fields. Measured 501,336 pushes over 1,000,000 asteroids — 0.501 per element — and 1.00 total stack operations per element, half the 2.00 of the monotonic-stack problems, because destroyed arrivals are never stored. Measured 145,166ns at n = 16,000 against the brute force's 13,259,333ns.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> asteroidCollision(const vector<int>& v) {
    vector<int> st;
    for (int x : v) {
        bool alive = true;
        while (alive && !st.empty() && st.back() > 0 && x < 0) {
            if (st.back() < -x) {
                st.pop_back();                 // the waiting one explodes; keep going
            } else if (st.back() == -x) {
                st.pop_back();                 // both explode
                alive = false;
            } else {
                alive = false;                 // the arrival explodes
            }
        }
        if (alive) st.push_back(x);            // conditional — this is what changed
    }
    return st;
}

// [5, 10, -5] -> [5, 10]     [8, -8] -> []     [10, 2, -5] -> [10]
```

<!-- @annotations -->
- 8: Four conditions, and all four are necessary: alive stops a dead arrival from colliding again, and the two sign tests are the only arrangement that meets.
- 10: No alive = false here, because the arrival survives this collision and must keep fighting down the stack.
- 12: The equal case, which is the branch most often omitted — measured wrong on 38.47% of small-magnitude inputs.
- 18: The push moved inside a condition, which is the entire structural difference from the earlier stack problems.

<!-- @code java -->
```java
static int[] asteroidCollision(int[] v) {
    Deque<Integer> st = new ArrayDeque<>();
    for (int x : v) {
        boolean alive = true;
        while (alive && !st.isEmpty() && st.peek() > 0 && x < 0) {
            if (st.peek() < -x)       st.pop();
            else if (st.peek() == -x) { st.pop(); alive = false; }
            else                       alive = false;
        }
        if (alive) st.push(x);
    }

    int[] res = new int[st.size()];
    for (int i = res.length - 1; i >= 0; i--) res[i] = st.pop();
    return res;
}
```

<!-- @annotations -->
- 13: ArrayDeque used as a stack pushes at the head, so draining it yields reverse order — filling the result backwards restores the original ordering.

<!-- @code python -->
```python
def asteroid_collision(v: list[int]) -> list[int]:
    st = []
    for x in v:
        alive = True
        while alive and st and st[-1] > 0 and x < 0:
            if st[-1] < -x:
                st.pop()
            elif st[-1] == -x:
                st.pop()
                alive = False
            else:
                alive = False
        if alive:
            st.append(x)
    return st


# 0.45ms at n = 2,000 against the repeated-scan version's 6.3ms.
```

<!-- @annotations -->
- 14: The stack IS the answer, in order, so no reversal or copy is needed — unlike the Java version.

<!-- @approach -->
### The Three Outcomes, Written Out

<!-- @idea -->
Separate the collision rule from the loop, because the equal case is the one that goes missing.

<!-- @steps -->
1. Note that a collision has exactly three results: the waiting asteroid dies, the arrival dies, or both die.
2. Note that only the first lets the arrival continue fighting.
3. Note that the other two end the loop, and neither pushes.
4. Write the comparison against the arrival's magnitude, `-x`, not against `x` itself.
5. Test with equal magnitudes explicitly, since random data rarely produces them.

<!-- @complexity -->
- time: unchanged — O(n)
- space: unchanged
- note: Omitting the equal branch is wrong on 38.47% of inputs with magnitudes from 1 to 4 and on 0.15% with magnitudes from 1 to 1000 — the same bug, 250 times less visible, depending only on the test data's range. That is why the problem's own examples include [8, -8].

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

enum class Outcome { WaitingDies, ArrivalDies, BothDie };

Outcome collide(int waiting, int arrival) {          // waiting > 0, arrival < 0
    int a = waiting, b = -arrival;                   // compare magnitudes
    if (a < b) return Outcome::WaitingDies;
    if (a > b) return Outcome::ArrivalDies;
    return Outcome::BothDie;
}

// WRONG — the version with the equal case folded into "the arrival dies":
//     if (st.back() < -x) st.pop_back(); else alive = false;
// It treats an equal collision as the arrival exploding alone, leaving the
// waiting asteroid behind. Measured wrong on 38.47% of small-magnitude inputs.
```

<!-- @annotations -->
- 7: -arrival rather than arrival, so both sides of the comparison are magnitudes; comparing waiting against a negative number makes every test true.
- 14: This is the natural two-branch simplification and it is wrong — worth writing down so it is recognisable in someone else's code.

<!-- @code java -->
```java
enum Outcome { WAITING_DIES, ARRIVAL_DIES, BOTH_DIE }

static Outcome collide(int waiting, int arrival) {   // waiting > 0, arrival < 0
    int a = waiting, b = -arrival;
    if (a < b) return Outcome.WAITING_DIES;
    if (a > b) return Outcome.ARRIVAL_DIES;
    return Outcome.BOTH_DIE;
}
```

<!-- @annotations -->
- 4: Naming the two magnitudes before comparing them removes the sign confusion that makes this rule easy to get backwards.

<!-- @code python -->
```python
def collide(waiting: int, arrival: int) -> str:      # waiting > 0, arrival < 0
    a, b = waiting, -arrival
    if a < b:
        return "waiting_dies"
    if a > b:
        return "arrival_dies"
    return "both_die"


# The equal case fires in roughly 0.25% of collisions when magnitudes run
# to 1000, and in a large fraction when they run to 4 — so test it directly
# rather than hoping random input produces it.
```

<!-- @annotations -->
- 2: The single line that makes the rest readable: after this, every comparison is between two positive magnitudes.

<!-- @approach -->
### In Place - Writing Survivors Back Into the Input

<!-- @idea -->
The survivors are always a prefix of what has been processed, so the input array can serve as the stack.

<!-- @steps -->
1. Keep a write index marking the top of the surviving prefix.
2. Treat `v[0 .. write−1]` as the stack and `v[i]` as the arrival.
3. Run the same collision loop, decrementing the write index instead of popping.
4. Increment the write index and store the arrival when it survives.
5. Truncate the array to the write index at the end.

<!-- @complexity -->
- time: O(n), unchanged
- space: O(1) extra — the output occupies the input's own storage
- note: The stack never holds more elements than have been read, so the write index can never overtake the read index and the overwrite is always safe. Worth knowing because the earlier stack problems could not do this: there the stack held indices whose answers were still pending, while here it holds finished output. It is the same trick as the two-pointer in-place removals from the arrays topic.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void asteroidCollisionInPlace(vector<int>& v) {
    int write = 0;
    for (int i = 0; i < (int)v.size(); i++) {
        int x = v[i];
        bool alive = true;
        while (alive && write > 0 && v[write - 1] > 0 && x < 0) {
            if (v[write - 1] < -x)       write--;
            else if (v[write - 1] == -x) { write--; alive = false; }
            else                          alive = false;
        }
        if (alive) v[write++] = x;
    }
    v.resize(write);
}
```

<!-- @annotations -->
- 9: write > 0 replaces the empty check, and v[write - 1] replaces the stack top — the array before write IS the stack.
- 14: write can never exceed i, because each iteration reads one element and writes at most one, so the store never clobbers unread input.
- 16: resize rather than returning a count, so the caller sees the right length without a separate output parameter.

<!-- @code java -->
```java
static int asteroidCollisionInPlace(int[] v) {
    int write = 0;
    for (int i = 0; i < v.length; i++) {
        int x = v[i];
        boolean alive = true;
        while (alive && write > 0 && v[write - 1] > 0 && x < 0) {
            if (v[write - 1] < -x)       write--;
            else if (v[write - 1] == -x) { write--; alive = false; }
            else                          alive = false;
        }
        if (alive) v[write++] = x;
    }
    return write;                                    // the surviving length
}
```

<!-- @annotations -->
- 13: Java arrays cannot be resized, so the length is returned and the caller uses Arrays.copyOf if a exact-size array is needed.

<!-- @code python -->
```python
def asteroid_collision_in_place(v: list[int]) -> list[int]:
    write = 0
    for x in v:
        alive = True
        while alive and write > 0 and v[write - 1] > 0 and x < 0:
            if v[write - 1] < -x:
                write -= 1
            elif v[write - 1] == -x:
                write -= 1
                alive = False
            else:
                alive = False
        if alive:
            v[write] = x
            write += 1
    del v[write:]
    return v
```

<!-- @annotations -->
- 3: Iterating over v while writing into it is safe here only because write never exceeds the read position; iterating by index would make that guarantee visible rather than implicit.

<!-- @example -->

<!-- @input -->
[10, 2, -5]

<!-- @output -->
[10]

<!-- @why -->
One arrival destroys a waiting asteroid and is then destroyed itself, so the loop's two exits both fire on the same element.

<!-- @walkthrough -->
1. The 10 arrives with an empty stack, so no collision is possible and it is pushed. The stack is [10].
2. The 2 arrives. The top is 10, which is positive, but the arrival is also positive — same direction, so they never meet. It is pushed. The stack is [10, 2].
3. The -5 arrives, marked alive. The top is 2, positive, and the arrival is negative, so they collide.
4. The magnitudes are 2 and 5. The waiting asteroid is smaller, so it explodes: pop, and the arrival stays alive and keeps fighting.
5. The loop runs again. The new top is 10, still positive, and the arrival is still negative and alive, so they collide.
6. The magnitudes are 10 and 5. The waiting asteroid is larger, so the arrival explodes: alive becomes false and the loop ends.
7. The push is skipped because the arrival is dead, leaving [10]. That skipped push is the structural difference from every earlier stack problem in this topic.

<!-- @example -->

<!-- @input -->
[8, −8] and [5, 10, −5]

<!-- @output -->
[] and [5, 10]

<!-- @why -->
The first is the only case where a collision removes two asteroids at once, and the second shows that a survivor deeper in the stack is never re-examined.

<!-- @walkthrough -->
1. For [8, -8], the 8 is pushed. The -8 arrives, the top is positive and the arrival negative, so they collide.
2. The magnitudes are equal, so both explode: the top is popped and the arrival is marked dead.
3. Nothing is pushed and the stack is empty, so the answer is the empty array.
4. For [5, 10, -5], the 5 and then the 10 are pushed with no collisions, since both move right.
5. The -5 arrives and collides with the 10. The magnitudes are 10 and 5, so the arrival explodes and the loop ends.
6. The 5 at the bottom of the stack is never examined, because the loop stopped as soon as the arrival died.
7. That is what keeps the algorithm linear: an arrival walks down the stack only as far as it survives.

<!-- @example -->

<!-- @input -->
1,000,000 random asteroids

<!-- @output -->
0.501 pushes per element — half of them never reach the stack

<!-- @why -->
It quantifies the change to the invariant, and shows that the extra complication makes the algorithm cheaper rather than dearer.

<!-- @walkthrough -->
1. Over a million asteroids with magnitudes from 1 to 1000 and random directions, the algorithm performed 501,336 pushes.
2. That is 0.501 per element, where every earlier stack problem in this topic pushed exactly once per element.
3. It also performed 497,846 pops, giving 1.00 total stack operations per element against the monotonic problems' 2.00.
4. The reason is that an asteroid destroyed on arrival is never stored, so it costs one comparison and nothing else.
5. Breaking down the collisions at n = 100,000: 49,646 destroyed only the arrival, 49,579 destroyed only the waiting asteroid, and 244 destroyed both.
6. The 287 survivors are the elements still on the stack at the end.
7. The worst shape is a block of right-movers followed by larger left-movers, which reaches 1.50 operations per element as each left-mover walks the whole stack.

<!-- @example -->

<!-- @input -->
The same code with the equal case omitted

<!-- @output -->
Wrong on 38.47% of small-magnitude inputs and 0.15% of wide-magnitude ones

<!-- @why -->
The bug's visibility depends entirely on the test data's range, which makes it a good example of why random testing needs its distribution chosen deliberately.

<!-- @walkthrough -->
1. Folding the equal case into "the arrival dies" gives a two-branch loop that looks like a simplification.
2. It leaves the waiting asteroid behind when the two should annihilate each other.
3. Tested with magnitudes drawn from 1 to 4, it disagreed with the reference on 7,694 of 20,000 fields — 38.47%.
4. Tested with magnitudes drawn from 1 to 1000, it disagreed on 31 of 20,000 — 0.15%.
5. That is the same code and the same bug, 250 times less likely to appear, because equal magnitudes are 250 times rarer.
6. Random integers over a wide range almost never collide, so a test suite built that way passes.
7. This is why the problem statement's own examples include [8, -8]: the case has to be constructed deliberately, not sampled.

<!-- @visualization stack -->

<!-- @description -->
Open with the physics before the algorithm: a horizontal track with asteroids drawn as circles sized by magnitude, each carrying a direction arrow. Show the four possible adjacent pairs in turn — plus-plus, minus-minus, minus-plus, plus-minus — and animate each one for a moment, with the first three drifting apart or in parallel and only the fourth converging. Mark the fourth with a collision flash and label it "the only pair that meets". Then the main animation on [10, 2, -5]: the track above, a vertical stack below it, and asteroids dropping into the stack as they survive. The 10 and the 2 drop in. The -5 arrives and is drawn approaching the stack from the right, then colliding with the 2 — the 2 shatters, and crucially the -5 keeps its momentum and continues to the next stack element rather than being placed. It collides with the 10, and this time the -5 shatters. Hold on the moment the push does not happen, with the push arrow drawn and then crossed out, labelled "the arrival never joins the stack". Then the three-outcome panel: the same collision drawn three times side by side with magnitudes 2 vs 5, 10 vs 5 and 8 vs 8, showing the waiting one shattering, the arrival shattering, and both shattering. Under the third, put a counter reading 0.25% of collisions at magnitudes up to 1000, and beside it the two failure rates 38.47% and 0.15% as bars, captioned "the same bug, 250 times less visible". Then the accounting panel: a stream of 1,000,000 asteroids feeding a push counter and a pop counter, settling at 0.501 and 0.498 per element, with a comparison bar showing the monotonic-stack problems at 2.00 against this one at 1.00 — labelled "destroyed arrivals cost nothing to store". Close with the confluence panel: the same field resolved twice, once strictly left to right and once by picking a random collidable pair each time, with the two sequences of intermediate states visibly different and the two final states identical — annotated 600,000 trials, 0 differences.

<!-- @sampleInput -->
```json
{"physics":{"positiveMovesRight":true,"negativeMovesLeft":true,"pairs":[{"top":"+","incoming":"+","meets":false,"why":"same direction"},{"top":"-","incoming":"-","meets":false,"why":"same direction"},{"top":"-","incoming":"+","meets":false,"why":"moving apart"},{"top":"+","incoming":"-","meets":true,"why":"the only pair that converges"}],"test":"st.back() > 0 && x < 0"},"worked":{"input":[10,2,-5],"output":[10],"steps":[{"arrival":10,"stackBefore":[],"collisions":[],"pushed":true,"stackAfter":[10]},{"arrival":2,"stackBefore":[10],"collisions":[],"why":"both positive — same direction","pushed":true,"stackAfter":[10,2]},{"arrival":-5,"stackBefore":[10,2],"collisions":[{"waiting":2,"arrivalMagnitude":5,"outcome":"waiting dies","arrivalContinues":true},{"waiting":10,"arrivalMagnitude":5,"outcome":"arrival dies","arrivalContinues":false}],"pushed":false,"stackAfter":[10]}],"keyMoment":"the skipped push — the structural difference from every earlier stack problem here"},"threeOutcomes":[{"condition":"top < -incoming","result":"the waiting asteroid explodes","arrivalContinues":true},{"condition":"top > -incoming","result":"the arrival explodes","arrivalContinues":false},{"condition":"top == -incoming","result":"both explode","arrivalContinues":false,"note":"the branch most often omitted"}],"equalCaseVisibility":{"bug":"folding the equal case into 'the arrival dies'","effect":"leaves the waiting asteroid behind when both should annihilate","measured":[{"magnitudes":"1 to 4","wrong":7694,"of":20000,"percent":38.47},{"magnitudes":"1 to 1000","wrong":31,"of":20000,"percent":0.15}],"ratio":250,"why":"equal magnitudes are 250 times rarer over the wider range","consequence":"the case has to be constructed deliberately, not sampled — which is why the problem's own examples include [8, -8]"},"invariantChange":{"before":"every element pushed exactly once","now":"every element pushed AT MOST once","measured":{"asteroids":1000000,"pushes":501336,"pushesPerElement":0.501,"pops":497846,"opsPerElement":1.0,"comparedToMonotonic":2.0},"breakdown":{"n":100000,"incomingOnly":49646,"stackOnly":49579,"both":244,"survivors":287},"reading":"an asteroid destroyed on arrival costs one comparison and nothing else, so the extra complication makes the algorithm CHEAPER"},"shapes":[{"input":"all right-moving","pushes":100000,"pops":0,"survivors":100000,"opsPerElement":1.0},{"input":"all left-moving","pushes":100000,"pops":0,"survivors":100000,"opsPerElement":1.0},{"input":"right block then larger left block","pushes":100000,"pops":50000,"survivors":50000,"opsPerElement":1.5,"note":"the worst case — each left-mover walks the whole stack"},{"input":"alternating +1, -1","pushes":50000,"pops":50000,"survivors":0,"opsPerElement":1.0,"note":"complete annihilation"}],"confluence":{"question":"does the answer depend on which collision resolves first?","method":"resolve a RANDOMLY chosen collidable pair instead of the leftmost","fields":200000,"trialsPerField":3,"totalTrials":600000,"differingResults":0,"conclusion":"the final configuration is well-defined, which is what licenses a single left-to-right pass"},"timing":{"unit":"ns","rows":[{"n":1000,"brute":88167,"stack":5625,"ratio":16},{"n":4000,"brute":844500,"stack":30042,"ratio":28},{"n":16000,"brute":13259333,"stack":145166,"ratio":91}],"python":{"n":2000,"bruteMs":6.3,"stackMs":0.45,"ratio":14}},"inPlace":{"idea":"the survivors are always a prefix of what has been processed, so the input can serve as the stack","safety":"write never exceeds the read index, since each iteration reads one element and writes at most one","whyEarlierProblemsCouldNot":"there the stack held indices whose answers were still pending; here it holds finished output","space":"O(1) extra"}}
```

<!-- @highlights -->
- A horizontal track shows asteroids as circles sized by magnitude, each with a direction arrow.
- The four adjacent pairs animate in turn, with only plus-then-minus converging.
- That pair gets a collision flash and the label "the only pair that meets".
- [10, 2, -5] then runs with the track above and a vertical stack below.
- The 10 and the 2 drop into the stack without incident.
- The -5 approaches from the right and shatters the 2, then keeps its momentum rather than being placed.
- It collides with the 10 and shatters, and the push arrow is drawn and crossed out.
- That moment is labelled "the arrival never joins the stack".
- The same collision is drawn three times at 2 vs 5, 10 vs 5 and 8 vs 8.
- Under the equal case sits a counter reading 0.25% of collisions at magnitudes up to 1000.
- Two bars beside it show the failure rates 38.47% and 0.15%, captioned "the same bug, 250 times less visible".
- A stream of 1,000,000 asteroids feeds push and pop counters settling at 0.501 and 0.498 per element.
- A comparison bar puts the monotonic-stack problems at 2.00 against this one at 1.00.
- It is labelled "destroyed arrivals cost nothing to store".
- The same field is resolved twice, left to right and by random pair, with visibly different intermediate states.
- The two final states are identical, annotated 600,000 trials and 0 differences.

<!-- @edgeCases -->
- An empty array — the loop never runs and the stack is empty, which is the correct answer.
- All right-moving — nothing ever collides, every element is pushed, and there are no pops.
- All left-moving — likewise, because the stack top is never positive.
- A left-mover followed by a right-mover — they move apart and never meet, which the sign test must allow.
- Equal magnitudes in opposite directions — both explode, and this is the branch most often omitted.
- Alternating +1 and -1 — everything annihilates and the answer is empty.
- A single large left-mover after many right-movers — it walks the entire stack, which is the worst case at 1.50 operations per element.
- An arrival that dies — must not be pushed, and the loop must stop rather than continuing to collide.
- An arrival that survives every collision — the stack empties and it is pushed onto nothing.
- Comparing the top against x rather than -x — every magnitude test then compares against a negative number and is trivially true.
- Very large magnitudes — no overflow risk, since only comparisons and negations are performed, but -x on INT_MIN would be undefined.

<!-- @pitfalls -->
- Omitting the equal-magnitude case. It is wrong on 38.47% of small-magnitude inputs and only 0.15% of wide-magnitude ones, so it passes most random testing.
- Folding the equal case into "the arrival dies". That leaves the waiting asteroid behind, which is the specific wrong answer this produces.
- Comparing the stack top against x instead of -x. Both sides of the comparison must be magnitudes, or the test compares a positive against a negative and always succeeds.
- Pushing unconditionally. A destroyed arrival must never join the stack, and this is the one structural change from the earlier stack problems.
- Forgetting to stop the loop when the arrival dies. It then keeps colliding as a ghost and destroys further stack elements.
- Testing collision direction as top < 0 && x > 0. That is the pair that moves apart; the collidable pair is top > 0 && x < 0.
- Restarting the scan from index 0 in the brute force. It is correct and quadratic — 91x slower at n = 16,000.
- Removing index i before index i + 1 in the Java list version. The second removal then targets a shifted position.
- Assuming the answer depends on collision order. It does not — 600,000 random-order trials produced identical results — but the single pass is only justified because of that.
- Returning the ArrayDeque contents directly in Java. Push inserts at the head, so draining yields reverse order and the result must be filled backwards.
- Negating INT_MIN to get a magnitude. It has no positive counterpart, so guard the input range or use a wider type.
- Building an output list separately in Python. The stack already is the answer in order, so copying it is pure waste.

<!-- @doubt -->
### What actually changed from the earlier stack problems?

<!-- @answer -->
The push became conditional. In Next Greater Element and Sum of Subarray Minimums, every element was pushed exactly once and the loop only decided when to pop — an arriving element could settle the fate of things already waiting but was never itself at risk. Here the arrival can lose, so it may never reach the stack at all. The invariant weakens from "pushed exactly once" to "pushed at most once", measured at 0.501 pushes per element over a million asteroids. Everything else follows from that: the alive flag, the loop condition that checks it, and the push moving inside an if.

<!-- @doubt -->
### Is it still O(n)?

<!-- @answer -->
Yes, and more cheaply than before. Each element is pushed at most once and popped at most once, so the total stack work is bounded by 2n exactly as in the monotonic problems — but measured it comes to 1.00 operations per element rather than 2.00, because roughly half the arrivals are destroyed before being stored and cost one comparison each. The worst shape is a block of right-movers followed by larger left-movers, where every left-mover walks the whole stack; even that measured only 1.50 operations per element.

<!-- @doubt -->
### Why is the equal case so easy to miss?

<!-- @answer -->
Because random test data almost never produces it. Folding it into "the arrival dies" gives a natural two-branch loop, and with magnitudes drawn from 1 to 1000 that version is wrong on only 0.15% of inputs — 31 of 20,000. Shrink the magnitude range to 1 to 4 and the same code is wrong on 38.47%. The bug did not change; the probability of hitting it did, by a factor of 250. It is a good general lesson: when a branch fires on an exact equality, the test distribution decides whether it is ever exercised, so that case has to be constructed rather than sampled.

<!-- @doubt -->
### Does the answer depend on which collision happens first?

<!-- @answer -->
No, and it is worth knowing rather than assuming, because the single left-to-right pass depends on it. Taking 200,000 random fields and repeatedly resolving a randomly chosen collidable pair instead of the leftmost one, three times each, produced identical final configurations in all 600,000 trials. The intermediate states differ; the outcome does not. That property is what makes it legitimate to fix an order and process the array once.

<!-- @doubt -->
### Which pairs actually collide?

<!-- @answer -->
Only a positive on the stack with a negative arriving — `top > 0 && incoming < 0`. Two positives move the same way and never meet; two negatives likewise; and a negative followed by a positive move apart. Getting this backwards is a common error because "negative then positive" looks like a head-on approach when the numbers are read as positions rather than velocities. The check appears in the while condition rather than before it, because after a pop the new top may not be positive and the loop must re-test.

<!-- @doubt -->
### Why compare against -x rather than x?

<!-- @answer -->
Because the rule is about magnitudes and x is negative in every collision. Writing `st.back() < x` compares a positive against a negative, which is never true, so the waiting asteroid never explodes and the algorithm silently degenerates into "keep everything". Negating once gives two positive magnitudes and makes every subsequent comparison read naturally. The clearest form names them: `int a = waiting, b = -arrival;` and then compares a against b, which removes the sign question from the branch logic entirely.

<!-- @doubt -->
### Can this be done in place?

<!-- @answer -->
Yes, unlike the earlier problems in this family. Keep a write index; the elements before it are the stack, and popping is a decrement. It is safe because each iteration reads one element and writes at most one, so the write index can never overtake the read index and unread input is never clobbered. What makes it possible is that the stack here holds finished output — surviving asteroids — whereas in Next Greater Element the stack held indices whose answers were still pending and could not be written out yet.

<!-- @doubt -->
### What happens to an arrival that survives everything?

<!-- @answer -->
It empties the stack of every right-mover smaller than it and is then pushed onto whatever remains, which may be nothing. The loop terminates because the stack shrinks on every iteration that does not end it, so a single arrival can perform many pops but each pop removes an element permanently. That is the amortised argument: the total pops across the whole run cannot exceed the total pushes, whatever any individual arrival does.

<!-- @doubt -->
### Why is the brute force quadratic when it looks linear?

<!-- @answer -->
Because it restarts the scan after every deletion. Removing an element can create a new adjacency behind the current position — the element before the deleted one may now face something it previously did not — so resuming in place would miss collisions. Restarting from the beginning is the simple fix and makes the work O(n) per deletion with up to n deletions. Measured, that is 13,259,333ns at n = 16,000 against the stack's 145,166ns, a factor of 91. Resuming from one position earlier rather than from zero would make it linear, which is essentially what the stack version does implicitly.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Sum of Subarray Ranges, which returns to the span machinery from two subtopics ago and needs it twice over — the sum of subarray maximums minus the sum of subarray minimums. The interesting part is that the tie asymmetry has to stay consistent between the two halves: deriving the maximum version by flipping every comparison in the minimum version is the obvious move, and it is exactly where the strictness gets mirrored incorrectly and the two halves stop partitioning the same set of subarrays.
