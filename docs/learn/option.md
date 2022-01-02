# `Option<A>`

The `Option` type is used to represent a value that can be `undefined` or `null`.
The way it's implemented in `pfts` an `Option<A>` is really just a wrapper for the type `A` that can be `null` or `undefined`.
When that value is `undefined` or `null` then the option is `None`. When the value is **not**
`undefined` or `null`, then the `Option<A>` is `Some`.

But what's the point of `Option<A>`? It helps us abstract over common operations we execute on values that can be missing through a variety of methods.

## Creating an `Option`

There are three constructors used to create an `Option` in `pfts`.

- `some()` allows you to create an `Option` from a value that cannot be `null` or `undefined`.
- `none()` allows you to create an `Option` that is `None`.
- `option()` allows you to create an `Option` from a value that may be `null` or `undefined`.

We can use the getters `.isSome` or `.isNone` to check if an `Option` is `Some` or `None`.

```ts
import { option, some, none } from "@pfts/core";
const num = some(5);
num.isSome; // returns true

const nothing = none();
num.isSome; // returns false

const value = option("val");
value.isSome; // returns true

const uVal = option(undefined);
uVal.isNone; // returns true

const nVal = option(null);
nVal.isNone; // returns true
```

> When writing a function that returns an `Option` try to always include the return type in the signature to help TypeScript
> infer the correct types.

```ts
// string -> Option<string>
const parseNum = (s: string): Option<number> => {
  const num = Number(s);
  return Number.isNaN(s) ? none() : some(num);
};

const num = parseNum("10");
num.isSome; // true

const num = parseNum("a");
num.isSome; // false
```

We could've just used regular TypeScript and returned `string | undefined` in this simple example. The real benefit of
the `Option` starts to become more apparent when using its methods.

## **.map()**

`this: Option<A>`

`map: (A -> B) -> Option<B>`

---

Checking if a value is `undefined` or `null` is a fairly common operation. With optional and the nullish coalescing operators
it's definitely a lot more concise to do so than before, but the `Option` type lets us go a bit further.

Below is an example comparing how we'd work with the `parseNum` function if it returned `string | undefinfed` vs an `Option<string>`.

##### **string | undefined**

```ts
const num = parseNum("1");

if (num !== undefined) {
  const result = num + 5;
}
```

##### **Option<string>**

```ts
const result = parseNum("1").map(x => x + 5);
```

`.map()` applies a mapping function on the value inside the `Option` if it is `Some`,
returning a new `Option` with the resulting value.

> If it helps, you can think of an `Option` like an `Array` that can have up to 1 element: if it is
> empty then the mapping function doesn't really do anything, but if it has something inside of it, the mapping function will
> alter that value just like it would in an `Array` with only one element.

## **.bind()**

`this: Option<A>`

`bind: (A -> Option<B>) -> Option<B>`

---

What if we want to use our optional value with a function that also returns an optional value? Let's say we have a function
called `findUser`, that takes a number and might return a `User`.

```ts
type User = { id: number; name: string };
declare function findUser(n: number): Option<User>;

const user = parseNum("5").map(num => findUser(num));
// user is now Option<Option<string>>
```

When returning an `Option` in the function passed to `.map()` we end up with a nested `Option`. We could call `Option.flatten` to flatten down
`Option<Option<string>>` to an `Option<string>` like so:

```ts
const nestedOptUser = parseNum("5").map(num => findUser(num));
const optUser = Option.flatten(nestedOptUser);
```

But wouldn't it be better if we had a function that worked just like `.map()`, but instead returned the `Option` already flattened? That's where `.bind()` comes in.

```ts
const user = parseNum("5").bind(num => findUser(num));
// user is now Option<string>
```

With `.bind()` we can easily chain a lot of optional method calls and create code that is easy to read and write.
Here is another small comparison showing using `undefined` vs using `Option.`

##### **undefined**

```ts
declare function findUser(n: number): User | undefined;

const userId = parseNum("5");
if (userId !== undefined) {
  const user = findUser(userId);

  if (user !== undefined) {
    const greetingMsg = `hello, ${user.name}`;
  }
}
```

##### **Option**

```ts
declare function findUser(n: number): Option<User>;

const greetingMsg = parseNum("5")
  .bind(num => findUser(num))
  .map(user => `hello, ${user.name}`);
```

## Getting the value inside the option

Ideally you want to pass the `Option` around, using `.map()` and `.bind()` (or computation expressions) to work with the values inside the `Option`.
At some point you will need to resolve that value, and decide what to do when the value is there (or not).
How does one access the value inside of the `Option`?

## **.match()**

`this: Option<A>`

`match: ((A -> B), (() -> B)) -> B`

---

Match is a method that takes two functions, one to deal with the value (if it is there), and one to deal with the abscence of the value. Both functions need to return the same type. An example will make things more clear:

```ts
const x = some(5).match(
  val => val * 2,
  () => 0
); // x is 10 here

const y = none().match(
  val => val * 2,
  () => 0
); // y is 0
```

## **.defaultValue()**

`this: Option<A>`

`defaultValue: A -> A`

---

Returns the value contained by the `Option<A>` if it is `Some`, otherwise returns the default value passed as an argument.

```ts
const a = none().defaultValue(1);
// a is 1

const b = some(9).defaultValue(5);
// b is 9
```

## **.defaultWith()**

`this: Option<A>`

`defaultValue: (() -> A) -> A`

---

Returns the value contained by the `Option<A>` if it is `Some`, otherwise returns the value from the evaluated function passed as an argument.

```ts
const a = none().defaultWith(() => 1);
// a is 1

const b = some(9).defaultWith(() => 5);
// b is 9
```

## Escape hatches

If you want to check if the value is undefined yourself, you can access the value inside the `Option` using the `.raw` getter.
If you are sure that the value is `Some` even though the compiler doesn't know, you can can access it using the
`.value` getter, which throws an `Error` if the value is `None`.

```ts
const a = some(5).raw;
// typeof a is number | undefined
// a is 5

const b = some("hello").value;
// typeof b is string
// b is "hello"

const c = none().value;
// throws an Error
```

Avoid relying on `.isSome` together with `.value`, since most of the time it would be defeating the purpose of using an
`Option` to begin with.

```ts
const a = some(5);

// avoid this!
if (a.isSome) {
  console.log(`a is: ${a.value}`);
}
```

## Dealing with multiple Options

Sometimes you have to deal with multiple Options, or you require multiple optional values to do something. `Option` and `List` both provide various ways to deal with that, zipping, traversing, sequencing or using computation expressions are the most common ones.

## **.zip()**

`this: Option<A>`

`zip: Option<B> -> Option<A * B>`

---

`.zip()` evaluates two Options. If they both are `Some` it returns those values tupled, otherwise `.zip()` returns `None`.

```ts
const a = some(1);
const b = some("one");
const c = none();

const someTuple = a.zip(b);
// someTuple.value is [1, "one"]

const noneTuple = a.zip(c);
// noneTuple.isSome is false
// noneTuple.value throws an Error
```

> You can also use `.zip3()` if you need to zip together 3 Options.

## **List::sequenceOption()**

`sequenceOption: List<Option<T>> -> Option<List<T>>`

---

When given a list of Options, `List.sequenceOption` will return an `Option` with a `List` inside that is only `Some` when
**every element** of the list was `Some`.

> `List` is a type included in `pfts` that is essentially an immutable array with extra methods.

```ts
declare function parseNum(s: string): Option<number>;

const optionalNums = list("1", "2", "3").map(n => parseNum(n));
// typeof optionalNums is List<Option<number>>

const nums = List.sequenceOption(optionalNums);
// typeof nums is Option<List<number>>

nums.value; // list(1, 2, 3);

const optionalNums2 = list("1", "not a number", "3").map(parseNum);
// type of optionalNums2 is List<Option<number>>

const nums2 = List.sequenceOption(optionalNums2);
// typeof nums2 is Option<List<number>>

nums2.isSome; // false, since "not a number" was None.
```

> There is also an overload that works with Arrays.

## **List.traverseOption()**

`this: List<A>`

`traverseOption: (A -> Option<B>) -> Option<List<B>>`

---

Equivalent to calling `.map()` on a list with a function that returns an `Option` and then calling `List.sequenceOption`.

```ts
declare function parseNum(s: string): Option<number>;

const nums = list("1", "2", "3").traverseOption(parseNum);
// typeof nums is Option<List<number>>

nums.value; // list(1, 2, 3);

const nums2 = list("1", "not a number", "3").traverseOption(parseNum);
// typeof nums2 is Option<List<number>>

nums2.isSome; // false, since "not a number" was None.
```

## ::ce() - Computation Expression

The `Option` computation expression provides an easy way to make use of nested Options, controlling the flow of code execution and returning early whenever an `Option` is `None`.

First let's take a look at how we'd do this without the `Option` type.

```ts
declare function parseUserHandle(userHandle: number): UserHandle | undefined;
declare function parseEmail(email: string): Email | undefined;
declare function parseUri(uri: string): Uri | undefined;

// (string, string, string) -> UserProfile | undefined
const createProfile = (rawHandle: string, rawEmail: string, rawUri: string) => {
  const userHandle = parseUserHandle(handle);

  if (handle !== undefined) {
    const email = parseEmail(email);

    if (email !== undefined) {
      const uri = parseUri(uri);

      return { userHandle, email, uri };
    }
  }

  return undefined;
};
```

Now using a computation expression. We call `Option.ce()` and pass it a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*). Every time we use the `yield*` keyword, we either get the value
inside of the `Option`, or we return from the function with a `None`.

```ts
declare function parseUserHandle(userHandle: number): Option<UserHandle>;
declare function parseEmail(email: string): Option<Email>;
declare function parseUri(uri: string): Option<Uri>;

// (string, string, string) -> Option<UserProfile>
const createProfile = (rawHandle: string, rawEamil: string, rawUri: string) =>
  Option.ce(function* () {
    const userHandle = yield* parseUserHandle(rawHandle);
    const email = yield* parseEmail(rawEmail);
    const uri = yield* parseUri(rawUri);

    return { userHandle, email, uri };
  });
```

## More

Take a look at the [Option docs](/docs/option.md.md) to find out all the other methods available to it, and keep on reading the guide section, moving on to the [Result](/learn/result.md.md) next.
