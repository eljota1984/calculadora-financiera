// src/lib/blog.js
// Carga todos los .md de src/content/blog, parsea el frontmatter a mano
// (sin dependencias extra) y expone helpers para listar / buscar por slug.

// import.meta.glob con { query: '?raw', import: 'default' } trae el texto
// crudo de cada archivo markdown en build-time (funciona con Vite).
const files = import.meta.glob("../content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const [, frontmatterBlock, content] = match;
  const meta = {};

  frontmatterBlock.split("\n").forEach((line) => {
    const lineMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!lineMatch) return;
    const [, key, rawValue] = lineMatch;
    let value = rawValue.trim();

    // Listas tipo ["a", "b"]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^"(.*)"$/, "$1"))
        .filter(Boolean);
    } else {
      // Strings entre comillas
      value = value.replace(/^"(.*)"$/, "$1");
    }

    meta[key] = value;
  });

  return { meta, content: content.trim() };
}

const posts = Object.values(files)
  .map((raw) => parseFrontmatter(raw))
  .map(({ meta, content }) => ({ ...meta, content }))
  .sort((a, b) => new Date(b.date) - new Date(a.date));

export function getAllPosts() {
  return posts;
}

export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug);
}
