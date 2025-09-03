import * as React from "react";

interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children }) => {
  return <>{children}</>;
};

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "end";
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ children, align = "start" }) => {
  const alignment = align === "end" ? "right-0" : "left-0";
  return (
    <div
      className={`absolute mt-2 w-56 ${alignment} origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none z-50`}
    >
      {children}
    </div>
  );
};

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick: () => void;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group flex rounded-md items-center w-full px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 transition"
    >
      {children}
    </button>
  );
};
