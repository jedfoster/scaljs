/*  Scal 2.01 - prototype calendar/date picker
 *   - Jamie Grove
 *   - Ian Tyndall
 *
 *  Scal is freely distributable under the terms of an MIT-style license.
 *  For details, see the Scal web site: http://scal.fieldguidetoprogrammers.com
 *
 *--------------------------------------------------------------------------*/
Object.extend(Date.prototype, {
    monthnames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    daynames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    set: function(params){
        var hourArgs = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'];
        for (var type in params) {
            try {
                if(type == 'Hours' && Object.isArray(params[type])) {
                    params[type].each(function(p,i){
                        this['set' + hourArgs[i]](p);
                    }.bind(this));
                } else {
                    this['set' + type](params[type]);
                }
            } catch (e) { throw new SyntaxError('set' + type + ' is not a Date method'); }
        }
        return this; 
    },
    succ: function(){
        return new Date(this.getTime()).set({Date: this.getDate()+1});
    },
    firstofmonth: function(){
        return new Date(this.getFullYear(),this.getMonth(),1);
    },
    lastofmonth: function(){
        return new Date(this.getFullYear(),this.getMonth()+1,0);
    },
    formatPadding: true,
    format: function(f){
        if (!this.valueOf()) { return '&nbsp;'; }
        var d = this;
        var formats = {
            'yyyy' : d.getFullYear(),
            'mmmm': this.monthnames[d.getMonth()],
            'mmm':  this.monthnames[d.getMonth()].substr(0, 3),
            'mm':   this.formatPadding ? ((d.getMonth()).succ()).toPaddedString(2) : (d.getMonth()).succ(),
            'dddd': this.daynames[d.getDay()],
            'ddd':  this.daynames[d.getDay()].substr(0, 3),
            'dd':   d.getDate().toPaddedString(2),
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
        this.options = Object.extend({
          aftercalchange: Prototype.emptyFunction,
          beforecalchange: Prototype.K,
          daypadding: false,
          titleformat: 'mmmm yyyy',
          updateformat: 'yyyy-mm-dd',
          closebutton: 'X',
          prevbutton: '&laquo;',
          nextbutton: '&raquo;',
          yearnext: '&raquo;&raquo;',
          yearprev: '&laquo;&laquo;',
          openeffect: type == 'Effect' ? Effect.Appear : Element.show,
          closeeffect: type == 'Effect' ? Effect.Fade : Element.hide,
          exactweeks: false,
          dayheadlength: 2,
          weekdaystart: 0,
          planner: false,
          tabular: false
        }, arguments[2] || { });   
        this.table = false;
        this.thead = false;
        this.selectedElement = false;
        if(this.options.planner) { this._setupPlanner(this.options.planner); }
        if(this.options.tabular) { 
            this.table = new Element('table',{'class': 'cal_table',border: 0,cellspacing: 0,cellpadding: 0});
            this.thead = new Element('thead');
            this.table.insert(this.thead);
            this.element.insert(this.table);
        }
        this.updateelement = update;
        this._setCurrentDate(this._setStartDate()); 
        this.startdate = new Date(this.currentdate);
        if(Object.isString(this.options.weekdaystart)) { this.options.weekdaystart = this.currentdate.daynames.indexOf(this.options.weekdaystart) || 0; }
        this.controls = this._buildControls();
        this.title.setAttribute('title', this.startdate.format(this.options.titleformat));
        this._updateTitles();
        this[this.table ? 'thead' : 'element'].insert(this.controls);
        this.cal_wrapper = this._buildHead();
        this.cells = [];
        this._buildSkel();
    },
/*------------------------------- INTERNAL -------------------------------*/    
    _setStartDate: function() {
        var startdate = new Date();
        var startday = startdate.getDate();
        var month = this.options.month && Object.isNumber(this.options.month) ? this.options.month - 1 : startdate.getMonth();
        var year = this.options.year && Object.isNumber(this.options.year) ? this.options.year: startdate.getFullYear();
        var day = this.options.day && Object.isNumber(this.options.day) ? this.options.day : (month != startdate.getMonth()) ? 1 : startday;
        if(day != startday) { this.selectedDay = new Date(year,month,day,0,0,0,0); }
        return startdate.set({Hours: [0,0,0,0], Date: day, Month: month, FullYear: year});
    },
    _click: function(event,cellIndex) {
        if(this.selectedElement) { this.selectedElement.removeClassName('dayselected'); }
        this.selectedElement = (event.target.hasClassName('daybox') ? event.target : event.target.up()).addClassName('dayselected');
        this._setCurrentDate(this.dateRange[cellIndex]);
        if(this.selectedDay) {
            this.selectedDay.setTime(this.currentdate.getTime());
        } else {
            this.selectedDay = new Date(this.currentdate.getTime());
        } 
        this._updateExternal();
    },
    _updateExternal: function(){	
        if (Object.isFunction(this.updateelement)){
            this.updateelement(this.currentdate);
        } else {	
            var updateElement = $(this.updateelement);
            updateElement[updateElement.tagName == 'INPUT' ? 'setValue' : 'update'](this.currentdate.format(this.options.updateformat));
        }            
    },    
    _buildHead: function() {
        var cal_wrapper = new Element(this.table ? 'tbody' : 'div',{'class':'cal_wrapper'});
        var weekbox = new Element(this.table ? 'tr' : 'div',{'class':'weekbox weekboxname'});
        Date.prototype.daynames.sortBy(function(s,i){
            i-=this.options.weekdaystart;
            return i < 0 ? i + 7 : i;
        }.bind(this)).each(function(day,i) {
            var cell = new Element(this.table ? 'td' : 'div',{'class':'cal_day_name_'+ i});
            weekbox.insert(cell.addClassName('daybox').addClassName('dayboxname').update(day.substr(0,this.options.dayheadlength)));
            if(i == 6) { cell.addClassName('endweek'); }
        }.bind(this));
        return cal_wrapper.insert(weekbox);
    },
    _buildWrapper: function() {
        var firstdaycal = this.firstofmonth;
        var lastdaycal = this.lastofmonth;
        var firstDay = firstdaycal.getDay();
        var firstDate = firstdaycal.getDate();
        if(this.options.exactweeks) {
            while (lastdaycal.getDay() < 6) { lastdaycal = lastdaycal.succ(); }
        }
        firstDay = (this.options.weekdaystart - firstDay) < firstDate ? firstDay + this.options.weekdaystart : (firstDay + 7) - this.options.weekdaystart;
        firstdaycal.setDate(firstDate - firstDay);
        var lasttime = lastdaycal.getTime();
        var currentMonth = this.currentdate.getMonth();
        var today = new Date();
        var comparisonTimes = {
            today: today.getMonth() == currentMonth ? today.setHours(0,0,0,0) : false,
            dayselected: this.selectedDay && (this.selectedDay.getMonth() == currentMonth) ? this.selectedDay.getTime() : false
        };
        this.maxIndicators = ['today','dayselected'].findAll(function(p){ return comparisonTimes[p] !== false; }).size();
        this.dateRange = [];
        this.indicators = []; // holds values to determine if continued checking for custom classes is needed
        this.cells.each(function(cell,cellindex){
            cell.v.innerHTML = '';
            var day = (cell.weeknumber === 0) && (cellindex === 0) ? firstdaycal : this.dateRange[cellindex - 1].succ();
            this.cellClasses = ['daybox', cell.cid, 'daybox' + day.daynames[day.getDay()].toLowerCase()];
            this.dateRange[cellindex] = day;
            cell.d.innerHTML = this.options.daypadding ? ((day.getDate()).toPaddedString(2)) : day.getDate();
            if(this.maxIndicators > 0) { this._compareDates(day, comparisonTimes); }
            if(cell.daynumber == 6) { this.cellClasses.push('endweek'); }
            this.cellClasses.push(day.getMonth() != currentMonth ? 'dayoutmonth' : 'dayinmonth');
            if(this.options.exactweeks) {
                var action = day.getTime() > lasttime ? 'hide' : 'show';
                if(this.table) { cell.descendants().invoke(action); }
                else { cell[action](); }
            }
            if(this.options.planner) { this._updatePlanner(day,cell.v); }        
            cell.className = this.cellClasses.join(' ');
        }.bind(this));
    },
    _compareDates: function(maindate, comparisons){
        if(this.indicators.length == this.maxIndicators) { return; } // Max indicators reached, no more checking needed
        var mainTime = maindate.setHours(0,0,0,0);
        for (var type in comparisons) {
            if(!comparisons[type]) { continue; }
            if(this.indicators.indexOf(type) < 0) {
                if(mainTime == comparisons[type]) { 
                    this.cellClasses.push(type);
                    this.indicators.push(type);
                }
            }
        }	
    },
    _buildSkel: function(){
        if(this.cells.size() === 0) {
            this.cal_weeks_wrapper = this.table ? this.cal_wrapper : new Element('div',{'class': 'calweekswrapper'});
            var dayFormat = 'cal_day_#{week}_#{day}';
            var dayCount = 0;
            $R(0,5).each(function(wk,wknumber){
                var row = new Element(this.table ? 'tr' : 'div',{'class':'cal_week_' + wknumber}).addClassName('weekbox'); 
                $R(0,6).each(function(dy,dynumber){
                    var cellid = dayFormat.interpolate({week: wk, day: dy});
                    var cell = new Element(this.table ? 'td' : 'div',{'class': 'daybox'});
                    var celldate = new Element('div',{'class':cellid+'_date'}).addClassName('dayboxdate');
                    var cellvalue = new Element('div',{'class':cellid+'_value'}).addClassName('dayboxvalue');
                    Object.extend(cell, {cid: cellid, weeknumber: wknumber, daynumber: dynumber, d: celldate, v: cellvalue});
                    this.cells[dayCount] = cell.observe('click', this._click.bindAsEventListener(this, dayCount));
                    row.insert(cell.insert(celldate).insert(cellvalue));
                    dayCount += 1;
                }.bind(this));
                this.cal_weeks_wrapper.insert(row);
            }.bind(this));
            if(this.table) {
                this.table.insert(this.cal_wrapper);
            } else {
                this.element.insert(this.cal_wrapper).insert(this.cal_weeks_wrapper);
            }
        }
        this._buildWrapper();
    },
    _updateTitles: function() {
        var yr = this.currentdate.getFullYear();
        var mnth = this.currentdate.getMonth();
        this.controls.select('.calcontrol').each(function(ctrl) {
            ctrl.className.gsub(/cal(prev|next)(month|year)/, function(match) {
                var title = false;
                if(match[1] == 'prev') {
                    title = match[2] == 'year' ? yr - 1 : Date.prototype.monthnames[(mnth - 1) == -1 ? 11 : mnth - 1];
                } else if(match[1] == 'next') {
                    title = match[2] == 'year' ? yr + 1 : Date.prototype.monthnames[(mnth + 1) == 12 ? 0 : mnth + 1];
                }
                if(title) { ctrl.setAttribute('title',title); }
            });
        });
    },
    _buildControls: function() {
        var hParts = [
            {p: 'calclose', u: this.options.closebutton, f:  this.toggleCalendar.bindAsEventListener(this)},
            {p: 'calprevmonth', u: this.options.prevbutton, f: this._switchCal.bindAsEventListener(this,'monthdown')},
            {p: 'calprevyear', u: this.options.yearprev, f: this._switchCal.bindAsEventListener(this,'yeardown')},
            {p: 'calnextyear', u: this.options.yearnext, f: this._switchCal.bindAsEventListener(this,'yearup')},
            {p: 'calnextmonth', u: this.options.nextbutton, f: this._switchCal.bindAsEventListener(this,'monthup')},
            {p: 'caltitle', u: this.currentdate.format(this.options.titleformat), f: this._switchCal.bindAsEventListener(this,'init')}
        ];
        if(this.table) { hParts = [hParts[1],hParts[2],hParts[5],hParts[3],hParts[4],hParts[0]]; }
        var cal_header = new Element(this.table ? 'tr' : 'div',{'class':'calheader'});
        hParts.each(function(part) {
            var el = new Element(this.table ? 'td' : 'div',{'class': part.p});
            if(part.p == 'caltitle') {
                this.title = el;
                if(this.table) { el.writeAttribute({colspan: 2}); }
                el.update(part.u).observe('click',part.f);
            } else {
                el.addClassName('calcontrol');
                el[typeof(part.u) == 'object' ? 'insert' : 'update'](part.u).observe('click',part.f);
            }
            cal_header.insert(el);
        }.bind(this));
        return cal_header;
    },
    _switchCal: function(){
        var direction = arguments[1] ? arguments[1] : arguments[0];		
        var params = {f: 'setTime', p: this.startdate.getTime()};
        var sday = this.currentdate.getDate();
        if(direction != 'init') {
            var d = this.currentdate[direction.include('month') ? 'getMonth' : 'getFullYear']();
            params = {f: direction.include('month') ? 'setMonth' : 'setYear', p: direction.include('up') ? d + 1 : d - 1};
        }
        if(arguments[1]) {
            var toDate = new Date(this.currentdate.getTime());
            toDate[params.f](params.p);
            if(!this.options.beforecalchange(toDate)) { return; }
        }
        this.currentdate[params.f](params.p);
        if (this.currentdate.getDate() != sday){
            this.currentdate.setDate(0);
        }
        if(arguments[1]) { 
            var event = arguments[0];
            event.date = this.currentdate;
            this.options.aftercalchange(event);
        }
        this._update();
    }, 
    _update: function() {
        this._setCurrentDate(arguments[0] ? arguments[0] : this.currentdate);
        this.title.innerHTML = this.currentdate.format(this.options.titleformat);
        this._buildWrapper();
        this._updateTitles();
    },
    _setCurrentDate: function(date){
        this.currentdate = new Date(date.getFullYear(),date.getMonth(),date.getDate());
        this.firstofmonth = this.currentdate.firstofmonth();
        this.lastofmonth = this.currentdate.lastofmonth();
    },
    _getCellIndexByDate: function(d) {
        var dj = d.toJSON();
        var cellIndex = 0;
        this.dateRange.each(function(dt,i) {
            if(dt.toJSON() == dj) {
                cellIndex = i;
                throw $break;
            }
        });
        return cellIndex;
    },
/*------------------------------- PUBLIC -------------------------------*/        
    destroy: function(){
        this.cells.invoke('stopObserving').invoke('remove'); 
        this[this.table ? 'table' : 'cal_weeks_wrapper'].remove();
        this.controls.descendants().invoke('stopObserving');
        [this.cal_wrapper,this.controls].invoke('remove');
        this.element.descendants().invoke('remove');
    },
    setCurrentDate: function(direction){
        this[(direction instanceof Date) ? '_update' : '_switchCal'](direction);
        if(!arguments[1]) { this._updateExternal(); }
        return this.currentdate; 
    },
    toggleCalendar: function(){
        this.options[this.element.visible() ? 'closeeffect' : 'openeffect'](this.element);
    },
    getElementByDate: function(d) {
        return this.cells[this._getCellIndexByDate(d)];
    },
    getElementsByWeek: function(week) {
        return this.element.select('.weekbox:nth-of-type(' + (week + 1) + ') .daybox:not(.dayboxname)');
    },
    getSelectedElement: function() {
        return this.element.select('.dayselected')[0];
    },
    getTodaysElement: function() {
        return this.element.select('.today')[0];
    },
    getDateByElement: function(element) {
        return this.dateRange[this.cells.indexOf(element)];
    },
/*------------------------------- PLUG-IN PLACEHOLDERS -------------------------------*/            
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
