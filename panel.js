// نطق | Nataq - Voice dictation panel
// By svmovo
(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var toggleBtn = document.getElementById('toggle');
  var langSel = document.getElementById('lang');
  var statusEl = document.getElementById('status');
  var liveEl = document.getElementById('live');
  var textEl = document.getElementById('text');
  var copyBtn = document.getElementById('copy');
  var copyClearBtn = document.getElementById('copyClear');
  var clearBtn = document.getElementById('clear');
  var closeBtn = document.getElementById('close');

  closeBtn.addEventListener('click', function () {
    if (listening && rec) { listening = false; try { rec.stop(); } catch (err) {} }
    window.parent.postMessage({ nataq: 'close' }, '*');
  });

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = 'nt-status' + (kind ? ' ' + kind : '');
  }

  if (!SR) {
    toggleBtn.disabled = true;
    setStatus('المتصفح ده مش بيدعم تحويل الصوت لكلام. جرب كروم على اللابتوب.', 'err');
    return;
  }

  var rec = null;
  var listening = false;

  function makeRec() {
    var r = new SR();
    r.lang = langSel.value;
    r.continuous = true;
    r.interimResults = true;

    r.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var res = e.results[i];
        if (res.isFinal) {
          var piece = res[0].transcript.trim();
          if (piece) {
            textEl.value = (textEl.value ? textEl.value.replace(/\s+$/, '') + ' ' : '') + piece;
            textEl.scrollTop = textEl.scrollHeight;
          }
        } else {
          interim += res[0].transcript;
        }
      }
      liveEl.textContent = interim;
    };

    r.onerror = function (e) {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        listening = false;
        setUi();
        setStatus('المايك مقفول. اسمح للمايك من أيقونة القفل جنب الرابط وجرب تاني.', 'err');
      } else if (e.error === 'no-speech') {
        setStatus('مفيش صوت وصل، كلم أعلى شوية أو قرّب من المايك.');
      } else if (e.error === 'network') {
        setStatus('مشكلة في النت، التحويل محتاج إنترنت شغال.', 'err');
      } else if (e.error === 'audio-capture') {
        listening = false;
        setUi();
        setStatus('المايك مش موجود أو مش شغال.', 'err');
      } else {
        setStatus('حصل خطأ: ' + e.error, 'err');
      }
    };

    // كروم بيقف لوحده بعد فترة سكوت، فرجّعه طالما لسه بنسجل
    r.onend = function () {
      if (listening) {
        try { r.start(); } catch (err) {}
      } else {
        liveEl.textContent = '';
        setUi();
      }
    };

    return r;
  }

  function setUi() {
    if (listening) {
      toggleBtn.textContent = '⏹️ وقّف';
      toggleBtn.classList.add('recording');
      setStatus('بيسمعك... اتكلم');
    } else {
      toggleBtn.textContent = '🎙️ اتكلم';
      toggleBtn.classList.remove('recording');
      if (!statusEl.classList.contains('err')) setStatus('جاهز.');
    }
  }

  toggleBtn.addEventListener('click', function () {
    if (listening) {
      listening = false;
      if (rec) { try { rec.stop(); } catch (err) {} }
      setUi();
    } else {
      rec = makeRec();
      try {
        rec.start();
        listening = true;
        setUi();
      } catch (err) {
        setStatus('ماقدرش يبدأ التسجيل، جرب تاني.', 'err');
      }
    }
  });

  function doCopy(cb) {
    var text = textEl.value;
    if (!text) { setStatus('مفيش نص عشان يتنسخ.', 'err'); return; }
    function done() {
      setStatus('اتنسخ ✅ الصقه في أي مكان.', 'ok');
      if (cb) cb();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        fallbackCopy(); done();
      });
    } else {
      fallbackCopy(); done();
    }
  }

  function fallbackCopy() {
    textEl.focus();
    textEl.select();
    try { document.execCommand('copy'); } catch (err) {}
    window.getSelection().removeAllRanges();
  }

  copyBtn.addEventListener('click', function () { doCopy(null); });
  copyClearBtn.addEventListener('click', function () {
    doCopy(function () { textEl.value = ''; liveEl.textContent = ''; });
  });
  clearBtn.addEventListener('click', function () {
    textEl.value = '';
    liveEl.textContent = '';
    setStatus('جاهز.');
  });
})();
