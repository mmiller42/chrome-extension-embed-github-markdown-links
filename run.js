;(function () {
	var CONTENT_SELECTOR = 'article.entry-content';
	var EMBED_STYLE = {
		borderColor: '#4078c0',
		background: '#fcfcff',
		position: 'relative'
	};
	var HREF_REGEX = /^((https?\:\/\/github\.com)|\/).*\.md(#.*)?$/;

	var mainContent = document.querySelector(CONTENT_SELECTOR);
	if (!mainContent) {
		return;
	}

	var anchors = Array.prototype.slice.call(mainContent.querySelectorAll('a[href]')).reverse();
	anchors = anchors.filter(function (anchor) {
		var href = anchor.getAttribute('href');
		if (HREF_REGEX.test(href)) {
			anchor.setAttribute('data-jump', href.split('#')[1] || '');
			return true;
		}
		return false;
	});

	anchors.forEach(function (anchor) {
		getUrl(anchor.getAttribute('href'), function (err, html) {
			if (err) {
				throw err;
			}

			var doc = parseHtml(html);
			var content = parseHtml(doc.querySelector(CONTENT_SELECTOR).outerHTML).children[0];
			content.innerHTML = '<div>' + content.innerHTML + '</div>';

			var jump = anchor.getAttribute('data-jump');
			if (jump) {
				window.setTimeout(function () {
					clipToRelevantContent(content, jump);
				}, 100);
				window.addEventListener('resize', function () {
					clipToRelevantContent(content, jump);
				});
			}
			Object.keys(EMBED_STYLE).forEach(function (prop) {
				content.style[prop] = EMBED_STYLE[prop];
			});

			var close = document.createElement('a');
			close.innerHTML = '<svg class="octicon octicon-x" viewBox="0 0 12 16" version="1.1" width="16" height="16"><path fill-rule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48z"></path></svg>';
			close.style.position = 'absolute';
			close.style.top = '4px';
			close.style.right = '8px';
			close.style.cursor = 'pointer';
			close.addEventListener('click', function () {
				content.parentNode.removeChild(content);
			});
			content.firstChild.insertBefore(close, content.firstChild.firstChild);

			var anchorBlock = getClosestBlockAncestor(anchor);
			anchorBlock.insertAdjacentElement('afterend', content);
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

	function clipToRelevantContent (content, sectionId) {
		var sectionHeader = content.querySelector('#user-content-' + sectionId);
		if (!sectionHeader) {
			return;
		}
		sectionHeader = sectionHeader.parentNode;

		content.style.overflowY = '';
		content.style.height = '';
		content.firstChild.style.marginTop = '';

		var clone = content.cloneNode(true);
		var sectionHeader = clone.querySelector('#user-content-' + sectionId).parentNode;

		var tempContainer = document.createElement('div');
		tempContainer.className = 'container readme';
		tempContainer.style.position = 'absolute';
		tempContainer.style.top = '0';
		tempContainer.style.opacity = '0';
		var innerTempContainer = document.createElement('article');
		innerTempContainer.className = 'markdown-body entry-content';
		tempContainer.appendChild(innerTempContainer);
		innerTempContainer.appendChild(clone);
		document.body.appendChild(tempContainer);

		var largerHeaderTags = [];
		for (var i = parseInt(sectionHeader.tagName.charAt(1), 10); i >= 1; --i) {
			largerHeaderTags.push('h' + i);
		}

		var nextHeader;
		var allHeaders = clone.querySelectorAll(largerHeaderTags.join(', '));
		Array.prototype.every.call(allHeaders, function (header, i) {
			if (header === sectionHeader) {
				nextHeader = allHeaders[i + 1];
				return false;
			}
			return true;
		});

		var marginTop = '-' + (sectionHeader.offsetTop - sectionHeader.offsetHeight) + 'px';
		var height = (
			(nextHeader ? nextHeader.offsetTop : tempContainer.offsetHeight)
			- sectionHeader.offsetTop
		) + 'px';

		document.body.removeChild(tempContainer);

		content.style.overflowY = 'hidden';
		content.style.height = height;
		content.firstChild.style.setProperty('margin-top', marginTop, 'important');
	}
}());
