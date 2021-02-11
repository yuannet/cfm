function TransformData(data)
{
	return $.map(data,function(v) { return { label: v, title: v, value: v}; });
}

function OnSingleDropDownChange(option, checked, select)
{
	var curVal = option.val();
	select = this.$select[0];
	var selectId = $(select).attr("id");

	if(checked)
	{
		$(select).multiselect('deselectAll', false);
		$(select).multiselect('select', curVal, false);

		if(selectId == "department") PopulateLookup(curVal);
	}
	else {
		//force at least one option selected for department
		if(selectId == "department") {
			var options = $(select).find("option:selected");
			if(options.length == 0) $(select).multiselect('select', curVal, false);
		}
	}
}

function PopulateComboFilter(data,id,placeholderText,multiple)
{
	var opt = { maxHeight: 300, buttonWidth: '100%', inheritClass: true, enableCaseInsensitiveFiltering: true };
	// opt.buttonContainer = '<div class="btn-group form-control" />';
	opt.nonSelectedText = placeholderText;

	if(multiple)
	{
		opt.enableFiltering = true;
		opt.includeSelectAllOption = true;
		// opt.includeResetOption = true;
		// opt.includeResetDivider = true;
	}

	if(!multiple) opt.onChange = OnSingleDropDownChange;

	$(id).multiselect(opt);
	$(id).multiselect('dataprovider', TransformData(data));
}

function PopulateFilter(data)
{
	$.each(VARS.FILTER, function(i,f) {
		PopulateComboFilter(data[f.field.lookup], f.comboid, f.desc, f.multiselect);
	});
}

function PopulateLookup(department)
{
	var fn_done = function(data) { PopulateFilter(data); };
	var fn_always = function(data, status, jqXHR) { if(jqXHR.status == 200) InitMap(department); };
	// var fn_always = function(data, status, jqXHR) { SPIN.hide(); };

	UTIL.ajax(VARS.URL.lookup,HTTP_CONST.GET,null,fn_done,UTIL.errorAlert,fn_always);
}

function PopulateDepartment()
{
	SPIN.content("Loading filter...");

	var fn_done = function(data) {  PopulateComboFilter(data.departement, "#department", "Departamento", false); };
	var fn_always = function(data, status, jqXHR) {
		// console.log(jqXHR);
		if(jqXHR.status == 200) {
			var firstVal = $("#department option:first").val();
			$("#department").multiselect('select', firstVal, true);
		}
	};

	UTIL.ajax(VARS.URL.department,HTTP_CONST.GET,null,fn_done,UTIL.errorAlert,fn_always);
}

$("#btnreset").on("click", function() {
	//remove legend control
	if(legendControl != null) {
		legendControl.remove();
		legendControl = null;
	}

	//clear map from filtered layer
	ResetFilteredLayer();	

	//reset filter form
	$.each(VARS.FILTER, function(i,f) {
		v = f.comboid;
		$(v).multiselect('deselectAll', false);
		$(v).multiselect('updateButtonText');
	});

	//re-bind popup to base layer
	$.each(baseLayers[baseLayerDataIndex]._layers, function(i,v) { 
		var popupContent = GetPopupContent(v.feature);
		v.bindPopup(popupContent, { minWidth : 200 });
	});

	//set filter mode to false
	filterMode = false;
});
