var SCOPE =  'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata';
var GoogleAuth;

var signInOption = {
    prompt: 'select_account'
};

var gDriveService = {
    /**
     * Initializes the Google API client and starts a listener for the google auth instance.
     */
    initClient: function () {
        gapi.client.init({
            //'apiKey': 'AIzaSyCycJbF6hOWkgmaDNbo8g-02M6Mdb9T1bc',
            'client_id': '27747224096-on9fk0bunivi0pjsnf4tkhkjrnt4cgoi.apps.googleusercontent.com',
            'scope': SCOPE
        }).then(function () {
            GoogleAuth = gapi.auth2.getAuthInstance();

            // Listen for sign-in state changes.
            GoogleAuth.isSignedIn.listen(gDriveService.updateSigninStatus);

            // Handle initial sign-in state. (Determine if user is already signed in.)
            gDriveService.setSigninStatus();

            // Call sign in/out function when user clicks on Login/Logout
            $('#signin-button').click(function() {
                gDriveService.signInWithGoogle();
            });
            $('#signout-button').click(function() {
                gDriveService.signOutFromGoogle();
            });
        }, function(error){
            console.log('Error: ' + JSON.stringify(error));
        });
    },

    signInWithGoogle: function() {
        //User is not signed in. Start Google auth flow.
        if(GoogleAuth.isSignedIn.get()){
            console.log('already signed in');
        }else {
            GoogleAuth.signIn(signInOption);
        }
    },

    signOutFromGoogle: function() {
        // User is authorized and has clicked 'Sign out' button.
        if(GoogleAuth.isSignedIn.get()){
            GoogleAuth.signOut();
            gDriveService.revokeAccess();
            window.location.reload();
        }
    },

    revokeAccess: function() {
        GoogleAuth.disconnect();
    },

    /**
     * Gets the body and the boundary for the request as parameters.
     * Sends the request to upload the file and returns the response.
     * @param requestData
     * @returns request response
     */
    sendUploadRequest: function(requestData){
        return gapi.client.request({
            'path': 'https://www.googleapis.com/upload/drive/v3/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + requestData.boundary + '"'
            },
            'body': requestData.multipartRequestBody
        });
    },

    /**
     * Searches for the token file in google drive and returns it.
     * @returns token file
     */
    getTokenFromDrive: function() {
        return new Promise(function(resolve) {
            var path = '/drive/v3/files/';
            gapi.client.request({
                'path': path,
                'method': 'GET',
                'params': {
                    'maxResults': 1,
                    'spaces': 'appDataFolder',
                    'fields': 'files(id, name, appProperties)',
                    'q': 'appProperties has { key="token" and value="true" }'
                }
            }).then(function(response) {
                    resolve(response.result.files[0]);
            }, function (error){
                console.log('error function'+ JSON.stringify(error));
                resolve(0);
            });
        });
    },

    /**
     *  Gets the bilderrahmen folder as parameter.
     *  Sends GET request to return all image files in the bilderrahmen folder.
     * @param folder
     * @returns all images in bilderrahmen
     */
    listFilesInFolder: function(folder) {
        return new Promise(function(resolve) {
            var path = '/drive/v3/files/';
            gapi.client.request({
                'path': path,
                'method': 'GET',
                'params': {
                    'q': '"' + folder.id + '" in parents and mimeType = "image/jpeg" and trashed = false',
                    'orderBy': 'createdTime',
                    'pageSize': '1000',
                    'fields': 'files(id, name, hasThumbnail, thumbnailLink, description, webViewLink, webContentLink)'
                }
            }).then(function(response) {
                var files = response.result.files;
                if (files && files.length > 0) {
                    resolve(files);
                } else {
                    resolve([]);
                }
            });
        })
    },

    /**
     * Gets an array of files to delete and the current index as parameters.
     * Sends delete request for every file in the array.
     * @param array
     * @param index
     * @returns {the delete request response}
     */
    deletePicture: function(array, index){
        return new Promise(function(resolve){
            resolve(gapi.client.request({
                'path': '/drive/v3/files/' + array[index].id,
                'method': 'DELETE'
            }));
        })
            .then(function() {
                if (index + 1 < array.length) {
                    gDriveService.deletePicture(array, index + 1);
                }else{
                    //TODO: send notification via websockets
                    gDriveService.listFilesInFolder(bilderrahmenfolder).then(function(count) {
                        fileService.updatePiccountLabel(count);
                    })
                }
            });
    },

    deletePictureById: function(id){
        return new Promise(function(resolve){
            resolve(gapi.client.request({
                'path': '/drive/v3/files/' + id,
                'method': 'DELETE'
            }));
        }).then(function() {
            gDriveService.listFilesInFolder(bilderrahmenfolder).then(function(count) {
                fileService.updatePiccountLabel(count);
            });
            webSocketService.sendFilesyncNotification([], [id])
        })
    },

    /**
     * If there is no bilderrahmen folder in google drive root, this method creates it and returns the created folder.
     * @returns {bilderrahmen folder}
     */
    createBilderrahmenFolder: function (){
        return new Promise(function(resolve){
            var folderMetaData = {
                mimeType: 'application/vnd.google-apps.folder',
                name: 'bilderrahmen'
            };
            gapi.client.request({
                'path': 'https://www.googleapis.com/drive/v3/files',
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': folderMetaData
            }).then(function(response) {
                resolve(response.result);
            });
        })
    },

    /**
     * Searches for the bilderrahmen folder in google drive rot.
     * If the folder exists, it is returned. If not, createBilderrahmenFolder function is called.
     * @returns {bilderrahmen folder}
     */
    getBilderrahmenFolder: function() {
        return new Promise(function(resolve) {
            gapi.client.request({
                'path': '/drive/v3/files/',
                'method': 'GET',
                'params': {
                    'q': '"root" in parents and mimeType = "application/vnd.google-apps.folder"'
                }
            }).then(function(response) {
                var files = response.result.files;
                var bilderrahmenFolderFound = false;
                //search for bilderrahmen folder
                if (files && files.length > 0) {
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        if(file.name.localeCompare('bilderrahmen') === 0) {
                            bilderrahmenFolderFound = true;
                            resolve(file);
                        }
                    }//if bilderrahmen folder doesn't exist, create it
                    if(!bilderrahmenFolderFound){
                        bilderrahmenFolderFound = true;
                        createBilderrahmenFolder().then(function(folder){
                            resolve(folder);
                        })
                    }
                }//if bilderrahmen folder doesn't exist, create it
                if(!bilderrahmenFolderFound){
                    gDriveService.createBilderrahmenFolder().then(function(folder){
                        resolve(folder);
                    })
                }
            }, function(error) {
                //reauthenticate if token expires
                if(error.status === 401) {
                    GoogleAuth.currentUser.get().reloadAuthResponse();
                    location.reload();
                }

            });
        })
    },

    /**
     * handles login and logout to show/hide html elements
     */
    setSigninStatus: function () {
        var user = GoogleAuth.currentUser.get();
        var isAuthorized = user.hasGrantedScopes(SCOPE);
        if (isAuthorized) {
            $('#signin-button').css('display', 'none');
            $('#signout-button').css('display', 'inline-block');
            $('#chooseFileContainer').css('display', 'inline-block');
            $('#piccount').css('display', 'inline-block');
            $('#h2_upload').css('display', 'inline-block');
            $('#h2_delete').css('display', 'inline-block');
            fileService.countFilesInFolder();
        } else {
            $('#signin-button').css('display', 'inline-block');
            $('#signout-button').css('display', 'none');
            $('#chooseFileContainer').css('display', 'none');
            $('#piccount').css('display', 'none');
            $('#h2_upload').css('display', 'none');
            $('#h2_delete').css('display', 'none');
            $('#upload-submit').css('display', 'none');
            fileService.clearPictures();
            fileService.clearThumbnails();
        }
    },

    /**
     * Updates the users signin status
     * @returns isAuthorized
     */
    updateSigninStatus: function () {
        gDriveService.setSigninStatus();
    },

    /**
     * Checks if the user is autohrized
     * @returns isAuthorized
     */
    isUserSignedIn: function(){
        var user = GoogleAuth.currentUser.get();
        var isAuthorized = user.hasGrantedScopes(SCOPE);
        return isAuthorized;
    }

};