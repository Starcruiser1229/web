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
var games = []; //this is the main array which will hold the game objects for all currently running games...

//USER HANDLER STUFF
// list of handles, used for login checks, and populating clientside user lists
var usernames = [];
// socket storage, acts as pseudo hashtable. Maybe useful for pushing info to specific users
var usersockets = {};

//testing data - sort this out later...
var test_piece = {name:"test piece", color:"#00ff00", shape:"square", x_scale:.8, y_scale:.8};
var test_piece2 = {name:"test piece", color:"#0000ff", shape:"circle", x_scale:.8, y_scale:.8};
var test_pieces = [];
test_pieces[0] = test_piece;
test_pieces[1] = test_piece2;
var testBoard = new Array(10)
var testSquare = {piece:""};
for (var i = 0; i < 10; i++)
{
    testBoard[i] = new Array(10);
    for (var j = 0; j < 10; j++)
    {
        testBoard[i][j] = testSquare;
    }
}

var test_game = {name:"test game", width:10, height:10, pieces:test_pieces, board:testBoard, grid_visible:true, bg_color:"#ff0000", grid_color:"#ffffff"};
games[10101] = test_game;

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
    // I need more info about the tables before I can associate a form with table fields. I don't even know if I'm querying the right place.
    conn.query('SELECT '+req.params.id+', '+(req.params.id-1)+' FROM games' , function(err, result, fields){
        res.render("edit.ejs", {
            title:"2D game editor", 
            data:result,
            field: fields,
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
                    games[code] = result[0]; //save the game object for our new game
                    res.redirect("/play/"+code); //redirect to the new game
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
    });
    
    socket.on('getGame', function(gameTag){
        //TODO: Add error checking here
        socket.emit('loadGame', games[gameTag]);
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
