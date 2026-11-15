# Rust skills

Eleven agent skills for writing Rust, with a focus on graphics, visual design, and interactive
apps. Each folder has a `SKILL.md` with frontmatter (`name`, `description`), which is what
agents read to decide when to load it.

These were rewritten from research in `../research/`. See `../research/SEARCH_LOG.md` for the 20
searches and the reasons each source was kept or dropped.

## Index

| Skill | Use it when |
|---|---|
| [`rust-craft`](rust-craft/SKILL.md) | Writing or reviewing any Rust: ownership, errors, API shape |
| [`rust-async-concurrency`](rust-async-concurrency/SKILL.md) | Tokio, channels, locks, `select!`, cancellation, keeping UIs responsive |
| [`rust-quality-tooling`](rust-quality-tooling/SKILL.md) | fmt, clippy config, nextest, coverage, audits, CI |
| [`rust-unsafe-ffi`](rust-unsafe-ffi/SKILL.md) | `unsafe`, raw pointers, C interop, Miri and sanitizers |
| [`rust-tui-design`](rust-tui-design/SKILL.md) | ratatui terminal apps: layout, palette, popups, background work |
| [`rust-egui-design`](rust-egui-design/SKILL.md) | egui and eframe: 0.36 API, immediate-mode rules, UI design |
| [`rust-wgpu-graphics`](rust-wgpu-graphics/SKILL.md) | wgpu renderers: surfaces, pipelines, bind groups, uniforms |
| [`wgsl-shader-craft`](wgsl-shader-craft/SKILL.md) | WGSL shaders, uniform alignment, fullscreen effects (`examples/aurora.wgsl`) |
| [`rust-generative-art`](rust-generative-art/SKILL.md) | Algorithmic art: philosophy first, seeded output, palettes, export |
| [`rust-visual-design`](rust-visual-design/SKILL.md) | Making Rust UIs and artwork look deliberate, with contrast maths |
| [`rust-bevy`](rust-bevy/SKILL.md) | Bevy ECS: conventions, plugins, ordering, rendering |

## How to install

Copy the folders you want into your agent's skills directory:

```bash
# Claude Code, user level
cp -r skills/rust-* skills/wgsl-shader-craft ~/.claude/skills/

# Project level (any agent that reads .agents/skills)
mkdir -p .agents/skills && cp -r skills/rust-* skills/wgsl-shader-craft .agents/skills/
```

## Conventions used in these skills

- Version assumptions are stated where they matter (egui 0.36, ratatui 0.30, Bevy 0.20,
  wgpu varies). Check `Cargo.lock` before copying API calls.
- Each skill ends with a review checklist and a sources note.
- Code snippets are reviewed by reading. Only the WGSL in `wgsl-shader-craft/examples/` has
  been checked with a parser. Run `cargo check` on any Rust snippet you adopt.

## Licences

These are original texts. They cite techniques and, where noted, adapt ideas from MIT and
Apache-2.0 sources. Upstream copies and licence files are kept in `../research/sources/`.
