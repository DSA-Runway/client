---
id: introduction-to-programming
topic: Basics
title: Introduction to Programming
difficulty: Easy
status: ready
relatedIds:
  - input-and-output
  - data-types
  - variables-and-constants
---

<!-- @summary -->
What a program is, why programming languages exist, and how the code you type turns into output your computer produces.

<!-- @theory -->
## What programming actually is

A computer is fast but literal. It does exactly what it is told, in the exact
order it is told, and it never infers what you meant. **Programming is the act of
writing those instructions precisely enough that a literal machine produces the
result you intended.**

Before the instructions come the *plan*. If a friend asked you to find the
largest number in a list, you'd say something like: "look at each number, and
remember the biggest one you've seen." That plan — finite, unambiguous,
guaranteed to finish — is an **algorithm**. A **program** is that algorithm
written in a language the machine can be made to execute.

This distinction is the whole reason this platform exists. Data Structures and
Algorithms is the study of the *plan*. A programming language is only the medium
you write it down in. Students who confuse the two end up memorising syntax and
still can't solve problems.

## Why programming languages exist

A processor only understands **machine code** — raw binary instructions. You
could write that directly, and the earliest programmers did, but a single simple
task takes hundreds of unreadable numbers and one mistake is nearly impossible to
find.

So we write in a **high-level language** instead — C++, Java, Python — which
reads much closer to English and mathematics. A translator program then converts
what you wrote into machine code.

- **High-level languages** (C++, Java, Python) are written for humans. You say
  `if (a > b)`, and you don't think about registers or memory addresses.
- **Low-level languages** (assembly, machine code) are written for the hardware.
  Fast and precise, but slow and painful to write.

The trade is deliberate: you give up some control over the machine and get back
readability, portability, and speed of writing. For DSA, that trade is always
worth taking.

## How your code becomes output

Your source code is just text until something translates it. There are two ways
that happens, and the difference explains most of what beginners find confusing
about the three languages.

A **compiler** translates the *entire* program to machine code before it runs.
You compile once, producing an executable file, then run that file as many times
as you like. Errors in syntax are caught up front, before a single line executes.
C++ works this way.

An **interpreter** reads and executes the program *line by line*, translating as
it goes. There's no separate build step — you just run the file. Errors surface
only when execution actually reaches the broken line. Python works this way.

**Java sits in between.** It compiles to an intermediate form called *bytecode*,
which the Java Virtual Machine then executes. This is why Java code compiles once
and runs on any machine that has a JVM.

Practically, this is what you'll notice:

| | C++ | Java | Python |
|---|---|---|---|
| Build step | Yes, compile first | Yes, compile to bytecode | No |
| Errors caught | Before running | Before running | When that line runs |
| Typical speed | Fastest | Fast | Slowest |
| Code length | Longest | Long | Shortest |

## The structure of a program

Nearly every program you write in Basics has the same three parts, whatever the
language:

1. **Setup** — pull in the tools you need (`#include`, `import`), if the language requires it.
2. **Entry point** — where execution begins. C++ and Java start at a function called `main`. Python simply starts at the top of the file.
3. **Statements** — the instructions, executed top to bottom in the order written.

Two rules that trip up every beginner: languages are **case-sensitive**
(`Print` is not `print`), and each has its own way of marking where a statement
ends — a semicolon in C++ and Java, a line break in Python.

## The loop you'll actually live in

Real programming is not writing a correct program on the first try. It is:

**write → run → read the error → fix → run again**

Errors are not failure. A compiler error is the machine telling you exactly which
line it couldn't understand, which is far more help than silence. Getting
comfortable reading error messages is one of the highest-return skills in this
entire module.

## About choosing a language

You do not need to decide yet. Every subtopic in this Basics module shows the
same idea in C++, Java, and Python side by side. Work through them, notice which
one feels natural to read, and commit at the end of the module. From that point
on, the rest of the curriculum follows the language you chose.

None of the three is a wrong answer for DSA. All three are accepted in interviews
and on every judge platform.

<!-- @intuition -->
A programming language is a contract with a translator: you agree to write in a form it can read, and it agrees to turn that into something the processor can run. Learning a language means learning that form — but learning to program means learning to build the plan the form describes.

<!-- @approach -->
### Your First Program

<!-- @idea -->
Write text into a file, translate it, and run it — the same three moves in every language.

<!-- @steps -->
1. Write the source code in a plain text file with the right extension: .cpp, .java, or .py.
2. Save the file. In Java the filename must match the class name exactly.
3. Translate it — compile for C++ and Java, or hand it straight to the interpreter for Python.
4. Run the result and read the output.
5. If an error appears, read the line number it names, fix that line, and repeat.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
```

<!-- @annotations -->
- 1: Pulls in the input/output library, which is where cout comes from.
- 4: Execution begins here. Every C++ program needs exactly one main().
- 5: cout sends text to the screen; << pushes values into that stream.
- 6: Returning 0 tells the operating system the program finished successfully.

<!-- @code java -->
```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

<!-- @annotations -->
- 1: The file must be named Hello.java — the class name and filename must match.
- 2: Java's entry point. The JVM looks for this exact signature to start execution.
- 3: println prints the text and then moves to a new line.

<!-- @code python -->
```python
print("Hello, World!")
```

<!-- @annotations -->
- 1: No imports, no main, no semicolon. Python starts at the top of the file and runs down.

<!-- @approach -->
### How Code Becomes Output

<!-- @idea -->
The commands that run the translation, and what each one produces along the way.

<!-- @steps -->
1. The source file is handed to a translator — a compiler or an interpreter.
2. The translator checks the syntax. If a rule is broken, it reports the line and stops.
3. C++ produces a machine-code executable; Java produces a .class bytecode file; Python produces nothing on disk and executes directly.
4. The result runs: the operating system runs the C++ executable, the JVM runs the Java bytecode, the interpreter runs the Python source.
5. Output appears in the terminal.

<!-- @code cpp -->
```cpp
g++ hello.cpp -o hello    # compile: source -> executable
./hello                   # run the executable

# Output: Hello, World!
```

<!-- @annotations -->
- 1: Produces a standalone file. Edit the source and you must compile again.

<!-- @code java -->
```java
javac Hello.java    # compile: source -> Hello.class (bytecode)
java Hello          # the JVM executes the bytecode

# Output: Hello, World!
```

<!-- @annotations -->
- 2: Note there's no .class extension here — you name the class, not the file.

<!-- @code python -->
```python
python hello.py    # interpret and execute in one step

# Output: Hello, World!
```

<!-- @annotations -->
- 1: No build artifact and no compile step, which is why Python feels fastest to iterate in.

<!-- @example -->

<!-- @input -->
A file hello.py containing: print("Hello, World!")

<!-- @output -->
Hello, World!

<!-- @why -->
The shortest complete program that exists. It proves the whole pipeline — file, translator, execution, output — works before any real logic is involved.

<!-- @walkthrough -->
1. The interpreter opens the file and reads the first line.
2. It recognises print as a built-in instruction to display something.
3. It evaluates the value inside the parentheses — the text "Hello, World!".
4. It sends that text to the terminal and moves to a new line.
5. There are no further lines, so the program ends.

<!-- @example -->

<!-- @input -->
A program that adds 5 and 3 and prints the result

<!-- @output -->
8

<!-- @why -->
Introduces the input-process-output shape that every program follows, no matter how large.

<!-- @walkthrough -->
1. The program stores 5 in a named box, and 3 in another.
2. It computes the sum of the two boxes, producing 8.
3. It stores 8 in a third box.
4. It sends the contents of that box to the screen.
5. The program ends.

<!-- @example -->

<!-- @input -->
A C++ file missing a semicolon: cout << "Hi"

<!-- @output -->
A compile error naming the line, and no program is produced.

<!-- @why -->
Shows that a compiled language catches the mistake before execution, which is exactly the difference from an interpreted language.

<!-- @walkthrough -->
1. The compiler reads the line and reaches the end without finding a semicolon.
2. It cannot tell where this statement was meant to end, so it reports an error at that line.
3. Compilation stops. No executable file is created.
4. Nothing runs — there is no partial output.
5. Adding the semicolon and compiling again produces a working program.

<!-- @visualization code-flow -->

<!-- @description -->
Three horizontal lanes stacked vertically, one per language, each starting from an identical source-file icon on the left. Animate a token travelling each lane at its own pace so the three pipelines can be compared directly. The C++ lane runs source → compiler → executable file → CPU → output, showing a build artifact appear on disk. The Java lane runs source → compiler → .class bytecode → JVM → output, with the bytecode drawn as a distinct intermediate box. The Python lane runs source → interpreter → output with no artifact, and the interpreter token steps line by line rather than translating in one pass. Finish by highlighting where each lane would catch a syntax error: before execution for C++ and Java, mid-execution for Python.

<!-- @sampleInput -->
```json
{"source":"print Hello, World!","lanes":[{"language":"cpp","stages":["source.cpp","g++ compiler","./hello executable","CPU","Hello, World!"],"artifact":"executable"},{"language":"java","stages":["Hello.java","javac compiler","Hello.class bytecode","JVM","Hello, World!"],"artifact":"bytecode"},{"language":"python","stages":["hello.py","interpreter","Hello, World!"],"artifact":null}]}
```

<!-- @highlights -->
- All three lanes begin with the same instruction written by the programmer, differing only in syntax.
- C++ lane: the compiler consumes the whole file at once and drops an executable onto disk.
- Java lane: the compiler produces bytecode, an intermediate form that is not yet machine code.
- Python lane: no artifact appears — the interpreter reads and runs each line in turn.
- The Java bytecode reaches the JVM, which is what lets the same file run on any operating system.
- All three lanes converge on identical output, showing the language changes the route, not the result.
- Inject a syntax error: C++ and Java halt at the compiler stage before anything runs, while Python runs correctly up to the broken line and only then fails.

<!-- @pitfalls -->
- Treating a compiler error as failure rather than as a precise report of which line could not be understood.
- Editing C++ or Java source and running the old build — you must compile again for changes to take effect.
- Naming a Java file differently from its public class, which the compiler rejects before anything else.
- Mixing tabs and spaces in Python, where indentation defines structure rather than being cosmetic.
- Assuming case doesn't matter: Print, PRINT, and print are three different names to every one of these languages.
- Trying to memorise syntax before understanding the plan. Syntax is looked up; algorithmic thinking is not.

<!-- @doubt -->
### Which language should I choose for DSA?

<!-- @answer -->
All three are fine, and none will block you in interviews or on judge platforms. C++ runs fastest and has the STL, which is why competitive programmers favour it. Java is explicit and verbose, which some beginners find clearer because nothing is hidden. Python is the shortest to write, so you spend more time on the algorithm and less on syntax. Work through Basics in all three and pick the one you find easiest to read — that matters more than any performance difference at this stage.

<!-- @doubt -->
### Python is slower. Will that be a problem for DSA?

<!-- @answer -->
Only at the margins. For learning algorithms it makes no difference at all — a correct O(n) solution in Python beats a wrong O(n²) solution in C++ every time. It can matter on competitive judges with tight time limits, where an accepted C++ solution occasionally times out in Python. If that becomes your situation later, the algorithm transfers directly; only the syntax changes.

<!-- @doubt -->
### What's the practical difference between a compiler and an interpreter?

<!-- @answer -->
When you find out you made a mistake. A compiler reads your entire program before running anything, so a typo on line 90 is reported before line 1 executes. An interpreter runs line by line, so that same typo is only discovered once execution actually reaches line 90 — meaning the first 89 lines already ran and may have printed output or changed data.

<!-- @doubt -->
### Do I need to learn C before C++?

<!-- @answer -->
No. That was common advice when C++ was mainly taught as an extension of C, but you can start directly with C++ and its own libraries. Nothing in this curriculum assumes prior C.

<!-- @doubt -->
### Why does Java make me write a class just to print one line?

<!-- @answer -->
Because Java requires every piece of code to live inside a class — that is a rule of the language, not something your program needs. Treat public class Hello and the main signature as fixed boilerplate for now. It will make sense once you reach object-oriented programming; until then, copy it and focus on what goes inside main.

<!-- @doubt -->
### Do I need to memorise all this syntax?

<!-- @answer -->
No. Working programmers look up syntax constantly. What you cannot look up is the plan — knowing that finding a maximum means carrying the best value seen so far. Syntax becomes automatic through repetition; spend your effort on the reasoning instead.

<!-- @doubt -->
### What is the difference between an algorithm and a program?

<!-- @answer -->
An algorithm is the plan: a finite sequence of unambiguous steps that solves a problem, and it can be written in plain English. A program is that plan expressed in a specific language so a machine can execute it. One algorithm can become a C++ program, a Java program, and a Python program — three programs, one algorithm.
