<?php
// Dynamic Real-Time RSS 2.0 Feed for Quantum Qbit
header('Content-Type: application/rss+xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');

require_once __DIR__ . '/api/db_config.php';

$persistentDir = getQuantumDataDir();
$persistentBlogsFile = $persistentDir . '/blogs.json';
$localBlogsFile = __DIR__ . '/api/data/blogs.json';

$pdo = getDBConnection();
$blogs = [];

if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT id, title, excerpt, date, created_at, author FROM blogs ORDER BY created_at DESC LIMIT 30");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $blogs[] = [
                'slug' => $row['id'],
                'title' => $row['title'],
                'summary' => $row['excerpt'],
                'author' => $row['author'] ?: 'Quantum Qbit Editorial Team',
                'pubDate' => !empty($row['created_at']) ? date(DATE_RSS, strtotime($row['created_at'])) : date(DATE_RSS)
            ];
        }
    } catch (Exception $e) {}
}

if (empty($blogs)) {
    foreach ([$persistentBlogsFile, $localBlogsFile] as $f) {
        if (file_exists($f)) {
            $json = json_decode(file_get_contents($f), true);
            if (is_array($json)) {
                foreach (array_slice($json, 0, 30) as $b) {
                    $slug = !empty($b['slug']) ? $b['slug'] : (!empty($b['id']) ? $b['id'] : '');
                    if ($slug) {
                        $blogs[] = [
                            'slug' => $slug,
                            'title' => $b['title'] ?? 'Quantum Qbit Guide',
                            'summary' => $b['summary'] ?? ($b['excerpt'] ?? ''),
                            'author' => $b['author'] ?? 'Quantum Qbit Team',
                            'pubDate' => date(DATE_RSS, !empty($b['publishedAt']) ? intval($b['publishedAt'] / 1000) : time())
                        ];
                    }
                }
                break;
            }
        }
    }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Quantum Qbit | Privacy-First Web Utilities &amp; Guides</title>
    <link>https://quantumqbit.in/blogs</link>
    <description>Latest in-depth technical guides, privacy benchmarks, image optimization tutorials, and client-side web utility workflows.</description>
    <language>en-us</language>
    <lastBuildDate><?= date(DATE_RSS) ?></lastBuildDate>
    <atom:link href="https://quantumqbit.in/rss.xml" rel="self" type="application/rss+xml" />

    <?php foreach ($blogs as $post): ?>
    <item>
      <title><![CDATA[<?= $post['title'] ?>]]></title>
      <link>https://quantumqbit.in/blogs/<?= htmlspecialchars($post['slug']) ?></link>
      <guid isPermaLink="true">https://quantumqbit.in/blogs/<?= htmlspecialchars($post['slug']) ?></guid>
      <description><![CDATA[<?= $post['summary'] ?>]]></description>
      <author><?= htmlspecialchars($post['author']) ?></author>
      <pubDate><?= $post['pubDate'] ?></pubDate>
    </item>
    <?php endforeach; ?>
  </channel>
</rss>
