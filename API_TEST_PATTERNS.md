# 🧪 Gemini Function Calling AI エージェント - API テストパターン

## 🚀 サーバー起動

```bash
# Next.jsサーバーを起動
npm run dev

# サーバーが起動したら以下のURLでアクセス可能
# Local: http://localhost:3000
```

## 🎯 3 パターンテスト

### **パターン 1: コマンド型ツール（JSON レスポンス直接返却）**

#### 1.1 動画検索

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "ハンバーグの動画を見せて"}'
```

**期待レスポンス**:

```json
{
  "type": "video_search",
  "payload": {
    "query": "ハンバーグ"
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
  "type": "video_control",
  "payload": {
    "action": "seek_backward",
    "seconds": 30
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
  "type": "timer_control",
  "payload": {
    "action": "start",
    "seconds": 300
  }
}
```

---

### **パターン 2: 情報取得型ツール（AI 回答生成）**

#### 2.1 レシピ検索

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "カレーの作り方を教えて"}'
```

**期待レスポンス**:

```json
{
  "type": "generate_text_response",
  "payload": {
    "message": "基本のカレーの作り方をご紹介しますね！\n\n【材料】\n・主材料A: 300g\n・主材料B: 2個\n・調味料C: 大さじ2\n・調味料D: 適量\n\n【手順】\n1. 材料の準備と下ごしらえを行う\n2. 主材料Aを中火で炒める（5分程度）\n3. 主材料Bを加えてさらに炒める\n4. 調味料Cと調味料Dで味付けをする\n5. 蓋をして弱火で15分煮込んで完成\n\n【コツ】\n材料Aはしっかり炒めることで旨味が増します。\n\n調理時間: 約30分\n難易度: 初級"
  }
}
```

#### 2.2 材料について質問

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "オムライスのレシピを知りたい"}'
```

#### 2.3 具体的な料理名での検索

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "唐揚げの材料と手順を教えて"}'
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
  "type": "generate_text_response",
  "payload": {
    "message": "玉ねぎは透明になるまで中火で5-7分ほど炒めると甘みが出て美味しくなりますよ。焦げないように時々かき混ぜてくださいね。"
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
  -d '{"speechText": "動画を最初から再生"}'
```

#### タイマー（複雑な時間指定）

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "2分30秒のタイマーをお願いします"}'
```

#### 曖昧な検索クエリ

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "簡単で美味しい夕食のレシピ"}'
```

---

## 🐛 エラーケーステスト

### **無効な入力**

```bash
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": ""}'
```

### **API キー未設定時**

```bash
# .env.localファイルを一時的にリネームして実行
mv .env.local .env.local.bak
curl -X POST http://localhost:3000/api/voice-command \
  -H "Content-Type: application/json" \
  -d '{"speechText": "テスト"}'
# 元に戻す
mv .env.local.bak .env.local
```

---

## 📊 ログ確認ポイント

### **正常動作時のログ例**

```
🔥 [API] 音声コマンド受信
🎤 [API] 音声テキスト: "ハンバーグの動画を見せて"
🤖 [AI] Gemini Function Calling処理開始
✅ [AI] Gemini Function Calling初期化完了
🔍 [AI] Gemini Function Calling実行結果: {...}
🛠️ [AI] Function Call検出: [...]
🛠️ [AI] 関数使用: video_search {...}
🎯 [AI] パターン1: コマンド実行
🎯 [API] パターン1で処理完了
📤 [API] レスポンス: {...}
```

### **チェックポイント**

- ✅ Gemini 初期化成功
- ✅ Function Call 自動検出
- ✅ 適切なパターン分類（1/2/3）
- ✅ 正しいレスポンス形式

---

## 🎯 期待される動作

| パターン       | Gemini の動作                  | レスポンス形式           | 特徴                         |
| -------------- | ------------------------------ | ------------------------ | ---------------------------- |
| **パターン 1** | Function Call を自動選択・実行 | ツールの JSON            | フロントエンド向け操作指示   |
| **パターン 2** | Function Call → AI 回答生成    | `generate_text_response` | ツール結果を基にした詳細回答 |
| **パターン 3** | Function Call 未使用           | `generate_text_response` | AI 知識のみでの直接回答      |

---

## 🚀 実装の特徴

- **自動意図理解**: Gemini がユーザーの意図を自動分析
- **Function 自動選択**: 適切なツールを自動選択・実行
- **パラメータ自動抽出**: 自然言語から JSON 引数を自動生成
- **文脈考慮回答**: Chat 履歴を維持した会話型 AI
- **エラーハンドリング**: 堅牢なエラー処理機能

これで**本格的な AI エージェント**のテストが可能です！🎉
