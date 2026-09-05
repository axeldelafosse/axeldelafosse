import {
  HomeFluidGrid,
  HomeFluidInput,
  home_fluid_cell_uv,
  home_fluid_emitter_weight,
  home_fluid_index,
  home_fluid_segment_weight,
} from "./home-fluid-common.wgsl";

@group(0) @binding(0) var<uniform> grid: HomeFluidGrid;
@group(0) @binding(1) var<uniform> input: HomeFluidInput;
@group(0) @binding(2) var<storage, read> src: array<vec2f>;
@group(0) @binding(3) var<storage, read_write> dst: array<vec2f>;

fn sample_velocity(p: vec2f) -> vec2f {
  let coord = clamp(
    p * vec2f(grid.size) - 0.5,
    vec2f(0),
    vec2f(grid.size) - 1.0,
  );
  let cell = vec2i(floor(coord));
  let blend = fract(coord);
  let bottom = mix(
    src[home_fluid_index(cell, grid.size)],
    src[home_fluid_index(cell + vec2i(1, 0), grid.size)],
    blend.x,
  );
  let top = mix(
    src[home_fluid_index(cell + vec2i(0, 1), grid.size)],
    src[home_fluid_index(cell + vec2i(1, 1), grid.size)],
    blend.x,
  );
  return mix(bottom, top, blend.y);
}

fn gravity_force(
  p: vec2f,
  well: vec4f,
  aspect: f32,
  twist: f32,
) -> vec2f {
  let metric = (well.xy - p) * vec2f(aspect, 1.0);
  let distance_squared = dot(metric, metric);
  let radius_squared = max(well.z * well.z, 0.0004);
  let direction = metric / sqrt(distance_squared + 0.0009);
  let radial = vec2f(direction.x / aspect, direction.y);
  let tangent = vec2f(-direction.y / aspect, direction.x);
  return well.w
    * exp(-distance_squared / radius_squared)
    * (radial + twist * tangent);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (any(id.xy >= grid.size)) { return; }

  let cell = vec2i(id.xy);
  let p = home_fluid_cell_uv(cell, grid.size);
  let aspect = f32(grid.size.x) / f32(grid.size.y);
  let dt = input.dt;
  let source_velocity = src[home_fluid_index(cell, grid.size)];
  let backtrace = clamp(
    p - dt * source_velocity,
    0.5 / vec2f(grid.size),
    1.0 - 0.5 / vec2f(grid.size),
  );
  var velocity = pow(0.98, dt * 60.0) * sample_velocity(backtrace);

  let weight_a = home_fluid_emitter_weight(p, input.idle_a, aspect);
  let weight_b = home_fluid_emitter_weight(p, input.idle_b, aspect);
  let time = input.time;
  let tangent_a = vec2f(
    0.28 * 0.73 * cos(0.73 * time),
    0.22 * 1.09 * cos(1.09 * time + 0.4),
  );
  let tangent_b = vec2f(
    0.26 * 0.61 * cos(0.61 * time + 3.14159265),
    0.24 * 0.97 * cos(0.97 * time + 2.1),
  );
  velocity += dt * (
    weight_a * (2.6 * tangent_a + 2.0 * vec2f(-tangent_a.y, tangent_a.x))
      + weight_b * (2.6 * tangent_b - 2.0 * vec2f(-tangent_b.y, tangent_b.x))
  );

  velocity += dt * 1.2 * (
    gravity_force(p, input.logo_well, aspect, 0.22)
      + 0.78 * gravity_force(p, input.post_well, aspect, -0.16)
  );

  var pointer_coverage = 0.0;
  var pointer_weight = 0.0;
  var pointer_target = vec2f(0.0);
  for (var i = 0u; i < min(input.stroke_count, 8u); i++) {
    let stroke = input.strokes[i];
    let pointer_velocity = stroke.velocity_strength.xy;
    let pointer_strength = stroke.velocity_strength.z;
    let pointer_radius_squared = mix(
      0.000686,
      0.001048,
      clamp((pointer_strength - 1.3) / 0.7, 0.0, 1.0),
    );
    let weight = home_fluid_segment_weight(
      p,
      stroke.from_to.xy,
      stroke.from_to.zw,
      pointer_radius_squared,
      aspect,
    );
    // One continuous push along the path. Overlapping coalesced segments
    // must not stack impulses or invent a vortex at each sample's endpoint.
    pointer_coverage = max(pointer_coverage, weight);
    pointer_weight += weight;
    pointer_target += weight * pointer_velocity * pointer_strength * 0.62;
  }
  let coupling = 1.0 - exp(-36.0 * dt * pointer_coverage);
  velocity = mix(
    velocity,
    pointer_target / max(pointer_weight, 1e-6),
    coupling,
  );

  let speed = length(velocity);
  if (speed > 3.8) { velocity *= 3.8 / speed; }
  dst[home_fluid_index(cell, grid.size)] = velocity;
}
