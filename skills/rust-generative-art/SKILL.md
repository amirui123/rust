---
name: rust-generative-art
description: Create original generative and algorithmic art in Rust, as PNG, SVG, or real-time output. Covers writing an algorithmic philosophy first, seeded reproducible randomness, noise fields, flow fields, Poisson-disc sampling, cosine palettes, composition and craft quality, and exporting at print resolution. Use when asked to make generative art, procedural posters, algorithmic patterns, or any computed visual in Rust.
---

# Generative art in Rust

Generative art is designed in two stages. First you write what the system is trying to
express. Then you write the code that expresses it. Skipping the first stage produces random
noise with a nice palette. Skip the second and the idea never reaches the image.

Make original work. Do not reproduce a known artist's composition, signature motif, or
recognisable style.

## Stage 1: the philosophy (write it down, 4 to 6 short paragraphs)

Name the piece in one or two words (for example "Slow Erosion" or "Quiet Current"). Then
describe, in plain language:

1. **The process.** What repeats, grows, or flows? Particles, a field, a recursive split, a
   growth rule?
2. **The order and the chaos.** Where does structure come from, and where is it allowed to
   break?
3. **The composition.** Where is the visual weight? What is left empty?
4. **The palette and its logic.** Why these colours, and how do they map to the process?
5. **The variation.** Which parameters change between seeds, and which stay fixed so the
   piece still reads as one work?

Keep it short. The philosophy guides every later choice, so each sentence should constrain
something.

## Stage 2: the implementation

### Reproducibility

Every output must be reproducible from a seed and a parameter struct.

```rust
use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha8Rng;

pub struct Params {
    pub seed: u64,
    pub width: u32,
    pub height: u32,
    pub particle_count: usize,
    pub noise_scale: f64,
}

pub fn render(p: &Params) -> Vec<Stroke> {
    let mut rng = ChaCha8Rng::seed_from_u64(p.seed);
    // All randomness comes from `rng`. No thread_rng, no time-based seeds.
    let x: f64 = rng.random_range(0.0..p.width as f64);
    // ...
    vec![]
}
```

Use a stable generator such as `ChaCha8Rng`. Do not rely on `thread_rng`, because its output
is not reproducible. Note that the `rand` API has changed across versions: `random_range` is
the current name, while older code uses `gen_range`. Check the version in `Cargo.lock`.

### Cosine palettes

Pure maths, no dependencies, and easy to tune:

```rust
/// Cosine palette: a + b * cos(2*pi * (c * t + d)), per channel.
pub fn cosine_palette(t: f32, a: [f32; 3], b: [f32; 3], c: [f32; 3], d: [f32; 3]) -> [f32; 3] {
    let tau = std::f32::consts::TAU;
    let channel = |i: usize| a[i] + b[i] * (tau * (c[i] * t + d[i])).cos();
    [channel(0), channel(1), channel(2)]
}
```

Keep the output in `[0, 1]` by choosing `a` and `b` so that `a ± b` stays inside that range.
Clamp before converting to 8-bit colour.

### Noise and fields

- Value noise or simplex noise gives organic variation. For a dependency-free start, use the
  hash-based value noise in the `wgsl-shader-craft` skill, ported to Rust.
- A **flow field** samples a noise-derived angle at each point and moves particles along it.
  Store trails as line segments, not pixels, so you can export vector output.
- **Poisson-disc sampling** (Bridson's algorithm) places points with even spacing and no
  clumps. It is better than uniform random for dots, stones, and stippling.
- **L-systems** suit branching structures. Keep the rule set small and the depth bounded.
- Bound every loop. A generator that can run forever will hang on an unlucky seed.

### Exporting

| Target | Tool | Notes |
|---|---|---|
| PNG, raster | `tiny-skia` (CPU), or render to a buffer and encode with `image` | Good for posters and prints |
| SVG, vector | `svg` crate to write, `resvg` to rasterise | Keeps lines crisp at any size |
| Real-time | wgpu fragment shader, see `wgsl-shader-craft` | For animation and interaction |

Export at print resolution from the start. A 300 DPI A3 poster is about 3508 by 4961 pixels.
Preview at a smaller size, but make the final render at full size and check the edges.

## Composition and craft

- **Margins.** Keep the main structure at least 5 to 8 percent in from the edge, unless bleed
  is intended.
- **Negative space.** Empty areas are part of the piece. Decide where they go before filling
  the rest.
- **Limited palette.** Three to five colours read as a deliberate choice. Dozens read as noise.
- **Layering.** Draw background, then structure, then accents. Use alpha for depth, and keep
  the highest contrast for the focal point.
- **Texture.** A very faint grain (1 to 2 percent) can make digital flats feel printed. Use it
  sparingly.
- **Tune at several scales.** Check the piece at thumbnail size and at full size. Patterns that
  look good large can turn into mud when small.
- **Make the decisions visible.** If a parameter was chosen by eye, record the value and why.

## Testing

- A golden-hash test: render a fixed seed at a small size, hash the output, and compare. A
  change in the hash means the output changed, which is either intended (update the golden) or
  a bug.
- Property tests: every point is inside the canvas, every colour is in range, and the number of
  elements is within the bound you set.
- Run each seed you ship at both preview and final size once.

## Review checklist

- [ ] The philosophy is written and each choice traces back to it.
- [ ] Output is fully determined by the seed and parameter struct.
- [ ] Every loop is bounded.
- [ ] Palette has a clear logic and no stray colours.
- [ ] Composition has margins, intentional negative space, and a focal point.
- [ ] Final export is at print resolution, and its edges were inspected.

## Sources

Adapted from anthropics/skills algorithmic-art and canvas-design (Apache-2.0). The approach of
"philosophy first, then implementation" comes from there. The Rust implementation notes, the
export table, and the testing approach were written for this repository.
