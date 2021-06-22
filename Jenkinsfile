pipeline {

    agent {
        label 'master'
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