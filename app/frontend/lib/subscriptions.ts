import { createConsumer } from "@rails/actioncable";

// ActionCable consumer for GraphQL subscriptions.
// Connects to the Rails ActionCable endpoint at /cable.
// Gracefully degrades if the server doesn't support ActionCable yet.
export const consumer = createConsumer("/cable");
