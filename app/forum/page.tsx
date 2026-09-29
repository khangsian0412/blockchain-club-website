import Link from "next/link";
import ForumBoard from "./forum-board";
const membershipContract = process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT ?? "";

export default function ForumPage() {
  return <main className="forum-page"><nav><Link className="brand" href="/"><img src="/nus-blockchain-logo.jpg" alt="NUS Blockchain Club logo" />NUS Blockchain Club</Link><div className="nav-controls"><Link className="forum-link active" href="/forum">Forum</Link><Link className="back-link" href="/">← Home</Link></div></nav><section className="forum-hero"><p className="eyebrow">NUS BLOCKCHAIN CLUB COMMUNITY</p><h1>Ask well.<br /><em>Build together.</em></h1><p>A shared space for ideas, questions, notes, and work in progress from the NUS Blockchain Club community.</p></section><section className="forum-content"><aside className="forum-about"><p className="number">THE FORUM</p><h2>Thoughtful by design.</h2><p>Keep discussions generous, specific, and useful to the person who finds them next.</p><span>Verified members can start a discussion.</span></aside><ForumBoard contractAddress={membershipContract} /></section><footer><span>BLOCKCHAIN CLUB / 2026</span><span>ZERO-COST · DECENTRALIZED · STUDENT-OWNED</span></footer></main>;
}
