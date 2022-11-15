import mongoose from 'mongoose';

const Schema = mongoose.Schema;

// Define the schema for reviews
const conversationSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
        required: true,
    },

});

conversationSchema.statics.findMine = function (user) {
    return this.find().where('_id').in(user.conversations)
};


// Create the model from the schema and export it
export default mongoose.model('Conversation', conversationSchema);