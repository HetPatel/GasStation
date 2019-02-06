!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define("SalsaCalendar",[],e):"object"==typeof exports?exports.SalsaCalendar=e():t.SalsaCalendar=e()}(this,function(){return function(t){function e(i){if(n[i])return n[i].exports;var a=n[i]={exports:{},id:i,loaded:!1};return t[i].call(a.exports,a,a.exports,e),a.loaded=!0,a.exports}var n={};return e.m=t,e.c=n,e.p="",e(0)}([function(t,e,n){t.exports=n(3)},function(t,e){"use strict";var n={};n.getElementsByClassName=function(t,e){for(var n=t.getElementsByTagName("*"),i=[],a="(^|\\s)"+e+"(\\s|$)",s=0;s<n.length;s++){var r=n[s];r.className.match&&r.className.match(a)&&(i[i.length]=r)}return i},n.elementHasClass=function(t,e){var n=t.className.split(" ");return n.indexOf(e)!==-1},n.findElementPosition=function(t){for(var e=0,n=0;t;)e+=t.offsetLeft,n+=t.offsetTop,t=t.offsetParent;return{left:e,top:n}},n.isElementVisible=function(t){var e=t.offsetWidth,n=t.offsetHeight;return(0!==e||0!==n)&&(e>0&&n>0||"none"!==t.display)},n.getEvent=function(t){return t||window.event},n.getEventTarget=function(t){return t=n.getEvent(t),t.target||window.event.srcElement},n.addEvent=function(t,e,n){t.addEventListener?t.addEventListener(e,n,!1):t.attachEvent&&t.attachEvent("on"+e,n)},n.isMobile=function(){var t=window.innerWidth>0?window.innerWidth:screen.width;return t<=480},t.exports=n},function(t,e){},function(t,e,n){"use strict";function i(t){void 0===t.name&&(t.name=""),void 0===t.lang&&(t.lang="en"),void 0===t.yearsNavigation&&(t.yearsNavigation=!1),void 0===t.range&&(t.range={min:!1,max:!1,weekdays:!1,closing_dates:!1}),void 0===t.range.min&&(t.range.min=!1),void 0===t.range.max&&(t.range.max=!1),void 0===t.ranges&&(t.ranges=[t.range]),void 0===t.minDate&&(t.minDate=!1),void 0===t.allowEmptyDate&&(t.allowEmptyDate=!1),void 0===t.inputReadOnly&&(t.inputReadOnly=!1),void 0===t.showNextMonth&&(t.showNextMonth=!1),r.isMobile()&&(t.showNextMonth=!1),void 0===t.onSelect&&(t.onSelect=function(t){}),void 0===t.calendarPosition&&(t.calendarPosition="bottom"),void 0===t.fixed&&(t.fixed=!1),void 0===t.dateFormats&&(t.dateFormats={}),void 0===t.scrollableContainerElement&&(t.scrollableContainerElement=null),this.options=t,this.calendar=null,this.other_calendar=null,this.current_date=null,this.on_set_current_date_closures=[],this.on_date_click=function(){},this.before_show=function(){},this.i18n=new a(this,this.options.lang,t.dateFormats),this.input=new s(this,this.options.inputId,this.options.allowEmptyDate,this.options.inputReadOnly||r.isMobile()),null!==this.options.scrollableContainerElement?this.scrollable_container=this.options.scrollableContainerElement:this.scrollable_container=document.body,this._init_events(),this._init_options()}var a=n(5),s=n(6),r=n(1);n(8),n(2),i.prototype={_init_options:function(){for(var t=0;t<this.options.ranges.length;t++)"today"===this.options.ranges[t].min&&(this.options.ranges[t].min=this.i18n.date2DateString(new Date))},_init_events:function(){r.addEvent(document,"click",function(t){var e=r.getEventTarget(t);this._is_calendar_element(e)||this.hide()}.bind(this))},_is_calendar_element:function(t){if(t===this.input.getElement())return!0;if(r.elementHasClass(t,"sc-keep-open"))return!0;for(;t.parentNode;){if(t===this.calendar)return!0;if(r.elementHasClass(t,"salsa-calendar-input"))return!0;t=t.parentNode}return!1},onSetCurrentDate:function(t){this.on_set_current_date_closures.push(t)},onDateClick:function(t){this.on_date_click=t},beforeShow:function(t){this.before_show=t},setOtherCalendar:function(t){this.other_calendar=t},setCurrentDate:function(t){this.current_date=t;for(var e=0;e<this.on_set_current_date_closures.length;e++)this.on_set_current_date_closures[e]()},getCurrentDate:function(){return this.current_date},selectDate:function(t){this.input.setDate(t),this.input.checkAndValidateDate()&&(this.setCurrentDate(t),this.show(t.getFullYear(),t.getMonth()))},setRangeMin:function(t){var e=this.i18n.dateString2Date(t);null!==e&&(this.options.range.min=t)},setRangeMax:function(t){var e=this.i18n.dateString2Date(t);null!==e&&(this.options.range.max=t)},setFixed:function(t){this.options.fixed=t,this.calendar&&this._position_calendar_near(this.input.getElement())},isShown:function(){return this.calendar&&""===this.calendar.style.display},show:function(t,e){if(r.isElementVisible(this.input.getElement())){if(r.elementHasClass(document.body,"salsa-calendar-opened")||(document.body.className+=" salsa-calendar-opened"),void 0===t||void 0===e){var n=this.input.checkDate();n===!1&&(n=new Date);var t=n.getFullYear(),e=n.getMonth()}if(e<0?(t--,e=11):e>11&&(t++,e=0),null===this.calendar){this.calendar=this._get_calendar_structure();var i=document.getElementsByTagName("body")[0];i.appendChild(this.calendar)}this.before_show(),this._refresh(t,e),this.calendar.style.display="",this.input.input.blur(),r.addEvent(this.scrollable_container,"scroll",function(t){this.isShown()&&this._position_calendar_near(this.input.getElement())}.bind(this)),this._position_calendar_near(this.input.getElement())}},_get_calendar_structure:function(){var t=document.createElement("div");return t.className="salsa-calendar",t.className+=""!==this.options.name?" "+this.options.name:"",t.className+=this.options.showNextMonth?" salsa-calendar-two-months":"",t},_position_calendar_near:function(t){var e=r.findElementPosition(t);this.scrollable_container!==document.body&&(e.top-=this.scrollable_container.scrollTop,this._hide_calendar_on_input_overflow(this.scrollable_container,t,e)),"right"===this.options.calendarPosition?(this.calendar.style.top=parseInt(e.top)+"px",this.calendar.style.left=parseInt(e.left+t.offsetWidth)+"px",r.elementHasClass(this.calendar,"sc-right")||(this.calendar.className+=" sc-right")):"left"===this.options.calendarPosition?(this.calendar.style.top=parseInt(e.top)+"px",this.calendar.style.left=parseInt(e.left-this.calendar.offsetWidth)+"px",r.elementHasClass(this.calendar,"sc-left")||(this.calendar.className+=" sc-left")):(this.calendar.style.top=parseInt(e.top+t.offsetHeight)+"px",this.calendar.style.left=parseInt(e.left)+"px",r.elementHasClass(this.calendar,"sc-bottom")||(this.calendar.className+=" sc-bottom")),this.calendar.style.position=this.options.fixed?"fixed":"absolute"},_hide_calendar_on_input_overflow:function(t,e,n){var i=r.findElementPosition(t),a=n.top-i.top-t.offsetTop+e.clientHeight;a>t.offsetHeight&&this.hide(),n.top<i.top&&this.hide()},hide:function(){this.calendar&&(this.calendar.style.display="none"),document.body.className=document.body.className.replace(" salsa-calendar-opened","")},hideOthers:function(){for(var t=r.getElementsByClassName(document,"salsa-calendar"),e=0;e<t.length;e++)t[e]!==this.calendar&&(t[e].style.display="none")},_refresh:function(t,e){this.calendar.innerHTML="";var n=this._build_calendar_page(t,e,!1);if(this.calendar.appendChild(n),this.options.showNextMonth){11===e?(t++,e=0):e++;var n=this._build_calendar_page(t,e,!0);this.calendar.appendChild(n)}},_build_calendar_page:function(t,e,n){var i=document.createElement("table");i.setAttribute("cellspacing",0,!1),i.setAttribute("cellpadding",0,!1),i.appendChild(this._get_header(t,e,n));var a=document.createElement("tbody");i.appendChild(a);for(var s=new Date(t,e,1),r=0;r<6;r++){var o=document.createElement("tr");a.appendChild(o);for(var l=0;l<7;l++){var h=document.createElement("td"),c=(l+this.i18n.getFirstDayOfWeek())%7;s.getMonth()===e&&s.getDay()===c?(h.className="sc-day sc-keep-open",this.getCurrentDate()&&this.getCurrentDate().getTime()===s.getTime()&&(h.className+=" sc-current"),this._is_today(s)&&(h.className+=" sc-today"),this.inRangeDate(s)?function(t){h.onclick=function(){this.input.setDate(t),this.setCurrentDate(t),this.hide(),this.options.onSelect(this.input.getElement()),this.on_date_click()}.bind(this)}.bind(this)(new Date(s.getTime())):h.className+=" sc-disabled",h.innerHTML=s.getDate(),s.setDate(s.getDate()+1)):h.className="sc-other-month",o.appendChild(h)}}return i},_is_today:function(t){var e=new Date;return t.getDate()===e.getDate()&&t.getMonth()===e.getMonth()&&t.getFullYear()===e.getFullYear()},inRangeDate:function(t){if(this.options.minDate&&t.getTime()<this.i18n.dateString2Date(this.options.minDate).getTime())return!1;for(var e=0;e<this.options.ranges.length;e++)if(this._check_range_min_date(this.options.ranges[e],t)&&this._check_range_max_date(this.options.ranges[e],t)&&this._check_range_weekday(this.options.ranges[e],t)&&this._check_closed_date(this.options.ranges[e],t))return!0;return!1},getRangeValidDate:function(t){if(!t)return this.getMinValidDate();if(isNaN(t.getTime()))return this.getMinValidDate();for(var e=0;e<this.options.ranges.length;e++)if(!this._check_range_min_date(this.options.ranges[e],t))return this.getMinValidDate();for(var e=0;e<this.options.ranges.length;e++)if(!this._check_range_max_date(this.options.ranges[e],t))return this._get_ranges_max_date();return t},getMinValidDate:function(){if(this.options.minDate)var t=this.i18n.dateString2Date(this.options.minDate);else var t=this.i18n.getTodayDate();var e=this._get_ranges_max_date();for(null===e&&(e=new Date(2050,1,1));t.getTime()<=e.getTime()&&!this.inRangeDate(t);)t=new Date(t.getTime()+86400);return!!this.inRangeDate(t)&&t},_get_ranges_min_date:function(){for(var t=!1,e=0;e<this.options.ranges.length;e++){var n=this.i18n.dateString2Date(this.options.ranges[e].min);t===!1?t=n:n.getTime()<t.getTime()&&(t=n)}return t},_get_ranges_max_date:function(){for(var t=!1,e=0;e<this.options.ranges.length;e++){var n=this.i18n.dateString2Date(this.options.ranges[e].max);t===!1?t=n:n.getTime()>t.getTime()&&(t=n)}return t},_check_range_min_date:function(t,e){if(t.min===!1)return!0;var n=this.i18n.dateString2Date(t.min);return null!==n&&(!!isNaN(n.getTime())||e.getTime()>=n.getTime())},_check_range_max_date:function(t,e){if(t.max===!1)return!0;var n=this.i18n.dateString2Date(t.max);return null!==n&&(!!isNaN(n.getTime())||e.getTime()<=n.getTime())},_check_range_weekday:function(t,e){if(void 0===t.weekdays)return!0;if(t.weekdays===!1)return!0;if("all"===t.weekdays)return!0;var n=e.getDay();return 0===n&&(n=7),t.weekdays.split(",").indexOf(n.toString())!==-1},_check_closed_date:function(t,e){if(void 0===t.closed_dates||!t.closed_dates)return!0;for(var n=t.closed_dates,i=e.getFullYear()+"-"+this._pad(e.getMonth()+1)+"-"+this._pad(e.getDate()),a=0;a<=n.length;a++)if(n[a]===i)return!1;return!0},_pad:function(t){return t<10?"0"+t:t},_get_header:function(t,e,n){var i=document.createElement("thead"),a=document.createElement("tr");i.appendChild(a);var s=document.createElement("th");s.colSpan=7,a.appendChild(s);var r=document.createElement("div");r.className="sc-nav",s.appendChild(r);var o=document.createElement("span");if(o.className="sc-title",o.innerHTML=this.i18n.getMonth(e)+" "+t,r.appendChild(o),!this.options.showNextMonth||!n){var l=document.createElement("span");if(l.className="sc-prev",r.appendChild(l),this.options.yearsNavigation){var h=document.createElement("a");h.href="#",h.className="sc-prev-year sc-keep-open",h.innerHTML="<span>&lt;&lt;</span>",h.onclick=function(){return this.show(t-1,e),!1}.bind(this),l.appendChild(h)}var h=document.createElement("a");h.href="#",h.className="sc-prev-month sc-keep-open",h.innerHTML="<span>&lt;</span>",h.onclick=function(){return this.show(t,e-1),!1}.bind(this),l.appendChild(h)}if(!this.options.showNextMonth||n){var c=document.createElement("span");c.className="sc-next",r.appendChild(c);var h=document.createElement("a");if(h.href="#",h.className="sc-next-month sc-keep-open",h.innerHTML="<span>&gt;</span>",h.onclick=function(){return n?this.show(t,e):this.show(t,e+1),!1}.bind(this),c.appendChild(h),this.options.yearsNavigation){var h=document.createElement("a");h.href="#",h.className="sc-next-year sc-keep-open",h.innerHTML="<span>&gt;&gt;</span>",h.onclick=function(){return this.show(t+1,e),!1}.bind(this),c.appendChild(h)}}var a=document.createElement("tr");i.appendChild(a);for(var d=0;d<7;d++){var s=document.createElement("th"),u=(d+this.i18n.getFirstDayOfWeek())%7;s.className="sc-week-day",s.innerHTML=this.i18n.getWeekDay(u),a.appendChild(s)}return i}},i.Connector=n(4),i.NightsCalculator=n(7),t.exports=i},function(t,e){"use strict";function n(t){this.from=t.from,this.to=t.to,void 0===t.minimumInterval&&(t.minimumInterval=1),void 0===t.maximumInterval&&(t.maximumInterval=-1),this.options=t,this.from.onDateClick(function(){var t=this.from.getCurrentDate(),e=this.to.getCurrentDate();this._connect_calendar(),this._check_connected_calendar_integrity(this.from.input.getDate()),t.getTime()>e.getTime()&&this.to.show()}.bind(this)),this.from.onSetCurrentDate(function(){var t=new Date(this.from.getCurrentDate());t.setDate(t.getDate()+this.options.minimumInterval);var e=this.to.getCurrentDate();(!e||t.getTime()>e.getTime())&&(this.to.input.setDate(t),this.to.setCurrentDate(t)),this._set_connected_calendar_range_min_date(this.from.input.getDate()),this._set_connected_calendar_range_max_date(this.from.input.getDate()),this._check_connected_calendar_integrity(this.from.input.getDate())}.bind(this)),this._connect_calendar()}n.prototype={_connect_calendar:function(){var t=this.from.input.getDate();if(t){var e=this.to.getCurrentDate(),n=this.from.getCurrentDate(),i=new Date(t.getTime());i.setDate(i.getDate()+this.options.minimumInterval),this._set_connected_calendar_range_min_date(t),this._set_connected_calendar_range_max_date(t),n&&e&&n.getTime()<e.getTime()||(this.to.input.setDate(i),this.to.setCurrentDate(i))}},_set_connected_calendar_range_min_date:function(t){var e=new Date(t.getTime());e.setDate(e.getDate()+this.options.minimumInterval),this.to.setRangeMin(this.from.i18n.date2DateString(e))},_set_connected_calendar_range_max_date:function(t){if(!(this.options.maximumInterval<0)){var e=new Date(t.getTime());e.setDate(e.getDate()+this.options.maximumInterval),this.to.setRangeMax(this.from.i18n.date2DateString(e)),this.to.getCurrentDate().getTime()>e.getTime()&&this.to.selectDate(e)}},_check_connected_calendar_integrity:function(t){var e=new Date(t.getTime());return e.getTime()>=this.to.getCurrentDate().getTime()?void this.to.input.setError():this.options.maximumInterval<0?void this.to.input.setValidated():(e.setDate(e.getDate()+this.options.maximumInterval),e.getTime()<this.to.getCurrentDate().getTime()?void this.to.input.setError():void this.to.input.setValidated())}},t.exports=n},function(t,e){"use strict";function n(t,e,n){this.calendar=t,this.lang=e,this.months={it:["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"],en:["January","February","March","April","May","June","July","August","September","October","November","December"],pt:["Janeiro","Fevereiro","Mar&ccedil;o","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],fr:["janvier","f&eacute;vrier","mars","avril","mai","juin","juillet","ao&ucirc;t","septembre","octobre","novembre","d&eacute;cembre"],de:["Januar","Februar","M&auml;rz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],ru:["January","February","March","April","May","June","July","August","September","October","November","December"]},this.week_days={it:["Do","Lu","Ma","Me","Gi","Ve","Sa"],en:["Su","Mo","Tu","We","Th","Fr","Sa"],pt:["Do","Se","Te","Qu","Qu","Se","S&aacute;"],fr:["di","lu","ma","me","je","ve","sa"],de:["So","Mo","Di","Mi","Do","Fr","Sa"],ru:["Su","Mo","Tu","We","Th","Fr","Sa"]},this.first_day_of_week={it:1,en:0,pt:0,fr:1,de:1,ru:1},this.date_formats={it:"%d/%m/%Y",en:"%m/%d/%Y",pt:"%d/%m/%Y",fr:"%d/%m/%Y",de:"%d/%m/%Y",ru:"%d/%m/%Y"};for(var i in n)this.date_formats[i]=n[i]}n.prototype={getMonth:function(t){return void 0===this.months[this.lang][t]?this.months.en[t]:this.months[this.lang][t]},getWeekDay:function(t){return void 0===this.week_days[this.lang][t]?this.week_days.en[t]:this.week_days[this.lang][t]},getTodayDate:function(){var t=new Date;return new Date(t.getFullYear(),t.getMonth(),t.getDate())},getDateFormat:function(){return void 0===this.date_formats[this.lang]?this.date_formats.en:this.date_formats[this.lang]},getFirstDayOfWeek:function(){return void 0===this.first_day_of_week[this.lang]?this.first_day_of_week.en:this.first_day_of_week[this.lang]},date2DateString:function(t){if(!t)return"";var e=this.getDateFormat(),n=this._format_number(t.getDate(),2),i=this._format_number(t.getMonth()+1,2),a=this._format_number(t.getFullYear(),4);return e.replace("%d",n).replace("%m",i).replace("%Y",a)},_format_number:function(t,e){var n="000"+t;return n.substr(n.length-e)},dateString2Array:function(t){if(""===t)return{};var e=t.split("/"),n=this.getDateFormat().split("/"),i=e[n.indexOf("%d")],a=e[n.indexOf("%m")],s=e[n.indexOf("%Y")];return{day:i,month:a,year:s}},dateString2Date:function(t){if(!t)return null;if(""===t)return null;if("today"===t){var e=new Date;return new Date(e.getFullYear(),e.getMonth(),e.getDate())}var n=this.dateString2Array(t);return new Date(n.year,n.month-1,n.day)}},t.exports=n},function(t,e,n){"use strict";function i(t,e,n,i){this.calendar=t,this.input=document.getElementById(e),void 0===n&&(n=!1),this.allowEmptyDate=n,void 0===i&&(i=!1),this.inputReadOnly=i,this._init_current_date(),this._init_events()}var a=n(1);i.prototype={_init_current_date:function(){var t=this.checkDate();t!==!1?this.calendar.setCurrentDate(t):this.allowEmptyDate||(this.setDate(this.calendar.getRangeValidDate(this.calendar.getMinValidDate())),this.calendar.setCurrentDate(this.calendar.getRangeValidDate(this.calendar.getMinValidDate()))),this.inputReadOnly&&this.input.setAttribute("readonly","readonly")},_init_events:function(){this.input.onfocus=this.input.onclick=function(){this.calendar.hideOthers(),this.calendar.isShown()||this.calendar.show()}.bind(this),this.input.onblur=function(){var t=this.checkAndValidateDate();t===!1&&(this.setDate(this.calendar.getCurrentDate()),this.setValidated())}.bind(this),this.input.onkeyup=function(t){if(t=a.getEvent(t),!this._is_key_navigation(t.keyCode)){if(!this._is_key_valid(t.keyCode))return void this.setError();var e=this.checkAndValidateDate();e!==!1&&(this.calendar.setCurrentDate(e),this.calendar.show(e.getFullYear(),e.getMonth()))}}.bind(this)},_is_key_navigation:function(t){return t>32&&t<41},_is_key_valid:function(t){return 8===t||46===t||47===t||t>=48&&t<=57||t>=96&&t<=105||111===t},getElement:function(){return this.input},setDate:function(t){this.input.value=this.calendar.i18n.date2DateString(t)},getDate:function(){return this.calendar.i18n.dateString2Date(this.input.value)},checkDate:function(){var t=this.getDate();return!!t&&(!isNaN(t.getTime())&&(!!this._is_string_well_formed(this.input.value)&&(!!this.calendar.inRangeDate(t)&&t)))},checkAndValidateDate:function(){var t=this.checkDate();return t===!1?(this.setError(),!1):(this.setValidated(),t)},_is_string_well_formed:function(t){var e=this.calendar.i18n.dateString2Array(t);if(e.day<1||e.day>31)return!1;if(e.month<1||e.month>12)return!1;var n=(new Date).getFullYear()+10;return!(e.year<1970||e.year>n)},setError:function(){a.elementHasClass(this.input,"salsa-calendar-error")||(this.input.className+=" salsa-calendar-error")},setValidated:function(){this.input.className=this.input.className.replace(" salsa-calendar-error","")}},t.exports=i},function(t,e,n){"use strict";function i(t){this.from=t.from,this.to=t.to,this.nights_summary=document.getElementById(t.nightsNo),this.from.onSetCurrentDate(function(){this.updateNightsNo()}.bind(this)),this.to.onSetCurrentDate(function(){this.updateNightsNo()}.bind(this)),this.updateNightsNo()}var a=n(1);i.prototype={updateNightsNo:function(){var t=a.getElementsByClassName(this.nights_summary,"counter")[0],e=a.getElementsByClassName(this.nights_summary,"singular")[0],n=a.getElementsByClassName(this.nights_summary,"plural")[0],i=this._get_nights_no();return i?(t.innerHTML=i,void(i>1?(e.style.display="none",n.style.display=""):(e.style.display="",n.style.display="none"))):(t.innerHTML="",n.style.display="none",void(e.style.display="none"))},_get_nights_no:function(){var t=this.from.getCurrentDate(),e=this.to.getCurrentDate(),n=e.getTime()-t.getTime();return!(n<0)&&Math.round(n/1e3/60/60/24)}},t.exports=i},function(t,e){"use strict";Function.prototype.bind||(Function.prototype.bind=function(t){if("function"!=typeof this)throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");var e=Array.prototype.slice.call(arguments,1),n=this,i=function(){},a=function(){return n.apply(this instanceof i&&t?this:t,e.concat(Array.prototype.slice.call(arguments)))};return i.prototype=this.prototype,a.prototype=new i,a}),Array.prototype.indexOf||(Array.prototype.indexOf=function(t,e){for(var n=e||0,i=this.length;n<i;n++)if(this[n]===t)return n;return-1})}])});