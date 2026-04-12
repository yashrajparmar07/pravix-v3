import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CACHE_WINDOW_MS = 60 * 1000;
const CACHE_CONTROL_VALUE = "public, s-maxage=60, stale-while-revalidate=30";
const YAHOO_QUOTES_URL =
  "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5ENSEI,%5ENSEBANK,%5EBSESN";

type MarketIndicatorId = "NIFTY50" | "BANKNIFTY" | "SENSEX";
type MarketTrend = "up" | "down" | "flat";

type MarketIndicator = {
  id: MarketIndicatorId;
  displayName: string;
  value: number;
  changeAbs: number;
  changePct: number;
  trend: MarketTrend;
};

type YahooQuote = {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
};

type YahooQuotePayload = {
  quoteResponse?: {
    result?: YahooQuote[];
  };
};

type MarketIndicatorsResponse = {
  ok: true;
  generatedAt: string;
  source: "live" | "fallback";
  indices: MarketIndicator[];
};

type CachedMarketIndicators = {
  payload: MarketIndicatorsResponse;
  expiresAt: number;
};

const symbolConfig: Array<{ symbol: string; id: MarketIndicatorId; displayName: string }> = [
  { symbol: "^NSEI", id: "NIFTY50", displayName: "NIFTY 50" },
  { symbol: "^NSEBANK", id: "BANKNIFTY", displayName: "BANK NIFTY" },
  { symbol: "^BSESN", id: "SENSEX", displayName: "SENSEX" },
];

const fallbackById: Record<MarketIndicatorId, MarketIndicator> = {
  NIFTY50: {
    id: "NIFTY50",
    displayName: "NIFTY 50",
    value: 22480.15,
    changeAbs: 115.2,
    changePct: 0.51,
    trend: "up",
  },
  BANKNIFTY: {
    id: "BANKNIFTY",
    displayName: "BANK NIFTY",
    value: 47820.7,
    changeAbs: 210.45,
    changePct: 0.44,
    trend: "up",
  },
  SENSEX: {
    id: "SENSEX",
    displayName: "SENSEX",
    value: 73980.4,
    changeAbs: 355.65,
    changePct: 0.48,
    trend: "up",
  },
};

let cachedMarketIndicators: CachedMarketIndicators | null = null;
let inFlightRefresh: Promise<MarketIndicatorsResponse> | null = null;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toTrend(changePct: number): MarketTrend {
  if (changePct > 0) {
    return "up";
  }

  if (changePct < 0) {
    return "down";
  }

  return "flat";
}

async function fetchLiveIndicators(): Promise<MarketIndicator[] | null> {
  const response = await fetch(YAHOO_QUOTES_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance API failed: ${response.status}`);
  }

  const payload = (await response.json()) as YahooQuotePayload;
  const quotes = payload.quoteResponse?.result ?? [];
  const quoteMap = new Map<string, YahooQuote>();

  for (const quote of quotes) {
    if (typeof quote.symbol === "string") {
      quoteMap.set(quote.symbol, quote);
    }
  }

  const indicators: MarketIndicator[] = [];

  for (const config of symbolConfig) {
    const quote = quoteMap.get(config.symbol);

    const value = toFiniteNumber(quote?.regularMarketPrice);
    const changeAbs = toFiniteNumber(quote?.regularMarketChange);
    const changePct = toFiniteNumber(quote?.regularMarketChangePercent);

    if (value === null || changeAbs === null || changePct === null) {
      return null;
    }

    indicators.push({
      id: config.id,
      displayName: config.displayName,
      value: round(value, 2),
      changeAbs: round(changeAbs, 2),
      changePct: round(changePct, 2),
      trend: toTrend(changePct),
    });
  }

  return indicators;
}

async function buildMarketIndicatorsResponse(): Promise<MarketIndicatorsResponse> {
  let source: "live" | "fallback" = "fallback";
  let indices: MarketIndicator[] = symbolConfig.map((config) => fallbackById[config.id]);

  try {
    const live = await fetchLiveIndicators();
    if (live && live.length === symbolConfig.length) {
      indices = live;
      source = "live";
    }
  } catch {
    source = "fallback";
  }

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    source,
    indices,
  };
}

export async function GET() {
  const now = Date.now();

  if (cachedMarketIndicators && cachedMarketIndicators.expiresAt > now) {
    return NextResponse.json(cachedMarketIndicators.payload, {
      status: 200,
      headers: {
        "Cache-Control": CACHE_CONTROL_VALUE,
      },
    });
  }

  if (!inFlightRefresh) {
    inFlightRefresh = buildMarketIndicatorsResponse().finally(() => {
      inFlightRefresh = null;
    });
  }

  const payload = await inFlightRefresh;

  cachedMarketIndicators = {
    payload,
    expiresAt: Date.now() + CACHE_WINDOW_MS,
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": CACHE_CONTROL_VALUE,
    },
  });
}
