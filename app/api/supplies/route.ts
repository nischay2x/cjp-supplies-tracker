import { NextRequest, NextResponse } from "next/server";

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

const SUBMISSION_COOLDOWN_MS = 60 * 60 * 1000;
const SUBMISSION_COOKIE_NAME = "supply_last_submitted_at";

export async function POST(request: NextRequest) {
  const now = Date.now();
  const lastSubmittedAtRaw = request.cookies.get(SUBMISSION_COOKIE_NAME)?.value;

  if (lastSubmittedAtRaw) {
    const lastSubmittedAt = Number(lastSubmittedAtRaw);

    if (Number.isFinite(lastSubmittedAt)) {
      const elapsedMs = now - lastSubmittedAt;

      if (elapsedMs < SUBMISSION_COOLDOWN_MS) {
        const remainingMs = SUBMISSION_COOLDOWN_MS - elapsedMs;
        const retryAfterSeconds = Math.ceil(remainingMs / 1000);
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

        return NextResponse.json(
          {
            error: `You can submit again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfterSeconds),
            },
          },
        );
      }
    }
  }

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

  if (typeof units !== "number" || !Number.isFinite(units) || units < 1 || units > 1000) {
    return NextResponse.json({ error: "Units must be between 1 and 1000." }, { status: 400 });
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

    const response = NextResponse.json(
      {
        message: "Supply submitted successfully.",
        data,
      },
      { status: 201 },
    );

    response.cookies.set({
      name: SUBMISSION_COOKIE_NAME,
      value: String(now),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(SUBMISSION_COOLDOWN_MS / 1000),
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to reach upstream API." },
      { status: 502 },
    );
  }
}
