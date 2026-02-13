# 計画: YM2151 log JSONを「send to hub」で送り、hub経由でlocal ym2151-log-play-server（インタラクティブ）を鳴らす

## ゴール
- cat2151のym2151系Webページで生成したYM2151 log JSONを「send to hub」ボタンひとつでCross-Origin Hubへ送る（PR20の送信フローを踏襲）。
- Hubに接続したlocal ym2151-log-play-serverのインタラクティブモードが、届いたlogを即座に再生できるようにする。ネイティブRust再生で音色編集などのUXを改善する。

## 想定アーキテクチャ（ハブ経由一方向）
1) Webページ: YM2151 log JSON生成→「send to hub」で送信  
2) Cross-Origin Hub（ws://127.0.0.1:8787既定）: JSONブロードキャスト（`from`/`timestamp`付与）  
3) Hubクライアント: local ym2151-log-play-serverインタラクティブモードに受信logを橋渡し→再生

## Hubペイロード案（JSONテキスト）
- `eventType`: `ym2151:log-generated`
- `data` オブジェクト:
  - `id`: 安定識別子（曲/シーケンス単位、重複判定用）
  - `name`: 表示ラベル（ファイル名/タイトル）
  - `source`: 発生元Webページ（例: `web-ym2151`, `ym2151-js`）
  - `version`: log JSONのスキーマ/アプリ版
  - `log`: YM2151 log JSON本体（既存フォーマットをそのまま保持）
  - `playHints`: 任意メタ（BPM、chip clock、loop位置など）  
- Hubが`from`と`timestamp`を付与して他クライアントへ中継。現状はJSONテキストのみ想定（バイナリフレーム未対応のPR20方針を継続）。
- サイズ上限: 大きなlogは警告しスキップ（MVPでは数百KB程度を目安）。

## Webページ側タスク（send to hub実装）
- CrossOriginHubを生成し接続状態を再利用。`_connected`/`_disconnected`/`_error`で小さなインジケーターを表示。
- 「send to hub」トグルがONの間、最新生成log JSONを`eventType=ym2151:log-generated`で送信。トグル状態はページ内で保持（必要なら後でlocalStorage）。
- 送信前に`log`がオブジェクトであること、`id`/`name`が空でないことを軽く検証し、失敗時はUIに通知。
- PR20と同様にフォーム送信抑止・自動再接続・簡易エラートーストを用意。送信中はボタン連打を防ぐ。

## local ym2151-log-play-server側タスク（ハブ購読→インタラクティブ反映）
- Hub購読用の小さなクライアント（Node/Rustどちらでも可）を起動時に組み込む:
  - Hubへ接続し`ym2151:log-generated`を購読。
  - `data.log`が存在しオブジェクトであることを検証し、`id`/`name`/`source`/`playHints`をログ出力。
  - インタラクティブモードへの受け渡し: 既存の再生API/STDIN/HTTPエンドポイントにlog JSONを流し込む（1リクエスト1 log）。応答成功でACKを表示。
  - 同じ`id`が来たら差し替え扱いにしてキャッシュ更新。
- エラー時はHubへ`ym2151:log-error`を返すか、サーバー側でstderrに警告を残すだけでも可。

## 確認フロー（MVP）
1. Hub起動: `npx cross-origin-hub-hub`（またはRust版 `cargo run --release --manifest-path cross-origin-hub-rs/Cargo.toml`）。  
2. ym2151-log-play-serverをインタラクティブモードで起動し、Hub購読クライアントを同時に有効化。  
3. Webページを開き、「send to hub」をON→YM2151 log JSONを生成→送信。  
4. ローカル再生が開始され、`id/name/source`などがログで確認できれば成功。  
5. 切断や大きすぎるlog時の挙動（スキップ/警告）も目視で確認。

## 残タスク/フォローアップ
- ym2151-log-play-serverのインタラクティブAPI詳細を確認し、受け渡しプロトコル（HTTP/STDIN/WS）を確定。
- Webページ側でlog JSONの重さを計測し、送信前チェックの閾値を決める。
- 将来: Hubとクライアントをバイナリフレーム対応にし、大きなlogの分割送信を検討。
