# frozen_string_literal: true

class RegistrationsController < Auth::BaseController
  skip_before_action :authenticate

  # Sign up. Validates through the existing SignUpContract (email format +
  # uniqueness + password length) so error messages match what the SPA already
  # renders, then creates a non-provisional user, mints a session token (logs
  # them in immediately), and sends the email-verification message.
  def create
    contract = SignUpContract.new.call(
      email: params[:email], password: params[:password], username: params[:username]
    )
    return render json: contract.errors.to_h, status: :unprocessable_entity if contract.failure?

    user = User.new(
      email: contract[:email],
      password: contract[:password],
      username: contract[:username],
      bgg_username: params[:bgg_username].presence,
      provisional: false
    )

    if user.save
      session = user.sessions.create!(expires_at: 30.days.from_now)
      UserMailer.with(user: user).email_verification.deliver_later
      render json: { token: session.token, sessionId: session.id.to_s, user: user_json(user) },
             status: :created
    else
      render json: user.errors.to_hash, status: :unprocessable_entity
    end
  end
end
