(() => {
  'use strict';

  let bypassOnce = false;

  const norm = (value='') => String(value)
    .toLowerCase()
    .replace(/[أإآ]/g,'ا')
    .replace(/ى/g,'ي')
    .replace(/ة/g,'ه')
    .replace(/[ًٌٍَُِّْـ]/g,'')
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/\s+/g,' ')
    .trim();

  const pad = n => String(n).padStart(2,'0');
  const formatDisplay = date => `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()}`;
  const formatInput = date => `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;

  function addDays(days) {
    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()+days);
    return d;
  }

  function addMonths(months) {
    const d = new Date();
    d.setHours(0,0,0,0);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth()+months);
    const max = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
    d.setDate(Math.min(day,max));
    return d;
  }

  function parseRelativeDate(value) {
    const n = norm(value);
    if (['بكره','بكرة','غدا','غداً','tomorrow'].map(norm).includes(n)) return {date:addDays(1), source:value};
    if (n === 'بعد يوم') return {date:addDays(1), source:value};
    if (n === 'بعد يومين') return {date:addDays(2), source:value};
    if (n === 'بعد اسبوع') return {date:addDays(7), source:value};
    if (n === 'بعد اسبوعين') return {date:addDays(14), source:value};
    if (n === 'بعد شهر') return {date:addMonths(1), source:value};
    if (n === 'بعد شهرين') return {date:addMonths(2), source:value};

    let m = n.match(/^بعد\s+(\d+)\s*(يوم|ايام)$/);
    if (m) return {date:addDays(Number(m[1])), source:value};
    m = n.match(/^بعد\s+(\d+)\s*(اسبوع|اسابيع)$/);
    if (m) return {date:addDays(Number(m[1])*7), source:value};
    m = n.match(/^بعد\s+(\d+)\s*(شهر|اشهر)$/);
    if (m) return {date:addMonths(Number(m[1])), source:value};
    return null;
  }

  function latestAssistantText() {
    const nodes = [...document.querySelectorAll('.msg.ai .answer-text')];
    return norm(nodes.at(-1)?.textContent || '');
  }

  function isDateQuestion() {
    const text = latestAssistantText();
    return ['متى تبدا الاجازه','متى تنتهي الاجازه','تاريخ اخر اجازه','اكتب التاريخ'].some(x=>text.includes(norm(x)));
  }

  function isVisaQuestion() {
    return latestAssistantText().includes(norm('هل تحتاج تأشيرة خروج وعودة'));
  }

  function removeHelper() {
    document.querySelector('.smart-input-helper')?.remove();
  }

  function showHelper(html) {
    removeHelper();
    const ask = document.querySelector('.ask-box');
    if (!ask) return;
    const box = document.createElement('div');
    box.className = 'smart-input-helper';
    box.innerHTML = html;
    ask.parentElement.insertBefore(box, ask);
    const messages = document.querySelector('.messages');
    if (messages) requestAnimationFrame(()=>{messages.scrollTop=messages.scrollHeight});
  }

  function sendNormalized(value) {
    const input = document.querySelector('#question');
    const button = document.querySelector('#sendQuestion');
    if (!input || !button) return;
    removeHelper();
    input.value = value;
    bypassOnce = true;
    button.click();
  }

  function confirmRelativeDate(parsed) {
    const display = formatDisplay(parsed.date);
    showHelper(`
      <div class="helper-copy"><strong>فهمت التاريخ</strong><span>${String(parsed.source).replace(/[<>]/g,'')} = <b>${display}</b></span></div>
      <div class="helper-actions">
        <button type="button" class="primary helper-confirm">تأكيد التاريخ</button>
        <button type="button" class="outline helper-change">تغيير</button>
      </div>`);
    document.querySelector('.helper-confirm')?.addEventListener('click',()=>sendNormalized(formatInput(parsed.date)));
    document.querySelector('.helper-change')?.addEventListener('click',()=>{removeHelper();document.querySelector('#question')?.focus()});
  }

  function clarifyVisaType() {
    showHelper(`
      <div class="helper-copy"><strong>تمام، تحتاج تأشيرة خروج وعودة</strong><span>وش نوعها؟</span></div>
      <div class="helper-actions">
        <button type="button" class="outline helper-visa" data-value="شخصي">شخصي</button>
        <button type="button" class="outline helper-visa" data-value="لعائلتي">لعائلتي</button>
        <button type="button" class="outline helper-visa" data-value="لا أحتاج">تراجعت - لا أحتاج</button>
      </div>`);
    document.querySelectorAll('.helper-visa').forEach(btn=>btn.addEventListener('click',()=>sendNormalized(btn.dataset.value)));
  }

  function interceptSend(event) {
    const target = event.target.closest?.('#sendQuestion');
    if (!target) return;
    if (bypassOnce) { bypassOnce = false; return; }
    const input = document.querySelector('#question');
    const value = input?.value?.trim();
    if (!value) return;

    if (isDateQuestion()) {
      const parsed = parseRelativeDate(value);
      if (parsed) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        confirmRelativeDate(parsed);
        return;
      }
    }

    if (isVisaQuestion()) {
      const n = norm(value);
      if (['نعم','ايوه','ايه','احتاج','yes','y'].map(norm).includes(n)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        clarifyVisaType();
        return;
      }
      if (['لا','لا احتاج','ما احتاج','no','n'].map(norm).includes(n)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        sendNormalized('لا أحتاج');
      }
    }
  }

  function interceptEnter(event) {
    if (event.target?.id !== 'question' || event.key !== 'Enter' || event.shiftKey || bypassOnce) return;
    const value = event.target.value?.trim();
    if (!value) return;
    if (isDateQuestion()) {
      const parsed = parseRelativeDate(value);
      if (parsed) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        confirmRelativeDate(parsed);
        return;
      }
    }
    if (isVisaQuestion() && ['نعم','ايوه','ايه','احتاج','yes','y'].map(norm).includes(norm(value))) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      clarifyVisaType();
    }
  }

  document.addEventListener('click',interceptSend,true);
  document.addEventListener('keydown',interceptEnter,true);
})();
