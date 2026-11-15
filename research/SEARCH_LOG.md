# Search log: Rust agent skills (graphics and general)

Date of research: 2026-11-15. Twenty web searches were run. The search tool returned about
five results per query, not ten, so the total is about 100 hits. Duplicates are merged below.

| # | Query (short form) | Useful hits | Verdict |
|---|---|---|---|
| 1 | Claude agent skills SKILL.md Rust best practices | leonardomso/rust-skills, massimodeluisa/rust-best-practices-skill, Jeffallan rust-engineer | Used: rust-skills, massimodeluisa |
| 2 | Rust agent skill graphics wgpu shaders | sunsided gamedev-wgsl-shaders, gamedev-wgpu-rendering, skills.lc ps1-graphics-rust | Used: gamedev skills (read, not copied) |
| 3 | awesome agent skills Rust collection | mitch-avis, mohitmishra786/low-level-dev-skills, Impertio Rust-Claude-Skill-Package | Used: low-level (unsafe). Impertio: listed only |
| 4 | Rust TUI ratatui visual design | codelia rs-ratatui-crate, hibi_ai ratatui-rs, ratatui-themes, fcoury designing-ratatui-tuis | Used: all four |
| 5 | Rust egui generative art creative coding | egui-agent-skills, rust-responsive-gui, anthropics algorithmic-art | Used: egui-agent-skills, algorithmic-art |
| 6 | egui agent skill SKILL.md | egui-agent-skills (6 skills, egui 0.36) | Used: egui, egui-ui-design |
| 7 | Bevy agent skill ECS rendering | laurigates bevy-game-engine, bevy-ecs-patterns; BeautifulRust bevy digest | Used: bevy-ecs-patterns, BeautifulRust bevy.md |
| 8 | nannou creative coding skill | Nannou framework articles; no real agent skill found | Nothing usable as a skill |
| 9 | Rust SVG generation skill resvg | aki77 icon-generator (resvg CLI), Glyphic, bentossell/visualise | Noted only. Not Rust-specific |
| 10 | wgpu shader art fragment shader skill | iart-ai shader-glsl (GLSL, not WGSL), FAQ articles | Noted for shader technique ideas |
| 11 | typography color theory visual design skill | skills.lc frontend-design, glastor ui-ux-aesthetic-architect, JacbK design | Principles only. Web-focused |
| 12 | Vello Skia 2D vector graphics skill | Vello articles and HN thread; no skill | Nothing usable as a skill |
| 13 | Claude skills collection anthropics rust | Impertio 44-skill Rust package, dcodesdev/clawd (CLI, not a skill) | Impertio: listed only |
| 14 | clippy cargo agent skill best practices | Morgan Linton BeautifulRust, rust-plugin clippy-advanced, cargo-nextest | Used: clippy-advanced, cargo-nextest |
| 15 | image processing skill image crate | skill-gallery image-processing (Sharp, JS), artcraft-skills (app manuals) | Not used. Off-topic for Rust |
| 16 | Slint UI agent skill | StrayDragon lib-slint-expert, primer-slint skills | Noted. Not used (Slint not requested) |
| 17 | iced GUI agent skill | devsepnine/hibi_ai iced-rs | Noted. Not read in full |
| 18 | ratatui theme palette skill | ratatui-themes, ratatui-tui (blacktop) | Used: ratatui-themes |
| 19 | wgpu graphics skill render pipeline | gamedev-wgpu-rendering, LurekDude gpu-programming, leodutra rust-wgpu-functional | Used: wgpu-rendering. Others noted |
| 20 | Rust procedural generative art skill noise | 4444J99 generative-art-algorithms, pixel-art skill, anthropics algorithmic-art | Used: algorithmic-art |

## Evaluation criteria

A skill was kept as a source when it met most of these:

1. It is specific to Rust or to a Rust graphics stack (wgpu, egui, ratatui, Bevy).
2. Its guidance is concrete: rules with a "why", bad and good examples, and checklists.
3. It states its version assumptions (egui 0.36, ratatui 0.30, Bevy 0.20, edition 2024).
4. It has a license that allows reading and reuse, or it is explicitly open source.

Skills that are only a directory listing, a marketing page, or a generic "be creative"
prompt were rejected, even when they ranked well.

## Licensing notes

- MIT: leonardomso/rust-skills, massimodeluisa/rust-best-practices-skill,
  morganlinton/BeautifulRust, gregorycarnegie/egui-agent-skills, codelia, hibi_ai,
  ratatui-themes, laurigates/claude-plugins, mohitmishra786/low-level-dev-skills.
- Apache-2.0: anthropics/skills (algorithmic-art, canvas-design, frontend-design).
- No license file found: sunsided/gamedev-skills and leodutra/agent-skills. Their text was
  read but **not vendored** into `research/sources/`. The rewritten skills in `skills/` are
  original wording that cites the technique, not a copy.
