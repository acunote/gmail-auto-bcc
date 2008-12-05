/* This greasemonkey script automatically BCCs (or CCs) outgoing email from 
 * a gmail address to a specified email address
 * 
 * Authors: Jaidev K Sridhar mail<AT>jaidev<DOT>info, 
 *          Ilya Furman smashlong<AT>gmail<DOT>com 
 * 
 * Copyright (c) 2005-2008, Jaidev K Sridhar, Ilya Furman
 * Released under the GPL license
 * http://www.gnu.org/copyleft/gpl.html
 */

// ==UserScript==
// @name          Gmail Auto BCC
// @namespace     http://jaidev.info/home/projects/gmailAutoBcc
// @description   This greasemonkey script automatically BCCs (or CCs) outgoing email from a gmail address to a specified email address. This version tested with latest (Nov 2008) Gmail with themes and with previous Gmail UI version
// @include       http*://mail.google.com/*
// ==/UserScript==

// gBccMail = email Address        Email address to BCC to
// gBccEnabled = true / false        
// gBccPopup = true / false    Pops up a prompt before adding BCC
// gBccHeader = "bcc"        Header to add. By default BCC.
var console = {
    log : function() {
        var message = '';
        if (arguments.length > 1) {
            for (var i=0; i < arguments.length; i++) {
                message += arguments[i] + '\n';
            };
        } else {
            message = arguments[0];
        }
        GM_log('\n' + message);
    }
}
var hasClassName = function(element, className) {
    if (element.className.length == 0) return false;
    if (element.className == className ||
        element.className.match(new RegExp("(^|\\s)" + className + "(\\s|$)"))) {
        return true;
    }
    return false;
}
var parentWithClassName = function(element, className) {
    while (element.tagName != "BODY") {
        if (hasClassName(element, className)) {
            return element;
        }
        element = element.parentNode;
    }
    
}


var addingRoutine = function() {
    // read 'enabled' property
    options.gBccEnabled = GM_getValue('gBccEnabled');
    if (options.gBccEnabled == false) {
        console.log('Gmail BCC script is disabled.');
        return;
    }
    //set defaults if there is no enabled property
    if (typeof options.gBccEnabled == 'undefined') {
        GM_setValue('gBccEnabled', true);
        GM_setValue('gBccPopup', false); // FALSE by default
        GM_setValue('gBccMapFromAddress', false); // FALSE by default
        options.gBccEnabled = true;
    }
    
    // find div that contains form with To:, CC: fields
    var form_div = null;
    switch (click) {
        // top form
        case 1:
            form_div = event.target.parentNode.parentNode.parentNode.parentNode.nextSibling;
            break;
        // bottom form
        case 2:
            form_div = event.target.parentNode.parentNode.parentNode.parentNode.previousSibling;
            break;
    }
    
    // read header type setting, check and re-init if broken
    var header = GM_getValue ('gBccHeader');
    if (!header || !(header == "cc" || header == "bcc")) {
        header = "bcc";
        GM_setValue ('gBccHeader', "bcc");
    }
    
    // confirmation dialogs stuff, looks quite complicated so left unchanged
    var mapFrom = GM_getValue ('gBccMapFromAddress');
    if (mapFrom == true) {
        var from = form_div.firstChild.elements.namedItem('from').value;
        var email = GM_getValue ('gBccMail_' + from);
        if (email == "disabled")
            return;
        if (!email) {
            email = prompt("gmailAutoBcc: Where do you want to bcc/cc your outgoing gmail sent from identity: " + from + "?\n\n Leave blank to disable gmailAutoBcc for this identity.");
            if (!email) {
                GM_setValue ('gBccMail_' + from, "disabled");
                return;
            }
            GM_setValue ('gBccMail_' + from, email);
        }
    }
    else {
        var email = GM_getValue('gBccMail');
        if (!email) {
            email = prompt("gmailAutoBcc: Where do you want to bcc/cc all your outgoing gmail?");
            if (!email) 
                return;
            GM_setValue('gBccMail', email);
        }
        if (mapFrom != false) 
            GM_setValue('gBccMapFromAddress', false); // FALSE by default
    }
    
    // get form field according to header option
    var dst_field = form_div.firstChild.elements.namedItem(header);
    
    // show adding confirmation
    var popup = GM_getValue ('gBccPopup');
    if (popup == true) {
        if (!confirm("Do you want to add BCC to " + email + "?")) {
            dst_field.setAttribute("gid", "gBccDone");
            return;
        }
    }
    else if (popup != false) {
        GM_setValue ('gBccPopup', false); // FALSE by default
    }
    
    //modifying bcc/cc (defined by header) field
    if (dst_field.value) {
        dst_field.value = dst_field.value + ", " + email;
    }
    else {
        dst_field.value = email;
    }
    dst_field.setAttribute("gid", "gBccDone");
}

window.addEventListener('load', function() {
    if (unsafeWindow.gmonkey) {
        unsafeWindow.gmonkey.load("1.0", function(gmail) {
            
            function gBccInit () {
                // getting view pane node and document root
                while (!viewPane) {
                    var viewPane = gmail.getNavPaneElement();
                }
                var root = viewPane.ownerDocument;

                
                //adding event listener
                root.addEventListener ('click', function(event) {
                    var options = {};
                    
                    // constants
                    options.SEND_BUTTON_CLASS               = "goog-button";
                    options.SEND_BUTTON_WRAPPER_CLASS       = "c1I77d yCMBJb";
                    options.TOP_WRAPPER_CLASS               = "LlWyA";
                    options.BOTTOM_WRAPPER_CLASS            = "CoUvaf";
                    options.mode                            = "top";
                    
                    var target = event.target;
                    // check if this is toolbar button
                    if (target.tagName == "BUTTON" && hasClassName(target, options.SEND_BUTTON_CLASS)) {
                        var wrapperElement = parentWithClassName(target, options.SEND_BUTTON_WRAPPER_CLASS);
                        switch(wrapperElement.tagName) {
                            case "DIV"   : 
                                if (hasClassName(wrapperElement.parentNode, options.BOTTOM_WRAPPER_CLASS)) {
                                    options.mode = 'bottom';
                                }
                                
                                addingRoutine();
                                console.log('OHAI!')
                                
                                break;
                            case "BODY"  : 
                                console.log('Cant determine wether top or bottom button was used.');
                                return;
                                break;
                        }
                    }
                }, true);
            } /* gBccInit */
            
            gBccInit ();
        });
    }
}, true);
