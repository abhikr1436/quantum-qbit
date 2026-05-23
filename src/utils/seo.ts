/**
 * Updates page SEO metadata in the document head dynamically.
 * Updates the title, description, canonical link, and JSON-LD structured schemas.
 */
export function updateSEO(
  title: string,
  description: string,
  path: string,
  jsonLdSchema?: Record<string, any>
) {
  // 1. Title
  document.title = title;

  // 2. Description Meta Tag
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);

  // 3. Canonical Link Tag
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  const siteUrl = 'https://quantumqbit.in';
  canonical.setAttribute('href', `${siteUrl}${path}`);

  // 4. JSON-LD Schema Script Tag
  let schemaScript = document.getElementById('seo-schema');
  if (schemaScript) {
    schemaScript.remove();
  }

  if (jsonLdSchema) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'seo-schema';
    schemaScript.setAttribute('type', 'application/ld+json');
    schemaScript.textContent = JSON.stringify(jsonLdSchema);
    document.head.appendChild(schemaScript);
  }
}
