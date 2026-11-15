---
name: rust-async-concurrency
description: Design and fix async and concurrent Rust with Tokio. Covers task spawning, blocking work, lock scope across await points, channel choice, select!/join! and cancel safety, graceful shutdown, and keeping UI loops responsive. Use when code uses async fn, tokio, channels, Mutex/RwLock with async, threads, or background work.
---

# Async and concurrency in Rust

Async Rust fails in quiet ways: a lock held across an `.await`, a blocking call that stalls
every task on a worker, a `select!` branch that drops half-read data. Check these first.

## The runtime rules

- Never block inside async code. `std::thread::sleep`, blocking file I/O, `std::fs`, and
  CPU-heavy loops stall the worker thread. Use `tokio::time::sleep`, `tokio::fs`, or move the
  work with `tokio::task::spawn_blocking`.
- CPU-heavy work that runs for more than a few milliseconds goes to `spawn_blocking` or a
  dedicated thread pool, not to a plain `tokio::spawn`.
- Use `#[tokio::main]` for binaries and `#[tokio::test]` for tests. In tests, use
  `#[tokio::test(start_paused = true)]` when time matters, so tests run instantly. Paused time
  needs the `test-util` feature of `tokio` in `[dev-dependencies]`.

## Locks

- `std::sync::Mutex` guards must not live across `.await`. The task can be parked while the
  guard is held, which deadlocks or starves other tasks. Copy out what you need, drop the
  guard, then await.

  ```rust
  let value = {
      let guard = state.lock().expect("state mutex poisoned");
      guard.last().copied()
  }; // guard dropped here
  let result = fetch(value).await?;
  state.lock().expect("state mutex poisoned").push(result);
  ```

- `tokio::sync::Mutex` is safe to hold across `.await`, but it is slower. Use it only when the
  critical section truly has to await. Most designs do not.
- `RwLock` helps only when reads are much more frequent than writes and reads are short.
- Prefer one owner task that holds state and receives commands over several tasks sharing a
  lock. This is often the simplest correct design.

## Channels

| Need | Use |
|---|---|
| Work queue between tasks, with backpressure | `tokio::sync::mpsc::channel(n)` (bounded) |
| Many subscribers, each gets every message | `tokio::sync::broadcast` |
| Latest value only, observers read it | `tokio::sync::watch` |
| One reply to one request | `tokio::sync::oneshot` |
| Sync code talking to async code | `mpsc::Sender::blocking_send` from a thread, or a bounded channel |

Use bounded channels by default. An unbounded channel turns a slow consumer into unbounded
memory growth.

## Composing futures

- `tokio::join!` runs futures concurrently and waits for all. `try_join!` returns early on
  the first error.
- `tokio::select!` returns when the first branch completes and drops the others. A branch
  that is not **cancel safe** can lose data if it is dropped half-way.
  - Cancel-safe examples: `mpsc::Receiver::recv`, `tokio::time::sleep`, `watch::changed`.
  - Not cancel-safe in general: `AsyncReadExt::read_exact`, anything that has read part of a
    message into a local buffer. Move these into their own task, or read in a loop that does
    not select on them.
- For a dynamic set of tasks, use `tokio::task::JoinSet`. It owns the handles, so dropping it
  aborts the tasks, and `join_next().await` yields results as they finish.

## Cancellation and shutdown

- Use `tokio_util::sync::CancellationToken` to stop long-running tasks. Each loop selects on
  `token.cancelled()`.
- Check for completion before cancellation when both are possible. If a child finished
  successfully and the user cancels a moment later, the success should win.
- Put timeouts around external calls with `tokio::time::timeout`, and return a typed error
  on elapse.
- On shutdown, stop accepting new work, cancel the token, then join tasks with a deadline.

## Async traits and returns

- Native `async fn` in traits is stable (Rust 1.75+). Use it. Reach for `async-trait` only
  when you need `dyn` dispatch and the crate cannot be restructured.
- Return `impl Future<Output = T> + Send` when callers spawn the future and need `Send`.

## Interactive apps (TUI and GUI)

- Never block the event or render loop. Run I/O in a task, and send results back over a
  channel. In egui, call `ctx.request_repaint()` after sending. In ratatui, poll the channel
  on each tick.
- Keep a single source of truth for state. Background tasks send events, and the UI thread
  applies them.

## Review checklist

- [ ] No blocking calls inside async functions.
- [ ] No `std::sync` guard alive across an `.await`.
- [ ] Every channel is bounded, or the unbounded choice is justified in a comment.
- [ ] Every `select!` branch is cancel safe, or the reason it is safe is written down.
- [ ] Spawned tasks are owned (JoinSet or handles), and shutdown is defined.
- [ ] External calls have timeouts.

## Anti-patterns

| Smell | Fix |
|---|---|
| `std::thread::sleep` in a task | `tokio::time::sleep` |
| `block_on` inside async code | Make the caller async, or `spawn_blocking` |
| `Arc<Mutex<Vec<_>>>` as a message bus | `mpsc` into an owner task |
| `tokio::spawn` and drop the handle | Keep the handle, or use `JoinSet` |
| Unbounded channel for a producer that can outpace the consumer | Bounded channel |
| `select!` loop reading a half-parsed frame | Dedicated reader task |

## Sources

Adapted from the async rules in leonardomso/rust-skills (MIT) and the cancellation patterns in
hibi-ai's ratatui skill (MIT). Rewritten. See `research/sources/`.
