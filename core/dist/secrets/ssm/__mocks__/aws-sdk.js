"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSM = exports.getParameterFn = void 0;
exports.getParameterFn = jest.fn();
class SSM {
    constructor() {
        this.getParameter = exports.getParameterFn;
    }
}
exports.SSM = SSM;
//# sourceMappingURL=aws-sdk.js.map