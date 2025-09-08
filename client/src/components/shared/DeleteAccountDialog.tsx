import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../ui/AlertDialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    email: string;
    password: string;
    reason?: string;
  }) => void;
  userEmail: string;
  loading?: boolean;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  loading = false,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (email !== userEmail) {
      setError("Email doesn't match your account email");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    onConfirm({ email, password, reason });
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
            This action cannot be undone. Your account will be scheduled for
            deletion in 30 days. During this period, you can cancel the deletion
            if you change your mind.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Confirm your email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={userEmail}
              type="email"
              name="email"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Enter your password</Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Your current password"
              name="password"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for leaving (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Help us improve our service"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleClose}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Delete Account"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
