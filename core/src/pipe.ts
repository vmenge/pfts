/**
 * A container class with methods to facilitate function chaining.
 */
export class Pipe<T> {
  private constructor(
    /**
     * The value contained inside the pipe.
     * @example
     * const x = pipe(10);
     * expect(x.value).toEqual(10);
     */
    public readonly value: T
  ) {}

  /**
   * `new: T -> Pipe<T>`
   *
   * ---
   * Creates a new Pipe.
   * @example
   * const a = Pipe.new(5);
   * expect(a).toBeInstanceOf(Pipe);
   */
  static new = <T>(t: T): Pipe<T> => new Pipe(t);

  /**
   * `this: Pipe<T>`
   *
   * `return: (T -> K) -> K`
   *
   * ---
   * Finalizes the pipeline with a function.
   * @returns Result of the pipeline.
   * @example
   * const a = pipe("500")
   *   .to(Number)
   *   .return(x => x * 2);
   *
   * expect(a).toEqual(1000);
   */
  return<K>(fn: (t: T) => K): K {
    return fn(this.value);
  }

  /**
   * `this: Pipe<T>`
   *
   * `to: (T -> K) -> Pipe<K>`
   *
   * ---
   * Pipes current value to a unary function.
   * @param fn Function value should be piped to.
   * @returns A `Pipe`, allowing you to continue the pipeline or finalize it.
   * @example
   * const a = pipe(10)
   *   .to(x => x * 2)
   *   .to(x => `num: ${x}`);
   *
   * expect(a.value).toEqual("num: 20");
   */
  to<K>(fn: (t: T) => K): Pipe<K> {
    return new Pipe(fn(this.value));
  }

  /**
   * `this: Pipe<T>`
   *
   * `tee: (T -> ()) -> Pipe<T>`
   *
   * ---
   * Executes the given function against the value inside the Pipe.
   * @param fn a function that typically executes a side effect.
   * @returns the same `T` instance.
   * @example
   * const a = pipe(3).tee(x => console.log(`val: ${x}`)); // prints "val: 3";
   * expect(a.value).toEqual(3);
   */
  tee(fn: (a: T) => void): Pipe<T> {
    fn(this.value);

    return this;
  }

  /**
   * `this: Pipe<T>`
   *
   * `trace: (string | undefined) -> Pipe<T>`
   *
   * ---
   * Logs the current value from the `Pipe<T>` to the console.
   * @returns `Pipe<T>` unmodified.
   * @example
   * pipe(5).trace("value:"); // prints "value: 5"
   * pipe("something").trace(); // prints "something"
   */
  trace(msg?: string): Pipe<T> {
    const logStr = msg ? `${msg} ${this.value}` : `${this.value}`;
    console.log(logStr);

    return this;
  }
}

/**
 * `pipe: T -> Pipe<T>`
 *
 * ---
 * Creates a new Pipe.
 * @example
 * const a = pipe(5);
 * expect(a).toBeInstanceOf(Pipe);
 */
export const pipe = <T>(value: T): Pipe<T> => Pipe.new(value);
