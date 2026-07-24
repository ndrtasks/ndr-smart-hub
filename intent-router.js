import { knowledgeBase, normalizeText } from './knowledge-base.js';

const norm = normalizeText;

function leaveChoices(){
  const out=[];
  for(const source of knowledgeBase){
    const hay=norm([source.title,source.titleEn,...(source.keywords||[])].join(' '));
    if(!hay.includes('اجاز')&&!hay.includes('leave')) continue;
    for(const form of source.relatedForms||[]){
      if(form.code==='HR-F-12'){
        const typeField=(form.fields||[]).find(f=>f.id==='vacationType');
        for(const option of typeField?.options||[]){
          if(norm(option).includes('اخرى')) continue;
          out.push({label:option,query:`بقدم ${option}`,formCode:form.code,sourceCode:source.code});
        }
      } else if(norm(form.title).includes('اجازه')||norm(form.titleEn).includes('leave')){
        out.push({label:form.title,query:`بقدم ${form.title.replace(/^نموذج طلب\s*/,'')}`,formCode:form.code,sourceCode:source.code});
      }
    }
  }
  const seen=new Set();
  return out.filter(x=>{const k=norm(x.label);if(seen.has(k))return false;seen.add(k);return true});
}

function isGenericLeave(text){
  const n=norm(text);
  if(!n.includes('اجاز')) return false;
  const specific=['سنويه','طارئ','قصير','مرضي','زواج','وفاه','مولود','ابوه','اموم','بدون راتب','غير مدفوع'];
  return !specific.some(x=>n.includes(norm(x)));
}

function showChooser(){
  document.querySelector('.intent-chooser')?.remove();
  const ask=document.querySelector('.ask-box');
  if(!ask)return;
  const choices=leaveChoices();
  if(choices.length<2)return;
  const box=document.createElement('div');box.className='smart-input-helper intent-chooser';
  box.innerHTML=`<div class="helper-copy"><strong>حدد نوع الإجازة أولا</strong><span>عندي أكثر من إجراء أو نموذج مرتبط بالإجازات، لذلك ما راح أفترض النوع من نفسي.</span></div><div class="helper-actions">${choices.map((c,i)=>`<button type="button" class="outline leave-choice" data-i="${i}">${c.label}<small>${c.formCode} · ${c.sourceCode}</small></button>`).join('')}</div>`;
  ask.parentElement.insertBefore(box,ask);
  box.querySelectorAll('.leave-choice').forEach(btn=>btn.addEventListener('click',()=>{
    const c=choices[Number(btn.dataset.i)];
    const input=document.querySelector('#question');const send=document.querySelector('#sendQuestion');
    box.remove();if(input&&send){input.value=c.query;send.click();}
  }));
}

function intercept(event){
  const button=event.target.closest?.('#sendQuestion');
  if(!button)return;
  const input=document.querySelector('#question');
  if(!input?.value?.trim()||!isGenericLeave(input.value))return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();showChooser();
}
function interceptEnter(event){
  if(event.target?.id!=='question'||event.key!=='Enter'||event.shiftKey||!isGenericLeave(event.target.value||''))return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();showChooser();
}
document.addEventListener('click',intercept,true);
document.addEventListener('keydown',interceptEnter,true);
