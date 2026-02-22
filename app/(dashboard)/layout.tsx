import { Sidebar } from "@/components/layout/Sidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />

      <div className="flex w-full flex-col">
        <AppTopbar />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
