export const knowledgeBase = [
  {
    id: 'leave-procedure',
    area: 'hr',
    title: 'إجراءات الإجازات',
    titleEn: 'Leave Procedures',
    code: 'HR-P-07',
    revision: 'R5',
    sourceDate: '2025-04-13',
    status: 'temporary-pilot',
    sourceName: 'HR-P-07-إجراءات الإجازات (R5).docx',
    keywords: ['اجازة','إجازة','سنوية','قصيرة','سفر','عودة من الاجازة','leave','vacation','annual leave','short leave'],
    summary: 'الإجراء الحالي يوضح آلية طلب الإجازة والنماذج المرتبطة بها ومسار التوقيعات والمراجعة. يستخدم مؤقتا في التجربة إلى أن يتم رفع الإصدار الجديد.',
    summaryAr: 'الإجراء الحالي يوضح آلية طلب الإجازة والنماذج المرتبطة بها ومسار التوقيعات والمراجعة. يستخدم مؤقتا في التجربة إلى أن يتم رفع الإصدار الجديد.',
    summaryEn: 'The current procedure explains leave requests, related forms and review steps. It is used temporarily for the pilot until the new approved version is uploaded.',
    sourceTextAr: [
      'يبدأ طلب الإجازة بتعبئة نموذج HR-F-12 من الموظف مع توقيع الموظف والموظف المناوب ومدير أو مشرف الإدارة.',
      'يتم التحقق من مواعيد السفر والاستحقاق وفق تاريخ الانضمام أو آخر إجازة وحسب العقد.',
      'تدقق إدارة المحاسبة نموذج HR-F-12 ثم يرفع للرئيس التنفيذي للموافقة النهائية وبعدها يرسل لقسم الموارد البشرية.',
      'إذا كان الطلب إجازة قصيرة أقل من 7 أيام فيستخدم النموذج HR-F-20.',
      'عند العودة من الإجازة السنوية يستخدم نموذج HR-F-21 في يوم استئناف العمل.',
      'طلبات الإجازات ترسل بالبريد الإلكتروني إلى الموارد البشرية بعد استكمال التوقيعات المطلوبة.'
    ],
    relatedForms: [
      { code:'HR-F-12', title:'نموذج طلب إجازة', titleEn:'Leave Request Form', indexed:false, note:'النموذج مذكور في الإجراء لكن ملفه وحقوله لم تتم فهرستها بعد.', noteAr:'النموذج مذكور في الإجراء لكن ملفه وحقوله لم تتم فهرستها بعد.', noteEn:'The form is referenced by the procedure but its file and fields are not indexed yet.' },
      { code:'HR-F-20', title:'نموذج طلب إجازة قصيرة', titleEn:'Short Leave Form', indexed:false, note:'يستخدم حسب الإجراء للإجازة الأقل من 7 أيام.', noteAr:'يستخدم حسب الإجراء للإجازة الأقل من 7 أيام.', noteEn:'Used by the procedure for leave shorter than 7 days.' },
      { code:'HR-F-21', title:'نموذج العودة من الإجازة', titleEn:'Return From Leave Form', indexed:false, note:'يعبأ في يوم استئناف العمل بعد الإجازة السنوية.', noteAr:'يعبأ في يوم استئناف العمل بعد الإجازة السنوية.', noteEn:'Completed on the day work resumes after annual leave.' },
      { code:'HR-F-13', title:'نموذج طلب خدمة إدارية', titleEn:'Administrative Service Request', indexed:false, note:'يرتبط بالتأشيرة وبدل التذكرة حسب ما ورد في الإجراء.', noteAr:'يرتبط بالتأشيرة وبدل التذكرة حسب ما ورد في الإجراء.', noteEn:'Referenced for visa and ticket-related processing in the procedure.' }
    ]
  },
  {
    id: 'housing-procedure',
    area: 'hr',
    title: 'إجراء طلب صرف بدل السكن',
    titleEn: 'Advance Housing Allowance Procedure',
    code: 'HR-P-19',
    revision: 'R6',
    sourceDate: '2026-07-07',
    status: 'temporary-pilot',
    sourceName: 'HR-P-19 إجراء طلب صرف بدل السكن (R6)(1).docx',
    keywords: ['بدل السكن','سكن','مقدم سكن','صرف بدل السكن','housing','housing allowance','advance housing'],
    summary: 'ينظم الإجراء طلب واعتماد وصرف بدل السكن مقدما والتحقق من الاستحقاق والمراجعة المالية.',
    summaryAr: 'ينظم الإجراء طلب واعتماد وصرف بدل السكن مقدما والتحقق من الاستحقاق والمراجعة المالية.',
    summaryEn: 'The procedure governs advance housing allowance requests, eligibility review and financial processing.',
    sourceTextAr: [
      'يقوم الموظف بتعبئة نموذج HR-F-29 واستكمال البيانات وتوقيع الإقرار والتعهد.',
      'تراجع الموارد البشرية البيانات وتتحقق من استيفاء شروط الاستحقاق ثم تحيل الطلب إلى المحاسبة.',
      'تراجع المحاسبة الطلب ماليا وتتأكد من مبلغ الاستحقاق ثم ترفعه للرئيس التنفيذي للاعتماد النهائي.',
      'بعد الاعتماد تقوم المحاسبة بالصرف وتوثيق العملية.',
      'الاستحقاق يعتمد على مدة الخدمة والضوابط الواردة في الإجراء ولا يجوز تجاوز الحد الأعلى المسموح.'
    ],
    relatedForms: [
      {
        code:'HR-F-29', title:'نموذج طلب صرف بدل السكن', titleEn:'Advance Housing Allowance Request Form', indexed:true,
        assetPath:'assets/HR-F-29 نموذج طلب بدل سكن.xlsx',
        fields:[
          {id:'requestedMonths',label:'مدة الاستحقاق المطلوبة',labelEn:'Requested eligibility period',type:'select',required:true,options:['3','6','9','12']},
          {id:'requestedAmount',label:'المبلغ المطلوب',labelEn:'Requested amount',type:'number',required:true},
          {id:'repaymentMonths',label:'مدة السداد المطلوبة',labelEn:'Requested repayment period',type:'select',required:true,options:['3','6','9']},
          {id:'repaymentStart',label:'تاريخ بدء الخصم',labelEn:'Deduction start date',type:'date',required:true},
          {id:'employeeNote',label:'ملاحظات الموظف',labelEn:'Employee notes',type:'textarea',required:false}
        ]
      }
    ]
  },
  {
    id: 'attendance-form',
    area: 'hr',
    title: 'مذكرة الحضور',
    titleEn: 'Attendance Memo',
    code: 'HR-F-25',
    revision: 'Pilot source',
    status: 'temporary-pilot',
    sourceName: 'HR-F-25 مذكرة الحضور',
    keywords: ['تأخير','متأخر','نسيت البصمة','لم ابصم','خروج مبكر','غائب','عمل عن بعد','attendance','late','missed punch','early departure'],
    summary: 'النموذج يستخدم لتوضيح أو تصحيح حالات الحضور مثل الغياب والتأخر والخروج المبكر والبصمة المفقودة والعمل عن بعد.',
    summaryAr: 'النموذج يستخدم لتوضيح أو تصحيح حالات الحضور مثل الغياب والتأخر والخروج المبكر والبصمة المفقودة والعمل عن بعد.',
    summaryEn: 'The form is used to explain or correct attendance events such as absence, lateness, early departure, missed punch and remote work.',
    sourceTextAr: [
      'يتضمن النموذج بيانات الموظف والرقم الوظيفي والقسم وتاريخ الحالة ووقت الدخول والخروج والسبب.',
      'الحالات الظاهرة في النموذج تشمل غائب وخروج مبكر ومتأخر ولم يبصم والعمل عن بعد وأخرى.',
      'يحتوي النموذج على قسم للمشرف المباشر ومدير القسم ثم اعتماد الموارد البشرية.',
      'النموذج لا يستخدم بديلا عن الإجازة القصيرة.'
    ],
    relatedForms:[
      {
        code:'HR-F-25',title:'مذكرة الحضور',titleEn:'Attendance Memo',indexed:true,assetPath:'assets/HR-F-25 مذكرة الحضور.pdf',
        fields:[
          {id:'attendanceDate',label:'تاريخ الحالة',labelEn:'Attendance event date',type:'date',required:true},
          {id:'caseType',label:'نوع الحالة',labelEn:'Case type',type:'select',required:true,options:['غائب','خروج مبكر','متأخر','لم يبصم','العمل عن بعد','أخرى']},
          {id:'inTime',label:'وقت الدخول الفعلي',labelEn:'Actual clock-in time',type:'time',required:false},
          {id:'outTime',label:'وقت الخروج الفعلي',labelEn:'Actual clock-out time',type:'time',required:false},
          {id:'reason',label:'السبب والتوضيح',labelEn:'Reason and explanation',type:'textarea',required:true}
        ]
      }
    ]
  }
];

export function normalizeText(value='') {
  return String(value).toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^a-z0-9؀-ۿ\s-]/g,' ').replace(/\s+/g,' ').trim();
}

export function rankKnowledge(question='') {
  const q = normalizeText(question);
  const words = q.split(' ').filter(w => w.length > 1);
  return knowledgeBase.map(item => {
    const hay = normalizeText([item.title,item.titleEn,item.code,item.summaryAr,item.summaryEn,...item.keywords,...item.sourceTextAr].join(' '));
    let score = 0;
    item.keywords.forEach(k => { if (q.includes(normalizeText(k))) score += 12; });
    if (q.includes(normalizeText(item.code))) score += 20;
    words.forEach(w => { if (hay.includes(w)) score += 1; });
    return {item,score};
  }).sort((a,b)=>b.score-a.score);
}
