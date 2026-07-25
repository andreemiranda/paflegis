export const ADSENSE_CLIENT_ID = 'ca-pub-7059730627018047';

let scriptLoaded = false;

export function initAdSenseScript(marketingConsent: boolean) {
  if (!marketingConsent) {
    return;
  }

  if (scriptLoaded || document.getElementById('adsense-script')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'adsense-script';
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
  script.setAttribute('crossorigin', 'anonymous');
  
  document.head.appendChild(script);
  scriptLoaded = true;
}

export function pushAdSenseAd() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (win.adsbygoogle) {
      win.adsbygoogle.push({});
    }
  } catch (e) {
    console.debug('AdSense request pending or disabled:', e);
  }
}
