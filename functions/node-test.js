// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database. 
const admin = require('firebase-admin');

// Dependencies for the assignment
const fs = require("fs");
const Twitter = require("twitter");
const Spotify = require("node-spotify-api");
const request = require("request");

// Get values
var operator = process.argv[2];
var specifier = process.argv[3];
var output = {};
// console.log(operator, specifier);

var client = new Twitter({
	consumer_key: "6UZRasW93ZJZZIc7rdP0muZU6",
	consumer_secret: "RQ76KkUXWViV5I0z876C3zcJ5W8Nia0Wcv6pnLEoHv8OLFAhuF",
	access_token_key: "733094063637856256-8fjww88kxWfiuMSEJpJNFPS9cF8lkkD",
	access_token_secret: "fVCUSxulEn8VIu0mFfGdcfuKscDiZetruE8cwRNrEPbip"
});

var spotify = new Spotify({
  id: "a1c7ae71bb7f40d5ad7e634314b74d36",
  secret: "a1a60172ec9d46618a0a857101cadfa7"
});

var omdbKey = "cb0655ad";

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
		// console.log(body);
		// console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
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
		console.log(data);
		operator = data.substr(0, data.indexOf(','));
		specifier = data.substr(data.indexOf(',')+2, data.length-data.indexOf(',')-3);
		console.log(operator);
		console.log(specifier);
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
	console.log(output);
}



// YES node liri.js my-tweets
	// This will show your last 20 tweets and when they were created at in your terminal/bash window.
// YES node liri.js spotify-this-song '<song name here>'
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