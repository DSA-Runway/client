import type { SubtopicContent } from "../types";

/**
 * Subtopic 3 of Basics. Builds directly on data-types: that lesson covered what
 * kinds of values exist, this one covers how you name and hold them. The deep
 * idea here is that C++/Java names *are* boxes while Python names are *labels
 * pointing at objects* — which explains most of the surprises students hit later
 * with assignment, swapping, and mutable arguments.
 */
const content: SubtopicContent = {
  id: "variables-and-constants",
  topic: "Basics",
  title: "Variables and Constants",
  difficulty: "Easy",
  status: "ready",

  prerequisites: ["introduction-to-programming", "data-types"],

  summary:
    "How to name a value so you can use it again, change it when it should change, and lock it when it shouldn't.",

  theory: `
## A variable is a named value

A program that can only work with literal numbers is useless. You need to hold a
value, refer to it later, and update it as the program runs. That is a **variable**:
a name attached to a place in memory.

In C++ and Java, three things define it:

\`\`\`
int   score   =   0;
 ^      ^         ^
type   name     value
\`\`\`

The **type** fixes what kind of value it can hold and how much memory it gets.
The **name** is how you refer to it. The **value** is what's currently inside.
Python omits the type — the interpreter works it out from the value.

## Declaration, initialisation, and assignment

Three words that sound alike and mean different things.

**Declaration** brings the name into existence. \`int score;\` tells the compiler a
name exists and what type it is, without giving it a value yet.

**Initialisation** is the *first* value a variable receives. \`int score = 0;\`
declares and initialises in one line, which is what you should almost always do.

**Assignment** is every value after the first. \`score = 10;\` replaces what was
there. The old value is gone.

Why the distinction matters: a declared-but-uninitialised variable is dangerous.
In C++ it holds whatever bits were already sitting in that memory — often a
meaningless number, and the program runs happily and prints nonsense. Java refuses
to compile if you read a local variable before assigning it. Python has no
declaration step at all, so using a name you never assigned raises a NameError.

## Naming

The rules are nearly identical across all three languages:

- Made of letters, digits, and underscores. C++ and Java also allow \`$\` in Java
  and leading underscores in both.
- Cannot start with a digit. \`2sum\` is invalid; \`sum2\` is fine.
- Cannot be a reserved keyword. You cannot name something \`int\`, \`class\`, or \`if\`.
- **Case-sensitive.** \`score\`, \`Score\`, and \`SCORE\` are three different names.
- No spaces.

The *conventions* differ, and following them makes your code read like the
language it's written in:

| | C++ / Java | Python |
|---|---|---|
| Variables | \`camelCase\` — \`maxScore\` | \`snake_case\` — \`max_score\` |
| Constants | \`UPPER_SNAKE\` — \`MAX_SIZE\` | \`UPPER_SNAKE\` — \`MAX_SIZE\` |

Beyond the rules, one habit matters more than the rest: **name the meaning, not the
mechanics.** \`n\` and \`temp\` tell a reader nothing. \`studentCount\` and \`previousValue\`
tell them everything. The exception is genuine convention — \`i\` for a loop index
and \`n\` for input size are so standard that spelling them out reads worse.

## The one real difference: boxes versus labels

This is the concept worth slowing down for, because it explains a whole class of
behaviour later.

In **C++ and Java**, a variable of a primitive type *is* a box. The name refers to a
fixed region of memory, and assignment writes a new value into that same region.

In **Python**, a variable is a *label stuck onto an object*. The object lives
somewhere in memory; the name is just a pointer to it. Assigning doesn't overwrite
the object — it peels the label off and sticks it onto a different object. The old
object stays until nothing references it, at which point Python reclaims it.

\`\`\`
C++     int x = 5;  x = 7;     one box, value inside changed from 5 to 7
Python  x = 5;      x = 7      label x moved from object 5 to object 7
\`\`\`

For simple numbers you cannot tell the difference. It starts to matter when two
names refer to the same list, and changing one appears to change the other. That
comes later — for now, just hold the mental model.

## Constants

Sometimes a value should never change: the size of a board, a conversion factor,
a limit from the problem statement. Declaring it constant does two things — it
stops accidental modification, and it tells the reader *this is fixed on purpose*.

- **C++** uses \`const\`, and \`constexpr\` when the value must be known at compile time.
- **Java** uses \`final\`.
- **Python has no enforced constants.** The convention is an \`UPPER_SNAKE_CASE\` name,
  which signals intent to other programmers but is not checked by anything. You can
  reassign it and Python won't stop you.

The practical payoff is having a **single place to change**. A magic number \`7\`
scattered through a file has to be found in every location and updated correctly.
\`const int DAYS_IN_WEEK = 7;\` is changed once.

One trap worth knowing early: in Java, \`final\` locks the *name*, not the object it
points to. A \`final\` list cannot be reassigned to a different list, but you can
still add items to it.
`.trim(),

  intuition:
    "A variable is how you give a value a memory — literally and figuratively. A constant is the same thing with a promise attached: this will not move, so you can reason about it without checking.",

  approaches: [
    {
      name: "Declaring and Initialising",
      idea: "Bring a name into existence and give it its first value — ideally in one line.",
      steps: [
        "Decide what kind of value you need to store, which fixes the type.",
        "Choose a name that describes the meaning of the value.",
        "In C++ and Java, write the type before the name; in Python, write the name alone.",
        "Assign the initial value with = on the same line as the declaration.",
        "Read or update the value later by using the name.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

int main() {
    int    studentCount = 30;      // declared and initialised together
    double averageScore = 76.5;
    char   topGrade     = 'A';
    bool   isPassing    = true;

    int pendingResults;            // declared only — value is garbage
    pendingResults = 4;            // assigned afterwards

    cout << studentCount << " " << averageScore << " "
         << topGrade << " " << pendingResults << endl;
    // 30 76.5 A 4
    return 0;
}`,
          annotations: {
            10: "Reading this before line 11 would print an unpredictable number, with no warning from the compiler.",
            11: "This is assignment, not initialisation — the variable already existed.",
          },
        },
        {
          language: "java",
          code: `public class Variables {
    public static void main(String[] args) {
        int     studentCount = 30;   // declared and initialised together
        double  averageScore = 76.5;
        char    topGrade     = 'A';
        boolean isPassing    = true;

        int pendingResults;          // declared only
        pendingResults = 4;          // assigned afterwards

        System.out.println(studentCount + " " + averageScore + " "
                           + topGrade + " " + pendingResults);
        // 30 76.5 A 4
    }
}`,
          annotations: {
            8: "Reading this before line 9 is a compile error — Java refuses to let you use an unassigned local variable.",
          },
        },
        {
          language: "python",
          code: `student_count = 30           # no type written — inferred from the value
average_score = 76.5
top_grade     = "A"
is_passing    = True

# There is no declaration step. A name exists only once assigned.
pending_results = 4

print(student_count, average_score, top_grade, pending_results)
# 30 76.5 A 4

# Using a name before assigning it:
# print(unknown)   ->  NameError: name 'unknown' is not defined`,
          annotations: {
            1: "snake_case is the Python convention, where C++ and Java would use camelCase.",
            6: "You cannot 'declare without initialising' in Python — assignment is what creates the name.",
          },
        },
      ],
    },
    {
      name: "Updating and Swapping Values",
      idea: "Assignment replaces what a variable holds — and swapping two values is the classic exercise in getting that right.",
      steps: [
        "Assign a new value to an existing variable; the previous value is overwritten and lost.",
        "To swap two variables, first copy one of them into a temporary variable.",
        "Copy the second variable into the first.",
        "Copy the temporary variable into the second.",
        "Both values are now exchanged, and the temporary can be discarded.",
      ],
      code: [
        {
          language: "cpp",
          code: `int a = 5, b = 9;

int temp = a;    // temp holds 5
a = b;           // a becomes 9
b = temp;        // b becomes 5

cout << a << " " << b << endl;   // 9 5

// C++ also provides this directly:
swap(a, b);      // back to 5 9`,
          annotations: {
            3: "Without temp, writing a = b first would destroy a's original value before b could receive it.",
            10: "std::swap does exactly the three-step dance above, just written for you.",
          },
        },
        {
          language: "java",
          code: `int a = 5, b = 9;

int temp = a;    // temp holds 5
a = b;           // a becomes 9
b = temp;        // b becomes 5

System.out.println(a + " " + b);   // 9 5`,
          annotations: {
            3: "Java has no built-in swap for primitives, so the temporary variable is the standard approach.",
          },
        },
        {
          language: "python",
          code: `a, b = 5, 9      # assign several names in one statement

a, b = b, a      # swap in a single line, no temporary needed

print(a, b)      # 9 5`,
          annotations: {
            1: "Multiple assignment: the values on the right are matched to the names on the left, in order.",
            3: "The right side is fully evaluated before anything is assigned, which is why no temporary is required.",
          },
        },
      ],
    },
    {
      name: "Declaring Constants",
      idea: "Lock a value that should never change, so the compiler enforces what you intended.",
      steps: [
        "Identify a value that is fixed for the whole program — a limit, a size, a conversion factor.",
        "Declare it with the language's constant keyword, or the naming convention where none exists.",
        "Give it its value at the point of declaration; a constant cannot be assigned later.",
        "Name it in UPPER_SNAKE_CASE so readers recognise it as fixed.",
        "Use the name everywhere the value is needed, so changing it later means editing one line.",
      ],
      code: [
        {
          language: "cpp",
          code: `const int    MAX_STUDENTS = 100;
const double PI           = 3.14159;
constexpr int BOARD_SIZE  = 8;      // known at compile time

// MAX_STUDENTS = 200;   // error: assignment of read-only variable

cout << MAX_STUDENTS << " " << PI << " " << BOARD_SIZE << endl;`,
          annotations: {
            3: "constexpr goes further than const: the value must be computable during compilation, so it can size arrays.",
            5: "The compiler rejects this outright — the mistake is caught before the program ever runs.",
          },
        },
        {
          language: "java",
          code: `final int    MAX_STUDENTS = 100;
final double PI           = 3.14159;

// MAX_STUDENTS = 200;   // error: cannot assign a value to final variable

System.out.println(MAX_STUDENTS + " " + PI);

// Careful: final locks the name, not the contents
final List<Integer> scores = new ArrayList<>();
scores.add(90);              // allowed — the list itself is not frozen
// scores = new ArrayList<>();  // error — the name cannot be repointed`,
          annotations: {
            9: "This is the most misunderstood part of final. It prevents reassignment, not mutation.",
          },
        },
        {
          language: "python",
          code: `MAX_STUDENTS = 100
PI           = 3.14159

# Python does not enforce constants — this is legal and will not error:
MAX_STUDENTS = 200
print(MAX_STUDENTS)   # 200

# The UPPER_SNAKE_CASE name is a message to other programmers,
# not a rule the interpreter checks.`,
          annotations: {
            5: "Nothing stops this. Constant-ness in Python is a convention held by discipline, not by the language.",
          },
        },
      ],
    },
  ],

  examples: [
    {
      input: "int score = 0; then score = 10; then score = score + 5;",
      output: "15",
      walkthrough: [
        "Declaration and initialisation reserve a box named score and put 0 in it.",
        "Assignment replaces the contents with 10, and the 0 is gone with no record of it.",
        "The third line reads the current value 10, adds 5 to produce 15, then writes 15 back into the same box.",
        "The right side is always evaluated first, which is why score can appear on both sides.",
        "score now holds 15.",
      ],
      why: "Shows that = is not equality but an instruction: compute the right side, then store it on the left.",
    },
    {
      input: "a = 5, b = 9; swap them using a temporary variable",
      output: "a = 9, b = 5",
      walkthrough: [
        "temp = a copies 5 into temp, so 5 now exists in two places.",
        "a = b overwrites a with 9. The original 5 would be lost here if temp had not saved it.",
        "b = temp writes the saved 5 into b.",
        "a holds 9 and b holds 5 — the values are exchanged.",
        "Doing it without temp fails: a = b then b = a leaves both holding 9.",
      ],
      why: "The temporary variable exists for exactly one reason, and seeing the failure case without it is what makes that reason stick.",
    },
    {
      input: "Declare MAX = 100 as a constant, then try to assign MAX = 200",
      output: "C++ and Java: compile error. Python: succeeds, MAX becomes 200.",
      walkthrough: [
        "In C++, const marks the variable read-only and the compiler rejects any assignment to it.",
        "In Java, final does the same and the error appears before the program is built.",
        "In Python, MAX_STUDENTS is an ordinary variable with a name written in capitals.",
        "The interpreter has no concept of a constant here, so the assignment simply happens.",
        "The capitals communicated intent to a human reader, and nothing more.",
      ],
      why: "Makes the enforcement gap explicit, so a student moving between languages does not assume a guarantee Python never offered.",
    },
  ],

  visualization: {
    kind: "memory-model",
    description:
      "Split the canvas into a NAMES column on the left and a MEMORY region on the right. For C++ and Java, draw each name as a label fused to a single box in memory: declaring draws an empty box, initialising fills it, and assigning animates the new value overwriting the old one inside that same box so it is clear the box never moves. For Python, draw names as detached tags with arrows pointing into memory at separate value objects: reassigning animates the arrow detaching and swinging to a different object, and the abandoned object fades out to show garbage collection. Run the swap sequence in both models — the temporary-variable version showing three copy operations between fixed boxes, and Python's version showing both arrows crossing simultaneously. Finish with constants: draw a padlock on the box, and animate an assignment arrow bouncing off it for C++ and Java, while the Python padlock is drawn as a dotted outline the arrow passes straight through.",
    sampleInput:
      '{"model":[{"lang":"cpp","style":"name-is-box"},{"lang":"java","style":"name-is-box"},{"lang":"python","style":"name-points-to-object"}],"sequence":[{"op":"declare","name":"score"},{"op":"init","name":"score","value":0},{"op":"assign","name":"score","value":10},{"op":"swap","names":["a","b"],"values":[5,9]},{"op":"constant","name":"MAX_STUDENTS","value":100,"enforced":{"cpp":true,"java":true,"python":false}}]}',
    highlights: [
      "Declaration draws an empty box labelled score; in C++ it contains leftover bits rather than nothing.",
      "Initialisation writes 0 into that box, which is the first value it has ever held.",
      "Assignment overwrites 0 with 10 in place — the box does not move and the old value is unrecoverable.",
      "Python instead shows the tag score detaching from the object 0 and re-attaching to the object 10, with 0 fading away once nothing points at it.",
      "Swap without a temporary: a = b overwrites a's 5 before b can read it, and both boxes end up holding 9 — the failure shown deliberately.",
      "Swap with a temporary: 5 is copied out to safety, 9 is copied into a, then 5 is copied back into b.",
      "Python's swap shows both arrows crossing at once, because the right-hand side is fully evaluated before either name is rebound.",
      "A constant is drawn with a padlock: assignment arrows bounce off it in C++ and Java, and pass straight through Python's dotted padlock.",
    ],
  },

  edgeCases: [
    "Reading an uninitialised variable in C++, which yields leftover memory contents rather than zero and produces no warning.",
    "Reading an unassigned local variable in Java, which is a compile error rather than a runtime surprise.",
    "Using a name in Python before assigning it, which raises NameError at the moment that line runs.",
    "Declaring a variable inside a block and using it outside, where the name no longer exists.",
    "Reassigning a Python name to a different type entirely, which is legal and changes the type of the value it refers to.",
    "A Java final reference whose object is still mutable — the name is locked, the contents are not.",
    "Naming a variable the same as one in an outer scope, which hides the outer one for the rest of the block.",
  ],

  pitfalls: [
    "Declaring without initialising and then reading the value. In C++ this prints whatever was already in that memory.",
    "Writing = when you meant ==. Assignment inside a condition compiles in C++ and silently changes the variable.",
    "Swapping without a temporary variable, which overwrites the first value before it can be saved.",
    "Assuming Python's UPPER_CASE names are protected. They are a convention and nothing more.",
    "Assuming Java's final freezes an object. It only prevents the name from being pointed somewhere else.",
    "Names like a, b, x2, temp1 that describe nothing. The exceptions are conventional: i for a loop index, n for input size.",
    "Reusing one variable for two unrelated purposes to save a line. It costs far more in confusion than it saves.",
    "Mixing naming conventions — camelCase in Python or snake_case in Java reads as foreign to anyone else in that language.",
  ],

  commonDoubts: [
    {
      question: "What is the difference between declaration, initialisation, and assignment?",
      answer:
        "Declaration creates the name and fixes its type: int score;. Initialisation is the first value it ever receives: int score = 0;. Assignment is every value after that: score = 10;. The practical consequence is that a declared-but-uninitialised variable holds nothing meaningful, so initialise at the point of declaration whenever you can.",
    },
    {
      question: "Why does C++ print a random number for a variable I didn't initialise?",
      answer:
        "Because C++ does not clear memory for you. Declaring a variable reserves a region, and whatever bits the last program left there are still sitting in it. Reading it gives you that leftover data interpreted as your type. Java avoids this by refusing to compile, and Python avoids it by having no uninitialised state at all. In C++ the fix is entirely on you: always initialise.",
    },
    {
      question: "Is a Python variable a box or a label?",
      answer:
        "A label. The value is an object living in memory, and the name is a tag pointing at it. Assigning moves the tag rather than overwriting the object. For numbers and strings you'll never notice the difference. It becomes visible with lists — if two names point at the same list and you modify it through one, the other sees the change, because there was only ever one list.",
    },
    {
      question: "Why bother with constants? I can just not change the value.",
      answer:
        "Two reasons, and neither is about your discipline today. The compiler enforces it, so a mistake made six months from now is caught at build time instead of becoming a bug. And it documents intent — a reader seeing const int BOARD_SIZE = 8 knows immediately that it is fixed by design, where a plain 8 scattered through the file tells them nothing and has to be updated in every location.",
    },
    {
      question: "What is the difference between const and constexpr in C++?",
      answer:
        "const means the value cannot be changed after initialisation, but it may be computed while the program runs. constexpr is stricter: the value must be computable during compilation. That extra guarantee is what lets a constexpr value be used where the compiler needs a number in advance, such as fixing an array size. Start with const; reach for constexpr when the compiler asks for it.",
    },
    {
      question: "Does Python have real constants?",
      answer:
        "No. Writing MAX_SIZE = 100 in capitals is a convention that tells other programmers not to change it, and the interpreter enforces nothing — reassigning it works. If you are coming to Python from C++ or Java, do not assume the protection carries over. Discipline and code review are what hold it.",
    },
    {
      question: "How do I choose a good variable name?",
      answer:
        "Name what the value means, not what it is made of. totalMarks beats t, and previousValue beats temp2. If you cannot name it, you usually do not yet know what it is for. The accepted exceptions are conventions everyone shares — i for a loop index, n for input size, and the standard mathematical letters in a formula you are transcribing.",
    },
    {
      question: "Can I change a variable's type after declaring it?",
      answer:
        "In C++ and Java, no — the type is bound to the name for its whole lifetime, and assigning a different kind of value is a compile error. In Python, yes, because the type belongs to the value rather than the name, so rebinding to a string simply makes the name refer to a string. Legal, but confusing to read: reusing one name for two different kinds of thing is worth avoiding even where the language permits it.",
    },
  ],

  relatedIds: [
    "data-types",
    "input-and-output",
    "type-conversion-and-casting",
    "variable-scope-and-lifetime",
  ],
};

export default content;
