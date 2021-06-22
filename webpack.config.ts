import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { Configuration } from 'webpack';
import { yamlParse } from 'yaml-cfn';
import webpack from 'webpack';

import nodeExternals = require('webpack-node-externals');

/** Interface for AWS SAM Function */
interface ISamFunction {
  Type: string;
  Properties: {
    AssumeRolePolicyDocument?: JSON;
    AutoPublishAlias?: string;
    AutoPublishCodeSha256?: string;
    CodeUri?: string;
    Description?: string;
    Environment?: {
      Variables: {
        [key: string]: string;
      };
    };
    Events?: {
      [Ref: string]: string;
      Type: string;
    };
    FunctionName?: string;
    Handler: string;
    Layers?: { [Ref: string]: string }[];
    Runtime: string;
    Timeout?: number;
    Tracing?: string;
    VersionDescription?: string;
  };
}

// Grab Globals and Resources as objects from template yaml
const { Globals, Resources } = yamlParse(readFileSync(join(__dirname, 'template.yaml'), 'utf-8'));

// We use globals as a fallback, so make sure that object exists.
const GlobalFunction = Globals?.Function ?? {};

// Where my function source lives
const handlerPath = './rest-api/src';

let entries = {};

// Derive Lambda Function entry points from Cloudformation Template
// entries = Object.values(Resources)
// // Take only the Lambda function resources
// .filter((resource: any) => resource.Type === 'AWS::Serverless::Function')
// // Only nodejs Lambda functions
// .filter((resource: any) => (resource.Properties?.Runtime ?? GlobalFunction.Runtime).startsWith('nodejs'))
// // Get filename for each function and output directory (if desired)
// .map((resource: any) => ({
//   filename: resource.Properties.Handler.split('.')[0],
//   entryPath: resource.Properties.CodeUri.split('/').splice(1).join('/'),
// }))
// // Create hashmap of filename to file path
// .reduce(
//   (resources, resource) =>
//     Object.assign(resources, {
//       [`${resource.entryPath}/${resource.filename}`]: `${handlerPath}/${resource.filename}.ts`,
//     }),
//   {},
// );

// Add manually specified additional entry points
entries = Object.assign(entries, {
  ['/rest-api/lambda-rest-handler']: './rest-api/src/lambda-rest-handler.ts',
  // ['']: ''
});

const config: Configuration = {
  // Alternately just hardcode the entries
  // e.g `entry: { ['hello/hello']: './src/handlers/hello.ts', ['goodbye/goodbye']: './src/handlers/goodbye.ts' },`
  entry: entries,
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: resolve(__dirname, 'deploy'),
  },
  mode: process.env.NODE_ENV === 'dev' ? 'development' : 'production',
  module: {
    rules: [{ test: /\.ts$/, loader: 'ts-loader' }],
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  target: 'node',
  externals: [nodeExternals()],
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource) {
        const lazyImports = ['@nestjs/microservices', 'cache-manager', 'class-validator', 'class-transformer'];
        if (!lazyImports.includes(resource)) {
          return false;
        }
        try {
          require.resolve(resource);
        } catch (err) {
          return true;
        }
        return false;
      },
    }),
  ],
};

export default config;
