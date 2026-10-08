export type FilterFunctionName =
  | "$eq"
  | "$ne"
  | "$gt"
  | "$gte"
  | "$lt"
  | "$lte"
  | "$all"
  | "$in"
  | "$nin"
  | "$size"
  | "$not"
  | "$and"
  | "$or"
  | "$nor"
  | "$exists"
  | "$mod"
  | "$options"
  | "$where"
  | "$elemMatch";

export type QueryOptions = {
  $where: boolean;
};
