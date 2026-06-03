import { NextResponse, type NextRequest } from "next/server";
import {
  createRouteHandlerClient,
  getRequestOrigin,
} from "@/utils/supabase/route-handler";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const oauthDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";
  const origin = getRequestOrigin(request, requestUrl.origin);
  const continueUrl = `${origin}/auth/continue?next=${encodeURIComponent(safeNext)}`;

  if (oauthError) {
    const reason = encodeURIComponent((oauthDescription || oauthError).slice(0, 120));
    return NextResponse.redirect(`${origin}/login?error=auth&reason=${reason}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth&reason=missing_code`);
  }

  const holder = {
    response: NextResponse.redirect(continueUrl),
    redirectUrl: continueUrl,
  };

  try {
    const supabase = createRouteHandlerClient(request, holder);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession:", error.message);
      const reason = encodeURIComponent(error.message.slice(0, 120));
      return NextResponse.redirect(`${origin}/login?error=auth&reason=${reason}`);
    }

    return holder.response;
  } catch (caught) {
    console.error("[auth/callback]", caught);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
}
