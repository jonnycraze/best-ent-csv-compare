// modules =================================================
var express             = require('express');
var app                 = express();
var methodOverride    	= require('method-override');
var router              = express.Router();
var bodyParser 					= require('body-parser');
var port            		= process.env.PORT || 8585;
var http 								= require('http');
var server 							= http.createServer(app);
var cluster             = require('cluster');

if (cluster.isMaster) {
  masterServer();
} else {
  startServer();
}

function masterServer () {
  var numWorkers = require('os').cpus().length;
  console.log('Master cluster setting up ' + numWorkers + ' workers...');

  for(var i = 0; i < 4; i++) {
    cluster.fork();
  }

  cluster.on('online', function(worker) {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
  });
}

function startServer () {
  // get all data/stuff of the body (POST) parameters
  app.use(methodOverride('X-HTTP-Method-Override'));               // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
  app.use(express.static(__dirname + '/client'));                         // set the static files location /public/img will be /img for usersapp.use(morgan('dev')); // log every request to the console
  app.use(bodyParser.json({limit: '50mb'})); 								// for parsing application/json
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true })); 		// for parsing application/x-www-form-urlencoded
  // app.use(multer()); 											// for parsing multipart/form-data


  // routes ==================================================
  require('./server/routes')(app); // pass our application into our routes

  // start app ===============================================
  console.log('Magic happens on port ' + port); 			// shoutout to the user
  exports = module.exports = app; 						// expose app
  server.listen(port);
  server.timeout = 100000000
}
