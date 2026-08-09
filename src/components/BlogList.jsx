// src/components/BlogList.jsx
import { Link } from "react-router-dom";
import { getAllPosts } from "../lib/blog";
import "./BlogList.css";

export default function BlogList() {
  const posts = getAllPosts();

  return (
    <section className="blog-list">
      <h1>Blog</h1>
      <p className="blog-list__intro">
        Guías simples para entender tus finanzas y sacarle más partido a
        nuestras calculadoras.
      </p>

      <div className="blog-list__grid">
        {posts.map((post) => (
          <article key={post.slug} className="blog-card">
            <p className={`blog-card__tag blog-card__tag--${post.tagColor || "blue"}`}>
              {post.tag || post.tool}
            </p>
            <h2>
              <Link to={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="blog-card__excerpt">{post.excerpt}</p>
            <Link className="blog-card__link" to={`/blog/${post.slug}`}>
              Leer artículo →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
