import { async } from "./Async";
import { AsyncResult } from "./AsyncResult";
import { List, list } from "./List";
import { Option, some, none, option } from "./Option";
import { Flatten } from "./type-utils";

/**
 * A class that can contain an `Ok<A>` value or an `Err<B>` value.
 */
export class Result<A, B> {
  private constructor(private readonly _val: A | B, private readonly _isOk: boolean) {}

  /**
   * `A -> Result<A, B>`
   *
   * Creates an `Ok<A>` `Result<A, B>`.
   * @example
   * const x = ok(3);
   *
   * expect(x).toBeInstanceOf(Result);
   * expect(x.value).toEqual(3);
   */
  static ok = <A, B = never>(a: A): Result<A, B> => new Result<A, B>(a, true) as any;

  /**
   * `B -> Result<A, B>`
   *
   * Creates an `Err<B>` `Result<A, B>`.
   * @example
   * const x = err("oops");
   *
   * expect(x).toBeInstanceOf(Result);
   * expect(x.err).toEqual("oops");
   */
  static err = <A = never, B = never>(b: B): Result<A, B> => new Result<A, B>(b, false) as any;

  /**
   * @returns true if `Result<A, B>` is `Ok<A>`.
   * @example
   * const val: Result<number, string> = ok(5);
   * expect(val.isOk).toEqual(true);
   */
  get isOk(): boolean {
    return this._isOk;
  }

  /**
   * @returns true if `Result<A, B>` is `Err<B>`.
   * @example
   * const val: Result<number, string> = err("bla");
   * expect(val.isErr).toEqual(true);
   */
  get isErr(): boolean {
    return !this._isOk;
  }

  /**
   * @returns the `Ok` value contained inside the `Result<A, B>`.
   * @throws an Error if the `Result<A, B>` is `Err`.
   * @example
   * const x = ok(3);
   * expect(x.value).toEqual(3);
   *
   * const y = err("oops");
   * expect(() => y.value).toThrow();
   */
  get value(): A {
    if (this.isErr) {
      throw new Error("Could not extract value from Result.");
    }

    return this._val as A;
  }

  /**
   * @returns the raw value contained inside the `Result<A, B>`.
   * @example
   * const x: Result<number, string> = ok(5);
   * const a: number | string = x.raw;
   * expect(a).toEqual(5);
   *
   * const y: Result<number, string> = err("oops");
   * const b: number | string = y.raw;
   * expect(b).toEqual("oops");
   */
  get raw(): A | B {
    return this._val;
  }

  /**
   * @returns the `Err` value contained inside the `Result<A, B>`.
   * @throws an Error if the `Result<A, B>` is `Ok`.
   * @example
   * const x = err("oops");
   * expect(x.err).toEqual("oops");
   *
   * const y = ok(5);
   * expect (() => y.err).toThrow();
   */
  get err(): B {
    if (this.isOk) {
      throw new Error("Could not extract error from Result.");
    }

    return this._val as B;
  }

  /**
   * `(A -> C) -> Result<C, B>`
   *
   * Evaluates the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in a `Result`.
   * @example
   * const x = ok(5).map(x => x * 2);
   * expect(x.value).toEqual(10);
   *
   * const y = err("oops").map(x => x * 2);
   * expect(() => x.value).toThrow();
   * expect(x.err).toEqual("oops");
   */
  map<C>(fn: (a: A) => C): Result<C, B> {
    if (this.isOk) {
      return ok(fn(this._val as A)!);
    }

    return this as any as Result<C, B>;
  }

  /**
   * `(A -> Result<C, B>) -> Result<C, B>`
   *
   * Evaluates the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn binder function.
   * @returns The resulting value of the binder function.
   */
  bind<C>(fn: (a: A) => Result<C, B>): Result<C, B> {
    if (this.isOk) {
      return fn(this._val as A);
    }

    return this as any as Result<C, B>;
  }

  /**
   * `(B -> C) -> Result<A, C>`
   *
   * Evaluates the given function against the `Err` value of `Result<A, B>` if it is `Err`.
   * @param fn mapping function.
   * @returns The `Result` with it's `Err` value mapped.
   */
  mapErr<C>(fn: (b: B) => C): Result<A, C> {
    if (this.isErr) {
      return err(fn(this._val as B)!);
    }

    return this as any as Result<A, C>;
  }

  /**
   * `(A -> ()) -> ()`
   *
   * Executes the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn a function that typically executes a side effect.
   */
  iter(fn: (a: A) => void): void {
    if (this.isOk) {
      fn(this._val as A);
    }
  }

  /**
   * `(A -> ()) -> Result<A, B>`
   *
   * Executes the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn a function that typically executes a side effect.
   * @returns the same `Result<A, B>` instance.
   * @example
   * const res = ok(5)
   *   .map(x => x * 2)
   *   .tee(x => console.log(`num is ${x}`)) // prints 'num is 10'
   *   .map(x => x + 1);
   *
   * expect(res.value).toEqual(11);
   */
  tee(fn: (a: A) => void): Result<A, B> {
    if (this.isOk) {
      fn(this._val as A);
    }

    return this;
  }

  /**
   * `(B -> ()) -> Result<A, B>`
   *
   * Executes the given function against the `Err` value of `Result<A, B>` if it is `Err`.
   * @param fn a function that typically executes a side effect.
   * @returns the same `Result<A, B>` instance.
   * @example
   * const res: Result<string, number> = err(5)
   *   .map(x => `something: ${x}`)
   *   .teeErr(x => console.log(`err is ${x}`)) // prints 'num is 5'
   *   .mapErr(x => x + 1);
   *
   * expect(res.err).toEqual(6);
   */
  teeErr(fn: (b: B) => void): Result<A, B> {
    if (this.isErr) {
      fn(this._val as B);
    }

    return this;
  }

  /**
   * `(string | undefined) -> ()`
   *
   * Logs the current value of the `Result<A, B>`.
   * @param msg optional message to prepend to the value.
   * @example
   * ok(5).trace(); // prints "5"
   * err("oops").trace("result:") // prints "result: oops"
   */
  trace(msg?: string): Result<A, B> {
    const logStr = msg ? `${msg} ${this}` : `${this}`;
    console.log(logStr);

    return this;
  }

  /**
   * `(Result<C, B>, ((A, C) -> D)) -> Result<D, B>`
   *
   * Evaluates the given function against the `Ok` values of `Result<A, B>` and `Result<C, B>` if both are `Ok`.
   * @param r the second `Result` value to also be mapped.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in a `Result`.
   * @example
   * const x = ok(5).map2(ok(10), (x, y) => x + y);
   * expect(x.value).toEqual(15);
   *
   * const y = ok(100).map2(err("oops"), (x, y) => x + y);
   * expect(() => v.value).toThrow();
   * expect(y.err).toEqual("oops");
   */
  map2<C, D>(r: Result<C, B>, fn: (a: A, c: C) => D): Result<D, B> {
    if (this.isOk) {
      if (r.isOk) {
        return ok(fn(this._val as A, r._val as C));
      }

      return r as any as Result<D, B>;
    }

    return this as any as Result<D, B>;
  }

  /**
   * `(Result<C, B>, Result<D, B>, ((A, C, D) -> E)) -> Result<E, B>`
   *
   * Evaluates the given function against the `Ok` values of `Result<A, B>`, `Result<C, B>` and `Result<D, B>` if all are `Ok`.
   * @param r1 the second `Result` value to also be mapped.
   * @param r2 the third `Result` value to also be mapped.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in a `Result`.
   * @example
   * const x = ok(5).map2(ok(10), ok(100), (x, y, z) => x + y + z);
   * expect(x.value).toEqual(115);
   *
   * const y = ok(100).map2(err("oops"), ok(90), (x, y, z) => x + y + z);
   * expect(() => v.value).toThrow();
   * expect(y.err).toEqual("oops");
   */
  map3<C, D, E>(r1: Result<C, B>, r2: Result<D, B>, fn: (a: A, b: C, d: D) => E): Result<E, B> {
    if (this.isOk) {
      if (r1.isOk) {
        if (r2.isOk) {
          fn(this._val as A, r1._val as C, r2._val as D);
        }

        return r2 as any as Result<E, B>;
      }

      return r1 as any as Result<E, B>;
    }

    return this as any as Result<E, B>;
  }

  /**
   * `() -> Option<A>`
   *
   * @returns `Some<A>` if the `Result<A, B>` is `Ok`. Otherwise returns `None`.
   * @example
   * const x = ok(5).toOption();
   * expect(x.value).toEqual(5);
   *
   * const y = err("oops").toOption();
   * expect(y.isNone).toEqual(true);
   */
  toOption(): Option<A> {
    if (this.isOk) {
      return option(this._val as A);
    }

    return none();
  }

  /**
   * `() -> List<A>`
   *
   * @returns a `List<A>` with one element if the `Result<A, B>` is `Ok`. Otherwise returns an empty `List<A>`.
   * @example
   * const actual = ok(5).toList();
   * const expected = list(5);
   * expect(actual.equals(expected))
   *
   * const x = err("oops").toList();
   * expect(x.isEmpty).toEqual(true);
   */
  toList(): List<A> {
    if (this.isOk) {
      return list(this._val as A);
    }

    return list();
  }

  /**
   * `() -> A[]`
   *
   * @returns a `A[]` with one element if the `Result<A, B>` is `Ok`. Otherwise returns an empty `A[]`.
   * @example
   * const x = ok(5).toArray();
   * expect(x).toEqual([5]);
   *
   * const y = err("oops").toArray();
   * expect(y.length).toEqual(0);
   */
  toArray(): A[] {
    if (this.isOk) {
      return [this._val as A];
    }

    return [];
  }

  /**
   * `() -> List<B>`
   *
   * @returns a `List<B>` with one element if the `Result<A, B>` is `Err`. Otherwise returns an empty `List<B>`.
   * @example
   * const actual = err("oops").errToList();
   * const expected = list("oops");
   * expect(actual.equals(expected))
   *
   * const x = ok(4).errToList();
   * expect(x.isEmpty).toEqual(true);
   */
  errToList(): List<B> {
    if (this.isErr) {
      return list(this._val as B);
    }

    return list();
  }

  /**
   * `() -> B[]`
   *
   * @returns a `B[]` with one element if the `Result<A, B>` is `Err`. Otherwise returns an empty `B[]`.
   * @example
   * const x = err("oops").errToArray();
   * expect(x).toEqual(["oops"])
   *
   * const y = ok(4).errToArray();
   * expect(y.length).toEqual(0);
   */
  errToArray(): B[] {
    if (this.isErr) {
      return [this._val as B];
    }

    return [];
  }

  /**
   * `A -> A`
   *
   * @returns the `Ok` value contained in the `Result<A, B>` if it is `Ok`, otherwise returns the default value passed as an argument.
   * @example
   * const x = ok(5).defaultValue(10);
   * expect(x).toEqual(5);
   *
   * const y = err("oops").defaultValue(60);
   * expect(y).toEqual(60);
   */
  defaultValue(a: A): A {
    if (this.isOk) {
      return this._val as A;
    }

    return a;
  }

  /**
   * `(() -> A) -> A`
   *
   * @returns the `Ok` value contained in the `Result<A, B>` if it is `Ok`, otherwise returns the default value from the evaluated function passed as an argument.
   * @example
   * const x = ok(5).defaultWith(() => 10);
   * expect(x).toEqual(5);
   *
   * const y = err("oops").defaultWith(() => 60);
   * expect(y).toEqual(60);
   */
  defaultWith(fn: () => A): A {
    if (this.isOk) {
      return this._val as A;
    }

    return fn();
  }

  /**
   * `Result<A, B> -> Result<A, B>`
   *
   * @param ifErr value to be returned if this instance of `Result<A, B>` is `Err`.
   * @returns this `Result<A, B>` if it is `Ok`. Otherwise returns `ifErr`.
   * @example
   * const x = err("oops").orElse(ok(5));
   * expect(x.value).toEqual(5);
   *
   * const y = ok(10).orElse(ok(90));
   * expect(y.value).toEqual(10);
   */
  orElse(ifErr: Result<A, B>): Result<A, B> {
    if (this.isErr) {
      return ifErr;
    }

    return this;
  }

  /**
   * `(() -> Result<A, B>) -> Result<A, B>`
   *
   * @param fn function that evaluates to the value to be returned if this instance of `Result<A, B>` is `Err`.
   * @returns this `Result<A, B>` if it is `Ok`. Otherwise returns result of `fn`.
   * @example
   * const x = err("oops").orElseWith(() => ok(5));
   * expect(x.value).toEqual(5);
   *
   * const y = ok(10).orElseWith(() => ok(90));
   * expect(y.value).toEqual(10);
   */
  orElseWith(fn: () => Result<A, B>): Result<A, B> {
    if (this.isErr) {
      return fn();
    }

    return this;
  }

  /**
   * `Result<C, B> -> Result<A * C, B>`
   *
   * @param r `Result` to zip with this one.
   * @returns the tupled values of the two `Result`s if they are all `Ok`, otherwise returns this `Err` or `r`'s `Err`.
   * @example
   * const x = ok("hello").zip(ok(10));
   * expect(x.value).toEqual(["hello", 10]);
   *
   * const y = err("oops").zip(err("oh no"));
   * expect(() => y.value).toThrow();
   * expect(y.err).toEqual("oops");
   *
   * const z = ok(1).zip(err("fatal"));
   * expect(() => y.value).toThrow();
   * expect(y.err).toEqual("fatal");
   */
  zip<C>(r: Result<C, B>): Result<[A, C], B> {
    if (this.isOk) {
      if (r.isOk) {
        return ok([this._val as A, r._val as C] as [A, C]);
      }

      return r as any as Result<[A, C], B>;
    }

    return this as any as Result<[A, C], B>;
  }

  /**
   * `(Result<C, B>, Result<D, B>) -> Result<A * C * D, B>`
   *
   * @param r1 first `Result` to zip with this one.
   * @param r2 second `Result` to zip with this one.
   * @returns the tupled values of the three `Result`s if they are all `Ok`, otherwise returns either this `Err`, `r1`'s `Err` or `r2`'s `Err`.
   * @example
   * const x = ok("hello").zip3(ok(10), ok(true));
   * expect(x.value).toEqual(["hello", 10, true]);
   *
   * const y = ok(66).zip(err("oh no"), ok(99));
   * expect(() => y.value).toThrow();
   * expect(y.err).toEqual("oh no");
   */
  zip3<C, D>(r1: Result<C, B>, r2: Result<D, B>): Result<[A, C, D], B> {
    if (this.isOk) {
      if (r1.isOk) {
        if (r2.isOk) {
          return ok([this._val as A, r1._val as C, r2._val as D]);
        }

        return r2 as any as Result<[A, C, D], B>;
      }

      return r1 as any as Result<[A, C, D], B>;
    }

    return this as any as Result<[A, C, D], B>;
  }

  /**
   * `((A -> C), B -> C) -> C`
   *
   * @param okFn function to be executed if `Result<A, B>` is `Ok`.
   * @param errFn function to be executed if `Result<A, B>` is `Err`.
   * @returns the result of `okFn` or `errFn`.
   */
  match<C>(okFn: (a: A) => C, errFn: (b: B) => C): C {
    if (this.isOk) {
      return okFn(this._val as A);
    }

    return errFn(this._val as B);
  }

  toAsyncResult(): AsyncResult<A, B> {
    return AsyncResult.ofResult(this);
  }

  toString(): string {
    return `${this._val}`;
  }

  static isOk = <A, B>(r: Result<A, B>) => r.isOk;

  static isErr = <A, B>(r: Result<A, B>) => r.isErr;

  /**
   * Tries to extract a value from a result.
   * @throws Error if Result is not Ok.
   */
  static value = <A, B>(r: Result<A, B>) => r.value;

  static map =
    <A, B, C>(fn: (t: A) => C) =>
    (r: Result<A, B>): Result<C, B> =>
      r.map(fn);

  static bind =
    <A, B, C>(fn: (t: A) => Result<C, B>) =>
    (r: Result<A, B>): Result<C, B> =>
      r.bind(fn);

  static apply =
    <A, B, C>(fn: Result<(a: A) => B, C>) =>
    (r: Result<A, C>): Result<B, C> =>
      Result.bind<(a: A) => B, C, B>(f => Result.bind<A, C, B>(x => ok(f(x)))(r))(fn);

  static mapErr =
    <A, B, C>(fn: (b: B) => C) =>
    (r: Result<A, B>): Result<A, C> =>
      r.mapErr(fn);

  static map2 =
    <A, B, C, Err>(fn: (a: A, b: B) => C) =>
    (r1: Result<A, Err>) =>
    (r2: Result<B, Err>): Result<C, Err> =>
      r1.map2(r2, fn);

  static map3 =
    <A, B, C, D, Err>(fn: (a: A, b: B, c: C) => D) =>
    (r1: Result<A, Err>) =>
    (r2: Result<B, Err>) =>
    (r3: Result<C, Err>): Result<D, Err> =>
      r1.map3(r2, r3, fn);

  static toOption = <A, B>(r: Result<A, B>): Option<A> => r.toOption();

  static ofOption =
    <A, B>(error: B) =>
    (o: Option<A>): Result<A, B> =>
      o.isSome ? ok(o.value) : err(error);

  static zip =
    <A, B, C>(r1: Result<A, C>) =>
    (r2: Result<B, C>): Result<[A, B], C> =>
      r1.zip(r2);

  static zip3 =
    <A, B, C, D>(r1: Result<A, D>) =>
    (r2: Result<B, D>) =>
    (r3: Result<C, D>): Result<[A, B, C], D> =>
      r1.zip3(r2, r3);

  static sequenceArray = <A, B>(rs: Result<A, B>[]): Result<A[], B> =>
    rs.reduce((state, curr) => state.map2(curr, (x, y) => [...x, y]), ok<A[], B>([]));

  static sequenceList = <A, B>(rs: List<Result<A, B>>): Result<List<A>, B> =>
    rs.fold((state, curr) => state.map2(curr, (x, y) => list(...x, y)), ok<List<A>, B>(list()));

  /**
   * Initiates a Result Computation.
   * @example
   * const res =
   *   Result.ce()
   *     .let('x', ok(5))
   *     .let('y', () => ok(10))
   *     .return(({ x, y }) => x + y);
   *
   * expect(res.value).toEqual(15);
   */
  static ce = <A, B>() => new ResultComputation(ok<A, B>({} as any as A));
}

export const ok = Result.ok;
export const err = Result.err;

class ResultComputation<A extends Object, B> {
  constructor(private readonly ctx: Result<A, B>) {}

  /**
   * Assigns a value to a variable inside the computation's scope.
   * @example
   * const res =
   *   Result.ce()
   *     .let('x', ok(5))
   *     .let('y', () => ok(10))
   *     .return(({ x, y }) => x + y);
   *
   * expect(res.value).toEqual(15);
   */
  public let<K extends string, T>(
    k: K,
    other: ((ctx: A) => Result<T, B>) | Result<T, B>
  ): ResultComputation<A & { [k in K]: T }, B> {
    const value = Result.bind((ctx: A) => {
      if (typeof other === "function") {
        const r = (other as Function)(ctx);

        if (r instanceof Result) {
          return r;
        }

        return ok(r);
      }

      if (other instanceof Result) {
        return other;
      }

      return ok(other);
    })(this.ctx);
    const ctx = Result.map2((ctx: A, val: T) => ({ ...ctx, [k.toString()]: val }))(this.ctx)(value);

    return new ResultComputation(ctx as any);
  }

  /**
   * Executes and awaits a side-effectful operation.
   * @example
   * const res =
   *   Result.ce()
   *     .let('x', ok(5))
   *     .do(({ x }) => console.log(x))
   *     .return(({ x }) => x);
   *
   * expect(res.value).toEqual(5);
   */
  public do(fn: (ctx: A) => void): ResultComputation<A, B> {
    this.ctx.iter(fn);

    return new ResultComputation(this.ctx as any);
  }

  /**
   * Returns a value from the computation expression.
   * @example
   * const res =
   *   Result.ce()
   *     .let('x', ok(5))
   *     .let('y', () => ok(10))
   *     .return(({ x, y }) => x + y);
   *
   * expect(res.value).toEqual(15);
   */
  public return<T>(fn: (ctx: A) => T): Result<T, B> {
    return Result.map(fn)(this.ctx) as Result<T, B>;
  }

  /**
   * Ignores the value from the computation expression.
   * @example
   * const res: Result<void> =
   *   Result.ce()
   *     .let('a' => ok(3))
   *     .do(({ a }) => console.log(a))
   *     .ignore();
   */
  public ignore(): Result<void, B> {
    return Result.map(() => {})(this.ctx) as Result<void, B>;
  }
}
