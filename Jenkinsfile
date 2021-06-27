pipeline {

    agent {
        label 'master'
    }

    parameters {
        string(name: 'ForceFullBuild', defaultValue: 'false')
        string(name: 'AppName', defaultValue: 'FinanceManagement')
        string(name: 'ProjectName', defaultValue: 'FinanceManagement-Microservice')
        string(name: 'AWSRegion', defaultValue: 'eu-west-2', description: 'AWS Region')
        string(name: 'DevAWSAccountNumber', defaultValue: '327579255305', description: 'AWS Account Number - Development')
        string(name: 'DevAWSCredentialsId', defaultValue: 'Jenkins', description: 'AWS Credentials added to Jenkins')
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '4', artifactNumToKeepStr: '1'))
    }

    stages {
        stage('Env Setup') {
            steps {
                script {
                    switch(env.Branch_Name){
                        case 'development':
                            env.DEPLOYMENT_ENVIRONMENT = "Dev";
                            env.AWSAccountNumber="${params.DevAWSAccountNumber}"
                            env.AWSCredentialId = "${params.DevAWSCredentialsId}";
                            break;
                    }
                    env.EnvLowerCase = "${env.DEPLOYMENT_ENVIRONMENT.toLowerCase()}";
                    env.DeploymentBucket = "${env.EnvLowerCase}-deployments-${params.ProjectName.toLowerCase()}";
                    env.AWS_DEFAULT_REGION = "${params.AWSRegion}";

                    sh """

                        aws --version
                        printenv
                    """
                }
                script {
                 sh """
                    rimraf node_modules
                    npm install

                    npm run clean
                 """
                }
            }
        }
/******* TEST AND CONVERAGE STAGE *******/

        stage('Testing') {
            // always perform this stage
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 16.4') {
                    sh """
                    npx jest --version
                    npm run test:cov
                    """
                }
            }
        }
/******* BUILD STAGES *******/


        stage('Build NestJS Lambda Layer') {
            // perform this stage only when a change has been detected in the Jenksinfile, or anything related to layer dependencies
            when {
                anyOf {
                    changeset pattern: "Jenkinsfile", caseSensitive: true;
                    changeset pattern: "nest-layer/package.json", caseSensitive: true;
                    changeset pattern: "cdk/src/nest-layer/**/*.ts", caseSensitive: true;
                    equals expected: "true", actual: params.ForceFullBuild;
                }
            }
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 16.4') {
                    sh """
                        ## downloads all dependnecies, creates a directory called nodejs, copies dependencies into it, zips the directory.
                        npm run nest-layer:build
                    """
                }
            }
        }

        stage('Build: RestAPI Proxy lambda') {
            // perform this stage only when a change has been detected in the Jenksinfile, or anything related to the code
            when {
                anyOf {
                    changeset pattern: "Jenkinsfile", caseSensitive: true;
                    changeset pattern: "tsconfig.build.json", caseSensitive: true;
                    changeset pattern: "rest-api/src/**/*.ts", caseSensitive: true;
                    changeset pattern: "cdk/src/rest-api/**/*.ts", caseSensitive: true;
                    changeset pattern: "cdk/src/rest-api/**/*.yaml", caseSensitive: true;
                    changeset pattern: "common-lambda-code/**/*.ts", caseSensitive: true;
                    changeset pattern: "nest-layer/package.json", caseSensitive: true;
                    equals expected: "true", actual: params.ForceFullBuild;
                }
            }
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 16.4') {
                    sh """
                        ## cd into correct directory, and nest build lambda code
                        npm run rest-api:build
                    """
                }
            }
        }
        stage('Package: RestAPI') {
            // perform this stage only when a change has been detected in the Jenksinfile, or anything related to the code
            when {
                anyOf {
                    changeset pattern: "Jenkinsfile", caseSensitive: true;
                    changeset pattern: "rest-api/tsconfig.build.json", caseSensitive: true;
                    changeset pattern: "rest-api/src/**/*.ts", caseSensitive: true;
                    changeset pattern: "cdk/src/rest-api/**/*.ts", caseSensitive: true;
                    changeset pattern: "cdk/src/rest-api/**/*.yaml", caseSensitive: true;
                    equals expected: "true", actual: params.ForceFullBuild;
                }
            }
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 16.4') {
                    sh """

                        # Deployable Zip
                        npm prune --production
                        npx mkdirp deploy/rest-api

                        cd build

                        ## zip all build artifact from rest-api:build
                        zip -r9 ../deploy/rest-api/finance-management-rest-lambda.zip *
                        cd ..
                        ## zip node modules into zip file
                        zip -r9 deploy/rest-api/finance-management-rest-lambda.zip node_modules/
                        rm -rf node_modules

                    """
                }
            }
        }
        stage('Prepare Deploy Dependencies') {
            // Basically always perform this step if there was change to any code or dependnecy
            when {
                anyOf {
                    changeset pattern: "Jenkinsfile", caseSensitive: true;
                    changeset pattern: "nest-layer/package.json", caseSensitive: true;
                    changeset pattern: "cdk/**/*.*", caseSensitive: true;
                    changeset pattern: "rest-api/**/*.ts", caseSensitive: true;
                    equals expected: "true", actual: params.ForceFullBuild;
                }
            }
            steps {
                script{
                    sh """
                        echo "Install CDK Dependencies"
                        npm install --only=dev
                    """
                }
            }
        }
        stage('Deploy Nest Layer') {
            // perform this stage only for dev, QA or Prod, when there are changes to the Jenkinsfile, or anything related to dependencies
            when {
                allOf {
                    not { environment name: 'DEPLOYMENT_ENVIRONMENT', value: 'no_deploy'};
                    anyOf {
                        changeset pattern: "Jenkinsfile", caseSensitive: true;
                        changeset pattern: "nest-layer/package.json", caseSensitive: true;
                        changeset pattern: "cdk/src/nest-layer/**/*.ts", caseSensitive: true;
                        equals expected: "true", actual: params.ForceFullBuild;
                    }
                }
            }
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                    credentialsId: "${env.AWSCredentialId}",
                                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    sh """
                        echo "Deploy Nest Layer"
                        ## cd into cdk directory and compiles cdk
                        npm run cdk:build:nest-layer

                        cd cdk/src/nest-layer
                        npx rimraf cdk.out

                        ## Deploys zip file created during cdk compile
                        npm run cdk:deploy:nest-layer -- --require-approval=never
                    """
                }
            }
        }
        stage('Deploy REST API Proxy Lambda') {
            // perform this stage only for dev, QA or Prod, when there are changes to the Jenkinsfile, or anything related to lambda code or cdk
            when {
                allOf {
                    not { environment name: 'DEPLOYMENT_ENVIRONMENT', value: 'no_deploy'};
                    anyOf {
                        changeset pattern: "Jenkinsfile", caseSensitive: true;
                        changeset pattern: "rest-api/src/**/*.ts", caseSensitive: true;
                        changeset pattern: "cdk/src/rest-api/proxy-lambda/**/*.ts", caseSensitive: true;
                        equals expected: "true", actual: params.ForceFullBuild;
                    }
                }
            }
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                    credentialsId: "${env.AWSCredentialId}",
                                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    sh """
                        echo "Deploy REST API Proxy Lambda"
                        ## cd into cdk directory and compiles cdk
                        npm run cdk:build:rest-api-proxy

                        cd cdk/src/rest-api/proxy-lambda
                        npx rimraf cdk.out

                        ## Deploys zip file created during cdk compile
                        npm run cdk:deploy:rest-api-proxy -- --require-approval=never
                    """
                }
            }
        }
    }
}