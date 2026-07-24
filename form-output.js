(() => {
  'use strict';

  const CACHE_KEY='ndr_hrf12_last_draft';
  const TEMPLATE_PARTS=['assets/hr-f-12-template.part1.b64','assets/hr-f-12-template.part2.b64'];
  const esc=v=>String(v??'').trim();
  const norm=v=>esc(v).replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').toLowerCase();

  function readGuidedForm(){
    const form=document.querySelector('#guidedForm');if(!form)return null;
    const data=Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('[name]').forEach(el=>{if(el.name&&el.value!==undefined)data[el.name]=el.value});
    try{sessionStorage.setItem(CACHE_KEY,JSON.stringify(data))}catch{}
    return data;
  }
  function readCached(){try{return JSON.parse(sessionStorage.getItem(CACHE_KEY)||'{}')}catch{return {}}}
  function downloadBlob(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
  function bytesFromBase64(b64){const bin=atob(b64.replace(/\s/g,'')),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out}
  async function templateBytes(){const parts=await Promise.all(TEMPLATE_PARTS.map(p=>fetch(p,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`template:${p}:${r.status}`);return r.text()})));return bytesFromBase64(parts.join(''))}
  function splitDate(value){const raw=esc(value);let m=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(m)return {d:m[3],m:m[2],y:m[1]};m=raw.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);if(m){let y=m[3];if(y.length===2)y='20'+y;return {d:m[1],m:m[2],y}};return null}
  function displayDate(value){const p=splitDate(value);return p?`${p.d}/${p.m}/${p.y}`:esc(value)}
  function setText(form,name,value,alignRight=false){if(!esc(value))return;try{const f=form.getTextField(String(name));f.setText(esc(value));if(alignRight&&window.PDFLib?.TextAlignment)f.setAlignment(window.PDFLib.TextAlignment.Right)}catch(err){console.warn('HR-F-12 text field',name,err)}}
  function setCheck(form,name,on){try{const f=form.getCheckBox(String(name));on?f.check():f.uncheck()}catch(err){console.warn('HR-F-12 checkbox',name,err)}}

  function requestViewerAppearances(form){
    try{
      const PDFName=window.PDFLib?.PDFName,PDFBool=window.PDFLib?.PDFBool;
      if(PDFName&&PDFBool&&form?.acroForm?.dict)form.acroForm.dict.set(PDFName.of('NeedAppearances'),PDFBool.True);
    }catch(err){console.warn('NeedAppearances fallback unavailable',err)}
  }

  async function buildFilledPdf(data={}){
    if(!window.PDFLib)throw new Error('pdf-lib unavailable');
    const bytes=await templateBytes();
    const pdfDoc=await window.PDFLib.PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false});
    const form=pdfDoc.getForm();

    setText(form,'6',data.employeeId);setText(form,'1',displayDate(data.requestDate));setText(form,'2',data.employeeName,true);setText(form,'7',data.position,true);setText(form,'3',data.department,true);setText(form,'8',data.vacationContact);setText(form,'4',displayDate(data.joiningDate));setText(form,'9',data.nationality,true);setText(form,'5',data.mobile);
    const last=splitDate(data.lastVacationDate);if(last){setText(form,'30',last.d);setText(form,'14',last.m);setText(form,'13',last.y);setText(form,'10',last.d);setText(form,'11',last.m);setText(form,'12',last.y)}
    const start=displayDate(data.vacationFrom),end=displayDate(data.vacationTo);setText(form,'18',start);setText(form,'20',start);setText(form,'19',end);setText(form,'23',data.days);setText(form,'24',data.otherType,true);setText(form,'27',data.passportsAttached);setText(form,'28',data.departmentRemarks,true);setText(form,'29',data.alternateEmployee,true);
    setCheck(form,'21',norm(data.vacationType).includes('سنويه'));setCheck(form,'22',norm(data.vacationType).includes('طارئ'));setCheck(form,'25',norm(data.exitReentry)==='شخصي');setCheck(form,'26',norm(data.exitReentry).includes('عائل'));

    // Keep the original AcroForm interactive. Do not regenerate appearances with Helvetica,
    // because Arabic values cannot be encoded by WinAnsi. PDF viewers render the current
    // field values using the original form resources when NeedAppearances is enabled.
    requestViewerAppearances(form);
    const out=await pdfDoc.save({useObjectStreams:false,addDefaultPage:false,updateFieldAppearances:false});
    return new Blob([out],{type:'application/pdf'});
  }

  async function downloadBlank(){try{downloadBlob(new Blob([await templateBytes()],{type:'application/pdf'}),'HR-F-12_blank_original.pdf')}catch(err){console.error(err);alert('تعذر تحميل النموذج الأصلي حاليا.')}}
  async function downloadFilled(data){
    const btn=document.activeElement;
    if(btn instanceof HTMLButtonElement){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent='جاري تعبئة النموذج الأصلي...'}
    try{const pdf=await buildFilledPdf(data);downloadBlob(pdf,`HR-F-12_${data.employeeId||'employee'}_filled.pdf`)}
    catch(err){console.error('HR-F-12 fill failed',err);alert(`تعذر تجهيز ملف HR-F-12 المعبأ. سبب تقني: ${err?.message||'غير معروف'}`)}
    finally{if(btn instanceof HTMLButtonElement){btn.disabled=false;btn.textContent=btn.dataset.oldText||'تحميل'}}
  }
  function ensureRecommendationButtons(){document.querySelectorAll('.form-recommendation').forEach(card=>{const title=card.querySelector('strong')?.textContent||'';if(!title.includes('HR-F-12'))return;const actions=card.querySelector('.actions');if(!actions)return;actions.querySelectorAll('.download-blank-hrf12').forEach(x=>x.remove());if(actions.querySelector('.original-blank-hrf12'))return;const btn=document.createElement('button');btn.type='button';btn.className='outline original-blank-hrf12';btn.textContent='تحميل النموذج الأصلي التفاعلي';btn.addEventListener('click',downloadBlank);actions.prepend(btn)})}
  function ensureFormButtons(){const formEl=document.querySelector('#guidedForm');if(!formEl)return;const heading=document.querySelector('.form-layout h2')?.textContent||'';if(!heading.includes('HR-F-12'))return;readGuidedForm();formEl.querySelectorAll('input,select,textarea').forEach(el=>{if(el.dataset.pdfCacheBound)return;el.dataset.pdfCacheBound='1';el.addEventListener('change',readGuidedForm);el.addEventListener('input',readGuidedForm)});const actions=formEl.querySelector('.form-actions');if(!actions)return;actions.querySelectorAll('.download-filled-hrf12,.download-blank-hrf12').forEach(x=>x.remove());if(actions.querySelector('.download-original-filled'))return;const fill=document.createElement('button');fill.type='button';fill.className='primary download-original-filled';fill.textContent='تعبئة وتحميل النموذج الأصلي PDF';fill.addEventListener('click',()=>downloadFilled(readGuidedForm()||{}));const blank=document.createElement('button');blank.type='button';blank.className='outline original-blank-hrf12';blank.textContent='تحميل النموذج الأصلي فارغ';blank.addEventListener('click',downloadBlank);actions.prepend(fill,blank)}
  function ensureDraftButtons(){const draft=document.querySelector('.draft');if(!draft||!(draft.querySelector('h2')?.textContent||'').includes('HR-F-12')||draft.querySelector('.pdf-output-actions'))return;const actions=document.createElement('div');actions.className='actions pdf-output-actions';const fill=document.createElement('button');fill.type='button';fill.className='primary download-original-filled';fill.textContent='تحميل HR-F-12 الأصلي معبأ';fill.addEventListener('click',()=>downloadFilled(readCached()));const blank=document.createElement('button');blank.type='button';blank.className='outline original-blank-hrf12';blank.textContent='تحميل النموذج الأصلي فارغ';blank.addEventListener('click',downloadBlank);actions.append(fill,blank);draft.append(actions)}
  function enhance(){ensureRecommendationButtons();ensureFormButtons();ensureDraftButtons()}
  const observer=new MutationObserver(enhance);function boot(){enhance();observer.observe(document.body,{childList:true,subtree:true})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();