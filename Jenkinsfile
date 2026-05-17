pipeline {
    agent any

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
