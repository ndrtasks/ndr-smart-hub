import { users, departments, defaultDelegations, services, knowledge, initialDemoRequests } from './data.js';

const KEYS = {
  user:'ndr_p3_user', requests:'ndr_p3_requests_v1', notifications:'ndr_p3_notifications_v1',
  delegations:'ndr_p3_delegations_v1', org:'ndr_p3_org_v1', templates:'ndr_p3_workflows_v1', lang:'ndr_p6_lang'
};

const clone = value => JSON.parse(JSON.stringify(value));
const app = document.querySelector('#app');

function isEn(){return state.language==='en'}
function tr(ar,en){return isEn()?en:ar}
function localized(obj,key='name',fallback=''){return isEn()?(obj?.[`${key}En`]||obj?.[key]||fallback):(obj?.[key]||obj?.[`${key}En`]||fallback)}
function userName(u){return localized(u,'name','-')}
function userTitle(u){return localized(u,'title','-')}
function serviceName(s){return localized(s,'name','-')}
function serviceDescription(s){return localized(s,'description','')}
function fieldLabel(f){return localized(f,'label',f?.id||'')}
function fieldPlaceholder(f){return isEn()?(f?.placeholderEn||f?.placeholder||''):(f?.placeholder||f?.placeholderEn||'')}
function stepLabel(step){return localized(step,'label','-')}
function optionLabel(f,value){
  const map=isEn()?f?.optionLabelsEn:f?.optionLabels;
  if(map?.[value])return map[value];
  if(isEn()&&/^\d+$/.test(String(value)))return `${value} months`;
  if(!isEn()&&/^\d+$/.test(String(value)))return `${value} أشهر`;
  return String(value);
}
function attachmentLabel(a){return isEn()?(a.labelEn||a.label):(a.label||a.labelEn)}
function langKey(userId){return userId?`ndr_p6_lang_${userId}`:KEYS.lang}
function applyLocale(){
  const lang=state.language||'ar';
  document.documentElement.lang=lang;document.documentElement.dir=lang==='en'?'ltr':'rtl';
}
function setLanguage(lang){
  if(!['ar','en'].includes(lang))return;
  saveUserMessages();state.language=lang;save(KEYS.lang,lang);if(state.user)save(langKey(state.user.id),lang);state.messages=loadUserMessages(state.user?.id);applyLocale();render();
}


const state = {
  user: (userById(load(KEYS.user,null)?.id) || load(KEYS.user,null)),
  panel: 'home',
  activeServiceId: null,
  activeRequestId: null,
  wizardStep: 1,
  draft: {},
  editRequestId: null,
  requests: load(KEYS.requests, clone(initialDemoRequests)),
  notifications: load(KEYS.notifications, []),
  delegations: load(KEYS.delegations, clone(defaultDelegations)),
  orgOverrides: load(KEYS.org, {}),
  workflowOverrides: load(KEYS.templates, {}),
  language: load(KEYS.lang, 'ar'),
  messages: [],
  aiRoutingMode: 'fallback'
};

function defaultMessages(){
  return [{role:'ai', text:tr('أهلا بك. اشرح ما تريد إنجازه بطريقتك وسأفهم النية والسياق ثم أوجهك للخدمة المناسبة.','Welcome. Describe what you need in your own words. I will understand the intent and context, then route you to the right service.')}];
}
function chatKey(userId){return userId?`ndr_p6_chat_${userId}_${state.language}`:null}
function loadUserMessages(userId){const key=chatKey(userId);return key?load(key,defaultMessages()):defaultMessages()}
function saveUserMessages(){const key=chatKey(state.user?.id);if(key)save(key,state.messages)}
state.messages=loadUserMessages(state.user?.id);

function load(key, fallback){
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; } catch { return fallback; }
}
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function persist(){
  save(KEYS.requests,state.requests); save(KEYS.notifications,state.notifications); save(KEYS.delegations,state.delegations);
  save(KEYS.org,state.orgOverrides); save(KEYS.templates,state.workflowOverrides);
}
function h(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function uid(prefix='ID'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`}
function now(){return new Date().toISOString()}
function today(){return new Date().toISOString().slice(0,10)}
function fmt(iso){try{return new Intl.DateTimeFormat(isEn()?'en-GB':'ar-SA-u-ca-gregory',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch{return iso}}
function userById(id){return users.find(u=>u.id===id)}
function serviceById(id){return services.find(s=>s.id===id)}
function deptById(id){return departments.find(d=>d.id===id)}
function deptName(id){const d=deptById(id);return d?localized(d,'name',id):id}
function roleName(role){const ar={employee:'موظف',specialist:'مختص',manager:'مدير قسم',executive:'مدير عام',system_admin:'مدير النظام'};const en={employee:'Employee',specialist:'Specialist',manager:'Department Manager',executive:'General Manager',system_admin:'System Administrator'};return (isEn()?en:ar)[role]||role}
function hasPermission(p){return !!state.user?.permissions?.includes(p)}
function managerIdForDepartment(deptId){return state.orgOverrides[deptId]?.managerId || deptById(deptId)?.managerId || null}
function membersOfDepartment(deptId){return users.filter(u=>u.departmentId===deptId && u.role!=='system_admin')}
function serviceTemplate(serviceId){return clone(state.workflowOverrides[serviceId] || serviceById(serviceId)?.workflowTemplate || [])}

function activeDelegationFor(principalId, serviceId){
  const d = today();
  return state.delegations.find(x=>x.active!==false && x.principalId===principalId && x.startDate<=d && x.endDate>=d && (x.scope==='ALL'||x.scope===serviceId));
}
function effectiveAssignment(principalId, serviceId){
  const delegation=activeDelegationFor(principalId,serviceId);
  return {userId:delegation?.delegateId||principalId,principalId,delegationId:delegation?.id||null};
}
function effectiveUserId(principalId, serviceId){return effectiveAssignment(principalId,serviceId).userId}
function resolverText(resolver){
  if(!resolver)return tr('غير محدد','Not defined');
  if(resolver.type==='DIRECT_MANAGER')return tr('المدير المباشر','Direct Manager');
  if(resolver.type==='GENERAL_MANAGER')return tr('المدير العام','General Manager');
  if(resolver.type==='NAMED_USER')return userName(userById(resolver.userId))||tr('مستخدم محدد','Named User');
  if(resolver.type==='DEPARTMENT_MANAGER_FIXED')return `${tr('مدير','Manager -')} ${deptName(resolver.departmentId)}`;
  if(resolver.type==='ROLE_IN_DEPARTMENT')return `${roleName(resolver.role)} - ${deptName(resolver.departmentId)}`;
  if(resolver.type==='HR_RESPONSIBLE')return tr('المختص المسؤول في الموارد البشرية','Assigned HR Reviewer');
  if(resolver.type==='MANUAL')return tr('مسار يدوي','Manual Route');
  return resolver.type;
}
function resolveStep(step, owner, serviceId, context={}){
  const r=step.resolver||{}; let assignments=[];
  const addPrincipal=id=>{if(id)assignments.push(effectiveAssignment(id,serviceId))};
  if(r.type==='DIRECT_MANAGER' && owner.managerId) addPrincipal(owner.managerId);
  if(r.type==='GENERAL_MANAGER') addPrincipal('GM01');
  if(r.type==='DEPARTMENT_MANAGER_FIXED') addPrincipal(managerIdForDepartment(r.departmentId));
  if(r.type==='NAMED_USER'){
    let id=r.userId;
    if(r.excludeOwner && id===owner.id){
      id=r.fallbackUserId || users.find(u=>u.departmentId===r.departmentId && u.role===r.fallbackRole && u.id!==owner.id)?.id || managerIdForDepartment(r.departmentId);
    }
    addPrincipal(id);
  }
  if(r.type==='HR_RESPONSIBLE'){
    const previous=new Set(context.previousAssigneeIds||[]);
    const candidates=[r.preferredUserId||'E001','HRM01','E002']
      .filter(Boolean)
      .filter((id,index,arr)=>arr.indexOf(id)===index)
      .filter(id=>id!==owner.id && !previous.has(id));
    const selected=candidates.find(id=>userById(id)) || [r.preferredUserId||'E001','HRM01','E002'].find(id=>id!==owner.id&&userById(id));
    addPrincipal(selected);
  }
  if(r.type==='ROLE_IN_DEPARTMENT'){
    users.filter(u=>u.departmentId===r.departmentId && u.role===r.role && (!r.excludeOwner||u.id!==owner.id)).forEach(u=>addPrincipal(u.id));
  }
  const seen=new Set(); assignments=assignments.filter(a=>a.userId&&!seen.has(a.userId)&&(seen.add(a.userId),true));
  return assignments;
}
function instantiateRoute(service, owner){
  const route=[];
  serviceTemplate(service.id).forEach((s,i)=>{
    const previousAssigneeIds=route.at(-1)?.assigneeIds||[];
    const assignments=resolveStep(s,owner,service.id,{previousAssigneeIds});
    route.push({
      id:s.id||`step-${i+1}`, label:s.label||tr(`المرحلة ${i+1}`,`Stage ${i+1}`), resolverSnapshot:clone(s.resolver||{}), stageFields:clone(s.stageFields||[]),
      mode:s.mode||'SEQUENTIAL', assignments, assigneeIds:assignments.map(a=>a.userId), state:'waiting', approvals:[]
    });
  });
  return route;
}

function createNotification(userId, requestId, type, title, body, stepId=null){
  const n={id:uid('N'),userId,requestId,type,title,body,stepId,createdAt:now(),read:false,resolved:false};
  state.notifications.unshift(n); save(KEYS.notifications,state.notifications); return n;
}
function userNotifications(){return state.notifications.filter(n=>n.userId===state.user?.id)}
function unreadCount(){return userNotifications().filter(n=>!n.read&&!n.resolved).length}
function resolveNotifications(requestId, userId=null, stepId=null){
  state.notifications.forEach(n=>{
    if(n.requestId===requestId && (!userId||n.userId===userId) && (!stepId||n.stepId===stepId) && n.type==='ACTION_REQUIRED'){
      n.resolved=true; n.read=true;
    }
  });
  save(KEYS.notifications,state.notifications);
}
function notifyActive(req, context='new'){
  const step=req.route[req.activeStepIndex]; if(!step)return;
  const approved=new Set(step.approvals.filter(a=>a.valid).map(a=>a.userId));
  step.assigneeIds.filter(id=>!approved.has(id)).forEach(id=>createNotification(
    id,req.id,'ACTION_REQUIRED',
    context==='reapproval'?tr('طلب أعيد لمسارك ويحتاج إعادة اعتماد','A request returned to your route and needs re-approval'):tr(`طلب يحتاج ${stepLabel(step)}`,`Request requires ${stepLabel(step)}`),
    `${req.serviceName} - ${req.id}`,step.id
  ));
}
function addTimeline(req, actorId, action, type='info', meta={}){
  req.timeline.push({id:uid('T'),at:now(),actorId,actorName:userById(actorId)?.name||actorId||'النظام',action,type,meta});
}
function requesterSignature(req, action='إرسال الطلب'){
  const u=state.user; return {id:uid('SIG'),userId:u.id,name:u.name,title:u.title,action,at:now(),requestId:req.id,valid:true};
}
function approvalSignature(req, action, note=''){
  const u=state.user; return {id:uid('SIG'),userId:u.id,name:u.name,title:u.title,action,note,at:now(),requestId:req.id,valid:true};
}

function activateStep(req,index,context='new'){
  if(index>=req.route.length){
    req.status='completed'; req.activeStepIndex=req.route.length; req.completedAt=now(); req.returnContext=null;
    addTimeline(req,'SYSTEM',tr('أغلق النظام الطلب كمكتمل','System closed the request as completed'),'completed');
    createNotification(req.ownerId,req.id,'COMPLETED',tr('تم اعتماد طلبك نهائيا','Your request has been fully approved'),`${req.serviceName} - ${req.id}`);
    return;
  }
  req.activeStepIndex=index; req.status='pending'; req.returnContext=null;
  req.route.forEach((s,i)=>{ if(i===index)s.state='active'; else if(i>index && s.state!=='approved')s.state='waiting'; });
  notifyActive(req,context);
}
function validApprovals(step){return step.approvals.filter(a=>a.valid)}
function stepComplete(step){
  const approved=new Set(validApprovals(step).map(a=>a.userId));
  if(step.mode==='ALL')return step.assigneeIds.length>0 && step.assigneeIds.every(id=>approved.has(id));
  return approved.size>0;
}
function canAct(req){
  if(!state.user)return false;
  if(req.status==='returned' && req.returnContext?.type==='step') return req.returnContext.userId===state.user.id;
  if(req.status!=='pending')return false;
  const step=req.route[req.activeStepIndex]; if(!step)return false;
  return step.assigneeIds.includes(state.user.id) && !validApprovals(step).some(a=>a.userId===state.user.id);
}
function pendingForUser(){return state.requests.filter(canAct)}
function canViewRequest(req){
  if(!state.user)return false;
  if(req.ownerId===state.user.id)return true;
  if(hasPermission('view_all'))return true;
  if(req.route.some(s=>s.assigneeIds.includes(state.user.id)))return true;
  if(hasPermission('view_department'))return userById(req.ownerId)?.departmentId===state.user.departmentId;
  return false;
}
function isHRWorkflowController(){
  return state.user?.departmentId==='hr' && ['employee','specialist','manager'].includes(state.user?.role);
}
function canOverrideRoute(req){
  if(!state.user)return false;
  if(hasPermission('workflow_override_all'))return true;
  if(isHRWorkflowController() && serviceById(req.serviceId)?.departmentId==='hr')return true;
  return false;
}

function currentStep(req){return req.route[req.activeStepIndex]||null}
function assigneeDisplay(step){
  if(!step)return '-';
  const assignments=step.assignments||step.assigneeIds.map(id=>({userId:id,principalId:id,delegationId:null}));
  return assignments.map(a=>{
    const actual=userName(userById(a.userId))||a.userId;
    if(a.delegationId&&a.principalId!==a.userId)return `${actual} (${tr('نيابة عن','on behalf of')} ${userName(userById(a.principalId))||a.principalId})`;
    return actual;
  }).join('، ');
}
function requestStatus(req){
  if(req.status==='completed')return {label:tr('مكتمل','Completed'),cls:'done'};
  if(req.status==='rejected')return {label:tr('مرفوض','Rejected'),cls:'rejected'};
  if(req.status==='returned')return {label:tr('معاد للاستكمال','Returned for Completion'),cls:'returned'};
  const s=currentStep(req); return {label:s?`${tr('بانتظار','Pending')} ${stepLabel(s)}`:tr('قيد المعالجة','In Progress'),cls:'pending'};
}
function requestProgress(req){
  if(req.status==='completed')return 100;
  const validDone=req.route.filter(s=>s.state==='approved').length;
  return Math.max(8,Math.round((validDone/Math.max(req.route.length,1))*100));
}
function holderNames(req){
  if(req.status==='returned')return req.returnContext?.type==='owner'?userName(userById(req.ownerId)):(userName(userById(req.returnContext?.userId))||tr('غير محدد','Not assigned'));
  const s=currentStep(req); return assigneeDisplay(s);
}
function setUser(id){
  state.user=userById(id); save(KEYS.user,state.user);state.language=load(langKey(id),load(KEYS.lang,state.language||'ar'));save(KEYS.lang,state.language);state.messages=loadUserMessages(id);state.panel='home';state.activeRequestId=null;state.activeServiceId=null;state.draft={};applyLocale();render();
}
function logout(){saveUserMessages();localStorage.removeItem(KEYS.user);state.user=null;state.messages=defaultMessages();state.activeServiceId=null;state.activeRequestId=null;state.draft={};applyLocale();render()}
function navigate(panel){state.panel=panel;state.activeServiceId=null;state.activeRequestId=null;state.editRequestId=null;render()}
function openService(id){state.activeServiceId=id;state.panel='service';render()}
function openRequest(id){const r=state.requests.find(x=>x.id===id);if(r&&canViewRequest(r)){state.activeRequestId=id;state.panel='request';render()}}
function startService(id,prefill={}){state.activeServiceId=id;state.draft=clone(prefill||{});state.editRequestId=null;state.wizardStep=1;state.panel='new-request';render()}

function normalizeArabic(value=''){
  return String(value).toLowerCase()
    .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^a-z0-9؀-ۿ\s-]/g,' ')
    .replace(/\s+/g,' ').trim();
}
function serviceSearchText(service){
  return normalizeArabic([
    service.name,service.nameEn,service.code,service.procedure,service.description,service.descriptionEn,
    ...(service.aliases||[]),...(service.aliasesEn||[]),service.form?.templateName,service.form?.templateNameEn,service.form?.sourceFormat
  ].filter(Boolean).join(' '));
}
function intentResult(serviceId,text,prefill={},note='',confidence=0.8){
  const service=serviceById(serviceId);if(!service)return null;
  return {service,prefill,confidence,text:note||tr(`الخدمة الأقرب هي: ${serviceName(service)} (${service.code}). سأطلب فقط البيانات اللازمة ثم يذهب الطلب لمساره المعتمد.`,`Best match: ${serviceName(service)} (${service.code}). I will ask only for the required data, then the request follows its approved workflow.`)};
}
function includesAny(q,patterns){return patterns.some(p=>q.includes(normalizeArabic(p)))}
function localAI(text){
  const q=normalizeArabic(text); if(!q)return {text:tr('اكتب طلبك أو اسم النموذج.','Describe your request or enter the form name.')};
  const raw=String(text).toLowerCase();
  const future=includesAny(q,['بستأذن','بستاذن','استأذن','استاذن','ابي اطلع','ابغى اطلع','احتاج اطلع','بطلع','بخرج','بمشي','امشي','ابغى امشي','بروح','اطلع شوي','موعد','بكره','غدا','بعد شوي']) || /\b(need to leave|want to leave|going to leave|step out|leave early today|tomorrow|appointment|permission)\b/i.test(raw);
  const past=includesAny(q,['امس','أمس','تأخرت','تاخرت','طلعت بدري','خرجت بدري','نسيت البصمه','نسيت البصمة','ما بصمت','لم ابصم','غبت','كنت غايب','صار','حصل']) || /\b(yesterday|was late|left early|forgot to clock|missed punch|did not clock|didn't clock|was absent)\b/i.test(raw);
  const permissionLanguage=includesAny(q,['استاذن','استأذن','بستأذن','بستاذن','بطلع','بخرج','بمشي','امشي','ابغى امشي','ابي اطلع','ابغى اطلع','احتاج اطلع','موعد','اذن','استئذان']) || /\b(permission|step out|need to leave|want to leave|leave early)\b/i.test(raw);
  const attendanceLanguage=includesAny(q,['تأخرت','تاخرت','نسيت','بصمه','بصمة','ما بصمت','لم ابصم','طلعت بدري','خرجت بدري','غبت','غايب','مذكره حضور','مذكرة حضور','تعديل الحضور','تصحيح الحضور']) || /\b(attendance|missed punch|forgot to clock|was late|left early|absent)\b/i.test(raw);
  if(permissionLanguage&&future&&!past)return intentResult('short-permission',text,{},tr('فهمت أنك تخطط للخروج أو الاستئذان قبل حدوثه، لذلك الخدمة المناسبة هي الإذن القصير.','You are planning to leave or step out before it happens, so Short Permission is the appropriate service.'),0.94);
  if(attendanceLanguage||past){
    const prefill={};
    if(includesAny(q,['تأخرت','تاخرت','تأخير'])||/was late/i.test(raw))prefill.caseType='متأخر';
    else if(includesAny(q,['نسيت البصمه','نسيت البصمة','ما بصمت','لم ابصم'])||/forgot to clock|missed punch/i.test(raw)){prefill.caseType='لم يبصم';if(includesAny(q,['خروج','طلوع'])||/clock out/i.test(raw))prefill.missedPunchType='بصمة الخروج';else if(includesAny(q,['دخول'])||/clock in/i.test(raw))prefill.missedPunchType='بصمة الدخول';}
    else if(includesAny(q,['طلعت بدري','خرجت بدري','خروج مبكر'])||/left early/i.test(raw))prefill.caseType='خروج مبكر';
    else if(includesAny(q,['غبت','غايب','غائب','كنت غايب'])||/absent/i.test(raw))prefill.caseType='غائب';
    return intentResult('attendance-memo',text,prefill,tr('هذه حالة حضور حدثت فعليا، لذلك سأوجهك إلى مذكرة الحضور HR-F-25 وأعرض فقط الحقول المرتبطة بالحالة.','This is an attendance event that already happened, so I will route you to HR-F-25 Attendance Memo and show only the fields relevant to the case.'),0.95);
  }
  const words=q.split(' ').filter(w=>w.length>1);const ranked=services.filter(s=>s.active).map(service=>{const hay=serviceSearchText(service);let score=0;(service.aliases||[]).concat(service.aliasesEn||[]).forEach(alias=>{const a=normalizeArabic(alias);if(a&&q.includes(a))score+=12});if(q.includes(normalizeArabic(service.name))||q.includes(normalizeArabic(service.nameEn||'')))score+=15;if(q.includes(normalizeArabic(service.code)))score+=20;words.forEach(w=>{if(hay.includes(w))score+=1});return {service,score}}).sort((a,b)=>b.score-a.score);
  const best=ranked[0];if(!best||best.score<2)return {text:tr('لم أجد تطابقا موثوقا. صف ما تريد فعله أو ما حدث وسأحاول تحديد الخدمة، وإذا بقي المعنى محتملا سأطلب توضيحا واحدا.','I could not find a reliable match. Describe what you want to do or what happened; if the intent remains ambiguous, I will ask one clarification question.')};
  return intentResult(best.service.id,text,{},'',Math.min(0.92,0.55+best.score/50));
}
async function submitAI(value){
  const text=value??document.querySelector('#aiInput')?.value;if(!text?.trim())return;
  state.messages.push({role:'user',text:text.trim()});saveUserMessages();state.panel='assistant';render();
  let result=null;
  try{
    const payload={text:text.trim(),language:state.language,messages:state.messages.slice(-8).map(m=>({role:m.role,text:m.text})),services:services.filter(s=>s.active).map(s=>({id:s.id,name:s.name,nameEn:s.nameEn,code:s.code,description:s.description,descriptionEn:s.descriptionEn,aliases:s.aliases,aliasesEn:s.aliasesEn}))};
    const res=await fetch('/api/ai-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(res.ok){const ai=await res.json();if(ai?.clarificationQuestion){state.messages.push({role:'ai',text:ai.clarificationQuestion});state.aiRoutingMode='ai';saveUserMessages();render();return}if(ai?.serviceId&&serviceById(ai.serviceId)){result=intentResult(ai.serviceId,text,ai.prefill||{},ai.reply||'',Number(ai.confidence||0.8));state.aiRoutingMode='ai'}}
  }catch{}
  if(!result){result=localAI(text);state.aiRoutingMode='fallback'}
  state.messages.push({role:'ai',text:result.text,service:result.service,prefill:result.prefill||{},confidence:result.confidence});saveUserMessages();render();
}
function conditionMatches(condition,data={}){
  if(!condition)return true;
  const value=data?.[condition.field]??'';
  if(Object.prototype.hasOwnProperty.call(condition,'equals'))return value===condition.equals;
  if(Array.isArray(condition.in))return condition.in.includes(value);
  if(Object.prototype.hasOwnProperty.call(condition,'notEquals'))return value!==condition.notEquals;
  return true;
}
function fieldVisible(f,data={}){
  if(f.showWhen&&!conditionMatches(f.showWhen,data))return false;
  if(Array.isArray(f.showWhenAny)&&f.showWhenAny.length&&!f.showWhenAny.some(c=>conditionMatches(c,data)))return false;
  return true;
}
function fieldRequired(f,data={}){
  if(f.required)return true;
  if(f.requiredWhen&&conditionMatches(f.requiredWhen,data))return true;
  if(Array.isArray(f.requiredWhenAny)&&f.requiredWhenAny.some(c=>conditionMatches(c,data)))return true;
  return false;
}
function attachmentMeta(item){return typeof item==='string'?{id:item,label:item,required:true,accept:'.pdf,.png,.jpg,.jpeg'}:item}
function attachmentVisible(item,data={}){const a=attachmentMeta(item);return !a.showWhen||conditionMatches(a.showWhen,data)}
function attachmentRequired(item,data={}){const a=attachmentMeta(item);return !!a.required||!!(a.requiredWhen&&conditionMatches(a.requiredWhen,data))}
function visibleFields(service,data={}){return (service.fields||[]).filter(f=>fieldVisible(f,data))}
function visibleAttachments(service,data={}){return (service.attachments||[]).map(attachmentMeta).filter(a=>attachmentVisible(a,data))}
function completeServiceMonths(startDate,endDate=today()){
  if(!startDate)return null;const s=new Date(`${startDate}T00:00:00`),e=new Date(`${endDate}T00:00:00`);if(Number.isNaN(s.getTime())||Number.isNaN(e.getTime())||e<s)return null;let months=(e.getFullYear()-s.getFullYear())*12+(e.getMonth()-s.getMonth());if(e.getDate()<s.getDate())months--;return Math.max(0,months);
}
function housingEligibility(user=state.user,asOf=today()){
  const service=serviceById('housing');const months=completeServiceMonths(user?.joiningDate,asOf);const rules=service?.rules;if(months===null||!rules)return {eligible:false,serviceMonths:months,options:[],reason:'MISSING_DATE'};const tier=rules.tiers.find(t=>months>=t.min&&(t.max===null||months<=t.max));return {eligible:!!tier,serviceMonths:months,options:tier?.months||[],reason:tier?'ELIGIBLE':'BELOW_MINIMUM'};
}
function serviceDurationText(months){if(months===null)return tr('غير متوفر','Not available');const y=Math.floor(months/12),m=months%12;return isEn()?`${y} year${y===1?'':'s'}${m?` and ${m} month${m===1?'':'s'}`:''}`:`${y} سنة${m?` و ${m} شهر`:''}`}
function housingEligibilityText(user=state.user){const e=housingEligibility(user);if(e.reason==='MISSING_DATE')return tr('لا يوجد تاريخ تعيين في ملف الموظف. يجب تحديث الملف قبل احتساب الاستحقاق.','Joining date is missing from the employee profile. Update the profile before calculating eligibility.');if(!e.eligible)return tr(`مدة خدمتك المحتسبة ${serviceDurationText(e.serviceMonths)}. يبدأ الاستحقاق في هذا النموذج من 3 سنوات ونصف، لذلك لا توجد مدة متاحة حاليا.`,`Your calculated service is ${serviceDurationText(e.serviceMonths)}. Eligibility for this form starts at 3.5 years, so no advance period is currently available.`);const opts=e.options.map(x=>isEn()?`${x} months`:`${x} أشهر`).join(tr(' أو ',' or '));return tr(`مدة خدمتك المحتسبة ${serviceDurationText(e.serviceMonths)}. الخيارات المتاحة حسب شريحة الاستحقاق الحالية: ${opts}.`,`Your calculated service is ${serviceDurationText(e.serviceMonths)}. Available options under your current eligibility tier: ${opts}.`)}
function dynamicOptions(f,service,owner=state.user){if(f.dynamicOptions==='HOUSING_ELIGIBILITY')return housingEligibility(owner).options.map(String);return f.options||[]}
function calculatedHousingTotal(data={},owner=state.user){const months=Number(data.requestedMonths||0),allowance=Number(owner?.housingAllowance||0);return months>0&&allowance>0?months*allowance:0}

function fieldControl(f,value='',data={},service=serviceById(state.activeServiceId),owner=state.user){
  const v=h(value),req=fieldRequired(f,data)?'required':'';
  if(f.type==='select'){const opts=dynamicOptions(f,service,owner);return `<select name="${f.id}" ${req}><option value="">${tr('اختر','Select')}</option>${opts.map(o=>`<option value="${h(o)}" ${String(o)===String(value)?'selected':''}>${h(optionLabel(f,String(o)))}</option>`).join('')}</select>`;}
  if(f.type==='textarea')return `<textarea name="${f.id}" ${req} placeholder="${h(fieldPlaceholder(f))}">${v}</textarea>`;
  return `<div class="input-wrap"><input type="${f.type}" name="${f.id}" value="${v}" ${req} placeholder="${h(fieldPlaceholder(f))}"/>${(isEn()?f.suffixEn:f.suffix)?`<span>${h(isEn()?f.suffixEn:f.suffix)}</span>`:''}</div>`;
}
function syncDraftFromForm(){
  const service=serviceById(state.activeServiceId);const form=document.querySelector('#requestForm');if(!service||!form)return;
  const next={...state.draft};
  (service.fields||[]).forEach(f=>{const el=form.elements[f.id];if(el)next[f.id]=el.value??''});
  state.draft=next;
}
function collectDraft(){
  const service=serviceById(state.activeServiceId); const form=document.querySelector('#requestForm'); if(!service||!form)return;
  const data={...state.draft}; let ok=true;if(service.id==='housing'&&!housingEligibility(state.user).eligible){toast(tr('لا يمكن إرسال الطلب قبل تحقق شرط مدة الخدمة.','The request cannot be submitted until the service-duration eligibility is met.'),'error');return}
  (service.fields||[]).forEach(f=>{
    const visible=fieldVisible(f,data);const el=form.elements[f.id];
    if(!visible){data[f.id]='';return}
    const v=el?.value?.trim?.()??'';data[f.id]=v;
    if(fieldRequired(f,{...data,[f.id]:v})&&!v){el?.classList.add('invalid');ok=false}else el?.classList.remove('invalid');
  });
  const attachments={...(state.draft.attachments||{})};
  visibleAttachments(service,data).forEach(a=>{
    const el=form.querySelector(`[data-attachment-id="${CSS.escape(a.id)}"]`);
    const existing=attachments[a.id]||'';const name=el?.files?.[0]?.name||existing;
    attachments[a.id]=name;
    if(attachmentRequired(a,data)&&!name){el?.classList.add('invalid');ok=false}else el?.classList.remove('invalid');
  });
  if(!ok){toast(tr('أكمل فقط البيانات المطلوبة لهذه الحالة','Complete only the fields required for this case'),'error');return}
  data.attachments=attachments;if(service.id==='housing'){data.joiningDate=state.user.joiningDate||'';data.serviceMonths=housingEligibility(state.user).serviceMonths;data.monthlyHousingAllowance=Number(state.user.housingAllowance||0);data.totalAmount=calculatedHousingTotal(data,state.user);}state.draft=data;state.wizardStep=2;render();
}

function editReturned(id){
  const req=state.requests.find(r=>r.id===id); if(!req||req.ownerId!==state.user.id||req.returnContext?.type!=='owner')return;
  state.activeServiceId=req.serviceId;state.editRequestId=id;state.draft=clone(req.formData);state.wizardStep=1;state.panel='new-request';render();
}
function submitRequest(){
  const ack=document.querySelector('#employeeAck'); if(!ack?.checked){toast(tr('يجب تأكيد الإقرار قبل الإرسال','Confirm the declaration before submission'),'error');return}
  const service=serviceById(state.activeServiceId); if(!service)return;
  if(state.editRequestId){
    const req=state.requests.find(r=>r.id===state.editRequestId); if(!req)return;
    req.formData=clone(state.draft);req.requesterSignatures.push(requesterSignature(req,'إعادة إرسال بعد الاستكمال'));
    addTimeline(req,state.user.id,tr('استكمل البيانات وأعاد إرسال الطلب','Completed the required information and resubmitted the request'),'resubmitted');
    req.route.forEach(s=>{if(s.state!=='approved'){s.state='waiting'}});req.returnContext=null;activateStep(req,0,'reapproval');
    state.activeRequestId=req.id;state.panel='request';state.editRequestId=null;persist();toast(tr('تمت إعادة إرسال الطلب','Request resubmitted'),'success');render();return;
  }
  const owner=state.user; const req={
    id:`REQ-${Date.now().toString().slice(-7)}`,ownerId:owner.id,serviceId:service.id,serviceName:service.name,createdAt:now(),status:'pending',activeStepIndex:0,
    formData:clone(state.draft),route:instantiateRoute(service,owner),timeline:[],requesterSignatures:[],returnContext:null,rejectedReason:'',routeSource:'AUTO',formTemplate:clone(service.form)
  };
  req.requesterSignatures.push(requesterSignature(req));addTimeline(req,owner.id,tr('أنشأ الطلب ووافق إلكترونيا على الإقرار','Created the request and electronically accepted the declaration'),'created');
  state.requests.unshift(req);activateStep(req,0,'new');persist();state.activeRequestId=req.id;state.panel='request';state.draft={};state.wizardStep=1;toast(tr('تم إنشاء الطلب وإرساله للمرحلة الأولى','Request created and sent to the first stage'),'success');render();
}

function approveRequest(reqId,note='',stageData={}){
  const req=state.requests.find(r=>r.id===reqId); if(!req||!canAct(req))return;
  const step=currentStep(req); const wasReturned=req.status==='returned';
  resolveNotifications(req.id,state.user.id,step.id);
  step.approvals.push({id:uid('A'),userId:state.user.id,note,stageData:clone(stageData),at:now(),valid:true,signature:approvalSignature(req,wasReturned?'استكمال وإعادة اعتماد':'اعتماد',note)});
  addTimeline(req,state.user.id,`${wasReturned?tr('استكمل وأعاد اعتماد','Completed and re-approved'):tr('اعتمد','Approved')} ${tr('مرحلة','stage')} ${stepLabel(step)}${note?` - ${tr('ملاحظة','Note')}: ${note}`:''}`,wasReturned?'reapproved':'approved');
  if(wasReturned){req.status='pending';req.returnContext=null}
  if(stepComplete(step)){
    step.state='approved';resolveNotifications(req.id,null,step.id);activateStep(req,req.activeStepIndex+1,wasReturned?'reapproval':'new');
  } else {
    step.state='active';req.status='pending';notifyActive(req,'reapproval');
  }
  persist();toast(tr('تم حفظ الاعتماد الإلكتروني','Electronic approval saved'),'success');render();
}
function rejectRequest(reqId,reason){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canAct(req)||!reason.trim())return;
  const step=currentStep(req);resolveNotifications(req.id,null,step.id);req.status='rejected';req.rejectedReason=reason.trim();req.rejectedAt=now();
  addTimeline(req,state.user.id,`${tr('رفض الطلب في مرحلة','Rejected the request at stage')} ${stepLabel(step)}: ${reason.trim()}`,'rejected');
  createNotification(req.ownerId,req.id,'REJECTED',tr('تم رفض طلبك','Your request was rejected'),`${req.serviceName} - ${tr('السبب','Reason')}: ${reason.trim()}`);persist();closeModal();toast(tr('تم رفض الطلب','Request rejected'),'success');render();
}
function returnTargets(req){
  const ownerTarget={value:'owner',label:`${userName(userById(req.ownerId))} - ${tr('مقدم الطلب','Requester')}`,type:'owner',index:-1,userId:req.ownerId};
  // مدير القسم لا يغير المسار ولا يعيد إلا للموظف صاحب الطلب.
  if(!isHRWorkflowController() && !hasPermission('workflow_override_all'))return [ownerTarget];
  const out=[ownerTarget];
  for(let i=0;i<req.activeStepIndex;i++){
    const s=req.route[i]; const actors=[...new Set(validApprovals(s).map(a=>a.userId).concat(s.assigneeIds))];
    actors.forEach(id=>out.push({value:`step:${i}:${id}`,label:`${userName(userById(id))||id} - ${stepLabel(s)}`,type:'step',index:i,userId:id}));
  }
  return out;
}
function invalidateFrom(req,index){
  const start=Math.max(0,index);
  for(let i=start;i<req.route.length;i++){
    const s=req.route[i];s.approvals.forEach(a=>{if(a.valid)a.valid=false});s.state='waiting';resolveNotifications(req.id,null,s.id);
  }
}
function returnRequest(reqId,targetValue,reason,scope){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canAct(req)||!reason.trim())return;
  const target=returnTargets(req).find(t=>t.value===targetValue);if(!target)return;
  const current=currentStep(req);resolveNotifications(req.id,null,current.id);invalidateFrom(req,target.index);
  req.status='returned';req.activeStepIndex=target.index;req.returnContext={type:target.type,index:target.index,userId:target.userId,reason:reason.trim(),scope,returnedBy:state.user.id,at:now()};
  if(target.type==='step')req.route[target.index].state='active';
  addTimeline(req,state.user.id,`${tr('أعاد الطلب للاستكمال إلى','Returned the request for completion to')} ${target.label}. ${tr('السبب','Reason')}: ${reason.trim()}`,'returned',{scope,target});
  createNotification(target.userId,req.id,'RETURNED',tr('أعيد لك طلب للاستكمال','A request was returned to you for completion'),`${req.serviceName} - ${tr('المطلوب','Required')}: ${reason.trim()}`);
  persist();closeModal();toast(tr('تمت إعادة الطلب للطرف المحدد فقط','Request returned only to the selected previous party'),'success');render();
}

function markNotification(id){const n=state.notifications.find(x=>x.id===id);if(n){n.read=true;save(KEYS.notifications,state.notifications);if(n.requestId)openRequest(n.requestId);else render()}}
function markAllNotifications(){userNotifications().forEach(n=>n.read=true);save(KEYS.notifications,state.notifications);render()}

function saveDeptManager(deptId,userId){state.orgOverrides[deptId]={...(state.orgOverrides[deptId]||{}),managerId:userId};save(KEYS.org,state.orgOverrides);toast(tr('تم تحديث مدير القسم','Department manager updated'),'success');render()}
function addDelegation(data){
  state.delegations.push({id:uid('DEL'),active:true,...data});save(KEYS.delegations,state.delegations);toast(tr('تم إنشاء التفويض','Delegation created'),'success');closeModal();render();
}
function deleteDelegation(id){state.delegations=state.delegations.filter(d=>d.id!==id);save(KEYS.delegations,state.delegations);render()}

function resolverPreset(r){
  if(r.type==='DIRECT_MANAGER')return 'DIRECT_MANAGER';
  if(r.type==='GENERAL_MANAGER')return 'GENERAL_MANAGER';
  if(r.type==='NAMED_USER'&&r.excludeOwner)return `SMART_USER:${r.userId}:${r.fallbackRole||'specialist'}:${r.departmentId||'hr'}`;
  if(r.type==='NAMED_USER')return `USER:${r.userId}`;
  if(r.type==='DEPARTMENT_MANAGER_FIXED')return `DEPT_MANAGER:${r.departmentId}`;
  if(r.type==='ROLE_IN_DEPARTMENT')return `ROLE:${r.departmentId}:${r.role}`;
  if(r.type==='HR_RESPONSIBLE')return `HR_RESPONSIBLE:${r.preferredUserId||'E001'}`;
  return 'DIRECT_MANAGER';
}
function presetResolver(value){
  if(value==='DIRECT_MANAGER')return {type:'DIRECT_MANAGER'};
  if(value==='GENERAL_MANAGER')return {type:'GENERAL_MANAGER'};
  const [t,a,b]=value.split(':');
  if(t==='USER')return {type:'NAMED_USER',userId:a};
  if(t==='SMART_USER'){const parts=value.split(':');return {type:'NAMED_USER',userId:parts[1],excludeOwner:true,fallbackRole:parts[2]||'specialist',departmentId:parts[3]||'hr'}};
  if(t==='DEPT_MANAGER')return {type:'DEPARTMENT_MANAGER_FIXED',departmentId:a};
  if(t==='ROLE')return {type:'ROLE_IN_DEPARTMENT',departmentId:a,role:b};
  if(t==='HR_RESPONSIBLE')return {type:'HR_RESPONSIBLE',preferredUserId:a||'E001'};
  return {type:'DIRECT_MANAGER'};
}
function workflowPresetOptions(selected=''){
  const opts=[['DIRECT_MANAGER',tr('المدير المباشر','Direct Manager')],['GENERAL_MANAGER',tr('المدير العام','General Manager')],['HR_RESPONSIBLE:E001',tr('المختص المسؤول في الموارد البشرية (نادر افتراضيا مع بديل تلقائي)','Assigned HR reviewer (Nader by default with automatic fallback)')],['SMART_USER:E001:specialist:hr',tr('نادر الجهني (مع بديل تلقائي إذا كان هو مقدم الطلب)','Nader Aljuhani (automatic fallback if requester)')],['USER:E001',userName(userById('E001'))],['USER:E002',userName(userById('E002'))],['USER:HRM01',userName(userById('HRM01'))],['DEPT_MANAGER:hr',tr('مدير الموارد البشرية','HR Manager')],['DEPT_MANAGER:accounting',tr('مدير المحاسبة','Accounting Manager')],['DEPT_MANAGER:training',tr('مدير التدريب','Training Manager')],['ROLE:hr:specialist',tr('أي مختص موارد بشرية - نفس المرحلة','Any HR Specialist - same stage')]];
  return opts.map(([v,l])=>`<option value="${v}" ${v===selected?'selected':''}>${h(l)}</option>`).join('');
}
function saveWorkflowTemplate(serviceId){
  const rows=[...document.querySelectorAll('#templateRows .template-row')];
  const defaults=serviceById(serviceId)?.workflowTemplate||[];
  const steps=rows.map((row,i)=>{
    const id=row.dataset.id||`custom-${i+1}`; const original=defaults.find(x=>x.id===id)||state.workflowOverrides[serviceId]?.find(x=>x.id===id);
    return {id,label:row.querySelector('.tpl-label').value.trim()||tr(`مرحلة ${i+1}`,`Stage ${i+1}`),resolver:presetResolver(row.querySelector('.tpl-resolver').value),mode:row.querySelector('.tpl-mode').value,stageFields:clone(original?.stageFields||[])};
  });
  state.workflowOverrides[serviceId]=steps;save(KEYS.templates,state.workflowOverrides);closeModal();toast(tr('تم حفظ المسار التلقائي للخدمة','Automatic service workflow saved'),'success');render();
}
function resetWorkflowTemplate(serviceId){delete state.workflowOverrides[serviceId];save(KEYS.templates,state.workflowOverrides);closeModal();toast(tr('تمت إعادة المسار الافتراضي','Default workflow restored'),'success');render()}

function saveManualRoute(reqId){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canOverrideRoute(req))return;
  const start=Math.max(0,req.activeStepIndex); const oldCurrent=currentStep(req); const oldAssignees=oldCurrent?.assigneeIds.join(',')||'';
  const rows=[...document.querySelectorAll('#routeRows .route-row')];
  const future=rows.map((row,i)=>{
    const id=row.dataset.id||`manual-${Date.now()}-${i}`; const old=req.route.find(x=>x.id===id);
    const assigneeId=row.querySelector('.route-user').value;
    return {id,label:row.querySelector('.route-label').value.trim()||tr(`مرحلة ${i+1}`,`Stage ${i+1}`),resolverSnapshot:{type:'MANUAL'},stageFields:clone(old?.stageFields||[]),mode:'SEQUENTIAL',assignments:[{userId:assigneeId,principalId:assigneeId,delegationId:null}],assigneeIds:[assigneeId],state:i===0?'active':'waiting',approvals:[]};
  });
  req.route=[...req.route.slice(0,start),...future];req.routeSource='MANUAL';req.status='pending';req.returnContext=null;
  resolveNotifications(req.id,null,oldCurrent?.id);addTimeline(req,state.user.id,tr('عدل مسار الموافقات يدويا للطلب','Manually changed the request approval workflow'),'route_changed');
  if(future.length){req.activeStepIndex=start;notifyActive(req,'reapproval')}else activateStep(req,start);
  persist();closeModal();toast(tr('تم تعديل مسار الطلب وتحديث المسؤول الحالي','Request workflow updated and current owner reassigned'),'success');render();
}

function stageDataValue(req, fieldId){
  if(!req)return '';
  for(const step of req.route){
    const approvals=[...(step.approvals||[])].filter(a=>a.valid).reverse();
    for(const a of approvals){if(a.stageData&&a.stageData[fieldId])return a.stageData[fieldId]}
  }
  return '';
}
function housingControlledSection(req){
  const fields=[['joiningDate',tr('تاريخ التعيين','Joining Date')],['hrNotes',tr('ملاحظات الموارد البشرية','HR Notes')],['existingLoan',tr('السلف القائمة - ريال','Existing Loans - SAR')],['eosBenefits',tr('حقوق نهاية الخدمة عند الاستقالة - ريال','EOS Benefits on Resignation - SAR')],['approvedMonths',tr('عدد الأشهر المعتمدة','Approved Months')],['approvedInstallment',tr('قيمة القسط الشهري المعتمد - ريال','Approved Monthly Installment - SAR')],['approvedTotal',tr('إجمالي المبلغ المعتمد - ريال','Approved Total Amount - SAR')],['accountantName',tr('تمت المراجعة بواسطة المحاسب','Reviewed by Accountant')]];
  return `<div class="doc-section"><h4>${tr('حقول المراجعة الداخلية في HR-F-29','Internal Review Fields in HR-F-29')}</h4><div class="doc-grid">${fields.map(([id,label])=>`<div class="doc-field"><span>${h(label)}</span><strong>${h(stageDataValue(req,id)||tr('يعبأ في مرحلته المختصة','Completed by the responsible stage'))}</strong></div>`).join('')}</div></div>`;
}
function formatTime12(value){
  if(!value)return tr('غير مدخل','Not entered');const [hh,mm='00']=String(value).split(':');const n=Number(hh);if(Number.isNaN(n))return value;const period=isEn()?(n<12?'AM':'PM'):(n<12?'ص':'م');const hour=n%12||12;return `${hour}:${mm} ${period}`;
}
function displayFieldValue(f,value){
  if(value===undefined||value===null||String(value).trim()==='')return tr('لم يتم إدخاله بعد','Not entered yet');if(f.type==='time')return formatTime12(value);if(f.type==='select')return optionLabel(f,String(value));return String(value);
}
function previewAttachmentRows(service,data={}){
  const items=visibleAttachments(service,data);if(!items.length)return '';
  return `<div class="doc-section"><h4>${tr('المرفقات','Attachments')}</h4><div class="doc-grid">${items.map(a=>`<div class="doc-field"><span>${h(attachmentLabel(a))}</span><strong>${h(data.attachments?.[a.id]||tr('لم يرفق','Not attached'))}</strong></div>`).join('')}</div></div>`;
}
function formPreview(service, reqData, req=null){
  const data=reqData||{};const owner=req?userById(req.ownerId):state.user;const signatures=req?.requesterSignatures||[];const latestRequester=[...signatures].reverse().find(s=>s.valid);const route=req?.route||instantiateRoute(service,owner);const fields=visibleFields(service,data);
  const fieldRows=fields.map(f=>`<div class="doc-field"><span>${h(fieldLabel(f))}</span><strong>${h(displayFieldValue(f,data?.[f.id]))}${(isEn()?f.suffixEn:f.suffix)&&data?.[f.id]?` ${h(isEn()?f.suffixEn:f.suffix)}`:''}</strong></div>`).join('');
  const approvals=route.map((s,i)=>{const a=[...(s.approvals||[])].reverse().find(x=>x.valid);return `<div class="approval-box"><span>${i+1}. ${h(stepLabel(s))}</span>${a?`<strong>${tr('تم الاعتماد إلكترونيا','Electronically Approved')}</strong><small>${h(userName(userById(a.userId))||a.signature.name)} - ${h(userTitle(userById(a.userId))||a.signature.title)}</small><small>${fmt(a.signature.at)}</small>${a.note?`<em>${tr('ملاحظة','Note')}: ${h(a.note)}</em>`:''}`:`<strong class="muted">${tr('بانتظار وصول الدور','Waiting for this stage')}</strong><small>${h(assigneeDisplay(s)||tr('سيحدد حسب المسار','Assigned by workflow'))}</small>`}</div>`}).join('');
  const housingExtra=service.id==='housing'?`<div class="doc-section"><h4>${tr('الاستحقاق المحتسب','Calculated Eligibility')}</h4><div class="doc-grid"><div class="doc-field"><span>${tr('تاريخ التعيين','Joining Date')}</span><strong>${h(owner?.joiningDate||tr('غير متوفر','Not available'))}</strong></div><div class="doc-field"><span>${tr('مدة الخدمة','Service Duration')}</span><strong>${h(serviceDurationText(completeServiceMonths(owner?.joiningDate)))}</strong></div><div class="doc-field"><span>${tr('بدل السكن الشهري','Monthly Housing Allowance')}</span><strong>${h(owner?.housingAllowance||0)} ${tr('ريال','SAR')}</strong></div><div class="doc-field"><span>${tr('الإجمالي المتوقع','Expected Total')}</span><strong>${h(data.totalAmount||calculatedHousingTotal(data,owner)||0)} ${tr('ريال','SAR')}</strong></div></div><p class="eligibility-note">${h(housingEligibilityText(owner))}</p></div>`:'';
  return `<div class="document-preview"><div class="doc-top"><div><strong>${h(localized(service.form,'templateName',service.code))}</strong><small>${tr('معاينة منظمة للبيانات التي ستكتب في النموذج المعتمد','Structured preview of the data that will be written to the approved form')}</small></div><div class="doc-ref"><span>${h(service.code)}</span><span>Revision ${h(service.form.revision||tr('غير محدد','Not specified'))}</span></div></div><div class="doc-section"><h4>${tr('بيانات الموظف','Employee Information')}</h4><div class="doc-grid"><div class="doc-field"><span>${tr('الاسم','Name')}</span><strong>${h(userName(owner))}</strong></div><div class="doc-field"><span>${tr('الرقم الوظيفي','Employee ID')}</span><strong>${h(owner?.id||tr('غير معروف','Unknown'))}</strong></div><div class="doc-field"><span>${tr('القسم','Department')}</span><strong>${h(deptName(owner?.departmentId))}</strong></div><div class="doc-field"><span>${tr('المسمى','Title')}</span><strong>${h(userTitle(owner))}</strong></div></div></div>${housingExtra}<div class="doc-section"><h4>${service.id==='attendance-memo'?tr('تفاصيل حالة الحضور','Attendance Case Details'):tr('بيانات الطلب','Request Details')}</h4><div class="doc-grid">${fieldRows||`<div class="doc-field"><span>${tr('البيانات','Data')}</span><strong>${tr('بانتظار الإدخال','Waiting for input')}</strong></div>`}</div></div>${previewAttachmentRows(service,data)}<div class="doc-section declaration"><h4>${tr('الإقرار','Declaration')}</h4><p>${h(localized(service.form,'declaration',tr('أقر بصحة البيانات الواردة في الطلب.','I confirm the accuracy of the request information.')))}</p>${latestRequester?`<div class="e-sign"><strong>${tr('اعتماد الموظف إلكترونيا','Employee Electronic Approval')}</strong><span>${h(userName(owner))} - ${h(userTitle(owner))}</span><span>${fmt(latestRequester.at)} · ${h(req?.id||tr('مسودة','Draft'))}</span></div>`:`<div class="e-sign pending-sign">${tr('سيتم تسجيل اسم الموظف والحساب والتاريخ عند الإرسال','The employee name, account and date will be recorded on submission')}</div>`}</div>${service.id==='housing'?housingControlledSection(req):''}<div class="doc-section"><h4>${tr('سجل الاعتمادات','Approval Record')}</h4><div class="approval-grid">${approvals}</div></div>${service.form.masterPath?`<div class="doc-master">${tr('الملف المعتمد محفوظ كـ Master ولا يتم تعديل الأصل.','The approved Master file remains unchanged.')} <a href="${encodeURI(service.form.masterPath)}" target="_blank">${tr('فتح الملف المعتمد','Open approved file')}</a></div>`:''}</div>`;
}
function loginView(){
  applyLocale();
  app.innerHTML=`<div class="login-shell"><div class="login-visual"><div class="brand-mark">NDR</div><h1>Smart Hub</h1><p>${tr('خدمات، نماذج، موافقات ومعرفة داخلية في مسار واحد.','Services, forms, approvals and internal knowledge in one workspace.')}</p><div class="feature-line"><strong>Semantic Routing</strong><span>${tr('يفهم المعنى والسياق مع مسار بديل عند تعطل AI.','Understands intent and context with a fallback when AI is unavailable.')}</span></div><div class="feature-line"><strong>Sequential Workflow</strong><span>${tr('الإشعار يصل للمسؤول الحالي فقط.','Only the current approver is notified.')}</span></div><div class="feature-line"><strong>Smart Forms</strong><span>${tr('الحقول والاستحقاقات تتكيف حسب الموظف والحالة.','Fields and eligibility adapt to the employee and case.')}</span></div></div><div class="login-side"><div class="login-card"><div class="login-tools"><button class="lang-toggle" data-lang="ar">العربية</button><button class="lang-toggle" data-lang="en">English</button></div><div class="brand-mark small">NDR</div><h2>${tr('دخول تجريبي','Demo Login')}</h2><p>${tr('اختر مستخدما لتجربة الصلاحيات والمسارات.','Choose a user to test roles and workflows.')}</p><label class="field"><span>${tr('المستخدم','User')}</span><select id="loginUser">${users.map(u=>`<option value="${u.id}">${h(userName(u))} — ${h(userTitle(u))}</option>`).join('')}</select></label><button class="primary full" id="loginBtn">${tr('دخول','Sign In')}</button><div class="demo-note">${tr('هذه بيئة تجريبية. تاريخ التعيين وبدل السكن في الحسابات التجريبية يستخدمان لاختبار قواعد الاستحقاق.','This is a demo environment. Joining dates and housing allowances in demo profiles are used to test eligibility rules.')}</div></div></div></div>`;
  document.querySelector('#loginBtn').onclick=()=>setUser(document.querySelector('#loginUser').value);document.querySelectorAll('.lang-toggle').forEach(b=>b.onclick=()=>setLanguage(b.dataset.lang));
}
function navButton(panel,label,badge=''){return `<button data-panel="${panel}" class="${state.panel===panel?'active':''}"><span>${label}</span>${badge?`<b>${badge}</b>`:''}</button>`}
function sidebar(){
  const approvalBadge=pendingForUser().length||'',notif=unreadCount()||'';return `<aside class="sidebar"><div class="brand"><div class="brand-mark small">NDR</div><div><strong>Smart Hub</strong><small>Services & Approvals</small></div></div><div class="nav-title">${tr('مساحة العمل','Workspace')}</div><nav>${navButton('home',tr('الرئيسية','Home'))}${navButton('assistant','NDR AI')}${navButton('services',tr('الخدمات','Services'))}${navButton('my-requests',tr('طلباتي','My Requests'))}${navButton('notifications',tr('الإشعارات','Notifications'),notif)}${['specialist','manager','executive'].includes(state.user.role)?navButton('approvals',tr('الموافقات','Approvals'),approvalBadge):''}${['manager','executive','system_admin'].includes(state.user.role)?navButton('organization',tr('الهيكل والتفويض','Organization & Delegation')):''}${hasPermission('view_all')?navButton('oversight',tr('الرقابة على الطلبات','Request Oversight')):''}${hasPermission('workflow_design')?navButton('workflow-admin',tr('إدارة المسارات','Workflow Management')):''}${navButton('knowledge',tr('مركز المعرفة','Knowledge Center'))}</nav><div class="sidebar-foot"><div class="user-card"><span class="avatar">${h(userName(state.user).slice(0,1))}</span><div><strong>${h(userName(state.user))}</strong><small>${h(userTitle(state.user))} · ${roleName(state.user.role)}</small></div></div></div></aside>`;
}
function topbar(){return `<header class="topbar"><div><span class="eyebrow">${h(deptName(state.user.departmentId))}</span><h1>${panelTitle()}</h1></div><div class="top-actions"><button class="lang-switch" id="langSwitch">${isEn()?'العربية':'English'}</button><button class="bell" data-panel="notifications">🔔${unreadCount()?`<b>${unreadCount()}</b>`:''}</button><button class="ghost" id="logoutBtn">${tr('تسجيل الخروج','Sign Out')}</button></div></header>`}
function panelTitle(){const titles={home:tr(`مرحبا ${userName(state.user).split(' ')[0]}`,`Hello ${userName(state.user).split(' ')[0]}`),assistant:'NDR AI',services:tr('الخدمات','Services'),'my-requests':tr('طلباتي','My Requests'),notifications:tr('الإشعارات','Notifications'),approvals:tr('الموافقات','Approvals'),organization:tr('الهيكل والتفويض','Organization & Delegation'),oversight:tr('الرقابة على الطلبات','Request Oversight'),'workflow-admin':tr('إدارة المسارات','Workflow Management'),knowledge:tr('مركز المعرفة','Knowledge Center'),service:tr('تفاصيل الخدمة','Service Details'),'new-request':tr('إنشاء الطلب','Create Request'),request:tr('تفاصيل المعاملة','Request Details')};return titles[state.panel]||'NDR Smart Hub'}
function requestRow(req){const st=requestStatus(req);return `<div class="request-row" data-request="${req.id}"><div><div class="request-title"><strong>${h(serviceName(serviceById(req.serviceId))||req.serviceName)}</strong><span class="status ${st.cls}">${h(st.label)}</span></div><small>${h(req.id)} · ${fmt(req.createdAt)} · ${tr('مقدم الطلب','Requester')}: ${h(userName(userById(req.ownerId))||req.ownerId)}</small><div class="holder">${tr('المسؤول الحالي','Current owner')}: <strong>${h(holderNames(req))}</strong></div><div class="progress"><i style="width:${requestProgress(req)}%"></i></div></div><span class="open-arrow">‹</span></div>`}
function serviceCard(s){const route=serviceTemplate(s.id);return `<article class="service-card"><div class="service-head"><div><span class="tag">${h(deptName(s.departmentId))}</span><h3>${h(serviceName(s))}</h3></div><span class="mode">${h(s.code)}</span></div><p>${h(serviceDescription(s))}</p><div class="route-mini">${route.slice(0,4).map((x,i)=>`<span>${i+1}. ${h(stepLabel(x))}</span>`).join('')}${route.length>4?'<span>...</span>':''}</div><div class="actions"><button class="outline open-service" data-service="${s.id}">${tr('تفاصيل','Details')}</button><button class="primary start-service" data-service="${s.id}">${tr('ابدأ','Start')}</button></div></article>`}
function homePanel(){
  const mine=state.requests.filter(r=>r.ownerId===state.user.id),returned=mine.filter(r=>r.status==='returned'&&r.returnContext?.type==='owner').length;return `<section><div class="hero"><span class="ai-pill">NDR AI · ${tr('مساعد الخدمة','Service Assistant')}</span><h2>${tr('ماذا تريد أن تنجز اليوم؟','What would you like to accomplish today?')}</h2><p>${tr('اكتب بطريقتك ولهجتك. يحاول AI فهم النية والسياق، وإذا تعطل يستخدم النظام محركا محليا بديلا.','Write naturally in Arabic, English or your usual dialect. AI attempts to understand intent and context, with a local fallback if AI is unavailable.')}</p><div class="ask"><textarea id="aiInput" placeholder="${tr('مثال: بطلع ساعتين اليوم عندي موعد','Example: I need to leave for two hours today for an appointment')}"></textarea><button class="primary" id="askBtn">${tr('ابدأ','Start')}</button></div><div class="chips">${[tr('أبي أطلع شوي اليوم','I need to step out today'),tr('نسيت بصمة الخروج أمس','I forgot to clock out yesterday'),tr('أريد بدل سكن','I need a housing advance'),tr('عندي إجازة مرضية','I have sick leave')].map(x=>`<button class="chip ai-chip">${x}</button>`).join('')}</div></div>${returned?`<div class="urgent-banner"><strong>${tr(`لديك ${returned} طلب يحتاج استكمال`,`${returned} request(s) need completion`)}</strong><span>${tr('تمت إعادته لك من مسار الموافقات.','Returned to you from the approval workflow.')}</span><button class="outline" data-panel="my-requests">${tr('فتح طلباتي','Open My Requests')}</button></div>`:''}<div class="dash-grid"><div class="card"><div class="card-head"><div><h3>${tr('طلباتي الأخيرة','Recent Requests')}</h3><span>${tr('الحالة والمسؤول الحالي','Status and current owner')}</span></div><button class="text-btn" data-panel="my-requests">${tr('عرض الكل','View All')}</button></div>${mine.slice(0,3).map(requestRow).join('')||`<div class="empty">${tr('لا توجد طلبات حتى الآن','No requests yet')}</div>`}</div><div class="card"><div class="card-head"><div><h3>${tr('خدمات سريعة','Quick Services')}</h3><span>${tr('مسارات تلقائية قابلة للضبط','Configurable automatic workflows')}</span></div><button class="text-btn" data-panel="services">${tr('كل الخدمات','All Services')}</button></div>${services.filter(s=>s.active).slice(0,3).map(s=>`<div class="quick-service"><div><strong>${h(serviceName(s))}</strong><small>${serviceTemplate(s.id).length} ${tr('مراحل اعتماد','approval stages')}</small></div><button class="outline start-service" data-service="${s.id}">${tr('ابدأ','Start')}</button></div>`).join('')}</div></div></section>`;
}
function assistantPanel(){return `<section class="assistant-layout"><div class="chat card"><div class="chat-head"><span class="ai-icon">✦</span><div><strong>NDR AI</strong><small>${tr('محادثة خاصة بحساب','Private conversation for')} ${h(userName(state.user))} · ${state.aiRoutingMode==='ai'?tr('توجيه AI','AI routing'):tr('وضع بديل محلي','local fallback')}</small></div></div><div class="messages">${state.messages.map(m=>`<div class="msg ${m.role}">${h(m.text)}${m.service?`<div class="actions"><button class="primary start-service" data-service="${m.service.id}" data-prefill="${encodeURIComponent(JSON.stringify(m.prefill||{}))}">${tr('ابدأ الخدمة','Start Service')}</button><button class="outline open-service" data-service="${m.service.id}">${tr('تفاصيل','Details')}</button></div>`:''}</div>`).join('')}</div><div class="chat-send"><input id="chatInput" placeholder="${tr('اكتب ما تحتاجه بطريقتك','Describe what you need naturally')}"><button class="primary" id="chatSend">${tr('إرسال','Send')}</button></div></div><aside class="side-stack"><div class="card"><h3>${tr('كيف يفهم طلبك؟','How routing works')}</h3><p class="muted">${tr('الطبقة الأولى تحاول فهم المعنى والسياق والوقت. إذا تعذر مزود AI تعمل طبقة محلية بديلة ولا يتوقف الموقع.','The first layer understands meaning, context and time. If the AI provider is unavailable, a local fallback keeps the site working.')}</p></div><div class="card"><h3>${tr('الخصوصية','Privacy')}</h3><p class="muted">${tr('المحادثة منفصلة لكل حساب ولكل لغة.','Chat history is isolated per user and per language.')}</p></div></aside></section>`}
function servicesPanel(){return `<section><div class="section-head"><div><h2>${tr('دليل الخدمات','Service Directory')}</h2><p>${tr('كل خدمة لها نموذج ومسار وقواعد مستقلة.','Each service has its own form, workflow and rules.')}</p></div><input class="search" id="serviceSearch" placeholder="${tr('ابحث عن خدمة أو نموذج','Search service or form')}"></div><div class="service-grid" id="serviceGrid">${services.filter(s=>s.active).map(serviceCard).join('')}</div></section>`}
function servicePanel(){
  const s=serviceById(state.activeServiceId);if(!s)return servicesPanel();const route=serviceTemplate(s.id);const housing=s.id==='housing'?`<div class="eligibility-card ${housingEligibility(state.user).eligible?'ok':'blocked'}"><strong>${tr('استحقاقك الحالي','Your Current Eligibility')}</strong><p>${h(housingEligibilityText(state.user))}</p></div>`:'';return `<section><div class="service-hero card"><div><span class="tag">${h(deptName(s.departmentId))}</span><h2>${h(serviceName(s))}</h2><p>${h(serviceDescription(s))}</p>${housing}<div class="actions"><button class="primary start-service" data-service="${s.id}" ${s.id==='housing'&&!housingEligibility(state.user).eligible?'disabled':''}>${tr('إنشاء طلب','Create Request')}</button>${s.form.masterPath?`<a class="outline link-btn" href="${encodeURI(s.form.masterPath)}" target="_blank">${tr('فتح النموذج الأصلي','Open Original Form')}</a>`:''}</div></div><div class="service-meta"><div><span>${tr('النموذج','Form')}</span><strong>${h(s.code)}</strong></div><div><span>${tr('الإجراء','Procedure')}</span><strong>${h(s.procedure)}</strong></div><div><span>${tr('المسار','Workflow')}</span><strong>${route.length} ${tr('مراحل','stages')}</strong></div><div><span>${tr('صيغة النموذج','Form Format')}</span><strong>${h(s.form.sourceFormat||tr('رقمي','Digital'))}</strong></div></div></div><div class="detail-grid"><div class="card"><h3>${tr('المسار التلقائي الحالي','Current Automatic Workflow')}</h3><div class="route-list">${route.map((x,i)=>`<div><b>${i+1}</b><span><strong>${h(stepLabel(x))}</strong><small>${h(resolverText(x.resolver))}</small></span></div>`).join('')}</div></div><div class="card"><h3>${tr('بيانات يطلبها النظام','Information Requested by the System')}</h3><div class="clean-list">${s.fields.map(f=>`<div>✓ ${h(fieldLabel(f))}</div>`).join('')}${(s.attachments||[]).map(a=>`<div>+ ${h(attachmentLabel(attachmentMeta(a)))}</div>`).join('')}</div></div></div></section>`;
}
function housingRequestInfo(data={}){
  const e=housingEligibility(state.user),total=calculatedHousingTotal(data,state.user);return `<div class="eligibility-card ${e.eligible?'ok':'blocked'}"><div><strong>${tr('استحقاق بدل السكن','Housing Allowance Eligibility')}</strong><p>${h(housingEligibilityText(state.user))}</p></div>${e.eligible?`<div class="eligibility-metrics"><span>${tr('تاريخ التعيين','Joining Date')}<strong>${h(state.user.joiningDate)}</strong></span><span>${tr('بدل السكن الشهري','Monthly Housing Allowance')}<strong>${h(state.user.housingAllowance||0)} ${tr('ريال','SAR')}</strong></span><span>${tr('الإجمالي حسب اختيارك','Total from your selection')}<strong>${h(total||0)} ${tr('ريال','SAR')}</strong></span></div>`:''}</div>`
}
function newRequestPanel(){
  const s=serviceById(state.activeServiceId);if(!s)return servicesPanel();const editing=!!state.editRequestId;if(state.wizardStep===2)return reviewPanel();const req=editing?state.requests.find(r=>r.id===state.editRequestId):null;const data=state.draft||{};const fields=visibleFields(s,data);const attachments=visibleAttachments(s,data);const blocked=s.id==='housing'&&!housingEligibility(state.user).eligible;
  return `<section><div class="wizard-head"><div><span class="eyebrow">${editing?tr('استكمال طلب معاد','Complete Returned Request'):tr('طلب جديد','New Request')} · ${h(s.code)}</span><h2>${h(serviceName(s))}</h2></div><div class="wizard"><b class="active">1 ${tr('البيانات','Data')}</b><b>2 ${tr('النموذج والمراجعة','Form & Review')}</b><b>3 ${tr('الإرسال','Submit')}</b></div></div>${editing?`<div class="return-box"><strong>${tr('سبب الإعادة','Return Reason')}</strong><span>${h(req.returnContext?.reason||'')}</span><small>${tr('المطلوب','Required')}: ${h(scopeName(req.returnContext?.scope))}</small></div>`:''}${s.id==='housing'?housingRequestInfo(data):''}<form id="requestForm" class="form-layout"><div class="card"><div class="prefill"><h3>${tr('بيانات من الحساب','Profile Data')}</h3><div><span>${tr('الاسم','Name')}<strong>${h(userName(state.user))}</strong></span><span>${tr('الرقم الوظيفي','Employee ID')}<strong>${h(state.user.id)}</strong></span><span>${tr('القسم','Department')}<strong>${h(deptName(state.user.departmentId))}</strong></span><span>${tr('المدير المباشر','Direct Manager')}<strong>${h(userName(userById(state.user.managerId)))}</strong></span></div></div><div class="form-grid">${fields.map(f=>`<label class="field ${f.type==='textarea'?'wide':''}"><span>${h(fieldLabel(f))}${fieldRequired(f,data)?' *':''}</span>${fieldControl(f,data[f.id]||'',data,s,state.user)}</label>`).join('')}</div>${attachments.length?`<div class="attachments"><h3>${tr('المرفقات المطلوبة','Required Attachments')}</h3>${attachments.map(a=>`<label class="upload"><span>＋</span><div><strong>${h(attachmentLabel(a))}</strong><small>${data.attachments?.[a.id]?`${tr('الملف الحالي','Current file')}: ${h(data.attachments[a.id])}`:tr('PDF أو صورة','PDF or image')}</small></div><input type="file" data-attachment-id="${h(a.id)}" accept="${h(a.accept||'.pdf,.png,.jpg,.jpeg')}"></label>`).join('')}</div>`:''}<div class="form-actions"><button type="button" class="primary" id="reviewBtn" ${blocked?'disabled':''}>${tr('مراجعة النموذج','Review Form')}</button></div></div><aside class="side-stack"><div class="card"><h3>${tr('المسار المتوقع','Expected Workflow')}</h3><div class="route-list small-route">${serviceTemplate(s.id).map((x,i)=>`<div><b>${i+1}</b><span><strong>${h(stepLabel(x))}</strong><small>${h(resolverText(x.resolver))}</small></span></div>`).join('')}</div></div><div class="notice">${tr('لن يصل إشعار لأي مرحلة مستقبلية. يتم إخطار المسؤول الحالي فقط.','Future stages are not notified. Only the current responsible approver receives an action notification.')}</div></aside></form></section>`;
}
function scopeName(v){const ar={data:'تعديل البيانات',attachments:'استكمال المرفقات',stage_note:'استكمال ملاحظة المرحلة',other:'استكمال حسب الملاحظة'},en={data:'Update Data',attachments:'Complete Attachments',stage_note:'Complete Stage Note',other:'Complete as Instructed'};return (isEn()?en:ar)[v]||v||tr('غير محدد','Not specified')}
function reviewPanel(){const s=serviceById(state.activeServiceId),editing=!!state.editRequestId;return `<section><div class="wizard-head"><button class="back-btn" id="backToForm">${tr('رجوع للتعديل','Back to Edit')}</button><div><span class="eyebrow">${editing?tr('إعادة إرسال بعد الاستكمال','Resubmit After Completion'):tr('مراجعة قبل الإرسال','Review Before Submission')}</span><h2>${tr('راجع البيانات التي ستنتقل مع النموذج في مسار الموافقات','Review the data that will move with the form through the approval workflow')}</h2></div><div class="wizard"><b>1 ${tr('البيانات','Data')}</b><b class="active">2 ${tr('النموذج والمراجعة','Form & Review')}</b><b>3 ${tr('الإرسال','Submit')}</b></div></div><div class="review-layout"><div>${formPreview(s,state.draft,null)}</div><aside class="side-stack"><div class="card"><h3>${tr('الإقرار الإلكتروني','Electronic Declaration')}</h3><label class="ack"><input type="checkbox" id="employeeAck"><span>${h(localized(s.form,'declaration',''))}</span></label><p class="muted">${tr('عند الإرسال يسجل النظام الحساب والتاريخ ورقم المعاملة كاعتماد إلكتروني للموظف.','On submission, the account, date and request number are recorded as the employee electronic approval.')}</p><button class="primary full" id="submitBtn">${editing?tr('إعادة إرسال الطلب','Resubmit Request'):tr('إرسال الطلب للموافقة','Submit for Approval')}</button><button class="outline full" id="backToForm2">${tr('تعديل البيانات','Edit Data')}</button></div></aside></div></section>`}
function myRequestsPanel(){const mine=state.requests.filter(r=>r.ownerId===state.user.id);return `<section><div class="section-head"><div><h2>${tr('طلباتي','My Requests')}</h2><p>${tr('كل طلب يظهر حالته والمسؤول الحالي.','Each request shows its status and current owner.')}</p></div><button class="primary" data-panel="services">${tr('طلب جديد','New Request')}</button></div><div class="card">${mine.map(requestRow).join('')||`<div class="empty">${tr('لا توجد طلبات','No requests')}</div>`}</div></section>`}
function approvalsPanel(){const p=pendingForUser();return `<section><div class="section-head"><div><h2>${tr('الموافقات','Approvals')}</h2><p>${tr('لا يظهر هنا إلا الطلب الذي وصل دورك فعلا.','Only requests that have actually reached your stage appear here.')}</p></div><span class="count-pill">${p.length} ${tr('بانتظارك','pending')}</span></div><div class="card">${p.map(requestRow).join('')||`<div class="empty">${tr('لا توجد معاملات بانتظارك','No requests are waiting for you')}</div>`}</div></section>`}
function notificationsPanel(){const list=userNotifications();return `<section><div class="section-head"><div><h2>${tr('الإشعارات','Notifications')}</h2><p>${tr('إشعار الإجراء يذهب للمسؤول الحالي فقط.','Action notifications go only to the current responsible approver.')}</p></div><button class="outline" id="markAll">${tr('تحديد الكل كمقروء','Mark All as Read')}</button></div><div class="card notification-list">${list.map(n=>`<button class="notification ${!n.read&&!n.resolved?'unread':''}" data-notification="${n.id}"><span class="notif-dot"></span><div><strong>${h(n.title)}</strong><p>${h(n.body)}</p><small>${fmt(n.createdAt)}${n.resolved?` · ${tr('انتهى الإجراء','Action completed')}`:''}</small></div></button>`).join('')||`<div class="empty">${tr('لا توجد إشعارات','No notifications')}</div>`}</div></section>`}
function requestPanel(){const req=state.requests.find(r=>r.id===state.activeRequestId);if(!req||!canViewRequest(req))return myRequestsPanel();const s=serviceById(req.serviceId),st=requestStatus(req),owner=req.ownerId===state.user.id,step=currentStep(req),ownerCanEdit=owner&&req.status==='returned'&&req.returnContext?.type==='owner';return `<section><div class="request-head"><button class="back-btn" data-panel="${owner?'my-requests':pendingForUser().some(x=>x.id===req.id)?'approvals':hasPermission('view_all')?'oversight':'home'}">${tr('رجوع','Back')}</button><div><span class="eyebrow">${h(req.id)} · ${fmt(req.createdAt)}</span><h2>${h(serviceName(s))}</h2></div><span class="status ${st.cls}">${h(st.label)}</span></div>${req.status==='returned'?`<div class="return-box"><strong>${tr('أعيد للاستكمال إلى','Returned for completion to')}: ${h(holderNames(req))}</strong><span>${h(req.returnContext?.reason||'')}</span><small>${tr('النطاق','Scope')}: ${h(scopeName(req.returnContext?.scope))}</small></div>`:''}<div class="request-layout"><div class="side-stack"><div class="card"><div class="card-head"><div><h3>${tr('النموذج المرتبط بالمعاملة','Form Linked to Request')}</h3><span>${tr('نفس النموذج يتحدث مع كل اعتماد','The same request record is updated through approvals')}</span></div><button class="outline print-form">${tr('طباعة / PDF','Print / PDF')}</button></div>${formPreview(s,req.formData,req)}</div><div class="card"><h3>${tr('سجل المعاملة غير القابل للحذف','Immutable Request Timeline')}</h3><div class="timeline">${[...req.timeline].reverse().map(t=>`<div class="timeline-item ${h(t.type)}"><i></i><div><strong>${h(t.action)}</strong><small>${h(t.actorName)} · ${fmt(t.at)}</small></div></div>`).join('')}</div></div></div><aside class="side-stack"><div class="card"><div class="card-head"><div><h3>${tr('المسار الفعلي','Actual Workflow')}</h3><span>${req.routeSource==='MANUAL'?tr('تم تعديله يدويا','Manually adjusted'):tr('من القالب التلقائي','From automatic template')}</span></div>${canOverrideRoute(req)&&!['completed','rejected'].includes(req.status)?`<button class="outline route-editor" data-id="${req.id}">${tr('تعديل المسار','Edit Workflow')}</button>`:''}</div><div class="workflow-vertical">${req.route.map((r,i)=>stepView(req,r,i)).join('')}</div></div>${ownerCanEdit?`<button class="primary full edit-returned" data-id="${req.id}">${tr('استكمال وتعديل الطلب','Complete and Edit Request')}</button>`:''}${canAct(req)?`<div class="card action-card"><h3>${req.status==='returned'?tr('استكمال المرحلة وإعادة الاعتماد','Complete Stage and Re-approve'):tr('الإجراء المطلوب منك','Action Required')}</h3><p>${tr('المرحلة','Stage')}: ${h(stepLabel(step))}</p><button class="primary full approve-btn" data-id="${req.id}">${req.status==='returned'?tr('استكمال وإعادة اعتماد','Complete and Re-approve'):tr('اعتماد إلكتروني','Electronic Approval')}</button><div class="split"><button class="outline return-btn" data-id="${req.id}">${tr('إعادة للاستكمال','Return for Completion')}</button><button class="danger reject-btn" data-id="${req.id}">${tr('رفض','Reject')}</button></div></div>`:''}<div class="card current-holder"><span>${tr('المسؤول الحالي','Current Responsible')}</span><strong>${h(holderNames(req))}</strong><small>${tr('لا يتم إخطار المراحل التالية قبل انتهاء هذه المرحلة.','Future stages are not notified until the current stage is completed.')}</small></div></aside></div></section>`}
function stepView(req,r,i){const approved=validApprovals(r),isCurrent=(req.status==='pending'&&i===req.activeStepIndex)||(req.status==='returned'&&req.returnContext?.type==='step'&&i===req.activeStepIndex),invalid=r.approvals.filter(a=>!a.valid).length;return `<div class="wf-step ${r.state==='approved'?'done':''} ${isCurrent?'current':''}"><b>${r.state==='approved'?'✓':i+1}</b><div><strong>${h(stepLabel(r))}</strong><span>${h(assigneeDisplay(r)||tr('غير معين','Not assigned'))}</span>${approved.length?`<small>${tr('اعتماد صالح','Valid approval')}: ${approved.map(a=>h(userName(userById(a.userId))||a.userId)).join('، ')}</small>`:''}${invalid?`<small class="invalidated">${invalid} ${tr('اعتماد سابق أبطل بسبب الرجوع','previous approval(s) invalidated by return')}</small>`:''}</div></div>`}
function oversightPanel(){const visible=state.requests.filter(canViewRequest);return `<section><div class="section-head"><div><h2>${tr('الرقابة على الطلبات','Request Oversight')}</h2><p>${tr('عرض شامل حسب الصلاحية بدون القفز على ترتيب الاعتماد.','Comprehensive view according to permission without bypassing approval order.')}</p></div></div><div class="stats-row"><div><strong>${visible.length}</strong><span>${tr('إجمالي','Total')}</span></div><div><strong>${visible.filter(r=>r.status==='pending').length}</strong><span>${tr('قيد المعالجة','In Progress')}</span></div><div><strong>${visible.filter(r=>r.status==='returned').length}</strong><span>${tr('معاد للاستكمال','Returned')}</span></div><div><strong>${visible.filter(r=>r.status==='completed').length}</strong><span>${tr('مكتمل','Completed')}</span></div></div><div class="card">${visible.map(requestRow).join('')||`<div class="empty">${tr('لا توجد طلبات','No requests')}</div>`}</div></section>`}
function organizationPanel(){const canManage=hasPermission('org_manage');return `<section><div class="section-head"><div><h2>${tr('الهيكل الإداري والتفويض','Organization & Delegation')}</h2><p>${tr('مدير رئيسي لكل قسم مع بديل مؤقت عند الحاجة.','A primary manager for each department with temporary delegation when needed.')}</p></div>${hasPermission('delegation_manage')?`<button class="primary" id="addDelegation">${tr('إنشاء تفويض','Create Delegation')}</button>`:''}</div><div class="org-grid">${departments.filter(d=>d.id!=='system').map(d=>`<article class="card org-card"><div class="org-head"><div><span class="tag">${h(d.id)}</span><h3>${h(deptName(d.id))}</h3></div>${canManage?`<select class="dept-manager" data-dept="${d.id}">${users.filter(u=>u.departmentId===d.id||u.role==='executive').map(u=>`<option value="${u.id}" ${u.id===managerIdForDepartment(d.id)?'selected':''}>${h(userName(u))}</option>`).join('')}</select>`:`<strong>${h(userName(userById(managerIdForDepartment(d.id))))}</strong>`}</div><div class="member-list">${membersOfDepartment(d.id).map(u=>`<div><span class="avatar mini">${h(userName(u).slice(0,1))}</span><div><strong>${h(userName(u))}</strong><small>${h(userTitle(u))}${u.id===managerIdForDepartment(d.id)?` · ${tr('المدير الرئيسي','Primary Manager')}`:''}</small></div></div>`).join('')||`<span class="muted">${tr('لا توجد بيانات موظفين مضافة','No employees added')}</span>`}</div></article>`).join('')}</div><div class="card delegation-card"><div class="card-head"><div><h3>${tr('التفويضات والبدلاء','Delegations & Acting Managers')}</h3><span>${tr('يتحول المسار للبديل فقط أثناء سريان التفويض ونطاقه.','The workflow moves to the delegate only while the delegation and scope are active.')}</span></div></div><div class="table-wrap"><table><thead><tr><th>${tr('المدير الأصلي','Principal')}</th><th>${tr('البديل','Delegate')}</th><th>${tr('الفترة','Period')}</th><th>${tr('النطاق','Scope')}</th><th>${tr('الحالة','Status')}</th><th></th></tr></thead><tbody>${state.delegations.map(d=>`<tr><td>${h(userName(userById(d.principalId))||d.principalId)}</td><td>${h(userName(userById(d.delegateId))||d.delegateId)}</td><td>${h(d.startDate)} → ${h(d.endDate)}</td><td>${d.scope==='ALL'?tr('كل الخدمات','All Services'):h(serviceName(serviceById(d.scope))||d.scope)}</td><td>${(d.active!==false&&d.startDate<=today()&&d.endDate>=today())?`<span class="status done">${tr('ساري','Active')}</span>`:`<span class="status pending">${tr('غير ساري حاليا','Inactive')}</span>`}</td><td>${hasPermission('delegation_manage')?`<button class="danger-link delete-delegation" data-id="${d.id}">${tr('حذف','Delete')}</button>`:''}</td></tr>`).join('')||`<tr><td colspan="6" class="empty">${tr('لا توجد تفويضات','No delegations')}</td></tr>`}</tbody></table></div></div></section>`}
function workflowAdminPanel(){return `<section><div class="section-head"><div><h2>${tr('إدارة المسارات التلقائية','Automatic Workflow Management')}</h2><p>${tr('القوالب تحدد المسؤول التالي ويمكن تعديل طلب منفرد دون تغيير القالب العام.','Templates define the next responsible approver; an individual request can be adjusted without changing the global template.')}</p></div></div><div class="workflow-admin-grid">${services.map(s=>`<article class="card"><div class="card-head"><div><span class="tag">${h(s.code)}</span><h3>${h(serviceName(s))}</h3></div><button class="outline edit-template" data-service="${s.id}">${tr('تعديل القالب','Edit Template')}</button></div><div class="route-list small-route">${serviceTemplate(s.id).map((x,i)=>`<div><b>${i+1}</b><span><strong>${h(stepLabel(x))}</strong><small>${h(resolverText(x.resolver))} · ${h(x.mode||'SEQUENTIAL')}</small></span></div>`).join('')}</div>${state.workflowOverrides[s.id]?`<div class="override-note">${tr('تم تخصيص هذا القالب محليا','This template has a local override')}</div>`:''}</article>`).join('')}</div></section>`}
function knowledgePanel(){return `<section><div class="section-head"><div><h2>${tr('مركز المعرفة','Knowledge Center')}</h2><p>${tr('الوثائق والمصادر المرتبطة بالخدمات مع دعم Word وPDF وExcel عند تسجيلها وربطها.','Documents and sources linked to services, supporting Word, PDF and Excel when registered and mapped.')}</p></div></div><div class="knowledge-grid">${knowledge.map(k=>`<article class="card knowledge"><span class="tag">${h(localized(k,'type',''))}</span><h3>${h(localized(k,'title',''))}</h3><p>${h(deptName(k.departmentId))}</p><small>${h(isEn()?(k.versionEn||k.version):k.version)} · ${h(k.status)}</small></article>`).join('')}</div></section>`}
function openApprovalModal(reqId){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canAct(req))return;const step=currentStep(req),service=serviceById(req.serviceId);
  const stageFields=(step?.stageFields||[]).map(f=>`<label class="field ${f.type==='textarea'?'wide':''}"><span>${h(fieldLabel(f))}</span>${fieldControl({...f,required:false},'',{},service,state.user)}</label>`).join('');
  modal(`<div class="modal-head"><div><span class="eyebrow">${req.status==='returned'?tr('استكمال وإعادة اعتماد','Complete and Re-approve'):tr('اعتماد إلكتروني','Electronic Approval')}</span><h3>${h(stepLabel(step))}</h3></div><button class="modal-x">×</button></div>${stageFields?`<div class="modal-grid" id="stageFields">${stageFields}</div>`:''}<label class="field"><span>${tr('ملاحظة الاعتماد - اختيارية','Approval Note - Optional')}</span><textarea id="approvalNote" placeholder="${tr('مثال: تمت المراجعة ولا توجد ملاحظات','Example: Reviewed with no comments')}"></textarea></label><label class="ack"><input type="checkbox" id="approvalAck"><span>${tr('أقر أن هذا الاعتماد صادر من حسابي وسيتم تسجيل اسمي ومسمّاي وتاريخ الاعتماد على المعاملة والنموذج.','I confirm that this approval is issued from my account and my name, title and approval time will be recorded on the request and form.')}</span></label><div class="modal-actions"><button class="outline modal-cancel">${tr('إلغاء','Cancel')}</button><button class="primary" id="confirmApproval">${tr('تأكيد الاعتماد','Confirm Approval')}</button></div>`);
  document.querySelector('#confirmApproval').onclick=()=>{if(!document.querySelector('#approvalAck').checked){toast(tr('أكد الإقرار الإلكتروني أولا','Confirm the electronic declaration first'),'error');return}const stageData={};(step?.stageFields||[]).forEach(f=>{stageData[f.id]=document.querySelector(`#stageFields [name="${f.id}"]`)?.value?.trim?.()||''});const note=document.querySelector('#approvalNote').value.trim();closeModal();approveRequest(reqId,note,stageData)};bindModalClose();
}
function openReturnModal(reqId){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canAct(req))return;const targets=returnTargets(req);
  modal(`<div class="modal-head"><div><span class="eyebrow">${tr('إعادة للاستكمال','Return for Completion')}</span><h3>${tr('اختر إلى من يرجع الطلب','Choose the previous party to receive the request')}</h3></div><button class="modal-x">×</button></div><label class="field"><span>${tr('الطرف السابق','Previous Party')}</span><select id="returnTarget">${targets.map(t=>`<option value="${t.value}">${h(t.label)}</option>`).join('')}</select></label><label class="field"><span>${tr('نوع الاستكمال','Completion Type')}</span><select id="returnScope"><option value="data">${tr('تعديل البيانات','Update Data')}</option><option value="attachments">${tr('استكمال المرفقات','Complete Attachments')}</option><option value="stage_note">${tr('استكمال ملاحظة المرحلة','Complete Stage Note')}</option><option value="other">${tr('أخرى','Other')}</option></select></label><label class="field"><span>${tr('سبب الإعادة','Return Reason')} *</span><textarea id="returnReason" placeholder="${tr('حدد المطلوب بوضوح','State clearly what needs to be completed')}"></textarea></label><div class="modal-note">${tr('أي اعتماد من نقطة الرجوع وما بعدها يصبح اعتمادا سابقا غير صالح ويجب إعادة اعتماده. السجل القديم لا يحذف.','Any approval from the return point onward becomes a previous invalidated approval and must be approved again. The old audit record is never deleted.')}</div><div class="modal-actions"><button class="outline modal-cancel">${tr('إلغاء','Cancel')}</button><button class="primary" id="confirmReturn">${tr('إعادة للطرف المحدد','Return to Selected Party')}</button></div>`);
  document.querySelector('#confirmReturn').onclick=()=>{const reason=document.querySelector('#returnReason').value.trim();if(!reason){toast(tr('سبب الإعادة مطلوب','Return reason is required'),'error');return}returnRequest(reqId,document.querySelector('#returnTarget').value,reason,document.querySelector('#returnScope').value)};bindModalClose();
}
function openRejectModal(reqId){
  modal(`<div class="modal-head"><div><span class="eyebrow">${tr('رفض الطلب','Reject Request')}</span><h3>${tr('الرفض يغلق المعاملة','Rejection closes the request')}</h3></div><button class="modal-x">×</button></div><label class="field"><span>${tr('سبب الرفض','Rejection Reason')} *</span><textarea id="rejectReason" placeholder="${tr('اكتب السبب الذي سيظهر للموظف','Enter the reason that will be shown to the employee')}"></textarea></label><div class="modal-actions"><button class="outline modal-cancel">${tr('إلغاء','Cancel')}</button><button class="danger" id="confirmReject">${tr('تأكيد الرفض','Confirm Rejection')}</button></div>`);
  document.querySelector('#confirmReject').onclick=()=>{const r=document.querySelector('#rejectReason').value.trim();if(!r){toast(tr('سبب الرفض مطلوب','Rejection reason is required'),'error');return}rejectRequest(reqId,r)};bindModalClose();
}
function openDelegationModal(){
  const managers=users.filter(u=>['manager','executive'].includes(u.role));modal(`<div class="modal-head"><div><span class="eyebrow">${tr('تفويض مؤقت','Temporary Delegation')}</span><h3>${tr('تعيين بديل أثناء الغياب','Assign an acting approver during absence')}</h3></div><button class="modal-x">×</button></div><div class="modal-grid"><label class="field"><span>${tr('المدير الأصلي','Principal Manager')}</span><select id="delPrincipal">${managers.map(u=>`<option value="${u.id}">${h(userName(u))}</option>`).join('')}</select></label><label class="field"><span>${tr('البديل','Delegate')}</span><select id="delDelegate">${users.filter(u=>u.role!=='system_admin').map(u=>`<option value="${u.id}">${h(userName(u))} - ${h(userTitle(u))}</option>`).join('')}</select></label><label class="field"><span>${tr('من تاريخ','From Date')}</span><input id="delStart" type="date" value="${today()}"></label><label class="field"><span>${tr('إلى تاريخ','To Date')}</span><input id="delEnd" type="date" value="${today()}"></label><label class="field wide"><span>${tr('النطاق','Scope')}</span><select id="delScope"><option value="ALL">${tr('كل الخدمات','All Services')}</option>${services.map(s=>`<option value="${s.id}">${h(serviceName(s))}</option>`).join('')}</select></label></div><div class="modal-actions"><button class="outline modal-cancel">${tr('إلغاء','Cancel')}</button><button class="primary" id="saveDelegation">${tr('حفظ التفويض','Save Delegation')}</button></div>`);
  document.querySelector('#saveDelegation').onclick=()=>{const p=document.querySelector('#delPrincipal').value,d=document.querySelector('#delDelegate').value,s=document.querySelector('#delStart').value,e=document.querySelector('#delEnd').value;if(p===d||!s||!e||s>e){toast(tr('راجع بيانات التفويض','Review the delegation details'),'error');return}addDelegation({principalId:p,delegateId:d,startDate:s,endDate:e,scope:document.querySelector('#delScope').value})};bindModalClose();
}
function openTemplateEditor(serviceId){
  const steps=serviceTemplate(serviceId);const s=serviceById(serviceId);
  modal(`<div class="modal-head"><div><span class="eyebrow">${tr('قالب المسار التلقائي','Automatic Workflow Template')}</span><h3>${h(s.name)}</h3></div><button class="modal-x">×</button></div><div id="templateRows" class="editor-rows">${steps.map(step=>templateRow(step)).join('')}</div><button class="outline" id="addTemplateRow">${tr('+ إضافة مرحلة','+ Add Stage')}</button><div class="modal-actions"><button class="ghost" id="resetTemplate">${tr('إعادة الافتراضي','Reset Default')}</button><button class="outline modal-cancel">${tr('إلغاء','Cancel')}</button><button class="primary" id="saveTemplate">${tr('حفظ المسار','Save Workflow')}</button></div>`);
  document.querySelector('#addTemplateRow').onclick=()=>document.querySelector('#templateRows').insertAdjacentHTML('beforeend',templateRow({id:uid('S'),label:tr('مرحلة جديدة','New Stage'),resolver:{type:'DIRECT_MANAGER'},mode:'SEQUENTIAL'}));
  document.querySelector('#templateRows').onclick=e=>{if(e.target.matches('.remove-row'))e.target.closest('.template-row').remove()};
  document.querySelector('#saveTemplate').onclick=()=>saveWorkflowTemplate(serviceId);document.querySelector('#resetTemplate').onclick=()=>resetWorkflowTemplate(serviceId);bindModalClose();
}
function templateRow(step){return `<div class="template-row" data-id="${h(step.id)}"><input class="tpl-label" value="${h(step.label)}"><select class="tpl-resolver">${workflowPresetOptions(resolverPreset(step.resolver))}</select><select class="tpl-mode"><option ${step.mode==='SEQUENTIAL'?'selected':''}>SEQUENTIAL</option><option ${step.mode==='ANY'?'selected':''}>ANY</option><option ${step.mode==='ALL'?'selected':''}>ALL</option></select><button class="remove-row" type="button">×</button></div>`}
function openRouteEditor(reqId){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canOverrideRoute(req))return;const future=req.route.slice(req.activeStepIndex);
  modal(`<div class="modal-head"><div><span class="eyebrow">${tr('تعديل مسار طلب محدد','Edit Workflow for This Request')}</span><h3>${h(req.id)}</h3></div><button class="modal-x">×</button></div><div class="modal-note">${tr('المراحل المنتهية لا تتغير. يمكنك تعديل المسؤول الحالي والمراحل المستقبلية فقط. سيصل الإشعار للمسؤول الجديد الحالي فقط.','Completed stages do not change. You may edit the current and future stages only. Only the new current owner is notified.')}</div><div id="routeRows" class="editor-rows">${future.map(routeEditorRow).join('')}</div><button class="outline" id="addRouteRow">${tr('+ إضافة مرحلة مستقبلية','+ Add Future Stage')}</button><div class="modal-actions"><button class="outline modal-cancel">${tr('إلغاء','Cancel')}</button><button class="primary" id="saveRoute">${tr('حفظ المسار اليدوي','Save Manual Workflow')}</button></div>`);
  document.querySelector('#addRouteRow').onclick=()=>document.querySelector('#routeRows').insertAdjacentHTML('beforeend',routeEditorRow({id:uid('M'),label:tr('مرحلة إضافية','Additional Stage'),assigneeIds:['GM01']}));
  document.querySelector('#routeRows').onclick=e=>{if(e.target.matches('.remove-row'))e.target.closest('.route-row').remove()};document.querySelector('#saveRoute').onclick=()=>saveManualRoute(reqId);bindModalClose();
}
function routeEditorRow(step){return `<div class="route-row" data-id="${h(step.id)}"><input class="route-label" value="${h(step.label)}"><select class="route-user">${users.filter(u=>u.role!=='system_admin').map(u=>`<option value="${u.id}" ${step.assigneeIds?.includes(u.id)?'selected':''}>${h(u.name)} - ${h(u.title)}</option>`).join('')}</select><button class="remove-row" type="button">×</button></div>`}

function modal(content){closeModal();document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal">${content}</div></div>`)}
function closeModal(){document.querySelector('#modal')?.remove()}
function bindModalClose(){document.querySelector('.modal-x')?.addEventListener('click',closeModal);document.querySelector('.modal-cancel')?.addEventListener('click',closeModal);document.querySelector('#modal')?.addEventListener('click',e=>{if(e.target.id==='modal')closeModal()})}
function toast(message,type='success'){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),2800)}

function bind(){
  document.querySelectorAll('[data-panel]').forEach(x=>x.onclick=()=>navigate(x.dataset.panel));
  document.querySelectorAll('.open-service').forEach(x=>x.onclick=()=>openService(x.dataset.service));
  document.querySelectorAll('.start-service').forEach(x=>x.onclick=()=>{let prefill={};try{prefill=x.dataset.prefill?JSON.parse(decodeURIComponent(x.dataset.prefill)):{};}catch{}startService(x.dataset.service,prefill)});
  document.querySelectorAll('[data-request]').forEach(x=>x.onclick=()=>openRequest(x.dataset.request));
  document.querySelector('#logoutBtn')?.addEventListener('click',logout);document.querySelector('#langSwitch')?.addEventListener('click',()=>setLanguage(isEn()?'ar':'en'));document.querySelectorAll('.lang-toggle').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.lang)));
  document.querySelector('#askBtn')?.addEventListener('click',()=>submitAI());
  document.querySelectorAll('.ai-chip').forEach(x=>x.onclick=()=>submitAI(x.textContent));
  document.querySelector('#chatSend')?.addEventListener('click',()=>submitAI(document.querySelector('#chatInput').value));
  document.querySelector('#chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitAI(e.target.value)}});
  document.querySelector('#serviceSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelector('#serviceGrid').innerHTML=services.filter(s=>s.active&&serviceSearchText(s).includes(normalizeArabic(q))).map(serviceCard).join('')||`<div class="empty">${tr('لا توجد نتائج','No results')}</div>`;bind()});
  const currentService=serviceById(state.activeServiceId);
  const driverIds=new Set();
  (currentService?.fields||[]).forEach(f=>{if(f.dynamicOptions)driverIds.add(f.id);
    [f.showWhen,f.requiredWhen,...(f.showWhenAny||[]),...(f.requiredWhenAny||[])].filter(Boolean).forEach(c=>driverIds.add(c.field));
  });
  (currentService?.attachments||[]).map(attachmentMeta).forEach(a=>[a.showWhen,a.requiredWhen].filter(Boolean).forEach(c=>driverIds.add(c.field)));
  driverIds.forEach(id=>document.querySelector(`#requestForm [name="${id}"]`)?.addEventListener('change',()=>{syncDraftFromForm();render()}));
  document.querySelector('#reviewBtn')?.addEventListener('click',collectDraft);
  document.querySelector('#backToForm')?.addEventListener('click',()=>{state.wizardStep=1;render()});
  document.querySelector('#backToForm2')?.addEventListener('click',()=>{state.wizardStep=1;render()});
  document.querySelector('#submitBtn')?.addEventListener('click',submitRequest);
  document.querySelectorAll('.edit-returned').forEach(x=>x.onclick=()=>editReturned(x.dataset.id));
  document.querySelectorAll('.approve-btn').forEach(x=>x.onclick=()=>openApprovalModal(x.dataset.id));
  document.querySelectorAll('.return-btn').forEach(x=>x.onclick=()=>openReturnModal(x.dataset.id));
  document.querySelectorAll('.reject-btn').forEach(x=>x.onclick=()=>openRejectModal(x.dataset.id));
  document.querySelectorAll('[data-notification]').forEach(x=>x.onclick=()=>markNotification(x.dataset.notification));
  document.querySelector('#markAll')?.addEventListener('click',markAllNotifications);
  document.querySelectorAll('.dept-manager').forEach(x=>x.onchange=()=>saveDeptManager(x.dataset.dept,x.value));
  document.querySelector('#addDelegation')?.addEventListener('click',openDelegationModal);
  document.querySelectorAll('.delete-delegation').forEach(x=>x.onclick=()=>deleteDelegation(x.dataset.id));
  document.querySelectorAll('.edit-template').forEach(x=>x.onclick=()=>openTemplateEditor(x.dataset.service));
  document.querySelectorAll('.route-editor').forEach(x=>x.onclick=()=>openRouteEditor(x.dataset.id));
  document.querySelectorAll('.print-form').forEach(x=>x.onclick=()=>window.print());
}

function render(){
  applyLocale();if(!state.user)return loginView();
  const panels={home:homePanel,assistant:assistantPanel,services:servicesPanel,service:servicePanel,'new-request':newRequestPanel,'my-requests':myRequestsPanel,approvals:approvalsPanel,notifications:notificationsPanel,request:requestPanel,organization:organizationPanel,oversight:oversightPanel,'workflow-admin':workflowAdminPanel,knowledge:knowledgePanel};
  const fn=panels[state.panel]||homePanel;app.innerHTML=`<div class="shell">${sidebar()}<main class="main">${topbar()}${fn()}</main></div>`;bind();
}

render();
