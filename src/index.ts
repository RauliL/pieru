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

export type QueryOptions = {
  $where: boolean;
};

const functions: Readonly<
  Record<
    string,
    (obj: any, operator: any, query: Query, options: QueryOptions) => boolean
  >
> = {
  $all(obj: any, value: ReadonlyArray<any>): boolean {
    if (!(value instanceof Array) || !(obj instanceof Array)) {
      return false;
    }

    for (let i = 0; i < value.length; i++) {
      if (obj.indexOf(value[i]) === -1) {
        return false;
      }
    }

    return true;
  },

  $gt(obj: any, value: any): boolean {
    return obj > value;
  },

  $gte(obj: any, value: any): boolean {
    return obj >= value;
  },

  $in(obj: any, value: any): boolean {
    return value.indexOf(obj) !== -1;
  },

  $lt(obj: any, value: any): boolean {
    return obj < value;
  },

  $lte(obj: any, value: any): boolean {
    return obj <= value;
  },

  $ne(obj: any, value: any): boolean {
    return obj !== value;
  },

  $nin(obj: any, value: ReadonlyArray<any>): boolean {
    if (typeof obj === "undefined") {
      return true;
    }

    return value.indexOf(obj) === -1;
  },

  $and(
    obj: any,
    conditions: ReadonlyArray<Query>,
    query: Query,
    options: QueryOptions,
  ): boolean {
    for (let i = 0; i < conditions.length; ++i) {
      if (!match(obj, conditions[i], options)) {
        return false;
      }
    }

    return true;
  },

  $nor(
    obj: any,
    conditions: ReadonlyArray<Query>,
    query: Query,
    options: QueryOptions,
  ): boolean {
    for (let i = 0; i < conditions.length; ++i) {
      if (match(obj, conditions[i], options)) {
        return false;
      }
    }

    return true;
  },

  $not(
    obj: any,
    condition: Query,
    query: Query,
    options: QueryOptions,
  ): boolean {
    return !match(obj, condition, options);
  },

  $or(
    obj: any,
    conditions: ReadonlyArray<Query>,
    query: Query,
    options: QueryOptions,
  ): boolean {
    for (let i = 0; i < conditions.length; ++i) {
      if (match(obj, conditions[i], options)) {
        return true;
      }
    }

    return false;
  },

  $exists(obj: any, mustExist: boolean): boolean {
    return (typeof obj !== "undefined") === mustExist;
  },

  $mod(obj: any, [divisor, remainder]: [number, number]): boolean {
    return obj % divisor === remainder;
  },

  $regex(obj: any, regex: any, query: Query): boolean {
    const options = query.$options;

    return new RegExp(regex, options).test(obj);
  },

  $options(): boolean {
    return true;
  },

  $where(
    obj: any,
    fn: string | Function,
    query: Query,
    options: QueryOptions,
  ): boolean {
    if (!options.$where) {
      return false;
    }

    if (typeof fn === "function") {
      return !!fn.call(obj, obj);
    }
    fn = new Function("obj", fn);

    return !!fn.call(obj, obj);
  },

  $elemMatch(
    array: any,
    query: Query,
    q: Query,
    options: QueryOptions,
  ): boolean {
    for (let i = 0; i < array.length; i++) {
      if (match(array[i], query, options)) {
        return true;
      }
    }

    return false;
  },

  $size(array: any, length: number): boolean {
    return array.length === length;
  },
};

/***
 * Tests if obj is equal to query.
 *
 * @todo Deep test.
 */
const matchArray = (
  obj: ReadonlyArray<any>,
  query: ReadonlyArray<any>,
): boolean => {
  if (!(obj instanceof Array)) {
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
  options: QueryOptions,
): boolean => {
  for (const key in query) {
    if (key in functions) {
      // runs the match function
      if (!functions[key]?.(obj, query[key], query, options)) {
        return false;
      }
    } else {
      let value = obj[key];

      if (key.indexOf(".") !== -1) {
        value = getDotNotationProp(obj, key);
      }

      // recursive run match for an attribute
      if (!match(value, query[key])) {
        return false;
      }
    }
  }

  return true;
};

export function match<Q extends Query>(
  obj: any,
  query: Q | ReadonlyArray<any> | RegExp,
  options: QueryOptions = { $where: false },
): boolean {
  if (query instanceof RegExp) {
    return query.test(obj);
  }

  if (query instanceof Array) {
    return matchArray(obj, query);
  }

  if (typeof query === "object") {
    return matchQueryObject(obj, query, options);
  }

  return query === obj;
}
