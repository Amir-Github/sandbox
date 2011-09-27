
/**
 * Module dependencies.
 */

var express = require('express') 
  , sio     = require('socket.io');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Chatusic'
  });
});

app.listen(3000);


var io = sio.listen(app) , users = {};
io.sockets.on('connection', function (socket) {
  
  
  socket.on("login" , function(nickname , callback) {
     if(users[nickname]){
       callback(false , 0);
     }else{  
      users[nickname] = socket;
      socket.nickname = nickname;
      callback(true , socket.id);
      console.log("new user -> "+nickname+" = "+socket.id, app.address().port, app.settings.env);
     } 
  });
  
  socket.on("send_msg" , function(message , callback){
    var msg       = message.substring(0,message.indexOf("_to_"));
    var nickname  = message.substring(message.indexOf("_to_")+4 , message.length);
    if(users[nickname]){
     users[nickname].emit('got_msg' , msg);
     callback(true , socket.nickname);
     console.log("message sent to "+nickname+" from "+socket.nickname, app.address().port, app.settings.env);
    }
    else{
     callback(false , "");
    }
    
  });
  
  socket.on('disconnect', function () {
   
  });
});


console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


