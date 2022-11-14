//create Schema
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define a schema for comment
const pictureSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	creator: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	path: {
		type: String,
		required: true,
	},
	activity: {
		type: Schema.Types.ObjectId,
		ref: 'Activity',
		required: true,
	},
	mimetype: {
		type: String,
		required: true,
	},
	size: {
		type: Number,
		required: true,
	},
	createAt: {
		type: Date,
		required: true,
	},
});

//create model
export default mongoose.model('Picture', pictureSchema);