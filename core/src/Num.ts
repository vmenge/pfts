import { Option, some, none } from "./Option";

export class Num {
  private constructor() {}

  static parse(str: string): Option<number> {
    const res = Number(str);

    if (isNaN(res)) {
      return none();
    }

    return some(res);
  }

  static parseFloat(str: string): Option<number> {
    const res = Number.parseFloat(str);

    if (isNaN(res)) {
      return none();
    }

    return some(res);
  }

  static parseInt =
    (radix: number) =>
    (str: string): Option<number> => {
      const res = Number.parseInt(str, radix);

      if (Number.isNaN(res)) {
        return none();
      }

      return some(res);
    };
}
