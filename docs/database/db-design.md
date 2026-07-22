# DB設計書

fishing-log-bot は Amazon DynamoDB を使用しています。
DynamoDBにテーブル間の外部キー制約はないため、ER図は作成しておりません。

## テーブル定義

### FishingLogTable

釣行レポート（釣果情報）を1件1アイテムとして保存するテーブルです。

| 属性名 | 型 | 説明 |
| ------ | -- | ---- |
| `userId` | string | **パーティションキー**。認証が未実装のため、現状は固定値 `"default-user"` |
| `timestamp` | number | **ソートキー**。釣行開始時刻（`time.start`）をUnix時間（ミリ秒）に変換した値 |
| `reportId` | string | レポートの一意なID（UUID）。将来的な個別参照・更新のための識別子 |
| `pointId` | string | 釣行ポイントのID（`MyPointsTable`のパーティションキーを参照） |
| `time.start` / `time.end` | string | 釣行の開始・終了日時 |
| `photoKeys` | string[] | 釣果写真のS3オブジェクトキー一覧 |
| `fishTimeline` | object[] | 釣果タイムライン（`id` / `date` / `fishType` / `size` / `rigType` / `weight` / `hookSize`） |
| `memo` | string | メモ・備考 |

- **課金モード**：オンデマンド（`PAY_PER_REQUEST`）。個人開発でアクセス量が読めないため、キャパシティを事前確保しない従量課金を採用
- **削除ポリシー**：`DESTROY`（開発中の構成。本番でデータ保護が必要になった際は見直しが必要）

#### GSI: PointIndex

| 項目 | 値 |
| ---- | -- |
| パーティションキー | `pointId` |
| ソートキー | `timestamp` |
| プロジェクション | ALL（全属性を複製） |

特定の釣行ポイントに絞った釣果一覧（マップのピンから「この釣果を見る」で遷移する画面）を取得するために使用します。

### MyPointsTable

釣行ポイントのデータを保存するテーブルです。

| 属性名 | 型 | 説明 |
| ------ | -- | ---- |
| `pointId` | string | **パーティションキー**。UUID |
| `pointName` | string | ポイント名 |
| `description` | string | ポイントの説明 |
| `address` | string | 住所（ジオコーディング／リバースジオコーディングで取得） |
| `latitude` / `longitude` | number | 緯度・経度 |
| `createdAt` | number | 作成日時（ミリ秒） |
| `updatedAt` | number | 更新日時（ミリ秒） |

- **課金モード**：オンデマンド（`PAY_PER_REQUEST`）
- **削除ポリシー**：`DESTROY`

## 主要なアクセスパターンとクエリ

| # | やりたいこと | 使用するテーブル/インデックス | クエリの形 |
| - | ------------ | ------------------------------ | ---------- |
| 1 | 自分の釣果を新しい順に一覧取得 | `FishingLogTable` | `Query`: `userId = "default-user"`、`ScanIndexForward: false` |
| 2 | 特定ポイントの釣果を新しい順に取得 | `FishingLogTable` の `PointIndex` | `Query`: `pointId = :pointId`、`ScanIndexForward: false` |
| 3 | 期間で絞り込んだ釣果を取得 | `FishingLogTable`（+`PointIndex`） | 上記1・2に加えて `timestamp BETWEEN :start AND :end` |
| 4 | 釣果を1件登録 | `FishingLogTable` | `PutCommand` |
| 5 | 登録済みポイントを一覧取得 | `MyPointsTable` | `Scan`（件数が少数のため全件取得で十分と判断） |
| 6 | ポイントを新規登録／更新 | `MyPointsTable` | `UpdateCommand`（`pointId`が存在しなければ新規作成されるUpsert） |

## 設計上の補足・今後の課題

- **`userId`が固定値である点**：現状は認証機能が未実装のため、個人利用の単一ユーザーを前提に`"default-user"`を固定で使用しています。  
将来的にログイン機能（Cognito等）を導入する際は、この固定値を実際のユーザーIDに置き換えるだけで、テーブル設計自体は変更なく対応できる想定です。
- **`MyPointsTable`が`Scan`である点**：ポイント数が数十件程度の個人利用を想定しているため、全件`Scan`で十分性能が出ると判断しています。  
件数が大きく増える場合は検討。
- **`removalPolicy: DESTROY`**：開発のしやすさを優先した設定です。本番運用を続ける場合は`RETAIN`への変更を検討する必要があります。
