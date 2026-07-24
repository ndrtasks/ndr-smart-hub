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
    keywords: ['اجازة','إجازة','سنوية','طوارئ','طارئة','قصيرة','سفر','عودة من الاجازة','leave','vacation','annual leave','emergency leave','short leave'],
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
      {
        code:'HR-F-12', title:'نموذج طلب إجازة', titleEn:'Vacation Request Form', indexed:true, revision:'4',
        sourceName:'محدثHR-F-12 نموذج طلب اجازة.pdf',
        note:'تمت فهرسة حقول الموظف من النموذج الحالي للتجربة. الحقول الخاصة بالموارد البشرية والمحاسبة والاعتمادات لا يعبئها الموظف.',
        noteAr:'تمت فهرسة حقول الموظف من النموذج الحالي للتجربة. الحقول الخاصة بالموارد البشرية والمحاسبة والاعتمادات لا يعبئها الموظف.',
        noteEn:'Employee fields from the current form are indexed for the pilot. HR, accounting and approval-only fields are not completed by the employee.',
        fields:[
          {id:'requestDate',label:'تاريخ الطلب',labelEn:'Request date',type:'date',required:true,auto:'today',ask:false},
          {id:'employeeId',label:'الرقم الوظيفي',labelEn:'Employee ID',type:'text',required:true,auto:'id',ask:false},
          {id:'employeeName',label:'اسم الموظف',labelEn:'Employee name',type:'text',required:true,auto:'name',ask:false},
          {id:'position',label:'المسمى الوظيفي',labelEn:'Position',type:'text',required:true,auto:'title',ask:false},
          {id:'department',label:'الإدارة / القسم',labelEn:'Department / Section',type:'text',required:true,auto:'department',ask:false},
          {id:'joiningDate',label:'تاريخ التعيين',labelEn:'Joining date',type:'date',required:true,auto:'joiningDate',ask:false},
          {id:'vacationContact',label:'رقم التواصل أثناء الإجازة',labelEn:'Contact number during vacation',type:'tel',required:true,prompt:'وش رقم التواصل معك أثناء الإجازة؟',promptEn:'What contact number should be used during your vacation?'},
          {id:'mobile',label:'رقم الجوال',labelEn:'Mobile number',type:'tel',required:true,prompt:'وش رقم جوالك؟ إذا هو نفسه رقم التواصل أثناء الإجازة اكتب: نفس الرقم',promptEn:'What is your mobile number? If it is the same as the vacation contact number, say: same number.'},
          {id:'nationality',label:'الجنسية',labelEn:'Nationality',type:'text',required:true,prompt:'ما جنسيتك؟',promptEn:'What is your nationality?'},
          {id:'lastVacationDate',label:'تاريخ آخر إجازة',labelEn:'Last vacation date',type:'date',required:false,prompt:'هل تعرف تاريخ آخر إجازة لك؟ اكتب التاريخ أو اكتب: لا أعرف',promptEn:'Do you know your last vacation date? Enter it or say: I do not know.'},
          {id:'vacationFrom',label:'الإجازة من',labelEn:'Vacation from',type:'date',required:true,prompt:'متى تبدأ الإجازة؟',promptEn:'When does the vacation start?'},
          {id:'vacationTo',label:'الإجازة إلى',labelEn:'Vacation to',type:'date',required:true,prompt:'متى تنتهي الإجازة؟',promptEn:'When does the vacation end?'},
          {id:'days',label:'عدد الأيام',labelEn:'Number of days',type:'number',required:true,calculated:'dateDiffInclusive',ask:false},
          {id:'vacationType',label:'نوع الإجازة',labelEn:'Vacation type',type:'select',required:true,options:['إجازة سنوية','إجازة طارئة','أخرى'],optionLabelsEn:{'إجازة سنوية':'Annual Vacation','إجازة طارئة':'Emergency Vacation','أخرى':'Other'},prompt:'وش نوع الإجازة؟',promptEn:'What type of vacation is this?'},
          {id:'otherType',label:'نوع آخر',labelEn:'Other type',type:'text',required:false,showWhen:{field:'vacationType',equals:'أخرى'},prompt:'حدد نوع الإجازة الأخرى.',promptEn:'Specify the other vacation type.'},
          {id:'exitReentry',label:'تأشيرة خروج وعودة',labelEn:'Exit / Re-entry visa',type:'select',required:false,options:['لا أحتاج','شخصي','لعائلتي'],optionLabelsEn:{'لا أحتاج':'Not needed','شخصي':'Myself','لعائلتي':'My family'},prompt:'هل تحتاج تأشيرة خروج وعودة؟',promptEn:'Do you need an exit/re-entry visa?'},
          {id:'passportsAttached',label:'عدد الجوازات المرفقة',labelEn:'Number of passports attached',type:'number',required:false,showWhenAny:[{field:'exitReentry',equals:'شخصي'},{field:'exitReentry',equals:'لعائلتي'}],prompt:'كم عدد الجوازات المرفقة؟',promptEn:'How many passports are attached?'},
          {id:'departmentRemarks',label:'ملاحظات الموظف',labelEn:'Employee remarks',type:'textarea',required:false,prompt:'هل عندك ملاحظة إضافية للطلب؟ اكتبها أو اكتب: لا',promptEn:'Any additional note for the request? Enter it or say: no.'},
          {id:'alternateEmployee',label:'اسم الموظف البديل',labelEn:'Alternate employee name',type:'text',required:true,prompt:'من الموظف البديل أثناء إجازتك؟',promptEn:'Who is the alternate employee during your vacation?'}
        ]
      },
      { code:'HR-F-20', title:'نموذج طلب إجازة قصيرة', titleEn:'Short Leave Form', indexed:false, note:'يستخدم حسب الإجراء للإجازة الأقل من 7 أيام. ملف النموذج نفسه غير متوفر حاليا ضمن الملفات المفهرسة.', noteAr:'يستخدم حسب الإجراء للإجازة الأقل من 7 أيام. ملف النموذج نفسه غير متوفر حاليا ضمن الملفات المفهرسة.', noteEn:'Used by the procedure for leave shorter than 7 days. The actual form file is not currently available in the indexed files.' },
      { code:'HR-F-21', title:'نموذج العودة من الإجازة', titleEn:'Return From Leave Form', indexed:false, note:'يعبأ في يوم استئناف العمل بعد الإجازة السنوية. ملف النموذج نفسه غير مفهرس حاليا.', noteAr:'يعبأ في يوم استئناف العمل بعد الإجازة السنوية. ملف النموذج نفسه غير مفهرس حاليا.', noteEn:'Completed on the day work resumes after annual leave. The actual form is not indexed yet.' },
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
      'الحد الأدنى للاستحقاق يبدأ من خدمة 3 سنوات ونصف.',
      'من 3 سنوات ونصف إلى أقل من 5 سنوات يكون الخيار المتاح 3 أشهر.',
      'من 5 سنوات إلى أقل من 6 سنوات تكون الخيارات المتاحة 6 أو 9 أشهر.',
      'من 6 سنوات فأكثر يكون الحد الأعلى 12 شهرا ويجوز اختيار مدة أقل.',
      'تراجع الموارد البشرية البيانات وتتحقق من استيفاء شروط الاستحقاق ثم تحيل الطلب إلى المحاسبة.',
      'تراجع المحاسبة الطلب ماليا وتتأكد من مبلغ الاستحقاق ثم ترفعه للرئيس التنفيذي للاعتماد النهائي.',
      'بعد الاعتماد تقوم المحاسبة بالصرف وتوثيق العملية.'
    ],
    relatedForms: [
      {
        code:'HR-F-29', title:'نموذج طلب صرف بدل السكن', titleEn:'Advance Housing Allowance Request Form', indexed:true,
        note:'ملف النموذج الأصلي غير موجود حاليا داخل مستودع GitHub، لذلك تم إيقاف زر فتح الملف حتى لا يظهر خطأ 404.',
        noteAr:'ملف النموذج الأصلي غير موجود حاليا داخل مستودع GitHub، لذلك تم إيقاف زر فتح الملف حتى لا يظهر خطأ 404.',
        noteEn:'The original form file is not currently stored in the GitHub repository, so the open-file button is disabled to prevent a 404 error.',
        eligibility:{type:'SERVICE_MONTHS',minimumMonths:42,tiers:[
          {min:42,max:59,months:['3']},
          {min:60,max:71,months:['6','9']},
          {min:72,max:null,months:['3','6','9','12']}
        ]},
        fields:[
          {id:'employeeId',label:'الرقم الوظيفي',labelEn:'Employee ID',type:'text',required:true,auto:'id',ask:false},
          {id:'employeeName',label:'اسم الموظف',labelEn:'Employee name',type:'text',required:true,auto:'name',ask:false},
          {id:'position',label:'المسمى الوظيفي',labelEn:'Position',type:'text',required:true,auto:'title',ask:false},
          {id:'department',label:'الإدارة / القسم',labelEn:'Department',type:'text',required:true,auto:'department',ask:false},
          {id:'joiningDate',label:'تاريخ التعيين',labelEn:'Joining date',type:'date',required:true,auto:'joiningDate',ask:false},
          {id:'requestDate',label:'تاريخ الطلب',labelEn:'Request date',type:'date',required:true,auto:'today',ask:false},
          {id:'requestedMonths',label:'مدة بدل السكن المطلوبة',labelEn:'Requested housing period',type:'select',required:true,dynamicOptions:'HOUSING_ELIGIBILITY',prompt:'حسب مدة خدمتك، اختر مدة بدل السكن المتاحة لك.',promptEn:'Based on your service period, select an available housing allowance period.'},
          {id:'monthlyHousingAllowance',label:'بدل السكن الشهري',labelEn:'Monthly housing allowance',type:'number',required:true,auto:'housingAllowance',ask:false},
          {id:'requestedAmount',label:'إجمالي المبلغ',labelEn:'Total amount',type:'number',required:true,calculated:'housingTotal',ask:false},
          {id:'repaymentMonths',label:'مدة السداد المطلوبة',labelEn:'Requested repayment period',type:'select',required:true,options:['3','6','9'],prompt:'على كم شهر ترغب يكون السداد؟',promptEn:'Over how many months would you like to repay it?'},
          {id:'repaymentStart',label:'تاريخ بدء الخصم',labelEn:'Deduction start date',type:'date',required:true,prompt:'متى يبدأ الخصم؟ تقدر تكتب: اليوم أو 24/7 أو 24/7/2026.',promptEn:'When should deductions start? You can say: today or 24/7 or 24/7/2026.'},
          {id:'repaymentEnd',label:'تاريخ انتهاء الخصم',labelEn:'Deduction end date',type:'date',required:true,calculated:'repaymentEnd',ask:false},
          {id:'employeeNote',label:'ملاحظات الموظف',labelEn:'Employee notes',type:'textarea',required:false,prompt:'هل عندك ملاحظة إضافية؟ اكتبها أو اكتب: لا',promptEn:'Any additional note? Enter it or say: no.'}
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
    revision: 'R4',
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
          {id:'employeeId',label:'الرقم الوظيفي',labelEn:'Employee ID',type:'text',required:true,auto:'id',ask:false},
          {id:'employeeName',label:'اسم الموظف',labelEn:'Employee name',type:'text',required:true,auto:'name',ask:false},
          {id:'department',label:'القسم',labelEn:'Department',type:'text',required:true,auto:'department',ask:false},
          {id:'attendanceDate',label:'تاريخ الحالة',labelEn:'Attendance event date',type:'date',required:true,prompt:'متى حصلت حالة الحضور؟',promptEn:'When did the attendance event happen?'},
          {id:'caseType',label:'نوع الحالة',labelEn:'Case type',type:'select',required:true,options:['غائب','خروج مبكر','متأخر','لم يبصم','العمل عن بعد','أخرى'],prompt:'وش الحالة بالضبط؟',promptEn:'What exactly happened?'},
          {id:'inTime',label:'وقت الدخول الفعلي',labelEn:'Actual clock-in time',type:'time',required:false,prompt:'كم كان وقت الدخول الفعلي؟',promptEn:'What was the actual clock-in time?'},
          {id:'outTime',label:'وقت الخروج الفعلي',labelEn:'Actual clock-out time',type:'time',required:false,prompt:'كم كان وقت الخروج الفعلي؟',promptEn:'What was the actual clock-out time?'},
          {id:'reason',label:'السبب والتوضيح',labelEn:'Reason and explanation',type:'textarea',required:true,prompt:'اشرح لي السبب باختصار.',promptEn:'Briefly explain the reason.'}
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
