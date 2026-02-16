import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const LINK_ID = "bootstrap-direction-css";

// Vite resolves these to asset URLs so we load LTR or RTL at runtime without loading both
import bootstrapLtrUrl from "bootstrap/dist/css/bootstrap.min.css?url";
import bootstrapRtlUrl from "bootstrap/dist/css/bootstrap.rtl.min.css?url";

/**
 * Injects or updates a single <link> in document head for Bootstrap LTR or RTL CSS
 * based on current i18n language. Prevents loading both styles and avoids conflicts.
 */
export function BootstrapDirectionStyles() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const href = i18n.language === "ar" ? bootstrapRtlUrl : bootstrapLtrUrl;
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      link.type = "text/css";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [i18n.language]);

  return null;
}
