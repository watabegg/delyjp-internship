class CreateRecipes < ActiveRecord::Migration[7.1]
  def change
    create_table :recipes do |t|
      t.string :uuid, null: false
      t.string :title, null: false
      t.timestamps
    end
  end
end
