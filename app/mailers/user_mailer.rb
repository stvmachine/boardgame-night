# frozen_string_literal: true

class UserMailer < ApplicationMailer
  def password_reset
    @user = params[:user]
    @signed_id = @user.generate_token_for(:password_reset)
    @reset_url = spa_url("/reset-password", token: @signed_id)

    mail to: @user.email, subject: "Reset your password"
  end

  def email_verification
    @user = params[:user]
    @signed_id = @user.generate_token_for(:email_verification)
    @verify_url = spa_url("/verify-email", token: @signed_id)

    mail to: @user.email, subject: "Verify your email"
  end

  private

    # The SPA owns the reset/verify pages, so email links must point at the
    # frontend origin (built from ActionMailer's default_url_options), not the
    # Rails REST routes.
    def spa_url(path, **params)
      opts = self.class.default_url_options
      scheme = opts[:protocol] || (Rails.env.production? ? "https" : "http")
      host = opts[:port] ? "#{opts[:host]}:#{opts[:port]}" : opts[:host]
      query = params.any? ? "?#{params.to_query}" : ""
      "#{scheme}://#{host}#{path}#{query}"
    end
end
