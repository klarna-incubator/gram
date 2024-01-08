import { AddLink as AddLinkIcon } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useDispatch } from "react-redux";
import {
  useDeleteLinkMutation,
  useListLinksQuery,
} from "../../../../api/gram/links";
import { modalActions } from "../../../../redux/modalSlice";
import { ExternalLink } from "../../../elements/ExternalLink";
import { MODALS } from "../../../elements/modal/ModalManager";
import { useReadOnly } from "../../../../hooks/useReadOnly";

export function Links({ objectType, objectId }) {
  const dispatch = useDispatch();
  const { data: links } = useListLinksQuery({
    objectType,
    objectId,
  });
  const [deleteLink, link] = useDeleteLinkMutation();
  const readOnly = useReadOnly();

  const openAddLinkModal = () =>
    dispatch(
      modalActions.open({
        type: MODALS.AddLink.name,
        props: { objectType, objectId },
      })
    );

  return (
    <>
      <IconButton onClick={openAddLinkModal}>
        <AddLinkIcon
          sx={{
            fontSize: 20,
            color: "#ccc",
          }}
        />
      </IconButton>

      {links &&
        links.map((e) => (
          <ExternalLink
            key={`link-${e.id}`}
            href={e.url}
            icon={e.icon}
            label={e.label}
            size="small"
            onDelete={
              readOnly
                ? null
                : () => {
                    deleteLink({ linkId: e.id, objectType, objectId });
                  }
            }
          />
        ))}
    </>
  );
}
