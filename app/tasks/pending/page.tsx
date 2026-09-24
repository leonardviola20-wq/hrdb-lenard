import { redirect } from "next/navigation";

export default function PendingTasksPage() {
  redirect("/tasks?filter=PENDING");
}
