import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <div className="flex-1 mr-64">
        <Topbar />
        <main className="pt-16 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
