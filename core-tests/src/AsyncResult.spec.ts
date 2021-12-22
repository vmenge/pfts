import { err, ok, async, asyncResult, AsyncResult } from "@pfts/core/src";

describe("AsyncResult", () => {
  describe("AsyncResult.ce()", () => {
    it("Happy path works correctly", done => {
      const res = AsyncResult.ce(function* () {
        const a = yield* ok(5);
        const b = yield* async(10);
        const c = yield* asyncResult(15);

        return a + b + c;
      });

      res.value.then(x => expect(x).toEqual(30)).then(done);
    });

    it("Failure path works correctly", done => {
      const res = AsyncResult.ce(function* () {
        const a = yield* ok(5);
        const b = yield* asyncResult(err("oops"));
        const c = yield* async(15);

        return a + b + c;
      });

      res.err.then(x => expect(x).toEqual("oops")).then(done);
    });

    it("Failure path works correctly II", done => {
      const res = AsyncResult.ce(function* () {
        const a = yield* async(5);
        const b = yield* err("oh no!");
        const c = yield* ok(15);

        return a + b + c;
      });

      res.err.then(x => expect(x).toEqual("oh no!")).then(done);
    });
  });

  describe("implements PromiseLike", () => {
    it("Works correctly", done => {
      const res = (async () => {
        const a = await asyncResult(5);
        const b = await asyncResult(10);
        const c = await asyncResult(15);

        return a.value + b.value + c.value;
      })();

      res.then(x => {
        expect(x).toEqual(30);
        done();
      });
    });
  });
});
