# frozen_string_literal: true

module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :authenticate
  end

  private

    def authenticate
      token = request.headers["Authorization"]&.remove(/\ABearer\s+/i)
      Current.session = token.present? ? Session.active.find_by(token: token) : nil
      Current.user = Current.session&.user
    end
end
