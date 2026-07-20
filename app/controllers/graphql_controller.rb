# frozen_string_literal: true

class GraphqlController < ApplicationController
  include Authentication

  # If accessing from outside this domain, nullify the session
  # This allows for outside API access while preventing CSRF attacks,
  # but you'll have to authenticate your user separately
  # protect_from_forgery with: :null_session

  def execute
    if params[:_json]
      # Apollo batch mode: params[:_json] is an array of queries
      queries = params[:_json].map do |param|
        {
          query: param[:query],
          operation_name: param[:operationName],
          variables: ensure_hash(param[:variables]),
          context: {
            current_user: Current.user,
            current_session: Current.session
          }
        }
      end
      result = BoardgameNightSchema.multiplex(queries)
      render json: result
    else
      # Single query mode
      variables = ensure_hash(params[:variables])
      query = params[:query]
      operation_name = params[:operationName]
      result = BoardgameNightSchema.execute(query, variables: variables,
        context: { current_user: Current.user, current_session: Current.session },
        operation_name: operation_name)
      render json: result
    end
  rescue StandardError => e
    logger.error "[GraphqlController] #{e.message}"
    logger.error e.backtrace.first(10).join("\n")
    render json: {
      errors: [ { message: "Internal server error" } ],
      data: {}
    }, status: 500
  end

  private

    # Handle form data, JSON body, or a blank value
    def ensure_hash(variables_param)
      case variables_param
      when String
        if variables_param.present?
          JSON.parse(variables_param, max_nesting: 100) || {}
        else
          {}
        end
      when Hash
        variables_param
      when ActionController::Parameters
        variables_param.to_unsafe_hash
      when nil
        {}
      else
        raise ArgumentError, "Unexpected parameter: #{variables_param}"
      end
    end

    def handle_error_in_development(e)
      logger.error e.message
      logger.error e.backtrace.join("\n")

      render json: { errors: [ { message: e.message, backtrace: e.backtrace } ], data: {} }, status: 500
    end
end
