/// <reference types="node" />
import { Pool } from "pg";
import { EventEmitter } from "stream";
import Mitigation from "./Mitigation";
export declare class MitigationDataService extends EventEmitter {
    constructor(pool: Pool);
    private pool;
    log: any;
    /**
     * Create a mitigation object
     * @param {Control} control - Control creation object
     * @returns {string}
     */
    create(mitigation: Mitigation): Promise<false | {
        threatId: string;
        controlId: string;
    }>;
    /**
     * Retrieve a mitigation object
     * @param {string} threatId - Threat identifier
     * @param {string} controlId - Control identifier
     * @returns {Mitigation}
     */
    getById(threatId: string, controlId: string): Promise<Mitigation | null>;
    /**
     * Retrieve the mitigations objects
     * @param {string} modelId - Model identifier
     * @returns {Control}
     */
    list(modelId: string): Promise<Mitigation[]>;
    /**
     * Delete mitigation object
     * @param {string} threatId - Threat identifier
     * @param {string} controlId - Control identifier
     */
    delete(threatId: string, controlId: string): Promise<boolean>;
}
//# sourceMappingURL=MitigationDataService.d.ts.map