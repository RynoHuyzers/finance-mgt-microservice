#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import {FinanceManagementProxyStack} from "./rest-lambda-proxy-stack";

const app = new App();
new FinanceManagementProxyStack(app, 'FinanceManagement-RestAPI-ProxyLambda', {});
