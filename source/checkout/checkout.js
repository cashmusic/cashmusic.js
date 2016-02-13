
(function() {
	'use strict';
	var cm = window.cashmusic;

	/***************************************************************************************
	 *
	 * window.cashmusic.stripe (object)
	 * Handle Stripe.com payment token generation
	 *
	 ***************************************************************************************/
	cm.stripe = {
		formElements: [
         {id: "name", type: "text", placeholder: "Cardholder name"},
         {id: "email", type: "email", placeholder: "Email address"},
         {id: "card-number", type: "text", placeholder: "Credit card number"},
         {id: "card-cvc", type: "text", placeholder: "CVV"},
         {id: "card-expiry-month", type: "text", placeholder: "12"},
         {id: "card-expiry-year", type: "text", placeholder: new Date().getFullYear()},
         {id: "stripe-submit", type: "submit", text: "Submit Payment"}
   	],

		generateToken: function(key,source) {
			var cm = window.cashmusic;
			if (cm.embedded) {
				cm.events.fire(cm,'stripetokenrequested',params);
			} else {
				cm.loadScript('https://js.stripe.com/v2/', function() {
					cm.userinput.getInput(cm.stripe.formElements,'getstripetoken');
					cm.events.add(cm,'userinput', function(e) {
						if (e.detail['cm-userinput-type'] == 'getstripetoken') {
							Stripe.setPublishableKey(key);
			            Stripe.card.createToken({
			                name: e.detail['name'],
			                number: e.detail['card-number'],
			                cvc: e.detail['card-cvc'],
			                exp_month: e.detail['card-expiry-month'],
			                exp_year: e.detail['card-expiry-year']
			            }, function(status, response, evt) {
			               if (response.error) {
			                  // Show the errors on the form
									document.getElementById('cm-userinput-message').innerHTML = response.error.message;
			               } else {
			                  // response contains id and card, which contains additional card details
			                  cm.storage['checkoutdata']['stripe'] = response.id;
									cm.events.fire(cm,'checkoutdata',cm.storage['checkoutdata'],source);
			               }
			            });

						}
					});
				});
			}
		}
	};

	cm.userinput = {
		// temp form injection stuff for stripe, but we can make it for anything
		// inject = optional div to injec
		getInput: function (elements,type) {
			type = type || 'unknown';
			var form = document.createElement('form');
			var container = document.createElement('div');
			var message = document.createElement('div');
			message.id = 'cm-userinput-message';
			form.className = 'cm-userinput ' + type;

			elements.push({id:'cm-userinput-type', type:'hidden', value:type});

			elements.forEach(function(element) {
				if (element.type !== "submit") {
					var input = document.createElement("input");
					input.type = element.type;
					input.name = element.id;
					input.placeholder = element.placeholder;
					input.id = element.id;
					if (element.value) {
						input.value = element.value;
					}
					form.appendChild(input);
				} else {
					var button = document.createElement("button");
					button.type = "submit";
					button.id = element.id;
					button.innerHTML = element.text;
					form.appendChild(button);
				}
			});

			container.appendChild(form);
			container.appendChild(message);

			cm.events.add(form,'submit', function(e) {
				e.preventDefault();
				e.stopPropagation();
				var formdata = {};
	         for ( var i = 0; i < form.elements.length; i++ ) {
	            var e = form.elements[i];
	            formdata[e.name] = e.value;
	         }
				cm.events.fire(cm,'userinput',formdata);
			});

			cm.overlay.reveal(container);
		}
	};

	cm.checkout = {
		shippingElements: [
			{id: "name", type: "text", placeholder: "Ship to name"},
         {id: "address", type: "text", placeholder: "Ship to address"},
			{id: "shipping-submit", type: "submit", text: "Set shipping info"}
		],

		begin: function (options,source) {
			if (cm.embedded) {
				cm.events.fire(cm,'begincheckout',options);
			} else {
				cm.storage['checkoutdata'] = {
					'stripe'   :false,
					'paypal'   :false,
					'shipping' :false
				};

				if (location.protocol !== 'https:' && options.testing !== true) {
					options.stripe = false;
				}
				if (options.shipping) {
					if (options.stripe || options.paypal) {
						cm.userinput.getInput(cm.checkout.shippingElements,'getshippingaddress');
						cm.events.add(cm,'userinput', function(e) {
							if (e.detail['cm-userinput-type'] == 'getshippingaddress') {
								cm.storage['checkoutdata']['shipping'] = e.detail;
								cm.checkout.initiatepayment(options,source);
							}
						});
					} else {
						console.log('no valid payment types');
					}
				} else {
					cm.checkout.initiatepayment(options,source);
				}
			}
		},

		initiatepayment: function (options,source) {
			if (options.stripe && !options.paypal) {
				cm.stripe.generateToken(options.stripe,source);
			} else if (!options.stripe && options.paypal) {
				cm.storage['checkoutdata']['paypal'] = true;
				cm.events.fire(cm,'checkoutdata',cm.storage['checkoutdata'],source);
			} else if (options.stripe && options.paypal) {
				console.log('bothsies!');
			} else {
				console.log('no valid payment types');
			}
		}
	}

}()); // END
