A simple calendar control in Javascript based on Prototype.

This repo is a fork of the Scal project on [Google Code](http://code.google.com/p/scaljs/). The original project's [homepage](http://scal.fieldguidetoprogrammers.com/) has been down for some time now, and the last commit to the project was in 2008. However, I like Scal and use it everyday, so here it is. 

*Everything below was copied verbatim from the original wiki.*

---

## Scal Usage 

cal = new scal(calendar_id,update_id,{options}); cal.showCalendar();

calendar_id - id of the element you wish to become the calendar. update_id - id of the element you wish to get updated with the selected date OR a reference to a function. The sample below uses a function to update a field. 

* year, month, day - Regular calendar fields. The initial value for the calendar defaults to the current date. You can override elements of the date individually.
* titleformat - Sets the format of the title for the calendar. Defaults to full month name and year.
* closebutton - Defines the text (or element) to use as the close button for the calendar. Defaults to 'X'. You can also use Builder.node to create an img object and pass that in.
* nextbutton, prevbutton - Moves the calendar forward and backward one month. Defaults to > <. Works just like closebutton.
* openeffect,closeeffect - Takes a script.aculo.us Effect like Effect.Fade and uses that when opening or closing the calendar. A duration option for each will also be available soon. Right now, this is set to 0 so it might not be a good idea to use it right now unless you wish to modify it on your own.
* exactweeks - true/false used to determine whether the calendar should show the 'exact' number of weeks in a month. By default, the calendar shows 6 weeks which will give you a nice, consistent view. However, if you want the control to show a variable number of weeks based on the true length of the month, set this to true.
* dayheadlength - How many characters to use for the days of the week. Defaults to 2 (ex. Mo = Monday)
* weekdaystart - Day of the week to start the calendar. Numeric, defaults to 0 (Sunday).

### Styles

Visual display of the calendar is controlled through css classes. You can look at scal.css for several examples. to use the examples. Just assign a top-level class (like 'scal' or 'dashblack') and the styles should take over. Pretty simple.

### Methods

This is where I get into trouble. I keep adding methods as I play with the control, so expect this list to grow.

* buildCalendar - performs the basic setup of the calendar data.
* closeCalendar, openCalendar - obvious?
* getCalendar - creates the HTML from the calendar data created in buildCalendar.
* setCurrentDate(date) - This sets the currentdate property which is used to build the calendar display. It also sets a few additional variables needed for the display of the calendar. So, if you want to advance the calendar on your own (i.e. programmatically) call this function and then call buildCalendar.
* showCalendar - displays the calendar using the assigned element. This method calls buildCalendar (if needed) and getCalendar.
* updateDayValue(week,day,value) - Each day cell in the calendar has two visible elements: value and date. date is the actual number of the day (1,2,3,24, etc). value is a text field you might want to put something in, say information about events that day. These two visible elements can be styled as well through the class names dayboxdate and dayboxvalue (check out the style iscal in the sample css).
* setPlannerValue(year,month,day,value) - The planner is a collection of values added to the calendar as it is displayed. The values can be any snippet of plain text or HTML (i.e. you could use styled HTML to display events in different colors). The purpose of this function is to give developers an option to "load up" their calendar with events that automatically show up as opposed to using the updateDayValue function when each month is displayed. year, month, and day parameters are numeric, and as you might expect scal checks to see if that date exists in the planner collection when building the calendar for display and inserts the value accordingly. Note I do not recommend using this when you are using a compressed calendar style (i.e. one that does not show the day cell). Of the sample styles, iscal is probably the best to use.

### Properties

* baseelement - The id of the element that holds the calendar.
* currentdate - The date used to build the calendar display. If you want to manipulate the date used to build the calendar, call setCurrentDate(date) instead of playing with this. This is easily confused with selecteddate.
* displayed - Whether or not the calendar is visible.
* selecteddate - The date currently selected in the control.
* selecteddatecell - A convenience handle for the calendar cell of the currently selected date.
* startdate - The first date provided when the calendar was created.
* updateelement - The id of the element that is updated by a click on the calendar.
* planner - This property holds a reference to day cell values. See setPlannerValue for more information.