pipeline {

    agent {
        label 'master'
    }

    parameters {
        string(name: 'AppName', defaultValue: 'DriverManagement')
        string(name: 'ProjectName', defaultValue: 'DriverManagement-Microservice')
        string(name: 'AWSRegion', defaultValue: 'eu-west-1', description: 'AWS Region')
        string(name: 'DevAWSAccountNumber', defaultValue: '327579255305', description: 'AWS Account Number - Development')
        string(name: 'DevAWSCredentialsId', defaultValue: 'JenkinsAWS-USER', description: 'AWS Credentials added to Jenkins')
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
    }
}