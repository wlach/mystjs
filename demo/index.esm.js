import require$$8 from 'punycode';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var markdownItFrontMatter = function front_matter_plugin(md, cb) {
  var min_markers = 3,
      marker_str = '-',
      marker_char = marker_str.charCodeAt(0),
      marker_len = marker_str.length;

  function frontMatter(state, startLine, endLine, silent) {
    var pos,
        nextLine,
        marker_count,
        token,
        old_parent,
        old_line_max,
        start_content,
        auto_closed = false,
        start = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine]; // Check out the first character of the first line quickly,
    // this should filter out non-front matter

    if (startLine !== 0 || marker_char !== state.src.charCodeAt(0)) {
      return false;
    } // Check out the rest of the marker string
    // while pos <= 3


    for (pos = start + 1; pos <= max; pos++) {
      if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
        start_content = pos + 1;
        break;
      }
    }

    marker_count = Math.floor((pos - start) / marker_len);

    if (marker_count < min_markers) {
      return false;
    }

    pos -= (pos - start) % marker_len; // Since start is found, we can report success here in validation mode

    if (silent) {
      return true;
    } // Search for the end of the block


    nextLine = startLine;

    for (;;) {
      nextLine++;

      if (nextLine >= endLine) {
        // unclosed block should be autoclosed by end of document.
        // also block seems to be autoclosed by end of parent
        break;
      }

      if (state.src.slice(start, max) === '...') {
        break;
      }

      start = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (start < max && state.sCount[nextLine] < state.blkIndent) {
        // non-empty line with negative indent should stop the list:
        // - ```
        //  test
        break;
      }

      if (marker_char !== state.src.charCodeAt(start)) {
        continue;
      }

      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        // closing fence should be indented less than 4 spaces
        continue;
      }

      for (pos = start + 1; pos <= max; pos++) {
        if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
          break;
        }
      } // closing code fence must be at least as long as the opening one


      if (Math.floor((pos - start) / marker_len) < marker_count) {
        continue;
      } // make sure tail has spaces only


      pos -= (pos - start) % marker_len;
      pos = state.skipSpaces(pos);

      if (pos < max) {
        continue;
      } // found!


      auto_closed = true;
      break;
    }

    old_parent = state.parentType;
    old_line_max = state.lineMax;
    state.parentType = 'container'; // this will prevent lazy continuations from ever going past our end marker

    state.lineMax = nextLine;
    token = state.push('front_matter', null, 0);
    token.hidden = true;
    token.markup = state.src.slice(startLine, pos);
    token.block = true;
    token.map = [startLine, pos];
    token.meta = state.src.slice(start_content, start - 1);
    state.parentType = old_parent;
    state.lineMax = old_line_max;
    state.line = nextLine + (auto_closed ? 1 : 0);
    cb(token.meta);
    return true;
  }

  md.block.ruler.before('table', 'front_matter', frontMatter, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  });
};

// Renderer partials


function render_footnote_anchor_name(tokens, idx, options, env
/*, slf*/
) {
  var n = Number(tokens[idx].meta.id + 1).toString();
  var prefix = '';

  if (typeof env.docId === 'string') {
    prefix = '-' + env.docId + '-';
  }

  return prefix + n;
}

function render_footnote_caption(tokens, idx
/*, options, env, slf*/
) {
  var n = Number(tokens[idx].meta.id + 1).toString();

  if (tokens[idx].meta.subId > 0) {
    n += ':' + tokens[idx].meta.subId;
  }

  return '[' + n + ']';
}

function render_footnote_ref(tokens, idx, options, env, slf) {
  var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
  var caption = slf.rules.footnote_caption(tokens, idx, options, env, slf);
  var refid = id;

  if (tokens[idx].meta.subId > 0) {
    refid += ':' + tokens[idx].meta.subId;
  }

  return '<sup class="footnote-ref"><a href="#fn' + id + '" id="fnref' + refid + '">' + caption + '</a></sup>';
}

function render_footnote_block_open(tokens, idx, options) {
  return (options.xhtmlOut ? '<hr class="footnotes-sep" />\n' : '<hr class="footnotes-sep">\n') + '<section class="footnotes">\n' + '<ol class="footnotes-list">\n';
}

function render_footnote_block_close() {
  return '</ol>\n</section>\n';
}

function render_footnote_open(tokens, idx, options, env, slf) {
  var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);

  if (tokens[idx].meta.subId > 0) {
    id += ':' + tokens[idx].meta.subId;
  }

  return '<li id="fn' + id + '" class="footnote-item">';
}

function render_footnote_close() {
  return '</li>\n';
}

function render_footnote_anchor(tokens, idx, options, env, slf) {
  var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);

  if (tokens[idx].meta.subId > 0) {
    id += ':' + tokens[idx].meta.subId;
  }
  /* ↩ with escape code to prevent display as Apple Emoji on iOS */


  return ' <a href="#fnref' + id + '" class="footnote-backref">\u21a9\uFE0E</a>';
}

var markdownItFootnote = function footnote_plugin(md) {
  var parseLinkLabel = md.helpers.parseLinkLabel,
      isSpace = md.utils.isSpace;
  md.renderer.rules.footnote_ref = render_footnote_ref;
  md.renderer.rules.footnote_block_open = render_footnote_block_open;
  md.renderer.rules.footnote_block_close = render_footnote_block_close;
  md.renderer.rules.footnote_open = render_footnote_open;
  md.renderer.rules.footnote_close = render_footnote_close;
  md.renderer.rules.footnote_anchor = render_footnote_anchor; // helpers (only used in other rules, no tokens are attached to those)

  md.renderer.rules.footnote_caption = render_footnote_caption;
  md.renderer.rules.footnote_anchor_name = render_footnote_anchor_name; // Process footnote block definition

  function footnote_def(state, startLine, endLine, silent) {
    var oldBMark,
        oldTShift,
        oldSCount,
        oldParentType,
        pos,
        label,
        token,
        initial,
        offset,
        ch,
        posAfterColon,
        start = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine]; // line should be at least 5 chars - "[^x]:"

    if (start + 4 > max) {
      return false;
    }

    if (state.src.charCodeAt(start) !== 0x5B
    /* [ */
    ) {
      return false;
    }

    if (state.src.charCodeAt(start + 1) !== 0x5E
    /* ^ */
    ) {
      return false;
    }

    for (pos = start + 2; pos < max; pos++) {
      if (state.src.charCodeAt(pos) === 0x20) {
        return false;
      }

      if (state.src.charCodeAt(pos) === 0x5D
      /* ] */
      ) {
        break;
      }
    }

    if (pos === start + 2) {
      return false;
    } // no empty footnote labels


    if (pos + 1 >= max || state.src.charCodeAt(++pos) !== 0x3A
    /* : */
    ) {
      return false;
    }

    if (silent) {
      return true;
    }

    pos++;

    if (!state.env.footnotes) {
      state.env.footnotes = {};
    }

    if (!state.env.footnotes.refs) {
      state.env.footnotes.refs = {};
    }

    label = state.src.slice(start + 2, pos - 2);
    state.env.footnotes.refs[':' + label] = -1;
    token = new state.Token('footnote_reference_open', '', 1);
    token.meta = {
      label: label
    };
    token.level = state.level++;
    state.tokens.push(token);
    oldBMark = state.bMarks[startLine];
    oldTShift = state.tShift[startLine];
    oldSCount = state.sCount[startLine];
    oldParentType = state.parentType;
    posAfterColon = pos;
    initial = offset = state.sCount[startLine] + pos - (state.bMarks[startLine] + state.tShift[startLine]);

    while (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (isSpace(ch)) {
        if (ch === 0x09) {
          offset += 4 - offset % 4;
        } else {
          offset++;
        }
      } else {
        break;
      }

      pos++;
    }

    state.tShift[startLine] = pos - posAfterColon;
    state.sCount[startLine] = offset - initial;
    state.bMarks[startLine] = posAfterColon;
    state.blkIndent += 4;
    state.parentType = 'footnote';

    if (state.sCount[startLine] < state.blkIndent) {
      state.sCount[startLine] += state.blkIndent;
    }

    state.md.block.tokenize(state, startLine, endLine, true);
    state.parentType = oldParentType;
    state.blkIndent -= 4;
    state.tShift[startLine] = oldTShift;
    state.sCount[startLine] = oldSCount;
    state.bMarks[startLine] = oldBMark;
    token = new state.Token('footnote_reference_close', '', -1);
    token.level = --state.level;
    state.tokens.push(token);
    return true;
  } // Process inline footnotes (^[...])


  function footnote_inline(state, silent) {
    var labelStart,
        labelEnd,
        footnoteId,
        token,
        tokens,
        max = state.posMax,
        start = state.pos;

    if (start + 2 >= max) {
      return false;
    }

    if (state.src.charCodeAt(start) !== 0x5E
    /* ^ */
    ) {
      return false;
    }

    if (state.src.charCodeAt(start + 1) !== 0x5B
    /* [ */
    ) {
      return false;
    }

    labelStart = start + 2;
    labelEnd = parseLinkLabel(state, start + 1); // parser failed to find ']', so it's not a valid note

    if (labelEnd < 0) {
      return false;
    } // We found the end of the link, and know for a fact it's a valid link;
    // so all that's left to do is to call tokenizer.
    //


    if (!silent) {
      if (!state.env.footnotes) {
        state.env.footnotes = {};
      }

      if (!state.env.footnotes.list) {
        state.env.footnotes.list = [];
      }

      footnoteId = state.env.footnotes.list.length;
      state.md.inline.parse(state.src.slice(labelStart, labelEnd), state.md, state.env, tokens = []);
      token = state.push('footnote_ref', '', 0);
      token.meta = {
        id: footnoteId
      };
      state.env.footnotes.list[footnoteId] = {
        content: state.src.slice(labelStart, labelEnd),
        tokens: tokens
      };
    }

    state.pos = labelEnd + 1;
    state.posMax = max;
    return true;
  } // Process footnote references ([^...])


  function footnote_ref(state, silent) {
    var label,
        pos,
        footnoteId,
        footnoteSubId,
        token,
        max = state.posMax,
        start = state.pos; // should be at least 4 chars - "[^x]"

    if (start + 3 > max) {
      return false;
    }

    if (!state.env.footnotes || !state.env.footnotes.refs) {
      return false;
    }

    if (state.src.charCodeAt(start) !== 0x5B
    /* [ */
    ) {
      return false;
    }

    if (state.src.charCodeAt(start + 1) !== 0x5E
    /* ^ */
    ) {
      return false;
    }

    for (pos = start + 2; pos < max; pos++) {
      if (state.src.charCodeAt(pos) === 0x20) {
        return false;
      }

      if (state.src.charCodeAt(pos) === 0x0A) {
        return false;
      }

      if (state.src.charCodeAt(pos) === 0x5D
      /* ] */
      ) {
        break;
      }
    }

    if (pos === start + 2) {
      return false;
    } // no empty footnote labels


    if (pos >= max) {
      return false;
    }

    pos++;
    label = state.src.slice(start + 2, pos - 1);

    if (typeof state.env.footnotes.refs[':' + label] === 'undefined') {
      return false;
    }

    if (!silent) {
      if (!state.env.footnotes.list) {
        state.env.footnotes.list = [];
      }

      if (state.env.footnotes.refs[':' + label] < 0) {
        footnoteId = state.env.footnotes.list.length;
        state.env.footnotes.list[footnoteId] = {
          label: label,
          count: 0
        };
        state.env.footnotes.refs[':' + label] = footnoteId;
      } else {
        footnoteId = state.env.footnotes.refs[':' + label];
      }

      footnoteSubId = state.env.footnotes.list[footnoteId].count;
      state.env.footnotes.list[footnoteId].count++;
      token = state.push('footnote_ref', '', 0);
      token.meta = {
        id: footnoteId,
        subId: footnoteSubId,
        label: label
      };
    }

    state.pos = pos;
    state.posMax = max;
    return true;
  } // Glue footnote tokens to end of token stream


  function footnote_tail(state) {
    var i,
        l,
        j,
        t,
        lastParagraph,
        list,
        token,
        tokens,
        current,
        currentLabel,
        insideRef = false,
        refTokens = {};

    if (!state.env.footnotes) {
      return;
    }

    state.tokens = state.tokens.filter(function (tok) {
      if (tok.type === 'footnote_reference_open') {
        insideRef = true;
        current = [];
        currentLabel = tok.meta.label;
        return false;
      }

      if (tok.type === 'footnote_reference_close') {
        insideRef = false; // prepend ':' to avoid conflict with Object.prototype members

        refTokens[':' + currentLabel] = current;
        return false;
      }

      if (insideRef) {
        current.push(tok);
      }

      return !insideRef;
    });

    if (!state.env.footnotes.list) {
      return;
    }

    list = state.env.footnotes.list;
    token = new state.Token('footnote_block_open', '', 1);
    state.tokens.push(token);

    for (i = 0, l = list.length; i < l; i++) {
      token = new state.Token('footnote_open', '', 1);
      token.meta = {
        id: i,
        label: list[i].label
      };
      state.tokens.push(token);

      if (list[i].tokens) {
        tokens = [];
        token = new state.Token('paragraph_open', 'p', 1);
        token.block = true;
        tokens.push(token);
        token = new state.Token('inline', '', 0);
        token.children = list[i].tokens;
        token.content = list[i].content;
        tokens.push(token);
        token = new state.Token('paragraph_close', 'p', -1);
        token.block = true;
        tokens.push(token);
      } else if (list[i].label) {
        tokens = refTokens[':' + list[i].label];
      }

      if (tokens) state.tokens = state.tokens.concat(tokens);

      if (state.tokens[state.tokens.length - 1].type === 'paragraph_close') {
        lastParagraph = state.tokens.pop();
      } else {
        lastParagraph = null;
      }

      t = list[i].count > 0 ? list[i].count : 1;

      for (j = 0; j < t; j++) {
        token = new state.Token('footnote_anchor', '', 0);
        token.meta = {
          id: i,
          subId: j,
          label: list[i].label
        };
        state.tokens.push(token);
      }

      if (lastParagraph) {
        state.tokens.push(lastParagraph);
      }

      token = new state.Token('footnote_close', '', -1);
      state.tokens.push(token);
    }

    token = new state.Token('footnote_block_close', '', -1);
    state.tokens.push(token);
  }

  md.block.ruler.before('reference', 'footnote_def', footnote_def, {
    alt: ['paragraph', 'reference']
  });
  md.inline.ruler.after('image', 'footnote_inline', footnote_inline);
  md.inline.ruler.after('footnote_inline', 'footnote_ref', footnote_ref);
  md.core.ruler.after('inline', 'footnote_tail', footnote_tail);
};

//
// https://github.com/blog/1375-task-lists-in-gfm-issues-pulls-comments
// https://github.com/blog/1825-task-lists-in-all-markdown-documents

var disableCheckboxes = true;
var useLabelWrapper = false;
var useLabelAfter = false;

var markdownItTaskLists = function (md, options) {
  if (options) {
    disableCheckboxes = !options.enabled;
    useLabelWrapper = !!options.label;
    useLabelAfter = !!options.labelAfter;
  }

  md.core.ruler.after('inline', 'github-task-lists', function (state) {
    var tokens = state.tokens;

    for (var i = 2; i < tokens.length; i++) {
      if (isTodoItem(tokens, i)) {
        todoify(tokens[i], state.Token);
        attrSet(tokens[i - 2], 'class', 'task-list-item' + (!disableCheckboxes ? ' enabled' : ''));
        attrSet(tokens[parentToken(tokens, i - 2)], 'class', 'contains-task-list');
      }
    }
  });
};

function attrSet(token, name, value) {
  var index = token.attrIndex(name);
  var attr = [name, value];

  if (index < 0) {
    token.attrPush(attr);
  } else {
    token.attrs[index] = attr;
  }
}

function parentToken(tokens, index) {
  var targetLevel = tokens[index].level - 1;

  for (var i = index - 1; i >= 0; i--) {
    if (tokens[i].level === targetLevel) {
      return i;
    }
  }

  return -1;
}

function isTodoItem(tokens, index) {
  return isInline(tokens[index]) && isParagraph(tokens[index - 1]) && isListItem(tokens[index - 2]) && startsWithTodoMarkdown(tokens[index]);
}

function todoify(token, TokenConstructor) {
  token.children.unshift(makeCheckbox(token, TokenConstructor));
  token.children[1].content = token.children[1].content.slice(3);
  token.content = token.content.slice(3);

  if (useLabelWrapper) {
    if (useLabelAfter) {
      token.children.pop(); // Use large random number as id property of the checkbox.

      var id = 'task-item-' + Math.ceil(Math.random() * (10000 * 1000) - 1000);
      token.children[0].content = token.children[0].content.slice(0, -1) + ' id="' + id + '">';
      token.children.push(afterLabel(token.content, id, TokenConstructor));
    } else {
      token.children.unshift(beginLabel(TokenConstructor));
      token.children.push(endLabel(TokenConstructor));
    }
  }
}

function makeCheckbox(token, TokenConstructor) {
  var checkbox = new TokenConstructor('html_inline', '', 0);
  var disabledAttr = disableCheckboxes ? ' disabled="" ' : '';

  if (token.content.indexOf('[ ] ') === 0) {
    checkbox.content = '<input class="task-list-item-checkbox"' + disabledAttr + 'type="checkbox">';
  } else if (token.content.indexOf('[x] ') === 0 || token.content.indexOf('[X] ') === 0) {
    checkbox.content = '<input class="task-list-item-checkbox" checked=""' + disabledAttr + 'type="checkbox">';
  }

  return checkbox;
} // these next two functions are kind of hacky; probably should really be a
// true block-level token with .tag=='label'


function beginLabel(TokenConstructor) {
  var token = new TokenConstructor('html_inline', '', 0);
  token.content = '<label>';
  return token;
}

function endLabel(TokenConstructor) {
  var token = new TokenConstructor('html_inline', '', 0);
  token.content = '</label>';
  return token;
}

function afterLabel(content, id, TokenConstructor) {
  var token = new TokenConstructor('html_inline', '', 0);
  token.content = '<label class="task-list-item-label" for="' + id + '">' + content + '</label>';
  token.attrs = [{
    for: id
  }];
  return token;
}

function isInline(token) {
  return token.type === 'inline';
}

function isParagraph(token) {
  return token.type === 'paragraph_open';
}

function isListItem(token) {
  return token.type === 'list_item_open';
}

function startsWithTodoMarkdown(token) {
  // leading whitespace in a list item is already trimmed off by markdown-it
  return token.content.indexOf('[ ] ') === 0 || token.content.indexOf('[x] ') === 0 || token.content.indexOf('[X] ') === 0;
}

var markdownItDeflist = function deflist_plugin(md) {
  var isSpace = md.utils.isSpace; // Search `[:~][\n ]`, returns next pos after marker on success
  // or -1 on fail.

  function skipMarker(state, line) {
    var pos,
        marker,
        start = state.bMarks[line] + state.tShift[line],
        max = state.eMarks[line];

    if (start >= max) {
      return -1;
    } // Check bullet


    marker = state.src.charCodeAt(start++);

    if (marker !== 0x7E
    /* ~ */
    && marker !== 0x3A
    /* : */
    ) {
      return -1;
    }

    pos = state.skipSpaces(start); // require space after ":"

    if (start === pos) {
      return -1;
    } // no empty definitions, e.g. "  : "


    if (pos >= max) {
      return -1;
    }

    return start;
  }

  function markTightParagraphs(state, idx) {
    var i,
        l,
        level = state.level + 2;

    for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
      if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
        state.tokens[i + 2].hidden = true;
        state.tokens[i].hidden = true;
        i += 2;
      }
    }
  }

  function deflist(state, startLine, endLine, silent) {
    var ch, contentStart, ddLine, dtLine, itemLines, listLines, listTokIdx, max, nextLine, offset, oldDDIndent, oldIndent, oldParentType, oldSCount, oldTShift, oldTight, pos, prevEmptyEnd, tight, token;

    if (silent) {
      // quirk: validation mode validates a dd block only, not a whole deflist
      if (state.ddIndent < 0) {
        return false;
      }

      return skipMarker(state, startLine) >= 0;
    }

    nextLine = startLine + 1;

    if (nextLine >= endLine) {
      return false;
    }

    if (state.isEmpty(nextLine)) {
      nextLine++;

      if (nextLine >= endLine) {
        return false;
      }
    }

    if (state.sCount[nextLine] < state.blkIndent) {
      return false;
    }

    contentStart = skipMarker(state, nextLine);

    if (contentStart < 0) {
      return false;
    } // Start list


    listTokIdx = state.tokens.length;
    tight = true;
    token = state.push('dl_open', 'dl', 1);
    token.map = listLines = [startLine, 0]; //
    // Iterate list items
    //

    dtLine = startLine;
    ddLine = nextLine; // One definition list can contain multiple DTs,
    // and one DT can be followed by multiple DDs.
    //
    // Thus, there is two loops here, and label is
    // needed to break out of the second one
    //

    /*eslint no-labels:0,block-scoped-var:0*/

    OUTER: for (;;) {
      prevEmptyEnd = false;
      token = state.push('dt_open', 'dt', 1);
      token.map = [dtLine, dtLine];
      token = state.push('inline', '', 0);
      token.map = [dtLine, dtLine];
      token.content = state.getLines(dtLine, dtLine + 1, state.blkIndent, false).trim();
      token.children = [];
      token = state.push('dt_close', 'dt', -1);

      for (;;) {
        token = state.push('dd_open', 'dd', 1);
        token.map = itemLines = [nextLine, 0];
        pos = contentStart;
        max = state.eMarks[ddLine];
        offset = state.sCount[ddLine] + contentStart - (state.bMarks[ddLine] + state.tShift[ddLine]);

        while (pos < max) {
          ch = state.src.charCodeAt(pos);

          if (isSpace(ch)) {
            if (ch === 0x09) {
              offset += 4 - offset % 4;
            } else {
              offset++;
            }
          } else {
            break;
          }

          pos++;
        }

        contentStart = pos;
        oldTight = state.tight;
        oldDDIndent = state.ddIndent;
        oldIndent = state.blkIndent;
        oldTShift = state.tShift[ddLine];
        oldSCount = state.sCount[ddLine];
        oldParentType = state.parentType;
        state.blkIndent = state.ddIndent = state.sCount[ddLine] + 2;
        state.tShift[ddLine] = contentStart - state.bMarks[ddLine];
        state.sCount[ddLine] = offset;
        state.tight = true;
        state.parentType = 'deflist';
        state.md.block.tokenize(state, ddLine, endLine, true); // If any of list item is tight, mark list as tight

        if (!state.tight || prevEmptyEnd) {
          tight = false;
        } // Item become loose if finish with empty line,
        // but we should filter last element, because it means list finish


        prevEmptyEnd = state.line - ddLine > 1 && state.isEmpty(state.line - 1);
        state.tShift[ddLine] = oldTShift;
        state.sCount[ddLine] = oldSCount;
        state.tight = oldTight;
        state.parentType = oldParentType;
        state.blkIndent = oldIndent;
        state.ddIndent = oldDDIndent;
        token = state.push('dd_close', 'dd', -1);
        itemLines[1] = nextLine = state.line;

        if (nextLine >= endLine) {
          break OUTER;
        }

        if (state.sCount[nextLine] < state.blkIndent) {
          break OUTER;
        }

        contentStart = skipMarker(state, nextLine);

        if (contentStart < 0) {
          break;
        }

        ddLine = nextLine; // go to the next loop iteration:
        // insert DD tag and repeat checking
      }

      if (nextLine >= endLine) {
        break;
      }

      dtLine = nextLine;

      if (state.isEmpty(dtLine)) {
        break;
      }

      if (state.sCount[dtLine] < state.blkIndent) {
        break;
      }

      ddLine = dtLine + 1;

      if (ddLine >= endLine) {
        break;
      }

      if (state.isEmpty(ddLine)) {
        ddLine++;
      }

      if (ddLine >= endLine) {
        break;
      }

      if (state.sCount[ddLine] < state.blkIndent) {
        break;
      }

      contentStart = skipMarker(state, ddLine);

      if (contentStart < 0) {
        break;
      } // go to the next loop iteration:
      // insert DT and DD tags and repeat checking

    } // Finilize list


    token = state.push('dl_close', 'dl', -1);
    listLines[1] = nextLine;
    state.line = nextLine; // mark paragraphs tight if needed

    if (tight) {
      markTightParagraphs(state, listTokIdx);
    }

    return true;
  }

  md.block.ruler.before('paragraph', 'deflist', deflist, {
    alt: ['paragraph', 'reference', 'blockquote']
  });
};

/* eslint-disable @typescript-eslint/no-explicit-any */

/** A class to define a single role */
class Role {
  constructor(state) {
    this.state = state;
  }
  /** Convert the role to tokens */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  run(data) {
    return [];
  }

}
class RawRole extends Role {
  run(data) {
    // TODO options
    const token = new this.state.Token("code_inline", "code", 0);
    token.content = data.content;
    return [token];
  }

}
const main = {
  raw: RawRole
};

const INLINE_MATH_RULE = "math_inline";
class Math$2 extends Role {
  run(data) {
    const inline = new this.state.Token(INLINE_MATH_RULE, "span", 0);
    inline.attrSet("class", "math inline");
    inline.markup = "$";
    inline.content = data.content;
    return [inline];
  }

}
function inlineMathRenderer(md, options) {
  var _a; // Only create the renderer if it does not exist
  // For example, this may be defined in markdown-it-dollarmath


  if (!((_a = options === null || options === void 0 ? void 0 : options.roles) === null || _a === void 0 ? void 0 : _a.math) || md.renderer.rules[INLINE_MATH_RULE]) return;

  md.renderer.rules[INLINE_MATH_RULE] = (tokens, idx) => {
    var _a, _b, _c;

    const renderer = (_c = (_b = (_a = options === null || options === void 0 ? void 0 : options.opts) === null || _a === void 0 ? void 0 : _a.math) === null || _b === void 0 ? void 0 : _b.renderer) !== null && _c !== void 0 ? _c : c => md.utils.escapeHtml(c);
    const token = tokens[idx];
    const content = token.content.trim();
    const math = renderer(content, {
      displayMode: false
    });
    return `<span class="${token.attrGet("class")}">${math}</span>`;
  };
}
const math$2 = {
  math: Math$2
};

/** Parse a role, in MyST format */
function rolePlugin(md, options) {
  if (options.parseRoles) {
    md.inline.ruler.before("backticks", "parse_roles", roleRule);
  }

  md.core.ruler.after(options.rolesAfter || "inline", "run_roles", runRoles(options.roles || {})); // fallback renderer for unhandled roles

  md.renderer.rules["role"] = (tokens, idx) => {
    const token = tokens[idx];
    return `<span class="role-unhandled"><mark>${token.meta.name}</mark><code>${token.content}</code></span>`;
  }; // TODO: when another renderer comes up, refactor into something a bit more scalable


  inlineMathRenderer(md, options); // TODO role_error renderer
}

function roleRule(state, silent) {
  // Check if the role is escaped
  if (state.src.charCodeAt(state.pos - 1) === 0x5c) {
    /* \ */
    // TODO: this could be improved in the case of edge case '\\{', also multi-line
    return false;
  }

  const match = ROLE_PATTERN.exec(state.src.slice(state.pos));
  if (match == null) return false;
  const [str, name,, content] = match; // eslint-disable-next-line no-param-reassign

  state.pos += str.length;

  if (!silent) {
    const token = state.push("role", "", 0);
    token.meta = {
      name
    };
    token.content = content;
  }

  return true;
} // MyST role syntax format e.g. {role}`text`


let _x;

try {
  _x = new RegExp("^\\{([a-zA-Z_\\-+:]{1,36})\\}(`+)(?!`)(.+?)(?<!`)\\2(?!`)");
} catch (error) {
  // Safari does not support negative look-behinds
  // This is a slightly down-graded variant, as it does not require a space.
  _x = /^\{([a-zA-Z_\-+:]{1,36})\}(`+)(?!`)(.+?)\2(?!`)/;
}

const ROLE_PATTERN = _x;
/** Run all roles, replacing the original token */

function runRoles(roles) {
  function func(state) {
    var _a;

    for (const token of state.tokens) {
      if (token.type === "inline" && token.children) {
        const childTokens = [];

        for (const child of token.children) {
          // TODO role name translations
          if (child.type === "role" && ((_a = child.meta) === null || _a === void 0 ? void 0 : _a.name) in roles) {
            try {
              const role = new roles[child.meta.name](state);
              const newTokens = role.run({
                parentMap: token.map,
                content: child.content
              });
              childTokens.push(...newTokens);
            } catch (err) {
              const errorToken = new state.Token("role_error", "", 0);
              errorToken.content = child.content;
              errorToken.info = child.info;
              errorToken.meta = child.meta;
              errorToken.map = child.map;
              errorToken.meta.error_message = err.message;
              errorToken.meta.error_name = err.name;
              childTokens.push(errorToken);
            }
          } else {
            childTokens.push(child);
          }
        }

        token.children = childTokens;
      }
    }

    return true;
  }

  return func;
}

class Subscript extends Role {
  run(data) {
    const open = new this.state.Token("sub_open", "sub", 1);
    open.markup = "~";
    const text = new this.state.Token("text", "", 0);
    text.content = data.content;
    const close = new this.state.Token("sub_close", "sub", -1);
    close.markup = "~";
    return [open, text, close];
  }

}
class Superscript extends Role {
  run(data) {
    const open = new this.state.Token("sup_open", "sup", 1);
    open.markup = "~";
    const text = new this.state.Token("text", "", 0);
    text.content = data.content;
    const close = new this.state.Token("sup_close", "sup", -1);
    close.markup = "~";
    return [open, text, close];
  }

}
const ABBR_PATTERN = /^(.+?)\(([^()]+)\)$/; // e.g. 'CSS (Cascading Style Sheets)'

class Abbreviation extends Role {
  run(data) {
    var _a, _b, _c, _d;

    const match = ABBR_PATTERN.exec(data.content);
    const content = (_b = (_a = match === null || match === void 0 ? void 0 : match[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : data.content.trim();
    const title = (_d = (_c = match === null || match === void 0 ? void 0 : match[2]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : null;
    const open = new this.state.Token("abbr_open", "abbr", 1);
    if (title) open.attrSet("title", title);
    const text = new this.state.Token("text", "", 0);
    text.content = content;
    const close = new this.state.Token("abbr_close", "abbr", -1);
    return [open, text, close];
  }

}
const html$5 = {
  // Subscript
  subscript: Subscript,
  sub: Subscript,
  // Superscript
  superscript: Superscript,
  sup: Superscript,
  // Abbreviation
  abbreviation: Abbreviation,
  abbr: Abbreviation
};

/** The kind of the target as a TargetKind enum ('fig', 'eq', etc.) */
var TargetKind$1;

(function (TargetKind) {
  TargetKind["equation"] = "eq";
  TargetKind["figure"] = "fig";
  TargetKind["table"] = "table";
  TargetKind["code"] = "code";
  TargetKind["section"] = "sec";
})(TargetKind$1 || (TargetKind$1 = {}));
/** Safely create the document state for docutils */


function getDocState(state) {
  var _a, _b;

  const env = (_b = (_a = state.env) === null || _a === void 0 ? void 0 : _a.docutils) !== null && _b !== void 0 ? _b : {};
  if (!env.targets) env.targets = {};
  if (!env.references) env.references = [];
  if (!env.numbering) env.numbering = {};
  if (!state.env.docutils) state.env.docutils = env;
  return env;
}
/**
 * Safely create a namespaced meta information on a token
 * @param token A markdown-it token that will contain the target
 * @returns An object containing a `Target`
 */

function getNamespacedMeta(token) {
  var _a, _b;

  const meta = (_b = (_a = token.meta) === null || _a === void 0 ? void 0 : _a.docutils) !== null && _b !== void 0 ? _b : {};
  if (!token.meta) token.meta = {};
  if (!token.meta.docutils) token.meta.docutils = meta;
  return meta;
}
/** Get the next number for an equation, figure, code or table
 *
 * Can input `{ docutils: { numbering: { eq: 100 } } }` to start counting at a different number.
 *
 * @param state MarkdownIt state that will be modified
 */

function nextNumber(state, kind) {
  const env = getDocState(state);

  if (env.numbering[kind] == null) {
    env.numbering[kind] = 1;
  } else {
    env.numbering[kind] += 1;
  }

  return env.numbering[kind];
}
/** Create a new internal target.
 *
 * @param state MarkdownIt state that will be modified
 * @param label The reference label that will be normalized and used to associate the target. Note some directives use "name".
 * @param kind The target kind: "eq", "code", "table" or "fig"
 */


function newTarget(state, token, kind, label, title, silent = false) {
  const env = getDocState(state);
  const number = nextNumber(state, kind);
  const target = {
    label,
    kind,
    number,
    title
  };

  if (!silent) {
    // Put the token in both the token.meta and the central environment
    const meta = getNamespacedMeta(token);
    meta.target = target;
    token.attrSet("id", label); // TODO: raise error on duplicates

    env.targets[label] = target;
  }

  return target;
}
/**
 * Resolve a reference **in-place** in a following numbering pass.
 *
 * @param state Reference to the state object
 * @param tokens The open/content/close tokens of the reference
 * @param name Name/label/identifier of the target
 * @param opts Includes the reference `kind` and an optional way to create the reference content
 */

function resolveRefLater(state, tokens, data, opts) {
  var _a;

  tokens.open.meta = (_a = tokens.open.meta) !== null && _a !== void 0 ? _a : {};
  tokens.open.meta.kind = data.kind;
  tokens.open.meta.label = data.label;
  tokens.open.meta.value = data.value;
  const env = getDocState(state);
  env.references.push(Object.assign({
    label: data.label,
    tokens
  }, opts));
}

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Reference <ref>'

class Eq extends Role {
  run(data) {
    const open = new this.state.Token("ref_open", "a", 1);
    const content = new this.state.Token("text", "", 0);
    const close = new this.state.Token("ref_close", "a", -1);
    resolveRefLater(this.state, {
      open,
      content,
      close
    }, {
      kind: "eq",
      label: data.content
    }, {
      kind: TargetKind$1.equation,
      contentFromTarget: target => {
        return `(${target.number})`;
      }
    });
    return [open, content, close];
  }

}
class NumRef extends Role {
  run(data) {
    const match = REF_PATTERN.exec(data.content);
    const [, modified, ref] = match !== null && match !== void 0 ? match : [];
    const withoutLabel = modified === null || modified === void 0 ? void 0 : modified.trim();
    const open = new this.state.Token("ref_open", "a", 1);
    const content = new this.state.Token("text", "", 0);
    const close = new this.state.Token("ref_close", "a", -1);
    resolveRefLater(this.state, {
      open,
      content,
      close
    }, {
      kind: "numref",
      label: ref || data.content,
      value: withoutLabel
    }, {
      contentFromTarget: target => {
        if (!match) return target.title.trim();
        return withoutLabel.replace(/%s/g, String(target.number)).replace(/\{number\}/g, String(target.number));
      }
    });
    return [open, content, close];
  }

}
class Ref extends Role {
  run(data) {
    const match = REF_PATTERN.exec(data.content);
    const [, modified, ref] = match !== null && match !== void 0 ? match : [];
    const withoutLabel = modified === null || modified === void 0 ? void 0 : modified.trim();
    const open = new this.state.Token("ref_open", "a", 1);
    const content = new this.state.Token("text", "", 0);
    const close = new this.state.Token("ref_close", "a", -1);
    resolveRefLater(this.state, {
      open,
      content,
      close
    }, {
      kind: "ref",
      label: ref || data.content,
      value: withoutLabel
    }, {
      contentFromTarget: target => {
        return withoutLabel || target.title;
      }
    });
    return [open, content, close];
  }

}
const references = {
  eq: Eq,
  ref: Ref,
  numref: NumRef
};

const rolesDefault = Object.assign(Object.assign(Object.assign(Object.assign({}, main), html$5), math$2), references);

/*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT */
function isNothing(subject) {
  return typeof subject === 'undefined' || subject === null;
}

function isObject$1(subject) {
  return typeof subject === 'object' && subject !== null;
}

function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;else if (isNothing(sequence)) return [];
  return [sequence];
}

function extend$1(target, source) {
  var index, length, key, sourceKeys;

  if (source) {
    sourceKeys = Object.keys(source);

    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }

  return target;
}

function repeat(string, count) {
  var result = '',
      cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}

function isNegativeZero(number) {
  return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}

var isNothing_1 = isNothing;
var isObject_1 = isObject$1;
var toArray_1 = toArray;
var repeat_1 = repeat;
var isNegativeZero_1 = isNegativeZero;
var extend_1 = extend$1;
var common = {
  isNothing: isNothing_1,
  isObject: isObject_1,
  toArray: toArray_1,
  repeat: repeat_1,
  isNegativeZero: isNegativeZero_1,
  extend: extend_1
}; // YAML error class. http://stackoverflow.com/questions/8458984

function formatError(exception, compact) {
  var where = '',
      message = exception.reason || '(unknown reason)';
  if (!exception.mark) return message;

  if (exception.mark.name) {
    where += 'in "' + exception.mark.name + '" ';
  }

  where += '(' + (exception.mark.line + 1) + ':' + (exception.mark.column + 1) + ')';

  if (!compact && exception.mark.snippet) {
    where += '\n\n' + exception.mark.snippet;
  }

  return message + ' ' + where;
}

function YAMLException$1(reason, mark) {
  // Super constructor
  Error.call(this);
  this.name = 'YAMLException';
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false); // Include stack trace in error object

  if (Error.captureStackTrace) {
    // Chrome and NodeJS
    Error.captureStackTrace(this, this.constructor);
  } else {
    // FF, IE 10+ and Safari 6+. Fallback for others
    this.stack = new Error().stack || '';
  }
} // Inherit from Error


YAMLException$1.prototype = Object.create(Error.prototype);
YAMLException$1.prototype.constructor = YAMLException$1;

YAMLException$1.prototype.toString = function toString(compact) {
  return this.name + ': ' + formatError(this, compact);
};

var exception = YAMLException$1; // get snippet for a single line, respecting maxLength

function getLine$1(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = '';
  var tail = '';
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;

  if (position - lineStart > maxHalfLength) {
    head = ' ... ';
    lineStart = position - maxHalfLength + head.length;
  }

  if (lineEnd - position > maxHalfLength) {
    tail = ' ...';
    lineEnd = position + maxHalfLength - tail.length;
  }

  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, '→') + tail,
    pos: position - lineStart + head.length // relative position

  };
}

function padStart(string, max) {
  return common.repeat(' ', max - string.length) + string;
}

function makeSnippet(mark, options) {
  options = Object.create(options || null);
  if (!mark.buffer) return null;
  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent !== 'number') options.indent = 1;
  if (typeof options.linesBefore !== 'number') options.linesBefore = 3;
  if (typeof options.linesAfter !== 'number') options.linesAfter = 2;
  var re = /\r?\n|\r|\0/g;
  var lineStarts = [0];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;

  while (match = re.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);

    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }

  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  var result = '',
      i,
      line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);

  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine$1(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
    result = common.repeat(' ', options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + ' | ' + line.str + '\n' + result;
  }

  line = getLine$1(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common.repeat(' ', options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + ' | ' + line.str + '\n';
  result += common.repeat('-', options.indent + lineNoLength + 3 + line.pos) + '^' + '\n';

  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine$1(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
    result += common.repeat(' ', options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + ' | ' + line.str + '\n';
  }

  return result.replace(/\n$/, '');
}

var snippet = makeSnippet;
var TYPE_CONSTRUCTOR_OPTIONS = ['kind', 'multi', 'resolve', 'construct', 'instanceOf', 'predicate', 'represent', 'representName', 'defaultStyle', 'styleAliases'];
var YAML_NODE_KINDS = ['scalar', 'sequence', 'mapping'];

function compileStyleAliases(map) {
  var result = {};

  if (map !== null) {
    Object.keys(map).forEach(function (style) {
      map[style].forEach(function (alias) {
        result[String(alias)] = style;
      });
    });
  }

  return result;
}

function Type$1(tag, options) {
  options = options || {};
  Object.keys(options).forEach(function (name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  }); // TODO: Add tag format check.

  this.options = options; // keep original options in case user wants to extend this type later

  this.tag = tag;
  this.kind = options['kind'] || null;

  this.resolve = options['resolve'] || function () {
    return true;
  };

  this.construct = options['construct'] || function (data) {
    return data;
  };

  this.instanceOf = options['instanceOf'] || null;
  this.predicate = options['predicate'] || null;
  this.represent = options['represent'] || null;
  this.representName = options['representName'] || null;
  this.defaultStyle = options['defaultStyle'] || null;
  this.multi = options['multi'] || false;
  this.styleAliases = compileStyleAliases(options['styleAliases'] || null);

  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}

var type$1 = Type$1;
/*eslint-disable max-len*/

function compileList(schema, name) {
  var result = [];
  schema[name].forEach(function (currentType) {
    var newIndex = result.length;
    result.forEach(function (previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
        newIndex = previousIndex;
      }
    });
    result[newIndex] = currentType;
  });
  return result;
}

function
  /* lists... */
compileMap() {
  var result = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  },
      index,
      length;

  function collectType(type) {
    if (type.multi) {
      result.multi[type.kind].push(type);
      result.multi['fallback'].push(type);
    } else {
      result[type.kind][type.tag] = result['fallback'][type.tag] = type;
    }
  }

  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }

  return result;
}

function Schema$1(definition) {
  return this.extend(definition);
}

Schema$1.prototype.extend = function extend(definition) {
  var implicit = [];
  var explicit = [];

  if (definition instanceof type$1) {
    // Schema.extend(type)
    explicit.push(definition);
  } else if (Array.isArray(definition)) {
    // Schema.extend([ type1, type2, ... ])
    explicit = explicit.concat(definition);
  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    // Schema.extend({ explicit: [ type1, type2, ... ], implicit: [ type1, type2, ... ] })
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);
  } else {
    throw new exception('Schema.extend argument should be a Type, [ Type ], ' + 'or a schema definition ({ implicit: [...], explicit: [...] })');
  }

  implicit.forEach(function (type$1$1) {
    if (!(type$1$1 instanceof type$1)) {
      throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }

    if (type$1$1.loadKind && type$1$1.loadKind !== 'scalar') {
      throw new exception('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
    }

    if (type$1$1.multi) {
      throw new exception('There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.');
    }
  });
  explicit.forEach(function (type$1$1) {
    if (!(type$1$1 instanceof type$1)) {
      throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }
  });
  var result = Object.create(Schema$1.prototype);
  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);
  result.compiledImplicit = compileList(result, 'implicit');
  result.compiledExplicit = compileList(result, 'explicit');
  result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
  return result;
};

var schema = Schema$1;
var str = new type$1('tag:yaml.org,2002:str', {
  kind: 'scalar',
  construct: function (data) {
    return data !== null ? data : '';
  }
});
var seq = new type$1('tag:yaml.org,2002:seq', {
  kind: 'sequence',
  construct: function (data) {
    return data !== null ? data : [];
  }
});
var map$2 = new type$1('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct: function (data) {
    return data !== null ? data : {};
  }
});
var failsafe = new schema({
  explicit: [str, seq, map$2]
});

function resolveYamlNull(data) {
  if (data === null) return true;
  var max = data.length;
  return max === 1 && data === '~' || max === 4 && (data === 'null' || data === 'Null' || data === 'NULL');
}

function constructYamlNull() {
  return null;
}

function isNull(object) {
  return object === null;
}

var _null = new type$1('tag:yaml.org,2002:null', {
  kind: 'scalar',
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function () {
      return '~';
    },
    lowercase: function () {
      return 'null';
    },
    uppercase: function () {
      return 'NULL';
    },
    camelcase: function () {
      return 'Null';
    },
    empty: function () {
      return '';
    }
  },
  defaultStyle: 'lowercase'
});

function resolveYamlBoolean(data) {
  if (data === null) return false;
  var max = data.length;
  return max === 4 && (data === 'true' || data === 'True' || data === 'TRUE') || max === 5 && (data === 'false' || data === 'False' || data === 'FALSE');
}

function constructYamlBoolean(data) {
  return data === 'true' || data === 'True' || data === 'TRUE';
}

function isBoolean(object) {
  return Object.prototype.toString.call(object) === '[object Boolean]';
}

var bool = new type$1('tag:yaml.org,2002:bool', {
  kind: 'scalar',
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function (object) {
      return object ? 'true' : 'false';
    },
    uppercase: function (object) {
      return object ? 'TRUE' : 'FALSE';
    },
    camelcase: function (object) {
      return object ? 'True' : 'False';
    }
  },
  defaultStyle: 'lowercase'
});

function isHexCode(c) {
  return 0x30
  /* 0 */
  <= c && c <= 0x39
  /* 9 */
  || 0x41
  /* A */
  <= c && c <= 0x46
  /* F */
  || 0x61
  /* a */
  <= c && c <= 0x66
  /* f */
  ;
}

function isOctCode(c) {
  return 0x30
  /* 0 */
  <= c && c <= 0x37
  /* 7 */
  ;
}

function isDecCode(c) {
  return 0x30
  /* 0 */
  <= c && c <= 0x39
  /* 9 */
  ;
}

function resolveYamlInteger(data) {
  if (data === null) return false;
  var max = data.length,
      index = 0,
      hasDigits = false,
      ch;
  if (!max) return false;
  ch = data[index]; // sign

  if (ch === '-' || ch === '+') {
    ch = data[++index];
  }

  if (ch === '0') {
    // 0
    if (index + 1 === max) return true;
    ch = data[++index]; // base 2, base 8, base 16

    if (ch === 'b') {
      // base 2
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (ch !== '0' && ch !== '1') return false;
        hasDigits = true;
      }

      return hasDigits && ch !== '_';
    }

    if (ch === 'x') {
      // base 16
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }

      return hasDigits && ch !== '_';
    }

    if (ch === 'o') {
      // base 8
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }

      return hasDigits && ch !== '_';
    }
  } // base 10 (except 0)
  // value should not start with `_`;


  if (ch === '_') return false;

  for (; index < max; index++) {
    ch = data[index];
    if (ch === '_') continue;

    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }

    hasDigits = true;
  } // Should have digits and should not end with `_`


  if (!hasDigits || ch === '_') return false;
  return true;
}

function constructYamlInteger(data) {
  var value = data,
      sign = 1,
      ch;

  if (value.indexOf('_') !== -1) {
    value = value.replace(/_/g, '');
  }

  ch = value[0];

  if (ch === '-' || ch === '+') {
    if (ch === '-') sign = -1;
    value = value.slice(1);
    ch = value[0];
  }

  if (value === '0') return 0;

  if (ch === '0') {
    if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
    if (value[1] === 'x') return sign * parseInt(value.slice(2), 16);
    if (value[1] === 'o') return sign * parseInt(value.slice(2), 8);
  }

  return sign * parseInt(value, 10);
}

function isInteger(object) {
  return Object.prototype.toString.call(object) === '[object Number]' && object % 1 === 0 && !common.isNegativeZero(object);
}

var int$2 = new type$1('tag:yaml.org,2002:int', {
  kind: 'scalar',
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary: function (obj) {
      return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1);
    },
    octal: function (obj) {
      return obj >= 0 ? '0o' + obj.toString(8) : '-0o' + obj.toString(8).slice(1);
    },
    decimal: function (obj) {
      return obj.toString(10);
    },

    /* eslint-disable max-len */
    hexadecimal: function (obj) {
      return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() : '-0x' + obj.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: 'decimal',
  styleAliases: {
    binary: [2, 'bin'],
    octal: [8, 'oct'],
    decimal: [10, 'dec'],
    hexadecimal: [16, 'hex']
  }
});
var YAML_FLOAT_PATTERN = new RegExp( // 2.5e4, 2.5 and integers
'^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' + // .2e4, .2
// special case, seems not from spec
'|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' + // .inf
'|[-+]?\\.(?:inf|Inf|INF)' + // .nan
'|\\.(?:nan|NaN|NAN))$');

function resolveYamlFloat(data) {
  if (data === null) return false;

  if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  data[data.length - 1] === '_') {
    return false;
  }

  return true;
}

function constructYamlFloat(data) {
  var value, sign;
  value = data.replace(/_/g, '').toLowerCase();
  sign = value[0] === '-' ? -1 : 1;

  if ('+-'.indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }

  if (value === '.inf') {
    return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if (value === '.nan') {
    return NaN;
  }

  return sign * parseFloat(value, 10);
}

var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

function representYamlFloat(object, style) {
  var res;

  if (isNaN(object)) {
    switch (style) {
      case 'lowercase':
        return '.nan';

      case 'uppercase':
        return '.NAN';

      case 'camelcase':
        return '.NaN';
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase':
        return '.inf';

      case 'uppercase':
        return '.INF';

      case 'camelcase':
        return '.Inf';
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase':
        return '-.inf';

      case 'uppercase':
        return '-.INF';

      case 'camelcase':
        return '-.Inf';
    }
  } else if (common.isNegativeZero(object)) {
    return '-0.0';
  }

  res = object.toString(10); // JS stringifier can build scientific format without dots: 5e-100,
  // while YAML requres dot: 5.e-100. Fix it with simple hack

  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
}

function isFloat(object) {
  return Object.prototype.toString.call(object) === '[object Number]' && (object % 1 !== 0 || common.isNegativeZero(object));
}

var float = new type$1('tag:yaml.org,2002:float', {
  kind: 'scalar',
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: 'lowercase'
});
var json = failsafe.extend({
  implicit: [_null, bool, int$2, float]
});
var core$1 = json;
var YAML_DATE_REGEXP = new RegExp('^([0-9][0-9][0-9][0-9])' + // [1] year
'-([0-9][0-9])' + // [2] month
'-([0-9][0-9])$'); // [3] day

var YAML_TIMESTAMP_REGEXP = new RegExp('^([0-9][0-9][0-9][0-9])' + // [1] year
'-([0-9][0-9]?)' + // [2] month
'-([0-9][0-9]?)' + // [3] day
'(?:[Tt]|[ \\t]+)' + // ...
'([0-9][0-9]?)' + // [4] hour
':([0-9][0-9])' + // [5] minute
':([0-9][0-9])' + // [6] second
'(?:\\.([0-9]*))?' + // [7] fraction
'(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
'(?::([0-9][0-9]))?))?$'); // [11] tz_minute

function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}

function constructYamlTimestamp(data) {
  var match,
      year,
      month,
      day,
      hour,
      minute,
      second,
      fraction = 0,
      delta = null,
      tz_hour,
      tz_minute,
      date;
  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
  if (match === null) throw new Error('Date resolve error'); // match: [1] year [2] month [3] day

  year = +match[1];
  month = +match[2] - 1; // JS month starts with 0

  day = +match[3];

  if (!match[4]) {
    // no hour
    return new Date(Date.UTC(year, month, day));
  } // match: [4] hour [5] minute [6] second [7] fraction


  hour = +match[4];
  minute = +match[5];
  second = +match[6];

  if (match[7]) {
    fraction = match[7].slice(0, 3);

    while (fraction.length < 3) {
      // milli-seconds
      fraction += '0';
    }

    fraction = +fraction;
  } // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute


  if (match[9]) {
    tz_hour = +match[10];
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds

    if (match[9] === '-') delta = -delta;
  }

  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (delta) date.setTime(date.getTime() - delta);
  return date;
}

function representYamlTimestamp(object
/*, style*/
) {
  return object.toISOString();
}

var timestamp = new type$1('tag:yaml.org,2002:timestamp', {
  kind: 'scalar',
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});

function resolveYamlMerge(data) {
  return data === '<<' || data === null;
}

var merge$1 = new type$1('tag:yaml.org,2002:merge', {
  kind: 'scalar',
  resolve: resolveYamlMerge
});
/*eslint-disable no-bitwise*/
// [ 64, 65, 66 ] -> [ padding, CR, LF ]

var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';

function resolveYamlBinary(data) {
  if (data === null) return false;
  var code,
      idx,
      bitlen = 0,
      max = data.length,
      map = BASE64_MAP; // Convert one by one.

  for (idx = 0; idx < max; idx++) {
    code = map.indexOf(data.charAt(idx)); // Skip CR/LF

    if (code > 64) continue; // Fail on illegal characters

    if (code < 0) return false;
    bitlen += 6;
  } // If there are any bits left, source was corrupted


  return bitlen % 8 === 0;
}

function constructYamlBinary(data) {
  var idx,
      tailbits,
      input = data.replace(/[\r\n=]/g, ''),
      // remove CR/LF & padding to simplify scan
  max = input.length,
      map = BASE64_MAP,
      bits = 0,
      result = []; // Collect by 6*4 bits (3 bytes)

  for (idx = 0; idx < max; idx++) {
    if (idx % 4 === 0 && idx) {
      result.push(bits >> 16 & 0xFF);
      result.push(bits >> 8 & 0xFF);
      result.push(bits & 0xFF);
    }

    bits = bits << 6 | map.indexOf(input.charAt(idx));
  } // Dump tail


  tailbits = max % 4 * 6;

  if (tailbits === 0) {
    result.push(bits >> 16 & 0xFF);
    result.push(bits >> 8 & 0xFF);
    result.push(bits & 0xFF);
  } else if (tailbits === 18) {
    result.push(bits >> 10 & 0xFF);
    result.push(bits >> 2 & 0xFF);
  } else if (tailbits === 12) {
    result.push(bits >> 4 & 0xFF);
  }

  return new Uint8Array(result);
}

function representYamlBinary(object
/*, style*/
) {
  var result = '',
      bits = 0,
      idx,
      tail,
      max = object.length,
      map = BASE64_MAP; // Convert every three bytes to 4 ASCII characters.

  for (idx = 0; idx < max; idx++) {
    if (idx % 3 === 0 && idx) {
      result += map[bits >> 18 & 0x3F];
      result += map[bits >> 12 & 0x3F];
      result += map[bits >> 6 & 0x3F];
      result += map[bits & 0x3F];
    }

    bits = (bits << 8) + object[idx];
  } // Dump tail


  tail = max % 3;

  if (tail === 0) {
    result += map[bits >> 18 & 0x3F];
    result += map[bits >> 12 & 0x3F];
    result += map[bits >> 6 & 0x3F];
    result += map[bits & 0x3F];
  } else if (tail === 2) {
    result += map[bits >> 10 & 0x3F];
    result += map[bits >> 4 & 0x3F];
    result += map[bits << 2 & 0x3F];
    result += map[64];
  } else if (tail === 1) {
    result += map[bits >> 2 & 0x3F];
    result += map[bits << 4 & 0x3F];
    result += map[64];
    result += map[64];
  }

  return result;
}

function isBinary(obj) {
  return Object.prototype.toString.call(obj) === '[object Uint8Array]';
}

var binary = new type$1('tag:yaml.org,2002:binary', {
  kind: 'scalar',
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2 = Object.prototype.toString;

function resolveYamlOmap(data) {
  if (data === null) return true;
  var objectKeys = [],
      index,
      length,
      pair,
      pairKey,
      pairHasKey,
      object = data;

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;
    if (_toString$2.call(pair) !== '[object Object]') return false;

    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;else return false;
      }
    }

    if (!pairHasKey) return false;
    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);else return false;
  }

  return true;
}

function constructYamlOmap(data) {
  return data !== null ? data : [];
}

var omap = new type$1('tag:yaml.org,2002:omap', {
  kind: 'sequence',
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});
var _toString$1 = Object.prototype.toString;

function resolveYamlPairs(data) {
  if (data === null) return true;
  var index,
      length,
      pair,
      keys,
      result,
      object = data;
  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    if (_toString$1.call(pair) !== '[object Object]') return false;
    keys = Object.keys(pair);
    if (keys.length !== 1) return false;
    result[index] = [keys[0], pair[keys[0]]];
  }

  return true;
}

function constructYamlPairs(data) {
  if (data === null) return [];
  var index,
      length,
      pair,
      keys,
      result,
      object = data;
  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    keys = Object.keys(pair);
    result[index] = [keys[0], pair[keys[0]]];
  }

  return result;
}

var pairs = new type$1('tag:yaml.org,2002:pairs', {
  kind: 'sequence',
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});
var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;

function resolveYamlSet(data) {
  if (data === null) return true;
  var key,
      object = data;

  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data) {
  return data !== null ? data : {};
}

var set = new type$1('tag:yaml.org,2002:set', {
  kind: 'mapping',
  resolve: resolveYamlSet,
  construct: constructYamlSet
});

var _default$1 = core$1.extend({
  implicit: [timestamp, merge$1],
  explicit: [binary, omap, pairs, set]
});
/*eslint-disable max-len,no-use-before-define*/


var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;

function _class$1(obj) {
  return Object.prototype.toString.call(obj);
}

function is_EOL(c) {
  return c === 0x0A
  /* LF */
  || c === 0x0D
  /* CR */
  ;
}

function is_WHITE_SPACE(c) {
  return c === 0x09
  /* Tab */
  || c === 0x20
  /* Space */
  ;
}

function is_WS_OR_EOL(c) {
  return c === 0x09
  /* Tab */
  || c === 0x20
  /* Space */
  || c === 0x0A
  /* LF */
  || c === 0x0D
  /* CR */
  ;
}

function is_FLOW_INDICATOR(c) {
  return c === 0x2C
  /* , */
  || c === 0x5B
  /* [ */
  || c === 0x5D
  /* ] */
  || c === 0x7B
  /* { */
  || c === 0x7D
  /* } */
  ;
}

function fromHexCode(c) {
  var lc;

  if (0x30
  /* 0 */
  <= c && c <= 0x39
  /* 9 */
  ) {
    return c - 0x30;
  }
  /*eslint-disable no-bitwise*/


  lc = c | 0x20;

  if (0x61
  /* a */
  <= lc && lc <= 0x66
  /* f */
  ) {
    return lc - 0x61 + 10;
  }

  return -1;
}

function escapedHexLen(c) {
  if (c === 0x78
  /* x */
  ) {
    return 2;
  }

  if (c === 0x75
  /* u */
  ) {
    return 4;
  }

  if (c === 0x55
  /* U */
  ) {
    return 8;
  }

  return 0;
}

function fromDecimalCode(c) {
  if (0x30
  /* 0 */
  <= c && c <= 0x39
  /* 9 */
  ) {
    return c - 0x30;
  }

  return -1;
}

function simpleEscapeSequence(c) {
  /* eslint-disable indent */
  return c === 0x30
  /* 0 */
  ? '\x00' : c === 0x61
  /* a */
  ? '\x07' : c === 0x62
  /* b */
  ? '\x08' : c === 0x74
  /* t */
  ? '\x09' : c === 0x09
  /* Tab */
  ? '\x09' : c === 0x6E
  /* n */
  ? '\x0A' : c === 0x76
  /* v */
  ? '\x0B' : c === 0x66
  /* f */
  ? '\x0C' : c === 0x72
  /* r */
  ? '\x0D' : c === 0x65
  /* e */
  ? '\x1B' : c === 0x20
  /* Space */
  ? ' ' : c === 0x22
  /* " */
  ? '\x22' : c === 0x2F
  /* / */
  ? '/' : c === 0x5C
  /* \ */
  ? '\x5C' : c === 0x4E
  /* N */
  ? '\x85' : c === 0x5F
  /* _ */
  ? '\xA0' : c === 0x4C
  /* L */
  ? '\u2028' : c === 0x50
  /* P */
  ? '\u2029' : '';
}

function charFromCodepoint(c) {
  if (c <= 0xFFFF) {
    return String.fromCharCode(c);
  } // Encode UTF-16 surrogate pair
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF


  return String.fromCharCode((c - 0x010000 >> 10) + 0xD800, (c - 0x010000 & 0x03FF) + 0xDC00);
}

var simpleEscapeCheck = new Array(256); // integer, for fast access

var simpleEscapeMap = new Array(256);

for (var i$1 = 0; i$1 < 256; i$1++) {
  simpleEscapeCheck[i$1] = simpleEscapeSequence(i$1) ? 1 : 0;
  simpleEscapeMap[i$1] = simpleEscapeSequence(i$1);
}

function State$1(input, options) {
  this.input = input;
  this.filename = options['filename'] || null;
  this.schema = options['schema'] || _default$1;
  this.onWarning = options['onWarning'] || null; // (Hidden) Remove? makes the loader to expect YAML 1.1 documents
  // if such documents have no explicit %YAML directive

  this.legacy = options['legacy'] || false;
  this.json = options['json'] || false;
  this.listener = options['listener'] || null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;
  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0; // position of first leading tab in the current line,
  // used to make sure there are no tabs in the indentation

  this.firstTabInLine = -1;
  this.documents = [];
  /*
  this.version;
  this.checkLineBreaks;
  this.tagMap;
  this.anchorMap;
  this.tag;
  this.anchor;
  this.kind;
  this.result;*/
}

function generateError(state, message) {
  var mark = {
    name: state.filename,
    buffer: state.input.slice(0, -1),
    // omit trailing \0
    position: state.position,
    line: state.line,
    column: state.position - state.lineStart
  };
  mark.snippet = snippet(mark);
  return new exception(message, mark);
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}

var directiveHandlers = {
  YAML: function handleYamlDirective(state, name, args) {
    var match, major, minor;

    if (state.version !== null) {
      throwError(state, 'duplication of %YAML directive');
    }

    if (args.length !== 1) {
      throwError(state, 'YAML directive accepts exactly one argument');
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (match === null) {
      throwError(state, 'ill-formed argument of the YAML directive');
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (major !== 1) {
      throwError(state, 'unacceptable YAML version of the document');
    }

    state.version = args[0];
    state.checkLineBreaks = minor < 2;

    if (minor !== 1 && minor !== 2) {
      throwWarning(state, 'unsupported YAML version of the document');
    }
  },
  TAG: function handleTagDirective(state, name, args) {
    var handle, prefix;

    if (args.length !== 2) {
      throwError(state, 'TAG directive accepts exactly two arguments');
    }

    handle = args[0];
    prefix = args[1];

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
    }

    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
    }

    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, 'tag prefix is malformed: ' + prefix);
    }

    state.tagMap[handle] = prefix;
  }
};

function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);

        if (!(_character === 0x09 || 0x20 <= _character && _character <= 0x10FFFF)) {
          throwError(state, 'expected valid JSON character');
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, 'the stream contains non-printable characters');
    }

    state.result += _result;
  }
}

function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;

  if (!common.isObject(source)) {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
  }

  sourceKeys = Object.keys(source);

  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty$1.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}

function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
  var index, quantity; // The output is a plain object here, so keys can only be strings.
  // We need to convert keyNode to a string, but doing so can hang the process
  // (deeply nested arrays that explode exponentially using aliases).

  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);

    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, 'nested arrays are not supported inside keys');
      }

      if (typeof keyNode === 'object' && _class$1(keyNode[index]) === '[object Object]') {
        keyNode[index] = '[object Object]';
      }
    }
  } // Avoid code execution in load() via toString property
  // (still use its own toString for arrays, timestamps,
  // and whatever user schema extensions happen to have @@toStringTag)


  if (typeof keyNode === 'object' && _class$1(keyNode) === '[object Object]') {
    keyNode = '[object Object]';
  }

  keyNode = String(keyNode);

  if (_result === null) {
    _result = {};
  }

  if (keyTag === 'tag:yaml.org,2002:merge') {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, 'duplicated mapping key');
    } // used for this specific key only because Object.defineProperty is slow


    if (keyNode === '__proto__') {
      Object.defineProperty(_result, keyNode, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: valueNode
      });
    } else {
      _result[keyNode] = valueNode;
    }

    delete overridableKeys[keyNode];
  }

  return _result;
}

function readLineBreak(state) {
  var ch;
  ch = state.input.charCodeAt(state.position);

  if (ch === 0x0A
  /* LF */
  ) {
    state.position++;
  } else if (ch === 0x0D
  /* CR */
  ) {
    state.position++;

    if (state.input.charCodeAt(state.position) === 0x0A
    /* LF */
    ) {
      state.position++;
    }
  } else {
    throwError(state, 'a line break is expected');
  }

  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0,
      ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 0x09
      /* Tab */
      && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }

      ch = state.input.charCodeAt(++state.position);
    }

    if (allowComments && ch === 0x23
    /* # */
    ) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0x0A
      /* LF */
      && ch !== 0x0D
      /* CR */
      && ch !== 0);
    }

    if (is_EOL(ch)) {
      readLineBreak(state);
      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;

      while (ch === 0x20
      /* Space */
      ) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }

  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, 'deficient indentation');
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var _position = state.position,
      ch;
  ch = state.input.charCodeAt(_position); // Condition state.position === state.lineStart is tested
  // in parent on each call, for efficiency. No needs to test here again.

  if ((ch === 0x2D
  /* - */
  || ch === 0x2E
  /* . */
  ) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
    _position += 3;
    ch = state.input.charCodeAt(_position);

    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += ' ';
  } else if (count > 1) {
    state.result += common.repeat('\n', count - 1);
  }
}

function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind = state.kind,
      _result = state.result,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 0x23
  /* # */
  || ch === 0x26
  /* & */
  || ch === 0x2A
  /* * */
  || ch === 0x21
  /* ! */
  || ch === 0x7C
  /* | */
  || ch === 0x3E
  /* > */
  || ch === 0x27
  /* ' */
  || ch === 0x22
  /* " */
  || ch === 0x25
  /* % */
  || ch === 0x40
  /* @ */
  || ch === 0x60
  /* ` */
  ) {
    return false;
  }

  if (ch === 0x3F
  /* ? */
  || ch === 0x2D
  /* - */
  ) {
    following = state.input.charCodeAt(state.position + 1);

    if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }

  state.kind = 'scalar';
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (ch !== 0) {
    if (ch === 0x3A
    /* : */
    ) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }
    } else if (ch === 0x23
    /* # */
    ) {
      preceding = state.input.charCodeAt(state.position - 1);

      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;
    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }

    ch = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) {
    return true;
  }

  state.kind = _kind;
  state.result = _result;
  return false;
}

function readSingleQuotedScalar(state, nodeIndent) {
  var ch, captureStart, captureEnd;
  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x27
  /* ' */
  ) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x27
    /* ' */
    ) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x27
      /* ' */
      ) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar');
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x22
  /* " */
  ) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x22
    /* " */
    ) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    } else if (ch === 0x5C
    /* \ */
    ) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent); // TODO: rework to inline fn with no type cast?
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;

        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);

          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, 'expected hexadecimal character');
          }
        }

        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else {
        throwError(state, 'unknown escape sequence');
      }

      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar');
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var readNext = true,
      _line,
      _lineStart,
      _pos,
      _tag = state.tag,
      _result,
      _anchor = state.anchor,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      overridableKeys = Object.create(null),
      keyNode,
      keyTag,
      valueNode,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x5B
  /* [ */
  ) {
    terminator = 0x5D;
    /* ] */

    isMapping = false;
    _result = [];
  } else if (ch === 0x7B
  /* { */
  ) {
    terminator = 0x7D;
    /* } */

    isMapping = true;
    _result = {};
  } else {
    return false;
  }

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(++state.position);

  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);

    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? 'mapping' : 'sequence';
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries');
    } else if (ch === 0x2C
    /* , */
    ) {
      // "flow collection entries can never be completely empty", as per YAML 1.2, section 7.4
      throwError(state, "expected the node content, but found ','");
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (ch === 0x3F
    /* ? */
    ) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    _line = state.line; // Save the current line.

    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);

    if ((isExplicitPair || state.line === _line) && ch === 0x3A
    /* : */
    ) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);

    if (ch === 0x2C
    /* , */
    ) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart,
      folding,
      chomping = CHOMPING_CLIP,
      didReadContent = false,
      detectedIndent = false,
      textIndent = nodeIndent,
      emptyLines = 0,
      atMoreIndented = false,
      tmp,
      ch;
  ch = state.input.charCodeAt(state.position);

  if (ch === 0x7C
  /* | */
  ) {
    folding = false;
  } else if (ch === 0x3E
  /* > */
  ) {
    folding = true;
  } else {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';

  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);

    if (ch === 0x2B
    /* + */
    || ch === 0x2D
    /* - */
    ) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 0x2B
        /* + */
        ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, 'repeat of a chomping mode identifier');
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, 'repeat of an indentation width identifier');
      }
    } else {
      break;
    }
  }

  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));

    if (ch === 0x23
    /* # */
    ) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }

  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;
    ch = state.input.charCodeAt(state.position);

    while ((!detectedIndent || state.lineIndent < textIndent) && ch === 0x20
    /* Space */
    ) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    } // End of the scalar.


    if (state.lineIndent < textIndent) {
      // Perform the chomping.
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          // i.e. only if the scalar is not empty.
          state.result += '\n';
        }
      } // Break this `while` cycle and go to the funciton's epilogue.


      break;
    } // Folded style: use fancy rules to handle line breaks.


    if (folding) {
      // Lines starting with white space characters (more-indented lines) are not folded.
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true; // except for the first content line (cf. Example 8.1)

        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines); // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat('\n', emptyLines + 1); // Just one line break - perceive as the same line.
      } else if (emptyLines === 0) {
        if (didReadContent) {
          // i.e. only if we have already read some scalar content.
          state.result += ' ';
        } // Several line breaks - perceive as different lines.

      } else {
        state.result += common.repeat('\n', emptyLines);
      } // Literal style: just add exact number of line breaks between content lines.

    } else {
      // Keep all line breaks except the header line break.
      state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
    }

    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line,
      _tag = state.tag,
      _anchor = state.anchor,
      _result = [],
      following,
      detected = false,
      ch; // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar


  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    if (ch !== 0x2D
    /* - */
    ) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (!is_WS_OR_EOL(following)) {
      break;
    }

    detected = true;
    state.position++;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);

        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);

    _result.push(state.result);

    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);

    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, 'bad indentation of a sequence entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'sequence';
    state.result = _result;
    return true;
  }

  return false;
}

function readBlockMapping(state, nodeIndent, flowIndent) {
  var following,
      allowCompact,
      _line,
      _keyLine,
      _keyLineStart,
      _keyPos,
      _tag = state.tag,
      _anchor = state.anchor,
      _result = {},
      overridableKeys = Object.create(null),
      keyTag = null,
      keyNode = null,
      valueNode = null,
      atExplicitKey = false,
      detected = false,
      ch; // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar


  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    following = state.input.charCodeAt(state.position + 1);
    _line = state.line; // Save the current line.
    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //

    if ((ch === 0x3F
    /* ? */
    || ch === 0x3A
    /* : */
    ) && is_WS_OR_EOL(following)) {
      if (ch === 0x3F
      /* ? */
      ) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        // i.e. 0x3A/* : */ === character after the explicit key.
        atExplicitKey = false;
        allowCompact = true;
      } else {
        throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
      }

      state.position += 1;
      ch = following; //
      // Implicit notation case. Flow-style node as the key first, then ":", and the value.
      //
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;

      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        // Neither implicit nor explicit notation.
        // Reading is done. Go to the epilogue.
        break;
      }

      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);

        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (ch === 0x3A
        /* : */
        ) {
          ch = state.input.charCodeAt(++state.position);

          if (!is_WS_OR_EOL(ch)) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
          }

          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(state, 'can not read an implicit mapping pair; a colon is missed');
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true; // Keep the result of `composeNode`.
        }
      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');
      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true; // Keep the result of `composeNode`.
      }
    } //
    // Common reading code for both explicit and implicit notations.
    //


    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }

      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }

    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, 'bad indentation of a mapping entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  } //
  // Epilogue.
  //
  // Special case: last mapping's node contains only the key in explicit notation.


  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  } // Expose the resulting mapping.


  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'mapping';
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position,
      isVerbatim = false,
      isNamed = false,
      tagHandle,
      tagName,
      ch;

  ch = state.input.charCodeAt(state.position);
  if (ch !== 0x21
  /* ! */
  ) return false;

  if (state.tag !== null) {
    throwError(state, 'duplication of a tag property');
  }

  ch = state.input.charCodeAt(++state.position);

  if (ch === 0x3C
  /* < */
  ) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 0x21
  /* ! */
  ) {
    isNamed = true;
    tagHandle = '!!';
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = '!';
  }

  _position = state.position;

  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 0x3E
    /* > */
    );

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, 'unexpected end of the stream within a verbatim tag');
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 0x21
      /* ! */
      ) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, 'named tag handle cannot contain such characters');
          }

          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks');
        }
      }

      ch = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, 'tag suffix cannot contain flow indicator characters');
    }
  }

  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, 'tag name cannot contain such characters: ' + tagName);
  }

  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, 'tag name is malformed: ' + tagName);
  }

  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === '!') {
    state.tag = '!' + tagName;
  } else if (tagHandle === '!!') {
    state.tag = 'tag:yaml.org,2002:' + tagName;
  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }

  return true;
}

function readAnchorProperty(state) {
  var _position, ch;

  ch = state.input.charCodeAt(state.position);
  if (ch !== 0x26
  /* & */
  ) return false;

  if (state.anchor !== null) {
    throwError(state, 'duplication of an anchor property');
  }

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an anchor node must contain at least one character');
  }

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias, ch;

  ch = state.input.charCodeAt(state.position);
  if (ch !== 0x2A
  /* * */
  ) return false;
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an alias node must contain at least one character');
  }

  alias = state.input.slice(_position, state.position);

  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      indentStatus = 1,
      // 1: this>parent, 0: this=parent, -1: this<parent
  atNewLine = false,
      hasContent = false,
      typeIndex,
      typeQuantity,
      typeList,
      type,
      flowIndent,
      blockIndent;

  if (state.listener !== null) {
    state.listener('open', state);
  }

  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;
  allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }

  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;

        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }

  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }

    blockIndent = state.position - state.lineStart;

    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;

          if (state.tag !== null || state.anchor !== null) {
            throwError(state, 'alias node should not have any properties');
          }
        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;

          if (state.tag === null) {
            state.tag = '?';
          }
        }

        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      // Special case: block sequences are allowed to have same indentation level as the parent.
      // http://www.yaml.org/spec/1.2/spec.html#id2799784
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }
  } else if (state.tag === '?') {
    // Implicit resolving is not allowed for non-scalar types, and '?'
    // non-specific tag is only automatically assigned to plain scalars.
    //
    // We only need to check kind conformity in case user explicitly assigns '?'
    // tag, for example like this: "!<?> [0]"
    //
    if (state.result !== null && state.kind !== 'scalar') {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }

    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type = state.implicitTypes[typeIndex];

      if (type.resolve(state.result)) {
        // `state.result` updated in resolver if matched
        state.result = type.construct(state.result);
        state.tag = type.tag;

        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }

        break;
      }
    }
  } else if (state.tag !== '!') {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
      type = state.typeMap[state.kind || 'fallback'][state.tag];
    } else {
      // looking for multi type
      type = null;
      typeList = state.typeMap.multi[state.kind || 'fallback'];

      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type = typeList[typeIndex];
          break;
        }
      }
    }

    if (!type) {
      throwError(state, 'unknown tag !<' + state.tag + '>');
    }

    if (state.result !== null && type.kind !== state.kind) {
      throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
    }

    if (!type.resolve(state.result, state.tag)) {
      // `state.result` updated in resolver if matched
      throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
    } else {
      state.result = type.construct(state.result, state.tag);

      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }

  if (state.listener !== null) {
    state.listener('close', state);
  }

  return state.tag !== null || state.anchor !== null || hasContent;
}

function readDocument(state) {
  var documentStart = state.position,
      _position,
      directiveName,
      directiveArgs,
      hasDirectives = false,
      ch;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = Object.create(null);
  state.anchorMap = Object.create(null);

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);

    if (state.lineIndent > 0 || ch !== 0x25
    /* % */
    ) {
      break;
    }

    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(state, 'directive name must not be less than one character in length');
    }

    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (ch === 0x23
      /* # */
      ) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));

        break;
      }

      if (is_EOL(ch)) break;
      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    if (ch !== 0) readLineBreak(state);

    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }

  skipSeparationSpace(state, true, -1);

  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 0x2D
  /* - */
  && state.input.charCodeAt(state.position + 1) === 0x2D
  /* - */
  && state.input.charCodeAt(state.position + 2) === 0x2D
  /* - */
  ) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected');
  }

  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
  }

  state.documents.push(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 0x2E
    /* . */
    ) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }

    return;
  }

  if (state.position < state.length - 1) {
    throwError(state, 'end of the stream or a document separator is expected');
  } else {
    return;
  }
}

function loadDocuments(input, options) {
  input = String(input);
  options = options || {};

  if (input.length !== 0) {
    // Add tailing `\n` if not exists
    if (input.charCodeAt(input.length - 1) !== 0x0A
    /* LF */
    && input.charCodeAt(input.length - 1) !== 0x0D
    /* CR */
    ) {
      input += '\n';
    } // Strip BOM


    if (input.charCodeAt(0) === 0xFEFF) {
      input = input.slice(1);
    }
  }

  var state = new State$1(input, options);
  var nullpos = input.indexOf('\0');

  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, 'null byte is not allowed in input');
  } // Use 0 as string terminator. That significantly simplifies bounds check.


  state.input += '\0';

  while (state.input.charCodeAt(state.position) === 0x20
  /* Space */
  ) {
    state.lineIndent += 1;
    state.position += 1;
  }

  while (state.position < state.length - 1) {
    readDocument(state);
  }

  return state.documents;
}

function loadAll$1(input, iterator, options) {
  if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
    options = iterator;
    iterator = null;
  }

  var documents = loadDocuments(input, options);

  if (typeof iterator !== 'function') {
    return documents;
  }

  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}

function load$1(input, options) {
  var documents = loadDocuments(input, options);

  if (documents.length === 0) {
    /*eslint-disable no-undefined*/
    return undefined;
  } else if (documents.length === 1) {
    return documents[0];
  }

  throw new exception('expected a single document in the stream, but found more');
}

var loadAll_1 = loadAll$1;
var load_1 = load$1;
var loader = {
  loadAll: loadAll_1,
  load: load_1
};
/*eslint-disable no-use-before-define*/

var _toString = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var CHAR_BOM = 0xFEFF;
var CHAR_TAB = 0x09;
/* Tab */

var CHAR_LINE_FEED = 0x0A;
/* LF */

var CHAR_CARRIAGE_RETURN = 0x0D;
/* CR */

var CHAR_SPACE = 0x20;
/* Space */

var CHAR_EXCLAMATION = 0x21;
/* ! */

var CHAR_DOUBLE_QUOTE = 0x22;
/* " */

var CHAR_SHARP = 0x23;
/* # */

var CHAR_PERCENT = 0x25;
/* % */

var CHAR_AMPERSAND = 0x26;
/* & */

var CHAR_SINGLE_QUOTE = 0x27;
/* ' */

var CHAR_ASTERISK = 0x2A;
/* * */

var CHAR_COMMA = 0x2C;
/* , */

var CHAR_MINUS = 0x2D;
/* - */

var CHAR_COLON = 0x3A;
/* : */

var CHAR_EQUALS = 0x3D;
/* = */

var CHAR_GREATER_THAN = 0x3E;
/* > */

var CHAR_QUESTION = 0x3F;
/* ? */

var CHAR_COMMERCIAL_AT = 0x40;
/* @ */

var CHAR_LEFT_SQUARE_BRACKET = 0x5B;
/* [ */

var CHAR_RIGHT_SQUARE_BRACKET = 0x5D;
/* ] */

var CHAR_GRAVE_ACCENT = 0x60;
/* ` */

var CHAR_LEFT_CURLY_BRACKET = 0x7B;
/* { */

var CHAR_VERTICAL_LINE = 0x7C;
/* | */

var CHAR_RIGHT_CURLY_BRACKET = 0x7D;
/* } */

var ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0x00] = '\\0';
ESCAPE_SEQUENCES[0x07] = '\\a';
ESCAPE_SEQUENCES[0x08] = '\\b';
ESCAPE_SEQUENCES[0x09] = '\\t';
ESCAPE_SEQUENCES[0x0A] = '\\n';
ESCAPE_SEQUENCES[0x0B] = '\\v';
ESCAPE_SEQUENCES[0x0C] = '\\f';
ESCAPE_SEQUENCES[0x0D] = '\\r';
ESCAPE_SEQUENCES[0x1B] = '\\e';
ESCAPE_SEQUENCES[0x22] = '\\"';
ESCAPE_SEQUENCES[0x5C] = '\\\\';
ESCAPE_SEQUENCES[0x85] = '\\N';
ESCAPE_SEQUENCES[0xA0] = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';
var DEPRECATED_BOOLEANS_SYNTAX = ['y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON', 'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'];
var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;

function compileStyleMap(schema, map) {
  var result, keys, index, length, tag, style, type;
  if (map === null) return {};
  result = {};
  keys = Object.keys(map);

  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map[tag]);

    if (tag.slice(0, 2) === '!!') {
      tag = 'tag:yaml.org,2002:' + tag.slice(2);
    }

    type = schema.compiledTypeMap['fallback'][tag];

    if (type && _hasOwnProperty.call(type.styleAliases, style)) {
      style = type.styleAliases[style];
    }

    result[tag] = style;
  }

  return result;
}

function encodeHex(character) {
  var string, handle, length;
  string = character.toString(16).toUpperCase();

  if (character <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (character <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (character <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new exception('code point within a string may not be greater than 0xFFFFFFFF');
  }

  return '\\' + handle + common.repeat('0', length - string.length) + string;
}

var QUOTING_TYPE_SINGLE = 1,
    QUOTING_TYPE_DOUBLE = 2;

function State$2(options) {
  this.schema = options['schema'] || _default$1;
  this.indent = Math.max(1, options['indent'] || 2);
  this.noArrayIndent = options['noArrayIndent'] || false;
  this.skipInvalid = options['skipInvalid'] || false;
  this.flowLevel = common.isNothing(options['flowLevel']) ? -1 : options['flowLevel'];
  this.styleMap = compileStyleMap(this.schema, options['styles'] || null);
  this.sortKeys = options['sortKeys'] || false;
  this.lineWidth = options['lineWidth'] || 80;
  this.noRefs = options['noRefs'] || false;
  this.noCompatMode = options['noCompatMode'] || false;
  this.condenseFlow = options['condenseFlow'] || false;
  this.quotingType = options['quotingType'] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes = options['forceQuotes'] || false;
  this.replacer = typeof options['replacer'] === 'function' ? options['replacer'] : null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;
  this.tag = null;
  this.result = '';
  this.duplicates = [];
  this.usedDuplicates = null;
} // Indents every line in a string. Empty lines (\n only) are not indented.


function indentString(string, spaces) {
  var ind = common.repeat(' ', spaces),
      position = 0,
      next = -1,
      result = '',
      line,
      length = string.length;

  while (position < length) {
    next = string.indexOf('\n', position);

    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }

    if (line.length && line !== '\n') result += ind;
    result += line;
  }

  return result;
}

function generateNextLine(state, level) {
  return '\n' + common.repeat(' ', state.indent * level);
}

function testImplicitResolving(state, str) {
  var index, length, type;

  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type = state.implicitTypes[index];

    if (type.resolve(str)) {
      return true;
    }
  }

  return false;
} // [33] s-white ::= s-space | s-tab


function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
} // Returns true if the character can be printed without escaping.
// From YAML 1.2: "any allowed characters known to be non-printable
// should also be escaped. [However,] This isn’t mandatory"
// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.


function isPrintable(c) {
  return 0x00020 <= c && c <= 0x00007E || 0x000A1 <= c && c <= 0x00D7FF && c !== 0x2028 && c !== 0x2029 || 0x0E000 <= c && c <= 0x00FFFD && c !== CHAR_BOM || 0x10000 <= c && c <= 0x10FFFF;
} // [34] ns-char ::= nb-char - s-white
// [27] nb-char ::= c-printable - b-char - c-byte-order-mark
// [26] b-char  ::= b-line-feed | b-carriage-return
// Including s-white (for some reason, examples doesn't match specs in this aspect)
// ns-char ::= c-printable - b-line-feed - b-carriage-return - c-byte-order-mark


function isNsCharOrWhitespace(c) {
  return isPrintable(c) && c !== CHAR_BOM // - b-char
  && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
} // [127]  ns-plain-safe(c) ::= c = flow-out  ⇒ ns-plain-safe-out
//                             c = flow-in   ⇒ ns-plain-safe-in
//                             c = block-key ⇒ ns-plain-safe-out
//                             c = flow-key  ⇒ ns-plain-safe-in
// [128] ns-plain-safe-out ::= ns-char
// [129]  ns-plain-safe-in ::= ns-char - c-flow-indicator
// [130]  ns-plain-char(c) ::=  ( ns-plain-safe(c) - “:” - “#” )
//                            | ( /* An ns-char preceding */ “#” )
//                            | ( “:” /* Followed by an ns-plain-safe(c) */ )


function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return ( // ns-plain-safe
  inblock ? // c = flow-in
  cIsNsCharOrWhitespace : cIsNsCharOrWhitespace // - c-flow-indicator
  && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET // ns-plain-char
  ) && c !== CHAR_SHARP // false on '#'
  && !(prev === CHAR_COLON && !cIsNsChar) // false on ': '
  || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP // change to true on '[^ ]#'
  || prev === CHAR_COLON && cIsNsChar; // change to true on ':[^ ]'
} // Simplified test for values allowed as the first character in plain style.


function isPlainSafeFirst(c) {
  // Uses a subset of ns-char - c-indicator
  // where ns-char = nb-char - s-white.
  // No support of ( ( “?” | “:” | “-” ) /* Followed by an ns-plain-safe(c)) */ ) part
  return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) // - s-white
  // - (c-indicator ::=
  // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
  && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
  && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE // | “%” | “@” | “`”)
  && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
} // Simplified test for values allowed as the last character in plain style.


function isPlainSafeLast(c) {
  // just not whitespace or colon, it will be checked to be plain character later
  return !isWhitespace(c) && c !== CHAR_COLON;
} // Same as 'string'.codePointAt(pos), but works in older browsers.


function codePointAt(string, pos) {
  var first = string.charCodeAt(pos),
      second;

  if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);

    if (second >= 0xDC00 && second <= 0xDFFF) {
      // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
    }
  }

  return first;
} // Determines whether block indentation indicator is required.


function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}

var STYLE_PLAIN = 1,
    STYLE_SINGLE = 2,
    STYLE_LITERAL = 3,
    STYLE_FOLDED = 4,
    STYLE_DOUBLE = 5; // Determines which scalar styles are possible and returns the preferred style.
// lineWidth = -1 => no limit.
// Pre-conditions: str.length > 0.
// Post-conditions:
//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).

function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false; // only checked if shouldTrackWidth

  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1; // count the first line correctly

  var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));

  if (singleLineOnly || forceQuotes) {
    // Case: no block styles.
    // Check for disallowed characters to rule out plain and single.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);

      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }

      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    // Case: block styles permitted.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);

      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true; // Check if any line can be folded.

        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
          i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== ' ';
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }

      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    } // in case the end is missing a \n


    hasFoldableLine = hasFoldableLine || shouldTrackWidth && i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== ' ';
  } // Although every style can represent \n without escaping, prefer block styles
  // for multiline, since they're more readable and they don't add empty lines.
  // Also prefer folding a super-long line.


  if (!hasLineBreak && !hasFoldableLine) {
    // Strings interpretable as another type have to be quoted;
    // e.g. the string 'true' vs. the boolean true.
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }

    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  } // Edge case: block indentation indicator can only have one digit.


  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  } // At this point we know block styles are valid.
  // Prefer literal style unless we want to fold.


  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }

  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
} // Note: line breaking/folding is implemented for only the folded style.
// NB. We drop the last trailing newline (if any) of a returned block scalar
//  since the dumper adds its own newline. This always works:
//    • No ending newline => unaffected; already using strip "-" chomping.
//    • Ending newline    => removed then restored.
//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.


function writeScalar(state, string, level, iskey, inblock) {
  state.dump = function () {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }

    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
      }
    }

    var indent = state.indent * Math.max(1, level); // no 0-indent scalars
    // As indentation gets deeper, let the width decrease monotonically
    // to the lower bound min(state.lineWidth, 40).
    // Note that this implies
    //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
    //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
    // This behaves better than a constant minimum width which disallows narrower options,
    // or an indent threshold which causes the width to suddenly increase.

    var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent); // Without knowing if keys are implicit/explicit, assume implicit for safety.

    var singleLineOnly = iskey // No block styles in flow mode.
    || state.flowLevel > -1 && level >= state.flowLevel;

    function testAmbiguity(string) {
      return testImplicitResolving(state, string);
    }

    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
      case STYLE_PLAIN:
        return string;

      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";

      case STYLE_LITERAL:
        return '|' + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));

      case STYLE_FOLDED:
        return '>' + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));

      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';

      default:
        throw new exception('impossible error: invalid scalar style');
    }
  }();
} // Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.


function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : ''; // note the special case: the string '\n' counts as a "trailing" empty line.

  var clip = string[string.length - 1] === '\n';
  var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
  var chomp = keep ? '+' : clip ? '' : '-';
  return indentIndicator + chomp + '\n';
} // (See the note for writeScalar.)


function dropEndingNewline(string) {
  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
} // Note: a long line without a suitable break point will exceed the width limit.
// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.


function foldString(string, width) {
  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
  // unless they're before or after a more-indented line, or at the very
  // beginning or end, in which case $k$ maps to $k$.
  // Therefore, parse each chunk as newline(s) followed by a content line.
  var lineRe = /(\n+)([^\n]*)/g; // first line (possibly an empty line)

  var result = function () {
    var nextLF = string.indexOf('\n');
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }(); // If we haven't reached the first content line yet, don't add an extra \n.


  var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
  var moreIndented; // rest of the lines

  var match;

  while (match = lineRe.exec(string)) {
    var prefix = match[1],
        line = match[2];
    moreIndented = line[0] === ' ';
    result += prefix + (!prevMoreIndented && !moreIndented && line !== '' ? '\n' : '') + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }

  return result;
} // Greedy line breaking.
// Picks the longest line under the limit each time,
// otherwise settles for the shortest line over the limit.
// NB. More-indented lines *cannot* be folded, as that would add an extra \n.


function foldLine(line, width) {
  if (line === '' || line[0] === ' ') return line; // Since a more-indented line adds a \n, breaks can't be followed by a space.

  var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.

  var match; // start is an inclusive index. end, curr, and next are exclusive.

  var start = 0,
      end,
      curr = 0,
      next = 0;
  var result = ''; // Invariants: 0 <= start <= length-1.
  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
  // Inside the loop:
  //   A match implies length >= 2, so curr and next are <= length-2.

  while (match = breakRe.exec(line)) {
    next = match.index; // maintain invariant: curr - start <= width

    if (next - start > width) {
      end = curr > start ? curr : next; // derive end <= length-2

      result += '\n' + line.slice(start, end); // skip the space that was output as \n

      start = end + 1; // derive start <= length-1
    }

    curr = next;
  } // By the invariants, start <= length-1, so there is something left over.
  // It is either the whole string or a part starting from non-whitespace.


  result += '\n'; // Insert a break if the remainder is too long and there is a break available.

  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }

  return result.slice(1); // drop extra \n joiner
} // Escapes a double-quoted string.


function escapeString(string) {
  var result = '';
  var char = 0;
  var escapeSeq;

  for (var i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];

    if (!escapeSeq && isPrintable(char)) {
      result += string[i];
      if (char >= 0x10000) result += string[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }

  return result;
}

function writeFlowSequence(state, level, object) {
  var _result = '',
      _tag = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    } // Write only valid elements, put null instead of invalid elements.


    if (writeNode(state, level, value, false, false) || typeof value === 'undefined' && writeNode(state, level, null, false, false)) {
      if (_result !== '') _result += ',' + (!state.condenseFlow ? ' ' : '');
      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = '[' + _result + ']';
}

function writeBlockSequence(state, level, object, compact) {
  var _result = '',
      _tag = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    } // Write only valid elements, put null instead of invalid elements.


    if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === 'undefined' && writeNode(state, level + 1, null, true, true, false, true)) {
      if (!compact || _result !== '') {
        _result += generateNextLine(state, level);
      }

      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += '-';
      } else {
        _result += '- ';
      }

      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = _result || '[]'; // Empty sequence if no valid values.
}

function writeFlowMapping(state, level, object) {
  var _result = '',
      _tag = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      pairBuffer;

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';
    if (_result !== '') pairBuffer += ', ';
    if (state.condenseFlow) pairBuffer += '"';
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level, objectKey, false, false)) {
      continue; // Skip this pair because of invalid key;
    }

    if (state.dump.length > 1024) pairBuffer += '? ';
    pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

    if (!writeNode(state, level, objectValue, false, false)) {
      continue; // Skip this pair because of invalid value.
    }

    pairBuffer += state.dump; // Both key and value are valid.

    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = '{' + _result + '}';
}

function writeBlockMapping(state, level, object, compact) {
  var _result = '',
      _tag = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      explicitPair,
      pairBuffer; // Allow sorting keys so that the output file is deterministic

  if (state.sortKeys === true) {
    // Default sorting
    objectKeyList.sort();
  } else if (typeof state.sortKeys === 'function') {
    // Custom sort function
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    // Something is wrong
    throw new exception('sortKeys must be a boolean or a function');
  }

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';

    if (!compact || _result !== '') {
      pairBuffer += generateNextLine(state, level);
    }

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue; // Skip this pair because of invalid key.
    }

    explicitPair = state.tag !== null && state.tag !== '?' || state.dump && state.dump.length > 1024;

    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += '?';
      } else {
        pairBuffer += '? ';
      }
    }

    pairBuffer += state.dump;

    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }

    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue; // Skip this pair because of invalid value.
    }

    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ':';
    } else {
      pairBuffer += ': ';
    }

    pairBuffer += state.dump; // Both key and value are valid.

    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
}

function detectType(state, object, explicit) {
  var _result, typeList, index, length, type, style;

  typeList = explicit ? state.explicitTypes : state.implicitTypes;

  for (index = 0, length = typeList.length; index < length; index += 1) {
    type = typeList[index];

    if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === 'object' && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
      if (explicit) {
        if (type.multi && type.representName) {
          state.tag = type.representName(object);
        } else {
          state.tag = type.tag;
        }
      } else {
        state.tag = '?';
      }

      if (type.represent) {
        style = state.styleMap[type.tag] || type.defaultStyle;

        if (_toString.call(type.represent) === '[object Function]') {
          _result = type.represent(object, style);
        } else if (_hasOwnProperty.call(type.represent, style)) {
          _result = type.represent[style](object, style);
        } else {
          throw new exception('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
        }

        state.dump = _result;
      }

      return true;
    }
  }

  return false;
} // Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//


function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;

  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }

  var type = _toString.call(state.dump);

  var inblock = block;
  var tagStr;

  if (block) {
    block = state.flowLevel < 0 || state.flowLevel > level;
  }

  var objectOrArray = type === '[object Object]' || type === '[object Array]',
      duplicateIndex,
      duplicate;

  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }

  if (state.tag !== null && state.tag !== '?' || duplicate || state.indent !== 2 && level > 0) {
    compact = false;
  }

  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = '*ref_' + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }

    if (type === '[object Object]') {
      if (block && Object.keys(state.dump).length !== 0) {
        writeBlockMapping(state, level, state.dump, compact);

        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);

        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object Array]') {
      if (block && state.dump.length !== 0) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }

        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);

        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object String]') {
      if (state.tag !== '?') {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type === '[object Undefined]') {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new exception('unacceptable kind of an object to dump ' + type);
    }

    if (state.tag !== null && state.tag !== '?') {
      // Need to encode all characters except those allowed by the spec:
      //
      // [35] ns-dec-digit    ::=  [#x30-#x39] /* 0-9 */
      // [36] ns-hex-digit    ::=  ns-dec-digit
      //                         | [#x41-#x46] /* A-F */ | [#x61-#x66] /* a-f */
      // [37] ns-ascii-letter ::=  [#x41-#x5A] /* A-Z */ | [#x61-#x7A] /* a-z */
      // [38] ns-word-char    ::=  ns-dec-digit | ns-ascii-letter | “-”
      // [39] ns-uri-char     ::=  “%” ns-hex-digit ns-hex-digit | ns-word-char | “#”
      //                         | “;” | “/” | “?” | “:” | “@” | “&” | “=” | “+” | “$” | “,”
      //                         | “_” | “.” | “!” | “~” | “*” | “'” | “(” | “)” | “[” | “]”
      //
      // Also need to encode '!' because it has special meaning (end of tag prefix).
      //
      tagStr = encodeURI(state.tag[0] === '!' ? state.tag.slice(1) : state.tag).replace(/!/g, '%21');

      if (state.tag[0] === '!') {
        tagStr = '!' + tagStr;
      } else if (tagStr.slice(0, 18) === 'tag:yaml.org,2002:') {
        tagStr = '!!' + tagStr.slice(18);
      } else {
        tagStr = '!<' + tagStr + '>';
      }

      state.dump = tagStr + ' ' + state.dump;
    }
  }

  return true;
}

function getDuplicateReferences(object, state) {
  var objects = [],
      duplicatesIndexes = [],
      index,
      length;
  inspectNode(object, objects, duplicatesIndexes);

  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }

  state.usedDuplicates = new Array(length);
}

function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList, index, length;

  if (object !== null && typeof object === 'object') {
    index = objects.indexOf(object);

    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);

      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);

        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}

function dump$1(input, options) {
  options = options || {};
  var state = new State$2(options);
  if (!state.noRefs) getDuplicateReferences(input, state);
  var value = input;

  if (state.replacer) {
    value = state.replacer.call({
      '': value
    }, '', value);
  }

  if (writeNode(state, 0, value, true, true)) return state.dump + '\n';
  return '';
}

var dump_1 = dump$1;
var dumper = {
  dump: dump_1
};

function renamed(from, to) {
  return function () {
    throw new Error('Function yaml.' + from + ' is removed in js-yaml 4. ' + 'Use yaml.' + to + ' instead, which is now safe by default.');
  };
}

var Type = type$1;
var Schema$2 = schema;
var FAILSAFE_SCHEMA = failsafe;
var JSON_SCHEMA = json;
var CORE_SCHEMA = core$1;
var DEFAULT_SCHEMA = _default$1;
var load = loader.load;
var loadAll = loader.loadAll;
var dump = dumper.dump;
var YAMLException = exception; // Re-export all types in case user wants to create custom schema

var types$1 = {
  binary: binary,
  float: float,
  map: map$2,
  null: _null,
  pairs: pairs,
  set: set,
  timestamp: timestamp,
  bool: bool,
  int: int$2,
  merge: merge$1,
  omap: omap,
  seq: seq,
  str: str
}; // Removed functions from JS-YAML 3.0.x

var safeLoad = renamed('safeLoad', 'load');
var safeLoadAll = renamed('safeLoadAll', 'loadAll');
var safeDump = renamed('safeDump', 'dump');
var jsYaml = {
  Type: Type,
  Schema: Schema$2,
  FAILSAFE_SCHEMA: FAILSAFE_SCHEMA,
  JSON_SCHEMA: JSON_SCHEMA,
  CORE_SCHEMA: CORE_SCHEMA,
  DEFAULT_SCHEMA: DEFAULT_SCHEMA,
  load: load,
  loadAll: loadAll,
  dump: dump,
  YAMLException: YAMLException,
  types: types$1,
  safeLoad: safeLoad,
  safeLoadAll: safeLoadAll,
  safeDump: safeDump
};

/** Perform a nested parse upto and including a particular ruleName
 *
 * The main use for this function is to perform nested parses
 * upto but not including inline parsing.
 */
function nestedCoreParse(md, pluginRuleName, src, // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
env, initLine, includeRule = true) {
  // disable all core rules after pluginRuleName
  const tempDisabledCore = []; // TODO __rules__ is currently not exposed in typescript, but is the only way to get the rule names,
  // since md.core.ruler.getRules('') only returns the rule functions
  // we should upstream a getRuleNames() function or similar
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore TS2339

  for (const rule of [...md.core.ruler.__rules__].reverse()) {
    if (rule.name === pluginRuleName) {
      if (!includeRule) {
        tempDisabledCore.push(rule.name);
      }

      break;
    }

    if (rule.name) {
      tempDisabledCore.push(rule.name);
    }
  }

  md.core.ruler.disable(tempDisabledCore);
  let tokens = [];

  try {
    tokens = md.parse(src, env);
  } finally {
    md.core.ruler.enable(tempDisabledCore);
  }

  for (const token of tokens) {
    token.map = token.map !== null ? [token.map[0] + initLine, token.map[1] + initLine] : token.map;
  }

  return tokens;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** A class to define a single directive */

class Directive {
  constructor(state) {
    this.required_arguments = 0;
    this.optional_arguments = 0;
    this.final_argument_whitespace = false;
    this.has_content = false;
    this.option_spec = {};
    this.rawOptions = false;
    this.state = state;
  }
  /** Convert the directive data to tokens */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  run(data) {
    return [];
  }

  assert(test, msg) {
    if (!test) {
      throw new Error(msg);
    }
  }
  /** throw error is no body content parsed. */


  assert_has_content(data) {
    if (!data.body) {
      throw new Error("Content block expected, but none found.");
    }
  }
  /** Create a single token */


  createToken(type, tag, nesting, optional) {
    const token = new this.state.Token(type, tag, nesting);

    if ((optional === null || optional === void 0 ? void 0 : optional.content) !== undefined) {
      token.content = optional.content;
    }

    if ((optional === null || optional === void 0 ? void 0 : optional.level) !== undefined) {
      token.level = optional.level;
    }

    if ((optional === null || optional === void 0 ? void 0 : optional.map) !== undefined) {
      token.map = optional.map;
    }

    if ((optional === null || optional === void 0 ? void 0 : optional.block) !== undefined) {
      token.block = optional.block;
    }

    if ((optional === null || optional === void 0 ? void 0 : optional.info) !== undefined) {
      token.info = optional.info;
    }

    if ((optional === null || optional === void 0 ? void 0 : optional.meta) !== undefined) {
      token.meta = optional.meta;
    }

    if ((optional === null || optional === void 0 ? void 0 : optional.children) !== undefined) {
      token.children = optional.children;
    }

    return token;
  }
  /** parse block of text to tokens (does not run inline parse) */


  nestedParse(block, initLine) {
    return nestedCoreParse(this.state.md, "run_directives", block, this.state.env, initLine, true);
  }

}
/** Raise on parsing/validation error. */

class DirectiveParsingError extends Error {
  constructor() {
    super(...arguments);
    this.name = "DirectiveParsingError";
  }

}
/**
 * This function contains the logic to take the first line of a directive,
 * and the content, and turn it into the three core components:
 * arguments (list), options (key: value mapping), and body (text).
 */

function directiveToData(token, directive) {
  const firstLine = token.meta.arg || "";
  const content = token.content;
  let body = content.trim() ? content.split(/\r?\n/) : [];
  let bodyOffset = 0;
  let options = {};

  if (Object.keys(directive.option_spec || {}) || directive.rawOptions) {
    [body, options, bodyOffset] = parseDirectiveOptions(body, directive);
  }

  let args = [];

  if (!directive.required_arguments && !directive.optional_arguments) {
    if (firstLine) {
      bodyOffset = 0;
      body = [firstLine].concat(body);
    }
  } else {
    args = parseDirectiveArguments(firstLine, directive);
  } // remove first line of body if blank, to allow space between the options and the content


  if (body.length && !body[0].trim()) {
    body.shift();
    bodyOffset++;
  } // check for body content


  if (body.length && !directive.has_content) {
    throw new DirectiveParsingError("Has content but content not allowed");
  }

  return {
    map: token.map ? token.map : [0, 0],
    args,
    options,
    body: body.join("\n"),
    bodyMap: token.map ? [body.length > 0 ? token.map[0] + bodyOffset : token.map[1], body.length > 0 ? token.map[1] - 1 : token.map[1]] : [0, 0]
  };
}

function parseDirectiveOptions(content, fullSpec) {
  // instantiate options
  let bodyOffset = 1;
  let options = {};
  let yamlBlock = null; // TODO allow for indented content (I can't remember why this was needed?)

  if (content.length && content[0].startsWith("---")) {
    // options contained in YAML block, ending with '---'
    bodyOffset++;
    const newContent = [];
    yamlBlock = [];
    let foundDivider = false;

    for (const line of content.slice(1)) {
      if (line.startsWith("---")) {
        bodyOffset++;
        foundDivider = true;
        continue;
      }

      if (foundDivider) {
        newContent.push(line);
      } else {
        bodyOffset++;
        yamlBlock.push(line);
      }
    }

    content = newContent;
  } else if (content.length && content[0].startsWith(":")) {
    const newContent = [];
    yamlBlock = [];
    let foundDivider = false;

    for (const line of content) {
      if (!foundDivider && !line.startsWith(":")) {
        foundDivider = true;
        newContent.push(line);
        continue;
      }

      if (foundDivider) {
        newContent.push(line);
      } else {
        bodyOffset++;
        yamlBlock.push(line.slice(1));
      }
    }

    content = newContent;
  }

  if (yamlBlock !== null) {
    try {
      const output = jsYaml.load(yamlBlock.join("\n"));

      if (output !== null && typeof output === "object") {
        options = output;
      } else {
        throw new DirectiveParsingError(`not dict: ${output}`);
      }
    } catch (error) {
      throw new DirectiveParsingError(`Invalid options YAML: ${error}`);
    }
  }

  if (fullSpec.rawOptions) {
    return [content, options, bodyOffset];
  }

  for (const [name, value] of Object.entries(options)) {
    const convertor = fullSpec.option_spec ? fullSpec.option_spec[name] : null;

    if (!convertor) {
      throw new DirectiveParsingError(`Unknown option: ${name}`);
    }

    let converted_value = value;

    if (value === null || value === false) {
      converted_value = "";
    }

    try {
      // In docutils all values are simply read as strings,
      // but loading with YAML these can be converted to other types, so we convert them back first
      // TODO check that it is sufficient to simply do this conversion, or if there is a better way
      converted_value = convertor(`${converted_value || ""}`);
    } catch (error) {
      throw new DirectiveParsingError(`Invalid option value: (option: '${name}'; value: ${value})\n${error}`);
    }

    options[name] = converted_value;
  }

  return [content, options, bodyOffset];
}

function parseDirectiveArguments(firstLine, fullSpec) {
  var _a;

  let args = firstLine.trim() ? (_a = firstLine.trim()) === null || _a === void 0 ? void 0 : _a.split(/\s+/) : [];
  const totalArgs = (fullSpec.required_arguments || 0) + (fullSpec.optional_arguments || 0);

  if (args.length < (fullSpec.required_arguments || 0)) {
    throw new DirectiveParsingError(`${fullSpec.required_arguments} argument(s) required, ${args.length} supplied`);
  } else if (args.length > totalArgs) {
    if (fullSpec.final_argument_whitespace) {
      // note split limit does not work the same as in python
      const arr = firstLine.split(/\s+/);
      args = arr.splice(0, totalArgs - 1); // TODO is it ok that we effectively replace all whitespace with single spaces?

      args.push(arr.join(" "));
    } else {
      throw new DirectiveParsingError(`maximum ${totalArgs} argument(s) allowed, ${args.length} supplied`);
    }
  }

  return args;
}

function directivePlugin(md, options) {
  var _a;

  let after = options.directivesAfter || "block";

  if ((_a = options.replaceFences) !== null && _a !== void 0 ? _a : true) {
    md.core.ruler.after(after, "fence_to_directive", replaceFences);
    after = "fence_to_directive";
  }

  md.core.ruler.after(after, "run_directives", runDirectives(options.directives || {})); // fallback renderer for unhandled directives

  md.renderer.rules["directive"] = (tokens, idx) => {
    const token = tokens[idx];
    return `<aside class="directive-unhandled">\n<header><mark>${token.info}</mark><code> ${token.meta.arg}</code></header>\n<pre>${token.content}</pre></aside>\n`;
  };

  md.renderer.rules["directive_error"] = (tokens, idx) => {
    const token = tokens[idx];
    let content = "";

    if (token.content) {
      content = `\n---\n${token.content}`;
    }

    return `<aside class="directive-error">\n<header><mark>${token.info}</mark><code> ${token.meta.arg}</code></header>\n<pre>${token.meta.error_name}:\n${token.meta.error_message}\n${content}</pre></aside>\n`;
  };
}
/** Convert fences identified as directives to `directive` tokens */

function replaceFences(state) {
  for (const token of state.tokens) {
    if (token.type === "fence") {
      const match = token.info.match(/^\{([^\s}]+)\}\s*(.*)$/);

      if (match) {
        token.type = "directive";
        token.info = match[1];
        token.meta = {
          arg: match[2]
        };
      }
    }
  }

  return true;
}
/** Run all directives, replacing the original token */


function runDirectives(directives) {
  function func(state) {
    const finalTokens = [];

    for (const token of state.tokens) {
      // TODO directive name translations
      if (token.type === "directive" && token.info in directives) {
        try {
          const directive = new directives[token.info](state);
          const data = directiveToData(token, directive);
          const newTokens = directive.run(data); // Ensure `meta` exists and add the directive options

          newTokens[0].meta = Object.assign(Object.assign({
            directive: true
          }, data.options), newTokens[0].meta);
          finalTokens.push(...newTokens);
        } catch (err) {
          const errorToken = new state.Token("directive_error", "", 0);
          errorToken.content = token.content;
          errorToken.info = token.info;
          errorToken.meta = token.meta;
          errorToken.map = token.map;
          errorToken.meta.error_message = err.message;
          errorToken.meta.error_name = err.name;
          finalTokens.push(errorToken);
        }
      } else {
        finalTokens.push(token);
      }
    }

    state.tokens = finalTokens;
    return true;
  }

  return func;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Functions for converting and validating directive options
 *
 * Primarily adapted from: docutils/docutils/parsers/rst/directives/__init__.py
 */

/**
 * Normalize a string to HTML4 id
 *
 * Adapted from docutils/nodes.py::make_id,
 * it should be noted that in HTML5 the only requirement is no whitespace.
 * */
function make_id(name) {
  // TODO make more complete
  return name.toLowerCase().split(/\s+/).join("-").replace(/[^a-z0-9]+/, "-").replace(/^[-0-9]+|-+$/, "");
}
/** Error to throw when an option is invalid. */

class OptionSpecError extends Error {
  constructor() {
    super(...arguments);
    this.name = "OptionSpecError";
  }

}
/** Leave value unchanged */

const unchanged = value => value;
/** Leave value unchanged, but assert non-empty string */

const unchanged_required = value => {
  if (!value) {
    throw new OptionSpecError("Argument required but none supplied");
  }

  return value;
};
/** A flag option (no argument) */

const flag = value => {
  if (value.trim()) {
    throw new OptionSpecError(`No argument is allowed: "${value}" supplied`);
  }

  return null;
};
/** Split values by whitespace and normalize to HTML4 id */

const class_option = value => {
  return `${value || ""}`.split(/\s+/).map(name => make_id(name));
};
/** Check for an integer argument and convert */

function int$1(argument) {
  if (!argument) {
    throw new OptionSpecError("Value is not set");
  }

  const value = Number.parseFloat(argument);

  if (Number.isNaN(value) || !Number.isInteger(value)) {
    throw new OptionSpecError(`Value "${argument}" is not an integer`);
  }

  return value;
}
/** Check for a non-negative integer argument and convert */

function nonnegative_int(argument) {
  const value = int$1(argument);

  if (value < 0) {
    throw new OptionSpecError(`Value "${argument}" must be positive or zero`);
  }

  return value;
}
/** A non-negative integer or null. */

const optional_int = value => {
  if (!value) {
    return null;
  }

  return nonnegative_int(value);
};
/** Check for an integer percentage value with optional percent sign. */

const percentage = value => {
  value = `${value || ""}`.replace(/\s+%$/, "");
  return nonnegative_int(value);
};
/** Check for a positive argument of one of the units and return a
    normalized string of the form "<value><unit>" (without space in
    between).
*/

function get_measure(argument, units) {
  const regex = new RegExp(`^(?<number>[0-9.]+)\\s*(?<units>${units.join("|")})$`);
  const match = regex.exec(argument);

  if (!match || !match.groups) {
    throw new OptionSpecError(`not a positive measure of one of the following units: ${units.join("|")}`);
  }

  return match.groups.number + match.groups.units;
}

const length_units = ["em", "ex", "px", "in", "cm", "mm", "pt", "pc"];
/** Check for a positive argument of a length unit, allowing for no unit. */

const length_or_unitless = value => {
  return get_measure(value, [...length_units, ""]);
};
/**
Return normalized string of a length or percentage unit.

Add <default> if there is no unit. Raise ValueError if the argument is not
a positive measure of one of the valid CSS units (or without unit).

>>> length_or_percentage_or_unitless('3 pt')
'3pt'
>>> length_or_percentage_or_unitless('3%', 'em')
'3%'
>>> length_or_percentage_or_unitless('3')
'3'
>>> length_or_percentage_or_unitless('3', 'px')
'3px'

*/

const length_or_percentage_or_unitless = (argument, defaultUnit = "") => {
  try {
    return get_measure(argument, [...length_units, "%"]);
  } catch (_a) {
    return length_or_unitless(argument) + defaultUnit;
  }
};
const length_or_percentage_or_unitless_figure = (argument, defaultUnit = "") => {
  if (argument.toLowerCase() === "image") {
    return "image";
  }

  return length_or_percentage_or_unitless(argument, defaultUnit);
};
/** Create an option that asserts the (lower-cased & trimmed) value is a member of a choice set. */

function create_choice(choices) {
  return argument => {
    argument = argument.toLowerCase().trim();

    if (choices.includes(argument)) {
      return argument;
    }

    throw new OptionSpecError(`must be in: ${choices.join("|")}`);
  };
}
/** Return the URI argument with unescaped whitespace removed. */

const uri = value => {
  // TODO implement whitespace removal
  return value;
};

var options = /*#__PURE__*/Object.freeze({
	__proto__: null,
	make_id: make_id,
	OptionSpecError: OptionSpecError,
	unchanged: unchanged,
	unchanged_required: unchanged_required,
	flag: flag,
	class_option: class_option,
	int: int$1,
	nonnegative_int: nonnegative_int,
	optional_int: optional_int,
	percentage: percentage,
	length_or_unitless: length_or_unitless,
	length_or_percentage_or_unitless: length_or_percentage_or_unitless,
	length_or_percentage_or_unitless_figure: length_or_percentage_or_unitless_figure,
	create_choice: create_choice,
	uri: uri
});

/** Directives for admonition boxes.
 *
 * Apdapted from: docutils/docutils/parsers/rst/directives/admonitions.py
 */

class BaseAdmonition extends Directive {
  constructor() {
    super(...arguments);
    this.final_argument_whitespace = true;
    this.has_content = true;
    this.option_spec = {
      class: class_option,
      // TODO handle name option
      name: unchanged
    };
    this.title = "";
    this.kind = "";
  }

  run(data) {
    var _a;

    const newTokens = []; // we create an overall container, then individual containers for the title and body

    const adToken = this.createToken("admonition_open", "aside", 1, {
      map: data.map,
      block: true,
      meta: {
        kind: this.kind
      }
    });

    if (((_a = data.options.class) === null || _a === void 0 ? void 0 : _a.length) >= 1) {
      // Custom class information must go first for styling
      // For example, `class=tip, kind=seealso` should be styled as a `tip`
      adToken.attrSet("class", data.options.class.join(" "));
      adToken.attrJoin("class", "admonition");
    } else {
      adToken.attrSet("class", "admonition");
    }

    if (this.kind) {
      adToken.attrJoin("class", this.kind);
    }

    newTokens.push(adToken);
    const adTokenTitle = this.createToken("admonition_title_open", "header", 1);
    adTokenTitle.attrSet("class", "admonition-title");
    newTokens.push(adTokenTitle); // we want the title to be parsed as Markdown during the inline phase

    const title = data.args[0] || this.title;
    newTokens.push(this.createToken("inline", "", 0, {
      map: [data.map[0], data.map[0]],
      content: title,
      children: []
    }));
    newTokens.push(this.createToken("admonition_title_close", "header", -1, {
      block: true
    })); // run a recursive parse on the content of the admonition upto this stage

    const bodyTokens = this.nestedParse(data.body, data.bodyMap[0]);
    newTokens.push(...bodyTokens);
    newTokens.push(this.createToken("admonition_close", "aside", -1, {
      block: true
    }));
    return newTokens;
  }

}

class Admonition extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.required_arguments = 1;
  }

}
class Attention extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "Attention";
    this.kind = "attention";
  }

}
class Caution extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "Caution";
    this.kind = "caution";
  }

}
class Danger extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "Danger";
    this.kind = "danger";
  }

}
class Error$1 extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "Error";
    this.kind = "error";
  }

}
class Important extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "Important";
    this.kind = "important";
  }

}
class Hint extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "Hint";
    this.kind = "hint";
  }

}
class Note extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "Note";
    this.kind = "note";
  }

}
class SeeAlso extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "See Also";
    this.kind = "seealso";
  }

}
class Tip extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "Tip";
    this.kind = "tip";
  }

}
class Warning extends BaseAdmonition {
  constructor() {
    super(...arguments);
    this.title = "Warning";
    this.kind = "warning";
  }

}
const admonitions = {
  admonition: Admonition,
  attention: Attention,
  caution: Caution,
  danger: Danger,
  error: Error$1,
  important: Important,
  hint: Hint,
  note: Note,
  seealso: SeeAlso,
  tip: Tip,
  warning: Warning
};

/** Mark up content of a code block
 *
 * Adapted from sphinx/directives/patches.py
 */

class Code extends Directive {
  constructor() {
    super(...arguments);
    this.required_arguments = 0;
    this.optional_arguments = 1;
    this.final_argument_whitespace = false;
    this.has_content = true;
    this.option_spec = {
      /** Add line numbers, optionally starting from a particular number. */
      "number-lines": optional_int,

      /** Ignore minor errors on highlighting */
      force: flag,
      name: unchanged,
      class: class_option
    };
  }

  run(data) {
    // TODO handle options
    this.assert_has_content(data);
    const token = this.createToken("fence", "code", 0, {
      // TODO if not specified, the language should come from a central configuration "highlight_language"
      info: data.args ? data.args[0] : "",
      content: data.body,
      map: data.bodyMap
    });
    return [token];
  }

}
/** Mark up content of a code block, with more settings
 *
 * Adapted from sphinx/directives/code.py
 */

class CodeBlock extends Directive {
  constructor() {
    super(...arguments);
    this.required_arguments = 0;
    this.optional_arguments = 1;
    this.final_argument_whitespace = false;
    this.has_content = true;
    this.option_spec = {
      /** Add line numbers. */
      linenos: flag,

      /** Start line numbering from a particular value. */
      "lineno-start": int$1,

      /** Strip indentation characters from the code block.
       * When number given, leading N characters are removed
       */
      dedent: optional_int,

      /** Emphasize particular lines (comma-separated numbers) */
      "emphasize-lines": unchanged_required,
      caption: unchanged_required,

      /** Ignore minor errors on highlighting */
      force: flag,
      name: unchanged,
      class: class_option
    };
  }

  run(data) {
    // TODO handle options
    this.assert_has_content(data);
    const token = this.createToken("fence", "code", 0, {
      // TODO if not specified, the language should come from a central configuration "highlight_language"
      info: data.args ? data.args[0] : "",
      content: data.body,
      map: data.bodyMap
    });
    return [token];
  }

}
/** A code cell is a special MyST based cell, signifying executable code. */

class CodeCell extends Directive {
  constructor() {
    super(...arguments);
    this.required_arguments = 0;
    this.optional_arguments = 1;
    this.final_argument_whitespace = false;
    this.has_content = true;
    this.rawOptions = true;
  }

  run(data) {
    // TODO store options and the fact that this is a code cell rather than a fence?
    const token = this.createToken("fence", "code", 0, {
      info: data.args ? data.args[0] : "",
      content: data.body,
      map: data.bodyMap
    });
    return [token];
  }

}
const code$3 = {
  code: Code,
  "code-block": CodeBlock,
  "code-cell": CodeCell
};

const shared_option_spec = {
  alt: unchanged,
  height: length_or_unitless,
  width: length_or_percentage_or_unitless,
  // TODO handle scale option
  scale: percentage,
  // TODO handle target option
  target: unchanged_required,
  class: class_option,
  // TODO handle name option (note: should be applied to figure for Figure)
  name: unchanged
};
/** Directive for a single image.
 *
 * Adapted from: docutils/docutils/parsers/rst/directives/images.py
 */

class Image extends Directive {
  constructor() {
    super(...arguments);
    this.required_arguments = 1;
    this.optional_arguments = 0;
    this.final_argument_whitespace = true;
    this.option_spec = Object.assign(Object.assign({}, shared_option_spec), {
      align: create_choice(["left", "center", "right", "top", "middle", "bottom"])
    });
  }

  create_image(data) {
    // get URI
    const src = uri(data.args[0] || "");
    const token = this.createToken("image", "img", 0, {
      map: data.map,
      block: true
    });
    token.attrSet("src", src);
    token.attrSet("alt", data.options.alt || ""); // TODO markdown-it default renderer requires the alt as children tokens

    const altTokens = [];

    if (data.options.alt) {
      this.state.md.inline.parse(data.options.alt, this.state.md, this.state.env, altTokens);
    }

    token.children = altTokens;

    if (data.options.height) {
      token.attrSet("height", data.options.height);
    }

    if (data.options.width) {
      token.attrSet("width", data.options.width);
    }

    if (data.options.align) {
      token.attrJoin("class", `align-${data.options.align}`);
    }

    if (data.options.class) {
      token.attrJoin("class", data.options.class.join(" "));
    }

    return token;
  }

  run(data) {
    return [this.create_image(data)];
  }

}
/** Directive for an image with caption.
 *
 * Adapted from: docutils/docutils/parsers/rst/directives/images.py,
 * and sphinx/directives/patches.py (patch to apply name to figure instead of image)
 */

class Figure extends Image {
  constructor() {
    super(...arguments);
    this.option_spec = Object.assign(Object.assign({}, shared_option_spec), {
      align: create_choice(["left", "center", "right"]),
      figwidth: length_or_percentage_or_unitless_figure,
      figclass: class_option
    });
    this.has_content = true;
  }

  run(data) {
    const openToken = this.createToken("figure_open", "figure", 1, {
      map: data.map,
      block: true
    });

    if (data.options.figclass) {
      openToken.attrJoin("class", data.options.figclass.join(" "));
    }

    if (data.options.align) {
      openToken.attrJoin("class", `align-${data.options.align}`);
    }

    if (data.options.figwidth && data.options.figwidth !== "image") {
      // TODO handle figwidth == "image"?
      openToken.attrSet("width", data.options.figwidth);
    }

    let target;

    if (data.options.name) {
      // TODO: figure out how to pass silent here
      target = newTarget(this.state, openToken, TargetKind$1.figure, data.options.name, // TODO: a better title?
      data.body.trim());
      openToken.attrJoin("class", "numbered");
    }

    const imageToken = this.create_image(data);
    imageToken.map = [data.map[0], data.map[0]];
    let captionTokens = [];

    if (data.body) {
      const openCaption = this.createToken("figure_caption_open", "figcaption", 1, {
        block: true
      });

      if (target) {
        openCaption.attrSet("number", `${target.number}`);
      } // TODO in docutils caption can only be single paragraph (or ignored if comment)
      // then additional content is figure legend


      const captionBody = this.nestedParse(data.body, data.bodyMap[0]);
      const closeCaption = this.createToken("figure_caption_close", "figcaption", -1, {
        block: true
      });
      captionTokens = [openCaption, ...captionBody, closeCaption];
    }

    const closeToken = this.createToken("figure_close", "figure", -1, {
      block: true
    });
    return [openToken, imageToken, ...captionTokens, closeToken];
  }

}
const images = {
  image: Image,
  figure: Figure
};

/**A Markdown syntax tree node.

A class that can be used to construct a tree representation of a linear
`markdown-it` token stream.

Each node in the tree represents either:
    - root of the Markdown document
    - a single unnested `Token`
    - a `Token` "_open" and "_close" token pair, and the tokens nested in
        between
*/
class SyntaxTreeNode {
  /** Initialize a `SyntaxTreeNode` from a token stream. */
  constructor(tokens, create_root = true) {
    this.children = [];
    this.children = [];

    if (create_root) {
      this._set_children_from_tokens(tokens);

      return;
    }

    if (tokens.length === 0) {
      throw new Error("Tree creation: Can only create root from empty token sequence.");
    }

    if (tokens.length === 1) {
      const inline_token = tokens[0];

      if (inline_token.nesting) {
        throw new Error("Unequal nesting level at the start and end of token stream.");
      }

      this.token = inline_token;

      if (inline_token.children !== null && inline_token.children.length > 0) {
        this._set_children_from_tokens(inline_token.children);
      }
    } else {
      this.nester_tokens = {
        opening: tokens[0],
        closing: tokens[tokens.length - 1]
      };

      this._set_children_from_tokens(tokens.slice(1, -1));
    }
  }

  _set_children_from_tokens(tokens) {
    const revered_tokens = [...tokens].reverse();
    let token;

    while (revered_tokens.length > 0) {
      token = revered_tokens.pop();

      if (!token) {
        break;
      }

      if (!token.nesting) {
        this._add_child([token]);

        continue;
      }

      if (token.nesting !== 1) {
        throw new Error("Invalid token nesting");
      }

      const nested_tokens = [token];
      let nesting = 1;

      while (revered_tokens.length > 0 && nesting !== 0) {
        token = revered_tokens.pop();

        if (token) {
          nested_tokens.push(token);
          nesting += token.nesting;
        }
      }

      if (nesting) {
        throw new Error(`unclosed tokens starting: ${nested_tokens[0]}`);
      }

      this._add_child(nested_tokens);
    }
  }

  _add_child(tokens) {
    const child = new SyntaxTreeNode(tokens, false);
    child.parent = this;
    this.children.push(child);
  }
  /** Recover the linear token stream. */


  to_tokens() {
    function recursive_collect_tokens(node, token_list) {
      if (node.type === "root") {
        for (const child of node.children) {
          recursive_collect_tokens(child, token_list);
        }
      } else if (node.token) {
        token_list.push(node.token);
      } else {
        if (!node.nester_tokens) {
          throw new Error("No nested token available");
        }

        token_list.push(node.nester_tokens.opening);

        for (const child of node.children) {
          recursive_collect_tokens(child, token_list);
        }

        token_list.push(node.nester_tokens.closing);
      }
    }

    const tokens = [];
    recursive_collect_tokens(this, tokens);
    return tokens;
  }
  /** Is the node a special root node? */


  get is_root() {
    return !(this.token || this.nester_tokens);
  }
  /** Is this node nested? */


  get is_nested() {
    return !!this.nester_tokens;
  }
  /** Get siblings of the node (including self). */


  get siblings() {
    if (!this.parent) {
      return [this];
    }

    return this.parent.children;
  }
  /** Recursively yield all descendant nodes in the tree starting at self.
   *
   * The order mimics the order of the underlying linear token stream (i.e. depth first).
   */


  *walk(include_self = true) {
    if (include_self) {
      yield this;
    }

    for (const child of this.children) {
      yield* child.walk(true);
    }
  }
  /** Get a string type of the represented syntax.
   *
    - "root" for root nodes
    - `Token.type` if the node represents an un-nested token
    - `Token.type` of the opening token, with "_open" suffix stripped, if
        the node represents a nester token pair
  */


  get type() {
    var _a, _b, _c;

    if (this.is_root) {
      return "root";
    }

    if (this.token) {
      return this.token.type;
    }

    if ((_a = this.nester_tokens) === null || _a === void 0 ? void 0 : _a.opening.type.endsWith("_open")) {
      return (_b = this.nester_tokens) === null || _b === void 0 ? void 0 : _b.opening.type.slice(0, -5);
    }

    if (this.nester_tokens) {
      return (_c = this.nester_tokens) === null || _c === void 0 ? void 0 : _c.opening.type;
    }

    throw new Error("no internal token");
  }

  attribute_token() {
    if (this.token) {
      return this.token;
    }

    if (this.nester_tokens) {
      return this.nester_tokens.opening;
    }

    throw new Error("Tree node does not have the accessed attribute");
  }

  get tag() {
    return this.attribute_token().tag;
  }

  get level() {
    return this.attribute_token().level;
  }

  get content() {
    return this.attribute_token().content;
  }

  get markup() {
    return this.attribute_token().markup;
  }

  get info() {
    return this.attribute_token().info;
  } // eslint-disable-next-line @typescript-eslint/no-explicit-any


  get meta() {
    return this.attribute_token().meta;
  }

  get block() {
    return this.attribute_token().block;
  }

  get hidden() {
    return this.attribute_token().hidden;
  }

  get map() {
    return this.attribute_token().map;
  }

  get attrs() {
    return this.attribute_token().attrs;
  }

}

class ListTable extends Directive {
  constructor() {
    super(...arguments);
    this.required_arguments = 0;
    this.optional_arguments = 1;
    this.final_argument_whitespace = true;
    this.has_content = true;
    this.option_spec = {
      "header-rows": nonnegative_int,
      "stub-columns": nonnegative_int,
      width: length_or_percentage_or_unitless,
      widths: unchanged,
      class: class_option,
      name: unchanged,
      align: create_choice(["left", "center", "right"])
    };
  }

  run(data) {
    // TODO support all options (add colgroup for widths)
    // Parse content
    this.assert_has_content(data);
    const headerRows = data.options["header-rows"] || 0;
    const listTokens = this.nestedParse(data.body, data.bodyMap[0]); // Check content is a list

    if (listTokens.length < 2 || listTokens[0].type !== "bullet_list_open" || listTokens[listTokens.length - 1].type !== "bullet_list_close") {
      throw new DirectiveParsingError("Content is not a single bullet list");
    } // generate tokens


    const tokens = []; // table opening

    const tableOpen = this.createToken("table_open", "table", 1, {
      map: data.bodyMap
    });

    if (data.options.align) {
      tableOpen.attrJoin("class", `align-${data.options.align}`);
    }

    if (data.options.class) {
      tableOpen.attrJoin("class", data.options.class.join(" "));
    }

    tokens.push(tableOpen); // add caption

    if (data.args.length && data.args[0]) {
      tokens.push(this.createToken("table_caption_open", "caption", 1));
      tokens.push(this.createToken("inline", "", 0, {
        map: [data.map[0], data.map[0]],
        content: data.args[0],
        children: []
      }));
      tokens.push(this.createToken("table_caption_close", "caption", -1));
    }

    let colType = "th";

    if (headerRows) {
      tokens.push(this.createToken("thead_open", "thead", 1, {
        level: 1
      }));
      colType = "th";
    } else {
      tokens.push(this.createToken("tbody_open", "tbody", 1, {
        level: 1
      }));
      colType = "td";
    }

    let rowLength = undefined;
    let rowNumber = 0;

    for (const child of new SyntaxTreeNode(listTokens.slice(1, -1)).children) {
      rowNumber += 1;
      this.assert(child.type === "list_item", `list item ${rowNumber} not of type 'list_item': ${child.type}`);
      this.assert(child.children.length === 1 && child.children[0].type === "bullet_list", `list item ${rowNumber} content not a nested bullet list`);
      const row = child.children[0].children;

      if (rowLength === undefined) {
        rowLength = row.length;
      } else {
        this.assert(row.length === rowLength, `list item ${rowNumber} does not contain the same number of columns as previous items`);
      }

      if (headerRows && rowNumber === headerRows + 1) {
        tokens.push(this.createToken("thead_close", "thead", -1, {
          level: 1
        }));
        tokens.push(this.createToken("tbody_open", "tbody", 1, {
          level: 1
        }));
        colType = "td";
      }

      tokens.push(this.createToken("tr_open", "tr", 1, {
        map: child.map,
        level: 2
      }));

      for (const column of row) {
        tokens.push(this.createToken(`${colType}_open`, colType, 1, {
          map: column.map,
          level: 3
        })); // TODO if the list is not tight then all paragraphs will be un-hidden maybe we don't want this?

        tokens.push(...column.to_tokens().slice(1, -1));
        tokens.push(this.createToken(`${colType}_close`, colType, -1, {
          level: 3
        }));
      }

      tokens.push(this.createToken("tr_close", "tr", -1, {
        level: 2
      }));
    }

    if (headerRows && rowNumber < headerRows) {
      throw new Error(`Insufficient rows (${rowNumber}) for required header rows (${headerRows})`);
    } // closing tokens


    if (colType === "td") {
      tokens.push(this.createToken("tbody_close", "tbody", -1, {
        level: 1
      }));
    } else {
      tokens.push(this.createToken("thead_close", "thead", -1, {
        level: 1
      }));
    }

    tokens.push(this.createToken("table_close", "table", -1));
    return tokens;
  }

}
const tables = {
  "list-table": ListTable
};

/** Math directive with a label
 */

class Math$1 extends Directive {
  constructor() {
    super(...arguments);
    this.required_arguments = 0;
    this.optional_arguments = 0;
    this.final_argument_whitespace = false;
    this.has_content = true;
    this.option_spec = {
      label: unchanged
    };
  }

  run(data) {
    // TODO handle options
    this.assert_has_content(data);
    const token = this.createToken("math_block", "div", 0, {
      content: data.body,
      map: data.bodyMap,
      block: true
    });
    token.attrSet("class", "math block");

    if (data.options.label) {
      token.attrSet("id", data.options.label);
      const target = newTarget(this.state, token, TargetKind$1.equation, data.options.label, "");
      token.attrSet("number", `${target.number}`);
      token.info = data.options.label;
      token.meta = {
        label: data.options.label,
        numbered: true,
        number: target.number
      };
    }

    return [token];
  }

}
const math$1 = {
  math: Math$1
};

const directivesDefault = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, admonitions), images), code$3), tables), math$1);

function numberingRule(options) {
  return state => {
    const env = getDocState(state);
    env.references.forEach(ref => {
      const {
        label,
        tokens,
        contentFromTarget
      } = ref;

      const setError = (details, error) => {
        tokens.open.attrJoin("class", "error");
        tokens.open.tag = tokens.close.tag = "code";

        if (contentFromTarget && error) {
          tokens.content.content = contentFromTarget(error);
        } else {
          tokens.content.content = details;
        }

        return true;
      };

      const target = env.targets[label];
      if (!target) return setError(label, {
        kind: ref.kind || "",
        label,
        title: label,
        number: `"${label}"`
      });

      if (ref.kind && target.kind !== ref.kind) {
        return setError(`Reference "${label}" does not match kind "${ref.kind}"`);
      }

      tokens.open.attrSet("href", `#${target.label}`);
      if (target.title) tokens.open.attrSet("title", target.title);
      if (contentFromTarget) tokens.content.content = contentFromTarget(target).trim();
    }); // TODO: Math that wasn't pre-numbered?

    return true;
  };
}
/**
 * Create a rule that runs at the end of a markdown-it parser to go through all
 * references and add their targets.
 *
 * This `Rule` is done *last*, as you may reference a figure/equation, when that `Target`
 * has not yet been created. The references call `resolveRefLater` when they are being
 * created and pass their tokens such that the content of those tokens can be
 * dynamically updated.
 *
 * @param options (none currently)
 * @returns The markdown-it Rule
 */


function statePlugin(md, options) {
  md.core.ruler.push("docutils_number", numberingRule());
}

/** Default options for docutils plugin */

const OptionDefaults$1 = {
  parseRoles: true,
  replaceFences: true,
  rolesAfter: "inline",
  directivesAfter: "block",
  directives: directivesDefault,
  roles: rolesDefault
};
/**
 * A markdown-it plugin for implementing docutils style roles and directives.
 */

function docutilsPlugin(md, options) {
  const fullOptions = Object.assign(Object.assign({}, OptionDefaults$1), options);
  md.use(rolePlugin, fullOptions);
  md.use(directivePlugin, fullOptions);
  md.use(statePlugin, fullOptions);
} // Note: Exporting default and the function as a named export.

/** Parse MyST targets (``(name)=``), blockquotes (``% comment``) and block breaks (``+++``).
 *
 * Adapted from: mdit_py_plugins/myst_blocks/index.py
 */
function mystBlockPlugin(md) {
  md.block.ruler.before("blockquote", "myst_line_comment", parse_line_comment, {
    alt: ["paragraph", "reference", "blockquote", "list", "footnote_def"]
  });
  md.block.ruler.before("hr", "myst_block_break", parse_block_break, {
    alt: ["paragraph", "reference", "blockquote", "list", "footnote_def"]
  });
  md.block.ruler.before("hr", "myst_target", parse_target, {
    alt: ["paragraph", "reference", "blockquote", "list", "footnote_def"]
  });
  md.renderer.rules.myst_line_comment = render_myst_line_comment;
  md.renderer.rules.myst_target = render_myst_target;
}

function parse_line_comment(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let maximum = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  if (state.src[pos] !== "%") {
    return false;
  }

  if (silent) {
    return true;
  }

  const token = state.push("myst_line_comment", "", 0);
  token.attrSet("class", "myst-line-comment");
  token.content = state.src.slice(pos + 1, maximum).replace(/\s+$/gm, ""); // rstrip

  token.markup = "%"; // search end of block while appending lines to `token.content`

  let nextLine;

  for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    maximum = state.eMarks[nextLine];

    if (state.src[pos] !== "%") {
      break;
    }

    token.content += "\n" + state.src.slice(pos + 1, maximum).replace(/\s+$/gm, ""); // rstrip
  }

  state.line = nextLine;
  token.map = [startLine, nextLine];
  return true;
}

function parse_block_break(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  const maximum = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  const marker = state.src.charCodeAt(pos);
  pos += 1; // Check block marker /* + */

  if (marker !== 0x2b) {
    return false;
  } // markers can be mixed with spaces, but there should be at least 3 of them


  let cnt = 1;

  while (pos < maximum) {
    const ch = state.src.charCodeAt(pos);

    if (ch !== marker && !state.md.utils.isSpace(ch)) {
      break;
    }

    if (ch === marker) {
      cnt += 1;
    }

    pos += 1;
  }

  if (cnt < 3) {
    return false;
  }

  if (silent) {
    return true;
  }

  state.line = startLine + 1;
  const token = state.push("myst_block_break", "hr", 0);
  token.attrSet("class", "myst-block");
  token.content = state.src.slice(pos, maximum).trim();
  token.map = [startLine, state.line];
  token.markup = state.md.utils.fromCodePoint(marker).repeat(cnt);
  return true;
}

const TARGET_PATTERN = /^\((?<label>[a-zA-Z0-9|@<>*./_\-+:]{1,100})\)=\s*$/;

function parse_target(state, startLine, endLine, silent) {
  const pos = state.bMarks[startLine] + state.tShift[startLine];
  const maximum = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  const match = TARGET_PATTERN.exec(state.src.slice(pos, maximum));

  if (!match) {
    return false;
  }

  if (silent) {
    return true;
  }

  state.line = startLine + 1;
  const token = state.push("myst_target", "", 0);
  token.attrSet("class", "myst-target");
  token.content = match && match.groups ? match.groups["label"] : "";
  token.map = [startLine, state.line];
  return true;
}

function escapeHtml$1(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function render_myst_line_comment(tokens, idx) {
  const token = tokens[idx];
  const content = token.content;
  return `<!-- ${escapeHtml$1(content).trim()} -->`;
}

function render_myst_target(tokens, idx) {
  const token = tokens[idx];
  const className = "myst-target";
  const label = token.content;
  const target = `<a href="#${label}">(${label})=</a>`;
  return `<div class="${className}">${target}</div>`;
}

var utils$2 = {};

var Aacute = "Á";
var aacute = "á";
var Abreve = "Ă";
var abreve = "ă";
var ac = "∾";
var acd = "∿";
var acE = "∾̳";
var Acirc = "Â";
var acirc = "â";
var acute = "´";
var Acy = "А";
var acy = "а";
var AElig = "Æ";
var aelig = "æ";
var af = "⁡";
var Afr = "𝔄";
var afr = "𝔞";
var Agrave = "À";
var agrave = "à";
var alefsym = "ℵ";
var aleph = "ℵ";
var Alpha = "Α";
var alpha = "α";
var Amacr = "Ā";
var amacr = "ā";
var amalg = "⨿";
var amp = "&";
var AMP = "&";
var andand = "⩕";
var And = "⩓";
var and = "∧";
var andd = "⩜";
var andslope = "⩘";
var andv = "⩚";
var ang = "∠";
var ange = "⦤";
var angle = "∠";
var angmsdaa = "⦨";
var angmsdab = "⦩";
var angmsdac = "⦪";
var angmsdad = "⦫";
var angmsdae = "⦬";
var angmsdaf = "⦭";
var angmsdag = "⦮";
var angmsdah = "⦯";
var angmsd = "∡";
var angrt = "∟";
var angrtvb = "⊾";
var angrtvbd = "⦝";
var angsph = "∢";
var angst = "Å";
var angzarr = "⍼";
var Aogon = "Ą";
var aogon = "ą";
var Aopf = "𝔸";
var aopf = "𝕒";
var apacir = "⩯";
var ap = "≈";
var apE = "⩰";
var ape = "≊";
var apid = "≋";
var apos = "'";
var ApplyFunction = "⁡";
var approx = "≈";
var approxeq = "≊";
var Aring = "Å";
var aring = "å";
var Ascr = "𝒜";
var ascr = "𝒶";
var Assign = "≔";
var ast = "*";
var asymp = "≈";
var asympeq = "≍";
var Atilde = "Ã";
var atilde = "ã";
var Auml = "Ä";
var auml = "ä";
var awconint = "∳";
var awint = "⨑";
var backcong = "≌";
var backepsilon = "϶";
var backprime = "‵";
var backsim = "∽";
var backsimeq = "⋍";
var Backslash = "∖";
var Barv = "⫧";
var barvee = "⊽";
var barwed = "⌅";
var Barwed = "⌆";
var barwedge = "⌅";
var bbrk = "⎵";
var bbrktbrk = "⎶";
var bcong = "≌";
var Bcy = "Б";
var bcy = "б";
var bdquo = "„";
var becaus = "∵";
var because = "∵";
var Because = "∵";
var bemptyv = "⦰";
var bepsi = "϶";
var bernou = "ℬ";
var Bernoullis = "ℬ";
var Beta = "Β";
var beta = "β";
var beth = "ℶ";
var between = "≬";
var Bfr = "𝔅";
var bfr = "𝔟";
var bigcap = "⋂";
var bigcirc = "◯";
var bigcup = "⋃";
var bigodot = "⨀";
var bigoplus = "⨁";
var bigotimes = "⨂";
var bigsqcup = "⨆";
var bigstar = "★";
var bigtriangledown = "▽";
var bigtriangleup = "△";
var biguplus = "⨄";
var bigvee = "⋁";
var bigwedge = "⋀";
var bkarow = "⤍";
var blacklozenge = "⧫";
var blacksquare = "▪";
var blacktriangle = "▴";
var blacktriangledown = "▾";
var blacktriangleleft = "◂";
var blacktriangleright = "▸";
var blank = "␣";
var blk12 = "▒";
var blk14 = "░";
var blk34 = "▓";
var block$2 = "█";
var bne = "=⃥";
var bnequiv = "≡⃥";
var bNot = "⫭";
var bnot = "⌐";
var Bopf = "𝔹";
var bopf = "𝕓";
var bot = "⊥";
var bottom = "⊥";
var bowtie = "⋈";
var boxbox = "⧉";
var boxdl = "┐";
var boxdL = "╕";
var boxDl = "╖";
var boxDL = "╗";
var boxdr = "┌";
var boxdR = "╒";
var boxDr = "╓";
var boxDR = "╔";
var boxh = "─";
var boxH = "═";
var boxhd = "┬";
var boxHd = "╤";
var boxhD = "╥";
var boxHD = "╦";
var boxhu = "┴";
var boxHu = "╧";
var boxhU = "╨";
var boxHU = "╩";
var boxminus = "⊟";
var boxplus = "⊞";
var boxtimes = "⊠";
var boxul = "┘";
var boxuL = "╛";
var boxUl = "╜";
var boxUL = "╝";
var boxur = "└";
var boxuR = "╘";
var boxUr = "╙";
var boxUR = "╚";
var boxv = "│";
var boxV = "║";
var boxvh = "┼";
var boxvH = "╪";
var boxVh = "╫";
var boxVH = "╬";
var boxvl = "┤";
var boxvL = "╡";
var boxVl = "╢";
var boxVL = "╣";
var boxvr = "├";
var boxvR = "╞";
var boxVr = "╟";
var boxVR = "╠";
var bprime = "‵";
var breve = "˘";
var Breve = "˘";
var brvbar = "¦";
var bscr = "𝒷";
var Bscr = "ℬ";
var bsemi = "⁏";
var bsim = "∽";
var bsime = "⋍";
var bsolb = "⧅";
var bsol = "\\";
var bsolhsub = "⟈";
var bull = "•";
var bullet = "•";
var bump = "≎";
var bumpE = "⪮";
var bumpe = "≏";
var Bumpeq = "≎";
var bumpeq = "≏";
var Cacute = "Ć";
var cacute = "ć";
var capand = "⩄";
var capbrcup = "⩉";
var capcap = "⩋";
var cap$1 = "∩";
var Cap = "⋒";
var capcup = "⩇";
var capdot = "⩀";
var CapitalDifferentialD = "ⅅ";
var caps = "∩︀";
var caret = "⁁";
var caron = "ˇ";
var Cayleys = "ℭ";
var ccaps = "⩍";
var Ccaron = "Č";
var ccaron = "č";
var Ccedil = "Ç";
var ccedil = "ç";
var Ccirc = "Ĉ";
var ccirc = "ĉ";
var Cconint = "∰";
var ccups = "⩌";
var ccupssm = "⩐";
var Cdot = "Ċ";
var cdot = "ċ";
var cedil = "¸";
var Cedilla = "¸";
var cemptyv = "⦲";
var cent = "¢";
var centerdot = "·";
var CenterDot = "·";
var cfr = "𝔠";
var Cfr = "ℭ";
var CHcy = "Ч";
var chcy = "ч";
var check = "✓";
var checkmark = "✓";
var Chi = "Χ";
var chi = "χ";
var circ = "ˆ";
var circeq = "≗";
var circlearrowleft = "↺";
var circlearrowright = "↻";
var circledast = "⊛";
var circledcirc = "⊚";
var circleddash = "⊝";
var CircleDot = "⊙";
var circledR = "®";
var circledS = "Ⓢ";
var CircleMinus = "⊖";
var CirclePlus = "⊕";
var CircleTimes = "⊗";
var cir = "○";
var cirE = "⧃";
var cire = "≗";
var cirfnint = "⨐";
var cirmid = "⫯";
var cirscir = "⧂";
var ClockwiseContourIntegral = "∲";
var CloseCurlyDoubleQuote = "”";
var CloseCurlyQuote = "’";
var clubs = "♣";
var clubsuit = "♣";
var colon = ":";
var Colon = "∷";
var Colone = "⩴";
var colone = "≔";
var coloneq = "≔";
var comma = ",";
var commat = "@";
var comp = "∁";
var compfn = "∘";
var complement = "∁";
var complexes = "ℂ";
var cong = "≅";
var congdot = "⩭";
var Congruent = "≡";
var conint = "∮";
var Conint = "∯";
var ContourIntegral = "∮";
var copf = "𝕔";
var Copf = "ℂ";
var coprod = "∐";
var Coproduct = "∐";
var copy = "©";
var COPY = "©";
var copysr = "℗";
var CounterClockwiseContourIntegral = "∳";
var crarr = "↵";
var cross = "✗";
var Cross = "⨯";
var Cscr = "𝒞";
var cscr = "𝒸";
var csub = "⫏";
var csube = "⫑";
var csup = "⫐";
var csupe = "⫒";
var ctdot = "⋯";
var cudarrl = "⤸";
var cudarrr = "⤵";
var cuepr = "⋞";
var cuesc = "⋟";
var cularr = "↶";
var cularrp = "⤽";
var cupbrcap = "⩈";
var cupcap = "⩆";
var CupCap = "≍";
var cup = "∪";
var Cup = "⋓";
var cupcup = "⩊";
var cupdot = "⊍";
var cupor = "⩅";
var cups = "∪︀";
var curarr = "↷";
var curarrm = "⤼";
var curlyeqprec = "⋞";
var curlyeqsucc = "⋟";
var curlyvee = "⋎";
var curlywedge = "⋏";
var curren = "¤";
var curvearrowleft = "↶";
var curvearrowright = "↷";
var cuvee = "⋎";
var cuwed = "⋏";
var cwconint = "∲";
var cwint = "∱";
var cylcty = "⌭";
var dagger = "†";
var Dagger = "‡";
var daleth = "ℸ";
var darr = "↓";
var Darr = "↡";
var dArr = "⇓";
var dash$1 = "‐";
var Dashv = "⫤";
var dashv = "⊣";
var dbkarow = "⤏";
var dblac = "˝";
var Dcaron = "Ď";
var dcaron = "ď";
var Dcy = "Д";
var dcy = "д";
var ddagger = "‡";
var ddarr = "⇊";
var DD = "ⅅ";
var dd$1 = "ⅆ";
var DDotrahd = "⤑";
var ddotseq = "⩷";
var deg = "°";
var Del = "∇";
var Delta = "Δ";
var delta = "δ";
var demptyv = "⦱";
var dfisht = "⥿";
var Dfr = "𝔇";
var dfr = "𝔡";
var dHar = "⥥";
var dharl = "⇃";
var dharr = "⇂";
var DiacriticalAcute = "´";
var DiacriticalDot = "˙";
var DiacriticalDoubleAcute = "˝";
var DiacriticalGrave = "`";
var DiacriticalTilde = "˜";
var diam = "⋄";
var diamond = "⋄";
var Diamond = "⋄";
var diamondsuit = "♦";
var diams = "♦";
var die = "¨";
var DifferentialD = "ⅆ";
var digamma = "ϝ";
var disin = "⋲";
var div = "÷";
var divide = "÷";
var divideontimes = "⋇";
var divonx = "⋇";
var DJcy = "Ђ";
var djcy = "ђ";
var dlcorn = "⌞";
var dlcrop = "⌍";
var dollar = "$";
var Dopf = "𝔻";
var dopf = "𝕕";
var Dot = "¨";
var dot = "˙";
var DotDot = "⃜";
var doteq = "≐";
var doteqdot = "≑";
var DotEqual = "≐";
var dotminus = "∸";
var dotplus = "∔";
var dotsquare = "⊡";
var doublebarwedge = "⌆";
var DoubleContourIntegral = "∯";
var DoubleDot = "¨";
var DoubleDownArrow = "⇓";
var DoubleLeftArrow = "⇐";
var DoubleLeftRightArrow = "⇔";
var DoubleLeftTee = "⫤";
var DoubleLongLeftArrow = "⟸";
var DoubleLongLeftRightArrow = "⟺";
var DoubleLongRightArrow = "⟹";
var DoubleRightArrow = "⇒";
var DoubleRightTee = "⊨";
var DoubleUpArrow = "⇑";
var DoubleUpDownArrow = "⇕";
var DoubleVerticalBar = "∥";
var DownArrowBar = "⤓";
var downarrow = "↓";
var DownArrow = "↓";
var Downarrow = "⇓";
var DownArrowUpArrow = "⇵";
var DownBreve = "̑";
var downdownarrows = "⇊";
var downharpoonleft = "⇃";
var downharpoonright = "⇂";
var DownLeftRightVector = "⥐";
var DownLeftTeeVector = "⥞";
var DownLeftVectorBar = "⥖";
var DownLeftVector = "↽";
var DownRightTeeVector = "⥟";
var DownRightVectorBar = "⥗";
var DownRightVector = "⇁";
var DownTeeArrow = "↧";
var DownTee = "⊤";
var drbkarow = "⤐";
var drcorn = "⌟";
var drcrop = "⌌";
var Dscr = "𝒟";
var dscr = "𝒹";
var DScy = "Ѕ";
var dscy = "ѕ";
var dsol = "⧶";
var Dstrok = "Đ";
var dstrok = "đ";
var dtdot = "⋱";
var dtri = "▿";
var dtrif = "▾";
var duarr = "⇵";
var duhar = "⥯";
var dwangle = "⦦";
var DZcy = "Џ";
var dzcy = "џ";
var dzigrarr = "⟿";
var Eacute = "É";
var eacute = "é";
var easter = "⩮";
var Ecaron = "Ě";
var ecaron = "ě";
var Ecirc = "Ê";
var ecirc = "ê";
var ecir = "≖";
var ecolon = "≕";
var Ecy = "Э";
var ecy = "э";
var eDDot = "⩷";
var Edot = "Ė";
var edot = "ė";
var eDot = "≑";
var ee = "ⅇ";
var efDot = "≒";
var Efr = "𝔈";
var efr = "𝔢";
var eg = "⪚";
var Egrave = "È";
var egrave = "è";
var egs = "⪖";
var egsdot = "⪘";
var el = "⪙";
var Element = "∈";
var elinters = "⏧";
var ell = "ℓ";
var els = "⪕";
var elsdot = "⪗";
var Emacr = "Ē";
var emacr = "ē";
var empty$2 = "∅";
var emptyset = "∅";
var EmptySmallSquare = "◻";
var emptyv = "∅";
var EmptyVerySmallSquare = "▫";
var emsp13 = " ";
var emsp14 = " ";
var emsp = " ";
var ENG = "Ŋ";
var eng = "ŋ";
var ensp = " ";
var Eogon = "Ę";
var eogon = "ę";
var Eopf = "𝔼";
var eopf = "𝕖";
var epar = "⋕";
var eparsl = "⧣";
var eplus = "⩱";
var epsi = "ε";
var Epsilon = "Ε";
var epsilon = "ε";
var epsiv = "ϵ";
var eqcirc = "≖";
var eqcolon = "≕";
var eqsim = "≂";
var eqslantgtr = "⪖";
var eqslantless = "⪕";
var Equal = "⩵";
var equals = "=";
var EqualTilde = "≂";
var equest = "≟";
var Equilibrium = "⇌";
var equiv = "≡";
var equivDD = "⩸";
var eqvparsl = "⧥";
var erarr = "⥱";
var erDot = "≓";
var escr = "ℯ";
var Escr = "ℰ";
var esdot = "≐";
var Esim = "⩳";
var esim = "≂";
var Eta = "Η";
var eta = "η";
var ETH = "Ð";
var eth = "ð";
var Euml = "Ë";
var euml = "ë";
var euro = "€";
var excl = "!";
var exist = "∃";
var Exists = "∃";
var expectation = "ℰ";
var exponentiale = "ⅇ";
var ExponentialE = "ⅇ";
var fallingdotseq = "≒";
var Fcy = "Ф";
var fcy = "ф";
var female = "♀";
var ffilig = "ﬃ";
var fflig = "ﬀ";
var ffllig = "ﬄ";
var Ffr = "𝔉";
var ffr = "𝔣";
var filig = "ﬁ";
var FilledSmallSquare = "◼";
var FilledVerySmallSquare = "▪";
var fjlig = "fj";
var flat = "♭";
var fllig = "ﬂ";
var fltns = "▱";
var fnof = "ƒ";
var Fopf = "𝔽";
var fopf = "𝕗";
var forall = "∀";
var ForAll = "∀";
var fork = "⋔";
var forkv = "⫙";
var Fouriertrf = "ℱ";
var fpartint = "⨍";
var frac12 = "½";
var frac13 = "⅓";
var frac14 = "¼";
var frac15 = "⅕";
var frac16 = "⅙";
var frac18 = "⅛";
var frac23 = "⅔";
var frac25 = "⅖";
var frac34 = "¾";
var frac35 = "⅗";
var frac38 = "⅜";
var frac45 = "⅘";
var frac56 = "⅚";
var frac58 = "⅝";
var frac78 = "⅞";
var frasl = "⁄";
var frown = "⌢";
var fscr = "𝒻";
var Fscr = "ℱ";
var gacute = "ǵ";
var Gamma = "Γ";
var gamma = "γ";
var Gammad = "Ϝ";
var gammad = "ϝ";
var gap = "⪆";
var Gbreve = "Ğ";
var gbreve = "ğ";
var Gcedil = "Ģ";
var Gcirc = "Ĝ";
var gcirc = "ĝ";
var Gcy = "Г";
var gcy = "г";
var Gdot = "Ġ";
var gdot = "ġ";
var ge = "≥";
var gE = "≧";
var gEl = "⪌";
var gel = "⋛";
var geq = "≥";
var geqq = "≧";
var geqslant = "⩾";
var gescc = "⪩";
var ges = "⩾";
var gesdot = "⪀";
var gesdoto = "⪂";
var gesdotol = "⪄";
var gesl = "⋛︀";
var gesles = "⪔";
var Gfr = "𝔊";
var gfr = "𝔤";
var gg = "≫";
var Gg = "⋙";
var ggg = "⋙";
var gimel = "ℷ";
var GJcy = "Ѓ";
var gjcy = "ѓ";
var gla = "⪥";
var gl = "≷";
var glE = "⪒";
var glj = "⪤";
var gnap = "⪊";
var gnapprox = "⪊";
var gne = "⪈";
var gnE = "≩";
var gneq = "⪈";
var gneqq = "≩";
var gnsim = "⋧";
var Gopf = "𝔾";
var gopf = "𝕘";
var grave = "`";
var GreaterEqual = "≥";
var GreaterEqualLess = "⋛";
var GreaterFullEqual = "≧";
var GreaterGreater = "⪢";
var GreaterLess = "≷";
var GreaterSlantEqual = "⩾";
var GreaterTilde = "≳";
var Gscr = "𝒢";
var gscr = "ℊ";
var gsim = "≳";
var gsime = "⪎";
var gsiml = "⪐";
var gtcc = "⪧";
var gtcir = "⩺";
var gt = ">";
var GT = ">";
var Gt = "≫";
var gtdot = "⋗";
var gtlPar = "⦕";
var gtquest = "⩼";
var gtrapprox = "⪆";
var gtrarr = "⥸";
var gtrdot = "⋗";
var gtreqless = "⋛";
var gtreqqless = "⪌";
var gtrless = "≷";
var gtrsim = "≳";
var gvertneqq = "≩︀";
var gvnE = "≩︀";
var Hacek = "ˇ";
var hairsp = " ";
var half = "½";
var hamilt = "ℋ";
var HARDcy = "Ъ";
var hardcy = "ъ";
var harrcir = "⥈";
var harr = "↔";
var hArr = "⇔";
var harrw = "↭";
var Hat = "^";
var hbar = "ℏ";
var Hcirc = "Ĥ";
var hcirc = "ĥ";
var hearts = "♥";
var heartsuit = "♥";
var hellip = "…";
var hercon = "⊹";
var hfr = "𝔥";
var Hfr = "ℌ";
var HilbertSpace = "ℋ";
var hksearow = "⤥";
var hkswarow = "⤦";
var hoarr = "⇿";
var homtht = "∻";
var hookleftarrow = "↩";
var hookrightarrow = "↪";
var hopf = "𝕙";
var Hopf = "ℍ";
var horbar = "―";
var HorizontalLine = "─";
var hscr = "𝒽";
var Hscr = "ℋ";
var hslash = "ℏ";
var Hstrok = "Ħ";
var hstrok = "ħ";
var HumpDownHump = "≎";
var HumpEqual = "≏";
var hybull = "⁃";
var hyphen = "‐";
var Iacute = "Í";
var iacute = "í";
var ic = "⁣";
var Icirc = "Î";
var icirc = "î";
var Icy = "И";
var icy = "и";
var Idot = "İ";
var IEcy = "Е";
var iecy = "е";
var iexcl = "¡";
var iff = "⇔";
var ifr = "𝔦";
var Ifr = "ℑ";
var Igrave = "Ì";
var igrave = "ì";
var ii = "ⅈ";
var iiiint = "⨌";
var iiint = "∭";
var iinfin = "⧜";
var iiota = "℩";
var IJlig = "Ĳ";
var ijlig = "ĳ";
var Imacr = "Ī";
var imacr = "ī";
var image$3 = "ℑ";
var ImaginaryI = "ⅈ";
var imagline = "ℐ";
var imagpart = "ℑ";
var imath = "ı";
var Im = "ℑ";
var imof = "⊷";
var imped = "Ƶ";
var Implies = "⇒";
var incare = "℅";
var infin = "∞";
var infintie = "⧝";
var inodot = "ı";
var intcal = "⊺";
var int = "∫";
var Int = "∬";
var integers = "ℤ";
var Integral = "∫";
var intercal = "⊺";
var Intersection = "⋂";
var intlarhk = "⨗";
var intprod = "⨼";
var InvisibleComma = "⁣";
var InvisibleTimes = "⁢";
var IOcy = "Ё";
var iocy = "ё";
var Iogon = "Į";
var iogon = "į";
var Iopf = "𝕀";
var iopf = "𝕚";
var Iota = "Ι";
var iota = "ι";
var iprod = "⨼";
var iquest = "¿";
var iscr = "𝒾";
var Iscr = "ℐ";
var isin = "∈";
var isindot = "⋵";
var isinE = "⋹";
var isins = "⋴";
var isinsv = "⋳";
var isinv = "∈";
var it = "⁢";
var Itilde = "Ĩ";
var itilde = "ĩ";
var Iukcy = "І";
var iukcy = "і";
var Iuml = "Ï";
var iuml = "ï";
var Jcirc = "Ĵ";
var jcirc = "ĵ";
var Jcy = "Й";
var jcy = "й";
var Jfr = "𝔍";
var jfr = "𝔧";
var jmath = "ȷ";
var Jopf = "𝕁";
var jopf = "𝕛";
var Jscr = "𝒥";
var jscr = "𝒿";
var Jsercy = "Ј";
var jsercy = "ј";
var Jukcy = "Є";
var jukcy = "є";
var Kappa = "Κ";
var kappa = "κ";
var kappav = "ϰ";
var Kcedil = "Ķ";
var kcedil = "ķ";
var Kcy = "К";
var kcy = "к";
var Kfr = "𝔎";
var kfr = "𝔨";
var kgreen = "ĸ";
var KHcy = "Х";
var khcy = "х";
var KJcy = "Ќ";
var kjcy = "ќ";
var Kopf = "𝕂";
var kopf = "𝕜";
var Kscr = "𝒦";
var kscr = "𝓀";
var lAarr = "⇚";
var Lacute = "Ĺ";
var lacute = "ĺ";
var laemptyv = "⦴";
var lagran = "ℒ";
var Lambda = "Λ";
var lambda = "λ";
var lang = "⟨";
var Lang = "⟪";
var langd = "⦑";
var langle = "⟨";
var lap = "⪅";
var Laplacetrf = "ℒ";
var laquo = "«";
var larrb = "⇤";
var larrbfs = "⤟";
var larr = "←";
var Larr = "↞";
var lArr = "⇐";
var larrfs = "⤝";
var larrhk = "↩";
var larrlp = "↫";
var larrpl = "⤹";
var larrsim = "⥳";
var larrtl = "↢";
var latail = "⤙";
var lAtail = "⤛";
var lat = "⪫";
var late = "⪭";
var lates = "⪭︀";
var lbarr = "⤌";
var lBarr = "⤎";
var lbbrk = "❲";
var lbrace = "{";
var lbrack = "[";
var lbrke = "⦋";
var lbrksld = "⦏";
var lbrkslu = "⦍";
var Lcaron = "Ľ";
var lcaron = "ľ";
var Lcedil = "Ļ";
var lcedil = "ļ";
var lceil = "⌈";
var lcub = "{";
var Lcy = "Л";
var lcy = "л";
var ldca = "⤶";
var ldquo = "“";
var ldquor = "„";
var ldrdhar = "⥧";
var ldrushar = "⥋";
var ldsh = "↲";
var le = "≤";
var lE = "≦";
var LeftAngleBracket = "⟨";
var LeftArrowBar = "⇤";
var leftarrow = "←";
var LeftArrow = "←";
var Leftarrow = "⇐";
var LeftArrowRightArrow = "⇆";
var leftarrowtail = "↢";
var LeftCeiling = "⌈";
var LeftDoubleBracket = "⟦";
var LeftDownTeeVector = "⥡";
var LeftDownVectorBar = "⥙";
var LeftDownVector = "⇃";
var LeftFloor = "⌊";
var leftharpoondown = "↽";
var leftharpoonup = "↼";
var leftleftarrows = "⇇";
var leftrightarrow = "↔";
var LeftRightArrow = "↔";
var Leftrightarrow = "⇔";
var leftrightarrows = "⇆";
var leftrightharpoons = "⇋";
var leftrightsquigarrow = "↭";
var LeftRightVector = "⥎";
var LeftTeeArrow = "↤";
var LeftTee = "⊣";
var LeftTeeVector = "⥚";
var leftthreetimes = "⋋";
var LeftTriangleBar = "⧏";
var LeftTriangle = "⊲";
var LeftTriangleEqual = "⊴";
var LeftUpDownVector = "⥑";
var LeftUpTeeVector = "⥠";
var LeftUpVectorBar = "⥘";
var LeftUpVector = "↿";
var LeftVectorBar = "⥒";
var LeftVector = "↼";
var lEg = "⪋";
var leg = "⋚";
var leq = "≤";
var leqq = "≦";
var leqslant = "⩽";
var lescc = "⪨";
var les = "⩽";
var lesdot = "⩿";
var lesdoto = "⪁";
var lesdotor = "⪃";
var lesg = "⋚︀";
var lesges = "⪓";
var lessapprox = "⪅";
var lessdot = "⋖";
var lesseqgtr = "⋚";
var lesseqqgtr = "⪋";
var LessEqualGreater = "⋚";
var LessFullEqual = "≦";
var LessGreater = "≶";
var lessgtr = "≶";
var LessLess = "⪡";
var lesssim = "≲";
var LessSlantEqual = "⩽";
var LessTilde = "≲";
var lfisht = "⥼";
var lfloor = "⌊";
var Lfr = "𝔏";
var lfr = "𝔩";
var lg = "≶";
var lgE = "⪑";
var lHar = "⥢";
var lhard = "↽";
var lharu = "↼";
var lharul = "⥪";
var lhblk = "▄";
var LJcy = "Љ";
var ljcy = "љ";
var llarr = "⇇";
var ll = "≪";
var Ll = "⋘";
var llcorner = "⌞";
var Lleftarrow = "⇚";
var llhard = "⥫";
var lltri = "◺";
var Lmidot = "Ŀ";
var lmidot = "ŀ";
var lmoustache = "⎰";
var lmoust = "⎰";
var lnap = "⪉";
var lnapprox = "⪉";
var lne = "⪇";
var lnE = "≨";
var lneq = "⪇";
var lneqq = "≨";
var lnsim = "⋦";
var loang = "⟬";
var loarr = "⇽";
var lobrk = "⟦";
var longleftarrow = "⟵";
var LongLeftArrow = "⟵";
var Longleftarrow = "⟸";
var longleftrightarrow = "⟷";
var LongLeftRightArrow = "⟷";
var Longleftrightarrow = "⟺";
var longmapsto = "⟼";
var longrightarrow = "⟶";
var LongRightArrow = "⟶";
var Longrightarrow = "⟹";
var looparrowleft = "↫";
var looparrowright = "↬";
var lopar = "⦅";
var Lopf = "𝕃";
var lopf = "𝕝";
var loplus = "⨭";
var lotimes = "⨴";
var lowast = "∗";
var lowbar = "_";
var LowerLeftArrow = "↙";
var LowerRightArrow = "↘";
var loz = "◊";
var lozenge = "◊";
var lozf = "⧫";
var lpar = "(";
var lparlt = "⦓";
var lrarr = "⇆";
var lrcorner = "⌟";
var lrhar = "⇋";
var lrhard = "⥭";
var lrm = "‎";
var lrtri = "⊿";
var lsaquo = "‹";
var lscr = "𝓁";
var Lscr = "ℒ";
var lsh = "↰";
var Lsh = "↰";
var lsim = "≲";
var lsime = "⪍";
var lsimg = "⪏";
var lsqb = "[";
var lsquo = "‘";
var lsquor = "‚";
var Lstrok = "Ł";
var lstrok = "ł";
var ltcc = "⪦";
var ltcir = "⩹";
var lt = "<";
var LT = "<";
var Lt = "≪";
var ltdot = "⋖";
var lthree = "⋋";
var ltimes = "⋉";
var ltlarr = "⥶";
var ltquest = "⩻";
var ltri = "◃";
var ltrie = "⊴";
var ltrif = "◂";
var ltrPar = "⦖";
var lurdshar = "⥊";
var luruhar = "⥦";
var lvertneqq = "≨︀";
var lvnE = "≨︀";
var macr = "¯";
var male = "♂";
var malt = "✠";
var maltese = "✠";
var map$1 = "↦";
var mapsto = "↦";
var mapstodown = "↧";
var mapstoleft = "↤";
var mapstoup = "↥";
var marker = "▮";
var mcomma = "⨩";
var Mcy = "М";
var mcy = "м";
var mdash = "—";
var mDDot = "∺";
var measuredangle = "∡";
var MediumSpace = " ";
var Mellintrf = "ℳ";
var Mfr = "𝔐";
var mfr = "𝔪";
var mho = "℧";
var micro = "µ";
var midast = "*";
var midcir = "⫰";
var mid = "∣";
var middot = "·";
var minusb = "⊟";
var minus = "−";
var minusd = "∸";
var minusdu = "⨪";
var MinusPlus = "∓";
var mlcp = "⫛";
var mldr = "…";
var mnplus = "∓";
var models = "⊧";
var Mopf = "𝕄";
var mopf = "𝕞";
var mp = "∓";
var mscr = "𝓂";
var Mscr = "ℳ";
var mstpos = "∾";
var Mu = "Μ";
var mu = "μ";
var multimap = "⊸";
var mumap = "⊸";
var nabla = "∇";
var Nacute = "Ń";
var nacute = "ń";
var nang = "∠⃒";
var nap = "≉";
var napE = "⩰̸";
var napid = "≋̸";
var napos = "ŉ";
var napprox = "≉";
var natural = "♮";
var naturals = "ℕ";
var natur = "♮";
var nbsp = " ";
var nbump = "≎̸";
var nbumpe = "≏̸";
var ncap = "⩃";
var Ncaron = "Ň";
var ncaron = "ň";
var Ncedil = "Ņ";
var ncedil = "ņ";
var ncong = "≇";
var ncongdot = "⩭̸";
var ncup = "⩂";
var Ncy = "Н";
var ncy = "н";
var ndash = "–";
var nearhk = "⤤";
var nearr = "↗";
var neArr = "⇗";
var nearrow = "↗";
var ne = "≠";
var nedot = "≐̸";
var NegativeMediumSpace = "​";
var NegativeThickSpace = "​";
var NegativeThinSpace = "​";
var NegativeVeryThinSpace = "​";
var nequiv = "≢";
var nesear = "⤨";
var nesim = "≂̸";
var NestedGreaterGreater = "≫";
var NestedLessLess = "≪";
var NewLine = "\n";
var nexist = "∄";
var nexists = "∄";
var Nfr = "𝔑";
var nfr = "𝔫";
var ngE = "≧̸";
var nge = "≱";
var ngeq = "≱";
var ngeqq = "≧̸";
var ngeqslant = "⩾̸";
var nges = "⩾̸";
var nGg = "⋙̸";
var ngsim = "≵";
var nGt = "≫⃒";
var ngt = "≯";
var ngtr = "≯";
var nGtv = "≫̸";
var nharr = "↮";
var nhArr = "⇎";
var nhpar = "⫲";
var ni = "∋";
var nis = "⋼";
var nisd = "⋺";
var niv = "∋";
var NJcy = "Њ";
var njcy = "њ";
var nlarr = "↚";
var nlArr = "⇍";
var nldr = "‥";
var nlE = "≦̸";
var nle = "≰";
var nleftarrow = "↚";
var nLeftarrow = "⇍";
var nleftrightarrow = "↮";
var nLeftrightarrow = "⇎";
var nleq = "≰";
var nleqq = "≦̸";
var nleqslant = "⩽̸";
var nles = "⩽̸";
var nless = "≮";
var nLl = "⋘̸";
var nlsim = "≴";
var nLt = "≪⃒";
var nlt = "≮";
var nltri = "⋪";
var nltrie = "⋬";
var nLtv = "≪̸";
var nmid = "∤";
var NoBreak = "⁠";
var NonBreakingSpace = " ";
var nopf = "𝕟";
var Nopf = "ℕ";
var Not = "⫬";
var not$1 = "¬";
var NotCongruent = "≢";
var NotCupCap = "≭";
var NotDoubleVerticalBar = "∦";
var NotElement = "∉";
var NotEqual = "≠";
var NotEqualTilde = "≂̸";
var NotExists = "∄";
var NotGreater = "≯";
var NotGreaterEqual = "≱";
var NotGreaterFullEqual = "≧̸";
var NotGreaterGreater = "≫̸";
var NotGreaterLess = "≹";
var NotGreaterSlantEqual = "⩾̸";
var NotGreaterTilde = "≵";
var NotHumpDownHump = "≎̸";
var NotHumpEqual = "≏̸";
var notin = "∉";
var notindot = "⋵̸";
var notinE = "⋹̸";
var notinva = "∉";
var notinvb = "⋷";
var notinvc = "⋶";
var NotLeftTriangleBar = "⧏̸";
var NotLeftTriangle = "⋪";
var NotLeftTriangleEqual = "⋬";
var NotLess = "≮";
var NotLessEqual = "≰";
var NotLessGreater = "≸";
var NotLessLess = "≪̸";
var NotLessSlantEqual = "⩽̸";
var NotLessTilde = "≴";
var NotNestedGreaterGreater = "⪢̸";
var NotNestedLessLess = "⪡̸";
var notni = "∌";
var notniva = "∌";
var notnivb = "⋾";
var notnivc = "⋽";
var NotPrecedes = "⊀";
var NotPrecedesEqual = "⪯̸";
var NotPrecedesSlantEqual = "⋠";
var NotReverseElement = "∌";
var NotRightTriangleBar = "⧐̸";
var NotRightTriangle = "⋫";
var NotRightTriangleEqual = "⋭";
var NotSquareSubset = "⊏̸";
var NotSquareSubsetEqual = "⋢";
var NotSquareSuperset = "⊐̸";
var NotSquareSupersetEqual = "⋣";
var NotSubset = "⊂⃒";
var NotSubsetEqual = "⊈";
var NotSucceeds = "⊁";
var NotSucceedsEqual = "⪰̸";
var NotSucceedsSlantEqual = "⋡";
var NotSucceedsTilde = "≿̸";
var NotSuperset = "⊃⃒";
var NotSupersetEqual = "⊉";
var NotTilde = "≁";
var NotTildeEqual = "≄";
var NotTildeFullEqual = "≇";
var NotTildeTilde = "≉";
var NotVerticalBar = "∤";
var nparallel = "∦";
var npar = "∦";
var nparsl = "⫽⃥";
var npart = "∂̸";
var npolint = "⨔";
var npr = "⊀";
var nprcue = "⋠";
var nprec = "⊀";
var npreceq = "⪯̸";
var npre = "⪯̸";
var nrarrc = "⤳̸";
var nrarr = "↛";
var nrArr = "⇏";
var nrarrw = "↝̸";
var nrightarrow = "↛";
var nRightarrow = "⇏";
var nrtri = "⋫";
var nrtrie = "⋭";
var nsc = "⊁";
var nsccue = "⋡";
var nsce = "⪰̸";
var Nscr = "𝒩";
var nscr = "𝓃";
var nshortmid = "∤";
var nshortparallel = "∦";
var nsim = "≁";
var nsime = "≄";
var nsimeq = "≄";
var nsmid = "∤";
var nspar = "∦";
var nsqsube = "⋢";
var nsqsupe = "⋣";
var nsub = "⊄";
var nsubE = "⫅̸";
var nsube = "⊈";
var nsubset = "⊂⃒";
var nsubseteq = "⊈";
var nsubseteqq = "⫅̸";
var nsucc = "⊁";
var nsucceq = "⪰̸";
var nsup = "⊅";
var nsupE = "⫆̸";
var nsupe = "⊉";
var nsupset = "⊃⃒";
var nsupseteq = "⊉";
var nsupseteqq = "⫆̸";
var ntgl = "≹";
var Ntilde = "Ñ";
var ntilde = "ñ";
var ntlg = "≸";
var ntriangleleft = "⋪";
var ntrianglelefteq = "⋬";
var ntriangleright = "⋫";
var ntrianglerighteq = "⋭";
var Nu = "Ν";
var nu = "ν";
var num = "#";
var numero = "№";
var numsp = " ";
var nvap = "≍⃒";
var nvdash = "⊬";
var nvDash = "⊭";
var nVdash = "⊮";
var nVDash = "⊯";
var nvge = "≥⃒";
var nvgt = ">⃒";
var nvHarr = "⤄";
var nvinfin = "⧞";
var nvlArr = "⤂";
var nvle = "≤⃒";
var nvlt = "<⃒";
var nvltrie = "⊴⃒";
var nvrArr = "⤃";
var nvrtrie = "⊵⃒";
var nvsim = "∼⃒";
var nwarhk = "⤣";
var nwarr = "↖";
var nwArr = "⇖";
var nwarrow = "↖";
var nwnear = "⤧";
var Oacute = "Ó";
var oacute = "ó";
var oast = "⊛";
var Ocirc = "Ô";
var ocirc = "ô";
var ocir = "⊚";
var Ocy = "О";
var ocy = "о";
var odash = "⊝";
var Odblac = "Ő";
var odblac = "ő";
var odiv = "⨸";
var odot = "⊙";
var odsold = "⦼";
var OElig = "Œ";
var oelig = "œ";
var ofcir = "⦿";
var Ofr = "𝔒";
var ofr = "𝔬";
var ogon = "˛";
var Ograve = "Ò";
var ograve = "ò";
var ogt = "⧁";
var ohbar = "⦵";
var ohm = "Ω";
var oint = "∮";
var olarr = "↺";
var olcir = "⦾";
var olcross = "⦻";
var oline = "‾";
var olt = "⧀";
var Omacr = "Ō";
var omacr = "ō";
var Omega = "Ω";
var omega = "ω";
var Omicron = "Ο";
var omicron = "ο";
var omid = "⦶";
var ominus = "⊖";
var Oopf = "𝕆";
var oopf = "𝕠";
var opar = "⦷";
var OpenCurlyDoubleQuote = "“";
var OpenCurlyQuote = "‘";
var operp = "⦹";
var oplus = "⊕";
var orarr = "↻";
var Or = "⩔";
var or = "∨";
var ord = "⩝";
var order$1 = "ℴ";
var orderof = "ℴ";
var ordf = "ª";
var ordm = "º";
var origof = "⊶";
var oror = "⩖";
var orslope = "⩗";
var orv = "⩛";
var oS = "Ⓢ";
var Oscr = "𝒪";
var oscr = "ℴ";
var Oslash = "Ø";
var oslash = "ø";
var osol = "⊘";
var Otilde = "Õ";
var otilde = "õ";
var otimesas = "⨶";
var Otimes = "⨷";
var otimes = "⊗";
var Ouml = "Ö";
var ouml = "ö";
var ovbar = "⌽";
var OverBar = "‾";
var OverBrace = "⏞";
var OverBracket = "⎴";
var OverParenthesis = "⏜";
var para = "¶";
var parallel = "∥";
var par = "∥";
var parsim = "⫳";
var parsl = "⫽";
var part = "∂";
var PartialD = "∂";
var Pcy = "П";
var pcy = "п";
var percnt = "%";
var period = ".";
var permil = "‰";
var perp = "⊥";
var pertenk = "‱";
var Pfr = "𝔓";
var pfr = "𝔭";
var Phi = "Φ";
var phi = "φ";
var phiv = "ϕ";
var phmmat = "ℳ";
var phone = "☎";
var Pi = "Π";
var pi = "π";
var pitchfork = "⋔";
var piv = "ϖ";
var planck = "ℏ";
var planckh = "ℎ";
var plankv = "ℏ";
var plusacir = "⨣";
var plusb = "⊞";
var pluscir = "⨢";
var plus = "+";
var plusdo = "∔";
var plusdu = "⨥";
var pluse = "⩲";
var PlusMinus = "±";
var plusmn = "±";
var plussim = "⨦";
var plustwo = "⨧";
var pm = "±";
var Poincareplane = "ℌ";
var pointint = "⨕";
var popf = "𝕡";
var Popf = "ℙ";
var pound = "£";
var prap = "⪷";
var Pr = "⪻";
var pr = "≺";
var prcue = "≼";
var precapprox = "⪷";
var prec = "≺";
var preccurlyeq = "≼";
var Precedes = "≺";
var PrecedesEqual = "⪯";
var PrecedesSlantEqual = "≼";
var PrecedesTilde = "≾";
var preceq = "⪯";
var precnapprox = "⪹";
var precneqq = "⪵";
var precnsim = "⋨";
var pre = "⪯";
var prE = "⪳";
var precsim = "≾";
var prime = "′";
var Prime = "″";
var primes = "ℙ";
var prnap = "⪹";
var prnE = "⪵";
var prnsim = "⋨";
var prod = "∏";
var Product = "∏";
var profalar = "⌮";
var profline = "⌒";
var profsurf = "⌓";
var prop = "∝";
var Proportional = "∝";
var Proportion = "∷";
var propto = "∝";
var prsim = "≾";
var prurel = "⊰";
var Pscr = "𝒫";
var pscr = "𝓅";
var Psi = "Ψ";
var psi = "ψ";
var puncsp = " ";
var Qfr = "𝔔";
var qfr = "𝔮";
var qint = "⨌";
var qopf = "𝕢";
var Qopf = "ℚ";
var qprime = "⁗";
var Qscr = "𝒬";
var qscr = "𝓆";
var quaternions = "ℍ";
var quatint = "⨖";
var quest = "?";
var questeq = "≟";
var quot = "\"";
var QUOT = "\"";
var rAarr = "⇛";
var race = "∽̱";
var Racute = "Ŕ";
var racute = "ŕ";
var radic = "√";
var raemptyv = "⦳";
var rang = "⟩";
var Rang = "⟫";
var rangd = "⦒";
var range = "⦥";
var rangle = "⟩";
var raquo = "»";
var rarrap = "⥵";
var rarrb = "⇥";
var rarrbfs = "⤠";
var rarrc = "⤳";
var rarr = "→";
var Rarr = "↠";
var rArr = "⇒";
var rarrfs = "⤞";
var rarrhk = "↪";
var rarrlp = "↬";
var rarrpl = "⥅";
var rarrsim = "⥴";
var Rarrtl = "⤖";
var rarrtl = "↣";
var rarrw = "↝";
var ratail = "⤚";
var rAtail = "⤜";
var ratio = "∶";
var rationals = "ℚ";
var rbarr = "⤍";
var rBarr = "⤏";
var RBarr = "⤐";
var rbbrk = "❳";
var rbrace = "}";
var rbrack = "]";
var rbrke = "⦌";
var rbrksld = "⦎";
var rbrkslu = "⦐";
var Rcaron = "Ř";
var rcaron = "ř";
var Rcedil = "Ŗ";
var rcedil = "ŗ";
var rceil = "⌉";
var rcub = "}";
var Rcy = "Р";
var rcy = "р";
var rdca = "⤷";
var rdldhar = "⥩";
var rdquo = "”";
var rdquor = "”";
var rdsh = "↳";
var real = "ℜ";
var realine = "ℛ";
var realpart = "ℜ";
var reals = "ℝ";
var Re = "ℜ";
var rect = "▭";
var reg = "®";
var REG = "®";
var ReverseElement = "∋";
var ReverseEquilibrium = "⇋";
var ReverseUpEquilibrium = "⥯";
var rfisht = "⥽";
var rfloor = "⌋";
var rfr = "𝔯";
var Rfr = "ℜ";
var rHar = "⥤";
var rhard = "⇁";
var rharu = "⇀";
var rharul = "⥬";
var Rho = "Ρ";
var rho = "ρ";
var rhov = "ϱ";
var RightAngleBracket = "⟩";
var RightArrowBar = "⇥";
var rightarrow = "→";
var RightArrow = "→";
var Rightarrow = "⇒";
var RightArrowLeftArrow = "⇄";
var rightarrowtail = "↣";
var RightCeiling = "⌉";
var RightDoubleBracket = "⟧";
var RightDownTeeVector = "⥝";
var RightDownVectorBar = "⥕";
var RightDownVector = "⇂";
var RightFloor = "⌋";
var rightharpoondown = "⇁";
var rightharpoonup = "⇀";
var rightleftarrows = "⇄";
var rightleftharpoons = "⇌";
var rightrightarrows = "⇉";
var rightsquigarrow = "↝";
var RightTeeArrow = "↦";
var RightTee = "⊢";
var RightTeeVector = "⥛";
var rightthreetimes = "⋌";
var RightTriangleBar = "⧐";
var RightTriangle = "⊳";
var RightTriangleEqual = "⊵";
var RightUpDownVector = "⥏";
var RightUpTeeVector = "⥜";
var RightUpVectorBar = "⥔";
var RightUpVector = "↾";
var RightVectorBar = "⥓";
var RightVector = "⇀";
var ring = "˚";
var risingdotseq = "≓";
var rlarr = "⇄";
var rlhar = "⇌";
var rlm = "‏";
var rmoustache = "⎱";
var rmoust = "⎱";
var rnmid = "⫮";
var roang = "⟭";
var roarr = "⇾";
var robrk = "⟧";
var ropar = "⦆";
var ropf = "𝕣";
var Ropf = "ℝ";
var roplus = "⨮";
var rotimes = "⨵";
var RoundImplies = "⥰";
var rpar = ")";
var rpargt = "⦔";
var rppolint = "⨒";
var rrarr = "⇉";
var Rrightarrow = "⇛";
var rsaquo = "›";
var rscr = "𝓇";
var Rscr = "ℛ";
var rsh = "↱";
var Rsh = "↱";
var rsqb = "]";
var rsquo = "’";
var rsquor = "’";
var rthree = "⋌";
var rtimes = "⋊";
var rtri = "▹";
var rtrie = "⊵";
var rtrif = "▸";
var rtriltri = "⧎";
var RuleDelayed = "⧴";
var ruluhar = "⥨";
var rx = "℞";
var Sacute = "Ś";
var sacute = "ś";
var sbquo = "‚";
var scap = "⪸";
var Scaron = "Š";
var scaron = "š";
var Sc = "⪼";
var sc = "≻";
var sccue = "≽";
var sce = "⪰";
var scE = "⪴";
var Scedil = "Ş";
var scedil = "ş";
var Scirc = "Ŝ";
var scirc = "ŝ";
var scnap = "⪺";
var scnE = "⪶";
var scnsim = "⋩";
var scpolint = "⨓";
var scsim = "≿";
var Scy = "С";
var scy = "с";
var sdotb = "⊡";
var sdot = "⋅";
var sdote = "⩦";
var searhk = "⤥";
var searr = "↘";
var seArr = "⇘";
var searrow = "↘";
var sect = "§";
var semi = ";";
var seswar = "⤩";
var setminus = "∖";
var setmn = "∖";
var sext = "✶";
var Sfr = "𝔖";
var sfr = "𝔰";
var sfrown = "⌢";
var sharp = "♯";
var SHCHcy = "Щ";
var shchcy = "щ";
var SHcy = "Ш";
var shcy = "ш";
var ShortDownArrow = "↓";
var ShortLeftArrow = "←";
var shortmid = "∣";
var shortparallel = "∥";
var ShortRightArrow = "→";
var ShortUpArrow = "↑";
var shy = "­";
var Sigma = "Σ";
var sigma = "σ";
var sigmaf = "ς";
var sigmav = "ς";
var sim = "∼";
var simdot = "⩪";
var sime = "≃";
var simeq = "≃";
var simg = "⪞";
var simgE = "⪠";
var siml = "⪝";
var simlE = "⪟";
var simne = "≆";
var simplus = "⨤";
var simrarr = "⥲";
var slarr = "←";
var SmallCircle = "∘";
var smallsetminus = "∖";
var smashp = "⨳";
var smeparsl = "⧤";
var smid = "∣";
var smile = "⌣";
var smt = "⪪";
var smte = "⪬";
var smtes = "⪬︀";
var SOFTcy = "Ь";
var softcy = "ь";
var solbar = "⌿";
var solb = "⧄";
var sol = "/";
var Sopf = "𝕊";
var sopf = "𝕤";
var spades = "♠";
var spadesuit = "♠";
var spar = "∥";
var sqcap = "⊓";
var sqcaps = "⊓︀";
var sqcup = "⊔";
var sqcups = "⊔︀";
var Sqrt = "√";
var sqsub = "⊏";
var sqsube = "⊑";
var sqsubset = "⊏";
var sqsubseteq = "⊑";
var sqsup = "⊐";
var sqsupe = "⊒";
var sqsupset = "⊐";
var sqsupseteq = "⊒";
var square = "□";
var Square = "□";
var SquareIntersection = "⊓";
var SquareSubset = "⊏";
var SquareSubsetEqual = "⊑";
var SquareSuperset = "⊐";
var SquareSupersetEqual = "⊒";
var SquareUnion = "⊔";
var squarf = "▪";
var squ = "□";
var squf = "▪";
var srarr = "→";
var Sscr = "𝒮";
var sscr = "𝓈";
var ssetmn = "∖";
var ssmile = "⌣";
var sstarf = "⋆";
var Star = "⋆";
var star = "☆";
var starf = "★";
var straightepsilon = "ϵ";
var straightphi = "ϕ";
var strns = "¯";
var sub = "⊂";
var Sub = "⋐";
var subdot = "⪽";
var subE = "⫅";
var sube = "⊆";
var subedot = "⫃";
var submult = "⫁";
var subnE = "⫋";
var subne = "⊊";
var subplus = "⪿";
var subrarr = "⥹";
var subset = "⊂";
var Subset = "⋐";
var subseteq = "⊆";
var subseteqq = "⫅";
var SubsetEqual = "⊆";
var subsetneq = "⊊";
var subsetneqq = "⫋";
var subsim = "⫇";
var subsub = "⫕";
var subsup = "⫓";
var succapprox = "⪸";
var succ = "≻";
var succcurlyeq = "≽";
var Succeeds = "≻";
var SucceedsEqual = "⪰";
var SucceedsSlantEqual = "≽";
var SucceedsTilde = "≿";
var succeq = "⪰";
var succnapprox = "⪺";
var succneqq = "⪶";
var succnsim = "⋩";
var succsim = "≿";
var SuchThat = "∋";
var sum = "∑";
var Sum = "∑";
var sung = "♪";
var sup1 = "¹";
var sup2 = "²";
var sup3 = "³";
var sup = "⊃";
var Sup = "⋑";
var supdot = "⪾";
var supdsub = "⫘";
var supE = "⫆";
var supe = "⊇";
var supedot = "⫄";
var Superset = "⊃";
var SupersetEqual = "⊇";
var suphsol = "⟉";
var suphsub = "⫗";
var suplarr = "⥻";
var supmult = "⫂";
var supnE = "⫌";
var supne = "⊋";
var supplus = "⫀";
var supset = "⊃";
var Supset = "⋑";
var supseteq = "⊇";
var supseteqq = "⫆";
var supsetneq = "⊋";
var supsetneqq = "⫌";
var supsim = "⫈";
var supsub = "⫔";
var supsup = "⫖";
var swarhk = "⤦";
var swarr = "↙";
var swArr = "⇙";
var swarrow = "↙";
var swnwar = "⤪";
var szlig = "ß";
var Tab = "\t";
var target = "⌖";
var Tau = "Τ";
var tau = "τ";
var tbrk = "⎴";
var Tcaron = "Ť";
var tcaron = "ť";
var Tcedil = "Ţ";
var tcedil = "ţ";
var Tcy = "Т";
var tcy = "т";
var tdot = "⃛";
var telrec = "⌕";
var Tfr = "𝔗";
var tfr = "𝔱";
var there4 = "∴";
var therefore = "∴";
var Therefore = "∴";
var Theta = "Θ";
var theta = "θ";
var thetasym = "ϑ";
var thetav = "ϑ";
var thickapprox = "≈";
var thicksim = "∼";
var ThickSpace = "  ";
var ThinSpace = " ";
var thinsp = " ";
var thkap = "≈";
var thksim = "∼";
var THORN = "Þ";
var thorn = "þ";
var tilde = "˜";
var Tilde = "∼";
var TildeEqual = "≃";
var TildeFullEqual = "≅";
var TildeTilde = "≈";
var timesbar = "⨱";
var timesb = "⊠";
var times = "×";
var timesd = "⨰";
var tint = "∭";
var toea = "⤨";
var topbot = "⌶";
var topcir = "⫱";
var top = "⊤";
var Topf = "𝕋";
var topf = "𝕥";
var topfork = "⫚";
var tosa = "⤩";
var tprime = "‴";
var trade = "™";
var TRADE = "™";
var triangle = "▵";
var triangledown = "▿";
var triangleleft = "◃";
var trianglelefteq = "⊴";
var triangleq = "≜";
var triangleright = "▹";
var trianglerighteq = "⊵";
var tridot = "◬";
var trie = "≜";
var triminus = "⨺";
var TripleDot = "⃛";
var triplus = "⨹";
var trisb = "⧍";
var tritime = "⨻";
var trpezium = "⏢";
var Tscr = "𝒯";
var tscr = "𝓉";
var TScy = "Ц";
var tscy = "ц";
var TSHcy = "Ћ";
var tshcy = "ћ";
var Tstrok = "Ŧ";
var tstrok = "ŧ";
var twixt = "≬";
var twoheadleftarrow = "↞";
var twoheadrightarrow = "↠";
var Uacute = "Ú";
var uacute = "ú";
var uarr = "↑";
var Uarr = "↟";
var uArr = "⇑";
var Uarrocir = "⥉";
var Ubrcy = "Ў";
var ubrcy = "ў";
var Ubreve = "Ŭ";
var ubreve = "ŭ";
var Ucirc = "Û";
var ucirc = "û";
var Ucy = "У";
var ucy = "у";
var udarr = "⇅";
var Udblac = "Ű";
var udblac = "ű";
var udhar = "⥮";
var ufisht = "⥾";
var Ufr = "𝔘";
var ufr = "𝔲";
var Ugrave = "Ù";
var ugrave = "ù";
var uHar = "⥣";
var uharl = "↿";
var uharr = "↾";
var uhblk = "▀";
var ulcorn = "⌜";
var ulcorner = "⌜";
var ulcrop = "⌏";
var ultri = "◸";
var Umacr = "Ū";
var umacr = "ū";
var uml = "¨";
var UnderBar = "_";
var UnderBrace = "⏟";
var UnderBracket = "⎵";
var UnderParenthesis = "⏝";
var Union = "⋃";
var UnionPlus = "⊎";
var Uogon = "Ų";
var uogon = "ų";
var Uopf = "𝕌";
var uopf = "𝕦";
var UpArrowBar = "⤒";
var uparrow = "↑";
var UpArrow = "↑";
var Uparrow = "⇑";
var UpArrowDownArrow = "⇅";
var updownarrow = "↕";
var UpDownArrow = "↕";
var Updownarrow = "⇕";
var UpEquilibrium = "⥮";
var upharpoonleft = "↿";
var upharpoonright = "↾";
var uplus = "⊎";
var UpperLeftArrow = "↖";
var UpperRightArrow = "↗";
var upsi = "υ";
var Upsi = "ϒ";
var upsih = "ϒ";
var Upsilon = "Υ";
var upsilon = "υ";
var UpTeeArrow = "↥";
var UpTee = "⊥";
var upuparrows = "⇈";
var urcorn = "⌝";
var urcorner = "⌝";
var urcrop = "⌎";
var Uring = "Ů";
var uring = "ů";
var urtri = "◹";
var Uscr = "𝒰";
var uscr = "𝓊";
var utdot = "⋰";
var Utilde = "Ũ";
var utilde = "ũ";
var utri = "▵";
var utrif = "▴";
var uuarr = "⇈";
var Uuml = "Ü";
var uuml = "ü";
var uwangle = "⦧";
var vangrt = "⦜";
var varepsilon = "ϵ";
var varkappa = "ϰ";
var varnothing = "∅";
var varphi = "ϕ";
var varpi = "ϖ";
var varpropto = "∝";
var varr = "↕";
var vArr = "⇕";
var varrho = "ϱ";
var varsigma = "ς";
var varsubsetneq = "⊊︀";
var varsubsetneqq = "⫋︀";
var varsupsetneq = "⊋︀";
var varsupsetneqq = "⫌︀";
var vartheta = "ϑ";
var vartriangleleft = "⊲";
var vartriangleright = "⊳";
var vBar = "⫨";
var Vbar = "⫫";
var vBarv = "⫩";
var Vcy = "В";
var vcy = "в";
var vdash = "⊢";
var vDash = "⊨";
var Vdash = "⊩";
var VDash = "⊫";
var Vdashl = "⫦";
var veebar = "⊻";
var vee = "∨";
var Vee = "⋁";
var veeeq = "≚";
var vellip = "⋮";
var verbar = "|";
var Verbar = "‖";
var vert = "|";
var Vert = "‖";
var VerticalBar = "∣";
var VerticalLine = "|";
var VerticalSeparator = "❘";
var VerticalTilde = "≀";
var VeryThinSpace = " ";
var Vfr = "𝔙";
var vfr = "𝔳";
var vltri = "⊲";
var vnsub = "⊂⃒";
var vnsup = "⊃⃒";
var Vopf = "𝕍";
var vopf = "𝕧";
var vprop = "∝";
var vrtri = "⊳";
var Vscr = "𝒱";
var vscr = "𝓋";
var vsubnE = "⫋︀";
var vsubne = "⊊︀";
var vsupnE = "⫌︀";
var vsupne = "⊋︀";
var Vvdash = "⊪";
var vzigzag = "⦚";
var Wcirc = "Ŵ";
var wcirc = "ŵ";
var wedbar = "⩟";
var wedge = "∧";
var Wedge = "⋀";
var wedgeq = "≙";
var weierp = "℘";
var Wfr = "𝔚";
var wfr = "𝔴";
var Wopf = "𝕎";
var wopf = "𝕨";
var wp = "℘";
var wr = "≀";
var wreath = "≀";
var Wscr = "𝒲";
var wscr = "𝓌";
var xcap = "⋂";
var xcirc = "◯";
var xcup = "⋃";
var xdtri = "▽";
var Xfr = "𝔛";
var xfr = "𝔵";
var xharr = "⟷";
var xhArr = "⟺";
var Xi = "Ξ";
var xi = "ξ";
var xlarr = "⟵";
var xlArr = "⟸";
var xmap = "⟼";
var xnis = "⋻";
var xodot = "⨀";
var Xopf = "𝕏";
var xopf = "𝕩";
var xoplus = "⨁";
var xotime = "⨂";
var xrarr = "⟶";
var xrArr = "⟹";
var Xscr = "𝒳";
var xscr = "𝓍";
var xsqcup = "⨆";
var xuplus = "⨄";
var xutri = "△";
var xvee = "⋁";
var xwedge = "⋀";
var Yacute = "Ý";
var yacute = "ý";
var YAcy = "Я";
var yacy = "я";
var Ycirc = "Ŷ";
var ycirc = "ŷ";
var Ycy = "Ы";
var ycy = "ы";
var yen = "¥";
var Yfr = "𝔜";
var yfr = "𝔶";
var YIcy = "Ї";
var yicy = "ї";
var Yopf = "𝕐";
var yopf = "𝕪";
var Yscr = "𝒴";
var yscr = "𝓎";
var YUcy = "Ю";
var yucy = "ю";
var yuml = "ÿ";
var Yuml = "Ÿ";
var Zacute = "Ź";
var zacute = "ź";
var Zcaron = "Ž";
var zcaron = "ž";
var Zcy = "З";
var zcy = "з";
var Zdot = "Ż";
var zdot = "ż";
var zeetrf = "ℨ";
var ZeroWidthSpace = "​";
var Zeta = "Ζ";
var zeta = "ζ";
var zfr = "𝔷";
var Zfr = "ℨ";
var ZHcy = "Ж";
var zhcy = "ж";
var zigrarr = "⇝";
var zopf = "𝕫";
var Zopf = "ℤ";
var Zscr = "𝒵";
var zscr = "𝓏";
var zwj = "‍";
var zwnj = "‌";
var require$$0 = {
	Aacute: Aacute,
	aacute: aacute,
	Abreve: Abreve,
	abreve: abreve,
	ac: ac,
	acd: acd,
	acE: acE,
	Acirc: Acirc,
	acirc: acirc,
	acute: acute,
	Acy: Acy,
	acy: acy,
	AElig: AElig,
	aelig: aelig,
	af: af,
	Afr: Afr,
	afr: afr,
	Agrave: Agrave,
	agrave: agrave,
	alefsym: alefsym,
	aleph: aleph,
	Alpha: Alpha,
	alpha: alpha,
	Amacr: Amacr,
	amacr: amacr,
	amalg: amalg,
	amp: amp,
	AMP: AMP,
	andand: andand,
	And: And,
	and: and,
	andd: andd,
	andslope: andslope,
	andv: andv,
	ang: ang,
	ange: ange,
	angle: angle,
	angmsdaa: angmsdaa,
	angmsdab: angmsdab,
	angmsdac: angmsdac,
	angmsdad: angmsdad,
	angmsdae: angmsdae,
	angmsdaf: angmsdaf,
	angmsdag: angmsdag,
	angmsdah: angmsdah,
	angmsd: angmsd,
	angrt: angrt,
	angrtvb: angrtvb,
	angrtvbd: angrtvbd,
	angsph: angsph,
	angst: angst,
	angzarr: angzarr,
	Aogon: Aogon,
	aogon: aogon,
	Aopf: Aopf,
	aopf: aopf,
	apacir: apacir,
	ap: ap,
	apE: apE,
	ape: ape,
	apid: apid,
	apos: apos,
	ApplyFunction: ApplyFunction,
	approx: approx,
	approxeq: approxeq,
	Aring: Aring,
	aring: aring,
	Ascr: Ascr,
	ascr: ascr,
	Assign: Assign,
	ast: ast,
	asymp: asymp,
	asympeq: asympeq,
	Atilde: Atilde,
	atilde: atilde,
	Auml: Auml,
	auml: auml,
	awconint: awconint,
	awint: awint,
	backcong: backcong,
	backepsilon: backepsilon,
	backprime: backprime,
	backsim: backsim,
	backsimeq: backsimeq,
	Backslash: Backslash,
	Barv: Barv,
	barvee: barvee,
	barwed: barwed,
	Barwed: Barwed,
	barwedge: barwedge,
	bbrk: bbrk,
	bbrktbrk: bbrktbrk,
	bcong: bcong,
	Bcy: Bcy,
	bcy: bcy,
	bdquo: bdquo,
	becaus: becaus,
	because: because,
	Because: Because,
	bemptyv: bemptyv,
	bepsi: bepsi,
	bernou: bernou,
	Bernoullis: Bernoullis,
	Beta: Beta,
	beta: beta,
	beth: beth,
	between: between,
	Bfr: Bfr,
	bfr: bfr,
	bigcap: bigcap,
	bigcirc: bigcirc,
	bigcup: bigcup,
	bigodot: bigodot,
	bigoplus: bigoplus,
	bigotimes: bigotimes,
	bigsqcup: bigsqcup,
	bigstar: bigstar,
	bigtriangledown: bigtriangledown,
	bigtriangleup: bigtriangleup,
	biguplus: biguplus,
	bigvee: bigvee,
	bigwedge: bigwedge,
	bkarow: bkarow,
	blacklozenge: blacklozenge,
	blacksquare: blacksquare,
	blacktriangle: blacktriangle,
	blacktriangledown: blacktriangledown,
	blacktriangleleft: blacktriangleleft,
	blacktriangleright: blacktriangleright,
	blank: blank,
	blk12: blk12,
	blk14: blk14,
	blk34: blk34,
	block: block$2,
	bne: bne,
	bnequiv: bnequiv,
	bNot: bNot,
	bnot: bnot,
	Bopf: Bopf,
	bopf: bopf,
	bot: bot,
	bottom: bottom,
	bowtie: bowtie,
	boxbox: boxbox,
	boxdl: boxdl,
	boxdL: boxdL,
	boxDl: boxDl,
	boxDL: boxDL,
	boxdr: boxdr,
	boxdR: boxdR,
	boxDr: boxDr,
	boxDR: boxDR,
	boxh: boxh,
	boxH: boxH,
	boxhd: boxhd,
	boxHd: boxHd,
	boxhD: boxhD,
	boxHD: boxHD,
	boxhu: boxhu,
	boxHu: boxHu,
	boxhU: boxhU,
	boxHU: boxHU,
	boxminus: boxminus,
	boxplus: boxplus,
	boxtimes: boxtimes,
	boxul: boxul,
	boxuL: boxuL,
	boxUl: boxUl,
	boxUL: boxUL,
	boxur: boxur,
	boxuR: boxuR,
	boxUr: boxUr,
	boxUR: boxUR,
	boxv: boxv,
	boxV: boxV,
	boxvh: boxvh,
	boxvH: boxvH,
	boxVh: boxVh,
	boxVH: boxVH,
	boxvl: boxvl,
	boxvL: boxvL,
	boxVl: boxVl,
	boxVL: boxVL,
	boxvr: boxvr,
	boxvR: boxvR,
	boxVr: boxVr,
	boxVR: boxVR,
	bprime: bprime,
	breve: breve,
	Breve: Breve,
	brvbar: brvbar,
	bscr: bscr,
	Bscr: Bscr,
	bsemi: bsemi,
	bsim: bsim,
	bsime: bsime,
	bsolb: bsolb,
	bsol: bsol,
	bsolhsub: bsolhsub,
	bull: bull,
	bullet: bullet,
	bump: bump,
	bumpE: bumpE,
	bumpe: bumpe,
	Bumpeq: Bumpeq,
	bumpeq: bumpeq,
	Cacute: Cacute,
	cacute: cacute,
	capand: capand,
	capbrcup: capbrcup,
	capcap: capcap,
	cap: cap$1,
	Cap: Cap,
	capcup: capcup,
	capdot: capdot,
	CapitalDifferentialD: CapitalDifferentialD,
	caps: caps,
	caret: caret,
	caron: caron,
	Cayleys: Cayleys,
	ccaps: ccaps,
	Ccaron: Ccaron,
	ccaron: ccaron,
	Ccedil: Ccedil,
	ccedil: ccedil,
	Ccirc: Ccirc,
	ccirc: ccirc,
	Cconint: Cconint,
	ccups: ccups,
	ccupssm: ccupssm,
	Cdot: Cdot,
	cdot: cdot,
	cedil: cedil,
	Cedilla: Cedilla,
	cemptyv: cemptyv,
	cent: cent,
	centerdot: centerdot,
	CenterDot: CenterDot,
	cfr: cfr,
	Cfr: Cfr,
	CHcy: CHcy,
	chcy: chcy,
	check: check,
	checkmark: checkmark,
	Chi: Chi,
	chi: chi,
	circ: circ,
	circeq: circeq,
	circlearrowleft: circlearrowleft,
	circlearrowright: circlearrowright,
	circledast: circledast,
	circledcirc: circledcirc,
	circleddash: circleddash,
	CircleDot: CircleDot,
	circledR: circledR,
	circledS: circledS,
	CircleMinus: CircleMinus,
	CirclePlus: CirclePlus,
	CircleTimes: CircleTimes,
	cir: cir,
	cirE: cirE,
	cire: cire,
	cirfnint: cirfnint,
	cirmid: cirmid,
	cirscir: cirscir,
	ClockwiseContourIntegral: ClockwiseContourIntegral,
	CloseCurlyDoubleQuote: CloseCurlyDoubleQuote,
	CloseCurlyQuote: CloseCurlyQuote,
	clubs: clubs,
	clubsuit: clubsuit,
	colon: colon,
	Colon: Colon,
	Colone: Colone,
	colone: colone,
	coloneq: coloneq,
	comma: comma,
	commat: commat,
	comp: comp,
	compfn: compfn,
	complement: complement,
	complexes: complexes,
	cong: cong,
	congdot: congdot,
	Congruent: Congruent,
	conint: conint,
	Conint: Conint,
	ContourIntegral: ContourIntegral,
	copf: copf,
	Copf: Copf,
	coprod: coprod,
	Coproduct: Coproduct,
	copy: copy,
	COPY: COPY,
	copysr: copysr,
	CounterClockwiseContourIntegral: CounterClockwiseContourIntegral,
	crarr: crarr,
	cross: cross,
	Cross: Cross,
	Cscr: Cscr,
	cscr: cscr,
	csub: csub,
	csube: csube,
	csup: csup,
	csupe: csupe,
	ctdot: ctdot,
	cudarrl: cudarrl,
	cudarrr: cudarrr,
	cuepr: cuepr,
	cuesc: cuesc,
	cularr: cularr,
	cularrp: cularrp,
	cupbrcap: cupbrcap,
	cupcap: cupcap,
	CupCap: CupCap,
	cup: cup,
	Cup: Cup,
	cupcup: cupcup,
	cupdot: cupdot,
	cupor: cupor,
	cups: cups,
	curarr: curarr,
	curarrm: curarrm,
	curlyeqprec: curlyeqprec,
	curlyeqsucc: curlyeqsucc,
	curlyvee: curlyvee,
	curlywedge: curlywedge,
	curren: curren,
	curvearrowleft: curvearrowleft,
	curvearrowright: curvearrowright,
	cuvee: cuvee,
	cuwed: cuwed,
	cwconint: cwconint,
	cwint: cwint,
	cylcty: cylcty,
	dagger: dagger,
	Dagger: Dagger,
	daleth: daleth,
	darr: darr,
	Darr: Darr,
	dArr: dArr,
	dash: dash$1,
	Dashv: Dashv,
	dashv: dashv,
	dbkarow: dbkarow,
	dblac: dblac,
	Dcaron: Dcaron,
	dcaron: dcaron,
	Dcy: Dcy,
	dcy: dcy,
	ddagger: ddagger,
	ddarr: ddarr,
	DD: DD,
	dd: dd$1,
	DDotrahd: DDotrahd,
	ddotseq: ddotseq,
	deg: deg,
	Del: Del,
	Delta: Delta,
	delta: delta,
	demptyv: demptyv,
	dfisht: dfisht,
	Dfr: Dfr,
	dfr: dfr,
	dHar: dHar,
	dharl: dharl,
	dharr: dharr,
	DiacriticalAcute: DiacriticalAcute,
	DiacriticalDot: DiacriticalDot,
	DiacriticalDoubleAcute: DiacriticalDoubleAcute,
	DiacriticalGrave: DiacriticalGrave,
	DiacriticalTilde: DiacriticalTilde,
	diam: diam,
	diamond: diamond,
	Diamond: Diamond,
	diamondsuit: diamondsuit,
	diams: diams,
	die: die,
	DifferentialD: DifferentialD,
	digamma: digamma,
	disin: disin,
	div: div,
	divide: divide,
	divideontimes: divideontimes,
	divonx: divonx,
	DJcy: DJcy,
	djcy: djcy,
	dlcorn: dlcorn,
	dlcrop: dlcrop,
	dollar: dollar,
	Dopf: Dopf,
	dopf: dopf,
	Dot: Dot,
	dot: dot,
	DotDot: DotDot,
	doteq: doteq,
	doteqdot: doteqdot,
	DotEqual: DotEqual,
	dotminus: dotminus,
	dotplus: dotplus,
	dotsquare: dotsquare,
	doublebarwedge: doublebarwedge,
	DoubleContourIntegral: DoubleContourIntegral,
	DoubleDot: DoubleDot,
	DoubleDownArrow: DoubleDownArrow,
	DoubleLeftArrow: DoubleLeftArrow,
	DoubleLeftRightArrow: DoubleLeftRightArrow,
	DoubleLeftTee: DoubleLeftTee,
	DoubleLongLeftArrow: DoubleLongLeftArrow,
	DoubleLongLeftRightArrow: DoubleLongLeftRightArrow,
	DoubleLongRightArrow: DoubleLongRightArrow,
	DoubleRightArrow: DoubleRightArrow,
	DoubleRightTee: DoubleRightTee,
	DoubleUpArrow: DoubleUpArrow,
	DoubleUpDownArrow: DoubleUpDownArrow,
	DoubleVerticalBar: DoubleVerticalBar,
	DownArrowBar: DownArrowBar,
	downarrow: downarrow,
	DownArrow: DownArrow,
	Downarrow: Downarrow,
	DownArrowUpArrow: DownArrowUpArrow,
	DownBreve: DownBreve,
	downdownarrows: downdownarrows,
	downharpoonleft: downharpoonleft,
	downharpoonright: downharpoonright,
	DownLeftRightVector: DownLeftRightVector,
	DownLeftTeeVector: DownLeftTeeVector,
	DownLeftVectorBar: DownLeftVectorBar,
	DownLeftVector: DownLeftVector,
	DownRightTeeVector: DownRightTeeVector,
	DownRightVectorBar: DownRightVectorBar,
	DownRightVector: DownRightVector,
	DownTeeArrow: DownTeeArrow,
	DownTee: DownTee,
	drbkarow: drbkarow,
	drcorn: drcorn,
	drcrop: drcrop,
	Dscr: Dscr,
	dscr: dscr,
	DScy: DScy,
	dscy: dscy,
	dsol: dsol,
	Dstrok: Dstrok,
	dstrok: dstrok,
	dtdot: dtdot,
	dtri: dtri,
	dtrif: dtrif,
	duarr: duarr,
	duhar: duhar,
	dwangle: dwangle,
	DZcy: DZcy,
	dzcy: dzcy,
	dzigrarr: dzigrarr,
	Eacute: Eacute,
	eacute: eacute,
	easter: easter,
	Ecaron: Ecaron,
	ecaron: ecaron,
	Ecirc: Ecirc,
	ecirc: ecirc,
	ecir: ecir,
	ecolon: ecolon,
	Ecy: Ecy,
	ecy: ecy,
	eDDot: eDDot,
	Edot: Edot,
	edot: edot,
	eDot: eDot,
	ee: ee,
	efDot: efDot,
	Efr: Efr,
	efr: efr,
	eg: eg,
	Egrave: Egrave,
	egrave: egrave,
	egs: egs,
	egsdot: egsdot,
	el: el,
	Element: Element,
	elinters: elinters,
	ell: ell,
	els: els,
	elsdot: elsdot,
	Emacr: Emacr,
	emacr: emacr,
	empty: empty$2,
	emptyset: emptyset,
	EmptySmallSquare: EmptySmallSquare,
	emptyv: emptyv,
	EmptyVerySmallSquare: EmptyVerySmallSquare,
	emsp13: emsp13,
	emsp14: emsp14,
	emsp: emsp,
	ENG: ENG,
	eng: eng,
	ensp: ensp,
	Eogon: Eogon,
	eogon: eogon,
	Eopf: Eopf,
	eopf: eopf,
	epar: epar,
	eparsl: eparsl,
	eplus: eplus,
	epsi: epsi,
	Epsilon: Epsilon,
	epsilon: epsilon,
	epsiv: epsiv,
	eqcirc: eqcirc,
	eqcolon: eqcolon,
	eqsim: eqsim,
	eqslantgtr: eqslantgtr,
	eqslantless: eqslantless,
	Equal: Equal,
	equals: equals,
	EqualTilde: EqualTilde,
	equest: equest,
	Equilibrium: Equilibrium,
	equiv: equiv,
	equivDD: equivDD,
	eqvparsl: eqvparsl,
	erarr: erarr,
	erDot: erDot,
	escr: escr,
	Escr: Escr,
	esdot: esdot,
	Esim: Esim,
	esim: esim,
	Eta: Eta,
	eta: eta,
	ETH: ETH,
	eth: eth,
	Euml: Euml,
	euml: euml,
	euro: euro,
	excl: excl,
	exist: exist,
	Exists: Exists,
	expectation: expectation,
	exponentiale: exponentiale,
	ExponentialE: ExponentialE,
	fallingdotseq: fallingdotseq,
	Fcy: Fcy,
	fcy: fcy,
	female: female,
	ffilig: ffilig,
	fflig: fflig,
	ffllig: ffllig,
	Ffr: Ffr,
	ffr: ffr,
	filig: filig,
	FilledSmallSquare: FilledSmallSquare,
	FilledVerySmallSquare: FilledVerySmallSquare,
	fjlig: fjlig,
	flat: flat,
	fllig: fllig,
	fltns: fltns,
	fnof: fnof,
	Fopf: Fopf,
	fopf: fopf,
	forall: forall,
	ForAll: ForAll,
	fork: fork,
	forkv: forkv,
	Fouriertrf: Fouriertrf,
	fpartint: fpartint,
	frac12: frac12,
	frac13: frac13,
	frac14: frac14,
	frac15: frac15,
	frac16: frac16,
	frac18: frac18,
	frac23: frac23,
	frac25: frac25,
	frac34: frac34,
	frac35: frac35,
	frac38: frac38,
	frac45: frac45,
	frac56: frac56,
	frac58: frac58,
	frac78: frac78,
	frasl: frasl,
	frown: frown,
	fscr: fscr,
	Fscr: Fscr,
	gacute: gacute,
	Gamma: Gamma,
	gamma: gamma,
	Gammad: Gammad,
	gammad: gammad,
	gap: gap,
	Gbreve: Gbreve,
	gbreve: gbreve,
	Gcedil: Gcedil,
	Gcirc: Gcirc,
	gcirc: gcirc,
	Gcy: Gcy,
	gcy: gcy,
	Gdot: Gdot,
	gdot: gdot,
	ge: ge,
	gE: gE,
	gEl: gEl,
	gel: gel,
	geq: geq,
	geqq: geqq,
	geqslant: geqslant,
	gescc: gescc,
	ges: ges,
	gesdot: gesdot,
	gesdoto: gesdoto,
	gesdotol: gesdotol,
	gesl: gesl,
	gesles: gesles,
	Gfr: Gfr,
	gfr: gfr,
	gg: gg,
	Gg: Gg,
	ggg: ggg,
	gimel: gimel,
	GJcy: GJcy,
	gjcy: gjcy,
	gla: gla,
	gl: gl,
	glE: glE,
	glj: glj,
	gnap: gnap,
	gnapprox: gnapprox,
	gne: gne,
	gnE: gnE,
	gneq: gneq,
	gneqq: gneqq,
	gnsim: gnsim,
	Gopf: Gopf,
	gopf: gopf,
	grave: grave,
	GreaterEqual: GreaterEqual,
	GreaterEqualLess: GreaterEqualLess,
	GreaterFullEqual: GreaterFullEqual,
	GreaterGreater: GreaterGreater,
	GreaterLess: GreaterLess,
	GreaterSlantEqual: GreaterSlantEqual,
	GreaterTilde: GreaterTilde,
	Gscr: Gscr,
	gscr: gscr,
	gsim: gsim,
	gsime: gsime,
	gsiml: gsiml,
	gtcc: gtcc,
	gtcir: gtcir,
	gt: gt,
	GT: GT,
	Gt: Gt,
	gtdot: gtdot,
	gtlPar: gtlPar,
	gtquest: gtquest,
	gtrapprox: gtrapprox,
	gtrarr: gtrarr,
	gtrdot: gtrdot,
	gtreqless: gtreqless,
	gtreqqless: gtreqqless,
	gtrless: gtrless,
	gtrsim: gtrsim,
	gvertneqq: gvertneqq,
	gvnE: gvnE,
	Hacek: Hacek,
	hairsp: hairsp,
	half: half,
	hamilt: hamilt,
	HARDcy: HARDcy,
	hardcy: hardcy,
	harrcir: harrcir,
	harr: harr,
	hArr: hArr,
	harrw: harrw,
	Hat: Hat,
	hbar: hbar,
	Hcirc: Hcirc,
	hcirc: hcirc,
	hearts: hearts,
	heartsuit: heartsuit,
	hellip: hellip,
	hercon: hercon,
	hfr: hfr,
	Hfr: Hfr,
	HilbertSpace: HilbertSpace,
	hksearow: hksearow,
	hkswarow: hkswarow,
	hoarr: hoarr,
	homtht: homtht,
	hookleftarrow: hookleftarrow,
	hookrightarrow: hookrightarrow,
	hopf: hopf,
	Hopf: Hopf,
	horbar: horbar,
	HorizontalLine: HorizontalLine,
	hscr: hscr,
	Hscr: Hscr,
	hslash: hslash,
	Hstrok: Hstrok,
	hstrok: hstrok,
	HumpDownHump: HumpDownHump,
	HumpEqual: HumpEqual,
	hybull: hybull,
	hyphen: hyphen,
	Iacute: Iacute,
	iacute: iacute,
	ic: ic,
	Icirc: Icirc,
	icirc: icirc,
	Icy: Icy,
	icy: icy,
	Idot: Idot,
	IEcy: IEcy,
	iecy: iecy,
	iexcl: iexcl,
	iff: iff,
	ifr: ifr,
	Ifr: Ifr,
	Igrave: Igrave,
	igrave: igrave,
	ii: ii,
	iiiint: iiiint,
	iiint: iiint,
	iinfin: iinfin,
	iiota: iiota,
	IJlig: IJlig,
	ijlig: ijlig,
	Imacr: Imacr,
	imacr: imacr,
	image: image$3,
	ImaginaryI: ImaginaryI,
	imagline: imagline,
	imagpart: imagpart,
	imath: imath,
	Im: Im,
	imof: imof,
	imped: imped,
	Implies: Implies,
	incare: incare,
	"in": "∈",
	infin: infin,
	infintie: infintie,
	inodot: inodot,
	intcal: intcal,
	int: int,
	Int: Int,
	integers: integers,
	Integral: Integral,
	intercal: intercal,
	Intersection: Intersection,
	intlarhk: intlarhk,
	intprod: intprod,
	InvisibleComma: InvisibleComma,
	InvisibleTimes: InvisibleTimes,
	IOcy: IOcy,
	iocy: iocy,
	Iogon: Iogon,
	iogon: iogon,
	Iopf: Iopf,
	iopf: iopf,
	Iota: Iota,
	iota: iota,
	iprod: iprod,
	iquest: iquest,
	iscr: iscr,
	Iscr: Iscr,
	isin: isin,
	isindot: isindot,
	isinE: isinE,
	isins: isins,
	isinsv: isinsv,
	isinv: isinv,
	it: it,
	Itilde: Itilde,
	itilde: itilde,
	Iukcy: Iukcy,
	iukcy: iukcy,
	Iuml: Iuml,
	iuml: iuml,
	Jcirc: Jcirc,
	jcirc: jcirc,
	Jcy: Jcy,
	jcy: jcy,
	Jfr: Jfr,
	jfr: jfr,
	jmath: jmath,
	Jopf: Jopf,
	jopf: jopf,
	Jscr: Jscr,
	jscr: jscr,
	Jsercy: Jsercy,
	jsercy: jsercy,
	Jukcy: Jukcy,
	jukcy: jukcy,
	Kappa: Kappa,
	kappa: kappa,
	kappav: kappav,
	Kcedil: Kcedil,
	kcedil: kcedil,
	Kcy: Kcy,
	kcy: kcy,
	Kfr: Kfr,
	kfr: kfr,
	kgreen: kgreen,
	KHcy: KHcy,
	khcy: khcy,
	KJcy: KJcy,
	kjcy: kjcy,
	Kopf: Kopf,
	kopf: kopf,
	Kscr: Kscr,
	kscr: kscr,
	lAarr: lAarr,
	Lacute: Lacute,
	lacute: lacute,
	laemptyv: laemptyv,
	lagran: lagran,
	Lambda: Lambda,
	lambda: lambda,
	lang: lang,
	Lang: Lang,
	langd: langd,
	langle: langle,
	lap: lap,
	Laplacetrf: Laplacetrf,
	laquo: laquo,
	larrb: larrb,
	larrbfs: larrbfs,
	larr: larr,
	Larr: Larr,
	lArr: lArr,
	larrfs: larrfs,
	larrhk: larrhk,
	larrlp: larrlp,
	larrpl: larrpl,
	larrsim: larrsim,
	larrtl: larrtl,
	latail: latail,
	lAtail: lAtail,
	lat: lat,
	late: late,
	lates: lates,
	lbarr: lbarr,
	lBarr: lBarr,
	lbbrk: lbbrk,
	lbrace: lbrace,
	lbrack: lbrack,
	lbrke: lbrke,
	lbrksld: lbrksld,
	lbrkslu: lbrkslu,
	Lcaron: Lcaron,
	lcaron: lcaron,
	Lcedil: Lcedil,
	lcedil: lcedil,
	lceil: lceil,
	lcub: lcub,
	Lcy: Lcy,
	lcy: lcy,
	ldca: ldca,
	ldquo: ldquo,
	ldquor: ldquor,
	ldrdhar: ldrdhar,
	ldrushar: ldrushar,
	ldsh: ldsh,
	le: le,
	lE: lE,
	LeftAngleBracket: LeftAngleBracket,
	LeftArrowBar: LeftArrowBar,
	leftarrow: leftarrow,
	LeftArrow: LeftArrow,
	Leftarrow: Leftarrow,
	LeftArrowRightArrow: LeftArrowRightArrow,
	leftarrowtail: leftarrowtail,
	LeftCeiling: LeftCeiling,
	LeftDoubleBracket: LeftDoubleBracket,
	LeftDownTeeVector: LeftDownTeeVector,
	LeftDownVectorBar: LeftDownVectorBar,
	LeftDownVector: LeftDownVector,
	LeftFloor: LeftFloor,
	leftharpoondown: leftharpoondown,
	leftharpoonup: leftharpoonup,
	leftleftarrows: leftleftarrows,
	leftrightarrow: leftrightarrow,
	LeftRightArrow: LeftRightArrow,
	Leftrightarrow: Leftrightarrow,
	leftrightarrows: leftrightarrows,
	leftrightharpoons: leftrightharpoons,
	leftrightsquigarrow: leftrightsquigarrow,
	LeftRightVector: LeftRightVector,
	LeftTeeArrow: LeftTeeArrow,
	LeftTee: LeftTee,
	LeftTeeVector: LeftTeeVector,
	leftthreetimes: leftthreetimes,
	LeftTriangleBar: LeftTriangleBar,
	LeftTriangle: LeftTriangle,
	LeftTriangleEqual: LeftTriangleEqual,
	LeftUpDownVector: LeftUpDownVector,
	LeftUpTeeVector: LeftUpTeeVector,
	LeftUpVectorBar: LeftUpVectorBar,
	LeftUpVector: LeftUpVector,
	LeftVectorBar: LeftVectorBar,
	LeftVector: LeftVector,
	lEg: lEg,
	leg: leg,
	leq: leq,
	leqq: leqq,
	leqslant: leqslant,
	lescc: lescc,
	les: les,
	lesdot: lesdot,
	lesdoto: lesdoto,
	lesdotor: lesdotor,
	lesg: lesg,
	lesges: lesges,
	lessapprox: lessapprox,
	lessdot: lessdot,
	lesseqgtr: lesseqgtr,
	lesseqqgtr: lesseqqgtr,
	LessEqualGreater: LessEqualGreater,
	LessFullEqual: LessFullEqual,
	LessGreater: LessGreater,
	lessgtr: lessgtr,
	LessLess: LessLess,
	lesssim: lesssim,
	LessSlantEqual: LessSlantEqual,
	LessTilde: LessTilde,
	lfisht: lfisht,
	lfloor: lfloor,
	Lfr: Lfr,
	lfr: lfr,
	lg: lg,
	lgE: lgE,
	lHar: lHar,
	lhard: lhard,
	lharu: lharu,
	lharul: lharul,
	lhblk: lhblk,
	LJcy: LJcy,
	ljcy: ljcy,
	llarr: llarr,
	ll: ll,
	Ll: Ll,
	llcorner: llcorner,
	Lleftarrow: Lleftarrow,
	llhard: llhard,
	lltri: lltri,
	Lmidot: Lmidot,
	lmidot: lmidot,
	lmoustache: lmoustache,
	lmoust: lmoust,
	lnap: lnap,
	lnapprox: lnapprox,
	lne: lne,
	lnE: lnE,
	lneq: lneq,
	lneqq: lneqq,
	lnsim: lnsim,
	loang: loang,
	loarr: loarr,
	lobrk: lobrk,
	longleftarrow: longleftarrow,
	LongLeftArrow: LongLeftArrow,
	Longleftarrow: Longleftarrow,
	longleftrightarrow: longleftrightarrow,
	LongLeftRightArrow: LongLeftRightArrow,
	Longleftrightarrow: Longleftrightarrow,
	longmapsto: longmapsto,
	longrightarrow: longrightarrow,
	LongRightArrow: LongRightArrow,
	Longrightarrow: Longrightarrow,
	looparrowleft: looparrowleft,
	looparrowright: looparrowright,
	lopar: lopar,
	Lopf: Lopf,
	lopf: lopf,
	loplus: loplus,
	lotimes: lotimes,
	lowast: lowast,
	lowbar: lowbar,
	LowerLeftArrow: LowerLeftArrow,
	LowerRightArrow: LowerRightArrow,
	loz: loz,
	lozenge: lozenge,
	lozf: lozf,
	lpar: lpar,
	lparlt: lparlt,
	lrarr: lrarr,
	lrcorner: lrcorner,
	lrhar: lrhar,
	lrhard: lrhard,
	lrm: lrm,
	lrtri: lrtri,
	lsaquo: lsaquo,
	lscr: lscr,
	Lscr: Lscr,
	lsh: lsh,
	Lsh: Lsh,
	lsim: lsim,
	lsime: lsime,
	lsimg: lsimg,
	lsqb: lsqb,
	lsquo: lsquo,
	lsquor: lsquor,
	Lstrok: Lstrok,
	lstrok: lstrok,
	ltcc: ltcc,
	ltcir: ltcir,
	lt: lt,
	LT: LT,
	Lt: Lt,
	ltdot: ltdot,
	lthree: lthree,
	ltimes: ltimes,
	ltlarr: ltlarr,
	ltquest: ltquest,
	ltri: ltri,
	ltrie: ltrie,
	ltrif: ltrif,
	ltrPar: ltrPar,
	lurdshar: lurdshar,
	luruhar: luruhar,
	lvertneqq: lvertneqq,
	lvnE: lvnE,
	macr: macr,
	male: male,
	malt: malt,
	maltese: maltese,
	"Map": "⤅",
	map: map$1,
	mapsto: mapsto,
	mapstodown: mapstodown,
	mapstoleft: mapstoleft,
	mapstoup: mapstoup,
	marker: marker,
	mcomma: mcomma,
	Mcy: Mcy,
	mcy: mcy,
	mdash: mdash,
	mDDot: mDDot,
	measuredangle: measuredangle,
	MediumSpace: MediumSpace,
	Mellintrf: Mellintrf,
	Mfr: Mfr,
	mfr: mfr,
	mho: mho,
	micro: micro,
	midast: midast,
	midcir: midcir,
	mid: mid,
	middot: middot,
	minusb: minusb,
	minus: minus,
	minusd: minusd,
	minusdu: minusdu,
	MinusPlus: MinusPlus,
	mlcp: mlcp,
	mldr: mldr,
	mnplus: mnplus,
	models: models,
	Mopf: Mopf,
	mopf: mopf,
	mp: mp,
	mscr: mscr,
	Mscr: Mscr,
	mstpos: mstpos,
	Mu: Mu,
	mu: mu,
	multimap: multimap,
	mumap: mumap,
	nabla: nabla,
	Nacute: Nacute,
	nacute: nacute,
	nang: nang,
	nap: nap,
	napE: napE,
	napid: napid,
	napos: napos,
	napprox: napprox,
	natural: natural,
	naturals: naturals,
	natur: natur,
	nbsp: nbsp,
	nbump: nbump,
	nbumpe: nbumpe,
	ncap: ncap,
	Ncaron: Ncaron,
	ncaron: ncaron,
	Ncedil: Ncedil,
	ncedil: ncedil,
	ncong: ncong,
	ncongdot: ncongdot,
	ncup: ncup,
	Ncy: Ncy,
	ncy: ncy,
	ndash: ndash,
	nearhk: nearhk,
	nearr: nearr,
	neArr: neArr,
	nearrow: nearrow,
	ne: ne,
	nedot: nedot,
	NegativeMediumSpace: NegativeMediumSpace,
	NegativeThickSpace: NegativeThickSpace,
	NegativeThinSpace: NegativeThinSpace,
	NegativeVeryThinSpace: NegativeVeryThinSpace,
	nequiv: nequiv,
	nesear: nesear,
	nesim: nesim,
	NestedGreaterGreater: NestedGreaterGreater,
	NestedLessLess: NestedLessLess,
	NewLine: NewLine,
	nexist: nexist,
	nexists: nexists,
	Nfr: Nfr,
	nfr: nfr,
	ngE: ngE,
	nge: nge,
	ngeq: ngeq,
	ngeqq: ngeqq,
	ngeqslant: ngeqslant,
	nges: nges,
	nGg: nGg,
	ngsim: ngsim,
	nGt: nGt,
	ngt: ngt,
	ngtr: ngtr,
	nGtv: nGtv,
	nharr: nharr,
	nhArr: nhArr,
	nhpar: nhpar,
	ni: ni,
	nis: nis,
	nisd: nisd,
	niv: niv,
	NJcy: NJcy,
	njcy: njcy,
	nlarr: nlarr,
	nlArr: nlArr,
	nldr: nldr,
	nlE: nlE,
	nle: nle,
	nleftarrow: nleftarrow,
	nLeftarrow: nLeftarrow,
	nleftrightarrow: nleftrightarrow,
	nLeftrightarrow: nLeftrightarrow,
	nleq: nleq,
	nleqq: nleqq,
	nleqslant: nleqslant,
	nles: nles,
	nless: nless,
	nLl: nLl,
	nlsim: nlsim,
	nLt: nLt,
	nlt: nlt,
	nltri: nltri,
	nltrie: nltrie,
	nLtv: nLtv,
	nmid: nmid,
	NoBreak: NoBreak,
	NonBreakingSpace: NonBreakingSpace,
	nopf: nopf,
	Nopf: Nopf,
	Not: Not,
	not: not$1,
	NotCongruent: NotCongruent,
	NotCupCap: NotCupCap,
	NotDoubleVerticalBar: NotDoubleVerticalBar,
	NotElement: NotElement,
	NotEqual: NotEqual,
	NotEqualTilde: NotEqualTilde,
	NotExists: NotExists,
	NotGreater: NotGreater,
	NotGreaterEqual: NotGreaterEqual,
	NotGreaterFullEqual: NotGreaterFullEqual,
	NotGreaterGreater: NotGreaterGreater,
	NotGreaterLess: NotGreaterLess,
	NotGreaterSlantEqual: NotGreaterSlantEqual,
	NotGreaterTilde: NotGreaterTilde,
	NotHumpDownHump: NotHumpDownHump,
	NotHumpEqual: NotHumpEqual,
	notin: notin,
	notindot: notindot,
	notinE: notinE,
	notinva: notinva,
	notinvb: notinvb,
	notinvc: notinvc,
	NotLeftTriangleBar: NotLeftTriangleBar,
	NotLeftTriangle: NotLeftTriangle,
	NotLeftTriangleEqual: NotLeftTriangleEqual,
	NotLess: NotLess,
	NotLessEqual: NotLessEqual,
	NotLessGreater: NotLessGreater,
	NotLessLess: NotLessLess,
	NotLessSlantEqual: NotLessSlantEqual,
	NotLessTilde: NotLessTilde,
	NotNestedGreaterGreater: NotNestedGreaterGreater,
	NotNestedLessLess: NotNestedLessLess,
	notni: notni,
	notniva: notniva,
	notnivb: notnivb,
	notnivc: notnivc,
	NotPrecedes: NotPrecedes,
	NotPrecedesEqual: NotPrecedesEqual,
	NotPrecedesSlantEqual: NotPrecedesSlantEqual,
	NotReverseElement: NotReverseElement,
	NotRightTriangleBar: NotRightTriangleBar,
	NotRightTriangle: NotRightTriangle,
	NotRightTriangleEqual: NotRightTriangleEqual,
	NotSquareSubset: NotSquareSubset,
	NotSquareSubsetEqual: NotSquareSubsetEqual,
	NotSquareSuperset: NotSquareSuperset,
	NotSquareSupersetEqual: NotSquareSupersetEqual,
	NotSubset: NotSubset,
	NotSubsetEqual: NotSubsetEqual,
	NotSucceeds: NotSucceeds,
	NotSucceedsEqual: NotSucceedsEqual,
	NotSucceedsSlantEqual: NotSucceedsSlantEqual,
	NotSucceedsTilde: NotSucceedsTilde,
	NotSuperset: NotSuperset,
	NotSupersetEqual: NotSupersetEqual,
	NotTilde: NotTilde,
	NotTildeEqual: NotTildeEqual,
	NotTildeFullEqual: NotTildeFullEqual,
	NotTildeTilde: NotTildeTilde,
	NotVerticalBar: NotVerticalBar,
	nparallel: nparallel,
	npar: npar,
	nparsl: nparsl,
	npart: npart,
	npolint: npolint,
	npr: npr,
	nprcue: nprcue,
	nprec: nprec,
	npreceq: npreceq,
	npre: npre,
	nrarrc: nrarrc,
	nrarr: nrarr,
	nrArr: nrArr,
	nrarrw: nrarrw,
	nrightarrow: nrightarrow,
	nRightarrow: nRightarrow,
	nrtri: nrtri,
	nrtrie: nrtrie,
	nsc: nsc,
	nsccue: nsccue,
	nsce: nsce,
	Nscr: Nscr,
	nscr: nscr,
	nshortmid: nshortmid,
	nshortparallel: nshortparallel,
	nsim: nsim,
	nsime: nsime,
	nsimeq: nsimeq,
	nsmid: nsmid,
	nspar: nspar,
	nsqsube: nsqsube,
	nsqsupe: nsqsupe,
	nsub: nsub,
	nsubE: nsubE,
	nsube: nsube,
	nsubset: nsubset,
	nsubseteq: nsubseteq,
	nsubseteqq: nsubseteqq,
	nsucc: nsucc,
	nsucceq: nsucceq,
	nsup: nsup,
	nsupE: nsupE,
	nsupe: nsupe,
	nsupset: nsupset,
	nsupseteq: nsupseteq,
	nsupseteqq: nsupseteqq,
	ntgl: ntgl,
	Ntilde: Ntilde,
	ntilde: ntilde,
	ntlg: ntlg,
	ntriangleleft: ntriangleleft,
	ntrianglelefteq: ntrianglelefteq,
	ntriangleright: ntriangleright,
	ntrianglerighteq: ntrianglerighteq,
	Nu: Nu,
	nu: nu,
	num: num,
	numero: numero,
	numsp: numsp,
	nvap: nvap,
	nvdash: nvdash,
	nvDash: nvDash,
	nVdash: nVdash,
	nVDash: nVDash,
	nvge: nvge,
	nvgt: nvgt,
	nvHarr: nvHarr,
	nvinfin: nvinfin,
	nvlArr: nvlArr,
	nvle: nvle,
	nvlt: nvlt,
	nvltrie: nvltrie,
	nvrArr: nvrArr,
	nvrtrie: nvrtrie,
	nvsim: nvsim,
	nwarhk: nwarhk,
	nwarr: nwarr,
	nwArr: nwArr,
	nwarrow: nwarrow,
	nwnear: nwnear,
	Oacute: Oacute,
	oacute: oacute,
	oast: oast,
	Ocirc: Ocirc,
	ocirc: ocirc,
	ocir: ocir,
	Ocy: Ocy,
	ocy: ocy,
	odash: odash,
	Odblac: Odblac,
	odblac: odblac,
	odiv: odiv,
	odot: odot,
	odsold: odsold,
	OElig: OElig,
	oelig: oelig,
	ofcir: ofcir,
	Ofr: Ofr,
	ofr: ofr,
	ogon: ogon,
	Ograve: Ograve,
	ograve: ograve,
	ogt: ogt,
	ohbar: ohbar,
	ohm: ohm,
	oint: oint,
	olarr: olarr,
	olcir: olcir,
	olcross: olcross,
	oline: oline,
	olt: olt,
	Omacr: Omacr,
	omacr: omacr,
	Omega: Omega,
	omega: omega,
	Omicron: Omicron,
	omicron: omicron,
	omid: omid,
	ominus: ominus,
	Oopf: Oopf,
	oopf: oopf,
	opar: opar,
	OpenCurlyDoubleQuote: OpenCurlyDoubleQuote,
	OpenCurlyQuote: OpenCurlyQuote,
	operp: operp,
	oplus: oplus,
	orarr: orarr,
	Or: Or,
	or: or,
	ord: ord,
	order: order$1,
	orderof: orderof,
	ordf: ordf,
	ordm: ordm,
	origof: origof,
	oror: oror,
	orslope: orslope,
	orv: orv,
	oS: oS,
	Oscr: Oscr,
	oscr: oscr,
	Oslash: Oslash,
	oslash: oslash,
	osol: osol,
	Otilde: Otilde,
	otilde: otilde,
	otimesas: otimesas,
	Otimes: Otimes,
	otimes: otimes,
	Ouml: Ouml,
	ouml: ouml,
	ovbar: ovbar,
	OverBar: OverBar,
	OverBrace: OverBrace,
	OverBracket: OverBracket,
	OverParenthesis: OverParenthesis,
	para: para,
	parallel: parallel,
	par: par,
	parsim: parsim,
	parsl: parsl,
	part: part,
	PartialD: PartialD,
	Pcy: Pcy,
	pcy: pcy,
	percnt: percnt,
	period: period,
	permil: permil,
	perp: perp,
	pertenk: pertenk,
	Pfr: Pfr,
	pfr: pfr,
	Phi: Phi,
	phi: phi,
	phiv: phiv,
	phmmat: phmmat,
	phone: phone,
	Pi: Pi,
	pi: pi,
	pitchfork: pitchfork,
	piv: piv,
	planck: planck,
	planckh: planckh,
	plankv: plankv,
	plusacir: plusacir,
	plusb: plusb,
	pluscir: pluscir,
	plus: plus,
	plusdo: plusdo,
	plusdu: plusdu,
	pluse: pluse,
	PlusMinus: PlusMinus,
	plusmn: plusmn,
	plussim: plussim,
	plustwo: plustwo,
	pm: pm,
	Poincareplane: Poincareplane,
	pointint: pointint,
	popf: popf,
	Popf: Popf,
	pound: pound,
	prap: prap,
	Pr: Pr,
	pr: pr,
	prcue: prcue,
	precapprox: precapprox,
	prec: prec,
	preccurlyeq: preccurlyeq,
	Precedes: Precedes,
	PrecedesEqual: PrecedesEqual,
	PrecedesSlantEqual: PrecedesSlantEqual,
	PrecedesTilde: PrecedesTilde,
	preceq: preceq,
	precnapprox: precnapprox,
	precneqq: precneqq,
	precnsim: precnsim,
	pre: pre,
	prE: prE,
	precsim: precsim,
	prime: prime,
	Prime: Prime,
	primes: primes,
	prnap: prnap,
	prnE: prnE,
	prnsim: prnsim,
	prod: prod,
	Product: Product,
	profalar: profalar,
	profline: profline,
	profsurf: profsurf,
	prop: prop,
	Proportional: Proportional,
	Proportion: Proportion,
	propto: propto,
	prsim: prsim,
	prurel: prurel,
	Pscr: Pscr,
	pscr: pscr,
	Psi: Psi,
	psi: psi,
	puncsp: puncsp,
	Qfr: Qfr,
	qfr: qfr,
	qint: qint,
	qopf: qopf,
	Qopf: Qopf,
	qprime: qprime,
	Qscr: Qscr,
	qscr: qscr,
	quaternions: quaternions,
	quatint: quatint,
	quest: quest,
	questeq: questeq,
	quot: quot,
	QUOT: QUOT,
	rAarr: rAarr,
	race: race,
	Racute: Racute,
	racute: racute,
	radic: radic,
	raemptyv: raemptyv,
	rang: rang,
	Rang: Rang,
	rangd: rangd,
	range: range,
	rangle: rangle,
	raquo: raquo,
	rarrap: rarrap,
	rarrb: rarrb,
	rarrbfs: rarrbfs,
	rarrc: rarrc,
	rarr: rarr,
	Rarr: Rarr,
	rArr: rArr,
	rarrfs: rarrfs,
	rarrhk: rarrhk,
	rarrlp: rarrlp,
	rarrpl: rarrpl,
	rarrsim: rarrsim,
	Rarrtl: Rarrtl,
	rarrtl: rarrtl,
	rarrw: rarrw,
	ratail: ratail,
	rAtail: rAtail,
	ratio: ratio,
	rationals: rationals,
	rbarr: rbarr,
	rBarr: rBarr,
	RBarr: RBarr,
	rbbrk: rbbrk,
	rbrace: rbrace,
	rbrack: rbrack,
	rbrke: rbrke,
	rbrksld: rbrksld,
	rbrkslu: rbrkslu,
	Rcaron: Rcaron,
	rcaron: rcaron,
	Rcedil: Rcedil,
	rcedil: rcedil,
	rceil: rceil,
	rcub: rcub,
	Rcy: Rcy,
	rcy: rcy,
	rdca: rdca,
	rdldhar: rdldhar,
	rdquo: rdquo,
	rdquor: rdquor,
	rdsh: rdsh,
	real: real,
	realine: realine,
	realpart: realpart,
	reals: reals,
	Re: Re,
	rect: rect,
	reg: reg,
	REG: REG,
	ReverseElement: ReverseElement,
	ReverseEquilibrium: ReverseEquilibrium,
	ReverseUpEquilibrium: ReverseUpEquilibrium,
	rfisht: rfisht,
	rfloor: rfloor,
	rfr: rfr,
	Rfr: Rfr,
	rHar: rHar,
	rhard: rhard,
	rharu: rharu,
	rharul: rharul,
	Rho: Rho,
	rho: rho,
	rhov: rhov,
	RightAngleBracket: RightAngleBracket,
	RightArrowBar: RightArrowBar,
	rightarrow: rightarrow,
	RightArrow: RightArrow,
	Rightarrow: Rightarrow,
	RightArrowLeftArrow: RightArrowLeftArrow,
	rightarrowtail: rightarrowtail,
	RightCeiling: RightCeiling,
	RightDoubleBracket: RightDoubleBracket,
	RightDownTeeVector: RightDownTeeVector,
	RightDownVectorBar: RightDownVectorBar,
	RightDownVector: RightDownVector,
	RightFloor: RightFloor,
	rightharpoondown: rightharpoondown,
	rightharpoonup: rightharpoonup,
	rightleftarrows: rightleftarrows,
	rightleftharpoons: rightleftharpoons,
	rightrightarrows: rightrightarrows,
	rightsquigarrow: rightsquigarrow,
	RightTeeArrow: RightTeeArrow,
	RightTee: RightTee,
	RightTeeVector: RightTeeVector,
	rightthreetimes: rightthreetimes,
	RightTriangleBar: RightTriangleBar,
	RightTriangle: RightTriangle,
	RightTriangleEqual: RightTriangleEqual,
	RightUpDownVector: RightUpDownVector,
	RightUpTeeVector: RightUpTeeVector,
	RightUpVectorBar: RightUpVectorBar,
	RightUpVector: RightUpVector,
	RightVectorBar: RightVectorBar,
	RightVector: RightVector,
	ring: ring,
	risingdotseq: risingdotseq,
	rlarr: rlarr,
	rlhar: rlhar,
	rlm: rlm,
	rmoustache: rmoustache,
	rmoust: rmoust,
	rnmid: rnmid,
	roang: roang,
	roarr: roarr,
	robrk: robrk,
	ropar: ropar,
	ropf: ropf,
	Ropf: Ropf,
	roplus: roplus,
	rotimes: rotimes,
	RoundImplies: RoundImplies,
	rpar: rpar,
	rpargt: rpargt,
	rppolint: rppolint,
	rrarr: rrarr,
	Rrightarrow: Rrightarrow,
	rsaquo: rsaquo,
	rscr: rscr,
	Rscr: Rscr,
	rsh: rsh,
	Rsh: Rsh,
	rsqb: rsqb,
	rsquo: rsquo,
	rsquor: rsquor,
	rthree: rthree,
	rtimes: rtimes,
	rtri: rtri,
	rtrie: rtrie,
	rtrif: rtrif,
	rtriltri: rtriltri,
	RuleDelayed: RuleDelayed,
	ruluhar: ruluhar,
	rx: rx,
	Sacute: Sacute,
	sacute: sacute,
	sbquo: sbquo,
	scap: scap,
	Scaron: Scaron,
	scaron: scaron,
	Sc: Sc,
	sc: sc,
	sccue: sccue,
	sce: sce,
	scE: scE,
	Scedil: Scedil,
	scedil: scedil,
	Scirc: Scirc,
	scirc: scirc,
	scnap: scnap,
	scnE: scnE,
	scnsim: scnsim,
	scpolint: scpolint,
	scsim: scsim,
	Scy: Scy,
	scy: scy,
	sdotb: sdotb,
	sdot: sdot,
	sdote: sdote,
	searhk: searhk,
	searr: searr,
	seArr: seArr,
	searrow: searrow,
	sect: sect,
	semi: semi,
	seswar: seswar,
	setminus: setminus,
	setmn: setmn,
	sext: sext,
	Sfr: Sfr,
	sfr: sfr,
	sfrown: sfrown,
	sharp: sharp,
	SHCHcy: SHCHcy,
	shchcy: shchcy,
	SHcy: SHcy,
	shcy: shcy,
	ShortDownArrow: ShortDownArrow,
	ShortLeftArrow: ShortLeftArrow,
	shortmid: shortmid,
	shortparallel: shortparallel,
	ShortRightArrow: ShortRightArrow,
	ShortUpArrow: ShortUpArrow,
	shy: shy,
	Sigma: Sigma,
	sigma: sigma,
	sigmaf: sigmaf,
	sigmav: sigmav,
	sim: sim,
	simdot: simdot,
	sime: sime,
	simeq: simeq,
	simg: simg,
	simgE: simgE,
	siml: siml,
	simlE: simlE,
	simne: simne,
	simplus: simplus,
	simrarr: simrarr,
	slarr: slarr,
	SmallCircle: SmallCircle,
	smallsetminus: smallsetminus,
	smashp: smashp,
	smeparsl: smeparsl,
	smid: smid,
	smile: smile,
	smt: smt,
	smte: smte,
	smtes: smtes,
	SOFTcy: SOFTcy,
	softcy: softcy,
	solbar: solbar,
	solb: solb,
	sol: sol,
	Sopf: Sopf,
	sopf: sopf,
	spades: spades,
	spadesuit: spadesuit,
	spar: spar,
	sqcap: sqcap,
	sqcaps: sqcaps,
	sqcup: sqcup,
	sqcups: sqcups,
	Sqrt: Sqrt,
	sqsub: sqsub,
	sqsube: sqsube,
	sqsubset: sqsubset,
	sqsubseteq: sqsubseteq,
	sqsup: sqsup,
	sqsupe: sqsupe,
	sqsupset: sqsupset,
	sqsupseteq: sqsupseteq,
	square: square,
	Square: Square,
	SquareIntersection: SquareIntersection,
	SquareSubset: SquareSubset,
	SquareSubsetEqual: SquareSubsetEqual,
	SquareSuperset: SquareSuperset,
	SquareSupersetEqual: SquareSupersetEqual,
	SquareUnion: SquareUnion,
	squarf: squarf,
	squ: squ,
	squf: squf,
	srarr: srarr,
	Sscr: Sscr,
	sscr: sscr,
	ssetmn: ssetmn,
	ssmile: ssmile,
	sstarf: sstarf,
	Star: Star,
	star: star,
	starf: starf,
	straightepsilon: straightepsilon,
	straightphi: straightphi,
	strns: strns,
	sub: sub,
	Sub: Sub,
	subdot: subdot,
	subE: subE,
	sube: sube,
	subedot: subedot,
	submult: submult,
	subnE: subnE,
	subne: subne,
	subplus: subplus,
	subrarr: subrarr,
	subset: subset,
	Subset: Subset,
	subseteq: subseteq,
	subseteqq: subseteqq,
	SubsetEqual: SubsetEqual,
	subsetneq: subsetneq,
	subsetneqq: subsetneqq,
	subsim: subsim,
	subsub: subsub,
	subsup: subsup,
	succapprox: succapprox,
	succ: succ,
	succcurlyeq: succcurlyeq,
	Succeeds: Succeeds,
	SucceedsEqual: SucceedsEqual,
	SucceedsSlantEqual: SucceedsSlantEqual,
	SucceedsTilde: SucceedsTilde,
	succeq: succeq,
	succnapprox: succnapprox,
	succneqq: succneqq,
	succnsim: succnsim,
	succsim: succsim,
	SuchThat: SuchThat,
	sum: sum,
	Sum: Sum,
	sung: sung,
	sup1: sup1,
	sup2: sup2,
	sup3: sup3,
	sup: sup,
	Sup: Sup,
	supdot: supdot,
	supdsub: supdsub,
	supE: supE,
	supe: supe,
	supedot: supedot,
	Superset: Superset,
	SupersetEqual: SupersetEqual,
	suphsol: suphsol,
	suphsub: suphsub,
	suplarr: suplarr,
	supmult: supmult,
	supnE: supnE,
	supne: supne,
	supplus: supplus,
	supset: supset,
	Supset: Supset,
	supseteq: supseteq,
	supseteqq: supseteqq,
	supsetneq: supsetneq,
	supsetneqq: supsetneqq,
	supsim: supsim,
	supsub: supsub,
	supsup: supsup,
	swarhk: swarhk,
	swarr: swarr,
	swArr: swArr,
	swarrow: swarrow,
	swnwar: swnwar,
	szlig: szlig,
	Tab: Tab,
	target: target,
	Tau: Tau,
	tau: tau,
	tbrk: tbrk,
	Tcaron: Tcaron,
	tcaron: tcaron,
	Tcedil: Tcedil,
	tcedil: tcedil,
	Tcy: Tcy,
	tcy: tcy,
	tdot: tdot,
	telrec: telrec,
	Tfr: Tfr,
	tfr: tfr,
	there4: there4,
	therefore: therefore,
	Therefore: Therefore,
	Theta: Theta,
	theta: theta,
	thetasym: thetasym,
	thetav: thetav,
	thickapprox: thickapprox,
	thicksim: thicksim,
	ThickSpace: ThickSpace,
	ThinSpace: ThinSpace,
	thinsp: thinsp,
	thkap: thkap,
	thksim: thksim,
	THORN: THORN,
	thorn: thorn,
	tilde: tilde,
	Tilde: Tilde,
	TildeEqual: TildeEqual,
	TildeFullEqual: TildeFullEqual,
	TildeTilde: TildeTilde,
	timesbar: timesbar,
	timesb: timesb,
	times: times,
	timesd: timesd,
	tint: tint,
	toea: toea,
	topbot: topbot,
	topcir: topcir,
	top: top,
	Topf: Topf,
	topf: topf,
	topfork: topfork,
	tosa: tosa,
	tprime: tprime,
	trade: trade,
	TRADE: TRADE,
	triangle: triangle,
	triangledown: triangledown,
	triangleleft: triangleleft,
	trianglelefteq: trianglelefteq,
	triangleq: triangleq,
	triangleright: triangleright,
	trianglerighteq: trianglerighteq,
	tridot: tridot,
	trie: trie,
	triminus: triminus,
	TripleDot: TripleDot,
	triplus: triplus,
	trisb: trisb,
	tritime: tritime,
	trpezium: trpezium,
	Tscr: Tscr,
	tscr: tscr,
	TScy: TScy,
	tscy: tscy,
	TSHcy: TSHcy,
	tshcy: tshcy,
	Tstrok: Tstrok,
	tstrok: tstrok,
	twixt: twixt,
	twoheadleftarrow: twoheadleftarrow,
	twoheadrightarrow: twoheadrightarrow,
	Uacute: Uacute,
	uacute: uacute,
	uarr: uarr,
	Uarr: Uarr,
	uArr: uArr,
	Uarrocir: Uarrocir,
	Ubrcy: Ubrcy,
	ubrcy: ubrcy,
	Ubreve: Ubreve,
	ubreve: ubreve,
	Ucirc: Ucirc,
	ucirc: ucirc,
	Ucy: Ucy,
	ucy: ucy,
	udarr: udarr,
	Udblac: Udblac,
	udblac: udblac,
	udhar: udhar,
	ufisht: ufisht,
	Ufr: Ufr,
	ufr: ufr,
	Ugrave: Ugrave,
	ugrave: ugrave,
	uHar: uHar,
	uharl: uharl,
	uharr: uharr,
	uhblk: uhblk,
	ulcorn: ulcorn,
	ulcorner: ulcorner,
	ulcrop: ulcrop,
	ultri: ultri,
	Umacr: Umacr,
	umacr: umacr,
	uml: uml,
	UnderBar: UnderBar,
	UnderBrace: UnderBrace,
	UnderBracket: UnderBracket,
	UnderParenthesis: UnderParenthesis,
	Union: Union,
	UnionPlus: UnionPlus,
	Uogon: Uogon,
	uogon: uogon,
	Uopf: Uopf,
	uopf: uopf,
	UpArrowBar: UpArrowBar,
	uparrow: uparrow,
	UpArrow: UpArrow,
	Uparrow: Uparrow,
	UpArrowDownArrow: UpArrowDownArrow,
	updownarrow: updownarrow,
	UpDownArrow: UpDownArrow,
	Updownarrow: Updownarrow,
	UpEquilibrium: UpEquilibrium,
	upharpoonleft: upharpoonleft,
	upharpoonright: upharpoonright,
	uplus: uplus,
	UpperLeftArrow: UpperLeftArrow,
	UpperRightArrow: UpperRightArrow,
	upsi: upsi,
	Upsi: Upsi,
	upsih: upsih,
	Upsilon: Upsilon,
	upsilon: upsilon,
	UpTeeArrow: UpTeeArrow,
	UpTee: UpTee,
	upuparrows: upuparrows,
	urcorn: urcorn,
	urcorner: urcorner,
	urcrop: urcrop,
	Uring: Uring,
	uring: uring,
	urtri: urtri,
	Uscr: Uscr,
	uscr: uscr,
	utdot: utdot,
	Utilde: Utilde,
	utilde: utilde,
	utri: utri,
	utrif: utrif,
	uuarr: uuarr,
	Uuml: Uuml,
	uuml: uuml,
	uwangle: uwangle,
	vangrt: vangrt,
	varepsilon: varepsilon,
	varkappa: varkappa,
	varnothing: varnothing,
	varphi: varphi,
	varpi: varpi,
	varpropto: varpropto,
	varr: varr,
	vArr: vArr,
	varrho: varrho,
	varsigma: varsigma,
	varsubsetneq: varsubsetneq,
	varsubsetneqq: varsubsetneqq,
	varsupsetneq: varsupsetneq,
	varsupsetneqq: varsupsetneqq,
	vartheta: vartheta,
	vartriangleleft: vartriangleleft,
	vartriangleright: vartriangleright,
	vBar: vBar,
	Vbar: Vbar,
	vBarv: vBarv,
	Vcy: Vcy,
	vcy: vcy,
	vdash: vdash,
	vDash: vDash,
	Vdash: Vdash,
	VDash: VDash,
	Vdashl: Vdashl,
	veebar: veebar,
	vee: vee,
	Vee: Vee,
	veeeq: veeeq,
	vellip: vellip,
	verbar: verbar,
	Verbar: Verbar,
	vert: vert,
	Vert: Vert,
	VerticalBar: VerticalBar,
	VerticalLine: VerticalLine,
	VerticalSeparator: VerticalSeparator,
	VerticalTilde: VerticalTilde,
	VeryThinSpace: VeryThinSpace,
	Vfr: Vfr,
	vfr: vfr,
	vltri: vltri,
	vnsub: vnsub,
	vnsup: vnsup,
	Vopf: Vopf,
	vopf: vopf,
	vprop: vprop,
	vrtri: vrtri,
	Vscr: Vscr,
	vscr: vscr,
	vsubnE: vsubnE,
	vsubne: vsubne,
	vsupnE: vsupnE,
	vsupne: vsupne,
	Vvdash: Vvdash,
	vzigzag: vzigzag,
	Wcirc: Wcirc,
	wcirc: wcirc,
	wedbar: wedbar,
	wedge: wedge,
	Wedge: Wedge,
	wedgeq: wedgeq,
	weierp: weierp,
	Wfr: Wfr,
	wfr: wfr,
	Wopf: Wopf,
	wopf: wopf,
	wp: wp,
	wr: wr,
	wreath: wreath,
	Wscr: Wscr,
	wscr: wscr,
	xcap: xcap,
	xcirc: xcirc,
	xcup: xcup,
	xdtri: xdtri,
	Xfr: Xfr,
	xfr: xfr,
	xharr: xharr,
	xhArr: xhArr,
	Xi: Xi,
	xi: xi,
	xlarr: xlarr,
	xlArr: xlArr,
	xmap: xmap,
	xnis: xnis,
	xodot: xodot,
	Xopf: Xopf,
	xopf: xopf,
	xoplus: xoplus,
	xotime: xotime,
	xrarr: xrarr,
	xrArr: xrArr,
	Xscr: Xscr,
	xscr: xscr,
	xsqcup: xsqcup,
	xuplus: xuplus,
	xutri: xutri,
	xvee: xvee,
	xwedge: xwedge,
	Yacute: Yacute,
	yacute: yacute,
	YAcy: YAcy,
	yacy: yacy,
	Ycirc: Ycirc,
	ycirc: ycirc,
	Ycy: Ycy,
	ycy: ycy,
	yen: yen,
	Yfr: Yfr,
	yfr: yfr,
	YIcy: YIcy,
	yicy: yicy,
	Yopf: Yopf,
	yopf: yopf,
	Yscr: Yscr,
	yscr: yscr,
	YUcy: YUcy,
	yucy: yucy,
	yuml: yuml,
	Yuml: Yuml,
	Zacute: Zacute,
	zacute: zacute,
	Zcaron: Zcaron,
	zcaron: zcaron,
	Zcy: Zcy,
	zcy: zcy,
	Zdot: Zdot,
	zdot: zdot,
	zeetrf: zeetrf,
	ZeroWidthSpace: ZeroWidthSpace,
	Zeta: Zeta,
	zeta: zeta,
	zfr: zfr,
	Zfr: Zfr,
	ZHcy: ZHcy,
	zhcy: zhcy,
	zigrarr: zigrarr,
	zopf: zopf,
	Zopf: Zopf,
	Zscr: Zscr,
	zscr: zscr,
	zwj: zwj,
	zwnj: zwnj
};

/*eslint quotes:0*/


var entities$1 = require$$0;

var regex$4 = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4E\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/;

var mdurl$1 = {};

var encodeCache = {}; // Create a lookup array where anything but characters in `chars` string
// and alphanumeric chars is percent-encoded.
//

function getEncodeCache(exclude) {
  var i,
      ch,
      cache = encodeCache[exclude];

  if (cache) {
    return cache;
  }

  cache = encodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);

    if (/^[0-9a-z]$/i.test(ch)) {
      // always allow unencoded alphanumeric characters
      cache.push(ch);
    } else {
      cache.push('%' + ('0' + i.toString(16).toUpperCase()).slice(-2));
    }
  }

  for (i = 0; i < exclude.length; i++) {
    cache[exclude.charCodeAt(i)] = exclude[i];
  }

  return cache;
} // Encode unsafe characters with percent-encoding, skipping already
// encoded sequences.
//
//  - string       - string to encode
//  - exclude      - list of characters to ignore (in addition to a-zA-Z0-9)
//  - keepEscaped  - don't encode '%' in a correct escape sequence (default: true)
//


function encode$1(string, exclude, keepEscaped) {
  var i,
      l,
      code,
      nextCode,
      cache,
      result = '';

  if (typeof exclude !== 'string') {
    // encode(string, keepEscaped)
    keepEscaped = exclude;
    exclude = encode$1.defaultChars;
  }

  if (typeof keepEscaped === 'undefined') {
    keepEscaped = true;
  }

  cache = getEncodeCache(exclude);

  for (i = 0, l = string.length; i < l; i++) {
    code = string.charCodeAt(i);

    if (keepEscaped && code === 0x25
    /* % */
    && i + 2 < l) {
      if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
        result += string.slice(i, i + 3);
        i += 2;
        continue;
      }
    }

    if (code < 128) {
      result += cache[code];
      continue;
    }

    if (code >= 0xD800 && code <= 0xDFFF) {
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < l) {
        nextCode = string.charCodeAt(i + 1);

        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          result += encodeURIComponent(string[i] + string[i + 1]);
          i++;
          continue;
        }
      }

      result += '%EF%BF%BD';
      continue;
    }

    result += encodeURIComponent(string[i]);
  }

  return result;
}

encode$1.defaultChars = ";/?:@&=+$,-_.!~*'()#";
encode$1.componentChars = "-_.!~*'()";
var encode_1 = encode$1;

/* eslint-disable no-bitwise */


var decodeCache = {};

function getDecodeCache(exclude) {
  var i,
      ch,
      cache = decodeCache[exclude];

  if (cache) {
    return cache;
  }

  cache = decodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);
    cache.push(ch);
  }

  for (i = 0; i < exclude.length; i++) {
    ch = exclude.charCodeAt(i);
    cache[ch] = '%' + ('0' + ch.toString(16).toUpperCase()).slice(-2);
  }

  return cache;
} // Decode percent-encoded string.
//


function decode(string, exclude) {
  var cache;

  if (typeof exclude !== 'string') {
    exclude = decode.defaultChars;
  }

  cache = getDecodeCache(exclude);
  return string.replace(/(%[a-f0-9]{2})+/gi, function (seq) {
    var i,
        l,
        b1,
        b2,
        b3,
        b4,
        chr,
        result = '';

    for (i = 0, l = seq.length; i < l; i += 3) {
      b1 = parseInt(seq.slice(i + 1, i + 3), 16);

      if (b1 < 0x80) {
        result += cache[b1];
        continue;
      }

      if ((b1 & 0xE0) === 0xC0 && i + 3 < l) {
        // 110xxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);

        if ((b2 & 0xC0) === 0x80) {
          chr = b1 << 6 & 0x7C0 | b2 & 0x3F;

          if (chr < 0x80) {
            result += '\ufffd\ufffd';
          } else {
            result += String.fromCharCode(chr);
          }

          i += 3;
          continue;
        }
      }

      if ((b1 & 0xF0) === 0xE0 && i + 6 < l) {
        // 1110xxxx 10xxxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
          chr = b1 << 12 & 0xF000 | b2 << 6 & 0xFC0 | b3 & 0x3F;

          if (chr < 0x800 || chr >= 0xD800 && chr <= 0xDFFF) {
            result += '\ufffd\ufffd\ufffd';
          } else {
            result += String.fromCharCode(chr);
          }

          i += 6;
          continue;
        }
      }

      if ((b1 & 0xF8) === 0xF0 && i + 9 < l) {
        // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        b4 = parseInt(seq.slice(i + 10, i + 12), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80 && (b4 & 0xC0) === 0x80) {
          chr = b1 << 18 & 0x1C0000 | b2 << 12 & 0x3F000 | b3 << 6 & 0xFC0 | b4 & 0x3F;

          if (chr < 0x10000 || chr > 0x10FFFF) {
            result += '\ufffd\ufffd\ufffd\ufffd';
          } else {
            chr -= 0x10000;
            result += String.fromCharCode(0xD800 + (chr >> 10), 0xDC00 + (chr & 0x3FF));
          }

          i += 9;
          continue;
        }
      }

      result += '\ufffd';
    }

    return result;
  });
}

decode.defaultChars = ';/?:@&=+$,#';
decode.componentChars = '';
var decode_1 = decode;

var format = function format(url) {
  var result = '';
  result += url.protocol || '';
  result += url.slashes ? '//' : '';
  result += url.auth ? url.auth + '@' : '';

  if (url.hostname && url.hostname.indexOf(':') !== -1) {
    // ipv6 address
    result += '[' + url.hostname + ']';
  } else {
    result += url.hostname || '';
  }

  result += url.port ? ':' + url.port : '';
  result += url.pathname || '';
  result += url.search || '';
  result += url.hash || '';
  return result;
};

// Changes from joyent/node:
//
// 1. No leading slash in paths,
//    e.g. in `url.parse('http://foo?bar')` pathname is ``, not `/`
//
// 2. Backslashes are not replaced with slashes,
//    so `http:\\example.org\` is treated like a relative path
//
// 3. Trailing colon is treated like a part of the path,
//    i.e. in `http://example.org:foo` pathname is `:foo`
//
// 4. Nothing is URL-encoded in the resulting object,
//    (in joyent/node some chars in auth and paths are encoded)
//
// 5. `url.parse()` does not have `parseQueryString` argument
//
// 6. Removed extraneous result properties: `host`, `path`, `query`, etc.,
//    which can be constructed using other parts of the url.
//


function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.pathname = null;
} // Reference: RFC 3986, RFC 1808, RFC 2396
// define these here so at least they only have to be
// compiled once on the first module load.


var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,
    // Special case for a simple path URL
simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
    // RFC 2396: characters reserved for delimiting URLs.
// We actually just auto-escape these.
delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
    // RFC 2396: characters not allowed for various reasons.
unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
// Note that any invalid chars are also handled, but these
// are the ones that are *expected* to be seen, so we fast-path
// them.
nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.

/* eslint-disable no-script-url */
// protocols that never have a hostname.
hostlessProtocol = {
  'javascript': true,
  'javascript:': true
},
    // protocols that always contain a // bit.
slashedProtocol = {
  'http': true,
  'https': true,
  'ftp': true,
  'gopher': true,
  'file': true,
  'http:': true,
  'https:': true,
  'ftp:': true,
  'gopher:': true,
  'file:': true
};
/* eslint-enable no-script-url */

function urlParse(url, slashesDenoteHost) {
  if (url && url instanceof Url) {
    return url;
  }

  var u = new Url();
  u.parse(url, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function (url, slashesDenoteHost) {
  var i,
      l,
      lowerProto,
      hec,
      slashes,
      rest = url; // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"

  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);

    if (simplePath) {
      this.pathname = simplePath[1];

      if (simplePath[2]) {
        this.search = simplePath[2];
      }

      return this;
    }
  }

  var proto = protocolPattern.exec(rest);

  if (proto) {
    proto = proto[0];
    lowerProto = proto.toLowerCase();
    this.protocol = proto;
    rest = rest.substr(proto.length);
  } // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.


  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    slashes = rest.substr(0, 2) === '//';

    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c
    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.
    // find the first instance of any hostEndingChars
    var hostEnd = -1;

    for (i = 0; i < hostEndingChars.length; i++) {
      hec = rest.indexOf(hostEndingChars[i]);

      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    } // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.


    var auth, atSign;

    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    } // Now we have a portion which is definitely the auth.
    // Pull that off.


    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = auth;
    } // the host is the remaining to the left of the first non-host char


    hostEnd = -1;

    for (i = 0; i < nonHostChars.length; i++) {
      hec = rest.indexOf(nonHostChars[i]);

      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    } // if we still have not hit it, then the entire thing is a host.


    if (hostEnd === -1) {
      hostEnd = rest.length;
    }

    if (rest[hostEnd - 1] === ':') {
      hostEnd--;
    }

    var host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd); // pull out port.

    this.parseHost(host); // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.

    this.hostname = this.hostname || ''; // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.

    var ipv6Hostname = this.hostname[0] === '[' && this.hostname[this.hostname.length - 1] === ']'; // validate a little.

    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);

      for (i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];

        if (!part) {
          continue;
        }

        if (!part.match(hostnamePartPattern)) {
          var newpart = '';

          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          } // we test again with ASCII char only


          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);

            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }

            if (notHost.length) {
              rest = notHost.join('.') + rest;
            }

            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } // strip [ and ] from the hostname
    // the host field still retains them, though


    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
    }
  } // chop off from the tail first.


  var hash = rest.indexOf('#');

  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }

  var qm = rest.indexOf('?');

  if (qm !== -1) {
    this.search = rest.substr(qm);
    rest = rest.slice(0, qm);
  }

  if (rest) {
    this.pathname = rest;
  }

  if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
    this.pathname = '';
  }

  return this;
};

Url.prototype.parseHost = function (host) {
  var port = portPattern.exec(host);

  if (port) {
    port = port[0];

    if (port !== ':') {
      this.port = port.substr(1);
    }

    host = host.substr(0, host.length - port.length);
  }

  if (host) {
    this.hostname = host;
  }
};

var parse$3 = urlParse;

mdurl$1.encode = encode_1;
mdurl$1.decode = decode_1;
mdurl$1.format = format;
mdurl$1.parse = parse$3;

var uc_micro = {};

var regex$3 = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;

var regex$2 = /[\0-\x1F\x7F-\x9F]/;

var regex$1 = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;

var regex = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;

uc_micro.Any = regex$3;
uc_micro.Cc = regex$2;
uc_micro.Cf = regex$1;
uc_micro.P = regex$4;
uc_micro.Z = regex;

(function (exports) {

  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }

  function isString(obj) {
    return _class(obj) === '[object String]';
  }

  var _hasOwnProperty = Object.prototype.hasOwnProperty;

  function has(object, key) {
    return _hasOwnProperty.call(object, key);
  } // Merge objects
  //


  function assign(obj
  /*from1, from2, from3, ...*/
  ) {
    var sources = Array.prototype.slice.call(arguments, 1);
    sources.forEach(function (source) {
      if (!source) {
        return;
      }

      if (typeof source !== 'object') {
        throw new TypeError(source + 'must be object');
      }

      Object.keys(source).forEach(function (key) {
        obj[key] = source[key];
      });
    });
    return obj;
  } // Remove element from array and put another array at those position.
  // Useful for some operations with tokens


  function arrayReplaceAt(src, pos, newElements) {
    return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
  } ////////////////////////////////////////////////////////////////////////////////


  function isValidEntityCode(c) {
    /*eslint no-bitwise:0*/
    // broken sequence
    if (c >= 0xD800 && c <= 0xDFFF) {
      return false;
    } // never used


    if (c >= 0xFDD0 && c <= 0xFDEF) {
      return false;
    }

    if ((c & 0xFFFF) === 0xFFFF || (c & 0xFFFF) === 0xFFFE) {
      return false;
    } // control codes


    if (c >= 0x00 && c <= 0x08) {
      return false;
    }

    if (c === 0x0B) {
      return false;
    }

    if (c >= 0x0E && c <= 0x1F) {
      return false;
    }

    if (c >= 0x7F && c <= 0x9F) {
      return false;
    } // out of range


    if (c > 0x10FFFF) {
      return false;
    }

    return true;
  }

  function fromCodePoint(c) {
    /*eslint no-bitwise:0*/
    if (c > 0xffff) {
      c -= 0x10000;
      var surrogate1 = 0xd800 + (c >> 10),
          surrogate2 = 0xdc00 + (c & 0x3ff);
      return String.fromCharCode(surrogate1, surrogate2);
    }

    return String.fromCharCode(c);
  }

  var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g;
  var ENTITY_RE = /&([a-z#][a-z0-9]{1,31});/gi;
  var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + '|' + ENTITY_RE.source, 'gi');
  var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))/i;
  var entities = entities$1;

  function replaceEntityPattern(match, name) {
    var code = 0;

    if (has(entities, name)) {
      return entities[name];
    }

    if (name.charCodeAt(0) === 0x23
    /* # */
    && DIGITAL_ENTITY_TEST_RE.test(name)) {
      code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);

      if (isValidEntityCode(code)) {
        return fromCodePoint(code);
      }
    }

    return match;
  }
  /*function replaceEntities(str) {
    if (str.indexOf('&') < 0) { return str; }
  
    return str.replace(ENTITY_RE, replaceEntityPattern);
  }*/


  function unescapeMd(str) {
    if (str.indexOf('\\') < 0) {
      return str;
    }

    return str.replace(UNESCAPE_MD_RE, '$1');
  }

  function unescapeAll(str) {
    if (str.indexOf('\\') < 0 && str.indexOf('&') < 0) {
      return str;
    }

    return str.replace(UNESCAPE_ALL_RE, function (match, escaped, entity) {
      if (escaped) {
        return escaped;
      }

      return replaceEntityPattern(match, entity);
    });
  } ////////////////////////////////////////////////////////////////////////////////


  var HTML_ESCAPE_TEST_RE = /[&<>"]/;
  var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
  var HTML_REPLACEMENTS = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };

  function replaceUnsafeChar(ch) {
    return HTML_REPLACEMENTS[ch];
  }

  function escapeHtml(str) {
    if (HTML_ESCAPE_TEST_RE.test(str)) {
      return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
    }

    return str;
  } ////////////////////////////////////////////////////////////////////////////////


  var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;

  function escapeRE(str) {
    return str.replace(REGEXP_ESCAPE_RE, '\\$&');
  } ////////////////////////////////////////////////////////////////////////////////


  function isSpace(code) {
    switch (code) {
      case 0x09:
      case 0x20:
        return true;
    }

    return false;
  } // Zs (unicode class) || [\t\f\v\r\n]


  function isWhiteSpace(code) {
    if (code >= 0x2000 && code <= 0x200A) {
      return true;
    }

    switch (code) {
      case 0x09: // \t

      case 0x0A: // \n

      case 0x0B: // \v

      case 0x0C: // \f

      case 0x0D: // \r

      case 0x20:
      case 0xA0:
      case 0x1680:
      case 0x202F:
      case 0x205F:
      case 0x3000:
        return true;
    }

    return false;
  } ////////////////////////////////////////////////////////////////////////////////

  /*eslint-disable max-len*/


  var UNICODE_PUNCT_RE = regex$4; // Currently without astral characters support.

  function isPunctChar(ch) {
    return UNICODE_PUNCT_RE.test(ch);
  } // Markdown ASCII punctuation characters.
  //
  // !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~
  // http://spec.commonmark.org/0.15/#ascii-punctuation-character
  //
  // Don't confuse with unicode punctuation !!! It lacks some chars in ascii range.
  //


  function isMdAsciiPunct(ch) {
    switch (ch) {
      case 0x21
      /* ! */
      :
      case 0x22
      /* " */
      :
      case 0x23
      /* # */
      :
      case 0x24
      /* $ */
      :
      case 0x25
      /* % */
      :
      case 0x26
      /* & */
      :
      case 0x27
      /* ' */
      :
      case 0x28
      /* ( */
      :
      case 0x29
      /* ) */
      :
      case 0x2A
      /* * */
      :
      case 0x2B
      /* + */
      :
      case 0x2C
      /* , */
      :
      case 0x2D
      /* - */
      :
      case 0x2E
      /* . */
      :
      case 0x2F
      /* / */
      :
      case 0x3A
      /* : */
      :
      case 0x3B
      /* ; */
      :
      case 0x3C
      /* < */
      :
      case 0x3D
      /* = */
      :
      case 0x3E
      /* > */
      :
      case 0x3F
      /* ? */
      :
      case 0x40
      /* @ */
      :
      case 0x5B
      /* [ */
      :
      case 0x5C
      /* \ */
      :
      case 0x5D
      /* ] */
      :
      case 0x5E
      /* ^ */
      :
      case 0x5F
      /* _ */
      :
      case 0x60
      /* ` */
      :
      case 0x7B
      /* { */
      :
      case 0x7C
      /* | */
      :
      case 0x7D
      /* } */
      :
      case 0x7E
      /* ~ */
      :
        return true;

      default:
        return false;
    }
  } // Hepler to unify [reference labels].
  //


  function normalizeReference(str) {
    // Trim and collapse whitespace
    //
    str = str.trim().replace(/\s+/g, ' '); // In node v10 'ẞ'.toLowerCase() === 'Ṿ', which is presumed to be a bug
    // fixed in v12 (couldn't find any details).
    //
    // So treat this one as a special case
    // (remove this when node v10 is no longer supported).
    //

    if ('ẞ'.toLowerCase() === 'Ṿ') {
      str = str.replace(/ẞ/g, 'ß');
    } // .toLowerCase().toUpperCase() should get rid of all differences
    // between letter variants.
    //
    // Simple .toLowerCase() doesn't normalize 125 code points correctly,
    // and .toUpperCase doesn't normalize 6 of them (list of exceptions:
    // İ, ϴ, ẞ, Ω, K, Å - those are already uppercased, but have differently
    // uppercased versions).
    //
    // Here's an example showing how it happens. Lets take greek letter omega:
    // uppercase U+0398 (Θ), U+03f4 (ϴ) and lowercase U+03b8 (θ), U+03d1 (ϑ)
    //
    // Unicode entries:
    // 0398;GREEK CAPITAL LETTER THETA;Lu;0;L;;;;;N;;;;03B8;
    // 03B8;GREEK SMALL LETTER THETA;Ll;0;L;;;;;N;;;0398;;0398
    // 03D1;GREEK THETA SYMBOL;Ll;0;L;<compat> 03B8;;;;N;GREEK SMALL LETTER SCRIPT THETA;;0398;;0398
    // 03F4;GREEK CAPITAL THETA SYMBOL;Lu;0;L;<compat> 0398;;;;N;;;;03B8;
    //
    // Case-insensitive comparison should treat all of them as equivalent.
    //
    // But .toLowerCase() doesn't change ϑ (it's already lowercase),
    // and .toUpperCase() doesn't change ϴ (already uppercase).
    //
    // Applying first lower then upper case normalizes any character:
    // '\u0398\u03f4\u03b8\u03d1'.toLowerCase().toUpperCase() === '\u0398\u0398\u0398\u0398'
    //
    // Note: this is equivalent to unicode case folding; unicode normalization
    // is a different step that is not required here.
    //
    // Final result should be uppercased, because it's later stored in an object
    // (this avoid a conflict with Object.prototype members,
    // most notably, `__proto__`)
    //


    return str.toLowerCase().toUpperCase();
  } ////////////////////////////////////////////////////////////////////////////////
  // Re-export libraries commonly used in both markdown-it and its plugins,
  // so plugins won't have to depend on them explicitly, which reduces their
  // bundled size (e.g. a browser build).
  //


  exports.lib = {};
  exports.lib.mdurl = mdurl$1;
  exports.lib.ucmicro = uc_micro;
  exports.assign = assign;
  exports.isString = isString;
  exports.has = has;
  exports.unescapeMd = unescapeMd;
  exports.unescapeAll = unescapeAll;
  exports.isValidEntityCode = isValidEntityCode;
  exports.fromCodePoint = fromCodePoint; // exports.replaceEntities     = replaceEntities;

  exports.escapeHtml = escapeHtml;
  exports.arrayReplaceAt = arrayReplaceAt;
  exports.isSpace = isSpace;
  exports.isWhiteSpace = isWhiteSpace;
  exports.isMdAsciiPunct = isMdAsciiPunct;
  exports.isPunctChar = isPunctChar;
  exports.escapeRE = escapeRE;
  exports.normalizeReference = normalizeReference;
})(utils$2);

const OptionDefaults = {
  allow_space: true,
  allow_digits: true,
  double_inline: true,
  allow_labels: true,

  labelNormalizer(label) {
    return label.replace(/[\s]+/g, "-");
  },

  renderer(content) {
    return utils$2.escapeHtml(content);
  },

  labelRenderer(label) {
    return `<a href="#${label}" class="mathlabel" title="Permalink to this equation">¶</a>`;
  }

};
/**
 * A markdown-it plugin for parsing dollar delimited math,
 * e.g. inline: ``$a=1$``, block: ``$$b=2$$`
 */

function dollarmathPlugin(md, options) {
  const fullOptions = Object.assign(Object.assign({}, OptionDefaults), options);
  md.inline.ruler.before("escape", "math_inline", math_inline_dollar(fullOptions));
  md.block.ruler.before("fence", "math_block", math_block_dollar(fullOptions));

  const createRule = opts => (tokens, idx) => {
    const content = tokens[idx].content.trim();
    let res;

    try {
      res = fullOptions.renderer(content, {
        displayMode: opts.displayMode
      });
    } catch (err) {
      res = md.utils.escapeHtml(`${content}:${err.message}`);
    }

    const className = opts.inline ? "inline" : "block";
    const tag = opts.displayMode ? "div" : "span";
    const newline = opts.inline ? "" : "\n";
    const id = tokens[idx].info;
    const label = opts.hasLabel ? `${fullOptions.labelRenderer(id)}` : "";
    return [`<${tag} ${id ? `id="${id}" ` : ""}class="math ${className}">`, label, res, `</${tag}>`].filter(v => !!v).join(newline) + newline;
  };

  md.renderer.rules["math_inline"] = createRule({
    displayMode: false,
    inline: true
  });
  md.renderer.rules["math_inline_double"] = createRule({
    displayMode: true,
    inline: true
  });
  md.renderer.rules["math_block"] = createRule({
    displayMode: true
  });
  md.renderer.rules["math_block_label"] = createRule({
    displayMode: true,
    hasLabel: true
  });
} // Exporting both a default and named export is necessary for Jest in some cases
/** Test if dollar is escaped */

function isEscaped(state, back_pos, mod = 0) {
  // count how many backslashes are before the current position
  let backslashes = 0;

  while (back_pos >= 0) {
    back_pos = back_pos - 1;

    if (state.src.charCodeAt(back_pos) === 0x5c) {
      backslashes += 1;
    } else {
      break;
    }
  }

  if (backslashes === 0) {
    return false;
  } // if an odd number of backslashes then ignore


  if (backslashes % 2 !== mod) {
    return true;
  }

  return false;
}
/** Generate inline dollar rule  */


function math_inline_dollar(options) {
  /** Inline dollar rule:
   *
    - Initial check:
        - check if first character is a $
        - check if the first character is escaped
        - check if the next character is a space (if not allow_space)
        - check if the next character is a digit (if not allow_digits)
    - Advance one, if allow_double
    - Find closing (advance one, if allow_double)
    - Check closing:
        - check if the previous character is a space (if not allow_space)
        - check if the next character is a digit (if not allow_digits)
    - Check empty content
   *
  */
  function math_inline_dollar_rule(state, silent) {
    if (state.src.charCodeAt(state.pos) !== 0x24
    /* $ */
    ) {
      return false;
    }

    if (!options.allow_space) {
      // whitespace not allowed straight after opening $
      if (state.md.utils.isWhiteSpace(state.src.charCodeAt(state.pos + 1))) {
        return false;
      }
    }

    if (!options.allow_digits) {
      // digit not allowed straight before opening $
      const char = state.src.charAt(state.pos - 1);

      if (!!char && char.trim() !== "" && !isNaN(Number(char))) {
        return false;
      }
    }

    if (isEscaped(state, state.pos)) {
      return false;
    } // check if double dollar (if allowed)


    let is_double = false;

    if (options.double_inline && state.src.charCodeAt(state.pos + 1) === 0x24) {
      is_double = true;
    } // find closing $


    let pos = state.pos + 1 + (is_double ? 1 : 0);
    let found_closing = false;
    let end = -1;

    while (!found_closing) {
      end = state.src.indexOf("$", pos);

      if (end === -1) {
        return false;
      }

      if (isEscaped(state, end)) {
        pos = end + 1;
        continue;
      }

      if (is_double && state.src.charCodeAt(end + 1) !== 0x24) {
        pos = end + 1;
        continue;
      }

      if (is_double) {
        end += 1;
      }

      found_closing = true;
    }

    if (!found_closing) {
      return false;
    }

    if (!options.allow_space) {
      // whitespace not allowed straight before closing $
      const charCode = state.src.charCodeAt(end - 1);

      if (state.md.utils.isWhiteSpace(charCode)) {
        return false;
      }
    }

    if (!options.allow_digits) {
      // digit not allowed straight after closing $
      const char = state.src.charAt(end + 1);

      if (!!char && char.trim() !== "" && !isNaN(Number(char))) {
        return false;
      }
    }

    let text = state.src.slice(state.pos + 1, end);

    if (is_double) {
      text = state.src.slice(state.pos + 2, end - 1);
    }

    if (!text) {
      // ignore empty
      return false;
    }

    if (!silent) {
      const token = state.push(is_double ? "math_inline_double" : "math_inline", "math", 0);
      token.content = text;
      token.markup = is_double ? "$$" : "$";
    }

    state.pos = end + 1;
    return true;
  }

  return math_inline_dollar_rule;
}
/** Match a trailing label for a math block */


function matchLabel(lineText, end) {
  // reverse the line and match
  const eqnoMatch = lineText.split("").reverse().join("").match(/^\s*\)(?<label>[^)$\r\n]+?)\(\s*\${2}/);

  if (eqnoMatch && eqnoMatch.groups) {
    const label = eqnoMatch.groups["label"].split("").reverse().join("");
    end = end - ((eqnoMatch.index || 0) + eqnoMatch[0].length);
    return {
      label,
      end
    };
  }

  return {
    end
  };
}
/** Generate inline dollar rule */


function math_block_dollar(options) {
  /** Block dollar rule */
  function math_block_dollar_rule(state, startLine, endLine, // eslint-disable-next-line @typescript-eslint/no-unused-vars
  silent) {
    let haveEndMarker = false;
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    let end = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }

    if (startPos + 2 > end) {
      return false;
    }

    if (state.src.charCodeAt(startPos) != 0x24 || state.src.charCodeAt(startPos + 1) != 0x24) {
      return false;
    } // search for end of block


    let nextLine = startLine;
    let label = undefined; // search for end of block on same line

    let lineText = state.src.slice(startPos, end);

    if (lineText.trim().length > 3) {
      if (lineText.trim().endsWith("$$")) {
        haveEndMarker = true;
        end = end - 2 - (lineText.length - lineText.trim().length);
      } else if (options.allow_labels) {
        const output = matchLabel(lineText, end);

        if (output.label !== undefined) {
          haveEndMarker = true;
          label = output.label;
          end = output.end;
        }
      }
    } // search for end of block on subsequent line


    let start;

    if (!haveEndMarker) {
      while (nextLine + 1 < endLine) {
        nextLine += 1;
        start = state.bMarks[nextLine] + state.tShift[nextLine];
        end = state.eMarks[nextLine];

        if (end - start < 2) {
          continue;
        }

        lineText = state.src.slice(start, end);

        if (lineText.trim().endsWith("$$")) {
          haveEndMarker = true;
          end = end - 2 - (lineText.length - lineText.trim().length);
          break;
        }

        if (options.allow_labels) {
          const output = matchLabel(lineText, end);

          if (output.label !== undefined) {
            haveEndMarker = true;
            label = output.label;
            end = output.end;
            break;
          }
        }
      }
    }

    if (!haveEndMarker) {
      return false;
    }

    state.line = nextLine + (haveEndMarker ? 1 : 0);
    const token = state.push(label ? "math_block_label" : "math_block", "math", 0);
    token.block = true;
    token.content = state.src.slice(startPos + 2, end).trim();
    token.markup = "$$";
    token.map = [startLine, state.line];

    if (label) {
      token.info = options.labelNormalizer ? options.labelNormalizer(label) : label;
    }

    return true;
  }

  return math_block_dollar_rule;
}

/**
 * An markdown-it plugin that parses bare LaTeX [amsmath](https://ctan.org/pkg/amsmath) environments.
 *
 * ```latex
    \begin{gather*}
      a_1=b_1+c_1\\
      a_2=b_2+c_2-d_2+e_2
    \end{gather*}
  ```
 *
 */
function amsmathPlugin(md, options) {
  md.block.ruler.before("blockquote", "amsmath", amsmathBlock, {
    alt: ["paragraph", "reference", "blockquote", "list", "footnote_def"]
  });
  const renderer = options === null || options === void 0 ? void 0 : options.renderer;

  if (renderer) {
    md.renderer.rules["amsmath"] = (tokens, idx) => {
      const content = tokens[idx].content;
      let res;

      try {
        res = renderer(content);
      } catch (err) {
        res = md.utils.escapeHtml(`${content}:${err.message}`);
      }

      return res;
    };
  } else {
    // basic renderer for testing
    md.renderer.rules["amsmath"] = (tokens, idx) => {
      const content = md.utils.escapeHtml(tokens[idx].content);
      return `<div class="math amsmath">\n${content}\n</div>\n`;
    };
  }
} // Exporting both a default and named export is necessary for Jest in some cases
// http://anorien.csc.warwick.ac.uk/mirrors/CTAN/macros/latex/required/amsmath/amsldoc.pdf

const ENVIRONMENTS = [// 3.2 single equation with an automatically generated number
"equation", // 3.3 variation equation, used for equations that don’t fit on a single line
"multline", // 3.5 a group of consecutive equations when there is no alignment desired among them
"gather", // 3.6 Used for two or more equations when vertical alignment is desired
"align", // allows the horizontal space between equations to be explicitly specified.
"alignat", // stretches the space between the equation columns to the maximum possible width
"flalign", // 4.1 The pmatrix, bmatrix, Bmatrix, vmatrix and Vmatrix have (respectively)
// (),[],{},||,and ‖‖ delimiters built in.
"matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", // eqnarray is another math environment, it is not part of amsmath,
// and note that it is better to use align or equation+split instead
"eqnarray"]; // other "non-top-level" environments:
// 3.4 the split environment is for single equations that are too long to fit on one line
// and hence must be split into multiple lines,
// it is intended for use only inside some other displayed equation structure,
// usually an equation, align, or gather environment
// 3.7 variants gathered, aligned,and alignedat are provided
// whose total width is the actual width of the contents;
// thus they can be used as a component in a containing expression

const RE_OPEN = new RegExp(`^\\\\begin{(${ENVIRONMENTS.join("|")})([*]?)}`);

function matchEnvironment(string) {
  const matchOpen = string.match(RE_OPEN);
  if (!matchOpen) return null;
  const [, environment, numbered] = matchOpen;
  const end = `\\end{${environment}${numbered}}`;
  const matchClose = string.indexOf(end);
  if (matchClose === -1) return null;
  return {
    environment,
    numbered,
    endpos: matchClose + end.length
  };
}

function amsmathBlock(state, startLine, endLine, silent) {
  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const begin = state.bMarks[startLine] + state.tShift[startLine];
  const outcome = matchEnvironment(state.src.slice(begin));
  if (!outcome) return false;
  const {
    environment,
    numbered
  } = outcome;
  let {
    endpos
  } = outcome;
  endpos += begin;
  let line = startLine;

  while (line < endLine) {
    if (endpos >= state.bMarks[line] && endpos <= state.eMarks[line]) {
      // line for end of block math found ...
      // eslint-disable-next-line no-param-reassign
      state.line = line + 1;
      break;
    }

    line += 1;
  }

  if (!silent) {
    const token = state.push("amsmath", "math", 0);
    token.block = true;
    token.content = state.src.slice(begin, endpos);
    token.meta = {
      environment,
      numbered
    };
    token.map = [startLine, line];
  }

  return true;
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

const HTML_EMPTY_ELEMENTS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);
const formatAttr = (key, value) => {
    let v;
    if (value == null)
        return null;
    if (Array.isArray(value)) {
        v = value.join(' ');
    }
    else if (typeof value === 'number') {
        v = String(value);
    }
    else if (typeof value === 'boolean') {
        if (!value)
            return null;
        v = '';
    }
    else {
        v = value;
    }
    return `${key}="${utils$2.escapeHtml(v)}"`;
};
function formatTag(tag, attributes, inline) {
    const { children } = attributes, rest = __rest(attributes, ["children"]);
    const join = inline ? '' : '\n';
    const attrs = Object.entries(rest)
        .filter(([, value]) => value != null && value !== false)
        .map(([key, value]) => formatAttr(key, value))
        .filter((value) => value != null)
        .join(' ');
    const html = `<${utils$2.escapeHtml(tag)}${attrs ? ` ${attrs}` : ''}>`;
    if (children)
        return `${html}${join}${utils$2.escapeHtml(String(children))}`;
    return html;
}
function toHTMLRecurse(template, inline) {
    // Convert to an internal type which is actually an array
    const T = template;
    // Cannot have more than one hole in the template
    const atMostOneHole = T.flat(Infinity).filter((v) => v === 0).length <= 1;
    if (!atMostOneHole)
        throw new Error('There cannot be more than one hole in the template.');
    // Grab the tag and attributes if they exist!
    const tag = T[0];
    const hasAttrs = !Array.isArray(T === null || T === void 0 ? void 0 : T[1]) && typeof (T === null || T === void 0 ? void 0 : T[1]) === 'object';
    const attrs = hasAttrs ? T[1] : {};
    // These are the tag arrays before and after the hole.
    const before = [];
    const after = [];
    before.push(formatTag(tag, attrs, inline));
    let foundHole = false;
    T.slice(hasAttrs ? 2 : 1).forEach((value) => {
        const v = value;
        if (v === 0) {
            foundHole = true;
            return;
        }
        // Recurse, if a hole is found then split the return
        const [b, a] = toHTMLRecurse(v, inline);
        before.push(b);
        if (a) {
            foundHole = true;
            after.push(a);
        }
    });
    const join = inline ? '' : '\n';
    const closingTag = HTML_EMPTY_ELEMENTS.has(tag) ? '' : `</${tag}>`;
    if (!foundHole) {
        if (closingTag)
            before.push(closingTag);
        return [before.join(join), null];
    }
    if (closingTag)
        after.push(closingTag);
    return [before.join(join), after.join(join)];
}
/**
 * A helper function to create valid HTML with a "hole" (represented by zero) for content.
 *
 * The content is escaped and null/undefined attributes are not included.
 *
 * **A simple wrapper tag:**
 * ```
 * const attr = 'hello';
 * const html = toHTML(['tag', {attr}, 0]);
 * console.log(html);
 * > ['<tag attr="hello">', '</tag>']
 * ```
 *
 * **A nested wrapper tag:**
 * ```
 * const html = toHTML([
 *  'tag', {attr},
 *  ['img', {src}],
 *  ['caption', 0],
 * ]);
 * console.log(html);
 * > ['<tag attr="x"><img src="src"><caption>', '</caption></tag>']
 * ```
 *
 * You can include `children` in the `attrs` and that adds inline content for a tag.
 *
 * You can also send in a list of strings for `attrs`, which are joined with a space (`' '`).
 *
 * Types are based on prosemirror-model.
 *
 * @param spec The spec for the dom model.
 * @param opts Options dict, `inline` creates HTML that is on a single line.
 */
function toHTML(template, opts = { inline: false }) {
    const [before, after] = toHTMLRecurse(template, opts.inline);
    const join = opts.inline ? '' : '\n';
    return [`${before}${join}`, after ? `${after}${join}` : null];
}

const renderMath = (math, block, target) => {
    const { id, number } = target !== null && target !== void 0 ? target : {};
    const [html] = toHTML([
        block ? 'div' : 'span',
        {
            class: target ? ['math', 'numbered'] : 'math',
            id,
            number,
            children: block ? `\\[\n${math}\n\\]` : `\\(${math}\\)`,
        },
    ], { inline: true });
    return block ? `${html}\n` : html;
};

function addMathRenderers(md) {
    const { renderer } = md;
    renderer.rules.math_inline = (tokens, idx) => renderMath(tokens[idx].content, false);
    // Note: this will actually create invalid HTML
    renderer.rules.math_inline_double = (tokens, idx) => renderMath(tokens[idx].content, true);
    renderer.rules.math_block = (tokens, idx) => renderMath(tokens[idx].content, true);
    renderer.rules.math_block_label = (tokens, idx) => { var _a; return renderMath(tokens[idx].content, true, (_a = tokens[idx].meta) === null || _a === void 0 ? void 0 : _a.target); };
}
function plugin(md, options) {
    const opts = options === true ? { amsmath: true, dollarmath: true } : options;
    if (opts === null || opts === void 0 ? void 0 : opts.dollarmath)
        dollarmathPlugin(md);
    if (opts === null || opts === void 0 ? void 0 : opts.amsmath)
        amsmathPlugin(md, {
            renderer: (content) => renderMath(content, true),
        });
    // Note: numbering of equations for `math_block_label` happens in the directives rules
    addMathRenderers(md);
}

/** Markdown-it plugin to convert the front-matter token to a renderable token, for previews */
function convertFrontMatter(md) {
    md.core.ruler.after('block', 'convert_front_matter', (state) => {
        if (state.tokens.length && state.tokens[0].type === 'front_matter') {
            const replace = new state.Token('fence', 'code', 0);
            replace.map = state.tokens[0].map;
            replace.info = 'yaml';
            replace.content = state.tokens[0].meta;
            state.tokens[0] = replace;
        }
        return true;
    });
}

var plugins = /*#__PURE__*/Object.freeze({
	__proto__: null,
	convertFrontMatter: convertFrontMatter,
	frontMatterPlugin: markdownItFrontMatter,
	footnotePlugin: markdownItFootnote,
	tasklistPlugin: markdownItTaskLists,
	deflistPlugin: markdownItDeflist,
	docutilsPlugin: docutilsPlugin,
	mystBlockPlugin: mystBlockPlugin,
	mathPlugin: plugin
});

var AdmonitionKind;
(function (AdmonitionKind) {
    AdmonitionKind["admonition"] = "admonition";
    AdmonitionKind["attention"] = "attention";
    AdmonitionKind["caution"] = "caution";
    AdmonitionKind["danger"] = "danger";
    AdmonitionKind["error"] = "error";
    AdmonitionKind["important"] = "important";
    AdmonitionKind["hint"] = "hint";
    AdmonitionKind["note"] = "note";
    AdmonitionKind["seealso"] = "seealso";
    AdmonitionKind["tip"] = "tip";
    AdmonitionKind["warning"] = "warning";
})(AdmonitionKind || (AdmonitionKind = {}));

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist').Literal} Literal
 * @typedef {Object.<string, unknown>} Props
 * @typedef {Array.<Node>|string} ChildrenOrValue
 *
 * @typedef {(<T extends string, P extends Record<string, unknown>, C extends Node[]>(type: T, props: P, children: C) => {type: T, children: C} & P)} BuildParentWithProps
 * @typedef {(<T extends string, P extends Record<string, unknown>>(type: T, props: P, value: string) => {type: T, value: string} & P)} BuildLiteralWithProps
 * @typedef {(<T extends string, P extends Record<string, unknown>>(type: T, props: P) => {type: T} & P)} BuildVoidWithProps
 * @typedef {(<T extends string, C extends Node[]>(type: T, children: C) => {type: T, children: C})} BuildParent
 * @typedef {(<T extends string>(type: T, value: string) => {type: T, value: string})} BuildLiteral
 * @typedef {(<T extends string>(type: T) => {type: T})} BuildVoid
 */
var u =
/**
* @type {BuildVoid & BuildVoidWithProps & BuildLiteral & BuildLiteralWithProps & BuildParent & BuildParentWithProps}
*/

/**
 * @param {string} type Type of node
 * @param {Props|ChildrenOrValue} [props] Additional properties for node (or `children` or `value`)
 * @param {ChildrenOrValue} [value] `children` or `value` of node
 * @returns {Node}
 */
function (type, props, value) {
  /** @type {Node} */
  var node = {
    type: String(type)
  };

  if ((value === undefined || value === null) && (typeof props === 'string' || Array.isArray(props))) {
    value = props;
  } else {
    Object.assign(node, props);
  }

  if (Array.isArray(value)) {
    node.children = value;
  } else if (value !== undefined && value !== null) {
    node.value = String(value);
  }

  return node;
};

function admonitionKindToTitle(kind) {
    const transform = {
        attention: 'Attention',
        caution: 'Caution',
        danger: 'Danger',
        error: 'Error',
        important: 'Important',
        hint: 'Hint',
        note: 'Note',
        seealso: 'See Also',
        tip: 'Tip',
        warning: 'Warning',
    };
    return transform[kind] || `Unknown Admonition "${kind}"`;
}
function withoutTrailingNewline(str) {
    return str[str.length - 1] == '\n' ? str.slice(0, str.length - 1) : str;
}
/**
 * https://github.com/syntax-tree/mdast#association
 * @param label A label field can be present.
 *        label is a string value: it works just like title on a link or a
 *        lang on code: character escapes and character references are parsed.
 * @returns { identifier, label }
 */
function normalizeLabel(label) {
    if (!label)
        return undefined;
    const identifier = label
        .replace(/[\t\n\r ]+/g, ' ')
        .trim()
        .toLowerCase();
    return { identifier, label };
}
function setTextAsChild(node, text) {
    node.children = [{ type: 'text', value: text }];
}

/** MarkdownParseState tracks the context of a running token stream.
 *
 * Loosly based on prosemirror-markdown
 */
class MarkdownParseState {
    constructor(handlers) {
        this.stack = [u('root', [])];
        this.handlers = getTokenHandlers(handlers);
    }
    top() {
        return this.stack[this.stack.length - 1];
    }
    addNode(node) {
        var _a;
        const top = this.top();
        if (this.stack.length && node && 'children' in top)
            (_a = top.children) === null || _a === void 0 ? void 0 : _a.push(node);
        return node;
    }
    addText(text, type = 'text', attrs) {
        var _a, _b;
        const top = this.top();
        const value = text;
        if (!value || !this.stack.length || !type || !('children' in top))
            return;
        const last = (_a = top.children) === null || _a === void 0 ? void 0 : _a[top.children.length - 1];
        if (type === 'text' && (last === null || last === void 0 ? void 0 : last.type) === type) {
            // The last node is also text, merge it with a space
            last.value += `${value}`;
            return last;
        }
        const node = Object.assign(Object.assign({ type }, attrs), { value });
        (_b = top.children) === null || _b === void 0 ? void 0 : _b.push(node);
        return node;
    }
    openNode(type, attrs, isLeaf = false) {
        const node = Object.assign({ type }, attrs);
        if (!isLeaf)
            node.children = [];
        this.stack.push(node);
    }
    closeNode() {
        const node = this.stack.pop();
        return this.addNode(node);
    }
    parseTokens(tokens) {
        tokens === null || tokens === void 0 ? void 0 : tokens.forEach((token, index) => {
            if (token.hidden)
                return;
            const handler = this.handlers[token.type];
            if (!handler)
                throw new Error('Token type `' + token.type + '` not supported by tokensToMyst parser');
            handler(this, token, tokens, index);
        });
    }
}
function attrs(spec, token, tokens, index) {
    var _a;
    const attrs = ((_a = spec.getAttrs) === null || _a === void 0 ? void 0 : _a.call(spec, token, tokens, index)) || spec.attrs || {};
    if ('type' in attrs)
        throw new Error('You can not have "type" as attrs.');
    if ('children' in attrs)
        throw new Error('You can not have "children" as attrs.');
    return attrs;
}
function noCloseToken(spec, type) {
    return (spec.noCloseToken ||
        type == 'code_inline' ||
        type == 'code_block' ||
        type == 'fence');
}
function getTokenHandlers(specHandlers) {
    const handlers = {};
    Object.entries(specHandlers).forEach(([type, spec]) => {
        const nodeType = spec.type;
        if (noCloseToken(spec, type)) {
            handlers[type] = (state, tok, tokens, i) => {
                if (spec.isText) {
                    state.addText(withoutTrailingNewline(tok.content), spec.type, attrs(spec, tok, tokens, i));
                    return;
                }
                state.openNode(nodeType, attrs(spec, tok, tokens, i), spec.isLeaf);
                state.addText(withoutTrailingNewline(tok.content));
                state.closeNode();
            };
        }
        else {
            handlers[type + '_open'] = (state, tok, tokens, i) => state.openNode(nodeType, attrs(spec, tok, tokens, i));
            handlers[type + '_close'] = (state) => state.closeNode();
        }
    });
    handlers.text = (state, tok) => state.addText(tok.content);
    handlers.inline = (state, tok) => state.parseTokens(tok.children);
    handlers.softbreak = handlers.softbreak || ((state) => state.addText('\n'));
    return handlers;
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 *
 * @typedef {string} Type
 * @typedef {Object<string, unknown>} Props
 *
 * @typedef {null|undefined|Type|Props|TestFunctionAnything|Array.<Type|Props|TestFunctionAnything>} Test
 */
const convert$2 =
/**
 * @type {(
 *   (<T extends Node>(test: T['type']|Partial<T>|TestFunctionPredicate<T>) => AssertPredicate<T>) &
 *   ((test?: Test) => AssertAnything)
 * )}
 */

/**
 * Generate an assertion from a check.
 * @param {Test} [test]
 * When nullish, checks if `node` is a `Node`.
 * When `string`, works like passing `function (node) {return node.type === test}`.
 * When `function` checks if function passed the node is true.
 * When `object`, checks that all keys in test are in node, and that they have (strictly) equal values.
 * When `array`, checks any one of the subtests pass.
 * @returns {AssertAnything}
 */
function (test) {
  if (test === undefined || test === null) {
    return ok$1;
  }

  if (typeof test === 'string') {
    return typeFactory(test);
  }

  if (typeof test === 'object') {
    return Array.isArray(test) ? anyFactory$1(test) : propsFactory(test);
  }

  if (typeof test === 'function') {
    return castFactory$1(test);
  }

  throw new Error('Expected function, string, or object as test');
};
/**
 * @param {Array.<Type|Props|TestFunctionAnything>} tests
 * @returns {AssertAnything}
 */

function anyFactory$1(tests) {
  /** @type {Array.<AssertAnything>} */
  const checks = [];
  let index = -1;

  while (++index < tests.length) {
    checks[index] = convert$2(tests[index]);
  }

  return castFactory$1(any);
  /**
   * @this {unknown}
   * @param {unknown[]} parameters
   * @returns {boolean}
   */

  function any(...parameters) {
    let index = -1;

    while (++index < checks.length) {
      if (checks[index].call(this, ...parameters)) return true;
    }

    return false;
  }
}
/**
 * Utility to assert each property in `test` is represented in `node`, and each
 * values are strictly equal.
 *
 * @param {Props} check
 * @returns {AssertAnything}
 */


function propsFactory(check) {
  return castFactory$1(all);
  /**
   * @param {Node} node
   * @returns {boolean}
   */

  function all(node) {
    /** @type {string} */
    let key;

    for (key in check) {
      // @ts-expect-error: hush, it sure works as an index.
      if (node[key] !== check[key]) return false;
    }

    return true;
  }
}
/**
 * Utility to convert a string into a function which checks a given node’s type
 * for said string.
 *
 * @param {Type} check
 * @returns {AssertAnything}
 */


function typeFactory(check) {
  return castFactory$1(type);
  /**
   * @param {Node} node
   */

  function type(node) {
    return node && node.type === check;
  }
}
/**
 * Utility to convert a string into a function which checks a given node’s type
 * for said string.
 * @param {TestFunctionAnything} check
 * @returns {AssertAnything}
 */


function castFactory$1(check) {
  return assertion;
  /**
   * @this {unknown}
   * @param {Array.<unknown>} parameters
   * @returns {boolean}
   */

  function assertion(...parameters) {
    // @ts-expect-error: spreading is fine.
    return Boolean(check.call(this, ...parameters));
  }
} // Utility to return true.


function ok$1() {
  return true;
}

/**
 * @param {string} d
 * @returns {string}
 */
function color$2(d) {
  return d;
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 * @typedef {import('./complex-types').Action} Action
 * @typedef {import('./complex-types').Index} Index
 * @typedef {import('./complex-types').ActionTuple} ActionTuple
 * @typedef {import('./complex-types').VisitorResult} VisitorResult
 * @typedef {import('./complex-types').Visitor} Visitor
 */
/**
 * Continue traversing as normal
 */

const CONTINUE$2 = true;
/**
 * Do not traverse this node’s children
 */

const SKIP$2 = 'skip';
/**
 * Stop traversing immediately
 */

const EXIT$2 = false;
/**
 * Visit children of tree which pass a test
 *
 * @param tree Abstract syntax tree to walk
 * @param test Test node, optional
 * @param visitor Function to run for each node
 * @param reverse Visit the tree in reverse order, defaults to false
 */

const visitParents$2 =
/**
 * @type {(
 *   (<Tree extends Node, Check extends Test>(tree: Tree, test: Check, visitor: import('./complex-types').BuildVisitor<Tree, Check>, reverse?: boolean) => void) &
 *   (<Tree extends Node>(tree: Tree, visitor: import('./complex-types').BuildVisitor<Tree>, reverse?: boolean) => void)
 * )}
 */

/**
 * @param {Node} tree
 * @param {Test} test
 * @param {import('./complex-types').Visitor<Node>} visitor
 * @param {boolean} [reverse]
 */
function (tree, test, visitor, reverse) {
  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor; // @ts-expect-error no visitor given, so `visitor` is test.

    visitor = test;
    test = null;
  }

  const is = convert$2(test);
  const step = reverse ? -1 : 1;
  factory(tree, null, [])();
  /**
   * @param {Node} node
   * @param {number?} index
   * @param {Array.<Parent>} parents
   */

  function factory(node, index, parents) {
    /** @type {Object.<string, unknown>} */
    // @ts-expect-error: hush
    const value = typeof node === 'object' && node !== null ? node : {};
    /** @type {string|undefined} */

    let name;

    if (typeof value.type === 'string') {
      name = typeof value.tagName === 'string' ? value.tagName : typeof value.name === 'string' ? value.name : undefined;
      Object.defineProperty(visit, 'name', {
        value: 'node (' + color$2(value.type + (name ? '<' + name + '>' : '')) + ')'
      });
    }

    return visit;

    function visit() {
      /** @type {ActionTuple} */
      let result = [];
      /** @type {ActionTuple} */

      let subresult;
      /** @type {number} */

      let offset;
      /** @type {Array.<Parent>} */

      let grandparents;

      if (!test || is(node, index, parents[parents.length - 1] || null)) {
        result = toResult$2(visitor(node, parents));

        if (result[0] === EXIT$2) {
          return result;
        }
      } // @ts-expect-error looks like a parent.


      if (node.children && result[0] !== SKIP$2) {
        // @ts-expect-error looks like a parent.
        offset = (reverse ? node.children.length : -1) + step; // @ts-expect-error looks like a parent.

        grandparents = parents.concat(node); // @ts-expect-error looks like a parent.

        while (offset > -1 && offset < node.children.length) {
          // @ts-expect-error looks like a parent.
          subresult = factory(node.children[offset], offset, grandparents)();

          if (subresult[0] === EXIT$2) {
            return subresult;
          }

          offset = typeof subresult[1] === 'number' ? subresult[1] : offset + step;
        }
      }

      return result;
    }
  }
};
/**
 * @param {VisitorResult} value
 * @returns {ActionTuple}
 */

function toResult$2(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'number') {
    return [CONTINUE$2, value];
  }

  return [value];
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 * @typedef {import('./complex-types').Visitor} Visitor
 */
/**
 * Visit children of tree which pass a test
 *
 * @param tree Abstract syntax tree to walk
 * @param test Test, optional
 * @param visitor Function to run for each node
 * @param reverse Fisit the tree in reverse, defaults to false
 */

const visit$1 =
/**
 * @type {(
 *   (<Tree extends Node, Check extends Test>(tree: Tree, test: Check, visitor: import('./complex-types').BuildVisitor<Tree, Check>, reverse?: boolean) => void) &
 *   (<Tree extends Node>(tree: Tree, visitor: import('./complex-types').BuildVisitor<Tree>, reverse?: boolean) => void)
 * )}
 */

/**
 * @param {Node} tree
 * @param {Test} test
 * @param {import('./complex-types').Visitor} visitor
 * @param {boolean} [reverse]
 */
function (tree, test, visitor, reverse) {
  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor;
    visitor = test;
    test = null;
  }

  visitParents$2(tree, test, overload, reverse);
  /**
   * @param {Node} node
   * @param {Array.<Parent>} parents
   */

  function overload(node, parents) {
    const parent = parents[parents.length - 1];
    return visitor(node, parent ? parent.children.indexOf(node) : null, parent);
  }
};

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 *
 * @typedef {import('unist-util-is').Type} Type
 * @typedef {import('unist-util-is').Props} Props
 */
/** @type {Array.<Node>} */

const empty$1 = [];
const remove =
/**
 * @type {(
 *  (<Tree extends Node>(node: Tree, options: RemoveOptions, test: Type|Props|TestFunction<import('unist-util-visit-parents/complex-types').InclusiveDescendant<Tree>>|Array<Type|Props|TestFunction<import('unist-util-visit-parents/complex-types').InclusiveDescendant<Tree>>>) => Tree|null) &
 *  (<Tree extends Node>(node: Tree, test: Type|Props|TestFunction<import('unist-util-visit-parents/complex-types').InclusiveDescendant<Tree>>|Array<Type|Props|TestFunction<import('unist-util-visit-parents/complex-types').InclusiveDescendant<Tree>>>) => Tree|null)
 * )}
 */

/**
 * Mutate the given tree by removing all nodes that pass `test`.
 * The tree is walked in preorder (NLR), visiting the node itself, then its head, etc.
 *
 * @param {Node} tree Tree to filter
 * @param {RemoveOptions} options Whether to drop parent nodes if they had children, but all their children were filtered out. Default is `{cascade: true}`
 * @param {Type|Props|TestFunction<Node>|Array<Type|Props|TestFunction<Node>>} test is-compatible test (such as a type)
 * @returns {Node|null}
 */
function (tree, options, test) {
  const is = convert$2(test || options);
  const cascade = options.cascade === undefined || options.cascade === null ? true : options.cascade;
  return preorder(tree);
  /**
   * Check and remove nodes recursively in preorder.
   * For each composite node, modify its children array in-place.
   *
   * @param {Node} node
   * @param {number|undefined} [index]
   * @param {Parent|undefined} [parent]
   * @returns {Node|null}
   */

  function preorder(node, index, parent) {
    /** @type {Array.<Node>} */
    // @ts-expect-error looks like a parent.
    const children = node.children || empty$1;
    let childIndex = -1;
    let position = 0;

    if (is(node, index, parent)) {
      return null;
    }

    if (children.length > 0) {
      // Move all living children to the beginning of the children array.
      while (++childIndex < children.length) {
        // @ts-expect-error looks like a parent.
        if (preorder(children[childIndex], childIndex, node)) {
          children[position++] = children[childIndex];
        }
      } // Cascade delete.


      if (cascade && !position) {
        return null;
      } // Drop other nodes.


      children.length = position;
    }

    return node;
  }
};

var he$1 = {exports: {}};

/*! https://mths.be/he v1.2.0 by @mathias | MIT license */

(function (module, exports) {

  (function (root) {
    // Detect free variables `exports`.
    var freeExports = exports; // Detect free variable `module`.

    var freeModule = module && module.exports == freeExports && module; // Detect free variable `global`, from Node.js or Browserified code,
    // and use it as `root`.

    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;

    if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
      root = freeGlobal;
    }
    /*--------------------------------------------------------------------------*/
    // All astral symbols.


    var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g; // All ASCII symbols (not just printable ASCII) except those listed in the
    // first column of the overrides table.
    // https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides

    var regexAsciiWhitelist = /[\x01-\x7F]/g; // All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
    // code points listed in the first column of the overrides table on
    // https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.

    var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;
    var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
    var encodeMap = {
      '\xAD': 'shy',
      '\u200C': 'zwnj',
      '\u200D': 'zwj',
      '\u200E': 'lrm',
      '\u2063': 'ic',
      '\u2062': 'it',
      '\u2061': 'af',
      '\u200F': 'rlm',
      '\u200B': 'ZeroWidthSpace',
      '\u2060': 'NoBreak',
      '\u0311': 'DownBreve',
      '\u20DB': 'tdot',
      '\u20DC': 'DotDot',
      '\t': 'Tab',
      '\n': 'NewLine',
      '\u2008': 'puncsp',
      '\u205F': 'MediumSpace',
      '\u2009': 'thinsp',
      '\u200A': 'hairsp',
      '\u2004': 'emsp13',
      '\u2002': 'ensp',
      '\u2005': 'emsp14',
      '\u2003': 'emsp',
      '\u2007': 'numsp',
      '\xA0': 'nbsp',
      '\u205F\u200A': 'ThickSpace',
      '\u203E': 'oline',
      '_': 'lowbar',
      '\u2010': 'dash',
      '\u2013': 'ndash',
      '\u2014': 'mdash',
      '\u2015': 'horbar',
      ',': 'comma',
      ';': 'semi',
      '\u204F': 'bsemi',
      ':': 'colon',
      '\u2A74': 'Colone',
      '!': 'excl',
      '\xA1': 'iexcl',
      '?': 'quest',
      '\xBF': 'iquest',
      '.': 'period',
      '\u2025': 'nldr',
      '\u2026': 'mldr',
      '\xB7': 'middot',
      '\'': 'apos',
      '\u2018': 'lsquo',
      '\u2019': 'rsquo',
      '\u201A': 'sbquo',
      '\u2039': 'lsaquo',
      '\u203A': 'rsaquo',
      '"': 'quot',
      '\u201C': 'ldquo',
      '\u201D': 'rdquo',
      '\u201E': 'bdquo',
      '\xAB': 'laquo',
      '\xBB': 'raquo',
      '(': 'lpar',
      ')': 'rpar',
      '[': 'lsqb',
      ']': 'rsqb',
      '{': 'lcub',
      '}': 'rcub',
      '\u2308': 'lceil',
      '\u2309': 'rceil',
      '\u230A': 'lfloor',
      '\u230B': 'rfloor',
      '\u2985': 'lopar',
      '\u2986': 'ropar',
      '\u298B': 'lbrke',
      '\u298C': 'rbrke',
      '\u298D': 'lbrkslu',
      '\u298E': 'rbrksld',
      '\u298F': 'lbrksld',
      '\u2990': 'rbrkslu',
      '\u2991': 'langd',
      '\u2992': 'rangd',
      '\u2993': 'lparlt',
      '\u2994': 'rpargt',
      '\u2995': 'gtlPar',
      '\u2996': 'ltrPar',
      '\u27E6': 'lobrk',
      '\u27E7': 'robrk',
      '\u27E8': 'lang',
      '\u27E9': 'rang',
      '\u27EA': 'Lang',
      '\u27EB': 'Rang',
      '\u27EC': 'loang',
      '\u27ED': 'roang',
      '\u2772': 'lbbrk',
      '\u2773': 'rbbrk',
      '\u2016': 'Vert',
      '\xA7': 'sect',
      '\xB6': 'para',
      '@': 'commat',
      '*': 'ast',
      '/': 'sol',
      'undefined': null,
      '&': 'amp',
      '#': 'num',
      '%': 'percnt',
      '\u2030': 'permil',
      '\u2031': 'pertenk',
      '\u2020': 'dagger',
      '\u2021': 'Dagger',
      '\u2022': 'bull',
      '\u2043': 'hybull',
      '\u2032': 'prime',
      '\u2033': 'Prime',
      '\u2034': 'tprime',
      '\u2057': 'qprime',
      '\u2035': 'bprime',
      '\u2041': 'caret',
      '`': 'grave',
      '\xB4': 'acute',
      '\u02DC': 'tilde',
      '^': 'Hat',
      '\xAF': 'macr',
      '\u02D8': 'breve',
      '\u02D9': 'dot',
      '\xA8': 'die',
      '\u02DA': 'ring',
      '\u02DD': 'dblac',
      '\xB8': 'cedil',
      '\u02DB': 'ogon',
      '\u02C6': 'circ',
      '\u02C7': 'caron',
      '\xB0': 'deg',
      '\xA9': 'copy',
      '\xAE': 'reg',
      '\u2117': 'copysr',
      '\u2118': 'wp',
      '\u211E': 'rx',
      '\u2127': 'mho',
      '\u2129': 'iiota',
      '\u2190': 'larr',
      '\u219A': 'nlarr',
      '\u2192': 'rarr',
      '\u219B': 'nrarr',
      '\u2191': 'uarr',
      '\u2193': 'darr',
      '\u2194': 'harr',
      '\u21AE': 'nharr',
      '\u2195': 'varr',
      '\u2196': 'nwarr',
      '\u2197': 'nearr',
      '\u2198': 'searr',
      '\u2199': 'swarr',
      '\u219D': 'rarrw',
      '\u219D\u0338': 'nrarrw',
      '\u219E': 'Larr',
      '\u219F': 'Uarr',
      '\u21A0': 'Rarr',
      '\u21A1': 'Darr',
      '\u21A2': 'larrtl',
      '\u21A3': 'rarrtl',
      '\u21A4': 'mapstoleft',
      '\u21A5': 'mapstoup',
      '\u21A6': 'map',
      '\u21A7': 'mapstodown',
      '\u21A9': 'larrhk',
      '\u21AA': 'rarrhk',
      '\u21AB': 'larrlp',
      '\u21AC': 'rarrlp',
      '\u21AD': 'harrw',
      '\u21B0': 'lsh',
      '\u21B1': 'rsh',
      '\u21B2': 'ldsh',
      '\u21B3': 'rdsh',
      '\u21B5': 'crarr',
      '\u21B6': 'cularr',
      '\u21B7': 'curarr',
      '\u21BA': 'olarr',
      '\u21BB': 'orarr',
      '\u21BC': 'lharu',
      '\u21BD': 'lhard',
      '\u21BE': 'uharr',
      '\u21BF': 'uharl',
      '\u21C0': 'rharu',
      '\u21C1': 'rhard',
      '\u21C2': 'dharr',
      '\u21C3': 'dharl',
      '\u21C4': 'rlarr',
      '\u21C5': 'udarr',
      '\u21C6': 'lrarr',
      '\u21C7': 'llarr',
      '\u21C8': 'uuarr',
      '\u21C9': 'rrarr',
      '\u21CA': 'ddarr',
      '\u21CB': 'lrhar',
      '\u21CC': 'rlhar',
      '\u21D0': 'lArr',
      '\u21CD': 'nlArr',
      '\u21D1': 'uArr',
      '\u21D2': 'rArr',
      '\u21CF': 'nrArr',
      '\u21D3': 'dArr',
      '\u21D4': 'iff',
      '\u21CE': 'nhArr',
      '\u21D5': 'vArr',
      '\u21D6': 'nwArr',
      '\u21D7': 'neArr',
      '\u21D8': 'seArr',
      '\u21D9': 'swArr',
      '\u21DA': 'lAarr',
      '\u21DB': 'rAarr',
      '\u21DD': 'zigrarr',
      '\u21E4': 'larrb',
      '\u21E5': 'rarrb',
      '\u21F5': 'duarr',
      '\u21FD': 'loarr',
      '\u21FE': 'roarr',
      '\u21FF': 'hoarr',
      '\u2200': 'forall',
      '\u2201': 'comp',
      '\u2202': 'part',
      '\u2202\u0338': 'npart',
      '\u2203': 'exist',
      '\u2204': 'nexist',
      '\u2205': 'empty',
      '\u2207': 'Del',
      '\u2208': 'in',
      '\u2209': 'notin',
      '\u220B': 'ni',
      '\u220C': 'notni',
      '\u03F6': 'bepsi',
      '\u220F': 'prod',
      '\u2210': 'coprod',
      '\u2211': 'sum',
      '+': 'plus',
      '\xB1': 'pm',
      '\xF7': 'div',
      '\xD7': 'times',
      '<': 'lt',
      '\u226E': 'nlt',
      '<\u20D2': 'nvlt',
      '=': 'equals',
      '\u2260': 'ne',
      '=\u20E5': 'bne',
      '\u2A75': 'Equal',
      '>': 'gt',
      '\u226F': 'ngt',
      '>\u20D2': 'nvgt',
      '\xAC': 'not',
      '|': 'vert',
      '\xA6': 'brvbar',
      '\u2212': 'minus',
      '\u2213': 'mp',
      '\u2214': 'plusdo',
      '\u2044': 'frasl',
      '\u2216': 'setmn',
      '\u2217': 'lowast',
      '\u2218': 'compfn',
      '\u221A': 'Sqrt',
      '\u221D': 'prop',
      '\u221E': 'infin',
      '\u221F': 'angrt',
      '\u2220': 'ang',
      '\u2220\u20D2': 'nang',
      '\u2221': 'angmsd',
      '\u2222': 'angsph',
      '\u2223': 'mid',
      '\u2224': 'nmid',
      '\u2225': 'par',
      '\u2226': 'npar',
      '\u2227': 'and',
      '\u2228': 'or',
      '\u2229': 'cap',
      '\u2229\uFE00': 'caps',
      '\u222A': 'cup',
      '\u222A\uFE00': 'cups',
      '\u222B': 'int',
      '\u222C': 'Int',
      '\u222D': 'tint',
      '\u2A0C': 'qint',
      '\u222E': 'oint',
      '\u222F': 'Conint',
      '\u2230': 'Cconint',
      '\u2231': 'cwint',
      '\u2232': 'cwconint',
      '\u2233': 'awconint',
      '\u2234': 'there4',
      '\u2235': 'becaus',
      '\u2236': 'ratio',
      '\u2237': 'Colon',
      '\u2238': 'minusd',
      '\u223A': 'mDDot',
      '\u223B': 'homtht',
      '\u223C': 'sim',
      '\u2241': 'nsim',
      '\u223C\u20D2': 'nvsim',
      '\u223D': 'bsim',
      '\u223D\u0331': 'race',
      '\u223E': 'ac',
      '\u223E\u0333': 'acE',
      '\u223F': 'acd',
      '\u2240': 'wr',
      '\u2242': 'esim',
      '\u2242\u0338': 'nesim',
      '\u2243': 'sime',
      '\u2244': 'nsime',
      '\u2245': 'cong',
      '\u2247': 'ncong',
      '\u2246': 'simne',
      '\u2248': 'ap',
      '\u2249': 'nap',
      '\u224A': 'ape',
      '\u224B': 'apid',
      '\u224B\u0338': 'napid',
      '\u224C': 'bcong',
      '\u224D': 'CupCap',
      '\u226D': 'NotCupCap',
      '\u224D\u20D2': 'nvap',
      '\u224E': 'bump',
      '\u224E\u0338': 'nbump',
      '\u224F': 'bumpe',
      '\u224F\u0338': 'nbumpe',
      '\u2250': 'doteq',
      '\u2250\u0338': 'nedot',
      '\u2251': 'eDot',
      '\u2252': 'efDot',
      '\u2253': 'erDot',
      '\u2254': 'colone',
      '\u2255': 'ecolon',
      '\u2256': 'ecir',
      '\u2257': 'cire',
      '\u2259': 'wedgeq',
      '\u225A': 'veeeq',
      '\u225C': 'trie',
      '\u225F': 'equest',
      '\u2261': 'equiv',
      '\u2262': 'nequiv',
      '\u2261\u20E5': 'bnequiv',
      '\u2264': 'le',
      '\u2270': 'nle',
      '\u2264\u20D2': 'nvle',
      '\u2265': 'ge',
      '\u2271': 'nge',
      '\u2265\u20D2': 'nvge',
      '\u2266': 'lE',
      '\u2266\u0338': 'nlE',
      '\u2267': 'gE',
      '\u2267\u0338': 'ngE',
      '\u2268\uFE00': 'lvnE',
      '\u2268': 'lnE',
      '\u2269': 'gnE',
      '\u2269\uFE00': 'gvnE',
      '\u226A': 'll',
      '\u226A\u0338': 'nLtv',
      '\u226A\u20D2': 'nLt',
      '\u226B': 'gg',
      '\u226B\u0338': 'nGtv',
      '\u226B\u20D2': 'nGt',
      '\u226C': 'twixt',
      '\u2272': 'lsim',
      '\u2274': 'nlsim',
      '\u2273': 'gsim',
      '\u2275': 'ngsim',
      '\u2276': 'lg',
      '\u2278': 'ntlg',
      '\u2277': 'gl',
      '\u2279': 'ntgl',
      '\u227A': 'pr',
      '\u2280': 'npr',
      '\u227B': 'sc',
      '\u2281': 'nsc',
      '\u227C': 'prcue',
      '\u22E0': 'nprcue',
      '\u227D': 'sccue',
      '\u22E1': 'nsccue',
      '\u227E': 'prsim',
      '\u227F': 'scsim',
      '\u227F\u0338': 'NotSucceedsTilde',
      '\u2282': 'sub',
      '\u2284': 'nsub',
      '\u2282\u20D2': 'vnsub',
      '\u2283': 'sup',
      '\u2285': 'nsup',
      '\u2283\u20D2': 'vnsup',
      '\u2286': 'sube',
      '\u2288': 'nsube',
      '\u2287': 'supe',
      '\u2289': 'nsupe',
      '\u228A\uFE00': 'vsubne',
      '\u228A': 'subne',
      '\u228B\uFE00': 'vsupne',
      '\u228B': 'supne',
      '\u228D': 'cupdot',
      '\u228E': 'uplus',
      '\u228F': 'sqsub',
      '\u228F\u0338': 'NotSquareSubset',
      '\u2290': 'sqsup',
      '\u2290\u0338': 'NotSquareSuperset',
      '\u2291': 'sqsube',
      '\u22E2': 'nsqsube',
      '\u2292': 'sqsupe',
      '\u22E3': 'nsqsupe',
      '\u2293': 'sqcap',
      '\u2293\uFE00': 'sqcaps',
      '\u2294': 'sqcup',
      '\u2294\uFE00': 'sqcups',
      '\u2295': 'oplus',
      '\u2296': 'ominus',
      '\u2297': 'otimes',
      '\u2298': 'osol',
      '\u2299': 'odot',
      '\u229A': 'ocir',
      '\u229B': 'oast',
      '\u229D': 'odash',
      '\u229E': 'plusb',
      '\u229F': 'minusb',
      '\u22A0': 'timesb',
      '\u22A1': 'sdotb',
      '\u22A2': 'vdash',
      '\u22AC': 'nvdash',
      '\u22A3': 'dashv',
      '\u22A4': 'top',
      '\u22A5': 'bot',
      '\u22A7': 'models',
      '\u22A8': 'vDash',
      '\u22AD': 'nvDash',
      '\u22A9': 'Vdash',
      '\u22AE': 'nVdash',
      '\u22AA': 'Vvdash',
      '\u22AB': 'VDash',
      '\u22AF': 'nVDash',
      '\u22B0': 'prurel',
      '\u22B2': 'vltri',
      '\u22EA': 'nltri',
      '\u22B3': 'vrtri',
      '\u22EB': 'nrtri',
      '\u22B4': 'ltrie',
      '\u22EC': 'nltrie',
      '\u22B4\u20D2': 'nvltrie',
      '\u22B5': 'rtrie',
      '\u22ED': 'nrtrie',
      '\u22B5\u20D2': 'nvrtrie',
      '\u22B6': 'origof',
      '\u22B7': 'imof',
      '\u22B8': 'mumap',
      '\u22B9': 'hercon',
      '\u22BA': 'intcal',
      '\u22BB': 'veebar',
      '\u22BD': 'barvee',
      '\u22BE': 'angrtvb',
      '\u22BF': 'lrtri',
      '\u22C0': 'Wedge',
      '\u22C1': 'Vee',
      '\u22C2': 'xcap',
      '\u22C3': 'xcup',
      '\u22C4': 'diam',
      '\u22C5': 'sdot',
      '\u22C6': 'Star',
      '\u22C7': 'divonx',
      '\u22C8': 'bowtie',
      '\u22C9': 'ltimes',
      '\u22CA': 'rtimes',
      '\u22CB': 'lthree',
      '\u22CC': 'rthree',
      '\u22CD': 'bsime',
      '\u22CE': 'cuvee',
      '\u22CF': 'cuwed',
      '\u22D0': 'Sub',
      '\u22D1': 'Sup',
      '\u22D2': 'Cap',
      '\u22D3': 'Cup',
      '\u22D4': 'fork',
      '\u22D5': 'epar',
      '\u22D6': 'ltdot',
      '\u22D7': 'gtdot',
      '\u22D8': 'Ll',
      '\u22D8\u0338': 'nLl',
      '\u22D9': 'Gg',
      '\u22D9\u0338': 'nGg',
      '\u22DA\uFE00': 'lesg',
      '\u22DA': 'leg',
      '\u22DB': 'gel',
      '\u22DB\uFE00': 'gesl',
      '\u22DE': 'cuepr',
      '\u22DF': 'cuesc',
      '\u22E6': 'lnsim',
      '\u22E7': 'gnsim',
      '\u22E8': 'prnsim',
      '\u22E9': 'scnsim',
      '\u22EE': 'vellip',
      '\u22EF': 'ctdot',
      '\u22F0': 'utdot',
      '\u22F1': 'dtdot',
      '\u22F2': 'disin',
      '\u22F3': 'isinsv',
      '\u22F4': 'isins',
      '\u22F5': 'isindot',
      '\u22F5\u0338': 'notindot',
      '\u22F6': 'notinvc',
      '\u22F7': 'notinvb',
      '\u22F9': 'isinE',
      '\u22F9\u0338': 'notinE',
      '\u22FA': 'nisd',
      '\u22FB': 'xnis',
      '\u22FC': 'nis',
      '\u22FD': 'notnivc',
      '\u22FE': 'notnivb',
      '\u2305': 'barwed',
      '\u2306': 'Barwed',
      '\u230C': 'drcrop',
      '\u230D': 'dlcrop',
      '\u230E': 'urcrop',
      '\u230F': 'ulcrop',
      '\u2310': 'bnot',
      '\u2312': 'profline',
      '\u2313': 'profsurf',
      '\u2315': 'telrec',
      '\u2316': 'target',
      '\u231C': 'ulcorn',
      '\u231D': 'urcorn',
      '\u231E': 'dlcorn',
      '\u231F': 'drcorn',
      '\u2322': 'frown',
      '\u2323': 'smile',
      '\u232D': 'cylcty',
      '\u232E': 'profalar',
      '\u2336': 'topbot',
      '\u233D': 'ovbar',
      '\u233F': 'solbar',
      '\u237C': 'angzarr',
      '\u23B0': 'lmoust',
      '\u23B1': 'rmoust',
      '\u23B4': 'tbrk',
      '\u23B5': 'bbrk',
      '\u23B6': 'bbrktbrk',
      '\u23DC': 'OverParenthesis',
      '\u23DD': 'UnderParenthesis',
      '\u23DE': 'OverBrace',
      '\u23DF': 'UnderBrace',
      '\u23E2': 'trpezium',
      '\u23E7': 'elinters',
      '\u2423': 'blank',
      '\u2500': 'boxh',
      '\u2502': 'boxv',
      '\u250C': 'boxdr',
      '\u2510': 'boxdl',
      '\u2514': 'boxur',
      '\u2518': 'boxul',
      '\u251C': 'boxvr',
      '\u2524': 'boxvl',
      '\u252C': 'boxhd',
      '\u2534': 'boxhu',
      '\u253C': 'boxvh',
      '\u2550': 'boxH',
      '\u2551': 'boxV',
      '\u2552': 'boxdR',
      '\u2553': 'boxDr',
      '\u2554': 'boxDR',
      '\u2555': 'boxdL',
      '\u2556': 'boxDl',
      '\u2557': 'boxDL',
      '\u2558': 'boxuR',
      '\u2559': 'boxUr',
      '\u255A': 'boxUR',
      '\u255B': 'boxuL',
      '\u255C': 'boxUl',
      '\u255D': 'boxUL',
      '\u255E': 'boxvR',
      '\u255F': 'boxVr',
      '\u2560': 'boxVR',
      '\u2561': 'boxvL',
      '\u2562': 'boxVl',
      '\u2563': 'boxVL',
      '\u2564': 'boxHd',
      '\u2565': 'boxhD',
      '\u2566': 'boxHD',
      '\u2567': 'boxHu',
      '\u2568': 'boxhU',
      '\u2569': 'boxHU',
      '\u256A': 'boxvH',
      '\u256B': 'boxVh',
      '\u256C': 'boxVH',
      '\u2580': 'uhblk',
      '\u2584': 'lhblk',
      '\u2588': 'block',
      '\u2591': 'blk14',
      '\u2592': 'blk12',
      '\u2593': 'blk34',
      '\u25A1': 'squ',
      '\u25AA': 'squf',
      '\u25AB': 'EmptyVerySmallSquare',
      '\u25AD': 'rect',
      '\u25AE': 'marker',
      '\u25B1': 'fltns',
      '\u25B3': 'xutri',
      '\u25B4': 'utrif',
      '\u25B5': 'utri',
      '\u25B8': 'rtrif',
      '\u25B9': 'rtri',
      '\u25BD': 'xdtri',
      '\u25BE': 'dtrif',
      '\u25BF': 'dtri',
      '\u25C2': 'ltrif',
      '\u25C3': 'ltri',
      '\u25CA': 'loz',
      '\u25CB': 'cir',
      '\u25EC': 'tridot',
      '\u25EF': 'xcirc',
      '\u25F8': 'ultri',
      '\u25F9': 'urtri',
      '\u25FA': 'lltri',
      '\u25FB': 'EmptySmallSquare',
      '\u25FC': 'FilledSmallSquare',
      '\u2605': 'starf',
      '\u2606': 'star',
      '\u260E': 'phone',
      '\u2640': 'female',
      '\u2642': 'male',
      '\u2660': 'spades',
      '\u2663': 'clubs',
      '\u2665': 'hearts',
      '\u2666': 'diams',
      '\u266A': 'sung',
      '\u2713': 'check',
      '\u2717': 'cross',
      '\u2720': 'malt',
      '\u2736': 'sext',
      '\u2758': 'VerticalSeparator',
      '\u27C8': 'bsolhsub',
      '\u27C9': 'suphsol',
      '\u27F5': 'xlarr',
      '\u27F6': 'xrarr',
      '\u27F7': 'xharr',
      '\u27F8': 'xlArr',
      '\u27F9': 'xrArr',
      '\u27FA': 'xhArr',
      '\u27FC': 'xmap',
      '\u27FF': 'dzigrarr',
      '\u2902': 'nvlArr',
      '\u2903': 'nvrArr',
      '\u2904': 'nvHarr',
      '\u2905': 'Map',
      '\u290C': 'lbarr',
      '\u290D': 'rbarr',
      '\u290E': 'lBarr',
      '\u290F': 'rBarr',
      '\u2910': 'RBarr',
      '\u2911': 'DDotrahd',
      '\u2912': 'UpArrowBar',
      '\u2913': 'DownArrowBar',
      '\u2916': 'Rarrtl',
      '\u2919': 'latail',
      '\u291A': 'ratail',
      '\u291B': 'lAtail',
      '\u291C': 'rAtail',
      '\u291D': 'larrfs',
      '\u291E': 'rarrfs',
      '\u291F': 'larrbfs',
      '\u2920': 'rarrbfs',
      '\u2923': 'nwarhk',
      '\u2924': 'nearhk',
      '\u2925': 'searhk',
      '\u2926': 'swarhk',
      '\u2927': 'nwnear',
      '\u2928': 'toea',
      '\u2929': 'tosa',
      '\u292A': 'swnwar',
      '\u2933': 'rarrc',
      '\u2933\u0338': 'nrarrc',
      '\u2935': 'cudarrr',
      '\u2936': 'ldca',
      '\u2937': 'rdca',
      '\u2938': 'cudarrl',
      '\u2939': 'larrpl',
      '\u293C': 'curarrm',
      '\u293D': 'cularrp',
      '\u2945': 'rarrpl',
      '\u2948': 'harrcir',
      '\u2949': 'Uarrocir',
      '\u294A': 'lurdshar',
      '\u294B': 'ldrushar',
      '\u294E': 'LeftRightVector',
      '\u294F': 'RightUpDownVector',
      '\u2950': 'DownLeftRightVector',
      '\u2951': 'LeftUpDownVector',
      '\u2952': 'LeftVectorBar',
      '\u2953': 'RightVectorBar',
      '\u2954': 'RightUpVectorBar',
      '\u2955': 'RightDownVectorBar',
      '\u2956': 'DownLeftVectorBar',
      '\u2957': 'DownRightVectorBar',
      '\u2958': 'LeftUpVectorBar',
      '\u2959': 'LeftDownVectorBar',
      '\u295A': 'LeftTeeVector',
      '\u295B': 'RightTeeVector',
      '\u295C': 'RightUpTeeVector',
      '\u295D': 'RightDownTeeVector',
      '\u295E': 'DownLeftTeeVector',
      '\u295F': 'DownRightTeeVector',
      '\u2960': 'LeftUpTeeVector',
      '\u2961': 'LeftDownTeeVector',
      '\u2962': 'lHar',
      '\u2963': 'uHar',
      '\u2964': 'rHar',
      '\u2965': 'dHar',
      '\u2966': 'luruhar',
      '\u2967': 'ldrdhar',
      '\u2968': 'ruluhar',
      '\u2969': 'rdldhar',
      '\u296A': 'lharul',
      '\u296B': 'llhard',
      '\u296C': 'rharul',
      '\u296D': 'lrhard',
      '\u296E': 'udhar',
      '\u296F': 'duhar',
      '\u2970': 'RoundImplies',
      '\u2971': 'erarr',
      '\u2972': 'simrarr',
      '\u2973': 'larrsim',
      '\u2974': 'rarrsim',
      '\u2975': 'rarrap',
      '\u2976': 'ltlarr',
      '\u2978': 'gtrarr',
      '\u2979': 'subrarr',
      '\u297B': 'suplarr',
      '\u297C': 'lfisht',
      '\u297D': 'rfisht',
      '\u297E': 'ufisht',
      '\u297F': 'dfisht',
      '\u299A': 'vzigzag',
      '\u299C': 'vangrt',
      '\u299D': 'angrtvbd',
      '\u29A4': 'ange',
      '\u29A5': 'range',
      '\u29A6': 'dwangle',
      '\u29A7': 'uwangle',
      '\u29A8': 'angmsdaa',
      '\u29A9': 'angmsdab',
      '\u29AA': 'angmsdac',
      '\u29AB': 'angmsdad',
      '\u29AC': 'angmsdae',
      '\u29AD': 'angmsdaf',
      '\u29AE': 'angmsdag',
      '\u29AF': 'angmsdah',
      '\u29B0': 'bemptyv',
      '\u29B1': 'demptyv',
      '\u29B2': 'cemptyv',
      '\u29B3': 'raemptyv',
      '\u29B4': 'laemptyv',
      '\u29B5': 'ohbar',
      '\u29B6': 'omid',
      '\u29B7': 'opar',
      '\u29B9': 'operp',
      '\u29BB': 'olcross',
      '\u29BC': 'odsold',
      '\u29BE': 'olcir',
      '\u29BF': 'ofcir',
      '\u29C0': 'olt',
      '\u29C1': 'ogt',
      '\u29C2': 'cirscir',
      '\u29C3': 'cirE',
      '\u29C4': 'solb',
      '\u29C5': 'bsolb',
      '\u29C9': 'boxbox',
      '\u29CD': 'trisb',
      '\u29CE': 'rtriltri',
      '\u29CF': 'LeftTriangleBar',
      '\u29CF\u0338': 'NotLeftTriangleBar',
      '\u29D0': 'RightTriangleBar',
      '\u29D0\u0338': 'NotRightTriangleBar',
      '\u29DC': 'iinfin',
      '\u29DD': 'infintie',
      '\u29DE': 'nvinfin',
      '\u29E3': 'eparsl',
      '\u29E4': 'smeparsl',
      '\u29E5': 'eqvparsl',
      '\u29EB': 'lozf',
      '\u29F4': 'RuleDelayed',
      '\u29F6': 'dsol',
      '\u2A00': 'xodot',
      '\u2A01': 'xoplus',
      '\u2A02': 'xotime',
      '\u2A04': 'xuplus',
      '\u2A06': 'xsqcup',
      '\u2A0D': 'fpartint',
      '\u2A10': 'cirfnint',
      '\u2A11': 'awint',
      '\u2A12': 'rppolint',
      '\u2A13': 'scpolint',
      '\u2A14': 'npolint',
      '\u2A15': 'pointint',
      '\u2A16': 'quatint',
      '\u2A17': 'intlarhk',
      '\u2A22': 'pluscir',
      '\u2A23': 'plusacir',
      '\u2A24': 'simplus',
      '\u2A25': 'plusdu',
      '\u2A26': 'plussim',
      '\u2A27': 'plustwo',
      '\u2A29': 'mcomma',
      '\u2A2A': 'minusdu',
      '\u2A2D': 'loplus',
      '\u2A2E': 'roplus',
      '\u2A2F': 'Cross',
      '\u2A30': 'timesd',
      '\u2A31': 'timesbar',
      '\u2A33': 'smashp',
      '\u2A34': 'lotimes',
      '\u2A35': 'rotimes',
      '\u2A36': 'otimesas',
      '\u2A37': 'Otimes',
      '\u2A38': 'odiv',
      '\u2A39': 'triplus',
      '\u2A3A': 'triminus',
      '\u2A3B': 'tritime',
      '\u2A3C': 'iprod',
      '\u2A3F': 'amalg',
      '\u2A40': 'capdot',
      '\u2A42': 'ncup',
      '\u2A43': 'ncap',
      '\u2A44': 'capand',
      '\u2A45': 'cupor',
      '\u2A46': 'cupcap',
      '\u2A47': 'capcup',
      '\u2A48': 'cupbrcap',
      '\u2A49': 'capbrcup',
      '\u2A4A': 'cupcup',
      '\u2A4B': 'capcap',
      '\u2A4C': 'ccups',
      '\u2A4D': 'ccaps',
      '\u2A50': 'ccupssm',
      '\u2A53': 'And',
      '\u2A54': 'Or',
      '\u2A55': 'andand',
      '\u2A56': 'oror',
      '\u2A57': 'orslope',
      '\u2A58': 'andslope',
      '\u2A5A': 'andv',
      '\u2A5B': 'orv',
      '\u2A5C': 'andd',
      '\u2A5D': 'ord',
      '\u2A5F': 'wedbar',
      '\u2A66': 'sdote',
      '\u2A6A': 'simdot',
      '\u2A6D': 'congdot',
      '\u2A6D\u0338': 'ncongdot',
      '\u2A6E': 'easter',
      '\u2A6F': 'apacir',
      '\u2A70': 'apE',
      '\u2A70\u0338': 'napE',
      '\u2A71': 'eplus',
      '\u2A72': 'pluse',
      '\u2A73': 'Esim',
      '\u2A77': 'eDDot',
      '\u2A78': 'equivDD',
      '\u2A79': 'ltcir',
      '\u2A7A': 'gtcir',
      '\u2A7B': 'ltquest',
      '\u2A7C': 'gtquest',
      '\u2A7D': 'les',
      '\u2A7D\u0338': 'nles',
      '\u2A7E': 'ges',
      '\u2A7E\u0338': 'nges',
      '\u2A7F': 'lesdot',
      '\u2A80': 'gesdot',
      '\u2A81': 'lesdoto',
      '\u2A82': 'gesdoto',
      '\u2A83': 'lesdotor',
      '\u2A84': 'gesdotol',
      '\u2A85': 'lap',
      '\u2A86': 'gap',
      '\u2A87': 'lne',
      '\u2A88': 'gne',
      '\u2A89': 'lnap',
      '\u2A8A': 'gnap',
      '\u2A8B': 'lEg',
      '\u2A8C': 'gEl',
      '\u2A8D': 'lsime',
      '\u2A8E': 'gsime',
      '\u2A8F': 'lsimg',
      '\u2A90': 'gsiml',
      '\u2A91': 'lgE',
      '\u2A92': 'glE',
      '\u2A93': 'lesges',
      '\u2A94': 'gesles',
      '\u2A95': 'els',
      '\u2A96': 'egs',
      '\u2A97': 'elsdot',
      '\u2A98': 'egsdot',
      '\u2A99': 'el',
      '\u2A9A': 'eg',
      '\u2A9D': 'siml',
      '\u2A9E': 'simg',
      '\u2A9F': 'simlE',
      '\u2AA0': 'simgE',
      '\u2AA1': 'LessLess',
      '\u2AA1\u0338': 'NotNestedLessLess',
      '\u2AA2': 'GreaterGreater',
      '\u2AA2\u0338': 'NotNestedGreaterGreater',
      '\u2AA4': 'glj',
      '\u2AA5': 'gla',
      '\u2AA6': 'ltcc',
      '\u2AA7': 'gtcc',
      '\u2AA8': 'lescc',
      '\u2AA9': 'gescc',
      '\u2AAA': 'smt',
      '\u2AAB': 'lat',
      '\u2AAC': 'smte',
      '\u2AAC\uFE00': 'smtes',
      '\u2AAD': 'late',
      '\u2AAD\uFE00': 'lates',
      '\u2AAE': 'bumpE',
      '\u2AAF': 'pre',
      '\u2AAF\u0338': 'npre',
      '\u2AB0': 'sce',
      '\u2AB0\u0338': 'nsce',
      '\u2AB3': 'prE',
      '\u2AB4': 'scE',
      '\u2AB5': 'prnE',
      '\u2AB6': 'scnE',
      '\u2AB7': 'prap',
      '\u2AB8': 'scap',
      '\u2AB9': 'prnap',
      '\u2ABA': 'scnap',
      '\u2ABB': 'Pr',
      '\u2ABC': 'Sc',
      '\u2ABD': 'subdot',
      '\u2ABE': 'supdot',
      '\u2ABF': 'subplus',
      '\u2AC0': 'supplus',
      '\u2AC1': 'submult',
      '\u2AC2': 'supmult',
      '\u2AC3': 'subedot',
      '\u2AC4': 'supedot',
      '\u2AC5': 'subE',
      '\u2AC5\u0338': 'nsubE',
      '\u2AC6': 'supE',
      '\u2AC6\u0338': 'nsupE',
      '\u2AC7': 'subsim',
      '\u2AC8': 'supsim',
      '\u2ACB\uFE00': 'vsubnE',
      '\u2ACB': 'subnE',
      '\u2ACC\uFE00': 'vsupnE',
      '\u2ACC': 'supnE',
      '\u2ACF': 'csub',
      '\u2AD0': 'csup',
      '\u2AD1': 'csube',
      '\u2AD2': 'csupe',
      '\u2AD3': 'subsup',
      '\u2AD4': 'supsub',
      '\u2AD5': 'subsub',
      '\u2AD6': 'supsup',
      '\u2AD7': 'suphsub',
      '\u2AD8': 'supdsub',
      '\u2AD9': 'forkv',
      '\u2ADA': 'topfork',
      '\u2ADB': 'mlcp',
      '\u2AE4': 'Dashv',
      '\u2AE6': 'Vdashl',
      '\u2AE7': 'Barv',
      '\u2AE8': 'vBar',
      '\u2AE9': 'vBarv',
      '\u2AEB': 'Vbar',
      '\u2AEC': 'Not',
      '\u2AED': 'bNot',
      '\u2AEE': 'rnmid',
      '\u2AEF': 'cirmid',
      '\u2AF0': 'midcir',
      '\u2AF1': 'topcir',
      '\u2AF2': 'nhpar',
      '\u2AF3': 'parsim',
      '\u2AFD': 'parsl',
      '\u2AFD\u20E5': 'nparsl',
      '\u266D': 'flat',
      '\u266E': 'natur',
      '\u266F': 'sharp',
      '\xA4': 'curren',
      '\xA2': 'cent',
      '$': 'dollar',
      '\xA3': 'pound',
      '\xA5': 'yen',
      '\u20AC': 'euro',
      '\xB9': 'sup1',
      '\xBD': 'half',
      '\u2153': 'frac13',
      '\xBC': 'frac14',
      '\u2155': 'frac15',
      '\u2159': 'frac16',
      '\u215B': 'frac18',
      '\xB2': 'sup2',
      '\u2154': 'frac23',
      '\u2156': 'frac25',
      '\xB3': 'sup3',
      '\xBE': 'frac34',
      '\u2157': 'frac35',
      '\u215C': 'frac38',
      '\u2158': 'frac45',
      '\u215A': 'frac56',
      '\u215D': 'frac58',
      '\u215E': 'frac78',
      '\uD835\uDCB6': 'ascr',
      '\uD835\uDD52': 'aopf',
      '\uD835\uDD1E': 'afr',
      '\uD835\uDD38': 'Aopf',
      '\uD835\uDD04': 'Afr',
      '\uD835\uDC9C': 'Ascr',
      '\xAA': 'ordf',
      '\xE1': 'aacute',
      '\xC1': 'Aacute',
      '\xE0': 'agrave',
      '\xC0': 'Agrave',
      '\u0103': 'abreve',
      '\u0102': 'Abreve',
      '\xE2': 'acirc',
      '\xC2': 'Acirc',
      '\xE5': 'aring',
      '\xC5': 'angst',
      '\xE4': 'auml',
      '\xC4': 'Auml',
      '\xE3': 'atilde',
      '\xC3': 'Atilde',
      '\u0105': 'aogon',
      '\u0104': 'Aogon',
      '\u0101': 'amacr',
      '\u0100': 'Amacr',
      '\xE6': 'aelig',
      '\xC6': 'AElig',
      '\uD835\uDCB7': 'bscr',
      '\uD835\uDD53': 'bopf',
      '\uD835\uDD1F': 'bfr',
      '\uD835\uDD39': 'Bopf',
      '\u212C': 'Bscr',
      '\uD835\uDD05': 'Bfr',
      '\uD835\uDD20': 'cfr',
      '\uD835\uDCB8': 'cscr',
      '\uD835\uDD54': 'copf',
      '\u212D': 'Cfr',
      '\uD835\uDC9E': 'Cscr',
      '\u2102': 'Copf',
      '\u0107': 'cacute',
      '\u0106': 'Cacute',
      '\u0109': 'ccirc',
      '\u0108': 'Ccirc',
      '\u010D': 'ccaron',
      '\u010C': 'Ccaron',
      '\u010B': 'cdot',
      '\u010A': 'Cdot',
      '\xE7': 'ccedil',
      '\xC7': 'Ccedil',
      '\u2105': 'incare',
      '\uD835\uDD21': 'dfr',
      '\u2146': 'dd',
      '\uD835\uDD55': 'dopf',
      '\uD835\uDCB9': 'dscr',
      '\uD835\uDC9F': 'Dscr',
      '\uD835\uDD07': 'Dfr',
      '\u2145': 'DD',
      '\uD835\uDD3B': 'Dopf',
      '\u010F': 'dcaron',
      '\u010E': 'Dcaron',
      '\u0111': 'dstrok',
      '\u0110': 'Dstrok',
      '\xF0': 'eth',
      '\xD0': 'ETH',
      '\u2147': 'ee',
      '\u212F': 'escr',
      '\uD835\uDD22': 'efr',
      '\uD835\uDD56': 'eopf',
      '\u2130': 'Escr',
      '\uD835\uDD08': 'Efr',
      '\uD835\uDD3C': 'Eopf',
      '\xE9': 'eacute',
      '\xC9': 'Eacute',
      '\xE8': 'egrave',
      '\xC8': 'Egrave',
      '\xEA': 'ecirc',
      '\xCA': 'Ecirc',
      '\u011B': 'ecaron',
      '\u011A': 'Ecaron',
      '\xEB': 'euml',
      '\xCB': 'Euml',
      '\u0117': 'edot',
      '\u0116': 'Edot',
      '\u0119': 'eogon',
      '\u0118': 'Eogon',
      '\u0113': 'emacr',
      '\u0112': 'Emacr',
      '\uD835\uDD23': 'ffr',
      '\uD835\uDD57': 'fopf',
      '\uD835\uDCBB': 'fscr',
      '\uD835\uDD09': 'Ffr',
      '\uD835\uDD3D': 'Fopf',
      '\u2131': 'Fscr',
      '\uFB00': 'fflig',
      '\uFB03': 'ffilig',
      '\uFB04': 'ffllig',
      '\uFB01': 'filig',
      'fj': 'fjlig',
      '\uFB02': 'fllig',
      '\u0192': 'fnof',
      '\u210A': 'gscr',
      '\uD835\uDD58': 'gopf',
      '\uD835\uDD24': 'gfr',
      '\uD835\uDCA2': 'Gscr',
      '\uD835\uDD3E': 'Gopf',
      '\uD835\uDD0A': 'Gfr',
      '\u01F5': 'gacute',
      '\u011F': 'gbreve',
      '\u011E': 'Gbreve',
      '\u011D': 'gcirc',
      '\u011C': 'Gcirc',
      '\u0121': 'gdot',
      '\u0120': 'Gdot',
      '\u0122': 'Gcedil',
      '\uD835\uDD25': 'hfr',
      '\u210E': 'planckh',
      '\uD835\uDCBD': 'hscr',
      '\uD835\uDD59': 'hopf',
      '\u210B': 'Hscr',
      '\u210C': 'Hfr',
      '\u210D': 'Hopf',
      '\u0125': 'hcirc',
      '\u0124': 'Hcirc',
      '\u210F': 'hbar',
      '\u0127': 'hstrok',
      '\u0126': 'Hstrok',
      '\uD835\uDD5A': 'iopf',
      '\uD835\uDD26': 'ifr',
      '\uD835\uDCBE': 'iscr',
      '\u2148': 'ii',
      '\uD835\uDD40': 'Iopf',
      '\u2110': 'Iscr',
      '\u2111': 'Im',
      '\xED': 'iacute',
      '\xCD': 'Iacute',
      '\xEC': 'igrave',
      '\xCC': 'Igrave',
      '\xEE': 'icirc',
      '\xCE': 'Icirc',
      '\xEF': 'iuml',
      '\xCF': 'Iuml',
      '\u0129': 'itilde',
      '\u0128': 'Itilde',
      '\u0130': 'Idot',
      '\u012F': 'iogon',
      '\u012E': 'Iogon',
      '\u012B': 'imacr',
      '\u012A': 'Imacr',
      '\u0133': 'ijlig',
      '\u0132': 'IJlig',
      '\u0131': 'imath',
      '\uD835\uDCBF': 'jscr',
      '\uD835\uDD5B': 'jopf',
      '\uD835\uDD27': 'jfr',
      '\uD835\uDCA5': 'Jscr',
      '\uD835\uDD0D': 'Jfr',
      '\uD835\uDD41': 'Jopf',
      '\u0135': 'jcirc',
      '\u0134': 'Jcirc',
      '\u0237': 'jmath',
      '\uD835\uDD5C': 'kopf',
      '\uD835\uDCC0': 'kscr',
      '\uD835\uDD28': 'kfr',
      '\uD835\uDCA6': 'Kscr',
      '\uD835\uDD42': 'Kopf',
      '\uD835\uDD0E': 'Kfr',
      '\u0137': 'kcedil',
      '\u0136': 'Kcedil',
      '\uD835\uDD29': 'lfr',
      '\uD835\uDCC1': 'lscr',
      '\u2113': 'ell',
      '\uD835\uDD5D': 'lopf',
      '\u2112': 'Lscr',
      '\uD835\uDD0F': 'Lfr',
      '\uD835\uDD43': 'Lopf',
      '\u013A': 'lacute',
      '\u0139': 'Lacute',
      '\u013E': 'lcaron',
      '\u013D': 'Lcaron',
      '\u013C': 'lcedil',
      '\u013B': 'Lcedil',
      '\u0142': 'lstrok',
      '\u0141': 'Lstrok',
      '\u0140': 'lmidot',
      '\u013F': 'Lmidot',
      '\uD835\uDD2A': 'mfr',
      '\uD835\uDD5E': 'mopf',
      '\uD835\uDCC2': 'mscr',
      '\uD835\uDD10': 'Mfr',
      '\uD835\uDD44': 'Mopf',
      '\u2133': 'Mscr',
      '\uD835\uDD2B': 'nfr',
      '\uD835\uDD5F': 'nopf',
      '\uD835\uDCC3': 'nscr',
      '\u2115': 'Nopf',
      '\uD835\uDCA9': 'Nscr',
      '\uD835\uDD11': 'Nfr',
      '\u0144': 'nacute',
      '\u0143': 'Nacute',
      '\u0148': 'ncaron',
      '\u0147': 'Ncaron',
      '\xF1': 'ntilde',
      '\xD1': 'Ntilde',
      '\u0146': 'ncedil',
      '\u0145': 'Ncedil',
      '\u2116': 'numero',
      '\u014B': 'eng',
      '\u014A': 'ENG',
      '\uD835\uDD60': 'oopf',
      '\uD835\uDD2C': 'ofr',
      '\u2134': 'oscr',
      '\uD835\uDCAA': 'Oscr',
      '\uD835\uDD12': 'Ofr',
      '\uD835\uDD46': 'Oopf',
      '\xBA': 'ordm',
      '\xF3': 'oacute',
      '\xD3': 'Oacute',
      '\xF2': 'ograve',
      '\xD2': 'Ograve',
      '\xF4': 'ocirc',
      '\xD4': 'Ocirc',
      '\xF6': 'ouml',
      '\xD6': 'Ouml',
      '\u0151': 'odblac',
      '\u0150': 'Odblac',
      '\xF5': 'otilde',
      '\xD5': 'Otilde',
      '\xF8': 'oslash',
      '\xD8': 'Oslash',
      '\u014D': 'omacr',
      '\u014C': 'Omacr',
      '\u0153': 'oelig',
      '\u0152': 'OElig',
      '\uD835\uDD2D': 'pfr',
      '\uD835\uDCC5': 'pscr',
      '\uD835\uDD61': 'popf',
      '\u2119': 'Popf',
      '\uD835\uDD13': 'Pfr',
      '\uD835\uDCAB': 'Pscr',
      '\uD835\uDD62': 'qopf',
      '\uD835\uDD2E': 'qfr',
      '\uD835\uDCC6': 'qscr',
      '\uD835\uDCAC': 'Qscr',
      '\uD835\uDD14': 'Qfr',
      '\u211A': 'Qopf',
      '\u0138': 'kgreen',
      '\uD835\uDD2F': 'rfr',
      '\uD835\uDD63': 'ropf',
      '\uD835\uDCC7': 'rscr',
      '\u211B': 'Rscr',
      '\u211C': 'Re',
      '\u211D': 'Ropf',
      '\u0155': 'racute',
      '\u0154': 'Racute',
      '\u0159': 'rcaron',
      '\u0158': 'Rcaron',
      '\u0157': 'rcedil',
      '\u0156': 'Rcedil',
      '\uD835\uDD64': 'sopf',
      '\uD835\uDCC8': 'sscr',
      '\uD835\uDD30': 'sfr',
      '\uD835\uDD4A': 'Sopf',
      '\uD835\uDD16': 'Sfr',
      '\uD835\uDCAE': 'Sscr',
      '\u24C8': 'oS',
      '\u015B': 'sacute',
      '\u015A': 'Sacute',
      '\u015D': 'scirc',
      '\u015C': 'Scirc',
      '\u0161': 'scaron',
      '\u0160': 'Scaron',
      '\u015F': 'scedil',
      '\u015E': 'Scedil',
      '\xDF': 'szlig',
      '\uD835\uDD31': 'tfr',
      '\uD835\uDCC9': 'tscr',
      '\uD835\uDD65': 'topf',
      '\uD835\uDCAF': 'Tscr',
      '\uD835\uDD17': 'Tfr',
      '\uD835\uDD4B': 'Topf',
      '\u0165': 'tcaron',
      '\u0164': 'Tcaron',
      '\u0163': 'tcedil',
      '\u0162': 'Tcedil',
      '\u2122': 'trade',
      '\u0167': 'tstrok',
      '\u0166': 'Tstrok',
      '\uD835\uDCCA': 'uscr',
      '\uD835\uDD66': 'uopf',
      '\uD835\uDD32': 'ufr',
      '\uD835\uDD4C': 'Uopf',
      '\uD835\uDD18': 'Ufr',
      '\uD835\uDCB0': 'Uscr',
      '\xFA': 'uacute',
      '\xDA': 'Uacute',
      '\xF9': 'ugrave',
      '\xD9': 'Ugrave',
      '\u016D': 'ubreve',
      '\u016C': 'Ubreve',
      '\xFB': 'ucirc',
      '\xDB': 'Ucirc',
      '\u016F': 'uring',
      '\u016E': 'Uring',
      '\xFC': 'uuml',
      '\xDC': 'Uuml',
      '\u0171': 'udblac',
      '\u0170': 'Udblac',
      '\u0169': 'utilde',
      '\u0168': 'Utilde',
      '\u0173': 'uogon',
      '\u0172': 'Uogon',
      '\u016B': 'umacr',
      '\u016A': 'Umacr',
      '\uD835\uDD33': 'vfr',
      '\uD835\uDD67': 'vopf',
      '\uD835\uDCCB': 'vscr',
      '\uD835\uDD19': 'Vfr',
      '\uD835\uDD4D': 'Vopf',
      '\uD835\uDCB1': 'Vscr',
      '\uD835\uDD68': 'wopf',
      '\uD835\uDCCC': 'wscr',
      '\uD835\uDD34': 'wfr',
      '\uD835\uDCB2': 'Wscr',
      '\uD835\uDD4E': 'Wopf',
      '\uD835\uDD1A': 'Wfr',
      '\u0175': 'wcirc',
      '\u0174': 'Wcirc',
      '\uD835\uDD35': 'xfr',
      '\uD835\uDCCD': 'xscr',
      '\uD835\uDD69': 'xopf',
      '\uD835\uDD4F': 'Xopf',
      '\uD835\uDD1B': 'Xfr',
      '\uD835\uDCB3': 'Xscr',
      '\uD835\uDD36': 'yfr',
      '\uD835\uDCCE': 'yscr',
      '\uD835\uDD6A': 'yopf',
      '\uD835\uDCB4': 'Yscr',
      '\uD835\uDD1C': 'Yfr',
      '\uD835\uDD50': 'Yopf',
      '\xFD': 'yacute',
      '\xDD': 'Yacute',
      '\u0177': 'ycirc',
      '\u0176': 'Ycirc',
      '\xFF': 'yuml',
      '\u0178': 'Yuml',
      '\uD835\uDCCF': 'zscr',
      '\uD835\uDD37': 'zfr',
      '\uD835\uDD6B': 'zopf',
      '\u2128': 'Zfr',
      '\u2124': 'Zopf',
      '\uD835\uDCB5': 'Zscr',
      '\u017A': 'zacute',
      '\u0179': 'Zacute',
      '\u017E': 'zcaron',
      '\u017D': 'Zcaron',
      '\u017C': 'zdot',
      '\u017B': 'Zdot',
      '\u01B5': 'imped',
      '\xFE': 'thorn',
      '\xDE': 'THORN',
      '\u0149': 'napos',
      '\u03B1': 'alpha',
      '\u0391': 'Alpha',
      '\u03B2': 'beta',
      '\u0392': 'Beta',
      '\u03B3': 'gamma',
      '\u0393': 'Gamma',
      '\u03B4': 'delta',
      '\u0394': 'Delta',
      '\u03B5': 'epsi',
      '\u03F5': 'epsiv',
      '\u0395': 'Epsilon',
      '\u03DD': 'gammad',
      '\u03DC': 'Gammad',
      '\u03B6': 'zeta',
      '\u0396': 'Zeta',
      '\u03B7': 'eta',
      '\u0397': 'Eta',
      '\u03B8': 'theta',
      '\u03D1': 'thetav',
      '\u0398': 'Theta',
      '\u03B9': 'iota',
      '\u0399': 'Iota',
      '\u03BA': 'kappa',
      '\u03F0': 'kappav',
      '\u039A': 'Kappa',
      '\u03BB': 'lambda',
      '\u039B': 'Lambda',
      '\u03BC': 'mu',
      '\xB5': 'micro',
      '\u039C': 'Mu',
      '\u03BD': 'nu',
      '\u039D': 'Nu',
      '\u03BE': 'xi',
      '\u039E': 'Xi',
      '\u03BF': 'omicron',
      '\u039F': 'Omicron',
      '\u03C0': 'pi',
      '\u03D6': 'piv',
      '\u03A0': 'Pi',
      '\u03C1': 'rho',
      '\u03F1': 'rhov',
      '\u03A1': 'Rho',
      '\u03C3': 'sigma',
      '\u03A3': 'Sigma',
      '\u03C2': 'sigmaf',
      '\u03C4': 'tau',
      '\u03A4': 'Tau',
      '\u03C5': 'upsi',
      '\u03A5': 'Upsilon',
      '\u03D2': 'Upsi',
      '\u03C6': 'phi',
      '\u03D5': 'phiv',
      '\u03A6': 'Phi',
      '\u03C7': 'chi',
      '\u03A7': 'Chi',
      '\u03C8': 'psi',
      '\u03A8': 'Psi',
      '\u03C9': 'omega',
      '\u03A9': 'ohm',
      '\u0430': 'acy',
      '\u0410': 'Acy',
      '\u0431': 'bcy',
      '\u0411': 'Bcy',
      '\u0432': 'vcy',
      '\u0412': 'Vcy',
      '\u0433': 'gcy',
      '\u0413': 'Gcy',
      '\u0453': 'gjcy',
      '\u0403': 'GJcy',
      '\u0434': 'dcy',
      '\u0414': 'Dcy',
      '\u0452': 'djcy',
      '\u0402': 'DJcy',
      '\u0435': 'iecy',
      '\u0415': 'IEcy',
      '\u0451': 'iocy',
      '\u0401': 'IOcy',
      '\u0454': 'jukcy',
      '\u0404': 'Jukcy',
      '\u0436': 'zhcy',
      '\u0416': 'ZHcy',
      '\u0437': 'zcy',
      '\u0417': 'Zcy',
      '\u0455': 'dscy',
      '\u0405': 'DScy',
      '\u0438': 'icy',
      '\u0418': 'Icy',
      '\u0456': 'iukcy',
      '\u0406': 'Iukcy',
      '\u0457': 'yicy',
      '\u0407': 'YIcy',
      '\u0439': 'jcy',
      '\u0419': 'Jcy',
      '\u0458': 'jsercy',
      '\u0408': 'Jsercy',
      '\u043A': 'kcy',
      '\u041A': 'Kcy',
      '\u045C': 'kjcy',
      '\u040C': 'KJcy',
      '\u043B': 'lcy',
      '\u041B': 'Lcy',
      '\u0459': 'ljcy',
      '\u0409': 'LJcy',
      '\u043C': 'mcy',
      '\u041C': 'Mcy',
      '\u043D': 'ncy',
      '\u041D': 'Ncy',
      '\u045A': 'njcy',
      '\u040A': 'NJcy',
      '\u043E': 'ocy',
      '\u041E': 'Ocy',
      '\u043F': 'pcy',
      '\u041F': 'Pcy',
      '\u0440': 'rcy',
      '\u0420': 'Rcy',
      '\u0441': 'scy',
      '\u0421': 'Scy',
      '\u0442': 'tcy',
      '\u0422': 'Tcy',
      '\u045B': 'tshcy',
      '\u040B': 'TSHcy',
      '\u0443': 'ucy',
      '\u0423': 'Ucy',
      '\u045E': 'ubrcy',
      '\u040E': 'Ubrcy',
      '\u0444': 'fcy',
      '\u0424': 'Fcy',
      '\u0445': 'khcy',
      '\u0425': 'KHcy',
      '\u0446': 'tscy',
      '\u0426': 'TScy',
      '\u0447': 'chcy',
      '\u0427': 'CHcy',
      '\u045F': 'dzcy',
      '\u040F': 'DZcy',
      '\u0448': 'shcy',
      '\u0428': 'SHcy',
      '\u0449': 'shchcy',
      '\u0429': 'SHCHcy',
      '\u044A': 'hardcy',
      '\u042A': 'HARDcy',
      '\u044B': 'ycy',
      '\u042B': 'Ycy',
      '\u044C': 'softcy',
      '\u042C': 'SOFTcy',
      '\u044D': 'ecy',
      '\u042D': 'Ecy',
      '\u044E': 'yucy',
      '\u042E': 'YUcy',
      '\u044F': 'yacy',
      '\u042F': 'YAcy',
      '\u2135': 'aleph',
      '\u2136': 'beth',
      '\u2137': 'gimel',
      '\u2138': 'daleth'
    };
    var regexEscape = /["&'<>`]/g;
    var escapeMap = {
      '"': '&quot;',
      '&': '&amp;',
      '\'': '&#x27;',
      '<': '&lt;',
      // See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
      // following is not strictly necessary unless it’s part of a tag or an
      // unquoted attribute value. We’re only escaping it to support those
      // situations, and for XML support.
      '>': '&gt;',
      // In Internet Explorer ≤ 8, the backtick character can be used
      // to break out of (un)quoted attribute values or HTML comments.
      // See http://html5sec.org/#102, http://html5sec.org/#108, and
      // http://html5sec.org/#133.
      '`': '&#x60;'
    };
    var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
    var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var regexDecode = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g;
    var decodeMap = {
      'aacute': '\xE1',
      'Aacute': '\xC1',
      'abreve': '\u0103',
      'Abreve': '\u0102',
      'ac': '\u223E',
      'acd': '\u223F',
      'acE': '\u223E\u0333',
      'acirc': '\xE2',
      'Acirc': '\xC2',
      'acute': '\xB4',
      'acy': '\u0430',
      'Acy': '\u0410',
      'aelig': '\xE6',
      'AElig': '\xC6',
      'af': '\u2061',
      'afr': '\uD835\uDD1E',
      'Afr': '\uD835\uDD04',
      'agrave': '\xE0',
      'Agrave': '\xC0',
      'alefsym': '\u2135',
      'aleph': '\u2135',
      'alpha': '\u03B1',
      'Alpha': '\u0391',
      'amacr': '\u0101',
      'Amacr': '\u0100',
      'amalg': '\u2A3F',
      'amp': '&',
      'AMP': '&',
      'and': '\u2227',
      'And': '\u2A53',
      'andand': '\u2A55',
      'andd': '\u2A5C',
      'andslope': '\u2A58',
      'andv': '\u2A5A',
      'ang': '\u2220',
      'ange': '\u29A4',
      'angle': '\u2220',
      'angmsd': '\u2221',
      'angmsdaa': '\u29A8',
      'angmsdab': '\u29A9',
      'angmsdac': '\u29AA',
      'angmsdad': '\u29AB',
      'angmsdae': '\u29AC',
      'angmsdaf': '\u29AD',
      'angmsdag': '\u29AE',
      'angmsdah': '\u29AF',
      'angrt': '\u221F',
      'angrtvb': '\u22BE',
      'angrtvbd': '\u299D',
      'angsph': '\u2222',
      'angst': '\xC5',
      'angzarr': '\u237C',
      'aogon': '\u0105',
      'Aogon': '\u0104',
      'aopf': '\uD835\uDD52',
      'Aopf': '\uD835\uDD38',
      'ap': '\u2248',
      'apacir': '\u2A6F',
      'ape': '\u224A',
      'apE': '\u2A70',
      'apid': '\u224B',
      'apos': '\'',
      'ApplyFunction': '\u2061',
      'approx': '\u2248',
      'approxeq': '\u224A',
      'aring': '\xE5',
      'Aring': '\xC5',
      'ascr': '\uD835\uDCB6',
      'Ascr': '\uD835\uDC9C',
      'Assign': '\u2254',
      'ast': '*',
      'asymp': '\u2248',
      'asympeq': '\u224D',
      'atilde': '\xE3',
      'Atilde': '\xC3',
      'auml': '\xE4',
      'Auml': '\xC4',
      'awconint': '\u2233',
      'awint': '\u2A11',
      'backcong': '\u224C',
      'backepsilon': '\u03F6',
      'backprime': '\u2035',
      'backsim': '\u223D',
      'backsimeq': '\u22CD',
      'Backslash': '\u2216',
      'Barv': '\u2AE7',
      'barvee': '\u22BD',
      'barwed': '\u2305',
      'Barwed': '\u2306',
      'barwedge': '\u2305',
      'bbrk': '\u23B5',
      'bbrktbrk': '\u23B6',
      'bcong': '\u224C',
      'bcy': '\u0431',
      'Bcy': '\u0411',
      'bdquo': '\u201E',
      'becaus': '\u2235',
      'because': '\u2235',
      'Because': '\u2235',
      'bemptyv': '\u29B0',
      'bepsi': '\u03F6',
      'bernou': '\u212C',
      'Bernoullis': '\u212C',
      'beta': '\u03B2',
      'Beta': '\u0392',
      'beth': '\u2136',
      'between': '\u226C',
      'bfr': '\uD835\uDD1F',
      'Bfr': '\uD835\uDD05',
      'bigcap': '\u22C2',
      'bigcirc': '\u25EF',
      'bigcup': '\u22C3',
      'bigodot': '\u2A00',
      'bigoplus': '\u2A01',
      'bigotimes': '\u2A02',
      'bigsqcup': '\u2A06',
      'bigstar': '\u2605',
      'bigtriangledown': '\u25BD',
      'bigtriangleup': '\u25B3',
      'biguplus': '\u2A04',
      'bigvee': '\u22C1',
      'bigwedge': '\u22C0',
      'bkarow': '\u290D',
      'blacklozenge': '\u29EB',
      'blacksquare': '\u25AA',
      'blacktriangle': '\u25B4',
      'blacktriangledown': '\u25BE',
      'blacktriangleleft': '\u25C2',
      'blacktriangleright': '\u25B8',
      'blank': '\u2423',
      'blk12': '\u2592',
      'blk14': '\u2591',
      'blk34': '\u2593',
      'block': '\u2588',
      'bne': '=\u20E5',
      'bnequiv': '\u2261\u20E5',
      'bnot': '\u2310',
      'bNot': '\u2AED',
      'bopf': '\uD835\uDD53',
      'Bopf': '\uD835\uDD39',
      'bot': '\u22A5',
      'bottom': '\u22A5',
      'bowtie': '\u22C8',
      'boxbox': '\u29C9',
      'boxdl': '\u2510',
      'boxdL': '\u2555',
      'boxDl': '\u2556',
      'boxDL': '\u2557',
      'boxdr': '\u250C',
      'boxdR': '\u2552',
      'boxDr': '\u2553',
      'boxDR': '\u2554',
      'boxh': '\u2500',
      'boxH': '\u2550',
      'boxhd': '\u252C',
      'boxhD': '\u2565',
      'boxHd': '\u2564',
      'boxHD': '\u2566',
      'boxhu': '\u2534',
      'boxhU': '\u2568',
      'boxHu': '\u2567',
      'boxHU': '\u2569',
      'boxminus': '\u229F',
      'boxplus': '\u229E',
      'boxtimes': '\u22A0',
      'boxul': '\u2518',
      'boxuL': '\u255B',
      'boxUl': '\u255C',
      'boxUL': '\u255D',
      'boxur': '\u2514',
      'boxuR': '\u2558',
      'boxUr': '\u2559',
      'boxUR': '\u255A',
      'boxv': '\u2502',
      'boxV': '\u2551',
      'boxvh': '\u253C',
      'boxvH': '\u256A',
      'boxVh': '\u256B',
      'boxVH': '\u256C',
      'boxvl': '\u2524',
      'boxvL': '\u2561',
      'boxVl': '\u2562',
      'boxVL': '\u2563',
      'boxvr': '\u251C',
      'boxvR': '\u255E',
      'boxVr': '\u255F',
      'boxVR': '\u2560',
      'bprime': '\u2035',
      'breve': '\u02D8',
      'Breve': '\u02D8',
      'brvbar': '\xA6',
      'bscr': '\uD835\uDCB7',
      'Bscr': '\u212C',
      'bsemi': '\u204F',
      'bsim': '\u223D',
      'bsime': '\u22CD',
      'bsol': '\\',
      'bsolb': '\u29C5',
      'bsolhsub': '\u27C8',
      'bull': '\u2022',
      'bullet': '\u2022',
      'bump': '\u224E',
      'bumpe': '\u224F',
      'bumpE': '\u2AAE',
      'bumpeq': '\u224F',
      'Bumpeq': '\u224E',
      'cacute': '\u0107',
      'Cacute': '\u0106',
      'cap': '\u2229',
      'Cap': '\u22D2',
      'capand': '\u2A44',
      'capbrcup': '\u2A49',
      'capcap': '\u2A4B',
      'capcup': '\u2A47',
      'capdot': '\u2A40',
      'CapitalDifferentialD': '\u2145',
      'caps': '\u2229\uFE00',
      'caret': '\u2041',
      'caron': '\u02C7',
      'Cayleys': '\u212D',
      'ccaps': '\u2A4D',
      'ccaron': '\u010D',
      'Ccaron': '\u010C',
      'ccedil': '\xE7',
      'Ccedil': '\xC7',
      'ccirc': '\u0109',
      'Ccirc': '\u0108',
      'Cconint': '\u2230',
      'ccups': '\u2A4C',
      'ccupssm': '\u2A50',
      'cdot': '\u010B',
      'Cdot': '\u010A',
      'cedil': '\xB8',
      'Cedilla': '\xB8',
      'cemptyv': '\u29B2',
      'cent': '\xA2',
      'centerdot': '\xB7',
      'CenterDot': '\xB7',
      'cfr': '\uD835\uDD20',
      'Cfr': '\u212D',
      'chcy': '\u0447',
      'CHcy': '\u0427',
      'check': '\u2713',
      'checkmark': '\u2713',
      'chi': '\u03C7',
      'Chi': '\u03A7',
      'cir': '\u25CB',
      'circ': '\u02C6',
      'circeq': '\u2257',
      'circlearrowleft': '\u21BA',
      'circlearrowright': '\u21BB',
      'circledast': '\u229B',
      'circledcirc': '\u229A',
      'circleddash': '\u229D',
      'CircleDot': '\u2299',
      'circledR': '\xAE',
      'circledS': '\u24C8',
      'CircleMinus': '\u2296',
      'CirclePlus': '\u2295',
      'CircleTimes': '\u2297',
      'cire': '\u2257',
      'cirE': '\u29C3',
      'cirfnint': '\u2A10',
      'cirmid': '\u2AEF',
      'cirscir': '\u29C2',
      'ClockwiseContourIntegral': '\u2232',
      'CloseCurlyDoubleQuote': '\u201D',
      'CloseCurlyQuote': '\u2019',
      'clubs': '\u2663',
      'clubsuit': '\u2663',
      'colon': ':',
      'Colon': '\u2237',
      'colone': '\u2254',
      'Colone': '\u2A74',
      'coloneq': '\u2254',
      'comma': ',',
      'commat': '@',
      'comp': '\u2201',
      'compfn': '\u2218',
      'complement': '\u2201',
      'complexes': '\u2102',
      'cong': '\u2245',
      'congdot': '\u2A6D',
      'Congruent': '\u2261',
      'conint': '\u222E',
      'Conint': '\u222F',
      'ContourIntegral': '\u222E',
      'copf': '\uD835\uDD54',
      'Copf': '\u2102',
      'coprod': '\u2210',
      'Coproduct': '\u2210',
      'copy': '\xA9',
      'COPY': '\xA9',
      'copysr': '\u2117',
      'CounterClockwiseContourIntegral': '\u2233',
      'crarr': '\u21B5',
      'cross': '\u2717',
      'Cross': '\u2A2F',
      'cscr': '\uD835\uDCB8',
      'Cscr': '\uD835\uDC9E',
      'csub': '\u2ACF',
      'csube': '\u2AD1',
      'csup': '\u2AD0',
      'csupe': '\u2AD2',
      'ctdot': '\u22EF',
      'cudarrl': '\u2938',
      'cudarrr': '\u2935',
      'cuepr': '\u22DE',
      'cuesc': '\u22DF',
      'cularr': '\u21B6',
      'cularrp': '\u293D',
      'cup': '\u222A',
      'Cup': '\u22D3',
      'cupbrcap': '\u2A48',
      'cupcap': '\u2A46',
      'CupCap': '\u224D',
      'cupcup': '\u2A4A',
      'cupdot': '\u228D',
      'cupor': '\u2A45',
      'cups': '\u222A\uFE00',
      'curarr': '\u21B7',
      'curarrm': '\u293C',
      'curlyeqprec': '\u22DE',
      'curlyeqsucc': '\u22DF',
      'curlyvee': '\u22CE',
      'curlywedge': '\u22CF',
      'curren': '\xA4',
      'curvearrowleft': '\u21B6',
      'curvearrowright': '\u21B7',
      'cuvee': '\u22CE',
      'cuwed': '\u22CF',
      'cwconint': '\u2232',
      'cwint': '\u2231',
      'cylcty': '\u232D',
      'dagger': '\u2020',
      'Dagger': '\u2021',
      'daleth': '\u2138',
      'darr': '\u2193',
      'dArr': '\u21D3',
      'Darr': '\u21A1',
      'dash': '\u2010',
      'dashv': '\u22A3',
      'Dashv': '\u2AE4',
      'dbkarow': '\u290F',
      'dblac': '\u02DD',
      'dcaron': '\u010F',
      'Dcaron': '\u010E',
      'dcy': '\u0434',
      'Dcy': '\u0414',
      'dd': '\u2146',
      'DD': '\u2145',
      'ddagger': '\u2021',
      'ddarr': '\u21CA',
      'DDotrahd': '\u2911',
      'ddotseq': '\u2A77',
      'deg': '\xB0',
      'Del': '\u2207',
      'delta': '\u03B4',
      'Delta': '\u0394',
      'demptyv': '\u29B1',
      'dfisht': '\u297F',
      'dfr': '\uD835\uDD21',
      'Dfr': '\uD835\uDD07',
      'dHar': '\u2965',
      'dharl': '\u21C3',
      'dharr': '\u21C2',
      'DiacriticalAcute': '\xB4',
      'DiacriticalDot': '\u02D9',
      'DiacriticalDoubleAcute': '\u02DD',
      'DiacriticalGrave': '`',
      'DiacriticalTilde': '\u02DC',
      'diam': '\u22C4',
      'diamond': '\u22C4',
      'Diamond': '\u22C4',
      'diamondsuit': '\u2666',
      'diams': '\u2666',
      'die': '\xA8',
      'DifferentialD': '\u2146',
      'digamma': '\u03DD',
      'disin': '\u22F2',
      'div': '\xF7',
      'divide': '\xF7',
      'divideontimes': '\u22C7',
      'divonx': '\u22C7',
      'djcy': '\u0452',
      'DJcy': '\u0402',
      'dlcorn': '\u231E',
      'dlcrop': '\u230D',
      'dollar': '$',
      'dopf': '\uD835\uDD55',
      'Dopf': '\uD835\uDD3B',
      'dot': '\u02D9',
      'Dot': '\xA8',
      'DotDot': '\u20DC',
      'doteq': '\u2250',
      'doteqdot': '\u2251',
      'DotEqual': '\u2250',
      'dotminus': '\u2238',
      'dotplus': '\u2214',
      'dotsquare': '\u22A1',
      'doublebarwedge': '\u2306',
      'DoubleContourIntegral': '\u222F',
      'DoubleDot': '\xA8',
      'DoubleDownArrow': '\u21D3',
      'DoubleLeftArrow': '\u21D0',
      'DoubleLeftRightArrow': '\u21D4',
      'DoubleLeftTee': '\u2AE4',
      'DoubleLongLeftArrow': '\u27F8',
      'DoubleLongLeftRightArrow': '\u27FA',
      'DoubleLongRightArrow': '\u27F9',
      'DoubleRightArrow': '\u21D2',
      'DoubleRightTee': '\u22A8',
      'DoubleUpArrow': '\u21D1',
      'DoubleUpDownArrow': '\u21D5',
      'DoubleVerticalBar': '\u2225',
      'downarrow': '\u2193',
      'Downarrow': '\u21D3',
      'DownArrow': '\u2193',
      'DownArrowBar': '\u2913',
      'DownArrowUpArrow': '\u21F5',
      'DownBreve': '\u0311',
      'downdownarrows': '\u21CA',
      'downharpoonleft': '\u21C3',
      'downharpoonright': '\u21C2',
      'DownLeftRightVector': '\u2950',
      'DownLeftTeeVector': '\u295E',
      'DownLeftVector': '\u21BD',
      'DownLeftVectorBar': '\u2956',
      'DownRightTeeVector': '\u295F',
      'DownRightVector': '\u21C1',
      'DownRightVectorBar': '\u2957',
      'DownTee': '\u22A4',
      'DownTeeArrow': '\u21A7',
      'drbkarow': '\u2910',
      'drcorn': '\u231F',
      'drcrop': '\u230C',
      'dscr': '\uD835\uDCB9',
      'Dscr': '\uD835\uDC9F',
      'dscy': '\u0455',
      'DScy': '\u0405',
      'dsol': '\u29F6',
      'dstrok': '\u0111',
      'Dstrok': '\u0110',
      'dtdot': '\u22F1',
      'dtri': '\u25BF',
      'dtrif': '\u25BE',
      'duarr': '\u21F5',
      'duhar': '\u296F',
      'dwangle': '\u29A6',
      'dzcy': '\u045F',
      'DZcy': '\u040F',
      'dzigrarr': '\u27FF',
      'eacute': '\xE9',
      'Eacute': '\xC9',
      'easter': '\u2A6E',
      'ecaron': '\u011B',
      'Ecaron': '\u011A',
      'ecir': '\u2256',
      'ecirc': '\xEA',
      'Ecirc': '\xCA',
      'ecolon': '\u2255',
      'ecy': '\u044D',
      'Ecy': '\u042D',
      'eDDot': '\u2A77',
      'edot': '\u0117',
      'eDot': '\u2251',
      'Edot': '\u0116',
      'ee': '\u2147',
      'efDot': '\u2252',
      'efr': '\uD835\uDD22',
      'Efr': '\uD835\uDD08',
      'eg': '\u2A9A',
      'egrave': '\xE8',
      'Egrave': '\xC8',
      'egs': '\u2A96',
      'egsdot': '\u2A98',
      'el': '\u2A99',
      'Element': '\u2208',
      'elinters': '\u23E7',
      'ell': '\u2113',
      'els': '\u2A95',
      'elsdot': '\u2A97',
      'emacr': '\u0113',
      'Emacr': '\u0112',
      'empty': '\u2205',
      'emptyset': '\u2205',
      'EmptySmallSquare': '\u25FB',
      'emptyv': '\u2205',
      'EmptyVerySmallSquare': '\u25AB',
      'emsp': '\u2003',
      'emsp13': '\u2004',
      'emsp14': '\u2005',
      'eng': '\u014B',
      'ENG': '\u014A',
      'ensp': '\u2002',
      'eogon': '\u0119',
      'Eogon': '\u0118',
      'eopf': '\uD835\uDD56',
      'Eopf': '\uD835\uDD3C',
      'epar': '\u22D5',
      'eparsl': '\u29E3',
      'eplus': '\u2A71',
      'epsi': '\u03B5',
      'epsilon': '\u03B5',
      'Epsilon': '\u0395',
      'epsiv': '\u03F5',
      'eqcirc': '\u2256',
      'eqcolon': '\u2255',
      'eqsim': '\u2242',
      'eqslantgtr': '\u2A96',
      'eqslantless': '\u2A95',
      'Equal': '\u2A75',
      'equals': '=',
      'EqualTilde': '\u2242',
      'equest': '\u225F',
      'Equilibrium': '\u21CC',
      'equiv': '\u2261',
      'equivDD': '\u2A78',
      'eqvparsl': '\u29E5',
      'erarr': '\u2971',
      'erDot': '\u2253',
      'escr': '\u212F',
      'Escr': '\u2130',
      'esdot': '\u2250',
      'esim': '\u2242',
      'Esim': '\u2A73',
      'eta': '\u03B7',
      'Eta': '\u0397',
      'eth': '\xF0',
      'ETH': '\xD0',
      'euml': '\xEB',
      'Euml': '\xCB',
      'euro': '\u20AC',
      'excl': '!',
      'exist': '\u2203',
      'Exists': '\u2203',
      'expectation': '\u2130',
      'exponentiale': '\u2147',
      'ExponentialE': '\u2147',
      'fallingdotseq': '\u2252',
      'fcy': '\u0444',
      'Fcy': '\u0424',
      'female': '\u2640',
      'ffilig': '\uFB03',
      'fflig': '\uFB00',
      'ffllig': '\uFB04',
      'ffr': '\uD835\uDD23',
      'Ffr': '\uD835\uDD09',
      'filig': '\uFB01',
      'FilledSmallSquare': '\u25FC',
      'FilledVerySmallSquare': '\u25AA',
      'fjlig': 'fj',
      'flat': '\u266D',
      'fllig': '\uFB02',
      'fltns': '\u25B1',
      'fnof': '\u0192',
      'fopf': '\uD835\uDD57',
      'Fopf': '\uD835\uDD3D',
      'forall': '\u2200',
      'ForAll': '\u2200',
      'fork': '\u22D4',
      'forkv': '\u2AD9',
      'Fouriertrf': '\u2131',
      'fpartint': '\u2A0D',
      'frac12': '\xBD',
      'frac13': '\u2153',
      'frac14': '\xBC',
      'frac15': '\u2155',
      'frac16': '\u2159',
      'frac18': '\u215B',
      'frac23': '\u2154',
      'frac25': '\u2156',
      'frac34': '\xBE',
      'frac35': '\u2157',
      'frac38': '\u215C',
      'frac45': '\u2158',
      'frac56': '\u215A',
      'frac58': '\u215D',
      'frac78': '\u215E',
      'frasl': '\u2044',
      'frown': '\u2322',
      'fscr': '\uD835\uDCBB',
      'Fscr': '\u2131',
      'gacute': '\u01F5',
      'gamma': '\u03B3',
      'Gamma': '\u0393',
      'gammad': '\u03DD',
      'Gammad': '\u03DC',
      'gap': '\u2A86',
      'gbreve': '\u011F',
      'Gbreve': '\u011E',
      'Gcedil': '\u0122',
      'gcirc': '\u011D',
      'Gcirc': '\u011C',
      'gcy': '\u0433',
      'Gcy': '\u0413',
      'gdot': '\u0121',
      'Gdot': '\u0120',
      'ge': '\u2265',
      'gE': '\u2267',
      'gel': '\u22DB',
      'gEl': '\u2A8C',
      'geq': '\u2265',
      'geqq': '\u2267',
      'geqslant': '\u2A7E',
      'ges': '\u2A7E',
      'gescc': '\u2AA9',
      'gesdot': '\u2A80',
      'gesdoto': '\u2A82',
      'gesdotol': '\u2A84',
      'gesl': '\u22DB\uFE00',
      'gesles': '\u2A94',
      'gfr': '\uD835\uDD24',
      'Gfr': '\uD835\uDD0A',
      'gg': '\u226B',
      'Gg': '\u22D9',
      'ggg': '\u22D9',
      'gimel': '\u2137',
      'gjcy': '\u0453',
      'GJcy': '\u0403',
      'gl': '\u2277',
      'gla': '\u2AA5',
      'glE': '\u2A92',
      'glj': '\u2AA4',
      'gnap': '\u2A8A',
      'gnapprox': '\u2A8A',
      'gne': '\u2A88',
      'gnE': '\u2269',
      'gneq': '\u2A88',
      'gneqq': '\u2269',
      'gnsim': '\u22E7',
      'gopf': '\uD835\uDD58',
      'Gopf': '\uD835\uDD3E',
      'grave': '`',
      'GreaterEqual': '\u2265',
      'GreaterEqualLess': '\u22DB',
      'GreaterFullEqual': '\u2267',
      'GreaterGreater': '\u2AA2',
      'GreaterLess': '\u2277',
      'GreaterSlantEqual': '\u2A7E',
      'GreaterTilde': '\u2273',
      'gscr': '\u210A',
      'Gscr': '\uD835\uDCA2',
      'gsim': '\u2273',
      'gsime': '\u2A8E',
      'gsiml': '\u2A90',
      'gt': '>',
      'Gt': '\u226B',
      'GT': '>',
      'gtcc': '\u2AA7',
      'gtcir': '\u2A7A',
      'gtdot': '\u22D7',
      'gtlPar': '\u2995',
      'gtquest': '\u2A7C',
      'gtrapprox': '\u2A86',
      'gtrarr': '\u2978',
      'gtrdot': '\u22D7',
      'gtreqless': '\u22DB',
      'gtreqqless': '\u2A8C',
      'gtrless': '\u2277',
      'gtrsim': '\u2273',
      'gvertneqq': '\u2269\uFE00',
      'gvnE': '\u2269\uFE00',
      'Hacek': '\u02C7',
      'hairsp': '\u200A',
      'half': '\xBD',
      'hamilt': '\u210B',
      'hardcy': '\u044A',
      'HARDcy': '\u042A',
      'harr': '\u2194',
      'hArr': '\u21D4',
      'harrcir': '\u2948',
      'harrw': '\u21AD',
      'Hat': '^',
      'hbar': '\u210F',
      'hcirc': '\u0125',
      'Hcirc': '\u0124',
      'hearts': '\u2665',
      'heartsuit': '\u2665',
      'hellip': '\u2026',
      'hercon': '\u22B9',
      'hfr': '\uD835\uDD25',
      'Hfr': '\u210C',
      'HilbertSpace': '\u210B',
      'hksearow': '\u2925',
      'hkswarow': '\u2926',
      'hoarr': '\u21FF',
      'homtht': '\u223B',
      'hookleftarrow': '\u21A9',
      'hookrightarrow': '\u21AA',
      'hopf': '\uD835\uDD59',
      'Hopf': '\u210D',
      'horbar': '\u2015',
      'HorizontalLine': '\u2500',
      'hscr': '\uD835\uDCBD',
      'Hscr': '\u210B',
      'hslash': '\u210F',
      'hstrok': '\u0127',
      'Hstrok': '\u0126',
      'HumpDownHump': '\u224E',
      'HumpEqual': '\u224F',
      'hybull': '\u2043',
      'hyphen': '\u2010',
      'iacute': '\xED',
      'Iacute': '\xCD',
      'ic': '\u2063',
      'icirc': '\xEE',
      'Icirc': '\xCE',
      'icy': '\u0438',
      'Icy': '\u0418',
      'Idot': '\u0130',
      'iecy': '\u0435',
      'IEcy': '\u0415',
      'iexcl': '\xA1',
      'iff': '\u21D4',
      'ifr': '\uD835\uDD26',
      'Ifr': '\u2111',
      'igrave': '\xEC',
      'Igrave': '\xCC',
      'ii': '\u2148',
      'iiiint': '\u2A0C',
      'iiint': '\u222D',
      'iinfin': '\u29DC',
      'iiota': '\u2129',
      'ijlig': '\u0133',
      'IJlig': '\u0132',
      'Im': '\u2111',
      'imacr': '\u012B',
      'Imacr': '\u012A',
      'image': '\u2111',
      'ImaginaryI': '\u2148',
      'imagline': '\u2110',
      'imagpart': '\u2111',
      'imath': '\u0131',
      'imof': '\u22B7',
      'imped': '\u01B5',
      'Implies': '\u21D2',
      'in': '\u2208',
      'incare': '\u2105',
      'infin': '\u221E',
      'infintie': '\u29DD',
      'inodot': '\u0131',
      'int': '\u222B',
      'Int': '\u222C',
      'intcal': '\u22BA',
      'integers': '\u2124',
      'Integral': '\u222B',
      'intercal': '\u22BA',
      'Intersection': '\u22C2',
      'intlarhk': '\u2A17',
      'intprod': '\u2A3C',
      'InvisibleComma': '\u2063',
      'InvisibleTimes': '\u2062',
      'iocy': '\u0451',
      'IOcy': '\u0401',
      'iogon': '\u012F',
      'Iogon': '\u012E',
      'iopf': '\uD835\uDD5A',
      'Iopf': '\uD835\uDD40',
      'iota': '\u03B9',
      'Iota': '\u0399',
      'iprod': '\u2A3C',
      'iquest': '\xBF',
      'iscr': '\uD835\uDCBE',
      'Iscr': '\u2110',
      'isin': '\u2208',
      'isindot': '\u22F5',
      'isinE': '\u22F9',
      'isins': '\u22F4',
      'isinsv': '\u22F3',
      'isinv': '\u2208',
      'it': '\u2062',
      'itilde': '\u0129',
      'Itilde': '\u0128',
      'iukcy': '\u0456',
      'Iukcy': '\u0406',
      'iuml': '\xEF',
      'Iuml': '\xCF',
      'jcirc': '\u0135',
      'Jcirc': '\u0134',
      'jcy': '\u0439',
      'Jcy': '\u0419',
      'jfr': '\uD835\uDD27',
      'Jfr': '\uD835\uDD0D',
      'jmath': '\u0237',
      'jopf': '\uD835\uDD5B',
      'Jopf': '\uD835\uDD41',
      'jscr': '\uD835\uDCBF',
      'Jscr': '\uD835\uDCA5',
      'jsercy': '\u0458',
      'Jsercy': '\u0408',
      'jukcy': '\u0454',
      'Jukcy': '\u0404',
      'kappa': '\u03BA',
      'Kappa': '\u039A',
      'kappav': '\u03F0',
      'kcedil': '\u0137',
      'Kcedil': '\u0136',
      'kcy': '\u043A',
      'Kcy': '\u041A',
      'kfr': '\uD835\uDD28',
      'Kfr': '\uD835\uDD0E',
      'kgreen': '\u0138',
      'khcy': '\u0445',
      'KHcy': '\u0425',
      'kjcy': '\u045C',
      'KJcy': '\u040C',
      'kopf': '\uD835\uDD5C',
      'Kopf': '\uD835\uDD42',
      'kscr': '\uD835\uDCC0',
      'Kscr': '\uD835\uDCA6',
      'lAarr': '\u21DA',
      'lacute': '\u013A',
      'Lacute': '\u0139',
      'laemptyv': '\u29B4',
      'lagran': '\u2112',
      'lambda': '\u03BB',
      'Lambda': '\u039B',
      'lang': '\u27E8',
      'Lang': '\u27EA',
      'langd': '\u2991',
      'langle': '\u27E8',
      'lap': '\u2A85',
      'Laplacetrf': '\u2112',
      'laquo': '\xAB',
      'larr': '\u2190',
      'lArr': '\u21D0',
      'Larr': '\u219E',
      'larrb': '\u21E4',
      'larrbfs': '\u291F',
      'larrfs': '\u291D',
      'larrhk': '\u21A9',
      'larrlp': '\u21AB',
      'larrpl': '\u2939',
      'larrsim': '\u2973',
      'larrtl': '\u21A2',
      'lat': '\u2AAB',
      'latail': '\u2919',
      'lAtail': '\u291B',
      'late': '\u2AAD',
      'lates': '\u2AAD\uFE00',
      'lbarr': '\u290C',
      'lBarr': '\u290E',
      'lbbrk': '\u2772',
      'lbrace': '{',
      'lbrack': '[',
      'lbrke': '\u298B',
      'lbrksld': '\u298F',
      'lbrkslu': '\u298D',
      'lcaron': '\u013E',
      'Lcaron': '\u013D',
      'lcedil': '\u013C',
      'Lcedil': '\u013B',
      'lceil': '\u2308',
      'lcub': '{',
      'lcy': '\u043B',
      'Lcy': '\u041B',
      'ldca': '\u2936',
      'ldquo': '\u201C',
      'ldquor': '\u201E',
      'ldrdhar': '\u2967',
      'ldrushar': '\u294B',
      'ldsh': '\u21B2',
      'le': '\u2264',
      'lE': '\u2266',
      'LeftAngleBracket': '\u27E8',
      'leftarrow': '\u2190',
      'Leftarrow': '\u21D0',
      'LeftArrow': '\u2190',
      'LeftArrowBar': '\u21E4',
      'LeftArrowRightArrow': '\u21C6',
      'leftarrowtail': '\u21A2',
      'LeftCeiling': '\u2308',
      'LeftDoubleBracket': '\u27E6',
      'LeftDownTeeVector': '\u2961',
      'LeftDownVector': '\u21C3',
      'LeftDownVectorBar': '\u2959',
      'LeftFloor': '\u230A',
      'leftharpoondown': '\u21BD',
      'leftharpoonup': '\u21BC',
      'leftleftarrows': '\u21C7',
      'leftrightarrow': '\u2194',
      'Leftrightarrow': '\u21D4',
      'LeftRightArrow': '\u2194',
      'leftrightarrows': '\u21C6',
      'leftrightharpoons': '\u21CB',
      'leftrightsquigarrow': '\u21AD',
      'LeftRightVector': '\u294E',
      'LeftTee': '\u22A3',
      'LeftTeeArrow': '\u21A4',
      'LeftTeeVector': '\u295A',
      'leftthreetimes': '\u22CB',
      'LeftTriangle': '\u22B2',
      'LeftTriangleBar': '\u29CF',
      'LeftTriangleEqual': '\u22B4',
      'LeftUpDownVector': '\u2951',
      'LeftUpTeeVector': '\u2960',
      'LeftUpVector': '\u21BF',
      'LeftUpVectorBar': '\u2958',
      'LeftVector': '\u21BC',
      'LeftVectorBar': '\u2952',
      'leg': '\u22DA',
      'lEg': '\u2A8B',
      'leq': '\u2264',
      'leqq': '\u2266',
      'leqslant': '\u2A7D',
      'les': '\u2A7D',
      'lescc': '\u2AA8',
      'lesdot': '\u2A7F',
      'lesdoto': '\u2A81',
      'lesdotor': '\u2A83',
      'lesg': '\u22DA\uFE00',
      'lesges': '\u2A93',
      'lessapprox': '\u2A85',
      'lessdot': '\u22D6',
      'lesseqgtr': '\u22DA',
      'lesseqqgtr': '\u2A8B',
      'LessEqualGreater': '\u22DA',
      'LessFullEqual': '\u2266',
      'LessGreater': '\u2276',
      'lessgtr': '\u2276',
      'LessLess': '\u2AA1',
      'lesssim': '\u2272',
      'LessSlantEqual': '\u2A7D',
      'LessTilde': '\u2272',
      'lfisht': '\u297C',
      'lfloor': '\u230A',
      'lfr': '\uD835\uDD29',
      'Lfr': '\uD835\uDD0F',
      'lg': '\u2276',
      'lgE': '\u2A91',
      'lHar': '\u2962',
      'lhard': '\u21BD',
      'lharu': '\u21BC',
      'lharul': '\u296A',
      'lhblk': '\u2584',
      'ljcy': '\u0459',
      'LJcy': '\u0409',
      'll': '\u226A',
      'Ll': '\u22D8',
      'llarr': '\u21C7',
      'llcorner': '\u231E',
      'Lleftarrow': '\u21DA',
      'llhard': '\u296B',
      'lltri': '\u25FA',
      'lmidot': '\u0140',
      'Lmidot': '\u013F',
      'lmoust': '\u23B0',
      'lmoustache': '\u23B0',
      'lnap': '\u2A89',
      'lnapprox': '\u2A89',
      'lne': '\u2A87',
      'lnE': '\u2268',
      'lneq': '\u2A87',
      'lneqq': '\u2268',
      'lnsim': '\u22E6',
      'loang': '\u27EC',
      'loarr': '\u21FD',
      'lobrk': '\u27E6',
      'longleftarrow': '\u27F5',
      'Longleftarrow': '\u27F8',
      'LongLeftArrow': '\u27F5',
      'longleftrightarrow': '\u27F7',
      'Longleftrightarrow': '\u27FA',
      'LongLeftRightArrow': '\u27F7',
      'longmapsto': '\u27FC',
      'longrightarrow': '\u27F6',
      'Longrightarrow': '\u27F9',
      'LongRightArrow': '\u27F6',
      'looparrowleft': '\u21AB',
      'looparrowright': '\u21AC',
      'lopar': '\u2985',
      'lopf': '\uD835\uDD5D',
      'Lopf': '\uD835\uDD43',
      'loplus': '\u2A2D',
      'lotimes': '\u2A34',
      'lowast': '\u2217',
      'lowbar': '_',
      'LowerLeftArrow': '\u2199',
      'LowerRightArrow': '\u2198',
      'loz': '\u25CA',
      'lozenge': '\u25CA',
      'lozf': '\u29EB',
      'lpar': '(',
      'lparlt': '\u2993',
      'lrarr': '\u21C6',
      'lrcorner': '\u231F',
      'lrhar': '\u21CB',
      'lrhard': '\u296D',
      'lrm': '\u200E',
      'lrtri': '\u22BF',
      'lsaquo': '\u2039',
      'lscr': '\uD835\uDCC1',
      'Lscr': '\u2112',
      'lsh': '\u21B0',
      'Lsh': '\u21B0',
      'lsim': '\u2272',
      'lsime': '\u2A8D',
      'lsimg': '\u2A8F',
      'lsqb': '[',
      'lsquo': '\u2018',
      'lsquor': '\u201A',
      'lstrok': '\u0142',
      'Lstrok': '\u0141',
      'lt': '<',
      'Lt': '\u226A',
      'LT': '<',
      'ltcc': '\u2AA6',
      'ltcir': '\u2A79',
      'ltdot': '\u22D6',
      'lthree': '\u22CB',
      'ltimes': '\u22C9',
      'ltlarr': '\u2976',
      'ltquest': '\u2A7B',
      'ltri': '\u25C3',
      'ltrie': '\u22B4',
      'ltrif': '\u25C2',
      'ltrPar': '\u2996',
      'lurdshar': '\u294A',
      'luruhar': '\u2966',
      'lvertneqq': '\u2268\uFE00',
      'lvnE': '\u2268\uFE00',
      'macr': '\xAF',
      'male': '\u2642',
      'malt': '\u2720',
      'maltese': '\u2720',
      'map': '\u21A6',
      'Map': '\u2905',
      'mapsto': '\u21A6',
      'mapstodown': '\u21A7',
      'mapstoleft': '\u21A4',
      'mapstoup': '\u21A5',
      'marker': '\u25AE',
      'mcomma': '\u2A29',
      'mcy': '\u043C',
      'Mcy': '\u041C',
      'mdash': '\u2014',
      'mDDot': '\u223A',
      'measuredangle': '\u2221',
      'MediumSpace': '\u205F',
      'Mellintrf': '\u2133',
      'mfr': '\uD835\uDD2A',
      'Mfr': '\uD835\uDD10',
      'mho': '\u2127',
      'micro': '\xB5',
      'mid': '\u2223',
      'midast': '*',
      'midcir': '\u2AF0',
      'middot': '\xB7',
      'minus': '\u2212',
      'minusb': '\u229F',
      'minusd': '\u2238',
      'minusdu': '\u2A2A',
      'MinusPlus': '\u2213',
      'mlcp': '\u2ADB',
      'mldr': '\u2026',
      'mnplus': '\u2213',
      'models': '\u22A7',
      'mopf': '\uD835\uDD5E',
      'Mopf': '\uD835\uDD44',
      'mp': '\u2213',
      'mscr': '\uD835\uDCC2',
      'Mscr': '\u2133',
      'mstpos': '\u223E',
      'mu': '\u03BC',
      'Mu': '\u039C',
      'multimap': '\u22B8',
      'mumap': '\u22B8',
      'nabla': '\u2207',
      'nacute': '\u0144',
      'Nacute': '\u0143',
      'nang': '\u2220\u20D2',
      'nap': '\u2249',
      'napE': '\u2A70\u0338',
      'napid': '\u224B\u0338',
      'napos': '\u0149',
      'napprox': '\u2249',
      'natur': '\u266E',
      'natural': '\u266E',
      'naturals': '\u2115',
      'nbsp': '\xA0',
      'nbump': '\u224E\u0338',
      'nbumpe': '\u224F\u0338',
      'ncap': '\u2A43',
      'ncaron': '\u0148',
      'Ncaron': '\u0147',
      'ncedil': '\u0146',
      'Ncedil': '\u0145',
      'ncong': '\u2247',
      'ncongdot': '\u2A6D\u0338',
      'ncup': '\u2A42',
      'ncy': '\u043D',
      'Ncy': '\u041D',
      'ndash': '\u2013',
      'ne': '\u2260',
      'nearhk': '\u2924',
      'nearr': '\u2197',
      'neArr': '\u21D7',
      'nearrow': '\u2197',
      'nedot': '\u2250\u0338',
      'NegativeMediumSpace': '\u200B',
      'NegativeThickSpace': '\u200B',
      'NegativeThinSpace': '\u200B',
      'NegativeVeryThinSpace': '\u200B',
      'nequiv': '\u2262',
      'nesear': '\u2928',
      'nesim': '\u2242\u0338',
      'NestedGreaterGreater': '\u226B',
      'NestedLessLess': '\u226A',
      'NewLine': '\n',
      'nexist': '\u2204',
      'nexists': '\u2204',
      'nfr': '\uD835\uDD2B',
      'Nfr': '\uD835\uDD11',
      'nge': '\u2271',
      'ngE': '\u2267\u0338',
      'ngeq': '\u2271',
      'ngeqq': '\u2267\u0338',
      'ngeqslant': '\u2A7E\u0338',
      'nges': '\u2A7E\u0338',
      'nGg': '\u22D9\u0338',
      'ngsim': '\u2275',
      'ngt': '\u226F',
      'nGt': '\u226B\u20D2',
      'ngtr': '\u226F',
      'nGtv': '\u226B\u0338',
      'nharr': '\u21AE',
      'nhArr': '\u21CE',
      'nhpar': '\u2AF2',
      'ni': '\u220B',
      'nis': '\u22FC',
      'nisd': '\u22FA',
      'niv': '\u220B',
      'njcy': '\u045A',
      'NJcy': '\u040A',
      'nlarr': '\u219A',
      'nlArr': '\u21CD',
      'nldr': '\u2025',
      'nle': '\u2270',
      'nlE': '\u2266\u0338',
      'nleftarrow': '\u219A',
      'nLeftarrow': '\u21CD',
      'nleftrightarrow': '\u21AE',
      'nLeftrightarrow': '\u21CE',
      'nleq': '\u2270',
      'nleqq': '\u2266\u0338',
      'nleqslant': '\u2A7D\u0338',
      'nles': '\u2A7D\u0338',
      'nless': '\u226E',
      'nLl': '\u22D8\u0338',
      'nlsim': '\u2274',
      'nlt': '\u226E',
      'nLt': '\u226A\u20D2',
      'nltri': '\u22EA',
      'nltrie': '\u22EC',
      'nLtv': '\u226A\u0338',
      'nmid': '\u2224',
      'NoBreak': '\u2060',
      'NonBreakingSpace': '\xA0',
      'nopf': '\uD835\uDD5F',
      'Nopf': '\u2115',
      'not': '\xAC',
      'Not': '\u2AEC',
      'NotCongruent': '\u2262',
      'NotCupCap': '\u226D',
      'NotDoubleVerticalBar': '\u2226',
      'NotElement': '\u2209',
      'NotEqual': '\u2260',
      'NotEqualTilde': '\u2242\u0338',
      'NotExists': '\u2204',
      'NotGreater': '\u226F',
      'NotGreaterEqual': '\u2271',
      'NotGreaterFullEqual': '\u2267\u0338',
      'NotGreaterGreater': '\u226B\u0338',
      'NotGreaterLess': '\u2279',
      'NotGreaterSlantEqual': '\u2A7E\u0338',
      'NotGreaterTilde': '\u2275',
      'NotHumpDownHump': '\u224E\u0338',
      'NotHumpEqual': '\u224F\u0338',
      'notin': '\u2209',
      'notindot': '\u22F5\u0338',
      'notinE': '\u22F9\u0338',
      'notinva': '\u2209',
      'notinvb': '\u22F7',
      'notinvc': '\u22F6',
      'NotLeftTriangle': '\u22EA',
      'NotLeftTriangleBar': '\u29CF\u0338',
      'NotLeftTriangleEqual': '\u22EC',
      'NotLess': '\u226E',
      'NotLessEqual': '\u2270',
      'NotLessGreater': '\u2278',
      'NotLessLess': '\u226A\u0338',
      'NotLessSlantEqual': '\u2A7D\u0338',
      'NotLessTilde': '\u2274',
      'NotNestedGreaterGreater': '\u2AA2\u0338',
      'NotNestedLessLess': '\u2AA1\u0338',
      'notni': '\u220C',
      'notniva': '\u220C',
      'notnivb': '\u22FE',
      'notnivc': '\u22FD',
      'NotPrecedes': '\u2280',
      'NotPrecedesEqual': '\u2AAF\u0338',
      'NotPrecedesSlantEqual': '\u22E0',
      'NotReverseElement': '\u220C',
      'NotRightTriangle': '\u22EB',
      'NotRightTriangleBar': '\u29D0\u0338',
      'NotRightTriangleEqual': '\u22ED',
      'NotSquareSubset': '\u228F\u0338',
      'NotSquareSubsetEqual': '\u22E2',
      'NotSquareSuperset': '\u2290\u0338',
      'NotSquareSupersetEqual': '\u22E3',
      'NotSubset': '\u2282\u20D2',
      'NotSubsetEqual': '\u2288',
      'NotSucceeds': '\u2281',
      'NotSucceedsEqual': '\u2AB0\u0338',
      'NotSucceedsSlantEqual': '\u22E1',
      'NotSucceedsTilde': '\u227F\u0338',
      'NotSuperset': '\u2283\u20D2',
      'NotSupersetEqual': '\u2289',
      'NotTilde': '\u2241',
      'NotTildeEqual': '\u2244',
      'NotTildeFullEqual': '\u2247',
      'NotTildeTilde': '\u2249',
      'NotVerticalBar': '\u2224',
      'npar': '\u2226',
      'nparallel': '\u2226',
      'nparsl': '\u2AFD\u20E5',
      'npart': '\u2202\u0338',
      'npolint': '\u2A14',
      'npr': '\u2280',
      'nprcue': '\u22E0',
      'npre': '\u2AAF\u0338',
      'nprec': '\u2280',
      'npreceq': '\u2AAF\u0338',
      'nrarr': '\u219B',
      'nrArr': '\u21CF',
      'nrarrc': '\u2933\u0338',
      'nrarrw': '\u219D\u0338',
      'nrightarrow': '\u219B',
      'nRightarrow': '\u21CF',
      'nrtri': '\u22EB',
      'nrtrie': '\u22ED',
      'nsc': '\u2281',
      'nsccue': '\u22E1',
      'nsce': '\u2AB0\u0338',
      'nscr': '\uD835\uDCC3',
      'Nscr': '\uD835\uDCA9',
      'nshortmid': '\u2224',
      'nshortparallel': '\u2226',
      'nsim': '\u2241',
      'nsime': '\u2244',
      'nsimeq': '\u2244',
      'nsmid': '\u2224',
      'nspar': '\u2226',
      'nsqsube': '\u22E2',
      'nsqsupe': '\u22E3',
      'nsub': '\u2284',
      'nsube': '\u2288',
      'nsubE': '\u2AC5\u0338',
      'nsubset': '\u2282\u20D2',
      'nsubseteq': '\u2288',
      'nsubseteqq': '\u2AC5\u0338',
      'nsucc': '\u2281',
      'nsucceq': '\u2AB0\u0338',
      'nsup': '\u2285',
      'nsupe': '\u2289',
      'nsupE': '\u2AC6\u0338',
      'nsupset': '\u2283\u20D2',
      'nsupseteq': '\u2289',
      'nsupseteqq': '\u2AC6\u0338',
      'ntgl': '\u2279',
      'ntilde': '\xF1',
      'Ntilde': '\xD1',
      'ntlg': '\u2278',
      'ntriangleleft': '\u22EA',
      'ntrianglelefteq': '\u22EC',
      'ntriangleright': '\u22EB',
      'ntrianglerighteq': '\u22ED',
      'nu': '\u03BD',
      'Nu': '\u039D',
      'num': '#',
      'numero': '\u2116',
      'numsp': '\u2007',
      'nvap': '\u224D\u20D2',
      'nvdash': '\u22AC',
      'nvDash': '\u22AD',
      'nVdash': '\u22AE',
      'nVDash': '\u22AF',
      'nvge': '\u2265\u20D2',
      'nvgt': '>\u20D2',
      'nvHarr': '\u2904',
      'nvinfin': '\u29DE',
      'nvlArr': '\u2902',
      'nvle': '\u2264\u20D2',
      'nvlt': '<\u20D2',
      'nvltrie': '\u22B4\u20D2',
      'nvrArr': '\u2903',
      'nvrtrie': '\u22B5\u20D2',
      'nvsim': '\u223C\u20D2',
      'nwarhk': '\u2923',
      'nwarr': '\u2196',
      'nwArr': '\u21D6',
      'nwarrow': '\u2196',
      'nwnear': '\u2927',
      'oacute': '\xF3',
      'Oacute': '\xD3',
      'oast': '\u229B',
      'ocir': '\u229A',
      'ocirc': '\xF4',
      'Ocirc': '\xD4',
      'ocy': '\u043E',
      'Ocy': '\u041E',
      'odash': '\u229D',
      'odblac': '\u0151',
      'Odblac': '\u0150',
      'odiv': '\u2A38',
      'odot': '\u2299',
      'odsold': '\u29BC',
      'oelig': '\u0153',
      'OElig': '\u0152',
      'ofcir': '\u29BF',
      'ofr': '\uD835\uDD2C',
      'Ofr': '\uD835\uDD12',
      'ogon': '\u02DB',
      'ograve': '\xF2',
      'Ograve': '\xD2',
      'ogt': '\u29C1',
      'ohbar': '\u29B5',
      'ohm': '\u03A9',
      'oint': '\u222E',
      'olarr': '\u21BA',
      'olcir': '\u29BE',
      'olcross': '\u29BB',
      'oline': '\u203E',
      'olt': '\u29C0',
      'omacr': '\u014D',
      'Omacr': '\u014C',
      'omega': '\u03C9',
      'Omega': '\u03A9',
      'omicron': '\u03BF',
      'Omicron': '\u039F',
      'omid': '\u29B6',
      'ominus': '\u2296',
      'oopf': '\uD835\uDD60',
      'Oopf': '\uD835\uDD46',
      'opar': '\u29B7',
      'OpenCurlyDoubleQuote': '\u201C',
      'OpenCurlyQuote': '\u2018',
      'operp': '\u29B9',
      'oplus': '\u2295',
      'or': '\u2228',
      'Or': '\u2A54',
      'orarr': '\u21BB',
      'ord': '\u2A5D',
      'order': '\u2134',
      'orderof': '\u2134',
      'ordf': '\xAA',
      'ordm': '\xBA',
      'origof': '\u22B6',
      'oror': '\u2A56',
      'orslope': '\u2A57',
      'orv': '\u2A5B',
      'oS': '\u24C8',
      'oscr': '\u2134',
      'Oscr': '\uD835\uDCAA',
      'oslash': '\xF8',
      'Oslash': '\xD8',
      'osol': '\u2298',
      'otilde': '\xF5',
      'Otilde': '\xD5',
      'otimes': '\u2297',
      'Otimes': '\u2A37',
      'otimesas': '\u2A36',
      'ouml': '\xF6',
      'Ouml': '\xD6',
      'ovbar': '\u233D',
      'OverBar': '\u203E',
      'OverBrace': '\u23DE',
      'OverBracket': '\u23B4',
      'OverParenthesis': '\u23DC',
      'par': '\u2225',
      'para': '\xB6',
      'parallel': '\u2225',
      'parsim': '\u2AF3',
      'parsl': '\u2AFD',
      'part': '\u2202',
      'PartialD': '\u2202',
      'pcy': '\u043F',
      'Pcy': '\u041F',
      'percnt': '%',
      'period': '.',
      'permil': '\u2030',
      'perp': '\u22A5',
      'pertenk': '\u2031',
      'pfr': '\uD835\uDD2D',
      'Pfr': '\uD835\uDD13',
      'phi': '\u03C6',
      'Phi': '\u03A6',
      'phiv': '\u03D5',
      'phmmat': '\u2133',
      'phone': '\u260E',
      'pi': '\u03C0',
      'Pi': '\u03A0',
      'pitchfork': '\u22D4',
      'piv': '\u03D6',
      'planck': '\u210F',
      'planckh': '\u210E',
      'plankv': '\u210F',
      'plus': '+',
      'plusacir': '\u2A23',
      'plusb': '\u229E',
      'pluscir': '\u2A22',
      'plusdo': '\u2214',
      'plusdu': '\u2A25',
      'pluse': '\u2A72',
      'PlusMinus': '\xB1',
      'plusmn': '\xB1',
      'plussim': '\u2A26',
      'plustwo': '\u2A27',
      'pm': '\xB1',
      'Poincareplane': '\u210C',
      'pointint': '\u2A15',
      'popf': '\uD835\uDD61',
      'Popf': '\u2119',
      'pound': '\xA3',
      'pr': '\u227A',
      'Pr': '\u2ABB',
      'prap': '\u2AB7',
      'prcue': '\u227C',
      'pre': '\u2AAF',
      'prE': '\u2AB3',
      'prec': '\u227A',
      'precapprox': '\u2AB7',
      'preccurlyeq': '\u227C',
      'Precedes': '\u227A',
      'PrecedesEqual': '\u2AAF',
      'PrecedesSlantEqual': '\u227C',
      'PrecedesTilde': '\u227E',
      'preceq': '\u2AAF',
      'precnapprox': '\u2AB9',
      'precneqq': '\u2AB5',
      'precnsim': '\u22E8',
      'precsim': '\u227E',
      'prime': '\u2032',
      'Prime': '\u2033',
      'primes': '\u2119',
      'prnap': '\u2AB9',
      'prnE': '\u2AB5',
      'prnsim': '\u22E8',
      'prod': '\u220F',
      'Product': '\u220F',
      'profalar': '\u232E',
      'profline': '\u2312',
      'profsurf': '\u2313',
      'prop': '\u221D',
      'Proportion': '\u2237',
      'Proportional': '\u221D',
      'propto': '\u221D',
      'prsim': '\u227E',
      'prurel': '\u22B0',
      'pscr': '\uD835\uDCC5',
      'Pscr': '\uD835\uDCAB',
      'psi': '\u03C8',
      'Psi': '\u03A8',
      'puncsp': '\u2008',
      'qfr': '\uD835\uDD2E',
      'Qfr': '\uD835\uDD14',
      'qint': '\u2A0C',
      'qopf': '\uD835\uDD62',
      'Qopf': '\u211A',
      'qprime': '\u2057',
      'qscr': '\uD835\uDCC6',
      'Qscr': '\uD835\uDCAC',
      'quaternions': '\u210D',
      'quatint': '\u2A16',
      'quest': '?',
      'questeq': '\u225F',
      'quot': '"',
      'QUOT': '"',
      'rAarr': '\u21DB',
      'race': '\u223D\u0331',
      'racute': '\u0155',
      'Racute': '\u0154',
      'radic': '\u221A',
      'raemptyv': '\u29B3',
      'rang': '\u27E9',
      'Rang': '\u27EB',
      'rangd': '\u2992',
      'range': '\u29A5',
      'rangle': '\u27E9',
      'raquo': '\xBB',
      'rarr': '\u2192',
      'rArr': '\u21D2',
      'Rarr': '\u21A0',
      'rarrap': '\u2975',
      'rarrb': '\u21E5',
      'rarrbfs': '\u2920',
      'rarrc': '\u2933',
      'rarrfs': '\u291E',
      'rarrhk': '\u21AA',
      'rarrlp': '\u21AC',
      'rarrpl': '\u2945',
      'rarrsim': '\u2974',
      'rarrtl': '\u21A3',
      'Rarrtl': '\u2916',
      'rarrw': '\u219D',
      'ratail': '\u291A',
      'rAtail': '\u291C',
      'ratio': '\u2236',
      'rationals': '\u211A',
      'rbarr': '\u290D',
      'rBarr': '\u290F',
      'RBarr': '\u2910',
      'rbbrk': '\u2773',
      'rbrace': '}',
      'rbrack': ']',
      'rbrke': '\u298C',
      'rbrksld': '\u298E',
      'rbrkslu': '\u2990',
      'rcaron': '\u0159',
      'Rcaron': '\u0158',
      'rcedil': '\u0157',
      'Rcedil': '\u0156',
      'rceil': '\u2309',
      'rcub': '}',
      'rcy': '\u0440',
      'Rcy': '\u0420',
      'rdca': '\u2937',
      'rdldhar': '\u2969',
      'rdquo': '\u201D',
      'rdquor': '\u201D',
      'rdsh': '\u21B3',
      'Re': '\u211C',
      'real': '\u211C',
      'realine': '\u211B',
      'realpart': '\u211C',
      'reals': '\u211D',
      'rect': '\u25AD',
      'reg': '\xAE',
      'REG': '\xAE',
      'ReverseElement': '\u220B',
      'ReverseEquilibrium': '\u21CB',
      'ReverseUpEquilibrium': '\u296F',
      'rfisht': '\u297D',
      'rfloor': '\u230B',
      'rfr': '\uD835\uDD2F',
      'Rfr': '\u211C',
      'rHar': '\u2964',
      'rhard': '\u21C1',
      'rharu': '\u21C0',
      'rharul': '\u296C',
      'rho': '\u03C1',
      'Rho': '\u03A1',
      'rhov': '\u03F1',
      'RightAngleBracket': '\u27E9',
      'rightarrow': '\u2192',
      'Rightarrow': '\u21D2',
      'RightArrow': '\u2192',
      'RightArrowBar': '\u21E5',
      'RightArrowLeftArrow': '\u21C4',
      'rightarrowtail': '\u21A3',
      'RightCeiling': '\u2309',
      'RightDoubleBracket': '\u27E7',
      'RightDownTeeVector': '\u295D',
      'RightDownVector': '\u21C2',
      'RightDownVectorBar': '\u2955',
      'RightFloor': '\u230B',
      'rightharpoondown': '\u21C1',
      'rightharpoonup': '\u21C0',
      'rightleftarrows': '\u21C4',
      'rightleftharpoons': '\u21CC',
      'rightrightarrows': '\u21C9',
      'rightsquigarrow': '\u219D',
      'RightTee': '\u22A2',
      'RightTeeArrow': '\u21A6',
      'RightTeeVector': '\u295B',
      'rightthreetimes': '\u22CC',
      'RightTriangle': '\u22B3',
      'RightTriangleBar': '\u29D0',
      'RightTriangleEqual': '\u22B5',
      'RightUpDownVector': '\u294F',
      'RightUpTeeVector': '\u295C',
      'RightUpVector': '\u21BE',
      'RightUpVectorBar': '\u2954',
      'RightVector': '\u21C0',
      'RightVectorBar': '\u2953',
      'ring': '\u02DA',
      'risingdotseq': '\u2253',
      'rlarr': '\u21C4',
      'rlhar': '\u21CC',
      'rlm': '\u200F',
      'rmoust': '\u23B1',
      'rmoustache': '\u23B1',
      'rnmid': '\u2AEE',
      'roang': '\u27ED',
      'roarr': '\u21FE',
      'robrk': '\u27E7',
      'ropar': '\u2986',
      'ropf': '\uD835\uDD63',
      'Ropf': '\u211D',
      'roplus': '\u2A2E',
      'rotimes': '\u2A35',
      'RoundImplies': '\u2970',
      'rpar': ')',
      'rpargt': '\u2994',
      'rppolint': '\u2A12',
      'rrarr': '\u21C9',
      'Rrightarrow': '\u21DB',
      'rsaquo': '\u203A',
      'rscr': '\uD835\uDCC7',
      'Rscr': '\u211B',
      'rsh': '\u21B1',
      'Rsh': '\u21B1',
      'rsqb': ']',
      'rsquo': '\u2019',
      'rsquor': '\u2019',
      'rthree': '\u22CC',
      'rtimes': '\u22CA',
      'rtri': '\u25B9',
      'rtrie': '\u22B5',
      'rtrif': '\u25B8',
      'rtriltri': '\u29CE',
      'RuleDelayed': '\u29F4',
      'ruluhar': '\u2968',
      'rx': '\u211E',
      'sacute': '\u015B',
      'Sacute': '\u015A',
      'sbquo': '\u201A',
      'sc': '\u227B',
      'Sc': '\u2ABC',
      'scap': '\u2AB8',
      'scaron': '\u0161',
      'Scaron': '\u0160',
      'sccue': '\u227D',
      'sce': '\u2AB0',
      'scE': '\u2AB4',
      'scedil': '\u015F',
      'Scedil': '\u015E',
      'scirc': '\u015D',
      'Scirc': '\u015C',
      'scnap': '\u2ABA',
      'scnE': '\u2AB6',
      'scnsim': '\u22E9',
      'scpolint': '\u2A13',
      'scsim': '\u227F',
      'scy': '\u0441',
      'Scy': '\u0421',
      'sdot': '\u22C5',
      'sdotb': '\u22A1',
      'sdote': '\u2A66',
      'searhk': '\u2925',
      'searr': '\u2198',
      'seArr': '\u21D8',
      'searrow': '\u2198',
      'sect': '\xA7',
      'semi': ';',
      'seswar': '\u2929',
      'setminus': '\u2216',
      'setmn': '\u2216',
      'sext': '\u2736',
      'sfr': '\uD835\uDD30',
      'Sfr': '\uD835\uDD16',
      'sfrown': '\u2322',
      'sharp': '\u266F',
      'shchcy': '\u0449',
      'SHCHcy': '\u0429',
      'shcy': '\u0448',
      'SHcy': '\u0428',
      'ShortDownArrow': '\u2193',
      'ShortLeftArrow': '\u2190',
      'shortmid': '\u2223',
      'shortparallel': '\u2225',
      'ShortRightArrow': '\u2192',
      'ShortUpArrow': '\u2191',
      'shy': '\xAD',
      'sigma': '\u03C3',
      'Sigma': '\u03A3',
      'sigmaf': '\u03C2',
      'sigmav': '\u03C2',
      'sim': '\u223C',
      'simdot': '\u2A6A',
      'sime': '\u2243',
      'simeq': '\u2243',
      'simg': '\u2A9E',
      'simgE': '\u2AA0',
      'siml': '\u2A9D',
      'simlE': '\u2A9F',
      'simne': '\u2246',
      'simplus': '\u2A24',
      'simrarr': '\u2972',
      'slarr': '\u2190',
      'SmallCircle': '\u2218',
      'smallsetminus': '\u2216',
      'smashp': '\u2A33',
      'smeparsl': '\u29E4',
      'smid': '\u2223',
      'smile': '\u2323',
      'smt': '\u2AAA',
      'smte': '\u2AAC',
      'smtes': '\u2AAC\uFE00',
      'softcy': '\u044C',
      'SOFTcy': '\u042C',
      'sol': '/',
      'solb': '\u29C4',
      'solbar': '\u233F',
      'sopf': '\uD835\uDD64',
      'Sopf': '\uD835\uDD4A',
      'spades': '\u2660',
      'spadesuit': '\u2660',
      'spar': '\u2225',
      'sqcap': '\u2293',
      'sqcaps': '\u2293\uFE00',
      'sqcup': '\u2294',
      'sqcups': '\u2294\uFE00',
      'Sqrt': '\u221A',
      'sqsub': '\u228F',
      'sqsube': '\u2291',
      'sqsubset': '\u228F',
      'sqsubseteq': '\u2291',
      'sqsup': '\u2290',
      'sqsupe': '\u2292',
      'sqsupset': '\u2290',
      'sqsupseteq': '\u2292',
      'squ': '\u25A1',
      'square': '\u25A1',
      'Square': '\u25A1',
      'SquareIntersection': '\u2293',
      'SquareSubset': '\u228F',
      'SquareSubsetEqual': '\u2291',
      'SquareSuperset': '\u2290',
      'SquareSupersetEqual': '\u2292',
      'SquareUnion': '\u2294',
      'squarf': '\u25AA',
      'squf': '\u25AA',
      'srarr': '\u2192',
      'sscr': '\uD835\uDCC8',
      'Sscr': '\uD835\uDCAE',
      'ssetmn': '\u2216',
      'ssmile': '\u2323',
      'sstarf': '\u22C6',
      'star': '\u2606',
      'Star': '\u22C6',
      'starf': '\u2605',
      'straightepsilon': '\u03F5',
      'straightphi': '\u03D5',
      'strns': '\xAF',
      'sub': '\u2282',
      'Sub': '\u22D0',
      'subdot': '\u2ABD',
      'sube': '\u2286',
      'subE': '\u2AC5',
      'subedot': '\u2AC3',
      'submult': '\u2AC1',
      'subne': '\u228A',
      'subnE': '\u2ACB',
      'subplus': '\u2ABF',
      'subrarr': '\u2979',
      'subset': '\u2282',
      'Subset': '\u22D0',
      'subseteq': '\u2286',
      'subseteqq': '\u2AC5',
      'SubsetEqual': '\u2286',
      'subsetneq': '\u228A',
      'subsetneqq': '\u2ACB',
      'subsim': '\u2AC7',
      'subsub': '\u2AD5',
      'subsup': '\u2AD3',
      'succ': '\u227B',
      'succapprox': '\u2AB8',
      'succcurlyeq': '\u227D',
      'Succeeds': '\u227B',
      'SucceedsEqual': '\u2AB0',
      'SucceedsSlantEqual': '\u227D',
      'SucceedsTilde': '\u227F',
      'succeq': '\u2AB0',
      'succnapprox': '\u2ABA',
      'succneqq': '\u2AB6',
      'succnsim': '\u22E9',
      'succsim': '\u227F',
      'SuchThat': '\u220B',
      'sum': '\u2211',
      'Sum': '\u2211',
      'sung': '\u266A',
      'sup': '\u2283',
      'Sup': '\u22D1',
      'sup1': '\xB9',
      'sup2': '\xB2',
      'sup3': '\xB3',
      'supdot': '\u2ABE',
      'supdsub': '\u2AD8',
      'supe': '\u2287',
      'supE': '\u2AC6',
      'supedot': '\u2AC4',
      'Superset': '\u2283',
      'SupersetEqual': '\u2287',
      'suphsol': '\u27C9',
      'suphsub': '\u2AD7',
      'suplarr': '\u297B',
      'supmult': '\u2AC2',
      'supne': '\u228B',
      'supnE': '\u2ACC',
      'supplus': '\u2AC0',
      'supset': '\u2283',
      'Supset': '\u22D1',
      'supseteq': '\u2287',
      'supseteqq': '\u2AC6',
      'supsetneq': '\u228B',
      'supsetneqq': '\u2ACC',
      'supsim': '\u2AC8',
      'supsub': '\u2AD4',
      'supsup': '\u2AD6',
      'swarhk': '\u2926',
      'swarr': '\u2199',
      'swArr': '\u21D9',
      'swarrow': '\u2199',
      'swnwar': '\u292A',
      'szlig': '\xDF',
      'Tab': '\t',
      'target': '\u2316',
      'tau': '\u03C4',
      'Tau': '\u03A4',
      'tbrk': '\u23B4',
      'tcaron': '\u0165',
      'Tcaron': '\u0164',
      'tcedil': '\u0163',
      'Tcedil': '\u0162',
      'tcy': '\u0442',
      'Tcy': '\u0422',
      'tdot': '\u20DB',
      'telrec': '\u2315',
      'tfr': '\uD835\uDD31',
      'Tfr': '\uD835\uDD17',
      'there4': '\u2234',
      'therefore': '\u2234',
      'Therefore': '\u2234',
      'theta': '\u03B8',
      'Theta': '\u0398',
      'thetasym': '\u03D1',
      'thetav': '\u03D1',
      'thickapprox': '\u2248',
      'thicksim': '\u223C',
      'ThickSpace': '\u205F\u200A',
      'thinsp': '\u2009',
      'ThinSpace': '\u2009',
      'thkap': '\u2248',
      'thksim': '\u223C',
      'thorn': '\xFE',
      'THORN': '\xDE',
      'tilde': '\u02DC',
      'Tilde': '\u223C',
      'TildeEqual': '\u2243',
      'TildeFullEqual': '\u2245',
      'TildeTilde': '\u2248',
      'times': '\xD7',
      'timesb': '\u22A0',
      'timesbar': '\u2A31',
      'timesd': '\u2A30',
      'tint': '\u222D',
      'toea': '\u2928',
      'top': '\u22A4',
      'topbot': '\u2336',
      'topcir': '\u2AF1',
      'topf': '\uD835\uDD65',
      'Topf': '\uD835\uDD4B',
      'topfork': '\u2ADA',
      'tosa': '\u2929',
      'tprime': '\u2034',
      'trade': '\u2122',
      'TRADE': '\u2122',
      'triangle': '\u25B5',
      'triangledown': '\u25BF',
      'triangleleft': '\u25C3',
      'trianglelefteq': '\u22B4',
      'triangleq': '\u225C',
      'triangleright': '\u25B9',
      'trianglerighteq': '\u22B5',
      'tridot': '\u25EC',
      'trie': '\u225C',
      'triminus': '\u2A3A',
      'TripleDot': '\u20DB',
      'triplus': '\u2A39',
      'trisb': '\u29CD',
      'tritime': '\u2A3B',
      'trpezium': '\u23E2',
      'tscr': '\uD835\uDCC9',
      'Tscr': '\uD835\uDCAF',
      'tscy': '\u0446',
      'TScy': '\u0426',
      'tshcy': '\u045B',
      'TSHcy': '\u040B',
      'tstrok': '\u0167',
      'Tstrok': '\u0166',
      'twixt': '\u226C',
      'twoheadleftarrow': '\u219E',
      'twoheadrightarrow': '\u21A0',
      'uacute': '\xFA',
      'Uacute': '\xDA',
      'uarr': '\u2191',
      'uArr': '\u21D1',
      'Uarr': '\u219F',
      'Uarrocir': '\u2949',
      'ubrcy': '\u045E',
      'Ubrcy': '\u040E',
      'ubreve': '\u016D',
      'Ubreve': '\u016C',
      'ucirc': '\xFB',
      'Ucirc': '\xDB',
      'ucy': '\u0443',
      'Ucy': '\u0423',
      'udarr': '\u21C5',
      'udblac': '\u0171',
      'Udblac': '\u0170',
      'udhar': '\u296E',
      'ufisht': '\u297E',
      'ufr': '\uD835\uDD32',
      'Ufr': '\uD835\uDD18',
      'ugrave': '\xF9',
      'Ugrave': '\xD9',
      'uHar': '\u2963',
      'uharl': '\u21BF',
      'uharr': '\u21BE',
      'uhblk': '\u2580',
      'ulcorn': '\u231C',
      'ulcorner': '\u231C',
      'ulcrop': '\u230F',
      'ultri': '\u25F8',
      'umacr': '\u016B',
      'Umacr': '\u016A',
      'uml': '\xA8',
      'UnderBar': '_',
      'UnderBrace': '\u23DF',
      'UnderBracket': '\u23B5',
      'UnderParenthesis': '\u23DD',
      'Union': '\u22C3',
      'UnionPlus': '\u228E',
      'uogon': '\u0173',
      'Uogon': '\u0172',
      'uopf': '\uD835\uDD66',
      'Uopf': '\uD835\uDD4C',
      'uparrow': '\u2191',
      'Uparrow': '\u21D1',
      'UpArrow': '\u2191',
      'UpArrowBar': '\u2912',
      'UpArrowDownArrow': '\u21C5',
      'updownarrow': '\u2195',
      'Updownarrow': '\u21D5',
      'UpDownArrow': '\u2195',
      'UpEquilibrium': '\u296E',
      'upharpoonleft': '\u21BF',
      'upharpoonright': '\u21BE',
      'uplus': '\u228E',
      'UpperLeftArrow': '\u2196',
      'UpperRightArrow': '\u2197',
      'upsi': '\u03C5',
      'Upsi': '\u03D2',
      'upsih': '\u03D2',
      'upsilon': '\u03C5',
      'Upsilon': '\u03A5',
      'UpTee': '\u22A5',
      'UpTeeArrow': '\u21A5',
      'upuparrows': '\u21C8',
      'urcorn': '\u231D',
      'urcorner': '\u231D',
      'urcrop': '\u230E',
      'uring': '\u016F',
      'Uring': '\u016E',
      'urtri': '\u25F9',
      'uscr': '\uD835\uDCCA',
      'Uscr': '\uD835\uDCB0',
      'utdot': '\u22F0',
      'utilde': '\u0169',
      'Utilde': '\u0168',
      'utri': '\u25B5',
      'utrif': '\u25B4',
      'uuarr': '\u21C8',
      'uuml': '\xFC',
      'Uuml': '\xDC',
      'uwangle': '\u29A7',
      'vangrt': '\u299C',
      'varepsilon': '\u03F5',
      'varkappa': '\u03F0',
      'varnothing': '\u2205',
      'varphi': '\u03D5',
      'varpi': '\u03D6',
      'varpropto': '\u221D',
      'varr': '\u2195',
      'vArr': '\u21D5',
      'varrho': '\u03F1',
      'varsigma': '\u03C2',
      'varsubsetneq': '\u228A\uFE00',
      'varsubsetneqq': '\u2ACB\uFE00',
      'varsupsetneq': '\u228B\uFE00',
      'varsupsetneqq': '\u2ACC\uFE00',
      'vartheta': '\u03D1',
      'vartriangleleft': '\u22B2',
      'vartriangleright': '\u22B3',
      'vBar': '\u2AE8',
      'Vbar': '\u2AEB',
      'vBarv': '\u2AE9',
      'vcy': '\u0432',
      'Vcy': '\u0412',
      'vdash': '\u22A2',
      'vDash': '\u22A8',
      'Vdash': '\u22A9',
      'VDash': '\u22AB',
      'Vdashl': '\u2AE6',
      'vee': '\u2228',
      'Vee': '\u22C1',
      'veebar': '\u22BB',
      'veeeq': '\u225A',
      'vellip': '\u22EE',
      'verbar': '|',
      'Verbar': '\u2016',
      'vert': '|',
      'Vert': '\u2016',
      'VerticalBar': '\u2223',
      'VerticalLine': '|',
      'VerticalSeparator': '\u2758',
      'VerticalTilde': '\u2240',
      'VeryThinSpace': '\u200A',
      'vfr': '\uD835\uDD33',
      'Vfr': '\uD835\uDD19',
      'vltri': '\u22B2',
      'vnsub': '\u2282\u20D2',
      'vnsup': '\u2283\u20D2',
      'vopf': '\uD835\uDD67',
      'Vopf': '\uD835\uDD4D',
      'vprop': '\u221D',
      'vrtri': '\u22B3',
      'vscr': '\uD835\uDCCB',
      'Vscr': '\uD835\uDCB1',
      'vsubne': '\u228A\uFE00',
      'vsubnE': '\u2ACB\uFE00',
      'vsupne': '\u228B\uFE00',
      'vsupnE': '\u2ACC\uFE00',
      'Vvdash': '\u22AA',
      'vzigzag': '\u299A',
      'wcirc': '\u0175',
      'Wcirc': '\u0174',
      'wedbar': '\u2A5F',
      'wedge': '\u2227',
      'Wedge': '\u22C0',
      'wedgeq': '\u2259',
      'weierp': '\u2118',
      'wfr': '\uD835\uDD34',
      'Wfr': '\uD835\uDD1A',
      'wopf': '\uD835\uDD68',
      'Wopf': '\uD835\uDD4E',
      'wp': '\u2118',
      'wr': '\u2240',
      'wreath': '\u2240',
      'wscr': '\uD835\uDCCC',
      'Wscr': '\uD835\uDCB2',
      'xcap': '\u22C2',
      'xcirc': '\u25EF',
      'xcup': '\u22C3',
      'xdtri': '\u25BD',
      'xfr': '\uD835\uDD35',
      'Xfr': '\uD835\uDD1B',
      'xharr': '\u27F7',
      'xhArr': '\u27FA',
      'xi': '\u03BE',
      'Xi': '\u039E',
      'xlarr': '\u27F5',
      'xlArr': '\u27F8',
      'xmap': '\u27FC',
      'xnis': '\u22FB',
      'xodot': '\u2A00',
      'xopf': '\uD835\uDD69',
      'Xopf': '\uD835\uDD4F',
      'xoplus': '\u2A01',
      'xotime': '\u2A02',
      'xrarr': '\u27F6',
      'xrArr': '\u27F9',
      'xscr': '\uD835\uDCCD',
      'Xscr': '\uD835\uDCB3',
      'xsqcup': '\u2A06',
      'xuplus': '\u2A04',
      'xutri': '\u25B3',
      'xvee': '\u22C1',
      'xwedge': '\u22C0',
      'yacute': '\xFD',
      'Yacute': '\xDD',
      'yacy': '\u044F',
      'YAcy': '\u042F',
      'ycirc': '\u0177',
      'Ycirc': '\u0176',
      'ycy': '\u044B',
      'Ycy': '\u042B',
      'yen': '\xA5',
      'yfr': '\uD835\uDD36',
      'Yfr': '\uD835\uDD1C',
      'yicy': '\u0457',
      'YIcy': '\u0407',
      'yopf': '\uD835\uDD6A',
      'Yopf': '\uD835\uDD50',
      'yscr': '\uD835\uDCCE',
      'Yscr': '\uD835\uDCB4',
      'yucy': '\u044E',
      'YUcy': '\u042E',
      'yuml': '\xFF',
      'Yuml': '\u0178',
      'zacute': '\u017A',
      'Zacute': '\u0179',
      'zcaron': '\u017E',
      'Zcaron': '\u017D',
      'zcy': '\u0437',
      'Zcy': '\u0417',
      'zdot': '\u017C',
      'Zdot': '\u017B',
      'zeetrf': '\u2128',
      'ZeroWidthSpace': '\u200B',
      'zeta': '\u03B6',
      'Zeta': '\u0396',
      'zfr': '\uD835\uDD37',
      'Zfr': '\u2128',
      'zhcy': '\u0436',
      'ZHcy': '\u0416',
      'zigrarr': '\u21DD',
      'zopf': '\uD835\uDD6B',
      'Zopf': '\u2124',
      'zscr': '\uD835\uDCCF',
      'Zscr': '\uD835\uDCB5',
      'zwj': '\u200D',
      'zwnj': '\u200C'
    };
    var decodeMapLegacy = {
      'aacute': '\xE1',
      'Aacute': '\xC1',
      'acirc': '\xE2',
      'Acirc': '\xC2',
      'acute': '\xB4',
      'aelig': '\xE6',
      'AElig': '\xC6',
      'agrave': '\xE0',
      'Agrave': '\xC0',
      'amp': '&',
      'AMP': '&',
      'aring': '\xE5',
      'Aring': '\xC5',
      'atilde': '\xE3',
      'Atilde': '\xC3',
      'auml': '\xE4',
      'Auml': '\xC4',
      'brvbar': '\xA6',
      'ccedil': '\xE7',
      'Ccedil': '\xC7',
      'cedil': '\xB8',
      'cent': '\xA2',
      'copy': '\xA9',
      'COPY': '\xA9',
      'curren': '\xA4',
      'deg': '\xB0',
      'divide': '\xF7',
      'eacute': '\xE9',
      'Eacute': '\xC9',
      'ecirc': '\xEA',
      'Ecirc': '\xCA',
      'egrave': '\xE8',
      'Egrave': '\xC8',
      'eth': '\xF0',
      'ETH': '\xD0',
      'euml': '\xEB',
      'Euml': '\xCB',
      'frac12': '\xBD',
      'frac14': '\xBC',
      'frac34': '\xBE',
      'gt': '>',
      'GT': '>',
      'iacute': '\xED',
      'Iacute': '\xCD',
      'icirc': '\xEE',
      'Icirc': '\xCE',
      'iexcl': '\xA1',
      'igrave': '\xEC',
      'Igrave': '\xCC',
      'iquest': '\xBF',
      'iuml': '\xEF',
      'Iuml': '\xCF',
      'laquo': '\xAB',
      'lt': '<',
      'LT': '<',
      'macr': '\xAF',
      'micro': '\xB5',
      'middot': '\xB7',
      'nbsp': '\xA0',
      'not': '\xAC',
      'ntilde': '\xF1',
      'Ntilde': '\xD1',
      'oacute': '\xF3',
      'Oacute': '\xD3',
      'ocirc': '\xF4',
      'Ocirc': '\xD4',
      'ograve': '\xF2',
      'Ograve': '\xD2',
      'ordf': '\xAA',
      'ordm': '\xBA',
      'oslash': '\xF8',
      'Oslash': '\xD8',
      'otilde': '\xF5',
      'Otilde': '\xD5',
      'ouml': '\xF6',
      'Ouml': '\xD6',
      'para': '\xB6',
      'plusmn': '\xB1',
      'pound': '\xA3',
      'quot': '"',
      'QUOT': '"',
      'raquo': '\xBB',
      'reg': '\xAE',
      'REG': '\xAE',
      'sect': '\xA7',
      'shy': '\xAD',
      'sup1': '\xB9',
      'sup2': '\xB2',
      'sup3': '\xB3',
      'szlig': '\xDF',
      'thorn': '\xFE',
      'THORN': '\xDE',
      'times': '\xD7',
      'uacute': '\xFA',
      'Uacute': '\xDA',
      'ucirc': '\xFB',
      'Ucirc': '\xDB',
      'ugrave': '\xF9',
      'Ugrave': '\xD9',
      'uml': '\xA8',
      'uuml': '\xFC',
      'Uuml': '\xDC',
      'yacute': '\xFD',
      'Yacute': '\xDD',
      'yen': '\xA5',
      'yuml': '\xFF'
    };
    var decodeMapNumeric = {
      '0': '\uFFFD',
      '128': '\u20AC',
      '130': '\u201A',
      '131': '\u0192',
      '132': '\u201E',
      '133': '\u2026',
      '134': '\u2020',
      '135': '\u2021',
      '136': '\u02C6',
      '137': '\u2030',
      '138': '\u0160',
      '139': '\u2039',
      '140': '\u0152',
      '142': '\u017D',
      '145': '\u2018',
      '146': '\u2019',
      '147': '\u201C',
      '148': '\u201D',
      '149': '\u2022',
      '150': '\u2013',
      '151': '\u2014',
      '152': '\u02DC',
      '153': '\u2122',
      '154': '\u0161',
      '155': '\u203A',
      '156': '\u0153',
      '158': '\u017E',
      '159': '\u0178'
    };
    var invalidReferenceCodePoints = [1, 2, 3, 4, 5, 6, 7, 8, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 64976, 64977, 64978, 64979, 64980, 64981, 64982, 64983, 64984, 64985, 64986, 64987, 64988, 64989, 64990, 64991, 64992, 64993, 64994, 64995, 64996, 64997, 64998, 64999, 65000, 65001, 65002, 65003, 65004, 65005, 65006, 65007, 65534, 65535, 131070, 131071, 196606, 196607, 262142, 262143, 327678, 327679, 393214, 393215, 458750, 458751, 524286, 524287, 589822, 589823, 655358, 655359, 720894, 720895, 786430, 786431, 851966, 851967, 917502, 917503, 983038, 983039, 1048574, 1048575, 1114110, 1114111];
    /*--------------------------------------------------------------------------*/

    var stringFromCharCode = String.fromCharCode;
    var object = {};
    var hasOwnProperty = object.hasOwnProperty;

    var has = function (object, propertyName) {
      return hasOwnProperty.call(object, propertyName);
    };

    var contains = function (array, value) {
      var index = -1;
      var length = array.length;

      while (++index < length) {
        if (array[index] == value) {
          return true;
        }
      }

      return false;
    };

    var merge = function (options, defaults) {
      if (!options) {
        return defaults;
      }

      var result = {};
      var key;

      for (key in defaults) {
        // A `hasOwnProperty` check is not needed here, since only recognized
        // option names are used anyway. Any others are ignored.
        result[key] = has(options, key) ? options[key] : defaults[key];
      }

      return result;
    }; // Modified version of `ucs2encode`; see https://mths.be/punycode.


    var codePointToSymbol = function (codePoint, strict) {
      var output = '';

      if (codePoint >= 0xD800 && codePoint <= 0xDFFF || codePoint > 0x10FFFF) {
        // See issue #4:
        // “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
        // greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
        // REPLACEMENT CHARACTER.”
        if (strict) {
          parseError('character reference outside the permissible Unicode range');
        }

        return '\uFFFD';
      }

      if (has(decodeMapNumeric, codePoint)) {
        if (strict) {
          parseError('disallowed character reference');
        }

        return decodeMapNumeric[codePoint];
      }

      if (strict && contains(invalidReferenceCodePoints, codePoint)) {
        parseError('disallowed character reference');
      }

      if (codePoint > 0xFFFF) {
        codePoint -= 0x10000;
        output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      output += stringFromCharCode(codePoint);
      return output;
    };

    var hexEscape = function (codePoint) {
      return '&#x' + codePoint.toString(16).toUpperCase() + ';';
    };

    var decEscape = function (codePoint) {
      return '&#' + codePoint + ';';
    };

    var parseError = function (message) {
      throw Error('Parse error: ' + message);
    };
    /*--------------------------------------------------------------------------*/


    var encode = function (string, options) {
      options = merge(options, encode.options);
      var strict = options.strict;

      if (strict && regexInvalidRawCodePoint.test(string)) {
        parseError('forbidden code point');
      }

      var encodeEverything = options.encodeEverything;
      var useNamedReferences = options.useNamedReferences;
      var allowUnsafeSymbols = options.allowUnsafeSymbols;
      var escapeCodePoint = options.decimal ? decEscape : hexEscape;

      var escapeBmpSymbol = function (symbol) {
        return escapeCodePoint(symbol.charCodeAt(0));
      };

      if (encodeEverything) {
        // Encode ASCII symbols.
        string = string.replace(regexAsciiWhitelist, function (symbol) {
          // Use named references if requested & possible.
          if (useNamedReferences && has(encodeMap, symbol)) {
            return '&' + encodeMap[symbol] + ';';
          }

          return escapeBmpSymbol(symbol);
        }); // Shorten a few escapes that represent two symbols, of which at least one
        // is within the ASCII range.

        if (useNamedReferences) {
          string = string.replace(/&gt;\u20D2/g, '&nvgt;').replace(/&lt;\u20D2/g, '&nvlt;').replace(/&#x66;&#x6A;/g, '&fjlig;');
        } // Encode non-ASCII symbols.


        if (useNamedReferences) {
          // Encode non-ASCII symbols that can be replaced with a named reference.
          string = string.replace(regexEncodeNonAscii, function (string) {
            // Note: there is no need to check `has(encodeMap, string)` here.
            return '&' + encodeMap[string] + ';';
          });
        } // Note: any remaining non-ASCII symbols are handled outside of the `if`.

      } else if (useNamedReferences) {
        // Apply named character references.
        // Encode `<>"'&` using named character references.
        if (!allowUnsafeSymbols) {
          string = string.replace(regexEscape, function (string) {
            return '&' + encodeMap[string] + ';'; // no need to check `has()` here
          });
        } // Shorten escapes that represent two symbols, of which at least one is
        // `<>"'&`.


        string = string.replace(/&gt;\u20D2/g, '&nvgt;').replace(/&lt;\u20D2/g, '&nvlt;'); // Encode non-ASCII symbols that can be replaced with a named reference.

        string = string.replace(regexEncodeNonAscii, function (string) {
          // Note: there is no need to check `has(encodeMap, string)` here.
          return '&' + encodeMap[string] + ';';
        });
      } else if (!allowUnsafeSymbols) {
        // Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
        // using named character references.
        string = string.replace(regexEscape, escapeBmpSymbol);
      }

      return string // Encode astral symbols.
      .replace(regexAstralSymbols, function ($0) {
        // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var high = $0.charCodeAt(0);
        var low = $0.charCodeAt(1);
        var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
        return escapeCodePoint(codePoint);
      }) // Encode any remaining BMP symbols that are not printable ASCII symbols
      // using a hexadecimal escape.
      .replace(regexBmpWhitelist, escapeBmpSymbol);
    }; // Expose default options (so they can be overridden globally).


    encode.options = {
      'allowUnsafeSymbols': false,
      'encodeEverything': false,
      'strict': false,
      'useNamedReferences': false,
      'decimal': false
    };

    var decode = function (html, options) {
      options = merge(options, decode.options);
      var strict = options.strict;

      if (strict && regexInvalidEntity.test(html)) {
        parseError('malformed character reference');
      }

      return html.replace(regexDecode, function ($0, $1, $2, $3, $4, $5, $6, $7, $8) {
        var codePoint;
        var semicolon;
        var decDigits;
        var hexDigits;
        var reference;
        var next;

        if ($1) {
          reference = $1; // Note: there is no need to check `has(decodeMap, reference)`.

          return decodeMap[reference];
        }

        if ($2) {
          // Decode named character references without trailing `;`, e.g. `&amp`.
          // This is only a parse error if it gets converted to `&`, or if it is
          // followed by `=` in an attribute context.
          reference = $2;
          next = $3;

          if (next && options.isAttributeValue) {
            if (strict && next == '=') {
              parseError('`&` did not start a character reference');
            }

            return $0;
          } else {
            if (strict) {
              parseError('named character reference was not terminated by a semicolon');
            } // Note: there is no need to check `has(decodeMapLegacy, reference)`.


            return decodeMapLegacy[reference] + (next || '');
          }
        }

        if ($4) {
          // Decode decimal escapes, e.g. `&#119558;`.
          decDigits = $4;
          semicolon = $5;

          if (strict && !semicolon) {
            parseError('character reference was not terminated by a semicolon');
          }

          codePoint = parseInt(decDigits, 10);
          return codePointToSymbol(codePoint, strict);
        }

        if ($6) {
          // Decode hexadecimal escapes, e.g. `&#x1D306;`.
          hexDigits = $6;
          semicolon = $7;

          if (strict && !semicolon) {
            parseError('character reference was not terminated by a semicolon');
          }

          codePoint = parseInt(hexDigits, 16);
          return codePointToSymbol(codePoint, strict);
        } // If we’re still here, `if ($7)` is implied; it’s an ambiguous
        // ampersand for sure. https://mths.be/notes/ambiguous-ampersands


        if (strict) {
          parseError('named character reference was not terminated by a semicolon');
        }

        return $0;
      });
    }; // Expose default options (so they can be overridden globally).


    decode.options = {
      'isAttributeValue': false,
      'strict': false
    };

    var escape = function (string) {
      return string.replace(regexEscape, function ($0) {
        // Note: there is no need to check `has(escapeMap, $0)` here.
        return escapeMap[$0];
      });
    };
    /*--------------------------------------------------------------------------*/


    var he = {
      'version': '1.2.0',
      'encode': encode,
      'decode': decode,
      'escape': escape,
      'unescape': decode
    }; // Some AMD build optimizers, like r.js, check for specific condition patterns
    // like the following:

    if (freeExports && !freeExports.nodeType) {
      if (freeModule) {
        // in Node.js, io.js, or RingoJS v0.8.0+
        freeModule.exports = he;
      } else {
        // in Narwhal or RingoJS v0.7.0-
        for (var key in he) {
          has(he, key) && (freeExports[key] = he[key]);
        }
      }
    } else {
      // in Rhino or a web browser
      root.he = he;
    }
  })(commonjsGlobal);
})(he$1, he$1.exports);

var he = he$1.exports;

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 */

/**
 * Function called with a node to produce a new node.
 *
 * @callback MapFunction
 * @param {Node} node Current node being processed
 * @param {number} [index] Index of `node`, or `null`
 * @param {Parent} [parent] Parent of `node`, or `null`
 * @returns {Node} Node to be used in the new tree. Its children are not used: if the original node has children, those are mapped.
 */

/**
 * Unist utility to create a new tree by mapping all nodes with the given function.
 *
 * @param {Node} tree Tree to map
 * @param {MapFunction} iteratee Function that returns a new node
 * @returns {Node} New mapped tree.
 */
function map(tree, iteratee) {
  return preorder(tree, null, null);
  /**
   * @param {Node} node
   * @param {number} [index]
   * @param {Parent} [parent]
   * @returns {Node}
   */

  function preorder(node, index, parent) {
    var newNode = Object.assign({}, iteratee(node, index, parent));

    if (node.children) {
      // @ts-ignore Looks like a parent.
      newNode.children = node.children.map(function (
      /** @type {Node} */
      child,
      /** @type {number} */
      index) {
        // @ts-ignore Looks like a parent.
        return preorder(child, index, node);
      });
    }

    return newNode;
  }
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 *
 * @typedef {import('unist-util-is').Type} Type
 * @typedef {import('unist-util-is').Props} Props
 * @typedef {import('unist-util-is').TestFunctionAnything} TestFunctionAnything
 */
var findAfter =
/**
 * @type {(
 *  (<T extends Node>(node: Parent, index: Node|number, test: T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>|Array.<T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>>) => T|null) &
 *  ((node: Parent, index: Node|number, test?: null|undefined|Type|Props|TestFunctionAnything|Array<Type|Props|TestFunctionAnything>) => Node|null)
 * )}
 */

/**
 * @param {Parent} parent Parent node
 * @param {Node|number} index Child of `parent`, or it’s index
 * @param {null|undefined|Type|Props|TestFunctionAnything|Array<Type|Props|TestFunctionAnything>} [test] is-compatible test (such as a type)
 * @returns {Node|null}
 */
function (parent, index, test) {
  var is = convert$2(test);

  if (!parent || !parent.type || !parent.children) {
    throw new Error('Expected parent node');
  }

  if (typeof index === 'number') {
    if (index < 0 || index === Number.POSITIVE_INFINITY) {
      throw new Error('Expected positive finite number as index');
    }
  } else {
    index = parent.children.indexOf(index);

    if (index < 0) {
      throw new Error('Expected child node or index');
    }
  }

  while (++index < parent.children.length) {
    if (is(parent.children[index], index, parent)) {
      return parent.children[index];
    }
  }

  return null;
};

var own$d = {}.hasOwnProperty;
/**
 * @callback Handler
 * @param {...unknown} value
 * @return {unknown}
 *
 * @typedef {Record<string, Handler>} Handlers
 *
 * @typedef {Object} Options
 * @property {Handler} [unknown]
 * @property {Handler} [invalid]
 * @property {Handlers} [handlers]
 */

/**
 * Handle values based on a property.
 *
 * @param {string} key
 * @param {Options} [options]
 */

function zwitch(key, options) {
  var settings = options || {};
  /**
   * Handle one value.
   * Based on the bound `key`, a respective handler will be called.
   * If `value` is not an object, or doesn’t have a `key` property, the special
   * “invalid” handler will be called.
   * If `value` has an unknown `key`, the special “unknown” handler will be
   * called.
   *
   * All arguments, and the context object, are passed through to the handler,
   * and it’s result is returned.
   *
   * @param {...unknown} [value]
   * @this {unknown}
   * @returns {unknown}
   * @property {Handler} invalid
   * @property {Handler} unknown
   * @property {Handlers} handlers
   */

  function one(value) {
    var fn = one.invalid;
    var handlers = one.handlers;

    if (value && own$d.call(value, key)) {
      fn = own$d.call(handlers, value[key]) ? handlers[value[key]] : one.unknown;
    }

    if (fn) {
      return fn.apply(this, arguments);
    }
  }

  one.handlers = settings.handlers || {};
  one.invalid = settings.invalid;
  one.unknown = settings.unknown;
  return one;
}

/**
 * @typedef {import('./types.js').Selector} Selector
 * @typedef {import('./types.js').Selectors} Selectors
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').RuleSet} RuleSet
 * @typedef {import('./types.js').RulePseudo} RulePseudo
 * @typedef {import('./types.js').Query} Query
 * @typedef {import('./types.js').Node} Node
 * @typedef {import('./types.js').Parent} Parent
 * @typedef {import('./types.js').SelectIterator} SelectIterator
 * @typedef {import('./types.js').SelectState} SelectState
 */

/**
 * @param {Node} node
 * @returns {node is Parent}
 */
function root$2(node) {
  return (// Root in nlcst.
    node.type === 'RootNode' || // Rest
    node.type === 'root'
  );
}
/**
 * @param {Node} node
 * @returns {node is Parent}
 */

function parent(node) {
  // @ts-expect-error: looks like a record.
  return Array.isArray(node.children);
}

/**
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').Query} Query
 * @typedef {import('./types.js').Node} Node
 * @typedef {import('./types.js').Parent} Parent
 * @typedef {import('./types.js').SelectState} SelectState
 * @typedef {import('./types.js').SelectIterator} SelectIterator
 * @typedef {import('./types.js').Handler} Handler
 */
const own$c = {}.hasOwnProperty;
const handle$2 = zwitch('nestingOperator', {
  // @ts-expect-error: hush.
  unknown: unknownNesting,
  // @ts-expect-error: hush.
  invalid: topScan,
  // `undefined` is the top query selector.
  handlers: {
    // @ts-expect-error: hush.
    null: descendant,
    // `null` is the descendant combinator.
    // @ts-expect-error: hush.
    '>': child,
    // @ts-expect-error: hush.
    '+': adjacentSibling,
    // @ts-expect-error: hush.
    '~': generalSibling
  }
});
/** @type {Handler} */

const nest = handle$2; // Shouldn’t be invoked, parser gives correct data.

/* c8 ignore next 6 */

/**
 * @param {{[x: string]: unknown, type: string}} query
 */

function unknownNesting(query) {
  throw new Error('Unexpected nesting `' + query.nestingOperator + '`');
}
/** @type {Handler} */


function topScan(query, node, index, parent, state) {
  // Shouldn’t happen.

  /* c8 ignore next 7 */
  if (parent) {
    throw new Error('topScan is supposed to be called from the root node');
  }

  if (!state.iterator) {
    throw new Error('Expected `iterator` to be defined');
  } // Shouldn’t happen.

  /* c8 ignore next 3 */


  if (typeof index !== 'number') {
    throw new TypeError('Expected `index` to be defined');
  }

  state.iterator(query, node, index, parent, state);
  if (!state.shallow) descendant(query, node, index, parent, state);
}
/** @type {Handler} */


function descendant(query, node, index, parent, state) {
  // Shouldn’t happen.

  /* c8 ignore next 3 */
  if (!state.iterator) {
    throw new Error('Expected `iterator` to be defined');
  }

  const previous = state.iterator;
  state.iterator = iterator;
  child(query, node, index, parent, state);
  /** @type {SelectIterator} */

  function iterator(query, node, index, parent, state) {
    state.iterator = previous;
    previous(query, node, index, parent, state);
    state.iterator = iterator;
    if (state.one && state.found) return;
    child(query, node, index, parent, state);
  }
}
/** @type {Handler} */


function child(query, node, _1, _2, state) {
  if (!parent(node)) return;
  if (node.children.length === 0) return;
  new WalkIterator(query, node, state).each().done();
}
/** @type {Handler} */


function adjacentSibling(query, _, index, parent, state) {
  // Shouldn’t happen.

  /* c8 ignore next 3 */
  if (typeof index !== 'number') {
    throw new TypeError('Expected `index` to be defined');
  } // Shouldn’t happen.

  /* c8 ignore next */


  if (!parent) return;
  new WalkIterator(query, parent, state).prefillTypeIndex(0, ++index).each(index, ++index).prefillTypeIndex(index).done();
}
/** @type {Handler} */


function generalSibling(query, _, index, parent, state) {
  // Shouldn’t happen.

  /* c8 ignore next 3 */
  if (typeof index !== 'number') {
    throw new TypeError('Expected `index` to be defined');
  } // Shouldn’t happen.

  /* c8 ignore next */


  if (!parent) return;
  new WalkIterator(query, parent, state).prefillTypeIndex(0, ++index).each(index).done();
}

class WalkIterator {
  /**
   * Handles typeIndex and typeCount properties for every walker.
   *
   * @param {Rule} query
   * @param {Parent} parent
   * @param {SelectState} state
   */
  constructor(query, parent, state) {
    /** @type {Rule} */
    this.query = query;
    /** @type {Parent} */

    this.parent = parent;
    /** @type {SelectState} */

    this.state = state;
    /** @type {TypeIndex|undefined} */

    this.typeIndex = state.index ? new TypeIndex() : undefined;
    /** @type {Array.<Function>} */

    this.delayed = [];
  }
  /**
   * @param {number|null|undefined} [x]
   * @param {number|null|undefined} [y]
   * @returns {this}
   */


  prefillTypeIndex(x, y) {
    let [start, end] = this.defaults(x, y);

    if (this.typeIndex) {
      while (start < end) {
        this.typeIndex.index(this.parent.children[start]);
        start++;
      }
    }

    return this;
  }
  /**
   * @param {number|null|undefined} [x]
   * @param {number|null|undefined} [y]
   * @returns {this}
   */


  each(x, y) {
    const [start, end] = this.defaults(x, y);
    const child = this.parent.children[start];
    /** @type {number} */

    let index;
    /** @type {number} */

    let nodeIndex;
    if (start >= end) return this;

    if (this.typeIndex) {
      nodeIndex = this.typeIndex.nodes;
      index = this.typeIndex.index(child);
      this.delayed.push(delay);
    } else {
      // Shouldn’t happen.

      /* c8 ignore next 3 */
      if (!this.state.iterator) {
        throw new Error('Expected `iterator` to be defined');
      }

      this.state.iterator(this.query, child, start, this.parent, this.state);
    } // Stop if we’re looking for one node and it’s already found.


    if (this.state.one && this.state.found) return this;
    return this.each(start + 1, end);
    /**
     * @this {WalkIterator}
     */

    function delay() {
      // Shouldn’t happen.

      /* c8 ignore next 3 */
      if (!this.typeIndex) {
        throw new TypeError('Expected `typeIndex` to be defined');
      } // Shouldn’t happen.

      /* c8 ignore next 3 */


      if (!this.state.iterator) {
        throw new Error('Expected `iterator` to be defined');
      }

      this.state.typeIndex = index;
      this.state.nodeIndex = nodeIndex;
      this.state.typeCount = this.typeIndex.count(child);
      this.state.nodeCount = this.typeIndex.nodes;
      this.state.iterator(this.query, child, start, this.parent, this.state);
    }
  }
  /**
   * Done!
   * @returns {this}
   */


  done() {
    let index = -1;

    while (++index < this.delayed.length) {
      this.delayed[index].call(this);
      if (this.state.one && this.state.found) break;
    }

    return this;
  }
  /**
   * @param {number|null|undefined} [start]
   * @param {number|null|undefined} [end]
   * @returns {[number, number]}
   */


  defaults(start, end) {
    if (start === null || start === undefined || start < 0) start = 0;
    if (end === null || end === undefined || end > this.parent.children.length) end = this.parent.children.length;
    return [start, end];
  }

}

class TypeIndex {
  constructor() {
    /** @type {Object.<string, number>} */
    this.counts = {};
    /** @type {number} */

    this.nodes = 0;
  }
  /**
   * @param {Node} node
   * @returns {number}
   */


  index(node) {
    const type = node.type;
    this.nodes++;
    if (!own$c.call(this.counts, type)) this.counts[type] = 0; // Note: `++` is intended to be postfixed!

    return this.counts[type]++;
  }
  /**
   * @param {Node} node
   * @returns {number|undefined}
   */


  count(node) {
    return this.counts[node.type];
  }

}

/**
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').RulePseudo} RulePseudo
 * @typedef {import('./types.js').RulePseudoNth} RulePseudoNth
 * @typedef {import('./types.js').RulePseudoSelector} RulePseudoSelector
 * @typedef {import('./types.js').Parent} Parent
 * @typedef {import('./types.js').Selector} Selector
 * @typedef {import('./types.js').Selectors} Selectors
 * @typedef {import('./types.js').SelectState} SelectState
 * @typedef {import('./types.js').Node} Node
 */
const is$1 = convert$2();
const handle$1 = zwitch('name', {
  // @ts-expect-error: hush.
  unknown: unknownPseudo,
  invalid: invalidPseudo,
  handlers: {
    // @ts-expect-error: hush.
    any: matches,
    // @ts-expect-error: hush.
    blank: empty,
    // @ts-expect-error: hush.
    empty,
    // @ts-expect-error: hush.
    'first-child': firstChild,
    // @ts-expect-error: hush.
    'first-of-type': firstOfType,
    // @ts-expect-error: hush.
    has: hasSelector,
    // @ts-expect-error: hush.
    'last-child': lastChild,
    // @ts-expect-error: hush.
    'last-of-type': lastOfType,
    // @ts-expect-error: hush.
    matches,
    // @ts-expect-error: hush.
    not,
    // @ts-expect-error: hush.
    'nth-child': nthChild,
    // @ts-expect-error: hush.
    'nth-last-child': nthLastChild,
    // @ts-expect-error: hush.
    'nth-of-type': nthOfType,
    // @ts-expect-error: hush.
    'nth-last-of-type': nthLastOfType,
    // @ts-expect-error: hush.
    'only-child': onlyChild,
    // @ts-expect-error: hush.
    'only-of-type': onlyOfType,
    // @ts-expect-error: hush.
    root: root$1,
    // @ts-expect-error: hush.
    scope
  }
});
pseudo.needsIndex = ['first-child', 'first-of-type', 'last-child', 'last-of-type', 'nth-child', 'nth-last-child', 'nth-of-type', 'nth-last-of-type', 'only-child', 'only-of-type'];
/**
 * @param {Rule} query
 * @param {Node} node
 * @param {number|null} index
 * @param {Parent|null} parent
 * @param {SelectState} state
 * @returns {boolean}
 */

function pseudo(query, node, index, parent, state) {
  const pseudos = query.pseudos;
  let offset = -1;

  while (++offset < pseudos.length) {
    if (!handle$1(pseudos[offset], node, index, parent, state)) return false;
  }

  return true;
}
/**
 * @param {RulePseudoSelector} query
 * @param {Node} node
 * @param {number|null} _1
 * @param {Parent|null} _2
 * @param {SelectState} state
 * @returns {boolean}
 */

function matches(query, node, _1, _2, state) {
  const shallow = state.shallow;
  const one = state.one;
  state.one = true;
  state.shallow = true;
  const result = state.any(query.value, node, state)[0] === node;
  state.shallow = shallow;
  state.one = one;
  return result;
}
/**
 * @param {RulePseudoSelector} query
 * @param {Node} node
 * @param {number|null} index
 * @param {Parent|null} parent
 * @param {SelectState} state
 * @returns {boolean}
 */


function not(query, node, index, parent, state) {
  return !matches(query, node, index, parent, state);
}
/**
 * @param {RulePseudo} _1
 * @param {Node} node
 * @param {number|null} _2
 * @param {Parent|null} parent
 * @returns {boolean}
 */


function root$1(_1, node, _2, parent) {
  return is$1(node) && !parent;
}
/**
 * @param {RulePseudo} _1
 * @param {Node} node
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function scope(_1, node, _2, _3, state) {
  return is$1(node) && state.scopeNodes !== undefined && state.scopeNodes.includes(node);
}
/**
 * @param {RulePseudo} _1
 * @param {Node} node
 * @returns {boolean}
 */


function empty(_1, node) {
  return parent(node) ? node.children.length === 0 : !('value' in node);
}
/**
 * @param {RulePseudo} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function firstChild(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return state.nodeIndex === 0; // Specifically `0`, not falsey.
}
/**
 * @param {RulePseudo} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function lastChild(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return typeof state.nodeCount === 'number' && state.nodeIndex === state.nodeCount - 1;
}
/**
 * @param {RulePseudo} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function onlyChild(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return state.nodeCount === 1;
}
/**
 * @param {RulePseudoNth} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function nthChild(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return typeof state.nodeIndex === 'number' && query.value(state.nodeIndex);
}
/**
 * @param {RulePseudoNth} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function nthLastChild(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return typeof state.nodeCount === 'number' && typeof state.nodeIndex === 'number' && query.value(state.nodeCount - state.nodeIndex - 1);
}
/**
 * @param {RulePseudoNth} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function nthOfType(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return typeof state.typeIndex === 'number' && query.value(state.typeIndex);
}
/**
 * @param {RulePseudoNth} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function nthLastOfType(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return typeof state.typeIndex === 'number' && typeof state.typeCount === 'number' && query.value(state.typeCount - 1 - state.typeIndex);
}
/**
 * @param {RulePseudo} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function firstOfType(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return state.typeIndex === 0;
}
/**
 * @param {RulePseudo} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function lastOfType(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return typeof state.typeCount === 'number' && state.typeIndex === state.typeCount - 1;
}
/**
 * @param {RulePseudo} query
 * @param {Node} _1
 * @param {number|null} _2
 * @param {Parent|null} _3
 * @param {SelectState} state
 * @returns {boolean}
 */


function onlyOfType(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return state.typeCount === 1;
} // Shouldn’t be invoked, parser gives correct data.

/* c8 ignore next 3 */


function invalidPseudo() {
  throw new Error('Invalid pseudo-selector');
}
/**
 * @param {RulePseudo} query
 * @returns {boolean}
 */


function unknownPseudo(query) {
  if (query.name) {
    throw new Error('Unknown pseudo-selector `' + query.name + '`');
  }

  throw new Error('Unexpected pseudo-element or empty pseudo-class');
}
/**
 * @param {SelectState} state
 * @param {RulePseudo|RulePseudoNth} query
 */


function assertDeep(state, query) {
  if (state.shallow) {
    throw new Error('Cannot use `:' + query.name + '` without parent');
  }
}
/**
 * @param {RulePseudoSelector} query
 * @param {Node} node
 * @param {number|null} _1
 * @param {Parent|null} _2
 * @param {SelectState} state
 * @returns {boolean}
 */


function hasSelector(query, node, _1, _2, state) {
  const shallow = state.shallow;
  const one = state.one;
  const scopeNodes = state.scopeNodes;
  const value = appendScope(query.value);
  const anything = state.any;
  state.shallow = false;
  state.one = true;
  state.scopeNodes = [node];
  const result = Boolean(anything(value, node, state)[0]);
  state.shallow = shallow;
  state.one = one;
  state.scopeNodes = scopeNodes;
  return result;
}
/**
 * @param {Selector} value
 */


function appendScope(value) {
  /** @type {Selectors} */
  const selector = value.type === 'ruleSet' ? {
    type: 'selectors',
    selectors: [value]
  } : value;
  let index = -1;
  /** @type {Rule} */

  let rule;

  while (++index < selector.selectors.length) {
    rule = selector.selectors[index].rule;
    rule.nestingOperator = null; // Needed if new pseudo’s are added that accepts commas (such as
    // `:lang(en, nl)`)

    /* c8 ignore else */

    if (!rule.pseudos || rule.pseudos.length !== 1 || rule.pseudos[0].name !== 'scope') {
      selector.selectors[index] = {
        type: 'ruleSet',
        rule: {
          type: 'rule',
          rule,
          // @ts-expect-error pseudos are fine w/ just a name!
          pseudos: [{
            name: 'scope'
          }]
        }
      };
    }
  }

  return selector;
}

/**
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').RuleAttr} RuleAttr
 * @typedef {import('./types.js').Node} Node
 */
const handle = zwitch('operator', {
  // @ts-expect-error: hush.
  unknown: unknownOperator,
  // @ts-expect-error: hush.
  invalid: exists,
  handlers: {
    // @ts-expect-error: hush.
    '=': exact,
    // @ts-expect-error: hush.
    '^=': begins,
    // @ts-expect-error: hush.
    '$=': ends,
    // @ts-expect-error: hush.
    '*=': containsString,
    // @ts-expect-error: hush.
    '~=': containsArray
  }
});
/**
 * @param {Rule} query
 * @param {Node} node
 */

function attribute$1(query, node) {
  let index = -1;

  while (++index < query.attrs.length) {
    if (!handle(query.attrs[index], node)) return false;
  }

  return true;
}
/**
 * `[attr]`
 *
 * @param {RuleAttr} query
 * @param {Node} node
 */

function exists(query, node) {
  // @ts-expect-error: Looks like a record.
  return node[query.name] !== null && node[query.name] !== undefined;
}
/**
 * `[attr=value]`
 *
 * @param {RuleAttr} query
 * @param {Node} node
 */


function exact(query, node) {
  // @ts-expect-error: Looks like a record.
  return exists(query, node) && String(node[query.name]) === query.value;
}
/**
 * `[attr~=value]`
 *
 * @param {RuleAttr} query
 * @param {Node} node
 */


function containsArray(query, node) {
  /** @type {unknown} */
  // @ts-expect-error: Looks like a record.
  const value = node[query.name];
  if (value === null || value === undefined) return false; // If this is an array, and the query is contained in it, return true.
  // Coverage comment in place because TS turns `Array.isArray(unknown)`
  // into `Array.<any>` instead of `Array.<unknown>`.
  // type-coverage:ignore-next-line

  if (Array.isArray(value) && value.includes(query.value)) {
    return true;
  } // For all other values, return whether this is an exact match.


  return String(value) === query.value;
}
/**
 * `[attr^=value]`
 *
 * @param {RuleAttr} query
 * @param {Node} node
 */


function begins(query, node) {
  /** @type {unknown} */
  // @ts-expect-error: Looks like a record.
  const value = node[query.name];
  return query.value && typeof value === 'string' && value.slice(0, query.value.length) === query.value;
}
/**
 * `[attr$=value]`
 *
 * @param {RuleAttr} query
 * @param {Node} node
 */


function ends(query, node) {
  /** @type {unknown} */
  // @ts-expect-error: Looks like a record.
  const value = node[query.name];
  return query.value && typeof value === 'string' && value.slice(-query.value.length) === query.value;
}
/**
 * `[attr*=value]`
 *
 * @param {RuleAttr} query
 * @param {Node} node
 */


function containsString(query, node) {
  /** @type {unknown} */
  // @ts-expect-error: Looks like a record.
  const value = node[query.name];
  return query.value && typeof value === 'string' && value.includes(query.value);
} // Shouldn’t be invoked, Parser throws an error instead.

/* c8 ignore next 6 */

/**
 * @param {{[x: string]: unknown, type: string}} query
 */


function unknownOperator(query) {
  throw new Error('Unknown operator `' + query.operator + '`');
}

/**
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').Node} Node
 */

/**
 * @param {Rule} query
 * @param {Node} node
 */
function name(query, node) {
  return query.tagName === '*' || query.tagName === node.type;
}

/**
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').Node} Node
 * @typedef {import('./types.js').Parent} Parent
 * @typedef {import('./types.js').SelectState} SelectState
 */
/**
 * @param {Rule} query
 * @param {Node} node
 * @param {number|null} index
 * @param {Parent|null} parent
 * @param {SelectState} state
 * @returns {boolean}
 */

function test(query, node, index, parent, state) {
  if (query.id) throw new Error('Invalid selector: id');
  if (query.classNames) throw new Error('Invalid selector: class');
  return Boolean(node && (!query.tagName || name(query, node)) && (!query.attrs || attribute$1(query, node)) && (!query.pseudos || pseudo(query, node, index, parent, state)));
}

/**
 * @typedef {import('./types.js').Selector} Selector
 * @typedef {import('./types.js').Selectors} Selectors
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').RuleSet} RuleSet
 * @typedef {import('./types.js').RulePseudo} RulePseudo
 * @typedef {import('./types.js').Query} Query
 * @typedef {import('./types.js').Node} Node
 * @typedef {import('./types.js').Parent} Parent
 * @typedef {import('./types.js').SelectIterator} SelectIterator
 * @typedef {import('./types.js').SelectState} SelectState
 */
const type = zwitch('type', {
  // @ts-expect-error: hush.
  unknown: unknownType,
  invalid: invalidType,
  // @ts-expect-error: hush.
  handlers: {
    selectors: selectors$1,
    ruleSet: ruleSet$1,
    rule: rule$1
  }
});
/**
 * @param {Selectors|RuleSet|Rule} query
 * @param {Node|undefined} node
 * @param {SelectState} state
 * @returns {Array.<Node>}
 */

function any$1(query, node, state) {
  // @ts-expect-error: fine.
  return query && node ? type(query, node, state) : [];
}
/**
 * @param {Selectors} query
 * @param {Node} node
 * @param {SelectState} state
 */

function selectors$1(query, node, state) {
  const collect = collector(state.one);
  let index = -1;

  while (++index < query.selectors.length) {
    collect(ruleSet$1(query.selectors[index], node, state));
  }

  return collect.result;
}
/**
 * @param {RuleSet} query
 * @param {Node} node
 * @param {SelectState} state
 */


function ruleSet$1(query, node, state) {
  return rule$1(query.rule, node, state);
}
/**
 * @param {Rule} query
 * @param {Node} tree
 * @param {SelectState} state
 */


function rule$1(query, tree, state) {
  const collect = collector(state.one);

  if (state.shallow && query.rule) {
    throw new Error('Expected selector without nesting');
  }

  nest(query, tree, 0, null, configure(query, {
    scopeNodes: root$2(tree) ? tree.children : [tree],
    index: false,
    iterator,
    one: state.one,
    shallow: state.shallow,
    any: state.any
  }));
  return collect.result;
  /** @type {SelectIterator} */

  function iterator(query, node, index, parent, state) {
    if (test(query, node, index, parent, state)) {
      if (query.rule) {
        nest(query.rule, node, index, parent, configure(query.rule, state));
      } else {
        collect(node);
        state.found = true;
      }
    }
  }
}
/**
 * @template {SelectState} S
 * @param {Rule} query
 * @param {S} state
 * @returns {S}
 */


function configure(query, state) {
  const pseudos = query.pseudos || [];
  let index = -1;

  while (++index < pseudos.length) {
    if (pseudo.needsIndex.includes(pseudos[index].name)) {
      state.index = true;
      break;
    }
  }

  return state;
} // Shouldn’t be invoked, all data is handled.

/* c8 ignore next 6 */

/**
 * @param {{[x: string]: unknown, type: string}} query
 */


function unknownType(query) {
  throw new Error('Unknown type `' + query.type + '`');
} // Shouldn’t be invoked, parser gives correct data.

/* c8 ignore next 3 */


function invalidType() {
  throw new Error('Invalid type');
}
/**
 * @param {boolean|undefined} one
 */


function collector(one) {
  /** @type {Array.<Node>} */
  const result = [];
  /** @type {boolean} */

  let found;
  collect.result = result;
  return collect;
  /**
   * Append nodes to array, filtering out duplicates.
   *
   * @param {Node|Array.<Node>} node
   */

  function collect(node) {
    let index = -1;

    if ('length' in node) {
      while (++index < node.length) {
        collectOne(node[index]);
      }
    } else {
      collectOne(node);
    }
  }
  /**
   * @param {Node} node
   */


  function collectOne(node) {
    if (one) {
      /* Shouldn’t happen, safeguards performance problems. */

      /* c8 ignore next */
      if (found) throw new Error('Cannot collect multiple nodes');
      found = true;
    }

    if (!result.includes(node)) result.push(node);
  }
}

var lib$2 = {};

var parserContext = {};

var utils$1 = {};

(function (exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function isIdentStart(c) {
    return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c === '-' || c === '_';
  }

  exports.isIdentStart = isIdentStart;

  function isIdent(c) {
    return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c === '-' || c === '_';
  }

  exports.isIdent = isIdent;

  function isHex(c) {
    return c >= 'a' && c <= 'f' || c >= 'A' && c <= 'F' || c >= '0' && c <= '9';
  }

  exports.isHex = isHex;

  function escapeIdentifier(s) {
    var len = s.length;
    var result = '';
    var i = 0;

    while (i < len) {
      var chr = s.charAt(i);

      if (exports.identSpecialChars[chr]) {
        result += '\\' + chr;
      } else {
        if (!(chr === '_' || chr === '-' || chr >= 'A' && chr <= 'Z' || chr >= 'a' && chr <= 'z' || i !== 0 && chr >= '0' && chr <= '9')) {
          var charCode = chr.charCodeAt(0);

          if ((charCode & 0xF800) === 0xD800) {
            var extraCharCode = s.charCodeAt(i++);

            if ((charCode & 0xFC00) !== 0xD800 || (extraCharCode & 0xFC00) !== 0xDC00) {
              throw Error('UCS-2(decode): illegal sequence');
            }

            charCode = ((charCode & 0x3FF) << 10) + (extraCharCode & 0x3FF) + 0x10000;
          }

          result += '\\' + charCode.toString(16) + ' ';
        } else {
          result += chr;
        }
      }

      i++;
    }

    return result;
  }

  exports.escapeIdentifier = escapeIdentifier;

  function escapeStr(s) {
    var len = s.length;
    var result = '';
    var i = 0;
    var replacement;

    while (i < len) {
      var chr = s.charAt(i);

      if (chr === '"') {
        chr = '\\"';
      } else if (chr === '\\') {
        chr = '\\\\';
      } else if ((replacement = exports.strReplacementsRev[chr]) !== undefined) {
        chr = replacement;
      }

      result += chr;
      i++;
    }

    return "\"" + result + "\"";
  }

  exports.escapeStr = escapeStr;
  exports.identSpecialChars = {
    '!': true,
    '"': true,
    '#': true,
    '$': true,
    '%': true,
    '&': true,
    '\'': true,
    '(': true,
    ')': true,
    '*': true,
    '+': true,
    ',': true,
    '.': true,
    '/': true,
    ';': true,
    '<': true,
    '=': true,
    '>': true,
    '?': true,
    '@': true,
    '[': true,
    '\\': true,
    ']': true,
    '^': true,
    '`': true,
    '{': true,
    '|': true,
    '}': true,
    '~': true
  };
  exports.strReplacementsRev = {
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\f': '\\f',
    '\v': '\\v'
  };
  exports.singleQuoteEscapeChars = {
    n: '\n',
    r: '\r',
    t: '\t',
    f: '\f',
    '\\': '\\',
    '\'': '\''
  };
  exports.doubleQuotesEscapeChars = {
    n: '\n',
    r: '\r',
    t: '\t',
    f: '\f',
    '\\': '\\',
    '"': '"'
  };
})(utils$1);

Object.defineProperty(parserContext, "__esModule", {
  value: true
});
var utils_1$1 = utils$1;

function parseCssSelector(str, pos, pseudos, attrEqualityMods, ruleNestingOperators, substitutesEnabled) {
  var l = str.length;
  var chr = '';

  function getStr(quote, escapeTable) {
    var result = '';
    pos++;
    chr = str.charAt(pos);

    while (pos < l) {
      if (chr === quote) {
        pos++;
        return result;
      } else if (chr === '\\') {
        pos++;
        chr = str.charAt(pos);
        var esc = void 0;

        if (chr === quote) {
          result += quote;
        } else if ((esc = escapeTable[chr]) !== undefined) {
          result += esc;
        } else if (utils_1$1.isHex(chr)) {
          var hex = chr;
          pos++;
          chr = str.charAt(pos);

          while (utils_1$1.isHex(chr)) {
            hex += chr;
            pos++;
            chr = str.charAt(pos);
          }

          if (chr === ' ') {
            pos++;
            chr = str.charAt(pos);
          }

          result += String.fromCharCode(parseInt(hex, 16));
          continue;
        } else {
          result += chr;
        }
      } else {
        result += chr;
      }

      pos++;
      chr = str.charAt(pos);
    }

    return result;
  }

  function getIdent() {
    var result = '';
    chr = str.charAt(pos);

    while (pos < l) {
      if (utils_1$1.isIdent(chr)) {
        result += chr;
      } else if (chr === '\\') {
        pos++;

        if (pos >= l) {
          throw Error('Expected symbol but end of file reached.');
        }

        chr = str.charAt(pos);

        if (utils_1$1.identSpecialChars[chr]) {
          result += chr;
        } else if (utils_1$1.isHex(chr)) {
          var hex = chr;
          pos++;
          chr = str.charAt(pos);

          while (utils_1$1.isHex(chr)) {
            hex += chr;
            pos++;
            chr = str.charAt(pos);
          }

          if (chr === ' ') {
            pos++;
            chr = str.charAt(pos);
          }

          result += String.fromCharCode(parseInt(hex, 16));
          continue;
        } else {
          result += chr;
        }
      } else {
        return result;
      }

      pos++;
      chr = str.charAt(pos);
    }

    return result;
  }

  function skipWhitespace() {
    chr = str.charAt(pos);
    var result = false;

    while (chr === ' ' || chr === "\t" || chr === "\n" || chr === "\r" || chr === "\f") {
      result = true;
      pos++;
      chr = str.charAt(pos);
    }

    return result;
  }

  function parse() {
    var res = parseSelector();

    if (pos < l) {
      throw Error('Rule expected but "' + str.charAt(pos) + '" found.');
    }

    return res;
  }

  function parseSelector() {
    var selector = parseSingleSelector();

    if (!selector) {
      return null;
    }

    var res = selector;
    chr = str.charAt(pos);

    while (chr === ',') {
      pos++;
      skipWhitespace();

      if (res.type !== 'selectors') {
        res = {
          type: 'selectors',
          selectors: [selector]
        };
      }

      selector = parseSingleSelector();

      if (!selector) {
        throw Error('Rule expected after ",".');
      }

      res.selectors.push(selector);
    }

    return res;
  }

  function parseSingleSelector() {
    skipWhitespace();
    var selector = {
      type: 'ruleSet'
    };
    var rule = parseRule();

    if (!rule) {
      return null;
    }

    var currentRule = selector;

    while (rule) {
      rule.type = 'rule';
      currentRule.rule = rule;
      currentRule = rule;
      skipWhitespace();
      chr = str.charAt(pos);

      if (pos >= l || chr === ',' || chr === ')') {
        break;
      }

      if (ruleNestingOperators[chr]) {
        var op = chr;
        pos++;
        skipWhitespace();
        rule = parseRule();

        if (!rule) {
          throw Error('Rule expected after "' + op + '".');
        }

        rule.nestingOperator = op;
      } else {
        rule = parseRule();

        if (rule) {
          rule.nestingOperator = null;
        }
      }
    }

    return selector;
  } // @ts-ignore no-overlap


  function parseRule() {
    var rule = null;

    while (pos < l) {
      chr = str.charAt(pos);

      if (chr === '*') {
        pos++;
        (rule = rule || {}).tagName = '*';
      } else if (utils_1$1.isIdentStart(chr) || chr === '\\') {
        (rule = rule || {}).tagName = getIdent();
      } else if (chr === '.') {
        pos++;
        rule = rule || {};
        (rule.classNames = rule.classNames || []).push(getIdent());
      } else if (chr === '#') {
        pos++;
        (rule = rule || {}).id = getIdent();
      } else if (chr === '[') {
        pos++;
        skipWhitespace();
        var attr = {
          name: getIdent()
        };
        skipWhitespace(); // @ts-ignore

        if (chr === ']') {
          pos++;
        } else {
          var operator = '';

          if (attrEqualityMods[chr]) {
            operator = chr;
            pos++;
            chr = str.charAt(pos);
          }

          if (pos >= l) {
            throw Error('Expected "=" but end of file reached.');
          }

          if (chr !== '=') {
            throw Error('Expected "=" but "' + chr + '" found.');
          }

          attr.operator = operator + '=';
          pos++;
          skipWhitespace();
          var attrValue = '';
          attr.valueType = 'string'; // @ts-ignore

          if (chr === '"') {
            attrValue = getStr('"', utils_1$1.doubleQuotesEscapeChars); // @ts-ignore
          } else if (chr === '\'') {
            attrValue = getStr('\'', utils_1$1.singleQuoteEscapeChars); // @ts-ignore
          } else if (substitutesEnabled && chr === '$') {
            pos++;
            attrValue = getIdent();
            attr.valueType = 'substitute';
          } else {
            while (pos < l) {
              if (chr === ']') {
                break;
              }

              attrValue += chr;
              pos++;
              chr = str.charAt(pos);
            }

            attrValue = attrValue.trim();
          }

          skipWhitespace();

          if (pos >= l) {
            throw Error('Expected "]" but end of file reached.');
          }

          if (chr !== ']') {
            throw Error('Expected "]" but "' + chr + '" found.');
          }

          pos++;
          attr.value = attrValue;
        }

        rule = rule || {};
        (rule.attrs = rule.attrs || []).push(attr);
      } else if (chr === ':') {
        pos++;
        var pseudoName = getIdent();
        var pseudo = {
          name: pseudoName
        }; // @ts-ignore

        if (chr === '(') {
          pos++;
          var value = '';
          skipWhitespace();

          if (pseudos[pseudoName] === 'selector') {
            pseudo.valueType = 'selector';
            value = parseSelector();
          } else {
            pseudo.valueType = pseudos[pseudoName] || 'string'; // @ts-ignore

            if (chr === '"') {
              value = getStr('"', utils_1$1.doubleQuotesEscapeChars); // @ts-ignore
            } else if (chr === '\'') {
              value = getStr('\'', utils_1$1.singleQuoteEscapeChars); // @ts-ignore
            } else if (substitutesEnabled && chr === '$') {
              pos++;
              value = getIdent();
              pseudo.valueType = 'substitute';
            } else {
              while (pos < l) {
                if (chr === ')') {
                  break;
                }

                value += chr;
                pos++;
                chr = str.charAt(pos);
              }

              value = value.trim();
            }

            skipWhitespace();
          }

          if (pos >= l) {
            throw Error('Expected ")" but end of file reached.');
          }

          if (chr !== ')') {
            throw Error('Expected ")" but "' + chr + '" found.');
          }

          pos++;
          pseudo.value = value;
        }

        rule = rule || {};
        (rule.pseudos = rule.pseudos || []).push(pseudo);
      } else {
        break;
      }
    }

    return rule;
  }

  return parse();
}

parserContext.parseCssSelector = parseCssSelector;

var render = {};

Object.defineProperty(render, "__esModule", {
  value: true
});
var utils_1 = utils$1;

function renderEntity(entity) {
  var res = '';

  switch (entity.type) {
    case 'ruleSet':
      var currentEntity = entity.rule;
      var parts = [];

      while (currentEntity) {
        if (currentEntity.nestingOperator) {
          parts.push(currentEntity.nestingOperator);
        }

        parts.push(renderEntity(currentEntity));
        currentEntity = currentEntity.rule;
      }

      res = parts.join(' ');
      break;

    case 'selectors':
      res = entity.selectors.map(renderEntity).join(', ');
      break;

    case 'rule':
      if (entity.tagName) {
        if (entity.tagName === '*') {
          res = '*';
        } else {
          res = utils_1.escapeIdentifier(entity.tagName);
        }
      }

      if (entity.id) {
        res += "#" + utils_1.escapeIdentifier(entity.id);
      }

      if (entity.classNames) {
        res += entity.classNames.map(function (cn) {
          return "." + utils_1.escapeIdentifier(cn);
        }).join('');
      }

      if (entity.attrs) {
        res += entity.attrs.map(function (attr) {
          if ('operator' in attr) {
            if (attr.valueType === 'substitute') {
              return "[" + utils_1.escapeIdentifier(attr.name) + attr.operator + "$" + attr.value + "]";
            } else {
              return "[" + utils_1.escapeIdentifier(attr.name) + attr.operator + utils_1.escapeStr(attr.value) + "]";
            }
          } else {
            return "[" + utils_1.escapeIdentifier(attr.name) + "]";
          }
        }).join('');
      }

      if (entity.pseudos) {
        res += entity.pseudos.map(function (pseudo) {
          if (pseudo.valueType) {
            if (pseudo.valueType === 'selector') {
              return ":" + utils_1.escapeIdentifier(pseudo.name) + "(" + renderEntity(pseudo.value) + ")";
            } else if (pseudo.valueType === 'substitute') {
              return ":" + utils_1.escapeIdentifier(pseudo.name) + "($" + pseudo.value + ")";
            } else if (pseudo.valueType === 'numeric') {
              return ":" + utils_1.escapeIdentifier(pseudo.name) + "(" + pseudo.value + ")";
            } else {
              return ":" + utils_1.escapeIdentifier(pseudo.name) + "(" + utils_1.escapeIdentifier(pseudo.value) + ")";
            }
          } else {
            return ":" + utils_1.escapeIdentifier(pseudo.name);
          }
        }).join('');
      }

      break;

    default:
      throw Error('Unknown entity type: "' + entity.type + '".');
  }

  return res;
}

render.renderEntity = renderEntity;

Object.defineProperty(lib$2, "__esModule", {
  value: true
});
var parser_context_1 = parserContext;
var render_1 = render;

var CssSelectorParser =
/** @class */
function () {
  function CssSelectorParser() {
    this.pseudos = {};
    this.attrEqualityMods = {};
    this.ruleNestingOperators = {};
    this.substitutesEnabled = false;
  }

  CssSelectorParser.prototype.registerSelectorPseudos = function () {
    var pseudos = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      pseudos[_i] = arguments[_i];
    }

    for (var _a = 0, pseudos_1 = pseudos; _a < pseudos_1.length; _a++) {
      var pseudo = pseudos_1[_a];
      this.pseudos[pseudo] = 'selector';
    }

    return this;
  };

  CssSelectorParser.prototype.unregisterSelectorPseudos = function () {
    var pseudos = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      pseudos[_i] = arguments[_i];
    }

    for (var _a = 0, pseudos_2 = pseudos; _a < pseudos_2.length; _a++) {
      var pseudo = pseudos_2[_a];
      delete this.pseudos[pseudo];
    }

    return this;
  };

  CssSelectorParser.prototype.registerNumericPseudos = function () {
    var pseudos = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      pseudos[_i] = arguments[_i];
    }

    for (var _a = 0, pseudos_3 = pseudos; _a < pseudos_3.length; _a++) {
      var pseudo = pseudos_3[_a];
      this.pseudos[pseudo] = 'numeric';
    }

    return this;
  };

  CssSelectorParser.prototype.unregisterNumericPseudos = function () {
    var pseudos = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      pseudos[_i] = arguments[_i];
    }

    for (var _a = 0, pseudos_4 = pseudos; _a < pseudos_4.length; _a++) {
      var pseudo = pseudos_4[_a];
      delete this.pseudos[pseudo];
    }

    return this;
  };

  CssSelectorParser.prototype.registerNestingOperators = function () {
    var operators = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      operators[_i] = arguments[_i];
    }

    for (var _a = 0, operators_1 = operators; _a < operators_1.length; _a++) {
      var operator = operators_1[_a];
      this.ruleNestingOperators[operator] = true;
    }

    return this;
  };

  CssSelectorParser.prototype.unregisterNestingOperators = function () {
    var operators = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      operators[_i] = arguments[_i];
    }

    for (var _a = 0, operators_2 = operators; _a < operators_2.length; _a++) {
      var operator = operators_2[_a];
      delete this.ruleNestingOperators[operator];
    }

    return this;
  };

  CssSelectorParser.prototype.registerAttrEqualityMods = function () {
    var mods = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      mods[_i] = arguments[_i];
    }

    for (var _a = 0, mods_1 = mods; _a < mods_1.length; _a++) {
      var mod = mods_1[_a];
      this.attrEqualityMods[mod] = true;
    }

    return this;
  };

  CssSelectorParser.prototype.unregisterAttrEqualityMods = function () {
    var mods = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      mods[_i] = arguments[_i];
    }

    for (var _a = 0, mods_2 = mods; _a < mods_2.length; _a++) {
      var mod = mods_2[_a];
      delete this.attrEqualityMods[mod];
    }

    return this;
  };

  CssSelectorParser.prototype.enableSubstitutes = function () {
    this.substitutesEnabled = true;
    return this;
  };

  CssSelectorParser.prototype.disableSubstitutes = function () {
    this.substitutesEnabled = false;
    return this;
  };

  CssSelectorParser.prototype.parse = function (str) {
    return parser_context_1.parseCssSelector(str, 0, this.pseudos, this.attrEqualityMods, this.ruleNestingOperators, this.substitutesEnabled);
  };

  CssSelectorParser.prototype.render = function (path) {
    return render_1.renderEntity(path).trim();
  };

  return CssSelectorParser;
}();

var CssSelectorParser_1 = lib$2.CssSelectorParser = CssSelectorParser;

var lib$1 = {};

var parse$2 = {};

Object.defineProperty(parse$2, "__esModule", {
  value: true
});
parse$2.parse = void 0; // Whitespace as per https://www.w3.org/TR/selectors-3/#lex is " \t\r\n\f"

var whitespace$1 = new Set([9, 10, 12, 13, 32]);
var ZERO = "0".charCodeAt(0);
var NINE = "9".charCodeAt(0);
/**
 * Parses an expression.
 *
 * @throws An `Error` if parsing fails.
 * @returns An array containing the integer step size and the integer offset of the nth rule.
 * @example nthCheck.parse("2n+3"); // returns [2, 3]
 */

function parse$1(formula) {
  formula = formula.trim().toLowerCase();

  if (formula === "even") {
    return [2, 0];
  } else if (formula === "odd") {
    return [2, 1];
  } // Parse [ ['-'|'+']? INTEGER? {N} [ S* ['-'|'+'] S* INTEGER ]?


  var idx = 0;
  var a = 0;
  var sign = readSign();
  var number = readNumber();

  if (idx < formula.length && formula.charAt(idx) === "n") {
    idx++;
    a = sign * (number !== null && number !== void 0 ? number : 1);
    skipWhitespace();

    if (idx < formula.length) {
      sign = readSign();
      skipWhitespace();
      number = readNumber();
    } else {
      sign = number = 0;
    }
  } // Throw if there is anything else


  if (number === null || idx < formula.length) {
    throw new Error("n-th rule couldn't be parsed ('" + formula + "')");
  }

  return [a, sign * number];

  function readSign() {
    if (formula.charAt(idx) === "-") {
      idx++;
      return -1;
    }

    if (formula.charAt(idx) === "+") {
      idx++;
    }

    return 1;
  }

  function readNumber() {
    var start = idx;
    var value = 0;

    while (idx < formula.length && formula.charCodeAt(idx) >= ZERO && formula.charCodeAt(idx) <= NINE) {
      value = value * 10 + (formula.charCodeAt(idx) - ZERO);
      idx++;
    } // Return `null` if we didn't read anything.


    return idx === start ? null : value;
  }

  function skipWhitespace() {
    while (idx < formula.length && whitespace$1.has(formula.charCodeAt(idx))) {
      idx++;
    }
  }
}

parse$2.parse = parse$1;

var compile$3 = {};

var boolbase = {
  trueFunc: function trueFunc() {
    return true;
  },
  falseFunc: function falseFunc() {
    return false;
  }
};

Object.defineProperty(compile$3, "__esModule", {
  value: true
});
compile$3.compile = void 0;
var boolbase_1 = boolbase;
/**
 * Returns a function that checks if an elements index matches the given rule
 * highly optimized to return the fastest solution.
 *
 * @param parsed A tuple [a, b], as returned by `parse`.
 * @returns A highly optimized function that returns whether an index matches the nth-check.
 * @example
 * const check = nthCheck.compile([2, 3]);
 *
 * check(0); // `false`
 * check(1); // `false`
 * check(2); // `true`
 * check(3); // `false`
 * check(4); // `true`
 * check(5); // `false`
 * check(6); // `true`
 */

function compile$2(parsed) {
  var a = parsed[0]; // Subtract 1 from `b`, to convert from one- to zero-indexed.

  var b = parsed[1] - 1;
  /*
   * When `b <= 0`, `a * n` won't be lead to any matches for `a < 0`.
   * Besides, the specification states that no elements are
   * matched when `a` and `b` are 0.
   *
   * `b < 0` here as we subtracted 1 from `b` above.
   */

  if (b < 0 && a <= 0) return boolbase_1.falseFunc; // When `a` is in the range -1..1, it matches any element (so only `b` is checked).

  if (a === -1) return function (index) {
    return index <= b;
  };
  if (a === 0) return function (index) {
    return index === b;
  }; // When `b <= 0` and `a === 1`, they match any element.

  if (a === 1) return b < 0 ? boolbase_1.trueFunc : function (index) {
    return index >= b;
  };
  /*
   * Otherwise, modulo can be used to check if there is a match.
   *
   * Modulo doesn't care about the sign, so let's use `a`s absolute value.
   */

  var absA = Math.abs(a); // Get `b mod a`, + a if this is negative.

  var bMod = (b % absA + absA) % absA;
  return a > 1 ? function (index) {
    return index >= b && index % absA === bMod;
  } : function (index) {
    return index <= b && index % absA === bMod;
  };
}

compile$3.compile = compile$2;

(function (exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.compile = exports.parse = void 0;
  var parse_1 = parse$2;
  Object.defineProperty(exports, "parse", {
    enumerable: true,
    get: function () {
      return parse_1.parse;
    }
  });
  var compile_1 = compile$3;
  Object.defineProperty(exports, "compile", {
    enumerable: true,
    get: function () {
      return compile_1.compile;
    }
  });
  /**
   * Parses and compiles a formula to a highly optimized function.
   * Combination of `parse` and `compile`.
   *
   * If the formula doesn't match any elements,
   * it returns [`boolbase`](https://github.com/fb55/boolbase)'s `falseFunc`.
   * Otherwise, a function accepting an _index_ is returned, which returns
   * whether or not the passed _index_ matches the formula.
   *
   * Note: The nth-rule starts counting at `1`, the returned function at `0`.
   *
   * @param formula The formula to compile.
   * @example
   * const check = nthCheck("2n+3");
   *
   * check(0); // `false`
   * check(1); // `false`
   * check(2); // `true`
   * check(3); // `false`
   * check(4); // `true`
   * check(5); // `false`
   * check(6); // `true`
   */

  function nthCheck(formula) {
    return (0, compile_1.compile)((0, parse_1.parse)(formula));
  }

  exports.default = nthCheck;
})(lib$1);

var fauxEsmNthCheck = /*@__PURE__*/getDefaultExportFromCjs(lib$1);

/**
 * @typedef {import('./types.js').Selector} Selector
 * @typedef {import('./types.js').Selectors} Selectors
 * @typedef {import('./types.js').RuleSet} RuleSet
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').RulePseudo} RulePseudo
 * @typedef {import('./types.js').RulePseudoNth} RulePseudoNth
 */
/** @type {import('nth-check').default} */
// @ts-expect-error

const nthCheck = fauxEsmNthCheck.default;
const nth = new Set(['nth-child', 'nth-last-child', 'nth-of-type', 'nth-last-of-type']);
const parser = new CssSelectorParser_1();
parser.registerAttrEqualityMods('~', '^', '$', '*');
parser.registerSelectorPseudos('any', 'matches', 'not', 'has');
parser.registerNestingOperators('>', '+', '~'); // @ts-expect-error: hush.

const compile$1 = zwitch('type', {
  handlers: {
    selectors,
    ruleSet,
    rule
  }
});
/**
 * @param {string} selector
 * @returns {Selector}
 */

function parse(selector) {
  if (typeof selector !== 'string') {
    throw new TypeError('Expected `string` as selector, not `' + selector + '`');
  } // @ts-expect-error types are wrong.


  return compile$1(parser.parse(selector));
}
/**
 * @param {Selectors} query
 */

function selectors(query) {
  const selectors = query.selectors;
  let index = -1;

  while (++index < selectors.length) {
    compile$1(selectors[index]);
  }

  return query;
}
/**
 * @param {RuleSet} query
 */


function ruleSet(query) {
  return rule(query.rule);
}
/**
 * @param {Rule} query
 */


function rule(query) {
  const pseudos = query.pseudos || [];
  let index = -1;
  /** @type {RulePseudo|RulePseudoNth} */

  let pseudo;

  while (++index < pseudos.length) {
    pseudo = pseudos[index];

    if (nth.has(pseudo.name)) {
      // @ts-expect-error Patch a non-primitive type.
      pseudo.value = nthCheck(pseudo.value); // @ts-expect-error Patch a non-primitive type.

      pseudo.valueType = 'function';
    }
  }

  compile$1(query.rule);
  return query;
}

/**
 * @typedef {import('unist').Node} Node
 */
/**
 * @param {string} selector
 * @param {Node} [node]
 * @returns {Node|null}
 */

function select(selector, node) {
  return any$1(parse(selector), node, {
    one: true,
    any: any$1
  })[0] || null;
}
/**
 * @param {string} selector
 * @param {Node} [node]
 * @returns {Array.<Node>}
 */

function selectAll(selector, node) {
  return any$1(parse(selector), node, {
    any: any$1
  });
}

const NUMBERED_CLASS = /^numbered$/;
const ALIGN_CLASS = /(?:(?:align-)|^)(left|right|center)/;
function getClassName(token, exclude) {
    var _a, _b, _c;
    const allClasses = new Set([
        // Grab the trimmed classes from the token
        ...((_a = token.attrGet('class')) !== null && _a !== void 0 ? _a : '')
            .split(' ')
            .map((c) => c.trim())
            .filter((c) => c),
        // Add any from the meta information (these are often repeated)
        ...((_c = (_b = token.meta) === null || _b === void 0 ? void 0 : _b.class) !== null && _c !== void 0 ? _c : []),
    ]);
    const className = [...allClasses].join(' ');
    if (!className)
        return undefined;
    return (className
        .split(' ')
        .map((c) => c.trim())
        .filter((c) => {
        if (!c)
            return false;
        if (!exclude)
            return true;
        return !exclude.reduce((doExclude, test) => doExclude || !!c.match(test), false);
    })
        .join(' ') || undefined);
}
function hasClassName(token, matcher) {
    const className = getClassName(token);
    if (!className)
        return false;
    const matches = className
        .split(' ')
        .map((c) => c.match(matcher))
        .filter((c) => c);
    if (matches.length === 0)
        return false;
    return matches[0];
}
function getLang(t) {
    return he.decode(t.info).trim().split(' ')[0].replace('\\', '');
}
function getColAlign(t) {
    var _a;
    if ((_a = t.attrs) === null || _a === void 0 ? void 0 : _a.length) {
        for (const attrPair of t.attrs) {
            if (attrPair[0] === 'style') {
                const match = attrPair[1].match(/text-align:(left|right|center)/);
                if (match) {
                    return match[1];
                }
            }
        }
    }
}
const defaultMdast = {
    heading: {
        type: 'heading',
        getAttrs(token) {
            return { depth: Number(token.tag[1]) };
        },
    },
    hr: {
        type: 'thematicBreak',
        noCloseToken: true,
        isLeaf: true,
    },
    paragraph: {
        type: 'paragraph',
    },
    blockquote: {
        type: 'blockquote',
    },
    ordered_list: {
        type: 'list',
        getAttrs(token, tokens, index) {
            var _a, _b;
            const info = (_a = tokens[index + 1]) === null || _a === void 0 ? void 0 : _a.info;
            const start = Number((_b = tokens[index + 1]) === null || _b === void 0 ? void 0 : _b.info);
            return {
                ordered: true,
                start: isNaN(start) || !info ? 1 : start,
                spread: false,
            };
        },
    },
    bullet_list: {
        type: 'list',
        attrs: {
            ordered: false,
            spread: false,
        },
    },
    list_item: {
        type: 'listItem',
        attrs: {
            spread: true,
        },
    },
    em: {
        type: 'emphasis',
    },
    strong: {
        type: 'strong',
    },
    fence: {
        type: 'code',
        isLeaf: true,
        getAttrs(t) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const name = ((_a = t.meta) === null || _a === void 0 ? void 0 : _a.name) || undefined;
            const showLineNumbers = !!(((_b = t.meta) === null || _b === void 0 ? void 0 : _b.linenos) ||
                ((_c = t.meta) === null || _c === void 0 ? void 0 : _c.linenos) === null || // Weird docutils implementation
                ((_d = t.meta) === null || _d === void 0 ? void 0 : _d['number-lines']));
            const lineno = (_f = (_e = t.meta) === null || _e === void 0 ? void 0 : _e['lineno-start']) !== null && _f !== void 0 ? _f : (_g = t.meta) === null || _g === void 0 ? void 0 : _g['number-lines'];
            const startingLineNumber = lineno && lineno !== 1 && !isNaN(Number(lineno)) ? Number(lineno) : undefined;
            const emphasizeLines = ((_h = t.meta) === null || _h === void 0 ? void 0 : _h['emphasize-lines'])
                ? (_j = t.meta) === null || _j === void 0 ? void 0 : _j['emphasize-lines'].split(',').map((n) => Number(n.trim())).filter((n) => !isNaN(n) && n > 0)
                : undefined;
            return Object.assign(Object.assign({ lang: getLang(t) }, normalizeLabel(name)), { class: getClassName(t), showLineNumbers: showLineNumbers || undefined, startingLineNumber: showLineNumbers ? startingLineNumber : undefined, // Only if showing line numbers!
                emphasizeLines, value: withoutTrailingNewline(t.content) });
        },
    },
    code_block: {
        type: 'code',
        isLeaf: true,
        getAttrs(t) {
            return { lang: getLang(t), value: withoutTrailingNewline(t.content) };
        },
    },
    code_inline: {
        type: 'inlineCode',
        noCloseToken: true,
        isText: true,
    },
    hardbreak: {
        type: 'break',
        noCloseToken: true,
        isLeaf: true,
    },
    link: {
        type: 'link',
        getAttrs(token) {
            var _a;
            return {
                url: token.attrGet('href'),
                title: (_a = token.attrGet('title')) !== null && _a !== void 0 ? _a : undefined,
            };
        },
    },
    image: {
        type: 'image',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(token) {
            var _a;
            const alt = token.attrGet('alt') || ((_a = token.children) === null || _a === void 0 ? void 0 : _a.reduce((i, t) => i + (t === null || t === void 0 ? void 0 : t.content), ''));
            const alignMatch = hasClassName(token, ALIGN_CLASS);
            const align = alignMatch ? alignMatch[1] : undefined;
            return {
                url: token.attrGet('src'),
                alt: alt || undefined,
                title: token.attrGet('title') || undefined,
                class: getClassName(token, [ALIGN_CLASS]),
                width: token.attrGet('width') || undefined,
                align,
            };
        },
    },
    abbr: {
        type: 'abbreviation',
        getAttrs(token) {
            var _a, _b, _c;
            const value = (_b = (_a = token.children) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content;
            return {
                title: (_c = token.attrGet('title')) !== null && _c !== void 0 ? _c : undefined,
                value,
            };
        },
    },
    sub: {
        type: 'subscript',
    },
    sup: {
        type: 'superscript',
    },
    dl: {
        type: 'definitionList',
    },
    dt: {
        type: 'definitionTerm',
    },
    dd: {
        type: 'definitionDescription',
    },
    admonition: {
        type: 'admonition',
        getAttrs(token) {
            var _a;
            const kind = ((_a = token.meta) === null || _a === void 0 ? void 0 : _a.kind) || undefined;
            return {
                kind,
                class: getClassName(token, [new RegExp(`admonition|${kind}`)]),
            };
        },
    },
    admonition_title: {
        type: 'admonitionTitle',
    },
    figure: {
        type: 'container',
        getAttrs(token) {
            var _a;
            const name = ((_a = token.meta) === null || _a === void 0 ? void 0 : _a.name) || undefined;
            return Object.assign(Object.assign({ kind: 'figure' }, normalizeLabel(name)), { numbered: name ? true : undefined, class: getClassName(token, [NUMBERED_CLASS]) });
        },
    },
    figure_caption: {
        type: 'caption',
    },
    table: {
        type: 'table',
        getAttrs(token) {
            var _a, _b;
            const name = ((_a = token.meta) === null || _a === void 0 ? void 0 : _a.name) || undefined;
            return Object.assign(Object.assign({ kind: undefined }, normalizeLabel(name)), { numbered: name ? true : undefined, class: getClassName(token, [NUMBERED_CLASS, ALIGN_CLASS]), align: ((_b = token.meta) === null || _b === void 0 ? void 0 : _b.align) || undefined });
        },
    },
    table_caption: {
        type: 'caption',
    },
    thead: {
        type: '_lift',
    },
    tbody: {
        type: '_lift',
    },
    tr: {
        type: 'tableRow',
    },
    th: {
        type: 'tableCell',
        getAttrs(t) {
            return { header: true, align: getColAlign(t) || undefined };
        },
    },
    td: {
        type: 'tableCell',
        getAttrs(t) {
            return { align: getColAlign(t) || undefined };
        },
    },
    math_inline: {
        type: 'inlineMath',
        noCloseToken: true,
        isText: true,
    },
    math_inline_double: {
        type: 'math',
        noCloseToken: true,
        isText: true,
    },
    math_block: {
        type: 'math',
        noCloseToken: true,
        isText: true,
        getAttrs(t) {
            const name = t.info || undefined;
            return Object.assign({}, normalizeLabel(name));
        },
    },
    math_block_label: {
        type: 'math',
        noCloseToken: true,
        isText: true,
        getAttrs(t) {
            const name = t.info || undefined;
            return Object.assign({}, normalizeLabel(name));
        },
    },
    amsmath: {
        type: 'math',
        noCloseToken: true,
        isText: true,
    },
    ref: {
        type: 'contentReference',
        isLeaf: true,
        getAttrs(t) {
            var _a, _b, _c;
            return Object.assign(Object.assign({ kind: (_a = t.meta) === null || _a === void 0 ? void 0 : _a.kind }, normalizeLabel((_b = t.meta) === null || _b === void 0 ? void 0 : _b.label)), { value: ((_c = t.meta) === null || _c === void 0 ? void 0 : _c.value) || undefined });
        },
    },
    footnote_ref: {
        type: 'footnoteReference',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            var _a;
            return Object.assign({}, normalizeLabel((_a = t === null || t === void 0 ? void 0 : t.meta) === null || _a === void 0 ? void 0 : _a.label));
        },
    },
    footnote_anchor: {
        type: '_remove',
        noCloseToken: true,
    },
    footnote_block: {
        // The footnote block is a view concern, not AST
        // Lift footnotes out of the tree
        type: '_lift',
    },
    footnote: {
        type: 'footnoteDefinition',
        getAttrs(t) {
            var _a;
            return Object.assign({}, normalizeLabel((_a = t === null || t === void 0 ? void 0 : t.meta) === null || _a === void 0 ? void 0 : _a.label));
        },
    },
    directive: {
        type: 'directive',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            var _a;
            return {
                kind: t.info,
                args: ((_a = t === null || t === void 0 ? void 0 : t.meta) === null || _a === void 0 ? void 0 : _a.arg) || undefined,
                value: t.content.trim(),
            };
        },
    },
    directive_error: {
        type: 'directiveError',
        noCloseToken: true,
    },
    role: {
        type: 'role',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            var _a;
            return {
                kind: (_a = t.meta) === null || _a === void 0 ? void 0 : _a.name,
                value: t.content,
            };
        },
    },
    role_error: {
        type: 'roleError',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            return {
                value: t.content,
            };
        },
    },
    myst_target: {
        type: '_headerTarget',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            return Object.assign({}, normalizeLabel(t.content));
        },
    },
    html_inline: {
        type: 'html',
        noCloseToken: true,
        isText: true,
    },
    html_block: {
        type: 'html',
        noCloseToken: true,
        isText: true,
    },
    myst_block_break: {
        type: 'block',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            return {
                meta: t.content || undefined,
            };
        },
    },
    myst_line_comment: {
        type: 'comment',
        noCloseToken: true,
        isLeaf: true,
        getAttrs(t) {
            return {
                value: t.content.trim() || undefined,
            };
        },
    },
};
function hoistSingleImagesOutofParagraphs(tree) {
    // Hoist up all paragraphs with a single image
    visit$1(tree, 'paragraph', (node) => {
        var _a, _b;
        if (!(((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) === 1 && ((_b = node.children) === null || _b === void 0 ? void 0 : _b[0].type) === 'image'))
            return;
        const child = node.children[0];
        Object.keys(node).forEach((k) => {
            delete node[k];
        });
        Object.assign(node, child);
    });
}
const defaultOptions$3 = {
    handlers: defaultMdast,
    hoistSingleImagesOutofParagraphs: true,
    nestBlocks: true,
};
function tokensToMyst(tokens, options = defaultOptions$3) {
    var _a;
    const opts = Object.assign(Object.assign(Object.assign({}, defaultOptions$3), options), { handlers: Object.assign(Object.assign({}, defaultOptions$3.handlers), options === null || options === void 0 ? void 0 : options.handlers) });
    const state = new MarkdownParseState(opts.handlers);
    state.parseTokens(tokens);
    let tree;
    do {
        tree = state.closeNode();
    } while (state.stack.length);
    // Remove all redundant nodes marked for removal
    remove(tree, '_remove');
    // Lift up all nodes that are named "lift"
    tree = map(tree, (node) => {
        var _a, _b;
        const children = (_b = (_a = node.children) === null || _a === void 0 ? void 0 : _a.map((child) => {
            if (child.type === '_lift' && child.children)
                return child.children;
            return child;
        })) === null || _b === void 0 ? void 0 : _b.flat();
        node.children = children;
        return node;
    });
    // Remove unnecessary admonition titles from AST
    // These are up to the serializer to put in
    visit$1(tree, 'admonition', (node) => {
        var _a, _b;
        const { kind, children } = node;
        if (!kind || !children || kind === AdmonitionKind.admonition)
            return;
        const expectedTitle = admonitionKindToTitle(kind);
        const titleNode = children[0];
        if (titleNode.type === 'admonitionTitle' &&
            ((_b = (_a = titleNode.children) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) === expectedTitle)
            node.children = children.slice(1);
    });
    // Move contentReference text value to children
    visit$1(tree, 'contentReference', (node) => {
        delete node.children;
        if (node.value) {
            setTextAsChild(node, node.value);
            delete node.value;
        }
    });
    // Add target values as identifiers to subsequent node
    visit$1(tree, '_headerTarget', (node) => {
        const nextNode = findAfter(tree, node);
        if (nextNode) {
            nextNode.identifier = node.identifier;
            nextNode.label = node.label;
        }
    });
    remove(tree, '_headerTarget');
    // Nest block content inside of a block
    if (opts.nestBlocks) {
        const newTree = u('root', []);
        let lastBlock;
        const pushBlock = () => {
            var _a;
            if (!lastBlock)
                return;
            if (((_a = lastBlock.children) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                delete lastBlock.children;
            }
            newTree.children.push(lastBlock);
        };
        (_a = tree.children) === null || _a === void 0 ? void 0 : _a.map((node) => {
            var _a, _b;
            if (node.type === 'block') {
                pushBlock();
                lastBlock = node;
                node.children = (_a = node.children) !== null && _a !== void 0 ? _a : [];
                return;
            }
            const stack = lastBlock ? lastBlock : newTree;
            (_b = stack.children) === null || _b === void 0 ? void 0 : _b.push(node);
        });
        pushBlock();
        tree = newTree;
    }
    // Ensure caption content is nested in a paragraph
    visit$1(tree, 'caption', (node) => {
        if (node.children && node.children[0].type !== 'paragraph') {
            node.children = [{ type: 'paragraph', children: node.children }];
        }
    });
    // Replace "table node with caption" with "figure node with table and caption"
    // TODO: Clean up when we update to typescript > 4.6.2 and we have access to
    //       parent in visitor function.
    //       i.e. visit(tree, 'table', (node, index parent) => {...})
    //       https://github.com/microsoft/TypeScript/issues/46900
    selectAll('table', tree).map((node) => {
        var _a, _b;
        const captionChildren = (_a = node.children) === null || _a === void 0 ? void 0 : _a.filter((n) => n.type === 'caption');
        if (captionChildren === null || captionChildren === void 0 ? void 0 : captionChildren.length) {
            const tableChildren = (_b = node.children) === null || _b === void 0 ? void 0 : _b.filter((n) => n.type !== 'caption');
            const newTableNode = {
                type: 'table',
                align: node.align,
                children: tableChildren,
            };
            node.type = 'container';
            node.kind = 'table';
            node.children = [...captionChildren, newTableNode];
            delete node.align;
        }
    });
    if (opts.hoistSingleImagesOutofParagraphs)
        hoistSingleImagesOutofParagraphs(tree);
    return tree;
}

function escapeStringRegexp(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  } // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.


  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

/**
 * @param {string} d
 * @returns {string}
 */
function color$1(d) {
  return d;
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 */
/**
 * Continue traversing as normal
 */

const CONTINUE$1 = true;
/**
 * Do not traverse this node’s children
 */

const SKIP$1 = 'skip';
/**
 * Stop traversing immediately
 */

const EXIT$1 = false;
const visitParents$1 =
/**
 * @type {(
 *   (<T extends Node>(tree: Node, test: T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>|Array.<T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>>, visitor: Visitor<T>, reverse?: boolean) => void) &
 *   ((tree: Node, test: Test, visitor: Visitor<Node>, reverse?: boolean) => void) &
 *   ((tree: Node, visitor: Visitor<Node>, reverse?: boolean) => void)
 * )}
 */

/**
 * Visit children of tree which pass a test
 *
 * @param {Node} tree Abstract syntax tree to walk
 * @param {Test} test test Test node
 * @param {Visitor<Node>} visitor Function to run for each node
 * @param {boolean} [reverse] Fisit the tree in reverse, defaults to false
 */
function (tree, test, visitor, reverse) {
  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor; // @ts-ignore no visitor given, so `visitor` is test.

    visitor = test;
    test = null;
  }

  var is = convert$2(test);
  var step = reverse ? -1 : 1;
  factory(tree, null, [])();
  /**
   * @param {Node} node
   * @param {number?} index
   * @param {Array.<Parent>} parents
   */

  function factory(node, index, parents) {
    /** @type {Object.<string, unknown>} */
    var value = typeof node === 'object' && node !== null ? node : {};
    /** @type {string} */

    var name;

    if (typeof value.type === 'string') {
      name = typeof value.tagName === 'string' ? value.tagName : typeof value.name === 'string' ? value.name : undefined;
      Object.defineProperty(visit, 'name', {
        value: 'node (' + color$1(value.type + (name ? '<' + name + '>' : '')) + ')'
      });
    }

    return visit;

    function visit() {
      /** @type {ActionTuple} */
      var result = [];
      /** @type {ActionTuple} */

      var subresult;
      /** @type {number} */

      var offset;
      /** @type {Array.<Parent>} */

      var grandparents;

      if (!test || is(node, index, parents[parents.length - 1] || null)) {
        result = toResult$1(visitor(node, parents));

        if (result[0] === EXIT$1) {
          return result;
        }
      }

      if (node.children && result[0] !== SKIP$1) {
        // @ts-ignore looks like a parent.
        offset = (reverse ? node.children.length : -1) + step; // @ts-ignore looks like a parent.

        grandparents = parents.concat(node); // @ts-ignore looks like a parent.

        while (offset > -1 && offset < node.children.length) {
          subresult = factory(node.children[offset], offset, grandparents)();

          if (subresult[0] === EXIT$1) {
            return subresult;
          }

          offset = typeof subresult[1] === 'number' ? subresult[1] : offset + step;
        }
      }

      return result;
    }
  }
};
/**
 * @param {VisitorResult} value
 * @returns {ActionTuple}
 */

function toResult$1(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'number') {
    return [CONTINUE$1, value];
  }

  return [value];
}

/**
 * @typedef Options Configuration.
 * @property {Test} [ignore] `unist-util-is` test used to assert parents
 *
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Content} Content
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('mdast').Text} Text
 * @typedef {Content|Root} Node
 * @typedef {Extract<Node, import('mdast').Parent>} Parent
 *
 * @typedef {import('unist-util-visit-parents').Test} Test
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 *
 * @typedef RegExpMatchObject
 * @property {number} index
 * @property {string} input
 *
 * @typedef {string|RegExp} Find
 * @typedef {string|ReplaceFunction} Replace
 *
 * @typedef {[Find, Replace]} FindAndReplaceTuple
 * @typedef {Object.<string, Replace>} FindAndReplaceSchema
 * @typedef {Array.<FindAndReplaceTuple>} FindAndReplaceList
 *
 * @typedef {[RegExp, ReplaceFunction]} Pair
 * @typedef {Array.<Pair>} Pairs
 */
const own$b = {}.hasOwnProperty;
/**
 * @param tree mdast tree
 * @param find Value to find and remove. When `string`, escaped and made into a global `RegExp`
 * @param [replace] Value to insert.
 *   * When `string`, turned into a Text node.
 *   * When `Function`, called with the results of calling `RegExp.exec` as
 *     arguments, in which case it can return a single or a list of `Node`,
 *     a `string` (which is wrapped in a `Text` node), or `false` to not replace
 * @param [options] Configuration.
 */

const findAndReplace =
/**
 * @type {(
 *   ((tree: Node, find: Find, replace?: Replace, options?: Options) => Node) &
 *   ((tree: Node, schema: FindAndReplaceSchema|FindAndReplaceList, options?: Options) => Node)
 * )}
 **/

/**
 * @param {Node} tree
 * @param {Find|FindAndReplaceSchema|FindAndReplaceList} find
 * @param {Replace|Options} [replace]
 * @param {Options} [options]
 */
function (tree, find, replace, options) {
  /** @type {Options|undefined} */
  let settings;
  /** @type {FindAndReplaceSchema|FindAndReplaceList} */

  let schema;

  if (typeof find === 'string' || find instanceof RegExp) {
    // @ts-expect-error don’t expect options twice.
    schema = [[find, replace]];
    settings = options;
  } else {
    schema = find; // @ts-expect-error don’t expect replace twice.

    settings = replace;
  }

  if (!settings) {
    settings = {};
  }

  const ignored = convert$2(settings.ignore || []);
  const pairs = toPairs(schema);
  let pairIndex = -1;

  while (++pairIndex < pairs.length) {
    visitParents$1(tree, 'text', visitor);
  }

  return tree;
  /** @type {import('unist-util-visit-parents').Visitor<Text>} */

  function visitor(node, parents) {
    let index = -1;
    /** @type {Parent|undefined} */

    let grandparent;

    while (++index < parents.length) {
      const parent =
      /** @type {Parent} */
      parents[index];

      if (ignored(parent, // @ts-expect-error mdast vs. unist parent.
      grandparent ? grandparent.children.indexOf(parent) : undefined, grandparent)) {
        return;
      }

      grandparent = parent;
    }

    if (grandparent) {
      return handler(node, grandparent);
    }
  }
  /**
   * @param {Text} node
   * @param {Parent} parent
   * @returns {VisitorResult}
   */


  function handler(node, parent) {
    const find = pairs[pairIndex][0];
    const replace = pairs[pairIndex][1];
    let start = 0; // @ts-expect-error: TS is wrong, some of these children can be text.

    let index = parent.children.indexOf(node);
    /** @type {Array.<PhrasingContent>} */

    let nodes = [];
    /** @type {number|undefined} */

    let position;
    find.lastIndex = 0;
    let match = find.exec(node.value);

    while (match) {
      position = match.index; // @ts-expect-error this is perfectly fine, typescript.

      let value = replace(...match, {
        index: match.index,
        input: match.input
      });

      if (typeof value === 'string') {
        value = value.length > 0 ? {
          type: 'text',
          value
        } : undefined;
      }

      if (value !== false) {
        if (start !== position) {
          nodes.push({
            type: 'text',
            value: node.value.slice(start, position)
          });
        }

        if (Array.isArray(value)) {
          nodes.push(...value);
        } else if (value) {
          nodes.push(value);
        }

        start = position + match[0].length;
      }

      if (!find.global) {
        break;
      }

      match = find.exec(node.value);
    }

    if (position === undefined) {
      nodes = [node];
      index--;
    } else {
      if (start < node.value.length) {
        nodes.push({
          type: 'text',
          value: node.value.slice(start)
        });
      }

      parent.children.splice(index, 1, ...nodes);
    }

    return index + nodes.length + 1;
  }
};
/**
 * @param {FindAndReplaceSchema|FindAndReplaceList} schema
 * @returns {Pairs}
 */

function toPairs(schema) {
  /** @type {Pairs} */
  const result = [];

  if (typeof schema !== 'object') {
    throw new TypeError('Expected array or object as schema');
  }

  if (Array.isArray(schema)) {
    let index = -1;

    while (++index < schema.length) {
      result.push([toExpression(schema[index][0]), toFunction(schema[index][1])]);
    }
  } else {
    /** @type {string} */
    let key;

    for (key in schema) {
      if (own$b.call(schema, key)) {
        result.push([toExpression(key), toFunction(schema[key])]);
      }
    }
  }

  return result;
}
/**
 * @param {Find} find
 * @returns {RegExp}
 */


function toExpression(find) {
  return typeof find === 'string' ? new RegExp(escapeStringRegexp(find), 'g') : find;
}
/**
 * @param {Replace} replace
 * @returns {ReplaceFunction}
 */


function toFunction(replace) {
  return typeof replace === 'function' ? replace : () => replace;
}

var TargetKind;
(function (TargetKind) {
    TargetKind["heading"] = "heading";
    TargetKind["math"] = "math";
    TargetKind["figure"] = "figure";
    TargetKind["table"] = "table";
    TargetKind["code"] = "code";
})(TargetKind || (TargetKind = {}));
var ReferenceKind;
(function (ReferenceKind) {
    ReferenceKind["ref"] = "ref";
    ReferenceKind["numref"] = "numref";
    ReferenceKind["eq"] = "eq";
})(ReferenceKind || (ReferenceKind = {}));
/**
 * See https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html#role-numref
 */
function fillReferenceNumbers(node, number) {
    const num = String(number);
    findAndReplace(node, { '%s': num, '{number}': num });
}
function copyNode(node) {
    return JSON.parse(JSON.stringify(node));
}
class State {
    constructor(targetCounts, targets) {
        this.targetCounts = targetCounts || {};
        this.targets = targets || {};
    }
    addTarget(node) {
        const kind = node.type === 'container' ? node.kind : node.type;
        node = copyNode(node);
        if (kind && kind in TargetKind && node.identifier) {
            if (kind === TargetKind.heading) {
                this.targets[node.identifier] = { node, kind, number: '' };
            }
            else {
                this.targets[node.identifier] = {
                    node,
                    kind: kind,
                    number: String(this.incrementCount(kind)),
                };
            }
        }
    }
    incrementCount(kind) {
        if (kind in this.targetCounts) {
            this.targetCounts[kind] += 1;
        }
        else {
            this.targetCounts[kind] = 1;
        }
        return this.targetCounts[kind];
    }
    getTarget(identifier) {
        if (!identifier)
            return undefined;
        return this.targets[identifier];
    }
    resolveReferenceContent(node) {
        var _a;
        const target = this.getTarget(node.identifier);
        if (!target) {
            return;
        }
        const kinds = {
            ref: {
                eq: node.kind === ReferenceKind.eq,
                ref: node.kind === ReferenceKind.ref,
                numref: node.kind === ReferenceKind.numref,
            },
            target: {
                math: target.kind === TargetKind.math,
                figure: target.kind === TargetKind.figure,
                table: target.kind === TargetKind.table,
                heading: target.kind === TargetKind.heading,
            },
        };
        const noNodeChildren = !((_a = node.children) === null || _a === void 0 ? void 0 : _a.length);
        if (kinds.ref.eq && kinds.target.math) {
            if (noNodeChildren) {
                setTextAsChild(node, `(${target.number})`);
            }
            node.resolved = true;
        }
        else if (kinds.ref.ref && kinds.target.heading) {
            if (noNodeChildren) {
                node.children = copyNode(target.node).children;
            }
            node.resolved = true;
        }
        else if (kinds.ref.ref && (kinds.target.figure || kinds.target.table)) {
            if (noNodeChildren) {
                const caption = select('caption > paragraph', target.node);
                node.children = copyNode(caption).children;
            }
            node.resolved = true;
        }
        else if (kinds.ref.numref && kinds.target.figure) {
            if (noNodeChildren) {
                setTextAsChild(node, 'Figure %s');
            }
            fillReferenceNumbers(node, target.number);
            node.resolved = true;
        }
        else if (kinds.ref.numref && kinds.target.table) {
            if (noNodeChildren) {
                setTextAsChild(node, 'Table %s');
            }
            fillReferenceNumbers(node, target.number);
            node.resolved = true;
        }
    }
}
const countState = (state, tree) => {
    visit$1(tree, 'container', (node) => state.addTarget(node));
    visit$1(tree, 'math', (node) => state.addTarget(node));
    visit$1(tree, 'heading', (node) => state.addTarget(node));
    return tree;
};
const referenceState = (state, tree) => {
    selectAll('link', tree).map((node) => {
        const reference = normalizeLabel(node.url);
        if (reference && reference.identifier in state.targets) {
            node.type = 'contentReference';
            node.kind =
                state.targets[reference.identifier].kind === TargetKind.math ? 'eq' : 'ref';
            node.identifier = reference.identifier;
            node.label = reference.label;
            delete node.url;
        }
    });
    visit$1(tree, 'contentReference', (node) => {
        state.resolveReferenceContent(node);
    });
};

const defaultOptions$2 = {
    addAdmonitionHeaders: true,
    addContainerCaptionNumbers: true,
};
// Visit all admonitions and add headers if necessary
function addAdmonitionHeaders(tree) {
    visit$1(tree, 'admonition', (node) => {
        var _a;
        if (!node.kind || node.kind === AdmonitionKind.admonition)
            return;
        node.children = [
            {
                type: 'admonitionTitle',
                children: [{ type: 'text', value: admonitionKindToTitle(node.kind) }],
            },
            ...((_a = node.children) !== null && _a !== void 0 ? _a : []),
        ];
    });
}
// Visit all containers and add captions
function addContainerCaptionNumbers(tree, state) {
    selectAll('container[numbered=true]', tree).forEach((container) => {
        var _a, _b;
        const number = (_a = state.getTarget(container.identifier)) === null || _a === void 0 ? void 0 : _a.number;
        const para = select('caption > paragraph', container);
        if (number && para) {
            para.children = [
                { type: 'captionNumber', kind: container.kind, value: number },
                ...((_b = para === null || para === void 0 ? void 0 : para.children) !== null && _b !== void 0 ? _b : []),
            ];
        }
    });
}
const transform = (state, o) => (tree) => {
    const opts = Object.assign(Object.assign({}, defaultOptions$2), o);
    countState(state, tree);
    referenceState(state, tree);
    if (opts.addAdmonitionHeaders)
        addAdmonitionHeaders(tree);
    if (opts.addContainerCaptionNumbers)
        addContainerCaptionNumbers(tree, state);
};

/**
 * @typedef {import('mdast').Root|import('mdast').Parent['children'][number]} MdastNode
 * @typedef {import('./index.js').H} H
 * @typedef {import('./index.js').Handler} Handler
 * @typedef {import('./index.js').Content} Content
 */
const own$a = {}.hasOwnProperty;
/**
 * Transform an unknown node.
 * @type {Handler}
 * @param {MdastNode} node
 */

function unknown(h, node) {
  const data = node.data || {};

  if ('value' in node && !(own$a.call(data, 'hName') || own$a.call(data, 'hProperties') || own$a.call(data, 'hChildren'))) {
    return h.augment(node, u('text', node.value));
  }

  return h(node, 'div', all$2(h, node));
}
/**
 * @type {Handler}
 * @param {MdastNode} node
 */


function one$1(h, node, parent) {
  const type = node && node.type;
  /** @type {Handler} */

  let fn; // Fail on non-nodes.

  if (!type) {
    throw new Error('Expected node, got `' + node + '`');
  }

  if (own$a.call(h.handlers, type)) {
    fn = h.handlers[type];
  } else if (h.passThrough && h.passThrough.includes(type)) {
    fn = returnNode;
  } else {
    fn = h.unknownHandler;
  }

  return (typeof fn === 'function' ? fn : unknown)(h, node, parent);
}
/**
 * @type {Handler}
 * @param {MdastNode} node
 */

function returnNode(h, node) {
  // @ts-expect-error: Pass through custom node.
  return 'children' in node ? { ...node,
    children: all$2(h, node)
  } : node;
}
/**
 * @param {H} h
 * @param {MdastNode} parent
 */


function all$2(h, parent) {
  /** @type {Array<Content>} */
  const values = [];

  if ('children' in parent) {
    const nodes = parent.children;
    let index = -1;

    while (++index < nodes.length) {
      const result = one$1(h, nodes[index], parent);

      if (result) {
        if (index && nodes[index - 1].type === 'break') {
          if (!Array.isArray(result) && result.type === 'text') {
            result.value = result.value.replace(/^\s+/, '');
          }

          if (!Array.isArray(result) && result.type === 'element') {
            const head = result.children[0];

            if (head && head.type === 'text') {
              head.value = head.value.replace(/^\s+/, '');
            }
          }
        }

        if (Array.isArray(result)) {
          values.push(...result);
        } else {
          values.push(result);
        }
      }
    }
  }

  return values;
}

/**
 * @typedef {import('unist').Position} Position
 * @typedef {import('unist').Point} Point
 *
 * @typedef {Partial<Point>} PointLike
 *
 * @typedef {Object} PositionLike
 * @property {PointLike} [start]
 * @property {PointLike} [end]
 *
 * @typedef {Object} NodeLike
 * @property {PositionLike} [position]
 */
var pointStart = point$1('start');
var pointEnd = point$1('end');
/**
 * Get the positional info of `node`.
 *
 * @param {'start'|'end'} type
 */

function point$1(type) {
  return point;
  /**
   * Get the positional info of `node`.
   *
   * @param {NodeLike} [node]
   * @returns {Point}
   */

  function point(node) {
    /** @type {Point} */
    // @ts-ignore looks like a point
    var point = node && node.position && node.position[type] || {};
    return {
      line: point.line || null,
      column: point.column || null,
      offset: point.offset > -1 ? point.offset : null
    };
  }
}

/**
 * @typedef {Object} PointLike
 * @property {number} [line]
 * @property {number} [column]
 * @property {number} [offset]
 *
 * @typedef {Object} PositionLike
 * @property {PointLike} [start]
 * @property {PointLike} [end]
 *
 * @typedef {Object} NodeLike
 * @property {PositionLike} [position]
 */

/**
 * Check if `node` is *generated*.
 *
 * @param {NodeLike} [node]
 * @returns {boolean}
 */
function generated(node) {
  return !node || !node.position || !node.position.start || !node.position.start.line || !node.position.start.column || !node.position.end || !node.position.end.line || !node.position.end.column;
}

/**
 * @param {string} d
 * @returns {string}
 */
function color(d) {
  return d;
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 */
/**
 * Continue traversing as normal
 */

const CONTINUE = true;
/**
 * Do not traverse this node’s children
 */

const SKIP = 'skip';
/**
 * Stop traversing immediately
 */

const EXIT = false;
const visitParents =
/**
 * @type {(
 *   (<T extends Node>(tree: Node, test: T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>|Array.<T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>>, visitor: Visitor<T>, reverse?: boolean) => void) &
 *   ((tree: Node, test: Test, visitor: Visitor<Node>, reverse?: boolean) => void) &
 *   ((tree: Node, visitor: Visitor<Node>, reverse?: boolean) => void)
 * )}
 */

/**
 * Visit children of tree which pass a test
 *
 * @param {Node} tree Abstract syntax tree to walk
 * @param {Test} test test Test node
 * @param {Visitor<Node>} visitor Function to run for each node
 * @param {boolean} [reverse] Fisit the tree in reverse, defaults to false
 */
function (tree, test, visitor, reverse) {
  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor; // @ts-ignore no visitor given, so `visitor` is test.

    visitor = test;
    test = null;
  }

  var is = convert$2(test);
  var step = reverse ? -1 : 1;
  factory(tree, null, [])();
  /**
   * @param {Node} node
   * @param {number?} index
   * @param {Array.<Parent>} parents
   */

  function factory(node, index, parents) {
    /** @type {Object.<string, unknown>} */
    var value = typeof node === 'object' && node !== null ? node : {};
    /** @type {string} */

    var name;

    if (typeof value.type === 'string') {
      name = typeof value.tagName === 'string' ? value.tagName : typeof value.name === 'string' ? value.name : undefined;
      Object.defineProperty(visit, 'name', {
        value: 'node (' + color(value.type + (name ? '<' + name + '>' : '')) + ')'
      });
    }

    return visit;

    function visit() {
      /** @type {ActionTuple} */
      var result = [];
      /** @type {ActionTuple} */

      var subresult;
      /** @type {number} */

      var offset;
      /** @type {Array.<Parent>} */

      var grandparents;

      if (!test || is(node, index, parents[parents.length - 1] || null)) {
        result = toResult(visitor(node, parents));

        if (result[0] === EXIT) {
          return result;
        }
      }

      if (node.children && result[0] !== SKIP) {
        // @ts-ignore looks like a parent.
        offset = (reverse ? node.children.length : -1) + step; // @ts-ignore looks like a parent.

        grandparents = parents.concat(node); // @ts-ignore looks like a parent.

        while (offset > -1 && offset < node.children.length) {
          subresult = factory(node.children[offset], offset, grandparents)();

          if (subresult[0] === EXIT) {
            return subresult;
          }

          offset = typeof subresult[1] === 'number' ? subresult[1] : offset + step;
        }
      }

      return result;
    }
  }
};
/**
 * @param {VisitorResult} value
 * @returns {ActionTuple}
 */

function toResult(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'number') {
    return [CONTINUE, value];
  }

  return [value];
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 */
const visit =
/**
 * @type {(
 *   (<T extends Node>(tree: Node, test: T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>|Array.<T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>>, visitor: Visitor<T>, reverse?: boolean) => void) &
 *   ((tree: Node, test: Test, visitor: Visitor<Node>, reverse?: boolean) => void) &
 *   ((tree: Node, visitor: Visitor<Node>, reverse?: boolean) => void)
 * )}
 */

/**
 * Visit children of tree which pass a test
 *
 * @param {Node} tree Abstract syntax tree to walk
 * @param {Test} test test Test node
 * @param {Visitor<Node>} visitor Function to run for each node
 * @param {boolean} [reverse] Fisit the tree in reverse, defaults to false
 */
function (tree, test, visitor, reverse) {
  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor;
    visitor = test;
    test = null;
  }

  visitParents(tree, test, overload, reverse);
  /**
   * @param {Node} node
   * @param {Array.<Parent>} parents
   */

  function overload(node, parents) {
    var parent = parents[parents.length - 1];
    return visitor(node, parent ? parent.children.indexOf(node) : null, parent);
  }
};

/**
 * @typedef {import('mdast').Root|import('mdast').Content} Node
 * @typedef {import('mdast').Definition} Definition
 * @typedef {import('unist-util-visit').Visitor<Definition>} DefinitionVisitor
 */
const own$9 = {}.hasOwnProperty;
/**
 *
 * @param {Node} node
 */

function definitions(node) {
  /** @type {Object.<string, Definition>} */
  const cache = Object.create(null);

  if (!node || !node.type) {
    throw new Error('mdast-util-definitions expected node');
  }

  visit(node, 'definition', ondefinition);
  return getDefinition;
  /** @type {DefinitionVisitor} */

  function ondefinition(definition) {
    const id = clean(definition.identifier);

    if (id && !own$9.call(cache, id)) {
      cache[id] = definition;
    }
  }
  /**
   * Get a node from the bound definition-cache.
   *
   * @param {string} identifier
   * @returns {Definition|null}
   */


  function getDefinition(identifier) {
    const id = clean(identifier);
    return id && own$9.call(cache, id) ? cache[id] : null;
  }
}
/**
 * @param {string} [value]
 * @returns {string}
 */

function clean(value) {
  return String(value || '').toUpperCase();
}

// This module is generated by `script/`.
//
// CommonMark handles attention (emphasis, strong) markers based on what comes
// before or after them.
// One such difference is if those characters are Unicode punctuation.
// This script is generated from the Unicode data.
const unicodePunctuationRegex = /[!-/:-@[-`{-~\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]/;

/**
 * @typedef {import('micromark-util-types').Code} Code
 */
/**
 * Check whether the character code represents an ASCII alphanumeric (`a`
 * through `z`, case insensitive, or `0` through `9`).
 *
 * An **ASCII alphanumeric** is an ASCII digit (see `asciiDigit`) or ASCII alpha
 * (see `asciiAlpha`).
 */

const asciiAlphanumeric = regexCheck(/[\dA-Za-z]/);
/**
 * Check whether the character code represents Unicode punctuation.
 *
 * A **Unicode punctuation** is a character in the Unicode `Pc` (Punctuation,
 * Connector), `Pd` (Punctuation, Dash), `Pe` (Punctuation, Close), `Pf`
 * (Punctuation, Final quote), `Pi` (Punctuation, Initial quote), `Po`
 * (Punctuation, Other), or `Ps` (Punctuation, Open) categories, or an ASCII
 * punctuation (see `asciiPunctuation`).
 *
 * See:
 * **\[UNICODE]**:
 * [The Unicode Standard](https://www.unicode.org/versions/).
 * Unicode Consortium.
 */
// Size note: removing ASCII from the regex and using `asciiPunctuation` here
// In fact adds to the bundle size.

regexCheck(unicodePunctuationRegex);
/**
 * Create a code check from a regex.
 *
 * @param {RegExp} regex
 * @returns {(code: Code) => code is number}
 */

function regexCheck(regex) {
  return check;
  /**
   * Check whether a code matches the bound regex.
   *
   * @param {Code} code Character code
   * @returns {code is number} Whether the character code matches the bound regex
   */

  function check(code) {
    return code !== null && regex.test(String.fromCharCode(code));
  }
}

const characterReferences = {
  '"': 'quot',
  '&': 'amp',
  '<': 'lt',
  '>': 'gt'
};
/**
 * Encode only the dangerous HTML characters.
 *
 * This ensures that certain characters which have special meaning in HTML are
 * dealt with.
 * Technically, we can skip `>` and `"` in many cases, but CM includes them.
 *
 * @param {string} value
 * @returns {string}
 */

function encode(value) {
  return value.replace(/["&<>]/g, replace);
  /**
   * @param {string} value
   * @returns {string}
   */

  function replace(value) {
    // @ts-expect-error Hush, it’s fine.
    return '&' + characterReferences[value] + ';';
  }
}

/**
 * Make a value safe for injection as a URL.
 *
 * This encodes unsafe characters with percent-encoding and skips already
 * encoded sequences (see `normalizeUri` below).
 * Further unsafe characters are encoded as character references (see
 * `micromark-util-encode`).
 *
 * Then, a regex of allowed protocols can be given, in which case the URL is
 * sanitized.
 * For example, `/^(https?|ircs?|mailto|xmpp)$/i` can be used for `a[href]`,
 * or `/^https?$/i` for `img[src]`.
 * If the URL includes an unknown protocol (one not matched by `protocol`, such
 * as a dangerous example, `javascript:`), the value is ignored.
 *
 * @param {string|undefined} url
 * @param {RegExp} [protocol]
 * @returns {string}
 */

function sanitizeUri(url, protocol) {
  const value = encode(normalizeUri(url || ''));

  if (!protocol) {
    return value;
  }

  const colon = value.indexOf(':');
  const questionMark = value.indexOf('?');
  const numberSign = value.indexOf('#');
  const slash = value.indexOf('/');

  if ( // If there is no protocol, it’s relative.
  colon < 0 || // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
  slash > -1 && colon > slash || questionMark > -1 && colon > questionMark || numberSign > -1 && colon > numberSign || // It is a protocol, it should be allowed.
  protocol.test(value.slice(0, colon))) {
    return value;
  }

  return '';
}
/**
 * Normalize a URL (such as used in definitions).
 *
 * Encode unsafe characters with percent-encoding, skipping already encoded
 * sequences.
 *
 * @param {string} value
 * @returns {string}
 */

function normalizeUri(value) {
  /** @type {string[]} */
  const result = [];
  let index = -1;
  let start = 0;
  let skip = 0;

  while (++index < value.length) {
    const code = value.charCodeAt(index);
    /** @type {string} */

    let replace = ''; // A correct percent encoded value.

    if (code === 37 && asciiAlphanumeric(value.charCodeAt(index + 1)) && asciiAlphanumeric(value.charCodeAt(index + 2))) {
      skip = 2;
    } // ASCII.
    else if (code < 128) {
      if (!/[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(code))) {
        replace = String.fromCharCode(code);
      }
    } // Astral.
    else if (code > 55295 && code < 57344) {
      const next = value.charCodeAt(index + 1); // A correct surrogate pair.

      if (code < 56320 && next > 56319 && next < 57344) {
        replace = String.fromCharCode(code, next);
        skip = 1;
      } // Lone surrogate.
      else {
        replace = '\uFFFD';
      }
    } // Unicode.
    else {
      replace = String.fromCharCode(code);
    }

    if (replace) {
      result.push(value.slice(start, index), encodeURIComponent(replace));
      start = index + skip + 1;
      replace = '';
    }

    if (skip) {
      index += skip;
      skip = 0;
    }
  }

  return result.join('') + value.slice(start);
}

/**
 * @typedef {import('./index.js').Content} Content
 */
/**
 * Wrap `nodes` with line feeds between each entry.
 * Optionally adds line feeds at the start and end.
 *
 * @param {Array<Content>} nodes
 * @param {boolean} [loose=false]
 * @returns {Array<Content>}
 */

function wrap$1(nodes, loose) {
  /** @type {Array<Content>} */
  const result = [];
  let index = -1;

  if (loose) {
    result.push(u('text', '\n'));
  }

  while (++index < nodes.length) {
    if (index) result.push(u('text', '\n'));
    result.push(nodes[index]);
  }

  if (loose && nodes.length > 0) {
    result.push(u('text', '\n'));
  }

  return result;
}

/**
 * @typedef {import('mdast').BlockContent} BlockContent
 * @typedef {import('mdast').FootnoteDefinition} FootnoteDefinition
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('./index.js').H} H
 */
/**
 * @param {H} h
 */

function footer(h) {
  let index = -1;
  /** @type {Array<ElementContent>} */

  const listItems = [];

  while (++index < h.footnoteOrder.length) {
    const def = h.footnoteById[h.footnoteOrder[index].toUpperCase()];

    if (!def) {
      continue;
    }

    const content = all$2(h, def);
    const id = String(def.identifier);
    const safeId = sanitizeUri(id.toLowerCase());
    let referenceIndex = 0;
    /** @type {Array<ElementContent>} */

    const backReferences = [];

    while (++referenceIndex <= h.footnoteCounts[id]) {
      /** @type {Element} */
      const backReference = {
        type: 'element',
        tagName: 'a',
        properties: {
          href: '#' + h.clobberPrefix + 'fnref-' + safeId + (referenceIndex > 1 ? '-' + referenceIndex : ''),
          dataFootnoteBackref: true,
          className: ['data-footnote-backref'],
          ariaLabel: h.footnoteBackLabel
        },
        children: [{
          type: 'text',
          value: '↩'
        }]
      };

      if (referenceIndex > 1) {
        backReference.children.push({
          type: 'element',
          tagName: 'sup',
          children: [{
            type: 'text',
            value: String(referenceIndex)
          }]
        });
      }

      if (backReferences.length > 0) {
        backReferences.push({
          type: 'text',
          value: ' '
        });
      }

      backReferences.push(backReference);
    }

    const tail = content[content.length - 1];

    if (tail && tail.type === 'element' && tail.tagName === 'p') {
      const tailTail = tail.children[tail.children.length - 1];

      if (tailTail && tailTail.type === 'text') {
        tailTail.value += ' ';
      } else {
        tail.children.push({
          type: 'text',
          value: ' '
        });
      }

      tail.children.push(...backReferences);
    } else {
      content.push(...backReferences);
    }
    /** @type {Element} */


    const listItem = {
      type: 'element',
      tagName: 'li',
      properties: {
        id: h.clobberPrefix + 'fn-' + safeId
      },
      children: wrap$1(content, true)
    };

    if (def.position) {
      listItem.position = def.position;
    }

    listItems.push(listItem);
  }

  if (listItems.length === 0) {
    return null;
  }

  return {
    type: 'element',
    tagName: 'section',
    properties: {
      dataFootnotes: true,
      className: ['footnotes']
    },
    children: [{
      type: 'element',
      tagName: 'h2',
      properties: {
        id: 'footnote-label',
        className: ['sr-only']
      },
      children: [u('text', h.footnoteLabel)]
    }, {
      type: 'text',
      value: '\n'
    }, {
      type: 'element',
      tagName: 'ol',
      properties: {},
      children: wrap$1(listItems, true)
    }, {
      type: 'text',
      value: '\n'
    }]
  };
}

/**
 * @typedef {import('mdast').Blockquote} Blockquote
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Blockquote} node
 */

function blockquote$1(h, node) {
  return h(node, 'blockquote', wrap$1(all$2(h, node), true));
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Text} Text
 * @typedef {import('mdast').Break} Break
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Break} node
 * @returns {Array<Element|Text>}
 */

function hardBreak(h, node) {
  return [h(node, 'br'), u('text', '\n')];
}

/**
 * @typedef {import('mdast').Code} Code
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Code} node
 */

function code$2(h, node) {
  const value = node.value ? node.value + '\n' : ''; // To do: next major, use `node.lang` w/o regex, the splitting’s been going
  // on for years in remark now.

  const lang = node.lang && node.lang.match(/^[^ \t]+(?=[ \t]|$)/);
  /** @type {Properties} */

  const props = {};

  if (lang) {
    props.className = ['language-' + lang];
  }

  const code = h(node, 'code', props, [u('text', value)]);

  if (node.meta) {
    code.data = {
      meta: node.meta
    };
  }

  return h(node.position, 'pre', [code]);
}

/**
 * @typedef {import('mdast').Delete} Delete
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Delete} node
 */

function strikethrough$1(h, node) {
  return h(node, 'del', all$2(h, node));
}

/**
 * @typedef {import('mdast').Emphasis} Emphasis
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Emphasis} node
 */

function emphasis$1(h, node) {
  return h(node, 'em', all$2(h, node));
}

/**
 * @typedef {import('mdast').FootnoteReference} FootnoteReference
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {FootnoteReference} node
 */

function footnoteReference(h, node) {
  const id = String(node.identifier);
  const safeId = sanitizeUri(id.toLowerCase());
  const index = h.footnoteOrder.indexOf(id);
  /** @type {number} */

  let counter;

  if (index === -1) {
    h.footnoteOrder.push(id);
    h.footnoteCounts[id] = 1;
    counter = h.footnoteOrder.length;
  } else {
    h.footnoteCounts[id]++;
    counter = index + 1;
  }

  const reuseCounter = h.footnoteCounts[id];
  return h(node, 'sup', [h(node.position, 'a', {
    href: '#' + h.clobberPrefix + 'fn-' + safeId,
    id: h.clobberPrefix + 'fnref-' + safeId + (reuseCounter > 1 ? '-' + reuseCounter : ''),
    dataFootnoteRef: true,
    ariaDescribedBy: 'footnote-label'
  }, [u('text', String(counter))])]);
}

/**
 * @typedef {import('mdast').Footnote} Footnote
 * @typedef {import('../index.js').Handler} Handler
 *
 * @todo
 *   `footnote` (or “inline note”) are a pandoc footnotes feature (`^[a note]`)
 *   that does not exist in GFM.
 *   We still have support for it, so that things remain working with
 *   `micromark-extension-footnote` and `mdast-util-footnote`, but in the future
 *   we might be able to remove it?
 */
/**
 * @type {Handler}
 * @param {Footnote} node
 */

function footnote(h, node) {
  const footnoteById = h.footnoteById;
  let no = 1;

  while (no in footnoteById) no++;

  const identifier = String(no);
  footnoteById[identifier] = {
    type: 'footnoteDefinition',
    identifier,
    children: [{
      type: 'paragraph',
      children: node.children
    }],
    position: node.position
  };
  return footnoteReference(h, {
    type: 'footnoteReference',
    identifier,
    position: node.position
  });
}

/**
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Heading} node
 */

function heading$2(h, node) {
  return h(node, 'h' + node.depth, all$2(h, node));
}

/**
 * @typedef {import('mdast').HTML} HTML
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * Return either a `raw` node in dangerous mode, otherwise nothing.
 *
 * @type {Handler}
 * @param {HTML} node
 */

function html$4(h, node) {
  return h.dangerous ? h.augment(node, u('raw', node.value)) : null;
}

/**
 * @typedef {import('mdast').LinkReference} LinkReference
 * @typedef {import('mdast').ImageReference} ImageReference
 * @typedef {import('./index.js').Handler} Handler
 * @typedef {import('./index.js').Content} Content
 */
/**
 * Return the content of a reference without definition as plain text.
 *
 * @type {Handler}
 * @param {ImageReference|LinkReference} node
 * @returns {Content|Array<Content>}
 */

function revert(h, node) {
  const subtype = node.referenceType;
  let suffix = ']';

  if (subtype === 'collapsed') {
    suffix += '[]';
  } else if (subtype === 'full') {
    suffix += '[' + (node.label || node.identifier) + ']';
  }

  if (node.type === 'imageReference') {
    return u('text', '![' + node.alt + suffix);
  }

  const contents = all$2(h, node);
  const head = contents[0];

  if (head && head.type === 'text') {
    head.value = '[' + head.value;
  } else {
    contents.unshift(u('text', '['));
  }

  const tail = contents[contents.length - 1];

  if (tail && tail.type === 'text') {
    tail.value += suffix;
  } else {
    contents.push(u('text', suffix));
  }

  return contents;
}

/**
 * @typedef {import('mdast').ImageReference} ImageReference
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {ImageReference} node
 */

function imageReference(h, node) {
  const def = h.definition(node.identifier);

  if (!def) {
    return revert(h, node);
  }
  /** @type {Properties} */


  const props = {
    src: encode_1(def.url || ''),
    alt: node.alt
  };

  if (def.title !== null && def.title !== undefined) {
    props.title = def.title;
  }

  return h(node, 'img', props);
}

/**
 * @typedef {import('mdast').Image} Image
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Image} node
 */

function image$2(h, node) {
  /** @type {Properties} */
  const props = {
    src: encode_1(node.url),
    alt: node.alt
  };

  if (node.title !== null && node.title !== undefined) {
    props.title = node.title;
  }

  return h(node, 'img', props);
}

/**
 * @typedef {import('mdast').InlineCode} InlineCode
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {InlineCode} node
 */

function inlineCode(h, node) {
  return h(node, 'code', [u('text', node.value.replace(/\r?\n|\r/g, ' '))]);
}

/**
 * @typedef {import('mdast').LinkReference} LinkReference
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {LinkReference} node
 */

function linkReference(h, node) {
  const def = h.definition(node.identifier);

  if (!def) {
    return revert(h, node);
  }
  /** @type {Properties} */


  const props = {
    href: encode_1(def.url || '')
  };

  if (def.title !== null && def.title !== undefined) {
    props.title = def.title;
  }

  return h(node, 'a', props, all$2(h, node));
}

/**
 * @typedef {import('mdast').Link} Link
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Link} node
 */

function link$1(h, node) {
  /** @type {Properties} */
  const props = {
    href: encode_1(node.url)
  };

  if (node.title !== null && node.title !== undefined) {
    props.title = node.title;
  }

  return h(node, 'a', props, all$2(h, node));
}

/**
 * @typedef {import('mdast').ListItem} ListItem
 * @typedef {import('mdast').List} List
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('hast').Element} Element
 * @typedef {import('../index.js').Handler} Handler
 * @typedef {import('../index.js').Content} Content
 */
/**
 * @type {Handler}
 * @param {ListItem} node
 * @param {List} parent
 */

function listItem(h, node, parent) {
  const result = all$2(h, node);
  const loose = parent ? listLoose(parent) : listItemLoose(node);
  /** @type {Properties} */

  const props = {};
  /** @type {Array<Content>} */

  const wrapped = [];

  if (typeof node.checked === 'boolean') {
    /** @type {Element} */
    let paragraph;

    if (result[0] && result[0].type === 'element' && result[0].tagName === 'p') {
      paragraph = result[0];
    } else {
      paragraph = h(null, 'p', []);
      result.unshift(paragraph);
    }

    if (paragraph.children.length > 0) {
      paragraph.children.unshift(u('text', ' '));
    }

    paragraph.children.unshift(h(null, 'input', {
      type: 'checkbox',
      checked: node.checked,
      disabled: true
    })); // According to github-markdown-css, this class hides bullet.
    // See: <https://github.com/sindresorhus/github-markdown-css>.

    props.className = ['task-list-item'];
  }

  let index = -1;

  while (++index < result.length) {
    const child = result[index]; // Add eols before nodes, except if this is a loose, first paragraph.

    if (loose || index !== 0 || child.type !== 'element' || child.tagName !== 'p') {
      wrapped.push(u('text', '\n'));
    }

    if (child.type === 'element' && child.tagName === 'p' && !loose) {
      wrapped.push(...child.children);
    } else {
      wrapped.push(child);
    }
  }

  const tail = result[result.length - 1]; // Add a final eol.

  if (tail && (loose || !('tagName' in tail) || tail.tagName !== 'p')) {
    wrapped.push(u('text', '\n'));
  }

  return h(node, 'li', props, wrapped);
}
/**
 * @param {List} node
 * @return {Boolean}
 */

function listLoose(node) {
  let loose = node.spread;
  const children = node.children;
  let index = -1;

  while (!loose && ++index < children.length) {
    loose = listItemLoose(children[index]);
  }

  return Boolean(loose);
}
/**
 * @param {ListItem} node
 * @return {Boolean}
 */


function listItemLoose(node) {
  const spread = node.spread;
  return spread === undefined || spread === null ? node.children.length > 1 : spread;
}

/**
 * @typedef {import('mdast').List} List
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {List} node
 * @returns {Element}
 */

function list$2(h, node) {
  /** @type {Properties} */
  const props = {};
  const name = node.ordered ? 'ol' : 'ul';
  const items = all$2(h, node);
  let index = -1;

  if (typeof node.start === 'number' && node.start !== 1) {
    props.start = node.start;
  } // Like GitHub, add a class for custom styling.


  while (++index < items.length) {
    const item = items[index];

    if (item.type === 'element' && item.tagName === 'li' && item.properties && Array.isArray(item.properties.className) && item.properties.className.includes('task-list-item')) {
      props.className = ['contains-task-list'];
      break;
    }
  }

  return h(node, name, props, wrap$1(items, true));
}

/**
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Paragraph} node
 */

function paragraph$1(h, node) {
  return h(node, 'p', all$2(h, node));
}

/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Root} node
 */

function root(h, node) {
  // @ts-expect-error `root`s are also fine.
  return h.augment(node, u('root', wrap$1(all$2(h, node))));
}

/**
 * @typedef {import('mdast').Strong} Strong
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Strong} node
 */

function strong(h, node) {
  return h(node, 'strong', all$2(h, node));
}

/**
 * @typedef {import('mdast').Table} Table
 * @typedef {import('mdast').TableCell} TableCell
 * @typedef {import('hast').Element} Element
 * @typedef {import('../index.js').Handler} Handler
 * @typedef {import('../index.js').Content} Content
 */
/**
 * @type {Handler}
 * @param {Table} node
 */

function table$2(h, node) {
  const rows = node.children;
  let index = -1;
  const align = node.align || [];
  /** @type {Array<Element>} */

  const result = [];

  while (++index < rows.length) {
    const row = rows[index].children;
    const name = index === 0 ? 'th' : 'td';
    /** @type {Array<Content>} */

    const out = [];
    let cellIndex = -1;
    const length = node.align ? align.length : row.length;

    while (++cellIndex < length) {
      const cell = row[cellIndex];
      out.push(h(cell, name, {
        align: align[cellIndex]
      }, cell ? all$2(h, cell) : []));
    }

    result[index] = h(rows[index], 'tr', wrap$1(out, true));
  }

  return h(node, 'table', wrap$1([h(result[0].position, 'thead', wrap$1([result[0]], true))].concat(result[1] ? h({
    start: pointStart(result[1]),
    end: pointEnd(result[result.length - 1])
  }, 'tbody', wrap$1(result.slice(1), true)) : []), true));
}

/**
 * @typedef {import('mdast').Text} Text
 * @typedef {import('../index.js').Handler} Handler
 */
/**
 * @type {Handler}
 * @param {Text} node
 */

function text$2(h, node) {
  return h.augment(node, u('text', String(node.value).replace(/[ \t]*(\r?\n|\r)[ \t]*/g, '$1')));
}

/**
 * @typedef {import('mdast').ThematicBreak} ThematicBreak
 * @typedef {import('hast').Element} Element
 * @typedef {import('../index.js').Handler} Handler
 */

/**
 * @type {Handler}
 * @param {ThematicBreak} [node]
 * @returns {Element}
 */
function thematicBreak(h, node) {
  return h(node, 'hr');
}

const handlers$1 = {
  blockquote: blockquote$1,
  break: hardBreak,
  code: code$2,
  delete: strikethrough$1,
  emphasis: emphasis$1,
  footnoteReference,
  footnote,
  heading: heading$2,
  html: html$4,
  imageReference,
  image: image$2,
  inlineCode,
  linkReference,
  link: link$1,
  listItem,
  list: list$2,
  paragraph: paragraph$1,
  root,
  strong,
  table: table$2,
  text: text$2,
  thematicBreak,
  toml: ignore,
  yaml: ignore,
  definition: ignore,
  footnoteDefinition: ignore
}; // Return nothing for nodes that are ignored.

function ignore() {
  return null;
}

/**
 * @typedef {import('mdast').Root|import('mdast').Parent['children'][number]} MdastNode
 * @typedef {import('hast').Root|import('hast').Parent['children'][number]} HastNode
 * @typedef {import('mdast').Parent} Parent
 * @typedef {import('mdast').Definition} Definition
 * @typedef {import('mdast').FootnoteDefinition} FootnoteDefinition
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('hast').Text} Text
 * @typedef {import('hast').Comment} Comment
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').ElementContent} Content
 * @typedef {import('unist-util-position').PositionLike} PositionLike
 *
 * @typedef EmbeddedHastFields
 * @property {string} [hName] Defines the tag name of an element
 * @property {Properties} [hProperties] Defines the properties of an element
 * @property {Array<Content>} [hChildren] Defines the (hast) children of an element
 *
 * @typedef {Record<string, unknown> & EmbeddedHastFields} Data unist data with embedded hast fields
 *
 * @typedef {MdastNode & {data?: Data}} NodeWithData unist node with embedded hast data
 *
 * @callback Handler
 * @param {H} h Handle context
 * @param {any} node mdast node to handle
 * @param {Parent|null} parent Parent of `node`
 * @returns {Content|Array<Content>|null|undefined} hast node
 *
 * @callback HFunctionProps
 * @param {MdastNode|PositionLike|null|undefined} node mdast node or unist position
 * @param {string} tagName HTML tag name
 * @param {Properties} props Properties
 * @param {Array<Content>?} [children] hast content
 * @returns {Element}
 *
 * @callback HFunctionNoProps
 * @param {MdastNode|PositionLike|null|undefined} node mdast node or unist position
 * @param {string} tagName HTML tag name
 * @param {Array<Content>?} [children] hast content
 * @returns {Element}
 *
 * @typedef HFields
 * @property {boolean} dangerous Whether HTML is allowed
 * @property {string} clobberPrefix Prefix to use to prevent DOM clobbering
 * @property {string} footnoteLabel Label to use to introduce the footnote section
 * @property {string} footnoteBackLabel Label to use to go back to a footnote call from the footnote section
 * @property {(identifier: string) => Definition|null} definition Definition cache
 * @property {Record<string, FootnoteDefinition>} footnoteById Footnote cache
 * @property {Array<string>} footnoteOrder Order in which footnotes occur
 * @property {Record<string, number>} footnoteCounts Counts the same footnote was used
 * @property {Handlers} handlers Applied handlers
 * @property {Handler} unknownHandler Handler for any none not in `passThrough` or otherwise handled
 * @property {(left: NodeWithData|PositionLike|null|undefined, right: Content) => Content} augment Like `h` but lower-level and usable on non-elements.
 * @property {Array<string>} passThrough List of node types to pass through untouched (except for their children).
 *
 * @typedef Options
 * @property {boolean} [allowDangerousHtml=false]
 *   Whether to allow `html` nodes and inject them as `raw` HTML
 * @property {string} [clobberPrefix='user-content-']
 *   Prefix to use before the `id` attribute to prevent it from *clobbering*.
 *   attributes.
 *   DOM clobbering is this:
 *
 *   ```html
 *   <p id=x></p>
 *   <script>alert(x)</script>
 *   ```
 *
 *   Elements by their ID are made available in browsers on the `window` object.
 *   Using a prefix prevents this from being a problem.
 * @property {string} [footnoteLabel='Footnotes']
 *   Label to use for the footnotes section.
 *   Affects screen reader users.
 *   Change it if you’re authoring in a different language.
 * @property {string} [footnoteBackLabel='Back to content']
 *   Label to use from backreferences back to their footnote call.
 *   Affects screen reader users.
 *   Change it if you’re authoring in a different language.
 * @property {Handlers} [handlers]
 *   Object mapping mdast nodes to functions handling them
 * @property {Array<string>} [passThrough]
 *   List of custom mdast node types to pass through (keep) in hast
 * @property {Handler} [unknownHandler]
 *   Handler for all unknown nodes.
 *
 * @typedef {Record<string, Handler>} Handlers
 *   Map of node types to handlers
 * @typedef {HFunctionProps & HFunctionNoProps & HFields} H
 *   Handle context
 */
const own$8 = {}.hasOwnProperty;
/**
 * Factory to transform.
 * @param {MdastNode} tree mdast node
 * @param {Options} [options] Configuration
 * @returns {H} `h` function
 */

function factory(tree, options) {
  const settings = options || {};
  const dangerous = settings.allowDangerousHtml || false;
  /** @type {Record<string, FootnoteDefinition>} */

  const footnoteById = {};
  h.dangerous = dangerous;
  h.clobberPrefix = settings.clobberPrefix === undefined || settings.clobberPrefix === null ? 'user-content-' : settings.clobberPrefix;
  h.footnoteLabel = settings.footnoteLabel || 'Footnotes';
  h.footnoteBackLabel = settings.footnoteBackLabel || 'Back to content';
  h.definition = definitions(tree);
  h.footnoteById = footnoteById;
  /** @type {Array<string>} */

  h.footnoteOrder = [];
  /** @type {Record<string, number>} */

  h.footnoteCounts = {};
  h.augment = augment;
  h.handlers = { ...handlers$1,
    ...settings.handlers
  };
  h.unknownHandler = settings.unknownHandler;
  h.passThrough = settings.passThrough;
  visit$1(tree, 'footnoteDefinition', definition => {
    const id = String(definition.identifier).toUpperCase(); // Mimick CM behavior of link definitions.
    // See: <https://github.com/syntax-tree/mdast-util-definitions/blob/8290999/index.js#L26>.

    if (!own$8.call(footnoteById, id)) {
      footnoteById[id] = definition;
    }
  }); // @ts-expect-error Hush, it’s fine!

  return h;
  /**
   * Finalise the created `right`, a hast node, from `left`, an mdast node.
   * @param {(NodeWithData|PositionLike)?} left
   * @param {Content} right
   * @returns {Content}
   */

  function augment(left, right) {
    // Handle `data.hName`, `data.hProperties, `data.hChildren`.
    if (left && 'data' in left && left.data) {
      /** @type {Data} */
      const data = left.data;

      if (data.hName) {
        if (right.type !== 'element') {
          right = {
            type: 'element',
            tagName: '',
            properties: {},
            children: []
          };
        }

        right.tagName = data.hName;
      }

      if (right.type === 'element' && data.hProperties) {
        right.properties = { ...right.properties,
          ...data.hProperties
        };
      }

      if ('children' in right && right.children && data.hChildren) {
        right.children = data.hChildren;
      }
    }

    if (left) {
      const ctx = 'type' in left ? left : {
        position: left
      };

      if (!generated(ctx)) {
        right.position = {
          start: pointStart(ctx),
          end: pointEnd(ctx)
        };
      }
    }

    return right;
  }
  /**
   * Create an element for `node`.
   *
   * @type {HFunctionProps}
   */


  function h(node, tagName, props, children) {
    if (Array.isArray(props)) {
      children = props;
      props = {};
    } // @ts-expect-error augmenting an element yields an element.


    return augment(node, {
      type: 'element',
      tagName,
      properties: props || {},
      children: children || []
    });
  }
}
/**
 * Transform `tree` (an mdast node) to a hast node.
 *
 * @param {MdastNode} tree mdast node
 * @param {Options} [options] Configuration
 * @returns {HastNode|null|undefined} hast node
 */


function toHast(tree, options) {
  const h = factory(tree, options);
  const node = one$1(h, tree, null);
  const foot = footer(h);

  if (foot) {
    // @ts-expect-error If there’s a footer, there were definitions, meaning block
    // content.
    // So assume `node` is a parent node.
    node.children.push(u('text', '\n'), foot);
  }

  return Array.isArray(node) ? {
    type: 'root',
    children: node
  } : node;
}

var classnames = {exports: {}};

/*!
  Copyright (c) 2018 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/

(function (module) {
  /* global define */
  (function () {

    var hasOwn = {}.hasOwnProperty;

    function classNames() {
      var classes = [];

      for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (!arg) continue;
        var argType = typeof arg;

        if (argType === 'string' || argType === 'number') {
          classes.push(arg);
        } else if (Array.isArray(arg)) {
          if (arg.length) {
            var inner = classNames.apply(null, arg);

            if (inner) {
              classes.push(inner);
            }
          }
        } else if (argType === 'object') {
          if (arg.toString === Object.prototype.toString) {
            for (var key in arg) {
              if (hasOwn.call(arg, key) && arg[key]) {
                classes.push(key);
              }
            }
          } else {
            classes.push(arg.toString());
          }
        }
      }

      return classes.join(' ');
    }

    if (module.exports) {
      classNames.default = classNames;
      module.exports = classNames;
    } else {
      window.classNames = classNames;
    }
  })();
})(classnames);

var classNames = classnames.exports;

const abbreviation = (h, node) => h(node, 'abbr', { title: node.title }, all$2(h, node));
const subscript = (h, node) => h(node, 'sub', all$2(h, node));
const superscript = (h, node) => h(node, 'sup', all$2(h, node));
const image$1 = (h, node) => h(node, 'img', {
    src: node.url,
    alt: node.alt,
    title: node.title,
    class: classNames(node.align ? `align-${node.align}` : '', node.class) || undefined,
    width: node.width,
});
const caption = (h, node) => h(node, 'figcaption', all$2(h, node));
const container = (h, node) => h(node, 'figure', {
    id: node.identifier || node.label || undefined,
    class: classNames({ numbered: node.numbered }, node.class) || undefined,
}, all$2(h, node));
const admonitionTitle = (h, node) => h(node, 'p', { class: 'admonition-title' }, all$2(h, node));
const admonition = (h, node) => h(node, 'aside', {
    class: classNames({
        [node.class]: node.class,
        admonition: true,
        [node.kind]: node.kind && node.kind !== AdmonitionKind.admonition,
    }),
}, all$2(h, node));
const captionNumber = (h, node) => {
    var _a, _b;
    const captionKind = ((_a = node.kind) === null || _a === void 0 ? void 0 : _a.charAt(0).toUpperCase()) + ((_b = node.kind) === null || _b === void 0 ? void 0 : _b.slice(1));
    return h(node, 'span', { class: 'caption-number' }, [
        u('text', `${captionKind} ${node.value}`),
    ]);
};
const math = (h, node) => {
    const attrs = { id: node.identifier || undefined, class: 'math block' };
    if (node.value.indexOf('\n') !== -1) {
        const math = h(node, 'div', attrs, [u('text', node.value)]);
        return h(node, 'pre', [math]);
    }
    return h(node, 'div', attrs, [u('text', node.value.replace(/\r?\n|\r/g, ' '))]);
};
const inlineMath = (h, node) => {
    return h(node, 'span', { class: 'math inline' }, [
        u('text', node.value.replace(/\r?\n|\r/g, ' ')),
    ]);
};
const definitionList = (h, node) => h(node, 'dl', all$2(h, node));
const definitionTerm = (h, node) => h(node, 'dt', all$2(h, node));
const definitionDescription = (h, node) => h(node, 'dd', all$2(h, node));
const role = (h, node) => {
    return h(node, 'span', { class: 'role unhandled' }, [
        h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
        h(node, 'code', {}, [u('text', node.value)]),
    ]);
};
const directive = (h, node) => {
    let directiveElements = [
        h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
    ];
    if (node.args) {
        directiveElements = directiveElements.concat([
            u('text', ' '),
            h(node, 'code', { class: 'args' }, [u('text', node.args)]),
        ]);
    }
    return h(node, 'div', { class: 'directive unhandled' }, [
        h(node, 'p', {}, directiveElements),
        h(node, 'pre', [h(node, 'code', [u('text', node.value)])]),
    ]);
};
const block$1 = (h, node) => h(node, 'div', { class: 'block', 'data-block': node.meta }, all$2(h, node));
const comment$3 = (h, node) => u('comment', node.value);
const heading$1 = (h, node) => h(node, `h${node.depth}`, { id: node.identifier || undefined }, all$2(h, node));
const contentReference = (h, node) => {
    if (node.resolved) {
        return h(node, 'a', { href: `#${node.identifier}`, title: node.title || undefined }, all$2(h, node));
    }
    else {
        return h(node, 'span', { class: 'reference role unhandled' }, [
            h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
            h(node, 'code', {}, [u('text', node.identifier)]),
        ]);
    }
};
// TODO: The defaultHandler treats the first row (and only the first row)
//       header; the mdast `tableCell.header` property is not respected.
//       For that, we need to entirely rewrite this handler.
const table$1 = (h, node) => {
    node.data = { hProperties: { align: node.align } };
    delete node.align;
    return handlers$1.table(h, node);
};
const code$1 = (h, node) => {
    const value = node.value ? node.value + '\n' : '';
    const props = {};
    if (node.identifier) {
        props.id = node.identifier;
    }
    props.className =
        classNames({ ['language-' + node.lang]: node.lang }, node.class) || undefined;
    const code = h(node, 'code', props, [u('text', value)]);
    return h(node.position, 'pre', [code]);
};
const mystToHast = (opts) => (tree) => {
    return toHast(tree, Object.assign(Object.assign({}, opts), { handlers: Object.assign({ admonition,
            admonitionTitle,
            container,
            image: image$1,
            caption,
            captionNumber,
            abbreviation,
            subscript,
            superscript,
            math,
            inlineMath,
            definitionList,
            definitionTerm,
            definitionDescription,
            role,
            directive,
            block: block$1,
            comment: comment$3,
            heading: heading$1,
            contentReference,
            code: code$1,
            table: table$1 }, opts === null || opts === void 0 ? void 0 : opts.handlers) }));
};

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('hast').Element} Element
 *
 * @typedef {string} TagName
 * @typedef {null|undefined|TagName|TestFunctionAnything|Array.<TagName|TestFunctionAnything>} Test
 */

/**
 * @template {Element} T
 * @typedef {null|undefined|T['tagName']|TestFunctionPredicate<T>|Array.<T['tagName']|TestFunctionPredicate<T>>} PredicateTest
 */

/**
 * Check if an element passes a test
 *
 * @callback TestFunctionAnything
 * @param {Element} element
 * @param {number|null|undefined} [index]
 * @param {Parent|null|undefined} [parent]
 * @returns {boolean|void}
 */

/**
 * Check if an element passes a certain node test
 *
 * @template {Element} X
 * @callback TestFunctionPredicate
 * @param {Element} element
 * @param {number|null|undefined} [index]
 * @param {Parent|null|undefined} [parent]
 * @returns {element is X}
 */

/**
 * Check if a node is an element and passes a certain node test
 *
 * @callback AssertAnything
 * @param {unknown} [node]
 * @param {number|null|undefined} [index]
 * @param {Parent|null|undefined} [parent]
 * @returns {boolean}
 */

/**
 * Check if a node is an element and passes a certain node test
 *
 * @template {Element} Y
 * @callback AssertPredicate
 * @param {unknown} [node]
 * @param {number|null|undefined} [index]
 * @param {Parent|null|undefined} [parent]
 * @returns {node is Y}
 */
// Check if `node` is an `element` and whether it passes the given test.
const isElement$1 =
/**
 * Check if a node is an element and passes a test.
 * When a `parent` node is known the `index` of node should also be given.
 *
 * @type {(
 *   (() => false) &
 *   (<T extends Element = Element>(node: unknown, test?: PredicateTest<T>, index?: number, parent?: Parent, context?: unknown) => node is T) &
 *   ((node: unknown, test: Test, index?: number, parent?: Parent, context?: unknown) => boolean)
 * )}
 */

/**
 * Check if a node passes a test.
 * When a `parent` node is known the `index` of node should also be given.
 *
 * @param {unknown} [node] Node to check
 * @param {Test} [test] When nullish, checks if `node` is a `Node`.
 * When `string`, works like passing `function (node) {return node.type === test}`.
 * When `function` checks if function passed the node is true.
 * When `array`, checks any one of the subtests pass.
 * @param {number} [index] Position of `node` in `parent`
 * @param {Parent} [parent] Parent of `node`
 * @param {unknown} [context] Context object to invoke `test` with
 * @returns {boolean} Whether test passed and `node` is an `Element` (object with `type` set to `element` and `tagName` set to a non-empty string).
 */
// eslint-disable-next-line max-params
function (node, test, index, parent, context) {
  const check = convertElement(test);

  if (index !== undefined && index !== null && (typeof index !== 'number' || index < 0 || index === Number.POSITIVE_INFINITY)) {
    throw new Error('Expected positive finite index for child node');
  }

  if (parent !== undefined && parent !== null && (!parent.type || !parent.children)) {
    throw new Error('Expected parent node');
  } // @ts-expect-error Looks like a node.


  if (!node || !node.type || typeof node.type !== 'string') {
    return false;
  }

  if ((parent === undefined || parent === null) !== (index === undefined || index === null)) {
    throw new Error('Expected both parent and index');
  }

  return check.call(context, node, index, parent);
};
const convertElement =
/**
 * @type {(
 *   (<T extends Element>(test: T['tagName']|TestFunctionPredicate<T>) => AssertPredicate<T>) &
 *   ((test?: Test) => AssertAnything)
 * )}
 */

/**
 * Generate an assertion from a check.
 * @param {Test} [test]
 * When nullish, checks if `node` is a `Node`.
 * When `string`, works like passing `function (node) {return node.type === test}`.
 * When `function` checks if function passed the node is true.
 * When `object`, checks that all keys in test are in node, and that they have (strictly) equal values.
 * When `array`, checks any one of the subtests pass.
 * @returns {AssertAnything}
 */
function (test) {
  if (test === undefined || test === null) {
    return element$2;
  }

  if (typeof test === 'string') {
    return tagNameFactory$1(test);
  }

  if (typeof test === 'object') {
    return anyFactory(test);
  }

  if (typeof test === 'function') {
    return castFactory(test);
  }

  throw new Error('Expected function, string, or array as test');
};
/**
 * @param {Array.<TagName|TestFunctionAnything>} tests
 * @returns {AssertAnything}
 */

function anyFactory(tests) {
  /** @type {Array.<AssertAnything>} */
  const checks = [];
  let index = -1;

  while (++index < tests.length) {
    checks[index] = convertElement(tests[index]);
  }

  return castFactory(any);
  /**
   * @this {unknown}
   * @param {unknown[]} parameters
   * @returns {boolean}
   */

  function any(...parameters) {
    let index = -1;

    while (++index < checks.length) {
      if (checks[index].call(this, ...parameters)) {
        return true;
      }
    }

    return false;
  }
}
/**
 * Utility to convert a string into a function which checks a given node’s tag
 * name for said string.
 *
 * @param {TagName} check
 * @returns {AssertAnything}
 */


function tagNameFactory$1(check) {
  return tagName;
  /**
   * @param {unknown} node
   * @returns {boolean}
   */

  function tagName(node) {
    return element$2(node) && node.tagName === check;
  }
}
/**
 * @param {TestFunctionAnything} check
 * @returns {AssertAnything}
 */


function castFactory(check) {
  return assertion;
  /**
   * @this {unknown}
   * @param {unknown} node
   * @param {Array.<unknown>} parameters
   * @returns {boolean}
   */

  function assertion(node, ...parameters) {
    // @ts-expect-error: fine.
    return element$2(node) && Boolean(check.call(this, node, ...parameters));
  }
}
/**
 * Utility to return true if this is an element.
 * @param {unknown} node
 * @returns {node is Element}
 */


function element$2(node) {
  return Boolean(node && typeof node === 'object' && // @ts-expect-error Looks like a node.
  node.type === 'element' && // @ts-expect-error Looks like an element.
  typeof node.tagName === 'string');
}

/**
 * @typedef {import('hast').Element & {tagName: 'audio'|'canvas'|'embed'|'iframe'|'img'|'math'|'object'|'picture'|'svg'|'video'}} Embedded
 * @typedef {import('hast-util-is-element').AssertPredicate<Embedded>} AssertEmbedded
 */
/**
 * Check if a node is an embedded element.
 * @type {AssertEmbedded}
 */
// @ts-ignore Sure, the assertion matches.

const embedded = convertElement(['audio', 'canvas', 'embed', 'iframe', 'img', 'math', 'object', 'picture', 'svg', 'video']);

/**
 * @param {unknown} thing
 * @returns {boolean}
 */
function whitespace(thing) {
  /** @type {string} */
  var value = // @ts-ignore looks like a node.
  thing && typeof thing === 'object' && thing.type === 'text' ? // @ts-ignore looks like a text.
  thing.value || '' : thing; // HTML whitespace expression.
  // See <https://html.spec.whatwg.org/#space-character>.

  return typeof value === 'string' && value.replace(/[ \t\n\f\r]/g, '') === '';
}

// See: <https://html.spec.whatwg.org/#the-css-user-agent-style-sheet-and-presentational-hints>
const blocks = ['address', // Flow content.
'article', // Sections and headings.
'aside', // Sections and headings.
'blockquote', // Flow content.
'body', // Page.
'br', // Contribute whitespace intrinsically.
'caption', // Similar to block.
'center', // Flow content, legacy.
'col', // Similar to block.
'colgroup', // Similar to block.
'dd', // Lists.
'dialog', // Flow content.
'dir', // Lists, legacy.
'div', // Flow content.
'dl', // Lists.
'dt', // Lists.
'figcaption', // Flow content.
'figure', // Flow content.
'footer', // Flow content.
'form', // Flow content.
'h1', // Sections and headings.
'h2', // Sections and headings.
'h3', // Sections and headings.
'h4', // Sections and headings.
'h5', // Sections and headings.
'h6', // Sections and headings.
'head', // Page.
'header', // Flow content.
'hgroup', // Sections and headings.
'hr', // Flow content.
'html', // Page.
'legend', // Flow content.
'li', // Block-like.
'li', // Similar to block.
'listing', // Flow content, legacy
'main', // Flow content.
'menu', // Lists.
'nav', // Sections and headings.
'ol', // Lists.
'optgroup', // Similar to block.
'option', // Similar to block.
'p', // Flow content.
'plaintext', // Flow content, legacy
'pre', // Flow content.
'section', // Sections and headings.
'summary', // Similar to block.
'table', // Similar to block.
'tbody', // Similar to block.
'td', // Block-like.
'td', // Similar to block.
'tfoot', // Similar to block.
'th', // Block-like.
'th', // Similar to block.
'thead', // Similar to block.
'tr', // Similar to block.
'ul', // Lists.
'wbr', // Contribute whitespace intrinsically.
'xmp' // Flow content, legacy
];

const content$1 = [// Form.
'button', 'input', 'select', 'textarea'];

const skippable$1 = ['area', 'base', 'basefont', 'dialog', 'datalist', 'head', 'link', 'meta', 'noembed', 'noframes', 'param', 'rp', 'script', 'source', 'style', 'template', 'track', 'title'];

/**
 * @fileoverview
 *   Collapse whitespace.
 *
 *   Normally, collapses to a single space.
 *   If `newlines: true`, collapses whitespace containing newlines to `'\n'`
 *   instead of `' '`.
 * @example
 *   <h1>Heading</h1>
 *   <p><strong>This</strong> and <em>that</em></p>
 */
const ignorableNode = convert$2(['doctype', 'comment']);
/**
 * Collapse whitespace.
 *
 * Normally, collapses to a single space.
 * If `newlines: true`, collapses whitespace containing newlines to `'\n'`
 * instead of `' '`.
 *
 * @type {import('unified').Plugin<[Options?] | void[], Root>}
 */

function rehypeMinifyWhitespace(options = {}) {
  const collapse = collapseFactory(options.newlines ? replaceNewlines : replaceWhitespace);
  return tree => {
    minify$1(tree, {
      collapse,
      whitespace: 'normal'
    });
  };
}
/**
 * @param {Node} node
 * @param {Context} context
 * @returns {Result}
 */

function minify$1(node, context) {
  if ('children' in node) {
    const settings = Object.assign({}, context);

    if (node.type === 'root' || blocklike(node)) {
      settings.before = true;
      settings.after = true;
    }

    settings.whitespace = inferWhiteSpace(node, context);
    return all$1(node, settings);
  }

  if (node.type === 'text') {
    if (context.whitespace === 'normal') {
      return minifyText(node, context);
    } // Naïve collapse, but no trimming:


    if (context.whitespace === 'nowrap') {
      node.value = context.collapse(node.value);
    } // The `pre-wrap` or `pre` whitespace settings are neither collapsed nor
    // trimmed.

  }

  return {
    remove: false,
    ignore: ignorableNode(node),
    stripAtStart: false
  };
}
/**
 * @param {Text} node
 * @param {Context} context
 * @returns {Result}
 */


function minifyText(node, context) {
  const value = context.collapse(node.value);
  const result = {
    remove: false,
    ignore: false,
    stripAtStart: false
  };
  let start = 0;
  let end = value.length;

  if (context.before && removable(value.charAt(0))) {
    start++;
  }

  if (start !== end && removable(value.charAt(end - 1))) {
    if (context.after) {
      end--;
    } else {
      result.stripAtStart = true;
    }
  }

  if (start === end) {
    result.remove = true;
  } else {
    node.value = value.slice(start, end);
  }

  return result;
}
/**
 * @param {Root|Element} parent
 * @param {Context} context
 * @returns {Result}
 */


function all$1(parent, context) {
  let before = context.before;
  const after = context.after;
  const children = parent.children;
  let length = children.length;
  let index = -1;

  while (++index < length) {
    const result = minify$1(children[index], Object.assign({}, context, {
      before,
      after: collapsableAfter(children, index, after)
    }));

    if (result.remove) {
      children.splice(index, 1);
      index--;
      length--;
    } else if (!result.ignore) {
      before = result.stripAtStart;
    } // If this element, such as a `<select>` or `<img>`, contributes content
    // somehow, allow whitespace again.


    if (content(children[index])) {
      before = false;
    }
  }

  return {
    remove: false,
    ignore: false,
    stripAtStart: Boolean(before || after)
  };
}
/**
 * @param {Node[]} nodes
 * @param {number} index
 * @param {boolean|undefined} [after]
 * @returns {boolean|undefined}
 */


function collapsableAfter(nodes, index, after) {
  while (++index < nodes.length) {
    const node = nodes[index];
    let result = inferBoundary(node);

    if (result === undefined && 'children' in node && !skippable(node)) {
      result = collapsableAfter(node.children, -1);
    }

    if (typeof result === 'boolean') {
      return result;
    }
  }

  return after;
}
/**
 * Infer two types of boundaries:
 *
 * 1. `true` — boundary for which whitespace around it does not contribute
 *    anything
 * 2. `false` — boundary for which whitespace around it *does* contribute
 *
 * No result (`undefined`) is returned if it is unknown.
 *
 * @param {Node} node
 * @returns {boolean|undefined}
 */


function inferBoundary(node) {
  if (node.type === 'element') {
    if (content(node)) {
      return false;
    }

    if (blocklike(node)) {
      return true;
    } // Unknown: either depends on siblings if embedded or metadata, or on
    // children.

  } else if (node.type === 'text') {
    if (!whitespace(node)) {
      return false;
    }
  } else if (!ignorableNode(node)) {
    return false;
  }
}
/**
 * Infer whether a node is skippable.
 *
 * @param {Node} node
 * @returns {boolean}
 */


function content(node) {
  return embedded(node) || isElement$1(node, content$1);
}
/**
 * See: <https://html.spec.whatwg.org/#the-css-user-agent-style-sheet-and-presentational-hints>
 *
 * @param {Element} node
 * @returns {boolean}
 */


function blocklike(node) {
  return isElement$1(node, blocks);
}
/**
 * @param {Element|Root} node
 * @returns {boolean}
 */


function skippable(node) {
  return Boolean('properties' in node && node.properties && node.properties.hidden) || ignorableNode(node) || isElement$1(node, skippable$1);
}
/**
 * @param {string} character
 * @returns {boolean}
 */


function removable(character) {
  return character === ' ' || character === '\n';
}
/**
 * @param {string} value
 * @returns {string}
 */


function replaceNewlines(value) {
  const match = /\r?\n|\r/.exec(value);
  return match ? match[0] : ' ';
}
/**
 * @returns {string}
 */


function replaceWhitespace() {
  return ' ';
}
/**
 * @param {(value: string) => string} replace
 */


function collapseFactory(replace) {
  return collapse;
  /**
   * @param {string} value
   * @returns {string}
   */

  function collapse(value) {
    return String(value).replace(/[\t\n\v\f\r ]+/g, replace);
  }
}
/**
 * We don’t support void elements here (so `nobr wbr` -> `normal` is ignored).
 *
 * @param {Root|Element} node
 * @param {Context} context
 * @returns {Whitespace}
 */


function inferWhiteSpace(node, context) {
  if ('tagName' in node && node.properties) {
    switch (node.tagName) {
      case 'listing':
      case 'plaintext':
      case 'xmp':
        return 'pre';

      case 'nobr':
        return 'nowrap';

      case 'pre':
        return node.properties.wrap ? 'pre-wrap' : 'pre';

      case 'td':
      case 'th':
        return node.properties.noWrap ? 'nowrap' : context.whitespace;

      case 'textarea':
        return 'pre-wrap';
    }
  }

  return context.whitespace;
}

var own$7 = {}.hasOwnProperty;
/**
 * Check if `node` has a set `name` property.
 *
 * @param {unknown} node
 * @param {string} name
 * @returns {boolean}
 */

function hasProperty$1(node, name) {
  /** @type {unknown} */
  var value = name && node && typeof node === 'object' && // @ts-ignore Looks like a node.
  node.type === 'element' && // @ts-ignore Looks like an element.
  node.properties && // @ts-ignore Looks like an element.
  own$7.call(node.properties, name) && // @ts-ignore Looks like an element.
  node.properties[name];
  return value !== null && value !== undefined && value !== false;
}

var convert_1 = convert$1;

function convert$1(test) {
  if (typeof test === 'string') {
    return tagNameFactory(test);
  }

  if (test === null || test === undefined) {
    return element$1;
  }

  if (typeof test === 'object') {
    return any(test);
  }

  if (typeof test === 'function') {
    return callFactory(test);
  }

  throw new Error('Expected function, string, or array as test');
}

function convertAll(tests) {
  var length = tests.length;
  var index = -1;
  var results = [];

  while (++index < length) {
    results[index] = convert$1(tests[index]);
  }

  return results;
}

function any(tests) {
  var checks = convertAll(tests);
  var length = checks.length;
  return matches;

  function matches() {
    var index = -1;

    while (++index < length) {
      if (checks[index].apply(this, arguments)) {
        return true;
      }
    }

    return false;
  }
} // Utility to convert a string a tag name check.


function tagNameFactory(test) {
  return tagName;

  function tagName(node) {
    return element$1(node) && node.tagName === test;
  }
} // Utility to convert a function check.


function callFactory(test) {
  return call;

  function call(node) {
    return element$1(node) && Boolean(test.apply(this, arguments));
  }
} // Utility to return true if this is an element.


function element$1(node) {
  return node && typeof node === 'object' && node.type === 'element' && typeof node.tagName === 'string';
}

var convert = convert_1;
var hastUtilIsElement = isElement;
isElement.convert = convert; // Check if if `node` is an `element` and whether it passes the given test.

function isElement(node, test, index, parent, context) {
  var hasParent = parent !== null && parent !== undefined;
  var hasIndex = index !== null && index !== undefined;
  var check = convert(test);

  if (hasIndex && (typeof index !== 'number' || index < 0 || index === Infinity)) {
    throw new Error('Expected positive finite index for child node');
  }

  if (hasParent && (!parent.type || !parent.children)) {
    throw new Error('Expected parent node');
  }

  if (!node || !node.type || typeof node.type !== 'string') {
    return false;
  }

  if (hasParent !== hasIndex) {
    throw new Error('Expected both parent and index');
  }

  return check.call(context, node, index, parent);
}

var own$6 = {}.hasOwnProperty;
var hastUtilHasProperty = hasProperty; // Check if `node` has a set `name` property.

function hasProperty(node, name) {
  var props;
  var value;

  if (!node || !name || typeof node !== 'object' || node.type !== 'element') {
    return false;
  }

  props = node.properties;
  value = props && own$6.call(props, name) && props[name];
  return value !== null && value !== undefined && value !== false;
}

/**
 * @fileoverview
 *   Check if a `link` element is “Body OK”.
 * @longdescription
 *   ## Use
 *
 *   ```js
 *   var h = require('hastscript')
 *   var ok = require('hast-util-is-body-ok-link')
 *
 *   ok(h('link', {itemProp: 'foo'})) //=> true
 *   ok(h('link', {rel: ['stylesheet'], href: 'index.css'})) //=> true
 *   ok(h('link', {rel: ['author'], href: 'index.css'})) //=> false
 *   ```
 *
 *   ## API
 *
 *   ### `isBodyOkLink(node)`
 *
 *   * Return `true` for `link` elements with an `itemProp`
 *   * Return `true` for `link` elements with a `rel` list where one or more
 *     entries are `pingback`, `prefetch`, or `stylesheet`.
 */

var is = hastUtilIsElement;
var has$1 = hastUtilHasProperty;
var hastUtilIsBodyOkLink = ok;
var list$1 = ['pingback', 'prefetch', 'stylesheet'];

function ok(node) {
  var length;
  var index;
  var rel;

  if (!is(node, 'link')) {
    return false;
  }

  if (has$1(node, 'itemProp')) {
    return true;
  }

  rel = (node.properties || {}).rel || [];
  length = rel.length;
  index = -1;

  if (rel.length === 0) {
    return false;
  }

  while (++index < length) {
    if (list$1.indexOf(rel[index]) === -1) {
      return false;
    }
  }

  return true;
}

var bodyOkLink = hastUtilIsBodyOkLink;

var basic = convertElement(['a', 'abbr', // `area` is in fact only phrasing if it is inside a `map` element.
// However, since `area`s are required to be inside a `map` element, and it’s
// a rather involved check, it’s ignored here for now.
'area', 'b', 'bdi', 'bdo', 'br', 'button', 'cite', 'code', 'data', 'datalist', 'del', 'dfn', 'em', 'i', 'input', 'ins', 'kbd', 'keygen', 'label', 'map', 'mark', 'meter', 'noscript', 'output', 'progress', 'q', 'ruby', 's', 'samp', 'script', 'select', 'small', 'span', 'strong', 'sub', 'sup', 'template', 'textarea', 'time', 'u', 'var', 'wbr']);
var meta = convertElement('meta');
/**
 * @param {unknown} node
 * @returns {boolean}
 */

function phrasing(node) {
  return (// @ts-ignore Looks like a text.
    node && node.type === 'text' || basic(node) || embedded(node) || bodyOkLink(node) || meta(node) && hasProperty$1(node, 'itemProp')
  );
}

/**
 * @fileoverview
 *   List of whitespace sensitive HTML tag names
 * @longdescription
 *   ## Use
 *
 *   ```js
 *   import {whitespaceSensitiveTagNames} from 'html-whitespace-sensitive-tag-names'
 *
 *   whitespaceSensitiveTagNames
 *   //=> ['pre', 'script', 'style', 'textarea']
 *   ```
 *
 *   ## API
 *
 *   ### `whitespaceSensitiveTagNames`
 *
 *   List of whitespace sensitive HTML tag names (`string[]`).
 */
const whitespaceSensitiveTagNames = ['pre', 'script', 'style', 'textarea'];

/**
 * @typedef {import('hast').Root} Root
 * @typedef {Root['children'][number]} Child
 * @typedef {import('hast').Element} Element
 * @typedef {Root|Child} Node
 *
 * @typedef Options
 *   Configuration.
 * @property {number|string} [indent=2]
 *   Indentation per level (`number`, `string`, default: `2`).
 *   When number, uses that amount of spaces.
 *   When `string`, uses that per indentation level.
 * @property {boolean} [indentInitial=true]
 *   Whether to indent the first level (`boolean`, default: `true`).
 *   This is usually the `<html>`, thus not indenting `head` and `body`.
 * @property {Array<string>} [blanks=[]]
 *   List of tag names to join with a blank line (`Array<string>`, default:
 *   `[]`).
 *   These tags, when next to each other, are joined by a blank line (`\n\n`).
 *   For example, when `['head', 'body']` is given, a blank line is added
 *   between these two.
 */
const minify = rehypeMinifyWhitespace({
  newlines: true
});
/**
 * Format whitespace in HTML.
 *
 * @type {import('unified').Plugin<[Options?] | Array<void>, Root>}
 */

function rehypeFormat(options = {}) {
  let indent = options.indent || 2;
  let indentInitial = options.indentInitial;

  if (typeof indent === 'number') {
    indent = ' '.repeat(indent);
  } // Default to indenting the initial level.


  if (indentInitial === null || indentInitial === undefined) {
    indentInitial = true;
  }

  return tree => {
    /** @type {boolean|undefined} */
    let head; // @ts-expect-error: fine, it’s a sync transformer.

    minify(tree); // eslint-disable-next-line complexity

    visitParents$2(tree, (node, parents) => {
      let index = -1;

      if (!('children' in node)) {
        return;
      }

      if (isElement$1(node, 'head')) {
        head = true;
      }

      if (head && isElement$1(node, 'body')) {
        head = undefined;
      }

      if (isElement$1(node, whitespaceSensitiveTagNames)) {
        return SKIP$2;
      }

      const children = node.children;
      let level = parents.length; // Don’t indent content of whitespace-sensitive nodes / inlines.

      if (children.length === 0 || !padding(node, head)) {
        return;
      }

      if (!indentInitial) {
        level--;
      }
      /** @type {boolean|undefined} */


      let eol; // Indent newlines in `text`.

      while (++index < children.length) {
        const child = children[index];

        if (child.type === 'text' || child.type === 'comment') {
          if (child.value.includes('\n')) {
            eol = true;
          }

          child.value = child.value.replace(/ *\n/g, '$&' + String(indent).repeat(level));
        }
      }
      /** @type {Array<Child>} */


      const result = [];
      /** @type {Child|undefined} */

      let previous;
      index = -1;

      while (++index < children.length) {
        const child = children[index];

        if (padding(child, head) || eol && !index) {
          addBreak(result, level, child);
          eol = true;
        }

        previous = child;
        result.push(child);
      }

      if (previous && (eol || padding(previous, head))) {
        // Ignore trailing whitespace (if that already existed), as we’ll add
        // properly indented whitespace.
        if (whitespace(previous)) {
          result.pop();
          previous = result[result.length - 1];
        }

        addBreak(result, level - 1);
      }

      node.children = result;
    });
  };
  /**
   * @param {Array<Child>} list
   * @param {number} level
   * @param {Child} [next]
   * @returns {void}
   */

  function addBreak(list, level, next) {
    const tail = list[list.length - 1];
    const previous = whitespace(tail) ? list[list.length - 2] : tail;
    const replace = (blank(previous) && blank(next) ? '\n\n' : '\n') + String(indent).repeat(Math.max(level, 0));

    if (tail && tail.type === 'text') {
      tail.value = whitespace(tail) ? replace : tail.value + replace;
    } else {
      list.push({
        type: 'text',
        value: replace
      });
    }
  }
  /**
   * @param {Node|undefined} node
   * @returns {boolean}
   */


  function blank(node) {
    return Boolean(node && node.type === 'element' && options.blanks && options.blanks.length > 0 && options.blanks.includes(node.tagName));
  }
}
/**
 * @param {Node} node
 * @param {boolean|undefined} head
 * @returns {boolean}
 */

function padding(node, head) {
  return node.type === 'root' || (node.type === 'element' ? head || isElement$1(node, 'script') || embedded(node) || !phrasing(node) : false);
}

const formatHtml = function formatHtml(opt) {
    if (!opt)
        return () => undefined;
    return rehypeFormat(typeof opt === 'boolean' ? {} : opt);
};

function getFrontmatter(tree, remove = true) {
    const possibleYaml = tree.children[0];
    if ((possibleYaml === null || possibleYaml === void 0 ? void 0 : possibleYaml.type) !== 'code' || (possibleYaml === null || possibleYaml === void 0 ? void 0 : possibleYaml.lang) !== 'yaml')
        return undefined;
    const data = jsYaml.load(possibleYaml.value);
    if (remove)
        tree.children.splice(0, 1);
    return data;
}

var helpers$1 = {};

var parse_link_label = function parseLinkLabel(state, start, disableNested) {
  var level,
      found,
      marker,
      prevPos,
      labelEnd = -1,
      max = state.posMax,
      oldPos = state.pos;
  state.pos = start + 1;
  level = 1;

  while (state.pos < max) {
    marker = state.src.charCodeAt(state.pos);

    if (marker === 0x5D
    /* ] */
    ) {
      level--;

      if (level === 0) {
        found = true;
        break;
      }
    }

    prevPos = state.pos;
    state.md.inline.skipToken(state);

    if (marker === 0x5B
    /* [ */
    ) {
      if (prevPos === state.pos - 1) {
        // increase level if we find text `[`, which is not a part of any token
        level++;
      } else if (disableNested) {
        state.pos = oldPos;
        return -1;
      }
    }
  }

  if (found) {
    labelEnd = state.pos;
  } // restore old state


  state.pos = oldPos;
  return labelEnd;
};

var unescapeAll$2 = utils$2.unescapeAll;

var parse_link_destination = function parseLinkDestination(str, pos, max) {
  var code,
      level,
      lines = 0,
      start = pos,
      result = {
    ok: false,
    pos: 0,
    lines: 0,
    str: ''
  };

  if (str.charCodeAt(pos) === 0x3C
  /* < */
  ) {
    pos++;

    while (pos < max) {
      code = str.charCodeAt(pos);

      if (code === 0x0A
      /* \n */
      ) {
        return result;
      }

      if (code === 0x3C
      /* < */
      ) {
        return result;
      }

      if (code === 0x3E
      /* > */
      ) {
        result.pos = pos + 1;
        result.str = unescapeAll$2(str.slice(start + 1, pos));
        result.ok = true;
        return result;
      }

      if (code === 0x5C
      /* \ */
      && pos + 1 < max) {
        pos += 2;
        continue;
      }

      pos++;
    } // no closing '>'


    return result;
  } // this should be ... } else { ... branch


  level = 0;

  while (pos < max) {
    code = str.charCodeAt(pos);

    if (code === 0x20) {
      break;
    } // ascii control characters


    if (code < 0x20 || code === 0x7F) {
      break;
    }

    if (code === 0x5C
    /* \ */
    && pos + 1 < max) {
      if (str.charCodeAt(pos + 1) === 0x20) {
        break;
      }

      pos += 2;
      continue;
    }

    if (code === 0x28
    /* ( */
    ) {
      level++;

      if (level > 32) {
        return result;
      }
    }

    if (code === 0x29
    /* ) */
    ) {
      if (level === 0) {
        break;
      }

      level--;
    }

    pos++;
  }

  if (start === pos) {
    return result;
  }

  if (level !== 0) {
    return result;
  }

  result.str = unescapeAll$2(str.slice(start, pos));
  result.lines = lines;
  result.pos = pos;
  result.ok = true;
  return result;
};

var unescapeAll$1 = utils$2.unescapeAll;

var parse_link_title = function parseLinkTitle(str, pos, max) {
  var code,
      marker,
      lines = 0,
      start = pos,
      result = {
    ok: false,
    pos: 0,
    lines: 0,
    str: ''
  };

  if (pos >= max) {
    return result;
  }

  marker = str.charCodeAt(pos);

  if (marker !== 0x22
  /* " */
  && marker !== 0x27
  /* ' */
  && marker !== 0x28
  /* ( */
  ) {
    return result;
  }

  pos++; // if opening marker is "(", switch it to closing marker ")"

  if (marker === 0x28) {
    marker = 0x29;
  }

  while (pos < max) {
    code = str.charCodeAt(pos);

    if (code === marker) {
      result.pos = pos + 1;
      result.lines = lines;
      result.str = unescapeAll$1(str.slice(start + 1, pos));
      result.ok = true;
      return result;
    } else if (code === 0x28
    /* ( */
    && marker === 0x29
    /* ) */
    ) {
      return result;
    } else if (code === 0x0A) {
      lines++;
    } else if (code === 0x5C
    /* \ */
    && pos + 1 < max) {
      pos++;

      if (str.charCodeAt(pos) === 0x0A) {
        lines++;
      }
    }

    pos++;
  }

  return result;
};

helpers$1.parseLinkLabel = parse_link_label;
helpers$1.parseLinkDestination = parse_link_destination;
helpers$1.parseLinkTitle = parse_link_title;

/**
 * class Renderer
 *
 * Generates HTML from parsed token stream. Each instance has independent
 * copy of rules. Those can be rewritten with ease. Also, you can add new
 * rules if you create plugin and adds new token types.
 **/

var assign$1 = utils$2.assign;
var unescapeAll = utils$2.unescapeAll;
var escapeHtml = utils$2.escapeHtml; ////////////////////////////////////////////////////////////////////////////////

var default_rules = {};

default_rules.code_inline = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];
  return '<code' + slf.renderAttrs(token) + '>' + escapeHtml(tokens[idx].content) + '</code>';
};

default_rules.code_block = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];
  return '<pre' + slf.renderAttrs(token) + '><code>' + escapeHtml(tokens[idx].content) + '</code></pre>\n';
};

default_rules.fence = function (tokens, idx, options, env, slf) {
  var token = tokens[idx],
      info = token.info ? unescapeAll(token.info).trim() : '',
      langName = '',
      langAttrs = '',
      highlighted,
      i,
      arr,
      tmpAttrs,
      tmpToken;

  if (info) {
    arr = info.split(/(\s+)/g);
    langName = arr[0];
    langAttrs = arr.slice(2).join('');
  }

  if (options.highlight) {
    highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }

  if (highlighted.indexOf('<pre') === 0) {
    return highlighted + '\n';
  } // If language exists, inject class gently, without modifying original token.
  // May be, one day we will add .deepClone() for token and simplify this part, but
  // now we prefer to keep things local.


  if (info) {
    i = token.attrIndex('class');
    tmpAttrs = token.attrs ? token.attrs.slice() : [];

    if (i < 0) {
      tmpAttrs.push(['class', options.langPrefix + langName]);
    } else {
      tmpAttrs[i] = tmpAttrs[i].slice();
      tmpAttrs[i][1] += ' ' + options.langPrefix + langName;
    } // Fake token just to render attributes


    tmpToken = {
      attrs: tmpAttrs
    };
    return '<pre><code' + slf.renderAttrs(tmpToken) + '>' + highlighted + '</code></pre>\n';
  }

  return '<pre><code' + slf.renderAttrs(token) + '>' + highlighted + '</code></pre>\n';
};

default_rules.image = function (tokens, idx, options, env, slf) {
  var token = tokens[idx]; // "alt" attr MUST be set, even if empty. Because it's mandatory and
  // should be placed on proper position for tests.
  //
  // Replace content with actual value

  token.attrs[token.attrIndex('alt')][1] = slf.renderInlineAsText(token.children, options, env);
  return slf.renderToken(tokens, idx, options);
};

default_rules.hardbreak = function (tokens, idx, options
/*, env */
) {
  return options.xhtmlOut ? '<br />\n' : '<br>\n';
};

default_rules.softbreak = function (tokens, idx, options
/*, env */
) {
  return options.breaks ? options.xhtmlOut ? '<br />\n' : '<br>\n' : '\n';
};

default_rules.text = function (tokens, idx
/*, options, env */
) {
  return escapeHtml(tokens[idx].content);
};

default_rules.html_block = function (tokens, idx
/*, options, env */
) {
  return tokens[idx].content;
};

default_rules.html_inline = function (tokens, idx
/*, options, env */
) {
  return tokens[idx].content;
};
/**
 * new Renderer()
 *
 * Creates new [[Renderer]] instance and fill [[Renderer#rules]] with defaults.
 **/


function Renderer$1() {
  /**
   * Renderer#rules -> Object
   *
   * Contains render rules for tokens. Can be updated and extended.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.renderer.rules.strong_open  = function () { return '<b>'; };
   * md.renderer.rules.strong_close = function () { return '</b>'; };
   *
   * var result = md.renderInline(...);
   * ```
   *
   * Each rule is called as independent static function with fixed signature:
   *
   * ```javascript
   * function my_token_render(tokens, idx, options, env, renderer) {
   *   // ...
   *   return renderedHTML;
   * }
   * ```
   *
   * See [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js)
   * for more details and examples.
   **/
  this.rules = assign$1({}, default_rules);
}
/**
 * Renderer.renderAttrs(token) -> String
 *
 * Render token attributes to string.
 **/


Renderer$1.prototype.renderAttrs = function renderAttrs(token) {
  var i, l, result;

  if (!token.attrs) {
    return '';
  }

  result = '';

  for (i = 0, l = token.attrs.length; i < l; i++) {
    result += ' ' + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
  }

  return result;
};
/**
 * Renderer.renderToken(tokens, idx, options) -> String
 * - tokens (Array): list of tokens
 * - idx (Numbed): token index to render
 * - options (Object): params of parser instance
 *
 * Default token renderer. Can be overriden by custom function
 * in [[Renderer#rules]].
 **/


Renderer$1.prototype.renderToken = function renderToken(tokens, idx, options) {
  var nextToken,
      result = '',
      needLf = false,
      token = tokens[idx]; // Tight list paragraphs

  if (token.hidden) {
    return '';
  } // Insert a newline between hidden paragraph and subsequent opening
  // block-level tag.
  //
  // For example, here we should insert a newline before blockquote:
  //  - a
  //    >
  //


  if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
    result += '\n';
  } // Add token name, e.g. `<img`


  result += (token.nesting === -1 ? '</' : '<') + token.tag; // Encode attributes, e.g. `<img src="foo"`

  result += this.renderAttrs(token); // Add a slash for self-closing tags, e.g. `<img src="foo" /`

  if (token.nesting === 0 && options.xhtmlOut) {
    result += ' /';
  } // Check if we need to add a newline after this tag


  if (token.block) {
    needLf = true;

    if (token.nesting === 1) {
      if (idx + 1 < tokens.length) {
        nextToken = tokens[idx + 1];

        if (nextToken.type === 'inline' || nextToken.hidden) {
          // Block-level tag containing an inline tag.
          //
          needLf = false;
        } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
          // Opening tag + closing tag of the same type. E.g. `<li></li>`.
          //
          needLf = false;
        }
      }
    }
  }

  result += needLf ? '>\n' : '>';
  return result;
};
/**
 * Renderer.renderInline(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to render
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * The same as [[Renderer.render]], but for single token of `inline` type.
 **/


Renderer$1.prototype.renderInline = function (tokens, options, env) {
  var type,
      result = '',
      rules = this.rules;

  for (var i = 0, len = tokens.length; i < len; i++) {
    type = tokens[i].type;

    if (typeof rules[type] !== 'undefined') {
      result += rules[type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options);
    }
  }

  return result;
};
/** internal
 * Renderer.renderInlineAsText(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to render
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * Special kludge for image `alt` attributes to conform CommonMark spec.
 * Don't try to use it! Spec requires to show `alt` content with stripped markup,
 * instead of simple escaping.
 **/


Renderer$1.prototype.renderInlineAsText = function (tokens, options, env) {
  var result = '';

  for (var i = 0, len = tokens.length; i < len; i++) {
    if (tokens[i].type === 'text') {
      result += tokens[i].content;
    } else if (tokens[i].type === 'image') {
      result += this.renderInlineAsText(tokens[i].children, options, env);
    } else if (tokens[i].type === 'softbreak') {
      result += '\n';
    }
  }

  return result;
};
/**
 * Renderer.render(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to render
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * Takes token stream and generates HTML. Probably, you will never need to call
 * this method directly.
 **/


Renderer$1.prototype.render = function (tokens, options, env) {
  var i,
      len,
      type,
      result = '',
      rules = this.rules;

  for (i = 0, len = tokens.length; i < len; i++) {
    type = tokens[i].type;

    if (type === 'inline') {
      result += this.renderInline(tokens[i].children, options, env);
    } else if (typeof rules[type] !== 'undefined') {
      result += rules[tokens[i].type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options, env);
    }
  }

  return result;
};

var renderer = Renderer$1;

/**
 * class Ruler
 *
 * Helper class, used by [[MarkdownIt#core]], [[MarkdownIt#block]] and
 * [[MarkdownIt#inline]] to manage sequences of functions (rules):
 *
 * - keep rules in defined order
 * - assign the name to each rule
 * - enable/disable rules
 * - add/replace rules
 * - allow assign rules to additional named chains (in the same)
 * - cacheing lists of active rules
 *
 * You will not need use this class directly until write plugins. For simple
 * rules control use [[MarkdownIt.disable]], [[MarkdownIt.enable]] and
 * [[MarkdownIt.use]].
 **/
/**
 * new Ruler()
 **/


function Ruler$3() {
  // List of added rules. Each element is:
  //
  // {
  //   name: XXX,
  //   enabled: Boolean,
  //   fn: Function(),
  //   alt: [ name2, name3 ]
  // }
  //
  this.__rules__ = []; // Cached rule chains.
  //
  // First level - chain name, '' for default.
  // Second level - diginal anchor for fast filtering by charcodes.
  //

  this.__cache__ = null;
} ////////////////////////////////////////////////////////////////////////////////
// Helper methods, should not be used directly
// Find rule index by name
//


Ruler$3.prototype.__find__ = function (name) {
  for (var i = 0; i < this.__rules__.length; i++) {
    if (this.__rules__[i].name === name) {
      return i;
    }
  }

  return -1;
}; // Build rules lookup cache
//


Ruler$3.prototype.__compile__ = function () {
  var self = this;
  var chains = ['']; // collect unique names

  self.__rules__.forEach(function (rule) {
    if (!rule.enabled) {
      return;
    }

    rule.alt.forEach(function (altName) {
      if (chains.indexOf(altName) < 0) {
        chains.push(altName);
      }
    });
  });

  self.__cache__ = {};
  chains.forEach(function (chain) {
    self.__cache__[chain] = [];

    self.__rules__.forEach(function (rule) {
      if (!rule.enabled) {
        return;
      }

      if (chain && rule.alt.indexOf(chain) < 0) {
        return;
      }

      self.__cache__[chain].push(rule.fn);
    });
  });
};
/**
 * Ruler.at(name, fn [, options])
 * - name (String): rule name to replace.
 * - fn (Function): new rule function.
 * - options (Object): new rule options (not mandatory).
 *
 * Replace rule by name with new function & options. Throws error if name not
 * found.
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * Replace existing typographer replacement rule with new one:
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.core.ruler.at('replacements', function replace(state) {
 *   //...
 * });
 * ```
 **/


Ruler$3.prototype.at = function (name, fn, options) {
  var index = this.__find__(name);

  var opt = options || {};

  if (index === -1) {
    throw new Error('Parser rule not found: ' + name);
  }

  this.__rules__[index].fn = fn;
  this.__rules__[index].alt = opt.alt || [];
  this.__cache__ = null;
};
/**
 * Ruler.before(beforeName, ruleName, fn [, options])
 * - beforeName (String): new rule will be added before this one.
 * - ruleName (String): name of added rule.
 * - fn (Function): rule function.
 * - options (Object): rule options (not mandatory).
 *
 * Add new rule to chain before one with given name. See also
 * [[Ruler.after]], [[Ruler.push]].
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
 *   //...
 * });
 * ```
 **/


Ruler$3.prototype.before = function (beforeName, ruleName, fn, options) {
  var index = this.__find__(beforeName);

  var opt = options || {};

  if (index === -1) {
    throw new Error('Parser rule not found: ' + beforeName);
  }

  this.__rules__.splice(index, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};
/**
 * Ruler.after(afterName, ruleName, fn [, options])
 * - afterName (String): new rule will be added after this one.
 * - ruleName (String): name of added rule.
 * - fn (Function): rule function.
 * - options (Object): rule options (not mandatory).
 *
 * Add new rule to chain after one with given name. See also
 * [[Ruler.before]], [[Ruler.push]].
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.inline.ruler.after('text', 'my_rule', function replace(state) {
 *   //...
 * });
 * ```
 **/


Ruler$3.prototype.after = function (afterName, ruleName, fn, options) {
  var index = this.__find__(afterName);

  var opt = options || {};

  if (index === -1) {
    throw new Error('Parser rule not found: ' + afterName);
  }

  this.__rules__.splice(index + 1, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};
/**
 * Ruler.push(ruleName, fn [, options])
 * - ruleName (String): name of added rule.
 * - fn (Function): rule function.
 * - options (Object): rule options (not mandatory).
 *
 * Push new rule to the end of chain. See also
 * [[Ruler.before]], [[Ruler.after]].
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.core.ruler.push('my_rule', function replace(state) {
 *   //...
 * });
 * ```
 **/


Ruler$3.prototype.push = function (ruleName, fn, options) {
  var opt = options || {};

  this.__rules__.push({
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};
/**
 * Ruler.enable(list [, ignoreInvalid]) -> Array
 * - list (String|Array): list of rule names to enable.
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Enable rules with given names. If any rule name not found - throw Error.
 * Errors can be disabled by second param.
 *
 * Returns list of found rule names (if no exception happened).
 *
 * See also [[Ruler.disable]], [[Ruler.enableOnly]].
 **/


Ruler$3.prototype.enable = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) {
    list = [list];
  }

  var result = []; // Search by name and enable

  list.forEach(function (name) {
    var idx = this.__find__(name);

    if (idx < 0) {
      if (ignoreInvalid) {
        return;
      }

      throw new Error('Rules manager: invalid rule name ' + name);
    }

    this.__rules__[idx].enabled = true;
    result.push(name);
  }, this);
  this.__cache__ = null;
  return result;
};
/**
 * Ruler.enableOnly(list [, ignoreInvalid])
 * - list (String|Array): list of rule names to enable (whitelist).
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Enable rules with given names, and disable everything else. If any rule name
 * not found - throw Error. Errors can be disabled by second param.
 *
 * See also [[Ruler.disable]], [[Ruler.enable]].
 **/


Ruler$3.prototype.enableOnly = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) {
    list = [list];
  }

  this.__rules__.forEach(function (rule) {
    rule.enabled = false;
  });

  this.enable(list, ignoreInvalid);
};
/**
 * Ruler.disable(list [, ignoreInvalid]) -> Array
 * - list (String|Array): list of rule names to disable.
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Disable rules with given names. If any rule name not found - throw Error.
 * Errors can be disabled by second param.
 *
 * Returns list of found rule names (if no exception happened).
 *
 * See also [[Ruler.enable]], [[Ruler.enableOnly]].
 **/


Ruler$3.prototype.disable = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) {
    list = [list];
  }

  var result = []; // Search by name and disable

  list.forEach(function (name) {
    var idx = this.__find__(name);

    if (idx < 0) {
      if (ignoreInvalid) {
        return;
      }

      throw new Error('Rules manager: invalid rule name ' + name);
    }

    this.__rules__[idx].enabled = false;
    result.push(name);
  }, this);
  this.__cache__ = null;
  return result;
};
/**
 * Ruler.getRules(chainName) -> Array
 *
 * Return array of active functions (rules) for given chain name. It analyzes
 * rules configuration, compiles caches if not exists and returns result.
 *
 * Default chain name is `''` (empty string). It can't be skipped. That's
 * done intentionally, to keep signature monomorphic for high speed.
 **/


Ruler$3.prototype.getRules = function (chainName) {
  if (this.__cache__ === null) {
    this.__compile__();
  } // Chain can be empty, if rules disabled. But we still have to return Array.


  return this.__cache__[chainName] || [];
};

var ruler = Ruler$3;

var NEWLINES_RE = /\r\n?|\n/g;
var NULL_RE = /\0/g;

var normalize$2 = function normalize(state) {
  var str; // Normalize newlines

  str = state.src.replace(NEWLINES_RE, '\n'); // Replace NULL characters

  str = str.replace(NULL_RE, '\uFFFD');
  state.src = str;
};

var block = function block(state) {
  var token;

  if (state.inlineMode) {
    token = new state.Token('inline', '', 0);
    token.content = state.src;
    token.map = [0, 1];
    token.children = [];
    state.tokens.push(token);
  } else {
    state.md.block.parse(state.src, state.md, state.env, state.tokens);
  }
};

var inline = function inline(state) {
  var tokens = state.tokens,
      tok,
      i,
      l; // Parse inlines

  for (i = 0, l = tokens.length; i < l; i++) {
    tok = tokens[i];

    if (tok.type === 'inline') {
      state.md.inline.parse(tok.content, state.md, state.env, tok.children);
    }
  }
};

var arrayReplaceAt = utils$2.arrayReplaceAt;

function isLinkOpen(str) {
  return /^<a[>\s]/i.test(str);
}

function isLinkClose(str) {
  return /^<\/a\s*>/i.test(str);
}

var linkify = function linkify(state) {
  var i,
      j,
      l,
      tokens,
      token,
      currentToken,
      nodes,
      ln,
      text,
      pos,
      lastPos,
      level,
      htmlLinkLevel,
      url,
      fullUrl,
      urlText,
      blockTokens = state.tokens,
      links;

  if (!state.md.options.linkify) {
    return;
  }

  for (j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== 'inline' || !state.md.linkify.pretest(blockTokens[j].content)) {
      continue;
    }

    tokens = blockTokens[j].children;
    htmlLinkLevel = 0; // We scan from the end, to keep position when new tags added.
    // Use reversed logic in links start/end match

    for (i = tokens.length - 1; i >= 0; i--) {
      currentToken = tokens[i]; // Skip content of markdown links

      if (currentToken.type === 'link_close') {
        i--;

        while (tokens[i].level !== currentToken.level && tokens[i].type !== 'link_open') {
          i--;
        }

        continue;
      } // Skip content of html tag links


      if (currentToken.type === 'html_inline') {
        if (isLinkOpen(currentToken.content) && htmlLinkLevel > 0) {
          htmlLinkLevel--;
        }

        if (isLinkClose(currentToken.content)) {
          htmlLinkLevel++;
        }
      }

      if (htmlLinkLevel > 0) {
        continue;
      }

      if (currentToken.type === 'text' && state.md.linkify.test(currentToken.content)) {
        text = currentToken.content;
        links = state.md.linkify.match(text); // Now split string to nodes

        nodes = [];
        level = currentToken.level;
        lastPos = 0;

        for (ln = 0; ln < links.length; ln++) {
          url = links[ln].url;
          fullUrl = state.md.normalizeLink(url);

          if (!state.md.validateLink(fullUrl)) {
            continue;
          }

          urlText = links[ln].text; // Linkifier might send raw hostnames like "example.com", where url
          // starts with domain name. So we prepend http:// in those cases,
          // and remove it afterwards.
          //

          if (!links[ln].schema) {
            urlText = state.md.normalizeLinkText('http://' + urlText).replace(/^http:\/\//, '');
          } else if (links[ln].schema === 'mailto:' && !/^mailto:/i.test(urlText)) {
            urlText = state.md.normalizeLinkText('mailto:' + urlText).replace(/^mailto:/, '');
          } else {
            urlText = state.md.normalizeLinkText(urlText);
          }

          pos = links[ln].index;

          if (pos > lastPos) {
            token = new state.Token('text', '', 0);
            token.content = text.slice(lastPos, pos);
            token.level = level;
            nodes.push(token);
          }

          token = new state.Token('link_open', 'a', 1);
          token.attrs = [['href', fullUrl]];
          token.level = level++;
          token.markup = 'linkify';
          token.info = 'auto';
          nodes.push(token);
          token = new state.Token('text', '', 0);
          token.content = urlText;
          token.level = level;
          nodes.push(token);
          token = new state.Token('link_close', 'a', -1);
          token.level = --level;
          token.markup = 'linkify';
          token.info = 'auto';
          nodes.push(token);
          lastPos = links[ln].lastIndex;
        }

        if (lastPos < text.length) {
          token = new state.Token('text', '', 0);
          token.content = text.slice(lastPos);
          token.level = level;
          nodes.push(token);
        } // replace current node


        blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
      }
    }
  }
};

// - fractionals 1/2, 1/4, 3/4 -> ½, ¼, ¾
// - miltiplication 2 x 4 -> 2 × 4


var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/; // Workaround for phantomjs - need regex without /g flag,
// or root check will fail every second time

var SCOPED_ABBR_TEST_RE = /\((c|tm|r|p)\)/i;
var SCOPED_ABBR_RE = /\((c|tm|r|p)\)/ig;
var SCOPED_ABBR = {
  c: '©',
  r: '®',
  p: '§',
  tm: '™'
};

function replaceFn(match, name) {
  return SCOPED_ABBR[name.toLowerCase()];
}

function replace_scoped(inlineTokens) {
  var i,
      token,
      inside_autolink = 0;

  for (i = inlineTokens.length - 1; i >= 0; i--) {
    token = inlineTokens[i];

    if (token.type === 'text' && !inside_autolink) {
      token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
    }

    if (token.type === 'link_open' && token.info === 'auto') {
      inside_autolink--;
    }

    if (token.type === 'link_close' && token.info === 'auto') {
      inside_autolink++;
    }
  }
}

function replace_rare(inlineTokens) {
  var i,
      token,
      inside_autolink = 0;

  for (i = inlineTokens.length - 1; i >= 0; i--) {
    token = inlineTokens[i];

    if (token.type === 'text' && !inside_autolink) {
      if (RARE_RE.test(token.content)) {
        token.content = token.content.replace(/\+-/g, '±') // .., ..., ....... -> …
        // but ?..... & !..... -> ?.. & !..
        .replace(/\.{2,}/g, '…').replace(/([?!])…/g, '$1..').replace(/([?!]){4,}/g, '$1$1$1').replace(/,{2,}/g, ',') // em-dash
        .replace(/(^|[^-])---(?=[^-]|$)/mg, '$1\u2014') // en-dash
        .replace(/(^|\s)--(?=\s|$)/mg, '$1\u2013').replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, '$1\u2013');
      }
    }

    if (token.type === 'link_open' && token.info === 'auto') {
      inside_autolink--;
    }

    if (token.type === 'link_close' && token.info === 'auto') {
      inside_autolink++;
    }
  }
}

var replacements = function replace(state) {
  var blkIdx;

  if (!state.md.options.typographer) {
    return;
  }

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
    if (state.tokens[blkIdx].type !== 'inline') {
      continue;
    }

    if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) {
      replace_scoped(state.tokens[blkIdx].children);
    }

    if (RARE_RE.test(state.tokens[blkIdx].content)) {
      replace_rare(state.tokens[blkIdx].children);
    }
  }
};

var isWhiteSpace$1 = utils$2.isWhiteSpace;
var isPunctChar$1 = utils$2.isPunctChar;
var isMdAsciiPunct$1 = utils$2.isMdAsciiPunct;
var QUOTE_TEST_RE = /['"]/;
var QUOTE_RE = /['"]/g;
var APOSTROPHE = '\u2019';
/* ’ */

function replaceAt(str, index, ch) {
  return str.substr(0, index) + ch + str.substr(index + 1);
}

function process_inlines(tokens, state) {
  var i, token, text, t, pos, max, thisLevel, item, lastChar, nextChar, isLastPunctChar, isNextPunctChar, isLastWhiteSpace, isNextWhiteSpace, canOpen, canClose, j, isSingle, stack, openQuote, closeQuote;
  stack = [];

  for (i = 0; i < tokens.length; i++) {
    token = tokens[i];
    thisLevel = tokens[i].level;

    for (j = stack.length - 1; j >= 0; j--) {
      if (stack[j].level <= thisLevel) {
        break;
      }
    }

    stack.length = j + 1;

    if (token.type !== 'text') {
      continue;
    }

    text = token.content;
    pos = 0;
    max = text.length;
    /*eslint no-labels:0,block-scoped-var:0*/

    OUTER: while (pos < max) {
      QUOTE_RE.lastIndex = pos;
      t = QUOTE_RE.exec(text);

      if (!t) {
        break;
      }

      canOpen = canClose = true;
      pos = t.index + 1;
      isSingle = t[0] === "'"; // Find previous character,
      // default to space if it's the beginning of the line
      //

      lastChar = 0x20;

      if (t.index - 1 >= 0) {
        lastChar = text.charCodeAt(t.index - 1);
      } else {
        for (j = i - 1; j >= 0; j--) {
          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // lastChar defaults to 0x20

          if (!tokens[j].content) continue; // should skip all tokens except 'text', 'html_inline' or 'code_inline'

          lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
          break;
        }
      } // Find next character,
      // default to space if it's the end of the line
      //


      nextChar = 0x20;

      if (pos < max) {
        nextChar = text.charCodeAt(pos);
      } else {
        for (j = i + 1; j < tokens.length; j++) {
          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // nextChar defaults to 0x20

          if (!tokens[j].content) continue; // should skip all tokens except 'text', 'html_inline' or 'code_inline'

          nextChar = tokens[j].content.charCodeAt(0);
          break;
        }
      }

      isLastPunctChar = isMdAsciiPunct$1(lastChar) || isPunctChar$1(String.fromCharCode(lastChar));
      isNextPunctChar = isMdAsciiPunct$1(nextChar) || isPunctChar$1(String.fromCharCode(nextChar));
      isLastWhiteSpace = isWhiteSpace$1(lastChar);
      isNextWhiteSpace = isWhiteSpace$1(nextChar);

      if (isNextWhiteSpace) {
        canOpen = false;
      } else if (isNextPunctChar) {
        if (!(isLastWhiteSpace || isLastPunctChar)) {
          canOpen = false;
        }
      }

      if (isLastWhiteSpace) {
        canClose = false;
      } else if (isLastPunctChar) {
        if (!(isNextWhiteSpace || isNextPunctChar)) {
          canClose = false;
        }
      }

      if (nextChar === 0x22
      /* " */
      && t[0] === '"') {
        if (lastChar >= 0x30
        /* 0 */
        && lastChar <= 0x39
        /* 9 */
        ) {
          // special case: 1"" - count first quote as an inch
          canClose = canOpen = false;
        }
      }

      if (canOpen && canClose) {
        // Replace quotes in the middle of punctuation sequence, but not
        // in the middle of the words, i.e.:
        //
        // 1. foo " bar " baz - not replaced
        // 2. foo-"-bar-"-baz - replaced
        // 3. foo"bar"baz     - not replaced
        //
        canOpen = isLastPunctChar;
        canClose = isNextPunctChar;
      }

      if (!canOpen && !canClose) {
        // middle of word
        if (isSingle) {
          token.content = replaceAt(token.content, t.index, APOSTROPHE);
        }

        continue;
      }

      if (canClose) {
        // this could be a closing quote, rewind the stack to get a match
        for (j = stack.length - 1; j >= 0; j--) {
          item = stack[j];

          if (stack[j].level < thisLevel) {
            break;
          }

          if (item.single === isSingle && stack[j].level === thisLevel) {
            item = stack[j];

            if (isSingle) {
              openQuote = state.md.options.quotes[2];
              closeQuote = state.md.options.quotes[3];
            } else {
              openQuote = state.md.options.quotes[0];
              closeQuote = state.md.options.quotes[1];
            } // replace token.content *before* tokens[item.token].content,
            // because, if they are pointing at the same token, replaceAt
            // could mess up indices when quote length != 1


            token.content = replaceAt(token.content, t.index, closeQuote);
            tokens[item.token].content = replaceAt(tokens[item.token].content, item.pos, openQuote);
            pos += closeQuote.length - 1;

            if (item.token === i) {
              pos += openQuote.length - 1;
            }

            text = token.content;
            max = text.length;
            stack.length = j;
            continue OUTER;
          }
        }
      }

      if (canOpen) {
        stack.push({
          token: i,
          pos: t.index,
          single: isSingle,
          level: thisLevel
        });
      } else if (canClose && isSingle) {
        token.content = replaceAt(token.content, t.index, APOSTROPHE);
      }
    }
  }
}

var smartquotes = function smartquotes(state) {
  /*eslint max-depth:0*/
  var blkIdx;

  if (!state.md.options.typographer) {
    return;
  }

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
    if (state.tokens[blkIdx].type !== 'inline' || !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) {
      continue;
    }

    process_inlines(state.tokens[blkIdx].children, state);
  }
};

/**
 * class Token
 **/

/**
 * new Token(type, tag, nesting)
 *
 * Create new token and fill passed properties.
 **/


function Token$3(type, tag, nesting) {
  /**
   * Token#type -> String
   *
   * Type of the token (string, e.g. "paragraph_open")
   **/
  this.type = type;
  /**
   * Token#tag -> String
   *
   * html tag name, e.g. "p"
   **/

  this.tag = tag;
  /**
   * Token#attrs -> Array
   *
   * Html attributes. Format: `[ [ name1, value1 ], [ name2, value2 ] ]`
   **/

  this.attrs = null;
  /**
   * Token#map -> Array
   *
   * Source map info. Format: `[ line_begin, line_end ]`
   **/

  this.map = null;
  /**
   * Token#nesting -> Number
   *
   * Level change (number in {-1, 0, 1} set), where:
   *
   * -  `1` means the tag is opening
   * -  `0` means the tag is self-closing
   * - `-1` means the tag is closing
   **/

  this.nesting = nesting;
  /**
   * Token#level -> Number
   *
   * nesting level, the same as `state.level`
   **/

  this.level = 0;
  /**
   * Token#children -> Array
   *
   * An array of child nodes (inline and img tokens)
   **/

  this.children = null;
  /**
   * Token#content -> String
   *
   * In a case of self-closing tag (code, html, fence, etc.),
   * it has contents of this tag.
   **/

  this.content = '';
  /**
   * Token#markup -> String
   *
   * '*' or '_' for emphasis, fence string for fence, etc.
   **/

  this.markup = '';
  /**
   * Token#info -> String
   *
   * Additional information:
   *
   * - Info string for "fence" tokens
   * - The value "auto" for autolink "link_open" and "link_close" tokens
   * - The string value of the item marker for ordered-list "list_item_open" tokens
   **/

  this.info = '';
  /**
   * Token#meta -> Object
   *
   * A place for plugins to store an arbitrary data
   **/

  this.meta = null;
  /**
   * Token#block -> Boolean
   *
   * True for block-level tokens, false for inline tokens.
   * Used in renderer to calculate line breaks
   **/

  this.block = false;
  /**
   * Token#hidden -> Boolean
   *
   * If it's true, ignore this element when rendering. Used for tight lists
   * to hide paragraphs.
   **/

  this.hidden = false;
}
/**
 * Token.attrIndex(name) -> Number
 *
 * Search attribute index by name.
 **/


Token$3.prototype.attrIndex = function attrIndex(name) {
  var attrs, i, len;

  if (!this.attrs) {
    return -1;
  }

  attrs = this.attrs;

  for (i = 0, len = attrs.length; i < len; i++) {
    if (attrs[i][0] === name) {
      return i;
    }
  }

  return -1;
};
/**
 * Token.attrPush(attrData)
 *
 * Add `[ name, value ]` attribute to list. Init attrs if necessary
 **/


Token$3.prototype.attrPush = function attrPush(attrData) {
  if (this.attrs) {
    this.attrs.push(attrData);
  } else {
    this.attrs = [attrData];
  }
};
/**
 * Token.attrSet(name, value)
 *
 * Set `name` attribute to `value`. Override old value if exists.
 **/


Token$3.prototype.attrSet = function attrSet(name, value) {
  var idx = this.attrIndex(name),
      attrData = [name, value];

  if (idx < 0) {
    this.attrPush(attrData);
  } else {
    this.attrs[idx] = attrData;
  }
};
/**
 * Token.attrGet(name)
 *
 * Get the value of attribute `name`, or null if it does not exist.
 **/


Token$3.prototype.attrGet = function attrGet(name) {
  var idx = this.attrIndex(name),
      value = null;

  if (idx >= 0) {
    value = this.attrs[idx][1];
  }

  return value;
};
/**
 * Token.attrJoin(name, value)
 *
 * Join value to existing attribute via space. Or create new attribute if not
 * exists. Useful to operate with token classes.
 **/


Token$3.prototype.attrJoin = function attrJoin(name, value) {
  var idx = this.attrIndex(name);

  if (idx < 0) {
    this.attrPush([name, value]);
  } else {
    this.attrs[idx][1] = this.attrs[idx][1] + ' ' + value;
  }
};

var token = Token$3;

var Token$2 = token;

function StateCore(src, md, env) {
  this.src = src;
  this.env = env;
  this.tokens = [];
  this.inlineMode = false;
  this.md = md; // link to parser instance
} // re-export Token class to use in core rules


StateCore.prototype.Token = Token$2;
var state_core = StateCore;

/** internal
 * class Core
 *
 * Top-level rules executor. Glues block/inline parsers and does intermediate
 * transformations.
 **/

var Ruler$2 = ruler;
var _rules$2 = [['normalize', normalize$2], ['block', block], ['inline', inline], ['linkify', linkify], ['replacements', replacements], ['smartquotes', smartquotes]];
/**
 * new Core()
 **/

function Core() {
  /**
   * Core#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of core rules.
   **/
  this.ruler = new Ruler$2();

  for (var i = 0; i < _rules$2.length; i++) {
    this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
  }
}
/**
 * Core.process(state)
 *
 * Executes core chain rules.
 **/


Core.prototype.process = function (state) {
  var i, l, rules;
  rules = this.ruler.getRules('');

  for (i = 0, l = rules.length; i < l; i++) {
    rules[i](state);
  }
};

Core.prototype.State = state_core;
var parser_core = Core;

var isSpace$a = utils$2.isSpace;

function getLine(state, line) {
  var pos = state.bMarks[line] + state.tShift[line],
      max = state.eMarks[line];
  return state.src.substr(pos, max - pos);
}

function escapedSplit(str) {
  var result = [],
      pos = 0,
      max = str.length,
      ch,
      isEscaped = false,
      lastPos = 0,
      current = '';
  ch = str.charCodeAt(pos);

  while (pos < max) {
    if (ch === 0x7c
    /* | */
    ) {
      if (!isEscaped) {
        // pipe separating cells, '|'
        result.push(current + str.substring(lastPos, pos));
        current = '';
        lastPos = pos + 1;
      } else {
        // escaped pipe, '\|'
        current += str.substring(lastPos, pos - 1);
        lastPos = pos;
      }
    }

    isEscaped = ch === 0x5c
    /* \ */
    ;
    pos++;
    ch = str.charCodeAt(pos);
  }

  result.push(current + str.substring(lastPos));
  return result;
}

var table = function table(state, startLine, endLine, silent) {
  var ch, lineText, pos, i, l, nextLine, columns, columnCount, token, aligns, t, tableLines, tbodyLines, oldParentType, terminate, terminatorRules, firstCh, secondCh; // should have at least two lines

  if (startLine + 2 > endLine) {
    return false;
  }

  nextLine = startLine + 1;

  if (state.sCount[nextLine] < state.blkIndent) {
    return false;
  } // if it's indented more than 3 spaces, it should be a code block


  if (state.sCount[nextLine] - state.blkIndent >= 4) {
    return false;
  } // first character of the second line should be '|', '-', ':',
  // and no other characters are allowed but spaces;
  // basically, this is the equivalent of /^[-:|][-:|\s]*$/ regexp


  pos = state.bMarks[nextLine] + state.tShift[nextLine];

  if (pos >= state.eMarks[nextLine]) {
    return false;
  }

  firstCh = state.src.charCodeAt(pos++);

  if (firstCh !== 0x7C
  /* | */
  && firstCh !== 0x2D
  /* - */
  && firstCh !== 0x3A
  /* : */
  ) {
    return false;
  }

  if (pos >= state.eMarks[nextLine]) {
    return false;
  }

  secondCh = state.src.charCodeAt(pos++);

  if (secondCh !== 0x7C
  /* | */
  && secondCh !== 0x2D
  /* - */
  && secondCh !== 0x3A
  /* : */
  && !isSpace$a(secondCh)) {
    return false;
  } // if first character is '-', then second character must not be a space
  // (due to parsing ambiguity with list)


  if (firstCh === 0x2D
  /* - */
  && isSpace$a(secondCh)) {
    return false;
  }

  while (pos < state.eMarks[nextLine]) {
    ch = state.src.charCodeAt(pos);

    if (ch !== 0x7C
    /* | */
    && ch !== 0x2D
    /* - */
    && ch !== 0x3A
    /* : */
    && !isSpace$a(ch)) {
      return false;
    }

    pos++;
  }

  lineText = getLine(state, startLine + 1);
  columns = lineText.split('|');
  aligns = [];

  for (i = 0; i < columns.length; i++) {
    t = columns[i].trim();

    if (!t) {
      // allow empty columns before and after table, but not in between columns;
      // e.g. allow ` |---| `, disallow ` ---||--- `
      if (i === 0 || i === columns.length - 1) {
        continue;
      } else {
        return false;
      }
    }

    if (!/^:?-+:?$/.test(t)) {
      return false;
    }

    if (t.charCodeAt(t.length - 1) === 0x3A
    /* : */
    ) {
      aligns.push(t.charCodeAt(0) === 0x3A
      /* : */
      ? 'center' : 'right');
    } else if (t.charCodeAt(0) === 0x3A
    /* : */
    ) {
      aligns.push('left');
    } else {
      aligns.push('');
    }
  }

  lineText = getLine(state, startLine).trim();

  if (lineText.indexOf('|') === -1) {
    return false;
  }

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  columns = escapedSplit(lineText);
  if (columns.length && columns[0] === '') columns.shift();
  if (columns.length && columns[columns.length - 1] === '') columns.pop(); // header row will define an amount of columns in the entire table,
  // and align row should be exactly the same (the rest of the rows can differ)

  columnCount = columns.length;

  if (columnCount === 0 || columnCount !== aligns.length) {
    return false;
  }

  if (silent) {
    return true;
  }

  oldParentType = state.parentType;
  state.parentType = 'table'; // use 'blockquote' lists for termination because it's
  // the most similar to tables

  terminatorRules = state.md.block.ruler.getRules('blockquote');
  token = state.push('table_open', 'table', 1);
  token.map = tableLines = [startLine, 0];
  token = state.push('thead_open', 'thead', 1);
  token.map = [startLine, startLine + 1];
  token = state.push('tr_open', 'tr', 1);
  token.map = [startLine, startLine + 1];

  for (i = 0; i < columns.length; i++) {
    token = state.push('th_open', 'th', 1);

    if (aligns[i]) {
      token.attrs = [['style', 'text-align:' + aligns[i]]];
    }

    token = state.push('inline', '', 0);
    token.content = columns[i].trim();
    token.children = [];
    token = state.push('th_close', 'th', -1);
  }

  token = state.push('tr_close', 'tr', -1);
  token = state.push('thead_close', 'thead', -1);

  for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
    if (state.sCount[nextLine] < state.blkIndent) {
      break;
    }

    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    }

    lineText = getLine(state, nextLine).trim();

    if (!lineText) {
      break;
    }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      break;
    }

    columns = escapedSplit(lineText);
    if (columns.length && columns[0] === '') columns.shift();
    if (columns.length && columns[columns.length - 1] === '') columns.pop();

    if (nextLine === startLine + 2) {
      token = state.push('tbody_open', 'tbody', 1);
      token.map = tbodyLines = [startLine + 2, 0];
    }

    token = state.push('tr_open', 'tr', 1);
    token.map = [nextLine, nextLine + 1];

    for (i = 0; i < columnCount; i++) {
      token = state.push('td_open', 'td', 1);

      if (aligns[i]) {
        token.attrs = [['style', 'text-align:' + aligns[i]]];
      }

      token = state.push('inline', '', 0);
      token.content = columns[i] ? columns[i].trim() : '';
      token.children = [];
      token = state.push('td_close', 'td', -1);
    }

    token = state.push('tr_close', 'tr', -1);
  }

  if (tbodyLines) {
    token = state.push('tbody_close', 'tbody', -1);
    tbodyLines[1] = nextLine;
  }

  token = state.push('table_close', 'table', -1);
  tableLines[1] = nextLine;
  state.parentType = oldParentType;
  state.line = nextLine;
  return true;
};

var code = function code(state, startLine, endLine
/*, silent*/
) {
  var nextLine, last, token;

  if (state.sCount[startLine] - state.blkIndent < 4) {
    return false;
  }

  last = nextLine = startLine + 1;

  while (nextLine < endLine) {
    if (state.isEmpty(nextLine)) {
      nextLine++;
      continue;
    }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      nextLine++;
      last = nextLine;
      continue;
    }

    break;
  }

  state.line = last;
  token = state.push('code_block', 'code', 0);
  token.content = state.getLines(startLine, last, 4 + state.blkIndent, false) + '\n';
  token.map = [startLine, state.line];
  return true;
};

var fence = function fence(state, startLine, endLine, silent) {
  var marker,
      len,
      params,
      nextLine,
      mem,
      token,
      markup,
      haveEndMarker = false,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  if (pos + 3 > max) {
    return false;
  }

  marker = state.src.charCodeAt(pos);

  if (marker !== 0x7E
  /* ~ */
  && marker !== 0x60
  /* ` */
  ) {
    return false;
  } // scan marker length


  mem = pos;
  pos = state.skipChars(pos, marker);
  len = pos - mem;

  if (len < 3) {
    return false;
  }

  markup = state.src.slice(mem, pos);
  params = state.src.slice(pos, max);

  if (marker === 0x60
  /* ` */
  ) {
    if (params.indexOf(String.fromCharCode(marker)) >= 0) {
      return false;
    }
  } // Since start is found, we can report success here in validation mode


  if (silent) {
    return true;
  } // search end of block


  nextLine = startLine;

  for (;;) {
    nextLine++;

    if (nextLine >= endLine) {
      // unclosed block should be autoclosed by end of document.
      // also block seems to be autoclosed by end of parent
      break;
    }

    pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.sCount[nextLine] < state.blkIndent) {
      // non-empty line with negative indent should stop the list:
      // - ```
      //  test
      break;
    }

    if (state.src.charCodeAt(pos) !== marker) {
      continue;
    }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      // closing fence should be indented less than 4 spaces
      continue;
    }

    pos = state.skipChars(pos, marker); // closing code fence must be at least as long as the opening one

    if (pos - mem < len) {
      continue;
    } // make sure tail has spaces only


    pos = state.skipSpaces(pos);

    if (pos < max) {
      continue;
    }

    haveEndMarker = true; // found!

    break;
  } // If a fence has heading spaces, they should be removed from its inner block


  len = state.sCount[startLine];
  state.line = nextLine + (haveEndMarker ? 1 : 0);
  token = state.push('fence', 'code', 0);
  token.info = params;
  token.content = state.getLines(startLine + 1, nextLine, len, true);
  token.markup = markup;
  token.map = [startLine, state.line];
  return true;
};

var isSpace$9 = utils$2.isSpace;

var blockquote = function blockquote(state, startLine, endLine, silent) {
  var adjustTab,
      ch,
      i,
      initial,
      l,
      lastLineEmpty,
      lines,
      nextLine,
      offset,
      oldBMarks,
      oldBSCount,
      oldIndent,
      oldParentType,
      oldSCount,
      oldTShift,
      spaceAfterMarker,
      terminate,
      terminatorRules,
      token,
      isOutdented,
      oldLineMax = state.lineMax,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  } // check the block quote marker


  if (state.src.charCodeAt(pos++) !== 0x3E
  /* > */
  ) {
    return false;
  } // we know that it's going to be a valid blockquote,
  // so no point trying to find the end of it in silent mode


  if (silent) {
    return true;
  } // set offset past spaces and ">"


  initial = offset = state.sCount[startLine] + 1; // skip one optional space after '>'

  if (state.src.charCodeAt(pos) === 0x20
  /* space */
  ) {
    // ' >   test '
    //     ^ -- position start of line here:
    pos++;
    initial++;
    offset++;
    adjustTab = false;
    spaceAfterMarker = true;
  } else if (state.src.charCodeAt(pos) === 0x09
  /* tab */
  ) {
    spaceAfterMarker = true;

    if ((state.bsCount[startLine] + offset) % 4 === 3) {
      // '  >\t  test '
      //       ^ -- position start of line here (tab has width===1)
      pos++;
      initial++;
      offset++;
      adjustTab = false;
    } else {
      // ' >\t  test '
      //    ^ -- position start of line here + shift bsCount slightly
      //         to make extra space appear
      adjustTab = true;
    }
  } else {
    spaceAfterMarker = false;
  }

  oldBMarks = [state.bMarks[startLine]];
  state.bMarks[startLine] = pos;

  while (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (isSpace$9(ch)) {
      if (ch === 0x09) {
        offset += 4 - (offset + state.bsCount[startLine] + (adjustTab ? 1 : 0)) % 4;
      } else {
        offset++;
      }
    } else {
      break;
    }

    pos++;
  }

  oldBSCount = [state.bsCount[startLine]];
  state.bsCount[startLine] = state.sCount[startLine] + 1 + (spaceAfterMarker ? 1 : 0);
  lastLineEmpty = pos >= max;
  oldSCount = [state.sCount[startLine]];
  state.sCount[startLine] = offset - initial;
  oldTShift = [state.tShift[startLine]];
  state.tShift[startLine] = pos - state.bMarks[startLine];
  terminatorRules = state.md.block.ruler.getRules('blockquote');
  oldParentType = state.parentType;
  state.parentType = 'blockquote'; // Search the end of the block
  //
  // Block ends with either:
  //  1. an empty line outside:
  //     ```
  //     > test
  //
  //     ```
  //  2. an empty line inside:
  //     ```
  //     >
  //     test
  //     ```
  //  3. another tag:
  //     ```
  //     > test
  //      - - -
  //     ```

  for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
    // check if it's outdented, i.e. it's inside list item and indented
    // less than said list item:
    //
    // ```
    // 1. anything
    //    > current blockquote
    // 2. checking this line
    // ```
    isOutdented = state.sCount[nextLine] < state.blkIndent;
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos >= max) {
      // Case 1: line is not inside the blockquote, and this line is empty.
      break;
    }

    if (state.src.charCodeAt(pos++) === 0x3E
    /* > */
    && !isOutdented) {
      // This line is inside the blockquote.
      // set offset past spaces and ">"
      initial = offset = state.sCount[nextLine] + 1; // skip one optional space after '>'

      if (state.src.charCodeAt(pos) === 0x20
      /* space */
      ) {
        // ' >   test '
        //     ^ -- position start of line here:
        pos++;
        initial++;
        offset++;
        adjustTab = false;
        spaceAfterMarker = true;
      } else if (state.src.charCodeAt(pos) === 0x09
      /* tab */
      ) {
        spaceAfterMarker = true;

        if ((state.bsCount[nextLine] + offset) % 4 === 3) {
          // '  >\t  test '
          //       ^ -- position start of line here (tab has width===1)
          pos++;
          initial++;
          offset++;
          adjustTab = false;
        } else {
          // ' >\t  test '
          //    ^ -- position start of line here + shift bsCount slightly
          //         to make extra space appear
          adjustTab = true;
        }
      } else {
        spaceAfterMarker = false;
      }

      oldBMarks.push(state.bMarks[nextLine]);
      state.bMarks[nextLine] = pos;

      while (pos < max) {
        ch = state.src.charCodeAt(pos);

        if (isSpace$9(ch)) {
          if (ch === 0x09) {
            offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
          } else {
            offset++;
          }
        } else {
          break;
        }

        pos++;
      }

      lastLineEmpty = pos >= max;
      oldBSCount.push(state.bsCount[nextLine]);
      state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
      oldSCount.push(state.sCount[nextLine]);
      state.sCount[nextLine] = offset - initial;
      oldTShift.push(state.tShift[nextLine]);
      state.tShift[nextLine] = pos - state.bMarks[nextLine];
      continue;
    } // Case 2: line is not inside the blockquote, and the last line was empty.


    if (lastLineEmpty) {
      break;
    } // Case 3: another tag found.


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      // Quirk to enforce "hard termination mode" for paragraphs;
      // normally if you call `tokenize(state, startLine, nextLine)`,
      // paragraphs will look below nextLine for paragraph continuation,
      // but if blockquote is terminated by another tag, they shouldn't
      state.lineMax = nextLine;

      if (state.blkIndent !== 0) {
        // state.blkIndent was non-zero, we now set it to zero,
        // so we need to re-calculate all offsets to appear as
        // if indent wasn't changed
        oldBMarks.push(state.bMarks[nextLine]);
        oldBSCount.push(state.bsCount[nextLine]);
        oldTShift.push(state.tShift[nextLine]);
        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] -= state.blkIndent;
      }

      break;
    }

    oldBMarks.push(state.bMarks[nextLine]);
    oldBSCount.push(state.bsCount[nextLine]);
    oldTShift.push(state.tShift[nextLine]);
    oldSCount.push(state.sCount[nextLine]); // A negative indentation means that this is a paragraph continuation
    //

    state.sCount[nextLine] = -1;
  }

  oldIndent = state.blkIndent;
  state.blkIndent = 0;
  token = state.push('blockquote_open', 'blockquote', 1);
  token.markup = '>';
  token.map = lines = [startLine, 0];
  state.md.block.tokenize(state, startLine, nextLine);
  token = state.push('blockquote_close', 'blockquote', -1);
  token.markup = '>';
  state.lineMax = oldLineMax;
  state.parentType = oldParentType;
  lines[1] = state.line; // Restore original tShift; this might not be necessary since the parser
  // has already been here, but just to make sure we can do that.

  for (i = 0; i < oldTShift.length; i++) {
    state.bMarks[i + startLine] = oldBMarks[i];
    state.tShift[i + startLine] = oldTShift[i];
    state.sCount[i + startLine] = oldSCount[i];
    state.bsCount[i + startLine] = oldBSCount[i];
  }

  state.blkIndent = oldIndent;
  return true;
};

var isSpace$8 = utils$2.isSpace;

var hr = function hr(state, startLine, endLine, silent) {
  var marker,
      cnt,
      ch,
      token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  marker = state.src.charCodeAt(pos++); // Check hr marker

  if (marker !== 0x2A
  /* * */
  && marker !== 0x2D
  /* - */
  && marker !== 0x5F
  /* _ */
  ) {
    return false;
  } // markers can be mixed with spaces, but there should be at least 3 of them


  cnt = 1;

  while (pos < max) {
    ch = state.src.charCodeAt(pos++);

    if (ch !== marker && !isSpace$8(ch)) {
      return false;
    }

    if (ch === marker) {
      cnt++;
    }
  }

  if (cnt < 3) {
    return false;
  }

  if (silent) {
    return true;
  }

  state.line = startLine + 1;
  token = state.push('hr', 'hr', 0);
  token.map = [startLine, state.line];
  token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
  return true;
};

var isSpace$7 = utils$2.isSpace; // Search `[-+*][\n ]`, returns next pos after marker on success
// or -1 on fail.

function skipBulletListMarker(state, startLine) {
  var marker, pos, max, ch;
  pos = state.bMarks[startLine] + state.tShift[startLine];
  max = state.eMarks[startLine];
  marker = state.src.charCodeAt(pos++); // Check bullet

  if (marker !== 0x2A
  /* * */
  && marker !== 0x2D
  /* - */
  && marker !== 0x2B
  /* + */
  ) {
    return -1;
  }

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (!isSpace$7(ch)) {
      // " -test " - is not a list item
      return -1;
    }
  }

  return pos;
} // Search `\d+[.)][\n ]`, returns next pos after marker on success
// or -1 on fail.


function skipOrderedListMarker(state, startLine) {
  var ch,
      start = state.bMarks[startLine] + state.tShift[startLine],
      pos = start,
      max = state.eMarks[startLine]; // List marker should have at least 2 chars (digit + dot)

  if (pos + 1 >= max) {
    return -1;
  }

  ch = state.src.charCodeAt(pos++);

  if (ch < 0x30
  /* 0 */
  || ch > 0x39
  /* 9 */
  ) {
    return -1;
  }

  for (;;) {
    // EOL -> fail
    if (pos >= max) {
      return -1;
    }

    ch = state.src.charCodeAt(pos++);

    if (ch >= 0x30
    /* 0 */
    && ch <= 0x39
    /* 9 */
    ) {
      // List marker should have no more than 9 digits
      // (prevents integer overflow in browsers)
      if (pos - start >= 10) {
        return -1;
      }

      continue;
    } // found valid marker


    if (ch === 0x29
    /* ) */
    || ch === 0x2e
    /* . */
    ) {
      break;
    }

    return -1;
  }

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (!isSpace$7(ch)) {
      // " 1.test " - is not a list item
      return -1;
    }
  }

  return pos;
}

function markTightParagraphs(state, idx) {
  var i,
      l,
      level = state.level + 2;

  for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
    if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
      state.tokens[i + 2].hidden = true;
      state.tokens[i].hidden = true;
      i += 2;
    }
  }
}

var list = function list(state, startLine, endLine, silent) {
  var ch,
      contentStart,
      i,
      indent,
      indentAfterMarker,
      initial,
      isOrdered,
      itemLines,
      l,
      listLines,
      listTokIdx,
      markerCharCode,
      markerValue,
      max,
      nextLine,
      offset,
      oldListIndent,
      oldParentType,
      oldSCount,
      oldTShift,
      oldTight,
      pos,
      posAfterMarker,
      prevEmptyEnd,
      start,
      terminate,
      terminatorRules,
      token,
      isTerminatingParagraph = false,
      tight = true; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  } // Special case:
  //  - item 1
  //   - item 2
  //    - item 3
  //     - item 4
  //      - this one is a paragraph continuation


  if (state.listIndent >= 0 && state.sCount[startLine] - state.listIndent >= 4 && state.sCount[startLine] < state.blkIndent) {
    return false;
  } // limit conditions when list can interrupt
  // a paragraph (validation mode only)


  if (silent && state.parentType === 'paragraph') {
    // Next list item should still terminate previous list item;
    //
    // This code can fail if plugins use blkIndent as well as lists,
    // but I hope the spec gets fixed long before that happens.
    //
    if (state.sCount[startLine] >= state.blkIndent) {
      isTerminatingParagraph = true;
    }
  } // Detect list type and position after marker


  if ((posAfterMarker = skipOrderedListMarker(state, startLine)) >= 0) {
    isOrdered = true;
    start = state.bMarks[startLine] + state.tShift[startLine];
    markerValue = Number(state.src.slice(start, posAfterMarker - 1)); // If we're starting a new ordered list right after
    // a paragraph, it should start with 1.

    if (isTerminatingParagraph && markerValue !== 1) return false;
  } else if ((posAfterMarker = skipBulletListMarker(state, startLine)) >= 0) {
    isOrdered = false;
  } else {
    return false;
  } // If we're starting a new unordered list right after
  // a paragraph, first line should not be empty.


  if (isTerminatingParagraph) {
    if (state.skipSpaces(posAfterMarker) >= state.eMarks[startLine]) return false;
  } // We should terminate list on style change. Remember first one to compare.


  markerCharCode = state.src.charCodeAt(posAfterMarker - 1); // For validation mode we can terminate immediately

  if (silent) {
    return true;
  } // Start list


  listTokIdx = state.tokens.length;

  if (isOrdered) {
    token = state.push('ordered_list_open', 'ol', 1);

    if (markerValue !== 1) {
      token.attrs = [['start', markerValue]];
    }
  } else {
    token = state.push('bullet_list_open', 'ul', 1);
  }

  token.map = listLines = [startLine, 0];
  token.markup = String.fromCharCode(markerCharCode); //
  // Iterate list items
  //

  nextLine = startLine;
  prevEmptyEnd = false;
  terminatorRules = state.md.block.ruler.getRules('list');
  oldParentType = state.parentType;
  state.parentType = 'list';

  while (nextLine < endLine) {
    pos = posAfterMarker;
    max = state.eMarks[nextLine];
    initial = offset = state.sCount[nextLine] + posAfterMarker - (state.bMarks[startLine] + state.tShift[startLine]);

    while (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (ch === 0x09) {
        offset += 4 - (offset + state.bsCount[nextLine]) % 4;
      } else if (ch === 0x20) {
        offset++;
      } else {
        break;
      }

      pos++;
    }

    contentStart = pos;

    if (contentStart >= max) {
      // trimming space in "-    \n  3" case, indent is 1 here
      indentAfterMarker = 1;
    } else {
      indentAfterMarker = offset - initial;
    } // If we have more than 4 spaces, the indent is 1
    // (the rest is just indented code block)


    if (indentAfterMarker > 4) {
      indentAfterMarker = 1;
    } // "  -  test"
    //  ^^^^^ - calculating total length of this thing


    indent = initial + indentAfterMarker; // Run subparser & write tokens

    token = state.push('list_item_open', 'li', 1);
    token.markup = String.fromCharCode(markerCharCode);
    token.map = itemLines = [startLine, 0];

    if (isOrdered) {
      token.info = state.src.slice(start, posAfterMarker - 1);
    } // change current state, then restore it after parser subcall


    oldTight = state.tight;
    oldTShift = state.tShift[startLine];
    oldSCount = state.sCount[startLine]; //  - example list
    // ^ listIndent position will be here
    //   ^ blkIndent position will be here
    //

    oldListIndent = state.listIndent;
    state.listIndent = state.blkIndent;
    state.blkIndent = indent;
    state.tight = true;
    state.tShift[startLine] = contentStart - state.bMarks[startLine];
    state.sCount[startLine] = offset;

    if (contentStart >= max && state.isEmpty(startLine + 1)) {
      // workaround for this case
      // (list item is empty, list terminates before "foo"):
      // ~~~~~~~~
      //   -
      //
      //     foo
      // ~~~~~~~~
      state.line = Math.min(state.line + 2, endLine);
    } else {
      state.md.block.tokenize(state, startLine, endLine, true);
    } // If any of list item is tight, mark list as tight


    if (!state.tight || prevEmptyEnd) {
      tight = false;
    } // Item become loose if finish with empty line,
    // but we should filter last element, because it means list finish


    prevEmptyEnd = state.line - startLine > 1 && state.isEmpty(state.line - 1);
    state.blkIndent = state.listIndent;
    state.listIndent = oldListIndent;
    state.tShift[startLine] = oldTShift;
    state.sCount[startLine] = oldSCount;
    state.tight = oldTight;
    token = state.push('list_item_close', 'li', -1);
    token.markup = String.fromCharCode(markerCharCode);
    nextLine = startLine = state.line;
    itemLines[1] = nextLine;
    contentStart = state.bMarks[startLine];

    if (nextLine >= endLine) {
      break;
    } //
    // Try to check if list is terminated or continued.
    //


    if (state.sCount[nextLine] < state.blkIndent) {
      break;
    } // if it's indented more than 3 spaces, it should be a code block


    if (state.sCount[startLine] - state.blkIndent >= 4) {
      break;
    } // fail if terminating block found


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    } // fail if list has another type


    if (isOrdered) {
      posAfterMarker = skipOrderedListMarker(state, nextLine);

      if (posAfterMarker < 0) {
        break;
      }

      start = state.bMarks[nextLine] + state.tShift[nextLine];
    } else {
      posAfterMarker = skipBulletListMarker(state, nextLine);

      if (posAfterMarker < 0) {
        break;
      }
    }

    if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) {
      break;
    }
  } // Finalize list


  if (isOrdered) {
    token = state.push('ordered_list_close', 'ol', -1);
  } else {
    token = state.push('bullet_list_close', 'ul', -1);
  }

  token.markup = String.fromCharCode(markerCharCode);
  listLines[1] = nextLine;
  state.line = nextLine;
  state.parentType = oldParentType; // mark paragraphs tight if needed

  if (tight) {
    markTightParagraphs(state, listTokIdx);
  }

  return true;
};

var normalizeReference$2 = utils$2.normalizeReference;
var isSpace$6 = utils$2.isSpace;

var reference = function reference(state, startLine, _endLine, silent) {
  var ch,
      destEndPos,
      destEndLineNo,
      endLine,
      href,
      i,
      l,
      label,
      labelEnd,
      oldParentType,
      res,
      start,
      str,
      terminate,
      terminatorRules,
      title,
      lines = 0,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine],
      nextLine = startLine + 1; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  if (state.src.charCodeAt(pos) !== 0x5B
  /* [ */
  ) {
    return false;
  } // Simple check to quickly interrupt scan on [link](url) at the start of line.
  // Can be useful on practice: https://github.com/markdown-it/markdown-it/issues/54


  while (++pos < max) {
    if (state.src.charCodeAt(pos) === 0x5D
    /* ] */
    && state.src.charCodeAt(pos - 1) !== 0x5C
    /* \ */
    ) {
      if (pos + 1 === max) {
        return false;
      }

      if (state.src.charCodeAt(pos + 1) !== 0x3A
      /* : */
      ) {
        return false;
      }

      break;
    }
  }

  endLine = state.lineMax; // jump line-by-line until empty one or EOF

  terminatorRules = state.md.block.ruler.getRules('reference');
  oldParentType = state.parentType;
  state.parentType = 'reference';

  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) {
      continue;
    } // quirk for blockquotes, this line should already be checked by that rule


    if (state.sCount[nextLine] < 0) {
      continue;
    } // Some tags can terminate paragraph without empty line.


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    }
  }

  str = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  max = str.length;

  for (pos = 1; pos < max; pos++) {
    ch = str.charCodeAt(pos);

    if (ch === 0x5B
    /* [ */
    ) {
      return false;
    } else if (ch === 0x5D
    /* ] */
    ) {
      labelEnd = pos;
      break;
    } else if (ch === 0x0A
    /* \n */
    ) {
      lines++;
    } else if (ch === 0x5C
    /* \ */
    ) {
      pos++;

      if (pos < max && str.charCodeAt(pos) === 0x0A) {
        lines++;
      }
    }
  }

  if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 0x3A
  /* : */
  ) {
    return false;
  } // [label]:   destination   'title'
  //         ^^^ skip optional whitespace here


  for (pos = labelEnd + 2; pos < max; pos++) {
    ch = str.charCodeAt(pos);

    if (ch === 0x0A) {
      lines++;
    } else if (isSpace$6(ch)) ; else {
      break;
    }
  } // [label]:   destination   'title'
  //            ^^^^^^^^^^^ parse this


  res = state.md.helpers.parseLinkDestination(str, pos, max);

  if (!res.ok) {
    return false;
  }

  href = state.md.normalizeLink(res.str);

  if (!state.md.validateLink(href)) {
    return false;
  }

  pos = res.pos;
  lines += res.lines; // save cursor state, we could require to rollback later

  destEndPos = pos;
  destEndLineNo = lines; // [label]:   destination   'title'
  //                       ^^^ skipping those spaces

  start = pos;

  for (; pos < max; pos++) {
    ch = str.charCodeAt(pos);

    if (ch === 0x0A) {
      lines++;
    } else if (isSpace$6(ch)) ; else {
      break;
    }
  } // [label]:   destination   'title'
  //                          ^^^^^^^ parse this


  res = state.md.helpers.parseLinkTitle(str, pos, max);

  if (pos < max && start !== pos && res.ok) {
    title = res.str;
    pos = res.pos;
    lines += res.lines;
  } else {
    title = '';
    pos = destEndPos;
    lines = destEndLineNo;
  } // skip trailing spaces until the rest of the line


  while (pos < max) {
    ch = str.charCodeAt(pos);

    if (!isSpace$6(ch)) {
      break;
    }

    pos++;
  }

  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
    if (title) {
      // garbage at the end of the line after title,
      // but it could still be a valid reference if we roll back
      title = '';
      pos = destEndPos;
      lines = destEndLineNo;

      while (pos < max) {
        ch = str.charCodeAt(pos);

        if (!isSpace$6(ch)) {
          break;
        }

        pos++;
      }
    }
  }

  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
    // garbage at the end of the line
    return false;
  }

  label = normalizeReference$2(str.slice(1, labelEnd));

  if (!label) {
    // CommonMark 0.20 disallows empty labels
    return false;
  } // Reference can not terminate anything. This check is for safety only.

  /*istanbul ignore if*/


  if (silent) {
    return true;
  }

  if (typeof state.env.references === 'undefined') {
    state.env.references = {};
  }

  if (typeof state.env.references[label] === 'undefined') {
    state.env.references[label] = {
      title: title,
      href: href
    };
  }

  state.parentType = oldParentType;
  state.line = startLine + lines + 1;
  return true;
};

var html_blocks = ['address', 'article', 'aside', 'base', 'basefont', 'blockquote', 'body', 'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dialog', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'iframe', 'legend', 'li', 'link', 'main', 'menu', 'menuitem', 'nav', 'noframes', 'ol', 'optgroup', 'option', 'p', 'param', 'section', 'source', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul'];

var html_re = {};

var attr_name = '[a-zA-Z_:][a-zA-Z0-9:._-]*';
var unquoted = '[^"\'=<>`\\x00-\\x20]+';
var single_quoted = "'[^']*'";
var double_quoted = '"[^"]*"';
var attr_value = '(?:' + unquoted + '|' + single_quoted + '|' + double_quoted + ')';
var attribute = '(?:\\s+' + attr_name + '(?:\\s*=\\s*' + attr_value + ')?)';
var open_tag = '<[A-Za-z][A-Za-z0-9\\-]*' + attribute + '*\\s*\\/?>';
var close_tag = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>';
var comment$2 = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->';
var processing = '<[?][\\s\\S]*?[?]>';
var declaration = '<![A-Z]+\\s+[^>]*>';
var cdata = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>';
var HTML_TAG_RE$1 = new RegExp('^(?:' + open_tag + '|' + close_tag + '|' + comment$2 + '|' + processing + '|' + declaration + '|' + cdata + ')');
var HTML_OPEN_CLOSE_TAG_RE$1 = new RegExp('^(?:' + open_tag + '|' + close_tag + ')');
html_re.HTML_TAG_RE = HTML_TAG_RE$1;
html_re.HTML_OPEN_CLOSE_TAG_RE = HTML_OPEN_CLOSE_TAG_RE$1;

var block_names = html_blocks;
var HTML_OPEN_CLOSE_TAG_RE = html_re.HTML_OPEN_CLOSE_TAG_RE; // An array of opening and corresponding closing sequences for html tags,
// last argument defines whether it can terminate a paragraph or not
//

var HTML_SEQUENCES = [[/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, true], [/^<!--/, /-->/, true], [/^<\?/, /\?>/, true], [/^<![A-Z]/, />/, true], [/^<!\[CDATA\[/, /\]\]>/, true], [new RegExp('^</?(' + block_names.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, true], [new RegExp(HTML_OPEN_CLOSE_TAG_RE.source + '\\s*$'), /^$/, false]];

var html_block = function html_block(state, startLine, endLine, silent) {
  var i,
      nextLine,
      token,
      lineText,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  if (!state.md.options.html) {
    return false;
  }

  if (state.src.charCodeAt(pos) !== 0x3C
  /* < */
  ) {
    return false;
  }

  lineText = state.src.slice(pos, max);

  for (i = 0; i < HTML_SEQUENCES.length; i++) {
    if (HTML_SEQUENCES[i][0].test(lineText)) {
      break;
    }
  }

  if (i === HTML_SEQUENCES.length) {
    return false;
  }

  if (silent) {
    // true if this sequence can be a terminator, false otherwise
    return HTML_SEQUENCES[i][2];
  }

  nextLine = startLine + 1; // If we are here - we detected HTML block.
  // Let's roll down till block end.

  if (!HTML_SEQUENCES[i][1].test(lineText)) {
    for (; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) {
        break;
      }

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      lineText = state.src.slice(pos, max);

      if (HTML_SEQUENCES[i][1].test(lineText)) {
        if (lineText.length !== 0) {
          nextLine++;
        }

        break;
      }
    }
  }

  state.line = nextLine;
  token = state.push('html_block', '', 0);
  token.map = [startLine, nextLine];
  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
  return true;
};

var isSpace$5 = utils$2.isSpace;

var heading = function heading(state, startLine, endLine, silent) {
  var ch,
      level,
      tmp,
      token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine]; // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  ch = state.src.charCodeAt(pos);

  if (ch !== 0x23
  /* # */
  || pos >= max) {
    return false;
  } // count heading level


  level = 1;
  ch = state.src.charCodeAt(++pos);

  while (ch === 0x23
  /* # */
  && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }

  if (level > 6 || pos < max && !isSpace$5(ch)) {
    return false;
  }

  if (silent) {
    return true;
  } // Let's cut tails like '    ###  ' from the end of string


  max = state.skipSpacesBack(max, pos);
  tmp = state.skipCharsBack(max, 0x23, pos); // #

  if (tmp > pos && isSpace$5(state.src.charCodeAt(tmp - 1))) {
    max = tmp;
  }

  state.line = startLine + 1;
  token = state.push('heading_open', 'h' + String(level), 1);
  token.markup = '########'.slice(0, level);
  token.map = [startLine, state.line];
  token = state.push('inline', '', 0);
  token.content = state.src.slice(pos, max).trim();
  token.map = [startLine, state.line];
  token.children = [];
  token = state.push('heading_close', 'h' + String(level), -1);
  token.markup = '########'.slice(0, level);
  return true;
};

var lheading = function lheading(state, startLine, endLine
/*, silent*/
) {
  var content,
      terminate,
      i,
      l,
      token,
      pos,
      max,
      level,
      marker,
      nextLine = startLine + 1,
      oldParentType,
      terminatorRules = state.md.block.ruler.getRules('paragraph'); // if it's indented more than 3 spaces, it should be a code block

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  oldParentType = state.parentType;
  state.parentType = 'paragraph'; // use paragraph to match terminatorRules
  // jump line-by-line until empty one or EOF

  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) {
      continue;
    } //
    // Check for underline in setext header
    //


    if (state.sCount[nextLine] >= state.blkIndent) {
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max) {
        marker = state.src.charCodeAt(pos);

        if (marker === 0x2D
        /* - */
        || marker === 0x3D
        /* = */
        ) {
          pos = state.skipChars(pos, marker);
          pos = state.skipSpaces(pos);

          if (pos >= max) {
            level = marker === 0x3D
            /* = */
            ? 1 : 2;
            break;
          }
        }
      }
    } // quirk for blockquotes, this line should already be checked by that rule


    if (state.sCount[nextLine] < 0) {
      continue;
    } // Some tags can terminate paragraph without empty line.


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    }
  }

  if (!level) {
    // Didn't find valid underline
    return false;
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  state.line = nextLine + 1;
  token = state.push('heading_open', 'h' + String(level), 1);
  token.markup = String.fromCharCode(marker);
  token.map = [startLine, state.line];
  token = state.push('inline', '', 0);
  token.content = content;
  token.map = [startLine, state.line - 1];
  token.children = [];
  token = state.push('heading_close', 'h' + String(level), -1);
  token.markup = String.fromCharCode(marker);
  state.parentType = oldParentType;
  return true;
};

var paragraph = function paragraph(state, startLine
/*, endLine*/
) {
  var content,
      terminate,
      i,
      l,
      token,
      oldParentType,
      nextLine = startLine + 1,
      terminatorRules = state.md.block.ruler.getRules('paragraph'),
      endLine = state.lineMax;
  oldParentType = state.parentType;
  state.parentType = 'paragraph'; // jump line-by-line until empty one or EOF

  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) {
      continue;
    } // quirk for blockquotes, this line should already be checked by that rule


    if (state.sCount[nextLine] < 0) {
      continue;
    } // Some tags can terminate paragraph without empty line.


    terminate = false;

    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    }
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  state.line = nextLine;
  token = state.push('paragraph_open', 'p', 1);
  token.map = [startLine, state.line];
  token = state.push('inline', '', 0);
  token.content = content;
  token.map = [startLine, state.line];
  token.children = [];
  token = state.push('paragraph_close', 'p', -1);
  state.parentType = oldParentType;
  return true;
};

var Token$1 = token;
var isSpace$4 = utils$2.isSpace;

function StateBlock(src, md, env, tokens) {
  var ch, s, start, pos, len, indent, offset, indent_found;
  this.src = src; // link to parser instance

  this.md = md;
  this.env = env; //
  // Internal state vartiables
  //

  this.tokens = tokens;
  this.bMarks = []; // line begin offsets for fast jumps

  this.eMarks = []; // line end offsets for fast jumps

  this.tShift = []; // offsets of the first non-space characters (tabs not expanded)

  this.sCount = []; // indents for each line (tabs expanded)
  // An amount of virtual spaces (tabs expanded) between beginning
  // of each line (bMarks) and real beginning of that line.
  //
  // It exists only as a hack because blockquotes override bMarks
  // losing information in the process.
  //
  // It's used only when expanding tabs, you can think about it as
  // an initial tab length, e.g. bsCount=21 applied to string `\t123`
  // means first tab should be expanded to 4-21%4 === 3 spaces.
  //

  this.bsCount = []; // block parser variables

  this.blkIndent = 0; // required block content indent (for example, if we are
  // inside a list, it would be positioned after list marker)

  this.line = 0; // line index in src

  this.lineMax = 0; // lines count

  this.tight = false; // loose/tight mode for lists

  this.ddIndent = -1; // indent of the current dd block (-1 if there isn't any)

  this.listIndent = -1; // indent of the current list block (-1 if there isn't any)
  // can be 'blockquote', 'list', 'root', 'paragraph' or 'reference'
  // used in lists to determine if they interrupt a paragraph

  this.parentType = 'root';
  this.level = 0; // renderer

  this.result = ''; // Create caches
  // Generate markers.

  s = this.src;
  indent_found = false;

  for (start = pos = indent = offset = 0, len = s.length; pos < len; pos++) {
    ch = s.charCodeAt(pos);

    if (!indent_found) {
      if (isSpace$4(ch)) {
        indent++;

        if (ch === 0x09) {
          offset += 4 - offset % 4;
        } else {
          offset++;
        }

        continue;
      } else {
        indent_found = true;
      }
    }

    if (ch === 0x0A || pos === len - 1) {
      if (ch !== 0x0A) {
        pos++;
      }

      this.bMarks.push(start);
      this.eMarks.push(pos);
      this.tShift.push(indent);
      this.sCount.push(offset);
      this.bsCount.push(0);
      indent_found = false;
      indent = 0;
      offset = 0;
      start = pos + 1;
    }
  } // Push fake entry to simplify cache bounds checks


  this.bMarks.push(s.length);
  this.eMarks.push(s.length);
  this.tShift.push(0);
  this.sCount.push(0);
  this.bsCount.push(0);
  this.lineMax = this.bMarks.length - 1; // don't count last fake line
} // Push new token to "stream".
//


StateBlock.prototype.push = function (type, tag, nesting) {
  var token = new Token$1(type, tag, nesting);
  token.block = true;
  if (nesting < 0) this.level--; // closing tag

  token.level = this.level;
  if (nesting > 0) this.level++; // opening tag

  this.tokens.push(token);
  return token;
};

StateBlock.prototype.isEmpty = function isEmpty(line) {
  return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
};

StateBlock.prototype.skipEmptyLines = function skipEmptyLines(from) {
  for (var max = this.lineMax; from < max; from++) {
    if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
      break;
    }
  }

  return from;
}; // Skip spaces from given position.


StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
  var ch;

  for (var max = this.src.length; pos < max; pos++) {
    ch = this.src.charCodeAt(pos);

    if (!isSpace$4(ch)) {
      break;
    }
  }

  return pos;
}; // Skip spaces from given position in reverse.


StateBlock.prototype.skipSpacesBack = function skipSpacesBack(pos, min) {
  if (pos <= min) {
    return pos;
  }

  while (pos > min) {
    if (!isSpace$4(this.src.charCodeAt(--pos))) {
      return pos + 1;
    }
  }

  return pos;
}; // Skip char codes from given position


StateBlock.prototype.skipChars = function skipChars(pos, code) {
  for (var max = this.src.length; pos < max; pos++) {
    if (this.src.charCodeAt(pos) !== code) {
      break;
    }
  }

  return pos;
}; // Skip char codes reverse from given position - 1


StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code, min) {
  if (pos <= min) {
    return pos;
  }

  while (pos > min) {
    if (code !== this.src.charCodeAt(--pos)) {
      return pos + 1;
    }
  }

  return pos;
}; // cut lines range from source.


StateBlock.prototype.getLines = function getLines(begin, end, indent, keepLastLF) {
  var i,
      lineIndent,
      ch,
      first,
      last,
      queue,
      lineStart,
      line = begin;

  if (begin >= end) {
    return '';
  }

  queue = new Array(end - begin);

  for (i = 0; line < end; line++, i++) {
    lineIndent = 0;
    lineStart = first = this.bMarks[line];

    if (line + 1 < end || keepLastLF) {
      // No need for bounds check because we have fake entry on tail.
      last = this.eMarks[line] + 1;
    } else {
      last = this.eMarks[line];
    }

    while (first < last && lineIndent < indent) {
      ch = this.src.charCodeAt(first);

      if (isSpace$4(ch)) {
        if (ch === 0x09) {
          lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
        } else {
          lineIndent++;
        }
      } else if (first - lineStart < this.tShift[line]) {
        // patched tShift masked characters to look like spaces (blockquotes, list markers)
        lineIndent++;
      } else {
        break;
      }

      first++;
    }

    if (lineIndent > indent) {
      // partially expanding tabs in code blocks, e.g '\t\tfoobar'
      // with indent=2 becomes '  \tfoobar'
      queue[i] = new Array(lineIndent - indent + 1).join(' ') + this.src.slice(first, last);
    } else {
      queue[i] = this.src.slice(first, last);
    }
  }

  return queue.join('');
}; // re-export Token class to use in block rules


StateBlock.prototype.Token = Token$1;
var state_block = StateBlock;

/** internal
 * class ParserBlock
 *
 * Block-level tokenizer.
 **/

var Ruler$1 = ruler;
var _rules$1 = [// First 2 params - rule name & source. Secondary array - list of rules,
// which can be terminated by this one.
['table', table, ['paragraph', 'reference']], ['code', code], ['fence', fence, ['paragraph', 'reference', 'blockquote', 'list']], ['blockquote', blockquote, ['paragraph', 'reference', 'blockquote', 'list']], ['hr', hr, ['paragraph', 'reference', 'blockquote', 'list']], ['list', list, ['paragraph', 'reference', 'blockquote']], ['reference', reference], ['html_block', html_block, ['paragraph', 'reference', 'blockquote']], ['heading', heading, ['paragraph', 'reference', 'blockquote']], ['lheading', lheading], ['paragraph', paragraph]];
/**
 * new ParserBlock()
 **/

function ParserBlock$1() {
  /**
   * ParserBlock#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of block rules.
   **/
  this.ruler = new Ruler$1();

  for (var i = 0; i < _rules$1.length; i++) {
    this.ruler.push(_rules$1[i][0], _rules$1[i][1], {
      alt: (_rules$1[i][2] || []).slice()
    });
  }
} // Generate tokens for input range
//


ParserBlock$1.prototype.tokenize = function (state, startLine, endLine) {
  var ok,
      i,
      rules = this.ruler.getRules(''),
      len = rules.length,
      line = startLine,
      hasEmptyLines = false,
      maxNesting = state.md.options.maxNesting;

  while (line < endLine) {
    state.line = line = state.skipEmptyLines(line);

    if (line >= endLine) {
      break;
    } // Termination condition for nested calls.
    // Nested calls currently used for blockquotes & lists


    if (state.sCount[line] < state.blkIndent) {
      break;
    } // If nesting level exceeded - skip tail to the end. That's not ordinary
    // situation and we should not care about content.


    if (state.level >= maxNesting) {
      state.line = endLine;
      break;
    } // Try all possible rules.
    // On success, rule should:
    //
    // - update `state.line`
    // - update `state.tokens`
    // - return true


    for (i = 0; i < len; i++) {
      ok = rules[i](state, line, endLine, false);

      if (ok) {
        break;
      }
    } // set state.tight if we had an empty line before current tag
    // i.e. latest empty line should not count


    state.tight = !hasEmptyLines; // paragraph might "eat" one newline after it in nested lists

    if (state.isEmpty(state.line - 1)) {
      hasEmptyLines = true;
    }

    line = state.line;

    if (line < endLine && state.isEmpty(line)) {
      hasEmptyLines = true;
      line++;
      state.line = line;
    }
  }
};
/**
 * ParserBlock.parse(str, md, env, outTokens)
 *
 * Process input string and push block tokens into `outTokens`
 **/


ParserBlock$1.prototype.parse = function (src, md, env, outTokens) {
  var state;

  if (!src) {
    return;
  }

  state = new this.State(src, md, env, outTokens);
  this.tokenize(state, state.line, state.lineMax);
};

ParserBlock$1.prototype.State = state_block;
var parser_block = ParserBlock$1;

// '{}$%@~+=:' reserved for extentions
// !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~
// !!!! Don't confuse with "Markdown ASCII Punctuation" chars
// http://spec.commonmark.org/0.15/#ascii-punctuation-character


function isTerminatorChar(ch) {
  switch (ch) {
    case 0x0A
    /* \n */
    :
    case 0x21
    /* ! */
    :
    case 0x23
    /* # */
    :
    case 0x24
    /* $ */
    :
    case 0x25
    /* % */
    :
    case 0x26
    /* & */
    :
    case 0x2A
    /* * */
    :
    case 0x2B
    /* + */
    :
    case 0x2D
    /* - */
    :
    case 0x3A
    /* : */
    :
    case 0x3C
    /* < */
    :
    case 0x3D
    /* = */
    :
    case 0x3E
    /* > */
    :
    case 0x40
    /* @ */
    :
    case 0x5B
    /* [ */
    :
    case 0x5C
    /* \ */
    :
    case 0x5D
    /* ] */
    :
    case 0x5E
    /* ^ */
    :
    case 0x5F
    /* _ */
    :
    case 0x60
    /* ` */
    :
    case 0x7B
    /* { */
    :
    case 0x7D
    /* } */
    :
    case 0x7E
    /* ~ */
    :
      return true;

    default:
      return false;
  }
}

var text$1 = function text(state, silent) {
  var pos = state.pos;

  while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
    pos++;
  }

  if (pos === state.pos) {
    return false;
  }

  if (!silent) {
    state.pending += state.src.slice(state.pos, pos);
  }

  state.pos = pos;
  return true;
}; // Alternative implementation, for memory.

var isSpace$3 = utils$2.isSpace;

var newline = function newline(state, silent) {
  var pmax,
      max,
      ws,
      pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x0A
  /* \n */
  ) {
    return false;
  }

  pmax = state.pending.length - 1;
  max = state.posMax; // '  \n' -> hardbreak
  // Lookup in pending chars is bad practice! Don't copy to other rules!
  // Pending string is stored in concat mode, indexed lookups will cause
  // convertion to flat mode.

  if (!silent) {
    if (pmax >= 0 && state.pending.charCodeAt(pmax) === 0x20) {
      if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 0x20) {
        // Find whitespaces tail of pending chars.
        ws = pmax - 1;

        while (ws >= 1 && state.pending.charCodeAt(ws - 1) === 0x20) ws--;

        state.pending = state.pending.slice(0, ws);
        state.push('hardbreak', 'br', 0);
      } else {
        state.pending = state.pending.slice(0, -1);
        state.push('softbreak', 'br', 0);
      }
    } else {
      state.push('softbreak', 'br', 0);
    }
  }

  pos++; // skip heading spaces for next line

  while (pos < max && isSpace$3(state.src.charCodeAt(pos))) {
    pos++;
  }

  state.pos = pos;
  return true;
};

var isSpace$2 = utils$2.isSpace;
var ESCAPED = [];

for (var i = 0; i < 256; i++) {
  ESCAPED.push(0);
}

'\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-'.split('').forEach(function (ch) {
  ESCAPED[ch.charCodeAt(0)] = 1;
});

var _escape = function escape(state, silent) {
  var ch,
      pos = state.pos,
      max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x5C
  /* \ */
  ) {
    return false;
  }

  pos++;

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (ch < 256 && ESCAPED[ch] !== 0) {
      if (!silent) {
        state.pending += state.src[pos];
      }

      state.pos += 2;
      return true;
    }

    if (ch === 0x0A) {
      if (!silent) {
        state.push('hardbreak', 'br', 0);
      }

      pos++; // skip leading whitespaces from next line

      while (pos < max) {
        ch = state.src.charCodeAt(pos);

        if (!isSpace$2(ch)) {
          break;
        }

        pos++;
      }

      state.pos = pos;
      return true;
    }
  }

  if (!silent) {
    state.pending += '\\';
  }

  state.pos++;
  return true;
};

var backticks = function backtick(state, silent) {
  var start,
      max,
      marker,
      token,
      matchStart,
      matchEnd,
      openerLength,
      closerLength,
      pos = state.pos,
      ch = state.src.charCodeAt(pos);

  if (ch !== 0x60
  /* ` */
  ) {
    return false;
  }

  start = pos;
  pos++;
  max = state.posMax; // scan marker length

  while (pos < max && state.src.charCodeAt(pos) === 0x60
  /* ` */
  ) {
    pos++;
  }

  marker = state.src.slice(start, pos);
  openerLength = marker.length;

  if (state.backticksScanned && (state.backticks[openerLength] || 0) <= start) {
    if (!silent) state.pending += marker;
    state.pos += openerLength;
    return true;
  }

  matchStart = matchEnd = pos; // Nothing found in the cache, scan until the end of the line (or until marker is found)

  while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
    matchEnd = matchStart + 1; // scan marker length

    while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60
    /* ` */
    ) {
      matchEnd++;
    }

    closerLength = matchEnd - matchStart;

    if (closerLength === openerLength) {
      // Found matching closer length.
      if (!silent) {
        token = state.push('code_inline', 'code', 0);
        token.markup = marker;
        token.content = state.src.slice(pos, matchStart).replace(/\n/g, ' ').replace(/^ (.+) $/, '$1');
      }

      state.pos = matchEnd;
      return true;
    } // Some different length found, put it in cache as upper limit of where closer can be found


    state.backticks[closerLength] = matchStart;
  } // Scanned through the end, didn't find anything


  state.backticksScanned = true;
  if (!silent) state.pending += marker;
  state.pos += openerLength;
  return true;
};

var strikethrough = {};

//


strikethrough.tokenize = function strikethrough(state, silent) {
  var i,
      scanned,
      token,
      len,
      ch,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (silent) {
    return false;
  }

  if (marker !== 0x7E
  /* ~ */
  ) {
    return false;
  }

  scanned = state.scanDelims(state.pos, true);
  len = scanned.length;
  ch = String.fromCharCode(marker);

  if (len < 2) {
    return false;
  }

  if (len % 2) {
    token = state.push('text', '', 0);
    token.content = ch;
    len--;
  }

  for (i = 0; i < len; i += 2) {
    token = state.push('text', '', 0);
    token.content = ch + ch;
    state.delimiters.push({
      marker: marker,
      length: 0,
      // disable "rule of 3" length checks meant for emphasis
      token: state.tokens.length - 1,
      end: -1,
      open: scanned.can_open,
      close: scanned.can_close
    });
  }

  state.pos += scanned.length;
  return true;
};

function postProcess$1(state, delimiters) {
  var i,
      j,
      startDelim,
      endDelim,
      token,
      loneMarkers = [],
      max = delimiters.length;

  for (i = 0; i < max; i++) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x7E
    /* ~ */
    ) {
      continue;
    }

    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end];
    token = state.tokens[startDelim.token];
    token.type = 's_open';
    token.tag = 's';
    token.nesting = 1;
    token.markup = '~~';
    token.content = '';
    token = state.tokens[endDelim.token];
    token.type = 's_close';
    token.tag = 's';
    token.nesting = -1;
    token.markup = '~~';
    token.content = '';

    if (state.tokens[endDelim.token - 1].type === 'text' && state.tokens[endDelim.token - 1].content === '~') {
      loneMarkers.push(endDelim.token - 1);
    }
  } // If a marker sequence has an odd number of characters, it's splitted
  // like this: `~~~~~` -> `~` + `~~` + `~~`, leaving one marker at the
  // start of the sequence.
  //
  // So, we have to move all those markers after subsequent s_close tags.
  //


  while (loneMarkers.length) {
    i = loneMarkers.pop();
    j = i + 1;

    while (j < state.tokens.length && state.tokens[j].type === 's_close') {
      j++;
    }

    j--;

    if (i !== j) {
      token = state.tokens[j];
      state.tokens[j] = state.tokens[i];
      state.tokens[i] = token;
    }
  }
} // Walk through delimiter list and replace text tokens with tags
//


strikethrough.postProcess = function strikethrough(state) {
  var curr,
      tokens_meta = state.tokens_meta,
      max = state.tokens_meta.length;
  postProcess$1(state, state.delimiters);

  for (curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      postProcess$1(state, tokens_meta[curr].delimiters);
    }
  }
};

var emphasis = {};

//


emphasis.tokenize = function emphasis(state, silent) {
  var i,
      scanned,
      token,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (silent) {
    return false;
  }

  if (marker !== 0x5F
  /* _ */
  && marker !== 0x2A
  /* * */
  ) {
    return false;
  }

  scanned = state.scanDelims(state.pos, marker === 0x2A);

  for (i = 0; i < scanned.length; i++) {
    token = state.push('text', '', 0);
    token.content = String.fromCharCode(marker);
    state.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: marker,
      // Total length of these series of delimiters.
      //
      length: scanned.length,
      // A position of the token this delimiter corresponds to.
      //
      token: state.tokens.length - 1,
      // If this delimiter is matched as a valid opener, `end` will be
      // equal to its position, otherwise it's `-1`.
      //
      end: -1,
      // Boolean flags that determine if this delimiter could open or close
      // an emphasis.
      //
      open: scanned.can_open,
      close: scanned.can_close
    });
  }

  state.pos += scanned.length;
  return true;
};

function postProcess(state, delimiters) {
  var i,
      startDelim,
      endDelim,
      token,
      ch,
      isStrong,
      max = delimiters.length;

  for (i = max - 1; i >= 0; i--) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x5F
    /* _ */
    && startDelim.marker !== 0x2A
    /* * */
    ) {
      continue;
    } // Process only opening markers


    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end]; // If the previous delimiter has the same marker and is adjacent to this one,
    // merge those into one strong delimiter.
    //
    // `<em><em>whatever</em></em>` -> `<strong>whatever</strong>`
    //

    isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && // check that first two markers match and adjacent
    delimiters[i - 1].marker === startDelim.marker && delimiters[i - 1].token === startDelim.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
    delimiters[startDelim.end + 1].token === endDelim.token + 1;
    ch = String.fromCharCode(startDelim.marker);
    token = state.tokens[startDelim.token];
    token.type = isStrong ? 'strong_open' : 'em_open';
    token.tag = isStrong ? 'strong' : 'em';
    token.nesting = 1;
    token.markup = isStrong ? ch + ch : ch;
    token.content = '';
    token = state.tokens[endDelim.token];
    token.type = isStrong ? 'strong_close' : 'em_close';
    token.tag = isStrong ? 'strong' : 'em';
    token.nesting = -1;
    token.markup = isStrong ? ch + ch : ch;
    token.content = '';

    if (isStrong) {
      state.tokens[delimiters[i - 1].token].content = '';
      state.tokens[delimiters[startDelim.end + 1].token].content = '';
      i--;
    }
  }
} // Walk through delimiter list and replace text tokens with tags
//


emphasis.postProcess = function emphasis(state) {
  var curr,
      tokens_meta = state.tokens_meta,
      max = state.tokens_meta.length;
  postProcess(state, state.delimiters);

  for (curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      postProcess(state, tokens_meta[curr].delimiters);
    }
  }
};

var normalizeReference$1 = utils$2.normalizeReference;
var isSpace$1 = utils$2.isSpace;

var link = function link(state, silent) {
  var attrs,
      code,
      label,
      labelEnd,
      labelStart,
      pos,
      res,
      ref,
      token,
      href = '',
      title = '',
      oldPos = state.pos,
      max = state.posMax,
      start = state.pos,
      parseReference = true;

  if (state.src.charCodeAt(state.pos) !== 0x5B
  /* [ */
  ) {
    return false;
  }

  labelStart = state.pos + 1;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true); // parser failed to find ']', so it's not a valid link

  if (labelEnd < 0) {
    return false;
  }

  pos = labelEnd + 1;

  if (pos < max && state.src.charCodeAt(pos) === 0x28
  /* ( */
  ) {
    //
    // Inline link
    //
    // might have found a valid shortcut link, disable reference parsing
    parseReference = false; // [link](  <href>  "title"  )
    //        ^^ skipping these spaces

    pos++;

    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);

      if (!isSpace$1(code) && code !== 0x0A) {
        break;
      }
    }

    if (pos >= max) {
      return false;
    } // [link](  <href>  "title"  )
    //          ^^^^^^ parsing link destination


    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);

    if (res.ok) {
      href = state.md.normalizeLink(res.str);

      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = '';
      } // [link](  <href>  "title"  )
      //                ^^ skipping these spaces


      start = pos;

      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);

        if (!isSpace$1(code) && code !== 0x0A) {
          break;
        }
      } // [link](  <href>  "title"  )
      //                  ^^^^^^^ parsing link title


      res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);

      if (pos < max && start !== pos && res.ok) {
        title = res.str;
        pos = res.pos; // [link](  <href>  "title"  )
        //                         ^^ skipping these spaces

        for (; pos < max; pos++) {
          code = state.src.charCodeAt(pos);

          if (!isSpace$1(code) && code !== 0x0A) {
            break;
          }
        }
      }
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29
    /* ) */
    ) {
      // parsing a valid shortcut link failed, fallback to reference
      parseReference = true;
    }

    pos++;
  }

  if (parseReference) {
    //
    // Link reference
    //
    if (typeof state.env.references === 'undefined') {
      return false;
    }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B
    /* [ */
    ) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);

      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    } // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)


    if (!label) {
      label = state.src.slice(labelStart, labelEnd);
    }

    ref = state.env.references[normalizeReference$1(label)];

    if (!ref) {
      state.pos = oldPos;
      return false;
    }

    href = ref.href;
    title = ref.title;
  } //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //


  if (!silent) {
    state.pos = labelStart;
    state.posMax = labelEnd;
    token = state.push('link_open', 'a', 1);
    token.attrs = attrs = [['href', href]];

    if (title) {
      attrs.push(['title', title]);
    }

    state.md.inline.tokenize(state);
    token = state.push('link_close', 'a', -1);
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

var normalizeReference = utils$2.normalizeReference;
var isSpace = utils$2.isSpace;

var image = function image(state, silent) {
  var attrs,
      code,
      content,
      label,
      labelEnd,
      labelStart,
      pos,
      ref,
      res,
      title,
      token,
      tokens,
      start,
      href = '',
      oldPos = state.pos,
      max = state.posMax;

  if (state.src.charCodeAt(state.pos) !== 0x21
  /* ! */
  ) {
    return false;
  }

  if (state.src.charCodeAt(state.pos + 1) !== 0x5B
  /* [ */
  ) {
    return false;
  }

  labelStart = state.pos + 2;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false); // parser failed to find ']', so it's not a valid link

  if (labelEnd < 0) {
    return false;
  }

  pos = labelEnd + 1;

  if (pos < max && state.src.charCodeAt(pos) === 0x28
  /* ( */
  ) {
    //
    // Inline link
    //
    // [link](  <href>  "title"  )
    //        ^^ skipping these spaces
    pos++;

    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);

      if (!isSpace(code) && code !== 0x0A) {
        break;
      }
    }

    if (pos >= max) {
      return false;
    } // [link](  <href>  "title"  )
    //          ^^^^^^ parsing link destination


    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);

    if (res.ok) {
      href = state.md.normalizeLink(res.str);

      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = '';
      }
    } // [link](  <href>  "title"  )
    //                ^^ skipping these spaces


    start = pos;

    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);

      if (!isSpace(code) && code !== 0x0A) {
        break;
      }
    } // [link](  <href>  "title"  )
    //                  ^^^^^^^ parsing link title


    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);

    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos; // [link](  <href>  "title"  )
      //                         ^^ skipping these spaces

      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);

        if (!isSpace(code) && code !== 0x0A) {
          break;
        }
      }
    } else {
      title = '';
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29
    /* ) */
    ) {
      state.pos = oldPos;
      return false;
    }

    pos++;
  } else {
    //
    // Link reference
    //
    if (typeof state.env.references === 'undefined') {
      return false;
    }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B
    /* [ */
    ) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);

      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    } // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)


    if (!label) {
      label = state.src.slice(labelStart, labelEnd);
    }

    ref = state.env.references[normalizeReference(label)];

    if (!ref) {
      state.pos = oldPos;
      return false;
    }

    href = ref.href;
    title = ref.title;
  } //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //


  if (!silent) {
    content = state.src.slice(labelStart, labelEnd);
    state.md.inline.parse(content, state.md, state.env, tokens = []);
    token = state.push('image', 'img', 0);
    token.attrs = attrs = [['src', href], ['alt', '']];
    token.children = tokens;
    token.content = content;

    if (title) {
      attrs.push(['title', title]);
    }
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

/*eslint max-len:0*/


var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)$/;

var autolink = function autolink(state, silent) {
  var url,
      fullUrl,
      token,
      ch,
      start,
      max,
      pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x3C
  /* < */
  ) {
    return false;
  }

  start = state.pos;
  max = state.posMax;

  for (;;) {
    if (++pos >= max) return false;
    ch = state.src.charCodeAt(pos);
    if (ch === 0x3C
    /* < */
    ) return false;
    if (ch === 0x3E
    /* > */
    ) break;
  }

  url = state.src.slice(start + 1, pos);

  if (AUTOLINK_RE.test(url)) {
    fullUrl = state.md.normalizeLink(url);

    if (!state.md.validateLink(fullUrl)) {
      return false;
    }

    if (!silent) {
      token = state.push('link_open', 'a', 1);
      token.attrs = [['href', fullUrl]];
      token.markup = 'autolink';
      token.info = 'auto';
      token = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);
      token = state.push('link_close', 'a', -1);
      token.markup = 'autolink';
      token.info = 'auto';
    }

    state.pos += url.length + 2;
    return true;
  }

  if (EMAIL_RE.test(url)) {
    fullUrl = state.md.normalizeLink('mailto:' + url);

    if (!state.md.validateLink(fullUrl)) {
      return false;
    }

    if (!silent) {
      token = state.push('link_open', 'a', 1);
      token.attrs = [['href', fullUrl]];
      token.markup = 'autolink';
      token.info = 'auto';
      token = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);
      token = state.push('link_close', 'a', -1);
      token.markup = 'autolink';
      token.info = 'auto';
    }

    state.pos += url.length + 2;
    return true;
  }

  return false;
};

var HTML_TAG_RE = html_re.HTML_TAG_RE;

function isLetter(ch) {
  /*eslint no-bitwise:0*/
  var lc = ch | 0x20; // to lower case

  return lc >= 0x61
  /* a */
  && lc <= 0x7a
  /* z */
  ;
}

var html_inline = function html_inline(state, silent) {
  var ch,
      match,
      max,
      token,
      pos = state.pos;

  if (!state.md.options.html) {
    return false;
  } // Check start


  max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x3C
  /* < */
  || pos + 2 >= max) {
    return false;
  } // Quick fail on second char


  ch = state.src.charCodeAt(pos + 1);

  if (ch !== 0x21
  /* ! */
  && ch !== 0x3F
  /* ? */
  && ch !== 0x2F
  /* / */
  && !isLetter(ch)) {
    return false;
  }

  match = state.src.slice(pos).match(HTML_TAG_RE);

  if (!match) {
    return false;
  }

  if (!silent) {
    token = state.push('html_inline', '', 0);
    token.content = state.src.slice(pos, pos + match[0].length);
  }

  state.pos += match[0].length;
  return true;
};

var entities = entities$1;
var has = utils$2.has;
var isValidEntityCode = utils$2.isValidEntityCode;
var fromCodePoint = utils$2.fromCodePoint;
var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;

var entity = function entity(state, silent) {
  var ch,
      code,
      match,
      pos = state.pos,
      max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x26
  /* & */
  ) {
    return false;
  }

  if (pos + 1 < max) {
    ch = state.src.charCodeAt(pos + 1);

    if (ch === 0x23
    /* # */
    ) {
      match = state.src.slice(pos).match(DIGITAL_RE);

      if (match) {
        if (!silent) {
          code = match[1][0].toLowerCase() === 'x' ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
          state.pending += isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(0xFFFD);
        }

        state.pos += match[0].length;
        return true;
      }
    } else {
      match = state.src.slice(pos).match(NAMED_RE);

      if (match) {
        if (has(entities, match[1])) {
          if (!silent) {
            state.pending += entities[match[1]];
          }

          state.pos += match[0].length;
          return true;
        }
      }
    }
  }

  if (!silent) {
    state.pending += '&';
  }

  state.pos++;
  return true;
};

function processDelimiters(state, delimiters) {
  var closerIdx,
      openerIdx,
      closer,
      opener,
      minOpenerIdx,
      newMinOpenerIdx,
      isOddMatch,
      lastJump,
      openersBottom = {},
      max = delimiters.length;
  if (!max) return; // headerIdx is the first delimiter of the current (where closer is) delimiter run

  var headerIdx = 0;
  var lastTokenIdx = -2; // needs any value lower than -1

  var jumps = [];

  for (closerIdx = 0; closerIdx < max; closerIdx++) {
    closer = delimiters[closerIdx];
    jumps.push(0); // markers belong to same delimiter run if:
    //  - they have adjacent tokens
    //  - AND markers are the same
    //

    if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) {
      headerIdx = closerIdx;
    }

    lastTokenIdx = closer.token; // Length is only used for emphasis-specific "rule of 3",
    // if it's not defined (in strikethrough or 3rd party plugins),
    // we can default it to 0 to disable those checks.
    //

    closer.length = closer.length || 0;
    if (!closer.close) continue; // Previously calculated lower bounds (previous fails)
    // for each marker, each delimiter length modulo 3,
    // and for whether this closer can be an opener;
    // https://github.com/commonmark/cmark/commit/34250e12ccebdc6372b8b49c44fab57c72443460

    if (!openersBottom.hasOwnProperty(closer.marker)) {
      openersBottom[closer.marker] = [-1, -1, -1, -1, -1, -1];
    }

    minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + closer.length % 3];
    openerIdx = headerIdx - jumps[headerIdx] - 1;
    newMinOpenerIdx = openerIdx;

    for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
      opener = delimiters[openerIdx];
      if (opener.marker !== closer.marker) continue;

      if (opener.open && opener.end < 0) {
        isOddMatch = false; // from spec:
        //
        // If one of the delimiters can both open and close emphasis, then the
        // sum of the lengths of the delimiter runs containing the opening and
        // closing delimiters must not be a multiple of 3 unless both lengths
        // are multiples of 3.
        //

        if (opener.close || closer.open) {
          if ((opener.length + closer.length) % 3 === 0) {
            if (opener.length % 3 !== 0 || closer.length % 3 !== 0) {
              isOddMatch = true;
            }
          }
        }

        if (!isOddMatch) {
          // If previous delimiter cannot be an opener, we can safely skip
          // the entire sequence in future checks. This is required to make
          // sure algorithm has linear complexity (see *_*_*_*_*_... case).
          //
          lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ? jumps[openerIdx - 1] + 1 : 0;
          jumps[closerIdx] = closerIdx - openerIdx + lastJump;
          jumps[openerIdx] = lastJump;
          closer.open = false;
          opener.end = closerIdx;
          opener.close = false;
          newMinOpenerIdx = -1; // treat next token as start of run,
          // it optimizes skips in **<...>**a**<...>** pathological case

          lastTokenIdx = -2;
          break;
        }
      }
    }

    if (newMinOpenerIdx !== -1) {
      // If match for this delimiter run failed, we want to set lower bound for
      // future lookups. This is required to make sure algorithm has linear
      // complexity.
      //
      // See details here:
      // https://github.com/commonmark/cmark/issues/178#issuecomment-270417442
      //
      openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
    }
  }
}

var balance_pairs = function link_pairs(state) {
  var curr,
      tokens_meta = state.tokens_meta,
      max = state.tokens_meta.length;
  processDelimiters(state, state.delimiters);

  for (curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      processDelimiters(state, tokens_meta[curr].delimiters);
    }
  }
};

var text_collapse = function text_collapse(state) {
  var curr,
      last,
      level = 0,
      tokens = state.tokens,
      max = state.tokens.length;

  for (curr = last = 0; curr < max; curr++) {
    // re-calculate levels after emphasis/strikethrough turns some text nodes
    // into opening/closing tags
    if (tokens[curr].nesting < 0) level--; // closing tag

    tokens[curr].level = level;
    if (tokens[curr].nesting > 0) level++; // opening tag

    if (tokens[curr].type === 'text' && curr + 1 < max && tokens[curr + 1].type === 'text') {
      // collapse two adjacent text nodes
      tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
    } else {
      if (curr !== last) {
        tokens[last] = tokens[curr];
      }

      last++;
    }
  }

  if (curr !== last) {
    tokens.length = last;
  }
};

var Token = token;
var isWhiteSpace = utils$2.isWhiteSpace;
var isPunctChar = utils$2.isPunctChar;
var isMdAsciiPunct = utils$2.isMdAsciiPunct;

function StateInline(src, md, env, outTokens) {
  this.src = src;
  this.env = env;
  this.md = md;
  this.tokens = outTokens;
  this.tokens_meta = Array(outTokens.length);
  this.pos = 0;
  this.posMax = this.src.length;
  this.level = 0;
  this.pending = '';
  this.pendingLevel = 0; // Stores { start: end } pairs. Useful for backtrack
  // optimization of pairs parse (emphasis, strikes).

  this.cache = {}; // List of emphasis-like delimiters for current tag

  this.delimiters = []; // Stack of delimiter lists for upper level tags

  this._prev_delimiters = []; // backtick length => last seen position

  this.backticks = {};
  this.backticksScanned = false;
} // Flush pending text
//


StateInline.prototype.pushPending = function () {
  var token = new Token('text', '', 0);
  token.content = this.pending;
  token.level = this.pendingLevel;
  this.tokens.push(token);
  this.pending = '';
  return token;
}; // Push new token to "stream".
// If pending text exists - flush it as text token
//


StateInline.prototype.push = function (type, tag, nesting) {
  if (this.pending) {
    this.pushPending();
  }

  var token = new Token(type, tag, nesting);
  var token_meta = null;

  if (nesting < 0) {
    // closing tag
    this.level--;
    this.delimiters = this._prev_delimiters.pop();
  }

  token.level = this.level;

  if (nesting > 0) {
    // opening tag
    this.level++;

    this._prev_delimiters.push(this.delimiters);

    this.delimiters = [];
    token_meta = {
      delimiters: this.delimiters
    };
  }

  this.pendingLevel = this.level;
  this.tokens.push(token);
  this.tokens_meta.push(token_meta);
  return token;
}; // Scan a sequence of emphasis-like markers, and determine whether
// it can start an emphasis sequence or end an emphasis sequence.
//
//  - start - position to scan from (it should point at a valid marker);
//  - canSplitWord - determine if these markers can be found inside a word
//


StateInline.prototype.scanDelims = function (start, canSplitWord) {
  var pos = start,
      lastChar,
      nextChar,
      count,
      can_open,
      can_close,
      isLastWhiteSpace,
      isLastPunctChar,
      isNextWhiteSpace,
      isNextPunctChar,
      left_flanking = true,
      right_flanking = true,
      max = this.posMax,
      marker = this.src.charCodeAt(start); // treat beginning of the line as a whitespace

  lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;

  while (pos < max && this.src.charCodeAt(pos) === marker) {
    pos++;
  }

  count = pos - start; // treat end of the line as a whitespace

  nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20;
  isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
  isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));
  isLastWhiteSpace = isWhiteSpace(lastChar);
  isNextWhiteSpace = isWhiteSpace(nextChar);

  if (isNextWhiteSpace) {
    left_flanking = false;
  } else if (isNextPunctChar) {
    if (!(isLastWhiteSpace || isLastPunctChar)) {
      left_flanking = false;
    }
  }

  if (isLastWhiteSpace) {
    right_flanking = false;
  } else if (isLastPunctChar) {
    if (!(isNextWhiteSpace || isNextPunctChar)) {
      right_flanking = false;
    }
  }

  if (!canSplitWord) {
    can_open = left_flanking && (!right_flanking || isLastPunctChar);
    can_close = right_flanking && (!left_flanking || isNextPunctChar);
  } else {
    can_open = left_flanking;
    can_close = right_flanking;
  }

  return {
    can_open: can_open,
    can_close: can_close,
    length: count
  };
}; // re-export Token class to use in block rules


StateInline.prototype.Token = Token;
var state_inline = StateInline;

/** internal
 * class ParserInline
 *
 * Tokenizes paragraph content.
 **/

var Ruler = ruler; ////////////////////////////////////////////////////////////////////////////////
// Parser rules

var _rules = [['text', text$1], ['newline', newline], ['escape', _escape], ['backticks', backticks], ['strikethrough', strikethrough.tokenize], ['emphasis', emphasis.tokenize], ['link', link], ['image', image], ['autolink', autolink], ['html_inline', html_inline], ['entity', entity]];
var _rules2 = [['balance_pairs', balance_pairs], ['strikethrough', strikethrough.postProcess], ['emphasis', emphasis.postProcess], ['text_collapse', text_collapse]];
/**
 * new ParserInline()
 **/

function ParserInline$1() {
  var i;
  /**
   * ParserInline#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of inline rules.
   **/

  this.ruler = new Ruler();

  for (i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }
  /**
   * ParserInline#ruler2 -> Ruler
   *
   * [[Ruler]] instance. Second ruler used for post-processing
   * (e.g. in emphasis-like rules).
   **/


  this.ruler2 = new Ruler();

  for (i = 0; i < _rules2.length; i++) {
    this.ruler2.push(_rules2[i][0], _rules2[i][1]);
  }
} // Skip single token by running all rules in validation mode;
// returns `true` if any rule reported success
//


ParserInline$1.prototype.skipToken = function (state) {
  var ok,
      i,
      pos = state.pos,
      rules = this.ruler.getRules(''),
      len = rules.length,
      maxNesting = state.md.options.maxNesting,
      cache = state.cache;

  if (typeof cache[pos] !== 'undefined') {
    state.pos = cache[pos];
    return;
  }

  if (state.level < maxNesting) {
    for (i = 0; i < len; i++) {
      // Increment state.level and decrement it later to limit recursion.
      // It's harmless to do here, because no tokens are created. But ideally,
      // we'd need a separate private state variable for this purpose.
      //
      state.level++;
      ok = rules[i](state, true);
      state.level--;

      if (ok) {
        break;
      }
    }
  } else {
    // Too much nesting, just skip until the end of the paragraph.
    //
    // NOTE: this will cause links to behave incorrectly in the following case,
    //       when an amount of `[` is exactly equal to `maxNesting + 1`:
    //
    //       [[[[[[[[[[[[[[[[[[[[[foo]()
    //
    // TODO: remove this workaround when CM standard will allow nested links
    //       (we can replace it by preventing links from being parsed in
    //       validation mode)
    //
    state.pos = state.posMax;
  }

  if (!ok) {
    state.pos++;
  }

  cache[pos] = state.pos;
}; // Generate tokens for input range
//


ParserInline$1.prototype.tokenize = function (state) {
  var ok,
      i,
      rules = this.ruler.getRules(''),
      len = rules.length,
      end = state.posMax,
      maxNesting = state.md.options.maxNesting;

  while (state.pos < end) {
    // Try all possible rules.
    // On success, rule should:
    //
    // - update `state.pos`
    // - update `state.tokens`
    // - return true
    if (state.level < maxNesting) {
      for (i = 0; i < len; i++) {
        ok = rules[i](state, false);

        if (ok) {
          break;
        }
      }
    }

    if (ok) {
      if (state.pos >= end) {
        break;
      }

      continue;
    }

    state.pending += state.src[state.pos++];
  }

  if (state.pending) {
    state.pushPending();
  }
};
/**
 * ParserInline.parse(str, md, env, outTokens)
 *
 * Process input string and push inline tokens into `outTokens`
 **/


ParserInline$1.prototype.parse = function (str, md, env, outTokens) {
  var i, rules, len;
  var state = new this.State(str, md, env, outTokens);
  this.tokenize(state);
  rules = this.ruler2.getRules('');
  len = rules.length;

  for (i = 0; i < len; i++) {
    rules[i](state);
  }
};

ParserInline$1.prototype.State = state_inline;
var parser_inline = ParserInline$1;

var re = function (opts) {
  var re = {}; // Use direct extract instead of `regenerate` to reduse browserified size

  re.src_Any = regex$3.source;
  re.src_Cc = regex$2.source;
  re.src_Z = regex.source;
  re.src_P = regex$4.source; // \p{\Z\P\Cc\CF} (white spaces + control + format + punctuation)

  re.src_ZPCc = [re.src_Z, re.src_P, re.src_Cc].join('|'); // \p{\Z\Cc} (white spaces + control)

  re.src_ZCc = [re.src_Z, re.src_Cc].join('|'); // Experimental. List of chars, completely prohibited in links
  // because can separate it from other part of text

  var text_separators = '[><\uff5c]'; // All possible word characters (everything without punctuation, spaces & controls)
  // Defined via punctuation & spaces to save space
  // Should be something like \p{\L\N\S\M} (\w but without `_`)

  re.src_pseudo_letter = '(?:(?!' + text_separators + '|' + re.src_ZPCc + ')' + re.src_Any + ')'; // The same as abothe but without [0-9]
  // var src_pseudo_letter_non_d = '(?:(?![0-9]|' + src_ZPCc + ')' + src_Any + ')';
  ////////////////////////////////////////////////////////////////////////////////

  re.src_ip4 = '(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'; // Prohibit any of "@/[]()" in user/pass to avoid wrong domain fetch.

  re.src_auth = '(?:(?:(?!' + re.src_ZCc + '|[@/\\[\\]()]).)+@)?';
  re.src_port = '(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?';
  re.src_host_terminator = '(?=$|' + text_separators + '|' + re.src_ZPCc + ')(?!-|_|:\\d|\\.-|\\.(?!$|' + re.src_ZPCc + '))';
  re.src_path = '(?:' + '[/?#]' + '(?:' + '(?!' + re.src_ZCc + '|' + text_separators + '|[()[\\]{}.,"\'?!\\-;]).|' + '\\[(?:(?!' + re.src_ZCc + '|\\]).)*\\]|' + '\\((?:(?!' + re.src_ZCc + '|[)]).)*\\)|' + '\\{(?:(?!' + re.src_ZCc + '|[}]).)*\\}|' + '\\"(?:(?!' + re.src_ZCc + '|["]).)+\\"|' + "\\'(?:(?!" + re.src_ZCc + "|[']).)+\\'|" + "\\'(?=" + re.src_pseudo_letter + '|[-]).|' + // allow `I'm_king` if no pair found
  '\\.{2,}[a-zA-Z0-9%/&]|' + // google has many dots in "google search" links (#66, #81).
  // github has ... in commit range links,
  // Restrict to
  // - english
  // - percent-encoded
  // - parts of file path
  // - params separator
  // until more examples found.
  '\\.(?!' + re.src_ZCc + '|[.]).|' + (opts && opts['---'] ? '\\-(?!--(?:[^-]|$))(?:-*)|' // `---` => long dash, terminate
  : '\\-+|') + ',(?!' + re.src_ZCc + ').|' + // allow `,,,` in paths
  ';(?!' + re.src_ZCc + ').|' + // allow `;` if not followed by space-like char
  '\\!+(?!' + re.src_ZCc + '|[!]).|' + // allow `!!!` in paths, but not at the end
  '\\?(?!' + re.src_ZCc + '|[?]).' + ')+' + '|\\/' + ')?'; // Allow anything in markdown spec, forbid quote (") at the first position
  // because emails enclosed in quotes are far more common

  re.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*';
  re.src_xn = 'xn--[a-z0-9\\-]{1,59}'; // More to read about domain names
  // http://serverfault.com/questions/638260/

  re.src_domain_root = // Allow letters & digits (http://test1)
  '(?:' + re.src_xn + '|' + re.src_pseudo_letter + '{1,63}' + ')';
  re.src_domain = '(?:' + re.src_xn + '|' + '(?:' + re.src_pseudo_letter + ')' + '|' + '(?:' + re.src_pseudo_letter + '(?:-|' + re.src_pseudo_letter + '){0,61}' + re.src_pseudo_letter + ')' + ')';
  re.src_host = '(?:' + // Don't need IP check, because digits are already allowed in normal domain names
  //   src_ip4 +
  // '|' +
  '(?:(?:(?:' + re.src_domain + ')\\.)*' + re.src_domain
  /*_root*/
  + ')' + ')';
  re.tpl_host_fuzzy = '(?:' + re.src_ip4 + '|' + '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))' + ')';
  re.tpl_host_no_ip_fuzzy = '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))';
  re.src_host_strict = re.src_host + re.src_host_terminator;
  re.tpl_host_fuzzy_strict = re.tpl_host_fuzzy + re.src_host_terminator;
  re.src_host_port_strict = re.src_host + re.src_port + re.src_host_terminator;
  re.tpl_host_port_fuzzy_strict = re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;
  re.tpl_host_port_no_ip_fuzzy_strict = re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator; ////////////////////////////////////////////////////////////////////////////////
  // Main rules
  // Rude test fuzzy links by host, for quick deny

  re.tpl_host_fuzzy_test = 'localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:' + re.src_ZPCc + '|>|$))';
  re.tpl_email_fuzzy = '(^|' + text_separators + '|"|\\(|' + re.src_ZCc + ')' + '(' + re.src_email_name + '@' + re.tpl_host_fuzzy_strict + ')';
  re.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' + '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_fuzzy_strict + re.src_path + ')';
  re.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' + '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_no_ip_fuzzy_strict + re.src_path + ')';
  return re;
};

// Helpers
// Merge objects
//


function assign(obj
/*from1, from2, from3, ...*/
) {
  var sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function (source) {
    if (!source) {
      return;
    }

    Object.keys(source).forEach(function (key) {
      obj[key] = source[key];
    });
  });
  return obj;
}

function _class(obj) {
  return Object.prototype.toString.call(obj);
}

function isString(obj) {
  return _class(obj) === '[object String]';
}

function isObject(obj) {
  return _class(obj) === '[object Object]';
}

function isRegExp(obj) {
  return _class(obj) === '[object RegExp]';
}

function isFunction(obj) {
  return _class(obj) === '[object Function]';
}

function escapeRE(str) {
  return str.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
} ////////////////////////////////////////////////////////////////////////////////


var defaultOptions$1 = {
  fuzzyLink: true,
  fuzzyEmail: true,
  fuzzyIP: false
};

function isOptionsObj(obj) {
  return Object.keys(obj || {}).reduce(function (acc, k) {
    return acc || defaultOptions$1.hasOwnProperty(k);
  }, false);
}

var defaultSchemas = {
  'http:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.http) {
        // compile lazily, because "host"-containing variables can change on tlds update.
        self.re.http = new RegExp('^\\/\\/' + self.re.src_auth + self.re.src_host_port_strict + self.re.src_path, 'i');
      }

      if (self.re.http.test(tail)) {
        return tail.match(self.re.http)[0].length;
      }

      return 0;
    }
  },
  'https:': 'http:',
  'ftp:': 'http:',
  '//': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.no_http) {
        // compile lazily, because "host"-containing variables can change on tlds update.
        self.re.no_http = new RegExp('^' + self.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
        // with code comments
        '(?:localhost|(?:(?:' + self.re.src_domain + ')\\.)+' + self.re.src_domain_root + ')' + self.re.src_port + self.re.src_host_terminator + self.re.src_path, 'i');
      }

      if (self.re.no_http.test(tail)) {
        // should not be `://` & `///`, that protects from errors in protocol name
        if (pos >= 3 && text[pos - 3] === ':') {
          return 0;
        }

        if (pos >= 3 && text[pos - 3] === '/') {
          return 0;
        }

        return tail.match(self.re.no_http)[0].length;
      }

      return 0;
    }
  },
  'mailto:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.mailto) {
        self.re.mailto = new RegExp('^' + self.re.src_email_name + '@' + self.re.src_host_strict, 'i');
      }

      if (self.re.mailto.test(tail)) {
        return tail.match(self.re.mailto)[0].length;
      }

      return 0;
    }
  }
};
/*eslint-disable max-len*/
// RE pattern for 2-character tlds (autogenerated by ./support/tlds_2char_gen.js)

var tlds_2ch_src_re = 'a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]'; // DON'T try to make PRs with changes. Extend TLDs with LinkifyIt.tlds() instead

var tlds_default = 'biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф'.split('|');
/*eslint-enable max-len*/
////////////////////////////////////////////////////////////////////////////////

function resetScanCache(self) {
  self.__index__ = -1;
  self.__text_cache__ = '';
}

function createValidator(re) {
  return function (text, pos) {
    var tail = text.slice(pos);

    if (re.test(tail)) {
      return tail.match(re)[0].length;
    }

    return 0;
  };
}

function createNormalizer() {
  return function (match, self) {
    self.normalize(match);
  };
} // Schemas compiler. Build regexps.
//


function compile(self) {
  // Load & clone RE patterns.
  var re$1 = self.re = re(self.__opts__); // Define dynamic patterns

  var tlds = self.__tlds__.slice();

  self.onCompile();

  if (!self.__tlds_replaced__) {
    tlds.push(tlds_2ch_src_re);
  }

  tlds.push(re$1.src_xn);
  re$1.src_tlds = tlds.join('|');

  function untpl(tpl) {
    return tpl.replace('%TLDS%', re$1.src_tlds);
  }

  re$1.email_fuzzy = RegExp(untpl(re$1.tpl_email_fuzzy), 'i');
  re$1.link_fuzzy = RegExp(untpl(re$1.tpl_link_fuzzy), 'i');
  re$1.link_no_ip_fuzzy = RegExp(untpl(re$1.tpl_link_no_ip_fuzzy), 'i');
  re$1.host_fuzzy_test = RegExp(untpl(re$1.tpl_host_fuzzy_test), 'i'); //
  // Compile each schema
  //

  var aliases = [];
  self.__compiled__ = {}; // Reset compiled data

  function schemaError(name, val) {
    throw new Error('(LinkifyIt) Invalid schema "' + name + '": ' + val);
  }

  Object.keys(self.__schemas__).forEach(function (name) {
    var val = self.__schemas__[name]; // skip disabled methods

    if (val === null) {
      return;
    }

    var compiled = {
      validate: null,
      link: null
    };
    self.__compiled__[name] = compiled;

    if (isObject(val)) {
      if (isRegExp(val.validate)) {
        compiled.validate = createValidator(val.validate);
      } else if (isFunction(val.validate)) {
        compiled.validate = val.validate;
      } else {
        schemaError(name, val);
      }

      if (isFunction(val.normalize)) {
        compiled.normalize = val.normalize;
      } else if (!val.normalize) {
        compiled.normalize = createNormalizer();
      } else {
        schemaError(name, val);
      }

      return;
    }

    if (isString(val)) {
      aliases.push(name);
      return;
    }

    schemaError(name, val);
  }); //
  // Compile postponed aliases
  //

  aliases.forEach(function (alias) {
    if (!self.__compiled__[self.__schemas__[alias]]) {
      // Silently fail on missed schemas to avoid errons on disable.
      // schemaError(alias, self.__schemas__[alias]);
      return;
    }

    self.__compiled__[alias].validate = self.__compiled__[self.__schemas__[alias]].validate;
    self.__compiled__[alias].normalize = self.__compiled__[self.__schemas__[alias]].normalize;
  }); //
  // Fake record for guessed links
  //

  self.__compiled__[''] = {
    validate: null,
    normalize: createNormalizer()
  }; //
  // Build schema condition
  //

  var slist = Object.keys(self.__compiled__).filter(function (name) {
    // Filter disabled & fake schemas
    return name.length > 0 && self.__compiled__[name];
  }).map(escapeRE).join('|'); // (?!_) cause 1.5x slowdown

  self.re.schema_test = RegExp('(^|(?!_)(?:[><\uff5c]|' + re$1.src_ZPCc + '))(' + slist + ')', 'i');
  self.re.schema_search = RegExp('(^|(?!_)(?:[><\uff5c]|' + re$1.src_ZPCc + '))(' + slist + ')', 'ig');
  self.re.pretest = RegExp('(' + self.re.schema_test.source + ')|(' + self.re.host_fuzzy_test.source + ')|@', 'i'); //
  // Cleanup
  //

  resetScanCache(self);
}
/**
 * class Match
 *
 * Match result. Single element of array, returned by [[LinkifyIt#match]]
 **/


function Match(self, shift) {
  var start = self.__index__,
      end = self.__last_index__,
      text = self.__text_cache__.slice(start, end);
  /**
   * Match#schema -> String
   *
   * Prefix (protocol) for matched string.
   **/


  this.schema = self.__schema__.toLowerCase();
  /**
   * Match#index -> Number
   *
   * First position of matched string.
   **/

  this.index = start + shift;
  /**
   * Match#lastIndex -> Number
   *
   * Next position after matched string.
   **/

  this.lastIndex = end + shift;
  /**
   * Match#raw -> String
   *
   * Matched string.
   **/

  this.raw = text;
  /**
   * Match#text -> String
   *
   * Notmalized text of matched string.
   **/

  this.text = text;
  /**
   * Match#url -> String
   *
   * Normalized url of matched string.
   **/

  this.url = text;
}

function createMatch(self, shift) {
  var match = new Match(self, shift);

  self.__compiled__[match.schema].normalize(match, self);

  return match;
}
/**
 * class LinkifyIt
 **/

/**
 * new LinkifyIt(schemas, options)
 * - schemas (Object): Optional. Additional schemas to validate (prefix/validator)
 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
 *
 * Creates new linkifier instance with optional additional schemas.
 * Can be called without `new` keyword for convenience.
 *
 * By default understands:
 *
 * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
 * - "fuzzy" links and emails (example.com, foo@bar.com).
 *
 * `schemas` is an object, where each key/value describes protocol/rule:
 *
 * - __key__ - link prefix (usually, protocol name with `:` at the end, `skype:`
 *   for example). `linkify-it` makes shure that prefix is not preceeded with
 *   alphanumeric char and symbols. Only whitespaces and punctuation allowed.
 * - __value__ - rule to check tail after link prefix
 *   - _String_ - just alias to existing rule
 *   - _Object_
 *     - _validate_ - validator function (should return matched length on success),
 *       or `RegExp`.
 *     - _normalize_ - optional function to normalize text & url of matched result
 *       (for example, for @twitter mentions).
 *
 * `options`:
 *
 * - __fuzzyLink__ - recognige URL-s without `http(s):` prefix. Default `true`.
 * - __fuzzyIP__ - allow IPs in fuzzy links above. Can conflict with some texts
 *   like version numbers. Default `false`.
 * - __fuzzyEmail__ - recognize emails without `mailto:` prefix.
 *
 **/


function LinkifyIt$1(schemas, options) {
  if (!(this instanceof LinkifyIt$1)) {
    return new LinkifyIt$1(schemas, options);
  }

  if (!options) {
    if (isOptionsObj(schemas)) {
      options = schemas;
      schemas = {};
    }
  }

  this.__opts__ = assign({}, defaultOptions$1, options); // Cache last tested result. Used to skip repeating steps on next `match` call.

  this.__index__ = -1;
  this.__last_index__ = -1; // Next scan position

  this.__schema__ = '';
  this.__text_cache__ = '';
  this.__schemas__ = assign({}, defaultSchemas, schemas);
  this.__compiled__ = {};
  this.__tlds__ = tlds_default;
  this.__tlds_replaced__ = false;
  this.re = {};
  compile(this);
}
/** chainable
 * LinkifyIt#add(schema, definition)
 * - schema (String): rule name (fixed pattern prefix)
 * - definition (String|RegExp|Object): schema definition
 *
 * Add new rule definition. See constructor description for details.
 **/


LinkifyIt$1.prototype.add = function add(schema, definition) {
  this.__schemas__[schema] = definition;
  compile(this);
  return this;
};
/** chainable
 * LinkifyIt#set(options)
 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
 *
 * Set recognition options for links without schema.
 **/


LinkifyIt$1.prototype.set = function set(options) {
  this.__opts__ = assign(this.__opts__, options);
  return this;
};
/**
 * LinkifyIt#test(text) -> Boolean
 *
 * Searches linkifiable pattern and returns `true` on success or `false` on fail.
 **/


LinkifyIt$1.prototype.test = function test(text) {
  // Reset scan cache
  this.__text_cache__ = text;
  this.__index__ = -1;

  if (!text.length) {
    return false;
  }

  var m, ml, me, len, shift, next, re, tld_pos, at_pos; // try to scan for link with schema - that's the most simple rule

  if (this.re.schema_test.test(text)) {
    re = this.re.schema_search;
    re.lastIndex = 0;

    while ((m = re.exec(text)) !== null) {
      len = this.testSchemaAt(text, m[2], re.lastIndex);

      if (len) {
        this.__schema__ = m[2];
        this.__index__ = m.index + m[1].length;
        this.__last_index__ = m.index + m[0].length + len;
        break;
      }
    }
  }

  if (this.__opts__.fuzzyLink && this.__compiled__['http:']) {
    // guess schemaless links
    tld_pos = text.search(this.re.host_fuzzy_test);

    if (tld_pos >= 0) {
      // if tld is located after found link - no need to check fuzzy pattern
      if (this.__index__ < 0 || tld_pos < this.__index__) {
        if ((ml = text.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null) {
          shift = ml.index + ml[1].length;

          if (this.__index__ < 0 || shift < this.__index__) {
            this.__schema__ = '';
            this.__index__ = shift;
            this.__last_index__ = ml.index + ml[0].length;
          }
        }
      }
    }
  }

  if (this.__opts__.fuzzyEmail && this.__compiled__['mailto:']) {
    // guess schemaless emails
    at_pos = text.indexOf('@');

    if (at_pos >= 0) {
      // We can't skip this check, because this cases are possible:
      // 192.168.1.1@gmail.com, my.in@example.com
      if ((me = text.match(this.re.email_fuzzy)) !== null) {
        shift = me.index + me[1].length;
        next = me.index + me[0].length;

        if (this.__index__ < 0 || shift < this.__index__ || shift === this.__index__ && next > this.__last_index__) {
          this.__schema__ = 'mailto:';
          this.__index__ = shift;
          this.__last_index__ = next;
        }
      }
    }
  }

  return this.__index__ >= 0;
};
/**
 * LinkifyIt#pretest(text) -> Boolean
 *
 * Very quick check, that can give false positives. Returns true if link MAY BE
 * can exists. Can be used for speed optimization, when you need to check that
 * link NOT exists.
 **/


LinkifyIt$1.prototype.pretest = function pretest(text) {
  return this.re.pretest.test(text);
};
/**
 * LinkifyIt#testSchemaAt(text, name, position) -> Number
 * - text (String): text to scan
 * - name (String): rule (schema) name
 * - position (Number): text offset to check from
 *
 * Similar to [[LinkifyIt#test]] but checks only specific protocol tail exactly
 * at given position. Returns length of found pattern (0 on fail).
 **/


LinkifyIt$1.prototype.testSchemaAt = function testSchemaAt(text, schema, pos) {
  // If not supported schema check requested - terminate
  if (!this.__compiled__[schema.toLowerCase()]) {
    return 0;
  }

  return this.__compiled__[schema.toLowerCase()].validate(text, pos, this);
};
/**
 * LinkifyIt#match(text) -> Array|null
 *
 * Returns array of found link descriptions or `null` on fail. We strongly
 * recommend to use [[LinkifyIt#test]] first, for best speed.
 *
 * ##### Result match description
 *
 * - __schema__ - link schema, can be empty for fuzzy links, or `//` for
 *   protocol-neutral  links.
 * - __index__ - offset of matched text
 * - __lastIndex__ - index of next char after mathch end
 * - __raw__ - matched text
 * - __text__ - normalized text
 * - __url__ - link, generated from matched text
 **/


LinkifyIt$1.prototype.match = function match(text) {
  var shift = 0,
      result = []; // Try to take previous element from cache, if .test() called before

  if (this.__index__ >= 0 && this.__text_cache__ === text) {
    result.push(createMatch(this, shift));
    shift = this.__last_index__;
  } // Cut head if cache was used


  var tail = shift ? text.slice(shift) : text; // Scan string until end reached

  while (this.test(tail)) {
    result.push(createMatch(this, shift));
    tail = tail.slice(this.__last_index__);
    shift += this.__last_index__;
  }

  if (result.length) {
    return result;
  }

  return null;
};
/** chainable
 * LinkifyIt#tlds(list [, keepOld]) -> this
 * - list (Array): list of tlds
 * - keepOld (Boolean): merge with current list if `true` (`false` by default)
 *
 * Load (or merge) new tlds list. Those are user for fuzzy links (without prefix)
 * to avoid false positives. By default this algorythm used:
 *
 * - hostname with any 2-letter root zones are ok.
 * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
 *   are ok.
 * - encoded (`xn--...`) root zones are ok.
 *
 * If list is replaced, then exact match for 2-chars root zones will be checked.
 **/


LinkifyIt$1.prototype.tlds = function tlds(list, keepOld) {
  list = Array.isArray(list) ? list : [list];

  if (!keepOld) {
    this.__tlds__ = list.slice();
    this.__tlds_replaced__ = true;
    compile(this);
    return this;
  }

  this.__tlds__ = this.__tlds__.concat(list).sort().filter(function (el, idx, arr) {
    return el !== arr[idx - 1];
  }).reverse();
  compile(this);
  return this;
};
/**
 * LinkifyIt#normalize(match)
 *
 * Default normalizer (if schema does not define it's own).
 **/


LinkifyIt$1.prototype.normalize = function normalize(match) {
  // Do minimal possible changes by default. Need to collect feedback prior
  // to move forward https://github.com/markdown-it/linkify-it/issues/1
  if (!match.schema) {
    match.url = 'http://' + match.url;
  }

  if (match.schema === 'mailto:' && !/^mailto:/i.test(match.url)) {
    match.url = 'mailto:' + match.url;
  }
};
/**
 * LinkifyIt#onCompile()
 *
 * Override to modify basic RegExp-s.
 **/


LinkifyIt$1.prototype.onCompile = function onCompile() {};

var linkifyIt = LinkifyIt$1;

var _default = {
  options: {
    html: false,
    // Enable HTML tags in source
    xhtmlOut: false,
    // Use '/' to close single tags (<br />)
    breaks: false,
    // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-',
    // CSS language prefix for fenced blocks
    linkify: false,
    // autoconvert URL-like texts to links
    // Enable some language-neutral replacements + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '\u201c\u201d\u2018\u2019',

    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    maxNesting: 100 // Internal protection, recursion limit

  },
  components: {
    core: {},
    block: {},
    inline: {}
  }
};

var zero = {
  options: {
    html: false,
    // Enable HTML tags in source
    xhtmlOut: false,
    // Use '/' to close single tags (<br />)
    breaks: false,
    // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-',
    // CSS language prefix for fenced blocks
    linkify: false,
    // autoconvert URL-like texts to links
    // Enable some language-neutral replacements + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '\u201c\u201d\u2018\u2019',

    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    maxNesting: 20 // Internal protection, recursion limit

  },
  components: {
    core: {
      rules: ['normalize', 'block', 'inline']
    },
    block: {
      rules: ['paragraph']
    },
    inline: {
      rules: ['text'],
      rules2: ['balance_pairs', 'text_collapse']
    }
  }
};

var commonmark = {
  options: {
    html: true,
    // Enable HTML tags in source
    xhtmlOut: true,
    // Use '/' to close single tags (<br />)
    breaks: false,
    // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-',
    // CSS language prefix for fenced blocks
    linkify: false,
    // autoconvert URL-like texts to links
    // Enable some language-neutral replacements + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '\u201c\u201d\u2018\u2019',

    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    maxNesting: 20 // Internal protection, recursion limit

  },
  components: {
    core: {
      rules: ['normalize', 'block', 'inline']
    },
    block: {
      rules: ['blockquote', 'code', 'fence', 'heading', 'hr', 'html_block', 'lheading', 'list', 'reference', 'paragraph']
    },
    inline: {
      rules: ['autolink', 'backticks', 'emphasis', 'entity', 'escape', 'html_inline', 'image', 'link', 'newline', 'text'],
      rules2: ['balance_pairs', 'emphasis', 'text_collapse']
    }
  }
};

var utils = utils$2;
var helpers = helpers$1;
var Renderer = renderer;
var ParserCore = parser_core;
var ParserBlock = parser_block;
var ParserInline = parser_inline;
var LinkifyIt = linkifyIt;
var mdurl = mdurl$1;
var punycode = require$$8;
var config = {
  default: _default,
  zero: zero,
  commonmark: commonmark
}; ////////////////////////////////////////////////////////////////////////////////
//
// This validator can prohibit more than really needed to prevent XSS. It's a
// tradeoff to keep code simple and to be secure by default.
//
// If you need different setup - override validator method as you wish. Or
// replace it with dummy function and use external sanitizer.
//

var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;

function validateLink(url) {
  // url should be normalized at this point, and existing entities are decoded
  var str = url.trim().toLowerCase();
  return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) ? true : false : true;
} ////////////////////////////////////////////////////////////////////////////////


var RECODE_HOSTNAME_FOR = ['http:', 'https:', 'mailto:'];

function normalizeLink(url) {
  var parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    // Encode hostnames in urls like:
    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
    //
    // We don't encode unknown schemas, because it's likely that we encode
    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
    //
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toASCII(parsed.hostname);
      } catch (er) {
        /**/
      }
    }
  }

  return mdurl.encode(mdurl.format(parsed));
}

function normalizeLinkText(url) {
  var parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    // Encode hostnames in urls like:
    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
    //
    // We don't encode unknown schemas, because it's likely that we encode
    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
    //
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toUnicode(parsed.hostname);
      } catch (er) {
        /**/
      }
    }
  } // add '%' to exclude list because of https://github.com/markdown-it/markdown-it/issues/720


  return mdurl.decode(mdurl.format(parsed), mdurl.decode.defaultChars + '%');
}
/**
 * class MarkdownIt
 *
 * Main parser/renderer class.
 *
 * ##### Usage
 *
 * ```javascript
 * // node.js, "classic" way:
 * var MarkdownIt = require('markdown-it'),
 *     md = new MarkdownIt();
 * var result = md.render('# markdown-it rulezz!');
 *
 * // node.js, the same, but with sugar:
 * var md = require('markdown-it')();
 * var result = md.render('# markdown-it rulezz!');
 *
 * // browser without AMD, added to "window" on script load
 * // Note, there are no dash.
 * var md = window.markdownit();
 * var result = md.render('# markdown-it rulezz!');
 * ```
 *
 * Single line rendering, without paragraph wrap:
 *
 * ```javascript
 * var md = require('markdown-it')();
 * var result = md.renderInline('__markdown-it__ rulezz!');
 * ```
 **/

/**
 * new MarkdownIt([presetName, options])
 * - presetName (String): optional, `commonmark` / `zero`
 * - options (Object)
 *
 * Creates parser instanse with given config. Can be called without `new`.
 *
 * ##### presetName
 *
 * MarkdownIt provides named presets as a convenience to quickly
 * enable/disable active syntax rules and options for common use cases.
 *
 * - ["commonmark"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/commonmark.js) -
 *   configures parser to strict [CommonMark](http://commonmark.org/) mode.
 * - [default](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/default.js) -
 *   similar to GFM, used when no preset name given. Enables all available rules,
 *   but still without html, typographer & autolinker.
 * - ["zero"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/zero.js) -
 *   all rules disabled. Useful to quickly setup your config via `.enable()`.
 *   For example, when you need only `bold` and `italic` markup and nothing else.
 *
 * ##### options:
 *
 * - __html__ - `false`. Set `true` to enable HTML tags in source. Be careful!
 *   That's not safe! You may need external sanitizer to protect output from XSS.
 *   It's better to extend features via plugins, instead of enabling HTML.
 * - __xhtmlOut__ - `false`. Set `true` to add '/' when closing single tags
 *   (`<br />`). This is needed only for full CommonMark compatibility. In real
 *   world you will need HTML output.
 * - __breaks__ - `false`. Set `true` to convert `\n` in paragraphs into `<br>`.
 * - __langPrefix__ - `language-`. CSS language class prefix for fenced blocks.
 *   Can be useful for external highlighters.
 * - __linkify__ - `false`. Set `true` to autoconvert URL-like text to links.
 * - __typographer__  - `false`. Set `true` to enable [some language-neutral
 *   replacement](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js) +
 *   quotes beautification (smartquotes).
 * - __quotes__ - `“”‘’`, String or Array. Double + single quotes replacement
 *   pairs, when typographer enabled and smartquotes on. For example, you can
 *   use `'«»„“'` for Russian, `'„“‚‘'` for German, and
 *   `['«\xA0', '\xA0»', '‹\xA0', '\xA0›']` for French (including nbsp).
 * - __highlight__ - `null`. Highlighter function for fenced code blocks.
 *   Highlighter `function (str, lang)` should return escaped HTML. It can also
 *   return empty string if the source was not changed and should be escaped
 *   externaly. If result starts with <pre... internal wrapper is skipped.
 *
 * ##### Example
 *
 * ```javascript
 * // commonmark mode
 * var md = require('markdown-it')('commonmark');
 *
 * // default mode
 * var md = require('markdown-it')();
 *
 * // enable everything
 * var md = require('markdown-it')({
 *   html: true,
 *   linkify: true,
 *   typographer: true
 * });
 * ```
 *
 * ##### Syntax highlighting
 *
 * ```js
 * var hljs = require('highlight.js') // https://highlightjs.org/
 *
 * var md = require('markdown-it')({
 *   highlight: function (str, lang) {
 *     if (lang && hljs.getLanguage(lang)) {
 *       try {
 *         return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
 *       } catch (__) {}
 *     }
 *
 *     return ''; // use external default escaping
 *   }
 * });
 * ```
 *
 * Or with full wrapper override (if you need assign class to `<pre>`):
 *
 * ```javascript
 * var hljs = require('highlight.js') // https://highlightjs.org/
 *
 * // Actual default values
 * var md = require('markdown-it')({
 *   highlight: function (str, lang) {
 *     if (lang && hljs.getLanguage(lang)) {
 *       try {
 *         return '<pre class="hljs"><code>' +
 *                hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
 *                '</code></pre>';
 *       } catch (__) {}
 *     }
 *
 *     return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
 *   }
 * });
 * ```
 *
 **/


function MarkdownIt(presetName, options) {
  if (!(this instanceof MarkdownIt)) {
    return new MarkdownIt(presetName, options);
  }

  if (!options) {
    if (!utils.isString(presetName)) {
      options = presetName || {};
      presetName = 'default';
    }
  }
  /**
   * MarkdownIt#inline -> ParserInline
   *
   * Instance of [[ParserInline]]. You may need it to add new rules when
   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
   * [[MarkdownIt.enable]].
   **/


  this.inline = new ParserInline();
  /**
   * MarkdownIt#block -> ParserBlock
   *
   * Instance of [[ParserBlock]]. You may need it to add new rules when
   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
   * [[MarkdownIt.enable]].
   **/

  this.block = new ParserBlock();
  /**
   * MarkdownIt#core -> Core
   *
   * Instance of [[Core]] chain executor. You may need it to add new rules when
   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
   * [[MarkdownIt.enable]].
   **/

  this.core = new ParserCore();
  /**
   * MarkdownIt#renderer -> Renderer
   *
   * Instance of [[Renderer]]. Use it to modify output look. Or to add rendering
   * rules for new token types, generated by plugins.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * function myToken(tokens, idx, options, env, self) {
   *   //...
   *   return result;
   * };
   *
   * md.renderer.rules['my_token'] = myToken
   * ```
   *
   * See [[Renderer]] docs and [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js).
   **/

  this.renderer = new Renderer();
  /**
   * MarkdownIt#linkify -> LinkifyIt
   *
   * [linkify-it](https://github.com/markdown-it/linkify-it) instance.
   * Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/linkify.js)
   * rule.
   **/

  this.linkify = new LinkifyIt();
  /**
   * MarkdownIt#validateLink(url) -> Boolean
   *
   * Link validation function. CommonMark allows too much in links. By default
   * we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
   * except some embedded image types.
   *
   * You can change this behaviour:
   *
   * ```javascript
   * var md = require('markdown-it')();
   * // enable everything
   * md.validateLink = function () { return true; }
   * ```
   **/

  this.validateLink = validateLink;
  /**
   * MarkdownIt#normalizeLink(url) -> String
   *
   * Function used to encode link url to a machine-readable format,
   * which includes url-encoding, punycode, etc.
   **/

  this.normalizeLink = normalizeLink;
  /**
   * MarkdownIt#normalizeLinkText(url) -> String
   *
   * Function used to decode link url to a human-readable format`
   **/

  this.normalizeLinkText = normalizeLinkText; // Expose utils & helpers for easy acces from plugins

  /**
   * MarkdownIt#utils -> utils
   *
   * Assorted utility functions, useful to write plugins. See details
   * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js).
   **/

  this.utils = utils;
  /**
   * MarkdownIt#helpers -> helpers
   *
   * Link components parser functions, useful to write plugins. See details
   * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/helpers).
   **/

  this.helpers = utils.assign({}, helpers);
  this.options = {};
  this.configure(presetName);

  if (options) {
    this.set(options);
  }
}
/** chainable
 * MarkdownIt.set(options)
 *
 * Set parser options (in the same format as in constructor). Probably, you
 * will never need it, but you can change options after constructor call.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')()
 *             .set({ html: true, breaks: true })
 *             .set({ typographer, true });
 * ```
 *
 * __Note:__ To achieve the best possible performance, don't modify a
 * `markdown-it` instance options on the fly. If you need multiple configurations
 * it's best to create multiple instances and initialize each with separate
 * config.
 **/


MarkdownIt.prototype.set = function (options) {
  utils.assign(this.options, options);
  return this;
};
/** chainable, internal
 * MarkdownIt.configure(presets)
 *
 * Batch load of all options and compenent settings. This is internal method,
 * and you probably will not need it. But if you will - see available presets
 * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/lib/presets)
 *
 * We strongly recommend to use presets instead of direct config loads. That
 * will give better compatibility with next versions.
 **/


MarkdownIt.prototype.configure = function (presets) {
  var self = this,
      presetName;

  if (utils.isString(presets)) {
    presetName = presets;
    presets = config[presetName];

    if (!presets) {
      throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name');
    }
  }

  if (!presets) {
    throw new Error('Wrong `markdown-it` preset, can\'t be empty');
  }

  if (presets.options) {
    self.set(presets.options);
  }

  if (presets.components) {
    Object.keys(presets.components).forEach(function (name) {
      if (presets.components[name].rules) {
        self[name].ruler.enableOnly(presets.components[name].rules);
      }

      if (presets.components[name].rules2) {
        self[name].ruler2.enableOnly(presets.components[name].rules2);
      }
    });
  }

  return this;
};
/** chainable
 * MarkdownIt.enable(list, ignoreInvalid)
 * - list (String|Array): rule name or list of rule names to enable
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Enable list or rules. It will automatically find appropriate components,
 * containing rules with given names. If rule not found, and `ignoreInvalid`
 * not set - throws exception.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')()
 *             .enable(['sub', 'sup'])
 *             .disable('smartquotes');
 * ```
 **/


MarkdownIt.prototype.enable = function (list, ignoreInvalid) {
  var result = [];

  if (!Array.isArray(list)) {
    list = [list];
  }

  ['core', 'block', 'inline'].forEach(function (chain) {
    result = result.concat(this[chain].ruler.enable(list, true));
  }, this);
  result = result.concat(this.inline.ruler2.enable(list, true));
  var missed = list.filter(function (name) {
    return result.indexOf(name) < 0;
  });

  if (missed.length && !ignoreInvalid) {
    throw new Error('MarkdownIt. Failed to enable unknown rule(s): ' + missed);
  }

  return this;
};
/** chainable
 * MarkdownIt.disable(list, ignoreInvalid)
 * - list (String|Array): rule name or list of rule names to disable.
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * The same as [[MarkdownIt.enable]], but turn specified rules off.
 **/


MarkdownIt.prototype.disable = function (list, ignoreInvalid) {
  var result = [];

  if (!Array.isArray(list)) {
    list = [list];
  }

  ['core', 'block', 'inline'].forEach(function (chain) {
    result = result.concat(this[chain].ruler.disable(list, true));
  }, this);
  result = result.concat(this.inline.ruler2.disable(list, true));
  var missed = list.filter(function (name) {
    return result.indexOf(name) < 0;
  });

  if (missed.length && !ignoreInvalid) {
    throw new Error('MarkdownIt. Failed to disable unknown rule(s): ' + missed);
  }

  return this;
};
/** chainable
 * MarkdownIt.use(plugin, params)
 *
 * Load specified plugin with given params into current parser instance.
 * It's just a sugar to call `plugin(md, params)` with curring.
 *
 * ##### Example
 *
 * ```javascript
 * var iterator = require('markdown-it-for-inline');
 * var md = require('markdown-it')()
 *             .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
 *               tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar');
 *             });
 * ```
 **/


MarkdownIt.prototype.use = function (plugin
/*, params, ... */
) {
  var args = [this].concat(Array.prototype.slice.call(arguments, 1));
  plugin.apply(plugin, args);
  return this;
};
/** internal
 * MarkdownIt.parse(src, env) -> Array
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * Parse input string and return list of block tokens (special token type
 * "inline" will contain list of inline tokens). You should not call this
 * method directly, until you write custom renderer (for example, to produce
 * AST).
 *
 * `env` is used to pass data between "distributed" rules and return additional
 * metadata like reference info, needed for the renderer. It also can be used to
 * inject data in specific cases. Usually, you will be ok to pass `{}`,
 * and then pass updated object to renderer.
 **/


MarkdownIt.prototype.parse = function (src, env) {
  if (typeof src !== 'string') {
    throw new Error('Input data should be a String');
  }

  var state = new this.core.State(src, this, env);
  this.core.process(state);
  return state.tokens;
};
/**
 * MarkdownIt.render(src [, env]) -> String
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * Render markdown string into html. It does all magic for you :).
 *
 * `env` can be used to inject additional metadata (`{}` by default).
 * But you will not need it with high probability. See also comment
 * in [[MarkdownIt.parse]].
 **/


MarkdownIt.prototype.render = function (src, env) {
  env = env || {};
  return this.renderer.render(this.parse(src, env), this.options, env);
};
/** internal
 * MarkdownIt.parseInline(src, env) -> Array
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * The same as [[MarkdownIt.parse]] but skip all block rules. It returns the
 * block tokens list with the single `inline` element, containing parsed inline
 * tokens in `children` property. Also updates `env` object.
 **/


MarkdownIt.prototype.parseInline = function (src, env) {
  var state = new this.core.State(src, this, env);
  state.inlineMode = true;
  this.core.process(state);
  return state.tokens;
};
/**
 * MarkdownIt.renderInline(src [, env]) -> String
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * Similar to [[MarkdownIt.render]] but for single paragraph content. Result
 * will NOT be wrapped into `<p>` tags.
 **/


MarkdownIt.prototype.renderInline = function (src, env) {
  env = env || {};
  return this.renderer.render(this.parseInline(src, env), this.options, env);
};

var lib = MarkdownIt;

var markdownIt = lib;

/**
 * Throw a given error.
 *
 * @param {Error|null|undefined} [error]
 *   Maybe error.
 * @returns {asserts error is null|undefined}
 */
function bail(error) {
  if (error) {
    throw error;
  }
}

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

var isBuffer = function isBuffer(obj) {
  return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
};

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

var isArray = function isArray(arr) {
  if (typeof Array.isArray === 'function') {
    return Array.isArray(arr);
  }

  return toStr.call(arr) === '[object Array]';
};

var isPlainObject$1 = function isPlainObject(obj) {
  if (!obj || toStr.call(obj) !== '[object Object]') {
    return false;
  }

  var hasOwnConstructor = hasOwn.call(obj, 'constructor');
  var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf'); // Not own constructor property must be Object

  if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
    return false;
  } // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.


  var key;

  for (key in obj) {
    /**/
  }

  return typeof key === 'undefined' || hasOwn.call(obj, key);
}; // If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target


var setProperty = function setProperty(target, options) {
  if (defineProperty && options.name === '__proto__') {
    defineProperty(target, options.name, {
      enumerable: true,
      configurable: true,
      value: options.newValue,
      writable: true
    });
  } else {
    target[options.name] = options.newValue;
  }
}; // Return undefined instead of __proto__ if '__proto__' is not an own property


var getProperty = function getProperty(obj, name) {
  if (name === '__proto__') {
    if (!hasOwn.call(obj, name)) {
      return void 0;
    } else if (gOPD) {
      // In early versions of node, obj['__proto__'] is buggy when obj has
      // __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
      return gOPD(obj, name).value;
    }
  }

  return obj[name];
};

var extend = function extend() {
  var options, name, src, copy, copyIsArray, clone;
  var target = arguments[0];
  var i = 1;
  var length = arguments.length;
  var deep = false; // Handle a deep copy situation

  if (typeof target === 'boolean') {
    deep = target;
    target = arguments[1] || {}; // skip the boolean and the target

    i = 2;
  }

  if (target == null || typeof target !== 'object' && typeof target !== 'function') {
    target = {};
  }

  for (; i < length; ++i) {
    options = arguments[i]; // Only deal with non-null/undefined values

    if (options != null) {
      // Extend the base object
      for (name in options) {
        src = getProperty(target, name);
        copy = getProperty(options, name); // Prevent never-ending loop

        if (target !== copy) {
          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (isPlainObject$1(copy) || (copyIsArray = isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && isArray(src) ? src : [];
            } else {
              clone = src && isPlainObject$1(src) ? src : {};
            } // Never move original objects, clone them


            setProperty(target, {
              name: name,
              newValue: extend(deep, clone, copy)
            }); // Don't bring in undefined values
          } else if (typeof copy !== 'undefined') {
            setProperty(target, {
              name: name,
              newValue: copy
            });
          }
        }
      }
    }
  } // Return the modified object


  return target;
};

function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/**
 * @typedef {(error?: Error|null|undefined, ...output: any[]) => void} Callback
 * @typedef {(...input: any[]) => any} Middleware
 *
 * @typedef {(...input: any[]) => void} Run Call all middleware.
 * @typedef {(fn: Middleware) => Pipeline} Use Add `fn` (middleware) to the list.
 * @typedef {{run: Run, use: Use}} Pipeline
 */

/**
 * Create new middleware.
 *
 * @returns {Pipeline}
 */
function trough() {
  /** @type {Middleware[]} */
  const fns = [];
  /** @type {Pipeline} */

  const pipeline = {
    run,
    use
  };
  return pipeline;
  /** @type {Run} */

  function run(...values) {
    let middlewareIndex = -1;
    /** @type {Callback} */

    const callback = values.pop();

    if (typeof callback !== 'function') {
      throw new TypeError('Expected function as last argument, not ' + callback);
    }

    next(null, ...values);
    /**
     * Run the next `fn`, or we’re done.
     *
     * @param {Error|null|undefined} error
     * @param {any[]} output
     */

    function next(error, ...output) {
      const fn = fns[++middlewareIndex];
      let index = -1;

      if (error) {
        callback(error);
        return;
      } // Copy non-nullish input into values.


      while (++index < values.length) {
        if (output[index] === null || output[index] === undefined) {
          output[index] = values[index];
        }
      } // Save the newly created `output` for the next call.


      values = output; // Next or done.

      if (fn) {
        wrap(fn, next)(...output);
      } else {
        callback(null, ...output);
      }
    }
  }
  /** @type {Use} */


  function use(middelware) {
    if (typeof middelware !== 'function') {
      throw new TypeError('Expected `middelware` to be a function, not ' + middelware);
    }

    fns.push(middelware);
    return pipeline;
  }
}
/**
 * Wrap `middleware`.
 * Can be sync or async; return a promise, receive a callback, or return new
 * values and errors.
 *
 * @param {Middleware} middleware
 * @param {Callback} callback
 */

function wrap(middleware, callback) {
  /** @type {boolean} */
  let called;
  return wrapped;
  /**
   * Call `middleware`.
   * @param {any[]} parameters
   * @returns {void}
   */

  function wrapped(...parameters) {
    const fnExpectsCallback = middleware.length > parameters.length;
    /** @type {any} */

    let result;

    if (fnExpectsCallback) {
      parameters.push(done);
    }

    try {
      result = middleware(...parameters);
    } catch (error) {
      /** @type {Error} */
      const exception = error; // Well, this is quite the pickle.
      // `middleware` received a callback and called it synchronously, but that
      // threw an error.
      // The only thing left to do is to throw the thing instead.

      if (fnExpectsCallback && called) {
        throw exception;
      }

      return done(exception);
    }

    if (!fnExpectsCallback) {
      if (result instanceof Promise) {
        result.then(then, done);
      } else if (result instanceof Error) {
        done(result);
      } else {
        then(result);
      }
    }
  }
  /**
   * Call `callback`, only once.
   * @type {Callback}
   */


  function done(error, ...output) {
    if (!called) {
      called = true;
      callback(error, ...output);
    }
  }
  /**
   * Call `done` with one value.
   *
   * @param {any} [value]
   */


  function then(value) {
    done(null, value);
  }
}

var own$5 = {}.hasOwnProperty;
/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Position} Position
 * @typedef {import('unist').Point} Point
 */

/**
 * Stringify one point, a position (start and end points), or a node’s
 * positional information.
 *
 * @param {Node|Position|Point} [value]
 * @returns {string}
 */

function stringifyPosition(value) {
  // Nothing.
  if (!value || typeof value !== 'object') {
    return '';
  } // Node.


  if (own$5.call(value, 'position') || own$5.call(value, 'type')) {
    // @ts-ignore looks like a node.
    return position(value.position);
  } // Position.


  if (own$5.call(value, 'start') || own$5.call(value, 'end')) {
    // @ts-ignore looks like a position.
    return position(value);
  } // Point.


  if (own$5.call(value, 'line') || own$5.call(value, 'column')) {
    // @ts-ignore looks like a point.
    return point(value);
  } // ?


  return '';
}
/**
 * @param {Point} point
 * @returns {string}
 */

function point(point) {
  return index(point && point.line) + ':' + index(point && point.column);
}
/**
 * @param {Position} pos
 * @returns {string}
 */


function position(pos) {
  return point(pos && pos.start) + '-' + point(pos && pos.end);
}
/**
 * @param {number} value
 * @returns {number}
 */


function index(value) {
  return value && typeof value === 'number' ? value : 1;
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Position} Position
 * @typedef {import('unist').Point} Point
 */
class VFileMessage extends Error {
  /**
   * Constructor of a message for `reason` at `place` from `origin`.
   * When an error is passed in as `reason`, copies the `stack`.
   *
   * @param {string|Error} reason Reason for message (`string` or `Error`). Uses the stack and message of the error if given.
   * @param {Node|Position|Point} [place] Place at which the message occurred in a file (`Node`, `Position`, or `Point`, optional).
   * @param {string} [origin] Place in code the message originates from (`string`, optional).
   */
  constructor(reason, place, origin) {
    /** @type {[string?, string?]} */
    var parts = [null, null];
    /** @type {Position} */

    var position = {
      start: {
        line: null,
        column: null
      },
      end: {
        line: null,
        column: null
      }
    };
    /** @type {number} */

    var index;
    super();

    if (typeof place === 'string') {
      origin = place;
      place = null;
    }

    if (typeof origin === 'string') {
      index = origin.indexOf(':');

      if (index === -1) {
        parts[1] = origin;
      } else {
        parts[0] = origin.slice(0, index);
        parts[1] = origin.slice(index + 1);
      }
    }

    if (place) {
      // Node.
      if ('type' in place || 'position' in place) {
        if (place.position) {
          position = place.position;
        }
      } // Position.
      else if ('start' in place || 'end' in place) {
        // @ts-ignore Looks like a position.
        position = place;
      } // Point.
      else if ('line' in place || 'column' in place) {
        // @ts-ignore Looks like a point.
        position.start = place;
      }
    } // Fields from `Error`


    this.name = stringifyPosition(place) || '1:1';
    this.message = typeof reason === 'object' ? reason.message : reason;
    this.stack = typeof reason === 'object' ? reason.stack : '';
    /**
     * Reason for message.
     * @type {string}
     */

    this.reason = this.message;
    /**
     * If true, marks associated file as no longer processable.
     * @type {boolean?}
     */
    // eslint-disable-next-line no-unused-expressions

    this.fatal;
    /**
     * Starting line of error.
     * @type {number?}
     */

    this.line = position.start.line;
    /**
     * Starting column of error.
     * @type {number?}
     */

    this.column = position.start.column;
    /**
     * Namespace of warning.
     * @type {string?}
     */

    this.source = parts[0];
    /**
     * Category of message.
     * @type {string?}
     */

    this.ruleId = parts[1];
    /**
     * Full range information, when available.
     * Has start and end properties, both set to an object with line and column, set to number?.
     * @type {Position?}
     */

    this.position = position; // The following fields are “well known”.
    // Not standard.
    // Feel free to add other non-standard fields to your messages.

    /* eslint-disable no-unused-expressions */

    /**
     * You can use this to specify the source value that’s being reported, which
     * is deemed incorrect.
     * @type {string?}
     */

    this.actual;
    /**
     * You can use this to suggest values that should be used instead of
     * `actual`, one or more values that are deemed as acceptable.
     * @type {Array<string>?}
     */

    this.expected;
    /**
     * You may add a file property with a path of a file (used throughout the VFile ecosystem).
     * @type {string?}
     */

    this.file;
    /**
     * You may add a url property with a link to documentation for the message.
     * @type {string?}
     */

    this.url;
    /**
     * You may add a note property with a long form description of the message (supported by vfile-reporter).
     * @type {string?}
     */

    this.note;
    /* eslint-enable no-unused-expressions */
  }

}
VFileMessage.prototype.file = '';
VFileMessage.prototype.name = '';
VFileMessage.prototype.reason = '';
VFileMessage.prototype.message = '';
VFileMessage.prototype.stack = '';
VFileMessage.prototype.fatal = null;
VFileMessage.prototype.column = null;
VFileMessage.prototype.line = null;
VFileMessage.prototype.source = null;
VFileMessage.prototype.ruleId = null;
VFileMessage.prototype.position = null;

// A derivative work based on:
// <https://github.com/browserify/path-browserify>.
// Which is licensed:
//
// MIT License
//
// Copyright (c) 2013 James Halliday
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// A derivative work based on:
//
// Parts of that are extracted from Node’s internal `path` module:
// <https://github.com/nodejs/node/blob/master/lib/path.js>.
// Which is licensed:
//
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
const path = {
  basename,
  dirname,
  extname,
  join,
  sep: '/'
};
/* eslint-disable max-depth, complexity */

/**
 * @param {string} path
 * @param {string} [ext]
 * @returns {string}
 */

function basename(path, ext) {
  if (ext !== undefined && typeof ext !== 'string') {
    throw new TypeError('"ext" argument must be a string');
  }

  assertPath$1(path);
  let start = 0;
  let end = -1;
  let index = path.length;
  /** @type {boolean|undefined} */

  let seenNonSlash;

  if (ext === undefined || ext.length === 0 || ext.length > path.length) {
    while (index--) {
      if (path.charCodeAt(index) === 47
      /* `/` */
      ) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now.
        if (seenNonSlash) {
          start = index + 1;
          break;
        }
      } else if (end < 0) {
        // We saw the first non-path separator, mark this as the end of our
        // path component.
        seenNonSlash = true;
        end = index + 1;
      }
    }

    return end < 0 ? '' : path.slice(start, end);
  }

  if (ext === path) {
    return '';
  }

  let firstNonSlashEnd = -1;
  let extIndex = ext.length - 1;

  while (index--) {
    if (path.charCodeAt(index) === 47
    /* `/` */
    ) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now.
      if (seenNonSlash) {
        start = index + 1;
        break;
      }
    } else {
      if (firstNonSlashEnd < 0) {
        // We saw the first non-path separator, remember this index in case
        // we need it if the extension ends up not matching.
        seenNonSlash = true;
        firstNonSlashEnd = index + 1;
      }

      if (extIndex > -1) {
        // Try to match the explicit extension.
        if (path.charCodeAt(index) === ext.charCodeAt(extIndex--)) {
          if (extIndex < 0) {
            // We matched the extension, so mark this as the end of our path
            // component
            end = index;
          }
        } else {
          // Extension does not match, so our result is the entire path
          // component
          extIndex = -1;
          end = firstNonSlashEnd;
        }
      }
    }
  }

  if (start === end) {
    end = firstNonSlashEnd;
  } else if (end < 0) {
    end = path.length;
  }

  return path.slice(start, end);
}
/**
 * @param {string} path
 * @returns {string}
 */


function dirname(path) {
  assertPath$1(path);

  if (path.length === 0) {
    return '.';
  }

  let end = -1;
  let index = path.length;
  /** @type {boolean|undefined} */

  let unmatchedSlash; // Prefix `--` is important to not run on `0`.

  while (--index) {
    if (path.charCodeAt(index) === 47
    /* `/` */
    ) {
      if (unmatchedSlash) {
        end = index;
        break;
      }
    } else if (!unmatchedSlash) {
      // We saw the first non-path separator
      unmatchedSlash = true;
    }
  }

  return end < 0 ? path.charCodeAt(0) === 47
  /* `/` */
  ? '/' : '.' : end === 1 && path.charCodeAt(0) === 47
  /* `/` */
  ? '//' : path.slice(0, end);
}
/**
 * @param {string} path
 * @returns {string}
 */


function extname(path) {
  assertPath$1(path);
  let index = path.length;
  let end = -1;
  let startPart = 0;
  let startDot = -1; // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find.

  let preDotState = 0;
  /** @type {boolean|undefined} */

  let unmatchedSlash;

  while (index--) {
    const code = path.charCodeAt(index);

    if (code === 47
    /* `/` */
    ) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now.
      if (unmatchedSlash) {
        startPart = index + 1;
        break;
      }

      continue;
    }

    if (end < 0) {
      // We saw the first non-path separator, mark this as the end of our
      // extension.
      unmatchedSlash = true;
      end = index + 1;
    }

    if (code === 46
    /* `.` */
    ) {
      // If this is our first dot, mark it as the start of our extension.
      if (startDot < 0) {
        startDot = index;
      } else if (preDotState !== 1) {
        preDotState = 1;
      }
    } else if (startDot > -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension.
      preDotState = -1;
    }
  }

  if (startDot < 0 || end < 0 || // We saw a non-dot character immediately before the dot.
  preDotState === 0 || // The (right-most) trimmed path component is exactly `..`.
  preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }

  return path.slice(startDot, end);
}
/**
 * @param {Array<string>} segments
 * @returns {string}
 */


function join(...segments) {
  let index = -1;
  /** @type {string|undefined} */

  let joined;

  while (++index < segments.length) {
    assertPath$1(segments[index]);

    if (segments[index]) {
      joined = joined === undefined ? segments[index] : joined + '/' + segments[index];
    }
  }

  return joined === undefined ? '.' : normalize$1(joined);
}
/**
 * Note: `normalize` is not exposed as `path.normalize`, so some code is
 * manually removed from it.
 *
 * @param {string} path
 * @returns {string}
 */


function normalize$1(path) {
  assertPath$1(path);
  const absolute = path.charCodeAt(0) === 47;
  /* `/` */
  // Normalize the path according to POSIX rules.

  let value = normalizeString(path, !absolute);

  if (value.length === 0 && !absolute) {
    value = '.';
  }

  if (value.length > 0 && path.charCodeAt(path.length - 1) === 47
  /* / */
  ) {
    value += '/';
  }

  return absolute ? '/' + value : value;
}
/**
 * Resolve `.` and `..` elements in a path with directory names.
 *
 * @param {string} path
 * @param {boolean} allowAboveRoot
 * @returns {string}
 */


function normalizeString(path, allowAboveRoot) {
  let result = '';
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let index = -1;
  /** @type {number|undefined} */

  let code;
  /** @type {number} */

  let lastSlashIndex;

  while (++index <= path.length) {
    if (index < path.length) {
      code = path.charCodeAt(index);
    } else if (code === 47
    /* `/` */
    ) {
      break;
    } else {
      code = 47;
      /* `/` */
    }

    if (code === 47
    /* `/` */
    ) {
      if (lastSlash === index - 1 || dots === 1) ; else if (lastSlash !== index - 1 && dots === 2) {
        if (result.length < 2 || lastSegmentLength !== 2 || result.charCodeAt(result.length - 1) !== 46
        /* `.` */
        || result.charCodeAt(result.length - 2) !== 46
        /* `.` */
        ) {
          if (result.length > 2) {
            lastSlashIndex = result.lastIndexOf('/');

            if (lastSlashIndex !== result.length - 1) {
              if (lastSlashIndex < 0) {
                result = '';
                lastSegmentLength = 0;
              } else {
                result = result.slice(0, lastSlashIndex);
                lastSegmentLength = result.length - 1 - result.lastIndexOf('/');
              }

              lastSlash = index;
              dots = 0;
              continue;
            }
          } else if (result.length > 0) {
            result = '';
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }

        if (allowAboveRoot) {
          result = result.length > 0 ? result + '/..' : '..';
          lastSegmentLength = 2;
        }
      } else {
        if (result.length > 0) {
          result += '/' + path.slice(lastSlash + 1, index);
        } else {
          result = path.slice(lastSlash + 1, index);
        }

        lastSegmentLength = index - lastSlash - 1;
      }

      lastSlash = index;
      dots = 0;
    } else if (code === 46
    /* `.` */
    && dots > -1) {
      dots++;
    } else {
      dots = -1;
    }
  }

  return result;
}
/**
 * @param {string} path
 */


function assertPath$1(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}
/* eslint-enable max-depth, complexity */

// Somewhat based on:
// <https://github.com/defunctzombie/node-process/blob/master/browser.js>.
// But I don’t think one tiny line of code can be copyrighted. 😅
const proc = {
  cwd
};

function cwd() {
  return '/';
}

/**
 * @typedef URL
 * @property {string} hash
 * @property {string} host
 * @property {string} hostname
 * @property {string} href
 * @property {string} origin
 * @property {string} password
 * @property {string} pathname
 * @property {string} port
 * @property {string} protocol
 * @property {string} search
 * @property {any} searchParams
 * @property {string} username
 * @property {() => string} toString
 * @property {() => string} toJSON
 */

/**
 * @param {unknown} fileURLOrPath
 * @returns {fileURLOrPath is URL}
 */
// From: <https://github.com/nodejs/node/blob/fcf8ba4/lib/internal/url.js#L1501>
function isUrl(fileURLOrPath) {
  return fileURLOrPath !== null && typeof fileURLOrPath === 'object' && // @ts-expect-error: indexable.
  fileURLOrPath.href && // @ts-expect-error: indexable.
  fileURLOrPath.origin;
}

/// <reference lib="dom" />

/**
 * @param {string|URL} path
 */

function urlToPath(path) {
  if (typeof path === 'string') {
    path = new URL(path);
  } else if (!isUrl(path)) {
    /** @type {NodeJS.ErrnoException} */
    const error = new TypeError('The "path" argument must be of type string or an instance of URL. Received `' + path + '`');
    error.code = 'ERR_INVALID_ARG_TYPE';
    throw error;
  }

  if (path.protocol !== 'file:') {
    /** @type {NodeJS.ErrnoException} */
    const error = new TypeError('The URL must be of scheme file');
    error.code = 'ERR_INVALID_URL_SCHEME';
    throw error;
  }

  return getPathFromURLPosix(path);
}
/**
 * @param {URL} url
 */

function getPathFromURLPosix(url) {
  if (url.hostname !== '') {
    /** @type {NodeJS.ErrnoException} */
    const error = new TypeError('File URL host must be "localhost" or empty on darwin');
    error.code = 'ERR_INVALID_FILE_URL_HOST';
    throw error;
  }

  const pathname = url.pathname;
  let index = -1;

  while (++index < pathname.length) {
    if (pathname.charCodeAt(index) === 37
    /* `%` */
    && pathname.charCodeAt(index + 1) === 50
    /* `2` */
    ) {
      const third = pathname.charCodeAt(index + 2);

      if (third === 70
      /* `F` */
      || third === 102
      /* `f` */
      ) {
        /** @type {NodeJS.ErrnoException} */
        const error = new TypeError('File URL path must not include encoded / characters');
        error.code = 'ERR_INVALID_FILE_URL_PATH';
        throw error;
      }
    }
  }

  return decodeURIComponent(pathname);
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Position} Position
 * @typedef {import('unist').Point} Point
 * @typedef {import('./minurl.shared.js').URL} URL
 * @typedef {import('..').VFileData} VFileData
 * @typedef {import('..').VFileValue} VFileValue
 *
 * @typedef {'ascii'|'utf8'|'utf-8'|'utf16le'|'ucs2'|'ucs-2'|'base64'|'base64url'|'latin1'|'binary'|'hex'} BufferEncoding
 *   Encodings supported by the buffer class.
 *   This is a copy of the typing from Node, copied to prevent Node globals from
 *   being needed.
 *   Copied from: <https://github.com/DefinitelyTyped/DefinitelyTyped/blob/90a4ec8/types/node/buffer.d.ts#L170>
 *
 *
 * @typedef {VFileValue|VFileOptions|VFile|URL} VFileCompatible
 *   Things that can be passed to the constructor.
 *
 * @typedef VFileCoreOptions
 * @property {VFileValue} [value]
 * @property {string} [cwd]
 * @property {Array<string>} [history]
 * @property {string|URL} [path]
 * @property {string} [basename]
 * @property {string} [stem]
 * @property {string} [extname]
 * @property {string} [dirname]
 * @property {VFileData} [data]
 *
 * @typedef Map
 *   Raw source map, see:
 *   <https://github.com/mozilla/source-map/blob/58819f0/source-map.d.ts#L15-L23>.
 * @property {number} version
 * @property {Array<string>} sources
 * @property {Array<string>} names
 * @property {string|undefined} [sourceRoot]
 * @property {Array<string>|undefined} [sourcesContent]
 * @property {string} mappings
 * @property {string} file
 *
 * @typedef {{[key: string]: unknown} & VFileCoreOptions} VFileOptions
 *   Configuration: a bunch of keys that will be shallow copied over to the new
 *   file.
 *
 * @typedef {Record<string, unknown>} VFileReporterSettings
 * @typedef {<T = VFileReporterSettings>(files: Array<VFile>, options: T) => string} VFileReporter
 */
// `{stem: 'a', path: '~/b.js'}` would throw, as a path is needed before a
// stem can be set.

const order = ['history', 'path', 'basename', 'stem', 'extname', 'dirname'];
class VFile {
  /**
   * Create a new virtual file.
   *
   * If `options` is `string` or `Buffer`, treats it as `{value: options}`.
   * If `options` is a `VFile`, shallow copies its data over to the new file.
   * All other given fields are set on the newly created `VFile`.
   *
   * Path related properties are set in the following order (least specific to
   * most specific): `history`, `path`, `basename`, `stem`, `extname`,
   * `dirname`.
   *
   * It’s not possible to set either `dirname` or `extname` without setting
   * either `history`, `path`, `basename`, or `stem` as well.
   *
   * @param {VFileCompatible} [value]
   */
  constructor(value) {
    /** @type {VFileOptions} */
    let options;

    if (!value) {
      options = {};
    } else if (typeof value === 'string' || isBuffer(value)) {
      // @ts-expect-error Looks like a buffer.
      options = {
        value
      };
    } else if (isUrl(value)) {
      options = {
        path: value
      };
    } else {
      // @ts-expect-error Looks like file or options.
      options = value;
    }
    /**
     * Place to store custom information.
     * It’s OK to store custom data directly on the file, moving it to `data`
     * gives a little more privacy.
     * @type {VFileData}
     */


    this.data = {};
    /**
     * List of messages associated with the file.
     * @type {Array<VFileMessage>}
     */

    this.messages = [];
    /**
     * List of file paths the file moved between.
     * @type {Array<string>}
     */

    this.history = [];
    /**
     * Base of `path`.
     * Defaults to `process.cwd()` (`/` in browsers).
     * @type {string}
     */

    this.cwd = proc.cwd();
    /* eslint-disable no-unused-expressions */

    /**
     * Raw value.
     * @type {VFileValue}
     */

    this.value; // The below are non-standard, they are “well-known”.
    // As in, used in several tools.

    /**
     * Whether a file was saved to disk.
     * This is used by vfile reporters.
     * @type {boolean}
     */

    this.stored;
    /**
     * Sometimes files have a non-string representation.
     * This can be stored in the `result` field.
     * One example is when turning markdown into React nodes.
     * This is used by unified to store non-string results.
     * @type {unknown}
     */

    this.result;
    /**
     * Sometimes files have a source map associated with them.
     * This can be stored in the `map` field.
     * This should be a `RawSourceMap` type from the `source-map` module.
     * @type {Map|undefined}
     */

    this.map;
    /* eslint-enable no-unused-expressions */
    // Set path related properties in the correct order.

    let index = -1;

    while (++index < order.length) {
      const prop = order[index]; // Note: we specifically use `in` instead of `hasOwnProperty` to accept
      // `vfile`s too.

      if (prop in options && options[prop] !== undefined) {
        // @ts-expect-error: TS is confused by the different types for `history`.
        this[prop] = prop === 'history' ? [...options[prop]] : options[prop];
      }
    }
    /** @type {string} */


    let prop; // Set non-path related properties.

    for (prop in options) {
      // @ts-expect-error: fine to set other things.
      if (!order.includes(prop)) this[prop] = options[prop];
    }
  }
  /**
   * Access full path (`~/index.min.js`).
   *
   * @returns {string}
   */


  get path() {
    return this.history[this.history.length - 1];
  }
  /**
   * Set full path (`~/index.min.js`).
   * Cannot be nullified.
   *
   * @param {string|URL} path
   */


  set path(path) {
    if (isUrl(path)) {
      path = urlToPath(path);
    }

    assertNonEmpty(path, 'path');

    if (this.path !== path) {
      this.history.push(path);
    }
  }
  /**
   * Access parent path (`~`).
   */


  get dirname() {
    return typeof this.path === 'string' ? path.dirname(this.path) : undefined;
  }
  /**
   * Set parent path (`~`).
   * Cannot be set if there's no `path` yet.
   */


  set dirname(dirname) {
    assertPath(this.basename, 'dirname');
    this.path = path.join(dirname || '', this.basename);
  }
  /**
   * Access basename (including extname) (`index.min.js`).
   */


  get basename() {
    return typeof this.path === 'string' ? path.basename(this.path) : undefined;
  }
  /**
   * Set basename (`index.min.js`).
   * Cannot contain path separators.
   * Cannot be nullified either (use `file.path = file.dirname` instead).
   */


  set basename(basename) {
    assertNonEmpty(basename, 'basename');
    assertPart(basename, 'basename');
    this.path = path.join(this.dirname || '', basename);
  }
  /**
   * Access extname (including dot) (`.js`).
   */


  get extname() {
    return typeof this.path === 'string' ? path.extname(this.path) : undefined;
  }
  /**
   * Set extname (including dot) (`.js`).
   * Cannot be set if there's no `path` yet and cannot contain path separators.
   */


  set extname(extname) {
    assertPart(extname, 'extname');
    assertPath(this.dirname, 'extname');

    if (extname) {
      if (extname.charCodeAt(0) !== 46
      /* `.` */
      ) {
        throw new Error('`extname` must start with `.`');
      }

      if (extname.includes('.', 1)) {
        throw new Error('`extname` cannot contain multiple dots');
      }
    }

    this.path = path.join(this.dirname, this.stem + (extname || ''));
  }
  /**
   * Access stem (w/o extname) (`index.min`).
   */


  get stem() {
    return typeof this.path === 'string' ? path.basename(this.path, this.extname) : undefined;
  }
  /**
   * Set stem (w/o extname) (`index.min`).
   * Cannot be nullified, and cannot contain path separators.
   */


  set stem(stem) {
    assertNonEmpty(stem, 'stem');
    assertPart(stem, 'stem');
    this.path = path.join(this.dirname || '', stem + (this.extname || ''));
  }
  /**
   * Serialize the file.
   *
   * @param {BufferEncoding} [encoding='utf8'] If `file.value` is a buffer, `encoding` is used to serialize buffers.
   * @returns {string}
   */


  toString(encoding) {
    return (this.value || '').toString(encoding);
  }
  /**
   * Create a message and associates it w/ the file.
   *
   * @param {string|Error} reason Reason for message (`string` or `Error`). Uses the stack and message of the error if given.
   * @param {Node|Position|Point} [place] Place at which the message occurred in a file (`Node`, `Position`, or `Point`, optional).
   * @param {string} [origin] Place in code the message originates from (`string`, optional).
   * @returns {VFileMessage}
   */


  message(reason, place, origin) {
    const message = new VFileMessage(reason, place, origin);

    if (this.path) {
      message.name = this.path + ':' + message.name;
      message.file = this.path;
    }

    message.fatal = false;
    this.messages.push(message);
    return message;
  }
  /**
   * Info: create a message, associate it with the file, and mark the fatality
   * as `null`.
   * Calls `message()` internally.
   *
   * @param {string|Error} reason Reason for message (`string` or `Error`). Uses the stack and message of the error if given.
   * @param {Node|Position|Point} [place] Place at which the message occurred in a file (`Node`, `Position`, or `Point`, optional).
   * @param {string} [origin] Place in code the message originates from (`string`, optional).
   * @returns {VFileMessage}
   */


  info(reason, place, origin) {
    const message = this.message(reason, place, origin);
    message.fatal = null;
    return message;
  }
  /**
   * Fail: create a message, associate it with the file, mark the fatality as
   * `true`.
   * Note: fatal errors mean a file is no longer processable.
   * Calls `message()` internally.
   *
   * @param {string|Error} reason Reason for message (`string` or `Error`). Uses the stack and message of the error if given.
   * @param {Node|Position|Point} [place] Place at which the message occurred in a file (`Node`, `Position`, or `Point`, optional).
   * @param {string} [origin] Place in code the message originates from (`string`, optional).
   * @returns {never}
   */


  fail(reason, place, origin) {
    const message = this.message(reason, place, origin);
    message.fatal = true;
    throw message;
  }

}
/**
 * Assert that `part` is not a path (as in, does not contain `path.sep`).
 *
 * @param {string|undefined} part
 * @param {string} name
 * @returns {void}
 */

function assertPart(part, name) {
  if (part && part.includes(path.sep)) {
    throw new Error('`' + name + '` cannot be a path: did not expect `' + path.sep + '`');
  }
}
/**
 * Assert that `part` is not empty.
 *
 * @param {string|undefined} part
 * @param {string} name
 * @returns {asserts part is string}
 */


function assertNonEmpty(part, name) {
  if (!part) {
    throw new Error('`' + name + '` cannot be empty');
  }
}
/**
 * Assert `path` exists.
 *
 * @param {string|undefined} path
 * @param {string} name
 * @returns {asserts path is string}
 */


function assertPath(path, name) {
  if (!path) {
    throw new Error('Setting `' + name + '` requires `path` to be set too');
  }
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('vfile').VFileCompatible} VFileCompatible
 * @typedef {import('vfile').VFileValue} VFileValue
 * @typedef {import('..').Processor} Processor
 * @typedef {import('..').Plugin} Plugin
 * @typedef {import('..').Preset} Preset
 * @typedef {import('..').Pluggable} Pluggable
 * @typedef {import('..').PluggableList} PluggableList
 * @typedef {import('..').Transformer} Transformer
 * @typedef {import('..').Parser} Parser
 * @typedef {import('..').Compiler} Compiler
 * @typedef {import('..').RunCallback} RunCallback
 * @typedef {import('..').ProcessCallback} ProcessCallback
 *
 * @typedef Context
 * @property {Node} tree
 * @property {VFile} file
 */

const unified = base().freeze();
const own$4 = {}.hasOwnProperty; // Function to create the first processor.

/**
 * @returns {Processor}
 */

function base() {
  const transformers = trough();
  /** @type {Processor['attachers']} */

  const attachers = [];
  /** @type {Record<string, unknown>} */

  let namespace = {};
  /** @type {boolean|undefined} */

  let frozen;
  let freezeIndex = -1; // Data management.
  // @ts-expect-error: overloads are handled.

  processor.data = data;
  processor.Parser = undefined;
  processor.Compiler = undefined; // Lock.

  processor.freeze = freeze; // Plugins.

  processor.attachers = attachers; // @ts-expect-error: overloads are handled.

  processor.use = use; // API.

  processor.parse = parse;
  processor.stringify = stringify; // @ts-expect-error: overloads are handled.

  processor.run = run;
  processor.runSync = runSync; // @ts-expect-error: overloads are handled.

  processor.process = process;
  processor.processSync = processSync; // Expose.

  return processor; // Create a new processor based on the processor in the current scope.

  /** @type {Processor} */

  function processor() {
    const destination = base();
    let index = -1;

    while (++index < attachers.length) {
      destination.use(...attachers[index]);
    }

    destination.data(extend(true, {}, namespace));
    return destination;
  }
  /**
   * @param {string|Record<string, unknown>} [key]
   * @param {unknown} [value]
   * @returns {unknown}
   */


  function data(key, value) {
    if (typeof key === 'string') {
      // Set `key`.
      if (arguments.length === 2) {
        assertUnfrozen('data', frozen);
        namespace[key] = value;
        return processor;
      } // Get `key`.


      return own$4.call(namespace, key) && namespace[key] || null;
    } // Set space.


    if (key) {
      assertUnfrozen('data', frozen);
      namespace = key;
      return processor;
    } // Get space.


    return namespace;
  }
  /** @type {Processor['freeze']} */


  function freeze() {
    if (frozen) {
      return processor;
    }

    while (++freezeIndex < attachers.length) {
      const [attacher, ...options] = attachers[freezeIndex];

      if (options[0] === false) {
        continue;
      }

      if (options[0] === true) {
        options[1] = undefined;
      }
      /** @type {Transformer|void} */


      const transformer = attacher.call(processor, ...options);

      if (typeof transformer === 'function') {
        transformers.use(transformer);
      }
    }

    frozen = true;
    freezeIndex = Number.POSITIVE_INFINITY;
    return processor;
  }
  /**
   * @param {Pluggable|null|undefined} [value]
   * @param {...unknown} options
   * @returns {Processor}
   */


  function use(value, ...options) {
    /** @type {Record<string, unknown>|undefined} */
    let settings;
    assertUnfrozen('use', frozen);

    if (value === null || value === undefined) ; else if (typeof value === 'function') {
      addPlugin(value, ...options);
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        addList(value);
      } else {
        addPreset(value);
      }
    } else {
      throw new TypeError('Expected usable value, not `' + value + '`');
    }

    if (settings) {
      namespace.settings = Object.assign(namespace.settings || {}, settings);
    }

    return processor;
    /**
     * @param {import('..').Pluggable<unknown[]>} value
     * @returns {void}
     */

    function add(value) {
      if (typeof value === 'function') {
        addPlugin(value);
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          const [plugin, ...options] = value;
          addPlugin(plugin, ...options);
        } else {
          addPreset(value);
        }
      } else {
        throw new TypeError('Expected usable value, not `' + value + '`');
      }
    }
    /**
     * @param {Preset} result
     * @returns {void}
     */


    function addPreset(result) {
      addList(result.plugins);

      if (result.settings) {
        settings = Object.assign(settings || {}, result.settings);
      }
    }
    /**
     * @param {PluggableList|null|undefined} [plugins]
     * @returns {void}
     */


    function addList(plugins) {
      let index = -1;

      if (plugins === null || plugins === undefined) ; else if (Array.isArray(plugins)) {
        while (++index < plugins.length) {
          const thing = plugins[index];
          add(thing);
        }
      } else {
        throw new TypeError('Expected a list of plugins, not `' + plugins + '`');
      }
    }
    /**
     * @param {Plugin} plugin
     * @param {...unknown} [value]
     * @returns {void}
     */


    function addPlugin(plugin, value) {
      let index = -1;
      /** @type {Processor['attachers'][number]|undefined} */

      let entry;

      while (++index < attachers.length) {
        if (attachers[index][0] === plugin) {
          entry = attachers[index];
          break;
        }
      }

      if (entry) {
        if (isPlainObject(entry[1]) && isPlainObject(value)) {
          value = extend(true, entry[1], value);
        }

        entry[1] = value;
      } else {
        // @ts-expect-error: fine.
        attachers.push([...arguments]);
      }
    }
  }
  /** @type {Processor['parse']} */


  function parse(doc) {
    processor.freeze();
    const file = vfile(doc);
    const Parser = processor.Parser;
    assertParser('parse', Parser);

    if (newable(Parser, 'parse')) {
      // @ts-expect-error: `newable` checks this.
      return new Parser(String(file), file).parse();
    } // @ts-expect-error: `newable` checks this.


    return Parser(String(file), file); // eslint-disable-line new-cap
  }
  /** @type {Processor['stringify']} */


  function stringify(node, doc) {
    processor.freeze();
    const file = vfile(doc);
    const Compiler = processor.Compiler;
    assertCompiler('stringify', Compiler);
    assertNode(node);

    if (newable(Compiler, 'compile')) {
      // @ts-expect-error: `newable` checks this.
      return new Compiler(node, file).compile();
    } // @ts-expect-error: `newable` checks this.


    return Compiler(node, file); // eslint-disable-line new-cap
  }
  /**
   * @param {Node} node
   * @param {VFileCompatible|RunCallback} [doc]
   * @param {RunCallback} [callback]
   * @returns {Promise<Node>|void}
   */


  function run(node, doc, callback) {
    assertNode(node);
    processor.freeze();

    if (!callback && typeof doc === 'function') {
      callback = doc;
      doc = undefined;
    }

    if (!callback) {
      return new Promise(executor);
    }

    executor(null, callback);
    /**
     * @param {null|((node: Node) => void)} resolve
     * @param {(error: Error) => void} reject
     * @returns {void}
     */

    function executor(resolve, reject) {
      // @ts-expect-error: `doc` can’t be a callback anymore, we checked.
      transformers.run(node, vfile(doc), done);
      /**
       * @param {Error|null} error
       * @param {Node} tree
       * @param {VFile} file
       * @returns {void}
       */

      function done(error, tree, file) {
        tree = tree || node;

        if (error) {
          reject(error);
        } else if (resolve) {
          resolve(tree);
        } else {
          // @ts-expect-error: `callback` is defined if `resolve` is not.
          callback(null, tree, file);
        }
      }
    }
  }
  /** @type {Processor['runSync']} */


  function runSync(node, file) {
    /** @type {Node|undefined} */
    let result;
    /** @type {boolean|undefined} */

    let complete;
    processor.run(node, file, done);
    assertDone('runSync', 'run', complete); // @ts-expect-error: we either bailed on an error or have a tree.

    return result;
    /**
     * @param {Error|null} [error]
     * @param {Node} [tree]
     * @returns {void}
     */

    function done(error, tree) {
      bail(error);
      result = tree;
      complete = true;
    }
  }
  /**
   * @param {VFileCompatible} doc
   * @param {ProcessCallback} [callback]
   * @returns {Promise<VFile>|undefined}
   */


  function process(doc, callback) {
    processor.freeze();
    assertParser('process', processor.Parser);
    assertCompiler('process', processor.Compiler);

    if (!callback) {
      return new Promise(executor);
    }

    executor(null, callback);
    /**
     * @param {null|((file: VFile) => void)} resolve
     * @param {(error?: Error|null|undefined) => void} reject
     * @returns {void}
     */

    function executor(resolve, reject) {
      const file = vfile(doc);
      processor.run(processor.parse(file), file, (error, tree, file) => {
        if (error || !tree || !file) {
          done(error);
        } else {
          /** @type {unknown} */
          const result = processor.stringify(tree, file);

          if (result === undefined || result === null) ; else if (looksLikeAVFileValue(result)) {
            file.value = result;
          } else {
            file.result = result;
          }

          done(error, file);
        }
      });
      /**
       * @param {Error|null|undefined} [error]
       * @param {VFile|undefined} [file]
       * @returns {void}
       */

      function done(error, file) {
        if (error || !file) {
          reject(error);
        } else if (resolve) {
          resolve(file);
        } else {
          // @ts-expect-error: `callback` is defined if `resolve` is not.
          callback(null, file);
        }
      }
    }
  }
  /** @type {Processor['processSync']} */


  function processSync(doc) {
    /** @type {boolean|undefined} */
    let complete;
    processor.freeze();
    assertParser('processSync', processor.Parser);
    assertCompiler('processSync', processor.Compiler);
    const file = vfile(doc);
    processor.process(file, done);
    assertDone('processSync', 'process', complete);
    return file;
    /**
     * @param {Error|null|undefined} [error]
     * @returns {void}
     */

    function done(error) {
      complete = true;
      bail(error);
    }
  }
}
/**
 * Check if `value` is a constructor.
 *
 * @param {unknown} value
 * @param {string} name
 * @returns {boolean}
 */


function newable(value, name) {
  return typeof value === 'function' && // Prototypes do exist.
  // type-coverage:ignore-next-line
  value.prototype && ( // A function with keys in its prototype is probably a constructor.
  // Classes’ prototype methods are not enumerable, so we check if some value
  // exists in the prototype.
  // type-coverage:ignore-next-line
  keys(value.prototype) || name in value.prototype);
}
/**
 * Check if `value` is an object with keys.
 *
 * @param {Record<string, unknown>} value
 * @returns {boolean}
 */


function keys(value) {
  /** @type {string} */
  let key;

  for (key in value) {
    if (own$4.call(value, key)) {
      return true;
    }
  }

  return false;
}
/**
 * Assert a parser is available.
 *
 * @param {string} name
 * @param {unknown} value
 * @returns {asserts value is Parser}
 */


function assertParser(name, value) {
  if (typeof value !== 'function') {
    throw new TypeError('Cannot `' + name + '` without `Parser`');
  }
}
/**
 * Assert a compiler is available.
 *
 * @param {string} name
 * @param {unknown} value
 * @returns {asserts value is Compiler}
 */


function assertCompiler(name, value) {
  if (typeof value !== 'function') {
    throw new TypeError('Cannot `' + name + '` without `Compiler`');
  }
}
/**
 * Assert the processor is not frozen.
 *
 * @param {string} name
 * @param {unknown} frozen
 * @returns {asserts frozen is false}
 */


function assertUnfrozen(name, frozen) {
  if (frozen) {
    throw new Error('Cannot call `' + name + '` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`.');
  }
}
/**
 * Assert `node` is a unist node.
 *
 * @param {unknown} node
 * @returns {asserts node is Node}
 */


function assertNode(node) {
  // `isPlainObj` unfortunately uses `any` instead of `unknown`.
  // type-coverage:ignore-next-line
  if (!isPlainObject(node) || typeof node.type !== 'string') {
    throw new TypeError('Expected node, got `' + node + '`'); // Fine.
  }
}
/**
 * Assert that `complete` is `true`.
 *
 * @param {string} name
 * @param {string} asyncName
 * @param {unknown} complete
 * @returns {asserts complete is true}
 */


function assertDone(name, asyncName, complete) {
  if (!complete) {
    throw new Error('`' + name + '` finished async. Use `' + asyncName + '` instead');
  }
}
/**
 * @param {VFileCompatible} [value]
 * @returns {VFile}
 */


function vfile(value) {
  return looksLikeAVFile(value) ? value : new VFile(value);
}
/**
 * @param {VFileCompatible} [value]
 * @returns {value is VFile}
 */


function looksLikeAVFile(value) {
  return Boolean(value && typeof value === 'object' && 'message' in value && 'messages' in value);
}
/**
 * @param {unknown} [value]
 * @returns {value is VFileValue}
 */


function looksLikeAVFileValue(value) {
  return typeof value === 'string' || isBuffer(value);
}

/**
 * @typedef {import('./info.js').Info} Info
 * @typedef {Record<string, Info>} Properties
 * @typedef {Record<string, string>} Normal
 */
class Schema {
  /**
   * @constructor
   * @param {Properties} property
   * @param {Normal} normal
   * @param {string} [space]
   */
  constructor(property, normal, space) {
    this.property = property;
    this.normal = normal;

    if (space) {
      this.space = space;
    }
  }

}
/** @type {Properties} */

Schema.prototype.property = {};
/** @type {Normal} */

Schema.prototype.normal = {};
/** @type {string|null} */

Schema.prototype.space = null;

/**
 * @typedef {import('./schema.js').Properties} Properties
 * @typedef {import('./schema.js').Normal} Normal
 */
/**
 * @param {Schema[]} definitions
 * @param {string} [space]
 * @returns {Schema}
 */

function merge(definitions, space) {
  /** @type {Properties} */
  const property = {};
  /** @type {Normal} */

  const normal = {};
  let index = -1;

  while (++index < definitions.length) {
    Object.assign(property, definitions[index].property);
    Object.assign(normal, definitions[index].normal);
  }

  return new Schema(property, normal, space);
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
  return value.toLowerCase();
}

class Info {
  /**
   * @constructor
   * @param {string} property
   * @param {string} attribute
   */
  constructor(property, attribute) {
    /** @type {string} */
    this.property = property;
    /** @type {string} */

    this.attribute = attribute;
  }

}
/** @type {string|null} */

Info.prototype.space = null;
Info.prototype.boolean = false;
Info.prototype.booleanish = false;
Info.prototype.overloadedBoolean = false;
Info.prototype.number = false;
Info.prototype.commaSeparated = false;
Info.prototype.spaceSeparated = false;
Info.prototype.commaOrSpaceSeparated = false;
Info.prototype.mustUseProperty = false;
Info.prototype.defined = false;

let powers = 0;
const boolean = increment();
const booleanish = increment();
const overloadedBoolean = increment();
const number = increment();
const spaceSeparated = increment();
const commaSeparated = increment();
const commaOrSpaceSeparated = increment();

function increment() {
  return 2 ** ++powers;
}

var types = /*#__PURE__*/Object.freeze({
	__proto__: null,
	boolean: boolean,
	booleanish: booleanish,
	overloadedBoolean: overloadedBoolean,
	number: number,
	spaceSeparated: spaceSeparated,
	commaSeparated: commaSeparated,
	commaOrSpaceSeparated: commaOrSpaceSeparated
});

/** @type {Array<keyof types>} */
// @ts-expect-error: hush.

const checks = Object.keys(types);
class DefinedInfo extends Info {
  /**
   * @constructor
   * @param {string} property
   * @param {string} attribute
   * @param {number|null} [mask]
   * @param {string} [space]
   */
  constructor(property, attribute, mask, space) {
    let index = -1;
    super(property, attribute);
    mark(this, 'space', space);

    if (typeof mask === 'number') {
      while (++index < checks.length) {
        const check = checks[index];
        mark(this, checks[index], (mask & types[check]) === types[check]);
      }
    }
  }

}
DefinedInfo.prototype.defined = true;
/**
 * @param {DefinedInfo} values
 * @param {string} key
 * @param {unknown} value
 */

function mark(values, key, value) {
  if (value) {
    // @ts-expect-error: assume `value` matches the expected value of `key`.
    values[key] = value;
  }
}

/**
 * @typedef {import('./schema.js').Properties} Properties
 * @typedef {import('./schema.js').Normal} Normal
 *
 * @typedef {Record<string, string>} Attributes
 *
 * @typedef {Object} Definition
 * @property {Record<string, number|null>} properties
 * @property {(attributes: Attributes, property: string) => string} transform
 * @property {string} [space]
 * @property {Attributes} [attributes]
 * @property {Array<string>} [mustUseProperty]
 */
const own$3 = {}.hasOwnProperty;
/**
 * @param {Definition} definition
 * @returns {Schema}
 */

function create(definition) {
  /** @type {Properties} */
  const property = {};
  /** @type {Normal} */

  const normal = {};
  /** @type {string} */

  let prop;

  for (prop in definition.properties) {
    if (own$3.call(definition.properties, prop)) {
      const value = definition.properties[prop];
      const info = new DefinedInfo(prop, definition.transform(definition.attributes || {}, prop), value, definition.space);

      if (definition.mustUseProperty && definition.mustUseProperty.includes(prop)) {
        info.mustUseProperty = true;
      }

      property[prop] = info;
      normal[normalize(prop)] = prop;
      normal[normalize(info.attribute)] = prop;
    }
  }

  return new Schema(property, normal, definition.space);
}

const xlink = create({
  space: 'xlink',

  transform(_, prop) {
    return 'xlink:' + prop.slice(5).toLowerCase();
  },

  properties: {
    xLinkActuate: null,
    xLinkArcRole: null,
    xLinkHref: null,
    xLinkRole: null,
    xLinkShow: null,
    xLinkTitle: null,
    xLinkType: null
  }
});

const xml = create({
  space: 'xml',

  transform(_, prop) {
    return 'xml:' + prop.slice(3).toLowerCase();
  },

  properties: {
    xmlLang: null,
    xmlBase: null,
    xmlSpace: null
  }
});

/**
 * @param {Record<string, string>} attributes
 * @param {string} attribute
 * @returns {string}
 */
function caseSensitiveTransform(attributes, attribute) {
  return attribute in attributes ? attributes[attribute] : attribute;
}

/**
 * @param {Record<string, string>} attributes
 * @param {string} property
 * @returns {string}
 */

function caseInsensitiveTransform(attributes, property) {
  return caseSensitiveTransform(attributes, property.toLowerCase());
}

const xmlns = create({
  space: 'xmlns',
  attributes: {
    xmlnsxlink: 'xmlns:xlink'
  },
  transform: caseInsensitiveTransform,
  properties: {
    xmlns: null,
    xmlnsXLink: null
  }
});

const aria = create({
  transform(_, prop) {
    return prop === 'role' ? prop : 'aria-' + prop.slice(4).toLowerCase();
  },

  properties: {
    ariaActiveDescendant: null,
    ariaAtomic: booleanish,
    ariaAutoComplete: null,
    ariaBusy: booleanish,
    ariaChecked: booleanish,
    ariaColCount: number,
    ariaColIndex: number,
    ariaColSpan: number,
    ariaControls: spaceSeparated,
    ariaCurrent: null,
    ariaDescribedBy: spaceSeparated,
    ariaDetails: null,
    ariaDisabled: booleanish,
    ariaDropEffect: spaceSeparated,
    ariaErrorMessage: null,
    ariaExpanded: booleanish,
    ariaFlowTo: spaceSeparated,
    ariaGrabbed: booleanish,
    ariaHasPopup: null,
    ariaHidden: booleanish,
    ariaInvalid: null,
    ariaKeyShortcuts: null,
    ariaLabel: null,
    ariaLabelledBy: spaceSeparated,
    ariaLevel: number,
    ariaLive: null,
    ariaModal: booleanish,
    ariaMultiLine: booleanish,
    ariaMultiSelectable: booleanish,
    ariaOrientation: null,
    ariaOwns: spaceSeparated,
    ariaPlaceholder: null,
    ariaPosInSet: number,
    ariaPressed: booleanish,
    ariaReadOnly: booleanish,
    ariaRelevant: null,
    ariaRequired: booleanish,
    ariaRoleDescription: spaceSeparated,
    ariaRowCount: number,
    ariaRowIndex: number,
    ariaRowSpan: number,
    ariaSelected: booleanish,
    ariaSetSize: number,
    ariaSort: null,
    ariaValueMax: number,
    ariaValueMin: number,
    ariaValueNow: number,
    ariaValueText: null,
    role: null
  }
});

const html$3 = create({
  space: 'html',
  attributes: {
    acceptcharset: 'accept-charset',
    classname: 'class',
    htmlfor: 'for',
    httpequiv: 'http-equiv'
  },
  transform: caseInsensitiveTransform,
  mustUseProperty: ['checked', 'multiple', 'muted', 'selected'],
  properties: {
    // Standard Properties.
    abbr: null,
    accept: commaSeparated,
    acceptCharset: spaceSeparated,
    accessKey: spaceSeparated,
    action: null,
    allow: null,
    allowFullScreen: boolean,
    allowPaymentRequest: boolean,
    allowUserMedia: boolean,
    alt: null,
    as: null,
    async: boolean,
    autoCapitalize: null,
    autoComplete: spaceSeparated,
    autoFocus: boolean,
    autoPlay: boolean,
    capture: boolean,
    charSet: null,
    checked: boolean,
    cite: null,
    className: spaceSeparated,
    cols: number,
    colSpan: null,
    content: null,
    contentEditable: booleanish,
    controls: boolean,
    controlsList: spaceSeparated,
    coords: number | commaSeparated,
    crossOrigin: null,
    data: null,
    dateTime: null,
    decoding: null,
    default: boolean,
    defer: boolean,
    dir: null,
    dirName: null,
    disabled: boolean,
    download: overloadedBoolean,
    draggable: booleanish,
    encType: null,
    enterKeyHint: null,
    form: null,
    formAction: null,
    formEncType: null,
    formMethod: null,
    formNoValidate: boolean,
    formTarget: null,
    headers: spaceSeparated,
    height: number,
    hidden: boolean,
    high: number,
    href: null,
    hrefLang: null,
    htmlFor: spaceSeparated,
    httpEquiv: spaceSeparated,
    id: null,
    imageSizes: null,
    imageSrcSet: null,
    inputMode: null,
    integrity: null,
    is: null,
    isMap: boolean,
    itemId: null,
    itemProp: spaceSeparated,
    itemRef: spaceSeparated,
    itemScope: boolean,
    itemType: spaceSeparated,
    kind: null,
    label: null,
    lang: null,
    language: null,
    list: null,
    loading: null,
    loop: boolean,
    low: number,
    manifest: null,
    max: null,
    maxLength: number,
    media: null,
    method: null,
    min: null,
    minLength: number,
    multiple: boolean,
    muted: boolean,
    name: null,
    nonce: null,
    noModule: boolean,
    noValidate: boolean,
    onAbort: null,
    onAfterPrint: null,
    onAuxClick: null,
    onBeforePrint: null,
    onBeforeUnload: null,
    onBlur: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onContextLost: null,
    onContextMenu: null,
    onContextRestored: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFormData: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLanguageChange: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadEnd: null,
    onLoadStart: null,
    onMessage: null,
    onMessageError: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRejectionHandled: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onSecurityPolicyViolation: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onSlotChange: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnhandledRejection: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onWheel: null,
    open: boolean,
    optimum: number,
    pattern: null,
    ping: spaceSeparated,
    placeholder: null,
    playsInline: boolean,
    poster: null,
    preload: null,
    readOnly: boolean,
    referrerPolicy: null,
    rel: spaceSeparated,
    required: boolean,
    reversed: boolean,
    rows: number,
    rowSpan: number,
    sandbox: spaceSeparated,
    scope: null,
    scoped: boolean,
    seamless: boolean,
    selected: boolean,
    shape: null,
    size: number,
    sizes: null,
    slot: null,
    span: number,
    spellCheck: booleanish,
    src: null,
    srcDoc: null,
    srcLang: null,
    srcSet: null,
    start: number,
    step: null,
    style: null,
    tabIndex: number,
    target: null,
    title: null,
    translate: null,
    type: null,
    typeMustMatch: boolean,
    useMap: null,
    value: booleanish,
    width: number,
    wrap: null,
    // Legacy.
    // See: https://html.spec.whatwg.org/#other-elements,-attributes-and-apis
    align: null,
    // Several. Use CSS `text-align` instead,
    aLink: null,
    // `<body>`. Use CSS `a:active {color}` instead
    archive: spaceSeparated,
    // `<object>`. List of URIs to archives
    axis: null,
    // `<td>` and `<th>`. Use `scope` on `<th>`
    background: null,
    // `<body>`. Use CSS `background-image` instead
    bgColor: null,
    // `<body>` and table elements. Use CSS `background-color` instead
    border: number,
    // `<table>`. Use CSS `border-width` instead,
    borderColor: null,
    // `<table>`. Use CSS `border-color` instead,
    bottomMargin: number,
    // `<body>`
    cellPadding: null,
    // `<table>`
    cellSpacing: null,
    // `<table>`
    char: null,
    // Several table elements. When `align=char`, sets the character to align on
    charOff: null,
    // Several table elements. When `char`, offsets the alignment
    classId: null,
    // `<object>`
    clear: null,
    // `<br>`. Use CSS `clear` instead
    code: null,
    // `<object>`
    codeBase: null,
    // `<object>`
    codeType: null,
    // `<object>`
    color: null,
    // `<font>` and `<hr>`. Use CSS instead
    compact: boolean,
    // Lists. Use CSS to reduce space between items instead
    declare: boolean,
    // `<object>`
    event: null,
    // `<script>`
    face: null,
    // `<font>`. Use CSS instead
    frame: null,
    // `<table>`
    frameBorder: null,
    // `<iframe>`. Use CSS `border` instead
    hSpace: number,
    // `<img>` and `<object>`
    leftMargin: number,
    // `<body>`
    link: null,
    // `<body>`. Use CSS `a:link {color: *}` instead
    longDesc: null,
    // `<frame>`, `<iframe>`, and `<img>`. Use an `<a>`
    lowSrc: null,
    // `<img>`. Use a `<picture>`
    marginHeight: number,
    // `<body>`
    marginWidth: number,
    // `<body>`
    noResize: boolean,
    // `<frame>`
    noHref: boolean,
    // `<area>`. Use no href instead of an explicit `nohref`
    noShade: boolean,
    // `<hr>`. Use background-color and height instead of borders
    noWrap: boolean,
    // `<td>` and `<th>`
    object: null,
    // `<applet>`
    profile: null,
    // `<head>`
    prompt: null,
    // `<isindex>`
    rev: null,
    // `<link>`
    rightMargin: number,
    // `<body>`
    rules: null,
    // `<table>`
    scheme: null,
    // `<meta>`
    scrolling: booleanish,
    // `<frame>`. Use overflow in the child context
    standby: null,
    // `<object>`
    summary: null,
    // `<table>`
    text: null,
    // `<body>`. Use CSS `color` instead
    topMargin: number,
    // `<body>`
    valueType: null,
    // `<param>`
    version: null,
    // `<html>`. Use a doctype.
    vAlign: null,
    // Several. Use CSS `vertical-align` instead
    vLink: null,
    // `<body>`. Use CSS `a:visited {color}` instead
    vSpace: number,
    // `<img>` and `<object>`
    // Non-standard Properties.
    allowTransparency: null,
    autoCorrect: null,
    autoSave: null,
    disablePictureInPicture: boolean,
    disableRemotePlayback: boolean,
    prefix: null,
    property: null,
    results: number,
    security: null,
    unselectable: null
  }
});

const svg$1 = create({
  space: 'svg',
  attributes: {
    accentHeight: 'accent-height',
    alignmentBaseline: 'alignment-baseline',
    arabicForm: 'arabic-form',
    baselineShift: 'baseline-shift',
    capHeight: 'cap-height',
    className: 'class',
    clipPath: 'clip-path',
    clipRule: 'clip-rule',
    colorInterpolation: 'color-interpolation',
    colorInterpolationFilters: 'color-interpolation-filters',
    colorProfile: 'color-profile',
    colorRendering: 'color-rendering',
    crossOrigin: 'crossorigin',
    dataType: 'datatype',
    dominantBaseline: 'dominant-baseline',
    enableBackground: 'enable-background',
    fillOpacity: 'fill-opacity',
    fillRule: 'fill-rule',
    floodColor: 'flood-color',
    floodOpacity: 'flood-opacity',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontSizeAdjust: 'font-size-adjust',
    fontStretch: 'font-stretch',
    fontStyle: 'font-style',
    fontVariant: 'font-variant',
    fontWeight: 'font-weight',
    glyphName: 'glyph-name',
    glyphOrientationHorizontal: 'glyph-orientation-horizontal',
    glyphOrientationVertical: 'glyph-orientation-vertical',
    hrefLang: 'hreflang',
    horizAdvX: 'horiz-adv-x',
    horizOriginX: 'horiz-origin-x',
    horizOriginY: 'horiz-origin-y',
    imageRendering: 'image-rendering',
    letterSpacing: 'letter-spacing',
    lightingColor: 'lighting-color',
    markerEnd: 'marker-end',
    markerMid: 'marker-mid',
    markerStart: 'marker-start',
    navDown: 'nav-down',
    navDownLeft: 'nav-down-left',
    navDownRight: 'nav-down-right',
    navLeft: 'nav-left',
    navNext: 'nav-next',
    navPrev: 'nav-prev',
    navRight: 'nav-right',
    navUp: 'nav-up',
    navUpLeft: 'nav-up-left',
    navUpRight: 'nav-up-right',
    onAbort: 'onabort',
    onActivate: 'onactivate',
    onAfterPrint: 'onafterprint',
    onBeforePrint: 'onbeforeprint',
    onBegin: 'onbegin',
    onCancel: 'oncancel',
    onCanPlay: 'oncanplay',
    onCanPlayThrough: 'oncanplaythrough',
    onChange: 'onchange',
    onClick: 'onclick',
    onClose: 'onclose',
    onCopy: 'oncopy',
    onCueChange: 'oncuechange',
    onCut: 'oncut',
    onDblClick: 'ondblclick',
    onDrag: 'ondrag',
    onDragEnd: 'ondragend',
    onDragEnter: 'ondragenter',
    onDragExit: 'ondragexit',
    onDragLeave: 'ondragleave',
    onDragOver: 'ondragover',
    onDragStart: 'ondragstart',
    onDrop: 'ondrop',
    onDurationChange: 'ondurationchange',
    onEmptied: 'onemptied',
    onEnd: 'onend',
    onEnded: 'onended',
    onError: 'onerror',
    onFocus: 'onfocus',
    onFocusIn: 'onfocusin',
    onFocusOut: 'onfocusout',
    onHashChange: 'onhashchange',
    onInput: 'oninput',
    onInvalid: 'oninvalid',
    onKeyDown: 'onkeydown',
    onKeyPress: 'onkeypress',
    onKeyUp: 'onkeyup',
    onLoad: 'onload',
    onLoadedData: 'onloadeddata',
    onLoadedMetadata: 'onloadedmetadata',
    onLoadStart: 'onloadstart',
    onMessage: 'onmessage',
    onMouseDown: 'onmousedown',
    onMouseEnter: 'onmouseenter',
    onMouseLeave: 'onmouseleave',
    onMouseMove: 'onmousemove',
    onMouseOut: 'onmouseout',
    onMouseOver: 'onmouseover',
    onMouseUp: 'onmouseup',
    onMouseWheel: 'onmousewheel',
    onOffline: 'onoffline',
    onOnline: 'ononline',
    onPageHide: 'onpagehide',
    onPageShow: 'onpageshow',
    onPaste: 'onpaste',
    onPause: 'onpause',
    onPlay: 'onplay',
    onPlaying: 'onplaying',
    onPopState: 'onpopstate',
    onProgress: 'onprogress',
    onRateChange: 'onratechange',
    onRepeat: 'onrepeat',
    onReset: 'onreset',
    onResize: 'onresize',
    onScroll: 'onscroll',
    onSeeked: 'onseeked',
    onSeeking: 'onseeking',
    onSelect: 'onselect',
    onShow: 'onshow',
    onStalled: 'onstalled',
    onStorage: 'onstorage',
    onSubmit: 'onsubmit',
    onSuspend: 'onsuspend',
    onTimeUpdate: 'ontimeupdate',
    onToggle: 'ontoggle',
    onUnload: 'onunload',
    onVolumeChange: 'onvolumechange',
    onWaiting: 'onwaiting',
    onZoom: 'onzoom',
    overlinePosition: 'overline-position',
    overlineThickness: 'overline-thickness',
    paintOrder: 'paint-order',
    panose1: 'panose-1',
    pointerEvents: 'pointer-events',
    referrerPolicy: 'referrerpolicy',
    renderingIntent: 'rendering-intent',
    shapeRendering: 'shape-rendering',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strikethroughPosition: 'strikethrough-position',
    strikethroughThickness: 'strikethrough-thickness',
    strokeDashArray: 'stroke-dasharray',
    strokeDashOffset: 'stroke-dashoffset',
    strokeLineCap: 'stroke-linecap',
    strokeLineJoin: 'stroke-linejoin',
    strokeMiterLimit: 'stroke-miterlimit',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    tabIndex: 'tabindex',
    textAnchor: 'text-anchor',
    textDecoration: 'text-decoration',
    textRendering: 'text-rendering',
    typeOf: 'typeof',
    underlinePosition: 'underline-position',
    underlineThickness: 'underline-thickness',
    unicodeBidi: 'unicode-bidi',
    unicodeRange: 'unicode-range',
    unitsPerEm: 'units-per-em',
    vAlphabetic: 'v-alphabetic',
    vHanging: 'v-hanging',
    vIdeographic: 'v-ideographic',
    vMathematical: 'v-mathematical',
    vectorEffect: 'vector-effect',
    vertAdvY: 'vert-adv-y',
    vertOriginX: 'vert-origin-x',
    vertOriginY: 'vert-origin-y',
    wordSpacing: 'word-spacing',
    writingMode: 'writing-mode',
    xHeight: 'x-height',
    // These were camelcased in Tiny. Now lowercased in SVG 2
    playbackOrder: 'playbackorder',
    timelineBegin: 'timelinebegin'
  },
  transform: caseSensitiveTransform,
  properties: {
    about: commaOrSpaceSeparated,
    accentHeight: number,
    accumulate: null,
    additive: null,
    alignmentBaseline: null,
    alphabetic: number,
    amplitude: number,
    arabicForm: null,
    ascent: number,
    attributeName: null,
    attributeType: null,
    azimuth: number,
    bandwidth: null,
    baselineShift: null,
    baseFrequency: null,
    baseProfile: null,
    bbox: null,
    begin: null,
    bias: number,
    by: null,
    calcMode: null,
    capHeight: number,
    className: spaceSeparated,
    clip: null,
    clipPath: null,
    clipPathUnits: null,
    clipRule: null,
    color: null,
    colorInterpolation: null,
    colorInterpolationFilters: null,
    colorProfile: null,
    colorRendering: null,
    content: null,
    contentScriptType: null,
    contentStyleType: null,
    crossOrigin: null,
    cursor: null,
    cx: null,
    cy: null,
    d: null,
    dataType: null,
    defaultAction: null,
    descent: number,
    diffuseConstant: number,
    direction: null,
    display: null,
    dur: null,
    divisor: number,
    dominantBaseline: null,
    download: boolean,
    dx: null,
    dy: null,
    edgeMode: null,
    editable: null,
    elevation: number,
    enableBackground: null,
    end: null,
    event: null,
    exponent: number,
    externalResourcesRequired: null,
    fill: null,
    fillOpacity: number,
    fillRule: null,
    filter: null,
    filterRes: null,
    filterUnits: null,
    floodColor: null,
    floodOpacity: null,
    focusable: null,
    focusHighlight: null,
    fontFamily: null,
    fontSize: null,
    fontSizeAdjust: null,
    fontStretch: null,
    fontStyle: null,
    fontVariant: null,
    fontWeight: null,
    format: null,
    fr: null,
    from: null,
    fx: null,
    fy: null,
    g1: commaSeparated,
    g2: commaSeparated,
    glyphName: commaSeparated,
    glyphOrientationHorizontal: null,
    glyphOrientationVertical: null,
    glyphRef: null,
    gradientTransform: null,
    gradientUnits: null,
    handler: null,
    hanging: number,
    hatchContentUnits: null,
    hatchUnits: null,
    height: null,
    href: null,
    hrefLang: null,
    horizAdvX: number,
    horizOriginX: number,
    horizOriginY: number,
    id: null,
    ideographic: number,
    imageRendering: null,
    initialVisibility: null,
    in: null,
    in2: null,
    intercept: number,
    k: number,
    k1: number,
    k2: number,
    k3: number,
    k4: number,
    kernelMatrix: commaOrSpaceSeparated,
    kernelUnitLength: null,
    keyPoints: null,
    // SEMI_COLON_SEPARATED
    keySplines: null,
    // SEMI_COLON_SEPARATED
    keyTimes: null,
    // SEMI_COLON_SEPARATED
    kerning: null,
    lang: null,
    lengthAdjust: null,
    letterSpacing: null,
    lightingColor: null,
    limitingConeAngle: number,
    local: null,
    markerEnd: null,
    markerMid: null,
    markerStart: null,
    markerHeight: null,
    markerUnits: null,
    markerWidth: null,
    mask: null,
    maskContentUnits: null,
    maskUnits: null,
    mathematical: null,
    max: null,
    media: null,
    mediaCharacterEncoding: null,
    mediaContentEncodings: null,
    mediaSize: number,
    mediaTime: null,
    method: null,
    min: null,
    mode: null,
    name: null,
    navDown: null,
    navDownLeft: null,
    navDownRight: null,
    navLeft: null,
    navNext: null,
    navPrev: null,
    navRight: null,
    navUp: null,
    navUpLeft: null,
    navUpRight: null,
    numOctaves: null,
    observer: null,
    offset: null,
    onAbort: null,
    onActivate: null,
    onAfterPrint: null,
    onBeforePrint: null,
    onBegin: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnd: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFocusIn: null,
    onFocusOut: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadStart: null,
    onMessage: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onMouseWheel: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRepeat: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onShow: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onZoom: null,
    opacity: null,
    operator: null,
    order: null,
    orient: null,
    orientation: null,
    origin: null,
    overflow: null,
    overlay: null,
    overlinePosition: number,
    overlineThickness: number,
    paintOrder: null,
    panose1: null,
    path: null,
    pathLength: number,
    patternContentUnits: null,
    patternTransform: null,
    patternUnits: null,
    phase: null,
    ping: spaceSeparated,
    pitch: null,
    playbackOrder: null,
    pointerEvents: null,
    points: null,
    pointsAtX: number,
    pointsAtY: number,
    pointsAtZ: number,
    preserveAlpha: null,
    preserveAspectRatio: null,
    primitiveUnits: null,
    propagate: null,
    property: commaOrSpaceSeparated,
    r: null,
    radius: null,
    referrerPolicy: null,
    refX: null,
    refY: null,
    rel: commaOrSpaceSeparated,
    rev: commaOrSpaceSeparated,
    renderingIntent: null,
    repeatCount: null,
    repeatDur: null,
    requiredExtensions: commaOrSpaceSeparated,
    requiredFeatures: commaOrSpaceSeparated,
    requiredFonts: commaOrSpaceSeparated,
    requiredFormats: commaOrSpaceSeparated,
    resource: null,
    restart: null,
    result: null,
    rotate: null,
    rx: null,
    ry: null,
    scale: null,
    seed: null,
    shapeRendering: null,
    side: null,
    slope: null,
    snapshotTime: null,
    specularConstant: number,
    specularExponent: number,
    spreadMethod: null,
    spacing: null,
    startOffset: null,
    stdDeviation: null,
    stemh: null,
    stemv: null,
    stitchTiles: null,
    stopColor: null,
    stopOpacity: null,
    strikethroughPosition: number,
    strikethroughThickness: number,
    string: null,
    stroke: null,
    strokeDashArray: commaOrSpaceSeparated,
    strokeDashOffset: null,
    strokeLineCap: null,
    strokeLineJoin: null,
    strokeMiterLimit: number,
    strokeOpacity: number,
    strokeWidth: null,
    style: null,
    surfaceScale: number,
    syncBehavior: null,
    syncBehaviorDefault: null,
    syncMaster: null,
    syncTolerance: null,
    syncToleranceDefault: null,
    systemLanguage: commaOrSpaceSeparated,
    tabIndex: number,
    tableValues: null,
    target: null,
    targetX: number,
    targetY: number,
    textAnchor: null,
    textDecoration: null,
    textRendering: null,
    textLength: null,
    timelineBegin: null,
    title: null,
    transformBehavior: null,
    type: null,
    typeOf: commaOrSpaceSeparated,
    to: null,
    transform: null,
    u1: null,
    u2: null,
    underlinePosition: number,
    underlineThickness: number,
    unicode: null,
    unicodeBidi: null,
    unicodeRange: null,
    unitsPerEm: number,
    values: null,
    vAlphabetic: number,
    vMathematical: number,
    vectorEffect: null,
    vHanging: number,
    vIdeographic: number,
    version: null,
    vertAdvY: number,
    vertOriginX: number,
    vertOriginY: number,
    viewBox: null,
    viewTarget: null,
    visibility: null,
    width: null,
    widths: null,
    wordSpacing: null,
    writingMode: null,
    x: null,
    x1: null,
    x2: null,
    xChannelSelector: null,
    xHeight: number,
    y: null,
    y1: null,
    y2: null,
    yChannelSelector: null,
    z: null,
    zoomAndPan: null
  }
});

/**
 * @typedef {import('./util/schema.js').Schema} Schema
 */
const valid = /^data[-\w.:]+$/i;
const dash = /-[a-z]/g;
const cap = /[A-Z]/g;
/**
 * @param {Schema} schema
 * @param {string} value
 * @returns {Info}
 */

function find(schema, value) {
  const normal = normalize(value);
  let prop = value;
  let Type = Info;

  if (normal in schema.normal) {
    return schema.property[schema.normal[normal]];
  }

  if (normal.length > 4 && normal.slice(0, 4) === 'data' && valid.test(value)) {
    // Attribute or property.
    if (value.charAt(4) === '-') {
      // Turn it into a property.
      const rest = value.slice(5).replace(dash, camelcase);
      prop = 'data' + rest.charAt(0).toUpperCase() + rest.slice(1);
    } else {
      // Turn it into an attribute.
      const rest = value.slice(4);

      if (!dash.test(rest)) {
        let dashes = rest.replace(cap, kebab);

        if (dashes.charAt(0) !== '-') {
          dashes = '-' + dashes;
        }

        value = 'data' + dashes;
      }
    }

    Type = DefinedInfo;
  }

  return new Type(prop, value);
}
/**
 * @param {string} $0
 * @returns {string}
 */

function kebab($0) {
  return '-' + $0.toLowerCase();
}
/**
 * @param {string} $0
 * @returns {string}
 */


function camelcase($0) {
  return $0.charAt(1).toUpperCase();
}

/**
 * @typedef {import('./lib/util/info.js').Info} Info
 * @typedef {import('./lib/util/schema.js').Schema} Schema
 */
const html$2 = merge([xml, xlink, xmlns, aria, html$3], 'html');
const svg = merge([xml, xlink, xmlns, aria, svg$1], 'svg');

/**
 * List of HTML void tag names.
 *
 * @type {Array<string>}
 */
const htmlVoidElements = ['area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed', 'frame', 'hr', 'image', 'img', 'input', 'isindex', 'keygen', 'link', 'menuitem', 'meta', 'nextid', 'param', 'source', 'track', 'wbr'];

/**
 * @typedef {import('../../types.js').Comment} Comment
 */
/** @type {import('unist-util-is').AssertPredicate<Comment>} */
// @ts-ignore

const comment$1 = convert$2('comment');

/**
 * @typedef {import('../../types.js').Parent} Parent
 * @typedef {import('../../types.js').Child} Child
 */
const siblingAfter = siblings(1);
const siblingBefore = siblings(-1);
/**
 * Factory to check siblings in a direction.
 *
 * @param {number} increment
 */

function siblings(increment) {
  return sibling;
  /**
   * Find applicable siblings in a direction.
   *
   * @param {Parent} parent
   * @param {number} index
   * @param {boolean} [includeWhitespace=false]
   * @returns {Child}
   */

  function sibling(parent, index, includeWhitespace) {
    const siblings = parent && parent.children;
    let offset = index + increment;
    let next = siblings && siblings[offset];

    if (!includeWhitespace) {
      while (next && whitespace(next)) {
        offset += increment;
        next = siblings[offset];
      }
    }

    return next;
  }
}

/**
 * @typedef {import('../../types.js').Node} Node
 * @typedef {import('../../types.js').Text} Text
 */
/** @type {import('unist-util-is').AssertPredicate<Text>} */
// @ts-ignore

const isText = convert$2('text');
/**
 * Check if `node` starts with whitespace.
 *
 * @param {Node} node
 * @returns {boolean}
 */

function whitespaceStart(node) {
  return isText(node) && whitespace(node.value.charAt(0));
}

/**
 * @typedef {import('../types.js').OmitHandle} OmitHandle
 */
const own$2 = {}.hasOwnProperty;
/**
 * Factory to check if a given node can have a tag omitted.
 *
 * @param {Object.<string, OmitHandle>} handlers
 * @returns {OmitHandle}
 */

function omission$1(handlers) {
  return omit;
  /**
   * Check if a given node can have a tag omitted.
   *
   * @type {OmitHandle}
   */

  function omit(node, index, parent) {
    return own$2.call(handlers, node.tagName) && handlers[node.tagName](node, index, parent);
  }
}

/**
 * @typedef {import('../types.js').OmitHandle} OmitHandle
 */
const closing = omission$1({
  html: html$1,
  head: headOrColgroupOrCaption,
  body: body$1,
  p,
  li,
  dt,
  dd,
  rt: rubyElement,
  rp: rubyElement,
  optgroup,
  option,
  menuitem,
  colgroup: headOrColgroupOrCaption,
  caption: headOrColgroupOrCaption,
  thead,
  tbody: tbody$1,
  tfoot,
  tr,
  td: cells,
  th: cells
});
/**
 * Macro for `</head>`, `</colgroup>`, and `</caption>`.
 *
 * @type {OmitHandle}
 */

function headOrColgroupOrCaption(_, index, parent) {
  const next = siblingAfter(parent, index, true);
  return !next || !comment$1(next) && !whitespaceStart(next);
}
/**
 * Whether to omit `</html>`.
 *
 * @type {OmitHandle}
 */


function html$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || !comment$1(next);
}
/**
 * Whether to omit `</body>`.
 *
 * @type {OmitHandle}
 */


function body$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || !comment$1(next);
}
/**
 * Whether to omit `</p>`.
 *
 * @type {OmitHandle}
 */


function p(_, index, parent) {
  const next = siblingAfter(parent, index);
  return next ? isElement$1(next, ['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul']) : !parent || // Confusing parent.
  !isElement$1(parent, ['a', 'audio', 'del', 'ins', 'map', 'noscript', 'video']);
}
/**
 * Whether to omit `</li>`.
 *
 * @type {OmitHandle}
 */


function li(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || isElement$1(next, 'li');
}
/**
 * Whether to omit `</dt>`.
 *
 * @type {OmitHandle}
 */


function dt(_, index, parent) {
  const next = siblingAfter(parent, index);
  return next && isElement$1(next, ['dt', 'dd']);
}
/**
 * Whether to omit `</dd>`.
 *
 * @type {OmitHandle}
 */


function dd(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || isElement$1(next, ['dt', 'dd']);
}
/**
 * Whether to omit `</rt>` or `</rp>`.
 *
 * @type {OmitHandle}
 */


function rubyElement(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || isElement$1(next, ['rp', 'rt']);
}
/**
 * Whether to omit `</optgroup>`.
 *
 * @type {OmitHandle}
 */


function optgroup(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || isElement$1(next, 'optgroup');
}
/**
 * Whether to omit `</option>`.
 *
 * @type {OmitHandle}
 */


function option(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || isElement$1(next, ['option', 'optgroup']);
}
/**
 * Whether to omit `</menuitem>`.
 *
 * @type {OmitHandle}
 */


function menuitem(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || isElement$1(next, ['menuitem', 'hr', 'menu']);
}
/**
 * Whether to omit `</thead>`.
 *
 * @type {OmitHandle}
 */


function thead(_, index, parent) {
  const next = siblingAfter(parent, index);
  return next && isElement$1(next, ['tbody', 'tfoot']);
}
/**
 * Whether to omit `</tbody>`.
 *
 * @type {OmitHandle}
 */


function tbody$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || isElement$1(next, ['tbody', 'tfoot']);
}
/**
 * Whether to omit `</tfoot>`.
 *
 * @type {OmitHandle}
 */


function tfoot(_, index, parent) {
  return !siblingAfter(parent, index);
}
/**
 * Whether to omit `</tr>`.
 *
 * @type {OmitHandle}
 */


function tr(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || isElement$1(next, 'tr');
}
/**
 * Whether to omit `</td>` or `</th>`.
 *
 * @type {OmitHandle}
 */


function cells(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || isElement$1(next, ['td', 'th']);
}

/**
 * @typedef {import('../types.js').OmitHandle} OmitHandle
 * @typedef {import('../types.js').Child} Child
 */
const opening = omission$1({
  html,
  head,
  body,
  colgroup,
  tbody
});
/**
 * Whether to omit `<html>`.
 *
 * @type {OmitHandle}
 */

function html(node) {
  const head = siblingAfter(node, -1);
  return !head || !comment$1(head);
}
/**
 * Whether to omit `<head>`.
 *
 * @type {OmitHandle}
 */


function head(node) {
  const children = node.children;
  /** @type {Array.<string>} */

  const seen = [];
  let index = -1;
  /** @type {Child} */

  let child;

  while (++index < children.length) {
    child = children[index];

    if (isElement$1(child, ['title', 'base'])) {
      if (seen.includes(child.tagName)) return false;
      seen.push(child.tagName);
    }
  }

  return children.length > 0;
}
/**
 * Whether to omit `<body>`.
 *
 * @type {OmitHandle}
 */


function body(node) {
  const head = siblingAfter(node, -1, true);
  return !head || !comment$1(head) && !whitespaceStart(head) && !isElement$1(head, ['meta', 'link', 'script', 'style', 'template']);
}
/**
 * Whether to omit `<colgroup>`.
 * The spec describes some logic for the opening tag, but it’s easier to
 * implement in the closing tag, to the same effect, so we handle it there
 * instead.
 *
 * @type {OmitHandle}
 */


function colgroup(node, index, parent) {
  const previous = siblingBefore(parent, index);
  const head = siblingAfter(node, -1, true); // Previous colgroup was already omitted.

  if (isElement$1(previous, 'colgroup') && closing(previous, parent.children.indexOf(previous), parent)) {
    return false;
  }

  return head && isElement$1(head, 'col');
}
/**
 * Whether to omit `<tbody>`.
 *
 * @type {OmitHandle}
 */


function tbody(node, index, parent) {
  const previous = siblingBefore(parent, index);
  const head = siblingAfter(node, -1); // Previous table section was already omitted.

  if (isElement$1(previous, ['thead', 'tbody']) && closing(previous, parent.children.indexOf(previous), parent)) {
    return false;
  }

  return head && isElement$1(head, 'tr');
}

/**
 * @typedef {import('../types.js').Omission} Omission
 */
/** @type {Omission} */

const omission = {
  opening,
  closing
};

/**
 * Parse space separated tokens to an array of strings.
 *
 * @param {string} value Space separated tokens
 * @returns {Array.<string>} Tokens
 */
/**
 * Serialize an array of strings as space separated tokens.
 *
 * @param {Array.<string|number>} values Tokens
 * @returns {string} Space separated tokens
 */

function stringify$1(values) {
  return values.join(' ').trim();
}

/**
 * @typedef {Object} StringifyOptions
 * @property {boolean} [padLeft=true] Whether to pad a space before a token (`boolean`, default: `true`).
 * @property {boolean} [padRight=false] Whether to pad a space after a token (`boolean`, default: `false`).
 */
/**
 * Serialize an array of strings to comma separated tokens.
 *
 * @param {Array.<string|number>} values
 * @param {StringifyOptions} [options]
 * @returns {string}
 */

function stringify(values, options) {
  var settings = options || {}; // Ensure the last empty entry is seen.

  if (values[values.length - 1] === '') {
    values = values.concat('');
  }

  return values.join((settings.padRight ? ' ' : '') + ',' + (settings.padLeft === false ? '' : ' ')).trim();
}

/**
 * @typedef {Object} CoreOptions
 * @property {string[]} [subset=[]]
 *   Whether to only escape the given subset of characters.
 * @property {boolean} [escapeOnly=false]
 *   Whether to only escape possibly dangerous characters.
 *   Those characters are `"`, `&`, `'`, `<`, `>`, and `` ` ``.
 *
 * @typedef {Object} FormatOptions
 * @property {(code: number, next: number, options: CoreWithFormatOptions) => string} format
 *   Format strategy.
 *
 * @typedef {CoreOptions & FormatOptions & import('./util/format-smart.js').FormatSmartOptions} CoreWithFormatOptions
 */

/**
 * Encode certain characters in `value`.
 *
 * @param {string} value
 * @param {CoreWithFormatOptions} options
 * @returns {string}
 */
function core(value, options) {
  value = value.replace(options.subset ? charactersToExpression(options.subset) : /["&'<>`]/g, basic);

  if (options.subset || options.escapeOnly) {
    return value;
  }

  return value // Surrogate pairs.
  .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, surrogate) // BMP control characters (C0 except for LF, CR, SP; DEL; and some more
  // non-ASCII ones).
  .replace( // eslint-disable-next-line no-control-regex, unicorn/no-hex-escape
  /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g, basic);
  /**
   * @param {string} pair
   * @param {number} index
   * @param {string} all
   */

  function surrogate(pair, index, all) {
    return options.format((pair.charCodeAt(0) - 0xd800) * 0x400 + pair.charCodeAt(1) - 0xdc00 + 0x10000, all.charCodeAt(index + 2), options);
  }
  /**
   * @param {string} character
   * @param {number} index
   * @param {string} all
   */


  function basic(character, index, all) {
    return options.format(character.charCodeAt(0), all.charCodeAt(index + 1), options);
  }
}
/**
 * @param {string[]} subset
 * @returns {RegExp}
 */

function charactersToExpression(subset) {
  /** @type {string[]} */
  const groups = [];
  let index = -1;

  while (++index < subset.length) {
    groups.push(subset[index].replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'));
  }

  return new RegExp('(?:' + groups.join('|') + ')', 'g');
}

/**
 * Configurable ways to encode characters as hexadecimal references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @returns {string}
 */
function toHexadecimal(code, next, omit) {
  const value = '&#x' + code.toString(16).toUpperCase();
  return omit && next && !/[\dA-Fa-f]/.test(String.fromCharCode(next)) ? value : value + ';';
}

/**
 * Configurable ways to encode characters as decimal references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @returns {string}
 */
function toDecimal(code, next, omit) {
  const value = '&#' + String(code);
  return omit && next && !/\d/.test(String.fromCharCode(next)) ? value : value + ';';
}

/**
 * List of legacy HTML named character references that don’t need a trailing semicolon.
 *
 * @type {Array<string>}
 */
const characterEntitiesLegacy = ['AElig', 'AMP', 'Aacute', 'Acirc', 'Agrave', 'Aring', 'Atilde', 'Auml', 'COPY', 'Ccedil', 'ETH', 'Eacute', 'Ecirc', 'Egrave', 'Euml', 'GT', 'Iacute', 'Icirc', 'Igrave', 'Iuml', 'LT', 'Ntilde', 'Oacute', 'Ocirc', 'Ograve', 'Oslash', 'Otilde', 'Ouml', 'QUOT', 'REG', 'THORN', 'Uacute', 'Ucirc', 'Ugrave', 'Uuml', 'Yacute', 'aacute', 'acirc', 'acute', 'aelig', 'agrave', 'amp', 'aring', 'atilde', 'auml', 'brvbar', 'ccedil', 'cedil', 'cent', 'copy', 'curren', 'deg', 'divide', 'eacute', 'ecirc', 'egrave', 'eth', 'euml', 'frac12', 'frac14', 'frac34', 'gt', 'iacute', 'icirc', 'iexcl', 'igrave', 'iquest', 'iuml', 'laquo', 'lt', 'macr', 'micro', 'middot', 'nbsp', 'not', 'ntilde', 'oacute', 'ocirc', 'ograve', 'ordf', 'ordm', 'oslash', 'otilde', 'ouml', 'para', 'plusmn', 'pound', 'quot', 'raquo', 'reg', 'sect', 'shy', 'sup1', 'sup2', 'sup3', 'szlig', 'thorn', 'times', 'uacute', 'ucirc', 'ugrave', 'uml', 'uuml', 'yacute', 'yen', 'yuml'];

/**
 * Map of named character references from HTML 4.
 *
 * @type {Record<string, string>}
 */
const characterEntitiesHtml4 = {
  nbsp: ' ',
  iexcl: '¡',
  cent: '¢',
  pound: '£',
  curren: '¤',
  yen: '¥',
  brvbar: '¦',
  sect: '§',
  uml: '¨',
  copy: '©',
  ordf: 'ª',
  laquo: '«',
  not: '¬',
  shy: '­',
  reg: '®',
  macr: '¯',
  deg: '°',
  plusmn: '±',
  sup2: '²',
  sup3: '³',
  acute: '´',
  micro: 'µ',
  para: '¶',
  middot: '·',
  cedil: '¸',
  sup1: '¹',
  ordm: 'º',
  raquo: '»',
  frac14: '¼',
  frac12: '½',
  frac34: '¾',
  iquest: '¿',
  Agrave: 'À',
  Aacute: 'Á',
  Acirc: 'Â',
  Atilde: 'Ã',
  Auml: 'Ä',
  Aring: 'Å',
  AElig: 'Æ',
  Ccedil: 'Ç',
  Egrave: 'È',
  Eacute: 'É',
  Ecirc: 'Ê',
  Euml: 'Ë',
  Igrave: 'Ì',
  Iacute: 'Í',
  Icirc: 'Î',
  Iuml: 'Ï',
  ETH: 'Ð',
  Ntilde: 'Ñ',
  Ograve: 'Ò',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Otilde: 'Õ',
  Ouml: 'Ö',
  times: '×',
  Oslash: 'Ø',
  Ugrave: 'Ù',
  Uacute: 'Ú',
  Ucirc: 'Û',
  Uuml: 'Ü',
  Yacute: 'Ý',
  THORN: 'Þ',
  szlig: 'ß',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  atilde: 'ã',
  auml: 'ä',
  aring: 'å',
  aelig: 'æ',
  ccedil: 'ç',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  euml: 'ë',
  igrave: 'ì',
  iacute: 'í',
  icirc: 'î',
  iuml: 'ï',
  eth: 'ð',
  ntilde: 'ñ',
  ograve: 'ò',
  oacute: 'ó',
  ocirc: 'ô',
  otilde: 'õ',
  ouml: 'ö',
  divide: '÷',
  oslash: 'ø',
  ugrave: 'ù',
  uacute: 'ú',
  ucirc: 'û',
  uuml: 'ü',
  yacute: 'ý',
  thorn: 'þ',
  yuml: 'ÿ',
  fnof: 'ƒ',
  Alpha: 'Α',
  Beta: 'Β',
  Gamma: 'Γ',
  Delta: 'Δ',
  Epsilon: 'Ε',
  Zeta: 'Ζ',
  Eta: 'Η',
  Theta: 'Θ',
  Iota: 'Ι',
  Kappa: 'Κ',
  Lambda: 'Λ',
  Mu: 'Μ',
  Nu: 'Ν',
  Xi: 'Ξ',
  Omicron: 'Ο',
  Pi: 'Π',
  Rho: 'Ρ',
  Sigma: 'Σ',
  Tau: 'Τ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Chi: 'Χ',
  Psi: 'Ψ',
  Omega: 'Ω',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigmaf: 'ς',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  thetasym: 'ϑ',
  upsih: 'ϒ',
  piv: 'ϖ',
  bull: '•',
  hellip: '…',
  prime: '′',
  Prime: '″',
  oline: '‾',
  frasl: '⁄',
  weierp: '℘',
  image: 'ℑ',
  real: 'ℜ',
  trade: '™',
  alefsym: 'ℵ',
  larr: '←',
  uarr: '↑',
  rarr: '→',
  darr: '↓',
  harr: '↔',
  crarr: '↵',
  lArr: '⇐',
  uArr: '⇑',
  rArr: '⇒',
  dArr: '⇓',
  hArr: '⇔',
  forall: '∀',
  part: '∂',
  exist: '∃',
  empty: '∅',
  nabla: '∇',
  isin: '∈',
  notin: '∉',
  ni: '∋',
  prod: '∏',
  sum: '∑',
  minus: '−',
  lowast: '∗',
  radic: '√',
  prop: '∝',
  infin: '∞',
  ang: '∠',
  and: '∧',
  or: '∨',
  cap: '∩',
  cup: '∪',
  int: '∫',
  there4: '∴',
  sim: '∼',
  cong: '≅',
  asymp: '≈',
  ne: '≠',
  equiv: '≡',
  le: '≤',
  ge: '≥',
  sub: '⊂',
  sup: '⊃',
  nsub: '⊄',
  sube: '⊆',
  supe: '⊇',
  oplus: '⊕',
  otimes: '⊗',
  perp: '⊥',
  sdot: '⋅',
  lceil: '⌈',
  rceil: '⌉',
  lfloor: '⌊',
  rfloor: '⌋',
  lang: '〈',
  rang: '〉',
  loz: '◊',
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diams: '♦',
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  OElig: 'Œ',
  oelig: 'œ',
  Scaron: 'Š',
  scaron: 'š',
  Yuml: 'Ÿ',
  circ: 'ˆ',
  tilde: '˜',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  zwnj: '‌',
  zwj: '‍',
  lrm: '‎',
  rlm: '‏',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  dagger: '†',
  Dagger: '‡',
  permil: '‰',
  lsaquo: '‹',
  rsaquo: '›',
  euro: '€'
};

/**
 * List of legacy (that don’t need a trailing `;`) named references which could,
 * depending on what follows them, turn into a different meaning
 *
 * @type {Array.<string>}
 */
const dangerous = ['cent', 'copy', 'divide', 'gt', 'lt', 'not', 'para', 'times'];

const own$1 = {}.hasOwnProperty;
/**
 * `characterEntitiesHtml4` but inverted.
 *
 * @type {Object.<string, string>}
 */

const characters = {};
/** @type {string} */

let key;

for (key in characterEntitiesHtml4) {
  if (own$1.call(characterEntitiesHtml4, key)) {
    characters[characterEntitiesHtml4[key]] = key;
  }
}
/**
 * Configurable ways to encode characters as named references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @param {boolean|undefined} attribute
 * @returns {string}
 */


function toNamed(code, next, omit, attribute) {
  const character = String.fromCharCode(code);

  if (own$1.call(characters, character)) {
    const name = characters[character];
    const value = '&' + name;

    if (omit && characterEntitiesLegacy.includes(name) && !dangerous.includes(name) && (!attribute || next && next !== 61
    /* `=` */
    && /[^\da-z]/i.test(String.fromCharCode(next)))) {
      return value;
    }

    return value + ';';
  }

  return '';
}

/**
 * @typedef {Object} FormatSmartOptions
 * @property {boolean} [useNamedReferences=false]
 *   Prefer named character references (`&amp;`) where possible.
 * @property {boolean} [useShortestReferences=false]
 *   Prefer the shortest possible reference, if that results in less bytes.
 *   **Note**: `useNamedReferences` can be omitted when using `useShortestReferences`.
 * @property {boolean} [omitOptionalSemicolons=false]
 *   Whether to omit semicolons when possible.
 *   **Note**: This creates what HTML calls “parse errors” but is otherwise still valid HTML — don’t use this except when building a minifier.
 *   Omitting semicolons is possible for certain named and numeric references in some cases.
 * @property {boolean} [attribute=false]
 *   Create character references which don’t fail in attributes.
 *   **Note**: `attribute` only applies when operating dangerously with
 *   `omitOptionalSemicolons: true`.
 */
/**
 * Configurable ways to encode a character yielding pretty or small results.
 *
 * @param {number} code
 * @param {number} next
 * @param {FormatSmartOptions} options
 * @returns {string}
 */

function formatSmart(code, next, options) {
  let numeric = toHexadecimal(code, next, options.omitOptionalSemicolons);
  /** @type {string|undefined} */

  let named;

  if (options.useNamedReferences || options.useShortestReferences) {
    named = toNamed(code, next, options.omitOptionalSemicolons, options.attribute);
  } // Use the shortest numeric reference when requested.
  // A simple algorithm would use decimal for all code points under 100, as
  // those are shorter than hexadecimal:
  //
  // * `&#99;` vs `&#x63;` (decimal shorter)
  // * `&#100;` vs `&#x64;` (equal)
  //
  // However, because we take `next` into consideration when `omit` is used,
  // And it would be possible that decimals are shorter on bigger values as
  // well if `next` is hexadecimal but not decimal, we instead compare both.


  if ((options.useShortestReferences || !named) && options.useShortestReferences) {
    const decimal = toDecimal(code, next, options.omitOptionalSemicolons);

    if (decimal.length < numeric.length) {
      numeric = decimal;
    }
  }

  return named && (!options.useShortestReferences || named.length < numeric.length) ? named : numeric;
}

/**
 * @typedef {import('./core.js').CoreOptions & import('./util/format-smart.js').FormatSmartOptions} Options
 * @typedef {import('./core.js').CoreOptions} LightOptions
 */
/**
 * Encode special characters in `value`.
 *
 * @param {string} value
 *   Value to encode.
 * @param {Options} [options]
 *   Configuration.
 * @returns {string}
 *   Encoded value.
 */

function stringifyEntities(value, options) {
  return core(value, Object.assign({
    format: formatSmart
  }, options));
}

/**
 * Count how often a character (or substring) is used in a string.
 *
 * @param {string} value
 *   Value to search in.
 * @param {string} character
 *   Character (or substring) to look for.
 * @return {number}
 *   Number of times `character` occurred in `value`.
 */
function ccount(value, character) {
  const source = String(value);

  if (typeof character !== 'string') {
    throw new TypeError('Expected character');
  }

  let count = 0;
  let index = source.indexOf(character);

  while (index !== -1) {
    count++;
    index = source.indexOf(character, index + character.length);
  }

  return count;
}

// Maps of subsets.
// Each value is a matrix of tuples.
// The first value causes parse errors, the second is valid.
// Of both values, the first value is unsafe, and the second is safe.
const constants = {
  // See: <https://html.spec.whatwg.org/#attribute-name-state>.
  name: [['\t\n\f\r &/=>'.split(''), '\t\n\f\r "&\'/=>`'.split('')], ['\0\t\n\f\r "&\'/<=>'.split(''), '\0\t\n\f\r "&\'/<=>`'.split('')]],
  // See: <https://html.spec.whatwg.org/#attribute-value-(unquoted)-state>.
  unquoted: [['\t\n\f\r &>'.split(''), '\0\t\n\f\r "&\'<=>`'.split('')], ['\0\t\n\f\r "&\'<=>`'.split(''), '\0\t\n\f\r "&\'<=>`'.split('')]],
  // See: <https://html.spec.whatwg.org/#attribute-value-(single-quoted)-state>.
  single: [["&'".split(''), '"&\'`'.split('')], ["\0&'".split(''), '\0"&\'`'.split('')]],
  // See: <https://html.spec.whatwg.org/#attribute-value-(double-quoted)-state>.
  double: [['"&'.split(''), '"&\'`'.split('')], ['\0"&'.split(''), '\0"&\'`'.split('')]]
};

/**
 * @typedef {import('./types.js').Handle} Handle
 * @typedef {import('./types.js').Comment} Comment
 */
/**
 * @type {Handle}
 * @param {Comment} node
 */

function comment(ctx, node) {
  // See: <https://html.spec.whatwg.org/multipage/syntax.html#comments>
  return ctx.bogusComments ? '<?' + stringifyEntities(node.value, Object.assign({}, ctx.entities, {
    subset: ['>']
  })) + '>' : '<!--' + node.value.replace(/^>|^->|<!--|-->|--!>|<!-$/g, encode) + '-->';
  /**
   * @param {string} $0
   */

  function encode($0) {
    return stringifyEntities($0, Object.assign({}, ctx.entities, {
      subset: ['<', '>']
    }));
  }
}

/**
 * @typedef {import('./types.js').Handle} Handle
 */

/**
 * @type {Handle}
 */
function doctype(ctx) {
  return '<!' + (ctx.upperDoctype ? 'DOCTYPE' : 'doctype') + (ctx.tightDoctype ? '' : ' ') + 'html>';
}

/**
 * @typedef {import('./types.js').Handle} Handle
 * @typedef {import('./types.js').Text} Text
 */
/**
 * @type {Handle}
 * @param {Text} node
 */

function text(ctx, node, _, parent) {
  // Check if content of `node` should be escaped.
  return parent && parent.type === 'element' && ( // @ts-expect-error: hush.
  parent.tagName === 'script' || parent.tagName === 'style') ? node.value : stringifyEntities(node.value, Object.assign({}, ctx.entities, {
    subset: ['<', '&']
  }));
}

/**
 * @typedef {import('./types.js').Handle} Handle
 * @typedef {import('./types.js').Raw} Raw
 */
/**
 * @type {Handle}
 * @param {Raw} node
 */

function raw(ctx, node, index, parent) {
  // @ts-ignore Hush.
  return ctx.dangerous ? node.value : text(ctx, node, index, parent);
}

/**
 * @typedef {import('./types.js').Handle} Handle
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').Context} Context
 * @typedef {import('./types.js').Properties} Properties
 * @typedef {import('./types.js').PropertyValue} PropertyValue
 * @typedef {import('./types.js').Parent} Parent
 */
/**
 * @type {Object.<string, Handle>}
 */

const handlers = {
  comment,
  doctype,
  element,
  // @ts-ignore `raw` is nonstandard
  raw,
  // @ts-ignore `root` is a parent.
  root: all,
  text
};
const own = {}.hasOwnProperty;
/**
 * @type {Handle}
 */

function one(ctx, node, index, parent) {
  if (!node || !node.type) {
    throw new Error('Expected node, not `' + node + '`');
  }

  if (!own.call(handlers, node.type)) {
    throw new Error('Cannot compile unknown node `' + node.type + '`');
  }

  return handlers[node.type](ctx, node, index, parent);
}
/**
 * Serialize all children of `parent`.
 *
 * @type {Handle}
 * @param {Parent} parent
 */

function all(ctx, parent) {
  /** @type {Array.<string>} */
  const results = [];
  const children = parent && parent.children || [];
  let index = -1;

  while (++index < children.length) {
    results[index] = one(ctx, children[index], index, parent);
  }

  return results.join('');
}
/**
 * @type {Handle}
 * @param {Element} node
 */
// eslint-disable-next-line complexity

function element(ctx, node, index, parent) {
  const schema = ctx.schema;
  const omit = schema.space === 'svg' ? undefined : ctx.omit;
  let selfClosing = schema.space === 'svg' ? ctx.closeEmpty : ctx.voids.includes(node.tagName.toLowerCase());
  /** @type {Array.<string>} */

  const parts = [];
  /** @type {string} */

  let last;

  if (schema.space === 'html' && node.tagName === 'svg') {
    ctx.schema = svg;
  }

  const attrs = serializeAttributes(ctx, node.properties);
  const content = all(ctx, schema.space === 'html' && node.tagName === 'template' ? node.content : node);
  ctx.schema = schema; // If the node is categorised as void, but it has children, remove the
  // categorisation.
  // This enables for example `menuitem`s, which are void in W3C HTML but not
  // void in WHATWG HTML, to be stringified properly.

  if (content) selfClosing = false;

  if (attrs || !omit || !omit.opening(node, index, parent)) {
    parts.push('<', node.tagName, attrs ? ' ' + attrs : '');

    if (selfClosing && (schema.space === 'svg' || ctx.close)) {
      last = attrs.charAt(attrs.length - 1);

      if (!ctx.tightClose || last === '/' || last && last !== '"' && last !== "'") {
        parts.push(' ');
      }

      parts.push('/');
    }

    parts.push('>');
  }

  parts.push(content);

  if (!selfClosing && (!omit || !omit.closing(node, index, parent))) {
    parts.push('</' + node.tagName + '>');
  }

  return parts.join('');
}
/**
 * @param {Context} ctx
 * @param {Properties} props
 * @returns {string}
 */

function serializeAttributes(ctx, props) {
  /** @type {Array.<string>} */
  const values = [];
  let index = -1;
  /** @type {string} */

  let key;
  /** @type {string} */

  let value;
  /** @type {string} */

  let last;

  for (key in props) {
    if (props[key] !== undefined && props[key] !== null) {
      value = serializeAttribute(ctx, key, props[key]);
      if (value) values.push(value);
    }
  }

  while (++index < values.length) {
    last = ctx.tight ? values[index].charAt(values[index].length - 1) : null; // In tight mode, don’t add a space after quoted attributes.

    if (index !== values.length - 1 && last !== '"' && last !== "'") {
      values[index] += ' ';
    }
  }

  return values.join('');
}
/**
 * @param {Context} ctx
 * @param {string} key
 * @param {PropertyValue} value
 * @returns {string}
 */
// eslint-disable-next-line complexity


function serializeAttribute(ctx, key, value) {
  const info = find(ctx.schema, key);
  let quote = ctx.quote;
  /** @type {string} */

  let result;

  if (info.overloadedBoolean && (value === info.attribute || value === '')) {
    value = true;
  } else if (info.boolean || info.overloadedBoolean && typeof value !== 'string') {
    value = Boolean(value);
  }

  if (value === undefined || value === null || value === false || typeof value === 'number' && Number.isNaN(value)) {
    return '';
  }

  const name = stringifyEntities(info.attribute, Object.assign({}, ctx.entities, {
    // Always encode without parse errors in non-HTML.
    subset: constants.name[ctx.schema.space === 'html' ? ctx.valid : 1][ctx.safe]
  })); // No value.
  // There is currently only one boolean property in SVG: `[download]` on
  // `<a>`.
  // This property does not seem to work in browsers (FF, Sa, Ch), so I can’t
  // test if dropping the value works.
  // But I assume that it should:
  //
  // ```html
  // <!doctype html>
  // <svg viewBox="0 0 100 100">
  //   <a href=https://example.com download>
  //     <circle cx=50 cy=40 r=35 />
  //   </a>
  // </svg>
  // ```
  //
  // See: <https://github.com/wooorm/property-information/blob/main/lib/svg.js>

  if (value === true) return name;
  value = typeof value === 'object' && 'length' in value ? // `spaces` doesn’t accept a second argument, but it’s given here just to
  // keep the code cleaner.
  (info.commaSeparated ? stringify : stringify$1)(value, {
    padLeft: !ctx.tightLists
  }) : String(value);
  if (ctx.collapseEmpty && !value) return name; // Check unquoted value.

  if (ctx.unquoted) {
    result = stringifyEntities(value, Object.assign({}, ctx.entities, {
      subset: constants.unquoted[ctx.valid][ctx.safe],
      attribute: true
    }));
  } // If we don’t want unquoted, or if `value` contains character references when
  // unquoted…


  if (result !== value) {
    // If the alternative is less common than `quote`, switch.
    if (ctx.smart && ccount(value, quote) > ccount(value, ctx.alternative)) {
      quote = ctx.alternative;
    }

    result = quote + stringifyEntities(value, Object.assign({}, ctx.entities, {
      // Always encode without parse errors in non-HTML.
      subset: (quote === "'" ? constants.single : constants.double)[ctx.schema.space === 'html' ? ctx.valid : 1][ctx.safe],
      attribute: true
    })) + quote;
  } // Don’t add a `=` for unquoted empties.


  return name + (result ? '=' + result : result);
}

/**
 * @typedef {import('./types.js').Node} Node
 * @typedef {import('./types.js').Options} Options
 * @typedef {import('./types.js').Context} Context
 * @typedef {import('./types.js').Quote} Quote
 */
/**
 * @param {Node|Array.<Node>} node
 * @param {Options} [options]
 * @returns {string}
 */

function toHtml(node, options = {}) {
  const quote = options.quote || '"';
  /** @type {Quote} */

  const alternative = quote === '"' ? "'" : '"';

  if (quote !== '"' && quote !== "'") {
    throw new Error('Invalid quote `' + quote + '`, expected `\'` or `"`');
  }
  /** @type {Context} */


  const context = {
    valid: options.allowParseErrors ? 0 : 1,
    safe: options.allowDangerousCharacters ? 0 : 1,
    schema: options.space === 'svg' ? svg : html$2,
    omit: options.omitOptionalTags ? omission : undefined,
    quote,
    alternative,
    smart: options.quoteSmart,
    unquoted: options.preferUnquoted,
    tight: options.tightAttributes,
    upperDoctype: options.upperDoctype,
    tightDoctype: options.tightDoctype,
    bogusComments: options.bogusComments,
    tightLists: options.tightCommaSeparatedLists,
    tightClose: options.tightSelfClosing,
    collapseEmpty: options.collapseEmptyAttributes,
    dangerous: options.allowDangerousHtml,
    voids: options.voids || htmlVoidElements.concat(),
    entities: options.entities || {},
    close: options.closeSelfClosing,
    closeEmpty: options.closeEmptyElements
  };
  return one(context, // @ts-ignore Assume `node` does not contain a root.
  Array.isArray(node) ? {
    type: 'root',
    children: node
  } : node, null, null);
}

/**
 * @typedef {import('hast').Root} Root
 * @typedef {Root|Root['children'][number]} Node
 * @typedef {import('hast-util-to-html').Options} Options
 */
/** @type {import('unified').Plugin<[Options?]|Array<void>, Node, string>} */

function rehypeStringify(config) {
  const processorSettings =
  /** @type {Options} */
  this.data('settings');
  const settings = Object.assign({}, processorSettings, config);
  Object.assign(this, {
    Compiler: compiler
  });
  /**
   * @type {import('unified').CompilerFunction<Node, string>}
   */

  function compiler(tree) {
    return toHtml(tree, settings);
  }
}

const defaultOptions = {
    allowDangerousHtml: false,
    markdownit: {},
    extensions: {
        frontmatter: true,
        math: true,
        footnotes: true,
        deflist: true,
        tasklist: true,
        tables: true,
        blocks: true,
    },
    transform: {},
    docutils: {
        roles: rolesDefault,
        directives: directivesDefault,
    },
    mdast: {},
    hast: {
        clobberPrefix: 'm-',
    },
    formatHtml: true,
    stringifyHtml: {},
};
class MyST {
    constructor(opts = defaultOptions) {
        this.opts = this._parseOptions(opts);
        this.tokenizer = this._createTokenizer();
    }
    _parseOptions(user) {
        var _a, _b, _c, _d;
        const opts = {
            allowDangerousHtml: (_a = user.allowDangerousHtml) !== null && _a !== void 0 ? _a : defaultOptions.allowDangerousHtml,
            transform: Object.assign(Object.assign({}, defaultOptions.transform), user.transform),
            mdast: Object.assign(Object.assign({}, defaultOptions.mdast), user.mdast),
            hast: Object.assign(Object.assign({}, defaultOptions.hast), user.hast),
            docutils: Object.assign(Object.assign({}, defaultOptions.docutils), user.docutils),
            markdownit: Object.assign(Object.assign({}, defaultOptions.markdownit), user.markdownit),
            extensions: Object.assign(Object.assign({}, defaultOptions.extensions), user.extensions),
            formatHtml: (_b = user.formatHtml) !== null && _b !== void 0 ? _b : defaultOptions.formatHtml,
            stringifyHtml: Object.assign(Object.assign({}, defaultOptions.stringifyHtml), user.stringifyHtml),
        };
        const rolesHandlers = {};
        const directivesHandlers = {};
        const mdastHandlers = {};
        const hastHandlers = {};
        Object.entries((_c = user.roles) !== null && _c !== void 0 ? _c : {}).map(([k, { myst, mdast, hast }]) => {
            rolesHandlers[k] = myst;
            mdastHandlers[k] = mdast;
            hastHandlers[mdast.type] = hast;
        });
        Object.entries((_d = user.directives) !== null && _d !== void 0 ? _d : {}).map(([k, { myst, mdast, hast }]) => {
            directivesHandlers[k] = myst;
            mdastHandlers[k] = mdast;
            hastHandlers[mdast.type] = hast;
        });
        opts.docutils.roles = Object.assign(Object.assign({}, opts.docutils.roles), rolesHandlers);
        opts.docutils.directives = Object.assign(Object.assign({}, opts.docutils.directives), directivesHandlers);
        opts.hast.handlers = Object.assign(Object.assign({}, opts.hast.handlers), hastHandlers);
        opts.mdast.handlers = Object.assign(Object.assign({}, opts.mdast.handlers), mdastHandlers);
        if (opts.allowDangerousHtml) {
            opts.markdownit.html = true;
            opts.hast.allowDangerousHtml = true;
            opts.hast.allowDangerousHtml = true;
            opts.stringifyHtml.allowDangerousHtml = true;
        }
        return opts;
    }
    _createTokenizer() {
        const exts = this.opts.extensions;
        const tokenizer = markdownIt('commonmark', this.opts.markdownit);
        if (exts.tables)
            tokenizer.enable('table');
        if (exts.frontmatter)
            tokenizer.use(markdownItFrontMatter, () => ({})).use(convertFrontMatter);
        if (exts.blocks)
            tokenizer.use(mystBlockPlugin);
        if (exts.footnotes)
            tokenizer.use(markdownItFootnote).disable('footnote_inline'); // not yet implemented in myst-parser
        tokenizer.use(docutilsPlugin, this.opts.docutils);
        if (exts.math)
            tokenizer.use(plugin, exts.math);
        if (exts.deflist)
            tokenizer.use(markdownItDeflist);
        if (exts.tasklist)
            tokenizer.use(markdownItTaskLists);
        return tokenizer;
    }
    parse(content) {
        return tokensToMyst(this.tokenizer.parse(content, {}), this.opts.mdast);
    }
    render(content) {
        const tree = this.parse(content);
        const html = this.renderMdast(tree);
        return html;
    }
    renderMdast(tree) {
        const state = new State();
        const pipe = unified()
            .use(transform, state, this.opts.transform)
            .use(mystToHast, this.opts.hast)
            .use(formatHtml, this.opts.formatHtml)
            .use(rehypeStringify, this.opts.stringifyHtml);
        const result = pipe.runSync(tree);
        const html = pipe.stringify(result);
        return html.trim();
    }
}
/**
 * MyST Parser as a Unified Plugin
 */
const mystParser = function mystParser() {
    this.Parser = (content, opts) => {
        return new MyST(opts).parse(content);
    };
};

export { AdmonitionKind, Directive, MarkdownParseState, MyST, ReferenceKind, Role, State, TargetKind, countState, defaultOptions, options as directiveOptions, directivesDefault, formatHtml, getFrontmatter, mystParser, mystToHast, plugins, referenceState, rolesDefault, tokensToMyst, transform };
//# sourceMappingURL=index.esm.js.map
