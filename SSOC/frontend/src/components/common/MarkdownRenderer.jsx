import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../ui/utils';

export default function MarkdownRenderer({ content, className }) {
    if (!content) return null;

    return (
        <div className={cn("text-slate-800", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-[#1E325C] mt-6 mb-4 pb-2 border-b border-slate-200" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-800 mt-5 mb-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-slate-700 mt-4 mb-2" {...props} />,

                    p: ({ node, ...props }) => <p className="mb-4 leading-7 text-slate-600" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                    em: ({ node, ...props }) => <em className="italic text-slate-700" {...props} />,
                    del: ({ node, ...props }) => <del className="line-through text-slate-400" {...props} />,

                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1 text-slate-600" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-slate-600" {...props} />,
                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,

                    a: ({ node, ...props }) => (
                        <a
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        />
                    ),
                    img: ({ node, ...props }) => (
                        <img
                            className="rounded-lg border border-slate-200 shadow-sm max-w-full my-4"
                            loading="lazy"
                            {...props}
                        />
                    ),

                    code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1] : '';

                        if (!inline && lang && lang !== 'text') {
                            return (
                                <div className="relative my-4 rounded-lg overflow-hidden bg-slate-900 shadow-md">
                                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                                        <span className="text-xs font-mono text-slate-400">
                                            {lang}
                                        </span>
                                    </div>
                                    <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-200 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                </div>
                            );
                        }

                        return (
                            <span
                                className="inline-block bg-slate-100 text-[#EB5757] px-1.5 py-0.5 rounded-md text-[0.9em] font-medium border border-slate-200/50 mx-0.5"
                                {...props}
                            >
                                {children}
                            </span>
                        );
                    },
                    pre: ({ node, ...props }) => <div {...props} />,

                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
                            <table className="w-full border-collapse text-sm text-left" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-slate-50 border-b border-slate-200" {...props} />,
                    tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-100" {...props} />,
                    tr: ({ node, ...props }) => <tr className="hover:bg-slate-50/50 transition-colors" {...props} />,
                    th: ({ node, ...props }) => <th className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap" {...props} />,
                    td: ({ node, ...props }) => <td className="px-4 py-3 text-slate-600 align-top" {...props} />,

                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-slate-300 pl-4 py-1 my-4 italic text-slate-600 bg-slate-50/50 rounded-r-lg" {...props} />
                    ),

                    hr: ({ node, ...props }) => <hr className="my-8 border-slate-200" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
