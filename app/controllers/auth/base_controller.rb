# frozen_string_literal: true

# Base class for the REST authentication endpoints (a-zero controllers).
# Pulls in the shared Authentication concern so `authenticate` /
# `set_current_request_details` run and `Current.user`/`Current.session` are
# populated from the same Bearer token that authorizes GraphQL and ActionCable.
module Auth
  class BaseController < ApplicationController
    include Authentication

    private

      # Record an activity-log event (a-zero "trackable"). ip/user_agent are
      # stamped by Event#before_create from Current.
      def log_event(action, user: Current.user)
        user&.events&.create!(action: action.to_s)
      end

      # Gate sensitive changes (password/email) behind a recent re-authentication.
      # The SPA responds to 403 by prompting for the password and POSTing /sudo.
      def require_sudo
        return if Current.session&.sudo?

        render json: { error: "sudo_required" }, status: :forbidden
      end

      # Canonical user payload for REST responses. Mirrors GraphQL `UserType`
      # exactly so the SPA's AuthContext hydrates identically whether the user
      # came from REST sign-in or the CURRENT_USER query. Never leaks
      # password_digest / tokens (unlike a-zero's default `render json: @user`).
      def user_json(user)
        {
          id: user.id.to_s,
          username: user.username,
          email: user.provisional? ? nil : user.email,
          bggUsername: user.bgg_username,
          avatar: user.bgg_avatar_url,
          isProvisional: user.provisional?,
          displayName: user.display_name
        }
      end

      def session_json(session)
        {
          id: session.id.to_s,
          ipAddress: session.ip_address,
          userAgent: session.user_agent,
          createdAt: session.created_at,
          current: session.id == Current.session&.id
        }
      end
    end
end
