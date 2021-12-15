import { Async } from "./Async";
import { AsyncOption } from "./AsyncOption";
import { Dict } from "./Dict";
import { List, list } from "./List";
import { Option } from "./Option";
import { pipe, Pipe } from "./pipe";

/**
 * A lazy `List`.
 *
 * ### WARNING!
 * Any of `Seq`'s instance methods that returns anything that is not a `Seq` will evaluate the lazy `List` inside the `Seq`.
 * Take that into consideration and consider using `toList()` if you need to use multiple methods that return types
 * other than `Seq`.
 *
 * @see {@link List}
 */
export class Seq<A> {
  private constructor(private readonly _lazyList: () => List<A>) {}

  static new = <A>(...elements: A[]): Seq<A> => new Seq<A>(() => List.ofArray(elements));

  static ofList = <A>(list: List<A>): Seq<A> => new Seq(() => list);

  static ofArray = <A>(arr: A[]): Seq<A> => new Seq(() => List.ofArray(arr));

  static range = (start: number, end: number): Seq<number> => {
    return new Seq(() => List.range(start, end));
  };

  isEmpty(): boolean {
    return this._lazyList().isEmpty;
  }

  isNotEmpty(): boolean {
    return this._lazyList().isNotEmpty;
  }

  length(): number {
    return this._lazyList().length;
  }

  toList(): List<A> {
    return this._lazyList();
  }

  toArray(): A[] {
    return this._lazyList().toArray();
  }

  toString(): string {
    return this._lazyList().toString();
  }

  toJSON(): A[] {
    return this._lazyList().toJSON();
  }

  map<B>(fn: (a: A, i?: number) => B): Seq<B> {
    return new Seq(() => this._lazyList().map(fn));
  }

  choose<B>(fn: (a: A) => Option<B>): Seq<B> {
    return new Seq(() => this._lazyList().choose(fn));
  }

  flatMap<B>(fn: (a: A) => Seq<B>): Seq<B> {
    return new Seq(() => this._lazyList().flatMap(a => fn(a)._lazyList()));
  }

  iter(fn: (a: A, i?: number) => void): void {
    this._lazyList().iter(fn);
  }

  tee(fn: (a: A, i?: number) => void): Seq<A> {
    this._lazyList().iter(fn);

    return this;
  }

  filter(fn: (a: A) => boolean): Seq<A> {
    return new Seq(() => this._lazyList().filter(fn));
  }

  reject(fn: (a: A) => boolean): Seq<A> {
    return new Seq(() => this._lazyList().reject(fn));
  }

  rejectLast(): Seq<A> {
    return new Seq(() => this._lazyList().rejectLast());
  }

  add(a: A): Seq<A> {
    return new Seq(() => this._lazyList().add(a));
  }

  cons(a: A): Seq<A> {
    return new Seq(() => this._lazyList().cons(a));
  }

  removeAt(idx: number): Seq<A> {
    return new Seq(() => this._lazyList().removeAt(idx));
  }

  hasLength(n: number): boolean {
    return n === this._lazyList().length;
  }

  fold<State>(folder: (state: State, a: A) => State, state: State): State {
    return this._lazyList().fold(folder, state);
  }

  reduce(reducer: (accumulator: A, current: A) => A): A {
    return this._lazyList().reduce(reducer);
  }

  eq(seq: Seq<A>): boolean {
    return this._lazyList().eq(seq._lazyList());
  }

  pipe<B>(fn: (a: Seq<A>) => B): B {
    return fn(this);
  }

  toPipe(): Pipe<Seq<A>> {
    return pipe(this);
  }

  skipWhile(predicate: (a: A) => boolean): Seq<A> {
    return new Seq(() => this._lazyList().skipWhile(predicate));
  }

  skip(n: number): Seq<A> {
    return new Seq(() => this._lazyList().skip(n));
  }

  takeWhile(predicate: (a: A) => boolean): Seq<A> {
    return new Seq(() => this._lazyList().takeWhile(predicate));
  }

  take(n: number): Seq<A> {
    return new Seq(() => this._lazyList().take(n));
  }

  splitAt(idx: number): [Seq<A>, Seq<A>] {
    return [this.take(idx), this.skip(idx)];
  }

  contains(a: A): boolean {
    return this._lazyList().contains(a);
  }

  /**
   *  Returns a list that contains no duplicate entries
   */
  distinct(): Seq<A> {
    return new Seq(() => this._lazyList().distinct());
  }

  distinctBy<B>(projection: (a: A) => B): Seq<A> {
    return new Seq(() => this._lazyList().distinctBy(projection));
  }

  /**
   * Returns a new Seq that contains the elements of the first seq followed by elements of the second.
   */
  append(seq: Seq<A>): Seq<A> {
    return new Seq(() => this._lazyList().append(seq._lazyList()));
  }

  /**
   * Tests if any element of the seq satisfies the given predicate.
   */
  exists(predicate: (a: A) => boolean): boolean {
    return this._lazyList().exists(predicate);
  }

  /**
   *  Returns the first element for which the given function returns True. Return None if no such element exists.
   */
  find(predicate: (a: A) => boolean): Option<A> {
    return this._lazyList().find(predicate);
  }

  findIndex(predicate: (a: A) => boolean): Option<number> {
    return this._lazyList().findIndex(predicate);
  }

  /**
   *  Tests if all elements of the collection satisfy the given predicate.
   */
  forall(predicate: (a: A) => boolean): boolean {
    return this._lazyList().forall(predicate);
  }

  head(): Option<A> {
    return this._lazyList().head();
  }

  /**
   * Returns the list after removing the first element.
   */
  tail(): Seq<A> {
    return new Seq(() => this._lazyList().tail());
  }

  last(): Option<A> {
    return this._lazyList().last();
  }

  sort(): Seq<A> {
    return new Seq(() => this._lazyList().sort());
  }

  sortBy<B>(projection: (a: A) => B): Seq<A> {
    return new Seq(() => this._lazyList().sortBy(projection));
  }

  sortWith(comparison: (a: A, b: A) => number): Seq<A> {
    return new Seq(() => this._lazyList().sortWith(comparison));
  }

  max(): Option<A> {
    return this._lazyList().max();
  }

  maxBy<B>(projection: (a: A) => B): Option<A> {
    return this._lazyList().maxBy(projection);
  }

  min(): Option<A> {
    return this._lazyList().min();
  }

  minBy<B>(projection: (a: A) => B): Option<A> {
    return this._lazyList().minBy(projection);
  }

  sumBy(projection: (a: A) => number): number {
    return this._lazyList().sumBy(projection);
  }

  averageBy(projection: (a: A) => number): number {
    return this._lazyList().averageBy(projection);
  }

  pairwise(): Seq<[A, A]> {
    return new Seq(() => this._lazyList().pairwise());
  }

  /**
   * Splits the list into two lists, containing the elements for which the given predicate returns True and False respectively. Element order is preserved in both of the created lists.
   * @returns a tuple with a list of elements that pass the predicate and a list of elements that fail the predicate.
   */
  partition(predicate: (a: A) => boolean): [Seq<A>, Seq<A>] {
    const [fst, snd] = this._lazyList().partition(predicate);

    return [new Seq(() => fst), new Seq(() => snd)];
  }

  /**
   * Returns a new list with the distinct elements of the input list which do not appear in the itemsToExclude list.
   */
  except(itemsToExclude: List<A>): Seq<A> {
    return new Seq(() => this._lazyList().except(itemsToExclude));
  }

  /**
   * Returns a new list with its elements paired with their index (from 0).
   */
  indexed(): Seq<[number, A]> {
    return new Seq(() => this._lazyList().indexed());
  }

  item(index: number): Option<A> {
    return this._lazyList().item(index);
  }

  pick<B>(fn: (a: A) => Option<B>): Option<B> {
    return this._lazyList().pick(fn);
  }

  trace(msg?: string): Seq<A> {
    return new Seq(() => this._lazyList().trace(msg));
  }

  rev(): Seq<A> {
    return new Seq(() => this._lazyList().rev());
  }

  zip(seq: Seq<A>): Seq<[A, A]> {
    return new Seq(() => this._lazyList().zip(seq._lazyList()));
  }

  zip3(seq2: Seq<A>, seq3: Seq<A>): Seq<[A, A, A]> {
    return new Seq(() => this._lazyList().zip3(seq2._lazyList(), seq3._lazyList()));
  }

  countBy<B>(projection: (a: A) => B): Dict<B, number> {
    return this._lazyList().countBy(projection);
  }

  groupBy<B>(projection: (a: A) => B): Dict<B, List<A>> {
    return this._lazyList().groupBy(projection);
  }

  /**
   * Returns true if the lists contains the same elements regardless of order.
   */
  equivalent(seq: Seq<A>): boolean {
    return this._lazyList().equivalent(seq._lazyList());
  }
}

export const seq = Seq.new;
