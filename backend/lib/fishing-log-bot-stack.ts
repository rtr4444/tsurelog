import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

// AWS Services
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as runtime from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class FishingLogBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ----------------------------------------------------------------
    // 1. Storage & Database (S3 & DynamoDB)
    // ----------------------------------------------------------------

    // 釣果写真用バケット
    const photoBucket = new s3.Bucket(this, 'FishingLogPhotoBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: ['http://localhost:3000'],
          allowedMethods: [s3.HttpMethods.PUT],
          allowedHeaders: ['*'],
        },
      ],
    });

    // 旬の魚情報配信用バケット（公開読み取り専用）
    const seasonalFishBucket = new s3.Bucket(this, 'SeasonalFishBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [s3.HttpMethods.GET],
        },
      ],
    });

    // 釣果記録テーブル
    const fishingLogTable = new dynamodb.Table(this, 'FishingLogTable', {
      tableName: 'FishingLogTable',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    fishingLogTable.addGlobalSecondaryIndex({
      indexName: 'PointIndex',
      partitionKey: { name: 'pointId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 釣り場ポイント管理テーブル
    const myPointsTable = new dynamodb.Table(this, 'MyPointsTable', {
      tableName: 'MyPointsTable',
      partitionKey: { name: 'pointId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ----------------------------------------------------------------
    // 2. Secrets & Configurations
    // ----------------------------------------------------------------

    // AIアドバイス用 Anthropic APIキー
    const anthropicApiKeySecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'AnthropicApiKeySecret',
      'fishing-log-bot/anthropic-api-key',
    );

    // ----------------------------------------------------------------
    // 3. Compute (Lambda Functions)
    // ----------------------------------------------------------------

    // Lambda共通設定
    const nodeJsFunctionProps = {
      runtime: runtime.Runtime.NODEJS_20_X,
      handler: 'handler',
    };

    const submitReportHandler = new lambda.NodejsFunction(this, 'SubmitReportHandler', {
      ...nodeJsFunctionProps,
      entry: 'src/lambda/submit-report/index.ts',
      environment: {
        FISHING_LOG_TABLE_NAME: fishingLogTable.tableName,
        MY_POINTS_TABLE_NAME: myPointsTable.tableName,
      },
    });

    const getPresignedUrlHandler = new lambda.NodejsFunction(this, 'GetPresignedUrlHandler', {
      ...nodeJsFunctionProps,
      entry: 'src/lambda/get-presigned-url/index.ts',
      environment: {
        FISHING_LOG_PHOTO_BUCKET_NAME: photoBucket.bucketName,
      },
    });

    const listReportsHandler = new lambda.NodejsFunction(this, 'ListReportsHandler', {
      ...nodeJsFunctionProps,
      entry: 'src/lambda/list-reports/index.ts',
      environment: {
        FISHING_LOG_TABLE_NAME: fishingLogTable.tableName,
      },
    });

    const listPointsHandler = new lambda.NodejsFunction(this, 'ListPointsHandler', {
      ...nodeJsFunctionProps,
      entry: 'src/lambda/list-points/index.ts',
      environment: {
        MY_POINTS_TABLE_NAME: myPointsTable.tableName,
      },
    });

    const getPhotoUrlHandler = new lambda.NodejsFunction(this, 'GetPhotoUrlHandler', {
      ...nodeJsFunctionProps,
      entry: 'src/lambda/get-photo-url/index.ts',
      environment: {
        FISHING_LOG_PHOTO_BUCKET_NAME: photoBucket.bucketName,
      },
    });

    const updatePointHandler = new lambda.NodejsFunction(this, 'UpdatePointHandler', {
      ...nodeJsFunctionProps,
      entry: 'src/lambda/update-point/index.ts',
      environment: {
        MY_POINTS_TABLE_NAME: myPointsTable.tableName,
      },
    });

    const getTideInfoHandler = new lambda.NodejsFunction(this, 'GetTideInfoHandler', {
      ...nodeJsFunctionProps,
      entry: 'src/lambda/get-tide-info/index.ts',
    });

    const generateAdviceHandler = new lambda.NodejsFunction(this, 'GenerateAdviceHandler', {
      ...nodeJsFunctionProps,
      entry: 'src/lambda/generate-advice/index.ts',
      timeout: cdk.Duration.seconds(30),
      environment: {
        ANTHROPIC_SECRET_NAME: anthropicApiKeySecret.secretName,
      },
    });

    // ----------------------------------------------------------------
    // 4. API Gateway
    // ----------------------------------------------------------------

    const api = new apigateway.RestApi(this, 'FishingLogApi', {
      restApiName: 'Fishing Log Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
        maxAge: cdk.Duration.days(1),
      },
    });

    const catches = api.root.addResource('catches');
    catches.addMethod('POST', new apigateway.LambdaIntegration(submitReportHandler));
    catches.addMethod('GET', new apigateway.LambdaIntegration(listReportsHandler));

    const points = api.root.addResource('points');
    points.addMethod('GET', new apigateway.LambdaIntegration(listPointsHandler));

    const pointByIdResource = points.addResource('{pointId}');
    pointByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(updatePointHandler));

    const photoUrlResource = api.root.addResource('photo-url');
    photoUrlResource.addMethod('POST', new apigateway.LambdaIntegration(getPhotoUrlHandler));

    const presignedUrlResource = api.root.addResource('presigned-url');
    presignedUrlResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getPresignedUrlHandler),
    );

    const tideResource = api.root.addResource('tide');
    tideResource.addMethod('GET', new apigateway.LambdaIntegration(getTideInfoHandler));

    const adviceResource = api.root.addResource('advice');
    adviceResource.addMethod('POST', new apigateway.LambdaIntegration(generateAdviceHandler));

    // ----------------------------------------------------------------
    // 5. Frontend Delivery (S3 + CloudFront)
    // ----------------------------------------------------------------

    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // ----------------------------------------------------------------
    // 6. IAM Permissions (Grants)
    // ----------------------------------------------------------------

    // DynamoDB Permissions
    fishingLogTable.grantReadWriteData(submitReportHandler);
    fishingLogTable.grantReadData(listReportsHandler);

    myPointsTable.grantReadWriteData(submitReportHandler);
    myPointsTable.grantReadData(listPointsHandler);
    myPointsTable.grantWriteData(updatePointHandler);

    // S3 Permissions
    photoBucket.grantPut(getPresignedUrlHandler);
    photoBucket.grantRead(getPhotoUrlHandler);

    // Secrets Manager Permissions
    anthropicApiKeySecret.grantRead(generateAdviceHandler);

    // ----------------------------------------------------------------
    // 7. CloudFormation Outputs
    // ----------------------------------------------------------------

    new cdk.CfnOutput(this, 'SeasonalFishBucketUrl', {
      value: `https://${seasonalFishBucket.bucketRegionalDomainName}`,
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
