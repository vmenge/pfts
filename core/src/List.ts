import { compose } from "./compose";
import { pipe, Pipe } from "./pipe";
import { none, option, Option, some } from "./Option";
import { add, greaterThan, lessThan, not, subt } from "./utils";
import { Result } from "./Result";
import { Dict } from "./Dict";
import { AsyncOption } from "./AsyncOption";
import { async, Async } from "./Async";
import { Seq } from "./Seq";

export class List<A> {
  private constructor(private readonly _elements: Array<A>) {}

  static create = <A>(...elements: A[]): List<A> => new List<A>(elements);

  static ofArray = <A>(arr: A[]): List<A> => new List(arr);

  static range = (start: number, end: number): List<number> => {
    const first = Math.trunc(start);
    const last = Math.trunc(end);
    let result = [first];
    let current = first;
    let comparison = last > first ? greaterThan : lessThan;
    let operation = last > first ? add : subt;

    while (comparison(last)(current)) {
      current = operation(current)(1);
      result.push(current);
    }

    return new List(result);
  };

  get length(): number {
    return this._elements.length;
  }

  get isEmpty(): boolean {
    return this._elements.length === 0;
  }

  get isNotEmpty(): boolean {
    return this._elements.length > 0;
  }

  toSeq(): Seq<A> {
    return Seq.ofList(this);
  }

  map<B>(fn: (a: A, i?: number) => B): List<B> {
    return new List(this._elements.map(fn));
  }

  choose<B>(fn: (a: A) => Option<B>): List<B> {
    let result = [];

    for (const x of this._elements) {
      const res = fn(x);

      if (res.isSome) {
        result.push(res.raw!);
      }
    }

    return new List(result);
  }

  chooseAsync<B>(fn: (a: A) => AsyncOption<B>): Async<List<B>>;
  chooseAsync<B>(fn: (a: A) => Async<Option<B>>): Async<List<B>>;
  chooseAsync<B>(fn: (a: A) => Promise<Option<B>>): Async<List<B>>;
  chooseAsync<B>(fn: (a: A) => AsyncOption<B> | Async<Option<B>> | Promise<Option<B>>): Async<List<B>> {
    let result = this._elements.map(a => {
      const res = fn(a);

      if (res instanceof AsyncOption) {
        return res.toAsync();
      }

      if (res instanceof Promise) {
        return async(res);
      }

      return res;
    });

    return Async.sequenceArray(result).map(List.ofArray).map(List.rejectNones);
  }

  flatMap<B>(fn: (a: A) => List<B>): List<B> {
    return new List(this._elements.flatMap(a => fn(a)._elements));
  }

  iter(fn: (a: A, i?: number) => void): void {
    this._elements.forEach(fn);
  }

  tee(fn: (a: A) => void): List<A> {
    this._elements.forEach(x => fn(x));

    return this;
  }

  filter(fn: (a: A) => boolean): List<A> {
    return new List(this._elements.filter(x => fn(x)));
  }

  reject(fn: (a: A) => boolean): List<A> {
    return this.filter(a => not(fn(a)));
  }

  rejectLast(): List<A> {
    const rejectIndex = this._elements.length - 1;

    if (rejectIndex >= 0) {
      return new List(this._elements.slice(0, rejectIndex));
    }

    return this;
  }

  add(a: A): List<A> {
    return new List([...this._elements, a]);
  }

  cons(a: A): List<A> {
    return new List([a, ...this._elements]);
  }

  removeAt(idx: number): List<A> {
    if (idx < 0 || idx >= this._elements.length) {
      return this;
    }

    return new List([...this._elements.slice(0, idx), ...this._elements.slice(idx + 1)]);
  }

  hasLength(n: number): boolean {
    return n === this._elements.length;
  }

  fold<State>(folder: (state: State, a: A) => State, state: State): State {
    return this._elements.reduce(folder, state);
  }

  reduce(reducer: (accumulator: A, current: A) => A): A {
    return this._elements.reduce(reducer);
  }

  *[Symbol.iterator]() {
    for (const el of this._elements) {
      yield el;
    }

    return;
  }

  toArray(): A[] {
    return [...this._elements];
  }

  toString(): string {
    const separator = this.length >= 4 ? ",\n  " : ", ";
    return `[ ${this._elements.map(x => JSON.stringify(x)).join(separator)} ]`;
  }

  toJSON(): A[] {
    return this._elements;
  }

  pipe<B>(fn: (a: List<A>) => B): B {
    return fn(this);
  }

  toPipe(): Pipe<List<A>> {
    return pipe(this);
  }

  skipWhile(predicate: (a: A) => boolean): List<A> {
    const idx = this._elements.findIndex(x => !predicate(x));
    if (idx === -1) return list();

    return this.skip(idx);
  }

  skip(n: number): List<A> {
    if (n < 1) {
      return this;
    }

    return new List(this._elements.slice(n));
  }

  takeWhile(predicate: (a: A) => boolean): List<A> {
    const idx = this._elements.findIndex(x => !predicate(x));
    if (idx === -1) return list();

    return this.take(idx);
  }

  take(n: number): List<A> {
    if (n < 1) {
      return list();
    }

    return new List(this._elements.slice(0, n));
  }

  splitAt(idx: number): [List<A>, List<A>] {
    return [this.take(idx), this.skip(idx)];
  }

  contains(a: A): boolean {
    return this._elements.includes(a);
  }

  /**
   *  Returns a list that contains no duplicate entries
   */
  distinct(): List<A> {
    return new List(Array.from(new Set(this._elements)));
  }

  distinctBy<B>(projection: (a: A) => B): List<A> {
    const map = new Map<B, A>();

    for (const x of this._elements) {
      const p = projection(x);

      if (!map.has(p)) {
        map.set(p, x);
      }
    }

    return new List(Array.from(map.values()));
  }

  /**
   * Returns a new list that contains the elements of the first list followed by elements of the second.
   */
  append(list: List<A>): List<A> {
    return List.create(...this._elements, ...list._elements);
  }

  /**
   * Tests if any element of the list satisfies the given predicate.
   */
  exists(predicate: (a: A) => boolean): boolean {
    return this._elements.some(predicate);
  }

  /**
   *  Returns the first element for which the given function returns True. Return None if no such element exists.
   */
  find(predicate: (a: A) => boolean): Option<A> {
    return option(this._elements.find(predicate));
  }

  findIndex(predicate: (a: A) => boolean): Option<number> {
    const idx = this._elements.findIndex(predicate);
    if (idx === -1) return none();

    return some(idx);
  }

  /**
   *  Tests if all elements of the collection satisfy the given predicate.
   */
  forall(predicate: (a: A) => boolean): boolean {
    return this._elements.every(predicate);
  }

  head(): Option<A> {
    return option(this._elements[0]);
  }

  /**
   * Returns the list after removing the first element.
   */
  tail(): List<A> {
    return this.skip(1);
  }

  last(): Option<A> {
    if (this.length < 1) {
      return none();
    }

    return option(this._elements[this.length - 1]);
  }

  sort(): List<A> {
    return new List([...this._elements].sort());
  }

  sortBy<B>(projection: (a: A) => B): List<A> {
    return new List(
      [...this._elements].sort((a, b) => {
        const fst = projection(a);
        const snd = projection(b);

        if (fst < snd) {
          return -1;
        } else if (fst > snd) {
          return 1;
        }

        return 0;
      })
    );
  }

  sortWith(comparison: (a: A, b: A) => number): List<A> {
    return new List([...this._elements].sort(comparison));
  }

  max(): Option<A> {
    return this.sort().last();
  }

  maxBy<B>(projection: (a: A) => B): Option<A> {
    if (this._elements.length < 1) {
      return none();
    }

    return this.sortBy(projection).last();
  }

  min(): Option<A> {
    return this.sort().head();
  }

  minBy<B>(projection: (a: A) => B): Option<A> {
    if (this._elements.length < 1) {
      return none();
    }

    return this.sortBy(projection).head();
  }

  sumBy(projection: (a: A) => number): number {
    return this.fold((sum, current) => sum + projection(current), 0);
  }

  averageBy(projection: (a: A) => number): number {
    return this.fold((sum, current) => sum + projection(current), 0) / this.length;
  }

  pairwise(): List<[A, A]> {
    let result: [A, A][] = [];

    for (let i = 0; i + 1 < this._elements.length; i++) {
      result.push([this._elements[i], this._elements[i + 1]]);
    }

    return new List(result);
  }

  /**
   * Splits the list into two lists, containing the elements for which the given predicate returns True and False respectively. Element order is preserved in both of the created lists.
   * @returns a tuple with a list of elements that pass the predicate and a list of elements that fail the predicate.
   */
  partition(predicate: (a: A) => boolean): [List<A>, List<A>] {
    let trues = [];
    let falses = [];

    for (const a of this._elements) {
      if (predicate(a)) {
        trues.push(a);
      } else {
        falses.push(a);
      }
    }

    return [new List(trues), new List(falses)];
  }

  /**
   * Returns a new list with the distinct elements of the input list which do not appear in the itemsToExclude list.
   */
  except(itemsToExclude: List<A>): List<A> {
    return this.distinct().reject(x => itemsToExclude.contains(x));
  }

  /**
   * Returns a new list with its elements paired with their index (from 0).
   */
  indexed(): List<[number, A]> {
    return new List(this._elements.map((x, i) => [i, x] as [number, A]));
  }

  item(index: number): Option<A> {
    return option(this._elements[index]);
  }

  pick<B>(fn: (a: A) => Option<B>): Option<B> {
    for (const x of this._elements) {
      const res = fn(x);
      if (res.isSome) return res;
    }

    return none();
  }

  trace(msg?: string): List<A> {
    const logStr = msg ? `${msg} ${this}` : `${this}`;
    console.log(logStr);

    return this;
  }

  rev(): List<A> {
    return new List([...this._elements].reverse());
  }

  zip(list: List<A>): List<[A, A]> {
    if (this.length !== list.length) {
      throw new Error("Only lists that have equal length can be zipped.");
    }

    let res: [A, A][] = [];

    for (let i = 0; i < this.length; i++) {
      res.push([this._elements[i], list._elements[i]]);
    }

    return new List(res);
  }

  zip3(list2: List<A>, list3: List<A>): List<[A, A, A]> {
    if (this.length !== list2.length || list2.length !== list3.length) {
      throw new Error("Only lists that have equal length can be zipped.");
    }

    let res: [A, A, A][] = [];

    for (let i = 0; i < this.length; i++) {
      res.push([this._elements[i], list2._elements[i], list3._elements[i]]);
    }

    return new List(res);
  }

  countBy<B>(projection: (a: A) => B): List<[B, number]> {
    const map: Map<B, number> = new Map();

    for (const x of this._elements) {
      const res = projection(x);
      const current = map.get(res) ?? 0;
      map.set(res, current + 1);
    }

    return new List(Array.from(map.entries()));
  }

  groupBy<B>(projection: (a: A) => B): Dict<B, List<A>> {
    const map: Map<B, List<A>> = new Map();

    for (const x of this._elements) {
      const res = projection(x);
      const current = map.get(res) ?? list();
      map.set(res, current.add(x));
    }

    return Dict.ofMap(map);
  }

  /**
   * Returns true if the lists contains the same elements regardless of order.
   */
  equivalent(list: List<A>): boolean {
    if (this.length !== list.length) return false;

    return this._elements.every(x => {
      const count1 = this._elements.filter(y => y === x).length;
      const count2 = list._elements.filter(y => y === x).length;

      return count1 === count2;
    });
  }

  static rejectNones<B>(optList: List<Option<B>>): List<B> {
    return optList.choose(x => x);
  }

  static rejectErrors<B, C>(resultList: List<Result<B, C>>): List<B> {
    let res = [];

    for (const x of resultList) {
      if (x.isOk) {
        res.push(x.value);
      }
    }

    return new List(res);
  }

  static partitionResults<B, C>(resultList: List<Result<B, C>>): [List<B>, List<C>] {
    let oks = [];
    let errs = [];

    for (const r of resultList) {
      if (r.isOk) {
        oks.push(r.value);
      }

      errs.push(r.errToArray());
    }

    return [new List(oks), new List(errs.flat())];
  }

  static sum(list: List<number>): number {
    return list.fold((a, c) => a + c, 0);
  }

  static average(list: List<number>): number {
    return List.sum(list) / list.length;
  }

  static concat<B>(list: List<List<B>>): List<B> {
    return list.flatMap(x => x);
  }

  /**
   * Creates a list by calling the given initializer on each index.
   */
  static init =
    <B>(count: number) =>
    (initializer: (n: number) => B): List<B> => {
      return List.range(0, count - 1).map(initializer);
    };

  static replicate =
    <B>(count: number) =>
    (value: B): List<B> => {
      return List.init<B>(count)(() => value);
    };

  static unzip<A, B>(list: List<[A, B]>): [List<A>, List<B>] {
    let fst = [];
    let snd = [];

    for (const x of list) {
      fst.push(x[0]);
      snd.push(x[1]);
    }

    return [new List(fst), new List(snd)];
  }

  static unzip3<A, B, C>(list: List<[A, B, C]>): [List<A>, List<B>, List<C>] {
    let fst = [];
    let snd = [];
    let trd = [];

    for (const x of list) {
      fst.push(x[0]);
      snd.push(x[1]);
      trd.push(x[2]);
    }

    return [new List(fst), new List(snd), new List(trd)];
  }
}

export const list = List.create;
