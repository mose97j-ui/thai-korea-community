import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getRequestOrigin(request: NextRequest, fallbackOrigin: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return fallbackOrigin;
}

export type ResponseHolder = {
  response: NextResponse;
  redirectUrl: string;
};

/** Route Handler OAuth callback — cookies must be set on the redirect response. */
export function createRouteHandlerClient(
  request: NextRequest,
  holder: ResponseHolder
) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        holder.response = NextResponse.redirect(holder.redirectUrl);
        cookiesToSet.forEach(({ name, value, options }) => {
          holder.response.cookies.set(name, value, options);
        });
      },
    },
  });
}
