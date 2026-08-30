/* ============================================================
   VALIDATION
   ============================================================ */

'use strict';

function validate(){

  let br = 0;
  let bp = 0;
  let tr = 0;
  let asset = 0;


  for(
    let y=0;
    y<C;
    y++
  ){

    for(
      let x=0;
      x<C;
      x++
    ){

      const k =
        ci(x,y);


      if(
        state.build[k] &&
        state.road[k]
      ){
        br++;
      }


      if(
        state.build[k] &&
        state.park[k]
      ){
        bp++;
      }

    }

  }


  for(
    const q of
    state.trees
  ){

    if(
      state.road[
        ci(q.x,q.y)
      ] ||
      state.build[
        ci(q.x,q.y)
      ]
    ){
      tr++;
    }

  }


  const testFoot =
    q => {

      const w =
        q.w || 1;

      const h =
        q.h || 1;


      for(
        let yy=q.y;
        yy<q.y+h;
        yy++
      ){

        for(
          let xx=q.x;
          xx<q.x+w;
          xx++
        ){

          if(
            !inside(xx,yy)
          ){
            return true;
          }


          const k =
            ci(xx,yy);


          if(
            state.road[k] ||
            state.build[k] ||
            state.park[k] === WATER
          ){

            return true;

          }

        }

      }


      return false;

    };


  for(
    const q of
    [
      ...state.benches,
      ...state.playgrounds,
      ...state.pavilions,
      ...state.facilities
    ]
  ){

    if(
      testFoot(q)
    ){
      asset++;
    }

  }


  for(
    const q of
    state.buses
  ){

    if(
      !inside(
        q.x,
        q.y
      ) ||
      state.build[
        ci(q.x,q.y)
      ] ||
      state.park[
        ci(q.x,q.y)
      ] === WATER
    ){
      asset++;
    }

  }


  for(
    const q of
    state.entrances
  ){

    if(
      !inside(
        q.x,
        q.y
      ) ||
      state.road[
        ci(q.x,q.y)
      ] ||
      state.build[
        ci(q.x,q.y)
      ]
    ){
      asset++;
    }

  }


  return {

    br,
    bp,
    tr,
    asset,

    total:
      br +
      bp +
      tr +
      asset

  };

}


/* ============================================================
   STATISTICS
   ============================================================ */

