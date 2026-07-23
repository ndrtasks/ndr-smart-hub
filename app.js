import { employees, departments, services, demoRequests, knowledge } from './data.js';

const REQUESTS_KEY = 'ndr_requests_v2';
const SERVICE_FLAGS_KEY = 'ndr_service_flags_v1';

const state = {
  user: JSON.parse(localStorage.getItem('ndr_user') || 'null'),
  panel: 'home',
  activeService: null,
  activeRequestId: null,
  requests: loadRequests(),
  wizardStep: 1,
  draft: {},
  editRequestId: null,
  messages: [
    {role:'ai', text:'أهلا بك. اشرح لي ما الذي تريد إنجازه، وسأحدد الخدمة والإجراء والنموذج وطريقة التقديم من المحتوى المعتمد المتاح.'}
  ]
};

const app = document.querySelector('#app');
const icons = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z"/><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
  requests:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4h10v16H7z"/><path d="M9.5 8h5M9.5 12h5M9.5 16h3"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6"/><path d="M16 5.5a3 3 0 0 1 0 5.5M16.5 14c2.7.4 4.5 2.3 4.5 5"/></svg>',
  wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12"/><path d="M16 12h5"/></svg>',
  graduation:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 12v4c2.8 2 7.2 2 10 0v-4"/></svg>',
  megaphone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11v3h4l9 4V7l-9 4H4Z"/><path d="m17 10 4-2v9l-4-2"/><path d="m8 14 1.5 5h3"/></svg>',
  cpu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/></svg>',
  building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 21V5l7-3v19M12 8h7v13M2 21h20"/><path d="M8 7h1M8 11h1M8 15h1M15 11h1M15 15h1"/></svg>',
  file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 18 6-6-6-6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>',
  upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v5h16v-5"/></svg>'
};

function loadRequests(){
  try {
    const saved = JSON.parse(localStorage.getItem(REQUESTS_KEY) || 'null');
    return Array.isArray(saved) ? saved : structuredClone(demoRequests);
  } catch { return structuredClone(demoRequests); }
}
function saveRequests(){ localStorage.setItem(REQUESTS_KEY, JSON.stringify(state.requests)); }
function loadServiceFlags(){ try{return JSON.parse(localStorage.getItem(SERVICE_FLAGS_KEY)||'{}')}catch{return {}} }
function isServiceActive(service){ const flags=loadServiceFlags(); return flags[service.id] ?? service.active !== false; }
function setServiceActive(id,value){ const flags=loadServiceFlags(); flags[id]=value; localStorage.setItem(SERVICE_FLAGS_KEY,JSON.stringify(flags)); render(); }
function h(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function nowIso(){return new Date().toISOString()}
function fmtDate(iso){try{return new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}catch{return iso}}
function employeeName(id){return employees.find(e=>e.id===id)?.name||id}
function getService(id){return services.find(s=>s.id===id)}
function deptName(id){return departments.find(d=>d.id===id)?.name||id}
function deptIcon(id){return icons[departments.find(d=>d.id===id)?.icon]||icons.grid}
function modeLabel(mode){return {PORTAL_ONLY:'بورتال فقط',FORM_PORTAL:'نموذج + بورتال',FORM_WORKFLOW:'نموذج + اعتماد',INFO_ONLY:'معلومات فقط'}[mode]||mode}
function roleLabel(role){return {employee:'موظف',specialist:'مختص',manager:'مدير',admin:'مدير النظام',system:'النظام'}[role]||role}
function currentWorkflowStep(req){const s=getService(req.serviceId);return s?.workflow?.[req.stepIndex]||null}
function requestStatus(req){
  if(req.status==='completed')return {label:'مكتمل',className:'done'};
  if(req.status==='rejected')return {label:'مرفوض',className:'rejected'};
  if(req.status==='returned')return {label:'معاد للاستكمال',className:'returned'};
  const step=currentWorkflowStep(req);
  return {label:step?`بانتظار ${step.label}`:'قيد المعالجة',className:'pending'};
}
function requestProgress(req){
  if(req.status==='completed')return 100;
  const s=getService(req.serviceId); const total=Math.max(s?.workflow?.length||1,1);
  return Math.max(12,Math.min(92,Math.round(((req.stepIndex+1)/total)*100)));
}
function userRequests(){
  if(!state.user)return [];
  if(state.user.role==='admin') return state.requests;
  return state.requests.filter(r=>r.ownerId===state.user.id);
}
function canApprove(req){
  if(!state.user||req.status!=='pending')return false;
  const step=currentWorkflowStep(req); if(!step)return false;
  return state.user.role==='admin' ? step.role!=='employee' : step.role===state.user.role;
}
function pendingApprovals(){return state.requests.filter(canApprove)}

function setUser(id){state.user=employees.find(e=>e.id===id);localStorage.setItem('ndr_user',JSON.stringify(state.user));state.panel='home';state.activeRequestId=null;render()}
function logout(){localStorage.removeItem('ndr_user');state.user=null;render()}
function navigate(panel){state.panel=panel;state.activeService=null;state.activeRequestId=null;state.editRequestId=null;render()}
function selectService(id){state.activeService=getService(id);state.panel='service';state.activeRequestId=null;render()}
function openRequest(id){state.activeRequestId=id;state.panel='request-detail';render()}

function answerLocalAI(text){
  const q=text.trim().toLowerCase(); if(!q)return null; let match=null;
  if(q.includes('سكن'))match=getService('housing');
  else if(q.includes('شهادة')||q.includes('دورة')||q.includes('دورات')||q.includes('shrm'))match=getService('cert-support');
  else if(q.includes('رحلة')||q.includes('سفر')||q.includes('خارج جدة')||q.includes('مهمة خارج'))match=getService('business-trip');
  else if(q.includes('مرضي')||q.includes('مرضية')||q.includes('تقرير طبي'))match=getService('sick-leave');
  if(!match)return {text:'لم أجد خدمة مؤكدة من المحتوى الحالي. لن أفترض إجراء غير معتمد. يمكنك تصفح الخدمات يدويا، وبعد رفع ملفات الأقسام سأحدد الخدمة بدقة من الوثائق المعتمدة.',source:'محرك الطوارئ المحلي — لا يوجد مصدر معتمد مرتبط بهذا الطلب حاليا.'};
  return {text:`الخدمة الأقرب لطلبك هي ${match.name}. ${match.description} سأعتمد على بيانات حسابك للحقول الثابتة وأسألك فقط عن البيانات المتغيرة عند بدء التنفيذ.`,source:match.source,service:match};
}
function submitAI(value){const text=value??document.querySelector('#aiInput')?.value;if(!text?.trim())return;state.messages.push({role:'user',text:text.trim()});const r=answerLocalAI(text);state.messages.push({role:'ai',text:r.text,source:r.source,service:r.service});state.panel='assistant';render()}

function startService(id){
  const service=getService(id); if(!service)return;
  state.activeService=service;
  if(service.mode==='PORTAL_ONLY'){state.panel='portal-guide';render();return;}
  state.wizardStep=1; state.draft={}; state.editRequestId=null; state.panel='request-new'; render();
}
function editReturnedRequest(id){
  const req=state.requests.find(r=>r.id===id); if(!req)return;
  state.activeService=getService(req.serviceId); state.draft={...req.formData}; state.editRequestId=id; state.wizardStep=1; state.panel='request-new'; render();
}
function collectDraft(){
  const form=document.querySelector('#requestForm'); if(!form)return false;
  const service=state.activeService; const data={}; let valid=true;
  service.fields.forEach(f=>{
    const el=form.querySelector(`[name="${f.id}"]`); const value=el?.value?.trim?.() ?? el?.value ?? '';
    if(f.required&&!value){el?.classList.add('invalid');valid=false}else el?.classList.remove('invalid');
    data[f.id]=value;
  });
  const attachments={};
  form.querySelectorAll('[data-attachment]').forEach(el=>{const label=el.dataset.attachment;const name=el.files?.[0]?.name||state.draft.attachments?.[label]||'';attachments[label]=name;if(!name){el.classList.add('invalid');valid=false}else el.classList.remove('invalid')});
  if(!valid){showToast('أكمل الحقول والمرفقات المطلوبة قبل المتابعة','error');return false}
  state.draft={...data,attachments}; state.wizardStep=2; render(); return true;
}
function submitDraft(){
  const service=state.activeService; if(!service)return;
  if(state.editRequestId){
    const req=state.requests.find(r=>r.id===state.editRequestId); if(!req)return;
    req.formData={...state.draft}; req.status='pending'; req.returnReason='';
    req.timeline.push({at:nowIso(),actor:state.user.name,action:'استكمل الطلب وأعاده لمسار الاعتماد',type:'resubmitted'});
    saveRequests(); state.activeRequestId=req.id; state.panel='request-detail'; state.editRequestId=null; state.wizardStep=1; showToast('تمت إعادة إرسال الطلب','success'); render(); return;
  }
  const req={
    id:`REQ-${String(Date.now()).slice(-6)}`, ownerId:state.user.id, serviceId:service.id, service:service.name, createdAt:nowIso(),
    status:'pending', stepIndex:0, formData:{...state.draft}, returnReason:'',
    timeline:[{at:nowIso(),actor:state.user.name,action:'أنشأ الطلب وأرسله لمسار الاعتماد',type:'created'}]
  };
  state.requests.unshift(req); saveRequests(); state.activeRequestId=req.id; state.panel='request-detail'; state.wizardStep=1; state.draft={}; showToast('تم إنشاء الطلب وإرساله','success'); render();
}
function approveRequest(id){
  const req=state.requests.find(r=>r.id===id); if(!req||!canApprove(req))return;
  const step=currentWorkflowStep(req); req.timeline.push({at:nowIso(),actor:state.user.name,action:`اعتمد مرحلة ${step.label}`,type:'approved'}); req.stepIndex+=1;
  const next=currentWorkflowStep(req);
  if(!next||next.role==='system'){
    if(next)req.timeline.push({at:nowIso(),actor:'النظام',action:'أغلق الطلب كمكتمل',type:'completed'});
    req.status='completed';
  } else req.status='pending';
  saveRequests(); showToast('تم اعتماد الطلب','success'); render();
}
function employeeCompleteStep(id){
  const req=state.requests.find(r=>r.id===id); if(!req||req.ownerId!==state.user.id||req.status!=='pending')return;
  const step=currentWorkflowStep(req); if(step?.role!=='employee')return;
  req.timeline.push({at:nowIso(),actor:state.user.name,action:`أكمل مرحلة ${step.label}`,type:'completed'}); req.stepIndex+=1;
  const next=currentWorkflowStep(req); if(!next||next.role==='system'){req.status='completed';req.timeline.push({at:nowIso(),actor:'النظام',action:'أغلق الطلب كمكتمل',type:'completed'})}
  saveRequests(); showToast('تم تحديث الطلب','success'); render();
}
function decideRequest(id,type,reason){
  const req=state.requests.find(r=>r.id===id); if(!req||!canApprove(req))return;
  const step=currentWorkflowStep(req); const text=reason?.trim(); if(!text)return;
  if(type==='return'){
    req.status='returned'; req.returnReason=text; req.timeline.push({at:nowIso(),actor:state.user.name,action:`أعاد الطلب للاستكمال: ${text}`,type:'returned'});
  }else{
    req.status='rejected'; req.timeline.push({at:nowIso(),actor:state.user.name,action:`رفض الطلب: ${text}`,type:'rejected'});
  }
  saveRequests(); closeModal(); showToast(type==='return'?'تمت إعادة الطلب للموظف':'تم رفض الطلب','success'); render();
}

function loginView(){
  app.innerHTML=`<div class="login"><section class="login-visual"><div class="login-brand"><div class="mark">NDR</div><h1>مكان واحد للخدمات والمعرفة الداخلية</h1><p>منصة ذكية تفهم حاجة الموظف، تربطها بالإجراء والنموذج المناسب، وتبقي كل خدمة متاحة حتى عند تعطل الذكاء الاصطناعي.</p></div><div class="login-points"><div class="login-point"><strong>AI First</strong><span>ابدأ من حاجتك بدون معرفة اسم النموذج أو الجهة.</span></div><div class="login-point"><strong>Workflow Ready</strong><span>إنشاء الطلب ومراجعته واعتماده ومتابعته من مكان واحد.</span></div><div class="login-point"><strong>Controlled</strong><span>الإجابات والخدمات مرتبطة بالمصادر والصلاحيات المعتمدة.</span></div></div></section><section class="login-side"><div class="login-card"><div class="mark">NDR</div><h2>مرحبا بك</h2><p>نسخة بناء تجريبية ببيانات وهمية. اختر دورا لتجربة دورة الطلب كاملة.</p><div class="field"><label>المستخدم التجريبي</label><select id="userSelect">${employees.map(e=>`<option value="${e.id}">${e.name} — ${e.title}</option>`).join('')}</select></div><button class="primary full" id="loginBtn">دخول إلى Smart Hub</button><div class="demo-note">جرّب إنشاء طلب كموظف ثم سجل الخروج وادخل بحساب المدير لاعتماده. كل البيانات تحفظ محليا في متصفحك فقط في هذه النسخة.</div></div></section></div>`;
  document.querySelector('#loginBtn').onclick=()=>setUser(document.querySelector('#userSelect').value)
}

function navItem(id,label,icon,badge=''){return `<button data-panel="${id}" class="${state.panel===id?'active':''}"><span class="nav-icon">${icons[icon]}</span>${label}${badge?`<span class="nav-badge">${badge}</span>`:''}</button>`}
function sidebar(){
  const canSeeApprovals=['specialist','manager','admin'].includes(state.user.role); const admin=state.user.role==='admin'; const count=pendingApprovals().length;
  return `<aside class="sidebar"><div class="brand"><div class="mark">NDR</div><div><strong>Smart Hub</strong><span>Internal Knowledge & Services</span></div></div><div class="nav-label">مساحة العمل</div><div class="nav">${navItem('home','الرئيسية','home')}${navItem('assistant','NDR AI','spark')}${navItem('services','الخدمات','grid')}${navItem('requests','طلباتي','requests')}${navItem('knowledge','مركز المعرفة','book')}${canSeeApprovals?navItem('approvals','الموافقات','shield',count||''):''}${admin?navItem('admin','إدارة النظام','settings'):''}</div><div class="sidebar-spacer"></div><div class="user-mini"><div class="avatar">${h(state.user.name.slice(0,1))}</div><div><strong>${h(state.user.name)}</strong><small>${h(state.user.title)} · ${roleLabel(state.user.role)}</small></div></div></aside>`
}
function panelTitle(){return {assistant:'NDR AI',services:'الخدمات',requests:'طلباتي',knowledge:'مركز المعرفة',service:'تفاصيل الخدمة',approvals:'الموافقات',admin:'إدارة النظام','request-new':'إنشاء طلب','request-detail':'تفاصيل الطلب','portal-guide':'دليل التنفيذ'}[state.panel]||''}
function topbar(){return `<div class="topbar"><div><div class="eyebrow">${h(state.user.department)}</div><h1>${state.panel==='home'?`مرحبا ${h(state.user.name.split(' ')[0])}`:panelTitle()}</h1></div><div class="top-actions"><button class="icon-btn circle-btn" title="الإشعارات">${icons.bell}${pendingApprovals().length?`<span class="notification-dot"></span>`:''}</button><button class="icon-btn text-logout" id="logoutBtn">تسجيل الخروج</button></div></div>`}

function serviceRow(s){return `<div class="service"><div class="service-main"><div class="service-icon">${deptIcon(s.department)}</div><div><strong>${h(s.name)}</strong><small>${modeLabel(s.mode)} · ${h(s.code)}</small></div></div><div class="service-actions"><button class="outline open-service" data-service="${s.id}">تفاصيل</button><button class="secondary start-service" data-service="${s.id}">ابدأ</button></div></div>`}
function requestRow(r){const st=requestStatus(r);return `<div class="request clickable" data-request="${r.id}"><div><strong>${h(r.service)}</strong><div class="request-meta"><span>${h(r.id)}</span><span>•</span><span>${fmtDate(r.createdAt)}</span><span>•</span><span>${h(employeeName(r.ownerId))}</span></div><div class="progress"><span style="width:${requestProgress(r)}%"></span></div></div><span class="status ${st.className}">${h(st.label)}</span></div>`}

function homePanel(){
  const mine=userRequests(); const pending=mine.filter(r=>r.status==='pending').length; const done=mine.filter(r=>r.status==='completed').length;
  return `<section><div class="hero"><div class="ai-kicker"><div class="ai-orb">${icons.spark}</div><span>NDR AI · مدخل موحد لكل الخدمات</span></div><h2>ماذا تريد أن تنجز اليوم؟</h2><p>اكتب طلبك بطريقتك الطبيعية. النظام يحدد لك الخدمة والإجراء والنموذج وطريقة التقديم المناسبة بدون أن تحتاج لمعرفة الهيكل الإداري.</p><div class="ask-box"><textarea id="aiInput" placeholder="مثال: عندي دورة خارج جدة وأحتاج أعرف الإجراء"></textarea><button class="primary" id="askBtn">ابدأ</button></div><div class="quick-prompts">${['أريد بدل سكن','كيف أقدم إجازة مرضية؟','أريد دعم شهادة SHRM','عندي مهمة عمل خارج جدة'].map(x=>`<button class="chip prompt">${x}</button>`).join('')}</div></div><div class="dashboard-grid"><div class="card"><div class="card-head"><div><h3>معاملاتي</h3><div class="muted">نظرة سريعة على الطلبات ومسارات الاعتماد</div></div><button class="text-btn" data-panel="requests">عرض الكل</button></div><div class="stats"><div class="stat"><div class="stat-top"><strong>${mine.length}</strong><div class="stat-badge">${icons.requests}</div></div><span>إجمالي الطلبات</span></div><div class="stat"><div class="stat-top"><strong>${pending}</strong><div class="stat-badge">${icons.shield}</div></div><span>قيد المعالجة</span></div><div class="stat"><div class="stat-top"><strong>${done}</strong><div class="stat-badge">${icons.check}</div></div><span>مكتمل</span></div></div><div class="requests-card">${mine.slice(0,2).map(requestRow).join('')||'<div class="empty">لا توجد طلبات حتى الآن</div>'}</div></div><div class="card"><div class="card-head"><div><h3>خدمات سريعة</h3><div class="muted">الوضع اليدوي يعمل دائما</div></div><button class="text-btn" data-panel="services">كل الخدمات</button></div><div class="service-list">${services.filter(isServiceActive).slice(0,4).map(serviceRow).join('')}</div></div></div></section>`
}

function assistantPanel(){return `<section class="chat-layout"><div class="chat"><div class="chat-head"><div class="ai-orb">${icons.spark}</div><div><strong>NDR AI</strong><div class="online">● وضع تجريبي محلي يعمل بدون API</div></div></div><div class="messages">${state.messages.map(m=>`<div class="msg ${m.role==='user'?'user':'ai'}">${h(m.text)}${m.source?`<span class="source">المصدر: ${h(m.source)}</span>`:''}${m.service?`<div class="actions"><button class="secondary start-service" data-service="${m.service.id}">ابدأ الخدمة</button><button class="outline open-service" data-service="${m.service.id}">عرض التفاصيل</button></div>`:''}</div>`).join('')}</div><div class="chat-input"><input id="chatInput" placeholder="اكتب ما الذي تحتاجه..."/><button class="primary" id="chatSend">إرسال</button></div></div><div class="side-stack"><div class="card"><h3>كيف يعمل؟</h3><p class="muted">يفهم حاجتك، يحدد الخدمة، يعرض المصدر، ثم ينقلك للتنفيذ أو البورتال حسب إعداد الخدمة.</p><div class="route-mini"><div class="route-step active"><span class="route-dot"></span>فهم الطلب</div><div class="route-step"><span class="route-dot"></span>مطابقة الخدمة</div><div class="route-step"><span class="route-dot"></span>التحقق من المصدر</div><div class="route-step"><span class="route-dot"></span>التنفيذ والمتابعة</div></div></div><div class="notice">هذه النسخة لا تقدم معلومات تنظيمية نهائية. أي محتوى تجريبي سيتم استبداله بالنصوص والملفات المعتمدة.</div><div class="card"><h3>تعطل الذكاء؟</h3><p class="muted">لا تتوقف المنصة. افتح الخدمات يدويا وأكمل نفس العملية بدون AI.</p><button class="outline" data-panel="services">تصفح الخدمات</button></div></div></section>`}

function servicesPanel(){
  const visible=state.user.role==='admin'?services:services.filter(isServiceActive); const counts=Object.fromEntries(departments.map(d=>[d.id,visible.filter(s=>s.department===d.id).length]));
  return `<section><div class="section-title"><div><h2>الخدمات</h2><div class="eyebrow">ابدأ من القسم أو ابحث باسم الخدمة أو النموذج أو الإجراء</div></div><div class="search-wrap">${icons.search}<input class="search" id="serviceSearch" placeholder="ابحث عن خدمة أو نموذج أو إجراء"/></div></div><div class="department-grid">${departments.map(d=>`<article class="department"><div class="dept-icon">${icons[d.icon]}</div><strong>${h(d.name)}</strong><span>${h(d.description)}</span><small>${counts[d.id]?`${counts[d.id]} خدمات مضافة حاليا`:'بانتظار ملفات القسم'}</small></article>`).join('')}</div><div class="card services-block"><div class="card-head"><div><h3>الخدمات المضافة حاليا</h3><div class="muted">المحتوى الحالي تجريبي حتى استلام الملفات المعتمدة</div></div></div><div class="service-list" id="allServices">${visible.map(serviceRow).join('')}</div></div></section>`
}

function servicePanel(){
  const s=state.activeService;if(!s)return servicesPanel();
  return `<section class="service-detail"><div class="service-hero"><div class="tag-row"><span class="tag">${deptName(s.department)}</span><span class="tag">${modeLabel(s.mode)}</span><span class="tag demo">محتوى تجريبي</span></div><h2>${h(s.name)}</h2><p class="muted">${h(s.description)}</p><div class="actions"><button class="primary start-service" data-service="${s.id}">${s.mode==='PORTAL_ONLY'?'عرض خطوات التقديم':'ابدأ الإجراء'}</button><button class="outline">عرض المرجع</button>${s.mode.includes('PORTAL')?'<button class="outline portal-guide-btn">دليل البورتال</button>':''}</div></div><div class="detail-grid"><div class="card"><div class="card-head"><div><h3>رحلة الخدمة</h3><div class="muted">المسار الظاهر للموظف من البداية حتى الإغلاق</div></div></div><div class="steps">${s.steps.map((x,i)=>`<div class="step"><span class="step-num">${i+1}</span><span>${h(x)}</span></div>`).join('')}</div>${s.workflow?.length?`<div class="workflow-strip">${s.workflow.map((x,i)=>`<div class="workflow-node"><span>${i+1}</span><strong>${h(x.label)}</strong><small>${roleLabel(x.role)}</small></div>`).join('')}</div>`:''}</div><div class="side-stack"><div class="card"><h3>المرجع</h3><div class="list-clean"><div class="list-item"><span class="check">✓</span><span>الإجراء: ${h(s.procedure)}</span></div><div class="list-item"><span class="check">✓</span><span>النموذج: ${h(s.code)}</span></div><div class="list-item"><span class="check">!</span><span>${h(s.source)}</span></div></div></div><div class="card"><h3>المرفقات</h3><div class="list-clean">${s.attachments.length?s.attachments.map(x=>`<div class="list-item"><span class="check">+</span><span>${h(x)}</span></div>`).join(''):'<div class="muted">لا توجد مرفقات معرفة حاليا</div>'}</div></div></div></div></section>`
}

function fieldControl(field,value=''){
  const req=field.required?'required':''; const safe=h(value);
  if(field.type==='select')return `<select name="${field.id}" ${req}><option value="">اختر</option>${field.options.map(o=>`<option ${value===o?'selected':''}>${h(o)}</option>`).join('')}</select>`;
  if(field.type==='textarea')return `<textarea name="${field.id}" placeholder="${h(field.placeholder||'')}" ${req}>${safe}</textarea>`;
  return `<div class="input-with-suffix"><input name="${field.id}" type="${field.type}" value="${safe}" placeholder="${h(field.placeholder||'')}" ${req}/>${field.suffix?`<span>${h(field.suffix)}</span>`:''}</div>`;
}
function requestNewPanel(){
  const s=state.activeService;if(!s)return servicesPanel(); const editing=!!state.editRequestId;
  if(state.wizardStep===2)return requestReviewPanel();
  return `<section><div class="wizard-head"><button class="back-btn" data-back-service="${s.id}">${icons.arrow} رجوع</button><div><div class="eyebrow">${editing?'استكمال الطلب':'طلب جديد'} · ${h(s.code)}</div><h2>${h(s.name)}</h2></div><div class="wizard-steps"><span class="active">1 البيانات</span><span>2 المراجعة</span><span>3 الإرسال</span></div></div>${editing?`<div class="return-alert"><strong>سبب الإعادة:</strong> ${h(state.requests.find(r=>r.id===state.editRequestId)?.returnReason||'')}</div>`:''}<form id="requestForm" class="form-layout"><div class="card form-main"><div class="profile-prefill"><div class="prefill-title">بيانات من حساب الموظف</div><div class="prefill-grid"><div><span>الاسم</span><strong>${h(state.user.name)}</strong></div><div><span>الرقم الوظيفي</span><strong>${h(state.user.id)}</strong></div><div><span>القسم</span><strong>${h(state.user.department)}</strong></div><div><span>المدير المباشر</span><strong>${h(state.user.manager||'-')}</strong></div></div></div><div class="form-grid">${s.fields.map(f=>`<div class="field ${f.type==='textarea'?'wide':''}"><label>${h(f.label)}${f.required?'<em>*</em>':''}</label>${fieldControl(f,state.draft[f.id]||'')}</div>`).join('')}</div>${s.attachments.length?`<div class="attachments-block"><h3>المرفقات المطلوبة</h3>${s.attachments.map(a=>`<label class="upload-box">${icons.upload}<span><strong>${h(a)}</strong><small>${state.draft.attachments?.[a]?`الملف الحالي: ${h(state.draft.attachments[a])}`:'PDF أو صورة — في النسخة التجريبية يحفظ اسم الملف فقط'}</small></span><input type="file" data-attachment="${h(a)}" accept=".pdf,.png,.jpg,.jpeg"/></label>`).join('')}</div>`:''}<div class="form-actions"><button type="button" class="primary" id="reviewRequest">مراجعة الطلب</button></div></div><aside class="side-stack"><div class="card"><h3>قبل الإرسال</h3><div class="list-clean">${s.requirements.map(x=>`<div class="list-item"><span class="check">✓</span><span>${h(x)}</span></div>`).join('')}</div></div><div class="notice">لن يتم إرسال أي بيانات إلى جهة خارجية في هذه النسخة. التخزين تجريبي ومحلي داخل المتصفح.</div></aside></form></section>`
}
function requestReviewPanel(){
  const s=state.activeService; const editing=!!state.editRequestId;
  return `<section><div class="wizard-head"><button class="back-btn" id="backToForm">${icons.arrow} تعديل البيانات</button><div><div class="eyebrow">${editing?'استكمال الطلب':'طلب جديد'} · ${h(s.code)}</div><h2>راجع الطلب قبل الإرسال</h2></div><div class="wizard-steps"><span>1 البيانات</span><span class="active">2 المراجعة</span><span>3 الإرسال</span></div></div><div class="review-layout"><div class="card"><h3>بيانات الموظف</h3><div class="review-grid"><div><span>الاسم</span><strong>${h(state.user.name)}</strong></div><div><span>القسم</span><strong>${h(state.user.department)}</strong></div>${s.fields.map(f=>`<div><span>${h(f.label)}</span><strong>${h(state.draft[f.id]||'-')}${f.suffix&&state.draft[f.id]?` ${h(f.suffix)}`:''}</strong></div>`).join('')}</div>${s.attachments.length?`<h3 class="review-subtitle">المرفقات</h3><div class="list-clean">${s.attachments.map(a=>`<div class="list-item"><span class="check">✓</span><span>${h(a)}: ${h(state.draft.attachments?.[a]||'-')}</span></div>`).join('')}</div>`:''}<div class="form-actions"><button class="primary" id="submitRequest">${editing?'إعادة إرسال الطلب':'إرسال الطلب للاعتماد'}</button></div></div><aside class="card"><h3>مسار الاعتماد</h3><div class="approval-route">${s.workflow.map((x,i)=>`<div class="approval-route-item"><span>${i+1}</span><div><strong>${h(x.label)}</strong><small>${roleLabel(x.role)}</small></div></div>`).join('')}</div></aside></div></section>`
}

function requestsPanel(){
  const mine=userRequests(); return `<section><div class="section-title"><div><h2>طلباتي</h2><div class="eyebrow">كل معاملة مع مرحلتها الحالية ومسارها</div></div><button class="secondary" data-panel="services">إنشاء طلب جديد</button></div><div class="card">${mine.map(requestRow).join('')||'<div class="empty">لا توجد طلبات حتى الآن</div>'}</div></section>`
}
function requestDetailPanel(){
  const req=state.requests.find(r=>r.id===state.activeRequestId);if(!req)return requestsPanel(); const s=getService(req.serviceId); const st=requestStatus(req); const owner=req.ownerId===state.user.id; const step=currentWorkflowStep(req);
  return `<section><div class="request-detail-head"><button class="back-btn" data-panel="${canApprove(req)?'approvals':'requests'}">${icons.arrow} رجوع</button><div><div class="eyebrow">${h(req.id)} · ${fmtDate(req.createdAt)}</div><h2>${h(req.service)}</h2></div><span class="status ${st.className}">${h(st.label)}</span></div>${req.status==='returned'?`<div class="return-alert"><strong>الطلب يحتاج استكمال:</strong> ${h(req.returnReason||'')}</div>`:''}<div class="detail-grid"><div class="side-stack"><div class="card"><div class="card-head"><div><h3>بيانات الطلب</h3><div class="muted">مقدم الطلب: ${h(employeeName(req.ownerId))}</div></div></div><div class="review-grid">${s.fields.map(f=>`<div><span>${h(f.label)}</span><strong>${h(req.formData?.[f.id]||'-')}${f.suffix&&req.formData?.[f.id]?` ${h(f.suffix)}`:''}</strong></div>`).join('')}</div>${req.formData?.attachments?`<div class="attachment-summary">${Object.entries(req.formData.attachments).map(([k,v])=>`<div class="list-item"><span class="check">+</span><span>${h(k)}: ${h(v||'-')}</span></div>`).join('')}</div>`:''}</div><div class="card"><h3>سجل المعاملة</h3><div class="timeline">${[...req.timeline].reverse().map(t=>`<div class="timeline-item ${h(t.type)}"><span class="timeline-dot"></span><div><strong>${h(t.action)}</strong><small>${h(t.actor)} · ${fmtDate(t.at)}</small></div></div>`).join('')}</div></div></div><aside class="side-stack"><div class="card"><h3>مسار الطلب</h3><div class="workflow-vertical">${s.workflow.map((x,i)=>{const done=req.status==='completed'||i<req.stepIndex;const current=req.status!=='completed'&&i===req.stepIndex;return `<div class="workflow-v-item ${done?'done':''} ${current?'current':''}"><span>${done?'✓':i+1}</span><div><strong>${h(x.label)}</strong><small>${roleLabel(x.role)}${current?' · المرحلة الحالية':''}</small></div></div>`}).join('')}</div></div>${canApprove(req)?`<div class="card decision-card"><h3>إجراء الموافقة</h3><p class="muted">أنت المسؤول عن المرحلة الحالية: ${h(step?.label||'')}</p><button class="primary full approve-request" data-id="${req.id}">اعتماد</button><div class="decision-secondary"><button class="outline decision-btn" data-type="return" data-id="${req.id}">إعادة للاستكمال</button><button class="danger-btn decision-btn" data-type="reject" data-id="${req.id}">رفض</button></div></div>`:''}${owner&&req.status==='returned'?`<button class="primary full edit-returned" data-id="${req.id}">استكمال الطلب</button>`:''}${owner&&req.status==='pending'&&step?.role==='employee'?`<div class="card"><h3>الإجراء المطلوب منك</h3><p class="muted">أكمل التقديم في البورتال حسب الدليل ثم أكد هنا.</p><button class="primary full employee-complete" data-id="${req.id}">تم التقديم في البورتال</button></div>`:''}</aside></div></section>`
}

function approvalsPanel(){
  const pending=pendingApprovals(); return `<section><div class="section-title"><div><h2>الموافقات</h2><div class="eyebrow">طلبات وصلت لك حسب الدور والصلاحية الحالية</div></div><div class="approval-count">${pending.length} بانتظارك</div></div><div class="card"><div class="card-head"><div><h3>قائمة الانتظار</h3><div class="muted">افتح أي طلب لمراجعة بياناته وسجله قبل اتخاذ الإجراء</div></div></div>${pending.map(requestRow).join('')||'<div class="empty">لا توجد طلبات بانتظارك حاليا</div>'}</div></section>`
}
function knowledgePanel(){return `<section><div class="section-title"><div><h2>مركز المعرفة</h2><div class="eyebrow">سياسات وإجراءات وأدلة ونماذج — مع إدارة الإصدار والصلاحية</div></div><div class="search-wrap">${icons.search}<input class="search" id="knowledgeSearch" placeholder="ابحث في الوثائق"/></div></div><div class="knowledge-grid" id="knowledgeGrid">${knowledge.map(k=>knowledgeCard(k)).join('')}</div></section>`}
function knowledgeCard(k){return `<article class="knowledge-card"><div class="doc-icon">${icons.file}</div><strong>${h(k.title)}</strong><div class="knowledge-meta"><span class="tag">${h(k.type)}</span><span class="tag">${h(k.department)}</span><span class="tag demo">تجريبي</span></div><p class="muted">${h(k.version)}</p></article>`}
function portalGuidePanel(){
  const s=state.activeService||getService('sick-leave'); const guide=s.portalGuide||s.steps;
  return `<section><div class="wizard-head"><button class="back-btn" data-back-service="${s.id}">${icons.arrow} رجوع</button><div><div class="eyebrow">دليل البورتال</div><h2>${h(s.name)}</h2></div></div><div class="detail-grid"><div class="card"><h3>خطوات التنفيذ</h3><div class="steps">${guide.map((x,i)=>`<div class="step"><span class="step-num">${i+1}</span><span>${h(x)}</span></div>`).join('')}</div><div class="portal-placeholder"><strong>رابط البورتال سيضاف هنا</strong><span>لن نضع رابطا أو خطوات نهائية حتى استلام دليل البورتال المعتمد.</span></div></div><aside class="card"><h3>المصدر</h3><p class="muted">${h(s.source)}</p><div class="notice compact">عند رفع الدليل الحقيقي يمكن عرض الصفحة أو الصورة المناسبة لكل خطوة مباشرة داخل الخدمة.</div></aside></div></section>`
}
function adminPanel(){
  const allTimeline=state.requests.flatMap(r=>r.timeline.map(t=>({...t,requestId:r.id}))).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,8);
  return `<section><div class="section-title"><div><h2>إدارة النظام</h2><div class="eyebrow">طبقة إعداد وتشغيل تجريبية — بدون كود لكل خدمة</div></div><span class="tag demo">Local Demo</span></div><div class="admin-stats"><div class="stat"><strong>${departments.length}</strong><span>أقسام معرفة</span></div><div class="stat"><strong>${services.length}</strong><span>خدمات معرفة</span></div><div class="stat"><strong>${knowledge.length}</strong><span>وثائق معرفة</span></div><div class="stat"><strong>${state.requests.length}</strong><span>معاملات تجريبية</span></div></div><div class="admin-grid"><div class="card"><div class="card-head"><div><h3>تهيئة الخدمات</h3><div class="muted">تشغيل أو إخفاء الخدمة بدون حذفها</div></div></div><div class="admin-service-list">${services.map(s=>`<div class="admin-service"><div><strong>${h(s.name)}</strong><small>${h(deptName(s.department))} · ${modeLabel(s.mode)}</small></div><label class="switch"><input type="checkbox" class="service-toggle" data-id="${s.id}" ${isServiceActive(s)?'checked':''}/><span></span></label></div>`).join('')}</div></div><div class="card"><h3>جاهزية البنية</h3><div class="readiness-list"><div><span class="readiness-dot ready"></span><strong>واجهة المستخدم</strong><small>جاهزة للتجربة</small></div><div><span class="readiness-dot ready"></span><strong>Workflow تجريبي</strong><small>إنشاء واعتماد وإعادة ورفض</small></div><div><span class="readiness-dot wait"></span><strong>Firebase</strong><small>لم يتم الربط بعد</small></div><div><span class="readiness-dot wait"></span><strong>Gemini / AI Provider</strong><small>يعمل حاليا بمحرك محلي بديل</small></div><div><span class="readiness-dot wait"></span><strong>SSO المؤسسي</strong><small>مرحلة لاحقة بعد الاعتماد</small></div></div></div><div class="card span-admin"><h3>آخر نشاط في سجل المعاملات</h3><div class="timeline admin-timeline">${allTimeline.map(t=>`<div class="timeline-item ${h(t.type)}"><span class="timeline-dot"></span><div><strong>${h(t.action)}</strong><small>${h(t.requestId)} · ${h(t.actor)} · ${fmtDate(t.at)}</small></div></div>`).join('')}</div></div></div></section>`
}

function openDecisionModal(id,type){
  const label=type==='return'?'إعادة الطلب للاستكمال':'رفض الطلب';
  document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="decisionModal"><div class="modal"><div class="modal-head"><div><div class="eyebrow">${label}</div><h3>اكتب السبب</h3></div><button class="modal-close" id="modalClose">×</button></div><textarea id="decisionReason" placeholder="السبب مطلوب وسيظهر في سجل الطلب للموظف"></textarea><div class="modal-actions"><button class="outline" id="cancelDecision">إلغاء</button><button class="${type==='reject'?'danger-btn':'primary'}" id="confirmDecision">تأكيد</button></div></div></div>`);
  document.querySelector('#modalClose').onclick=closeModal; document.querySelector('#cancelDecision').onclick=closeModal;
  document.querySelector('#confirmDecision').onclick=()=>{const reason=document.querySelector('#decisionReason').value;if(!reason.trim()){document.querySelector('#decisionReason').classList.add('invalid');return}decideRequest(id,type,reason)};
}
function closeModal(){document.querySelector('#decisionModal')?.remove()}
function showToast(message,type='success'){
  document.querySelector('.toast')?.remove(); const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=message; document.body.appendChild(el); setTimeout(()=>el.remove(),2600);
}

function bindEvents(){
  document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>navigate(b.dataset.panel));
  document.querySelectorAll('.open-service').forEach(b=>b.onclick=()=>selectService(b.dataset.service));
  document.querySelectorAll('.start-service').forEach(b=>b.onclick=()=>startService(b.dataset.service));
  document.querySelectorAll('[data-request]').forEach(b=>b.onclick=()=>openRequest(b.dataset.request));
  document.querySelectorAll('[data-back-service]').forEach(b=>b.onclick=()=>selectService(b.dataset.backService));
  document.querySelector('#logoutBtn')?.addEventListener('click',logout);
  document.querySelector('#askBtn')?.addEventListener('click',()=>submitAI());
  document.querySelectorAll('.prompt').forEach(b=>b.onclick=()=>submitAI(b.textContent));
  document.querySelector('#chatSend')?.addEventListener('click',()=>submitAI(document.querySelector('#chatInput').value));
  document.querySelector('#chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitAI(e.target.value)}});
  document.querySelector('#reviewRequest')?.addEventListener('click',collectDraft);
  document.querySelector('#backToForm')?.addEventListener('click',()=>{state.wizardStep=1;render()});
  document.querySelector('#submitRequest')?.addEventListener('click',submitDraft);
  document.querySelectorAll('.approve-request').forEach(b=>b.onclick=()=>approveRequest(b.dataset.id));
  document.querySelectorAll('.decision-btn').forEach(b=>b.onclick=()=>openDecisionModal(b.dataset.id,b.dataset.type));
  document.querySelectorAll('.edit-returned').forEach(b=>b.onclick=()=>editReturnedRequest(b.dataset.id));
  document.querySelectorAll('.employee-complete').forEach(b=>b.onclick=()=>employeeCompleteStep(b.dataset.id));
  document.querySelectorAll('.service-toggle').forEach(b=>b.onchange=()=>setServiceActive(b.dataset.id,b.checked));
  document.querySelector('.portal-guide-btn')?.addEventListener('click',()=>{state.panel='portal-guide';render()});
  document.querySelector('#serviceSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();const base=state.user.role==='admin'?services:services.filter(isServiceActive);const found=base.filter(s=>(s.name+s.code+s.procedure+deptName(s.department)).toLowerCase().includes(q));document.querySelector('#allServices').innerHTML=found.length?found.map(serviceRow).join(''):'<div class="empty">لا توجد نتائج مطابقة</div>';document.querySelectorAll('.open-service').forEach(b=>b.onclick=()=>selectService(b.dataset.service));document.querySelectorAll('.start-service').forEach(b=>b.onclick=()=>startService(b.dataset.service))});
  document.querySelector('#knowledgeSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();const found=knowledge.filter(k=>(k.title+k.type+k.department).toLowerCase().includes(q));document.querySelector('#knowledgeGrid').innerHTML=found.length?found.map(knowledgeCard).join(''):'<div class="empty">لا توجد نتائج مطابقة</div>'});
}
function render(){
  if(!state.user)return loginView();
  const panels={home:homePanel,assistant:assistantPanel,services:servicesPanel,requests:requestsPanel,knowledge:knowledgePanel,service:servicePanel,approvals:approvalsPanel,admin:adminPanel,'request-new':requestNewPanel,'request-detail':requestDetailPanel,'portal-guide':portalGuidePanel};
  const fn=panels[state.panel]||homePanel; app.innerHTML=`<div class="shell">${sidebar()}<main class="main">${topbar()}${fn()}</main></div>`; bindEvents();
}

render();
