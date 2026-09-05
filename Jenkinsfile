pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        // Verification runs before Build so a broken change cannot reach the
        // deploy stage. Previously the pipeline was install -> build -> restart,
        // so the tests existed but nothing ran them.
        stage('Typecheck') {
            steps {
                sh 'npm run typecheck'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Audit') {
            steps {
                // Advisory: report known vulnerabilities in production
                // dependencies without failing the build on a new disclosure
                // appearing mid-deploy.
                sh 'npm audit --omit=dev --audit-level=high || true'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            // Restart production only for the default branch. Without this, any
            // branch that happened to build would restart the live service.
            when {
                branch 'main'
            }
            steps {
                sh 'sudo -u aza PM2_HOME=/home/aza/.pm2 pm2 restart cloudy-api'
            }
        }

        stage('Smoke check') {
            when {
                branch 'main'
            }
            steps {
                // /api/health now reports 503 when the database is unreachable,
                // so this catches a deploy that started but cannot serve.
                sh '''
                  for i in $(seq 1 10); do
                    if curl -fsS --max-time 5 http://127.0.0.1:5000/api/health > /dev/null; then
                      echo "health check passed"
                      exit 0
                    fi
                    sleep 3
                  done
                  echo "service did not report healthy after restart"
                  exit 1
                '''
            }
        }
    }

    post {
        failure {
            echo 'Pipeline failed — production was not restarted unless Deploy had already run.'
        }
    }
}
