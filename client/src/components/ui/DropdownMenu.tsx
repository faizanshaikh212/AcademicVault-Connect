import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from "react";
import { cn } from "@/lib/utils";

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdown must be used within a DropdownMenu");
  }
  return context;
};

const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={menuRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

const DropdownMenuTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
}> = ({ children }) => {
  const { setIsOpen } = useDropdown();
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={triggerRef} onClick={handleToggle} className="cursor-pointer">
      {children}
    </div>
  );
};

const DropdownMenuContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
}> = ({ children, className, align = "start" }) => {
  const { isOpen } = useDropdown();
  return (
    <div
      className={cn(
        "absolute z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700",
        align === "end" ? "right-0" : "left-0",
        isOpen
          ? "transition ease-out duration-100 transform opacity-100 scale-100"
          : "transition ease-in duration-75 transform opacity-0 scale-95 pointer-events-none",
        className
      )}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {children}
      </div>
    </div>
  );
};

const DropdownMenuItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}> = ({ children, onClick, className, asChild = false }) => {
  const { setIsOpen } = useDropdown();
  const handleClick = () => {
    if (onClick) onClick();
    setIsOpen(false);
  };

  if (asChild) {
    // When asChild is true, we clone the child element and add our props
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      className: cn(
        "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer",
        className,
        (children as React.ReactElement).props.className
      ),
    });
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
};

const DropdownMenuSeparator: React.FC = () => {
  return <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />;
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
