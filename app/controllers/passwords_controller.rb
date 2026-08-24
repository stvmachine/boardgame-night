# frozen_string_literal: true

class PasswordsController < Auth::BaseController
  before_action :require_authentication
  before_action :require_sudo
  before_action :set_user

  # Change password for the signed-in user (sudo-gated). Password change revokes
  # other sessions via the User after_update callback.
  def update
    if @user.update(user_params)
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
      params.permit(:password, :password_confirmation)
    end
end
