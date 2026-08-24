# frozen_string_literal: true

class Authentications::EventsController < Auth::BaseController
  before_action :require_authentication

  # Activity log (a-zero "trackable") for the signed-in user.
  def index
    events = Current.user.events.order(created_at: :desc).map do |event|
      { id: event.id.to_s, action: event.action, ipAddress: event.ip_address,
        userAgent: event.user_agent, createdAt: event.created_at }
    end
    render json: events
  end
end
