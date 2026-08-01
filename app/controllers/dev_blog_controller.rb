# frozen_string_literal: true

class DevBlogController < ApplicationController
  def index
    index_path = Rails.public_path.join("dev-blog", "index.html")

    if index_path.exist?
      response.headers["Cache-Control"] = "public, max-age=3600"
      send_file index_path, type: "text/html; charset=utf-8", disposition: "inline"
    else
      head :not_found
    end
  end
end
