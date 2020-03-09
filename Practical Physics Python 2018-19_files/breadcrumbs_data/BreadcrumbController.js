/* $Id: BreadcrumbController.js 3095 2011-08-16 16:34:20Z davemckain $
 *
 * Copyright (c) 2010, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* This class manages the breadcrumb frame within a deployment
 * frameset.
 *
 * Prerequisites: Logger.js
 */

/* We're not using JQuery here yet as this code was originally written for Prototype
 * and works OK, hence... */
function $(id) { return document.getElementById(id); }

function BreadcrumbController() {}
BreadcrumbController.MAX_HISTORY = 15;
BreadcrumbController.prototype = {

    /* Logger */
    _logger: Logger.getLog("BreadcrumbController"),

    /* Browsing History */
    _history: new Array(),

    /* Breadcrumb XHTML Elements */
    _breadcrumbs: new Array(),

    /* History pointer (-1 if before first history item) */
    _historyPointer: -1,

    /* Index of most recent item in history (-1 if no items in history) */
    _mostRecentIndex: -1,

    /* Index of Node currently in process of being selected */
    _pendingSelectionIndex: null,

    _setUp: function() {
        /* Create breadcrumbs elements and history array */
        for (var i=0; i<BreadcrumbController.MAX_HISTORY; i++) {
            this._history[i] = null;
            this._breadcrumbs[i] = this._createBreadcrumbElement(i);
        }
        /* Tell frameset that I've loaded and make sure it resizes */
        if (this.isInControllerFrameset()) {
            var framesetController = this.getFramesetController();
            framesetController.setSize();
            framesetController.setFrameLoaded("breadcrumbFrame", true);
        }
    },

    _createBreadcrumbElement: function(index) {
        var onclickAttr = 'getBreadcrumbController().selectNodeAt(' + index + ')';
        var breadcrumb = document.createElement('div');
        var content = "<span class='number'>"
            + "  <span class='breadcrumbLink' onclick='" + onclickAttr + "' id='breadcrumbLink_" + index + "' title=''>"
            + "    <span class='breadcrumbNumber' id='breadcrumbNumber_" + index + "'>"
            + "-" /* (Breadcrumb number will be filled in when used) */
            + "    </span>"
            + "    <span class='breadcrumbTitle' id='breadcrumbTitle_" + index + "'>"
            + "-" /* (Breadcrumb text will be filled in when used) */
            + "    </span>"
            + "  </span>"
            + "  <span class='breadcrumbSeparator final' id='breadcrumbSeparator_" + index + "'>"
            + "\xa0\xbb\xa0"
            + "  </span>"
            + "</span>";
        breadcrumb.id = this._getBreadcrumbElementId(index);
        breadcrumb.className = 'breadcrumb unused';
        breadcrumb.innerHTML = content;

        /* Add to container */
        $("breadcrumbContainer").appendChild(breadcrumb);

        return breadcrumb;
    },

    _getBreadcrumbElementId: function(index) {
        return "breadcrumb_" + index;
    },

    nodeVisited: function(treeNode) {
        this._logger.info("Visited new node " + treeNode.getLinkId());
        /* Normally we'll add history just after the current pointer */
        var newIndex = this._historyPointer + 1;
        if (newIndex < BreadcrumbController.MAX_HISTORY) {
            /* OK, there are unused elements in the history */
            this._updateHistory(newIndex, treeNode);
            this._setBreadcrumbClass(newIndex, 'current');
            this._setBreadcrumbSeparator(newIndex, true);
            if (newIndex>0) {
                this._setBreadcrumbClass(newIndex-1, 'past');
                this._setBreadcrumbSeparator(newIndex-1, false);
            }

            /* Clear anything after this point in history */
            for (var i=newIndex+1; i<=this._mostRecentIndex; i++) {
                this._updateHistory(i, null);
                this._setBreadcrumbClass(i, 'unused');
            }
            /* Update position */
            this._historyPointer = newIndex;
            this._mostRecentIndex = newIndex;
        }
        else if (newIndex==BreadcrumbController.MAX_HISTORY) {
            /* Adding to end of history, so must move all previous elements back one */
            for (var i=1; i<newIndex; i++) {
                this._updateHistory(i-1, this._history[i]);
            }
            newIndex--;
            this._updateHistory(newIndex, treeNode);
            this._mostRecentIndex = newIndex;
        }
        else {
            Utilities.fail("History has gone weird!");
        }
    },

    _canGoBack: function() {
        return this._historyPointer>0;
    },

    _canGoForward: function() {
        return this._mostRecentIndex>0 && this._historyPointer<this._mostRecentIndex;
    },

    _highlightPreviousNode: function() {
        if (this._canGoBack()) {
            this._setBreadcrumbClass(this._historyPointer--, 'future');
            if (this._historyPointer>=0) {
                this._setBreadcrumbClass(this._historyPointer, 'current');
            }
        }
    },

    _highlightNextNode: function() {
        if (this._canGoForward()) {
            if (this._historyPointer>=0) {
                this._setBreadcrumbClass(this._historyPointer, 'past');
            }
            this._setBreadcrumbClass(++this._historyPointer, 'current');
        }
    },

    _highlightNodeAt: function(index) {
        if (index==this._historyPointer) {
            /* Already there! */
        }
        else if (index<this._historyPointer) {
            /* Going back */
            while (index<this._historyPointer) {
                this._highlightPreviousNode();
            }
        }
        else if (index>this._historyPointer) {
            /* Going forward */
            while (index>this._historyPointer) {
                this._highlightNextNode();
            }
        }
    },

    _updateHistory: function(index, treeNode) {
        this._history[index] = treeNode;

        /* Update breadcrumb text */
        var breadcrumbTitleNode = $("breadcrumbTitle_" + index).childNodes[0];
        var breadcrumbNumberNode = $("breadcrumbNumber_" + index).childNodes[0];
        var breadcrumbLink = $("breadcrumbLink_" + index);
        if (treeNode!=null) {
            breadcrumbNumberNode.nodeValue = treeNode.getNumber();
            breadcrumbTitleNode.nodeValue = " " + treeNode.getTitle(); /* (Need space to keep separate from number) */
            breadcrumbLink.setAttribute("title", treeNode.getNumber() + " " + treeNode.getTitle());
        }
        else {
            breadcrumbNumberNode.nodeValue = '-';
            breadcrumbTitleNode.nodeValue = '-';
            breadcrumbLink.setAttribute("title", '');
        }
    },

    _setBreadcrumbClass: function(index, className) {
        /* Update breadcrumb class */
        var breadcrumb = this._breadcrumbs[index];
        breadcrumb.className = "breadcrumb " + className;
    },

    _setBreadcrumbSeparator: function(index, isFinal) {
        var breadcrumb = this._breadcrumbs[index];
        var chevron = $("breadcrumbSeparator_" + index);
        if (chevron!=null) {
            chevron.className = 'breadcrumbSeparator ' + (isFinal ? 'final' : 'intermediate');
        }
        else {
            this._logger.warn("Could not find breadcrumb separator at index " + index);
        }
    },

    //-------------------------------------------
    // Selection Logic

    selectNodeAt: function(index) {
        this._logger.info("Selecting breadcrumb Node at index " + index);
        this._pendingSelectionIndex = index;
        if (this.isInControllerFrameset()) {
            var treeNode = this._history[index];
            if (treeNode!=null) {
                this.getFramesetController().fireSelectionDownwards(treeNode.getLinkId());
            }
            else {
                Utilities.fail("No treeNode found at index " + index);
            }
        }
        else {
            this._logger.warn("goTo() ignored as we are not inside a frameset");
        }
        return false;
    },

    selectPreviousNode: function() {
        if (this._canGoBack()) {
            this.selectNodeAt(this._historyPointer - 1);
        }
        return false;
    },

    selectNextNode: function() {
        if (this._canGoForward()) {
            this.selectNodeAt(this._historyPointer + 1);
        }
        return false;
    },

    fireSelectionDownwards: function(treeNode) {
        this._logger.info("Selection fired downwards on Node " + treeNode.getLinkId());

        /* If selection was instigated by breadcrumbs themselves, then _pendingSelectionIndex
         * gives the index of the breadcrumb making the selection. We can then go to that
         * breadcrumb as required.
         *
         * If selection was not from breadcrumb then _pendingSelectionIndex is null and
         * we simply either test for back/forward or create a new breadcrumb,
         * unless selection is same as current breadcrumb
         */
        var newLinkId = treeNode.getLinkId();
        if (this._pendingSelectionIndex!=null) {
            /* Selection came from a breadcrumb */
            var selectionNode = this._history[this._pendingSelectionIndex];
            if (selectionNode.getLinkId()==newLinkId) {
                this._highlightNodeAt(this._pendingSelectionIndex);
            }
            else {
                this._logger.warn("Unexpected logic branch: _pendingSelectionIndex="
                    + this._pendingSelectionIndex
                    + ", selectionNodeLinkId=" + selectionNode.getLinkId()
                    + ", newLinkId=" + newLinkId);
                this.nodeVisited(treeNode);
            }
        }
        else if (this._historyPointer>=0 && this._history[this._historyPointer].getLinkId()==newLinkId) {
            /* Reselected current item, so do nothing */
        }
        else if (this._canGoBack() && this._history[this._historyPointer-1].getLinkId()==newLinkId) {
            /* Went back */
            this._highlightPreviousNode();
        }
        else if (this._canGoForward() && this._history[this._historyPointer+1].getLinkId()==newLinkId) {
            /* Went forward */
            this._highlightNextNode();
        }
        else {
            /* New selection */
            this.nodeVisited(treeNode);
        }
        /* Ensure reset for next selection */
        this._pendingSelectionIndex = null;
    },

    //-------------------------------------------

    isInControllerFrameset: function() {
        return parent!=null && parent!=window && parent.getFramesetController!=null;
    },

    getFramesetController: function() {
        if (this.isInControllerFrameset()) {
            return parent.getFramesetController();
        }
        return null;
    }
}

BreadcrumbController._singleton = new BreadcrumbController();

window.getBreadcrumbController = function() {
    return BreadcrumbController._singleton;
}

window.onload = function() {
    getBreadcrumbController()._setUp();
}
