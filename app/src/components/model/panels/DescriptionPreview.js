import { marked } from "marked";
import DOMPurify from "dompurify";
import Box from "@mui/material/Box";

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
  readOnly,
  showDescriptionTextField,
  sx = {},
}) => {
  if (!readOnly && !description) {
    showDescriptionTextField(true);
    return null;
  }
  const sanitizedHtml = DOMPurify.sanitize(
    marked.parse(description),
    domPurityConfig
  );

  if (readOnly) {
    return (
      <Box
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        sx={{ ...sx }}
      ></Box>
    );
  } else {
    return (
      <Box
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        sx={{ ...sx }}
        onClick={showDescriptionTextField}
      ></Box>
    );
  }
};
