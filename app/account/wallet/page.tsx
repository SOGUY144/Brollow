"use client";

import { AccountShell } from "@/components/account-shell";
import { WalletCard } from "@/components/wallet-card";

export default function WalletPage() {
  return (
    <AccountShell title="Wallet & Payouts">
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Manage your balance, deposit mockup funds, and withdraw rental payouts directly to your bank account.
        </p>
        <WalletCard showRecentTransactions={true} />
      </div>
    </AccountShell>
  );
}
