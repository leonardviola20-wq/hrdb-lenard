import { redirect } from "next/navigation";

export default function PhilhealthContributionsPage() {
  redirect("/reports/contributions?provider=philhealth");
}
