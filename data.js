export const users = [
  {id:'E001', name:'نادر الجهني', nameEn:'Nader Aljuhani', email:'nader@institute.local', title:'أخصائي موارد بشرية', titleEn:'HR Specialist', departmentId:'hr', managerId:'HRM01', role:'employee', permissions:['workflow_override_hr'], joiningDate:'2024-07-01', housingAllowance:1250},
  {id:'E002', name:'أحمد', nameEn:'Ahmed', email:'ahmed@institute.local', title:'أخصائي موارد بشرية', titleEn:'HR Specialist', departmentId:'hr', managerId:'HRM01', role:'specialist', permissions:['approve_hr','workflow_override_hr'], joiningDate:'2021-06-01', housingAllowance:1250},
  {id:'HRM01', name:'مدير الموارد البشرية', nameEn:'HR Manager', email:'hr.manager@institute.local', title:'مدير الموارد البشرية', titleEn:'Human Resources Manager', departmentId:'hr', managerId:'GM01', role:'manager', permissions:['approve_department','workflow_override_hr','view_department'], joiningDate:'2018-01-01', housingAllowance:2000},

  {id:'TRM01', name:'مدير التدريب - تجريبي', nameEn:'Training Manager - Demo', email:'training.manager@institute.local', title:'مدير التدريب', titleEn:'Training Manager', departmentId:'training', managerId:'GM01', role:'manager', permissions:['approve_department','view_department'], joiningDate:'2018-01-01', housingAllowance:1800},
  {id:'TR001', name:'موظف التدريب - تجريبي', nameEn:'Training Employee - Demo', email:'training.employee@institute.local', title:'منسق تدريب', titleEn:'Training Coordinator', departmentId:'training', managerId:'TRM01', role:'employee', permissions:[], joiningDate:'2021-10-01', housingAllowance:1250},
  {id:'TRALT', name:'بديل مدير التدريب - تجريبي', nameEn:'Acting Training Manager - Demo', email:'training.alt@institute.local', title:'مشرف تدريب', titleEn:'Training Supervisor', departmentId:'training', managerId:'TRM01', role:'employee', permissions:['delegated_approval'], joiningDate:'2020-05-01', housingAllowance:1400},

  {id:'TAM01', name:'مدير شؤون المتدربين - تجريبي', nameEn:'Trainees Affairs Manager - Demo', email:'trainees.manager@institute.local', title:'مدير شؤون المتدربين', titleEn:'Trainees Affairs Manager', departmentId:'trainees', managerId:'GM01', role:'manager', permissions:['approve_department','view_department'], joiningDate:'2019-01-01', housingAllowance:1800},
  {id:'TA001', name:'موظف شؤون المتدربين - تجريبي', nameEn:'Trainees Affairs Employee - Demo', email:'trainees.employee@institute.local', title:'منسق شؤون متدربين', titleEn:'Trainees Affairs Coordinator', departmentId:'trainees', managerId:'TAM01', role:'employee', permissions:[], joiningDate:'2020-08-15', housingAllowance:1250},

  {id:'FINM01', name:'مدير المحاسبة - تجريبي', nameEn:'Accounting Manager - Demo', email:'finance.manager@institute.local', title:'مدير المحاسبة', titleEn:'Accounting Manager', departmentId:'accounting', managerId:'GM01', role:'manager', permissions:['approve_finance','view_department'], joiningDate:'2018-01-01', housingAllowance:1800},
  {id:'FIN01', name:'محاسب - تجريبي', nameEn:'Accountant - Demo', email:'accountant@institute.local', title:'محاسب', titleEn:'Accountant', departmentId:'accounting', managerId:'FINM01', role:'employee', permissions:[], joiningDate:'2022-01-01', housingAllowance:1250},

  {id:'QM01', name:'مدير الجودة - تجريبي', nameEn:'Quality Manager - Demo', email:'quality.manager@institute.local', title:'مدير الجودة', titleEn:'Quality Manager', departmentId:'quality', managerId:'GM01', role:'manager', permissions:['approve_department','view_department'], joiningDate:'2019-01-01', housingAllowance:1700},
  {id:'MKTM01', name:'مدير التسويق - تجريبي', nameEn:'Marketing Manager - Demo', email:'marketing.manager@institute.local', title:'مدير التسويق', titleEn:'Marketing Manager', departmentId:'marketing', managerId:'GM01', role:'manager', permissions:['approve_department','view_department'], joiningDate:'2019-01-01', housingAllowance:1700},
  {id:'ITM01', name:'مدير تقنية المعلومات - تجريبي', nameEn:'IT Manager - Demo', email:'it.manager@institute.local', title:'مدير تقنية المعلومات', titleEn:'IT Manager', departmentId:'it', managerId:'GM01', role:'manager', permissions:['approve_department','view_department'], joiningDate:'2019-01-01', housingAllowance:1700},
  {id:'ADM01', name:'مدير الخدمات الإدارية - تجريبي', nameEn:'Administration Manager - Demo', email:'admin.manager@institute.local', title:'مدير الخدمات الإدارية', titleEn:'Administration Manager', departmentId:'admin', managerId:'GM01', role:'manager', permissions:['approve_department','view_department'], joiningDate:'2019-01-01', housingAllowance:1700},

  {id:'GM01', name:'المدير العام', nameEn:'General Manager', email:'gm@institute.local', title:'المدير العام', titleEn:'General Manager', departmentId:'executive', managerId:null, role:'executive', permissions:['approve_executive','view_all','workflow_override_all','audit_all','org_manage','delegation_manage'], joiningDate:'2017-01-01', housingAllowance:2500},
  {id:'SYS01', name:'مدير النظام - تجريبي', nameEn:'System Administrator - Demo', email:'system.admin@institute.local', title:'مدير النظام', titleEn:'System Administrator', departmentId:'system', managerId:null, role:'system_admin', permissions:['system_admin','workflow_design','org_manage','delegation_manage','view_all'], joiningDate:'2020-01-01', housingAllowance:0}
];

export const departments = [
  {id:'executive', name:'الإدارة العليا', nameEn:'Executive Management', managerId:'GM01', description:'الإشراف والاعتمادات النهائية', descriptionEn:'Oversight and final approvals'},
  {id:'hr', name:'الموارد البشرية', nameEn:'Human Resources', managerId:'HRM01', description:'خدمات الموظفين والتوظيف والتطوير والعمليات', descriptionEn:'Employee services, recruitment, development and HR operations'},
  {id:'training', name:'إدارة التدريب', nameEn:'Training Management', managerId:'TRM01', description:'البرامج التدريبية والمدربين والجداول', descriptionEn:'Training programs, trainers and schedules'},
  {id:'trainees', name:'شؤون المتدربين', nameEn:'Trainees Affairs', managerId:'TAM01', description:'خدمات المتدربين والمتابعة الأكاديمية', descriptionEn:'Trainee services and academic follow-up'},
  {id:'accounting', name:'المحاسبة والمالية', nameEn:'Accounting & Finance', managerId:'FINM01', description:'المراجعات المالية والصرف', descriptionEn:'Financial review and disbursement'},
  {id:'quality', name:'الجودة', nameEn:'Quality', managerId:'QM01', description:'السياسات والإجراءات والامتثال', descriptionEn:'Policies, procedures and compliance'},
  {id:'marketing', name:'التسويق', nameEn:'Marketing', managerId:'MKTM01', description:'الخدمات التسويقية والهوية', descriptionEn:'Marketing services and identity'},
  {id:'it', name:'تقنية المعلومات', nameEn:'Information Technology', managerId:'ITM01', description:'الأنظمة والحسابات والدعم التقني', descriptionEn:'Systems, accounts and technical support'},
  {id:'admin', name:'الخدمات الإدارية', nameEn:'Administration Services', managerId:'ADM01', description:'المرافق والخدمات الإدارية', descriptionEn:'Facilities and administration services'},
  {id:'system', name:'إدارة النظام', nameEn:'System Administration', managerId:'SYS01', description:'إدارة إعدادات المنصة فقط', descriptionEn:'Platform configuration only'}
];

export const defaultDelegations = [];

export const services = [
  {
    id:'housing', departmentId:'hr', name:'طلب صرف بدل السكن', nameEn:'Advance Housing Allowance Request', code:'HR-F-29', procedure:'HR-P-19', mode:'FORM_WORKFLOW', active:true,
    description:'طلب صرف بدل السكن مقدما مع استحقاق يتحدد تلقائيا حسب مدة الخدمة.',
    descriptionEn:'Advance housing allowance request with eligibility calculated automatically from service duration.',
    aliases:['بدل سكن','صرف بدل السكن','سلفة سكن','مقدم سكن','HR-F-29'],
    aliasesEn:['housing allowance','advance housing','housing advance','HR-F-29'],
    rules:{type:'HOUSING_ELIGIBILITY', minimumServiceMonths:42, tiers:[
      {min:42,max:59,months:[3]},
      {min:60,max:69,months:[6,9]},
      {min:70,max:null,months:[6,9,12]}
    ]},
    form:{
      templateName:'HR-F-29 نموذج طلب بدل السكن', templateNameEn:'HR-F-29 Advance Housing Allowance Request Form', revision:'7', masterPath:'assets/HR-F-29 نموذج طلب بدل سكن.xlsx', sourceFormat:'XLSX',
      declaration:'أقر بصحة البيانات وأوافق على الإقرار والتعهد الوارد في النموذج وعلى معالجة الطلب وفق الصلاحيات المعتمدة.',
      declarationEn:'I confirm the accuracy of the information and agree to the declaration and processing of this request under the approved authorities.'
    },
    fields:[
      {id:'requestedMonths', label:'سقف الاستحقاق المطلوب', labelEn:'Requested Eligibility Ceiling', type:'select', required:true, dynamicOptions:'HOUSING_ELIGIBILITY', help:'يحدد الحد الأعلى الممكن للطلب حسب مدة خدمتك وبدل السكن الشهري.', helpEn:'Defines the maximum amount you may request based on service duration and monthly housing allowance.'},
      {id:'requestedAmount', label:'المبلغ المطلوب', labelEn:'Requested Amount', type:'number', required:true, suffix:'ريال', suffixEn:'SAR', min:1, step:'0.01', validation:'HOUSING_REQUEST_AMOUNT', help:'يمكنك طلب أي مبلغ حتى الحد الأعلى المحتسب. لن يسمح النظام بإرسال مبلغ يتجاوز السقف.', helpEn:'You may request any amount up to the calculated ceiling. The system will block amounts above the limit.'},
      {id:'repaymentMonths', label:'مدة السداد المطلوبة', labelEn:'Requested Repayment Period', type:'select', required:true, options:['3','6','9'], optionLabels:{'3':'3 أشهر','6':'6 أشهر','9':'9 أشهر'}, optionLabelsEn:{'3':'3 months','6':'6 months','9':'9 months'}},
      {id:'repaymentStart', label:'تاريخ بدء الخصم', labelEn:'Deduction Start Date', type:'date', required:true},
      {id:'employeeNote', label:'ملاحظات الموظف', labelEn:'Employee Notes', type:'textarea', required:false, placeholder:'تفاصيل إضافية عند الحاجة', placeholderEn:'Additional details if needed'}
    ],
    workflowTemplate:[
      {id:'direct-manager', label:'اعتماد المدير المباشر', labelEn:'Direct Manager Approval', resolver:{type:'DIRECT_MANAGER'}, mode:'SEQUENTIAL'},
      {id:'hr-review', label:'مراجعة الموارد البشرية', labelEn:'HR Review', resolver:{type:'NAMED_USER', userId:'E002', fallbackRole:'specialist', departmentId:'hr'}, mode:'SEQUENTIAL', stageFields:[
        {id:'joiningDate',label:'تاريخ التعيين',labelEn:'Joining Date',type:'date'},
        {id:'hrNotes',label:'ملاحظات الموارد البشرية',labelEn:'HR Notes',type:'textarea'}
      ]},
      {id:'finance-review', label:'مراجعة المحاسبة', labelEn:'Accounting Review', resolver:{type:'DEPARTMENT_MANAGER_FIXED', departmentId:'accounting'}, mode:'SEQUENTIAL', stageFields:[
        {id:'existingLoan',label:'السلف القائمة - ريال',labelEn:'Existing Loans - SAR',type:'number'},
        {id:'eosBenefits',label:'حقوق نهاية الخدمة عند الاستقالة - ريال',labelEn:'EOS Benefits on Resignation - SAR',type:'number'},
        {id:'approvedMonths',label:'عدد الأشهر المعتمدة',labelEn:'Approved Months',type:'select',options:['3','6','9','12'],optionLabels:{'3':'3 أشهر','6':'6 أشهر','9':'9 أشهر','12':'12 شهرا'},optionLabelsEn:{'3':'3 months','6':'6 months','9':'9 months','12':'12 months'}},
        {id:'approvedInstallment',label:'قيمة القسط الشهري المعتمد - ريال',labelEn:'Approved Monthly Installment - SAR',type:'number'},
        {id:'approvedTotal',label:'إجمالي المبلغ المعتمد - ريال',labelEn:'Approved Total Amount - SAR',type:'number'},
        {id:'accountantName',label:'تمت المراجعة بواسطة المحاسب',labelEn:'Reviewed by Accountant',type:'text'}
      ]},
      {id:'executive-approval', label:'الاعتماد النهائي', labelEn:'Final Approval', resolver:{type:'GENERAL_MANAGER'}, mode:'SEQUENTIAL'}
    ]
  },
  {
    id:'sick-leave', departmentId:'hr', name:'إجازة مرضية', nameEn:'Sick Leave', code:'HR-SRV-SICK', procedure:'إجراء الإجازات', mode:'FORM_WORKFLOW', active:true,
    description:'طلب إجازة مرضية يذهب مباشرة للمختص المحدد دون المرور بالمدير المباشر حسب إعداد الخدمة.', descriptionEn:'Sick leave request routed directly to the assigned HR reviewer without department manager approval when configured.',
    aliases:['إجازة مرضية','مرضي','تقرير طبي','مرضية','إجازة طبية'], aliasesEn:['sick leave','medical leave','medical report','ill'],
    form:{templateName:'طلب إجازة مرضية',templateNameEn:'Sick Leave Request',revision:'تجريبي',declaration:'أقر بصحة بيانات الإجازة والمرفقات الطبية المرفوعة.',declarationEn:'I confirm the accuracy of the sick leave information and attached medical documents.'},
    fields:[
      {id:'fromDate', label:'من تاريخ', labelEn:'From Date', type:'date', required:true},
      {id:'toDate', label:'إلى تاريخ', labelEn:'To Date', type:'date', required:true},
      {id:'medicalRef', label:'مرجع/رقم التقرير الطبي', labelEn:'Medical Report Reference', type:'text', required:false, placeholder:'عند توفره', placeholderEn:'If available'}
    ],
    attachments:[{id:'medicalDocument',label:'المستند الطبي',labelEn:'Medical Document',required:true,accept:'.pdf,.png,.jpg,.jpeg'}],
    workflowTemplate:[
      {id:'hr-specialist', label:'مراجعة المختص', labelEn:'HR Specialist Review', resolver:{type:'NAMED_USER', userId:'E001', fallbackRole:'specialist', departmentId:'hr', excludeOwner:true}, mode:'SEQUENTIAL'},
      {id:'hr-manager', label:'اعتماد مدير الموارد البشرية', labelEn:'HR Manager Approval', resolver:{type:'DEPARTMENT_MANAGER_FIXED', departmentId:'hr'}, mode:'SEQUENTIAL'}
    ]
  },
  {
    id:'short-permission', departmentId:'hr', name:'إذن قصير', nameEn:'Short Permission', code:'HR-SRV-PERM', procedure:'إجراء الأذونات', mode:'FORM_WORKFLOW', active:true,
    description:'طلب إذن مستقبلي أو قبل مغادرة الموظف، يمر بالمدير المباشر أو البديل ثم الموارد البشرية.', descriptionEn:'A planned short permission before leaving, routed to the direct manager or delegate and then HR.',
    aliases:['إذن قصير','استئذان','استاذن','بستأذن','بستاذن','أستأذن','اذن','إذن ساعات','موعد شخصي','خروج ساعتين','بطلع بدري','أبي أطلع','احتاج أطلع','بطلع','بخرج','بمشي','امشي','ابغى امشي','اطلع شوي'],
    aliasesEn:['short permission','permission','leave early','go out','step out','appointment','need to leave'],
    form:{templateName:'طلب إذن قصير',templateNameEn:'Short Permission Request',revision:'تجريبي',declaration:'أقر بصحة وقت الإذن والغرض منه.',declarationEn:'I confirm the requested permission time and reason.'},
    fields:[
      {id:'permissionDate', label:'تاريخ الإذن', labelEn:'Permission Date', type:'date', required:true},
      {id:'fromTime', label:'من الساعة', labelEn:'From Time', type:'time', required:true},
      {id:'toTime', label:'إلى الساعة', labelEn:'To Time', type:'time', required:true},
      {id:'reason', label:'السبب', labelEn:'Reason', type:'textarea', required:true, placeholder:'سبب الاستئذان باختصار', placeholderEn:'Brief reason for the permission'}
    ],
    workflowTemplate:[
      {id:'direct-manager', label:'اعتماد المدير المباشر', labelEn:'Direct Manager Approval', resolver:{type:'DIRECT_MANAGER'}, mode:'SEQUENTIAL'},
      {id:'hr-specialist', label:'مراجعة الموارد البشرية', labelEn:'HR Review', resolver:{type:'NAMED_USER', userId:'E001', fallbackRole:'specialist', departmentId:'hr', excludeOwner:true}, mode:'SEQUENTIAL'}
    ]
  },
  {
    id:'attendance-memo', departmentId:'hr', name:'مذكرة الحضور', nameEn:'Attendance Memo', code:'HR-F-25', procedure:'إجراء الحضور والانصراف', mode:'FORM_WORKFLOW', active:true,
    description:'تصحيح أو توضيح حالة حضور حدثت فعليا مثل التأخر أو الخروج المبكر أو البصمة المفقودة أو الغياب أو العمل عن بعد. لا يستخدم كبديل عن الإذن القصير.',
    descriptionEn:'Correction or explanation of an attendance event that already occurred, such as lateness, early departure, missed punch, absence or remote work. It is not a substitute for short permission.',
    aliases:['مذكرة حضور','مذكرة الحضور','تعديل الحضور','تصحيح الحضور','تعديل البصمة','نسيت البصمة','لم أبصم','ما بصمت','تأخرت','تاخرت','تأخير','خروج مبكر','طلعت بدري','خرجت بدري','غائب','غبت','غيبت','عمل عن بعد','دوام عن بعد','HR-F-25'],
    aliasesEn:['attendance memo','attendance correction','forgot to clock','missed punch','clock out','clock in','late yesterday','left early','absent','remote work'],
    form:{templateName:'HR-F-25 مذكرة الحضور',templateNameEn:'HR-F-25 Attendance Memo',revision:'5',masterPath:'assets/HR-F-25 مذكرة الحضور.pdf',sourceFormat:'PDF',declaration:'أقر بصحة بيانات الحضور والسبب الموضح وأطلب تعديل سجل الحضور وفقا للمرفقات والاعتمادات.',declarationEn:'I confirm the attendance information and reason and request correction of my attendance record subject to supporting documents and approvals.'},
    fields:[
      {id:'attendanceDate', label:'تاريخ الحالة', labelEn:'Attendance Event Date', type:'date', required:true},
      {id:'caseType', label:'نوع الحالة', labelEn:'Case Type', type:'select', required:true, options:['غائب','خروج مبكر','متأخر','لم يبصم','العمل عن بعد','أخرى'], optionLabelsEn:{'غائب':'Absent','خروج مبكر':'Early Departure','متأخر':'Late','لم يبصم':'Missed Punch','العمل عن بعد':'Remote Work','أخرى':'Other'}},
      {id:'absenceStatus', label:'حالة الغياب', labelEn:'Absence Status', type:'select', options:['بعذر ومستند داعم','بعذر بدون مستند','بدون عذر'], optionLabelsEn:{'بعذر ومستند داعم':'Excused with Supporting Document','بعذر بدون مستند':'Excused without Supporting Document','بدون عذر':'Unexcused'}, showWhen:{field:'caseType',equals:'غائب'}, requiredWhen:{field:'caseType',equals:'غائب'}},
      {id:'missedPunchType', label:'البصمة المفقودة', labelEn:'Missing Punch', type:'select', options:['بصمة الدخول','بصمة الخروج','بصمتي الدخول والخروج'], optionLabelsEn:{'بصمة الدخول':'Clock-in','بصمة الخروج':'Clock-out','بصمتي الدخول والخروج':'Both Clock-in and Clock-out'}, showWhen:{field:'caseType',equals:'لم يبصم'}, requiredWhen:{field:'caseType',equals:'لم يبصم'}},
      {id:'remotePeriod', label:'فترة العمل عن بعد', labelEn:'Remote Work Period', type:'select', options:['يوم كامل','جزء من اليوم'], optionLabelsEn:{'يوم كامل':'Full Day','جزء من اليوم':'Part of Day'}, showWhen:{field:'caseType',equals:'العمل عن بعد'}, requiredWhen:{field:'caseType',equals:'العمل عن بعد'}},
      {id:'inTime', label:'وقت الدخول الفعلي', labelEn:'Actual Clock-in Time', type:'time', showWhenAny:[{field:'caseType',equals:'متأخر'},{field:'missedPunchType',in:['بصمة الدخول','بصمتي الدخول والخروج']},{field:'remotePeriod',equals:'جزء من اليوم'}], requiredWhenAny:[{field:'caseType',equals:'متأخر'},{field:'missedPunchType',in:['بصمة الدخول','بصمتي الدخول والخروج']},{field:'remotePeriod',equals:'جزء من اليوم'}]},
      {id:'outTime', label:'وقت الخروج الفعلي', labelEn:'Actual Clock-out Time', type:'time', showWhenAny:[{field:'caseType',equals:'خروج مبكر'},{field:'missedPunchType',in:['بصمة الخروج','بصمتي الدخول والخروج']},{field:'remotePeriod',equals:'جزء من اليوم'}], requiredWhenAny:[{field:'caseType',equals:'خروج مبكر'},{field:'missedPunchType',in:['بصمة الخروج','بصمتي الدخول والخروج']},{field:'remotePeriod',equals:'جزء من اليوم'}]},
      {id:'reason', label:'السبب والتوضيح', labelEn:'Reason and Explanation', type:'textarea', required:true, placeholder:'اشرح ما حدث باختصار وما المطلوب تعديله في سجل الحضور', placeholderEn:'Briefly explain what happened and what should be corrected in the attendance record'}
    ],
    attachments:[{id:'absenceEvidence',label:'مستند داعم للغياب',labelEn:'Supporting Absence Document',accept:'.pdf,.png,.jpg,.jpeg',showWhen:{field:'absenceStatus',equals:'بعذر ومستند داعم'},requiredWhen:{field:'absenceStatus',equals:'بعذر ومستند داعم'}}],
    workflowTemplate:[
      {id:'direct-manager', label:'مراجعة واعتماد مدير القسم', labelEn:'Department Manager Review & Approval', resolver:{type:'DIRECT_MANAGER'}, mode:'SEQUENTIAL', stageFields:[
        {id:'departmentAuthorization',label:'تصنيف موافقة القسم',labelEn:'Department Approval Classification',type:'select',options:['عمل خاص بالمعهد','عمل شخصي مصرح','ملاحظة إدارية فقط'],optionLabelsEn:{'عمل خاص بالمعهد':'Institute Business','عمل شخصي مصرح':'Authorized Personal Matter','ملاحظة إدارية فقط':'Administrative Note Only'}},
        {id:'departmentRemarks',label:'ملاحظات مدير القسم',labelEn:'Department Manager Remarks',type:'textarea'}
      ]},
      {id:'hr-review', label:'مراجعة واعتماد الموارد البشرية', labelEn:'HR Review & Approval', resolver:{type:'HR_RESPONSIBLE', preferredUserId:'E001'}, mode:'SEQUENTIAL', stageFields:[
        {id:'currentMonthMemoCount',label:'عدد مذكرات الحضور في الشهر الحالي',labelEn:'Attendance Memos This Month',type:'number'},
        {id:'yearToDateMemoCount',label:'عدد المذكرات منذ بداية العام',labelEn:'Attendance Memos Year to Date',type:'number'},
        {id:'sameReasonMemoCount',label:'عدد المذكرات لنفس السبب',labelEn:'Memos for Same Reason',type:'number'},
        {id:'hrRemarks',label:'ملاحظات الموارد البشرية',labelEn:'HR Remarks',type:'textarea'}
      ]}
    ]
  },
  {
    id:'cert-support', departmentId:'hr', name:'دعم الدورات والشهادات المهنية', nameEn:'Professional Courses & Certifications Support', code:'HR-P-15', procedure:'HR-P-15', mode:'FORM_WORKFLOW', active:true,
    description:'تجهيز طلب دعم دورة أو شهادة مهنية ومراجعته واعتماده حسب المسار المحدد.', descriptionEn:'Request support for a professional course or certification and route it through the defined approval workflow.',
    aliases:['شهادة مهنية','دورة','دعم شهادة','SHRM','اختبار مهني'], aliasesEn:['professional certification','course support','certification support','SHRM','professional exam'],
    form:{templateName:'طلب دعم دورة أو شهادة مهنية',templateNameEn:'Professional Course or Certification Support Request',revision:'تجريبي',declaration:'أقر بصحة بيانات الدورة أو الشهادة والتكلفة المرفقة.',declarationEn:'I confirm the course/certification information and attached cost details.'},
    fields:[
      {id:'certificateName', label:'اسم الدورة أو الشهادة', labelEn:'Course or Certification Name', type:'text', required:true},
      {id:'provider', label:'الجهة المقدمة', labelEn:'Provider', type:'text', required:true},
      {id:'cost', label:'التكلفة', labelEn:'Cost', type:'number', required:true, suffix:'ريال', suffixEn:'SAR'},
      {id:'startDate', label:'تاريخ البداية المتوقع', labelEn:'Expected Start Date', type:'date', required:true}
    ],
    attachments:[
      {id:'costProof',label:'عرض السعر أو إثبات التكلفة',labelEn:'Quotation or Cost Evidence',required:true,accept:'.pdf,.png,.jpg,.jpeg'},
      {id:'courseInfo',label:'معلومات الدورة أو الشهادة',labelEn:'Course or Certification Information',required:true,accept:'.pdf,.png,.jpg,.jpeg'}
    ],
    workflowTemplate:[
      {id:'direct-manager', label:'اعتماد المدير المباشر', labelEn:'Direct Manager Approval', resolver:{type:'DIRECT_MANAGER'}, mode:'SEQUENTIAL'},
      {id:'hr-specialist', label:'مراجعة الموارد البشرية', labelEn:'HR Review', resolver:{type:'NAMED_USER', userId:'E002', fallbackRole:'specialist', departmentId:'hr'}, mode:'SEQUENTIAL'},
      {id:'hr-manager', label:'اعتماد مدير الموارد البشرية', labelEn:'HR Manager Approval', resolver:{type:'DEPARTMENT_MANAGER_FIXED', departmentId:'hr'}, mode:'SEQUENTIAL'}
    ]
  },
  {
    id:'business-trip', departmentId:'hr', name:'رحلة عمل', nameEn:'Business Trip', code:'HR-F-13', procedure:'إجراء رحلة العمل', mode:'FORM_WORKFLOW', active:true,
    description:'طلب رحلة عمل مع بيانات الوجهة والفترة والغرض ومسار اعتماد متسلسل.', descriptionEn:'Business trip request with destination, period, purpose and sequential approvals.',
    aliases:['رحلة عمل','مهمة عمل','سفر عمل','خارج جدة','انتداب'], aliasesEn:['business trip','business travel','work trip','travel for work','mission'],
    form:{templateName:'HR-F-13 رحلة عمل',templateNameEn:'HR-F-13 Business Trip',revision:'تجريبي',declaration:'أقر بصحة بيانات الرحلة وأنها لغرض عمل معتمد.',declarationEn:'I confirm the trip information and that it is for an approved business purpose.'},
    fields:[
      {id:'destination', label:'الوجهة', labelEn:'Destination', type:'text', required:true},
      {id:'purpose', label:'الغرض من الرحلة', labelEn:'Purpose of Trip', type:'textarea', required:true},
      {id:'startDate', label:'تاريخ البداية', labelEn:'Start Date', type:'date', required:true},
      {id:'endDate', label:'تاريخ النهاية', labelEn:'End Date', type:'date', required:true},
      {id:'transport', label:'وسيلة النقل', labelEn:'Transportation', type:'select', required:true, options:['تذكرة طيران','سيارة','لا يوجد'], optionLabelsEn:{'تذكرة طيران':'Flight Ticket','سيارة':'Car','لا يوجد':'None'}}
    ],
    workflowTemplate:[
      {id:'direct-manager', label:'اعتماد المدير المباشر', labelEn:'Direct Manager Approval', resolver:{type:'DIRECT_MANAGER'}, mode:'SEQUENTIAL'},
      {id:'hr-specialist', label:'مراجعة الموارد البشرية', labelEn:'HR Review', resolver:{type:'NAMED_USER', userId:'E002', fallbackRole:'specialist', departmentId:'hr'}, mode:'SEQUENTIAL'}
    ]
  }
];

export const knowledge = [
  {id:'k1', type:'إجراء', typeEn:'Procedure', title:'HR-P-19 إجراء طلب صرف بدل السكن', titleEn:'HR-P-19 Advance Housing Allowance Procedure', departmentId:'hr', version:'R6', status:'source-linked'},
  {id:'k2', type:'نموذج', typeEn:'Form', title:'HR-F-29 نموذج طلب بدل السكن', titleEn:'HR-F-29 Advance Housing Allowance Form', departmentId:'hr', version:'R7', status:'master-linked'},
  {id:'k3', type:'إجراء', typeEn:'Procedure', title:'HR-P-15 دعم الدورات والشهادات المهنية', titleEn:'HR-P-15 Professional Courses & Certifications Support', departmentId:'hr', version:'بانتظار ربط المصدر النهائي', versionEn:'Pending final source link', status:'demo'},
  {id:'k4a', type:'نموذج', typeEn:'Form', title:'HR-F-25 مذكرة الحضور', titleEn:'HR-F-25 Attendance Memo', departmentId:'hr', version:'R5', status:'master-linked', path:'assets/HR-F-25 مذكرة الحضور.pdf', formats:['PDF','DOCX']},
  {id:'k4', type:'دليل', typeEn:'Guide', title:'دليل استخدام البورتال', titleEn:'Employee Portal Guide', departmentId:'hr', version:'بانتظار الربط', versionEn:'Pending link', status:'demo'}
];

export const initialDemoRequests = [];
