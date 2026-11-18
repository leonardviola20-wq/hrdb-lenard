"use client";

import type { EditorTab } from "../types";

type TabBarProps = {
  tabs: { label: EditorTab; icon: React.ElementType }[];
  activeTab: EditorTab;
  onSelectTab: (tab: EditorTab) => void;
};

/** Accessible (roving tabindex) section tab strip. */
export function EditorTabBar({ tabs, activeTab, onSelectTab }: TabBarProps) {
  return (
    <div className="flex shrink-0 items-center border-b border-gray-200">
      <div role="tablist" aria-label="Employee entry sections" className="min-w-0 overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                id={`employee-entry-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="employee-entry-panel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectTab(tab.label)}
                onKeyDown={(event) => {
                  const nextIndex = event.key === "ArrowRight" || event.key === "ArrowDown"
                    ? (index + 1) % tabs.length
                    : event.key === "ArrowLeft" || event.key === "ArrowUp"
                      ? (index - 1 + tabs.length) % tabs.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? tabs.length - 1
                          : index;
                  if (nextIndex !== index) {
                    event.preventDefault();
                    onSelectTab(tabs[nextIndex].label);
                    document.getElementById(`employee-entry-tab-${nextIndex}`)?.focus();
                  }
                }}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${isActive ? "border-blue-700 text-blue-800" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"}`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
