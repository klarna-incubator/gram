import { Request, Response } from "express";
import AuthProviderRegistry from "../../../../auth/AuthProviderRegistry";

export default async function getAuthParams(req: Request, res: Response) {
  const params: any = {};

  await Promise.all(
    Array.from(AuthProviderRegistry.entries()).map(async ([key, provider]) => {
      params[key] = await provider.params();
    })
  );

  res.json(params);
}
