# Agent Notes

- デモのLeft/Rightはローカルサーブ禁止。常に GitHub Pages (`/demo/01_simple/*`, `/demo/02_wav/*`) を開き、ローカルではHubだけを起動する。
- Hub CLIは `npx @cat2151/cross-origin-hub demo01` もしくは `demo02` で起動し、サブコマンドはデモ手順のログを変える。
- ライブラリとデモのワークフローは分離: `publish-package.yml` が `dist-lib/cross-origin-hub.js` をビルドして GitHub Packages に公開し、`deploy-pages.yml` が同じビルド成果物から GitHub Pages にデモをデプロイする。
- デモの参照先ライブラリは公開パッケージ `@cat2151/cross-origin-hub`。ローカルの `scripts/demo-servers.js` は使用しない。
- プロジェクトルートの `index.html` は `/demo/01_simple/left.html` へリダイレクトする。Demo01 Left から Demo02 Left へのリンクを提供する。
