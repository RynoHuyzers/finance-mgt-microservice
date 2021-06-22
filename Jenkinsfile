pipeline {

    agent {
        label 'master'
    }

    environment {
        AWS_DEFAULT_REGION="${params.AWSRegion}"
    }

    parameters: {
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

    }
}