class ComposeNode<T, K> {
  constructor(private readonly fn: (t: T) => K) {}

  /**
   * Finalizes the composition.
   * @returns Result of the composition.
   */
  return(): (t: T) => K {
    return this.fn;
  }

  /**
   * Composes function with the previous one.
   * @param fn Function to add to the composition.
   * @returns {ComposeNode} A Compose, allowing you to continue composing or finalize the function.
   */
  with<A>(fn: (k: K) => A): ComposeNode<T, A> {
    return new ComposeNode((t: T) => fn(this.fn(t)));
  }
}

export const compose = <T, K>(fn: (t: T) => K): ComposeNode<T, K> => new ComposeNode(fn);
