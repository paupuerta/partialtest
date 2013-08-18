exports.install = function(framework) {
    
    framework.route('/cart/', view_cart);
	framework.route('/cart/', json_cart, ['xhr', 'post']);
    framework.route('/cart/order/', view_order);
    framework.route('/cart/order/', json_order, ['xhr', 'post']);

	framework.route('/order/{id}/', view_order_detail);

};

// View shopping cart items
function view_cart() {
	
	var self = this;
	var eshop = self.module('eshop');

	eshop.cart_list(self, function(products, price, count) {
		self.view('shoppingcart', { products: products, price: price, count: count });
	});
}

// Add / Remove product from shopping cart
function json_cart() {

	var self = this;

	var eshop = self.module('eshop');
	var db = eshop.database;

	var add = self.post.add === '1';

	if (!add) {
		var name = self.post.name || '';
		self.json(eshop.cart_remove(self, name));
		return;
	}
	
	var link = self.post.link || '';

	db.find_one(link, false, function(doc) {
		self.json(eshop.cart_add(self, doc.name, doc.price));
	});
}

// View order form
function view_order() {
	var self = this;

	// shopping cart product count
	// modules/#.js
	
	if (self.repository.count === 0)
		return self.redirect('../');

	self.sitemap('Shopping cart', '../');
	self.sitemap('Create order');

	self.view('form', { email: '@' });
}

// Create order via post data
function json_order() {
	var self = this;
	
	// modules/#.json -> onValidation
	var result = self.validation(self.post, ['delivery', 'firstname', 'lastname', 'telephone', 'email', 'address', 'isTerms'], 'form-');
	
	if (result.hasError()) {
		self.json(result);
		return;
	}

	// remove unnecessary data
	var model = builders.prepare('order', self.post);

	var eshop = self.module('eshop');
	var cart = eshop.cart_load(self);
	var db = self.database('orders');

	if (cart === null) {
		self.view404();
		return;
	}

	model.date = new Date();
	model.id = utils.GUID(30);
	model.status = 'pending';
	model.price = cart.price;
	model.count = cart.count;
	model.products = [];
	model.ip = self.req.ip;

	Object.keys(cart.products).forEach(function(name) {
		var product = cart.products[name];
		model.products.push({ name: name, count: product.count, price: product.price });
	});

	// clear shopping cart
	eshop.cart_clear(self);

	// save order to database
	db.insert(model, function(){
		self.json({ url: '/order/{0}/'.format(model.id) });
	});	
};

// View order detail
function view_order_detail(id) {

	var self = this;
	var db = self.database('orders');

	db.one(expression('doc.id === id', ['doc', 'id'], id), function (doc) {

		if (doc === null) {
			self.view404();
			return;
		}

		self.view('detail', doc);
	});
};