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

async function flagRestricted(tabId) {
  // علامة حمرا على الأيقونة توضح إن الصفحة دي ممنوعة (chrome:// أو متجر كروم)
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#C0392B' });
    await chrome.action.setBadgeText({ tabId: tabId, text: '✕' });
    await chrome.action.setTitle({ tabId: tabId, title: 'نطق: الصفحة دي ممنوعة — افتح موقع عادي (https) ودوس تاني' });
  } catch (e) {}
}

// دوس الأيقونة: حقن اللوحة عند الطلب وفتح/قفلها في نفس الصفحة
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  try {
    // الحقن عند الطلب بيغطي التابات اللي اتحملت قبل تركيب الإضافة
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await chrome.tabs.sendMessage(tab.id, { type: 'nataq-toggle' });
    await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    await chrome.action.setTitle({ tabId: tab.id, title: 'نطق | Nataq' });
  } catch (e) {
    flagRestricted(tab.id);
  }
});
