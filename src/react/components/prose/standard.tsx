import React from 'react'

/**
 * Standard Typography Prose Components for React
 *
 * Designed for blog posts, articles, and long-form content.
 * Features:
 * - Comfortable, relaxed spacing
 * - Excellent readability
 * - Soft color palette
 * - Friendly appearance
 */

// Headings
const ProseH1Standard: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h1 className="prose-h1-standard text-5xl font-bold mt-0 mb-8 text-neutral-900 dark:text-white leading-tight" {...props} />
)

const ProseH2Standard: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h2 className="prose-h2-standard text-4xl font-bold mt-16 mb-6 text-neutral-800 dark:text-neutral-100" {...props} />
)

const ProseH3Standard: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h3 className="prose-h3-standard text-3xl font-semibold mt-12 mb-4 text-neutral-800 dark:text-neutral-100" {...props} />
)

const ProseH4Standard: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h4 className="prose-h4-standard text-2xl font-semibold mt-10 mb-3 text-neutral-700 dark:text-neutral-200" {...props} />
)

const ProseH5Standard: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h5 className="prose-h5-standard text-xl font-semibold mt-8 mb-3 text-neutral-700 dark:text-neutral-200" {...props} />
)

const ProseH6Standard: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h6 className="prose-h6-standard text-lg font-semibold mt-6 mb-2 text-neutral-600 dark:text-neutral-300" {...props} />
)

// Text elements
const ProsePStandard: React.FC<React.HTMLAttributes<HTMLParagraphElement> & { __node?: any }> = ({ __node, ...props }) => (
  <p className="prose-p-standard my-6 text-neutral-700 dark:text-neutral-300 leading-relaxed text-lg" {...props} />
)

const ProseStrongStandard: React.FC<React.HTMLAttributes<HTMLElement> & { __node?: any }> = ({ __node, ...props }) => (
  <strong className="prose-strong-standard font-bold text-neutral-900 dark:text-neutral-100" {...props} />
)

const ProseEmStandard: React.FC<React.HTMLAttributes<HTMLElement> & { __node?: any }> = ({ __node, ...props }) => (
  <em className="prose-em-standard italic text-neutral-600 dark:text-neutral-400" {...props} />
)

const ProseDelStandard: React.FC<React.HTMLAttributes<HTMLElement> & { __node?: any }> = ({ __node, ...props }) => (
  <del className="prose-del-standard line-through text-neutral-500 dark:text-neutral-500 opacity-75" {...props} />
)

// Links
const ProseAStandard: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { __node?: any }> = ({ __node, ...props }) => (
  <a className="prose-a-standard text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 transition-colors" {...props} />
)

// Code
const ProseCodeStandard: React.FC<React.HTMLAttributes<HTMLElement> & { __node?: any }> = ({ __node, ...props }) => (
  <code className="prose-code-standard bg-neutral-100 dark:bg-neutral-800 text-pink-600 dark:text-pink-400 px-2 py-1 rounded text-base font-mono" {...props} />
)

const ProsePreStandard: React.FC<React.HTMLAttributes<HTMLPreElement> & { __node?: any }> = ({ __node, ...props }) => (
  <pre className="prose-pre-standard bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 p-6 rounded-xl overflow-x-auto my-8 border border-neutral-200 dark:border-neutral-800 text-base leading-relaxed" {...props} />
)

// Lists
const ProseUlStandard: React.FC<React.HTMLAttributes<HTMLUListElement> & { __node?: any }> = ({ __node, ...props }) => (
  <ul className="prose-ul-standard list-disc list-outside ml-6 my-6 text-neutral-700 dark:text-neutral-300 space-y-3 text-lg" {...props} />
)

const ProseOlStandard: React.FC<React.OlHTMLAttributes<HTMLOListElement> & { __node?: any }> = ({ __node, ...props }) => (
  <ol className="prose-ol-standard list-decimal list-outside ml-6 my-6 text-neutral-700 dark:text-neutral-300 space-y-3 text-lg" {...props} />
)

const ProseLiStandard: React.FC<React.LiHTMLAttributes<HTMLLIElement> & { __node?: any }> = ({ __node, ...props }) => (
  <li className="prose-li-standard pl-2" {...props} />
)

// Blockquote
const ProseBlockquoteStandard: React.FC<React.BlockquoteHTMLAttributes<HTMLQuoteElement> & { __node?: any }> = ({ __node, ...props }) => (
  <blockquote className="prose-blockquote-standard border-l-4 border-blue-400 dark:border-blue-600 pl-6 my-8 text-neutral-600 dark:text-neutral-400 italic text-xl" {...props} />
)

// Table
const ProseTableStandard: React.FC<React.TableHTMLAttributes<HTMLTableElement> & { __node?: any }> = ({ __node, ...props }) => (
  <table className="prose-table-standard w-full border-collapse my-8" {...props} />
)

const ProseTheadStandard: React.FC<React.HTMLAttributes<HTMLTableSectionElement> & { __node?: any }> = ({ __node, ...props }) => (
  <thead className="prose-thead-standard" {...props} />
)

const ProseTbodyStandard: React.FC<React.HTMLAttributes<HTMLTableSectionElement> & { __node?: any }> = ({ __node, ...props }) => (
  <tbody className="prose-tbody-standard" {...props} />
)

const ProseTrStandard: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { __node?: any }> = ({ __node, ...props }) => (
  <tr className="prose-tr-standard border-b border-neutral-200 dark:border-neutral-800" {...props} />
)

const ProseThStandard: React.FC<React.ThHTMLAttributes<HTMLTableCellElement> & { __node?: any }> = ({ __node, ...props }) => (
  <th className="prose-th-standard bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-6 py-3 text-left font-semibold text-neutral-900 dark:text-white" {...props} />
)

const ProseTdStandard: React.FC<React.TdHTMLAttributes<HTMLTableCellElement> & { __node?: any }> = ({ __node, ...props }) => (
  <td className="prose-td-standard border border-neutral-200 dark:border-neutral-800 px-6 py-3 text-neutral-700 dark:text-neutral-300" {...props} />
)

// Other elements
const ProseHrStandard: React.FC<React.HTMLAttributes<HTMLHRElement> & { __node?: any }> = ({ __node, ...props }) => (
  <hr className="prose-hr-standard my-12 border-t border-neutral-300 dark:border-neutral-700" {...props} />
)

const ProseImgStandard: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { __node?: any }> = ({ __node, ...props }) => (
  <img className="prose-img-standard my-8 rounded-xl shadow-lg max-w-full h-auto" {...props} />
)

// MDC Components
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'info' | 'warning' | 'error' | 'success'
}

const ProseAlertStandard: React.FC<AlertProps> = ({ type = 'info', ...props }) => {
  const typeColors = {
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200',
    error: 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200',
    success: 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200',
  }
  const colorClass = typeColors[type]
  return (
    <div className={`prose-alert-standard border-l-4 px-6 py-4 my-6 rounded-r-lg ${colorClass}`} {...props} />
  )
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
}

const ProseCardStandard: React.FC<CardProps> = ({ title, children, ...props }) => (
  <div className="prose-card-standard border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl p-6 my-8 shadow-md hover:shadow-lg transition-shadow" {...props}>
    {title && <h3 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-white">{title}</h3>}
    <div>{children}</div>
  </div>
)

export const standardProseComponents = {
  h1: ProseH1Standard,
  h2: ProseH2Standard,
  h3: ProseH3Standard,
  h4: ProseH4Standard,
  h5: ProseH5Standard,
  h6: ProseH6Standard,
  p: ProsePStandard,
  strong: ProseStrongStandard,
  em: ProseEmStandard,
  del: ProseDelStandard,
  a: ProseAStandard,
  code: ProseCodeStandard,
  pre: ProsePreStandard,
  ul: ProseUlStandard,
  ol: ProseOlStandard,
  li: ProseLiStandard,
  blockquote: ProseBlockquoteStandard,
  table: ProseTableStandard,
  thead: ProseTheadStandard,
  tbody: ProseTbodyStandard,
  tr: ProseTrStandard,
  th: ProseThStandard,
  td: ProseTdStandard,
  hr: ProseHrStandard,
  img: ProseImgStandard,
  alert: ProseAlertStandard,
  card: ProseCardStandard,
}
