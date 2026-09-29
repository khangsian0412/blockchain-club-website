import Link from "next/link";
import { notFound } from "next/navigation";
import { newsItems } from "../../news";

export function generateStaticParams() { return newsItems.map(({ slug }) => ({ slug })); }

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = newsItems.find((entry) => entry.slug === slug);
  if (!item) notFound();
  return <main className="article-page"><nav><Link className="brand" href="/"><img src="/nus-blockchain-logo.jpg" alt="NUS Blockchain Club logo" />NUS Blockchain Club</Link><div className="nav-controls"><Link className="forum-link" href="/forum">Forum ↗</Link><Link className="back-link" href="/#news">← All news</Link></div></nav><article className="club-article"><p className="eyebrow">{item.tag} · CLUB NOTE {item.date}</p><h1>{item.title}</h1><div className="article-body">{item.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></article><footer><span>BLOCKCHAIN CLUB / 2026</span><span>ZERO-COST · DECENTRALIZED · STUDENT-OWNED</span></footer></main>;
}
