export type QueryFunctionMapping = {
  // Comparison operators.
  $eq: any;
  $ne: any;
  $gt: any;
  $gte: any;
  $lt: any;
  $lte: any;

  // Array operators.
  $all: ReadonlyArray<any>;
  $in: ReadonlyArray<any>;
  $nin: ReadonlyArray<any>;
  $size: number;

  // Logical operators.
  $not: string | RegExp | Query;
  $and: ReadonlyArray<Query>;
  $or: ReadonlyArray<Query>;
  $nor: ReadonlyArray<Query>;

  // And the rest.
  $exists: boolean;
  $mod: [number, number];
  $regex: string | RegExp;
  $options: any;
  $where: string | ((obj: any) => boolean);
  $elemMatch: Query;
};

export type QueryFunctionName = keyof QueryFunctionMapping;

export type Query = Record<string, any> & Partial<QueryFunctionMapping>;

export type QueryOptions = {
  $where: boolean;
};
