var scalplanner = {};
scalplanner = Class.create();
scalplanner.prototype = {
    initialize: function(scalinstance) {
        this.scal = scalinstance;
        this.planner = this._setupPlanner(this.scal.options.planner);
    },
    _setupPlanner: function(planner) {
        var splanner = {};
        planner.each(function(plan) {
            var planDate = new Date(plan.key);
            splanner[planDate] = plan.value;
        });
        return splanner;            
    },
    _update: function(day, el) {
        if(this.planner[day]) {
            this.planner[day].each(function(plan) {
                el.insert(new Element('p').update(plan));
            });
        }
    },
	updateDayValue: function(week,day,value){
		week -= 1;
		day -= 1;
		cellvalue = '.cal_day_'+week+'_'+day+'_value';
        this.scal.element.select(cellvalue)[0].update(value);
	},
	setPlannerValue: function(year,month,day,value){
		plannerdate = new Date();
		plannerdate.setHours(0,0,0,0);
		plannerdate.setYear(year);
		plannerdate.setMonth(month-1);
		plannerdate.setDate(day);
        if(this.planner[plannerdate]) {
    		this.planner[plannerdate].push(value);
        } else {
            this.planner[plannerdate] = [value];
        }
        var cellIndex = 0;
        this.scal.dateRange.each(function(dt,i) {
            if(dt.toJSON() == plannerdate.toJSON()) { 
                cellIndex = i;
                throw $break;
            }
        });
        this.scal.cells[cellIndex].select('.dayboxvalue')[0].update(value);
	}
};

