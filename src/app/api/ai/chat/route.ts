import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { askAI, buildContext } from "@/services/gemini";
import { createSupabaseServerClient } from "@/services/supabase";

interface AIChatRequestBody {
  userMessage?: string;
  contextString?: string;
}

/** Returns a trimmed context string or builds one server-side when it is absent. */
async function resolveContextString(
  requestBody: AIChatRequestBody,
  supabaseClient: SupabaseClient,
): Promise<string> {
  const providedContext = requestBody.contextString?.trim();
  if (providedContext) {
    return providedContext;
  }

  return buildContext(supabaseClient);
}

/** Returns the bearer token from the incoming request headers or null when absent. */
function getAccessToken(request: NextRequest): string | null {
  const authorizationHeader = request.headers.get("authorization");
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

/** Handles secure server-side Gemini chat requests and returns the AI reply payload. */
export async function POST(request: NextRequest) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey || geminiApiKey === "your_gemini_api_key_here") {
    return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
  }

  const requestBody = (await request.json()) as AIChatRequestBody;
  const userMessage = requestBody.userMessage?.trim();
  if (!userMessage) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const supabaseClient = createSupabaseServerClient(accessToken);
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const contextString = await resolveContextString(requestBody, supabaseClient);
    const reply = await askAI(userMessage, contextString, geminiApiKey);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Failed to generate AI response." }, { status: 500 });
  }
}
