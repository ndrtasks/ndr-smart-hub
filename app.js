import { users, departments } from './data.js';
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
  formSession:null,
  reviewMode:false,
  busy:false
};

function isEn(){return state.language==='en'}
function tr(ar,en){return isEn()?en:ar}
function applyLocale(){document.documentElement.lang=state.language;document.documentElement.dir=isEn()?'ltr':'rtl'}
function userName(u){return isEn()?(u?.nameEn||u?.name||'-'):(u?.name||u?.nameEn||'-')}
function userTitle(u){return isEn()?(u?.titleEn||u?.title||'-'):(u?.title||u?.titleEn||'-')}
function departmentName(id){const d=departments.find(x=>x.id===id);return isEn()?(d?.nameEn||d?.name||id):(d?.name||d?.nameEn||id)}
function sourceById(id){return knowledgeBase.find(x=>x.id===id)}
function formByCode(code){for(const s of knowledgeBase){const f=(s.relatedForms||[]).find(x=>x.code===code);if(f)return {source:s,form:f}}return null}
function localize(obj,key){return isEn()?(obj?.[`${key}En`]||obj?.[key]||''):(obj?.[key]||obj?.[`${key}En`]||'')}
function persistChat(){save(KEYS.chat,state.messages.slice(-60))}
function pad2(v){return String(v).padStart(2,'0')}
function localDateString(date=new Date()){return `${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`}
function today(){return localDateString(new Date())}

function setLanguage(lang){state.language=lang;save(KEYS.lang,lang);applyLocale();render()}
function login(id){state.user=users.find(u=>u.id===id)||null;save(KEYS.user,state.user);state.formSession=null;state.formDraft={};render()}
function logout(){state.user=null;state.formSession=null;state.formDraft={};localStorage.removeItem(KEYS.user);render()}

function initialAssistantMessage(){
  return tr('قل لي وش تحتاج بطريقتك. أقدر أشرح الإجراء من المصدر، أتحقق من بياناتك واستحقاقك، وأجهز النموذج معك بدون ما أعيد سؤالك عن معلومات موجودة أصلا في ملفك.','Tell me what you need in your own words. I can explain the procedure, check your profile and eligibility, and prepare the form without asking again for information already in your profile.');
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

function wantsAction(q=''){
  const n=normalizeText(q);
  return ['ابي اقدم','ابغى اقدم','اريد اقدم','ابي اطلب','ابغى اطلب','جهز لي','عبي لي','عب لي','ارفع طلب','بسوي طلب','احتاج اقدم','احتاج بدل','ابغى بدل'].some(x=>n.includes(normalizeText(x)));
}

function localAnswer(question){
  const ranked=rankKnowledge(question);const best=ranked[0];
  if(!best||best.score<2)return {answer:tr('ما لقيت إجابة موثوقة في المصادر المرفوعة حاليا، لذلك ما راح أفترض إجراء من عندي.','I could not find a reliable answer in the uploaded sources, so I will not invent a process.'),sourceIds:[],recommendedFormCode:null,intent:'QUESTION',prefill:{}};
  const s=best.item;const formCode=recommendedFormFor(s,question);const found=formByCode(formCode);
  const intro=tr(`حسب ${s.code} (${s.revision})، هذا هو الإجراء المرتبط بطلبك.`,`According to ${s.code} (${s.revision}), this is the procedure related to your request.`);
  const body=s.sourceTextAr.map(x=>`• ${x}`).join('\n');
  const pilot=tr('\n\nتنبيه: المصدر الحالي مؤقت للتجربة وسيستبدل عند رفع النسخة الجديدة المعتمدة.','\n\nNote: the current source is temporary for the pilot and will be replaced by the new approved version.');
  return {answer:`${intro}\n${body}${s.status==='temporary-pilot'?pilot:''}`,sourceIds:[s.id],recommendedFormCode:formCode,intent:wantsAction(question)&&found?.form?.indexed?'PREPARE_FORM':'QUESTION',prefill:{}};
}

function serviceMonths(joiningDate,asOf=today()){
  if(!joiningDate)return null;
  const start=new Date(`${joiningDate}T00:00:00`),end=new Date(`${asOf}T00:00:00`);
  if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<start)return null;
  let months=(end.getFullYear()-start.getFullYear())*12+(end.getMonth()-start.getMonth());
  if(end.getDate()<start.getDate())months-=1;
  return Math.max(0,months);
}

function serviceLabel(months){
  if(months===null||months===undefined)return tr('غير معروف','Unknown');
  const y=Math.floor(months/12),m=months%12;
  if(isEn())return `${y} year${y===1?'':'s'}${m?` and ${m} month${m===1?'':'s'}`:''}`;
  if(!y)return `${m} شهر`;
  if(!m)return `${y} سنة`;
  return `${y} سنة و${m} شهر`;
}

function formEligibility(form){
  if(!form?.eligibility)return {checked:false,eligible:true,availableMonths:[]};
  if(form.eligibility.type==='SERVICE_MONTHS'){
    const months=serviceMonths(state.user?.joiningDate);
    if(months===null)return {checked:true,eligible:false,reason:'MISSING_JOIN_DATE',serviceMonths:null,availableMonths:[]};
    if(months<form.eligibility.minimumMonths)return {checked:true,eligible:false,reason:'MIN_SERVICE',serviceMonths:months,availableMonths:[],minimumMonths:form.eligibility.minimumMonths};
    const tier=(form.eligibility.tiers||[]).find(t=>months>=t.min&&(t.max===null||t.max===undefined||months<=t.max));
    return {checked:true,eligible:!!tier,reason:tier?null:'NO_TIER',serviceMonths:months,availableMonths:tier?.months||[],minimumMonths:form.eligibility.minimumMonths};
  }
  return {checked:false,eligible:true,availableMonths:[]};
}

function eligibilityMessage(form){
  const e=formEligibility(form);if(!e.checked)return '';
  if(e.reason==='MISSING_JOIN_DATE')return tr('لا أقدر أتحقق من الاستحقاق لأن تاريخ التعيين غير موجود في ملف الموظف.','I cannot verify eligibility because the joining date is missing from the employee profile.');
  if(!e.eligible)return tr(`حسب تاريخ التعيين المسجل ${state.user?.joiningDate||'-'}، مدة خدمتك الحالية ${serviceLabel(e.serviceMonths)}. الحد الأدنى لطلب بدل السكن هو 3 سنوات ونصف، لذلك الطلب غير متاح لك حاليا حسب الإجراء الحالي.`,`Based on the recorded joining date ${state.user?.joiningDate||'-'}, your current service is ${serviceLabel(e.serviceMonths)}. The minimum service for this housing allowance request is 3.5 years, so the request is not currently available under the current procedure.`);
  return tr(`حسب تاريخ التعيين المسجل، مدة خدمتك ${serviceLabel(e.serviceMonths)} والخيارات المتاحة لك: ${e.availableMonths.join('، ')} أشهر.`,`Based on your recorded joining date, your service is ${serviceLabel(e.serviceMonths)} and your available options are: ${e.availableMonths.join(', ')} months.`);
}

function profileAutoValue(field){
  if(!field?.auto)return '';
  const map={
    id:state.user?.id||'',
    name:userName(state.user),
    title:userTitle(state.user),
    department:departmentName(state.user?.departmentId),
    joiningDate:state.user?.joiningDate||'',
    email:state.user?.email||'',
    housingAllowance:state.user?.housingAllowance??'',
    today:today()
  };
  return map[field.auto]??'';
}

function conditionMatches(c,data){if(!c)return true;const v=data?.[c.field]??'';if(Object.prototype.hasOwnProperty.call(c,'equals'))return v===c.equals;if(Array.isArray(c.in))return c.in.includes(v);return true}
function fieldVisible(f,data){if(f.showWhen&&!conditionMatches(f.showWhen,data))return false;if(Array.isArray(f.showWhenAny)&&f.showWhenAny.length&&!f.showWhenAny.some(c=>conditionMatches(c,data)))return false;return true}
function dateDiffInclusive(a,b){if(!a||!b)return '';const d1=new Date(`${a}T00:00:00`),d2=new Date(`${b}T00:00:00`);if(Number.isNaN(d1.getTime())||Number.isNaN(d2.getTime())||d2<d1)return '';return String(Math.floor((d2-d1)/86400000)+1)}
function addMonthsMinusDay(start,months){if(!start||!months)return '';const d=new Date(`${start}T00:00:00`);if(Number.isNaN(d.getTime()))return '';const originalDay=d.getDate();d.setMonth(d.getMonth()+Number(months));if(d.getDate()!==originalDay)d.setDate(0);d.setDate(d.getDate()-1);return localDateString(d)}

function updateCalculated(form,data){
  for(const f of form.fields||[]){
    if(f.calculated==='dateDiffInclusive')data[f.id]=dateDiffInclusive(data.vacationFrom,data.vacationTo);
    if(f.calculated==='housingTotal'){
      const months=Number(data.requestedMonths||0),allowance=Number(data.monthlyHousingAllowance||0);
      data[f.id]=months&&allowance?String(months*allowance):'';
    }
    if(f.calculated==='repaymentEnd')data[f.id]=addMonthsMinusDay(data.repaymentStart,data.repaymentMonths);
  }
  return data;
}

function fieldOptions(field,form){
  if(field.dynamicOptions==='HOUSING_ELIGIBILITY')return formEligibility(form).availableMonths||[];
  return field.options||[];
}

function prepareFormDraft(form,prefill={}){
  const data={};
  for(const f of form.fields||[]){const auto=profileAutoValue(f);if(auto!==''&&auto!==undefined&&auto!==null)data[f.id]=String(auto)}
  Object.entries(prefill||{}).forEach(([k,v])=>{if((form.fields||[]).some(f=>f.id===k)&&v!==undefined&&v!==null&&String(v).trim()!=='')data[k]=String(v)});
  const dynamic=(form.fields||[]).find(f=>f.dynamicOptions==='HOUSING_ELIGIBILITY');
  if(dynamic&&data[dynamic.id]&&!fieldOptions(dynamic,form).includes(String(data[dynamic.id])))delete data[dynamic.id];
  return updateCalculated(form,data);
}

function autoFilledLabels(form){return (form.fields||[]).filter(f=>f.auto&&state.formDraft[f.id]!==undefined&&String(state.formDraft[f.id]).trim()!=='').map(f=>localize(f,'label'))}
function nextFormField(){
  if(!state.formSession)return null;const found=formByCode(state.formSession.formCode);if(!found)return null;
  updateCalculated(found.form,state.formDraft);
  return (found.form.fields||[]).find(f=>{
    if(f.ask===false||f.auto||f.calculated)return false;
    if(!fieldVisible(f,state.formDraft))return false;
    if(state.formSession.skipped.includes(f.id))return false;
    return state.formDraft[f.id]===undefined||state.formDraft[f.id]===null||String(state.formDraft[f.id]).trim()==='';
  })||null;
}

function fieldPrompt(f){
  const base=isEn()?(f.promptEn||`Please enter ${f.labelEn||f.label}.`):(f.prompt||`أدخل ${f.label}.`);
  if(f.dynamicOptions==='HOUSING_ELIGIBILITY'){
    const found=formByCode(state.formSession?.formCode);const opts=found?fieldOptions(f,found.form):[];
    return `${eligibilityMessage(found?.form)}\n${base}${opts.length?tr(` الخيارات المتاحة: ${opts.join('، ')} أشهر.`,` Available options: ${opts.join(', ')} months.`):''}`;
  }
  return base;
}
function fieldOptionLabel(f,o){return isEn()?(f.optionLabelsEn?.[o]||o):o}

function pushNextFormQuestion(){
  const field=nextFormField();
  if(!field){
    state.formSession.completed=true;
    const found=formByCode(state.formSession.formCode);
    state.messages.push({role:'ai',text:tr(`خلصت البيانات التي أقدر أجهزها لنموذج ${found.form.code}. راجع المسودة قبل استخدامها.`,`I have completed the information I can prepare for ${found.form.code}. Review the draft before using it.`),sourceIds:[found.source.id],formComplete:true,recommendedFormCode:found.form.code});
    persistChat();return;
  }
  const found=formByCode(state.formSession.formCode);const opts=fieldOptions(field,found.form);
  state.formSession.currentFieldId=field.id;
  state.messages.push({role:'ai',text:fieldPrompt(field),sourceIds:[],formQuestion:true,fieldId:field.id,options:opts.map(o=>({value:o,label:fieldOptionLabel(field,o)})),optional:!field.required});
  persistChat();
}

function startFormSession(code,prefill={}){
  const found=formByCode(code);if(!found||!found.form.indexed)return;
  const eligibility=formEligibility(found.form);
  if(eligibility.checked&&!eligibility.eligible){
    state.formSession=null;state.formDraft={};
    state.messages.push({role:'ai',text:eligibilityMessage(found.form),sourceIds:[found.source.id],recommendedFormCode:null});
    persistChat();render();return;
  }
  if(code==='HR-F-29'&&(state.user?.housingAllowance===undefined||state.user?.housingAllowance===null||Number(state.user.housingAllowance)<=0)){
    state.formSession=null;state.formDraft={};
    state.messages.push({role:'ai',text:tr('لا أقدر أجهز بدل السكن تلقائيا لأن قيمة بدل السكن الشهري غير موجودة في ملف الموظف. لازم تضاف للبيانات أولا حتى تكون الحسبة صحيحة.','I cannot prepare the housing allowance automatically because the monthly housing allowance is missing from the employee profile. It must be added first so the calculation is accurate.'),sourceIds:[found.source.id]});
    persistChat();render();return;
  }
  state.activeFormCode=code;state.formDraft=prepareFormDraft(found.form,prefill);state.formSession={formCode:code,skipped:[],currentFieldId:null,completed:false};state.panel='assistant';state.reviewMode=false;
  const labels=autoFilledLabels(found.form);const eligibilityText=eligibility.checked?` ${eligibilityMessage(found.form)}`:'';
  state.messages.push({role:'ai',text:tr(`تمام. بدأت تجهيز ${found.form.code} لك.${eligibilityText} عبأت تلقائيا من ملفك: ${labels.join('، ') || 'البيانات المتوفرة'}. الآن بسألك فقط عن البيانات الناقصة.`,`Done. I started preparing ${found.form.code}.${eligibilityText} I auto-filled from your profile: ${labels.join(', ') || 'available profile data'}. I will now ask only for missing information.`),sourceIds:[found.source.id],formSessionStarted:true});
  pushNextFormQuestion();persistChat();render();
}

function normalizeDigits(value=''){return String(value).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))}
function validYmd(y,m,d){const dt=new Date(y,m-1,d);return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d}
function ymd(y,m,d){return validYmd(y,m,d)?`${y}-${pad2(m)}-${pad2(d)}`:null}
function parseDateInput(text){
  const raw=normalizeDigits(text).trim().toLowerCase();const n=normalizeText(raw);
  const base=new Date();
  if(['اليوم','today'].includes(n))return today();
  if(['امس','أمس','yesterday'].map(normalizeText).includes(n)){const d=new Date(base);d.setDate(d.getDate()-1);return localDateString(d)}
  if(['غدا','غداً','بكره','بكرة','tomorrow'].map(normalizeText).includes(n)){const d=new Date(base);d.setDate(d.getDate()+1);return localDateString(d)}
  let m=raw.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);if(m)return ymd(Number(m[1]),Number(m[2]),Number(m[3]));
  m=raw.match(/^(\d{1,2})[-\/.](\d{1,2})(?:[-\/.](\d{2,4}))?$/);
  if(m){let year=m[3]?Number(m[3]):base.getFullYear();if(year<100)year+=2000;return ymd(year,Number(m[2]),Number(m[1]))}
  const months={يناير:1,فبراير:2,مارس:3,ابريل:4,أبريل:4,مايو:5,يونيو:6,يوليو:7,اغسطس:8,أغسطس:8,سبتمبر:9,اكتوبر:10,أكتوبر:10,نوفمبر:11,ديسمبر:12,january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
  m=raw.match(/^(\d{1,2})\s+([^\s]+)(?:\s+(\d{4}))?$/);
  if(m&&months[m[2]])return ymd(m[3]?Number(m[3]):base.getFullYear(),months[m[2]],Number(m[1]));
  return null;
}

function basicFieldInterpret(field,text,form){
  const t=String(text||'').trim();const n=normalizeText(t);
  if(!field.required&&['لا','لا اعرف','ما اعرف','بدون','تخطي','none','no','skip','i do not know'].some(x=>n===normalizeText(x)))return {understood:true,skip:true,normalizedValue:''};
  if(field.id==='mobile'&&(n==='نفس الرقم'||n==='نفسه'||n==='same number')&&state.formDraft.vacationContact)return {understood:true,skip:false,normalizedValue:state.formDraft.vacationContact};
  if(field.type==='date'){const parsed=parseDateInput(t);if(parsed)return {understood:true,skip:false,normalizedValue:parsed}}
  if(field.type==='select'){
    const options=fieldOptions(field,form);
    const option=options.find(o=>normalizeText(o)===n||n===normalizeText(`${o} شهر`)||n.includes(normalizeText(o))||normalizeText(o).includes(n));
    if(option)return {understood:true,skip:false,normalizedValue:option};
    if(field.dynamicOptions==='HOUSING_ELIGIBILITY')return {understood:false,skip:false,normalizedValue:'',retryQuestion:tr(`هذا الخيار غير متاح حسب مدة خدمتك. الخيارات المتاحة فقط: ${options.join('، ')} أشهر.`,`This option is not available for your service period. Available options are: ${options.join(', ')} months.`)};
  }
  if(field.type==='number'){const m=normalizeDigits(t).match(/[\d.]+/);if(m)return {understood:true,skip:false,normalizedValue:m[0]}}
  if(field.type==='time'){const normalized=normalizeDigits(t).replace('.',':');if(/^\d{1,2}:\d{2}$/.test(normalized)){const [a,b]=normalized.split(':');const hh=Number(a),mm=Number(b);if(hh>=0&&hh<24&&mm>=0&&mm<60)return {understood:true,skip:false,normalizedValue:`${pad2(hh)}:${pad2(mm)}`}}}
  if(!['date','time','select','number'].includes(field.type)&&t)return {understood:true,skip:false,normalizedValue:t};
  return {understood:false,skip:false,normalizedValue:'',retryQuestion:field.type==='date'?tr('اكتب التاريخ مثل: اليوم أو 24/7 أو 24/7/2026.','Enter the date like: today, 24/7, or 24/7/2026.'):tr('وضح لي المعلومة بشكل أدق.','Please clarify this value.')};
}

async function interpretField(field,text,form){
  const local=basicFieldInterpret(field,text,form);if(local.understood)return local;
  try{
    const res=await fetch('/api/form-assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:state.language,text,field:{...field,options:fieldOptions(field,form)},currentData:state.formDraft})});
    if(res.ok){const data=await res.json();if(!data.fallback&&data.understood)return data}
  }catch{}
  return local;
}

async function handleFormReply(text){
  const q=(text||'').trim();if(!q||state.busy||!state.formSession)return;
  const found=formByCode(state.formSession.formCode);const field=(found?.form?.fields||[]).find(f=>f.id===state.formSession.currentFieldId)||nextFormField();if(!field)return;
  state.messages.push({role:'user',text:q});state.busy=true;persistChat();render();
  const parsed=await interpretField(field,q,found.form);
  if(!parsed.understood){const opts=fieldOptions(field,found.form);state.messages.push({role:'ai',text:parsed.retryQuestion||fieldPrompt(field),sourceIds:[],formQuestion:true,fieldId:field.id,options:opts.map(o=>({value:o,label:fieldOptionLabel(field,o)})),optional:!field.required});state.busy=false;persistChat();render();return}
  if(parsed.skip){if(!state.formSession.skipped.includes(field.id))state.formSession.skipped.push(field.id)}else state.formDraft[field.id]=parsed.normalizedValue;
  updateCalculated(found.form,state.formDraft);state.busy=false;pushNextFormQuestion();render();
}

async function askQuestion(text){
  if(state.formSession&&!state.formSession.completed)return handleFormReply(text);
  const q=(text||'').trim();if(!q||state.busy)return;
  state.messages.push({role:'user',text:q});state.busy=true;persistChat();render();
  let result=null;
  try{
    const payload={
      text:q,language:state.language,
      employeeProfile:{id:state.user?.id,name:userName(state.user),title:userTitle(state.user),department:departmentName(state.user?.departmentId),joiningDate:state.user?.joiningDate||'',housingAllowance:state.user?.housingAllowance??null,email:state.user?.email||''},
      messages:state.messages.slice(-10).map(m=>({role:m.role,text:m.text})),
      sources:knowledgeBase.map(s=>({id:s.id,title:s.title,titleEn:s.titleEn,code:s.code,revision:s.revision,status:s.status,summaryAr:s.summaryAr,summaryEn:s.summaryEn,sourceTextAr:s.sourceTextAr,relatedForms:s.relatedForms.map(f=>({code:f.code,title:f.title,titleEn:f.titleEn,indexed:f.indexed,noteAr:f.noteAr||'',noteEn:f.noteEn||'',eligibility:f.eligibility||null,fields:f.fields||[]}))}))
    };
    const res=await fetch('/api/ai-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(res.ok){const data=await res.json();if(!data.fallback)result=data}
  }catch{}
  if(!result)result=localAnswer(q);
  if(result.clarificationQuestion){state.messages.push({role:'ai',text:result.clarificationQuestion,sourceIds:[]});state.busy=false;persistChat();render();return}
  state.messages.push({role:'ai',text:result.answer||localAnswer(q).answer,sourceIds:result.sourceIds||[],recommendedFormCode:result.recommendedFormCode||null});
  state.busy=false;persistChat();
  const found=result.recommendedFormCode?formByCode(result.recommendedFormCode):null;
  if(result.intent==='PREPARE_FORM'&&found?.form?.indexed){startFormSession(result.recommendedFormCode,result.prefill||{});return}
  render();
}

function sourceBadge(s){return `<span class="pilot-badge">${tr('مصدر تجريبي مؤقت','Temporary pilot source')}</span>`}
function sourceMeta(s){return `<div class="source-meta"><span><b>${h(s.code)}</b></span><span>${tr('الإصدار','Revision')}: ${h(s.revision)}</span><span>${h(s.sourceDate||'')}</span></div>`}
function eligibilityInline(form){if(!form?.eligibility)return '';const e=formEligibility(form);const cls=e.eligible?'grounded':'top-note';return `<div class="${cls}" style="margin-top:8px">${h(eligibilityMessage(form))}</div>`}

function formActionBlock(code){
  const found=formByCode(code);if(!found)return '';
  const {form}=found;const eligibility=formEligibility(form);const canStart=!eligibility.checked||eligibility.eligible;
  return `<div class="form-recommendation"><div><span class="eyebrow">${tr('النموذج المرتبط','Related form')}</span><strong>${h(form.code)} — ${h(localize(form,'title'))}</strong>${form.note?`<small>${h(localize(form,'note'))}</small>`:''}${eligibilityInline(form)}</div><div class="actions">${form.assetPath?`<a class="outline" href="${encodeURI(form.assetPath)}" target="_blank">${tr('فتح النموذج الأصلي','Open original form')}</a>`:''}${form.indexed?(canStart?`<button class="primary smart-fill" data-form="${h(form.code)}">${tr('عبه لي تلقائيا','Auto-fill it with me')}</button>`:`<button class="outline" disabled>${tr('غير مستحق حاليا','Not currently eligible')}</button>`):`<button class="outline" disabled>${tr('ملف النموذج غير مفهرس بعد','Form file not indexed yet')}</button>`}</div></div>`;
}

function formProgressBlock(code){
  const found=formByCode(code);if(!found)return '';const visible=(found.form.fields||[]).filter(f=>fieldVisible(f,state.formDraft));const filled=visible.filter(f=>state.formDraft[f.id]!==undefined&&String(state.formDraft[f.id]).trim()!=='').length;
  return `<div class="form-progress-card"><div><span>${tr('التعبئة الذكية','Smart form filling')}</span><strong>${h(code)}</strong></div><div><b>${filled}</b><small>${tr(`من ${visible.length} حقل جاهز`,`of ${visible.length} fields ready`)}</small></div></div>`;
}

function messageCard(m){
  if(m.role==='user')return `<div class="msg user"><div>${h(m.text)}</div></div>`;
  const sources=(m.sourceIds||[]).map(sourceById).filter(Boolean);
  const options=(m.options||[]).length?`<div class="field-options">${m.options.map(o=>`<button class="chip field-option" data-value="${h(o.value)}">${h(o.label)}</button>`).join('')}${m.optional?`<button class="chip field-option" data-value="${tr('لا','skip')}">${tr('تخطي','Skip')}</button>`:''}</div>`:'';
  return `<div class="msg ai"><div class="answer-text">${h(m.text).replace(/\n/g,'<br>')}</div>${sources.length?`<div class="answer-sources">${sources.map(s=>`<button class="source-link" data-source="${s.id}">${h(s.code)} · ${h(localize(s,'title'))}</button>`).join('')}</div>`:''}${m.recommendedFormCode&&!m.formComplete?formActionBlock(m.recommendedFormCode):''}${m.formQuestion&&state.formSession?formProgressBlock(state.formSession.formCode):''}${options}${m.formComplete?`<div class="actions complete-actions"><button class="primary review-smart-form" data-form="${h(m.recommendedFormCode)}">${tr('راجع النموذج الجاهز','Review prepared form')}</button><button class="outline restart-smart-form" data-form="${h(m.recommendedFormCode)}">${tr('ابدأ من جديد','Start over')}</button></div>`:''}</div>`;
}

function assistantPanel(){
  const messages=state.messages.length?state.messages:[{role:'ai',text:initialAssistantMessage(),sourceIds:[]}];
  return `<section class="hero"><div class="hero-copy"><span class="ai-pill">NDR Knowledge Assistant</span><h2>${tr('اسأل أو خلني أجهز الطلب معك','Ask me, or let me prepare the request with you')}</h2><p>${tr('أفهم طلبك من السياق، أرجع للإجراء الداخلي، أتحقق من بيانات الموظف والاستحقاق، ثم أعبئ الموجود تلقائيا وأسألك فقط عن الناقص.','I understand your intent, check the internal procedure, verify employee data and eligibility, auto-fill what is already known, then ask only for missing information.')}</p></div></section><section class="assistant-grid"><div class="chat-card card"><div class="chat-head"><div><strong>${tr('مساعد الموظف','Employee Assistant')}</strong><small>${state.formSession&&!state.formSession.completed?tr(`جاري تجهيز ${state.formSession.formCode}`,`Preparing ${state.formSession.formCode}`):tr('اسأل عن أي إجراء أو اطلب تجهيز نموذج','Ask about a procedure or ask me to prepare a form')}</small></div><span class="grounded">${tr('مقيد بالمصادر','Source grounded')}</span></div><div class="messages">${messages.map(messageCard).join('')}${state.busy?`<div class="msg ai typing">${state.formSession?tr('أفهم إجابتك وأحدث النموذج...','Understanding your answer and updating the form...'):tr('أراجع الإجراءات والنماذج...','Checking procedures and forms...')}</div>`:''}</div><div class="ask-box"><textarea id="question" rows="2" placeholder="${state.formSession&&!state.formSession.completed?tr('جاوب على السؤال الحالي...','Answer the current question...'):tr('مثال: أبي أقدم إجازة من 5 أغسطس إلى 12 أغسطس','Example: I want leave from August 5 to August 12')}"></textarea><button id="sendQuestion" class="primary">${tr('إرسال','Send')}</button></div><div class="chips">${state.formSession&&!state.formSession.completed?`<button class="chip cancel-form">${tr('إلغاء تعبئة النموذج','Cancel form filling')}</button>`:`<button class="chip quick-question">${tr('كيف أقدم إجازة؟','How do I apply for leave?')}</button><button class="chip quick-question">${tr('أبي أقدم إجازة','I want to apply for leave')}</button><button class="chip quick-question">${tr('احتاج بدل سكن','I need housing allowance')}</button>`}</div></div><aside class="card source-side"><span class="eyebrow">${tr('المصادر الحالية','Current sources')}</span><h3>${knowledgeBase.length}</h3><p>${tr('المساعد لا يجيب من ذاكرته العامة في سياسات المعهد. كل جواب مرتبط بمصدر داخلي ظاهر لك.','The assistant does not use general memory for institute policy. Every answer is tied to a visible internal source.')}</p>${knowledgeBase.map(s=>`<button class="mini-source source-link" data-source="${s.id}"><b>${h(s.code)}</b><span>${h(localize(s,'title'))}</span></button>`).join('')}</aside></section>`;
}

function knowledgePanel(){return `<section class="section-head"><div><span class="eyebrow">${tr('المكتبة الداخلية','Internal library')}</span><h2>${tr('الإجراءات والنماذج المتاحة','Available procedures and forms')}</h2><p>${tr('النسخ الحالية مؤقتة للتجربة وسيتم استبدالها بالنسخ الجديدة المعتمدة.','Current versions are temporary for the pilot and will be replaced by the new approved versions.')}</p></div></section><div class="knowledge-grid">${knowledgeBase.map(s=>`<article class="card knowledge-card">${sourceBadge(s)}<h3>${h(localize(s,'title'))}</h3>${sourceMeta(s)}<p>${h(localize(s,'summary'))}</p><div class="forms-mini">${s.relatedForms.map(f=>`<span>${h(f.code)} · ${h(localize(f,'title'))} ${f.indexed?'✓':''}</span>`).join('')}</div><button class="outline source-link" data-source="${s.id}">${tr('عرض المصدر','View source')}</button></article>`).join('')}</div>`}

function sourcePanel(){const s=sourceById(state.activeSourceId);if(!s)return knowledgePanel();return `<button class="back" data-panel="knowledge">← ${tr('العودة للمكتبة','Back to library')}</button><article class="card source-detail">${sourceBadge(s)}<div class="source-title"><div><span class="eyebrow">${h(s.code)}</span><h2>${h(localize(s,'title'))}</h2></div>${sourceMeta(s)}</div><p class="lead">${h(localize(s,'summary'))}</p><div class="source-note">${tr('المساعد ملزم بهذه المعلومات ولا يستنتج سياسة غير مكتوبة.','The assistant is constrained to this information and does not infer unwritten policy.')}</div><div class="steps">${s.sourceTextAr.map((x,i)=>`<div><b>${i+1}</b><span>${h(x)}</span></div>`).join('')}</div><h3>${tr('النماذج المرتبطة','Related forms')}</h3><div class="related-list">${s.relatedForms.map(f=>formActionBlock(f.code)).join('')}</div></article>`}

function inputControl(form,f,value=''){
  if(!fieldVisible(f,state.formDraft))return '';
  const label=h(localize(f,'label'));const req=f.required?' *':'';const options=fieldOptions(f,form);
  if(f.type==='select')return `<label class="field"><span>${label}${req}</span><select name="${f.id}" ${f.required?'required':''}><option value="">${tr('اختر','Select')}</option>${options.map(o=>`<option value="${h(o)}" ${String(value)===String(o)?'selected':''}>${h(fieldOptionLabel(f,o))}</option>`).join('')}</select></label>`;
  if(f.type==='textarea')return `<label class="field wide"><span>${label}${req}</span><textarea name="${f.id}" ${f.required?'required':''}>${h(value)}</textarea></label>`;
  return `<label class="field"><span>${label}${req}</span><input type="${h(f.type||'text')}" name="${f.id}" value="${h(value)}" ${f.required?'required':''} ${f.auto||f.calculated?'readonly':''}></label>`;
}

function openFormForReview(code){const found=formByCode(code);if(!found||!found.form.indexed)return;const e=formEligibility(found.form);if(e.checked&&!e.eligible){state.messages.push({role:'ai',text:eligibilityMessage(found.form),sourceIds:[found.source.id]});state.panel='assistant';persistChat();render();return}state.activeFormCode=code;if(!Object.keys(state.formDraft).length)state.formDraft=prepareFormDraft(found.form,{});updateCalculated(found.form,state.formDraft);state.reviewMode=true;state.panel='form';render()}

function formPanel(){
  const found=formByCode(state.activeFormCode);if(!found)return assistantPanel();const {source,form}=found;if(!form.indexed)return `<div class="card"><h2>${h(form.code)}</h2><p>${tr('ملف النموذج نفسه غير مفهرس، لذلك لن أنشئ حقولا من عندي.','The actual form is not indexed, so I will not invent fields.')}</p></div>`;
  const e=formEligibility(form);if(e.checked&&!e.eligible)return `<button class="back" data-panel="assistant">← ${tr('العودة للمساعد','Back to assistant')}</button><div class="card"><h2>${h(form.code)}</h2><div class="source-note">${h(eligibilityMessage(form))}</div></div>`;
  if(state.reviewMode)return draftPreview(source,form);
  if(!Object.keys(state.formDraft).length)state.formDraft=prepareFormDraft(form,{});
  return `<button class="back" data-panel="assistant">← ${tr('العودة للمساعد','Back to assistant')}</button><section class="form-layout"><div class="card"><span class="eyebrow">${tr('تعديل المسودة','Edit draft')}</span><h2>${h(form.code)} — ${h(localize(form,'title'))}</h2>${form.eligibility?`<div class="auto-fill-banner"><strong>${tr('تم التحقق من الاستحقاق','Eligibility verified')}</strong><span>${h(eligibilityMessage(form))}</span></div>`:''}<div class="auto-fill-banner"><strong>${tr('تعبئة تلقائية مفعلة','Auto-fill enabled')}</strong><span>${tr(`تم جلب ${autoFilledLabels(form).length} حقول من ملف الموظف تلقائيا.`,`Loaded ${autoFilledLabels(form).length} fields automatically from the employee profile.`)}</span></div><form id="guidedForm" class="form-grid">${form.fields.map(f=>inputControl(form,f,state.formDraft[f.id]||'')).join('')}<div class="form-actions wide"><button class="primary" type="submit">${tr('مراجعة المسودة','Review draft')}</button></div></form></div><aside class="card form-source"><span class="eyebrow">${tr('المصدر','Source')}</span><h3>${h(source.code)}</h3><p>${h(localize(source,'title'))}</p>${sourceBadge(source)}${sourceMeta(source)}</aside></section>`;
}

function draftPreview(source,form){
  updateCalculated(form,state.formDraft);const rows=(form.fields||[]).filter(f=>fieldVisible(f,state.formDraft)).map(f=>`<div class="preview-row ${f.auto?'auto-row':''}"><span>${h(localize(f,'label'))}${f.auto?` · ${tr('تلقائي','Auto')}`:''}${f.calculated?` · ${tr('محسوب','Calculated')}`:''}</span><strong>${h(state.formDraft[f.id]||tr('غير مدخل','Not entered'))}</strong></div>`).join('');
  return `<button class="back edit-draft">← ${tr('تعديل البيانات','Edit data')}</button><section class="card draft"><div class="draft-head"><div><span class="eyebrow">${tr('مسودة جاهزة للمراجعة','Prepared draft for review')}</span><h2>${h(form.code)} — ${h(localize(form,'title'))}</h2></div>${sourceBadge(source)}</div>${form.eligibility?`<div class="auto-fill-banner"><strong>${tr('الاستحقاق','Eligibility')}</strong><span>${h(eligibilityMessage(form))}</span></div>`:''}<div class="auto-fill-banner"><strong>${tr('المنصة عبأت بيانات ملفك تلقائيا','Profile data was auto-filled')}</strong><span>${h(autoFilledLabels(form).join('، '))}</span></div><div class="preview-section"><div class="preview-grid">${rows}</div></div><div class="source-note">${tr('هذه مسودة فقط. لم يتم إرسالها أو توقيعها أو اعتمادها.','This is a draft only. It has not been submitted, signed, or approved.')}</div></section>`;
}

function loginView(){applyLocale();app.innerHTML=`<div class="login-shell"><div class="login-copy"><span class="ai-pill">NDR Smart Hub</span><h1>${tr('اعرف الإجراء وخلي المنصة تجهز النموذج','Know the procedure and let the platform prepare the form')}</h1><p>${tr('نسخة تجريبية لمساعد الموظفين اعتمادا على الإجراءات والنماذج الداخلية.','Pilot employee assistant based on internal procedures and forms.')}</p></div><div class="login-card card"><div class="lang-row"><button data-lang="ar">العربية</button><button data-lang="en">English</button></div><h2>${tr('دخول تجريبي','Demo login')}</h2><label class="field"><span>${tr('المستخدم','User')}</span><select id="loginUser">${users.filter(u=>u.role!=='system_admin').map(u=>`<option value="${u.id}">${h(userName(u))} — ${h(userTitle(u))}</option>`).join('')}</select></label><button id="loginBtn" class="primary full">${tr('دخول','Sign in')}</button></div></div>`;document.querySelector('#loginBtn').onclick=()=>login(document.querySelector('#loginUser').value);document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>setLanguage(b.dataset.lang))}

function shell(){const content=state.panel==='knowledge'?knowledgePanel():state.panel==='source'?sourcePanel():state.panel==='form'?formPanel():assistantPanel();return `<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">NDR</div><div><strong>Smart Hub</strong><small>${tr('بوابة المعرفة الداخلية','Internal Knowledge Portal')}</small></div></div><nav><button data-panel="assistant" class="${state.panel==='assistant'?'active':''}">${tr('اسأل المساعد','Ask Assistant')}</button><button data-panel="knowledge" class="${['knowledge','source'].includes(state.panel)?'active':''}">${tr('مكتبة الإجراءات','Procedure Library')}</button></nav><div class="sidebar-foot"><div class="user-card"><div class="avatar">${h(userName(state.user).slice(0,1))}</div><div><strong>${h(userName(state.user))}</strong><small>${h(userTitle(state.user))}</small></div></div><div class="foot-actions"><button id="langSwitch">${isEn()?'العربية':'English'}</button><button id="logoutBtn">${tr('خروج','Logout')}</button></div></div></aside><main class="main"><div class="topbar"><div><span class="eyebrow">${tr('تجربة بوابة المعرفة','Knowledge portal pilot')}</span><h1>${state.panel==='knowledge'?tr('المكتبة','Library'):state.panel==='source'?tr('تفاصيل المصدر','Source details'):state.panel==='form'?tr('النموذج','Form'):tr('مساعد الموظف','Employee Assistant')}</h1></div><div class="top-note">${tr('المصادر الحالية مؤقتة للتجربة','Current sources are temporary for pilot')}</div></div>${content}</main></div>`}

function bind(){
  document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{state.panel=b.dataset.panel;state.reviewMode=false;render()});
  document.querySelector('#logoutBtn')?.addEventListener('click',logout);
  document.querySelector('#langSwitch')?.addEventListener('click',()=>setLanguage(isEn()?'ar':'en'));
  document.querySelector('#sendQuestion')?.addEventListener('click',()=>{const el=document.querySelector('#question');askQuestion(el?.value);if(el)el.value=''});
  document.querySelector('#question')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();const v=e.target.value;e.target.value='';askQuestion(v)}});
  document.querySelectorAll('.quick-question').forEach(b=>b.onclick=()=>askQuestion(b.textContent));
  document.querySelectorAll('.field-option').forEach(b=>b.onclick=()=>handleFormReply(b.dataset.value));
  document.querySelectorAll('.source-link').forEach(b=>b.onclick=()=>{state.activeSourceId=b.dataset.source;state.panel='source';render()});
  document.querySelectorAll('.smart-fill').forEach(b=>b.onclick=()=>startFormSession(b.dataset.form,{}));
  document.querySelectorAll('.review-smart-form').forEach(b=>b.onclick=()=>openFormForReview(b.dataset.form));
  document.querySelectorAll('.restart-smart-form').forEach(b=>b.onclick=()=>startFormSession(b.dataset.form,{}));
  document.querySelector('.cancel-form')?.addEventListener('click',()=>{state.formSession=null;state.formDraft={};state.messages.push({role:'ai',text:tr('تم إلغاء تعبئة النموذج. تقدر تسألني عن أي إجراء آخر.','Form filling was cancelled. You can ask about another procedure.')});persistChat();render()});
  document.querySelector('#guidedForm')?.addEventListener('submit',e=>{e.preventDefault();const found=formByCode(state.activeFormCode);const data=Object.fromEntries(new FormData(e.currentTarget).entries());state.formDraft={...state.formDraft,...data};updateCalculated(found.form,state.formDraft);state.reviewMode=true;render()});
  document.querySelector('.edit-draft')?.addEventListener('click',()=>{state.reviewMode=false;render()});
}

function render(){applyLocale();if(!state.user)return loginView();app.innerHTML=shell();bind()}
render();
