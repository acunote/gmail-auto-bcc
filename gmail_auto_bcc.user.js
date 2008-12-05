/* This greasemonkey script automatically BCCs (or CCs) outgoing email from 
 * a gmail address to a specified email address
 * 
 * Author: Ilya Furman smashlong<AT>gmail<DOT>com 
 *         based on script from Jaidev K Sridhar mail<AT>jaidev<DOT>info
 * 
 * Copyright (c) 2005-2008, Ilya Furman
 * Released under the GPL license
 * http://www.gnu.org/copyleft/gpl.html
 */

// ==UserScript==
// @name          Gmail Auto BCC
// @namespace     http://jaidev.info/home/projects/gmailAutoBcc
// @description   This greasemonkey script automatically BCCs (or CCs) outgoing email from a gmail address to a specified email address. This version tested with latest (Nov 2008) Gmail with themes and with previous Gmail UI version
// @include       http*://mail.google.com/*
// ==/UserScript==

// gBccMail     = email Address     Email address to BCC to
// gBccEnabled  = true / false        
// gBccPopup    = true / false      Pops up a prompt before adding BCC
// gBccHeader   = "bcc"             Header to add. By default BCC.

// helper functions
// GM_logger wrapper with ability to log multiple parameters
var helper = {
    log : function() {
        var message = '';
        if (arguments.length > 1) { // arguments ain't array here for some weird reason
            for (var i=0; i < arguments.length; i++) {
                message += arguments[i] + '\n';
            };
        } else {
            message = arguments[0];
        }
        GM_log('\n' + message);
    },
    
    inspect : function(object) {
        var verbose = typeof object + "\n";
        for (key in object) {
            verbose += key + ': ' + object[key] + '\n';
        }
        return verbose;
    },
    
    // returns true if if element has classname and false if not
    hasClassName : function(element, className) {
        if (element.className.length == 0) return false;
        if (element.className == className ||
            element.className.match(new RegExp("(^|\\s)" + className + "(\\s|$)"))) {
            return true;
        }
        return false;
    },
    
    // returns parent element of given element that has given classname
    parentWithClassName : function(element, className) {
        while (element.tagName != "BODY") {
            if (this.hasClassName(element, className)) {
                return element;
            }
            element = element.parentNode;
        }
        
    },
    
    getOption : function(name, defaultValue) {
        var value = GM_getValue(name);
        if (typeof value == "undefined") {
            value = defaultValue;
            GM_setValue(name, value);
        }
        return value;
    }
}
var options = {};

window.addEventListener('load', function() {
    if (unsafeWindow.gmonkey) {
        
        // options and defaults
        options = {
            SEND_BUTTON_CLASS           : "goog-button",
            SEND_BUTTON_WRAPPER_CLASS   : "c1I77d yCMBJb",
            TOP_WRAPPER_CLASS           : "LlWyA",
            BOTTOM_WRAPPER_CLASS        : "CoUvaf",
            FORM_WRAPPER_CLASS          : "uQLZXb",
            gBccEnabled                 : helper.getOption('gBccEnabled', true),
            gBccPopup                   : helper.getOption('gBccPopup', false),
            gBccMapFromAddress          : helper.getOption('gBccMapFromAddress', false),
            gBccHeader                  : helper.getOption('gBccHeader', 'bcc'),
            gBccMapFromAddress          : helper.getOption('gBccMapFromAddress', false) 
        };
        
        // lets get gmail api interface after page loaded
        unsafeWindow.gmonkey.load("1.0", function(gmail) {
            if (options.gBccEnabled == false) {
                helper.log('gmailAutoBcc: script is disabled.');
                return;
            }
            
            // getting view pane node and document root
            while (!viewPane) {
                var viewPane = gmail.getNavPaneElement();
            }
            var root = viewPane.ownerDocument;
            
            //adding event listener
            root.addEventListener ('click', function(event) {
                var target = event.target;
                
                // check if target is actually toolbar button
                if (target.tagName == "BUTTON" && helper.hasClassName(target, options.SEND_BUTTON_CLASS)) {
                    // fing target button parent with specific class, if it exists - perform bcc routine
                    var wrapperElement = helper.parentWithClassName(target, options.SEND_BUTTON_WRAPPER_CLASS);
                    
                    switch(wrapperElement.tagName) {
                        case "DIV"   : 
                            // this code is executed when we sure that user clicked on send button
                            // check enabled and return if not
                            
                            // find form element
                            var formElementContainer = root.getElementsByClassName(options.FORM_WRAPPER_CLASS).item(0);
                            if (!formElementContainer) {
                                helper.log('gmailAutoBcc: can\'t find form container element');
                                return;
                            }
                            var formElement = formElementContainer.firstChild;
                            if (!formElement) {
                                helper.log('gmailAutoBcc: can\'t find form element');
                                return;
                            }
                            
                            // lets fill default copy email
                            options.email = GM_getValue('gBccMail');
                            if (!options.email) {
                                options.email = prompt("gmailAutoBcc: Where do you want to bcc/cc all your outgoing gmail?");
                                if (!options.email)
                                    return;
                                GM_setValue('gBccMail', options.email);
                            }
                            
                            // do we have multiple identities?
                            if (formElement.elements.namedItem('from')) {
                                var from = formElement.elements.namedItem('from').value;
                            }
                            
                            // if so - match identity with email
                            if (from && options.gBccMapFromAddress) {
                                options.email = GM_getValue('gBccMail_' + from);
                                
                                if (options.email == "disabled") {
                                    alert('gmailAutoBcc: script is disabled for email ' + options.email);
                                    return;
                                }
                                    
                                if (!options.email) {
                                    options.email = prompt("gmailAutoBcc: Where do you want to bcc/cc your outgoing gmail sent from identity: " + from + "?\n\n Leave blank to disable gmailAutoBcc for this identity.");
                                    if (!options.email) {
                                        GM_setValue('gBccMail_' + from, "disabled");
                                        return;
                                    }
                                    GM_setValue('gBccMail_' + from, options.email);
                                }
                            }
                            
                            // get form field according to header option
                            var destinationElement = formElement.elements.namedItem(options.gBccHeader);
                            
                            // show adding confirmation
                            if (options.gBccPopup) {
                                if (!confirm("Do you want to add BCC to " + options.email + "?")) {
                                    return;
                                }
                            }
                            
                            //modifying bcc/cc (defined by header) field
                            if (destinationElement.value) {
                                destinationElement.value += ", ";
                            }
                            destinationElement.value += options.email;
                            
                            break;
                        case "BODY"  : 
                            helper.log('gmailAutoBcc: can\'t determine wether top or bottom button was used.');
                            return;
                            break;
                    }
                }
            }, true);
        });
    }
}, true);
