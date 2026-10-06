// AD Aerospace prototype — site behavior (mobile menu, modals, scroll reveal, carousels, hero parallax).
// Static multi-page build: each HTML page already contains its final content;
// this script just wires up interactivity, same as the original SPA's afterRender().

(function(){
  // Note: the mega-menu plane/list and the mobile overlay's aircraft submenu were
  // originally built at runtime from SYSTEMS/AIRCRAFT data + the wirePlane() template
  // helper. In this static export that markup is already baked into the page (it was
  // captured post-render), so only the mega-tab switch behavior needs to be wired up here.
  function switchMegaTab(btn){
    var wrap = btn.closest('.dd-menu');
    wrap.querySelectorAll('[data-mega-tab]').forEach(function(b){ b.classList.remove('current'); });
    btn.classList.add('current');
    var target = btn.dataset.megaTab;
    wrap.querySelectorAll('[data-mega-panel]').forEach(function(p){ p.hidden = (p.dataset.megaPanel !== target); });
  }
  document.querySelectorAll('[data-mega-tab]').forEach(function(btn){
    btn.addEventListener('click', function(){ switchMegaTab(btn); });
    // Hovering a tab (desktop/mouse only) previews its panel immediately, same as a click —
    // e.g. hovering "By Aircraft" swaps the diagram straight to the aircraft photo cards.
    btn.addEventListener('mouseenter', function(){ switchMegaTab(btn); });
  });
})();

// the "Products" mega-menu panel is position:fixed (so it can be centred on the
// viewport instead of anchored to the trigger — see css .dd-menu.mega), which means
// there's a real screen-space gap between the trigger link and the panel's own top
// edge. Plain CSS `:hover` has no tolerance for that gap: the moment the pointer
// crosses it, `.dd:hover` stops matching and the panel closes before the mouse ever
// reaches it. A close-delay alone isn't reliable either — if the pointer takes
// longer than the delay to cross the gap (a slow or hesitant move), the menu still
// closes before it arrives. So on top of the delay, an invisible full-width "bridge"
// element is placed over the gap itself while the menu is open: as long as the
// pointer stays anywhere between the trigger row and the panel — bridge included —
// it counts as still hovering, so there is no dead zone to time out in.
(function(){
  var bridge = document.createElement('div');
  bridge.className = 'mega-hover-bridge';
  // z-index above header.site (40) so the bridge actually intercepts pointer events
  // over that stretch of the header instead of the header's own content stealing them
  bridge.style.cssText = 'position:fixed; left:0; right:0; z-index:41; display:none;';
  document.body.appendChild(bridge);
  var headerEl = document.querySelector('header.site');

  document.querySelectorAll('.dd').forEach(function(dd){
    var menu = dd.querySelector('.dd-menu.mega');
    if(!menu) return;
    var closeTimer = null;
    // the CSS top:161px on .dd-menu.mega only matches the header's real on-screen
    // bottom edge when the page is scrolled all the way up (ticker + header both
    // fully visible). header.site is position:sticky, so as soon as the page
    // scrolls even a little the ticker scrolls out of view and the sticky header
    // settles at the top of the viewport alone — its real bottom edge is then well
    // above 161px, and the static value leaves a growing gap (with the page's own
    // content visible through it) between the header and the panel. Measuring the
    // header's actual rect on every open keeps the panel flush against it regardless
    // of scroll position.
    function positionMenu(){
      if(headerEl) menu.style.top = headerEl.getBoundingClientRect().bottom + 'px';
    }
    function positionBridge(){
      var ddRect = dd.getBoundingClientRect();
      var menuRect = menu.getBoundingClientRect();
      var top = ddRect.bottom;
      var height = menuRect.top - top;
      if(height > 0){
        bridge.style.top = top + 'px';
        bridge.style.height = height + 'px';
        bridge.style.display = 'block';
      } else {
        bridge.style.display = 'none';
      }
    }
    function open(){
      if(closeTimer){ clearTimeout(closeTimer); closeTimer = null; }
      dd.classList.add('mega-open');
      positionMenu();
      positionBridge();
    }
    function scheduleClose(){
      if(closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(function(){
        dd.classList.remove('mega-open');
        bridge.style.display = 'none';
        closeTimer = null;
      }, 300);
    }
    dd.addEventListener('mouseenter', open);
    dd.addEventListener('mouseleave', scheduleClose);
    menu.addEventListener('mouseenter', open);
    menu.addEventListener('mouseleave', scheduleClose);
    bridge.addEventListener('mouseenter', function(){ if(dd.classList.contains('mega-open')) open(); });
    bridge.addEventListener('mouseleave', function(){ if(dd.classList.contains('mega-open')) scheduleClose(); });
  });
})();

(function(){
  var overlay = document.getElementById('menuOverlay');
  var openBtn = document.getElementById('menuToggle');
  var closeBtn = document.getElementById('menuClose');
  if(!overlay || !openBtn || !closeBtn) return;
  function openMenu(){
    overlay.hidden = false;
    // force a reflow so the browser paints the closed (opacity:0 / translateX) state
    // before .open is added — otherwise the two happen in the same frame and the
    // transition is skipped, and the panel just appears instantly.
    void overlay.offsetHeight;
    requestAnimationFrame(()=>{ overlay.classList.add('open'); });
    openBtn.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu(){
    overlay.classList.remove('open');
    openBtn.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
    var panel = overlay.querySelector('.menu-panel');
    var finish = function(){ overlay.hidden = true; };
    if(panel && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      panel.addEventListener('transitionend', finish, {once:true});
      setTimeout(finish, 450); // safety net if transitionend doesn't fire
    } else {
      finish();
    }
  }
  openBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) closeMenu(); });
  overlay.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !overlay.hidden) closeMenu(); });
})();

// Video modal: one player for every [data-video-modal] trigger (Resources cards, hero button).
// A trigger carries data-video-src / data-video-title / data-video-poster. Without a src the modal
// shows the "file still to be supplied" state, so adding a file later is a data change only.
(function(){
  var backdrop = document.getElementById('videoModalBackdrop');
  if(!backdrop) return;
  var closeBtn = document.getElementById('videoModalClose');
  var player = backdrop.querySelector('.video-modal-player');
  var pending = backdrop.querySelector('.video-modal-pending');
  var titleEl = document.getElementById('videoModalTitle');
  var lastTrigger = null;

  function open(trigger){
    lastTrigger = trigger;
    var src = trigger.getAttribute('data-video-src');
    titleEl.textContent = trigger.getAttribute('data-video-title') || 'Video';
    if(src){
      player.poster = trigger.getAttribute('data-video-poster') || '';
      player.src = src;
      player.hidden = false;
      pending.hidden = true;
    } else {
      player.hidden = true;
      pending.hidden = false;
    }
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    if(src){ var p = player.play(); if(p && p.catch) p.catch(function(){}); }
  }
  function close(){
    player.pause();
    player.removeAttribute('src');
    player.removeAttribute('poster');
    player.load();
    backdrop.hidden = true;
    document.body.style.overflow = '';
    if(lastTrigger && lastTrigger.focus) lastTrigger.focus();
    lastTrigger = null;
  }
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-video-modal]');
    if(!t) return;
    e.preventDefault();
    open(t);
  });
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', function(e){ if(e.target === backdrop) close(); });
  document.addEventListener('keydown', function(e){
    if(backdrop.hidden) return;
    if(e.key === 'Escape'){ close(); return; }
    if(e.key === 'Tab'){
      // keep focus inside the dialog: close button <-> player controls
      var f = [closeBtn].concat(player.hidden ? [] : [player]);
      var i = f.indexOf(document.activeElement);
      if(e.shiftKey && i <= 0){ e.preventDefault(); f[f.length-1].focus(); }
      else if(!e.shiftKey && i === f.length-1){ e.preventDefault(); f[0].focus(); }
      else if(i === -1){ e.preventDefault(); f[0].focus(); }
    }
  });
})();

(function(){
  var backdrop = document.getElementById('imageLightboxBackdrop');
  if(!backdrop) return;
  var closeBtn = document.getElementById('imageLightboxClose');
  var prevBtn = document.getElementById('imageLightboxPrev');
  var nextBtn = document.getElementById('imageLightboxNext');
  if(closeBtn) closeBtn.addEventListener('click', closeImageLightbox);
  backdrop.addEventListener('click', function(e){ if(e.target === backdrop) closeImageLightbox(); });
  if(prevBtn) prevBtn.addEventListener('click', function(){ showLightboxImage(__lightboxIndex - 1); });
  if(nextBtn) nextBtn.addEventListener('click', function(){ showLightboxImage(__lightboxIndex + 1); });
  document.addEventListener('keydown', function(e){
    if(backdrop.hidden) return;
    if(e.key === 'Escape') closeImageLightbox();
    if(e.key === 'ArrowLeft') showLightboxImage(__lightboxIndex - 1);
    if(e.key === 'ArrowRight') showLightboxImage(__lightboxIndex + 1);
  });
})();
var __lightboxGroup = [];
var __lightboxIndex = 0;
function showLightboxImage(i){
  if(!__lightboxGroup.length) return;
  __lightboxIndex = (i + __lightboxGroup.length) % __lightboxGroup.length;
  var item = __lightboxGroup[__lightboxIndex];
  var img = document.getElementById('imageLightboxImg');
  var caption = document.getElementById('imageLightboxCaption');
  if(img){ img.src = item.src; img.alt = item.alt || ''; }
  if(caption){ caption.textContent = item.caption || ''; caption.hidden = !item.caption; }
  var multi = __lightboxGroup.length > 1;
  var prevBtn = document.getElementById('imageLightboxPrev');
  var nextBtn = document.getElementById('imageLightboxNext');
  if(prevBtn) prevBtn.hidden = !multi;
  if(nextBtn) nextBtn.hidden = !multi;
}
function openImageLightbox(group, index){
  var backdrop = document.getElementById('imageLightboxBackdrop');
  if(!backdrop || !group.length) return;
  __lightboxGroup = group;
  showLightboxImage(index);
  backdrop.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeImageLightbox(){
  var backdrop = document.getElementById('imageLightboxBackdrop');
  if(!backdrop) return;
  backdrop.hidden = true;
  document.body.style.overflow = '';
}

(function(){
  // Wire-plane hotspots (Home, Systems, eVTOL pages, header mega-menu) link straight through to
  // the relevant system page — no intermediate preview dialog. Attached once at top level (not
  // inside afterRender) via delegation since hotspots exist in multiple re-rendered contexts.
  document.addEventListener('click', function(e){
    var spot = e.target.closest('.wire-plane .spot[data-hotspot-href]');
    if(!spot) return;
    e.preventDefault();
    var href = spot.getAttribute('data-hotspot-href');
    var currentFile = location.pathname.split('/').pop() || 'index.html';
    if(href === currentFile) return; // already on this page — avoid a pointless full reload
    window.location.href = href;
  });
})();

(function(){
  // Hovering a hotspot on the "By Application" mega-menu diagram also highlights the
  // matching row in the systems list beside it. data-mega-index ties each spot to the
  // position of its <li> in that panel's .mega-list (0-based).
  document.querySelectorAll('.mega-body[data-mega-panel="application"]').forEach(function(panel){
    var list = panel.querySelector('.mega-list');
    if(!list) return;
    var items = list.querySelectorAll('li');
    panel.querySelectorAll('.wire-plane .spot[data-mega-index]').forEach(function(spot){
      var li = items[+spot.dataset.megaIndex];
      var link = li && li.querySelector('a');
      if(!link) return;
      spot.addEventListener('mouseenter', function(){ link.classList.add('hotspot-active'); });
      spot.addEventListener('mouseleave', function(){ link.classList.remove('hotspot-active'); });
      spot.addEventListener('focus', function(){ link.classList.add('hotspot-active'); });
      spot.addEventListener('blur', function(){ link.classList.remove('hotspot-active'); });
    });
  });
})();

function afterRender(){
  const app = document.getElementById('app');
  if(!app) return;

  // hero: scroll-down cue jumps to the section right after it
  app.querySelectorAll('[data-hero-scroll]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const heroEl = btn.closest('.hero');
      const next = heroEl && heroEl.nextElementSibling;
      if(next) next.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // count-up stat numbers: any stat value starting with a number (e.g. "30+ years",
  // "2 TOPS") counts up from 0 as it scrolls into view. Values with no leading digit
  // ("Global", "Boeing Key Vendor") are left as plain static text — nothing to count.
  app.querySelectorAll('.stat .n, .feat-stat .n').forEach(el=>{
    const raw = el.textContent;
    const m = raw.match(/^(\d+(?:\.\d+)?)/);
    if(!m) return;
    const target = parseFloat(m[1]);
    const decimals = m[1].includes('.') ? m[1].split('.')[1].length : 0;
    const suffix = raw.slice(m[1].length);
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // leave the real value showing
    el.textContent = (decimals ? (0).toFixed(decimals) : '0') + suffix;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        io.unobserve(el);
        const duration = 1100, start = performance.now();
        (function tick(now){
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = target * eased;
          el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val)) + suffix;
          if(p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, {threshold:0.4});
    io.observe(el);
  });

  // fade/slide reveal on scroll — fine-grained (cards, stat rows, etc.)
  const revealSelectors = '.card,.path-card,.stat-row,.section-head,.spec-box,.video-card,.feature-pill,.usecase-pill,.anim-panel,.compare,.orbit-viewer';
  app.querySelectorAll(revealSelectors).forEach(el=>el.classList.add('reveal'));

  // fade/slide reveal on scroll — whole content blocks (every page-level section
  // gets this, so motion isn't limited to a handful of component types). .page-hero
  // is deliberately excluded here — its children get their own staggered reveal
  // just below, and double-wrapping it would fade it in twice (parent + children).
  const revealBlockSelectors = '.section,.contact-block,.req-banner,.oem-logos,.band';
  app.querySelectorAll(revealBlockSelectors).forEach(el=>el.classList.add('reveal-block'));

  // hero: stagger eyebrow / h1 / actions in one at a time
  app.querySelectorAll('.hero-copy').forEach(wrap=>{
    Array.from(wrap.children).forEach((child,i)=>{
      child.classList.add('reveal');
      child.style.transitionDelay = (i*130)+'ms';
    });
  });
  // inner-page hero banner: stagger breadcrumb / eyebrow / h1 / lede the same way
  app.querySelectorAll('.page-hero').forEach(wrap=>{
    Array.from(wrap.children).forEach((child,i)=>{
      child.classList.add('reveal');
      child.style.transitionDelay = (i*100)+'ms';
    });
  });
  app.querySelectorAll('.grid').forEach(grid=>{
    Array.from(grid.children).forEach((child,i)=>{ child.style.transitionDelay = Math.min(i*60,300)+'ms'; });
  });
  if(window.__io) window.__io.disconnect();
  const revealEls = app.querySelectorAll('.reveal, .reveal-block');
  if('IntersectionObserver' in window){
    window.__io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){
        const el = e.target; el.classList.add('in'); window.__io.unobserve(el);
        // the staggered reveal delay must not linger on the element, or hover transitions would lag
        const d = parseFloat(el.style.transitionDelay) || 0;
        if(d) setTimeout(()=>{ el.style.transitionDelay = ''; }, d + 900);
      } });
    }, {threshold:0, rootMargin:'0px 0px 200px 0px'});
    revealEls.forEach(el=>window.__io.observe(el));
  } else {
    revealEls.forEach(el=>el.classList.add('in'));
  }
  // carousels (Features / Use Cases on the 4K page)
  app.querySelectorAll('[data-carousel]').forEach(wrap=>{
    const track = wrap.querySelector('.carousel');
    const prev = wrap.querySelector('[data-car-prev]');
    const next = wrap.querySelector('[data-car-next]');
    if(!track) return;
    // one click = one slide: step by exactly one card's width plus the track's own gap,
    // not a fraction of the viewport (which used to skip past several cards at once).
    const step = ()=>{
      const first = track.children[0];
      if(!first) return track.clientWidth * 0.8;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return first.getBoundingClientRect().width + gap;
    };
    if(prev) prev.addEventListener('click', ()=> track.scrollBy({left:-step(), behavior:'smooth'}));
    if(next) next.addEventListener('click', ()=> track.scrollBy({left:step(), behavior:'smooth'}));
    // optional progress bar (gallery carousel on the 4K page)
    const progressBar = wrap.querySelector('[data-gallery-progress] .gallery-progress-bar');
    if(progressBar){
      const updateProgress = ()=>{
        const max = track.scrollWidth - track.clientWidth;
        const pct = max > 0 ? track.scrollLeft / max : 0;
        const barPct = Math.max(15, 100 / track.children.length);
        progressBar.style.width = barPct + '%';
        progressBar.style.left = (pct * (100 - barPct)) + '%';
      };
      track.addEventListener('scroll', updateProgress, {passive:true});
      updateProgress();
    }
  });

  // click-to-view lightbox for any carousel/gallery photo. Groups by the enclosing
  // .carousel so prev/next inside the lightbox cycles through that same set of photos;
  // a photo with no carousel ancestor just opens on its own. De-duped by src because the
  // 4K page repeats its photo set twice to get a longer scroll track — without the de-dupe,
  // prev/next inside the lightbox would visit the same photo twice in a row.
  app.querySelectorAll('.usecase-photo img, .gallery-photo img, .install-photo img').forEach(photoImg=>{
    const card = photoImg.closest('.usecase-photo, .gallery-photo, .install-photo');
    if(!card) return;
    const scope = card.closest('.carousel') || card.parentElement || app;
    const seen = new Set();
    const items = [];
    scope.querySelectorAll('.usecase-photo img, .gallery-photo img, .install-photo img').forEach(i=>{
      const src = i.getAttribute('src');
      if(seen.has(src)) return;
      seen.add(src);
      const captionEl = i.parentElement.querySelector('h3, figcaption');
      items.push({src, alt:i.getAttribute('alt') || '', caption: captionEl ? captionEl.textContent : (card.getAttribute('data-label') || '')});
    });
    photoImg.addEventListener('click', ()=>{
      const idx = items.findIndex(it=>it.src === photoImg.getAttribute('src'));
      openImageLightbox(items, idx < 0 ? 0 : idx);
    });
  });

  // HD / 4K comparison slider
  app.querySelectorAll('[data-compare]').forEach(box=>{
    const frame = box.querySelector('.compare-frame'), range = box.querySelector('.compare-range');
    if(!frame || !range) return;
    const set = ()=> frame.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', set); set();
  });

  // 3D viewer: js/camera-3d.js (three.js bundle, ~550 KB) is only fetched once the viewer
  // is about to scroll into view; until then (and if WebGL is unavailable) the poster photo shows.
  const viewers3d = app.querySelectorAll('[data-viewer3d]');
  if(viewers3d.length){
    let loading = null;
    const loadLib = () => loading || (loading = new Promise((res, rej)=>{
      if(window.AD3D) return res();
      const s = document.createElement('script'); s.src = 'js/camera-3d.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    }));
    const start = el => loadLib().then(()=> window.AD3D.init(el)).catch(()=>{ el.classList.remove('v3d-loading'); el.classList.add('v3d-failed'); });
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver(es => es.forEach(e=>{ if(e.isIntersecting){ io.unobserve(e.target); start(e.target); } }), {rootMargin:'400px'});
      viewers3d.forEach(v => io.observe(v));
    } else viewers3d.forEach(start);
  }


  // click-to-play product videos: poster + centered play badge (e.g. eVTOL 4K animation).
  // Native controls stay off until the badge is clicked, so the frame reads as a still
  // photo (matching every other .photo-frame on the site) until the visitor presses play.
  app.querySelectorAll('[data-play-video]').forEach(btn=>{
    const frame = btn.closest('.video-frame');
    const vid = frame && frame.querySelector('video');
    if(!vid) return;
    btn.addEventListener('click', ()=>{
      vid.controls = true;
      frame.classList.add('is-playing');
      vid.play().catch(()=>{});
    });
    vid.addEventListener('ended', ()=>{
      frame.classList.remove('is-playing');
      vid.controls = false;
    });
  });

  // cam video embed: the 4K camera animation, plays inline when motion is allowed (element-scoped, re-runs every render)
  app.querySelectorAll('.cam-video-embed .anim-video').forEach(vid=>{
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      vid.play().catch(()=>{});
    } else {
      vid.pause();
    }
  });

  // hero background: subtle cursor-follow + scroll parallax. mousemove/mouseleave are element-scoped and
  // safe to re-add every render; the scroll handler is window-level, so the previous render's handler is
  // explicitly removed first to avoid stacking listeners against detached DOM.
  const heroSection = app.querySelector('.hero');
  const heroBg = app.querySelector('.hero-bg');
  if(window.__heroParallaxScroll){ window.removeEventListener('scroll', window.__heroParallaxScroll); window.__heroParallaxScroll = null; }
  if(heroSection && heroBg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    let mx = 0, my = 0;
    const applyHeroParallax = ()=>{
      const sy = Math.min(window.scrollY, heroSection.offsetHeight) * 0.06;
      heroBg.style.transform = `scale(1.06) translate(${mx}px, ${my - sy}px)`;
    };
    heroSection.addEventListener('mousemove', e=>{
      const r = heroSection.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      mx = x*-10; my = y*-10;
      applyHeroParallax();
    });
    heroSection.addEventListener('mouseleave', ()=>{ mx = 0; my = 0; applyHeroParallax(); });
    window.__heroParallaxScroll = applyHeroParallax;
    window.addEventListener('scroll', applyHeroParallax, {passive:true});
    applyHeroParallax();
  }
}


// header: glass/transparent while over the home hero, solid everywhere/whenever else
function updateHeaderGlass(){
  const header = document.querySelector('header.site');
  if(!header) return;
  const heroEl = document.querySelector('#app .hero');
  const onHero = heroEl && window.scrollY < (heroEl.offsetHeight - 60);
  header.classList.toggle('header-glass', !!onHero);
}
window.addEventListener('scroll', updateHeaderGlass, {passive:true});

afterRender(); // wire up interactivity for this page's (already-rendered) content
updateHeaderGlass();


/* hotspot labels: anchor toward the plane's interior for spots near an edge */
(function(){
  document.querySelectorAll('.wire-plane .spot').forEach(function(s){
    var m = /left:\s*([\d.]+)%/.exec(s.getAttribute('style') || '');
    if(!m) return;
    var x = parseFloat(m[1]);
    if(x < 28) s.classList.add('lbl-l'); else if(x > 72) s.classList.add('lbl-r');
  });
})();

/* Lazy-load + auto-play/pause the muted looping "anim-video" clips: nothing is downloaded until the
   video is near the viewport, and it pauses again when scrolled away (saves bandwidth and CPU). */
(function(){
  var vids = document.querySelectorAll('video[data-lazy-video]');
  if(!vids.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function load(v){
    if(v.dataset.loaded) return;
    v.dataset.loaded = '1';
    v.querySelectorAll('source[data-src]').forEach(function(s){ s.src = s.getAttribute('data-src'); });
    v.load();
  }
  if(!('IntersectionObserver' in window)){ vids.forEach(function(v){ load(v); if(!reduce) v.play().catch(function(){}); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      var v = e.target;
      if(e.isIntersecting){ load(v); if(!reduce) v.play().catch(function(){}); }
      else if(v.dataset.loaded){ v.pause(); }
    });
  }, {rootMargin:'200px 0px'});
  vids.forEach(function(v){ io.observe(v); });
})();

// Document download rows: a row with a real file is a plain <a href="…pdf" download>.
// A row still waiting on the client's file carries data-doc-pending and shows a short notice instead.
(function(){
  var toast, timer;
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('[data-doc-pending]');
    if(!a) return;
    e.preventDefault();
    if(!toast){
      toast = document.createElement('div');
      toast.className = 'doc-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = '“' + (a.getAttribute('data-doc-title') || 'This document') + '” — the PDF is still to be supplied by the client. Once it is uploaded in the admin panel, this row downloads it.';
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(function(){ toast.classList.remove('show'); }, 5000);
  });
})();
