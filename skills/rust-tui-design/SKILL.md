---
name: rust-tui-design
description: Build polished terminal user interfaces in Rust with ratatui and crossterm. Covers terminal setup and restore, state versus rendering, layouts, a restrained colour system with 16-colour fallback, popups, lists and tables, long-running background work with cancellation, and testing with TestBackend. Use when creating or improving a TUI, styling ratatui widgets, or debugging a broken terminal.
---

# Rust TUI design with ratatui

A good terminal UI has a clear hierarchy, a calm palette, and no surprises when it exits. The
cell grid is small, so every colour, border, and blank line has to earn its place.

Target ratatui 0.30 and crossterm 0.29 unless `Cargo.lock` says otherwise. Check the version
before copying API calls.

## Setup and teardown

Use `ratatui::init()` and `ratatui::restore()` (or `ratatui::run` where available). They
enable raw mode and the alternate screen, and they install a panic hook so a crash does not
leave the user in a broken terminal.

```rust
fn main() -> anyhow::Result<()> {
    let mut terminal = ratatui::init();
    let result = run(&mut terminal);
    ratatui::restore();
    result
}
```

Rules for the teardown path:

- Call `restore()` on every exit path, including errors.
- Do not `println!` or `eprintln!` while the TUI is running. Those bytes interleave with
  ratatui's output and corrupt the screen. Print errors after `restore()`, or write them to a
  log file.
- Filter key events on `KeyEventKind::Press`. Some platforms also send release and repeat
  events, and handling them causes double input.

## Architecture

Keep state and rendering apart.

- `App` owns the data: selection indices, input buffers, loaded items, and a status message.
- `update` (or `handle_key`) changes `App` in response to events. It is plain Rust and easy to
  unit test.
- `view` (or `ui`) takes `&App` and a `Frame` and draws. It must not mutate state.

For small apps, a single struct works. For larger ones, use The Elm Architecture (messages,
update, view) or a component trait. Pick the simplest one that makes state transitions obvious.

## Layout

Ratatui 0.30 favours destructuring:

```rust
use ratatui::layout::{Constraint, Layout};

let [header, body, footer] = Layout::vertical([
    Constraint::Length(3),
    Constraint::Fill(1),
    Constraint::Length(1),
]).areas(frame.area());

let [sidebar, main] = Layout::horizontal([
    Constraint::Length(24),
    Constraint::Fill(1),
]).areas(body);
```

- Fixed sidebars use `Length`. Content areas use `Fill(1)`. Use `Percentage` only when the
  proportion itself is the design.
- Give content a margin or padding. Edge-to-edge text looks unfinished.
- Center popups with `Rect::centered` (or a `Layout` with `Fill` on both sides), then render
  `Clear` over the area before the popup block. Without `Clear`, the text underneath shows
  through.

## Colour system

Define one palette and pass it through the app. Do not scatter `Color::Rgb` literals.

```rust
pub struct Palette {
    pub bg: Color,        // main background
    pub surface: Color,   // panels and cards
    pub fg: Color,        // primary text
    pub muted: Color,     // labels, hints, borders at rest
    pub accent: Color,    // focus, selection, the one thing to notice
    pub success: Color,
    pub warning: Color,
    pub error: Color,
}
```

Design rules:

- Follow an 80 / 15 / 5 split. Most of the screen is neutral. Structure uses a quieter
  colour. The accent covers only focus and the primary action.
- Avoid pure black and pure white. Use a dark grey background and an off-white foreground.
- Hierarchy comes from brightness and weight before hue: `bold()` for titles, `dim()` for
  secondary text, normal for body text.
- Keep one border style across the app. Rounded borders suit a calm look:
  `Block::bordered().border_type(BorderType::Rounded)`.
- Support a 16-colour fallback. Some terminals ignore truecolour. Provide named ANSI colours
  as an alternative palette, and pick the palette from the detected capability or a config
  setting.
- Test in more than one terminal, because colours differ between emulators.

Use the `Stylize` helpers for short inline styling (`"Saved".green().bold()`). Use `Style`
values when the same style repeats.

## Lists, tables, and focus

- Keep selection in `ListState` or `TableState`, and render with `render_stateful_widget`.
  Do not store the selected row as text.
- Show focus with the accent colour on the border and a visible marker on the selected row
  (for example, a `>` gutter). Colour alone fails on monochrome terminals.
- Put key hints in the footer for the current focus: `↑↓ move  ⏎ open  ? help  q quit`.
- Add a help overlay on `?`. It shows the full keymap.
- For long content, add a `Scrollbar` with a `ScrollbarState` that matches the visible range.

## Long-running work

Never run a blocking subprocess or network call on the event loop. The UI freezes and the user
cannot cancel.

- Spawn the work on a thread or task. Send progress and results over a channel.
- Poll the channel each frame. Use `event::poll(Duration::from_millis(100))` so the loop keeps
  redrawing.
- Make the work cancellable. The user presses `Esc`, and the worker stops. When cancelling a
  child process, check whether it already finished before killing it. A success should not be
  rolled back by a late cancel.
- A `JoinHandle` dropped without `join` keeps running. Keep the handle, or make the thread
  check a cancel flag.

## Testing

Ratatui's `TestBackend` renders into memory, so layout tests run without a terminal.

```rust
#[test]
fn renders_title_and_body() {
    let mut terminal = Terminal::new(TestBackend::new(20, 3)).unwrap();
    terminal.draw(|f| {
        let p = Paragraph::new("hi").block(Block::bordered().title("T"));
        f.render_widget(p, f.area());
    }).unwrap();
    let expected = Buffer::with_lines([
        "┌T─────────────────┐",
        "│hi                │",
        "└──────────────────┘",
    ]);
    terminal.backend().assert_buffer(&expected);
}
```

Also test `App` state transitions directly, without rendering. Most bugs live there.

## Review checklist

- [ ] `restore()` runs on every exit path, and nothing prints during raw mode.
- [ ] Key handling filters for `KeyEventKind::Press`.
- [ ] State and rendering are separate, and `view` does not mutate.
- [ ] Popups use `Clear`.
- [ ] Focus is visible without colour.
- [ ] The footer lists the keys for the current focus.
- [ ] Long work runs off the event loop and can be cancelled.
- [ ] A palette type holds all colours, with a fallback option.

## Sources

Built from the production patterns in hibi-ai's ratatui skill (MIT), the architecture and
palette notes in codelia's rs-ratatui-crate (MIT), and the colour approach in ratatui-themes
(MIT). Rewritten. See `research/sources/`.
