import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Check, Copy, X } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import api from "@/services/api";

interface StaticPageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editingPage: {
    slug: string;
    title: string;
    content: string;
  } | null;
  setEditingPage: (
    page: { slug: string; title: string; content: string } | null
  ) => void;
}

const StaticPageEditor: React.FC<StaticPageEditorProps> = ({
  isOpen,
  onClose,
  editingPage,
  setEditingPage,
}) => {
  const [editError, setEditError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { copy } = useCopyToClipboard();

  const handlePageSave = async () => {
    if (!editingPage) return;

    try {
      setEditError(null);
      await api.put(`/pages/${editingPage.slug}`, editingPage);
      onClose();
    } catch (err: any) {
      console.error("Failed to update page", err);
      setEditError(
        err.response?.data?.message || err.message || "Failed to save page"
      );
    }
  };

  if (!editingPage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-6 gap-0 border-gray-800 bg-gray-900">
        <DialogPrimitive.Close className="absolute right-4 top-4 p-2 rounded-sm opacity-70 ring-offset-gray-800 transition-opacity hover:opacity-100 hover:bg-red-500/20 disabled:pointer-events-none text-red-500 border-none focus:ring-0">
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
        <DialogHeader>
          <DialogTitle className="text-white">Edit Page</DialogTitle>
          {editError && (
            <div className="mt-2 text-sm text-red-600">{editError}</div>
          )}
        </DialogHeader>
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Title
            </label>
            <input
              type="text"
              value={editingPage.title}
              onChange={(e) =>
                setEditingPage({ ...editingPage, title: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-white">
              Content
            </label>
            {/* Helper note for editors: do not change styling */}
            {/* only show the detailed tip when editing the Privacy Policy page */}
            {editingPage?.slug === "privacy-policy" ? (
              <div className="mb-2 text-xs text-gray-300">
                Tip: To make the Cookie Policy link jump to a specific spot,
                insert the token{" "}
                <code className="bg-gray-800 px-1 rounded">
                  [cookie-section]
                </code>
                in the markdown where you want the anchor to appear.
              </div>
            ) : (
              <div className="mb-2 text-xs text-gray-500">
                Place page-specific notes here.
              </div>
            )}
            <div className="w-full h-[calc(100vh-350px)] min-h-[400px] border rounded-md dark:border-gray-700">
              <div className="relative h-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10"
                  onClick={async () => {
                    const success = await copy(editingPage.content);
                    if (success) {
                      setIsCopied(true);
                    }
                  }}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <Copy className="h-4 w-4 text-white" />
                  )}
                </Button>
                <MDEditor
                  value={editingPage.content}
                  onChange={(value) =>
                    setEditingPage({ ...editingPage, content: value || "" })
                  }
                  preview="live"
                  height="100%"
                  visibleDragbar={false}
                  // Keep className minimal so the editor's own layout isn't overridden
                  className="h-full"
                  // Use minimal textarea props — avoid forcing transparent backgrounds or absolute sizing
                  textareaProps={{
                    style: {
                      resize: "none",
                      outline: "none",
                      padding: "1rem",
                      fontSize: "16px",
                      width: "100%",
                      height: "100%",
                      border: "none",
                      lineHeight: "1.6",
                      display: "block",
                      margin: 0,
                      fontFamily: "inherit",
                    },
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="hover:bg-red-500/20 hover:text-red-500 border-red-500 text-red-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePageSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaticPageEditor;
