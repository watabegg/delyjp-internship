# Express.js 音声エージェントサーバー用 Dockerfile
FROM node:22-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションコードをコピー
COPY . .

# ポート3002を公開
EXPOSE 3002

# 開発サーバーを起動
CMD ["npm", "run", "dev"]
