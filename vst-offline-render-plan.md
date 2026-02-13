# 計画: ローカルVSTホストでオフラインレンダリングし、WAVをHub経由でブラウザ再生する

## ゴール
- VOICEVOX VST版など任意のVSTをローカルでオフラインレンダリングし、そのWAVをCross-Origin Hub経由でブラウザに届けて鳴らせる。
- 初期段階はローカルホスト→Hub→ブラウザの一方向。必要ならブラウザからレンダー要求を投げて応答を受け取る往復も追加する。

## VSTの入手とホスト候補
- プラグイン配布形態: VST3のzipをそのまま`~/VST3`や`C:\\Program Files\\Common Files\\VST3`へ配置するだけに揃える（インストーラ不要を優先）。
- オフラインレンダリング可でCLI操作ができるホストを推奨:
  - Plugalyzer（CLI専用VST3ホスト、JUCE製、GPL）: `plugalyzer process --plugin=<vst3> --input=<midi/wav> --output=out.wav` の形でバッチ処理。ビルドは`cmake --preset release && ninja`程度。単一バイナリで配布も可能。
  - Carla headless（幅広いフォーマット対応、Linux/Win/macOS）: `carla-rack --no-gui`や`carla-control`でセッションを開き、録音先を指定してオフライン書き出し。パッケージマネージャーで入手しやすい。
- 動作確認用VSTは入手が簡単な無償VST3（例: Dexed VST3）を使い、VOICEVOX VSTの配布形態が固まったら差し替える。

## 想定アーキテクチャ
1) ローカル: CLI VSTホストでオフラインレンダリング→WAV出力  
2) ブリッジ: Node/Rust小物がWAVをbase64化し、Hubへ`vst:wav-rendered`イベントでpublish（`CrossOriginHub`を再利用）。  
3) ブラウザ: Hub購読して受信WAVを`AudioBuffer`/`Audio`で再生・ダウンロード。
4) 往復対応が欲しければ、ブラウザ→Hubへ`vst:render-request`を送り、ローカルブリッジがVSTホストCLIを起動して結果を返す。

## Hubペイロード案（JSONテキスト）
- `eventType`: `vst:wav-rendered`
- `data`:
  - `id`: 安定識別子（レンダー要求IDやファイル名相当）
  - `name`: 表示名（プリセット名/台詞名）
  - `plugin`: 使用VST名（例 `voicevox-vst`, `dexed`）
  - `preset`: 任意のプリセット/パラメータ情報
  - `mime`: `audio/wav`
  - `bytes`: base64文字列
  - `durationMs`, `sampleRate`, `channels`: 任意メタ
- 往復を行う場合の要求側イベント例: `eventType= vst:render-request`, `data`に`id/prompt/preset/scriptPath`などを入れてローカルブリッジが受け取る。

## ブラウザ側の最小ページ
- トグル「vst wav from hub」ONでHub接続し、`vst:wav-rendered`を購読して受信次第再生＆ダウンロードリンクを提示。
- 可能なら簡易フォームで`vst:render-request`を送信（テキストやプリセット名のみ）。未対応なら閲覧専用ページとして始める。
- 既存のWAV受信UI（wav-hub計画と同様）を流用し、接続状態インジケーターだけ追加。

## Hubローカル実装への変更
- 現状のJSONテキスト転送で足りる。バイナリフレーム対応は後続。
- 巨大WAVガードとして`--max-payload`相当の上限チェックをRust/Node双方で入れると安全（既存hub挙動と整合）。

## 最低限の始め方（MVP）
1) PlugalyzerかCarla headlessを1台に導入し、Dexedなどで固定プリセットを`out.wav`へオフラインレンダリングするスクリプトを用意。  
2) 簡易ブリッジ（Nodeでも可）で出力WAVをbase64化し、`vst:wav-rendered`をHubへ送るだけの一方向を実装。  
3) ブラウザページでトグルONにして受信→再生が確認できれば第一段階完了。  
4) 余力があれば`vst:render-request`を受けてCLIを叩く往復を追加する。
