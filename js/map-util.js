var filterMode = false;
var map = null;
var filteredIDs = null;
var infographChart = null;
var layerColorIndex = 0;
var legendOverlay = null;

function onEachFeature(feature, layer) {

	var popupContent = "<p>"
			+"<br/>Native Community Name: " +feature.properties.Com_name
			+"<br/>Provincia: " +feature.properties.provincia

			+"<br/>Federation : " +feature.properties.Federation
			+"<br/>Date : " +feature.properties.Fecha_afil
			+"<br/>PNCB affiliation : " +feature.properties.Afil_PNCB
			+"<br/>Area: " +feature.properties.AREA_DEMAR+" h"
			+"<br/>Categories: "+feature.properties.Cate_aprov
			+ "</p>";

	if (feature.properties && feature.properties.popupContent) {
		popupContent += feature.properties.popupContent;
	}

	layer.bindPopup(popupContent);
}

function GenerateLegendLabel(title,color)
{
	var tmpLabel = "";
	tmpLabel += '<span class="badge-legend ml-1 mr-2" ';
	tmpLabel += 'style="color: ' + color +';background-color: '+ UTIL.hexToRgb(color, 0.5) +'"';
	tmpLabel += ">&nbsp;</span>";
	tmpLabel += '<span>' + title + '</span>';

	return tmpLabel;
}

// function PopulateFilteredLayer(data,id,field)
function PopulateFilteredLayer(data,attr)
{
	var id = attr.comboid;
	var field = attr.fieldname;
	var options = $(id).find("option:selected");
	var counter = 1;
	var layerGroupName = field + "-layer";

	var tmpLayers = [];
	var tmpSubLegend = [];
	$.each(options, function(i, v) {
		var jsonData = JSON.parse(data);
		var tmpColor = (layerColorIndex < VARS.layerColor.length) ? VARS.layerColor[layerColorIndex++] : randomColor();
		var fVal = $(v).val();
		var layerSubgroupName = layerGroupName + "-" + (counter++);
		var className = layerGroupName + " " + layerSubgroupName;

		var layerOpt = { style: { ...VARS.baseStyle, "color": tmpColor, "className": className } };
		layerOpt.onEachFeature = onEachFeature;
		layerOpt.filter = function(feature, layer) {
			if (feature.properties) {
				return feature.properties[field] !== undefined ? (feature.properties[field]==fVal) : false;
			}
			return false;
		};

		var tmpLayer = L.geoJson(jsonData,layerOpt);
		tmpLayers.push(tmpLayer)
		tmpSubLegend.push({ label: GenerateLegendLabel(fVal,tmpColor), layer: tmpLayer });

		//get ID of filtered data
		var tmpFilteredIDs = jsonData.features
				.filter(function(feature){  return (feature.properties[field]==fVal); })
				.map(function(feature){ return feature.properties.CODIGO; });
		filteredIDs = filteredIDs.concat(tmpFilteredIDs);
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

	if(!filterMode) return [];

	var filterAttribute = [
		{ comboid: "#province", fieldname: "provincia", fielddesc: "Province" },
		{ comboid: "#federation", fieldname: "Federation", fielddesc: "Federation" },
		{ comboid: "#native-community", fieldname: "Com_name", fielddesc: "Native community name" },
		{ comboid: "#indigenous", fieldname: "PUEBLO_IND", fielddesc: "Indigenous people" },
		{ comboid: "#pncb", fieldname: "Afil_PNCB", fielddesc: "PNCB affiliation" },
	];

	$.each(filterAttribute, function(i,f) {
		tmpFilteredLayers = tmpFilteredLayers.concat(PopulateFilteredLayer(data,f));
	});

	return tmpFilteredLayers;
}

function GetBaseMap()
{


	var urlBaseTile = "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png";
	var baseTileAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright" style="">OpenStreetMap</a> contributors, ';
	baseTileAttribution += '&copy; <a href="https://carto.com/attribution">CARTO</a>';

	var baseTileOptions = { maxZoom: 18, attribution: baseTileAttribution, id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1};

	return L.tileLayer(urlBaseTile,baseTileOptions);
}

function GetBaseLayer(data,addOnEachFeature)
{
	var layerOpt = { style: { ...VARS.baseStyle, "color": "#ff7800", "className": "base-layer" } };
	if(addOnEachFeature) layerOpt.onEachFeature = onEachFeature;

	return L.geoJson(JSON.parse(data),layerOpt);
}

function GetCleanValue(val)
{
	return (val == "Sin información" || val == "N.A.") ? 0 : parseFloat(val.replace(/[^\d\.\-]/g, ""));
}

function PopulateGraph(data)
{
	var graphControl = L.control.info({
		position: 'topright',
		title: '<i class="fas fa-chart-pie"></i>',
		titleTooltip: 'Infographic',
		maxWidth: '400px'
		// titleClass: '',
		// contentClass: ''
	});

	graphControl.setContent("<div id='infographic-container'></div>");
	graphControl.setTitleTooltip("Show Infographic");
	graphControl.addTo(map);

	var jsonData = JSON.parse(data);
	var dataFields = ["CODIGO", "AREA_DEMAR","AREA_TITUL","AREA_CESIO","AREA_FISCA","AREA_PROTE","AREA_RESER","Población","Sup_aprov","Sup_TDC"];

	if(filteredIDs.length != 0)
	{
		//select distinct filteredIDs
		filteredIDs = [...new Set([...filteredIDs])];

		//filter data based on ID (CODIGO)
		jsonData = jsonData.features.filter(function(feature) { return ( filteredIDs.indexOf(feature.properties.CODIGO) !== -1 ); });
	}
	else
		jsonData = jsonData.features.filter(function(feature) { return true; });

	//simplify geojson into array of datafields
	var statsData = jsonData.map(function(feature) {
		var tmp = {};
		$.each(dataFields,function(i,f) { tmp[f] = feature.properties[f]; });
		return tmp;
	});


	/* CALCULATE SUMMARY DATA */
	var sumPopulation = 0, sumDemar = 0, sumSupAprov = 0, sumSupTDC = 0;
	var sumTitul = 0, sumCesio = 0, sumProte = 0, sumSin = 0;

	$.each(statsData, function(i,f) {
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
	infographContent += "<li><h5 class='title'>Population</h5><span class='information-content'>"+ UTIL.formatNum(sumPopulation) +"</span></li>";
	infographContent += "<li><h5 class='title'>Demarcated area</h5><span class='information-content'>"+ UTIL.formatNum(sumDemar) +"</span></li>";
	infographContent += "<li><h5 class='title'>Forestry use area</h5><span class='information-content'>"+ UTIL.formatNum(sumSupAprov);
	infographContent += "</span></li>";
	infographContent += "<li><h5 class='title'>Forest area with TDC (ha)</h5>";
	infographContent += "<span class='information-content'>"+ UTIL.formatNum(sumSupTDC) +"</span></li>";
	infographContent += "</ul>";
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
		var legendOptions = {
			closedSymbol: '<i class="fas fa-chevron-right"></i>',
			openedSymbol: '<i class="fas fa-chevron-down"></i>',
			// spaceSymbol: '&nbsp;&nbsp;'
		};

		var legendControl = L.control.layers.tree(null, legendOverlay, legendOptions);
		legendControl.addTo(map);

		var legendCloseButton = L.DomUtil.create('a', 'leaflet-popup-close-button');
		legendControl._container.appendChild(legendCloseButton);
		legendCloseButton.innerHTML = 'x';
		legendCloseButton.setAttribute('style', 'cursor: pointer; display: none');

		L.DomEvent.off(legendControl._container, {
				mouseenter: legendControl.expand,
				mouseleave: legendControl.collapse
			}, legendControl);

		$(".leaflet-control-layers-toggle").on("click", function() {
			legendControl.expand();
			$(legendCloseButton).show();
		});

		$(legendCloseButton).on("click", function() {
			legendControl.collapse();
			$(legendCloseButton).hide();
		});
	}

}

function PopulateMap(data)
{
	map = L.map('map', { scrollWheelZoom: false, doubleClickZoom: false });

	var filteredLayers = GetFilteredLayers(data);
	if(filteredLayers.length == 0) filterMode = false;

	var baseMap = GetBaseMap();
	var baseLayer = GetBaseLayer(data, (!filterMode) );

	//add base layers: base Tilemap and unfiltered JSON data
	L.layerGroup([baseMap, baseLayer]).addTo(map);

	//add filtered layer if exist, on Filter button click
	if(filterMode) L.layerGroup(filteredLayers).addTo(map);

	//zoom to bounds
	map.fitBounds(baseLayer.getBounds());

	PopulateGraph(data);

	PopulateLegend();
}

function LoadMap(department)
{
	var fn_done = function(data) { PopulateMap(data); };
	var fn_always = function(jqXHR) { filterMode = false; };

	UTIL.ajax(VARS.URL.datasource,HTTP_CONST.GET,null,fn_done,UTIL.errorAlert,fn_always);
}

function InitMap(department)
{
	if(map !== null) {
		map.off();
		map.remove();
	}

	LoadMap(department);
}

$("#btnfiltermap").on("click", function(){
	filterMode = true;
	var deptname = $("#department option:selected").val();

	InitMap(deptname);
});
