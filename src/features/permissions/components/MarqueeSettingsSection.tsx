import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Button } from "@/shared/components/ui";
import {
  getMarqueeSettings,
  saveMarqueeSettings,
} from "@/features/settings/services/settings.api";
import { useCapabilityPermissionsStore } from "@/shared/stores/capabilityPermissionsStore";

interface MarqueeSettingsSectionProps {
  disabled?: boolean;
}

/**
 * Admin section to load and save marquee scroll duration (seconds).
 */
export function MarqueeSettingsSection({ disabled = false }: MarqueeSettingsSectionProps) {
  const { t } = useTranslation();
  const [duration, setDuration] = useState(25);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const settings = await getMarqueeSettings();
        if (!cancelled && settings?.marquee_duration != null) {
          setDuration(settings.marquee_duration);
          useCapabilityPermissionsStore
            .getState()
            .setMarqueeDurationSeconds(settings.marquee_duration);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load marquee settings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveMarqueeSettings(duration);
      const seconds = saved.marquee_duration ?? duration;
      useCapabilityPermissionsStore.getState().setMarqueeDurationSeconds(seconds);
      toast.success(
        t("app.marqueeSettingsSaved", { defaultValue: "Marquee duration saved." }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [duration, t]);

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-0">
          {t("app.marqueeSettings", { defaultValue: "Expiry reminder marquee" })}
        </h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-warning mb-3" role="alert">
            {error}
          </div>
        )}
        <div className="row align-items-end g-3">
          <div className="col-md-4">
            <label className="form-label" htmlFor="marquee-duration">
              {t("app.marqueeDurationSeconds", {
                defaultValue: "Scroll duration (seconds)",
              })}
            </label>
            <input
              id="marquee-duration"
              type="number"
              min={5}
              max={120}
              className="form-control"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 25)}
              disabled={disabled || loading || saving}
              data-testid="marquee-duration-input"
            />
          </div>
          <div className="col-md-auto">
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={disabled || loading || saving}
              isLoading={saving}
              data-testid="marquee-duration-save"
            >
              {t("common.save", { defaultValue: "Save" })}
            </Button>
          </div>
        </div>
        <p className="text-muted small mb-0 mt-2">
          {t("app.marqueeSettingsHelp", {
            defaultValue:
              "Controls how long one full cycle of the expiry reminder marquee takes.",
          })}
        </p>
      </div>
    </div>
  );
}
