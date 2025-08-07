Rails.application.routes.draw do
  namespace :api do
    resources :recipes, only: [ :index, :show ], param: :uuid
  end
end
