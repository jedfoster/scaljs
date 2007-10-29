// scal.js v0.1_beta8, 2007-10-19
//
//   - A Calendar based on the fabulous script.aculo.us and prototype js libraries, which means script.aculo.us and
//     Prototype.js are required.
//
//   - Turns any element into a calendar, though for practical reasons, DIVs are best suited.
//
// Copyright (c) 2007 Jamie Grove with regards to:
//        Sam Stephenson @ http://www.prototype.js
//        Thomas Fuchs @ http://script.aculo.us, http://mir.aculo.us
//        ... and lots o' folks who worked on these great libraries!
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Extending Date to support succ().  This will be useful for quickly generating ranges.
Date.prototype.succ = function() {
		var sd = new Date(this.getFullYear(),this.getMonth(),this.getDate()+1);
		sd.setHours(this.getHours(),this.getMinutes(),this.getSeconds(),this.getMilliseconds());
		return sd;
	};
// Extending Date to calculate the first and last of the month.  Use for obvious reasons.
Date.prototype.firstofmonth = function () {
		return new Date(this.getFullYear(),this.getMonth(),1);
	};
Date.prototype.lastofmonth = function() {
		return new Date(this.getFullYear(),this.getMonth()+1,0);
	};

scalmonthnames = new Array(
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
	);

scaldaynames = new Array(
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
	);

// borrowed from http://www.codeproject.com/jscript/dateformat.asp
Date.prototype.format = function(f)
	{
	    if (!this.valueOf())
	        return '&nbsp;';

	    var d = this;

	    return f.replace(/(yyyy|mmmm|mmm|mm|dddd|ddd|dd|hh|nn|ss|a\/p)/gi,
	        function($1)
	        {
	            switch ($1.toLowerCase())
	            {
	            case 'yyyy': return d.getFullYear();
	            case 'mmmm': return scalmonthnames[d.getMonth()];
	            case 'mmm':  return (scalmonthnames[d.getMonth()]).substr(0, 3);
	            case 'mm':   return (d.getMonth() + 1);
	            case 'dddd': return scaldaynames[d.getDay()];
	            case 'ddd':  return scaldaynames[d.getDay()].substr(0, 3);
	            case 'dd':   return d.getDate();
	            case 'hh':   return ((h = d.getHours() % 12) ? h : 12);
	            case 'nn':   return d.getMinutes();
	            case 'ss':   return d.getSeconds();
	            case 'a/p':  return d.getHours() < 12 ? 'a' : 'p';
	            }
	        }
	    );
	};

// borrowed from http://www.quirksmode.org/js/week.html
Date.prototype.weeknumber = function(){
	Year = takeYear(this);
	Month = this.getMonth();
	Day = this.getDate();
	now = Date.UTC(Year,Month,Day+1,0,0,0);
	var Firstday = new Date();
	Firstday.setYear(Year);
	Firstday.setMonth(0);
	Firstday.setDate(1);
	then = Date.UTC(Year,0,1,0,0,0);
	var Compensation = Firstday.getDay();
	if (Compensation > 3) { Compensation -= 4; }
	else { Compensation += 3; }
	return Math.round((((now-then)/86400000)+Compensation)/7);
	function takeYear(theDate)
	{
		x = theDate.getYear();
		var y = x % 100;
		y += (y < 38) ? 2000 : 1900;
		return y;
	}
}

// The scal class definition proper.
var scal = Class.create();
scal.prototype = {
	initialize: function (element,update,options){

		this.startdate = new Date();
		this.startdate.setHours(0,0,0,0);

		this.updateelement = update;
		this.baseelement = $(element);
        this.calobserved = [];
		this.options = options;
		
		this.titleformat = this.options.titleformat || 'mmmm yyyy';
		this.closebutton = this.options.closebutton || 'X';
		this.prevbutton = this.options.prevbutton || '&laquo;';
		this.nextbutton = this.options.nextbutton || '&raquo;';
		this.openeffect = this.options.openeffect || Effect.Appear;
		this.closeeffect = this.options.closeeffect || Effect.Fade;
		this.openeffect.duration = 0;
		this.closeeffect.duration = 0;
		this.exactweeks = this.options.exactweeks || false;
		this.dayheadlength = this.options.dayheadlength || 2;
		this.weekdaystart = this.options.weekdaystart || 0;
		
		year = this.options.year || this.startdate.getFullYear();
		month = this.options.month-1 || 0;
		day = this.options.day || 1;

		// if defaults set for year, month, and day then assume nothing passed and keep current date
		if (month != 0 && day != 1){
			this.startdate.setYear(year);
			this.startdate.setMonth(month);
			this.startdate.setDate(day);
		};

		this.displayed = false;
		this.setCurrentDate(this.startdate);
		this.selecteddate = new Date(this.currentdate.getFullYear(),this.currentdate.getMonth(),this.currentdate.getDate());

		this.planner = {};
	},
	setCurrentDate: function(date){
		this.currentdate = new Date(date.getFullYear(),date.getMonth(),date.getDate());
		this.firstofmonth = this.currentdate.firstofmonth();
		this.lastofmonth = this.currentdate.lastofmonth();
	},
	buildCalendar: function(){
		// Set local variables to house the first and last date to be used on the calendar
		// Actually, one really only needs to set the first date and then just increment while
		// building the array.  However, if the control will support multiple month displays
		// side by side, it might be convenient to have this built in.
		firstdaycal = new Date(this.firstofmonth.getFullYear(),this.firstofmonth.getMonth(),this.firstofmonth.getDate());
		lastdaycal = new Date(this.lastofmonth.getFullYear(),this.lastofmonth.getMonth(),this.lastofmonth.getDate());
		firstdaycal.setDate(firstdaycal.getDate() - firstdaycal.getDay() + this.weekdaystart);
		lastdaycal.setDate(lastdaycal.getDate() + (6-lastdaycal.getDay()));
		this.calendar = null;
		
		// determine the number of weeks to build out
		if (this.exactweeks){
			weeks = this.lastofmonth.weeknumber()-this.firstofmonth.weeknumber()+1;
		}else{
			weeks = 6;
		}
		this.calendar = new Array(weeks); for (i = 0; i < this.calendar.length; ++ i)
			this.calendar[i] = new Array(7);

		tempdate = new Date(firstdaycal.getFullYear(),firstdaycal.getMonth(),firstdaycal.getDate());

		for (week=0; week < this.calendar.length; ++ week){
			for (day=0; day < this.calendar[week].length; ++ day){
				this.calendar[week][day] = tempdate;
				tempdate = new Date(tempdate.getFullYear(),tempdate.getMonth(),tempdate.getDate()+1);
			};
		};

	},
	showCalendar: function(){
		if (typeof this.calendar == 'undefined'){
			this.buildCalendar();
		}
		this.getCalendar();
	},
	closeCalendar: function(){
		if (this.displayed){
			this.closeeffect(this.baseelement,{duration:this.closeeffect.duration});
			this.displayed = false;
		}
	},
	openCalendar: function(){
		if (!this.displayed){
			this.openeffect(this.baseelement,{duration:this.openeffect.duration});
			this.displayed = true;
		}
	},
	getCalendar: function(){
		//new Draggable(this.baseelement);
		this.baseelement.update(); // zap the current calendar
		this.baseelement.calendar = this.calendar; // convenience handle to the calendar array
		
		cal_header = new Element('div',{id:'cal_header'}).addClassName('calheader');

		// Calendar navigation controls
	
		// Close Calendar Button
		cal_close = new Element('div',{id:'cal_close'});
		// This bit of code allows you to pass an HTML element to be the button instead of text.
		if (typeof this.closebutton == 'object'){
			cal_close.appendChild(this.closebutton);
		}else{
			cal_close.update(this.closebutton);
		}
		cal_close.calinstance = this;
		cal_close.addClassName('calcontrol').addClassName('calclose').observe('click',this.closecalendar);
		cal_header.appendChild(cal_close);
        this.calobserved.push(cal_close);
		cal_close = null;
	
		// Previous Month Button
		prevmonth = new Element('div',{id:'cal_prevmonth'});
		// This bit of code allows you to pass an HTML element to be the button instead of text.
		if (typeof this.prevbutton == 'object'){
			prevmonth.appendChild(this.prevbutton);
		}else{
			prevmonth.update(this.prevbutton);
		}
		prevmonth.calinstance = this;
		prevmonth.addClassName('calcontrol').addClassName('calprevmonth').observe('click',this.prevmonth);
		cal_header.appendChild(prevmonth);
        this.calobserved.push(prevmonth);
		prevmonth = null;

		// Next Month Button
		nextmonth = new Element('div',{id:'cal_nextmonth'});
		// This bit of code allows you to pass an HTML element to be the button instead of text.
		if (typeof this.nextbutton == 'object'){
			nextmonth.appendChild(this.nextbutton);
		}else{
			nextmonth.update(this.nextbutton);
		}
		nextmonth.calinstance = this;
		nextmonth.addClassName('calcontrol').addClassName('calnextmonth').observe('click',this.nextmonth);
		cal_header.appendChild(nextmonth);
        this.calobserved.push(nextmonth);
		nextmonth = null;

		// Calendar Title
		cal_title = new Element('div',{id:'cal_title'});
		cal_title.update(this.currentdate.format(this.titleformat));
		cal_title.calinstance = this;
		cal_title.addClassName('caltitle').observe('click',this.returntocurrentselecteddate);
		cal_header.appendChild(cal_title);
        this.calobserved.push(cal_title);
		cal_title = null;
		
		this.baseelement.appendChild(cal_header);
		cal_header = null;
		
		cal_wrapper = new Element('div',{id:'cal_wrapper'}).addClassName('calwrapper');
		this.baseelement.appendChild(cal_wrapper);

		// Add a day of the week header

		row = new Element('div',{id:'cal_week_name'}).addClassName('weekbox').addClassName('weekboxname');
		for (day=0; day < this.calendar[0].length-1; ++ day){
			cell = new Element('div',{id:'cal_day_name_'+day});
			$(cell).addClassName('daybox').addClassName('dayboxname').update(this.calendar[0][day].format('dddd').substr(0,this.dayheadlength));
			$(row).appendChild(cell);
			cell = null;
		}
		day = this.calendar[0].length-1;
		cell = new Element('div',{id:'cal_day_name_'+day}).addClassName('daybox').addClassName('dayboxname').update(this.calendar[0][day].format('dddd').substr(0,this.dayheadlength));
		cell.addClassName('endweek');
		$(row).appendChild(cell);
		$(cal_wrapper).appendChild(row);
		row = null;

		cal_weeks_wrapper = new Element('div',{id:'cal_weeks_wrapper'}).addClassName('calweekswrapper');
		$(cal_wrapper).appendChild(cal_weeks_wrapper);
		
		// Loop through the calendar array and create DOM elements to display calendar.
		// We begin with a loop through the 'weeks' and then process each day in the following loop
		for (week=0; week < this.calendar.length; ++ week){
			row = new Element('div',{id:'cal_week_'+week}).addClassName('weekbox');
            for (day=0; day < this.calendar[week].length-1; ++ day){
				cell = this.buildday(week,day);
				$(row).appendChild(cell);
				cell = null;
			};
			cell = this.buildday(week,this.calendar[week].length-1);
			cell.addClassName('endweek');
			$(row).appendChild(cell);
			cell = null;
			$(cal_weeks_wrapper).appendChild(row);
			row = null;
		};

		cal_wrapper = null;
		cal_weeks_wrapper = null;
		// all done building the calendar.  Now, display it if necessary.
		this.openCalendar();
	},
	buildday: function(week,day){
		tempdate = this.calendar[week][day];
		cellid = 'cal_day_'+week+'_'+day;
		cell = new Element('div',{id:cellid});
		// add convenience values to the cell object
		cell.week = week;
		cell.day = day;
		cell.date = tempdate;
		cell.calinstance = this; // a convenience handle to the current calendar instance
		celldate = new Element('div',{id:cellid+'_date'}).addClassName('dayboxdate').update(tempdate.getDate());
		cellvalue = new Element('div',{id:cellid+'_value'}).addClassName('dayboxvalue');
		if (this.planner[tempdate] != null){
			$(cellvalue).update(this.planner[tempdate]);
		}
		//$(cellvalue).update('--');  // This populates the day value field with some test data.  You can uncomment it to see what your style looks like...  or not.

		// observe clicks
		cell.observe('click',this.cellclick); // set observation of clicks in the calendar object
        this.calobserved.push(cell);

		cell.datefield = $(celldate);
		cell.valuefield = $(cellvalue);

		cell.appendChild(celldate);
		cell.appendChild(cellvalue);

		// apply styles
		cell.addClassName('daybox').addClassName('daybox'+tempdate.format('dddd').toLowerCase());
		// if we are on the currently selected date, set the class to dayselected (i.e. highlight it).
		if (tempdate.getMonth() == this.selecteddate.getMonth() && tempdate.getDate() == this.selecteddate.getDate() && tempdate.getFullYear() == this.selecteddate.getFullYear()){
			cell.addClassName('dayselected');
			this.selecteddatecell=$(cell);		
		}
		// if we are outside the current month set the day style to 'deactivated'
		if (tempdate.getMonth() != this.currentdate.getMonth()){
			cell.addClassName('dayoutmonth').removeClassName('dayinmonth');
		}else{
			cell.addClassName('dayinmonth').removeClassName('dayoutmonth');
		};
		return cell.addClassName(cellid);
	},
	prevmonth: function(event){
		clicked = Event.element(event);
		backyear = clicked.calinstance.currentdate.getFullYear();
		backmonth = clicked.calinstance.currentdate.getMonth()-1;
		if (backmonth == -1){
			backmonth = 11;
			backyear = backyear-1;
		}
		tempdate = new Date(backyear,backmonth,clicked.calinstance.currentdate.getDate());
		clicked.calinstance.setCurrentDate(tempdate);
		clicked.calinstance.buildCalendar();
		clicked.calinstance.getCalendar();
	},
	nextmonth: function(event){
		clicked = Event.element(event);
		tempdate = new Date(clicked.calinstance.currentdate.getFullYear(),clicked.calinstance.currentdate.getMonth()+1,clicked.calinstance.currentdate.getDate());
		clicked.calinstance.setCurrentDate(tempdate);
		clicked.calinstance.buildCalendar();
		clicked.calinstance.getCalendar();
	},
	returntocurrentselecteddate: function(event){
		clicked = Event.element(event);
		clicked.calinstance.setCurrentDate(clicked.calinstance.selecteddate);
		clicked.calinstance.buildCalendar();
		clicked.calinstance.getCalendar();
	},
	opencalendar: function(event){
		clicked = Event.element(event);
		if (!clicked.calinstance.displayed){
			clicked.calinstance.openeffect(clicked.calinstance.baseelement,{duration:clicked.calinstance.openeffect.duration});
			clicked.calinstance.displayed = true;
		}
	},
	closecalendar: function(event){
		clicked = Event.element(event);
		if (clicked.calinstance.displayed){
			clicked.calinstance.closeeffect(clicked.calinstance.baseelement,{duration:clicked.calinstance.closeeffect.duration});
			clicked.calinstance.displayed = false;
		}
	},
    destroycalendar: function(){
        this.calobserved.each(function(o) {
           o.stopObserving(); 
        });
    },
	cellclick: function(event){
		clicked = Event.element(event);
		// if a sub element of the date cell was clicked (which is likely) work with the parent object (i.e the date cell)
		if (clicked.id.indexOf('_date') != -1 || clicked.id.indexOf('_value') != -1) { clicked = clicked.up(); }
		if (clicked.id == clicked.calinstance.selecteddatecell.id) { return; }
		clicked.addClassName('dayselected');		
		clicked.calinstance.selecteddatecell.removeClassName('dayselected');
		clicked.calinstance.selecteddate=clicked.date;
		clicked.calinstance.selecteddatecell=clicked;		
		clicked.calinstance.updateexternal();
	},
	updateexternal: function(){
		
		if (typeof this.updateelement == 'string'){
			// update the defined update element with the currently selected date
			$(this.updateelement).update(this.selecteddate);
		}else if (typeof this.updateelement == 'function'){
			this.updateelement();
		};
		
	},
	updateDayValue: function(week,day,value){
		// DayValue is the "text field" of a cell in the calendar.  You might use it to show activities for a day
		// or events. It is recommended to set a generous cell height if you plan to use this feature.  Try it with
		// some of the compact styles to see what we mean (although some of the compact styles have display of this
		// field set to none in the css).
		week -= 1;
		day -= 1;
		cellvalue = 'cal_day_'+week+'_'+day+'_value';
		$(cellvalue).update(value);
	},
	setPlannerValue: function(year,month,day,value){
		// PlannerValue is used when building the calendar.  It is automatically inserted DayValue area of the calendar.
		// The primary difference between this and DayValue is that the planner is actually carried from month to month
		// while the DayValue is specific to the calendar being displayed at the moment.  It is advised that you set
		// planner values _before_ displaying the calendar.
		plannerdate = new Date();
		plannerdate.setHours(0,0,0,0);
		plannerdate.setYear(year);
		plannerdate.setMonth(month-1);
		plannerdate.setDate(day);
		this.planner[plannerdate] = value;
	}
};
