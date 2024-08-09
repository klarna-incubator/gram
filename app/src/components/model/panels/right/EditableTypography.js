import { Input, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { DescriptionPreview } from "../DescriptionPreview";

marked.use({
  extensions: [
    {
      name: "heading",
      renderer({ text, depth }) {
        return `<h${depth + 1}>${text}</h${depth + 1}>`;
      },
    },
    {
      name: "image",
      renderer(_) {
        return "Images are not supported";
      },
    },
    {
      name: "link",
      renderer(token) {
        console.log({ token });
        return `<a href="${token.href}" target="_blank" rel="noopener noreferrer">${token.text}</a>`;
      },
    },
    {
      name: "list",
      renderer(token) {
        const itemList = token.items.map((i) => {
          return (
            "<li style='margin-bottom:0'>" + i.raw.replace(/\n+$/, "") + "</li>"
          );
        });
        if (token.ordered) {
          return `<ol>${itemList.join("\n")}</ol>`;
        } else {
          return `<ul>${itemList.join("\n")}</ul>`;
        }
      },
    },
  ],
});

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
        <DescriptionPreview
          description={text}
          sx={{
            ...sx,
            wordBreak: "break-word",
            ...(!readOnly && {
              "&:hover": {
                cursor: "text",
              },
            }),
          }}
          readOnly={readOnly}
          showDescriptionTextField={() => setIsEditing(!isEditing)}
        />
      )}
    </>
  );
}
