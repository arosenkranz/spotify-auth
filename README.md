# spotify-auth

> Steps to use

* Go to [Spotify's Developer Page](https://developer.spotify.com/dashboard/login) and create a new application

* Click on that new application and `Edit Settings`, which will open a modal

* Enter a `Redirect Uri` to something along the lines of `http://localhost:8000` (for development)... You will need to change this to your deployed site's address when it enters production.

* Enter that same redirect uri in `script.js` at the `spotifyLogin` function and copy/paste your `Client_id` from the application to the top line of `script.js`

* To run locally, download `Live Server` from the VSCode Extensions tab and click `Go Live` to start server
