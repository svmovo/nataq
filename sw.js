// نطق | Nataq - Voice dictation panel
// By svmovo
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
