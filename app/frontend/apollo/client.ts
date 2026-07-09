import { ApolloClient, InMemoryCache, split } from '@apollo/client/core'
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import { setContext } from '@apollo/client/link/context'
import { createConsumer } from '@rails/actioncable'
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink'
import { useAuthStore } from '@/stores/auth'

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

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore().token
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const link = split(isSubscription, actionCableLink, authLink.concat(batchLink))

export const apolloClient = new ApolloClient({
  link,                 // HTTP batched queries / Action Cable subscriptions
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
})