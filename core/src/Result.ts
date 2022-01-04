import { id } from "./utils";
import { async, Async } from "./Async";
import { ResultCollector } from "./type-utils";
import { AsyncResult } from "./AsyncResult";
import { List, list } from "./List";
import { Option, none, option } from "./Option";
import { seq, Seq } from "./Seq";
import { AsyncOption } from "./AsyncOption";
import { asyncOption } from ".";

/**
 * A class that can contain an `Ok<A>` value or an `Err<B>` value.
 */
export class Result<A, B> {
  private constructor(private readonly _val: A | B, private readonly _isOk: boolean) {}

  /**
   * `ok: A -> Result<A, B>`
   *
   * ---
   * Creates an `Ok<A>` `Result<A, B>`.
   * @example
   * const x = Result.ok(3);
   *
   * expect(x).toBeInstanceOf(Result);
   * expect(x.value).toEqual(3);
   */
  static ok = <A, B = never>(a: A): Result<A, B> => new Result<A, B>(a, true) as any;

  /**
   * `err: B -> Result<A, B>`
   *
   * ---
   * Creates an `Err<B>` `Result<A, B>`.
   * @example
   * const x = Result.err("oops");
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

  *[Symbol.iterator](): Generator<Result<A, B>, A, any> {
    return yield this;
  }

  /**
   * `this: Result<A, B>`
   *
   * `map: (A -> C) -> Result<C, B>`
   *
   * ---
   * Evaluates the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in a `Result`.
   * @example
   * const x = ok(5).map(x => x * 2);
   * expect(x.value).toEqual(10);
   *
   * const y = err("oops").map(x => x * 2);
   * expect(() => y.value).toThrow();
   * expect(y.err).toEqual("oops");
   */
  map<C>(fn: (a: A) => C): Result<C, B> {
    if (this.isOk) {
      return ok(fn(this._val as A)!);
    }

    return this as any as Result<C, B>;
  }

  /**
   * `this: Result<A, B>`
   *
   * `bind: (A -> Result<C, B>) -> Result<C, B>`
   *
   * ---
   * Evaluates the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn binder function.
   * @returns The resulting value of the binder function.
   * @example
   * const x = ok(5).bind(x => ok(x * 2));
   * expect(x.value).toEqual(10);
   *
   * const y = err("oops").bind(x => ok(x * 2));
   * expect(() => y.value).toThrow();
   * expect(y.err).toEqual("oops");
   */
  bind<C>(fn: (a: A) => Result<C, B>): Result<C, B> {
    if (this.isOk) {
      return fn(this._val as A);
    }

    return this as any;
  }

  /**
   * `this: Result<A, B>`
   *
   * `apply: Result<A -> C, B> -> Result<C, B>`
   *
   * ---
   * Applies the function on this instance of Result if both are `Ok`.
   * @example
   * const fn = ok((x: number) => x * 2);
   * const res = ok(5).apply(fn);
   *
   * expect(res.value).toEqual(10);
   */
  apply<C>(fn: Result<(a: A) => C, B>): Result<C, B> {
    if (this.isOk) {
      if (fn.isOk) {
        return ok((fn.raw as (a: A) => C)(this.raw as A));
      }

      return fn as any;
    }
    return this as any;
  }

  /**
   * `this: Result<A, B>`
   *
   * `mapErr: (B -> C) -> Result<A, C>`
   *
   * ---
   * Evaluates the given function against the `Err` value of `Result<A, B>` if it is `Err`.
   * @param fn mapping function.
   * @returns The `Result` with it's `Err` value mapped.
   * @example
   * const x = err("err").mapErr(e => `${e}!!!`);
   * expect(() => x.value).toThrow();
   * expect(x.err).toEqual("err!!!");
   */
  mapErr<C>(fn: (b: B) => C): Result<A, C> {
    if (this.isErr) {
      return err(fn(this._val as B)!);
    }

    return this as any as Result<A, C>;
  }

  /**
   * `this: Result<A, B>`
   *
   * `iter: (A -> ()) -> ()`
   *
   * ---
   * Executes the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn a function that typically executes a side effect.
   * @example
   * ok("hello").iter(x => console.log(x)); // prints "hello"
   * err("oops").iter(x => console.log(x)); // doesn't print
   */
  iter(fn: (a: A) => void): void {
    if (this.isOk) {
      fn(this._val as A);
    }
  }

  /**
   * `this: Result<A, B>`
   *
   * `iterErr: (B -> ()) -> ()`
   *
   * ---
   * Executes the given function against the `Err` value of `Result<A, B>` if it is `Err`.
   * @param fn a function that typically executes a side effect.
   * @example
   * err("oops").iterErr(x => console.log(x)); // prints "oops"
   * ok("hello").iterErr(x => console.log(x)); // doesn't print
   */
  iterErr(fn: (b: B) => void): Result<A, B> {
    if (this.isErr) {
      fn(this._val as B);
    }

    return this;
  }

  /**
   * `this: Result<A, B>`
   *
   * `tee: (A -> ()) -> Result<A, B>`
   *
   * ---
   * Executes the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn a function that typically executes a side effect.
   * @returns the same `Result<A, B>` instance.
   * @example
   * const res = ok(5)
   *   .map(x => x * 2)
   *   .tee(x => console.log(`num is ${x}`)) // prints "num is 10"
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
   * `this: Result<A, B>`
   *
   * `teeErr: (B -> ()) -> Result<A, B>`
   *
   * ---
   * Executes the given function against the `Err` value of `Result<A, B>` if it is `Err`.
   * @param fn a function that typically executes a side effect.
   * @returns the same `Result<A, B>` instance.
   * @example
   * const res: Result<string, number> = err(5)
   *   .map(x => `something: ${x}`)
   *   .teeErr(x => console.log(`err is ${x}`)) // prints "num is 5"
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
   * `this: Result<A, B>`
   *
   * `trace: (string | undefined) -> ()`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `map2: (Result<C, B>, ((A, C) -> D)) -> Result<D, B>`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `map3: (Result<C, B>, Result<D, B>, ((A, C, D) -> E)) -> Result<E, B>`
   *
   * ---
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
          return ok(fn(this._val as A, r1._val as C, r2._val as D));
        }

        return r2 as any as Result<E, B>;
      }

      return r1 as any as Result<E, B>;
    }

    return this as any as Result<E, B>;
  }

  /**
   * `this: Result<A, B>`
   *
   * `toOption: () -> Option<A>`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `errToOption: () -> Option<B>`
   *
   * ---
   * @returns `Some<B>` if the `Result<A, B>` is `Err`. Otherwise returns `None`.
   * @example
   * const x = err("oops").errToOption();
   * expect(x.value).toEqual("oops");
   *
   * const y = ok(5).errToOption();
   * expect(y.isNone).toEqual(true);
   */
  errToOption(): Option<B> {
    if (this.isErr) {
      return option(this._val as B);
    }

    return none();
  }

  /**
   * `this: Result<A, B>`
   *
   * `toSeq: () -> Seq<A>`
   *
   * ---
   * @returns a `Seq<A>` with one element if the `Result<A, B>` is `Ok`. Otherwise returns an empty `Seq<A>`.
   * @example
   * const actual = ok(5).toSeq();
   * const expected = seq(5);
   * expect(actual.eq(expected)).toEqual(true);
   *
   * const x = err("oops").toSeq();
   * expect(x.isEmpty()).toEqual(true);
   */
  toSeq(): Seq<A> {
    if (this.isOk) {
      return seq(this._val as A);
    }

    return seq();
  }

  /**
   * `this: Result<A, B>`
   *
   * `toList: () -> List<A>`
   *
   * ---
   * @returns a `List<A>` with one element if the `Result<A, B>` is `Ok`. Otherwise returns an empty `List<A>`.
   * @example
   * const actual = ok(5).toList();
   * const expected = list(5);
   * expect(actual.eq(expected)).toEqual(true);
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
   * `this: Result<A, B>`
   *
   * `toArray: () -> A[]`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `errToList: () -> List<B>`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `errToArray: () -> B[]`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `defaultValue: A -> A`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `defaultWith: (() -> A) -> A`
   *
   * ---
   * @returns the `Ok` value contained in the `Result<A, B>` if it is `Ok`, otherwise returns the default value from the evaluated function passed as an argument.
   * @example
   * const x = ok(5).defaultWith(() => 10);
   * expect(x).toEqual(5);
   *
   * const y = err("oops").defaultWith(() => 60);
   * expect(y).toEqual(60);
   */
  defaultWith(fn: (b: B) => A): A {
    if (this.isOk) {
      return this._val as A;
    }

    return fn(this._val as B);
  }

  /**
   * `this: Result<A, B>`
   *
   * `orElse: Result<A, B> -> Result<A, B>`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `orElseWith: (() -> Result<A, B>) -> Result<A, B>`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `zip: Result<C, B> -> Result<A * C, B>`
   *
   * ---
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
   * expect(() => z.value).toThrow();
   * expect(z.err).toEqual("fatal");
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
   * `this: Result<A, B>`
   *
   * `zip3: (Result<C, B>, Result<D, B>) -> Result<A * C * D, B>`
   *
   * ---
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
   * `this: Result<A, B>`
   *
   * `match: ((A -> C), (B -> C)) -> C`
   *
   * ---
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

  /**
   * `this: Result<A, B>`
   *
   * `to: (Result<A, B> -> C) -> C`
   *
   * ---
   * Pipes this current `Result` instance as an argument to the given function.
   * @example
   * const a = ok("3").pipe(x => Number(x.value));
   * expect(a).toEqual(3);
   */
  to<C>(fn: (a: Result<A, B>) => C): C {
    return fn(this);
  }

  /**
   * `this: Result<A, B>`
   *
   * `toAsyncResult: () -> AsyncResult<A, B>`
   *
   * ---
   */
  toAsyncResult(): AsyncResult<A, B> {
    return AsyncResult.ofResult(this);
  }

  /**
   * `this: Result<A, B>`
   *
   * `toString: () -> string`
   *
   * ---
   * @example
   * const a = ok(5).toString();
   * expect(a).toEqual("5");
   *
   * const b = err("oops").toString();
   * expect(b).toEqual("oops");
   */
  toString(): string {
    return `${this._val}`;
  }

  /**
   * `this: Result<A, B>`
   *
   * `traverseOption: (A -> Option<C>) -> Option<Result<C, B>>`
   *
   * ---
   */
  traverseOption<C>(fn: (a: A) => Option<C>): Option<Result<C, B>> {
    if (this.isErr) {
      return option(err(this.raw as B));
    }

    return fn(this.raw as A).map(ok);
  }

  /**
   * `this: Result<A, B>`
   *
   * `traverseAsync: (A -> Async<C>) -> Async<Result<C, B>>`
   *
   * ---
   */
  traverseAsync<C>(fn: (a: A) => Async<C>): Async<Result<C, B>> {
    if (this.isErr) {
      return async(err(this.raw as B));
    }

    return fn(this.raw as A).map(ok);
  }

  /**
   * `this: Result<A, B>`
   *
   * `traversePromise: (A -> Promise<C>) -> Promise<Result<C, B>>`
   *
   * ---
   */
  traversePromise<C>(fn: (a: A) => Promise<C>): Promise<Result<C, B>> {
    if (this.isErr) {
      return Promise.resolve(err(this.raw as B));
    }

    return fn(this.raw as A).then(ok);
  }

  /**
   * `this: Result<A, B>`
   *
   * `traverseAsyncOption: (A -> AsyncOption<C>) -> AsyncOption<Result<C, B>>`
   *
   * ---
   */
  traverseAsyncOption<C>(fn: (a: A) => AsyncOption<C>): AsyncOption<Result<C, B>>;
  /**
   * `this: Result<A, B>`
   *
   * `traverseAsyncOption: (A -> Async<Option<C>>) -> AsyncOption<Result<C, B>>`
   *
   * ---
   */
  traverseAsyncOption<C>(fn: (a: A) => Async<Option<C>>): AsyncOption<Result<C, B>>;
  /**
   * `this: Result<A, B>`
   *
   * `traverseAsyncOption: (A -> Promise<Option<C>>) -> AsyncOption<Result<C, B>>`
   *
   * ---
   */
  traverseAsyncOption<C>(fn: (a: A) => Promise<Option<C>>): AsyncOption<Result<C, B>>;
  traverseAsyncOption<C>(
    fn: (a: A) => AsyncOption<C> | Async<Option<C>> | Promise<Option<C>>
  ): AsyncOption<Result<C, B>> {
    if (this.isErr) {
      return asyncOption(err(this.raw as B));
    }

    return asyncOption(fn(this.raw as A)).map(ok);
  }

  /**
   * `this: Result<A, B>`
   *
   * `traverseList: (A -> List<C>) -> List<Result<C, B>>`
   *
   * ---
   */
  traverseList<C>(fn: (a: A) => List<C>): List<Result<C, B>> {
    if (this.isErr) {
      return list(err(this.raw as B));
    }

    return fn(this.raw as A).map(ok);
  }

  /**
   * `this: Result<A, B>`
   *
   * `traverseArray: (A -> Array<C>) -> Array<Result<C, B>>`
   *
   * ---
   */
  traverseArray<C>(fn: (a: A) => Array<C>): Array<Result<C, B>> {
    if (this.isErr) {
      return [err(this.raw as B)];
    }

    return fn(this.raw as A).map(ok);
  }

  /**
   * `sequenceOption: Result<Option<A>, B> -> Option<Result<A, B>>`
   *
   * ---
   */
  static sequenceOption = <A, B>(ro: Result<Option<A>, B>): Option<Result<A, B>> => ro.traverseOption(id);

  /**
   * `sequenceAsync: Result<Async<A>, B> -> Async<Result<A, B>>`
   *
   * ---
   */
  static sequenceAsync = <A, B>(ro: Result<Async<A>, B>): Async<Result<A, B>> => ro.traverseAsync(id);

  /**
   * `sequencePromise: Result<Promise<A>, B> -> Promise<Result<A, B>>`
   *
   * ---
   */
  static sequencePromise = <A, B>(ro: Result<Promise<A>, B>): Promise<Result<A, B>> => ro.traversePromise(id);

  /**
   * `sequenceAsyncOption: Result<AsyncOption<A>, B> -> AsyncOption<Result<A, B>>`
   *
   * ---
   */
  static sequenceAsyncOption<A, B>(ao: Result<AsyncOption<A>, B>): AsyncOption<Result<A, B>>;
  /**
   * `sequenceAsyncOption: Result<Async<Option<A>>, B> -> AsyncOption<Result<A, B>>`
   *
   * ---
   */
  static sequenceAsyncOption<A, B>(ao: Result<Async<Option<A>>, B>): AsyncOption<Result<A, B>>;
  /**
   * `sequenceAsyncOption: Result<Promise<Option<A>>, B> -> AsyncOption<Result<A, B>>`
   *
   * ---
   */
  static sequenceAsyncOption<A, B>(ao: Result<Promise<Option<A>>, B>): AsyncOption<Result<A, B>>;
  static sequenceAsyncOption<A, B>(
    ao: Result<AsyncOption<A> | Async<Option<A>> | Promise<Option<A>>, B>
  ): AsyncOption<Result<A, B>> {
    return ao.traverseAsyncOption(x => x as any);
  }

  /**
   * `sequenceList: Result<List<A>, B> -> List<Result<A, B>>`
   *
   * ---
   */
  static sequenceList = <A, B>(ro: Result<List<A>, B>): List<Result<A, B>> => ro.traverseList(id);

  /**
   * `sequenceArray: Result<Array<A>, B> -> Array<Result<A, B>>`
   *
   * ---
   */
  static sequenceArray = <A, B>(ro: Result<Array<A>, B>): Array<Result<A, B>> => ro.traverseArray(id);

  /**
   * `isOk: Result<A, B> -> boolean`
   *
   * ---
   * @returns true if `Result<A, B>` is `Ok<A>`.
   * @example
   * const val: Result<number, string> = ok(5);
   * expect(Result.isOk(val)).toEqual(true);
   */
  static isOk = <A, B>(r: Result<A, B>): boolean => r.isOk;

  /**
   * `isErr: Result<A, B> -> boolean`
   *
   * ---
   * @returns true if `Result<A, B>` is `Err<B>`.
   * @example
   * const val: Result<number, string> = err("bla");
   * expect(Result.isErr(err)).toEqual(true);
   */
  static isErr = <A, B>(r: Result<A, B>): boolean => r.isErr;

  /**
   * `value: Result<A, B> -> A`
   *
   * ---
   * @returns the `Ok` value contained inside the `Result<A, B>`.
   * @throws an Error if the `Result<A, B>` is `Err`.
   * @example
   * const x = ok(3);
   * expect(Result.value(x)).toEqual(3);
   *
   * const y = err("oops");
   * expect(() => Result.value(y)).toThrow();
   */
  static value = <A, B>(r: Result<A, B>): A => r.value;

  /**
   * `map: (A -> C) -> Result<A, B> -> Result<C, B>`
   *
   *
   * ---
   * Evaluates the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn mapping function.
   * @param r `Result` to be mapped.
   * @returns The resulting value of the mapping function wrapped in a `Result`.
   * @example
   * const x = Result.map(x => x * 2)(ok(5));
   * expect(x.value).toEqual(10);
   *
   * const y = Result.map(x => x * 2)(err("oops"));
   * expect(() => y.value).toThrow();
   * expect(y.err).toEqual("oops");
   */
  static map =
    <A, C>(fn: (t: A) => C) =>
    <B>(r: Result<A, B>): Result<C, B> =>
      r.map(fn);

  /**
   * `bind: (A -> Result<C, B>) -> Result<A, B> -> Result<C, B>`
   *
   * ---
   * Evaluates the given function against the `Ok` value of `Result<A, B>` if it is `Ok`.
   * @param fn binder function.
   * @param r `Result` to execute the binder on.
   * @returns The resulting value of the binder function.
   * @example
   * const x = Result.bind(x => ok(x * 2))(ok(5));
   * expect(x.value).toEqual(10);
   *
   * const y = Result.bind(x => ok(x * 2))(err("oops"));
   * expect(() => y.value).toThrow();
   * expect(y.err).toEqual("oops");
   */
  static bind =
    <A, B, C>(fn: (t: A) => Result<C, B>) =>
    (r: Result<A, B>): Result<C, B> =>
      r.bind(fn);

  /**
   * `apply: Result<(A -> B), C> -> Result<A, C> -> Result<B, C>`
   *
   * ---
   */
  static apply =
    <A, B, C>(fn: Result<(a: A) => B, C>) =>
    (r: Result<A, C>): Result<B, C> =>
      r.apply(fn);

  /**
   * `mapErr: (B -> C) -> Result<A, B> -> Result<A, C>`
   *
   * ---
   * Evaluates the given function against the `Err` value of `Result<A, B>` if it is `Err`.
   * @param fn mapping function.
   * @param r `Result` to be mapped.
   * @returns The `Result` with it's `Err` value mapped.
   * @example
   * const x = Result.mapErr(e => `${e}!!!`)(err("err"));
   * expect(() => x.value).toThrow();
   * expect(x.err).toEqual("err!!!");
   */
  static mapErr =
    <B, C>(fn: (b: B) => C) =>
    <A>(r: Result<A, B>): Result<A, C> =>
      r.mapErr(fn);

  /**
   * `map2: (A, B) -> C) -> Result<A,D> -> Result<B, D> -> Result<C, B>`
   *
   * ---
   * Evaluates the given function against the `Ok` values of `Result<A, D>` and `Result<B, D>` if both are `Ok`.
   * @param fn mapping function.
   * @param r1 first `Result` value to be mapped.
   * @param r2 second `Result` value to be mapped.
   * @returns The resulting value of the mapping function wrapped in a `Result`.
   * @example
   * const x = Result.map2((x, y) => x + y)(ok(5))(ok(10));
   * expect(x.value).toEqual(15);
   *
   * const y = Result.map2((x, y) => x + y)(ok(100))(err("oops"));
   * expect(() => v.value).toThrow();
   * expect(y.err).toEqual("oops");
   */
  static map2 =
    <A, B, C>(fn: (a: A, b: B) => C) =>
    <D>(r1: Result<A, D>) =>
    (r2: Result<B, D>): Result<C, D> =>
      r1.map2(r2, fn);

  /**
   * `map3: (A, B, C) -> D) -> Result<A,E> -> Result<B, E> -> Result<C, E> -> Result<D, E>`
   *
   * ---
   * Evaluates the given function against the `Ok` values of `Result<A, D>` and `Result<B, D>` if both are `Ok`.
   * @param fn mapping function.
   * @param r1 first `Result` value to be mapped.
   * @param r2 second `Result` value to be mapped.
   * @param r3 third `Result` value to be mapped.
   * @returns The resulting value of the mapping function wrapped in a `Result`.
   * @example
   * const x = Result.map3((x, y, z) => x + y + z)(ok(5))(ok(10))(ok(100));
   * expect(x.value).toEqual(115);
   *
   * const y = Result.map3((x, y, z) => x + y + z)(ok(100))(err("oops"))(ok(99));
   * expect(() => v.value).toThrow();
   * expect(y.err).toEqual("oops");
   */
  static map3 =
    <A, B, C, D>(fn: (a: A, b: B, c: C) => D) =>
    <E>(r1: Result<A, E>) =>
    (r2: Result<B, E>) =>
    (r3: Result<C, E>): Result<D, E> =>
      r1.map3(r2, r3, fn);

  /**
   * `toOption: Result<A, B> -> Option<A>`
   *
   * ---
   * @returns `Some<A>` if the `Result<A, B>` is `Ok`. Otherwise returns `None`.
   * @example
   * const x = Result.toOption(ok(5));
   * expect(x.value).toEqual(5);
   *
   * const y = Result.toOption(err("oops"));
   * expect(y.isNone).toEqual(true);
   */
  static toOption = <A, B>(r: Result<A, B>): Option<A> => r.toOption();

  /**
   * `errToOption: Result<A, B> -> Option<B>`
   *
   * ---
   * @returns `Some<B>` if the `Result<A, B>` is `Err`. Otherwise returns `None`.
   * @example
   * const x = Result.errToOption(err("oops"));
   * expect(x.value).toEqual("oops");
   *
   * const y = Result.errToOption(ok(5));
   * expect(y.isNone).toEqual(true);
   */
  static errToOption = <A, B>(r: Result<A, B>): Option<B> => r.errToOption();

  /**
   * `ofOption: B -> Option<A> -> Result<A, B>`
   *
   * ---
   * @example
   * const a = Result.ofOption("oops")(some(1));
   * expect(a.isOk).toEqual(true);
   * expect(a.value).toEqual(1);
   *
   * const b = Result.ofOption("oops")(none());
   * expect(b.isErr).toEqual(true);
   * expect(b.err).toEqual("oops");
   */
  static ofOption =
    <B>(error: B) =>
    <A>(o: Option<A>): Result<A, B> =>
      o.isSome ? ok(o.value) : err(error);

  /**
   * `zip: Result<A, C> -> Result<B, C> -> Result<A * B, C>`
   *
   * ---
   * @param r1 first `Result` to zip.
   * @param r2 second `Result` to zip.
   * @returns the tupled values of the two `Result`s if they are all `Ok`, otherwise returns this `Err` or `r`'s `Err`.
   * @example
   * const x = Result.zip(ok("hello"))(ok(10));
   * expect(x.value).toEqual(["hello", 10]);
   *
   * const y = Result.zip(err("oops"))(err("oh no"));
   * expect(() => y.value).toThrow();
   * expect(y.err).toEqual("oops");
   *
   * const z = Result.zip(ok(1))(err("fatal"));
   * expect(() => z.value).toThrow();
   * expect(z.err).toEqual("fatal");
   */
  static zip =
    <A, C>(r1: Result<A, C>) =>
    <B>(r2: Result<B, C>): Result<[A, B], C> =>
      r1.zip(r2);

  /**
   * `zip3: Result<A, D> -> Result<B, D> -> Result<C, D> -> Result<A * B * C, D>`
   *
   * ---
   * @param r1 first `Result` to zip.
   * @param r2 second `Result` to zip.
   * @param r3 third `Result` to zip.
   * @returns the tupled values of the three `Result`s if they are all `Ok`, otherwise returns either this `Err`, `r1`'s `Err` or `r2`'s `Err`.
   * @example
   * const x = Result.zip3(ok("hello"))(ok(10))(ok(true));
   * expect(x.value).toEqual(["hello", 10, true]);
   *
   * const y = Result.zip(ok(66))(err("oh no"))(ok(99));
   * expect(() => y.value).toThrow();
   * expect(y.err).toEqual("oh no");
   */
  static zip3 =
    <A, D>(r1: Result<A, D>) =>
    <B>(r2: Result<B, D>) =>
    <C>(r3: Result<C, D>): Result<[A, B, C], D> =>
      r1.zip3(r2, r3);

  /**
   * `flatten: Result<Result<A, B>, B> -> Result<A, B>`
   *
   * ---
   * Flattens a nested `Result<A, B>`.
   * @example
   * const a = ok(ok(3));
   * const b = Result.flatten(a);
   * expect(b.value).toEqual(3);
   */
  static flatten = <A, B>(r: Result<Result<A, B>, B>): Result<A, B> => r.bind(x => x);

  static ce = <A, B, C>(genFn: () => Generator<Result<A, B>, C, A>): Result<C, B> => {
    const iterator = genFn();
    let state = iterator.next();

    function run(state: IteratorYieldResult<Result<A, B>> | IteratorReturnResult<C>): Result<C, B> {
      if (state.done) {
        return ok(state.value);
      }

      const { value } = state;
      return value.bind(val => run(iterator.next(val)));
    }

    return run(state);
  };

  static hoard<A, B, Err, Return = Result<[A, B], List<Err>>>(rs: ResultCollector<[A, B], Err>): Return;
  static hoard<A, B, C, Err, Return = Result<[A, B, C], List<Err>>>(rs: ResultCollector<[A, B, C], Err>): Return;
  static hoard<A, B, C, D, Err, Return = Result<[A, B, C, D], List<Err>>>(
    rs: ResultCollector<[A, B, C, D], Err>
  ): Return;
  static hoard<A, B, C, D, E, Err, Return = Result<[A, B, C, D, E], List<Err>>>(
    rs: ResultCollector<[A, B, C, D, E], Err>
  ): Return;
  static hoard<A, B, C, D, E, F, Err, Return = Result<[A, B, C, D, E, F], List<Err>>>(
    rs: ResultCollector<[A, B, C, D, E, F], Err>
  ): Return;
  static hoard<A, B, C, D, E, F, G, Err, Return = Result<[A, B, C, D, E, F, G], List<Err>>>(
    rs: ResultCollector<[A, B, C, D, E, F, G], Err>
  ): Return;
  static hoard<A, B, C, D, E, F, G, H, Err, Return = Result<[A, B, C, D, E, F, G, H], List<Err>>>(
    rs: ResultCollector<[A, B, C, D, E, F, G, H], Err>
  ): Return;
  static hoard<A, B, C, D, E, F, G, H, I, Err, Return = Result<[A, B, C, D, E, F, G, H, I], List<Err>>>(
    rs: ResultCollector<[A, B, C, D, E, F, G, H, I], Err>
  ): Return;
  static hoard<A, B, C, D, E, F, G, H, I, J, Err, Return = Result<[A, B, C, D, E, F, G, H, I, J], List<Err>>>(
    rs: ResultCollector<[A, B, C, D, E, F, G, H, I, J], Err>
  ): Return;
  static hoard<T, Err, Return = Result<T[], List<Err>>>(rs: Result<T, Err>[]): Return;
  static hoard<T extends any[], Err, Return = Result<T, List<Err>>>(rs: Result<any, Err>[]): Return;
  static hoard<T extends any[], Err, Return = Result<T, List<Err>>>(rs: Result<any, Err>[]): Return {
    const [okVals, errVals] = List.ofArray(rs).partition(x => (x as any).isOk);

    if (errVals.isEmpty) {
      return ok(okVals.toArray().flatMap(x => (x as any).toArray() as any[])) as any;
    }

    return err(errVals.flatMap(x => (x as any).errToList())) as any;
  }

  static collect = <T extends Record<string, Result<any, Err>>, Err, K extends keyof T>(
    results: T
  ): Result<{ [k in K]: T[k]["value"] }, List<T[K]["err"]>> => {
    const entries = List.ofArray(Object.entries(results));
    const [okEntries, errEntries] = entries.partition(([_, val]) => val.isOk);

    if (errEntries.isEmpty) {
      return ok(okEntries.fold((obj, [key, val]) => ({ ...obj, [key]: val.value }), {})) as any;
    }

    return err(errEntries.map(([_, val]) => val.raw));
  };
}

/**
 * `ok: A -> Result<A, B>`
 *
 * ---
 * Creates an `Ok<A>` `Result<A, B>`.
 * @example
 * const x = ok(3);
 *
 * expect(x).toBeInstanceOf(Result);
 * expect(x.value).toEqual(3);
 */
export const ok = Result.ok;

/**
 * `err: B -> Result<A, B>`
 *
 * ---
 * Creates an `Err<B>` `Result<A, B>`.
 * @example
 * const x = err("oops");
 *
 * expect(x).toBeInstanceOf(Result);
 * expect(x.err).toEqual("oops");
 */
export const err = Result.err;
