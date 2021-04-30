module.exports = {
  purge: ['./src/**/*.tsx'],
  darkMode: 'media',
  theme: {
    fontFamily: {
      sans: ['monospace'],
      serif: ['monospace'],
      mono: ['monospace']
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
