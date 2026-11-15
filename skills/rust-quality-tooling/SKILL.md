---
name: rust-quality-tooling
description: Set up and run the Rust quality gates. Covers rustfmt, Clippy configuration (workspace lints, expect over allow), cargo test and nextest, doctests, rustdoc, coverage, dependency audits, and a CI pipeline. Use when configuring a Rust project, adding CI, fixing lint failures, or before handing back Rust changes.
---

# Rust quality tooling

Let the tools handle style and mechanical checks, so review time goes to design. Run the gates
before you say a change is done.

## The gate

Run these from the workspace root, in this order:

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace --all-features
cargo doc --workspace --no-deps
```

If the project has a `rust-toolchain.toml` or `rust-version`, use that toolchain. Do not
test on a newer compiler and claim the MSRV works.

## Clippy configuration

Put lint policy in `Cargo.toml` so every crate in a workspace shares it:

```toml
[workspace.lints.rust]
unsafe_code = "forbid"          # relax per crate only when justified
missing_debug_implementations = "warn"

[workspace.lints.clippy]
pedantic = { level = "warn", priority = -1 }
unwrap_used = "warn"
expect_used = "warn"
dbg_macro = "deny"
todo = "warn"
# Pedantic lints that are noisy in practice:
module_name_repetitions = "allow"
missing_errors_doc = "allow"    # enable once the public API stabilises
```

Each member crate opts in:

```toml
[lints]
workspace = true
```

Notes:

- `priority = -1` makes group settings apply before individual lint overrides. Without it,
  the group can override your specific lints.
- `unwrap_used` and `expect_used` will fire in tests. Allow them in test modules with
  `#[cfg(test)] #[allow(clippy::unwrap_used)]` on the module, or use `#[expect(...)]`.

## Suppress with `expect`, not `allow`

`#[expect(lint, reason = "...")]` (stable since Rust 1.81) suppresses a lint and warns
when the lint stops firing, so stale suppressions are removed automatically.

```rust
#[expect(clippy::cast_precision_loss, reason = "pixel counts stay far below 2^24")]
let ratio = pixels as f32 / total as f32;
```

Use `#[allow]` only in generated code or macro output. Never add `#![deny(warnings)]` to
source; enforce `-D warnings` in CI instead, so new compilers that add warnings do not break
local builds.

## Tests

- Unit tests live in the same file, in `#[cfg(test)] mod tests`. They can reach private items.
- Integration tests live in `tests/`. They use only the public API.
- Doctests are part of the test suite. Keep examples compiling. Mark examples that cannot run
  with `no_run`, or `ignore` with a reason.
- Use `proptest` for parsers and arithmetic, where the property matters more than one example.
- Name tests as behaviour: `rejects_empty_input`, not `test_parse_2`.

### nextest

`cargo-nextest` runs each test in its own process, which gives better isolation and faster
parallel runs.

```bash
cargo install cargo-nextest --locked
cargo nextest run --workspace --all-features
cargo test --doc --workspace      # nextest does not run doctests
```

Use `--retries` only as a temporary measure for a known flaky test, and file a bug.

## Coverage and dependency checks

- Coverage: `cargo llvm-cov --workspace --html`. Look at uncovered error branches first.
- Audit: `cargo audit` (RustSec advisories) and `cargo deny check` (licenses, duplicate
  versions, banned crates). Keep a `deny.toml` in the repo.
- Unused dependencies: `cargo machete` (fast, approximate) or `cargo udeps` on nightly
  (accurate).
- Check MSRV: `cargo +1.xx check --workspace`, or `cargo msrv` if the project uses it.

## CI skeleton

```yaml
name: ci
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - uses: Swatinem/rust-cache@v2
      - run: cargo fmt --all -- --check
      - run: cargo clippy --workspace --all-targets --all-features -- -D warnings
      - run: cargo test --workspace --all-features
      - run: cargo doc --workspace --no-deps
```

Add a separate job for `cargo deny check` and one for the MSRV toolchain.

## Diagnosing common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| Clippy fails only in CI | Local toolchain is older | Pin with `rust-toolchain.toml` |
| `fmt --check` fails after edit | Forgot to run `cargo fmt` | Run it, commit the result |
| Flaky test | Shared state, timing, or ports | Isolate, use `start_paused`, pick a free port |
| Doctest compile error | Example uses private items or a missing import | Add the `use` line, or mark `ignore` with reason |

## Sources

Built from clippy-advanced and cargo-nextest in laurigates/claude-plugins (MIT), and the
quality checklist in massimodeluisa/rust-best-practices (MIT). Rewritten. See `research/sources/`.
