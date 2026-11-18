import { redirect } from "next/navigation";

export default function SssContributionsPage() {
  redirect("/reports/contributions?provider=sss");
}
