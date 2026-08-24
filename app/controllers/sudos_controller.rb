# frozen_string_literal: true

# Hand-built (a-zero's --sudoable is inert in --api mode). Re-authenticates the
# signed-in user by password and refreshes the current session's sudo window,
# unlocking sensitive changes (password/email) for SUDO_WINDOW.
class SudosController < Auth::BaseController
  before_action :require_authentication

  def create
    if User.authenticate_by(email: Current.user.email, password: params[:password])
      Current.session.update!(sudo_at: Time.current)
      head :no_content
    else
      render json: { error: "Incorrect password" }, status: :unauthorized
    end
  end
end
