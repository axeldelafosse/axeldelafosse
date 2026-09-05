import { plugin } from 'bun'
import { resolveShader } from '@vgpu/wgsl/runtime'

// Let the standalone GPU check execute the same TS modules and shaders as Next.
plugin({
  name: 'aurora-wgsl',
  setup(build) {
    build.onLoad({ filter: /\.wgsl$/ }, async ({ path }) => {
      const shader = await resolveShader({ entry: path, validate: 'off' })
      return {
        loader: 'js',
        contents: `export default ${JSON.stringify({ version: 1, wgsl: shader.wgsl })}`
      }
    })
  }
})
