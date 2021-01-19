import { RuleCore } from 'markdown-it/lib/parser_core';
import { Directives } from './types';
declare const parseOptions: (directives: Directives) => RuleCore;
export default parseOptions;
