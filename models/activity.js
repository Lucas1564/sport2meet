//create schema
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

//Define a schema for activity
const activitySchema = new Schema({
	description: {
		type: String,
		required: true,
	},
	sport: {
		type: String,
		required: true,
		enum: ['Course', 'Vélo', 'Natation', 'Randonnée', 'Ski', 'Football', 'Basketball', 'Tennis', 'Volleyball', 'Baseball', 'Football-American', 'Golf', 'Hockey', 'Rugby', 'Boxe', 'Arts Martiaux', 'Yoga', 'Pilates', 'Dance', 'Fitness', 'Crossfit', 'Autre'],
	},
	address: {
		type: String,
		required: true,
	},
	npa: {
		type: Number,
		required: true,
	},
	locality: {
		type: String,
		required: true,
	},
	players: {
		type: Number,
		required: true,
	},
	datetime: {
		type: Date,
		required: true,
	},
	type: {
		type: String,
		required: true,
		enum: ['Evénement', 'Tournoi', 'Entraînement', 'Autre'],
	},
	pictures: {
		type: String,
	},
	creator: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	location: {
		type: {
			type: String,
			enum: ['Point'],
			default: 'Point',
			required: true,
		},
		coordinates: {
			type: [Number],
			required: true,
		},
	},
});

activitySchema.index({
	location: '2dsphere'
});

// Validate a GeoJSON coordinate array
activitySchema.path('location.coordinates').validate(function (value) {
	return Array.isArray(value) && value.length === 2 && !isNaN(value[0]) && !isNaN(value[1]);
}, 'Invalid coordinates');

//Export the model
export default mongoose.model('Activity', activitySchema);