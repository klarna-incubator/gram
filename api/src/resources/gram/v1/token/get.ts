/**
 * GET /api/v1/token
 * @exports {function} handler
 */
import { Request, Response } from "express";
import IdentityProviderRegistry from "@gram/core/dist/auth/IdentityProviderRegistry";
import * as jwt from "@gram/core/dist/auth/jwt";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { UserToken } from "@gram/core/dist/auth/models/UserToken";
import { getLogger } from "log4js";

const log = getLogger("getAuthToken");

export const getAuthToken =
  (dal: DataAccessLayer) => async (req: Request, res: Response) => {
    if (
      !req.query.provider ||
      IdentityProviderRegistry.has(req.query.provider as string) === false
    ) {
      return res.sendStatus(400);
    }

    const provider = req.query.provider as string;

    if (
      process.env.NODE_ENV !== "test" &&
      IdentityProviderRegistry.has("mock")
    ) {
      throw new Error("`mock` should not be enabled outside test env");
    }

    const identity = await IdentityProviderRegistry.get(provider)?.getIdentity({
      currentRequest: req,
    });

    if (identity?.status === "ok") {
      const user = await dal.userHandler.lookupUser(
        { currentRequest: req },
        identity.identity.sub
      );
      if (!user) {
        log.warn(
          `Login successful but no user found for ${identity.identity.sub}`
        );
        return res.status(403).json({
          status: "error",
          message: `No user found for ${identity.identity.sub}`,
        });
      }

      const roles = await dal.authzProvider.getRolesForUser(
        identity.identity.sub
      );

      if (roles.length === 0) {
        log.warn(
          `Login successful for ${identity.identity.sub} but with no roles attached (i.e. empty roles array). This is likely a bug in your authzProvider.`
        );
      }

      const teams = await dal.teamHandler.getTeamsForUser(
        { currentRequest: req },
        identity.identity.sub
      );

      const token: UserToken = {
        ...user,
        sub: identity.identity.sub,
        roles,
        teams,
      };
      const jwtToken = await jwt.generateToken({ ...token });
      return res.json({ status: "ok", token: jwtToken });
    }

    if (!identity || identity?.status === "error") {
      res.status(400);
    }
    return res.json(identity);
  };
