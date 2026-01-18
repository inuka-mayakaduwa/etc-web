import NextAuth from "next-auth";
import { authConfig } from "@/app/auth.config";
import createMiddleware from "next-intl/middleware";

const { auth } = NextAuth(authConfig);
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
    const { nextUrl } = req;
    const isAuthenticated = !!req.auth;

    // Check if it's an admin route
    // Pathname might be /en/admin or /admin (if default locale)
    // Regex to check for /admin segment possibly prefixed by locale
    const isAdminRoute = /\/(?:[a-z]{2}\/)?admin/.test(nextUrl.pathname);
    const isLoginPage = /\/(?:[a-z]{2}\/)?admin\/login/.test(nextUrl.pathname);

    if (isAdminRoute && !isLoginPage) {
        if (!isAuthenticated) {
            // Redirect to login, preserving locale if present or defaulting
            // Simple approach: construct login URL
            // We can let intlMiddleware handle locale implication if we redirect to /admin/login ? 
            // Or cleaner: next-auth handles unauth -> signin page if configured?
            // But we are inside the middleware callback.

            // If simply returning, next-auth might not redirect automatically unless configured in 'authorized' callback?
            // But here we are in the main middleware wrapper.

            // Just redirect to login
            const locale = nextUrl.pathname.split('/')[1] || 'en'; // naive locale extraction
            // Check if first segment is a locale from routing.locales? 
            // For now assume standard structure.

            // Better: let's rely on constructing URL
            const loginUrl = new URL(nextUrl.pathname.replace(/\/admin(\/.*)?$/, "/login"), nextUrl.origin);
            // If path didn't have locale, logic might be complex. 
            // Simplest: Redirect to /admin/login (relative) and let intl middleware handle locale ? 
            // But we return Response.

            // Let's explicitly redirect to a relative path that intl middleware would handle?
            // Actually, returning NextResponse.redirect works.

            // However, we want to respect locale. 
            // If user visits /sinhala/admin -> /sinhala/admin/login.

            // Logic:
            // If not authenticated, redirect to login page matching current locale
            // If the path already has a locale, keep it.
            // If not, Next-Intl might define default.

            // Let's perform a simple check.
            return NextResponse.redirect(new URL("/admin/login", nextUrl.origin));
        }
    }

    if (isLoginPage && isAuthenticated) {
        // If already logged in, redirect to dashboard
        return NextResponse.redirect(new URL("/admin", nextUrl.origin));
    }

    return intlMiddleware(req);
});

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

