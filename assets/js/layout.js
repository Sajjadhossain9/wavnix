(function () {
  async function loadFragment(targetId, path) {
    var target = document.getElementById(targetId);
    if (!target) return;
    var response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error("Could not load " + path);
    target.innerHTML = await response.text();
  }

  Promise.all([
    loadFragment("site-header", "/partials/header.html"),
    loadFragment("site-footer", "/partials/footer.html")
  ]).then(function () {
    document.querySelectorAll("[data-current-year]").forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });
    window.__wavnixLayoutReady = true;
    document.dispatchEvent(new CustomEvent("wavnix:layout-ready"));
  }).catch(function (error) {
    console.error("Wavnix layout failed to load:", error);
  });
})();
