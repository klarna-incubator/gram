export type LinkObjectId = string;
export enum LinkObjectType {
  Model = "model",
  Threat = "threat",
  Control = "control",
  System = "system",
}

export class Link {
  id: number;
  objectType: LinkObjectType;
  objectId: LinkObjectId;

  label: string;
  url: string;
  icon: string;

  createdBy: string;
  createdAt: number;
  updatedAt: number;

  constructor(
    id: number,
    objectType: LinkObjectType,
    objectId: LinkObjectId,
    label: string,
    url: string,
    icon: string,
    createdBy: string,
    createdAt: number,
    updatedAt: number
  ) {
    this.id = id;
    this.objectType = objectType;
    this.objectId = objectId;
    this.label = label;
    this.url = url;
    this.icon = icon;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      objectType: this.objectType,
      objectId: this.objectId,
      label: this.label,
      url: this.url,
      icon: this.icon,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
