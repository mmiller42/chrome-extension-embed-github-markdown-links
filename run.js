;(function () {
	var CONTENT_SELECTOR = 'article.entry-content';
	var LINK_SELECTOR = 'a[href^="https://github.com"][href$=".md"]';
	var EMBED_STYLE = {
		borderColor: '#4078c0',
		background: '#fcfcff'
	};

	var anchors = document.querySelectorAll(CONTENT_SELECTOR + ' ' + LINK_SELECTOR);
	[].forEach.call(anchors, function (anchor) {
		getUrl(anchor.getAttribute('href'), function (err, html) {
			if (err) {
				throw err;
			}

			var doc = parseHtml(html);
			var content = doc.querySelector(CONTENT_SELECTOR);
			Object.keys(EMBED_STYLE).forEach(function (prop) {
				content.style[prop] = EMBED_STYLE[prop];
			});

			var anchorBlock = getClosestBlockAncestor(anchor);
			anchorBlock.insertAdjacentHTML('afterend', content.outerHTML);
		});
	});

	function getUrl (url, callback) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.onreadystatechange = function () {
			if (request.readyState === 4) {
				if (request.status < 200 || request.status >= 400) {
					return callback(new Error('Request failed.'));
				}
				callback(null, request.responseText);
			}
		};

		request.send();
	}

	function parseHtml (html) {
		var doc = document.implementation.createHTMLDocument();
		doc.body.innerHTML = html;
		return doc.body;
	}

	function getClosestBlockAncestor (element) {
		var currentElement = element.parentElement;
		while (currentElement) {
			var display = window.getComputedStyle(currentElement).getPropertyValue('display');
			if (display === 'block' || display === 'table') {
				return currentElement;
			}

			currentElement = currentElement.parentElement;
		}

		return null;
	}
}());
