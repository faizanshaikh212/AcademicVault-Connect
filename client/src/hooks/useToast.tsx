import { useCallback } from "react";
import {
  toast as toastify,
  ToastContainer,
  ToastOptions,
} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface UseToastReturn {
  toast: (options: {
    title?: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
  ToastContainer: typeof ToastContainer;
}

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export function useToast(): UseToastReturn {
  const toast = useCallback(
    ({
      description,
      variant = "default",
    }: {
      title?: string;
      description: string;
      variant?: "default" | "destructive";
    }) => {
      if (variant === "destructive") {
        toastify.error(description, defaultOptions);
      } else {
        toastify.success(description, defaultOptions);
      }
    },
    []
  );

  return {
    toast,
    ToastContainer,
  };
}
