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

ActiveRecord::Schema[8.1].define(version: 2026_07_07_000002) do
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
    t.string "thumbnail"
    t.datetime "updated_at", null: false
    t.integer "users_rated"
    t.integer "year_published"
    t.index ["name"], name: "index_bgg_things_on_name"
    t.index ["objectid"], name: "index_bgg_things_on_objectid", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "bgg_avatar_url"
    t.string "bgg_username"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "password_digest"
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.index ["bgg_username"], name: "index_users_on_bgg_username"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "bgg_collections", "bgg_things"
  add_foreign_key "bgg_collections", "users"
end
