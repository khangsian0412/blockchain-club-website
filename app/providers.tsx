"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) return <>{children}</>;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google"],
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
        appearance: { theme: "light", accentColor: "#6e8d00", showWalletLoginFirst: false },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
