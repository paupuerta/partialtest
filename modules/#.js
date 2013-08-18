// framework load
exports.onLoad = function(framework) {

	var db = framework.database('eshop');

	// set defaults
	framework.global.category = [];
	
	// read all category from database
	db.each(function(doc) {

		if (doc.type !== 'product')
			return;

		var category = framework.global.category.find(function(o) {
			return o.name === doc.category;
		});
		
		if (category !== null) {
			category.count++;
			return;
		}

		framework.global.category.push({ name: doc.category, link: '/' + doc.category.link() + '/', count: 1 });
	});

	// set defaults
	// on request to controller - load data about shopping cart and memory
	framework.on('controller', function(self) {

		if (!self.xhr) {

			var eshop = self.module('eshop');
			var cart = eshop.cart_load(self);

			var repository = self.repository;
			
			repository.price = 0;
			repository.count = 0;
			
			if (cart !== null) {
				repository.price = cart.price;
				repository.count = cart.count;
			}

			self.sitemap('Homepage', '/');

			var memory = process.memoryUsage();
			repository.heap = 'Memory usage: total {0} MB, used {1} MB'.format((memory.heapTotal / 1024 / 1024).floor(2), (memory.heapUsed / 1024 / 1024).floor(2));
		}
	});

	// schema for removing unnecessary data
	builders.schema('order', {
		firstname: String,
		lastname: String,
		email: String,
		telephone: String,
		delivery: String		
	});
};

// handle validation
exports.onValidation = function(name, value) {
	switch (name) {
		case 'isTerms':
			return value === '1';
		case 'delivery':
		case 'firstname':
		case 'lastname':
		case 'address':
		case 'telephone':			
			return value.length > 0;
		case 'email':
			return value.isEmail();
	}
};

// handle error
exports.onError = function(err, name, uri) {

	var path = uri === null ? '' : uri.href;
	this.log(err, '|', 'name: ' + (name || '').toString(), '|', 'path: ' + path);

	// output to console
	console.log(err, name, uri);
	console.log('--------------------------------------------------------------------');
};
