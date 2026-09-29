"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, http, isAddress, type Address } from "viem";
import { useEffect, useState } from "react";
import { clubMembershipAbi, zeroAddress } from "./lib/club-membership";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function MembershipExperience({ contractAddress }: { contractAddress: string }) {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) return <SetupRequired />;
  return <AuthenticatedExperience contractAddress={contractAddress} />;
}

function AuthenticatedExperience({ contractAddress }: { contractAddress: string }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy") ?? wallets[0];
  const [copied, setCopied] = useState(false);

  async function copyWalletAddress() {
    if (!embeddedWallet) return;
    await navigator.clipboard.writeText(embeddedWallet.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!ready) return <button className="membership-cta" type="button" disabled>Preparing sign-in…</button>;
  if (!authenticated) return <button className="membership-cta" type="button" onClick={login}>Sign in to join <span>↗</span></button>;

  return (
    <div className="member-panel" aria-live="polite">
      <p className="member-label">YOU’RE SIGNED IN</p>
      <strong>{user?.email?.address ?? "Club member"}</strong>
      <span>{embeddedWallet ? `Wallet: ${shortenAddress(embeddedWallet.address)}` : "Creating your wallet…"}</span>
      {embeddedWallet && <button type="button" className="copy-wallet" onClick={copyWalletAddress}>{copied ? "Copied full address" : "Copy full wallet address"}</button>}
      {embeddedWallet && <MembershipStatus wallet={embeddedWallet} contractAddress={contractAddress} />}
      <button type="button" className="sign-out" onClick={logout}>Sign out</button>
    </div>
  );
}

function MembershipStatus({ wallet, contractAddress }: { wallet: { address: string; getEthereumProvider: () => Promise<unknown> }; contractAddress: string }) {
  const { address } = wallet;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const contractReady = isAddress(contractAddress) && contractAddress !== zeroAddress;
  const [status, setStatus] = useState<"checking" | "member" | "not-member" | "error">("checking");

  useEffect(() => {
    if (!contractReady || !rpcUrl) return;
    let stale = false;
    const client = createPublicClient({ transport: http(rpcUrl) });

    async function checkMembership() {
      setStatus("checking");
      try {
        const balance = await client.readContract({
          address: contractAddress as Address,
          abi: clubMembershipAbi,
          functionName: "balanceOf",
          args: [address as Address],
        });
        if (!stale) setStatus(balance > BigInt(0) ? "member" : "not-member");
      } catch {
        if (!stale) setStatus("error");
      }
    }

    void checkMembership();
    return () => { stale = true; };
  }, [address, contractAddress, contractReady, rpcUrl]);

  if (!contractReady || !rpcUrl) return <small>Set the contract address and RPC URL to verify membership on-chain.</small>;
  if (status === "checking") return <small>Checking membership on-chain…</small>;
  if (status === "member") return <><p className="membership-result member">● Verified club member</p><MemberLibrary /></>;
  if (status === "not-member") return <p className="membership-result not-member">○ No membership token found</p>;
  return <small>We could not reach the membership contract. Check the RPC URL and network.</small>;
}

function MemberLibrary() {
  return (
    <section className="member-library">
      <p className="member-label">MEMBER LIBRARY</p>
      <strong>Wallets, identity &amp; your first member action</strong>
      <span>Your membership has been verified on Sepolia. Use your embedded wallet address to receive event badges and future club access.</span>
    </section>
  );
}

function SetupRequired() {
  return <div className="setup-card"><strong>Sign-up needs your Privy app ID</strong><span>Add <code>NEXT_PUBLIC_PRIVY_APP_ID</code> to <code>.env.local</code>, then restart the dev server.</span></div>;
}
