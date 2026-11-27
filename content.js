// نطق | Nataq - Voice dictation panel
// By svmovo
// اللوحة بتتبني جوه الصفحة نفسها (Shadow DOM) والتعرف على الصوت بيشتغل في سياق الصفحة
// علشان إذن المايك يتطلب للموقع نفسه — مش لصفحة الإضافة (كروم بيرفض المايك هناك)
(function () {
  if (window.__nataqLoaded) return;
  window.__nataqLoaded = true;

  var C = {
    bg: '#1B1220', card: '#241A2B', btn: '#2A2130', border: '#4A3A52',
    text: '#EFEAF2', dim: '#B9AFC2', red: '#7A1C38', redBorder: '#9B2A4B',
    redStop: '#5B1A1A', err: '#FCA5A5', ok: '#86EFAC', faint: '#6f6279'
  };

  var host = null, shadow = null;

  function el(tag, styles, text) {
    var e = document.createElement(tag);
    if (styles) for (var k in styles) e.style[k] = styles[k];
    if (text != null) e.textContent = text;
    return e;
  }

  function makeLogo() {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('width', '26');
    svg.setAttribute('height', '26');
    function n(tag, attrs) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      svg.appendChild(e);
    }
    n('rect', { x: 1.5, y: 1.5, width: 45, height: 45, rx: 10, fill: C.card, stroke: C.red, 'stroke-width': 3 });
    n('rect', { x: 18, y: 8, width: 12, height: 18, rx: 6, fill: C.text });
    n('path', { d: 'M13 22 A 11 11 0 0 0 35 22', fill: 'none', stroke: '#C93A5E', 'stroke-width': 3, 'stroke-linecap': 'round' });
    n('line', { x1: 24, y1: 33, x2: 24, y2: 39, stroke: C.text, 'stroke-width': 3, 'stroke-linecap': 'round' });
    n('line', { x1: 18, y1: 39, x2: 30, y2: 39, stroke: C.text, 'stroke-width': 3, 'stroke-linecap': 'round' });
    return svg;
  }

  function btn(label, extra) {
    var b = el('button', {
      border: '1px solid ' + C.border, background: C.btn, color: C.text,
      borderRadius: '8px', padding: '5px 12px', font: '600 13px "Segoe UI", Tahoma, sans-serif',
      cursor: 'pointer'
    }, label);
    b.type = 'button';
    if (extra) for (var k in extra) b.style[k] = extra[k];
    return b;
  }

  // عناصر اللوحة
  var toggleBtn, langSel, statusEl, liveEl, textEl, copyBtn, copyClearBtn, clearBtn, closeBtn;

  function build() {
    if (host && document.documentElement.contains(host)) return;
    host = el('div', {
      position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
      width: 'min(480px,94vw)', zIndex: '2147483647', display: 'none',
      direction: 'rtl'
    });
    host.id = 'nataq-shadow-host';
    shadow = host.attachShadow({ mode: 'open' });

    var bar = el('div', {
      background: C.bg, color: C.text, border: '1px solid ' + C.border,
      borderBottom: '2px solid ' + C.red, borderRadius: '12px',
      boxShadow: '0 4px 18px rgba(0,0,0,.5)', padding: '8px 10px 6px',
      font: '13px/1.5 "Segoe UI", Tahoma, sans-serif'
    });

    // الهيدر: لوجو + اسم + لغة + قفل
    var head = el('div', { display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px' });
    head.appendChild(makeLogo());
    head.appendChild(el('span', { fontWeight: '700', fontSize: '15px' }, 'نطق'));
    langSel = el('select', {
      background: C.btn, color: C.text, border: '1px solid ' + C.border,
      borderRadius: '8px', padding: '4px 8px', font: '600 12px "Segoe UI", Tahoma, sans-serif'
    });
    langSel.setAttribute('aria-label', 'اللغة');
    [['ar-EG', 'عربي مصر'], ['ar-SA', 'فصحى'], ['en-US', 'English']].forEach(function (p) {
      var o = el('option', {}, p[1]); o.value = p[0]; langSel.appendChild(o);
    });
    head.appendChild(langSel);
    closeBtn = btn('✕', { marginInlineStart: 'auto', padding: '4px 9px' });
    closeBtn.title = 'اقفل';
    head.appendChild(closeBtn);
    bar.appendChild(head);

    // صف المايك
    var row1 = el('div', { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' });
    toggleBtn = btn('🎙️ اتكلم', { background: C.red, borderColor: C.redBorder, fontSize: '15px', padding: '7px 20px' });
    statusEl = el('span', { color: C.dim, fontSize: '12px' }, 'جاهز. دوس «اتكلم» وابدأ كلام.');
    row1.appendChild(toggleBtn);
    row1.appendChild(statusEl);
    bar.appendChild(row1);

    liveEl = el('div', {
      minHeight: '22px', color: C.dim, fontSize: '13px', padding: '2px 2px 4px',
      borderBottom: '1px dashed ' + C.border
    });
    bar.appendChild(liveEl);

    textEl = el('textarea', {
      width: '100%', height: '170px', marginTop: '6px', background: C.card, color: '#E7DFEE',
      border: '1px solid ' + C.border, borderRadius: '10px', padding: '8px 10px',
      font: '14px/1.7 "Segoe UI", Tahoma, sans-serif', resize: 'none', boxSizing: 'border-box'
    });
    textEl.placeholder = 'النص هيطلع هنا...';
    bar.appendChild(textEl);

    var row2 = el('div', { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0 2px', flexWrap: 'wrap' });
    copyBtn = btn('📋 انسخ');
    copyClearBtn = btn('📋 انسخ وامسح');
    clearBtn = btn('🗑️ امسح');
    row2.appendChild(copyBtn); row2.appendChild(copyClearBtn); row2.appendChild(clearBtn);
    bar.appendChild(row2);

    bar.appendChild(el('div', { textAlign: 'center', color: C.faint, fontSize: '11px', paddingTop: '4px' }, 'By svmovo'));
    shadow.appendChild(bar);
    (document.body || document.documentElement).appendChild(host);
    wire();
  }

  // ===== منطق التعرف على الصوت =====
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null, listening = false;

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.style.color = kind === 'err' ? C.err : kind === 'ok' ? C.ok : C.dim;
  }

  function setUi() {
    if (listening) {
      toggleBtn.textContent = '⏹️ وقّف';
      toggleBtn.style.background = C.redStop;
      toggleBtn.style.borderColor = C.err;
      setStatus('بيسمعك... اتكلم');
    } else {
      toggleBtn.textContent = '🎙️ اتكلم';
      toggleBtn.style.background = C.red;
      toggleBtn.style.borderColor = C.redBorder;
      setStatus('جاهز.');
    }
  }

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
        listening = false; setUi();
        setStatus('المايك مقفول. اسمح للمايك من أيقونة القفل جنب رابط الموقع وجرب تاني.', 'err');
      } else if (e.error === 'no-speech') {
        setStatus('مفيش صوت وصل، كلم أعلى شوية أو قرّب من المايك.');
      } else if (e.error === 'network') {
        setStatus('مشكلة في النت، التحويل محتاج إنترنت شغال.', 'err');
      } else if (e.error === 'audio-capture') {
        listening = false; setUi();
        setStatus('المايك مش موجود أو مش شغال.', 'err');
      } else {
        setStatus('حصل خطأ: ' + e.error, 'err');
      }
    };

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

  function fallbackCopy() {
    textEl.focus();
    textEl.select();
    try { document.execCommand('copy'); } catch (err) {}
    window.getSelection().removeAllRanges();
  }

  function doCopy(cb) {
    var text = textEl.value;
    if (!text) { setStatus('مفيش نص عشان يتنسخ.', 'err'); return; }
    function done() { setStatus('اتنسخ ✅ الصقه في أي مكان.', 'ok'); if (cb) cb(); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(); done(); });
    } else {
      fallbackCopy(); done();
    }
  }

  function wire() {
    if (!SR) {
      toggleBtn.disabled = true;
      setStatus('الصفحة دي مش بتدعم تحويل الصوت (لازم صفحة https عادية، مش صفحة داخلية لكروم).', 'err');
    }
    toggleBtn.addEventListener('click', function () {
      if (!SR) return;
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
    copyBtn.addEventListener('click', function () { doCopy(null); });
    copyClearBtn.addEventListener('click', function () { doCopy(function () { textEl.value = ''; liveEl.textContent = ''; }); });
    clearBtn.addEventListener('click', function () { textEl.value = ''; liveEl.textContent = ''; setStatus('جاهز.'); });
    closeBtn.addEventListener('click', function () {
      if (listening && rec) { listening = false; try { rec.stop(); } catch (err) {} }
      host.style.display = 'none';
    });
  }

  function toggle() {
    build();
    host.style.display = host.style.display === 'none' ? 'block' : 'none';
    if (host.style.display === 'none' && listening && rec) {
      listening = false;
      try { rec.stop(); } catch (err) {}
    }
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.type === 'nataq-toggle') toggle();
  });
})();
