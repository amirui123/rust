---
name: rust-unsafe-ffi
description: Write, review, and audit unsafe Rust and foreign function interfaces (FFI). Covers the five unsafe capabilities, SAFETY comments, safe wrappers around raw pointers, extern "C" boundaries, panic handling across FFI, Send/Sync impls, and checking with Miri and sanitizers. Use whenever code contains `unsafe`, `extern "C"`, raw pointers, transmute, or manual Send/Sync.
---

# Unsafe Rust and FFI

`unsafe` does not turn off the borrow checker. It tells the compiler that you, the author,
guarantee some invariants it cannot check. Keep that promise small, local, and written down.

## The five things unsafe allows

1. Dereference a raw pointer (`*const T`, `*mut T`).
2. Call an `unsafe fn`, including every `extern` function.
3. Access or modify a `static mut`.
4. Implement an `unsafe trait` (`Send`, `Sync`, `GlobalAlloc`, and others).
5. Access fields of a `union`.

Nothing else is unlocked. Most "unsafe" code can be rewritten with `Vec`, slices, `Cell`,
`RefCell`, `MaybeUninit`, or `NonNull` wrapped in a safe type.

## Rules for every unsafe block

- Keep the block as small as possible. One operation per block is ideal.
- Write a `// SAFETY:` comment directly above it. The comment states the invariant that makes
  the operation sound, and why that invariant holds at this call site.

  ```rust
  // SAFETY: `index` was checked against `self.len` on the line above, and `self.ptr`
  // points to `self.cap` initialised elements for the lifetime of `&self`.
  let value = unsafe { &*self.ptr.add(index) };
  ```

- Expose a safe API. The unsafe part should be a private implementation detail with a safe
  signature on top.
- Public `unsafe fn` must have a `# Safety` section in its doc comment listing the caller's
  obligations.
- Do not implement `Send` or `Sync` by hand unless you can explain why the type is safe to
  move or share across threads. Write that explanation next to the `unsafe impl`.

## Checking unsafe code

```bash
rustup +nightly component add miri
cargo +nightly miri test            # catches undefined behaviour in tests
RUSTFLAGS="-Zsanitizer=address" cargo +nightly test --target x86_64-unknown-linux-gnu
```

Miri is slow and does not support every FFI call. Run it on the unsafe-heavy modules, not the
whole project. Address and thread sanitizers catch what Miri cannot reach.

## FFI: calling C from Rust

- Declare the signature in an `extern "C"` block and mark it `unsafe`. Check the header
  carefully: size, signedness, and nullability all matter.
- Generate bindings with `bindgen` rather than writing them by hand for anything large.
- Keep the raw bindings in a `-sys` crate. Put the safe wrapper in another crate.
- Strings: use `CString` for owned data passed to C, and `CStr::from_ptr` for data received.
  Check for NUL bytes when constructing a `CString`.
- Ownership: document which side frees memory. Expose a `Drop` impl that calls the matching
  free function, so the caller cannot forget.
- Make your structs match the C layout with `#[repr(C)]`.

## FFI: exposing Rust to C

- Use `#[unsafe(no_mangle)] pub extern "C" fn` (the attribute form required in edition 2024).
- Never let a Rust panic unwind across an `extern "C"` boundary. Wrap the body in
  `std::panic::catch_unwind` and return an error code, or use `extern "C-unwind"` only when
  the caller is designed for it.
- Generate a header with `cbindgen` and check it into the repo or build it in CI.
- Validate every pointer argument for null before dereferencing it.

## Common mistakes

| Mistake | Consequence | Fix |
|---|---|---|
| Creating `&mut` aliases to the same memory | Undefined behaviour | Use one owner, or `Cell` / `RefCell` |
| `transmute` between types with different layout | Undefined behaviour | Use `#[repr(C)]` and a checked conversion |
| Dropping memory the C side still uses | Use after free | Document ownership; free only in `Drop` |
| `Vec::set_len` before initialising | Reads uninitialised memory | Use `MaybeUninit` and initialise first |
| Missing `# Safety` on public `unsafe fn` | Callers guess the contract | Write it |
| Unwinding into C | Undefined behaviour | `catch_unwind` at the boundary |

## Review checklist

- [ ] Each `unsafe` block has a `// SAFETY:` comment with a concrete invariant.
- [ ] The block contains the minimum number of operations.
- [ ] There is a safe public API around each unsafe implementation.
- [ ] Every raw pointer is checked for null and bounds before use.
- [ ] No panic can cross an `extern "C"` function.
- [ ] Miri or a sanitizer runs on the affected module.

## Sources

Adapted from the unsafe checklist in mohitmishra786/low-level-dev-skills (MIT) and the unsafe
rules in massimodeluisa/rust-best-practices (MIT). Rewritten. See `research/sources/`.
