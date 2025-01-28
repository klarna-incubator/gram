export default class Matching {
  createdAt: number;
  updatedAt: number;

  constructor(
    public modelId: string,
    public resourceId: string,
    public componentId: string,
    public createdBy: string
  ) {
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  toJSON() {
    return {
      modelId: this.modelId,
      resourceId: this.resourceId,
      componentId: this.componentId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
