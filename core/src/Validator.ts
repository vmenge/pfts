import { option, Option } from "./Option";
import { AsyncResult } from "./AsyncResult";
import { none } from "./Option";
import { err, ok, Result } from "./Result";
import { PickOpt, PickReq, Merge } from "./type-utils";

type NestedValidator<A extends Validator<A>> = A extends Validator<infer B> ? B : never;
export type ValidatorType<T extends Validator<any>> = NestedValidator<T>;
export type ValidatorOptType<T extends Validator<any>> = Merge<
  PickReq<NestedValidator<T>>,
  PickOpt<NestedValidator<T>>
>;

type ValidatorOptions = {
  isObj: boolean;
  canBeNull: boolean;
  canBeUndefined: boolean;
  optional: boolean;
};

const ValidatorOptions = {
  default(): ValidatorOptions {
    return {
      isObj: false,
      canBeNull: false,
      canBeUndefined: false,
      optional: false,
    };
  },
};

const vErr = (...errs: string[]) => err(errs);

const actualType = (a: any): string => {
  if (a === null) return "null";
  if (a === undefined) return "undefined";
  if (Array.isArray(a)) return "array";
  return typeof a;
};

const exp = (expected: string, actual: any): string =>
  `expected: '${expected}', got: '${actualType(actual)}' with value: '${actual}'`;

export class Validator<A> {
  private constructor(
    private readonly fn: (value: unknown) => Result<A, string[]>,
    private readonly opt = ValidatorOptions.default()
  ) {}

  static new<A>(fn: (value: unknown) => Result<A, string[]>): Validator<A> {
    return new Validator(fn);
  }

  static number = Validator.new(n => (typeof n === "number" && !Number.isNaN(n) ? ok(n) : vErr(exp("number", n))));
  static boolean = Validator.new(n => (typeof n === "boolean" ? ok(n) : vErr(exp("boolean", n))));
  static string = Validator.new(n => (typeof n === "string" ? ok(n) : vErr(exp("string", n))));

  static date = Validator.new(n => {
    if (typeof n === "string") {
      const date = new Date(n);

      return Number.isNaN(Number(date)) ? vErr(`could not parse date string with value: ${n}`) : ok(date);
    }

    return vErr(exp("date string", n));
  });

  /**
   * A string discriminated union validator.
   * @example
   */
  static du<T extends readonly string[]>(...cases: T): Validator<T[number]> {
    return Validator.new(n => {
      if (typeof n !== "string" || !cases.includes(n)) {
        const expected = cases.join(" | ");
        return vErr(exp(expected, n));
      }

      return ok(n) as any;
    });
  }

  static record<T>(values: Validator<T>): Validator<Record<string, T>> {
    return new Validator(n => {
      if (typeof n !== "object" || Array.isArray(n) || n === null) {
        return vErr(exp("object", n));
      }

      const errs = Object.entries(n).flatMap(([key, val]) =>
        values
          .validate(val)
          .errToArray()
          .flatMap(errs => errs.map(err => `<${key}> - ${err}`))
      );

      if (errs.length > 0) {
        return err(errs);
      }

      return ok(n) as any;
    });
  }

  static array<T>(v: Validator<T>): Validator<T[]> {
    const isArray = (n: unknown): Result<any[], string[]> => (Array.isArray(n) ? ok(n) : vErr(exp("array", n)));

    return new Validator(
      n =>
        isArray(n).bind(arr => {
          const res = arr.map((el, i) => v.fn(el).mapErr(err => `[${i}]: ${err.join(", ")}`));

          return Result.hoard(res).mapErr(x => x.toArray());
        }),
      { ...ValidatorOptions.default(), isObj: true }
    );
  }

  static tuple<T extends Validator<any>[]>(
    ...vs: T
  ): Validator<{ [idx in keyof T]: T[idx] extends Validator<infer K> ? K : never }> {
    const isTuple = (n: unknown): Result<any[], string[]> => (Array.isArray(n) ? ok(n) : vErr(exp("tuple", n)));

    return new Validator(
      n =>
        isTuple(n).bind(arr => {
          if (arr.length !== vs.length) return vErr("tuple length does not match");

          const res = arr.map((el, i) => {
            return vs[i].fn(el).mapErr(err => `[${i}]: ${err.join(", ")}`);
          });

          return Result.hoard(res).mapErr(x => x.toArray());
        }),
      { ...ValidatorOptions.default(), isObj: true }
    ) as any;
  }

  static obj<T extends Record<string, Validator<any>>>(vObj: T): Validator<{ [k in keyof T]: NestedValidator<T[k]> }> {
    return new Validator(
      n => {
        const obj = n as any;
        if (typeof obj !== "object" || Array.isArray(obj)) {
          return vErr(exp("object", n));
        }

        const res: any = {};
        const errs: string[] = [];

        for (const [key, val] of Object.entries(vObj)) {
          const r = val.validate(obj[key]);

          if (r.isOk) {
            res[key] = r.raw;
          } else {
            (r.raw as string[]).forEach(e => {
              const msg = val.opt.isObj && e.startsWith("[") ? e.replace("[", `[${key}.`) : `[${key}]: ${e}`;
              errs.push(msg);
            });
          }
        }

        if (errs.length === 0) {
          return ok(res);
        }

        return err(errs);
      },
      { ...ValidatorOptions.default(), isObj: true }
    );
  }

  option(): Validator<Option<A>> {
    return new Validator(this.fn, { ...this.opt, optional: true }) as any;
  }

  orNull(): Validator<A | null> {
    return new Validator(this.fn, { ...this.opt, canBeNull: true }) as any;
  }

  orUndefined(): Validator<A | undefined> {
    return new Validator(this.fn, { ...this.opt, canBeUndefined: true }) as any;
  }

  validate = (n: unknown): Result<A, string[]> => {
    // Extremely unsafe casting below, made safe only by the fact that there is only ONE WAY to mark
    // the Validator as optional / nullable / undefineaable.
    if ((this.opt.canBeNull || this.opt.canBeUndefined || this.opt.optional) && (n === null || n === undefined)) {
      if (this.opt.canBeNull) {
        return ok(null) as any;
      }

      if (this.opt.canBeUndefined) {
        return ok(undefined) as any;
      }

      return ok(none()) as any;
    }

    const result = this.fn(n);

    if (this.opt.optional) {
      return result.map(option) as any;
    }

    return result;
  };

  validateResponse = (res: Response, type: "text" | "json" = "json"): AsyncResult<A, string[]> =>
    AsyncResult.run(async () => {
      if (type === "text") {
        return res
          .text()
          .then(this.validate)
          .catch(e => Promise.resolve(err([e instanceof Error ? e.message : "Uknown error."])));
      }

      return res
        .json()
        .then(this.validate)
        .catch(e => Promise.resolve(err([e instanceof Error ? e.message : "Uknown error."])));
    });
}
