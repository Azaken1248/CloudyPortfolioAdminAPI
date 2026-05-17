pipeline {
    agent any

    tools {
        nodejs 'Node20'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Restart') {
            steps {
                sh 'pm2 restart cloudy-api'
            }
        }
    }
}
