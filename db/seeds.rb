# frozen_string_literal: true

# Development seed — two users with realistic BGG collections.
# Run: bin/rails db:seed
#
# Idempotent: uses find_or_create_by / find_or_initialize_by throughout.

puts "Seeding development data..."

# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

stevmachine = User.find_or_initialize_by(username: "stevmachine")
if stevmachine.new_record?
  stevmachine.email = "campos.esteban@gmail.com"
  stevmachine.password = "password123"
  stevmachine.bgg_username = "stevmachine"
  stevmachine.save!
  puts "  Created user: stevmachine"
else
  stevmachine.update!(email: "campos.esteban@gmail.com", bgg_username: "stevmachine")
  puts "  Updated user: stevmachine"
end

donutgamer = User.find_or_initialize_by(username: "donutgamer")
if donutgamer.new_record?
  donutgamer.email = "donutgamer@example.com"
  donutgamer.password = "password"
  donutgamer.bgg_username = "donutgamer"
  donutgamer.save!
  puts "  Created user: donutgamer"
else
  puts "  User donutgamer already exists"
end

# ---------------------------------------------------------------------------
# Board games — real BGG object IDs, realistic stats
# ---------------------------------------------------------------------------

games_data = [
  # [objectid, name, year, min, max, min_play, max_play, avg, avg_weight, bayes_avg, thumbnail, description]
  [174430, "Catan", 1995, 3, 4, 60, 120, 7.1, 2.32, 6.89,
   "https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__imagepage/img/leVGlz6A-83CvNmbq0FfR2jLbmg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg",
   "In Catan, players try to be the dominant force on the island of Catan by building settlements, cities, and roads."],

  [161936, "Caverna: Cave Farmers", 2013, 1, 7, 30, 150, 8.1, 3.88, 7.62,
   "https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__imagepage/img/FpEYH61M6x9vFhMfaG2b0RwJYqU=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1690888.jpg",
   "Caverna is a worker placement game that takes place in a small farm in the woods."],

  [224517, "Brass: Birmingham", 2018, 2, 4, 60, 120, 8.6, 3.86, 8.12,
   "https://cf.geekdo-images.com/DUO2hz9AlLOH8p9ED-lCWg__imagepage/img/HdgbYJ4iTjiWnMYCn8WiH15YFgk=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3490053.jpg",
   "Brass: Birmingham is an economic strategy game about building industries during the Industrial Revolution."],

  [233078, "Spirit Island", 2017, 1, 4, 90, 120, 8.3, 4.07, 7.80,
   "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__imagepage/img/fE91HnE14MF1YJ4a4vJl-zZbUTM=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3615739.jpg",
   "Spirit Island is a complex and thematic cooperative strategy game where you play as spirits defending the island from colonizers."],

  [167791, "Terraforming Mars", 2016, 1, 5, 120, 180, 8.4, 3.26, 8.01,
   "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__imagepage/img/fE91HnE14MF1YJ4a4vJl-zZbUTM=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3536616.jpg",
   "In Terraforming Mars, you play a corporation trying to terraform the planet Mars by raising the temperature, adding oxygen, and creating oceans."],

  [342942, "Ark Nova", 2021, 1, 4, 90, 150, 8.6, 3.76, 8.09,
   "https://cf.geekdo-images.com/SoU8p28Sk1s8MSvoM4N8pQ__imagepage/img/hk_swzohRpG9fRqe9gKNbJf4qjE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6293412.jpg",
   "In Ark Nova, you will plan and design a modern, scientifically managed zoo with the goal of making it the best zoo in the world."],

  [291457, "Gloomhaven", 2017, 1, 4, 60, 150, 8.5, 3.90, 8.06,
   "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__imagepage/img/7d-lj5Gd1e8PFnD97LYFah2Y-l0=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2437871.jpg",
   "Gloomhaven is a game of Euro-inspired tactical combat in a persistent world of shifting motives."],

  [193738, "Pandemic", 2008, 2, 4, 45, 60, 7.6, 2.43, 7.37,
   "https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__imagepage/img/iTfSGFh98M08H2F8bZUc5FJz2kI=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1534148.jpg",
   "In Pandemic, several virulent diseases have broken out simultaneously all over the world! The players are disease-fighting specialists."],

  [266192, "Wingspan", 2019, 1, 5, 40, 70, 7.9, 2.43, 7.64,
   "https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__imagepage/img/3M08d2qCIsiD99av3Vz72jnzj-0=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4458125.jpg",
   "Wingspan is a competitive, medium-weight, card-driven, engine-building board game from Stonemaier Games."],

  [2651, "Power Grid", 2004, 2, 6, 120, 180, 7.6, 3.31, 7.26,
   "https://cf.geekdo-images.com/Bg3H-EPQIBnN4C6h20Srvw__imagepage/img/c-ypqVG53W8i24GpE8MjD5p8w0c=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2604393.jpg",
   "The players build power plants, buy resources, and supply electricity to cities."],

  [225694, "Twilight Struggle", 2005, 2, 2, 150, 180, 8.2, 3.53, 7.83,
   "https://cf.geekdo-images.com/2547Yh3K86Xr84Lq6NkFjg__imagepage/img/0VGj6Dv9KmFjRYfZB7Dfhb-dlBk=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7013943.jpg",
   "Twilight Struggle puts players in charge of the USA or USSR during the Cold War."],

  [30549, "7 Wonders", 2010, 2, 7, 30, 30, 7.7, 2.33, 7.47,
   "https://cf.geekdo-images.com/mDcfo3hA8Tu0f76QkZQy_g__imagepage/img/8wJxYH9C7r6G7F3G3C2HhK6f4vQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4549454.jpg",
   "7 Wonders is a card drafting game where players develop their civilization over three ages."],

  [17334, "Puerto Rico", 2002, 2, 5, 90, 150, 8.1, 3.29, 7.67,
   "https://cf.geekdo-images.com/n-q4l34P9GQpSvtmDqrBqg__imagepage/img/xXl3c3MxQKcv7B4mH4VJGz4vz6M=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4577746.jpg",
   "The players are role-owners in Puerto Rico, producing and shipping goods to Europe."],

  [822, "Carcassonne", 2000, 2, 5, 30, 45, 7.4, 1.90, 7.22,
   "https://cf.geekdo-images.com/E9KgY9Lp59y6hV2x9N3D0g__imagepage/img/mE8jR4qWD62GmM8jWgb2IjBwL8w=/fit-in/900x600/filters:no_upscale():strip_icc()/pic403477.jpg",
   "In Carcassonne, players draw and place a tile to expand a medieval landscape, claiming features with their followers."],

  [128882, "Dominion", 2008, 2, 4, 30, 30, 7.7, 2.23, 7.44,
   "https://cf.geekdo-images.com/A2w68VfVNe781e5kUgMzMA__imagepage/img/bSbL8b2zKfKdC0d1W3PcJ2zJlZs=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3490053.jpg",
   "In Dominion, you are a monarch building your domain by acquiring useful cards from a shared supply."],

  [68448, "Agricola", 2007, 1, 4, 30, 150, 8.0, 3.64, 7.62,
   "https://cf.geekdo-images.com/F9Vh9TVw0OVhMsVxNzCysg__imagepage/img/dlT45o8N-yZBf6BPLVrZJjg6eO8=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1625017.jpg",
   "In Agricola, you're a farmer trying to expand your farm while feeding your family."],

  [40692, "Small World", 2009, 2, 5, 40, 80, 7.2, 2.33, 6.93,
   "https://cf.geekdo-images.com/b0tP4Vdwi9W2714dH8iVtA__imagepage/img/c5N8kEJ6JmLsUz2B4pB3p5l1G6Q=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3513763.jpg",
   "Small World is a fun and light-hearted civilization game where civilizations overlap on a shrinking world."],

  [2452, "Ticket to Ride", 2004, 2, 5, 30, 60, 7.4, 1.90, 7.17,
   "https://cf.geekdo-images.com/4V0Z19SI0N4gPn3Nv9Nzqg__imagepage/img/KIgmj1M5Iqj196Y1fBQH2rMnK0M=/fit-in/900x600/filters:no_upscale():strip_icc()/pic38668.jpg",
   "In Ticket to Ride, players build train routes across North America to claim destination tickets."],

  [13, "Catan", 1995, 3, 4, 60, 120, 7.1, 2.32, 6.89,
   "https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__imagepage/img/leVGlz6A-83CvNmbq0FfR2jLbmg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg",
   "In The Settlers of Catan, players try to be the dominant force on the island of Catan."],

  [148228, "Splendor", 2014, 2, 4, 30, 30, 7.4, 1.79, 7.07,
   "https://cf.geekdo-images.com/rw_OM8aD5AVL5gCDbH88qQ__imagepage/img/LKqoqE0Lx4sT0gC9sH8hM7Y1r9M=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1904079.jpg",
   "Splendor is a game of chip-collecting and card development for 2–4 players."],

  [172828, "King of Tokyo", 2011, 2, 6, 30, 30, 7.1, 1.50, 6.79,
   "https://cf.geekdo-images.com/jjGf0A2bMqFz1O1jM8Lzjg__imagepage/img/0b5YXk4n08IzjOQ8m4v2u6m0QYk=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1726291.jpg",
   "In King of Tokyo, you play as one of several giant monsters fighting to become the King of Tokyo."],

  [169786, "Scythe", 2016, 1, 5, 90, 115, 8.2, 3.42, 7.83,
   "https://cf.geekdo-images.com/7k_nOxpO9OGIjhLq2Dz8pA__imagepage/img/Jx3M6s397bX7dJAG3s0DnxKdIg0=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3163924.jpg",
   "Scythe is set in an alternate-history 1920s Eastern Europe where mechs are used to fight wars."],

  [12333, "Ticket to Ride: Europe", 2005, 2, 5, 30, 60, 7.6, 1.94, 7.36,
   "https://cf.geekdo-images.com/npbHLmxv5b8Il0591VwJLg__imagepage/img/JRf0cBFvC3b6CPEKf3g3z6J8C2M=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3953183.jpg",
   "Ticket to Ride: Europe takes you on a train ride through 1900s Europe."],

  [36218, "Dominant Species", 2010, 2, 6, 120, 240, 8.1, 4.04, 7.62,
   "https://cf.geekdo-images.com/VLugmkKw7b1kSfql3Lz5qg__imagepage/img/gk1BqN2F1M82y2Cj4N6c7x9K3jE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3396538.jpg",
   "Dominant Species is a game that recreates the struggle among animal species for dominance."],

  [350194, "Everdell", 2018, 1, 4, 40, 80, 8.1, 2.83, 7.62,
   "https://cf.geekdo-images.com/PhjygpWSo-0labGrPBMyyg__imagepage/img/VjQGM06sH-8p3l0DK0xB7y5Jy3o=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5837894.jpg",
   "Everdell is a game of dynamic tableau building and worker placement."],

  [2897, "Ra", 1999, 2, 5, 30, 45, 7.5, 2.27, 7.11,
   "https://cf.geekdo-images.com/FMg9Jb3M9Z0jJ12E5cE1Ig__imagepage/img/6E4z3vB9H2tJhW0Hm9W4CzN0F3I=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4111161.jpg",
   "Ra is a auction game where players bid on tiles depicting gods, pharaohs, and monuments from ancient Egypt."],

  [102794, "Star Realms", 2014, 2, 2, 20, 20, 7.6, 1.87, 7.30,
   "https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__imagepage/img/iTfSGFh98M08H2F8bZUc5FJz2kI=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1534148.jpg",
   "Star Realms is a fast-paced deckbuilding game set in a space-faring sci-fi universe."],

  [15987, "Hive", 2001, 2, 2, 20, 30, 7.3, 2.35, 6.96,
   "https://cf.geekdo-images.com/X3Njd0RjWfRp80rPY1qohg__imagepage/img/GY8K3pE30dC4s8IjPpq0yW6jH3A=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4061487.jpg",
   "Hive is an abstract strategy game where players attempt to surround their opponent's queen bee."],

  [3076, "Survive: Escape from Atlantis!", 1982, 2, 4, 60, 90, 7.2, 2.01, 6.87,
   "https://cf.geekdo-images.com/F4n6vJU7wC7y7C7jYJgB1g__imagepage/img/B1l67F45dX6s7r6VhM8s7b7I7uI=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1215633.jpg",
   "Survive: Escape from Atlantis! is a game where players try to evacuate their people from a sinking island."],

  [184921, "Concordia", 2013, 2, 5, 100, 100, 8.1, 3.01, 7.70,
   "https://cf.geekdo-images.com/6tB70Bn63CfQm0sI1I5g0g__imagepage/img/1B793JfVjM_22YD3VwJH81v3pX0=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1556007.jpg",
   "Concordia is a strategic economic game of trade and territory building in the Roman Empire."],

  [220308, "Five Tribes", 2014, 2, 4, 40, 80, 7.9, 2.94, 7.50,
   "https://cf.geekdo-images.com/kjCm4ZvPjIZxS-mYgSPN1g__imagepage/img/48bG3Pz6gG3S3I6j4X7g5J4J3yE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2022524.jpg",
   "Five Tribes is a worker placement game where players use meeples to claim areas in the Sultanate of Naqala."],

  [204583, "Istanbul", 2014, 2, 5, 40, 60, 7.8, 2.88, 7.44,
   "https://cf.geekdo-images.com/PCk3VZjS2Pd70sY1V1bP0g__imagepage/img/D3W2kCtTJr4fJ5kVJ6kq6jQ0aGw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1876306.jpg",
   "Istanbul is a fast-paced strategy game where you lead a merchant through the bazaars of Istanbul."],

  [199042, "Century: Spice Road", 2017, 2, 5, 30, 45, 7.5, 2.01, 7.06,
   "https://cf.geekdo-images.com/mE0R3Ckq_NP1WnN0yL3f3g__imagepage/img/0tF1cEFQs6g0Gn9Ck0pF4wqO0kY=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3635171.jpg",
   "Century: Spice Road is the first game in the Century series, where players are merchants on the Silk Road."],

  [2625, "El Grande", 1995, 2, 5, 60, 120, 8.1, 3.61, 7.62,
   "https://cf.geekdo-images.com/mbBcfZoT23M-87b0l05pPg__imagepage/img/lIuM38d4oY0Pd78g7qf0j3Ld1Dw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic29319.jpg",
   "El Grande is a game of area control and influence in medieval Spain."],

  [291457, "Gloomhaven", 2017, 1, 4, 60, 150, 8.5, 3.90, 8.06,
   "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__imagepage/img/7d-lj5Gd1e8PFnD97LYFah2Y-l0=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2437871.jpg",
   "Gloomhaven is a game of Euro-inspired tactical combat in a persistent world of shifting motives."],

  [199792, "Clank! A Deck-Building Adventure", 2016, 2, 4, 30, 60, 7.6, 2.30, 7.22,
   "https://cf.geekdo-images.com/4di2bCRPAdbk4ZwH9pZvzg__imagepage/img/bFbpW16sJF5YDzH0jCjbPwBqg2I=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4706147.jpg",
   "Clank! is a deck-building adventure game where you explore a dungeon to steal treasure."],

  [34635, "Race for the Galaxy", 2007, 2, 4, 30, 60, 7.6, 2.97, 7.23,
   "https://cf.geekdo-images.com/dq3pHTzGCJgBt10RfC1bRg__imagepage/img/2J8z3oM136Z7Zj2Y7N1b7g1b7g4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic466600.jpg",
   "Race for the Galaxy is a card game where players build galactic civilizations through card combinations."],

  [246675, "Imhotep", 2016, 2, 4, 40, 70, 7.4, 2.30, 6.94,
   "https://cf.geekdo-images.com/8YcIYU65N0j4U35k6m067g__imagepage/img/rD4eH1b3Rb9KdC5J6R4d4L4b3j0=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3157483.jpg",
   "Imhotep is a game of ancient Egyptian building and trading."],

  [233867, "Viticulture Essential Edition", 2015, 1, 6, 45, 90, 8.1, 2.90, 7.67,
   "https://cf.geekdo-images.com/tz194q-axA3Z9M6SvHqjJA__imagepage/img/4Kx0cWxJ5G98h5tEh0d6a5n7p3Y=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4907598.jpg",
   "Viticulture is a game where players make wine in Tuscany."],
]

# De-duplicate by objectid (the last entry for Gloomhaven is a duplicate)
games_data.uniq! { |g| g[0] }

bgg_things = {}
games_data.each do |oid, name, year, min_p, max_p, min_pt, max_pt, avg, weight, bayes, thumb, desc|
  thing = BggThing.find_or_initialize_by(objectid: oid)
  if thing.new_record?
    thing.assign_attributes(
      name: name,
      year_published: year,
      min_players: min_p,
      max_players: max_p,
      min_playtime: min_pt,
      max_playtime: max_pt,
      average: avg,
      average_weight: weight,
      bayes_average: bayes,
      thumbnail: thumb,
      description: desc,
      poll_data_fetched_at: Time.current
    )
    thing.save!
  end
  bgg_things[oid] = thing
end
puts "  Created/verified #{bgg_things.size} board games"

# ---------------------------------------------------------------------------
# Polls & poll results — suggested_numplayers for key player counts
# ---------------------------------------------------------------------------

def create_player_poll!(thing, player_count, best:, recommended:, not_recommended:)
  total = best + recommended + not_recommended
  poll = BggPoll.find_or_create_by!(bgg_thing: thing, name: "suggested_numplayers") do |p|
    p.title = "User Suggested Number of Players"
    p.total_votes = total
  end

  poll.update!(total_votes: poll.total_votes + total)

  %w[Best Recommended Not Recommended].each_with_index do |val, idx|
    votes = [best, recommended, not_recommended][idx]
    BggPollResult.find_or_create_by!(bgg_poll: poll, player_count: player_count, value: val) do |r|
      r.num_votes = votes
    end
  end
end

# Add polls for a selection of games at their most common player counts
poll_games = {
  174430  => { 3 => [80, 50, 10], 4 => [100, 80, 20] },          # Catan
  193738  => { 2 => [30, 60, 10], 3 => [60, 80, 20], 4 => [50, 70, 30] }, # Pandemic
  266192  => { 1 => [60, 30, 10], 2 => [90, 60, 10], 3 => [80, 70, 15], 4 => [70, 60, 20], 5 => [40, 50, 30] }, # Wingspan
  167791  => { 1 => [40, 50, 20], 2 => [80, 60, 10], 3 => [90, 70, 10], 4 => [70, 60, 20] }, # Terraforming Mars
  342942  => { 1 => [50, 40, 10], 2 => [90, 70, 10], 3 => [80, 60, 15], 4 => [60, 50, 20] }, # Ark Nova
  233078  => { 1 => [100, 40, 5],  2 => [90, 50, 10], 3 => [70, 60, 15], 4 => [50, 50, 20] }, # Spirit Island
  161936  => { 1 => [30, 40, 20], 2 => [60, 70, 15], 3 => [80, 70, 10], 4 => [70, 60, 15] }, # Caverna
  224517  => { 2 => [100, 50, 5], 3 => [80, 60, 10], 4 => [60, 50, 20] }, # Brass Birmingham
  291457  => { 1 => [60, 40, 10], 2 => [90, 60, 10], 3 => [70, 50, 20], 4 => [50, 40, 30] }, # Gloomhaven
  246675  => { 2 => [40, 60, 10], 3 => [90, 70, 10], 4 => [80, 60, 15] }, # Ticket to Ride
  30549   => { 3 => [50, 80, 20], 4 => [70, 80, 15], 5 => [60, 70, 20], 6 => [40, 50, 30] }, # 7 Wonders
  225694  => { 2 => [100, 40, 5] },                                        # Twilight Struggle
  199042  => { 2 => [30, 60, 15], 3 => [80, 70, 10], 4 => [70, 60, 15], 5 => [50, 50, 20] }, # Century Spice Road
  199792  => { 2 => [40, 60, 10], 3 => [80, 70, 10], 4 => [70, 60, 15] }, # Clank!
  233867  => { 1 => [40, 50, 15], 2 => [70, 70, 10], 3 => [90, 70, 10], 4 => [80, 60, 15], 5 => [60, 50, 20], 6 => [40, 40, 30] }, # Viticulture
  350194  => { 1 => [50, 50, 10], 2 => [80, 60, 10], 3 => [70, 60, 15], 4 => [50, 50, 20] }, # Everdell
  204583  => { 2 => [40, 60, 15], 3 => [80, 70, 10], 4 => [70, 60, 15], 5 => [50, 50, 20] }, # Istanbul
  220308  => { 2 => [40, 60, 10], 3 => [80, 70, 10], 4 => [70, 60, 15] }, # Five Tribes
}

poll_games.each do |oid, counts|
  thing = bgg_things[oid]
  next unless thing

  counts.each do |pc, votes|
    create_player_poll!(thing, pc, best: votes[0], recommended: votes[1], not_recommended: votes[2])
  end
end
puts "  Created/verified player-count polls"

# ---------------------------------------------------------------------------
# Collections — what each user owns
# ---------------------------------------------------------------------------

# stevmachine: heavier games, more eclectic
stev_items = [
  224517, 233078, 167791, 342942, 291457, 161936, 266192,
  225694, 2651, 220308, 204583, 199042, 199792, 233867,
  184921, 36218, 17334, 34635, 199042, 30549
]

# donutgamer: family-friendly, gateway + midweight
donut_items = [
  174430, 266192, 193738, 246675, 30549, 822, 148228,
  172828, 12333, 199042, 199792, 350194, 204583, 15987,
  3076, 220308, 246675, 128882, 2897, 68448
]

stev_items.uniq.each do |oid|
  BggCollection.find_or_create_by!(user: stevmachine, bgg_thing: bgg_things[oid])
end
donut_items.uniq.each do |oid|
  BggCollection.find_or_create_by!(user: donutgamer, bgg_thing: bgg_things[oid])
end

shared = (stev_items & donut_items).uniq
puts "  Collections: stevmachine=#{stev_items.uniq.size}, donutgamer=#{donut_items.uniq.size}, shared=#{shared.size}"

# ---------------------------------------------------------------------------
# Group — Game Night Crew
# ---------------------------------------------------------------------------

group = Group.find_or_initialize_by(name: "Game Night Crew")
if group.new_record?
  group.description = "Weekly board game night for the crew"
  group.owner = stevmachine
  group.save!
end

GroupMembership.find_or_create_by!(user: stevmachine, group: group) { |m| m.role = "owner" }
GroupMembership.find_or_create_by!(user: donutgamer, group: group) { |m| m.role = "member" }
puts "  Group: #{group.name} (code: #{group.invite_code})"

# ---------------------------------------------------------------------------
# Sessions — a mix of states
# ---------------------------------------------------------------------------

# Completed session with a picked game
completed = NightSession.find_or_initialize_by(title: "Friday Night Euros", group: group, host: stevmachine)
if completed.new_record?
  completed.assign_attributes(
    state: "completed",
    scheduled_at: 1.week.ago.change(hour: 19, min: 0),
    location: "Steve's apartment",
    capacity: 5,
    time_budget_minutes: 120,
    complexity_preference: "Medium",
    picked_game_id: bgg_things[224517].id # Brass: Birmingham
  )
  completed.save!
end

# Another completed session
completed2 = NightSession.find_or_initialize_by(title: "Co-op Sunday", group: group, host: donutgamer)
if completed2.new_record?
  completed2.assign_attributes(
    state: "completed",
    scheduled_at: 2.weeks.ago.change(hour: 14, min: 0),
    location: "Donut's place",
    capacity: 4,
    time_budget_minutes: 120,
    complexity_preference: "Medium-Heavy",
    picked_game_id: bgg_things[233078].id # Spirit Island
  )
  completed2.save!
end

# Cancelled session
cancelled = NightSession.find_or_initialize_by(title: "Heavy Game Night", group: group, host: stevmachine)
if cancelled.new_record?
  cancelled.assign_attributes(
    state: "cancelled",
    previous_state: "invited",
    scheduled_at: 3.days.ago.change(hour: 19, min: 0),
    location: "TBD",
    capacity: 3,
    time_budget_minutes: 180,
    complexity_preference: "Heavy"
  )
  cancelled.save!
end

# Upcoming session in PICKING state
picking = NightSession.find_or_initialize_by(title: "Tonight's Picks", group: group, host: donutgamer)
if picking.new_record?
  picking.assign_attributes(
    state: "picking",
    scheduled_at: Date.today.change(hour: 19, min: 0),
    location: "Community center",
    capacity: 5,
    time_budget_minutes: 90,
    complexity_preference: "Light"
  )
  picking.save!
end

# Upcoming session in INVITED state
invited = NightSession.find_or_initialize_by(title: "Next Week's Game Night", group: group, host: stevmachine)
if invited.new_record?
  invited.assign_attributes(
    state: "invited",
    scheduled_at: 1.week.from_now.change(hour: 19, min: 0),
    location: "Steve's apartment",
    capacity: 6,
    time_budget_minutes: 120,
    complexity_preference: "Any"
  )
  invited.save!
end

# Draft session
draft = NightSession.find_or_initialize_by(title: "TBD Game Night", group: group, host: donutgamer)
if draft.new_record?
  draft.assign_attributes(
    state: "draft",
    scheduled_at: nil,
    location: nil,
    capacity: nil,
    time_budget_minutes: 120,
    complexity_preference: "Any"
  )
  draft.save!
end

puts "  Sessions: #{NightSession.where(group: group).count} total"

# ---------------------------------------------------------------------------
# Attendances
# ---------------------------------------------------------------------------

Attendance.find_or_create_by!(night_session: picking, user: stevmachine) { |a| a.response = "going" }
Attendance.find_or_create_by!(night_session: picking, user: donutgamer) { |a| a.response = "going" }
Attendance.find_or_create_by!(night_session: invited, user: stevmachine) { |a| a.response = "going" }
Attendance.find_or_create_by!(night_session: invited, user: donutgamer) { |a| a.response = "going" }
puts "  Attendances seeded"

# ---------------------------------------------------------------------------
# BGG hot list cache
# ---------------------------------------------------------------------------

hot_items = games_data.first(20).each_with_index.map do |g, i|
  { id: g[0].to_s, rank: i + 1, name: g[1], year_published: g[2], thumbnail: g[10] }
end
Rails.cache.write("bgg/hot", hot_items, expires_in: 24.hours)
puts "  BGG hot list cached (#{hot_items.size} items)"

puts ""
puts "Done! Seed summary:"
puts "  Users:    campos.esteban@gmail.com / password123 (stevmachine)"
puts "           donutgamer@example.com / password (donutgamer)"
puts "  Group:    #{group.name} (invite code: #{group.invite_code})"
puts "  Games:    #{bgg_things.size} in collection"
puts "  Sessions: #{NightSession.where(group: group).count} across all states"
