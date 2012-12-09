var socket = io.connect("http://localhost");

var canvas; //the canvas we are using to draw the game
var c2d; //the 2d drawing context for the canvas
var wide; //bool - true if the window is wide enough to put the toolbar to the right of the main canvas, false otherwise
var tbCanvas; //this is the canvas used to draw the toolbar.
var selectedPiece = 0; //the currently selected piece - changed by clicking on the toolbar.


var gameObj; //the object that represents the game

var mouseDown; //saves the information about when and where the last mouse down event happened.
var draggingPiece; //which piece is the user currently dragging, if any?

/**
 * PIECE Manipulation Functions - both local and remote
 */

//allow the server to set the game object through the websocket
var loadGame = function(data)
{
    gameObj = data;
}

//function to add a piece locally - calls socket to notify other clients
var addPiece = function(piece, location)
{
    gameObj.board[location.x][location.y].piece = gameObj.pieces[piece];
    socket.emit('addPiece', piece, location, game_id);
    redrawGame();  
}

//function to handle adding a piece when told to do so by the socket.
var remoteAddPiece = function(piece, location, id)
{
    gameObj.board[location.x][location.y].piece = gameObj.pieces[piece];
    redrawGame(); 
}

//function to remove a piece locally - calls socket to notify other clients
var removePiece = function(location)
{
    gameObj.board[location.x][location.y].piece = undefined;
    socket.emit('removePiece', location, game_id);
    redrawGame();  
}

//function to remove a piece when told to do so by the socket
var remoteRemovePiece = function(location, id)
{
    console.log("remote remove");
    gameObj.board[location.x][location.y].piece = undefined;
    redrawGame();  
}

//function to move a piece when told to do so by the socket
//TODO: slide animation for remote moves.
var remoteMovePiece = function(start, end, id)
{
    console.log("remote move");
    gameObj.board[end.x][end.y].piece = gameObj.board[start.x][start.y].piece;  
    gameObj.board[start.x][start.y].piece = undefined;
    redrawGame(); 
}

/**
 * Mouse Handlers
 */

//On Mouse Down is called whenever the mouse button is pressed over the canvas
//This function saves info about where the mouse was depressed so we can decide what
//to do when it is released. It also starts the piece drag animations on this client.
var onMouseDown = function(event)
{
    var u_width = canvas.width/gameObj.width;
    var u_height = canvas.height/gameObj.height;
    
    var x_loc = Math.floor(event.offsetX/u_width);
    var y_loc = Math.floor(event.offsetY/u_height);
    
    mouseDown = {x:x_loc, y:y_loc, time:new Date()};
    
    if (gameObj.board[x_loc][y_loc].piece)
    {
        draggingPiece = gameObj.board[x_loc][y_loc].piece;
        gameObj.board[x_loc][y_loc].piece = undefined;
        redrawGame();
        canvas.onmousemove = animateDrag;
    }
}

//TODO: When you drop a piece onto another piece, what should happen?
//TODO: More limits on add and remove??
//OnMouseUp is called when the mouse button is released over the game.
//This function ends the piece drag animation, and uses the information stored
//in the mouseDown event to decide if this was a click or a drag and drop, and 
//handle the event appropriately.
var onMouseUp = function(event)
{
    var u_width = canvas.width/gameObj.width;
    var u_height = canvas.height/gameObj.height;
    
    var x_loc = Math.floor(event.offsetX/u_width);
    var y_loc = Math.floor(event.offsetY/u_height);
    
    if(draggingPiece)
    {
        gameObj.board[x_loc][y_loc].piece = draggingPiece;
        draggingPiece = undefined;
        canvas.onmousemove = undefined;
        redrawGame();
    }
    
    if (mouseDown.x == x_loc && mouseDown.y == y_loc)
    {
        console.log("Registered Mouse Click on " + x_loc+","+y_loc);
        if(gameObj.board[x_loc][y_loc].piece) //clicked on existing piece
        {
            removePiece(mouseDown);
        }
        else //clicked on empty location
        {
            addPiece(selectedPiece, mouseDown);
        }
    }
    else
    {
        console.log("Registered Drag&Drop From " + mouseDown.x+","+mouseDown.y+" To "+x_loc+","+y_loc);
        socket.emit("movePiece", mouseDown, {x:x_loc, y:y_loc}, game_id);
    }
}

//this function is set up to track the mouse and redraw the piece being dragged the whole time it is being dragged.
//this function provides the LOCAL move animation, in real time.
//TODO: The position is slightly off. Fix it.
var animateDrag = function(event)
{
    var piece = draggingPiece;
    var u_width = canvas.width/gameObj.width;
    var u_height = canvas.height/gameObj.height;
    
    redrawGame();
    
    c2d.fillStyle = piece.color;
    if(piece.shape == "square") //the piece is square
    {
        c2d.fillRect(event.offsetX+((u_width*(1-(piece.x_scale)))/2), event.offsetY+((u_height*(1-piece.y_scale))/2), u_width*piece.x_scale, u_height*piece.y_scale);
    }
    else if(piece.shape == "circle") //the piece is square
    {
        c2d.beginPath();
        c2d.arc(event.offsetX+(u_width/2), event.offsetY+(u_height/2), ((u_width<u_height) ? ((u_width*piece.x_scale)/2) : ((u_height*piece.y_scale)/2)) , 0, 2*Math.PI, true);
        c2d.fill();
    }
}

//this function is called when someone clicks on the toolbar
//it updates which piece is the selected piece.
var onToolbarClick = function(event)
{
    var u_width = canvas.width/gameObj.width;
    var u_height = canvas.height/gameObj.height;
    
    if (wide)
    {
        selectedPiece = Math.floor(event.offsetY/u_height);
    }
    else
    {
        selectedPiece = Math.floor(event.offsetX/u_width);
    }
    console.log("Toolbar - Piece Selected: " + selectedPiece);
    
}

/**
 * Graphics functions - draw things
 */
 
//this function handles drawing everything onto the canvas based on the current state of the game object.
//it appropriately sizes everything for the size of the canvas and the grid.
var redrawGame = function()
{
    //TODO:support for images
    var u_width = canvas.width/gameObj.width; //calculate the width (in px) of a grid square
    var u_height = canvas.height/gameObj.height; //calculate the height (in px) of a grid square
    
    //draw solid color background fill
    c2d.fillStyle=gameObj.bg_color; 
    c2d.fillRect(0,0,canvas.width,canvas.height);
    
    //draw pieces - loop through all grid squares
    for (var x = 0; x < gameObj.width; x++)
    {
        for(var y = 0; y < gameObj.height; y++)
        {
            var piece = gameObj.board[x][y].piece; //get the piece associated with this grid square if there is one
            if(piece) //there is a piece in this grid
            {
                c2d.fillStyle = piece.color; //set the fill color
                if(piece.shape == "square") //the piece is square
                {
                    c2d.fillRect(u_width*x+((u_width*(1-(piece.x_scale)))/2), u_height*y+((u_height*(1-piece.y_scale))/2), u_width*piece.x_scale, u_height*piece.y_scale);
                }
                else if(piece.shape == "circle") //the piece is a circle
                {
                    c2d.beginPath();
                    c2d.arc(u_width*x+(u_width/2), u_height*y+(u_height/2), ((u_width<u_height) ? ((u_width*piece.x_scale)/2) : ((u_height*piece.y_scale)/2)) , 0, 2*Math.PI, true);
                    c2d.fill();
                } 
            }
        }
    }
    
    //draw grid
    if(gameObj.grid_visible) //if the game has a visible grid
    {
        c2d.fillStyle = gameObj.grid_color; //set the color to the grid color
        for(var x = 1; x < gameObj.width; x++) //draw all of the vertical lines
        {
            c2d.fillRect(u_width*x-1, 0, 2, canvas.height);
        }
        for(var y = 1; y < gameObj.height; y++) //draw all of the horizontal lines
        {
            c2d.fillRect(0, u_height*y-1, canvas.width, 2);
        }
    }  
}

//Draw the toolbar
//The toolbar is a small canvas which shows all of the possible piece types for the game in 
//a single column. It allows the user to select a piece to add to the main board. This function
//is responsible for creating and updating the toolbar as needed.
//TODO: support for multi-columns to handle larger numbers of pieces??
var drawToolbar = function()
{
    var u_width = canvas.width/gameObj.width; //calculate the width (in px) of a grid square
    var u_height = canvas.height/gameObj.height; //calculate the height (in px) of a grid square
    

    if (!tbCanvas) //toolbar has not been created yet
    {   
        //if the window is wide we will put the toolbar to the right. 
        if (($(window).width() - canvas.width) - u_width > 0)
        {
            wide = true;
        }
        else //the window is tall, put the toolbar on the bottom.
        {
            wide = false;
        }
        var game_div = $(".game")[0]; //find the div on the page where we want the canvas.
        if (wide) //create a tall, narrow canvas (for the side)
        {
            $(game_div).append("<canvas id=t_canvas width="+u_width+" height=" + gameObj.pieces.length*u_height + "></canvas>");
            tbCanvas = $("#t_canvas")[0];
        }
        else //create a short, wide canvas (for the bottom)
        {
            $(game_div).append("<canvas id=t_canvas height="+u_height+" width=" + gameObj.pieces.length*u_width + "></canvas>");
            tbCanvas = $("#t_canvas")[0];
        }
    }
    
    var t2d = tbCanvas.getContext("2d");
    if(wide) //its a tall toolbar
    {
        for(var i = 0; i < gameObj.pieces.length; i++)
        {
            var piece = gameObj.pieces[i]; //get the piece associated with this grid square if there is one
            if(piece) //there is a piece in this grid
            {
                t2d.fillStyle = piece.color; //set the fill color
                if(piece.shape == "square") //the piece is square
                {
                    t2d.fillRect(0+((u_width*(1-(piece.x_scale)))/2), u_height*i+((u_height*(1-piece.y_scale))/2), u_width*piece.x_scale, u_height*piece.y_scale);
                }
                else if(piece.shape == "circle") //the piece is a circle
                {
                    t2d.beginPath();
                    t2d.arc(0+(u_width/2), u_height*i+(u_height/2), ((u_width<u_height) ? ((u_width*piece.x_scale)/2) : ((u_height*piece.y_scale)/2)) , 0, 2*Math.PI, true);
                    t2d.fill();
                } 
            }
        }
    } //end of drawing tall toolbar
    else //its a wide toolbar
    {
        for(var i = 0; i < gameObj.pieces.length; i++)
        {
            var piece = gameObj.pieces[i]; //get the piece associated with this grid square if there is one
            if(piece) //there is a piece in this grid
            {
                t2d.fillStyle = piece.color; //set the fill color
                if(piece.shape == "square") //the piece is square
                {
                    t2d.fillRect(u_width*i+((u_width*(1-(piece.x_scale)))/2), 0+((u_height*(1-piece.y_scale))/2), u_width*piece.x_scale, u_height*piece.y_scale);
                }
                else if(piece.shape == "circle") //the piece is a circle
                {
                    t2d.beginPath();
                    t2d.arc(u_width*i+(u_width/2), 0+(u_height/2), ((u_width<u_height) ? ((u_width*piece.x_scale)/2) : ((u_height*piece.y_scale)/2)) , 0, 2*Math.PI, true);
                    t2d.fill();
                } 
            }
        }
    } //end of drawing wide toolbar
}  


/**
 * Other Stuff
 */
//the main function is run by jQuery after the page has finished loading. It creates the socket connections
//and handles all of the setup stuff, like creating event handlers.
var main = function() 
{   
    socket.on('loadGame', loadGame); //socket handler for incoming push of entire game object
    socket.on('addPiece', remoteAddPiece);
    socket.on('movePiece', remoteMovePiece);
    socket.on('removePiece',remoteRemovePiece);
    socket.emit('getGame', game_id); //call out to the server and request an update to the game object...
    //note: game_id is harcoded into the html using ejs. It provides the unique last 5 digits of the url.
    
    var game_div = $(".game")[0]; //find the div on the page where we want the canvas.
    var width = $(window).width(); //get the height of the browser window
    var height = $(window).height(); //get the width of the browser window
    
    //create a square canvas that fits the screen
    if(width > height) //we are height limited
    {
        $(game_div).append("<canvas id=g_canvas height="+.95*height+" width="+.95*height+"></canvas>");
    }
    else //we are width limited
    {
        $(game_div).append("<canvas id=g_canvas height="+.95*width+" width="+.95*width+"></canvas>");
    }
    
    canvas = $("#g_canvas")[0]; //store reference to actual canvas
    
    //mouse event handlers - allow the code to recieve user input
    canvas.onmousedown = onMouseDown; 
    canvas.onmouseup = onMouseUp;
    
    c2d = canvas.getContext("2d"); //get canvas 2d drawing context
    
    window.setTimeout(demoStuff, 1000); //debug: run demo code with 1 sec delay to allow setup to complete
};

$(main); //jQuery: run the "main" function when the page loads


//TESTING CODE--------------------------------------------------------------------------------------------
var demoStuff = function() //TODO: This is demo/debug code
{
    drawToolbar();
    tbCanvas.onclick = onToolbarClick;
    redrawGame();
}

