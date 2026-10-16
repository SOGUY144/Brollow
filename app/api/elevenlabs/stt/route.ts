import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const incomingForm = await req.formData();
    const audioFile = incomingForm.get("file");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const upstreamForm = new FormData();
    upstreamForm.append("model_id", "scribe_v1");
    upstreamForm.append("file", audioFile, "recording.webm");

    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: upstreamForm,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "ElevenLabs STT failed");
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: (data.text ?? "").trim() });
  } catch {
    return NextResponse.json({ error: "Failed to transcribe speech with ElevenLabs" }, { status: 500 });
  }
}
