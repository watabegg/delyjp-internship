# Kurashiru Summer Internship Web 2025

## セットアップ

### 必要な環境
- Docker
- Docker Compose

### 起動方法

1. リポジトリをクローン
```bash
git clone https://github.com/delyjp/kurashiru-summer-internship-web-2025.git
cd kurashiru-summer-internship-web-2025
```

2. Docker Composeでコンテナを起動
```bash
docker-compose up
```

3. 別のターミナルでデータベースのセットアップ
```bash
# データベースの作成
docker-compose exec app rails db:create

# マイグレーションの実行
docker-compose exec app rails db:migrate

# シードデータの投入
docker-compose exec app rails db:seed
```

4. ブラウザでアクセス
```
http://localhost:3001
```

## API エンドポイント

- `GET /api/recipes` - レシピ一覧を取得
- `GET /api/recipes/:uuid` - 特定のレシピを取得

## 開発

### コンテナに入る
```bash
docker-compose exec app /bin/bash
```

### コンテナの停止
```bash
docker-compose down
```

### ログの確認
```bash
docker-compose logs -f app
```
