Lorenzo Lercari
Patrick Lewis
CS390: Final Project

Board Game Framework
===


Overview:
The basic premise we began with was to create a highly scalable framework for creating simple board games and an engine which could run them. A final implementation would include a user list for tracking individuals and their work, a simple interface for creating games, an editor for manipulating their internal properties, and some other less central features like basic chat functionality. 

What currently exists as of writing is a library for dynamically instantiating games on demand, and an editor for creating new games and manipulating their properties. ‘Games’ at this stage are relegated mostly to a sandbox format, and only the most fundamental hooks for game logic exist. Games are then stored for future instantiation or editing in a mysql table.


Implementation:
As mentioned before, mysql is used to store game objects in tables. We chose mysql because of the low overhead and the organization advantages of relational databases. On instantiation, our library.js (located in public/javascript) cycles through the fields of the requested game table and creates a JSON object, setting the object’s variables to the field return values from the table. The idea being that a game could be dynamically generated with complex game logic behaviour by having fields which could execute logic on certain events (onclick, mouseover, etc.). Jquery is used throughout to populate elements of the dom with our return values, and display inforrmation to the user.

The library.js itself is the most complex piece of the system. Using canvas, it dynamically generates a board and pieces UI based on the returns from the mysql tables and instantiates a 2d representation at a unique url where players can manipulate the game. All of the complex game logic is currently hard-coded into this library, but if there was more time, we would have the library generate its functions for certain events based upon internal function definitions of the mysql tables. The library also uses sockets to manage incoming requests from manipulating players.

App.js uses express to manage all of the routing necessary for the index, instantiation of games, the editor, and errors. From the index.ejs, users may select to play or edit a game. Once a game is instantiated, users are directed to a unique url where sockets are used to monitor their interactions. The sockets ensure fast response times for manipulations, and also ensure that we are propagating those manipulations to the correct users. The editor likewise uses sockets to track modifications from the user and push them to the correct tables. The socket behaviour is defined in index.js, and the invocations can be found in their respective views.


Challenges:
Most of the problems we encountered during development can be summed up in one phrase: “It seemed like a good idea at the time.” We began with user management because we knew at some point we would want to track users and their content individually, but it was soon realized that this approach would complicate our table structures by an order of 2 (user tables would have refering user content tables would have refering games tables would have referring etc...). We dropped the user management early in favor of working on the sandbox aspects of game instantiation. You can see some of the unused implementation for users in index.js.

Organization of the editors was also a pain. Attaching specific table fields to specific html divs dynamically was a tedious process. Our goal was to have an editor which could take any game or piece table and was bulletproof to input. This would make the system highly scalable in the future, which was the overall goal. We think we’re there now, but ensuring that we did not have to hardcode fields into our editor required a lot of testing and “now why is that form referencing that field?” guesswork.

The library (surprisingly) came together fairly quickly, as it was the most like projects we had worked on before, and canvas handled most of the obscure graphical functionality. That said, structuring the library in such a way that we could eventually modify it to dynamically handle game objects’ internally defined methods was a challenge. We believe that it is appropriately structured now to do this, but without actually implementing it, we cannot say for sure.

Mostly, we were just too few, and the premise too complicated, for us implement all of the functionality we wanted to. Having 1 more person might have been the difference between sandbox and dynamic logic in the library.


Future Implementation:
We’re right at the point now where (if we were to continue working on this) we would modify the game tables to contain function definitions to handle their own game logic. The library would also be modified to provide some basic functionality in the event that a table had no internal definitions for an event. This would be handled by having a check which would query the table to see if there was any overriding (or appended) logic. A game could thus have complex logic independent from the library, OR extend the existing logic in some way.

Some other wish list stuff includes css, and more robust canvas displays (img for pieces and boards, etc), which we MAY still get to, but probably not.
