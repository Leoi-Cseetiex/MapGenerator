/* ============================================================
   UI: STATUS, STATS, CONTROLS WIRING
   ============================================================ */

'use strict';

function status(msg, bad) {

  const statusEl =
    document.getElementById('appStatus');

  if(!statusEl) return;

  statusEl.textContent = msg;

  statusEl.style.color = bad
    ? '#ff8989'
    : '#9da8ae';

}


function setText(
  id,
  v
){

  document
    .getElementById(id)
    .textContent =
      v;

}


function updateStats(){

  const v =
    validate();


  const types = {
    T:0,
    Y:0,
    F:0,
    C:0
  };


  for(
    const n of
    state.intersections
  ){

    if(
      n.classification.includes(
        'T'
      )
    ){

      types.T++;

    }
    else if(
      n.classification === 'Y' ||
      n.classification.includes(
        'FORK'
      )
    ){

      types.Y++;

    }
    else if(
      n.classification.includes(
        'FOUR'
      )
    ){

      types.F++;

    }
    else if(
      n.classification ===
      'COMPLEX' ||
      n.classification ===
      'MULTI_ARM'
    ){

      types.C++;

    }

  }


  setText(
    'roadCount',
    state.roads.length
  );

  setText(
    'segmentCount',
    state.segments.length
  );

  setText(
    'intersectionCount',
    state.intersections.length
  );

  setText(
    'rejectedCount',
    state.rejectedCount
  );

  setText(
    'snapCount',
    state.snapCount
  );

  setText(
    'railCount',
    state.rails.length
  );

  setText(
    'stationCount',
    state.stations.length
  );

  setText(
    'busCount',
    state.buses.length
  );

  setText(
    'entranceCount',
    state.entrances.length
  );

  setText(
    'tCount',
    types.T
  );

  setText(
    'yCount',
    types.Y
  );

  setText(
    'fourCount',
    types.F
  );

  setText(
    'complexCount',
    types.C
  );

  setText(
    'parks',
    state.parks.length
  );

  setText(
    'trees',
    state.trees.length
  );

  setText(
    'benches',
    state.benches.length
  );

  setText(
    'playgrounds',
    state.playgrounds.length
  );

  setText(
    'parkStructures',
    state.pavilions.length +
    state.facilities.length
  );

  setText(
    'vBR',
    v.br
  );

  setText(
    'vBP',
    v.bp
  );

  setText(
    'vTree',
    v.tr
  );

  setText(
    'vAsset',
    v.asset
  );

  setText(
    'vTotal',
    v.total
  );


  document
    .getElementById(
      'vTotal'
    )
    .className =
      v.total
        ? 'bad'
        : 'ok';

}


/* ============================================================
   UI
   ============================================================ */

function updateUI(){

  const info =
    ZINFO[currentZ];


  const label =
    composite
      ? 'Composite view'
      : `Z ${
          currentZ > 0
            ? '+'
            : ''
        }${currentZ} — ${info[0]}`;


  document
    .getElementById(
      'zTitle'
    )
    .innerHTML =
      '<b>' +
      label +
      '</b>';


  document
    .getElementById(
      'zDesc'
    )
    .textContent =
      composite
        ? 'All layers rendered together'
        : info[1];


  document
    .getElementById(
      'detailTitle'
    )
    .textContent =
      label;


  document
    .getElementById(
      'composite'
    )
    .textContent =
      composite
        ? 'Return to Z Slice'
        : 'Show Composite';


  document
    .querySelectorAll(
      '.zbtn'
    )
    .forEach(
      b =>
        b.classList.toggle(
          'active',
          !composite &&
          Number(
            b.dataset.z
          ) === currentZ
        )
    );

}


function render(){

  updateUI();

  if(!state){
    return;
  }

  renderOverview();

  renderDetail();

}


function cycle(d){

  composite =
    false;


  currentZ =
    ZS[
      clamp(
        ZS.indexOf(
          currentZ
        ) +
        d,
        0,
        ZS.length-1
      )
    ];


  render();

}




function wireControls(){

/* ============================================================
   CONTROLS
   ============================================================ */

document
  .getElementById(
    'generate'
  )
  .onclick =
    () => {

      const statusEl =
        document.getElementById(
          'appStatus'
        );


      if(statusEl){

        statusEl.textContent =
          'Generating…';

        statusEl.style.color =
          '#9da8ae';

      }


      requestAnimationFrame(
        () => {

          try{

            generate();


            if(statusEl){

              statusEl.textContent =
                'Ready — new layout generated.';

            }

          }
          catch(err){

            console.error(err);


            if(statusEl){

              statusEl.textContent =
                'Generator error: ' +
                (
                  err &&
                  err.message
                    ? err.message
                    : String(err)
                );


              statusEl.style.color =
                '#ff8989';

            }

          }

        }
      );

    };


document
  .getElementById(
    'zDown'
  )
  .onclick =
    () =>
      cycle(-1);


document
  .getElementById(
    'zUp'
  )
  .onclick =
    () =>
      cycle(1);


document
  .getElementById(
    'composite'
  )
  .onclick =
    () => {

      composite =
        !composite;

      render();

    };


document
  .querySelectorAll(
    '.zbtn'
  )
  .forEach(
    b =>
      b.onclick =
        () => {

          currentZ =
            Number(
              b.dataset.z
            );

          composite =
            false;

          render();

        }
  );


document
  .getElementById(
    'zoomIn'
  )
  .onclick =
    () => {

      parentSpan =
        Math.max(
          2,
          parentSpan-2
        );

      render();

    };


document
  .getElementById(
    'zoomOut'
  )
  .onclick =
    () => {

      parentSpan =
        Math.min(
          20,
          parentSpan+2
        );

      render();

    };


[
  'reservations',
  'placementGrid',
  'parentGrid',
  'minorGrid',
  'microGrid',
  'intersectionLabels',
  'squareView'
]
.forEach(
  id =>
    document
      .getElementById(id)
      .onchange =
        renderDetail
);


/* ============================================================
   OVERVIEW POINTER
   ============================================================ */

overview.onpointerdown =
  e => {

    const r =
      overview
        .getBoundingClientRect();


    const px =
      clamp(
        Math.floor(
          (
            e.clientX -
            r.left
          ) /
          r.width *
          P
        ),
        0,
        99
      );


    const py =
      clamp(
        Math.floor(
          (
            e.clientY -
            r.top
          ) /
          r.height *
          P
        ),
        0,
        99
      );


    selected = {

      x:
        px *
        MINOR_PER_PARENT +
        MINOR_PER_PARENT/2,

      y:
        py *
        MINOR_PER_PARENT +
        MINOR_PER_PARENT/2

    };


    render();

  };


/* ============================================================
   DETAIL POINTER
   ============================================================ */

detail.onpointerdown =
  e => {

    const r =
      detail
        .getBoundingClientRect();


    const b =
      bounds();


    selected = {

      x:
        clamp(
          Math.floor(
            b.sx +
            (
              e.clientX -
              r.left
            ) /
            r.width *
            b.span
          ),
          0,
          R-1
        ),

      y:
        clamp(
          Math.floor(
            b.sy +
            (
              e.clientY -
              r.top
            ) /
            r.height *
            b.span
          ),
          0,
          R-1
        )

    };


    render();

  };



}
