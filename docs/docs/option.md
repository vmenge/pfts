# Option&lt;A&gt; docs

This page will contain a list of all associated functions, static and instance methods and properties from `Option`. To learn how to use the `Option`
type, check the [Option basics](/learn/option.md.md) page.

## option

> `option: T -> Option<T>`

Creates an `Option<T>` from a value `T` that may or may not be null or undefined.

```ts
const x = option(5);
expect(x.value).toEqual(5);
expect(x.isSome).toEqual(true);

const y = option(undefined);
expect(y.isNone).toEqual(true);
```

## some

> `some: T -> Option<T>`

Creates a `Some` `Option<T>` from a value that is NOT null or undefined.

```ts
const x = some(5);
expect(x.value).toEqual(5);
```

## none

> `none: () -> Option<T>`

Creates a `None` `Option<T>` containing no value.

```ts
const x = none();
expect(x.isNone).toEqual(true);
```

## .value

Returns the `Some` value contained inside the `Option<A>`.

Throws an Error if the `Option<A>` is `None`.

```ts
const x = some(5);
expect(x.value).toEqual(5);

const y = none();
expect(() => y.value).toThrow();
```

## .raw

Returns the raw value contained inside the `Option<A>`.

```ts
const x = option("something");
expect(x.raw).toEqual("something");

const y = option(undefined);
expect(y.raw).toEqual(undefined);
```

## .isSome

Returns true if `Option<A>` is `Some`.

```ts
const val = option(5);
expect(val.isSome).toEqual(true);
```

## .isNone

Returns true if `Option<A>` is `None`.

```ts
const val: Option<number> = option(undefined);
expect(val.isNone).toEqual(true);
```

## .map()

> `this: Option<A>`
>
> `map: (A -> B) -> Option<B>`

Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.

```ts
const a = some(5).map(x => x * 2);
expect(a.value).toEqual(10);

const b = none().map(x => x * 2);
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## .map2()

> `this: Option<A>`
>
> `map2: (Option<B>, ((A, B) -> C)) -> Option<C>`

Given an `Option<B>`, evaluates the given function against the values of `Option<A>` and `Option<B>` if both are `Some`.

```ts
const a = some(5).map2(some(10), (x, y) => x + y);
expect(a.value).toEqual(15);

const b = some(10).map2(none(), (x, y) => x + y);
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## .map3()

> `this: Option<A>`
>
> `map3: (Option<B>, Option<C>, ((A, B, C) -> D)) -> Option<D>`

Given an `Option<B>` and an `Option<C>`, evaluates the given function against the values of `Option<A>`, `Option<B>` and
`Option<C>` if all are `Some`.

```ts
const a = some(5).map3(some(10), some(100), (x, y, z) => x + y + z);
expect(a.value).toEqual(115);

const b = some(10).map3(none(), some(66), (x, y, z) => x + y + z);
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## .bind()

> `this: Option<A>`
>
> `bind: (A -> Option<B>) -> Option<B>`

Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.

```ts
const a = some(5).bind(x => some(x * 2));
expect(a.value).toEqual(10);

const b = none().bind(x => some(x * 2));
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## .apply()

> `this: Option<A>`
>
> `apply: Option<A -> B> -> Option<B>`

Applies the function on this instance of Option if both are `Some`.

```ts
const fn = some((x: number) => x * 2);
const res = some(5).apply(fn);

expect(res.value).toEqual(10);
```

## .contains()

> `this: Option<A>`
>
> `contains: A -> boolean`

Checks if the `Option<A>` contains the given value.

```ts
const a = some(5).contains(5);
expect(a).toEqual(true);

const b = some(5).contains(9);
expect(b).toEqual(false);

const c = none<number>().contains(10);
expect(c).toEqual(false);
```

## .exists()

> `this: Option<A>`
>
> `exists: (A -> boolean) -> boolean`

If the `Option` is `Some`, evaluates the predicate and returns its result, otherwise returns false.

```ts
const a = some(2).exists(x => x % 2 === 0);
expect(a).toEqual(true);

const b = some(3).exists(x => x % 2 === 0);
expect(b).toEqual(false);

const c = none().exists(x => x % 2 === 0);
expect(c).toEqual(false);
```

## .filter()

> `this: Option<A>`
>
> `filter: (A -> boolean) -> boolean`

Runs a predicate against the value `A` contained inside the `Option<A>` if it is `Some`.

Returns `Some<A>` if the predicate returns `true`, otherwise `None`.

```ts
const a = some(2).filter(x => x % 2 === 0);
expect(a.isSome).toEqual(true);

const b = some(3).filter(x => x % 2 === 0);
expect(b.isNone).toEqual(true);
```

## .fold()

> `this: Option<A>`
>
> `fold: (((State, A) -> State), State) -> State`

Returns the result of the `folder` function if the `Option` is `Some`, otherwise returns the initial `State`.

```ts
const opt1: Option<number> = none();
const res1 = opt1.fold((state, a) => state + a, 0);
expect(res1).toEqual(0);

const opt2 = some(3);
const res2 = opt2.fold((state, a) => state + a, 1);
expect(res2).toEqual(4);
```

## .iter()

> `this: Option<A>`
>
> `iter: (A -> ()) -> ()`

Executes the given function against the value contained in the `Option<A>` if it is `Some`.

```ts
// prints "hello, world!"
some("hello").iter(x => console.log(x + ", world!"));

// doesn't print
none().iter((x: string) => console.log(x + ", world!"));
```

## .defaultValue()

> `this: Option<A>`
>
> `defaultValue: A -> A`

Returns the value contained in the `Option<A>` if it is `Some`, otherwise returns the default value passed as an argument.

```ts
const a = some(10).defaultValue(5);
expect(a).toEqual(10);

const b = none().defaultValue(30);
expect(b).toEqual(30);
```

## .defaultWith()

> `this: Option<A>`
>
> `defaultWith: (() -> A) -> A`

Returns the value contained in the `Option<A>` if it is `Some`, otherwise returns the default value from the evaluated
function passed as an argument.

```ts
const a = some(10).defaultWith(() => 5);
expect(a).toEqual(10);

const b = none().defaultWith(() => 30);
expect(b).toEqual(30);
```

## .orElse()

> `this: Option<A>`
>
> `orElse: Option<A> -> Option<A>`

Returns this `Option<A>` if it is `Some`. Otherwise returns the arg.

```ts
const a = none().orElse(some(5));
expect(a.value).toEqual(5);

const b = some(2).orElse(some(99));
expect(b.value).toEqual(2);
```

## .orElseWith()

> `this: Option<A>`
>
> `orElseWith: (() -> Option<A>) -> Option<A>`

Returns this `Option<A>` if it is `Some`. Otherwise returns result of the function passed in the args.

```ts
const a = none().orElseWith(() => some(5));
expect(a.value).toEqual(5);

const b = some(2).orElseWith(() => some(99));
expect(b.value).toEqual(2);
```

## .zip()

> `this: Option<A>`
>
> `zip: Option<B> -> Option<A * B>`

Returns the tupled values of the two `Option`s if they are all `Some`, otherwise returns `None`.

```ts
const a = some(3).zip(some("bla"));
expect(a.value).toEqual([3, "bla"]);

const b = some(2).zip(none());
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## .zip3()

> `this: Option<A>`
>
> `zip3: (Option<B>, Option<C>) -> Option<A * B * C>`

Returns the tupled values of the three `Option`s if they are all `Some`, otherwise returns `None`.

```ts
const a = some(3).zip3(some("hello"), some(true));
expect(a.value).toEqual([3, "hello", true]);

const b = some(2).zip3(none(), some(true));
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## .match()

> `this: Option<A>`
>
> `match: ((A -> B), (() -> B)) -> B`

If the `Option` is `Some`, returns the result of the first function passed in the args.
Otherwise, returns the result of the second function passed in the args.

```ts
const a = some(5).match(
  x => x * 2,
  () => 0
);

expect(a).toEqual(10);

const b = none().match(
  x => x * 2,
  () => 100
);

expect(b).toEqual(100);
```

## .to()

> `this: Option<A>`
>
> `to: (Option<A> -> B) -> B`

Pipes this current `Option` instance as an argument to the given function.

```ts
const a = some("3").pipe(x => Number(x.value));
expect(a).toEqual(3);
```

## .toResult()

> `this: Option<A>`
>
> `toResult: B -> Result<A, B>`

Returns a `Result<A, B>` from this `Option<A>`.
The `Result` will be `Ok<A>` if the `Option` is `Some`.
Otherwise the `Result` will be `Err<B>`.

```ts
const a = some(3).toResult("oops");
expect(a.value).toEqual(3);

const b = none().toResult("oops");
expect(() => b.value).toThrow();
expect(b.err).toEqual("oops");
```

## .toAsyncOption()

> `this: Option<A>`
>
> `toAsyncOption: () -> AsyncOption<A>`

Converts the `Option` into a `AsyncOption`.

```ts
const a = some(3).toAsyncOption();
expect(a).toBeInstanceOf(AsyncOption);
```

## .toArray()

> `this: Option<A>`
>
> `toArray: () -> A[]`

Returns an `Array<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Array<A>`.

```ts
const a = some(5).toArray();
expect(a).toEqual([5]);

const b = none().toArray();
expect(b.length).toEqual(0);
```

## .toList()

> `this: Option<A>`
>
> `toList: () -> List<A>`

Returns a `List<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `List<A>`.

```ts
const actual = some(5).toList();
const expected = list(5);
expect(actual.eq(expected)).toEqual(true);

const x = none().toList();
expect(x.isEmpty).toEqual(true);
```

## .toSeq()

> `this: Option<A>`
>
> `toSeq: () -> Seq<A>`

Returns a `Seq<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Seq<A>`.

```ts
const actual = some(5).toSeq();
const expected = seq(5);
expect(actual.eq(expected)).toEqual(true);

const x = none().toSeq();
expect(x.isEmpty()).toEqual(true);
```

## ::value()

> `value: Option<T> -> T`

Returns the value contained inside the `Option<T>`.

```ts
const x = Option.value(some(3));
expect(x).toEqual(3);

const y = none();
expect(() => Option.value(y)).toThrow();
```

## ::raw()

> `raw: Option<T> -> (T | undefined)`

Returns the raw value contained inside the `Option<T>`.

```ts
const a = Option.raw(some(3));
expect(a).toEqual(3);

const b = Option.raw(none());
expect(b).toBeUndefined();
```

## ::map()

> `map: (A -> B) -> Option<A> -> Option<B>`

Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.

```ts
const a = Option.map(x => x * 2)(some(5));
expect(a.value).toEqual(10);

const b = Option.map(x => x * 2)(none());
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## ::map2()

> `map2: ((A, B) -> C)) -> Option<A> -> Option<B> -> Option<C>`

Given an `Optoin<A>` and `Option<B>`, evaluates the given function against their values if both are `Some`.

```ts
const a = Option.map2((x, y) => x + y)(some(5))(some(10));
expect(a.value).toEqual(15);

const b = Option.map2((x, y) => x + y)(none())(some(9));
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## ::map3()

> `map3: ((A, B, C) -> D) -> Option<A> -> Option<B> -> Option<C> -> Option<D>`

Given an `Option<A>`, `Option<B>` and an `Option<C>`, evaluates the given function against their values if all are `Some`.

```ts
const a = Option.map3((x, y, z) => x + y + z)(some(5))(some(10))(some(100));
expect(a.value).toEqual(115);

const b = Option.map3((x, y, z) => x + y + z)(none())(some(9))(some(1));
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## ::bind()

> `bind: (A -> Option<B>) -> Option<A> -> Option<B>`

Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`

```ts
const a = Option.bind(x => some(x + 1))(some(3));
expect(a.value).toEqual(4);

const b = Option.bind(_ => none())(some(1));
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## ::apply()

> `apply: Option<(A -> B)> -> Option<A> -> Option<B>`

Applies the function to the value inside the `Option` if both are `Some`.

```ts
const fn = some((x: number) => x * 2);
const a = Option.apply(fn)(some(4));

expect(a.value).toEqual(8);
```

## ::contains()

> `contains: A -> Option<A> -> boolean`

Checks if the `Option<A>` contains the given value.

```ts
const a = Option.contains(5)(some(5));
expect(a).toEqual(true);
```

## ::exists()

> `exists: (A -> boolean) -> Option<A> -> boolean`

If the `Option` is `Some`, evaluates the predicate and returns its result, otherwise returns false.

```ts
const a = Option.exists(x => x % 2 === 0)(4);
expect(a).toEqual(true);
```

## ::filter()

> `filter: (A -> boolean) -> Option<A> -> boolean`

Runs a predicate against the value `A` contained inside the `Option<A>` if it is `Some`.
Returns `Some<A>` if the predicate returns `true`, otherwise `None`.

```ts
const a = Option.filter(x => x % 2 === 0)(4);
expect(a.value).toEqual(4);

const b = Option.filter(x => x % 2 === 0)(3);
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## ::flatten()

> `flatten: Option<Option<A>> -> Option<A>`

Flattens a nested `Option<A>`.

```ts
const a = some(some(3));
const b = Option.flatten(a);
expect(b.value).toEqual(3);
```

## ::fold()

> `fold: ((State, A) -> State) -> State -> Option<A> -> State`

Returns the result of the `folder` function is the `Option` is `Some`, otherwise returns the initial `State`.

```ts
const res1 = Option.fold((state: number, a: number) => state + a)(0)(none());
expect(res1).toEqual(0);

const res2 = Option.fold((state: number, a: number) => state + a)(3)(some(2));
expect(res2).toEqual(5);
```

## ::iter()

> `iter: (A -> ()) -> Option<A> -> ()`

Executes the given function against the value contained in the `Option<A>` if it is `Some`.

```ts
// prints "hello, world!"
Option.iter(console.log)(some("hello, world!"));

// doesn't print anything
Option.iter(console.log)(none());
```

## ::defaultValue()

> `defaultValue: A -> Option<A> -> A`

Returns the value contained by the `Option<A>` if it is `Some`, otherwise returns the default value passed as an argument.

```ts
const a = Option.defaultValue(1)(none());
expect(a.value).toEqual(1);

const b = Option.defaultvalue(5)(some(9));
expect(b.value).toEqual(9);
```

## ::defaultWith()

> `defaultWith: (() -> A) -> Option<A> -> A`

Returns the value contained in the `Option<A>` if it is Some, otherwise returns the default value from the evaluated
function passed as an argument.

```ts
const a = Option.defaultWith(() => 1)(none());
expect(a.value).toEqual(1);

const b = Option.defaultWith(() => 5)(some(9));
expect(b.value).toEqual(9);
```

## ::orElse()

> `orElse: Option<A> -> Option<A> -> Option<A>`

Returns the second `Option<A>` arg if it is `Some`. Otherwise returns the first `Option<A>` arg.

```ts
const a = Option.orElse(some(3))(some(10));
expect(a.value).toEqual(10);

const b = Option.orElse("hello")(none());
expect(b.value).toEqual("hello");
```

## ::orElseWith()

> `orElseWith: (() -> Option<A>) -> Option<A> -> Option<A>`

Returns the `Option<A>` arg if it is `Some`. Otherwise returns the result of the function passed in the args.

```ts
const a = Option.orElseWith(() => some(3))(some(10));
expect(a.value).toEqual(10);

const b = Option.orElseWith(() => "hello")(none());
expect(b.value).toEqual("hello");
```

## ::zip()

> `zip: Option<A> -> Option<B> -> Option<A * B>`

Returns the tupled values of the two `Option`s if they are all `Some`, otherwise returns `None`.

```ts
const a = Option.zip(some("hello"))(some("world"));
expect(a.value).toEqual(["hello", "world"]);

const b = Option.zip(some(true))(none());
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## ::zip3()

> `zip3: Option<A> -> Option<B> -> Option<C> -> Option<A * B * C>`

Returns the tupled values of the three `Option`s if they are all `Some`, otherwise returns `None`.

```ts
const a = Option.zip3(some("hello"))(some("world"))(some("!!!!"));
expect(a.value).toEqual(["hello", "world", "!!!"]);

const b = Option.zip3(some(true))(none())(some(50));
expect(() => b.value).toThrow();
expect(b.isNone).toEqual(true);
```

## ::any()

> `any: Option<A> -> Option<B> -> boolean`

Given a pair of options, will return true if any of them are Some.

```ts
const a = Option.any(some(1))(none());
expect(a).toEqual(true);

const b = Option.any(none())(some(false));
expect(b).toEqual(true);

const c = Option.any(none())(none());
expect(c).toEqual(false);
```

## ::toArray()

> `toArray: Option<A> -> A[]`

Returns an `Array<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Array<A>`.

```ts
const a = Option.toArray(some("hey"));
expect(a).toEqual(["hey"]);

const b = Option.toArray(none());
expect(b.length).toEqual(0);
```

## ::toList()

> `toList: Option<A> -> List<A>`

Returns a `List<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `List<A>`.

```ts
const actual = Option.toList(some(1));
const expected = list(1);
expect(actual.eq(expected));
```

## ::toSeq()

> `toSeq: Option<A> -> Seq<A>`

Returns a `Seq<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Seq<A>`.

```ts
const actual = Option.toSeq(some(1));
const expected = seq(1);
expect(actual.eq(expected));
```

## ::toResult()

> `toResult: B -> Option<A> -> Result<A, B>`

```ts
const a = Option.toResult("oops")(some(1));
expect(a.isOk).toBe(true);
expect(a.value).toEqual(1);

const b = Option.toResult("oops")(none());
expect(b.isErr).toBe(true);
expect(a.err).toEqual("oops");
```

## ::ofResult()

> `ofResult: Result<A, B> -> Option<A>`

```ts
const a = Option.ofResult(ok(5));
expect(a.isSome).toEqual(true);
expect(a.value).toEqual(5);

const b = Option.ofResult(err("oops"));
expect(b.isNone).toEqual(true);
```

## ::ofTruthy()

> `ofTruthy: A -> Option<A>`

Creates an `Option` that is `Some` if the given arg is truthy.

```ts
const a = Option.ofTruthy("bla");
expect(a.isSome).toEqual(true);
expect(a.value).toEqual("bla");

const b = Option.ofTruthy("");
expect(b.isSome).toEqual(false);
expect(() => b.value).toThrow();
```

## ::ofFalsy()

> `ofFalsy: A -> Option<A>`

Creates an `Option` that is `Some` if the given arg is falsy.

```ts
const a = Option.ofFalsy(0);
expect(a.isSome).toEqual(true);
expect(a.value).toEqual(0);

const b = Option.ofFalsy(155);
expect(b.isSome).toEqual(false);
expect(() => b.value).toThrow();
```

## ::sequenceArray()

> `sequenceArray: Option<T>[] -> Option<T[]>`

```ts
const arr1 = [some(1), some(2), some(3)];
const act1 = Option.sequenceArray(arr1);
expect(act1.value).toEqual([1, 2, 3]);

const arr2 = [some(1), none(), some(3)];
const act2 = Option.sequenceArray(arr2);
expect(act2.isNone).toBe(true);
```

## ::sequenceList()

> `sequenceList: List<Option<T>> -> Option<List<T>>`

```ts
const lst1 = list(some(1), some(2), some(3));
const act1 = Option.sequenceList(lst1);
expect(act1.value.toArray()).toEqual([1, 2, 3]);

const lst2 = list(some(1), none(), some(3));
const act2 = Option.sequenceList(lst2);
expect(act2.isNone).toBe(true);
```

## ::sequenceSeq()

> `sequenceSeq: Seq<Option<T>> -> Option<Seq<T>>`

```ts
const sq1 = seq(some(1), some(2), some(3));
const act1 = Option.sequenceSeq(sq1);
expect(act1.value.toArray()).toEqual([1, 2, 3]);

const sq2 = seq(some(1), none(), some(3));
const act2 = Option.sequenceSeq(sq2);
expect(act2.isNone).toBe(true);
```

## ::ce() - Computation Expression

The `Option` computation expression provides an easy way to make use of nested Options, controlling the flow of code execution and returning early whenever an `Option` is `None`.

```ts
const actual1 = Option.ce(function* () {
  const a = yield* some(1);
  const b = yield* some(2);
  const b = yield* some(3);

  return a + b + c;
});

expect(actual1.value).toEqual(6);

const actual2 = Option.ce(function* () {
  const a = yield* some(1);
  const b = yield* none();
  const b = yield* some(3);

  return a + b + c;
});

expect(actual2.isNone).toBe(true);
```
