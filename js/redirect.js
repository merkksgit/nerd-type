/**
 * Redirect script for nerdtypegame.com → nerdtypegame.org migration
 * Preserves URL path, query parameters, and hash fragments
 */
(function () {
  const NEW_DOMAIN = "https://nerdtypegame.org";
  const REDIRECT_DELAY = 5000;

  const currentPath =
    window.location.pathname +
    window.location.search +
    window.location.hash;
  const newUrl = NEW_DOMAIN + currentPath;

  const style = document.createElement("style");
  style.textContent = `
    .redirect-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1a1b26;
      color: #c0caf5;
      padding: 1rem;
      text-align: center;
      font-family: monospace;
      z-index: 10000;
      border-bottom: 2px solid #7aa2f7;
    }
    .redirect-banner a {
      color: #7aa2f7;
      text-decoration: none;
      border-bottom: 1px solid #7aa2f7;
    }
    .redirect-banner a:hover {
      color: #9abdf5;
    }
  `;
  document.head.appendChild(style);

  const banner = document.createElement("div");
  banner.className = "redirect-banner";
  banner.innerHTML = `
    <strong>NerdType has moved!</strong>
    Redirecting to <a href="${newUrl}">${newUrl}</a> in 5 seconds...
  `;

  document.body.insertBefore(banner, document.body.firstChild);

  setTimeout(function () {
    window.location.href = newUrl;
  }, REDIRECT_DELAY);
})();
