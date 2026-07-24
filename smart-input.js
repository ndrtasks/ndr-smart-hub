(() => {
  'use strict';
  let bypassOnce=false;
  const norm=(value='')=>String(value).toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\s+/g,' ').trim();
  const pad=n=>String(n).padStart(2,'0');
  const formatDisplay=d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  const formatInput=d=>`${d.getDate()}/${d.getMonth()+1)}/${d.getFullYear()}`;
  const cleanDate=date=>{const d=new Date(date);d.setHours(0,0,0,0);return d};
  const addDays=(base,days)=>{const d=cleanDate(base);d.setDate(d.getDate()+days);return d};
  const addMonths=(base,months)=>{const d=cleanDate(base),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+months);const max=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,max));return d};

  const units={
    'صفر':0,'واحد':1,'واحده':1,'احد':1,'اثنين':2,'اثنان':2,'اثنتين':2,'اثنتان':2,'ثنين':2,
    'ثلاث':3,'ثلاثه':3,'اربع':4,'اربعه':4,'خمس':5,'خمسه':5,'ست':6,'سته':6,
    'سبع':7,'سبعه':7,'ثمان':8,'ثمانيه':8,'تسع':9,'تسعه':9,'عشر':10,'عشره':10,
    'احد عشر':11,'احدى عشر':11,'اثنا عشر':12,'اثني عشر':12,'اثنتا عشر':12,'اثنتي عشر':12,
    'ثلاثه عشر':13,'ثلاث عشر':13,'اربعه عشر':14,'اربع عشر':14,'خمسه عشر':15,'خمس عشر':15,
    'سته عشر':16,'ست عشر':16,'سبعه عشر':17,'سبع عشر':17,'ثمانيه عشر':18,'ثمان عشر':18,'تسعه عشر':19,'تسع عشر':19
  };
  const tens={'عشرين':20,'ثلاثين':30,'اربعين':40,'خمسين':50,'ستين':60,'سبعين':70,'ثمانين':80,'تسعين':90};

  function numberFromWords(value){
    const n=norm(value).replace(/^و/,'').trim();
    if(/^\d+$/.test(n))return Number(n);
    if(Object.prototype.hasOwnProperty.call(units,n))return units[n];
    if(Object.prototype.hasOwnProperty.call(tens,n))return tens[n];
    const parts=n.split(/\s+و\s+|و(?=[^\s])/).map(x=>x.trim()).filter(Boolean);
    if(parts.length===2){
      const a=Object.prototype.hasOwnProperty.call(units,parts[0])?units[parts[0]]:tens[parts[0]];
      const b=Object.prototype.hasOwnProperty.call(units,parts[1])?units[parts[1]]:tens[parts[1]];
      if(Number.isFinite(a)&&Number.isFinite(b))return a+b;
    }
    const spaced=n.match(/^(.+?)\s+و\s+(.+)$/);
    if(spaced){const a=numberFromWords(spaced[1]),b=numberFromWords(spaced[2]);if(Number.isFinite(a)&&Number.isFinite(b))return a+b}
    return null;
  }

  function parseAbsoluteOrSimple(value,base=new Date()){
    const n=norm(value);
    if(['بكره','بكرة','غدا','غداً','tomorrow'].map(norm).includes(n))return addDays(base,1);
    if(['اليوم','today'].map(norm).includes(n))return cleanDate(base);
    let m=n.match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?$/);
    if(m){let y=m[3]?Number(m[3]):base.getFullYear();if(y<100)y+=2000;const d=new Date(y,Number(m[2])-1,Number(m[1]));if(d.getFullYear()===y&&d.getMonth()===Number(m[2])-1&&d.getDate()===Number(m[1]))return cleanDate(d)}
    m=n.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/);if(m){const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));if(!Number.isNaN(d.getTime()))return cleanDate(d)}
    return null;
  }
  const latestAssistantText=()=>norm([...document.querySelectorAll('.msg.ai .answer-text')].at(-1)?.textContent||'');
  function previousUserDate(){const users=[...document.querySelectorAll('.msg.user')];for(let i=users.length-1;i>=0;i--){const d=parseAbsoluteOrSimple(users[i].textContent,new Date());if(d)return d}return null}
  function relativeBaseDate(){if(latestAssistantText().includes(norm('متى تنتهي الإجازة'))){const prior=previousUserDate();if(prior)return {date:prior,label:'تاريخ بداية الإجازة'}}return {date:new Date(),label:'تاريخ اليوم'}}
  function parseRelativeDate(value){
    const n=norm(value),baseInfo=relativeBaseDate(),base=baseInfo.date;
    if(['بكره','بكرة','غدا','غداً','tomorrow'].map(norm).includes(n))return {date:addDays(base,1),source:value,baseLabel:baseInfo.label,base};
    const exact={'بعد يوم':['d',1],'بعد يومين':['d',2],'بعد اسبوع':['d',7],'بعد اسبوعين':['d',14],'بعد شهر':['m',1],'بعد شهرين':['m',2]};
    if(exact[n]){const [u,v]=exact[n];return {date:u==='d'?addDays(base,v):addMonths(base,v),source:value,baseLabel:baseInfo.label,base}}
    const m=n.match(/^بعد\s+(.+?)\s+(يوم|يوما|ايام|اسبوع|اسبوعا|اسابيع|شهر|شهرا|اشهر)$/);
    if(m){const count=numberFromWords(m[1]);if(Number.isFinite(count)&&count>0){const unit=m[2];const date=unit.startsWith('اسبوع')?addDays(base,count*7):unit.startsWith('شهر')?addMonths(base,count):addDays(base,count);return {date,source:value,baseLabel:baseInfo.label,base}}}
    return null;
  }
  const isDateQuestion=()=>['متى تبدا الاجازه','متى تنتهي الاجازه','تاريخ اخر اجازه','اكتب التاريخ'].some(x=>latestAssistantText().includes(norm(x)));
  const isVisaQuestion=()=>latestAssistantText().includes(norm('هل تحتاج تأشيرة خروج وعودة'));
  const removeHelper=()=>document.querySelector('.smart-input-helper')?.remove();
  function showHelper(html){removeHelper();const ask=document.querySelector('.ask-box');if(!ask)return;const box=document.createElement('div');box.className='smart-input-helper';box.innerHTML=html;ask.parentElement.insertBefore(box,ask);const messages=document.querySelector('.messages');if(messages)requestAnimationFrame(()=>messages.scrollTop=messages.scrollHeight)}
  function sendNormalized(value){const input=document.querySelector('#question'),button=document.querySelector('#sendQuestion');if(!input||!button)return;removeHelper();input.value=value;bypassOnce=true;button.click()}
  function confirmRelativeDate(parsed){const display=formatDisplay(parsed.date),baseDisplay=formatDisplay(parsed.base);showHelper(`<div class="helper-copy"><strong>فهمت التاريخ</strong><span>${String(parsed.source).replace(/[<>]/g,'')} = <b>${display}</b></span><small>الحسبة من ${parsed.baseLabel}: ${baseDisplay}</small></div><div class="helper-actions"><button type="button" class="primary helper-confirm">تأكيد التاريخ</button><button type="button" class="outline helper-change">تغيير</button></div>`);document.querySelector('.helper-confirm')?.addEventListener('click',()=>sendNormalized(formatInput(parsed.date)));document.querySelector('.helper-change')?.addEventListener('click',()=>{removeHelper();document.querySelector('#question')?.focus()})}
  function clarifyVisaType(){showHelper(`<div class="helper-copy"><strong>تمام، تحتاج تأشيرة خروج وعودة</strong><span>وش نوعها؟</span></div><div class="helper-actions"><button type="button" class="outline helper-visa" data-value="شخصي">شخصي</button><button type="button" class="outline helper-visa" data-value="لعائلتي">لعائلتي</button><button type="button" class="outline helper-visa" data-value="لا أحتاج">تراجعت - لا أحتاج</button></div>`);document.querySelectorAll('.helper-visa').forEach(btn=>btn.addEventListener('click',()=>sendNormalized(btn.dataset.value)))}
  function interceptSend(event){if(!event.target.closest?.('#sendQuestion'))return;if(bypassOnce){bypassOnce=false;return}const value=document.querySelector('#question')?.value?.trim();if(!value)return;if(isDateQuestion()){const parsed=parseRelativeDate(value);if(parsed){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();confirmRelativeDate(parsed);return}}if(isVisaQuestion()){const n=norm(value);if(['نعم','ايوه','ايه','احتاج','yes','y'].map(norm).includes(n)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();clarifyVisaType();return}if(['لا','لا احتاج','ما احتاج','no','n'].map(norm).includes(n)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();sendNormalized('لا أحتاج')}}}
  function interceptEnter(event){if(event.target?.id!=='question'||event.key!=='Enter'||event.shiftKey||bypassOnce)return;const value=event.target.value?.trim();if(!value)return;if(isDateQuestion()){const parsed=parseRelativeDate(value);if(parsed){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();confirmRelativeDate(parsed);return}}if(isVisaQuestion()&&['نعم','ايوه','ايه','احتاج','yes','y'].map(norm).includes(norm(value))){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();clarifyVisaType()}}
  document.addEventListener('click',interceptSend,true);document.addEventListener('keydown',interceptEnter,true);
})();