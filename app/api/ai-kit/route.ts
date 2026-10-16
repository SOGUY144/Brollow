import { NextResponse } from "next/server";
import { extractBudgetSatang, generateSmartKit, type SmartKitResult } from "@/lib/domain/ai-kit";
import type { ItemSummary } from "@/lib/types";

interface AiKitRequest {
  prompt?: string;
  items?: ItemSummary[];
}

interface GptKitResponse {
  kitName?: string;
  description?: string;
  targetBudgetBaht?: number | null;
  selectedItemIds?: string[];
  reasons?: string[];
}

export async function POST(req: Request) {
  let prompt = "Solo outdoor vlog / YouTube video, budget ฿2,500";
  let items: ItemSummary[] = [];

  try {
    const body = (await req.json()) as AiKitRequest;
    if (typeof body.prompt === "string" && body.prompt.trim()) {
      prompt = body.prompt.trim();
    }
    if (Array.isArray(body.items)) {
      items = body.items;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const fallback = () => NextResponse.json(generateSmartKit(prompt, items));

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || items.length === 0) {
    return fallback();
  }

  try {
    const catalogContext = items.slice(0, 60).map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      dailyPriceBaht: Math.round(item.dailyPriceSatang / 100),
      location: item.location,
    }));

    const systemPrompt = `You are Brollow AI, an expert equipment rental curator for a peer-to-peer rental marketplace.
Given a user's project description/query and the available catalog of rental items, select a cohesive bundle of 2 to 4 items from the catalog that best serves the user's need and respects their budget if mentioned.

Rules:
1. Respond in the SAME language as the user's prompt (if the user writes in Thai, write kitName, description, and reasons in natural Thai; if English, write in English).
2. ONLY pick item IDs that exist in the provided catalog.
3. Try to keep the total daily price within the user's target budget if possible.
4. Return valid JSON matching this schema:
{
  "kitName": "string",
  "description": "string",
  "targetBudgetBaht": number | null,
  "selectedItemIds": ["id1", "id2"],
  "reasons": ["reason 1", "reason 2", "reason 3"]
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              userPrompt: prompt,
              availableCatalog: catalogContext,
            }),
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!openAiRes.ok) {
      return fallback();
    }

    const data = await openAiRes.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return fallback();
    }

    const parsed = JSON.parse(content) as GptKitResponse;
    const itemMap = new Map(items.map((i) => [i.id, i]));
    const selectedItems = (parsed.selectedItemIds ?? [])
      .map((id) => itemMap.get(id))
      .filter((i): i is ItemSummary => Boolean(i))
      .slice(0, 4);

    if (selectedItems.length === 0) {
      return fallback();
    }

    const totalDailyPriceSatang = selectedItems.reduce((sum, i) => sum + i.dailyPriceSatang, 0);
    const parsedBudgetFromText = extractBudgetSatang(prompt);
    const gptBudgetSatang =
      typeof parsed.targetBudgetBaht === "number" && parsed.targetBudgetBaht > 0
        ? Math.round(parsed.targetBudgetBaht * 100)
        : null;
    const targetBudgetSatang = parsedBudgetFromText ?? gptBudgetSatang;
    const withinBudget =
      targetBudgetSatang !== null ? totalDailyPriceSatang <= targetBudgetSatang : true;

    const result: SmartKitResult = {
      kitName: parsed.kitName?.trim() || "Custom Equipment Kit",
      description:
        parsed.description?.trim() ||
        "Curated equipment bundle tailored to your project requirements.",
      targetBudgetSatang,
      totalDailyPriceSatang,
      withinBudget,
      items: selectedItems,
      reasons:
        Array.isArray(parsed.reasons) && parsed.reasons.length > 0
          ? parsed.reasons.slice(0, 4)
          : ["Selected to match your project needs and equipment compatibility."],
    };

    return NextResponse.json(result);
  } catch {
    return fallback();
  }
}
