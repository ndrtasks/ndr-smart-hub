import { users } from './data.js';
import { knowledgeBase, rankKnowledge, normalizeText } from './knowledge-base.js';

const app = document.querySelector('#app');
const KEYS = { user:'ndr_ka_user', lang:'ndr_ka_lang', chat:'ndr_ka_chat' };
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const h=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

const state={
  user: users.find(u=>u.id===load(KEYS.user,null)?.id)||null,
  language: load(KEYS.lang,'ar'),
  panel:'assistant',
  messages: load(KEYS.chat,[]),
  activeSourceId:null,
  activeFormCode:null,
  formDraft:{},
  reviewMode:false,
  busy:false
};

function isEn(){return state.language==='en'}
function tr(ar,en){return isEn()?en:ar}
function applyLocale(){document.documentElement.lang=state.language;document.documentElement.dir=isEn()?'ltr':'rtl'}
function userName(u){return isEn()?(u?.nameEn||u?.name||'-'):(u?.name||u?.nameEn||'-')}
function userTitle(u){return isEn()?(u?.titleEn||u?.title||'-'):(u?.title||u?.titleEn||'-')}
function sourceById(id){return knowledgeBase.find(x=>x.id===id)}
function formByCode(code){for(const s of knowledgeBase){const f=(s.relatedForms||[]).find(x=>x.code===code);if(f)return {source:s,form:f}}return null}
function localize(obj,key){return isEn()?(obj?.[`${key}En`]||obj?.[key]||''):(obj?.[key]||obj?.[`${key}En`]||'')}
function persistChat(){save(KEYS.chat,state.messages.slice(-40))}

function setLanguage(lang){state.language=lang;save(KEYS.lang,lang);applyLocale();render()}
function login(id){state.user=users.find(u=>u.id===id)||null;save(KEYS.user,state.user);render()}
function logout(){state.user=null;localStorage.removeItem(KEYS.user);render()}

function initialAssistantMessage(){
  return tr('اسألني عن أي إجراء أو نموذج موارد بشرية متوفر في المنصة. سأجيبك من المصدر الداخلي فقط وأعطيك النموذج المناسب إذا كان مرتبطا بالإجراء.','Ask about any HR procedure or form available in the platform. I will answer only from internal sources and show the related form when available.');
}

function recommendedFormFor(source,question=''){
  const q=normalizeText(question);
  if(source.id==='leave-procedure'){
    if(q.includes('قصير')||q.includes('اقل من 7')||q.includes('short leave'))return 'HR-F-20';
    if(q.includes('عود')||q.includes('استئناف')||q.includes('return from leave'))return 'HR-F-21';
    if(q.includes('تاشير')||q.includes('تذكر')||q.includes('ticket')||q.includes('visa'))return 'HR-F-13';
    return 'HR-F-12';
  }
  return source.relatedForms?.[0]?.code||null;
}

function localAnswer(question){
  const ranked=rankKnowledge(question);const best=ranked[0];
  if(!best||best.score<2)return {answer:tr('لم أجد إجابة موثوقة في الإجراءات والنماذج المرفوعة حاليا. لن أفترض إجراء غير موجود في المصادر.','I could not find a reliable answer in the currently uploaded procedures and forms. I will not invent a process that is not in the sources.'),sourceIds:[],recommendedFormCode:null};
  const s=best.item;const formCode=recommendedFormFor(s,question);
  const intro=tr(`حسب المصدر ${s.code} (${s.revision}):`,`According to ${s.code} (${s.revision}):`);
  const body=s.sourceTextAr.map(x=>`• ${x}`).join('\n');
  const pilot=tr('\n\nتنبيه: هذا مصدر مؤقت للتجربة وسيستبدل عند رفع النسخة الجديدة المعتمدة.','\n\nNote: this is a temporary pilot source and will be replaced when the new approved version is uploaded.');
  return {answer:`${intro}\n${body}${s.status==='temporary-pilot'?pilot:''}`,sourceIds:[s.id],recommendedFormCode:formCode};
}

async function askQuestion(text){
  const q=(text||'').trim();if(!q||state.busy)return;
  state.messages.push({role:'user',text:q});state.busy=true;persistChat();render();
  let result=null;
  try{
    const payload={
      text:q,language:state.language,
      messages:state.messages.slice(-8).map(m=>({role:m.role,text:m.text})),
      sources:knowledgeBase.map(s=>({id:s.id,title:s.title,titleEn:s.titleEn,code:s.code,revision:s.revision,status:s.status,summaryAr:s.summaryAr,summaryEn:s.summaryEn,sourceTextAr:s.sourceTextAr,relatedForms:s.relatedForms.map(f=>({code:f.code,title:f.title,titleEn:f.titleEn,indexed:f.indexed,noteAr:f.noteAr||'',noteEn:f.noteEn||''}))}))
    };
    const res=await fetch('/api/ai-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(res.ok){const data=await res.json();if(!data.fallback)result=data}
  }catch{}
  if(!result)result=localAnswer(q);
  if(result.clarificationQuestion)state.messages.push({role:'ai',text:result.clarificationQuestion,sourceIds:[]});
  else state.messages.push({role:'ai',text:result.answer||localAnswer(q).answer,sourceIds:result.sourceIds||[],recommendedFormCode:result.recommendedFormCode||null});
  state.busy=false;persistChat();render();
}

function sourceBadge(s){return `<span class="pilot-badge">${tr('مصدر تجريبي مؤقت','Temporary pilot source')}</span>`}
function sourceMeta(s){return `<div class="source-meta"><span><b>${h(s.code)}</b></span><span>${tr('الإصدار','Revision')}: ${h(s.revision)}</span><span>${h(s.sourceDate||'')}</span></div>`}

function formActionBlock(code){
  const found=formByCode(code);if(!found)return '';
  const {source,form}=found;
  return `<div class="form-recommendation">
    <div><span class="eyebrow">${tr('النموذج المرتبط','Related form')}</span><strong>${h(form.code)} — ${h(localize(form,'title'))}</strong>${form.noteAr?`<small>${h(localize(form,'note'))}</small>`:''}</div>
    <div class="actions">
      ${form.assetPath?`<a class="outline" href="${encodeURI(form.assetPath)}" target="_blank">${tr('فتح النموذج الأصلي','Open original form')}</a>`:''}
      ${form.indexed?`<button class="primary guided-form" data-form="${h(form.code)}">${tr('ساعدني في تعبئته','Help me fill it')}</button>`:`<button class="outline" disabled>${tr('التعبئة الموجهة بعد فهرسة النموذج','Guided filling after form indexing')}</button>`}
    </div>
  </div>`;
}

function messageCard(m){
  if(m.role==='user')return `<div class="msg user"><div>${h(m.text)}</div></div>`;
  const sources=(m.sourceIds||[]).map(sourceById).filter(Boolean);
  return `<div class="msg ai"><div class="answer-text">${h(m.text).replace(/\n/g,'<br>')}</div>
    ${sources.length?`<div class="answer-sources">${sources.map(s=>`<button class="source-link" data-source="${s.id}">${h(s.code)} · ${h(localize(s,'title'))}</button>`).join('')}</div>`:''}
    ${m.recommendedFormCode?formActionBlock(m.recommendedFormCode):''}
  </div>`;
}

function assistantPanel(){
  const messages=state.messages.length?state.messages:[{role:'ai',text:initialAssistantMessage(),sourceIds:[]}];
  return `<section class="hero">
    <div class="hero-copy"><span class="ai-pill">NDR Knowledge Assistant</span><h2>${tr('اسأل عن الإجراء بدل ما تبحث عنه','Ask the procedure instead of searching for it')}</h2><p>${tr('الإجابة من الإجراءات والنماذج الداخلية فقط. وإذا كان هناك نموذج مرتبط سأعطيك إياه وأساعدك في تعبئته عندما تكون حقوله مفهرسة.','Answers come only from internal procedures and forms. When a related form exists, I will show it and help fill it when its fields are indexed.')}</p></div>
  </section>
  <section class="assistant-grid">
    <div class="chat-card card">
      <div class="chat-head"><div><strong>${tr('مساعد الموظف','Employee Assistant')}</strong><small>${tr('لا يستخدم الإنترنت كمصدر للسياسات','Does not use the internet as a policy source')}</small></div><span class="grounded">${tr('مقيد بالمصادر','Source grounded')}</span></div>
      <div class="messages">${messages.map(messageCard).join('')}${state.busy?`<div class="msg ai typing">${tr('أراجع المصادر المتوفرة...','Checking available sources...')}</div>`:''}</div>
      <div class="ask-box"><textarea id="question" rows="2" placeholder="${tr('مثال: كيف أقدم إجازة؟','Example: How do I apply for leave?')}"></textarea><button id="sendQuestion" class="primary">${tr('اسأل','Ask')}</button></div>
      <div class="chips">
        <button class="chip quick-question">${tr('كيف أقدم إجازة؟','How do I apply for leave?')}</button>
        <button class="chip quick-question">${tr('أبي أطلب بدل السكن','I need housing allowance')}</button>
        <button class="chip quick-question">${tr('نسيت بصمة الخروج أمس','I missed my clock-out yesterday')}</button>
      </div>
    </div>
    <aside class="card source-side"><span class="eyebrow">${tr('المصادر الحالية','Current sources')}</span><h3>${knowledgeBase.length}</h3><p>${tr('وثائق مفهرسة حاليا للتجربة. سيتم استبدال القديمة بالكامل عند رفع النسخ الجديدة.','Documents currently indexed for the pilot. Old versions will be fully replaced when new versions are uploaded.')}</p>${knowledgeBase.map(s=>`<button class="mini-source source-link" data-source="${s.id}"><b>${h(s.code)}</b><span>${h(localize(s,'title'))}</span></button>`).join('')}</aside>
  </section>`;
}

function knowledgePanel(){return `<section class="section-head"><div><span class="eyebrow">${tr('المكتبة الداخلية','Internal library')}</span><h2>${tr('الإجراءات والنماذج المتاحة','Available procedures and forms')}</h2><p>${tr('هذه النسخ مؤقتة للتجربة حتى استبدالها بالمصادر الجديدة المعتمدة.','These versions are temporary for the pilot until replaced by newly approved sources.')}</p></div></section><div class="knowledge-grid">${knowledgeBase.map(s=>`<article class="card knowledge-card">${sourceBadge(s)}<h3>${h(localize(s,'title'))}</h3>${sourceMeta(s)}<p>${h(localize(s,'summary'))}</p><div class="forms-mini">${s.relatedForms.map(f=>`<span>${h(f.code)} · ${h(localize(f,'title'))}</span>`).join('')}</div><button class="outline source-link" data-source="${s.id}">${tr('عرض المصدر','View source')}</button></article>`).join('')}</div>`}

function sourcePanel(){const s=sourceById(state.activeSourceId);if(!s)return knowledgePanel();return `<button class="back" data-panel="knowledge">← ${tr('العودة للمكتبة','Back to library')}</button><article class="card source-detail">${sourceBadge(s)}<div class="source-title"><div><span class="eyebrow">${h(s.code)}</span><h2>${h(localize(s,'title'))}</h2></div>${sourceMeta(s)}</div><p class="lead">${h(localize(s,'summary'))}</p><div class="source-note">${tr('الإجابة الآلية يجب أن تبقى داخل المعلومات التالية ولا تستنتج سياسة غير مكتوبة.','Automated answers must stay within the following information and must not infer unwritten policy.')}</div><div class="steps">${s.sourceTextAr.map((x,i)=>`<div><b>${i+1}</b><span>${h(x)}</span></div>`).join('')}</div><h3>${tr('النماذج المرتبطة','Related forms')}</h3><div class="related-list">${s.relatedForms.map(f=>`<div class="related-form"><div><strong>${h(f.code)} — ${h(localize(f,'title'))}</strong>${f.noteAr?`<small>${h(localize(f,'note'))}</small>`:''}</div><div class="actions">${f.assetPath?`<a class="outline" href="${encodeURI(f.assetPath)}" target="_blank">${tr('فتح الملف','Open file')}</a>`:''}${f.indexed?`<button class="primary guided-form" data-form="${f.code}">${tr('تعبئة موجهة','Guided fill')}</button>`:`<span class="not-indexed">${tr('الحقول غير مفهرسة بعد','Fields not indexed yet')}</span>`}</div></div>`).join('')}</div></article>`}

function inputControl(f,value=''){
  const label=h(isEn()?(f.labelEn||f.label):f.label);const req=f.required?' *':'';
  if(f.type==='select')return `<label class="field"><span>${label}${req}</span><select name="${f.id}" ${f.required?'required':''}><option value="">${tr('اختر','Select')}</option>${(f.options||[]).map(o=>`<option value="${h(o)}" ${String(value)===String(o)?'selected':''}>${h(o)}</option>`).join('')}</select></label>`;
  if(f.type==='textarea')return `<label class="field wide"><span>${label}${req}</span><textarea name="${f.id}" ${f.required?'required':''}>${h(value)}</textarea></label>`;
  return `<label class="field"><span>${label}${req}</span><input type="${h(f.type||'text')}" name="${f.id}" value="${h(value)}" ${f.required?'required':''}></label>`;
}

function formPanel(){
  const found=formByCode(state.activeFormCode);if(!found)return assistantPanel();const {source,form}=found;
  if(!form.indexed)return `<div class="card"><h2>${h(form.code)}</h2><p>${tr('النموذج مرتبط بالمصدر لكن حقوله لم تتم فهرستها بعد. لن أنشئ حقولا من عندي.','The form is linked to the source but its fields have not been indexed yet. I will not invent fields.')}</p></div>`;
  if(state.reviewMode){return draftPreview(source,form)}
  return `<button class="back" data-panel="assistant">← ${tr('العودة للمساعد','Back to assistant')}</button><section class="form-layout"><div class="card"><span class="eyebrow">${tr('تعبئة موجهة','Guided form filling')}</span><h2>${h(form.code)} — ${h(localize(form,'title'))}</h2><div class="pilot-inline">${tr('مسودة فقط. لن يتم الإرسال أو الاعتماد من المنصة في هذه المرحلة.','Draft only. The platform will not submit or approve it in this phase.')}</div><div class="prefill"><div><span>${tr('الاسم','Name')}</span><strong>${h(userName(state.user))}</strong></div><div><span>${tr('الرقم الوظيفي','Employee ID')}</span><strong>${h(state.user?.id||'-')}</strong></div><div><span>${tr('القسم','Department')}</span><strong>${h(state.user?.departmentId||'-')}</strong></div><div><span>${tr('المسمى','Job title')}</span><strong>${h(userTitle(state.user))}</strong></div></div><form id="guidedForm" class="form-grid">${form.fields.map(f=>inputControl(f,state.formDraft[f.id]||'')).join('')}<div class="form-actions wide"><button class="primary" type="submit">${tr('مراجعة المسودة','Review draft')}</button></div></form></div><aside class="card form-source"><span class="eyebrow">${tr('المصدر','Source')}</span><h3>${h(source.code)}</h3><p>${h(localize(source,'title'))}</p>${sourceBadge(source)}${sourceMeta(source)}${form.assetPath?`<a class="outline full" href="${encodeURI(form.assetPath)}" target="_blank">${tr('فتح النموذج الأصلي','Open original form')}</a>`:''}</aside></section>`;
}

function draftPreview(source,form){const rows=form.fields.map(f=>`<div class="preview-row"><span>${h(isEn()?(f.labelEn||f.label):f.label)}</span><strong>${h(state.formDraft[f.id]||'-')}</strong></div>`).join('');return `<button class="back edit-draft">← ${tr('تعديل البيانات','Edit data')}</button><section class="card draft"><div class="draft-head"><div><span class="eyebrow">${tr('مسودة للمراجعة','Review draft')}</span><h2>${h(form.code)} — ${h(localize(form,'title'))}</h2></div>${sourceBadge(source)}</div><div class="preview-section"><h3>${tr('بيانات الموظف','Employee information')}</h3><div class="preview-grid"><div class="preview-row"><span>${tr('الاسم','Name')}</span><strong>${h(userName(state.user))}</strong></div><div class="preview-row"><span>${tr('الرقم الوظيفي','Employee ID')}</span><strong>${h(state.user?.id||'-')}</strong></div><div class="preview-row"><span>${tr('المسمى','Job title')}</span><strong>${h(userTitle(state.user))}</strong></div><div class="preview-row"><span>${tr('القسم','Department')}</span><strong>${h(state.user?.departmentId||'-')}</strong></div></div></div><div class="preview-section"><h3>${tr('بيانات الطلب','Request information')}</h3><div class="preview-grid">${rows}</div></div><div class="source-note">${tr('هذه مسودة مبنية على البيانات المدخلة ولم يتم إرسالها أو توقيعها أو اعتمادها.','This is a draft based on entered data. It has not been submitted, signed, or approved.')}</div>${form.assetPath?`<a class="outline" href="${encodeURI(form.assetPath)}" target="_blank">${tr('فتح النموذج الأصلي للمقارنة','Open original form for comparison')}</a>`:''}</section>`}

function loginView(){applyLocale();app.innerHTML=`<div class="login-shell"><div class="login-copy"><span class="ai-pill">NDR Smart Hub</span><h1>${tr('اعرف الإجراء الصحيح قبل ما تبدأ','Know the correct procedure before you start')}</h1><p>${tr('نسخة تجريبية لمساعد الموظفين اعتمادا على الإجراءات والنماذج الداخلية.','Pilot employee assistant based on internal procedures and forms.')}</p></div><div class="login-card card"><div class="lang-row"><button data-lang="ar">العربية</button><button data-lang="en">English</button></div><h2>${tr('دخول تجريبي','Demo login')}</h2><label class="field"><span>${tr('المستخدم','User')}</span><select id="loginUser">${users.filter(u=>u.role!=='system_admin').map(u=>`<option value="${u.id}">${h(userName(u))} — ${h(userTitle(u))}</option>`).join('')}</select></label><button id="loginBtn" class="primary full">${tr('دخول','Sign in')}</button></div></div>`;document.querySelector('#loginBtn').onclick=()=>login(document.querySelector('#loginUser').value);document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>setLanguage(b.dataset.lang))}

function shell(){const content=state.panel==='knowledge'?knowledgePanel():state.panel==='source'?sourcePanel():state.panel==='form'?formPanel():assistantPanel();return `<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">NDR</div><div><strong>Smart Hub</strong><small>${tr('بوابة المعرفة الداخلية','Internal Knowledge Portal')}</small></div></div><nav><button data-panel="assistant" class="${state.panel==='assistant'?'active':''}">${tr('اسأل المساعد','Ask Assistant')}</button><button data-panel="knowledge" class="${['knowledge','source'].includes(state.panel)?'active':''}">${tr('مكتبة الإجراءات','Procedure Library')}</button></nav><div class="sidebar-foot"><div class="user-card"><div class="avatar">${h(userName(state.user).slice(0,1))}</div><div><strong>${h(userName(state.user))}</strong><small>${h(userTitle(state.user))}</small></div></div><div class="foot-actions"><button id="langSwitch">${isEn()?'العربية':'English'}</button><button id="logoutBtn">${tr('خروج','Logout')}</button></div></div></aside><main class="main"><div class="topbar"><div><span class="eyebrow">${tr('تجربة بوابة المعرفة','Knowledge portal pilot')}</span><h1>${state.panel==='knowledge'?tr('المكتبة','Library'):state.panel==='source'?tr('تفاصيل المصدر','Source details'):state.panel==='form'?tr('تعبئة النموذج','Fill form'):tr('مساعد الموظف','Employee Assistant')}</h1></div><div class="top-note">${tr('المصادر الحالية مؤقتة للتجربة','Current sources are temporary for pilot')}</div></div>${content}</main></div>`}

function bind(){
  document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{state.panel=b.dataset.panel;state.reviewMode=false;render()});
  document.querySelector('#logoutBtn')?.addEventListener('click',logout);
  document.querySelector('#langSwitch')?.addEventListener('click',()=>setLanguage(isEn()?'ar':'en'));
  document.querySelector('#sendQuestion')?.addEventListener('click',()=>askQuestion(document.querySelector('#question')?.value));
  document.querySelector('#question')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();askQuestion(e.target.value)}});
  document.querySelectorAll('.quick-question').forEach(b=>b.onclick=()=>askQuestion(b.textContent));
  document.querySelectorAll('.source-link').forEach(b=>b.onclick=()=>{state.activeSourceId=b.dataset.source;state.panel='source';render()});
  document.querySelectorAll('.guided-form').forEach(b=>b.onclick=()=>{state.activeFormCode=b.dataset.form;state.formDraft={};state.reviewMode=false;state.panel='form';render()});
  document.querySelector('#guidedForm')?.addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());state.formDraft=data;state.reviewMode=true;render()});
  document.querySelector('.edit-draft')?.addEventListener('click',()=>{state.reviewMode=false;render()});
}

function render(){applyLocale();if(!state.user)return loginView();app.innerHTML=shell();bind()}
render();
