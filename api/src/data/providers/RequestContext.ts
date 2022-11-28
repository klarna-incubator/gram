import { Request } from "express";

/**
 * Represent the the current context of the application, carrying
 * objects such as the current Express request object.
 */
export interface RequestContext {
  currentRequest?: Request;
}
