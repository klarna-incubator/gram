"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class definition for system
 */
class System {
    constructor(id, shortName, displayName, 
    /**
     * Determines who owns this System and can be checked
     * for authorization rules.
     */
    owners, description) {
        this.id = id;
        this.shortName = shortName;
        this.displayName = displayName;
        this.owners = owners;
        this.description = description;
    }
    toJSON() {
        return {
            id: this.id,
            shortName: this.shortName,
            displayName: this.displayName,
            owners: this.owners,
            description: this.description,
        };
    }
}
exports.default = System;
//# sourceMappingURL=System.js.map