export struct HomeFluidGrid {
  size: vec2u,
  dye_size: vec2u,
}

export struct HomeFluidStroke {
  from_to: vec4f,
  velocity_strength: vec4f,
  color: vec4f,
}

export struct HomeFluidInput {
  time: f32,
  dt: f32,
  stroke_count: u32,
  idle_a: vec4f,
  idle_b: vec4f,
  logo_well: vec4f,
  post_well: vec4f,
  strokes: array<HomeFluidStroke, 8>,
}

export fn home_fluid_index(p: vec2i, size: vec2u) -> u32 {
  let cell = clamp(p, vec2i(0), vec2i(size) - 1);
  return u32(cell.y) * size.x + u32(cell.x);
}

export fn home_fluid_cell_uv(p: vec2i, size: vec2u) -> vec2f {
  return (vec2f(p) + 0.5) / vec2f(size);
}

export fn home_fluid_segment_weight(
  p: vec2f,
  a: vec2f,
  b: vec2f,
  radius_squared: f32,
  aspect: f32,
) -> f32 {
  let scale = vec2f(aspect, 1.0);
  let point = p * scale;
  let origin = a * scale;
  let delta = (b - a) * scale;
  let progress = clamp(
    dot(point - origin, delta) / max(dot(delta, delta), 1e-7),
    0.0,
    1.0,
  );
  let offset = point - (origin + progress * delta);
  return exp(-dot(offset, offset) / radius_squared);
}

export fn home_fluid_emitter_weight(
  p: vec2f,
  emitter: vec4f,
  aspect: f32,
) -> f32 {
  let offset = (p - emitter.xy) * vec2f(aspect, 1.0);
  return exp(-dot(offset, offset) / emitter.w) * emitter.z;
}
