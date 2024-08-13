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

export const DescriptionPreview = ({
  description,
  handleOnClick = null,
  showTitle = false,
  sx = {},
}) => {
  if (!description) {
    handleOnClick(true);
    return null;
  }
  const sanitizedHtml = DOMPurify.sanitize(
    marked.parse(description),
    domPurityConfig
  );

  if (handleOnClick) {
    return (
      <>
        {showTitle && (
          <Typography variant="body1" color="text.secondary">
            Description
          </Typography>
        )}
        <Box
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          onClick={handleOnClick}
          sx={{ ...sx }}
        ></Box>
      </>
    );
  } else {
    return (
      <>
        {showTitle && <Typography variant="body1">Description</Typography>}
        <Box
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          sx={{ ...sx }}
        ></Box>
      </>
    );
  }
};

export const EditableDescription = ({
  description,
  readOnly = false,
  updateDescription,
  placeholder = "",
  showPreviewTitle = false,
  previewSx = {},
}) => {
  const [isEditing, setIsEditing] = useState(readOnly ? false : !description);
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
    return <DescriptionPreview description={description} />;
  }

  if (isEditing) {
    return (
      <TextField
        fullWidth
        multiline
        variant="standard"
        label="Description"
        placeholder={placeholder}
        disabled={readOnly}
        value={value}
        onBlur={(e) => handleOnBlur(e)}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => handleOnKeyDown(e)}
        inputRef={descriptionInput}
      />
    );
  } else {
    return (
      <DescriptionPreview
        description={description ? description : "Click to add a description"}
        handleOnClick={() => setIsEditing(true)}
        showTitle={showPreviewTitle}
        sx={previewSx}
      />
    );
  }
};
