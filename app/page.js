import Link from "next/link";

export default function Home() {
  return (
    <main className="hero">
      <h1>Hello World</h1>
      <Link className="hero-link" href="/books">
        View my reading list →
      </Link>
    </main>
  );
}
