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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-bold text-white tracking-wide">
            Article Draft Ready
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-900/50 border border-purple-500/30 text-purple-300 uppercase">
            {article.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'Cancel Edit' : 'Edit Draft'}
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy HTML'}
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          )}

          <button
            onClick={() => onPublish(currentArticle)}
            disabled={isPublishing}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isPublishing ? 'Publishing...' : 'Publish to Blogs'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {publishSuccess && (
        <div className="bg-emerald-950/60 border-b border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{publishSuccess}</span>
        </div>
      )}
      {publishError && (
        <div className="bg-rose-950/60 border-b border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{publishError}</span>
        </div>
      )}

      {/* Main Content Preview Area */}
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {isEditing ? (
          /* Inline Editor Form */
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Article Headline</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Meta Excerpt</label>
              <textarea
                rows={2}
                value={editedExcerpt}
                onChange={(e) => setEditedExcerpt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Article HTML Content</label>
              <textarea
                rows={12}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white rounded-lg transition-colors"
            >
              Save Changes to Preview
            </button>
          </div>
        ) : (
          /* Rendered Article View */
          <article className="prose prose-invert max-w-none">
            {/* Headline */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-3">
              {editedTitle}
            </h1>

            {/* Excerpt Lead */}
            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium italic border-l-4 border-cyan-500 pl-4 py-1 mb-6 bg-slate-800/30 rounded-r-lg">
              {editedExcerpt}
            </p>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-y border-slate-800/80 py-3 mb-6">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                {article.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {article.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {article.readTime}
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                {article.category}
              </span>
            </div>

            {/* Rendered HTML body */}
            <div
              className="text-slate-200 text-sm leading-relaxed space-y-4 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-cyan-300 [&>h2]:mt-6 [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-slate-100 [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:text-slate-300 [&>p]:leading-7 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>blockquote]:border-l-2 [&>blockquote]:border-purple-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-purple-200 [&>blockquote]:bg-purple-950/20 [&>blockquote]:py-2 [&>blockquote]:my-4 [&>blockquote]:rounded-r"
              dangerouslySetInnerHTML={{ __html: editedContent }}
            />
          </article>
        )}
      </div>
    </div>
  );
};
