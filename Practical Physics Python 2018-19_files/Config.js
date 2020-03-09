/* $Id: Config.js 3171 2015-08-17 10:25:55Z davemckain $
 *
 * Copyright (c) 2011, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* Deployment-specific configuration settings
 *
 * Prerequisites: None
 */

//------------------------------------------------------------

var Config = (function() {

    function extractFilteredProperty(value) {
        return value.match(/^@.*@$/) ? null : value;
    }

    return {
        webappUrl: extractFilteredProperty('https://webapps.ph.ed.ac.uk/aardvark'),
    };

})();
