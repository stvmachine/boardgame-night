import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink, split } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const httpLink = createHttpLink({
	uri: "/graphql",
	credentials: "same-origin",
});

const authLink = setContext((_, { headers }) => {
	const token = localStorage.getItem("bgg-night-token");
	return {
		headers: {
			...headers,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	};
});

// WebSocket link for GraphQL subscriptions via ActionCable
const wsClient = createClient({
	url: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/cable`,
	connectionParams: () => {
		const token = localStorage.getItem("bgg-night-token");
		return { token };
	},
	retryAttempts: Infinity,
	shouldRetry: () => true,
});

const wsLink = new GraphQLWsLink(wsClient);

// Split traffic: subscriptions → WebSocket, everything else → HTTP
const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return definition.kind === "OperationDefinition" && definition.operation === "subscription";
	},
	wsLink,
	authLink.concat(httpLink),
);

export const apolloClient = new ApolloClient({
	link: splitLink,
	cache: new InMemoryCache(),
});
