# frozen_string_literal: true

module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :set_current_request_details
    before_action :authenticate
  end

  private

    def set_current_request_details
      Current.user_agent = request.user_agent
      Current.ip_address = request.ip
    end

    def authenticate
      token = request.headers["Authorization"]&.remove(/\ABearer\s+/i)
      Current.session = token.present? ? Session.active.find_by(token: token) : nil
      Current.user = Current.session&.user
    end

    # For REST auth endpoints that require a signed-in user (a-zero controllers
    # call `authenticate` then assume Current.user). Returns 401 when absent.
    def require_authentication
      return if Current.user

      render json: { error: "Authentication required" }, status: :unauthorized
    end
end
