import { none, some, Option, option } from "@pfts/core/src";

describe("Option", () => {
  describe("::new()", () => {
    it("Creates an Option<T> from a value T that may or may not be null or undefined.", () => {
      const x = Option.new(5);
      expect(x.value).toEqual(5);
      expect(x.isSome).toEqual(true);

      const y = Option.new(undefined);
      expect(y.isNone).toEqual(true);
    });
  });

  describe("::some()", () => {
    it("Creates a `Some` `Option<T>` from a value that is NOT null or undefined.", () => {
      const x = Option.some(5);
      expect(x.value).toEqual(5);
    });
  });

  describe("::none()", () => {
    it("Creates a `None` `Option<T>` containing no value.", () => {
      const x = Option.none();
      expect(x.isNone).toEqual(true);
    });
  });

  describe(".value", () => {
    it("returns the `Some` value contained inside the `Option<A>`", () => {
      const x = some(5);
      expect(x.value).toEqual(5);
    });

    it("throws an Error if the `Option<A>` is `None`", () => {
      const y = none();
      expect(() => y.value).toThrow();
    });
  });

  describe(".raw", () => {
    it("returns the raw value contained inside the `Option<A>", () => {
      const x = option("something");
      expect(x.raw).toEqual("something");

      const y = option(undefined);
      expect(y.raw).toEqual(undefined);
    });
  });

  describe(".isSome", () => {
    it("returns true if `Option<A>` is `Some`", () => {
      const val = option(5);
      expect(val.isSome).toEqual(true);
    });

    it("returns false if `Option<A>` is `None`", () => {
      const val = none();
      expect(val.isSome).toEqual(false);
    });
  });

  describe(".isNone", () => {
    it("returns true if `Option<A>` is `None`", () => {
      const val = none();
      expect(val.isNone).toEqual(true);
    });

    it("returns false if `Option<A>` is `Some`", () => {
      const val = some(5);
      expect(val.isNone).toEqual(false);
    });
  });

  describe(".map()", () => {
    it("applies the mapping fn on the value inside the Option if it is Some", () => {
      const a = some(5).map(x => x * 2);
      expect(a.raw).toEqual(10);
    });

    it("does nothing if the Option is None", () => {
      const b = none().map(x => x * 2);
      expect(b.raw).toBeUndefined();
    });
  });

  describe(".map2()", () => {
    it("Given an `Option<B>`, evaluates the given function against the values of `Option<A>` and `Option<B>` if both are `Some`", () => {
      const a = some(5).map2(some(10), (x, y) => x + y);
      expect(a.value).toEqual(15);

      const b = some(10).map2(none(), (x, y) => x + y);
      expect(() => b.value).toThrow();
      expect(b.isNone).toEqual(true);
    });
  });

  describe(".map3()", () => {
    it("Given an `Option<B>` and  an `Option<C>`, evaluates the given function against the values of `Option<A>`, `Option<B>` and `Option<C>` if all are `Some`.", () => {
      const a = some(5).map3(some(10), some(100), (x, y, z) => x + y + z);
      expect(a.value).toEqual(115);

      const b = some(10).map3(none(), some(66), (x, y, z) => x + y + z);
      expect(() => b.value).toThrow();
      expect(b.isNone).toEqual(true);
    });
  });

  describe(".bind()", () => {
    it("Evaluates the given function against the value of `Option<A>` if the `Option` is `Some`.", () => {
      const a = some(5).bind(x => some(x * 2));
      expect(a.value).toEqual(10);

      const b = none().bind(x => some(x * 2));
      expect(() => b.value).toThrow();
      expect(b.isNone).toEqual(true);
    });
  });

  describe(".apply()", () => {
    it("Applies the function on this instance of Option if both are `Some`.", () => {
      const fn = some((x: number) => x * 2);
      const res = some(5).apply(fn);

      expect(res.value).toEqual(10);
    });
  });

  describe("::ce()", () => {
    it("Happy path works correctly", () => {
      const res = Option.ce(function* () {
        const a = yield* some(5);
        const b = yield* some(10);
        const c = yield* some(15);

        return a + b + c;
      });

      expect(res.value).toEqual(30);
    });

    it("Failure path works correctly", () => {
      const res = Option.ce(function* () {
        const a = yield* some(5);
        const b = yield* none();
        const c = yield* some(15);

        return a + b + c;
      });

      expect(res.raw).toBeUndefined();
    });
  });
});
