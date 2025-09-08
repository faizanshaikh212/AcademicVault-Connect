import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Eye, EyeOff } from "lucide-react";

interface PasswordConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  variant?: "default" | "destructive";
}

const PasswordConfirmDialog: React.FC<PasswordConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  variant = "default",
}) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { verifyPassword } = useAuth();
  const { toast } = useToast();

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyPassword(password);
      await onConfirm();
      setPassword("");
      onClose();
      toast({
        title: "Success",
        description: "Action confirmed successfully",
      });
    } catch (error: any) {
      setError("Wrong password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 text-black dark:text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Enter your password to confirm
            </label>
            <div className="relative">
              <Input
                id="confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPassword("");
                onClose();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={variant}
              disabled={loading || !password}
            >
              {loading ? "Confirming..." : confirmText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordConfirmDialog;
