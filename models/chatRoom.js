var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var chatRoomSchema = new Schema( {
    
    userCodes: [String],
    chats: [{ type: Schema.Types.ObjectId, ref: 'chat' }]

});

module.exports = mongoose.model('chatRoom', chatRoomSchema);