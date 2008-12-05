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
                    // constants
                    var SEND_BUTTON1_DIV_CLASS = "c1I77d yCMBJb";
                    var TOP_SEND_DIV_CLASS = "LlWyA";
                    var BOT_SEND_DIV_CLASS = "CoUvaf";
                    
                    //do we click on one of toolbar buttons?
                    var click = 0;
                    if (event.target.parentNode.parentNode.getAttribute ("class") == 
                            SEND_BUTTON1_DIV_CLASS) {
                            
                        if (event.target.parentNode.parentNode.parentNode.getAttribute 
                                ("class") == TOP_SEND_DIV_CLASS) {
                            click = 1;
                        }
                        else {
                            click = 2;
                        }
                    }
                    else return;
                    
                    if (click != 0) {       // if toolbar button clicked
                        
                        // read 'enabled' property
                        var enabled = GM_getValue('gBccEnabled');
                        if (enabled == false) {
                            return;
                        }
                        else if (enabled != true) {
                            // init other properties
                            GM_setValue('gBccEnabled', true);
                            GM_setValue('gBccPopup', false); // FALSE by default
                            GM_setValue('gBccMapFromAddress', false); // FALSE by default
                            enabled = true;
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
                }, true);
            } /* gBccInit */
            
            gBccInit ()
        });
    }
}, true);
