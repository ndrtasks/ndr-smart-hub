export const users = [
  {id:'E001', name:'نادر الجهني', email:'nader@institute.local', title:'أخصائي موارد بشرية', departmentId:'hr', managerId:'HRM01', role:'employee', permissions:[]},
  {id:'E002', name:'أحمد', email:'ahmed@institute.local', title:'أخصائي موارد بشرية', departmentId:'hr', managerId:'HRM01', role:'specialist', permissions:['approve_hr']},
  {id:'HRM01', name:'مدير الموارد البشرية', email:'hr.manager@institute.local', title:'مدير الموارد البشرية', departmentId:'hr', managerId:'GM01', role:'manager', permissions:['approve_department','workflow_override_hr','view_department']},

  {id:'TRM01', name:'مدير التدريب - تجريبي', email:'training.manager@institute.local', title:'مدير التدريب', departmentId:'training', managerId:'GM01', role:'manager', permissions:['approve_department','view_department']},
  {id:'TR001', name:'موظف التدريب - تجريبي', email:'training.employee@institute.local', title:'منسق تدريب', departmentId:'training', managerId:'TRM01', role:'employee', permissions:[]},
  {id:'TRALT', name:'بديل مدير التدريب - تجريبي', email:'training.alt@institute.local', title:'مشرف تدريب', departmentId:'training', managerId:'TRM01', role:'employee', permissions:['delegated_approval']},

  {id:'TAM01', name:'مدير شؤون المتدربين - تجريبي', email:'trainees.manager@institute.local', title:'مدير شؤون المتدربين', departmentId:'trainees', managerId:'GM01', role:'manager', permissions:['approve_department','view_department']},
  {id:'TA001', name:'موظف شؤون المتدربين - تجريبي', email:'trainees.employee@institute.local', title:'منسق شؤون متدربين', departmentId:'trainees', managerId:'TAM01', role:'employee', permissions:[]},

  {id:'FINM01', name:'مدير المحاسبة - تجريبي', email:'finance.manager@institute.local', title:'مدير المحاسبة', departmentId:'accounting', managerId:'GM01', role:'manager', permissions:['approve_finance','view_department']},
  {id:'FIN01', name:'محاسب - تجريبي', email:'accountant@institute.local', title:'محاسب', departmentId:'accounting', managerId:'FINM01', role:'employee', permissions:[]},

  {id:'QM01', name:'مدير الجودة - تجريبي', email:'quality.manager@institute.local', title:'مدير الجودة', departmentId:'quality', managerId:'GM01', role:'manager', permissions:['approve_department','view_department']},
  {id:'MKTM01', name:'مدير التسويق - تجريبي', email:'marketing.manager@institute.local', title:'مدير التسويق', departmentId:'marketing', managerId:'GM01', role:'manager', permissions:['approve_department','view_department']},
  {id:'ITM01', name:'مدير تقنية المعلومات - تجريبي', email:'it.manager@institute.local', title:'مدير تقنية المعلومات', departmentId:'it', managerId:'GM01', role:'manager', permissions:['approve_department','view_department']},
  {id:'ADM01', name:'مدير الخدمات الإدارية - تجريبي', email:'admin.manager@institute.local', title:'مدير الخدمات الإدارية', departmentId:'admin', managerId:'GM01', role:'manager', permissions:['approve_department','view_department']},

  {id:'GM01', name:'المدير العام', email:'gm@institute.local', title:'المدير العام', departmentId:'executive', managerId:null, role:'executive', permissions:['approve_executive','view_all','workflow_override_all','audit_all','org_manage','delegation_manage']},
  {id:'SYS01', name:'مدير النظام - تجريبي', email:'system.admin@institute.local', title:'مدير النظام', departmentId:'system', managerId:null, role:'system_admin', permissions:['system_admin','workflow_design','org_manage','delegation_manage','view_all']}
];

export const departments = [
  {id:'executive', name:'الإدارة العليا', managerId:'GM01', description:'الإشراف والاعتمادات النهائية'},
  {id:'hr', name:'الموارد البشرية', managerId:'HRM01', description:'خدمات الموظفين والتوظيف والتطوير والعمليات'},
  {id:'training', name:'إدارة التدريب', managerId:'TRM01', description:'البرامج التدريبية والمدربين والجداول'},
  {id:'trainees', name:'شؤون المتدربين', managerId:'TAM01', description:'خدمات المتدربين والمتابعة الأكاديمية'},
  {id:'accounting', name:'المحاسبة والمالية', managerId:'FINM01', description:'المراجعات المالية والصرف'},
  {id:'quality', name:'الجودة', managerId:'QM01', description:'السياسات والإجراءات والامتثال'},
  {id:'marketing', name:'التسويق', managerId:'MKTM01', description:'الخدمات التسويقية والهوية'},
  {id:'it', name:'تقنية المعلومات', managerId:'ITM01', description:'الأنظمة والحسابات والدعم التقني'},
  {id:'admin', name:'الخدمات الإدارية', managerId:'ADM01', description:'المرافق والخدمات الإدارية'},
  {id:'system', name:'إدارة النظام', managerId:'SYS01', description:'إدارة إعدادات المنصة فقط'}
];

export const defaultDelegations = [];

export const services = [
  {
    id:'housing', departmentId:'hr', name:'طلب صرف بدل السكن', code:'HR-F-29', procedure:'HR-P-19', mode:'FORM_WORKFLOW', active:true,
    description:'طلب صرف بدل السكن مقدما مع نموذج مرتبط ومسار اعتماد متسلسل.',
    form:{
      templateName:'HR-F-29 نموذج طلب بدل السكن', revision:'7', masterPath:'assets/HR-F-29_نموذج_طلب_بدل_السكن_حسبة_الاستقالة_الدقيقة.xlsx',
      declaration:'أقر بصحة البيانات وأوافق على الإقرار والتعهد الوارد في النموذج وعلى معالجة الطلب وفق الصلاحيات المعتمدة.'
    },
    fields:[
      {id:'requestedMonths', label:'عدد أشهر بدل السكن المطلوبة', type:'select', required:true, options:['3 أشهر','6 أشهر','9 أشهر','12 شهر']},
      {id:'repaymentMonths', label:'مدة السداد المطلوبة', type:'select', required:true, options:['3 أشهر','6 أشهر','9 أشهر']},
      {id:'repaymentStart', label:'تاريخ بدء الخصم', type:'date', required:true},
      {id:'employeeNote', label:'ملاحظات الموظف', type:'textarea', required:false, placeholder:'تفاصيل إضافية عند الحاجة'}
    ],
    workflowTemplate:[
      {id:'direct-manager', label:'اعتماد المدير المباشر', resolver:{type:'DIRECT_MANAGER'}, mode:'SEQUENTIAL'},
      {id:'hr-review', label:'مراجعة الموارد البشرية', resolver:{type:'NAMED_USER', userId:'E002', fallbackRole:'specialist', departmentId:'hr'}, mode:'SEQUENTIAL', stageFields:[
        {id:'joiningDate',label:'تاريخ التعيين',type:'date'},
        {id:'hrNotes',label:'ملاحظات الموارد البشرية',type:'textarea'}
      ]},
      {id:'finance-review', label:'مراجعة المحاسبة', resolver:{type:'DEPARTMENT_MANAGER_FIXED', departmentId:'accounting'}, mode:'SEQUENTIAL', stageFields:[
        {id:'existingLoan',label:'السلف القائمة - ريال',type:'number'},
        {id:'eosBenefits',label:'حقوق نهاية الخدمة عند الاستقالة - ريال',type:'number'},
        {id:'approvedMonths',label:'عدد الأشهر المعتمدة',type:'select',options:['3 أشهر','6 أشهر','9 أشهر','12 شهر']},
        {id:'approvedInstallment',label:'قيمة القسط الشهري المعتمد - ريال',type:'number'},
        {id:'approvedTotal',label:'إجمالي المبلغ المعتمد - ريال',type:'number'},
        {id:'accountantName',label:'تمت المراجعة بواسطة المحاسب',type:'text'}
      ]},
      {id:'executive-approval', label:'الاعتماد النهائي', resolver:{type:'GENERAL_MANAGER'}, mode:'SEQUENTIAL'}
    ]
  },
  {
    id:'sick-leave', departmentId:'hr', name:'إجازة مرضية', code:'HR-SRV-SICK', procedure:'إجراء الإجازات', mode:'FORM_WORKFLOW', active:true,
    description:'طلب إجازة مرضية يذهب مباشرة للمختص المحدد دون المرور بالمدير المباشر حسب إعداد الخدمة.',
    form:{templateName:'طلب إجازة مرضية', revision:'تجريبي', declaration:'أقر بصحة بيانات الإجازة والمرفقات الطبية المرفوعة.'},
    fields:[
      {id:'fromDate', label:'من تاريخ', type:'date', required:true},
      {id:'toDate', label:'إلى تاريخ', type:'date', required:true},
      {id:'medicalRef', label:'مرجع/رقم التقرير الطبي', type:'text', required:false, placeholder:'عند توفره'}
    ],
    attachments:['المستند الطبي'],
    workflowTemplate:[
      {id:'hr-specialist', label:'مراجعة المختص', resolver:{type:'NAMED_USER', userId:'E001', fallbackRole:'specialist', departmentId:'hr', excludeOwner:true}, mode:'SEQUENTIAL'},
      {id:'hr-manager', label:'اعتماد مدير الموارد البشرية', resolver:{type:'DEPARTMENT_MANAGER_FIXED', departmentId:'hr'}, mode:'SEQUENTIAL'}
    ]
  },
  {
    id:'short-permission', departmentId:'hr', name:'إذن قصير', code:'HR-SRV-PERM', procedure:'إجراء الأذونات', mode:'FORM_WORKFLOW', active:true,
    description:'إذن قصير يمر بالمدير المباشر أو البديل المفوض ثم الموارد البشرية.',
    form:{templateName:'طلب إذن قصير', revision:'تجريبي', declaration:'أقر بصحة وقت الإذن والغرض منه.'},
    fields:[
      {id:'permissionDate', label:'تاريخ الإذن', type:'date', required:true},
      {id:'fromTime', label:'من الساعة', type:'time', required:true},
      {id:'toTime', label:'إلى الساعة', type:'time', required:true},
      {id:'reason', label:'السبب', type:'textarea', required:true}
    ],
    workflowTemplate:[
      {id:'direct-manager', label:'اعتماد المدير المباشر', resolver:{type:'DIRECT_MANAGER'}, mode:'SEQUENTIAL'},
      {id:'hr-specialist', label:'مراجعة الموارد البشرية', resolver:{type:'NAMED_USER', userId:'E001', fallbackRole:'specialist', departmentId:'hr', excludeOwner:true}, mode:'SEQUENTIAL'}
    ]
  },
  {
    id:'cert-support', departmentId:'hr', name:'دعم الدورات والشهادات المهنية', code:'HR-P-15', procedure:'HR-P-15', mode:'FORM_WORKFLOW', active:true,
    description:'تجهيز طلب دعم دورة أو شهادة مهنية ومراجعته واعتماده حسب المسار المحدد.',
    form:{templateName:'طلب دعم دورة أو شهادة مهنية', revision:'تجريبي', declaration:'أقر بصحة بيانات الدورة أو الشهادة والتكلفة المرفقة.'},
    fields:[
      {id:'certificateName', label:'اسم الدورة أو الشهادة', type:'text', required:true},
      {id:'provider', label:'الجهة المقدمة', type:'text', required:true},
      {id:'cost', label:'التكلفة', type:'number', required:true, suffix:'ريال'},
      {id:'startDate', label:'تاريخ البداية المتوقع', type:'date', required:true}
    ],
    attachments:['عرض السعر أو إثبات التكلفة','معلومات الدورة أو الشهادة'],
    workflowTemplate:[
      {id:'direct-manager', label:'اعتماد المدير المباشر', resolver:{type:'DIRECT_MANAGER'}, mode:'SEQUENTIAL'},
      {id:'hr-specialist', label:'مراجعة الموارد البشرية', resolver:{type:'NAMED_USER', userId:'E002', fallbackRole:'specialist', departmentId:'hr'}, mode:'SEQUENTIAL'},
      {id:'hr-manager', label:'اعتماد مدير الموارد البشرية', resolver:{type:'DEPARTMENT_MANAGER_FIXED', departmentId:'hr'}, mode:'SEQUENTIAL'}
    ]
  },
  {
    id:'business-trip', departmentId:'hr', name:'رحلة عمل', code:'HR-F-13', procedure:'إجراء رحلة العمل', mode:'FORM_WORKFLOW', active:true,
    description:'طلب رحلة عمل مع بيانات الوجهة والفترة والغرض ومسار اعتماد متسلسل.',
    form:{templateName:'HR-F-13 رحلة عمل', revision:'تجريبي', declaration:'أقر بصحة بيانات الرحلة وأنها لغرض عمل معتمد.'},
    fields:[
      {id:'destination', label:'الوجهة', type:'text', required:true},
      {id:'purpose', label:'الغرض من الرحلة', type:'textarea', required:true},
      {id:'startDate', label:'تاريخ البداية', type:'date', required:true},
      {id:'endDate', label:'تاريخ النهاية', type:'date', required:true},
      {id:'transport', label:'وسيلة النقل', type:'select', required:true, options:['تذكرة طيران','سيارة','لا يوجد']}
    ],
    workflowTemplate:[
      {id:'direct-manager', label:'اعتماد المدير المباشر', resolver:{type:'DIRECT_MANAGER'}, mode:'SEQUENTIAL'},
      {id:'hr-specialist', label:'مراجعة الموارد البشرية', resolver:{type:'NAMED_USER', userId:'E002', fallbackRole:'specialist', departmentId:'hr'}, mode:'SEQUENTIAL'}
    ]
  }
];

export const knowledge = [
  {id:'k1', type:'إجراء', title:'HR-P-19 إجراء طلب صرف بدل السكن', departmentId:'hr', version:'R6', status:'source-linked'},
  {id:'k2', type:'نموذج', title:'HR-F-29 نموذج طلب بدل السكن', departmentId:'hr', version:'R7', status:'master-linked'},
  {id:'k3', type:'إجراء', title:'HR-P-15 دعم الدورات والشهادات المهنية', departmentId:'hr', version:'بانتظار ربط المصدر النهائي', status:'demo'},
  {id:'k4', type:'دليل', title:'دليل استخدام البورتال', departmentId:'hr', version:'بانتظار الربط', status:'demo'}
];

export const initialDemoRequests = [];
