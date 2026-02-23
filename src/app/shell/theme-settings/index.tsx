import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Settings, X, Palette } from "lucide-react";
import { ColorPicker, type ColorPickerChangeMeta } from "../../../shared/components/ui";
import { useLayoutStore } from "../../../shared/stores/layoutStore";
import { useThemeColorStore } from "../../../shared/stores/themeColorStore";

/** Theme customizer: layout, colors, and primary color picker. Uses Lucide icons (Settings, X, Palette). */
const ThemeSettings = () => {
  const { t } = useTranslation();
  const { layout, setLayout } = useLayoutStore();
  const { color, customColor, setColor, setCustomColor } = useThemeColorStore();

  const handlePickerChange = (_rgbCss: string, meta: ColorPickerChangeMeta) => {
    setCustomColor(meta.rgbTriplet);
    setColor("all");
  };

  const handleSetLayoutDefault = () => setLayout("default");
  const handleSetLayoutModern = () => setLayout("modern");
  const handleSetColorCreamy = () => setColor("creamy");
  const handleSetColorPrimary = () => setColor("primary");
  const handleSetColorBrightblue = () => setColor("brightblue");
  const handleSetColorLunargreen = () => setColor("lunargreen");
  const handleSetColorLavendar = () => setColor("lavendar");
  const handleSetColorMagenta = () => setColor("magenta");
  const handleSetColorChromeyellow = () => setColor("chromeyellow");
  const handleSetColorLavared = () => setColor("lavared");
  const handleSetColorAll = () => setColor("all");

  return (
    <>
      <div className="sidebar-contact">
        <div
          className="toggle-theme"
          data-bs-toggle="offcanvas"
          data-bs-target="#theme-setting"
          role="button"
          tabIndex={0}
          aria-label={t("app.openThemeSettings")}
        >
          <Settings className="theme-settings-cog icon-spin" size={20} aria-hidden />
        </div>
      </div>

      <div
        className="sidebar-themesettings offcanvas offcanvas-end"
        id="theme-setting"
      >
        <div className="offcanvas-header d-flex align-items-center justify-content-between bg-dark">
          <div>
            <h3 className="mb-1 text-white">{t("app.themeCustomizer")}</h3>
            <p className="text-light">{t("app.chooseLayout")}</p>
          </div>
          <Link
            to="#"
            className="custom-btn-close d-flex align-items-center justify-content-center text-white"
            data-bs-dismiss="offcanvas"
            aria-label={t("app.closeThemeSettings")}
          >
            <X size={24} aria-hidden />
          </Link>
        </div>

        <div className="themesettings-inner offcanvas-body">
          <div
            className="accordion accordion-customicon1 accordions-items-seperate"
            id="settingtheme"
          >
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#layoutsetting"
                  aria-expanded="true"
                  aria-controls="layoutsetting"
                >
                  {t("app.chooseLayout")}
                </button>
              </h2>
              <div
                id="layoutsetting"
                className="accordion-collapse collapse show"
              >
                <div className="accordion-body">
                  <div className="row gx-3">
                    <div className="col-6">
                      <div className="theme-layout mb-3">
                        <input
                          type="radio"
                          name="LayoutTheme"
                          id="defaultLayout"
                          checked={layout === "default"}
                          onChange={handleSetLayoutDefault}
                        />
                        <label htmlFor="defaultLayout">
                          <span className="layout-type">
                            {t("app.layoutDefault")}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="theme-layout mb-3">
                        <input
                          type="radio"
                          name="LayoutTheme"
                          id="modernLayout"
                          checked={layout === "modern"}
                          onChange={handleSetLayoutModern}
                        />
                        <label htmlFor="modernLayout">
                          <span className="layout-type">
                            {t("app.layoutModern")}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#colorsetting"
                  aria-expanded="true"
                  aria-controls="colorsetting"
                >
                  Theme Colors
                </button>
              </h2>
              <div
                id="colorsetting"
                className="accordion-collapse collapse show"
              >
                <div className="accordion-body pb-2">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="creamyColor"
                        value="creamy"
                        checked={color === "creamy"}
                        onChange={handleSetColorCreamy}
                      />
                      <label htmlFor="creamyColor" className="creamy-clr" />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="primaryColor"
                        value="primary"
                        checked={color === "primary"}
                        onChange={handleSetColorPrimary}
                      />
                      <label htmlFor="primaryColor" className="primary-clr" />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="brightblueColor"
                        value="brightblue"
                        checked={color === "brightblue"}
                        onChange={handleSetColorBrightblue}
                      />
                      <label
                        htmlFor="brightblueColor"
                        className="brightblue-clr"
                      />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="lunargreenColor"
                        value="lunargreen"
                        checked={color === "lunargreen"}
                        onChange={handleSetColorLunargreen}
                      />
                      <label
                        htmlFor="lunargreenColor"
                        className="lunargreen-clr"
                      />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="lavendarColor"
                        value="lavendar"
                        checked={color === "lavendar"}
                        onChange={handleSetColorLavendar}
                      />
                      <label htmlFor="lavendarColor" className="lavendar-clr" />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="magentaColor"
                        value="magenta"
                        checked={color === "magenta"}
                        onChange={handleSetColorMagenta}
                      />
                      <label htmlFor="magentaColor" className="magenta-clr" />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="chromeyellowColor"
                        value="chromeyellow"
                        checked={color === "chromeyellow"}
                        onChange={handleSetColorChromeyellow}
                      />
                      <label
                        htmlFor="chromeyellowColor"
                        className="chromeyellow-clr"
                      />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="lavaredColor"
                        value="lavared"
                        checked={color === "lavared"}
                        onChange={handleSetColorLavared}
                      />
                      <label htmlFor="lavaredColor" className="lavared-clr" />
                    </div>
                    <div
                      className={`theme-colorselect select-theme-color position-relative mb-2 ${
                        color === "all" ? "active" : ""
                      }`}
                      onClick={handleSetColorAll}
                    >
                      <div className="select-color position-absolute">
                        <Palette size={20} />
                      </div>
                      <ColorPicker
                        value={customColor || undefined}
                        onChange={handlePickerChange}
                        ariaLabel={t("app.chooseThemeColor", {
                          defaultValue: "Choose theme color",
                        })}
                        className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThemeSettings;
