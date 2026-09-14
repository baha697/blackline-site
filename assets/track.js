/* ============================================================
   BLACKLINE — Suivi des conversions
   ------------------------------------------------------------
   Mesure les trois actions qui comptent : clic sur le telephone,
   sur WhatsApp, sur l'email.

   DEUX NIVEAUX :
   1. Vercel Analytics  -> actif tout de suite, sans cookie.
   2. Google Ads        -> dormant tant que ADS_ID est vide.

   POUR ACTIVER GOOGLE ADS, trois choses a faire dans l'ordre :
   a) renseigner ADS_ID et les LABELS ci-dessous ;
   b) mettre a jour la rubrique Cookies des mentions legales,
      qui affirme aujourd'hui qu'aucun traceur publicitaire
      n'est utilise. Cette phrase deviendrait fausse ;
   c) verifier que la banniere de consentement s'affiche bien.
      Elle apparait automatiquement des que ADS_ID est renseigne.
   ============================================================ */
(function () {
  'use strict';

  var CONFIG = {
    /* Identifiant Google Ads, format AW-XXXXXXXXX.
       Vide = aucun cookie, aucune banniere, aucun appel reseau. */
    ADS_ID: '',

    /* Libelles de conversion.
       Google Ads > Objectifs > Conversions > [action] > Configurer la balise.
       Le libelle est la chaine apres la barre oblique du send_to. */
    LABELS: {
      telephone: '',
      whatsapp: '',
      email: ''
    }
  };

  var STORAGE_KEY = 'bl-consent';

  /* ---------- Utilitaires ---------- */

  function lire(cle) {
    try { return window.localStorage.getItem(cle); } catch (e) { return null; }
  }
  function ecrire(cle, val) {
    try { window.localStorage.setItem(cle, val); } catch (e) { /* mode prive */ }
  }

  /* ---------- Vercel Analytics : evenement sans cookie ---------- */

  function vercel(nom, donnees) {
    if (typeof window.va === 'function') {
      window.va('event', { name: nom, data: donnees || {} });
    }
  }

  /* ---------- Google Ads : charge uniquement si configure ---------- */

  var adsActif = !!CONFIG.ADS_ID;

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function initAds() {
    if (!adsActif) return;
    window.gtag = window.gtag || gtag;

    /* Consent Mode v2 : tout refuse par defaut, comme l'exige la CNIL.
       Google recoit des signaux anonymes et modelise les conversions
       tant que le visiteur n'a pas accepte. */
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500
    });

    var choix = lire(STORAGE_KEY);
    if (choix === 'accepte') accorder();

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ADS_ID;
    document.head.appendChild(s);

    gtag('js', new Date());
    gtag('config', CONFIG.ADS_ID);
  }

  function accorder() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
  }

  function conversion(action) {
    if (!adsActif) return;
    var label = CONFIG.LABELS[action];
    if (!label) return;
    gtag('event', 'conversion', {
      send_to: CONFIG.ADS_ID + '/' + label,
      transport_type: 'beacon'
    });
  }

  /* ---------- Banniere de consentement ---------- */

  function banniere() {
    if (!adsActif) return;                 // rien a consentir
    if (lire(STORAGE_KEY)) return;         // choix deja exprime

    var css = document.createElement('style');
    css.textContent =
      '.bl-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;' +
      'max-width:520px;margin:0 auto;background:#0B1030;color:#CCCBD1;' +
      'border:1px solid rgba(204,203,209,.22);border-radius:6px;padding:18px 20px;' +
      'font-size:.86rem;line-height:1.55;box-shadow:0 18px 50px rgba(0,0,0,.5);' +
      'opacity:0;transform:translateY(12px);transition:opacity .35s,transform .35s}' +
      '.bl-consent.is-on{opacity:1;transform:none}' +
      '.bl-consent p{margin:0 0 14px}' +
      '.bl-consent a{color:#fff;text-decoration:underline}' +
      '.bl-consent__row{display:flex;gap:10px;flex-wrap:wrap}' +
      '.bl-consent button{flex:1;min-width:120px;cursor:pointer;border-radius:4px;' +
      'padding:9px 14px;font:inherit;font-size:.76rem;letter-spacing:.12em;' +
      'text-transform:uppercase;font-weight:600}' +
      '.bl-consent .ok{background:#fff;color:#04092D;border:1px solid #fff}' +
      '.bl-consent .no{background:transparent;color:#CCCBD1;' +
      'border:1px solid rgba(204,203,209,.32)}' +
      '@media(prefers-reduced-motion:reduce){.bl-consent{transition:none}}';
    document.head.appendChild(css);

    var box = document.createElement('div');
    box.className = 'bl-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', 'Consentement aux cookies de mesure publicitaire');
    box.innerHTML =
      '<p>Nous utilisons des cookies de mesure pour savoir quelles annonces ' +
      'nous amènent des demandes de location. Rien n’est utilisé à ' +
      'd’autres fins. <a href="/mentions-legales/">En savoir plus</a></p>' +
      '<div class="bl-consent__row">' +
      '<button type="button" class="ok">Accepter</button>' +
      '<button type="button" class="no">Refuser</button>' +
      '</div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('is-on'); });

    function ferme(valeur) {
      ecrire(STORAGE_KEY, valeur);
      if (valeur === 'accepte') accorder();
      box.classList.remove('is-on');
      setTimeout(function () { box.remove(); }, 350);
    }
    box.querySelector('.ok').addEventListener('click', function () { ferme('accepte'); });
    box.querySelector('.no').addEventListener('click', function () { ferme('refuse'); });
  }

  /* ---------- Detection des clics de contact ---------- */

  var REGLES = [
    { action: 'telephone', test: function (h) { return h.indexOf('tel:') === 0; } },
    { action: 'whatsapp', test: function (h) { return h.indexOf('https://wa.me/') === 0; } },
    { action: 'email', test: function (h) { return h.indexOf('mailto:') === 0; } }
  ];

  function surClic(e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    for (var i = 0; i < REGLES.length; i++) {
      if (REGLES[i].test(href)) {
        var action = REGLES[i].action;
        vercel('contact_' + action, {
          page: location.pathname,
          libelle: (a.textContent || '').trim().slice(0, 40)
        });
        conversion(action);
        return;
      }
    }
  }

  /* ---------- Demarrage ---------- */

  function demarrer() {
    initAds();
    banniere();
    document.addEventListener('click', surClic, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
})();
