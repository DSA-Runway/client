import type { SubtopicContent } from "../types";

/**
 * Subtopic 5 of Basics. Two things here are worth more than the operator list
 * itself: integer division truncating instead of rounding, and the fact that
 * C++/Java and Python genuinely disagree about division and modulo of negative
 * numbers. That disagreement silently breaks circular-index arithmetic, so it is
 * taught explicitly rather than left as trivia.
 */
const content: SubtopicContent = {
  id: "arithmetic-operators",
  topic: "Basics",
  title: "Arithmetic Operators",
  difficulty: "Easy",
  status: "ready",

  prerequisites: ["introduction-to-programming", "data-types", "variables-and-constants"],

  summary:
    "Adding, subtracting, multiplying, dividing and taking remainders — plus the two behaviours that surprise everyone: integer division truncates, and negative division differs between languages.",

  theory: `
## Operators, operands, expressions

An **operator** does something to values. The values it works on are **operands**,
and the whole thing is an **expression** that produces a result.

\`\`\`
sum = a + b
       ^ ^ ^
       operand
         operator
\`\`\`

Most operators here are **binary** — they take two operands. A few are **unary** and
take one, like negation \`-x\` or increment \`++x\`.

## The five core operators

| Operator | Meaning | \`a = 7, b = 2\` |
|---|---|---|
| \`+\` | Addition | \`9\` |
| \`-\` | Subtraction | \`5\` |
| \`*\` | Multiplication | \`14\` |
| \`/\` | Division | **depends — read on** |
| \`%\` | Remainder (modulo) | \`1\` |

Four of those behave exactly as you'd expect. Division does not.

## Integer division truncates

**In C++ and Java, dividing two integers produces an integer.** The fractional part
is not rounded — it is thrown away.

\`\`\`
7 / 2   ->   3     not 3.5, and not 4
\`\`\`

This is not a bug or an approximation. The operands are both integers, so the
language performs *integer* division and the result is an integer. To get 3.5, at
least one operand must be a floating-point value: \`7 / 2.0\`, or cast one first.

**Python split this into two separate operators**, which is why it doesn't have the
problem:

- \`/\` is **true division** and always returns a float. \`7 / 2\` is \`3.5\`, and even
  \`10 / 2\` is \`5.0\` rather than \`5\`.
- \`//\` is **floor division** and returns a whole number. \`7 // 2\` is \`3\`.

So Python's \`//\` is the closest match to C++/Java's \`/\` — but only for positive
numbers, which brings us to the part that actually matters.

## Negative division: the languages genuinely disagree

For positive numbers all three languages agree. For negatives they do not, and this
is a real source of wrong answers.

| Expression | C++ / Java | Python |
|---|---|---|
| \`-7 / 2\` (int) | \`-3\` | \`-7 // 2\` is \`-4\` |
| \`-7 % 2\` | \`-1\` | \`1\` |
| \`7 % -2\` | \`1\` | \`-1\` |

**C++ and Java truncate toward zero.** \`-3.5\` becomes \`-3\` — the fractional part is
simply dropped, moving the value *closer to zero*.

**Python floors toward negative infinity.** \`-3.5\` becomes \`-4\` — always rounding
*down* on the number line.

Both are internally consistent, because both satisfy the same identity:

\`\`\`
(a / b) * b  +  (a % b)  ==  a
\`\`\`

Once the division rule is fixed, the remainder is forced to whatever makes that
equation hold. That is why the remainder's sign differs too: in C++ and Java it
follows the **dividend** (the left operand), and in Python it follows the
**divisor** (the right operand).

The practical consequence: **in Python, \`x % n\` is always non-negative for positive
\`n\`. In C++ and Java it is not.** That breaks the standard circular-index trick.
Wrapping backwards around an array of size \`n\` needs \`((i - 1) % n + n) % n\` in C++
and Java, where Python's plain \`(i - 1) % n\` already works.

## Modulo and what it's for

\`%\` gives the remainder after division: what's left once you've removed as many
whole groups as possible. \`7 % 2\` is \`1\` because 7 splits into three 2s with one
left over.

It comes up constantly in DSA:

- **Even or odd** — \`n % 2 == 0\`
- **Last digit of a number** — \`n % 10\`
- **Wrapping an index around an array** — \`(i + 1) % n\`
- **Keeping huge answers in range** — \`answer % 1000000007\`
- **Hash table bucket selection** — \`key % tableSize\`

One restriction: **in C++ and Java, \`%\` only works on integers.** Using it on a
\`double\` is a compile error, and you need \`fmod()\` instead. Python's \`%\` accepts
floats directly.

## Exponentiation

Python has an operator for it: \`2 ** 10\` is \`1024\`. C++ and Java have no such
operator and use a library function — \`pow(2, 10)\` — which returns a floating-point
value, so it needs a cast when you want an integer. For small integer powers, a loop
or repeated multiplication is both faster and exact.

## Increment, decrement, and compound assignment

\`++\` adds one and \`--\` subtracts one, and each comes in two forms:

- **Prefix** \`++i\` — increment first, then use the new value.
- **Postfix** \`i++\` — use the current value, then increment.

As a standalone statement they are identical. The difference only shows when the
expression's value is used: with \`i = 5\`, \`j = i++\` leaves \`j\` as \`5\`, while
\`j = ++i\` leaves \`j\` as \`6\`. Either way \`i\` ends up \`6\`.

**Python has no \`++\` or \`--\`.** Use \`i += 1\`.

Compound assignment exists in all three: \`a += b\` means \`a = a + b\`, and the same
pattern applies to \`-=\`, \`*=\`, \`/=\`, and \`%=\`.

## Precedence

Operators are evaluated in a fixed order, matching ordinary mathematics:

1. Parentheses
2. Unary \`-\` and \`++\` / \`--\`, and \`**\` in Python
3. \`*\`, \`/\`, \`%\`
4. \`+\`, \`-\`

So \`2 + 3 * 4\` is \`14\`, not \`20\`. When there's any doubt, add parentheses —
they cost nothing and remove the question entirely.
`.trim(),

  intuition:
    "Division of integers asks 'how many whole times does this fit', not 'what is the exact quotient'. Once you accept that, the remainder is simply whatever was left over — and the only real question is which direction the language rounds when the answer is negative.",

  approaches: [
    {
      name: "The Five Core Operators",
      idea: "Apply +, -, *, / and % to two values, and see where division stops behaving like maths class.",
      steps: [
        "Choose two operands and the operator to apply.",
        "For addition, subtraction and multiplication, the result is what ordinary arithmetic gives.",
        "For division, check the operand types first — two integers produce an integer result.",
        "If a fractional result is needed, make at least one operand a floating-point value.",
        "For modulo, the result is what remains after removing as many whole multiples as possible.",
      ],
      code: [
        {
          language: "cpp",
          code: `int a = 7, b = 2;

cout << a + b << endl;   // 9
cout << a - b << endl;   // 5
cout << a * b << endl;   // 14
cout << a / b << endl;   // 3    <- integer division, not 3.5
cout << a % b << endl;   // 1

cout << a / 2.0 << endl;         // 3.5
cout << (double)a / b << endl;   // 3.5

// cout << 7.5 % 2;   // compile error: % needs integers
cout << fmod(7.5, 2) << endl;    // 1.5`,
          annotations: {
            6: "Both operands are int, so the language performs integer division and discards the .5",
            9: "Making one operand a double promotes the whole expression to floating point.",
            13: "C++ requires fmod from <cmath> for floating-point remainders.",
          },
        },
        {
          language: "java",
          code: `int a = 7, b = 2;

System.out.println(a + b);   // 9
System.out.println(a - b);   // 5
System.out.println(a * b);   // 14
System.out.println(a / b);   // 3    <- integer division, not 3.5
System.out.println(a % b);   // 1

System.out.println(a / 2.0);          // 3.5
System.out.println((double) a / b);   // 3.5

System.out.println(7.5 % 2);   // 1.5  <- Java does allow % on doubles`,
          annotations: {
            6: "Same truncation as C++. Both operands are int, so the result is int.",
            12: "Unlike C++, Java's % accepts floating-point operands directly.",
          },
        },
        {
          language: "python",
          code: `a, b = 7, 2

print(a + b)    # 9
print(a - b)    # 5
print(a * b)    # 14
print(a / b)    # 3.5   <- true division, always a float
print(a // b)   # 3     <- floor division, the whole-number result
print(a % b)    # 1
print(a ** b)   # 49    <- exponentiation operator

print(10 / 2)   # 5.0   <- still a float, even when it divides evenly
print(7.5 % 2)  # 1.5   <- % works on floats`,
          annotations: {
            6: "This is the operator that behaves differently from C++ and Java — it never truncates.",
            7: "// is the closest equivalent to C++/Java integer division, but only for positive values.",
            11: "A common surprise: / always produces a float, so 10 / 2 is 5.0 rather than 5.",
          },
        },
      ],
    },
    {
      name: "Integer Division and Modulo with Negatives",
      idea: "See exactly where the three languages diverge, and how to write index arithmetic that survives it.",
      steps: [
        "Compute the exact mathematical quotient, which will be a fractional value.",
        "Apply the language's rounding rule: C++ and Java truncate toward zero, Python floors toward negative infinity.",
        "Derive the remainder from the identity that quotient times divisor plus remainder equals the original value.",
        "Note the sign: the remainder follows the dividend in C++ and Java, and the divisor in Python.",
        "When wrapping an index backwards, add the array size and take the modulo again in C++ and Java.",
      ],
      code: [
        {
          language: "cpp",
          code: `cout << -7 / 2 << endl;   // -3   truncated toward zero
cout << -7 % 2 << endl;   // -1   sign follows the dividend
cout <<  7 % -2 << endl;  //  1

// Why this matters: wrapping backwards around an array
int n = 5, i = 0;

int wrong = (i - 1) % n;              // -1  <- not a valid index
int right = ((i - 1) % n + n) % n;    //  4  <- correct wrap-around

cout << wrong << " " << right << endl;`,
          annotations: {
            1: "The exact quotient is -3.5. Truncating drops the fraction, moving toward zero.",
            9: "A negative index. Used directly to access an array, this reads out of bounds.",
            10: "Adding n makes it positive, and the second modulo brings it back into range.",
          },
        },
        {
          language: "java",
          code: `System.out.println(-7 / 2);   // -3   truncated toward zero
System.out.println(-7 % 2);   // -1   sign follows the dividend
System.out.println(7 % -2);   //  1

// Wrapping backwards around an array needs the same guard as C++
int n = 5, i = 0;

int wrong = (i - 1) % n;             // -1  <- not a valid index
int right = ((i - 1) % n + n) % n;   //  4  <- correct wrap-around

System.out.println(wrong + " " + right);

// Math.floorMod does it for you
System.out.println(Math.floorMod(i - 1, n));   // 4`,
          annotations: {
            13: "Java provides floorMod, which gives Python's behaviour directly. C++ has no equivalent.",
          },
        },
        {
          language: "python",
          code: `print(-7 // 2)   # -4   floored toward negative infinity
print(-7 % 2)    #  1   sign follows the divisor
print(7 % -2)    # -1

# Wrapping backwards just works, with no guard needed
n, i = 5, 0

print((i - 1) % n)   # 4  <- already correct

# The identity holds in both models:
print((-7 // 2) * 2 + (-7 % 2))   # -7`,
          annotations: {
            1: "-3.5 floors to -4, which is further from zero than C++ and Java's -3.",
            8: "Because Python's modulo is never negative for a positive divisor, index wrapping is safe by default.",
            11: "Quotient times divisor plus remainder returns the original value in every language — only the rounding rule differs.",
          },
        },
      ],
    },
    {
      name: "Increment, Decrement, and Compound Assignment",
      idea: "Shorthand for the most common update of all — changing a variable based on its current value.",
      steps: [
        "Identify a variable that should be updated using its own current value.",
        "For adding or subtracting one, use the increment or decrement operator where the language has it.",
        "Choose prefix when the new value should be used in the surrounding expression.",
        "Choose postfix when the old value should be used before the change takes effect.",
        "For any other update, use a compound assignment such as plus-equals.",
      ],
      code: [
        {
          language: "cpp",
          code: `int i = 5;

int j = i++;    // j = 5, then i becomes 6   (postfix: use, then change)
cout << i << " " << j << endl;   // 6 5

i = 5;
int k = ++i;    // i becomes 6, then k = 6   (prefix: change, then use)
cout << i << " " << k << endl;   // 6 6

int a = 10;
a += 5;   // 15
a -= 3;   // 12
a *= 2;   // 24
a /= 4;   // 6
a %= 4;   // 2`,
          annotations: {
            3: "The variable ends at 6 either way. Only the value handed to j differs.",
            13: "a += 5 is shorthand for a = a + 5.",
          },
        },
        {
          language: "java",
          code: `int i = 5;

int j = i++;    // j = 5, then i becomes 6   (postfix)
System.out.println(i + " " + j);   // 6 5

i = 5;
int k = ++i;    // i becomes 6, then k = 6   (prefix)
System.out.println(i + " " + k);   // 6 6

int a = 10;
a += 5;   // 15
a -= 3;   // 12
a *= 2;   // 24
a /= 4;   // 6
a %= 4;   // 2`,
          annotations: {
            3: "Identical semantics to C++ — postfix yields the old value, prefix yields the new one.",
          },
        },
        {
          language: "python",
          code: `i = 5

# Python has no ++ or -- operators at all
i += 1    # 6   this is the idiomatic way
i -= 1    # 5

a = 10
a += 5    # 15
a -= 3    # 12
a *= 2    # 24
a /= 4    # 6.0   <- note: / produces a float
a //= 4   # 1     <- use //= to stay an integer
a %= 4
a **= 2

# i++   ->  SyntaxError. There is no postfix increment.`,
          annotations: {
            4: "Because there is no ++, the prefix/postfix distinction simply does not exist in Python.",
            11: "Compound division follows the same rule as division — /= gives a float, //= keeps it whole.",
          },
        },
      ],
    },
  ],

  examples: [
    {
      input: "Compute 7 / 2 and 7 % 2 with both operands as integers",
      output: "Quotient 3, remainder 1",
      walkthrough: [
        "The exact mathematical result of 7 divided by 2 is 3.5.",
        "Both operands are integers, so the language performs integer division and the result must be an integer.",
        "The fractional part is discarded, leaving 3. No rounding occurs — 3.9 would also become 3.",
        "The remainder is what is left after removing three whole 2s from 7, which is 1.",
        "Checking the identity: 3 times 2 plus 1 equals 7, so the pair is consistent.",
      ],
      why: "The most reported beginner surprise in every language, and the reason averages computed with / come out wrong.",
    },
    {
      input: "Compute -7 divided by 2 and -7 modulo 2 in C++ and in Python",
      output: "C++: -3 and -1. Python: -4 and 1.",
      walkthrough: [
        "The exact quotient is -3.5 in both languages.",
        "C++ truncates toward zero, discarding the fraction and landing on -3.",
        "Its remainder must satisfy -3 times 2 plus r equals -7, which forces r to be -1.",
        "Python floors toward negative infinity, rounding -3.5 down to -4.",
        "Its remainder must satisfy -4 times 2 plus r equals -7, which forces r to be 1.",
        "Both are internally consistent — the languages simply chose different rounding rules.",
      ],
      why: "This is the divergence that silently breaks index wrapping when code is translated between languages.",
    },
    {
      input: "int i = 5; int j = i++; then reset and int k = ++i;",
      output: "j is 5, k is 6, and i ends at 6 in both cases",
      walkthrough: [
        "In the postfix form, the current value 5 is handed to j first.",
        "Only afterwards is i incremented to 6.",
        "In the prefix form, i is incremented to 6 first.",
        "The new value 6 is then handed to k.",
        "The variable itself finishes at 6 either way — only the value the expression produced differs.",
      ],
      why: "Shows that prefix and postfix are identical as standalone statements and differ only when the expression's value is consumed.",
    },
  ],

  visualization: {
    kind: "custom",
    description:
      "Two linked panels. The MODULO panel shows the dividend as a row of unit blocks, and animates them being pulled into groups of the divisor's size — three groups of 2 from 7 blocks — leaving the unpaired blocks highlighted at the end as the remainder, with the group count labelled as the quotient. The DIVISION panel is a number line centred on zero with the exact fractional quotient marked as a floating tick. For a positive quotient, both language arrows land on the same integer, drawn overlapping to show agreement. For a negative quotient the arrows split: the C++/Java arrow moves toward zero and lands on -3, and the Python arrow moves away from zero and lands on -4, each labelled with its rule. Beneath, show the identity bar reassembling each result — quotient times divisor plus remainder — proving both land back on the original value despite disagreeing. Close with an array-wrap demo: a ring of n index cells with a token stepping backwards from index 0, showing the raw expression landing outside the ring in C++/Java and the corrected double-modulo form landing on the last cell.",
    sampleInput:
      '{"cases":[{"a":7,"b":2,"exact":3.5,"cpp":{"q":3,"r":1},"python":{"q":3,"r":1}},{"a":-7,"b":2,"exact":-3.5,"cpp":{"q":-3,"r":-1},"python":{"q":-4,"r":1}}],"wrapDemo":{"n":5,"from":0,"step":-1,"naive":-1,"corrected":4}}',
    highlights: [
      "Seven unit blocks sit in a row, ungrouped.",
      "Blocks pair off into groups of two — three complete groups form, and one block is left unpaired.",
      "The three groups are labelled as the quotient and the lone block as the remainder.",
      "The number line shows 3.5 as a floating tick; both language arrows land on 3, overlapping to show agreement.",
      "Switching to -7 divided by 2 places the tick at -3.5, and the two arrows now point in opposite directions.",
      "The C++/Java arrow moves toward zero and lands on -3; the Python arrow moves away from zero and lands on -4.",
      "The identity bar reassembles each: -3 times 2 plus -1, and -4 times 2 plus 1, both returning to -7.",
      "On a ring of 5 index cells, stepping backwards from 0 lands the C++/Java token outside the ring at -1.",
      "The corrected double-modulo form pulls that token back onto the ring at cell 4, where Python's plain modulo already was.",
    ],
  },

  edgeCases: [
    "Integer division by zero, which crashes in C++, throws ArithmeticException in Java, and raises ZeroDivisionError in Python.",
    "Floating-point division by zero, which yields infinity in C++ and Java but still raises an error in Python.",
    "Modulo by zero, which is undefined or an error in all three languages.",
    "A quotient that divides evenly, where Python's / still returns a float: 10 / 2 is 5.0, not 5.",
    "Applying % to a double in C++, which is a compile error and requires fmod instead.",
    "Multiplying two large integers, where the product overflows the type before the result is ever assigned.",
    "Taking modulo of a negative number in C++ or Java, where the result may itself be negative.",
    "Using pow() for integer powers, where floating-point rounding can produce 124.99999 instead of 125.",
  ],

  pitfalls: [
    "Expecting 7 / 2 to be 3.5 in C++ or Java. Both operands are integers, so the result is 3.",
    "Computing an average with sum / count as integers, which truncates before the division is ever displayed.",
    "Assuming Python's // matches C++ integer division. They agree for positives and differ for negatives.",
    "Assuming x % n is always non-negative. That holds in Python, but not in C++ or Java.",
    "Wrapping an index backwards with (i - 1) % n in C++ or Java, which produces a negative index.",
    "Using % on floating-point values in C++, which does not compile.",
    "Writing i++ in Python, which is a syntax error — there is no increment operator.",
    "Relying on pow() for exact integer results, where floating-point error can leave the value just below the true answer.",
    "Omitting parentheses and trusting memory for precedence, when 2 + 3 * 4 is 14 rather than 20.",
  ],

  commonDoubts: [
    {
      question: "Why is 7 / 2 equal to 3 instead of 3.5?",
      answer:
        "Because both operands are integers, so the language performs integer division and the result must be an integer. The fractional part is discarded outright rather than rounded — 7 / 2 and 7.9 truncated both land on 3. To get 3.5, make at least one operand floating point: 7 / 2.0, or cast one with (double). Python avoids the issue by giving / and // separate meanings.",
    },
    {
      question: "Why does my average come out wrong?",
      answer:
        "Almost always because the division happened while both values were still integers. sum / count with sum = 7 and count = 2 computes 3 before anything is displayed, and converting that 3 to a double afterwards cannot recover the lost half. Force floating-point division at the point of the division itself: (double) sum / count in C++ and Java, or plain / in Python, which is already true division.",
    },
    {
      question: "Why does -7 % 2 give 1 in Python but -1 in C++?",
      answer:
        "Because the two languages round division differently, and the remainder follows from that. C++ and Java truncate toward zero, so -7 / 2 is -3, and the remainder must be -1 for -3 times 2 plus r to equal -7. Python floors toward negative infinity, so -7 // 2 is -4, and the remainder must be 1 for the same identity to hold. Neither is wrong — they made different choices, and both stay self-consistent.",
    },
    {
      question: "How do I wrap an array index backwards safely?",
      answer:
        "In Python, (i - 1) % n already works, because the modulo of a positive divisor is never negative. In C++ and Java it does not — at i = 0 you get -1, which reads out of bounds. Use ((i - 1) % n + n) % n: adding n makes the value positive and the second modulo brings it back into range. Java also offers Math.floorMod(i - 1, n), which gives Python's behaviour directly.",
    },
    {
      question: "What is the difference between i++ and ++i?",
      answer:
        "Only the value the expression produces. Postfix i++ hands back the current value and then increments; prefix ++i increments and then hands back the new value. With i = 5, j = i++ leaves j at 5 while j = ++i leaves j at 6 — and i is 6 in both cases. As a standalone statement on its own line they are interchangeable, so use whichever reads better there.",
    },
    {
      question: "Does Python have ++?",
      answer:
        "No. Writing i++ is a syntax error, not a silent no-op. Use i += 1, which is the idiomatic form and does the same job. Since there is no increment operator, the whole prefix-versus-postfix question simply does not arise in Python.",
    },
    {
      question: "How do I raise a number to a power in C++ or Java?",
      answer:
        "Use pow(base, exponent) — from <cmath> in C++, and Math.pow in Java. Both return a floating-point value, so an integer result needs a cast. Be careful with exactness: floating-point rounding can make pow(5, 3) come back as 124.99999999, which casting then truncates to 124. For small integer powers, multiply in a loop instead — it is faster and exact. Python's ** operator on integers is exact and has no such problem.",
    },
    {
      question: "Why can't I use % with a double in C++?",
      answer:
        "Because C++ defines % only for integer types, so the compiler rejects it outright. Use fmod(a, b) from <cmath> for a floating-point remainder. Java and Python both allow % on floating-point values directly, which is a genuine difference between the languages rather than a style preference.",
    },
    {
      question: "Why does modulo matter so much in DSA?",
      answer:
        "Because it answers 'what is left over', which turns out to be the shape of a lot of problems. n % 2 tests even or odd. n % 10 extracts the last digit, which drives every digit-by-digit algorithm. (i + 1) % n wraps an index around a circular array. answer % 1000000007 keeps a huge result inside an int, which is why that constant appears in so many problems. And key % tableSize is how a hash table chooses a bucket.",
    },
  ],

  relatedIds: [
    "data-types",
    "relational-and-logical-operators",
    "type-conversion-and-casting",
    "integer-overflow-and-precision-errors",
  ],
};

export default content;
