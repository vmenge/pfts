import { Async, async } from "./Async";
import { AsyncOption } from "./AsyncOption";
import { List } from "./List";
import { Result, ok, err } from "./Result";
import { Flatten, NonVoid } from "./type-utils";

const normalize = <T, B>(
  value: AsyncResult<T, B> | Async<Result<T, B>> | Async<T> | Result<T, B> | Promise<T> | Promise<Result<T, B>>
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

  return new AsyncResult(async(value));
};

export class AsyncResult<A, B> {
  constructor(private readonly raw: Async<Result<A, B>>) {}

  static ofAsync<A, B>(ar: Async<Result<A, B>>): AsyncResult<A, B> {
    return new AsyncResult(ar);
  }

  static ofPromise<A, B>(pr: Promise<Result<A, B>>): AsyncResult<A, B> {
    return new AsyncResult(async(pr));
  }

  static ofResult<A, B>(r: Result<A, B>) {
    return new AsyncResult(async(r));
  }

  get isOk(): Async<boolean> {
    return this.raw.map(r => r.isOk);
  }

  get isErr(): Async<boolean> {
    return this.raw.map(o => o.isErr);
  }

  get value(): Async<A> {
    return this.raw.map(r => r.value);
  }

  toAsync(): Async<Result<A, B>> {
    return this.raw;
  }

  map<C>(fn: (a: A) => C): AsyncResult<C, B> {
    return new AsyncResult(this.raw.map(r => r.map(fn)));
  }

  bind<C>(fn: (a: A) => AsyncResult<C, B>): AsyncResult<C, B>;
  bind<C>(fn: (a: A) => Async<Result<C, B>>): AsyncResult<C, B>;
  bind<C>(fn: (a: A) => Promise<Result<C, B>>): AsyncResult<C, B>;
  bind<C>(fn: (a: A) => AsyncResult<C, B> | Async<Result<C, B>> | Promise<Result<C, B>>): AsyncResult<C, B> {
    const res = this.raw.bind(v => {
      const result = v.map(fn);

      if (result.isOk) {
        return normalize(result.value).raw;
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

  iter(fn: (a: A) => void): Async<void> {
    return async(this.raw.promise.then(x => x.iter(fn)));
  }

  mapErr<C>(fn: (b: B) => C): AsyncResult<A, C> {
    if (this.isErr) {
      return normalize(this.raw.map(r => r.mapErr(fn)));
    }

    return this as any as AsyncResult<A, C>;
  }

  tee(fn: (a: A) => void): AsyncResult<A, B> {
    return this.map(a => {
      fn(a);
      return a;
    });
  }

  defaultValue(a: A): Async<A> {
    return this.raw.map(x => x.defaultValue(a));
  }

  defaultWith(fn: () => A): Async<A> {
    return this.raw.map(x => x.defaultWith(fn));
  }

  defaultWithAsync(fn: () => Async<A>): Async<A>;
  defaultWithAsync(fn: () => Promise<A>): Async<A>;
  defaultWithAsync(fn: () => Async<A> | Promise<A>): Async<A> {
    return this.raw.bind(x => {
      if (x.isOk) {
        return async(x.value);
      }

      return Async.normalize(fn());
    });
  }

  orElse(r: Result<A, B>): AsyncResult<A, B> {
    return normalize(this.raw.map(x => x.orElse(r)));
  }

  orElseWith(fn: () => Result<A, B>): AsyncResult<A, B> {
    return normalize(this.raw.map(x => x.orElseWith(fn)));
  }

  orElseWithAsync(fn: () => AsyncResult<A, B>): AsyncResult<A, B>;
  orElseWithAsync(fn: () => Async<Result<A, B>>): AsyncResult<A, B>;
  orElseWithAsync(fn: () => Promise<Result<A, B>>): AsyncResult<A, B>;
  orElseWithAsync(fn: () => AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): AsyncResult<A, B> {
    const res = this.raw.bind(x => {
      if (x.isOk) {
        return async(x);
      }

      return normalize(fn()).toAsync();
    });

    return normalize(res);
  }

  toAsyncOption(): AsyncOption<A> {
    return new AsyncOption(this.raw.map(x => x.toOption()));
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

  static isOk = <A, B>(ar: AsyncResult<A, B> | Async<Result<A, B>>): Async<boolean> => normalize(ar).isOk;

  static isErr = <A, B>(ar: AsyncResult<A, B>): Async<boolean> => normalize(ar).isErr;

  static value = <A, B>(ar: AsyncResult<A, B> | Async<Result<A, B>>): Async<A> => normalize(ar).value;

  static map =
    <A, B, C>(fn: (a: A) => C) =>
    (ar: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): AsyncResult<C, B> =>
      normalize(ar).map(fn);

  static map2 =
    <A, B, C, D>(fn: (a: A, c: C) => D) =>
    (ar1: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>) =>
    (ar2: AsyncResult<C, B> | Async<Result<C, B>> | Promise<Result<C, B>>): AsyncResult<D, B> =>
      normalize(ar1).map2(normalize(ar2), fn);

  static bind =
    <A, B, C>(fn: (a: A) => AsyncResult<C, B>) =>
    (ar: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): AsyncResult<C, B> =>
      normalize(ar).bind(fn);

  static iter =
    <A, B>(fn: (a: A) => void) =>
    (x: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): Async<void> =>
      normalize(x).iter(fn);

  static toAsyncOption = <A, B>(ar: AsyncResult<A, B> | Async<Result<A, B>> | Promise<Result<A, B>>): AsyncOption<A> =>
    new AsyncOption(normalize(ar).raw.map(x => x.toOption()));

  static ofAsyncOption =
    <A, B>(err: B) =>
    (ao: AsyncOption<A>): AsyncResult<A, B> =>
      new AsyncResult(ao.toAsync().map(Result.ofOption(err)));

  static sequenceArray = <A, B>(ars: AsyncResult<A, B>[]): AsyncResult<A[], B> => {
    const a = ars.map(x => x.raw);
    const b = Async.sequenceArray(a).map(x => Result.sequenceArray(x));

    return new AsyncResult(b);
  };

  static sequenceList = <A, B>(ars: List<AsyncResult<A, B>>): AsyncResult<List<A>, B> => {
    const a = ars.map(x => x.raw);
    const b = Async.sequenceList(a).map(x => Result.sequenceList(x));

    return new AsyncResult(b);
  };

  static ce = <A, B>() => new AsyncResultComputation(new AsyncResult(async(ok<A, B>({} as A))));
}

class AsyncResultComputation<A extends Object, B> {
  constructor(private readonly ctx: AsyncResult<A, B>) {}

  public let<K extends string, T>(
    k: K,
    other:
      | AsyncResult<T, B>
      | Async<Result<T, B>>
      | Promise<Result<T, B>>
      | Async<T>
      | Promise<T>
      | Result<T, B>
      | ((
          ctx: A
        ) =>
          | AsyncResult<NonVoid<T>, B>
          | Async<Result<NonVoid<T>, B>>
          | Promise<Result<NonVoid<T>, B>>
          | Async<NonVoid<T>>
          | Promise<NonVoid<T>>
          | Result<NonVoid<T>, B>)
  ): AsyncResultComputation<A & { [k in K]: T }, B> {
    const value = AsyncResult.bind((ctx: A) => {
      const x = typeof other === "function" ? other(ctx) : other;

      return normalize(x);
    })(this.ctx);

    const ctx = AsyncResult.map2((ctx: A, val: T) => ({ ...ctx, [k.toString()]: val }))(this.ctx)(value);

    return new AsyncResultComputation(ctx as any);
  }

  public do(fn: (ctx: A) => Promise<void> | Async<void> | void): AsyncResultComputation<A, B> {
    const ctx = this.ctx.toAsync().promise.then(ctx => {
      if (ctx.isErr) return ctx;

      const res = fn(ctx.value);

      if (res instanceof Async || res instanceof Promise) {
        const promise: Promise<void> = res instanceof Async ? res.promise : (res as Promise<void>);
        const ctx = promise.then(_ => this.ctx.toAsync().promise);

        return ctx;
      }

      return ctx;
    });

    return new AsyncResultComputation(AsyncResult.ofPromise(ctx));
  }

  public return<T>(fn: (ctx: A) => T): AsyncResult<T, B> {
    return AsyncResult.map(fn)(this.ctx) as AsyncResult<T, B>;
  }

  public ignore(): Async<void> {
    return AsyncResult.iter(_ => {})(this.ctx);
  }
}
