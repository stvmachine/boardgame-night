# frozen_string_literal: true

# Server-side-only loader for dotenvx-encrypted .env.bggeek.
#
# Primary decrypt path: bin/dev / Procfile.dev wraps Rails in `dotenvx run -f
# .env.bggeek -fk .env.bggeek.keys -- bin/rails server`.
#
# This initializer is a defense-in-depth fallback: when Rails is started
# directly (bin/rails s, docker run, etc.) without the dotenvx wrapper, it
# decrypts .env.bggeek using DOTENV_PRIVATE_KEY_BGGEEK.
#
# Never expose decrypted values to the frontend — they live in process ENV only.

if File.exist?(Rails.root.join(".env.bggeek"))
  # Load DOTENV_PRIVATE_KEY_BGGEEK from .env.bggeek.keys if the env var isn't set
  if ENV["DOTENV_PRIVATE_KEY_BGGEEK"].blank?
    keys_path = Rails.root.join(".env.bggeek.keys")
    if File.exist?(keys_path)
      File.read(keys_path).each_line do |line|
        next if line.start_with?("#") || line.strip.empty?
        key, value = line.strip.split("=", 2)
        ENV[key] = value if key == "DOTENV_PRIVATE_KEY_BGGEEK" && value.present?
      end
    end
  end

  # Decrypt and load values via dotenvx CLI (defense-in-depth fallback)
  if ENV["DOTENV_PRIVATE_KEY_BGGEEK"].present? && ENV["BGG_TOKEN"].blank?
    begin
      json_output = `dotenvx get -f #{Rails.root.join(".env.bggeek")} 2>/dev/null`
      unless json_output.strip.empty?
        parsed = JSON.parse(json_output)
        parsed.each { |key, value| ENV[key] ||= value }
      end
    rescue StandardError => e
      Rails.logger.warn("[dotenv_bggeek] dotenvx decryption failed: #{e.message}")
      # In development, surface the error so it's not missed
      raise e if Rails.env.development?
    end
  end
end
