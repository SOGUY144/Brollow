"use client";

import { ArrowDownLeft, ArrowUpRight, CheckCircle2, History, Plus, QrCode, ShieldCheck, Wallet as WalletIcon, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { errorMessage, useData } from "@/components/data-provider";
import { Button } from "@/components/ui/button";
import { useLoad } from "@/components/use-catalog";
import { formatMoney } from "@/lib/format";

const THAI_BANKS = [
  { id: "kbank", name: "Kasikornbank (KBank)" },
  { id: "scb", name: "Siam Commercial Bank (SCB)" },
  { id: "bbl", name: "Bangkok Bank (BBL)" },
  { id: "ktb", name: "Krungthai Bank (KTB)" },
  { id: "promptpay", name: "PromptPay (Mobile / Citizen ID)" },
];

export function WalletCard({ showRecentTransactions = true }: { showRecentTransactions?: boolean }) {
  const { api, viewer } = useData();
  const walletData = useLoad(async () => {
    return api.getWallet();
  }, [api]);

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [depositBusy, setDepositBusy] = useState(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [selectedBank, setSelectedBank] = useState(THAI_BANKS[0].name);
  const [accountNumber, setAccountNumber] = useState("123-4-56789-0");
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  const wallet = walletData.status === "ready" ? walletData.data : { balanceSatang: 0, transactions: [] };

  // Generate a clean account code from viewer ID
  const accountCode = viewer?.id ? `BROL-${viewer.id.slice(0, 6).toUpperCase()}` : "BROL-DEMO";

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (depositAmount <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    setDepositBusy(true);
    try {
      await api.depositWallet(depositAmount * 100);
      toast.success(`Deposited ฿${depositAmount.toLocaleString()} to wallet.`);
      setShowDeposit(false);
      walletData.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDepositBusy(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (withdrawAmount <= 0) {
      toast.error("Please enter a valid withdrawal amount.");
      return;
    }
    if (withdrawAmount * 100 > wallet.balanceSatang) {
      toast.error("Withdrawal amount exceeds your available balance.");
      return;
    }
    setWithdrawBusy(true);
    try {
      await api.withdrawWallet(withdrawAmount * 100, `${selectedBank} (${accountNumber})`);
      toast.success(`Withdrawal of ฿${withdrawAmount.toLocaleString()} submitted.`);
      setShowWithdraw(false);
      walletData.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setWithdrawBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Card styled to match Brollow's clean aesthetic */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-base">{viewer?.displayName ?? "User Account"}</span>
              <span className="text-xs text-muted-foreground font-mono">#{accountCode}</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
                <CheckCircle2 className="size-3" /> Standard Account
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="size-3 text-primary" /> Verified
              </span>
            </div>
          </div>
          <div className="rounded-full bg-primary/10 p-2.5 text-primary">
            <WalletIcon className="size-5" />
          </div>
        </div>

        {/* Balance Display */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Wallet Balance</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              {walletData.status === "loading" ? "…" : formatMoney(wallet.balanceSatang)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">THB</span>
          </div>
        </div>

        {/* Action Buttons row (Matching Brollow's palette) */}
        <div className="mt-6 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setShowDeposit(true)}
            className="group flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105 group-hover:bg-primary/90 group-active:scale-95">
              <Plus className="size-6 stroke-[2.5]" />
            </div>
            <span className="text-xs font-medium text-foreground">Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWithdraw(true)}
            className="group flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/60 text-foreground shadow-xs transition-transform group-hover:scale-105 group-hover:bg-muted group-active:scale-95">
              <ArrowUpRight className="size-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-medium text-foreground">Withdraw</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions List */}
      {showRecentTransactions && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Recent Wallet Activity
            </h3>
            <span className="text-xs text-muted-foreground">{wallet.transactions.length} record(s)</span>
          </div>

          {wallet.transactions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No transactions yet. Rental payouts and deposits will appear here.
            </p>
          ) : (
            <ul className="divide-y text-xs">
              {wallet.transactions.slice(0, 5).map((tx) => {
                const isCredit = tx.amountSatang > 0;
                return (
                  <li key={tx.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                          isCredit
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCredit ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{tx.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold shrink-0 text-sm ${
                        isCredit ? "text-emerald-700" : "text-foreground"
                      }`}
                    >
                      {isCredit ? "+" : ""}
                      {formatMoney(tx.amountSatang)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setShowDeposit(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2 text-primary">
              <Plus className="size-5" />
              <h3 className="text-lg font-bold">Deposit to Wallet (Mockup)</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Select an amount or enter custom funds to simulate top-up.
            </p>

            <form onSubmit={handleDeposit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick Amount
                </label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                        depositAmount === amt
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "hover:bg-muted"
                      }`}
                    >
                      ฿{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Custom Amount (THB)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100000"
                  step="50"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                />
              </div>

              <div className="rounded-xl border bg-muted/30 p-3 text-xs flex items-center gap-2">
                <QrCode className="size-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Mock method: Instant PromptPay simulation</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowDeposit(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-semibold" disabled={depositBusy}>
                  {depositBusy ? "Depositing…" : `Deposit ฿${depositAmount.toLocaleString()}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setShowWithdraw(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2 text-primary">
              <ArrowUpRight className="size-5" />
              <h3 className="text-lg font-bold">Withdraw Funds (Mockup)</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Transfer funds from your Brollow Wallet to your Thai bank account.
            </p>

            <form onSubmit={handleWithdraw} className="mt-4 space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Available to Withdraw:</span>
                <span className="font-bold text-foreground text-sm">{formatMoney(wallet.balanceSatang)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Withdrawal Amount (THB)
                </label>
                <input
                  type="number"
                  min="50"
                  max={Math.max(50, Math.floor(wallet.balanceSatang / 100))}
                  step="50"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Destination Bank
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                >
                  {THAI_BANKS.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Account Number / PromptPay ID
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="08X-XXX-XXXX or 123-4-56789-0"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowWithdraw(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground font-semibold"
                  disabled={withdrawBusy || wallet.balanceSatang <= 0}
                >
                  {withdrawBusy ? "Processing…" : `Withdraw ฿${withdrawAmount.toLocaleString()}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
