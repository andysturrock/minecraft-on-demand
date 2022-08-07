#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();
// TODO maybe unhardcode this, but OK for now as always want London.
new LambdaStack(app, 'LambdaStack', {env: {region: 'eu-west-2'}});