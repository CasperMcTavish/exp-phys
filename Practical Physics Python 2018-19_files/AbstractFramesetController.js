/* $Id: AbstractFramesetController.js 3173 2015-08-28 15:20:30Z davemckain $
 *
 * Copyright (c) 2010, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* Abstract base class for JavaScript Controllers that manage
 * how an Organisation Tree or Deployment frameset works.
 *
 * Prerequisites: Logger.js, Utilities.js
 */
function AbstractFramesetController() {}

AbstractFramesetController.prototype = {

    /* Usual Logger */
    _logger: Logger.getLog("AbstractFramesetController"),

    /* Set when frameset's onload handler completes */
    _framesetLoaded: false,

    /* Hash of loaded frames */
    _loadedFrames: new Object(),

    /* Set when tree browser finished loading */
    _isTreeBrowserLoaded: false,

    /* Set when frameset is ready for initial drill down */
    _readyScheduled: false,

    /* Called when the frameset has finished loading, this checks
     * to see whether everything is ready for the initial drill down.
     */
    setFramesetLoaded: function(state) {
        this._logger.debug("Frameset loaded")
        this._framesetLoaded = state;
        this._checkReady();
    },

    /* Called when the tree browser has finished loading, this checks
     * to see whether everything is ready for the initial drill down.
     */
    setFrameLoaded: function(frameId, state) {
        this._logger.debug("Frame " + frameId + " loaded state is " + state);
        this._loadedFrames[frameId] = state;
        this._checkReady();
    },

    /* Called by the content frame when it has finished loading a Node. This should
     * invoke the appropriate update in visual/navigation state of other frames in
     * this frameset, as required.
     */
    nodeLoaded: function(nodeLinkId) {
        Utilities.fail("Subclass must override nodeLoaded()");
    },

    /* Checks whether the required static frames have loaded. If so, a call to
     * _onFramesetReady() is scheduled.
     */
    _checkReady: function() {
        if (this.areFramesLoaded() && !this._readyScheduled) {
            this._logger.debug("All required frames loaded - scheduling call to ready()");
            this._readyScheduled = true;
            window.setTimeout(this._onFramesetReady.bind_(this), 100);
        }
    },

    /* Subclass should implement to decide whether all required frames are loaded and
     * ready.
     */
    areFramesLoaded: function() {
        Utilities.fail("Subclass must override areFramesLoaded()");
        return false;
    },

    /* Subclass should implement to decide whether or not the given Node is part of
     * the enclosing frameset or not.
     */
    containsNode: function() {
        Utilities.fail("Subclass must override containsNode()");
        return false;
    },

    /* Subclass should override to do whatever logic is required once all the frames
     * have loaded.
     */
    _onFramesetReady: function() {
        Utilities.fail("Subclass must override _onFramesetReady()");
    },

    /* Subclass should override to get at the frame which shows the main content  */
    getContentFrame: function() {
        Utilities.fail("Subclass must override getContentFrame()");
    },

    /* Subclass should override to create a permalink to the given Node */
    getPermalink: function(linkId) {
        Utilities.fail("Subclass must override getPermalink()");
    },

    /* Checks whether the content frame is currently blank */
    _isBlank: function() {
        var contentFrame = this.getContentFrame();
        var blankUrlEnd  = "static/views/web/html/blank.html";
        var contentUrl   = contentFrame.location.href;
        var cLength = contentUrl.length;
        var bLength = blankUrlEnd.length;
        this._logger.debug("Content Frame is currently at " + contentUrl);
        /* Check to see whether the content frame URL ends with the blank
         * frame URL. (Though this is not 100% infallible!)
         */
        return cLength>=bLength && contentUrl.substr(cLength-bLength, bLength)==blankUrlEnd;
    }
}

window.getFramesetController = function() {
    Utilities.fail("window.getFramesetController() must be overridden to return an appropriate subclass of AbstractFramesetController");
}
