
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  username: 'username',
  name: 'name',
  password: 'password',
  role: 'role',
  canAccessEmployees: 'canAccessEmployees',
  accessiblePages: 'accessiblePages',
  emailVerified: 'emailVerified',
  verificationTokenHash: 'verificationTokenHash',
  verificationTokenExpires: 'verificationTokenExpires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  authorId: 'authorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  category: 'category',
  notes: 'notes',
  recurrence: 'recurrence',
  recurrenceAnchor: 'recurrenceAnchor',
  isFlagged: 'isFlagged',
  dueDate: 'dueDate',
  sortOrder: 'sortOrder',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskRescheduleScalarFieldEnum = {
  id: 'id',
  taskId: 'taskId',
  previousDueDate: 'previousDueDate',
  newDueDate: 'newDueDate',
  reason: 'reason',
  createdAt: 'createdAt'
};

exports.Prisma.TaskDependencyScalarFieldEnum = {
  blockedTaskId: 'blockedTaskId',
  prerequisiteTaskId: 'prerequisiteTaskId'
};

exports.Prisma.TaskPrerequisiteItemScalarFieldEnum = {
  id: 'id',
  taskId: 'taskId',
  title: 'title',
  isCompleted: 'isCompleted',
  createdAt: 'createdAt',
  completedAt: 'completedAt'
};

exports.Prisma.EmployeeScalarFieldEnum = {
  id: 'id',
  status: 'status',
  dateStarted: 'dateStarted',
  employerId: 'employerId',
  address: 'address',
  age: 'age',
  biometricNo: 'biometricNo',
  branch: 'branch',
  position: 'position',
  createdAt: 'createdAt',
  dateOfBirth: 'dateOfBirth',
  email: 'email',
  emergencyAddress: 'emergencyAddress',
  emergencyName: 'emergencyName',
  emergencyNumber: 'emergencyNumber',
  emergencyRelation: 'emergencyRelation',
  employeeCode: 'employeeCode',
  endDate: 'endDate',
  firstName: 'firstName',
  gender: 'gender',
  jobLevel: 'jobLevel',
  lastName: 'lastName',
  maritalStatus: 'maritalStatus',
  middleName: 'middleName',
  mobileNumber: 'mobileNumber',
  pagIbigNumber: 'pagIbigNumber',
  philHealth: 'philHealth',
  photoUrl: 'photoUrl',
  remarks: 'remarks',
  sssNumber: 'sssNumber',
  tinNumber: 'tinNumber',
  updatedAt: 'updatedAt',
  supervisorId: 'supervisorId',
  assignedBy: 'assignedBy',
  assignedAt: 'assignedAt',
  requirementsBypassed: 'requirementsBypassed'
};

exports.Prisma.EmployeeRequirementScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  requirementKey: 'requirementKey',
  isComplete: 'isComplete',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeRequirementAttachmentScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  requirementKey: 'requirementKey',
  employeeRequirementId: 'employeeRequirementId',
  fileName: 'fileName',
  mimeType: 'mimeType',
  size: 'size',
  content: 'content',
  createdAt: 'createdAt'
};

exports.Prisma.EmployeeBdoAccountNumberScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  accountNumber: 'accountNumber',
  createdAt: 'createdAt'
};

exports.Prisma.EmployeeCategoryScalarFieldEnum = {
  id: 'id',
  type: 'type',
  name: 'name',
  active: 'active',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  date: 'date',
  timeIn: 'timeIn',
  timeOut: 'timeOut',
  status: 'status',
  branch: 'branch',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceImportScalarFieldEnum = {
  id: 'id',
  branch: 'branch',
  fileName: 'fileName',
  totalRows: 'totalRows',
  importedRows: 'importedRows',
  duplicateRows: 'duplicateRows',
  unmatchedRows: 'unmatchedRows',
  createdAt: 'createdAt'
};

exports.Prisma.AttendancePunchScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  attendanceId: 'attendanceId',
  importId: 'importId',
  date: 'date',
  time: 'time',
  deviceNumber: 'deviceNumber',
  branch: 'branch',
  createdAt: 'createdAt'
};

exports.Prisma.EmployerScalarFieldEnum = {
  id: 'id',
  name: 'name',
  company: 'company',
  branches: 'branches',
  status: 'status',
  email: 'email',
  contactNumber: 'contactNumber',
  branchStatus: 'branchStatus',
  president: 'president',
  longAddress: 'longAddress',
  shortAddress: 'shortAddress',
  logo: 'logo',
  secDti: 'secDti',
  secDtiRegistrationDate: 'secDtiRegistrationDate',
  tin: 'tin',
  tinRegistrationDate: 'tinRegistrationDate',
  sss: 'sss',
  sssRegistrationDate: 'sssRegistrationDate',
  hdmf: 'hdmf',
  hdmfRegistrationDate: 'hdmfRegistrationDate',
  phic: 'phic',
  phicRegistrationDate: 'phicRegistrationDate'
};

exports.Prisma.SssLoanScalarFieldEnum = {
  id: 'id',
  employerId: 'employerId',
  employeeId: 'employeeId',
  employeeName: 'employeeName',
  employeeCode: 'employeeCode',
  biometricNo: 'biometricNo',
  loanAccountNumber: 'loanAccountNumber',
  transactionNumber: 'transactionNumber',
  loanType: 'loanType',
  loanDate: 'loanDate',
  loanAmount: 'loanAmount',
  monthlyAmortization: 'monthlyAmortization',
  status: 'status',
  statusReason: 'statusReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SssReportScalarFieldEnum = {
  id: 'id',
  kind: 'kind',
  employerId: 'employerId',
  employerName: 'employerName',
  employerAddress: 'employerAddress',
  employerSssNumber: 'employerSssNumber',
  prn: 'prn',
  applicableMonth: 'applicableMonth',
  applicableYear: 'applicableYear',
  amountDue: 'amountDue',
  amountPaid: 'amountPaid',
  paymentType: 'paymentType',
  payDate: 'payDate',
  sssBranch: 'sssBranch',
  transactionReference: 'transactionReference',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SssReportEntryScalarFieldEnum = {
  id: 'id',
  reportId: 'reportId',
  employeeId: 'employeeId',
  employeeName: 'employeeName',
  employeeCode: 'employeeCode',
  employeeSssNumber: 'employeeSssNumber',
  sssLoanId: 'sssLoanId',
  loanAccountNumber: 'loanAccountNumber',
  employeeEmployerId: 'employeeEmployerId',
  employeeEmployerName: 'employeeEmployerName',
  salaryRange: 'salaryRange',
  monthlySalaryCredit: 'monthlySalaryCredit',
  employeeSs: 'employeeSs',
  employerSs: 'employerSs',
  employeeMpf: 'employeeMpf',
  employerMpf: 'employerMpf',
  ec: 'ec',
  loanAmount: 'loanAmount',
  totalAmount: 'totalAmount'
};

exports.Prisma.SssReportDraftScalarFieldEnum = {
  id: 'id',
  createdBy: 'createdBy',
  kind: 'kind',
  employerId: 'employerId',
  prn: 'prn',
  applicableMonth: 'applicableMonth',
  applicableYear: 'applicableYear',
  amountDue: 'amountDue',
  entries: 'entries',
  continuedBy: 'continuedBy',
  continuedAt: 'continuedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PagibigEmployeeLoanScalarFieldEnum = {
  id: 'id',
  recordId: 'recordId',
  employerId: 'employerId',
  loanType: 'loanType',
  applicationNo: 'applicationNo',
  loanTermDate: 'loanTermDate',
  termYears: 'termYears',
  termEndDate: 'termEndDate',
  amount: 'amount',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PagibigEmployeeRecordScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  employerId: 'employerId',
  year: 'year',
  eeShare: 'eeShare',
  erShare: 'erShare',
  mp2AccountNo: 'mp2AccountNo',
  mp2Amount: 'mp2Amount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  excludedFromReport: 'excludedFromReport'
};

exports.Prisma.PagibigLoanScalarFieldEnum = {
  id: 'id',
  employerId: 'employerId',
  employeeId: 'employeeId',
  employeeName: 'employeeName',
  employeeCode: 'employeeCode',
  applicationNo: 'applicationNo',
  transactionNumber: 'transactionNumber',
  loanType: 'loanType',
  loanDate: 'loanDate',
  loanAmount: 'loanAmount',
  monthlyAmortization: 'monthlyAmortization',
  status: 'status',
  statusReason: 'statusReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PagibigReportScalarFieldEnum = {
  id: 'id',
  kind: 'kind',
  employerId: 'employerId',
  employerName: 'employerName',
  employerPagibigNumber: 'employerPagibigNumber',
  pin: 'pin',
  applicableMonth: 'applicableMonth',
  applicableYear: 'applicableYear',
  amountDue: 'amountDue',
  amountPaid: 'amountPaid',
  paymentType: 'paymentType',
  payDate: 'payDate',
  transactionReference: 'transactionReference',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PagibigReportDraftScalarFieldEnum = {
  id: 'id',
  createdBy: 'createdBy',
  kind: 'kind',
  employerId: 'employerId',
  pin: 'pin',
  applicableMonth: 'applicableMonth',
  applicableYear: 'applicableYear',
  entries: 'entries',
  continuedBy: 'continuedBy',
  continuedAt: 'continuedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PagibigReportEntryScalarFieldEnum = {
  id: 'id',
  reportId: 'reportId',
  employeeId: 'employeeId',
  employeeName: 'employeeName',
  employeeCode: 'employeeCode',
  employeePagibigNumber: 'employeePagibigNumber',
  employeeEmployerId: 'employeeEmployerId',
  employeeEmployerName: 'employeeEmployerName',
  pagibigLoanId: 'pagibigLoanId',
  applicationNo: 'applicationNo',
  memberSavings: 'memberSavings',
  modifiedSavings: 'modifiedSavings',
  multiPurposeLoan: 'multiPurposeLoan',
  calamityLoan: 'calamityLoan',
  safeLoan: 'safeLoan',
  loanAmount: 'loanAmount',
  totalAmount: 'totalAmount',
  ledgerSnapshot: 'ledgerSnapshot',
  emergencyLoan: 'emergencyLoan'
};

exports.Prisma.PhilHealthEmployeeRecordScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  employerId: 'employerId',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PhilHealthReportScalarFieldEnum = {
  id: 'id',
  employerId: 'employerId',
  employerName: 'employerName',
  employerPhicNumber: 'employerPhicNumber',
  applicableMonth: 'applicableMonth',
  applicableYear: 'applicableYear',
  amountDue: 'amountDue',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PhilHealthReportEntryScalarFieldEnum = {
  id: 'id',
  reportId: 'reportId',
  employeeId: 'employeeId',
  employeeName: 'employeeName',
  employeeCode: 'employeeCode',
  employeePhilHealthNumber: 'employeePhilHealthNumber',
  amount: 'amount'
};

exports.Prisma.PhilHealthPaymentScalarFieldEnum = {
  id: 'id',
  reportId: 'reportId',
  payorName: 'payorName',
  pen: 'pen',
  spa: 'spa',
  applicablePeriod: 'applicablePeriod',
  amountPaid: 'amountPaid',
  accreditedCollectingAgent: 'accreditedCollectingAgent',
  transactionConfirmationNumber: 'transactionConfirmationNumber',
  transactionDate: 'transactionDate',
  eparNumber: 'eparNumber',
  eparDate: 'eparDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OfficeContactScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  companyName: 'companyName',
  contactName: 'contactName',
  category: 'category',
  phone: 'phone',
  email: 'email',
  address: 'address',
  services: 'services',
  branch: 'branch',
  notes: 'notes',
  photoUrl: 'photoUrl',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  User: 'User',
  Post: 'Post',
  Task: 'Task',
  TaskReschedule: 'TaskReschedule',
  TaskDependency: 'TaskDependency',
  TaskPrerequisiteItem: 'TaskPrerequisiteItem',
  employee: 'employee',
  EmployeeRequirement: 'EmployeeRequirement',
  EmployeeRequirementAttachment: 'EmployeeRequirementAttachment',
  EmployeeBdoAccountNumber: 'EmployeeBdoAccountNumber',
  EmployeeCategory: 'EmployeeCategory',
  Attendance: 'Attendance',
  AttendanceImport: 'AttendanceImport',
  AttendancePunch: 'AttendancePunch',
  employer: 'employer',
  SssLoan: 'SssLoan',
  SssReport: 'SssReport',
  SssReportEntry: 'SssReportEntry',
  SssReportDraft: 'SssReportDraft',
  PagibigEmployeeLoan: 'PagibigEmployeeLoan',
  PagibigEmployeeRecord: 'PagibigEmployeeRecord',
  PagibigLoan: 'PagibigLoan',
  PagibigReport: 'PagibigReport',
  PagibigReportDraft: 'PagibigReportDraft',
  PagibigReportEntry: 'PagibigReportEntry',
  PhilHealthEmployeeRecord: 'PhilHealthEmployeeRecord',
  PhilHealthReport: 'PhilHealthReport',
  PhilHealthReportEntry: 'PhilHealthReportEntry',
  PhilHealthPayment: 'PhilHealthPayment',
  OfficeContact: 'OfficeContact'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
