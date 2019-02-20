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

var databaseRef = firebase.database().ref();
var products = databaseRef.child("products/");
var myTable = "";
var table = $("<table/>").addClass('CSSTableGenerator');
table.attr('id','detailedTable');
var storageRef;

function showAllDetails() {
  if($('table').length){
    var removeTab = document.getElementById('dataTable');
    var parentEl = removeTab.parentElement;
    parentEl.removeChild(removeTab);
    }
  // get the reference for the body
  var body = document.getElementsByTagName("body")[0];
  // creates a <table> element and a <tbody> element
  var tbl = document.createElement("table");
  tbl.setAttribute("class", "data");
  tbl.setAttribute("id", "dataTable");
  var tblBody = document.createElement("tbody");
  var row0 = document.createElement("tr");
  var cell0 = document.createElement("td"); var cell1 = document.createElement("td"); var cell2 = document.createElement("td"); var cell3 = document.createElement("td"); var cell4 = document.createElement("td");
  cell0.setAttribute("class", "row-name");
  var cellText0 = document.createTextNode("Product Name");
  var cellText1 = document.createTextNode("Quantity");
  var cellText2 = document.createTextNode("Type");
  var cellText3 = document.createTextNode("Barcode");
  var cellText4 = document.createTextNode("Barcode Image");
  cell0.appendChild(cellText0);
  cell1.appendChild(cellText1);
  cell2.appendChild(cellText2);
  cell3.appendChild(cellText3);
  cell4.appendChild(cellText4);
  row0.appendChild(cell0);
  row0.appendChild(cell1);
  row0.appendChild(cell2);
  row0.appendChild(cell3);
  row0.appendChild(cell4);
  tblBody.appendChild(row0);
  products.once('value', function(snapshot){
    var k = 0;
    if(snapshot.exists()){
      var key;
      var length = Object.keys(snapshot.val()).length;
       snapshot.forEach(function(data){
        key  = Object.keys(snapshot.val());
         for (var i = 0; i < length ; i++) {
           var row = document.createElement("tr");

             var cell1 = document.createElement("td");
             var cellText1 = document.createTextNode(data.val().name);
             cell1.appendChild(cellText1);

             var cell2 = document.createElement("td");
             var cellText2 = document.createTextNode(data.val().quantity);
             cell2.appendChild(cellText2);

             var cell3 = document.createElement("td");
             var cellText3 = document.createTextNode(data.val().productType);
             cell3.appendChild(cellText3);

             var cell4 = document.createElement("td");
             var cellText4 = document.createTextNode(data.val().barCode);
             cell4.appendChild(cellText4);

             var cell5 = document.createElement("td");
             var cellText5 = document.createElement("IMG");
             storageRef = firebase.storage().ref('images/'+key[k]);
             storageRef.getDownloadURL().then(function(downloadURL) {
               cellText5.setAttribute("src", downloadURL);
               cellText5.setAttribute("width", "150");
               cellText5.setAttribute("height", "150");
             });
             cell5.appendChild(cellText5);

             row.appendChild(cell1);
             row.appendChild(cell2);
             row.appendChild(cell3);
             row.appendChild(cell4);
             row.appendChild(cell5);
         }
         k++;
        tblBody.appendChild(row);
        tbl.appendChild(tblBody);
        body.appendChild(tbl);
        tbl.setAttribute("border", "2");
       });
    }
    });
    document.getElementById("btnAllDetails").disabled = true;
}

function get_firebase_list(){
  if($('table').length){
      var removeTab = document.getElementById('dataTable');
      var parentEl = removeTab.parentElement;
      parentEl.removeChild(removeTab);
    }
    // get the reference for the body
    var body = document.getElementsByTagName("body")[0];
    // creates a <table> element and a <tbody> element
    var tbl = document.createElement("table");
    tbl.setAttribute("class", "data");
    tbl.setAttribute("id", "dataTable");
    var tblBody = document.createElement("tbody");
    var row0 = document.createElement("tr");
    var cell0 = document.createElement("td"); var cell1 = document.createElement("td"); var cell2 = document.createElement("td"); var cell3 = document.createElement("td"); var cell4 = document.createElement("td");
    cell0.setAttribute("class", "row-name");
    var cellText0 = document.createTextNode("Product Name");
    var cellText1 = document.createTextNode("Quantity");
    var cellText2 = document.createTextNode("Type");
    var cellText3 = document.createTextNode("Barcode");
    var cellText4 = document.createTextNode("Barcode Image");
    cell0.appendChild(cellText0);
    cell1.appendChild(cellText1);
    cell2.appendChild(cellText2);
    cell3.appendChild(cellText3);
    cell4.appendChild(cellText4);
    row0.appendChild(cell0);
    row0.appendChild(cell1);
    row0.appendChild(cell2);
    row0.appendChild(cell3);
    row0.appendChild(cell4);
    tblBody.appendChild(row0);
  var productDropdown = document.getElementById("productType");
  var selectedItem = productDropdown[productDropdown.selectedIndex].text;
  databaseRef.child('products').orderByChild('productType').equalTo(selectedItem).on("value", function(snapshot) {
    if(snapshot.exists){
      if (snapshot.val()==null){
        alert("No value found for " + selectedItem + ".")
      }
      var k = 0;
      var key;
      snapshot.forEach(function(data) {

          key  = Object.keys(snapshot.val());
           for (var i = 0; i < key.length ; i++) {
             var row = document.createElement("tr");

               var cell1 = document.createElement("td");
               var cellText1 = document.createTextNode(data.val().name);
               cell1.appendChild(cellText1);

               var cell2 = document.createElement("td");
               var cellText2 = document.createTextNode(data.val().quantity);
               cell2.appendChild(cellText2);

               var cell3 = document.createElement("td");
               var cellText3 = document.createTextNode(data.val().productType);
               cell3.appendChild(cellText3);

               var cell4 = document.createElement("td");
               var cellText4 = document.createTextNode(data.val().barCode);
               cell4.appendChild(cellText4);

               var cell5 = document.createElement("td");
               var cellText5 = document.createElement("IMG");
               storageRef = firebase.storage().ref('images/'+key[k]);
               storageRef.getDownloadURL().then(function(downloadURL) {
                 cellText5.setAttribute("src", downloadURL);
                 cellText5.setAttribute("width", "150");
                 cellText5.setAttribute("height", "150");
               });
               cell5.appendChild(cellText5);

               row.appendChild(cell1);
               row.appendChild(cell2);
               row.appendChild(cell3);
               row.appendChild(cell4);
               row.appendChild(cell5);
           }
           k++;
          tblBody.appendChild(row);
          tbl.appendChild(tblBody);
          body.appendChild(tbl);
          tbl.setAttribute("border", "2");
      });
  }else {
    if($('table').length){
        document.getElementById("dataTable").innerHTML = "";
      }
  }
});
}

function resetData(){
  var result = confirm("Want to Reset all product quantities to 0? \n Clicking Okay will NOT be able to Undo this action.");
   if (result) {
    products.once('value', function(snapshot){
      if(snapshot.exists()){
        var key = Object.keys(snapshot.val());
        var counter = 0;
        var length = key.length;
         snapshot.forEach(function(data){
           firebase.database().ref().child("products/" + key[counter] + "/quantity").set(0);
           counter++;
         });
      }
      document.getElementById("btnAllDetails").disabled = false;
      });
  }
}

function makeTable(container, data) {

    $.each(data, function(rowIndex, r) {
        var row = $("<tr/>");
        $.each(r, function(colIndex, c) {
            row.append($("<td/>").text(c));
        });
        table.append(row);
    });
    return container.append(table);
}

function printTable(){
  var divToPrint=document.getElementById("detailedTable");
  var newWin= window.open("");
  newWin.document.write(divToPrint.outerHTML);
  newWin.print();
  newWin.close();
}

function getListFromRange(){
  // console.log("Called");
  // .value = "";
  document.getElementById("btnAllDetails").disabled = false;
  document.getElementById("showText").innerHTML = "";
  var table = document.getElementById("detailedTable");
  if(table){
      table.innerHTML = "";
  }
  var txtdateOfExpiry = document.getElementById("txtdateOfExpiry").value;
  var parsedDate = Date.parse(txtdateOfExpiry);
  var date = new Date(parsedDate);
  // date.ToString("MM/dd/yyyy");
  var formattedDate = ("0" + (date.getMonth() + 1)).slice(-2) + '/' + ("0" + date.getDate()).slice(-2) + '/' +  date.getFullYear()
  console.log(("0" + (date.getMonth() + 1)).slice(-2) + '/' + ("0" + date.getDate()).slice(-2) + '/' +  date.getFullYear());
  document.getElementById("showText").innerHTML = "Showing products which expires before " + "<b>" + date.getMonth()+1 + "</b>";
  products.orderByChild("dateOfExpiryNumeric").endAt(parsedDate).on("child_added", function(snapshot) {
    if(snapshot.exists()){
      var data = [[snapshot.val().name, snapshot.val().barCode, snapshot.val().quantity, snapshot.val()]]
      var cityTable = makeTable($(document.body), data);
      // console.log(snapshot.key);
      // console.log(snapshot.val());
    }
});
}
