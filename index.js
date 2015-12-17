$(function($) {
	//模块依赖
	var gui = require('nw.gui');
	var http = require('http');
	var nodeStatic = require('node-static');

	//全局变量定义
	var path = localStorage.folderPath || ''; //文件目录
	var port = null; //监听端口
	var fileServer = null; //文件服务
	var server = null; //HTTP服务
	var serverUrl = ''; //服务地址

	var aboutWindow = null;

	//窗口操作及事件监听
	var mainWindow = gui.Window.get();
	var isShowWindow = false;
	mainWindow.show();
	isShowWindow = true;
	mainWindow.on('minimize', function() {
		mainWindow.hide();
		isShowWindow = false;
	});
	mainWindow.on('closed', function() {
		if (aboutWindow) {
			aboutWindow.close();
		};
	})

	//创建托盘图标
	var tray = new gui.Tray({
		title: 'Static Server',
		icon: './icons/logo_16.png'
	});
	var menu = new gui.Menu();
	menu.append(new gui.MenuItem({
		type: 'normal',
		label: '关于',
		click: function() {
			showAbout();
		}
	}));
	menu.append(new gui.MenuItem({
		type: 'normal',
		label: '退出',
		click: function() {
			stopServer(mainWindow.close());
		}
	}));
	tray.menu = menu;

	tray.on('click', function() {
		if (isShowWindow) {
			mainWindow.hide();
			isShowWindow = false;
		} else {
			mainWindow.show();
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

	var $portInput = $('#svcPort');
	var $cacheInput = $('#cacheTime');
	var $gzipInput = $('#gzipCompress');

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
		port = $portInput.val();

		var cacheTime = parseInt($cacheInput.val());
		if(isNaN(cacheTime)) { 
			alert('缓存时间必须是数字类型！');
			return;
		}

		var options = {};
		options.cache = cacheTime === 0 ? false : cacheTime * 60;
		options.gzip = $gzipInput.prop('checked');
		console.log(options)
		startServer(path, options, port);
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

	var startServer = function(path, options, port) {
		if (!path) {
			alert('请先设置服务目录！');
			return
		}

		fileServer = new nodeStatic.Server(path, options);
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
			disableEdit();
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
			enableEdit();
			if (callback) {
				callback();
			};
		})
	}

	var enableEdit = function() {
		$portInput.removeAttr('disabled');
		$gzipInput.removeAttr('disabled');
		$cacheInput.removeAttr('disabled');
	}

	var disableEdit = function(){
		$portInput.attr('disabled', 'disabled');
		$gzipInput.attr('disabled', 'disabled');
		$cacheInput.attr('disabled', 'disabled');
	}	

	var showAbout = function() {
		var params = {
			toolbar: false,
			resizable: false,
			show: true,
			height: 600,
			width: 500,
			icon: './icons/logo_16.png'
		};

		aboutWindow = gui.Window.open('about.html', params);
		aboutWindow.on('closed', function() {
			mainWindow.show();
		})
	}

})