var products = null;

var COOKIE_CART = '__cart';

exports.install = function(framework) {
	products = new Products(framework);
	exports.database = products;
};

exports.cart_load = function(controller) {
	var id = controller.req.cookie(COOKIE_CART) || '';

	if (id.length !== 30)
		return null;

	return controller.cache.read(COOKIE_CART + id);
};

exports.cart_create = function(controller) {
	
	var id = utils.GUID(30);
	var cart = new Cart();

	controller.cache.write(COOKIE_CART + id, cart, new Date().add('m', 5));
	controller.res.cookie(COOKIE_CART, id, new Date().add('d', 1));

	return cart;
};

exports.cart_add = function(controller, name, price) {

	var cart = exports.cart_load(controller);
	if (cart === null)
		cart = exports.cart_create(controller);

	cart.add(name, price);
	return cart;
};

exports.cart_remove = function(controller, name) {
	
	var cart = exports.cart_load(controller);
	if (cart === null)
		return new Cart();

	cart.remove(name);
	return cart;
};

exports.cart_clear = function(controller) {
	
	var id = controller.req.cookie(COOKIE_CART) || '';
	if (id.length !== 30)
		return false;

	controller.cache.remove(COOKIE_CART + id);
	return true;
};

exports.cart_list = function(controller, callback) {

	var cart = exports.cart_load(controller);

	if (cart === null) {		
		callback([], 0, 0);
		return;
	}

	var products = [];

	Object.keys(cart.products).forEach(function(name) {
		var product = cart.products[name];
		products.push({ name: name, count: product.count, price: product.price });
	});

	callback(products, cart.price, cart.count);
};

/*
	============================================================
	SHOPPING CART
	============================================================
*/

function Cart() {
	this.count = 0;
	this.price = 0;
	this.products = {};
};

Cart.prototype.add = function(name, price) {

	var self = this;
	var product = self.products[name];

	if (typeof(product) !== 'undefined') {
		product.count++;
		self.sumarize();
		return self;
	}

	self.products[name] = { count: 1, price: price };
	self.sumarize();
	return self;
};

Cart.prototype.remove = function(name) {

	var self = this;
	var product = self.products[name];

	if (typeof(product) === 'undefined')
		return self;

	product.count--;

	if (product.count > 0) {
		self.sumarize();
		return self;
	}

	delete self.products[name];
	self.sumarize();

	return self;
};

Cart.prototype.sumarize = function() {
	
	var self = this;
	
	self.count = 0;
	self.price = 0;

	Object.keys(self.products).forEach(function(name) {
		var product = self.products[name];
		self.count += product.count;
		self.price += product.count * product.price;
	});

	return self;
};

/*
	============================================================
	PRODUCTS
	============================================================
*/

function Products(framework) {
	this.framework = framework;
	this.db = framework.database('eshop');
};

// find products
Products.prototype.find_all = function(options, callback) {

	var self = this;
	var db = self.db;

	if (typeof(options.category) === 'undefined')
		options.category = '';

	var category = self.find_category(options.category);

	if (category === null && options.category !== '') {
		callback(new Error('notfound'));
		return;
	}

	var count = self.count(category === null ? '' : category.name);
	var pagination = new builders.PageBuilder(count, options.page, options.max);

	options.max = options.max || 16;
	options.page = options.page || 1;	

	var fnFilter = function(o) {		
		if (o.type !== 'product')
			return false;

		if (category === null)
			return true;

		return o.category === category.name;
	};

	var fnCallback = function(selected) {

        var model = [];

        selected.forEach(function(product, index) {
        	var category = self.find_category(product.category, true);
            model.push({ name: product.name, price: product.price, image: '/images/{0}.jpg'.format(product.file), url: '/shop{0}{1}/'.format(category.link, product.link) });
        });

        /*
      		Params:
      		@error {Error}
      		@products {Array}
      		@pagination {Object}
      		@category {Object}
      	*/
        callback(null, model, pagination, category);
	};

	if (!options.random) {
		
		db.all(fnFilter, fnCallback, pagination.skip, pagination.take);
		return;

	}

	var index = [];
	var selected = [];

	for (var i = 0; i < options.max; i++)
		index.push(utils.random(count));

	index.sort(expression('a > b ? 1 : -1', ['a', 'b']));

	db.each(function(doc, offset) {
		if (index.indexOf(offset) !== -1)
			selected.push(doc);
	}, function() {
		fnCallback(selected);
	});
};

// find one
Products.prototype.find_one = function(id, random, callback) {

	var self = this;
	var db = self.db;

	db.one(expression('doc.link === link', ['doc', 'link'], id), function(doc) {

		if (doc === null) {
			callback(null);
			return;
		}
		
		doc.image = '/images/{0}.jpg'.format(doc.file);

		if (!random) {
			callback(doc);
			return;
		}

		// random products
		var options = { max: 8, page: 1, random: true, category: '' };

		self.find_all(options, function(err, products) {
			doc.random = products;
			callback(doc);
		});		
	});
};

// find category
Products.prototype.find_category = function(value, byName) {
	
	if (value === '')
		return null;

	if (!byName)
		value = '/' + value + '/';

	return this.framework.global.category.find(function(o) {
		return byName ? o.name === value : o.link === value;
	});
	
};

// get product count
Products.prototype.count = function(category) {
	
	var count = 0;	
	category = category || '';

	this.framework.global.category.forEach(function(o) {

		if (category.length === 0) {
			count += o.count;
			return;
		}

		if (o.name === category)
			count += o.count;
	});

	return count;
};