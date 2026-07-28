# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_28_000002) do
  create_table "attendances", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "night_session_id", null: false
    t.datetime "responded_at"
    t.string "response", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["night_session_id", "user_id"], name: "index_attendances_on_night_session_id_and_user_id", unique: true
    t.index ["night_session_id"], name: "index_attendances_on_night_session_id"
    t.index ["user_id"], name: "index_attendances_on_user_id"
  end

  create_table "bgg_collections", force: :cascade do |t|
    t.integer "bgg_thing_id", null: false
    t.datetime "created_at", null: false
    t.integer "quantity", default: 1, null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["bgg_thing_id"], name: "index_bgg_collections_on_bgg_thing_id"
    t.index ["user_id", "bgg_thing_id"], name: "index_bgg_collections_on_user_id_and_bgg_thing_id", unique: true
    t.index ["user_id"], name: "index_bgg_collections_on_user_id"
  end

  create_table "bgg_play_players", force: :cascade do |t|
    t.integer "bgg_play_id", null: false
    t.integer "bgg_userid"
    t.string "bgg_username"
    t.string "color"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.boolean "new_player", default: false, null: false
    t.integer "rating"
    t.integer "score"
    t.string "start_position"
    t.datetime "updated_at", null: false
    t.boolean "win", default: false, null: false
    t.index ["bgg_play_id", "bgg_username"], name: "index_bgg_play_players_on_bgg_play_id_and_bgg_username"
    t.index ["bgg_play_id"], name: "index_bgg_play_players_on_bgg_play_id"
  end

  create_table "bgg_plays", force: :cascade do |t|
    t.integer "bgg_game_objectid", null: false
    t.integer "bgg_play_id", null: false
    t.text "comments"
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.string "game_name"
    t.boolean "incomplete", default: false, null: false
    t.integer "length_minutes", default: 0, null: false
    t.string "location"
    t.boolean "now_in_stats", default: true, null: false
    t.integer "quantity", default: 1, null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["bgg_game_objectid"], name: "index_bgg_plays_on_bgg_game_objectid"
    t.index ["bgg_play_id"], name: "index_bgg_plays_on_bgg_play_id", unique: true
    t.index ["user_id", "date"], name: "index_bgg_plays_on_user_id_and_date"
    t.index ["user_id"], name: "index_bgg_plays_on_user_id"
  end

  create_table "bgg_poll_results", force: :cascade do |t|
    t.integer "bgg_poll_id", null: false
    t.datetime "created_at", null: false
    t.integer "level"
    t.integer "num_votes", default: 0, null: false
    t.integer "player_count"
    t.datetime "updated_at", null: false
    t.string "value", null: false
    t.index ["bgg_poll_id", "player_count", "value"], name: "idx_on_bgg_poll_id_player_count_value_ac97d142f9", unique: true
    t.index ["bgg_poll_id"], name: "index_bgg_poll_results_on_bgg_poll_id"
  end

  create_table "bgg_polls", force: :cascade do |t|
    t.integer "bgg_thing_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "title"
    t.integer "total_votes"
    t.datetime "updated_at", null: false
    t.index ["bgg_thing_id", "name"], name: "index_bgg_polls_on_bgg_thing_id_and_name", unique: true
    t.index ["bgg_thing_id"], name: "index_bgg_polls_on_bgg_thing_id"
  end

  create_table "bgg_things", force: :cascade do |t|
    t.decimal "average", precision: 10, scale: 6
    t.decimal "average_weight", precision: 10, scale: 6
    t.decimal "bayes_average", precision: 10, scale: 6
    t.datetime "created_at", null: false
    t.text "description"
    t.string "image"
    t.integer "max_players"
    t.integer "max_playtime"
    t.integer "min_age"
    t.integer "min_players"
    t.integer "min_playtime"
    t.string "name", null: false
    t.integer "num_comments"
    t.integer "objectid", null: false
    t.integer "playing_time"
    t.text "poll_data_error"
    t.datetime "poll_data_fetched_at"
    t.string "thumbnail"
    t.datetime "updated_at", null: false
    t.integer "users_rated"
    t.integer "year_published"
    t.index ["name"], name: "index_bgg_things_on_name"
    t.index ["objectid"], name: "index_bgg_things_on_objectid", unique: true
    t.index ["poll_data_fetched_at"], name: "index_bgg_things_on_poll_data_fetched_at"
  end

  create_table "game_scores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "night_session_id", null: false
    t.integer "rank"
    t.integer "score", default: 0, null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["night_session_id", "user_id"], name: "index_game_scores_on_night_session_id_and_user_id", unique: true
    t.index ["night_session_id"], name: "index_game_scores_on_night_session_id"
    t.index ["user_id"], name: "index_game_scores_on_user_id"
  end

  create_table "group_memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "group_id", null: false
    t.string "role", default: "member", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["group_id"], name: "index_group_memberships_on_group_id"
    t.index ["user_id", "group_id"], name: "index_group_memberships_on_user_id_and_group_id", unique: true
    t.index ["user_id"], name: "index_group_memberships_on_user_id"
  end

  create_table "groups", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "invite_code"
    t.string "name", null: false
    t.integer "owner_id", null: false
    t.datetime "updated_at", null: false
    t.index ["invite_code"], name: "index_groups_on_invite_code", unique: true
    t.index ["owner_id"], name: "index_groups_on_owner_id"
  end

  create_table "invite_tokens", force: :cascade do |t|
    t.datetime "accepted_at"
    t.integer "accepted_by_id"
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", null: false
    t.integer "group_id", null: false
    t.integer "inviter_id", null: false
    t.integer "night_session_id"
    t.string "role", default: "member"
    t.string "status", default: "pending", null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["accepted_by_id"], name: "index_invite_tokens_on_accepted_by_id"
    t.index ["group_id"], name: "index_invite_tokens_on_group_id"
    t.index ["inviter_id"], name: "index_invite_tokens_on_inviter_id"
    t.index ["night_session_id"], name: "index_invite_tokens_on_night_session_id"
    t.index ["token_digest"], name: "index_invite_tokens_on_token_digest", unique: true
  end

  create_table "night_sessions", force: :cascade do |t|
    t.integer "capacity"
    t.string "complexity_preference", default: "Any", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "group_id", null: false
    t.integer "host_id", null: false
    t.string "location"
    t.integer "picked_game_id"
    t.string "previous_state"
    t.datetime "scheduled_at"
    t.string "state", default: "draft", null: false
    t.integer "time_budget_minutes", default: 120, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["group_id"], name: "index_night_sessions_on_group_id"
    t.index ["host_id"], name: "index_night_sessions_on_host_id"
    t.index ["picked_game_id"], name: "index_night_sessions_on_picked_game_id"
    t.index ["state"], name: "index_night_sessions_on_state"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["token"], name: "index_sessions_on_token", unique: true
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "bgg_avatar_url"
    t.string "bgg_username"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "invite_token"
    t.datetime "last_synced_at"
    t.string "nickname"
    t.string "password_digest"
    t.boolean "provisional", default: false, null: false
    t.datetime "sync_requested_at"
    t.datetime "updated_at", null: false
    t.string "username"
    t.index ["bgg_username"], name: "index_users_on_bgg_username"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invite_token"], name: "index_users_on_invite_token", unique: true
  end

  add_foreign_key "bgg_play_players", "bgg_plays"
  add_foreign_key "bgg_plays", "users"
  add_foreign_key "bgg_poll_results", "bgg_polls"
  add_foreign_key "bgg_polls", "bgg_things"
  add_foreign_key "game_scores", "night_sessions"
  add_foreign_key "game_scores", "users"
  add_foreign_key "group_memberships", "groups"
  add_foreign_key "group_memberships", "users"
  add_foreign_key "groups", "users", column: "owner_id"
  add_foreign_key "invite_tokens", "groups"
  add_foreign_key "invite_tokens", "users", column: "accepted_by_id"
  add_foreign_key "invite_tokens", "users", column: "inviter_id"
  add_foreign_key "night_sessions", "bgg_things", column: "picked_game_id"
  add_foreign_key "night_sessions", "groups"
  add_foreign_key "night_sessions", "users", column: "host_id"
  add_foreign_key "sessions", "users"
end
