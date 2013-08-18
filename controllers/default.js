exports.install = function(framework) {
    framework.route('#404', error404);
    framework.route('#500', error500);
    framework.route('/usage/', view_usage);
};

// Not Found
function error404() {
    this.view('404');
}

// Internal Server Error
function error500() {
    this.view('500');
}

function view_usage() {
    var self = this;
    self.plain(self.app.usage(true));
}