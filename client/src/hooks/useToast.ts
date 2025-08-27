import { toast as toastify } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ToastOptions {
  position?:
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left";
  autoClose?: number;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  theme?: "light" | "dark" | "colored";
}

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

export const toast = (
  message: string,
  type: "success" | "error" | "info" | "warning" = "info",
  options?: ToastOptions
) => {
  const toastOptions = { ...defaultOptions, ...options };

  switch (type) {
    case "success":
      return toastify.success(message, toastOptions);
    case "error":
      return toastify.error(message, toastOptions);
    case "warning":
      return toastify.warning(message, toastOptions);
    default:
      return toastify.info(message, toastOptions);
  }
};
