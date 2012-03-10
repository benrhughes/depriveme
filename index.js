var clientId = '839550991886';
var apiKey = 'AIzaSyD6jfPPmLp0zruUdCy2HA4XopM_HO7j4kU';
var scopes = 'https://www.googleapis.com/auth/calendar';

var depriveCal = null;

function showProgress(message){
	$('#progress').jqmShow();
	$('#message').text(message);
}

function handleClientLoad(){ // called when the google client.js has loaded
	gapi.client.setApiKey(apiKey);
}

function handleAuthResult(authResult) {
	if (!authResult)
		showProgress("Couldn't authenticate, please try again");

	showProgress('Authenticated');
  	getCalendar();
}

function getCalendar() {
	showProgress('Checking for an existing DepriveMe calendar');
	
	gapi.client.load('calendar', 'v3', function() {
	  	var request = gapi.client.calendar.calendarList.list();

	  	request.execute(function(res) {
    		if (res.error)
				return showProgress("An error occurred: " + res.error.message);

			depriveCal = _.find(res.items, function(item){ return item.summary == 'DepriveMe'; });

			if(depriveCal){
				showProgress('Calendar found');
				addEntries();
			}else{
				createCalendar()
			}
  		});
	});
}

function createCalendar(){
	showProgress('Creating a DepriveMe calendar');
	
	var req = gapi.client.calendar.calendars.insert(
		{"resource":
			{
			 	"summary": "DepriveMe",
			 	"description": "Generated by depriveme.apphb.com"
			}
		});

	req.execute(function(res){
		if (res.error)
			return showProgress("An error occurred: " + res.error.message);

		showProgress('Calendar created');
		depriveCal = res.result;

		addEntries();
	});
}

function addEntries(){
	showProgress('Adding items to calendar...');

	var data = getFormData();

	var usedOffsets = [];
	
	var days = parseInt(data.days);

	var completed = 0;

	for (var i in data.items) {
		var offset = 0;
		
		while (offset == 0){
			var offset = Math.floor(Math.random()*(days+1));

			if (usedOffsets.indexOf(offset) != -1 && days > data.items.length) // only look for unique dates if possible
				offset = 0;
		}

		usedOffsets.push(offset);

		var date = new Date();
		date.setDate(date.getDate() + offset);

		var dateString = date.getFullYear() + '-' + (parseInt(date.getMonth())+1) + '-' + date.getDate();

		var params = {
			"calendarId" : depriveCal.id,
			"resource": 
			{
				"summary": data.items[i],
				"start": {"date": dateString},
				"end": {"date": dateString}
			}
		};
	
		var req = gapi.client.calendar.events.insert(params);

		req.execute(function(){
			completed++;

			if(completed == data.items.length)
				showProgress('All done! ' + completed + ' items added');
		});

	};
}


function addRow(val){
	var rowHtml = '\
		<tr> \
			<td> \
				<input type="text" class="item" value="' + (val || "") + '" /> \
			</td> \
			<td class="add"> \
				<div class="button"><a id="addButton" href="#">+</a></div> \
			</td> \
		</tr>';

	$('#items tr:last > td.add:last').text("");

	$('#items tbody:last').append(rowHtml);

	$('#items input:last').focus();

}

function getFormData(){
	var data = {};
	data.days = $('#days').val();
	data.items = []

	$('.item').each(function(i){
		if (this.value)
			data.items.push(this.value);
	});

	return data;
}

$(document).ready(function(){
	$('#huh').hide();

	$('#progress').hide();
	$('#progress').jqm();

	addRow('Internet');
	addRow('Food');
	addRow('Hot Showers');

	$('#items input:first').focus();

	$('#showHuh').click(function(e){
		e.preventDefault();
		$('#huh').jqmShow();
	});

	$('#huh').jqm();

	$('#addButton').live("click", function(e){
		e.preventDefault();
		addRow();
	});

	$('#submit').click(function(e){
		e.preventDefault();
		showProgress('Authenticating with Google');

		gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
	});
});