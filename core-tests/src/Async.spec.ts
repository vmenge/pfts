import { async, Async, list, some, Option, ok, err, Result } from "@pfts/core/src";

describe("Async", () => {
  describe("Async.new()", () => {
    it("Creates an Async<number> from 5", done => {
      const val = Async.new(5);

      expect(val).toBeInstanceOf(Async);

      val.iter(x => {
        expect(x).toEqual(5);
        done();
      });
    });

    it("Creates an Async<number> from Promise<number>", done => {
      const val = Async.new(Promise.resolve(5));

      expect(val).toBeInstanceOf(Async);

      val.iter(x => {
        expect(x).toEqual(5);
        done();
      });
    });
  });

  describe("Async.ofPromise()", () => {
    it("Creates an Async<string> from Promise<string>", done => {
      const val = Async.ofPromise(Promise.resolve("bla"));

      val.iter(x => {
        expect(x).toEqual("bla");
        done();
      });
    });
  });

  describe(".promise", () => {
    it("Returns the inner Promise<number> inside an Async<number>", done => {
      const val = async(5).promise;

      expect(val).toBeInstanceOf(Promise);

      val.then(x => {
        expect(x).toEqual(5);
        done();
      });
    });
  });

  describe("Async.map()", () => {
    it("Executes code against the Async<number> value once the async operation completes.", done => {
      Async.map((x: number) => x * 2)(async(10)).iter(x => {
        expect(x).toEqual(20);
        done();
      });
    });
  });

  describe(".map()", () => {
    it("Executes code against the Async<number> value once the async operation completes.", done => {
      async(10)
        .map(x => x * 2)
        .iter(x => {
          expect(x).toEqual(20);
          done();
        });
    });
  });

  describe("Async.map2()", () => {
    it("Executes code against both Async<number> values once their operations are completed", done => {
      Async.map2((x: number, y: number) => x + y)(async(10))(async(5)).iter(x => {
        expect(x).toEqual(15);
        done();
      });
    });

    it("Executes code against both Async<number> and Promise<number> values once their operations are completed", done => {
      Async.map2((x: number, y: number) => x + y)(Promise.resolve(10))(async(5)).iter(x => {
        expect(x).toEqual(15);
        done();
      });
    });
  });

  describe(".map2()", () => {
    it("Executes code against both Async<number> values once their operations are completed", done => {
      async(10)
        .map2(async(5), (x, y) => x + y)
        .iter(x => {
          expect(x).toEqual(15);
          done();
        });
    });

    it("Executes code against both Async<number> and Promise<number> values once their operations are completed", done => {
      async(10)
        .map2(Promise.resolve(5), (x, y) => x + y)
        .iter(x => {
          expect(x).toEqual(15);
          done();
        });
    });
  });

  describe("Async.bind()", () => {
    it("Executes the binder function returning the exepected value", done => {
      Async.bind((x: number) => async(x + 50))(async(10)).iter(x => {
        expect(x).toEqual(60);
        done();
      });
    });
  });

  describe(".bind()", () => {
    it("Executes the binder function returning the exepected value", done => {
      async(10)
        .bind(x => async(x + 50))
        .iter(x => {
          expect(x).toEqual(60);
          done();
        });
    });
  });

  describe(".tee()", () => {
    it("Returns the same instance of Async<A> after executing a side-effectful method", done => {
      async(666).iter(x => {
        expect(x).toEqual(666);
        done();
      });
    });
  });

  describe(".zip()", () => {
    it("Tuples together the result of two Async values", done => {
      async(10)
        .zip(async("hello"))
        .iter(([x, y]) => {
          expect(x).toEqual(10);
          expect(y).toEqual("hello");
          done();
        });
    });

    it("Tuples together the result of an Async value and a Promise", done => {
      async(10)
        .zip(Promise.resolve("hello"))
        .iter(([x, y]) => {
          expect(x).toEqual(10);
          expect(y).toEqual("hello");
          done();
        });
    });
  });

  describe(".zip3()", () => {
    it("Tuples together the result of three Async values", done => {
      async(10)
        .zip3(async("hello"), async(false))
        .iter(([x, y, z]) => {
          expect(x).toEqual(10);
          expect(y).toEqual("hello");
          expect(z).toEqual(false);

          done();
        });
    });
  });

  describe("Async.sequenceArray()", () => {
    it("Sequences a Async<number>[]", done => {
      const asyncArr = [1, 2, 3].map(async);
      const actual = Async.sequenceArray(asyncArr);

      expect(actual).toBeInstanceOf(Async);

      actual.iter(x => {
        expect(x).toEqual([1, 2, 3]);
        done();
      });
    });

    it("Sequences a Promise<number>[]", done => {
      const promiseArr = [1, 2, 3].map(async x => x);
      const actual = Async.sequenceArray(promiseArr);

      expect(actual).toBeInstanceOf(Async);

      actual.iter(x => {
        expect(x).toEqual([1, 2, 3]);
        done();
      });
    });
  });

  describe("Async.sequenceList()", () => {
    it("Sequences a List<Async<number>>", done => {
      const asyncList = list(1, 2, 3).map(async);
      const actual = Async.sequenceList(asyncList);

      expect(actual).toBeInstanceOf(Async);

      actual.iter(x => {
        const res = list(1, 2, 3).forall(y => x.contains(y));
        expect(res).toEqual(true);

        done();
      });
    });

    it("Sequences a List<Promise<number>>", done => {
      const promiseList = list(1, 2, 3).map(async x => x);
      const actual = Async.sequenceList(promiseList);

      expect(actual).toBeInstanceOf(Async);

      actual.iter(x => {
        const res = list(1, 2, 3).forall(y => x.contains(y));
        expect(res).toEqual(true);

        done();
      });
    });
  });

  describe("Async.sequenceOption()", () => {
    it("Sequences an Option<Async<number>>", done => {
      const optAsync = some(async(5));
      const asyncOpt = Async.sequenceOption(optAsync);

      expect(asyncOpt).toBeInstanceOf(Async);
      asyncOpt.iter(x => {
        expect(x).toBeInstanceOf(Option);
        expect(x.raw).toEqual(5);

        done();
      });
    });
  });

  describe("Async.sequenceResult()", () => {
    it("Sequences a Result<Async<number>, _>", done => {
      const resAsync = ok(async(5));
      const asyncRes = Async.sequenceResult(resAsync);

      expect(asyncRes).toBeInstanceOf(Async);
      asyncRes.iter(x => {
        expect(x).toBeInstanceOf(Result);
        expect(x.raw).toEqual(5);

        done();
      });
    });
  });

  describe("Async.sequenceErr()", () => {
    it("Sequences a Result<_, Async<string>>", done => {
      const resAsync = err(async("oops"));
      const asyncRes = Async.sequenceErr(resAsync);

      expect(asyncRes).toBeInstanceOf(Async);
      asyncRes.iter(x => {
        expect(x).toBeInstanceOf(Result);
        expect(x.raw).toEqual("oops");

        done();
      });
    });
  });

  describe("Async.flatten()", () => {
    it("Flattens a Async<Async<number>> into a Async<number>", done => {
      Async.flatten(async(async(5))).iter(x => {
        expect(x).toEqual(5);
        done();
      });
    });
  });

  describe("Async.sequenceOption()", () => {
    it("Sequences an Option<Async<number>> into a Async<Option<number>>", done => {
      const a = some(async(5));
      const b = Async.sequenceOption(a);

      expect(b).toBeInstanceOf(Async);
      b.iter(x => expect(x).toBeInstanceOf(Option)).iter(done);
    });
  });

  describe("Async.ce()", () => {
    it("Works correctly", done => {
      const res = Async.ce(function* () {
        const a = yield* async(5);
        const b = yield* async(10);
        const c = yield* async(15);

        return a + b + c;
      });

      res.iter(x => {
        expect(x).toEqual(30);
        done();
      });
    });
  });

  describe("implements PromiseLike", () => {
    it("Works correctly", done => {
      const res = (async () => {
        const a = await async(5);
        const b = await async(10);
        const c = await async(15);

        return a + b + c;
      })();

      res.then(x => {
        expect(x).toEqual(30);
        done();
      });
    });
  });
});
