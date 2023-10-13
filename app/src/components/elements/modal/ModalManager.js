import React from "react";
import { useSelector } from "react-redux";
import { ApproveReview } from "../../model/modals/ApproveReview";
import { DeleteModel } from "../../model/modals/DeleteModel";
import { DeleteSelected } from "../../model/modals/DeleteSelected";
import { EditNote } from "../../model/modals/EditNote";
import { RequestMeeting } from "../../model/modals/RequestMeeting";
import { RequestReview } from "../../model/modals/RequestReview";
import { ChangeReviewer } from "../../model/modals/ChangeReviewer";
import { Tutorial } from "../../model/tutorial/Tutorial";
import { CancelReview } from "../../reviews/modals/CancelReview";
import { DeclineReview } from "../../reviews/modals/DeclineReview";
import { ViewActionItems } from "../../model/modals/ViewActionItems";

export const MODALS = {
  ChangeReviewer,
  RequestReview,
  EditNote,
  RequestMeeting,
  ApproveReview,
  DeleteModel,
  Tutorial,
  DeleteSelected,
  DeclineReview,
  CancelReview,
  ViewActionItems,
};

export function ModalManager() {
  const modal = useSelector((state) => state.modal);
  const { type, props } = modal;

  let renderedModal;

  if (type) {
    const ModalComponent = MODALS[type];
    renderedModal = <ModalComponent {...props} />;
  }

  return <>{renderedModal}</>;
}
