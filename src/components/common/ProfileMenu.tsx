import { ArrowLeftRight, Languages, LogOut, User } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const ThaiFlag = () => (
  <svg
    className="w-5 h-3.5 rounded-[2px] shadow-xs border border-gray-200 shrink-0"
    viewBox="0 0 900 600"
    aria-label="Thailand Flag"
  >
    <rect fill="#A51931" width="900" height="600" />
    <rect fill="#F4F5F8" y="100" width="900" height="400" />
    <rect fill="#2D2A4A" y="200" width="900" height="200" />
  </svg>
);

interface ProfileMenuProps {
  userName?: string;
  onLanguageClick?: () => void;
  onSwitchBrokerClick?: () => void;
  onSignOutClick?: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  userName = "Pakornsak Supamongkonchaikul",
  onLanguageClick,
  onSwitchBrokerClick,
  onSignOutClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`p-2 rounded-full transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isOpen ? "bg-white/20 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
        }`}
      >
        <User className="w-5 h-5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 z-50 origin-top-right animate-in fade-in duration-150">
          {/* Top Pointer Arrow */}
          <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45 rounded-tl-[2px]" />

          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100 text-gray-800">
            {/* Account Info Header */}
            <div className="px-5 py-3.5 bg-blue-50/60 text-sm">
              <span className="text-gray-500 font-medium">Account: </span>
              <span className="text-gray-900 font-medium truncate block sm:inline">{userName}</span>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Language Selector */}
              <button
                type="button"
                onClick={() => {
                  onLanguageClick?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Languages className="w-4 h-4 text-gray-500" />
                  <span>Language</span>
                </div>
                <ThaiFlag />
              </button>

              {/* Switch Broker */}
              <button
                type="button"
                onClick={() => {
                  onSwitchBrokerClick?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4 text-gray-500" />
                <span>Switch Broker</span>
              </button>
            </div>

            {/* Sign Out */}
            <div className="py-2">
              <button
                type="button"
                onClick={() => {
                  onSignOutClick?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors group"
              >
                <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
