import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'design-lab/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),
]
