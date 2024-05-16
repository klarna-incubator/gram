export function ModelPreview({ modelId, ...props }) {
  return (
    <iframe
      title="Model Preview"
      {...props}
      src={document.location.origin + "/model/" + modelId}
    ></iframe>
  );
}
