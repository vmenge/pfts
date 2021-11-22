/**
 * A Function composer, allowing you to easily compose functions together.
 * @example
 * const double = (x: number) => x * 2;
 *
 * const parseDoubleAndStringify = compose(Number)
 *  .with(double)
 *  .and(x => `${x}`);
 *
 * const actual = parseDoubleAndStringify("5");
 * expect(actual).toEqual("10")
 */
export class FnComp<T, K> {
  private constructor(
    /**
     * Composed function.
     */
    public readonly fn: (t: T) => K
  ) {}

  static new = <T, K>(fn: (t: T) => K) => new FnComp(fn);

  /**
   * Finalizes the composition.
   * @returns Result of the composition.
   */
  and<A>(fn: (k: K) => A): (t: T) => A {
    return (t: T) => fn(this.fn(t));
  }

  /**
   * Composes function with the previous one.
   * @param fn Function to add to the composition.
   * @returns {ComposeNode} A Compose, allowing you to continue composing or finalize the function.
   */
  with<A>(fn: (k: K) => A): FnComp<T, A> {
    return new FnComp((t: T) => fn(this.fn(t)));
  }
}

export const compose = <T, K>(fn: (t: T) => K): FnComp<T, K> => FnComp.new(fn);
