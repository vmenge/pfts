import { Async, async } from "./Async";
import { AsyncOption } from "./AsyncOption";
import { none, option, Option } from "./Option";
import { List } from "./List";
import { Result, ok } from "./Result";

const normalize = <T, B = never>(
  value: AsyncResult<T, B> | Async<Result<T, B>> | Async<T> | Result<T, B> | Promise<Result<T, B>> | Promise<T> | T
): AsyncResult<T, B> => {
  if (value instanceof AsyncResult) {
    return value;
  }

  if (value instanceof Async) {
    const res = value.map((x: Result<T, B> | T) => {
      if (x instanceof Result) {
        return x as Result<T, B>;
      }

      return ok(x) as Result<T, B>;
    });

    return new AsyncResult(res);
  }

  if (value instanceof Promise) {
    const res = value.then((x: Result<T, B> | T) => {
      if (x instanceof Result) {
        return x as Result<T, B>;
      }

      return ok(x) as Result<T, B>;
    });

    return new AsyncResult(async(res));
  }

  if (value instanceof Result) {
    return new AsyncResult(async(value));
  }

  return new AsyncResult(async(ok(value)));
};

export class AsyncResult<A, B> implements PromiseLike<Result<A, B>> {
  constructor(private readonly rawAsync: Async<Result<A, B>>) {}

  static ofAsync<A, B>(ar: Async<Result<A, B>>): AsyncResult<A, B> {
    return new AsyncResult(ar);
  }

  static ofPromise<A, B>(pr: Promise<Result<A, B>>): AsyncResult<A, B> {
    return new AsyncResult(async(pr));
  }

  static ofResult<A, B>(r: Result<A, B>) {
    return new AsyncResult(async(r));
  }

  then<TResult1 = Result<A, B>, TResult2 = never>(
    onfulfilled?: ((value: Result<A, B>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.rawAsync.then(onfulfilled, onrejected);
  }

  *[Symbol.iterator](): Generator<AsyncResult<A, B>, A, any> {
    return yield this;
  }

  get isOk(): Async<boolean> {
    return this.rawAsync.map(r => r.isOk);
  }

  get isErr(): Async<boolean> {
    return this.rawAsync.map(o => o.isErr);
  }

  get value(): Async<A> {
    return this.rawAsync.map(r => r.value);
  }

  get raw(): Async<A | B> {
    return this.rawAsync.map(r => r.raw);
  }

  /**
   * @returns the `Err` value contained inside the `AsyncResult<A, B>`.
   * @throws an Error if the `AsyncResult<A, B>` is `Ok`.
   */
  get err(): Async<B> {
    return this.rawAsync.map(r => r.err);
  }

  toAsync(): Async<Result<A, B>> {
    return this.rawAsync;
  }

  toPromise(): Promise<Result<A, B>> {
    return this.rawAsync.promise;
  }

  map<C>(fn: (a: A) => C): AsyncResult<C, B> {
    return new AsyncResult(this.rawAsync.map(r => r.map(fn)));
  }

  bind<C>(fn: (a: A) => AsyncResult<C, B>): AsyncResult<C, B>;
  bind<C>(fn: (a: A) => Async<Result<C, B>>): AsyncResult<C, B>;
  bind<C>(fn: (a: A) => Promise<Result<C, B>>): AsyncResult<C, B>;
  bind<C>(fn: (a: A) => AsyncResult<C, B> | Async<Result<C, B>> | Promise<Result<C, B>>): AsyncResult<C, B> {
    const res = this.rawAsync.bind(v => {
      const result = v.map(fn);

      if (result.isOk) {
        return normalize(result.value).rawAsync;
      }

      return result as any as Async<Result<C, B>>;
    });

    return new AsyncResult(res);
  }

  map2<C, D>(ar: AsyncResult<C, B>, fn: (a: A, c: C) => D): AsyncResult<D, B>;
  map2<C, D>(ar: Async<Result<C, B>>, fn: (a: A, c: C) => D): AsyncResult<D, B>;
  map2<C, D>(ar: Promise<Result<C, B>>, fn: (a: A, c: C) => D): AsyncResult<D, B>;
  map2<C, D>(
    ar: AsyncResult<C, B> | Async<Result<C, B>> | Promise<Result<C, B>>,
    fn: (a: A, c: C) => D
  ): AsyncResult<D, B> {
    const c = normalize(ar);

    return this.bind(a => c.map(c => fn(a, c)));
  }

  match<C>(someFn: (a: A) => C, errFn: (b: B) => C): Async<C> {
    return this.rawAsync.map(x => x.match(someFn, errFn));
  }

  matchAsync<C>(someFn: (a: A) => Async<C>, errFn: (b: B) => Async<C>): Async<C> {
    return this.rawAsync.bind(x => x.match(someFn, errFn));
  }

  iter(fn: (a: A) => void): Async<void> {
    return async(this.rawAsync.promise.then(x => x.iter(fn)));
  }

  mapErr<C>(fn: (b: B) => C): AsyncResult<A, C> {
    return normalize(this.rawAsync.map(x => x.mapErr(fn)));
  }

  tee(fn: (a: A) => void): AsyncResult<A, B> {
    return this.map(a => {
      fn(a);
      return a;
    });
  }

  defaultValue(a: A): Async<A> {
    return this.rawAsync.map(x => x.defaultValue(a));
  }

  defaultWith(fn: (b: B) => A): Async<A> {
    return this.rawAsync.map(x => x.defaultWith(fn));
  }

  defaultWithAsync(fn: (b: B) => Async<A>): Async<A>;
  defaultWithAsync(fn: (b: B) => Promise<A>): Async<A>;
  defaultWithAsync(fn: (b: B) => Async<A> | Promise<A>): Async<A> {
    return this.rawAsync.bind(x => {
      if (x.isOk) {
        return async(x.raw as A);
      }

      return Async.normalize(fn(x.raw as B));
    });
  }

  orElse(r: Result<A, B>): AsyncResult<A, B> {
    return normalize(this.rawAsync.map(x => x.orElse(r)));
  }

  orElseWith(fn: () => Result<A, B>): AsyncResult<A, B> {
    return normalize(this.rawAsync.map(x => x.orElseWith(fn)));
  }

  orElseWithAsync(fn: () => AsyncResult<A, B>): AsyncResult<A, B>;
  orElseWithAsync(fn: () => Async<Result<A, B>>): AsyncResult<A, B>;
  orElseWithAsync(fn: () => Promise<Result<A, B>>): AsyncResult<A, B>;
  orElseWithAsync(fn: () => AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): AsyncResult<A, B> {
    const res = this.rawAsync.bind(x => {
      if (x.isOk) {
        return async(x);
      }

      return normalize(fn()).toAsync();
    });

    return normalize(res);
  }

  toAsyncOption(): AsyncOption<A> {
    return new AsyncOption(this.rawAsync.map(x => x.toOption()));
  }

  zip<C>(b: AsyncResult<C, B>): AsyncResult<[A, C], B>;
  zip<C>(b: Async<Result<C, B>>): AsyncResult<[A, C], B>;
  zip<C>(b: Promise<Result<C, B>>): AsyncResult<[A, C], B>;
  zip<C>(b: AsyncResult<C, B> | Async<Result<C, B>> | Promise<Result<C, B>>): AsyncResult<[A, C], B> {
    return this.bind(a => normalize(b).map(b => [a, b]));
  }

  trace(msg?: string): AsyncResult<A, B> {
    return normalize(
      this.toAsync().map(x => {
        x.trace(msg);
        return x;
      })
    );
  }

  /**
   * `this: Asyncresult<A, B>`
   *
   * `to: (AsyncResult<A, B> -> C) -> C`
   *
   * ---
   * Pipes this current `AsyncOption` instance as an argument to the given function.
   * @example
   * const a = asyncResult("3").pipe(list);
   * expect(a).toBeInstanceOf(List);
   */
  to<C>(fn: (a: AsyncResult<A, B>) => C): C {
    return fn(this);
  }

  /**
   * `this: AsyncResult<A, B>`
   *
   * `ignore: () -> AsyncResult<void, B>`
   *
   * ---
   * Ignores the contents of the `AsyncResult`.
   */
  ignore(): AsyncResult<void, B> {
    return this.map(() => {});
  }

  static isOk = <A, B>(ar: AsyncResult<A, B> | Async<Result<A, B>>): Async<boolean> => normalize(ar).isOk;

  static isErr = <A, B>(ar: AsyncResult<A, B>): Async<boolean> => normalize(ar).isErr;

  static value = <A, B>(ar: AsyncResult<A, B> | Async<Result<A, B>>): Async<A> => normalize(ar).value;

  static map =
    <A, C>(fn: (a: A) => C) =>
    <B>(ar: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): AsyncResult<C, B> =>
      normalize(ar).map(fn);

  static map2 =
    <A, C, D>(fn: (a: A, c: C) => D) =>
    <B>(ar1: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>) =>
    (ar2: AsyncResult<C, B> | Async<Result<C, B>> | Promise<Result<C, B>>): AsyncResult<D, B> =>
      normalize(ar1).map2(normalize(ar2), fn);

  static bind =
    <A, B, C>(fn: (a: A) => AsyncResult<C, B>) =>
    (ar: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): AsyncResult<C, B> =>
      normalize(ar).bind(fn);

  static iter =
    <A>(fn: (a: A) => void) =>
    <B>(x: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): Async<void> =>
      normalize(x).iter(fn);

  static toAsyncOption = <A, B>(ar: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): AsyncOption<A> =>
    new AsyncOption(normalize(ar).rawAsync.map(x => x.toOption()));

  static ofAsyncOption =
    <B>(err: B) =>
    <A>(ao: AsyncOption<A>): AsyncResult<A, B> =>
      new AsyncResult(ao.toAsync().map(Result.ofOption(err)));

  static ce = <A, B, C>(
    genFn: () => Generator<AsyncResult<A, B> | Async<A> | Result<A, B>, C, A>
  ): AsyncResult<C, B> => {
    const iterator = genFn();
    let state = iterator.next();

    function run(
      state: IteratorYieldResult<AsyncResult<A, B> | Async<A> | Result<A, B>> | IteratorReturnResult<C>
    ): AsyncResult<C, B> {
      if (state.done) {
        return AsyncResult.ofResult(ok(state.value));
      }

      const { value } = state;
      return normalize(value).bind(val => run(iterator.next(val)));
    }

    return run(state);
  };

  static run<A, B>(fn: () => Async<Result<A, B>>): AsyncResult<A, B>;
  static run<A, B>(fn: () => Promise<Result<A, B>>): AsyncResult<A, B>;
  static run<A, B>(fn: () => Promise<Result<A, B>> | Async<Result<A, B>>): AsyncResult<A, B> {
    const x = fn();
    const y = x instanceof Promise ? async(x) : x;

    return new AsyncResult(y);
  }

  /**
   * `ignore: AsyncResult<A, B> -> AsyncResult<void, B>`
   *
   * ---
   * Ignores the contents of the `AsyncResult`.
   */
  static ignore = <A, B>(res: AsyncResult<A, B>): AsyncResult<void, B> => res.ignore();
}

export const asyncResult = <T, B = never>(
  val: AsyncResult<T, B> | Async<Result<T, B>> | Async<T> | Result<T, B> | Promise<Result<T, B>> | Promise<T> | T
) => normalize(val);
