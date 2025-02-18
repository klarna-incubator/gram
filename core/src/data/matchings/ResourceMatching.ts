export default class ResourceMatching {
  createdAt: number;
  updatedAt: number;
  updatedBy: string;
  deletedAt: number | null;

  constructor(
    public modelId: string,
    public resourceId: string,
    public componentId: string,
    public createdBy: string
  ) {
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.updatedBy = createdBy;
    this.deletedAt = null;
  }

  toJSON() {
    return {
      modelId: this.modelId,
      resourceId: this.resourceId,
      componentId: this.componentId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy,
      deletedAt: this.deletedAt,
    };
  }
}
