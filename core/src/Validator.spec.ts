import { Validator, ValidatorType } from "@pfts/core/src";

const { string, number, boolean, date, array, tuple, obj, du, record } = Validator;

describe("Validator", () => {
  describe("Primitives", () => {
    it("string", () => {
      const res = string.validate("hello");
      expect(res.raw).toEqual("hello");
    });

    it("number", () => {
      const res = number.validate(5);
      expect(res.raw).toEqual(5);
    });

    it("boolean", () => {
      const res = boolean.validate(true);
      expect(res.raw).toEqual(true);
    });

    it("date", () => {
      const errRes = date.validate("bleble");
      expect((errRes.raw as string[]).length).toEqual(1);

      const okRes = date.validate("2022-01-04T16:01:47+00:00");
      expect(okRes.raw).toBeInstanceOf(Date);
    });
  });

  describe("Compound", () => {
    it("du", () => {
      const validator = du("a", "b", "c");

      const okRes = validator.validate("a");
      expect(okRes.raw).toEqual("a");

      const errRes = validator.validate("d");
      expect(errRes.raw).toBeInstanceOf(Array);
      expect(errRes.raw.length).toEqual(1);
    });

    it("array<string>", () => {
      const res = array(string).validate(["one", "two"]);
      expect(res.raw).toEqual(["one", "two"]);
    });

    it("array<number>", () => {
      const res = array(number).validate([1, 2]);
      expect(res.raw).toEqual([1, 2]);
    });

    it("array<boolean>", () => {
      const res = array(boolean).validate([true, false]);
      expect(res.raw).toEqual([true, false]);
    });

    it("array<obj>", () => {
      const o = obj({ name: string });
      const res = array(o).validate([{ name: "john" }, { name: "doe" }]);
      expect(res.raw).toEqual([{ name: "john" }, { name: "doe" }]);
    });

    it("array<array<number>>", () => {
      const res = array(array(number)).validate([
        [1, 2],
        [3, 4],
      ]);
      expect(res.raw).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it("tuple", () => {
      const o = obj({ name: string });
      const res = tuple(string, number, boolean, o).validate(["one", 1, true, { name: "john" }]);
      expect(res.raw).toEqual(["one", 1, true, { name: "john" }]);
    });

    it("obj", () => {
      const o = obj({
        name: string,
        aliases: array(string),
        age: number,
        contact: obj({
          email: string,
          countryCodeAndPhone: tuple(number, string),
          isPublic: boolean,
        }),
      });

      const expected: ValidatorType<typeof o> = {
        name: "john",
        aliases: ["doe", "joe"],
        age: 99,
        contact: {
          email: "jdoe@example.com",
          countryCodeAndPhone: [55, "819996666"],
          isPublic: false,
        },
      };

      const actual = o.validate(expected);
      expect(actual.raw).toEqual(expected);
    });

    it("record", () => {
      const rcrd = record(number);

      const expected: ValidatorType<typeof rcrd> = {
        one: 1,
        two: 2,
        three: 3,
      };

      const actual = rcrd.validate(expected);
      expect(actual.raw).toEqual(expected);

      const expectedErr = {
        one: 1,
        2: 2,
        3: 3,
      };

      const actualErr = rcrd.validate(expectedErr);
      console.log(actualErr.raw);
    });
  });
});
