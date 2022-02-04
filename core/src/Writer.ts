export class Writer<A, S> {
  private constructor(private readonly val: A, private readonly story: S[]) {}

  static new = <A, S>(val: A, story: S[] = []): Writer<A, S> => {
    return new Writer(val, story);
  };

  *[Symbol.iterator](): Generator<Writer<A, S>, A, any> {
    return yield this;
  }

  run(): [A, S[]] {
    return [this.val, this.story];
  }

  tell(entry: S): Writer<A, S> {
    return new Writer(this.val, [...this.story, entry]);
  }

  map<B>(fn: (a: A) => B): Writer<B, S> {
    return new Writer(fn(this.val), this.story);
  }

  bind<B>(fn: (a: A) => Writer<B, S>): Writer<B, S> {
    const newWriter = fn(this.val);
    const [val, newStory] = newWriter.run();

    return new Writer(val, [...this.story, ...newStory]);
  }

  static run = <A, S>(w: Writer<A, S>): [A, S[]] => w.run();

  static tell =
    <A, S>(w: Writer<A, S>) =>
    (entry: S): Writer<A, S> =>
      w.tell(entry);

  static map =
    <A, B>(fn: (a: A) => B) =>
    <S>(w: Writer<A, S>) =>
      w.map(fn);

  static bind =
    <A, B, S>(fn: (a: A) => Writer<B, S>) =>
    (w: Writer<A, S>): Writer<B, S> =>
      w.bind(fn);

  static ce = <A, B, S>(genFn: () => Generator<Writer<A, S>, B, A>): Writer<B, S> => {
    const iterator = genFn();
    let state = iterator.next();

    function run(state: IteratorYieldResult<Writer<A, S>> | IteratorReturnResult<B>): Writer<B, S> {
      if (state.done) {
        return new Writer(state.value, []);
      }

      const { value } = state;
      return value.bind(val => run(iterator.next(val)));
    }

    return run(state);
  };
}

export const writer = Writer.new;
