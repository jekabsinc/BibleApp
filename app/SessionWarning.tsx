// app/SessionWarning.tsx
"use client";

import { useCallback, useState } from "react";

function getInitialVisible() {
  try {
    return !sessionStorage.getItem("translation_warning_dismissed");
  } catch {
    return true;
  }
}

export default function SessionWarning() {
  const [visible, setVisible] = useState(getInitialVisible);

  const close = useCallback(() => {
    try {
      sessionStorage.setItem("translation_warning_dismissed", "true");
    } catch {}
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="tw-session-warning" role="status" aria-live="polite">
      <span>!!!Tulkošana joprojām ir procesā!!!</span>
      <button
        type="button"
        className="tw-session-warning__close"
        onClick={close}
        aria-label="Aizvērt"
      >
        ✕
      </button>
    </div>
  );
}
