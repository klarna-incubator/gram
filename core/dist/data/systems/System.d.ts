import { SystemOwner } from "./systems";
/**
 * Class definition for system
 */
export default class System {
    id: string;
    shortName: string;
    displayName: string;
    /**
     * Determines who owns this System and can be checked
     * for authorization rules.
     */
    owners: SystemOwner[];
    description?: string | undefined;
    constructor(id: string, shortName: string, displayName: string, 
    /**
     * Determines who owns this System and can be checked
     * for authorization rules.
     */
    owners: SystemOwner[], description?: string | undefined);
    toJSON(): {
        id: string;
        shortName: string;
        displayName: string;
        owners: SystemOwner[];
        description: string | undefined;
    };
}
//# sourceMappingURL=System.d.ts.map