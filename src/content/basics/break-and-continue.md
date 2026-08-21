---
id: break-and-continue
topic: Basics
title: Break and Continue
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-programming
  - relational-and-logical-operators
  - if-else-statements
  - for-loop
  - while-loop
relatedIds:
  - for-loop
  - while-loop
  - do-while-loop
  - switch-case
  - nested-loops
---

<!-- @summary -->
Leaving a loop early or skipping a single iteration — and why the same continue statement is harmless in a for loop and hangs a while loop.

<!-- @theory -->
## Two ways to interrupt a loop

By default a loop runs its body to the end, every iteration, until the condition
fails. Two statements change that:

- **`break`** — leave the loop **entirely**, right now. Execution resumes after the loop.
- **`continue`** — abandon **this iteration only** and go on to the next one.

They sound similar and do very different things. `break` ends the loop; `continue`
ends one lap of it.

## Where exactly does each jump to?

This detail is the whole subtopic, so it's worth being precise.

**`break`** jumps to the first statement *after* the loop. Nothing else in the body
runs, the condition is not re-checked, and the update does not happen.

**`continue`** jumps to the point where the next iteration begins — and **that point
is different in a for loop and a while loop**:

| Loop | `continue` jumps to |
|---|---|
| `for` | the **update**, then the condition |
| `while` | the **condition**, directly |

That difference is not a detail. It is the reason for the most common bug involving
either statement.

## The continue trap

Recall the framing from the while-loop subtopic: a `for` loop **bundles**
initialisation, condition and update into its header, while a `while` loop
**scatters** them — the update lives in the body.

Now look at what `continue` does to each.

**In a for loop, the update is in the header.** `continue` jumps to it, so the counter
still advances. The loop makes progress and terminates normally:

```
for (int i = 0; i < 5; i++) {
    if (i == 2) continue;    // skips the print, but i++ still runs
    print(i);
}
// prints 0 1 3 4 — terminates fine
```

**In a while loop, the update is in the body — usually at the bottom.** `continue`
jumps straight past it to the condition, so the counter is **never incremented**:

```
int i = 0;
while (i < 5) {
    if (i == 2) continue;    // jumps over i++ below
    print(i);
    i++;
}
// prints 0 1 then hangs forever at i == 2
```

The condition is re-checked with `i` still equal to 2, which still passes, which hits
the `continue` again. Forever.

**The fix**: update *before* the `continue`, or restructure so no `continue` is needed:

```
while (i < 5) {
    int current = i;
    i++;                     // update first, unconditionally
    if (current == 2) continue;
    print(current);
}
```

Honestly, though — when you find yourself using `continue` in a `while` loop, a `for`
loop is usually the better answer. The update belongs somewhere `continue` cannot
skip it.

## break only exits one level

In nested loops, `break` leaves **the innermost loop containing it** and nothing more.
The outer loop carries on as if nothing happened.

```
for (i...) {
    for (j...) {
        if (found) break;    // exits the j loop only
    }
    // execution resumes HERE, and the i loop continues
}
```

This surprises people constantly. Three ways out:

**Java has labelled break.** Put a label on the outer loop and name it:
`break outer;` exits both. Java also has labelled `continue`.

**C++ has no labels.** The options are a flag variable checked by the outer loop, or
`goto` to a point after both loops. `goto` is genuinely acceptable here — this is the
one case where most style guides allow it.

**Python has no labels either.** Use a flag, or the cleanest option in every language:

**Extract the loops into a function and `return`.** A `return` leaves everything at
once, regardless of nesting depth, and it usually improves the code independently of
the escape problem.

## break inside a switch inside a loop

A trap worth knowing before it costs you an hour. Inside a `switch`, `break` exits
**the switch**, not the enclosing loop:

```
while (running) {
    switch (command) {
        case QUIT:
            break;      // exits the SWITCH — the while loop keeps going
    }
}
```

The `break` binds to the nearest enclosing `break`-able construct, and that's the
switch. To leave the loop you need a flag, a labelled break, or a `return`.

## Python's loop else

Python attaches an optional `else` to loops, and it means something non-obvious:

**The `else` block runs only if the loop finished *without* hitting a `break`.**

Read it as "if no break happened". It exists for search loops:

```
for item in items:
    if item == target:
        print("found")
        break
else:
    print("not found")     # only if the loop never broke
```

Without it you'd need a boolean flag — which is exactly what C++ and Java must do,
since neither has this feature. It works on `while` too, with the same rule.

The catch is readability: the `else` looks like it belongs to the `if` rather than the
loop. Indentation is what tells you, so align it with the `for` or `while`.

## Style: when they help and when they hide things

`break` in a search loop is unambiguously good — once you've found what you're looking
for, continuing to scan is wasted work.

`continue` is best as a **guard at the top of the body**: skip the items you don't
care about, then handle the rest without extra nesting. That reads better than
wrapping the whole body in an `if`.

Where both go wrong is in quantity. Several `break`s and `continue`s scattered through
one long body make the control flow genuinely hard to follow, because the reader has
to track every exit. When that happens, the fix is usually to invert a condition or
split the body into a function — not to add another jump.

<!-- @intuition -->
break leaves the building; continue skips to the next floor. The only thing you have to know precisely is what the stairwell passes on the way — in a for loop it passes the update, and in a while loop it steps right over it.

<!-- @approach -->
### Exiting Early with break

<!-- @idea -->
Stop the loop the moment the answer is known, instead of scanning the rest.

<!-- @steps -->
1. Identify the condition that means no further iterations are needed.
2. Test that condition inside the loop body.
3. Execute break when it holds, which leaves the loop immediately.
4. Note that the remaining body statements, the update, and the condition check are all skipped.
5. Continue with the first statement after the loop, using whatever the loop recorded before exiting.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {4, 8, 15, 16, 23, 42};
    int target = 15;

    // Linear search — stop as soon as it is found
    int foundAt = -1;
    for (int i = 0; i < arr.size(); i++) {
        if (arr[i] == target) {
            foundAt = i;
            break;              // three comparisons, not six
        }
    }
    cout << foundAt << endl;    // 2

    // break is also how an intentional infinite loop ends
    int total = 0;
    while (true) {
        int value;
        cin >> value;
        if (value == 0) break;
        total += value;
    }

    // C++ and Java need a flag to express "not found"
    bool found = false;
    for (int x : arr) {
        if (x == target) { found = true; break; }
    }
    if (!found) cout << "not found" << endl;

    return 0;
}
```

<!-- @annotations -->
- 14: Without this, the loop would keep comparing the remaining three elements for no reason.
- 30: Python replaces this flag with a loop else clause. C++ has no equivalent.

<!-- @code java -->
```java
public class BreakDemo {
    public static void main(String[] args) {
        int[] arr = {4, 8, 15, 16, 23, 42};
        int target = 15;

        // Linear search
        int foundAt = -1;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                foundAt = i;
                break;
            }
        }
        System.out.println(foundAt);   // 2

        // The flag pattern for "not found"
        boolean found = false;
        for (int x : arr) {
            if (x == target) { found = true; break; }
        }
        if (!found) System.out.println("not found");
    }
}
```

<!-- @annotations -->
- 11: Execution resumes at the println below, skipping the update and the condition check.

<!-- @code python -->
```python
arr = [4, 8, 15, 16, 23, 42]
target = 15

# Linear search
found_at = -1
for i, value in enumerate(arr):
    if value == target:
        found_at = i
        break
print(found_at)   # 2

# The loop else clause replaces the flag variable entirely
for value in arr:
    if value == target:
        print("found")
        break
else:
    print("not found")   # runs only if no break happened

# Works on while loops too
n, d = 7, 2
while d * d <= n:
    if n % d == 0:
        print("not prime")
        break
    d += 1
else:
    print("prime")   # this runs
```

<!-- @annotations -->
- 17: Aligned with the for, not the if. That alignment is the only thing telling you which it belongs to.
- 26: Reads as 'the loop ran out of divisors without finding one', which is exactly what prime means here.

<!-- @approach -->
### Skipping an Iteration with continue

<!-- @idea -->
Abandon the current iteration and move to the next — but know where 'the next' begins.

<!-- @steps -->
1. Identify the items the body should not process.
2. Test for them at the top of the body, before any real work.
3. Execute continue, which skips the rest of the body for this iteration only.
4. In a for loop, control passes to the update and then the condition.
5. In a while loop, control passes directly to the condition, skipping any update below the continue.
6. Confirm the loop can still make progress, since a skipped update means it never will.

<!-- @code cpp -->
```cpp
// SAFE in a for loop — the update lives in the header
for (int i = 0; i < 5; i++) {
    if (i == 2) continue;    // skips the print; i++ still runs
    cout << i << " ";
}
cout << endl;   // 0 1 3 4

// FATAL in a while loop — the update lives below the continue
int i = 0;
while (i < 5) {
    if (i == 2) continue;    // jumps straight over i++ below
    cout << i << " ";
    i++;
}
// prints 0 1 then hangs forever with i stuck at 2

// FIX 1 — update before the continue
i = 0;
while (i < 5) {
    int current = i;
    i++;                     // unconditional, so continue cannot skip it
    if (current == 2) continue;
    cout << current << " ";
}
cout << endl;   // 0 1 3 4

// FIX 2 — use a for loop, where the update is unskippable by design

// continue as a guard clause — skip what you do not care about
vector<int> arr = {3, -1, 7, -8, 2};
int sum = 0;
for (int x : arr) {
    if (x < 0) continue;     // ignore negatives
    sum += x;                // no extra nesting needed
}
cout << sum << endl;   // 12
```

<!-- @annotations -->
- 3: continue jumps to i++, so the counter advances and the loop terminates normally.
- 11: continue jumps to the condition, so i++ is never reached and the condition never changes.
- 21: Moving the update above the continue makes it unskippable.
- 32: Cleaner than wrapping the whole body in if (x >= 0), especially when the body is long.

<!-- @code java -->
```java
// SAFE in a for loop
for (int i = 0; i < 5; i++) {
    if (i == 2) continue;
    System.out.print(i + " ");
}
System.out.println();   // 0 1 3 4

// FATAL in a while loop
int i = 0;
while (i < 5) {
    if (i == 2) continue;   // skips i++ below
    System.out.print(i + " ");
    i++;
}
// prints 0 1 then hangs

// FIX — update before the continue
i = 0;
while (i < 5) {
    int current = i;
    i++;
    if (current == 2) continue;
    System.out.print(current + " ");
}
System.out.println();   // 0 1 3 4

// Guard clause
int[] arr = {3, -1, 7, -8, 2};
int sum = 0;
for (int x : arr) {
    if (x < 0) continue;
    sum += x;
}
System.out.println(sum);   // 12
```

<!-- @annotations -->
- 11: Identical hazard to C++, for the identical reason.

<!-- @code python -->
```python
# SAFE in a for loop — there is no update to skip
for i in range(5):
    if i == 2:
        continue
    print(i, end=" ")
print()   # 0 1 3 4

# FATAL in a while loop
i = 0
while i < 5:
    if i == 2:
        continue      # skips i += 1 below
    print(i, end=" ")
    i += 1
# prints 0 1 then hangs

# FIX — update before the continue
i = 0
while i < 5:
    current = i
    i += 1
    if current == 2:
        continue
    print(current, end=" ")
print()   # 0 1 3 4

# Guard clause
arr = [3, -1, 7, -8, 2]
total = 0
for x in arr:
    if x < 0:
        continue
    total += x
print(total)   # 12
```

<!-- @annotations -->
- 2: Python's for takes the next value from a sequence, so there is no update expression that continue could skip.
- 12: Python's while is a genuine condition loop, so it has exactly the same trap as C++ and Java.

<!-- @approach -->
### Escaping Nested Loops

<!-- @idea -->
Get out of more than one loop level, which break alone cannot do.

<!-- @steps -->
1. Recognise that break exits only the innermost loop containing it.
2. Decide how far out you actually need to go.
3. In Java, label the outer loop and break to that label.
4. In C++ or Python, set a flag in the inner loop and test it immediately after, or use goto in C++.
5. Prefer extracting the nested loops into a function and returning, which exits every level at once in all three languages.

<!-- @code cpp -->
```cpp
vector<vector<int>> grid = {{1, 2}, {3, 4}, {5, 6}};
int target = 4;

// THE MISTAKE — break exits only the inner loop
for (int i = 0; i < grid.size(); i++) {
    for (int j = 0; j < grid[i].size(); j++) {
        if (grid[i][j] == target) break;   // leaves the j loop only
    }
    // execution resumes here, and the i loop keeps going
}

// FIX 1 — a flag checked by the outer loop
bool found = false;
for (int i = 0; i < grid.size() && !found; i++) {
    for (int j = 0; j < grid[i].size(); j++) {
        if (grid[i][j] == target) { found = true; break; }
    }
}

// FIX 2 — goto, which is genuinely acceptable for this one case
for (int i = 0; i < grid.size(); i++) {
    for (int j = 0; j < grid[i].size(); j++) {
        if (grid[i][j] == target) goto done;
    }
}
done:

// FIX 3 — extract to a function and return (usually the best)
// pair<int,int> find(const vector<vector<int>>& g, int t) {
//     for (int i = 0; i < g.size(); i++)
//         for (int j = 0; j < g[i].size(); j++)
//             if (g[i][j] == t) return {i, j};   // exits both loops
//     return {-1, -1};
// }
```

<!-- @annotations -->
- 7: The outer loop is unaffected and will run its remaining iterations.
- 14: The flag has to appear in two places: set inside, tested by the outer condition.
- 22: C++ has no labelled break, so goto is the direct equivalent. Most style guides allow it here.

<!-- @code java -->
```java
int[][] grid = {{1, 2}, {3, 4}, {5, 6}};
int target = 4;

// THE MISTAKE — inner break only
for (int i = 0; i < grid.length; i++) {
    for (int j = 0; j < grid[i].length; j++) {
        if (grid[i][j] == target) break;   // leaves the j loop only
    }
}

// FIX — Java has labelled break
outer:
for (int i = 0; i < grid.length; i++) {
    for (int j = 0; j < grid[i].length; j++) {
        if (grid[i][j] == target) break outer;   // exits BOTH loops
    }
}

// Java also has labelled continue — skip to the next outer iteration
rows:
for (int i = 0; i < grid.length; i++) {
    for (int j = 0; j < grid[i].length; j++) {
        if (grid[i][j] < 0) continue rows;   // abandon this whole row
        System.out.print(grid[i][j] + " ");
    }
}
```

<!-- @annotations -->
- 12: The label names the loop. It is not a goto target — it can only be used by break and continue.
- 15: The one place Java is meaningfully more capable than C++ and Python for loop control.
- 21: Labelled continue jumps to the outer loop's update, abandoning the rest of the inner loop.

<!-- @code python -->
```python
grid = [[1, 2], [3, 4], [5, 6]]
target = 4

# THE MISTAKE — break exits only the inner loop
for row in grid:
    for value in row:
        if value == target:
            break        # leaves the inner loop only

# FIX 1 — a flag
found = False
for row in grid:
    for value in row:
        if value == target:
            found = True
            break
    if found:
        break

# FIX 2 — for-else, which reads better than a flag
for row in grid:
    for value in row:
        if value == target:
            break
    else:
        continue         # inner loop finished without breaking, try next row
    break                # inner loop DID break, so break the outer too

# FIX 3 — extract to a function and return (clearest)
def find(grid, target):
    for i, row in enumerate(grid):
        for j, value in enumerate(row):
            if value == target:
                return i, j      # exits every level at once
    return -1, -1

print(find(grid, target))   # (1, 1)
```

<!-- @annotations -->
- 11: Python has no labelled break, so the flag must be set inside and tested after the inner loop.
- 21: Correct, and widely considered too clever to be readable. Included because you will encounter it.
- 29: return leaves all enclosing loops regardless of depth, and usually improves the code anyway.

<!-- @example -->

<!-- @input -->
arr = [4, 8, 15, 16, 23, 42]; search for 15 with break

<!-- @output -->
Index 2, after three comparisons instead of six

<!-- @why -->
The clearest justification for break: once the answer exists, further iterations are pure waste.

<!-- @walkthrough -->
1. The first iteration compares 4 against 15, which does not match, so the body ends normally.
2. The second compares 8, which also does not match.
3. The third compares 15, which matches, so the index is recorded.
4. break executes, leaving the loop immediately without running the update or re-checking the condition.
5. The remaining three elements are never examined, because the answer is already known.
6. Execution resumes at the statement after the loop with the recorded index available.

<!-- @example -->

<!-- @input -->
int i = 0; while (i < 5) { if (i == 2) continue; print(i); i++; }

<!-- @output -->
0 1 then the program hangs forever

<!-- @why -->
The continue trap in its exact form. Nothing in the syntax warns you, and the program simply stops responding.

<!-- @walkthrough -->
1. With i at 0 the condition passes, the guard is false, 0 prints, and i becomes 1.
2. With i at 1 the condition passes, the guard is false, 1 prints, and i becomes 2.
3. With i at 2 the condition passes and the guard is now true, so continue executes.
4. continue jumps directly to the condition check, skipping both the print and the increment below it.
5. The condition is re-checked with i still equal to 2, which passes, so the body runs again.
6. The guard is true again, continue fires again, and nothing in the loop can ever change i.

<!-- @example -->

<!-- @input -->
for (int i = 0; i < 5; i++) { if (i == 2) continue; print(i); }

<!-- @output -->
0 1 3 4, terminating normally

<!-- @why -->
Placed beside the previous example, it isolates the cause exactly: nothing about continue changed, only the location of the update.

<!-- @walkthrough -->
1. With i at 0 and 1 the guard is false, so both values print and the update advances i each time.
2. With i at 2 the guard is true and continue executes, skipping the print.
3. Control passes to the update rather than straight to the condition, because the update lives in the header.
4. i becomes 3, the condition is checked, and the loop proceeds normally.
5. 3 and 4 print, then i reaches 5, the condition fails, and the loop exits.
6. The same continue statement that hung the while loop is harmless here purely because of where the update sits.

<!-- @example -->

<!-- @input -->
Nested loops over a grid, with break in the inner loop when the target is found

<!-- @output -->
The inner loop exits, but the outer loop continues over every remaining row

<!-- @why -->
break binding to the innermost loop is stated in every reference and still surprises people, because the intent reads as leave the search.

<!-- @walkthrough -->
1. The outer loop begins its first row and the inner loop scans that row's values.
2. When the target is found, break executes and leaves the inner loop.
3. Control resumes at the first statement after the inner loop, still inside the outer loop's body.
4. The outer loop's update runs and its condition is checked, so the next row begins.
5. The inner loop scans that row too, even though the answer was already found.
6. Every remaining row is scanned, which is exactly the waste the break was meant to prevent.

<!-- @visualization code-flow -->

<!-- @description -->
Draw the loop as a closed circuit the execution token travels: a condition gate at the top, the body's statements laid out in order down the track, and a back-edge returning to the gate. For a for loop, place the update chip ON the back-edge, since it lives in the header. For a while loop, place the update chip as an ordinary statement near the bottom of the body track. Animate break as an exit ramp that peels off the track entirely, with the remaining body statements, the update, and the condition gate all dimming as the token leaves. Animate continue as a shortcut arrow leaping from its position in the body directly to the start of the next lap. The critical frame is running that same continue on both loop shapes side by side: on the for track the shortcut arrow lands on the back-edge and therefore passes THROUGH the update chip, which lights up as the counter ticks forward and the loop visibly advances; on the while track the shortcut arrow leaps from mid-body straight to the condition gate, sailing over the update chip which stays dark and untouched, and a counter panel beside it freezes while the gate keeps flashing green. Loop that frozen state a few times so the hang is unmistakable. Then show the fix by sliding the update chip above the continue point on the while track, after which the shortcut arrow can no longer bypass it. Finish with a NESTED panel of two concentric circuits: the break ramp from the inner circuit is drawn landing on the outer circuit rather than escaping the diagram, with the outer token visibly continuing its remaining laps — and a labelled break variant where the ramp extends past both rings and off the diagram entirely.

<!-- @sampleInput -->
```json
{"loops":[{"kind":"for","header":"i = 0; i < 5; i++","updateLocation":"back-edge","continueAt":"i == 2","output":[0,1,3,4],"terminates":true},{"kind":"while","header":"i < 5","updateLocation":"body-bottom","continueAt":"i == 2","output":[0,1],"terminates":false,"frozenAt":2}],"breakDemo":{"array":[4,8,15,16,23,42],"target":15,"comparisons":3,"skipped":3},"nested":{"rows":3,"plainBreak":"exits inner only","labelledBreak":"exits both","availableIn":{"java":true,"cpp":false,"python":false}}}
```

<!-- @highlights -->
- The loop is drawn as a closed circuit: condition gate at the top, body statements down the track, back-edge returning to the gate.
- In the for loop the update chip sits on the back-edge, because it lives in the header.
- In the while loop the update chip sits as an ordinary statement near the bottom of the body.
- break is an exit ramp peeling off the track, with the rest of the body, the update, and the gate all dimming as the token leaves.
- continue is a shortcut arrow leaping from its position straight to the start of the next lap.
- On the for track that shortcut lands on the back-edge and passes through the update chip, which lights as the counter ticks forward.
- On the while track the shortcut sails over the update chip, which stays dark and is never touched.
- The counter panel beside the while loop freezes while the condition gate keeps flashing green, lap after lap.
- That frozen counter beneath a permanently green gate is the hang, shown as a mechanism rather than described.
- Sliding the update chip above the continue point puts it back on the path, and the shortcut can no longer bypass it.
- The nested panel draws two concentric circuits with the break ramp from the inner one landing on the outer track.
- The outer token carries on with its remaining laps, scanning rows whose answer was already found.
- The labelled break variant extends that ramp past both rings and off the diagram, available in Java only.

<!-- @edgeCases -->
- A continue placed above the update in a while loop, which skips it and prevents the loop from ever progressing.
- A break inside a switch that is itself inside a loop, which exits the switch and leaves the loop running.
- A break in the innermost of several nested loops, which leaves only that one level.
- Statements written after a break or continue in the same block, which can never execute.
- A break inside a Python loop that has an else clause, where the else is skipped entirely.
- A loop that always breaks on its first iteration, which makes the loop structure itself redundant.
- A continue in a do-while loop, which jumps to the condition at the bottom rather than the top of the body.
- A break inside a try block with a finally clause, where the finally still runs before the loop is left.
- A labelled continue in Java, which jumps to the labelled loop's update rather than exiting it.
- An empty loop body reached only via continue, where the loop performs no work at all for some inputs.

<!-- @pitfalls -->
- Using continue in a while loop where the update sits below it, which freezes the counter and hangs the program.
- Expecting break to exit all nested loops when it leaves only the innermost one.
- Writing break inside a switch to exit the surrounding loop, which exits the switch instead.
- Forgetting to test the escape flag immediately after the inner loop, so the outer loop runs anyway.
- Assuming C++ or Python have labelled break, which only Java provides.
- Aligning Python's loop else with the if instead of the loop, which silently changes what it belongs to.
- Reading Python's loop else as running when the loop finished, rather than when it finished without breaking.
- Scattering several breaks and continues through one long body, making every exit path hard to trace.
- Using continue where inverting the condition would be clearer, particularly when the skipped case is the common one.
- Placing code after a break or continue in the same block, where it can never run.

<!-- @doubt -->
### Why does my while loop hang when I add a continue?

<!-- @answer -->
Because continue jumps straight to the condition check, skipping everything below it in the body — including the update. In a for loop the update lives in the header, so continue passes through it and the counter still advances. In a while loop the update is an ordinary statement in the body, and if it sits below the continue it is never reached. The condition is then re-checked with nothing changed and the loop spins forever. Move the update above the continue, or use a for loop where it cannot be skipped.

<!-- @doubt -->
### Does break exit all the loops it is inside?

<!-- @answer -->
No. It exits only the innermost loop containing it, and every enclosing loop carries on. In a nested search this means the outer loop keeps scanning even though the answer was found, which defeats the point of breaking at all. Java offers labelled break to exit multiple levels. C++ and Python do not, so you need a flag tested by the outer loop, or you extract the loops into a function and return.

<!-- @doubt -->
### What is the cleanest way to break out of two loops?

<!-- @answer -->
Put the loops in a function and return. A return leaves every level at once regardless of depth, works identically in all three languages, and usually improves the code independently — a nested search that returns its result is easier to read and to test than one that sets flags. If extraction is not an option, use labelled break in Java, and a flag or goto in C++. In Python, a flag is the honest answer; the for-else trick that achieves it is generally considered too clever to be readable.

<!-- @doubt -->
### What does Python's for-else actually do?

<!-- @answer -->
The else block runs only if the loop finished without hitting a break. Read it as if no break happened, not as otherwise. It exists for search loops, where it replaces the boolean flag that C++ and Java are forced to use — the for finds and breaks, and the else reports not found. Two cautions: align it with the for or while rather than the if, since indentation is the only thing that says which it belongs to, and remember a loop that ends by exhausting its items counts as finishing normally.

<!-- @doubt -->
### Should I use break or return to leave a loop?

<!-- @answer -->
break when the function still has work to do after the loop, such as printing the result or continuing with other logic. return when the loop's result is the function's result, which is common in search functions. return is also the only one of the two that escapes nested loops in a single step, so a deeply nested search is usually clearer written as a function that returns than as loops with flags.

<!-- @doubt -->
### Is using continue considered bad style?

<!-- @answer -->
Not at all when it is a guard at the top of the body — skip the items you do not care about, then handle the rest without wrapping everything in an if. That keeps the main logic at one indentation level, which reads better in a long body. It becomes a problem in quantity: several continues scattered through a body force the reader to track every exit path. When that happens, invert a condition or split the body into a function.

<!-- @doubt -->
### Does a break inside a switch also break the surrounding loop?

<!-- @answer -->
No, and this catches people. break binds to the nearest enclosing construct it can leave, and inside a switch that is the switch itself. The loop keeps running. To leave the loop from inside a switch you need a flag tested by the loop condition, a labelled break in Java, or a return. This is a real hazard in menu-driven programs, where a quit case naturally looks like it should end the loop.

<!-- @doubt -->
### Where exactly does continue jump to?

<!-- @answer -->
To the point where the next iteration begins, which differs by loop type. In a for loop it goes to the update and then the condition. In a while loop it goes directly to the condition. In a do-while it goes to the condition at the bottom. In Python's for it simply takes the next value from the sequence, which is why Python's for has no update for continue to skip — but its while has exactly the same trap as C++ and Java.
