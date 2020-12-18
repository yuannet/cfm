window.HTTP_CONST = { 
	GET: 'GET', 
	PUT: 'PUT', 
	POST: 'POST', 
	PATCH: 'PATCH', 
	DELETE: 'DELETE' 
};

window.UTIL = {
	isUndefined: function(value) { return (typeof (value) == "undefined"); },
	isNull: function(value) { return (value === null); },
	isNullOrUndefined: function(value) { return (this.isUndefined || this.isNull); },
	formatNum: function(num,dec=2) { return num.toFixed(dec).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'); },

	ajax: function(url, method, data, doneFn, errorFn, alwaysFn) {
		if (this.isNullOrUndefined(method)) method = HTTP_CONST.GET;

		var opt = {};
		opt.method = method;
		opt.url = url;
		if (!this.isNullOrUndefined(data)) opt.data = data;

		var ajaxFn = $.ajax(opt);

		//unmark this code for jquery version < 3.0
		// if (!this.isNull(doneFn)) ajaxFn.success(doneFn);
		// if (!this.isNull(errorFn)) ajaxFn.error(errorFn);
		// if (!this.isNull(alwaysFn)) ajaxFn.complete(alwaysFn);

		if (!this.isNull(doneFn)) ajaxFn.done(doneFn);
		if (!this.isNull(errorFn)) ajaxFn.fail(errorFn);
		if (!this.isNull(alwaysFn)) ajaxFn.always(alwaysFn);

		return ajaxFn;
	},

	errorAlert: function(jqXHR) { alert( "Error!" ); console.log(jqXHR); },

	hexToRgb: function(hex, alpha) {
		hex   = hex.replace('#', '');
		var r = parseInt(hex.length == 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
		var g = parseInt(hex.length == 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
		var b = parseInt(hex.length == 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);
		if ( alpha ) {
			return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
		}
		else {
			return 'rgb(' + r + ', ' + g + ', ' + b + ')';
		}
	}
};

window.VARS = {
	baseStyle: { color: "#ffffff", weight: 1, opacity: 0.5, className: "layername" },
	chartBgColor: randomColor({ count: 4, seed: 42 }),
	layerColor: randomColor({ count: 40, seed: 1 }),
	URL: {
		department: "json/department.json",
		lookup: "json/lookup.json",
		datasource: "json/datasource.json"
		// datasource: "datasource.geojson"
	}
}

window.SPIN = {
	isLoading: false,
	show: function() { $("#myModal").removeClass("fade"); $("#myModal").modal("show"); this.isLoading = true; },
	hide: function() { $("#myModal").addClass("fade"); $("#myModal").modal("hide"); this.isLoading = false; },
	content: function(html) { $("#spinner-text").html(html); },
	reset: function() { $("#spinner-text").html("Loading..."); this.isLoading = false; }
}