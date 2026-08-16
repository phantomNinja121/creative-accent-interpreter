/* Build an editable Word doc of every string in copy.js.
   Keys are printed alongside each string so edits round-trip back exactly. */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, PageOrientation
} = require('docx');

const SRC = fs.readFileSync(__dirname + '/copy.js', 'utf8');

/* ---- parse copy.js: sections in order, then key/value pairs ---- */
const sectionRe = /\/\*\s*-+\s*(.+?)\s*-+\s*\*\//g;
const sections = [];
let m;
while ((m = sectionRe.exec(SRC)) !== null) {
  sections.push({ index: m.index, title: m[1] });
}

const pairRe = /"([\w.]+)"\s*:\s*("(?:[^"\\]|\\.)*")/g;
const entries = [];
while ((m = pairRe.exec(SRC)) !== null) {
  const sec = sections.filter(s => s.index < m.index).pop();
  entries.push({
    key: m[1],
    value: JSON.parse(m[2]),
    section: sec ? sec.title : 'other'
  });
}

/* ---- group ---- */
const grouped = [];
entries.forEach(e => {
  let g = grouped[grouped.length - 1];
  if (!g || g.title !== e.section) { g = { title: e.section, rows: [] }; grouped.push(g); }
  g.rows.push(e);
});

const PRETTY = {
  'app chrome': 'App chrome: header, steps, buttons',
  '1. overview': 'Screen 1: Overview',
  '2. aesthetics': 'Screen 2: Aesthetics',
  '3. voice': 'Screen 3: Voice',
  '4. avatar': 'Screen 4: Avatar',
  '5. card screen': 'Screen 5: Card',
  'the downloadable PNG': 'The downloadable PNG card',
  'the text brief': 'The text brief',
  'messages': 'Pop-up messages'
};
const pretty = t => PRETTY[t] || t;

/* ---- doc pieces ---- */
const KEY_W = 2600, TXT_W = 7480, TABLE_W = KEY_W + TXT_W;
const INK = '0E1626', SOFT = '4B5B72', LINE = 'D9E4F3', HEADBG = 'EAF2FE';

const thinBorder = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: LINE },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  left:   { style: BorderStyle.SINGLE, size: 4, color: LINE },
  right:  { style: BorderStyle.SINGLE, size: 4, color: LINE }
};

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: opts.before || 0, after: opts.after === undefined ? 60 : opts.after },
    alignment: opts.align,
    children: [new TextRun({
      text,
      bold: opts.bold,
      italics: opts.italics,
      size: opts.size || 20,
      color: opts.color || INK,
      font: opts.font
    })]
  });
}

function noteFlags(v) {
  const f = [];
  if (/<[a-z]/i.test(v)) f.push('keep the <b> and <em> tags where they are');
  if (/\{n\}|\{total\}/.test(v)) f.push('keep {n} and {total} exactly as written');
  return f;
}

function headerRow() {
  return new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: KEY_W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: HEADBG, color: 'auto' },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [p('ID (do not change)', { bold: true, size: 16, color: SOFT })]
      }),
      new TableCell({
        width: { size: TXT_W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: HEADBG, color: 'auto' },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [p('TEXT (edit this column)', { bold: true, size: 16, color: SOFT })]
      })
    ]
  });
}

function bodyRow(e) {
  const flags = noteFlags(e.value);
  const keyCell = [p(e.key, { size: 16, color: SOFT, font: 'Consolas', after: flags.length ? 40 : 0 })];
  flags.forEach(f => keyCell.push(p(f, { size: 14, italics: true, color: 'B0432A', after: 0 })));
  return new TableRow({
    children: [
      new TableCell({
        width: { size: KEY_W, type: WidthType.DXA },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: keyCell
      }),
      new TableCell({
        width: { size: TXT_W, type: WidthType.DXA },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [p(e.value, { size: 21, after: 0 })]
      })
    ]
  });
}

const children = [];

children.push(new Paragraph({
  spacing: { after: 80 },
  children: [new TextRun({ text: 'Creative Accent Interpreter', bold: true, size: 40, color: INK })]
}));
children.push(p('Every word in the app. Edit the right-hand column only.', { size: 22, color: SOFT, after: 240 }));

children.push(p('How this works', { bold: true, size: 22, after: 80 }));
[
  'Change any text in the right column. Leave the left column alone: those IDs are how the text gets put back into the app.',
  'If a row is flagged in red, keep the marked bits exactly as they are. Everything around them is fair game.',
  'To delete a line entirely, clear the text and write DELETE in the cell.',
  'To add a comment for me rather than change the text, use Word comments or write NOTE: at the end of the cell.',
  'Send the file back and I will rebuild the app from it.'
].forEach(line => children.push(new Paragraph({
  spacing: { after: 60 },
  bullet: { level: 0 },
  children: [new TextRun({ text: line, size: 20, color: SOFT })]
})));

children.push(p('', { after: 200 }));

grouped.forEach(g => {
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 140 },
    children: [new TextRun({ text: pretty(g.title), bold: true, size: 26, color: INK })]
  }));
  children.push(new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: [KEY_W, TXT_W],
    borders: thinBorder,
    rows: [headerRow()].concat(g.rows.map(bodyRow))
  }));
});

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Aptos', size: 21, color: INK } } }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 }
      }
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(__dirname + '/Creative Accent Interpreter - Copy.docx', buf);
  console.log('rows:', entries.length, 'sections:', grouped.length);
});
