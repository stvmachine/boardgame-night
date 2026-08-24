# frozen_string_literal: true

class Identity::PasswordResetsController < Auth::BaseController
  skip_before_action :authenticate
  before_action :set_user, only: :update

  # Request a reset link. Always 202 to avoid leaking which emails are verified.
  def create
    if (user = User.find_by(email: params[:email], verified: true))
      UserMailer.with(user: user).password_reset.deliver_later
    end
    head :accepted
  end

  # Complete the reset using the token (:sid) from the email link.
  def update
    if @user.update(user_params)
      head :no_content
    else
      render json: @user.errors.to_hash, status: :unprocessable_entity
    end
  end

  private

    def set_user
      @user = User.find_by_token_for!(:password_reset, params[:sid])
    rescue StandardError
      render json: { error: "That password reset link is invalid or has expired" },
             status: :bad_request
    end

    def user_params
      params.permit(:password, :password_confirmation)
    end
end
