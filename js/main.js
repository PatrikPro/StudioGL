/* =====================================================
   Studio GOODLOOK — interactions
   ===================================================== */
(() => {
'use strict';

const $  = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- LOADER ---------- */
(function loader() {
    const el = $('#loader');
    const bar = $('#loaderBar');
    if (!el) return;
    let progress = 0;
    const tick = () => {
        progress = Math.min(100, progress + Math.random() * 18 + 6);
        if (bar) bar.style.width = progress + '%';
        if (progress < 100) {
            setTimeout(tick, 110);
        } else {
            setTimeout(() => {
                el.classList.add('is-done');
                document.body.classList.remove('is-loading');
                // kick off reveal observer on visible elements
                requestAnimationFrame(triggerInitialReveals);
            }, 280);
        }
    };
    // Wait for window load OR a max timeout so we never get stuck
    let started = false;
    const start = () => { if (started) return; started = true; tick(); };
    window.addEventListener('load', start);
    setTimeout(start, 1800);
})();

/* ---------- NAV ---------- */
(function nav() {
    const nav = $('#nav');
    const burger = $('#navBurger');
    const menu = $('#navMenu');
    const links = $$('.nav__link');

    const onScroll = () => {
        if (window.scrollY > 16) nav.classList.add('is-scrolled');
        else nav.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    burger?.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    links.forEach(l => l.addEventListener('click', () => {
        menu.classList.remove('is-open');
        burger?.setAttribute('aria-expanded', 'false');
    }));

    // Active section underline
    const sections = $$('main section[id]');
    const setActive = () => {
        const y = window.scrollY + 140;
        let cur = null;
        sections.forEach(s => { if (s.offsetTop <= y) cur = s.id; });
        links.forEach(l => {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + cur);
        });
    };
    window.addEventListener('scroll', setActive, { passive: true });
})();

/* ---------- SCROLL PROGRESS ---------- */
(function scrollProgress() {
    const bar = $('#scrollProgress');
    if (!bar) return;
    const update = () => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? (window.scrollY / h) * 100 : 0;
        bar.style.width = p + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
})();

/* ---------- CUSTOM CURSOR ---------- */
(function cursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    const c = $('#cursor');
    if (!c) return;
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    window.addEventListener('mousemove', e => {
        tx = e.clientX; ty = e.clientY;
        c.style.opacity = '1';
    }, { passive: true });
    window.addEventListener('mouseleave', () => c.style.opacity = '0');
    const tick = () => {
        x += (tx - x) * 0.22;
        y += (ty - y) * 0.22;
        c.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const hoverables = 'a, button, .menu-card, .gallery__item, .team-card, .chip, input, select, textarea';
    document.addEventListener('mouseover', e => {
        if (e.target.closest(hoverables)) c.classList.add('is-hovering');
    });
    document.addEventListener('mouseout', e => {
        if (e.target.closest(hoverables)) c.classList.remove('is-hovering');
    });
})();

/* ---------- HERO PARALLAX (mouse + scroll) ---------- */
// Composes safely with CSS because positional centering and static
// rotations live on `translate:` and `rotate:` properties, while CSS
// animations modify those same properties. The JS only writes the
// `transform` property, which is composed last by the browser.
(function heroParallax() {
    if (prefersReduced) return;
    const scene = $('#heroScene');
    if (!scene) return;
    const layers = $$('[data-depth]', scene);
    if (!layers.length) return;

    let mx = 0, my = 0, tx = 0, ty = 0, scrollY = 0;

    const onMouse = (e) => {
        const rect = scene.getBoundingClientRect();
        tx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;   // -1 .. 1
        ty = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    const tick = () => {
        mx += (tx - mx) * 0.08;
        my += (ty - my) * 0.08;
        layers.forEach(l => {
            const d = parseFloat(l.dataset.depth) || 0.1;
            const px = mx * d * 60;
            const py = my * d * 50 + scrollY * d * 0.25;
            l.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        });
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
})();

/* ---------- STORY IMAGE PARALLAX (scroll) ---------- */
(function imgParallax() {
    if (prefersReduced) return;
    const items = $$('[data-parallax]');
    if (!items.length) return;
    const update = () => {
        items.forEach(el => {
            const rect = el.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const offset = (window.innerHeight / 2 - center) * parseFloat(el.dataset.parallax);
            el.style.transform = `translate3d(0, ${offset}px, 0)`;
        });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

/* ---------- REVEAL ON SCROLL ---------- */
const revealIO = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('is-in');
            revealIO.unobserve(e.target);
        }
    });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }) : null;

function observeReveals() {
    $$('.reveal').forEach(el => {
        if (!el.classList.contains('is-in')) revealIO?.observe(el);
    });
}
function triggerInitialReveals() {
    // For elements already in viewport at load
    $$('.reveal').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9) el.classList.add('is-in');
    });
    observeReveals();
}
observeReveals();

/* ---------- SERVICES DATA + RENDER + FILTER ---------- */
const SERVICES = [
    // CUT
    { cat: 'cut',   name: 'Dámský střih + mytí',        price: '650 Kč',  desc: 'Klasický střih s mytím, masáží hlavy a foukanou do tvaru.', icon: 'scissors' },
    { cat: 'cut',   name: 'Pánský střih',                price: '420 Kč',  desc: 'Přesný střih, krátký fade nebo klasika dle vašeho přání.',  icon: 'scissors' },
    { cat: 'cut',   name: 'Dětský střih (do 12 let)',    price: '320 Kč',  desc: 'Pohoda pro malé klienty — hračky i pomalu, jak potřebují.', icon: 'cut' },
    { cat: 'cut',   name: 'Foukaná do tvaru',            price: 'od 380 Kč', desc: 'Profesionální styling — vlny, hladké narovnání nebo objem.', icon: 'wave' },

    // COLOR
    { cat: 'color', name: 'Barva — krátké vlasy',        price: 'od 950 Kč', desc: 'L\'Oréal / Wella, individuální namíchání odstínu.',       icon: 'palette' },
    { cat: 'color', name: 'Barva — dlouhé vlasy',        price: 'od 1 450 Kč', desc: 'Šetrné barvení po celé délce s ošetřením.',           icon: 'palette' },
    { cat: 'color', name: 'Melír / pramínky',            price: 'od 1 250 Kč', desc: 'Klasický melír foliemi pro jemné prosvětlení.',       icon: 'sparkle' },
    { cat: 'color', name: 'Balayage',                    price: 'od 2 200 Kč', desc: 'Ručně malované přechody — přírodní odlesk s dlouhým výdržem.', icon: 'sparkle' },
    { cat: 'color', name: 'Korekce barvy',               price: 'od 1 800 Kč', desc: 'Náprava nepovedené barvy, šetrné vrácení k přírodnímu odstínu.', icon: 'palette' },
    { cat: 'color', name: 'Pánské barvení / kamufláž',   price: 'od 450 Kč', desc: 'Diskrétní zakrytí šedin s přírodním výsledkem.',         icon: 'palette' },

    // TREATMENTS
    { cat: 'treat', name: 'OlaPlex regenerace',          price: 'od 550 Kč', desc: 'Špičkové ošetření poškozených vlasů — obnova vazeb.',    icon: 'leaf' },
    { cat: 'treat', name: 'Power Dose',                  price: 'od 480 Kč', desc: 'Intenzivní výživa Wella pro suché a křehké vlasy.',      icon: 'leaf' },
    { cat: 'treat', name: 'Vlasová maska + masáž',       price: 'od 290 Kč', desc: 'Hloubková regenerace s uvolňující masáží pokožky.',      icon: 'leaf' },

    // EVENT
    { cat: 'event', name: 'Svatební účes',               price: 'od 1 600 Kč', desc: 'Včetně zkoušky před svatbou. Slušíme i vašim svědkyním.', icon: 'flower' },
    { cat: 'event', name: 'Slavnostní účes',             price: 'od 950 Kč', desc: 'Společenská událost, ples, focení — vždy s grácií.',     icon: 'flower' },
    { cat: 'event', name: 'Vizážistka — make-up',        price: 'od 1 200 Kč', desc: 'Denní i večerní make-up, svatba, fotografie.',         icon: 'sparkle' },
];

const ICONS = {
    scissors: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 16 L20 4M16 16 L4 4"/></svg>`,
    cut:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 L8.12 14.46"/><path d="M14.5 12.5 L20 20"/></svg>`,
    wave:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8 Q7 4 11 8 T19 8"/><path d="M3 14 Q7 10 11 14 T19 14"/><path d="M3 20 Q7 16 11 20 T19 20"/></svg>`,
    palette:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 4-4 4h-2a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 22Z"/><circle cx="7" cy="11" r="1.2" fill="currentColor"/><circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="14" cy="5" r="1.2" fill="currentColor"/><circle cx="18" cy="9" r="1.2" fill="currentColor"/></svg>`,
    sparkle:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L13.5 9 L20 10.5 L13.5 12 L12 18 L10.5 12 L4 10.5 L10.5 9 Z"/><path d="M19 17 L19.7 19.3 L22 20 L19.7 20.7 L19 23 L18.3 20.7 L16 20 L18.3 19.3 Z"/></svg>`,
    leaf:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21c0-9 5-13 10-13-1 9-5 13-10 13z"/><path d="M11 21c-3-4-2-9 2-12"/></svg>`,
    flower:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.2"/><path d="M12 2c2 2 2 6 0 7-2-1-2-5 0-7Z"/><path d="M12 22c-2-2-2-6 0-7 2 1 2 5 0 7Z"/><path d="M2 12c2-2 6-2 7 0-1 2-5 2-7 0Z"/><path d="M22 12c-2 2-6 2-7 0 1-2 5-2 7 0Z"/></svg>`,
};

const CAT_LABEL = { cut: 'Střih', color: 'Barva', treat: 'Péče', event: 'Příležitost' };

(function renderServices() {
    const grid = $('#menuGrid');
    if (!grid) return;
    grid.innerHTML = SERVICES.map(s => `
        <article class="menu-card reveal" data-cat="${s.cat}">
            <div class="menu-card__head">
                <div class="menu-card__icon">${ICONS[s.icon] || ICONS.scissors}</div>
                <div class="menu-card__price">${s.price}</div>
            </div>
            <h3>${s.name}</h3>
            <p>${s.desc}</p>
            <span class="menu-card__cat">${CAT_LABEL[s.cat]}</span>
        </article>
    `).join('');
    observeReveals();
})();

(function filterServices() {
    const chips = $$('#menuFilters .chip');
    if (!chips.length) return;
    chips.forEach(chip => chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const f = chip.dataset.filter;
        $$('.menu-card').forEach(card => {
            const show = f === 'all' || card.dataset.cat === f;
            card.classList.toggle('is-hidden', !show);
        });
    }));
})();

/* ---------- MENU CARD 3D TILT ---------- */
(function tiltCards() {
    if (prefersReduced || window.matchMedia('(hover: none)').matches) return;
    const apply = el => {
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width  - 0.5;
            const y = (e.clientY - r.top)  / r.height - 0.5;
            el.style.transform = `perspective(800px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    };
    // Tilt service cards
    const observer = new MutationObserver(() => {
        $$('.menu-card').forEach(c => { if (!c.dataset.tilted) { apply(c); c.dataset.tilted = '1'; } });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    $$('.menu-card').forEach(c => { apply(c); c.dataset.tilted = '1'; });
    $$('[data-tilt]').forEach(apply);
})();

/* ---------- COUNTER ANIMATION ---------- */
(function counters() {
    const nums = $$('.stat__num');
    if (!nums.length) return;
    const animate = el => {
        const target = parseInt(el.dataset.count, 10) || 0;
        const suffix = el.dataset.suffix || '';
        const dur = 1600;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.floor(eased * target).toLocaleString('cs-CZ') + suffix;
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = target.toLocaleString('cs-CZ') + suffix;
        };
        requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
            });
        }, { threshold: 0.4 });
        nums.forEach(n => io.observe(n));
    } else {
        nums.forEach(animate);
    }
})();

/* ---------- TESTIMONIALS ---------- */
(function testimonials() {
    const stage = $('#quotesStage');
    const dotsBox = $('#quotesDots');
    if (!stage || !dotsBox) return;
    const quotes = $$('.quote', stage);
    if (!quotes.length) return;
    let i = 0, timer;

    dotsBox.innerHTML = quotes.map((_, idx) => `<button aria-label="Citát ${idx+1}" data-i="${idx}"></button>`).join('');
    const dots = $$('button', dotsBox);

    const show = (idx) => {
        quotes.forEach((q, n) => q.classList.toggle('is-active', n === idx));
        dots.forEach((d, n) => d.classList.toggle('is-active', n === idx));
        i = idx;
    };
    show(0);

    const next = () => show((i + 1) % quotes.length);
    const start = () => { stop(); timer = setInterval(next, 6000); };
    const stop  = () => { if (timer) clearInterval(timer); };

    dots.forEach(d => d.addEventListener('click', () => { show(parseInt(d.dataset.i, 10)); start(); }));
    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    start();
})();

/* ---------- LIGHTBOX ---------- */
(function lightbox() {
    const lb = $('#lightbox');
    const img = $('#lbImg');
    const cap = $('#lbCap');
    const close = $('#lbClose');
    const prev = $('#lbPrev');
    const next = $('#lbNext');
    if (!lb) return;
    const items = $$('.gallery__item');
    if (!items.length) return;

    const list = items.map(item => {
        const i = item.querySelector('img');
        const s = item.querySelector('span');
        return { src: i?.src || '', alt: i?.alt || '', cap: s?.textContent || '' };
    });
    let idx = 0;

    const open = (n) => {
        idx = n;
        img.src = list[idx].src;
        img.alt = list[idx].alt;
        cap.textContent = list[idx].cap;
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };
    const closeLb = () => {
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };
    const go = (delta) => open((idx + delta + list.length) % list.length);

    items.forEach((it, n) => {
        it.addEventListener('click', () => open(n));
        it.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); }
        });
    });
    close?.addEventListener('click', closeLb);
    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    window.addEventListener('keydown', e => {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft')  go(-1);
        if (e.key === 'ArrowRight') go(1);
    });
})();

/* ---------- BACK TO TOP ---------- */
(function toTop() {
    const btn = $('#toTop');
    if (!btn) return;
    const update = () => btn.classList.toggle('is-visible', window.scrollY > 600);
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));
    update();
})();

/* ---------- FORM (FormSubmit AJAX → e-mail) ---------- */
(function form() {
    const f = $('#reserveForm');
    const note = $('#formNote');
    if (!f) return;
    const btn = f.querySelector('button[type="submit"]');
    const ENDPOINT = 'https://formsubmit.co/ajax/patrik.prochazka.ez@gmail.com';
    const LABELS = {
        cut: 'Střih & mytí', color: 'Barva / balayage', treat: 'Péče / OlaPlex',
        event: 'Svatba / příležitost', other: 'Jiné / poradenství'
    };
    const setNote = (msg, ok) => {
        note.textContent = msg;
        note.style.color = ok ? 'var(--teal, #1B3A47)' : 'var(--rose, #C97B7B)';
    };

    f.addEventListener('submit', async e => {
        e.preventDefault();
        // Read by ID — `f.name` would resolve to the form's name attribute, not the input.
        const name    = $('#rname').value.trim();
        const email   = $('#remail').value.trim();
        const service = $('#rservice').value;

        if (!name || !email || !service) {
            setNote('Vyplňte prosím jméno, e-mail a vyberte službu.', false); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setNote('Zkontrolujte prosím e-mailovou adresu.', false); return;
        }
        if (f['bot-field'] && f['bot-field'].value) return;   // honeypot

        const fd = new FormData(f);
        fd.delete('bot-field');
        fd.set('service', LABELS[service] || service);        // human-readable in the e-mail

        const original = btn.textContent;
        btn.disabled = true; btn.textContent = 'Odesíláme…';
        setNote('', true);

        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: fd
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && String(data.success) === 'true') {
                setNote('Děkujeme! Vaši poptávku jsme přijali — ozveme se nejpozději do druhého pracovního dne.', true);
                f.reset();
            } else {
                throw new Error(data.message || 'fail');
            }
        } catch (err) {
            setNote('Omlouváme se, odeslání se nezdařilo. Zkuste to prosím znovu, nebo nám zavolejte na 731 472 773.', false);
        } finally {
            btn.disabled = false; btn.textContent = original;
        }
    });
})();

/* ---------- YEAR ---------- */
(function year() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
})();

})();
