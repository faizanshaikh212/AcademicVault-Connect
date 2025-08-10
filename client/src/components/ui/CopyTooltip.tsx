import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface CopyTooltipProps {
  show: boolean;
  text?: string;
}

const CopyTooltip: React.FC<CopyTooltipProps> = ({
  show,
  text = "Copied!",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded flex items-center gap-1 shadow-lg">
      <Check className="w-3 h-3" />
      {text}
    </div>
  );
};

export default CopyTooltip;
