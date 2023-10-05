import { SuggestionID } from "../../suggestions/models.js";

/**
 * Class definition for control
 */
export default class Control {
  id?: string;
  createdAt: number;
  updatedAt: number;

  constructor(
    public title: string,
    public description: string,
    public inPlace: boolean,
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
      inPlace: this.inPlace,
      modelId: this.modelId,
      componentId: this.componentId,
      suggestionId: this.suggestionId?.val,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
