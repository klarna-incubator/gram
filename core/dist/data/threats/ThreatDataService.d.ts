/**
 * Postgres 12.4 implementation for `threats`
 * @module data/threats/postgres
 * @exports threats
 */
/// <reference types="node" />
import { EventEmitter } from "events";
import { Pool } from "pg";
import { DataAccessLayer } from "../dal";
import Threat from "./Threat";
export declare function convertToThreat(row: any): Threat;
export declare class ThreatDataService extends EventEmitter {
    constructor(pool: Pool, dal: DataAccessLayer);
    private pool;
    private dal;
    log: any;
    /**
     * Create the threat object
     * @param {Threat} threat - Threat creation object
     * @returns {string}
     */
    create(threat: Threat): Promise<any>;
    /**
     * Retrieve a threat object
     * @param {string} id - Threat identifier
     * @returns {Threat}
     */
    getById(id: string): Promise<Threat | null>;
    /**
     * Retrieve the threat object
     * @param {string} modelId - Model system identifier
     * @returns {[Threat]}
     */
    list(modelId: string): Promise<Threat[]>;
    listActionItems(modelId: string): Promise<Threat[]>;
    /**
     * Update threat fields by id
     * @param id
     * @param fields
     */
    update(modelId: string, id: string, fields: {
        title?: string;
        description?: string;
        isActionItem?: boolean;
    }): Promise<false | Threat>;
    /**
     * Delete threat by model id and component id
     * @param modelId
     * @param componentIds
     * @returns
     */
    deleteByComponentId(modelId: string, componentIds: string[]): Promise<boolean>;
    /**
     * Delete the threat object
     * @param {id} id - Threat id to delete
     * @returns {boolean}
     */
    delete(modelId: string, ...ids: string[]): Promise<boolean>;
}
//# sourceMappingURL=ThreatDataService.d.ts.map