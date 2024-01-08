import { LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import { z } from "zod";

/**
 * LinkSchema used to validate Links on creation. (Experiment with zod)
 */
export const LinkSchema = z.object({
  objectType: z.nativeEnum(LinkObjectType),
  objectId: z.string(),
  label: z.string(),
  icon: z.enum(["", "jira", "github"]), // TODO: make this more extensible / automagic.
  url: z.string().refine((value) => {
    if (value.startsWith("javascript")) {
      return {
        message: "URL cannot start with 'javascript'",
      };
    }

    // Could enforce domain whitelist here.
    return true;
  }),
});
