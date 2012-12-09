var mysql = require('mysql');

// need hostname
//var socket = socketIO.connect('HOST');
// required for dom manipulation in socket requests
//var $ = require('jquery');

var connInfo = 
{
    host: 'instance28926.db.xeround.com',
    port: 17360,
    user: 'user',
    password: 'frangible',
    database: 'games'
};
    
var conn;
var games = new Array(); //this is the main array which will hold the game objects for all currently running games...
var gameSockets = new Array(); //this is an array of arrays which holds pointers to each of the sockets open in a given game...
var socketSerial = 0; //this is just a number which counts up and allows me to assign a "unique" id to each new socket that comes in...

//USER HANDLER STUFF
// list of handles, used for login checks, and populating clientside user lists
var usernames = [];
// socket storage, acts as pseudo hashtable. Maybe useful for pushing info to specific users
var usersockets = {};

//connect to the database...
exports.connectToDatabase = function() 
{
    conn = mysql.createConnection(connInfo);
    conn.connect(function (err) 
    {
        if(err) 
        {
            console.log("There was an error connecting to the database");
        }
        else 
        {
            console.log("Connected to Database");
        }
    });
}

//render the error page
exports.renderErr = function(req, res)
{
    res.render("err.ejs", {title:"Big Flaming Error!", error_code:req.params.msg});
}

//render the home page with the main list of games
exports.renderHome = function(req, res) 
{
    conn.query("SELECT id, name FROM games", function(err, result){
        res.render("index.ejs", {title:"2D Games", data:result, err:err} );
        });
};

//render the editor page
exports.renderEditor = function(req, res) 
{
    console.log(req.params.id);
    conn.query('SELECT * FROM games WHERE id=?', req.params.id, function(err, result, fields){
        res.render("edit.ejs", {
            title:"2D game editor", 
            data:result,
            err:err
        });
    });
};

//render the page which actually allows you to play a game...
exports.renderGame = function(req, res) 
{
    console.log(req.params.id);
    if(!games[req.params.id])
    {
        res.redirect("/err/Invalid_Instance");
    }
    else
    {
        res.render("game.ejs", {title:"2Dgames", id:req.params.id} );
    }
};

//this route handler creates a new game object based on the selected template
exports.startGame = function(req, res)
{
    var done = false;
    while (!done)
    {
        var code = Math.random().toString(36).substring(2,7);
        console.log(code);
        if (!games[code])
        {
            //try to get the game info from the database
            conn.query("SELECT * FROM games WHERE id=?",req.params.id, function(err, result)
            {
                if(!err) //got it!
                {
                    conn.query("SELECT * FROM pieces WHERE game_id=?",req.params.id, function(err2, pieces)
                    {
                        if(!err) //got this one too!
                        {
                            games[code] = result[0]; //save the game object for our new game
                            games[code].pieces = pieces; //add the array of pieces to the game object
                            games[code].board = new Array(games[code].width); //start setting up the board array
                            for (var i = 0; i < 10; i++) //loop through and create the board array.
                            {
                                games[code].board[i] = new Array(games[code].height);
                                for (var j = 0; j < 10; j++)
                                {
                                    games[code].board[i][j] = {piece:""};
                                }
                            }
                            
                            console.log(games[code]);
                            gameSockets[code] = new Array(); //create the array to hold the gamesockets for this game
                            res.redirect("/play/"+code); //redirect to the new game
                        }
                        else
                        {
                             res.redirect("/err/Database_Error"); //redirect to an error page
                        }   
                    });
                }
                else
                {
                    res.redirect("/err/Database_Error"); //redirect to an error page
                }
            });
            done = true;
        }
    }   
}

exports.newSocket = function(socket)
{
    socket.set("sock_id", socketSerial++); //uniquely identify this socket
    // user login
    socket.on('userlogin', function(username){
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
        
        //TODO:update gameSockets
        
    });
    
    //starting a new game...
    socket.on('getGame', function(gameTag){
        //TODO: Add error checking here
        socket.emit('loadGame', games[gameTag]);
        socket.get("sock_id", function(err, name) {
            if(!err)
            {
                gameSockets[gameTag][name] = socket; //store the sockets for later calls
            }
        });
    });
    
    //notify all other people in this game to add a new piece
    socket.on('addPiece', function(piece, location, gameTag){
        socket.get("sock_id", function(err, name){
            if(!err)
            {
                for (var key in gameSockets[gameTag])
                {
                    if(key != name)
                    {
                        gameSockets[gameTag][key].emit('addPiece', piece, location, gameTag);
                    }
                    console.log("add", key, name);
                }
                games[gameTag].board[location.x][location.y].piece = games[gameTag].pieces[piece];
            }
        });   
    });
    //notify all other people in this game to remove a piece
    socket.on('removePiece', function(location, gameTag){
        socket.get("sock_id", function(err, name){
            if(!err)
            {
                for (var key in gameSockets[gameTag])
                {
                    if(key != name)
                    {
                        gameSockets[gameTag][key].emit('removePiece', location, gameTag);
                    }
                    console.log("remove",key, name);
                }
                games[gameTag].board[location.x][location.y].piece = undefined;
            }
        });   
    });
    
      //notify all other people in this game to move a piece
    socket.on('movePiece', function(start, end, gameTag){
        socket.get("sock_id", function(err, name){
            if(!err)
            {
                for (var key in gameSockets[gameTag])
                {
                    if(key != name)
                    {
                        gameSockets[gameTag][key].emit('movePiece', start, end, gameTag);
                    }
                    console.log('move', key, name);
                }
                games[gameTag].board[end.x][end.y].piece = games[gameTag].board[start.x][start.y].piece;
                games[gameTag].board[start.x][start.y].piece = undefined;
            }
        });   
    });
    
    // something is breaking here. Table field and value are coming in as null even though they are correct on the client side
    socket.on('updatetable', function(table, field, value){
        console.log("Table: "+table+"\nField: "+field+"\nValue: "+value);
        // testing socket emissions before screwing around with tables
        // conn.query("INSERT INTO ? (?) VALUES ('?')", table, field, value);
    });
}

/*
//LORENZO - this file is run SERVER side - this looks like client code? If so it should be in library.js
// LORENZO FUCKED WITH YOUR SHIT BELOW THIS LINE!
// I don't know how to use the function you were building for newSocket. 
// If you want, we can add the following into that function
socket.on('connect', function(){
    socket.emit('userlogin', prompt("Please select a username."));
});

// in the case that username is invalid or already exists
socket.on('userreject', function(msg){
    socket.emit('userlogin', prompt(msg));
});

// uses jquery to update userlists clientside (maybe this should be done on the view itself?)
socket.on('updateusers', function(usernames){
   $('#users').empty();
   for(var i = 0; i < usernames.length; i++){
       $('#users').append('<div>' + users[i] + '</div>');
   }
});
*/ 
