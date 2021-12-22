import { Async, async } from "./Async";
import { AsyncResult } from "./AsyncResult";
import { List } from "./List";
import { Option, none, option } from "./Option";

const normalize = <T>(
  value: AsyncOption<T> | Async<Option<T>> | Async<T> | Option<T> | Promise<Option<T>> | Promise<T> | T
): AsyncOption<NonNullable<T>> => {
  if (value instanceof AsyncOption) {
    return value as AsyncOption<NonNullable<T>>;
  }

  if (value instanceof Async) {
    const res = value.map((x: Option<T> | T) => {
      if (x instanceof Option) {
        return x as Option<T>;
      }

      return option(x) as Option<T>;
    });

    return new AsyncOption(res) as AsyncOption<NonNullable<T>>;
  }

  if (value instanceof Promise) {
    const res = value.then((x: Option<T> | T) => {
      if (x instanceof Option) {
        return x as Option<T>;
      }

      return option(x) as Option<T>;
    });

    return new AsyncOption(async(res)) as AsyncOption<NonNullable<T>>;
  }

  if (value instanceof Option) {
    return new AsyncOption(async(value)) as AsyncOption<NonNullable<T>>;
  }

  return new AsyncOption(async(option(value)));
};

export class AsyncOption<A> implements PromiseLike<Option<A>> {
  constructor(private readonly raw: Async<Option<A>>) {}

  /**
   * `ofAsync: Async<Option<A>> -> AsyncOption<A>`
   *
   * ---
   */
  static ofAsync<A>(ao: Async<Option<A>>): AsyncOption<A> {
    return new AsyncOption(ao);
  }

  /**
   * `ofPromise: Promise<Option<A>> -> AsyncOption<A>`
   *
   * ---
   */
  static ofPromise<A>(po: Promise<Option<A>>): AsyncOption<A> {
    return new AsyncOption(async(po));
  }

  /**
   * `ofOption: Option<A> -> AsyncOption<A>`
   *
   * ---
   */
  static ofOption<A>(o: Option<A>): AsyncOption<A> {
    return new AsyncOption(async(o));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `then: (Option<A> -> PromiseLike<B> | B) -> Async<B>`
   *
   * ---
   * Attaches callbacks for the resolution and/or rejection of the `Async` that's wrapping the `Option`.
   * @param onfulfilled The callback to execute when the `Async` is resolved.
   * @param onrejected The callback to execute when the `Async` is rejected.
   * @returns An `Async` for the completion of which ever callback is executed.
   * @example
   * async () => {
   *   const a = await asyncOption(5).then(x => x.value * 2);
   *   expect(a).toEqual(10);
   * }
   */
  then<TResult1 = Option<A>, TResult2 = never>(
    onfulfilled?: ((value: Option<A>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Async<TResult1 | TResult2> {
    return this.raw.then(onfulfilled, onrejected);
  }

  *[Symbol.iterator](): Generator<AsyncOption<A>, A, any> {
    return yield this;
  }

  /**
   * Returns `true` if the `Option` inside this `AsyncOption` is `Some`.
   */
  get isSome(): Async<boolean> {
    return this.raw.map(o => o.isSome);
  }

  /**
   * Returns `true` if the `Option` inside this `AsyncOption` is `None`.
   */
  get isNone(): Async<boolean> {
    return this.raw.map(o => o.isNone);
  }

  /**
   * Returns the value wrapped inside of the `Option` if it is `Some`.
   * Throws an `Error` if it is `None`.
   */
  get value(): Async<A> {
    return this.raw.map(o => o.value);
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `toAsync: () -> Async<Option<A>>`
   *
   * ---
   */
  toAsync(): Async<Option<A>> {
    return this.raw;
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `toPromise: () -> Async<Promise<A>>`
   *
   * ---
   */
  toPromise(): Promise<Option<A>> {
    return this.raw.promise;
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `map: (A -> B) -> AsyncOption<B>`
   *
   * ---
   */
  map<B>(fn: (a: A) => B): AsyncOption<B> {
    return new AsyncOption(this.raw.map(o => o.map(fn)));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `bind: (A -> AsyncOption<B>) -> AsyncOption<B>`
   *
   * ---
   */
  bind<B>(fn: (a: A) => AsyncOption<B>): AsyncOption<B>;
  /**
   * `this: AsyncOption<A>`
   *
   * `bind: (A -> Async<Option<B>>) -> AsyncOption<B>`
   *
   * ---
   */
  bind<B>(fn: (a: A) => Async<Option<B>>): AsyncOption<B>;
  /**
   * `this: AsyncOption<A>`
   *
   * `bind: (A -> Promise<Option<B>>) -> AsyncOption<B>`
   *
   * ---
   */
  bind<B>(fn: (a: A) => Promise<Option<B>>): AsyncOption<B>;
  bind<B>(fn: (a: A) => AsyncOption<B> | Async<Option<B>> | Promise<Option<B>>): AsyncOption<B> {
    const res = this.raw.bind(v => {
      const result = v.map(fn);

      if (result.isSome) {
        return normalize(result.value).raw;
      }

      return async(none()) as Async<Option<B>>;
    });

    return new AsyncOption(res);
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `map2: (AsyncOption<B>, ((A, B) -> C)) -> AsyncOption<C>`
   *
   * ---
   */
  map2<B, C>(ao: AsyncOption<B>, fn: (a: A, b: B) => C): AsyncOption<C>;
  /**
   * `this: AsyncOption<A>`
   *
   * `map2: (Async<Option<B>>, ((A, B) -> C)) -> AsyncOption<C>`
   *
   * ---
   */
  map2<B, C>(ao: Async<Option<B>>, fn: (a: A, b: B) => C): AsyncOption<C>;
  /**
   * `this: AsyncOption<A>`
   *
   * `map2: (Promise<Option<B>>, ((A, B) -> C)) -> AsyncOption<C>`
   *
   * ---
   */
  map2<B, C>(ao: Promise<Option<B>>, fn: (a: A, b: B) => C): AsyncOption<C>;
  map2<B, C>(ao: AsyncOption<B> | Async<Option<B>> | Promise<Option<B>>, fn: (a: A, b: B) => C): AsyncOption<C> {
    const b = normalize(ao);

    return this.bind(a => b.map(b => fn(a, b)));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `iter: (A -> ()) -> ()`
   *
   * ---
   */
  iter(fn: (a: A) => void): Async<void> {
    return async(this.raw.promise.then(x => x.iter(fn)));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `tee: (A -> ()) -> AsyncOption<A>`
   *
   * ---
   */
  tee(fn: (a: A) => void): AsyncOption<A> {
    return this.map(a => {
      fn(a);
      return a;
    });
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `defaultValue: A -> Async<A>`
   *
   * ---
   */
  defaultValue(a: A): Async<A> {
    return this.raw.map(x => x.defaultValue(a));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `defaultWith: (() -> A) -> Async<A>`
   *
   * ---
   */
  defaultWith(fn: () => A): Async<A> {
    return this.raw.map(x => x.defaultWith(fn));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `defaultWithAsync: (() -> Async<A>) -> Async<A>`
   *
   * ---
   */
  defaultWithAsync(fn: () => Async<A>): Async<A>;
  /**
   * `this: AsyncOption<A>`
   *
   * `defaultWithAsync: (() -> Promise<A>) -> Async<A>`
   *
   * ---
   */
  defaultWithAsync(fn: () => Promise<A>): Async<A>;
  defaultWithAsync(fn: () => Async<A> | Promise<A>): Async<A> {
    return this.raw.bind(x => {
      if (x.isSome) {
        return async(x.raw!);
      }

      return Async.normalize(fn());
    });
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `orElse: Option<A> -> AsyncOption<A>`
   *
   * ---
   */
  orElse(a: Option<A>): AsyncOption<A> {
    return new AsyncOption(this.raw.map(x => x.orElse(a)));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `orElseWith: (() -> Option<A>) -> AsyncOption<A>`
   *
   * ---
   */
  orElseWith(fn: () => Option<A>): AsyncOption<A> {
    return new AsyncOption(this.raw.map(x => x.orElseWith(fn)));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `orElseWithAsync: (() -> AsyncOption<A>) -> AsyncOption<A>`
   *
   * ---
   */
  orElseWithAsync(fn: () => AsyncOption<A>): AsyncOption<A>;
  /**
   * `this: AsyncOption<A>`
   *
   * `orElseWithAsync: (() -> Async<Option<A>>) -> AsyncOption<A>`
   *
   * ---
   */
  orElseWithAsync(fn: () => Async<Option<A>>): AsyncOption<A>;
  /**
   * `this: AsyncOption<A>`
   *
   * `orElseWithAsync: (() -> Promise<Option<A>>) -> AsyncOption<A>`
   *
   * ---
   */
  orElseWithAsync(fn: () => Promise<Option<A>>): AsyncOption<A>;
  orElseWithAsync(fn: () => AsyncOption<A> | Async<Option<A>> | Promise<Option<A>>): AsyncOption<A> {
    const res = this.raw.bind(x => {
      if (x.isSome) {
        return async(x);
      }

      return normalize(fn()).toAsync();
    });

    return normalize(res);
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `toAsyncResult: B -> AsyncResult<A, B>`
   *
   * ---
   */
  toAsyncResult<B>(err: B): AsyncResult<A, B> {
    return AsyncResult.ofAsync(this.toAsync().map(x => x.toResult(err)));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `zip: AsyncOption<B> -> AsyncOption<A * B>`
   *
   * ---
   */
  zip<B>(b: AsyncOption<B>): AsyncOption<[A, B]>;
  /**
   * `this: AsyncOption<A>`
   *
   * `zip: Async<Option<B>> -> AsyncOption<A * B>`
   *
   * ---
   */
  zip<B>(b: Async<Option<B>>): AsyncOption<[A, B]>;
  /**
   * `this: AsyncOption<A>`
   *
   * `zip: Promise<Option<B>> -> AsyncOption<A * B>`
   *
   * ---
   */
  zip<B>(b: Promise<Option<B>>): AsyncOption<[A, B]>;
  zip<B>(b: AsyncOption<B> | Async<Option<B>> | Promise<Option<B>>): AsyncOption<[A, B]> {
    return this.bind(a => normalize(b).map(b => [a, b]));
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `trace: (string | undefined) -> AsyncOption<A>`
   *
   * ---
   */
  trace(msg?: string): AsyncOption<A> {
    return normalize(
      this.toAsync().map(x => {
        x.trace(msg);
        return x;
      })
    );
  }

  /**
   * `this: AsyncOption<A>`
   *
   * `to: (AsyncOption<A> -> B) -> B`
   *
   * ---
   * Pipes this current `AsyncOption` instance as an argument to the given function.
   * @example
   * const a = asyncOption("3").pipe(list);
   * expect(a).toBeInstanceOf(List);
   */
  to<B>(fn: (a: AsyncOption<A>) => B): B {
    return fn(this);
  }

  static isSome = <A>(ao: AsyncOption<A> | Async<Option<A>>): Async<boolean> => normalize(ao).isSome;

  static isNone = <A>(ao: AsyncOption<A>): Async<boolean> => normalize(ao).isNone;

  static value = <A>(ao: AsyncOption<A> | Async<Option<A>>): Async<A> => normalize(ao).value;

  static map =
    <A, B>(fn: (a: A) => B) =>
    (ao: AsyncOption<A> | Async<Option<A>> | Promise<Option<A>>): AsyncOption<B> =>
      normalize(ao).map(fn);

  static map2 =
    <A, B, C>(fn: (a: A, b: B) => C) =>
    (ao1: AsyncOption<A> | Async<Option<A>> | Promise<Option<A>>) =>
    (ao2: AsyncOption<B> | Async<Option<B>> | Promise<Option<B>>): AsyncOption<C> =>
      normalize(ao1).map2(normalize(ao2), fn);

  static bind =
    <A, B>(fn: (a: A) => AsyncOption<B>) =>
    (ao: AsyncOption<A> | Async<Option<A>> | Promise<Option<A>>): AsyncOption<B> =>
      normalize(ao).bind(fn);

  static iter =
    <A>(fn: (a: A) => void) =>
    (x: AsyncOption<A> | Async<Option<A>> | Promise<Option<A>>): Async<void> =>
      normalize(x).iter(fn);

  static toAsyncResult =
    <A, B>(err: B) =>
    (ao: AsyncOption<A>): AsyncResult<A, B> =>
      ao.toAsyncResult(err);

  static ofAsyncResult = <A, B>(ar: AsyncResult<A, B>): AsyncOption<A> => {
    return new AsyncOption(ar.toAsync().map(x => x.toOption()));
  };

  /**
   * `sequenceArray: AsyncOption<A>[] -> AsyncOption<A[]>`
   *
   * ---
   */
  static sequenceArray<A>(aos: AsyncOption<A>[]): AsyncOption<A[]>;
  /**
   * `sequenceArray: Async<Option<A>>[] -> AsyncOption<A[]>`
   *
   * ---
   */
  static sequenceArray<A>(aos: Async<Option<A>>[]): AsyncOption<A[]>;
  /**
   * `sequenceArray: Promise<Option<A>>[] -> AsyncOption<A[]>`
   *
   * ---
   */
  static sequenceArray<A>(aos: Promise<Option<A>>[]): AsyncOption<A[]>;
  static sequenceArray<A>(aos: Array<AsyncOption<A> | Async<Option<A>> | Promise<Option<A>>>): AsyncOption<A[]> {
    const a = aos.map(x => normalize(x).raw);
    const b = Async.sequenceArray(a).map(x => Option.sequenceArray(x));

    return new AsyncOption(b);
  }

  /**
   * `sequenceList: List<AsyncOption<A>> -> AsyncOption<List<A>>`
   *
   * ---
   */
  static sequenceList<A>(aos: List<AsyncOption<A>>): AsyncOption<List<A>>;
  /**
   * `sequenceList: List<Async<Option<A>>> -> AsyncOption<List<A>>`
   *
   * ---
   */
  static sequenceList<A>(aos: List<Async<Option<A>>>): AsyncOption<List<A>>;
  /**
   * `sequenceList: List<Promise<Option<A>>> -> AsyncOption<List<A>>`
   *
   * ---
   */
  static sequenceList<A>(aos: List<Promise<Option<A>>>): AsyncOption<List<A>>;
  static sequenceList<A>(aos: List<AsyncOption<A> | Async<Option<A>> | Promise<Option<A>>>): AsyncOption<List<A>> {
    const a = aos.map(x => normalize(x).raw);
    const b = Async.sequenceList(a).map(x => Option.sequenceList(x));

    return new AsyncOption(b);
  }

  /**
   * Executes a `AsyncOption` Computation Expression.
   * @example
   * const a = AsyncOption.ce(function* () {
   *   const x = yield* Num.parse("15")
   *   const y = yield* asyncOption(10);
   *   const z = yield* async(5);
   *
   *   return x + y + z;
   * });
   *
   * a.iter(value => expect(value).toEqual(15));
   *
   * const b = AsyncOption.ce(function* () {
   *   const x = yield* Num.parse("oops")
   *   const y = yield* asyncOption(10);
   *   const z = yield* async(5);
   *
   *   return x + y + z;
   * });
   *
   * b.isNone.then(k => expect(k).toEqual(true));
   */
  static ce = <A, B>(genFn: () => Generator<AsyncOption<A> | Async<A> | Option<A>, B, A>): AsyncOption<B> => {
    const iterator = genFn();
    let state = iterator.next();

    function run(
      state: IteratorYieldResult<AsyncOption<A> | Async<A> | Option<A>> | IteratorReturnResult<B>
    ): AsyncOption<B> {
      if (state.done) {
        return AsyncOption.ofOption(option(state.value));
      }

      const { value } = state;
      return normalize(value).bind(val => run(iterator.next(val)));
    }

    return run(state);
  };
}

/**
 * Converts any of the following into an `AsyncOption<T>`:
 * `Async<Option<T>>`, `Promise<Option<T>>`, `Async<T>`, `Option<T>`, `Promise<T>`, `T`
 */
export const asyncOption = normalize;
