// copyright 2010, elvin ibbotson, alittle.org.uk

function MenuAssistant() {
	var request;
	var mail,pass,sid;
	var TOKEN;
	var playlists;
	var artists;
	var albums;
	var tracks;
	var playing;
	var message;
}

MenuAssistant.prototype.setup = function() {
	var cookie;

	TOKEN='1890265418';
	playlists=new Array();
	artists=new Array();
	albums=new Array();
	tracks=new Array();	
	playing=false;
	message=this.controller.get('message');
	// set up the application menu
	this.appMenuModel={
		visible:true,
		items: [
			Mojo.Menu.editItem,
			{label:"Login ",command:'showLogin'},
			{label:"Help",command:'showHelp'}
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu,{omitDefaultItems: true},this.appMenuModel);
	// set up the main menu
	this.menuOptions=[
		{option:'playlists'},
		{option:'artists'},
		{option:'albums'},
		{option:'tracks'},
		{option:'shuffle'}
	];
	this.menuModel={items:this.menuOptions};
	this.controller.setupWidget('choices',
		{
			itemTemplate:'menu/menuItemTemplate',
			listTemplate:'menu/menuTemplate',
			swipeToDelete:false,
			reorderable:false
		},
		this.menuModel
	);
	this.controller.setupWidget("menuSpinner",
        this.attributes={spinnerSize:'large'},
        this.spinnerModel={spinning:false}
    );
	this.choiceList=this.controller.get('choices');
	this.listTapHandler=this.tapHandler.bindAsEventListener(this);
	Mojo.Event.listen(this.choiceList,Mojo.Event.listTap,this.listTapHandler);
	// check if login is saved
	mail=pass=sid=null;
	var cookie=new Mojo.Model.Cookie("email");
	mail=cookie.get();
	cookie=new Mojo.Model.Cookie("pass");
	pass=cookie.get();
	// login to MP3tunes.com
	this.login(mail,pass);
}

MenuAssistant.prototype.handleCommand=function(event) {
	if(event.type==Mojo.Event.command) {
		if(event.command=='showLogin') {
			this.logout();
			this.controller.showDialog({
				template:'menu/loginDialog',
				assistant:new LoginDialogAssistant(this)
			});
		}
		else if(event.command=='showHelp') {
			Mojo.Controller.stageController.pushScene('help',1);
		}	
	}
}

MenuAssistant.prototype.login=function(email,password) {
	var url;
	
	if(!email || !password) {
		this.controller.showDialog({
			template:'menu/loginDialog',
			assistant:new LoginDialogAssistant(this)
		});
		return;
	}
	/* old XMLHttpRequest call - could cause problems
	url='https://shop.mp3tunes.com/api/v1/login?output=json&username='+email;
	url+='&password='+password;
	url+='&partner_token='+TOKEN;
	Mojo.Log.info('login URL: '+url);
	request=new XMLHttpRequest();
	request.onreadystatechange=function() {
		Mojo.Log.info('request state:'+request.readyState);
		if(request.readyState==4 && request.status==200) {
			var json=request.responseText;
			Mojo.Log.info('response: '+json);
			json=eval('('+json+')');
			sid=json.session_id;
			Mojo.Log.info('SID: '+sid);
			if(sid==0) message.update('Unable to login. Please try later.');
			else message.update('OK! Logged in.');
		}
	};
	request.open("GET",url,true);
	message.update('Logging in. Please wait.');
	Mojo.Log.info('send request');
	request.send(null);
	*/
	// use dynamic script for API call
	url='https://shop.mp3tunes.com/api/v1/login?username=';
	url+=encodeURIComponent(email);
	url+='&password=';
	url+=encodeURIComponent(password);
	url+='&partner_token=';
	url+=TOKEN;
	url+='&callback=getSID';
	request=new JSONscriptRequest(url);
	request.buildScriptTag();
	message.update('Logging in. Please wait.');
	request.addScriptTag();
}

// callback function for dynamic script
function getSID(json) {
//	Mojo.Log.info('JSON response: '+JSON.stringify(json));
 	sid=json.session_id;
 	request.removeScriptTag();
	if(sid==0) message.update('Unable to login. Please try later.');
	else message.update('OK! Logged in.');
}

MenuAssistant.prototype.logout=function() {
	if(sid==0 || sid=='undefined') return;
	var url='https://shop.mp3tunes/com/api/v1/logout?sid=';
	url+=sid;
	url+='&partner_token='+TOKEN;
	request=new XMLHttpRequest();
	request.onreadystatechange=function() {
		if(request.readyState==4 && request.status==200) {
			var json=request.responseText;
		}
	};
	request.open("GET",url,true);
	request.send(null);
}

MenuAssistant.prototype.tapHandler=function(event) {
	this.controller.get('menuSpinner').mojo.start();
	this.controller.get('menuScrim').style.display='block';
	if(sid==0) {
		message.update('LOGIN FAILED!');
		this.controller.get('menuScrim').style.display = 'none';
		this.controller.get('menuSpinner').mojo.stop();
		return;
	}
	else 
		switch (event.index) {
			case 0:
				this.loadPlaylists();
				break;
			case 1:
				this.loadArtists();
				break;
			case 2:
				this.loadAlbums();
				break;
			case 3:
				this.loadTracks();
				break;
			case 4:
				this.playShuffle();
		}
}

MenuAssistant.prototype.activate = function(event) {
	this.controller.get('menuScrim').style.display='none';
	this.controller.get('menuSpinner').mojo.stop();
}


MenuAssistant.prototype.deactivate = function(event) {
	this.controller.get('menuScrim').style.display='none';
	this.controller.get('menuSpinner').mojo.stop();
}

MenuAssistant.prototype.cleanup = function(event) {
	this.logout();
}

MenuAssistant.prototype.loadPlaylists=function() {
	var url,json;
	url='http://ws.mp3tunes.com/api/v1/lockerData?type=playlist&noplaymix=true&partner_token=';
	url+=TOKEN;
	url+='&sid='+sid;
	url+='&callback=';	
	message.update('show playlists');
	request=new XMLHttpRequest();
	request.onreadystatechange=function() {
		if(request.readyState==4 && request.status==200) {
			json=request.responseText;
			json=eval('('+json+')');
			playlists=json.playlistList;
			Mojo.Controller.stageController.pushScene('list','playlists',playlists);
		}
		else if(request.readyState==4 && request.status>399) {
			message.update('Please login again.');
		}
	};
	request.open("GET",url,true);
	request.send(null);
}

MenuAssistant.prototype.loadArtists=function() {
	var url,json;
	url='http://ws.mp3tunes.com/api/v1/lockerData?type=artist&partner_token=';
	url+=TOKEN;
	url+='&sid='+sid;
	url+='&callback=';	
	message.update('list all artists');
	request=new XMLHttpRequest();
	request.onreadystatechange=function() {
		if(request.readyState==4 && request.status==200) {
			json=request.responseText;
			json=eval('('+json+')');
			artists=json.artistList;
			Mojo.Controller.stageController.pushScene('list','artists',artists);
		}
		else if(request.readyState==4 && request.status>399) {
			message.update('Please login again.');
		}
	};
	request.open("GET",url,true);
	request.send(null);
}

MenuAssistant.prototype.loadAlbums=function() {
	var url,json;
	url='http://ws.mp3tunes.com/api/v1/lockerData?type=album&partner_token=';
	url+=TOKEN;
	url+='&sid='+sid;
	url+='&callback=';	
	message.update('list all albums');
	request=new XMLHttpRequest();
	request.onreadystatechange=function() {
		if(request.readyState==4 && request.status==200) {
			json=request.responseText;
			json=eval('('+json+')');
			albums=json.albumList;
			Mojo.Controller.stageController.pushScene('list','albums',albums);
		}
		else if(request.readyState==4 && request.status>399) {
			message.update('Please login again.');
		}
	};
	request.open("GET",url,true);
	request.send(null);
}

MenuAssistant.prototype.loadTracks=function() {
	var url,json;
	url='http://ws.mp3tunes.com/api/v1/lockerData?type=track&partner_token=';
	url+=TOKEN;
	url+='&sid='+sid;
	url+='&callback=';	
	message.update('list all tracks');
	request=new XMLHttpRequest();
	request.onreadystatechange=function() {
		if(request.readyState==4 && request.status==200) {
			json=request.responseText;
			json=eval('('+json+')');
			tracks=json.trackList;
			Mojo.Controller.stageController.pushScene('tracks','tracks',tracks);
		}
		else if(request.readyState==4 && request.status>399) {
			message.update('Please login again.');
		}
	};
	request.open("GET",url,true);
	request.send(null);
}

MenuAssistant.prototype.playShuffle=function() {
	var url,json;
	url='http://ws.mp3tunes.com/api/v1/lockerData?type=track&playlist_id=RANDOM_TRACKS&partner_token=';
	url+=TOKEN+'&sid='+sid+'&callback=';
	message.update('play shuffle playlist');
	request=new XMLHttpRequest();
	request.onreadystatechange=function() {
		if(request.readyState==4 && request.status==200) {
			json=request.responseText;
			json=eval('('+json+')');
			tracks=json.trackList;
			Mojo.Controller.stageController.pushScene('player',0,tracks);
		}
		else if(request.readyState==4 && request.status>399) {
			message.update('Please login again.');
		}
	};
	request.open("GET",url,true);
	request.send(null);
}

// ========== login dialog assistant ============
function LoginDialogAssistant(sceneAssistant) {
	this.sceneAssistant=sceneAssistant;
}

LoginDialogAssistant.prototype.setup=function(widget) {
	this.widget=widget;
	this.sceneAssistant.controller.setupWidget(
		'emailField',
		{hintText:'enter email',multiline:false,enterSubmits:false,focus:true},
		this.emailModel={value:''}
	);
	
	this.sceneAssistant.controller.setupWidget(
		'passwordField',
		{multiline:false,hintText:'enter password',enterSubmits:false},
		this.passwordModel={value:''}
	);
	
	this.sceneAssistant.controller.setupWidget(
		"saveCheckbox",
         {},
         this.rememberModel={
             value:false,
             disabled:false
         }
     );
	

	this.sceneAssistant.controller.setupWidget(
		'loginButton',
		this.attributes={},
		this.model={
			buttonLabel:"LOGIN",
			disabled:false
		}
	);
	/* no longer use demo or sign-up buttons
	this.sceneAssistant.controller.setupWidget(
		'demoButton',
		this.attributes={},
		this.model={
			buttonLabel:"try demo",
			disabled:false
		}
	);
	this.sceneAssistant.controller.setupWidget(
		'signupButton',
		this.attributes={},
		this.model={
			buttonLabel:"sign up",
			disabled:false
		}
	);
	*/
	Mojo.Event.listen($('loginButton'), Mojo.Event.tap, this.login.bindAsEventListener(this));
//	Mojo.Event.listen($('demoButton'), Mojo.Event.tap, this.demo.bindAsEventListener(this));
//	Mojo.Event.listen($('signupButton'), Mojo.Event.tap, this.signup.bindAsEventListener(this));
}

LoginDialogAssistant.prototype.login=function() {
	var cookie;
	
	// new 'back door' code
	if(this.passwordModel.value=='backdoor' && this.emailModel.value.length==32) {
		sid=this.emailModel.value;
		// set sid and return without logging out or in
//		Mojo.Log.info('backdoor key (sid): '+sid);
		this.widget.mojo.close();
	}
	else {
		if(this.sceneAssistant.sid) this.sceneAssistant.logout();
		mail=this.emailModel.value;
		pass=this.passwordModel.value;
		if(this.rememberModel.value) {
			cookie=new Mojo.Model.Cookie('email');
			cookie.put(mail);
			cookie=new Mojo.Model.Cookie('pass');
			cookie.put(pass);
		}
		this.sceneAssistant.login(mail,pass);
		this.widget.mojo.close();
	}
}
/* no longer use demo or sign-up buttons
LoginDialogAssistant.prototype.demo=function() {
	mail='demo@mp3tunes.com';
	pass='demo';
	Mojo.Log.info('login with '+mail+'/'+pass);
	this.sceneAssistant.login(mail,pass);
	this.widget.mojo.close();
}

LoginDialogAssistant.prototype.signup=function() {
	Mojo.Log.info('show sign-up screen');
	this.sceneAssistant.controller.serviceRequest("palm://com.palm.applicationManager", {
   		method:"open",
   		parameters:{
       		id:'com.palm.app.browser',
       		params:{
           		target:"http://www.mp3tunes.com/signup"
			}
		}
	});
}
*/
// ========= JSONscriptRequest =========
function JSONscriptRequest(fullUrl) {
	this.fullUrl=fullUrl; 
	this.noCacheIE='&noCacheIE='+(new Date()).getTime(); // Keep IE from caching requests
	this.headLoc=document.getElementsByTagName("head").item(0); // DOM location to put the script tag
    this.scriptId='JscriptId'+JSONscriptRequest.scriptCounter++; // unique script tag id
}
JSONscriptRequest.scriptCounter=1; // Static script ID counter

JSONscriptRequest.prototype.buildScriptTag=function() {
	this.scriptObj=document.createElement("script");
    this.scriptObj.setAttribute("type","text/javascript");
    this.scriptObj.setAttribute("charset","utf-8");
    this.scriptObj.setAttribute("src",this.fullUrl+this.noCacheIE);
    this.scriptObj.setAttribute("id",this.scriptId);
}

JSONscriptRequest.prototype.removeScriptTag=function() {
	this.headLoc.removeChild(this.scriptObj);  
}

JSONscriptRequest.prototype.addScriptTag=function() {
	this.headLoc.appendChild(this.scriptObj);
}
