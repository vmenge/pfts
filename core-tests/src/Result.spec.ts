import { err, List, list, ok, Result } from "@pfts/core/src";

describe("Result", () => {
  describe("Result.ok()", () => {
    it("Creates an Ok", () => {
      const res = Result.ok(1);
      expect(res.isOk).toEqual(true);
      expect(res.raw).toEqual(1);
    });
  });

  describe("Result.err()", () => {
    it("Creates an Err", () => {
      const res = Result.err("oops");
      expect(res.isErr).toEqual(true);
      expect(res.raw).toEqual("oops");
    });
  });

  describe(".isOk", () => {
    it("Returns true when Result is Ok", () => {
      const res = ok(1);
      expect(res.isOk).toEqual(true);
    });

    it("Returns false when Result is Err", () => {
      const res = err("oops");
      expect(res.isOk).toEqual(false);
    });
  });

  describe(".isErr", () => {
    it("Returns false when Result is Ok", () => {
      const res = ok(1);
      expect(res.isErr).toEqual(false);
    });

    it("Returns true when Result is Err", () => {
      const res = err("oops");
      expect(res.isErr).toEqual(true);
    });
  });

  describe(".value", () => {
    it("Returns the value of the Result when it is Ok", () => {
      const res = ok(1);
      expect(res.value).toEqual(1);
    });

    it("Throws an Error when Result is not Ok", () => {
      const res = err("oops");
      expect(() => res.value).toThrow();
    });
  });

  describe(".err", () => {
    it("Returns the err of the Result when it is Err", () => {
      const res = err(1);
      expect(res.err).toEqual(1);
    });

    it("Throws an Error when Result is Ok", () => {
      const res = ok("hello");
      expect(() => res.err).toThrow();
    });
  });

  describe(".raw", () => {
    it("Returns the raw value inside a Result, be it Ok or Err", () => {
      const res1 = ok(1);
      expect(res1.raw).toEqual(1);
      const res2 = err(false);
      expect(res2.raw).toEqual(false);
    });
  });

  describe(".map()", () => {
    it("Executes a function against the value of the Result when it is Ok", () => {
      const res = ok(1).map(x => x * 2);
      expect(res.raw).toEqual(2);
    });

    it("Does nothing when the Result is Err", () => {
      const res = err<number, string>("oops").map(x => x * 2);
      expect(res.raw).toEqual("oops");
    });
  });

  describe(".map()", () => {
    it("Executes a Result returning function against the value of the Result when it is Ok, returning a flattened Result", () => {
      const res = ok(1).bind(x => ok(x * 2));
      expect(res.raw).toEqual(2);
    });

    it("Does nothing when the Result is Err", () => {
      const res = err<number, string>("oops").bind(x => ok(x * 2));
      expect(res.raw).toEqual("oops");
    });

    it("Returns the err of the Result from the binding function", () => {
      const res = ok<number, string>(1).bind(_ => err("oh no!"));
      expect(res.raw).toEqual("oh no!");
    });
  });

  describe(".mapErr()", () => {
    it("Maps the err of the Result", () => {
      const res = err(1).mapErr(x => x * 10);
      expect(res.raw).toEqual(10);
    });

    it("Does nothing when the Result is Ok", () => {
      const res = ok<string, number>("hey").mapErr(x => x + 1);
      expect(res.raw).toEqual("hey");
    });
  });

  describe(".iter()", () => {
    it("Iterates over the Result's value when it is Ok", () => {
      let x: number | null = null;
      ok(3).iter(a => (x = a));
      expect(x).toEqual(3);
    });

    it("Does nothing when Result is Err", () => {
      let x: number | null = null;
      err<number, string>("a").iter(a => (x = a));
      expect(x).toBeNull();
    });
  });

  describe(".iterErr()", () => {
    it("Iterates over the Result's value when it is Err", () => {
      let x: number | null = null;
      err(3).iterErr(a => (x = a));
      expect(x).toEqual(3);
    });

    it("Does nothing when Result is Err", () => {
      let x: string | null = null;
      ok<number, string>(5).iterErr(a => (x = a));
      expect(x).toBeNull();
    });
  });

  describe(".tee()", () => {
    it("Iterates over the Result's value when it is Ok, returning the same Result", () => {
      let x: number | null = null;
      const res = ok(3).tee(a => (x = a));
      expect(x).toEqual(3);
      expect(res.raw).toEqual(3);
    });

    it("Does nothing when Result is Err, returning the same Result", () => {
      let x: number | null = null;
      const res = err<number, string>("a").tee(a => (x = a));
      expect(x).toBeNull();
      expect(res.raw).toEqual("a");
    });
  });

  describe(".teeErr()", () => {
    it("Iterates over the Result's value when it is Err, returning the same Result", () => {
      let x: number | null = null;
      const res = err(3).teeErr(a => (x = a));
      expect(x).toEqual(3);
      expect(res.raw).toEqual(3);
    });

    it("Does nothing when Result is Ok, returning the same Result", () => {
      let x: string | null = null;
      const res = ok<number, string>(5).teeErr(a => (x = a));
      expect(x).toBeNull();
      expect(res.raw).toEqual(5);
    });
  });

  describe(".trace()", () => {
    it("Logs the value inside the Result", () => {
      const spy = jest.spyOn(console, "log");

      ok(5).trace();
      expect(spy).toHaveBeenLastCalledWith("5");

      err("hello").trace("msg:");
      expect(spy).toHaveBeenLastCalledWith("msg: hello");
    });
  });

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

  describe("Result.collect()", () => {
    it("Happy path", () => {
      const res = Result.collect({
        firstName: ok("john"),
        lastName: ok("doe"),
        age: ok(99),
      });

      expect(res.raw).toEqual({
        firstName: "john",
        lastName: "doe",
        age: 99,
      });
    });

    it("Sad path", () => {
      const res = Result.collect({
        firstName: err("cannot be null"),
        lastName: ok("doe"),
        age: err("not a number"),
      });

      const expected = list("cannot be null", "not a number");

      expect(res.err.eq(expected)).toEqual(true);
    });
  });
});
