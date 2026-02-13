import React from 'react'
import { ProsePre } from './prose/ProsePre'

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
const ProseH1: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h1 className="prose-h1-standard text-5xl font-bold mt-0 mb-8 text-neutral-900 dark:text-white leading-tight" {...props} />
)

const ProseH2: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h2 className="prose-h2-standard text-4xl font-bold mt-16 mb-6 text-neutral-800 dark:text-neutral-100" {...props} />
)

const ProseH3: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h3 className="prose-h3-standard text-3xl font-semibold mt-12 mb-4 text-neutral-800 dark:text-neutral-100" {...props} />
)

const ProseH4: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h4 className="prose-h4-standard text-2xl font-semibold mt-10 mb-3 text-neutral-700 dark:text-neutral-200" {...props} />
)

const ProseH5: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h5 className="prose-h5-standard text-xl font-semibold mt-8 mb-3 text-neutral-700 dark:text-neutral-200" {...props} />
)

const ProseH6: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { __node?: any }> = ({ __node, ...props }) => (
  <h6 className="prose-h6-standard text-lg font-semibold mt-6 mb-2 text-neutral-600 dark:text-neutral-300" {...props} />
)

// Text elements
const ProseP: React.FC<React.HTMLAttributes<HTMLParagraphElement> & { __node?: any }> = ({ __node, ...props }) => (
  <p className="prose-p-standard my-6 text-neutral-700 dark:text-neutral-300 leading-relaxed text-lg" {...props} />
)

const ProseStrong: React.FC<React.HTMLAttributes<HTMLElement> & { __node?: any }> = ({ __node, ...props }) => (
  <strong className="prose-strong-standard font-bold text-neutral-900 dark:text-neutral-100" {...props} />
)

const ProseEm: React.FC<React.HTMLAttributes<HTMLElement> & { __node?: any }> = ({ __node, ...props }) => (
  <em className="prose-em-standard italic text-neutral-600 dark:text-neutral-400" {...props} />
)

const ProseDel: React.FC<React.HTMLAttributes<HTMLElement> & { __node?: any }> = ({ __node, ...props }) => (
  <del className="prose-del-standard line-through text-neutral-500 dark:text-neutral-500 opacity-75" {...props} />
)

// Links
const ProseA: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { __node?: any }> = ({ __node, ...props }) => (
  <a className="prose-a-standard text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 transition-colors" {...props} />
)

// Code
const ProseCode: React.FC<React.HTMLAttributes<HTMLElement> & { __node?: any }> = ({ __node, ...props }) => (
  <code className="prose-code-standard bg-neutral-100 dark:bg-neutral-800 text-pink-600 dark:text-pink-400 px-2 py-1 rounded text-base font-mono" {...props} />
)

// Lists
const ProseUl: React.FC<React.HTMLAttributes<HTMLUListElement> & { __node?: any }> = ({ __node, ...props }) => (
  <ul className="prose-ul-standard list-disc list-outside ml-6 my-6 text-neutral-700 dark:text-neutral-300 space-y-3 text-lg" {...props} />
)

const ProseOl: React.FC<React.OlHTMLAttributes<HTMLOListElement> & { __node?: any }> = ({ __node, ...props }) => (
  <ol className="prose-ol-standard list-decimal list-outside ml-6 my-6 text-neutral-700 dark:text-neutral-300 space-y-3 text-lg" {...props} />
)

const ProseLi: React.FC<React.LiHTMLAttributes<HTMLLIElement> & { __node?: any }> = ({ __node, ...props }) => (
  <li className="prose-li-standard pl-2" {...props} />
)

// Blockquote
const ProseBlockquote: React.FC<React.BlockquoteHTMLAttributes<HTMLQuoteElement> & { __node?: any }> = ({ __node, ...props }) => (
  <blockquote className="prose-blockquote-standard border-l-4 border-blue-400 dark:border-blue-600 pl-6 my-8 text-neutral-600 dark:text-neutral-400 italic text-xl" {...props} />
)

// Table
const ProseTable: React.FC<React.TableHTMLAttributes<HTMLTableElement> & { __node?: any }> = ({ __node, ...props }) => (
  <table className="prose-table-standard w-full border-collapse my-8" {...props} />
)

const ProseThead: React.FC<React.HTMLAttributes<HTMLTableSectionElement> & { __node?: any }> = ({ __node, ...props }) => (
  <thead className="prose-thead-standard" {...props} />
)

const ProseTbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement> & { __node?: any }> = ({ __node, ...props }) => (
  <tbody className="prose-tbody-standard" {...props} />
)

const ProseTr: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { __node?: any }> = ({ __node, ...props }) => (
  <tr className="prose-tr-standard border-b border-neutral-200 dark:border-neutral-800" {...props} />
)

const ProseTh: React.FC<React.ThHTMLAttributes<HTMLTableCellElement> & { __node?: any }> = ({ __node, ...props }) => (
  <th className="prose-th-standard bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-6 py-3 text-left font-semibold text-neutral-900 dark:text-white" {...props} />
)

const ProseTd: React.FC<React.TdHTMLAttributes<HTMLTableCellElement> & { __node?: any }> = ({ __node, ...props }) => (
  <td className="prose-td-standard border border-neutral-200 dark:border-neutral-800 px-6 py-3 text-neutral-700 dark:text-neutral-300" {...props} />
)

// Other elements
const ProseHr: React.FC<React.HTMLAttributes<HTMLHRElement> & { __node?: any }> = ({ __node, ...props }) => (
  <hr className="prose-hr-standard my-12 border-t border-neutral-300 dark:border-neutral-700" {...props} />
)

const ProseImg: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { __node?: any }> = ({ __node, ...props }) => (
  <img className="prose-img-standard my-8 rounded-xl shadow-lg max-w-full h-auto" {...props} />
)

export const standardProseComponents = {
  ProseH1,
  ProseH2,
  ProseH3,
  ProseH4,
  ProseH5,
  ProseH6,
  ProseP,
  ProseStrong,
  ProseEm,
  ProseDel,
  ProseA,
  ProseCode,
  ProsePre,
  ProseUl,
  ProseOl,
  ProseLi,
  ProseBlockquote,
  ProseTable,
  ProseThead,
  ProseTbody,
  ProseTr,
  ProseTh,
  ProseTd,
  ProseHr,
  ProseImg,
}
