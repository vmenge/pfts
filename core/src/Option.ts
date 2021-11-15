import { async } from "./Async";
import { AsyncOption } from "./AsyncOption";
import { list, List } from "./List";
import { pipe, Pipe } from "./pipe";
import { err, ok, Result } from "./Result";
import { Flatten } from "./type-utils";

export class Option<A> {
  private constructor(private readonly _value?: A) {}

  static create = <T>(value?: T): Option<NonNullable<T>> => new Option(value) as Option<NonNullable<T>>;

  static some = <T>(value: NonNullable<T>): Option<T> => new Option(value);

  static none = <T>(): Option<NonNullable<T>> => new Option<NonNullable<T>>();

  get value(): A {
    if (this._value === undefined) {
      throw new Error("Could not extract value from Option.");
    }

    return this._value;
  }

  get raw(): A | undefined {
    if (this._value === null) {
      return undefined;
    }

    return this._value;
  }

  get isSome(): boolean {
    return this._value !== undefined && this._value !== null;
  }

  get isNone(): boolean {
    return this._value === undefined || this._value === null;
  }

  map<B>(fn: (a: A) => B): Option<B> {
    if (this.isSome) {
      return option(fn(this._value!));
    }

    return none();
  }

  map2<B, C>(b: Option<B>, fn: (a: A, b: B) => C): Option<C> {
    if (this.isSome && b.isSome) {
      return option(fn(this._value!, b._value!));
    }

    return none();
  }

  map3<B, C, D>(b: Option<B>, c: Option<C>, fn: (a: A, b: B, c: C) => D): Option<D> {
    if (this.isSome && b.isSome && c.isSome) {
      return option(fn(this._value!, b._value!, c._value!));
    }

    return none();
  }

  bind<B>(fn: (a: A) => Option<B>): Option<B> {
    if (this.isSome) {
      return fn(this._value!);
    }

    return none();
  }

  contains(value: A): boolean {
    return this._value === value;
  }

  exists(predicate: (a: A) => boolean): boolean {
    return this.isSome && predicate(this._value!);
  }

  filter(predicate: (a: A) => boolean): Option<A> {
    return this.isSome && predicate(this._value!) ? some(this._value!) : none();
  }

  fold<State>(folder: (state: State, a: A) => State, state: State): State {
    return this.isSome ? folder(state, this._value!) : state;
  }

  iter(fn: (a: A) => void): void {
    if (this.isSome) {
      fn(this._value!);
    }
  }

  tee(fn: (a: A) => void): Option<A> {
    if (this.isSome) {
      fn(this._value!);
    }

    return this;
  }

  trace(msg?: string): Option<A> {
    const logStr = msg ? `${msg} ${this}` : `${this}`;
    console.log(logStr);

    return this;
  }

  defaultValue(value: A): A {
    if (this.isNone) {
      return value;
    }

    return this._value!;
  }

  defaultWith(fn: () => A): A {
    if (this.isNone) {
      return fn();
    }

    return this._value!;
  }

  toArray(): A[] {
    if (this.isNone) {
      return [];
    }

    return [this._value!];
  }

  toList(): List<A> {
    if (this.isNone) {
      return list();
    }

    return list(this._value!);
  }

  orElse(o: Option<A>): Option<A> {
    if (this.isNone) {
      return o;
    }

    return this;
  }

  orElseWith(fn: () => Option<A>): Option<A> {
    if (this.isNone) {
      return fn();
    }

    return this;
  }

  zip<B>(o: Option<B>): Option<[A, B]> {
    if (o.isSome && this.isSome) {
      return some([this._value!, o._value!]);
    }

    return none();
  }

  zip3<B, C>(o1: Option<B>, o2: Option<C>): Option<[A, B, C]> {
    if ((this.isSome, o1.isSome, o2.isSome)) {
      return some([this._value!, o1._value!, o2._value!]);
    }

    return none();
  }

  and<C, T extends [A, C]>(v: Option<C>): Option<Flatten<T>> {
    return this.zip(v).map(x => x.flat() as Flatten<T>);
  }

  andWith<C, T extends [A, C]>(fn: (a: A) => Option<C>): Option<Flatten<T>> {
    if (this.isSome) {
      const res = fn(this._value!);
      return this.zip(res).map(x => x.flat() as Flatten<T>);
    }

    return this as any as Option<Flatten<T>>;
  }

  toResult<B>(error: B): Result<A, B> {
    if (this.isNone) {
      return err(error);
    }

    return ok(this._value!);
  }

  match<B>(someFn: (a: A) => B, noneFn: () => B) {
    if (this.isSome) {
      return someFn(this._value!);
    }

    return noneFn();
  }

  toAsync(): AsyncOption<A> {
    return new AsyncOption(async(this));
  }

  toString(): string {
    if (this.isSome) {
      return `${this._value}`;
    }

    return "";
  }

  toJSON(): A | undefined {
    return this.raw;
  }

  pipe<B>(fn: (a: Option<A>) => B): B {
    return fn(this);
  }

  toPipe(): Pipe<Option<A>> {
    return pipe(this);
  }

  /**
   * Tries to extract a value from an Option.
   * @throws Error if Option is None.
   */
  static value = <T>(o: Option<T>) => o.value;

  static raw = <T>(o: Option<T>) => o.raw;

  static map =
    <A, B>(fn: (a: A) => B) =>
    (o: Option<A>): Option<B> =>
      o.map(fn);

  static map2 =
    <A, B, C>(fn: (a: A, b: B) => C) =>
    (o1: Option<A>) =>
    (o2: Option<B>): Option<C> =>
      o1.map2(o2, fn);

  static map3 =
    <A, B, C, D>(fn: (a: A, b: B, c: C) => D) =>
    (o1: Option<A>) =>
    (o2: Option<B>) =>
    (o3: Option<C>): Option<D> =>
      o1.map3(o2, o3, fn);

  static bind =
    <A, B>(fn: (a: A) => Option<B>) =>
    (o: Option<A>): Option<B> =>
      o.bind(fn);

  static apply =
    <A, B>(fn: Option<(a: A) => B>) =>
    (o: Option<A>): Option<B> =>
      Option.bind<(a: A) => B, B>(f => Option.bind<A, B>(x => option(f(x)))(o))(fn);

  static contains =
    <A>(value: A) =>
    (o: Option<A>): boolean =>
      o.contains(value);

  static exists =
    <A>(predicate: (a: A) => boolean) =>
    (o: Option<A>): boolean =>
      o.exists(predicate);

  static filter =
    <A>(predicate: (a: A) => boolean) =>
    (o: Option<A>): Option<A> =>
      o.filter(predicate);

  static flatten = <A>(o: Option<Option<A>>): Option<A> => (o.isSome ? o.value : none());

  static fold =
    <A, State>(folder: (state: State, a: A) => State) =>
    (state: State) =>
    (o: Option<A>): State =>
      o.fold(folder, state);

  static iter =
    <A>(fn: (a: A) => void) =>
    (o: Option<A>): void =>
      o.iter(fn);

  static forEach = Option.iter;

  static defaultValue =
    <A>(value: A) =>
    (o: Option<A>): A =>
      o.defaultValue(value);

  static toArray = <A>(o: Option<A>): Array<A> => o.toArray();

  static toList = <A>(o: Option<A>): List<A> => o.toList();

  /**
   * Given two options, returns the first option if the second one is None.
   */
  static orElse =
    <A>(o1: Option<A>) =>
    (o2: Option<A>): Option<A> =>
      o2.orElse(o1);

  /**
   * Given two options, returns the evaluation of the option returning function if the second option is None.
   */
  static orElseWith =
    <A>(oFn: () => Option<A>) =>
    (o: Option<A>): Option<A> =>
      o.orElseWith(oFn);

  /**
   * Returns 2 options tupled if they are all Some, otherwise returns None.
   */
  static zip =
    <A, B>(o1: Option<A>) =>
    (o2: Option<B>): Option<[A, B]> =>
      o1.zip(o2);

  /**
   * Returns 3 options tupled if they are all Some, otherwise returns None.
   */
  static zip3 =
    <A, B, C>(o1: Option<A>) =>
    (o2: Option<B>) =>
    (o3: Option<C>): Option<[A, B, C]> =>
      o1.zip3(o2, o3);

  static ofTruthy = <A>(a: A) => (a ? some(a!) : none());
  static ofFalsy = <A>(a: A) => (!a ? option(a) : none());

  /**
   * Given a pair of options, will return true if any of them are Some.
   */
  static any =
    <A, B>(o1: Option<A>) =>
    (o2: Option<B>): boolean =>
      o1.isSome || o2.isSome;

  static ofResult = <A, B>(r: Result<A, B>): Option<A> => (Result.isOk(r) ? option(r.value) : none());

  static toResult =
    <A, B>(error: B) =>
    (o: Option<A>): Result<A, B> =>
      o.toResult(error);

  static sequenceArray = <T>(ts: Option<T>[]): Option<T[]> => {
    let result = [];

    for (const t of ts) {
      if (t.isNone) {
        return none();
      }

      result.push(t.toArray());
    }

    return some(result.flat());
  };

  static sequenceList = <T>(ts: List<Option<T>>): Option<List<T>> => {
    let result = [];

    for (const t of ts) {
      if (t.isNone) {
        return none();
      }

      result.push(t.toArray());
    }

    return some(list(...result.flat()));
  };

  static ce = () => new OptionComputation(some({}));
}

export const some = Option.some;
export const none = Option.none;
export const option = Option.create;

class OptionComputation<A extends Object> {
  constructor(private readonly ctx: Option<A>) {}

  public let<K extends string, T>(
    k: K,
    other: Option<T> | ((ctx: A) => Option<T>)
  ): OptionComputation<A & { [k in K]: T }> {
    const value = Option.bind((ctx: A) => (typeof other === "object" ? other : other(ctx)))(this.ctx);
    const ctx = Option.map2((ctx: A, val: T) => ({ ...ctx, [k.toString()]: val }))(this.ctx)(value);

    return new OptionComputation(ctx as any);
  }

  public do(fn: (ctx: A) => void): OptionComputation<A> {
    this.ctx.iter(fn);

    return new OptionComputation(this.ctx as any);
  }

  public return<T>(fn: (ctx: A) => T): Option<T> {
    return Option.map(fn)(this.ctx);
  }

  public ignore(): Option<void> {
    return Option.map(() => {})(this.ctx);
  }
}
