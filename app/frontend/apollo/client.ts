import { ApolloClient, InMemoryCache, split } from '@apollo/client/core'
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import { createConsumer } from '@rails/actioncable'
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink'

const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 50,    // batch queries within 50ms
  batchMax: 25,         // max queries per batch
})

const cable = createConsumer('/cable')
const actionCableLink = new ActionCableLink({ cable })

const isSubscription = ({ query }: { query: any }) =>
  query.definitions.some(
    (def: any) => def.kind === 'OperationDefinition' && def.operation === 'subscription'
  )

const link = split(isSubscription, actionCableLink, batchLink)

export const apolloClient = new ApolloClient({
  link,                 // HTTP batched queries / Action Cable subscriptions
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
})
