import { HomeFluidGrid, home_fluid_index } from "./home-fluid-common.wgsl";

struct HomeFluidPressureParams {
  decay: f32,
}

@group(0) @binding(0) var<uniform> grid: HomeFluidGrid;
@group(0) @binding(1) var<uniform> params: HomeFluidPressureParams;
@group(0) @binding(2) var<storage, read> src: array<f32>;
@group(0) @binding(3) var<storage, read> divergence: array<f32>;
@group(0) @binding(4) var<storage, read_write> dst: array<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (any(id.xy >= grid.size)) { return; }

  let p = vec2i(id.xy);
  let index = home_fluid_index(p, grid.size);
  let center = src[index];
  let last = vec2i(grid.size) - 1;
  let left = select(
    src[home_fluid_index(p - vec2i(1, 0), grid.size)],
    center,
    p.x == 0,
  ) * params.decay;
  let right = select(
    src[home_fluid_index(p + vec2i(1, 0), grid.size)],
    center,
    p.x == last.x,
  ) * params.decay;
  let bottom = select(
    src[home_fluid_index(p - vec2i(0, 1), grid.size)],
    center,
    p.y == 0,
  ) * params.decay;
  let top = select(
    src[home_fluid_index(p + vec2i(0, 1), grid.size)],
    center,
    p.y == last.y,
  ) * params.decay;
  let horizontal_weight = f32(grid.size.x * grid.size.x);
  let vertical_weight = f32(grid.size.y * grid.size.y);
  dst[index] = (
    (left + right) * horizontal_weight
      + (bottom + top) * vertical_weight
      - divergence[index]
  ) / (2.0 * horizontal_weight + 2.0 * vertical_weight);
}
