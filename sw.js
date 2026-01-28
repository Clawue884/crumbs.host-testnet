const CACHE = "crumbs-core-v1";
const ASSETS = [
  "launcher.html",
  "omega-console.html",
  "cosmic-core.html",
  "god-ai-core.html",
  "quantum-sentinel.html",
  "public/wallet.html",
  "manifest.json"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});
