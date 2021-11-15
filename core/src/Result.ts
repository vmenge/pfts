import { async } from "./Async";
import { AsyncResult } from "./AsyncResult";
import { List, list } from "./List";
import { Option, some, none, option } from "./Option";
import { Flatten } from "./type-utils";

export class Result<A, B> {
  private constructor(private readonly _val: A | B, private readonly _isOk: boolean) {}

  static ok = <A, B = never>(a: A): Result<A, B> => new Result<A, B>(a, true) as any;
  static err = <A = never, B = never>(b: B): Result<A, B> => new Result<A, B>(b, false) as any;

  get isOk(): boolean {
    return this._isOk;
  }

  get isErr(): boolean {
    return !this._isOk;
  }

  get value(): A {
    if (this.isErr) {
      throw new Error("Could not extract value from Result.");
    }

    return this._val as A;
  }

  get raw(): A | B {
    return this._val;
  }

  get err(): B {
    if (this.isOk) {
      throw new Error("Could not extract error from Result.");
    }

    return this._val as B;
  }

  map<C>(fn: (a: A) => C): Result<C, B> {
    if (this.isOk) {
      return ok(fn(this._val as A)!);
    }

    return this as any as Result<C, B>;
  }

  bind<C>(fn: (a: A) => Result<C, B>): Result<C, B> {
    if (this.isOk) {
      return fn(this._val as A);
    }

    return this as any as Result<C, B>;
  }

  mapErr<C>(fn: (b: B) => C): Result<A, C> {
    if (this.isErr) {
      return err(fn(this._val as B)!);
    }

    return this as any as Result<A, C>;
  }

  iter(fn: (a: A) => void): void {
    if (this.isOk) {
      fn(this._val as A);
    }
  }

  tee(fn: (a: A) => void): Result<A, B> {
    if (this.isOk) {
      fn(this._val as A);
    }

    return this;
  }

  teeError(fn: (b: B) => void): Result<A, B> {
    if (this.isErr) {
      fn(this._val as B);
    }

    return this;
  }

  trace(msg?: string): Result<A, B> {
    const logStr = msg ? `${msg} ${this}` : `${this}`;
    console.log(logStr);

    return this;
  }

  map2<C, D>(r: Result<C, B>, fn: (a: A, c: C) => D): Result<D, B> {
    if (this.isOk) {
      if (r.isOk) {
        return ok(fn(this._val as A, r._val as C));
      }

      return r as any as Result<D, B>;
    }

    return this as any as Result<D, B>;
  }

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

  toOption(): Option<A> {
    if (this.isOk) {
      return option(this._val as A);
    }

    return none();
  }

  okToList(): List<A> {
    if (this.isOk) {
      return list(this._val as A);
    }

    return list();
  }

  okToArray(): A[] {
    if (this.isOk) {
      return [this._val as A];
    }

    return [];
  }

  errToList(): List<B> {
    if (this.isErr) {
      return list(this._val as B);
    }

    return list();
  }

  errToArray(): B[] {
    if (this.isErr) {
      return [this._val as B];
    }

    return [];
  }

  defaultValue(a: A): A {
    if (this.isOk) {
      return this._val as A;
    }

    return a;
  }

  defaultWith(fn: () => A): A {
    if (this.isOk) {
      return this._val as A;
    }

    return fn();
  }

  orElse(r: Result<A, B>): Result<A, B> {
    if (this.isErr) {
      return r;
    }

    return this;
  }

  orElseWith(fn: () => Result<A, B>): Result<A, B> {
    if (this.isErr) {
      return fn();
    }

    return this;
  }

  zip<C>(r: Result<C, B>): Result<[A, C], B> {
    if (this.isOk) {
      if (r.isOk) {
        return ok([this._val as A, r._val as C] as [A, C]);
      }

      return r as any as Result<[A, C], B>;
    }

    return this as any as Result<[A, C], B>;
  }

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

  and<C, T extends [A, C]>(v: Result<C, B>): Result<Flatten<T>, B> {
    return this.zip(v).map(x => x.flat() as Flatten<T>);
  }

  andWith<C, T extends [A, C]>(fn: (a: A) => Result<C, B>): Result<Flatten<T>, B> {
    if (this.isOk) {
      const res = fn(this._val as A);
      return this.zip(res).map(x => x.flat() as Flatten<T>);
    }

    return this as any as Result<Flatten<T>, B>;
  }

  match<C>(okFn: (a: A) => C, errFn: (b: B) => C): C {
    if (this.isOk) {
      return okFn(this._val as A);
    }

    return errFn(this._val as B);
  }

  toAsync(): AsyncResult<A, B> {
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

  static ce = <A, B>() => new ResultComputation(ok<A, B>({} as any as A));
}

export const ok = Result.ok;
export const err = Result.err;

class ResultComputation<A extends Object, B> {
  constructor(private readonly ctx: Result<A, B>) {}

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

  public do(fn: (ctx: A) => void): ResultComputation<A, B> {
    this.ctx.iter(fn);

    return new ResultComputation(this.ctx as any);
  }

  public return<T>(fn: (ctx: A) => T): Result<T, B> {
    return Result.map(fn)(this.ctx) as Result<T, B>;
  }

  public ignore(): Result<void, B> {
    return Result.map(() => {})(this.ctx) as Result<void, B>;
  }
}
