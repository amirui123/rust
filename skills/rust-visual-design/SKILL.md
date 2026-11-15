---
name: rust-visual-design
description: Make deliberate visual design decisions for Rust interfaces and artwork, in terminals (ratatui), desktop GUIs (egui, iced), GPU output (wgpu), and static art (PNG, SVG). Covers subject-grounded direction, palette construction, contrast maths, type and spacing scales, and an anti-generic checklist. Use when asked for something that should look beautiful or distinctive, or when reviewing the look of an existing Rust UI.
---

# Visual design for Rust projects

The aim is a look that belongs to this project, made of deliberate choices. A default theme,
the usual blue accent, and a row of equal cards are not a design. They are what the framework
gives you when nobody decided anything.

## Step 1: ground the design in the subject

Before choosing a colour, answer:

- **What is this?** A log viewer, a synth, a finance dashboard, a children's reading app, a
  poster for a film night?
- **Who uses it, and when?** Late at night, in daylight, on a 13-inch laptop, on a wall screen?
- **What is its main job?** Reading, watching, editing, comparing?

The subject's world supplies the material. A monitoring tool for ships can borrow from charts
and instruments. A poetry generator can borrow from paper and ink. Write the answer down in one
paragraph. Every later choice should trace back to it.

If the brief gives no subject, propose one, state it, and continue.

## Step 2: build the palette

1. Start with one **signature colour**. It should not be the framework's default blue.
2. Build a five-step scale from it: a near-background, a surface, a muted text colour, the
   signature, and a bright text colour.
3. Add **one** accent, complementary or analogous to the signature.
4. Define the semantic colours (success, warning, error, info) and check that each still reads
   next to the others.
5. Build the dark and light versions by hand. Inverting a dark palette rarely looks right.

Use the **60-30-10** rule for the whole screen: 60 percent neutral background, 30 percent
structure in a quiet tone, 10 percent accent. Only the focus state and the primary action get
the accent.

## Step 3: check contrast

Contrast is a requirement, not a taste. The WCAG contrast ratio of two colours is
`(L1 + 0.05) / (L2 + 0.05)`, where `L` is relative luminance of the lighter and darker colour.

Targets:

| Use | Minimum ratio |
|---|---|
| Body text on background | 4.5 : 1 |
| Large text (about 18 pt or bold 14 pt) | 3 : 1 |
| Focus rings, icons, and control borders | 3 : 1 |

A small Rust helper for checks in tests:

```rust
/// Relative luminance of an sRGB colour with channels in 0..=255.
pub fn relative_luminance(rgb: [u8; 3]) -> f64 {
    let lin = |c: u8| {
        let c = c as f64 / 255.0;
        if c <= 0.03928 { c / 12.92 } else { ((c + 0.055) / 1.055).powf(2.4) }
    };
    0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
}

/// WCAG contrast ratio, from 1.0 to 21.0.
pub fn contrast_ratio(a: [u8; 3], b: [u8; 3]) -> f64 {
    let (la, lb) = (relative_luminance(a), relative_luminance(b));
    let (hi, lo) = if la > lb { (la, lb) } else { (lb, la) };
    (hi + 0.05) / (lo + 0.05)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn black_on_white_is_maximum_contrast() {
        assert!((contrast_ratio([0, 0, 0], [255, 255, 255]) - 21.0).abs() < 0.01);
    }
}
```

## Step 4: type and space

- **Type.** Use one family, or two that are clearly different. Set a scale with a fixed ratio,
  for example 1.25 or 1.333, and use only a few steps in each interface. In a terminal, the
  scale is weight and brightness (bold, normal, dim), because the cell size is fixed.
- **Line length.** Keep prose to about 45 to 75 characters per line.
- **Spacing.** Use a base unit (4 or 8 px in GUIs, one cell in a TUI) and multiples of it.
  Group related items closer than unrelated ones. Proximity does most of the work.
- **Alignment.** Choose one left edge per section and keep to it.

## Step 5: layout and hierarchy

- Make the most important thing the first thing the eye reaches. Use size, contrast, and
  position before colour.
- Say each thing once. A title above a section that already says the same thing is noise.
- Use fewer containers. Every card, border, and box adds a layer the user must parse.
- Empty states and errors are part of the design. Give them the same care as the main view.

## Step 6: motion and feedback

- Animate to communicate: a state change, a loading result, a drag in progress. Decorative
  motion distracts.
- Keep durations short (roughly 120 to 250 ms for UI transitions). Respect a reduced-motion
  setting where the framework offers one.
- In a terminal, use spinners and shimmer sparingly, and only while work is running.

## Anti-generic checklist

Before calling a design done, answer each question with a concrete yes:

- [ ] Can I say what this subject is in one sentence, and does the design show it?
- [ ] Would someone recognise this as this project, without the logo?
- [ ] Is the typography a choice, not the framework default?
- [ ] Are the colours specific, with one accent used sparingly?
- [ ] Does each element earn its border, background, or shadow?
- [ ] Is there a clear first thing to look at?
- [ ] Do dark and light versions both pass contrast?
- [ ] Does the design still read at the smallest supported size?

Avoid these common tells: a single highlighted word in a heading, all-caps labels on
everything, gradient text, identical rounded cards in a grid, a purple-to-blue gradient, and
decorative icons that repeat the label next to them.

## Applying it to each target

| Target | Palette source | Notes |
|---|---|---|
| ratatui | A `Palette` struct, see `rust-tui-design` | Truecolour plus a 16-colour fallback. Test in two terminals |
| egui | `ui.visuals()` / `Visuals`, see `rust-egui-design` | Design light and dark. Use `TextStyle` sizes |
| wgpu and shaders | Cosine palettes or a uniform palette | Mind sRGB versus linear, see `wgsl-shader-craft` |
| PNG and SVG art | Seeded palette, see `rust-generative-art` | Limit to three to five colours |

## Sources

Principles adapted from anthropics/skills frontend-design and canvas-design (Apache-2.0),
which are about subject grounding, palette building, and avoiding generic output. The
spacing, contrast, and terminal notes come from the palette guidance in ratatui-themes (MIT)
and the egui-ui-design checklist (MIT). The WCAG formulas are the published standard. The code
is original. See `research/sources/`.
