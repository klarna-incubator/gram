import Threat from "./Threat.js";

export class ActionItemExport {
  constructor(
    public exporterKey: string,
    public threatId: string,
    public linkedURL: string
  ) {}

  toJSON() {
    return {
      exporterKey: this.exporterKey,
      threatId: this.threatId,
      linkedURL: this.linkedURL,
    };
  }
}

export class ActionItem {
  constructor(public threat: Threat, public exports: ActionItemExport[]) {}

  toJSON() {
    return {
      threat: this.threat.toJSON(),
      exports: this.exports.map((e) => e.toJSON()),
    };
  }
}
