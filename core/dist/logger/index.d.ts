/**
 * Logger implementation from log4js
 * @module logger/log4js
 * @exports logger
 */
import log4js from "log4js";
export type LogLine = {
    type?: "log" | "reqres" | "data" | "metric";
    timestamp: string;
    level: string;
    message: string;
    correlation_id?: string;
    meta: any;
    payload: any;
};
export declare const getLogger: typeof log4js.getLogger;
//# sourceMappingURL=index.d.ts.map