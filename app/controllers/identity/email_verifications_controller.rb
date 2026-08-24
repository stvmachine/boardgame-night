# frozen_string_literal: true

class Identity::EmailVerificationsController < Auth::BaseController
  skip_before_action :authenticate, only: :show
  before_action :require_authentication, only: :create
  before_action :set_user, only: :show

  # Confirm an email from the link in the verification message (token in :sid).
  def show
    @user.update!(verified: true)
    head :no_content
  end

  # Resend the verification email to the signed-in user.
  def create
    UserMailer.with(user: Current.user).email_verification.deliver_later
    head :accepted
  end

  private

    def set_user
      @user = User.find_by_token_for!(:email_verification, params[:sid])
    rescue StandardError
      render json: { error: "That email verification link is invalid or has expired" },
             status: :bad_request
    end
end
