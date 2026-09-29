"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSignMessage } from "@privy-io/react-auth";
import { createPublicClient, http, isAddress, type Address } from "viem";
import { FormEvent, useEffect, useState } from "react";
import { clubMembershipAbi, zeroAddress } from "./lib/club-membership";

type ClubEvent = { id: string; url: string; label: string; postedAt: string; description?: string | null; imageUrl?: string | null };

export default function EventBoard({ contractAddress }: { contractAddress: string }) {
  const { ready, authenticated } = usePrivy();
  const { signMessage } = useSignMessage();
  const { wallets } = useWallets();
  const wallet = wallets.find((item) => item.walletClientType === "privy") ?? wallets[0];
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const eventsApiUrl = process.env.NEXT_PUBLIC_EVENTS_API_URL;
  const contractReady = isAddress(contractAddress) && contractAddress !== zeroAddress;
  const [membership, setMembership] = useState<"idle" | "checking" | "member" | "not-member">("idle");
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [eventLink, setEventLink] = useState("");
  const [error, setError] = useState("");
  const [postOpen, setPostOpen] = useState(false);

  useEffect(() => {
    if (!eventsApiUrl) return;
    void fetch(eventsApiUrl).then(async (response) => {
      if (!response.ok) throw new Error("Could not load events.");
      return response.json() as Promise<{ events: ClubEvent[] }>;
    }).then(({ events: remoteEvents }) => setEvents(remoteEvents)).catch(() => setError("Upcoming events are unavailable right now."));
  }, [eventsApiUrl]);

  useEffect(() => {
    if (!authenticated || !wallet || !rpcUrl || !contractReady) { setMembership("idle"); return; }
    let cancelled = false;
    setMembership("checking");
    const client = createPublicClient({ transport: http(rpcUrl) });
    void client.readContract({ address: contractAddress as Address, abi: clubMembershipAbi, functionName: "balanceOf", args: [wallet.address as Address] })
      .then((balance) => { if (!cancelled) setMembership(balance > BigInt(0) ? "member" : "not-member"); })
      .catch(() => { if (!cancelled) setMembership("not-member"); });
    return () => { cancelled = true; };
  }, [authenticated, contractAddress, contractReady, rpcUrl, wallet]);

  async function postEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (!eventsApiUrl || !wallet) throw new Error("The shared event service is not configured yet.");
      const url = new URL(eventLink.trim());
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Use a full http or https event link.");
      const eventUrl = url.toString();
      const message = `Post an NUS Blockchain Club event: ${eventUrl}`;
      const { signature } = await signMessage({ message }, { address: wallet.address });
      const response = await fetch(eventsApiUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address: wallet.address, message, signature, url: eventUrl }) });
      const payload = await response.json() as { event?: ClubEvent; error?: string };
      if (!response.ok || !payload.event) throw new Error(payload.error ?? "Could not publish this event.");
      setEvents((current) => [payload.event!, ...current]);
      setEventLink("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Enter a valid event link.");
    }
  }

  return (
    <section id="events" className="events-section">
      <div className="events-heading">
        <div><p className="number">UP NEXT</p><h2>Upcoming events</h2><p>Member-shared workshops, talks, and build sessions.</p></div>
        <button className="post-event-trigger" type="button" onClick={() => { setError(""); setPostOpen(true); }}>✦ Post an event</button>
      </div>
      <div className="event-list" aria-live="polite">
        {events.length ? <div className="event-card-grid">{events.map((item) => {
            const host = new URL(item.url).hostname.replace("www.", "");
            return <a className="event-card" key={item.id} href={item.url} target="_blank" rel="noreferrer">
              <div className="event-card-image" style={item.imageUrl ? { backgroundImage: `linear-gradient(135deg, rgba(12,14,8,.1), rgba(12,14,8,.58)), url("${item.imageUrl}")` } : undefined}><span>{host}</span></div>
              <div className="event-card-copy"><p className="number">{item.postedAt === "Just added" ? "JUST ADDED" : "CLUB EVENT"}</p><strong>{item.label}</strong><p>{item.description || "Open the event page for the agenda, RSVP details, and latest updates."}</p><small>View event ↗</small></div>
            </a>;
          })}</div> : <p className="empty-events">No events posted yet. Club members can add the first link below.</p>}
      </div>
      {postOpen && <div className="post-event-backdrop" role="presentation" onMouseDown={() => setPostOpen(false)}><section className="post-event-modal" role="dialog" aria-modal="true" aria-label="Post an event" onMouseDown={(event) => event.stopPropagation()}><button className="close-access" type="button" aria-label="Close post event" onClick={() => setPostOpen(false)}>×</button><p className="number">MEMBER TOOL</p><h3>Post an event</h3>{membership === "member" ? <form onSubmit={postEvent}><label htmlFor="event-link">Luma or event link</label><input id="event-link" type="url" value={eventLink} onChange={(event) => setEventLink(event.target.value)} placeholder="https://lu.ma/..." required /><button type="submit">Add to upcoming events ↗</button>{error && <small className="form-error">{error}</small>}<small className="local-note">Published to the shared club event board.</small></form> : <p className="event-gate">{!ready ? "Preparing club access…" : !authenticated ? "Sign in through Get involved above, then verify your membership to post an event." : membership === "checking" ? "Checking your club membership…" : "A verified club membership is required to post."}</p>}</section></div>}
    </section>
  );
}
