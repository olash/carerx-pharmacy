import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/admin";
import { AdminSidebar, AdminSidebarFallback } from "@/components/admin/admin-sidebar";

async function SidebarWithData() {
  const profile = await requireStaff();
  const stats = await getDashboardStats().catch(() => null);
  return (
    <AdminSidebar
      name={profile.full_name}
      email={profile.email}
      role={profile.role}
      counts={stats ? { needsReview: stats.needs_review, consultsToday: stats.consults_today, lowStock: stats.low_stock + stats.out_of_stock } : undefined}
    />
  );
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <Suspense fallback={<AdminSidebarFallback />}>
        <SidebarWithData />
      </Suspense>
      <main className="lg:pl-[280px]">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}
