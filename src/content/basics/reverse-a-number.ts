import type { SubtopicContent } from "../types";

/**
 * Subtopic 23 of Basics (Medium #7). Middle of the chain:
 * Count Digits -> Reverse a Number -> Palindrome Number.
 *
 * SOURCES
 * - GeeksforGeeks, "Reverse Digits of a Number" — iterative O(D) time / O(1)
 *   space, and the recursive variant.
 * - GeeksforGeeks, "Reverse digits of an integer with overflow handled" — the
 *   key technique: you cannot multiply and then test for overflow, you must test
 *   BEFORE multiplying, by comparing against MAX_VALUE / 10.
 *
 * MEASURED ON THIS MACHINE, not assumed:
 *
 * 1. OVERFLOW IS REAL AND REACHABLE. 1534236469 is a perfectly valid int whose
 *    reverse is 9646324351, well past INT_MAX. With a naive int accumulator g++
 *    returns 1056389759 — silent garbage. 2147483647 reverses to -1126087180.
 *
 * 2. THE NAIVE LOOP IS AN INFINITE LOOP IN PYTHON FOR NEGATIVES. Because Python
 *    floors toward negative infinity, -1 // 10 is -1, not 0. Traced: -123 goes
 *    -13, -2, -1, -1, -1, ... forever. The identical algorithm terminates
 *    correctly in C++ and Java, which truncate toward zero. This is the direct
 *    payoff of the divergence taught in arithmetic-operators.
 *
 * 3. The check-before-multiply guard was verified across boundary values:
 *    1463847412 -> 2147483641 (fits), 1534236469 -> 0 (rejected), and it
 *    round-trips.
 */
const content: SubtopicContent = {
  id: "reverse-a-number",
  topic: "Basics",
  title: "Reverse a Number",
  difficulty: "Medium",
  status: "ready",

  prerequisites: [
    "count-digits",
    "while-loop",
    "arithmetic-operators",
    "data-types",
    "integer-overflow-and-precision-errors",
  ],

  summary:
    "Turn 12345 into 54321 using the same extraction loop as Count Digits, plus an accumulator — and handle the two things that break it: integer overflow, and Python's floor division.",

  theory: `
## The problem

Given an integer \`N\`, return its digits in reverse order.

\`\`\`
N = 12345  ->  54321
N = 7789   ->  9877
N = 1200   ->  21        (trailing zeros disappear)
N = -123   ->  -321
\`\`\`

## The same loop, one line longer

Count Digits used only \`N / 10\` to shrink the number. Reversing needs the other half
of the pair as well:

- **\`N % 10\`** reads the last digit.
- **\`N / 10\`** removes it.

Take each digit off the back of \`N\` and push it onto the back of a growing
accumulator:

\`\`\`
rev = rev * 10 + n % 10;
n = n / 10;
\`\`\`

Those two lines are the whole algorithm. The first one deserves a moment:
**\`rev * 10\` shifts every digit already in \`rev\` one place to the left**, opening a
units slot, and **\`+ n % 10\`** drops the newly-read digit into it.

\`\`\`
n = 12345, rev = 0
  read 5 -> rev = 0*10 + 5 = 5        n = 1234
  read 4 -> rev = 5*10 + 4 = 54       n = 123
  read 3 -> rev = 54*10 + 3 = 543     n = 12
  read 2 -> rev = 543*10 + 2 = 5432   n = 1
  read 1 -> rev = 5432*10 + 1 = 54321 n = 0
\`\`\`

The loop terminates for the same reason it did in Count Digits: integer division
truncates, so a single digit divided by 10 becomes 0.

## Trailing zeros do not survive

\`1200\` reverses to \`21\`, not \`0021\`. The two leading zeros in \`0021\` are not part of
the number — \`0021\` **is** \`21\`. Nothing is lost that a number could have held; the
information only existed in the written form.

This is usually correct behaviour and is worth stating explicitly, because it looks
like a bug the first time you see it. If you need \`0021\`, you are working with a
string, not an integer.

## The real problem: overflow

**A number that fits can have a reverse that does not.**

\`1534236469\` is a perfectly ordinary 32-bit \`int\` — well under the maximum of
\`2147483647\`. Its reverse is \`9646324351\`, which is more than four times too large.

Measured on this machine with a naive \`int\` accumulator:

| N | true reverse | naive int returns |
|---|---|---|
| 1,534,236,469 | 9,646,324,351 | **1,056,389,759** ✗ |
| 2,147,483,647 | 7,463,847,412 | **-1,126,087,180** ✗ |

No error, no warning — just a wrong number, and in the second case a negative one.
This is exactly the overflow from the data-types subtopic, arriving in a real
algorithm.

**Any input with 10 digits can overflow a 32-bit \`int\` when reversed.** For 64-bit,
19-digit inputs can overflow a \`long long\`.

## Detecting overflow before it happens

The instinct is to multiply and then check whether the result looks wrong. **That does
not work** — once the multiplication has overflowed, the value is already garbage and
there is nothing left to inspect.

You have to check **before** multiplying. The trick is to divide the limit instead:

\`\`\`
if (rev > INT_MAX / 10) -> the next rev * 10 will overflow
\`\`\`

That comparison itself cannot overflow, because \`INT_MAX / 10\` is a small number and
\`rev\` is being compared, not multiplied.

One boundary case remains: if \`rev\` is **exactly** \`INT_MAX / 10\`, whether it
overflows depends on the digit about to be added. \`INT_MAX\` is \`2147483647\`, so
\`INT_MAX / 10\` is \`214748364\` and the final digit is \`7\`. Adding a digit above 7 tips
it over:

\`\`\`
if (rev > INT_MAX/10 || (rev == INT_MAX/10 && digit > 7)) return 0;
\`\`\`

The negative side mirrors it: \`INT_MIN\` is \`-2147483648\`, so the guard digit is \`-8\`.

**Verified across the boundary**: \`1463847412\` reverses to \`2147483641\`, which fits
and is returned. \`1534236469\` is correctly rejected and returns 0.

Returning 0 on overflow is the convention this problem uses. Other reasonable
choices are throwing, or returning a wider type — but you must choose one, because
silently returning garbage is not an option.

**Or sidestep it**: if the input is an \`int\`, accumulate into a \`long long\`. A 10-digit
reverse cannot overflow 64 bits. That is the simplest fix when the type is yours to
choose.

## Negatives, and a Python trap worth the whole subtopic

In C++ and Java the naive loop handles negatives **for free**. Both truncate division
toward zero and give the remainder the dividend's sign, so:

\`\`\`
-123 % 10  ->  -3        -123 / 10  ->  -12
\`\`\`

Every extracted digit is negative, \`rev\` accumulates negatively, and the answer comes
out as \`-321\` with no sign handling at all.

**Python is different, and the identical code hangs forever.**

Python floors toward negative infinity and gives the remainder the *divisor's* sign,
which was the divergence taught in Arithmetic Operators. Traced on this machine:

\`\`\`
n = -123, rev = 0
  rev = 0*10 + (-123 % 10) = 7      n = -123 // 10 = -13
  rev = 7*10 + (-13 % 10)  = 77     n = -13 // 10  = -2
  rev = 77*10 + (-2 % 10)  = 778    n = -2 // 10   = -1
  rev = 778*10 + (-1 % 10) = 7789   n = -1 // 10   = -1   <-- stuck
  rev = 7789*10 + 9        = 77899  n = -1 // 10   = -1   <-- stuck
  ...
\`\`\`

**\`-1 // 10\` is \`-1\`, not \`0\`.** Flooring −0.1 rounds *down* to −1, so \`n\` never
reaches zero and \`while n != 0\` never terminates. The digits are wrong too.

**The fix in Python: take the absolute value, reverse, then reapply the sign.**

\`\`\`
sign = -1 if n < 0 else 1
n = abs(n)
# ... reverse the positive value ...
return sign * rev
\`\`\`

This is worth internalising, because it is the shape of a whole class of bugs:
**an algorithm can be correct in one language and non-terminating in another purely
because of how each rounds negative division.**

## Approaches

| # | Approach | Time | Space |
|---|---|---|---|
| 1 | Iterative accumulator | O(log₁₀ N) | O(1) |
| 2 | Recursion | O(log₁₀ N) | **O(log₁₀ N)** — call stack |
| 3 | String reversal | O(log₁₀ N) | **O(log₁₀ N)** — the string |
| 4 | Overflow-safe iterative | O(log₁₀ N) | O(1) |

Approach 1 is the one to know. Approach 4 is approach 1 with the guard, and is what
you should write when the input type is fixed.

## Where this goes next

A number is a palindrome when its reverse equals the original. That is this algorithm
plus one comparison, and it is the next subtopic — including the trick that avoids
the overflow problem entirely by only reversing **half** the digits.
`.trim(),

  intuition:
    "Reversing is pouring digits from one container into another. Each pour takes the last digit off the source and multiplying the destination by ten opens a slot for it. The two things that go wrong are the destination overflowing, and — in Python — the source never emptying.",

  approaches: [
    {
      name: "Iterative Accumulator",
      idea: "Read the last digit off N and append it to a growing result, shifting the result left by one place each time.",
      steps: [
        "Initialise the result accumulator to zero.",
        "In Python, record the sign and take the absolute value first, since the loop does not terminate for negatives there.",
        "While N is not yet exhausted, read its last digit with modulo 10.",
        "Multiply the accumulator by 10 to open a units slot, then add that digit.",
        "Remove the digit from N with integer division by 10.",
        "When N reaches zero, the accumulator holds the reversed number; reapply the sign if one was recorded.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

// Accumulating into long long so a 10-digit int cannot overflow the result
long long reverseNumber(int n) {
    long long rev = 0;
    while (n != 0) {
        int digit = n % 10;      // read the last digit
        rev = rev * 10 + digit;  // shift left, then append
        n /= 10;                 // remove it from n
    }
    return rev;
}

int main() {
    cout << reverseNumber(12345) << endl;   // 54321
    cout << reverseNumber(7789)  << endl;   // 9877
    cout << reverseNumber(1200)  << endl;   // 21   — trailing zeros vanish
    cout << reverseNumber(-123)  << endl;   // -321 — negatives work for free
    cout << reverseNumber(0)     << endl;   // 0

    // Why the wider accumulator matters:
    cout << reverseNumber(1534236469) << endl;   // 9646324351 — needs 64 bits
    return 0;
}`,
          annotations: {
            5: "Declaring rev as long long is the simplest overflow fix when the input is an int.",
            8: "rev * 10 shifts every existing digit one place left, opening the units slot for the new digit.",
            17: "In C++ and Java, -123 % 10 is -3 and -123 / 10 is -12, so the sign carries through automatically.",
            21: "With an int accumulator this returns 1056389759 — silent garbage. Measured with g++.",
          },
        },
        {
          language: "java",
          code: `public class ReverseNumber {

    static long reverseNumber(int n) {
        long rev = 0;
        while (n != 0) {
            int digit = n % 10;
            rev = rev * 10 + digit;
            n /= 10;
        }
        return rev;
    }

    public static void main(String[] args) {
        System.out.println(reverseNumber(12345));   // 54321
        System.out.println(reverseNumber(7789));    // 9877
        System.out.println(reverseNumber(1200));    // 21
        System.out.println(reverseNumber(-123));    // -321
        System.out.println(reverseNumber(0));       // 0

        System.out.println(reverseNumber(1534236469));   // 9646324351
    }
}`,
          annotations: {
            4: "Java truncates division toward zero exactly as C++ does, so negatives need no special handling.",
          },
        },
        {
          language: "python",
          code: `def reverse_number(n):
    sign = -1 if n < 0 else 1
    n = abs(n)                       # MANDATORY in Python — see below

    rev = 0
    while n > 0:
        digit = n % 10
        rev = rev * 10 + digit
        n //= 10
    return sign * rev

print(reverse_number(12345))   # 54321
print(reverse_number(7789))    # 9877
print(reverse_number(1200))    # 21
print(reverse_number(-123))    # -321
print(reverse_number(0))       # 0

# Python integers are unbounded, so overflow is not a concern here
print(reverse_number(1534236469))   # 9646324351

# WITHOUT abs(), this is an INFINITE LOOP for negative input:
#   n = -123 -> -13 -> -2 -> -1 -> -1 -> -1 -> ... forever
# because -1 // 10 is -1 in Python, not 0. Traced on this machine.`,
          annotations: {
            3: "Not optional. Python floors toward negative infinity, so a negative n never reaches zero.",
            10: "Reapply the sign at the end, since the loop worked on the positive value.",
            22: "The same algorithm terminates correctly in C++ and Java, which truncate toward zero instead.",
          },
        },
      ],
      complexity: {
        time: "O(log₁₀ N)",
        space: "O(1)",
        note: "One iteration per digit, bounded at 10 for a 32-bit int and 19 for a 64-bit integer. Only the accumulator and a digit variable are stored, so the space does not grow with the input.",
      },
    },
    {
      name: "Recursion",
      idea: "Express the same construction as a function calling itself, carrying the accumulator through the calls.",
      steps: [
        "Define a helper taking both the remaining number and the accumulator built so far.",
        "The base case is a remaining number of zero, at which point the accumulator is the answer.",
        "Otherwise read the last digit, append it to the accumulator, and recurse on the number with that digit removed.",
        "Each call reduces the number by one digit, so the base case is always reached.",
        "Note that every pending call holds a stack frame, so the memory grows with the digit count.",
      ],
      code: [
        {
          language: "cpp",
          code: `// Accumulator-passing style — the accumulator carries the partial result down
long long reverseRec(int n, long long rev = 0) {
    if (n == 0) return rev;                        // base case
    return reverseRec(n / 10, rev * 10 + n % 10);  // one digit per call
}

cout << reverseRec(12345) << endl;   // 54321
cout << reverseRec(7789)  << endl;   // 9877
cout << reverseRec(-123)  << endl;   // -321

// The call chain for 12345:
//   reverseRec(12345, 0)
//   reverseRec(1234,  5)
//   reverseRec(123,   54)
//   reverseRec(12,    543)
//   reverseRec(1,     5432)
//   reverseRec(0,     54321)  -> base case returns 54321
// Five frames existed at the deepest point.`,
          annotations: {
            2: "A default argument gives the caller a clean one-argument interface while the helper carries the accumulator.",
            3: "The recursive call is in tail position, so some compilers can optimise the stack away entirely.",
          },
        },
        {
          language: "java",
          code: `// Java has no default arguments, so overloading supplies the initial accumulator
static long reverseRec(int n) {
    return reverseRec(n, 0L);
}

static long reverseRec(int n, long rev) {
    if (n == 0) return rev;
    return reverseRec(n / 10, rev * 10 + n % 10);
}

System.out.println(reverseRec(12345));   // 54321
System.out.println(reverseRec(7789));    // 9877
System.out.println(reverseRec(-123));    // -321

// This is exactly the overloading-as-default-arguments pattern
// from the Function Overloading subtopic.`,
          annotations: {
            2: "The one-argument version exists purely to supply the starting accumulator.",
          },
        },
        {
          language: "python",
          code: `def reverse_rec(n, rev=0):
    if n == 0:
        return rev
    return reverse_rec(n // 10, rev * 10 + n % 10)

def reverse_number_rec(n):
    sign = -1 if n < 0 else 1
    return sign * reverse_rec(abs(n))   # abs() still mandatory

print(reverse_number_rec(12345))   # 54321
print(reverse_number_rec(7789))    # 9877
print(reverse_number_rec(-123))    # -321

# Without abs() the recursion never reaches n == 0 for negatives
# and hits RecursionError instead of looping forever —
# a different symptom of the same floor-division cause.`,
          annotations: {
            1: "Python has real default arguments, so no overloading is needed. The default 0 is immutable and therefore safe to share.",
            13: "The infinite loop becomes a stack overflow in the recursive form, which at least fails loudly.",
          },
        },
      ],
      complexity: {
        time: "O(log₁₀ N)",
        space: "O(log₁₀ N)",
        note: "The same number of steps as the loop, but every pending call holds a stack frame until the base case returns, so memory grows with the digit count. At most 19 frames for a 64-bit integer. The recursive call sits in tail position, which some compilers can optimise back to constant space.",
      },
    },
    {
      name: "String Reversal",
      idea: "Convert the number to text, reverse the characters, and convert back.",
      steps: [
        "Record the sign and take the absolute value, so the minus character is not reversed into the middle.",
        "Convert the number to its string representation.",
        "Reverse the characters of that string.",
        "Convert the reversed string back to an integer, which discards any leading zeros automatically.",
        "Reapply the sign to the result.",
      ],
      code: [
        {
          language: "python",
          code: `def reverse_str(n):
    sign = -1 if n < 0 else 1
    return sign * int(str(abs(n))[::-1])

print(reverse_str(12345))   # 54321
print(reverse_str(7789))    # 9877
print(reverse_str(1200))    # 21   — int() drops the leading zeros of "0021"
print(reverse_str(-123))    # -321
print(reverse_str(0))       # 0

# Note how the trailing-zero behaviour falls out naturally:
print(str(1200)[::-1])      # "0021" — as a string, the zeros are still there
print(int("0021"))          # 21     — converting back discards them`,
          annotations: {
            3: "The slice with a step of -1 reverses the string. abs() keeps the minus sign out of it.",
            12: "The clearest demonstration that trailing zeros exist in the written form and not in the number.",
          },
        },
        {
          language: "cpp",
          code: `#include <string>
#include <algorithm>
using namespace std;

long long reverseStr(int n) {
    bool negative = n < 0;
    string s = to_string(negative ? -(long long) n : (long long) n);
    reverse(s.begin(), s.end());
    long long rev = stoll(s);
    return negative ? -rev : rev;
}

cout << reverseStr(12345) << endl;   // 54321
cout << reverseStr(1200)  << endl;   // 21
cout << reverseStr(-123)  << endl;   // -321

// Casting to long long before negating avoids the INT_MIN trap,
// where -INT_MIN does not fit back into an int.`,
          annotations: {
            7: "std::reverse works in place on the string's iterators.",
            8: "stoll rather than stoi, since the reversed value may exceed int range.",
          },
        },
        {
          language: "java",
          code: `static long reverseStr(int n) {
    boolean negative = n < 0;
    String s = String.valueOf(Math.abs((long) n));
    String reversed = new StringBuilder(s).reverse().toString();
    long rev = Long.parseLong(reversed);
    return negative ? -rev : rev;
}

System.out.println(reverseStr(12345));   // 54321
System.out.println(reverseStr(1200));    // 21
System.out.println(reverseStr(-123));    // -321

// Cast to long before Math.abs, since Math.abs(Integer.MIN_VALUE)
// is still negative — the positive counterpart does not fit in an int.`,
          annotations: {
            4: "StringBuilder has a built-in reverse; String itself does not.",
            12: "The most-negative-value trap, avoided by widening before taking the absolute value.",
          },
        },
      ],
      complexity: {
        time: "O(log₁₀ N)",
        space: "O(log₁₀ N)",
        note: "Building and reversing the string touches every digit, matching the loop's time. It stores those digits, so unlike the iterative version its space grows with the input. It also sidesteps the negative-division problem entirely, since no division happens.",
      },
    },
    {
      name: "Overflow-Safe Iterative",
      idea: "Test whether the next multiplication will overflow before performing it, rather than checking the result afterwards.",
      steps: [
        "Read the last digit and remove it from N, before touching the accumulator.",
        "Compare the accumulator against the type's maximum divided by 10 — a comparison that cannot itself overflow.",
        "If the accumulator already exceeds that, the next multiplication would overflow, so report failure.",
        "If it equals that exactly, compare the incoming digit against the maximum's own last digit.",
        "Mirror both checks against the minimum for negative accumulators.",
        "Only once both checks pass, multiply by 10 and add the digit.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <climits>

// Returns 0 if the reversed value would not fit in an int
int reverseSafe(int x) {
    int rev = 0;
    while (x != 0) {
        int digit = x % 10;
        x /= 10;                        // remove it BEFORE the guard

        // INT_MAX is 2147483647, so INT_MAX/10 is 214748364 and the last digit is 7
        if (rev > INT_MAX / 10 || (rev == INT_MAX / 10 && digit > 7))  return 0;
        // INT_MIN is -2147483648, so the mirrored guard digit is -8
        if (rev < INT_MIN / 10 || (rev == INT_MIN / 10 && digit < -8)) return 0;

        rev = rev * 10 + digit;         // now provably safe
    }
    return rev;
}

// Verified across the boundary with g++ on this machine:
cout << reverseSafe(1463847412) << endl;   // 2147483641 — fits, returned
cout << reverseSafe(1534236469) << endl;   // 0          — would overflow
cout << reverseSafe(2147483647) << endl;   // 0          — would overflow
cout << reverseSafe(-1534236469) << endl;  // 0          — negative side too
cout << reverseSafe(12345) << endl;        // 54321
cout << reverseSafe(-123)  << endl;        // -321`,
          annotations: {
            10: "The comparison uses division rather than multiplication, so it cannot overflow while testing for overflow.",
            12: "Both guards are needed. Checking only the positive side lets large negatives through.",
            14: "By this line the multiplication is guaranteed to fit, so no undefined behaviour can occur.",
          },
        },
        {
          language: "java",
          code: `static int reverseSafe(int x) {
    int rev = 0;
    while (x != 0) {
        int digit = x % 10;
        x /= 10;

        if (rev > Integer.MAX_VALUE / 10
            || (rev == Integer.MAX_VALUE / 10 && digit > 7))  return 0;
        if (rev < Integer.MIN_VALUE / 10
            || (rev == Integer.MIN_VALUE / 10 && digit < -8)) return 0;

        rev = rev * 10 + digit;
    }
    return rev;
}

System.out.println(reverseSafe(1463847412));   // 2147483641
System.out.println(reverseSafe(1534236469));   // 0
System.out.println(reverseSafe(12345));        // 54321

// Java's Math.addExact and Math.multiplyExact throw ArithmeticException
// on overflow, which is an alternative to checking by hand:
//   rev = Math.addExact(Math.multiplyExact(rev, 10), digit);`,
          annotations: {
            7: "Java's overflow wraps silently by default, exactly as C++ does for signed types in practice.",
            21: "A cleaner option unique to Java — it converts silent wrapping into a thrown exception.",
          },
        },
        {
          language: "python",
          code: `# Python integers are unbounded, so arithmetic overflow cannot occur.
# The guard is only needed when a problem statement imposes a 32-bit range.

INT_MAX = 2 ** 31 - 1      # 2147483647
INT_MIN = -2 ** 31         # -2147483648

def reverse_safe(n):
    sign = -1 if n < 0 else 1
    n = abs(n)

    rev = 0
    while n > 0:
        rev = rev * 10 + n % 10
        n //= 10

    rev *= sign
    # Python can compute the full value first and range-check afterwards,
    # because nothing was lost to wrapping along the way.
    if rev < INT_MIN or rev > INT_MAX:
        return 0
    return rev

print(reverse_safe(1463847412))    # 2147483641
print(reverse_safe(1534236469))    # 0
print(reverse_safe(12345))         # 54321
print(reverse_safe(-123))          # -321`,
          annotations: {
            1: "The one place Python's unbounded integers are a genuine advantage over C++ and Java.",
            17: "Checking afterwards is only valid because Python never wrapped. In C++ or Java the value would already be garbage.",
          },
        },
      ],
      complexity: {
        time: "O(log₁₀ N)",
        space: "O(1)",
        note: "Identical to the plain iterative version plus two constant-time comparisons per digit. The guards do not change the complexity class, and the space stays constant. In Python the range check happens once at the end rather than per digit, because unbounded integers mean nothing is lost along the way.",
      },
    },
  ],

  examples: [
    {
      input: "N = 12345",
      output: "54321",
      walkthrough: [
        "The accumulator starts at 0 and N is 12345.",
        "Read the last digit with 12345 % 10, giving 5. The accumulator becomes 0 times 10 plus 5, which is 5, and N becomes 1234.",
        "Read 4. The accumulator shifts left to 50 and gains the 4, giving 54, and N becomes 123.",
        "Read 3. The accumulator becomes 543 and N becomes 12.",
        "Read 2. The accumulator becomes 5432 and N becomes 1.",
        "Read 1. The accumulator becomes 54321 and N becomes 0, since 1 divided by 10 truncates to zero.",
        "The condition fails and the accumulator holds 54321.",
      ],
      why: "Shows the two roles clearly: multiplying by ten opens a slot, and the modulo supplies what goes in it.",
    },
    {
      input: "N = 1200",
      output: "21",
      walkthrough: [
        "Read 0. The accumulator becomes 0 times 10 plus 0, which is still 0, and N becomes 120.",
        "Read 0 again. The accumulator is still 0, and N becomes 12.",
        "Read 2. The accumulator becomes 2 and N becomes 1.",
        "Read 1. The accumulator becomes 21 and N becomes 0.",
        "The result is 21 rather than 0021, because leading zeros are not part of a number's value.",
        "The two zeros were never lost — they simply have no representation in an integer once nothing follows them.",
      ],
      why: "Looks like a bug the first time it appears. Stating it explicitly prevents a student from adding a broken workaround.",
    },
    {
      input: "N = 1534236469 with a 32-bit int accumulator",
      output: "1056389759 — silently wrong. The true reverse is 9646324351.",
      walkthrough: [
        "The input is a perfectly valid int, well under the maximum of 2147483647.",
        "The loop proceeds normally until the accumulator reaches 964632435 with one digit still to add.",
        "The next step needs 964632435 times 10 plus 1, which is 9646324351.",
        "That value needs more than 31 bits, so the high bits are discarded and what remains is reinterpreted.",
        "The function returns 1056389759, which was measured with g++ on this machine.",
        "No error or warning is produced at any point, so the wrong answer flows onward silently.",
      ],
      why: "The overflow lesson from data-types arriving in a real algorithm, with a reachable input rather than a contrived one.",
    },
    {
      input: "N = -123 in Python, using the same loop that works in C++ and Java",
      output: "An infinite loop — the value gets stuck at -1 forever",
      walkthrough: [
        "Reading -123 % 10 in Python gives 7, not -3, because the remainder takes the divisor's sign.",
        "Dividing -123 // 10 gives -13, because flooring rounds toward negative infinity rather than toward zero.",
        "The next steps give -2, then -1, with the accumulator collecting wrong digits along the way.",
        "At -1 the division gives -1 // 10, which floors -0.1 down to -1 rather than truncating it to 0.",
        "So N stays at -1 on every subsequent iteration and the condition testing against zero never fails.",
        "The identical code in C++ and Java terminates correctly, because both truncate toward zero and give the remainder the dividend's sign.",
      ],
      why: "Traced on this machine. The clearest possible payoff of the negative-division divergence taught in Arithmetic Operators — the same algorithm is correct in two languages and non-terminating in the third.",
    },
  ],

  visualization: {
    kind: "custom",
    description:
      "Draw two containers side by side: a SOURCE holding N as a row of digit tiles, and a RESULT holding the accumulator, initially empty. Each iteration animates one pour: the rightmost tile of the source detaches, the entire result row slides one place left to open an empty units slot — draw that shift explicitly, since multiplying by ten is the step students treat as magic — and the detached tile drops into the new slot. The source shrinks 12345, 1234, 123, 12, 1, empty, while the result grows 5, 54, 543, 5432, 54321. Replay with 1200 so the first two pours drop zeros into a result that is still zero, visibly producing nothing, and the final result reads 21 with a label noting the zeros had no place to occupy. The OVERFLOW panel adds a capacity bar beneath the result sized to INT_MAX, filling as the accumulator grows; run 1534236469 and show the bar filling steadily until the final pour, at which point the value visibly exceeds the bar, the excess high bits shear off the top exactly as in the data-types visualization, and the remaining bits reassemble into 1056389759 with no error marker anywhere. Then replay with the guard: before the final pour, draw the comparison against INT_MAX divided by ten as a checkpoint gate that the accumulator fails, halting the pour and returning zero instead — with a note that the gate itself performs a division rather than a multiplication and therefore cannot overflow while testing for overflow. Finish with the PYTHON NEGATIVE panel, which runs the same pour animation on -123 with a counter tracking the source value: the source goes -13, then -2, then -1, and then stops changing, with the -1 tile pulsing in place while pour after pour continues to add digits to an ever-growing result — loop that stuck state visibly, and place the C++ trace beside it terminating cleanly at zero after three pours, so the divergence is a difference in the same animation rather than a claim.",
    sampleInput:
      '{"pour":{"n":12345,"steps":[{"read":5,"result":5,"remaining":1234},{"read":4,"result":54,"remaining":123},{"read":3,"result":543,"remaining":12},{"read":2,"result":5432,"remaining":1},{"read":1,"result":54321,"remaining":0}],"answer":54321},"trailingZeros":{"n":1200,"steps":[{"read":0,"result":0},{"read":0,"result":0},{"read":2,"result":2},{"read":1,"result":21}],"answer":21},"overflow":{"n":1534236469,"trueReverse":9646324351,"intMax":2147483647,"naiveReturns":1056389759,"guardTriggersAt":964632435,"guardBoundary":214748364,"guardDigit":7,"verifiedIn":"g++"},"pythonNegative":{"n":-123,"trace":[{"n":-123,"mod":7,"div":-13},{"n":-13,"mod":7,"div":-2},{"n":-2,"mod":8,"div":-1},{"n":-1,"mod":9,"div":-1,"stuck":true}],"terminates":false,"cppTrace":[{"n":-123,"mod":-3,"div":-12},{"n":-12,"mod":-2,"div":-1},{"n":-1,"mod":-1,"div":0,"stuck":false}],"cppResult":-321}',
    highlights: [
      "Two containers sit side by side: the source holding 12345 as digit tiles, and an empty result.",
      "The rightmost source tile detaches, and the entire result row slides one place left to open a units slot.",
      "That leftward shift is the multiplication by ten drawn explicitly, and the detached tile drops into the new slot.",
      "The source shrinks through 1234, 123, 12 and 1 while the result grows 5, 54, 543, 5432 and 54321.",
      "Replayed with 1200, the first two pours drop zeros into a result that is still zero and visibly produce nothing.",
      "The final result reads 21, labelled to show the zeros had no place left to occupy.",
      "A capacity bar sized to INT_MAX appears beneath the result and fills as the accumulator grows.",
      "Running 1534236469, the bar fills steadily until the final pour pushes the value past its end.",
      "The excess high bits shear off the top and the remainder reassembles into 1056389759, with no error marker anywhere.",
      "Replayed with the guard, a checkpoint gate compares the accumulator against INT_MAX divided by ten before the final pour.",
      "The accumulator fails that gate, the pour is halted, and zero is returned instead.",
      "The gate divides rather than multiplies, so it cannot overflow while testing for overflow.",
      "The Python panel pours -123 and the source goes -13, then -2, then -1, and then stops changing.",
      "The -1 tile pulses in place while pour after pour keeps adding digits to an ever-growing result.",
      "The C++ trace runs beside it and terminates cleanly at zero after three pours, so the divergence is visible in the same animation.",
    ],
  },

  edgeCases: [
    "A 10-digit input whose reverse exceeds a 32-bit int, such as 1534236469 reversing to 9646324351.",
    "The maximum representable value itself, which reverses to something larger than the type can hold.",
    "Negative input in Python without taking the absolute value, which never terminates because the value floors to -1 and stays there.",
    "The most negative value of a signed type, whose absolute value does not fit and stays negative after negation.",
    "Trailing zeros, which vanish because leading zeros have no representation in an integer.",
    "A number consisting only of zeros in its lower places, such as 1000, which reverses to a single digit.",
    "Input zero, which reverses to zero and where the loop runs zero times.",
    "Single-digit input, which reverses to itself after one iteration.",
    "A palindromic input such as 121, where the reverse equals the original.",
    "Accumulating into the same width as the input, where overflow is possible, versus accumulating into a wider type, where it is not.",
  ],

  pitfalls: [
    "Accumulating into the same integer type as the input, so a 10-digit value overflows on the final step.",
    "Multiplying first and checking for overflow afterwards, when the value is already garbage by then.",
    "Checking only the positive overflow boundary and letting large negative values through.",
    "Running the naive loop on a negative number in Python, which never terminates because -1 floor-divided by 10 is -1.",
    "Assuming the C++ and Java negative behaviour carries to Python, when the two round division in opposite directions.",
    "Treating the loss of trailing zeros as a bug and adding a workaround, when 0021 and 21 are the same number.",
    "Using stoi rather than stoll in C++ when converting a reversed string that may exceed int range.",
    "Calling Math.abs on Integer.MIN_VALUE in Java, which returns a negative value because the positive counterpart does not fit.",
    "Writing rev = rev + n % 10 without the multiplication, which sums the digits instead of reversing them.",
    "Removing the digit from N after using it in the guard rather than before, which tests the wrong state.",
  ],

  commonDoubts: [
    {
      question: "Why do we multiply the accumulator by 10?",
      answer:
        "To open a slot for the incoming digit. Multiplying by ten shifts every digit already in the accumulator one place to the left, leaving the units position empty, and adding the new digit fills it. Without the multiplication you would just be summing the digits — 12345 would give 15 rather than 54321. Reading rev = rev * 10 + digit as shift-then-append is the clearest way to hold it.",
    },
    {
      question: "Why does 1200 reverse to 21 instead of 0021?",
      answer:
        "Because 0021 and 21 are the same number. Leading zeros exist in the written form of a number, not in its value, so an integer has no way to hold them. Nothing was lost that an integer could have stored. If you genuinely need 0021 you are working with a string rather than a number, and the string approach makes this visible — reversing the text of 1200 does give 0021, and it is converting that back to an integer that drops the zeros.",
    },
    {
      question: "Why can reversing a valid number overflow?",
      answer:
        "Because the digit count is unchanged but the digits move to more significant positions. 1534236469 is a perfectly valid int, comfortably under 2147483647, and its reverse is 9646324351 — more than four times too large. With an int accumulator the value wraps and returns 1056389759, measured with g++ on this machine. Any 10-digit input can do this to a 32-bit int, and any 19-digit input can do it to a 64-bit one.",
    },
    {
      question: "Why can't I just check whether the result looks wrong after multiplying?",
      answer:
        "Because once the multiplication has overflowed the value is already garbage, and there is nothing meaningful left to inspect. You have to test before performing it. The technique is to divide the limit rather than multiply the accumulator: if rev is already greater than INT_MAX divided by 10, the next multiplication cannot fit. That comparison involves no multiplication, so it cannot itself overflow while testing for overflow.",
    },
    {
      question: "Why does the overflow guard compare the digit against 7?",
      answer:
        "Because of the boundary case. INT_MAX is 2147483647, so INT_MAX divided by 10 is 214748364 and its own final digit is 7. If the accumulator is strictly greater than 214748364 the multiplication definitely overflows. If it equals 214748364 exactly, whether it overflows depends on the digit being added — anything above 7 tips it past the limit. The negative side mirrors this: INT_MIN is -2147483648, so the guard digit there is -8.",
    },
    {
      question: "Why does my Python version hang on negative numbers?",
      answer:
        "Because Python floors division toward negative infinity while C++ and Java truncate toward zero. In Python, -1 // 10 is -1, not 0 — flooring -0.1 rounds down. So the value reaches -1 and stays there, and a loop testing against zero never terminates. Traced on this machine, -123 goes to -13, then -2, then -1, and then stops changing. The digits come out wrong too, since -123 % 10 is 7 in Python rather than -3. Take the absolute value first, reverse the positive number, and reapply the sign at the end.",
    },
    {
      question: "Do negatives need special handling in C++ and Java?",
      answer:
        "No, they work for free. Both truncate division toward zero and give the remainder the dividend's sign, so -123 % 10 is -3 and -123 / 10 is -12. Every extracted digit is negative, the accumulator builds up negatively, and the answer comes out as -321 without any sign logic. That is genuinely convenient — and it is exactly why the Python version catches people, since the same code that needed nothing there needs an absolute value here.",
    },
    {
      question: "Which approach should I use?",
      answer:
        "Learn the iterative accumulator — it is the pattern the palindrome problem builds on directly, and it is what an interviewer expects. Add the overflow guard when the input type is fixed by the problem, or simply accumulate into a wider type when that choice is yours, since a 10-digit reverse cannot overflow 64 bits. Use the string approach when readability matters more than allocation; it also sidesteps the negative-division problem entirely, because no division happens.",
    },
  ],

  relatedIds: [
    "count-digits",
    "palindrome-number",
    "arithmetic-operators",
    "integer-overflow-and-precision-errors",
    "data-types",
  ],
};

export default content;
