import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { RequestDrawer } from "@/components/site/request-drawer";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
      <RequestDrawer />
    </>
  );
}
