import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, Menu, Calendar, Box, Video, User, LogOut, Shield, BookmarkCheck, Wallet, Tag } from "lucide-react";
import { NavItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/ThemeContext";

interface SidebarProps {
  className?: string;
}

const mainNavItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Venues",
    href: "/venues",
    icon: Calendar,
  },
  {
    title: "Equipment",
    href: "/equipment",
    icon: Box,
  },
  {
    title: "Tutorials",
    href: "/tutorials",
    icon: Video,
  },
  {
    title: "My Bookings",
    href: "/bookings",
    icon: BookmarkCheck,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Payments & Subscriptions",
    href: "/payment-settings",
    icon: Wallet,
  },
];

// Admin nav item
const adminNavItem: NavItem = {
  title: "Admin Dashboard",
  href: "/admin",
  icon: Shield,
};

// Admin nav items
const adminNavItems: NavItem[] = [
  adminNavItem,
  {
    title: "Discount Management",
    href: "/admin/discounts",
    icon: Tag,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
  // Create navigation items based on user role
  const navItems = isAdmin ? [...mainNavItems, ...adminNavItems] : mainNavItems;
  
  return (
    <>
      {/* Mobile Navigation - Hamburger Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0 w-80 sm:w-96 p-0">
          <MobileNav items={navItems} setOpen={setOpen} onLogout={handleLogout} userName={user?.name} />
        </SheetContent>
      </Sheet>
      
      {/* Desktop Navigation - Sidebar */}
      <div className={cn("hidden md:flex", className)}>
        <DesktopNav items={navItems} onLogout={handleLogout} userName={user?.name} />
      </div>
    </>
  );
}

interface MobileNavProps {
  items: NavItem[];
  setOpen: (open: boolean) => void;
  onLogout: () => void;
  userName?: string;
}

function MobileNav({ items, setOpen, onLogout, userName }: MobileNavProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary/10 to-background">
      <div className="flex h-16 items-center px-6 border-b bg-background/40 backdrop-blur-sm">
        <Link 
          to="/" 
          className="flex items-center gap-2" 
          onClick={() => setOpen(false)}
        >
          <span className="font-bold text-2xl text-primary">SportNexus</span>
          <span className="font-bold text-2xl">Hub</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-4">
          {items.map((item) => 
            item.disabled ? null : (
              <Link
                key={item.title}
                to={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 hover:bg-primary/10",
                  location.pathname === item.href 
                    ? "bg-primary/15 text-primary shadow-sm" 
                    : "text-foreground/80"
                )}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.title}
              </Link>
            )
          )}
        </div>
      </ScrollArea>
      
      {/* User information and logout */}
      <div className="border-t bg-background/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-medium">Dark Mode</span>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>
        {userName && (
          <div className="mb-3 text-base font-medium">
            <span className="text-muted-foreground">Signed in as:</span>
            <div className="text-foreground">{userName}</div>
          </div>
        )}
        <button
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-base font-medium text-red-500 hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

interface DesktopNavProps {
  items: NavItem[];
  onLogout: () => void;
  userName?: string;
}

function DesktopNav({ items, onLogout, userName }: DesktopNavProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-primary/10 to-background border-r overflow-hidden">
      <div className="flex h-16 items-center px-6 border-b bg-background/40 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-bold text-2xl text-primary">SportNexus</span>
          <span className="font-bold text-2xl">Hub</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid gap-1 p-4">
          {items.map((item) =>
            item.disabled ? null : (
              <Link
                key={item.title}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 hover:bg-primary/10",
                  location.pathname === item.href 
                    ? "bg-primary/15 text-primary shadow-sm" 
                    : "text-foreground/80"
                )}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.title}
              </Link>
            )
          )}
        </nav>
      </ScrollArea>
      
      {/* User information and logout */}
      <div className="border-t bg-background/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-medium">Dark Mode</span>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>
        {userName && (
          <div className="mb-3 text-base font-medium">
            <span className="text-muted-foreground">Signed in as:</span>
            <div className="text-foreground">{userName}</div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-base font-medium text-red-500 hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
