Object.extend(Date.prototype, {
    monthnames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    daynames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    succ: function(){
		var sd = new Date(this.getFullYear(),this.getMonth(),this.getDate()+1);
		sd.setHours(this.getHours(),this.getMinutes(),this.getSeconds(),this.getMilliseconds());
		return sd;
    },
    firstofmonth: function(){
		return new Date(this.getFullYear(),this.getMonth(),1);
    },
    lastofmonth: function(){
		return new Date(this.getFullYear(),this.getMonth()+1,0);
    },
    format: function(f){
	    if (!this.valueOf()) { return '&nbsp;'; }
	    var d = this;
        var formats = {
            'yyyy' : d.getFullYear(),
            'mmmm': this.monthnames[d.getMonth()],
	        'mmm':  this.monthnames[d.getMonth()].substr(0, 3),
	        'mm':   d.getMonth() + 1,
	        'dddd': this.daynames[d.getDay()],
	        'ddd':  this.daynames[d.getDay()].substr(0, 3),
	        'dd':   d.getDate(),
	        'hh':   h = d.getHours() % 12 ? h : 12,
	        'nn':   d.getMinutes(),
	        'ss':   d.getSeconds(),
	        'a/p':  d.getHours() < 12 ? 'a' : 'p'
        };
        return f.gsub(/(yyyy|mmmm|mmm|mm|dddd|ddd|dd|hh|nn|ss|a\/p)/i,
	        function(match) { return formats[match[0].toLowerCase()]; });
    }
});

var scal = {};
scal = Class.create();
scal.prototype = {
    initialize: function(element,update) {
        this.element = $(element);
        var type = Try.these(
            function(){ if(!Object.isUndefined(Effect)) { return 'Effect'; }},
            function(){ return 'Element'; }
        );  
        this.startdate = new Date();
		this.startdate.setHours(0,0,0,0);
        this.options = Object.extend({
          titleformat: 'mmmm yyyy',
          closebutton: 'X',
          prevbutton: '&laquo;',
          nextbutton: '&raquo;',
          openeffect: type == 'Effect' ? Effect.Appear : Element.show,
          closeeffect: type == 'Effect' ? Effect.Fade : Element.hide,
          exactweeks: false,
          dayheadlength: 2,
          weekdaystart: 0,
          planner: false,
          year: this.startdate.getFullYear(),
          month: 1,
          day: 1
        }, arguments[2] || { });   
        --this.options.month;
        if(this.options.month != 0 && Object.isNumber(this.options.month)) { this.startdate.setMonth(this.options.month); }
        if(this.options.day != 1 && Object.isNumber(this.options.month)) { this.startdate.setDate(this.options.day); }
        if(this.options.year != this.startdate.getFullYear() && Object.isNumber(this.options.month)) { this.startdate.setYear(this.options.year); }
        if(this.options.planner) { this.planner = this._setupPlanner(this.options.planner); }
		this.updateelement = update;
		this._setCurrentDate(this.startdate); 
        this.initDate = new Date(this.currentdate);
        this.controls = this._buildControls();
        this.element.insert(this.controls);
		this.cal_wrapper = this._buildHead();
		this.cells = [];
        this._buildCal();
    },
/*------------------------------- INTERNAL -------------------------------*/    
    _emptyCells: function() {
		if(this.cells.size() > 0) { 
            this.cells.invoke('stopObserving'); 
            this.cells.invoke('remove');
            this.cells = [];
        }
    },
    _buildCal: function() {
        this._emptyCells();
        if(!Object.isUndefined(this.cal_weeks_wrapper)) { this.cal_weeks_wrapper.remove(); }
        this.cal_weeks_wrapper = this._buildWrapper();
		this.cal_wrapper.insert(this.cal_weeks_wrapper);
        this.element.insert(this.cal_wrapper);
    },
    _click: function(event,cellIndex) {
        this.element.select('.dayselected').invoke('removeClassName', 'dayselected');
        (event.target.hasClassName('daybox') ? event.target : event.target.up()).addClassName('dayselected');
        event.date = this.dateRange[cellIndex];
        this._setCurrentDate(this.dateRange[cellIndex]);
        this._updateExternal(event);
    },
	_updateExternal: function(event){		
		if (Object.isString(this.updateelement)){
			// update the defined update element with the currently selected date
			$(this.updateelement).update(event);
		}else if (Object.isFunction(this.updateelement)){
			this.updateelement(event);
		};		
	},    
	_buildHead: function() {
		var cal_wrapper = new Element('div',{'class':'cal_wrapper'});
		var weekbox = new Element('div',{'class':'weekbox weekboxname'});
        Date.prototype.daynames.sortBy(function(s,i){
				i+=this.options.weekdaystart;
				if(i>6){i-=7;}
				return i;
			}.bind(this)).each(function(day,i) {
         	var cell = new Element('div',{'class':'cal_day_name_'+ i});
			cell.addClassName('daybox').addClassName('dayboxname').update(day.substr(0,this.options.dayheadlength));
            if(i == 6) { cell.addClassName('endweek'); }
			weekbox.insert(cell);
        }.bind(this));
        return cal_wrapper.insert(weekbox);
	},
    _buildWrapper: function() {
		var firstdaycal = new Date(this.firstofmonth.getFullYear(),this.firstofmonth.getMonth(),this.firstofmonth.getDate());
		var lastdaycal = new Date(this.lastofmonth.getFullYear(),this.lastofmonth.getMonth(),this.lastofmonth.getDate());
		firstdaycal.setDate(firstdaycal.getDate() - firstdaycal.getDay() + this.options.weekdaystart);
        var dateRange = $A($R(firstdaycal,lastdaycal));
		var cal_weeks_wrapper = new Element('div',{'class': 'calweekswrapper'});
        var wk;
        var row;
        var lastday;
        this.dateRange = [];
        this.indicators = []; // holds values to determine if continued checking for custom classes is needed
        var buildWeek = function(day) {
            row.insert(this._buildDay(wk, day));
            lastday = day;
        }.bind(this);       
        dateRange.eachSlice(7, function(slice,i) {
            wk = i;
            row = new Element('div',{'class':'cal_week_' + wk}).addClassName('weekbox');
            while(slice.length < 7) { 
                slice.push(slice.last().succ());
            }
            slice.map(buildWeek);
            cal_weeks_wrapper.insert(row);
        });
        if(!this.options.exactweeks) {
            var toFinish = 42 - this.cells.size(); 
			var wkstoFinish = Math.ceil(toFinish / 7);
			if(wkstoFinish > 0) { toFinish = toFinish / wkstoFinish; }
			$R(1,wkstoFinish).each(function(w){
	            wk += 1;
    	        row = new Element('div',{'class':'cal_week_' + wk}).addClassName('weekbox'); 
        	    $R(1,toFinish).each(function(i) {
            	    var d = lastday.succ();
                	var cell = this._buildDay(wk, d);
	                row.insert(cell);
					cal_weeks_wrapper.insert(row);
        	        lastday = d;
            	}.bind(this));
			}.bind(this));
        }
        return cal_weeks_wrapper;
    },
    _compareDates: function(date1,date2,type){
        return (this.indicators.indexOf(type) >= 0) ? false : Object.isUndefined(['getMonth','getDate','getFullYear'].find(function(n){ return date1[n]() != date2[n](); }));
    },
    _buildDay: function(week,day){
        this.dateRange.push(day);
        var cellid = 'cal_day_' + week + '_' + day.getDay();
		var cell = new Element('div',{'class':cellid});
		var celldate = new Element('div',{'class':cellid+'_date'}).addClassName('dayboxdate').update(day.getDate());
		var cellvalue = new Element('div',{'class':cellid+'_value'}).addClassName('dayboxvalue');
        if(this.options.planner) { this._updatePlanner(day,cellvalue); }
        cell.insert(celldate).insert(cellvalue).addClassName('daybox').addClassName('daybox'+ day.format('dddd').toLowerCase());
		// if we are on the currently selected date, set the class to dayselected (i.e. highlight it).
        if(this._compareDates(day,this.currentdate,'dayselected')) {
		 	cell.addClassName('dayselected');
            this.indicators.push('dayselected');
        }
        if(this._compareDates(day,new Date(),'today')) {
            cell.addClassName('today');
            this.indicators.push('today');
        }
        if(day.getDay() == 6) { cell.addClassName('endweek'); }
		// if we are outside the current month set the day style to 'deactivated'
        var cs = day.getMonth() != this.currentdate.getMonth() ? ['dayoutmonth','dayinmonth'] : ['dayinmonth','dayoutmonth'];
        cell.addClassName(cs[0]);
        if(cell.hasClassName(cs[1])) { cell.removeClassName(cs[1]); }
		this.cells.push(cell);
        return cell.observe('click', this._click.bindAsEventListener(this, this.cells.size() - 1));
    },
    _buildControls: function() {
        var hParts = [
            {p: 'calclose', u: this.options.closebutton, f:  this.toggleCalendar.bindAsEventListener(this)},
            {p: 'calprevmonth', u: this.options.prevbutton, f: this._switchMonth.bindAsEventListener(this,'down')},
            {p: 'calnextmonth', u: this.options.nextbutton, f: this._switchMonth.bindAsEventListener(this,'up')},
            {p: 'caltitle', u: this.currentdate.format(this.options.titleformat), f: this._switchMonth.bindAsEventListener(this,'init')}
        ];
        var cal_header = new Element('div',{'class':'calheader'});
        hParts.each(function(part) {
            var el = new Element('div',{'class': part.p});
            if(part.p == 'caltitle') {
                this.title = el;
                el.update(part.u).observe('click',part.f);
            } else {
    		    el.addClassName('calcontrol');
                el[typeof(part.u) == 'object' ? 'insert' : 'update'](part.u).observe('click',part.f);
            }
		    cal_header.insert(el);
        }.bind(this));
        return cal_header;
    },
    _switchMonth: function(e,direction){
        var dates = {
            up: this.currentdate.getMonth() + 1,
            down: this.currentdate.getMonth() - 1
        };
        if(Object.isUndefined(dates[direction])) {
            this.currentdate = this.initDate;
        } else {
            this.currentdate.setMonth(dates[direction]);
        }
        this._setCurrentDate(this.currentdate);
        this.title.update(this.currentdate.format(this.options.titleformat));
        this._buildCal();
    }, 
	_setCurrentDate: function(date){
		this.currentdate = new Date(date.getFullYear(),date.getMonth(),date.getDate());
		this.firstofmonth = this.currentdate.firstofmonth();
		this.lastofmonth = this.currentdate.lastofmonth();
	},    
/*------------------------------- PUBLIC -------------------------------*/        
    destroy: function(){
        this._emptyCells();
        if(!Object.isUndefined(this.cal_weeks_wrapper)) { this.cal_weeks_wrapper.remove(); }
        this.element.select('.caltitle').invoke('stopObserving');
        this.element.select('.calcontrol').invoke('stopObserving');
        this.cal_wrapper.remove();
        this.controls.remove();
    },
    setCurrentDate: function(direction){
        if(Object.isString(direction)) {
            this._switchMonth('', direction);
        } else if(direction instanceof Date) {
            this._setCurrentDate(direction);
            this.title.update(this.currentdate.format(this.options.titleformat));
            this._buildCal();
        }
    },
    toggleCalendar: function(){
        this.options[this.element.visible() ? 'closeeffect' : 'openeffect'](this.element);
    },
/*------------------------------- PLANNER PLACEHOLDERS -------------------------------*/            
    _setupPlanner: Prototype.emptyFunction,
    _updatePlanner: Prototype.emptyFunction,
/*------------------------------- DEPRECATED -------------------------------*/            
    openCalendar: function(){ 
        if(!this.isOpen()){ this.toggleCalendar(); }
    },
    closeCalendar: function(){ 
        if(this.isOpen()){ this.toggleCalendar(); }
    },
    isOpen: function(){ 
        return this.element.visible();
    }
};

