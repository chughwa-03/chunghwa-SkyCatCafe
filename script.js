/* 하늘고양이 카페 | 랜딩페이지 이동 보조 */
(function () {
  "use strict";

  const views = new Set([
    "#view-home",
    "#view-menu",
    "#view-about",
    "#view-location",
    "#view-contact",
  ]);
  const navLinks = document.querySelectorAll(
    ".desktop-nav a[href^='#view-'], .mobile-navigation a[href^='#view-']"
  );
  const mobileNav = document.querySelector(".mobile-navigation");

  function currentView() {
    const hash = window.location.hash;
    if (views.has(hash)) return hash;
    if (hash === "#gallery" || hash.startsWith("#photo-")) return "#view-about";
    return "#view-home";
  }

  function syncNavigation() {
    const active = currentView();
    navLinks.forEach((link) => {
      if (link.getAttribute("href") === active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
    if (mobileNav) mobileNav.open = false;
  }

  if (mobileNav) {
    mobileNav.addEventListener("click", (event) => {
      if (event.target.closest("nav a[href]")) mobileNav.open = false;
    });
  }

  // 기본 HTML 앵커를 유지해 JS 없이도 공식 홈페이지로 이동할 수 있다.
  // 공식 홈페이지 링크를 가로채지 않으므로 브라우저 뒤로 가기도 가능하다.
  window.addEventListener("hashchange", syncNavigation);
  window.addEventListener("pageshow", syncNavigation);
  syncNavigation();
})();
