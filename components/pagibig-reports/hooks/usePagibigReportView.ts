"use client";

import { useMemo } from "react";
import {
  filterPagibigPreviewEmployees,
  isPagibigPreviewReady,
  sortPagibigPreviewMembers,
  type PagibigPreviewFilter,
} from "@/lib/pagibigReportPreview";
import { memberPageSize, monthNames } from '@/components/pagibig-reports/shared/constants';
import { formatEmployeeName, memberAmountColumns } from '@/components/pagibig-reports/shared/format';
import type { Account, Member, Report, ReportEmployer } from '@/components/pagibig-reports/shared/types';

type UsePagibigReportViewOptions = {
  members: Member[];
  reports: Report[];
  reportView: "PIF" | "MANUAL";
  yearFilter: string;
  paymentStatusFilter: "ALL" | "PAID" | "UNPAID";
  search: string;
  memberStatusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  memberPage: number;
  reportPage: number;
  previewMembers: Member[];
  previewFilter: PagibigPreviewFilter;
  manualReport: boolean;
  reportKind: "CONTRIBUTION" | "LOAN";
  selectedEmployerId: string;
  reportEmployer: ReportEmployer | null;
};

export function usePagibigReportView({
  members,
  reports,
  reportView,
  yearFilter,
  paymentStatusFilter,
  search,
  memberStatusFilter,
  memberPage,
  reportPage,
  previewMembers,
  previewFilter,
  manualReport,
  reportKind,
  selectedEmployerId,
  reportEmployer,
}: UsePagibigReportViewOptions) {
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return members
      .filter((member) => {
        const isInactive = Boolean(member.pagIbigAccount?.excludedFromReport);
        const matchesStatus = memberStatusFilter === "ALL"
          || (memberStatusFilter === "INACTIVE" ? isInactive : !isInactive);
        const matchesSearch = !query || [formatEmployeeName(member), member.employeeCode, member.pagIbigNumber, member.status]
          .some((value) => value?.toLocaleLowerCase().includes(query));
        return matchesStatus && matchesSearch;
      })
      .sort((left, right) => {
        const last = left.lastName.localeCompare(right.lastName, undefined, { sensitivity: "base" });
        if (last !== 0) return last;
        const first = left.firstName.localeCompare(right.firstName, undefined, { sensitivity: "base" });
        if (first !== 0) return first;
        const code = left.employeeCode.localeCompare(right.employeeCode, undefined, { numeric: true, sensitivity: "base" });
        if (code !== 0) return code;
        return left.id - right.id;
      });
  }, [members, memberStatusFilter, search]);

  const memberPageCount = Math.max(1, Math.ceil(filteredMembers.length / memberPageSize));
  const currentMemberPage = Math.min(memberPage, memberPageCount);
  const visibleMembers = filteredMembers.slice((currentMemberPage - 1) * memberPageSize, currentMemberPage * memberPageSize);
  const memberFirstResult = filteredMembers.length ? (currentMemberPage - 1) * memberPageSize + 1 : 0;
  const memberLastResult = Math.min(currentMemberPage * memberPageSize, filteredMembers.length);

  const years = useMemo(
    () => [...new Set([new Date().getFullYear(), ...reports.filter((report) => (reportView === "MANUAL") === report.manual).map((report) => report.applicableYear)])]
      .sort((a, b) => b - a),
    [reports, reportView],
  );
  const visibleReports = useMemo(() => reports.filter((report) => {
    if ((reportView === "MANUAL") !== report.manual) return false;
    if (yearFilter && String(report.applicableYear) !== yearFilter) return false;
    const paid = report.amountPaid !== null && report.payDate !== null;
    if (paymentStatusFilter !== "ALL" && (paymentStatusFilter === "PAID") !== paid) return false;
    const query = search.trim().toLocaleLowerCase();
    return !query || `${monthNames[report.applicableMonth - 1]} ${report.applicableYear} ${report.amountDue} ${report.amountPaid ?? ""} ${report.entries.map((entry) => `${entry.employeeName} ${entry.midNumber ?? ""}`).join(" ")}`
      .toLocaleLowerCase().includes(query);
  }), [paymentStatusFilter, reports, reportView, search, yearFilter]);

  const manualMergedReports = useMemo(() => {
    if (reportView !== "MANUAL") return [];
    const groups = new Map<string, Report[]>();
    for (const report of visibleReports) {
      const key = `${report.applicableYear}-${report.applicableMonth}`;
      const group = groups.get(key) ?? [];
      group.push(report);
      groups.set(key, group);
    }

    const merged: Report[] = [];
    for (const group of groups.values()) {
      const contribution = group.find((report) => report.kind === "CONTRIBUTION");
      const loan = group.find((report) => report.kind === "LOAN");
      const base = contribution ?? loan;
      if (!base) continue;

      const allPaid = group.every((report) => report.amountPaid !== null && report.payDate !== null);
      merged.push({
        ...base,
        manual: true,
        employeeSavingsTotal: contribution ? contribution.employeeSavingsTotal : "0",
        employerSavingsTotal: contribution ? contribution.employerSavingsTotal : "0",
        mp2Total: contribution ? contribution.mp2Total : "0",
        calamityLoanTotal: loan ? loan.calamityLoanTotal : "0",
        mplLoanTotal: loan ? loan.mplLoanTotal : "0",
        emergencyLoanTotal: loan ? loan.emergencyLoanTotal : "0",
        safeLoanTotal: loan ? loan.safeLoanTotal : "0",
        amountDue: String(Number(contribution ? contribution.amountDue : 0) + Number(loan ? loan.amountDue : 0)),
        amountPaid: allPaid
          ? String(Number(contribution ? contribution.amountPaid : 0) + Number(loan ? loan.amountPaid : 0))
          : contribution ? contribution.amountPaid : loan ? loan.amountPaid : null,
        paymentType: contribution ? contribution.paymentType : loan ? loan.paymentType : null,
        payDate: allPaid ? contribution ? contribution.payDate : loan ? loan.payDate : null : null,
        transactionReference: contribution ? contribution.transactionReference : loan ? loan.transactionReference : null,
        entries: [...(contribution ? contribution.entries : []), ...(loan ? loan.entries : [])],
      });
    }
    return merged.sort((left, right) => right.applicableYear - left.applicableYear || right.applicableMonth - left.applicableMonth);
  }, [visibleReports, reportView]);

  const tableReports = reportView === "MANUAL" ? manualMergedReports : visibleReports;
  const reportPageSize = 8;
  const reportPageCount = Math.max(1, Math.ceil(tableReports.length / reportPageSize));
  const currentReportPage = Math.min(reportPage, reportPageCount);
  const pagedReports = tableReports.slice((currentReportPage - 1) * reportPageSize, currentReportPage * reportPageSize);
  const displayedPagibigReports = useMemo(() => {
    if (!yearFilter) return pagedReports;
    const year = Number(yearFilter);
    const isManual = reportView === "MANUAL";
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const existing = tableReports.find((report) => report.applicableYear === year && report.applicableMonth === month);
      return existing ?? ({
        id: -month,
        kind: "CONTRIBUTION",
        manual: isManual,
        pin: "",
        employerId: Number(selectedEmployerId),
        employerName: reportEmployer?.name ?? "",
        employerPagibigNumber: reportEmployer?.pagibigNumber ?? null,
        applicableMonth: month,
        applicableYear: year,
        employeeSavingsTotal: "0",
        employerSavingsTotal: "0",
        mp2Total: "0",
        calamityLoanTotal: "0",
        mplLoanTotal: "0",
        emergencyLoanTotal: "0",
        safeLoanTotal: "0",
        amountDue: "0",
        amountPaid: null,
        paymentType: null,
        payDate: null,
        transactionReference: null,
        entries: [],
      } satisfies Report);
    });
  }, [yearFilter, tableReports, pagedReports, selectedEmployerId, reportEmployer, reportView]);

  const memberTotals = memberAmountColumns.map((column) => filteredMembers.reduce(
    (total, member) => total + Number(member.pagIbigAccount?.[column.field] ?? 0),
    0,
  ));
  const memberSavingsTotal = memberTotals[0] + memberTotals[1];
  const memberOverallTotal = memberTotals.reduce((total, amount) => total + amount, 0);
  const showSavingsColumns = !manualReport || reportKind === "CONTRIBUTION";
  const showLoanColumns = !manualReport || reportKind === "LOAN";
  const previewColumnCount = (showSavingsColumns ? 2 : 0) + (showLoanColumns ? 1 : 0) + 4;
  const filteredPreviewMembers = useMemo(
    () => sortPagibigPreviewMembers(filterPagibigPreviewEmployees(previewMembers, previewFilter)),
    [previewMembers, previewFilter],
  );
  const previewEntries = previewMembers.filter(isPagibigPreviewReady);
  const previewTotal = (field: keyof Account) => filteredPreviewMembers.reduce(
    (total, member) => total + Number(member.pagIbigAccount?.[field] ?? 0),
    0,
  );
  const previewOverallFields = [
    ...(showSavingsColumns ? ["employeeSavings", "employerSavings", "mp2Amount"] : []),
    ...(showLoanColumns ? ["calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"] : []),
  ];
  const previewOverall = previewOverallFields.reduce((sum, field) => sum + previewTotal(field as keyof Account), 0);

  return {
    filteredMembers,
    memberPageCount,
    currentMemberPage,
    visibleMembers,
    memberFirstResult,
    memberLastResult,
    years,
    visibleReports,
    tableReports,
    reportPageSize,
    reportPageCount,
    currentReportPage,
    pagedReports,
    displayedPagibigReports,
    memberTotals,
    memberSavingsTotal,
    memberOverallTotal,
    showSavingsColumns,
    showLoanColumns,
    previewColumnCount,
    filteredPreviewMembers,
    previewEntries,
    previewTotal,
    previewOverall,
  };
}
