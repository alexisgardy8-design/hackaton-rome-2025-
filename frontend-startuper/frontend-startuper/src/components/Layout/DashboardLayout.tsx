import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-gradient-dark">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto p-6 lg:p-8 max-w-7xl animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
