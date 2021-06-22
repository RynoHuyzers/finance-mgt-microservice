import { Server } from 'http';
import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import * as serverlessExpress from 'aws-serverless-express';
import express from 'express';
import {bootstrapNest} from "../../nest.bootstrap";

let lambdaProxy: Server;

async function bootstrap() {
    const expressServer = express();
    try {
        const nestApp = await bootstrapNest(expressServer);
        await nestApp.init();
    } catch (error) {
        console.log('Error on Nest startup \n' + error);
    }

    return serverlessExpress.createServer(expressServer);
}

export const handler = (event: APIGatewayProxyEvent, context: Context): APIGatewayProxyResult => {
    let response: APIGatewayProxyResult;

    !event.headers
        ? Object.assign(event, { ['headers']: { ['content-type']: 'application/json' } })
        : Object.assign(event.headers, { ['content-type']: 'application/json' });

    if (!lambdaProxy) {
        bootstrap()
            .then((server) => {
            lambdaProxy = server;
            response = (serverlessExpress.proxy(lambdaProxy, event, context) as unknown) as APIGatewayProxyResult;
        })
        .catch((error) => {
            console.log(error);
            response = {
                statusCode: 500,
                body: error,
                isBase64Encoded: false,
            };
        });
    } else {
        response = (serverlessExpress.proxy(lambdaProxy, event, context) as unknown) as APIGatewayProxyResult;
    }

    return response;
};
