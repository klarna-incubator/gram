import { Request, Response } from "express";
import { config } from "@gram/core/dist/config/index.js";
import { defaultRealtimeTransport } from "@gram/core/dist/config/GramConfiguration.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

/**
 * Tells the frontend how this backend is set up, so it can adapt: which
 * real-time transport to use and which optional features to show.
 */
export const getConfig =
  (dal: DataAccessLayer) => async (req: Request, res: Response) => {
    res.json({
      realtimeTransport:
        config.realtimeTransport?.type ?? defaultRealtimeTransport,
      features: {
        resources: dal.resourceHandler.hasProviders(),
      },
    });
  };
