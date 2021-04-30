module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.tsx'],
  darkMode: 'media',
  theme: {
    fontFamily: {
      sans: ['monospace'],
      serif: ['monospace'],
      mono: ['monospace']
    },
    cursor: {
      auto: 'auto',
      default: 'default',
      pointer: 'pointer',
      wait: 'wait',
      text: 'text',
      move: 'move',
      'not-allowed': 'not-allowed',
      crosshair: 'crosshair',
      'zoom-in': 'zoom-in',
      'w-resize': 'w-resize',
      alias: 'alias'
    },
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: [],
  corePlugins: {
    preflight: true
  }
};
