import { Option, some, none } from "./Option";

const parse = (str: string): Option<number> => {
  const res = Number(str);

  if (isNaN(res)) {
    return none();
  }

  return some(res);
};

const parseFloat = (str: string): Option<number> => {
  const res = Number.parseFloat(str);

  if (isNaN(res)) {
    return none();
  }

  return some(res);
};

const parseInt =
  (radix: number) =>
  (str: string): Option<number> => {
    const res = Number.parseInt(str, radix);

    if (isNaN(res)) {
      return none();
    }

    return some(res);
  };

export const Num = {
  parse,
  parseFloat,
  parseInt,
};
