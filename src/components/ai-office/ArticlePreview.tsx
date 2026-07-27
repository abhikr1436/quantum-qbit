import React, { useState } from 'react';
import { Send, Edit3, Check, Copy, RefreshCw, Calendar, Clock, User, Tag, Sparkles, AlertCircle } from 'lucide-react';

export interface GeneratedArticle {
  id?: string;
  title: string;
  excerpt: string;
  content: string; // HTML string
  author: string;
  date: string;
  readTime: string;
  category: string;
  category_id: string;
  imageGlow: string;
  seoKeywords?: string[];
}

interface ArticlePreviewProps {
  article: GeneratedArticle;
  onPublish: (article: GeneratedArticle) => Promise<void>;
  onRegenerate?: () => void;
  isPublishing?: boolean;
  publishSuccess?: string | null;
  publishError?: string | null;
}

export const ArticlePreview: React.FC<ArticlePreviewProps> = ({
  article,
  onPublish,
  onRegenerate,
  isPublishing = false,
  publishSuccess = null,
  publishError = null,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [editedExcerpt, setEditedExcerpt] = useState(article.excerpt);
  const [editedContent, setEditedContent] = useState(article.content);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    article.title = editedTitle;
    article.excerpt = editedExcerpt;
    article.content = editedContent;
    setIsEditing(false);
  };

  const currentArticle = {
    ...article,
    title: editedTitle,
    excerpt: editedExcerpt,
    content: editedContent,
  };

  return (
    <div className="ai-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Top Banner & Control Bar */}
      <div className="ai-preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: '#9d4edd' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
            Article Draft Ready
          </span>
          <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(157, 78, 221, 0.15)', border: '1px solid rgba(157, 78, 221, 0.3)', color: '#d8b4fe', textTransform: 'uppercase' }}>
            {article.category}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{ padding: '6px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Edit3 size={14} />
            {isEditing ? 'Cancel Edit' : 'Edit Draft'}
          </button>

          <button
            onClick={handleCopy}
            style={{ padding: '6px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy HTML'}
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              style={{ padding: '6px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
          )}

          <button
            onClick={() => onPublish(currentArticle)}
            disabled={isPublishing}
            className="ai-btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            <Send size={14} />
            {isPublishing ? 'Publishing...' : 'Publish to Blogs'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {publishSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 16px', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} />
          <span>{publishSuccess}</span>
        </div>
      )}
      {publishError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 16px', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{publishError}</span>
        </div>
      )}

      {/* Main Content Preview Area */}
      <div className="ai-preview-body">
        {isEditing ? (
          /* Inline Editor Form */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0, 0, 0, 0.3)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Article Headline</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                style={{ width: '100%', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', padding: '8px 12px', color: '#ffffff', fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Meta Excerpt</label>
              <textarea
                rows={2}
                value={editedExcerpt}
                onChange={(e) => setEditedExcerpt(e.target.value)}
                style={{ width: '100%', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', padding: '8px 12px', color: '#ffffff', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Article HTML Content</label>
              <textarea
                rows={12}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                style={{ width: '100%', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', padding: '8px 12px', color: '#ffffff', fontFamily: 'monospace', fontSize: '0.82rem' }}
              />
            </div>
            <button
              onClick={handleSaveEdit}
              className="ai-btn-primary"
              style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.82rem' }}
            >
              Save Changes to Preview
            </button>
          </div>
        ) : (
          /* Rendered Article View */
          <article style={{ maxWidth: '850px', margin: '0 auto' }}>
            {/* Headline */}
            <h1 className="ai-article-title">{editedTitle}</h1>

            {/* Excerpt Lead */}
            <p className="ai-article-excerpt">{editedExcerpt}</p>

            {/* Metadata Bar */}
            <div className="ai-article-meta">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: '#00f2fe' }} />
                {article.author}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} />
                {article.date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: '#9d4edd' }} />
                {article.readTime}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} style={{ color: '#34d399' }} />
                {article.category}
              </span>
            </div>

            {/* Rendered HTML body */}
            <div
              className="ai-article-content"
              dangerouslySetInnerHTML={{ __html: editedContent }}
            />
          </article>
        )}
      </div>
    </div>
  );
};
