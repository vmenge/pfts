import { err, ok, Result } from "./Result";
import { none, option, Option } from "./Option";
import { Flatten } from "./type-utils";
import { List, list } from "./List";

export class Validation<A, B> {
  private constructor(private readonly _val?: A, private readonly _failures: List<B> = list()) {
    if ((this._val === undefined || this._val === null) && this._failures.length === 0) {
      throw new Error("Cannot initialize validation without value or failure.");
    }
  }

  static success = <A, B = never>(a: A): Validation<A, B> => new Validation(a, list());

  static failure<A = never, B = never>(...failures: B[]): Validation<A, B> {
    return new Validation(undefined as any as A, List.ofArray(failures));
  }

  get isSuccess(): boolean {
    return this._failures.length === 0;
  }

  get isFailure(): boolean {
    return !this.isSuccess;
  }

  get value(): A {
    if (this.isFailure) {
      throw new Error("Could not extract value from Result.");
    }

    return this._val!;
  }

  get raw(): A | List<B> {
    if (this.isSuccess) {
      return this._val!;
    }

    return this._failures;
  }

  get failures(): List<B> {
    return this._failures;
  }

  apply<C>(v: Validation<(a: A) => C, B>): Validation<C, B> {
    if (this.isSuccess && v.isSuccess) {
      return success(v._val!(this._val!));
    }

    return failure(...this._failures, ...v._failures);
  }

  map<C>(fn: (a: A) => C): Validation<C, B> {
    if (this.isSuccess) {
      return success(fn(this._val!));
    }

    return this as any as Validation<C, B>;
  }

  map2<C, D>(v: Validation<C, B>, fn: (a: A, c: C) => D): Validation<D, B> {
    if (this.isSuccess) {
      if (v.isSuccess) {
        return success(fn(this._val!, v._val!));
      }

      return v as any as Validation<D, B>;
    }

    return this as any as Validation<D, B>;
  }

  bind<C>(fn: (a: A) => Validation<C, B>): Validation<C, B> {
    if (this.isSuccess) {
      return fn(this._val!);
    }

    return this as any as Validation<C, B>;
  }

  /**
   * Concatenates the failures of the validations.
   */
  zip<C>(v: Validation<C, B>): Validation<[A, C], B> {
    if (this.isSuccess && v.isSuccess) {
      return success([this._val!, v._val!]);
    }

    return failure(...this._failures, ...v._failures);
  }

  match<C>(successFn: (a: A) => C, failuresFn: (b: List<B>) => C): C {
    if (this.isSuccess) {
      return successFn(this._val!);
    }

    return failuresFn(this._failures);
  }

  toResult(): Result<A, List<B>> {
    if (this.isSuccess) {
      return ok(this._val!);
    }

    return err(this._failures);
  }

  toResultWith<C>(fn: (bs: List<B>) => C): Result<A, C> {
    if (this.isSuccess) {
      return ok(this._val!);
    }

    return err(fn(this._failures));
  }

  toOption(): Option<A> {
    if (this.isSuccess) {
      return option(this._val);
    }

    return none();
  }

  static ofResult<A, B>(r: Result<A, B>): Validation<A, B> {
    if (r.isOk) {
      return success(r.value);
    }

    return failure(r.err);
  }

  static ofOption =
    <A, B>(...failures: B[]) =>
    (opt: Option<A>): Validation<A, B> => {
      if (opt.isSome) {
        success(opt.raw!);
      }

      return failure(...failures);
    };
}

export const success = Validation.success;
export const failure = Validation.failure;
