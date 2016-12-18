// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};

// added during app creation. this will automatically login to
// ACS for your application and then fire an event (see below)
// when connected or errored. if you do not use ACS in your
// application as a client, you should remove this block
(function() {
	var ACS = require('ti.cloud'),
	    env = Ti.App.deployType.toLowerCase() === 'production' ? 'production' : 'development',
	    username = Ti.App.Properties.getString('acs-username-' + env),
	    password = Ti.App.Properties.getString('acs-password-' + env);

	// if not configured, just return
	if (!env || !username || !password) {
		return;
	}
	/**
	 * Appcelerator Cloud (ACS) Admin User Login Logic
	 *
	 * fires login.success with the user as argument on success
	 * fires login.failed with the result as argument on error
	 */
	ACS.Users.login({
		login : username,
		password : password,
	}, function(result) {
		if (env === 'development') {
			Ti.API.info('ACS Login Results for environment `' + env + '`:');
			Ti.API.info(result);

			var deviceToken = null;
			// Check if the device is running iOS 8 or later
			if (Ti.Platform.name == "iPhone OS" && parseInt(Ti.Platform.version.split(".")[0]) >= 8) {

				// Wait for user settings to be registered before registering for push notifications
				Ti.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {

					// Remove event listener once registered for push notifications
					Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush);

					Ti.Network.registerForPushNotifications({
						success : deviceTokenSuccess,
						error : deviceTokenError,
						callback : receivePush
					});
				});

				// Register notification types to use
				Ti.App.iOS.registerUserNotificationSettings({
					types : [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
				});
			}

			// For iOS 7 and earlier
			else {
				Ti.Network.registerForPushNotifications({
					// Specifies which notifications to receive
					types : [Ti.Network.NOTIFICATION_TYPE_BADGE, Ti.Network.NOTIFICATION_TYPE_ALERT, Ti.Network.NOTIFICATION_TYPE_SOUND],
					success : deviceTokenSuccess,
					error : deviceTokenError,
					callback : receivePush
				});
			}
			// Process incoming push notifications
			function receivePush(e) {
				console.log('Received push: ' + JSON.stringify(e));
			}

			// Save the device token for subsequent API calls
			function deviceTokenSuccess(e) {
				console.log('deviceTokenSuccess: ' + JSON.stringify(e));
				deviceToken = e.deviceToken;
			}

			function deviceTokenError(e) {
				console.log('Failed to register for push notifications! ' + e.error);
			}

		}
		if (result && result.success && result.users && result.users.length) {
			Ti.App.fireEvent('login.success', result.users[0], env);

		} else {
			Ti.App.fireEvent('login.failed', result, env);
		}
	});

})();

