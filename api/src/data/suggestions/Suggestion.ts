import { SuggestionID } from "../../suggestions/models";

export enum SuggestionStatus {
  New = "new",
  Rejected = "rejected",
  Accepted = "accepted",
}

export class SuggestedThreat {
  status: SuggestionStatus = SuggestionStatus.New;

  constructor(
    public id: SuggestionID,
    public modelId: string,
    public componentId: string,
    public source: string
  ) {}

  reason?: string | undefined = "";
  title: string = "";
  description: string = "";

  toJSON() {
    return {
      id: this.id.val,
      modelId: this.modelId,
      componentId: this.componentId,
      reason: this.reason,
      title: this.title,
      description: this.description,
      status: this.status,
      source: this.source,
    };
  }
}

export class SuggestedControl {
  status: SuggestionStatus = SuggestionStatus.New;

  constructor(
    public id: SuggestionID,
    public modelId: string,
    public componentId: string,
    public source: string
  ) {}

  mitigates: { partialThreatId: string }[] = [];
  reason?: string | undefined = "";
  title: string = "";
  description: string = "";

  toJSON() {
    return {
      id: this.id.val,
      modelId: this.modelId,
      componentId: this.componentId,
      mitigates: this.mitigates,
      reason: this.reason,
      title: this.title,
      description: this.description,
      status: this.status,
      source: this.source,
    };
  }
}

export function isControl(
  suggestion: SuggestedThreat | SuggestedControl
): suggestion is SuggestedControl {
  return (suggestion as SuggestedControl).mitigates !== undefined;
}
