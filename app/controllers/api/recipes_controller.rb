class Api::RecipesController < ApplicationController
  # GET /recipes
  # Query params: limit (default: 20), start (default: 0)
  def index
    limit = int_param(:limit, default: 20, min: 0, max: 100)
    start = int_param(:start, default: 0, min: 0, max: 10_000)

    if limit.nil? || start.nil?
      return render json: error_response('INVALID_PARAMETER', 'limit または start が不正です'), status: :bad_request
    end

    scope = Recipe.order(created_at: :desc)
    total = scope.count
    recipes = scope.offset(start).limit(limit)

    render json: {
      total: total,
      recipes: recipes.map { |r| serialize_summary(r) }
    }
  end

  # GET /recipes/:id
  def show
    recipe = Recipe.find_by(uuid: params[:id])
    return render json: error_response('NOT_FOUND', '指定されたレシピが存在しません'), status: :not_found if recipe.nil?

    render json: serialize_detail(recipe)
  end

  private

  def serialize_summary(recipe)
    {
      id: recipe.uuid,
      type: 'videos',
      attributes: {
        title: recipe.title,
        thumbnail_url: thumbnail_url_for(recipe),
        cooking_time: recipe.cooking_time,
        estimated_cost: recipe.estimated_cost,
        review_score: recipe.review_score,
        category: recipe.category
      }
    }
  end

  def serialize_detail(recipe)
    {
      id: recipe.uuid,
      type: 'videos',
      attributes: {
        title: recipe.title,
        description: recipe.description,
        cooking_time: recipe.cooking_time,
        estimated_cost: recipe.estimated_cost,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        tips: recipe.tips,
        review_score: recipe.review_score,
        video_url: video_url_for(recipe),
        thumbnail_url: thumbnail_url_for(recipe),
        category: recipe.category,
        comment: recipe.comment,
        taberepos: recipe.taberepos
      }
    }
  end

  def thumbnail_url_for(recipe)
    recipe.thumbnail_url.presence || (recipe.thumbnail.attached? ? url_for(recipe.thumbnail) : nil)
  end

  def video_url_for(recipe)
    recipe.video_url.presence || (recipe.video.attached? ? url_for(recipe.video) : nil)
  end

  def error_response(code, message)
    { code: code, message: message }
  end

  def int_param(name, default:, min:, max:)
    return default unless params.key?(name)
    raw = params[name]
    begin
      val = Integer(raw)
    rescue ArgumentError, TypeError
      return nil
    end
    return nil if val < min || val > max
    val
  end
end
