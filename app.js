var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    socketIO = require('socket.io');
    
    var app = express();
    
  app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  });
  
  app.configure('development', function(){
  app.use(express.errorHandler());
  });
  
  app.get('/', routes.renderHome);
  app.get('/play/:id', routes.renderGame);
  app.get('/edit/:id', routes.renderEditor);
  app.get('/start/:id', routes.startGame);
  app.get('/err/:msg', routes.renderErr);
  app.get('/createGame/',routes.createGame);
  app.get('/createPiece/:id', routes.createPiece);
  app.get('/delete/:id',routes.deleteGame);
  app.get('/deletePiece/:id/:game_id',routes.deletePiece);
  
  var server = http.createServer(app);
  io = socketIO.listen(server); //this is global so the routes can use it
  server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
  routes.connectToDatabase(); //start up the db

 //setup sockets
  io.sockets.on('connection', routes.newSocket);
    
  
});
