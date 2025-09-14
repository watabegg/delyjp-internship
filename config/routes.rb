Rails.application.routes.draw do
  # OpenAPI仕様に合わせてトップレベルに /recipes エンドポイントを公開
  resources :recipes, only: [:index, :show], controller: 'api/recipes'
end
