import { Input } from "@mui/material";
import { useEffect, useState } from "react";
import { Typography } from "@mui/material";

export function EditableTypography({
  text,
  variant,
  color,
  onSubmit,
  placeholder,
  sx,
  readOnly,
}) {
  const colorType = color.substring(5);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);

  useEffect(() => {
    setValue(text);
  }, [text]);

  return (
    <>
      {isEditing ? (
        <Input
          multiline
          disableUnderline
          fullWidth
          autoFocus={true}
          spellCheck={false}
          defaultValue={value}
          placeholder={placeholder}
          onBlur={(e) => {
            setValue(e.target.value);
            onSubmit(e.target.value);
            setIsEditing(!isEditing);
          }}
          onFocus={(e) => {
            e.target.selectionStart = e.target.value.length;
          }}
          onKeyDown={(e) => {
            if ((!e.shiftKey && e.key === "Enter") || e.key === "Escape") {
              e.preventDefault();
              e.target.blur();
            }
          }}
          sx={{
            color: (theme) => theme.palette.text[colorType],
            fontSize: (theme) => theme.typography[variant].fontSize,
            fontWeight: (theme) => theme.typography[variant].fontWeight,
            lineHeight: (theme) => theme.typography[variant].lineHeight,
            letterSpacing: (theme) => theme.typography[variant].letterSpacing,
            "& input": {
              padding: "0px",
              height: "inherit",
            },
            "& textarea": {
              padding: "0px",
              height: "inherit",
            },
            padding: "0px",
            ...sx,
          }}
        />
      ) : (
        <Typography
          variant={variant}
          color={color}
          onClick={() => {
            if (!readOnly) {
              setIsEditing(!isEditing);
            }
          }}
          sx={{
            ...sx,
            wordBreak: "break-word",
            ...(!readOnly && {
              "&:hover": {
                cursor: "text",
              },
            }),
          }}
        >
          {value || placeholder}
        </Typography>
      )}
    </>
  );
}
