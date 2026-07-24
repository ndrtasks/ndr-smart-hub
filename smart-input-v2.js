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
  const cleanDate = value => { const d=new Date(value); d.setHours(0,0,0,0); return d; };
  const addDays = (base,days) => { const d=cleanDate(base); d.setDate(d.getDate()+days); return d; };
  const addMonths = (base,months) => {
    const d=cleanDate(base), original=d.getDate();
    d.setDate(1); d.setMonth(d.getMonth()+months);
    const max=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
    d.setDate(Math.min(original,max)); return d;
  };
  const displayDate = d => `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  const inputDate = d => `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;

  const units = {
    صفر:0,
    واحد:1, واحده:1, وحده:1,
    اثنين:2, اثنان:2, اثنتين:2, اثنتان:2, ثنين:2,
    ثلاث:3, ثلاثه:3,
    اربع:4, اربعه:4,
    خمس:5, خمسه:5,
    ست:6, سته:6,
    سبع:7, سبعه:7,
    ثمان:8, ثمانيه:8,
    تسع:9, تسعه:9
  };
  const teens = {
    عشر:10, عشره:10,
    'احد عشر':11, 'احدى عشر':11, 'احد عشره':11,
    'اثنا عشر':12, 'اثني عشر':12, 'اثنتا عشر':12, 'اثنتي عشر':12,
    'ثلاثه عشر':13, 'ثلاث عشر':13,
    'اربعه عشر':14, 'اربع عشر':14,
    'خمسه عشر':15, 'خمس عشر':15,
    'سته عشر':16, 'ست عشر':16,
    'سبعه عشر':17, 'سبع عشر':17,
    'ثمانيه عشر':18, 'ثمان عشر':18,
    'تسعه عشر':19, 'تسع عشر':19
  };
  const tens = {
    عشرين:20, عشرون:20,
    ثلاثين:30, ثلاثون:30,
    اربعين:40, اربعون:40,
    خمسين:50, خمسون:50,
    ستين:60, ستون:60,
    سبعين:70, سبعون:70,
    ثمانين:80, ثمانون:80,
    تسعين:90, تسعون:90
  };

  function arabicNumber(phrase='') {
    const p=norm(phrase);
    if(/^\d+$/.test(p)) return Number(p);
    if(Object.prototype.hasOwnProperty.call(units,p)) return units[p];
    if(teens[p]) return teens[p];
    if(tens[p]) return tens[p];

    // Examples: خمسة وعشرين / واحد وثلاثين / تسعة وتسعين
    const tokens=p.split(/\s+/).filter(Boolean);
    if(tokens.length===2) {
      const first=units[tokens[0]];
      const secondToken=tokens[1].startsWith('و')?tokens[1].slice(1):tokens[1];
      const second=tens[secondToken];
      if(first!==undefined && second) return first+second;
    }
    return null;
  }

  function parseAbsolute(value,base=new Date()) {
    const n=norm(value);
    if(['اليوم','today'].includes(n)) return cleanDate(base);
    if(['امس','yesterday'].includes(n)) return addDays(base,-1);
    if(['بكره','بكرة','غدا','غداً','tomorrow'].map(norm).includes(n)) return addDays(base,1);

    let m=n.match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?$/);
    if(m){let y=m[3]?Number(m[3]):base.getFullYear();if(y<100)y+=2000;const d=new Date(y,Number(m[2])-1,Number(m[1]));if(d.getFullYear()===y&&d.getMonth()===Number(m[2])-1&&d.getDate()===Number(m[1]))return cleanDate(d)}
    m=n.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/);
    if(m){const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));if(!Number.isNaN(d.getTime()))return cleanDate(d)}
    return null;
  }

  function latestAssistantText(){
    const messages=[...document.querySelectorAll('.msg.ai')];
    return norm(messages.at(-1)?.textContent||'');
  }

  function previousUserDate(){
    const messages=[...document.querySelectorAll('.msg.user')];
    for(let i=messages.length-1;i>=0;i--){
      const d=parseAbsolute(messages[i].textContent,new Date());
      if(d) return d;
    }
    return null;
  }

  function isEndDateQuestion(){
    const t=latestAssistantText();
    return t.includes(norm('متى تنتهي الإجازة')) || t.includes(norm('الإجازة إلى')) || t.includes(norm('تاريخ نهاية الإجازة'));
  }

  function isDateQuestion(){
    const t=latestAssistantText();
    return [
      'متى تبدأ الإجازة','متى تنتهي الإجازة','تاريخ آخر إجازة','اكتب التاريخ',
      'تاريخ بدء الخصم','تاريخ الحالة','تاريخ بداية الإجازة','تاريخ نهاية الإجازة'
    ].some(x=>t.includes(norm(x)));
  }

  function relativeBase(){
    if(isEndDateQuestion()){
      const prior=previousUserDate();
      if(prior) return {date:prior,label:'تاريخ بداية الإجازة'};
    }
    return {date:new Date(),label:'تاريخ اليوم'};
  }

  function parseRelative(value=''){
    const n=norm(value), info=relativeBase(), base=info.date;
    const exact={
      'بعد يوم':1,'بعد يومين':2,
      'بعد اسبوع':7,'بعد اسبوعين':14,
      'بعد أسبوع':7,'بعد أسبوعين':14
    };
    if(exact[n]) return {date:addDays(base,exact[n]),source:value,baseLabel:info.label,base};
    if(n==='بعد شهر') return {date:addMonths(base,1),source:value,baseLabel:info.label,base};
    if(n==='بعد شهرين') return {date:addMonths(base,2),source:value,baseLabel:info.label,base};

    const m=n.match(/^بعد\s+(.+?)\s+(يوم|يومين|ايام|اسبوع|اسبوعين|اسابيع|شهر|شهرين|اشهر)$/);
    if(!m) return null;
    let count=arabicNumber(m[1]);
    const unit=m[2];
    if(unit==='يومين'||unit==='اسبوعين'||unit==='شهرين') count=2;
    if(!Number.isFinite(count)||count<0) return null;
    const date=unit.startsWith('اسبوع')?addDays(base,count*7):unit.startsWith('شهر')?addMonths(base,count):addDays(base,count);
    return {date,source:value,baseLabel:info.label,base};
  }

  function removeHelper(){document.querySelector('.smart-input-helper')?.remove()}
  function showHelper(html){
    removeHelper();
    const ask=document.querySelector('.ask-box');
    if(!ask)return;
    const box=document.createElement('div');
    box.className='smart-input-helper';box.innerHTML=html;
    ask.parentElement.insertBefore(box,ask);
    const messages=document.querySelector('.messages');
    if(messages)requestAnimationFrame(()=>messages.scrollTop=messages.scrollHeight);
  }
  function sendNormalized(value){
    const input=document.querySelector('#question'),button=document.querySelector('#sendQuestion');
    if(!input||!button)return;
    removeHelper();input.value=value;bypassOnce=true;button.click();
  }
  function confirmRelative(parsed){
    const value=displayDate(parsed.date),base=displayDate(parsed.base);
    showHelper(`<div class="helper-copy"><strong>فهمت المدة</strong><span>${String(parsed.source).replace(/[<>]/g,'')} = <b>${value}</b></span><small>الحسبة من ${parsed.baseLabel}: ${base}</small></div><div class="helper-actions"><button type="button" class="primary helper-confirm">تأكيد التاريخ</button><button type="button" class="outline helper-change">تغيير</button></div>`);
    document.querySelector('.helper-confirm')?.addEventListener('click',()=>sendNormalized(inputDate(parsed.date)));
    document.querySelector('.helper-change')?.addEventListener('click',()=>{removeHelper();document.querySelector('#question')?.focus()});
  }
  function clarifyVisa(){
    showHelper(`<div class="helper-copy"><strong>تمام، تحتاج تأشيرة خروج وعودة</strong><span>وش نوعها؟</span></div><div class="helper-actions"><button type="button" class="outline helper-visa" data-value="شخصي">شخصي</button><button type="button" class="outline helper-visa" data-value="لعائلتي">لعائلتي</button><button type="button" class="outline helper-visa" data-value="لا أحتاج">تراجعت - لا أحتاج</button></div>`);
    document.querySelectorAll('.helper-visa').forEach(btn=>btn.addEventListener('click',()=>sendNormalized(btn.dataset.value)));
  }

  function intercept(value,event){
    if(!value)return false;
    if(isDateQuestion()){
      const rel=parseRelative(value);
      if(rel){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();confirmRelative(rel);return true}
    }
    const t=latestAssistantText();
    if(t.includes(norm('هل تحتاج تأشيرة خروج وعودة'))){
      const n=norm(value);
      if(['نعم','ايوه','ايه','احتاج','yes','y'].map(norm).includes(n)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();clarifyVisa();return true}
      if(['لا','لا احتاج','ما احتاج','no','n'].map(norm).includes(n)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();sendNormalized('لا أحتاج');return true}
    }
    return false;
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest?.('#sendQuestion'))return;
    if(bypassOnce){bypassOnce=false;return}
    intercept(document.querySelector('#question')?.value?.trim(),event);
  },true);

  document.addEventListener('keydown',event=>{
    if(event.target?.id!=='question'||event.key!=='Enter'||event.shiftKey||bypassOnce)return;
    intercept(event.target.value?.trim(),event);
  },true);
})();
