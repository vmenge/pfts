export class Pipe<T> {
  constructor(private readonly value: T) {}

  /**
   * Finalizes the pipeline.
   * @returns Result of the pipeline.
   */
  return(): T {
    return this.value;
  }

  /**
   * Pipes current value to a unary function.
   * @param fn Function value should be piped to.
   * @returns {Pipe} A Pipe, allowing you to continue the pipeline or finalize it.
   */
  to<K>(fn: (t: T) => K): Pipe<K> {
    return new Pipe(fn(this.value));
  }
}

export const pipe = <T>(value: T): Pipe<T> => new Pipe(value);
