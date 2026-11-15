---
name: wgsl-shader-craft
description: Write and debug WGSL shaders for wgpu, including fullscreen generative effects. Covers entry points, bind groups, uniform alignment against Rust structs, vertex and fragment conventions, noise and palette functions, the common WGSL pitfalls, and validating shader source. Use when creating or editing .wgsl files or the Rust code that feeds them uniforms.
---

# WGSL shader craft

WGSL is strict. It has no implicit conversions between scalars, and its layout rules differ
from Rust's. Most shader bugs are type errors, layout mismatches, or semantic mistakes that
compile fine and look wrong. This skill covers all three.

The working example is `examples/aurora.wgsl`, a fullscreen domain-warped aurora. It parses
cleanly and uses only standard WGSL.

## Shader files

- Keep shaders in files (`assets/shaders/*.wgsl`) during development, so they can be
  hot-reloaded. Use `include_str!` only for shaders that never change.
- Put shared functions (noise, palettes, tone mapping) in one file and combine them with a
  preprocessor such as `naga_oil` if the project needs modules. Otherwise copy them once and
  keep a single source of truth.

## Entry points and inputs

- `@vertex` returns `@builtin(position)`. `@fragment` returns `@location(0)` for colour.
- Vertex outputs and fragment inputs must match in name and type through `@location`
  indices. A mismatch shows up as a pipeline-creation error.
- The `@location` numbers in WGSL must match `shader_location` in the Rust vertex layout.

### Fullscreen triangle

For fullscreen effects, skip the vertex buffer. One oversized triangle covers the screen:

```wgsl
@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VsOut {
    let x = f32((i << 1u) & 2u);
    let y = f32(i & 2u);
    var out: VsOut;
    out.clip = vec4<f32>(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
    out.uv = vec2<f32>(x, y);   // uv in [0, 1] across the visible screen
    return out;
}
```

Draw it with `render_pass.draw(0..3, 0..1)`.

## Uniform layout

WGSL aligns members differently from a naive Rust struct. The rules that matter:

| Type | Size | Alignment |
|---|---|---|
| `f32`, `i32`, `u32` | 4 | 4 |
| `vec2<f32>` | 8 | 8 |
| `vec3<f32>` | 12 | 16 |
| `vec4<f32>` | 16 | 16 |
| `mat4x4<f32>` | 64 | 16 |

Any `vec3` is followed by 4 bytes of padding before the next member. The struct itself rounds up
to the largest member alignment.

Mirror the struct in Rust. The Rust side uses `#[repr(C)]` and `bytemuck::Pod` so that implicit
padding is a compile error:

```wgsl
struct Globals {
    resolution: vec2<f32>,   // offset 0
    time: f32,               // offset 8
    _pad0: f32,              // offset 12
    palette_a: vec4<f32>,    // offset 16
    palette_b: vec4<f32>,    // offset 32
    palette_c: vec4<f32>,    // offset 48
    palette_d: vec4<f32>,    // offset 64, total 80 bytes
};
@group(0) @binding(0) var<uniform> globals: Globals;
```

```rust
#[repr(C)]
#[derive(Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
pub struct Globals {
    pub resolution: [f32; 2],   // 0
    pub time: f32,              // 8
    pub _pad0: f32,             // 12
    pub palette: [[f32; 4]; 4], // 16..80
}
```

Rules:

- If the WGSL uses `vec3`, use `[f32; 4]` on the Rust side, or add explicit padding.
- Keep one binding map in Rust (group and binding numbers as constants). Use it to build the
  bind group layout and the shader's expectations.
- Uniforms are limited to 64 KiB. Use storage buffers for arrays.
- Pass time as a uniform. WGSL has no clock function.

## Writing the maths

### Hash and value noise

```wgsl
fn hash21(p: vec2<f32>) -> f32 {
    var q = fract(p * vec2<f32>(123.34, 456.21));
    q += dot(q, q + 45.32);
    return fract(q.x * q.y);
}

fn value_noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);   // smoothstep curve, no branches
    let a = hash21(i);
    let b = hash21(i + vec2<f32>(1.0, 0.0));
    let c = hash21(i + vec2<f32>(0.0, 1.0));
    let d = hash21(i + vec2<f32>(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
```

Use fBm (several octaves, each at double frequency and half amplitude) for organic detail.
Domain warping (feed noise output back into the coordinates of another noise call) produces
flowing, cloud-like forms.

### Palettes

A cosine palette gives smooth, controllable colour from one scalar:

```wgsl
fn cosine_palette(t: f32, a: vec3<f32>, b: vec3<f32>, c: vec3<f32>, d: vec3<f32>) -> vec3<f32> {
    return a + b * cos(6.28318 * (c * t + d));
}
```

Choose `a` as the midpoint and `b` as the amplitude, with each channel ending in `[0, 1]`. Set
`c` to control how many bands appear, and `d` to shift the hue.

## Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| `smoothstep(lo, hi, x)` with `lo >= hi` | Undefined result. Often a hard edge or noise | Write `1.0 - smoothstep(small, large, x)` |
| Integer division or mixed types | Pipeline error at creation | Cast explicitly: `f32(i)` |
| `vec3` in a uniform struct without padding | Garbage values, shifted fields | Pad to 16 bytes, mirror in Rust |
| Vertex `@location` mismatch | Pipeline error | Align names and locations |
| Using `dpdx` in non-uniform control flow | Undefined derivatives | Move the call outside the branch |
| Sampling with the wrong y direction | Upside-down image | Know whether uv.y runs down (texture) or up (maths) |
| Gamma applied twice | Washed-out colours | Output linear to an sRGB surface, and nothing more |
| Hard-coded magic numbers across files | Silent drift | Name them as constants or uniforms |

## Colour and output

- An sRGB surface format converts linear output to sRGB automatically. If the surface is not
  sRGB, convert in the shader with `pow(c, vec3(1.0 / 2.2))`.
- Tone-map high dynamic range before output. Reinhard, `c / (1.0 + c)`, is simple and
  predictable.
- Keep vignettes and falloffs multiplicative, after the main colour, so they stay visible on
  every palette.

## Validating shader source

Use a parser to catch syntax errors without a GPU. The `wgsl_reflect` npm package does this:

```bash
npm install wgsl_reflect
```

It checks syntax and reports entry points and function counts. It does not check types or
layout. Those errors appear when wgpu creates the pipeline, so run the app once after each
shader change. Keep `RUST_LOG=naga=info` on while you iterate.

## Review checklist

- [ ] Entry point names match the Rust pipeline descriptor.
- [ ] Every uniform struct has a Rust mirror with matching offsets.
- [ ] No `smoothstep` with `low >= high`.
- [ ] Time comes from a uniform.
- [ ] Output colour space matches the surface format.
- [ ] Shader source passes a parser check.

## Sources

Built on the conventions in gamedev-wgsl-shaders by sunsided (no licence found; read, not
reused). The aurora example and its maths were written for this repository. The cosine
palette is the widely used Inigo Quilez formulation.
