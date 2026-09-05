import { HomeFluidGrid, home_fluid_index } from "./home-fluid-common.wgsl";

struct VorticityParams {
  dt: f32,
}

@group(0) @binding(0) var<uniform> grid: HomeFluidGrid;
@group(0) @binding(1) var<storage, read> src: array<vec2f>;
@group(0) @binding(2) var<storage, read> curl: array<f32>;
@group(0) @binding(3) var<storage, read_write> dst: array<vec2f>;
@group(0) @binding(4) var<uniform> params: VorticityParams;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (any(id.xy >= grid.size)) { return; }

  let p = vec2i(id.xy);
  let left = abs(curl[home_fluid_index(p - vec2i(1, 0), grid.size)]);
  let right = abs(curl[home_fluid_index(p + vec2i(1, 0), grid.size)]);
  let top = abs(curl[home_fluid_index(p + vec2i(0, 1), grid.size)]);
  let bottom = abs(curl[home_fluid_index(p - vec2i(0, 1), grid.size)]);
  let center = curl[home_fluid_index(p, grid.size)];

  var force = 0.5 * vec2f(top - bottom, right - left);
  force /= length(force) + 0.0001;
  force *= 9.0 * center;
  force.y *= -1.0;

  var velocity = src[home_fluid_index(p, grid.size)] + force * params.dt;
  let speed = length(velocity);
  if (speed > 2.5) { velocity *= 2.5 / speed; }
  dst[home_fluid_index(p, grid.size)] = velocity;
}
