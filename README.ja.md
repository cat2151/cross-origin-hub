# Cross-Origin Hub

**複数の独立したWebアプリケーションを、ローカル環境でシームレスに統合するエコシステム**

## 状況

- これはAI生成ドキュメントで、読みづらいです。誤りもあります。今後、人力で修正する予定です。
- このプロジェクトはまだ未着手です。今後、着手予定です。

## 概要

Cross-Origin Hubは、異なるドメインで開発された独立したWebアプリケーションが、エンドユーザーのローカルPC上で相互通信し、シームレスに統合されたユーザー体験を提供するための革新的なフレームワークである。

### 核心的価値提案

- **開発者の自由**: 各開発者が独自ドメインで完全に独立したWebアプリを開発できる
- **エンドユーザーの柔軟性**: 任意の組み合わせのアプリを同時に開き、統合された体験を得られる
- **簡単な統合**: 小さなJavaScriptライブラリを組み込むだけで、クロスオリジン通信が可能になる
- **プライバシーとセキュリティ**: すべての通信はローカルPC上で完結し、外部サーバーを経由しない

## これまでの課題

### 1. Webのセキュリティモデルによる制約

ブラウザのSame-Origin Policy（同一オリジンポリシー）により、異なるドメインのWebページ間での直接的な通信は原則として禁止されている。これは以下の問題を引き起こしてきた：

- 異なる開発者が作った優れたWebツールを組み合わせて使うことができない
- 統合のためには、すべてを同一ドメイン上で再実装する必要がある
- または、中央集権的なクラウドサービスに依存せざるを得ない

### 2. 既存の統合ソリューションの限界

**Zapier / IFTTT型のアプローチ:**
- クラウド上の中央サーバーが必須
- プライバシーの懸念（すべてのデータが第三者サーバーを経由）
- 開発者が中央プラットフォームに依存する必要がある
- オフライン環境では動作しない

**ブラウザ拡張機能型のアプローチ:**
- ユーザーに拡張機能のインストールを強制する
- 各ブラウザごとに異なる実装が必要
- セキュリティ審査やストア登録のハードルが高い

**BroadcastChannel / SharedWorker:**
- 同一オリジン内でのみ動作
- 異なるドメインのアプリ間では使用不可能

## Cross-Domain Bridgeが実現する新たな価値

### 1. 真に分散型のWebアプリエコシステム

```
開発者A: https://sound.com で音声編集アプリを開発
開発者B: https://notes.com でノート編集アプリを開発
開発者C: https://video.com で動画編集アプリを開発

↓ Cross-Domain Bridgeライブラリを組み込むだけ

エンドユーザー: ブラウザで左に sound.com、右に notes.com を開く
→ 音声編集で作った音声が、ノートにシームレスに統合される
```

### 2. 具体的なユースケース

#### ケース1: クリエイティブワークフロー統合
- 左ページ: 音声編集アプリ（sound.com）
- 右ページ: ノートアプリ（notes.com）
- **統合体験**: 音声編集で作成した音声を、リアルタイムでノートに埋め込み、プレビューできる

#### ケース2: データ分析と可視化
- 左ページ: データ整形ツール（data.com）
- 右ページ: グラフ作成ツール（chart.com）
- **統合体験**: データを整形すると、即座にグラフが更新される

#### ケース3: コラボレーション
- 左ページ: ホワイトボードアプリ（whiteboard.com）
- 右ページ: タスク管理アプリ（tasks.com）
- **統合体験**: ホワイトボードで議論した内容が、タスクとして自動的に追加される

### 3. 開発者とエンドユーザー双方へのメリット

**開発者にとって:**
- 独自ドメインでの独立した開発が可能
- 既存のWebアプリに少量のコードを追加するだけで参加できる
- 中央プラットフォームへの依存なし
- 他のアプリとの統合により、自分のアプリの価値が向上

**エンドユーザーにとって:**
- 好きなアプリを自由に組み合わせて使える
- プライバシーが守られる（すべてローカルで完結）
- オフライン環境でも動作
- 複数のサービス間でのコピー＆ペーストが不要になる

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────┐
│               エンドユーザーのローカルPC                    │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │  ブラウザ - 左ページ   │  │  ブラウザ - 右ページ   │    │
│  │  https://sound.com   │  │  https://notes.com   │    │
│  │                      │  │                      │    │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │    │
│  │  │  Hub Library   │  │  │  │  Hub Library   │  │    │
│  │  └────────┬───────┘  │  │  └────────┬───────┘  │    │
│  └───────────┼──────────┘  └───────────┼──────────┘    │
│              │ WebSocket                │ WebSocket    │
│              │                          │              │
│              └──────────┬───────────────┘              │
│                         │                              │
│              ┌──────────▼──────────┐                   │
│              │   Native Hub App    │                   │
│              │  (127.0.0.1:8787)   │                   │
│              │                     │                   │
│              │  ┌───────────────┐  │                   │
│              │  │ CORS Policy   │  │                   │
│              │  │ Whitelist:    │  │                   │
│              │  │ - sound.com   │  │                   │
│              │  │ - notes.com   │  │                   │
│              │  └───────────────┘  │                   │
│              │                     │                   │
│              │  ┌───────────────┐  │                   │
│              │  │ Message Router│  │                   │
│              │  └───────────────┘  │                   │
│              └─────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### コンポーネント

#### 1. Native Hub App（ネイティブアプリサーバー）

ローカルPC上で動作するHTTP/WebSocketサーバー。

**責務:**
- WebSocketサーバーとして各Webアプリからの接続を受け付ける
- CORS許可ヘッダーを返し、ホワイトリストに登録されたオリジンのみを許可
- 接続されたクライアント間でメッセージをルーティング
- セキュリティポリシーの管理

**技術スタック（想定）:**
- Node.js / Electron / Tauri
- WebSocket (ws ライブラリ)
- Express.js (HTTP サーバー)

#### 2. Hub Library（JavaScriptライブラリ）

各Webアプリに組み込むクライアント側ライブラリ。

**責務:**
- ローカルのNative Hub Appへの接続確立
- メッセージの送受信APIを提供
- 接続状態の管理とエラーハンドリング
- イベントベースの通信インターフェース

**使用例:**
```javascript
// Webアプリに組み込むコード
import { CrossOriginHub } from 'cross-origin-hub';

const hub = new CrossOriginHub();

// メッセージ送信
bridge.send('audio-created', {
  url: 'blob:https://sound.com/12345',
  duration: 120,
  format: 'wav'
});

// メッセージ受信
bridge.on('note-updated', (data) => {
  console.log('Note was updated:', data);
});
```

## 詳細設計

### 1. セキュリティモデル（VOICEVOX Engineの実装を参考）

#### ホワイトリスト方式のCORSポリシー

VOICEVOX Engineの実装に倣い、明示的なホワイトリスト方式を採用する。

**起動オプション:**
```bash
./cross-origin-hub \
  --allow_origin https://sound.com \
  --allow_origin https://notes.com \
  --allow_origin https://video.com
```

**設定ファイル対応:**
```json
// ~/.cross-origin-hub/config.json
{
  "allowedOrigins": [
    "https://sound.com",
    "https://notes.com",
    "https://video.com"
  ],
  "port": 8787,
  "enableLogging": true
}
```

#### サーバー側実装（Node.js例）

```javascript
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

// 設定読み込み
const config = loadConfig();
const allowedOrigins = config.allowedOrigins || [];

// CORS設定
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(new Error('Origin header required'));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
};

const app = express();
app.use(cors(corsOptions));

// WebSocketサーバー
const wss = new WebSocket.Server({ 
  port: config.port || 8787,
  verifyClient: (info) => {
    const origin = info.origin;
    return allowedOrigins.includes(origin);
  }
});

// 接続管理
const clients = new Map(); // origin -> Set<WebSocket>

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  
  if (!clients.has(origin)) {
    clients.set(origin, new Set());
  }
  clients.get(origin).add(ws);
  
  console.log(`Connected: ${origin}`);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      broadcastMessage(message, ws, origin);
    } catch (error) {
      console.error('Invalid message format:', error);
    }
  });
  
  ws.on('close', () => {
    clients.get(origin).delete(ws);
    console.log(`Disconnected: ${origin}`);
  });
});

function broadcastMessage(message, sender, senderOrigin) {
  const payload = JSON.stringify({
    ...message,
    from: senderOrigin,
    timestamp: Date.now()
  });
  
  // すべての接続クライアントに配信（送信者を除く）
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

console.log(`Bridge server running on port ${config.port || 8787}`);
console.log('Allowed origins:', allowedOrigins);
```

### 2. Hub Library設計

#### クライアントAPI

```javascript
class CrossOriginHub {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || 'ws://127.0.0.1:8787';
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || 3000;
    
    this.ws = null;
    this.eventHandlers = new Map();
    this.connectionState = 'disconnected';
    
    this.connect();
  }
  
  connect() {
    this.ws = new WebSocket(this.serverUrl);
    
    this.ws.onopen = () => {
      this.connectionState = 'connected';
      this.emit('_connected');
      console.log('[CrossOriginHub] Connected');
    };
    
    this.ws.onclose = () => {
      this.connectionState = 'disconnected';
      this.emit('_disconnected');
      console.log('[CrossOriginHub] Disconnected');
      
      if (this.autoReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('[CrossOriginHub] Connection error:', error);
      this.emit('_error', error);
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('[CrossOriginHub] Failed to parse message:', error);
      }
    };
  }
  
  handleMessage(message) {
    const { eventType, data, from, timestamp } = message;
    
    if (this.eventHandlers.has(eventType)) {
      this.eventHandlers.get(eventType).forEach(handler => {
        handler(data, { from, timestamp });
      });
    }
  }
  
  send(eventType, data = {}) {
    if (this.connectionState !== 'connected') {
      console.warn('[CrossOriginHub] Not connected, message queued');
      // TODO: メッセージキュー実装
      return;
    }
    
    const message = {
      eventType,
      data,
      origin: window.location.origin
    };
    
    this.ws.send(JSON.stringify(message));
  }
  
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType).add(handler);
    
    // アンサブスクライブ関数を返す
    return () => {
      this.eventHandlers.get(eventType).delete(handler);
    };
  }
  
  emit(eventType, data) {
    if (this.eventHandlers.has(eventType)) {
      this.eventHandlers.get(eventType).forEach(handler => {
        handler(data);
      });
    }
  }
  
  disconnect() {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }
  
  getConnectionState() {
    return this.connectionState;
  }
}

export default CrossOriginHub;
```

#### 使用例

**sound.comのアプリ:**
```javascript
import CrossOriginHub from 'cross-origin-hub';

const hub = new CrossOriginHub();

// 音声作成時
function onAudioCreated(audioBlob) {
  hub.send('audio-created', {
    url: URL.createObjectURL(audioBlob),
    duration: audioBlob.duration,
    format: 'audio/wav',
    metadata: {
      sampleRate: 44100,
      channels: 2
    }
  });
}

// 他のアプリからのリクエストを受信
hub.on('request-audio-export', (data, meta) => {
  console.log(`Export request from ${meta.from}`);
  exportAudio(data.format);
});
```

**notes.comのアプリ:**
```javascript
import CrossOriginHub from 'cross-origin-hub';

const hub = new CrossOriginHub();

// 音声が作成されたことを検知
hub.on('audio-created', (data, meta) => {
  console.log(`Audio created by ${meta.from}`);
  
  // ノートに音声を埋め込む
  insertAudioIntoNote({
    url: data.url,
    duration: data.duration,
    source: meta.from
  });
});

// 音声のエクスポートをリクエスト
function requestAudioExport(format) {
  hub.send('request-audio-export', { format });
}
```

### 3. メッセージプロトコル

#### 標準メッセージフォーマット

```typescript
interface HubMessage {
  eventType: string;           // イベントタイプ（例: 'audio-created'）
  data: Record<string, any>;   // イベントデータ
  origin?: string;             // 送信元オリジン（サーバー側で追加）
  from?: string;               // 送信元オリジン（受信時）
  timestamp?: number;          // タイムスタンプ（サーバー側で追加）
}
```

#### イベント命名規則（推奨）

```
<リソース>-<アクション>

例:
- audio-created
- audio-updated
- audio-deleted
- note-created
- note-updated
- task-completed
- data-exported
```

### 4. GUI設定ツール（将来実装）

エンドユーザーがコマンドラインを使わずに設定できるGUIを提供。

**機能:**
- 信頼するオリジンの追加/削除
- ポート番号の設定
- ログの表示
- 接続状態の監視
- 統計情報の表示

## 小さく始めるロードマップ

### Phase 0: 概念実証（2週間）

**目標:** 最小限の機能で動作するプロトタイプを作成

**成果物:**
- [ ] 基本的なWebSocketサーバー（Node.js）
- [ ] 単純なBridge Libraryクライアント
- [ ] 2つのシンプルなデモページ（localhost:3000とlocalhost:4000）
- [ ] メッセージの送受信が動作することを確認

**検証項目:**
- クロスオリジン通信が実際に動作するか
- WebSocketの接続が安定するか
- パフォーマンスに問題がないか

### Phase 0 の動かし方

```bash
npm install
npm run start    # Hubサーバー (ws://127.0.0.1:8787)
npm run demo     # 左右のデモページをローカルで起動する場合だけ
```

Hubサーバーとデモサーバーは、それぞれ別ターミナルで同時に起動してください。
一括で起動する場合は `npm run all` を利用できます。ローカルへ clone せず試す場合は `npx github:cat2151/cross-origin-hub` だけでHubとデモを同時起動できます。

GitHub Pages 版で動作確認するときは、ローカルでは Hub だけを起動し（`npm run start`）、ブラウザでは `https://{your-repo}.github.io/.../left/` と `/right/` を開いてください。`npm run demo` や `npx github:cat2151/cross-origin-hub` でローカルのLeft/Rightを立ち上げる必要はありません。
ブラウザで2つのデモページを開き、どちらかでメッセージを送信すると、もう一方にも表示されればPhase 0の要件を満たしています。

### Phase 1: セキュリティ実装（2週間）

**目標:** VOICEVOX Engine方式のセキュリティモデルを実装

**成果物:**
- [ ] ホワイトリスト方式のCORSポリシー実装
- [ ] コマンドライン引数での設定
- [ ] 設定ファイルのサポート
- [ ] 不正なオリジンからの接続拒否を確認

**検証項目:**
- 許可されていないオリジンからの接続が正しく拒否されるか
- 設定ファイルが正しく読み込まれるか

### Phase 2: ライブラリの洗練（3週間）

**目標:** 開発者が使いやすいAPIを提供

**成果物:**
- [ ] npm/yarn経由でインストール可能にする
- [ ] TypeScript型定義の提供
- [ ] 自動再接続機能
- [ ] メッセージキュー（接続断時）
- [ ] エラーハンドリングの充実
- [ ] ドキュメントとサンプルコード

**検証項目:**
- 実際にサードパーティ開発者がライブラリを使えるか
- エッジケース（接続断、再接続）が正しく処理されるか

### Phase 3: 実用的なデモアプリ作成（4週間）

**目標:** 実際のユースケースを示す

**成果物:**
- [ ] 音声エディタのデモアプリ（sound-demo.com）
- [ ] ノートエディタのデモアプリ（notes-demo.com）
- [ ] 統合されたワークフローのビデオデモ
- [ ] ユーザーガイドの作成

**検証項目:**
- エンドユーザーが価値を実感できるか
- 実際の業務で使えるレベルか

### Phase 4: ネイティブアプリのパッケージング（3週間）

**目標:** エンドユーザーが簡単にインストールできるようにする

**成果物:**
- [ ] Electron/Tauriでのパッケージング
- [ ] Windows/Mac/Linux版のビルド
- [ ] インストーラーの作成
- [ ] 自動起動機能
- [ ] システムトレイ統合

**検証項目:**
- 非技術者でもインストールできるか
- OS起動時の自動起動が動作するか

### Phase 5: GUI設定ツール（3週間）

**目標:** 設定をユーザーフレンドリーにする

**成果物:**
- [ ] 設定画面の実装
- [ ] オリジン追加/削除UI
- [ ] 接続状態の可視化
- [ ] ログビューアー

**検証項目:**
- 非技術者が設定を変更できるか
- トラブルシューティングがしやすいか

### Phase 6: コミュニティ形成（継続的）

**目標:** 開発者エコシステムを育てる

**活動:**
- [ ] GitHubでのオープンソース化
- [ ] ドキュメントサイトの構築
- [ ] サンプルアプリのギャラリー
- [ ] 開発者向けチュートリアルの作成

## 技術仕様

### システム要件

**Native Hub App:**
- Node.js 18.x以上
- または、Electron/Tauriでパッケージング済みバイナリ
- ポート8787を使用（設定可能）

**Hub Library:**
- モダンブラウザ（WebSocket対応）
- ES6+対応
- サイズ: ~10KB（minified + gzipped）

### パフォーマンス目標

- メッセージレイテンシ: <10ms（ローカル通信）
- 同時接続数: 10アプリまでサポート
- メッセージスループット: 1000 messages/sec

### 互換性

- ブラウザ: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- OS: Windows 10+, macOS 11+, Linux (Ubuntu 20.04+)

## 既存技術との比較

| 特徴 | Cross-Origin Hub | Zapier/IFTTT | Browser Extension | BroadcastChannel |
|------|---------------------|--------------|-------------------|------------------|
| クロスオリジン対応 | ✅ | ✅ | ✅ | ❌ |
| ローカル完結 | ✅ | ❌ | ✅ | ✅ |
| インストール不要 | ⚠️ 要ネイティブアプリ | ✅ | ❌ | ✅ |
| プライバシー保護 | ✅ | ❌ | ✅ | ✅ |
| 開発者の独立性 | ✅ | ❌ | ⚠️ | ✅ |
| オフライン動作 | ✅ | ❌ | ✅ | ✅ |

## 参考事例

### VOICEVOX Engine

本プロジェクトのセキュリティモデルは、VOICEVOX Engineの実装を参考にしている。

- リポジトリ: https://github.com/VOICEVOX/voicevox_engine
- 参考Issue: https://github.com/VOICEVOX/voicevox_engine/issues/392

VOICEVOX Engineは、Electronアプリ（`app://`スキーム）とローカルHTTPサーバー間のCORS通信において、ホワイトリスト方式のセキュリティモデルを採用している。これにより、意図しない第三者サイトからのアクセスを防いでいる。

## ライセンス

MIT License（予定）

---

**Cross-Origin Hub - Connecting Independent Web Apps, Locally.**
