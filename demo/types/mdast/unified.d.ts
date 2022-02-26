import { Root } from 'mdast';
import type { Plugin } from 'unified';
import { Options } from '../types';
export declare const formatHtml: Plugin<[Options['formatHtml']?], string, Root>;
