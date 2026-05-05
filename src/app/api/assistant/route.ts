import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing GOOGLE_AI_API_KEY environment variable." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a safe remote support assistant for technicians. Help troubleshoot customer computers using clear steps. Do not suggest stealth access, credential theft, permission bypassing, malware-like persistence, or hidden monitoring. Technician request: ${prompt}`
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Google AI request failed." }, { status: response.status });
  }

  const data = await response.json();
  const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No assistant response returned.";

  return NextResponse.json({ answer });
}
