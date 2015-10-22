$(function($) {
	var gui = require('nw.gui');
	var http = require('http');
	var nodeStatic = require('node-static');

	var path = localStorage.folderPath || ''; //文件目录
	var port = null;//监听端口
	var fileServer = null; //文件服务
	var server = null; //HTTP服务
	var serverUrl = ''; //服务地址

	//窗口操作及事件监听
	var win = gui.Window.get();
	var isShowWindow = false;
	win.show();
	isShowWindow = true;
	win.on('minimize', function() {
		win.hide();
		isShowWindow = false;
	})

	//创建托盘图标
	var tray = new gui.Tray({
		title: 'Static Server',
		icon: './icons/logo_16.png'
	});
	var menu = new gui.Menu();
	menu.append(new gui.MenuItem({
		type: 'normal',
		label: '退出',
		click: function() {
			stopServer(win.close());
		}
	}));
	tray.menu = menu;

	tray.on('click', function() {
		if (isShowWindow) {
			win.hide();
			isShowWindow = false;
		} else {
			win.show();
			isShowWindow = true;
		}
	});

	//界面对象操作及事件监听
	var $filePath = $('#filePath');
	var $inputBtn = $('#inputBtn');
	var $fileInput = $('#fileInput');
	var $gotoUrl = $('#gotoUrl');
	var $startBtn = $('#startBtn');
	var $stopBtn = $('#stopBtn');

	$($('footer > span').last()).text('V' + gui.App.manifest.version)

	$filePath.text(path);

	$inputBtn.click(function() {
		$fileInput.click();
	})

	$fileInput.change(function(e) {
		path = $(this).val();
		localStorage.folderPath = path;
		$filePath.text(path);
	})

	$gotoUrl.click(function() {
		gui.Shell.openExternal(serverUrl);
	})

	$startBtn.click(function() {
		port = $('#svcPort').val();
		startServer(path, port);
	})

	$stopBtn.click(function() {
		stopServer();
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
			console.log("Notification onshow:" + title);
		};

		return notification;
	}

	var startServer = function(path, port) {
		if (!path) {
			alert('请先设置服务目录！');
			return
		}

		fileServer = new nodeStatic.Server(path);
		server = http.Server(function(request, response) {
			request.addListener('end', function() {
				fileServer.serve(request, response);
			}).resume();
		});

		console.log(server);

		server.listen(port || 8080, function() {
			showNotification("./icons/logo_128.png", 'Web Server', 'is started on port ' + (port || 8080));
			serverUrl = 'http://127.0.0.1:' + port;
			$gotoUrl.text(serverUrl);
			$startBtn.attr('disabled', "true");
			$stopBtn.removeAttr("disabled");
		});

		server.on('error', function(e) {
			if (e.code == 'EADDRINUSE') {
				alert('Address in use, retrying...');
				setTimeout(function() {
					stopServer();
				}, 1000);
			}
		});
	}

	var stopServer = function(callback) {
		if (!server) {
			if (callback) {
				callback();
			};
			return;
		}

		$stopBtn.attr('disabled', "true");
		$stopBtn.find('span.glyphicon').removeClass('glyphicon-stop');
		$stopBtn.find('span.glyphicon').addClass('glyphicon-refresh glyphicon-refresh-animate');

		server.close(function() {
			server = null;
			fileServer = null;
			showNotification("./icons/logo_128.png", 'Web Server', 'is closed!');
			$stopBtn.find('span.glyphicon').removeClass('glyphicon-refresh glyphicon-refresh-animate');
			$stopBtn.find('span.glyphicon').addClass('glyphicon-stop');
			$gotoUrl.removeAttr("href");
			$gotoUrl.text('');
			$startBtn.removeAttr("disabled");

			if (callback) {
				callback();
			};
		})
	}

})