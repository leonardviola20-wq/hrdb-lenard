import { redirect } from "next/navigation";

export default function CompletedTasksPage() {
  redirect("/tasks?filter=COMPLETED");
}
