(() => {
  'use strict';

  const CACHE_KEY = 'ndr_hrf12_last_draft';

  const esc = value => String(value ?? '').trim();
  const norm = value => esc(value).replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').toLowerCase();

  function formatDate(value) {
    const raw = esc(value);
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : raw;
  }

  function readGuidedForm() {
    const form = document.querySelector('#guidedForm');
    if (!form) return null;
    const data = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('[name]').forEach(el => {
      if (el.name && el.value !== undefined) data[el.name] = el.value;
    });
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
    return data;
  }

  function readCached() {
    try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function roundRect(ctx,x,y,w,h,r=4,fill=null,stroke='#111') {
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
    if (fill) { ctx.fillStyle=fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle=stroke; ctx.stroke(); }
  }

  function line(ctx,x1,y1,x2,y2,width=1,color='#111') {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineWidth=width; ctx.strokeStyle=color; ctx.stroke();
  }

  function text(ctx,value,x,y,{size=15,bold=false,align='left',dir='ltr',color='#111',maxWidth}={}) {
    const v = esc(value);
    if (!v) return;
    ctx.save();
    ctx.fillStyle=color;
    ctx.font=`${bold?'700':'400'} ${size}px Arial, Tahoma, sans-serif`;
    ctx.textAlign=align;
    ctx.direction=dir;
    ctx.textBaseline='middle';
    if (maxWidth) ctx.fillText(v,x,y,maxWidth); else ctx.fillText(v,x,y);
    ctx.restore();
  }

  function labelPair(ctx,en,ar,x1,x2,y) {
    text(ctx,en,x1,y,{size:12,bold:true});
    text(ctx,ar,x2,y,{size:12,bold:true,align:'right',dir:'rtl'});
  }

  function fieldValue(ctx,value,x,y,w,{align='center',dir='rtl',size=13}={}) {
    if (!esc(value)) return;
    text(ctx,value,align==='right'?x+w-6:align==='left'?x+6:x+w/2,y,{size,bold:true,align,dir,maxWidth:w-12,color:'#123f36'});
  }

  function check(ctx,x,y,checked) {
    ctx.strokeStyle='#111'; ctx.lineWidth=1.6; ctx.strokeRect(x,y,24,20);
    if (checked) text(ctx,'✓',x+12,y+11,{size:19,bold:true,align:'center',color:'#0b5c46'});
  }

  function buildHRF12Canvas(data={}, blank=false) {
    const W=1000,H=1414;
    const c=document.createElement('canvas'); c.width=W; c.height=H;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
    ctx.lineWidth=1.5; ctx.strokeStyle='#111';

    const d = blank ? {} : data;
    const green='#e7f2ef', peach='#f7e8dc', blue='#e7f4f7';

    text(ctx,'Higher Institute for Paper & Industrial Technologies (HIPIT)',105,50,{size:17,bold:true,color:'#1c2c63'});
    text(ctx,'المعهد العالي للتقنيات الورقية والصناعية',895,50,{size:20,bold:true,align:'right',dir:'rtl',color:'#1c2c63'});
    line(ctx,105,68,895,68,2,'#1c2c63');
    text(ctx,'نموذج طلب إجازة',500,94,{size:22,bold:true,align:'center',dir:'rtl'});
    text(ctx,'VACATION REQUEST FORM (VRF)',500,120,{size:20,bold:true,align:'center'});

    const X=105,R=895,T=140,row=30;
    ctx.fillStyle=peach; ctx.fillRect(X,T,R-X,25); ctx.strokeRect(X,T,R-X,25);
    text(ctx,"Employee's Personal Information",225,T+13,{size:14,bold:true,align:'center'});
    text(ctx,'المعلومات الشخصية للموظف',790,T+13,{size:14,bold:true,align:'center',dir:'rtl'});

    let y=T+25;
    // ID / Date
    ctx.strokeRect(X,y,R-X,row); line(ctx,500,y,500,y+row);
    labelPair(ctx,"Employee's ID:",'الرقم الوظيفي:',112,490,y+15);
    labelPair(ctx,'Date:','التاريخ:',510,888,y+15);
    fieldValue(ctx,d.employeeId,250,y+15,235,{align:'center',dir:'ltr'});
    fieldValue(ctx,formatDate(d.requestDate),620,y+15,210,{align:'center',dir:'ltr'});
    y+=row;
    // name
    ctx.strokeRect(X,y,R-X,row); labelPair(ctx,'Name:','الاسم:',112,888,y+15);
    fieldValue(ctx,d.employeeName,220,y+15,610,{align:'center'}); y+=row;
    // position dept
    ctx.strokeRect(X,y,R-X,row); line(ctx,500,y,500,y+row);
    labelPair(ctx,'Position:','الوظيفة:',112,490,y+15); labelPair(ctx,'Dept./Section:','الإدارة/القسم:',510,888,y+15);
    fieldValue(ctx,d.position,220,y+15,255,{align:'center'}); fieldValue(ctx,d.department,625,y+15,210,{align:'center'}); y+=row;
    // contact joining
    ctx.strokeRect(X,y,R-X,row); line(ctx,500,y,500,y+row);
    labelPair(ctx,'Contact # during Vacation:','رقم الاتصال أثناء الإجازة:',112,490,y+15); labelPair(ctx,'Joining Date:','تاريخ التعيين:',510,888,y+15);
    fieldValue(ctx,d.vacationContact,260,y+15,210,{align:'center',dir:'ltr'}); fieldValue(ctx,formatDate(d.joiningDate),650,y+15,180,{align:'center',dir:'ltr'}); y+=row;
    // nationality mobile
    ctx.strokeRect(X,y,R-X,row); line(ctx,500,y,500,y+row);
    labelPair(ctx,'Nationality:','الجنسية:',112,490,y+15); labelPair(ctx,'Mobile #:','الجوال:',510,888,y+15);
    fieldValue(ctx,d.nationality,260,y+15,210,{align:'center'}); fieldValue(ctx,d.mobile,650,y+15,180,{align:'center',dir:'ltr'}); y+=row;
    // last vacation / no days
    ctx.strokeRect(X,y,R-X,row);
    text(ctx,'Last Vacation Date:',112,y+15,{size:12,bold:true});
    fieldValue(ctx,formatDate(d.lastVacationDate),230,y+15,210,{align:'center',dir:'ltr'});
    text(ctx,'No. of Days:',490,y+15,{size:12,bold:true,align:'center'});
    fieldValue(ctx,d.days,540,y+15,80,{align:'center',dir:'ltr'});
    text(ctx,'عدد الأيام',680,y+15,{size:12,bold:true,align:'right',dir:'rtl'});
    text(ctx,'تاريخ آخر إجازة',888,y+15,{size:12,bold:true,align:'right',dir:'rtl'});
    y+=38;

    // vacation information
    ctx.fillStyle=peach; ctx.fillRect(X,y,R-X,25); ctx.strokeRect(X,y,R-X,25);
    text(ctx,'Vacation & Visa Information',260,y+13,{size:14,bold:true,align:'center'});
    text(ctx,'معلومات الإجازة والتأشيرة',760,y+13,{size:14,bold:true,align:'center',dir:'rtl'}); y+=25;
    ctx.strokeRect(X,y,R-X,58);
    text(ctx,'Vacation from:',112,y+19,{size:12,bold:true}); text(ctx,'إجازة من',888,y+19,{size:12,bold:true,align:'right',dir:'rtl'});
    fieldValue(ctx,formatDate(d.vacationFrom),220,y+22,220,{align:'center',dir:'ltr'});
    text(ctx,'to',485,y+22,{size:12,bold:true,align:'center'});
    fieldValue(ctx,formatDate(d.vacationTo),540,y+22,220,{align:'center',dir:'ltr'});
    text(ctx,'إلى',790,y+22,{size:12,bold:true,align:'right',dir:'rtl'}); y+=58;

    ctx.strokeRect(X,y,R-X,55); line(ctx,500,y,500,y+55);
    text(ctx,'No. of Days',112,y+17,{size:12,bold:true}); fieldValue(ctx,d.days,230,y+17,110,{align:'center',dir:'ltr'});
    text(ctx,'Other (specify):',112,y+42,{size:12,bold:true}); fieldValue(ctx,d.otherType,255,y+42,210,{align:'center'});
    text(ctx,'Annual Vacation :',510,y+17,{size:12,bold:true}); check(ctx,700,y+6,norm(d.vacationType).includes('سنويه'));
    text(ctx,'إجازة سنوية',888,y+17,{size:12,bold:true,align:'right',dir:'rtl'});
    text(ctx,'Emergency Vacation :',510,y+42,{size:12,bold:true}); check(ctx,700,y+31,norm(d.vacationType).includes('طارئ'));
    text(ctx,'إجازة طارئة',888,y+42,{size:12,bold:true,align:'right',dir:'rtl'}); y+=60;

    // visa
    ctx.fillStyle=peach; ctx.fillRect(X,y,R-X,25); ctx.strokeRect(X,y,R-X,25);
    text(ctx,'Exit/Re-Entry Visa',280,y+13,{size:14,bold:true,align:'center'}); text(ctx,'تأشيرة الخروج و العودة',760,y+13,{size:14,bold:true,align:'center',dir:'rtl'}); y+=25;
    ctx.strokeRect(X,y,R-X,82); line(ctx,500,y,500,y+82);
    text(ctx,'My Self',250,y+20,{size:12,align:'center'}); check(ctx,455,y+8,norm(d.exitReentry)==='شخصي'); text(ctx,'شخصي',760,y+20,{size:12,align:'center',dir:'rtl'});
    text(ctx,'My Family',250,y+45,{size:12,align:'center'}); check(ctx,455,y+33,norm(d.exitReentry).includes('عائل')); text(ctx,'لعائلتي',760,y+45,{size:12,align:'center',dir:'rtl'});
    text(ctx,'# of Passport(s) Attached',250,y+70,{size:12,align:'center'}); fieldValue(ctx,d.passportsAttached,455,y+70,80,{align:'center',dir:'ltr'}); text(ctx,'عدد الجوازات المرفقة',760,y+70,{size:12,align:'center',dir:'rtl'}); y+=88;

    ctx.fillStyle=peach; ctx.fillRect(X,y,R-X,25); ctx.strokeRect(X,y,R-X,25);
    text(ctx,"Remarks by Employee's Dept.",285,y+13,{size:13,bold:true,align:'center'}); text(ctx,'ملاحظات من قبل إدارة الموظف',760,y+13,{size:13,bold:true,align:'center',dir:'rtl'}); y+=25;
    ctx.strokeRect(X,y,R-X,64);
    text(ctx,d.departmentRemarks,870,y+23,{size:13,align:'right',dir:'rtl',maxWidth:730}); y+=70;

    ctx.strokeRect(X,y,R-X,98); line(ctx,365,y,365,y+98); line(ctx,625,y,625,y+98);
    text(ctx,'Manager/Supervisor Sign',235,y+30,{size:11,bold:true,align:'center'}); text(ctx,'اعتماد مدير/مشرف القسم',340,y+30,{size:10,align:'right',dir:'rtl'});
    text(ctx,'Name/Sign of Alternate Employee',495,y+30,{size:11,bold:true,align:'center'}); text(ctx,'اسم/توقيع الموظف البديل',610,y+30,{size:10,align:'right',dir:'rtl'});
    fieldValue(ctx,d.alternateEmployee,410,y+62,170,{align:'center'}); line(ctx,405,y+75,585,y+75);
    text(ctx,'Emp. Sign',745,y+30,{size:11,bold:true,align:'center'}); text(ctx,'توقيع الموظف',870,y+30,{size:10,align:'right',dir:'rtl'}); line(ctx,690,y+75,865,y+75); y+=105;

    // HR section preserved blank
    ctx.fillStyle=blue; ctx.fillRect(X,y,R-X,25); ctx.strokeRect(X,y,R-X,25);
    text(ctx,'For HR Section',280,y+13,{size:14,bold:true,align:'center'}); text(ctx,'خاص بقسم الموارد البشرية',760,y+13,{size:14,bold:true,align:'center',dir:'rtl'}); y+=25;
    ctx.strokeRect(X,y,R-X,245);
    const hrLines=[
      'Employee deserves Vacation as per Contract/Company Policy',
      'Ticket Eligibility / Previous Leave Balance',
      'Total paid vacation days / Unpaid vacation days',
      'Total Days of Current Vacation / Leave Balance',
      'Air Ticket eligibility for Current Vacation',
      'The Approved Date of Vacation From / To',
      'Loan Balance / No. of Installments remaining',
      'Guarantor Info. / HR Section Sign'
    ];
    hrLines.forEach((t,i)=>{text(ctx,t,115,y+18+i*27,{size:10,bold:i===0});line(ctx,110,y+28+i*27,885,y+28+i*27,.7,'#999')}); y+=252;

    ctx.fillStyle=blue; ctx.fillRect(X,y,R-X,24); ctx.strokeRect(X,y,R-X,24); text(ctx,'Remarks / الملاحظات',500,y+12,{size:12,bold:true,align:'center'}); y+=24;
    ctx.strokeRect(X,y,R-X,62); y+=70;
    ctx.strokeRect(X,y,R-X,78); line(ctx,500,y,500,y+78);
    text(ctx,'CEO Approval (for special cases)',250,y+24,{size:11,bold:true,align:'center'}); text(ctx,'اعتماد الرئيس التنفيذي',450,y+24,{size:10,align:'right',dir:'rtl'}); line(ctx,150,y+55,420,y+55);
    text(ctx,'Checked by Accountant Dept.',680,y+24,{size:11,bold:true,align:'center'}); text(ctx,'تدقيق بواسطة إدارة المحاسبة',870,y+24,{size:10,align:'right',dir:'rtl'}); line(ctx,565,y+55,850,y+55); y+=90;

    ctx.strokeRect(X,y,R-X,52); line(ctx,350,y,350,y+52); line(ctx,650,y,650,y+52);
    text(ctx,'Ref. Title',115,y+14,{size:10,bold:true}); text(ctx,'HR-F-12',235,y+14,{size:10,bold:true});
    text(ctx,'Revision',365,y+14,{size:10,bold:true}); text(ctx,'4',600,y+14,{size:10});
    text(ctx,'Page Number',665,y+14,{size:10,bold:true}); text(ctx,'Page 1 of 1',790,y+14,{size:10});
    text(ctx,'This document is generated from the HR-F-12 employee data collected by NDR Smart Hub.',500,y+40,{size:9,align:'center',color:'#555'});

    return c;
  }

  function concatBytes(parts) {
    const total=parts.reduce((n,p)=>n+p.length,0); const out=new Uint8Array(total); let at=0;
    parts.forEach(p=>{out.set(p,at);at+=p.length}); return out;
  }

  function ascii(value) { return new TextEncoder().encode(value); }

  function jpegCanvasToPdf(canvas) {
    const dataUrl=canvas.toDataURL('image/jpeg',0.94);
    const bin=atob(dataUrl.split(',')[1]); const jpg=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) jpg[i]=bin.charCodeAt(i);

    const objects=[];
    objects[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');
    objects[2]=ascii('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objects[3]=ascii('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    objects[4]=concatBytes([ascii(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`),jpg,ascii('\nendstream')]);
    const content='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';
    objects[5]=ascii(`<< /Length ${content.length} >>\nstream\n${content}endstream`);

    const chunks=[ascii('%PDF-1.4\n%âãÏÓ\n')];
    const offsets=[0]; let offset=chunks[0].length;
    for(let i=1;i<=5;i++){
      offsets[i]=offset;
      const chunk=concatBytes([ascii(`${i} 0 obj\n`),objects[i],ascii('\nendobj\n')]);
      chunks.push(chunk); offset+=chunk.length;
    }
    const xrefOffset=offset;
    let xref='xref\n0 6\n0000000000 65535 f \n';
    for(let i=1;i<=5;i++) xref+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
    xref+=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    chunks.push(ascii(xref));
    return new Blob([concatBytes(chunks)],{type:'application/pdf'});
  }

  function downloadHRF12(data,blank=false) {
    const canvas=buildHRF12Canvas(data,blank);
    const pdf=jpegCanvasToPdf(canvas);
    const id=blank?'blank':(data.employeeId||'employee');
    downloadBlob(pdf,`HR-F-12_${id}.pdf`);
  }

  function ensureRecommendationButtons() {
    document.querySelectorAll('.form-recommendation').forEach(card=>{
      const title=card.querySelector('strong')?.textContent||'';
      if (!title.includes('HR-F-12')) return;
      const actions=card.querySelector('.actions'); if(!actions||actions.querySelector('.download-blank-hrf12')) return;
      const btn=document.createElement('button'); btn.type='button'; btn.className='outline download-blank-hrf12'; btn.textContent='تحميل HR-F-12 فارغ PDF';
      btn.addEventListener('click',()=>downloadHRF12({},true)); actions.prepend(btn);
    });
  }

  function ensureFormDownloadButton() {
    const form=document.querySelector('#guidedForm'); if(!form) return;
    const heading=document.querySelector('.form-layout h2')?.textContent||''; if(!heading.includes('HR-F-12')) return;
    readGuidedForm();
    form.querySelectorAll('input,select,textarea').forEach(el=>{
      if(el.dataset.pdfCacheBound) return; el.dataset.pdfCacheBound='1'; el.addEventListener('change',readGuidedForm); el.addEventListener('input',readGuidedForm);
    });
    const actions=form.querySelector('.form-actions'); if(!actions||actions.querySelector('.download-filled-hrf12')) return;
    const btn=document.createElement('button'); btn.type='button'; btn.className='primary download-filled-hrf12'; btn.textContent='إنشاء وتحميل HR-F-12 PDF';
    btn.addEventListener('click',()=>downloadHRF12(readGuidedForm()||{},false));
    actions.prepend(btn);
    const blank=document.createElement('button'); blank.type='button'; blank.className='outline download-blank-hrf12'; blank.textContent='تحميل نسخة فارغة'; blank.addEventListener('click',()=>downloadHRF12({},true)); actions.prepend(blank);
  }

  function ensureDraftDownloadButton() {
    const draft=document.querySelector('.draft'); if(!draft) return;
    const heading=draft.querySelector('h2')?.textContent||''; if(!heading.includes('HR-F-12')) return;
    if(draft.querySelector('.download-filled-hrf12')) return;
    const actions=document.createElement('div'); actions.className='actions pdf-output-actions';
    const btn=document.createElement('button'); btn.type='button'; btn.className='primary download-filled-hrf12'; btn.textContent='تحميل HR-F-12 المعبأ PDF'; btn.addEventListener('click',()=>downloadHRF12(readCached(),false));
    const blank=document.createElement('button'); blank.type='button'; blank.className='outline download-blank-hrf12'; blank.textContent='تحميل نسخة فارغة'; blank.addEventListener('click',()=>downloadHRF12({},true));
    actions.append(btn,blank); draft.append(actions);
  }

  function enhance() {
    ensureRecommendationButtons(); ensureFormDownloadButton(); ensureDraftDownloadButton();
  }

  const observer=new MutationObserver(enhance);
  function boot(){enhance();observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
