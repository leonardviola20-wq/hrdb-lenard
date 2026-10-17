export type AppRouteChangeKind = "push" | "replace" | "traversal";

export type AppRouteLocation = {
  pathname: string;
  search?: string;
  hash?: string;
};

// Full route keys ("/employees/17?status=ACTIVE#history") of the HRDB screens the
// browser has walked through this session. The index mirrors the browser's current
// position so a Back control can tell whether stepping into history stays in the app.
const appRouteHistory: string[] = [];
const appRouteHistoryLimit = 60;
let appRouteHistoryIndex = -1;

export function toAppRoute(location: AppRouteLocation) {
  return `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;
}

export function recordAppRoute(route: string, change: AppRouteChangeKind = "push") {
  if (!route) return;

  if (appRouteHistoryIndex === -1) {
    appRouteHistory.push(route);
    appRouteHistoryIndex = 0;
    return;
  }

  if (appRouteHistory[appRouteHistoryIndex] === route) return;

  if (change === "traversal") {
    const recordedIndex = findRecordedRoute(route);
    if (recordedIndex === -1) {
      // Arrived at a route this session never pushed (an entry from before a reload),
      // so nothing earlier in the trail is known to be an HRDB screen.
      appRouteHistory.splice(0, appRouteHistory.length, route);
      appRouteHistoryIndex = 0;
      return;
    }
    appRouteHistoryIndex = recordedIndex;
    return;
  }

  if (change === "replace") {
    appRouteHistory[appRouteHistoryIndex] = route;
    return;
  }

  appRouteHistory.splice(appRouteHistoryIndex + 1);
  appRouteHistory.push(route);
  if (appRouteHistory.length > appRouteHistoryLimit) {
    appRouteHistory.splice(0, appRouteHistory.length - appRouteHistoryLimit);
  }
  appRouteHistoryIndex = appRouteHistory.length - 1;
}

function findRecordedRoute(route: string) {
  // Prefer the nearest earlier visit so a repeated route resolves to the entry the
  // browser just stepped onto while travelling backwards.
  for (let index = appRouteHistoryIndex - 1; index >= 0; index -= 1) {
    if (appRouteHistory[index] === route) return index;
  }
  for (let index = appRouteHistoryIndex + 1; index < appRouteHistory.length; index += 1) {
    if (appRouteHistory[index] === route) return index;
  }
  return -1;
}

export function canGoBackWithinApp() {
  return appRouteHistoryIndex > 0;
}

export function getAppRouteHistorySnapshot() {
  return { routes: [...appRouteHistory], index: appRouteHistoryIndex };
}

export function resetAppRouteHistory() {
  appRouteHistory.length = 0;
  appRouteHistoryIndex = -1;
}
