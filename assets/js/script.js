const spotify_CLIENT = "3ad7e8dcc3bf4076b4b8ec6bb60f4e10";

let stateKey = 'spotify_auth_state';

// on load, try to pull access_token from URL parameters
// localhost:8000?access_token=[token]&state=[state]
const params = getHashParams();
console.log(params);

// save access_token, state, and stored state into variables
let access_token = params.access_token,
  userId = "",
  playerId = "",
  state = params.state,
  storedState = localStorage.getItem(stateKey);

/**
 * Obtains parameters from the hash of the URL
 * @return Object
 */
// NO NEED TO WORRY ABOUT THIS
function getHashParams() {
  const hashParams = {};
  let e,
    r = /([^&;=]+)=?([^&;]*)/g,
    q = window
      .location
      .hash
      .substring(1);
  while (e = r.exec(q)) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
// NO NEED TO WORRY ABOUT THIS
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// if there's an access_token and state is either null OR doesn't equal stored
// state, then let user know there's an issue with authentication
if (access_token && (state == null || state !== storedState)) {
  console.log("You need to login.");
  spotifyLogin();
} else {

  // if authentication is successful, remove item from localStorage
  localStorage.removeItem(stateKey);
  // if there's an access token, get user information
  if (access_token) {
    $
      .ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
          'Authorization': 'Bearer ' + access_token
        }
      })
      .then(function (response) {
        console.log(response);
        $("#login-button").hide();

        userId = response.id;
        $("#profile-info").html(`<h3>${response.display_name}</h3>`);
        // <img class="img-fluid" src="${response.images[0].url}"/>
      });
  }
}

// turn on spotify player
window.onSpotifyWebPlaybackSDKReady = () => {

  const token = getHashParams().access_token;

  const player = new Spotify.Player({
    name: 'Web Playback SDK Quick Start Player',
    getOAuthToken: cb => {
      cb(token);
    }
  });

  // Error handling
  player.addListener('initialization_error', ({message}) => {
    console.error(message);
  });
  player.addListener('authentication_error', ({message}) => {
    console.error(message);
  });
  player.addListener('account_error', ({message}) => {
    console.error(message);
  });
  player.addListener('playback_error', ({message}) => {
    console.error(message);
  });

  // Playback status updates
  player.addListener('player_state_changed', state => {
    // console.log(state);
  });

  // Ready
  player.addListener('ready', ({device_id}) => {
    console.log('Ready with Device ID', device_id);
    playerId = device_id;
    setWebPlayer(device_id, access_token);
  });

  // Not Ready
  player.addListener('not_ready', ({device_id}) => {
    console.log('Device ID has gone offline', device_id);
  });

  // Connect to the player!
  player.connect();
};

// LOG INTO SPOTIFY
function spotifyLogin() {
  const client_id = spotify_CLIENT; // Your client id
  const redirect_uri = (location.hostname === "localhost") ? "http://localhost:8000" : 'https://alexrosenkranz.github.io/spotify-auth'; 

  // generate random state key
  const state = generateRandomString(16);

  // set state in localStorage (will read when we get it back)
  localStorage.setItem(stateKey, state);
  // Set scope for authentication privileges
  const scope = 'streaming user-read-birthdate user-read-private user-read-email user-read-playba' +
      'ck-state user-modify-playback-state';

  // build out super long url
  let url = 'https://accounts.spotify.com/authorize';
  url += '?response_type=token';
  url += '&client_id=' + encodeURIComponent(client_id);
  url += '&scope=' + encodeURIComponent(scope);
  url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
  url += '&state=' + encodeURIComponent(state);

  // change pages and go to the spotify login page
  window.location = url;
}

// SET SPOTIFY WEB PLAYER TO BROWSER
function setWebPlayer(playerId, access_token) {
  $.ajax({
    url: "https://api.spotify.com/v1/me/player",
    method: "PUT",
    data: JSON.stringify({"device_ids": [playerId]}),
      headers: {
        'Authorization': "Bearer " + access_token
      }
    })
    .then(function (response) {
      console.log(response);

    })
    .catch(function (err) {
      console.log(err);
    });
}

// get logged in spotify user's playlists
function getUserPlaylists() {
  $
    .ajax({
      url: "https://api.spotify.com/v1/me/playlists?limit=50",
      method: "GET",
      headers: {
        'Authorization': "Bearer " + access_token
      }
    })
    .then(function (response) {
      console.log(response);
      printPlaylistInfo(response.items);
    })
}

// print out playlist information
function printPlaylistInfo(playlistArray) {
  const $playlistInfo = $("#playlist-info");
  $playlistInfo.empty();
  playlistArray.forEach(function (playlist) {
    $("<button>")
      .addClass("list-group-item d-flex justify-content-between align-items-center playlist-button list-group-item-action")
      .attr({"data-playlist-id": playlist.id, "data-playlist-uri": playlist.uri})
      .text(playlist.name)
      .append(`<span class="badge badge-danger badge-pill">${playlist.tracks.total}</span>`)
      .appendTo($playlistInfo);
  });
}

// get playlist tracks
function selectPlaylist() {
  $(".playlist-button").removeClass("active");
  $(this).addClass("active");
  const playlistId = $(this).attr("data-playlist-id");
  const playlistUri = $(this).attr("data-playlist-uri");
  console.log(playlistId);
  $
    .ajax({
      url: `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
      method: "GET",
      headers: {
        'Authorization': "Bearer " + access_token
      }
    })
    .then(function (response) {
      const trackInfo = response
        .items
        .map(function (trackInfo) {
          return trackInfo.track
        });
      console.log(trackInfo);
      printTrackInfo(trackInfo, playlistUri);
    })
}

// print tracks to page
function printTrackInfo(trackArray, playlistContextUri) {

  const $trackInfo = $("#track-info");
  $trackInfo.empty();

  trackArray.forEach(function (track) {
    const artists = track
      .artists
      .map(artist => artist.name)
      .join(", ");

    $("<button>")
      .addClass("list-group-item d-flex justify-content-between align-items-center track-button list-group-item-action")
      .text(`${artists} - ${track.name}`)
      .attr({"data-track-uri": track.uri, "data-context": playlistContextUri})
      .append(`<span class="badge badge-danger badge-pill">${moment(track.duration_ms, "x").format("mm:ss")}</span>`)
      .appendTo($trackInfo);
  });
}

// select and play track
function selectTrack() {
  $(".track-button").removeClass("active");
  $(this).addClass("active");
  const trackId = $(this).attr("data-track-uri");
  const contextUri = $(this).attr("data-context");
  console.log(trackId);
  $.ajax({
    url: `https://api.spotify.com/v1/me/player/play?device_id=${playerId}`,
    method: "PUT",
    data: JSON.stringify({
      "offset": {
        "uri": trackId
      },
      "context_uri": contextUri
    }),
      headers: {
        'Authorization': "Bearer " + access_token
      }
    })
    .then(function (response) {
      console.log(response);
      setTimeout(getCurrentSong, 1500);
      $("#play-button").attr("data-state", "play")
      $("#play-button > i").removeClass("fa-play").addClass("fa-pause");
    })
    .catch(function (err) {
      console.log(err);
    })
}

// skip song
function nextSong() {
  $
    .ajax({
      url: "https://api.spotify.com/v1/me/player/next",
      method: "POST",
      headers: {
        'Authorization': "Bearer " + access_token
      }
    })
    .then(function (response) {
      console.log(response);
      setTimeout(getCurrentSong, 1500);
      $("#play-button").attr("data-state", "play")
      $("#play-button > i").removeClass("fa-play").addClass("fa-pause");
    });
}

// previous song
function prevSong() {
  $
    .ajax({
      url: "https://api.spotify.com/v1/me/player/previous",
      method: "POST",
      headers: {
        'Authorization': "Bearer " + access_token
      }
    })
    .then(function (response) {
      console.log(response);
      setTimeout(getCurrentSong, 1500);
      $("#play-button").attr("data-state", "play")
      $("#play-button > i").removeClass("fa-play").addClass("fa-pause");
    });
}

// resume playback
function resumeSong() {
  console.log("hi")
  $
    .ajax({
      url: "https://api.spotify.com/v1/me/player/play",
      method: "PUT",
      headers: {
        'Authorization': "Bearer " + access_token
      }
    })
    .then(function (response) {
      console.log(response);
      setTimeout(getCurrentSong, 1500);
      $("#play-button").attr("data-state", "play")
      $("#play-button > i").removeClass("fa-play").addClass("fa-pause");
    });
}

// pause playback
function pauseSong() {
  console.log("hi")
  $
    .ajax({
      url: "https://api.spotify.com/v1/me/player/pause",
      method: "PUT",
      headers: {
        'Authorization': "Bearer " + access_token
      }
    })
    .then(function (response) {
      console.log(response);
      $("#play-button").attr("data-state", "pause")
      $("#play-button > i").removeClass("fa-pause").addClass("fa-play");
    });
}

// get current song info
function getCurrentSong() {
  $.ajax({
    url: "https://api.spotify.com/v1/me/player/currently-playing",
    method: "GET",
    headers: {
      'Authorization': "Bearer " + access_token
    }
  }).then(function(response) {
    const trackUri = response.item.uri;
    console.log(response.item);
    console.log(trackUri)
    $(".track-button").removeClass("active");
    $(`[data-track-uri="${trackUri}"]`).addClass("active");
    $("#track").text(response.item.name);
    $("#artist").text(response.item.artists.map(artist => artist.name).join(", "))
  })
}

// get categories on load to select from
function getCategories() {
  $.ajax({
    url: "https://api.spotify.com/v1/browse/categories",
    method: "GET",
    headers: {
      'Authorization': "Bearer " + access_token
    }
  }).then(function(response) {
    // print to left column select box
    response.categories.items.forEach(function(category) {
      $("<option>")
        .val(category.id)
        .text(category.name)
        .appendTo($("#categories-list"));
    })
  });
}
// when selecting categories for playlists
function selectCategories(event) {

  event.preventDefault();
  // get categories out of select form
  const category_id = $(this).val();

  $.ajax({
    url: `https://api.spotify.com/v1/browse/categories/${category_id}/playlists?limit=50`,
    method: "GET",
    headers: {
      'Authorization': "Bearer " + access_token
    }
  }).then(function(response) {
    console.log(response);
    printPlaylistInfo(response.playlists.items);
  });
}

// get featured playlists
function getFeaturedPlaylists() {
  $.ajax({
    url: "https://api.spotify.com/v1/browse/featured-playlists",
    method: "GET",
    headers: {
      'Authorization': "Bearer " + access_token
    }
  }).then(function(response) {
    console.log(response);
    printPlaylistInfo(response.playlists.items);
  })
}


// BIND CLICK EVENTS
$(document)
  .ready(function () {
    // get categories on load
    getCategories();
    $("#user-playlists").on("click", getUserPlaylists);
    $("#featured-playlists").on("click", getFeaturedPlaylists);
    $("#play-button").on("click", function() {
      // get state of button
      const buttonState = $(this).data("state");

      if (buttonState === "play") {
        pauseSong();
      } 
      else if (buttonState === "pause") {
        resumeSong();
      }
    });
    $("#prev-button").on("click", prevSong);
    $("#next-button").on("click", nextSong);
    $(document).on("click", ".playlist-button", selectPlaylist);
    $(document).on("click", ".track-button", selectTrack);
    // login button to get access token
    $('#login-button').on('click', spotifyLogin);
    $("#categories-list").on("change", selectCategories);
  });