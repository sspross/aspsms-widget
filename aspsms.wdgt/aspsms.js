/*********
 * This file is part of the aspsms Widget
 *
 * Version:   0.1 (2006-11-05)
 * Author:    Silvan Spross <spross@netdot.ch>, Christoph Studer <christoph@studer.tv>
 * Licensing: Free to use. Contact me before copying 
 *            anything contained in this widget.
 * Websites:  http://sisprocom.ch/widgets/aspsms/
 *            http://studer.tv/projects-widgets.page
 */


/******* Currently used SMS and currently left characters */
var curr_sms = null;
var curr_left = null;


/******* BUTTONS */
var whiteInfoButton;
var doneButton;
var sendButton;

/******* PREFERENCES */
var username;
var password;
var originator;

/******* CONSTANTS */

/* Maximum number of characters per SMS */
var max_len = 160;

/* Colors */
var errorColor = "#f00";
var sentColor = "#360";

/******* INITIALIZATION */

/**
 * Called by the onload event of the widget.
 */
function init()
{
	loadPrefs();
	
	sendButton = createGenericButton(document.getElementById('send'), 'Send', send);
	doneButton = createGenericButton(document.getElementById('done'), 'Done', hidePrefs);
	
	whiteInfoButton = new AppleInfoButton(document.getElementById("infoButton"), document.getElementById("front"), "white", "white", showPrefs);
	
	var msg_elem = document.getElementById('message');
	var rcp_elem = document.getElementById('recipients');
	
	msg_elem.addEventListener('keyup',updateCounter);
	rcp_elem.addEventListener('keyup',ab_recpChanged);
	rcp_elem.addEventListener('keyup',clearColor);
	msg_elem.addEventListener('keyup',clearColor);
	rcp_elem.addEventListener('keyup',savePrefs);
	msg_elem.addEventListener('keyup',savePrefs);
	
	document.getElementById('ab-icon').addEventListener('click',ab_startSearch);	
	updateCounter();
	
	if (!username || !password || !originator)
	{
		showMessage('Enter login info!')
		showPrefs();
	}
}

/**
 * Update the number of used SMS / left characters
 * (also updates the display)
 */
function updateCounter()
{
	var msg_elem = document.getElementById('message');
	var len = msg_elem.value.length;
	curr_sms = Math.ceil(len / max_len);
	curr_left = curr_sms*max_len - len;
	var lbl_elem = document.getElementById('num-left-label');
	if (curr_sms > 0)
	{
		lbl_elem.innerHTML = curr_sms + ' SMS / ' + curr_left + ' left';
	}
	else
		lbl_elem.innerHTML = 'Please enter a message';
}

/**
 * Send the SMS
 * - Checks, whether recipients and message entered
 * - Disables the UI, shows the "busy indicator"
 * - Sends the SMS
 * - Displays 
 * - Enables the UI, hides the "busy indicator"
 */
function send()
{
	updateCounter();
	
	if (!username || !password || !originator)
	{
		showError('Enter login info!');
		showPrefs();
		return;
	}
	
	var msg_elem = document.getElementById('message');
	var rcp_elem = document.getElementById('recipients');
	
	var login = escape(username);
	var passwd = escape(password);
	var origin = escape(originator);
	var to = escape(rcp_elem.value);
	var msg = msg_elem.value;
	
	if (!to)
	{
		showError('Recipients missing',true);
		return;
	}
	
	if (!msg)
	{
		showError('Enter a message',true);
		return;
	}
	
	var msg_part = null;
	var start = 0;
	var done = 0;
	var statusmsg = ''
	
	/* Show progress indicator */
	document.getElementById('indicator').style.display='block';
	msg_elem.setAttribute("disabled",true);
	rcp_elem.setAttribute("disabled",true);

	/* Send messages */
	/*for (var i = 0; i < curr_sms; i++)
	{*/
		msg_part = msg /*.substr(start,max_len);*/
	
		xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "http://xml1.aspsms.com:5061/xmlsvr.asp", false);
 		
 		var xmltext = "<?xml version='1.0' encoding='ISO-8859-1'?>" +
			"<aspsms>" +
				"<Userkey>" + login + "</Userkey>" +
				"<Password>" + passwd + "</Password>" +
				"<Originator>" + origin + "</Originator>" +
				"<AffiliateId>123415</AffiliateId>" +
				"<Recipient>" +
					"<PhoneNumber>" + to + "</PhoneNumber>" +
				"</Recipient>" +
				"<MessageData>" + encode(msg_part) + "</MessageData>" +
				"<Action>SendTextSMS</Action>" +
			"</aspsms>";
 		
		xmlhttp.setRequestHeader("Content-Type", "text/xml");
		xmlhttp.send(xmltext);
		
		/*if (curr_sms > 1)
		{
			statusmsg = 'Sending message ' + (i+1) + '...';
		}
		else
		{*/
			statusmsg = 'Sending message...';
		/*}*/
		
		while (xmlhttp.readyState != 4)
		{
			showMessage(statusmsg,true);
		}
		
		var xmldoc = (new DOMParser()).parseFromString(xmlhttp.responseText,"text/xml");
		var errorCode = xmldoc.getElementsByTagName("ErrorCode").item(0).firstChild.nodeValue;
  		var errorDescription = xmldoc.getElementsByTagName("ErrorDescription").item(0).firstChild.nodeValue;
		
		if (errorCode == 1)
		{
			done++;
		}
		else
		{
			showError(errorDescription);
			break;
		}
		
		start += max_len;
	/*}*/
	if (done < 1)
	{
		msg_elem.style.color = errorColor;
		rcp_elem.style.color = errorColor;
	}
	else
	{
		if (done > 1)
		{
			showMessage(done + ' messages sent.');
		}
		else
		{
			showMessage('One message sent.');
		}
		
		msg_elem.style.color = sentColor;
		rcp_elem.style.color = sentColor;
	}
	
	msg_elem.removeAttribute("disabled");
	rcp_elem.removeAttribute("disabled");
	document.getElementById('indicator').style.display='none';
}

/* PREFERENCES */

/**
 * Shows the Preferences panel
 * Also does the transition effect.
 */
function showPrefs()
{
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	
	if (typeof username != 'undefined')
	{
		document.getElementById('username').value = username;
	}
	else
	{
		document.getElementById('username').value = '';
	}
	
	if (typeof password != 'undefined')
	{
		document.getElementById('password').value = password;
	}
	else
	{
		document.getElementById('password').value = '';
	}
	
	if (typeof originator != 'undefined')
	{
		document.getElementById('originator').value = originator;
	}
	else
	{
		document.getElementById('originator').value = '';
	}
	
	if (window.widget)
	{
		widget.prepareForTransition("ToBack");		// freezes the widget so that you can change it without the user noticing
	}
	
	front.style.display="none";		// hide the front
	back.style.display="block";		// show the back
	
	if (window.widget)
	{
		setTimeout ('widget.performTransition();', 0);		// and flip the widget over	
	}
}

/**
 * Loads saved preferences
 */
function loadPrefs()
{
	if (window.widget)
	{
		username = widget.preferenceForKey('username');
		password = widget.preferenceForKey('password');
		originator = widget.preferenceForKey('originator');
		
		var msg = widget.preferenceForKey('message');
		var rcp = widget.preferenceForKey('recipients');
		
		if (typeof msg != 'undefined')
		{
			document.getElementById('message').value = msg;
		}
	
		if (typeof rcp != 'undefined')
		{
			document.getElementById('recipients').value = rcp;
		}
	}
}

/**
 * Stores current preferences
 * This method is called:
 * - when recipients / message field is changed
 * - when the preferences panel is hidden (switch to front)
 */
function savePrefs()
{
	if (window.widget)
	{
		widget.setPreferenceForKey(username,'username');
		widget.setPreferenceForKey(password,'password');
		widget.setPreferenceForKey(originator,'originator');
		widget.setPreferenceForKey(document.getElementById('message').value,'message');
		widget.setPreferenceForKey(document.getElementById('recipients').value,'recipients');
	}
}


/**
 * Hides the preferences panel
 * Also does the transition effect to the front.
 */
function hidePrefs()
{
	hideMessage();
	hideError();
	
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	
	if (window.widget)
	{
		widget.prepareForTransition("ToFront");		// freezes the widget and prepares it for the flip back to the front
	}
	
	back.style.display="none";			// hide the back
	front.style.display="block";		// show the front
	
	username = document.getElementById('username').value;
	password = document.getElementById('password').value;
	originator = document.getElementById('originator').value;
	
	savePrefs();
	
	if (window.widget)
	{
		setTimeout ('widget.performTransition();', 0);		// and flip the widget back to the front
	}
}

/**
 * Opens the author's webpage in the default browser
 */
function pref_openWebpage()
{
	if (window.widget)
	{
		widget.openURL(pref_webpageURL);
	}
}

/**
 * Resets the colors of recipients / message field
 * (they are colored blue/red after sending/failure)
 */
function clearColor()
{
	document.getElementById('message').style.color = '';
	document.getElementById('recipients').style.color = '';
}


/******* ERROR AND NOTIFICATION DISPLAY */

var error_timeout = 7500;
var error_handler;

function showError(str,doHide)
{
	clearTimeout(error_handler);
	hideMessage();
	document.getElementById('error').innerHTML = str;
	document.getElementById('error').style.display = 'block';
	if (doHide)
	{
		error_handler = setTimeout(_fadeError, error_timeout);
	}
}

function hideError()
{
	clearTimeout(error_handler);
	document.getElementById('error').style.display = 'none';
	document.getElementById('error').style.opacity = 1.0;
}

var message_timeout = 7500;
var message_handler;

function showMessage(str,noHide)
{
	clearTimeout(message_handler);
	hideError();
	document.getElementById('msg').innerHTML = str;
	document.getElementById('msg').style.display = 'block';
	if (!noHide)
	{
		message_handler = setTimeout(_fadeMessage, message_timeout);
	}
}

function hideMessage()
{
	clearTimeout(message_handler);
	document.getElementById('msg').style.display = 'none';
	document.getElementById('msg').style.opacity = 1.0;
}

function _fadeError()
{
	var animator = new AppleAnimator(500,13);
	animator.addAnimation( new AppleAnimation(1.0,0.0,_fadeError_Step) );
	animator.oncomplete = hideError;
	animator.start();
}

function _fadeError_Step(animation, now, first, done)
{
	document.getElementById('error').style.opacity = now;
}

function _fadeMessage()
{
	var animator = new AppleAnimator(500,13);
	animator.addAnimation( new AppleAnimation(1.0,0.0,_fadeMessage_Step) );
	animator.oncomplete = hideMessage;
	animator.start();
}


/**** ADDRESS BOOK SEARCH */

function ab_recpChanged(event)
{
	if (event.keyCode == 13)
	{
		ab_startSearch();
	}
}

function ab_startSearch()
{
	var rcp_elem = document.getElementById('recipients');
	var results = searchForNumber(rcp_elem.value);
	if (results.length > 0)
	{
		showMessage(results[0].name)
		var number = results[0].number;
		number = _strRemove(number,' ');
		number = _strRemove(number,'(');
		number = _strRemove(number,')');
		
		rcp_elem.value = number;
		
		savePrefs();
	}
	else
	{
		showError('No results found.',true);
	}
	rcp_elem.focus();
	rcp_elem.setSelectionRange(0,rcp_elem.value.length);
}

function _strRemove(str,chr)
{
	while (str.indexOf(chr) >= 0)
	{
		str = str.replace(chr,'');
	}
	return str;
}

function searchForNumber(str)
{
	if (window.widget)
	{
		var command = "./aspsms_ab " + str;
		
		var result = widget.system(command,null);
		if (result.status == 0)
		{
			return _turnOutputToNumbers(result.outputString);
		}
		else
		{
			showError("Addressbook error!",true);
		}
	}
	else
		return null;
}

function _turnOutputToNumbers(str)
{
	var array = new Array();
	if (!str)
		return array;
	
	var lines = str.split("\n");
	
	var line;
	var parts;
	var entry;
	for (var i in lines)
	{
		line = lines[i];
		parts = line.split("\t");
		array[i] = {name: parts[0], number: parts[1]};
	}
	return array;
}

function _fadeMessage_Step(animation, now, first, done)
{
	document.getElementById('msg').style.opacity = now;
}

function encode(input) 
{
	output = "";
	for (i=0;i<input.length; i++)
	{
		output = output + checkSpecialChar(input.charCodeAt(i));
	}
	return output;
}

function checkSpecialChar(charcode)
{
	if (charcode == 38 || charcode == 60 || charcode == 62 || (charcode >= 128 && charcode <= 255))
	{
		return "&#" + charcode + ";";
	}
	else
	{
		return String.fromCharCode(charcode);
	}
}