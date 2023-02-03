"use strict";
/**
 * Pulls secrets from AWS SSM
 * @module secrets/config
 * @deprecated
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSMSecretProvider = void 0;
const aws_sdk_1 = require("aws-sdk");
const aws_1 = require("../../util/aws");
const errors_1 = require("../errors");
class SSMSecretProvider {
    constructor() {
        this.key = "ssm";
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO move to configuration?
            const prefix = process.env.PARAMETER_SECRET_PATH;
            const ssm = new aws_sdk_1.SSM();
            (0, aws_1.configureFromAWSProfileForLocalDevelopment)(ssm);
            const params = {
                Name: `${prefix}/${key}`,
                WithDecryption: true,
            };
            try {
                const data = yield ssm.getParameter(params).promise();
                return data.Parameter.Value;
            }
            catch (error) {
                throw new errors_1.InvalidSecretError(`Found no such secret with key ${key}: ${error}`);
            }
        });
    }
}
exports.SSMSecretProvider = SSMSecretProvider;
//# sourceMappingURL=index.js.map