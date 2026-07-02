# frozen_string_literal: true

class BoardgameNightSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)

  # For batch-loading (see https://graphql-ruby.org/dataloader/overview.html)
  use GraphQL::Dataloader

  # Security: hardcoded query depth limit
  max_depth 15

  # Security: hardcoded query complexity limit
  max_complexity 400

  # Security: disable introspection in production
  disable_introspection_entry_points unless Rails.env.development? || Rails.env.test?

  # GraphQL-Ruby calls this when something goes wrong while running a query:
  def self.type_error(err, context)
    super
  end

  # Union and Interface Resolution
  def self.resolve_type(abstract_type, obj, ctx)
    raise(GraphQL::RequiredImplementationMissingError)
  end

  # Limit the size of incoming queries:
  max_query_string_tokens(5000)

  # Stop validating when it encounters this many errors:
  validate_max_errors(100)

  # Relay-style Object Identification:

  # Return a string UUID for `object`
  def self.id_from_object(object, type_definition, query_ctx)
    object.to_gid_param
  end

  # Given a string UUID, find the object
  def self.object_from_id(global_id, query_ctx)
    GlobalID.find(global_id)
  end
end
