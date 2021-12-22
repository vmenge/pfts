import { none, option, Option } from "./Option";
import { list, List } from "./List";
import { err, ok, Result } from "./Result";

/**
 * `Async<A>` represents a single operation that does not return a value immediately that usually executes asynchronously.
 * If successful, upon completion the `Async<A>` object will contain the value of type `A`.
 *
 * It is essentially a wrapper for a `Promise<A>` with helper methods.
 */
export class Async<A> implements PromiseLike<A> {
  /**
   * The inner `Promise<A>` containing the asynchronous operation.
   */
  public readonly promise: Promise<A>;

  private constructor(value: A | Promise<A>) {
    if (value instanceof Promise) {
      this.promise = value;
    }

    Promise.resolve(5).then();

    this.promise = Promise.resolve(value);
  }

  /**
   * `this: Async<A>`
   *
   * `then: (A -> PromiseLike<B> | B) -> Async<B>`
   *
   * ---
   * Attaches callbacks for the resolution and/or rejection of the `Async`.
   * @param onfulfilled The callback to execute when the `Async` is resolved.
   * @param onrejected The callback to execute when the `Async` is rejected.
   * @returns An `Async` for the completion of which ever callback is executed.
   * @example
   * async () => {
   *   const a = await async(5).then(x => x * 2);
   *   expect(a).toEqual(10);
   * }
   */
  then<TResult1 = A, TResult2 = never>(
    onfulfilled?: ((value: A) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Async<TResult1 | TResult2> {
    return async(this.promise.then(onfulfilled, onrejected));
  }

  /**
   * `new: (A | Promise<A>) -> Async<A>`
   *
   * ---
   * Creates an `Async<A>` from a type `A` or a `Promise<A>`.
   * @example
   * const a = Async.new(5);
   * expect(a).toBeInstanceOf(Async);
   *
   * const b = Async.new(Promise.resolve(5));
   * expect(b).toBeInstanceOf(Async);
   */
  static new = <A>(a: A | Promise<A>): Async<A> => new Async(a);

  /**
   * `ofPromise: Promise<A> -> Async<A>`
   *
   * ---
   * Creates an `Async<A>` from a `Promise<A>`.
   * @example
   * const a = Async.ofPromise(Promise.resolve(5));
   * expect(a).toBeInstanceOf(Async);
   */
  static ofPromise = <A>(a: Promise<A>): Async<A> => new Async(a);

  *[Symbol.iterator](): Generator<Async<A>, A, any> {
    return yield this;
  }

  /**
   * `this: Async<A>`
   *
   * `map: (A -> B) -> Async<B>`
   *
   * ---
   * Evaluates the given function against the result of `Async<A>`once the asynchronous operation is completed.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Async`.
   * @example
   * async () => {
   *   const a = await async(10).map(x => x + 2);
   *   expect(a).toEqual(12);
   * }
   */
  map<B>(fn: (a: A) => B): Async<B> {
    return async(this.promise.then(fn));
  }

  /**
   * `this: Async<A>`
   *
   * `map2: (Async<B>, ((A, B) -> C)) -> Async<C>`
   *
   * ---
   * Given another `Async` value, evaluates the given function against the result of `Async<A>` and `Async<B>` once both operations are completed.
   * @param b a second `Async` value that must also be evaluated.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Async`.
   * @example
   * async () => {
   *   const a = await async(10).map2(async(5), (x, y) => x + y);
   *   expect(a).toEqual(15);
   * }
   */
  map2<B, C>(b: Async<B>, fn: (a: A, b: B) => C): Async<C>;
  /**
   * `this: Async<A>`
   *
   * `map2: (Promise<B>, ((A, B) -> C)) -> Async<C>`
   *
   * ---
   * Given a `Promise<B>`, evaluates the given function against the result of `Async<A>` and `Promise<B>` once both operations are completed.
   * @param b a `Promise` value that must also be evaluated.
   * @param fn mapping function.
   * @returns The resulting value of the mapping function wrapped in an `Async`.
   * @example
   * async () => {
   *   const a = await async(10).map2(Promise.resolve(5), (x, y) => x + y);
   *   expect(a).toEqual(15);
   * }
   */
  map2<B, C>(b: Promise<B>, fn: (a: A, b: B) => C): Async<C>;
  map2<B, C>(b: Async<B> | Promise<B>, fn: (a: A, b: B) => C): Async<C> {
    const x = b instanceof Promise ? b : b.promise;

    const result = Promise.all([this.promise, x]).then(res => fn(res[0], res[1]));

    return async(result);
  }

  /**
   * `this: Async<A>`
   *
   * `bind: (A -> Async<B>) -> Async<B>`
   *
   * ---
   * Evaluates the given function against the result of `Async<A>` once the asynchronous operation is completed.
   * @param fn a binder function.
   * @returns The resulting value of the binder function.
   * @example
   * async () => {
   *   const a = await async(10).bind(x => async(x + 5));
   *   expect(a).toEqual(15);
   * }
   */
  bind<B>(fn: (a: A) => Async<B>): Async<B>;
  /**
   * `this: Async<A>`
   *
   * `bind: (A -> Promise<B>) -> Async<B>`
   *
   * ---
   * Evaluates the given function against the result of `Async<A>` once the asynchronous operation is completed.
   * @param fn a binder function.
   * @returns The resulting value of the binder function.
   * @example
   * async () => {
   *   const a = await async(10).bind(x => Promise.resolve(x + 5));
   *   expect(a).toEqual(15);
   * }
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
   * `this: Async<A>`
   *
   * `iter: (A -> ()) -> Async<()>`
   *
   * ---
   * Executes the given function against the result of `Async<A>` once the asynchronous operation is completed.
   * @param fn a function that typically executes a side effect.
   * @returns an 'empty' `Async`.
   * @example
   * async () => {
   *   await async("hello, world!").iter(console.log); // prints "hello, world!"
   * }
   */
  iter(fn: (a: A) => void): Async<void> {
    return async(this.promise.then(fn));
  }

  /**
   * `this: Async<A>`
   *
   * `tee: (A -> ()) -> Async<A>`
   *
   * ---
   * Executes the given function against the result of `Async<A>` once the asynchronous operation is completed.
   * @param fn a function that typically executes a side effect.
   * @returns the same `Async<A>` instance.
   * @example
   * async () => {
   *   const a = await async(10).tee(x => console.log(x + 50));
   *   expect(a).toEqual(10);
   * }
   */
  tee(fn: (a: A) => void): Async<A> {
    return this.map(a => {
      fn(a);
      return a;
    });
  }

  /**
   * `this: Async<A>`
   *
   * `Async<B> -> Async<A * B>`
   *
   * ---
   * @returns the tupled result of the two asynchronous operations wrapped in a `Async` instance.
   * @example
   * async () => {
   *   const a = await async(10).zip(async("one"));
   *   expect(a).toEqual([10, "one"]);
   * }
   */
  zip<B>(b: Async<B>): Async<[A, B]>;
  /**
   * `this: Async<A>`
   *
   * `zip: Promise<B> -> Async<A * B>`
   *
   * ---
   * @returns the tupled result of the two asynchronous operations wrapped in a `Async` instance.
   * @example
   * async () => {
   *   const a = await async(10).zip(Promise.resolve("one"));
   *   expect(a).toEqual([10, "one"]);
   * }
   */
  zip<B>(b: Promise<B>): Async<[A, B]>;
  zip<B>(b: Async<B> | Promise<B>): Async<[A, B]> {
    return this.bind(a => Async.normalize(b).map(b => [a, b]));
  }

  /**
   * `this: Async<A>`
   *
   * `zip3: (Async<B>, Async<C>) -> Async<A * B * C>`
   *
   * ---
   * @returns the tupled result of the three asynchronous operations wrapped in a `Async` instance.
   * @example
   * async () => {
   *   const a = await async(10).zip3(async("two"), async(true));
   *   expect(a).toEqual([10, "two", true]);
   * }
   */
  zip3<B, C>(b: Async<B>, c: Async<C>): Async<[A, B, C]> {
    return this.bind(a => b.bind(b => c.map(c => [a, b, c])));
  }

  /**
   * `this: Async<A>`
   *
   * `to: (Async<A> -> B) -> B`
   *
   * ---
   * Pipes this current `Async` instance as an argument to the given function.
   * @example
   * const a = async("3").pipe(list);
   * expect(a).toBeInstanceOf(List);
   */
  to<B>(fn: (a: Async<A>) => B): B {
    return fn(this);
  }

  /**
   * `normalize: (Async<A> | Promise<A>) -> Async<A>`
   *
   * ---
   * Given an `Async<A>` or `Promise<A>` value, always returns an `Async<A>`.
   * @example
   * const a = Async.normalize(async(5));
   * expect(a).toBeInstanceOf(Async);
   *
   * const b = Async.normalize(Promise.resolve(5));
   * expect(b).toBeInstanceOf(Async);
   */
  static normalize = <A>(a: Async<A> | Promise<A>): Async<A> => (a instanceof Async ? a : async(a));

  /**
   * `map: (A -> B) -> Async<A> -> Async<B>`
   *
   * ---
   */
  static map =
    <A, B>(fn: (a: A) => B) =>
    (a: Async<A> | Promise<A>): Async<B> =>
      Async.normalize(a).map(fn);

  /**
   * `map2: ((A, B) -> C) -> Async<A> -> Async<B> -> Async<C>`
   *
   * ---
   */
  static map2 =
    <A, B, C>(fn: (a: A, b: B) => C) =>
    (a1: Async<A> | Promise<A>) =>
    (a2: Async<B> | Promise<B>): Async<C> =>
      Async.normalize(a1).map2(Async.normalize(a2), fn);

  /**
   * `bind: (A -> Async<B>) -> Async<A> -> Async<B>`
   *
   * ---
   */
  static bind =
    <A, B>(fn: (a: A) => Async<B> | Promise<B>) =>
    (x: Async<A> | Promise<A>): Async<B> =>
      Async.normalize(x).bind(y => Async.normalize(fn(y)));

  /**
   * `iter: (A -> ()) -> Async<()>`
   *
   * ---
   */
  static iter =
    <A>(fn: (a: A) => void) =>
    (x: Async<A> | Promise<A>): Async<void> =>
      Async.normalize(x).iter(fn);

  /**
   * `sequenceArray: Async<A>[] -> Async<A[]>`
   *
   * ---
   */
  static sequenceArray<A>(xs: Async<A>[]): Async<A[]>;
  /**
   * `sequenceArray: Promise<A>[] -> Async<A[]>`
   *
   * ---
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
   * `sequenceList: List<Async<A>> -> Async<List<A>>`
   *
   * ---
   */
  static sequenceList<A>(as: List<Async<A>>): Async<List<A>>;
  /**
   * `sequenceList: List<Promise<A>> -> Async<List<A>>`
   *
   * ---
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
   * `sequenceOption: Option<Async<A>> -> Async<Option<A>>`
   *
   * ---
   */
  static sequenceOption<A>(oa: Option<Async<A>>): Async<Option<A>>;
  /**
   * `sequenceOption: Option<Promise<A>> -> Async<Option<A>>`
   *
   * ---
   */
  static sequenceOption<A>(oa: Option<Promise<A>>): Async<Option<A>>;
  static sequenceOption<A>(oa: Option<Async<A> | Promise<A>>): Async<Option<A>> {
    if (oa.isSome) {
      return Async.normalize(oa.raw!).map(option);
    }

    return async(none());
  }

  /**
   * `sequenceResult: Result<Async<A>, B> -> Async<Result<A, B>>`
   *
   * ---
   */
  static sequenceResult<A, B>(ra: Result<Async<A>, B>): Async<Result<A, B>> {
    if (ra.isOk) {
      return ra.value.map(ok);
    }

    return async(err(ra.err));
  }

  /**
   * `sequenceErr: Result<A, Async<B>> -> Async<Result<A, B>`
   *
   * ---
   */
  static sequenceErr<A, B>(ra: Result<A, Async<B>>): Async<Result<A, B>>;
  /**
   * `sequenceErr: Result<A, Promise<B>> -> Async<Result<A, B>`
   *
   * ---
   */
  static sequenceErr<A, B>(ra: Result<A, Promise<B>>): Async<Result<A, B>>;
  static sequenceErr<A, B>(ra: Result<A, Async<B> | Promise<B>>): Async<Result<A, B>> {
    if (ra.isOk) {
      return async(ok(ra.value));
    }

    if (ra.raw instanceof Async) {
      return ra.raw.map(err);
    }

    return Async.new(ra.raw as Promise<B>).map(err);
  }

  /**
   * `sleep: number -> Async<void>`
   *
   * ---
   * @param ms number of miliseconds to wait.
   * @example
   * async () => {
   *   await Async.sleep(5_000);
   *   console.log("hello!"); // waits 5s before printing "hello!"
   * }
   */
  static sleep = (ms: number): Async<void> => async(new Promise(resolve => setTimeout(() => resolve(), ms)));

  /**
   * `flatten: Async<Async<A>> -> Async<A>`
   *
   * ---
   * Flattens a nested `Async<A>`.
   */
  static flatten = <A>(aa: Async<Async<A>>): Async<A> => aa.bind(x => x);

  /**
   * Executes a `Async` Computation Expression.
   * @example
   * const a = Async.ce(function* () {
   *   const x = yield* async(5);
   *   const y = yield* async(10);
   *
   *   return x + y;
   * });
   *
   * a.iter(value => expect(value).toEqual(15));
   */
  static ce = <A, B>(genFn: () => Generator<Async<A>, B, A>): Async<B> => {
    const iterator = genFn();
    let state = iterator.next();

    function run(state: IteratorYieldResult<Async<A>> | IteratorReturnResult<B>): Async<B> {
      if (state.done) {
        return async(state.value);
      }

      const { value } = state;
      return value.bind(val => run(iterator.next(val)));
    }

    return run(state);
  };
}

/**
 * `async: (A | Promise<A>) -> Async<A>`
 *
 * ---
 * Creates an `Async<A>` from a type `A` or a `Promise<A>`.
 * @example
 * const a = async(5);
 * expect(a).toBeInstanceOf(Async);
 *
 * const b = async(Promise.resolve(5));
 * expect(b).toBeInstanceOf(Async);
 */
export const async = Async.new;
