import { LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import { z } from "zod";

/**
 * LinkSchema used to validate Links on creation. (Experiment with zod)
 */
export const LinkSchema = z.object({
  objectType: z.nativeEnum(LinkObjectType),
  objectId: z.string().max(255),
  label: z.string().max(255),
  icon: z.enum(["", "jira", "github"]).default(""), // TODO: make this more extensible / automagic.
  url: z
    .string()
    .refine(
      (value) => !value.toLowerCase().startsWith("javascript"),
      "URL cannot start with 'javascript'"
    ),
});
