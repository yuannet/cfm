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
var filteredData = null;
var baseLayerDataIndex = 0;
var baseLayerLegendControl = null;
var mainFilterLabel = "";
var mainFilterValue = null;

function GetPopupContent(feature) {
	function FormatValue(val,dec) {
		return (val == "Sin información" || val == "N.A.") ? val : UTIL.formatNum(parseFloat(val.replace(/[^\d\.\-]/g, "")),dec);
	};
	p = feature.properties;
	var popupContent = '';

	var data = [
		{ 'label': 'Nombre', 'value': p.Com_name },
		{ 'label': 'Provincia', 'value': p.provincia },
		{ 'label': 'Pueblo indígena', 'value': p.PUEBLO_IND },
		{ 'label': 'Población', 'value': FormatValue(p.Población,0) },
		{ 'label': 'Estado de titulación', 'value': p.SIT_TITUL },
		{ 'label': 'Fecha de titulación', 'value': p.Fecha_TITU },
		{ 'label': 'Superficie total', 'value': FormatValue(p.AREA_DEMAR,2) },
		{ 'label': 'Federation', 'value': p.Federation },
		{ 'label': 'Afiliacion al PNCB', 'value': p.Afil_PNCB },
		{ 'label': 'Permiso forestal', 'value': p.Cate_aprov },
	]
	popupContent += UTIL.generatePopupContent(data);

	popupContent += '<dl class="row pop-info"><div class="col-sm-12 text-center mt-2">';
	popupContent += '<a class="view-more-info text-decoration-none" role="button" data-comname="' + p.Com_name + '">Ver más &raquo;</a></div></dl>';

	return popupContent;
}

function onEachFeature(feature, layer) {

	var popupContent = GetPopupContent(feature);
	layer.bindPopup(popupContent, { minWidth : 300 });

	$("body").off("click", ".view-more-info", ViewMoreCallback);
	$("body").on("click", ".view-more-info", ViewMoreCallback);
}

function ViewMoreCallback(e) {
	var comName = $(this).data("comname");
	var contentUrl = "html/dummy.html?com=" + comName;
	var fn_done = function(content) { 
				
				$(".view-more-title").html(comName);
				$(".view-more-content").html(content);

				$('#view-more').modal('show');

			};
	var fn_always = null;

	UTIL.ajax(contentUrl,HTTP_CONST.GET,null,fn_done,UTIL.errorAlert,fn_always);
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

function PopulateFilteredLayer(attr)
{
	var id = attr.comboid;
	var field = attr.field.data;
	var counter = 1;
	var layerGroupName = field + "-layer";

	var tmpLayers = [];
	var tmpSubLegend = [];
	var tmpFilterValues = [];

	var options = $(id).find("option:selected");

	if(options.length != 0) {
		mainFilterLabel = attr.desc;
	}

	$.each(options, function(i, v) {
		var tmpColor = (layerColorIndex < VARS.layerColor.length) ? VARS.layerColor[layerColorIndex++] : randomColor();
		var fVal = $(v).val();
		var layerSubgroupName = layerGroupName + "-" + (counter++);
		var className = layerGroupName + " " + layerSubgroupName;
		var layerOpt = { style: { ...VARS.baseStyle, "color": tmpColor, "className": className, opacity: 0.3, fillOpacity: 0.6 } };
		var tmpFilteredIDs = [];

		var polygons = filteredData.features.filter(function(feature) {
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
		if (legendOverlay.length == 0) filteredIDs = filteredIDs.concat(tmpFilteredIDs);
		tmpSubLegend.push({ label: GenerateLegendLabel(fVal,tmpColor), layer: tmpgroup });
		tmpLayers.push(tmpgroup);

		if(id == "#native-community") communityName.push(fVal);
		tmpFilterValues.push(fVal);

	});

	if (legendOverlay.length == 0 && tmpSubLegend.length != 0) {
		filteredData = {
			type: "FeatureCollection", 
			features: filteredData.features.filter(function(feature) { return ( filteredIDs.indexOf(feature.properties.CODIGO) !== -1 ); })
		}
	}

	if(tmpSubLegend.length != 0) {
		legendOverlay.push({ label: attr.desc, children: tmpSubLegend, selectAllCheckbox: true });
	}

	if(tmpFilterValues.legend != 0 && mainFilterValue.length == 0) {
		mainFilterValue = [...tmpFilterValues]; 
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
	mainFilterLabel = "";
	mainFilterValue = [];

	if(!filterMode) return [];

	filteredData = {...data};

	$.each(VARS.FILTER, function(i,f) {
		var tmpFilteredLayer = PopulateFilteredLayer(f)
		if(tmpFilteredLayer.length != 0) tmpFilteredLayers = tmpFilteredLayers.concat(tmpFilteredLayer);
	});

	return tmpFilteredLayers;
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
	infographContent += "<li><h4 class='title'>Clasificación de derechos sobre la tierra en las comunidades seleccionadas</h4></li>";

	//Community name, if selected
	var infoComHeader = "";
	var infoComContent = "";

	if(communityName.length != 0) {
		infoComHeader = " <small>(" + communityName.length + " selected)</small>";
		infoComContent = communityName.join(", ");
		// infographContent += "<li><h5 class='title'>Comunidad nativa <small>(" + communityName.length + " selected)</small></h5>";
		// infographContent += "<span class='information-content text-success'>"+ communityName.join(", ") +"</span></li>";
	}
	else {
		if(mainFilterLabel != "") {
			var tmpComNames = jsonData.map(function(data) {
				console.log(data.properties.Com_name);
				return data.properties.Com_name;
			});
			tmpComNames = [...new Set([...tmpComNames])];

			infoComHeader += "<br><small>(" + tmpComNames.length + " selected, ";
			infoComHeader += "filtered by " + mainFilterLabel + ": " + mainFilterValue.join(", ") + ")</small>";
			infoComContent = tmpComNames.join(", ");
		}
		else {
			infoComHeader = "";
			infoComContent = "All communities in Ucayali";
		}
	}
	infographContent += "<li><h5 class='title'>Comunidad nativa" + infoComHeader + "</h5>";
	infographContent += "<span class='information-content text-success'>" + infoComContent + "</span></li>";

	// infographContent += "<li><h5 class='title'>Población</h5><span class='information-content'>"+ UTIL.formatNum(sumPopulation,0) +"</span></li>";
	infographContent += "<li><h5 class='title'>Área demarcada</h5><span class='information-content text-success'>"+ UTIL.formatNum(sumDemar) +"</span></li>";
	infographContent += "<li><h5 class='title'>Área titulada</h5><span class='information-content text-success'>"+ UTIL.formatNum(sumTitul) +"</span></li>";
	infographContent += "<li><h5 class='title'>Área de cesión en uso</h5><span class='information-content text-success'>"+ UTIL.formatNum(sumCesio) +"</span></li>";
	infographContent += "<li><h5 class='title'>Area de protección</h5><span class='information-content text-success'>"+ UTIL.formatNum(sumProte) +"</span></li>";
	infographContent += "<li><h5 class='title'>Superficie de aprovechamiento</h5><span class='information-content text-success'>"+ UTIL.formatNum(sumSupAprov);
	infographContent += "</span></li>";
	infographContent += "<li><h5 class='title'>Superficie bajo transferencia directa condicionada (PNCB)</h5>";
	infographContent += "<span class='information-content text-success'>"+ UTIL.formatNum(sumSupTDC) +"</span></li>";
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
	if(legendControl != null) {
		legendControl.remove();
		legendControl = null;
	}

	if(legendOverlay.length != 0) {
		
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

function ResetFilteredLayer()
{
	if(filteredLayers.length != 0) {
		$.each(filteredLayers, function(i,layergroup) {
			layergroup.clearLayers();
		});

		filteredLayers = [];
	}

	mainFilterLabel = "";
	mainFilterValue = [];
	communityName = [];
	filteredIDs = [];
}

function PopulateMap(data)
{
	ResetFilteredLayer();
	filteredLayers = GetFilteredLayers(data);
	if(filteredLayers.length == 0) filterMode = false;

	//remove base layer popup if in Filter mode
	if(filterMode) $.each(baseLayers[baseLayerDataIndex]._layers, function(i,v) { v.unbindPopup(); });

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
	if(baseLayerLegendControl != null) {
		baseLayerLegendControl.remove();
		baseLayerLegendControl = null;
	}

	baseLayerLegendControl = L.control.info({
		position: 'bottomleft',
		title: '<i class="fas fa-images"></i>',
		titleTooltip: 'Áreas Protegidas',
		maxWidth: '400px'
	});

	baseLayerLegendControl.setContent("<div id='base-layer-legend-container' class='info legend'></div>");
	baseLayerLegendControl.setTitleTooltip("Áreas Protegidas");
	baseLayerLegendControl.addTo(map);

	var tmpLabel = '<li class="list-group-item">';
	tmpLabel += '<span>Áreas Protegidas</span></li>';

    for (var i = 2; i <= 4; i++) {
		var opt = VARS.BASE[i];
		tmpLabel += '<li class="list-group-item"><span class="badge-legend ml-1 mr-2" ';
		tmpLabel += 'style="color: ' + UTIL.hexToRgb(opt.style.color, opt.style.opacity);
		tmpLabel += ';background-color: '+ UTIL.hexToRgb(opt.style.color, opt.style.fillOpacity) +'"';
		tmpLabel += ">&nbsp;</span>";
		tmpLabel += '<span>' + opt.label + '</span></li>';
    }

	$("#base-layer-legend-container").html("<div id='info'>" + tmpLabel + "</div>");

	baseLayerLegendControl._showContent();
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

function GetBaseLayer(data, option)
{
	var layerOpt = { style: function(feature) {  return option.style; }};
	if(option.fnOnEachFeature != null) layerOpt.onEachFeature = option.fnOnEachFeature;

	return L.topoJson(data,layerOpt);
}

function LoadMap(department)
{
	if(baseLayerCounter > 5) {
		PopulateMap(baseLayers[baseLayerDataIndex].getGeojson()); 
		return;
	}

	var fn_done = null;
	var fn_always = null;
	var baseInfo = VARS.BASE[baseLayerCounter];
	var currentBaseUrl = baseInfo.url;
	// var currentBaseUrl = VARS.BASE.urls[baseLayerCounter];
	// var currentColor = VARS.BASE.colors[baseLayerCounter];

	switch(baseLayerCounter) {
		case 0: 
			baseLayers[baseLayerCounter++] = GetBaseMap();
			LoadMap(department);
			break;
		case 1:
		case 2:
		case 3:
		case 4:
			fn_done = function(data) { 
				// baseLayers[baseLayerCounter++] = GetBaseLayer(data, null, currentColor, "base-layer-" + baseLayerCounter); 
				baseLayers[baseLayerCounter++] = GetBaseLayer(data, baseInfo); 
				LoadMap(department); 
			};
			fn_always = null;
			break;
		case 5:
			fn_done = function(data) { 
				baseLayerDataIndex = baseLayerCounter;
				baseInfo.fnOnEachFeature = onEachFeature;

				var tmpBaseLayer = GetBaseLayer(data, baseInfo); 
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

function ShowWelcome()
{
	var contentUrl = "html/welcome.html";
	var fn_done = function(content) { 
		var dlg_options = { maxSize: [600,600], size: [550,300], anchor:[0,50] };
		var dialog = L.control.dialog(dlg_options).addTo(map);
		dialog.setContent(content).freeze();
	};
	var fn_always = null;
	var fn_error = function(jqXHR) { console.log( "Unable to show Welcome message"); console.log(jqXHR); }

	UTIL.ajax(contentUrl,HTTP_CONST.GET,null,fn_done,fn_error,fn_always);

}

function InitMap(department)
{
	SPIN.content("Loading map...");

	if(map == null) {
		map = L.map('map', { scrollWheelZoom: false, doubleClickZoom: false });
		baseLayers = [];
		baseLayerCounter = 0;
		filteredLayers = [];

		ShowWelcome();
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
