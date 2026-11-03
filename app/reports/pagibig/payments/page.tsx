import PagIbigReportsPage from "@/components/PagIbigReportsPage";

export default function Page() {
  // Payments are still served by the shared PagIbigReportsPage (?view=payments).
  // This route is a stepping stone toward a dedicated PagIbigPaymentsPage.
  return <PagIbigReportsPage />;
}