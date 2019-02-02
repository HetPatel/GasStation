// Initialize Firebase
var config = {
  apiKey: "AIzaSyA-5jZk_34QX_3zB4VF8281_QkSXQ2GoGQ",
  authDomain: "gasstation-415a7.firebaseapp.com",
  databaseURL: "https://gasstation-415a7.firebaseio.com",
  projectId: "gasstation-415a7",
  storageBucket: "gasstation-415a7.appspot.com",
  messagingSenderId: "1070151210348",
};
//Initialize APP
var initializeApp = firebase.initializeApp(config);

var provider = new firebase.auth.GoogleAuthProvider();
var emails = ["het09it@gmail.com"];

function googleSignin() {
   firebase.auth()

   .signInWithPopup(provider).then(function(result) {
      var token = result.credential.accessToken;
      var user = result.user;

      if(emails.includes(user.email)){
        window.location = 'wizard-list-place.html';
      }else {
        window.location = 'Permission_Not_Granted.html';
      }
      console.log(token)
      console.log(user)
   }).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;

      console.log(error.code)
      console.log(error.message)
   });
}

function googleSignout() {
   firebase.auth().signOut()
   .then(function() {
      window.location.assign("index.html");
      console.log('Signout Succesfull')
   }, function(error) {
      console.log('Signout Failed')
   });
}


// jQuery(document).ready(function(){
//
//
// 	// Show password Button
// 	$("#showpassword").on('click', function(){
//
// 		var pass = $("#password");
// 		var fieldtype = pass.attr('type');
// 		if (fieldtype == 'password') {
// 			pass.attr('type', 'text');
// 			$(this).text("Hide Password");
// 		}else{
// 			pass.attr('type', 'password');
// 			$(this).text("Show Password");
// 		}
//
//
// 	});
// });
