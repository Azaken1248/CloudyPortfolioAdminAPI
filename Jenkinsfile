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
                sh 'sudo -u aza PM2_HOME=/home/aza/.pm2 pm2 restart cloudy-api'
            }
        }
    }
}
