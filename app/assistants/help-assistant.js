// copyright 2010, elvin ibbotson, alittle.org.uk

function HelpAssistant(screen) {
	this.screen=screen;
}

HelpAssistant.prototype.setup = function() {
	var top;
	this.controller.get('helpScreen').src='images/help'+this.screen+'.png';		
	this.controlModel={
		items:[
			{iconPath:'images/back.png',command:'back'},
			{iconPath:'images/play.png',command:'forward'}
		]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu,
		this.attributes={
        	spacerHeight:0,
        	menuClass:'no-fade'
    	},
		this.controlModel
	);
}

HelpAssistant.prototype.handleCommand=function(event) {
	if(event.command=="back") this.screen--;
	if(this.screen<1) this.screen=8;
	else if(event.command=="forward") this.screen++;
	if(this.screen>8) this.screen=1;
	this.controller.get('helpScreen').src='images/help'+this.screen+'.png';	
}

HelpAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


HelpAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

HelpAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
