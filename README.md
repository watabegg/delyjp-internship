# Kurashiru Summer Internship Web 2025

## セットアップ

### 必要な環境
- Docker
- Docker Compose

### バックエンドの起動方法

1. リポジトリをクローン
```bash
git clone https://github.com/delyjp/kurashiru-summer-internship-web-2025.git
cd kurashiru-summer-internship-web-2025
```

2. .envを作成
```bash
cp .env.sample .env
```

3. Docker Composeでコンテナを起動
```bash
docker-compose up
```

4. 別のターミナルでデータベースのセットアップ
```bash
# データベースの作成
docker-compose exec app rails db:create

# マイグレーションの実行
docker-compose exec app rails db:migrate

# シードデータの投入
docker-compose exec app rails db:seed
```

5. ブラウザでアクセス。Railsが起動していることを確認
```
http://localhost:3001
```


### webの起動方法

1. 環境構築

webはDockerコンテナではなく、ローカルのNode.js環境で動かします。
.node-versionに従い、nodeの22系をインストールしてください。また、パッケージマネージャーとしてmiseの設定ファイル(.mise.toml)を用意しています。miseを使っている場合は
```
mise install
```
でnode 22.17.0がインストールされます。

2. webディレクトリでパッケージをinstall

```
npm i
```

3. webディレクトリでNext.jsを起動

```
npm run dev
```

4. ブラウザでアクセス。Railsから返却されたレシピーデーが表示されることを確認

```
http://localhost:3000
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
