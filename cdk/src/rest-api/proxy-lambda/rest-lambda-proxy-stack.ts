import {App, Duration, Stack, StackProps} from '@aws-cdk/core';
import {AssetCode, Function, ILayerVersion, LayerVersion, Runtime} from '@aws-cdk/aws-lambda';
import {IStringParameter, StringParameter} from '@aws-cdk/aws-ssm';
import {Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';

export class FinanceManagementProxyStack extends Stack {
    constructor(app: App, id: string, props: StackProps) {
        super(app, id, props);

        // NestJS Rest API Layer
        const layerArn: IStringParameter = StringParameter.fromStringParameterName(
            this,
            'NestJSRestLayerARN',
            '/FinanceManagement/RestApi/NestJsLayer/Arn',
        );
        const nestjsLayer: ILayerVersion = LayerVersion.fromLayerVersionAttributes(this, 'NestJSRestLayer', {
            layerVersionArn: layerArn.stringValue,
        });

        /******** Roles and policies */
        const financeLambdaRole = new Role(this, 'FinanceLambdaRole', {
            roleName: 'FinanceLambdaRole',
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
            ],
        });

        // Rest Proxy Function
        // @ts-ignore
        const restProxyFnPath: string = `${__dirname}/../../../deploy/rest-api/finance-management-rest-lambda.zip`;
        const restProxyLambda: Function = new Function(this, 'FinanceManagement_RestAPI_ProxyLambda', {
            functionName: 'FinanceManagement-RestProxy',
            code: new AssetCode(restProxyFnPath),
            handler: 'lambda-rest-handler.handler',
            layers: [nestjsLayer],
            runtime: Runtime.NODEJS_12_X,
            memorySize: 1024,
            timeout: Duration.seconds(60),
            environment: {},
            logRetention: 5,
            role: financeLambdaRole,
        });

        //SSM Parameters
        new StringParameter(this, 'RestApiProxyLambdaArnParameter', {
            parameterName: '/FinanceManagement/RestApi/ProxyLambda/Arn',
            stringValue: restProxyLambda.functionArn,
        });
    }
}