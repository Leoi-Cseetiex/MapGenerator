/* ============================================================
   RENDER SCENE: LAYER COMPOSITION, DETAIL + OVERVIEW CANVASES
   ============================================================ */

'use strict';

function renderLayer(
  z,
  ctx,
  b,
  solid=false,
  color=null
){

  ctx.save();


  /* ----------------------------------------------------------
     Z 0 TERRAIN
     ---------------------------------------------------------- */

  if(z === 0){

    for(
      let y=b.cy0;
      y<b.cy1;
      y++
    ){

      for(
        let x=b.cx0;
        x<b.cx1;
        x++
      ){

        const pv =
          state.park[
            ci(x,y)
          ];


        if(!pv){
          continue;
        }


        const rx =
          (
            x*SUB -
            b.sx
          ) *
          b.scale;


        const ry =
          (
            y*SUB -
            b.sy
          ) *
          b.scale;


        const rs =
          SUB *
          b.scale +
          .5;


        ctx.fillStyle =
          solid
            ? color
            : pv === GRASS
              ? palette.grass
              : pv === PATH
                ? palette.path
                : pv === WATER
                  ? palette.water
                  : palette.plaza;


        ctx.fillRect(
          rx,
          ry,
          rs,
          rs
        );


        if(
          !solid &&
          b.scale > .7
        ){

          if(
            pv === GRASS &&
            (
              (
                x*31 +
                y*17
              ) %
              5 ===
              0
            )
          ){

            ctx.fillStyle =
              palette.grass3;


            ctx.fillRect(

              rx +
              rs*.25,

              ry +
              rs*.35,

              Math.max(
                1,
                b.scale*.5
              ),

              Math.max(
                1,
                b.scale*.5
              )

            );

          }


          if(
            pv === PATH
          ){

            ctx.strokeStyle =
              palette.pathEdge;


            ctx.lineWidth =
              Math.max(
                .5,
                b.scale*.35
              );


            ctx.strokeRect(

              rx+.4,
              ry+.4,

              Math.max(
                0,
                rs-.8
              ),

              Math.max(
                0,
                rs-.8
              )

            );

          }


          if(
            pv === PLAZA
          ){

            ctx.strokeStyle =
              palette.plazaJoint;


            ctx.lineWidth =
              Math.max(
                .45,
                b.scale*.3
              );


            ctx.beginPath();


            ctx.moveTo(
              rx,
              ry+rs*.5
            );


            ctx.lineTo(
              rx+rs,
              ry+rs*.5
            );


            ctx.moveTo(
              rx+rs*.5,
              ry
            );


            ctx.lineTo(
              rx+rs*.5,
              ry+rs
            );


            ctx.stroke();

          }


          if(
            pv === WATER
          ){

            ctx.strokeStyle =
              palette.waterEdge;


            ctx.lineWidth =
              Math.max(
                .55,
                b.scale*.4
              );


            ctx.strokeRect(

              rx+.3,
              ry+.3,

              Math.max(
                0,
                rs-.6
              ),

              Math.max(
                0,
                rs-.6
              )

            );


            if(
              (x+y)%2 === 0
            ){

              ctx.strokeStyle =
                palette.waterHi;


              ctx.beginPath();


              ctx.moveTo(
                rx+rs*.18,
                ry+rs*.55
              );


              ctx.lineTo(
                rx+rs*.72,
                ry+rs*.55
              );


              ctx.stroke();

            }

          }

        }

      }

    }

  }


  /* ----------------------------------------------------------
     Z +1 ROADS
     ---------------------------------------------------------- */

  if(z === 1){

    for(
      const r of
      state.roads
    ){

      if(
        r.type !== ALLEY
      ){

        strokeRoute(
          ctx,
          r,
          b,
          r.widthPx+10,
          solid
            ? color
            : palette.sidewalk
        );

      }


      strokeRoute(
        ctx,
        r,
        b,
        r.type === ALLEY
          ? r.widthPx
          : r.widthPx+2,
        solid
          ? color
          : r.type === ALLEY
            ? palette.alley
            : palette.curb
      );

    }


    for(
      const r of
      state.roads
    ){

      strokeRoute(
        ctx,
        r,
        b,
        r.widthPx,
        solid
          ? color
          : r.type === ARTERIAL
            ? palette.road
            : r.type === LOCAL
              ? palette.local
              : palette.alley
      );

    }


    if(!solid){

      mc.clearRect(
        0,
        0,
        V,
        V
      );


      for(
        const r of
        state.roads
      ){

        if(
          r.type === ARTERIAL
        ){

          strokeRoute(
            mc,
            r,
            b,
            1,
            palette.white,
            [],
            r.widthPx/2-2
          );


          strokeRoute(
            mc,
            r,
            b,
            1,
            palette.white,
            [],
            -r.widthPx/2+2
          );


          strokeRoute(
            mc,
            r,
            b,
            1,
            palette.white,
            [10,10],
            0
          );


          if(
            r.widthPx >= 28
          ){

            strokeRoute(
              mc,
              r,
              b,
              1,
              palette.white,
              [12,18],
              7
            );


            strokeRoute(
              mc,
              r,
              b,
              1,
              palette.white,
              [12,18],
              -7
            );

          }

        }
        else if(
          r.type === LOCAL &&
          r.widthPx >= 14
        ){

          strokeRoute(
            mc,
            r,
            b,
            1,
            palette.white,
            [10,10],
            0
          );

        }

      }


      mc.save();


      mc.globalCompositeOperation =
        'destination-out';


      for(
        const n of
        state.intersections
      ){

        const p =
          worldPoint(
            n,
            b
          );


        const rad =
          (
            n.radius +
            3
          ) *
          b.scale;


        mc.beginPath();


        mc.arc(
          p.x,
          p.y,
          rad,
          0,
          Math.PI*2
        );


        mc.fill();

      }


      mc.restore();


      ctx.drawImage(
        marks,
        0,
        0
      );

    }


    for(
      const n of
      state.intersections
    ){

      drawIntersection(
        ctx,
        n,
        b,
        solid,
        color
      );

    }

  }


  /* ----------------------------------------------------------
     Z +2 ASSETS
     ---------------------------------------------------------- */

  if(z === 2){

    for(
      const q of
      state.buildings
    ){

      drawBuildingDetailed(
        ctx,
        q,
        b,
        solid,
        color
      );

    }


    for(
      const q of
      state.trees
    ){

      drawTreeDetailed(
        ctx,
        q,
        b,
        solid,
        color
      );

    }


    for(
      const q of
      state.benches
    ){

      const p =
        worldPoint(
          q,
          b
        );


      const s =
        b.scale;


      ctx.fillStyle =
        solid
          ? color
          : palette.bench;


      ctx.fillRect(
        p.x-2*s,
        p.y-s,
        4*s,
        2*s
      );


      if(!solid){

        ctx.strokeStyle =
          palette.wall;


        ctx.beginPath();


        ctx.moveTo(
          p.x-1.7*s,
          p.y-.25*s
        );


        ctx.lineTo(
          p.x+1.7*s,
          p.y-.25*s
        );


        ctx.moveTo(
          p.x-1.4*s,
          p.y+s
        );


        ctx.lineTo(
          p.x-1.4*s,
          p.y+1.7*s
        );


        ctx.moveTo(
          p.x+1.4*s,
          p.y+s
        );


        ctx.lineTo(
          p.x+1.4*s,
          p.y+1.7*s
        );


        ctx.stroke();

      }

    }


    for(
      const q of
      state.playgrounds
    ){

      const x =
        (
          q.x*SUB -
          b.sx
        ) *
        b.scale;


      const y =
        (
          q.y*SUB -
          b.sy
        ) *
        b.scale;


      const w =
        q.w *
        SUB *
        b.scale;


      const h =
        q.h *
        SUB *
        b.scale;


      ctx.fillStyle =
        solid
          ? color
          : palette.play;


      ctx.fillRect(
        x,
        y,
        w,
        h
      );


      if(!solid){

        ctx.strokeStyle =
          palette.wall;


        ctx.strokeRect(
          x,
          y,
          w,
          h
        );


        ctx.strokeStyle =
          palette.play2;


        ctx.lineWidth =
          Math.max(
            1,
            b.scale
          );


        ctx.beginPath();


        ctx.moveTo(
          x+w*.15,
          y+h*.72
        );


        ctx.lineTo(
          x+w*.43,
          y+h*.22
        );


        ctx.lineTo(
          x+w*.68,
          y+h*.72
        );


        ctx.stroke();


        ctx.fillStyle =
          palette.play2;


        ctx.beginPath();


        ctx.arc(
          x+w*.75,
          y+h*.35,
          Math.max(
            1,
            1.2*b.scale
          ),
          0,
          Math.PI*2
        );


        ctx.fill();

      }

    }


    for(
      const q of
      state.pavilions
    ){

      const x =
        (
          q.x*SUB -
          b.sx
        ) *
        b.scale;


      const y =
        (
          q.y*SUB -
          b.sy
        ) *
        b.scale;


      const w =
        q.w *
        SUB *
        b.scale;


      const h =
        q.h *
        SUB *
        b.scale;


      ctx.fillStyle =
        solid
          ? color
          : palette.pavilion;


      ctx.fillRect(
        x,
        y,
        w,
        h
      );


      if(!solid){

        ctx.strokeStyle =
          palette.wall;


        ctx.beginPath();


        ctx.moveTo(
          x,
          y+h*.38
        );


        ctx.lineTo(
          x+w/2,
          y
        );


        ctx.lineTo(
          x+w,
          y+h*.38
        );


        ctx.stroke();


        for(
          const px of
          [
            x+w*.18,
            x+w*.82
          ]
        ){

          ctx.beginPath();


          ctx.moveTo(
            px,
            y+h*.35
          );


          ctx.lineTo(
            px,
            y+h*.9
          );


          ctx.stroke();

        }

      }

    }


    for(
      const q of
      state.facilities
    ){

      const x =
        (
          q.x*SUB -
          b.sx
        ) *
        b.scale;


      const y =
        (
          q.y*SUB -
          b.sy
        ) *
        b.scale;


      const w =
        q.w *
        SUB *
        b.scale;


      const h =
        q.h *
        SUB *
        b.scale;


      ctx.fillStyle =
        solid
          ? color
          : palette.facility;


      ctx.fillRect(
        x,
        y,
        w,
        h
      );


      if(!solid){

        ctx.strokeStyle =
          palette.wall;


        ctx.strokeRect(
          x,
          y,
          w,
          h
        );


        ctx.fillStyle =
          palette.window;


        ctx.fillRect(
          x+w*.18,
          y+h*.22,
          w*.22,
          h*.18
        );


        ctx.fillStyle =
          palette.wall;


        ctx.fillRect(
          x+w*.62,
          y+h*.55,
          w*.18,
          h*.45
        );

      }

    }


    for(
      const q of
      state.lights
    ){

      const p =
        worldPoint(
          q,
          b
        );


      const s =
        b.scale;


      ctx.strokeStyle =
        solid
          ? color
          : palette.metal;


      ctx.lineWidth =
        Math.max(
          1,
          .7*s
        );


      ctx.beginPath();


      ctx.moveTo(
        p.x,
        p.y+2.4*s
      );


      ctx.lineTo(
        p.x,
        p.y-2.2*s
      );


      ctx.stroke();


      ctx.fillStyle =
        solid
          ? color
          : palette.light;


      ctx.beginPath();


      ctx.arc(
        p.x,
        p.y-2.6*s,
        Math.max(
          1,
          .9*s
        ),
        0,
        Math.PI*2
      );


      ctx.fill();

    }


    for(
      const q of
      state.bins
    ){

      const p =
        worldPoint(
          q,
          b
        );


      const s =
        b.scale;


      ctx.fillStyle =
        solid
          ? color
          : palette.bin;


      ctx.fillRect(
        p.x-1.2*s,
        p.y-1.5*s,
        2.4*s,
        3*s
      );


      if(!solid){

        ctx.strokeStyle =
          palette.wall;


        ctx.strokeRect(
          p.x-1.2*s,
          p.y-1.5*s,
          2.4*s,
          3*s
        );

      }

    }


    for(
      const q of
      state.buses
    ){

      drawBusStop(
        ctx,
        q,
        b,
        solid,
        color
      );

    }


    for(
      const q of
      state.entrances
    ){

      drawEntranceDetailed(
        ctx,
        q,
        b,
        solid,
        color
      );

    }

  }


  /* ----------------------------------------------------------
     Z -2 RAIL
     ---------------------------------------------------------- */

  if(z === -2){

    for(
      const route of
      state.rails
    ){

      const rr = {
        points:route
      };


      strokeRoute(
        ctx,
        rr,
        b,
        8,
        solid
          ? color
          : palette.railBed
      );


      if(!solid){

        strokeRoute(
          ctx,
          rr,
          b,
          1,
          palette.rail,
          [],
          2
        );


        strokeRoute(
          ctx,
          rr,
          b,
          1,
          palette.rail,
          [],
          -2
        );


        ctx.strokeStyle =
          palette.sleeper;


        ctx.lineWidth =
          Math.max(
            .6,
            b.scale*.7
          );


        for(
          let i=1;
          i<route.length;
          i++
        ){

          const a =
            route[i-1];


          const c =
            route[i];


          const dx =
            c.x-a.x;


          const dy =
            c.y-a.y;


          const L =
            Math.max(
              1,
              Math.hypot(
                dx,
                dy
              )
            );


          const nx =
            -dy/L;


          const ny =
            dx/L;


          const steps =
            Math.floor(
              L/2
            );


          for(
            let j=1;
            j<steps;
            j++
          ){

            const t =
              j/steps;


            const p =
              worldPoint(
                {
                  x:
                    a.x +
                    dx*t,

                  y:
                    a.y +
                    dy*t
                },
                b
              );


            ctx.beginPath();


            ctx.moveTo(

              p.x -
              nx*4*b.scale,

              p.y -
              ny*4*b.scale

            );


            ctx.lineTo(

              p.x +
              nx*4*b.scale,

              p.y +
              ny*4*b.scale

            );


            ctx.stroke();

          }

        }

      }

    }

  }


  /* ----------------------------------------------------------
     Z -1 PLATFORMS
     ---------------------------------------------------------- */

  if(z === -1){

    for(
      const st of
      state.stations
    ){

      const p =
        worldPoint(
          st,
          b
        );


      const s =
        b.scale;


      ctx.strokeStyle =
        solid
          ? color
          : palette.platform;


      ctx.lineWidth =
        5*s;


      ctx.beginPath();


      ctx.arc(
        p.x,
        p.y,
        7*s,
        0,
        Math.PI*2
      );


      ctx.stroke();


      if(!solid){

        ctx.strokeStyle =
          palette.platformEdge;


        ctx.lineWidth =
          Math.max(
            1,
            .8*s
          );


        ctx.beginPath();


        ctx.arc(
          p.x,
          p.y,
          9*s,
          0,
          Math.PI*2
        );


        ctx.stroke();


        ctx.fillStyle =
          palette.platform;


        ctx.fillRect(
          p.x-6*s,
          p.y-1.5*s,
          12*s,
          3*s
        );


        ctx.fillStyle =
          palette.white;


        ctx.fillRect(
          p.x-4*s,
          p.y-.35*s,
          8*s,
          .7*s
        );

      }

    }

  }


  ctx.restore();

}


/* ============================================================
   SILHOUETTES
   ============================================================ */

function silhouette(
  z,
  b,
  alpha
){

  tc.clearRect(
    0,
    0,
    V,
    V
  );


  renderLayer(
    z,
    tc,
    b,
    true,
    ZINFO[z][2]
  );


  dc.save();


  dc.globalAlpha =
    alpha;


  dc.drawImage(
    temp,
    0,
    0
  );


  dc.restore();

}


/* ============================================================
   DETAIL VIEW
   ============================================================ */

function squareColor(bits){

  if(bits & RES_INTERSECTION){
    return palette.junction;
  }

  if(bits & RES_ROAD){
    return palette.road;
  }

  if(bits & RES_STATION){
    return palette.platform;
  }

  if(bits & RES_ENTRANCE){
    return palette.entrance;
  }

  if(bits & RES_BUS){
    return palette.bus;
  }

  if(bits & RES_WATER){
    return palette.water;
  }

  if(bits & RES_PATH){
    return palette.path;
  }

  if(bits & RES_BUILD){
    return palette.building;
  }

  if(bits & RES_TREE){
    return palette.tree;
  }

  if(bits & RES_ASSET){
    return palette.pavilion;
  }

  return palette.bg;

}


function renderDetailSquares(b){

  for(
    let y=b.cy0;
    y<b.cy1;
    y++
  ){

    for(
      let x=b.cx0;
      x<b.cx1;
      x++
    ){

      dc.fillStyle =
        squareColor(
          state.reserve[
            ci(x,y)
          ]
        );


      dc.fillRect(

        (
          x*SUB -
          b.sx
        ) *
        b.scale,

        (
          y*SUB -
          b.sy
        ) *
        b.scale,

        SUB *
        b.scale,

        SUB *
        b.scale

      );

    }

  }

}


function renderDetail(){

  if(!state){
    return;
  }


  const b =
    bounds();


  dc.clearRect(
    0,
    0,
    V,
    V
  );


  dc.fillStyle =
    palette.bg;


  dc.fillRect(
    0,
    0,
    V,
    V
  );


  if(
    document
      .getElementById(
        'squareView'
      )
      .checked
  ){

    renderDetailSquares(b);

  }
  else if(composite){

    for(
      const z of ZS
    ){

      dc.save();


      dc.globalAlpha =
        z < 0
          ? .3
          : 1;


      renderLayer(
        z,
        dc,
        b,
        false
      );


      dc.restore();

    }

  }
  else{

    for(
      const z of ZS
    ){

      if(
        z < currentZ
      ){

        silhouette(
          z,
          b,
          1
        );

      }
      else if(
        z === currentZ
      ){

        renderLayer(
          z,
          dc,
          b,
          false
        );

      }
      else{

        silhouette(
          z,
          b,
          .24
        );

      }

    }

  }


  /* ----------------------------------------------------------
     RESERVATION OVERLAY
     ---------------------------------------------------------- */

  if(
    document
      .getElementById(
        'reservations'
      )
      .checked
  ){

    dc.save();


    dc.globalAlpha =
      .3;


    for(
      let y=b.cy0;
      y<b.cy1;
      y++
    ){

      for(
        let x=b.cx0;
        x<b.cx1;
        x++
      ){

        const bits =
          state.reserve[
            ci(x,y)
          ];


        if(!bits){
          continue;
        }


        dc.fillStyle =
          bits &
          RES_INTERSECTION
            ? palette.junction
            : bits &
              RES_ROAD_CLEAR
              ? palette.reserveRoad
              : bits &
                RES_BUILD_CLEAR
                ? palette.reserveBuild
                : palette.reserveAsset;


        dc.fillRect(

          (
            x*SUB -
            b.sx
          ) *
          b.scale,

          (
            y*SUB -
            b.sy
          ) *
          b.scale,

          SUB *
          b.scale,

          SUB *
          b.scale

        );

      }

    }


    dc.restore();

  }


  /* ----------------------------------------------------------
     PLACEMENT GRID
     ---------------------------------------------------------- */

  if(
    document
      .getElementById(
        'placementGrid'
      )
      .checked
  ){

    dc.strokeStyle =
      '#888';


    dc.globalAlpha =
      .25;


    dc.beginPath();


    for(
      let q=
        Math.ceil(
          b.sx/8
        )*8;
      q<=b.sx+b.span;
      q+=8
    ){

      const x =
        (q-b.sx) *
        b.scale;


      dc.moveTo(
        x,
        0
      );


      dc.lineTo(
        x,
        V
      );

    }


    for(
      let q=
        Math.ceil(
          b.sy/8
        )*8;
      q<=b.sy+b.span;
      q+=8
    ){

      const y =
        (q-b.sy) *
        b.scale;


      dc.moveTo(
        0,
        y
      );


      dc.lineTo(
        V,
        y
      );

    }


    dc.stroke();


    dc.globalAlpha =
      1;

  }


  /* ----------------------------------------------------------
     PARENT GRID
     16 × 16 minor squares per parent
     ---------------------------------------------------------- */

  if(
    document
      .getElementById(
        'parentGrid'
      )
      .checked
  ){

    dc.strokeStyle =
      '#333';


    dc.globalAlpha =
      .35;


    dc.beginPath();


    for(
      let q=
        Math.ceil(
          b.sx /
          MINOR_PER_PARENT
        ) *
        MINOR_PER_PARENT;
      q<=b.sx+b.span;
      q+=MINOR_PER_PARENT
    ){

      const x =
        (q-b.sx) *
        b.scale;


      dc.moveTo(
        x,
        0
      );


      dc.lineTo(
        x,
        V
      );

    }


    for(
      let q=
        Math.ceil(
          b.sy /
          MINOR_PER_PARENT
        ) *
        MINOR_PER_PARENT;
      q<=b.sy+b.span;
      q+=MINOR_PER_PARENT
    ){

      const y =
        (q-b.sy) *
        b.scale;


      dc.moveTo(
        0,
        y
      );


      dc.lineTo(
        V,
        y
      );

    }


    dc.stroke();


    dc.globalAlpha =
      1;

  }


  /* ----------------------------------------------------------
     MINOR GRID
     ---------------------------------------------------------- */

  if(
    document
      .getElementById(
        'minorGrid'
      )
      .checked &&
    b.scale >= 3
  ){

    dc.strokeStyle =
      '#28313a';


    dc.globalAlpha =
      .22;


    dc.lineWidth =
      1;


    dc.beginPath();


    for(
      let q=
        Math.ceil(
          b.sx
        );
      q<=b.sx+b.span;
      q+=1
    ){

      const x =
        (q-b.sx) *
        b.scale;


      dc.moveTo(
        x,
        0
      );


      dc.lineTo(
        x,
        V
      );

    }


    for(
      let q=
        Math.ceil(
          b.sy
        );
      q<=b.sy+b.span;
      q+=1
    ){

      const y =
        (q-b.sy) *
        b.scale;


      dc.moveTo(
        0,
        y
      );


      dc.lineTo(
        V,
        y
      );

    }


    dc.stroke();


    dc.globalAlpha =
      1;

  }


  /* ----------------------------------------------------------
     MICRO GRID
     4 × 4 micro squares per minor square
     ---------------------------------------------------------- */

  if(
    document
      .getElementById(
        'microGrid'
      )
      .checked &&
    b.scale /
    MICRO_PER_MINOR
    >=
    1.25
  ){

    dc.strokeStyle =
      '#506070';


    dc.globalAlpha =
      .16;


    dc.lineWidth =
      1;


    dc.beginPath();


    const step =
      1 /
      MICRO_PER_MINOR;


    for(
      let q=
        Math.ceil(
          b.sx *
          MICRO_PER_MINOR
        ) /
        MICRO_PER_MINOR;
      q<=b.sx+b.span+1e-9;
      q+=step
    ){

      if(
        Math.abs(
          q -
          Math.round(q)
        ) <
        1e-7
      ){
        continue;
      }


      const x =
        (q-b.sx) *
        b.scale;


      dc.moveTo(
        x,
        0
      );


      dc.lineTo(
        x,
        V
      );

    }


    for(
      let q=
        Math.ceil(
          b.sy *
          MICRO_PER_MINOR
        ) /
        MICRO_PER_MINOR;
      q<=b.sy+b.span+1e-9;
      q+=step
    ){

      if(
        Math.abs(
          q -
          Math.round(q)
        ) <
        1e-7
      ){
        continue;
      }


      const y =
        (q-b.sy) *
        b.scale;


      dc.moveTo(
        0,
        y
      );


      dc.lineTo(
        V,
        y
      );

    }


    dc.stroke();


    dc.globalAlpha =
      1;

  }


  document
    .getElementById(
      'detailLabel'
    )
    .textContent =
      `${parentSpan}×${parentSpan} parents • ` +
      `each parent 16×16 minor • ` +
      `each minor 4×4 micro • ` +
      `view ${b.span}×${b.span} minor / ` +
      `${b.span*MICRO_PER_MINOR}×${b.span*MICRO_PER_MINOR} micro • ` +
      `world ${R}×${R} minor / ${MICRO_R}×${MICRO_R} micro`;

}


/* ============================================================
   OVERVIEW
   ============================================================ */

function renderOverview(){

  if(!state){
    return;
  }


  oc.clearRect(
    0,
    0,
    V,
    V
  );


  oc.fillStyle =
    palette.bg;


  oc.fillRect(
    0,
    0,
    V,
    V
  );


  for(
    let py=0;
    py<P;
    py++
  ){

    for(
      let px=0;
      px<P;
      px++
    ){

      const z =
        state.zone[
          pi(px,py)
        ];


      if(z){

        oc.globalAlpha =
          .13;


        oc.fillStyle =
          z === 2
            ? palette.city
            : palette.urban;


        oc.fillRect(
          px*8,
          py*8,
          8,
          8
        );


        oc.globalAlpha =
          1;

      }


      let park = false;
      let road = false;
      let bld = false;


      for(
        let sy=0;
        sy<2;
        sy++
      ){

        for(
          let sx=0;
          sx<2;
          sx++
        ){

          const k =
            ci(
              px*2+sx,
              py*2+sy
            );


          park ||= !!state.park[k];

          road ||= !!state.road[k];

          bld ||= !!state.build[k];

        }

      }


      if(park){

        oc.fillStyle =
          palette.grass;


        oc.fillRect(
          px*8,
          py*8,
          8,
          8
        );

      }


      if(road){

        oc.fillStyle =
          palette.road;


        oc.fillRect(
          px*8,
          py*8,
          8,
          8
        );

      }


      if(bld){

        oc.fillStyle =
          palette.building;


        oc.fillRect(
          px*8+1,
          py*8+1,
          6,
          6
        );

      }

    }

  }


  for(
    const n of
    state.intersections
  ){

    oc.fillStyle =
      palette.junction;


    oc.beginPath();


    oc.arc(
      n.x*4,
      n.y*4,
      2,
      0,
      Math.PI*2
    );


    oc.fill();

  }


  const px =
    Math.floor(
      selected.x /
      MINOR_PER_PARENT
    );


  const py =
    Math.floor(
      selected.y /
      MINOR_PER_PARENT
    );


  const sx =
    clamp(
      px -
      Math.floor(
        parentSpan/2
      ),
      0,
      P-parentSpan
    );


  const sy =
    clamp(
      py -
      Math.floor(
        parentSpan/2
      ),
      0,
      P-parentSpan
    );


  oc.strokeStyle =
    palette.accent;


  oc.lineWidth =
    3;


  oc.strokeRect(
    sx*8+1,
    sy*8+1,
    parentSpan*8-2,
    parentSpan*8-2
  );

}


/* ============================================================
   VALIDATION
   ============================================================ */

