import { createQuery } from "./index";

describe("createQuery()", () => {
  it("true when equal", function () {
    const query = createQuery({ hello: "bla" });

    expect(query({ hello: "bla" })).toBe(true);
  });

  it("false when not equal", () => {
    const query = createQuery({ hello: "bla" });

    expect(query({ hello: "different" })).toBe(false);
  });

  it("true for equal arrays", () => {
    const query = createQuery({ hello: [1, 2, 3] });

    expect(query({ hello: [1, 2, 3] })).toBe(true);
  });

  it("false when different arrays", () => {
    const query = createQuery({ hello: [1, 2, 3] });

    expect(query({ hello: [2, 3] })).toBe(false);
  });

  it("true for equal with two keys (matching)", () => {
    const query = createQuery({ a: 1, b: 2 });

    expect(query({ a: 1, b: 2 })).toBe(true);
  });

  it("true for correct $gt", () => {
    const query = createQuery({ pi: { $gt: 3 } });

    expect(query({ pi: Math.PI })).toBe(true);
  });

  it("false for incorrect $gt", () => {
    const query = createQuery({ pi: { $gt: 4 } });

    expect(query({ pi: Math.PI })).toBe(false);
  });

  it("true for correct $lt", () => {
    const query = createQuery({ pi: { $lt: 4 } });

    expect(query({ pi: Math.PI })).toBe(true);
  });

  it("false for incorrect $lt", () => {
    const query = createQuery({ pi: { $lt: 3 } });

    expect(query({ pi: Math.PI })).toBe(false);
  });

  it("true when within $gt $lt range", () => {
    const query = createQuery({ pi: { $gt: 3, $lt: 4 } });

    expect(query({ pi: Math.PI })).toBe(true);
  });

  it("false when outside $gt $lt range", () => {
    const query = createQuery({ pi: { $gt: 3, $lt: 3.1 } });

    expect(query({ pi: Math.PI })).toBe(false);
  });

  it("true for correct nested equal test", () => {
    const query = createQuery({ bla: true, nested: { bla: true } });

    expect(query({ bla: true, nested: { bla: true } })).toBe(true);
  });

  it("false for incorrect nested equal test", () => {
    const query = createQuery({ bla: true, nested: { bla: true } });

    expect(query({ bla: false, nested: { bla: true } })).toBe(false);
    expect(query({ bla: true, nested: { bla: false } })).toBe(false);
    expect(query({ bla: true, nested: { bla: true } })).toBe(true);
  });

  it("$all", () => {
    const query = createQuery({ numbers: { $all: [5, 7] } });

    expect(query({ numbers: [1, 2, 3, 5, 6, 7, 10] })).toBe(true);
    expect(query({ numbers: [1, 2, 3, 6, 7, 10] })).toBe(false);
  });

  it("$gte", () => {
    const query = createQuery({ example: { $gte: 1 } });

    expect(query({ example: 1.1 })).toBe(true);
    expect(query({ example: 1 })).toBe(true);
    expect(query({ example: 0.9 })).toBe(false);
  });

  it("$in", () => {
    const query = createQuery({ example: { $in: [1, 2, 3] } });

    expect(query({ example: 1 })).toBe(true);
    expect(query({ example: 1.5 })).toBe(false);
  });

  it("$lte", () => {
    const query = createQuery({ example: { $lte: 1 } });

    expect(query({ example: 1.1 })).toBe(false);
    expect(query({ example: 1 })).toBe(true);
    expect(query({ example: 0.9 })).toBe(true);
  });

  it("$ne", () => {
    const query = createQuery({ example: { $ne: 1 } });

    expect(query({ example: 1 })).toBe(false);
    expect(query({ example: 2 })).toBe(true);
  });

  it("$nin", () => {
    const query1 = createQuery({ example: { $nin: [undefined] } });
    const query2 = createQuery({ example: { $nin: [1, 2, 3] } });

    expect(query1({})).toBe(true);

    expect(query2({ example: 2 })).toBe(false);
    expect(query2({ example: 5 })).toBe(true);
  });

  it("$and", () => {
    const query = createQuery({
      $and: [{ example: { $gt: 3 } }, { example: { $lt: 10 } }],
    });

    expect(query({ example: 5 })).toBe(true);
    expect(query({ example: 10 })).toBe(false);
  });

  it("$not", () => {
    const query = createQuery({
      $not: { example: { $lt: 3 } },
    });

    expect(query({ example: 5 })).toBe(true);
    expect(query({ example: 2 })).toBe(false);
  });

  it("$or", () => {
    const query = createQuery({
      $or: [{ example: { $lt: 3 } }, { example: { $gt: 10 } }],
    });

    expect(query({ example: 11 })).toBe(true);
    expect(query({ example: 2 })).toBe(true);
    expect(query({ example: 5 })).toBe(false);
  });

  it("$exists", () => {
    const query1 = createQuery({
      example: { $exists: true },
    });
    const query2 = createQuery({
      example: { $exists: false },
    });

    expect(query1({ example: 11 })).toBe(true);
    expect(query1({})).toBe(false);

    expect(query2({ example: false })).toBe(false);
    expect(query2({})).toBe(true);
  });

  it("$mod", () => {
    const query = createQuery({
      example: { $mod: [4, 1] },
    });

    expect(query({ example: 5 })).toBe(true);
    expect(query({ example: 4 })).toBe(false);
  });

  it("$regex", () => {
    const query = createQuery({
      example: { $regex: "^hello", $options: "i" },
    });

    expect(query({ example: "Hello bla" })).toBe(true);
    expect(query({ example: "hello" })).toBe(true);
    expect(query({ example: "bla" })).toBe(false);
  });

  it("$regex (native)", () => {
    const query = createQuery({
      example: /^hello/i,
    });

    expect(query({ example: "Hello bla" })).toBe(true);
    expect(query({ example: "hello" })).toBe(true);
    expect(query({ example: "bla" })).toBe(false);
  });

  it("$where", () => {
    const query = createQuery(
      {
        $where: function () {
          return this.x === 2;
        },
      },
      { $where: true },
    );

    expect(query({ x: 2 })).toBe(true);
    expect(query({ x: 3 })).toBe(false);
  });

  it("$where (obj)", () => {
    const query = createQuery(
      {
        $where: (obj: any) => obj.x === 2,
      },
      { $where: true },
    );

    expect(query({ x: 2 })).toBe(true);
    expect(query({ x: 3 })).toBe(false);
  });

  it("$where (str)", () => {
    const query = createQuery(
      {
        $where: "return this.x === 2;",
      },
      { $where: true },
    );

    expect(query({ x: 2 })).toBe(true);
    expect(query({ x: 3 })).toBe(false);
  });

  it("$where (str, obj)", () => {
    const query = createQuery(
      {
        $where: "return this.x === 2;",
      },
      { $where: true },
    );

    expect(query({ x: 2 })).toBe(true);
    expect(query({ x: 3 })).toBe(false);
  });

  it("$elemMatch", () => {
    const query = createQuery({
      array: { $elemMatch: { value1: 1, value2: { $gt: 1 } } },
    });

    expect(
      query({
        array: [
          { value1: 1, value2: 0 },
          { value1: 2, value2: 2 },
        ],
      }),
    ).toBe(false);
    expect(
      query({
        array: [
          { value1: 1, value2: 0 },
          { value1: 1, value2: 2 },
        ],
      }),
    ).toBe(true);
  });

  it("$size", () => {
    const query = createQuery({ array: { $size: 2 } });

    expect(query({ array: [1, 2] })).toBe(true);
    expect(query({ array: [1, 2, 3] })).toBe(false);
  });

  it("example", () => {
    const match = createQuery({
      name: { $exists: true },
      qty: { $gt: 3 },
      $and: [{ price: { $lt: 100 } }, { price: { $gt: 50 } }],
    });

    expect(match({ name: "example", qty: 10, price: 65.1 })).toBe(true);
    expect(match({ name: "example", qty: 10, price: 30.1 })).toBe(false);
  });
});
