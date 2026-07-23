import { employees, departments, services, demoRequests } from './data.js';

const state = {
  user: JSON.parse(localStorage.getItem('ndr_user') || 'null'),
  panel: 'home',
  activeService: null,
  messages: [
    {role:'ai', text:'أهلا بك. اشرح لي ما الذي تريد إنجازه، وسأحدد لك القسم والإجراء والنموذج وطريقة التقديم المناسبة.'}
  ]
};

const app = document.querySelector('#app');

function setUser(id) {
  state.user = employees.find(e => e.id === id);
  localStorage.setItem('ndr_user', JSON.stringify(state.user));
  render();
}

function logout() {
  localStorage.removeItem('ndr_user');
  state.user = null;
  render();
}

function navigate(panel) {
  state.panel = panel;
  state.activeService = null;
  render();
}

function selectService(id) {
  state.activeService = services.find(s => s.id === id);
  state.panel = 'service';
  render();
}

function serviceModeLabel(mode) {
  return {
    PORTAL_ONLY:'بورتال', FORM_PORTAL:'نموذج + بورتال', FORM_WORKFLOW:'نموذج + اعتماد داخل النظام', INFO_ONLY:'معلومات فقط'
  }[mode] || mode;
}

function answerLocalAI(text) {
  const q = text.trim().toLowerCase();
  if (!q) return null;
  let match = null;
  if (q.includes('سكن')) match = services.find(s=>s.id==='housing');
  else if (q.includes('شهادة') || q.includes('دورة') || q.includes('دورات')) match = services.find(s=>s.id==='cert-support');
  else if (q.includes('رحلة') || q.includes('سفر') || q.includes('مهمة خارج')) match = services.find(s=>s.id==='business-trip');
  else if (q.includes('مرضي') || q.includes('مرضية') || q.includes('اجازة') || q.includes('إجازة')) match = services.find(s=>s.id==='sick-leave');

  if (!match) {
    return {
      text:'لم أجد خدمة مؤكدة من المحتوى المعتمد الحالي. استخدم تصفح الخدمات يدويا، أو بعد رفع إجراءات الأقسام سأتمكن من تحديد الجهة والخدمة بدقة بدون افتراض.',
      source:'محرك الطوارئ المحلي — لا توجد وثيقة معتمدة مرتبطة بهذا السؤال حاليا.'
    };
  }

  const portal = match.mode.includes('PORTAL')
    ? ' وبعد تجهيز المطلوب سأوجهك إلى خطوات التقديم في البورتال.'
    : ' ويمكن تنفيذ الخطوات ومتابعة الاعتماد من داخل النظام.';
  return {
    text:`الخدمة الأقرب لطلبك هي: ${match.name}. ${match.description}${portal}`,
    source:match.source,
    service:match
  };
}

function submitAI(value) {
  const text = value ?? document.querySelector('#aiInput')?.value;
  if (!text?.trim()) return;
  state.messages.push({role:'user', text:text.trim()});
  const result = answerLocalAI(text);
  state.messages.push({role:'ai', text:result.text, source:result.source, service:result.service});
  state.panel = 'assistant';
  render();
}

function loginView() {
  app.innerHTML = `
    <div class="login">
      <div class="login-card">
        <div class="logo">NDR</div>
        <h1>مركز الخدمات والمعرفة الذكي</h1>
        <p>نسخة البناء الأولى — دخول تجريبي ببيانات وهمية وآمنة.</p>
        <div class="field">
          <label>اختر مستخدم تجريبي</label>
          <select id="userSelect">
            ${employees.map(e=>`<option value="${e.id}">${e.name} — ${e.title}</option>`).join('')}
          </select>
        </div>
        <button class="primary" id="loginBtn">دخول</button>
        <div class="demo-note">في النسخة الفعلية سيكون لكل موظف حساب مستقل مرتبط بسجله وصلاحياته. لن يعتمد النظام على كتابة الاسم أو الرقم الوظيفي يدويا.</div>
      </div>
    </div>`;
  document.querySelector('#loginBtn').onclick = ()=>setUser(document.querySelector('#userSelect').value);
}

function sidebar() {
  const links = [
    ['home','الرئيسية'],['assistant','NDR AI'],['services','الخدمات'],['requests','طلباتي'],['knowledge','مركز المعرفة']
  ];
  return `
    <aside class="sidebar">
      <div class="brand"><div class="logo">NDR</div><div><strong>Smart Hub</strong><span>Knowledge & Services</span></div></div>
      <div class="nav">
        ${links.map(([id,label])=>`<button data-panel="${id}" class="${state.panel===id?'active':''}">${label}</button>`).join('')}
      </div>
      <div class="sidebar-footer"><div class="user-mini"><div class="avatar">${state.user.name.slice(0,1)}</div><div><strong>${state.user.name}</strong><small>${state.user.title}</small></div></div></div>
    </aside>`;
}

function topbar() {
  return `<div class="topbar"><div><div class="eyebrow">${state.user.department}</div><h1>${state.panel==='home'?'مرحبا '+state.user.name.split(' ')[0]:panelTitle()}</h1></div><div class="top-actions"><button class="icon-btn" id="logoutBtn">تسجيل الخروج</button></div></div>`;
}
function panelTitle(){ return {assistant:'NDR AI',services:'الخدمات',requests:'طلباتي',knowledge:'مركز المعرفة',service:'تفاصيل الخدمة'}[state.panel]||''; }

function homePanel() {
  return `<section class="panel active">
    <div class="hero">
      <div class="ai-title"><div class="ai-badge">NDR AI</div><span class="eyebrow">ابدأ من حاجتك وليس من اسم النموذج</span></div>
      <h2>ماذا تريد أن تنجز اليوم؟</h2>
      <p>اكتب طلبك بطريقتك. سأحدد لك الجهة والخدمة والإجراء والنموذج وطريقة التقديم.</p>
      <div class="ask-box"><textarea id="aiInput" placeholder="مثال: أريد التقديم على دعم شهادة مهنية"></textarea><button class="primary" id="askBtn">ابدأ</button></div>
      <div class="quick-prompts">
        ${['أريد بدل سكن','كيف أقدم إجازة مرضية؟','أريد دعم شهادة مهنية','عندي رحلة عمل'].map(x=>`<button class="chip prompt">${x}</button>`).join('')}
      </div>
    </div>
    <div class="grid">
      <div class="card span-8"><h3>متابعة معاملاتي</h3><div class="muted">حالة الطلبات ومسارات الاعتماد</div>
        <div class="stat-row"><div class="stat"><strong>3</strong><span>إجمالي الطلبات</span></div><div class="stat"><strong>1</strong><span>بانتظار اعتماد</span></div><div class="stat"><strong>1</strong><span>مكتمل</span></div></div>
      </div>
      <div class="card span-4"><h3>خدمات سريعة</h3><div class="muted">يمكنك التنفيذ يدويا بدون الذكاء</div><div class="service-list">${services.slice(0,3).map(serviceRow).join('')}</div></div>
      <div class="card span-12"><h3>آخر معاملاتي</h3>${demoRequests.map(requestRow).join('')}</div>
    </div>
  </section>`;
}

function assistantPanel() {
  return `<section class="panel active"><div class="chat-wrap">
    <div class="chat"><div class="messages">${state.messages.map(m=>`<div class="msg ${m.role==='user'?'user':'ai'}">${m.text}${m.source?`<span class="source">المصدر: ${m.source}</span>`:''}${m.service?`<div class="actions" style="margin-top:10px"><button class="secondary open-service" data-service="${m.service.id}">فتح الخدمة</button></div>`:''}</div>`).join('')}</div>
    <div class="chat-input"><input id="chatInput" placeholder="اكتب ما الذي تحتاجه..."><button class="primary" id="chatSend">إرسال</button></div></div>
    <div class="card"><h3>الوضع اليدوي متاح دائما</h3><p class="muted">إذا تعطل مزود الذكاء أو انتهى الحد المجاني، تظل الخدمات والنماذج والإجراءات والموافقات تعمل.</p><button class="outline" data-panel="services">تصفح الخدمات</button></div>
  </div></section>`;
}

function servicesPanel() {
  return `<section class="panel active"><div class="section-title"><div><h2>الخدمات</h2><div class="eyebrow">تصفح يدوي حسب الحاجة أو القسم</div></div><input class="search" id="serviceSearch" placeholder="ابحث عن خدمة أو نموذج أو إجراء"></div>
  <div class="department-grid">${departments.map(d=>`<div class="department"><strong>${d.name}</strong><span>${d.count ? d.count+' خدمات مضافة حاليا' : 'سيتم إضافة المحتوى بعد استلام ملفات القسم'}</span></div>`).join('')}</div>
  <div class="card" style="margin-top:18px"><h3>الخدمات المضافة حاليا</h3><div class="service-list" id="allServices">${services.map(serviceRow).join('')}</div></div></section>`;
}

function servicePanel() {
  const s=state.activeService;
  if(!s) return servicesPanel();
  return `<section class="panel active"><div class="service-detail">
    <div class="card"><div class="eyebrow">${departments.find(d=>d.id===s.department)?.name} · ${serviceModeLabel(s.mode)}</div><h2>${s.name}</h2><p class="muted">${s.description}</p><div class="actions"><button class="secondary">ابدأ الإجراء</button><button class="outline">عرض الإجراء</button>${s.mode.includes('PORTAL')?'<button class="outline">دليل البورتال</button>':''}</div></div>
    <div class="grid" style="margin-top:0"><div class="card span-8"><h3>رحلة الخدمة</h3><div class="steps">${s.steps.map(x=>`<div class="step">${x}</div>`).join('')}</div></div>
    <div class="card span-4"><h3>المرجع</h3><p class="muted">الإجراء: ${s.procedure}</p><p class="muted">النموذج: ${s.code}</p><p class="muted">${s.source}</p><h3 style="margin-top:20px">المرفقات</h3><p class="muted">${s.attachments.length?s.attachments.join(' · '):'لا توجد مرفقات معرفة حاليا'}</p></div></div>
  </div></section>`;
}

function requestsPanel(){ return `<section class="panel active"><div class="card"><h2>طلباتي</h2><div class="eyebrow">المعاملات التي أنشأتها وحالتها الحالية</div>${demoRequests.map(requestRow).join('')}</div></section>`; }
function knowledgePanel(){ return `<section class="panel active"><div class="section-title"><div><h2>مركز المعرفة</h2><div class="eyebrow">سياسات وإجراءات وأدلة ونماذج معتمدة ومحدثة</div></div><input class="search" placeholder="ابحث في الوثائق"></div><div class="grid"><div class="card span-4"><h3>الإجراءات</h3><p class="muted">تظهر النسخة الحالية فقط للموظف وتبقى الإصدارات السابقة للأرشفة الإدارية.</p></div><div class="card span-4"><h3>النماذج</h3><p class="muted">Word وPDF التفاعلي مع ربط كل نموذج بالخدمة والإجراء.</p></div><div class="card span-4"><h3>أدلة الأنظمة</h3><p class="muted">دليل البورتال وغيره، بحيث يكمل شرح الإجراء حتى آخر خطوة في التقديم.</p></div></div></section>`; }

function serviceRow(s){ return `<div class="service"><div class="service-main"><div class="service-icon">${s.department.toUpperCase()}</div><div><strong>${s.name}</strong><small>${serviceModeLabel(s.mode)}</small></div></div><button class="outline open-service" data-service="${s.id}">فتح</button></div>`; }
function requestRow(r){ return `<div class="request"><div><strong>${r.service}</strong><div class="eyebrow">${r.id} · ${r.date}</div></div><span class="status ${r.className}">${r.status}</span></div>`; }

function bindEvents() {
  document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>navigate(b.dataset.panel));
  document.querySelectorAll('.open-service').forEach(b=>b.onclick=()=>selectService(b.dataset.service));
  document.querySelector('#logoutBtn')?.addEventListener('click', logout);
  document.querySelector('#askBtn')?.addEventListener('click', ()=>submitAI());
  document.querySelectorAll('.prompt').forEach(b=>b.onclick=()=>submitAI(b.textContent));
  document.querySelector('#chatSend')?.addEventListener('click', ()=>submitAI(document.querySelector('#chatInput').value));
  document.querySelector('#chatInput')?.addEventListener('keydown', e=>{if(e.key==='Enter')submitAI(e.target.value)});
  document.querySelector('#serviceSearch')?.addEventListener('input', e=>{
    const q=e.target.value.toLowerCase();
    document.querySelector('#allServices').innerHTML=services.filter(s=>(s.name+s.code+s.procedure).toLowerCase().includes(q)).map(serviceRow).join('') || '<p class="muted">لا توجد نتائج</p>';
    document.querySelectorAll('.open-service').forEach(b=>b.onclick=()=>selectService(b.dataset.service));
  });
}

function render() {
  if (!state.user) return loginView();
  const panel = state.panel==='home'?homePanel():state.panel==='assistant'?assistantPanel():state.panel==='services'?servicesPanel():state.panel==='requests'?requestsPanel():state.panel==='knowledge'?knowledgePanel():servicePanel();
  app.innerHTML = `<div class="shell">${sidebar()}<main class="main">${topbar()}${panel}</main></div>`;
  bindEvents();
}

render();
