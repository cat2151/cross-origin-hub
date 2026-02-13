# 計画: 生成したWAVをHub経由で送信し、tonejs-json-sequencerで再生する

## ゴール
- Tone.js / web-ym2151 / wavlpfで生成したWAVを「send to hub」トグルひとつでCross-Origin Hubへ送る。
- Hubにつないだtonejs-json-sequencerで「wav from hub」トグルをONにすると、自動でSamplerへ読み込まれるようにする。
- どちらのトグルも一度ONにしたら維持され、ONの間に生成されたWAVは自動転送される。

## 共有メッセージ形式（hub payload）
- `eventType`: `wav:generated`
- `data` オブジェクト:
  - `id`: 安定した識別子（重複排除/再読込用）
  - `name`: 表示用ラベル/ファイル名のヒント
  - `mime`: 例 `audio/wav`
  - `bytes`: WAV本体のbase64文字列（現状のJSON専用Hubで安全）
  - `durationMs`, `sampleRate`, `channels`: 任意メタデータ
  - `source`: `tonejs`, `web-ym2151`, `wavlpf` などの文字列
- Hub側で `from` と `timestamp` が付与される。音声本体は `data` を信頼し、`from` は出所表示のみで使う。
- 将来拡張: Hubとクライアントがエンドツーエンドでバイナリフレーム対応したら、base64 `bytes` をやめて JSONエンベロープ + 別フレーム/チャンク方式に置き換える。

## 「send to hub」向けJS npmヘルパー（Tone.js / web-ym2151 / wavlpf側）
- `cross-origin-hub` を薄く包んだヘルパーを用意:
  - `createWavHubSender({ serverUrl, WebSocket })` が `{ toggleSend(on), sendWav(wavBlob | ArrayBuffer, metadata) }` を返す。
  - 内部で `CrossOriginHub` を保持し、接続を再利用しながら共有フォーマットで `wav:generated` をpublishする。
- UI連携:
  - 「send to hub」ボタンでブーリアンをトグルし、ON中に新規生成されたWAVを `sendWav` へ渡す。
  - トグル状態はメモリ保持（必要なら後でlocalStorage）。接続状態は `_connected` / `_disconnected` / `_error` を拾って小さなインジケーターで表示。
- ペイロード処理:
  - Blob/ArrayBufferを送信前にbase64へ変換し、現行のJSON専用Hubと互換にする。
  - サイズ上限を設ける（例: 数MB超えで警告）。MVPではチャンク分割なし。必要になればチャンク/URL化を再検討。

## Rust cargo（ローカルHub）への期待
- cross-origin-hub-rsは現行のNode Hub挙動を踏襲:
  - `eventType` / `data` を含むJSONテキストを受信し、`from` と `timestamp` を付けて他クライアントへブロードキャスト。
  - ひとまずJSONテキストのみ受け付ける。バイナリフレーム対応は、Node HubやJSクライアントの変更とセットで進める将来拡張。
  - 誤って巨大オーディオを送らないよう `--max-payload` ガードを用意。
- オプションの利便フラグ:
  - `--watch-wav <dir>`: wavlpfの出力ディレクトリを監視し、base64化して `source=wavlpf` 付きで `wav:generated` を送る。ブラウザ外生成でも「send to hub」体験を維持するため。

## tonejs-json-sequencer: 「wav from hub」受信側
- トグルボタンを追加し、ONなら `CrossOriginHub` を接続（再利用可）して `wav:generated` を購読。
- 受信時の流れ:
  1) ペイロードを事前検証: `data` が存在し、`typeof data.bytes === 'string'` かつ長さ>0、`data.mime === 'audio/wav'`（許可MIMEのみ）、復号後サイズを見積もって上限超は警告してスキップ。
  2) base64をtry/catchでBlob化し、失敗時はエラー表示して中断（Object URLもSamplerも触らない）。
  3) 検証OKならBlobをObject URLにして `data.name`（または `id`）名義でSamplerへ登録。`id` キーで重複は差し替え。
  4) ロード可否・名前・duration・sourceなどの最小限UIフィードバックを出す。
- 重複は `data.id` で判定し、同じIDなら置き換え。
- トグルは手動でOFFにするまで維持。切断時は自動再接続＋再購読。

## トグルの挙動
- 「send to hub」: デフォルトOFF。ON中に生成されたWAVは毎回自動送信。
- 「wav from hub」: デフォルトOFF。ON後に届いたWAVは自動登録。
- まずはシンプルに自動転送のみ。ファイルごとの確認やキューUIは後から必要なら追加。
