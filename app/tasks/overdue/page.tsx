import { redirect } from "next/navigation";

export default function OverdueTasksPage() {
  redirect("/tasks?filter=OVERDUE");
}
