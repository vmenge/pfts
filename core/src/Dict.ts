import { List } from "./List";
import { none, option, Option, some } from "./Option";

export class Dict<A, B> {
  private constructor(private readonly _values: Map<A, B>) {}

  static create<A, B>(...values: [A, B][]): Dict<A, B> {
    return new Dict(new Map(values));
  }

  static empty<A, B>(): Dict<A, B> {
    return new Dict(new Map());
  }

  static ofMap<A, B>(map: Map<A, B>): Dict<A, B> {
    return new Dict(map);
  }

  static ofArray<A, B>(arr: [A, B][]): Dict<A, B> {
    const map = new Map<A, B>(arr);

    return new Dict(map);
  }

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

  get count(): number {
    return this._values.size;
  }

  get isEmpty(): boolean {
    return this._values.size === 0;
  }

  get isNotEmpty(): boolean {
    return this._values.size > 0;
  }

  toMap(): Map<A, B> {
    return new Map(this._values.entries());
  }

  toArray(): [A, B][] {
    return Array.from(this._values.entries());
  }

  toList(): List<[A, B]> {
    return List.ofArray(Array.from(this._values.entries()));
  }

  keys(): List<A> {
    return List.ofArray(Array.from(this._values.keys()));
  }

  values(): List<B> {
    return List.ofArray(Array.from(this._values.values()));
  }

  add(key: A, value: B): Dict<A, B> {
    const map = new Map(this._values.entries());
    map.set(key, value);

    return new Dict(map);
  }

  remove(key: A): Dict<A, B> {
    const map = new Map(this._values.entries());
    map.delete(key);

    return new Dict(map);
  }

  find(key: A): Option<B> {
    return option(this._values.get(key));
  }

  containsKey(key: A): boolean {
    return this._values.has(key);
  }

  findKey(predicate: (key: A, value: B) => boolean): Option<A> {
    for (const [key, value] of this._values) {
      if (predicate(key, value)) {
        return option(key);
      }
    }

    return none();
  }

  change(key: A, fn: (b: Option<B>) => Option<B>): Dict<A, B> {
    const val = this.find(key).pipe(fn);
    if (val.isNone) return this;

    return this.add(key, val.raw!);
  }

  exists(predicate: (key: A, value: B) => boolean): boolean {
    return this.toArray().some(([k, v]) => predicate(k, v));
  }

  forall(predicate: (key: A, value: B) => boolean): boolean {
    return this.toArray().every(([k, v]) => predicate(k, v));
  }

  filter(predicate: (key: A, value: B) => boolean): Dict<A, B> {
    return Dict.ofArray(this.toArray().filter(([k, v]) => predicate(k, v)));
  }

  reject(predicate: (key: A, value: B) => boolean): Dict<A, B> {
    return Dict.ofArray(this.toArray().filter(([k, v]) => !predicate(k, v)));
  }

  fold<State>(folder: (state: State, key: A, value: B) => State, state: State): State {
    return this.toArray().reduce((state, [key, value]) => folder(state, key, value), state);
  }

  iter(fn: (key: A, value: B) => void): void {
    for (const [key, value] of this._values.entries()) {
      fn(key, value);
    }
  }

  tee(fn: (key: A, value: B) => void): Dict<A, B> {
    for (const [key, value] of this._values.entries()) {
      fn(key, value);
    }

    return this;
  }

  trace(msg?: string): Dict<A, B> {
    const logStr = msg ? `${msg} ${this}` : `${this}`;
    console.log(logStr);

    return this;
  }

  map<C>(mapping: (key: A, value: B) => C): Dict<A, C> {
    return Dict.ofArray(this.toArray().map(([key, value]) => [key, mapping(key, value)]));
  }

  mapKeys<C>(mapping: (key: A, value: B) => C): Dict<C, B> {
    return Dict.ofArray(this.toArray().map(([key, value]) => [mapping(key, value), value]));
  }

  /**
   * Given two Dicts, will merge them together. In case of repeated keys, the argument Dict will override the instance values.
   */
  merge(dict: Dict<A, B>): Dict<A, B> {
    return this.fold((state, key, value) => state.add(key, value), dict);
  }

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

  pick<C>(fn: (key: A, value: B) => Option<C>): Option<C> {
    for (const [key, value] of this._values) {
      const res = fn(key, value);
      if (res.isSome) return res;
    }

    return none();
  }

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

  static rejectNones<A, B>(dict: Dict<A, Option<B>>): Dict<A, B> {
    return dict.choose((_, v) => v);
  }
}

export const dict = Dict.create;
