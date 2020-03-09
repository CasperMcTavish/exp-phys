/* $Id: Utilities.js 3173 2015-08-28 15:20:30Z davemckain $
 *
 * Copyright (c) 2010, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* This class contains some generally useful JavaScript utilities
 * that are used throughout Aardvark.
 *
 * Prerequisites: Logger.js
 */

//------------------------------------------------------------

function Utilities() {}

/* Log facility */
Utilities._logger = Logger.getLog("Utilities");

/* Indicates that an Error should be thrown. The message parameter
 * determines the Error message. For safety, an alert box is brought
 * up too.
 *
 * This should be used to flag critical errors during JS development.
 */
Utilities.fail = function(message) {
    alert("Software Error: " + message);
    throw new Error(message);
}

/*
 * Ensures that the given argument is non-null, invoking a failure
 * if not. The optional message is used in the error message.
 */
Utilities.ensureNotNull = function(arg, message) {
    if (arg==null) {
        if (message==null) {
            message = "Argument must not be null";
        }
        Utilities.fail("ASSERTION FAILED: " + message);
    }
}

Utilities.resolveAgainst = function(basePath, relativeUrl) {
    /* Example:
     *
     * base = /a/b/c/d.xml
     * rel  = ../../e/f.xml
     *
     * result is /a/e/f.xml.
     *
     * The usual stack strategy is OK here.
     */
    var baseComponents = basePath.split("/");
    var relComponents  = relativeUrl.split("/");

    /* Turn baseComponents into a Stack (or Array with some faffing!).
     * stackPointer will provide the index of
     * the last element in the stack. This is going to be start off
     * as the 2nd last element since we chuck off the last part.
     */
    var stack = baseComponents;
    var stackPointer = baseComponents.length - 1;

    /* Now iterate through the components of relativeUrl */
    var component, i;
    for (i=0; i<relComponents.length; i++) {
        component = relComponents[i];
        if (component=='..') {
            stackPointer--;
        }
        else if (component=='.') {
            /* Do nothing */
        }
        else {
            stack[stackPointer++] = component;
        }
    }
    /* Now turn back into result */
    stack.length = stackPointer;
    return stack.join("/");
}

//------------------------------------------------------------

/* Adds the given varargs array of renderingSpecs to the given resourceUrl
 * (i.e. a URL ending in an Aardvark ResourceName), canonicalising the result
 * so that the specs are in the usual alphabetical order.
 *
 * @param resourceUrl original Resource URL.
 * @param renderingSpecs Aardvark DynamicRenderingSpecs, encoded as an array
 *   of 'key_value' or 'booleanKey' Strings.
 */
Utilities.addRenderingSpecs = function(resourceUrl /*, renderingSpecs... */) {
    /* First we extract the resourceName and renderingSpecs from the given URL, using
     * the following example as a guide:
     *
     * blah/blah/resourceName-spec1-spec2-spec3.ext
     *
     * See the Java uk.ac.ed.ph.orycteropus.cms.domain.ResourceName for more
     * information about how this works.
     *
     * Then we merge in the new renderingSpecs and sort the results so that
     * they are in alphabetical order. Then the resulting URL is reconstructed
     * with the new specs inserted in the correct places.
     */
    var lastSlashIndex = resourceUrl.lastIndexOf('/');
    var leadingPart = lastSlashIndex!=-1 ? resourceUrl.substring(0, lastSlashIndex + 1) : '';
    var lastComponent = lastSlashIndex!=-1 ? resourceUrl.substring(lastSlashIndex + 1) : resourceUrl;
    var dotSplit = lastComponent.split('.');
    var resourceNameAndSpecs= dotSplit[0].split('-');

    /* Now build up resulting specs, merging new over old */
    var resultingSpecs = new Object();
    var i;
    for (i=1; i<resourceNameAndSpecs.length; i++) {
        resultingSpecs[resourceNameAndSpecs[i]] = 1;
    }
    for (i=1; i<arguments.length; i++) {
        resultingSpecs[arguments[i]] = 1;
    }
    i=0;
    var resultArray = new Array(resultingSpecs.length);
    for (var spec in resultingSpecs) {
        resultArray[i++] = spec;
    }

    /* Sort alphabetically and re-construct URL */
    var sorted = resultArray.sort();
    var resultUrl = leadingPart + resourceNameAndSpecs[0];
    for (i=0; i<sorted.length; i++) {
        resultUrl += '-' + sorted[i];
    }
    resultUrl += '.' + dotSplit[1];
    return resultUrl;
}

Utilities.extend = function(target, source) {
    for (name in source) {
        var obj = source[name];
        if (obj !== undefined) {
            target[name] = obj;
        }
    }
}

Utilities._onloadFunctions = new Array();

Utilities.onload = function(func) {
    if (Utilities._onloadFunctions.length==0) {
        window.onload = function() {
            Utilities._runOnload();
        }
    }
    Utilities._onloadFunctions.push(func);
}

Utilities._runOnload = function() {
    for (i in Utilities._onloadFunctions) {
        Utilities._onloadFunctions[i]();
    }
}

/* (Remember that this is old and isn't how newer things like JQuery work!) */
$ = function(id) {
    return document.getElementById(id);
}

/* (Based on Prototype) */
/* FIXME: This has been renamed as bind_ to prevent clash with ace.js. Ideally should get rid of this! */
Function.prototype.bind_ = function() {
    var method = this;
    var object = arguments[0];
    return function() {
        return method.apply(object);
    }
}
