/// <reference types="node" />
import { EventEmitter } from "events";
import { Pool } from "pg";
import { DataAccessLayer } from "../dal";
import Control from "./Control";
export declare function convertToControl(row: any): Control;
export declare class ControlDataService extends EventEmitter {
    constructor(pool: Pool, dal: DataAccessLayer);
    private pool;
    private dal;
    log: any;
    /**
     * Create a control object of specified id
     * @param {Control} control - Control creation object
     * @returns {string}
     */
    create(control: Control): Promise<any>;
    /**
     * Retrieve a control object
     * @param {string} id - Control identifier
     * @returns {Control}
     */
    getById(id: string): Promise<Control | null>;
    /**
     * Retrieve the controls objects
     * @param {string} modelId - Model identifier
     * @returns {Control}
     */
    list(modelId: string): Promise<Control[]>;
    /**
     * Delete control by model id and component id
     * @param modelId
     * @param componentIds
     * @returns
     */
    deleteByComponentId(modelId: string, componentIds: string[]): Promise<boolean>;
    /**
     * Delete control by id(s)
     * @param id
     */
    delete(modelId: string, ...ids: string[]): Promise<boolean>;
    /**
     * Update control fields by id
     * @param id
     * @param fields
     */
    update(modelId: string, id: string, fields: {
        inPlace?: boolean;
        title?: string;
        description?: string;
    }): Promise<false | Control>;
}
//# sourceMappingURL=ControlDataService.d.ts.map