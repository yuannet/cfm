var filterMode = false;
var map = null;
var filteredIDs = null;
var infographChart = null;
var layerColorIndex = 0;
var legendOverlay = null;
var communityName = null;
var baseLayers = null;
var filteredLayers = null;
var baseLayerCounter = 0;
var graphControl = null;
var legendControl = null;

function onEachFeature(feature, layer) {

	function FormatValue(val,dec) {
		return (val == "Sin información" || val == "N.A.") ? val : UTIL.formatNum(parseFloat(val.replace(/[^\d\.\-]/g, "")),dec);
	};
	p = feature.properties;

	var popupContent = '';

	popupContent += '<dl class="row pop-info"><dt class="col-sm-4 pop-info">Nombre</dt>';
	popupContent += '<dd class="col-sm-8">' + p.Com_name + '</dd></dl>';

	popupContent += '<dl class="row pop-info"><dt class="col-sm-4">Provincia</dt>';
	popupContent += '<dd class="col-sm-8">' + p.provincia + '</dd></dl>';

	popupContent += '<dl class="row pop-info"><dt class="col-sm-4">Pueblo indígena</dt>';
	popupContent += '<dd class="col-sm-8">' + p.PUEBLO_IND + '</dd></dl>';

	popupContent += '<dl class="row pop-info"><dt class="col-sm-4">Población</dt>';
	popupContent += '<dd class="col-sm-8">' + FormatValue(p.Población,0) + '</dd></dl>';

	popupContent += '<dl class="row pop-info"><dt class="col-sm-4">Estado de titulación</dt>';
	popupContent += '<dd class="col-sm-8">' + p.SIT_TITUL + '</dd></dl>';


	popupContent += '<dl class="row pop-info"><dt class="col-sm-4">Fecha de titulación</dt>';
	popupContent += '<dd class="col-sm-8"> ---- </dd></dl>';


	popupContent += '<dl class="row pop-info"><dt class="col-sm-4">Superficie total</dt>';
	popupContent += '<dd class="col-sm-8">' + FormatValue(p.AREA_DEMAR,2) + '</dd></dl>';


	popupContent += '<dl class="row pop-info"><dt class="col-sm-4">Federation</dt>';
	popupContent += '<dd class="col-sm-8">' + p.Federation + '</dd></dl>';


	popupContent += '<dl class="row pop-info"><dt class="col-sm-4">Afiliacion al PNCB</dt>';
	popupContent += '<dd class="col-sm-9">' + p.Afil_PNCB + '</dd></dl>';


	popupContent += '<dl class="row pop-info"><dt class="col-sm-4">Permiso forestal</dt>';
	popupContent += '<dd class="col-sm-8">' + p.Cate_aprov+ '</dd></dl>';





	if (feature.properties && feature.properties.popupContent) {
		popupContent += '<dl class="row pop-info"><dt class="col-sm-6">Pueblo indígena </dt>';
		popupContent += '<dd class="col-sm-6">' + p.PUEBLO_IND + '</dd></dl>';
		popupContent += '<dl class="row pop-info"><dt class="col-sm-6">Departamento</dt>';
		popupContent += '<dd class="col-sm-6">' + p.nomdpto + '</dd></dl>';
		popupContent += '<dl class="row pop-info"><dt class="col-sm-6">Distrito</dt>';
		popupContent += '<dd class="col-sm-6">' + p.distrito + '</dd></dl>';
		popupContent += '<dl class="row pop-info"><dt class="col-sm-6">Área titulada</dt>';
		popupContent += '<dd class="col-sm-6">' + FormatValue(p.AREA_TITUL,2) + '</dd></dl>';
		popupContent += '<dl class="row pop-info"><dt class="col-sm-6">Área de cesión en uso</dt>';
		popupContent += '<dd class="col-sm-6">' + FormatValue(p.AREA_CESIO,2) + '</dd></dl>';
		popupContent += '<dl class="row pop-info"><dt class="col-sm-6">Categoría de aprovechamiento forestal</dt>';
		popupContent += '<dd class="col-sm-6">' + p.Cate_aprov + '</dd></dl>';
		popupContent += '<dl class="row pop-info"><dt class="col-sm-6">Superficie de aprovechamiento</dt>';
		popupContent += '<dd class="col-sm-6">' + FormatValue(p.Sup_aprov,2) + '</dd></dl>';
		popupContent += '<dl class="row pop-info"><dt class="col-sm-6">Superficie  de bosques con Transferencia directa condicionada TDC</dt>';
		popupContent += '<dd class="col-sm-6">' + FormatValue(p.Sup_TDC,2) + '</dd></dl>';
		popupContent += '<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal"> View More </button>';
		popupContent += feature.properties.popupContent;
	}

	layer.bindPopup(popupContent, {
		minWidth : 200,
	});
}

function GenerateLegendLabel(title,color)
{
	var tmpLabel = "";
	tmpLabel += '<span class="badge-legend ml-1 mr-2" ';
	tmpLabel += 'style="color: ' + UTIL.hexToRgb(color, 0.6) +';background-color: '+ UTIL.hexToRgb(color, 0.3) +'"';
	tmpLabel += ">&nbsp;</span>";
	tmpLabel += '<span>' + title + '</span>';

	return tmpLabel;
}

function PopulateFilteredLayer(data,attr)
{
	var id = attr.comboid;
	var field = attr.fieldname;
	// var options = $(id).find("option:selected");
	var counter = 1;
	var layerGroupName = field + "-layer";

	var tmpLayers = [];
	var tmpSubLegend = [];

	var options = [];
	if(id == "#native-community") {
		var searchVal = $(id).val().toLowerCase();
		if(searchVal != "")
			options = $("#cmb-native-community option").filter(function(i, e) { return $(e).val().toLowerCase().includes(searchVal)});
	}
	else options = $(id).find("option:selected");

	$.each(options, function(i, v) {
		var tmpColor = (layerColorIndex < VARS.layerColor.length) ? VARS.layerColor[layerColorIndex++] : randomColor();
		var fVal = $(v).val();
		var layerSubgroupName = layerGroupName + "-" + (counter++);
		var className = layerGroupName + " " + layerSubgroupName;
		var layerOpt = { style: { ...VARS.baseStyle, "color": tmpColor, "className": className, opacity: 0.3, fillOpacity: 0.6 } };
		var tmpFilteredIDs = [];

		var counter = 0;

		var polygons = data.features.filter(function(feature) {
			if (feature.properties && feature.geometry) {
				return feature.properties[field] !== undefined ? (feature.properties[field]==fVal) : false;
			}
			return false;
		}).map(function(feature) {
			if(feature.geometry != null) {
				var poly = L.GeoJSON.geometryToLayer(feature,layerOpt.style);
				onEachFeature(feature,poly);

				tmpFilteredIDs.push(feature.properties.CODIGO);

				return poly;
			}
		});

		tmpgroup = L.layerGroup(polygons);
		filteredIDs = filteredIDs.concat(tmpFilteredIDs);
		tmpSubLegend.push({ label: GenerateLegendLabel(fVal,tmpColor), layer: tmpgroup });
		tmpLayers.push(tmpgroup);

		if(id == "#native-community") communityName.push(fVal);

	});

	if(tmpSubLegend.length != 0) {
		legendOverlay.push({ label: attr.fielddesc, children: tmpSubLegend, selectAllCheckbox: true })
	}

	return tmpLayers;
}

function GetFilteredLayers(data)
{
	var tmpFilteredLayers = [];
	filteredIDs = [];
	legendOverlay = [];
	layerColorIndex = 0;
	communityName = [];

	if(!filterMode) return [];

	var filterAttribute = [
		{ comboid: "#province", fieldname: "provincia", fielddesc: "Provincia" },
		{ comboid: "#federation", fieldname: "Federation", fielddesc: "Federación" },
		{ comboid: "#native-community", fieldname: "Com_name", fielddesc: "Comunidad nativa" },
		{ comboid: "#indigenous", fieldname: "PUEBLO_IND", fielddesc: "Pueblo indígena" },
		{ comboid: "#perm_aprov", fieldname: "Perm_aprov", fielddesc: "Situacion del título" },
		{ comboid: "#titling", fieldname: "SIT_TITUL", fielddesc: "Permiso de aprovechamiento forestal" },
		{ comboid: "#pncb", fieldname: "Afil_PNCB", fielddesc: "Afiliacion al PNCB" },
	];

	$.each(filterAttribute, function(i,f) {
		var tmpFilteredLayer = PopulateFilteredLayer(data,f)
		if(tmpFilteredLayer.length != 0) tmpFilteredLayers = tmpFilteredLayers.concat(tmpFilteredLayer);
	});

	return tmpFilteredLayers;
}

function GetBaseMap()
{
	//See here for list of basemaps: https://leaflet-extras.github.io/leaflet-providers/preview/

	/* CartoDB Positron No Labels */
	var urlBaseTile = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
	var baseTileAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright" style="">OpenStreetMap</a> contributors, ';
	baseTileAttribution += '&copy; <a href="https://carto.com/attribution">CARTO</a>';

	/* CartoDB Voyager No Labels */
	// var urlBaseTile = "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png";
	// var baseTileAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright" style="">OpenStreetMap</a> contributors, ';
	// baseTileAttribution += '&copy; <a href="https://carto.com/attribution">CARTO</a>';

	/* OpenStreetMap */
	// var urlBaseTile = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
	// var baseTileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

	var baseTileOptions = { maxZoom: 18, attribution: baseTileAttribution, id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1};

	return L.tileLayer(urlBaseTile,baseTileOptions);
}

function GetBaseLayer(data, fnOnEachFeature = null, color = "#ff7800", className = "base-layer")
{
	var layerOpt = { style: function(feature) { 
		return { ...VARS.baseStyle, "color": color, "className": className, opacity: 0.4, fillOpacity: 0.1 }; 
	}};
	if(fnOnEachFeature != null) layerOpt.onEachFeature = fnOnEachFeature;

	return L.topoJson(data,layerOpt);
	// return L.geoJson(JSON.parse(data),layerOpt);
}

function GetCleanValue(val)
{
	return (val == "Sin información" || val == "N.A.") ? 0 : parseFloat(val.replace(/[^\d\.\-]/g, ""));
}

function PopulateGraph(data)
{
	/* ADD DOM FOR GRAPH CONTAINER */
	if(graphControl != null) {
		graphControl.remove();
		graphControl = null;
	}

	graphControl = L.control.info({
		position: 'topright',
		title: '<i class="fas fa-chart-pie"></i>',
		titleTooltip: 'Infographic',
		maxWidth: '400px'
	});

	graphControl.setContent("<div id='infographic-container'></div>");
	graphControl.setTitleTooltip("Infographic");
	graphControl.addTo(map);

	/* GET DATA */
	var jsonData = data;
	var dataFields = ["CODIGO", "AREA_DEMAR","AREA_TITUL","AREA_CESIO","AREA_FISCA","AREA_PROTE","AREA_RESER","Población","Sup_aprov","Sup_TDC"];

	if(filteredIDs.length != 0)
	{
		//select distinct filteredIDs
		filteredIDs = [...new Set([...filteredIDs])];

		//filter data based on ID (CODIGO)
		jsonData = jsonData.features.filter(function(feature) { return ( filteredIDs.indexOf(feature.properties.CODIGO) !== -1 ); });
	}
	else
		jsonData = jsonData.features;


	/* CALCULATE SUMMARY DATA */
	var sumPopulation = 0, sumDemar = 0, sumSupAprov = 0, sumSupTDC = 0;
	var sumTitul = 0, sumCesio = 0, sumProte = 0, sumSin = 0;

	// $.each(statsData, function(i,f) {
	$.each(jsonData, function(i,f) {
		f = f.properties;
		sumPopulation += GetCleanValue(f["Población"]);

		sumDemar += GetCleanValue(f["AREA_DEMAR"]);
		sumSupAprov += GetCleanValue(f["Sup_aprov"]);
		sumSupTDC += GetCleanValue(f["Sup_TDC"]);

		sumTitul += GetCleanValue(f["AREA_TITUL"]);
		sumCesio += GetCleanValue(f["AREA_CESIO"]);
		sumProte += GetCleanValue(f["AREA_PROTE"]) + GetCleanValue(f["AREA_RESER"]) + GetCleanValue(f["AREA_FISCA"]);
	});

	sumSin = sumDemar - (sumTitul + sumCesio + sumProte);


	/* POPULATE INFOGRAPHIC TEXTUAL */
	var infographContent = "";
	infographContent += "<div id='info'>";
	infographContent += "<ul class='latest-posts-list'>";

	//Community name, if selected
	if(communityName.length != 0) {
		infographContent += "<li><h5 class='title'>Comunidad nativa</h5>";
		infographContent += "<span class='information-content'>"+ communityName.join(", ") +"</span></li>";
	}

	// infographContent += "<li><h5 class='title'>Población</h5><span class='information-content'>"+ UTIL.formatNum(sumPopulation,0) +"</span></li>";
	infographContent += "<li><h5 class='title'>Área demarcada</h5><span class='information-content'>"+ UTIL.formatNum(sumDemar) +"</span></li>";
	infographContent += "<li><h5 class='title'>Área titulada</h5><span class='information-content'>"+ UTIL.formatNum(sumTitul) +"</span></li>";
	infographContent += "<li><h5 class='title'>Área de cesión en uso</h5><span class='information-content'>"+ UTIL.formatNum(sumCesio) +"</span></li>";
	infographContent += "<li><h5 class='title'>Area de protección</h5><span class='information-content'>"+ UTIL.formatNum(sumProte) +"</span></li>";
	infographContent += "<li><h5 class='title'>Superficie de aprovechamiento</h5><span class='information-content'>"+ UTIL.formatNum(sumSupAprov);
	infographContent += "</span></li>";
	infographContent += "<li><h5 class='title'>Superficie  de bosques con Transferencia directa condicionada TDC</h5>";
	infographContent += "<span class='information-content'>"+ UTIL.formatNum(sumSupTDC) +"</span></li>";
	infographContent += "</ul>";

	//dougnut chart container
	infographContent += "<canvas id='infographic' width='400px' height='400px'></canvas>";
	infographContent += "</div>";

	$("#infographic-container").html(infographContent);


	/* DISPLAY DOUGHNUT CHART */
	var chartdata = {
		labels: ["Área titulada", "Área forestal de cesión en uso ", "Área forestal de protección o reserva", "Área sin zonificar"],
		data: [parseInt(sumTitul), parseInt(sumCesio), parseInt(sumProte), parseInt(sumSin)],
		title: 'Teritorial Zoning'
	}
	var chartconfig = {
		type: 'doughnut',
		data: {
			labels: chartdata.labels,
			datasets: [{
				label: "",
				backgroundColor: VARS.chartBgColor,
				data: chartdata.data
			}]
		},
		options: {
			title: {
				display: true,
				text: chartdata.title
			},
			responsive: true,
			legend: { position: 'bottom' },
			plugins: {
				labels: {
					render: 'percentage',
					precision: 0,
					position: 'outside'
				}
			}
		}
	};

	infographChart = new Chart(document.getElementById("infographic"),chartconfig);
}

function PopulateLegend() 
{
	if(legendOverlay.length != 0) {
		if(legendControl != null) {
			legendControl.remove();
			legendControl = null;
		}
		
		var legendOptions = {
			closedSymbol: '<i class="fas fa-chevron-right"></i>',
			openedSymbol: '<i class="fas fa-chevron-down"></i>',
			// spaceSymbol: '&nbsp;&nbsp;'
		};

		legendControl = L.control.layers.tree(null, legendOverlay, legendOptions);
		legendControl.addTo(map);

		/*
			HACK the control: 
			- change on mouseover event to mouseclick
			- add close (x) button to the container
		*/
		//add close button
		var legendCloseButton = L.DomUtil.create('a', 'leaflet-popup-close-button');
		legendControl._baseLayersList.appendChild(legendCloseButton);
		legendCloseButton.innerHTML = 'x';
		legendCloseButton.setAttribute('style', 'cursor: pointer; display: none');
		legendControl._baseLayersList.setAttribute('style', 'position: sticky; position: -webkit-sticky; top: 0;');

		//remove mousenter and mouseleave event binding from the legend icon
		L.DomEvent.off(legendControl._container, {
				mouseenter: legendControl.expand,
				mouseleave: legendControl.collapse
			}, legendControl);

		//disable collapse on map click
		legendControl._map.off('click', legendControl.collapse, legendControl);

		//add click event binding to the legend icon
		$(".leaflet-control-layers-toggle").on("click", function() {
			legendControl.expand();
			$(legendCloseButton).show();
		});

		//trigger the close button to close the legend on click
		$(legendCloseButton).on("click", function() {
			legendControl.collapse();
			$(legendCloseButton).hide();
		});
	}

}

function PopulateMap(data)
{
	if(filteredLayers.length != 0) {
		$.each(filteredLayers, function(i,layergroup) {
			layergroup.clearLayers();
		});
	}

	filteredLayers = GetFilteredLayers(data);
	if(filteredLayers.length == 0) filterMode = false;

	//remove base layer popup if in Filter mode
	if(filterMode) $.each(baseLayers[4]._layers, function(i,v) { v.unbindPopup(); });

	//add filtered layer if exist, on Filter button click
	if(filterMode) {
		$.each(filteredLayers, function(i,layergroup) {
			layergroup.addTo(map);
		});
	}

	//add graph control
	PopulateGraph(data);

	//add legend control
	PopulateLegend();

	//finalize
	filterMode = false; 
	SPIN.hide(); 
	SPIN.reset();
}

function GenerateBaseLayerLegend()
{
	var baselegend = L.control({position: 'bottomleft'});

	baselegend.onAdd = function (map) {

	    var div = L.DomUtil.create('div', 'info legend');

		var tmpLabel = "";
	    for (var i = 1; i <= 3; i++) {
			tmpLabel += '<li class="list-group-item"><span class="badge-legend ml-1 mr-2" ';
			tmpLabel += 'style="color: ' + UTIL.hexToRgb(VARS.BASE.colors[i], 0.4) +';background-color: '+ UTIL.hexToRgb(VARS.BASE.colors[i], 0.1) +'"';
			tmpLabel += ">&nbsp;</span>";
			tmpLabel += '<span>' + VARS.BASE.labels[i] + '</span></li>';
	    }

        div.innerHTML += tmpLabel;
	    return div;
	};

	baselegend.addTo(map);
}

function LoadMap(department)
{
	if(baseLayerCounter > 4) {
		PopulateMap(baseLayers[4].getGeojson()); 
		return;
	}

	var fn_done = null;
	var fn_always = null;
	var currentBaseUrl = VARS.BASE.urls[baseLayerCounter];
	var currentColor = VARS.BASE.colors[baseLayerCounter];

	switch(baseLayerCounter) {
		case 0: 
			baseLayers[baseLayerCounter++] = GetBaseMap();
			LoadMap(department);
			break;
		case 1:
		case 2:
		case 3:
			fn_done = function(data) { 
				baseLayers[baseLayerCounter++] = GetBaseLayer(data, null, currentColor, "base-layer-" + baseLayerCounter); 
				LoadMap(department); 
			};
			fn_always = null;
			break;
		case 4:
			fn_done = function(data) { 
				var tmpBaseLayer = GetBaseLayer(data, onEachFeature); 
				baseLayers[baseLayerCounter++] = tmpBaseLayer;

				L.layerGroup(baseLayers).addTo(map);
				GenerateBaseLayerLegend();

				map.fitBounds(tmpBaseLayer.getBounds());

				L.easyButton( '<i class="fas fa-arrows-alt"></i>', function(){
				  	map.fitBounds(tmpBaseLayer.getBounds());
				}, 'Fit bound area to map').addTo(map);

				PopulateMap(tmpBaseLayer.getGeojson()); 
			};
			fn_always = null;
			// fn_always = function(jqXHR) { filterMode = false; SPIN.hide(); SPIN.reset(); };
			break;
	}

	UTIL.ajax(currentBaseUrl,HTTP_CONST.GET,null,fn_done,UTIL.errorAlert,fn_always);
}

function InitMap(department)
{
	SPIN.content("Loading map...");

	if(map == null) {
		map = L.map('map', { scrollWheelZoom: false, doubleClickZoom: false });
		baseLayers = [];
		baseLayerCounter = 0;
		filteredLayers = [];
	}

	LoadMap(department);
}

$("#btnfiltermap").on("click", function(){
	SPIN.reset();
	SPIN.show();

	filterMode = true;
	var deptname = $("#department option:selected").val();

	InitMap(deptname);
});
