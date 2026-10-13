import type { NextRequest } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";
import {
  DisneyApiError,
  checkSkuCached,
  checkSkusCached,
  extractSkus,
  querySchema,
} from "@/lib/disney";

/**
 * GET /api/check?sku=<JAN|URL> — single product report.
 * GET /api/check?skus=<JAN|URL …> — compare up to N reports ({ results }).
 *
 * This handler is a same-origin proxy: Disney's API sends no
 * `Access-Control-Allow-Origin` header, so browsers cannot call it directly.
 * Request data keeps this handler live; freshness across identical SKUs is
 * handled by the short TTL read-through cache in `@/lib/disney` instead.
 */
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const list = (hits.get(ip) ?? []).filter((t) => t > windowStart);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 10_000) hits.clear();
  return list.length > config.rateLimitPerMinute;
}

function cors(res: Response): Response {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return res;
}

function errorResponse(message: string, status: number, sku: string): Response {
  return cors(Response.json({ error: message, sku }, { status }));
}

export async function GET(request: NextRequest): Promise<Response> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    const res = errorResponse("リクエストが多すぎます。少し待って再試行してください。", 429, "");
    res.headers.set("Retry-After", "60");
    return res;
  }

  let query: z.infer<typeof querySchema>;
  try {
    query = querySchema.parse({
      sku: request.nextUrl.searchParams.get("sku") ?? undefined,
      skus: request.nextUrl.searchParams.get("skus") ?? undefined,
    });
  } catch {
    return errorResponse("不正なリクエストです。", 400, "");
  }

  const skus = extractSkus([query.skus ?? "", query.sku ?? ""].join(" "));
  if (skus.length === 0) {
    return errorResponse("sku パラメータが必要です (例: ?sku=4550586333055)", 400, "");
  }

  try {
    if (skus.length === 1) {
      return cors(Response.json(await checkSkuCached(skus[0])));
    }
    return cors(
      Response.json({
        results: await checkSkusCached(skus),
        fetchedAt: new Date().toISOString(),
      }),
    );
  } catch (e) {
    console.error(`GET /api/check failed for skus=${skus.join(",")}:`, e);
    if (e instanceof DisneyApiError) {
      return errorResponse(e.message, e.statusCode, skus[0] ?? "");
    }
    return errorResponse("取得に失敗しました。時間をおいて再試行してください。", 502, skus[0] ?? "");
  }
}
