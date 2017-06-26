var fileService = {
    stripSpaces: function(string){
        return string.replace(/\s/g, '');
    },

    /**
     * Gets a picture file and its description from the input field as parameters.
     * The compress method of the compressor.js is called with the image file.
     * Returns the picture file, its description and the compressed file as base64 string.
     * @param file
     * @param fileDesc
     * @returns {fileData}
     */
    compressFile: function(file, fileDesc){
        return new Promise(function(resolve) {
            var readerDataURL = new FileReader();
            readerDataURL.readAsDataURL(file);
            readerDataURL.onload = function(e) {
                var image = new Image();
                image.src = readerDataURL.result;
                var compressedFile = new Image();
                compressedFile.src =  jic.compress(image, 50, "jpg").src;
                var compressedBase64String = compressedFile.src.split(",")[1];
                var fileData = {
                    file: file,
                    fileDesc: fileDesc,
                    compressedBase64String: compressedBase64String
                };
                resolve(fileData);
            }
        })
    },

    /**
     * Gets the picture, the entered description of the input field and the file as base64 string as input.
     * Returns the body for the multi part request and the boundary needed for the request.
     * @param fileData
     * @returns {requestData}
     */
    buildUploadRequest: function(fileData) {
        return new Promise(function(resolve) {
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";
            var reader = new FileReader();
            var contentType = fileData.file.type || 'application/octet-stream';
            var metadata = {
                'name': fileService.stripSpaces(fileData.file.name),
                'mimeType': contentType,
                'description': fileData.fileDesc,
                'appProperties': {
                    'bilderrahmen': true
                },
                'parents': [bilderrahmenfolder.id]
            };
            reader.readAsBinaryString(fileData.file);
            reader.onload = function () {
                var multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: ' + contentType + '\r\n' +
                    'Content-Transfer-Encoding: base64\r\n' +
                    '\r\n' +
                    fileData.compressedBase64String +
                    close_delim;
                var requestData = {
                    multipartRequestBody: multipartRequestBody,
                    boundary: boundary
                };
                resolve(requestData);
            }
        });
    },

    /**
     * If there are more than 200 pictures in the bilderrahmen folder,
     * the deletePicture function of the GDriveService is called with the oldest files above the limit.
     * @returns {deletedFiles}
     */
    gatherAndDeleteOldestFiles: function(){
        gDriveService.listFilesInFolder(bilderrahmenfolder).then(function(pictureArray){
            var array = [];
            for (var i = 0; i<pictureArray.length-200;i++){
                array.push(pictureArray[i]);
            }
            if(array.length > 0){
                gDriveService.deletePicture(array, 0);
            }
            //collect IDs of the deleted files and return them
            var deletedFiles = [];
            for(var i = 0; i < array.length; i++) {
                deletedFiles.push(array[i].id);
            }
            return deletedFiles;
        })
    },

    /**
     * Counts the picture files in the bilderrahmen folder and updates the piccount label.
     */
    countFilesInFolder: function() {
        gDriveService.getBilderrahmenFolder().then(function(folder) {
            bilderrahmenfolder = folder;
            gDriveService.listFilesInFolder(folder).then(function(count) {
                fileService.updatePiccountLabel(count);
            })
        });
    },

    /**
     * Load all Thumbnails from Google Drive and display them in the delete_gallery
     */
    addAllThubnailsToGallery: function () {
        gDriveService.getBilderrahmenFolder().then(function(folder) {
            gDriveService.listFilesInFolder(folder).then(function (files) {
                for (var i = 0; i < files.length; i++) {
                    fileService.insertThumbnail(files[i], i);
                }
                //delete button functionallity for pictures
                $('img.close').on('click', function (e) {
                    var parent = $(this);
                    e.preventDefault();
                    var id = $(this).next().attr('id');
                    var parent_div = $('#' + id).parent('div').parent('div');
                    $('#delete_button').one('click', function(e) {
                        parent.next().fadeTo(300, 0, function () {
                            parent_div.remove();
                        });
                        gDriveService.deletePictureById(id);
                    });
                });
            });
        });
    },

    /**
     * Gets a picture and its filename as a parameter and appends the picture to the gallery container.
     * @param picture
     * @param filename
     */
    insertPicture: function(picture, filename) {
        var pic_element =
            '<div class="col-lg-3 col-md-4 col-sm-6 col-xs-12" style="margin-top: 10px; height: 300px; width: 350px">' +
                '<img src=' + picture + ' height="225px" width="300px">' +
                '<figcaption style="margin-top: 10%">' +
                    '<input class="form-control" type="text" maxlength="140" id="' + filename +
                        '" placeholder="Bildbeschreibung hier einfügen" style="text-align: center; width: 300px; display: inline">' +
                '</figcaption>'+
            '</div>';
        $("#gallery").append('', pic_element);
    },

    /**
     * Gets a picture and its index in the gallery as a parameter and appends the picture to the gallery container.
     * @param file
     * @param index
     */
    insertThumbnail: function(file, index) {
        var pic_element =
            '<div class="col-lg-3 col-md-4 col-sm-6 col-xs-12 thumbnail-div" style=" margin-top: 10px;" id=' + index + '>' +
                '<div class="img-wrap" style="height: 225px; width: 300px">' +
                    '<img class="close" src="images/trashbin.png" width="15%" data-toggle="modal" data-target="#confirm-delete">' +
                    '<img src=' + (file.hasThumbnail ? file.thumbnailLink : file.webViewLink) + ' height="225px" width="300px" id=' + file.id + '>' +
                '</div>' +
            '</div>';
        $("#gallery_delete").append('', pic_element);
    },

    /**
     * Removes all pictures from the gallery.
     */
    clearPictures: function() {
        $("#gallery").empty();
    },

    /**
     * Removes all pictures from the gallery_delete.
     */
    clearThumbnails: function() {
        $("#gallery_delete").empty();
    },

    /**
     * Reads the image file parameter and calls the insertPicture function afterwards.
     * @param file
     */
    readPictureFile: function(file){
        var filename = fileService.stripSpaces(file.name);
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {
            fileService.insertPicture(e.target.result, filename);
        }
    },

    /**
     * Gets all pictures from the file input as an array and the current index as parameteres.
     * Recursive to upload all pictures sequentially.
     * Updates the progress bar and displays the success alert.
     * After the last file, the gallery is cleared and the piccount label updated.
     * @param index
     * @param pictureArray
     */
    uploadFiles: function (index, pictureArray, createdFiles){
        var fileDesc = document.getElementById(fileService.stripSpaces(pictureArray[index].name)).value;
        //promise chain that uploads the current file
        fileService.compressFile(pictureArray[index], fileDesc)
            .then(result => Promise.all([fileService.buildUploadRequest(result)]))
            .then(function([requestData]) {
            return gDriveService.sendUploadRequest(requestData);
        }).then(function(file) {
            //recursive call with next file
            if(index+1 < pictureArray.length){
                createdFiles.push(file.result.id);
                progressbar.updateStatus((((index+1)/pictureArray.length)*100));
                fileService.uploadFiles(index+1, pictureArray, createdFiles);
            } else{
                createdFiles.push(file.result.id);

                //handle progressbar
                progressbar.updateStatus(100);
                progressbar.slideUp(2000);

                //clear form
                fileService.clearPictures();
                document.getElementById('upload-files').value="";
                $('#gallery').show();
                $('#chooseFileContainer').css('display', 'inline-block');

                //delete oldest if more than 200 files in folder
                var deletedFiles = fileService.gatherAndDeleteOldestFiles();
                gDriveService.listFilesInFolder(bilderrahmenfolder).then(function(count) {
                    fileService.updatePiccountLabel(count);
                });
                $("#success-alert").fadeTo(4000, 500).slideUp(500, function(){
                    $("#success-alert").slideUp(500);
                });

                //send notification to backend
                webSocketService.sendFilesyncNotification(createdFiles, deletedFiles);
            }
        });
    },

    updatePiccountLabel: function(count){
        $('#piccount').html(count.length + "/200 Bilder in Google Drive");
    }
};