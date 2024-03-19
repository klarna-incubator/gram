import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { SystemPropertyProvider } from "@gram/core/dist/data/system-property/SystemPropertyProvider.js";
import {
  SystemProperty,
  SystemPropertyValue,
} from "@gram/core/dist/data/system-property/types.js";
import { isDevelopment } from "@gram/core/dist/util/env.js";
import { createHttpsProxyAgent } from "@gram/core/dist/util/proxyAgent.js";
import aws from "aws-sdk";
import { execSync } from "child_process";
import fs from "fs";
import _ from "lodash";
import log4js from "log4js";
import readline from "readline";
import { Readable } from "stream";
import * as url from "url";

const log = log4js.getLogger("HSFContextProvider");

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

async function assumeRole(
  awsRole: string,
  awsExternalId: string,
  beCursed: boolean
): Promise<aws.Credentials> {
  const params: aws.STS.AssumeRoleRequest = {
    RoleArn: awsRole, //config.get("data._providers.hsf.awsRole") as string,
    RoleSessionName: `gram-hsf-access-${_.uniqueId(Date.now().toString())}`,
    ExternalId: awsExternalId, //config.get("data._providers.hsf.awsExternalId") as string,
  };

  let masterCredentials: aws.Credentials | undefined; // Credentials to inherit from
  if (
    isDevelopment() &&
    beCursed //config.get("data._providers.hsf.doCursedThing") === true
  ) {
    // Cursed workaround to assume role in a development environment. This uses the staging c2c container
    // to assume the role. Normally, you should not need to do this, and can use mocked data instead.
    // Note: You'll need to have an active production Gram_Idp.admin session to access grond. Ensure `grond whoami` works.
    //
    // Blame oh-police for being too annoying to create the custom policy needed for our admin roles to emulate
    // the roleAssumption used by C2C.
    log.warn(
      `Using extremely cursed method to borrow the staging C2C credentials. You most likely should not be using this, only turn this on if you're debugging AWS assumeRole stuff.`
    );
    const cmd = `grond service execute -n gram -p eu -s staging -c 'curl -s 169.254.170.2$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI'`;
    let res = execSync(cmd).toString();
    res = res.split("\n").slice(1).join("\n");
    const jsoned = JSON.parse(res);
    masterCredentials = new aws.Credentials({
      accessKeyId: jsoned.AccessKeyId,
      secretAccessKey: jsoned.SecretAccessKey,
      sessionToken: jsoned.Token,
    });
  }
  // Assume role the normal way. This should work from C2C.
  const creds = new aws.ChainableTemporaryCredentials({
    params,
    stsConfig: {
      region: process.env.AWS_REGION,
      httpOptions: {
        // STS is not whitelisted by C2C, so we need to use the proxy to access it.
        // https://stash.int.klarna.net/projects/DEVSERV/repos/docs/pull-requests/1985/diff#content/documentation/c2c-platform/05_explanations/c2c_networking.md
        agent: createHttpsProxyAgent(),
      },
    },
    masterCredentials,
  });

  await creds.getPromise();

  return creds;
}

function errorHandler(err: any) {
  log.error(`Failed to parse HSF data`, err);
}

const HSF_REFRESH_TIME_MS = 1000 * 60 * 60;

export class HSFContextProvider implements SystemPropertyProvider {
  id = "hsf";
  hsfset: Set<string>;
  refreshInterval?: NodeJS.Timeout;

  constructor(
    hsfBucket: string,
    hsfKey: string,
    awsRole: string,
    awsExternalId: string
  ) {
    this.hsfset = new Set();
    this.load(hsfBucket, hsfKey, awsRole, awsExternalId);
    if (process.env.NODE_ENV !== "test") {
      this.refreshInterval = setInterval(
        () => this.load(hsfBucket, hsfKey, awsRole, awsExternalId),
        HSF_REFRESH_TIME_MS
      );
    }
  }

  async listSystemByPropertyValue(
    ctx: RequestContext,
    propertyId: string,
    value: any
  ): Promise<string[]> {
    if (propertyId !== "hsf") {
      throw new Error("Method not implemented.");
    }

    return Array.from(this.hsfset);
  }

  definitions: SystemProperty[] = [
    {
      id: "hsf",
      label: "HSF - High Security Footprint",
      type: "toggle",
    },
  ];

  async provideSystemProperties(
    ctx: RequestContext,
    systemId: string,
    quick: boolean
  ): Promise<SystemPropertyValue[]> {
    const item: SystemPropertyValue = {
      id: "hsf",
      label: "HSF - High Security Footprint",
      value: this.hsfset.has(systemId).toString(),
      displayInList: this.hsfset.has(systemId),
    };

    return [item];
  }

  async load(
    hsfBucket: string,
    hsfKey: string,
    awsRole: string,
    awsExternalId: string
  ) {
    try {
      let stream: Readable;
      if (hsfBucket) {
        const s3Params = {
          Bucket: hsfBucket,
          Key: hsfKey,
        };

        const credentials = await assumeRole(awsRole, awsExternalId, false);
        const s3 = new aws.S3({
          credentials,
          region: process.env.AWS_REGION,
        });

        stream = s3
          .getObject(s3Params)
          .createReadStream()
          .on("error", errorHandler); // This stream is read asyncronously, but is not under await/async, so we have to handle it separately
      } else {
        log.info("No s3 config found, loading mocked data for HSF systems");
        stream = fs.createReadStream(
          (__dirname + "/mock-data/hsf-systems-mocked.csv").replace(
            "dist",
            "src"
          )
        );
      }

      // Load the CSV stream (file or s3)
      const rl = readline.createInterface({
        input: stream,
      });

      const newHsfSet = new Set<string>();

      const parseLine = (line: string) => {
        // Rows contain:
        // i,id,system_id,team_name,team_key
        const objectId = line.split(",")[2];
        if (objectId === "system_id") {
          // skip the first line
          return;
        }
        newHsfSet.add(objectId);
      };
      rl.on("line", parseLine);
      rl.on("close", () => {
        this.hsfset = newHsfSet;
        log.info(`Loaded ${this.hsfset.size} hsf systems`);
      });
      rl.on("error", errorHandler);
    } catch (err: any) {
      errorHandler(err);
    }
  }
}
