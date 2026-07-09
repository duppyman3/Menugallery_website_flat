// Reveal-on-scroll — port of components/Reveal.tsx.
// Elements ship as data-reveal="idle" (visible). Anything already near the
// viewport stays idle; the rest animate in when scrolled into view.
document.addEventListener("DOMContentLoaded", function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof IntersectionObserver === "undefined") return;

  var observer = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        entries[i].target.setAttribute("data-reveal", "visible");
        observer.unobserve(entries[i].target);
      }
    }
  }, { threshold: 0.15 });

  var els = document.querySelectorAll("[data-reveal]");
  for (var i = 0; i < els.length; i++) {
    if (els[i].getBoundingClientRect().top < window.innerHeight * 0.9) continue;
    els[i].setAttribute("data-reveal", "pending");
    observer.observe(els[i]);
  }
});
