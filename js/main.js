/* ============================================================
   BOOT
   ============================================================ */

'use strict';

function boot(){

try{

wireControls();

/* ============================================================
   INITIAL START
   ============================================================ */

status(
  'Generating initial layout…'
);


requestAnimationFrame(
  () => {

    try{

      generate();


      status(
        'Ready — Generate New Layout creates a new classified road graph.'
      );

    }
    catch(err){

      console.error(err);


      status(
        'Generator error: ' +
        (
          err &&
          err.message
            ? err.message
            : String(err)
        ),
        true
      );

    }

  }
);



}
catch(err){

  console.error(err);


  status(
    'Startup error: ' +
    (
      err &&
      err.message
        ? err.message
        : String(err)
    ),
    true
  );

}

}

if(
  document.readyState ===
  'loading'
){

  document.addEventListener(
    'DOMContentLoaded',
    boot,
    {
      once:true
    }
  );

}
else{

  boot();

}
