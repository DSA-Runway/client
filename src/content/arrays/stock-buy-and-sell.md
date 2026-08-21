---
id: stock-buy-and-sell
topic: Arrays
title: Stock Buy and Sell
difficulty: Medium
status: ready
prerequisites:
  - print-subarray-with-maximum-subarray-sum
  - kadanes-algorithm
  - largest-element
  - for-loop
  - relational-and-logical-operators
  - time-and-space-complexity-basics
relatedIds:
  - kadanes-algorithm
  - print-subarray-with-maximum-subarray-sum
  - largest-element
  - maximum-consecutive-ones
---

<!-- @summary -->
Buy on one day and sell on a later one for maximum profit — Kadane's algorithm on consecutive price differences, except that the problem permits doing nothing, which makes the zero initialiser correct here and a bug in the subtopic before it.

<!-- @theory -->
## The problem

`prices[i]` is the price on day `i`. Buy on one day and sell on a **strictly
later** day. Return the maximum profit, or **0** if no profitable trade exists.

```
[7, 1, 5, 3, 6, 4]  ->  5   (buy day 1 at 1, sell day 4 at 6)
[7, 6, 4, 3, 1]     ->  0   (prices only fall — do not trade)
```

That second example carries the whole subtopic. **Doing nothing is a legal
choice**, so the answer is never negative.

## It is Kadane's algorithm in disguise

Look at what a trade actually earns. Buying on day `i` and selling on day `j` gives
`prices[j] − prices[i]`, which is exactly the sum of the consecutive differences
between those days:

```
prices        7    1    5    3    6    4
differences     -6   +4   -2   +3   -2
```

Buying at day 1 and selling at day 4 earns `+4 − 2 + 3 = 5` — the sum of the
differences in that window. So **maximum profit is the maximum subarray sum of the
difference array**, and the buy and sell days are that subarray's bounds. The
previous subtopic's index tracking is not a follow-up here; it is the answer
everyone actually wants.

Verified over every price array of length 0 to 6 drawn from `{1,2,3,5}` — 5,461
arrays — with both formulations at zero failures.

## The line that changed verdicts

Now the reason this is a separate subtopic rather than a footnote.

In Kadane's algorithm, initialising `best = 0` was a **bug**. The empty subarray
was forbidden, so on an all-negative array the algorithm returned 0 — a sum
belonging to no permitted subarray. Measured there: wrong on **100%** of
all-negative arrays.

Here, `best = 0` is **correct**. The empty trade is permitted, it earns 0, and on
a price series that only falls, 0 is the right answer.

The same line, in the same shape of loop, on the same underlying computation —
and the verdict flips because the **problem statement changed what counts as a
valid answer**.

You can watch it happen. Apply the previous subtopic's data-seeded Kadane to the
difference array:

| Prices | Differences | Max subarray sum (non-empty) | Max profit (0 allowed) |
|---|---|---|---|
| `[2, 1]` | `[-1]` | **−1** | **0** |
| `[5,4,3,2,1]` | `[-1,-1,-1,-1]` | **−1** | **0** |
| `[7,6,4,3,1]` | `[-1,-2,-1,-2]` | **−1** | **0** |

Measured, that mismatch occurs on 11 of the 5,461 test arrays — just 0.2%, and
every one of them a series that never rises. Same shape as the all-negative case
before: a low overall rate concentrated entirely in one input class.

**So the initialiser is not a matter of style or habit. Read the statement, decide
whether the empty choice is permitted, and initialise from that.** Nothing about
the code tells you which contract you are under.

The corresponding Kadane reset also changes: `cur = max(0, cur + d)` rather than
`cur = max(d, cur + d)`. Resetting to 0 instead of to the current element is the
same permission expressed inside the loop.

## The direct formulation, which is better anyway

You never need the difference array. Walk the prices once, remembering the
**cheapest price seen so far**:

```
best = 0
lowest = prices[0]
for each later price p:
    best   = max(best, p - lowest)     // sell today at the best buy so far
    lowest = min(lowest, p)            // or make today the new best buy
```

At each day you ask two questions: what would I earn selling today, and is today a
better day to have bought? That is the entire algorithm — O(n) time, O(1) space,
and no differences computed at all.

Note the order: **compute the profit before updating the minimum.** Reversed, the
same day could serve as both buy and sell, earning 0 — harmless here, but it
quietly permits a same-day trade the statement forbids.

## It is also the fastest

At n = 10,000,000:

| Approach | Time | Extra memory |
|---|---|---|
| **Minimum-tracking** | **5.99ms** | none |
| Kadane, differences materialised | 10.50ms | **38.1 MB** |
| Kadane, differences on the fly | 11.54ms | none |
| Brute force | — | none |

Brute force at n = 100,000 took **218.95ms** against minimum-tracking's **0.06ms**.

Minimum-tracking is roughly **1.9x faster** than the Kadane phrasing, and the
reason is the one established two subtopics ago: **dependency-chain length**.
Kadane's `cur` passes through an add *and* a max before the next iteration can
start. Minimum-tracking's two updates both read the freshly loaded price, and
neither sits on a chain — they can issue in parallel.

In Python the gap widens to **2.6x** (53.7ms against 139.4ms at n = 2,000,000),
because there the difference computation is interpreted as well.

And materialising the difference array buys nothing: 38.1 MB of allocation at ten
million elements to go from 11.54ms to 10.50ms.

## Returning the days

Usually you want to know *when* to trade, not just how much. Track the index of
the cheapest price alongside its value, and record both days whenever the profit
improves — exactly the pattern from the previous subtopic:

```
[7, 1, 5, 3, 6, 4]  ->  profit 5, buy day 1, sell day 4
[7, 6, 4, 3, 1]     ->  profit 0, no trade
```

Verified over all 5,461 test arrays: zero wrong profits and zero invalid day
pairs, with the no-profit case correctly reporting no trade rather than a
fabricated pair.

Decide what "no trade" looks like in your return type and say so — a sentinel pair
like `(−1, −1)`, an optional, or a documented convention. Returning `(0, 0)` is
the trap, because day 0 to day 0 looks like a real answer.

## Where this goes next

Allowing **multiple transactions** changes the algorithm entirely — with unlimited
trades you simply sum every positive difference, which is a different (and
easier) problem. Adding a **cooldown**, a **transaction fee**, or a **cap of k
transactions** turns it into dynamic programming. The single-transaction case is
the only one that reduces to Kadane's.

<!-- @intuition -->
Walk forward through the days carrying one number: the cheapest price you have seen so far. At every new day ask what you would make selling into it — and then ask whether today is cheap enough to become your new best purchase. You never need to look back, because the only thing about the past that can improve a future sale is the lowest price in it.

<!-- @approach -->
### Brute Force - Every Buy and Sell Pair

<!-- @idea -->
Try every pair of days with the sale after the purchase, keeping the largest profit.

<!-- @steps -->
1. Take each day in turn as the buying day.
2. Consider every strictly later day as the selling day.
3. Compute the profit for that pair.
4. Keep the largest profit seen, starting from 0 so that no-trade is the floor.
5. Return that profit.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct and quadratic. Measured 218.95ms at n = 100,000 against the single pass at 0.06ms, and it is the reference the linear approaches were verified against over all 5,461 exhaustive test arrays.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int maxProfit(const vector<int>& prices) {
    int best = 0;                              // 0 = do not trade, always allowed
    for (size_t i = 0; i < prices.size(); i++) {
        for (size_t j = i + 1; j < prices.size(); j++) {
            best = max(best, prices[j] - prices[i]);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 6: Starting at 0 rather than a sentinel, because the empty trade is a legal answer here.
- 8: j starts at i + 1, enforcing that the sale is strictly after the purchase.
- 12: Measured 218.95ms at n = 100,000 against 0.06ms for the single pass — roughly 3,600x.

<!-- @code java -->
```java
static int maxProfit(int[] prices) {
    int best = 0;
    for (int i = 0; i < prices.length; i++) {
        for (int j = i + 1; j < prices.length; j++) {
            best = Math.max(best, prices[j] - prices[i]);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 4: No early exit is possible — a much better pair may appear later in either loop.

<!-- @code python -->
```python
def max_profit(prices):
    best = 0
    for i in range(len(prices)):
        for j in range(i + 1, len(prices)):
            if prices[j] - prices[i] > best:
                best = prices[j] - prices[i]
    return best
```

<!-- @annotations -->
- 4: range(i + 1, ...) encodes the sell-after-buy rule directly rather than checking it inside the loop.

<!-- @approach -->
### Kadane on the Difference Array

<!-- @idea -->
Profit over a holding period is the sum of the daily price changes, so the answer is the maximum subarray sum of those changes.

<!-- @steps -->
1. Form the array of consecutive differences between adjacent prices.
2. Run Kadane's algorithm over it, resetting the running sum to 0 rather than to the current element.
3. Start the best at 0, because an empty holding period is permitted and earns nothing.
4. The maximum running sum is the maximum profit.
5. Compute the differences on the fly rather than materialising them, which saves the memory for nothing lost.

<!-- @complexity -->
- time: O(n)
- space: O(1) computing differences on the fly, O(n) if they are materialised
- note: Correct and the slower of the two linear formulations — 11.54ms at n = 10,000,000 against minimum-tracking's 5.99ms. Its value is conceptual: it makes the equivalence with Kadane's algorithm explicit, which is what the next several problems build on.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int maxProfit(const vector<int>& prices) {
    int best = 0, cur = 0;                     // 0, not prices[0] — see below

    for (size_t i = 1; i < prices.size(); i++) {
        int diff = prices[i] - prices[i - 1];   // computed on the fly
        cur  = max(0, cur + diff);              // reset to 0, not to diff
        best = max(best, cur);
    }
    return best;
}
```

<!-- @annotations -->
- 6: In Kadane's own subtopic this initialiser was a bug, wrong on 100% of all-negative inputs. Here it is correct, because doing nothing is allowed.
- 10: Materialising the differences instead costs 38.1 MB at n = 10,000,000 and measured only 10.50ms against 11.54ms.
- 11: max(0, ...) rather than max(diff, ...) — the same permission to hold nothing, expressed inside the loop.

<!-- @code java -->
```java
static int maxProfit(int[] prices) {
    int best = 0, cur = 0;

    for (int i = 1; i < prices.length; i++) {
        cur  = Math.max(0, cur + (prices[i] - prices[i - 1]));
        best = Math.max(best, cur);
    }
    return best;
}
```

<!-- @annotations -->
- 5: cur is loop-carried through an add and then a max, which is why this measured slower than tracking the minimum.

<!-- @code python -->
```python
def max_profit(prices):
    best = cur = 0

    for i in range(1, len(prices)):
        cur = max(0, cur + prices[i] - prices[i - 1])
        if cur > best:
            best = cur
    return best


# Measured 139.4ms at n = 2,000,000, against 53.7ms for minimum-tracking —
# 2.6x, wider than the 1.9x gap in C++ because the difference arithmetic is
# interpreted here too.
```

<!-- @annotations -->
- 5: Resetting to 0 is what distinguishes this from the previous subtopic's Kadane, where resetting to the element was required.

<!-- @approach -->
### Optimal - Track the Minimum Price So Far

<!-- @idea -->
At each day, sell into it at the cheapest price seen so far, then consider whether today is a better price to have bought at.

<!-- @steps -->
1. Return 0 immediately for an empty or single-day series, since no trade is possible.
2. Set the best profit to 0 and the lowest price to the first day's price.
3. For each later day, compute the profit from selling today at the lowest price so far.
4. Update the best profit if that beats it.
5. Then update the lowest price with today's price, in that order.
6. Return the best profit.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: One pass, two integers, no difference array. Measured the fastest approach at 5.99ms for ten million days — roughly 1.9x the Kadane formulation in C++ and 2.6x in Python — because its two updates are independent rather than chained.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int maxProfit(const vector<int>& prices) {
    if (prices.size() < 2) return 0;

    int best = 0, lowest = prices[0];

    for (size_t i = 1; i < prices.size(); i++) {
        best   = max(best, prices[i] - lowest);   // sell today
        lowest = min(lowest, prices[i]);          // or buy today — AFTER selling
    }
    return best;
}
```

<!-- @annotations -->
- 11: Computing the profit before updating the minimum is what prevents the same day acting as both buy and sell.
- 12: Both updates read the freshly loaded price and neither is loop-carried through the other, so they can issue in parallel.
- 14: Measured 5.99ms at n = 10,000,000 against the Kadane phrasing's 11.54ms — roughly 1.9x.

<!-- @code java -->
```java
static int maxProfit(int[] prices) {
    if (prices.length < 2) return 0;

    int best = 0, lowest = prices[0];

    for (int i = 1; i < prices.length; i++) {
        best   = Math.max(best, prices[i] - lowest);
        lowest = Math.min(lowest, prices[i]);
    }
    return best;
}
```

<!-- @annotations -->
- 7: Reversing these two lines would allow a same-day trade earning 0 — harmless in the result, wrong in the contract.

<!-- @code python -->
```python
def max_profit(prices):
    if len(prices) < 2:
        return 0

    best = 0
    lowest = prices[0]

    for p in prices[1:]:
        if p - lowest > best:
            best = p - lowest
        if p < lowest:
            lowest = p
    return best


# Measured 53.7ms at n = 2,000,000, against 139.4ms for the Kadane phrasing.
# Explicit comparisons rather than max()/min(), which are function calls per
# element — the same 14% effect measured in Kadane's own subtopic.
```

<!-- @annotations -->
- 9: The sell check comes first, so today's price cannot serve as both the purchase and the sale.

<!-- @approach -->
### Returning the Buy and Sell Days

<!-- @idea -->
Track the index of the cheapest price as well as its value, and record both days whenever the profit improves.

<!-- @steps -->
1. Track the lowest price seen so far and the day it occurred on.
2. At each later day, compute the profit from selling into it.
3. If that beats the best, record the lowest price's day as the buy day and today as the sell day.
4. Update the lowest price and its day afterwards, as before.
5. If no profitable trade exists, report no trade rather than a fabricated pair of days.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The same single pass with two extra integers. Verified over all 5,461 exhaustive test arrays with zero wrong profits and zero invalid day pairs, including the no-trade case reporting no days rather than day 0 to day 0.

<!-- @code cpp -->
```cpp
#include <vector>
#include <tuple>
using namespace std;

// returns {profit, buyDay, sellDay}; days are -1 when no trade is profitable
tuple<int,int,int> maxProfitDays(const vector<int>& prices) {
    if (prices.size() < 2) return {0, -1, -1};

    int best = 0, lowest = prices[0], lowestDay = 0;
    int buyDay = -1, sellDay = -1;

    for (int i = 1; i < (int)prices.size(); i++) {
        if (prices[i] - lowest > best) {
            best = prices[i] - lowest;
            buyDay = lowestDay; sellDay = i;    // copy the tracked day, not i
        }
        if (prices[i] < lowest) { lowest = prices[i]; lowestDay = i; }
    }
    return {best, buyDay, sellDay};
}
```

<!-- @annotations -->
- 9: The lowest price and the day it occurred travel together, exactly like the start marker in the previous subtopic.
- 15: buyDay takes lowestDay, never i — setting it to i here is the same bookkeeping bug measured at 62.6% one subtopic ago.
- 19: Verified over all 5,461 test arrays: 0 wrong profits and 0 invalid day pairs.

<!-- @code java -->
```java
static int[] maxProfitDays(int[] prices) {      // {profit, buyDay, sellDay}
    if (prices.length < 2) return new int[]{0, -1, -1};

    int best = 0, lowest = prices[0], lowestDay = 0;
    int buyDay = -1, sellDay = -1;

    for (int i = 1; i < prices.length; i++) {
        if (prices[i] - lowest > best) {
            best = prices[i] - lowest;
            buyDay = lowestDay; sellDay = i;
        }
        if (prices[i] < lowest) { lowest = prices[i]; lowestDay = i; }
    }
    return new int[]{ best, buyDay, sellDay };
}
```

<!-- @annotations -->
- 2: Returning -1 for both days rather than 0, so 'no trade' cannot be mistaken for buying and selling on day 0.

<!-- @code python -->
```python
def max_profit_days(prices):
    """returns (profit, buy_day, sell_day); days are -1 when no trade profits"""
    if len(prices) < 2:
        return 0, -1, -1

    best = 0
    lowest, lowest_day = prices[0], 0
    buy_day = sell_day = -1

    for i in range(1, len(prices)):
        if prices[i] - lowest > best:
            best = prices[i] - lowest
            buy_day, sell_day = lowest_day, i
        if prices[i] < lowest:
            lowest, lowest_day = prices[i], i

    return best, buy_day, sell_day


# Verified: [7,1,5,3,6,4] -> (5, 1, 4), and [7,6,4,3,1] -> (0, -1, -1).
```

<!-- @annotations -->
- 13: lowest_day, not i — the buy day is where the minimum was, which is usually several days earlier.
- 15: Updating the minimum and its day in one assignment keeps them from drifting apart.

<!-- @example -->

<!-- @input -->
prices = [7, 1, 5, 3, 6, 4]

<!-- @output -->
5 — buy on day 1 at 1, sell on day 4 at 6

<!-- @why -->
The minimum is set on day 1 and the answer is finalised on day 4, so the two events are three days apart — which is exactly why the buy day has to be carried rather than derived from the selling day.

<!-- @walkthrough -->
1. Start with the best profit at 0 and the lowest price at 7, on day 0.
2. Day 1, price 1: selling would lose 6, so the best stays 0 — but 1 is cheaper than 7, so the lowest becomes 1 on day 1.
3. Day 2, price 5: selling earns 5 - 1 = 4, which beats 0, so the best becomes 4 with days 1 and 2.
4. Day 3, price 3: selling earns 2, which does not beat 4, and 3 is not cheaper than 1.
5. Day 4, price 6: selling earns 5, which beats 4, so the best becomes 5 with days 1 and 4.
6. Day 5, price 4: selling earns 3, which does not beat 5.
7. The answer is 5, and the buy day was recorded from the tracked minimum rather than from the current index.

<!-- @example -->

<!-- @input -->
prices = [7, 6, 4, 3, 1]

<!-- @output -->
0 — do not trade

<!-- @why -->
The clearest demonstration that the two problems are the same computation under different rules — one forbids the empty selection and one permits it.

<!-- @walkthrough -->
1. The price falls every single day, so no sale can beat its purchase.
2. The best profit is never updated and finishes at its initial 0.
3. The lowest price is updated on every day, ending at 1 on the final day.
4. 0 is the correct answer, because the problem permits not trading at all.
5. Now compare with the previous subtopic: the differences are -1, -2, -1, -2, whose maximum non-empty subarray sum is -1.
6. That -1 is the correct answer to the Kadane question and the wrong answer to this one, purely because the contracts differ.

<!-- @example -->

<!-- @input -->
prices = [2, 1], solved with the previous subtopic's Kadane

<!-- @output -->
−1 instead of 0

<!-- @why -->
Two elements are enough to separate the contracts, and the 0.2% rate shows the same concentration seen elsewhere: rare overall, certain within one input class.

<!-- @walkthrough -->
1. The single difference is 1 - 2 = -1.
2. Kadane's algorithm as written in its own subtopic seeds the best from the first element, giving -1.
3. With only one difference there is nothing to improve on, so it returns -1.
4. As a maximum-subarray answer that is entirely correct — the best non-empty subarray of [-1] is [-1].
5. As a maximum-profit answer it is wrong, because refusing to trade earns 0 and 0 beats -1.
6. Measured, this mismatch occurred on 11 of 5,461 test arrays — 0.2% — and every one of them was a price series that never rises.

<!-- @example -->

<!-- @input -->
Ten million days through each approach

<!-- @output -->
Minimum-tracking 5.99ms, Kadane on the fly 11.54ms, Kadane materialised 10.50ms

<!-- @why -->
The same dependency-chain explanation that separated Kadane from the prefix formulation two subtopics ago, reappearing here between two phrasings of one problem.

<!-- @walkthrough -->
1. All three are single linear passes producing identical answers.
2. Minimum-tracking finished in 5.99ms, roughly 1.9 times faster than the Kadane phrasing.
3. The reason is the loop-carried dependency: Kadane's running value passes through an add and then a max before the next iteration can start.
4. Minimum-tracking's two updates both read the price just loaded, and neither depends on the other, so they can issue in parallel.
5. Materialising the difference array first took 10.50ms and allocated 38.1 megabytes, against 11.54ms and no allocation for computing them inline.
6. Brute force at a hundred thousand days took 218.95ms, against 0.06ms for the single pass at the same size.

<!-- @visualization custom -->

<!-- @description -->
A price chart as the primary view — days along the horizontal axis, price on the vertical, drawn as a line with a dot per day — because this is the one problem in the module where the natural picture is not an array strip. A descending marker tracks the lowest price seen so far and only ever moves down, dropping with a visible step whenever a new minimum appears and staying flat otherwise; that ratchet is the algorithm's memory. At each day draw a vertical measuring bar from the low-water marker up to the current price, labelled with the profit that sale would earn, and colour it only when it exceeds the best so far. When it does, lock a translucent band spanning from the minimum's day to the current day and print the pair of days — the band's left edge sits on the marker's day, several days back, which is the visual argument for carrying the buy day rather than deriving it. Beneath the chart, run the difference array as a second strip of signed bars so the equivalence is visible rather than asserted: highlight the differences inside the locked band and show their sum equalling the profit measured above. The contract panel is the decisive one. Run [7,6,4,3,1], a line that only falls, and show two answers side by side: the profit track ends with the best bar never leaving zero and prints 0 with an empty band labelled no trade, while the Kadane track over the same differences highlights the single least-negative bar and prints -1. Put the two initialisers on screen next to their results — best = 0 against best = differences[0] — and label them correct here and correct there, with the measured 0.2% mismatch rate and the note that every mismatch was a never-rising series. Close with a cost strip comparing the three linear passes at ten million days, and draw the dependency chains beside them: Kadane as add-then-max feeding the next iteration, minimum-tracking as two updates hanging independently off the loaded price.

<!-- @sampleInput -->
```json
{"primary":{"prices":[7,1,5,3,6,4],"trace":[{"day":0,"price":7,"lowest":7,"lowestDay":0,"sellProfit":null,"best":0},{"day":1,"price":1,"sellProfit":-6,"best":0,"newLow":true,"lowest":1,"lowestDay":1},{"day":2,"price":5,"sellProfit":4,"best":4,"locked":[1,2]},{"day":3,"price":3,"sellProfit":2,"best":4},{"day":4,"price":6,"sellProfit":5,"best":5,"locked":[1,4]},{"day":5,"price":4,"sellProfit":3,"best":5}],"answer":{"profit":5,"buyDay":1,"sellDay":4},"minimumSetOnDay":1,"answerFinalisedOnDay":4,"daysApart":3},"differenceStrip":{"differences":[-6,4,-2,3,-2],"insideLockedBand":[4,-2,3],"sum":5,"matchesProfit":true},"contractPanel":{"prices":[7,6,4,3,1],"differences":[-1,-2,-1,-2],"profitTrack":{"initialiser":"best = 0","answer":0,"band":"empty","label":"no trade"},"kadaneTrack":{"initialiser":"best = differences[0]","answer":-1,"highlights":"single least-negative bar"},"bothCorrect":true,"decidedBy":"whether the empty selection is permitted","mismatchArrays":11,"ofArrays":5461,"mismatchRate":0.002,"allMismatchesAre":"price series that never rise"},"smallestContrast":{"prices":[2,1],"differences":[-1],"kadane":-1,"profit":0},"cost":{"n":10000000,"minTrackingMs":5.99,"kadaneMaterialisedMs":10.50,"kadaneOnTheFlyMs":11.54,"diffArrayMB":38.1,"bruteAt100k":218.95,"minTrackAt100k":0.06,"chains":{"kadane":["add","max"],"minTracking":["independent","independent"]}},"python":{"n":2000000,"minTrackingMs":53.7,"kadaneMs":139.4,"ratio":2.6}}
```

<!-- @highlights -->
- The prices are drawn as a line chart with a dot per day, which is the natural picture for this problem rather than an array strip.
- A low-water marker tracks the cheapest price so far and ratchets downward only, never rising.
- On day 1 the price drops to 1 and the marker steps down with it, settling for the rest of the run.
- At each day a vertical bar measures from the marker up to that day's price, labelled with the profit that sale would earn.
- On day 2 the bar reaches 4, beats the best of 0, and a translucent band locks from day 1 to day 2.
- On day 4 the bar reaches 5 and the band widens to span days 1 through 4.
- The band's left edge sits three days behind the current day, which is the visual argument for carrying the buy day rather than deriving it.
- Beneath, the difference strip highlights the bars inside the band — 4, -2, 3 — and their sum prints as 5, matching the profit above.
- That matching sum is the equivalence with Kadane's algorithm shown rather than asserted.
- The contract panel runs [7,6,4,3,1], a line that only falls, on two tracks at once.
- The profit track's best bar never leaves zero, and it prints 0 with an empty band labelled no trade.
- The Kadane track over the same differences highlights the single least-negative bar and prints -1.
- The two initialisers sit beside their results — best = 0 against best = differences[0] — each labelled correct for its own contract.
- The measured mismatch rate prints alongside: 11 of 5,461 arrays, 0.2%, every one a series that never rises.
- The cost strip compares the three linear passes at ten million days: 5.99ms, 10.50ms and 11.54ms.
- Their dependency chains are drawn beside them — Kadane as add-then-max feeding the next iteration, minimum-tracking as two independent updates hanging off the loaded price.

<!-- @edgeCases -->
- Empty price list — no trade is possible and the answer is 0, which the length guard handles.
- A single day — you cannot sell after buying, so the answer is 0.
- Two days rising, such as [1,2] — the smallest profitable input, answer 1.
- Two days falling, such as [2,1] — the smallest input where the profit contract and the Kadane contract disagree.
- Strictly decreasing prices — the answer is 0, and the low-water marker moves every single day.
- Strictly increasing prices — the answer is the last price minus the first, and the marker never moves after day 0.
- All prices equal — every possible trade earns 0, which is also the no-trade answer.
- The minimum on the final day — it can never be used, since there is no later day to sell into.
- The maximum on the first day — it can never be used, since there is no earlier day to buy on.
- The best buy and the best sell separated by many days, which is why the buy day must be carried rather than recomputed.
- Several trades achieving the same maximum profit, where strict comparison keeps the earliest and any of them is a valid answer.

<!-- @pitfalls -->
- Carrying the previous subtopic's initialiser across. Seeding the best from data rather than 0 returns a negative profit on a never-rising series — measured on 11 of 5,461 test arrays, and on [2,1] it returns -1 where the answer is 0.
- Assuming the zero initialiser is always the bug. It was wrong in Kadane's algorithm and is right here; the problem statement decides, and nothing in the code reveals which contract applies.
- Writing the Kadane reset as max(diff, cur + diff) rather than max(0, cur + diff), which forbids the empty holding period the problem allows.
- Updating the lowest price before computing the profit, which lets a single day act as both the purchase and the sale.
- Materialising the difference array. It allocated 38.1 MB at n = 10,000,000 and measured 10.50ms against 11.54ms computing them inline — not worth the memory.
- Selling before buying, by allowing the sell index to be less than or equal to the buy index.
- Returning (0, 0) for the no-trade case, which is indistinguishable from a genuine trade on day 0.
- Recording the buy day as the current index when the profit improves, rather than as the day the minimum occurred — the same 62.6% bookkeeping bug from the previous subtopic.
- Reaching for the Kadane phrasing because it shows the connection. It measured 1.9x slower in C++ and 2.6x slower in Python than tracking the minimum directly.
- Using max() and min() inside a hot Python loop, which are function calls per element — the same 14% cost measured in Kadane's own subtopic.
- Applying this to the multiple-transaction version. With unlimited trades the answer is the sum of all positive differences, which is a different and simpler problem.
- Assuming the maximum price gives the sell day. The best sale is relative to the cheapest price before it, not to the global maximum.

<!-- @doubt -->
### How is this the same as Kadane's algorithm?

<!-- @answer -->
Because the profit from holding between two days is the sum of the daily price changes across that period. On [7,1,5,3,6,4] the differences are -6, 4, -2, 3, -2, and buying on day 1 and selling on day 4 earns 4 - 2 + 3 = 5 — exactly the sum of the differences in that window. So the maximum profit is the maximum subarray sum of the difference array, and the buy and sell days are that subarray's bounds. Verified over all 5,461 exhaustive test arrays with zero failures.

<!-- @doubt -->
### Then why isn't the answer just Kadane's algorithm unchanged?

<!-- @answer -->
Because the contracts differ on one point: this problem permits doing nothing. Kadane's requires a non-empty subarray, so on an all-negative difference array it must return the least-negative value. Here, refusing to trade earns 0, and 0 beats any loss. On prices [2,1] the single difference is -1: Kadane's correctly returns -1, and the correct profit is 0. Measured, that mismatch occurred on 11 of 5,461 test arrays — 0.2% — and every one was a price series that never rises.

<!-- @doubt -->
### So is initialising best to 0 a bug or not?

<!-- @answer -->
It depends entirely on the problem statement, which is why this subtopic exists. In Kadane's algorithm it was a bug — measured wrong on 100% of all-negative arrays, because it returned the sum of a subarray you were not allowed to choose. Here it is correct, because the empty trade is allowed and earns exactly 0. Same line, same shape of loop, same underlying computation, opposite verdicts. Nothing in the code tells you which contract you are under: read the statement, decide whether the empty selection is permitted, and initialise from that.

<!-- @doubt -->
### Do I need to build the difference array?

<!-- @answer -->
No, and you should not. You can compute each difference inline as prices[i] - prices[i-1], which needs no allocation at all. Measured at n = 10,000,000, materialising the array cost 38.1 megabytes and took 10.50ms against 11.54ms computing inline — a difference far too small to justify the memory. Better still, skip the differences entirely and track the minimum price directly, which measured 5.99ms.

<!-- @doubt -->
### Why is tracking the minimum faster than the Kadane phrasing?

<!-- @answer -->
Dependency-chain length, the same mechanism that separated Kadane from the prefix formulation two subtopics ago. Kadane's running value passes through an addition and then a maximum before the next iteration can begin — two dependent operations on the critical path. Tracking the minimum performs two updates that both read the price just loaded and neither depends on the other, so they can issue in parallel. Measured 5.99ms against 11.54ms at ten million days, roughly 1.9x, and 2.6x in Python where the difference arithmetic is interpreted as well.

<!-- @doubt -->
### Why compute the profit before updating the minimum?

<!-- @answer -->
Because reversing them lets the same day serve as both the purchase and the sale. If you update the lowest price first, then today's price may already be the minimum, and selling into it earns 0. That does not change the returned number, since 0 is the floor anyway — but it means your code is computing a trade the problem forbids, and the moment you extend it to return the days, or to require a strictly positive profit, the bug becomes visible. Keep the ordering correct because the contract requires it, not because the current answer depends on it.

<!-- @doubt -->
### How do I return the buy and sell days?

<!-- @answer -->
Track the day the minimum occurred alongside its value, and when the profit improves, record that day as the buy day and the current day as the sell day. The key point is the same as the previous subtopic: the buy day comes from the tracked minimum, not from the current index. On [7,1,5,3,6,4] the minimum is set on day 1 and the answer is finalised on day 4 — three days apart — so deriving the buy day from the sell day would be wrong. Verified over all 5,461 test arrays with zero invalid day pairs.

<!-- @doubt -->
### What should I return when no trade is profitable?

<!-- @answer -->
The profit is unambiguously 0, but the days need a decision. Returning (0, 0) is the trap, because it is indistinguishable from genuinely buying and selling on day 0 — which is itself not a legal trade. Use a sentinel pair like (-1, -1), an optional, or a separate boolean, and document it. The samples here return -1 for both days and were verified to do so on every no-profit test array rather than fabricating a pair.

<!-- @doubt -->
### Does this extend to multiple transactions?

<!-- @answer -->
Not directly, and the multi-transaction version is actually easier. With unlimited trades you can capture every upward move independently, so the answer is simply the sum of all positive differences — no Kadane, no minimum tracking. Adding constraints is what makes it hard: a cooldown between trades, a transaction fee, or a cap of k transactions all turn it into dynamic programming with a state per day. The single-transaction case is the only one that reduces to a maximum-subarray problem.
