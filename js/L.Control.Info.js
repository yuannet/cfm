(function(L) {
    if (typeof L === 'undefined') {
        throw new Error('Leaflet must be included first');
    }
    
	L.Control.Info = L.Control.extend({
		options: {
			title: 'Info',
			titleTooltip: 'Click here for more info',
			content: '',
			maxWidth: '300px',
			titleClass: 'box_info',
			contentClass: 'box_info'
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);
			this._infoTitle = this.options.title;
			this._infoContent = this.options.content;
			this._titleShown = false;
			this._titleClass = this.options.titleClass;
			this._contentClass = this.options.contentClass;
			// this._infoTitleStyle = 'padding: 10px;     background-color: #343434;     color: white; font-size: 14px;';
			this._infoTitleStyle = 'padding: 4px 0px; font-size: 24px; width: 44px; height: 44px; text-align: center';
			this._infoContainerClasses = 'leaflet-control-layers leaflet-control';
		},

		onAdd: function(map) {
			var infoContainer = L.DomUtil.create('div', 'leaflet-control-layers');

			var infoTitle = L.DomUtil.create('div');
			infoContainer.appendChild(infoTitle);
			infoTitle.setAttribute('style', this._infoTitleStyle);

			var infoBody = L.DomUtil.create('div', 'leaflet-popup-content-wraper');
			infoContainer.appendChild(infoBody);
			infoBody.setAttribute('style', 'max-width:' + this.options.maxWidth);

			var infoCloseButtonBox = L.DomUtil.create('div');
			infoBody.appendChild(infoCloseButtonBox);
			infoCloseButtonBox.setAttribute('style', 'position: sticky; position: -webkit-sticky; top: 0;');

			var infoContent = L.DomUtil.create('div', 'leaflet-popup-content');
			infoBody.appendChild(infoContent);

			var infoCloseButton = L.DomUtil.create('a', 'leaflet-popup-close-button');
			infoCloseButtonBox.appendChild(infoCloseButton);
			infoCloseButton.innerHTML = 'x';
			infoCloseButton.setAttribute('style', 'cursor: pointer');


			this._infoContainer = infoContainer;
			this._infoTitleContainer = infoTitle;
			this._infoBodyContainer = infoBody;
			this._infoContentContainer = infoContent;
			this._infoCloseButtonContainer = infoCloseButton;

			infoTitle.innerHTML = this._infoTitle;
			infoContent.innerHTML = this._infoContent;
			this._showTitle();

			L.DomEvent.disableClickPropagation(infoContainer);
			L.DomEvent.on(infoCloseButton, 'click', L.DomEvent.stop);
			L.DomEvent.on(infoContainer, 'click', this._showContent, this);
			L.DomEvent.on(infoCloseButton, 'click', this._showTitle, this);

			return infoContainer;
		},

		onRemove: function(map) {},

		setTitle: function(title) {
			this._infoTitle = title;
			if (this._infoTitleContainer != null) {
				this._infoTitleContainer.innerHTML = title;
			}
		},

		setTitleTooltip: function(titleTooltip) {
			this._infoTitleTooltip = titleTooltip;
			if (this._titleShown) {
				this._showTitleTooltip(true);
			}
		},

		setContent: function(content) {
			this._infoContent = content;
			if (this._infoContentContainer != null) {
				this._infoContentContainer.innerHTML = content;
			}
		},

		setTitleClass: function(titleClass) {
			this._titleClass = titleClass;
			if (this._titleShown) {
				this._addInfoClass(this._titleClass);
			}
		},

		setContentClass: function(contentClass) {
			this._contentClass = contentClass;
			if (!this._titleShown) {
				this._addInfoClass(this._contentClass);
			}
		},

		_showTitle: function(evt) {
			this._addInfoClass(this._titleClass);
			this._displayElement(this._infoTitleContainer, true);
			this._displayElement(this._infoBodyContainer, false);
			this._displayElement(this._infoCloseButtonContainer, false);
			this._showTitleTooltip(true);
			this._setCursorToPointer(this._infoContainer, true);
			this._titleShown = true;
		},

		_showContent: function(evt) {
			this._addInfoClass(this._contentClass);
			this._displayElement(this._infoTitleContainer, false);
			this._displayElement(this._infoBodyContainer, true);
			this._displayElement(this._infoCloseButtonContainer, true);
			this._showTitleTooltip(false);
			this._setCursorToPointer(this._infoContainer, false);
			this._titleShown = false;
			// console.log("showcontent");
			// infographChart.update();
		},

		_showTitleTooltip: function(showIt) {
			this._infoContainer.setAttribute('Title', (showIt) ? this._infoTitleTooltip : '');
		},

		_displayElement: function(element, displayIt) {
			element.style.display = (displayIt) ? '' : 'none';
		},

		_setCursorToPointer: function(element, setIt) {
			element.style.cursor = (setIt) ? 'pointer' : '';
		},

		_addInfoClass: function(classToAdd) {
			L.DomUtil.setClass(this._infoContainer, this._infoContainerClasses + ' ' + classToAdd);
		}
	});

	L.control.info = function(opts) { return new L.Control.Info(opts); }
})(L);