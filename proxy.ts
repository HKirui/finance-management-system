import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { auth } = await import("@/auth");

  const session = await auth();

  if (!session?.user?.email) {
    const loginUrl = new URL("/login", request.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/accounts/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/clients/:path*",
    "/invoices/:path*",
  ],
};