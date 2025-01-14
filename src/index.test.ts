import { Query, match, QueryOptions } from "./index";

describe("match()", () => {
  it("true when equal", function () {
    expect(match({ hello: "bla" }, { hello: "bla" })).toBe(true);
  });

  it("false when not equal", () => {
    expect(match({ hello: "different" }, { hello: "bla" })).toBe(false);
  });

  it("true for equal arrays", () => {
    expect(match({ hello: [1, 2, 3] }, { hello: [1, 2, 3] })).toBe(true);
  });

  it("false when different arrays", () => {
    expect(match({ hello: [2, 3] }, { hello: [1, 2, 3] })).toBe(false);
  });

  it("true for equal with two keys (matching)", () => {
    expect(match({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("true for correct $gt", () => {
    expect(match({ pi: Math.PI }, { pi: { $gt: 3 } })).toBe(true);
  });

  it("false for incorrect $gt", () => {
    expect(match({ pi: Math.PI }, { pi: { $gt: 4 } })).toBe(false);
  });

  it("true for correct $lt", () => {
    expect(match({ pi: Math.PI }, { pi: { $lt: 4 } })).toBe(true);
  });

  it("false for incorrect $lt", () => {
    expect(match({ pi: Math.PI }, { pi: { $lt: 3 } })).toBe(false);
  });

  it("true when within $gt $lt range", () => {
    expect(match({ pi: Math.PI }, { pi: { $gt: 3, $lt: 4 } })).toBe(true);
  });

  it("false when outside $gt $lt range", () => {
    expect(match({ pi: Math.PI }, { pi: { $gt: 3, $lt: 3.1 } })).toBe(false);
  });

  it("true for correct nested equal test", () => {
    expect(
      match(
        { bla: true, nested: { bla: true } },
        { bla: true, nested: { bla: true } },
      ),
    ).toBe(true);
  });

  it("true for correct nested equal test with dot notation", () => {
    expect(match({ nested: { bla: true } }, { "nested.bla": true })).toBe(
      true,
    );
  });

  it("false for correct nested equal test with dot notation", () => {
    expect(match({ nested: { bla: false } }, { "nested.bla": true })).toBe(
      false,
    );
  });

  it("false for incorrect nested equal test", () => {
    const query: Query = { bla: true, nested: { bla: true } };

    expect(match({ bla: false, nested: { bla: true } }, query)).toBe(false);
    expect(match({ bla: true, nested: { bla: false } }, query)).toBe(false);
    expect(match({ bla: true, nested: { bla: true } }, query)).toBe(true);
  });

  it("$all", () => {
    const query: Query = { numbers: { $all: [5, 7] } };

    expect(match({ numbers: [1, 2, 3, 5, 6, 7, 10] }, query)).toBe(true);
    expect(match({ numbers: [1, 2, 3, 6, 7, 10] }, query)).toBe(false);
  });

  it("$gte", () => {
    const query: Query = { example: { $gte: 1 } };

    expect(match({ example: 1.1 }, query)).toBe(true);
    expect(match({ example: 1 }, query)).toBe(true);
    expect(match({ example: 0.9 }, query)).toBe(false);
  });

  it("$in", () => {
    const query: Query = { example: { $in: [1, 2, 3] } };

    expect(match({ example: 1 }, query)).toBe(true);
    expect(match({ example: 1.5 }, query)).toBe(false);
  });

  it("$lte", () => {
    const query: Query = { example: { $lte: 1 } };

    expect(match({ example: 1.1 }, query)).toBe(false);
    expect(match({ example: 1 }, query)).toBe(true);
    expect(match({ example: 0.9 }, query)).toBe(true);
  });

  it("$ne", () => {
    const query: Query = { example: { $ne: 1 } };

    expect(match({ example: 1 }, query)).toBe(false);
    expect(match({ example: 2 }, query)).toBe(true);
  });

  it("$nin", () => {
    const query1: Query = { example: { $nin: [undefined] } };
    const query2: Query = { example: { $nin: [1, 2, 3] } };

    expect(match({}, query1)).toBe(true);
    expect(match({ example: 2 }, query2)).toBe(false);
    expect(match({ example: 5 }, query2)).toBe(true);
  });

  it("$and", () => {
    const query: Query = {
      $and: [{ example: { $gt: 3 } }, { example: { $lt: 10 } }],
    };

    expect(match({ example: 5 }, query)).toBe(true);
    expect(match({ example: 10 }, query)).toBe(false);
  });

  it("$not", () => {
    const query: Query = { $not: { example: { $lt: 3 } } };

    expect(match({ example: 5 }, query)).toBe(true);
    expect(match({ example: 2 }, query)).toBe(false);
  });

  it("$or", () => {
    const query: Query = {
      $or: [{ example: { $lt: 3 } }, { example: { $gt: 10 } }],
    };

    expect(match({ example: 11 }, query)).toBe(true);
    expect(match({ example: 2 }, query)).toBe(true);
    expect(match({ example: 5 }, query)).toBe(false);
  });

  it("$exists", () => {
    const query1: Query = { example: { $exists: true } };
    const query2: Query = { example: { $exists: false } };

    expect(match({ example: 11 }, query1)).toBe(true);
    expect(match({}, query1)).toBe(false);

    expect(match({ example: false }, query2)).toBe(false);
    expect(match({}, query2)).toBe(true);
  });

  it("$mod", () => {
    const query: Query = { example: { $mod: [4, 1] } };

    expect(match({ example: 5 }, query)).toBe(true);
    expect(match({ example: 4 }, query)).toBe(false);
  });

  it("$regex", () => {
    const query: Query = { example: { $regex: "^hello", $options: "i" } };

    expect(match({ example: "Hello bla" }, query)).toBe(true);
    expect(match({ example: "hello" }, query)).toBe(true);
    expect(match({ example: "bla" }, query)).toBe(false);
  });

  it("$regex (native)", () => {
    const query: Query = { example: /^hello/i };

    expect(match({ example: "Hello bla" }, query)).toBe(true);
    expect(match({ example: "hello" }, query)).toBe(true);
    expect(match({ example: "bla" }, query)).toBe(false);
  });

  it("$where (obj)", () => {
    const query: Query = { $where: (obj: any) => obj.x === 2 };
    const options: QueryOptions = { $where: true };

    expect(match({ x: 2 }, query, options)).toBe(true);
    expect(match({ x: 3 }, query, options)).toBe(false);
  });

  it("$where (str)", () => {
    const query: Query = { $where: "return this.x === 2;" };
    const options: QueryOptions = { $where: true };

    expect(match({ x: 2 }, query, options)).toBe(true);
    expect(match({ x: 3 }, query, options)).toBe(false);
  });

  it("$where (str, obj)", () => {
    const query: Query = { $where: "return this.x === 2;" };
    const options: QueryOptions = { $where: true };

    expect(match({ x: 2 }, query, options)).toBe(true);
    expect(match({ x: 3 }, query, options)).toBe(false);
  });

  it("$where with $where disabled", () => {
    expect(match({ x: 2 }, { $where: (obj: any) => obj.x === 2 })).toBe(false);
  });

  it("$elemMatch", () => {
    const query: Query = {
      array: { $elemMatch: { value1: 1, value2: { $gt: 1 } } },
    };

    expect(
      match(
        {
          array: [
            { value1: 1, value2: 0 },
            { value1: 2, value2: 2 },
          ],
        },
        query,
      ),
    ).toBe(false);
    expect(
      match(
        {
          array: [
            { value1: 1, value2: 0 },
            { value1: 1, value2: 2 },
          ],
        },
        query,
      ),
    ).toBe(true);
  });

  it("$size", () => {
    const query: Query = { array: { $size: 2 } };

    expect(match({ array: [1, 2] }, query)).toBe(true);
    expect(match({ array: [1, 2, 3] }, query)).toBe(false);
  });

  it("example", () => {
    const query: Query = {
      name: { $exists: true },
      qty: { $gt: 3 },
      $and: [{ price: { $lt: 100 } }, { price: { $gt: 50 } }],
    };

    expect(match({ name: "example", qty: 10, price: 65.1 }, query)).toBe(true);
    expect(match({ name: "example", qty: 10, price: 30.1 }, query)).toBe(
      false,
    );
  });
});
