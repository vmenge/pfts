import { none, some, async, asyncOption, AsyncOption } from "@pfts/core/src";

describe("AsyncOption", () => {
  describe("AsyncOption.ce()", () => {
    it("Happy path works correctly", done => {
      const res = AsyncOption.ce(function* () {
        const a = yield* some(5);
        const b = yield* async(10);
        const c = yield* asyncOption(15);

        return a + b + c;
      });

      res.value.then(x => expect(x).toEqual(30)).then(done);
    });

    it("Failure path works correctly", done => {
      const res = AsyncOption.ce(function* () {
        const a = yield* some(5);
        const b = yield* asyncOption(undefined);
        const c = yield* some(15);

        return a + b + c;
      });

      res.isNone.then(x => expect(x).toEqual(true)).then(done);
    });

    it("Failure path works correctly II", done => {
      const res = AsyncOption.ce(function* () {
        const a = yield* some(5);
        const b = yield* none();
        const c = yield* some(15);

        return a + b + c;
      });

      res.isNone.then(x => expect(x).toEqual(true)).then(done);
    });
  });

  describe("implements PromiseLike", () => {
    it("Works correctly", done => {
      const res = (async () => {
        const a = await asyncOption(5);
        const b = await asyncOption(10);
        const c = await asyncOption(15);

        return a.value + b.value + c.value;
      })();

      res.then(x => {
        expect(x).toEqual(30);
        done();
      });
    });
  });
});
