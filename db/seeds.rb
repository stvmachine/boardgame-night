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
  [13, "Catan", 1995, 3, 4, 60, 120, 7.09, 2.28, 6.9,
   "https://cf.geekdo-images.com/0XODRpReiZBFUffEcqT5-Q__small/img/SNVfF23OQafv3u8xdFolJnMkBoM=/fit-in/200x150/filters:strip_icc()/pic9156909.png",
   "In CATAN (formerly The Settlers of Catan), players try to be the dominant force on the island of Catan by building settlements, cities and roads."],

  [822, "Carcassonne", 2000, 2, 5, 30, 45, 7.42, 1.88, 7.3,
   "https://cf.geekdo-images.com/peUgu3A20LRmAXAMyDQfpQ__small/img/oEEslN-EGqh82sNI6Aj4_MFXYg0=/fit-in/200x150/filters:strip_icc()/pic8621446.jpg",
   "Carcassonne is a tile placement game in which the players draw and place a tile with a piece of southern French landscape represented on it."],

  [30549, "Pandemic", 2008, 2, 4, 45, 45, 7.51, 2.39, 7.4,
   "https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__small/img/oqViRj6nVxK3m36NluTxU1PZkrk=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg",
   "In Pandemic, several virulent diseases have broken out simultaneously all over the world! The players are disease-fighting specialists whose mission is to treat disease hotspots wh…"],

  [68448, "7 Wonders", 2010, 2, 7, 30, 30, 7.66, 2.31, 7.55,
   "https://cf.geekdo-images.com/35h9Za_JvMMMtx_92kT0Jg__small/img/BUOso8b0M1aUOkU80FWlhE8uuxc=/fit-in/200x150/filters:strip_icc()/pic7149798.jpg",
   "You are the leader of one of the 7 great cities of the Ancient World. Gather resources, develop commercial routes, and affirm your military supremacy."],

  [9209, "Ticket to Ride", 2004, 2, 5, 30, 60, 7.38, 1.82, 7.26,
   "https://cf.geekdo-images.com/kdWYkW-7AqG63HhqPL6ekA__small/img/5G46jv8MFh_BfX67iMSouTMhKxc=/fit-in/200x150/filters:strip_icc()/pic8937637.jpg",
   "With elegantly simple gameplay, Ticket to Ride can be learned in under 15 minutes."],

  [36218, "Dominion", 2008, 2, 4, 30, 30, 7.6, 2.34, 7.47,
   "https://cf.geekdo-images.com/j6iQpZ4XkemZP07HNCODBA__small/img/B2u2ghwlmI_qsUtCwuvcbnBcIqU=/fit-in/200x150/filters:strip_icc()/pic394356.jpg",
   "\"You are a monarch, like your parents before you, a ruler of a small pleasant kingdom of rivers and evergreens."],

  [40692, "Small World", 2009, 2, 5, 40, 80, 7.19, 2.35, 7.08,
   "https://cf.geekdo-images.com/aoPM07XzoceB-RydLh08zA__small/img/o3Bw9heVDJRgPYlI_PksCvLAgnM=/fit-in/200x150/filters:strip_icc()/pic428828.jpg",
   "In Small World, players vie for conquest and control of a world that is simply too small to accommodate them all."],

  [2651, "Power Grid", 2004, 2, 6, 120, 120, 7.8, 3.25, 7.68,
   "https://cf.geekdo-images.com/yd6LuatytHRhcFCxCf-EEg__small/img/jWTonZ5oYNlPzpELKHIJGWSS0Y8=/fit-in/200x150/filters:strip_icc()/pic4459753.jpg",
   "Power Grid is the updated release of the Friedemann Friese crayon game Funkenschlag."],

  [3076, "Puerto Rico", 2002, 3, 5, 90, 150, 7.9, 3.27, 7.75,
   "https://cf.geekdo-images.com/QFiIRd2kimaMqTyWsX0aUg__small/img/5fLo89ChZH6Wzukk36bhZ-EpBS0=/fit-in/200x150/filters:strip_icc()/pic158548.jpg",
   "In Puerto Rico, players assume the roles of colonial governors on the island of Puerto Rico."],

  [31260, "Agricola", 2007, 1, 5, 30, 150, 7.85, 3.64, 7.72,
   "https://cf.geekdo-images.com/3L6ZtOll9W5O6-3-EwSMyw__small/img/TpNF65wCIb1n3EGW18eJJ3MlRMo=/fit-in/200x150/filters:strip_icc()/pic1899157.jpg",
   "In Agricola, you're a farmer in a wooden shack with your spouse and little else."],

  [34635, "Stone Age", 2008, 2, 4, 60, 90, 7.51, 2.46, 7.38,
   "https://cf.geekdo-images.com/elmZegVZ6gp4_5izUgxGQQ__small/img/MXq3DEKWIozO-PmB4S64BiE5fd0=/fit-in/200x150/filters:strip_icc()/pic1632539.jpg",
   "The \"Stone Age\" times were hard indeed."],

  [148228, "Splendor", 2014, 2, 4, 30, 30, 7.42, 1.77, 7.29,
   "https://cf.geekdo-images.com/vNFe4JkhKAERzi4T0Ntwpw__small/img/KKU_42Uswt4tKCpf1zY5kTzgr-g=/fit-in/200x150/filters:strip_icc()/pic8234167.png",
   "Splendor is a game of chip-collecting and card development."],

  [70323, "King of Tokyo", 2011, 2, 6, 30, 30, 7.11, 1.48, 7.01,
   "https://cf.geekdo-images.com/m_RzXpHURC0_xLkvRSR_sw__small/img/OfgWmkGJj5BgOO0zFHEtP5CHfbU=/fit-in/200x150/filters:strip_icc()/pic3043734.jpg",
   "In King of Tokyo, you play mutant monsters, gigantic robots, and strange aliens&mdash;all of whom are destroying Tokyo and whacking each other in order to become the one and only K…"],

  [167791, "Terraforming Mars", 2016, 1, 5, 120, 120, 8.33, 3.27, 8.18,
   "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__small/img/BTxqxgYay5tHJfVoJ2NF5g43_gA=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg",
   "In the 2400s, mankind begins to terraform the planet Mars."],

  [169786, "Scythe", 2016, 1, 5, 115, 115, 8.1, 3.45, 7.94,
   "https://cf.geekdo-images.com/7k_nOxpO9OGIjhLq2BUZdA__small/img/eQ69OEDdjYjfKg6q5Navee87skU=/fit-in/200x150/filters:strip_icc()/pic3163924.jpg",
   "It is a time of unrest in 1920s Europa. The ashes from the first great war still darken the snow."],

  [266192, "Wingspan", 2019, 1, 5, 40, 70, 8.0, 2.48, 7.84,
   "https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__small/img/VNToqgS2-pOGU6MuvIkMPKn_y-s=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg",
   "Wingspan is&nbsp;a competitive, medium-weight, card-driven, engine-building board game from Stonemaier Games."],

  [230802, "Azul", 2017, 2, 4, 30, 45, 7.71, 1.77, 7.6,
   "https://cf.geekdo-images.com/aPSHJO0d0XOpQR5X-wJonw__small/img/ccsXKrdGJw-YSClWwzVUwk5Nh9Y=/fit-in/200x150/filters:strip_icc()/pic6973671.png",
   "Introduced by the Moors, azulejos (originally white and blue ceramic tiles) were fully embraced by the Portuguese when their king Manuel I, on a visit to the Alhambra palace in Sou…"],

  [162886, "Spirit Island", 2017, 1, 4, 90, 120, 8.34, 4.07, 8.14,
   "https://cf.geekdo-images.com/kjCm4ZvPjIZxS-mYgSPy1g__small/img/aUlIih2_R7P8IYKeyNl2heLQbu8=/fit-in/200x150/filters:strip_icc()/pic7013651.jpg",
   "In the most distant reaches of the world, magic still exists, embodied by spirits of the land, of the sky, and of every natural thing."],

  [174430, "Gloomhaven", 2017, 1, 4, 60, 120, 8.53, 3.92, 8.29,
   "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__small/img/veqFeP4d_3zNhFc3GNBkV95rBEQ=/fit-in/200x150/filters:strip_icc()/pic2437871.jpg",
   "Gloomhaven is a game of Euro-inspired tactical combat in a persistent world of shifting motives."],

  [224517, "Brass: Birmingham", 2018, 2, 4, 60, 120, 8.56, 3.86, 8.39,
   "https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__small/img/o18rjEemoWaVru9Y2TyPwuIaRfE=/fit-in/200x150/filters:strip_icc()/pic3490053.jpg",
   "Brass: Birmingham is an economic strategy game sequel to Martin Wallace's 2007 masterpiece, Brass."],

  [342942, "Ark Nova", 2021, 1, 4, 90, 150, 8.54, 3.8, 8.35,
   "https://cf.geekdo-images.com/SoU8p28Sk1s8MSvoM4N8pQ__small/img/4KuHNTWSMPf8vTNDKSRMMI3oOv8=/fit-in/200x150/filters:strip_icc()/pic6293412.jpg",
   "In Ark Nova, you will plan and design a modern, scientifically managed zoo."],

  [199792, "Everdell", 2018, 1, 4, 40, 80, 7.98, 2.83, 7.8,
   "https://cf.geekdo-images.com/fjE7V5LNq31yVEW_yuqI-Q__small/img/Cf_mYxR_VvdjTEPXseSurni2JNI=/fit-in/200x150/filters:strip_icc()/pic3918905.png",
   "Within the charming valley of Everdell, beneath the boughs of towering trees, among meandering streams and mossy hollows, a civilization of forest critters is thriving and expandin…"],

  [124361, "Concordia", 2013, 2, 5, 100, 100, 8.07, 2.99, 7.92,
   "https://cf.geekdo-images.com/CzwSm8i7tkLz6cBnrILZBg__small/img/ESPSltYYSFK-aJw6jOTdQrJGpOc=/fit-in/200x150/filters:strip_icc()/pic3453267.jpg",
   "Two thousand years ago, the Roman Empire ruled the lands around the Mediterranean Sea."],

  [220308, "Gaia Project", 2017, 1, 4, 60, 150, 8.35, 4.4, 8.08,
   "https://cf.geekdo-images.com/hGWFm3hbMlCDsfCsauOQ4g__small/img/NNG7Ijyx4evp5gcVReis9i0koas=/fit-in/200x150/filters:strip_icc()/pic5375625.png",
   "Gaia Project is a new game in the line of Terra Mystica."],

  [12333, "Twilight Struggle", 2005, 2, 2, 120, 180, 8.23, 3.61, 8.04,
   "https://cf.geekdo-images.com/pNCiUUphnoeWOYfsWq0kng__small/img/p7alNkNy8Avm8UISmhYHCiMz5bE=/fit-in/200x150/filters:strip_icc()/pic3530661.jpg",
   "Now the trumpet summons us again, not as a call to bear arms, though arms we need; not as a call to battle, though embattled we are &ndash; but a call to bear the burden of a long…"],

  [193738, "Great Western Trail", 2016, 2, 4, 75, 150, 8.14, 3.7, 7.97,
   "https://cf.geekdo-images.com/u1l0gH7sb_vnvDvoO_QHqA__small/img/9lxFidyDb8j6D1vobx4e3UwZ-FI=/fit-in/200x150/filters:strip_icc()/pic4887376.jpg",
   "America in the 19th century: You are a rancher and repeatedly herd your cattle from Texas to Kansas City, where you send them off by train."],

  [204583, "Kingdomino", 2016, 2, 4, 15, 25, 7.29, 1.24, 7.17,
   "https://cf.geekdo-images.com/c0m3gwZTcfKoLI63ASio8g__small/img/4p4Xydg0tze9UFcd6oUbCnVyxCw=/fit-in/200x150/filters:strip_icc()/pic8443569.png",
   "Kingdomino is a tile-laying game in which players take the role of monarchs expanding their kingdoms by claiming and arranging lands."],

  [237182, "Root", 2018, 2, 4, 60, 90, 8.07, 3.84, 7.88,
   "https://cf.geekdo-images.com/JUAUWaVUzeBgzirhZNmHHw__small/img/ACovMZzGGIsBRyEQXFnsT8282NM=/fit-in/200x150/filters:strip_icc()/pic4254509.jpg",
   "Root is a game of adventure and war in which 2 to 4 (1 to 6 with the 'Riverfolk' expansion, 2-6 with the 'Underworld', or 'Marauder' expansions) players battle for control of a vas…"],

  [295947, "Cascadia", 2021, 1, 4, 30, 45, 7.88, 1.84, 7.73,
   "https://cf.geekdo-images.com/MjeJZfulbsM1DSV3DrGJYA__small/img/tVSFjSxYEcw7sKj3unIIQV8kxoc=/fit-in/200x150/filters:strip_icc()/pic5100691.jpg",
   "Cascadia is a puzzly tile-laying and token-drafting game featuring the habitats and wildlife of the Pacific Northwest."],

  [173346, "7 Wonders Duel", 2015, 2, 2, 30, 30, 8.07, 2.23, 7.95,
   "https://cf.geekdo-images.com/zdagMskTF7wJBPjX74XsRw__small/img/gV1-ckZSIC-dCxxpq1Y7GmPITzQ=/fit-in/200x150/filters:strip_icc()/pic2576399.jpg",
   "In many ways 7 Wonders Duel resembles its parent game 7 Wonders."],

  [161936, "Pandemic Legacy: Season 1", 2015, 2, 4, 60, 60, 8.5, 2.83, 8.34,
   "https://cf.geekdo-images.com/-Qer2BBPG7qGGDu6KcVDIw__small/img/NQQcjS31TO0DE246N9rpt0hd9eo=/fit-in/200x150/filters:strip_icc()/pic2452831.png",
   "Pandemic Legacy is a co-operative campaign game, with an overarching story arc played through 12-24 sessions, depending on how well your group does at the game."],

  [102794, "Caverna: The Cave Farmers", 2013, 1, 7, 30, 210, 7.92, 3.78, 7.73,
   "https://cf.geekdo-images.com/EAqbd46lFxo-7GumlO8U4w__small/img/g-qxFyjgqn7kwH3erf3jhmgYaIU=/fit-in/200x150/filters:strip_icc()/pic5598833.jpg",
   "Following along the same lines as its predecessor (Agricola), Caverna: The Cave Farmers is a worker-placement game at heart, with a focus on farming."],

  [284083, "The Crew: The Quest for Planet Nine", 2019, 2, 5, 20, 20, 7.75, 1.97, 7.61,
   "https://cf.geekdo-images.com/98LnQShydr11OBKS46xY-Q__small/img/et-fnuozyOdBOVL-5kSS3_7I8fw=/fit-in/200x150/filters:strip_icc()/pic5687013.jpg",
   "In the co-operative trick-taking game The Crew: The Quest for Planet Nine, the players set out as astronauts on an uncertain space adventure."],

  [312484, "Lost Ruins of Arnak", 2020, 1, 4, 30, 120, 8.08, 2.93, 7.92,
   "https://cf.geekdo-images.com/6GqH14TJJhza86BX5HCLEQ__small/img/J8SVmGOJXZGxNjkT3xYNQU7Haxg=/fit-in/200x150/filters:strip_icc()/pic5674958.jpg",
   "On an uninhabited island in uncharted seas, explorers have found traces of a great civilization."],
]

# De-duplicate by objectid (defensive; the curated list is already unique)
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
  13      => { 3 => [80, 50, 10], 4 => [100, 80, 20] },                    # Catan
  30549   => { 2 => [30, 60, 10], 3 => [60, 80, 20], 4 => [50, 70, 30] },  # Pandemic
  266192  => { 1 => [60, 30, 10], 2 => [90, 60, 10], 3 => [80, 70, 15], 4 => [70, 60, 20], 5 => [40, 50, 30] }, # Wingspan
  167791  => { 1 => [40, 50, 20], 2 => [80, 60, 10], 3 => [90, 70, 10], 4 => [70, 60, 20], 5 => [50, 50, 25] }, # Terraforming Mars
  342942  => { 1 => [50, 40, 10], 2 => [90, 70, 10], 3 => [80, 60, 15], 4 => [60, 50, 20] }, # Ark Nova
  162886  => { 1 => [100, 40, 5],  2 => [90, 50, 10], 3 => [70, 60, 15], 4 => [50, 50, 20] }, # Spirit Island
  102794  => { 1 => [30, 40, 20], 2 => [60, 70, 15], 3 => [80, 70, 10], 4 => [70, 60, 15] }, # Caverna
  224517  => { 2 => [100, 50, 5], 3 => [80, 60, 10], 4 => [60, 50, 20] }, # Brass: Birmingham
  174430  => { 1 => [60, 40, 10], 2 => [90, 60, 10], 3 => [70, 50, 20], 4 => [50, 40, 30] }, # Gloomhaven
  9209    => { 2 => [40, 60, 10], 3 => [90, 70, 10], 4 => [80, 60, 15], 5 => [60, 60, 25] }, # Ticket to Ride
  68448   => { 3 => [50, 80, 20], 4 => [70, 80, 15], 5 => [60, 70, 20], 6 => [40, 50, 30], 7 => [30, 40, 40] }, # 7 Wonders
  12333   => { 2 => [100, 40, 5] },                                       # Twilight Struggle
  173346  => { 2 => [95, 30, 5] },                                        # 7 Wonders Duel (2-player only)
  199792  => { 1 => [50, 50, 10], 2 => [80, 60, 10], 3 => [70, 60, 15], 4 => [50, 50, 20] }, # Everdell
  230802  => { 2 => [90, 50, 10], 3 => [70, 60, 15], 4 => [60, 55, 20] }, # Azul
  295947  => { 1 => [50, 40, 15], 2 => [80, 60, 10], 3 => [70, 60, 15], 4 => [55, 50, 20] }, # Cascadia
  204583  => { 2 => [40, 60, 15], 3 => [80, 70, 10], 4 => [70, 60, 15] }, # Kingdomino
  220308  => { 1 => [40, 50, 20], 2 => [80, 60, 10], 3 => [70, 60, 15], 4 => [55, 50, 25] }, # Gaia Project
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

# stevmachine: heavier, more eclectic strategy shelf
stev_items = [
  224517, 162886, 167791, 342942, 174430, 102794, 169786,
  220308, 12333, 193738, 124361, 199792, 237182, 312484,
  2651, 31260, 3076, 161936, 266192
]

# donutgamer: family-friendly, gateway + midweight
donut_items = [
  13, 822, 30549, 68448, 9209, 36218, 40692,
  148228, 70323, 230802, 204583, 295947, 173346, 284083,
  266192, 34635, 199792, 167791, 162886
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
    picked_game_id: bgg_things[162886].id # Spirit Island
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
