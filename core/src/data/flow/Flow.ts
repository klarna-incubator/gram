export type FlowAttributes = {
  [key: string]: string | string[] | number | boolean;
};

export class Flow {
  constructor(
    public id: number,
    public modelId: string,
    public dataFlowId: string,
    public originComponentId: string,
    public summary: string,
    public attributes: FlowAttributes,
    public createdBy: string,
    public createdAt: number,
    public updatedAt: number
  ) {}

  toJSON() {
    return {
      id: this.id,
      dataFlowId: this.dataFlowId,
      modelId: this.modelId,
      originComponentId: this.originComponentId,
      summary: this.summary,
      attributes: this.attributes,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
