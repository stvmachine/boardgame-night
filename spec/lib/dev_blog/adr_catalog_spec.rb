# frozen_string_literal: true

require "rails_helper"
require "dev_blog"

RSpec.describe DevBlog::AdrCatalog do
  let(:project_root) do
    temp_parent = DevBlog.project_root.join("tmp")
    temp_parent.mkpath
    Pathname.new(Dir.mktmpdir(".dev-blog-adr-catalog-", temp_parent.to_s))
  end
  let(:adr_dir) { project_root.join("docs", "adr") }

  after do
    FileUtils.remove_entry(project_root) if project_root.directory?
  end

  def write_index(content)
    adr_dir.mkpath
    adr_dir.join("README.md").write(content)
  end

  def write_adr(filename, number:, title:, status:, body: "Context.")
    adr_dir.join(filename).write(<<~MARKDOWN)
      # ADR-#{number.to_s.rjust(3, '0')}: #{title}

      ## Status

      #{status}

      ## Context

      #{body}
    MARKDOWN
  end

  def load
    described_class.load(index_path: adr_dir.join("README.md"), project_root: project_root)
  end

  describe ".load" do
    it "returns accepted ADRs in ascending number order" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-002](./002-second.md) | Second | accepted | 2026-08-02 |
        | [ADR-001](./001-first.md) | First | accepted | 2026-08-01 |
      MARKDOWN
      write_adr("001-first.md", number: 1, title: "First", status: "accepted")
      write_adr("002-second.md", number: 2, title: "Second", status: "accepted")

      adrs = load
      expect(adrs.map(&:number)).to eq([1, 2])
      expect(adrs.map(&:title)).to eq(["First", "Second"])
      expect(adrs.map(&:status)).to all(eq("accepted"))
    end

    it "validates non-accepted rows but does not return them" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./001-accepted.md) | Accepted | accepted | 2026-08-01 |
        | [ADR-002](./002-proposed.md) | Proposed | proposed | 2026-08-02 |
      MARKDOWN
      write_adr("001-accepted.md", number: 1, title: "Accepted", status: "accepted")
      write_adr("002-proposed.md", number: 2, title: "Proposed", status: "proposed")

      adrs = load
      expect(adrs.map(&:number)).to eq([1])
    end

    it "raises for a malformed table row" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001] | Title | accepted | 2026-08-01 |
      MARKDOWN

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /malformed ADR catalog row/)
    end

    it "raises when the link number does not match the catalog number" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./002-wrong.md) | Wrong | accepted | 2026-08-01 |
      MARKDOWN
      write_adr("002-wrong.md", number: 2, title: "Wrong", status: "accepted")

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost)
    end

    it "raises when the filename number does not match the catalog number" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./002-mismatch.md) | Mismatch | accepted | 2026-08-01 |
      MARKDOWN
      write_adr("002-mismatch.md", number: 1, title: "Mismatch", status: "accepted")

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /link filename must match/)
    end

    it "raises for a non-relative link" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](/001-absolute.md) | Absolute | accepted | 2026-08-01 |
      MARKDOWN

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /direct relative .md path/)
    end

    it "raises for a path containing a directory separator" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./sub/001-nested.md) | Nested | accepted | 2026-08-01 |
      MARKDOWN

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /direct relative .md path/)
    end

    it "raises for a path containing traversal" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./../001-escape.md) | Escape | accepted | 2026-08-01 |
      MARKDOWN

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /unsafe|escapes/)
    end

    it "raises for a path containing an encoded dot trick" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./.%2e%2e/001-escape.md) | Encoded | accepted | 2026-08-01 |
      MARKDOWN

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /unsafe|escapes/)
    end

    it "raises for a README self-link" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./README.md) | README | accepted | 2026-08-01 |
      MARKDOWN

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /cannot link to README/)
    end

    it "raises for a missing source file" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./001-missing.md) | Missing | accepted | 2026-08-01 |
      MARKDOWN

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /source file missing/)
    end

    it "raises for a symlink that escapes the ADR directory" do
      outside = Pathname.new(Dir.mktmpdir("dev-blog-adr-outside"))
      begin
        write_index(<<~MARKDOWN)
          | ADR | Title | Status | Date |
          |-----|-------|--------|------|
          | [ADR-001](./001-symlink.md) | Symlink | accepted | 2026-08-01 |
        MARKDOWN
        adr_dir.join("001-symlink.md").make_symlink(outside)

        expect {
          load
        }.to raise_error(DevBlog::InvalidPost, /escapes|symlink/)
      ensure
        FileUtils.remove_entry(outside) if outside.directory?
      end
    end

    it "raises for a duplicate catalog number" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./001-first.md) | First | accepted | 2026-08-01 |
        | [ADR-001](./001-second.md) | Second | accepted | 2026-08-02 |
      MARKDOWN
      write_adr("001-first.md", number: 1, title: "First", status: "accepted")
      write_adr("001-second.md", number: 1, title: "Second", status: "accepted")

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /duplicate ADR numbers/)
    end

    it "raises for a body H1 title mismatch" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./001-title.md) | Catalog Title | accepted | 2026-08-01 |
      MARKDOWN
      write_adr("001-title.md", number: 1, title: "Body Title", status: "accepted")

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /body title does not match/)
    end

    it "raises for a body status mismatch" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./001-status.md) | Status | accepted | 2026-08-01 |
      MARKDOWN
      write_adr("001-status.md", number: 1, title: "Status", status: "proposed")

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /body status does not match/)
    end

    it "raises for a body missing the H1" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./001-no-h1.md) | No H1 | accepted | 2026-08-01 |
      MARKDOWN
      adr_dir.join("001-no-h1.md").write("## Status\n\naccepted\n")

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /body H1 is missing/)
    end

    it "raises for a body missing the status section" do
      write_index(<<~MARKDOWN)
        | ADR | Title | Status | Date |
        |-----|-------|--------|------|
        | [ADR-001](./001-no-status.md) | No Status | accepted | 2026-08-01 |
      MARKDOWN
      adr_dir.join("001-no-status.md").write("# ADR-001: No Status\n\nBody.")

      expect {
        load
      }.to raise_error(DevBlog::InvalidPost, /Status section is missing/)
    end

    it "raises for a catalog index outside the project root" do
      outside = Pathname.new(Dir.mktmpdir("dev-blog-adr-index-outside"))
      begin
        outside.join("README.md").write(<<~MARKDOWN)
          | ADR | Title | Status | Date |
          |-----|-------|--------|------|
          | [ADR-001](./001-first.md) | First | accepted | 2026-08-01 |
        MARKDOWN

        expect {
          described_class.load(index_path: outside.join("README.md"), project_root: project_root)
        }.to raise_error(DevBlog::InvalidPost, /outside project root/)
      ensure
        FileUtils.remove_entry(outside) if outside.directory?
      end
    end

    it "loads the real ADR-001 through ADR-014 catalog ascending" do
      adrs = described_class.load(
        index_path: DevBlog.project_root.join("docs", "adr", "README.md"),
        project_root: DevBlog.project_root
      )

      expect(adrs.map(&:number)).to eq((1..14).to_a)
      expect(adrs.map(&:status)).to all(eq("accepted"))
      expect(adrs.map(&:output_slug)).to eq(
        adrs.map { |adr| "#{adr.number.to_s.rjust(3, '0')}-#{adr.slug}" }
      )
    end
  end
end
