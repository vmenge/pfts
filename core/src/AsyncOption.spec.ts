import { none, some, async, asyncOption, AsyncOption } from "@pfts/core/src";

describe("AsyncOption", () => {
  describe("::ce()", () => {
    it("Happy path works correctly", async () => {
      const res = await AsyncOption.ce(function* () {
        const a = yield* some(5);
        const b = yield* async(10);
        const c = yield* asyncOption(15);

        return a + b + c;
      });

      expect(res.raw).toEqual(30);
    });

    it("Failure path works correctly", async () => {
      const res = await AsyncOption.ce(function* () {
        const a = yield* some(5);
        const b = yield* asyncOption(undefined);
        const c = yield* some(15);

        return a + b + c;
      });

      expect(res.isNone).toEqual(true);
    });

    it("Failure path works correctly II", async () => {
      const res = await AsyncOption.ce(function* () {
        const a = yield* some(5);
        const b = yield* none();
        const c = yield* some(15);

        return a + b + c;
      });

      expect(res.isNone).toEqual(true);
    });
  });

  describe("implements PromiseLike", () => {
    it("Works correctly", async () => {
      const a = await asyncOption(5);
      const b = await asyncOption(10);
      const c = await asyncOption(15);

      const res = a.value + b.value + c.value;

      expect(res).toEqual(30);
    });
  });
});
