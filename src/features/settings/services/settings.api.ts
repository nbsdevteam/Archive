/**
 * Admin settings API (marquee duration).
 */

import { httpGet, httpRequest, type ApiResponse } from "@/shared/lib/http";

export interface MarqueeSettings {
  marquee_duration: number;
}

const MARQUEE_ENDPOINT = "/api/nbs/admin/settings/marquee";

function unwrapApiData<T>(res: ApiResponse<T>): T {
  if (res.success === false && res.error) {
    throw new Error(res.error);
  }
  return res.data as T;
}

/**
 * GET /api/nbs/admin/settings/marquee
 */
export async function getMarqueeSettings(): Promise<MarqueeSettings> {
  const res = await httpGet<ApiResponse<MarqueeSettings>>(MARQUEE_ENDPOINT);
  if (res && typeof res === "object" && "success" in res) {
    return unwrapApiData(res as ApiResponse<MarqueeSettings>);
  }
  return res as MarqueeSettings;
}

/**
 * POST /api/nbs/admin/settings/marquee
 */
export async function saveMarqueeSettings(
  marquee_duration: number,
): Promise<MarqueeSettings> {
  const res = await httpRequest<MarqueeSettings>(MARQUEE_ENDPOINT, {
    marquee_duration,
  });
  return unwrapApiData(res);
}
