<div id="top"></div>

# 🎣 fishing-log-bot

**釣果（魚種・場所・サイズなど）を記録し、一覧・マップで詳細に振り返れる釣果管理Webアプリ**

天気・潮汐情報とも自動連携し、写真つきで釣行の記録を残せます。
「いつ・どこで・何を釣ったか」を簡単に記録し、次の釣行の参考にすることを目的としたプロジェクトです。

<p style="display: inline">
  <img src="https://img.shields.io/badge/-TypeScript-3178C6.svg?logo=typescript&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/-Node.js-339933.svg?logo=node.js&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-Amazon%20aws-232F3E.svg?logo=amazon-aws&style=for-the-badge">
  <img src="https://img.shields.io/badge/-AWS%20CDK-232F3E.svg?logo=amazon-aws&style=for-the-badge">
  <img src="https://img.shields.io/badge/-AWS%20lambda-232F3E.svg?logo=aws-lambda&style=for-the-badge">
  <img src="https://img.shields.io/badge/-Amazon%20DynamoDB-4053D6.svg?logo=amazon-dynamodb&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-Amazon%20S3-569A31.svg?logo=amazons3&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-Amazon%20CloudFront-8C4FFF.svg?logo=amazonaws&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-OpenStreetMap-7EBC6F.svg?logo=openstreetmap&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-Anthropic%20Claude-D97757.svg?style=for-the-badge&logoColor=white">
</p>

## 目次

1. [プロジェクトについて](#プロジェクトについて)
2. [AI活用について](#ai活用について)
3. [主な機能](#主な機能)
4. [デモ・スクリーンショット](#デモスクリーンショット)
5. [設計書・ドキュメント](#設計書ドキュメント)
6. [使用技術](#使用技術)
7. [ディレクトリ構成](#ディレクトリ構成)
8. [開発環境構築](#開発環境構築)
9. [環境変数](#環境変数)
10. [コマンド一覧](#コマンド一覧)
11. [デプロイ](#デプロイ)
12. [トラブルシューティング](#トラブルシューティング)
13. [今後の展望](#今後の展望)
14. [作者](#作者)

<p align="right">(<a href="#top">トップへ</a>)</p>

## プロジェクトについて

「自分だけの釣行記録をもっと手軽に残し、次の釣果へとつなげる」ことを目的に開発した、釣果管理・分析用のWebアプリケーションです。  
魚の種類・サイズ・釣行場所などの基本情報を一覧・マップ・詳細画面で振り返ることができるほか、天気や潮汐（タイドグラフ）情報との自動連携により、  
**「どのような条件のときに釣れたのか」** を客観的に分析できるようにしています。

**最大の差別化ポイントは、スマートウォッチを活用した「時合（じあい）」の自動記録機能です。**  
釣行中にスマートフォンを取り出して細かく入力する手間を省くため、  
魚が釣れた瞬間（HIT時）にスマートウォッチのショートカット機能を利用し、  
正確な日時をワンタップでログファイルに保存できるようにしました。  

釣行後にそのファイルを取り込むことで、一日のうち「どの時間帯にアタリが集中したか」を正確に振り返ることができ、  
次回以降の釣行戦略に実践的なデータとして役立てることができます。

釣果詳細画面では、釣行地点・日時をもとに天気（Open-Meteo）・潮汐（tide736.net）を自動取得してグラフ表示し、  
さらにその日の釣行内容をもとにAI（Anthropic Claude API）が客観的なアドバイスを生成する機能も備えています。

これまで感覚頼みで釣果が安定せず、過去を振り返る機会も少なかったという課題を解決し、  
家族や友人など釣りを知らない初心者と同伴した際にも、データに基づいて狙って釣らせてあげられる確率を高めることを最終的な目的としています。

インフラには本格的なAWS環境を採用しつつ、個人開発に適した低コストで運用しやすい構成を工夫することで実現しました。

<p align="right">(<a href="#top">トップへ</a>)</p>

## AI活用について

本プロジェクトは、実装スキルだけでなく **AI技術を開発プロセスに活用するスキルを身につけること** も目的の一つとして進めました。  
設計方針の壁打ちや、実装のたたき台（Lambda関数・React コンポーネント・CDKスタックなど）の生成にClaude（Anthropic）を積極的に活用し、  
生成されたコードは内容を理解した上で必要な修正・調整を加えて取り込んでいます。

<p align="right">(<a href="#top">トップへ</a>)</p>

## 主な機能

- 🐟 **釣果・釣行ポイントの記録**：魚種・サイズ・仕掛け・HIT日時などを細かく記録可能
- 📅 **釣果の一覧・マップ表示**：過去の釣行をリスト形式／マップ形式で振り返り可能
- 📍 **釣行ポイントの登録・管理**：地図（OpenStreetMap）上での住所検索・長押しによる位置登録に対応
- 📋 **釣果の詳細表示**：釣行日時の気象・潮汐条件、AIアドバイスなど次回釣行に活かせる内容を表示
- 🌊 **天気・潮汐情報との連携**：釣行日時・地点の気象・潮汐条件を自動取得しグラフ表示
- 📷 **画像・写真の投稿**：釣果に写真を添付して記録（S3 Pre-signed URLで直接アップロード）
- 🤖 **AIアドバイス機能**：釣果・天気・潮汐データをもとにAIが釣行アドバイスを生成
- 🐡 **旬の魚情報**：ホーム画面に月ごとの「今が旬の魚」を表示

| 機能 | 対応状況 | 備考 |
| ---- | :------: | ---- |
| 釣果の記録（魚種・場所・サイズ） | ✅ | |
| 釣果の一覧・マップ表示 | ✅ | |
| 釣行ポイントの登録・管理 | ✅ | 住所検索／地図長押しの両方に対応 |
| 釣果の詳細表示 | ✅ | |
| 天気・潮汐情報との連携 | ✅ | Open-Meteo / tide736.net |
| 画像・写真の投稿 | ✅ | |
| AIアドバイス機能 | ✅ | Anthropic Claude API（Haiku） |
| スマートウォッチ連携（時合の自動記録） | ✅ |  |

<p align="right">(<a href="#top">トップへ</a>)</p>

## 設計書・ドキュメント

詳細な設計資料は[`docs/`](./docs)配下にまとめています。ポータルは以下から辿れます。

📄 **[設計書一覧はこちら → docs/README.md](./docs/README.md)**

API仕様書（OpenAPI）はSwagger UIとして公開しています。

<p align="right">(<a href="#top">トップへ</a>)</p>

## 使用技術

| 分類 | 技術 |
| ---- | ---- |
| 言語 | TypeScript |
| フロントエンド | React, Vite, React Router v7, recharts, react-leaflet |
| バックエンド | Node.js 20.x（AWS Lambda） |
| インフラ（IaC） | AWS CDK |
| API | Amazon API Gateway |
| データベース | Amazon DynamoDB |
| ストレージ | Amazon S3（釣果写真／旬の魚画像） |
| 配信 | Amazon CloudFront |
| シークレット管理 | AWS Secrets Manager |
| 地図 | OpenStreetMap（Leaflet） |
| 天気API | Open-Meteo |
| 潮汐API | tide736.net |
| AI | Anthropic Claude API（Haiku モデル） |

その他の依存パッケージのバージョンは各`package.json`を参照してください。

<p align="right">(<a href="#top">トップへ</a>)</p>

## ディレクトリ構成

```
.
├── .vscode                       # エディタ設定
├── backend                       # バックエンド（AWS CDK + Lambda）
│   ├── bin/                      # CDK アプリのエントリーポイント
│   ├── lib/                      # CDK スタック定義
│   ├── src/lambda/                # 各Lambda関数（写真URL発行、釣果登録・一覧、
│   │                              #   ポイント管理、天気/潮汐取得、AIアドバイス生成 等）
│   └── scripts/                   # 港マスタ生成などの一時スクリプト
├── frontend                       # フロントエンド（React）
│   └── src/
│       ├── pages/                 # 画面単位のコンポーネント
│       ├── components/            # 共通UIコンポーネント
│       ├── api/                   # バックエンドAPI・外部APIの呼び出し
│       ├── lib/                   # 共通ユーティリティ
│       └── css/
├── package/shared-types            # フロントエンド／バックエンド共通の型定義
├── docs                            # 設計資料（API仕様書・DB設計書 等）
├── .gitignore
├── .prettierrc.json
├── cdk.json                        # AWS CDK 設定
└── README.md
```

<p align="right">(<a href="#top">トップへ</a>)</p>

## 開発環境構築

### 前提条件

- Node.js（v24.12.4で開発。Lambdaランタイムは20.x）
- npm または yarn
- AWS CLI（デプロイする場合）／ AWSアカウント

### インストール手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/rtr4444/fishing-log-bot.git
cd fishing-log-bot

# 2. 依存関係をインストール（backend / frontend それぞれで実行）
cd backend && npm install
cd ../frontend && npm install

# 3. 環境変数を設定
cp .env.example .env
# .env を編集して環境変数の一覧を参考に値を設定

# 4. 開発サーバーを起動
cd frontend && npm run dev
```

起動後、`http://localhost:3000`（ポート番号は実際の設定に合わせて修正）にアクセスして動作確認してください。

<p align="right">(<a href="#top">トップへ</a>)</p>

## 環境変数

### backend/.env（ローカル参照用。実際のLambda実行時の値はCDKのコード内で注入）

| 変数名 | 役割 |
| ------ | ---- |
| AWS_REGION | デプロイ先のAWSリージョン |
| FISHING_LOG_TABLE_NAME | 釣果データを保存するDynamoDBテーブル名 |
| MY_POINTS_TABLE_NAME | 釣行ポイントを保存するDynamoDBテーブル名 |
| FISHING_LOG_PHOTO_BUCKET_NAME | 釣果写真を保存するS3バケット名 |

### frontend/.env

| 変数名 | 役割 |
| ------ | ---- |
| VITE_API_BASE_URL | バックエンドAPI（API Gateway）のエンドポイント |
| VITE_SEASONAL_FISH_BUCKET_URL | 旬の魚情報（画像・JSON）を配信する公開S3バケットのURL |

### AWS Secrets Manager

| シークレット名 | 役割 |
| -------------- | ---- |
| `fishing-log-bot/anthropic-api-key` | AIアドバイス生成用のAnthropic APIキー |

<p align="right">(<a href="#top">トップへ</a>)</p>

## コマンド一覧

| コマンド | 実行する処理 |
| -------- | ------------ |
| `npm run build` | TypeScriptをJavaScriptにコンパイル |
| `npm run watch` | ファイル変更を監視してコンパイル |
| `npm run test` | Jestによるユニットテストを実行 |
| `npx cdk synth` | CloudFormationテンプレートを生成 |
| `npx cdk diff` | デプロイ済みスタックとの差分を確認 |
| `npx cdk deploy` | AWSへスタックをデプロイ（フロントの配信基盤含む） |

<p align="right">(<a href="#top">トップへ</a>)</p>

## デプロイ

本プロジェクトはAWS CDKを用いて、バックエンド（Lambda・API Gateway・DynamoDB等）とフロントエンド配信基盤（S3 + CloudFront）の両方をまとめて構築しています。

```bash
# 1. フロントエンドをビルド（VITE_API_BASE_URL等の環境変数を事前に設定しておく）
cd frontend
npm run build

# 2. AWS認証情報を設定した上でデプロイ
cd ../backend
npx cdk bootstrap   # 初回のみ
npx cdk deploy
```

デプロイ完了後、出力される`FrontendUrl`（CloudFrontのドメイン）にアクセスすると公開中のアプリを確認できます。

<p align="right">(<a href="#top">トップへ</a>)</p>

## トラブルシューティング

### `.env: no such file or directory`

`.env`ファイルが存在しません。[環境変数](#環境変数)を参考に作成してください。

### `cdk: command not found`

AWS CDK CLIがインストールされていません。以下でインストールしてください。

```bash
npm install -g aws-cdk
```

### デプロイ時に権限エラーが発生する

AWS認証情報（`aws configure`）が正しく設定されているか、対象IAMユーザーに必要な権限があるか確認してください。

<p align="right">(<a href="#top">トップへ</a>)</p>

## 今後の展望

- [ ] 釣果の統計・分析ダッシュボード
- [ ] SNSへのシェア機能
- [ ] 認証機能の導入（現状は個人利用の単一ユーザー想定）

<p align="right">(<a href="#top">トップへ</a>)</p>

## 作者

**rtr4444**

- GitHub: [@rtr4444](https://github.com/rtr4444)

<p align="right">(<a href="#top">トップへ</a>)</p>
