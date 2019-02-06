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
var products = databaseRef.child("products/");
var existingQuantity = 0;
var totalQuantity, txtQuantityToAdd;
var txtName, txtBarcode;
var totalQuantitiesToAdd;

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
        attachListeners: function() {
            var self = this;

            $(".controls").on("click", "button.start", function(e) {
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

            products.once("value", function(snapshot) {
              audio.play();
              snapshot.forEach(function(child){
                if(child.key == "name"){
                  console.log("VALUEEEEE: " + child.val());
                  document.getElementById("txtName").disabled = true;
                  document.getElementById("txtName").value = child.val();
                  setUpdateScreen();
                }
                if(child.key == "barCode"){
                  document.getElementById("txtBarcode").value = child.val();
                }
                if(child.key == "productType"){
                  document.getElementById("productType").value = assignProductsTypes(child.val());
                }
                if(child.key == "quantity"){
                  existingQuantity = child.val();
                  document.getElementById("lblExistingQuantity").innerHTML = existingQuantity;
                  document.getElementById("lblExistingQuantity").innerHTML = "There are " + existingQuantity + " entries present.";
                  console.log(child.val());
                }
              });
            });
            document.getElementById("txtBarcode").value = code;
            document.getElementById("txtName").disabled = false;
            document.getElementById("txtName").value = "";
            document.getElementById("productType").value = 0;
            document.getElementById("lblExistingQuantity").innerHTML = "There are no quantities for this product.";
            resetQuantityToAdd();
            resetExistingQuantity();
            resetLastScreenValues();
            setAddScreen();
            audio.play();
            setTimeout(myFunction, 3000)
            console.log("Code Scanned: " + code);
        }
    });

});

function add() {
  txtName = getProductName();
  txtBarcode = document.getElementById('txtBarcode').value;
  txtQuantityToAdd = getQuantityToAdd();
  console.log("Selected Product Type: " + getSelectedValues());
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
            });
        }
        else {
        }
  alert("Product added to database.");
  location.reload();
  resetTotalQuantitiesToAdd();
  resetExistingQuantity();
  });
}

function update() {
  txtBarcode = document.getElementById('txtBarcode').value;
  products = databaseRef.child("products/"+txtBarcode);
  txtQuantityToAdd = getQuantityToAdd();
  totalQuantity = Number(existingQuantity) + Number(txtQuantityToAdd);
  products.update({
    "quantity": totalQuantity
  }).then(function(){
    alert("Data updated successfully.");
    location.reload();
    resetTotalQuantitiesToAdd();
    resetExistingQuantity();
  }).catch(function(error) {
    alert("Data could not be updated." + error);
  });
}

function getSelectedValues(){
            var dropDown = document.getElementById('productType'), productTypes = [], i;
            for (i = 0; i < dropDown.options.length ; i ++) {
                if (dropDown.options[i].selected) {
                    productTypes.push( dropDown.options[i].text);
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
    console.log("Value: "+productTypeValue);
  return productTypeValue;
}

document.getElementById("btnFinish").onclick = add;
document.getElementById("btnUpdate").onclick = update;

function myFunction() {}

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
  totalQuantitiesToAdd = Number(getQuantityToAdd()) + Number(existingQuantity);
  document.getElementById("lblFinalMessage").innerHTML = "This will add/update total quantities of "+ getProductName() + " to " + totalQuantitiesToAdd + "." +
                                                          "\<p\>Click \"Update\"/\"Finish\" to add or click on \"Previous\" to make any changes."
  }

function getQuantityToAdd(){
  return document.getElementById("txtQuantityToAdd").value;
}

function resetQuantityToAdd(){
  return document.getElementById("txtQuantityToAdd").value = 0;
}

function resetLastScreenValues(){
  return document.getElementById("lblFinalMessage").innerHTML = "";
}

function resetTotalQuantitiesToAdd(){
  return totalQuantitiesToAdd = 0;
}

function resetExistingQuantity(){
  return existingQuantity = 0;
}

function setUpdateScreen(){
  document.getElementById("btnUpdate").disabled = false;
  document.getElementById("btnFinish").disabled = true;
}

function setAddScreen(){
  document.getElementById("btnUpdate").disabled = true;
  document.getElementById("btnFinish").disabled = false;
}

function getProductName(){
  return document.getElementById("txtName").value;
}

function setWelcomeScreen(){
  // document.getElementById("lblUserName").innerHTML = window.firebase.auth().currentUser.displayName;
  firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    document.getElementById("lblUserName").innerHTML = "Welcome " + user.displayName;
    document.getElementById("btnUpdate").disabled = true;
    document.getElementById("btnFinish").disabled = true;
  } else {
    // No user is signed in.
  }
  });
}

function signOut(){
  firebase.auth().signOut()
  .then(function() {
     window.location.assign("index.html");
     console.log('Signout Succesfull')
  }, function(error) {
     console.log('Signout Failed')
  });
}

resetLastScreenValues();
resetTotalQuantitiesToAdd();
setWelcomeScreen();
