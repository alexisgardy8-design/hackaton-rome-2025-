import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Users,
  DollarSign,
  Settings,
  Menu,
  X,
} from "lucide-react";
import logo from "@/assets/xrise-logo.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Create Campaign", url: "/create", icon: PlusCircle },
  { title: "My Campaigns", url: "/campaigns", icon: FolderOpen },
  { title: "Investors", url: "/investors", icon: Users },
  { title: "Dividends", url: "/dividends", icon: DollarSign },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed lg:sticky top-0 left-0 h-screen w-70 bg-card border-r border-border z-40 flex flex-col"
          >
            {/* Logo */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <img src={logo} alt="XRise" className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    XRise
                  </h1>
                  <p className="text-xs text-muted-foreground">Launchpad</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                  activeClassName="bg-primary/10 text-primary font-medium border border-primary/20"
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-glow-pulse" />
                  <span className="text-xs font-medium text-primary">
                    XRPL Testnet
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connected to XRP Ledger
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
