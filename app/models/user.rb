# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  has_many :bgg_collections, dependent: :destroy
  has_many :bgg_things, through: :bgg_collections

  validates :username, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_nil: true
end
