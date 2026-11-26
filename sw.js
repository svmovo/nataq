// إملاء بالصوت - Voice Dictation
// By svmovo
// يفتح صفحة التسجيل في تاب جديد لما تدوس على أيقونة الإضافة
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("recorder.html") });
});
