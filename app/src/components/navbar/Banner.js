import React from "react";
import { Alert } from "@mui/material";
import { useGetBannersQuery } from "../../api/gram/banner";

export function Banner() {
  const { data: banners, isSuccess } = useGetBannersQuery();

  if (!isSuccess) {
    return <></>;
  }
  return banners.map(({ id, type, text }) => (
    <Alert key={`alert-${id}`} severity={type} variant="filled">
      {text}
    </Alert>
  ));
}
