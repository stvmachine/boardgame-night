# frozen_string_literal: true

class SessionsController < Auth::BaseController
  skip_before_action :authenticate, only: :create
  before_action :require_authentication, except: :create
  before_action :set_session, only: %i[show destroy]

  # List the signed-in user's active sessions (session-management UI).
  def index
    render json: Current.user.sessions.active.order(created_at: :desc).map { |s| session_json(s) }
  end

  def show
    render json: session_json(@session)
  end

  # Sign in: authenticate credentials and mint the existing DB-backed bearer
  # token (NOT a-zero's signed_id). The token authorizes GraphQL + ActionCable.
  def create
    user = User.authenticate_by(email: params[:email], password: params[:password])

    if user
      session = user.sessions.create!(expires_at: 30.days.from_now)
      log_event("signed_in", user: user)
      render json: { token: session.token, sessionId: session.id.to_s, user: user_json(user) },
             status: :created
    else
      render json: { error: "Invalid credentials" }, status: :unauthorized
    end
  end

  # Sign out (or revoke another device from the session-management UI).
  def destroy
    @session.destroy
    log_event("signed_out")
    head :no_content
  end

  private

    def set_session
      @session = Current.user.sessions.find(params[:id])
    end
end
