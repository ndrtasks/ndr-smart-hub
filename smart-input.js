(() => {
  'use strict';
  let bypassOnce=false;
  const norm=(value='')=>String(value).toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\s+/g,' ').trim();
  const pad=n=>String(n).padStart(2,'0');
  const formatDisplay=d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  const formatInput=d=>`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  const cleanDate=date=>{const d=new Date(date);d.setHours(0,0,0,0);return d};
  const addDays=(base,days)=>{const d=cleanDate(base);d.setDate(d.getDate()+days);return d};
  const addMonths=(base,months)=>{const d=cleanDate(base),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+months);const max=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,max));return d};
  const wordNumbers={
    'واحد':1,'واحده':1,'يوم':1,'اثنين':2,'اثنان':2,'اثنتين':2,'اثنتان':2,'ثنين':2,
    'ثلاث':3,'ثلاثه':3,'اربعه':4,'اربع':4,'خمسه':5,'خمس':5,'سته':6,'ست':6,'سبعه':7,'سبع':7,'ثمانيه':8,'ثمان':8,'تسعه':9,'تسع':9,'عشره':10,'عشر':10
  };
  function numberFromToken(token){const n=norm(token);if(/^\d+$/.test(n))return Number(n);return wordNumbers[n]||null}
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
    const m=n.match(/^بعد\s+([^\s]+)\s*(يوم|ايام|اسبوع|اسابيع|شهر|اشهر)$/);
    if(m){const count=numberFromToken(m[1]);if(count){const unit=m[2];const date=unit.startsWith('اسبوع')?addDays(base,count*7):unit.startsWith('شهر')?addMonths(base,count):addDays(base,count);return {date,source:value,baseLabel:baseInfo.label,base}}}
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
