export function compose<A, B, C>(f1: (a: A) => B, f2: (b: B) => C): (a: A) => C;
export function compose<A, B, C, D>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D): (a: A) => D;
export function compose<A, B, C, D, E>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E): (a: A) => E;
export function compose<A, B, C, D, E, F>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F
): (a: A) => F;
export function compose<A, B, C, D, E, F, G>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G
): (a: A) => G;
export function compose<A, B, C, D, E, F, G, H>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H
): (a: A) => H;
export function compose<A, B, C, D, E, F, G, H, I>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I
): (a: A) => I;
export function compose<A, B, C, D, E, F, G, H, I, J>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J
): (a: A) => J;
export function compose<A, B, C, D, E, F, G, H, I, J, K>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K
): (a: A) => K;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L
): (a: A) => L;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M
): (a: A) => M;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N
): (a: A) => N;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O
): (a: A) => O;

export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P
): (a: A) => P;

export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q
): (a: A) => Q;

export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q,
  f17: (q: Q) => R
): (a: A) => R;

export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q,
  f17: (q: Q) => R,
  f18: (r: R) => S
): (a: A) => S;

export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q,
  f17: (q: Q) => R,
  f18: (r: R) => S,
  f19: (s: S) => T
): (a: A) => T;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q,
  f17: (q: Q) => R,
  f18: (r: R) => S,
  f19: (s: S) => T,
  f20: (t: T) => U
): (a: A) => U;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q,
  f17: (q: Q) => R,
  f18: (r: R) => S,
  f19: (s: S) => T,
  f20: (t: T) => U,
  f21: (u: U) => V
): (a: A) => V;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q,
  f17: (q: Q) => R,
  f18: (r: R) => S,
  f19: (s: S) => T,
  f20: (t: T) => U,
  f21: (u: U) => V,
  f22: (v: V) => W
): (a: A) => W;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q,
  f17: (q: Q) => R,
  f18: (r: R) => S,
  f19: (s: S) => T,
  f20: (t: T) => U,
  f21: (u: U) => V,
  f22: (v: V) => W,
  f23: (w: W) => X
): (a: A) => X;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q,
  f17: (q: Q) => R,
  f18: (r: R) => S,
  f19: (s: S) => T,
  f20: (t: T) => U,
  f21: (u: U) => V,
  f22: (v: V) => W,
  f23: (w: W) => X,
  f24: (x: X) => Y
): (a: A) => Y;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F,
  f6: (f: F) => G,
  f7: (g: G) => H,
  f8: (h: H) => I,
  f9: (i: I) => J,
  f10: (j: J) => K,
  f11: (k: K) => L,
  f12: (l: L) => M,
  f13: (m: M) => N,
  f14: (n: N) => O,
  f15: (o: O) => P,
  f16: (p: P) => Q,
  f17: (q: Q) => R,
  f18: (r: R) => S,
  f19: (s: S) => T,
  f20: (t: T) => U,
  f21: (u: U) => V,
  f22: (v: V) => W,
  f23: (w: W) => X,
  f24: (x: X) => Y,
  f25: (y: Y) => Z
): (a: A) => Z;
export function compose(...fs: Function[]): unknown {
  return (a: unknown) => fs.reduce((res, f) => f(res), a);
}
