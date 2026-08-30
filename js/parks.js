/* ============================================================
   PARKS AND PARK ASSETS
   ============================================================ */

'use strict';

function generateParks(s){

  const r = s.rng;

  let tries = 0;


  while(
    s.parks.length < 10 &&
    tries++ < 220
  ){

    const pcx =
      7 +
      Math.floor(
        r()*86
      );

    const pcy =
      7 +
      Math.floor(
        r()*86
      );


    if(
      !s.zone[
        pi(pcx,pcy)
      ]
    ){
      continue;
    }


    const rx =
      2 +
      Math.floor(
        r()*5
      );

    const ry =
      2 +
      Math.floor(
        r()*5
      );


    const cells = [];


    for(
      let py=pcy-ry;
      py<=pcy+ry;
      py++
    ){

      for(
        let px=pcx-rx;
        px<=pcx+rx;
        px++
      ){

        if(
          px < 1 ||
          py < 1 ||
          px >= 99 ||
          py >= 99
        ){
          continue;
        }


        const nx =
          (px-pcx)/rx;

        const ny =
          (py-pcy)/ry;


        if(
          nx*nx +
          ny*ny +
          (r()*2-1)*.18
          >=
          1
        ){
          continue;
        }


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

            const x =
              px*2+sx;

            const y =
              py*2+sy;

            const k =
              ci(x,y);


            if(
              !(
                s.reserve[k] &
                (
                  RES_ROAD |
                  RES_ROAD_CLEAR |
                  RES_INTERSECTION
                )
              )
            ){

              s.park[k] =
                GRASS;

              cells.push({
                x,
                y
              });

            }

          }

        }

      }

    }


    if(
      cells.length < 24
    ){
      continue;
    }


    const set =
      new Set(
        cells.map(
          q =>
            q.x +
            ',' +
            q.y
        )
      );


    const boundary =
      cells.filter(
        q =>
          [
            [1,0],
            [-1,0],
            [0,1],
            [0,-1]
          ].some(
            d =>
              !set.has(
                (
                  q.x+d[0]
                ) +
                ',' +
                (
                  q.y+d[1]
                )
              )
          )
      );


    const candidates =
      boundary
        .map(
          q => ({
            q,
            road:
              nearestRoad(
                s,
                q.x,
                q.y,
                10
              )
          })
        )
        .filter(
          v => v.road
        )
        .sort(
          (a,b) =>
            a.road.d -
            b.road.d
        );


    const entrances = [];


    for(
      const v of
      candidates
    ){

      if(
        entrances.every(
          e =>
            Math.hypot(
              e.x-v.q.x,
              e.y-v.q.y
            ) > 5
        )
      ){

        entrances.push(
          v.q
        );


        if(
          entrances.length >=
          Math.min(
            3,
            1 +
            Math.floor(
              cells.length/70
            )
          )
        ){
          break;
        }

      }

    }


    if(
      !entrances.length
    ){

      entrances.push(
        boundary[0] ||
        cells[0]
      );

    }


    const centre =
      cells.reduce(
        (
          a,
          q
        ) => ({

          x:
            a.x +
            q.x/cells.length,

          y:
            a.y +
            q.y/cells.length

        }),
        {
          x:0,
          y:0
        }
      );


    centre.x =
      Math.round(
        centre.x
      );

    centre.y =
      Math.round(
        centre.y
      );


    if(
      !set.has(
        centre.x +
        ',' +
        centre.y
      )
    ){

      Object.assign(
        centre,
        cells[
          Math.floor(
            cells.length/2
          )
        ]
      );

    }


    const addPath =
      (a,b) => {

        for(
          const q of
          bres(
            a.x,
            a.y,
            b.x,
            b.y
          )
        ){

          const k =
            ci(
              q.x,
              q.y
            );


          if(
            set.has(
              q.x +
              ',' +
              q.y
            ) &&
            s.park[k] !== WATER
          ){

            s.park[k] =
              PATH;

            s.reserve[k] |=
              RES_PATH;

          }

        }

      };


    entrances.forEach(
      e =>
        addPath(
          e,
          centre
        )
    );


    const targets = [];


    for(
      let i=0;
      i<
      3 +
      Math.floor(
        r()*4
      );
      i++
    ){

      const q =
        cells[
          Math.floor(
            r()*cells.length
          )
        ];


      if(
        targets.every(
          t =>
            Math.hypot(
              t.x-q.x,
              t.y-q.y
            ) > 5
        )
      ){

        targets.push(q);

      }

    }


    targets.forEach(
      q =>
        addPath(
          centre,
          q
        )
    );


    if(
      cells.length > 80 &&
      targets.length >= 3
    ){

      addPath(
        targets[0],
        targets[1]
      );


      if(r() < .65){

        addPath(
          targets[1],
          targets[2]
        );

      }

    }


    if(
      cells.length > 75
    ){

      for(
        let yy=centre.y-1;
        yy<=centre.y+1;
        yy++
      ){

        for(
          let xx=centre.x-1;
          xx<=centre.x+1;
          xx++
        ){

          if(
            inside(xx,yy) &&
            set.has(
              xx +
              ',' +
              yy
            ) &&
            s.park[
              ci(xx,yy)
            ] !== WATER
          ){

            s.park[
              ci(xx,yy)
            ] =
              PLAZA;

            s.reserve[
              ci(xx,yy)
            ] |=
              RES_PATH;

          }

        }

      }

    }


    let pond = null;


    if(
      cells.length > 65 &&
      r() < .7
    ){

      for(
        let attempt=0;
        attempt<25 &&
        !pond;
        attempt++
      ){

        const q =
          cells[
            Math.floor(
              r()*cells.length
            )
          ];


        const rad =
          1 +
          Math.floor(
            r()*2
          );


        let ok = true;


        for(
          let y=q.y-rad;
          y<=q.y+rad;
          y++
        ){

          for(
            let x=q.x-rad;
            x<=q.x+rad;
            x++
          ){

            if(
              !inside(x,y) ||
              !set.has(
                x +
                ',' +
                y
              ) ||
              s.reserve[
                ci(x,y)
              ] &
              (
                RES_PATH |
                RES_ROAD |
                RES_ROAD_CLEAR |
                RES_INTERSECTION
              )
            ){

              ok = false;

            }

          }

        }


        if(ok){

          pond = {
            x:q.x,
            y:q.y,
            r:rad
          };


          for(
            let y=q.y-rad;
            y<=q.y+rad;
            y++
          ){

            for(
              let x=q.x-rad;
              x<=q.x+rad;
              x++
            ){

              if(
                Math.hypot(
                  x-q.x,
                  y-q.y
                ) <= rad
              ){

                s.park[
                  ci(x,y)
                ] =
                  WATER;

                s.reserve[
                  ci(x,y)
                ] |=
                  RES_WATER;

              }

            }

          }

        }

      }

    }


    s.parks.push({

      cells,
      boundary,
      entrances,
      centre,
      pond,

      benches:[],
      playgrounds:[],
      pavilions:[],
      facilities:[]

    });

  }

}


/* ============================================================
   PARK ASSETS
   ============================================================ */

function nearParkPath(
  s,
  x,
  y,
  r=1
){

  for(
    let yy=y-r;
    yy<=y+r;
    yy++
  ){

    for(
      let xx=x-r;
      xx<=x+r;
      xx++
    ){

      if(
        inside(xx,yy) &&
        s.park[
          ci(xx,yy)
        ] === PATH
      ){

        return true;

      }

    }

  }

  return false;

}


function placeParkAssets(s){

  const r = s.rng;


  const forbidden =
    RES_ROAD |
    RES_ROAD_CLEAR |
    RES_INTERSECTION |
    RES_WATER |
    RES_PATH |
    RES_BUILD |
    RES_BUILD_CLEAR |
    RES_TREE |
    RES_ASSET;


  for(
    const park of
    s.parks
  ){

    const grass =
      park.cells.filter(
        q =>
          s.park[
            ci(
              q.x,
              q.y
            )
          ] === GRASS
      );


    for(
      let cl=0;
      cl<
      1 +
      Math.floor(
        grass.length/50
      );
      cl++
    ){

      if(!grass.length){
        break;
      }


      const cc =
        grass[
          Math.floor(
            r()*grass.length
          )
        ];


      for(
        let n=0;
        n<
        3 +
        Math.floor(
          r()*5
        );
        n++
      ){

        const x =
          cc.x +
          Math.round(
            (r()*2-1)*4
          );

        const y =
          cc.y +
          Math.round(
            (r()*2-1)*4
          );


        if(
          !inside(x,y)
        ){
          continue;
        }


        const k =
          ci(x,y);


        if(
          s.park[k] !== GRASS ||
          s.reserve[k] &
          forbidden
        ){
          continue;
        }


        reserveDisk(
          s.reserve,
          x,
          y,
          1,
          RES_TREE
        );


        s.trees.push({
          x,
          y
        });

      }

    }


    const bc =
      grass.filter(
        q =>
          nearParkPath(
            s,
            q.x,
            q.y,
            1
          )
      );


    for(
      const q of bc
    ){

      if(
        park.benches.length >=
        Math.max(
          2,
          Math.floor(
            park.cells.length/35
          )
        ) ||
        r() > .12
      ){
        continue;
      }


      const k =
        ci(
          q.x,
          q.y
        );


      if(
        s.reserve[k] &
        forbidden
      ){
        continue;
      }


      if(
        park.benches.some(
          b =>
            Math.hypot(
              b.x-q.x,
              b.y-q.y
            ) < 4
        )
      ){
        continue;
      }


      s.reserve[k] |=
        RES_ASSET;


      park.benches.push(q);

      s.benches.push(q);

    }


    if(
      park.cells.length > 55
    ){

      for(
        let a=0;
        a<35;
        a++
      ){

        const q =
          grass[
            Math.floor(
              r()*grass.length
            )
          ];


        if(!q){
          break;
        }


        const w =
          3 +
          Math.floor(
            r()*2
          );

        const h =
          3 +
          Math.floor(
            r()*2
          );

        const x =
          q.x -
          Math.floor(w/2);

        const y =
          q.y -
          Math.floor(h/2);


        if(
          canRect(
            s.reserve,
            x,
            y,
            w,
            h,
            forbidden,
            1
          ) &&
          nearParkPath(
            s,
            q.x,
            q.y,
            3
          )
        ){

          const o = {
            x,
            y,
            w,
            h
          };


          reserveRect(
            s.reserve,
            x,
            y,
            w,
            h,
            RES_ASSET,
            1
          );


          park.playgrounds.push(o);

          s.playgrounds.push(o);

          break;

        }

      }

    }


    if(
      park.cells.length > 45
    ){

      for(
        let a=0;
        a<35;
        a++
      ){

        const q =
          grass[
            Math.floor(
              r()*grass.length
            )
          ];


        if(!q){
          break;
        }


        const x =
          q.x - 1;

        const y =
          q.y - 1;


        if(
          canRect(
            s.reserve,
            x,
            y,
            2,
            2,
            forbidden,
            1
          ) &&
          nearParkPath(
            s,
            q.x,
            q.y,
            2
          )
        ){

          const o = {
            x,
            y,
            w:2,
            h:2
          };


          reserveRect(
            s.reserve,
            x,
            y,
            2,
            2,
            RES_ASSET,
            1
          );


          park.pavilions.push(o);

          s.pavilions.push(o);

          break;

        }

      }

    }


    if(
      park.cells.length > 90 &&
      r() < .65
    ){

      for(
        let a=0;
        a<35;
        a++
      ){

        const q =
          park.boundary[
            Math.floor(
              r()*park.boundary.length
            )
          ];


        if(!q){
          break;
        }


        if(
          canRect(
            s.reserve,
            q.x,
            q.y,
            2,
            2,
            forbidden,
            1
          ) &&
          nearParkPath(
            s,
            q.x,
            q.y,
            3
          )
        ){

          const o = {

            x:q.x,
            y:q.y,

            w:2,
            h:2

          };


          reserveRect(
            s.reserve,
            q.x,
            q.y,
            2,
            2,
            RES_ASSET,
            1
          );


          park.facilities.push(o);

          s.facilities.push(o);

          break;

        }

      }

    }


    const pathSide =
      grass.filter(
        q =>
          nearParkPath(
            s,
            q.x,
            q.y,
            1
          )
      );


    for(
      const q of pathSide
    ){

      if(
        r() < .045 &&
        !(
          s.reserve[
            ci(
              q.x,
              q.y
            )
          ] &
          forbidden
        ) &&
        s.lights.every(
          a =>
            Math.hypot(
              a.x-q.x,
              a.y-q.y
            ) > 5
        )
      ){

        s.reserve[
          ci(
            q.x,
            q.y
          )
        ] |=
          RES_ASSET;


        s.lights.push({
          x:q.x,
          y:q.y
        });

      }
      else if(
        r() < .028 &&
        !(
          s.reserve[
            ci(
              q.x,
              q.y
            )
          ] &
          forbidden
        ) &&
        s.bins.every(
          a =>
            Math.hypot(
              a.x-q.x,
              a.y-q.y
            ) > 5
        )
      ){

        s.reserve[
          ci(
            q.x,
            q.y
          )
        ] |=
          RES_ASSET;


        s.bins.push({
          x:q.x,
          y:q.y
        });

      }

    }

  }

}


/* ============================================================
   MAIN GENERATOR
   ============================================================ */

