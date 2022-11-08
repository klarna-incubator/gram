import { SuggestionID } from "../../suggestions/models";

/**
 * Class definition for threat
 */
export default class Threat {
  id?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;

  constructor(
    public title: string,
    public description: string,
    public modelId: string,
    public componentId: string,
    public createdBy: string,
    public suggestionId?: SuggestionID
  ) {
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      modelId: this.modelId,
      componentId: this.componentId,
      suggestionId: this.suggestionId?.val,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
