"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Employee = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string | null;
  age: number | null;
  maritalStatus: string | null;
  gender: string | null;
  address: string | null;
  emergencyName: string | null;
  emergencyNumber: string | null;
  emergencyRelation: string | null;
  emergencyAddress: string | null;
  biometricNo: string | null;
  dateStarted: string | null;
  endDate: string | null;
  sssNumber: string | null;
  pagIbigNumber: string | null;
  philHealth: string | null;
  tinNumber: string | null;
  remarks: string | null;
  status: string | null;
  email: string | null;
  mobileNumber: string | null;
  branch: string | null;
  position: string | null;
  photoUrl: string | null;
  assignedBy: string | null;
  assignedAt: string | null;
  employer: { id: number; name: string; company: string | null } | null;
};

const profileTabs = [
  "Personal Information",
  "Contact Information",
  "Emergency Information",
  "Job Information",
  "Government Information",
  "Assignment and Remarks",
] as const;

function dateText(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

function Value({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-medium text-gray-900">{value || "Not set"}</dd>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="border-b border-gray-100 pb-3 text-base font-semibold uppercase tracking-wide text-gray-900">{title}</h2>
      <dl className="mt-4 grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof profileTabs)[number]>(profileTabs[0]);

  useEffect(() => {
    let active = true;
    fetch(`/api/employees/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employee");
        if (active) setEmployee(data.employee);
      })
      .catch((loadError: Error) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const fullName = employee
    ? [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ")
    : "Employee Profile";
  const activeTabIndex = profileTabs.indexOf(activeTab);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full">
        <Link href="/employees" className="text-sm font-medium text-blue-700 hover:underline">← Employee Directory</Link>
        {loading ? (
          <p role="status" className="mt-5 text-sm text-gray-600">Loading employee profile...</p>
        ) : error ? (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : employee ? (
          <>
            <header className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              {employee.photoUrl ? (
                <img src={employee.photoUrl} alt={`${fullName} profile`} className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">No photo</div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-bold text-gray-950 sm:text-2xl">{fullName}</h2>
                <p className="mt-1 text-sm font-medium text-gray-700">{employee.position || "Position not set"} <span className="px-1 text-gray-400">•</span> {employee.branch || "Branch not set"}</p>
                <p className="mt-1 text-sm text-gray-600">{employee.biometricNo || "Not set"}</p>
                <p className={`mt-1 text-sm font-semibold ${["Regular", "Contractual", "Trainee", "Leave"].includes(employee.status || "") ? "text-green-700" : "text-gray-700"}`}>
                  {employee.status || "Status not set"}
                </p>
              </div>
            </header>

            <div className="mt-5">
              <div role="tablist" aria-label="Employee profile sections" className="overflow-x-auto border-b border-gray-200">
                <div className="flex min-w-max">
                  {profileTabs.map((tab, index) => (
                    <button
                      key={tab}
                      id={`employee-profile-tab-${index}`}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab}
                      aria-controls="employee-profile-panel"
                      tabIndex={activeTab === tab ? 0 : -1}
                      onClick={() => setActiveTab(tab)}
                      onKeyDown={(event) => {
                        const nextIndex = event.key === "ArrowRight" || event.key === "ArrowDown"
                          ? (index + 1) % profileTabs.length
                          : event.key === "ArrowLeft" || event.key === "ArrowUp"
                            ? (index - 1 + profileTabs.length) % profileTabs.length
                            : event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? profileTabs.length - 1
                                : index;
                        if (nextIndex !== index) {
                          event.preventDefault();
                          setActiveTab(profileTabs[nextIndex]);
                          document.getElementById(`employee-profile-tab-${nextIndex}`)?.focus();
                        }
                      }}
                      className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === tab ? "border-blue-700 text-blue-800" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div id="employee-profile-panel" role="tabpanel" aria-labelledby={`employee-profile-tab-${activeTabIndex}`} className="mt-4">
              {activeTab === "Personal Information" && <ProfileSection title="Personal Information">
                <Value label="First Name" value={employee.firstName} />
                <Value label="Middle Name" value={employee.middleName} />
                <Value label="Last Name" value={employee.lastName} />
                <Value label="Date of Birth" value={dateText(employee.dateOfBirth)} />
                <Value label="Age" value={employee.age} />
                <Value label="Marital Status" value={employee.maritalStatus} />
                <Value label="Gender" value={employee.gender} />
              </ProfileSection>}

              {activeTab === "Contact Information" && <ProfileSection title="Contact Information">
                <Value label="Mobile Number" value={employee.mobileNumber} />
                <Value label="Email" value={employee.email} />
                <div className="sm:col-span-2"><Value label="Address" value={employee.address} /></div>
              </ProfileSection>}

              {activeTab === "Emergency Information" && <ProfileSection title="Emergency Information">
                <Value label="Contact Person" value={employee.emergencyName} />
                <Value label="Contact Number" value={employee.emergencyNumber} />
                <Value label="Relation" value={employee.emergencyRelation} />
                <div className="sm:col-span-2"><Value label="Address" value={employee.emergencyAddress} /></div>
              </ProfileSection>}

              {activeTab === "Job Information" && <ProfileSection title="Job Information">
                <Value label="Biometric No." value={employee.biometricNo} />
                <Value label="Employer" value={employee.employer?.name} />
                <Value label="Status" value={employee.status} />
                <Value label="Branch" value={employee.branch} />
                <Value label="Position" value={employee.position} />
                <Value label="Date Started" value={dateText(employee.dateStarted)} />
                <Value label="Ended" value={dateText(employee.endDate)} />
              </ProfileSection>}

              {activeTab === "Government Information" && <ProfileSection title="Government Information">
                <Value label="SSS" value={employee.sssNumber} />
                <Value label="Pag-IBIG" value={employee.pagIbigNumber} />
                <Value label="PhilHealth" value={employee.philHealth} />
                <Value label="TIN" value={employee.tinNumber} />
              </ProfileSection>}

              {activeTab === "Assignment and Remarks" && <ProfileSection title="Assignment and Remarks">
                <Value label="Assigned By" value={employee.assignedBy} />
                <Value label="Assigned At" value={dateText(employee.assignedAt)} />
                <div className="sm:col-span-2"><Value label="Remarks" value={employee.remarks} /></div>
              </ProfileSection>}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
