// نطق | Nataq - Voice dictation panel
// By svmovo
// الأيقونة بتترسم في وقت التشغيل (OffscreenCanvas) — الإضافة من غير أي ملفات صور

function drawIcon(size) {
  var c = new OffscreenCanvas(size, size);
  var x = c.getContext('2d');
  var w = size;

  function rr(l, t, r, b, rad) {
    x.beginPath();
    x.moveTo(l + rad, t);
    x.arcTo(r, t, r, b, rad);
    x.arcTo(r, b, l, b, rad);
    x.arcTo(l, b, l, t, rad);
    x.arcTo(l, t, r, t, rad);
    x.closePath();
  }

  // الخلفية الغامقة
  var g = x.createLinearGradient(0, 0, 0, w);
  g.addColorStop(0, '#241A2B');
  g.addColorStop(1, '#1B1220');
  rr(0, 0, w, w, w * 0.22);
  x.fillStyle = g;
  x.fill();

  // الإطار العنابي
  rr(w * 0.04, w * 0.04, w * 0.96, w * 0.96, w * 0.19);
  x.strokeStyle = '#7A1C38';
  x.lineWidth = Math.max(1, w * 0.05);
  x.stroke();

  // جسم المايك
  var cx = w / 2;
  var white = '#EFEAF2';
// By svmovo
// الأيقونة بتترسم في وقت التشغيل (OffscreenCanvas) — الإضافة من غير أي ملفات صور

function drawIcon(size) {
  var c = new OffscreenCanvas(size, size);
  var x = c.getContext('2d');
  var w = size;

  function rr(l, t, r, b, rad) {
    x.beginPath();
    x.moveTo(l + rad, t);
    x.arcTo(r, t, r, b, rad);
    x.arcTo(r, b, l, b, rad);
    x.arcTo(l, b, l, t, rad);
    x.arcTo(l, t, r, t, rad);
    x.closePath();
  }

  // الخلفية الغامقة
  var g = x.createLinearGradient(0, 0, 0, w);
  g.addColorStop(0, '#241A2B');
  g.addColorStop(1, '#1B1220');
  rr(0, 0, w, w, w * 0.22);
  x.fillStyle = g;
  x.fill();

  // الإطار العنابي
  rr(w * 0.04, w * 0.04, w * 0.96, w * 0.96, w * 0.19);
  x.strokeStyle = '#7A1C38';
  x.lineWidth = Math.max(1, w * 0.05);
  x.stroke();

  // جسم المايك
  var cx = w / 2;
  var white = '#EFEAF2';
  x.fillStyle = white;
  rr(cx - w * 0.12, w * 0.20, cx + w * 0.12, w * 0.56, w * 0.12);
  x.fill();

  // قوس المايك
  x.strokeStyle = '#C93A5E';
  x.lineWidth = Math.max(1, w * 0.05);
  x.lineCap = 'round';
  x.beginPath();
  x.arc(cx, w * 0.50, w * 0.20, Math.PI * 0.15, Math.PI * 0.85);
  x.stroke();

  // القاعدة
  x.strokeStyle = white;
  x.beginPath();
  x.moveTo(cx, w * 0.68);
  x.lineTo(cx, w * 0.80);
  x.moveTo(cx - w * 0.12, w * 0.80);
  x.lineTo(cx + w * 0.12, w * 0.80);
  x.stroke();

  return x.getImageData(0, 0, size, size);
}

function setToolbarIcon() {
  try {
    chrome.action.setIcon({
      imageData: { 16: drawIcon(16), 48: drawIcon(48), 128: drawIcon(128) }
    });
  } catch (e) { /* كروم هيحط أيقونة افتراضية */ }
}

chrome.runtime.onInstalled.addListener(setToolbarIcon);
chrome.runtime.onStartup.addListener(setToolbarIcon);
setToolbarIcon();

// دوس الأيقونة: يفتح/يقفل اللوحة العائمة في نفس الصفحة، من غير أي تاب جديد
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "nataq-toggle" });
  } catch (e) {
    // الصفحة اتحملت قبل تركيب الإضافة: حقن السكربت وجرب تاني
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      await chrome.tabs.sendMessage(tab.id, { type: "nataq-toggle" });
    } catch (e2) {
      // صفحات النظام (chrome://) ممنوع الحقن فيها
    }
  }
});
