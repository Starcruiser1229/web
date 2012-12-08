var socket = io.connect("http://localhost");

var canvas; //the canvas we are using to draw the game
var c2d; //the 2d drawing context for the canvas

var gameObj; //the object that represents the game

//allow the server to set the game object through the websocket
var loadGame = function(data)
{
    console.log(data);
    gameObj = data;
}

var addPiece = function(piece, location)
{
    gameObj.board[location.x][location.y].piece = gameObj.piece[piece];  
}

var removePiece = function(location)
{
    //do stuff here
}

var movePiece = function(start, end)
{
    //do stuff here
}


var redrawGame = function()
{
    var x = gameObj.width;
    var y = gameObj.height;
    
    for (var x = 0; x < gameObj.width; x++)
    {
        for(var y = 0; y < gameObj.height; y++)
        {
        
             //do drawing stuff here
         }
     }
    
}


//OTHER STUFF
var main = function() //this function gets run when the page loads and handles all my setup stuff
{
    console.log("in main");
    
    socket.on('loadGame', loadGame);
    socket.emit('getGame', game_id); 
    
    var game_div = $(".game")[0];
    var width = $(window).width();
    var height = $(window).height();
    
    //create a square canvas that fits the screen
    if(width > height)
    {
        $(game_div).append("<canvas id=g_canvas height="+.95*height+" width="+.95*height+"></canvas>");
    }
    else
    {
        $(game_div).append("<canvas id=g_canvas height="+.95*width+" width="+.95*width+"></canvas>");
    }
    
    
    canvas = $("#g_canvas")[0]; //get canvas
    
    c2d = canvas.getContext("2d"); //get canvas 2d drawing context
    
    
    //demo code: Fill canvas with red rectangle.
    c2d.fillStyle="#FF0000";
    c2d.fillRect(0,0,canvas.width,canvas.height);
    
};

$(main); //run the "main" function when the page loads
