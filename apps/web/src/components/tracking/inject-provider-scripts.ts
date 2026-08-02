import type { PublicTrackingProvider } from '@mijersey/sdk';

const INJECTED_ATTRIBUTE = 'data-mijersey-tracking-provider';

/** Inyección diferida de scripts (033 §8 "carga diferida de scripts") — solo se llama una vez el visitante otorgó la categoría de consentimiento del proveedor (o el proveedor no requiere consentimiento). Cada snippet es el fragmento estándar publicado por el propio proveedor (Measurement Protocol/GTM/Meta Pixel/TikTok Pixel), sin variaciones propias. */
export function injectTrackingScript(provider: PublicTrackingProvider): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`[${INJECTED_ATTRIBUTE}="${provider.id}"]`)) return;

  const script = buildScript(provider);
  if (!script) return;

  script.setAttribute(INJECTED_ATTRIBUTE, provider.id);
  document.head.appendChild(script);
}

function buildScript(provider: PublicTrackingProvider): HTMLScriptElement | null {
  switch (provider.provider) {
    case 'GOOGLE_ANALYTICS_4': {
      const measurementId = provider.configuration.measurementId;
      if (typeof measurementId !== 'string') return null;
      return inlineScript(`
        var s=document.createElement('script');s.async=true;
        s.src='https://www.googletagmanager.com/gtag/js?id=${measurementId}';
        document.head.appendChild(s);
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());
        gtag('config','${measurementId}');
      `);
    }
    case 'GOOGLE_TAG_MANAGER': {
      const containerId = provider.configuration.containerId;
      if (typeof containerId !== 'string') return null;
      return inlineScript(`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${containerId}');
      `);
    }
    case 'META_PIXEL': {
      const pixelId = provider.configuration.pixelId;
      if (typeof pixelId !== 'string') return null;
      return inlineScript(`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${pixelId}');
        fbq('track','PageView');
      `);
    }
    case 'TIKTOK_PIXEL': {
      const pixelId = provider.configuration.pixelId;
      if (typeof pixelId !== 'string') return null;
      return inlineScript(`
        !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
        ttq.methods=["page","track","identify"];
        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
        for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
        ttq.load=function(e){var o="https://analytics.tiktok.com/i18n/pixel/events.js";
        var s=document.createElement("script");s.type="text/javascript";s.async=!0;s.src=o+"?sdkid="+e;
        var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};
        ttq.load('${pixelId}');ttq.page();}(window,document,'ttq');
      `);
    }
    case 'CONVERSION_API':
      return null;
    default:
      return null;
  }
}

function inlineScript(code: string): HTMLScriptElement {
  const script = document.createElement('script');
  script.textContent = code;
  return script;
}
