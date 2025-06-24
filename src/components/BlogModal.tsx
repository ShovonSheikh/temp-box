import React from 'react';
import { X, Clock, User, ArrowLeft } from 'lucide-react';
import { BlogPost } from '../data/blog';

interface BlogModalProps {
  post: BlogPost | null;
  onClose: () => void;
}

export function BlogModal({ post, onClose }: BlogModalProps) {
  if (!post) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-2xl">{post.emoji}</div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-200">
                {post.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {post.author}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {post.readingTime} min read
                </div>
                <span>{post.publishedAt}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {post.content.split('\n').map((paragraph, index) => {
              if (paragraph.startsWith('# ')) {
                return (
                  <h1 key={index} className="text-3xl font-display font-bold mb-6 text-slate-800 dark:text-slate-200">
                    {paragraph.substring(2)}
                  </h1>
                );
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-2xl font-display font-bold mb-4 mt-8 text-slate-800 dark:text-slate-200">
                    {paragraph.substring(3)}
                  </h2>
                );
              }
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <p key={index} className="font-bold text-slate-800 dark:text-slate-200 mb-4">
                    {paragraph.substring(2, paragraph.length - 2)}
                  </p>
                );
              }
              if (paragraph.trim() === '') {
                return <div key={index} className="mb-4" />;
              }
              return (
                <p key={index} className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}