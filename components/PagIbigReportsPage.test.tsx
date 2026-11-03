import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let search = "employerId=1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import PagIbigReportsPage from "@/components/PagIbigReportsPage";

describe("PagIbigReportsPage smoke", () => {
  beforeEach(() => {
    search = "employerId=1";
  });

  it("renders employee list view without crashing", () => {
    render(<PagIbigReportsPage />);
    expect(screen.getByText(/Employee List/i)).toBeInTheDocument();
  });

  it("renders payments view without crashing", () => {
    search = "employerId=1&view=payments";
    render(<PagIbigReportsPage />);
    expect(screen.getByText(/Payments/i)).toBeInTheDocument();
  });

  it("opens the add account modal", async () => {
    const user = userEvent.setup();
    render(<PagIbigReportsPage />);
    const addButton = screen.getByRole("button", { name: /Add/i });
    await user.click(addButton);
    expect(await screen.findByText(/Add Pag-IBIG Account/i)).toBeInTheDocument();
  });

  it("renders member status filter in employee view", () => {
    render(<PagIbigReportsPage />);
    expect(screen.getByLabelText(/Filter employee accounts by status/i)).toBeInTheDocument();
  });

  it("accepts search input in employee view", async () => {
    const user = userEvent.setup();
    render(<PagIbigReportsPage />);
    const input = screen.getByLabelText(/Search Pag-IBIG records/i);
    await user.type(input, "abc");
    expect(input).toHaveValue("abc");
  });

  it("clicks refresh button without crashing", async () => {
    const user = userEvent.setup();
    render(<PagIbigReportsPage />);
    const refresh = screen.getByRole("button", { name: /Refresh Pag-IBIG records/i });
    await user.click(refresh);
    expect(refresh).toBeInTheDocument();
  });

  it("renders search input in payments view", () => {
    search = "employerId=1&view=payments";
    render(<PagIbigReportsPage />);
    expect(screen.getByLabelText(/Search Pag-IBIG records/i)).toBeInTheDocument();
  });

  it("shows Drafts control in payments view", () => {
    search = "employerId=1&view=payments";
    render(<PagIbigReportsPage />);
    expect(screen.getByText(/Drafts/i)).toBeInTheDocument();
  });

  it("shows select-employer notice when no employer is selected", () => {
    search = "";
    render(<PagIbigReportsPage />);
    expect(screen.getByText(/Select an employer from the Reports dashboard/i)).toBeInTheDocument();
  });

  it("renders year filter in payments view", () => {
    search = "employerId=1&view=payments";
    render(<PagIbigReportsPage />);
    expect(screen.getByLabelText(/Filter reports by year/i)).toBeInTheDocument();
  });

  it("renders payment status filter in payments view", () => {
    search = "employerId=1&view=payments";
    render(<PagIbigReportsPage />);
    expect(screen.getByLabelText(/Filter reports by payment status/i)).toBeInTheDocument();
  });

  it("toggles Drafts menu in payments view", async () => {
    search = "employerId=1&view=payments";
    const user = userEvent.setup();
    render(<PagIbigReportsPage />);
    const draftsBtn = screen.getByRole("button", { name: /Drafts/i });
    await user.click(draftsBtn);
    expect(draftsBtn).toBeInTheDocument();
  });

  it("changes payment status filter without crashing", async () => {
    search = "employerId=1&view=payments";
    const user = userEvent.setup();
    render(<PagIbigReportsPage />);
    const select = screen.getByLabelText(/Filter reports by payment status/i);
    await user.selectOptions(select, "PAID");
    expect(select).toHaveValue("PAID");
  });
});