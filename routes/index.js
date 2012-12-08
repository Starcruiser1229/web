var mysql = require('mysql');

var connInfo = 
{
    host: 'instance28926.db.xeround.com',
    port: 17360,
    user: 'user',
    password: 'frangible',
    database: 'games'
};
    
var conn;
var games; //this is the main array which will hold the game objects for all currently running games...

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


exports.renderHome = function(req, res) 
{
    conn.query("SELECT id, name FROM games", function(err, result){
        rs.render("index.ejs", {title:"2D Games", data:result, err:err} );
        });
};

exports.renderEditor = function(req, res) 
{
    res.render("edit.ejs", {title:"Chat 326"} );
};

exports.renderGame = function(req, res) 
{
    res.render("game.ejs", {title:"Chat 326", id:6} );
};

exports.gameStart = function(req, res)
{
    
}

exports.newSocket = function() {}; //fix this later
