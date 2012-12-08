var mysql = require('mysql');
// need hostname
var socket = socketIO.connect('HOST');
// required for dom manipulation in socket requests
var $ = require('jquery');

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
    res.render("edit.ejs", {title:"DDgames"} );
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
        res.render("game.ejs", {title:"DDgames", id:req.params.id} );
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

//TODO: Error handler page at /err/error_code

// LORENZO FUCKED WITH YOUR SHIT BELOW THIS LINE!
//TODO: implement serverside socket stuff
socket.on('connect', function({
    socket.emit('userlogin', prompt("Please select a username."));
}));

// in the case that username is invalid or already exists
socket.on('userreject', function(msg){
    socket.emit('userlogin', prompt(msg));
})

// uses jquery to update userlists clientside (maybe this should be done on the view itself?)
socket.on('updateusers', function(usernames){
   $('#users').empty();
   for(var i = 0; i < usernames.length; i++){
       $('#users').append('<div>' + users[i] + '</div>');
   }
});