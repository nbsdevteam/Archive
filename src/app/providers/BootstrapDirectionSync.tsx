import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const LINK_ID = "bootstrap-direction-css";
const LTR_HREF = "/assets/css/bootstrap.min.css";
const RTL_HREF = "/assets/css/bootstrap.rtl.min.css";

/** True when current language is Arabic (handles ar, ar-SA, etc.). */
function isArabic(i18n: { language: string; resolvedLanguage?: string }): boolean {
  const lng = i18n.resolvedLanguage ?? i18n.language;
  return typeof lng === "string" && lng.startsWith("ar");
}

/**
 * Updates the head Bootstrap link to LTR or RTL based on i18n language.
 * EN keeps LTR; only when user selects AR do we swap to RTL CSS.
 */
export function BootstrapDirectionSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) return;
    const href = isArabic(i18n) ? RTL_HREF : LTR_HREF;
    if (link.href !== href && !link.href.endsWith(href)) {
      link.href = href;
    }
  }, [i18n.language, i18n.resolvedLanguage]);

  return null;
}
