import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request and does a fast,
 * optimistic auth check for protected areas. Real authorization happens in the
 * Data Access Layer (src/lib/auth.ts) and in Postgres RLS.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    const [p, q] = path.split("?");
    url.pathname = p!;
    url.search = q ? `?${q}` : "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  const isAdminArea = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  if (isAdminArea) {
    if (!user) return redirectTo(`/admin/login?next=${encodeURIComponent(pathname + search)}`);
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || (profile.role !== "admin" && profile.role !== "pharmacist")) {
      return redirectTo("/admin/login?error=forbidden");
    }
  }

  if (!user && pathname.startsWith("/account")) {
    return redirectTo(`/login?next=${encodeURIComponent(pathname + search)}`);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
