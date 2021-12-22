import { List } from "./List";
import { none, option, Option, some } from "./Option";

/**
 * An immutable key value pair collection.
 */
export class Dict<A, B> {
  private constructor(private readonly _values: Map<A, B>) {}

  /**
   * `new: ...(A * B) -> Dict<A, B>`
   *
   * ---
   * Creates a new `Dict`.
   * @example
   * const a = Dict.new([1, "one"], [2, "two"], [3, "three"]);
   * expect(a.find(1).value).toEqual("one");
   */
  static new<A, B>(...values: [A, B][]): Dict<A, B> {
    return new Dict(new Map(values));
  }

  /**
   * `empty: () -> Dict<A, B>`
   *
   * ---
   * @returns an empty `Dict<A, B>`.
   * @example
   * const a = Dict.empty();
   * expect(a.isEmpty).toEqual(true);
   */
  static empty<A, B>(): Dict<A, B> {
    return new Dict(new Map());
  }

  /**
   * `ofMap: Map<A, B> -> Dict<A, B>`
   *
   * ---
   */
  static ofMap<A, B>(map: Map<A, B>): Dict<A, B> {
    return new Dict(map);
  }

  /**
   * `ofArray: (A * B)[] -> Dict<A, B>`
   *
   * ---
   * Creates a `Dict<A, B>` from an `Array` of `A * B` tuples.
   * @example
   * const a = Dict.ofArray([[1, "one"], [2, "two"], [3, "three"]]);
   * expect(a.find(1).value).toEqual("one");
   */
  static ofArray<A, B>(arr: [A, B][]): Dict<A, B> {
    const map = new Map<A, B>(arr);

    return new Dict(map);
  }

  /**
   * `ofArray: List<A * B> -> Dict<A, B>`
   *
   * ---
   * Creates a `Dict<A, B>` from a `List` of `A * B` tuples.
   * @example
   * const a = Dict.ofList(list([1, "one"], [2, "two"], [3, "three"]));
   * expect(a.find(1).value).toEqual("one");
   */
  static ofList<A, B>(list: List<[A, B]>): Dict<A, B> {
    const map = new Map<A, B>(list.toArray());

    return new Dict(map);
  }

  *[Symbol.iterator]() {
    for (const el of this._values) {
      yield el;
    }

    return;
  }

  /**
   * The number of entries in the `Dict`.
   */
  get count(): number {
    return this._values.size;
  }

  /**
   * @returns true if the `Dict` is empty.
   */
  get isEmpty(): boolean {
    return this._values.size === 0;
  }

  /**
   * @returns true if the `Dict` is not empty.
   */
  get isNotEmpty(): boolean {
    return this._values.size > 0;
  }

  /**
   * `this: Dict<A, B>`
   *
   * `toMap: () -> Map<A, B>`
   *
   * ---
   * Converts the `Dict` into a standard JavaScript `Map`.
   */
  toMap(): Map<A, B> {
    return new Map(this._values.entries());
  }

  /**
   * `this: Dict<A, B>`
   *
   * `toArray: () -> (A * B)[]`
   *
   * ---
   * Converts the `Dict` into an array of `key * value` tuples.
   * @example
   * const actual = dict([1, "one"], [2, "two"]).toArray();
   * const expected = [[1, "one"], [2, "two"]];
   *
   * expect(actual).toEqual(expected);
   */
  toArray(): [A, B][] {
    return Array.from(this._values.entries());
  }

  /**
   * `this: Dict<A, B>`
   *
   * `toList: () -> List<A * B>`
   *
   * ---
   * Converts the `Dict` into a list of `key * value` tuples.
   * @example
   * const actual = dict([1, "one"], [2, "two"]).toList();
   * const expected = list([1, "one"], [2, "two"]);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  toList(): List<[A, B]> {
    return List.ofArray(Array.from(this._values.entries()));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `keys: () -> List<A>`
   *
   * ---
   * @returns a `List` with all the keys from the `Dict`'s entries.
   * @example
   * const actual = dict([1, "one"], [2, "two"]).keys();
   * const expected = list(1, 2);
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  keys(): List<A> {
    return List.ofArray(Array.from(this._values.keys()));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `keys: () -> List<B>`
   *
   * ---
   * @returns a `List` with all the values from the `Dict`'s entries.
   * @example
   * const actual = dict([1, "one"], [2, "two"]).values();
   * const expected = list("one", "two");
   *
   * expect(actual.eq(expected)).toEqual(true);
   */
  values(): List<B> {
    return List.ofArray(Array.from(this._values.values()));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `add: (A, B) -> Dict<A, B>`
   *
   * ---
   * @returns a new map with the added entry.
   * @example
   * const x = dict([1, "one"], [2, "two"]);
   * const y = dict.add(3, "three");
   *
   * expect(y.find(3).value).toEqual("three");
   */
  add(key: A, value: B): Dict<A, B> {
    const map = new Map(this._values.entries());
    map.set(key, value);

    return new Dict(map);
  }

  /**
   * `this: Dict<A, B>`
   *
   * `add: (A, B) -> Dict<A, B>`
   *
   * ---
   * @returns a new map without the entry belonging to the given key.
   * @example
   * const x = dict([1, "one"], [2, "two"]);
   * const y = dict.remove(1);
   *
   * expect(y.find(1).isNone).toEqual(true);
   */
  remove(key: A): Dict<A, B> {
    const map = new Map(this._values.entries());
    map.delete(key);

    return new Dict(map);
  }

  /**
   * `this: Dict<A, B>`
   *
   * `find: A -> Option<B>`
   *
   * ---
   * @returns the value for the entry that matches the given key.
   * @example
   * const x = dict(["a", true], ["b", false]);
   *
   * const y = dict.find("a");
   * expect(y.value).toEqual(true);
   *
   * const z = dict.find("z");
   * expect(z.isNone).toEqual(true);
   */
  find(key: A): Option<B> {
    return option(this._values.get(key));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `has: A -> boolean`
   *
   * ---
   * @returns `true` if there is an entry with the given key.
   * @example
   * const x = dict(["a", true], ["b", false]);
   * const y = dict.has("a");
   * expect(y).toEqual(true);
   */
  has(key: A): boolean {
    return this._values.has(key);
  }

  /**
   * `this: Dict<A, B>`
   *
   * `findKey: ((A, B) -> boolean) -> Option<A>`
   *
   * ---
   * @returns a key for which the predicate given evaluates to `true`.
   * @example
   * const x = dict(["a", true], ["b", false]);
   * const y = dict.findKey((key, val) => key === "a" && val);
   * expect(y.value).toEqual("a");
   */
  findKey(predicate: (key: A, value: B) => boolean): Option<A> {
    for (const [key, value] of this._values) {
      if (predicate(key, value)) {
        return option(key);
      }
    }

    return none();
  }

  /**
   * `this: Dict<A, B>`
   *
   * `change: (A, (Option<B> -> Option<B>)) -> Dict<A, B>`
   *
   * ---
   * Tries to find the entry pertaining to the given key, if so executes a function that returns a new value for that entry.
   * @example
   * const entries = dict(["a", 1], ["b", 2])
   *   .change("a", val => val.map(x => x * 10))
   *   .change("c", val => val.orElse(some(99)));
   *
   * expect(entries.find("a").value).toEqual(10);
   * expect(entries.find("c").value).toEqual(99)
   */
  change(key: A, fn: (b: Option<B>) => Option<B>): Dict<A, B> {
    const val = this.find(key).to(fn);
    if (val.isNone) return this;

    return this.add(key, val.raw!);
  }

  /**
   * `this: Dict<A, B>`
   *
   * `exists: ((A, B) -> boolean) -> boolean`
   *
   * ---
   */
  exists(predicate: (key: A, value: B) => boolean): boolean {
    return this.toArray().some(([k, v]) => predicate(k, v));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `forall: ((A, B) -> boolean) -> boolean`
   *
   * ---
   */
  forall(predicate: (key: A, value: B) => boolean): boolean {
    return this.toArray().every(([k, v]) => predicate(k, v));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `filter: ((A, B) -> boolean) -> Dict<A, B>`
   *
   * ---
   */
  filter(predicate: (key: A, value: B) => boolean): Dict<A, B> {
    return Dict.ofArray(this.toArray().filter(([k, v]) => predicate(k, v)));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `reject: ((A, B) -> boolean) -> Dict<A, B>`
   *
   * ---
   */
  reject(predicate: (key: A, value: B) => boolean): Dict<A, B> {
    return Dict.ofArray(this.toArray().filter(([k, v]) => !predicate(k, v)));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `fold: (((State, A, B) -> State), State) -> State`
   *
   * ---
   */
  fold<State>(folder: (state: State, key: A, value: B) => State, state: State): State {
    return this.toArray().reduce((state, [key, value]) => folder(state, key, value), state);
  }

  /**
   * `this: Dict<A, B>`
   *
   * `iter: ((A, B) -> ()) -> ()`
   *
   * ---
   */
  iter(fn: (key: A, value: B) => void): void {
    for (const [key, value] of this._values.entries()) {
      fn(key, value);
    }
  }

  /**
   * `this: Dict<A, B>`
   *
   * `tee: ((A, B) -> ()) -> Dict<A, B>`
   *
   * ---
   */
  tee(fn: (key: A, value: B) => void): Dict<A, B> {
    for (const [key, value] of this._values.entries()) {
      fn(key, value);
    }

    return this;
  }

  /**
   * `this: Dict<A, B>`
   *
   * `trace: (string | undefined) -> Dict<A, B>`
   *
   * ---
   */
  trace(msg?: string): Dict<A, B> {
    const logStr = msg ? `${msg} ${this}` : `${this}`;
    console.log(logStr);

    return this;
  }

  /**
   * `this: Dict<A, B>`
   *
   * `map: ((A, B) -> C) -> Dict<A, C>`
   *
   * ---
   */
  map<C>(mapping: (key: A, value: B) => C): Dict<A, C> {
    return Dict.ofArray(this.toArray().map(([key, value]) => [key, mapping(key, value)]));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `mapKeys: ((A, B) -> C) -> Dict<C, B>`
   *
   * ---
   */
  mapKeys<C>(mapping: (key: A, value: B) => C): Dict<C, B> {
    return Dict.ofArray(this.toArray().map(([key, value]) => [mapping(key, value), value]));
  }

  /**
   * `this: Dict<A, B>`
   *
   * `merge: Dict<A, B> -> Dict<A, B>`
   *
   * ---
   * Given two Dicts, will merge them together. In case of repeated keys, the argument Dict will override the instance values.
   */
  merge(dict: Dict<A, B>): Dict<A, B> {
    return this.fold((state, key, value) => state.add(key, value), dict);
  }

  /**
   * `this: Dict<A, B>`
   *
   * `choose: ((A, B) -> Option<C>) -> Dict<A, C>`
   *
   * ---
   */
  choose<C>(fn: (key: A, value: B) => Option<C>): Dict<A, C> {
    const res: [A, C][] = [];

    for (const kvp of this._values) {
      const o = fn(kvp[0], kvp[1]);

      if (o.isSome) {
        res.push([kvp[0], o.value]);
      }
    }

    return Dict.ofArray(res);
  }

  /**
   * `this: Dict<A, B>`
   *
   * `pick: ((A, B) -> Option<C>) -> Option<C>`
   *
   * ---
   */
  pick<C>(fn: (key: A, value: B) => Option<C>): Option<C> {
    for (const [key, value] of this._values) {
      const res = fn(key, value);
      if (res.isSome) return res;
    }

    return none();
  }

  /**
   * `this: Dict<A, B>`
   *
   * `partition: ((A, B) -> boolean) -> Dict<A, B> * Dict<A, B>`
   *
   * ---
   */
  partition(predicate: (key: A, value: B) => boolean): [Dict<A, B>, Dict<A, B>] {
    const trues = [];
    const falses = [];

    for (const kvp of this._values) {
      if (predicate(kvp[0], kvp[1])) {
        trues.push(kvp);
      } else {
        falses.push(kvp);
      }
    }

    return [Dict.ofArray(trues), Dict.ofArray(falses)];
  }

  /**
   * `this: Dict<A, B>`
   *
   * `to: (Dict<A, B> -> C) -> C`
   *
   * ---
   * Pipes this current `Dict<A, B>` instance as an argument to the given function.
   * @example
   * const a = dict([1, "a"], [2, "b"]).to(d => d.count);
   * expect(a).toEqual(2);
   */
  to<C>(fn: (a: Dict<A, B>) => C): C {
    return fn(this);
  }

  static rejectNones<A, B>(dict: Dict<A, Option<B>>): Dict<A, B> {
    return dict.choose((_, v) => v);
  }
}

/**
 * `dict: ...(A * B) -> Dict<A, B>`
 *
 * ---
 * Creates a new `Dict`.
 * @example
 * const a = dict([1, "one"], [2, "two"], [3, "three"]);
 * expect(a.find(1).value).toEqual("one");
 */
export const dict = Dict.new;
