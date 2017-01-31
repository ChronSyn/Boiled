# Restarts our node.js project with forever
forever stop ./application.config
NODE_ENV=production forever start ./application.config -nouse-idle-notifications