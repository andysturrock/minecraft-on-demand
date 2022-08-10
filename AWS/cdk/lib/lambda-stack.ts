import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { getEnv } from './common';
import { Effect } from 'aws-cdk-lib/aws-iam';

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const region = Stack.of(this).region;
    const account = Stack.of(this).account;

    // Create the instance state get lambda
    const ec2InstanceStateGetLambda = new lambda.Function(this, "ec2InstanceStateGetLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("../lambda-code/dist/lambda.zip"),
      handler: "ec2_instance_state_get.lambdaHandler"
    });
    // Allow it read-only access to EC2.
    const ec2ReadOnlyPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ReadOnlyAccess");
    ec2InstanceStateGetLambda.role?.addManagedPolicy(ec2ReadOnlyPolicy);
    // And SecretsManager (there is no read-only policy for this)
    const secretsManagerReadPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite");
    ec2InstanceStateGetLambda.role?.addManagedPolicy(secretsManagerReadPolicy);

    // Create the instance state post lambda
    const ec2InstanceStatePostLambda = new lambda.Function(this, "ec2InstanceStatePostLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("../lambda-code/dist/lambda.zip"),
      handler: "ec2_instance_state_post.lambdaHandler"
    });
    // Allow it read-write access to EC2.
    const ec2ReadWritePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess");
    ec2InstanceStatePostLambda.role?.addManagedPolicy(ec2ReadWritePolicy);
    // And EventBridge
    const eventBridgeFullAccessPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEventBridgeFullAccess");
    ec2InstanceStatePostLambda.role?.addManagedPolicy(eventBridgeFullAccessPolicy);
    // And allow EventBridge to call the lambda
    const eventBridgePrincipal = new iam.ServicePrincipal('events.amazonaws.com');
    ec2InstanceStatePostLambda.grantInvoke(eventBridgePrincipal);

    const customDomainName = getEnv('CUSTOM_DOMAIN_NAME', false)!;
    const r53ZoneId = getEnv('R53_ZONE_ID', false)!;
    const lambdaVersion = getEnv('LAMBDA_VERSION', false)!;

    // Get hold of the hosted zone which has previously been created
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'R53Zone', {
      zoneName: customDomainName,
      hostedZoneId: r53ZoneId,
    });

    // Create the cert for the gateway.
    // Usefully, this writes the DNS Validation CNAME records to the R53 zone,
    // which is great as normal Cloudformation doesn't do that.
    const acmCertificateForCustomDomain = new acm.DnsValidatedCertificate(this, 'Certificate', {
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
      api: api
    });
    const stage = new apigateway.Stage(this, 'Stage', {
      deployment: apiGatewayDeployment,
      loggingLevel: apigateway.MethodLoggingLevel.INFO,
      dataTraceEnabled: true,
      stageName: versionIdForURL
    })

    // Connect the API to the lambdas
    const instanceStateGetLambdaIntegration = new apigateway.LambdaIntegration(ec2InstanceStateGetLambda, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });
    const instanceStatePostLambdaIntegration = new apigateway.LambdaIntegration(ec2InstanceStatePostLambda, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });
    const instanceStateResource = api.root.addResource('instanceState');
    instanceStateResource.addMethod("GET", instanceStateGetLambdaIntegration);
    instanceStateResource.addMethod("POST", instanceStatePostLambdaIntegration);

    // Create the R53 "A" record to map from the custom domain to the actual API URL
    new route53.ARecord(this, 'CustomDomainAliasRecord', {
      recordName: `api.${customDomainName}`,
      zone: zone,
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(customDomain))
    });
    // And path mapping to the API
    customDomain.addBasePathMapping(api, { basePath: `${versionIdForURL}`, stage: stage });
  }
}
