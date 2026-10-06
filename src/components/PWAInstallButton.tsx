import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { UILanguage } from '../types';
import { tr } from '../lib/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ lang?: UILanguage }> = ({
  lang = 'en',
}) => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
      >
        <Download className="h-3.5 w-3.5 text-[#0B2A6F]" />
        <span>
          {tr(lang, 'Install PWA', 'PWA ස්ථාපනය කරන්න', 'PWA நிறுவு')}
        </span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900">
              {tr(
                lang,
                'Install DisaLink AI for Offline Field Use',
                'Offline ක්ෂේත්‍ර භාවිතය සඳහා DisaLink AI ස්ථාපනය කරන්න',
                'ஆஃப்லைன் களப் பயன்பாட்டிற்கு DisaLink AI-ஐ நிறுவவும்'
              )}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {tr(
                lang,
                '1. Tap the Share button in your Safari toolbar. 2. Scroll down and tap Add to Home Screen.',
                '1. Safari මෙවලම් තීරුවේ Share බොත්තම ඔබන්න. 2. පහළට ගොස් Add to Home Screen තෝරන්න.',
                '1. Safari கருவிப்பட்டியில் Share பொத்தானைத் தட்டவும். 2. கீழே சென்று Add to Home Screen என்பதைத் தேர்ந்தெடுக்கவும்.'
              )}
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-md bg-[#0B2A6F] px-4 py-2 text-xs font-medium text-white hover:bg-[#082054]"
            >
              {tr(lang, 'Close', 'වසන්න', 'மூடு')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
