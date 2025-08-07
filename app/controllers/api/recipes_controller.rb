class Api::RecipesController < ApplicationController

  def index
    recipes = Recipe.all.map do |recipe|
      build_json_response(recipe)
    end

    render json: recipes
  end

  def show
    recipe = Recipe.find_by(uuid: params[:uuid])

    render json: build_json_response(recipe)
  end

  private

  def build_json_response(recipe)
    {
      uuid: recipe.uuid,
      title: recipe.title,
      thumbnail: url_for(recipe.thumbnail),
      video: url_for(recipe.video)
    }
  end
end
