// copyright 2010, elvin ibbotson, alittle.org.uk

function TracksAssistant(title,list) {
	this.list=list;
	this.title=title;
}

TracksAssistant.prototype.setup = function() {
	var name,compilation,template,i;
	
	this.controller.get('message').update('');
	name=this.list[0].artistName;
	compilation=false;
	for(i=0;i<this.list.length;i++) {
		if(this.list[i].artistName!=name) compilation=true;
	}
	if(compilation) this.controller.get('listHeader').update(this.title);
	else this.controller.get('listHeader').update(this.title+' | '+name);	
	// set up the application menu
	this.appMenuModel={
		visible:true,
		items:[Mojo.Menu.editItem,{label:"Help", command:'showHelp'}]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu,{omitDefaultItems:true},this.appMenuModel);
	this.listModel={items:this.list};
	if(compilation) template='tracks/trackItemTemplate';
	else template='tracks/artistItemTemplate';
	this.controller.setupWidget('trackList',
		{
			itemTemplate:template,
			listTemplate:'tracks/trackListTemplate',
			swipeToDelete:false,
			reorderable:false
		},
		this.listModel
	);
	this.controlModel={
		items:[
			{iconPath:'images/shuffle.png',command:'shuffle'},
			{iconPath:'images/play.png',command:'playAll'}
		]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu,
		this.attributes={
        	spacerHeight:0,
        	menuClass:'no-fade'
    	},
		this.controlModel
	);
	this.controller.setupWidget("tracksSpinner",
        this.attributes={spinnerSize:'large'},
        this.spinnerModel={spinning:false}
    );
	this.listTapHandler=this.tapHandler.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get('trackList'),Mojo.Event.listTap,this.listTapHandler);
}

TracksAssistant.prototype.tapHandler=function(event) {
	var index=event.index;
	this.controller.get('tracksSpinner').mojo.start();
	this.controller.get('tracksScrim').style.display='block';
	Mojo.Controller.stageController.pushScene('player',index,this.list);
}

TracksAssistant.prototype.handleCommand=function(event) {
	if(event.type==Mojo.Event.command) {
		if(event.command=='showHelp') {
			Mojo.Controller.stageController.pushScene('help',6);	
		}
		else if(event.command== "shuffle") this.shuffleTracks();
		else if(event.command=="playAll") Mojo.Controller.stageController.pushScene('player',0,this.list);	
	}
}

TracksAssistant.prototype.activate = function(event) {
	this.controller.get('tracksScrim').style.display='none';
	this.controller.get('tracksSpinner').mojo.stop();
}


TracksAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

TracksAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}

TracksAssistant.prototype.shuffleTracks=function() {
	this.list.sort(function() {return 0.5-Math.random();});
	this.controller.modelChanged(this.listModel);
}
