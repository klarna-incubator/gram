import { Service, SharedIniFileCredentials } from "aws-sdk";
import { isDevelopment } from "./env";

// For some reason AWS_PROFILE wasnt being used here unless I specifically set it.
// If this crashes on your local npm test with some "no such constructor SharedIniFileCredentials", try `unset AWS_PROFILE`
// the reason this happens is because aws-sdk is mocked, but no functionality is provided for SharedIniFileCredentials
export function configureFromAWSProfileForLocalDevelopment(client: Service) {
  if (isDevelopment()) {
    client.config.credentials = new SharedIniFileCredentials({
      profile: process.env.AWS_PROFILE,
    });
  }
}
