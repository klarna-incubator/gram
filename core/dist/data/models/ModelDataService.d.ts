/**
 * Postgres 12.4 implementation for `models`
 * @module data/models/postgres
 * @exports models
 */
/// <reference types="node" />
import EventEmitter from "events";
import { Pool } from "pg";
import { DataAccessLayer } from "../dal";
import Model, { ModelData } from "./Model";
export declare const ModelFilters: string[];
export declare enum ModelFilter {
    User = "user",
    Recent = "recent",
    System = "system"
}
export interface ModelListOptions {
    user: string;
    withSystems: boolean;
    systemId?: string;
}
export declare class ModelDataService extends EventEmitter {
    private dal;
    constructor(pool: Pool, dal: DataAccessLayer);
    private pool;
    log: any;
    /**
     * Retrieve list of model objects based on filter
     * @param {string} filter - Type of filter to use
     * @param {object} options - Object parameter for a specific filter
     * @returns {array}
     */
    list(filter: ModelFilter, opts: ModelListOptions): Promise<Model[]>;
    /**
     * Retrieve the model object of specified id
     * @param {string} id - System identifier
     * @returns {Model}
     */
    getById(id: string): Promise<Model | null>;
    getTemplates(): Promise<{
        id: any;
        version: any;
    }[]>;
    /**
     * Create a model object of specified id
     * @param {Model} model - Model creation object
     * @param {string | null} srcModelId - Source model for create new model
     * @returns {string}
     */
    create(model: Model, createdFrom?: string | null): Promise<any>;
    copy(srcModelId: string, targetModel: Model): Promise<string | null>;
    /**
     * Delete model by id
     * @param {string} id
     */
    delete(id: string): Promise<boolean>;
    /**
     * Update the model object of specified id
     * @param {string} id - Model id to update
     * @param {any} model - Model object to save
     * @returns {boolean} - true if an update was performed
     */
    update(id: string, model: {
        version: string;
        data: ModelData;
    }): Promise<boolean>;
    setTemplate(modelId: string, isTemplate: boolean): Promise<boolean>;
    logAction(userId: string, modelId: string, action: string): Promise<any>;
}
//# sourceMappingURL=ModelDataService.d.ts.map