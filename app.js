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
  
  var server = http.createServer(app);
  io = socketIO.listen(server); //this is global so the routes can use it
  server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
  routes.connectToDatabase(); //start up the db

 //setup two distinct types of websockets.
 //there may be a better way to do this?
 // Why don't we just push content to the requesting socket as per the request type? 2 sockets seems weird.
 // I think I kinda see what you're doing here, but I don't know this method. See below for my implementation.
 // Maybe we can merge them.
  play = io
    .of('/play')
    .on('connection', routes.newSocket);
    
  edit = io
    .of('/edit')
    .on('connection', routes.newSocket);
    
    //USER HANDLER STUFF
    // list of handles, used for login checks, and populating clientside user lists
    var usernames = [];
    // socket storage, acts as pseudo hashtable. Maybe useful for pushing info to specific users
    var usersockets = {};
    //socket handler
    io.sockets.on('connection'. function(socket){
        // user login
        socket.on('userlogin', function(username)){
            // verify legal handle
            if (username !== null && username.match(/[A-Za-z_][A-Za-z_0-9]*/)){
                // verify handle is unique
                if (usernames.indexof(username) !== -1){
                    socket.emit('userreject', username + ' is reserved. Please try again.')
                }else{
                    // add user to socket, add socket to storage
                    socket.username = username;
                    usersockets[socket.username] = socket;
                    // add username to sorted list
                    usernames.push(username);
                    usernames.sort();
                    // sends call to update #users div
                    io.sockets.emit('updateusers', usernames);
                }
            }else{
                socket.emit('userreject', username + ' is not a valid username. Please try again.');
            }
        });
        // user disconnect
        socket.on('disconnect', function(){
            var user = socket.username;
            // free handle from list
            usernames.splice(user, 1);
            // We may or may not want to do this since it will destroy their session data (unless I'm wrong)
            delete usersockets[user];
            // sends call to update #users div            
            io.sockets.emit('updateusers', usernames);
        });
    }
  
});
