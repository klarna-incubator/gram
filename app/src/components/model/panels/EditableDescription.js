import { marked } from "marked";
import DOMPurify from "dompurify";
import { useState, useEffect, useCallback } from "react";
import { Box, TextField, Typography } from "@mui/material";

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
        if (!token.href) {
          return `<p><strong>${token.text}</strong> (link without href)</p>`;
        }
        return `<a href="${token.href}" target="_blank" rel="noopener noreferrer">${token.text}</a>`;
      },
    },
    {
      name: "code",
      renderer(token) {
        if (!token.text) {
          return "";
        }
        if (token.lang) {
          return `<div><p>\`\`\`${token.lang}</p><pre style="margin-left:1em"><code class="language-${token.lang}">${token.text}</code></pre><p>\`\`\`</p></div>`;
        }
        return `<div><p>\`\`\`</p><pre style="margin-left:1em"><code class="language-${token.lang}">${token.text}</code></pre><p>\`\`\`</p></div>`;
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

const domPurityConfig = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["img"],
  ADD_ATTR: ["target"],
};

export function DescriptionPreview({
  description,
  onClick = null,
  showTitle = false,
  boxSx = {},
}) {
  if (!description && onClick) {
    onClick(true);
    return null;
  }

  const sanitizedHtml = DOMPurify.sanitize(
    marked.parse(description || ""),
    domPurityConfig
  );

  const titleSx = description
    ? {
        fontSize: "12px",
        color: "text.secondary",
        marginBottom: "0.5em",
      }
    : {
        color: "text.secondary",
        borderBottom: "1px solid",
        paddingBottom: "0.5em",
      };

  const bSx =
    boxSx ||
    (description
      ? {
          borderBottom: "1px solid rgba(255, 255, 255, 0.7)",
        }
      : {
          color: "text.secondary",
          fontSize: "12px",
          paddingTop: "0.5em",
        });

  if (onClick) {
    return (
      <Box onClick={onClick}>
        {showTitle && (
          <Typography
            variant="body1"
            sx={{ ...titleSx, color: "rgba(255, 255, 255, 0.5)" }}
          >
            Description
          </Typography>
        )}
        <Box
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          sx={{
            color: "rgba(255, 255, 255, 0.5)",
            borderColor: "rgba(255, 255, 255, 0.5)",
            wordBreak: "break-word",
            ...bSx,
          }}
        ></Box>
      </Box>
    );
  }

  return (
    <Box>
      {showTitle && (
        <Typography variant="body1" sx={{ ...titleSx }}>
          Description
        </Typography>
      )}
      <Box
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        sx={{ ...boxSx }}
      ></Box>
    </Box>
  );
}

export function EditableDescription({
  description,
  readOnly = false,
  updateDescription,
  placeholder = "",
  showInputLabel = true,
  inputSx = {},
  showPreviewTitle = false,
  previewSx = {},
  variant = "standard",
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(description);

  const descriptionInput = useCallback((inputElement) => {
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  useEffect(() => {
    setValue(description);
  }, [description]);

  const handleOnBlur = (e) => {
    updateDescription(e.target.value);
    setIsEditing(false);
  };

  const handleOnKeyDown = (e) => {
    if ((!e.shiftKey && e.key === "Enter") || e.key === "Escape") {
      e.preventDefault();
      e.target.blur();
    }
  };

  if (readOnly) {
    return (
      <DescriptionPreview
        showTitle={showPreviewTitle}
        description={description}
        variant={variant}
        boxSx={previewSx}
      />
    );
  }

  if (isEditing) {
    return (
      <TextField
        fullWidth
        multiline
        variant={variant}
        label={showInputLabel ? "Description" : ""}
        placeholder={placeholder}
        disabled={readOnly}
        value={value}
        onBlur={(e) => handleOnBlur(e)}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => handleOnKeyDown(e)}
        inputRef={descriptionInput}
        inputProps={{
          style: { ...inputSx },
        }}
      />
    );
  }

  return (
    <DescriptionPreview
      description={description ? description : "Click to add a description"}
      onClick={() => setIsEditing(true)}
      variant={variant}
      showTitle={showPreviewTitle}
      boxSx={previewSx}
    />
  );
}
