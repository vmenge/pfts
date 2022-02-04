import { Writer } from "@pfts/core/src";

describe("Writer", () => {
  describe("::new()", () => {
    it("Creates an instance of a Writer", () => {
      const writer = Writer.new(1, ["whatever"]);

      expect(writer).toBeInstanceOf(Writer);
    });
  });

  describe(".run()", () => {
    it("Extracts the initial values from the Writer", () => {
      const writer = Writer.new(1, ["whatever"]);
      const [val, story] = writer.run();

      expect(val).toEqual(1);
      expect(story).toEqual(["whatever"]);
    });
  });

  describe(".tell()", () => {
    it("Appends a value to the Writer's story", () => {
      const writer = Writer.new(1, ["hello"]);
      const updatedWriter = writer.tell("world");
      const [_, story] = updatedWriter.run();

      expect(story).toEqual(["hello", "world"]);
    });
  });

  describe(".map()", () => {
    it("Evaluates a mapping function against the A val, returning a new Writer containing the result of the function", () => {
      const writer = Writer.new(10);
      const updatedWriter = writer.map(number => number * 2);
      const [val, _] = updatedWriter.run();

      expect(val).toEqual(20);
    });
  });

  describe(".bind()", () => {
    it("Evaluates a binding function against the A val, appending the story of the resulting Writer to the original Writer's story", () => {
      const writer = Writer.new(10, ["hello"]);
      const updatedWriter = writer.bind(number => Writer.new(number * 2, ["world"]));

      const [val, story] = updatedWriter.run();

      expect(val).toEqual(20);
      expect(story).toEqual(["hello", "world"]);
    });
  });

  describe("::ce()", () => {
    it("Appends to the story when using generator functions", () => {
      const writer = Writer.ce(function* () {
        const a = yield* Writer.new(1, ["hello"]);
        const b = yield* Writer.new(2, ["world"]);
        const c = 3;

        return a + b + c;
      });

      const [val, story] = writer.run();

      expect(val).toEqual(6);
      expect(story).toEqual(["hello", "world"]);
    });
  });
});
