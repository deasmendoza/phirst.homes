// PHIRST.HOMES — small progressive-enhancement script (no dependencies).
(() => {
  // Mobile menu
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (header && toggle && menu) {
    const setOpen = open => {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
      menu.hidden = !open;
    };
    toggle.addEventListener("click", () => setOpen(menu.hidden));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { setOpen(false); toggle.focus(); } });
    window.matchMedia("(min-width: 810px)").addEventListener("change", e => { if (e.matches) setOpen(false); });
  }

  // Featured carousel arrows (native scroll + snap; arrows move one card)
  document.querySelectorAll("[data-carousel]").forEach(track => {
    const section = track.closest("section");
    const prev = section?.querySelector("[data-carousel-prev]");
    const next = section?.querySelector("[data-carousel-next]");
    const step = () => {
      const item = track.querySelector(".carousel__item");
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth;
    };
    const update = () => {
      if (!prev || !next) return;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    prev?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    next?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  // Contact form: pre-select model/location from links like /contact/?model=Unna
  const params = new URLSearchParams(location.search);
  document.querySelectorAll("[data-prefill]").forEach(sel => {
    const want = (params.get(sel.dataset.prefill) || "").toLowerCase();
    if (!want) return;
    const match = [...sel.options].find(o => o.value && (want.startsWith(o.value.toLowerCase()) || o.value.toLowerCase().startsWith(want.split(",")[0])));
    if (match) sel.value = match.value;
  });
})();
