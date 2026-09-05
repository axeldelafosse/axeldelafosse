import { HomeFluidGrid, home_fluid_index } from "./home-fluid-common.wgsl";

@group(0) @binding(0) var<uniform> grid: HomeFluidGrid;
@group(0) @binding(1) var<storage, read> velocity: array<vec2f>;
@group(0) @binding(2) var<storage, read_write> divergence: array<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (any(id.xy >= grid.size)) { return; }

  let p = vec2i(id.xy);
  let last = vec2i(grid.size) - 1;
  let left = select(
    velocity[home_fluid_index(p - vec2i(1, 0), grid.size)].x,
    0.0,
    p.x == 0,
  );
  let right = select(
    velocity[home_fluid_index(p + vec2i(1, 0), grid.size)].x,
    0.0,
    p.x == last.x,
  );
  let bottom = select(
    velocity[home_fluid_index(p - vec2i(0, 1), grid.size)].y,
    0.0,
    p.y == 0,
  );
  let top = select(
    velocity[home_fluid_index(p + vec2i(0, 1), grid.size)].y,
    0.0,
    p.y == last.y,
  );
  divergence[home_fluid_index(p, grid.size)] =
    (right - left) * 0.5 * f32(grid.size.x)
      + (top - bottom) * 0.5 * f32(grid.size.y);
}
