import { err, Option, list, ok, Result, id, AsyncResult, Fn, some, none, List, seq, Seq } from "@pfts/core/src";

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

  describe(".bind()", () => {
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

  describe(".zip", () => {
    it("zips together two Oks", () => {
      const a = ok(1);
      const b = ok(true);

      const ab = a.zip(b);
      expect(ab.raw).toEqual([1, true]);
    });

    it("returns the instance Err, and then the arg Err", () => {
      const a = err("oops");
      const b = err("oh no!");

      const ab = a.zip(b);
      const ba = b.zip(a);

      expect(ab.err).toEqual("oops");
      expect(ba.err).toEqual("oh no!");
    });
  });

  describe(".zip3", () => {
    it("zips together three Oks", () => {
      const a = ok(1);
      const b = ok(true);
      const c = ok("hey");

      const abc = a.zip3(b, c);
      expect(abc.raw).toEqual([1, true, "hey"]);
    });

    it("returns the instance Err, then the arg1 Err, and finally the arg2 Err", () => {
      const a = err("oops");
      const b = err("oh no!");
      const c = err("aaa");
      const d = ok<number, string>(5);
      const e = ok<boolean, string>(true);

      const abc = a.zip3(b, c);
      const dba = d.zip3(b, a);
      const edc = e.zip3(d, c);

      expect(abc.err).toEqual("oops");
      expect(dba.err).toEqual("oh no!");
      expect(edc.err).toEqual("aaa");
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

  describe(".map2()", () => {
    it("maps over 2 Oks", () => {
      const res = ok(1).map2(ok(2), (x, y) => x + y);

      expect(res.raw).toEqual(3);
    });

    it("returns Errs in the correct order", () => {
      const err1 = err("1");
      const err2 = err("2");
      const res1 = err1.map2(err2, () => {});
      const res2 = err2.map2(err1, () => {});

      expect(res1.raw).toEqual("1");
      expect(res2.raw).toEqual("2");
    });
  });

  describe(".map3()", () => {
    it("maps over 3 Oks", () => {
      const res = ok(1).map3(ok(2), ok(3), (x, y, z) => x + y + z);

      expect(res.raw).toEqual(6);
    });

    it("returns Errs in the correct order", () => {
      const ok1 = ok<number, string>(1);
      const ok2 = ok<number, string>(2);
      const err1 = err("1");
      const err2 = err("2");
      const err3 = err("3");
      const res1 = err1.map3(ok1, err2, () => {});
      const res2 = err2.map3(err1, ok1, () => {});
      const res3 = err3.map3(err2, err1, () => {});
      const res4 = ok1.map3(err3, err2, () => {});
      const res5 = ok1.map3(ok2, err2, () => {});

      expect(res1.raw).toEqual("1");
      expect(res2.raw).toEqual("2");
      expect(res3.raw).toEqual("3");
      expect(res4.raw).toEqual("3");
      expect(res5.raw).toEqual("2");
    });
  });

  describe(".toOption()", () => {
    it("returns the Result<A, B> as Option<A>", () => {
      const okOpt = ok(1).toOption();
      expect(okOpt).toBeInstanceOf(Option);
      expect(okOpt.raw).toEqual(1);

      const errOpt = err("oops").toOption();
      expect(errOpt).toBeInstanceOf(Option);
      expect(errOpt.raw).toBeUndefined();
    });
  });

  describe(".errToOption()", () => {
    it("returns the Result<A, B> as Option<B>", () => {
      const okOpt = ok(1).errToOption();
      expect(okOpt).toBeInstanceOf(Option);
      expect(okOpt.raw).toBeUndefined();

      const errOpt = err("oops").errToOption();
      expect(errOpt).toBeInstanceOf(Option);
      expect(errOpt.raw).toEqual("oops");
    });
  });

  describe(".toSeq()", () => {
    it("returns the Result<A< B> as Seq<A>", () => {
      const seq = ok("one").toSeq();
      expect(seq.length()).toEqual(1);
      expect(seq.head().raw).toEqual("one");

      const empty = err<number, string>("oops").toSeq();
      expect(empty.isEmpty()).toEqual(true);
    });
  });

  describe(".toList()", () => {
    it("returns the Result<A< B> as List<A>", () => {
      const lst = ok("one").toList();
      expect(lst.length).toEqual(1);
      expect(lst.head().raw).toEqual("one");

      const empty = err<number, string>("oops").toList();
      expect(empty.isEmpty).toEqual(true);
    });
  });

  describe(".toArray()", () => {
    it("returns the Result<A< B> as Array<A>", () => {
      const arr = ok("one").toArray();
      expect(arr.length).toEqual(1);
      expect(arr[0]).toEqual("one");

      const empty = err<number, string>("oops").toArray();
      expect(empty.length).toEqual(0);
    });
  });

  describe(".errToList()", () => {
    it("returns the Result<A< B> as List<A>", () => {
      const lst = err("one").errToList();
      expect(lst.length).toEqual(1);
      expect(lst.head().raw).toEqual("one");

      const empty = ok<number, string>(1).errToList();
      expect(empty.isEmpty).toEqual(true);
    });
  });

  describe(".errToArray()", () => {
    it("returns the Result<A< B> as Array<A>", () => {
      const arr = err("one").errToArray();
      expect(arr.length).toEqual(1);
      expect(arr[0]).toEqual("one");

      const empty = ok<number, string>(1).errToArray();
      expect(empty.length).toEqual(0);
    });
  });

  describe(".defaultValue()", () => {
    it("returns the Ok value or the default value", () => {
      const a = ok(1).defaultValue(2);
      expect(a).toEqual(1);

      const b = err<number, string>("oops").defaultValue(3);
      expect(b).toEqual(3);
    });
  });

  describe(".defaultWith()", () => {
    it("returns the Ok value or the value from the defaultWith fn", () => {
      const a = ok(1).defaultWith(() => 2);
      expect(a).toEqual(1);

      const b = err<number, string>("oops").defaultWith(() => 3);
      expect(b).toEqual(3);
    });
  });

  describe(".orElse()", () => {
    it("returns the Result instance if it is Ok or else the value from the args", () => {
      const k1 = ok(1);
      const k2 = ok(2);
      const e1 = err<number, string>("1");
      const e2 = err<number, string>("2");

      const a = k1.orElse(k2);
      const b = k2.orElse(k1);
      const c = e1.orElse(k1);
      const d = e2.orElse(e1);

      expect(a.raw).toEqual(1);
      expect(b.raw).toEqual(2);
      expect(c.raw).toEqual(1);
      expect(d.raw).toEqual("1");
    });
  });

  describe(".orElseWith()", () => {
    it("returns the Result instance if it is Ok or else the return value from the fn from the args", () => {
      const k1 = ok(1);
      const k2 = ok(2);
      const e1 = err<number, string>("1");
      const e2 = err<number, string>("2");

      const a = k1.orElseWith(() => k2);
      const b = k2.orElseWith(() => k1);
      const c = e1.orElseWith(() => k1);
      const d = e2.orElseWith(() => e1);

      expect(a.raw).toEqual(1);
      expect(b.raw).toEqual(2);
      expect(c.raw).toEqual(1);
      expect(d.raw).toEqual("1");
    });
  });

  describe(".match()", () => {
    const okFn = (n: number) => n.toString();

    it("returns the value from okFn if is Ok", () => {
      const res = ok(1).match(okFn, id);
      expect(res).toEqual("1");
    });

    it("returns the value from errFn if is Err", () => {
      const res = err("oh no").match(okFn, id);
      expect(res).toEqual("oh no");
    });
  });

  describe(".to()", () => {
    it("pipes the Result instance to a function", () => {
      const res = ok(1).to(x => x.raw);
      expect(res).toEqual(1);
    });
  });

  describe(".toAsyncResult()", () => {
    it("returns the Result<A, B> as AsyncResult<A, B>", done => {
      const res = ok(1).toAsyncResult();

      expect(res).toBeInstanceOf(AsyncResult);

      res.value.then(x => {
        expect(x).toEqual(1);
        done();
      });
    });
  });

  describe(".toString()", () => {
    it("returns the A or B inside the Result as a string", () => {
      const k = ok(1).toString();
      const e = err(true).toString();

      expect(k).toEqual("1");
      expect(e).toEqual("true");
    });
  });

  describe(".apply()", () => {
    it("Applies the fn if both are Ok", () => {
      const fn = ok((x: number) => x * 2);
      const res = ok(5).apply(fn);

      expect(res.raw).toEqual(10);
    });

    it("Doesn't apply the fn if both are not Ok", () => {
      const fn = ok<Fn<[number], number>, string>((x: number) => x * 2);
      const e1 = err("oops");
      const e2 = err<Fn<[number], number>, string>("oh no");

      const res1 = e1.apply(fn);
      const res2 = ok<number, string>(1).apply(e2);

      expect(res1.raw).toEqual("oops");
      expect(res2.raw).toEqual("oh no");
    });
  });

  describe("Result.ofOption()", () => {
    it("Creates a Result from an Option", () => {
      const k = Result.ofOption("oops")(some(1));
      const e = Result.ofOption("oops")(none<number>());

      expect(k.raw).toEqual(1);
      expect(e.raw).toEqual("oops");
    });
  });

  describe("Result.sequenceArray()", () => {
    it("Sequences an Array of Ok Results", () => {
      const arr = [ok(1), ok(2), ok(3)];
      const k = Result.sequenceArray(arr);

      expect(k).toBeInstanceOf(Result);
      expect(k.raw).toEqual([1, 2, 3]);
    });

    it("Returns the first error in the Array", () => {
      const arr = [ok(1), err("1"), err("2"), ok(2)];
      const e = Result.sequenceArray(arr);

      expect(e).toBeInstanceOf(Result);
      expect(e.raw).toEqual("1");
    });
  });

  describe("Result.sequenceList()", () => {
    it("Sequences a List of Ok Results", () => {
      const lst = list(ok(1), ok(2), ok(3));
      const k = Result.sequenceList(lst);

      expect(k).toBeInstanceOf(Result);
      expect((k.raw as List<number>).toArray()).toEqual([1, 2, 3]);
    });

    it("Returns the first error in the List", () => {
      const lst = list(ok(1), err("1"), err("2"), ok(2));
      const e = Result.sequenceList(lst);

      expect(e).toBeInstanceOf(Result);
      expect(e.raw).toEqual("1");
    });
  });

  describe("Result.sequenceSeq()", () => {
    it("Sequences a Seq of Ok Results", () => {
      const sq = seq(ok(1), ok(2), ok(3));
      const k = Result.sequenceSeq(sq);

      expect(k).toBeInstanceOf(Result);
      expect((k.raw as Seq<number>).toArray()).toEqual([1, 2, 3]);
    });

    it("Returns the first error in the Seq", () => {
      const sq = seq(ok(1), err("1"), err("2"), ok(2));
      const e = Result.sequenceSeq(sq);

      expect(e).toBeInstanceOf(Result);
      expect(e.raw).toEqual("1");
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
