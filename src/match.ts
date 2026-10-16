import { Query, QueryFunctionName, QueryOptions } from "./types.js";

type FilterFunction = (
  obj: any,
  operator: any,
  query: Query,
  options: Readonly<QueryOptions>,
) => boolean;

type FilterMap = Map<QueryFunctionName, FilterFunction>;

const functions: Readonly<FilterMap> = new Map([
  ["$eq", (obj: any, value: any): boolean => obj === value],
  ["$ne", (obj: any, value: any): boolean => obj !== value],
  ["$gt", (obj: any, value: any): boolean => obj > value],
  ["$lt", (obj: any, value: any): boolean => obj < value],
  ["$gte", (obj: any, value: any): boolean => obj >= value],
  ["$lte", (obj: any, value: any): boolean => obj <= value],

  [
    "$all",
    (obj: any, value: any): boolean => {
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
  ["$in", (obj: any, value: any): boolean => value.indexOf(obj) !== -1],
  [
    "$nin",
    (obj: any, value: any): boolean =>
      typeof obj === "undefined" ? true : value.indexOf(obj) === -1,
  ],
  ["$size", (array: any, value: any): boolean => array.length === value],

  [
    "$not",
    (
      obj: any,
      condition: any,
      query: Query,
      options: Readonly<QueryOptions>,
    ): boolean => !match(obj, condition, options),
  ],
  [
    "$and",
    (
      obj: any,
      conditions: any,
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
    "$or",
    (
      obj: any,
      conditions: any,
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
    "$nor",
    (
      obj: any,
      conditions: any,
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
    "$exists",
    (obj: any, mustExist: any): boolean =>
      (typeof obj !== "undefined") === mustExist,
  ],
  [
    "$mod",
    (obj: any, [divisor, remainder]: any): boolean =>
      obj % divisor === remainder,
  ],
  [
    "$regex",
    (obj: any, pattern: any, query: Query): boolean => {
      const options = query.$options;

      return new RegExp(pattern, options).test(obj);
    },
  ],
  ["$options", (): boolean => true],
  [
    "$where",
    (
      obj: any,
      fn: any,
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
      query: any,
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
]);

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
    const callback = functions.get(key as QueryFunctionName);

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
