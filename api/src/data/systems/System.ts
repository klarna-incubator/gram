import { SystemOwner } from "./systems";

/**
 * Class definition for system
 */
export default class System {
  constructor(
    public id: string,
    public shortName: string,
    public displayName: string,
    /**
     * Determines who owns this System and can be checked
     * for authorization rules.
     */
    public owners: SystemOwner[],
    public description?: string
  ) {}

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
