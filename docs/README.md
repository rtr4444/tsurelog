# 📚 設計書一覧

fishing-log-bot の設計資料をまとめたポータルです。プロジェクト全体の概要は[ルートのREADME](../README.md)を参照してください。

| ドキュメント | 内容 | 状態 |
| ------------ | ---- | :--: |
| [API仕様書](https://rtr4444.github.io/fishing-log-bot/)（Swagger UI） | 各エンドポイントのリクエスト・レスポンス定義（OpenAPI） | ✅ 公開中 |
| [DB設計書](./database/db-design.md) | DynamoDBのテーブル構成・キー設計・アクセスパターン | ✅ 公開中 |
| [システム構成図](./architecture/system-architecture.md) | AWS上のインフラ構成（Lambda・DynamoDB・S3・CloudFront等の関係） | 🔜 作成予定 |
| [画面遷移図](./screens/screen-flow.md) | 各画面とルーティングの関係 | 🔜 作成予定 |

## ドキュメントの読み方

- まず[システム構成図](./architecture/system-architecture.md)で全体像を把握
- 各APIの入出力の詳細は[API仕様書](https://rtr4444.github.io/fishing-log-bot/)（Swagger UI）を参照
- データの持ち方は[DB設計書](./database/er-diagram.md)を参照
- 画面同士のつながりは[画面遷移図](./screens/screen-flow.md)を参照

## 更新について

`docs/openapi.yml`を編集した場合は、型定義ファイルの再生成を忘れずに行ってください。

```bash
npx openapi-typescript ./docs/openapi.yml -o ./docs/openapi.d.ts
```
