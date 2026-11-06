import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { getDashboardStats, getFeatureSettings, getUnreadCounts } from "@/lib/data/admin";
import { getStaffNames } from "@/lib/data/consultations";
import { AdminSidebar, AdminSidebarFallback } from "@/components/admin/admin-sidebar";
import { AdminAlerts } from "@/components/admin/admin-alerts";

async function SidebarWithData() {
  const profile = await requireStaff();
  const [stats, features, unread, staffNames] = await Promise.all([
    getDashboardStats().catch(() => null),
    getFeatureSettings(),
    getUnreadCounts().catch(() => ({})),
    getStaffNames(),
  ]);
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0);
  return (
    <>
      <AdminAlerts userId={profile.id} staffIds={Object.keys(staffNames)} soundEnabled={features.alertSound} />
      <AdminSidebar
        name={profile.full_name}
        email={profile.email}
        role={profile.role}
        counts={
          stats
            ? {
                needsReview: stats.needs_review,
                consultsToday: stats.consults_today,
                unread: features.unreadBadges ? unreadTotal : 0,
                lowStock: stats.low_stock + stats.out_of_stock,
              }
            : undefined
        }
      />
    </>
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
