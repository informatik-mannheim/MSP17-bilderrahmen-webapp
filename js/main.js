gapi.load('client:auth2', gDriveService.initClient);

var uploadForm = document.getElementById('upload-form');
var inputField = document.getElementById('upload-files');

/**
 * Event listener looking for changes in the file input.
 */
inputField.addEventListener('change', function() {
    fileService.clearPictures();
    var uploadFiles = document.getElementById('upload-files').files;
    gDriveService.getTokenFromDrive().then(function(token) {
        if(token!==0){
            $('#upload-submit').css('display', 'inline-block');
            for(var i = 0, file; file = uploadFiles[i]; ++i) {
                fileService.readPictureFile(file);
            }
        } else {
            $("#no-token-alert").fadeTo(8000, 500).slideUp(500, function(){
                $("#no-token-alert").slideUp(500);
            });
        }
    })
});

/**
 * Event listener called when the upload files button is pressed.
 */
uploadForm.addEventListener('submit', function(e) {
    var pictureArray = document.getElementById('upload-files').files;
    e.preventDefault();
    //upload selected files sequentially because of the user rate limit of google drive
    var isAuthorized = GoogleAuth.currentUser.get().hasGrantedScopes(SCOPE);
    if(isAuthorized && GoogleAuth.isSignedIn.get()){
        progressbar.showBar();
        progressbar.updateStatus(0);
        progressbar.setMax(pictureArray.length);
        $('#gallery').hide();
        $('#upload-submit').css('display', 'none');
        $('#chooseFileContainer').css('display', 'none');
        $("#start-alert").fadeTo(2000, 500).slideUp(500, function(){
            $("#start-alert").slideUp(500);
        });
        fileService.uploadFiles(0, pictureArray, []);
    } else {
        alert('You need to log in');
    }
});

/**
 * Event listener called when a tab is clicked
 */
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var target = $(e.target).attr("href") // activated tab
    if(target === "#tab2" && gDriveService.isUserSignedIn()) {
        fileService.clearThumbnails();
        fileService.addAllThubnailsToGallery();
    }
});

