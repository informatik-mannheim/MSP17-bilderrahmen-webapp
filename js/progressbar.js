var progressbar = {

    /**
     * Updates the status bar. The width of the progressbar will be changed.
     * Progress must be given as percentage.
     * @param progress
     */
    updateStatus: function(progress) {
        $('#progressbar').css('width', progress + "%");
    },

    /**
     * Hides the statusbar after the given time. The bar will be hidden with a fade effect.
     * @param milliseconds
     */
    slideUp: function(milliseconds) {
        $('#progressDiv').fadeTo(milliseconds, 500).slideUp(500, function(){
            $("#progressDiv").slideUp(500);
        });
    },

    /**
     * Displays the statusbar.
     */
    showBar: function() {
        $('#progressDiv').show();
    },

    /**
     * Sets the maximum value of the pogressbar.
     * @param maxvalue
     */
    setMax: function(maxvalue) {
        $('#progressbar').attr('aira-valuemax', maxvalue);
    }
};