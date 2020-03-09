/* $Id: NodeNavigationController.js 3075 2011-08-08 16:05:23Z davemckain $
 *
 * Copyright (c) 2010, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* This overrides the NavigationController abstract class to
 * make links between Nodes work correctly when viewed either
 * in the "content" part of a tree frameset or outwith the
 * frameset completely.
 *
 * It also handles popups and things.
 *
 * Some of these work by checking for a parent frame and
 * delegating the linkage to that frame so that other parts
 * of the frameset are updated as well. In the absence of
 * an enclosing frameset, these links behave in the usual
 * way.
 *
 * Prerequisites: Logger.js, Utilities.js, AbstractNavigationController.js
 */

//------------------------------------------------------------

function NodeNavigationController() {}

NodeNavigationController.prototype = AbstractNavigationController.prototype;
NodeNavigationController.override = {

    _logger: Logger.getLog("NodeNavigationController"),

    _popupWindowOptions: "width=550,height=400,scrollbars=yes,toolbar=yes,resizable=yes",

    isPopupWindow: function() {
        return window.opener!=null && window.opener.getNavigationController!=null;
    },

    getPopupWindowOpener: function() {
        if (this.isPopupWindow()) {
            return window.opener;
        }
        return null;
    },

    getPopupOpenerNavigationController: function() {
        if (this.isPopupWindow()) {
            return this.getPopupWindowOpener().getNavigationController();
        }
        return null;
    },

    getLoadedNodeLinkId: function() {
        var htmlElement = document.documentElement;
        return htmlElement.getAttribute("data-aardvark.link-id");
    },

    getPermalink: function() {
        var linkId = this.getLoadedNodeLinkId();
        var url = null;
        if (this.isInControllerFrameset()) {
            /* Do deep link through frameset */
            var framesetController = this.getFramesetController();
            url = framesetController.getPermalink(linkId);
        }
        else {
            /* Do simple link to this frame only */
            url = location.href;
        }
        return url;
    },

    selectNode: function(aElement, linkId, anchor) {
        this._logger.debug("selectNode(id=" + linkId + ",anchor=" + anchor + ")");
        if (linkId==null) {
            Utilities.fail("Link ID must not be null");
            return false;
        }
        if (this.isPopupWindow()) {
            /* This is a popup window, so we want to open the Node
             * in the originator's window */
            var openerController = this.getPopupOpenerNavigationController();
            if (openerController!=null) {
                return openerController.selectNode(aElement, linkId, anchor);
            }
            else {
                /* Can't access navigation controller so let hyperlink follow */
                this._logger.debug("Can't access owning NavigationController");
                return true;
            }
        }
        else {
            /* This is in the main window/frame. See if there's an
             * enclosing controller frame. If so, and our target Node is
             * listed then let it do the business.
             */
            if (this.isInControllerFrameset()) {
                var framesetController = this.getFramesetController();
                if (framesetController.containsNode(linkId)) {
                    framesetController.fireSelectionDownwards(linkId, anchor);
                    return false;
                }
                else {
                    return this.selectNodeAsPopup(aElement, linkId, anchor);
                }
            }
            else {
                /* No frameset. Let hyperlink work as normal */
                return true;
            }
        }
    },

    loadNode: function(url) {
        this._logger.debug("Requested to load Node at URL " + url);
        location.href = url;
    },

    selectNodeAsPopup: function(aElement, linkId, anchor) {
        if (linkId==null) {
            Utilities.fail("Link ID must not be null");
            return false;
        }
        if (this.isPopupWindow()) {
            /* This is a popup window, so want to simply open the Node here. */
            return true;
        }
        else {
            /* This is a normal window, so create a popup */
            this._openPopup(aElement.href);
            return false;
        }
    },

    selectExternalResource: function(url) {
        this._openPopup(url);
        return false;
    },

    _openPopup: function(url) {
        var popupWindow = window.open(url, "AardvarkPopup", this._popupWindowOptions);
        try {
            /* (Needed for older browsers) */
            popupWindow.opener = window;
        }
        catch (e) {
            /* (Give permission exception on newer browsers, which we'll ignore) */
        }
        popupWindow.focus();
    }
}

Utilities.extend(NodeNavigationController.prototype, NodeNavigationController.override);

NodeNavigationController._singleton = new NodeNavigationController();

window.getNavigationController = function() {
    return NodeNavigationController._singleton;
}
