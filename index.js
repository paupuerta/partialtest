var framework = require('partial.js');

var http = require('http');
var os = require('os');

var index = process.argv.indexOf('backup');
if (index !== -1) {
	framework.backup(function(err, path) {
		console.log('Backup: ' + (err ? err.toString() : path));
	});
	return;
}

index = process.argv.indexOf('restore');
if (index !== -1) {
	var restore = process.argv[index + 1] || '';
	framework.restore(restore, function(err, path) {
		console.log('Restore: ' + (err ? err.toString() : path));
	});
	return;
}

var port = parseInt(process.argv[2] || '8000');
var debug = os.platform() !== 'freebsd';

framework.run(http, debug, port);

if (debug)
	console.log("http://127.0.0.1:{0}/".format(port));