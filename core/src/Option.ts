import { async } from "./Async";
import { AsyncOption } from "./AsyncOption";
import { list, List } from "./List";
import { err, ok, Result } from "./Result";
import { Seq, seq } from "./Seq";

/**
 * A class that can represent the presence (`Some<A>`) or abscence (`None`) of a value.
 */
export class Option<A> {
  private static _none = new Option<never>();
  private constructor(private readonly _value?: A) {}

  /**
   * `create: T -> Option<T>`
   *
   * ---
   * Creates an Option<T> from a value T that may or may not be null or undefined.
   * @example
   * const x = Option.new(5);
   * expect(x.value).toEqual(5);
   * expect(x.isSome).toEqual(true);
   *
   * const y = Option.new(undefined);
   * expect(y.isNone).toEqual(true);
   */
  static new = <T>(value?: T): Option<NonNullable<T>> => new Option(value) as Option<NonNullable<T>>;

  /**
   * `some: T -> Option<T>`
   *
   * ---
   * Creates a `Some` `Option<T>` from a value that is NOT null or undefined;
   * @example
   * const x = Option.some(5);
   * expect(x.value).toEqual(5);
   */
  static some = <T>(value: NonNullable<T>): Option<T> => new Option(value);

  /**
   * `none: () -> Option<T>`
   *
   * Creates a `None` `Option<T>` containing no value.
   * @example
   * const x = Option.none();
   * expect(x.isNone).toEqual(true);
   */
  static none = <T = never>(): Option<NonNullable<T>> => Option._none as Option<NonNullable<T>>;

  /**
   * @returns the value contained inside the `Option<A>`.
   * @throws an Error if the `Option<A>` is `None`.
   * @example
   * const x = some(5);
   * expect(x.value).toEqual(5);
   *
   * const y = none();
   * expect(() => y.value).toThrow();
   */
  get value(): A {
    if (this._value === undefined) {
      throw new Error("Could not extract value from Option.");
    }

    return this._value;
  }

  /**
   * @returns the raw value contained inside the `Option<A>`.
   * @example
   * const x = option("something");
   * expect(x.raw).toEqual("something");
   *
   * const y = option(undefined);
   * expect(y.raw).toEqual(undefined);
   */
  get raw(): A | undefined {
    if (this._value === null) {
      return undefined;
    }

    return this._value;
  }

  /**
   * @returns true if `Option<A>` is `Some`.
   * @example
   * const val = option(5);
   * expect(val.isSome).toEqual(true);
   */
  get isSome(): boolean {
    return this._value !== undefined && this._value !== null;
  }

  /**
   * @returns true if `Option<A>` is `None`.
   * @example
   * const val: Option<number> = option(undefined);
   * expect(val.isNone).toEqual(true);
   */
  get isNone(): boolean {
    return this._value === undefined || this._value === null;
  }

  *[Symbol.iterator](): Generator<Option<A>, A, any> {
    return yield this;
  }

  /**
   * `this: Option<A>`
   *
   * `map: (A -> B) -> Option<B>`
   *
   * ---
   * Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   * @example
   * const a = some(5).map(x => x * 2);
   * expect(a.value).toEqual(10);
   *
   * const b = none().map(x => x * 2);
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  map<B>(fn: (a: A) => B): Option<B> {
    if (this.isSome) {
      return option(fn(this._value!));
    }

    return none();
  }

  /**
   * `this: Option<A>`
   *
   * `map2: (Option<B>, ((A, B) -> C)) -> Option<C>`
   *
   * ---
   * Given an `Option<B>`, evaluates the given function against the values of `Option<A>` and `Option<B>` if both are `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   * @example
   * const a = some(5).map2(some(10), (x, y) => x + y);
   * expect(a.value).toEqual(15);
   *
   * const b = some(10).map2(none(), (x, y) => x + y);
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  map2<B, C>(b: Option<B>, fn: (a: A, b: B) => C): Option<C> {
    if (this.isSome && b.isSome) {
      return option(fn(this._value!, b._value!));
    }

    return none();
  }

  /**
   * `this: Option<A>`
   *
   * `map3: (Option<B>, Option<C>, ((A, B, C) -> D)) -> Option<D>`
   *
   * ---
   * Given an `Option<B>` and  an `Option<C>`, evaluates the given function against the values of `Option<A>`, `Option<B>` and `Option<C>` if all are `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   * @example
   * const a = some(5).map3(some(10), some(100), (x, y, z) => x + y + z);
   * expect(a.value).toEqual(115);
   *
   * const b = some(10).map3(none(), some(66), (x, y, z) => x + y + z);
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  map3<B, C, D>(b: Option<B>, c: Option<C>, fn: (a: A, b: B, c: C) => D): Option<D> {
    if (this.isSome && b.isSome && c.isSome) {
      return option(fn(this._value!, b._value!, c._value!));
    }

    return none();
  }

  /**
   * `this: Option<A>`
   *
   * `bind: (A -> Option<B>) -> Option<B>`
   *
   * ---
   * Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.
   * @param fn a binder function.
   * @returns The resulting value of the binder function.
   * @example
   * const a = some(5).bind(x => some(x * 2));
   * expect(a.value).toEqual(10);
   *
   * const b = none().bind(x => some(x * 2));
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  bind<B>(fn: (a: A) => Option<B>): Option<B> {
    if (this.isSome) {
      return fn(this._value!);
    }

    return none();
  }

  /**
   * `this: Option<A>`
   *
   * `contains: A -> boolean`
   *
   * ---
   * Checks if the `Option<A>` contains the given value.
   * @returns true if the `Option` contains the value.
   * @example
   * const a = some(5).contains(5);
   * expect(a).toEqual(true);
   *
   * const b = some(5).contains(9);
   * expect(b).toEqual(false);
   *
   * const c = none<number>().contains(10);
   * expect(c).toEqual(false);
   */
  contains(value: A): boolean {
    return this.isSome && this._value === value;
  }

  /**
   * `this: Option<A>`
   *
   * `exists: (A -> boolean) -> boolean`
   *
   * If the `Option` is `Some`, evaluates the predicate and returns its result, otherwise returns false.
   * @example
   * const a = some(2).exists(x => x % 2 === 0);
   * expect(a).toEqual(true);
   *
   * const b = some(3).exists(x => x % 2 === 0);
   * expect(b).toEqual(false);
   *
   * const c = none().exists(x => x % 2 === 0);
   * expect(c).toEqual(false);
   */
  exists(predicate: (a: A) => boolean): boolean {
    return this.isSome && predicate(this._value!);
  }

  /**
   * `this: Option<A>`
   *
   * `filter: (A -> boolean) -> boolean`
   *
   * ---
   * Runs a predicate against the value `A` contained inside the `Option<A>` if it is `Some`.
   * @returns `Some<A>` if the predicate returns `true`, otherwise `None`.
   * @example
   * const a = some(2).filter(x => x % 2 === 0);
   * expect(a.isSome).toEqual(true);
   *
   * const b = some(3).filter(x => x % 2 === 0);
   * expect(b.isNone).toEqual(true);
   */
  filter(predicate: (a: A) => boolean): Option<A> {
    return this.isSome && predicate(this._value!) ? some(this._value!) : none();
  }

  /**
   * `this: Option<A>`
   *
   * `fold: (((State, A) -> State), State) -> State`
   *
   * ---
   * @param folder folder function
   * @param state initial `State`
   * @returns the result of the `folder` function is the `Option` is `Some`, otherwise the initial `State`.
   * @example
   * const opt1: Option<number> = none();
   * const res1 = opt1.fold((state, a) => state + a, 0);
   * expect(res1).toEqual(0);
   *
   * const opt2 = some(3);
   * const res2 = opt2.fold((state, a) => state + a, 1);
   * expect(res2).toEqual(4);
   */
  fold<State>(folder: (state: State, a: A) => State, state: State): State {
    return this.isSome ? folder(state, this._value!) : state;
  }

  /**
   * `this: Option<A>`
   *
   * `iter: (A -> ()) -> ()`
   *
   * ---
   * Executes the given function against the value contained in the `Option<A>` if it is `Some`.
   * @param fn a function that typically executes a side effect.
   * @example
   * some("hello").iter(x => console.log(x + ", world!")); // prints "hello, world!"
   * none().iter(x => console.log(x + ", world!")); // doesn't print
   */
  iter(fn: (a: A) => void): void {
    if (this.isSome) {
      fn(this._value!);
    }
  }

  /**
   * `this: Option<A>`
   *
   * `tee: (A -> ()) -> Option<A>`
   *
   * ---
   * Executes the given function against the value contained in the `Option<A>` if it is `Some`.
   * @param fn a function that typically executes a side effect.
   * @returns the same `Option<A>` instance.
   * @example
   * const a = some("hello").tee(x => console.log(x + ", world!")); // prints "hello, world!"
   * expect(a.value).toEqual("hello");
   */
  tee(fn: (a: A) => void): Option<A> {
    if (this.isSome) {
      fn(this._value!);
    }

    return this;
  }

  /**
   * `this: Option<A>`
   *
   * `trace: (string | undefined) -> Option<A>`
   *
   * ---
   * Logs the current value from the `Option<A>` to the console.
   * @returns `Option<A>` unmodified.
   * @example
   * some(5).trace("value:"); // prints "value: 5"
   * some("something").trace(); // prints "something"
   * none().trace("value:"); // prints "value: "
   */
  trace(msg?: string): Option<A> {
    const logStr = msg ? `${msg} ${this}` : `${this}`;
    console.log(logStr);

    return this;
  }

  /**
   * `this: Option<A>`
   *
   * `defaultValue: A -> A`
   *
   * ---
   * @returns the value contained in the `Option<A>` if it is `Some`, otherwise returns the default value passed as an argument.
   * @example
   * const a = some(10).defaultValue(5);
   * expect(a).toEqual(10);
   *
   * const b = none().defaultValue(30);
   * expect(b).toEqual(30);
   */
  defaultValue(value: A): A {
    if (this.isNone) {
      return value;
    }

    return this._value!;
  }

  /**
   * `this: Option<A>`
   *
   * `defaultWith: (() -> A) -> A`
   *
   * ---
   * @returns the value contained in the `Option<A>` if it is `Some`, otherwise returns the default value from the evaluated function passed as an argument.
   * @example
   * const a = some(10).defaultWith(() => 5);
   * expect(a).toEqual(10);
   *
   * const b = none().defaultWith(() => 30);
   * expect(b).toEqual(30);
   */
  defaultWith(fn: () => A): A {
    if (this.isNone) {
      return fn();
    }

    return this._value!;
  }

  /**
   * `this: Option<A>`
   *
   * `toArray: () -> A[]`
   *
   * ---
   * @returns an `Array<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Array<A>`.
   * @example
   * const a = some(5).toArray();
   * expect(a).toEqual([5]);
   *
   * const b = none().toArray();
   * expect(b.length).toEqual(0);
   */
  toArray(): A[] {
    if (this.isNone) {
      return [];
    }

    return [this._value!];
  }

  /**
   * `this: Option<A>`
   *
   * `toList: () -> List<A>`
   *
   * ---
   * @returns a `List<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `List<A>`.
   * @example
   * const actual = some(5).toList();
   * const expected = list(5);
   * expect(actual.eq(expected)).toEqual(true);
   *
   * const x = none().toList();
   * expect(x.isEmpty).toEqual(true);
   */
  toList(): List<A> {
    if (this.isNone) {
      return list();
    }

    return list(this._value!);
  }

  /**
   * `this: Option<A>`
   *
   * `toSeq: () -> Seq<A>`
   *
   * ---
   * @returns a `Seq<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Seq<A>`.
   * @example
   * const actual = some(5).toSeq();
   * const expected = seq(5);
   * expect(actual.eq(expected)).toEqual(true);
   *
   * const x = none().toSeq();
   * expect(x.isEmpty()).toEqual(true);
   */
  toSeq(): Seq<A> {
    if (this.isNone) {
      return seq();
    }

    return seq(this._value!);
  }

  /**
   * `this: Option<A>`
   *
   * `orElse: Option<A> -> Option<A>`
   *
   * ---
   * @param ifNone value to be returned if this instance of `Option<A>` is `None`.
   * @returns this `Option<A>` if it is `Some`. Otherwise returns `ifNone`.
   * @example
   * const a = none().orElse(some(5));
   * expect(a.value).toEqual(5);
   *
   * const b = some(2).orElse(some(99));
   * expect(b.value).toEqual(2);
   */
  orElse(ifNone: Option<A>): Option<A> {
    if (this.isNone) {
      return ifNone;
    }

    return this;
  }

  /**
   * `this: Option<A>`
   *
   * `orElseWith: (() -> Option<A>) -> Option<A>`
   *
   * ---
   * @param fn function that evaluates to the value to be returned if this instance of `Option<A>` is `None`.
   * @returns this `Option<A>` if it is `Some`. Otherwise returns result of `fn`.
   * @example
   * const a = none().orElseWith(() => some(5));
   * expect(a.value).toEqual(5);
   *
   * const b = some(2).orElseWith(() => some(99));
   * expect(b.value).toEqual(2);
   */
  orElseWith(fn: () => Option<A>): Option<A> {
    if (this.isNone) {
      return fn();
    }

    return this;
  }

  /**
   * `this: Option<A>`
   *
   * `zip: Option<B> -> Option<A * B>`
   *
   * ---
   * @returns the tupled values of the two `Option`s if they are all `Some`, otherwise returns `None`.
   * @example
   * const a = some(3).zip(some("bla"));
   * expect(a.value).toEqual([3, "bla"]);
   *
   * const b = some(2).zip(none());
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  zip<B>(o: Option<B>): Option<[A, B]> {
    if (o.isSome && this.isSome) {
      return some([this._value!, o._value!]);
    }

    return none();
  }

  /**
   * `this: Option<A>`
   *
   * `zip3: (Option<B>, Option<C>) -> Option<A * B * C>`
   *
   * ---
   * @returns the tupled values of the three `Option`s if they are all `Some`, otherwise returns `None`.
   * @example
   * const a = some(3).zip3(some("hello"), some(true));
   * expect(a.value).toEqual([3, "hello", true]);
   *
   * const b = some(2).zip3(none(), some(true));
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  zip3<B, C>(o1: Option<B>, o2: Option<C>): Option<[A, B, C]> {
    if ((this.isSome, o1.isSome, o2.isSome)) {
      return some([this._value!, o1._value!, o2._value!]);
    }

    return none();
  }

  /**
   * `this: Option<A>`
   *
   * `toResult: B -> Result<A, B>`
   *
   * ---
   * @returns a `Result<A, B>` from this `Option<A>`. The `Result` will be `Ok<A>` if the `Option` is `Some`. Otherwise the `Result` will be `Err<B>`.
   * @example
   * const a = some(3).toResult("oops");
   * expect(a.value).toEqual(3);
   *
   * const b = none().toResult("oops");
   * expect(() => b.value).toThrow();
   * expect(b.err).toEqual("oops");
   */
  toResult<B>(error: B): Result<A, B> {
    if (this.isNone) {
      return err(error);
    }

    return ok(this._value!);
  }

  /**
   * `this: Option<A>`
   *
   * `match: ((A -> B), (() -> B)) -> B`
   *
   * ---
   * @param someFn function to be executed if `Option<A>` is `Some`.
   * @param noneFn function to be executed if `Option<A>` is `None`.
   * @returns the result of `someFn` or `noneFn`.
   * @example
   * const a = some(5).match(
   *   x => x * 2,
   *   () => 0
   * );
   *
   * expect(a).toEqual(10);
   *
   * const b = none().match(
   *   x => x * 2,
   *   () => 100
   * );
   *
   * expect(b).toEqual(100);
   */
  match<B>(someFn: (a: A) => B, noneFn: () => B): B {
    if (this.isSome) {
      return someFn(this._value!);
    }

    return noneFn();
  }

  /**
   * `this: Option<A>`
   *
   * `toAsyncOption: () -> AsyncOption<A>`
   *
   * ---
   */
  toAsyncOption(): AsyncOption<A> {
    return new AsyncOption(async(this));
  }

  /**
   * `this: Option<A>`
   *
   * `toString: () -> string`
   *
   * ---
   * @example
   * const a = some(5).toString();
   * expect(a).toEqual("5");
   *
   * const b = none().toString();
   * expect(b).toEqual("");
   */
  toString(): string {
    if (this.isSome) {
      return `${this._value}`;
    }

    return "";
  }

  toJSON(): A | undefined {
    return this.raw;
  }

  /**
   * `this: Option<A>`
   *
   * `to: (Option<A> -> B) -> B`
   *
   * ---
   * Pipes this current `Option` instance as an argument to the given function.
   * @example
   * const a = some("3").pipe(x => Number(x.value));
   * expect(a).toEqual(3);
   */
  to<B>(fn: (a: Option<A>) => B): B {
    return fn(this);
  }

  /**
   * `value: Option<T> -> T`
   *
   * ---
   * @returns the value contained inside the `Option<T>`.
   * @throws an Error if the `Option<T>` is `None`.
   * @example
   * const x = Option.value(some(3));
   * expect(x).toEqual(3);
   *
   * const y = none();
   * expect(() => Option.value(y)).toThrow();
   */
  static value = <T>(o: Option<T>) => o.value;

  /**
   * `raw: Option<T> -> (T | undefined)`
   *
   * ---
   * @returns the raw value contained inside the `Option<T>`.
   * @example
   * const a = Option.raw(some(3));
   * expect(a).toEqual(3);
   *
   * const b = Option.raw(none());
   * expect(b).toBeUndefined();
   */
  static raw = <T>(o: Option<T>) => o.raw;

  /**
   * `map: (A -> B) -> Option<A> -> Option<B>`
   *
   * ---
   * Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   * @example
   * const a = Option.map(x => x * 2)(some(5));
   * expect(a.value).toEqual(10);
   *
   * const b = Option.map(x => x * 2)(none());
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  static map =
    <A, B>(fn: (a: A) => B) =>
    (o: Option<A>): Option<B> =>
      o.map(fn);

  /**
   * `map2: ((A, B) -> C)) -> Option<A> -> Option<B> -> Option<C>`
   *
   * ---
   * Given an `Optoin<A>` and `Option<B>`, evaluates the given function against their values if both are `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   * @example
   * const a = Option.map2(x + y => x + y)(some(5))(some(10));
   * expect(a.value).toEqual(15);
   *
   * const b = Option.map2(x + y => x + y)(none())(some(9));
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  static map2 =
    <A, B, C>(fn: (a: A, b: B) => C) =>
    (o1: Option<A>) =>
    (o2: Option<B>): Option<C> =>
      o1.map2(o2, fn);

  /**
   * `map3: ((A, B, C) -> D) -> Option<A> -> Option<B> -> Option<C> -> Option<D>`
   *
   * ---
   * Given an `Option<A>`, `Option<B>` and  an `Option<C>`, evaluates the given function against their values if all are `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   * @example
   * const a = Option.map3(x + y + z => x + y + z)(some(5))(some(10))(some(100));
   * expect(a.value).toEqual(115);
   *
   * const b = Option.map3(x + y + z => x + y + z)(none())(some(9))(some(1));
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  static map3 =
    <A, B, C, D>(fn: (a: A, b: B, c: C) => D) =>
    (o1: Option<A>) =>
    (o2: Option<B>) =>
    (o3: Option<C>): Option<D> =>
      o1.map3(o2, o3, fn);

  /**
   * `bind: (A -> Option<B>) -> Option<A> -> Option<B>`
   *
   * ---
   * Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.
   * @param fn a binder function.
   * @returns The resulting value of the binder function.
   * @example
   * const a = Option.bind(x => some(x + 1))(some(3));
   * expect(a.value).toEqual(4);
   *
   * const b = Option.bind(_ => none())(some(1));
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  static bind =
    <A, B>(fn: (a: A) => Option<B>) =>
    (o: Option<A>): Option<B> =>
      o.bind(fn);

  /**
   * `apply: Option<(A -> B)> -> Option<A> -> Option<B>`
   *
   * ---
   */
  static apply =
    <A, B>(fn: Option<(a: A) => B>) =>
    (o: Option<A>): Option<B> =>
      Option.bind<(a: A) => B, B>(f => Option.bind<A, B>(x => option(f(x)))(o))(fn);

  /**
   * `contains: A -> Option<A> -> boolean`
   *
   * ---
   * Checks if the `Option<A>` contains the given value.
   * @returns true if the `Option` contains the value.
   * @example
   * const a = Option.contains(5)(some(5));
   * expect(a).toEqual(true);
   */
  static contains =
    <A>(value: A) =>
    (o: Option<A>): boolean =>
      o.contains(value);

  /**
   * `exists: (A -> boolean) -> Option<A> -> boolean`
   *
   * ---
   * If the `Option` is `Some`, evaluates the predicate and returns its result, otherwise returns false.
   * @example
   * const a = Option.exists(x => x % 2 === 0)(4);
   * expect(a).toEqual(true);
   */
  static exists =
    <A>(predicate: (a: A) => boolean) =>
    (o: Option<A>): boolean =>
      o.exists(predicate);

  /**
   * `filter: (A -> boolean) -> Option<A> -> boolean`
   *
   * ---
   * Runs a predicate against the value `A` contained inside the `Option<A>` if it is `Some`.
   * @returns `Some<A>` if the predicate returns `true`, otherwise `None`.
   * @example
   * const a = Option.filter(x => x % 2 === 0)(4);
   * expect(a.value).toEqual(4);
   *
   * const b = Option.filter(x => x % 2 === 0)(3);
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  static filter =
    <A>(predicate: (a: A) => boolean) =>
    (o: Option<A>): Option<A> =>
      o.filter(predicate);

  /**
   * `flatten: Option<Option<A>> -> Option<A>`
   *
   * ---
   * Flattens a nested `Option<A>`.
   * @example
   * const a = some(some(3));
   * const b = Option.flatten(a);
   * expect(b.value).toEqual(3);
   */
  static flatten = <A>(o: Option<Option<A>>): Option<A> => o.bind(x => x);

  /**
   * `fold: ((State, A) -> State) -> State -> Option<A> -> State`
   *
   * ---
   * @param folder folder function
   * @param state initial `State`
   * @param o optional value to fold.
   * @returns the result of the `folder` function is the `Option` is `Some`, otherwise the initial `State`.
   * @example
   * const res1 = Option.fold((state: number, a: number) => state + a)(0)(none());
   * expect(res1).toEqual(0);
   *
   * const res2 = Option.fold((state: number, a: number) => state + a)(3)(some(2));
   * expect(res2).toEqual(5);
   */
  static fold =
    <A, State>(folder: (state: State, a: A) => State) =>
    (state: State) =>
    (o: Option<A>): State =>
      o.fold(folder, state);

  /**
   * `iter: (A -> ()) -> Option<A> -> ()`
   *
   * ---
   * @example
   * Option.iter(console.log)(some("hello, world!")); // prints "hello, world!"
   */
  static iter =
    <A>(fn: (a: A) => void) =>
    (o: Option<A>): void =>
      o.iter(fn);

  /**
   * `defaultValue: A -> Option<A> -> A`
   *
   * ---
   * @returns the value contained by the `Option<A>` if it is `Some`, otherwise returns the default value passed as an argument.
   * @example
   * const a = Option.defaultValue(1)(none());
   * expect(a.value).toEqual(1);
   *
   * const b = Option.defaultvalue(5)(some(9));
   * expect(b.value).toEqual(9);
   */
  static defaultValue =
    <A>(value: A) =>
    (o: Option<A>): A =>
      o.defaultValue(value);

  /**
   * `toArray: Option<A> -> A[]`
   *
   * ---
   * @returns an `Array<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Array<A>`.
   * @example
   * const a = Option.toArray(some("hey"));
   * expect(a).toEqual(["hey"]);
   *
   * const b = Option.toArray(none());
   * expect(b.length).toEqual(0);
   */
  static toArray = <A>(o: Option<A>): Array<A> => o.toArray();

  /**
   * `toList: Option<A> -> List<A>`
   *
   * ---
   * @returns a `List<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `List<A>`.
   * @example
   * const actual = Option.toList(some(1));
   * const expected = list(1);
   * expect(actual.eq(expected))
   */
  static toList = <A>(o: Option<A>): List<A> => o.toList();

  /**
   * `toSeq: Option<A> -> Seq<A>`
   *
   * ---
   * @returns a `Seq<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Seq<A>`.
   * @example
   * const actual = Option.toSeq(some(1));
   * const expected = seq(1);
   * expect(actual.eq(expected))
   */
  static toSeq = <A>(o: Option<A>): Seq<A> => o.toSeq();

  /**
   * `orElse: Option<A> -> Option<A> -> Option<A>`
   *
   * ---
   * @param ifNone value to be returned if the main `Option<A>` is `None`.
   * @param opt main `Option`.
   * @returns `Option<A>` if it is `Some`. Otherwise returns `ifNone`.
   * @example
   * const a = Option.orElse(some(3))(some(10));
   * expect(a.value).toEqual(10);
   *
   * const b = Option.orElse("hello")(none());
   * expect(b.value).toEqual("hello");
   */
  static orElse =
    <A>(ifNone: Option<A>) =>
    (opt: Option<A>): Option<A> =>
      opt.orElse(ifNone);

  /**
   * `orElseWith: (() -> Option<A>) -> Option<A> -> Option<A>`
   *
   * ---
   * @param fn function that evaluates to the value to be returned if main `Option<A>` is `None`.
   * @param opt main `Option`.
   * @returns `this` `Option<A>` if it is `Some`. Otherwise returns result of `fn`.
   * @example
   * const a = Option.orElseWith(() => some(3))(some(10));
   * expect(a.value).toEqual(10);
   *
   * const b = Option.orElseWith(() => "hello")(none());
   * expect(b.value).toEqual("hello");
   */
  static orElseWith =
    <A>(oFn: () => Option<A>) =>
    (o: Option<A>): Option<A> =>
      o.orElseWith(oFn);

  /**
   * `zip: Option<A> -> Option<B> -> Option<A * B>`
   *
   * ---
   * @returns the tupled values of the two `Option`s if they are all `Some`, otherwise returns `None`.
   * @example
   * const a = Option.zip(some("hello"))(some("world"));
   * expect(a.value).toEqual(["hello", "world"]);
   *
   * const b = Option.zip(some(true))(none());
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  static zip =
    <A, B>(o1: Option<A>) =>
    (o2: Option<B>): Option<[A, B]> =>
      o1.zip(o2);

  /**
   * `zip3: Option<A> -> Option<B> -> Option<C> -> Option<A * B * C>`
   *
   * ---
   * @returns the tupled values of the three `Option`s if they are all `Some`, otherwise returns `None`.
   * @example
   * const a = Option.zip3(some("hello"))(some("world"))(some("!!!!"));
   * expect(a.value).toEqual(["hello", "world", "!!!"]);
   *
   * const b = Option.zip3(some(true))(none())(some(50));
   * expect(() => b.value).toThrow();
   * expect(b.isNone).toEqual(true);
   */
  static zip3 =
    <A, B, C>(o1: Option<A>) =>
    (o2: Option<B>) =>
    (o3: Option<C>): Option<[A, B, C]> =>
      o1.zip3(o2, o3);

  /**
   * `ofTruthy: A -> Option<A>`
   *
   * ---
   * @example
   * const a = Option.ofTruthy("bla");
   * expect(a.isSome).toEqual(true);
   * expect(a.value).toEqual("bla");
   *
   * const b = Option.ofTruthy("");
   * expect(b.isSome).toEqual(false);
   * expect(() => b.value).toThrow();
   */
  static ofTruthy = <A>(a: A): Option<NonNullable<A>> => (a ? some(a!) : none()) as Option<NonNullable<A>>;

  /**
   * `ofFalsy: A -> Option<A>`
   *
   * ---
   * @example
   * const a = Option.ofFalsy(0);
   * expect(a.isSome).toEqual(true);
   * expect(a.value).toEqual(0);
   *
   * const b = Option.ofFalsy(155);
   * expect(b.isSome).toEqual(false);
   * expect(() => b.value).toThrow();
   */
  static ofFalsy = <A>(a: A): Option<NonNullable<A>> => (!a ? option(a) : none()) as Option<NonNullable<A>>;

  /**
   * `any: Option<A> -> Option<B> -> boolean`
   *
   * ---
   * Given a pair of options, will return true if any of them are Some.
   * @example
   * const a = Option.any(some(1))(none());
   * expect(a).toEqual(true);
   *
   * const b = Option.any(none())(some(false));
   * expect(b).toEqual(true);
   *
   * const c = Option.any(none())(none());
   * expect(c).toEqual(false);
   */
  static any =
    <A, B>(o1: Option<A>) =>
    (o2: Option<B>): boolean =>
      o1.isSome || o2.isSome;

  /**
   * `ofResult: Result<A, B> -> Option<A>`
   *
   * ---
   * @example
   * const a = Option.ofResult(ok(5));
   * expect(a.isSome).toEqual(true);
   *
   * const b = Option.ofResult(err("oops"));
   * expect(b.isNone).toEqual(true);
   */
  static ofResult = <A, B>(r: Result<A, B>): Option<A> => (Result.isOk(r) ? option(r.value) : none());

  /**
   * `toResult: B -> Option<A> -> Result<A, B>`
   *
   * ---
   */
  static toResult =
    <A, B>(error: B) =>
    (o: Option<A>): Result<A, B> =>
      o.toResult(error);

  /**
   * `sequenceArray: Option<T>[] -> Option<T[]>`
   *
   * ---
   */
  static sequenceArray = <T>(ts: Option<T>[]): Option<T[]> => {
    let result = [];

    for (const t of ts) {
      if (t.isNone) {
        return none();
      }

      result.push(t.toArray());
    }

    return some(result.flat());
  };

  /**
   * `sequenceList: List<Option<T>> -> Option<List<T>>`
   *
   * ---
   */
  static sequenceList = <T>(ts: List<Option<T>>): Option<List<T>> => {
    let result = [];

    for (const t of ts) {
      if (t.isNone) {
        return none();
      }

      result.push(t.toArray());
    }

    return some(list(...result.flat()));
  };

  /**
   * `sequenceSeq: Seq<Option<T>> -> Option<Seq<T>>`
   *
   * ---
   */
  static sequenceSeq = <T>(ts: Seq<Option<T>>): Option<Seq<T>> => {
    let result = [];

    for (const t of ts.toList()) {
      if (t.isNone) {
        return none();
      }

      result.push(t.toArray());
    }

    return some(Seq.ofArray(result.flat()));
  };

  static ce = <A, B>(genFn: () => Generator<Option<A>, B, A>): Option<B> => {
    const iterator = genFn();
    let state = iterator.next();

    function run(state: IteratorYieldResult<Option<A>> | IteratorReturnResult<B>): Option<B> {
      if (state.done) {
        return option(state.value);
      }

      const { value } = state;
      return value.bind(val => run(iterator.next(val)));
    }

    return run(state);
  };
}

/**
 * `some: T -> Option<T>`
 *
 * ---
 * Creates a `Some` `Option<T>` from a value that is NOT null or undefined;
 * @example
 * const x = some(5);
 * expect(x.value).toEqual(5);
 */
export const some = Option.some;

/**
 * `none: () -> Option<T>`
 *
 * Creates a `None` `Option<T>` containing no value.
 * @example
 * const x = none();
 * expect(x.isNone).toEqual(true);
 */
export const none = Option.none;

/**
 * `option: T -> Option<T>`
 *
 * ---
 * Creates an Option<T> from a value T that may or may not be null or undefined.
 * @example
 * const x = option(5);
 * expect(x.value).toEqual(5);
 * expect(x.isSome).toEqual(true);
 *
 * const y = option(undefined);
 * expect(y.isNone).toEqual(true);
 */
export const option = Option.new;
