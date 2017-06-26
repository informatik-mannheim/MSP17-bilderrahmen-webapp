var webSocketService = {
    /**
     * Creates a websocket connection to notify the devices if files were uploaded and/or deleted.
     * @param createdFiles
     * @param deletedFiles
     */
    sendFilesyncNotification: function(createdFiles, deletedFiles) {
        gDriveService.getTokenFromDrive().then(function(token) {
            var wsocket = new SockJS('https://' + location.hostname +':8443/websocket');
            var client = Stomp.over(wsocket);
            client.connect({}, function (frame) {
                client.send("/bilderrahmen/filesync/" + token.appProperties.tokenValue, {}, JSON.stringify({
                    createdFiles: createdFiles,
                    deletedFiles: deletedFiles
                }))
            });
        })
    },
}