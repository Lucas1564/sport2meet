import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as config from '../config.js';
const Schema = mongoose.Schema;
// Define the schema for users
const userSchema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true
	},
	firstname: {
		type: String,
		required: true,
		minlenght: [3, "Firstname is too short"],
		maxlenght: 20
	},
	lastname: {
		type: String,
		required: true,
		minlenght: [3, "Lastname is too short"],
		maxlenght: 20
	},
	passwordHash: {
		type: String,
	},
	registrationDate: {
		type: Date,
		default: Date.now
	},
	role: {
		type: String,
		enum: ['user', 'admin'],
		default: 'user'
	}
});

userSchema.virtual('password');

userSchema.pre('save', async function () {
	if (this.password) {
		const passwordHash = await bcrypt.hash(this.password, config.bcryptCostFactor);
		this.passwordHash = passwordHash;
	}
});

userSchema.set("toJSON", {
	transform: transformJsonUser
});

function transformJsonUser(doc, json, options) {
	// Remove the hashed password from the generated JSON.
	delete json.passwordHash;
	delete json.__v;
	json.id = json._id;
	delete json._id;
	return json;
}
// Create the model from the schema and export it
export default mongoose.model('User', userSchema);
