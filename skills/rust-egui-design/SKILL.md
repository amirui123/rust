---
name: rust-egui-design
description: Build and review immediate-mode GUIs with egui and eframe. Covers the egui 0.36 API changes, immediate-mode pitfalls (IDs, repaints, blocking the frame, per-frame allocation), and a UI design system for panels, primary actions, validation, shortcuts, themes, and accessibility. Use when writing or fixing egui/eframe code or designing an egui screen.
---

# egui design and code

egui rebuilds the whole interface every frame. Most egui bugs come from forgetting that. Most
egui design problems come from treating every button as equal. This skill covers both.

## Check the version first

Read the `egui` and `eframe` versions in `Cargo.lock`. The rules below target **egui 0.36**.
Many tutorials and models still write the older API, which will not compile against 0.36.

| Older API (pre-0.36) | egui 0.36 |
|---|---|
| `impl eframe::App { fn update(&mut self, ctx, frame) }` | `fn ui(&mut self, ui: &mut egui::Ui, frame)`. Non-drawing work goes in optional `fn logic(&mut self, ctx, frame)` |
| `egui::SidePanel::left("id")`, `TopBottomPanel::top` | `egui::Panel::left("id")`, `Panel::top`, `Panel::bottom`, `Panel::right` |
| `.default_width`, `.min_width`, `.max_height` | `.default_size`, `.min_size`, `.max_size`, `.size_range` |
| `panel.show(ctx, ...)` | `panel.show(ui, ...)`, with a parent `&mut Ui` |
| `egui::Frame::none()` | `egui::Frame::NONE` |
| `egui::Rounding` | `egui::CornerRadius` |
| `.id_source(...)`, `ComboBox::from_id_source` | `.id_salt(...)`, `ComboBox::from_id_salt` |
| `ui.close_menu()` | `ui.close()` |
| `egui::menu::bar(ui, ...)` | `egui::MenuBar::new().ui(ui, ...)` |

If a name is not in this table, look it up in the source for your version under
`~/.cargo/registry/src/*/egui-<version>/src/`, or on docs.rs for that version. Do not guess.

## Immediate-mode rules

- **Build state outside the frame.** Load images, fonts, and large data once, in `new` or on
  first use. Do not read files or decode images in `ui`.
- **Give repeated widgets stable IDs.** In a loop, use `ui.push_id(item.id, |ui| ...)` or
  `.id_salt(item.id)` on collapsing headers and combo boxes. Otherwise state from one row
  leaks into another, and egui warns about duplicate IDs.
- **Do not block the frame.** Network, disk, and long computation run on a thread or task.
  Send results back over a channel. Call `ctx.request_repaint()` after sending, or the new
  result will not show until the next input event.
- **Request repaints deliberately.** Animations use `request_repaint_after(...)` at the frame
  rate you need, not an unconditional repaint every frame. Idle apps should use almost no CPU.
- **Keep layout and logic apart.** `ui` reads state and draws. Button clicks return or set
  actions; the logic applies them after the widget is drawn.
- **Persistence.** Enable the `persistence` feature and store settings through eframe's
  storage. Save only user preferences, not transient UI state.

## Layout

- Desktop apps follow the panel model: a menu bar at the top, tools on a side panel, a status
  line at the bottom, and content in the central area.
- Design for the smallest window the app must support. Below a width you choose, stack
  sections vertically instead of placing them side by side.
- Give side panels `resizable(true)`, a `min_size`, and a `max_size`.
- Put anything that can grow inside a `ScrollArea`.
- Hide advanced options in a `CollapsingHeader` or a secondary window.
- Use `ui.separator()` or a `Frame` to mark real groups. Boxing every control makes nothing read
  as a group.
- Keep prose lines to roughly 45 to 75 characters with `ui.set_max_width`.

## Actions and buttons

- Give the main action of a group a visible primary style. egui draws every button the same
  way by default. Use the selection colours from `ui.visuals()` on the one primary button
  per group.
- Keep button order consistent. In a right-to-left layout, the first widget added appears
  rightmost, so add buttons in reverse reading order.
- Constrain input. Use `Slider` or `DragValue::range` for numbers, and `ComboBox` for fixed
  sets. Show validation errors next to the field, in words.
- Disable rather than hide, and explain why with `on_disabled_hover_text`.
- Confirm destructive actions in a modal, or make them undoable.
- Define shortcuts once with `KeyboardShortcut`, consume them with `consume_shortcut`, and show
  them in the menu with `shortcut_text`.

## Visuals and accessibility

- Set colours through `ui.visuals()` / `Visuals`, not inline `Color32` literals. Then light and
  dark themes both work.
- Design both themes. Do not invert one to make the other. Check text contrast in each:
  4.5:1 for body text, 3:1 for large text and UI controls.
- Use `TextStyle` for sizes (Heading, Body, Small, Monospace) so the user's text-size setting
  applies.
- Do not rely on colour alone for state. Pair it with an icon or a word.
- Keep every control reachable by keyboard. Test tab order and focus rings.

## Testing

`egui_kittest` lets you query widgets by accessibility role, simulate input, and step frames.
Use it for dialogs and forms. Also keep state logic in plain functions with ordinary unit tests.

## Review checklist

- [ ] Uses the egui 0.36 API (or the version in `Cargo.lock`).
- [ ] Assets are loaded once, not per frame.
- [ ] Loops use stable IDs.
- [ ] Background work does not block `ui`, and results request a repaint.
- [ ] Idle CPU is low; repaints are requested on purpose.
- [ ] One clear primary action per group; destructive actions are confirmed.
- [ ] Both themes meet contrast targets.
- [ ] Everything works from the keyboard.

## Sources

Rewritten from egui-agent-skills by gregorycarnegie (MIT), which the egui 0.36 table comes from,
and from the layout notes in rust-responsive-gui. See `research/sources/`.
