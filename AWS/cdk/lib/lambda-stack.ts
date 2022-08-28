import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import {getEnv} from './common';
import {CorsOptions, ResponseType} from 'aws-cdk-lib/aws-apigateway';

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const customDomainName = getEnv('CUSTOM_DOMAIN_NAME', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const r53ZoneId = getEnv('R53_ZONE_ID', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lambdaVersion = getEnv('LAMBDA_VERSION', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userPoolId = getEnv('USERPOOL_ID', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const clientIds = getEnv('CLIENT_IDS', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const getLambdaValidGroupNames = getEnv('GET_LAMBDA_VALID_GROUP_NAMES', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const postLambdaValidGroupNames = getEnv('POST_LAMBDA_VALID_GROUP_NAMES', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const minecraftEC2InstanceId = getEnv('MINECRAFT_EC2_INSTANCE_ID', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const accessControlAllowOrigin = getEnv('ACCESS_CONTROL_ALLOW_ORIGIN', false)!;
    const region = Stack.of(this).region;

    // Get hold of the hosted zone which has previously been created
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'R53Zone', {
      zoneName: customDomainName,
      hostedZoneId: r53ZoneId,
    });

    // Create the instance state get lambda
    const ec2InstanceStateGetLambda = new lambda.Function(this, "EC2InstanceStateGetLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("../lambda-code/dist/lambda.zip"),
      handler: "ec2_instance_state_get.lambdaHandler",
      logRetention: logs.RetentionDays.THREE_DAYS
    });
    // Add some runtime env vars
    ec2InstanceStateGetLambda.addEnvironment('MINECRAFT_EC2_INSTANCE_ID', minecraftEC2InstanceId);
    ec2InstanceStateGetLambda.addEnvironment('ACCESS_CONTROL_ALLOW_ORIGIN', accessControlAllowOrigin);
    ec2InstanceStateGetLambda.addEnvironment('REGION', region);
    // Allow it read-only access to EC2.
    const ec2ReadOnlyPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ReadOnlyAccess");
    ec2InstanceStateGetLambda.role?.addManagedPolicy(ec2ReadOnlyPolicy);
    // And EventBridge read only
    const eventBridgeReadOnlyAccessPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEventBridgeReadOnlyAccess");
    ec2InstanceStateGetLambda.role?.addManagedPolicy(eventBridgeReadOnlyAccessPolicy);
    // And read tags (not provided by AmazonEventBridgeReadOnlyAccess for some reason)
    ec2InstanceStateGetLambda.role?.attachInlinePolicy(
      new iam.Policy(this, 'eventsListTagsForResourcePolicy', {
        statements: [
          new iam.PolicyStatement({
            actions: ['events:ListTagsForResource'],
            resources: ['*'],
          }),
        ],
      }),
    );

    // Create the instance state post lambda
    const ec2InstanceStatePostLambda = new lambda.Function(this, "EC2InstanceStatePostLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("../lambda-code/dist/lambda.zip"),
      handler: "ec2_instance_state_post.lambdaHandler",
      logRetention: logs.RetentionDays.THREE_DAYS
    });
    // Add some runtime env vars
    ec2InstanceStatePostLambda.addEnvironment('ACCESS_CONTROL_ALLOW_ORIGIN', accessControlAllowOrigin);
    ec2InstanceStatePostLambda.addEnvironment('REGION', region);
    // Allow it read-write access to EC2.
    const ec2ReadWritePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess");
    ec2InstanceStatePostLambda.role?.addManagedPolicy(ec2ReadWritePolicy);
    // And EventBridge
    const eventBridgeFullAccessPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEventBridgeFullAccess");
    ec2InstanceStatePostLambda.role?.addManagedPolicy(eventBridgeFullAccessPolicy);
    // And allow EventBridge to call the lambda
    const eventBridgePrincipal = new iam.ServicePrincipal('events.amazonaws.com');
    ec2InstanceStatePostLambda.grantInvoke(eventBridgePrincipal);

    // Create the get status authorizer lambda
    const getStatusAuthorizerLambda = new lambda.Function(this, "GetAuthorizerLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("../lambda-code/dist/lambda.zip"),
      handler: "ec2_instance_state_authorizer.lambdaHandler",
      logRetention: logs.RetentionDays.THREE_DAYS
    });
    // Add the lambda as a token authorizer to the API Gateway
    const getStatusTokenAuthorizer = new apigateway.TokenAuthorizer(this, 'GetStatusTokenAuthorizer', {
      handler: getStatusAuthorizerLambda,
      authorizerName: 'GetStatusTokenAuthorizer',
      resultsCacheTtl: Duration.seconds(0)
    });
    // Add the user pool id, client ids and group names into the lambda's environment.
    // They aren't secret so this is fine.
    // Also the valid Cognito groups that allow the user to call the API.
    getStatusAuthorizerLambda.addEnvironment('USERPOOL_ID', userPoolId);
    getStatusAuthorizerLambda.addEnvironment('CLIENT_IDS', clientIds);
    getStatusAuthorizerLambda.addEnvironment('VALID_GROUP_NAMES', getLambdaValidGroupNames);

    // Create the post status authorizer lambda.
    // It uses the same code but with different env vars passed to it.
    const postStatusAuthorizerLambda = new lambda.Function(this, "PostAuthorizerLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("../lambda-code/dist/lambda.zip"),
      handler: "ec2_instance_state_authorizer.lambdaHandler",
      logRetention: logs.RetentionDays.THREE_DAYS
    });
    // Add the lambda as a token authorizer to the API Gateway
    const postStatusTokenAuthorizer = new apigateway.TokenAuthorizer(this, 'PostStatusTokenAuthorizer', {
      handler: postStatusAuthorizerLambda,
      authorizerName: 'PostStatusTokenAuthorizer',
      resultsCacheTtl: Duration.seconds(0)
    });
    // Add the user pool id, client ids and client id into the lambda's environment.
    // They aren't secret so this is fine.
    // Also the valid Cognito groups that allow the user to call the API.
    postStatusAuthorizerLambda.addEnvironment('USERPOOL_ID', userPoolId);
    postStatusAuthorizerLambda.addEnvironment('CLIENT_IDS', clientIds);
    postStatusAuthorizerLambda.addEnvironment('VALID_GROUP_NAMES', postLambdaValidGroupNames);

    // Create the cert for the gateway.
    // Usefully, this writes the DNS Validation CNAME records to the R53 zone,
    // which is great as normal Cloudformation doesn't do that.
    const acmCertificateForCustomDomain = new acm.DnsValidatedCertificate(this, 'CustomDomainCertificate', {
      domainName: `api.${customDomainName}`,
      hostedZone: zone,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // Create the custom domain
    const customDomain = new apigateway.DomainName(this, 'CustomDomainName', {
      domainName: `api.${customDomainName}`,
      certificate: acmCertificateForCustomDomain,
      endpointType: apigateway.EndpointType.REGIONAL,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2
    });

    // This is the API Gateway which then calls the lambda.
    const api = new apigateway.RestApi(this, "APIGateway", {
      restApiName: "EC2 Instance Start/Stop/Query",
      description: "This service starts, stops and queries state for the kids' minecraft server.",
      deploy: false // create the deployment below
    });

    // By default CDK creates a deployment and a "prod" stage.  That means the URL is something like
    // https://2z2ockh6g5.execute-api.eu-west-2.amazonaws.com/prod/
    // We want to create the stage to match the version id.
    // Semantic versioning has dots as separators but this is invalid in a URL
    // so replace the dots with underscores first.
    const versionIdForURL = lambdaVersion.replace(/\./g, '_');
    const apiGatewayDeployment = new apigateway.Deployment(this, 'ApiGatewayDeployment', {
      api: api,
    });
    const stage = new apigateway.Stage(this, 'Stage', {
      deployment: apiGatewayDeployment,
      loggingLevel: apigateway.MethodLoggingLevel.INFO,
      dataTraceEnabled: true,
      stageName: versionIdForURL
    });

    // Connect the API to the lambdas
    const instanceStateGetLambdaIntegration = new apigateway.LambdaIntegration(ec2InstanceStateGetLambda, {
      requestTemplates: {"application/json": '{ "statusCode": "200" }'}
    });
    const instanceStatePostLambdaIntegration = new apigateway.LambdaIntegration(ec2InstanceStatePostLambda, {
      requestTemplates: {"application/json": '{ "statusCode": "200" }'}
    });
    const instanceStateResource = api.root.addResource('instanceState');
    // And add the methods with the authorizers
    instanceStateResource.addMethod("GET", instanceStateGetLambdaIntegration, {
      authorizer: getStatusTokenAuthorizer
    });
    instanceStateResource.addMethod("POST", instanceStatePostLambdaIntegration, {
      authorizer: postStatusTokenAuthorizer
    });

    // Add an OPTIONS mock integration which returns the CORS headers.
    const corsOptions: CorsOptions = {
      allowOrigins: [accessControlAllowOrigin],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowMethods: apigateway.Cors.ALL_METHODS,//['OPTIONS', 'GET', 'POST'],
      // allowCredentials: true
    };
    instanceStateResource.addCorsPreflight(corsOptions);

    // Add a CORS header for when the authorizer declines the request.
    // Otherwise the web client gets a CORS error rather than the 403.
    new apigateway.GatewayResponse(this, 'GatewayResponse', {
      restApi: api,
      type: ResponseType.DEFAULT_4XX,
      responseHeaders: {
        // Mappings here have to be wrapped in single quotes.
        "Access-Control-Allow-Origin" : `'${accessControlAllowOrigin}'`,
        "Access-Control-Allow-Headers" : `'${apigateway.Cors.DEFAULT_HEADERS.join(' ')}'`,
        "Access-Control-Allow-Methods" : `'${apigateway.Cors.ALL_METHODS.join(' ')}'`,
        // "Access-Control-Allow-Credentials" : "'true'"
      },
      statusCode: "418"
    });

    // Create the R53 "A" record to map from the custom domain to the actual API URL
    new route53.ARecord(this, 'CustomDomainAliasRecord', {
      recordName: `api.${customDomainName}`,
      zone: zone,
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(customDomain))
    });
    // And path mapping to the API
    customDomain.addBasePathMapping(api, {basePath: `${versionIdForURL}`, stage: stage});
  }
}
