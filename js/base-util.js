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

	errorAlert: function(jqXHR) { SPIN.hide(); alert( "Error!" ); console.log(jqXHR); },

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
	},

	generatePopupContent: function(data, className=null) {
		var content = "";

		if(className == null) className = ["col-sm-5", "col-sm-7"];

		$.each(data,function(i,d) {
			content += '<dl class="row pop-info"><dt class="pop-info ' + className[0] + '">' + d.label + '</dt>';
			content += '<dd class="' + className[1] + '">' + d.value + '</dd></dl>';
		});

		return content;
	}
};

window.VARS = {
	baseStyle: { color: "#ffffff", weight: 1, opacity: 0.5, className: "layername" },
	chartBgColor: randomColor({ count: 4, seed: 42 }),
	layerColor: randomColor({ count: 40, seed: 1 }),
	URL: {
		department: "json/department.json",
		lookup: "json/lookup.json",
	},
	BASE: [
		{ dummy: true },  //only dummy object dedicated to fill first slot. DO NOT REMOVE!
		{
			url: "json/Limite_Ucayali.json", 
			label: "", 
			style: { color: "#000000", weight: 2, opacity: 0.6, fillOpacity: 0, className: "base-layer-4", dashArray: "4"},
			fnOnEachFeature: null,
		},
		{
			url: "json/Area_Natural_Protegida_por_el_Estado_20210118.json", 
			label: "Gestionadas por el Estado", 
			style: { color: "#28a745", weight: 1, opacity: 0.4, fillOpacity: 0.1, className: "base-layer-1" },
			fnOnEachFeature: function (feature, layer) { 
				var data = [
					{ 'label': 'Categoría', 'value': feature.properties.ANP_CATE },
					{ 'label': 'Nombre', 'value': feature.properties.ANP_NOMB },
					{ 'label': 'Área (ha)', 'value': feature.properties.ANP_ARLE },
					{ 'label': 'Fecha de creación', 'value': feature.properties.ANP_FECREA },
					{ 'label': 'Resolución', 'value': feature.properties.ANP_BALECR },
				]
				layer.bindPopup(UTIL.generatePopupContent(data), { minWidth : 300 });
			},
		},
		{
			url: "json/Area_Natural_Protegida_por_el_Estado_y_Comunidades_20210118.json", 
			label: "Cogestionadas por el Estado y las Comunidades", 
			style: { color: "#28a745", weight: 1, opacity: 0.4, fillOpacity: 0.4, className: "base-layer-2" },
			fnOnEachFeature: function (feature, layer) { 
				var data = [
					{ 'label': 'Categoría', 'value': feature.properties.ANP_CATE },
					{ 'label': 'Nombre', 'value': feature.properties.ANP_NOMB },
					{ 'label': 'Área (ha)', 'value': feature.properties.ANP_ARLE },
					{ 'label': 'Fecha de creación', 'value': feature.properties.ANP_FECREA },
					{ 'label': 'Resolución', 'value': feature.properties.ANP_BALECR },
				]
				layer.bindPopup(UTIL.generatePopupContent(data), { minWidth : 300 });
			},
		},
		{
			url: "json/AreaProtegidaReservaTerritorial_20210118.json", 
			label: "Reservas Territoriales Indígenas", 
			style: { color: "#dc3545", weight: 1, opacity: 0.4, fillOpacity: 0.1, className: "base-layer-3" },
			fnOnEachFeature: function (feature, layer) { 
				var data = [
					{ 'label': 'Nombre', 'value': feature.properties.NOMBRES },
					{ 'label': 'Área (ha)', 'value': feature.properties.HECTARES },
					{ 'label': 'Resolución', 'value': feature.properties.RECONOCIDO },
				]
				layer.bindPopup(UTIL.generatePopupContent(data,["col-sm-4", "col-sm-8"]), { minWidth : 300 });
			},
		},
		{
			url: "json/datasource_20210118.json", 
			label: "", 
			style: { color: "#ff7800", weight: 1, opacity: 0.4, fillOpacity: 0.1, className: "base-layer-data" },
			fnOnEachFeature: null,
		},
	],
	FILTER: [
		{
			field: { lookup: "native community name", data: "Com_name" },
			desc: "Comunidad nativa",
			comboid: "#native-community",
			multiselect: true
		},
		{
			field: { lookup: "province", data: "provincia" },
			desc: "Provincia",
			comboid: "#province",
			multiselect: true
		},
		{
			field: { lookup: "federation", data: "Federation" },
			desc: "Federación",
			comboid: "#federation",
			multiselect: true
		},
		{
			field: { lookup: "ethnic group", data: "PUEBLO_IND" },
			desc: "Pueblo indígena",
			comboid: "#indigenous",
			multiselect: true
		},
		{
			field: { lookup: "titling situation", data: "SIT_TITUL" },
			desc: "Situacion del título",
			comboid: "#titling",
			multiselect: false
		},
		{
			field: { lookup: "Perm_aprov", data: "Perm_aprov" },
			desc: "Permiso de aprovechamiento forestal",
			comboid: "#perm_aprov",
			multiselect: false
		},
		{
			field: { lookup: "affiliated to the pncb", data: "Afil_PNCB" },
			desc: "Afiliacion al PNCB",
			comboid: "#pncb",
			multiselect: false
		},
	]
}

window.SPIN = {
	isLoading: false,
	show: function() { $("#myspin").removeClass("fade"); $("#myspin").modal("show"); this.isLoading = true; },
	hide: function() { $("#myspin").addClass("fade"); $("#myspin").modal("hide"); this.isLoading = false; },
	content: function(html) { $("#spinner-text").html(html); },
	reset: function() { $("#spinner-text").html("Loading..."); this.isLoading = false; }
}
