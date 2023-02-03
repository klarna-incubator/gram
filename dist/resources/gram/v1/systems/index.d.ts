import { DataAccessLayer } from "@gram/core/dist/data/dal";
declare const systemsV1: (dal: DataAccessLayer) => {
    list: (req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: import("express").Response<any, Record<string, any>>) => Promise<import("express").Response<any, Record<string, any>>>;
    get: (req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: import("express").Response<any, Record<string, any>>) => Promise<import("express").Response<any, Record<string, any>>>;
    permission: (req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: import("express").Response<any, Record<string, any>>) => Promise<import("express").Response<any, Record<string, any>>>;
};
export default systemsV1;
//# sourceMappingURL=index.d.ts.map