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
@group(0) @binding(2) var<storage, read> src: array<vec4f>;
@group(0) @binding(3) var<storage, read> velocity: array<vec2f>;
@group(0) @binding(4) var<storage, read_write> dst: array<vec4f>;

fn sample_dye(p: vec2f) -> vec4f {
  let coord = clamp(
    p * vec2f(grid.dye_size) - 0.5,
    vec2f(0),
    vec2f(grid.dye_size) - 1.0,
  );
  let cell = vec2i(floor(coord));
  let blend = fract(coord);
  let bottom = mix(
    src[home_fluid_index(cell, grid.dye_size)],
    src[home_fluid_index(cell + vec2i(1, 0), grid.dye_size)],
    blend.x,
  );
  let top = mix(
    src[home_fluid_index(cell + vec2i(0, 1), grid.dye_size)],
    src[home_fluid_index(cell + vec2i(1, 1), grid.dye_size)],
    blend.x,
  );
  return mix(bottom, top, blend.y);
}

fn sample_velocity(p: vec2f) -> vec2f {
  let coord = clamp(
    p * vec2f(grid.size) - 0.5,
    vec2f(0),
    vec2f(grid.size) - 1.0,
  );
  let cell = vec2i(floor(coord));
  let blend = fract(coord);
  let bottom = mix(
    velocity[home_fluid_index(cell, grid.size)],
    velocity[home_fluid_index(cell + vec2i(1, 0), grid.size)],
    blend.x,
  );
  let top = mix(
    velocity[home_fluid_index(cell + vec2i(0, 1), grid.size)],
    velocity[home_fluid_index(cell + vec2i(1, 1), grid.size)],
    blend.x,
  );
  return mix(bottom, top, blend.y);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (any(id.xy >= grid.dye_size)) { return; }

  let cell = vec2i(id.xy);
  let p = home_fluid_cell_uv(cell, grid.dye_size);
  let aspect = f32(grid.size.x) / f32(grid.size.y);
  let backtrace = clamp(
    // A wake should drift away from the drawn path, not race after the cursor.
    p - sample_velocity(p) * input.dt * 0.55,
    0.5 / vec2f(grid.dye_size),
    1.0 - 0.5 / vec2f(grid.dye_size),
  );
  let decay = pow(0.982, input.dt * 60.0);
  var color = decay * sample_dye(backtrace);
  let emission = (1.0 - decay) / (1.0 - 0.982);

  color += vec4f(0.05, 0.48, 1.0, 0.0)
    * home_fluid_emitter_weight(p, input.idle_a, aspect)
    * 0.12 * emission;
  color += vec4f(1.0, 0.08, 0.55, 0.0)
    * home_fluid_emitter_weight(p, input.idle_b, aspect)
    * 0.115 * emission;

  var paint_weight = 0.0;
  var paint_color = vec3f(0.0);
  var paint_coverage = 0.0;
  var trail_coverage = 0.0;
  for (var i = 0u; i < min(input.stroke_count, 8u); i++) {
    let stroke = input.strokes[i];
    let pointer_strength = stroke.velocity_strength.z;
    let pointer_radius_squared = mix(
      0.000386,
      0.000589,
      clamp((pointer_strength - 1.3) / 0.7, 0.0, 1.0),
    );
    let weight = home_fluid_segment_weight(
      p,
      stroke.from_to.xy,
      stroke.from_to.zw,
      pointer_radius_squared,
      aspect,
    );
    let trail_weight = home_fluid_segment_weight(
      p,
      stroke.from_to.xy,
      stroke.from_to.zw,
      // Half the squared radius makes the luminous path about 30% narrower.
      pointer_radius_squared * 0.11,
      aspect,
    );
    let segment_length = length(
      (stroke.from_to.zw - stroke.from_to.xy) * vec2f(aspect, 1.0)
    );
    let movement_gate = smoothstep(0.0005, 0.003, segment_length);
    paint_weight += weight;
    paint_color += stroke.color.rgb * weight;
    paint_coverage = max(paint_coverage, weight * pointer_strength);
    trail_coverage = max(
      trail_coverage,
      stroke.color.a * movement_gate * trail_weight * pointer_strength,
    );
  }
  // Paint the union of the path once, even at corners or high polling rates.
  color += vec4f(
    paint_color / max(paint_weight, 1e-6) * paint_coverage,
    trail_coverage,
  ) * 0.6 * emission;

  dst[home_fluid_index(cell, grid.dye_size)] = clamp(
    color,
    vec4f(0),
    vec4f(4),
  );
}
