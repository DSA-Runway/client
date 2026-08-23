export type SubtopicDifficulty = "Easy" | "Medium" | "Hard";

export type Subtopic = {
  /** Stable slug — will key the lesson content / progress record once those exist. */
  id: string;
  title: string;
  difficulty: SubtopicDifficulty;
};

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const list = (
  difficulty: SubtopicDifficulty,
  titles: string[],
): Subtopic[] => titles.map(title => ({ id: slug(title), title, difficulty }));

/**
 * Subtopics for each curriculum topic, keyed by the topic `name` in CURRICULUM.
 * Headings only for now — lesson content gets attached to each `id` later.
 */
export const SUBTOPICS: Record<string, Subtopic[]> = {
  Basics: [
    ...list("Easy", [
      "Introduction to Programming",
      "Data Types",
      "Variables and Constants",
      "Input and Output",
      "Arithmetic Operators",
      "Relational and Logical Operators",
      "Type Conversion and Casting",
      "If / Else Statements",
      "Else-If Ladder",
      "Switch Case",
      "For Loop",
      "While Loop",
      "Do-While Loop",
      "For-Each Loop",
      "Break and Continue",
      "Functions - Declaration and Calling",
    ]),
    ...list("Medium", [
      "Nested Loops",
      "Function Parameters and Return Values",
      "Pass by Value vs Pass by Reference",
      "Variable Scope and Lifetime",
      "Function Overloading",
      "Count Digits",
      "Reverse a Number",
      "Palindrome Number",
      "GCD - Euclidean Algorithm",
      "LCM",
      "Prime Check",
    ]),
    ...list("Hard", [
      "Time and Space Complexity Basics",
      "Stack Memory and Recursion Depth",
      "Integer Overflow and Precision Errors",
    ]),
  ],

  "Pattern Printing": [
    ...list("Easy", [
      "Pattern 1 - Rectangular Star Pattern",
      "Pattern 2 - Right-Angled Star Triangle",
      "Pattern 3 - Right-Angled Number Triangle",
      "Pattern 4 - Right-Angled Repeating Number Triangle",
      "Pattern 5 - Inverted Right-Angled Star Triangle",
      "Pattern 6 - Inverted Right-Angled Number Triangle",
      "Pattern 7 - Star Pyramid",
      "Pattern 8 - Inverted Star Pyramid",
      "Pattern 9 - Diamond Star Pattern",
      "Pattern 10 - Half Diamond Star Pattern",
      "Pattern 11 - Binary Number Triangle",
      "Pattern 12 - Number Crown Pattern",
      "Pattern 13 - Increasing Number Triangle",
      "Pattern 14 - Increasing Letter Triangle",
      "Pattern 15 - Reverse Letter Triangle",
      "Pattern 16 - Alpha-Ramp Pattern",
      "Pattern 17 - Alpha-Hill Pattern",
      "Pattern 18 - Alpha-Triangle Pattern",
      "Pattern 19 - Symmetric Void Pattern",
    ]),
    ...list("Medium", [
      "Pattern 20 - Symmetric Butterfly Pattern",
      "Pattern 21 - Hollow Rectangle Pattern",
      "Pattern 22 - Concentric Number Rectangle",
    ]),
  ],

  Arrays: [
    ...list("Easy", [
      "Largest Element",
      "Second Largest Element",
      "Check if Array Is Sorted and Rotated",
      "Remove Duplicates from Sorted Array",
      "Left Rotate Array by One",
      "Left Rotate Array by K Places",
      "Move Zeros to End",
      "Linear Search",
      "Union of Two Sorted Arrays",
      "Find Missing Number",
      "Maximum Consecutive Ones",
      "Two Sum",
      "Majority Element-I",
      "Pascal's Triangle I",
    ]),
    ...list("Medium", [
      "Find the number that appears once, and other numbers twice",
      "Longest subarray with given sum K(positives)",
      "Longest subarray with sum K",
      "Sort an array of 0's 1's and 2's",
      "Kadane's Algorithm",
      "Print subarray with maximum subarray sum",
      "Stock Buy and Sell",
      "Rearrange array elements by sign",
      "Next Permutation",
      "Leaders in an Array",
      "Longest Consecutive Sequence in an Array",
      "Set Matrix Zeroes",
      "Rotate matrix by 90 degrees",
      "Print the matrix in spiral manner",
      "Count subarrays with given sum",
      "3 Sum",
      "4 Sum",
      "Largest Subarray with Sum 0",
      "Merge Overlapping Subintervals",
      "Merge two sorted arrays without extra space",
    ]),
    ...list("Hard", [
      "Majority Element-II",
      "Count subarrays with given xor K",
      "Find the repeating and missing number",
      "Count Inversions",
      "Reverse Pairs",
      "Maximum Product Subarray in an Array",
    ]),
  ],

  "Basic Sorting Algorithms": [
    ...list("Easy", [
      "Selection Sort",
      "Bubble Sort",
      "Insertion Sorting",
    ]),
  ],

  "Basic Recursion": [
    ...list("Easy", [
      "Understand recursion by print something N times",
      "Print name N times using recursion",
      "Print 1 to N using Recursion",
      "Print N to 1 using Recursion",
      "Sum of First N Numbers",
      "Factorial of a given number",
      "Reverse an array",
      "Check if String is Palindrome or Not",
      "Fibonacci Number",
    ]),
  ],

  "Advanced Recursion": [
    ...list("Easy", [
      "Pow(x, n)",
      "Learn All Patterns of Subsequences (Theory)",
      "Count all subsequences with sum K",
      "Check if there exists a subsequence with sum K",
    ]),
    ...list("Medium", [
      "Recursive Implementation of atoi()",
      "Count Good Numbers",
      "Sort a stack using recursion",
      "Reverse a Stack",
      "Generate Binary Strings Without Consecutive 1s",
      "Generate Parentheses",
      "Power Set",
      "Combination Sum",
      "Combination Sum II",
      "Subsets I",
      "Subsets II",
      "Combination Sum III",
      "Word Break",
    ]),
    ...list("Hard", [
      "Letter Combinations of a Phone Number",
      "Palindrome partitioning",
      "Word Search",
      "N Queen",
      "Rat in a Maze",
      "M Coloring Problem",
      "Sudoku Solver",
      "Expression Add Operators",
    ]),
  ],

  "Bit Manipulation": [
    ...list("Easy", [
      "Introduction to Bits and Tricks",
      "Check if the i-th bit is Set or Not",
      "Check if a Number is Odd or Not",
      "Check if a Number is Power of 2 or Not",
      "Count the Number of Set Bits",
      "Set/Unset the rightmost unset bit",
      "Swap Two Numbers",
      "Divisors of a Number",
      "Pow(x, n)",
    ]),
    ...list("Medium", [
      "Divide two numbers without multiplication and division",
      "Minimum Bit Flips to Convert Number",
      "Single Number - I",
      "Power Set Bit Manipulation",
      "XOR of numbers in a given range",
      "Single Number - III",
    ]),
    ...list("Hard", [
      "Print Prime Factors of a Number",
      "Count primes in range L to R",
      "Prime factorisation of a Number",
    ]),
  ],

  "Binary Search": [
    ...list("Easy", [
      "Search X in sorted array",
      "Lower Bound",
      "Upper Bound",
      "Search insert position",
      "Floor and Ceil in Sorted Array",
      "First and last occurrence",
      "Count Occurrences in a Sorted Array",
      "Find minimum in Rotated Sorted Array",
      "Find out how many times the array is rotated",
      "Find row with maximum 1's",
    ]),
    ...list("Medium", [
      "Search in rotated sorted array-I",
      "Search in rotated sorted array-II",
      "Single element in a Sorted Array",
      "Find peak element",
      "Find square root of a number",
      "Find Nth root of a number",
      "Koko eating bananas",
      "Minimum days to make M bouquets",
      "Find the smallest divisor",
      "Capacity to Ship Packages Within D Days",
      "Kth Missing Positive Number",
      "Painter's Partition",
      "Kth element of 2 sorted arrays",
      "Find Peak Element - II",
    ]),
    ...list("Hard", [
      "Aggressive Cows",
      "Book Allocation Problem",
      "Split array - largest sum",
      "Minimize Max Distance to Gas Station",
      "Median of 2 sorted arrays",
      "Search in a 2D matrix",
      "Search in 2D matrix - II",
      "Matrix Median",
    ]),
  ],

  Strings: [
    ...list("Easy", [
      "Largest Odd Number in a String",
      "Longest Common Prefix",
      "Isomorphic String",
      "Rotate String",
      "Check if two strings are anagram of each other",
      "Sort Characters by Frequency",
      "Count Number of Substrings",
    ]),
    ...list("Medium", [
      "Remove Outermost Parentheses",
      "Reverse words in a given string / Palindrome Check",
      "Maximum Nesting Depth of the Parentheses",
      "Roman to Integer",
      "String to Integer (atoi)",
      "Longest Palindromic Substring",
      "Sum of Beauty of All Substrings",
      "Reverse every word in a string",
    ]),
  ],

  "Linked Lists": [
    ...list("Easy", [
      "Introduction to Singly LinkedList",
      "Insertion at the head of Linked List",
      "Deletion of the head of LL",
      "Find the length of the Linked List",
      "Introduction to Doubly LL",
      "Insert node before head in Doubly Linked List",
      "Delete head of Doubly Linked List",
      "Middle of a LinkedList [TortoiseHare Method]",
    ]),
    ...list("Medium", [
      "Search in Linked List",
      "Reverse a Doubly Linked List",
      "Reverse a LinkedList [Iterative]",
      "Reverse a LL",
      "Detect a loop in LL",
      "Find the starting point in LL",
      "Length of loop in LL",
      "Check if LL is palindrome or not",
      "Segregate odd and even nodes in Linked List",
      "Remove Nth node from the back of the LL",
      "Delete the middle node in LL",
      "Sort a Linked List of 0's 1's and 2's",
      "Find the intersection point of Y LL",
      "Add one to a number represented by LL",
      "Add two numbers in Linked List",
      "Find Pairs with Given Sum in Doubly Linked List",
    ]),
    ...list("Hard", [
      "Sort LL",
      "Delete all occurrences of a key in DLL",
      "Remove duplicates from sorted DLL",
      "Reverse LL in group of given size K",
      "Rotate a LL",
      "Flattening of LL",
      "Clone a LL with random and next pointer",
    ]),
  ],

  Stacks: [
    ...list("Easy", [
      "Implement Stack using Arrays",
      "Implement Stack using Queue",
      "Implement stack using Linkedlist",
      "Balanced Paranthesis",
      "Number of Greater Elements to the Right",
    ]),
    ...list("Medium", [
      "Next Greater Element",
      "Next Greater Element - 2",
      "Next Smaller Element",
      "Sum of Subarray Minimums",
      "Asteroid Collision",
      "Sum of Subarray Ranges",
      "Remove K Digits",
    ]),
    ...list("Hard", [
      "Implement Min Stack",
      "Trapping Rainwater",
      "Largest rectangle in a histogram",
      "Maximum Rectangles",
      "Stock span problem",
      "Celebrity Problem",
    ]),
  ],

  Queues: [
    ...list("Easy", [
      "Implement Queue using Arrays",
      "Implement Queue using Stack",
      "Implement queue using Linkedlist",
    ]),
    ...list("Medium", [
      "LRU Cache",
    ]),
    ...list("Hard", [
      "Sliding Window Maximum",
      "LFU Cache",
    ]),
  ],
};

export const SUBTOPIC_ORDER: SubtopicDifficulty[] = ["Easy", "Medium", "Hard"];

/** Split a topic's subtopics into Easy / Medium / Hard buckets, dropping empty ones. */
export function groupSubtopics(subtopics: Subtopic[]) {
  return SUBTOPIC_ORDER
    .map(difficulty => ({
      difficulty,
      items: subtopics.filter(s => s.difficulty === difficulty),
    }))
    .filter(group => group.items.length > 0);
}
