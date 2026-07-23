export const employees = [
  { id:'E001', name:'نادر الجهني', email:'nader@institute.local', departmentId:'hr', department:'الموارد البشرية', title:'أخصائي موارد بشرية', managerId:'M001', manager:'مدير الموارد البشرية', role:'employee' },
  { id:'E002', name:'أحمد', email:'ahmed@institute.local', departmentId:'hr', department:'الموارد البشرية', title:'أخصائي موارد بشرية', managerId:'M001', manager:'مدير الموارد البشرية', role:'specialist' },
  { id:'M001', name:'مدير الموارد البشرية', email:'hr.manager@institute.local', departmentId:'hr', department:'الموارد البشرية', title:'مدير الموارد البشرية', managerId:'GM01', manager:'المدير العام', role:'manager' },
  { id:'GM01', name:'المدير العام', email:'gm@institute.local', departmentId:'executive', department:'الإدارة العليا', title:'المدير العام', managerId:null, manager:null, role:'admin' }
];

export const departments = [
  { id:'hr', name:'الموارد البشرية', icon:'users', description:'الموظفون والتوظيف والتطوير والخدمات الوظيفية' },
  { id:'training', name:'إدارة التدريب', icon:'book', description:'البرامج التدريبية والمدربين والجداول' },
  { id:'trainees', name:'شؤون المتدربين', icon:'graduation', description:'خدمات المتدربين والمتابعة الأكاديمية' },
  { id:'accounting', name:'المحاسبة والمالية', icon:'wallet', description:'الخدمات المالية والمطالبات والصرف' },
  { id:'quality', name:'الجودة', icon:'shield', description:'السياسات والإجراءات والنماذج والامتثال' },
  { id:'marketing', name:'التسويق', icon:'megaphone', description:'الخدمات التسويقية والهوية والطلبات' },
  { id:'it', name:'تقنية المعلومات', icon:'cpu', description:'الأنظمة والحسابات والدعم التقني' },
  { id:'admin', name:'الخدمات الإدارية', icon:'building', description:'الخدمات والمرافق والطلبات الإدارية' }
];

export const services = [
  {
    id:'housing', department:'hr', name:'طلب صرف بدل السكن', code:'HR-F-29', procedure:'HR-P-19',
    mode:'FORM_WORKFLOW', readiness:'demo', active:true,
    description:'تجهيز نموذج بدل السكن ومراجعته وإرساله لمسار الاعتماد.',
    requirements:['استيفاء شروط الاستحقاق حسب الإجراء المعتمد','تحديد بيانات الصرف ومدة السداد عند الحاجة'],
    attachments:[],
    fields:[
      {id:'amount', label:'المبلغ المطلوب', type:'number', placeholder:'مثال: 18000', required:true, suffix:'ريال'},
      {id:'installments', label:'مدة السداد', type:'select', required:true, options:['3 أشهر','6 أشهر','9 أشهر']},
      {id:'startDate', label:'تاريخ بدء الخصم', type:'date', required:true},
      {id:'notes', label:'ملاحظات', type:'textarea', required:false, placeholder:'أي تفاصيل إضافية عند الحاجة'}
    ],
    workflow:[
      {key:'manager', label:'المدير المباشر', role:'manager'},
      {key:'specialist', label:'الموارد البشرية', role:'specialist'},
      {key:'complete', label:'مكتمل', role:'system'}
    ],
    steps:['مراجعة شروط الاستحقاق','تعبئة بيانات الموظف تلقائيا','إدخال البيانات المتغيرة','مراجعة النموذج','إرسال الطلب لمسار الاعتماد'],
    source:'محتوى تجريبي حتى رفع النسخة المعتمدة من HR-P-19 وHR-F-29.'
  },
  {
    id:'cert-support', department:'hr', name:'دعم الدورات والشهادات المهنية', code:'يحدد من الملف المعتمد', procedure:'HR-P-15',
    mode:'FORM_PORTAL', readiness:'demo', active:true,
    description:'التحقق من أهلية الدعم وتجهيز الطلب ثم توجيه الموظف لطريقة التقديم الرسمية.',
    requirements:['استيفاء شروط الإجراء المعتمد','إرفاق بيانات الدورة أو الشهادة'],
    attachments:['عرض السعر أو إثبات التكلفة','معلومات الشهادة أو الدورة'],
    fields:[
      {id:'certificateName', label:'اسم الدورة أو الشهادة', type:'text', required:true, placeholder:'مثال: SHRM-CP'},
      {id:'provider', label:'الجهة المقدمة', type:'text', required:true, placeholder:'اسم الجهة'},
      {id:'cost', label:'التكلفة المتوقعة', type:'number', required:true, suffix:'ريال'},
      {id:'startDate', label:'تاريخ البداية المتوقع', type:'date', required:true},
      {id:'notes', label:'ملاحظات', type:'textarea', required:false}
    ],
    workflow:[
      {key:'manager', label:'المدير المباشر', role:'manager'},
      {key:'specialist', label:'الموارد البشرية', role:'specialist'},
      {key:'portal', label:'استكمال التقديم في البورتال', role:'employee'},
      {key:'complete', label:'مكتمل', role:'system'}
    ],
    steps:['التحقق من الأهلية','تعبئة البيانات','رفع المرفقات','مراجعة الطلب','إكمال التقديم في البورتال حسب الدليل'],
    source:'محتوى تجريبي حتى رفع HR-P-15 والنموذج ودليل البورتال المعتمد.'
  },
  {
    id:'business-trip', department:'hr', name:'رحلة العمل', code:'HR-F-13', procedure:'إجراء رحلة العمل',
    mode:'FORM_WORKFLOW', readiness:'demo', active:true,
    description:'تجهيز بيانات رحلة العمل والمرفقات وإرسالها لمسار الاعتماد المناسب.',
    requirements:['وجود مهمة أو تكليف عمل معتمد'],
    attachments:['المستندات المؤيدة عند الحاجة'],
    fields:[
      {id:'destination', label:'وجهة الرحلة', type:'text', required:true, placeholder:'مثال: الرياض'},
      {id:'purpose', label:'الغرض من الرحلة', type:'textarea', required:true, placeholder:'وصف مختصر للمهمة'},
      {id:'startDate', label:'تاريخ بداية الرحلة', type:'date', required:true},
      {id:'endDate', label:'تاريخ نهاية الرحلة', type:'date', required:true},
      {id:'transport', label:'وسيلة النقل المطلوبة', type:'select', required:true, options:['تذكرة طيران','سيارة','لا يوجد']}
    ],
    workflow:[
      {key:'manager', label:'المدير المباشر', role:'manager'},
      {key:'specialist', label:'الموارد البشرية', role:'specialist'},
      {key:'complete', label:'مكتمل', role:'system'}
    ],
    steps:['إدخال بيانات الرحلة','إرفاق المستندات','مراجعة الطلب','الإرسال للاعتماد','متابعة حالة المعاملة'],
    source:'محتوى تجريبي حتى ربط الإجراء والنموذج المعتمدين.'
  },
  {
    id:'sick-leave', department:'hr', name:'الإجازة المرضية', code:'-', procedure:'إجراء الإجازات',
    mode:'PORTAL_ONLY', readiness:'demo', active:true,
    description:'عرض المتطلبات ثم توجيه الموظف إلى خطوات التقديم الصحيحة في البورتال.',
    requirements:['إرفاق المستند الطبي المطلوب حسب الإجراء المعتمد'],
    attachments:['مستند طبي'], fields:[], workflow:[],
    steps:['مراجعة المتطلبات','فتح البورتال','اختيار خدمة الإجازات','إنشاء طلب إجازة مرضية','رفع المرفق','إرسال الطلب'],
    portalGuide:['فتح البورتال بحساب الموظف','الدخول إلى خدمات الإجازات','اختيار إجازة مرضية','تحديد المدة','رفع المستند الطبي','إرسال الطلب ومتابعة حالته'],
    source:'محتوى تجريبي حتى ربط إجراء الإجازات ودليل البورتال المعتمد.'
  }
];

export const demoRequests = [
  {
    id:'REQ-26001', ownerId:'E001', serviceId:'cert-support', service:'دعم الدورات والشهادات المهنية', createdAt:'2026-07-21T09:30:00',
    status:'pending', stepIndex:0, formData:{certificateName:'SHRM-CP',provider:'SHRM',cost:'2500',startDate:'2026-08-15',notes:''},
    timeline:[
      {at:'2026-07-21T09:30:00', actor:'نادر الجهني', action:'أنشأ الطلب وأرسله للاعتماد', type:'created'}
    ]
  },
  {
    id:'REQ-25984', ownerId:'E001', serviceId:'housing', service:'طلب صرف بدل السكن', createdAt:'2026-07-14T10:00:00',
    status:'completed', stepIndex:3, formData:{amount:'18000',installments:'6 أشهر',startDate:'2026-08-01',notes:''},
    timeline:[
      {at:'2026-07-14T10:00:00', actor:'نادر الجهني', action:'أنشأ الطلب', type:'created'},
      {at:'2026-07-14T11:15:00', actor:'مدير الموارد البشرية', action:'اعتمد الطلب', type:'approved'},
      {at:'2026-07-14T13:20:00', actor:'أحمد', action:'أكمل مراجعة الموارد البشرية', type:'approved'},
      {at:'2026-07-14T13:21:00', actor:'النظام', action:'أغلق الطلب كمكتمل', type:'completed'}
    ]
  },
  {
    id:'REQ-25971', ownerId:'E001', serviceId:'business-trip', service:'رحلة العمل', createdAt:'2026-07-09T08:20:00',
    status:'returned', stepIndex:0, formData:{destination:'الرياض',purpose:'اجتماع عمل',startDate:'2026-07-28',endDate:'2026-07-29',transport:'تذكرة طيران'}, returnReason:'يرجى توضيح الغرض من الرحلة بشكل أدق',
    timeline:[
      {at:'2026-07-09T08:20:00', actor:'نادر الجهني', action:'أنشأ الطلب', type:'created'},
      {at:'2026-07-09T09:05:00', actor:'مدير الموارد البشرية', action:'أعاد الطلب للاستكمال: يرجى توضيح الغرض من الرحلة بشكل أدق', type:'returned'}
    ]
  }
];

export const knowledge = [
  {id:'k1', type:'إجراء', title:'HR-P-15 دعم الدورات والشهادات المهنية', department:'الموارد البشرية', version:'سيتم الربط بالنسخة المعتمدة', status:'demo'},
  {id:'k2', type:'إجراء', title:'HR-P-19 طلب صرف بدل السكن', department:'الموارد البشرية', version:'سيتم الربط بالنسخة المعتمدة', status:'demo'},
  {id:'k3', type:'دليل', title:'دليل استخدام البورتال', department:'الموارد البشرية', version:'بانتظار رفع الدليل', status:'demo'}
];
