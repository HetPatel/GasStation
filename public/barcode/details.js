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

function showAllDetails(){
  var table = document.getElementById("detailedTable");
  var textAll = document.getElementById("showText");
  if(table){
      table.innerHTML = "";
  }
  products.once('value', function(snapshot){
    if(snapshot.exists()){
       snapshot.forEach(function(data){
        var data = [[data.val().name, data.val().barCode, data.val().quantity, data.val().dateOfExpiry]]
        var cityTable = makeTable($(document.body), data);
       });
    }
    document.getElementById("btnAllDetails").disabled = true;
    document.getElementById("showText").innerHTML = "Showing all products.";
  });
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
      var data = [[snapshot.val().name, snapshot.val().barCode, snapshot.val().quantity, snapshot.val().dateOfExpiry]]
      var cityTable = makeTable($(document.body), data);
      // console.log(snapshot.key);
      // console.log(snapshot.val());
    }
});
}

var calendar_from = new SalsaCalendar({
  inputId: 'txtdateOfExpiry',
  lang: 'en',
  range: {
    min: 'today'
  },
  calendarPosition: 'right',
  fixed: false,
  connectCalendar: true
});
