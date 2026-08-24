# frozen_string_literal: true

class Identity::EmailsController < Auth::BaseController
  before_action :require_authentication
  before_action :require_sudo
  before_action :set_user

  # Change the signed-in user's email (sudo-gated). Changing it flips `verified`
  # back to false (User callback) and re-sends verification.
  def update
    if @user.update(user_params)
      UserMailer.with(user: @user).email_verification.deliver_later if @user.email_previously_changed?
      render json: user_json(@user)
    else
      render json: @user.errors.to_hash, status: :unprocessable_entity
    end
  end

  private

    def set_user
      @user = Current.user
    end

    def user_params
      params.permit(:email)
    end
end
