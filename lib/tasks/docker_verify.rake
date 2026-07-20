# frozen_string_literal: true

# docker_verify.rake — Phase 1 deploy verification (D-12)
#
# Runs docker build locally and asserts the resulting image meets Phase 1
# acceptance criteria. Does NOT push to a registry or run kamal deploy.
#
# Usage:
#   bundle exec rake docker:verify
#
# Expected assertions:
#   1. docker build . exits 0
#   2. public/index.html exists (compiled SPA from Vite build)
#   3. bin/rails is executable (Rails runtime present)
#   4. .env.bggeek.keys is absent (private key NOT in image — T-3-01)
#   5. .env.keys is absent (alternate key filename NOT in image)
#   6. .env.bggeek is present (encrypted file must be in image)
#   7. config/deploy.yml exists with required placeholders (D-14)

namespace :docker do
  desc "Verify the Docker image builds and meets Phase 1 acceptance criteria"
  task :verify do
    failures = []

    puts "=" * 60
    puts "Phase 1 Docker Verification (D-12)"
    puts "=" * 60

    # Step 1: Validate config/deploy.yml (D-14 placeholders)
    puts "\n[1/8] Checking config/deploy.yml (D-14 placeholders)..."
    deploy_yml = "config/deploy.yml"
    if !File.exist?(deploy_yml)
      failures << "#{deploy_yml} not found"
      puts "  ✗ NOT FOUND"
    else
      content = File.read(deploy_yml)
      checks = {
        "service: boardgame-night" =>  content.include?("service: boardgame-night"),
        "image: ghcr.io/youruser/boardgame-night" => content.include?("image: ghcr.io/youruser/boardgame-night"),
        "DOTENV_PRIVATE_KEY_BGGEEK" => content.include?("DOTENV_PRIVATE_KEY_BGGEEK"),
        "RAILS_MASTER_KEY" => content.include?("RAILS_MASTER_KEY")
      }
      checks.each do |name, ok|
        if ok
          puts "  ✓ #{name}"
        else
          failures << "#{deploy_yml} missing: #{name}"
          puts "  ✗ MISSING: #{name}"
        end
      end

      # Validate YAML parses
      begin
        require "yaml"
        parsed = YAML.safe_load(content)
        if parsed.is_a?(Hash)
          puts "  ✓ YAML parses successfully"
        end
      rescue => e
        failures << "YAML parse error: #{e.message}"
        puts "  ✗ YAML PARSE ERROR: #{e.message}"
      end
    end

    # Step 2: Build the Docker image
    puts "\n[2/8] Building Docker image..."
    output = `docker build -q . 2>&1`.strip
    unless $?.success?
      failures << "docker build failed:\n#{output}"
      puts "  ✗ BUILD FAILED"
    else
      image_id = output
      puts "  ✓ Image built: #{image_id}"

      # Tag locally for reference (no push)
      system("docker tag #{image_id} ghcr.io/youruser/boardgame-night:phase1 2>/dev/null")
      puts "  ✓ Tagged locally as ghcr.io/youruser/boardgame-night:phase1 (not pushed)"

      # Step 3: Check compiled SPA present
      puts "\n[3/8] Checking public/index.html (compiled SPA)..."
      output = `docker run --rm #{image_id} ls /app/public/index.html 2>&1`.strip
      if $?.success?
        puts "  ✓ #{output}"
      else
        failures << "public/index.html not found in image"
        puts "  ✗ NOT FOUND"
      end

      # Step 4: Check Rails runtime executable
      puts "\n[4/8] Checking bin/rails (Rails runtime)..."
      if system("docker run --rm #{image_id} test -x /app/bin/rails 2>/dev/null")
        puts "  ✓ bin/rails is executable"
      else
        failures << "bin/rails not executable in image"
        puts "  ✗ NOT EXECUTABLE"
      end

      # Step 5: Verify .env.bggeek.keys is absent (T-3-01 hazard test)
      puts "\n[5/8] Checking .env.bggeek.keys is ABSENT..."
      if system("docker run --rm #{image_id} sh -c 'test ! -e /app/.env.bggeek.keys' 2>/dev/null")
        puts "  ✓ .env.bggeek.keys absent (private key not in image)"
      else
        failures << ".env.bggeek.keys FOUND in image — security breach (T-3-01)"
        puts "  ✗ FOUND — SECURITY BREACH"
      end

      # Step 6: Verify .env.keys is absent
      puts "\n[6/8] Checking .env.keys is ABSENT..."
      if system("docker run --rm #{image_id} sh -c 'test ! -e /app/.env.keys' 2>/dev/null")
        puts "  ✓ .env.keys absent"
      else
        failures << ".env.keys FOUND in image — security breach"
        puts "  ✗ FOUND — SECURITY BREACH"
      end

      # Step 7: Verify .env.bggeek is present (encrypted file)
      puts "\n[7/8] Checking .env.bggeek is present..."
      if system("docker run --rm #{image_id} test -f /app/.env.bggeek 2>/dev/null")
        puts "  ✓ .env.bggeek present (encrypted)"
      else
        failures << ".env.bggeek not found in image — BGG_TOKEN won't load at runtime"
        puts "  ✗ NOT FOUND"
      end
    end

    # Step 8: Verify no kamal deploy or docker push was invoked
    puts "\n[8/8] Verifying no kamal deploy or docker push (D-12 prohibition)..."
    puts "  ✓ (rakefile runs build only — no deploy/push in code)"

    puts "\n" + "=" * 60
    if failures.empty?
      puts "RESULT: ✅ All docker_verify checks passed!"
      puts "Phase 1 deploy acceptance: PASS (D-12: local docker build only)"
    else
      puts "RESULT: ❌ #{failures.size} failure(s):"
      failures.each { |f| puts "  - #{f}" }
      abort "docker:verify failed — #{failures.size} assertion(s) did not pass"
    end
    puts "=" * 60
  end
end
