sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"ztestZTEST_XLS_UPLOAD/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/ValueState",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/ColumnListItem",
	"sap/m/Text"
], function(Controller, BaseController,JSONModel, MessageToast, Filter, FilterOperator, Sorter, ColumnListItem, Text) {
	"use strict";

	return BaseController.extend("ztestZTEST_XLS_UPLOAD.controller.MainView", {
		onInit: function() {
			this.oFileUploader = this.byId("idFileUploader");
		
			//local model to set properties
			this.setModel(new JSONModel(), "view");
		
			//hide the table until results are back
			this.getModel("view").setProperty("/tableVisibility", false);
		},

		handleTypeMissmatch: function(oEvent) {
			var aFileTypes = oEvent.getSource().getFileType();
			jQuery.each(aFileTypes, function(key, value) {
				aFileTypes[key] = "." + value;
			});
			var sSupportedFileTypes = aFileTypes.join(", ");

			MessageToast.show(jQuery.sap.formatMessage(this.getResourceBundle().getText("MissmatchFileType"), [oEvent.getParameter("fileType"),
				sSupportedFileTypes
			]));

		},

		onUploadFile: function(oEvent) {

			var sFileName = this.oFileUploader.getValue();

			if (sFileName === "") {
				this.oFileUploader.setValueState("Error");
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("FileError"));

			} else {
				this.oFileUploader.setValueState();
				this._doSubmit(sFileName);

			}

		},

		_doSubmit: function(sFileName) {

			var oDomRef = this.oFileUploader.getFocusDomRef();
			var oFile = oDomRef.files[0];
			var that = this;

			if (oFile) {
				/****************To Fetch CSRF Token*******************/
				if (!this.csrfToken) {
					this.csrfToken = this.getView().getModel().getSecurityToken();
					this.getView().byId("idFileUploader").setSendXHR(true);
				}
				var oHeaders = {
					"x-csrf-token": this.csrfToken,
					"slug": sFileName
				};

				/*******************To Upload File************************/

				var oURL = "/sap/opu/odata/sap/ZTEST_XLS_UPLOAD_SRV/FileNameSet";

				jQuery.ajax({
					type: 'POST',
					url: oURL,
					headers: oHeaders,
					cache: false,
					contentType: oFile.type,
					processData: false,
					data: oFile,
					success: function(oData) {
						var srec = oData.getElementsByTagName("entry")[0].children[6].getAttribute("src");
						var sFilterGuid = srec.split("'")[1];
						
						MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("FileSucess") + srec);
						
						that._doTableBind(sFilterGuid);
					},
					error: function(oError) {
						MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("FileFail"));
					}

				});

			}

		},

		_doTableBind: function(sFilterGuid) {
		

			var that = this;
			var aFilter = [];
			var oFilter = new sap.ui.model.Filter({
									path: "GUID",
									operator: sap.ui.model.FilterOperator.EQ,
									value1: sFilterGuid
			});
			aFilter.push(oFilter);

			//this.getModel().read("/FileNameSet" + "?$filter=( FileName eq" + sFilterGuid + ")"
			this.getModel().read("/TestTableSet", {
				filters: [oFilter],
				success: function(oData) {
					
					// Bind the data to the display table
					that.getModel("view").setProperty("/results", oData.results);
					//Show the table
					that.getModel("view").setProperty("/tableVisibility", true);
					
				},
				error: function(oError) {
					MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("TableFail") + "\n" + oError.message);
				}
			});
		}

	});
});