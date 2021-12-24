import { err, list, ok, Result } from "@pfts/core/src";

describe("Result", () => {
  describe("Result.ce()", () => {
    it("Happy path works correctly", () => {
      const res = Result.ce(function* () {
        const a = yield* ok(5);
        const b = yield* ok(10);
        const c = yield* ok(15);

        return a + b + c;
      });

      expect(res.value).toEqual(30);
    });

    it("Failure path works correctly", () => {
      const res = Result.ce(function* () {
        const a = yield* ok(5);
        const b = yield* err("oops");
        const c = yield* err("oh no!");

        return a + b + c;
      });

      expect(res.err).toEqual("oops");
    });
  });

  describe("Result.hoard()", () => {
    describe("Tuple Size: 2", () => {
      it("Happy path", () => {
        const a = ok(5);
        const b = ok("a");

        const res = Result.hoard([a, b]);

        expect(res.raw).toEqual([5, "a"]);
      });

      it("Error path", () => {
        const a = err("one");
        const b = err("two");

        const res = Result.hoard([a, b]);

        const expected = list("one", "two");
        expect(res.err.eq(expected)).toEqual(true);
      });
    });

    describe("Tuple Size: 3", () => {
      it("Happy path", () => {
        const a = ok(5);
        const b = ok("a");
        const c = ok(true);

        const res = Result.hoard([a, b, c]);

        expect(res.raw).toEqual([5, "a", true]);
      });

      it("Error path", () => {
        const a = ok(1);
        const b = err("two");
        const c = err("three");

        const res = Result.hoard([a, b, c]);

        const expected = list("two", "three");
        expect(res.err.eq(expected)).toEqual(true);
      });
    });

    describe("Tuple Size: 7", () => {
      it("Happy path", () => {
        const a = ok(5);
        const b = ok("a");
        const c = ok(1);
        const d = ok(false);
        const e = ok(99);
        const f = ok("one!");
        const g = ok(["hey"]);

        const res = Result.hoard([a, b, c, d, e, f, g]);

        expect(res.raw).toEqual([5, "a", 1, false, 99, "one!", ["hey"]]);
      });

      it("Error path", () => {
        const a = ok(1);
        const b = err("two");
        const c = err("three");
        const d = ok(true);
        const e = err("five");
        const f = err("six");
        const g = ok({ name: "john" });

        const res = Result.hoard([a, b, c, d, e, f, g]);

        const expected = list("two", "three", "five", "six");
        expect(res.err.eq(expected)).toEqual(true);
      });
    });
  });
});
