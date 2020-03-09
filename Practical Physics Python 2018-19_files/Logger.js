/* $Id: Logger.js 3095 2011-08-16 16:34:20Z davemckain $
 *
 * Copyright (c) 2010, The University of Edinburgh.
 * All Rights Reserved.
 */

//------------------------------------------------------------

/* This is a very simple JavaScript logging package, similar
 * in some ways to Log4J et. al.
 */

//------------------------------------------------------------

/* This class defines the various logging levels. */
function LogLevel(value, displayName, styleName) {
    this._value = value;
    this.displayName = displayName;
    this.styleName = styleName;
}

LogLevel.prototype.compareTo = function(otherLevel) {
    return this._value - otherLevel._value;
}

LogLevel.DEBUG = new LogLevel(0, "DEBUG", "debug");
LogLevel.INFO  = new LogLevel(1, "INFO ", "info");
LogLevel.WARN  = new LogLevel(2, "WARN ", "warn");
LogLevel.ERROR = new LogLevel(3, "ERROR", "error");

//------------------------------------------------------------

/* The Logger class is modeled on Log4J and acts as both a
 * factory class and a Logger instance - no point in being
 * too complex here!
 */
function Logger(logName) { /* (Private Constructor) */
    this._logName  = logName;
}

/* Default log level. Don't change this for debugging code that uses this logging framework;
 * instead you should change the global log level from within your code.
 */
Logger._defaultLogLevel = LogLevel.WARN;

/* Logger instances by name */
Logger._loggersByName  = new Object();

/* Log levels by name or pattern */
Logger._logLevelsByName = new Object();

/* Window that the logging will be sent to */
Logger._logWindow = null;

/* Gets a Logger having the given name, creating new one if required */
Logger.getLog = function(logName) {
    var result = Logger._loggersByName[logName];
    if (result == null) {
        result = new Logger(logName);
        Logger._loggersByName[logName] = result;
    }
    return result;
}

Logger.setLogWindow = function(window) {
    Logger._logWindow = window;
}

Logger.setLogLevel = function(name, level) {
    Logger._logLevelsByName[name] = level;
}

Logger.computeLogLevel = function(name) {
    var longestMatch;
    var length;
    var bestLength = 0;
    var result = Logger._defaultLogLevel;
    for (var registered in Logger._logLevelsByName) {
        length = registered.length;
        if (registered.charAt(length-1)=='*') {
            /* Wildcard so look for longest match */
            if (name.substr(0, length-1)==registered.substring(0, length-1)
                    && length > bestLength) {
                result = Logger._logLevelsByName[registered];
                bestLength = length;
            }           
        }
        else {
            /* Try for exact match */
            if (name==registered) {
                result = Logger._logLevelsByName[registered];
                break;
            }
        }
    }
    return result;
}

Logger._log = function(logName, message, severityLevel) {
    var logLevel = Logger.computeLogLevel(logName);
    if (severityLevel.compareTo(logLevel) >= 0) {
        Logger._showMessage(logName, message, severityLevel);
    }
}

Logger._showMessage = function(logName, message, severityLevel) {
    /* Create timestamp now */
    var timestamp = new Date();

    /* If no window, create popup window now */
    if (Logger._logWindow==null || Logger._logWindow.document==null) {
        Logger._logWindow = window.open("", "logger",
            "resizable,width=500,height=400,scrollbars", true);
    }
    var doc = Logger._logWindow.document;
    if (doc.getElementById("messages")==null) {
        /* Nothing logged yet so clear document and redo */
        doc.clear();
        doc.write("<html>"
            + "<head>\n"
            + "<title>Logging Console</title>\n"
            + "<style type='text/css'>\n"
            + "body {\n"
            + "  font-family: Sans-Serif;\n"
            + "}\n"
            + "pre#messages {\n"
            + "  border: 5px solid #cccccc;\n"
            + "  background-color: black;\n"
            + "  color: white;\n"
            + "  padding: 0.2em;\n"
            + "  font-size: small;\n"
            + "  overflow: auto;\n"
            + "}\n"
            + ".error { color: red; font-weight: bold; }\n"
            + ".warn  { color: pink; font-weight: bold; }\n"
            + ".info  { color: white; font-weight: bold; }\n"
            + ".debug { color: #cccccc; }\n"
            + ".clear { text-decoration: underline; }\n"
            + "span.clear:hover { cursor: pointer; }\n"
            + "</style>\n"
            + "<script type='text/javascript'>\n"
            + "function clearConsole() {\n"
            + "  var messageBox = document.getElementById('messages');\n"
            + "  var nodes = messageBox.childNodes;\n"
            + "  for (var i=nodes.length-1; i>=0; i--) {\n"
            + "    messageBox.removeChild(nodes[i]);\n"
            + "  }\n"
            + "}\n"
            + "</script>\n"
            + "</head>\n"
            + "<body>\n"
            + "<h1>Logging Console</h1>\n"
            + "<pre id='messages'></pre>\n"
            + "<p>"
            + "  <span class='clear' onclick='clearConsole()'>Clear Console</span>"
            + "</p>\n"
            + "</body>\n</html>");
        doc.close();
    }
    /* Create log message */
    var hoursMinsSecs = timestamp.toGMTString().substring(17,25);
    var milliseconds = "00" + timestamp.getMilliseconds();
    milliseconds = milliseconds.substring(milliseconds.length-3, milliseconds.length);
    var timeText = hoursMinsSecs + "+" + milliseconds;
    var messageText = severityLevel.displayName
            + " " + timeText
            + " [" + logName + "] "
            + message + "\n";

    /* Create appropriately styled element and add to document */
    if (Logger._logWindow != null) {
        var messageDiv = doc.createElement("div");
        messageDiv.className = severityLevel.styleName;
        var messageTextNode = doc.createTextNode(messageText);
        messageDiv.appendChild(messageTextNode);
        var messageBox = doc.getElementById("messages");
        messageBox.appendChild(messageDiv);
        Logger._logWindow.focus();
        messageDiv.scrollIntoView();
    }
    else {
        /* Just do a simple alert box */
        alert(messageText);
    }
}

Logger.prototype = {
    debug: function(message) {
        Logger._log(this._logName, message, LogLevel.DEBUG);
    },
    info: function(message) {
        Logger._log(this._logName, message, LogLevel.INFO);
    },
    warn: function(message) {
        Logger._log(this._logName, message, LogLevel.WARN);
    },
    error: function(message) {
        Logger._log(this._logName, message, LogLevel.ERROR);
    }
}
