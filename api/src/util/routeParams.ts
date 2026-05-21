import type { ParamsDictionary } from "express-serve-static-core";

/** Named route segments in Gram are always strings (no wildcard params). */
export type RouteParams = Record<string, string>;

export function routeParams(params: ParamsDictionary): RouteParams {
  return params as RouteParams;
}
