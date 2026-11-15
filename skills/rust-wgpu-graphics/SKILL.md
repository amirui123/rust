---
name: rust-wgpu-graphics
description: Architect and debug real-time GPU rendering in Rust with wgpu. Covers the renderer data flow, device and surface setup, resize and surface-error handling, pipeline caching, bind group discipline, uniform layout with bytemuck, texture formats, and wgpu validation output. Use when writing or changing code that touches wgpu devices, surfaces, pipelines, bind groups, buffers, or render passes.
---

# wgpu graphics

wgpu is an explicit, low-level API. Most of its bugs are one of three kinds: a layout that
does not match between Rust and WGSL, a resource recreated every frame, or a surface that was
not reconfigured. Work through this skill when debugging any of them.

Check the wgpu version in `Cargo.lock`. The surface and frame-acquisition API has changed
between releases, so copy signatures from that version's docs, not from memory.

## Architecture: keep game state and GPU state apart

The data flows one way:

```
world state  →  extracted render data (plain structs)  →  prepared GPU buffers  →  render passes
```

- Game code describes what to draw, as plain data. It does not hold `wgpu::Device`,
  `wgpu::Queue`, pipelines, or buffers.
- A `Renderer` (or `GpuContext`) owns the device, queue, surface, and every pipeline and
  buffer. Pass it explicitly. Do not make it a global.
- Gameplay can be tested with no GPU at all. That is the main benefit of this split.

## Startup

- Create one `Instance`, one `Surface`, one `Adapter`, one `Device` and `Queue`. Store them
  together.
- Choose the surface format once. Prefer an sRGB format for colour output, and remember that
  shaders then write linear values.
- Pick the present mode deliberately. `Fifo` (vsync) is the safe default. Immediate modes
  tear, and the user should opt in.
- Create every pipeline at startup, or the first time a material needs it, then cache it.
  Never call `create_render_pipeline` inside the per-frame path.

## Resize

```rust
pub fn resize(&mut self, width: u32, height: u32) {
    if width == 0 || height == 0 {
        return; // minimised window: skip, do not configure a zero-size surface
    }
    self.config.width = width;
    self.config.height = height;
    self.surface.configure(&self.device, &self.config);
    self.depth = create_depth_target(&self.device, width, height);
    // Recreate anything sized to the frame: depth, MSAA, post-process targets.
    // Do NOT rebuild pipelines. They do not depend on the surface size.
}
```

## Surface errors

When acquiring the next frame, handle each case:

| Error | Action |
|---|---|
| `Lost` or `Outdated` | Reconfigure the surface with the current size, skip this frame |
| `Timeout` | Skip this frame |
| `OutOfMemory` | Exit with an error |

Do not treat `Lost` as fatal. It is routine on resize, sleep and wake, and display changes.

## Bind groups and uniforms

- Assign bind group slots by update frequency:

  | Group | Content | Changes |
  |---|---|---|
  | 0 | camera, time, lights | once per frame |
  | 1 | material textures and sampler | per material |
  | 2 | per-object transform | per draw |

- Keep every `@group` and `@binding` number in one Rust module. Do not scatter magic numbers
  across files. Mismatches between Rust and WGSL are the most common cause of black screens and
  validation errors.
- Mirror each uniform struct on the Rust side with `#[repr(C)]` and `bytemuck::Pod` and
  `Zeroable`. `Pod` refuses to compile if the struct has implicit padding, which catches
  layout bugs early.
- WGSL aligns `vec3<f32>` to 16 bytes. Pad explicitly:

  ```rust
  #[repr(C)]
  #[derive(Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
  struct CameraUniform {
      view_proj: [[f32; 4]; 4],
      position: [f32; 3],
      _pad: f32,           // vec3 + pad fills 16 bytes
  }
  ```

- Uniform buffers are limited to 64 KiB. For arrays that may be larger (instances, particles,
  lights), use storage buffers.
- Update small uniforms with `queue.write_buffer`. Do not create a new buffer each frame.
  Batch writes per frame where you can.

## Textures and samplers

- Use sRGB formats for colour textures, and linear formats for data (normals, masks).
- Generate mipmaps for textures that are minified in the scene, or they shimmer.
- Pixel art: nearest-neighbour magnification. Photos and 3D: linear with mipmaps.
- Keep one format convention per project and document it. A mismatch between a texture and its
  bind group layout gives black output on some GPUs and a validation error on others.

## Render passes

- Use one render pass per logical phase (opaque, transparent, UI, post-process). A new pass for
  one effect usually means the effect belongs in an existing pass.
- Label passes, encoders, buffers, and pipelines. Labels show up in GPU captures.
- Transparent objects sort back to front when order matters.
- Do not read GPU buffers back to the CPU on the frame path. It stalls the pipeline. If you
  need results, read them a few frames later.

## Debugging

- Turn on logs for wgpu and naga during development:

  ```bash
  RUST_LOG=wgpu_core=warn,wgpu_hal=warn,naga=info cargo run
  ```

- Shader errors surface when the pipeline is created. The message names the WGSL line.
- Capture a frame with RenderDoc. It shows bound resources, the exact values in each uniform,
  and each draw call.
- Hot-reload shaders by watching the files and rebuilding only the affected pipeline. The old
  pipeline stays alive until in-flight frames finish.

## Review checklist

- [ ] No wgpu types in gameplay code or ECS components.
- [ ] Pipelines are created once and cached.
- [ ] Resize handles zero size and recreates surface-sized targets only.
- [ ] `Lost` and `Outdated` reconfigure the surface.
- [ ] Bind group numbers come from one module and match the WGSL.
- [ ] Every uniform struct is `repr(C)` with `Pod` and matching padding.
- [ ] Colour formats are sRGB where intended.
- [ ] Passes and resources have labels.

## Sources

Rewritten from gamedev-wgpu-rendering and gamedev-wgsl-shaders by sunsided (no licence file
found, so their wording was not reused; see `research/SEARCH_LOG.md`). The techniques are
standard wgpu practice and were restated in new words.
