import { NextRequest, NextResponse } from "next/server";
import { askAI, buildContext } from "@/services/gemini";

interface AIChatRequestBody {
  userMessage?: string;
  contextString?: string;
}

/** Returns a trimmed context string or builds one server-side when it is absent. */
async function resolveContextString(requestBody: AIChatRequestBody): Promise<string> {
  const providedContext = requestBody.contextString?.trim();
  if (providedContext) {
    return providedContext;
  }

  return buildContext();
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
    const contextString = await resolveContextString(requestBody);
    const reply = await askAI(userMessage, contextString, geminiApiKey);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Failed to generate AI response." }, { status: 500 });
  }
}
