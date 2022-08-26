import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as getenv from 'getenv';

export class MinecraftOnDemandWebsiteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const r53ZoneId = getenv('R53_ZONE_ID');
    const customDomainName = getenv('CUSTOM_DOMAIN_NAME');

    // Get hold of the hosted zone which has previously been created
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'R53Zone', {
      zoneName: customDomainName,
      hostedZoneId: r53ZoneId,
    });

    const certificate = new acm.DnsValidatedCertificate(this, 'DnsValidatedCertificate', {
      domainName: `www.${customDomainName}`,
      hostedZone,
      validation: acm.CertificateValidation.fromDns(hostedZone),
      region: 'us-east-1' // Only N. Virginia based certs can be used
    });    
    
    const wwwBucket = new s3.Bucket(this, "goatsinlace_bucket", {
      bucketName: `www.${customDomainName}`,
      publicReadAccess: false,
    });
    
    new s3Deployment.BucketDeployment(this, "BucketDeployment", {
      sources: [s3Deployment.Source.asset("../../web/build")],
      destinationBucket: wwwBucket
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(wwwBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'GoatsInLaceLogBucket', {bucketName: `logs-for-www.${customDomainName}`,}),
      logIncludesCookies: true,
      domainNames: [`www.${customDomainName}`],
      certificate,
      defaultRootObject: 'index.html'
    });

    // Create the R53 "A" record to map from the custom domain to the cloudfront distribution
    new route53.ARecord(this, 'CustomDomainAliasRecord', {
      recordName: `www.${customDomainName}`,
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    });
  }
}
