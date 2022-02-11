import { err, ok, async, AsyncResult, asyncOk, asyncErr } from "@pfts/core/src";

describe("AsyncResult", () => {
  describe("::ce()", () => {
    it("Happy path works correctly", async () => {
      const res = await AsyncResult.ce(function* () {
        const a = yield* ok(5);
        const b = yield* async(10);
        const c = yield* asyncOk(15);

        return a + b + c;
      });

      expect(res.raw).toEqual(30);
    });

    it("Failure path works correctly", async () => {
      const res = await AsyncResult.ce(function* () {
        const a = yield* ok(5);
        const b = yield* asyncErr("oops");
        const c = yield* async(15);

        return a + b + c;
      });

      expect(res.raw).toEqual("oops");
    });

    it("Failure path works correctly II", async () => {
      const res = await AsyncResult.ce(function* () {
        const a = yield* async(5);
        const b = yield* err("oh no!");
        const c = yield* ok(15);

        return a + b + c;
      });

      expect(res.raw).toEqual("oh no!");
    });
  });

  describe("implements PromiseLike", () => {
    it("Works correctly", async () => {
      const a = await asyncOk(5);
      const b = await asyncOk(10);
      const c = await asyncOk(15);

      const res = a.value + b.value + c.value;

      expect(res).toEqual(30);
    });
  });
});
