# 🧪 Gemini Function Calling AI エージェント - API テストパターン

## 🚀 サーバー起動

```bash
# webディレクトリでNext.jsサーバーを起動
cd web && npm run dev

# サーバーが起動したら以下のURLでアクセス可能
# Local: http://localhost:3000
```

## 🎯 3 パターンテスト

### **パターン 1: コマンド型ツール（JSON レスポンス直接返却）**

#### 1.1 調理法動画（切り方など）

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "みじん切りの動画を見せて"}'
```

**期待レスポンス**:

```json
{
  "kind": "methodToVideo",
  "payload": {
    "method": "START",
    "videoType": "mince"
  }
}
```

#### 1.2 動画操作

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "動画を30秒戻して"}'
```

**期待レスポンス**:

```json
{
  "kind": "videoControll",
  "payload": {
    "instruction": "REWIND",
    "time": 30
  }
}
```

#### 1.3 タイマー操作

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "5分のタイマーをセットして"}'
```

**期待レスポンス**:

```json
{
  "kind": "timer",
  "payload": {
    "method": "START",
    "seconds": 300
  }
}
```

#### 1.4 タイマー再開

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "タイマーを再スタートして"}'
```

**期待レスポンス**:

```json
{
  "kind": "timer",
  "payload": {
    "method": "RESTART",
    "seconds": 300
  }
}
```

---

### **パターン 2: 情報取得型ツール（AI 回答生成）**

#### 2.1 レシピ詳細取得（レシピ ID が必要）

```bash
curl -X POST "http://localhost:3000/api/voice-command?recipe_id=0189e09a-a9ff-40e8-a3d2-2ace759a6ee9" \
  -H "Content-Type: application/json" \
  -d '{"speechText": "このレシピの詳細を教えて"}'
```

**期待レスポンス**:

```json
{
  "kind": "withTalkUser",
  "payload": {
    "talkMessage": "基本のバターカレーの作り方をご紹介しますね！\n\n【材料】\n・牛バラ肉: 300g\n・玉ねぎ: 2個\n・カレールー: 4皿分\n・牛乳: 200ml\n\n【手順】\n1. 玉ねぎを薄切りにして炒める\n2. 牛バラ肉を加えて炒める\n3. 水を加えて15分煮込む\n4. カレールーと牛乳を加えて仕上げる\n\n【コツ】\n玉ねぎはしっかり炒めることで甘みが増します♪\n\n調理時間: 30分\nきっと美味しくできますよ！"
  }
}
```

#### 2.2 材料について質問

```bash
curl -X POST "http://localhost:3000/api/voice-command?recipe_id=0189e09a-a9ff-40e8-a3d2-2ace759a6ee9" \
  -H "Content-Type: application/json" \
  -d '{"speechText": "材料の分量を教えて"}'
```

#### 2.3 作り方について質問

```bash
curl -X POST "http://localhost:3000/api/voice-command?recipe_id=0189e09a-a9ff-40e8-a3d2-2ace759a6ee9" \
  -H "Content-Type: application/json" \
  -d '{"speechText": "手順を詳しく説明して"}'
```

---

### **パターン 3: AI 知識ベース回答（ツール未使用）**

#### 3.1 一般的な料理質問

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "玉ねぎはどのくらい炒めればいい？"}'
```

**期待レスポンス**:

```json
{
  "kind": "withTalkUser",
  "payload": {
    "talkMessage": "玉ねぎは透明になるまで中火で5-7分ほど炒めると甘みが出て美味しくなりますよ♪焦げないように時々かき混ぜてくださいね。"
  }
}
```

#### 3.2 料理のコツについて

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "肉を柔らかくする方法は？"}'
```

#### 3.3 調理器具について

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "フライパンの選び方を教えて"}'
```

#### 3.4 挨拶・雑談

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "こんにちは"}'
```

---

## 🔧 高度なテストパターン

### **複雑な指示のテスト**

#### 動画操作（詳細指定）

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "動画を一時停止して"}'
```

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "動画を再生して"}'
```

#### 調理法動画（複数種類）

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "千切りの動画を見せて"}'
```

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "角切りの方法を教えて"}'
```

#### タイマー（複雑な時間指定）

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "2分30秒のタイマーをお願いします"}'
```

---

## 🐛 エラーケーステスト

### **無効な入力**

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": ""}'
```

**期待レスポンス**:

```json
{
  "kind": "error",
  "payload": {
    "message": "音声テキストが必要です。"
  }
}
```

### **API キー未設定時**

```bash
# web/.env.localファイルを一時的にリネームして実行
cd web
mv .env.local .env.local.bak
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "テスト"}'
# 元に戻す
mv .env.local.bak .env.local
```

**期待レスポンス**:

```json
{
  "kind": "error",
  "payload": {
    "message": "申し訳ありません。処理中にエラーが発生しました。"
  }
}
```

---

## 📊 ログ確認ポイント

### **正常動作時のログ例**

```
🔥 [API] 音声コマンド受信
🎤 [API] 音声テキスト: "みじん切りの動画を見せて"
🆔 [AI] 受信レシピID: 未指定
🤖 [AI] Gemini Function Calling処理開始
✅ [AI] Gemini Function Calling初期化完了
🔍 [AI] Gemini応答: {...}
🛠️ [AI] Function Call検出: [...]
🛠️ [AI] 関数使用: method_video {...}
🎯 [AI] パターン1: コマンド実行
🎯 [API] パターン1で処理完了
📤 [API] レスポンス: {"kind": "methodToVideo", "payload": {...}}
```

### **チェックポイント**

- ✅ Gemini 初期化成功
- ✅ Function Call 自動検出
- ✅ 適切なパターン分類（1/2/3）
- ✅ 正しいレスポンス形式（kind/payload）
- ✅ レシピ ID 連携（Pattern 2 の場合）

---

## 🎯 期待される動作

| パターン       | Gemini の動作                  | レスポンス形式               | 特徴                         |
| -------------- | ------------------------------ | ---------------------------- | ---------------------------- |
| **パターン 1** | Function Call を自動選択・実行 | ツールの JSON (kind/payload) | フロントエンド向け操作指示   |
| **パターン 2** | Function Call → AI 回答生成    | `withTalkUser`               | ツール結果を基にした詳細回答 |
| **パターン 3** | Function Call 未使用           | `withTalkUser`               | AI 知識のみでの直接回答      |

---

## 🚀 実装の特徴

- **自動意図理解**: Gemini がユーザーの意図を自動分析
- **Function 自動選択**: 適切なツールを自動選択・実行
- **パラメータ自動抽出**: 自然言語から JSON 引数を自動生成
- **レシピ ID 連携**: フロントエンドから渡されたレシピ ID を利用
- **3 パターン自動振り分け**: コマンド型/情報型/知識型を自動判定
- **統一レスポンス形式**: すべて `kind/payload` 形式で返却
- **文脈考慮回答**: Chat 履歴を維持した会話型 AI
- **エラーハンドリング**: 堅牢なエラー処理機能

## 🎉 利用可能なツール

### **コマンド型ツール（Pattern 1）**

- `method_video`: 調理法動画制御（みじん切り、千切りなど）
- `video_control`: 動画再生制御（再生、停止、早送りなど）
- `timer_control`: タイマー制御（開始、停止、リセット、再開など）

### **情報型ツール（Pattern 2）**

- `recipe_search`: レシピ詳細取得（材料、手順、コツなど）

これで**本格的な AI クッキングアシスタント**のテストが可能です！🎉
