// copyright 2010, elvin ibbotson, alittle.org.uk

function PlayerAssistant(index,list) {
	this.track=index;
	this.list=list;
	this.audio;
	this.played;
	this.duration;
	this.timer;
	this.connection;
}

PlayerAssistant.prototype.setup=function() {
	var val;
	this.controller.get('message').update('');
	// set up the application menu
	this.appMenuModel={
		visible:true,
		items:[Mojo.Menu.editItem,{label:"Help", command:'showHelp'}]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu,{omitDefaultItems:true},this.appMenuModel);
	this.progressBarModel={progress:0.3};
	this.controller.setupWidget("playProgress",
        this.attributes={modelProperty:"progress"},
        this.model=this.progressBarModel
    );
	this.controlModel={
		items:[
			{},
			{items:[
				{iconPath:'images/previous.png',command:'previousTrack'},
				{iconPath:'images/pause.png',command:'pause'},
				{iconPath:'images/next.png',command:'nextTrack'}
			]},
			{}
		]
	} 
	this.controller.setupWidget(Mojo.Menu.commandMenu,
		this.attributes={
        	spacerHeight:0,
        	menuClass:'no-fade'
    	},
		this.controlModel
	);
	// check connection status
	connection=1; // default
	this.controller.serviceRequest('palm://com.palm.connectionmanager', {
		method: 'getstatus',
		parameters: {},
		onSuccess: function(response) {
			val=response.wan.state;
			if(val=='disconnected') connection=0;
			val=response.wan.network;
			if(val=='hsdpa' || val=='umts') connection==2;
			if(val=='unusable') connection=0;
			val=response.wifi.state;
			if(val=='connected') connection=2;
			val=response.isInternetConnectionAvailable;
			if(val==false) connection=0;
			if(connection<1) this.controller.get('albumArt').innerHTML='NO INTERNET?';
			Mojo.Controller.stageController.delegateToSceneAssistant("streamTrack");
		},
		onFailure: function(response){Mojo.Log.info('connection check failed');}
	});
}

PlayerAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


PlayerAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

PlayerAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}

PlayerAssistant.prototype.handleCommand=function(event){
	if(event.type==Mojo.Event.command) {
		if(event.command=='showHelp') {
			Mojo.Controller.stageController.pushScene('help',7);	
		}
		else if(event.command=="previousTrack") this.previousTrack();
		else if(event.command=="pause") this.pause();
		else if(event.command=="play") this.play();
		else if(event.command=="nextTrack") this.nextTrack();
	}
}

PlayerAssistant.prototype.streamTrack=function() {
	var track,url,art,time;
	
	track=this.track;
	if(playing) this.pause();
	this.fkey=this.list[track].trackFileKey;
	this.albumTitle=this.list[track].albumTitle;
	this.artistName=this.list[track].artistName;
	this.trackTitle=this.list[track].trackTitle;
	this.duration=Math.floor(this.list[track].trackLength/1000);
	this.controller.get('albumTitle').update(this.albumTitle);
	this.controller.get('artistName').update(this.artistName);
	this.controller.get('trackTitle').update(this.trackTitle);
	time=Math.floor(this.duration/60)+':';
	if(this.duration%60<10) time+='0';
	time+=this.duration%60;
	this.controller.get('length').update(time);
	this.controller.get('played').update('loading');
	this.progressBarModel.progress=0.0;
	this.controller.modelChanged(this.progressBarModel,this);
	this.audio=new Audio();
	url=this.list[track].playURL;
	if(connection<2) url+='&bitrate=28000';
	this.audio.src=url;
	this.controller.get('feedback').update('connection: '+connection+' URL: '+url);
	this.play();
	if(this.list[track].hasArt>0) {
		art='http://content.mp3tunes.com/storage/albumartget/'+this.fkey;
		art+='?partner_token='+TOKEN+'&sid='+sid;
	}
	else art='images/coverLogo.png';
	this.controller.get('art').src=art;
	this.controller.get('albumArt').style.opacity=1.0; // ***** NEW ******
}

PlayerAssistant.prototype.progress=function() {
	var time;
	this.played=Math.floor(this.audio.currentTime);
	this.controller.get('feedback').update(this.audio.readyState);
	this.progressBarModel.progress=this.played/this.duration;
	this.controller.modelChanged(this.progressBarModel,this);
	if(this.played>0) {
		time=Math.floor(this.played/60)+':';
		if(this.played%60<10) time+='0';
		time+=this.played%60;
		this.controller.get('played').update(time);
	}
	if(playing) {
		if((this.duration-this.played)<6) {
			this.controller.get('albumArt').style.opacity=0.0; // ***** NEW ******
			setTimeout('Mojo.Controller.stageController.delegateToSceneAssistant("nextTrack");',3000);
		}
		else this.timer=setTimeout('Mojo.Controller.stageController.delegateToSceneAssistant("progress");',1000);
	}
	
}

PlayerAssistant.prototype.pause=function() {
	if(!this.audio) 
		return;
	if(playing) {
		this.audio.pause();
		this.controlModel.items[1].items[1]={
			iconPath:'images/play.png',
			command:'play'
		};
		this.controller.modelChanged(this.controlModel,this);
		playing=false;
		clearTimeout(this.timer);
	}
}

PlayerAssistant.prototype.play=function() {
	if(!this.audio) {
		Mojo.Log.info('no audio!!!');
		return;
	}	
	if(!playing) {
		this.audio.play();
		this.controlModel.items[1].items[1]={
			iconPath:'images/pause.png',
			command:'pause'
		};
		this.controller.modelChanged(this.controlModel,this);
		playing=true;
		this.timer=setTimeout('Mojo.Controller.stageController.delegateToSceneAssistant("progress");',5000);
	}
}

PlayerAssistant.prototype.previousTrack=function() {
	this.track--;
	if(this.track<0) this.track=this.list.length-1;
	this.streamTrack(this.track); // queue previous track
}

PlayerAssistant.prototype.nextTrack=function() {
	this.track++;
	if(this.track>=this.list.length) this.track=0;
	this.streamTrack(this.track); // queue next track
}
