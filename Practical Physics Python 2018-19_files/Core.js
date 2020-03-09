/* $Id: Core.js 3176 2015-08-31 10:35:27Z davemckain $
 *
 * Copyright (c) 2010, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* This file defines some of the common Classes and settings
 * used across many Aardvark web Resource outputs.
 *
 * Prerequisites: Logger.js, Utilities.js, Config.js
 */

//------------------------------------------------------------

/* Normal log level settings. Temporarily lower the log level if you need to
 * debug any of this code! */
Logger.setLogLevel("*", LogLevel.ERROR);

//------------------------------------------------------------

/* Functionality for managing hide/reveal panes within pages. */
function ContentController() {}

ContentController.prototype = {

    _logger: Logger.getLog("ContentController"),

    isInControllerFrameset: function() {
        return parent!=null && parent!=window && parent.getFramesetController!=null;
    },

    setVisibility: function(/*String*/ id, /*Boolean*/ isVisible) {
        var container = document.getElementById(id);
        if (container!=null) {
            this._setVisibility(container, isVisible);
        }
        return false;
    },

    /* Updates the visibillity of all callout elements within the current
      * page. These are defined to be all <div class="callout">...</div>
      * elements.
      */
    setGlobalVisibility: function(/*Boolean*/ isVisible) {
        var allDivs = document.getElementsByTagName("div");
        for (var i=0; i<allDivs.length; i++) {
            var div = allDivs[i];
            if (div.className=="callout") {
                this._setVisibility(div, isVisible);
            }
        }
        return false;
    },

    /* Private function to do the actual visibility modifications */
    _setVisibility: function(divElement, isVisible) {
        /* Look at immediate children to determine what to display/hide */
        var children = divElement.childNodes;
        if (children!=null) {
            for (var i=0; i<children.length; i++) {
                var element = children[i];
                var className = element.className;
                if (className!=null) {
                    if (className=="minimised") {
                        element.style.display = (isVisible) ? "none" : "block";
                    }
                    else if (className=="maximised") {
                        element.style.display = (isVisible) ? "block" : "none";
                    }
                }
            }
        }
    },

    _isWebappUrl: function(url) {
        return url.substring(0, Config.webappUrl.length)==Config.webappUrl;
    },

    setupBookmarkHandler: function(viewUrl) {
        Utilities.onload(function() {
            var bookmarkButton = $("bookmarkButton");
            bookmarkButton.onclick = function() {
                getContentController().saveBookmark(viewUrl);
                return false;
            };
        });
    },

    saveBookmark: function(url) {
        if (this._isWebappUrl(url) && !confirm("You're trying to bookmark a page inside the "
                + "Aardvark previewer. This bookmark cannot safely be shared with other people. "
                + "(You should only share bookmarks generated from deployed content.)")) {
            return;
        }
        var title = document.title;
        var success = false;
        if (window.sidebar) {
            /* (Mozilla) */
            window.sidebar.addPanel(title, url, '');
            success = true;
        }
        else if (window.external) {
            try {
                /* (IE?) */
                window.external.AddFavorite(url, title);
                success = true;
            }
            catch (err) {
            }
        }
        if (!success) {
            alert("Use your browser controls to save the following bookmark: " + url);
        }
        return false;
    },

    /* New for AY 2015/16 - Python code blocks with syntax highlighting */
    setupSyntaxHighlighting: function() {
        var attachAceEditor = function(element, language) {
            var editor = ace.edit(element);
            editor.setReadOnly(true);
            editor.renderer.setScrollMargin(8, 8);
            editor.setShowPrintMargin(false);
            editor.setShowFoldWidgets(false);
            editor.setHighlightActiveLine(false);
            editor.setTheme('ace/theme/textmate');
            editor.getSession().setMode('ace/mode/' + language);
            editor.setOptions({
                maxLines: editor.session.getLength()
            });
        };
        var preElements = document.getElementsByTagName('pre');
        var i, preElement;
        if (ace !== undefined) {
            for (i=0; i<preElements.length; i++) {
                preElement = preElements[i];
                if (preElement.className === 'verbatim code python') {
                    attachAceEditor(preElement, 'python');
                }
                else if (preElement.className === 'verbatim code java') {
                    attachAceEditor(preElement, 'java');
                }
            }
        }
    },
}

ContentController._singleton = new ContentController();

window.getContentController = function() {
    return ContentController._singleton;
}
