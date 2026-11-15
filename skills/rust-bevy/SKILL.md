---
name: rust-bevy
description: Build and review Bevy game and visualisation code in Rust. Covers ECS design with plain-data components, systems and parameters, plugins, schedules and run conditions, change detection, state and messages, and the Bevy conventions a generic Rust reviewer would wrongly flag. Use when Cargo.toml depends on bevy or bevy_ecs, or when writing systems, components, plugins, or Bevy shaders.
---

# Bevy

Bevy is an ECS engine. Its conventions differ from general Rust in a few places, and a reviewer
who does not know them will "fix" correct code. Read the project's Bevy version from
`Cargo.lock` first. Bevy changes its API almost every release. Names such as events versus
messages and observer generics have moved between versions, so copy signatures from that
version's docs.

## Keep Bevy's conventions

- **System parameters are taken by value.** `Res<T>`, `ResMut<T>`, `Query<D, F>`, `Commands`,
  `Local<T>`, and `MessageReader<M>` are already borrows that Bevy hands to the system for one
  run. Do not wrap them in `&`. Normal borrowing advice applies inside the system body and to
  helper functions it calls: pass `&Health`, not the whole `Query`.
- **Use the prelude.** `use bevy::prelude::*;` is the documented import. Avoid glob imports in
  your own modules, though.
- **Plain-data components may have public fields.** `Health(pub f32)` is idiomatic. Components
  are data, and systems are behaviour.

## Components and entities

- Components are small structs or enums with no logic beyond helpers. Derive `Component`.
- Use marker components (`struct Player;`) to select entities in queries.
- Use required components, where the version supports them, instead of spawning bundles by hand
  in many places.
- Prefer several small components over one large one. Systems that touch only one piece do not
  conflict with each other.
- Keep identifiers that refer to other entities as `Entity`, and check them: a despawned entity
  makes the lookup fail.

## Systems and queries

- Systems are plain functions. Keep them short: read the inputs, update state, and emit
  messages. Put maths in ordinary functions that can be unit-tested without a `World`.
- Conflicting queries (two mutable accesses to the same component that the scheduler cannot
  prove disjoint) are caught when the system initialises, and Bevy panics at startup. The
  compiler does not catch them. Fix them by adding `Without<T>` filters so the sets do not
  overlap, or by using `ParamSet` for systems that need to access the same data in turn.
- Use `Changed<T>` and `Added<T>` to react only when something changed, and use `Ref<T>` when
  you need the change tick. Remember that `Changed` is also set by a `&mut` access, even when the
  value did not change. Avoid writing the same value back just to trigger a filter.
- `Local<T>` holds per-system state without a global resource.

## Commands and ordering

- `Commands` are applied at a sync point, not immediately. A spawn and a query for that spawn in
  the same system will not see the new entity. Put the dependent system after the sync point, or
  order the systems.
- Order systems explicitly with `.before()`, `.after()`, and system sets, when one must see the
  output of another.
- Use run conditions (`.run_if(in_state(...))`) instead of an `if` at the top of every system.
- Use `OnEnter` and `OnExit` for setup and teardown tied to a state, and make sure spawned
  entities carry a state marker so they can be despawned on exit.

## Plugins

Group related setup into a `Plugin`. A plugin registers its systems, resources, and types. A
binary's `main` should be a list of `add_plugins` calls. Keep plugin structs small and make them
configurable with fields, not with global constants.

## Messages and state

- Use messages (events, in older versions) for one-way notifications between systems. A message
  reader and writer should be in the same plugin when possible.
- Use `States` for mode-level flow (menu, playing, paused). Use components for per-entity state.
  Do not model per-entity state as a global.

## Rendering and shaders

- Custom materials use WGSL. Keep uniform structs `#[repr(C)]` with `bytemuck` where the version
  requires it, and check padding the same way as in `rust-wgpu-graphics`.
- Visual polish usually comes from colour management: a HDR camera with tone mapping, and
  bloom used sparingly on emissive elements. Start with defaults, and change one thing at a
  time.
- Use `Visibility` and `ViewVisibility` (not despawn) to hide entities that will reappear.

## Bugs a reviewer should look for

| Bug | Symptom | Fix |
|---|---|---|
| Query conflict hidden behind `ParamSet` misuse | Panic at startup about aliased access | Split systems or use disjoint filters |
| Spawn and query in one system | Entity "missing" for a frame | Order the systems, or use a later system |
| `Changed<T>` always firing | Work every frame | Only mutate when the value changes |
| Entities not tied to a state | Leftover entities after a state change | Add a state marker and despawn on `OnExit` |
| Heavy work in `Update` every frame | Frame drops | Move to a fixed schedule or a task pool |
| Global `static mut` for game data | Untestable, unsafe | A `Resource` |

## Review checklist

- [ ] Version of Bevy checked against `Cargo.lock`.
- [ ] System parameters are by value, as Bevy expects.
- [ ] Components are plain data; behaviour is in systems or helper functions.
- [ ] Ordering is explicit where a system depends on another's output.
- [ ] Per-entity state is a component; per-mode state is a `State`.
- [ ] Changed filters are not triggered needlessly.
- [ ] Logic that can be pure is kept out of the `World`, and tested as such.

## Sources

Adapted from BeautifulRust's Bevy reference by morganlinton (MIT), which lists the conventions to
keep, and from laurigates/claude-plugins bevy-ecs-patterns (MIT). Rewritten. See `research/sources/`.
