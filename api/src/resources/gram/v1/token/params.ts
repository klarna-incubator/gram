import { Request, Response } from "express";
import IdentityProviderRegistry from "@gram/core/dist/auth/IdentityProviderRegistry.js";

export default async function getAuthParams(req: Request, res: Response) {
  const params = await Promise.all(
    Array.from(IdentityProviderRegistry.entries()).map(
      async ([key, provider]) => ({
        ...(await provider.params({ currentRequest: req })),
        provider: key,
      })
    )
  );

  res.json(params);
}
