export type EditorTab = "Personal Information" | "Employment" | "Government";

export type Employer = { id: number; name: string; company: string | null };
export type SupervisorOption = { id: number; firstName: string; middleName: string | null; lastName: string; position: string | null };

export const statusOptions = ["Trainee", "Regular", "Contractual", "No Contract", "End of contract", "Resigned", "Terminated", "AWOL", "Leave"];
export const branchOptions = ["Arya 1", "Arya 2", "Yasuo", "Shangri-la", "Greenhills", "Magnolia", "MyDay", "Warehouse", "Office", "Vape", "Commissary", "Others"];
export const positionOptions = ["President", "Corporate Secretary", "Treasurer", "Accountant", "Purchaser", "IT", "Admin", "Admin Staff", "Office Staff", "Store In-charge", "Commissary Staff", "Driver", "Sales Staff", "Dining Staff", "Cashier", "Kitchen Staff", "Dispatcher", "Receptionist", "Warehouse Staff"];

export const endedStatuses = new Set(["Contractual", "End of contract", "Resigned", "Terminated", "AWOL"]);
export const activeStatuses = new Set(["Regular", "Contractual", "Trainee", "Leave"]);

export type EditorForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  maritalStatus: string;
  gender: string;
  mobileNumber: string;
  photoUrl: string;
  email: string;
  address: string;
  emergencyName: string;
  emergencyNumber: string;
  emergencyRelation: string;
  emergencyAddress: string;
  biometricNo: string;
  branch: string;
  position: string;
  jobLevel: string;
  supervisorId: string;
  employerId: string;
  status: string;
  dateStarted: string;
  endDate: string;
  sssNumber: string;
  pagIbigNumber: string;
  philHealth: string;
  tinNumber: string;
  remarks: string;
};

export const emptyForm: EditorForm = {
  firstName: "", middleName: "", lastName: "", dateOfBirth: "", maritalStatus: "", gender: "", mobileNumber: "",
  photoUrl: "", email: "", address: "",
  emergencyName: "", emergencyNumber: "", emergencyRelation: "", emergencyAddress: "",
  biometricNo: "", branch: "", position: "", jobLevel: "", supervisorId: "", employerId: "",
  status: "Trainee", dateStarted: "", endDate: "",
  sssNumber: "", pagIbigNumber: "", philHealth: "", tinNumber: "", remarks: "",
};

import type { useEmployeeEditorForm } from "./hooks/useEmployeeEditorForm";
import type { useCardEditing } from "./hooks/useCardEditing";

/** Everything the tab panels need, assembled by the page orchestrator. */
export type EditorController =
  ReturnType<typeof useEmployeeEditorForm> &
  Omit<ReturnType<typeof useCardEditing>, "saveCard" | "startCardEdit"> & {
    canEditCards: boolean;
    employeeId: number | null;
    startCardEdit: (cardKey: string, fields: (keyof EditorForm)[]) => void;
    saveCard: (cardKey: string) => void;
  };
