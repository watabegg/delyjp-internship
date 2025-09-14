class AddRecipeFieldsFromJson < ActiveRecord::Migration[7.1]
  def change
    change_table :recipes, bulk: true do |t|
      t.text :description
      t.integer :cooking_time
      t.integer :estimated_cost
      t.text :ingredients
      t.json :instructions
      t.json :tips
      t.float :review_score
      t.string :video_url
      t.string :thumbnail_url
      t.json :category
      t.json :comment
      t.json :taberepos
    end

    # 既にインデックスがある場合を考慮しつつ、無ければユニークインデックスを追加
    unless index_exists?(:recipes, :uuid)
      add_index :recipes, :uuid, unique: true
    end
  end
end
