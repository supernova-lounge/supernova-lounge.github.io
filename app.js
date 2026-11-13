(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s).toLowerCase().replace(/ё/g, "е").replace(/[«»"]/g, "").trim();
  const rub = n => new Intl.NumberFormat("ru-RU").format(n).replace(/\s/g, " ");
  const pad = n => String(n).padStart(2, "0");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Линейные иллюстрации разделов */
  const ART = {
    hookah: '<ellipse class="o" cx="32" cy="36" rx="28" ry="8" transform="rotate(-18 32 36)"/><path d="M20 58C10 46 36 42 28 30S42 16 38 5"/><path d="M26 58C17 47 40 43 33 32S46 19 43 8" opacity=".45"/><circle class="p" cx="56" cy="28" r="1.8"/>',
    tea: '<path d="M10 54C10 28 27 11 54 9 54 37 37 54 10 54z"/><path d="M10 54 42 22"/><path d="M22 42l7 1M28 35l8 1M32 29l7 1" opacity=".55"/><path class="o" d="M52 16v6M49 19h6"/><circle class="p" cx="52" cy="48" r="1.6"/>',
    bar: '<path d="M14 10h36L32 34z"/><path d="M32 34v19M21 56h22"/><ellipse class="o" cx="32" cy="24" rx="28" ry="6.5" transform="rotate(-14 32 24)"/><circle class="p" cx="54" cy="17" r="1.8"/>',
    kitchen: '<circle cx="32" cy="32" r="26"/><circle cx="32" cy="32" r="17" opacity=".6"/><circle cx="32" cy="32" r="8"/><circle class="p" cx="50.4" cy="13.6" r="2"/><circle class="p" cx="20" cy="44" r="1.5"/><path class="o" d="M32 3v5M32 56v5M3 32h5M56 32h5" opacity=".7"/>'
  };
  const art = id => `<svg class="cat-art" viewBox="0 0 64 64" aria-hidden="true">${ART[id] || ""}</svg>`;
  const spark = cls => `<svg class="${cls}" aria-hidden="true"><use href="#spark"/></svg>`;

  const menuEl = $("#menu"), tabsEl = $("#tabs"), emptyEl = $("#empty"), q = $("#q");
  const cats = window.MENU;

  /* ---------- Рендер ---------- */
  function row(it, n) {
    const [name, desc, price] = it;
    return `<li class="item"><div class="item-line"><span class="item-n">${pad(n)}</span><h4 class="item-name">${esc(name)}</h4><span class="leader"></span><span class="item-price">${rub(price)}<small>₽</small></span></div><p class="item-desc">${esc(desc)}</p></li>`;
  }
  function sig(it, n) {
    const [name, desc, price] = it;
    return `<li class="sig"><span class="sig-n">${pad(n)}</span>${spark("sig-spark")}<h4 class="sig-name">${esc(name)}</h4><p class="sig-desc">${esc(desc)}</p><p class="sig-price">${rub(price)}<small>₽</small></p></li>`;
  }
  function sub(s) {
    const body = s.signature
      ? `<ul class="sigs">${s.items.map((it, i) => sig(it, i + 1)).join("")}</ul>`
      : `<ul class="items">${s.items.map((it, i) => row(it, i + 1)).join("")}</ul>`;
    return `<section class="sub${s.signature ? " is-sig" : ""}"><h3 class="sub-title">${s.signature ? '<span class="tag">Фирменное</span>' : ""}${esc(s.name)}<span class="sub-count">${s.items.length}</span></h3>${body}</section>`;
  }
  function render(term = "") {
    let shown = 0;
    menuEl.innerHTML = cats.map((c, ci) => {
      const subs = c.subs.map(s => {
        if (!term) return s;
        const hitAll = norm(c.name).includes(term) || norm(s.name).includes(term);
        const items = hitAll ? s.items : s.items.filter(it => norm(it[0]).includes(term) || norm(it[1]).includes(term));
        return { ...s, items };
      }).filter(s => s.items.length);
      if (!subs.length) return "";
      shown += subs.length;
      return `<article class="cat" id="${c.id}" data-i="${ci}">
        <header class="cat-head">
          <p class="cat-index">${pad(ci + 1)}<span>/ ${pad(cats.length)}</span></p>
          <h2 class="cat-name">${esc(c.name)}</h2>
          <p class="cat-lead">${esc(c.lead)}</p>
          ${art(c.id)}
        </header>
        <div class="cat-body">${subs.map(sub).join("")}</div>
      </article>`;
    }).join("");
    emptyEl.hidden = shown > 0;
    observeCats();
    reveal();
  }

  /* ---------- Вкладки + подсветка текущего раздела ---------- */
  tabsEl.innerHTML = cats.map((c, i) =>
    `<a class="tab" role="tab" href="#${c.id}" data-id="${c.id}"><span>${pad(i + 1)}</span>${esc(c.name)}</a>`).join("");
  const tabs = [...tabsEl.querySelectorAll(".tab")];
  function setActive(id) {
    tabs.forEach(t => {
      const on = t.dataset.id === id;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on);
      if (on) tabsEl.scrollTo({ left: t.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" });
    });
  }
  let spy;
  function observeCats() {
    spy && spy.disconnect();
    spy = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    menuEl.querySelectorAll(".cat").forEach(el => spy.observe(el));
  }
  tabsEl.addEventListener("click", e => {
    const t = e.target.closest(".tab"); if (!t) return;
    e.preventDefault();
    if (q.value) { q.value = ""; render(); }
    const el = document.getElementById(t.dataset.id); if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - $("#bar").offsetHeight + 1;
    scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    setActive(t.dataset.id);
  });

  /* ---------- Поиск ---------- */
  const searchBox = $("#search"), searchBtn = $("#searchBtn");
  function openSearch(open) {
    searchBox.hidden = !open;
    searchBtn.setAttribute("aria-expanded", open);
    document.body.classList.toggle("searching", open);
    if (open) {
      const y = menuEl.getBoundingClientRect().top + scrollY - $("#bar").offsetHeight;
      if (scrollY < y) scrollTo({ top: y, behavior: "auto" });
      q.focus();
    } else if (q.value) { q.value = ""; render(); }
  }
  searchBtn.addEventListener("click", () => openSearch(searchBox.hidden));
  $("#searchClose").addEventListener("click", () => openSearch(false));
  q.addEventListener("input", () => {
    render(norm(q.value));
    const y = menuEl.getBoundingClientRect().top + scrollY - $("#bar").offsetHeight;
    if (scrollY > y) scrollTo({ top: y, behavior: "auto" });
  });
  q.addEventListener("keydown", e => { if (e.key === "Escape") openSearch(false); });

  /* ---------- Часы работы: Вс–Чт 12–00, Пт–Сб 12–02 ---------- */
  function status(now = new Date()) {
    const d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
    const closeOf = day => (day === 5 || day === 6) ? 26 : 24; // пятница и суббота — до 02:00
    const prev = (d + 6) % 7;
    if (h >= 12) return { open: true, until: closeOf(d) === 26 ? "02:00" : "00:00" };
    if (h < closeOf(prev) - 24) return { open: true, until: "02:00" };
    return { open: false };
  }
  const st = status();
  $("#status").classList.toggle("closed", !st.open);
  $("#statusText").textContent = st.open ? `Открыто до ${st.until}` : "Откроемся в 12:00";

  /* ---------- Акции ---------- */
  const now = new Date();
  const isNov = now.getMonth() === 10;
  const happy = now.getHours() >= 12 && now.getHours() < 17;
  $("#offerNov").hidden = !isNov;
  if (!isNov) document.querySelector(".offers").classList.add("single");
  $("#happyLive").hidden = !happy;
  const promos = [
    ...(isNov ? ["−15% на любой счёт весь ноябрь"] : []),
    "Горячий напиток в подарок к кальяну с 12:00 до 17:00",
    "Вс — Чт 12:00 — 00:00",
    "Пт — Сб 12:00 — 02:00",
  ];
  const strip = promos.map(p => `<span>${esc(p)}</span>${spark("tk-spark")}`).join("");
  $("#ticker").innerHTML = strip + strip + strip + strip;

  /* ---------- Плавное появление ---------- */
  let io;
  function reveal() {
    if (reduce || !("IntersectionObserver" in window)) return;
    io && io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    menuEl.querySelectorAll(".cat-head, .sub").forEach(el => { el.classList.add("rv"); io.observe(el); });
  }

  render();
})();
