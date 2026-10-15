import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface CoverMediaProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

const CoverMedia: React.FC<CoverMediaProps> = ({
  src,
  alt,
  className = "",
  fallbackLabel = "Image unavailable",
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt}: ${fallbackLabel}`}
        className={`flex items-center justify-center bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-500 ${className}`}
      >
        <span className="flex flex-col items-center gap-2 text-xs font-medium">
          <ImageIcon className="h-6 w-6" aria-hidden="true" />
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

export default CoverMedia;
