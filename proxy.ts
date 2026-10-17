import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/pending",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/verify",
  "/privacy",
  "/terms",
  "/manifest.webmanifest",
  "/robots.txt",
  "/og",
];
const AUTH_ENTRY_ROUTES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthEntryRoute = AUTH_ENTRY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute && !isAuthEntryRoute && pathname !== "/pending") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = (target: string) => {
    // Never redirect a path to itself (prevents infinite redirect loops).
    if (target === pathname) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    return NextResponse.redirect(url);
  };

  // Unauthenticated users can only reach auth routes and the root.
  if (!user && !isPublicRoute && pathname !== "/") {
    return redirectTo("/login");
  }

  // Authenticated users: enforce profile approval + role rules.
  if (user && !isPublicRoute && pathname !== "/") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status, role")
      .eq("id", user.id)
      .single();

    if (profile?.status === "pending" || profile?.status === "rejected") {
      return redirectTo("/pending");
    }

    if (pathname.startsWith("/admin") && profile?.role !== "admin") {
      return redirectTo("/dashboard");
    }
  }

  // Approved users shouldn't sit on auth pages.
  if (user && isAuthEntryRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profile?.status === "approved") {
      return redirectTo("/dashboard");
    }
  }

  // Root landing is public for logged-out visitors; approved users go to the app.
  if (pathname === "/") {
    return user ? redirectTo("/dashboard") : supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
