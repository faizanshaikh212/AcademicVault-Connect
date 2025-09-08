import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const CookieSettingsModal: React.FC = () => {
  const { cookieSettings, setCookieSettings, cookieModalOpen, setCookieModalOpen } = useAuth();
  const [local, setLocal] = useState({ preferences: false, analytics: false, marketing: false });

  useEffect(() => {
    if (cookieSettings) {
      setLocal({
        preferences: cookieSettings.preferences,
        analytics: cookieSettings.analytics,
        marketing: cookieSettings.marketing,
      });
    }
  }, [cookieSettings]);

  if (!cookieModalOpen) return null;

  const save = () => {
    setCookieSettings({ necessary: true, ...local } as any);
    setCookieModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Cookie Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Necessary cookies are required for the site to function. Toggle other
          categories to control what you allow.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Preferences</div>
              <div className="text-sm text-gray-600">Remember choices and UI settings.</div>
            </div>
            <input
              type="checkbox"
              checked={local.preferences}
              onChange={(e) => setLocal((s) => ({ ...s, preferences: e.target.checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Analytics</div>
              <div className="text-sm text-gray-600">Usage data to help us improve the site.</div>
            </div>
            <input
              type="checkbox"
              checked={local.analytics}
              onChange={(e) => setLocal((s) => ({ ...s, analytics: e.target.checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Marketing</div>
              <div className="text-sm text-gray-600">Personalized content and promotions.</div>
            </div>
            <input
              type="checkbox"
              checked={local.marketing}
              onChange={(e) => setLocal((s) => ({ ...s, marketing: e.target.checked }))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setCookieModalOpen(false)} className="px-3 py-2 rounded border">Cancel</button>
          <button onClick={save} className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
        </div>
      </div>
    </div>
  );
};

export default CookieSettingsModal;
