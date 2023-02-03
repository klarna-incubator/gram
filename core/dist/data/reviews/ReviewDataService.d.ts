/// <reference types="node" />
import { EventEmitter } from "events";
import { Pool } from "pg";
import { DataAccessLayer } from "../dal";
import { RequestContext } from "../providers/RequestContext";
import { SystemPropertyFilter, SystemPropertyValue } from "../system-property/types";
import { Review, ReviewStatus } from "./Review";
import { ReviewSystemCompliance } from "./ReviewSystemCompliance";
export declare function convertToReview(row: any): Review;
export declare function validStatus(newStatus: string): boolean;
interface ReviewListFilter {
    statuses?: ReviewStatus[];
    properties?: SystemPropertyFilter[];
    requestedBy?: string;
    reviewedBy?: string;
    systemIds?: string[];
}
export interface ReviewListResultItem extends Partial<Review> {
    model: {
        version: string;
        systemId: string;
    };
    systemProperties: SystemPropertyValue[];
}
interface ReviewListResult {
    total: number;
    items: ReviewListResultItem[];
}
export declare class ReviewDataService extends EventEmitter {
    private pool;
    private dal;
    constructor(pool: Pool, dal: DataAccessLayer);
    log: import("log4js").Logger;
    /**
     * Get the review object by modelId
     * @param {string} modelId - Model system identifier
     * @returns {Review}
     */
    getByModelId(modelId: string): Promise<Review | null>;
    list(ctx: RequestContext, filters: ReviewListFilter, page?: number, dateOrder?: "ASC" | "DESC"): Promise<ReviewListResult>;
    getComplianceForSystems(systemIds: string[]): Promise<ReviewSystemCompliance[]>;
    /**
     * Create the review object
     * @param {Review} review - Review creation object
     * @returns {string}
     */
    create(review: Review): Promise<string>;
    cancel(modelId: string): Promise<false | Review>;
    decline(ctx: RequestContext, modelId: string, note?: string): Promise<false | Review>;
    approve(modelId: string, approvingUser?: string, note?: string, extras?: any): Promise<false | Review>;
    changeReviewer(modelId: string, newReviewer?: string): Promise<false | Review | null>;
    requestMeeting(modelId: string, requestingUser?: string): Promise<false | Review>;
    update(modelId: string, fields: {
        status?: ReviewStatus;
        reviewedBy?: string | null;
        requestedBy?: string | null;
        note?: string;
        extras?: object;
    }): Promise<false | Review>;
}
export {};
//# sourceMappingURL=ReviewDataService.d.ts.map