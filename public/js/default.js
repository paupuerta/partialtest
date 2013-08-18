$(document).ready(function(){
	
	var a = window.location.pathname.split('/');
	var u = '/';

	if (a.length > 2)
		u = '/' + a[1] + '/' + a[2] + '/';

	// highlight menu item
	$(".category").find("a[href='" + u + "']").addClass("d");

	// add product to cart
	$('button[name="buy"]').bind('click', function() {

		var path = window.location.pathname;
		var index = path.lastIndexOf('/', path.length - 2);
		
		path = path.substring(index + 1).replace('/', '');

		$.post('/cart/', { link: path, add: 1 }, function(d) {
			$('.cart-price').html(d.price + ' &euro;');
			$('.cart-added').slideDown(300);
			refreshCart();
		});	
	});

	// remove product from cart
	$('a.remove').bind('click', function() {
		var id = $(this).parent().parent().find('td:first-child').html();
		$.post('/cart/', { name: id, add: 0 }, function(d) {
			window.location.href = window.location.pathname;
		});
	});

	// button redirect
	$('button[name="redirect"]').bind('click', function() {
		window.location.href = $(this).attr('itemprop');
	});

	// create order
	$('button[name="order"]').bind('click', function() {
		$.post(window.location.pathname, $('form').serialize(), function(d) {
			
			var obj = typeof(d) != 'string' ? d : JSON.parse(d);
			var elErr = $('#error');
			if (obj.length > 0) {
				
				// error;
				elErr.empty();
				for (var i = 0; i < obj.length; i++) {
					var err = obj[i];
					elErr.append('<div><span class="icon11 red icon-minus-sign"></span> ' + err.error + '</div>');
				}

				elErr.slideDown(300);
				return;
			}

			$('form').trigger('reset');
			elErr.hide();
			window.location.href = obj.url;
		});
	});

	var paging = $('.paging');
	var pagingSelected = paging.find('a[href="' + window.location.pathname + window.location.search + '"]').addClass('d');
	
	if (pagingSelected.length == 0)
		paging.find('a:first').addClass('d');

	refreshCart();
});

function refreshCart() {
	var el = $('.cart-price');
	var num = parseInt(el.html().match(/\d+/));
	if (num > 0)
		el.parent().addClass('red');
	else
		el.parent().removeClass('red');
};