# frozen_string_literal: true

class Attendance < ApplicationRecord
  belongs_to :night_session
  belongs_to :user

  validates :user_id, uniqueness: { scope: :night_session_id }
  validates :response, presence: true, inclusion: { in: %w[going not_going] }
end
