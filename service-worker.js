const CACHE_NAME = "amedas-rank-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// インストール時にアプリシェルをキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ネットワーク優先、失敗時はキャッシュ（アプリシェル用）
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 気象庁APIはキャッシュしない（常に最新を取る）
  if (url.hostname.includes("jma.go.jp")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // アプリ本体はネットワーク優先 → 失敗時キャッシュ
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
