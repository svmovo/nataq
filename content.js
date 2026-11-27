// نطق | Nataq - Voice dictation panel
// By svmovo
// اللوحة بتتبني Shadow DOM جوه الصفحة نفسها عشان كروم يدي إذن المايك للموقع مش للإضافة
// الشكل iOS: زجاج مضبب، حواف مدورة، حركات ناعمة — كل التنسيقات inline + WAAPI عشان تعيش مع أي CSP
(function () {
  if (window.__nataqLoaded) return;
  window.__nataqLoaded = true;

  var C = {
    glass: 'rgba(24,19,29,.88)', card: 'rgba(255,255,255,.06)',
    track: 'rgba(255,255,255,.08)', pill: 'rgba(255,255,255,.16)',
    border: 'rgba(255,255,255,.14)', hairline: 'rgba(255,255,255,.08)',
    text: '#F5F1F7', dim: 'rgba(235,229,240,.6)', faint: 'rgba(235,229,240,.38)',
    red: '#C93A5E', redDeep: '#7A1C38', redStop: '#E5484D',
    err: '#FF8FA3', ok: '#7BDEB0'
  };
  var FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Tahoma,sans-serif';
  var SPRING = 'cubic-bezier(.32,.72,0,1)';

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
    svg.setAttribute('width', '28');
    svg.setAttribute('height', '28');
    function n(tag, attrs) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      svg.appendChild(e);
    }
    n('rect', { x: 1.5, y: 1.5, width: 45, height: 45, rx: 12, fill: 'rgba(201,58,94,.16)', stroke: C.red, 'stroke-width': 2.5 });
    n('rect', { x: 18, y: 8, width: 12, height: 18, rx: 6, fill: C.text });
    n('path', { d: 'M13 22 A 11 11 0 0 0 35 22', fill: 'none', stroke: C.red, 'stroke-width': 3, 'stroke-linecap': 'round' });
    n('line', { x1: 24, y1: 33, x2: 24, y2: 39, stroke: C.text, 'stroke-width': 3, 'stroke-linecap': 'round' });
    n('line', { x1: 18, y1: 39, x2: 30, y2: 39, stroke: C.text, 'stroke-width': 3, 'stroke-linecap': 'round' });
    return svg;
  }

  function makeMicGlyph(size, color) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    function n(tag, attrs) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      svg.appendChild(e);
    }
    n('rect', { x: 9, y: 2.5, width: 6, height: 10, rx: 3, fill: color });
    n('path', { d: 'M5.5 11.5 a 6.5 6.5 0 0 0 13 0', fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round' });
    n('line', { x1: 12, y1: 18, x2: 12, y2: 21, stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round' });
    return svg;
  }

  // عناصر اللوحة
  var micBtn, micRing, segBtns = [], lang = 'ar-EG', statusEl, liveEl, textEl, copyBtn, copyClearBtn, clearBtn, closeBtn, panelBox;
  var pressAnims = [];

  function pressable(b) {
    b.addEventListener('pointerdown', function () {
      pressAnims.push(b.animate([{ transform: 'scale(1)' }, { transform: 'scale(.94)' }], { duration: 120, fill: 'forwards', easing: 'ease-out' }));
    });
    function release() {
      pressAnims.push(b.animate([{ transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 220, fill: 'forwards', easing: SPRING }));
    }
    b.addEventListener('pointerup', release);
    b.addEventListener('pointerleave', release);
  }

  function build() {
    if (host && document.documentElement.contains(host)) return;
    host = el('div', {
      position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)',
      width: 'min(460px,94vw)', zIndex: '2147483647', display: 'none', direction: 'rtl'
    });
    host.id = 'nataq-shadow-host';
    shadow = host.attachShadow({ mode: 'open' });

    // صندوق زجاجي بضبابية iOS
    panelBox = el('div', {
      background: C.glass, color: C.text,
      backdropFilter: 'blur(24px) saturate(180%)', webkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: '1px solid ' + C.border, borderRadius: '22px',
      boxShadow: '0 12px 40px rgba(0,0,0,.45), 0 2px 8px rgba(0,0,0,.3)',
      padding: '12px 14px 10px', font: '13px/1.5 ' + FONT
    });

    // الرأس: اللوجو + العنوان + زر القفل
    var head = el('div', { display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' });
    head.appendChild(makeLogo());
    head.appendChild(el('span', { fontWeight: '700', fontSize: '16px', letterSpacing: '.2px' }, 'نطق'));
    closeBtn = el('button', {
      width: '26px', height: '26px', borderRadius: '50%', border: 'none',
      background: 'rgba(255,255,255,.12)', color: C.dim, cursor: 'pointer',
      font: '600 13px/1 ' + FONT, marginInlineStart: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0'
    }, '✕');
    closeBtn.type = 'button';
    closeBtn.title = 'اقفل';
    pressable(closeBtn);
    head.appendChild(closeBtn);
    panelBox.appendChild(head);

    // اختيار اللغة بنمط Segmented Control بتاع iOS
    var seg = el('div', {
      display: 'flex', background: C.track, borderRadius: '10px',
      padding: '2px', gap: '2px', marginBottom: '12px'
    });
    [['ar-EG', 'عربي مصر'], ['ar-SA', 'فصحى'], ['en-US', 'English']].forEach(function (p, i) {
      var b = el('button', {
        flex: '1', border: 'none', borderRadius: '8px', padding: '5px 0',
        background: i === 0 ? C.pill : 'transparent',
        color: i === 0 ? C.text : C.dim, cursor: 'pointer',
        font: '600 12px ' + FONT, transition: 'background .18s,color .18s'
      }, p[1]);
      b.type = 'button';
      b.dataset.lang = p[0];
      b.addEventListener('click', function () { setLang(p[0]); });
      seg.appendChild(b);
      segBtns.push(b);
    });
    panelBox.appendChild(seg);

    // زر المايك الدائري الكبير + الحلقة النابضة
    var micRow = el('div', { display: 'flex', alignItems: 'center', gap: '12px', padding: '2px 0 10px' });
    var micWrap = el('div', { position: 'relative', width: '60px', height: '60px', flexShrink: '0' });
    micRing = el('div', {
      position: 'absolute', inset: '0', borderRadius: '50%',
      border: '2px solid ' + C.redStop, opacity: '0', pointerEvents: 'none'
    });
    micBtn = el('button', {
      position: 'absolute', inset: '0', borderRadius: '50%', border: 'none', cursor: 'pointer',
      background: 'linear-gradient(160deg,' + C.red + ',' + C.redDeep + ')',
      boxShadow: '0 4px 14px rgba(201,58,94,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0'
    });
    micBtn.type = 'button';
    micBtn.title = 'اتكلم';
    micBtn.appendChild(makeMicGlyph(26, '#FFF'));
    pressable(micBtn);
    micWrap.appendChild(micRing);
    micWrap.appendChild(micBtn);
    statusEl = el('div', { color: C.dim, fontSize: '13px', lineHeight: '1.5', transition: 'opacity .2s' }, 'جاهز. دوس المايك وابدأ كلام.');
    micRow.appendChild(micWrap);
    micRow.appendChild(statusEl);
    panelBox.appendChild(micRow);

    liveEl = el('div', {
      minHeight: '20px', color: C.dim, fontSize: '13px', fontStyle: 'italic',
      padding: '0 2px 6px', transition: 'opacity .2s'
    });
    panelBox.appendChild(liveEl);

    textEl = el('textarea', {
      width: '100%', height: '150px', background: C.card, color: C.text,
      border: '1px solid ' + C.hairline, borderRadius: '14px', padding: '10px 12px',
      font: '14px/1.7 ' + FONT, resize: 'none', boxSizing: 'border-box', outline: 'none'
    });
    textEl.placeholder = 'النص هيطلع هنا...';
    panelBox.appendChild(textEl);

    // أزرار الأكشن بحبوب iOS
    var row2 = el('div', { display: 'flex', gap: '8px', padding: '10px 0 2px', flexWrap: 'wrap' });
    function pill(label, filled) {
      var b = el('button', {
        border: 'none', borderRadius: '999px', padding: '7px 16px', cursor: 'pointer',
        font: '600 13px ' + FONT,
        background: filled ? 'linear-gradient(160deg,' + C.red + ',' + C.redDeep + ')' : C.track,
        color: filled ? '#FFF' : C.text
      }, label);
      b.type = 'button';
      pressable(b);
      return b;
    }
    copyBtn = pill('نسخ', true);
    copyClearBtn = pill('نسخ وامسح', false);
    clearBtn = pill('امسح', false);
    row2.appendChild(copyBtn);
    row2.appendChild(copyClearBtn);
    row2.appendChild(clearBtn);
    panelBox.appendChild(row2);

    panelBox.appendChild(el('div', { textAlign: 'center', color: C.faint, fontSize: '11px', paddingTop: '6px' }, 'By svmovo'));
    shadow.appendChild(panelBox);
    (document.body || document.documentElement).appendChild(host);
    wire();
  }

  function setLang(v) {
    lang = v;
    segBtns.forEach(function (b) {
      var on = b.dataset.lang === v;
      b.style.background = on ? C.pill : 'transparent';
      b.style.color = on ? C.text : C.dim;
    });
  }

  // ===== التحويل الصوتي =====
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null, listening = false, pulseAnim = null;

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.style.color = kind === 'err' ? C.err : kind === 'ok' ? C.ok : C.dim;
  }

  function setUi() {
    if (listening) {
      micBtn.style.background = 'linear-gradient(160deg,' + C.redStop + ',' + C.red + ')';
      micBtn.style.boxShadow = '0 4px 18px rgba(229,72,77,.55)';
      setStatus('بيسمعك... اتكلم براحتك');
      startPulse();
    } else {
      micBtn.style.background = 'linear-gradient(160deg,' + C.red + ',' + C.redDeep + ')';
      micBtn.style.boxShadow = '0 4px 14px rgba(201,58,94,.45)';
      stopPulse();
    }
  }

  function startPulse() {
    stopPulse();
    micRing.style.opacity = '1';
    pulseAnim = micRing.animate(
      [{ transform: 'scale(1)', opacity: '.8' }, { transform: 'scale(1.55)', opacity: '0' }],
      { duration: 1300, iterations: Infinity, easing: 'ease-out' }
    );
  }
  function stopPulse() {
    if (pulseAnim) { try { pulseAnim.cancel(); } catch (e) {} pulseAnim = null; }
    if (micRing) micRing.style.opacity = '0';
  }

  function makeRec() {
    var r = new SR();
    r.lang = lang;
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
        setStatus('المايك مرفوض. دوس على علامة القفل في شريط العنوان واسمح بالمايك للموقع ده وبعدين جرب تاني.', 'err');
      } else if (e.error === 'no-speech') {
        setStatus('مسمنعش صوت، اتكلم أقرب للمايك أو اعلي صوتك شوية.');
      } else if (e.error === 'network') {
        setStatus('مشكلة في النت — التحويل الصوتي محتاج إنترنت شغال.', 'err');
      } else if (e.error === 'audio-capture') {
        listening = false; setUi();
        setStatus('المايك مش لاقي جهاز تسجيل، اتأكد إن المايك متوصل.', 'err');
      } else {
        setStatus('حصل خطأ: ' + e.error, 'err');
      }
    };

    r.onend = function () {
      if (listening) {
        try { r.start(); } catch (err) {}
      } else {
        liveEl.textContent = '';
        setStatus('جاهز.');
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
    function done() { setStatus('اتنسخ ✓ ابقى امسح لو حابب.', 'ok'); if (cb) cb(); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(); done(); });
    } else {
      fallbackCopy(); done();
    }
  }

  function wire() {
    if (!SR) {
      micBtn.disabled = true;
      setStatus('المتصفح ده مش بيدعم التحويل الصوتي (كروم بس)، والصفحة لازم تكون https عادية.', 'err');
    }
    micBtn.addEventListener('click', function () {
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
          setStatus('مقدرش أبدأ التسجيل، جرب تاني.', 'err');
        }
      }
    });
    copyBtn.addEventListener('click', function () { doCopy(null); });
    copyClearBtn.addEventListener('click', function () { doCopy(function () { textEl.value = ''; liveEl.textContent = ''; }); });
    clearBtn.addEventListener('click', function () { textEl.value = ''; liveEl.textContent = ''; setStatus('جاهز.'); });
    closeBtn.addEventListener('click', function () { hidePanel(); });
  }

  function showPanel() {
    build();
    host.style.display = 'block';
    pressAnims.push(host.animate(
      [{ opacity: '0', transform: 'translateX(-50%) translateY(-14px) scale(.94)' },
       { opacity: '1', transform: 'translateX(-50%) translateY(0) scale(1)' }],
      { duration: 320, easing: SPRING, fill: 'both' }
    ));
  }

  function hidePanel() {
    if (listening && rec) { listening = false; try { rec.stop(); } catch (err) {} }
    setUi();
    var a = host.animate(
      [{ opacity: '1', transform: 'translateX(-50%) translateY(0) scale(1)' },
       { opacity: '0', transform: 'translateX(-50%) translateY(-10px) scale(.96)' }],
      { duration: 200, easing: 'ease-in', fill: 'both' }
    );
    a.onfinish = function () { host.style.display = 'none'; };
  }

  function toggle() {
    if (!host || host.style.display === 'none') {
      showPanel();
    } else {
      hidePanel();
    }
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.type === 'nataq-toggle') toggle();
  });
})();
