import { async, err, list, List, none, Num, ok, Seq, some } from "@pfts/core/src";

describe("List", () => {
  describe("List.new()", () => {
    it("Creates a new List", () => {
      const lst = List.new(1, 2, 3);
      expect(lst).toBeInstanceOf(List);
      expect(lst.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe("List.ofArray()", () => {
    it("Creates a List from an Array", () => {
      const lst = List.ofArray([1, 2, 3]);
      expect(lst).toBeInstanceOf(List);
      expect(lst.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe("List.range()", () => {
    it("Creates an ascending range", () => {
      const l1 = List.range(0, 5);
      expect(l1.toArray()).toEqual([0, 1, 2, 3, 4, 5]);

      const l2 = List.range(1, 1);
      expect(l2.toArray()).toEqual([1]);

      const l3 = List.range(0, 1);
      expect(l3.toArray()).toEqual([0, 1]);
    });

    it("Creates an descending range", () => {
      const l1 = List.range(0, -5);
      expect(l1.toArray()).toEqual([0, -1, -2, -3, -4, -5]);

      const l2 = List.range(-1, -1);
      expect(l2.toArray()).toEqual([-1]);

      const l3 = List.range(-2, -3);
      expect(l3.toArray()).toEqual([-2, -3]);
    });
  });

  describe(".length", () => {
    it("returns the List's length", () => {
      const lst = list(9, 9, 4, 3);
      expect(lst.length).toEqual(4);
    });
  });

  describe(".isEmpty", () => {
    it("returns true if the List's length is 0", () => {
      const lst = list(9, 9, 4, 3);
      expect(lst.isEmpty).toEqual(false);

      const empt = list();
      expect(empt.isEmpty).toEqual(true);
    });
  });

  describe(".isNotEmpty", () => {
    it("returns true if the List's length is > 0", () => {
      const lst = list(9, 9, 4, 3);
      expect(lst.isNotEmpty).toEqual(true);

      const empt = list();
      expect(empt.isNotEmpty).toEqual(false);
    });
  });

  describe(".toSeq()", () => {
    it("Converts a List<A> to a Seq<A>", () => {
      const sq = list(1, 2, 3).toSeq();
      expect(sq).toBeInstanceOf(Seq);
      expect(sq.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe(".map()", () => {
    it("applies the mapping fn to every element in the List", () => {
      const lst = list(1, 2, 3).map(x => x * 10);
      expect(lst.toArray()).toEqual([10, 20, 30]);
    });
  });

  describe(".choose()", () => {
    it("applies the mapping fn to every element in the List then filters out the Nones", () => {
      const lst = list(1, 2, 3, 4).choose(x => (x % 2 === 0 ? some(x * 10) : none()));
      expect(lst.toArray()).toEqual([20, 40]);
    });
  });

  describe(".chooseAsync()", () => {
    it("applies the mapping fn to every element in the List then filters out the Nones", done => {
      const asyncLst = list(1, 2, 3, 4).chooseAsync(x => (x % 2 === 0 ? async(some(x * 10)) : async(none())));
      asyncLst.iter(lst => {
        expect(lst.toArray()).toEqual([20, 40]);
        done();
      });
    });
  });

  describe(".flatMap()", () => {
    it("applies the mapping fn to every element in the List and returns the flattened results", () => {
      const lst = list(1, 2, 3).flatMap(x => list(x, x));
      expect(lst.toArray()).toEqual([1, 1, 2, 2, 3, 3]);
    });
  });

  describe(".iter()", () => {
    it("Iterates over every element of the List", () => {
      const res: number[] = [];
      list(1, 2, 3).iter(x => res.push(x));

      expect(res).toEqual([1, 2, 3]);
    });
  });

  describe(".tee()", () => {
    it("Iterates over every element of the List, then returns the List", () => {
      const res: number[] = [];
      const lst = list(1, 2, 3).tee(x => res.push(x * 10));

      expect(res).toEqual([10, 20, 30]);
      expect(lst.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe(".filter()", () => {
    it("returns a List with only the elements that returned true to the given predicate", () => {
      const lst = list(1, 2, 3, 4).filter(x => x % 2 === 0);
      expect(lst.toArray()).toEqual([2, 4]);
    });
  });

  describe(".reject()", () => {
    it("returns a List without any elements that returned true to the given predicate", () => {
      const lst = list(1, 2, 3, 4).reject(x => x % 2 === 0);
      expect(lst.toArray()).toEqual([1, 3]);
    });
  });

  describe(".rejectLast()", () => {
    it("returns the List without the last element", () => {
      const lst = list(1, 2, 3).rejectLast();
      expect(lst.toArray()).toEqual([1, 2]);

      const empt = list().rejectLast();
      expect(empt.toArray()).toEqual([]);
    });
  });

  describe(".add()", () => {
    it("adds an element to the end of the list", () => {
      const lst = list(1, 2).add(3);
      expect(lst.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe(".cons()", () => {
    it("adds an element to the beginning of the list", () => {
      const lst = list(2, 3).cons(1);
      expect(lst.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe(".removeAt()", () => {
    it("removes the element from the given index", () => {
      const lst = list("a", "b", "c").removeAt(1);
      expect(lst.toArray()).toEqual(["a", "c"]);
    });
  });

  describe(".hasLength()", () => {
    it("returns true if the list has the given length", () => {
      const lst = list(1, 2, 3);
      expect(lst.hasLength(3)).toEqual(true);
      expect(lst.hasLength(4)).toEqual(false);
    });
  });

  describe(".fold()", () => {
    it("folds the list given an initial state", () => {
      const sum = list(1, 2, 3).fold((a, c) => a + c, 0);
      expect(sum).toEqual(6);
    });
  });

  describe(".reduce()", () => {
    it("folds the list using the first element as the initial state", () => {
      const sum = list(1, 2, 3).reduce((a, c) => a + c);
      expect(sum).toEqual(6);
    });
  });

  describe(".eq()", () => {
    it("returns true if two lists have the same elements in the same order", () => {
      const l1 = list(1, 2, 3);
      const l2 = list(1, 2, 3);
      const l3 = list(3, 2, 1);

      expect(l1.eq(l2)).toEqual(true);
      expect(l1.eq(l3)).toEqual(false);
    });
  });

  describe(".eqBy()", () => {
    it("returns true if two lists return the same for a projection applied to elements in the same order", () => {
      const p = (n: string, a: number) => ({ name: n, age: a });
      const l1 = list(p("john", 30), p("jane", 31), p("arthur", 66));
      const l2 = list(p("ash", 30), p("gary", 31), p("arthur", 66));
      const l3 = list(p("john", 31), p("jane", 21), p("arthur", 66));

      expect(l1.eqBy(l2, x => x.age)).toEqual(true);
      expect(l1.eqBy(l3, x => x.age)).toEqual(false);
    });
  });

  describe(".skip()", () => {
    it("skips n elements of a list", () => {
      const lst = list(1, 2, 3).skip(2);
      expect(lst.toArray()).toEqual([3]);
    });

    it("returns empty array if skip arg is greater than list", () => {
      const lst = list(1, 2).skip(9);
      expect(lst.isEmpty).toBe(true);
    });

    it("returns empty when used on an empty list", () => {
      const lst = list().skip(1);
      expect(lst.isEmpty).toBe(true);
    });
  });

  describe(".skipWhile()", () => {
    it("Bypasses the first n elements of a list for which the predicate returns true", () => {
      const actual = list(2, 4, 6, 8, 10, 1, 2, 3).skipWhile(x => x % 2 === 0);

      expect(actual.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe(".take()", () => {
    it("Takes the first n elements of a list", () => {
      const actual = list(9, 10, 11).take(2);
      expect(actual.toArray()).toEqual([9, 10]);
    });

    it("Takes the whole list if the arg is greater than the list's length", () => {
      const actual = list(22, 21, 15).take(5);
      expect(actual.toArray()).toEqual([22, 21, 15]);
    });
  });

  describe(".takeWhile()", () => {
    it("Takes the first n elements of a list for which the predicate returns true", () => {
      const actual = list(2, 4, 6, 5, 8, 10, 1, 2, 3).takeWhile(x => x % 2 === 0);

      expect(actual.toArray()).toEqual([2, 4, 6]);
    });
  });

  describe(".splitAt()", () => {
    it("Splits a List into two Lists at the given index", () => {
      const [actual1, actual2] = list(10, 11, 12, 13, 14).splitAt(2);

      expect(actual1.toArray()).toEqual([10, 11]);
      expect(actual2.toArray()).toEqual([12, 13, 14]);
    });
  });

  describe(".contains()", () => {
    it("returns true if the List contains the given value", () => {
      const a = list(1, 2, 5).contains(5);
      expect(a).toEqual(true);

      const b = list(1, 2, 5).contains(9);
      expect(b).toEqual(false);
    });
  });

  describe(".distinct()", () => {
    it("returns a list that does not contain any duplicate entries", () => {
      const actual = list(1, 1, 2, 2, 3, 3).distinct();
      expect(actual.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe(".distinctBy()", () => {
    it("returns a list that contains no duplicate entries based on the given projection", () => {
      const person = (name: string, age: number) => ({ name, age });

      const actual = list(person("joe", 30), person("miriam", 28), person("bea", 30)).distinctBy(x => x.age);
      const expected = [person("joe", 30), person("miriam", 28)];

      expect(actual.toArray()).toEqual(expected);
    });
  });

  describe(".append()", () => {
    it("Returns a new list that contains the elements of the first list followed by elements of the second", () => {
      const actual = list(1, 2).append(list(3, 4));
      const expected = list(1, 2, 3, 4);

      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe(".exists()", () => {
    it("Tests if any element of the list satisfies the given predicate.", () => {
      const a = list(1, 2, 3).exists(x => x === 2);
      expect(a).toEqual(true);
    });
  });

  describe(".find()", () => {
    it("Returns the first element for which the given function returns true. Returns None if no such element exists", () => {
      const a = list(1, 2, 3).find(x => x === 2);
      const b = list(1, 2, 3).find(x => x === 5);

      expect(a.isSome).toEqual(true);
      expect(a.value).toEqual(2);

      expect(b.isNone).toEqual(true);
    });
  });

  describe(".findIndex()", () => {
    it("Returns the index of the element for which the given predicate returns true. Returns None if no such element exists", () => {
      const a = list("one", "two", "three").findIndex(x => x === "two");
      const b = list(1, 2, 3).findIndex(x => x === 5);

      expect(a.isSome).toEqual(true);
      expect(a.value).toEqual(1);

      expect(b.isNone).toEqual(true);
    });
  });

  describe(".forall()", () => {
    it("Tests if all elements of the collection satisfy the given predicate.", () => {
      const a = list(2, 4, 6, 8).forall(x => x % 2 === 0);
      const b = list(2, 4, 6, 7).forall(x => x % 2 === 0);

      expect(a).toEqual(true);
      expect(b).toEqual(false);
    });
  });

  describe(".head()", () => {
    it("returns the first element of the list, if it is not empty", () => {
      const a = list(3, 2, 1).head();
      expect(a.raw).toEqual(3);

      const b = list().head();
      expect(b.isNone).toEqual(true);
    });
  });

  describe(".tail()", () => {
    it("returns the list after removing the first element", () => {
      const actual1 = list(1, 2, 3).tail();
      expect(actual1.toArray()).toEqual([2, 3]);

      const actual2 = list(5).tail();
      expect(actual2.isEmpty).toEqual(true);
    });
  });

  describe(".last()", () => {
    it("returns the last element of the list, if it is not empty", () => {
      const a = list(3, 2, 1).last();
      expect(a.value).toEqual(1);

      const b = list().last();
      expect(b.isNone).toEqual(true);
    });
  });

  describe(".sort()", () => {
    it("returns a new list with its elements sorted.", () => {
      const actual = list(4, 1, 8).sort();
      expect(actual.toArray()).toEqual([1, 4, 8]);
    });
  });

  describe(".sortBy()", () => {
    it("returns a new list with its elements sorted using the given projection.", () => {
      const ppl = list({ name: "john", age: 30 }, { name: "jane", age: 28 });

      const actual = ppl.sortBy(p => p.age);
      const expected = list({ name: "jane", age: 28 }, { name: "john", age: 30 });

      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe(".sortWith()", () => {
    it("returns a new list with its elements sorted using the comparison function", () => {
      const vals = {
        a: 2,
        b: 9,
        c: 1,
      };

      type K = keyof typeof vals;

      const lst: List<K> = list("a", "b", "c", "b");
      const compareFn = (a: K, b: K) => {
        if (vals[a] < vals[b]) return -1;
        if (vals[a] > vals[b]) return 1;
        return 0;
      };

      const actual = lst.sortWith(compareFn);

      expect(actual.toArray()).toEqual(["c", "a", "b", "b"]);
    });
  });

  describe(".max()", () => {
    it("returns the largest element in the list using the default comparison operator", () => {
      const a = list(2, 5, 1).max();
      expect(a.value).toEqual(5);
    });
  });

  describe(".maxBy()", () => {
    it("returns the largest element in the list using the default comparison operator on the result of the given projection", () => {
      const ppl = list({ name: "john", age: 30 }, { name: "jane", age: 28 });
      const actual = ppl.maxBy(p => p.age);
      const expected = { name: "john", age: 30 };

      expect(actual.value).toEqual(expected);
    });
  });

  describe(".min()", () => {
    it("returns the smallest element in the list using the default comparison operator", () => {
      const a = list(2, 5, 1).min();
      expect(a.value).toEqual(1);
    });
  });

  describe(".minBy()", () => {
    it("returns the smallest element in the list using the default comparison operator on the result of the given projection", () => {
      const ppl = list({ name: "john", age: 30 }, { name: "jane", age: 28 });
      const actual = ppl.minBy(p => p.age);
      const expected = { name: "jane", age: 28 };

      expect(actual.value).toEqual(expected);
    });
  });

  describe(".sumBy()", () => {
    it("sums all elements of a list using the given projection", () => {
      const ppl = list({ name: "john", age: 30 }, { name: "jane", age: 28 });
      const actual = ppl.sumBy(p => p.age);

      expect(actual).toEqual(58);
    });
  });

  describe(".averageBy()", () => {
    it("sums all elements of a list using the given projection, then returns the average by list length", () => {
      const ppl = list({ name: "john", age: 30 }, { name: "jane", age: 70 });
      const actual = ppl.averageBy(p => p.age);

      expect(actual).toEqual(50);
    });
  });

  describe(".pairwise()", () => {
    it("pairs every element in the list with the next element", () => {
      const actual = list(1, 2, 3, 4).pairwise();
      const expected = list([1, 2], [2, 3], [3, 4]);

      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe(".partition()", () => {
    it("Splits the list into two lists, containing the elements for which the given predicate returns True and False respectively.", () => {
      const [even, odd] = list(1, 2, 3, 4).partition(x => x % 2 === 0);
      const expectedEven = list(2, 4);
      const expectedOdd = list(1, 3);

      expect(even.toArray()).toEqual(expectedEven.toArray());
      expect(odd.toArray()).toEqual(expectedOdd.toArray());
    });
  });

  describe(".except()", () => {
    it("Returns a new list with the distinct elements of the input list which do not appear in the itemsToExclude list", () => {
      const actual = list(1, 1, 2, 3, 4, 5).except(list(2, 5));
      const expected = list(1, 3, 4);
      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe(".indexed()", () => {
    it("Returns a new list with its elements paired with their index (from 0)", () => {
      const actual = list("a", "b", "c").indexed();
      const expected = list([0, "a"], [1, "b"], [2, "c"]);

      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe(".item()", () => {
    it("returns the item at the given index", () => {
      const a = list("x", "y", "z").item(1);
      expect(a.value).toEqual("y");

      const b = list("c", "v", "b").item(4);
      expect(b.isNone).toEqual(true);
    });
  });

  describe(".pick()", () => {
    it("Returns the first element of a list for which the given function returns Some", () => {
      const a = list("a", "b", "5", "c").pick(Num.parse);
      expect(a.value).toEqual(5);
    });
  });

  describe(".trace()", () => {
    it("logs the list", () => {
      const spy = jest.spyOn(console, "log");

      const lst1 = list(5, 3, 1).trace();
      expect(spy).toHaveBeenLastCalledWith(lst1.toString());

      const lst2 = list("hello", "you", "there").trace("msg:");
      expect(spy).toHaveBeenLastCalledWith(`msg: ${lst2.toString()}`);
    });
  });

  describe(".rev()", () => {
    it("returns a reversed copy of the list", () => {
      const actual = list(1, 2, 3).rev();
      const expected = list(3, 2, 1);

      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe(".zip()", () => {
    it("Pairs elements of two lists with the each other as long as they have the same length", () => {
      const lst1 = list(1, 2, 3);
      const lst2 = list("a", "b", "c");

      const actual = lst1.zip(lst2);
      expect(actual.value.toArray()).toEqual([
        [1, "a"],
        [2, "b"],
        [3, "c"],
      ]);
    });

    it("doesnt pair lists with different lengths", () => {
      const lst1 = list(1, 2, 3);
      const lst2 = list("a", "b");

      const actual = lst1.zip(lst2);
      expect(actual.isNone).toBe(true);
    });
  });

  describe(".zip3()", () => {
    it("pairs elements of three lists with the each other as long as they have the same length", () => {
      const lst1 = list(1, 2, 3);
      const lst2 = list("a", "b", "c");
      const lst3 = list(true, true, false);

      const actual = lst1.zip3(lst2, lst3);
      expect(actual.value.toArray()).toEqual([
        [1, "a", true],
        [2, "b", true],
        [3, "c", false],
      ]);
    });

    it("doesnt pair lists with different lengths", () => {
      const lst1 = list(1, 2, 3);
      const lst2 = list("a", "b");
      const lst3 = list(true, true, true, false);

      const actual = lst1.zip3(lst2, lst3);
      expect(actual.isNone).toBe(true);
    });
  });

  describe(".countBy()", () => {
    it("counts the number of time the reuslt of a projection appears in a list", () => {
      const ppl = list({ name: "ann", age: 30 }, { name: "john", age: 31 }, { name: "ann", age: 42 });
      const pplCount = ppl.countBy(p => p.name);
      expect(pplCount.find("ann").value).toEqual(2);
    });
  });

  describe(".groupBy()", () => {
    it("groups elements of a list based on the result of the given projection", () => {
      const ppl = list({ name: "ann", age: 30 }, { name: "john", age: 31 }, { name: "ann", age: 42 });
      const nameGroups = ppl.countBy(p => p.name);
      expect(nameGroups.find("ann").value).toEqual(2);
    });
  });

  describe(".equivalent()", () => {
    it("returns true if the lists contains the same elements regardless of order", () => {
      const a = list(1, 2, 3).equivalent(list(3, 2, 1));
      const b = list(1, 2, 3).equivalent(list(1, 1, 2));
      expect(a).toBe(true);
      expect(b).toBe(false);
    });
  });

  describe(".to()", () => {
    it("pipes the list to the given function", () => {
      const a = list("one", "two").to(x => x.length);
      expect(a).toEqual(2);
    });
  });

  describe(".join()", () => {
    it("Adds all the elements of the list into a string, separated by the specified separator string.", () => {
      const a = list(1, 2, 3).join(", ");
      expect(a).toEqual("1, 2, 3");
    });
  });

  describe("List.empty", () => {
    it("Returns an empty list", () => {
      const a = List.empty;
      expect(a).toBeInstanceOf(List);
      expect(a.isEmpty).toBe(true);
    });
  });

  describe("List.map()", () => {
    it("Maps over a list", () => {
      const actual = List.map((x: number) => x * 2)(list(1, 5));
      const expected = list(2, 10);
      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe("List.flatMap()", () => {
    it("Calls a mapping function on each element of `List<A>`, then flattens the result.", () => {
      const actual = List.flatMap((x: number) => list(x + 10, x + 20))(list(1, 2, 3));
      const expected = list(11, 21, 12, 22, 13, 23);

      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe("List.rejectNones()", () => {
    it("Rejects all elements that are None, and extracts the values of the elements that are Some", () => {
      const actual = list(some(1), none(), some(2), none()).to(List.rejectNones);
      const expected = list(1, 2);

      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe("List.rejectErrs()", () => {
    it("Rejects all elements that are Err, and extracts the values of the elements that are Ok.", () => {
      const lst = list(ok(1), ok(2), err("oops"));

      const actual = List.rejectErrs(lst);
      const expected = list(1, 2);

      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe("List.partitionResults()", () => {
    it("Paritions a List of Results into a List with the extracted Oks and another List with the extracted Errs", () => {
      const lst = list(ok(1), ok(2), err("oops"));
      const [oks, errs] = List.partitionResults(lst);

      const expectedOks = list(1, 2);
      const expectedErrs = list("oops");

      expect(oks.toArray()).toEqual(expectedOks.toArray());
      expect(errs.toArray()).toEqual(expectedErrs.toArray());
    });
  });

  describe("List.sum()", () => {
    it("Sums all numbers in a List", () => {
      const actual = List.sum(list(1, 2, 3));
      expect(actual).toEqual(6);
    });
  });

  describe("List.average()", () => {
    it("Sums all numbers in a List and divides by the List's length.", () => {
      const actual = List.average(list(2, 3, 10));
      expect(actual).toEqual(5);
    });
  });

  describe("List.flatten()", () => {
    it("Flattens a List of Lists", () => {
      const lst = list(list(1, 2), list(3, 4), list(5, 6));
      const actual = List.flatten(lst);
      const expected = list(1, 2, 3, 4, 5, 6);

      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe("List.init()", () => {
    it("Creates a list by calling the given initializer on each index", () => {
      const actual = List.init(3)(n => n.toString());
      const expected = list("0", "1", "2");
      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe("List.replicate()", () => {
    it("Creates a List by replicating a value by the given count.", () => {
      const actual = List.replicate(3)("z");
      const expected = list("z", "z", "z");
      expect(actual.toArray()).toEqual(expected.toArray());
    });
  });

  describe("List.unzip()", () => {
    it("Unzips a List of tuples of length 2", () => {
      const lst: List<[string, number]> = list(["one", 1], ["two", 2], ["three", 3]);
      const [act1, act2] = List.unzip(lst);

      const exp1 = list("one", "two", "three");
      const exp2 = list(1, 2, 3);

      expect(act1.toArray()).toEqual(exp1.toArray());
      expect(act2.toArray()).toEqual(exp2.toArray());
    });
  });

  describe("List.unzip3()", () => {
    it("Unzips a List of tuples of length 2", () => {
      const lst: List<[string, number, boolean]> = list(["one", 1, true], ["two", 2, true], ["three", 3, false]);
      const [act1, act2, act3] = List.unzip3(lst);

      const exp1 = list("one", "two", "three");
      const exp2 = list(1, 2, 3);
      const exp3 = list(true, true, false);

      expect(act1.toArray()).toEqual(exp1.toArray());
      expect(act2.toArray()).toEqual(exp2.toArray());
      expect(act3.toArray()).toEqual(exp3.toArray());
    });
  });
});
