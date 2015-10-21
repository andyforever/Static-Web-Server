$(function($) {
	var gui = require('nw.gui');
	var http = require('http');
	var nodeStatic = require('node-static');

	var path = localStorage.folderPath || '';
	var port = null;
	var fileServer = null;
	var server = null;

	var serverUrl = '';

	var tray = new gui.Tray({
		title: 'Static Server',
		icon: './icons/logo_16.png'
	});

	var win = gui.Window.get();
	var isShowWindow = true;

	var menu = new gui.Menu();
    menu.append(new gui.MenuItem({ type: 'checkbox', label: '退出', click: function(){
    	win.close();
    } }));
    tray.menu = menu;

	tray.on('click', function(){
			if (isShowWindow) {
				win.hide();
				isShowWindow = false;
			} else {
				win.show();
				isShowWindow = true;
			}
		}
	);

	win.on('minimize', function() {
		win.hide();
		isShowWindow = false;
	})

	$('#fileUrl').text(path);

	$('#inputBtn').click(function() {
		$('#fileInput').click();
	})

	$('#fileInput').change(function(e) {
		path = $(this).val();
		localStorage.folderPath = path;
		$('#fileUrl').text(path);
	})

	$('#gotoUrl').click(function() {
		gui.Shell.openExternal(serverUrl);
	})

	$('#startBtn').click(function() {
		var self = this;

		if (!path) {
			alert('请先设置服务目录！');
			return
		}

		port = $('#svcPort').val();

		fileServer = new nodeStatic.Server(path);
		server = http.createServer(function(request, response) {
			request.addListener('end', function() {
				fileServer.serve(request, response);
			}).resume();
		});

		server.listen(port || 8080, function() {
			showNotification("./icons/logo_128.png", 'Web Server', 'is started on port ' + (port || 8080));
			serverUrl = 'http://127.0.0.1:' + port;
			$('#gotoUrl').text(serverUrl);
			$(self).attr('disabled', "true");
			$('#stopBtn').removeAttr("disabled");
		});
	})

	$('#stopBtn').click(function() {
		var self = this;
		server.close(function() {
			$(self).attr('disabled', "true");
			$('#startBtn').removeAttr("disabled");
			$('#gotoUrl').removeAttr("href");
			$('#gotoUrl').text('');
			showNotification("./icons/logo_128.png", 'Web Server', 'is closed!');
		});
	});

	var showNotification = function(icon, title, body) {
		if (icon && icon.match(/^\./)) {
			icon = icon.replace('.', 'file://' + process.cwd());
		}

		var notification = new Notification(title, {
			icon: icon,
			body: body
		});

		notification.onclick = function() {
			console.log("Notification clicked");
		};

		notification.onclose = function() {
			console.log("Notification closed");
			gui.Window.get().focus();
		};

		notification.onshow = function() {
			console.log("-----<br>" + title);
		};

		return notification;
	}

})