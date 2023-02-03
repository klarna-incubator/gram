"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureFromAWSProfileForLocalDevelopment = void 0;
const aws_sdk_1 = require("aws-sdk");
const env_1 = require("./env");
// For some reason AWS_PROFILE wasnt being used here unless I specifically set it.
// If this crashes on your local npm test with some "no such constructor SharedIniFileCredentials", try `unset AWS_PROFILE`
// the reason this happens is because aws-sdk is mocked, but no functionality is provided for SharedIniFileCredentials
function configureFromAWSProfileForLocalDevelopment(client) {
    if ((0, env_1.isDevelopment)()) {
        client.config.credentials = new aws_sdk_1.SharedIniFileCredentials({
            profile: process.env.AWS_PROFILE,
        });
    }
}
exports.configureFromAWSProfileForLocalDevelopment = configureFromAWSProfileForLocalDevelopment;
//# sourceMappingURL=aws.js.map