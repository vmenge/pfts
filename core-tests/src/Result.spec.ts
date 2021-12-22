import { err, ok, Result } from "@pfts/core/src";

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
});
