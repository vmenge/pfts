import { Snd, Head } from "./type-utils";

export const ignore = <A>(_: A): void => {};
export const not = (b: boolean) => !b;
export const fst = <A extends any[]>(tuple: [...A]): Head<A> => tuple[0];
export const snd = <A extends any[]>(tuple: [...A]): Snd<A> => tuple[1];

export const greaterThan =
  (greater: number) =>
  (lesser: number): boolean =>
    greater > lesser;

export const lessThan =
  (lesser: number) =>
  (greater: number): boolean =>
    lesser < greater;

export const add = (x: number) => (y: number) => x + y;
export const subt = (x: number) => (y: number) => x - y;
export const mult = (x: number) => (y: number) => x * y;
export const div = (x: number) => (y: number) => x / y;
export const mod = (x: number) => (y: number) => x % y;
