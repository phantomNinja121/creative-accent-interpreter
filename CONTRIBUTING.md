# Notes for future me

This repo is a teaching tool, not an open source project. Pull requests are not
expected. These notes are here so the next person to touch it, including a
future version of you, can pick it up quickly.

## The one rule

**All text lives in `copy.js`.** Nothing else in the app contains words a
student reads. If you find yourself typing a sentence into `index.html`, stop
and add a key to `copy.js` instead. Breaking this rule is how the Word round
trip stops working.

## Changing words

Either edit `copy.js` directly, or use the Word round trip:

```bash
# 1. edit "Creative Accent Interpreter - Copy.docx" in Word, right column only
python3 apply-copy-doc.py "Creative Accent Interpreter - Copy.docx"
node make-copy-doc.js      # regenerate the doc so it matches
node verify.js             # confirm nothing broke
```

`apply-copy-doc.py` matches on the ID in the left column, so rows can be
reordered freely. `DELETE` in a cell removes the string. Text after `NOTE:` is
stripped out and printed for you to read.

If you delete a string, also delete the element that referenced it in
`index.html`, or the app will render `[some.key]` where the text used to be.

## Changing the look

Colors and type are CSS custom properties in the `:root` block at the top of
`index.html`. The three section accents:

```css
--coral:#E15A3C;   /* aesthetics */
--green:#00A97A;   /* voice */
--blue:#2C7FEF;    /* avatar */
```

If you change those, update `STEP_COLORS` in the script too, and regenerate
`og-image.png` and the icons.

## Changing the card

`drawCard()` is plain Canvas 2D, no library. Coordinates are laid out top to
bottom in source order, so adding a row usually means bumping the `y` values
below it. The canvas is 1600x1120; everything is in real pixels.

## Testing

```bash
node verify.js
```

Walks the whole flow in headless Chromium, fills every field, uploads a test
avatar, prints the text brief, checks the See it all mode, regenerates
`preview.png`, and reports any console errors. Run it after any change.

## Things deliberately left out

- Level of abstraction as a fifth dial.
- A color scheme dial, binary to full spectrum.
- Shading as an aesthetics field.
- A square export for social.
- Draw-in-browser avatar sketching.
