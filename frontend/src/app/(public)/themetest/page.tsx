"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Badge,
  BarChart,
  Button,
  Calendar,
  Card,
  CardBody,
  Checkbox,
  Input,
  Label,
  LineChart,
  Modal,
  Select,
  Skeleton,
  Spinner,
  SuccessBanner,
  Switch,
  Table,
  TableEmpty,
  TBody,
  TD,
  Textarea,
  TH,
  THead,
  TR,
} from "@/lib/components/ui";

/**
 * Theme laboratory — Canonical Modern Retail OS only.
 * All controls are shared components from `@/lib/components/ui`.
 */
export default function ThemeTestPage() {
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);
  const [selectVal, setSelectVal] = useState("cash");
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [calDate, setCalDate] = useState(new Date());

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [dark]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  const runLoading = () => {
    setLoadingBtn(true);
    window.setTimeout(() => {
      setLoadingBtn(false);
      showToast("Sale finalized — KSh 4,250.00");
    }, 1600);
  };

  const salesByDay = [
    { label: "Mon", value: 42000 },
    { label: "Tue", value: 38500 },
    { label: "Wed", value: 51200 },
    { label: "Thu", value: 47800 },
    { label: "Fri", value: 63400 },
    { label: "Sat", value: 71200 },
    { label: "Sun", value: 28900 },
  ];

  const weekTrend = [
    { label: "W1", value: 210000 },
    { label: "W2", value: 245000 },
    { label: "W3", value: 228000 },
    { label: "W4", value: 271000 },
    { label: "W5", value: 256000 },
    { label: "W6", value: 298000 },
  ];

  return (
    <div data-theme-variant="canonical" className="min-h-screen text-foreground">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-glow"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />
          <p className="text-sm font-medium">{toast}</p>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm void"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Keep line
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                showToast("Line voided");
              }}
            >
              Void line
            </Button>
          </>
        }
      >
        Removes the line from the ticket. Stock is not adjusted until finalize.
      </Modal>

      <header className="border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Canonical · locked
            </p>
            <h1 className="text-h2">Modern Retail OS lab</h1>
            <p className="mt-0.5 text-sm text-muted">
              Shared components from <code className="text-foreground">@/lib/components/ui</code>
            </p>
          </div>
          <Switch
            checked={dark}
            onCheckedChange={setDark}
            label={dark ? "Dark" : "Light"}
            description="Lab toggle only"
          />
        </div>
      </header>

      <main className="section-padding mx-auto max-w-6xl space-y-10 pb-28">
        {/* KPI */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardBody>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Today</p>
              <p className="amount-lg mt-2">KSh 86,400</p>
              <p className="mt-1 text-xs text-muted">Net · 42 tickets</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Open credit</p>
              <p className="amount-lg mt-2 text-brand-secondary">KSh 12,150</p>
              <p className="mt-1 text-xs text-muted">8 customers</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex h-full flex-col justify-between">
              <div>
                <p className="text-sm font-semibold">Danger</p>
                <p className="mt-1 text-xs text-muted">Shared Modal</p>
              </div>
              <Button variant="secondary" className="mt-4 w-full" onClick={() => setModalOpen(true)}>
                Void last line
              </Button>
            </CardBody>
          </Card>
        </section>

        {/* Charts */}
        <section className="grid gap-6 lg:grid-cols-2">
          <BarChart
            title="Sales by day (KSh)"
            data={salesByDay}
            formatValue={(n) => `${Math.round(n / 1000)}k`}
            height={220}
          />
          <LineChart
            title="Weekly net trend"
            data={weekTrend}
            formatValue={(n) => `KSh ${(n / 1000).toFixed(0)}k`}
            height={220}
          />
        </section>

        {/* Calendar + settlement */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-h3">Calendar</h2>
            <Calendar value={calDate} onChange={setCalDate} />
            <p className="text-sm text-muted">
              Selected:{" "}
              <span className="font-medium text-foreground">{format(calDate, "EEE, d MMM yyyy")}</span>
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="text-h3">Settlement</h2>
            <SuccessBanner title="M-Pesa matched">
              <p className="text-xs opacity-90">
                TJ7K2M9L0P · Amina W. · <span className="tabular">14:32:08</span>
              </p>
              <p className="amount-md mt-2">KSh 4,250.00</p>
            </SuccessBanner>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge>Neutral</Badge>
              <Badge variant="success">Matched</Badge>
              <Badge variant="sync">Syncing</Badge>
              <Badge variant="warning">Discrepancy</Badge>
              <Badge variant="error">Failed</Badge>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-3">
          <h2 className="text-h3">Buttons</h2>
          <Card>
            <CardBody className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Void / alert</Button>
              <Button variant="success" onClick={runLoading}>
                Pay / settle
              </Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="primary" isLoading={loadingBtn}>
                Finalize
              </Button>
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
            </CardBody>
          </Card>
        </section>

        {/* Forms */}
        <section className="space-y-3">
          <h2 className="text-h3">Forms</h2>
          <Card>
            <CardBody className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cust">Customer</Label>
                  <Input id="cust" placeholder="Amina Wanjiku" />
                </div>
                <div>
                  <Label htmlFor="amt">Amount</Label>
                  <Input id="amt" currency placeholder="0.00" inputMode="decimal" />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" rows={3} placeholder="Optional" />
                </div>
                <div>
                  <Label htmlFor="pay">Method</Label>
                  <Select id="pay" value={selectVal} onChange={(e) => setSelectVal(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="credit">Credit</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-5">
                <Checkbox label="Print receipt" defaultChecked />
                <Card className="!shadow-none">
                  <CardBody>
                    <Switch
                      checked={toggleOn}
                      onCheckedChange={setToggleOn}
                      label="Auto-sync stock"
                      description="Deduct on finalize"
                    />
                  </CardBody>
                </Card>
                <div>
                  <Label>Error field</Label>
                  <Input error="Enter a valid phone or email." defaultValue="bad@" />
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Table */}
        <section className="space-y-3">
          <h2 className="text-h3">Table</h2>
          <Table>
            <THead>
              <TH>Item</TH>
              <TH>Qty</TH>
              <TH align="right">Amount</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              <TR>
                <TD className="font-medium">Cooking oil 2L</TD>
                <TD tabular>2</TD>
                <TD align="right" tabular>
                  KSh 1,180.00
                </TD>
                <TD>
                  <Badge variant="success">OK</Badge>
                </TD>
              </TR>
              <TR>
                <TD className="font-medium">Maize flour 2kg</TD>
                <TD tabular>5</TD>
                <TD align="right" tabular>
                  KSh 1,125.00
                </TD>
                <TD>
                  <Badge variant="success">OK</Badge>
                </TD>
              </TR>
            </TBody>
          </Table>
          <TableEmpty message="Empty state — no open credit for this filter." />
        </section>

        {/* Loaders */}
        <section className="space-y-3">
          <h2 className="text-h3">Loaders</h2>
          <Card>
            <CardBody className="flex flex-wrap items-center gap-6">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <div className="flex min-w-[12rem] flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Button variant="outline" onClick={() => showToast("Stock received · +24 units")}>
                Fire toast
              </Button>
            </CardBody>
          </Card>
        </section>

        <section className="rounded-lg border border-border bg-register p-5 text-sm text-muted">
          <p className="font-semibold text-foreground">Import path</p>
          <pre className="mt-2 overflow-x-auto text-xs text-foreground">{`import { Button, Input, Calendar, BarChart } from "@/lib/components/ui";`}</pre>
        </section>
      </main>

      <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-border bg-card px-4 py-3 shadow-glow md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">
              <span className="tabular">3</span> items
            </p>
            <p className="amount-md">KSh 4,250.00</p>
          </div>
          <Button variant="success" className="max-w-[10rem] flex-1" onClick={runLoading}>
            Charge
          </Button>
        </div>
      </div>
    </div>
  );
}
