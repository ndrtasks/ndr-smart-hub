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

  function cleanDate(date) {
    const d = new Date(date); d.setHours(0,0,0,0); return d;
  }

  function addDays(base,days) {
    const d = cleanDate(base); d.setDate(d.getDate()+days); return d;
  }

  function addMonths(base,months) {
    const d = cleanDate(base); const day=d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+months);
    const max=new Date(d.getFullYear(),d.getMonth()+1,0).getDate(); d.setDate(Math.min(day,max)); return d;
  }

  function parseAbsoluteOrSimple(value,base=new Date()) {
    const raw=String(value||'').trim(); const n=norm(raw);
    if(['بكره','بكرة','غدا','غداً','tomorrow'].map(norm).includes(n)) return addDays(base,1);
    if(['اليوم','today'].map(norm).includes(n)) return cleanDate(base);
    let m=n.match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?$/);
    if(m){let year=m[3]?Number(m[3]):base.getFullYear();if(year<100)year+=2000;const d=new Date(year,Number(m[2])-1,Number(m[1]));if(d.getFullYear()===year&&d.getMonth()===Number(m[2])-1&&d.getDate()===Number(m[1]))return cleanDate(d)}
    m=n.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/);
    if(m){const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));if(!Number.isNaN(d.getTime()))return cleanDate(d)}
    return null;
  }

  function latestAssistantText() {
    const nodes=[...document.querySelectorAll('.msg.ai .answer-text')]; return norm(nodes.at(-1)?.textContent||'');
  }

  function previousUserDate() {
    const users=[...document.querySelectorAll('.msg.user')];
    for(let i=users.length-1;i>=0;i--){
      const parsed=parseAbsoluteOrSimple(users[i].textContent,new Date()); if(parsed)return parsed;
    }
    return null;
  }

  function relativeBaseDate() {
    const latest=latestAssistantText();
    if(latest.includes(norm('متى تنتهي الإجازة'))){
      const prior=previousUserDate(); if(prior)return {date:prior,label:'تاريخ بداية الإجازة'};
    }
    return {date:new Date(),label:'تاريخ اليوم'};
  }

  function parseRelativeDate(value) {
    const n=norm(value); const baseInfo=relativeBaseDate(); const base=baseInfo.date;
    if(['بكره','بكرة','غدا','غداً','tomorrow'].map(norm).includes(n))return {date:addDays(base,1),source:value,baseLabel:baseInfo.label,base};
    if(n==='بعد يوم')return {date:addDays(base,1),source:value,baseLabel:baseInfo.label,base};
    if(n==='بعد يومين')return {date:addDays(base,2),source:value,baseLabel:baseInfo.label,base};
    if(n==='بعد اسبوع')return {date:addDays(base,7),source:value,baseLabel:baseInfo.label,base};
    if(n==='بعد اسبوعين')return {date:addDays(base,14),source:value,baseLabel:baseInfo.label,base};
    if(n==='بعد شهر')return {date:addMonths(base,1),source:value,baseLabel:baseInfo.label,base};
    if(n==='بعد شهرين')return {date:addMonths(base,2),source:value,baseLabel:baseInfo.label,base};
    let m=n.match(/^بعد\s+(\d+)\s*(يوم|ايام)$/);if(m)return {date:addDays(base,Number(m[1])),source:value,baseLabel:baseInfo.label,base};
    m=n.match(/^بعد\s+(\d+)\s*(اسبوع|اسابيع)$/);if(m)return {date:addDays(base,Number(m[1])*7),source:value,baseLabel:baseInfo.label,base};
    m=n.match(/^بعد\s+(\d+)\s*(شهر|اشهر)$/);if(m)return {date:addMonths(base,Number(m[1])),source:value,baseLabel:baseInfo.label,base};
    return null;
  }

  function isDateQuestion(){const text=latestAssistantText();return ['متى تبدا الاجازه','متى تنتهي الاجازه','تاريخ اخر اجازه','اكتب التاريخ'].some(x=>text.includes(norm(x)))}
  function isVisaQuestion(){return latestAssistantText().includes(norm('هل تحتاج تأشيرة خروج وعودة'))}
  function removeHelper(){document.querySelector('.smart-input-helper')?.remove()}

  function showHelper(html){removeHelper();const ask=document.querySelector('.ask-box');if(!ask)return;const box=document.createElement('div');box.className='smart-input-helper';box.innerHTML=html;ask.parentElement.insertBefore(box,ask);const messages=document.querySelector('.messages');if(messages)requestAnimationFrame(()=>{messages.scrollTop=messages.scrollHeight})}

  function sendNormalized(value){const input=document.querySelector('#question');const button=document.querySelector('#sendQuestion');if(!input||!button)return;removeHelper();input.value=value;bypassOnce=true;button.click()}

  function confirmRelativeDate(parsed){
    const display=formatDisplay(parsed.date); const baseDisplay=formatDisplay(parsed.base);
    showHelper(`<div class="helper-copy"><strong>فهمت التاريخ</strong><span>${String(parsed.source).replace(/[<>]/g,'')} = <b>${display}</b></span><small>الحسبة من ${parsed.baseLabel}: ${baseDisplay}</small></div><div class="helper-actions"><button type="button" class="primary helper-confirm">تأكيد التاريخ</button><button type="button" class="outline helper-change">تغيير</button></div>`);
    document.querySelector('.helper-confirm')?.addEventListener('click',()=>sendNormalized(formatInput(parsed.date)));
    document.querySelector('.helper-change')?.addEventListener('click',()=>{removeHelper();document.querySelector('#question')?.focus()});
  }

  function clarifyVisaType(){
    showHelper(`<div class="helper-copy"><strong>تمام، تحتاج تأشيرة خروج وعودة</strong><span>وش نوعها؟</span></div><div class="helper-actions"><button type="button" class="outline helper-visa" data-value="شخصي">شخصي</button><button type="button" class="outline helper-visa" data-value="لعائلتي">لعائلتي</button><button type="button" class="outline helper-visa" data-value="لا أحتاج">تراجعت - لا أحتاج</button></div>`);
    document.querySelectorAll('.helper-visa').forEach(btn=>btn.addEventListener('click',()=>sendNormalized(btn.dataset.value)));
  }

  function interceptSend(event){
    if(!event.target.closest?.('#sendQuestion'))return;if(bypassOnce){bypassOnce=false;return}
    const value=document.querySelector('#question')?.value?.trim();if(!value)return;
    if(isDateQuestion()){const parsed=parseRelativeDate(value);if(parsed){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();confirmRelativeDate(parsed);return}}
    if(isVisaQuestion()){
      const n=norm(value);
      if(['نعم','ايوه','ايه','احتاج','yes','y'].map(norm).includes(n)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();clarifyVisaType();return}
      if(['لا','لا احتاج','ما احتاج','no','n'].map(norm).includes(n)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();sendNormalized('لا أحتاج')}
    }
  }

  function interceptEnter(event){
    if(event.target?.id!=='question'||event.key!=='Enter'||event.shiftKey||bypassOnce)return;const value=event.target.value?.trim();if(!value)return;
    if(isDateQuestion()){const parsed=parseRelativeDate(value);if(parsed){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();confirmRelativeDate(parsed);return}}
    if(isVisaQuestion()&&['نعم','ايوه','ايه','احتاج','yes','y'].map(norm).includes(norm(value))){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();clarifyVisaType()}
  }

  document.addEventListener('click',interceptSend,true);document.addEventListener('keydown',interceptEnter,true);
})();
