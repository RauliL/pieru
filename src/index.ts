export type Query = (object: any) => boolean;

export type QueryOptions = {
  $where: boolean;
};

/**
 * Creates an match function to test objects against a mongodb query
 */
export const createQuery = (
  query: any,
  options: QueryOptions = { $where: false },
): Query => {
  /**
   * Match functions.
   *
   * @see http://docs.mongodb.org/manual/reference/operators/#query-selectors
   */
  const fn: Readonly<Record<string, Function>> = {
    $all(obj: any, value: any): boolean {
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

    $nin(obj: any, value: any): boolean {
      if (typeof obj === "undefined") {
        return true;
      }

      return value.indexOf(obj) === -1;
    },

    $and(obj: any, conditions: any): boolean {
      for (let i = 0; i < conditions.length; ++i) {
        if (!match(obj, conditions[i])) {
          return false;
        }
      }

      return true;
    },

    $nor(obj: any, conditions: any): boolean {
      for (let i = 0; i < conditions.length; ++i) {
        if (match(obj, conditions[i])) {
          return false;
        }
      }

      return true;
    },

    $not(obj: any, condition: any): boolean {
      return !match(obj, condition);
    },

    $or(obj: any, conditions: any): boolean {
      for (let i = 0; i < conditions.length; ++i) {
        if (match(obj, conditions[i])) {
          return true;
        }
      }

      return false;
    },

    $exists(obj: any, mustExist: any): boolean {
      return (typeof obj !== "undefined") === mustExist;
    },

    $mod(obj: any, div: any): boolean {
      const divisor = div[0];
      const remainder = div[1];

      return obj % divisor === remainder;
    },

    $regex(obj: any, regex: any, query: any): boolean {
      const options = query.$options;

      return new RegExp(regex, options).test(obj);
    },

    $options(): boolean {
      return true;
    },

    $where(obj: any, fn: any): boolean {
      if (!options.$where) {
        return false;
      }

      if (typeof fn === "function") {
        return !!fn.call(obj, obj);
      }
      fn = new Function("obj", fn);

      return !!fn.call(obj, obj);
    },

    $elemMatch(array: any, query: any): boolean {
      for (let i = 0; i < array.length; i++) {
        if (match(array[i], query)) {
          return true;
        }
      }

      return false;
    },

    $size(array: any, length: any): boolean {
      return array.length === length;
    },
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

  /***
   * Tests if obj is equal to query.
   *
   * @todo Deep test.
   */
  const matchArray = (obj: any, query: any): boolean => {
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

  /**
   * Tests an object against an object query.
   *
   * - Does not include regexp and equal tests.
   */
  const matchQueryObject = (obj: any, query: any): boolean => {
    for (const key of Object.keys(query)) {
      if (key in fn) {
        // runs the match function
        if (!fn[key]?.(obj, query[key], query)) {
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

  /**
   * Tests an object against a mongodb query.
   */
  const match = (obj: any, query: any): boolean => {
    if (query instanceof RegExp) {
      return query.test(obj);
    }

    if (query instanceof Array) {
      return matchArray(obj, query);
    }

    if (typeof query === "object") {
      return matchQueryObject(obj, query);
    }

    return query === obj;
  };

  // Return the match function.
  return (obj: any) => match(obj, query);
};
