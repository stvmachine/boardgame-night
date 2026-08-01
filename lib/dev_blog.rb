# frozen_string_literal: true

require "cgi"
require "date"
require "erb"
require "fileutils"
require "pathname"
require_relative "dev_blog/post"
require_relative "dev_blog/post_parser"
require_relative "dev_blog/markdown_converter"

module DevBlog
  class Builder
    INDEX_TEMPLATE = <<~ERB
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title><%= CGI.escapeHTML(site_title) %></title>
        <meta name="description" content="<%= CGI.escapeHTML(site_description) %>">
      </head>
      <body>
        <header>
          <h1><%= CGI.escapeHTML(site_title) %></h1>
          <p><%= CGI.escapeHTML(site_description) %></p>
        </header>
        <main>
          <% posts.each do |post| %>
            <article>
              <h2><a href="/blog/posts/<%= post.slug %>/"><%= CGI.escapeHTML(post.title) %></a></h2>
              <time datetime="<%= post.date.iso8601 %>"><%= post.date.strftime("%B %-d, %Y") %></time>
              <p><%= CGI.escapeHTML(post.description) %></p>
            </article>
          <% end %>
        </main>
      </body>
      </html>
    ERB

    def self.build(source_dir:, output_dir:)
      source_path = Pathname.new(source_dir)
      output_path = Pathname.new(output_dir)

      posts = source_path.glob("*.md").map { |path| PostParser.parse(path) }.sort

      output_path.mkpath
      output_path.join("index.html").write(render_index(posts), encoding: "UTF-8")

      { posts_count: posts.size, output_dir: output_path }
    end

    def self.render_index(posts)
      site_title = "Boardgame Night Engineering Blog"
      site_description = "Notes on building the boardgame-night Rails + React app."
      ERB.new(INDEX_TEMPLATE, trim_mode: "-").result(binding)
    end
  end
end
