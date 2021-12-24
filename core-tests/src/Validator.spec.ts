import { Validator, ValidatorType } from "@pfts/core/src";

const { string, number, boolean, array, tuple, obj } = Validator;

describe("Validator", () => {
  describe("Successful validations", () => {
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
    });

    describe("Compound", () => {
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
    });
  });
});
