import { config } from "@gram/core/dist/config/index.js";
import { z } from "zod";

function attributes() {
  let obj: any = {};
  config.attributes.flow.forEach((attr) => {
    if (attr.type === "text") {
      obj[attr.key] = z.string().optional();
    } else if (attr.type === "description") {
      obj[attr.key] = z.string().optional();
    } else if (attr.type === "select") {
      obj[attr.key] = z
        .array(
          z.custom<string>((val) =>
            typeof val === "string" ? attr.options.includes(val) : false
          )
        )
        .optional();
    }
  });
  return obj;
}

/**
 * FlowSchema used to validate Flows on creation.
 */
export const NewFlowSchema = () => {
  return z.object({
    attributes: z.object({
      ...attributes(),
    }),
    modelId: z.string().uuid(),
    dataFlowId: z.string().uuid(),
    originComponentId: z.string().uuid(),
    summary: z.string(),
  });
};

export const PatchFlowSchema = () => {
  return z.object({
    attributes: z.object({
      ...attributes(),
    }),
    flowId: z.number().int(),
    originComponentId: z.string().uuid(),
    summary: z.string(),
  });
};
