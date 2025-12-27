// Simple toggle that switches colors (keeps glass effect) — persists in localStorage
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle-theme");
  const body = document.body;
  const key = "gw_dark";

  function apply(dark){
    if(dark){
      document.documentElement.style.setProperty('--glass-bg', 'rgba(0,0,0,0.22)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(255,255,255,0.06)');
      toggle.textContent = "Light";
    } else {
      document.documentElement.style.setProperty('--glass-bg', 'rgba(255,255,255,0.12)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(255,255,255,0.18)');
      toggle.textContent = "Dark";
    }
  }

  const saved = localStorage.getItem(key) === "1";
  apply(saved);

  toggle.addEventListener("click", () => {
    const cur = localStorage.getItem(key) === "1";
    localStorage.setItem(key, cur ? "0" : "1");
    apply(!cur);
  });
});
