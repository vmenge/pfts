import { none, option, Option } from "./Option";
import { list, List } from "./List";
import { err, ok, Result } from "./Result";
import { Flatten, NonVoid } from "./type-utils";

/**
 * `Async<A>` represents a single operation that does not return a value immediately that usually executes asynchronously.
 * If successful, upon completion the `Async<A>` object will contain the value of type `A`.
 *
 * It is essentially a wrapper for a `Promise<A>` with helper methods.
 */
export class Async<A> {
  /**
   * The inner `Promise<A>` containing the asynchronous operation.
   */
  public readonly promise: Promise<A>;

  private constructor(value: A | Promise<A>) {
    if (value instanceof Promise) {
      this.promise = value;
    }

    this.promise = Promise.resolve(value);
  }

  /**
   * `(A | Promise<A>) -> Async<A>`
   *
   * Creates an `Async<A>` from a type `A` or a `Promise<A>`.
   */
  static create = <A>(a: A | Promise<A>): Async<A> => new Async(a);

  /**
   * `Promise<A> -> Async<A>`
   *
   * Creates an `Async<A>` from a `Promise<A>`.
   */
  static ofPromise = <A>(a: Promise<A>): Async<A> => new Async(a);

  /**
   * `() -> Promise<A>`
   *
   * @returns the inner promise from the `Async<A>`.
   */
  toPromise(): Promise<A> {
    return this.promise;
  }

  /**
   * `(A -> B) -> Async<B>`
   *
   * Evaluates the given function against the result of `Async<A>`once the asynchronous operation is completed.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Async`.
   */
  map<B>(fn: (a: A) => B): Async<B> {
    return async(this.promise.then(fn));
  }

  /**
   * `(Async<B>, ((A, B) -> C)) -> Async<C>`
   *
   * Given another `Async` value, evaluates the given function against the result of `Async<A>` and `Async<B>` once both operations are completed.
   * @param b a second `Async` value that must also be evaluated.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Async`.
   */
  map2<B, C>(b: Async<B>, fn: (a: A, b: B) => C): Async<C>;
  /**
   * `(Promise<B>, ((A, B) -> C)) -> Async<C>`
   *
   * Given a `Promise<B>`, evaluates the given function against the result of `Async<A>` and `Promise<B>` once both operations are completed.
   * @param b a `Promise` value that must also be evaluated.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Async`.
   */
  map2<B, C>(b: Promise<B>, fn: (a: A, b: B) => C): Async<C>;
  map2<B, C>(b: Async<B> | Promise<B>, fn: (a: A, b: B) => C): Async<C> {
    const x = b instanceof Promise ? b : b.promise;

    const result = Promise.all([this.promise, x]).then(res => fn(res[0], res[1]));

    return async(result);
  }

  /**
   * `(A -> Async<B>) -> Async<B>`
   *
   * Evaluates the given function against the result of `Async<A>` once the asynchronous operation is completed.
   * @param fn a binder function.
   * @returns The resulting value of the binder function.
   */
  bind<B>(fn: (a: A) => Async<B>): Async<B>;
  /**
   * `(A -> Promise<B>) -> Async<B>`
   *
   * Evaluates the given function against the result of `Async<A>` once the asynchronous operation is completed.
   * @param fn a binder function.
   * @returns The resulting value of the binder function.
   */
  bind<B>(fn: (a: A) => Promise<B>): Async<B>;
  bind<B>(fn: (a: A) => Async<B> | Promise<B>): Async<B> {
    const result = this.promise.then(a => {
      const res = fn(a);

      return res instanceof Async ? res.promise : res;
    });

    return async(result);
  }

  /**
   * `(A -> ()) -> Async<()>`
   *
   * Executes the given function against the result of `Async<A>` once the asynchronous operation is completed.
   * @param fn a function that typically executes a side effect.
   * @returns an 'empty' `Async`.
   */
  iter(fn: (a: A) => void): Async<void> {
    return async(this.promise.then(fn));
  }

  /**
   * `(A -> ()) -> Async<A>`
   *
   * Executes the given function against the result of `Async<A>` once the asynchronous operation is completed.
   * @param fn a function that typically executes a side effect.
   * @returns the same `Async<A>` instance.
   */
  tee(fn: (a: A) => void): Async<A> {
    return this.map(a => {
      fn(a);
      return a;
    });
  }

  /**
   * `Async<B> -> Async<A * B>`
   *
   * @returns the tupled result of the two asynchronous operations wrapped in a `Async` instance.
   */
  zip<B>(b: Async<B>): Async<[A, B]>;
  /**
   * `Promise<B> -> Async<A * B>`
   *
   * @returns the tupled result of the two asynchronous operations wrapped in a `Async` instance.
   */
  zip<B>(b: Promise<B>): Async<[A, B]>;
  zip<B>(b: Async<B> | Promise<B>): Async<[A, B]> {
    return this.bind(a => Async.normalize(b).map(b => [a, b]));
  }

  /**
   * `(Async<B>, Async<C>) -> Async<A * B * C>`
   *
   * @returns the tupled result of the three asynchronous operations wrapped in a `Async` instance.
   */
  zip3<B, C>(b: Async<B>, c: Async<C>): Async<[A, B, C]> {
    return this.bind(a => b.bind(b => c.map(c => [a, b, c])));
  }

  /**
   * `Async<C> -> Async<A1 * A2 * B1 * B2 ... * C>`
   *
   * Appends / tuples the given asynchronous value to to the tuple or value wrapped in an `Async`.
   * @example
   * const x = async(5)
   *             .and(async("victor"))
   *             .and(async(false));
   *
   * expect(x).toEqual(async([5, "victor", false]))
   */
  and<C, T extends [A, C]>(v: Async<C>): Async<Flatten<T>>;
  /**
   * `Promise<C> -> Async<A1 * A2 * B1 * B2 ... * C>`
   *
   * Appends / tuples the given asynchronous value to to the tuple wrapped in an `Async`.
   * @example
   * const x = async(5)
   *             .and(async("victor"))
   *             .and(async(false));
   *
   * expect(x).toEqual(async([5, "victor", false]))
   */
  and<C, T extends [A, C]>(v: Promise<C>): Async<Flatten<T>>;
  and<C, T extends [A, C]>(v: Async<C> | Promise<C>): Async<Flatten<T>> {
    return this.zip(Async.normalize(v)).map(x => x.flat() as Flatten<T>);
  }

  /**
   * `(A1 * A2 * B1 * B2 ... -> Async<C>) -> Async<A1 * A2 * B1 * B2 ... * C>`
   *
   * Appends / tuples the asynchronous value from the evaluated function to the tuple wrapped in an `Async`.
   * @example
   * const x = async(5)
   *             .andWith(x => async(x + 10))
   *             .andWith(([x, y]) => async(x + y));
   *
   * expect(x).toEqual(async([5, 15, 20]))
   */
  andWith<C, T extends [A, C]>(fn: (a: A) => Async<NonVoid<C>>): Async<Flatten<T>>;
  /**
   * `(A1 * A2 * B1 * B2 ... -> Promise<C>) -> Async<A1 * A2 * B1 * B2 ... * C>`
   *
   * Appends / tuples the asynchronous value from the evaluated function to the tuple wrapped in an `Async`.
   * @example
   * const x = async(5)
   *             .andWith(x => async(x + 10))
   *             .andWith(([x, y]) => async(x + y));
   *
   * expect(x).toEqual(async([5, 15, 20]))
   */
  andWith<C, T extends [A, C]>(fn: (a: A) => Promise<NonVoid<C>>): Async<Flatten<T>>;
  andWith<C, T extends [A, C]>(fn: (a: A) => Async<NonVoid<C>> | Promise<NonVoid<C>>): Async<Flatten<T>> {
    const res = this.bind(x => Async.normalize(fn(x)));

    return this.zip(res).map(x => x.flat() as Flatten<T>);
  }

  /**
   * `(Async<A> | Promise<A>) -> Async<A>`
   *
   * Given an `Async<A>` or `Promise<A>` value, always returns an `Async<A>`.
   */
  static normalize = <A>(a: Async<A> | Promise<A>): Async<A> => (a instanceof Async ? a : async(a));

  /**
   * `(A -> B) -> Async<A> -> Async<B>`
   */
  static map =
    <A, B>(fn: (a: A) => B) =>
    (a: Async<A> | Promise<A>): Async<B> =>
      Async.normalize(a).map(fn);

  /**
   * `((A, B) -> C) -> Async<A> -> Async<B> -> Async<C>`
   */
  static map2 =
    <A, B, C>(fn: (a: A, b: B) => C) =>
    (a1: Async<A> | Promise<A>) =>
    (a2: Async<B> | Promise<B>): Async<C> =>
      Async.normalize(a1).map2(Async.normalize(a2), fn);

  /**
   * `(A -> Async<B>) -> Async<A> -> Async<B>`
   */
  static bind =
    <A, B>(fn: (a: A) => Async<B> | Promise<B>) =>
    (x: Async<A> | Promise<A>): Async<B> =>
      Async.normalize(x).bind(y => Async.normalize(fn(y)));

  /**
   * `(A -> ()) -> Async<()>`
   */
  static iter =
    <A>(fn: (a: A) => void) =>
    (x: Async<A> | Promise<A>): Async<void> =>
      Async.normalize(x).iter(fn);

  /**
   * `Async<A>[] -> Async<A[]>`
   */
  static sequenceArray<A>(xs: Async<A>[]): Async<A[]>;
  /**
   * `Promise<A>[] -> Async<A[]>`
   */
  static sequenceArray<A>(xs: Promise<A>[]): Async<A[]>;
  static sequenceArray<A>(xs: Async<A>[] | Promise<A>[]): Async<A[]> {
    if (xs.length === 0) return async([]);
    const head = xs[0];

    if (head instanceof Async) {
      const promises = Promise.all((xs as Async<A>[]).map(x => x.promise));

      return async(promises);
    }

    return async(Promise.all(xs as Promise<A>[]));
  }

  /**
   * `List<Async<A>> -> Async<List<A>>`
   */
  static sequenceList<A>(as: List<Async<A>>): Async<List<A>>;
  /**
   * `List<Promise<A>> -> Async<List<A>>`
   */
  static sequenceList<A>(as: List<Promise<A>>): Async<List<A>>;
  static sequenceList<A>(as: List<Async<A>> | List<Promise<A>>): Async<List<A>> {
    const xs = as.toArray();
    if (xs.length === 0) return async(list());

    const head = xs[0];

    if (head instanceof Async) {
      const promises = Promise.all((xs as Async<A>[]).map(x => x.promise));

      return async(promises).map(List.ofArray);
    }

    return async(Promise.all(xs as Promise<A>[])).map(List.ofArray);
  }

  /**
   * `Option<Async<A>> -> Async<Option<A>>`
   */
  static sequenceOption<A>(oa: Option<Async<A>>): Async<Option<A>> {
    if (oa.isSome) {
      return oa.raw!.map(option);
    }

    return async(none());
  }

  /**
   * `Result<Async<A>, B> -> Async<Result<A, B>>`
   */
  static sequenceResult<A, B>(ra: Result<Async<A>, B>): Async<Result<A, B>> {
    if (ra.isOk) {
      return ra.value.map(ok);
    }

    return async(err(ra.err));
  }

  /**
   * `Result<A, Async<B>> -> Async<Result<A, B>`
   */
  static sequenceErr<A, B>(ra: Result<A, Async<B>>): Async<Result<A, B>> {
    if (ra.isOk) {
      return async(ok(ra.value));
    }

    return ra.err.map(err);
  }

  /**
   * `number -> Async<void>`
   *
   * @param ms number of miliseconds to wait.
   */
  static sleep = (ms: number): Async<void> => async(new Promise(resolve => setTimeout(() => resolve(), ms)));

  /**
   * `Async<Async<A>> -> Async<A>`
   *
   * Flattens a nested `Async<A>`.
   */
  static flatten = <A>(aa: Async<Async<A>>): Async<A> => aa.bind(x => x);

  static ce = () => new AsyncComputation(async({}));
}

/**
 * `(A | Promise<A>) -> Async<A>`
 *
 * Creates an `Async<A>` from a type `A` or a `Promise<A>`.
 */
export const async = Async.create;

class AsyncComputation<A extends Object> {
  constructor(private readonly ctx: Async<A>) {}

  /**
   * Assigns a value to a variable inside the computation's scope.
   * @example
   * const res =
   *   Async.ce()
   *     .let('x', async(5))
   *     .let('y', () => async(10))
   *     .return(({ x, y }) => x + y);
   *
   * expect(res).toEqual(async(15));
   */
  public let<K extends string, T>(
    k: K,
    other: Promise<T> | Async<T> | ((ctx: A) => Promise<T> | Async<T>)
  ): AsyncComputation<A & { [k in K]: T }> {
    const value = Async.bind((ctx: A) => {
      if (other instanceof Async || other instanceof Promise) {
        return other;
      }

      return other(ctx);
    })(this.ctx);

    const ctx = Async.map2((ctx: A, val: T) => ({ ...ctx, [k.toString()]: val }))(this.ctx)(value);

    return new AsyncComputation(ctx as any);
  }

  /**
   * Executes and awaits a side-effectful operation.
   * @example
   * const res =
   *   Async.ce()
   *     .let('x', async(5))
   *     .do(({ x }) => Async.sleep(x)) // will sleep for 5ms
   *     .return(({ x }) => x);
   *
   * expect(res).toEqual(async(5));
   */
  public do(fn: (ctx: A) => Promise<void> | Async<void> | void): AsyncComputation<A> {
    const ctx = this.ctx.promise.then(ctx => {
      const res = fn(ctx);

      if (res instanceof Async || res instanceof Promise) {
        const promise: Promise<void> = res instanceof Async ? res.promise : (res as Promise<void>);
        const ctx = promise.then(_ => this.ctx.promise);

        return ctx;
      }

      return ctx;
    });

    return new AsyncComputation(async(ctx));
  }

  /**
   * Returns a value from the computation expression.
   * @example
   * const res =
   *   Async.ce()
   *     .let('x', async(5))
   *     .let('y', () => async(10))
   *     .return(({ x, y }) => x + y);
   *
   * expect(res).toEqual(async(15));
   */
  public return<T>(fn: (ctx: A) => T): Async<T> {
    return Async.map(fn)(this.ctx);
  }

  /**
   * Ignores the value from the computation expression.
   * @example
   * const res: Async<void> =
   *   Async.ce()
   *     .do(() => Async.sleep(5000))
   *     .do(() => console.log('I just waited 5s!'))
   *     .ignore();
   */
  public ignore(): Async<void> {
    return Async.iter(_ => {})(this.ctx);
  }
}
