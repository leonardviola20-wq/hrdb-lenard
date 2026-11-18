import { redirect } from "next/navigation";

export default function PagIbigContributionsPage() {
  redirect("/reports/contributions?provider=pagibig");
}
