import pkg from "log4js";
const { getLogger } = pkg;

export type ComponentType = "process" | "datastore" | "external";
export const ComponentTypes = ["process", "datastore", "external"];

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
export function isComponentClass(o: any): o is ComponentClass {
  return (
    "id" in o &&
    "name" in o &&
    "componentType" in o &&
    (ComponentTypes.includes(o.componentType) || o.componentType === "any")
  );
}

/**
 * ComponentClassHandler is a naïve in-memory static interface to fetch component classes from.
 */
export class ComponentClassHandler {
  constructor() {
    this.lookup = new Map();
    ComponentTypes.forEach((ct) => this.lookup.set(ct as ComponentType, []));
    this.log = getLogger("ComponentClassHandler");
  }

  lookup: Map<ComponentType, ComponentClass[]>;
  log: any;

  search(type: ComponentType, searchStr: string): ComponentClass[] {
    return this.lookup
      .get(type)!
      .filter((t) => t.name.toLowerCase().includes(searchStr.toLowerCase()));
  }

  add(cls: ComponentClass): void {
    if (cls.componentType === "any") {
      ComponentTypes.forEach((ct) =>
        this.lookup.get(ct as ComponentType)?.push(cls)
      );
    } else {
      this.lookup.get(cls.componentType)?.push(cls);
    }
  }
}
