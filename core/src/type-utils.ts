import { Result } from "./Result";

export type Head<T extends any[]> = T extends [any, ...any[]] ? T[0] : never;
export type Snd<T extends any[]> = T extends [any, any, ...any[]] ? T[1] : never;

type Tail<T extends any[]> = ((...t: T) => any) extends (_: any, ...tail: infer TT) => any
  ? TT
  : never;

type HasTail<T extends any[]> = T extends [] | [any] ? false : true;

type FnInfer<F> = F extends (...args: infer A) => infer R ? [A, R] : never;
type FnArgs<F> = F extends (...args: infer A) => any ? [A] : never;

type Last<T extends any[]> = { 0: Last<Tail<T>>; 1: Head<T> }[HasTail<T> extends true ? 0 : 1];

type Length<T extends any[]> = T["length"];

type Index<N extends number, T extends any[]> = T[N];

type Cast<X, Y> = X extends Y ? X : Y;

type Prepend<E, T extends any[]> = ((head: E, ...args: T) => any) extends (...args: infer U) => any
  ? U
  : T;

type Skip<N extends number, T extends any[], I extends any[] = []> = {
  0: Skip<N, Tail<T>, Prepend<any, I>>;
  1: T;
}[Length<I> extends N ? 1 : 0];

type ErrorBrand<Err extends string> = Readonly<{
  [key in Err]: Error;
}>;

type RequireType<X> = X extends unknown ? ErrorBrand<"Type must be provided"> : X;

export type Fn<P extends any[], R> = (...args: P) => R;

// prettier-ignore
type CFn<P extends any[], R> = (
  arg_0: Head<P>
) => HasTail<P> extends false
  ? R
  : (arg_1: Index<1, P>) => Length<Skip<2, P>> extends 0 ? R 
  : (arg_2: Index<2, P>) => Length<Skip<3, P>> extends 0 ? R 
  : (arg_3: Index<3, P>) => Length<Skip<4, P>> extends 0 ? R 
  : (arg_4: Index<4, P>) => Length<Skip<5, P>> extends 0 ? R 
  : (arg_5: Index<5, P>) => Length<Skip<6, P>> extends 0 ? R 
  : (arg_6: Index<6, P>) => Length<Skip<7, P>> extends 0 ? R 
  : (arg_7: Index<7, P>) => Length<Skip<8, P>> extends 0 ? R
  : CFn<Skip<8, P>, R>

export type Concat<T extends any[], U extends any[]> = [...T, ...U];
export type ResultCollector<T extends any[], Err, Acc extends any[] = []> = HasTail<T> extends false
  ? Concat<Acc, [Result<Head<T>, Err>]>
  : ResultCollector<Tail<T>, Err, Concat<Acc, [Result<Head<T>, Err>]>>;

export type ArrayKeyVals<
  Arr extends T[],
  Key extends keyof T,
  T,
  Acc extends any[] = []
> = HasTail<Arr> extends false
  ? Concat<Acc, [Head<Arr>[Key]]>
  : ArrayKeyVals<Tail<Arr>, Key, T, Concat<Acc, [Head<Arr>[Key]]>>;

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

// Taken from: https://stackoverflow.com/a/59833759
// prettier-ignore
export type ConcatX<T extends readonly (readonly any[])[]> = [
  ...T[0], ...T[1], ...T[2], ...T[3], ...T[4],
  ...T[5], ...T[6], ...T[7], ...T[8], ...T[9],
  ...T[10], ...T[11], ...T[12], ...T[13], ...T[14],
  ...T[15], ...T[16], ...T[17], ...T[18], ...T[19]
];

// Taken from: https://stackoverflow.com/a/59833759
type Flatten<T extends readonly any[]> = ConcatX<
  [...{ [K in keyof T]: T[K] extends any[] ? T[K] : [T[K]] }, ...[][]]
>;

export type NonVoid<T> = T extends void ? never : T;

export abstract class NewType<Name extends string, T> {
  protected constructor(readonly type: Name, readonly val: T) {}

  public toString(): string {
    return `${this.val}`;
  }

  public toJSON(): T {
    return this.val;
  }
}

type IsOptional<T> = Exclude<T, NonNullable<T>> extends never ? false : true;

type OptKeys<T> = {
  [K in keyof T]-?: IsOptional<T[K]> extends false ? never : K;
}[keyof T];

type ReqKeys<T> = {
  [K in keyof T]-?: IsOptional<T[K]> extends false ? K : never;
}[keyof T];

export type PickOpt<T> = {
  [K in OptKeys<T>]+?: IsOptional<T[K]> extends false ? never : T[K];
};

export type PickReq<T> = {
  [K in ReqKeys<T>]-?: IsOptional<T[K]> extends false ? T[K] : never;
};

export type Merge<A, B, C = A & B> = {
  [K in keyof C]: C[K];
};
