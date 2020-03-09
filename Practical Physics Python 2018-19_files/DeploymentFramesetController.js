/* $Id: DeploymentFramesetController.js 3173 2015-08-28 15:20:30Z davemckain $
 *
 * Copyright (c) 2010, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* This class represents the main controller for a Web Deployment
 * frameset.
 *
 * Prerequisites: Logger.js, Utilities.js, Core.js, AbstractFramesetController.js
 */
function DeploymentFramesetController() {}

DeploymentFramesetController.prototype = AbstractFramesetController.prototype;
DeploymentFramesetController.override = {

    /* Logger */
    _logger: Logger.getLog("DeploymentFramesetController"),

    /* Current content frame URL */
    _contentFrameUrl: null,

    /* Delay between checks to automatically sychronize nav/bread with main frame */
    _synchronizeDelay: 1000,

    /* @Override */
    areFramesLoaded: function() {
        var isNavFrameLoaded = this._loadedFrames["navigationFrame"]!=null;
        var hasBreadcrumbFrame = $("breadcrumbFrame")!=null;
        var isBreadcrumbFrameLoaded = this._loadedFrames["breadcrumbFrame"]!=null;
        return isNavFrameLoaded && (!hasBreadcrumbFrame || isBreadcrumbFrameLoaded);
    },

    /* @Override */
    containsNode: function(nodeLinkId) {
        return this.getNavigationController().getNode(nodeLinkId)!=null;
    },

    setSize: function() {
        /* Resize breadcrumb frame so that it is just big enough but no more */
        var breadcrumbFrame = this.getBreadcrumbFrame();
        if (breadcrumbFrame!=null) {
            var breadcrumbContent = breadcrumbFrame.document.getElementById("contentContainer");
            var breadcrumbHeight = breadcrumbContent.offsetHeight;
            this._logger.debug("Measured breadcrumb content height as " + breadcrumbHeight);
            $("topFrameset").rows = breadcrumbHeight + ",*";
        }
    },

    /* @Override */
    _onFramesetReady: function() {
        if (this._isBlank()) {
            /* Content frame is blank so do drill down to first Node */
            this._drillDownToFirstNode();
        }
        else {
            /* Content frame is already showing something, so work out what it is and
             * synchronize navigation and breadcrumbs.
             */
            this._synchronizeToContentFrame();
        }
        /* Set up interval to keep things in sync every few moments hereafter */
        setInterval(this._synchronizeToContentFrame.bind_(this), this._synchronizeDelay);
    },

    _synchronizeToContentFrame: function() {
        var newContentFrameUrl = this.getContentFrame().location.href;
        var oldContentFrameUrl = this._contentFrameUrl;
        if (oldContentFrameUrl==null || newContentFrameUrl!=oldContentFrameUrl) {
            this._contentFrameUrl = newContentFrameUrl;
            var navigationController = this.getNavigationController();
            var node = navigationController.getNodeByUrl(newContentFrameUrl);
            if (node!=null) {
                this._logger.info("Content frame is showing " + node.getLinkId() + " updating other frames");
                this.updateNavigationState(node.getLinkId());
            }
        }
    },

    _drillDownToFirstNode: function() {
        /* Work out what to show first. We accept the anchor patterns
         * #tree=<treeLinkId> or #node=<nodeLinkId> to determine what to do first.
         * In their absence, we will load the first Node of the first tree.
         */
        var anchor = location.hash;
        var nodeLinkId = null;
        var navigationController = this.getNavigationController();
        if (anchor.substring(0,1)=='#') {
            anchor = anchor.substring(1);
            this._logger.debug("Anchor " + anchor + " has been supplied; will try to parse");
            if (anchor.substring(0,5)=='tree=') {
                treeLinkId = anchor.substring(5);
                var tree = navigationController.getTree(treeLinkId);
                if (tree!=null) {
                    var firstNode = tree.getFirstActiveNode();
                    if (firstNode==null) {
                        this._logger.warn("There are no active Nodes in this tree. Selecting first tree instead!");
                    }
                    else {
                        nodeLinkId = firstNode.getLinkId();
                    }
                }
                else {
                    this._logger.warn("Could not find tree with link ID " + treeLinkId);
                }
            }
            else if (anchor.substring(0,5)=='node=') {
                nodeLinkId = anchor.substring(5);
                var tree = navigationController.getTreeContaining(nodeLinkId);
                if (tree==null) {
                    this._logger.warn("Could not find Node with link ID " + nodeLinkId + " in any tree");
                    nodeLinkId = null;
                }
                else {
                    /* Make sure Node is active */
                    var node = tree.getNode(nodeLinkId);
                    if (!node.isActive()) {
                        this._logger.warn("Selected Node is not active");
                        nodeLinkId = null;
                    }
                }
            }
        }
        if (nodeLinkId==null) {
            /* Will drill down to first active Node in first tree */
            var firstTree = navigationController.getFirstTree();
            if (firstTree==null) {
                Utilities.fail("No trees in this deployment!");
            }
            var firstNode = firstTree.getFirstActiveNode();
            if (firstNode==null) {
                Utilities.fail("No active Node in first tree in deployment");
            }
            nodeLinkId = firstNode.getLinkId();
        }
        this._logger.info("Will drill down to Node having Link ID " + nodeLinkId);
        this.fireSelectionDownwards(nodeLinkId);
    },

    /* Causes a new selection to be made in the frameset, firing downwards to the
     * content frame and updating the breadcrumb and navigation frames as appropriate.
     */
    fireSelectionDownwards: function(nodeLinkId, anchor) {
        /* Update navigation and breadcrumbs */
        this.updateNavigationState(nodeLinkId);

        /* Update content frame. We can just take the URL from the navigation frame
         * as this controller and the navigation frame are at the same level in the
         * URL hierarchy. This is easier than things used to be...
         */
        var navigationController = this.getNavigationController();
        var contentUrl = navigationController.getNodeUrl(nodeLinkId);
        if (anchor!=null) {
            contentUrl += '#' + anchor;
        }
        this._logger.info("Setting URL of Content Frame to " + contentUrl);
        if (this._isBlank()) {
            /* Prevent "Back" */
            this.getContentFrame().location.replace(contentUrl);
        }
        else {
            /* Allow "Back" */
            this.getContentFrame().location.href = contentUrl;
        }
    },

    updateNavigationState: function(nodeLinkId) {
        var navigationController = this.getNavigationController();
        var breadcrumbController = this.getBreadcrumbController();
        var node = navigationController.getNode(nodeLinkId);
        if (node!=null) {
            if (breadcrumbController!=null) {
                breadcrumbController.fireSelectionDownwards(node);
            }
            navigationController.fireSelectionDownwards(nodeLinkId);
        }
        else {
            this._logger.warn("Could not find Node with link ID " + nodeLinkId + " so no navigation update");
        }
    },

    getPermalink: function(linkId) {
        var result = null;
        if (this.containsNode(linkId)) {
            result = location.href.replace(/#.+/, '') + '#node=' + linkId;
        }
        return result;
    },

    getBreadcrumbFrame: function() {
        return this._getFrameWindow('breadcrumbFrame');
    },

    getNavigationFrame: function() {
        return this._getFrameWindow('navigationFrame');
    },

    getContentFrame: function() {
        return this._getFrameWindow('contentFrame');
    },

    _getFrameWindow: function(frameId) {
        var frame = $(frameId);
        return frame!=null ? frame.contentWindow : null;
    },

    getNavigationController: function() {
        return this.getNavigationFrame().getNavigationController();
    },

    getBreadcrumbController: function() {
        var breadcrumbFrame = this.getBreadcrumbFrame();
        return breadcrumbFrame!=null ? breadcrumbFrame.getBreadcrumbController() : null;
    }
}

Utilities.extend(DeploymentFramesetController.prototype, DeploymentFramesetController.override);

DeploymentFramesetController._singleton = new DeploymentFramesetController();

window.getFramesetController = function() {
    return DeploymentFramesetController._singleton;
}

window.onload = function() {
    if (window.LandingPage!=null) {
        LandingPage.redirectIfRequired();
    }
    getFramesetController().setFramesetLoaded(true);
}
