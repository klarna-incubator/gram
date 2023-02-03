export type ComponentType = "process" | "datastore" | "external";
export declare const ComponentTypes: string[];
/**
 * Used to classify components, i.e. specify certain technologies that are used.
 *
 * We need a better name for this.
 */
export interface ComponentClass {
    id: string;
    name: string;
    icon?: string;
    componentType: ComponentType | "any";
}
/**
 * Guard function to check if object is of type ComponentClass
 * @param o object to check
 */
export declare function isComponentClass(o: any): o is ComponentClass;
/**
 * ComponentClassHandler is a naïve in-memory static interface to fetch component classes from.
 */
export declare class ComponentClassHandler {
    constructor();
    lookup: Map<ComponentType, ComponentClass[]>;
    log: any;
    search(type: ComponentType, searchStr: string): ComponentClass[];
    add(cls: ComponentClass): void;
}
//# sourceMappingURL=index.d.ts.map