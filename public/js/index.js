var firebaseConfig = {
    apiKey: "AIzaSyA-5jZk_34QX_3zB4VF8281_QkSXQ2GoGQ",
    authDomain: "gasstation-415a7.firebaseapp.com",
    databaseURL: "https://gasstation-415a7.firebaseio.com",
    projectId: "gasstation-415a7",
    storageBucket: "gasstation-415a7.appspot.com",
    messagingSenderId: "1070151210348"
  };

//Initialize APP
var initializeApp = firebase.initializeApp(firebaseConfig);

var provider = new firebase.auth.GoogleAuthProvider();
var emails = ["het09it@gmail.com"];

function googleSignin() {
   firebase.auth()

   .signInWithPopup(provider).then(function(result) {
      var token = result.credential.accessToken;
      var user = result.user;

      if(emails.includes(user.email)){
        window.location = 'main.html';
      }else {
        window.location = 'user_not_found.html';
      }
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

// firebase.auth().onAuthStateChanged(user => {
//   if(emails.includes(user.email)) {
//      window.location = 'main.html'; //If User is not logged in, redirect to login page
//   }else{
//     window.location = 'user_not_found.html'
//   }
//   // document.getElementById("userName").innerText=getPublisherInfo().displayName;
// });

firebase.auth().onAuthStateChanged(function(user) {
  if(emails.includes(user.email)) {
    // User is signed in.
    // window.location = 'main.html';
  } else {
    // No user is signed in.
    // window.location = 'user_not_found.html'
  }
});
