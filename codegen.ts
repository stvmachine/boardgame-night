import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: ['app/frontend/**/*.graphql'],
  generates: {
    'app/frontend/generated/operations.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-vue-apollo']
    }
  }
}

export default config
