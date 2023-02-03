export interface SystemPropertyValue extends SystemProperty {
    /**
     * The value of the item
     */
    value: string | string[];
    /**
     * Whether this property should be displayed in a list or not.
     */
    displayInList: boolean;
}
export interface SystemPropertyFilter {
    propertyId: string;
    value: string;
}
export interface SystemProperty {
    /**
     * A unique ID for this item. A slug is recommended, i.e. aws-region
     */
    id: string;
    /**
     * A human readable label for the item
     */
    label: string;
    /**
     * Description of the item, to explain what it means.
     */
    description?: string;
    /**
     * Batchable and filterable. These will be available when listing systems.
     */
    batchFilterable: boolean;
}
//# sourceMappingURL=types.d.ts.map