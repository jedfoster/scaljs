scal.addMethods({
/*------------------------------- INTERNAL -------------------------------*/    
    _setupPlanner: function(planner) {
        var splanner = {};
        planner.each(function(plan) {
            var planclass = plan.cls ? plan.cls : 'dayboxevent';
            if(Object.isString(plan.period)) {
                var planDate = new Date(plan.period);
                splanner[planDate] = { cls: planclass, val: plan.label };
            } else {
                plan.period.each(function(d){
                    splanner[d] = { cls: planclass, val: plan.label };
                });
            }
        });
        return splanner;            
    },
    _updatePlanner: function(day, el) {
        if(this.planner[day]) {
            var planclass = this.planner[day].cls ? this.planner[day].cls + ' dayboxevent' : 'dayboxevent';
            this.planner[day].val.each(function(plan) {
                el.insert(new Element('p',{'class': planclass}).update(plan));
            });
        }
    },
    _setPlanner: function(planclasses,planvalues,plannerdate) {
        if(this.planner[plannerdate]) {
    		this.planner[plannerdate].val.push(planvalues.join(','));
            if(arguments[3] && (!this.planner[plannerdate].cls.include(arguments[3]))) {
                this.planner[plannerdate].cls += ' ' + arguments[3];
            }
        } else {
            this.planner[plannerdate] = { cls: planclasses, val: planvalues };
        }
    },    
    _compareMonthYear: function(date1,date2) {
        return Object.isUndefined(['getMonth','getFullYear'].find(function(n){ return date1[n]() != date2[n](); }));
    },
/*------------------------------- PUBLIC -------------------------------*/        
    getDatesByEvent: function(evt) {
        var dates = [];
        for (var d in this.planner) {
            var eindex = this.planner[d].val.indexOf(evt);
            if(eindex >= 0) { dates.push(new Date(d)); }
        }
        return dates;
    },
    getEventsByDate: function(d) {
        return this.planner[d] ? this.planner[d].val : false;
    },
    getCurrentEvents: function() {
        // determine if we want just the current month or everything in current calendar view
        var currentMonth = arguments[0] ? this.currentdate.getMonth() : false;
        var plannerCheck = function(d) {
            if(currentMonth) { return this.planner[d] && (d.getMonth() == currentMonth) ? true : false; }
            else { return this.planner[d] ? true : false; }
        }.bind(this);
        var evts = [];
        this.dateRange.each(function(d,i) {
            if(plannerCheck(d)) {
                evts.push({dt: d, target: this.cells[i]});
            }
        }.bind(this));
        return evts;
    },
    removeEventsByDate: function(d) {
        if(this.planner[d]) {
            var cellIndex = this._getCellIndexByDate(d);
            if(Object.isNumber(arguments[1])) {
                var index = arguments[1];
                this.planner[d].val = this.planner[d].val.without(index);
                this.cells[cellIndex].select('.dayboxvalue p')[index].remove();
             } else {
                delete this.planner[d]; 
                this.cells[cellIndex].select('.dayboxvalue').invoke('remove');
             }
        } else {
            return false;
        }
    },
    getEventElementsByDate: function(d) {
        return this.getElementByDate(d).select('p.dayboxevent');
    },
    getEventElementsByWeek: function(week) {
        return this.getElementsByWeek(week).collect(function(e){ return e.select('p.dayboxevent'); });
    },
    getSelectedEvents: function() {
        return this.getSelectedElement().select('p.dayboxevent');
    },
    getTodaysEvents: function() {
        return this.getTodaysElement().select('p.dayboxevent');
    },
    updateDayValue: function(week,day,value){
        var planclasses = 'dayboxevent';
        if(arguments[3]) { planclasses += ' ' + arguments[3]; }
        var planvalues = Object.isArray(value) ? value : [value]; 
        week -= 1;
        day -= 1;
        this.dateRange.eachSlice(7, function(wk,i) {
            if(i == week) {
                this._setPlanner(planclasses,planvalues,wk[day],arguments[3]);
                throw $break
            }
        }.bind(this));        
        var cellvalue = '.cal_day_'+week+'_'+day+'_value';
        var el = this.element.select(cellvalue)[0];
        planvalues.each(function(val) {
            el.insert(new Element('p',{'class': planclasses}).update(value));
        });
        return el;
    },
    setPlannerValue: function(year,month,day,value){
        var planclasses = 'dayboxevent';
        if(arguments[4]) { planclasses += ' ' + arguments[4]; }	
        var planvalues = Object.isArray(value) ? value : [value];
        plannerdate = new Date();
        plannerdate.setHours(0,0,0,0);
        plannerdate.setYear(year);
        plannerdate.setMonth(month-1);
        plannerdate.setDate(day);
        this._setPlanner(planclasses,planvalues,plannerdate,arguments[4]);
        if(!this._compareMonthYear(this.currentdate,plannerdate)) {
            return; // return nothing if plannerdate isn't in the current month
        }
        var cellIndex = this._getCellIndexByDate(plannerdate);
        var el = this.cells[cellIndex].select('.dayboxvalue')[0];
        planvalues.each(function(val) {
            el.insert(new Element('p',{'class': planclasses}).update(val));
        });
        return el;
    }
});
