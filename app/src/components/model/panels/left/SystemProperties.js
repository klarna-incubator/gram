import { Card, CardContent, Skeleton, Typography } from "@mui/material";
import { uniqueId } from "lodash";
import { useGetSystemPropertiesQuery } from "../../../../api/gram/system-properties";
import { ErrorLine } from "../../../elements/ErrorLine";

export function SystemProperties({ modelId }) {
  const {
    isLoading,
    isFetching,
    isError,
    error,
    data: properties,
  } = useGetSystemPropertiesQuery(modelId);

  if (isLoading || isFetching) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Skeleton />
          <Skeleton width="33%" height="2rem" />
          <Skeleton />
          <Skeleton width="33%" height="2rem" />
          <Skeleton />
          <Skeleton width="33%" height="2rem" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return <ErrorLine message={error.message} />;
  }

  if (!properties || properties.length === 0) {
    return <></>;
  }

  return (
    <Card elevation={2}>
      <CardContent>
        {properties.map((ctx) => (
          <div key={uniqueId()}>
            <Typography sx={{ fontWeight: "bold" }}>{ctx.label}</Typography>
            <Typography sx={{ paddingBottom: "14px", fontStyle: "italic" }}>
              {ctx.value}
            </Typography>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
