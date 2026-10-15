import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import cookieIcon from "@/assets/cookie.svg";

const CookieBanner: React.FC = () => {
  const { cookieConsent, setCookieConsent, cookieSettings, setCookieSettings } =
    useAuth();

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [local, setLocal] = useState({
    preferences: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (cookieSettings) {
      setLocal({
        preferences: !!cookieSettings.preferences,
        analytics: !!cookieSettings.analytics,
        marketing: !!cookieSettings.marketing,
      });
    }
  }, [cookieSettings]);

  // Add a small bottom padding to the page body while the banner is visible so
  // it doesn't overlap site content. We add/remove a CSS class which is easy
  // to style from global CSS (keeps component styles small).
  useEffect(() => {
    const bodyClass = "has-cookie-banner";
    if (cookieConsent === null) {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList.remove(bodyClass);
    }
    return () => {
      document.body.classList.remove(bodyClass);
    };
  }, [cookieConsent]);

  const acceptAll = () => {
    setCookieConsent(true);
    setCookieSettings({ preferences: true, analytics: true, marketing: true });
  };

  const rejectAll = () => {
    setCookieConsent(false);
    setCookieSettings({
      preferences: false,
      analytics: false,
      marketing: false,
    });
  };

  const saveCustom = () => {
    setCookieConsent(true);
    setCookieSettings(local);
    setCustomizeOpen(false);
  };

  const cancelCustom = () => {
    setCustomizeOpen(false);
    if (cookieSettings) {
      setLocal({
        preferences: !!cookieSettings.preferences,
        analytics: !!cookieSettings.analytics,
        marketing: !!cookieSettings.marketing,
      });
    }
  };

  if (cookieConsent !== null) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[min(1100px,94%)]">
      <div className="mx-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-transform duration-300 ease-out transform-gpu">
        <div className="flex flex-col md:flex-row items-center gap-4 px-6 py-4 md:py-3">
          <div className="flex-shrink-0">
            {/* Removed background color so the cookie icon has no colored circle behind it.
                If you'd rather keep the rounded container but invisible, keep `rounded-full` and
                remove the bg-* classes as done here. */}
            <div className="w-12 h-12 flex items-center justify-center rounded-full">
              {/* Make the cookie icon occupy ~95% of the circular container */}
              <img
                src={cookieIcon}
                alt="cookie"
                className="w-[95%] h-[95%] object-contain"
                aria-hidden={false}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg">We value your privacy</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              We use cookies to enhance your browsing experience, serve
              personalized ads or content, and analyze our traffic. By clicking
              "Accept All", you consent to our use of cookies.
            </div>
            <div className="mt-2 text-xs">
              {/*
                Cookie Policy link: navigates to /privacy#cookie-section. If the user is
                already on /privacy, we smooth-scroll to the element with id="cookie-section".

                To change where it scrolls, edit `SCROLL_OFFSET` (pixels) or `TARGET_ID` below.
                You can also change the hash (`/privacy#cookie-section`) to match your route.
              */}
              <a
                href="/privacy#cookie-section"
                className="underline text-gray-600 dark:text-gray-300"
                onClick={(e) => {
                  // Config: change these if your privacy page uses a different id or you want a different offset
                  const TARGET_ID = "cookie-section"; // element id on /privacy to scroll to
                  const SCROLL_OFFSET = -80; // pixels to offset from top (negative moves up)

                  try {
                    if (typeof window !== "undefined") {
                      const path = window.location.pathname || "";
                      if (path === "/privacy") {
                        // already on the privacy page — intercept and smooth-scroll
                        e.preventDefault();
                        const el = document.getElementById(TARGET_ID);
                        if (el) {
                          const top =
                            el.getBoundingClientRect().top +
                            window.scrollY +
                            SCROLL_OFFSET;
                          window.scrollTo({ top, behavior: "smooth" });
                        } else {
                          // If element not found, fallback to setting the hash
                          window.location.hash = `#${TARGET_ID}`;
                        }
                      } else {
                        // Not on privacy page — allow navigation to the page with the hash.
                        // The privacy page should handle the hash on load.
                        // No need to preventDefault here; letting the href work is simplest.
                      }
                    }
                  } catch (err) {
                    // if anything fails, don't block the link
                    // eslint-disable-next-line no-console
                    console.warn("CookiePolicy scroll failed:", err);
                  }
                }}
              >
                Cookie Policy
              </a>
            </div>

            <div
              className={`mt-4 grid gap-3 ${
                customizeOpen ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : ""
              }`}
            >
              {customizeOpen && (
                <>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked disabled className="mt-1" />
                    <div>
                      <div className="font-medium">Strictly necessary</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Always active — required for site functionality.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={local.preferences}
                      onChange={(e) =>
                        setLocal((s) => ({
                          ...s,
                          preferences: e.target.checked,
                        }))
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">Preferences</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Remember your settings and UI preferences.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={local.analytics}
                      onChange={(e) =>
                        setLocal((s) => ({ ...s, analytics: e.target.checked }))
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">Analytics</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Help us improve by sending usage statistics.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={local.marketing}
                      onChange={(e) =>
                        setLocal((s) => ({ ...s, marketing: e.target.checked }))
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">Marketing</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Personalised content and promotions.
                      </div>
                    </div>
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col items-stretch gap-2 w-full md:w-auto">
            {!customizeOpen ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={acceptAll}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:scale-105 transform transition duration-150 ease-in-out shadow"
                >
                  Accept All
                </button>
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 hover:scale-105 transform transition duration-150 ease-in-out"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setCustomizeOpen(true)}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 hover:scale-105 transform transition duration-150 ease-in-out"
                >
                  Customize
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={saveCustom}
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:scale-105 transform transition duration-150 ease-in-out"
                >
                  Save
                </button>
                <button
                  onClick={cancelCustom}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 hover:scale-105 transform transition duration-150 ease-in-out"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
