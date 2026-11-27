// نطق | Nataq - Voice dictation panel
// By svmovo
// بيحقن لوحة عائمة (iframe من الإضافة نفسها) جوه الصفحة الحالية
(function () {
  if (window.__nataqLoaded) return;
  window.__nataqLoaded = true;

  var host = null;

  function ensureHost() {
    if (host && document.documentElement.contains(host)) return host;
    host = document.createElement("div");
    host.id = "nataq-panel-host";
    host.style.cssText =
      "position:fixed;top:12px;left:50%;transform:translateX(-50%);" +
      "width:min(480px,94vw);height:480px;z-index:2147483647;display:none;";
    var frame = document.createElement("iframe");
    frame.src = chrome.runtime.getURL("panel.html");
    frame.setAttribute("allow", "microphone");
    frame.style.cssText = "width:100%;height:100%;border:none;background:transparent;";
    host.appendChild(frame);
    (document.body || document.documentElement).appendChild(host);
    return host;
  }

  function toggle() {
    var h = ensureHost();
    h.style.display = h.style.display === "none" ? "block" : "none";
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.type === "nataq-toggle") toggle();
  });

  // زرار القفل جوه اللوحة
  window.addEventListener("message", function (ev) {
    if (ev.data && ev.data.nataq === "close" && host) host.style.display = "none";
  });
})();
