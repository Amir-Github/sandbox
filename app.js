
/**
 * Module dependencies.
 */

var express = require('express') 
  , sio     = require('socket.io')
  , mongoose = require('mongoose');


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

///////////////////DB
mongoose.connect('mongodb://localhost/chatusic');
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
  
require('./models.js').create_models(Schema, mongoose ,ObjectId);
var User = mongoose.model('User');
/////////////////////////

///////////////////Socket.io server 
var io = sio.listen(app) , users = {};
io.sockets.on('connection', function (socket) {
  
  
  socket.on("login" , function(nickpass , callback) {
     var nickname  = nickpass.substring(0,nickpass.indexOf("_with_"));
     var password  = nickpass.substring(nickpass.indexOf("_with_")+4 , nickpass.length);
     var client    = this;
     
     User.find({nickname : nickname} , function(err , result){
       if(!result){ //////error
         console.log("ERROR -> "+err, app.address().port, app.settings.env);
         callback(false , "Shit!! Something went wrong there... Please try again!");
       }else if(result.length != 0){ ///// nickname already exists
          var user = result[0];
          if(user.authenticate(password)){
           client.nickname = nickname;
           users[nickname] = socket;
           callback(true , 2);////// existed user
           console.log("user logged in -> "+nickname+" = "+socket.id, app.address().port, app.settings.env);
          }else{
           callback(false , "Nick name is not available if you are signing up. already signed up? then check your password!");
          }  
       }else{
         new User({nickname : nickname , password : password}).save();   
         client.nickname = nickname;
         users[nickname] = socket;
         callback(true , 1); /////new user
         console.log("new user -> "+nickname+" = "+socket.id, app.address().port, app.settings.env);
       }    
    }); 
  });
  
  socket.on("send_msg" , function(message , callback){
    var msg       = message.substring(0,message.indexOf("_to_"));
    var nickname  = message.substring(message.indexOf("_to_")+4 , message.length);
    if(users[nickname]){
     users[nickname].emit('got_msg' , msg+"_from_"+this.nickname);
     callback(true);
     console.log("message sent to "+nickname+" from "+this.nickname, app.address().port, app.settings.env);
    }
    else{
     callback(false);
    }
    
  });
  
  socket.on("save_msg" , function(message , callback){
    args = message.split("_-|-_");
    var name  = args[0];
    var msg   = args[1];
    var from  = args[2];
    var client = this;
    User.find({nickname : client.nickname} , function(err , result){
      if(!result){
       console.log("ERROR -> "+err, app.address().port, app.settings.env);
       callback(false,"Sorry, could not save the message, try again!");
      }
      else if(result.length == 0){
       callback(false,"Hmmmm, Something is very wrong here... login again please, will you!?");
      }
      else{
        var user = result[0];
        user.archive.push({name : name , content : msg , from : from});
        user.save();
        callback(true,"Message is now in your archive and you can listen to it later.");
      }
    });
  });
  
  socket.on("fetch_msg" , function(name , callback){
    console.log(this.nickname+" is requesting a message -> "+name, app.address().port, app.settings.env);
    User.find({nickname : this.nickname} , function(err , result){
      if(!result){
       console.log("ERROR -> "+err, app.address().port, app.settings.env);
       callback(false,"Error getting your message from server, try again!");
      }
      else if(result.length == 0){
        callback(false,"Hmmmm, Something is very wrong here... login again please, will you!?");
      }
      else{
       var message = result[0].get_message(name);
       if(!message)
          callback(false,"could not find a message with this name.");
       else   
         callback(true,message);
      }
    });
  });
  
   
  socket.on('disconnect', function () {
     delete users[this.nickname];  
     console.log("user has gone disconnected ->"+this.nickname, app.address().port, app.settings.env);  
  });
});


console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


