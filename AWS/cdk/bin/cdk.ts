#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from '../lib/lambda-stack';
import { CognitoStack } from '../lib/cognito-stack';

const app = new cdk.App();
// TODO maybe unhardcode this, but OK for now as always want London.
new LambdaStack(app, 'MineCraftOnDemandLambdaStack', {env: {region: 'eu-west-2'}});
// TODO here we want Dublin as that's where we create the Cognito stuff.
new CognitoStack(app, 'MineCraftOnDemandMobileAppClientCognitoStack', {env: {region: 'eu-west-1'}});