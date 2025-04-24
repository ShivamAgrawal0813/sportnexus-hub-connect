import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";

export function MainLayout() {
  return (
    <div className="flex min-h-screen h-screen bg-background overflow-hidden">
      <Sidebar className="w-72 shrink-0" />
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
        <footer className="py-4 px-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SportNexus Hub. All rights reserved.
        </footer>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
