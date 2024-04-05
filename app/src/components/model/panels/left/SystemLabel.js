import { IconButton, Typography, Link, Box } from "@mui/material";
import { SystemDropdown } from "../../../elements/SystemDropdown";
import { Link as RouterLink } from "react-router-dom";
import { useGetSystemQuery } from "../../../../api/gram/system";
import { useState } from "react";
import { useSetSystemIdMutation } from "../../../../api/gram/model";
import { useModelID } from "../../hooks/useModelID";
import EditIcon from "@mui/icons-material/Edit";
import { LoadingDots } from "../../../elements/loading/loading-dots/LoadingDots";
import { useGetUserQuery } from "../../../../api/gram/auth";

export function SystemLabel({ systemId }) {
  const { data: system } = useGetSystemQuery({ systemId });
  const { data: user } = useGetUserQuery();
  const modelId = useModelID();

  const [showSystemDropdown, setShowSystemDropdown] = useState(false);
  const [setSystemId, result] = useSetSystemIdMutation();

  const onSystemSubmit = async (newSystemId) => {
    setSystemId({
      id: modelId,
      systemId: newSystemId,
    });
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: "bold" }}>
        System{" "}
        {user?.roles.includes("admin") && !showSystemDropdown && (
          <IconButton
            size="small"
            style={{ float: "right" }}
            onClick={() => setShowSystemDropdown(!showSystemDropdown)}
          >
            <EditIcon />
          </IconButton>
        )}
      </Typography>
      <Box>
        {showSystemDropdown && (
          <SystemDropdown
            value={systemId}
            onChange={(newValue) => {
              onSystemSubmit(newValue);
              setShowSystemDropdown(false);
            }}
            onBlur={() => setShowSystemDropdown(false)}
          ></SystemDropdown>
        )}
        {result.isLoading && <LoadingDots />}
        {!showSystemDropdown && !systemId && (
          <Typography sx={{ paddingBottom: "14px" }}>
            No System attached
          </Typography>
        )}
        {!showSystemDropdown && systemId && system && (
          <Link component={RouterLink} to={`/system/${systemId}`}>
            <Typography sx={{ paddingBottom: "14px" }}>
              {system.displayName}
            </Typography>
          </Link>
        )}
      </Box>
    </Box>
  );
}
