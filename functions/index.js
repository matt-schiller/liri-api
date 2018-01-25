// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database. 
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
var db = admin.database();

// Dependencies for the assignment
const fs = require("fs");
const Twitter = require("twitter");
const Spotify = require("node-spotify-api");
const request = require("request");

// Function itself - HTTP endpoint
exports.liri = functions.https.onRequest((req, res) => {

	// Grab the text parameter.
	const query = req.query.query;

	// Set operator and specifier
	var countSpaces = query.split(" ").length - 1;
	if (countSpaces > 0) {
		var operator = query.substr(0, query.indexOf(" "));
		var specifier = query.replace(operator+" ","");
	} 
	else {
		var operator = query;
		var specifier = "";
	}
	
	// Log to console
	console.log("Operator: "+operator);
	console.log("Specifier: "+specifier);

	// Create blank output object
	var output = {};

	// Get keys from DB
	var ref = db.ref("keys");
	ref.on("value", function(snapshot){
		var keys = snapshot.val();

		var client = new Twitter({
			consumer_key: keys.twitter["consumer-key"],
			consumer_secret: keys.twitter["consumer-secret"],
			access_token_key: keys.twitter["access-token-key"],
			access_token_secret: keys.twitter["access-token-secret"]
		});

		var spotify = new Spotify({
		  id: keys.spotify["id"],
		  secret: keys.spotify["secret"]
		});

		var omdbKey = keys.omdb;

		function tweets() {
			console.log("-----TWITTER-----");
			client.get("statuses/user_timeline", {count: 20}, function(error, tweets, response) {
				if (error) throw error;
				tweets.forEach(function(element){
					output[tweets.indexOf(element)+1] = element.text;
				});
				sendResult();
			});
		}

		function song() {
			console.log("-----SPOTIFY-----");
			spotify.search({ type: 'track', query: specifier }, function(error, data) {
				if (error) throw error;
				output["Artist(s)"] = data.tracks.items[0].artists[0].name; 
				output["Song"] = data.tracks.items[0].name; 
				output["Preview link"] = data.tracks.items[0]["external_urls"].spotify; 
				output["Album"] = data.tracks.items[0].album.name;
				sendResult();
			});
		}

		function movie() {
			console.log("-----IMDB-----");
			request({url: "http://www.omdbapi.com/?apikey="+omdbKey+"&t="+specifier, json:true}, function (error, response, body) {
				if (error) throw error;
				output["Title"] = body["Title"];
				output["Year"] = body["Year"];
				output["IMDB rating"] = body["Ratings"][0]["Value"];
				output["Rotton Tomatoes rating"] = body["Ratings"][1]["Value"];
				output["Country"] = body["Country"];
				output["Language"] = body["Language"];
				output["Plot"] = body["Plot"];
				output["Actors"] = body["Actors"];
				sendResult();
			});
		}

		function read() {
			console.log("-----DWIS-----");
			fs.readFile('random.txt', 'utf8', (error, data) => {
				if (error) throw error;
				operator = data.substr(0, data.indexOf(','));
				specifier = data.substr(data.indexOf(',')+2, data.length-data.indexOf(',')-3);
				console.log("New operator: "+operator);
				console.log("New specifier: "+specifier);
				song();
			});
		}

		switch(operator) {
			case "my-tweets":
				tweets();
				break;
			case "spotify-this-song":
				song();
				break;
			case "movie-this":
				movie();
				break;
			case "do-what-it-says":
				read();
				break;
		}

		function sendResult() {
			// Send response
			res.status(200).send(output);
		}
	});

});

// node liri.js my-tweets
	// This will show your last 20 tweets and when they were created at in your terminal/bash window.
// node liri.js spotify-this-song '<song name here>'
	// * Artist(s)
	// * The song's name
	// * A preview link of the song from Spotify
	// * The album that the song is from
// node liri.js movie-this '<movie name here>'
	// * Title of the movie.
	// * Year the movie came out.
	// * IMDB Rating of the movie.
	// * Rotten Tomatoes Rating of the movie.
	// * Country where the movie was produced.
	// * Language of the movie.
	// * Plot of the movie.
	// * Actors in the movie.
// node liri.js do-what-it-says
	// It should run `spotify-this-song` for "I Want it That Way," as follows the text in `random.txt`.