<?php
// Dynamic Real-Time XML Sitemap Generator for Quantum Qbit
header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600'); // Cache for 1 hour

require_once __DIR__ . '/api/db_config.php';

$persistentDir = getQuantumDataDir();
$persistentBlogsFile = $persistentDir . '/blogs.json';
$localBlogsFile = __DIR__ . '/api/data/blogs.json';

$pdo = getDBConnection();

$blogs = [];

// 1. Try MySQL DB
if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT id, title, updated_at, created_at FROM blogs ORDER BY created_at DESC");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $slug = $row['id'];
            $date = !empty($row['updated_at']) ? substr($row['updated_at'], 0, 10) : (!empty($row['created_at']) ? substr($row['created_at'], 0, 10) : date('Y-m-d'));
            $blogs[$slug] = $date;
        }
    } catch (Exception $e) {}
}

// 2. Supplement from persistent JSON
foreach ([$persistentBlogsFile, $localBlogsFile] as $f) {
    if (file_exists($f)) {
        $json = json_decode(file_get_contents($f), true);
        if (is_array($json)) {
            foreach ($json as $b) {
                $slug = !empty($b['slug']) ? $b['slug'] : (!empty($b['id']) ? $b['id'] : '');
                if ($slug && !isset($blogs[$slug])) {
                    $d = date('Y-m-d');
                    if (!empty($b['publishedAt'])) {
                        $d = date('Y-m-d', intval($b['publishedAt'] / 1000));
                    }
                    $blogs[$slug] = $d;
                }
            }
        }
    }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Landing Pages -->
  <url>
    <loc>https://quantumqbit.in/</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/tools</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/blogs</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Interactive Utility Tools -->
  <url>
    <loc>https://quantumqbit.in/tools/image-compressor</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/tools/pdf-compressor</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/tools/pdf-to-word</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/tools/image-editor</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/tools/images-to-pdf</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/tools/convert-to-pdf</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/tools/math-calculators</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/isro-ta-computer-science-pyq</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Informational Pages -->
  <url>
    <loc>https://quantumqbit.in/about</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/contact</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/privacy</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://quantumqbit.in/terms</loc>
    <lastmod><?= date('Y-m-d') ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- Published Articles & Dynamic AI Content -->
  <?php foreach ($blogs as $slug => $lastmod): ?>
  <url>
    <loc>https://quantumqbit.in/blogs/<?= htmlspecialchars($slug) ?></loc>
    <lastmod><?= htmlspecialchars($lastmod) ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <?php endforeach; ?>
</urlset>
