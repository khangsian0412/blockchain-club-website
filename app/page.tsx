const membershipContract = process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT ?? "";
import MembershipExperience from "./membership-experience";
import Link from "next/link";
import { newsItems } from "./news";
import EventBoard from "./event-board";

export default function Home() {
  return (
    <main>
      <nav>
        <a className="brand" href="#top"><img src="/nus-blockchain-logo.jpg" alt="NUS Blockchain Club logo" />NUS Blockchain Club</a>
        <span className="phase">SINGAPORE · 2026</span>
      </nav>
      <section id="top" className="hero">
        <p className="eyebrow">NATIONAL UNIVERSITY OF SINGAPORE</p>
        <h1>Welcome to<br /><em>NUS Blockchain Club.</em></h1>
        <p className="lede">A student community for the curious, the technical, and everyone building a more open internet.</p>
        <div className="actions">
          <MembershipExperience contractAddress={membershipContract} triggerOnly />
        </div>
      </section>
      <section id="welcome" className="welcome-grid">
        <article className="welcome-note">
          <p className="number">A NOTE FROM THE CLUB</p>
          <h2>A place to learn<br /><em>by building together.</em></h2>
          <p>Whether you are exploring wallets for the first time or prototyping your next on-chain idea, this is your campus home for practical blockchain learning, thoughtful conversations, and generous collaboration.</p>
          <p>Come for a workshop, stay for the people you meet while making something real.</p>
        </article>
      </section>
      <section id="architecture" className="grid">
        <article className="feature primary">
          <p className="number">01</p>
          <h2>Soulbound<br />membership</h2>
          <p>Every verified student receives one ERC-5192 token. It cannot be sold, transferred, or separated from its owner.</p>
          <div className="token">CLUB <b>•</b> ERC-5192</div>
        </article>
      </section>
      <section id="news" className="news-section">
        <div className="section-heading">
          <p className="number">FROM THE CLUB</p>
          <h2>News &amp; notes</h2>
          <p>Small updates for builders finding their way into the community.</p>
        </div>
        <div className="news-grid">
          {newsItems.map((item) => (
            <Link className="news-card" href={`/news/${item.slug}`} key={item.slug}>
              <p className="number">{item.tag} · {item.date}</p>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <span>Read note ↗</span>
            </Link>
          ))}
        </div>
      </section>
      <EventBoard contractAddress={membershipContract} />
      <footer><span>BLOCKCHAIN CLUB / 2026</span><span>ZERO-COST · DECENTRALIZED · STUDENT-OWNED</span></footer>
    </main>
  );
}
