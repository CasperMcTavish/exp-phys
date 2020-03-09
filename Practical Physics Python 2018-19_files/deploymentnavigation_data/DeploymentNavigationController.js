/* $Id: DeploymentNavigationController.js 2999 2010-08-13 15:47:23Z davemckain $
 *
 * Copyright (c) 2010, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* This file contains the JavaScript required to manage the navigation
 * frame within a Deployment Frameset.
 *
 * This includes the main DeploymentNavigationController class and some
 * related domain Objects representing Nodes and Trees.
 *
 * Prerequisites: Logger.js, Utilities.js, AbstractNavigationController.js
 */

//------------------------------------------------------------

/* Represents an OrganisationTree being deployed */
function OrganisationTree(treeId, treeLinkId, title) {
    this._treeId = treeId;
    this._treeLinkId = treeLinkId;
    this._title = title;
    this._nodesByLinkId = new Object();
    this._nodesArray = new Array();
}

OrganisationTree.prototype = {

    registerNode: function(treeNode) {
        this._nodesByLinkId[treeNode.getLinkId()] = treeNode;
        this._nodesArray.push(treeNode);
    },

    getNode: function(nodeLinkId) {
        return this._nodesByLinkId[nodeLinkId];
    },

    containsNode: function(nodeLinkId) {
        return this.getNode(nodeLinkId)!=null;
    },

    getId: function() {
        return this._treeId;
    },

    getLinkId: function() {
        return this._treeLinkId;
    },

    getTitle: function() {
        return this._title;
    },

    getFirstActiveNode: function() {
        var i, node;
        for (i=0; i<this._nodesArray.length; i++) {
            node = this._nodesArray[i];
            if (node.isActive()) {
                return node;
            }
        }
        return null;
    }
}

/* Represents a Node under an OrganisationTree */
function TreeNode(nodeId, nodeLinkId, number, title, active) {
    this._nodeId = nodeId;
    this._nodeLinkId = nodeLinkId;
    this._number = number;
    this._title = title;
    this._active = active;
}

TreeNode.prototype = {

    getId: function() {
        return this._nodeId;
    },

    getLinkId: function() {
        return this._nodeLinkId;
    },

    getNumber: function() {
        return this._number;
    },

    getTitle: function() {
        return this._title;
    },

    isActive: function() {
        return this._active;
    }
}

/* This extends the AbstractNavigationController class to add
 * functionality for managing the global navigation within a
 * Web Deployment.
 */
function DeploymentNavigationController() {}

DeploymentNavigationController.prototype = AbstractNavigationController.prototype;
DeploymentNavigationController.override = {

    /* Logger */
    _logger: Logger.getLog("DeploymentNavigationController"),

    /* Hash of OrganisationTrees, keyed on NodeLinkId */
    _treesHash : new Object(),

    /* Array of OrganisationTrees, in order */
    _treesArray: new Array(),

    /* Currently highlighted Tree */
    _highlightedTree: null,

    /* Currently highlighted Node */
    _highlightedNode: null,

    addTree: function(tree) {
        this._logger.debug("Adding tree " + tree.getLinkId());
        this._treesHash[tree.getLinkId()] = tree;
        this._treesArray.push(tree);
    },

    getFirstTree: function() {
        return this._treesArray[0];
    },

    getTree: function(treeLinkId) {
        return this._treesHash[treeLinkId];
    },

    getTreeContaining: function(nodeLinkId) {
        var i, tree, treeLinkId;
        for (i=0; i<this._treesArray.length; i++) {
            tree = this._treesArray[i];
            if (tree.containsNode(nodeLinkId)) {
                return tree;
            }
        }
        return null;
    },

    getNode: function(nodeLinkId) {
        var i, tree, node;
        for (i=0; i<this._treesArray.length; i++) {
            tree = this._treesArray[i];
            node = tree.getNode(nodeLinkId);
            if (node!=null) {
                return node;
            }
        }
        return null;
    },

    getNodeByUrl: function(url) {
        var i, j, tree, node;
        for (i=0; i<this._treesArray.length; i++) {
            tree = this._treesArray[i];
            for (j=0; j<tree._nodesArray.length; j++) {
                node = tree._nodesArray[j];
                if (node.isActive() && url==this.getNodeUrl(node.getLinkId())) {
                    return node;
                }
            }
        }
        return null;
    },

    //------------------------------------------------

    _setUp: function() {
        /* Tell top controller we're ready */
        if (this.isInControllerFrameset()) {
            this.getFramesetController().setFrameLoaded("navigationFrame", true);
        }
    },

    fireSelectionDownwards: function(nodeLinkId) {
        this._logger.debug("Updating state on change propagated from controller");

        /* Which tree are we in? */
        var tree = this.getTreeContaining(nodeLinkId);
        if (tree==null) {
            Utilities.fail("Could not find Node with link ID " + nodeLinkId + " in any tree");
        }
        var node = tree.getNode(nodeLinkId);
        if (node==null) {
            Utilities.fail("Did not expect resulting node Object to be null!");
        }

        /* Now update visual state */
        this._setNavigationTitle(tree);
        this._setHighlightedTree(tree);
        this._setHighlightedNode(node);
    },

    getNodeUrl: function(nodeLinkId) {
        var node = this.getNode(nodeLinkId);
        if (node==null || !node.isActive()) {
            return null;
        }
        var listElement = this._getListElement(node);
        if (listElement==null) {
            Utilities.fail("Could not find <li> element for Node with Link ID " + nodeLinkId);
        }
        var aElements = listElement.getElementsByTagName("a");
        if (aElements==null) {
            Utilities.fail("Could not find <a> element for Node with Link ID " + nodeLinkId);
        }
        else if (aElements.length==0) {
            Utilities.fail("Unexpected logic branch - inactive Nodes should have been considered earlier?");
        }
        return aElements[0].href;
    },

    _getListElement: function(node) {
        return $("node_" + node.getId());
    },

    _getTreeSelectorElement: function(tree) {
        return $("treeselector_" + tree.getId());
    },

    _getTreeElement: function(tree) {
        return $("tree_" + tree.getId());
    },

    _getHighlightedTree: function() {
        return _highlightedTree;
    },

    _getHighlightedNode: function() {
        return _highlightedNode;
    },

    _setHighlightedTree: function(tree) {
        this._logger.debug("Doing _setHighlightedTree tree=" + tree.getLinkId());
        /* Hide current tree, if appropriate */
        var currentTree = this._highlightedTree;
        if (currentTree!=null && tree!=null && currentTree.getId()==tree.getId()) {
            /* No tree change so bail out */
            this._logger.debug("New tree is same as existing one so ignoring");
        }
        if (currentTree!=null) {
            this._setTreeVisibility(currentTree, false);
        }
        this._highlightedTree = tree;
        if (tree!=null) {
            this._setTreeVisibility(tree, true);
        }
    },

    _setNavigationTitle: function(tree) {
        var navigationHeader = $("navigation");
        if (navigationHeader!=null) {
            /* Only update title if XSLT has created the navigation header */
            var title;
            if (tree!=null) {
                title = "In " + tree.getTitle() + ":";
            }
            else {
                title = "Navigation";
            }
            navigationHeader.childNodes[0].nodeValue = title;
        }
    },

    _setHighlightedNode: function(node) {
        this._logger.debug("Doing _setHighlightedNode node=" + node.getLinkId());
        /* Deselect current item, if appropriate */
        if (this._highlightedNode!=null) {
            this._setListElementState(this._highlightedNode, false);
        }
        /* Then select new item */
        this._highlightedNode = node;
        if (node!=null) {
            this._setListElementState(this._highlightedNode, true);
        }
    },

    _setTreeVisibility: function(tree, isVisible) {
        this._logger.debug("Setting visibility of Tree element #" + tree.getId() + " to " + isVisible);
        var treeElement = this._getTreeElement(tree);
        if (treeElement!=null) {
            treeElement.className = isVisible ? "tree visible" : "tree hidden";
        }
        else {
            Utilities.fail("Could not find tree element for " + tree.getLinkId());
        }
        /* Update tree selector state, if one has been output by the XSLT */
        var treeSelector = this._getTreeSelectorElement(tree);
        if (treeSelector!=null) {
            treeSelector.className = isVisible ? "highlighted" : "unhighlighted";
        }
    },

    _setListElementState: function(node, isSelected) {
        this._logger.debug("Setting visual state of Node element #" + node.getId() + " to " + isSelected);
        var element = this._getListElement(node);
        if (element!=null) {
            element.className = isSelected ? 'selected' : 'unselected';
            if (isSelected && element.scrollIntoView) {
                element.scrollIntoView(false);
            }
        }
        else {
            this._logger.warn("Could not find list element for Node " + node.getLinkId());
        }
    },

    selectNode: function(aElement, linkId, anchor) {
        this._logger.debug("Selecting Node with ID " + linkId);
        /* If the parent frame is available, ask it to do it
         * is required next.
         */
        if (this.isInControllerFrameset()) {
            this._logger.debug("Passing selection to controller frame");
            this.getFramesetController().fireSelectionDownwards(linkId, anchor);
            return false;
        }
        return true;
    },

    selectTree: function(treeLinkId) {
        this._logger.debug("Selecting Tree with ID " + treeLinkId);
        /* We simply select the first Node in the tree */
        var tree = this.getTree(treeLinkId);
        if (tree!=null) {
            var firstNode = tree.getFirstActiveNode();
            if (firstNode!=null) {
                return this.selectNode(null, firstNode.getLinkId());
            }
            else {
                this._logger.warn("No active Nodes in tree " + treeLinkId);
            }
        }
        else {
            Utilities.fail("No tree registered with Link ID " + treeLinkId);
        }
        return true;
    }
}

Utilities.extend(DeploymentNavigationController.prototype, DeploymentNavigationController.override);

DeploymentNavigationController._singleton = new DeploymentNavigationController();

window.getNavigationController = function() {
    return DeploymentNavigationController._singleton;
}

window.onload = function() {
    getNavigationController()._setUp();
}
