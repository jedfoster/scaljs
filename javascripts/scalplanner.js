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
            var planclass = this.planner[day].cls ? this.planner[day].cls : 'dayboxevent';
            this.planner[day].val.each(function(plan) {
                el.insert(new Element('p',{'class': planclass}).update(plan));
            });
        }
    },
/*------------------------------- PUBLIC -------------------------------*/        
	updateDayValue: function(week,day,value){
        var planclass = arguments[3] ? arguments[3] : 'dayboxevent';
        var planvalues = Object.isArray(value) ? value : [value];
		week -= 1;
		day -= 1;
		var cellvalue = '.cal_day_'+week+'_'+day+'_value';
        var el = this.element.select(cellvalue)[0];
        planvalues.each(function(val) {
            el.insert(new Element('p',{'class': planclass}).update(value));
        });
        return el;
	},
	setPlannerValue: function(year,month,day,value){
        var planclass = arguments[4] ? arguments[4] : 'dayboxevent';
        var planvalues = Object.isArray(value) ? value : [value];
		plannerdate = new Date();
		plannerdate.setHours(0,0,0,0);
		plannerdate.setYear(year);
		plannerdate.setMonth(month-1);
		plannerdate.setDate(day);
        if(this.planner[plannerdate]) {
    		this.planner[plannerdate].val.push(value);
        } else {
            this.planner[plannerdate] = { cls: planclass, val: planvalues };
        }
        var cellIndex = 0;
        this.dateRange.each(function(dt,i) {
            if(dt.toJSON() == plannerdate.toJSON()) { 
                cellIndex = i;
                throw $break;
            }
        });
        var el = this.cells[cellIndex].select('.dayboxvalue')[0];
        el.select('p').invoke('remove');
        planvalues.each(function(val) {
            el.insert(new Element('p',{'class': planclass}).update(val));
        });
        return el;
	}
});

