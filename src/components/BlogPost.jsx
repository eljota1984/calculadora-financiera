// src/components/BlogPost.jsx
// Requiere: npm install react-markdown
import { useParams, Link, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getPostBySlug } from "../lib/blog";
import "./BlogPost.css";

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <article className="blog-post">
      <Link className="blog-post__back" to="/blog">
        ← Volver al blog
      </Link>

      <p className={`blog-post__tag blog-post__tag--${post.tagColor || "blue"}`}>
        {post.tag || post.tool}
      </p>
      <h1>{post.title}</h1>
      <p className="blog-post__date">
        {new Date(post.date).toLocaleDateString("es-CL", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="blog-post__content">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {post.toolPath && (
        <div className="blog-post__cta">
          <p>¿Quieres calcularlo con tus propios números?</p>
          <Link className="blog-post__cta-button" to={post.toolPath}>
            Ir a {post.tool} →
          </Link>
        </div>
      )}
    </article>
  );
}
