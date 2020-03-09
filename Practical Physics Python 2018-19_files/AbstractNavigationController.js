/* $Id: AbstractNavigationController.js 2961 2010-01-05 15:59:17Z davemckain $
 *
 * Copyright (c) 2010, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* AbstractNavigationController is an abstract base class that
 * the navigation frames for Organisation Tree and Deployment
 * framesets should extend.
 *
 * Prerequisites: Logger.js, Utilities.js
 */
function AbstractNavigationController() {}

AbstractNavigationController.prototype = {

    isInControllerFrameset: function() {
        return parent!=null && parent!=window && parent.getFramesetController!=null;
    },

    getFramesetController: function() {
        if (this.isInControllerFrameset()) {
            return parent.getFramesetController();
        }
        return null;
    },

    selectNode: function(aElement, linkId, anchor) {
        /* Subclass should override. Return 'false' if it wants
         * to override default link behaviour, 'true' otherwise.
         */
        Utilities.fail("Subclass should override selectNode()");
        return true;
    },

    selectNodeAsPopup: function(aElement, linkId, anchor) {
        /* Subclass should override. Return 'false' if it wants
         * to override default link behaviour, 'true' otherwise.
         */
        return true;
    },

    selectExternalResource: function(url) {
        /* Subclass should override. Return 'false' if it wants
         * to override default link behaviour, 'true' otherwise.
         */
        return true;
    }
}

window.getNavigationController = function() {
    Utilities.fail("window.getNavigationController() must be overridden to return an appropriate subclass of AbstractNavigationController");
}
