import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: ['app/frontend/**/*.{ts,tsx}'],
  generates: {
    'app/frontend/generated/types.ts': {
      plugins: ['typescript']
    },
    'app/frontend/generated/operations.ts': {
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true
      }
    }
  }
}

export default config
