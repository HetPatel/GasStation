var provider = new firebase.auth.GoogleAuthProvider();
var emails = ["het09it@gmail.com", "het.patel@cbc.ca", "nehalpthakar@gmail.com", "jeetsangani@gmail.com"];

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    firebase.auth().onAuthStateChanged(user => {
      if(emails.includes(user.email)) {
        //  window.location = 'wizard-list-place.html'; //If User is not logged in, redirect to login page
      }else{
        window.location = 'Permission_Not_Granted.html'
      }
      // document.getElementById("userName").innerText=getPublisherInfo().displayName;
    });
  } else {
    // No user is signed in.
    window.location = 'index.html'
  }
});
