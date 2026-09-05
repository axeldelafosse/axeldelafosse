import { HomeFluidGrid, home_fluid_index } from "./home-fluid-common.wgsl";

@group(0) @binding(0) var<uniform> grid: HomeFluidGrid;
@group(0) @binding(1) var<storage, read> src: array<vec2f>;
@group(0) @binding(2) var<storage, read> pressure: array<f32>;
@group(0) @binding(3) var<storage, read_write> dst: array<vec2f>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (any(id.xy >= grid.size)) { return; }

  let p = vec2i(id.xy);
  let last = vec2i(grid.size) - 1;
  let center = pressure[home_fluid_index(p, grid.size)];
  let left = select(
    pressure[home_fluid_index(p - vec2i(1, 0), grid.size)],
    center,
    p.x == 0,
  );
  let right = select(
    pressure[home_fluid_index(p + vec2i(1, 0), grid.size)],
    center,
    p.x == last.x,
  );
  let bottom = select(
    pressure[home_fluid_index(p - vec2i(0, 1), grid.size)],
    center,
    p.y == 0,
  );
  let top = select(
    pressure[home_fluid_index(p + vec2i(0, 1), grid.size)],
    center,
    p.y == last.y,
  );
  var velocity = src[home_fluid_index(p, grid.size)] - vec2f(
    (right - left) * 0.5 * f32(grid.size.x),
    (top - bottom) * 0.5 * f32(grid.size.y),
  );

  if (p.x == 0 && velocity.x < 0.0) { velocity.x = 0.0; }
  if (p.x == last.x && velocity.x > 0.0) { velocity.x = 0.0; }
  if (p.y == 0 && velocity.y < 0.0) { velocity.y = 0.0; }
  if (p.y == last.y && velocity.y > 0.0) { velocity.y = 0.0; }

  let speed = length(velocity);
  if (speed > 2.5) { velocity *= 2.5 / speed; }
  dst[home_fluid_index(p, grid.size)] = velocity;
}
