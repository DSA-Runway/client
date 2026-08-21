---
id: input-and-output
topic: Basics
title: Input and Output
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-programming
  - data-types
  - variables-and-constants
relatedIds:
  - data-types
  - variables-and-constants
  - type-conversion-and-casting
  - arithmetic-operators
---

<!-- @summary -->
Reading values a user or judge supplies, and printing results back — including the buffer behaviour behind the most common beginner bug in all three languages.

<!-- @theory -->
## Every program has the same shape

**Input → Process → Output.** Read what you're given, do something with it, report
the result. The middle part is what DSA teaches. This subtopic covers the two ends,
and they matter more than they look: a correct algorithm that misreads its input
produces a wrong answer just as surely as a broken one.

## Streams

Input and output travel through **streams** — channels of characters flowing in or
out of your program. Two matter for now:

- **Standard input (stdin)** — usually the keyboard, but on a judge it's a file
  piped in. Your program cannot tell the difference, which is exactly the point.
- **Standard output (stdout)** — usually the terminal, and on a judge it's captured
  and compared against the expected answer.

| | Output | Input |
|---|---|---|
| C++ | `cout <<` | `cin >>` |
| Java | `System.out.println()` | `Scanner` / `BufferedReader` |
| Python | `print()` | `input()` |

C++ also provides `cerr` for error messages, which bypasses buffering so it appears
immediately. Useful for debugging, and importantly it is *not* part of stdout, so a
judge comparing your answer never sees it.

## Output

The direction of the arrows in C++ is worth reading literally: `cout << value`
pushes the value *into* the output stream. Multiple values chain naturally:
`cout << a << " " << b`.

For line breaks, C++ gives you two options that are not equivalent. `"\n"` writes a
newline character. `endl` writes a newline **and flushes the buffer** — forcing
everything written so far out immediately. Flushing is slow, and in a loop printing
thousands of lines it is a real cost. Use `"\n"` unless you specifically need the
flush.

Java's `println` adds the newline for you; `print` does not. Python's `print` adds
one too, and gives you two parameters worth knowing: `sep` controls what goes
between multiple values, and `end` replaces the trailing newline.

## Input, and the thing that trips everyone

Reading looks simple and has one shared complication across all three languages:
**what gets left behind in the buffer.**

When you type `42` and press Enter, the buffer holds `42` *and* a newline character.
A numeric read consumes the digits and stops at the whitespace — **the newline stays
in the buffer.** The next read starts from there.

That single fact explains three separate bugs students hit:

- **C++**: `cin >> n` followed by `getline(cin, line)` gives you an empty line.
  `getline` starts at the leftover newline, sees end-of-line immediately, and returns
  nothing. The fix is `cin.ignore()` before the `getline`.
- **Java**: `sc.nextInt()` followed by `sc.nextLine()` returns an empty string, for
  exactly the same reason. The fix is an extra `sc.nextLine()` to consume the leftover.
- **Python** doesn't have this problem, because `input()` always reads a whole line
  including the newline. It has a different one instead.

## Python always gives you a string

`input()` returns a **string**, always — even when the user typed a number. Adding
two of them concatenates rather than adds:

```
n = input()      # user types 5
print(n + n)     # "55", not 10
```

You must convert explicitly: `n = int(input())` or `float(input())`. Forgetting this
is the single most common Python beginner error, and it usually shows up as a
TypeError or a nonsense result rather than a clear message.

## Reading several values at once

DSA problems almost always give you a count followed by that many numbers, so this
pattern is worth learning properly rather than reinventing each time.

C++ and Java read whitespace-separated values naturally — `cin >>` and `nextInt()`
skip over spaces and newlines identically, so a loop reading `n` values works whether
the input is on one line or many.

Python needs the line split first: `input().split()` breaks it into a list of
strings, and `map(int, ...)` converts each one. That gives you the standard idiom
`arr = list(map(int, input().split()))`.

## A note about judges

On an online judge nobody is watching your program run. That has two consequences:

1. **Don't print prompts.** `cout << "Enter n: "` becomes part of your answer and
   fails the comparison. Print only what the problem asks for.
2. **Read exactly the format described.** The input arrives piped from a file in a
   fixed shape, and there is no user to correct a misread.

<!-- @intuition -->
Input is a tape of characters with a cursor on it, not a set of separate values. Every read moves the cursor forward and leaves whatever it did not consume — once you picture the cursor, all three languages' input bugs become the same bug.

<!-- @approach -->
### Printing Output

<!-- @idea -->
Send values to standard output, with control over spacing and line breaks.

<!-- @steps -->
1. Choose the printing construct for your language.
2. Pass the value or values you want displayed.
3. Insert separators explicitly where you need spaces between values.
4. Decide whether a newline should follow, and add or suppress it accordingly.
5. Print only what is asked for — extra text becomes part of your output.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

int main() {
    int a = 5, b = 9;

    cout << "Sum: " << a + b << "\n";   // Sum: 14
    cout << a << " " << b << "\n";      // 5 9
    cout << "no newline here";

    cout << endl;   // newline AND flush — slower in loops
    return 0;
}
```

<!-- @annotations -->
- 7: Values chain with <<. Spaces are not automatic — you insert them yourself.
- 11: endl flushes the output buffer. In a loop printing thousands of lines, prefer newline.

<!-- @code java -->
```java
public class Output {
    public static void main(String[] args) {
        int a = 5, b = 9;

        System.out.println("Sum: " + (a + b));   // Sum: 14
        System.out.println(a + " " + b);         // 5 9
        System.out.print("no newline here");

        System.out.printf("%d + %d = %d%n", a, b, a + b);  // 5 + 9 = 14
    }
}
```

<!-- @annotations -->
- 5: The parentheses around a + b matter — without them Java concatenates instead of adding.
- 7: print omits the trailing newline; println adds one.
- 9: printf gives C-style formatting when you need aligned or precise output.

<!-- @code python -->
```python
a, b = 5, 9

print("Sum:", a + b)          # Sum: 14  — spaces added automatically
print(a, b)                   # 5 9
print(a, b, sep="-")          # 5-9      — custom separator
print("no newline here", end="")

print(f"{a} + {b} = {a + b}")   # 5 + 9 = 14
```

<!-- @annotations -->
- 3: Unlike C++ and Java, print inserts a space between arguments for you.
- 5: sep replaces the separator between values; end replaces the trailing newline.
- 8: An f-string embeds expressions directly, which is the clearest way to format output.

<!-- @approach -->
### Reading a Single Value

<!-- @idea -->
Pull one value from standard input into a variable of the right type.

<!-- @steps -->
1. Declare a variable of the type you expect to read.
2. Call the language's read operation, which pauses until input is available.
3. The read consumes the characters that make up the value and stops at whitespace.
4. Convert the text to a number if the language does not do it for you.
5. The newline the user typed remains in the buffer for the next read.

<!-- @code cpp -->
```cpp
int n;
cin >> n;              // reads an int, stops at whitespace

double price;
cin >> price;          // conversion is automatic from the declared type

string word;
cin >> word;           // stops at the first space — reads one word only

string fullLine;
cin.ignore();          // discard the leftover newline first
getline(cin, fullLine);  // now reads the whole line including spaces
```

<!-- @annotations -->
- 8: cin >> cannot read a full name with a space in it. It stops at the space.
- 11: Without this, getline immediately hits the leftover newline and returns an empty string.

<!-- @code java -->
```java
import java.util.Scanner;

Scanner sc = new Scanner(System.in);

int n = sc.nextInt();          // reads an int
double price = sc.nextDouble();
String word = sc.next();       // one word, stops at whitespace

sc.nextLine();                 // consume the leftover newline
String fullLine = sc.nextLine();  // now reads the whole line
```

<!-- @annotations -->
- 9: This throwaway call is required. Without it the next nextLine returns an empty string.

<!-- @code python -->
```python
n = int(input())         # input() returns a string — int() converts it
price = float(input())

word = input()           # already a string, no conversion needed
full_line = input()      # input() always reads the entire line

# The classic mistake:
# n = input()
# print(n + n)   ->  "55" instead of 10, because n is a string
```

<!-- @annotations -->
- 1: Forgetting int() here is the most common Python beginner bug.
- 5: Python has no whitespace-stopping read — input() takes the whole line every time.

<!-- @approach -->
### Reading Multiple Values and Arrays

<!-- @idea -->
The standard DSA input shape: a count, then that many values.

<!-- @steps -->
1. Read the count n first.
2. Create a container sized to hold n values.
3. Loop n times, reading one value per iteration into the container.
4. In Python, split the line into pieces and convert them all at once instead of looping.
5. The values may arrive on one line or many — whitespace-separated reads do not care.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;                    // how many values follow

    vector<int> arr(n);
    for (int i = 0; i < n; i++) {
        cin >> arr[i];           // works across lines or spaces alike
    }

    int a, b;
    cin >> a >> b;               // two values in one statement

    return 0;
}
```

<!-- @annotations -->
- 11: cin >> skips all whitespace, so line breaks between values make no difference.
- 15: Chained extraction reads them left to right.

<!-- @code java -->
```java
import java.util.Scanner;

public class ReadArray {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        int a = sc.nextInt(), b = sc.nextInt();
        sc.close();
    }
}
```

<!-- @annotations -->
- 10: nextInt skips whitespace including newlines, so the input layout does not matter.

<!-- @code python -->
```python
n = int(input())

# Standard idiom: read a whole line and convert every piece
arr = list(map(int, input().split()))

# Two values on one line
a, b = map(int, input().split())

# If the values are spread across n separate lines instead:
arr = [int(input()) for _ in range(n)]
```

<!-- @annotations -->
- 4: split() breaks the line on whitespace; map(int, ...) converts each piece; list() collects them.
- 10: Python's read is line-based, so values on separate lines need a different form than values on one line.

<!-- @example -->

<!-- @input -->
Two numbers on one line: 5 9

<!-- @output -->
14

<!-- @why -->
The complete input-process-output cycle in its smallest useful form.

<!-- @walkthrough -->
1. The program reads the first value, consuming the characters 5 and stopping at the space.
2. It reads the second value, skipping the space and consuming 9, stopping at the newline.
3. Both values are now stored as integers in their variables.
4. The sum 5 + 9 is computed, producing 14.
5. 14 is written to standard output followed by a newline.

<!-- @example -->

<!-- @input -->
A count followed by that many values:
4
3 7 1 9

<!-- @output -->
The four values stored in an array

<!-- @why -->
This is the input format of nearly every DSA problem, so the pattern is worth having automatic.

<!-- @walkthrough -->
1. The first read consumes 4 and stops at the newline, so n is 4.
2. A container sized 4 is created.
3. The loop reads 3, then 7, then 1, then 9 — each read skipping the whitespace before it.
4. The leftover newline after 4 causes no trouble here, because numeric reads skip whitespace automatically.
5. The array now holds all four values and the input is fully consumed.

<!-- @example -->

<!-- @input -->
Read an int, then attempt to read a full line:
5
hello world

<!-- @output -->
The line comes back empty instead of 'hello world'

<!-- @why -->
The single most reported I/O bug in both C++ and Java, and it is invisible until you picture the buffer cursor.

<!-- @walkthrough -->
1. The numeric read consumes 5 and stops, leaving the newline sitting in the buffer.
2. The line read begins at the cursor, which is parked directly on that newline.
3. It sees an end-of-line immediately and concludes the line is finished.
4. It returns an empty string without ever reaching the text on the next line.
5. Discarding the leftover newline first — cin.ignore() in C++, an extra sc.nextLine() in Java — makes the following read behave as expected.

<!-- @visualization custom -->

<!-- @description -->
Draw standard input as a horizontal tape of character cells, with newline characters shown as a visible symbol rather than blank space — this is the whole point of the visual. A cursor sits on the tape and only ever moves right. Animate each read as a highlighted span being consumed: a numeric read lights up the digit cells, pulls them into a variable box below, and halts the cursor exactly on the following whitespace cell without consuming it. Then run the bug: with the cursor parked on a newline, a line-read fires, immediately meets the end-of-line marker, and returns an empty string into its variable box — drawn as a visibly empty box so the failure is unmistakable. Replay it with an ignore step first, showing the cursor stepping over the newline so the same line-read now captures the full text. Finish with Python's model as a contrast: input() consumes the entire line up to and including the newline in one sweep, so the cursor always lands at the start of the next line and never mid-tape.

<!-- @sampleInput -->
```json
{"tape":"5\nhello world\n","reads":[{"op":"readInt","lang":["cpp","java"],"consumes":"5","stopsBefore":"\\n"},{"op":"readLine","lang":["cpp","java"],"result":"","note":"cursor was on the newline"},{"op":"ignore","lang":["cpp","java"],"consumes":"\\n"},{"op":"readLine","lang":["cpp","java"],"result":"hello world"},{"op":"input","lang":["python"],"consumes":"5\\n","result":"5"}]}
```

<!-- @highlights -->
- The tape shows 5, a visible newline symbol, then hello world — the newline is a real character, not empty space.
- The numeric read consumes the digit 5 and stops dead on the newline without taking it.
- The variable box fills with 5, and the cursor is left sitting on the newline cell.
- The line-read fires from that position, meets the end-of-line immediately, and returns nothing.
- Its variable box is drawn empty — this is the bug, and the text on the next line was never reached.
- Replay with an ignore step: the cursor steps over the newline before the line-read begins.
- The line-read now sweeps across hello world and captures it in full.
- Python contrast: input() consumes the digits and the newline together in one sweep, always landing the cursor at the start of the next line.

<!-- @edgeCases -->
- Input ending without a trailing newline, which some reads treat as end-of-file rather than a complete line.
- Entering text where a number is expected — a C++ stream enters a fail state, Java throws InputMismatchException, Python raises ValueError.
- An empty line read by input() in Python, which returns an empty string rather than raising an error.
- A name containing a space read with cin >> or sc.next(), which captures only the first word.
- Values spread across multiple lines when the code expects one line, which breaks Python's split-based read but not C++ or Java.
- Reading past the end of the available input, which returns end-of-file rather than blocking forever when input is piped from a file.
- Very large integers typed as input, which fit Python's int but overflow a C++ or Java int.

<!-- @pitfalls -->
- Forgetting int() around input() in Python, so arithmetic concatenates strings instead of adding numbers.
- Calling nextLine() straight after nextInt() in Java and receiving an empty string.
- Calling getline() straight after cin >> in C++ and receiving an empty string.
- Using cin >> or sc.next() for text that contains spaces, which silently reads only the first word.
- Printing a prompt such as 'Enter a number:' in a judge submission, which becomes part of the compared output.
- Using endl in a loop that prints many lines, where the repeated flushing is a measurable slowdown.
- Forgetting the parentheses in System.out.println("Sum: " + a + b), which concatenates the digits instead of adding them.
- Assuming input arrives one value per line, when the same problem may supply them space-separated.

<!-- @doubt -->
### Why does Python treat my input as a string when I typed a number?

<!-- @answer -->
Because input() has no idea what you intended — it hands back exactly the characters that were typed, as text. Typing 5 gives you the string "5", so n + n produces "55" rather than 10. Wrap it explicitly: n = int(input()) for whole numbers, float(input()) for decimals. If the text cannot be converted, int() raises a ValueError, which is a clearer failure than silently wrong arithmetic.

<!-- @doubt -->
### Why does my nextLine() in Java get skipped after nextInt()?

<!-- @answer -->
It is not skipped — it ran and read an empty line. nextInt() consumes the digits and stops, leaving the newline you pressed still sitting in the buffer. nextLine() then starts at that newline, sees the line has ended, and correctly returns an empty string. Add one throwaway sc.nextLine() after the nextInt() to consume the leftover, and the next real nextLine() works as expected.

<!-- @doubt -->
### Why does cin stop reading at the space when I enter a full name?

<!-- @answer -->
Because >> is defined to read one whitespace-separated token. It consumes characters until it meets a space, tab, or newline, and stops there. To capture a whole line including spaces, use getline(cin, line) instead — and remember to call cin.ignore() first if a numeric read came before it, otherwise getline picks up the leftover newline and returns empty.

<!-- @doubt -->
### Should I use endl or a newline character?

<!-- @answer -->
Use a newline character by default. Both end the line, but endl additionally flushes the output buffer, forcing everything written so far out immediately. Flushing has real cost, and in a loop printing thousands of lines it can be the difference between passing and exceeding a time limit. Reach for endl only when you specifically need output to appear right now, such as debugging a program that might crash.

<!-- @doubt -->
### Scanner or BufferedReader in Java?

<!-- @answer -->
Scanner while you're learning — nextInt() and nextDouble() do the parsing for you and the code reads clearly. BufferedReader once input gets large, because Scanner's convenience comes from parsing overhead that becomes significant at scale. BufferedReader gives you raw lines that you split and convert yourself with Integer.parseInt(), which is more code but noticeably faster on judge problems with heavy input.

<!-- @doubt -->
### How do I read a whole array in one go?

<!-- @answer -->
In Python it is a single line: arr = list(map(int, input().split())) — split the line on whitespace, convert each piece, collect the results. C++ and Java have no equivalent one-liner; you read the count, size a container, and loop reading one value per iteration. Because both languages' numeric reads skip whitespace automatically, that loop works identically whether the values arrive on one line or spread across many.

<!-- @doubt -->
### My program works on my machine but fails on the online judge. Why?

<!-- @answer -->
Most often because it prints something the judge did not ask for. A prompt like "Enter n:" is part of your standard output and the comparison fails on it, even though your answer is right. Print only the required result. The other frequent cause is reading in a different shape than the problem specifies — assuming one value per line when they arrive space-separated, or the reverse.

<!-- @doubt -->
### My solution is correct but times out on large input. Is I/O the problem?

<!-- @answer -->
It can be, and it is worth ruling out. In C++, adding ios_base::sync_with_stdio(false) and cin.tie(NULL) at the top of main unhooks the C++ streams from C's and removes a large constant cost. In Java, switch from Scanner to BufferedReader. In Python, read via sys.stdin rather than calling input() repeatedly. None of these change your algorithm — they remove overhead that can dominate when input runs to hundreds of thousands of values.
