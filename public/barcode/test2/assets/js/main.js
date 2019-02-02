// Initialize Firebase
var config = {
  apiKey: "AIzaSyA-5jZk_34QX_3zB4VF8281_QkSXQ2GoGQ",
  authDomain: "gasstation-415a7.firebaseapp.com",
  databaseURL: "https://gasstation-415a7.firebaseio.com",
  projectId: "gasstation-415a7",
  storageBucket: "gasstation-415a7.appspot.com",
  messagingSenderId: "1070151210348",
};
firebase.initializeApp(config);

var productCode;
var databaseRef = firebase.database().ref();
var existingQuantity = 0;
var totalQuantity;
var txtName;

$(function() {
    var resultCollector = Quagga.ResultCollector.create({
        capture: true,
        capacity: 20,
        blacklist: [{
            code: "WIWV8ETQZ1", format: "code_93"
        }, {
            code: "EH3C-%GU23RK3", format: "code_93"
        }, {
            code: "O308SIHQOXN5SA/PJ", format: "code_93"
        }, {
            code: "DG7Q$TV8JQ/EN", format: "code_93"
        }, {
            code: "VOFD1DB5A.1F6QU", format: "code_93"
        }, {
            code: "4SO64P4X8 U4YUU1T-", format: "code_93"
        }],
        filter: function(codeResult) {
            // only store results which match this constraint
            // e.g.: codeResult
            return true;
        }
    });
    var App = {
        init: function() {
            var self = this;

            Quagga.init(this.state, function(err) {
                if (err) {
                    return self.handleError(err);
                }
                //Quagga.registerResultCollector(resultCollector);
                App.attachListeners();
                App.checkCapabilities();
                Quagga.start();
            });
        },
        handleError: function(err) {
            console.log(err);
        },
        checkCapabilities: function() {
            var track = Quagga.CameraAccess.getActiveTrack();
            var capabilities = {};
            if (typeof track.getCapabilities === 'function') {
                capabilities = track.getCapabilities();
            }
            this.applySettingsVisibility('zoom', capabilities.zoom);
            this.applySettingsVisibility('torch', capabilities.torch);
        },
        updateOptionsForMediaRange: function(node, range) {
            console.log('updateOptionsForMediaRange', node, range);
            var NUM_STEPS = 6;
            var stepSize = (range.max - range.min) / NUM_STEPS;
            var option;
            var value;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            for (var i = 0; i <= NUM_STEPS; i++) {
                value = range.min + (stepSize * i);
                option = document.createElement('option');
                option.value = value;
                option.innerHTML = value;
                node.appendChild(option);
            }
        },
        applySettingsVisibility: function(setting, capability) {
            // depending on type of capability
            if (typeof capability === 'boolean') {
                var node = document.querySelector('input[name="settings_' + setting + '"]');
                if (node) {
                    node.parentNode.style.display = capability ? 'block' : 'none';
                }
                return;
            }
            if (window.MediaSettingsRange && capability instanceof window.MediaSettingsRange) {
                var node = document.querySelector('select[name="settings_' + setting + '"]');
                if (node) {
                    this.updateOptionsForMediaRange(node, capability);
                    node.parentNode.style.display = 'block';
                }
                return;
            }
        },
        // initCameraSelection: function(){
        //     var streamLabel = Quagga.CameraAccess.getActiveStreamLabel();
        //
        //     return Quagga.CameraAccess.enumerateVideoDevices()
        //     .then(function(devices) {
        //         function pruneText(text) {
        //             return text.length > 30 ? text.substr(0, 30) : text;
        //         }
        //         var $deviceSelection = document.getElementById("deviceSelection");
        //         while ($deviceSelection.firstChild) {
        //             $deviceSelection.removeChild($deviceSelection.firstChild);
        //         }
        //         devices.forEach(function(device) {
        //             var $option = document.createElement("option");
        //             $option.value = device.deviceId || device.id;
        //             $option.appendChild(document.createTextNode(pruneText(device.label || device.deviceId || device.id)));
        //             $option.selected = streamLabel === device.label;
        //             $deviceSelection.appendChild($option);
        //         });
        //     });
        // },
        attachListeners: function() {
            var self = this;

            // self.initCameraSelection();
            // $(".controls").on("click", "button.stop", function(e) {
            //     e.preventDefault();
            //     Quagga.stop();
            //     self._printCollectedResults();
            // });

            $(".controls").on("click", "button.start", function(e) {
              // Quagga.init({
              //     inputStream : {
              //       name : "Live",
              //       type : "LiveStream"
              //     },
              //     decoder : {
              //       readers : ["code_128_reader"]
              //     }
              //   }, function(err) {
              //       if (err) {
              //           console.log(err);
              //           return
              //       }
              //       console.log("Initialization finished. Ready to start");
              //       Quagga.start();
              //   });
              App.init();
            });

            $(".controls .reader-config-group").on("change", "input, select", function(e) {
                e.preventDefault();
                var $target = $(e.target),
                    value = $target.attr("type") === "checkbox" ? $target.prop("checked") : $target.val(),
                    name = $target.attr("name"),
                    state = self._convertNameToState(name);

                console.log("Value of "+ state + " changed to " + value);
                self.setState(state, value);
            });
        },
        _printCollectedResults: function() {
            var results = resultCollector.getResults(),
                $ul = $("#result_strip ul.collector");

            results.forEach(function(result) {
                var $li = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h4 class="code"></h4></div></div></li>');

                $li.find("img").attr("src", result.frame);
                $li.find("h4.code").html(result.codeResult.code + " (" + result.codeResult.format + ")");
                $ul.prepend($li);
            });
        },
        _accessByPath: function(obj, path, val) {
            var parts = path.split('.'),
                depth = parts.length,
                setter = (typeof val !== "undefined") ? true : false;

            return parts.reduce(function(o, key, i) {
                if (setter && (i + 1) === depth) {
                    if (typeof o[key] === "object" && typeof val === "object") {
                        Object.assign(o[key], val);
                    } else {
                        o[key] = val;
                    }
                }
                return key in o ? o[key] : {};
            }, obj);
        },
        _convertNameToState: function(name) {
            return name.replace("_", ".").split("-").reduce(function(result, value) {
                return result + value.charAt(0).toUpperCase() + value.substring(1);
            });
        },
        detachListeners: function() {
            $(".controls").off("click", "button.stop");
            $(".controls .reader-config-group").off("change", "input, select");
        },
        applySetting: function(setting, value) {
            var track = Quagga.CameraAccess.getActiveTrack();
            if (track && typeof track.getCapabilities === 'function') {
                switch (setting) {
                case 'zoom':
                    return track.applyConstraints({advanced: [{zoom: parseFloat(value)}]});
                case 'torch':
                    return track.applyConstraints({advanced: [{torch: !!value}]});
                }
            }
        },
        setState: function(path, value) {
            var self = this;

            if (typeof self._accessByPath(self.inputMapper, path) === "function") {
                value = self._accessByPath(self.inputMapper, path)(value);
            }

            if (path.startsWith('settings.')) {
                var setting = path.substring(9);
                return self.applySetting(setting, value);
            }
            self._accessByPath(self.state, path, value);

            console.log(JSON.stringify(self.state));
            App.detachListeners();
            Quagga.stop();
            App.init();
        },
        inputMapper: {
            inputStream: {
                constraints: function(value){
                    if (/^(\d+)x(\d+)$/.test(value)) {
                        var values = value.split('x');
                        return {
                            width: {min: parseInt(values[0])},
                            height: {min: parseInt(values[1])}
                        };
                    }
                    return {
                        deviceId: value
                    };
                }
            },
            numOfWorkers: function(value) {
                return parseInt(value);
            },
            decoder: {
                readers: function(value) {
                    if (value === 'ean_extended') {
                        return [{
                            format: "ean_reader",
                            config: {
                                supplements: [
                                    'ean_5_reader', 'ean_2_reader'
                                ]
                            }
                        }];
                    }
                    return [{
                        format: value + "_reader",
                        config: {}
                    }];
                }
            }
        },
        state: {
            inputStream: {
                type : "LiveStream",
                constraints: {
                    width: {min: 640},
                    height: {min: 480},
                    facingMode: "environment",
                    aspectRatio: {min: 1, max: 2}
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            frequency: 10,
            decoder: {
                readers : [{
                    format: "ean_reader",
                    config: {}
                }]
            },
            locate: true
        },
        lastResult : null
    };

    App.init();

    Quagga.onProcessed(function(result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
            }
        }
    });

    Quagga.onDetected(function(result) {
        var code = result.codeResult.code;
        productCode = code;
        var products = databaseRef.child("products/"+code);
        var products1 = databaseRef.child("products/");
        var audio = new Audio('beep.wav');

        if (App.lastResult !== code) {
            App.lastResult = code;
            // var $node = null, canvas = Quagga.canvas.dom.image;
            // $node = $('<li><label>Barcode:</label><h4 class="barcode"></h4></li>');
            // $node.find("h4.barcode").html(code);
            // $("#result_strip ul.thumbnails").prepend($node);


            products.once("value", function(snapshot) {
              snapshot.forEach(function(child){
                if(child.key == "name"){
                  console.log("VALUEEEEE: " + child.val());
                  document.getElementById("txtName").disabled = true;
                  document.getElementById("txtName").value = child.val();
                }
                if(child.key == "barCode"){
                  document.getElementById("txtBarcode").value = child.val();
                }
                if(child.key == "productType"){
                  // types = data.val().jobTypes;
                  // console.log(types);
                  // for(let i=0; i<types.length; i++){
                  //   document.getElementById('job_Types2').value = data.val().jobTypes;
                  // }
                  // alert(child.val());
                  document.getElementById("productType").value = assignProductsTypes(child.val());
                }
                if(child.key == "quantity"){
                  existingQuantity = child.val();
                  document.getElementById("lblExistingQuantity").innerHTML = existingQuantity;
                  // document.getElementById("lblPreviousQuantity").inner = "There are " + child.val() + " quantities added already.";
                  console.log(child.val());
                }
                // if(child.key == "dateOfExpiry"){
                //   document.getElementById("txtdateOfExpiry").value = child.val();
                // }
                audio.play();
                setTimeout(myFunction, 3000)
              });
            });
            document.getElementById("txtBarcode").value = code;
            if (document.getElementById('lblExistingQuantity').innerHTML == "") {
              document.getElementById("lblExistingQuantity").innerHTML = 0;
            }
            audio.play();
            setTimeout(myFunction, 3000)
            console.log("Code Scanned: " + code);
        }
    });

});

function add() {
  var products = databaseRef.child("products/");
  txtName = getProductName();
  var txtBarcode = document.getElementById('txtBarcode').value;
  var txtQuantityToAdd = getQuantityToAdd();
  console.log("Selected Product Type: " + getSelectedValues());
  // console.log(("0" + (date.getMonth() + 1)).slice(-2) + '/' + ("0" + date.getDate()).slice(-2) + '/' +  date.getFullYear());
  products.once('value', function(snapshot) {
      console.log("Snapshot: " + snapshot);
        if (!snapshot.hasChild(txtBarcode)) {
          console.log("VALUE FOUND for " + txtBarcode);
          totalQuantity = Number(existingQuantity) + Number(txtQuantityToAdd);
            products.child(txtBarcode).set({
              "name": txtName,
              "productType": getSelectedValues(),
              "barCode": txtBarcode,
              "quantity": totalQuantity
              // "dateOfExpiry": getExpiryDate(),
              // "dateOfExpiryNumeric": getExpiryDateNumeric()
            });
        }
        else {
            alert("Product already exists");
        }
  // jobsRef.push().set({
  //     jobID: "001",
  //     jobTitle: jobTitle
  // });
  console.log("Worked");
  });
}

function getSelectedValues(){
            var dropDown = document.getElementById('productType'), productTypes = [], i;
            for (i = 0; i < dropDown.options.length ; i ++) {
                if (dropDown.options[i].selected) {
                    productTypes.push( dropDown.options[i].text);
                    //countryArray.push({ Name: dropDown.options[i].text, Value: dropDown.options[i].value });
                }
            }
            return productTypes;
}

function assignProductsTypes(productType){
  var productTypeValue;
  if(productType == "Pepsi"){
    productTypeValue = 1;
  }else if(productType == "Coca-Cola"){
    productTypeValue = 2;
  }else if(productType == "Nestle"){
    productTypeValue = 3;
  }else if(productType == "Cadbury"){
    productTypeValue = 4;
  }else if(productType == "Option 5"){
    productTypeValue = 5;
  }else if(productType == "Option 6"){
    productTypeValue = 6;
  }else if(productType == "Option 7"){
    productTypeValue = 7;
  }else if(productType == "Option 8"){
    productTypeValue = 8;
  }else if(productType == "Option 9"){
    productTypeValue = 9;
  }
    // switch(productType){
    //   case "Pepsi":
    //       mappedValue.push("1");
    //       break;
    //   case "Coca-Cola":
    //       mappedValue.push("2");
    //       break;
    //   case "Nestle":
    //       mappedValue.push("3");
    //       break;
    //   case "Cadbury":
    //       mappedValue = "4";
    //       console.log("INSIDE");
    //       break;
    //   case "Option 5":
    //       mappedValue.push("5");
    //       break;
    //   case "Option 6":
    //       mappedValue.push("6");
    //       break;
    //   case "Option 7":
    //       mappedValue.push("7");
    //       break;
    //   case "Option 8":
    //       mappedValue.push("8");
    //       break;
    //   case "Option 9":
    //       mappedValue.push("9");
    //       break;
    //     }
    console.log("Value: "+productTypeValue);
  return productTypeValue;
}

document.getElementById("btnFinish").onclick = add;
// function unlockTxts(){
//   var txtBarcode = document.getElementById('txtBarcode').value
//   if (txtBarcode.length != 0)
//       {
//         document.getElementById("txtName").disabled = false;
//         document.getElementById("txtQuantity").disabled = false;
//         document.getElementById("txtdateOfExpiry").disabled = false;
//         document.getElementById("btnEdit").disabled = true;
//       }
// }
// function edit() {
//   var txtBarcode = document.getElementById('txtBarcode').value;
//   var products = databaseRef.child("products/"+txtBarcode);
//
//   // document.getElementById("txtName").disabled = false;
//   // document.getElementById("txtQuantity").disabled = false;
//   // document.getElementById("txtdateOfExpiry").disabled = false;
//
//   var txtName = document.getElementById('txtName').value;
//   var txtQuantity = document.getElementById('txtQuantity').value;
//   var txtdateOfExpiry = document.getElementById('txtdateOfExpiry').value;
//
//   products.update({
//     "name": txtName,
//     "quantity": txtQuantity,
//     "dateOfExpiry": getExpiryDate(),
//     "dateOfExpiryNumeric": getExpiryDateNumeric()
//   }).then(function(){
//     alert("Data updated successfully.");
//     document.getElementById("txtName").disabled = true;
//     document.getElementById("txtQuantity").disabled = true;
//     document.getElementById("txtdateOfExpiry").disabled = true;
//     document.getElementById("btnEdit").disabled = false;
//   }).catch(function(error) {
//     alert("Data could not be updated." + error);
//   });
//   // alert(txtBarcode + " value has been edited successfully");
//   // document.getElementById("txtName").disabled = true;
//   // document.getElementById("txtQuantity").disabled = true;
//   // document.getElementById("txtdateOfExpiry").disabled = true;
// }

function myFunction() {}

// var calendar_from = new SalsaCalendar({
//   inputId: 'txtdateOfExpiry',
//   lang: 'en',
//   range: {
//     min: 'today'
//   },
//   calendarPosition: 'right',
//   fixed: false,
//   connectCalendar: true
// });

function getCurrentDate(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!

  var yyyy = today.getFullYear();
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  var today = mm + '/' + dd + '/' + yyyy;
  return today;
}

function getExpiryDate(){
  var expiryDate = document.getElementById('txtdateOfExpiry').value;;
  return expiryDate;
}

function getCurrentDateNumeric(){
  var todayNumeric = Date.parse(getCurrentDate());
  return todayNumeric;
}

function getExpiryDateNumeric(){
  var expiryDateNumeric = Date.parse(getExpiryDate());
  return expiryDateNumeric;
}

function fillLastScreenValues(){
  document.getElementById("lblTotalQuantity").innerHTML = Number(getQuantityToAdd()) + Number(existingQuantity);
  document.getElementById("lblProductName").innerHTML = getProductName();
  // if(txtName == undefined){
  //   document.getElementById("lastScreenMessage").innerHTML = "Please Scan the barcode";
  // }else {
  //   document.getElementById("lastScreenMessage").innerHTML = "Click Finish to add " + totalQuantity + "quantities of " + txtName + ". Or click Previous to make any changes.";
  // }
}

function getQuantityToAdd(){
  return document.getElementById("txtQuantityToAdd").value;
}

function getProductName(){
  return document.getElementById("txtName").value;
}
fillLastScreenValues();
