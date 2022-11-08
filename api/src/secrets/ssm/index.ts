/**
 * Pulls secrets from AWS SSM
 * @module secrets/config
 * @deprecated
 */

import { SSM } from "aws-sdk";
import { configureFromAWSProfileForLocalDevelopment } from "../../util/aws";
import { InvalidSecretError } from "../errors";
import { SecretProvider } from "../SecretProvider";

export class SSMSecretProvider implements SecretProvider {
  key = "ssm";

  async get(key: string) {
    //TODO move to configuration?
    const prefix = process.env.PARAMETER_SECRET_PATH;
    const ssm = new SSM();

    configureFromAWSProfileForLocalDevelopment(ssm);

    const params: SSM.GetParameterRequest = {
      Name: `${prefix}/${key}`,
      WithDecryption: true,
    };

    try {
      const data = await ssm.getParameter(params).promise();
      return data.Parameter!.Value;
    } catch (error: any) {
      throw new InvalidSecretError(
        `Found no such secret with key ${key}: ${error}`
      );
    }
  }
}
