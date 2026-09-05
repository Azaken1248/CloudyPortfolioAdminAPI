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
                // Process name must match `pm2 list`. This said `cloudy-api`,
                // which does not exist, so the stage failed on every run.
                sh 'sudo -u aza PM2_HOME=/home/aza/.pm2 pm2 restart cloudy-admin-api'
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
                  # Read the port the service actually listens on rather than
                  # assuming the example default: the deployed instance is
                  # fronted by a Cloudflare Tunnel pointing at its own port.
                  APP_PORT="$(grep -E "^PORT=" .env 2>/dev/null | head -1 | cut -d= -f2 | tr -d "\r\n \"'" )"
                  APP_PORT="${APP_PORT:-5000}"
                  echo "checking health on port $APP_PORT"

                  for i in $(seq 1 10); do
                    if curl -fsS --max-time 5 "http://127.0.0.1:$APP_PORT/api/health" > /dev/null; then
                      echo "health check passed"
                      exit 0
                    fi
                    sleep 3
                  done
                  echo "service did not report healthy on port $APP_PORT after restart"
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
