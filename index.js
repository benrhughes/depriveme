var clientId = '839550991886';
var apiKey = 'AIzaSyD6jfPPmLp0zruUdCy2HA4XopM_HO7j4kU';
var scopes = 'https://www.googleapis.com/auth/calendar';

var depriveCal = null;

function showProgress(message){
	$progress =	$('#progress');
	$progress.show();
	$progress.text(message);
}

function handleClientLoad(){
	gapi.client.setApiKey(apiKey);
}

function handleAuthResult(authResult) {

	if (authResult) {
		showProgress('Autenticated');
	  	getCalendar();
	} else {
		alert('Something went wrong, please try again');
	}
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
			 	"description": "Generated by depriveme.apphb.com",
			 	"timezone" : "Australia/Sydney"
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
	var data = getFormData();

	// TODO: keep track of used offsets - make sure we don't double up
	
	for (var i in data.items) {
		var offset = Math.floor(Math.random()*(parseInt(data.days)+1));

		var date = new Date();
		date.setDate(date.getDate() + offset);

		var dateString = date.getFullYear() + '-' + (parseInt(date.getMonth())+1) + '-' + date.getDate();

		showProgress('Adding ' + data.items[i]  + 'on' + dateString);

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

		req.execute(function(){return null;});

	};
}


function addRow(val){
	var rowHtml = '\
			<tr> \
				<td> \
					<input type="text" class="item" value="' + (val || "") + '" /> \
					</td> \
			</tr>';

	$('#items tbody:last').append(rowHtml);

}

function getFormData(){
	var data = {};
	data.days = $('#days').val();
	data.items = []

	$('.item').each(function(i){
		data.items.push(this.value);
	});

	return data;
}

$(document).ready(function(){
	$('#huh').hide();

	$('#progress').hide();

	addRow('Internet');
	addRow('Food');
	addRow('Hot Showers');

	$('#showHuh').click(function(e){
		e.preventDefault();
		$('#huh').show();
	});


	$('#hideHuh').click(function(e){
		e.preventDefault();
		$('#huh').hide();
	});

	$('#hideProgress').click(function(e){
		e.preventDefault();
		$('#progress').hide();

	});

	$('#submit').click(function(e){
		e.preventDefault();
		showProgress('Autenticating');

		// addEntries();
		gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
	});
});