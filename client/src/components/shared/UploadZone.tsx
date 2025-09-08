import React, { useEffect, useMemo, useState } from "react";
import { UploadCloud, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  file: File | null;
  setFile: (f: File | null) => void;
  accept?: string; // accept attribute string e.g. "image/*,application/pdf"
  maxSizeMB?: number; // max file size in MB
  label?: string;
  helper?: string;
}

const defaultAccept =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";

const UploadZone: React.FC<Props> = ({
  file,
  setFile,
  accept = defaultAccept,
  maxSizeMB = 15,
  label = "Or Upload File",
  helper = "Supported: PDF, DOCX, images",
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const allowedTypes = useMemo(
    () => accept.split(",").map((s) => s.trim()),
    [accept]
  );

  const validateAndSet = (f: File | null) => {
    if (!f) {
      setFile(null);
      return;
    }
    // size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (f.size > maxBytes) {
      toast.error(`File too large. Max ${maxSizeMB}MB`);
      return;
    }

    // type check: allow if any accept entry is '*' or matches prefix or exact
    const ok = allowedTypes.some((t) => {
      if (!t) return false;
      if (t === "*") return true;
      if (t.endsWith("/*")) {
        const prefix = t.replace("/*", "");
        return f.type.startsWith(prefix);
      }
      return (
        f.type === t ||
        f.name.toLowerCase().endsWith(t.replace("application/", "."))
      );
    });
    if (!ok) {
      toast.error("Unsupported file type");
      return;
    }

    setFile(f);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <label className="mt-2 flex items-center gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-slate-200">
        <UploadCloud className="w-5 h-5 text-blue-600" />
        <div className="flex-1 flex flex-col">
          <span className="text-sm font-medium dark:text-slate-100">
            Click to upload or drag file here
          </span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            {helper}
          </span>
        </div>
        <input
          type="file"
          accept={accept}
          onChange={(e) => validateAndSet(e.target.files?.[0] || null)}
          className="sr-only"
        />
      </label>

      {file && (
        <div className="mt-3 flex items-center gap-3">
          {file.type.startsWith("image/") && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-20 h-20 object-cover rounded-md border"
            />
          ) : file.type === "application/pdf" && previewUrl ? (
            <div className="w-20 h-20 rounded-md border bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-xs text-slate-600">
              <div className="text-center">
                <div className="font-medium">PDF</div>
                <button
                  type="button"
                  className="text-blue-600 text-xs mt-1 underline"
                  onClick={() => window.open(previewUrl, "_blank")}
                >
                  Preview
                </button>
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-md border flex items-center justify-center text-slate-600 dark:text-slate-300">
              <FileText className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1">
            <div className="text-sm font-medium">{file.name}</div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              {Math.round(file.size / 1024)} KB
            </div>
          </div>

          <div>
            <button
              type="button"
              className="px-2 py-1 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800"
              onClick={() => setFile(null)}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
