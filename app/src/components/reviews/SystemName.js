import React, { Fragment } from "react";
import { useGetSystemQuery } from "../../api/gram/system";

export function SystemName({ systemId }) {
  const { data, isLoading } = useGetSystemQuery({ systemId });
  return (
    <Fragment>{isLoading ? systemId : data ? data.displayName : ""}</Fragment>
  );
}
