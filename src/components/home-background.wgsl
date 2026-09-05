import { fbmSimplex3d, simplex3d } from "@vgpu/wgsl-std/noise/simplex";
import { home_fluid_index } from "./home-fluid-common.wgsl";

struct DisplayConfig {
  output_size: vec2f,
  time: f32,
  aspect: f32,
  logo_well: vec4f,
  post_well: vec4f,
}

const FLUID_GRID_SIZE = vec2u(128, 72);
const FLUID_DYE_SIZE = vec2u(512, 288);
const FLUID_ASPECT = 1.7777778;

@group(0) @binding(0) var<uniform> config: DisplayConfig;
@group(0) @binding(1) var<storage, read> dye: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocity: array<vec2f>;

fn sample_dye(p: vec2f) -> vec4f {
  let coord = clamp(
    p * vec2f(FLUID_DYE_SIZE) - 0.5,
    vec2f(0),
    vec2f(FLUID_DYE_SIZE) - 1.0,
  );
  let cell = vec2i(floor(coord));
  let blend = fract(coord);
  let bottom = mix(
    dye[home_fluid_index(cell, FLUID_DYE_SIZE)],
    dye[home_fluid_index(cell + vec2i(1, 0), FLUID_DYE_SIZE)],
    blend.x,
  );
  let top = mix(
    dye[home_fluid_index(cell + vec2i(0, 1), FLUID_DYE_SIZE)],
    dye[home_fluid_index(cell + vec2i(1, 1), FLUID_DYE_SIZE)],
    blend.x,
  );
  return mix(bottom, top, blend.y);
}

fn sample_velocity(p: vec2f) -> vec2f {
  let coord = clamp(
    p * vec2f(FLUID_GRID_SIZE) - 0.5,
    vec2f(0),
    vec2f(FLUID_GRID_SIZE) - 1.0,
  );
  let cell = vec2i(floor(coord));
  let blend = fract(coord);
  let bottom = mix(
    velocity[home_fluid_index(cell, FLUID_GRID_SIZE)],
    velocity[home_fluid_index(cell + vec2i(1, 0), FLUID_GRID_SIZE)],
    blend.x,
  );
  let top = mix(
    velocity[home_fluid_index(cell + vec2i(0, 1), FLUID_GRID_SIZE)],
    velocity[home_fluid_index(cell + vec2i(1, 1), FLUID_GRID_SIZE)],
    blend.x,
  );
  return mix(bottom, top, blend.y);
}

fn smooth_velocity(p: vec2f) -> vec2f {
  // Reconstruct a soft displacement field from the coarse simulation grid.
  let texel = 1.5 / vec2f(FLUID_GRID_SIZE);
  return sample_velocity(p) * 0.4
    + (
      sample_velocity(p + vec2f(texel.x, 0.0))
        + sample_velocity(p - vec2f(texel.x, 0.0))
        + sample_velocity(p + vec2f(0.0, texel.y))
        + sample_velocity(p - vec2f(0.0, texel.y))
    ) * 0.15;
}

fn screen_to_fluid_uv(p: vec2f) -> vec2f {
  if (config.aspect < FLUID_ASPECT) {
    return vec2f(
      0.5 + (p.x - 0.5) * config.aspect / FLUID_ASPECT,
      p.y,
    );
  }

  return vec2f(
    p.x,
    0.5 + (p.y - 0.5) * FLUID_ASPECT / config.aspect,
  );
}

fn fluid_to_screen_velocity(value: vec2f) -> vec2f {
  if (config.aspect < FLUID_ASPECT) {
    return vec2f(value.x * FLUID_ASPECT / config.aspect, value.y);
  }

  return vec2f(value.x, value.y * config.aspect / FLUID_ASPECT);
}

fn gravity_well(
  uv: vec2f,
  well: vec4f,
  peak_pull: f32,
  curl_strength: f32,
) -> vec2f {
  let screen_scale = vec2f(config.aspect, 1.0);
  let delta = (uv - well.xy) * screen_scale;
  let distance = length(delta);
  let normalized_distance = distance / max(well.z, 1e-4);
  let profile = 1.6487213
    * normalized_distance
    * exp(-0.5 * normalized_distance * normalized_distance)
    * (1.0 - smoothstep(1.55, 2.25, normalized_distance));
  let radial = delta / max(distance, 1e-5);
  let tangent = vec2f(-radial.y, radial.x);
  let curl = curl_strength
    * (1.0 - smoothstep(0.72, 1.75, normalized_distance));

  return (radial + tangent * curl)
    / screen_scale
    * profile
    * well.w
    * peak_pull;
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let fluid_uv = screen_to_fluid_uv(uv);
  let fluid_sample = sample_dye(fluid_uv);
  let trail_presence = 1.0 - exp(-fluid_sample.a * 0.85);
  let trail_core = smoothstep(0.02, 0.6, trail_presence);
  let screen_scale = vec2f(config.aspect, 1.0);
  let flow = fluid_to_screen_velocity(smooth_velocity(fluid_uv));
  let metric_flow = flow * screen_scale;
  let cursor_response = smoothstep(0.02, 0.5, length(metric_flow));
  let raw_displacement = metric_flow * (0.024 + cursor_response * 0.13);
  // Soft saturation limits stretching without hard clipping. The bend always
  // follows the fluid; local clock shifts and gradient normals create tears.
  let flow_displacement = raw_displacement
    / (1.0 + length(raw_displacement) / 0.035)
    / screen_scale;
  let raw_gravity = gravity_well(uv, config.logo_well, 0.02, 0.48)
    + gravity_well(uv, config.post_well, 0.014, -0.32);
  let gravity_length = length(raw_gravity * screen_scale);
  let capped_gravity = raw_gravity * min(
    1.0,
    0.024 / max(gravity_length, 1e-5),
  );
  let seam_guard = 1.0
    - 0.92 * smoothstep(0.06, 0.24, trail_presence);
  let warped_uv = uv
    - flow_displacement
    + capped_gravity * seam_guard;

  var position = warped_uv * 2.0 - 1.0;
  position.x *= config.aspect;

  let time = config.time;
  let orbit = vec2f(cos(time), sin(time));
  let drift = vec3f(position * 0.68 + orbit * 0.12, orbit.y * 0.45);
  let warp = vec2f(
    simplex3d(drift),
    simplex3d(drift + vec3f(17.2, 31.1, 9.4)),
  );
  let field = fbmSimplex3d(
    vec3f(position * 0.82 + warp * 0.3, orbit.x * 0.35),
    4,
    2.03,
    0.5,
  );
  let ribbon = position.y
    + sin(position.x * 1.35 + time + warp.x) * 0.2
    + field * 0.36;

  let violet = exp(-abs(ribbon) * 2.7);
  let cyan_distance = abs(ribbon - 0.38 + warp.y * 0.08);
  let magenta_distance = abs(
    ribbon + 0.52 + sin(position.x * 2.1 - time) * 0.08
  );
  let cyan = exp(-cyan_distance * 6.5);
  let magenta = exp(-magenta_distance * 5.2);
  let horizon = exp(-abs(position.y + 0.08) * 1.5);

  var color = vec3f(0.018, 0.007, 0.065);
  // A lighter palette, with the original ribbon shapes and dark base intact.
  color += vec3f(0.39, 0.06, 0.8) * violet * 1.1;
  color += vec3f(0.065, 0.62, 0.84) * cyan * 0.7;
  color += vec3f(0.9, 0.075, 0.48) * magenta * 0.62;
  color += vec3f(0.095, 0.135, 0.35) * horizon * 0.42;

  // A soft haze around the narrow painted path. Only deposited trail alpha
  // feeds it, so it keeps drifting/fading rather than following a stopped mouse.
  let haze_radius = vec2f(0.006 / FLUID_ASPECT, 0.006);
  let haze_density = fluid_sample.a * 0.36 + (
    sample_dye(fluid_uv + vec2f(haze_radius.x, 0.0)).a
      + sample_dye(fluid_uv - vec2f(haze_radius.x, 0.0)).a
      + sample_dye(fluid_uv + vec2f(0.0, haze_radius.y)).a
      + sample_dye(fluid_uv - vec2f(0.0, haze_radius.y)).a
  ) * 0.16;
  let haze = pow(1.0 - exp(-haze_density * 0.85), 0.8);
  let fold_phase = dot(position, vec2f(6.0, -3.5))
    + warp.x * 1.3 + time * 0.35;
  let fold = 0.94 + 0.06 * sin(fold_phase * 1.7);
  let wake_palette = mix(
    vec3f(0.015, 0.95, 1.2),
    vec3f(1.2, 0.035, 0.55),
    // Follow the closest visible aurora core, with a soft handoff between them.
    smoothstep(-0.14, 0.14, cyan_distance - magenta_distance),
  );
  let light_core = trail_core * trail_core;
  // Keep the nearby aurora's hue, with less solid light and softer shoulders.
  color *= 1.0 - light_core * 0.14;
  color += wake_palette * (light_core * fold * 0.24 + haze * 0.5);

  let screen_position = uv * 2.0 - 1.0;
  let vignette = 1.0 - smoothstep(
    0.68,
    1.72,
    length(screen_position * vec2f(0.72, 1.0)),
  );
  color *= mix(0.68, 1.1, vignette);
  color = color / (color + vec3f(0.82));
  color = pow(color, vec3f(0.88));

  return vec4f(color, 1.0);
}
