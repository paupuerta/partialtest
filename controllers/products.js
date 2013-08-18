exports.install = function(framework) {

    framework.route('/', view_products);
    framework.route('/shop/{category}/', view_products);
    framework.route('/shop/{category}/{link}/', view_detail);
    framework.file('load picture from database', function(req) { return req.url.indexOf('/images/') !== -1; }, static_image);
    
};

// View all products from database
function view_products(category) {
    
    var self = this;

    var db = self.module('eshop').database;
    var options = { category: category, max: 16, page: (self.get.page || '1').parseInt() };

    var callback = function(err, docs, pagination, category) {
        if (category !== null)
            self.repository.title = category.name;

        var model = {
            products: docs,
            count: pagination.items,
            pages: null
        };

        model.pages = pagination.render(function(index) {
            return { url: (category === null ? '/' : '/shop' + category.link) + '?page=' + index, page: index.toString() }
        });

        self.view('list', model);
    };

    db.find_all(options, callback);
};

// View product detail from database
function view_detail(category, link) {

    var self = this;
    var db = self.module('eshop').database;

    category = db.find_category(category);
    
    if (category === null) {
        self.view404();
        return;
    }

    db.find_one(link, true, function(product, count) {

        if (product === null) {
            self.view404();
            return;
        }

        self.meta(product.name);
        self.sitemap(category.name, '/shop' + category.link);
        self.sitemap(product.name);

        self.view('detail', product);
    });
};

// Serve image from database products
function static_image(req, res) {
    
    // this === framework
    var self = this;

    var db = self.database('eshop');
    var id = req.uri.pathname.replace('/images/', '').replace('.jpg', '');

    // check client cache via etag
    // if not modified - framework send automatically 304
    // id === etag
    if (self.notModified(req, res, id))
        return;

    db.binary.read(id, function(err, stream, header) {

        if (err) {
            self.response404(req, res);
            return;
        }

        // set client cache via etag
        self.setModified(req, res, id);

        // req, res, filename, stream, [downloadname], [headers]
        self.responseStream(req, res, 'image/jpeg', stream);
    });
}