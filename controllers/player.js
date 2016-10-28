(function() {

	var module = angular.module('PlayerApp');
	var eventDispatched = false;		// temporizador para leap

	module.controller('PlayerController', function($scope, $rootScope, Auth, API, PlayQueue, Playback, $location) {
		$scope.view = 'welcome';
		$scope.profileUsername = Auth.getUsername();
		$scope.playlists = [];
		$scope.playing = false;
		$scope.progress = 0;
		$scope.duration = 4000;
		$scope.trackdata = null;
		$scope.currenttrack = '';

		function updatePlaylists() {
			if ($scope.profileUsername != '') {
				API.getPlaylists(Auth.getUsername()).then(function(items) {
					$scope.playlists = items.map(function(pl) {
						return {
							id: pl.id,
							name: pl.name,
							uri: pl.uri,
							username: pl.owner.id,
							collaborative: pl.collaborative,
							'public': pl['public']
						};
					});
				});
			}
		}

		updatePlaylists();

		// subscribe to an event
		$rootScope.$on('playlistsubscriptionchange', function() {
			updatePlaylists();
		});

		$scope.logout = function() {
			// do login!
			console.log('do logout...');
			Auth.setUsername('');
			Auth.setAccessToken('', 0);
			$scope.$emit('logout');
		};

		$scope.resume = function() {
			Playback.resume();
		};

		$scope.pause = function() {
			Playback.pause();
		};

		$scope.next = function() {
			PlayQueue.next();
			Playback.startPlaying(PlayQueue.getCurrent());
		};

		$scope.prev = function() {
			PlayQueue.prev();
			Playback.startPlaying(PlayQueue.getCurrent());
		};

		$scope.queue = function(trackuri) {
			PlayQueue.enqueue(trackuri);
		};

		$scope.showhome = function() {
			console.log('load home view');
		};

		$scope.showplayqueue = function() {
			console.log('load playqueue view');
		};

		$scope.showplaylist = function(playlisturi) {
			console.log('load playlist view', playlisturi);
		};

		$scope.query = '';

		$scope.loadsearch = function() {
			console.log('search for', $scope.query);
			$location.path('/search').search({ q: $scope.query }).replace();
		};


		$scope.volume = Playback.getVolume();

		$scope.changevolume = function() {
			Playback.setVolume($scope.volume);
		};

		$scope.changeprogress = function() {
			Playback.setProgress($scope.progress);
		};

		$rootScope.$on('login', function() {
			$scope.profileUsername = Auth.getUsername();
			updatePlaylists();
		});

		$rootScope.$on('playqueuechanged', function() {
			console.log('PlayerController: play queue changed.');
			// $scope.duration = Playback.getDuration();
		});

		$rootScope.$on('playerchanged', function() {
			console.log('PlayerController: player changed.');
			$scope.currenttrack = Playback.getTrack();
			$scope.playing = Playback.isPlaying();
			$scope.trackdata = Playback.getTrackData();
		});

		$rootScope.$on('endtrack', function() {
			console.log('PlayerController: end track.');
			$scope.currenttrack = Playback.getTrack();
			$scope.trackdata = Playback.getTrackData();
			$scope.playing = Playback.isPlaying();
			PlayQueue.next();
			Playback.startPlaying(PlayQueue.getCurrent());
			$scope.duration = Playback.getDuration();
		});

		$rootScope.$on('trackprogress', function() {
			console.log('PlayerController: trackprogress.');
			$scope.progress = Playback.getProgress();
			$scope.duration = Playback.getDuration();
		});

		Leap.loop({enableGestures: true}, function(frame) {
			if(frame.valid && frame.gestures.length > 0){
				frame.gestures.forEach(function(gesture) {
					switch (gesture.type){
						case "keyTap":
							if (Playback.isPlaying()) {
								Playback.pause();
							} else {
								Playback.resume();
							}
						break;
						case "swipe":
							//Classify swipe as either horizontal or vertical
							var isHorizontal = Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]);
							//Classify as right-left
							if(isHorizontal && !eventDispatched){
								eventDispatched = true
								if(gesture.direction[0] > 0){
									PlayQueue.next();
									Playback.startPlaying(PlayQueue.getCurrent());
								} else {
									PlayQueue.prev();
									Playback.startPlaying(PlayQueue.getCurrent());
								}
							}
							window.setTimeout(function() {
                        		eventDispatched = false;
							}, 300);
						break;
						case "circle":
							console.log("Circle Gesture");
						break;
						case "screenTap":
							console.log("Screen Tap Gesture");
						break;
					}
				});
			}
        });
	});

})();
