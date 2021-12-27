# `Result<A, B>`

The `Result` type is used to represent a value that can be `Ok` (`A`) or `Err` (`B`).
The way it's implemented in `pfts` a `Result<A, B>` is really just a wrapper for the discriminated union `A | B`.
When that value is `A` then the Result is `Ok`. When the value is `B`, then the Result is an `Err`.

We use `Result<A, B>` so we can avoid using `throw`. The philosophy `pfts` follows is that `throw` should only be used
for unrecoverable errors, when there is really nothing you can do about it and you'd rather have your application crash.

> I highly encourage you to read the [Option section](/learn/option.md?id=optionltagt) first, as it shares a lot of
> the concepts presented here.

## Creating a `Result`

There are two constructors used to create a `Result<A, B>` in `pfts`.

- `ok()` allows you to create a `Ok` `Result` from a value `A`.
- `err()` allows you to create a `Err` `Result` from value `B`.

We can use the getters `.isOk` or `.isErr` to check if a `Result` is `Ok` or `Err`.

```ts
import { ok, err } from "@pfts/core";
const num = ok(5);
num.isOk; // returns true

const error = err("oops!");
num.isOk; // returns false
```

It's also very common to create a `Result` from an `Option`.

```ts
declare function findUser(id: number): Option<User>;

const usr = findUser(5).toResult(`Could not find user with id ${id}`);
// typeof usr is Result<User, string>
```

> When writing a function that returns a `Result` try to always include the return type in the signature to help TypeScript
> infer the correct types.

```ts
// string -> Result<number, string>
const parseNum = (s: string): Result<number, string> => {
  const num = Number(s);
  return Number.isNaN(s) ? err(`${s} is not a number`) : ok(num);
};

const num = parseNum("10");
num.isOk; // true

const num = parseNum("a");
num.isOk; // false
```

We could've just used regular TypeScript and returned `number | string` in this simple example.
The caller of the function would then use some sort of type guard to check what type the returned value was. It's a valid approach,
but can quickly get cumbersome depending on the types you're using and involves a lot of boilerplate that can be abstracted
away by using the `Result` type and it's available methods.

## **map**

`this: Result<A, B>`

`map: (A -> C) -> Result<C, B>`

---

Below is an example comparing how we'd work with the `parseNum` function if it returned `number | string` vs a
`Result<number, string>`.

##### **number | string**

```ts
const num = parseNum("1");

if (typeof num === "number") {
  const res = num + 5;
}
```

##### **Result<number, string>**

```ts
const res = parseNum("1").map(x => x + 5);
// typeof res is Result<number, string>
// the value inside res is 6
```

`.map()` applies a mapping function on the value inside the `Result` if it is `Ok`,
returning a new `Result` with the resulting value.

## **bind**

`this: Result<A, B>`

`bind: (A -> Result<C, B>) -> Result<C, B>`

---

What if we want to use our `Result` with a function that also returns a `Result`? Let's say we have a function
called `findUser`, that takes a number and might return a `User` or an `Err`.

```ts
type User = { id: number; name: string };
declare function findUser(n: number): Result<User, string>;

const user = parseNum("5").map(num => findUser(num));
// user is now Result<Result<User, string>, string>
```

When returning a `Result` in the function passed to `.map()` we end up with a nested `Result`. We could call `Result.flatten` to flatten down
`Result<Result<User, string>, string>` to a `Result<User, string>` like so:

```ts
const nestedResult = parseNum("5").map(num => findUser(num));
const usr = Result.flatten(nestedResult);
```

Just like `Option`, `Result` has `.bind()` which works like `.map()`, but instead takes a function that returns another `Result` with the same `Err` type, and flattens the resulting value.

> When calling .bind() on a `Result<A, B>`, the function passed as an argument **needs** to have the same `Err` type.

```ts
declare function parseNum(s: string): Result<number, string>;
declare function findUser(id: number): Result<User, string>;

const user = parseNum("5").bind(num => findUser(num));
// user is now Result<User, string>
```

One thing that is important to keep in mind, is that as soon as a `.bind()` call returns an `Err`, that is the `Err` that
will be propagated. Let's illustrate this better with an example:

```ts
import { ok, err, Result, unit } from "@pfts/core";

const parseNum = (s: string): Result<number, string> => {
  const num = Number(s);
  return Number.isNaN(num) ? err("not a number") : ok(num);
};

const findUser = (userId: number): Result<User, string> => {
  if (userId === 2) {
    return ok({ id: 2, name: "john", roles: ["mod"] });
  }

  return err("not found");
};

const doSomething = (user: User): Result<void, string> => {
  if (!user.roles.includes("admin")) {
    return err("forbidden");
  }

  console.log("doing something!");
  return ok(unit);
};

const findUserAndDoSomething = (rawUserId: string): Result<void, string> =>
  parseNum(rawUserId)
    .bind(num => findUser(num))
    .bind(user => doSomething(user));

const a = findUserAndDoSomething("bla");
// a is Err "not a number" since parseNum will fail
// and nothing after it will be executed.

const b = findUserAndDoSomething("4");
// b is Err "not found" since findUser will fail
// and nothing after it will be executed.

const c = findUserAndDoSomething("2");
// c is Err "forbidden" since parseNum and findUser
// were executed and the function only failed at the last step.
```

> `unit` is a variable of type `void`, indicating the abscence of a specific value.

## **mapErr**

`this: Result<A, B>`

`mapErr: (B -> C) -> Result<A, C>`

---

Functions and methods that work with the `Result` type typically requires both Results to have the same `Err` type.
When working with different functions that return Results they'll eventually have different types, requiring the errors to
be mapped so they can be used together.

```ts
declare function validatePost(dto: PostContentDto): Result<PostContent, CreatePostError>;
declare function uploadToS3(post: PostContent): Result<S3Response, S3Error>;

type CreatePostError = {
  type: "BadRequest" | "BadGateway" | "InternalServerError";
  message: string;
};

const CreatePostError = {
  ofS3Error: (err: S3Error): CreatePostError => {
    // ...
  },
};

const createPost = (dto: PostContentDto): Result<Post, CreatePostError> =>
  validatePost(dto).bind(post =>
    uploadToS3(post)
      .mapErr(e => CreatePostError.ofS3Error(e))
      .map(s3Res => ({ title: post.title, body: post.body, image: s3Res.uri }))
  );
```

## Getting the value inside the Result

Like the `Option` type, ideally you want to pass the `Result` around using `.map()` and `.bind()` (or computation expressions) to work with the values inside the `Result`.
At some point you will need to resolve that value, and decide what to do with the `Ok` or `Err` value.

## **match**

`this: Result<A, B>`

`match: ((A -> C), (B -> C)) -> C`

---

Match is a method that takes two functions, one to deal with the possible `Ok`value, and one to deal with the
possible `Err` value. Both functions need to return the same type. An example will make things more clear:

```ts
const parseNum = (s: string): Result<number, string> => {
  const num = Number(s);
  return Number.isNaN(num) ? err("not a number") : ok(num);
};

parseNum("5").match(
  val => console.log(`Success: Value is ${val}`),
  err => console.log(`$Error: {err}`)
); // prints "Success: Value is 5"

parseNum("bla").match(
  val => console.log(`Success: Value is ${val}`),
  err => console.log(`$Error: {err}`)
); // prints "Error: not a number
```

## **defaultValue**

`this: Result<A, B>`

`defaultValue: A -> A`

---

Returns the value contained by the `Result<A, B>` if it is `Ok`, otherwise returns the default value passed as an argument.

```ts
const a = err("not a number").defaultValue(1);
// a is 1

const b = ok(9).defaultValue(5);
// b is 9
```

## **defaultWith**

`this: Result<A, B>`

`defaultValue: (() -> A) -> A`

---

Returns the value contained by the `Result<A, B>` if it is `Ok`, otherwise returns the value from the evaluated function passed as an argument.

```ts
const a = err("not a number").defaultWith(() => 1);
// a is 1

const b = ok(9).defaultWith(() => 5);
// b is 9
```

## Escape hatches

If you want to check if the value is `A | B` yourself, you can access the value inside the `Result` using the `.raw` getter.
If you are sure that the value is `Ok` even though the compiler doesn't know, you can can access it using the
`.value` getter, which throws an `Error` if the value is `Err`. If you are sure the value is an `Err` even though the
compiler doesn't know, you can access it using the `.err` getter, which throw an `Error` if the value is `Ok`.

```ts
const a = ok<number, string>(5).raw;
// typeof a is number | string
// a is 5

const b = err<number, string>("oops").raw;
// typeof b is number | string
// b is "oops"

const c = ok(5).value;
// typeof c is number
// c is "hello"

const d = ok<number, string>(5).err;
// typeof d is string
// throws an Error

const e = err<number, string>("oops").value;
// typeof e is number
// throws an Error

const f = err("oops").err;
// typeof f is string
// f is "oops"
```

Avoid relying on `.isOk` together with `.value`, since most of the time it would be defeating the purpose of using a
`Result` to begin with.

```ts
const a = ok(5);

// avoid this!
if (a.isOk) {
  console.log(`a is: ${a.value}`);
}
```

## Dealing with multiple Results

`Result` provides various ways to deal with multplie values:
zipping, sequencing or using computation expressions are the most common ones.

## **zip**

`this: Result<A, B>`

`zip: Result<C, B> -> Result<A * C, B>`

---

`.zip()` evaluates two Results. If they both are `Ok` it returns those values tupled, otherwise `.zip()` returns the
`Err` of the instance or of the arg, in that order.

```ts
const a = ok(1);
const b = ok(true);
const c = err("oops");
const d = err("oh no!");

const okTup = a.zip(b);
// okTup.value is [1, true]

const errTup1 = a.zip(c);
// errTup1.isOk is false
// errTup1.value throws an Error

const errTup2 = c.zip(d);
// errTup2.err is "oops"

const errTup3 = d.zip(c);
// errTup3.err is "oh no!"
```

> You can also use `.zip3()` if you need to zip together 3 Options.

## **Result.sequenceList**

`sequenceList: List<Result<A, B>> -> Result<List<A>, B>`

---

When given a list of Results, `Result.sequenceList` will return a `Result` with a `List` inside that is only `Ok` when
**every element** of the list was `Ok`. The first element that is an `Err` will be the `Err` returned by the function.

> `List` is a type included in `pfts` that is essentially an immutable array with extra methods.

```ts
declare function parseNum(s: string): Result<number, string>;

const numsOrErr = list("1", "2", "3").map(n => parseNum(n));
// typeof numsOrErr is List<Result<number, string>>

const nums = Result.sequenceList(optionalNums);
// typeof nums is Result<List<number>, string>

nums.value; // list(1, 2, 3);

const numsOrErr2 = list("1", "bla", "3").map(parseNum);
// type of numsOrErr2 is List<Result<number, string>>

const nums2 = Result.sequenceList(optionalNums2);
// typeof nums2 is Result<List<number>, string>

nums.isOk; // false, since "bla" was an Err.
num.err; // would probably return "bla is not a number" depending on what parseNum returns
```

> There is also `Result.sequenceArray` available, which works the exact same way but with an `Array<Result<A, B>>`

## **Result.hoard**

`hoard: Result<A, Err> * Result<B, Err> * Result<C, Err> ... -> Result<A * B * C..., List<Err>>`

---

`Result.hoard` takes a tuple of n Results, and returns a Result that contains the `Ok` values tupled if all of them were
`Ok`, or all the `Err` values in a `List`.

```ts
const okResults = Result.hoard([ok(1), ok(true), ok("hello")]);
// okResults.raw is [1, true, "hello"]

const errResults = Result.hoard([ok(1), err("oops"), ok(true), err("oh no!")]);
// errResults.raw is list("oops", "oh no!")
```

## **Result.collect**

`collect: Record<string, Result<any, Err>> -> Result<Record<string, any>, List<Err>>`

---

`Result.collect` takes an object where all values must be Results, and will return that same object with the `Ok` values
extracted, or a `List` with all the `Err` values.

```ts
const oks = Result.collect({ a: ok(1), b: ok(true), c: ok("hello") });
const { a, b, c } = oks.raw;
// a is 1, b is true, c is "hello"

const errs = Result.collect({ d: ok(99), e: err("oops"), f: err("oh no!") });
// errs.raw is list("oops", "oh no!")
```

## Computation Expression

The `Result` computation expression provides an easy way to make use of nested Results, controlling the flow of code execution and returning early whenever a `Result` is `Err`.

We can call `Result.ce()` and pass it a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*). Every time we use the `yield*` keyword, we either get the `Ok` value
inside of the `Result`, or we return from the function with the Result's `Err`.

```ts
declare function parseUserHandle(userHandle: number): Result<UserHandle, string>;
declare function parseEmail(email: string): Result<Email, string>;
declare function parseUri(uri: string): Result<Uri, string>;

// (string, string, string) -> Result<UserProfile, string>
const createProfile = (rawHandle: string, rawEamil: string, rawUri: string) =>
  Result.ce(function* () {
    const userHandle = yield* parseUserHandle(rawHandle);
    const email = yield* parseEmail(rawEmail);
    const uri = yield* parseUri(rawUri);

    return { userHandle, email, uri };
  });
```

## More

Take a look at the [Result docs](/docs/result.md) to find out all the other methods available to it, and keep on reading
the guide section, moving on to [Async](/learn/async.md) next.
