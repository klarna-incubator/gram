import { useEffect, useState } from "react";

export function useIsFramed() {
  const [isFramed, setIsFramed] = useState(false);

  useEffect(() => {
    setIsFramed(window !== window.top);
  }, []);

  return isFramed;
}
