# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

recipe = Recipe.new(
  uuid: SecureRandom.uuid,
  title: 'test'
)
recipe.thumbnail.attach(io: File.open(Rails.root.join('db/seeds/files/thumbnail_square_original.png')), filename: 'thumbnail_square_original.png')
recipe.video.attach(io: File.open(Rails.root.join('db/seeds/files/original.mp4')), filename: 'original.mp4')
recipe.save!
