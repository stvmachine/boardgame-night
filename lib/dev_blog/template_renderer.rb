# frozen_string_literal: true

require "cgi"
require "erb"
require "pathname"

module DevBlog
  class TemplateRenderer
    ALLOWED_TEMPLATES = %w[index.html.erb post.html.erb adr.html.erb].freeze

    attr_reader :templates_dir

    def initialize(templates_dir:)
      path = Pathname.new(templates_dir).expand_path

      unless path.directory?
        raise InvalidPost, "templates directory does not exist: #{path}"
      end

      @templates_dir = path
    end

    def render_index(posts:, adrs: [])
      render(
        template_name: "index.html.erb",
        site_title: "Boardgame Night Engineering Blog",
        site_description: "Notes on building the boardgame-night Rails + React app.",
        posts: posts,
        adrs: adrs
      )
    end

    def render_post(post:)
      render(
        template_name: "post.html.erb",
        post: post,
        body_html: post.body_html
      )
    end

    def render_adr(adr:)
      render(
        template_name: "adr.html.erb",
        adr: adr,
        body_html: adr.body_html
      )
    end

    def render(template_name:, **locals)
      template_path = resolve_template(template_name)
      template = ERB.new(template_path.read(encoding: "UTF-8"), trim_mode: "-")
      context = TemplateContext.new(locals)
      template.result(context.binding)
    end

    private

      def resolve_template(name)
        unless ALLOWED_TEMPLATES.include?(name.to_s)
          raise InvalidPost, "invalid template name: #{name.inspect}"
        end

        template_path = templates_dir.join(name).expand_path

        unless template_path.to_s.start_with?(templates_dir.to_s)
          raise InvalidPost, "invalid template name: #{name.inspect}"
        end

        unless template_path.file?
          raise InvalidPost, "template not found: #{name}"
        end

        template_path
      end
  end

  class TemplateContext
    def initialize(locals)
      locals.each do |key, value|
        instance_variable_set("@#{key}", value)
      end
      @locals = locals
    end

    def h(value)
      CGI.escapeHTML(value.to_s)
    end

    def method_missing(name, *args, &block)
      if @locals.key?(name)
        @locals[name]
      else
        super
      end
    end

    def respond_to_missing?(name, include_private = false)
      @locals.key?(name) || super
    end

    def binding
      ::Kernel.binding
    end
  end
end
