// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      // eslint ignore globs here
      '*.spec.ts',
    ],
  },
  {
    rules: {
      'no-console': 'off',
      // overrides
    },
  },
)
