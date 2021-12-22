import { compose } from "./compose";
import { pipe, Pipe } from "./pipe";
import { none, option, Option, some } from "./Option";
import { add, greaterThan, lessThan, not, subt } from "./utils";
import { Result } from "./Result";
import { Dict } from "./Dict";
import { AsyncOption } from "./AsyncOption";
import { async, Async } from "./Async";
import { Seq } from "./Seq";

/**
 * A zero-indexed immutable collection of elements.
 * @example
 * const x = list(10, 21, 99);
 *
 * expect(x.item(0).value).toEqual(10);
 * expect(x.item(1).value).toEqual(21);
 * expect(x.item(2).value).toEqual(99);
 */
export class List<A> {
  private constructor(private readonly _elements: Array<A>) {}

  /**
   * `new: (...A) -> List<A>`
   *
   * ---
   * Creates a new List<A>.
   * @example
   * const a = List.new("x", "y", "z");
   *
   * expect(a.item(1).value).toEqual("y");
   * expect(a.length).toEqual(3);
   */
  static new = <A>(...elements: A[]): List<A> => new List<A>(elements);

  /**
   * `ofArray: A[] -> List<A>`
   *
   * ---
   * Creates a `List<A>` from an `A[]`.
   * @example
   * const actual = List.ofArray([8, 4, 1]);
   * const expected = list(8, 4, 1);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  static ofArray = <A>(arr: A[]): List<A> => new List(arr);

  /**
   * `range: (number, number) -> List<number>`
   *
   * ---
   * Creates an inclusive list, from `start` to `end`.
   * @param start starting number (inclusive).
   * @param end ending number (inclusive).
   * @example
   * const actual = List.range(1, 5);
   * const expected = list(1, 2, 3, 4, 5);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
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

  /**
   * Returns the number of elements the `List<A>` has.
   * @example
   * const a = list(9, 9, 3, 2, 3);
   *
   * expect(a.length).toEqual(5);
   */
  get length(): number {
    return this._elements.length;
  }

  /**
   * Returns true if the `List<A>` has no elements.
   * @example
   * const x = list();
   * expect(x.isEmpty).toEqual(true);
   *
   * const y = list("hello", "world");
   * expect(y.isEmpty).toEqual(false);
   */
  get isEmpty(): boolean {
    return this._elements.length === 0;
  }

  /**
   * Returns true if the `List<A>` is not empty.
   * @example
   * const x = list("hello", "world");
   * expect(x.isNotEmpty).toEqual(true);
   *
   * const y = list();
   * expect(y.isNotEmpty).toEqual(false);
   */
  get isNotEmpty(): boolean {
    return this._elements.length > 0;
  }

  /**
   * `this: List<A>`
   *
   * `toSeq: () -> Seq<A>`
   *
   * ---
   * Converts a `List<A>` to a `Seq<A>`.
   * @see {@link Seq}
   * @example
   * const actual = list(1, 2, 3).toSeq();
   * const expected = seq(1, 2, 3);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  toSeq(): Seq<A> {
    return Seq.ofList(this);
  }

  /**
   * `this: List<A>`
   *
   * `map: ((A, (number | undefined)) -> B) -> List<B>`
   *
   * ---
   * @param fn mapping function that will be called on each element in the list, receiving the element and its (optional) index as an argument.
   * @returns a `List<B>` with the mapped values.
   * @example
   * const atual = list(1, 2, 3).map(x => x * 2);
   * const expected = list(2, 4, 6);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  map<B>(fn: (a: A, i?: number) => B): List<B> {
    return new List(this._elements.map(fn));
  }

  /**
   * `this: List<A>`
   *
   * `choose: (A -> Option<B>) -> List<B>`
   *
   * ---
   * The equivalent of calling `filter` and then `map` on a `List<A>`.
   * @param fn a function that returns an `Option<B>` from each element of the `List<A>`
   * @returns a `List<B>` only with the elements that returned `Some` when `fn` was applied.
   * @example
   * const actual = list(1, 2, 3, 4)
   *   .choose(x => x % 2 === 0 ? some(x + 10) : none());
   * const expected = list(12, 14);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
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

  /**
   * `this: List<A>`
   *
   * `choose: (A -> AsyncOption<B>) -> Async<List<B>>`
   *
   * ---
   * The equivalent of calling `filter` and then `map` on a `List<A>`.
   * @param fn a function that returns an `AsyncOption<B>` from each element of the `List<A>`
   * @returns a `List<B>` only with the elements that returned `Some` when `fn` was applied.
   * @example
   * list(1, 2, 3, 4)
   *   .choose(x => {
   *     if(x % 2 === 0) {
   *       return some(x + 10).toAsyncOption();
   *     }
   *
   *     return none().toAsyncOption();
   *   })
   *   .iter(actual => {
   *     const expected = list(12, 14);
   *     expect(actual.eq(expected)).toEqual(true);
   *   })
   */
  chooseAsync<B>(fn: (a: A) => AsyncOption<B>): Async<List<B>>;
  /**
   * `this: List<A>`
   *
   * `choose: (A -> Async<Option<B>>) -> Async<List<B>>`
   *
   * ---
   * The equivalent of calling `filter` and then `map` on a `List<A>`.
   * @param fn a function that returns an `Async<Option<B>>` from each element of the `List<A>`
   * @returns a `List<B>` only with the elements that returned `Some` when `fn` was applied.
   * @example
   * list(1, 2, 3, 4)
   *   .choose(x => {
   *     if(x % 2 === 0) {
   *       return async(some(x + 10));
   *     }
   *
   *     return async(none());
   *   })
   *   .iter(actual => {
   *     const expected = list(12, 14);
   *     expect(actual.eq(expected)).toEqual(true);
   *   })
   */
  chooseAsync<B>(fn: (a: A) => Async<Option<B>>): Async<List<B>>;
  /**
   * `this: List<A>`
   *
   * `choose: (A -> Promise<Option<B>>) -> Async<List<B>>`
   *
   * ---
   * The equivalent of calling `filter` and then `map` on a `List<A>`.
   * @param fn a function that returns an `Promise<Option<B>>` from each element of the `List<A>`
   * @returns a `List<B>` only with the elements that returned `Some` when `fn` was applied.
   * @example
   * list(1, 2, 3, 4)
   *   .choose(x => {
   *     if(x % 2 === 0) {
   *       return Promise.resolve(some(x + 10));
   *     }
   *
   *     return Promise.resolve(none());
   *   })
   *   .iter(actual => {
   *     const expected = list(12, 14);
   *     expect(actual.eq(expected)).toEqual(true);
   *   })
   */
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

  /**
   * `this: List<A>`
   *
   * `flatMap: (A -> List<B>) -> List<B>`
   *
   * ---
   * Calls a mapping function on each element of `List<A>`, then flattens the result.
   * @example
   * const actual = list(1, 2, 3).flatMap(x => list(x + 10, x + 20));
   * const expected = list(11, 21, 12, 22, 13, 23);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  flatMap<B>(fn: (a: A) => List<B>): List<B> {
    return new List(this._elements.flatMap(a => fn(a)._elements));
  }

  /**
   * `this: List<A>`
   *
   * `iter: ((A, number | undefined) -> ()) -> ()`
   *
   * ---
   * Calls the sepcified function on each element of `List<A>`.
   * @example
   * let sum = 0;
   * list(1, 2, 3).iter(x => (sum += x));
   *
   * expect(sum).toEqual(6);
   */
  iter(fn: (a: A, i?: number) => void): void {
    this._elements.forEach(fn);
  }

  /**
   * `this: List<A>`
   *
   * `tee: ((A, number | undefined) -> ()) -> List<A>`
   *
   * ---
   * Calls the sepcified function on each element of `List<A>`.
   * @returns the same instance of `List<A>`.
   * @example
   * let sum = 0;
   * const actual = list(1, 2, 3).tee(x => (sum += x));
   * const expected = list(1, 2, 3);
   *
   * expect(sum).toEqual(6);
   * expect(actual.eq(expected)).toEqual(true);
   */
  tee(fn: (a: A, i?: number) => void): List<A> {
    this._elements.forEach(fn);

    return this;
  }

  /**
   * `this: List<A>`
   *
   * `filter: (A -> boolean) -> List<A>`
   *
   * ---
   * @param fn predicate to be evaluated against each element of `List<A>`
   * @returns `List<A>` with only the elements for which `fn` returned true.
   * @example
   * const actual = list(1, 2, 3, 4).filter(x => x % 2 === 0);
   * const expected = list(2, 4);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  filter(fn: (a: A) => boolean): List<A> {
    return new List(this._elements.filter(x => fn(x)));
  }

  /**
   * `this: List<A>`
   *
   * `reject: (A -> boolean) -> List<A>`
   *
   * ---
   * @param fn predicate to be evaluated against each element of `List<A>`
   * @returns `List<A>` without the elements for which `fn` returned true.
   * @example
   * const actual = list(1, 2, 3, 4).reject(x => x % 2 === 0);
   * const expected = list(1, 3);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  reject(fn: (a: A) => boolean): List<A> {
    return this.filter(a => not(fn(a)));
  }

  /**
   * `this: List<A>`
   *
   * `rejectLast: () -> List<A>`
   *
   * ---
   * @returns a copy of `List<A>` without the last element.
   * @example
   * const actual1 = list(1, 2, 3).rejectLast();
   * const expected1 = list(1, 2);
   * expect(actual1.eq(expected1)).toEqual(true);
   *
   * const actual2 = list().rejectLast();
   * const expected2 = list();
   * expect(actual2.eq(expected2)).toEqual(true;)
   */
  rejectLast(): List<A> {
    const rejectIndex = this._elements.length - 1;

    if (rejectIndex >= 0) {
      return new List(this._elements.slice(0, rejectIndex));
    }

    return this;
  }

  /**
   * `this: List<A>`
   *
   * `add: A -> List<A>`
   *
   * ---
   * Adds an element to the end of the list.
   * @example
   * const actual = list(1, 2).add(3);
   * const expected = list(1, 2, 3);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  add(a: A): List<A> {
    return new List([...this._elements, a]);
  }

  /**
   * `this: List<A>`
   *
   * `cons: A -> List<A>`
   *
   * ---
   * Adds an element to the beginning of the list.
   * @example
   * const actual = list(2, 3).cons(1);
   * const expected = list(1, 2, 3);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  cons(a: A): List<A> {
    return new List([a, ...this._elements]);
  }

  /**
   * `this: List<A>`
   *
   * `removeAt: number -> List<A>`
   *
   * ---
   * Removes an element at the specified index of `List<A>`.
   * @example
   * const actual = list(44, 55, 66).removeAt(1);
   * const expected = list(44, 66);
   * expect(actual1.eq(expected1)).toEqual(true);
   *
   * const x = list(9, 10, 11).removeAt(-1);
   * expect(x.eq(x)).toEqual(true);
   *
   * const y = list("one", "two").removeAt(5);
   * expect(y.eq(y)).toEqual(true);
   */
  removeAt(idx: number): List<A> {
    if (idx < 0 || idx >= this._elements.length) {
      return this;
    }

    return new List([...this._elements.slice(0, idx), ...this._elements.slice(idx + 1)]);
  }

  /**
   * `this: List<A>`
   *
   * `hasLength: number -> boolean`
   *
   * ---
   * @returns true if `List<A>` has the specified length.
   * @example
   * const a = list(14, 9, 11).hasLength(3);
   * expect(a).toEqual(true);
   *
   * const b = list(1, 2).hasLength(9);
   * expect(b).toEqual(false);
   */
  hasLength(n: number): boolean {
    return n === this._elements.length;
  }

  /**
   * `this: List<A>`
   *
   * `fold: (((State, A) -> State), State) -> State`
   *
   * ---
   * Calls the specified `folder` function for all the elements of `List<A>`. The return value of
   * the `folder` is the accumulated result, and is provided as an argument in the next call to the `folder`.
   * @param folder the `folder` function to be applied to every element of `List<A>`.
   * @param state the initial `State` to be passed to the `folder`.
   * @example
   * const sum = list(1, 2, 3).fold((state, x) => x + state, 10);
   * expect(sum).toEqual(16);
   */
  fold<State>(folder: (state: State, a: A) => State, state: State): State {
    return this._elements.reduce(folder, state);
  }

  /**
   * `this: List<A>`
   *
   * `reduce: ((A, A) -> A) -> A`
   *
   * ---
   * Calls the specified `reducer` function for all the elements of `List<A>`. The return value of
   * the `reducer` is the accumulated result, and is provided as an argument in the next call to the `reducer`.
   * The first element of the `List<A>` is used as initial value for the `reducer`.
   * @param reducer the `reducer` function to be applied to every element of `List<A>`.
   * @example
   * const sum = list(1, 2, 3).reduce((accumulator, current) => accumulator + current);
   * expect(sum).toEqual(6);
   */
  reduce(reducer: (accumulator: A, current: A) => A): A {
    return this._elements.reduce(reducer);
  }

  *[Symbol.iterator]() {
    for (const el of this._elements) {
      yield el;
    }

    return;
  }

  /**
   * `this: List<A>`
   *
   * `eq: List<A> -> boolean`
   *
   * ---
   * Compares two lists returning true if all elements in the same index return `true` when compared to each other with `===`.
   * @example
   * const a = list(1, 2, 3);
   * const b = list(1, 2, 3);
   *
   * expect(a.eq(b)).toEqual(true);
   */
  eq(list: List<A>): boolean {
    if (this.length !== list.length) return false;

    for (let i = 0; i < this.length; i++) {
      if (this._elements[i] !== list._elements[i]) return false;
    }

    return true;
  }

  /**
   * `this: List<A>`
   *
   * `eqBy: (A -> B) -> boolean`
   *
   * ---
   * Compares two lists returning true if all elements in the same index return `true` when compared with the results of the `projection` function.
   * @param list second `List<A>` to be compared to this one.
   * @param projection function used to generate the value to compare elements with.
   * @example
   * const a = list({ name: 'john' }, { name: 'joe' });
   * const b = list({ name: 'john' }, { name: 'joe' });
   *
   * expect(a.eqBy(b, x => x.name)).toEqual(true);
   */
  eqBy<B>(list: List<A>, projection: (a: A) => B): boolean {
    if (this.length !== list.length) return false;

    for (let i = 0; i < this.length; i++) {
      if (projection(this._elements[i]) !== projection(list._elements[i])) return false;
    }

    return true;
  }

  /**
   * `this: List<A>`
   *
   * `toArray: () -> A[]`
   *
   * ---
   * @example
   * const x = list(1, 2, 3).toArray();
   * expect(x).toEqual([1, 2, 3]);
   */
  toArray(): A[] {
    return [...this._elements];
  }

  /**
   * `this: List<A>`
   *
   * `toString(): () -> string`
   *
   * ---
   */
  toString(): string {
    const separator = this.length >= 4 ? ",\n  " : ", ";
    return `[ ${this._elements.map(x => JSON.stringify(x)).join(separator)} ]`;
  }

  toJSON(): A[] {
    return this._elements;
  }

  /**
   * `this: List<A>`
   *
   * `pipe: (List<A> -> B) -> B`
   *
   * ---
   * Takes an function to be executed on this current `List` instance, facilitating function chaining.
   * @example
   * const a = list(1, 2, 3).pipe(List.sum);
   * expect(a).toEqual(6);
   */
  pipe<B>(fn: (a: List<A>) => B): B {
    return fn(this);
  }

  /**
   * `this: List<A>`
   *
   * `toPipe: (List<A> -> B) -> Pipe<B>`
   *
   * ---
   * Wraps the result of the function from the args in a `Pipe`.
   * @example
   * const a = list(1, 2, 3)
   *   .toPipe(List.sum)
   *   .return(x => `sum is: ${x}`);
   *
   * expect(a).toEqual("sum is 6");
   */
  toPipe<B>(fn: (lst: List<A>) => B): Pipe<B> {
    return pipe(fn(this));
  }

  /**
   * `this: List<A>`
   *
   * `skipWhile: (A -> boolean) -> List<A>`
   *
   * ---
   * Bypasses the first `n` elements from `List<A>` for which the `predicate` returns `true`, then returning the remaining elements of the `List<A>`.
   * @param predicate predicate function to be run against each element.
   * @example
   * const actual = list(2, 4, 6, 8, 10, 1, 2, 3).skipWhile(x => x % 2 === 0);
   * const expected = list(1, 2, 3);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  skipWhile(predicate: (a: A) => boolean): List<A> {
    const idx = this._elements.findIndex(x => !predicate(x));
    if (idx === -1) return list();

    return this.skip(idx);
  }

  /**
   * `this: List<A>`
   *
   * `skip: number -> List<A>`
   *
   * ---
   * Returns `List<A>` after removing the first `n` elements.
   * @param n number of elements to remove.
   * @example
   * const actual1 = list(9, 10, 11).skip(2);
   * const expected1 = list(11);
   * expect(actual1.eq(expected1)).toEqual(true);
   *
   * const actual2 = list(22, 21, 15).skip(5);
   * const expected2 = list();
   * expect(actual2.eq(expected2)).toEqual(true);
   */
  skip(n: number): List<A> {
    if (n < 1) {
      return this;
    }

    return new List(this._elements.slice(n));
  }

  /**
   * `this: List<A>`
   *
   * `takeWhile: (A -> boolean) -> List<A>`
   *
   * ---
   * Takes the first `n` elements from `List<A>` for which the `predicate` returns `true`.
   * @param predicate predicate function to be run against each element.
   * @example
   * const actual = list(2, 4, 6, 5, 8, 10, 1, 2, 3).takeWhile(x => x % 2 === 0);
   * const expected = list(2, 4, 6);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  takeWhile(predicate: (a: A) => boolean): List<A> {
    const idx = this._elements.findIndex(x => !predicate(x));
    if (idx === -1) return list();

    return this.take(idx);
  }

  /**
   * `this: List<A>`
   *
   * `take: number -> List<A>`
   *
   * ---
   * Returns `List<A>` with only its first `n` elements.
   * @param n number of elements to remove.
   * @example
   * const actual1 = list(9, 10, 11).take(2);
   * const expected1 = list(9, 10);
   * expect(actual1.eq(expected1)).toEqual(true);
   *
   * const actual2 = list(22, 21, 15).take(5);
   * const expected2 = list(22, 21, 15);
   * expect(actual2.eq(expected2)).toEqual(true);
   */
  take(n: number): List<A> {
    if (n < 1) {
      return list();
    }

    return new List(this._elements.slice(0, n));
  }

  /**
   * `this: List<A>`
   *
   * `splitAt: number -> List<A> * List<A>`
   *
   * ---
   * Splits the `List<A>` into two `List`s at the given index.
   * @example
   * const [actual1, actual2] = list(10, 11, 12, 13, 14).splitAt(2);
   *
   * const expected1 = list(10, 11);
   * const expected2 = list(12, 13, 14);
   *
   * expect(actual1.eq(expected1)).toEqual(true);
   * expect(actual2.eq(expected2)).toEqual(true);
   */
  splitAt(idx: number): [List<A>, List<A>] {
    return [this.take(idx), this.skip(idx)];
  }

  /**
   * `this: List<A>`
   *
   * `contains: A -> boolean`
   *
   * ---
   * Checks if the `List<A>` contains the given value.
   * @returns true if the `List` contains the value.
   * @example
   * const a = list(1, 2, 5).contains(5);
   * expect(a).toEqual(true);
   *
   * const b = list(1, 2, 5).contains(9);
   * expect(b).toEqual(false);
   */
  contains(a: A): boolean {
    return this._elements.includes(a);
  }

  /**
   * `this: List<A>`
   *
   * `distinct: () -> List<A>`
   *
   * ---
   * Returns a `List<A>` that contains no duplicate entries
   * @example
   * const actual = list(1, 1, 2, 2, 3).distinct();
   * const expected = list(1, 2, 3);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  distinct(): List<A> {
    return new List(Array.from(new Set(this._elements)));
  }

  /**
   * `this: List<A>`
   *
   * `distinctBy: (A -> B) -> List<A>`
   *
   * ---
   *  Returns a `List<A>` that contains no duplicate entries by using the `===` operator on the result of the given `projection` function on each element.
   * @param projection function to be used to generate a comparison value for each element.
   * @example
   * const person = (name: string, age: number) => ({ name, age });
   *
   * const actual = list(person('joe', 30), person('miriam', 28), person('bea', 30))
   *   .distinctBy(x => x.age);
   *
   * const expected = list(person('joe', 30), person('miriam', 28));
   *
   * expect(actual.eqBy(expected, JSON.stringify)).toEqual(true);
   */
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
   * `this: List<A>`
   *
   * `append: List<A> -> List<A>`
   *
   * ---
   * Returns a new list that contains the elements of the first list followed by elements of the second.
   * @example
   * const actual = list(1, 2).append(list(3, 4));
   * const expected = list(1, 2, 3, 4);
   * exepect(actual.eq(expected)).toEqual(true);
   */
  append(list: List<A>): List<A> {
    return List.new(...this._elements, ...list._elements);
  }

  /**
   * `this: List<A>`
   *
   * `exists: (A -> boolean) -> boolean`
   *
   * ---
   * Tests if any element of the list satisfies the given predicate.
   * @example
   * const a = list(1, 2, 3).exists(x => x === 2);
   * expect(a).toEqual(true);
   */
  exists(predicate: (a: A) => boolean): boolean {
    return this._elements.some(predicate);
  }

  /**
   * `this: List<A>`
   *
   * `find: (A -> boolean) -> Option<A>`
   *
   * ---
   * Returns the first element for which the given function returns `true`. Returns `None` if no such element exists.
   * @example
   * const a = list(1, 2, 3).find(x => x === 2);
   * expect(a.isSome).toEqual(true);
   * expect(a.value).toEqual(2);
   */
  find(predicate: (a: A) => boolean): Option<A> {
    return option(this._elements.find(predicate));
  }

  /**
   * `this: List<A>`
   *
   * `findIndex: (A -> boolean) -> Option<number>`
   *
   * ---
   * @example
   * const a = list("f", "g", "h").findIndex(x => x === "h");
   * expect(a.isSome).toEqual(true);
   * expect(a.value).toEqual(2);
   */
  findIndex(predicate: (a: A) => boolean): Option<number> {
    const idx = this._elements.findIndex(predicate);
    if (idx === -1) return none();

    return some(idx);
  }

  /**
   * `this: List<A>`
   *
   * `forall: (A -> boolean) -> boolean`
   *
   * ---
   * Tests if all elements of the collection satisfy the given predicate.
   * @example
   * const a = list(2, 4, 6, 8).forall(x => x % 2 === 0);
   * expect(a).toEqual(true);
   */
  forall(predicate: (a: A) => boolean): boolean {
    return this._elements.every(predicate);
  }

  /**
   * `this: List<A>`
   *
   * `head: () -> Option<A>`
   *
   * ---
   * @returns the first element of the list, if it is not empty.
   * @example
   * const a = list(3, 2, 1).head();
   * expect(a.value).toEqual(3);
   *
   * const b = list().head();
   * expect(b.isNone).toEqual(true);
   */
  head(): Option<A> {
    return option(this._elements[0]);
  }

  /**
   * `this: List<A>`
   *
   * `tail: () -> List<A>`
   *
   * ---
   * Returns the list after removing the first element.
   * @example
   * const actual1 = list(1, 2, 3).tail();
   * const expected1 = list(2, 3);
   * expect(actual1.eq(expected1)).toEqual(true);
   *
   * const actual2 = list(5).tail();
   * expect(actual2.isEmpty).toEqual(true);
   */
  tail(): List<A> {
    return this.skip(1);
  }

  /**
   * `this: List<A>`
   *
   * `last: () -> Option<A>`
   *
   * ---
   * @returns the last element of the list, if it is not empty.
   * @example
   * const a = list(3, 2, 1).last();
   * expect(a.value).toEqual(1);
   *
   * const b = list().last();
   * expect(b.isNone).toEqual(true);
   */
  last(): Option<A> {
    if (this.length < 1) {
      return none();
    }

    return option(this._elements[this.length - 1]);
  }

  /**
   * `this: List<A>`
   *
   * `sort: () -> List<A>`
   *
   * ---
   * Returns a new list with its elements sorted.
   * @example
   * const actual = list(4, 1, 8).sort();
   * const expected = list(1, 4, 8);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  sort(): List<A> {
    return new List([...this._elements].sort());
  }

  /**
   * `this: List<A>`
   *
   * `sortBy: (A -> B) -> List<A>`
   *
   * ---
   * @example
   * const ppl = list(
   *   { name: 'john', age: 30 }, { name: 'jane', age: 28 }
   * );
   *
   * const actual = ppl.sortBy(p => p.age);
   *
   * const expected = list(
   *   { name: 'jane', age: 28 }, { name: 'john', age: 30 }
   * );
   *
   * expect(actual.eqBy(expected, JSON.stringify)).toEqual(true);
   */
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

  /**
   * `this: List<A>`
   *
   * `sortWith: ((A, A) -> number) -> List<A>`
   *
   * ---
   * @param comparison Function used to determine the order of the elements. It is expected
   * to return a negative value if the first argument is less than the second argument, zero if they're equal,
   * and a positive value otherwise.
   */
  sortWith(comparison: (a1: A, a2: A) => number): List<A> {
    return new List([...this._elements].sort(comparison));
  }

  /**
   * `this: List<A>`
   *
   * `max: () -> Option<A>`
   *
   * ---
   * @example
   * const a = list(2, 5, 1).max();
   * expect(a.value).toEqual(5);
   */
  max(): Option<A> {
    return this.sort().last();
  }

  /**
   * `this: List<A>`
   *
   * `maxBy: (A -> B) -> Option<A>`
   *
   * ---
   * @example
   * const ppl = list({ name: 'john', age: 30 }, { name: 'jane', age: 28 });
   * const actual = ppl.maxBy(p => p.age);
   * const expected = { name: 'john', age: 30 };
   *
   * expect(actual).toEqual(expected)
   */
  maxBy<B>(projection: (a: A) => B): Option<A> {
    if (this._elements.length < 1) {
      return none();
    }

    return this.sortBy(projection).last();
  }

  /**
   * `this: List<A>`
   *
   * `min: () -> Option<A>`
   *
   * ---
   * @example
   * const a = list(2, 5, 1).min();
   * expect(a.value).toEqual(1);
   */
  min(): Option<A> {
    return this.sort().head();
  }

  /**
   * `this: List<A>`
   *
   * `minBy: (A -> B) -> Option<A>`
   *
   * ---
   * @example
   * const ppl = list({ name: 'john', age: 30 }, { name: 'jane', age: 28 });
   * const actual = ppl.minBy(p => p.age);
   * const expected = { name: 'jane', age: 28 };
   *
   * expect(actual).toEqual(expected)
   */
  minBy<B>(projection: (a: A) => B): Option<A> {
    if (this._elements.length < 1) {
      return none();
    }

    return this.sortBy(projection).head();
  }

  /**
   * `this: List<A>`
   *
   * `sumBy: (A -> number) -> number`
   *
   * ---
   * @example
   * const ppl = list({ name: 'john', age: 30 }, { name: 'jane', age: 28 });
   * const actual = ppl.sumBy(p => p.age);
   *
   * expect(actual).toEqual(58)
   */
  sumBy(projection: (a: A) => number): number {
    return this.fold((sum, current) => sum + projection(current), 0);
  }

  /**
   * `this: List<A>`
   *
   * `averageBy: (A -> number) -> number`
   *
   * ---
   * @example
   * const ppl = list({ name: 'john', age: 30 }, { name: 'jane', age: 70 });
   * const actual = ppl.averageBy(p => p.age);
   *
   * expect(actual).toEqual(50)
   */
  averageBy(projection: (a: A) => number): number {
    return this.fold((sum, current) => sum + projection(current), 0) / this.length;
  }

  /**
   * `this: List<A>`
   *
   * `pairwise: () -> List<A * A>`
   *
   * ---
   * @example
   * const actual = list(1, 2, 3, 4).pairwise();
   * const expected = list([1, 2], [2, 3], [3, 4]);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  pairwise(): List<[A, A]> {
    let result: [A, A][] = [];

    for (let i = 0; i + 1 < this._elements.length; i++) {
      result.push([this._elements[i], this._elements[i + 1]]);
    }

    return new List(result);
  }

  /**
   * `this: List<A>`
   *
   * `partition: (A -> boolean) -> List<A> * List<A>`
   *
   * ---
   * Splits the list into two lists, containing the elements for which the given predicate returns True and False respectively. Element order is preserved in both of the created lists.
   * @returns a tuple with a list of elements that pass the predicate and a list of elements that fail the predicate.
   * @example
   * const [even, odd] = list(1, 2, 3, 4).partition(x => x % 2 === 0);
   * const expectedEven = list(2, 4);
   * const expectedOdd = list(1, 3);
   *
   * expect(even.eq(expectedEven)).toEqual(true);
   * expect(odd.eq(expectedOdd)).toEqual(true);
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
   * `this: List<A>`
   *
   * `except: List<A> -> List<A>`
   *
   * ---
   * Returns a new list with the distinct elements of the input list which do not appear in the itemsToExclude list.
   * @example
   * const actual = list(1, 2, 3, 4, 5).except(list(2, 5));
   * const expected = list(1, 3, 4);
   * expect(actual.eq(expected)).toEqual(true);
   */
  except(itemsToExclude: List<A>): List<A> {
    const toExclude = new Map<A, boolean>();

    for (const el of itemsToExclude) {
      toExclude.set(el, true);
    }

    return this.distinct().reject(x => toExclude.has(x));
  }

  /**
   * `this: List<A>`
   *
   * `indexed: () -> List<number * A>`
   *
   * ---
   * Returns a new list with its elements paired with their index (from 0).
   * @example
   * const actual = list("a", "b", "c").indexed();
   * const expected = list([0, "a"], [1, "b"], [2, "c"]);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  indexed(): List<[number, A]> {
    return new List(this._elements.map((x, i) => [i, x] as [number, A]));
  }

  /**
   * `this: List<A>`
   *
   * `item: number -> Option<A>`
   *
   * ---
   * Returns the item at the given `index`.
   * @example
   * const a = list("x", "y", "z").item(1);
   * expect(a.value).toEqual("y");
   *
   * const b = list("c", "v", "b").item(4);
   * expect(b.isNone).toEqual(true);
   */
  item(index: number): Option<A> {
    return option(this._elements[index]);
  }

  /**
   * `this: List<A>`
   *
   * `pick: (A -> Option<B>) -> Option<B>`
   *
   * ---
   * Returns the first element of a list for which the given function returns `Some`.
   * @example
   * const a = list("a", "b", "5", "c").pick(Num.parse);
   * expect(a.value).toEqual(5);
   */
  pick<B>(fn: (a: A) => Option<B>): Option<B> {
    for (const x of this._elements) {
      const res = fn(x);
      if (res.isSome) return res;
    }

    return none();
  }

  /**
   * `this: List<A>`
   *
   * `trace: (string | undefined) -> List<A>`
   *
   * ---
   */
  trace(msg?: string): List<A> {
    const logStr = msg ? `${msg} ${this}` : `${this}`;
    console.log(logStr);

    return this;
  }

  /**
   * `this: List<A>`
   *
   * `rev: () -> List<A>`
   *
   * ---
   * @returns a reversed copy of the list.
   * @example
   * const actual = list(1, 2, 3).rev();
   * const expected = list(3, 2, 1);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  rev(): List<A> {
    return new List([...this._elements].reverse());
  }

  zip(list: List<A>): Option<List<[A, A]>> {
    if (this.length !== list.length) {
      return none();
    }

    let res: [A, A][] = [];

    for (let i = 0; i < this.length; i++) {
      res.push([this._elements[i], list._elements[i]]);
    }

    return some(new List(res));
  }

  zip3(list2: List<A>, list3: List<A>): Option<List<[A, A, A]>> {
    if (this.length !== list2.length || list2.length !== list3.length) {
      return none();
    }

    let res: [A, A, A][] = [];

    for (let i = 0; i < this.length; i++) {
      res.push([this._elements[i], list2._elements[i], list3._elements[i]]);
    }

    return some(new List(res));
  }

  /**
   * `this: List<A>`
   *
   * `countBy: (A -> B) -> Dict<B, number>`
   *
   * ---
   * @example
   * const ppl = list(
   *   { name: "ann", age: 30 }, { name: "john", age: 31 }, { name: "ann", age: 42 }
   * );
   * const pplCount = ppl.countBy(p => p.name);
   * expect(pplCount.find("ann").value).toEqual(2);
   */
  countBy<B>(projection: (a: A) => B): Dict<B, number> {
    const map: Map<B, number> = new Map();

    for (const x of this._elements) {
      const res = projection(x);
      const current = map.get(res) ?? 0;
      map.set(res, current + 1);
    }

    return Dict.ofMap(map);
  }

  /**
   * `this: List<A>`
   *
   * `groupBy: (A -> B) -> Dict<B, List<A>>`
   *
   * ---
   * @example
   * const ppl = list(
   *   { name: "ann", age: 30 }, { name: "john", age: 31 }, { name: "ann", age: 42 }
   * );
   * const nameGroups = ppl.countBy(p => p.name);
   * expect(pplCount.find("ann").value).toEqual(2);
   */
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
   * `this: List<A>`
   *
   * `equivalent: List<A> -> boolean`
   *
   * ---
   * @returns true if the lists contains the same elements regardless of order.
   * @example
   * const a = list(1, 2, 3).equivalent(list(3, 2, 1));
   * expect(a).toEqual(true);
   */
  equivalent(list: List<A>): boolean {
    if (this.length !== list.length) return false;

    const lst1 = new Map<A, number>();
    const lst2 = new Map<A, number>();

    for (const x of this) {
      const count = lst1.get(x) ?? 0;
      lst1.set(x, count + 1);
    }

    for (const x of list) {
      const count = lst2.get(x) ?? 0;
      lst2.set(x, count + 1);
    }

    if (lst1.size !== lst2.size) return false;

    for (const [key, val] of lst1) {
      if (lst2.get(key) !== val) return false;
    }

    return true;
  }

  /**
   * `this: List<A>`
   *
   * `to: (List<A> -> B) -> B`
   *
   * ---
   * Pipes this current `List` instance as an argument to the given function.
   * @example
   * const a = list("one", "two").pipe(x => x.length);
   * expect(a).toEqual(2);
   */
  to<B>(fn: (a: List<A>) => B): B {
    return fn(this);
  }

  /**
   * `this: List<A>`
   *
   * `join: (string | undefined) -> string`
   *
   * ---
   * Adds all the elements of the list into a string, separated by the specified separator string.
   */
  join(separator?: string): string {
    return this._elements.join(separator);
  }

  /**
   * `empty: () -> List<A>`
   *
   * ---
   * @returns an empty `List<A>`.
   * @example
   * const a = List.empty();
   * expect(a.isEmpty).toEqual(true);
   */
  static empty<A>(): List<A> {
    return list();
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
   * `init: number -> (number -> B) -> List<B>`
   *
   * ---
   * Creates a list by calling the given initializer on each index.
   * @example
   * const actual = List.init(3)(n => n.toString());
   * const expected = list("0", "1", "2");
   * expect(actual.eq(expected)).toEqual(true);
   */
  static init =
    <B>(count: number) =>
    (initializer: (n: number) => B): List<B> => {
      return List.range(0, count - 1).map(initializer);
    };

  /**
   * `replicate: number -> B -> List<B>`
   *
   * ---
   * @example
   * const actual = List.replicate(3)("z");
   * const expected = list("z", "z", "z");
   * expect(actual.eq(expected)).toEqual(true);
   */
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

/**
 * `list: (...A) -> List<A>`
 *
 * ---
 * Creates a new List<A>.
 * @example
 * const a = list("x", "y", "z");
 *
 * expect(a.item(1).value).toEqual("y");
 * expect(a.length).toEqual(3);
 */
export const list = List.new;
