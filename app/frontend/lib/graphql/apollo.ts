import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client'

const httpLink = createHttpLink({
  uri: '/graphql',
  credentials: 'same-origin',
})

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('bgg-night-token')
  if (token) {
    operation.setContext({
      headers: { Authorization: `Bearer ${token}` },
    })
  }
  return forward(operation)
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})
