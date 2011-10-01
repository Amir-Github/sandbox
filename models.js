var crypto = require('crypto');

//////////////////creating the models here
function create_models(Schema, mongoose ,ObjectId){

  var Message = new Schema({
     name    : { type : String , index : true}
   , content : String
   , from    : String
   , date    : {type: Date , default: Date.now}
  });
  
  var User = new Schema({
      nickname : {type : String , required: true, index: { unique: true, sparse: true } }  
    , password : {type : String , required: true , set: function (value) {
                                                            this.salt = this.makeSalt();
                                                            return this.encrypt(value);
                                                         }
                 }
    , salt     : {type : String , default: "chatusic"}                                                      
    , archive  : [Message]
    
  });
 
 User.methods = {
                   encrypt : function(string) {
                    return crypto.createHmac('sha1', this.salt).update(string).digest('hex');
                   } 
                 , authenticate: function(password) {
                    return this.encrypt(password) === this.password;
                   }
                 , makeSalt: function() {
                    return "chatusic";
                   }
                 , get_message: function(name){
                     for(index in this.archive){
                       if(this.archive[index]["name"] == name)
                         return this.archive[index]["content"];
                      }   
                    return false;     
                   } 
                };
 
 
 mongoose.model('User', User);
}
///////////////////////

/////////////exporting the function so it can be easily called from external scripts
module.exports.create_models = create_models;
