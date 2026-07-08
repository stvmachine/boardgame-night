import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: ['app/frontend/**/*.graphql'],
  generates: {
    'app/frontend/generated/types.ts': {
      plugins: ['typescript']
    },
    'app/frontend/generated/operations.ts': {
      plugins: [
        { add: { content: "export * from './types';" } },
        'typescript-operations',
        'typescript-vue-apollo'
      ],
      config: {
        importSchemaTypesFrom: './app/frontend/generated/types',
        namespacedImportName: 'Types'
      }
    }
  }
}

export default config
