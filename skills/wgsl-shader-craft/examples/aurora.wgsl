// Fullscreen aurora: domain-warped fBm bands coloured by a cosine palette.
// Written for this repo. Uniform layout matches `Globals` in the Rust example in SKILL.md.
// Output is linear. Use an sRGB surface format, or convert before writing.

struct Globals {
    resolution: vec2<f32>,
    time: f32,
    _pad0: f32,
    // Cosine palette (Inigo Quilez form): a + b * cos(2pi * (c * t + d))
    palette_a: vec4<f32>,
    palette_b: vec4<f32>,
    palette_c: vec4<f32>,
    palette_d: vec4<f32>,
};

@group(0) @binding(0) var<uniform> globals: Globals;

struct VsOut {
    @builtin(position) clip: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

// One oversized triangle covers the whole screen. No vertex buffer needed.
@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VsOut {
    let x = f32((i << 1u) & 2u);
    let y = f32(i & 2u);
    var out: VsOut;
    out.clip = vec4<f32>(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
    out.uv = vec2<f32>(x, y);
    return out;
}

fn hash21(p: vec2<f32>) -> f32 {
    var q = fract(p * vec2<f32>(123.34, 456.21));
    q += dot(q, q + 45.32);
    return fract(q.x * q.y);
}

fn value_noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    let a = hash21(i);
    let b = hash21(i + vec2<f32>(1.0, 0.0));
    let c = hash21(i + vec2<f32>(0.0, 1.0));
    let d = hash21(i + vec2<f32>(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p_in: vec2<f32>) -> f32 {
    var p = p_in;
    var v = 0.0;
    var amp = 0.5;
    for (var i = 0; i < 5; i++) {
        v += amp * value_noise(p);
        p = p * 2.03 + vec2<f32>(17.1, 9.2);
        amp *= 0.5;
    }
    return v;
}

fn cosine_palette(t: f32, a: vec3<f32>, b: vec3<f32>, c: vec3<f32>, d: vec3<f32>) -> vec3<f32> {
    return a + b * cos(6.28318 * (c * t + d));
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
    let aspect = globals.resolution.x / globals.resolution.y;
    // Flip y so that +y is up, and keep uv in [0, 1] across the screen.
    let uv = vec2<f32>(in.uv.x, 1.0 - in.uv.y);
    let p = vec2<f32>((uv.x - 0.5) * aspect, uv.y - 0.5) * 3.0;
    let t = globals.time * 0.05;

    // Two-step domain warp: noise moves the coordinates used for more noise.
    let q = vec2<f32>(
        fbm(p + vec2<f32>(0.0, t)),
        fbm(p + vec2<f32>(5.2, 1.3) - vec2<f32>(t)),
    );
    let r = fbm(p + 2.0 * q + vec2<f32>(1.7, 9.2) + vec2<f32>(0.15 * t));

    // Bands: keep edges soft. smoothstep needs low < high.
    let band = smoothstep(0.2, 0.9, r);
    let hue = r * 1.2 + q.x * 0.6 + t;

    let col = cosine_palette(
        hue,
        globals.palette_a.xyz,
        globals.palette_b.xyz,
        globals.palette_c.xyz,
        globals.palette_d.xyz,
    );

    // Vignette written as 1 - smoothstep(low, high, x) with low < high.
    let vign = 1.0 - smoothstep(0.35, 1.0, length(uv - vec2<f32>(0.5)) * 2.0);

    let rgb = col * (0.15 + 0.85 * band) * vign;
    return vec4<f32>(rgb, 1.0);
}
