import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { BatchHttpLink } from '@apollo/client/link/batch-http'

const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 50,    // batch queries within 50ms
  batchMax: 25,         // max queries per batch
})

export const apolloClient = new ApolloClient({
  link: batchLink,      // GQL-04: Apollo batched queries → Schema.multiplex
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
})
