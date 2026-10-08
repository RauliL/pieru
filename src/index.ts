import { FilterFunctionName, QueryOptions } from "./types.js";

export type Query = Record<string, any> & {
  // Comparison operators.
  $eq?: any;
  $ne?: any;
  $gt?: any;
  $gte?: any;
  $lt?: any;
  $lte?: any;

  // Array operators.
  $all?: ReadonlyArray<any>;
  $in?: ReadonlyArray<any>;
  $nin?: ReadonlyArray<any>;
  $size?: number;

  // Logical operators.
  $not?: string | RegExp | Query;
  $and?: ReadonlyArray<Query>;
  $or?: ReadonlyArray<Query>;
  $nor?: ReadonlyArray<Query>;

  // And the rest.
  $exists?: boolean;
  $mod?: [number, number];
  $options?: any;
  $where?: string | ((obj: any) => boolean);
  $elemMatch?: Query;
};

type FilterFunction = (
  obj: any,
  operator: any,
  query: Query,
  options: Readonly<QueryOptions>,
) => boolean;

const functions: Map<FilterFunctionName, FilterFunction> = new Map([
  [
    "$all",
    (obj: any, value: ReadonlyArray<any>): boolean => {
      if (!Array.isArray(value) || !Array.isArray(obj)) {
        return false;
      }

      for (const element of value) {
        if (obj.indexOf(element) === -1) {
          return false;
        }
      }

      return true;
    },
  ],

  ["$gt", (obj: any, value: any): boolean => obj > value],

  ["$gte", (obj: any, value: any): boolean => obj >= value],

  ["$in", (obj: any, value: any): boolean => value.indexOf(obj) !== -1],

  ["$lt", (obj: any, value: any): boolean => obj < value],

  ["$lte", (obj: any, value: any): boolean => obj <= value],

  ["$ne", (obj: any, value: any): boolean => obj !== value],

  [
    "$nin",
    (obj: any, value: ReadonlyArray<any>): boolean => {
      if (typeof obj === "undefined") {
        return true;
      }

      return value.indexOf(obj) === -1;
    },
  ],

  [
    "$and",
    (
      obj: any,
      conditions: ReadonlyArray<Query>,
      query: Query,
      options: Readonly<QueryOptions>,
    ): boolean => {
      for (const condition of conditions) {
        if (!match(obj, condition, options)) {
          return false;
        }
      }

      return true;
    },
  ],

  [
    "$nor",
    (
      obj: any,
      conditions: ReadonlyArray<Query>,
      query: Query,
      options: Readonly<QueryOptions>,
    ): boolean => {
      for (const condition of conditions) {
        if (match(obj, condition, options)) {
          return false;
        }
      }

      return true;
    },
  ],

  [
    "$not",
    (
      obj: any,
      condition: Query,
      query: Query,
      options: Readonly<QueryOptions>,
    ): boolean => !match(obj, condition, options),
  ],

  [
    "$or",
    (
      obj: any,
      conditions: ReadonlyArray<Query>,
      query: Query,
      options: Readonly<QueryOptions>,
    ): boolean => {
      for (const condition of conditions) {
        if (match(obj, condition, options)) {
          return true;
        }
      }

      return false;
    },
  ],

  [
    "$exists",
    (obj: any, mustExist: boolean): boolean =>
      (typeof obj !== "undefined") === mustExist,
  ],

  [
    "$mod",
    (obj: any, [divisor, remainder]: [number, number]): boolean =>
      obj % divisor === remainder,
  ],

  [
    "$regex",
    (obj: any, regex: any, query: Query): boolean => {
      const options = query.$options;

      return new RegExp(regex, options).test(obj);
    },
  ],

  ["$options", (): boolean => true],

  [
    "$where",
    (
      obj: any,
      fn: string | Function,
      query: Query,
      options: Readonly<QueryOptions>,
    ): boolean => {
      if (!options.$where) {
        return false;
      }

      if (typeof fn === "function") {
        return !!fn.call(obj, obj);
      }

      return !!new Function("obj", fn).call(obj, obj);
    },
  ],

  [
    "$elemMatch",
    (
      array: any,
      query: Query,
      q: Query,
      options: Readonly<QueryOptions>,
    ): boolean => {
      for (const element of array) {
        if (match(element, query, options)) {
          return true;
        }
      }

      return false;
    },
  ],

  ["$size", (array: any, length: number): boolean => array.length === length],
] as [FilterFunctionName, FilterFunction][]);

/***
 * Tests if obj is equal to query.
 *
 * @todo Deep test.
 */
const matchArray = (
  obj: ReadonlyArray<any>,
  query: ReadonlyArray<any>,
): boolean => {
  if (!Array.isArray(obj)) {
    return false;
  }

  if (obj.length !== query.length) {
    return false;
  }

  for (let i = 0; i < query.length; ++i) {
    if (obj[i] !== query[i]) {
      return false;
    }
  }

  return true;
};

/***
 * Finds values of nested objects using dot-notation keys.
 *
 * @todo Deep test.
 */
const getDotNotationProp = (obj: any, key: string): any => {
  const parts = key.split(".");

  while (parts.length && (obj = obj[parts.shift() ?? ""]));

  return obj;
};

/**
 * Tests an object against an object query.
 *
 * - Does not include regexp and equal tests.
 */
const matchQueryObject = (
  obj: any,
  query: Query,
  options: Readonly<QueryOptions>,
): boolean => {
  for (const key in query) {
    const callback = functions.get(key);

    if (callback) {
      // Runs the match function.
      if (!callback(obj, query[key], query, options)) {
        return false;
      }
    } else {
      let value = obj[key];

      if (key.indexOf(".") !== -1) {
        value = getDotNotationProp(obj, key);
      }

      // Recursive run match for an attribute.
      if (!match(value, query[key])) {
        return false;
      }
    }
  }

  return true;
};

export function match(
  obj: any,
  query: Query | ReadonlyArray<any> | RegExp,
  options: Readonly<QueryOptions> = { $where: false },
): boolean {
  if (query instanceof RegExp) {
    return query.test(obj);
  }

  if (Array.isArray(query)) {
    return matchArray(obj, query);
  }

  if (typeof query === "object") {
    return matchQueryObject(obj, query, options);
  }

  return query === obj;
}
