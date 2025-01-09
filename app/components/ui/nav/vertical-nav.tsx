import { Home, Files, Settings } from "lucide-react";
import { Link, useLocation } from "@remix-run/react";

const navItems = [
  {
    icon: Home,
    label: "Home",
    href: "/",
  },
  {
    icon: Files,
    label: "Files",
    href: "/files",
  },
];

export function VerticalNav() {
  const location = useLocation();

  return (
    <nav className="w-16 border-r bg-white flex flex-col items-center py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`p-3 rounded-lg mb-2 hover:bg-gray-100 transition-colors ${
              isActive ? "bg-gray-100" : ""
            }`}
            title={item.label}
          >
            <Icon className="w-6 h-6 text-gray-600" />
            <span className="sr-only">{item.label}</span>
          </Link>
        );
      })}
      <div className="flex flex-1" />
      <Link
        to="/settings"
        className={`p-3 rounded-lg mb-2 hover:bg-gray-100 transition-colors ${
          location.pathname === "settings" ? "bg-gray-100" : ""
        }`}
        title="Settings"
      >
        <Settings className="w-6 h-6 text-gray-600" />
        <span className="sr-only">{"Settings"}</span>
      </Link>
    </nav>
  );
}
