import { App, Octokit } from "octokit";
import secrets from "../../secrets";
import * as dotenv from "dotenv";
import System from "../../data/systems/System";
import { createAppAuth } from "@octokit/auth-app";
dotenv.config();

async function main() {
  const appId = await secrets.get("auth.providerOpts.github.appId");
  const clientId = await secrets.get("auth.providerOpts.github.clientId");
  const clientSecret = await secrets.get(
    "auth.providerOpts.github.clientSecret"
  );
  const privateKey = await secrets.get("auth.providerOpts.github.privateKey");

  const app = new App({
    appId,
    privateKey,
    oauth: { clientId, clientSecret },
  });

  // const token = process.env.GITHUB_TOKEN;
  // if (!token) {
  //   console.log("y no token?");
  //   return;
  // }
  // const octo = await app.oauth.getUserOctokit({ token });

  // // https://docs.github.com/en/rest/apps/installations#list-repositories-accessible-to-the-app-installation
  // const { data: installations } = await octo.request(
  //   "GET /user/installations",
  //   {}
  // );
  // // const resp = await octo.request("GET /user/orgs", {});
  // console.log(JSON.stringify(installations, null, 2));

  // installations.installations.forEach(async (inst) => {
  //   const resp2 = await octo.request(`GET /user/installations/{installationId}/repositories`, {
  //     installationId: inst.id,
  //   });
  //   console.log(resp2);
  //   console.log(resp2.data.repositories.map((r: any) => new System(r.full_name, r.name, r.name, [], r.description)));
  //   console.log(resp2.data.repositories[0]);
  // });

  // const q =
  //   "burn in:name fork:true " +
  //   installations.installations
  //     .map((inst) => `user:${inst.account?.login}`)
  //     .join(" ");

  // const searchResp = await octo.request(
  //   "GET /search/repositories{?q,sort,order,per_page,page}",
  //   { q }
  // );
  // console.log(searchResp.data);
  // console.log(q);

  const appAuth = createAppAuth({
    appId,
    privateKey,
    clientId,
    clientSecret,
  });

  const auth: any = await app.octokit.auth({ type: "app" });
  console.log(auth);
  // const auth2 = await appAuth({type: "app"});
  // console.log(auth2);
  const o = new Octokit({ token: auth.token });
  const resp = await o.request(`GET /users/{userId}`, { userId: "tethik" });
  console.log(resp);
}

main();
