//create schema
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
//Define a schema for activity_user
const activity_userSchema = new Schema({
	activity: {
		type: Schema.Types.ObjectId,
		ref: 'Activity',
		required: true,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	inscription: {
		type: Date,
		required: true,
	},
});
//Export the model
export default mongoose.model('Activity_User', activity_userSchema);