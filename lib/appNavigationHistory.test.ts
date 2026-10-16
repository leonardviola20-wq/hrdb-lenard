import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  canGoBackWithinApp,
  getAppRouteHistorySnapshot,
  recordAppRoute,
  resetAppRouteHistory,
  toAppRoute,
} from "./appNavigationHistory";

describe("app navigation history", () => {
  beforeEach(() => {
    resetAppRouteHistory();
  });

  it("builds a route key from the pathname, query, and hash", () => {
    assert.equal(toAppRoute({ pathname: "/employees/17" }), "/employees/17");
    assert.equal(
      toAppRoute({ pathname: "/employees/17", search: "?tab=Government", hash: "#history" }),
      "/employees/17?tab=Government#history",
    );
  });

  it("cannot go back before the first recorded route", () => {
    recordAppRoute("/employees");
    assert.equal(canGoBackWithinApp(), false);
    assert.deepEqual(getAppRouteHistorySnapshot(), { routes: ["/employees"], index: 0 });
  });

  it("walks forwards through pushed routes and can go back", () => {
    recordAppRoute("/dashboard");
    recordAppRoute("/employees");
    assert.equal(canGoBackWithinApp(), true);
    assert.deepEqual(getAppRouteHistorySnapshot(), {
      routes: ["/dashboard", "/employees"],
      index: 1,
    });
  });

  it("moves the cursor instead of growing the trail on a history traversal", () => {
    recordAppRoute("/dashboard");
    recordAppRoute("/employees");
    recordAppRoute("/employees/17");

    recordAppRoute("/employees", "traversal");
    assert.deepEqual(getAppRouteHistorySnapshot(), {
      routes: ["/dashboard", "/employees", "/employees/17"],
      index: 1,
    });
    assert.equal(canGoBackWithinApp(), true);

    recordAppRoute("/dashboard", "traversal");
    assert.equal(canGoBackWithinApp(), false);

    recordAppRoute("/employees/17", "traversal");
    assert.equal(canGoBackWithinApp(), true);
  });

  it("drops forward entries once a new route is pushed after going back", () => {
    recordAppRoute("/dashboard");
    recordAppRoute("/employees");
    recordAppRoute("/employees/17");
    recordAppRoute("/dashboard", "traversal");

    recordAppRoute("/reports/sss");
    assert.deepEqual(getAppRouteHistorySnapshot(), {
      routes: ["/dashboard", "/reports/sss"],
      index: 1,
    });
  });

  it("overwrites the current entry for replacements without adding a step", () => {
    recordAppRoute("/dashboard");
    recordAppRoute("/employees/17?status=ACTIVE");

    recordAppRoute("/employees/17?status=ACTIVE&tab=Government", "replace");
    assert.deepEqual(getAppRouteHistorySnapshot(), {
      routes: ["/dashboard", "/employees/17?status=ACTIVE&tab=Government"],
      index: 1,
    });
    assert.equal(canGoBackWithinApp(), true);
  });

  it("keeps a replacement as the first entry unable to go back", () => {
    recordAppRoute("/employees/17");
    recordAppRoute("/employees/17?tab=Government", "replace");
    assert.equal(canGoBackWithinApp(), false);
  });

  it("restarts the trail when a traversal lands on an unrecorded route", () => {
    recordAppRoute("/dashboard");
    recordAppRoute("/employees");

    recordAppRoute("/contacts?page=2", "traversal");
    assert.deepEqual(getAppRouteHistorySnapshot(), { routes: ["/contacts?page=2"], index: 0 });
    assert.equal(canGoBackWithinApp(), false);
  });

  it("ignores a change that repeats the current route", () => {
    recordAppRoute("/dashboard");
    recordAppRoute("/dashboard");
    assert.deepEqual(getAppRouteHistorySnapshot(), { routes: ["/dashboard"], index: 0 });
  });

  it("clears the trail for a new session", () => {
    recordAppRoute("/dashboard");
    recordAppRoute("/employees");
    resetAppRouteHistory();
    assert.deepEqual(getAppRouteHistorySnapshot(), { routes: [], index: -1 });
    assert.equal(canGoBackWithinApp(), false);
  });
});
