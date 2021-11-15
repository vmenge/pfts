import { none, option, Option } from "./Option";
import { list, List } from "./List";
import { err, ok, Result } from "./Result";
import { Flatten, NonVoid } from "./type-utils";

export class Async<A> {
  public readonly promise: Promise<A>;

  private constructor(value: A | Promise<A>) {
    if (value instanceof Promise) {
      this.promise = value;
    }

    this.promise = Promise.resolve(value);
  }

  static create = <A>(a: A | Promise<A>): Async<A> => new Async(a);
  static ofPromise = <A>(a: Promise<A>): Async<A> => new Async(a);

  toPromise(): Promise<A> {
    return this.promise;
  }

  map<B>(fn: (a: A) => B): Async<B> {
    return async(this.promise.then(fn));
  }

  map2<B, C>(b: Async<B>, fn: (a: A, b: B) => C): Async<C>;
  map2<B, C>(b: Promise<B>, fn: (a: A, b: B) => C): Async<C>;
  map2<B, C>(b: Async<B> | Promise<B>, fn: (a: A, b: B) => C): Async<C> {
    const x = b instanceof Promise ? b : b.promise;

    const result = Promise.all([this.promise, x]).then(res => fn(res[0], res[1]));

    return async(result);
  }

  bind<B>(fn: (a: A) => Async<B>): Async<B>;
  bind<B>(fn: (a: A) => Promise<B>): Async<B>;
  bind<B>(fn: (a: A) => Async<B> | Promise<B>): Async<B> {
    const result = this.promise.then(a => {
      const res = fn(a);

      return res instanceof Async ? res.promise : res;
    });

    return async(result);
  }

  iter(fn: (a: A) => void): Async<void> {
    return async(this.promise.then(fn));
  }

  tee(fn: (a: A) => void): Async<A> {
    return this.map(a => {
      fn(a);
      return a;
    });
  }

  zip<B>(b: Async<B>): Async<[A, B]>;
  zip<B>(b: Promise<B>): Async<[A, B]>;
  zip<B>(b: Async<B> | Promise<B>): Async<[A, B]> {
    return this.bind(a => Async.normalize(b).map(b => [a, b]));
  }

  zip3<B, C>(b: Async<B>, c: Async<C>): Async<[A, B, C]> {
    return this.bind(a => b.bind(b => c.map(c => [a, b, c])));
  }

  and<C, T extends [A, C]>(v: Async<C>): Async<Flatten<T>>;
  and<C, T extends [A, C]>(v: Promise<C>): Async<Flatten<T>>;
  and<C, T extends [A, C]>(v: Async<C> | Promise<C>): Async<Flatten<T>> {
    return this.zip(Async.normalize(v)).map(x => x.flat() as Flatten<T>);
  }

  andWith<C, T extends [A, C]>(fn: (a: A) => Async<NonVoid<C>>): Async<Flatten<T>>;
  andWith<C, T extends [A, C]>(fn: (a: A) => Promise<NonVoid<C>>): Async<Flatten<T>>;
  andWith<C, T extends [A, C]>(fn: (a: A) => Async<NonVoid<C>> | Promise<NonVoid<C>>): Async<Flatten<T>> {
    const res = this.bind(x => Async.normalize(fn(x)));

    return this.zip(res).map(x => x.flat() as Flatten<T>);
  }

  static normalize = <A>(a: Async<A> | Promise<A>): Async<A> => (a instanceof Async ? a : async(a));

  static map =
    <A, B>(fn: (a: A) => B) =>
    (a: Async<A> | Promise<A>): Async<B> =>
      Async.normalize(a).map(fn);

  static map2 =
    <A, B, C>(fn: (a: A, b: B) => C) =>
    (a1: Async<A> | Promise<A>) =>
    (a2: Async<B> | Promise<B>): Async<C> =>
      Async.normalize(a1).map2(Async.normalize(a2), fn);

  static bind =
    <A, B>(fn: (a: A) => Async<B> | Promise<B>) =>
    (x: Async<A> | Promise<A>): Async<B> =>
      Async.normalize(x).bind(y => Async.normalize(fn(y)));

  static iter =
    <A>(fn: (a: A) => void) =>
    (x: Async<A> | Promise<A>): Async<void> =>
      Async.normalize(x).iter(fn);

  static sequenceArray<A>(xs: Async<A>[]): Async<A[]>;
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

  static sequenceList<A>(as: List<Async<A>>): Async<List<A>>;
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

  static sequenceOption<A>(oa: Option<Async<A>>): Async<Option<A>> {
    if (oa.isSome) {
      return oa.raw!.map(option);
    }

    return async(none());
  }

  static sequenceResult<A, B>(ra: Result<Async<A>, B>): Async<Result<A, B>> {
    if (ra.isOk) {
      return ra.value.map(ok);
    }

    return async(err(ra.err));
  }

  static sequenceErr<A, B>(ra: Result<A, Async<B>>): Async<Result<A, B>> {
    if (ra.isOk) {
      return async(ok(ra.value));
    }

    return ra.err.map(err);
  }

  static sleep = (ms: number): Async<void> => async(new Promise(resolve => setTimeout(() => resolve(), ms)));

  static flatten = <A>(aa: Async<Async<A>>): Async<A> => aa.bind(x => x);

  static ce = () => new AsyncComputation(async({}));
}

export const async = Async.create;

class AsyncComputation<A extends Object> {
  constructor(private readonly ctx: Async<A>) {}

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

  public return<T>(fn: (ctx: A) => T): Async<T> {
    return Async.map(fn)(this.ctx);
  }

  public ignore(): Async<void> {
    return Async.iter(_ => {})(this.ctx);
  }
}
