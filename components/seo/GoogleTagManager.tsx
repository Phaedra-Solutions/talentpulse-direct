// components/seo/GoogleTagManager.tsx
import React from 'react';

interface GoogleTagManagerProps {
  gtmId?: string;
  isEnabled?: boolean;
}

/**
 * Sanitizes and validates the GTM container ID (format: GTM-XXXXXXX)
 */
function sanitizeGtmId(id?: string): string | null {
  if (!id) return null;
  const trimmed = id.trim();
  // Validates standard GTM ID characters (alphanumeric + hyphen)
  if (/^GTM-[A-Z0-9]+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return null;
}

/**
 * Google Tag Manager script to be included in the document <head>
 */
export function GoogleTagManagerHead({ gtmId, isEnabled = true }: GoogleTagManagerProps) {
  if (!isEnabled) return null;
  const cleanId = sanitizeGtmId(gtmId);
  if (!cleanId) return null;

  const scriptContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${cleanId}');`;

  return (
    <script
      id="gtm-script"
      dangerouslySetInnerHTML={{
        __html: scriptContent,
      }}
    />
  );
}

/**
 * Google Tag Manager (noscript) iframe to be included immediately after the opening <body> tag
 */
export function GoogleTagManagerBody({ gtmId, isEnabled = true }: GoogleTagManagerProps) {
  if (!isEnabled) return null;
  const cleanId = sanitizeGtmId(gtmId);
  if (!cleanId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${cleanId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
