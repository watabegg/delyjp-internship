# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

require 'json'

# JSON ファイル（videos_data.json）からデータを読み込み、recipes に投入します。
# 何度実行しても重複しないよう、uuid(id) で upsert 相当の処理を行います。

json_path = Rails.root.join('videos_data.json')
json = JSON.parse(File.read(json_path))

# 添付用のサンプルファイル（ActiveStorage を使う既存 API の互換維持用）
thumbnail_sample_path = Rails.root.join('db/seeds/files/thumbnail_square_original.png')
video_sample_path = Rails.root.join('db/seeds/files/original.mp4')

json.fetch('data', []).each do |item|
  attrs = item.fetch('attributes', {})

  recipe = Recipe.find_or_initialize_by(uuid: item['id'])
  recipe.title = attrs['title']
  recipe.description = attrs['description']
  recipe.cooking_time = attrs['cooking_time']
  recipe.estimated_cost = attrs['estimated_cost']
  recipe.ingredients = attrs['ingredients']
  recipe.instructions = attrs['instructions']
  recipe.tips = attrs['tips']
  recipe.review_score = attrs['review_score']
  recipe.video_url = attrs['video_url']
  recipe.thumbnail_url = attrs['thumbnail_url']
  recipe.category = attrs['category']
  recipe.comment = attrs['comment']
  recipe.taberepos = attrs['taberepos']
  recipe.save!

  # 既存 API 互換のため、最低限のサンプルファイルを添付（既に添付済みならスキップ）
  if recipe.thumbnail.attached? == false && File.exist?(thumbnail_sample_path)
    recipe.thumbnail.attach(io: File.open(thumbnail_sample_path), filename: File.basename(thumbnail_sample_path))
  end
  if recipe.video.attached? == false && File.exist?(video_sample_path)
    recipe.video.attach(io: File.open(video_sample_path), filename: File.basename(video_sample_path))
  end
end
