import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Always fetch fresh data from Supabase on each request.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reading List",
  description: "Books fetched from Supabase.",
};

export default async function BooksPage() {
  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, author, year, rating")
    .order("rating", { ascending: false });

  return (
    <main className="page">
      <header className="page-header">
        <h1>Reading List</h1>
        <p className="subtitle">Fetched live from Supabase</p>
        <Link className="back-link" href="/">
          ← back home
        </Link>
      </header>

      {error && (
        <p className="error">Could not load books: {error.message}</p>
      )}

      {!error && books?.length === 0 && (
        <p className="empty">No books yet.</p>
      )}

      <ul className="card-grid">
        {books?.map((book) => (
          <li key={book.id} className="card">
            <h2 className="card-title">{book.title}</h2>
            <p className="card-author">{book.author}</p>
            <div className="card-meta">
              {book.year && <span>{book.year}</span>}
              {book.rating != null && <span>★ {book.rating}</span>}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
