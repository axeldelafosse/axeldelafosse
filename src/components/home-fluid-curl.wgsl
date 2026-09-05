import { HomeFluidGrid, home_fluid_index } from "./home-fluid-common.wgsl";

@group(0) @binding(0) var<uniform> grid: HomeFluidGrid;
@group(0) @binding(1) var<storage, read> velocity: array<vec2f>;
@group(0) @binding(2) var<storage, read_write> curl: array<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (any(id.xy >= grid.size)) { return; }

  let p = vec2i(id.xy);
  let left = velocity[home_fluid_index(p - vec2i(1, 0), grid.size)].y;
  let right = velocity[home_fluid_index(p + vec2i(1, 0), grid.size)].y;
  let top = velocity[home_fluid_index(p + vec2i(0, 1), grid.size)].x;
  let bottom = velocity[home_fluid_index(p - vec2i(0, 1), grid.size)].x;
  curl[home_fluid_index(p, grid.size)] = 0.5 * (right - left - top + bottom);
}
