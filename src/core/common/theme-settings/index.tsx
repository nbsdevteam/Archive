import { useEffect, useState } from "react";
import { ColorPicker } from "antd";
import type { ColorPickerProps, GetProp } from "antd";
import { Link } from "react-router-dom";
import { useLayoutStore } from "../../../shared/stores/layoutStore";
import { useThemeColorStore } from "../../../shared/stores/themeColorStore";

type Color = Extract<GetProp<ColorPickerProps, "value">, string | { cleared: any }>;

const ThemeSettings = () => {
  const { layout, setLayout } = useLayoutStore();
  const { color, customColor, setColor, setCustomColor } = useThemeColorStore();
  const [pickerValue, setPickerValue] = useState<Color>(
    customColor ? `rgb(${customColor})` : ""
  );

  useEffect(() => {
    setPickerValue(customColor ? `rgb(${customColor})` : "");
  }, [customColor]);

  const handlePickerChange = (value: Color) => {
    setPickerValue(value);
    const rgbString =
      typeof value === "string" ? value : value?.toRgbString?.();
    if (!rgbString) return;
    const normalized = rgbString.replace(/rgb\(|\)/g, "").trim();
    if (normalized) {
      setCustomColor(normalized);
      setColor("all");
    }
  };

  return (
    <>
      <div className="sidebar-contact">
        <div
          className="toggle-theme"
          data-bs-toggle="offcanvas"
          data-bs-target="#theme-setting"
        >
          <i className="fa fa-cog fa-w-16 fa-spin" />
        </div>
      </div>

      <div
        className="sidebar-themesettings offcanvas offcanvas-end"
        id="theme-setting"
      >
        <div className="offcanvas-header d-flex align-items-center justify-content-between bg-dark">
          <div>
            <h3 className="mb-1 text-white">Theme Customizer</h3>
            <p className="text-light">Choose your layout</p>
          </div>
          <Link
            to="#"
            className="custom-btn-close d-flex align-items-center justify-content-center text-white"
            data-bs-dismiss="offcanvas"
          >
            <i className="ti ti-x" />
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
                  Select Layouts
                </button>
              </h2>
              <div id="layoutsetting" className="accordion-collapse collapse show">
                <div className="accordion-body">
                  <div className="row gx-3">
                    <div className="col-6">
                      <div className="theme-layout mb-3">
                        <input
                          type="radio"
                          name="LayoutTheme"
                          id="defaultLayout"
                          checked={layout === "default"}
                          onChange={() => setLayout("default")}
                        />
                        <label htmlFor="defaultLayout">
                          <span className="layout-type">Default</span>
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
                          onChange={() => setLayout("modern")}
                        />
                        <label htmlFor="modernLayout">
                          <span className="layout-type">Modern</span>
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
              <div id="colorsetting" className="accordion-collapse collapse show">
                <div className="accordion-body pb-2">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="creamyColor"
                        value="creamy"
                        checked={color === "creamy"}
                        onChange={() => setColor("creamy")}
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
                        onChange={() => setColor("primary")}
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
                        onChange={() => setColor("brightblue")}
                      />
                      <label htmlFor="brightblueColor" className="brightblue-clr" />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="lunargreenColor"
                        value="lunargreen"
                        checked={color === "lunargreen"}
                        onChange={() => setColor("lunargreen")}
                      />
                      <label htmlFor="lunargreenColor" className="lunargreen-clr" />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="lavendarColor"
                        value="lavendar"
                        checked={color === "lavendar"}
                        onChange={() => setColor("lavendar")}
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
                        onChange={() => setColor("magenta")}
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
                        onChange={() => setColor("chromeyellow")}
                      />
                      <label htmlFor="chromeyellowColor" className="chromeyellow-clr" />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="themeColor"
                        id="lavaredColor"
                        value="lavared"
                        checked={color === "lavared"}
                        onChange={() => setColor("lavared")}
                      />
                      <label htmlFor="lavaredColor" className="lavared-clr" />
                    </div>
                    <div
                      className={`theme-colorselect select-theme-color position-relative mb-2 ${
                        color === "all" ? "active" : ""
                      }`}
                      onClick={() => setColor("all")}
                    >
                      <div className="select-color position-absolute">
                        <i className="ti ti-palette" />
                      </div>
                      <ColorPicker value={pickerValue} onChange={handlePickerChange} />
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
