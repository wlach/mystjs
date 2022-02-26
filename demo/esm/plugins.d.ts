import type MarkdownIt from 'markdown-it';
export { default as frontMatterPlugin } from 'markdown-it-front-matter';
export { default as footnotePlugin } from 'markdown-it-footnote';
export { default as tasklistPlugin } from 'markdown-it-task-lists';
export { default as deflistPlugin } from 'markdown-it-deflist';
export { docutilsPlugin } from 'markdown-it-docutils';
export { mystBlockPlugin } from 'markdown-it-myst-extras';
export { plugin as mathPlugin, MathExtensionOptions } from './math';
/** Markdown-it plugin to convert the front-matter token to a renderable token, for previews */
export declare function convertFrontMatter(md: MarkdownIt): void;
