// copyright 2010, elvin ibbotson, alittle.org.uk

function ListAssistant(title,list) {
	this.list=list;
	this.title=title;
}

ListAssistant.prototype.setup = function() {
	var template;
	
	this.controller.get('message').update('');
	this.controller.get('listHeader').update(this.title);
	switch(this.title) {
		case 'playlists':
			template='list/playlistTemplate';
			break;
		case 'artists':
			template='list/artistTemplate';
			break;
		case 'albums':
			template='list/albumTemplate';
			break;
		default: // albums for artist
			template='list/artistAlbumTemplate';
			break;
	}
	// set up the application menu
	this.appMenuModel={
		visible:true,
		items: [
			Mojo.Menu.editItem,{label:"Help", command:'showHelp'}
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu,{omitDefaultItems:true},this.appMenuModel);
	this.listModel={items:this.list};
	this.controller.setupWidget('list',
		{
			itemTemplate:template,
			listTemplate:'list/listTemplate',
			swipeToDelete:false,
			reorderable:false
		},
		this.listModel
	);
	this.controller.setupWidget("listSpinner",
        this.attributes={spinnerSize:'large'},
        this.spinnerModel={spinning:false}
    );
	this.listTapHandler=this.tapHandler.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get('list'),Mojo.Event.listTap,this.listTapHandler);
}

ListAssistant.prototype.handleCommand=function(event) {
	if(event.command=='showHelp') {
		Mojo.Controller.stageController.pushScene('help',4);	
	}
}

ListAssistant.prototype.tapHandler=function(event) {
	var id,name;
	
	this.controller.get('listSpinner').mojo.start();
	this.controller.get('listScrim').style.display='block';
	switch(this.title) {
		case 'playlists':
			id=this.list[event.index].playlistId;
			name=this.list[event.index].playlistTitle;
			this.loadTracks(id,name,'playlist');
			break;
		case 'artists':
			id=this.list[event.index].artistId;
			name=this.list[event.index].artistName;
			this.loadAlbums(id,name);
			break;
		default:
			id=this.list[event.index].albumId;
			name=this.list[event.index].albumTitle;
			this.loadTracks(id,name,'album');
	}
}

ListAssistant.prototype.activate = function(event) {
	this.controller.get('listScrim').style.display='none';
	this.controller.get('listSpinner').mojo.stop();	
}


ListAssistant.prototype.deactivate = function(event) {
	this.controller.get('listScrim').style.display='none';
	this.controller.get('listSpinner').mojo.stop();
}

ListAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}

ListAssistant.prototype.loadTracks=function(id,name,type) {
	var url,json;
	
	switch(type) {
		case 'playlist':
			url='http://ws.mp3tunes.com/api/v1/lockerData?type=track&playlist_id='+id;
			break;
		case 'artist': // NOT NEEDED?
			url='http://ws.mp3tunes.com/api/v1/lockerData?type=track&artist_id='+id;
			break;
		case 'album':
			url='http://ws.mp3tunes.com/api/v1/lockerData?type=track&album_id='+id;
	}
	url+='&partner_token='+TOKEN+'&sid='+sid;
	url+='&callback=';
	request=new XMLHttpRequest();
	request.onreadystatechange=function() {
		if(request.readyState==4 && request.status==200) {
			json=request.responseText;
			json=eval('('+json+')');
			tracks=json.trackList;
			Mojo.Controller.stageController.pushScene('tracks',name,tracks);
		}
	};
	request.open("GET",url,true);
	request.send(null);
}

ListAssistant.prototype.loadAlbums=function(id,name) {
	var url,json;
	
	url='http://ws.mp3tunes.com/api/v1/lockerData?type=album&noplaymix=true&artist_id=';
	url+=id;
	url+='&partner_token='+TOKEN+'&sid='+sid;
	url+='&callback=';
	request=new XMLHttpRequest();
	request.onreadystatechange=function() {
		if(request.readyState==4 && request.status==200) {
			json=request.responseText;
			json=eval('('+json+')');
			albums=json.albumList;
			for(var i=0;i<albums.length;i++) Mojo.Log.info('album '+i+': '+albums[i].albumTitle);
			Mojo.Controller.stageController.pushScene('list',name,albums);
		}
	};
	request.open("GET",url,true);
	request.send(null);
}

