import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useTitle(title) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!title) {
      return;
    }
    const oldTitle = document.title;
    document.title = title;
    navigate(
      window.location.href.substring(window.location.origin.length),
      title
    );
    return () => (document.title = oldTitle);
  }, [title, navigate]);
}
