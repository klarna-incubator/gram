import { Request, Response } from "express";
import AuthProviderRegistry from "../../../../auth/AuthProviderRegistry";

export default async function getAuthParams(req: Request, res: Response) {
  const params = await Promise.all(
    Array.from(AuthProviderRegistry.entries()).map(async ([key, provider]) => ({
      ...(await provider.params({ currentRequest: req })),
      provider: key,
    }))
  );

  res.json(params);
}
