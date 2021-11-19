import { async } from "./Async";
import { AsyncOption } from "./AsyncOption";
import { list, List } from "./List";
import { pipe, Pipe } from "./pipe";
import { err, ok, Result } from "./Result";
import { Seq, seq } from "./Seq";
import { Flatten } from "./type-utils";

/**
 * A class that can represent the presence (`Some<A>`) or abscence (`None`) of a value.
 */
export class Option<A> {
  private constructor(private readonly _value?: A) {}

  /**
   * `T -> Option<T>`
   *
   * Creates an Option<T> from a value T that may or may not be null or undefined.
   */
  static create = <T>(value?: T): Option<NonNullable<T>> => new Option(value) as Option<NonNullable<T>>;

  /**
   * `T -> Option<T>`
   *
   * Creates a `Some` `Option<T>` from a value that is NOT null or undefined;
   */
  static some = <T>(value: NonNullable<T>): Option<T> => new Option(value);

  /**
   * `() -> Option<T>`
   *
   * Creates a `None` `Option<T>` containing no value.
   */
  static none = <T>(): Option<NonNullable<T>> => new Option<NonNullable<T>>();

  /**
   * @returns the value contained inside the `Option<A>`.
   * @throws an Error if the `Option<A>` is `None`.
   */
  get value(): A {
    if (this._value === undefined) {
      throw new Error("Could not extract value from Option.");
    }

    return this._value;
  }

  /**
   * @returns the raw value contained inside the `Option<A>`.
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

  /**
   * `(A -> B) -> Option<B>`
   *
   * Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   */
  map<B>(fn: (a: A) => B): Option<B> {
    if (this.isSome) {
      return option(fn(this._value!));
    }

    return none();
  }

  /**
   * `(Option<B>, ((A, B) -> C)) -> Option<C>`
   *
   * Given an `Option<B>`, evaluates the given function against the values of `Option<A>` and `Option<B>` if both are `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   */
  map2<B, C>(b: Option<B>, fn: (a: A, b: B) => C): Option<C> {
    if (this.isSome && b.isSome) {
      return option(fn(this._value!, b._value!));
    }

    return none();
  }

  /**
   * `(Option<B>, Option<C>, ((A, B, C) -> D)) -> Option<D>`
   *
   * Given an `Option<B>` and  an `Option<C>`, evaluates the given function against the values of `Option<A>`, `Option<B>` and `Option<C>` if all are `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   */
  map3<B, C, D>(b: Option<B>, c: Option<C>, fn: (a: A, b: B, c: C) => D): Option<D> {
    if (this.isSome && b.isSome && c.isSome) {
      return option(fn(this._value!, b._value!, c._value!));
    }

    return none();
  }

  /**
   * `(A -> Option<B>) -> Option<B>`
   *
   * Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.
   * @param fn a binder function.
   * @returns The resulting value of the binder function.
   */
  bind<B>(fn: (a: A) => Option<B>): Option<B> {
    if (this.isSome) {
      return fn(this._value!);
    }

    return none();
  }

  /**
   * `A -> boolean`
   *
   * Checks if the `Option<A>` contains the given value.
   * @returns true if the `Option` contains the value.
   */
  contains(value: A): boolean {
    return this._value === value;
  }

  /**
   * `(A -> boolean) -> boolean`
   *
   * If the `Option` is `Some`, evaluates the predicate and returns its result, otherwise returns false.
   */
  exists(predicate: (a: A) => boolean): boolean {
    return this.isSome && predicate(this._value!);
  }

  /**
   * `(A -> boolean) -> boolean`
   *
   * Runs a predicate against the value `A` contained inside the `Option<A>` if it is `Some`.
   * @returns `Some<A>` if the predicate returns `true`, otherwise `None`.
   */
  filter(predicate: (a: A) => boolean): Option<A> {
    return this.isSome && predicate(this._value!) ? some(this._value!) : none();
  }

  /**
   * `(((State, A) -> State), State) -> State`
   *
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
   * `(A -> ()) -> ()`
   *
   * Executes the given function against the value contained in the `Option<A>` if it is `Some`.
   * @param fn a function that typically executes a side effect.
   */
  iter(fn: (a: A) => void): void {
    if (this.isSome) {
      fn(this._value!);
    }
  }

  /**
   * `(A -> ()) -> Option<A>`
   *
   * Executes the given function against the value contained in the `Option<A>` if it is `Some`.
   * @param fn a function that typically executes a side effect.
   * @returns the same `Option<A>` instance.
   */
  tee(fn: (a: A) => void): Option<A> {
    if (this.isSome) {
      fn(this._value!);
    }

    return this;
  }

  /**
   * `(string | undefined) -> Option<A>`
   *
   * Logs the current value from the `Option<A>` to the console.
   * @returns `Option<A>` unmodified.
   */
  trace(msg?: string): Option<A> {
    const logStr = msg ? `${msg} ${this}` : `${this}`;
    console.log(logStr);

    return this;
  }

  /**
   * `A -> A`
   *
   * @returns the value contained in the `Option<A>` if it is `Some`, otherwise returns the default value passed as an argument.
   */
  defaultValue(value: A): A {
    if (this.isNone) {
      return value;
    }

    return this._value!;
  }

  /**
   * `(() -> A) -> A`
   *
   * @returns the value contained in the `Option<A>` if it is `Some`, otherwise returns the default value from the evaluated function passed as an argument.
   */
  defaultWith(fn: () => A): A {
    if (this.isNone) {
      return fn();
    }

    return this._value!;
  }

  /**
   * `() -> A[]`
   *
   * @returns an `Array<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Array<A>`.
   */
  toArray(): A[] {
    if (this.isNone) {
      return [];
    }

    return [this._value!];
  }

  /**
   * `() -> List<A>`
   *
   * @returns a `List<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `List<A>`.
   */
  toList(): List<A> {
    if (this.isNone) {
      return list();
    }

    return list(this._value!);
  }

  /**
   * `() -> Seq<A>`
   *
   * @returns a `Seq<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Seq<A>`.
   */
  toSeq(): Seq<A> {
    if (this.isNone) {
      return seq();
    }

    return seq(this._value!);
  }

  /**
   * `Option<A> -> Option<A>`
   *
   * @param ifNone value to be returned if this instance of `Option<A>` is `None`.
   * @returns this `Option<A>` if it is `Some`. Otherwise returns `ifNone`.
   */
  orElse(ifNone: Option<A>): Option<A> {
    if (this.isNone) {
      return ifNone;
    }

    return this;
  }

  /**
   * `(() -> Option<A>) -> Option<A>`
   *
   * @param fn function that evaluates to the value to be returned if this instance of `Option<A>` is `None`.
   * @returns this `Option<A>` if it is `Some`. Otherwise returns result of `fn`.
   */
  orElseWith(fn: () => Option<A>): Option<A> {
    if (this.isNone) {
      return fn();
    }

    return this;
  }

  /**
   * `Option<B> -> Option<A * B>`
   *
   * @returns the tupled values of the two `Option`s if they are all `Some`, otherwise returns `None`.
   */
  zip<B>(o: Option<B>): Option<[A, B]> {
    if (o.isSome && this.isSome) {
      return some([this._value!, o._value!]);
    }

    return none();
  }

  /**
   * `(Option<B>, Option<C>) -> Option<A * B * C>`
   *
   * @returns the tupled values of the three `Option`s if they are all `Some`, otherwise returns `None`.
   */
  zip3<B, C>(o1: Option<B>, o2: Option<C>): Option<[A, B, C]> {
    if ((this.isSome, o1.isSome, o2.isSome)) {
      return some([this._value!, o1._value!, o2._value!]);
    }

    return none();
  }

  /**
   * `B -> Result<A, B>`
   *
   * @returns a `Result<A, B>` from this `Option<A>`. The `Result` will be `Ok<A>` if the `Option` is `Some`. Otherwise the `Result` will be `Err<B>`.
   */
  toResult<B>(error: B): Result<A, B> {
    if (this.isNone) {
      return err(error);
    }

    return ok(this._value!);
  }

  /**
   * `((A -> B), () -> B) -> B`
   *
   * @param someFn function to be executed if `Option<A>` is `Some`.
   * @param noneFn function to be executed if `Option<B>` is `None`.
   * @returns the result of `someFn` or `noneFn`.
   */
  match<B>(someFn: (a: A) => B, noneFn: () => B): B {
    if (this.isSome) {
      return someFn(this._value!);
    }

    return noneFn();
  }

  /**
   * `() -> AsyncOption<A>`
   */
  toAsyncOption(): AsyncOption<A> {
    return new AsyncOption(async(this));
  }

  /**
   * `() -> string`
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
   * `(Option<A> -> B) -> B`
   *
   * Takes an function to be executed in this current `Option` instance, facilitating function chaining.
   */
  pipe<B>(fn: (a: Option<A>) => B): B {
    return fn(this);
  }

  /**
   * `() -> Pipe<Option<A>>`
   *
   * Wraps this current `Option` instance in a `Pipe`.
   */
  toPipe(): Pipe<Option<A>> {
    return pipe(this);
  }

  /**
   * `Option<T> -> T`
   *
   * @returns the value contained inside the `Option<T>`.
   * @throws an Error if the `Option<T>` is `None`.
   */
  static value = <T>(o: Option<T>) => o.value;

  /**
   * `Option<T> -> T | undefined`
   *
   * @returns the raw value contained inside the `Option<T>`.
   */
  static raw = <T>(o: Option<T>) => o.raw;

  /**
   * `(A -> B) -> Option<A> -> Option<B>`
   *
   * Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   */
  static map =
    <A, B>(fn: (a: A) => B) =>
    (o: Option<A>): Option<B> =>
      o.map(fn);

  /**
   * `((A, B) -> C)) -> Option<A> -> Option<B> -> Option<C>`
   *
   * Given an `Optoin<A>` and `Option<B>`, evaluates the given function against their values if both are `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   */
  static map2 =
    <A, B, C>(fn: (a: A, b: B) => C) =>
    (o1: Option<A>) =>
    (o2: Option<B>): Option<C> =>
      o1.map2(o2, fn);

  /**
   * `((A, B, C) -> D) -> Option<A> -> Option<B> -> Option<C> -> Option<D>`
   *
   * Given an `Option<A>`, `Option<B>` and  an `Option<C>`, evaluates the given function against their values if all are `Some`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Option`.
   */
  static map3 =
    <A, B, C, D>(fn: (a: A, b: B, c: C) => D) =>
    (o1: Option<A>) =>
    (o2: Option<B>) =>
    (o3: Option<C>): Option<D> =>
      o1.map3(o2, o3, fn);

  /**
   * `(A -> Option<B>) -> Option<A> -> Option<B>`
   *
   * Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.
   * @param fn a binder function.
   * @returns The resulting value of the binder function.
   */
  static bind =
    <A, B>(fn: (a: A) => Option<B>) =>
    (o: Option<A>): Option<B> =>
      o.bind(fn);

  static apply =
    <A, B>(fn: Option<(a: A) => B>) =>
    (o: Option<A>): Option<B> =>
      Option.bind<(a: A) => B, B>(f => Option.bind<A, B>(x => option(f(x)))(o))(fn);

  /**
   * `A -> Option<A> -> boolean`
   *
   * Checks if the `Option<A>` contains the given value.
   * @returns true if the `Option` contains the value.
   */
  static contains =
    <A>(value: A) =>
    (o: Option<A>): boolean =>
      o.contains(value);

  /**
   * `(A -> boolean) -> Option<A> -> boolean`
   *
   * If the `Option` is `Some`, evaluates the predicate and returns its result, otherwise returns false.
   */
  static exists =
    <A>(predicate: (a: A) => boolean) =>
    (o: Option<A>): boolean =>
      o.exists(predicate);

  /**
   * `(A -> boolean) -> Option<A> -> boolean`
   *
   * Runs a predicate against the value `A` contained inside the `Option<A>` if it is `Some`.
   * @returns `Some<A>` if the predicate returns `true`, otherwise `None`.
   */
  static filter =
    <A>(predicate: (a: A) => boolean) =>
    (o: Option<A>): Option<A> =>
      o.filter(predicate);

  /**
   * `Option<Option<A>> -> Option<A>`
   *
   * Flattens a nested `Option<A>`.
   */
  static flatten = <A>(o: Option<Option<A>>): Option<A> => o.bind(x => x);

  /**
   * `((State, A) -> State) -> State -> Option<A> -> State`
   *
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
   * `(A -> ()) -> Option<A> -> ()`
   */
  static iter =
    <A>(fn: (a: A) => void) =>
    (o: Option<A>): void =>
      o.iter(fn);

  /**
   * `A -> Option<A> -> A`
   *
   * @returns the value contained by the `Option<A>` if it is `Some`, otherwise returns the default value passed as an argument.
   */
  static defaultValue =
    <A>(value: A) =>
    (o: Option<A>): A =>
      o.defaultValue(value);

  /**
   * `Option<A> -> A[]`
   *
   * @returns an `Array<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Array<A>`.
   */
  static toArray = <A>(o: Option<A>): Array<A> => o.toArray();

  /**
   * `Option<A> -> List<A>`
   *
   * @returns a `List<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `List<A>`.
   */
  static toList = <A>(o: Option<A>): List<A> => o.toList();

  /**
   * `Option<A> -> Seq<A>`
   *
   * @returns a `Seq<A>` that contains exactly one element `A` if `Option<A>` is `Some`. Otherwise returns an empty `Seq<A>`.
   */
  static toSeq = <A>(o: Option<A>): Seq<A> => o.toSeq();

  /**
   * `Option<A> -> Option<A> -> Option<A>`
   *
   * @param ifNone value to be returned if the main `Option<A>` is `None`.
   * @param opt main `Option`.
   * @returns `Option<A>` if it is `Some`. Otherwise returns `ifNone`.
   */
  static orElse =
    <A>(ifNone: Option<A>) =>
    (opt: Option<A>): Option<A> =>
      opt.orElse(ifNone);

  /**
   * `(() -> Option<A>) -> Option<A> -> Option<A>`
   *
   * @param fn function that evaluates to the value to be returned if main `Option<A>` is `None`.
   * @param opt main `Option`.
   * @returns `this` `Option<A>` if it is `Some`. Otherwise returns result of `fn`.
   */
  static orElseWith =
    <A>(oFn: () => Option<A>) =>
    (o: Option<A>): Option<A> =>
      o.orElseWith(oFn);

  /**
   * `Option<A> -> Option<B> -> Option<A * B>`
   *
   * @returns the tupled values of the two `Option`s if they are all `Some`, otherwise returns `None`.
   */
  static zip =
    <A, B>(o1: Option<A>) =>
    (o2: Option<B>): Option<[A, B]> =>
      o1.zip(o2);

  /**
   * `Option<A> -> Option<B> -> Option<C> -> Option<A * B * C>`
   *
   * @returns the tupled values of the three `Option`s if they are all `Some`, otherwise returns `None`.
   */
  static zip3 =
    <A, B, C>(o1: Option<A>) =>
    (o2: Option<B>) =>
    (o3: Option<C>): Option<[A, B, C]> =>
      o1.zip3(o2, o3);

  static ofTruthy = <A>(a: A) => (a ? some(a!) : none());
  static ofFalsy = <A>(a: A) => (!a ? option(a) : none());

  /**
   * `Option<A> -> Option<B> -> boolean`
   *
   * Given a pair of options, will return true if any of them are Some.
   */
  static any =
    <A, B>(o1: Option<A>) =>
    (o2: Option<B>): boolean =>
      o1.isSome || o2.isSome;

  /**
   * `Result<A, B> -> Option<A>`
   */
  static ofResult = <A, B>(r: Result<A, B>): Option<A> => (Result.isOk(r) ? option(r.value) : none());

  /**
   * `B -> Option<A> -> Result<A, B>`
   */
  static toResult =
    <A, B>(error: B) =>
    (o: Option<A>): Result<A, B> =>
      o.toResult(error);

  /**
   * `Option<T>[] -> Option<T[]>`
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
   * `List<Option<T>> -> Option<List<T>>`
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
   * `Seq<Option<T>> -> Option<Seq<T>>`
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

  /**
   * Initiates a Option Computation.
   * @example
   * const res =
   *   Option.ce()
   *     .let('x', some(5))
   *     .let('y', () => some(10))
   *     .return(({ x, y }) => x + y);
   *
   * expect(res.value).toEqual(15);
   */
  static ce = () => new OptionComputation(some({}));
}

/**
 * `T -> Option<T>`
 *
 * Creates a `Some` `Option<T>` from a value that is NOT null or undefined;
 */
export const some = Option.some;

/**
 * `() -> Option<T>`
 *
 * Creates a `None` `Option<T>` containing no value.
 */
export const none = Option.none;

/**
 * `T -> Option<T>`
 *
 * Creates an Option<T> from a value T that may or may not be null or undefined.
 */
export const option = Option.create;

class OptionComputation<A extends Object> {
  constructor(private readonly ctx: Option<A>) {}

  /**
   * Assigns a value to a variable inside the computation's scope.
   * @example
   * const res =
   *   Option.ce()
   *     .let('x', some(5))
   *     .let('y', () => some(10))
   *     .return(({ x, y }) => x + y);
   *
   * expect(res.value).toEqual(15);
   */
  public let<K extends string, T>(
    k: K,
    other: Option<T> | ((ctx: A) => Option<T>)
  ): OptionComputation<A & { [k in K]: T }> {
    const value = Option.bind((ctx: A) => (typeof other === "object" ? other : other(ctx)))(this.ctx);
    const ctx = Option.map2((ctx: A, val: T) => ({ ...ctx, [k.toString()]: val }))(this.ctx)(value);

    return new OptionComputation(ctx as any);
  }

  /**
   * Executes and awaits a side-effectful operation.
   * @example
   * const res =
   *   Option.ce()
   *     .let('x', some(5))
   *     .do(({ x }) => console.log(x))
   *     .return(({ x }) => x);
   *
   * expect(res.value).toEqual(5);
   */
  public do(fn: (ctx: A) => void): OptionComputation<A> {
    this.ctx.iter(fn);

    return new OptionComputation(this.ctx as any);
  }

  /**
   * Returns a value from the computation expression.
   * @example
   * const res =
   *   Option.ce()
   *     .let('x', some(5))
   *     .let('y', () => some(10))
   *     .return(({ x, y }) => x + y);
   *
   * expect(res.value).toEqual(15);
   */
  public return<T>(fn: (ctx: A) => T): Option<T> {
    return Option.map(fn)(this.ctx);
  }

  /**
   * Ignores the value from the computation expression.
   * @example
   * const res: Option<void> =
   *   Option.ce()
   *     .let('a' => some(3))
   *     .do(({ a }) => console.log(a))
   *     .ignore();
   */
  public ignore(): Option<void> {
    return Option.map(() => {})(this.ctx);
  }
}
