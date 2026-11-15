---
name: rust-craft
description: Write, edit, and review idiomatic, safe, production Rust. Covers ownership and borrowing choices, Result-based error handling, public API shape, and avoiding needless clones and allocations. Use whenever you create or change .rs files or Cargo.toml, or when asked to review Rust code.
---

# Rust craft

Write Rust that a maintainer reads once and understands. The compiler already checks memory
safety. Your job is to make the design clear, the failure paths explicit, and the cost
visible.

## Priorities

1. Correct behaviour, including every error path.
2. Safety. Avoid `unsafe`, and justify every use.
3. Clarity. Names, types, and control flow should say what the code does.
4. Performance. Measure before optimising. Keep the hot path simple.

## Ownership and borrowing

- Take borrowed inputs: `&str`, `&[T]`, `&Path`, `impl AsRef<str>`. Do not take `&String` or
  `&Vec<T>`. Clippy flags both.
- Clone only when you have a reason. "The borrow checker complained" is not a reason. Look
  for a restructure first: shorter borrow scope, splitting a struct, or passing a value
  instead of a reference.
- To move a value out of `&mut self`, use `std::mem::take` (the type needs `Default`) or
  `std::mem::replace`. Do not clone the whole thing and then clear it.
- Use `Cow<'_, str>` when the output is usually borrowed but sometimes owned.
- Prefer iterator chains to index loops. Do not `collect()` into a `Vec` only to iterate it
  again. Collect only when you need the storage, the length, or random access.
- Keep owned data at the edges. Convert to `String` or `Vec` where the value must be stored.

## Types and API shape

- Use newtypes for IDs, units, and validated values (`struct UserId(u64)`,
  `struct Meters(f32)`). A raw `u64` for every identifier invites mix-ups.
- Replace `bool` parameters with an enum when the call site would read `true, false`.
- Make invalid states unrepresentable. A `enum State { Idle, Loading { id }, Done(Data) }`
  beats three booleans and an `Option`.
- Mark public enums that will grow with `#[non_exhaustive]`.
- Derive what is natural: `Debug` always for public types, plus `Clone`, `PartialEq`,
  `Eq`, `Hash`, `Default` where they make sense. Do not derive `Copy` on large or
  semantically owned types.
- Naming follows the API Guidelines: `as_` for cheap borrowed views, `to_` for owned copies,
  `into_` for consuming conversions, `is_`/`has_` for booleans.
- Use a builder when a constructor would take more than about four options.
- Do not add traits or generics for a single implementation. Abstraction must earn its
  place.

## Errors and panics

- Libraries: define a focused error enum (`thiserror` is the usual choice) and implement
  `std::error::Error`. Keep error types `Send + Sync + 'static`.
- Binaries: `anyhow` (or `color-eyre`) at the top level, with `.context("what we were doing")`
  added at each boundary.
- Return `Result` for anything that can fail for reasons outside the code: I/O, parsing,
  user input, network, capacity.
- No `unwrap()` or `expect()` on production paths. `expect("reason")` is acceptable only for
  a true internal invariant, and the message should say what was assumed.
- Use `let ... else` for early exits:

  ```rust
  let Some(first) = items.first() else {
      return Err(Error::Empty);
  };
  ```

- Use `?` to propagate. Use `map_err` only when you are changing the error type on purpose.
- Panic only for programmer bugs. Document panics with a `# Panics` section.

## Strings

- Store `String`. Accept `&str`.
- Avoid `format!` in tight loops. Write into one buffer with `write!`, or precompute.
- Use `char_indices` or `bytes` when you need positions. Do not slice a `&str` by byte index
  unless you know the boundary is valid.

## Unsafe

Avoid it. If it is needed, follow the `rust-unsafe-ffi` skill. Put
`#![forbid(unsafe_code)]` at the top of any crate that does not need unsafe.

## Concurrency basics

- Prefer message passing (channels) to shared mutable state.
- For shared state, keep the `Mutex` scope as small as possible. Never hold a lock across an
  `.await`. See `rust-async-concurrency`.
- Put `Send + Sync` bounds only where they are needed. Adding them to every type is noise.

## Cargo and build

- Read `edition` and `rust-version` in `Cargo.toml` before using newer syntax.
- Keep dependencies lean. Check features: `default-features = false` is often right.
- A reasonable release profile for shipped binaries:

  ```toml
  [profile.release]
  opt-level = 3
  lto = "thin"
  codegen-units = 1
  ```

  Use `lto = "fat"` and `panic = "abort"` only when build time is acceptable and nothing
  relies on unwinding.

## Review checklist

Before you hand back Rust code, check:

- [ ] No `unwrap()`/`expect()` on paths that handle external input.
- [ ] Public functions take borrowed types where ownership is not required.
- [ ] No clone whose only purpose was to satisfy the borrow checker.
- [ ] Every error path returns a typed error with context.
- [ ] Public items have doc comments, and fallible functions have `# Errors`.
- [ ] `cargo fmt`, `cargo clippy -- -D warnings`, and `cargo test` pass (see
      `rust-quality-tooling`).

## Anti-patterns to reject

| Smell | Fix |
|---|---|
| `.clone()` everywhere | Shorten borrows, or restructure ownership |
| `String` parameters where `&str` works | Take `&str` or `impl AsRef<str>` |
| Stringly-typed states (`"running"`) | Enum |
| `Box<dyn Trait>` in a hot loop | Generics, or an enum of the known variants |
| `Vec` returned when an iterator would do | Return `impl Iterator` |
| `unwrap()` in a library | Typed error |
| One-impl trait "for flexibility" | Concrete type until a second use exists |
| Optimising without a benchmark | Profile first (`cargo flamegraph`, criterion) |

## Sources and attribution

Rewritten from the rule sets in leonardomso/rust-skills (MIT), massimodeluisa's
rust-best-practices (MIT), and BeautifulRust (MIT). See `research/sources/`.
