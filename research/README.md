# Research: Rust agent skills

This folder holds the research behind the skills in `../skills/`.

- `SEARCH_LOG.md`: the 20 searches, what each returned, and the verdict on each source.
- `sources/`: curated copies of the upstream skill files that were read. Each folder keeps
  the original license file where the upstream repo had one.

## How the skills in `../skills/` were made

1. Searched for Rust agent skills, with a focus on graphics, visual design, and
   Rust GUI/TUI/GPU work (20 queries).
2. Cloned the strongest repos and read the main SKILL.md files, rule files, and references.
3. Kept the ideas that held up across several sources and dropped the rest.
4. Rewrote each skill from scratch in one consistent voice, with the version assumptions
   stated. No upstream paragraph is copied.
5. Checked the WGSL examples with `wgsl_reflect` (a parser, so syntax only). The Rust
   snippets could **not** be compiled in this sandbox, because no Rust toolchain or crates
   registry is reachable from it. Treat Rust snippets as reviewed by reading, and run
   `cargo check` before relying on them.

## Mapping: source to rewritten skill

| Rewritten skill | Main sources |
|---|---|
| `rust-craft` | leonardomso/rust-skills (rules/own-, err-, api-, anti-), massimodeluisa, BeautifulRust |
| `rust-async-concurrency` | leonardomso/rust-skills (async-, anti-lock-across-await), hibi-ai cancelable-processes |
| `rust-quality-tooling` | laurigates clippy-advanced, cargo-nextest; massimodeluisa quality.md |
| `rust-unsafe-ffi` | mohitmishra786 rust-unsafe; massimodeluisa unsafe.md |
| `rust-tui-design` | hibi-ai ratatui-rs (gotchas, testing), codelia rs-ratatui-crate, ratatui-themes |
| `rust-egui-design` | egui-agent-skills (egui, egui-ui-design), rust-responsive-gui |
| `rust-wgpu-graphics` | gamedev-wgpu-rendering, gamedev-wgsl-shaders (text read, not copied) |
| `wgsl-shader-craft` | gamedev-wgsl-shaders; fullscreen aurora example written for this repo |
| `rust-generative-art` | anthropics algorithmic-art, canvas-design |
| `rust-visual-design` | anthropics frontend-design, canvas-design; egui-ui-design; ratatui-themes |
| `rust-bevy` | BeautifulRust bevy.md, laurigates bevy-ecs-patterns |

## Known gaps

- No skill found for Vello, Slint, or nannou that was worth keeping. The searches did not
  turn up anything usable for these.
- The Impertio 44-skill Rust package and the iced skill were seen, but not read in full.
