export const employees = [
  { id:'E001', name:'نادر الجهني', email:'nader@institute.local', department:'الموارد البشرية', title:'أخصائي موارد بشرية', manager:'مدير الموارد البشرية', role:'employee' },
  { id:'E002', name:'أحمد', email:'ahmed@institute.local', department:'الموارد البشرية', title:'أخصائي موارد بشرية', manager:'مدير الموارد البشرية', role:'employee' },
  { id:'M001', name:'مدير الموارد البشرية', email:'hr.manager@institute.local', department:'الموارد البشرية', title:'مدير الموارد البشرية', manager:'المدير العام', role:'manager' },
  { id:'GM01', name:'المدير العام', email:'gm@institute.local', department:'الإدارة العليا', title:'المدير العام', manager:null, role:'admin' }
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
    mode:'FORM_WORKFLOW', readiness:'demo',
    description:'تجهيز نموذج بدل السكن ومراجعته وإرساله لمسار الاعتماد.',
    requirements:['استيفاء شروط الاستحقاق حسب الإجراء المعتمد','تحديد بيانات الصرف ومدة السداد عند الحاجة'],
    attachments:[],
    steps:['مراجعة شروط الاستحقاق','تعبئة بيانات الموظف تلقائيا','إدخال البيانات المتغيرة','مراجعة النموذج','إرسال الطلب لمسار الاعتماد'],
    source:'محتوى تجريبي حتى رفع النسخة المعتمدة من HR-P-19 وHR-F-29.'
  },
  {
    id:'cert-support', department:'hr', name:'دعم الدورات والشهادات المهنية', code:'يحدد من الملف المعتمد', procedure:'HR-P-15',
    mode:'FORM_PORTAL', readiness:'demo',
    description:'التحقق من أهلية الدعم وتجهيز الطلب ثم توجيه الموظف لطريقة التقديم الرسمية.',
    requirements:['استيفاء شروط الإجراء المعتمد','إرفاق بيانات الدورة أو الشهادة'],
    attachments:['عرض السعر أو إثبات التكلفة','معلومات الشهادة أو الدورة'],
    steps:['التحقق من الأهلية','تعبئة البيانات','رفع المرفقات','مراجعة الطلب','إكمال التقديم في البورتال حسب الدليل'],
    source:'محتوى تجريبي حتى رفع HR-P-15 والنموذج ودليل البورتال المعتمد.'
  },
  {
    id:'business-trip', department:'hr', name:'رحلة العمل', code:'HR-F-13', procedure:'إجراء رحلة العمل',
    mode:'FORM_WORKFLOW', readiness:'demo',
    description:'تجهيز بيانات رحلة العمل والمرفقات وإرسالها لمسار الاعتماد المناسب.',
    requirements:['وجود مهمة أو تكليف عمل معتمد'],
    attachments:['المستندات المؤيدة عند الحاجة'],
    steps:['إدخال بيانات الرحلة','إرفاق المستندات','مراجعة الطلب','الإرسال للاعتماد','متابعة حالة المعاملة'],
    source:'محتوى تجريبي حتى ربط الإجراء والنموذج المعتمدين.'
  },
  {
    id:'sick-leave', department:'hr', name:'الإجازة المرضية', code:'-', procedure:'إجراء الإجازات',
    mode:'PORTAL_ONLY', readiness:'demo',
    description:'عرض المتطلبات ثم توجيه الموظف إلى خطوات التقديم الصحيحة في البورتال.',
    requirements:['إرفاق المستند الطبي المطلوب حسب الإجراء المعتمد'],
    attachments:['مستند طبي'],
    steps:['مراجعة المتطلبات','فتح البورتال','اختيار خدمة الإجازات','إنشاء طلب إجازة مرضية','رفع المرفق','إرسال الطلب'],
    source:'محتوى تجريبي حتى ربط إجراء الإجازات ودليل البورتال المعتمد.'
  }
];

export const demoRequests = [
  {id:'REQ-26001', service:'دعم شهادة مهنية', status:'بانتظار المدير المباشر', className:'pending', date:'21 يوليو 2026', progress:50, current:'المدير المباشر'},
  {id:'REQ-25984', service:'طلب بدل سكن', status:'مكتمل', className:'done', date:'14 يوليو 2026', progress:100, current:'مكتمل'},
  {id:'REQ-25971', service:'رحلة عمل', status:'معاد للاستكمال', className:'returned', date:'9 يوليو 2026', progress:25, current:'الموظف'}
];

export const knowledge = [
  {id:'k1', type:'إجراء', title:'HR-P-15 دعم الدورات والشهادات المهنية', department:'الموارد البشرية', version:'سيتم الربط بالنسخة المعتمدة', status:'demo'},
  {id:'k2', type:'إجراء', title:'HR-P-19 طلب صرف بدل السكن', department:'الموارد البشرية', version:'سيتم الربط بالنسخة المعتمدة', status:'demo'},
  {id:'k3', type:'دليل', title:'دليل استخدام البورتال', department:'الموارد البشرية', version:'بانتظار رفع الدليل', status:'demo'}
];
