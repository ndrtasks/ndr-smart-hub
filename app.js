import { users, departments, defaultDelegations, services, knowledge, initialDemoRequests } from './data.js';

const KEYS = {
  user:'ndr_p3_user', requests:'ndr_p3_requests_v1', notifications:'ndr_p3_notifications_v1',
  delegations:'ndr_p3_delegations_v1', org:'ndr_p3_org_v1', templates:'ndr_p3_workflows_v1'
};

const clone = value => JSON.parse(JSON.stringify(value));
const app = document.querySelector('#app');

const state = {
  user: load(KEYS.user, null),
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
  messages: [{role:'ai', text:'أهلا بك. اشرح لي ما تريد إنجازه وسأحدد لك الخدمة والمسار المناسب من الخدمات المعرفة حاليا.'}]
};

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
function fmt(iso){try{return new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch{return iso}}
function userById(id){return users.find(u=>u.id===id)}
function serviceById(id){return services.find(s=>s.id===id)}
function deptById(id){return departments.find(d=>d.id===id)}
function deptName(id){return deptById(id)?.name || id}
function roleName(role){return ({employee:'موظف',specialist:'مختص',manager:'مدير قسم',executive:'مدير عام',system_admin:'مدير النظام'})[role]||role}
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
  if(!resolver)return '-';
  if(resolver.type==='DIRECT_MANAGER')return 'المدير المباشر';
  if(resolver.type==='GENERAL_MANAGER')return 'المدير العام';
  if(resolver.type==='NAMED_USER')return userById(resolver.userId)?.name||'مستخدم محدد';
  if(resolver.type==='DEPARTMENT_MANAGER_FIXED')return `مدير ${deptName(resolver.departmentId)}`;
  if(resolver.type==='ROLE_IN_DEPARTMENT')return `${roleName(resolver.role)} - ${deptName(resolver.departmentId)}`;
  if(resolver.type==='MANUAL')return 'مسار يدوي';
  return resolver.type;
}
function resolveStep(step, owner, serviceId){
  const r=step.resolver||{}; let assignments=[];
  const addPrincipal=id=>{if(id)assignments.push(effectiveAssignment(id,serviceId))};
  if(r.type==='DIRECT_MANAGER' && owner.managerId) addPrincipal(owner.managerId);
  if(r.type==='GENERAL_MANAGER') addPrincipal('GM01');
  if(r.type==='DEPARTMENT_MANAGER_FIXED') addPrincipal(managerIdForDepartment(r.departmentId));
  if(r.type==='NAMED_USER'){
    let id=r.userId;
    if(r.excludeOwner && id===owner.id){
      id=users.find(u=>u.departmentId===r.departmentId && u.role===r.fallbackRole && u.id!==owner.id)?.id || managerIdForDepartment(r.departmentId);
    }
    addPrincipal(id);
  }
  if(r.type==='ROLE_IN_DEPARTMENT'){
    users.filter(u=>u.departmentId===r.departmentId && u.role===r.role && (!r.excludeOwner||u.id!==owner.id)).forEach(u=>addPrincipal(u.id));
  }
  const seen=new Set(); assignments=assignments.filter(a=>a.userId&&!seen.has(a.userId)&&(seen.add(a.userId),true));
  return assignments;
}
function instantiateRoute(service, owner){
  return serviceTemplate(service.id).map((s,i)=>{
    const assignments=resolveStep(s,owner,service.id);
    return {
      id:s.id||`step-${i+1}`, label:s.label||`المرحلة ${i+1}`, resolverSnapshot:clone(s.resolver||{}), stageFields:clone(s.stageFields||[]),
      mode:s.mode||'SEQUENTIAL', assignments, assigneeIds:assignments.map(a=>a.userId), state:'waiting', approvals:[]
    };
  });
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
    context==='reapproval'?'طلب أعيد لمسارك ويحتاج إعادة اعتماد':`طلب يحتاج ${step.label}`,
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
    addTimeline(req,'SYSTEM','أغلق النظام الطلب كمكتمل','completed');
    createNotification(req.ownerId,req.id,'COMPLETED','تم اعتماد طلبك نهائيا',`${req.serviceName} - ${req.id}`);
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
    const actual=userById(a.userId)?.name||a.userId;
    if(a.delegationId&&a.principalId!==a.userId)return `${actual} (نيابة عن ${userById(a.principalId)?.name||a.principalId})`;
    return actual;
  }).join('، ');
}
function requestStatus(req){
  if(req.status==='completed')return {label:'مكتمل',cls:'done'};
  if(req.status==='rejected')return {label:'مرفوض',cls:'rejected'};
  if(req.status==='returned')return {label:'معاد للاستكمال',cls:'returned'};
  const s=currentStep(req); return {label:s?`بانتظار ${s.label}`:'قيد المعالجة',cls:'pending'};
}
function requestProgress(req){
  if(req.status==='completed')return 100;
  const validDone=req.route.filter(s=>s.state==='approved').length;
  return Math.max(8,Math.round((validDone/Math.max(req.route.length,1))*100));
}
function holderNames(req){
  if(req.status==='returned')return req.returnContext?.type==='owner'?userById(req.ownerId)?.name:(userById(req.returnContext?.userId)?.name||'-');
  const s=currentStep(req); return assigneeDisplay(s);
}

function setUser(id){
  state.user=userById(id); save(KEYS.user,state.user); state.panel='home'; state.activeRequestId=null; render();
}
function logout(){localStorage.removeItem(KEYS.user);state.user=null;render()}
function navigate(panel){state.panel=panel;state.activeServiceId=null;state.activeRequestId=null;state.editRequestId=null;render()}
function openService(id){state.activeServiceId=id;state.panel='service';render()}
function openRequest(id){const r=state.requests.find(x=>x.id===id);if(r&&canViewRequest(r)){state.activeRequestId=id;state.panel='request';render()}}
function startService(id){state.activeServiceId=id;state.draft={};state.editRequestId=null;state.wizardStep=1;state.panel='new-request';render()}

function normalizeArabic(value=''){
  return String(value).toLowerCase()
    .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^a-z0-9؀-ۿ\s-]/g,' ')
    .replace(/\s+/g,' ').trim();
}
function serviceSearchText(service){
  return normalizeArabic([
    service.name, service.code, service.procedure, service.description,
    ...(service.aliases||[]), service.form?.templateName, service.form?.sourceFormat
  ].filter(Boolean).join(' '));
}
function localAI(text){
  const q=normalizeArabic(text); if(!q)return {text:'اكتب طلبك أو اسم النموذج.'};
  const words=q.split(' ').filter(w=>w.length>1);
  const ranked=services.filter(s=>s.active).map(service=>{
    const hay=serviceSearchText(service); let score=0;
    (service.aliases||[]).forEach(alias=>{const a=normalizeArabic(alias);if(a&&q.includes(a))score+=12});
    if(q.includes(normalizeArabic(service.name)))score+=15;
    if(q.includes(normalizeArabic(service.code)))score+=20;
    words.forEach(w=>{if(hay.includes(w))score+=1});
    return {service,score};
  }).sort((a,b)=>b.score-a.score);
  const best=ranked[0];
  if(!best||best.score<2)return {text:'لم أجد خدمة مؤكدة من سجل الخدمات والنماذج المعرف حاليا. ابحث يدويا أو اطلب من الموارد البشرية تسجيل النموذج الجديد في مركز النماذج.'};
  const service=best.service;
  return {text:`تعرفت على طلبك كخدمة: ${service.name} (${service.code}). النموذج ${service.form?.sourceFormat||'المعتمد'} مرتبط بالخدمة، وسأطلب فقط البيانات الخاصة بجزء الموظف ثم ينتقل كل جزء لمسؤوله.`,service};
}
function submitAI(value){const text=value??document.querySelector('#aiInput')?.value;if(!text?.trim())return;state.messages.push({role:'user',text:text.trim()});const r=localAI(text);state.messages.push({role:'ai',text:r.text,service:r.service});state.panel='assistant';render()}

function fieldControl(f,value=''){
  const v=h(value),req=f.required?'required':'';
  if(f.type==='select')return `<select name="${f.id}" ${req}><option value="">اختر</option>${f.options.map(o=>`<option value="${h(o)}" ${o===value?'selected':''}>${h(o)}</option>`).join('')}</select>`;
  if(f.type==='textarea')return `<textarea name="${f.id}" ${req} placeholder="${h(f.placeholder||'')}">${v}</textarea>`;
  return `<div class="input-wrap"><input type="${f.type}" name="${f.id}" value="${v}" ${req} placeholder="${h(f.placeholder||'')}"/>${f.suffix?`<span>${h(f.suffix)}</span>`:''}</div>`;
}
function collectDraft(){
  const service=serviceById(state.activeServiceId); const form=document.querySelector('#requestForm'); if(!service||!form)return;
  const data={}; let ok=true;
  service.fields.forEach(f=>{const el=form.elements[f.id];const v=el?.value?.trim?.()??'';if(f.required&&!v){el.classList.add('invalid');ok=false}else el?.classList.remove('invalid');data[f.id]=v});
  const attachments={}; (service.attachments||[]).forEach(label=>{const el=form.querySelector(`[data-attachment="${CSS.escape(label)}"]`);const existing=state.draft.attachments?.[label]||'';const name=el?.files?.[0]?.name||existing;if(!name){el?.classList.add('invalid');ok=false}else el?.classList.remove('invalid');attachments[label]=name});
  if(!ok){toast('أكمل الحقول والمرفقات المطلوبة','error');return}
  state.draft={...data,attachments};state.wizardStep=2;render();
}
function editReturned(id){
  const req=state.requests.find(r=>r.id===id); if(!req||req.ownerId!==state.user.id||req.returnContext?.type!=='owner')return;
  state.activeServiceId=req.serviceId;state.editRequestId=id;state.draft=clone(req.formData);state.wizardStep=1;state.panel='new-request';render();
}
function submitRequest(){
  const ack=document.querySelector('#employeeAck'); if(!ack?.checked){toast('يجب تأكيد الإقرار قبل الإرسال','error');return}
  const service=serviceById(state.activeServiceId); if(!service)return;
  if(state.editRequestId){
    const req=state.requests.find(r=>r.id===state.editRequestId); if(!req)return;
    req.formData=clone(state.draft);req.requesterSignatures.push(requesterSignature(req,'إعادة إرسال بعد الاستكمال'));
    addTimeline(req,state.user.id,'استكمل البيانات وأعاد إرسال الطلب','resubmitted');
    req.route.forEach(s=>{if(s.state!=='approved'){s.state='waiting'}});req.returnContext=null;activateStep(req,0,'reapproval');
    state.activeRequestId=req.id;state.panel='request';state.editRequestId=null;persist();toast('تمت إعادة إرسال الطلب','success');render();return;
  }
  const owner=state.user; const req={
    id:`REQ-${Date.now().toString().slice(-7)}`,ownerId:owner.id,serviceId:service.id,serviceName:service.name,createdAt:now(),status:'pending',activeStepIndex:0,
    formData:clone(state.draft),route:instantiateRoute(service,owner),timeline:[],requesterSignatures:[],returnContext:null,rejectedReason:'',routeSource:'AUTO',formTemplate:clone(service.form)
  };
  req.requesterSignatures.push(requesterSignature(req));addTimeline(req,owner.id,'أنشأ الطلب ووافق إلكترونيا على الإقرار','created');
  state.requests.unshift(req);activateStep(req,0,'new');persist();state.activeRequestId=req.id;state.panel='request';state.draft={};state.wizardStep=1;toast('تم إنشاء الطلب وإرساله للمرحلة الأولى','success');render();
}

function approveRequest(reqId,note='',stageData={}){
  const req=state.requests.find(r=>r.id===reqId); if(!req||!canAct(req))return;
  const step=currentStep(req); const wasReturned=req.status==='returned';
  resolveNotifications(req.id,state.user.id,step.id);
  step.approvals.push({id:uid('A'),userId:state.user.id,note,stageData:clone(stageData),at:now(),valid:true,signature:approvalSignature(req,wasReturned?'استكمال وإعادة اعتماد':'اعتماد',note)});
  addTimeline(req,state.user.id,`${wasReturned?'استكمل وأعاد اعتماد':'اعتمد'} مرحلة ${step.label}${note?` - ملاحظة: ${note}`:''}`,wasReturned?'reapproved':'approved');
  if(wasReturned){req.status='pending';req.returnContext=null}
  if(stepComplete(step)){
    step.state='approved';resolveNotifications(req.id,null,step.id);activateStep(req,req.activeStepIndex+1,wasReturned?'reapproval':'new');
  } else {
    step.state='active';req.status='pending';notifyActive(req,'reapproval');
  }
  persist();toast('تم حفظ الاعتماد الإلكتروني','success');render();
}
function rejectRequest(reqId,reason){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canAct(req)||!reason.trim())return;
  const step=currentStep(req);resolveNotifications(req.id,null,step.id);req.status='rejected';req.rejectedReason=reason.trim();req.rejectedAt=now();
  addTimeline(req,state.user.id,`رفض الطلب في مرحلة ${step.label}: ${reason.trim()}`,'rejected');
  createNotification(req.ownerId,req.id,'REJECTED','تم رفض طلبك',`${req.serviceName} - السبب: ${reason.trim()}`);persist();closeModal();toast('تم رفض الطلب','success');render();
}
function returnTargets(req){
  const ownerTarget={value:'owner',label:`${userById(req.ownerId)?.name} - مقدم الطلب`,type:'owner',index:-1,userId:req.ownerId};
  // مدير القسم لا يغير المسار ولا يعيد إلا للموظف صاحب الطلب.
  if(!isHRWorkflowController() && !hasPermission('workflow_override_all'))return [ownerTarget];
  const out=[ownerTarget];
  for(let i=0;i<req.activeStepIndex;i++){
    const s=req.route[i]; const actors=[...new Set(validApprovals(s).map(a=>a.userId).concat(s.assigneeIds))];
    actors.forEach(id=>out.push({value:`step:${i}:${id}`,label:`${userById(id)?.name||id} - ${s.label}`,type:'step',index:i,userId:id}));
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
  addTimeline(req,state.user.id,`أعاد الطلب للاستكمال إلى ${target.label}. السبب: ${reason.trim()}`,'returned',{scope,target});
  createNotification(target.userId,req.id,'RETURNED','أعيد لك طلب للاستكمال',`${req.serviceName} - المطلوب: ${reason.trim()}`);
  persist();closeModal();toast('تمت إعادة الطلب للطرف المحدد فقط','success');render();
}

function markNotification(id){const n=state.notifications.find(x=>x.id===id);if(n){n.read=true;save(KEYS.notifications,state.notifications);if(n.requestId)openRequest(n.requestId);else render()}}
function markAllNotifications(){userNotifications().forEach(n=>n.read=true);save(KEYS.notifications,state.notifications);render()}

function saveDeptManager(deptId,userId){state.orgOverrides[deptId]={...(state.orgOverrides[deptId]||{}),managerId:userId};save(KEYS.org,state.orgOverrides);toast('تم تحديث مدير القسم','success');render()}
function addDelegation(data){
  state.delegations.push({id:uid('DEL'),active:true,...data});save(KEYS.delegations,state.delegations);toast('تم إنشاء التفويض','success');closeModal();render();
}
function deleteDelegation(id){state.delegations=state.delegations.filter(d=>d.id!==id);save(KEYS.delegations,state.delegations);render()}

function resolverPreset(r){
  if(r.type==='DIRECT_MANAGER')return 'DIRECT_MANAGER';
  if(r.type==='GENERAL_MANAGER')return 'GENERAL_MANAGER';
  if(r.type==='NAMED_USER'&&r.excludeOwner)return `SMART_USER:${r.userId}:${r.fallbackRole||'specialist'}:${r.departmentId||'hr'}`;
  if(r.type==='NAMED_USER')return `USER:${r.userId}`;
  if(r.type==='DEPARTMENT_MANAGER_FIXED')return `DEPT_MANAGER:${r.departmentId}`;
  if(r.type==='ROLE_IN_DEPARTMENT')return `ROLE:${r.departmentId}:${r.role}`;
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
  return {type:'DIRECT_MANAGER'};
}
function workflowPresetOptions(selected=''){
  const opts=[['DIRECT_MANAGER','المدير المباشر'],['GENERAL_MANAGER','المدير العام'],['SMART_USER:E001:specialist:hr','نادر الجهني (مع بديل تلقائي إذا كان هو مقدم الطلب)'],['USER:E001','نادر الجهني'],['USER:E002','أحمد'],['USER:HRM01','مدير الموارد البشرية'],['DEPT_MANAGER:hr','مدير الموارد البشرية'],['DEPT_MANAGER:accounting','مدير المحاسبة'],['DEPT_MANAGER:training','مدير التدريب'],['ROLE:hr:specialist','أي مختص موارد بشرية - نفس المرحلة']];
  return opts.map(([v,l])=>`<option value="${v}" ${v===selected?'selected':''}>${h(l)}</option>`).join('');
}
function saveWorkflowTemplate(serviceId){
  const rows=[...document.querySelectorAll('#templateRows .template-row')];
  const defaults=serviceById(serviceId)?.workflowTemplate||[];
  const steps=rows.map((row,i)=>{
    const id=row.dataset.id||`custom-${i+1}`; const original=defaults.find(x=>x.id===id)||state.workflowOverrides[serviceId]?.find(x=>x.id===id);
    return {id,label:row.querySelector('.tpl-label').value.trim()||`مرحلة ${i+1}`,resolver:presetResolver(row.querySelector('.tpl-resolver').value),mode:row.querySelector('.tpl-mode').value,stageFields:clone(original?.stageFields||[])};
  });
  state.workflowOverrides[serviceId]=steps;save(KEYS.templates,state.workflowOverrides);closeModal();toast('تم حفظ المسار التلقائي للخدمة','success');render();
}
function resetWorkflowTemplate(serviceId){delete state.workflowOverrides[serviceId];save(KEYS.templates,state.workflowOverrides);closeModal();toast('تمت إعادة المسار الافتراضي','success');render()}

function saveManualRoute(reqId){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canOverrideRoute(req))return;
  const start=Math.max(0,req.activeStepIndex); const oldCurrent=currentStep(req); const oldAssignees=oldCurrent?.assigneeIds.join(',')||'';
  const rows=[...document.querySelectorAll('#routeRows .route-row')];
  const future=rows.map((row,i)=>{
    const id=row.dataset.id||`manual-${Date.now()}-${i}`; const old=req.route.find(x=>x.id===id);
    const assigneeId=row.querySelector('.route-user').value;
    return {id,label:row.querySelector('.route-label').value.trim()||`مرحلة ${i+1}`,resolverSnapshot:{type:'MANUAL'},stageFields:clone(old?.stageFields||[]),mode:'SEQUENTIAL',assignments:[{userId:assigneeId,principalId:assigneeId,delegationId:null}],assigneeIds:[assigneeId],state:i===0?'active':'waiting',approvals:[]};
  });
  req.route=[...req.route.slice(0,start),...future];req.routeSource='MANUAL';req.status='pending';req.returnContext=null;
  resolveNotifications(req.id,null,oldCurrent?.id);addTimeline(req,state.user.id,'عدل مسار الموافقات يدويا للطلب','route_changed');
  if(future.length){req.activeStepIndex=start;notifyActive(req,'reapproval')}else activateStep(req,start);
  persist();closeModal();toast('تم تعديل مسار الطلب وتحديث المسؤول الحالي','success');render();
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
  const fields=[
    ['joiningDate','تاريخ التعيين'],['hrNotes','ملاحظات الموارد البشرية'],['existingLoan','السلف القائمة - ريال'],['eosBenefits','حقوق نهاية الخدمة عند الاستقالة - ريال'],
    ['approvedMonths','عدد الأشهر المعتمدة'],['approvedInstallment','قيمة القسط الشهري المعتمد - ريال'],['approvedTotal','إجمالي المبلغ المعتمد - ريال'],['accountantName','تمت المراجعة بواسطة المحاسب']
  ];
  return `<div class="doc-section"><h4>حقول المراجعة الداخلية في HR-F-29</h4><div class="doc-grid">${fields.map(([id,label])=>`<div class="doc-field"><span>${h(label)}</span><strong>${h(stageDataValue(req,id)||'يعبأ في مرحلته المختصة')}</strong></div>`).join('')}</div></div>`;
}
function formPreview(service, reqData, req=null){
  const owner=req?userById(req.ownerId):state.user; const signatures=req?.requesterSignatures||[]; const latestRequester=[...signatures].reverse().find(s=>s.valid);
  const route=req?.route||instantiateRoute(service,owner);
  const fieldRows=service.fields.map(f=>`<div class="doc-field"><span>${h(f.label)}</span><strong>${h(reqData?.[f.id]||'-')}${f.suffix&&reqData?.[f.id]?` ${h(f.suffix)}`:''}</strong></div>`).join('');
  const approvals=route.map((s,i)=>{
    const a=[...(s.approvals||[])].reverse().find(x=>x.valid);
    return `<div class="approval-box"><span>${i+1}. ${h(s.label)}</span>${a?`<strong>تم الاعتماد إلكترونيا</strong><small>${h(a.signature.name)} - ${h(a.signature.title)}</small><small>${fmt(a.signature.at)}</small>${a.note?`<em>ملاحظة: ${h(a.note)}</em>`:''}`:`<strong class="muted">بانتظار الاعتماد</strong><small>${h(assigneeDisplay(s))}</small>`}</div>`;
  }).join('');
  return `<div class="document-preview">
    <div class="doc-top"><div><strong>${h(service.form.templateName)}</strong><small>نموذج داخلي مرتبط بالمعاملة</small></div><div class="doc-ref"><span>${h(service.code)}</span><span>Revision ${h(service.form.revision||'-')}</span></div></div>
    <div class="doc-section"><h4>بيانات الموظف</h4><div class="doc-grid"><div class="doc-field"><span>الاسم</span><strong>${h(owner?.name||'-')}</strong></div><div class="doc-field"><span>الرقم الوظيفي</span><strong>${h(owner?.id||'-')}</strong></div><div class="doc-field"><span>القسم</span><strong>${h(deptName(owner?.departmentId))}</strong></div><div class="doc-field"><span>المسمى</span><strong>${h(owner?.title||'-')}</strong></div>${fieldRows}</div></div>
    <div class="doc-section declaration"><h4>الإقرار</h4><p>${h(service.form.declaration||'أقر بصحة البيانات الواردة في الطلب.')}</p>${latestRequester?`<div class="e-sign"><strong>اعتماد الموظف إلكترونيا</strong><span>${h(latestRequester.name)} - ${h(latestRequester.title)}</span><span>${fmt(latestRequester.at)} · ${h(req?.id||'مسودة')}</span></div>`:'<div class="e-sign pending-sign">سيتم تسجيل اعتماد الموظف الإلكتروني عند الإرسال</div>'}</div>
    ${service.id==='housing'?housingControlledSection(req):''}
    <div class="doc-section"><h4>سجل الاعتمادات على النموذج</h4><div class="approval-grid">${approvals}</div></div>
    ${service.form.masterPath?`<div class="doc-master">الملف الأصلي Master مرتبط بالخدمة ولا يتم تعديل الأصل. <a href="${encodeURI(service.form.masterPath)}" target="_blank">فتح ملف النموذج الأصلي</a></div>`:''}
  </div>`;
}

function loginView(){
  app.innerHTML=`<div class="login-shell"><div class="login-visual"><div class="brand-mark">NDR</div><h1>Smart Hub</h1><p>خدمات، نماذج، موافقات ومعرفة داخلية في مسار واحد.</p><div class="feature-line"><strong>Sequential Workflow</strong><span>الإشعار يصل للمسؤول الحالي فقط.</span></div><div class="feature-line"><strong>Smart Return</strong><span>إعادة لأي مرحلة سابقة مع إعادة اعتماد ما يتأثر.</span></div><div class="feature-line"><strong>Electronic Approval</strong><span>اعتماد موثق بالحساب والتاريخ ورقم المعاملة.</span></div></div><div class="login-side"><div class="login-card"><div class="brand-mark small">NDR</div><h2>دخول تجريبي</h2><p>اختر دورا لتجربة المنصة. البيانات محلية داخل متصفحك.</p><label class="field"><span>المستخدم</span><select id="loginUser">${users.map(u=>`<option value="${u.id}">${h(u.name)} — ${h(u.title)}</option>`).join('')}</select></label><button class="primary full" id="loginBtn">دخول</button><div class="demo-note">مدير النظام منفصل عن المدير العام. الحسابات والأسماء المميزة بكلمة تجريبي ليست بيانات فعلية.</div></div></div></div>`;
  document.querySelector('#loginBtn').onclick=()=>setUser(document.querySelector('#loginUser').value);
}

function navButton(panel,label,badge=''){return `<button data-panel="${panel}" class="${state.panel===panel?'active':''}"><span>${label}</span>${badge?`<b>${badge}</b>`:''}</button>`}
function sidebar(){
  const approvalBadge=pendingForUser().length||''; const notif=unreadCount()||'';
  return `<aside class="sidebar"><div class="brand"><div class="brand-mark small">NDR</div><div><strong>Smart Hub</strong><small>Services & Approvals</small></div></div><div class="nav-title">مساحة العمل</div><nav>${navButton('home','الرئيسية')}${navButton('assistant','NDR AI')}${navButton('services','الخدمات')}${navButton('my-requests','طلباتي')}${navButton('notifications','الإشعارات',notif)}${['specialist','manager','executive'].includes(state.user.role)?navButton('approvals','الموافقات',approvalBadge):''}${['manager','executive','system_admin'].includes(state.user.role)?navButton('organization','الهيكل والتفويض'):''}${hasPermission('view_all')?navButton('oversight','الرقابة على الطلبات'):''}${hasPermission('workflow_design')?navButton('workflow-admin','إدارة المسارات'):''}${navButton('knowledge','مركز المعرفة')}</nav><div class="sidebar-foot"><div class="user-card"><span class="avatar">${h(state.user.name.slice(0,1))}</span><div><strong>${h(state.user.name)}</strong><small>${h(state.user.title)} · ${roleName(state.user.role)}</small></div></div></div></aside>`;
}
function topbar(){return `<header class="topbar"><div><span class="eyebrow">${h(deptName(state.user.departmentId))}</span><h1>${panelTitle()}</h1></div><div class="top-actions"><button class="bell" data-panel="notifications">🔔${unreadCount()?`<b>${unreadCount()}</b>`:''}</button><button class="ghost" id="logoutBtn">تسجيل الخروج</button></div></header>`}
function panelTitle(){return ({home:`مرحبا ${state.user.name.split(' ')[0]}`,assistant:'NDR AI',services:'الخدمات','my-requests':'طلباتي',notifications:'الإشعارات',approvals:'الموافقات',organization:'الهيكل والتفويض',oversight:'الرقابة على الطلبات','workflow-admin':'إدارة المسارات',knowledge:'مركز المعرفة',service:'تفاصيل الخدمة','new-request':'إنشاء الطلب',request:'تفاصيل المعاملة'})[state.panel]||'NDR Smart Hub'}

function requestRow(req){const st=requestStatus(req);return `<div class="request-row" data-request="${req.id}"><div><div class="request-title"><strong>${h(req.serviceName)}</strong><span class="status ${st.cls}">${h(st.label)}</span></div><small>${h(req.id)} · ${fmt(req.createdAt)} · مقدم الطلب: ${h(userById(req.ownerId)?.name||req.ownerId)}</small><div class="holder">المسؤول الحالي: <strong>${h(holderNames(req))}</strong></div><div class="progress"><i style="width:${requestProgress(req)}%"></i></div></div><span class="open-arrow">‹</span></div>`}
function serviceCard(s){const route=serviceTemplate(s.id);return `<article class="service-card"><div class="service-head"><div><span class="tag">${h(deptName(s.departmentId))}</span><h3>${h(s.name)}</h3></div><span class="mode">${h(s.code)}</span></div><p>${h(s.description)}</p><div class="route-mini">${route.slice(0,4).map((x,i)=>`<span>${i+1}. ${h(x.label)}</span>`).join('')}${route.length>4?'<span>...</span>':''}</div><div class="actions"><button class="outline open-service" data-service="${s.id}">تفاصيل</button><button class="primary start-service" data-service="${s.id}">ابدأ</button></div></article>`}

function homePanel(){
  const mine=state.requests.filter(r=>r.ownerId===state.user.id); const returned=mine.filter(r=>r.status==='returned'&&r.returnContext?.type==='owner').length;
  return `<section><div class="hero"><span class="ai-pill">NDR AI · مساعد الخدمة</span><h2>ماذا تريد أن تنجز اليوم؟</h2><p>اكتب طلبك بطريقتك. الذكاء يوجهك، لكن كل خدمة تعمل يدويا حتى عند تعطل مزود AI.</p><div class="ask"><textarea id="aiInput" placeholder="مثال: أحتاج إذن ساعتين غدا"></textarea><button class="primary" id="askBtn">ابدأ</button></div><div class="chips">${['أريد بدل سكن','تأخرت وأحتاج مذكرة حضور','عندي إجازة مرضية','أحتاج إذن ساعتين'].map(x=>`<button class="chip ai-chip">${x}</button>`).join('')}</div></div>${returned?`<div class="urgent-banner"><strong>لديك ${returned} طلب يحتاج استكمال</strong><span>تمت إعادته لك من مسار الموافقات. افتح طلباتي لاستكماله وإعادة الإرسال.</span><button class="outline" data-panel="my-requests">فتح طلباتي</button></div>`:''}<div class="dash-grid"><div class="card"><div class="card-head"><div><h3>طلباتي الأخيرة</h3><span>الحالة والمسؤول الحالي</span></div><button class="text-btn" data-panel="my-requests">عرض الكل</button></div>${mine.slice(0,3).map(requestRow).join('')||'<div class="empty">لا توجد طلبات حتى الآن</div>'}</div><div class="card"><div class="card-head"><div><h3>خدمات سريعة</h3><span>مسارات تلقائية قابلة للضبط</span></div><button class="text-btn" data-panel="services">كل الخدمات</button></div>${services.filter(s=>s.active).slice(0,3).map(s=>`<div class="quick-service"><div><strong>${h(s.name)}</strong><small>${serviceTemplate(s.id).length} مراحل اعتماد</small></div><button class="outline start-service" data-service="${s.id}">ابدأ</button></div>`).join('')}</div></div></section>`;
}
function assistantPanel(){return `<section class="assistant-layout"><div class="chat card"><div class="chat-head"><span class="ai-icon">✦</span><div><strong>NDR AI</strong><small>محرك توجيه محلي حاليا</small></div></div><div class="messages">${state.messages.map(m=>`<div class="msg ${m.role}">${h(m.text)}${m.service?`<div class="actions"><button class="primary start-service" data-service="${m.service.id}">ابدأ الخدمة</button><button class="outline open-service" data-service="${m.service.id}">تفاصيل</button></div>`:''}</div>`).join('')}</div><div class="chat-send"><input id="chatInput" placeholder="اكتب ما تحتاجه"><button class="primary" id="chatSend">إرسال</button></div></div><aside class="side-stack"><div class="card"><h3>قاعدة مهمة</h3><p class="muted">NDR AI لا يقرر من يعتمد الطلب. مسار الموافقات يأتي من محرك Workflow المحدد للخدمة ويستمر حتى لو تعطل AI.</p></div><div class="card"><h3>الخصوصية</h3><p class="muted">في الإنتاج لن ترسل للذكاء إلا أقل قدر لازم من البيانات وبحسب صلاحية الوثائق.</p></div></aside></section>`}
function servicesPanel(){return `<section><div class="section-head"><div><h2>دليل الخدمات</h2><p>كل خدمة لها نموذج ومسار مستقل ويمكن تعديل المسار من الإدارة.</p></div><input class="search" id="serviceSearch" placeholder="ابحث عن خدمة أو نموذج"></div><div class="service-grid" id="serviceGrid">${services.filter(s=>s.active).map(serviceCard).join('')}</div></section>`}
function servicePanel(){
  const s=serviceById(state.activeServiceId); if(!s)return servicesPanel(); const route=serviceTemplate(s.id);
  return `<section><div class="service-hero card"><div><span class="tag">${h(deptName(s.departmentId))}</span><h2>${h(s.name)}</h2><p>${h(s.description)}</p><div class="actions"><button class="primary start-service" data-service="${s.id}">إنشاء طلب</button>${s.form.masterPath?`<a class="outline link-btn" href="${encodeURI(s.form.masterPath)}" target="_blank">فتح النموذج الأصلي</a>`:''}</div></div><div class="service-meta"><div><span>النموذج</span><strong>${h(s.code)}</strong></div><div><span>الإجراء</span><strong>${h(s.procedure)}</strong></div><div><span>المسار</span><strong>${route.length} مراحل</strong></div><div><span>صيغة النموذج</span><strong>${h(s.form.sourceFormat||'رقمي')}</strong></div></div></div><div class="detail-grid"><div class="card"><h3>المسار التلقائي الحالي</h3><div class="route-list">${route.map((x,i)=>`<div><b>${i+1}</b><span><strong>${h(x.label)}</strong><small>${h(resolverText(x.resolver))}${x.mode!=='SEQUENTIAL'?` · ${x.mode}`:''}</small></span></div>`).join('')}</div></div><div class="card"><h3>بيانات يطلبها النظام</h3><div class="clean-list">${s.fields.map(f=>`<div>✓ ${h(f.label)}</div>`).join('')}${(s.attachments||[]).map(a=>`<div>+ ${h(a)}</div>`).join('')}</div></div></div></section>`
}

function newRequestPanel(){
  const s=serviceById(state.activeServiceId);if(!s)return servicesPanel(); const editing=!!state.editRequestId;
  if(state.wizardStep===2)return reviewPanel();
  const req=editing?state.requests.find(r=>r.id===state.editRequestId):null;
  return `<section><div class="wizard-head"><div><span class="eyebrow">${editing?'استكمال طلب معاد':'طلب جديد'} · ${h(s.code)}</span><h2>${h(s.name)}</h2></div><div class="wizard"><b class="active">1 البيانات</b><b>2 النموذج والمراجعة</b><b>3 الإرسال</b></div></div>${editing?`<div class="return-box"><strong>سبب الإعادة</strong><span>${h(req.returnContext?.reason||'')}</span><small>المطلوب: ${h(scopeName(req.returnContext?.scope))}</small></div>`:''}<form id="requestForm" class="form-layout"><div class="card"><div class="prefill"><h3>بيانات من الحساب</h3><div><span>الاسم<strong>${h(state.user.name)}</strong></span><span>الرقم الوظيفي<strong>${h(state.user.id)}</strong></span><span>القسم<strong>${h(deptName(state.user.departmentId))}</strong></span><span>المدير المباشر<strong>${h(userById(state.user.managerId)?.name||'-')}</strong></span></div></div><div class="form-grid">${s.fields.map(f=>`<label class="field ${f.type==='textarea'?'wide':''}"><span>${h(f.label)}${f.required?' *':''}</span>${fieldControl(f,state.draft[f.id]||'')}</label>`).join('')}</div>${(s.attachments||[]).length?`<div class="attachments"><h3>المرفقات المطلوبة</h3>${s.attachments.map(a=>`<label class="upload"><span>＋</span><div><strong>${h(a)}</strong><small>${state.draft.attachments?.[a]?`الملف الحالي: ${h(state.draft.attachments[a])}`:'PDF أو صورة'}</small></div><input type="file" data-attachment="${h(a)}" accept=".pdf,.png,.jpg,.jpeg"></label>`).join('')}</div>`:''}<div class="form-actions"><button type="button" class="primary" id="reviewBtn">مراجعة النموذج</button></div></div><aside class="side-stack"><div class="card"><h3>المسار المتوقع</h3><div class="route-list small-route">${serviceTemplate(s.id).map((x,i)=>`<div><b>${i+1}</b><span><strong>${h(x.label)}</strong><small>${h(resolverText(x.resolver))}</small></span></div>`).join('')}</div></div><div class="notice">لن يصل إشعار لأي مرحلة مستقبلية. عند الإرسال يخطر المسؤول الأول فقط.</div></aside></form></section>`
}
function scopeName(v){return ({data:'تعديل البيانات',attachments:'استكمال المرفقات',stage_note:'استكمال ملاحظة المرحلة',other:'استكمال حسب الملاحظة'})[v]||v||'-'}
function reviewPanel(){
  const s=serviceById(state.activeServiceId); const editing=!!state.editRequestId;
  return `<section><div class="wizard-head"><button class="back-btn" id="backToForm">رجوع للتعديل</button><div><span class="eyebrow">${editing?'إعادة إرسال بعد الاستكمال':'مراجعة قبل الإرسال'}</span><h2>راجع نفس النموذج الذي سيتحرك في مسار الموافقات</h2></div><div class="wizard"><b>1 البيانات</b><b class="active">2 النموذج والمراجعة</b><b>3 الإرسال</b></div></div><div class="review-layout"><div>${formPreview(s,state.draft,null)}</div><aside class="side-stack"><div class="card"><h3>الإقرار الإلكتروني</h3><label class="ack"><input type="checkbox" id="employeeAck"><span>${h(s.form.declaration)}</span></label><p class="muted">عند الإرسال يسجل النظام اسم الحساب والتاريخ ورقم المعاملة كاعتماد إلكتروني للموظف.</p><button class="primary full" id="submitBtn">${editing?'إعادة إرسال الطلب':'إرسال الطلب للموافقة'}</button><button class="outline full" id="backToForm2">تعديل البيانات</button></div></aside></div></section>`
}

function myRequestsPanel(){
  const mine=state.requests.filter(r=>r.ownerId===state.user.id);return `<section><div class="section-head"><div><h2>طلباتي</h2><p>كل طلب يظهر المسؤول الحالي وسبب الإعادة عند وجوده.</p></div><button class="primary" data-panel="services">طلب جديد</button></div><div class="card">${mine.map(requestRow).join('')||'<div class="empty">لا توجد طلبات</div>'}</div></section>`
}
function approvalsPanel(){const p=pendingForUser();return `<section><div class="section-head"><div><h2>الموافقات</h2><p>لا يظهر هنا إلا الطلب الذي وصل دورك فعلا.</p></div><span class="count-pill">${p.length} بانتظارك</span></div><div class="card">${p.map(requestRow).join('')||'<div class="empty">لا توجد معاملات بانتظار إجراء منك</div>'}</div></section>`}
function notificationsPanel(){const list=userNotifications();return `<section><div class="section-head"><div><h2>الإشعارات</h2><p>الإشعار التشغيلي يذهب للمسؤول الحالي فقط، بينما الموظف يتلقى الإعادة والرفض والاعتماد النهائي.</p></div><button class="outline" id="markAll">تحديد الكل كمقروء</button></div><div class="card notification-list">${list.map(n=>`<button class="notification ${!n.read&&!n.resolved?'unread':''}" data-notification="${n.id}"><span class="notif-dot"></span><div><strong>${h(n.title)}</strong><p>${h(n.body)}</p><small>${fmt(n.createdAt)}${n.resolved?' · انتهى الإجراء':''}</small></div></button>`).join('')||'<div class="empty">لا توجد إشعارات</div>'}</div></section>`}

function requestPanel(){
  const req=state.requests.find(r=>r.id===state.activeRequestId);if(!req||!canViewRequest(req))return myRequestsPanel(); const s=serviceById(req.serviceId),st=requestStatus(req),owner=req.ownerId===state.user.id,step=currentStep(req);
  const ownerCanEdit=owner&&req.status==='returned'&&req.returnContext?.type==='owner';
  return `<section><div class="request-head"><button class="back-btn" data-panel="${owner?'my-requests':pendingForUser().some(x=>x.id===req.id)?'approvals':hasPermission('view_all')?'oversight':'home'}">رجوع</button><div><span class="eyebrow">${h(req.id)} · ${fmt(req.createdAt)}</span><h2>${h(req.serviceName)}</h2></div><span class="status ${st.cls}">${h(st.label)}</span></div>${req.status==='returned'?`<div class="return-box"><strong>أعيد للاستكمال إلى: ${h(holderNames(req))}</strong><span>${h(req.returnContext?.reason||'')}</span><small>النطاق: ${h(scopeName(req.returnContext?.scope))}</small></div>`:''}<div class="request-layout"><div class="side-stack"><div class="card"><div class="card-head"><div><h3>النموذج المرتبط بالمعاملة</h3><span>نفس النموذج يتحدث مع كل اعتماد</span></div><button class="outline print-form">طباعة / PDF</button></div>${formPreview(s,req.formData,req)}</div><div class="card"><h3>سجل المعاملة غير القابل للحذف</h3><div class="timeline">${[...req.timeline].reverse().map(t=>`<div class="timeline-item ${h(t.type)}"><i></i><div><strong>${h(t.action)}</strong><small>${h(t.actorName)} · ${fmt(t.at)}</small></div></div>`).join('')}</div></div></div><aside class="side-stack"><div class="card"><div class="card-head"><div><h3>المسار الفعلي</h3><span>${req.routeSource==='MANUAL'?'تم تعديله يدويا':'من القالب التلقائي'}</span></div>${canOverrideRoute(req)&&!['completed','rejected'].includes(req.status)?`<button class="outline route-editor" data-id="${req.id}">تعديل المسار</button>`:''}</div><div class="workflow-vertical">${req.route.map((r,i)=>stepView(req,r,i)).join('')}</div></div>${ownerCanEdit?`<button class="primary full edit-returned" data-id="${req.id}">استكمال وتعديل الطلب</button>`:''}${canAct(req)?`<div class="card action-card"><h3>${req.status==='returned'?'استكمال المرحلة وإعادة الاعتماد':'الإجراء المطلوب منك'}</h3><p>المرحلة: ${h(step?.label||'')}</p><button class="primary full approve-btn" data-id="${req.id}">${req.status==='returned'?'استكمال وإعادة اعتماد':'اعتماد إلكتروني'}</button><div class="split"><button class="outline return-btn" data-id="${req.id}">إعادة للاستكمال</button><button class="danger reject-btn" data-id="${req.id}">رفض</button></div></div>`:''}<div class="card current-holder"><span>المسؤول الحالي</span><strong>${h(holderNames(req))}</strong><small>لا يتم إخطار المراحل التالية قبل انتهاء هذه المرحلة.</small></div></aside></div></section>`
}
function stepView(req,r,i){
  const approved=validApprovals(r); const isCurrent=(req.status==='pending'&&i===req.activeStepIndex)||(req.status==='returned'&&req.returnContext?.type==='step'&&i===req.activeStepIndex); const invalid=r.approvals.filter(a=>!a.valid).length;
  return `<div class="wf-step ${r.state==='approved'?'done':''} ${isCurrent?'current':''}"><b>${r.state==='approved'?'✓':i+1}</b><div><strong>${h(r.label)}</strong><span>${h(assigneeDisplay(r)||'غير معين')}</span>${approved.length?`<small>اعتماد صالح: ${approved.map(a=>h(userById(a.userId)?.name||a.userId)).join('، ')}</small>`:''}${invalid?`<small class="invalidated">${invalid} اعتماد سابق أبطل بسبب الرجوع</small>`:''}</div></div>`
}

function oversightPanel(){const visible=state.requests.filter(canViewRequest);return `<section><div class="section-head"><div><h2>الرقابة على الطلبات</h2><p>عرض شامل للمدير العام أو مدير النظام حسب الصلاحية، بدون القفز على ترتيب الاعتماد.</p></div></div><div class="stats-row"><div><strong>${visible.length}</strong><span>إجمالي</span></div><div><strong>${visible.filter(r=>r.status==='pending').length}</strong><span>قيد المعالجة</span></div><div><strong>${visible.filter(r=>r.status==='returned').length}</strong><span>معاد للاستكمال</span></div><div><strong>${visible.filter(r=>r.status==='completed').length}</strong><span>مكتمل</span></div></div><div class="card">${visible.map(requestRow).join('')||'<div class="empty">لا توجد طلبات</div>'}</div></section>`}

function organizationPanel(){
  const canManage=hasPermission('org_manage');
  return `<section><div class="section-head"><div><h2>الهيكل الإداري والتفويض</h2><p>مدير رئيسي لكل قسم وموظفون تابعون له، مع بديل مؤقت لا يعمل إلا خلال فترة التفويض.</p></div>${hasPermission('delegation_manage')?'<button class="primary" id="addDelegation">إنشاء تفويض</button>':''}</div><div class="org-grid">${departments.filter(d=>!['system'].includes(d.id)).map(d=>`<article class="card org-card"><div class="org-head"><div><span class="tag">${h(d.id)}</span><h3>${h(d.name)}</h3></div>${canManage?`<select class="dept-manager" data-dept="${d.id}">${users.filter(u=>u.departmentId===d.id||u.role==='executive').map(u=>`<option value="${u.id}" ${u.id===managerIdForDepartment(d.id)?'selected':''}>${h(u.name)}</option>`).join('')}</select>`:`<strong>${h(userById(managerIdForDepartment(d.id))?.name||'-')}</strong>`}</div><div class="member-list">${membersOfDepartment(d.id).map(u=>`<div><span class="avatar mini">${h(u.name.slice(0,1))}</span><div><strong>${h(u.name)}</strong><small>${h(u.title)}${u.id===managerIdForDepartment(d.id)?' · المدير الرئيسي':''}</small></div></div>`).join('')||'<span class="muted">لا توجد بيانات موظفين مضافة</span>'}</div></article>`).join('')}</div><div class="card delegation-card"><div class="card-head"><div><h3>التفويضات والبدلاء</h3><span>المسار يتحول للبديل تلقائيا فقط إذا كان التفويض ساريا ويطابق الخدمة.</span></div></div><div class="table-wrap"><table><thead><tr><th>المدير الأصلي</th><th>البديل</th><th>الفترة</th><th>النطاق</th><th>الحالة</th><th></th></tr></thead><tbody>${state.delegations.map(d=>`<tr><td>${h(userById(d.principalId)?.name||d.principalId)}</td><td>${h(userById(d.delegateId)?.name||d.delegateId)}</td><td>${h(d.startDate)} → ${h(d.endDate)}</td><td>${d.scope==='ALL'?'كل الخدمات':h(serviceById(d.scope)?.name||d.scope)}</td><td>${(d.active!==false&&d.startDate<=today()&&d.endDate>=today())?'<span class="status done">ساري</span>':'<span class="status pending">غير ساري حاليا</span>'}</td><td>${hasPermission('delegation_manage')?`<button class="danger-link delete-delegation" data-id="${d.id}">حذف</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">لا توجد تفويضات</td></tr>'}</tbody></table></div></div></section>`
}
function workflowAdminPanel(){return `<section><div class="section-head"><div><h2>إدارة المسارات التلقائية</h2><p>هذه القوالب تحدد من يستلم المرحلة التالية. يمكن تعديل طلب منفرد لاحقا بدون تغيير القالب العام.</p></div></div><div class="workflow-admin-grid">${services.map(s=>`<article class="card"><div class="card-head"><div><span class="tag">${h(s.code)}</span><h3>${h(s.name)}</h3></div><button class="outline edit-template" data-service="${s.id}">تعديل القالب</button></div><div class="route-list small-route">${serviceTemplate(s.id).map((x,i)=>`<div><b>${i+1}</b><span><strong>${h(x.label)}</strong><small>${h(resolverText(x.resolver))} · ${h(x.mode||'SEQUENTIAL')}</small></span></div>`).join('')}</div>${state.workflowOverrides[s.id]?'<div class="override-note">تم تخصيص هذا القالب محليا</div>':''}</article>`).join('')}</div></section>`}
function knowledgePanel(){return `<section><div class="section-head"><div><h2>مركز المعرفة</h2><p>الوثائق والمصادر المرتبطة بالخدمات. يدعم السجل Word وPDF وExcel عند تعريف الملف وربطه بالخدمة.</p></div></div><div class="knowledge-grid">${knowledge.map(k=>`<article class="card knowledge"><span class="tag">${h(k.type)}</span><h3>${h(k.title)}</h3><p>${h(deptName(k.departmentId))}</p><small>${h(k.version)} · ${h(k.status)}</small></article>`).join('')}</div></section>`}

function openApprovalModal(reqId){
  const req=state.requests.find(r=>r.id===reqId); if(!req||!canAct(req))return; const step=currentStep(req);
  const stageFields=(step?.stageFields||[]).map(f=>`<label class="field ${f.type==='textarea'?'wide':''}"><span>${h(f.label)}</span>${fieldControl({...f,required:false},'')}</label>`).join('');
  modal(`<div class="modal-head"><div><span class="eyebrow">${req.status==='returned'?'استكمال وإعادة اعتماد':'اعتماد إلكتروني'}</span><h3>${h(step?.label||'')}</h3></div><button class="modal-x">×</button></div>${stageFields?`<div class="modal-grid" id="stageFields">${stageFields}</div>`:''}<label class="field"><span>ملاحظة الاعتماد - اختيارية</span><textarea id="approvalNote" placeholder="مثال: تمت المراجعة ولا توجد ملاحظات"></textarea></label><label class="ack"><input type="checkbox" id="approvalAck"><span>أقر أن هذا الاعتماد صادر من حسابي وسيتم تسجيل اسمي ومسمّاي وتاريخ الاعتماد على المعاملة والنموذج.</span></label><div class="modal-actions"><button class="outline modal-cancel">إلغاء</button><button class="primary" id="confirmApproval">تأكيد الاعتماد</button></div>`);
  document.querySelector('#confirmApproval').onclick=()=>{
    if(!document.querySelector('#approvalAck').checked){toast('أكد الإقرار الإلكتروني أولا','error');return}
    const stageData={}; (step?.stageFields||[]).forEach(f=>{stageData[f.id]=document.querySelector(`#stageFields [name="${f.id}"]`)?.value?.trim?.()||''});
    const note=document.querySelector('#approvalNote').value.trim();closeModal();approveRequest(reqId,note,stageData)
  };
  bindModalClose();
}
function openReturnModal(reqId){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canAct(req))return;const targets=returnTargets(req);
  modal(`<div class="modal-head"><div><span class="eyebrow">إعادة للاستكمال</span><h3>اختر إلى من يرجع الطلب</h3></div><button class="modal-x">×</button></div><label class="field"><span>الطرف السابق</span><select id="returnTarget">${targets.map(t=>`<option value="${t.value}">${h(t.label)}</option>`).join('')}</select></label><label class="field"><span>نوع الاستكمال</span><select id="returnScope"><option value="data">تعديل البيانات</option><option value="attachments">استكمال المرفقات</option><option value="stage_note">استكمال ملاحظة المرحلة</option><option value="other">أخرى</option></select></label><label class="field"><span>سبب الإعادة *</span><textarea id="returnReason" placeholder="حدد المطلوب بوضوح"></textarea></label><div class="modal-note">أي اعتماد من نقطة الرجوع وما بعدها سيصبح اعتمادا سابقا غير صالح، ويجب إعادة اعتماده بعد الاستكمال. السجل القديم لا يحذف.</div><div class="modal-actions"><button class="outline modal-cancel">إلغاء</button><button class="primary" id="confirmReturn">إعادة للطرف المحدد</button></div>`);
  document.querySelector('#confirmReturn').onclick=()=>{const reason=document.querySelector('#returnReason').value.trim();if(!reason){toast('سبب الإعادة مطلوب','error');return}returnRequest(reqId,document.querySelector('#returnTarget').value,reason,document.querySelector('#returnScope').value)};bindModalClose();
}
function openRejectModal(reqId){
  modal(`<div class="modal-head"><div><span class="eyebrow">رفض الطلب</span><h3>الرفض يغلق المعاملة</h3></div><button class="modal-x">×</button></div><label class="field"><span>سبب الرفض *</span><textarea id="rejectReason" placeholder="اكتب السبب الذي سيظهر للموظف"></textarea></label><div class="modal-actions"><button class="outline modal-cancel">إلغاء</button><button class="danger" id="confirmReject">تأكيد الرفض</button></div>`);
  document.querySelector('#confirmReject').onclick=()=>{const r=document.querySelector('#rejectReason').value.trim();if(!r){toast('سبب الرفض مطلوب','error');return}rejectRequest(reqId,r)};bindModalClose();
}
function openDelegationModal(){
  const managers=users.filter(u=>['manager','executive'].includes(u.role));
  modal(`<div class="modal-head"><div><span class="eyebrow">تفويض مؤقت</span><h3>تعيين بديل أثناء الغياب</h3></div><button class="modal-x">×</button></div><div class="modal-grid"><label class="field"><span>المدير الأصلي</span><select id="delPrincipal">${managers.map(u=>`<option value="${u.id}">${h(u.name)}</option>`).join('')}</select></label><label class="field"><span>البديل</span><select id="delDelegate">${users.filter(u=>u.role!=='system_admin').map(u=>`<option value="${u.id}">${h(u.name)} - ${h(u.title)}</option>`).join('')}</select></label><label class="field"><span>من تاريخ</span><input id="delStart" type="date" value="${today()}"></label><label class="field"><span>إلى تاريخ</span><input id="delEnd" type="date" value="${today()}"></label><label class="field wide"><span>النطاق</span><select id="delScope"><option value="ALL">كل الخدمات</option>${services.map(s=>`<option value="${s.id}">${h(s.name)}</option>`).join('')}</select></label></div><div class="modal-actions"><button class="outline modal-cancel">إلغاء</button><button class="primary" id="saveDelegation">حفظ التفويض</button></div>`);
  document.querySelector('#saveDelegation').onclick=()=>{const p=document.querySelector('#delPrincipal').value,d=document.querySelector('#delDelegate').value,s=document.querySelector('#delStart').value,e=document.querySelector('#delEnd').value;if(p===d||!s||!e||s>e){toast('راجع بيانات التفويض','error');return}addDelegation({principalId:p,delegateId:d,startDate:s,endDate:e,scope:document.querySelector('#delScope').value})};bindModalClose();
}
function openTemplateEditor(serviceId){
  const steps=serviceTemplate(serviceId);const s=serviceById(serviceId);
  modal(`<div class="modal-head"><div><span class="eyebrow">قالب المسار التلقائي</span><h3>${h(s.name)}</h3></div><button class="modal-x">×</button></div><div id="templateRows" class="editor-rows">${steps.map(step=>templateRow(step)).join('')}</div><button class="outline" id="addTemplateRow">+ إضافة مرحلة</button><div class="modal-actions"><button class="ghost" id="resetTemplate">إعادة الافتراضي</button><button class="outline modal-cancel">إلغاء</button><button class="primary" id="saveTemplate">حفظ المسار</button></div>`);
  document.querySelector('#addTemplateRow').onclick=()=>document.querySelector('#templateRows').insertAdjacentHTML('beforeend',templateRow({id:uid('S'),label:'مرحلة جديدة',resolver:{type:'DIRECT_MANAGER'},mode:'SEQUENTIAL'}));
  document.querySelector('#templateRows').onclick=e=>{if(e.target.matches('.remove-row'))e.target.closest('.template-row').remove()};
  document.querySelector('#saveTemplate').onclick=()=>saveWorkflowTemplate(serviceId);document.querySelector('#resetTemplate').onclick=()=>resetWorkflowTemplate(serviceId);bindModalClose();
}
function templateRow(step){return `<div class="template-row" data-id="${h(step.id)}"><input class="tpl-label" value="${h(step.label)}"><select class="tpl-resolver">${workflowPresetOptions(resolverPreset(step.resolver))}</select><select class="tpl-mode"><option ${step.mode==='SEQUENTIAL'?'selected':''}>SEQUENTIAL</option><option ${step.mode==='ANY'?'selected':''}>ANY</option><option ${step.mode==='ALL'?'selected':''}>ALL</option></select><button class="remove-row" type="button">×</button></div>`}
function openRouteEditor(reqId){
  const req=state.requests.find(r=>r.id===reqId);if(!req||!canOverrideRoute(req))return;const future=req.route.slice(req.activeStepIndex);
  modal(`<div class="modal-head"><div><span class="eyebrow">تعديل مسار طلب محدد</span><h3>${h(req.id)}</h3></div><button class="modal-x">×</button></div><div class="modal-note">المراحل المنتهية لا تتغير. يمكنك تعديل المسؤول الحالي والمراحل المستقبلية فقط. سيصل الإشعار للمسؤول الجديد الحالي فقط.</div><div id="routeRows" class="editor-rows">${future.map(routeEditorRow).join('')}</div><button class="outline" id="addRouteRow">+ إضافة مرحلة مستقبلية</button><div class="modal-actions"><button class="outline modal-cancel">إلغاء</button><button class="primary" id="saveRoute">حفظ المسار اليدوي</button></div>`);
  document.querySelector('#addRouteRow').onclick=()=>document.querySelector('#routeRows').insertAdjacentHTML('beforeend',routeEditorRow({id:uid('M'),label:'مرحلة إضافية',assigneeIds:['GM01']}));
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
  document.querySelectorAll('.start-service').forEach(x=>x.onclick=()=>startService(x.dataset.service));
  document.querySelectorAll('[data-request]').forEach(x=>x.onclick=()=>openRequest(x.dataset.request));
  document.querySelector('#logoutBtn')?.addEventListener('click',logout);
  document.querySelector('#askBtn')?.addEventListener('click',()=>submitAI());
  document.querySelectorAll('.ai-chip').forEach(x=>x.onclick=()=>submitAI(x.textContent));
  document.querySelector('#chatSend')?.addEventListener('click',()=>submitAI(document.querySelector('#chatInput').value));
  document.querySelector('#chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitAI(e.target.value)}});
  document.querySelector('#serviceSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelector('#serviceGrid').innerHTML=services.filter(s=>s.active&&serviceSearchText(s).includes(normalizeArabic(q))).map(serviceCard).join('')||'<div class="empty">لا توجد نتائج</div>';bind()});
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
  if(!state.user)return loginView();
  const panels={home:homePanel,assistant:assistantPanel,services:servicesPanel,service:servicePanel,'new-request':newRequestPanel,'my-requests':myRequestsPanel,approvals:approvalsPanel,notifications:notificationsPanel,request:requestPanel,organization:organizationPanel,oversight:oversightPanel,'workflow-admin':workflowAdminPanel,knowledge:knowledgePanel};
  const fn=panels[state.panel]||homePanel;app.innerHTML=`<div class="shell">${sidebar()}<main class="main">${topbar()}${fn()}</main></div>`;bind();
}

render();
