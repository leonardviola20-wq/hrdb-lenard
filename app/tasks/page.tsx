"use client";

import { useState } from "react";

export default function TasksPage() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Onboard new developer", status: "Pending" },
    { id: 2, title: "Prepare payroll report", status: "Completed" },
    { id: 3, title: "Schedule performance reviews", status: "Pending" },
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <ul className="space-y-2">
        {tasks.map(task => (
          <li key={task.id} className="flex justify-between bg-gray-100 p-2 rounded">
            <span>{task.title}</span>
            <span className={task.status === "Completed" ? "text-green-600" : "text-red-600"}>
              {task.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
