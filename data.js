export const employees = [
  { id:'E001', name:'نادر الجهني', email:'nader@institute.local', department:'الموارد البشرية', title:'أخصائي موارد بشرية', manager:'مدير الموارد البشرية', role:'employee' },
  { id:'E002', name:'أحمد', email:'ahmed@institute.local', department:'الموارد البشرية', title:'أخصائي موارد بشرية', manager:'مدير الموارد البشرية', role:'employee' },
  { id:'M001', name:'مدير الموارد البشرية', email:'hr.manager@institute.local', department:'الموارد البشرية', title:'مدير الموارد البشرية', manager:'المدير العام', role:'manager' },
  { id:'GM01', name:'المدير العام', email:'gm@institute.local', department:'الإدارة العليا', title:'المدير العام', manager:null, role:'admin' }
];

export const departments = [
  { id:'hr', name:'الموارد البشرية', count:4, icon:'HR' },
  { id:'training', name:'إدارة التدريب', count:0, icon:'TR' },
  { id:'trainees', name:'شؤون المتدربين', count:0, icon:'TA' },
  { id:'accounting', name:'المحاسبة', count:0, icon:'AC' },
  { id:'quality', name:'الجودة', count:0, icon:'QA' },
  { id:'marketing', name:'التسويق', count:0, icon:'MK' },
  { id:'it', name:'تقنية المعلومات', count:0, icon:'IT' },
  { id:'admin', name:'الإدارة', count:0, icon:'AD' }
];

export const services = [
  {
    id:'housing', department:'hr', name:'طلب صرف بدل السكن', code:'HR-F-29', procedure:'HR-P-19',
    mode:'FORM_WORKFLOW', status:'draft-content',
    description:'تجهيز نموذج بدل السكن ومراجعته وإرساله لمسار الاعتماد.',
    requirements:['استيفاء شروط الاستحقاق حسب الإجراء المعتمد','تحديد طريقة ومدة السداد إن وجدت'],
    attachments:[],
    steps:['قراءة شروط الإجراء','تعبئة بيانات الموظف تلقائيا','إدخال البيانات المتغيرة','مراجعة النموذج','إرساله للاعتماد'],
    source:'سيتم استبدال هذا المحتوى بنسخة HR-P-19 الفعلية عند رفع الملف.'
  },
  {
    id:'cert-support', department:'hr', name:'دعم الدورات والشهادات المهنية', code:'يحدد بعد رفع النموذج', procedure:'HR-P-15',
    mode:'FORM_PORTAL', status:'draft-content',
    description:'التحقق من أهلية الدعم وتجهيز النموذج ثم توجيه الموظف لطريقة التقديم الرسمية.',
    requirements:['موظف سعودي','استيفاء الشروط الواردة في الإجراء المعتمد'],
    attachments:['عرض السعر أو إثبات التكلفة','معلومات الشهادة أو الدورة'],
    steps:['التحقق من الأهلية','تعبئة النموذج','إرفاق المستندات المطلوبة','فتح دليل البورتال','إكمال التقديم في البورتال'],
    source:'HR-P-15 — سيتم ربط النص الرسمي والنسخة الحالية عند رفع الملف.'
  },
  {
    id:'business-trip', department:'hr', name:'رحلة العمل', code:'HR-F-13', procedure:'إجراء رحلة العمل',
    mode:'FORM_WORKFLOW', status:'draft-content',
    description:'تجهيز بيانات رحلة العمل والمرفقات ثم إرسالها للاعتماد حسب المسار المحدد.',
    requirements:['وجود مهمة أو تكليف عمل معتمد'],
    attachments:['المستندات المؤيدة عند الحاجة'],
    steps:['إدخال بيانات الرحلة','رفع المرفقات','مراجعة النموذج','إرسال الطلب','متابعة الاعتمادات'],
    source:'سيتم ربط الإجراء والنموذج الفعليين.'
  },
  {
    id:'sick-leave', department:'hr', name:'الإجازة المرضية', code:'-', procedure:'إجراء الإجازات',
    mode:'PORTAL_ONLY', status:'draft-content',
    description:'شرح الشروط ثم توجيه الموظف مباشرة إلى خطوات التقديم في البورتال.',
    requirements:['إرفاق المستند الطبي المطلوب حسب السياسة'],
    attachments:['مستند طبي'],
    steps:['مراجعة الشروط','فتح البورتال','اختيار الإجازات','إنشاء طلب إجازة مرضية','رفع المرفق','إرسال الطلب'],
    source:'سيتم ربط دليل البورتال والإجراء الفعليين.'
  }
];

export const demoRequests = [
  {id:'REQ-26001', service:'دعم شهادة مهنية', status:'بانتظار المدير المباشر', className:'pending', date:'21 يوليو 2026'},
  {id:'REQ-25984', service:'طلب بدل سكن', status:'مكتمل', className:'done', date:'14 يوليو 2026'},
  {id:'REQ-25971', service:'رحلة عمل', status:'معاد للاستكمال', className:'returned', date:'9 يوليو 2026'}
];
