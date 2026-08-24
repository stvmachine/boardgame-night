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

ActiveRecord::Schema[8.1].define(version: 2026_08_24_025059) do
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

  create_table "events", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_events_on_user_id"
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
    t.text "anonymous_bgg_usernames"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "invite_code"
    t.string "name", null: false
    t.integer "owner_id"
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
    t.string "ip_address"
    t.datetime "sudo_at"
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id", null: false
    t.index ["token"], name: "index_sessions_on_token", unique: true
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "solid_cable_messages", force: :cascade do |t|
    t.binary "channel", limit: 1024, null: false
    t.integer "channel_hash", limit: 8, null: false
    t.datetime "created_at", null: false
    t.binary "payload", limit: 536870912, null: false
    t.index ["channel"], name: "index_solid_cable_messages_on_channel"
    t.index ["channel_hash"], name: "index_solid_cable_messages_on_channel_hash"
    t.index ["created_at"], name: "index_solid_cable_messages_on_created_at"
  end

  create_table "solid_cache_entries", force: :cascade do |t|
    t.integer "byte_size", limit: 4, null: false
    t.datetime "created_at", null: false
    t.binary "key", limit: 1024, null: false
    t.integer "key_hash", limit: 8, null: false
    t.binary "value", limit: 536870912, null: false
    t.index ["byte_size"], name: "index_solid_cache_entries_on_byte_size"
    t.index ["key_hash", "byte_size"], name: "index_solid_cache_entries_on_key_hash_and_byte_size"
    t.index ["key_hash"], name: "index_solid_cache_entries_on_key_hash", unique: true
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.string "concurrency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error"
    t.bigint "job_id", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "active_job_id"
    t.text "arguments"
    t.string "class_name", null: false
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at"
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "queue_name", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "hostname"
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.text "metadata"
    t.string "name", null: false
    t.integer "pid", null: false
    t.bigint "supervisor_id"
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "run_at", null: false
    t.string "task_key", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.text "arguments"
    t.string "class_name"
    t.string "command", limit: 2048
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.integer "priority", default: 0
    t.string "queue_name"
    t.string "schedule", null: false
    t.boolean "static", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.integer "value", default: 1, null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
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
    t.boolean "verified", default: false, null: false
    t.index ["bgg_username"], name: "index_users_on_bgg_username"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invite_token"], name: "index_users_on_invite_token", unique: true
  end

  add_foreign_key "bgg_play_players", "bgg_plays"
  add_foreign_key "bgg_plays", "users"
  add_foreign_key "bgg_poll_results", "bgg_polls"
  add_foreign_key "bgg_polls", "bgg_things"
  add_foreign_key "events", "users"
  add_foreign_key "game_scores", "night_sessions"
  add_foreign_key "game_scores", "users"
  add_foreign_key "group_memberships", "groups"
  add_foreign_key "group_memberships", "users"
  add_foreign_key "invite_tokens", "groups"
  add_foreign_key "invite_tokens", "users", column: "accepted_by_id"
  add_foreign_key "invite_tokens", "users", column: "inviter_id"
  add_foreign_key "night_sessions", "bgg_things", column: "picked_game_id"
  add_foreign_key "night_sessions", "groups"
  add_foreign_key "night_sessions", "users", column: "host_id"
  add_foreign_key "sessions", "users"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
end
