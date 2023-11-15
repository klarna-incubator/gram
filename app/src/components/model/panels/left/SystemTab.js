import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Link,
  Switch,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { patchVersion } from "../../../../actions/model/patchVersion";
import { useGetUserQuery } from "../../../../api/gram/auth";
import {
  useGetModelQuery,
  usePatchModelMutation,
  useSetTemplateMutation,
} from "../../../../api/gram/model";
import { useGetSystemQuery } from "../../../../api/gram/system";
import { useReadOnly } from "../../../../hooks/useReadOnly";
import { useTitle } from "../../../../hooks/useTitle";
import { useModelID } from "../../hooks/useModelID";
import { EditableTypography } from "../right/EditableTypography";
import { Review } from "./Review";
import { SystemProperties } from "./SystemProperties";

export function SystemTab() {
  const modelId = useModelID();
  const { data: modelData } = useGetModelQuery(modelId);
  const { systemId } = modelData;

  const { data: system } = useGetSystemQuery({ systemId });

  // Grab version from local state. This syncs differently than RTK API for ... reasons.
  const version = useSelector(({ model: { version } }) => version);
  const isTemplate = useSelector(({ model: { isTemplate } }) => isTemplate);

  const systemLoading = !system || system.pending;
  const [patchModel] = usePatchModelMutation();
  const [setTemplate] = useSetTemplateMutation();

  const { data: user } = useGetUserQuery();
  const readOnly = useReadOnly();
  const dispatch = useDispatch();

  const onVersionSubmit = async (newVersion) => {
    const model = { ...modelData, version: newVersion };
    patchModel({
      id: modelId,
      model,
    });
    // Ensure model is reloaded or local model will overwrite with old version name.
    // Probably will have some sync issues. Should update model api to allow for partial updates.
    dispatch(patchVersion(modelId, newVersion));
  };

  useTitle(
    `Model: ${
      !!systemId && system && system.displayName
        ? `${system.displayName} - ${version}`
        : version || ""
    }`
  );

  return (
    <Box
      sx={{
        overflow: "auto",
        padding: "8px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Card elevation={2}>
          <CardContent>
            {!systemLoading && (
              <>
                <Typography sx={{ fontWeight: "bold" }}>System</Typography>
                <Link component={RouterLink} to={`/system/${systemId}`}>
                  <Typography sx={{ paddingBottom: "14px" }}>
                    {system.displayName}
                  </Typography>
                </Link>
              </>
            )}

            <Typography sx={{ fontWeight: "bold" }}>Version</Typography>
            <EditableTypography
              sx={{ paddingBottom: "14px" }}
              text={version}
              placeholder="Title"
              variant="body1"
              color="text.primary"
              onSubmit={onVersionSubmit}
              readOnly={readOnly}
            />

            {!systemLoading && system.owners && (
              <>
                <Typography sx={{ fontWeight: "bold" }}>Owner(s)</Typography>
                {system.owners.map((owner) => (
                  <Link
                    key={`owner-link-${owner.id}`}
                    component={RouterLink}
                    to={`/team/${owner.id}`}
                  >
                    <Typography sx={{ paddingBottom: "14px" }}>
                      {owner.name}
                    </Typography>
                  </Link>
                ))}
              </>
            )}

            {user?.roles.includes("admin") && (
              <>
                <Typography sx={{ fontWeight: "bold" }}>Template</Typography>
                <FormControlLabel
                  value="end"
                  control={
                    <Switch
                      color="primary"
                      checked={isTemplate || false}
                      onChange={(val) => {
                        setTemplate({ id: modelId, isTemplate: !isTemplate });
                      }}
                    />
                  }
                  label="Set As Template"
                  labelPlacement="end"
                />
              </>
            )}

            {!systemLoading && system.description && (
              <>
                <Typography sx={{ fontWeight: "bold" }}>Description</Typography>
                <Typography>{system.description}</Typography>
              </>
            )}
          </CardContent>
        </Card>
        <Review />
        {systemId && <SystemProperties modelId={modelId} />}
      </Box>
    </Box>
  );
}
