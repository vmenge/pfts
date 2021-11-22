import { Async, async } from "./Async";
import { AsyncResult } from "./AsyncResult";
import { List } from "./List";
import { Option, some, none, option } from "./Option";
import { Flatten, NonVoid } from "./type-utils";

const normalize = <T>(
  value: AsyncOption<T> | Async<Option<T>> | Async<T> | Option<T> | Promise<Option<T>> | Promise<T>
): AsyncOption<T> => {
  if (value instanceof AsyncOption) {
    return value;
  }

  if (value instanceof Async) {
    const res = value.map((x: Option<T> | T) => {
      if (x instanceof Option) {
        return x as Option<T>;
      }

      return option(x) as Option<T>;
    });

    return new AsyncOption(res);
  }

  if (value instanceof Promise) {
    const res = value.then((x: Option<T> | T) => {
      if (x instanceof Option) {
        return x as Option<T>;
      }

      return option(x) as Option<T>;
    });

    return new AsyncOption(async(res));
  }

  return new AsyncOption(async(value));
};

export class AsyncOption<A> {
  constructor(private readonly raw: Async<Option<A>>) {}

  static ofAsync<A>(ao: Async<Option<A>>): AsyncOption<A> {
    return normalize(ao);
  }

  static ofPromise<A>(po: Promise<Option<A>>): AsyncOption<A> {
    return normalize(po);
  }

  static ofOption<A>(o: Option<A>): AsyncOption<A> {
    return normalize(o);
  }

  get isSome(): Async<boolean> {
    return this.raw.map(o => o.isSome);
  }

  get isNone(): Async<boolean> {
    return this.raw.map(o => o.isNone);
  }

  get value(): Async<A> {
    return this.raw.map(o => o.value);
  }

  toAsync(): Async<Option<A>> {
    return this.raw;
  }

  toPromise(): Promise<Option<A>> {
    return this.raw.promise;
  }

  map<B>(fn: (a: A) => B): AsyncOption<B> {
    return new AsyncOption(this.raw.map(o => o.map(fn)));
  }

  bind<B>(fn: (a: A) => AsyncOption<B>): AsyncOption<B>;
  bind<B>(fn: (a: A) => Async<Option<B>>): AsyncOption<B>;
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

  map2<B, C>(ao: AsyncOption<B>, fn: (a: A, b: B) => C): AsyncOption<C>;
  map2<B, C>(ao: Async<Option<B>>, fn: (a: A, b: B) => C): AsyncOption<C>;
  map2<B, C>(ao: Promise<Option<B>>, fn: (a: A, b: B) => C): AsyncOption<C>;
  map2<B, C>(ao: AsyncOption<B> | Async<Option<B>> | Promise<Option<B>>, fn: (a: A, b: B) => C): AsyncOption<C> {
    const b = normalize(ao);

    return this.bind(a => b.map(b => fn(a, b)));
  }

  iter(fn: (a: A) => void): Async<void> {
    return async(this.raw.promise.then(x => x.iter(fn)));
  }

  tee(fn: (a: A) => void): AsyncOption<A> {
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
      if (x.isSome) {
        return async(x.raw!);
      }

      return Async.normalize(fn());
    });
  }

  orElse(a: Option<A>): AsyncOption<A> {
    return normalize(this.raw.map(x => x.orElse(a)));
  }

  orElseWith(fn: () => Option<A>): AsyncOption<A> {
    return normalize(this.raw.map(x => x.orElseWith(fn)));
  }

  orElseWithAsync(fn: () => AsyncOption<A>): AsyncOption<A>;
  orElseWithAsync(fn: () => Async<Option<A>>): AsyncOption<A>;
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

  toAsyncResult<B>(err: B): AsyncResult<A, B> {
    return AsyncResult.ofAsync(this.toAsync().map(x => x.toResult(err)));
  }

  zip<B>(b: AsyncOption<B>): AsyncOption<[A, B]>;
  zip<B>(b: Async<Option<B>>): AsyncOption<[A, B]>;
  zip<B>(b: Promise<Option<B>>): AsyncOption<[A, B]>;
  zip<B>(b: AsyncOption<B> | Async<Option<B>> | Promise<Option<B>>): AsyncOption<[A, B]> {
    return this.bind(a => normalize(b).map(b => [a, b]));
  }

  trace(msg?: string): AsyncOption<A> {
    return normalize(
      this.toAsync().map(x => {
        x.trace(msg);
        return x;
      })
    );
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

  static sequenceArray = <A>(aos: AsyncOption<A>[]): AsyncOption<A[]> => {
    const a = aos.map(x => x.raw);
    const b = Async.sequenceArray(a).map(x => Option.sequenceArray(x));

    return new AsyncOption(b);
  };

  static sequenceList = <A>(aos: List<AsyncOption<A>>): AsyncOption<List<A>> => {
    const a = aos.map(x => x.raw);
    const b = Async.sequenceList(a).map(x => Option.sequenceList(x));

    return new AsyncOption(b);
  };

  static ce = () => new AsyncOptionComputation(new AsyncOption(async(some({}))));
}

class AsyncOptionComputation<A extends Object> {
  constructor(private readonly ctx: AsyncOption<A>) {}

  public let<K extends string, T>(
    k: K,
    other:
      | AsyncOption<T>
      | Async<Option<T>>
      | Promise<Option<T>>
      | Async<T>
      | Promise<T>
      | Option<T>
      | ((
          ctx: A
        ) =>
          | AsyncOption<NonVoid<T>>
          | Async<Option<NonVoid<T>>>
          | Promise<Option<NonVoid<T>>>
          | Async<NonVoid<T>>
          | Promise<NonVoid<T>>
          | Option<NonVoid<T>>)
  ): AsyncOptionComputation<A & { [k in K]: T }> {
    const value = AsyncOption.bind((ctx: A) => {
      const x = typeof other === "function" ? other(ctx) : other;

      return normalize(x);
    })(this.ctx);

    const ctx = AsyncOption.map2((ctx: A, val: T) => ({ ...ctx, [k.toString()]: val }))(this.ctx)(value);

    return new AsyncOptionComputation(ctx as any);
  }

  public do(fn: (ctx: A) => Promise<void> | Async<void> | void): AsyncOptionComputation<A> {
    const ctx = this.ctx.toAsync().promise.then(ctx => {
      if (ctx.isNone) return ctx;

      const res = fn(ctx.value);

      if (res instanceof Async || res instanceof Promise) {
        const promise: Promise<void> = res instanceof Async ? res.promise : (res as Promise<void>);
        const ctx = promise.then(_ => this.ctx.toAsync().promise);

        return ctx;
      }

      return ctx;
    });

    return new AsyncOptionComputation(new AsyncOption(async(ctx)));
  }

  public return<T>(fn: (ctx: A) => T): AsyncOption<T> {
    return AsyncOption.map(fn)(this.ctx);
  }

  public ignore(): Async<void> {
    return AsyncOption.iter(_ => {})(this.ctx);
  }
}
