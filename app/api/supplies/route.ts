import { NextResponse } from "next/server";

type SupplyItem = "water" | "food" | "prepared_food" | "medical" | "other";

type CreateSupplyBody = {
  item?: string;
  units?: number;
  place?: string;
};

const SUPPLY_ITEMS = new Set<SupplyItem>([
  "water",
  "food",
  "prepared_food",
  "medical",
  "other",
]);

export async function POST(request: Request) {
  let body: CreateSupplyBody;

  try {
    body = (await request.json()) as CreateSupplyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const item = body.item;
  const units = body.units;
  const place = typeof body.place === "string" ? body.place.trim() : undefined;

  if (!item || !SUPPLY_ITEMS.has(item as SupplyItem)) {
    return NextResponse.json({ error: "Invalid item value." }, { status: 400 });
  }

  if (typeof units !== "number" || !Number.isFinite(units) || units <= 0) {
    return NextResponse.json({ error: "Units must be a positive number." }, { status: 400 });
  }

  const baseUrl = process.env.API_BASE;
  const apiKey = process.env.API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "Server API configuration is missing." }, { status: 500 });
  }

  const payload: { item: SupplyItem; units: number; place?: string } = {
    item: item as SupplyItem,
    units,
  };

  if (place) {
    payload.place = place;
  }

  try {
    const upstreamResponse = await fetch(`${baseUrl}/supplies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await upstreamResponse.text();
    let data: unknown = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    const parsedData = data as { error?: string };

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: parsedData.error || "Upstream API rejected the request.",
        },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(
      {
        message: "Supply submitted successfully.",
        data,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to reach upstream API." },
      { status: 502 },
    );
  }
}
