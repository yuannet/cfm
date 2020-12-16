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
	}

	if(!multiple) opt.onChange = OnSingleDropDownChange;

	$(id).multiselect(opt);
	$(id).multiselect('dataprovider', TransformData(data));
}

function PopulateFilter(data)
{
	PopulateComboFilter(data.province, "#province", "Province",true);
	PopulateComboFilter(data.federation, "#federation", "Federation",true);
	PopulateComboFilter(data["native community name"], "#native-community", "Native Community name",true);
	PopulateComboFilter(data["affiliated to the pncb"], "#pncb", "PNCB affiliation",false);
	PopulateComboFilter(data["ethnic group"], "#indigenous", "Indigenous people",true);
}

function PopulateLookup(department)
{
	var fn_done = function(data) { PopulateFilter(data); };
	var fn_always = function(data, status, jqXHR) { if(jqXHR.status == 200) InitMap(department); };

	UTIL.ajax(VARS.URL.lookup,HTTP_CONST.GET,null,fn_done,UTIL.errorAlert,fn_always);
}

function PopulateDepartment()
{
	var fn_done = function(msg) {  PopulateComboFilter(msg.departement, "#department", "Select a departement",false); };
	var fn_always = function(data, status, jqXHR) {
		// console.log(jqXHR);
		if(jqXHR.status == 200) {
			var firstVal = $("#department option:first").val();
			$("#department").multiselect('select', firstVal, true);
		}
	};

	UTIL.ajax(VARS.URL.department,HTTP_CONST.GET,null,fn_done,UTIL.errorAlert,fn_always);
}
