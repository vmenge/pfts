import { none, some, Option } from "@pfts/core/src";

describe("Option", () => {
  describe("Option.ce()", () => {
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
