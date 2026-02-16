import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const LINK_ID = "bootstrap-direction-css";
const LTR_HREF = "/assets/css/bootstrap.min.css";
const RTL_HREF = "/assets/css/bootstrap.rtl.min.css";

/**
 * Updates the head Bootstrap link to LTR or RTL based on i18n language.
 * EN keeps LTR; only when user selects AR do we swap to RTL CSS.
 */
export function BootstrapDirectionSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) return;
    const href = i18n.language === "ar" ? RTL_HREF : LTR_HREF;
    if (link.href !== href && !link.href.endsWith(href)) {
      link.href = href;
    }
  }, [i18n.language]);

  return null;
}
