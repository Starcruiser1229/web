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
    console.log(gameObj.pieces);
    gameObj.board[location.x][location.y].piece = gameObj.pieces[piece];  
}

var removePiece = function(location)
{
    gameObj.board[location.x][location.y].piece = undefined;  
}

var movePiece = function(start, end)
{
    gameObj.board[end.x][end.y].piece = gameObj.board[start.x][start.y].piece;  
    gameObj.board[start.x][start.y].piece = undefined; 
}


var redrawGame = function()
{
    //TODO: more shapes, draw background automatically, get grid color from object
    var u_width = canvas.width/gameObj.width;
    var u_height = canvas.height/gameObj.height;
    
    for (var x = 0; x < gameObj.width; x++)
    {
        for(var y = 0; y < gameObj.height; y++)
        {
            var piece = gameObj.board[x][y].piece;
            if(piece) //there is a piece in this grid
            {
                c2d.fillStyle = piece.color;
                if(piece.shape == "square") //the piece is square
                {
                    console.log(u_width*x);
                    console.log(u_height*x);
                    console.log(u_width*piece.x_scale);
                    console.log(u_height*piece.y_scale);
                    c2d.fillRect(u_width*x+((u_width*(1-(piece.x_scale)))/2), u_height*y+((u_width*(1-piece.y_scale))/2), u_width*piece.x_scale, u_height*piece.y_scale);
                } 
            }
        }
    }
     
    if(gameObj.grid_visible)
    {
        c2d.fillStyle = "#ffffff";
        for(var x = 1; x < gameObj.width; x++)
        {
            c2d.fillRect(u_width*x-1, 0, 2, canvas.height);
        }
        for(var y = 1; y < gameObj.height; y++)
        {
            c2d.fillRect(0, u_height*y-1, canvas.width, 2);
        }
    }
    
}


//OTHER STUFF
var main = function() //this function gets run when the page loads and handles all my setup stuff
{
    console.log("in main");
    
    socket.on('loadGame', loadGame);
    socket.emit('getGame', game_id); //call out to the server and request an update to the game object...
    
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
    
    window.setTimeout(demoStuff, 1000); //run demo code with 1 sec delay to allow setup to complete
};

$(main); //run the "main" function when the page loads


var demoStuff = function()
{
  //demo code: Fill canvas with red rectangle.
    c2d.fillStyle="#FF0000";
    c2d.fillRect(0,0,canvas.width,canvas.height);
    
    addPiece(0, {x:0,y:0});
    addPiece(0, {x:4,y:7});
    addPiece(0, {x:2,y:5});
    redrawGame();
    
    window.setTimeout(demoStuff2, 1000); //run second part of the demo in another second.
}

var demoStuff2 = function()
{
  removePiece({x:4,y:7});
  movePiece({x:2,y:5}, {x:4,y:5});
  //the draw code should redraw the bg automatically...
  c2d.fillStyle="#FF0000";
  c2d.fillRect(0,0,canvas.width,canvas.height);
  redrawGame();
}




