import type { SubtopicContent } from "../types";

/**
 * Subtopic 2 of Basics. The lesson underneath the lesson is static vs dynamic
 * typing — it is the first place C++/Java and Python genuinely diverge, so it
 * feeds directly into the language choice the student makes at the end of the
 * module. Range limits are introduced here because overflow is the single most
 * common silent wrong-answer in DSA.
 */
const content: SubtopicContent = {
  id: "data-types",
  topic: "Basics",
  title: "Data Types",
  difficulty: "Easy",
  status: "ready",

  prerequisites: ["introduction-to-programming"],

  summary:
    "The kinds of values a program can hold — whole numbers, decimals, characters, true/false — how much memory each takes, and the limits that decide which one you should pick.",

  theory: `
## Why types exist at all

Memory is just a long row of bytes holding binary digits. The pattern
\`01000001\` means nothing on its own. Read as a whole number it is **65**. Read
as a character it is **'A'**. Read as part of a decimal number it is something
else entirely.

A **data type** is the label that tells the machine how to read those bits. It
answers two questions:

1. **How much memory does this value need?** A true/false flag needs almost
   nothing; a high-precision decimal needs eight bytes.
2. **What operations are legal on it?** Multiplying two numbers makes sense.
   Multiplying two words does not, and the type system is what lets the language
   catch that.

## Static and dynamic typing

This is the first real fork between your three language options, and it is worth
understanding properly before you choose.

**C++ and Java are statically typed.** You state the type when you create the
value, and it never changes. The compiler checks every use before the program
runs, so a type mistake is caught at build time.

**Python is dynamically typed.** You never write the type — the interpreter
works it out from the value you assigned. The same name can hold a number now
and a string later. Nothing is checked until that line actually runs.

\`\`\`
C++     int x = 5;        x is an int. Permanently.
Java    int x = 5;        x is an int. Permanently.
Python  x = 5             x refers to an int, for now.
\`\`\`

Neither is better. Static typing catches mistakes earlier and runs faster;
dynamic typing is shorter to write and more flexible. What matters is knowing
which one you're working in, because the errors you get look completely different.

## The core types

Four families cover almost everything you'll use in Basics and most of DSA.

**Whole numbers (integers).** Counting, indexing, summing. \`int\` in all three
languages, plus wider variants when the values get large.

**Decimal numbers (floating point).** Averages, division results, measurements.
\`float\` and \`double\` — \`double\` holds roughly twice the precision, and is what
you should reach for by default.

**Characters.** A single letter or symbol: \`char\` in C++ and Java. Python has no
separate character type — a single character is just a one-length string.

**Booleans.** Exactly two values, true or false. Produced by every comparison you
write, and the thing every \`if\` and loop condition evaluates to.

## Size and range

Every fixed-width type has a hard ceiling. Exceed it and the value doesn't grow —
it **wraps around**, silently producing a wrong answer with no error message.

**C++** (typical on a 64-bit machine; the standard permits variation):

| Type | Size | Approximate range |
|---|---|---|
| \`bool\` | 1 byte | true, false |
| \`char\` | 1 byte | -128 to 127 |
| \`int\` | 4 bytes | -2,147,483,648 to 2,147,483,647 |
| \`long long\` | 8 bytes | about -9.2 × 10¹⁸ to 9.2 × 10¹⁸ |
| \`float\` | 4 bytes | about 7 decimal digits of precision |
| \`double\` | 8 bytes | about 15 decimal digits of precision |

**Java** (fixed by the language on every platform — nothing varies):

| Type | Size | Range | Default |
|---|---|---|---|
| \`boolean\` | — | true, false | false |
| \`byte\` | 1 byte | -128 to 127 | 0 |
| \`short\` | 2 bytes | -32,768 to 32,767 | 0 |
| \`int\` | 4 bytes | -2,147,483,648 to 2,147,483,647 | 0 |
| \`long\` | 8 bytes | about ±9.2 × 10¹⁸ | 0L |
| \`char\` | 2 bytes | 0 to 65,535 | (null character) |
| \`float\` | 4 bytes | ~6–7 digits | 0.0f |
| \`double\` | 8 bytes | ~15–16 digits | 0.0d |

Note Java's \`char\` is **two** bytes, not one, because it holds a Unicode
character rather than a single byte.

**Python** works differently, and this is its most useful trick: **integers have
no size limit.** They grow to fit whatever you put in them, so Python integers
never overflow. You pay for it in speed and memory, but you never lose an answer
to a wrapped value. Python's \`float\` is the same 8-byte double as the others, so
decimals *do* still have precision limits.

## Why this matters for DSA

The single most common silent failure in competitive programming is an \`int\` that
overflowed. Sum a large array, multiply two values near a million, compute a
factorial — the arithmetic is correct, the type isn't wide enough, and the answer
comes back negative.

The habit to build now: **look at the constraints, work out the largest value your
answer could reach, and pick a type that holds it.** In C++ that means \`long long\`,
in Java \`long\`. In Python you don't have to think about it.

## Beyond the basics

Everything above is a **primitive** type — a single value. Languages also build
compound types on top: arrays, strings, structs and classes in C++/Java, and
lists, tuples, dictionaries and sets in Python. Those get their own subtopics
later. For now, know that they exist and are built from these building blocks.
`.trim(),

  intuition:
    "A type is a promise about a box: how big it is, and what you're allowed to do with what's inside. Pick a box too small and the value silently wraps instead of overflowing loudly — which is why choosing the type is a real decision, not paperwork.",

  approaches: [
    {
      name: "Declaring Values of Each Type",
      idea: "Create one value of each core type — and see where static and dynamic typing diverge.",
      steps: [
        "Choose the type that matches the kind of value you need to store.",
        "In C++ and Java, write the type name before the variable name.",
        "In Python, write only the name and let the interpreter infer the type from the value.",
        "Assign the value, matching the literal form to the type — quotes for text, a decimal point for floating point.",
        "The type is now fixed in C++ and Java, and free to change on reassignment in Python.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

int main() {
    int    count   = 42;
    long long big  = 9000000000LL;
    double average = 3.14159;
    char   grade   = 'A';
    bool   passed  = true;

    cout << count << " " << big << " " << average
         << " " << grade << " " << passed << endl;
    // 42 9000000000 3.14159 A 1
    return 0;
}`,
          annotations: {
            6: "The LL suffix tells the compiler the literal itself is a long long, not an int.",
            8: "Single quotes for a char. Double quotes would make it a string instead.",
            12: "C++ prints bools as 1 and 0 unless you ask for boolalpha.",
          },
        },
        {
          language: "java",
          code: `public class DataTypes {
    public static void main(String[] args) {
        int     count   = 42;
        long    big     = 9000000000L;
        double  average = 3.14159;
        char    grade   = 'A';
        boolean passed  = true;

        System.out.println(count + " " + big + " " + average
                           + " " + grade + " " + passed);
        // 42 9000000000 3.14159 A true
    }
}`,
          annotations: {
            4: "Without the L suffix this literal is too large for an int and will not compile.",
            7: "Java's type is boolean, not bool, and it prints as true/false.",
          },
        },
        {
          language: "python",
          code: `count   = 42
big     = 9000000000
average = 3.14159
grade   = "A"
passed  = True

print(count, big, average, grade, passed)
# 42 9000000000 3.14159 A True

count = "now a string"   # legal — the name is free to change type
print(count)             # now a string`,
          annotations: {
            2: "No suffix and no wider type needed — Python integers grow to any size.",
            4: "No char type. A single character is just a string of length one.",
            5: "Capital T in True and False, unlike C++ and Java.",
            10: "This line would be a compile error in C++ and Java. In Python it simply rebinds the name.",
          },
        },
      ],
    },
    {
      name: "Inspecting Size, Range, and Type",
      idea: "Ask the language directly how big a type is and what it can hold, instead of memorising tables.",
      steps: [
        "Pick the type you want to inspect.",
        "In C++, use sizeof to get its size in bytes and the numeric_limits template for its bounds.",
        "In Java, read the MAX_VALUE and MIN_VALUE constants on the matching wrapper class.",
        "In Python, use type() to see what a value currently is, since the type lives on the value rather than the name.",
        "Confirm the limit by comparing it against the largest value your problem could produce.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
#include <limits>
using namespace std;

int main() {
    cout << sizeof(int)       << endl;  // 4
    cout << sizeof(long long) << endl;  // 8
    cout << sizeof(double)    << endl;  // 8

    cout << numeric_limits<int>::max() << endl;        // 2147483647
    cout << numeric_limits<long long>::max() << endl;  // 9223372036854775807
    return 0;
}`,
          annotations: {
            6: "sizeof reports bytes on this compiler and platform, which is why C++ sizes are 'typical' rather than guaranteed.",
          },
        },
        {
          language: "java",
          code: `public class Limits {
    public static void main(String[] args) {
        System.out.println(Integer.MAX_VALUE);  // 2147483647
        System.out.println(Integer.MIN_VALUE);  // -2147483648
        System.out.println(Long.MAX_VALUE);     // 9223372036854775807
        System.out.println(Double.MAX_VALUE);   // 1.7976931348623157E308
    }
}`,
          annotations: {
            3: "Integer is the wrapper class for the primitive int, and it carries these constants.",
          },
        },
        {
          language: "python",
          code: `print(type(42))        # <class 'int'>
print(type(3.14))      # <class 'float'>
print(type("A"))       # <class 'str'>
print(type(True))      # <class 'bool'>

import sys
print(sys.float_info.max)   # 1.7976931348623157e+308

# Integers have no maximum — this is exact, not approximate
print(2 ** 200)`,
          annotations: {
            1: "The type belongs to the value, not the name, so type() is asked about the value.",
            9: "A 200-bit integer, computed exactly. C++ and Java cannot do this with a primitive.",
          },
        },
      ],
    },
    {
      name: "Choosing the Right Numeric Type",
      idea: "Work out the largest value your answer can reach, then pick a type that holds it — the habit that prevents overflow bugs.",
      steps: [
        "Read the problem constraints and find the largest input values.",
        "Work out the biggest number the computation could produce, not just the biggest input.",
        "Compare that against the type's maximum: roughly 2 × 10⁹ for a 32-bit int, roughly 9 × 10¹⁸ for a 64-bit integer.",
        "If it exceeds the int limit, declare the value as long long in C++ or long in Java.",
        "In Python, skip this step entirely — integers resize themselves.",
        "Watch intermediate results too: a product can overflow even when the final answer would have fit.",
      ],
      code: [
        {
          language: "cpp",
          code: `int a = 100000, b = 100000;

int wrong = a * b;              // -1794967296  (overflowed)
long long right = 1LL * a * b;  // 10000000000  (correct)

cout << wrong << " " << right << endl;`,
          annotations: {
            3: "10 billion does not fit in 4 bytes, so the value wraps to a negative number. No error is reported.",
            4: "Multiplying by 1LL first promotes the whole expression to 64-bit before the multiplication happens.",
          },
        },
        {
          language: "java",
          code: `int a = 100000, b = 100000;

int wrong = a * b;                 // -1794967296  (overflowed)
long right = (long) a * b;         // 10000000000  (correct)

System.out.println(wrong + " " + right);`,
          annotations: {
            4: "The cast must come before the multiplication. Writing (long)(a * b) overflows first, then widens the already-wrong value.",
          },
        },
        {
          language: "python",
          code: `a = 100000
b = 100000

result = a * b
print(result)   # 10000000000 — always correct

print(2 ** 100) # 1267650600228229401496703205376`,
          annotations: {
            4: "No type choice to make. Python widens the integer automatically as it grows.",
          },
        },
      ],
    },
  ],

  examples: [
    {
      input: "int x = 5; then attempt x = \"hello\";",
      output: "C++ and Java: compile error. Python: works fine.",
      walkthrough: [
        "In C++ and Java the name x was declared as int, binding it to that type permanently.",
        "Assigning text to it violates that binding, so the compiler rejects the program before it runs.",
        "In Python the name x was never given a type — it simply referred to the integer 5.",
        "Reassigning makes x refer to a string instead, and the old integer is discarded.",
        "The same code is an error in one language and ordinary in another, purely because of static versus dynamic typing.",
      ],
      why: "The cleanest demonstration of the static/dynamic divide, which is the main concept of this subtopic.",
    },
    {
      input: "int a = 100000, b = 100000; compute a * b as an int",
      output: "-1794967296 instead of 10000000000",
      walkthrough: [
        "The true product is 10,000,000,000.",
        "A 4-byte int can only hold up to 2,147,483,647.",
        "The result exceeds that, so the extra high bits are discarded.",
        "What remains is reinterpreted as a signed value, which lands on a negative number.",
        "No warning or error is produced — the program runs and reports a confidently wrong answer.",
      ],
      why: "The overflow bug in its most common form. Every step of the arithmetic is right; only the type was wrong.",
    },
    {
      input: "Compute 0.1 + 0.2 and compare it to 0.3",
      output: "0.30000000000000004, and the equality check is false",
      walkthrough: [
        "0.1 and 0.2 cannot be represented exactly in binary floating point, the same way 1/3 cannot be written exactly in decimal.",
        "Each is stored as the closest representable value, slightly off from the true number.",
        "Adding the two approximations accumulates both small errors.",
        "The result is very close to 0.3 but not identical to the stored form of 0.3.",
        "Comparing with == returns false, so equality on floating point is unreliable by nature.",
      ],
      why: "Shows that a type's limits are about precision as well as size, and explains a bug that looks like the computer doing arithmetic wrong.",
    },
  ],

  visualization: {
    kind: "memory-model",
    description:
      "Draw memory as a row of byte cells. For each type, outline a box spanning its real width — 1 cell for a C++ char or bool, 2 for a Java char or short, 4 for an int or float, 8 for a long long or double — so the sizes are compared by area rather than by reading a table. Placing a value animates it settling into its box with the binary pattern shown beneath. Then run the overflow sequence: fill a 4-byte int box with 2,147,483,647, add one, and animate the carry running off the left edge of the box and being discarded while the sign bit flips, landing the displayed value on -2,147,483,648. Finish by drawing the Python integer as a box that visibly grows extra cells to fit the same value instead of overflowing, side by side with the fixed C++ box for contrast.",
    sampleInput:
      '{"types":[{"lang":"cpp","name":"char","bytes":1},{"lang":"cpp","name":"int","bytes":4},{"lang":"cpp","name":"long long","bytes":8},{"lang":"cpp","name":"double","bytes":8},{"lang":"java","name":"char","bytes":2},{"lang":"java","name":"int","bytes":4},{"lang":"java","name":"long","bytes":8},{"lang":"python","name":"int","bytes":"grows"}],"overflowDemo":{"type":"int","start":2147483647,"add":1,"result":-2147483648}}',
    highlights: [
      "Empty memory: a plain row of byte cells with nothing claimed yet.",
      "A 1-byte char box appears beside a 4-byte int box beside an 8-byte double box, so the size difference is visible at a glance.",
      "Java's char box is drawn 2 cells wide against C++'s 1 cell, showing where the two languages genuinely differ.",
      "The int box fills with 2,147,483,647 and every bit in it lights up — the box is completely full.",
      "Adding 1 pushes a carry past the left edge of the box; the carry is discarded and the sign bit flips.",
      "The displayed value jumps to -2,147,483,648 with no error shown, which is what makes overflow so easy to miss.",
      "The Python integer box grows extra cells to hold the same value instead of wrapping, next to the fixed C++ box that could not.",
    ],
  },

  edgeCases: [
    "A value exactly at the type's maximum — legal, but adding one more wraps it to the minimum.",
    "Dividing two integers, where the fractional part is discarded rather than rounded: 7 / 2 is 3, not 3.5.",
    "Comparing two floating-point values with == , which can be false even when the numbers look identical when printed.",
    "An uninitialised primitive in C++, which holds whatever was already in that memory. Java assigns defaults; C++ does not.",
    "Java's char being unsigned and 2 bytes wide, so it never holds a negative value, unlike C++'s char.",
    "Python's bool being a subclass of int, so True + True evaluates to 2.",
  ],

  pitfalls: [
    "Using int for a sum or product that exceeds about 2 billion. The arithmetic is correct and the type is not, so the answer is silently wrong.",
    "Casting after the overflow rather than before it: (long)(a * b) is too late, because a * b already wrapped.",
    "Expecting integer division to produce a decimal. Divide by 2.0 rather than 2, or cast one operand first.",
    "Using float where double is appropriate. float holds only about 7 digits, which is rarely enough.",
    "Testing floating-point values for exact equality instead of checking whether the difference is smaller than a small tolerance.",
    "Assuming Python's freedom from overflow carries over. If you switch to C++ or Java later, the limits come straight back.",
    "Confusing 'A' with \"A\" in C++ and Java: single quotes make a character, double quotes make a string, and they are different types.",
  ],

  commonDoubts: [
    {
      question: "When should I use int and when should I use long long?",
      answer:
        "Use int while the value stays under about 2 billion, and long long (or long in Java) once it can go beyond that. The check is on the largest value the computation reaches, not the largest input — multiplying two numbers near 100,000 already exceeds int even though both inputs fit comfortably. When you're unsure in a competitive setting, long long costs almost nothing and removes the risk.",
    },
    {
      question: "Why does 7 / 2 give 3 instead of 3.5?",
      answer:
        "Because both operands are integers, so the language performs integer division and discards the fractional part rather than rounding. To get 3.5, make one side a decimal: 7 / 2.0 in C++ and Java, or 7 / 2 in Python 3, which returns a float by default. Python's // operator gives you the integer behaviour when you actually want it.",
    },
    {
      question: "Why is 0.1 + 0.2 not exactly 0.3?",
      answer:
        "Because binary floating point can't represent 0.1 or 0.2 exactly, in the same way decimal can't write 1/3 exactly. Each is stored as the nearest value it can represent, and adding them accumulates both small errors — giving 0.30000000000000004. This is not a bug in your language; every language using standard floating point behaves this way. Never compare floats with ==; check that the absolute difference is below a small tolerance instead.",
    },
    {
      question: "Python doesn't make me declare types. Does it not have them?",
      answer:
        "It has types, and they're strictly enforced — try \"5\" + 5 and it raises an error. The difference is where the type lives. In C++ and Java the type belongs to the name, is written by you, and is checked before the program runs. In Python the type belongs to the value, is inferred by the interpreter, and is only checked when the line executes.",
    },
    {
      question: "Why doesn't Python overflow?",
      answer:
        "Because Python integers aren't fixed-width. When a value outgrows its current storage, Python allocates more space and keeps going, so 2 ** 200 is computed exactly. C++ and Java integers are fixed at 4 or 8 bytes, and a value that doesn't fit wraps around instead. The trade is speed and memory: Python's flexible integers are meaningfully slower than a hardware int.",
    },
    {
      question: "float or double — which should I use?",
      answer:
        "Use double. float holds only about 7 significant digits, and errors accumulate fast enough to change answers in anything iterative. double gives about 15 digits for one extra word of memory, and it's what Python's float already is under the hood. Only reach for float when memory is genuinely constrained.",
    },
    {
      question: "Does char store a letter or a number?",
      answer:
        "A number — the character is how it's displayed. 'A' is stored as 65, which is why 'A' + 1 gives 'B' and why you can compare characters with < and >. C++ uses one byte, so it covers the ASCII range. Java uses two bytes to cover Unicode, which is why Java's char range runs from 0 to 65,535.",
    },
    {
      question: "Do I need to memorise all these sizes and ranges?",
      answer:
        "Two numbers only: an int holds about 2 × 10⁹, and a 64-bit integer holds about 9 × 10¹⁸. Those two decide almost every type choice you'll make in DSA. Everything else you can look up with sizeof, Integer.MAX_VALUE, or type().",
    },
  ],

  relatedIds: [
    "variables-and-constants",
    "type-conversion-and-casting",
    "arithmetic-operators",
    "integer-overflow-and-precision-errors",
  ],
};

export default content;
